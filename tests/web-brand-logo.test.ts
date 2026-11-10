import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// The header lives in the large App component, which these tests do not render,
// so the source text and stylesheet are inspected instead (the login screen is
// rendered in web-auth.test.ts).
const main = await readFile(new URL('../apps/web/src/main.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../apps/web/src/style.css', import.meta.url), 'utf8');

test('header link contains the brand logo image', () => {
  const header = main.slice(main.indexOf('<header>'), main.indexOf('</header>'));
  const link = header.slice(header.indexOf('<a'), header.indexOf('</a>'));
  assert.match(link, /href='#'/);
  assert.match(link, /className='brand'/);
  assert.match(link, /<img src='\/shigodeki-logo\.png' alt='しごでき' className='brand-logo' \/>/);
});

test('brand logo styles override the generic image rule', () => {
  assert.match(css, /header a\.brand\{[^}]*background:#fff/);
  assert.match(css, /\.brand-logo,\.login-logo\{background:none;border-radius:0;max-height:none\}/);
});

test('logo asset exists and is a PNG', async () => {
  const bytes = await readFile(new URL('../apps/web/public/shigodeki-logo.png', import.meta.url));
  assert.deepEqual([...bytes.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
});
