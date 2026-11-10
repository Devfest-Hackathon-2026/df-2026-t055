import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

export const implementations = ['unknown', 'not_implemented', 'partial', 'present', 'implemented'];
export const verifications = ['unverified', 'automated', 'manual'];
const authorities = [
  'normative',
  'policy',
  'operational',
  'reference',
  'example',
  'evidence',
  'historical',
  'navigation',
];
const ignored = new Set([
  '.git',
  '.devenv',
  '.local',
  '.containers',
  'node_modules',
  'dist',
  'build',
  'out',
]);
const text = (v) => typeof v === 'string' && v.trim().length > 0;
const strings = (v) => Array.isArray(v) && v.every(text);
const portable = (p) => p.split(path.sep).join('/');

function filesIn(root, dir = root) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      if (ignored.has(entry.name)) return [];
      const p = path.join(dir, entry.name);
      return entry.isDirectory() ? filesIn(root, p) : [portable(path.relative(root, p))];
    })
    .sort();
}

export function parseMarkdown(source, filename) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { path: filename, metadata: null, body: source };
  const yaml = parseDocument(match[1], { uniqueKeys: true });
  if (yaml.errors.length)
    throw Error(`${filename}: ${yaml.errors.map((e) => e.message).join('; ')}`);
  const metadata = yaml.toJS({ maxAliasCount: 50 });
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata))
    throw Error(`${filename}: frontmatter must be a mapping`);
  return { path: filename, metadata, body: source.slice(match[0].length) };
}

export function readBundle(root) {
  const files = filesIn(root);
  const documents = files
    .filter((p) => p.startsWith('docs/') && p.endsWith('.md'))
    .map((p) => parseMarkdown(fs.readFileSync(path.join(root, p), 'utf8'), p));
  return { root, files, documents };
}

function unfenced(source) {
  let fence = null;
  return source
    .split(/\r?\n/)
    .filter((line) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = marker[1];
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
        return false;
      }
      return !fence;
    })
    .join('\n');
}

