import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import React from 'react';
import { hold, readSafety, safetyKey } from '../apps/web/src/safety.ts';

// Run the actual Learner handlers with fake hooks, without a browser or added dependency.
const hookSource = `import React from '${import.meta.resolve('react')}';
let state=[], cursor=0, effects=[];
export default React;
export function begin(){cursor=0;effects=[];}
export function reset(){state=[];begin();}
export function useState(initial){const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],v=>{state[i]=typeof v==='function'?v(state[i]):v}];}
export function useRef(initial){const i=cursor++;return state[i]??=( {current:initial} );}
export function useEffect(fn,deps){const i=cursor++;if(!state[i]||deps.some((v,j)=>v!==state[i][j])){state[i]=deps;effects.push(fn);}}
export async function flush(){for(const fn of effects)fn();await new Promise(r=>setImmediate(r));}`;
const hookUrl = 'data:text/javascript;base64,' + Buffer.from(hookSource).toString('base64');
const hooks = await import(hookUrl);
let source = await readFile(new URL('../apps/web/src/main.tsx', import.meta.url), 'utf8');
source = source.slice(source.indexOf('function Learner(')).replace(/\ncreateRoot.*$/s, '');
source = `import React, {useState,useEffect,useRef} from ${JSON.stringify(hookUrl)};
import {hold, readSafety, flushSafety, safetyKey, clearWaiting} from ${JSON.stringify(new URL('../apps/web/src/safety.ts', import.meta.url).href)};
import {learnerSupportNotificationSchema} from ${JSON.stringify(new URL('../packages/shared/src/support.ts', import.meta.url).href)};
import {learnerStepPresentation} from ${JSON.stringify(new URL('../apps/web/src/learner-display.ts', import.meta.url).href)};
import {learnerControlPath} from ${JSON.stringify(new URL('../apps/web/src/learner-controls.ts', import.meta.url).href)};
let account = 'learner-a';
const api=(...args)=>globalThis.learnerApi(...args); const go=()=>{}; const Asset=()=>null;
const subscribeSupport=()=>()=>{};
const getToken = async () => account;
export ${source}`;
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { Learner } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
function nodes(tree: any): any[] {
    if (Array.isArray(tree)) return tree.flatMap(nodes);
    if (!React.isValidElement(tree)) return [];
    return [tree, ...nodes((tree.props as any).children)];
}
function text(tree: any): string {
    if (Array.isArray(tree)) return tree.map(text).join('');
    if (React.isValidElement(tree)) return text((tree.props as any).children);
    return tree == null ? '' : String(tree);
}
async function settle() { await new Promise(r => setImmediate(r)); }

function harness() {
    hooks.reset();
    const store = new Map<string, string>();
    const local = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); }, get length() { return store.size; }, key: (i: number) => [...store.keys()][i] ?? null };
    (globalThis as any).localStorage = local;
    const timers = new Map<number, () => void>();
    let timerId = 0;
    (globalThis as any).setInterval = (fn: () => void) => { const id = ++timerId; timers.set(id, fn); return id; };
    (globalThis as any).clearInterval = (id: number) => { timers.delete(id); };
    const session = { sessionId: 's1', releaseId: 'r', status: 'active', stepIndex: 0, revision: 5,
        steps: [{ stepId: 's1', imageAssetId: 'img', text: '折る', visibleCaution: '端に注意' }] };
    let failPost = false;
    (globalThis as any).learnerApi = async (path: string, method = 'GET', body?: unknown) => {
        if (method === 'POST') { if (failPost) throw Error('通信失敗'); return { status: 'active', stepIndex: 0, revision: 5 }; }
        if (path === '/me/assignments') return { assignments: [] };
        return structuredClone(session);
    };
    const render = () => { hooks.begin(); return Learner({ uid: 'learner-a', path: '/me/sessions/s1', action: async (fn: any) => fn() }); };
    const key = safetyKey('learner-a', 's1');
    return { render, store, key,
        setWaiting: (pending: any[] = []) => local.setItem(key, JSON.stringify({ stopped: false, waiting: true, pending })),
        setFailPost: (value: boolean) => { failPost = value; },
        tick: async () => { for (const fn of [...timers.values()]) void fn(); await settle(); },
    };
}

test('再開後に再読み込みしても支援待ちが残らない', async () => {
    const h = harness();
    // help は送信済み・職員が再開済みだが、端末の待ち表示だけ残っている状態で読み込む。
    h.setWaiting();
    let tree = h.render(); await hooks.flush(); tree = h.render(); await hooks.flush(); tree = h.render();
    assert.match(text(tree), /職員をよんでいます/);
    await h.tick(); tree = h.render();
    assert.doesNotMatch(text(tree), /職員をよんでいます/);
    assert.match(text(tree), /折る/);
    assert.equal(readSafety((globalThis as any).localStorage, h.key).waiting, false);
});

test('送信待ちの手伝ってが残っている間は待ち表示を解除しない', async () => {
    const h = harness();
    h.setWaiting([{ clientEventId: 'help-1', expectedRevision: 5, type: 'help' }]);
    h.setFailPost(true);
    let tree = h.render(); await hooks.flush(); tree = h.render(); await hooks.flush(); tree = h.render();
    assert.match(text(tree), /職員をよんでいます/);
    await h.tick(); tree = h.render();
    assert.match(text(tree), /職員をよんでいます/);
    assert.equal(readSafety((globalThis as any).localStorage, h.key).waiting, true);
});
