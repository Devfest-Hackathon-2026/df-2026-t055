import {
  draftUpdateResponseSchema,
  type EditedStep,
  type ReviewChecks,
} from '../../../packages/shared/src/index.ts';

export function missingDraftChecks(
  steps: EditedStep[],
  checks: ReviewChecks,
  flagsRequired: boolean,
) {
  const missing: string[] = [];
  if (!checks.presentationConfirmed) missing.push('本人への提示内容確認');
  steps.forEach((s, i) => {
    if (!checks.steps[s.stepId]?.videoVerified) missing.push(`工程 ${i + 1}：動画照合`);
    if (!checks.steps[s.stepId]?.photoTextVerified) missing.push(`工程 ${i + 1}：写真・説明確認`);
  });
  if (flagsRequired && !checks.flagResolution.trim()) missing.push('確認が必要な点への対応記録');
  return missing;
}
export function draftPreviewMode(mode?: 'photo_only' | 'photo_text') {
  return mode ?? 'photo_text';
}
export function savedDraftReview(result: unknown) {
  const { revision, reviewChecks } = draftUpdateResponseSchema.parse(result);
  return { revision, reviewChecks };
}
export function generationFailureReason(code?: string) {
  switch (code) {
    case 'MODEL_OUTPUT_INVALID':
      return 'AIの出力が必要な形式や条件を満たしませんでした。';
    case 'MODEL_TIMEOUT':
      return 'AIからの応答が制限時間内に返りませんでした。';
    case 'MODEL_CALL_FAILED':
      return 'AIへの生成依頼に失敗しました。';
    case 'FRAME_EXTRACTION_FAILED':
      return '手本動画から写真を切り出せませんでした。';
    case 'JOB_TIMEOUT':
      return '生成処理が制限時間を超えました。';
    case 'ATTEMPT_LIMIT':
      return 'このジョブの実行回数が上限に達しました。';
    default:
      return '生成処理を完了できませんでした。';
  }
}
