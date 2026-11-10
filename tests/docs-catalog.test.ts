import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = new URL('../scripts/docs.mjs', import.meta.url);
const invoke = (...args: string[]) =>
  spawnSync(process.execPath, [script.pathname, ...args], { encoding: 'utf8' });
const metadata = {
  type: 'Feature',
  title: 'Example',
  description: 'A feature',
  authority: 'normative',
  status: 'stable',
  feature_id: 'example',
  scope: 'core',
  implementation: 'present',
  verification: 'unverified',
  assessed_commit: 'a'.repeat(40),
  owner: 'unassigned',
  issues: [],
  code: ['src/example.ts'],
  tests: ['tests/example.test.ts'],
  evidence: ['docs/audit.md'],
  gaps: ['Real environment unverified'],
};
const yaml = (m: object) =>
  '---\n' +
  Object.entries(m)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n') +
  '\n---\n';

function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'shigodeki-docs-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (p: string, body: string) => {
    const target = join(root, p);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, body);
  };
  write('README.md', '# Product');
  write(
    'docs/AGENTS.md',
    yaml({ type: 'Policy', title: 'Agents', authority: 'policy', status: 'stable' }) + '# Agents',
  );
  symlinkSync('docs/AGENTS.md', join(root, 'AGENTS.md'));
  write(
    'docs/audit.md',
    yaml({ type: 'Audit', title: 'Audit', authority: 'evidence', status: 'stable' }) + '# Audit',
  );
  write(
    'docs/index.md',
    '# Docs\n\n- [Agents](AGENTS.md)\n- [Evidence](audit.md)\n- [Features](features/index.md)\n',
  );
  write('docs/features/index.md', '# Features\n\n- [Example](example.md)\n');
  write(
    'docs/features/example.md',
    yaml(metadata) + '# Example\n\n[Audit](../audit.md#Audit)\n'.replace('#Audit', '#audit'),
  );
  write('src/example.ts', 'export const example = true;');
  write('tests/example.test.ts', '// reference fixture');
  return { root, write };
}

function inspect(root: string) {
  const code = `import { readBundle, validateBundle, featureList } from ${JSON.stringify(script.href)};
    try { const bundle = readBundle(process.argv[1]); console.log(JSON.stringify({ errors: validateBundle(bundle), list: featureList(bundle) })); }
    catch (e) { console.log(JSON.stringify({ errors: [e.message] })); }`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code, root], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout) as { errors: string[]; list?: { total: number } };
}

test('catalog JSON contains every feature and filters without changing totals', () => {
  const result = invoke('list', '--json');
  assert.equal(result.status, 0, result.stderr);
  const all = JSON.parse(result.stdout);
  assert.equal(all.total, all.features.length);
  assert.equal(all.selected, all.total);
  assert.equal(
    Object.values(all.summary.implementation).reduce((a: number, b) => a + Number(b), 0),
    all.total,
  );
  assert.ok(all.features.some((f: { feature_id: string }) => f.feature_id === 'speech-input'));
  assert.ok(all.features.every((f: { path: string }) => f.path.startsWith('docs/features/')));
  const filtered = invoke('list', '--implementation', 'not_implemented', '--json');
  assert.equal(filtered.status, 0, filtered.stderr);
  const selected = JSON.parse(filtered.stdout);
  assert.equal(selected.total, all.total);
  assert.equal(selected.selected, all.summary.implementation.not_implemented);
  assert.ok(
    selected.features.every(
      (f: { implementation: string }) => f.implementation === 'not_implemented',
    ),
  );
  assert.notEqual(invoke('list', '--implementation', 'typo').status, 0);
  assert.notEqual(invoke('list', '--typo').status, 0);
});

test('issue listing preserves snapshot time and derives feature references from current documents', () => {
  const result = invoke('issues', '--json');
  assert.equal(result.status, 0, result.stderr);
  const list = JSON.parse(result.stdout);
  assert.ok(list.fetched_at);
  const speech = list.issues.find((i: { number: number }) => i.number === 76);
  assert.ok(speech.docs.includes('docs/features/speech-input.md'));
  assert.ok(['OPEN', 'CLOSED'].includes(speech.state));
});

