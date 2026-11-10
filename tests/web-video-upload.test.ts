import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const compiled = ts.transpileModule(
  await readFile(new URL('../apps/web/src/video-upload.ts', import.meta.url), 'utf8'),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } },
).outputText;
const { uploadVideo, readReceived, progressLabel, tooLargeMessage, MAX_VIDEO_BYTES } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
);

const CHUNK = 8 * 1024 * 1024;
type Call = { path: string; method?: string; body?: any; headers?: Record<string, string> };
const httpError = (status: number, code?: string, body: any = {}) =>
  Object.assign(Error(String(code ?? status)), { status, code, body });

function fakeApi(
  total: number,
  put: (call: Call, n: number) => any = (c) => ({
    received: Number(/-(\d+)\//.exec(c.headers!['Content-Range'])![1]) + 1,
  }),
) {
  const calls: Call[] = [];
  let puts = 0;
  const api = async (
    path: string,
    method?: string,
    body?: any,
    headers?: Record<string, string>,
  ) => {
    const call = { path, method, body, headers };
    calls.push(call);
    if (path.endsWith('/video-uploads')) return { uploadId: 'u1', chunkSize: CHUNK };
    if (path.endsWith('/complete')) return { assetId: 'a1', status: 'ready' };
    return put(call, ++puts);
  };
  return { api, calls };
}
const blob = (n: number) => new Blob([new Uint8Array(n)]);

test('分割の境界と Content-Range が正しく、最後は残り全部を送る', async () => {
  const total = CHUNK * 2 + 5;
  const { api, calls } = fakeApi(total);
  const seen: number[] = [];
  const r = await uploadVideo({
    api,
    taskId: 't',
    file: blob(total),
    onProgress: (n: number) => seen.push(n),
  });
  assert.deepEqual(r, { assetId: 'a1', status: 'ready' });
  assert.deepEqual(calls[0], {
    path: '/tasks/t/video-uploads',
    method: 'POST',
    body: { size: total },
    headers: undefined,
  });
  const puts = calls.filter((c) => c.method === 'PUT');
  assert.deepEqual(
    puts.map((c) => c.headers),
    [
      {
        'Content-Type': 'application/octet-stream',
        'Content-Range': `bytes 0-${CHUNK - 1}/${total}`,
      },
      {
        'Content-Type': 'application/octet-stream',
        'Content-Range': `bytes ${CHUNK}-${CHUNK * 2 - 1}/${total}`,
      },
      {
        'Content-Type': 'application/octet-stream',
        'Content-Range': `bytes ${CHUNK * 2}-${total - 1}/${total}`,
      },
    ],
  );
  assert.deepEqual(
    puts.map((c) => c.body.size),
    [CHUNK, CHUNK, 5],
  );
  assert.equal(calls.at(-1)!.path, '/tasks/t/video-uploads/u1/complete');
  assert.deepEqual(seen, [0, CHUNK, CHUNK * 2, total]);
});

test('ちょうど chunkSize の動画は1回で送る', async () => {
  const { api, calls } = fakeApi(CHUNK);
  await uploadVideo({ api, taskId: 't', file: blob(CHUNK) });
  assert.equal(calls.filter((c) => c.method === 'PUT').length, 1);
});

test('通信エラーと5xxは同じ分割を3回まで再試行し、超えたら止まる', async () => {
  const total = 10;
  let n = 0;
  const ok = fakeApi(total, (c, i) => {
    if (i <= 3) throw i === 1 ? new TypeError('network') : httpError(503);
    return { received: total };
  });
  await uploadVideo({ api: ok.api, taskId: 't', file: blob(total) });
  const puts = ok.calls.filter((c) => c.method === 'PUT');
  assert.equal(puts.length, 4);
  assert.ok(puts.every((c) => c.headers!['Content-Range'] === `bytes 0-9/${total}`));
  const ng = fakeApi(total, () => (n++, Promise.reject(httpError(500))));
  await assert.rejects(uploadVideo({ api: ng.api, taskId: 't', file: blob(total) }));
  assert.equal(n, 4);
  assert.ok(!ng.calls.some((c) => c.path.endsWith('/complete')));
});

test('409 UPLOAD_OFFSET_MISMATCH は返された received から続きを送る', async () => {
  const total = CHUNK + 100;
  for (const body of [
    { received: CHUNK },
    { error: { received: CHUNK } },
    { details: { received: CHUNK } },
  ]) {
    const { api, calls } = fakeApi(total, (c, i) => {
      if (i === 1) throw httpError(409, 'UPLOAD_OFFSET_MISMATCH', body);
      return { received: total };
    });
    await uploadVideo({ api, taskId: 't', file: blob(total) });
    const puts = calls.filter((c) => c.method === 'PUT');
    assert.equal(puts[1].headers!['Content-Range'], `bytes ${CHUNK}-${total - 1}/${total}`);
  }
  assert.equal(readReceived({}), undefined);
});

test('再開できない 422/409 は再試行せず止まる', async () => {
  for (const [status, code] of [
    [422, 'INVALID_VIDEO'],
    [409, 'VIDEO_IMMUTABLE'],
    [409, 'UPLOAD_INCOMPLETE'],
  ] as const) {
    const { api, calls } = fakeApi(10, () => Promise.reject(httpError(status, code)));
    await assert.rejects(uploadVideo({ api, taskId: 't', file: blob(10) }));
    assert.equal(calls.filter((c) => c.method === 'PUT').length, 1);
  }
});

test('上限を超えるファイルは何も送らずに日本語で知らせる', async () => {
  const { api, calls } = fakeApi(0);
  const big = { size: MAX_VIDEO_BYTES + 1, slice: () => blob(0) } as unknown as Blob;
  await assert.rejects(uploadVideo({ api, taskId: 't', file: big }), /500MB/);
  assert.equal(calls.length, 0);
  assert.match(tooLargeMessage({ size: MAX_VIDEO_BYTES + 1 }), /大きすぎ/);
  assert.equal(tooLargeMessage({ size: MAX_VIDEO_BYTES }), '');
});

test('進捗の文言は受信済みバイト数から整数で出す', () => {
  assert.equal(progressLabel(0, 100), 'アップロード中 0%');
  assert.equal(progressLabel(1, 3), 'アップロード中 33%');
  assert.equal(progressLabel(100, 100), 'アップロード中 100%');
});
