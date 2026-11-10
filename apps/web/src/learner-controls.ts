export type LearnerControlLabel =
  | 'はじめる'
  | 'もどる'
  | 'つぎへ'
  | 'おわる'
  | '手伝って'
  | 'やめる'
  | 'つづける'
  | '読み上げる'
  | '音声をとめる';

export type LearnerPictogramLabel =
  | LearnerControlLabel
  | '作業中'
  | '送信中'
  | '職員をよんでいます'
  | '担当が決まりました'
  | '対応中'
  | '対応が終わりました'
  | '作業をやめました'
  | 'おわりました'
  | '送れませんでした';

// Original inline drawings; no external icon assets or runtime downloads.
export function learnerControlPath(label: LearnerPictogramLabel): string {
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
    case 'おわりました':
    case '対応が終わりました':
      return 'M4 12 L10 18 L21 5';
    case '手伝って':
      return 'M14 5 A3 3 0 1 1 8 5 A3 3 0 1 1 14 5 M5 21 V14 L2 10 M5 14 L10 10 H14 L21 3 M14 10 L17 21 M10 10 L8 21';
    case 'やめる':
    case '作業をやめました':
      return 'M8 2 H16 L22 8 V16 L16 22 H8 L2 16 V8 Z M8 8 H16 V16 H8 Z';
    case '読み上げる':
      return 'M3 9 H7 L12 4 V20 L7 15 H3 Z M16 8 Q21 12 16 16 M19 4 Q27 12 19 20';
    case '音声をとめる':
      return 'M5 5 H19 V19 H5 Z';
    case '作業中':
      return 'M4 4 H20 V20 H4 Z M8 9 H16 M8 15 H16';
    case '送信中':
      return 'M3 10 V20 H21 V10 M12 15 V2 M6 8 L12 2 L18 8';
    case '職員をよんでいます':
      return 'M12 2 A10 10 0 1 1 12 22 A10 10 0 1 1 12 2 M12 6 V12 L17 15';
    case '担当が決まりました':
      return 'M14 6 A4 4 0 1 1 6 6 A4 4 0 1 1 14 6 M2 22 V18 Q10 10 18 18 V22 M16 10 L19 13 L23 7';
    case '対応中':
      return 'M9 6 A3 3 0 1 1 3 6 A3 3 0 1 1 9 6 M21 6 A3 3 0 1 1 15 6 A3 3 0 1 1 21 6 M2 22 V16 L6 12 L12 16 L18 12 L22 16 V22 M6 16 V22 M18 16 V22';
    case '送れませんでした':
      return 'M12 2 L23 22 H1 Z M12 8 V14 M12 18 V19';
  }
}

export function imageFailureText(alt: string, failed: boolean): string | undefined {
  return failed ? `写真を表示できません：${alt}` : undefined;
}
