// 作業動画の分割アップロード（作成 → 分割PUT → 完了）。画面から切り離してテストできるようにしてある。
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export const MAX_CHUNK_RETRIES = 3;

export type UploadApi = (
  path: string,
  method?: string,
  body?: unknown,
  headers?: Record<string, string>,
) => Promise<any>;

export class VideoUploadError extends Error {}

// 409 の本文から受信済みバイト数を読む。本文の形が確定していないため、3か所を順に見る。
export function readReceived(body: any): number | undefined {
  for (const v of [body?.received, body?.error?.received, body?.details?.received])
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return v;
  return undefined;
}

export const progressPercent = (received: number, total: number) =>
  total > 0 ? Math.min(100, Math.floor((received / total) * 100)) : 0;

export const progressLabel = (received: number, total: number) =>
  `アップロード中 ${progressPercent(received, total)}%`;

export function tooLargeMessage(file: { size: number }) {
  return file.size > MAX_VIDEO_BYTES
    ? '動画が大きすぎます。500MB以下のMP4を選んでください。何も送っていません。'
    : '';
}

export async function uploadVideo({
  api,
  taskId,
  file,
  onProgress,
  maxRetries = MAX_CHUNK_RETRIES,
}: {
  api: UploadApi;
  taskId: string;
  file: Blob;
  onProgress?: (received: number, total: number) => void;
  maxRetries?: number;
}) {
  const total = file.size;
  const tooLarge = tooLargeMessage(file);
  if (tooLarge) throw new VideoUploadError(tooLarge);
  const { uploadId, chunkSize } = await api(`/tasks/${taskId}/video-uploads`, 'POST', {
    size: total,
  });
  const base = `/tasks/${taskId}/video-uploads/${uploadId}`;
  let received = 0;
  onProgress?.(0, total);
  while (received < total) {
    const start = received;
    const end = Math.min(start + chunkSize, total) - 1;
    let attempt = 0;
    for (;;) {
      try {
        const r = await api(base, 'PUT', file.slice(start, end + 1), {
          'Content-Type': 'application/octet-stream',
          'Content-Range': `bytes ${start}-${end}/${total}`,
        });
        received = typeof r?.received === 'number' ? r.received : end + 1;
        break;
      } catch (e: any) {
        if (e?.status === 409 && e?.code === 'UPLOAD_OFFSET_MISMATCH') {
          const next = readReceived(e.body);
          if (next === undefined || next === start || next > total) throw e;
          received = next; // 受信済みの続きから送り直す
          break;
        }
        const retryable = e?.status === undefined || e.status >= 500;
        if (!retryable || ++attempt > maxRetries) throw e;
      }
    }
    onProgress?.(received, total);
  }
  return api(`${base}/complete`, 'POST', {});
}
