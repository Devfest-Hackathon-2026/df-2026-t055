import React from 'react';

// 色だけで区別しない状態表示。形（角丸・点線・角ばり）と絵と文字で違いを示す。
export type BadgeKind = 'wait' | 'progress' | 'ok' | 'fail';

export const badgeIcons: Record<BadgeKind, string> = {
  wait: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18ZM12 7v5l3.5 2',
  progress: 'M12 3a9 9 0 1 0 9 9',
  ok: 'M4 12.5l5 5L20 6.5',
  fail: 'M12 3L22 20H2ZM12 10v5M12 17.5v.5',
};

// 生の状態値（succeeded など）と、作業一覧の日本語表示（生成完了など）のどちらでも同じ種類を返す。
export function badgeKindOf(status: string): BadgeKind {
  if (status === 'failed' || status === '生成失敗') return 'fail';
  if (
    status === 'succeeded' ||
    status === 'approved' ||
    status === 'ready' ||
    status === '生成完了'
  )
    return 'ok';
  if (
    status === 'queued' ||
    status === 'running' ||
    status === 'generating' ||
    status === '生成待ち' ||
    status === '生成中'
  )
    return 'progress';
  return 'wait';
}

export function StatusBadge({ kind, children }: { kind: BadgeKind; children?: React.ReactNode }) {
  return (
    <span className={`badge badge-${kind}`}>
      <svg
        className='badge-icon'
        viewBox='0 0 24 24'
        width='1em'
        height='1em'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.4'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
        focusable='false'
      >
        <path d={badgeIcons[kind]} />
      </svg>
      {children}
    </span>
  );
}
