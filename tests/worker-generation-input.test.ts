// 生成ワーカーがモデルへ表示方法と確認済みの説明方法を渡すことの回帰テスト。
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MemoryRepository, seed, doc, type Storage } from '../apps/api/src/adapters.ts';
import { createApp } from '../apps/api/src/app.ts';
import { createWorker } from '../apps/generator/src/worker.ts';
import type { ModelInput, VideoModel } from '../apps/generator/src/model.ts';

class TestStorage implements Storage {
  data = new Map<string, Buffer>();
  async put(p: string, b: Buffer) {
    this.data.set(p, Buffer.from(b));
  }
  async get(p: string) {
    const b = this.data.get(p);
    if (!b) throw Error('NOT_FOUND');
    return Buffer.from(b);
  }
  async open(p: string) {
    return new Response(new Uint8Array(await this.get(p))).body!;
  }
  async copy(a: string, b: string) {
    await this.put(b, await this.get(a));
  }
}

let video: Buffer;
before(async () => {
  const dir = await mkdtemp(join(tmpdir(), 't055-worker-input-'));
  try {
    const p = join(dir, 'fixture.mp4');
    await exec('ffmpeg', [
      '-v',
      'error',
      '-f',
      'lavfi',
      '-i',
      'testsrc2=size=160x120:rate=2',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:sample_rate=8000',
      '-t',
      '12',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-y',
      p,
    ]);
    video = await readFile(p);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

const proposal = {
  schemaVersion: '1',
  steps: [
    {
      stepId: 's1',
      startMs: 0,
      endMs: 1000,
      frameMs: 500,
      observationCandidate: '',
      speechCandidate: '声',
      instructionDraft: 'タオルを折ります',
      coachingDraft: '',
      completionCheckDraft: '',
      reviewFlags: [],
    },
  ],
  reviewFlags: [],
};

async function runOnce(options: { displayMode?: string; confirmedGuidance?: string[] }) {
  const db = new MemoryRepository();
  seed(db);
  const storage = new TestStorage();
  await storage.put('source/video.mp4', video);
  let captured: ModelInput | undefined;
  const model: VideoModel = {
    async generate(input) {
      captured = input;
      return proposal;
    },
  };
  const run = createWorker(db, storage, model, 30);
  const learner = db.get('learners', 'a')!;
  db.put('learners', { ...learner, confirmedGuidance: options.confirmedGuidance });
  db.put('tasks', doc('demo', { id: 'task', videoAssetId: 'video' }));
  db.put(
    'assets',
    doc('demo', { id: 'video', kind: 'video', durationMs: 12000, objectPath: 'source/video.mp4' }),
  );
  const draft: Record<string, unknown> = {
    id: 'draft',
    taskId: 'task',
    learnerId: 'a',
    status: 'generating',
    revision: 0,
  };
  if (options.displayMode !== undefined) draft.displayMode = options.displayMode;
  db.put('drafts', doc('demo', draft));
  db.put(
    'generationJobs',
    doc('demo', {
      id: 'job',
      taskId: 'task',
      draftId: 'draft',
      status: 'queued',
      attempt: 0,
      budgetUsed: 1,
      modelId: 'stub',
      promptVersion: '1',
    }),
  );
  await run('job');
  return { db, captured };
}

test('下書きの表示方法と本人の確認済み説明方法をモデルへ渡す', async () => {
  const { db, captured } = await runOnce({
    displayMode: 'photo_only',
    confirmedGuidance: ['赤い線を目印にする'],
  });
  assert.equal(captured?.displayMode, 'photo_only');
  assert.deepEqual(captured?.confirmedGuidance, ['赤い線を目印にする']);
  assert.equal(db.get('generationJobs', 'job')!.status, 'succeeded');
  assert.equal(db.get('drafts', 'draft')!.status, 'editing');
});

test('未設定の下書きは写真と短文・説明方法なしで生成する', async () => {
  const { captured } = await runOnce({});
  assert.equal(captured?.displayMode, 'photo_text');
  assert.deepEqual(captured?.confirmedGuidance, []);
});

for (const confirmed of [true, false]) {
  test(`履歴0件の初回生成は受付時の${confirmed ? '確認済み設定' : '未確認項目の既定値'}をリース切れの再配送でも使う`, async () => {
    const db = new MemoryRepository();
    seed(db);
    const storage = new TestStorage();
    const { app } = createApp({ db, storage });
    async function request(path: string, body: unknown, method = 'POST') {
      const response = await app.fetch(
        new Request(`http://localhost/api/v1${path}`, {
          method,
          headers: {
            authorization: 'Bearer staff',
            ...(body instanceof FormData ? {} : { 'content-type': 'application/json' }),
          },
          body: body instanceof FormData ? body : JSON.stringify(body),
        }),
      );
      assert.ok(response.ok, `${method} ${path}: ${response.status}`);
      return response.json();
    }
    const learner = await request('/learners', {
      displayName: '架空のCさん',
      ...(confirmed
        ? {
            preferences: {
              sentenceLength: 17,
              splitHints: '赤い線で区切る',
              displayMode: 'photo_only',
            },
            confirmedGuidance: ['赤い線を目印にする'],
          }
        : {}),
    });
    const { taskId } = await request('/tasks', { title: 'タオル折り' });
    const form = new FormData();
    form.append('video', new Blob([new Uint8Array(video)], { type: 'video/mp4' }), 'fixture.mp4');
    await request(`/tasks/${taskId}/video`, form);
    assert.equal(db.all('draftCorrections').length, 0);
    const { jobId, draftId } = await request(`/tasks/${taskId}/generations`, {
      learnerId: learner.learnerId,
    });
    assert.equal(db.get('generationJobs', jobId)!.status, 'queued');

    const expectedPreferences = {
      sentenceLength: confirmed ? 17 : 40,
      splitHints: confirmed ? '赤い線で区切る' : '',
      audioGuidance: false,
    };
    const expectedDisplayMode = confirmed ? 'photo_only' : 'photo_text';
    const expectedGuidance = confirmed ? ['赤い線を目印にする'] : [];
    const captured: ModelInput[] = [];
    const run = createWorker(
      db,
      storage,
      {
        async generate(input) {
          captured.push(input);
          if (captured.length === 1) {
            // 結果保存前にリースを失った実行を再現し、次の配送で取り直す。
            db.put('generationJobs', {
              ...db.get('generationJobs', jobId)!,
              leaseToken: 'expired',
              leaseUntil: 0,
            });
            throw Error('LEASE_LOST');
          }
          return proposal;
        },
      },
      30,
    );
    for (const expectedRevision of [1, 2]) {
      await request(
        `/learners/${learner.learnerId}`,
        {
          expectedRevision,
          preferences: {
            sentenceLength: 30 + expectedRevision,
            splitHints: `変更後${expectedRevision}`,
            displayMode: confirmed ? 'photo_text' : 'photo_only',
          },
          confirmedGuidance: [`変更後の説明${expectedRevision}`],
        },
        'PATCH',
      );
      await run(jobId);
      assert.equal(captured.length, expectedRevision);
      assert.deepEqual(captured.at(-1)!.preferences, expectedPreferences);
      assert.equal(captured.at(-1)!.displayMode, expectedDisplayMode);
      assert.deepEqual(captured.at(-1)!.confirmedGuidance, expectedGuidance);
      assert.equal(captured.at(-1)!.corrections, undefined);
      assert.equal(
        db.get('generationJobs', jobId)!.status,
        expectedRevision === 1 ? 'running' : 'succeeded',
      );
    }
    assert.deepEqual(captured[1], captured[0]);
    const snapshot = db.get('generationJobs', jobId)!.inputSnapshot;
    assert.deepEqual(snapshot.preferences, expectedPreferences);
    assert.deepEqual(snapshot.correctionInputs, []);
    assert.equal(db.get('drafts', draftId)!.displayMode, expectedDisplayMode);
    assert.equal(db.get('drafts', draftId)!.status, 'editing');
    await run(jobId);
    assert.equal(captured.length, 2);
  });
}