export function localLinks(document) {
  const body = unfenced(document.body).replace(/`[^`\n]*`/g, '');
  return [...body.matchAll(/!?\[[^\]\n]*\]\((<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\)/g)]
    .map((m) => m[1].replace(/^<|>$/g, ''))
    .filter((href) => !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href));
}

function anchors(document) {
  const seen = new Map();
  return new Set(
    [...unfenced(document.body).matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)].map((m) => {
      const slug = m[1]
        .toLowerCase()
        .replace(/<[^>]*>/g, '')
        .replace(/[^\p{L}\p{N}\p{M}_\- ]/gu, '')
        .replaceAll(' ', '-');
      const n = seen.get(slug) || 0;
      seen.set(slug, n + 1);
      return n ? `${slug}-${n}` : slug;
    }),
  );
}

function resolveLocal(root, from, href) {
  const [urlPath, fragment] = href.split('#', 2);
  const decoded = decodeURIComponent(urlPath);
  const absolute = decoded.startsWith('/')
    ? path.resolve(root, 'docs', `.${decoded}`)
    : path.resolve(root, path.dirname(from), decoded || path.basename(from));
  const relative = portable(path.relative(root, absolute));
  if (relative.startsWith('../') || path.isAbsolute(relative))
    throw Error(`path escapes repository: ${href}`);
  return { absolute, relative, fragment: fragment ? decodeURIComponent(fragment) : null };
}

function existingReference(root, ref) {
  if (!text(ref) || path.isAbsolute(ref) || ref.includes('\\') || ref.split('/').includes('..'))
    return false;
  const target = path.resolve(root, ref);
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return false;
  const relative = path.relative(fs.realpathSync(root), fs.realpathSync(target));
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function validateBundle(bundle) {
  const { root, files, documents } = bundle;
  const errors = [];
  const ids = new Set();
  const documentsByPath = new Map(documents.map((d) => [d.path, d]));
  for (const p of files.filter(
    (p) => /\.(?:md|mdx|pdf|txt)$/i.test(p) && !p.startsWith('docs/') && p !== 'README.md',
  )) {
    if (
      p === 'AGENTS.md' &&
      fs.lstatSync(path.join(root, p)).isSymbolicLink() &&
      fs.readlinkSync(path.join(root, p)) === 'docs/AGENTS.md'
    )
      continue;
    errors.push(`${p}: document must live in docs/`);
  }
  const agentLink = path.join(root, 'AGENTS.md');
  if (
    !fs.existsSync(agentLink) ||
    !fs.lstatSync(agentLink).isSymbolicLink() ||
    fs.readlinkSync(agentLink) !== 'docs/AGENTS.md'
  )
    errors.push('AGENTS.md: expected discovery symlink to docs/AGENTS.md');
  for (const d of documents) {
    const m = d.metadata;
    const reserved = ['index.md', 'log.md'].includes(path.basename(d.path));
    if (!reserved && !m) errors.push(`${d.path}: missing YAML frontmatter`);
    if (m && !reserved) {
      for (const k of ['type', 'title', 'authority', 'status'])
        if (!text(m[k])) errors.push(`${d.path}: missing ${k}`);
      if (!authorities.includes(m.authority)) errors.push(`${d.path}: invalid authority`);
      if (!['draft', 'stable', 'deprecated'].includes(m.status))
        errors.push(`${d.path}: invalid document status`);
      if (d.path.startsWith('docs/archive/') && m.authority !== 'historical')
        errors.push(`${d.path}: archive must be historical`);
    }
    if (d.path.startsWith('docs/features/') && !reserved && m?.type !== 'Feature')
      errors.push(`${d.path}: feature document must have type Feature`);
    if (m?.type === 'Feature') {
      if (!d.path.startsWith('docs/features/') || m.authority !== 'normative')
        errors.push(`${d.path}: feature must be normative and live in docs/features/`);
      if (!text(m.feature_id) || !/^[a-z][a-z\d-]*$/.test(m.feature_id))
        errors.push(`${d.path}: invalid feature_id`);
      if (ids.has(m.feature_id)) errors.push(`${d.path}: duplicate feature_id ${m.feature_id}`);
      ids.add(m.feature_id);
      if (!text(m.description) || !text(m.owner))
        errors.push(`${d.path}: description and owner are required`);
      if (!['core', 'optional'].includes(m.scope)) errors.push(`${d.path}: invalid scope`);
      if (!implementations.includes(m.implementation))
        errors.push(`${d.path}: invalid implementation`);
      if (!verifications.includes(m.verification)) errors.push(`${d.path}: invalid verification`);
      if (!/^[a-f\d]{40}$/.test(m.assessed_commit || ''))
        errors.push(`${d.path}: assessed_commit must be a full code SHA`);
      for (const field of ['code', 'tests', 'evidence', 'issues', 'gaps'])
        if (!strings(m[field])) errors.push(`${d.path}: ${field} must be a string list`);
      for (const field of ['code', 'tests', 'evidence']) {
        for (const ref of Array.isArray(m[field]) ? m[field] : []) {
          if (!existingReference(root, ref))
            errors.push(`${d.path}: invalid ${field} reference ${ref}`);
          if (field === 'evidence' && (typeof ref !== 'string' || !ref.startsWith('docs/')))
            errors.push(`${d.path}: evidence must live in docs/`);
          if (field === 'tests' && (typeof ref !== 'string' || !ref.startsWith('tests/')))
            errors.push(`${d.path}: test reference must live in tests/`);
        }
      }
      for (const url of Array.isArray(m.issues) ? m.issues : [])
        if (
          typeof url !== 'string' ||
          !/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/.test(url)
        )
          errors.push(`${d.path}: invalid issue URL ${url}`);
      if (
        ['present', 'implemented'].includes(m.implementation) &&
        (!m.code?.length || !m.evidence?.length)
      )
        errors.push(`${d.path}: code and evidence required for ${m.implementation}`);
      if (['partial', 'not_implemented', 'present'].includes(m.implementation) && !m.gaps?.length)
        errors.push(`${d.path}: gaps required for ${m.implementation}`);
      if (
        m.verification !== 'unverified' &&
        (!m.evidence?.length || (m.verification === 'automated' && !m.tests?.length))
      )
        errors.push(
          `${d.path}: verification needs evidence and automated verification needs tests`,
        );
    }
    for (const href of localLinks(d)) {
      try {
        const link = resolveLocal(root, d.path, href);
        if (!fs.existsSync(link.absolute)) {
          errors.push(`${d.path}: broken link ${href}`);
          continue;
        }
        const actual = path.relative(fs.realpathSync(root), fs.realpathSync(link.absolute));
        if (actual.startsWith('..') || path.isAbsolute(actual)) {
          errors.push(`${d.path}: link escapes repository ${href}`);
          continue;
        }
        if (link.fragment && link.relative.endsWith('.md')) {
          const target =
            documentsByPath.get(link.relative) ||
            parseMarkdown(fs.readFileSync(link.absolute, 'utf8'), link.relative);
          if (!anchors(target).has(link.fragment)) errors.push(`${d.path}: missing anchor ${href}`);
        }
      } catch (e) {
        errors.push(`${d.path}: ${e.message}`);
      }
    }
  }
  if (!ids.size) errors.push('docs/features/: no feature documents');
  const dirs = new Set(documents.map((d) => path.posix.dirname(d.path)));
  for (const dir of dirs) {
    const index = documentsByPath.get(`${dir}/index.md`);
    if (!index) {
      errors.push(`${dir}: missing index.md`);
      continue;
    }
    const indexed = new Set(
      localLinks(index).map((href) => resolveLocal(root, index.path, href).relative),
    );
    for (const d of documents.filter(
      (d) =>
        path.posix.dirname(d.path) === dir &&
        !['index.md', 'log.md'].includes(path.basename(d.path)),
    ))
      if (!indexed.has(d.path)) errors.push(`${index.path}: missing entry ${d.path}`);
    for (const subdir of [...dirs].filter((subdir) => path.posix.dirname(subdir) === dir))
      if (!indexed.has(`${subdir}/index.md`))
        errors.push(`${index.path}: missing directory ${subdir}`);
  }
  return errors;
}

export function featureList(bundle, filters = {}) {
  const all = bundle.documents
    .filter((d) => d.metadata?.type === 'Feature')
    .map((d) => ({ ...d.metadata, id: d.path.slice(5, -3), path: d.path }))
    .sort((a, b) => a.feature_id.localeCompare(b.feature_id));
  const count = (field, values) =>
    Object.fromEntries(values.map((v) => [v, all.filter((f) => f[field] === v).length]));
  const features = all.filter(
    (f) =>
      (!filters.implementation || f.implementation === filters.implementation) &&
      (!filters.verification || f.verification === filters.verification),
  );
  return {
    schemaVersion: 1,
    total: all.length,
    selected: features.length,
    summary: {
      implementation: count('implementation', implementations),
      verification: count('verification', verifications),
    },
    features,
  };
}

export function issueList(bundle) {
  const p = path.join(bundle.root, 'docs/development/issues.json');
  const snapshot = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
  const items = new Map((snapshot?.issues || []).map((i) => [i.url, { ...i, docs: [] }]));
  for (const feature of featureList(bundle).features)
    for (const url of feature.issues) {
      if (!items.has(url))
        items.set(url, {
          url,
          state: null,
          title: null,
          number: Number(url.split('/').at(-1)),
          docs: [],
        });
      items.get(url).docs.push(feature.path);
    }
  return {
    schemaVersion: 1,
    fetched_at: snapshot?.fetched_at || null,
    snapshot_complete: snapshot?.complete ?? false,
    issues: [...items.values()].sort((a, b) => a.url.localeCompare(b.url, 'en', { numeric: true })),
  };
}

export function run(argv, root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')) {
  const [command, ...args] = argv;
  if (!['list', 'check', 'issues'].includes(command))
    throw Error(
      'Usage: docs.mjs list|check|issues [--json] [--implementation VALUE] [--verification VALUE]',
    );
  const filters = {};
  let json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') json = true;
    else if (command === 'list' && ['--implementation', '--verification'].includes(args[i])) {
      const key = args[i].slice(2),
        value = args[++i];
      if (!(key === 'implementation' ? implementations : verifications).includes(value))
        throw Error(`Invalid ${key}: ${value}`);
      filters[key] = value;
    } else throw Error(`Unknown argument: ${args[i]}`);
  }
  const bundle = readBundle(root);
  const errors = validateBundle(bundle);
  if (errors.length) throw Error(errors.join('\n'));
  if (command === 'check')
    return json
      ? JSON.stringify(
          {
            schemaVersion: 1,
            documents: bundle.documents.length,
            features: featureList(bundle).total,
            errors: [],
          },
          null,
          2,
        )
      : `Documentation OK: ${bundle.documents.length} documents, ${featureList(bundle).total} features`;
  if (command === 'issues') {
    const result = issueList(bundle);
    return json
      ? JSON.stringify(result, null, 2)
      : result.issues
          .map(
            (i) =>
              `${i.url}\t${i.state || 'unknown'}\t${[...i.docs, ...(i.process_docs || [])].join(', ')}`,
          )
          .join('\n');
  }
  const result = featureList(bundle, filters);
  return json
    ? JSON.stringify(result, null, 2)
    : [
        'FEATURE\tIMPLEMENTATION\tVERIFICATION\tCODE SHA\tTITLE',
        ...result.features.map(
          (f) =>
            `${f.feature_id}\t${f.implementation}\t${f.verification}\t${f.assessed_commit.slice(0, 7)}\t${f.title}`,
        ),
        `${result.selected}/${result.total} features`,
      ].join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(run(process.argv.slice(2)) + '\n');
  } catch (error) {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  }
}
