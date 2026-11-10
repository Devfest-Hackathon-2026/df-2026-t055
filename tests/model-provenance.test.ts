import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../apps/api/src/app.ts';
import { MemoryRepository, LocalStorage, seed, doc } from '../apps/api/src/adapters.ts';
import { configuredModel } from '../apps/generator/src/model.ts';
import { configuredCorrectionModel } from '../apps/generator/src/correction-model.ts';
import { configuredModelConfig } from '../apps/generator/src/model-config.ts';
import { createWorker } from '../apps/generator/src/worker.ts';

let root: string;
let video: Buffer;
before(async () => {
  root = await mkdtemp(join(tmpdir(), 't055-provenance-'));
  const path = join(root, 'source.mp4');
  await promisify(execFile)('ffmpeg', [
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'testsrc2=size=160x120:rate=10',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=440:sample_rate=8000',
    '-t',
    '1',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-y',
    path,
  ]);
  video = await readFile(path);
});
after(async () => {
  if (root) await rm(root, { recursive: true, force: true });
});

for (const provider of ['fake', 'vertex']) {
  test(`${provider}: 手順と参考メモのジョブが選択モデルID・prompt版を保存し、実行後も保つ`, async () => {
    const env = {
      MODEL_PROVIDER: provider,
      VERTEX_MODEL: 'gemini-provenance-test',
      VIDEO_BUCKET: 'test-private',
      GOOGLE_CLOUD_PROJECT: 'test-project',
      GOOGLE_CLOUD_LOCATION: 'test-location',
    };
    const expectedId = provider === 'vertex' ? env.VERTEX_MODEL : 'fake-fixture';
    const requests: any[] = [];
    // SDKの境界を置換し、有料生成・認証・ネットワーク通信を行わず実際の送信modelを検査する。
    const sdk =
      'data:text/javascript,' +
      encodeURIComponent(`
      export class GoogleGenAI {
        models = { generateContent: async (request) => globalThis.provenanceGenerate(request) };
      }
    `);
    const loader = registerHooks({
      resolve(specifier, context, nextResolve) {
        return specifier === '@google/genai'
          ? { url: sdk, shortCircuit: true }
          : nextResolve(specifier, context);
      },
    });
    Object.assign(globalThis, {
      provenanceGenerate: async (request: any) => {
        assert.equal(provider, 'vertex');
        requests.push(request);
        return {
          text: JSON.stringify(
            requests.length === 1
              ? {
                  schemaVersion: '1',
                  reviewFlags: [],
                  steps: [
                    {
                      stepId: 's1',
                      startMs: 0,
                      endMs: 900,
                      frameMs: 500,
                      observationCandidate: '手元',
                      speechCandidate: '折ります',
                      instructionDraft: '折る',
                      coachingDraft: '',
                      completionCheckDraft: '',
                      reviewFlags: [],
                    },
                  ],
                }
              : {
                  editSummary: '表現を修正',
                  nextDraftHint: '確認済みの表現を参考にする',
                  reviewFlags: [],
                },
          ),
        };
      },
    });
    try {
      const db = new MemoryRepository();
      seed(db);
      const storage = new LocalStorage(join(root, provider));
      await storage.put('source/video.mp4', video);
      db.put(
        'assets',
        doc('demo', {
          id: 'video',
          kind: 'video',
          objectPath: 'source/video.mp4',
          durationMs: 1000,
        }),
      );
      db.put(
        'tasks',
        doc('demo', {
          id: 'task',
          title: '合成動画',
          status: 'ready',
          videoAssetId: 'video',
        }),
      );
      const config = configuredModelConfig(env);
      const { app } = createApp({
        db,
        storage,
        modelId: config.modelId,
        promptVersion: config.promptVersion,
      });
      const run = createWorker(
        db,
        storage,
        configuredModel(env),
        30,
        configuredCorrectionModel(env),
      );
      async function request(path: string, method = 'GET', body?: unknown, token = 'staff') {
        const response = await app.fetch(
          new Request(`http://localhost/api/v1${path}`, {
            method,
            headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          }),
        );
        assert.equal(response.status, method === 'POST' ? 202 : 200);
        return (await response.json()) as any;
      }
      const { jobId, draftId } = await request('/tasks/task/generations', 'POST', {
        learnerId: 'a',
      });
      const queued = await request(`/jobs/${jobId}`);
      assert.equal(queued.status, 'queued');
      assert.equal(queued.modelId, expectedId);
      assert.equal(queued.promptVersion, '1');
      assert.equal((await request('/tasks')).tasks[0].generationJobs[0].modelId, expectedId);
      await run(jobId);
      const draft = db.get('drafts', draftId)!;
      assert.equal(draft.status, 'editing', db.get('generationJobs', jobId)!.errorCode);
      await request(`/drafts/${draftId}`, 'PATCH', {
        expectedRevision: draft.revision,
        editedSteps: draft.editedSteps.map((step: any, i: number) => ({
          ...step,
          text: i === 0 ? '赤い線にあわせる' : step.text,
        })),
        reviewChecks: draft.reviewChecks,
      });
      const context = db.all('generationJobs').find((j) => j.kind === 'correction_context')!;
      assert.ok(context);
      assert.equal(context.modelId, expectedId);
      assert.equal(context.promptVersion, '1');
      await run(context.id);
      for (const id of [jobId, context.id]) {
        const job = await request(`/jobs/${id}`);
        assert.equal(job.status, 'succeeded');
        assert.equal(job.modelId, expectedId);
        assert.equal(job.promptVersion, '1');
        assert.ok(db.get('generationJobs', id)!.durationMs >= 0);
        const denied = await app.fetch(
          new Request(`http://localhost/api/v1/jobs/${id}`, {
            headers: { authorization: 'Bearer learner-a' },
          }),
        );
        assert.equal(denied.status, 403);
      }
      assert.deepEqual(
        requests.map((r) => r.model),
        provider === 'vertex' ? [expectedId, expectedId] : [],
      );
    } finally {
      loader.deregister();
      Reflect.deleteProperty(globalThis, 'provenanceGenerate');
    }
  });
}
