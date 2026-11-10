import { GoogleAuth } from 'google-auth-library';
import { Readable } from 'node:stream';
import type { CloudStorageClient } from './cloud-storage.ts';

type RequestOptions = {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  responseType: 'json' | 'stream';
  headers?: Record<string, string>;
  data?: Buffer | Record<string, never>;
  validateStatus?: (status: number) => boolean;
};
export interface StorageTransport {
  request(options: RequestOptions): Promise<{ data: unknown; status?: number; headers?: unknown }>;
}
const resumableHost = 'storage.googleapis.com';
function header(headers: unknown, name: string) {
  if (headers instanceof Headers) return headers.get(name) ?? undefined;
  if (!headers || typeof headers !== 'object') return undefined;
  for (const [key, value] of Object.entries(headers))
    if (key.toLowerCase() === name) return Array.isArray(value) ? value[0] : String(value);
  return undefined;
}
// Only accept the resumable session URIs Cloud Storage issues, so a stored value can
// never redirect authenticated requests elsewhere.
function sessionUrl(session: string) {
  let url: URL;
  try {
    url = new URL(session);
  } catch {
    throw Error('INVALID_UPLOAD_SESSION');
  }
  if (
    url.protocol !== 'https:' ||
    url.host !== resumableHost ||
    !url.pathname.startsWith('/upload/storage/v1/b/') ||
    !url.searchParams.get('upload_id')
  )
    throw Error('INVALID_UPLOAD_SESSION');
  return url.toString();
}

// Use the JSON API directly: generation numbers must never pass through a JS number.
export class GoogleStorageClient implements CloudStorageClient {
  private transport: StorageTransport;
  constructor(projectId: string, transport?: StorageTransport) {
    this.transport =
      transport ??
      new GoogleAuth({
        projectId,
        scopes: ['https://www.googleapis.com/auth/devstorage.read_write'],
      });
  }
  private url(path: string, params: Record<string, string>) {
    return `https://storage.googleapis.com${path}?${new URLSearchParams(params)}`;
  }
  // Errors are replaced so that object paths and session URIs never leak through messages.
  private async send(options: RequestOptions) {
    try {
      return await this.transport.request(options);
    } catch {
      throw Error('CLOUD_STORAGE_REQUEST_FAILED');
    }
  }
  private async request(options: RequestOptions) {
    return (await this.send(options)).data;
  }
  private generation(data: unknown) {
    if (
      !data ||
      typeof data !== 'object' ||
      !('generation' in data) ||
      typeof data.generation !== 'string' ||
      !/^[1-9][0-9]*$/.test(data.generation)
    )
      throw Error('INVALID_STORAGE_GENERATION_RESPONSE');
    return data.generation;
  }
  async put(bucket: string, path: string, bytes: Buffer, options: { ifGenerationMatch: '0' }) {
    const url = this.url(`/upload/storage/v1/b/${encodeURIComponent(bucket)}/o`, {
      uploadType: 'media',
      name: path,
      ifGenerationMatch: options.ifGenerationMatch,
    });
    return this.generation(
      await this.request({
        url,
        method: 'POST',
        responseType: 'json',
        headers: { 'content-type': 'application/octet-stream' },
        data: bytes,
      }),
    );
  }
  async open(bucket: string, path: string, options: { ifGenerationMatch: string }) {
    const url = this.url(
      `/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(path)}`,
      {
        alt: 'media',
        ifGenerationMatch: options.ifGenerationMatch,
      },
    );
    const data = await this.request({ url, method: 'GET', responseType: 'stream' });
    if (data instanceof Readable) return Readable.toWeb(data) as ReadableStream<Uint8Array>;
    if (data instanceof ReadableStream) return data as ReadableStream<Uint8Array>;
    throw Error('INVALID_STORAGE_STREAM_RESPONSE');
  }
  async copy(
    bucket: string,
    from: string,
    to: string,
    options: { ifSourceGenerationMatch: string; ifGenerationMatch: '0' },
  ) {
    const b = encodeURIComponent(bucket);
    const url = this.url(
      `/storage/v1/b/${b}/o/${encodeURIComponent(from)}/copyTo/b/${b}/o/${encodeURIComponent(to)}`,
      options,
    );
    return this.generation(
      await this.request({ url, method: 'POST', responseType: 'json', data: {} }),
    );
  }
  async startUpload(
    bucket: string,
    path: string,
    size: number,
    options: { ifGenerationMatch: '0' },
  ) {
    const url = this.url(`/upload/storage/v1/b/${encodeURIComponent(bucket)}/o`, {
      uploadType: 'resumable',
      name: path,
      ifGenerationMatch: options.ifGenerationMatch,
    });
    const response = await this.send({
      url,
      method: 'POST',
      responseType: 'json',
      headers: {
        'x-upload-content-type': 'application/octet-stream',
        'x-upload-content-length': String(size),
      },
      data: {},
    });
    const location = header(response.headers, 'location');
    if (!location) throw Error('INVALID_UPLOAD_SESSION_RESPONSE');
    return sessionUrl(location);
  }
  async appendUpload(session: string, start: number, bytes: Buffer, total: number) {
    const end = start + bytes.length - 1;
    if (bytes.length === 0 || end >= total) throw Error('INVALID_UPLOAD_RANGE');
    const response = await this.send({
      url: sessionUrl(session),
      method: 'PUT',
      responseType: 'json',
      headers: {
        'content-type': 'application/octet-stream',
        'content-range': `bytes ${start}-${end}/${total}`,
      },
      data: bytes,
      // 308 Resume Incomplete means the session continues; it is not a redirect.
      validateStatus: (status) => status === 308 || (status >= 200 && status < 300),
    });
    if (response.status === 308) {
      const range = header(response.headers, 'range');
      if (range === undefined) return { received: 0 };
      const match = /^bytes=0-([0-9]+)$/.exec(range);
      const received = match ? Number(match[1]) + 1 : NaN;
      if (!Number.isSafeInteger(received) || received > total)
        throw Error('INVALID_UPLOAD_RANGE_RESPONSE');
      return { received };
    }
    if (response.status === 200 || response.status === 201)
      return { received: total, generation: this.generation(response.data) };
    throw Error('CLOUD_STORAGE_REQUEST_FAILED');
  }
  async remove(bucket: string, path: string, options: { ifGenerationMatch: string }) {
    const url = this.url(
      `/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(path)}`,
      { ifGenerationMatch: options.ifGenerationMatch },
    );
    await this.send({ url, method: 'DELETE', responseType: 'json' });
  }
}
