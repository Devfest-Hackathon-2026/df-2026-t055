import { createReadStream, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { stat, appendFile, link, rm, unlink } from 'node:fs/promises';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Member } from '../../../packages/shared/src/index.ts';
export type Doc = {
  id: string;
  orgId: string;
  createdAt: string;
  [key: string]: any;
};
export type Awaitable<T> = T | Promise<T>;
export type SupportWatchScope =
  | { orgId: string; role: 'staff' }
  | { orgId: string; role: 'learner'; sessionId: string; learnerId: string };
export interface Repository {
  all(collection: string): Awaitable<Doc[]>;
  get(collection: string, id: string): Awaitable<Doc | undefined>;
  put(collection: string, value: Doc): Awaitable<void>;
  transaction<T>(fn: () => T | Promise<T>): Promise<T>;
  watchSupport?(scope: SupportWatchScope, onChange: () => void, onError: () => void): () => void;
}
// Transaction callbacks see private writes; commit publishes them atomically.
// An async Firestore adapter can use its own transaction context behind this port.
export class MemoryRepository implements Repository {
  private data = new Map<string, Map<string, Doc>>();
  private context = new AsyncLocalStorage<Map<string, Map<string, Doc>>>();
  private tail: Promise<unknown> = Promise.resolve();
  all(c: string) {
    const values = new Map(this.data.get(c));
    for (const [key, value] of this.context.getStore()?.get(c) ?? []) values.set(key, value);
    return [...values.values()].map((x) => structuredClone(x));
  }
  get(c: string, key: string) {
    const x = this.context.getStore()?.get(c)?.get(key) ?? this.data.get(c)?.get(key);
    return x && structuredClone(x);
  }
  put(c: string, v: Doc) {
    const target = this.context.getStore() ?? this.data;
    if (!target.has(c)) target.set(c, new Map());
    target.get(c)!.set(v.id, structuredClone(v));
  }
  async transaction<T>(fn: () => T | Promise<T>): Promise<T> {
    if (this.context.getStore()) return fn();
    const run = this.tail.then(async () => {
      const writes = new Map<string, Map<string, Doc>>();
      const value = await this.context.run(writes, fn);
      for (const [c, values] of writes) {
        if (!this.data.has(c)) this.data.set(c, new Map());
        for (const [key, v] of values) this.data.get(c)!.set(key, v);
      }
      return value;
    });
    this.tail = run.catch(() => {});
    return run;
  }
}
export type UploadProgress = { received: number; generation?: string };
export interface Storage {
  put(path: string, bytes: Buffer): Promise<void | string>;
  get(path: string, generation?: string | number): Promise<Buffer>;
  open(path: string, generation?: string | number): Promise<ReadableStream<Uint8Array>>;
  copy(from: string, to: string, generation?: string | number): Promise<void | string>;
  // Resumable upload. The session is a server-internal secret (GCS session URI or local id):
  // never return it to browsers or write it to logs.
  // Optional so that small in-memory test doubles stay valid; production adapters implement all.
  startUpload?(path: string, size: number): Promise<string>;
  // Appends bytes at `start`; resolves with the bytes the backend has persisted and,
  // once the object is complete, its generation (local storage has none).
  appendUpload?(
    session: string,
    start: number,
    bytes: Buffer,
    total: number,
  ): Promise<UploadProgress>;
  remove?(path: string, generation?: string | number): Promise<void>;
  // Streams the pinned object to a new local file without buffering it in memory.
  download?(path: string, generation: string | number | undefined, filePath: string): Promise<void>;
}
export async function writeStreamToFile(stream: ReadableStream<Uint8Array>, filePath: string) {
  await pipeline(
    Readable.fromWeb(stream as import('node:stream/web').ReadableStream<Uint8Array>),
    createWriteStream(filePath, { flags: 'wx' }),
  );
}
// Streams a pinned object to a new local file, falling back to open() for minimal adapters.
export async function downloadTo(
  storage: Storage,
  path: string,
  generation: string | number | undefined,
  filePath: string,
) {
  if (storage.download) return storage.download(path, generation, filePath);
  await writeStreamToFile(await storage.open(path, generation), filePath);
}
export class LocalStorage implements Storage {
  constructor(private root = resolve('.local/assets')) {}
  private path(p: string) {
    if (p.includes('..') || p.startsWith('/')) throw Error('PATH');
    return resolve(this.root, p);
  }
  private session(session: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(session))
      throw Error('INVALID_UPLOAD_SESSION');
    const base = resolve(this.root, '.uploads', session);
    return { part: `${base}.part`, meta: `${base}.json` };
  }
  async put(p: string, b: Buffer) {
    const target = this.path(p);
    await mkdir(resolve(target, '..'), { recursive: true });
    await writeFile(target, b);
  }
  get(p: string) {
    return readFile(this.path(p));
  }
  async open(p: string) {
    const target = this.path(p);
    await stat(target);
    return Readable.toWeb(createReadStream(target)) as ReadableStream<Uint8Array>;
  }
  async copy(a: string, b: string) {
    await this.put(b, await this.get(a));
  }
  async startUpload(p: string, size: number) {
    this.path(p);
    if (!Number.isSafeInteger(size) || size <= 0) throw Error('INVALID_UPLOAD_SIZE');
    const session = randomUUID();
    const files = this.session(session);
    await mkdir(resolve(files.part, '..'), { recursive: true });
    await writeFile(files.part, new Uint8Array(), { flag: 'wx' });
    await writeFile(files.meta, JSON.stringify({ path: p, size }), { flag: 'wx' });
    return session;
  }
  async appendUpload(session: string, start: number, bytes: Buffer, total: number) {
    const files = this.session(session);
    const meta = JSON.parse(await readFile(files.meta, 'utf8')) as { path: string; size: number };
    if (total !== meta.size || start + bytes.length > total) throw Error('INVALID_UPLOAD_RANGE');
    if ((await stat(files.part)).size !== start) throw Error('UPLOAD_OFFSET_MISMATCH');
    await appendFile(files.part, bytes);
    const received = (await stat(files.part)).size;
    if (received === total) {
      const target = this.path(meta.path);
      await mkdir(resolve(target, '..'), { recursive: true });
      // link() fails if the object exists, like ifGenerationMatch=0 on Cloud Storage.
      await link(files.part, target);
      await unlink(files.part);
      await unlink(files.meta);
    }
    return { received };
  }
  async remove(p: string) {
    await rm(this.path(p));
  }
  async download(p: string, _generation: string | number | undefined, filePath: string) {
    await pipeline(createReadStream(this.path(p)), createWriteStream(filePath, { flags: 'wx' }));
  }
}
export interface Auth {
  verify(token: string): Promise<(Member & { expiresAt?: number }) | undefined>;
}
export class DemoAuth implements Auth {
  constructor(private db: Repository) {
    if (process.env.NODE_ENV === 'production') throw Error('DEMO_AUTH_DISABLED');
  }
  async verify(t: string) {
    const member = (await this.db.get('members', t)) as Member | undefined;
    // Demo credentials last one hour; production Auth supplies verified expiry in epoch milliseconds (#36).
    return member && { ...member, expiresAt: Date.now() + 60 * 60 * 1000 };
  }
}
export const id = () => randomUUID();
export const now = () => new Date().toISOString();
export function doc(orgId: string, fields: Record<string, any>): Doc {
  return {
    id: id(),
    orgId,
    createdAt: now(),
    ...fields,
  };
}
export function seed(db: MemoryRepository) {
  for (const [uid, role, learnerId, orgId] of [
    ['staff', 'staff', undefined, 'demo'],
    ['learner-a', 'learner', 'a', 'demo'],
    ['learner-b', 'learner', 'b', 'demo'],
    ['newcomer', 'newcomer', undefined, 'demo'],
    ['other-staff', 'staff', undefined, 'other'],
  ] as const)
    db.put(
      'members',
      doc(orgId, {
        id: uid,
        uid,
        role,
        learnerId,
      }),
    );
  for (const [learnerId, displayName, splitHints] of [
    ['a', 'Aさん', '9工程'],
    ['b', 'Bさん', '折るを細分化した11工程'],
  ])
    db.put(
      'learners',
      doc('demo', {
        id: learnerId,
        displayName,
        preferences: { sentenceLength: 40, splitHints, audioGuidance: learnerId === 'b' },
        enteredBy: 'staff',
      }),
    );
}