test('valid local YAML concept bundle passes, including extensions and the AGENTS discovery link', (t) => {
  const f = fixture(t);
  f.write(
    'docs/features/example.md',
    yaml({ ...metadata, custom_extension: 'preserved' }) + '# Example',
  );
  assert.deepEqual(inspect(f.root).errors, []);
});

test('duplicate YAML keys and duplicate feature IDs are rejected', (t) => {
  const f = fixture(t);
  f.write(
    'docs/features/example.md',
    yaml(metadata).replace('type: "Feature"', 'type: "Feature"\ntype: "Other"') + '# Example',
  );
  assert.match(inspect(f.root).errors.join('\n'), /unique|duplicate/i);
  f.write('docs/features/example.md', yaml(metadata) + '# Example');
  f.write('docs/features/duplicate.md', yaml(metadata) + '# Duplicate');
  assert.match(inspect(f.root).errors.join('\n'), /duplicate feature_id/);
});

test('invalid implementation and undocumented verification cannot appear as progress', (t) => {
  const f = fixture(t);
  f.write(
    'docs/features/example.md',
    yaml({
      ...metadata,
      implementation: 'done',
      verification: 'automated',
      evidence: [],
      tests: [],
    }) + '# Example',
  );
  const errors = inspect(f.root).errors.join('\n');
  assert.match(errors, /invalid implementation/);
  assert.match(errors, /verification needs evidence/);
});

test('missing code, broken local links and missing anchors fail integrity checking', (t) => {
  const f = fixture(t);
  f.write(
    'docs/features/example.md',
    yaml({ ...metadata, code: ['src/missing.ts'] }) +
      '# Example\n\n[Missing](../missing.md)\n\n[Wrong anchor](../audit.md#missing)',
  );
  const errors = inspect(f.root).errors.join('\n');
  assert.match(errors, /invalid code reference/);
  assert.match(errors, /broken link/);
  assert.match(errors, /missing anchor/);
});

test('unindexed concepts, misplaced documentation and metadata paths escaping the repo are rejected', (t) => {
  const f = fixture(t);
  f.write('NOTES.md', '# Misplaced');
  f.write(
    'docs/forgotten.md',
    yaml({ type: 'Note', title: 'Forgotten', authority: 'reference', status: 'stable' }) +
      '# Forgotten',
  );
  f.write(
    'docs/features/example.md',
    yaml({ ...metadata, code: ['../../outside.ts'] }) + '# Example',
  );
  const errors = inspect(f.root).errors.join('\n');
  assert.match(errors, /document must live in docs/);
  assert.match(errors, /missing entry docs\/forgotten.md/);
  assert.match(errors, /invalid code reference/);
});

test('legacy Issue links keep all old section headings in the compatibility document', () => {
  const record = JSON.parse(
    readFileSync(new URL('../docs/development/spec-migration.json', import.meta.url), 'utf8'),
  );
  const bridge = readFileSync(new URL('../docs/PRODUCT_SPEC.md', import.meta.url), 'utf8');
  const headings = [...bridge.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(
    headings,
    record.sections.map((section: { heading: string }) => section.heading),
  );
  assert.equal(headings.length, 15);
});

test('migration record covers all original requirement lines exactly once', () => {
  const record = JSON.parse(
    readFileSync(new URL('../docs/development/spec-migration.json', import.meta.url), 'utf8'),
  );
  const coverage: number[] = [];
  for (const fragment of record.fragments)
    for (let n = fragment.start; n <= fragment.end; n++) coverage.push(n);
  assert.deepEqual(
    coverage,
    Array.from(
      { length: record.sourceLineCount - record.supersededPrelude.end },
      (_, i) => i + record.supersededPrelude.end + 1,
    ),
  );
  assert.ok(
    record.fragments.every(
      (f: { target: string; sha256: string }) =>
        f.target.startsWith('docs/') && /^[a-f\d]{64}$/.test(f.sha256),
    ),
  );
});
