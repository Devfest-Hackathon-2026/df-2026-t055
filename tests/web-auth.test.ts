import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import React from 'react';
import { subscribeSupport } from '../apps/web/src/support-ws.ts';

// Run the actual login handler with fake hooks, as in web-draft-review.test.ts.
const hookSource = `import React from '${import.meta.resolve('react')}';
let state=[], cursor=0;
export default React;
export function begin(){cursor=0;}
export function reset(){state=[];begin();}
export function useState(initial){const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],v=>{state[i]=typeof v==='function'?v(state[i]):v}];}`;
const hookUrl = 'data:text/javascript;base64,' + Buffer.from(hookSource).toString('base64');
const hooks = await import(hookUrl);
const source = await readFile(new URL('../apps/web/src/main.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(
  `import React, {useState} from ${JSON.stringify(hookUrl)};
const firebaseSession={signIn:(...args)=>globalThis.loginSignIn(...args)};
export ${source.slice(source.indexOf('function FirebaseLogin('), source.indexOf('\ntype Action ='))}`,
  {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  },
).outputText;
const { FirebaseLogin } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
);
function nodes(tree: any): any[] {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!React.isValidElement(tree)) return [];
  return [tree, ...nodes((tree.props as any).children)];
}
function renderLogin(error = '') {
  hooks.begin();
  return FirebaseLogin({ error });
}

test('failed login highlights the error and asks to check both email and password', async (t) => {
  hooks.reset();
  const credentials: string[][] = [];
  t.after(() => Reflect.deleteProperty(globalThis, 'loginSignIn'));
  (globalThis as any).loginSignIn = async (...args: string[]) => {
    credentials.push(args);
    throw Error('private authentication error');
  };
  let tree = renderLogin();
  assert.equal(
    nodes(tree).some((n) => n.props.role === 'alert'),
    false,
  );
  nodes(tree)
    .find((n) => n.props.type === 'email')
    .props.onChange({
      target: { value: ' staff@example.invalid ' },
    });
  nodes(tree)
    .find((n) => n.props.type === 'password')
    .props.onChange({
      target: { value: 'wrong-password' },
    });
  tree = renderLogin();
  nodes(tree)
    .find((n) => n.type === 'form')
    .props.onSubmit({ preventDefault() {} });
  await new Promise((resolve) => setImmediate(resolve));
  tree = renderLogin();
  const alert = nodes(tree).find((n) => n.type === 'p' && n.props.role === 'alert');
  assert.ok(alert);
  assert.equal(alert.props.className, 'error');
  assert.equal(
    alert.props.children,
    'ログインできませんでした。メールアドレスとパスワードの両方を確認してください。',
  );
  assert.deepEqual(credentials, [['staff@example.invalid', 'wrong-password']]);
  assert.equal(nodes(tree).find((n) => n.props.type === 'password').props.value, '');
});

test('login preserves the authentication configuration error text and highlights it', () => {
  hooks.reset();
  const tree = renderLogin('認証設定を確認してください。');
  const alert = nodes(tree).find((n) => n.type === 'p' && n.props.role === 'alert');
  assert.ok(alert);
  assert.equal(alert.props.className, 'error');
  assert.equal(alert.props.children, '認証設定を確認してください。');
});

test('web socket fetches a fresh token for each connection and cancels pending authentication on cleanup', async (t) => {
  const previousSocket = globalThis.WebSocket;
  const previousLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const connections: FakeSocket[] = [];
  class FakeSocket {
    static OPEN = 1;
    readyState = 1;
    messages: string[] = [];
    onopen: () => Promise<void> = async () => {};
    onclose: () => void = () => {};
    onmessage: any;
    onerror: any;
    constructor(public url: URL) {
      connections.push(this);
    }
    send(value: string) {
      this.messages.push(value);
    }
    close() {
      this.readyState = 3;
      this.onclose();
    }
  }
  t.mock.timers.enable({ apis: ['setTimeout'] });
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: new URL('https://demo.invalid/me'),
  });
  globalThis.WebSocket = FakeSocket as any;
  let stop: (() => void) | undefined;
  try {
    let calls = 0;
    const statuses: boolean[] = [];
    stop = subscribeSupport(
      async () => 'token-' + ++calls,
      'session',
      (value) => {
        if ((value as any).type !== 'snapshot') throw Error('invalid');
      },
      (value) => statuses.push(value),
    );
    await connections[0].onopen();
    assert.deepEqual(JSON.parse(connections[0].messages[0]), { type: 'auth', idToken: 'token-1' });
    assert.deepEqual(statuses, []); // socket open and auth send are not authenticated snapshots
    connections[0].onmessage({ data: JSON.stringify({ type: 'snapshot' }) });
    assert.deepEqual(statuses, [true]);
    assert.equal(connections[0].url.href, 'wss://demo.invalid/api/v1/ws?sessionId=session');
    connections[0].close();
    assert.deepEqual(statuses, [true, false]);
    t.mock.timers.tick(3000);
    await connections[1].onopen();
    assert.equal(JSON.parse(connections[1].messages[0]).idToken, 'token-2');
    connections[1].onmessage({ data: JSON.stringify({ type: 'invalid' }) });
    assert.deepEqual(statuses, [true, false, false]);
    stop();
    let resolveToken!: (token: string) => void;
    stop = subscribeSupport(
      () =>
        new Promise((resolve) => {
          resolveToken = resolve;
        }),
      undefined,
      () => {},
    );
    const pending = connections[2].onopen();
    stop();
    resolveToken('private');
    await pending;
    assert.deepEqual(connections[2].messages, []);
    t.mock.timers.tick(3000);
    assert.equal(connections.length, 3);
  } finally {
    stop?.();
    globalThis.WebSocket = previousSocket;
    if (previousLocation) Object.defineProperty(globalThis, 'location', previousLocation);
    else Reflect.deleteProperty(globalThis, 'location');
  }
});

test('login screen shows the brand logo above the unchanged heading', () => {
  hooks.reset();
  const all = nodes(renderLogin());
  const img = all.find((n) => n.type === 'img');
  assert.ok(img);
  assert.equal(img.props.src, '/shigodeki-logo.png');
  assert.equal(img.props.alt, 'しごでき');
  assert.equal(img.props.className, 'login-logo');
  const h1 = all.find((n) => n.type === 'h1');
  assert.equal(h1.props.children, 'ログイン');
  assert.ok(all.indexOf(img) < all.indexOf(h1));
});
