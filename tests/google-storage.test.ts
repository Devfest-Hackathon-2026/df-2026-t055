import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { CloudStorage, configuredStorage } from '../apps/api/src/cloud-storage.ts';
import { GoogleStorageClient, type StorageTransport } from '../apps/api/src/google-storage.ts';

const exact = '9007199254740993';
test('Google Storage sends exact generation strings and atomic conditions', async () => {
  const requests: Array<{ url: string; method: string; data?: unknown }> = [];
  const transport: StorageTransport = {
    async request(options) {
      requests.push(options);
      return {
        data:
          options.method === 'GET' ? Readable.from([Buffer.from('audio')]) : { generation: exact },
      };
    },
  };
  const storage = new CloudStorage(
    new GoogleStorageClient('test-project', transport),
    'private-bucket',
  );
  const from = 'draft/org/item/audio.mp3';
  const to = 'approved/org/item/audio.mp3';
  assert.equal(await storage.put(from, Buffer.from('audio')), exact);
  assert.equal((await storage.get(from, exact)).toString(), 'audio');
  assert.equal(await storage.copy(from, to, exact), exact);
  const upload = new URL(requests[0].url);
  assert.equal(upload.searchParams.get('name'), from);
  assert.equal(upload.searchParams.get('ifGenerationMatch'), '0');
  assert.deepEqual(requests[0].data, Buffer.from('audio'));
  const read = new URL(requests[1].url);
  assert.equal(read.searchParams.get('ifGenerationMatch'), exact);
  assert.equal(read.searchParams.get('alt'), 'media');
  assert.match(read.pathname, /draft%2Forg%2Fitem%2Faudio.mp3$/);
  const copy = new URL(requests[2].url);
  assert.equal(copy.searchParams.get('ifSourceGenerationMatch'), exact);
  assert.equal(copy.searchParams.get('ifGenerationMatch'), '0');
  assert.match(
    copy.pathname,
    /draft%2Forg%2Fitem%2Faudio.mp3\/copyTo\/b\/private-bucket\/o\/approved%2Forg%2Fitem%2Faudio.mp3$/,
  );
});

test('Google Storage fails closed on precondition failure and malformed metadata', async () => {
  const errors: StorageTransport = {
    async request() {
      throw Error('secret object path');
    },
  };
  const client = new GoogleStorageClient('test-project', errors);
  await assert.rejects(
    client.open('private-bucket', 'draft/org/item/audio.mp3', { ifGenerationMatch: exact }),
    /^Error: CLOUD_STORAGE_REQUEST_FAILED$/,
  );
  await assert.rejects(
    client.copy('private-bucket', 'draft/org/item/audio.mp3', 'approved/org/item/audio.mp3', {
      ifSourceGenerationMatch: exact,
      ifGenerationMatch: '0',
    }),
    /^Error: CLOUD_STORAGE_REQUEST_FAILED$/,
  );
  const malformed: StorageTransport = {
    async request() {
      return { data: { generation: 9007199254740992 } };
    },
  };
  await assert.rejects(
    new GoogleStorageClient('test-project', malformed).put(
      'private-bucket',
      'draft/org/item/audio.mp3',
      Buffer.alloc(0),
      { ifGenerationMatch: '0' },
    ),
    /INVALID_STORAGE_GENERATION_RESPONSE/,
  );
});

test('cloud configuration creates an ADC-backed client without making a network request', () => {
  assert.ok(
    configuredStorage({
      STORAGE_BACKEND: 'cloud',
      STORAGE_BUCKET: 'private-bucket',
      GOOGLE_CLOUD_PROJECT: 'test-project',
    }) instanceof CloudStorage,
  );
  assert.throws(
    () => configuredStorage({ STORAGE_BACKEND: 'cloud', GOOGLE_CLOUD_PROJECT: 'test-project' }),
    /STORAGE_BUCKET_REQUIRED/,
  );
});

