import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryRepository, doc } from '../apps/api/src/adapters.ts';
import { frozenCorrections } from '../apps/api/src/correction-input.ts';

const change = (stepId: string, after: string) => ({ stepId, field: 'text', before: '前', after });
test('corrections are scoped, latest per field, bounded and separate facts from notes', async () => {
    const db = new MemoryRepository();
    const add = (id: string, orgId: string, learnerId: string, taskId: string, createdAt: string, changes: object[], extra: object = {}) =>
        db.put('draftCorrections', doc(orgId, { id, learnerId, taskId, createdAt, draftRevision: 1, changes, ...extra }));
    add('old', 'demo', 'a', 'task', '2026-01-01T00:00:00.000Z', [change('s', '古い'), change('other', '残す')], { contextSummary: { editSummary: '旧要約', nextDraftHint: '旧参考', reviewFlags: [] } });
    add('new', 'demo', 'a', 'task', '2026-01-02T00:00:00.000Z', [change('s', '新しい')], { contextSummary: { editSummary: '新要約', nextDraftHint: '新参考', reviewFlags: [] } });
    add('other-org', 'other', 'a', 'task', '2026-01-03T00:00:00.000Z', [change('s', 'secret')]);
    add('other-person', 'demo', 'b', 'task', '2026-01-03T00:00:00.000Z', [change('s', 'secret')]);
    add('other-task', 'demo', 'a', 'other', '2026-01-03T00:00:00.000Z', [change('s', 'secret')]);
    const result = await frozenCorrections(db, 'demo', 'a', 'task');
    assert.deepEqual(result.map(c => c.correctionId), ['new', 'old']);
    assert.equal(result[0].changes[0].after, '新しい');
    assert.equal(result[0].contextSummary?.editSummary, '新要約');
    assert.deepEqual(result[1].changes.map(c => c.stepId), ['other']);
    assert.equal(result[1].contextSummary, undefined);
    assert.equal(JSON.stringify(result).includes('secret'), false);
    for (let i = 0; i < 25; i++) add(`extra-${i}`, 'demo', 'a', 'task', `2026-02-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`, [change(`step-${i}`, `${i}`)]);
    assert.equal((await frozenCorrections(db, 'demo', 'a', 'task')).length, 20);
});
