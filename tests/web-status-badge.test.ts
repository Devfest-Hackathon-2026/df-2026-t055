import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import React from 'react';
import ts from 'typescript';

const compiled = ts
  .transpileModule(
    await readFile(new URL('../apps/web/src/status-badge.tsx', import.meta.url), 'utf8'),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
    },
  )
  .outputText.replace("'react'", JSON.stringify(import.meta.resolve('react')));
const { StatusBadge, badgeIcons, badgeKindOf } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
);

function nodes(tree: any): any[] {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!React.isValidElement(tree)) return [];
  return [tree, ...nodes((tree.props as any).children)];
}

test('状態バッジは色以外に絵の種類が状態ごとに違い、絵は支援技術から隠す', () => {
  const kinds = ['wait', 'progress', 'ok', 'fail'] as const;
  assert.equal(new Set(kinds.map((k) => badgeIcons[k])).size, kinds.length);
  for (const kind of kinds) {
    const tree = (StatusBadge as any)({ kind, children: '表示文字' });
    const svg = nodes(tree).find((n) => n.type === 'svg');
    assert.equal((svg.props as any)['aria-hidden'], 'true');
    assert.equal((nodes(svg).find((n) => n.type === 'path').props as any).d, badgeIcons[kind]);
    assert.match((tree.props as any).className, new RegExp(`badge-${kind}`));
  }
  assert.equal(badgeKindOf('succeeded'), 'ok');
  assert.equal(badgeKindOf('failed'), 'fail');
  assert.equal(badgeKindOf('running'), 'progress');
});

test('CSSだけで描く状態バッジも状態ごとに違う絵を持つ', async () => {
  const css = await readFile(new URL('../apps/web/src/style.css', import.meta.url), 'utf8');
  const pictures = ['wait', 'progress', 'ok', 'fail'].map(
    (k) => css.match(new RegExp(`\\.badge-css\\.badge-${k}\\{--badge-pic:([^}]+)\\}`))?.[1],
  );
  assert.ok(pictures.every(Boolean));
  assert.equal(new Set(pictures).size, 4);
});
