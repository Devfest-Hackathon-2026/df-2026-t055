import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearWaiting,
  flushSafety,
  hold,
  readSafety,
  storageFailed,
  type Store,
} from '../apps/web/src/safety.ts';

for (const failure of ['get', 'set', 'both']) {
  test(`${failure}Item例外でも停止と同じイベントIDをメモリに保ち再送する`, async () => {
    const data = new Map<string, string>();
    const store: Store = {
      getItem: (key) => {
        if (failure !== 'set') throw Error('読取不可');
        return data.get(key) ?? null;
      },
      setItem: (key, value) => {
        if (failure !== 'get') throw Error('保存不可');
        data.set(key, value);
      },
      removeItem: () => {},
    };
    const stop = { type: 'stop' as const, clientEventId: 'stop', expectedRevision: 1 };
    assert.equal(hold(store, 's', stop).stopped, true);
    hold(store, 's', { ...stop, clientEventId: 'repeated' });
    clearWaiting(store, 's');
    assert.equal(storageFailed(store, 's'), true);
    assert.equal(
      await flushSafety(store, 's', {
        send: async () => {
          throw Error('offline');
        },
        load: async () => ({ status: 'active', revision: 2 }),
      }),
      false,
    );
    assert.deepEqual(readSafety(store, 's').pending, [stop]);
    const sent: string[] = [];
    assert.equal(
      await flushSafety(store, 's', {
        send: async (event) => {
          sent.push(event.clientEventId);
        },
        load: async () => ({ status: 'active', revision: 2 }),
      }),
      true,
    );
    assert.deepEqual(sent, ['stop']);
    hold(store, 's', { ...stop, clientEventId: 'after-delivery' });
    assert.deepEqual(readSafety(store, 's'), { stopped: true, waiting: false, pending: [] });
  });
}

test('offline stop keeps its event ID through reload, repeated taps and retry', async () => {
  const data = new Map<string, string>();
  const store: Store = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
  hold(store, 's', { type: 'help', clientEventId: 'help', expectedRevision: 1 });
  hold(store, 's', { type: 'stop', clientEventId: 'stop', expectedRevision: 1 });
  hold(store, 's', { type: 'stop', clientEventId: 'second', expectedRevision: 2 });
  clearWaiting(store, 's');
  assert.equal(
    await flushSafety(store, 's', {
      send: async () => {
        throw Error('offline');
      },
      load: async () => ({ status: 'active', revision: 2 }),
    }),
    false,
  );
  assert.equal(readSafety(store, 's').stopped, true);
  const sent: string[] = [];
  assert.equal(
    await flushSafety(store, 's', {
      send: async (event) => {
        sent.push(event.clientEventId);
      },
      load: async () => ({ status: 'active', revision: 2 }),
    }),
    true,
  );
  assert.deepEqual(sent, ['stop']);
  hold(store, 's', { type: 'help', clientEventId: 'late-help', expectedRevision: 2 });
  assert.deepEqual(readSafety(store, 's').pending, []);
  assert.equal(readSafety(store, 's').stopped, true);
});
