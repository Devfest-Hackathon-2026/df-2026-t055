import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../apps/api/src/app.ts';
import { MemoryRepository, doc, seed } from '../apps/api/src/adapters.ts';
import { generationJobStatusSchema } from '../packages/shared/src/generation.ts';

for (const kind of ['guide', 'correction_context']) {
  for (const status of ['queued', 'running', 'succeeded', 'failed']) {
    test(`GET jobs: ${kind}/${status} conforms to the shared contract without internal data`, async () => {
      const db = new MemoryRepository();
      seed(db);
      const error = status === 'failed' ? { errorCode: 'MODEL_OUTPUT_INVALID' } : {};
      db.put(
        'generationJobs',
        doc('demo', {
          id: 'job',
          kind,
          status,
          draftId: 'draft',
          ...error,
          internalException: 'private provider exception',
          rawOutput: 'private generated output',
          inputSnapshot: { title: 'private input' },
        }),
      );
      const { app } = createApp({ db });
      const response = await app.fetch(
        new Request('http://localhost/api/v1/jobs/job', {
          headers: { authorization: 'Bearer staff' },
        }),
      );
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const data = await response.json();
      assert.deepEqual(generationJobStatusSchema.parse(data), {
        schemaVersion: '1',
        jobId: 'job',
        draftId: 'draft',
        kind,
        status,
        ...error,
      });
      assert.doesNotMatch(
        JSON.stringify(data),
        /private|internalException|rawOutput|inputSnapshot/,
      );
      for (const token of ['learner-a', 'newcomer', 'other-staff']) {
        const denied = await app.fetch(
          new Request('http://localhost/api/v1/jobs/job', {
            headers: { authorization: `Bearer ${token}` },
          }),
        );
        assert.equal(denied.status, 403);
        assert.doesNotMatch(await denied.text(), /private|MODEL_OUTPUT_INVALID/);
      }
    });
  }
}
