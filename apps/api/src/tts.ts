import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const exec = promisify(execFile);
export type TtsAudio = { bytes: Buffer; mimeType: 'audio/wav'; durationMs: number };
// Only the short sentence selected and verified by staff at approval may enter this port.
export interface TtsAdapter {
    synthesize(approvedText: string): Promise<TtsAudio>;
}
export class FakeTtsAdapter implements TtsAdapter {
    async synthesize(approvedText: string): Promise<TtsAudio> {
        const durationMs = Math.max(500, Array.from(approvedText).length * 150);
        const dir = await mkdtemp(join(tmpdir(), 't055-tts-'));
        try {
            const output = join(dir, 'placeholder.wav');
            await exec('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', String(durationMs / 1000), '-c:a', 'pcm_s16le', '-y', output], { timeout: 10000 });
            return { bytes: await readFile(output), mimeType: 'audio/wav', durationMs };
        } finally {
            await rm(dir, { recursive: true, force: true });
        }
    }
}
// Connection skeleton: supply an ADC-authenticated Vertex transport after GCP verification.
// It receives only approved text and the explicitly selected model; never fall back to Fake.
export type VertexTtsTransport = (input: { model: string; text: string }) => Promise<TtsAudio>;
export class VertexTtsAdapter implements TtsAdapter {
    constructor(readonly model = 'gemini-2.5-flash-tts', private transport?: VertexTtsTransport) {}
    async synthesize(approvedText: string): Promise<TtsAudio> {
        if (!this.transport) throw Error('VERTEX_TTS_NOT_CONFIGURED');
        return this.transport({ model: this.model, text: approvedText });
    }
}
export function configuredTts(env = process.env): TtsAdapter {
    switch (env.TTS_PROVIDER ?? 'fake') {
        case 'fake': return new FakeTtsAdapter();
        case 'vertex': return new VertexTtsAdapter(env.TTS_MODEL ?? 'gemini-2.5-flash-tts');
        default: throw Error('INVALID_TTS_PROVIDER');
    }
}
