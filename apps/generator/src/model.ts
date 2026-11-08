import { readFile } from 'node:fs/promises';
import { validateProposal, type Proposal } from '../../../packages/shared/src/index.ts';
export type ModelInput = {
    videoUri: string;
    title: string;
    completionCriteria: string;
    preferences: {
        sentenceLength: number;
        splitHints: string;
        audioGuidance: boolean;
    };
    durationMs: number;
};
export interface VideoModel {
    generate(input: ModelInput, signal?: AbortSignal): Promise<unknown>;
}
// Development fixtures use a 120-second timeline, scaled to the uploaded source video.
// This allowlist excludes learner names, diagnoses, and operation histories.
export class FakeModel implements VideoModel {
    async generate(input: ModelInput) {
        const filename = input.preferences.splitHints.includes('11') ? 'towel-b.json' : 'towel-a.json';
        const p = JSON.parse(await readFile(new URL(`../fixtures/${filename}`, import.meta.url), 'utf8')) as Proposal;
        return { ...p, steps: p.steps.map(s => ({
                ...s, startMs: Math.floor(s.startMs * input.durationMs / 120000), endMs: Math.floor(s.endMs * input.durationMs / 120000), frameMs: Math.floor(s.frameMs * input.durationMs / 120000)
            })) };
    }
}
export { validateProposal };
