import { LocalStorage, writeStreamToFile, type Storage } from './adapters.ts';
import { GoogleStorageClient } from './google-storage.ts';

// The binding must enforce these conditions atomically on Cloud Storage requests.
// No ACL, signed URL or public URL operations are exposed by this port.
export interface CloudStorageClient {
  put(
    bucket: string,
    path: string,
    bytes: Buffer,
    options: { ifGenerationMatch: '0' },
  ): Promise<string>;
  open(
    bucket: string,
    path: string,
    options: { ifGenerationMatch: string },
  ): Promise<ReadableStream<Uint8Array>>;
  copy(
    bucket: string,
    from: string,
    to: string,
    options: { ifSourceGenerationMatch: string; ifGenerationMatch: '0' },
  ): Promise<string>;
  // Returns the resumable session URI. It is a bearer capability: keep it server-side only.
  startUpload(
    bucket: string,
    path: string,
    size: number,
    options: { ifGenerationMatch: '0' },
  ): Promise<string>;
  appendUpload(
    session: string,
    start: number,
    bytes: Buffer,
    total: number,
  ): Promise<{ received: number; generation?: string }>;
  remove(bucket: string, path: string, options: { ifGenerationMatch: string }): Promise<void>;
}
function objectPath(path: string) {
  if (
    !/^(source|draft|approved)\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/.test(
      path,
    )
  )
    throw Error('INVALID_STORAGE_PATH');
  return path;
}
function pinned(generation?: string | number) {
  const value = String(generation ?? '');
  if (!/^[1-9][0-9]*$/.test(value)) throw Error('STORAGE_GENERATION_REQUIRED');
  return value;
}
export class CloudStorage implements Storage {
  constructor(
    private client: CloudStorageClient,
    private bucket: string,
  ) {
    if (!/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/.test(bucket)) throw Error('INVALID_STORAGE_BUCKET');
  }
  async put(path: string, bytes: Buffer) {
    return pinned(
      await this.client.put(this.bucket, objectPath(path), bytes, { ifGenerationMatch: '0' }),
    );
  }
  async open(path: string, generation?: string | number) {
    return this.client.open(this.bucket, objectPath(path), {
      ifGenerationMatch: pinned(generation),
    });
  }
  async get(path: string, generation?: string | number) {
    return Buffer.from(await new Response(await this.open(path, generation)).arrayBuffer());
  }
  async copy(from: string, to: string, generation?: string | number) {
    objectPath(from);
    objectPath(to);
    if (from.split('/')[1] !== to.split('/')[1]) throw Error('STORAGE_ORG_MISMATCH');
    return pinned(
      await this.client.copy(this.bucket, from, to, {
        ifSourceGenerationMatch: pinned(generation),
        ifGenerationMatch: '0',
      }),
    );
  }
  async startUpload(path: string, size: number) {
    if (!Number.isSafeInteger(size) || size <= 0) throw Error('INVALID_UPLOAD_SIZE');
    return this.client.startUpload(this.bucket, objectPath(path), size, {
      ifGenerationMatch: '0',
    });
  }
  async appendUpload(session: string, start: number, bytes: Buffer, total: number) {
    const result = await this.client.appendUpload(session, start, bytes, total);
    return result.generation === undefined
      ? { received: result.received }
      : { received: result.received, generation: pinned(result.generation) };
  }
  async remove(path: string, generation?: string | number) {
    await this.client.remove(this.bucket, objectPath(path), {
      ifGenerationMatch: pinned(generation),
    });
  }
  async download(path: string, generation: string | number | undefined, filePath: string) {
    await writeStreamToFile(await this.open(path, generation), filePath);
  }
  // Internal model input only; never include this URI in browser responses.
  privateUri(path: string) {
    return `gs://${this.bucket}/${objectPath(path)}`;
  }
}
export function configuredStorage(
  env: NodeJS.ProcessEnv = process.env,
  client?: CloudStorageClient,
): Storage {
  const backend = env.STORAGE_BACKEND ?? 'local';
  if (backend === 'local') return new LocalStorage();
  if (backend !== 'cloud') throw Error('INVALID_STORAGE_BACKEND');
  if (!client && !env.GOOGLE_CLOUD_PROJECT)
    throw Error('CLOUD_STORAGE_CLIENT_NOT_CONFIGURED: GOOGLE_CLOUD_PROJECT is required');
  if (!env.STORAGE_BUCKET) throw Error('STORAGE_BUCKET_REQUIRED');
  return new CloudStorage(
    client ?? new GoogleStorageClient(env.GOOGLE_CLOUD_PROJECT!),
    env.STORAGE_BUCKET,
  );
}
