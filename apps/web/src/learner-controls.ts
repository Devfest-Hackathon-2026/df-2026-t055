export type LearnerControlLabel =
  | 'はじめる'
  | 'もどる'
  | 'つぎへ'
  | 'おわる'
  | 'おわります'
  | '手伝って'
  | 'やめる'
  | 'つづける'
  | 'きく';

// Original inline drawings; no external icon assets or runtime downloads.
export function learnerControlPath(label: LearnerControlLabel): string {
  switch (label) {
    case 'はじめる':
      return 'M8 4 L20 12 L8 20 Z';
    case 'もどる':
      return 'M20 12 H4 M4 12 L12 4 M4 12 L12 20';
    case 'つぎへ':
      return 'M4 12 H20 M20 12 L12 4 M20 12 L12 20';
    case 'つづける':
      return 'M4 4 V20 M10 4 L22 12 L10 20 Z';
    case 'おわる':
      return 'M4 12 L10 18 L21 5';
    case 'おわります':
      return 'M3 11 L12 3 L21 11 M6 10 V21 H18 V10 M10 21 V15 H14 V21';
    case '手伝って':
      return 'M14 5 A3 3 0 1 1 8 5 A3 3 0 1 1 14 5 M5 21 V14 L2 10 M5 14 L10 10 H14 L21 3 M14 10 L17 21 M10 10 L8 21';
    case 'きく':
      return 'M4 9 H8 L13 5 V19 L8 15 H4 Z M16.5 8.5 A5 5 0 0 1 16.5 15.5';
    case 'やめる':
      return 'M8 2 H16 L22 8 V16 L16 22 H8 L2 16 V8 Z M8 8 H16 V16 H8 Z';
  }
}

export function imageFailureText(alt: string, failed: boolean): string | undefined {
  return failed ? `写真を表示できません：${alt}` : undefined;
}
