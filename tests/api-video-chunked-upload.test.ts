import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalStorage, MemoryRepository, doc, seed } from '../apps/api/src/adapters.ts';
import { createApp } from '../apps/api/src/app.ts';

let root: string;
let video: Buffer;
before(async () => {
  root = await mkdtemp(join(tmpdir(), 't055-chunked-'));
  const path = join(root, 'fixture.mp4');
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
    '2',
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

const CHUNK = 4096;
function harness() {
  const db = new MemoryRepository();
  seed(db);
  db.put(
    'tasks',
    doc('demo', { id: 'task', title: '動画', status: 'uploading', createdBy: 'staff' }),
  );
  db.put('members', doc('demo', { id: 'staff-2', uid: 'staff-2', role: 'staff' }));
  const storageRoot = join(root, crypto.randomUUID());
  const storage = new LocalStorage(storageRoot);
  const { app } = createApp({ db, storage, videoUploadChunkSize: CHUNK });
  const bodies: string[] = [];
  const call = async (
    method: string,
    path: string,
    token: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ) => {
    const raw = Buffer.isBuffer(body);
    const response = await app.fetch(
      new Request(`http://localhost/api/v1${path}`, {
        method,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': raw ? 'application/octet-stream' : 'application/json',
          ...headers,
        },
        body:
          body === undefined
            ? undefined
            : raw
              ? new Uint8Array(body as Buffer)
              : JSON.stringify(body),
      }),
    );
    const text = await response.text();
    bodies.push(text);
    return { status: response.status, json: text ? JSON.parse(text) : undefined };
  };
  const create = (size: number, token = 'staff') =>
    call('POST', '/tasks/task/video-uploads', token, { size });
  const put = (uploadId: string, bytes: Buffer, start: number, total: number, token = 'staff') =>
    call('PUT', `/tasks/task/video-uploads/${uploadId}`, token, bytes, {
      'content-range': `bytes ${start}-${start + bytes.length - 1}/${total}`,
    });
  const complete = (uploadId: string, token = 'staff') =>
    call('POST', `/tasks/task/video-uploads/${uploadId}/complete`, token, {});
  const sendAll = async (uploadId: string, bytes: Buffer, from = 0) => {
    for (let start = from; start < bytes.length; start += CHUNK) {
      const r = await put(uploadId, bytes.subarray(start, start + CHUNK), start, bytes.length);
      assert.equal(r.status, 200, JSON.stringify(r.json));
      assert.equal(r.json.received, Math.min(start + CHUNK, bytes.length));
    }
  };
  return { db, storage, storageRoot, call, create, put, complete, sendAll, bodies };
}
const noSession = (h: ReturnType<typeof harness>) => {
  for (const u of h.db.all('videoUploads'))
    for (const body of h.bodies) assert.ok(!body.includes(u.session), 'session leaked');
  for (const body of h.bodies) assert.doesNotMatch(body, /session|objectPath/);
};

test('分割アップロードで複数分割のMP4がreadyになり、durationMsが正しい', async () => {
  const h = harness();
  assert.ok(video.length > CHUNK * 2);
  const created = await h.create(video.length);
  assert.equal(created.status, 200);
  assert.equal(created.json.chunkSize, CHUNK);
  const id = created.json.uploadId;
  assert.equal((await h.complete(id)).status, 409);
  await h.sendAll(id, video);
  const done = await h.complete(id);
  assert.equal(done.status, 200, JSON.stringify(done.json));
  assert.equal(done.json.status, 'ready');
  const asset = h.db.get('assets', done.json.assetId)!;
  assert.ok(Math.abs(asset.durationMs - 2000) < 100, String(asset.durationMs));
  assert.equal(h.db.get('tasks', 'task')!.status, 'ready');
  assert.equal(h.db.get('tasks', 'task')!.videoAssetId, asset.id);
  assert.deepEqual(await h.storage.get(asset.objectPath), video);
  const again = await h.complete(id);
  assert.equal(again.status, 409);
  assert.equal(again.json.error.code, 'VIDEO_IMMUTABLE');
  noSession(h);
});

test('順序違いのPUTは409とreceivedを返し、正しいstartから再開できる', async () => {
  const h = harness();
  const id = (await h.create(video.length)).json.uploadId;
  await h.put(id, video.subarray(0, CHUNK), 0, video.length);
  const skipped = await h.put(id, video.subarray(CHUNK * 2, CHUNK * 3), CHUNK * 2, video.length);
  assert.equal(skipped.status, 409);
  assert.equal(skipped.json.error.code, 'UPLOAD_OFFSET_MISMATCH');
  assert.equal(skipped.json.error.received, CHUNK);
  const replay = await h.put(id, video.subarray(0, CHUNK), 0, video.length);
  assert.equal(replay.status, 409);
  assert.equal(replay.json.error.received, CHUNK);
  await h.sendAll(id, video, CHUNK);
  assert.equal((await h.complete(id)).status, 200);
  noSession(h);
});

test('分割の長さ・total・Content-Rangeが不正なら422 INVALID_UPLOAD_CHUNK', async () => {
  const h = harness();
  const id = (await h.create(video.length)).json.uploadId;
  for (const r of [
    await h.put(id, video.subarray(0, CHUNK - 1), 0, video.length),
    await h.put(id, video.subarray(0, CHUNK), 0, video.length + 1),
    await h.call('PUT', `/tasks/task/video-uploads/${id}`, 'staff', Buffer.alloc(4), {
      'content-range': 'bytes 0-9/10',
    }),
  ]) {
    assert.equal(r.status, 422);
    assert.equal(r.json.error.code, 'INVALID_UPLOAD_CHUNK');
  }
});

test('同じアップロードへの同時PUTは1つだけStorageへ送り、他は409 UPLOAD_OFFSET_MISMATCH', async (t) => {
  const h = harness();
  const id = (await h.create(video.length)).json.uploadId;
  const append = t.mock.method(h.storage, 'appendUpload');
  const results = await Promise.all([
    h.put(id, video.subarray(0, CHUNK), 0, video.length),
    h.put(id, video.subarray(0, CHUNK), 0, video.length),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const conflict = results.find((r) => r.status === 409)!;
  assert.equal(conflict.json.error.code, 'UPLOAD_OFFSET_MISMATCH');
  assert.equal(typeof conflict.json.error.received, 'number');
  assert.equal(append.mock.callCount(), 1);
  assert.equal(h.db.get('videoUploads', id)!.received, CHUNK);
});

test('500MiB超は422 VIDEO_TOO_LARGE、uploadingでない作業は409', async () => {
  const h = harness();
  const big = await h.create(500 * 1024 * 1024 + 1);
  assert.equal(big.status, 422);
  assert.equal(big.json.error.code, 'VIDEO_TOO_LARGE');
  assert.equal((await h.create(500 * 1024 * 1024)).status, 200);
  assert.equal((await h.create(0)).status, 422);
  h.db.put('tasks', { ...h.db.get('tasks', 'task')!, status: 'ready' });
  const immutable = await h.create(10);
  assert.equal(immutable.status, 409);
  assert.equal(immutable.json.error.code, 'VIDEO_IMMUTABLE');
});

test('他の所属・作成者でない職員・本人はアップロードを作成・送信・完了できない', async () => {
  const h = harness();
  for (const token of ['other-staff', 'learner-a'])
    assert.ok([403, 404].includes((await h.create(video.length, token)).status));
  const id = (await h.create(video.length)).json.uploadId;
  for (const token of ['other-staff', 'staff-2', 'learner-a']) {
    const sent = await h.put(id, video.subarray(0, CHUNK), 0, video.length, token);
    assert.ok([403, 404].includes(sent.status), `${token} ${sent.status}`);
    const done = await h.complete(id, token);
    assert.ok([403, 404].includes(done.status), `${token} ${done.status}`);
  }
  assert.equal(h.db.get('videoUploads', id)!.received, 0);
  // uploadId belongs to a different task.
  h.db.put('tasks', doc('demo', { id: 'task-2', title: '別', status: 'uploading' }));
  const wrongTask = await h.call('POST', `/tasks/task-2/video-uploads/${id}/complete`, 'staff', {});
  assert.equal(wrongTask.status, 404);
  noSession(h);
});

test('不正なMP4はcompleteで422 INVALID_VIDEO、オブジェクトを消しtaskはuploadingのまま', async () => {
  const h = harness();
  const bytes = Buffer.alloc(CHUNK + 100, 7);
  const id = (await h.create(bytes.length)).json.uploadId;
  await h.sendAll(id, bytes);
  const objectPath = h.db.get('videoUploads', id)!.objectPath;
  assert.ok((await stat(join(h.storageRoot, objectPath))).size === bytes.length);
  const done = await h.complete(id);
  assert.equal(done.status, 422);
  assert.equal(done.json.error.code, 'INVALID_VIDEO');
  await assert.rejects(stat(join(h.storageRoot, objectPath)), { code: 'ENOENT' });
  assert.equal(h.db.get('tasks', 'task')!.status, 'uploading');
  assert.equal(h.db.all('assets').length, 0);
  assert.equal((await h.complete(id)).status, 409);
  noSession(h);
});