test('Google Storage resumable upload: session start, 308 continuation, completion and pinned delete', async () => {
  const session =
    'https://storage.googleapis.com/upload/storage/v1/b/private-bucket/o?uploadType=resumable&upload_id=secret-session';
  const requests: Array<{
    url: string;
    method: string;
    headers?: Record<string, string>;
    data?: unknown;
    validateStatus?: (status: number) => boolean;
  }> = [];
  const replies: Array<{ data: unknown; status?: number; headers?: unknown }> = [
    { data: '', status: 200, headers: new Headers({ location: session }) },
    { data: '', status: 308, headers: new Headers({ range: 'bytes=0-3' }) },
    { data: '', status: 308, headers: {} },
    { data: { generation: exact }, status: 200, headers: new Headers() },
    { data: '', status: 204, headers: new Headers() },
  ];
  const transport: StorageTransport = {
    async request(options) {
      requests.push(options);
      return replies.shift()!;
    },
  };
  const storage = new CloudStorage(
    new GoogleStorageClient('test-project', transport),
    'private-bucket',
  );
  const path = 'source/org/task/video.mp4';
  assert.equal(await storage.startUpload(path, 10), session);
  const start = new URL(requests[0].url);
  assert.equal(requests[0].method, 'POST');
  assert.equal(start.pathname, '/upload/storage/v1/b/private-bucket/o');
  assert.equal(start.searchParams.get('uploadType'), 'resumable');
  assert.equal(start.searchParams.get('name'), path);
  assert.equal(start.searchParams.get('ifGenerationMatch'), '0');
  assert.equal(requests[0].headers?.['x-upload-content-length'], '10');

  assert.deepEqual(await storage.appendUpload(session, 0, Buffer.from('abcd'), 10), {
    received: 4,
  });
  assert.equal(requests[1].method, 'PUT');
  assert.equal(requests[1].url, session);
  assert.equal(requests[1].headers?.['content-range'], 'bytes 0-3/10');
  assert.deepEqual(requests[1].data, Buffer.from('abcd'));
  assert.equal(requests[1].validateStatus?.(308), true);
  assert.equal(requests[1].validateStatus?.(400), false);
  // 308 without Range: nothing persisted yet.
  assert.deepEqual(await storage.appendUpload(session, 4, Buffer.from('efgh'), 10), {
    received: 0,
  });
  const done = await storage.appendUpload(session, 4, Buffer.from('efghij'), 10);
  assert.deepEqual(done, { received: 10, generation: exact });
  assert.equal(typeof done.generation, 'string');
  assert.equal(requests[3].headers?.['content-range'], 'bytes 4-9/10');

  await storage.remove(path, exact);
  const remove = new URL(requests[4].url);
  assert.equal(requests[4].method, 'DELETE');
  assert.match(
    remove.pathname,
    /\/storage\/v1\/b\/private-bucket\/o\/source%2Forg%2Ftask%2Fvideo.mp4$/,
  );
  assert.equal(remove.searchParams.get('ifGenerationMatch'), exact);
});

test('Google Storage resumable upload fails closed without leaking the session', async () => {
  const session =
    'https://storage.googleapis.com/upload/storage/v1/b/private-bucket/o?uploadType=resumable&upload_id=secret-session';
  const failing: StorageTransport = {
    async request() {
      throw Error(`failed ${session}`);
    },
  };
  const client = new GoogleStorageClient('test-project', failing);
  await assert.rejects(
    client.appendUpload(session, 0, Buffer.from('a'), 1),
    (e: Error) => e.message === 'CLOUD_STORAGE_REQUEST_FAILED',
  );
  await assert.rejects(
    client.remove('private-bucket', 'source/org/task/video.mp4', { ifGenerationMatch: exact }),
    /^Error: CLOUD_STORAGE_REQUEST_FAILED$/,
  );
  let calls = 0;
  const counting: StorageTransport = {
    async request() {
      calls++;
      return { data: '', status: 200, headers: new Headers() };
    },
  };
  const strict = new GoogleStorageClient('test-project', counting);
  for (const bad of [
    'http://storage.googleapis.com/upload/storage/v1/b/b/o?upload_id=x',
    'https://example.com/upload/storage/v1/b/b/o?upload_id=x',
    'https://storage.googleapis.com/storage/v1/b/b/o?upload_id=x',
    'https://storage.googleapis.com/upload/storage/v1/b/b/o',
    'not a url',
  ])
    await assert.rejects(
      strict.appendUpload(bad, 0, Buffer.from('a'), 1),
      /INVALID_UPLOAD_SESSION/,
    );
  assert.equal(calls, 0);
  // Missing Location or a foreign Location is rejected instead of stored.
  await assert.rejects(
    strict.startUpload('private-bucket', 'source/org/task/video.mp4', 1, {
      ifGenerationMatch: '0',
    }),
    /INVALID_UPLOAD_SESSION_RESPONSE/,
  );
  const foreign = new GoogleStorageClient('test-project', {
    async request() {
      return { data: '', status: 200, headers: { Location: 'https://example.com/?upload_id=x' } };
    },
  });
  await assert.rejects(
    foreign.startUpload('private-bucket', 'source/org/task/video.mp4', 1, {
      ifGenerationMatch: '0',
    }),
    /INVALID_UPLOAD_SESSION/,
  );
  const malformed = new GoogleStorageClient('test-project', {
    async request() {
      return { data: '', status: 308, headers: { range: 'bytes=0-99' } };
    },
  });
  await assert.rejects(
    malformed.appendUpload(session, 0, Buffer.from('a'), 10),
    /INVALID_UPLOAD_RANGE_RESPONSE/,
  );
  const bigGeneration = new GoogleStorageClient('test-project', {
    async request() {
      return { data: { generation: 9007199254740992 }, status: 200 };
    },
  });
  await assert.rejects(
    bigGeneration.appendUpload(session, 0, Buffer.from('a'), 1),
    /INVALID_STORAGE_GENERATION_RESPONSE/,
  );
});
