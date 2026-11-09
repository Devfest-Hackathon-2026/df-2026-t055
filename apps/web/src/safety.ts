import { z } from 'zod';

export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export type SafetyEvent = {
  clientEventId: string;
  expectedRevision: number;
  type: 'stop' | 'help';
};
export type SafetyState = {
  stopped: boolean;
  waiting: boolean;
  pending: SafetyEvent[];
};
const safetyEventSchema = z.object({
  clientEventId: z.string().min(1),
  expectedRevision: z.number().int().nonnegative(),
  type: z.enum(['stop', 'help']),
});
const safetySchema = z.object({
  stopped: z.boolean(),
  waiting: z.boolean(),
  pending: z.array(safetyEventSchema),
});
const startSchema = z.object({
  taskId: z.string().min(1),
  clientRequestId: z.string().min(1),
  safety: safetyEventSchema.omit({ expectedRevision: true }).optional(),
});
// Keep intent in this page even when browser storage cannot be read or written.
const memory = new WeakMap<Store, Map<string, string | null>>();
const failures = new WeakMap<Store, Set<string>>();
function remember(store: Store, key: string, value: string | null) {
  if (!memory.has(store)) memory.set(store, new Map());
  memory.get(store)!.set(key, value);
}
function failed(store: Store, key: string) {
  if (!failures.has(store)) failures.set(store, new Set());
  failures.get(store)!.add(key);
}
export function storageFailed(store: Store, key: string) {
  return failures.get(store)?.has(key) ?? false;
}
function readStored(store: Store, key: string) {
  if (storageFailed(store, key)) return memory.get(store)?.get(key) ?? null;
  try {
    const value = store.getItem(key);
    remember(store, key, value);
    return value;
  } catch {
    failed(store, key);
    return memory.get(store)?.get(key) ?? null;
  }
}
function writeStored(store: Store, key: string, value: string | null) {
  remember(store, key, value);
  try {
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    failed(store, key);
  }
}
export function safetyKeys(store: Storage, uid: string) {
  const keys = new Set(memory.get(store)?.keys());
  try {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key) keys.add(key);
    }
  } catch {
    failed(store, startKey(uid));
  }
  return [...keys].filter((key) => key.startsWith(`safety:${uid}:`));
}
export function safetyKey(uid: string, sessionId: string) {
  return `safety:${uid}:${sessionId}`;
}
export type PendingStart = {
  taskId: string;
  clientRequestId: string;
  safety?: { type: 'stop' | 'help'; clientEventId: string };
};
export function startKey(uid: string) {
  return `pending-start:${uid}`;
}
export function readStart(store: Store, uid: string): PendingStart | null {
  const key = startKey(uid);
  const value = readStored(store, key);
  try {
    return value === null ? null : startSchema.parse(JSON.parse(value));
  } catch {
    failed(store, key);
    return null;
  }
}
export function saveStart(store: Store, uid: string, start: PendingStart) {
  writeStored(store, startKey(uid), JSON.stringify(start));
}
export function clearStart(store: Store, uid: string) {
  writeStored(store, startKey(uid), null);
}
export function readSafety(store: Store, key: string): SafetyState {
  const value = readStored(store, key);
  try {
    if (value !== null) return safetySchema.parse(JSON.parse(value));
  } catch {
    failed(store, key);
  }
  return { stopped: false, waiting: false, pending: [] };
}
// Persist before issuing a network request; stopped is retained after acknowledgement.
export function hold(store: Store, key: string, event: SafetyEvent) {
  const s = readSafety(store, key);
  // Repeated taps must not create new stop IDs, including after acknowledgement.
  if (s.stopped) return s;
  if (event.type === 'stop') s.stopped = true;
  else s.waiting = true;
  s.pending.push(event);
  writeStored(store, key, JSON.stringify(s));
  return s;
}
export function delivered(store: Store, key: string, eventId: string) {
  const s = readSafety(store, key);
  s.pending = s.pending.filter((e) => e.clientEventId !== eventId);
  writeStored(store, key, JSON.stringify(s));
  return s;
}
export function clearWaiting(store: Store, key: string) {
  const s = readSafety(store, key);
  if (s.stopped || storageFailed(store, key)) return;
  s.waiting = false;
  writeStored(store, key, JSON.stringify(s));
}
export type SafetyTransport = {
  send: (event: SafetyEvent) => Promise<void>;
  load: () => Promise<{
    status: string;
    revision: number;
  }>;
};
export async function flushSafety(
  store: Store,
  key: string,
  transport: SafetyTransport,
): Promise<boolean> {
  const pending = [...readSafety(store, key).pending].sort(
    (a, b) => Number(b.type === 'stop') - Number(a.type === 'stop'),
  );
  for (const event of pending) {
    if (event.type === 'help' && readSafety(store, key).stopped) {
      delivered(store, key, event.clientEventId);
      continue;
    }
    try {
      await transport.send(event);
      delivered(store, key, event.clientEventId);
    } catch (error) {
      if (
        event.type === 'help' &&
        (
          error as {
            status?: number;
          }
        ).status === 409
      ) {
        try {
          const fresh = await transport.load();
          if (fresh.status === 'waiting_help') {
            delivered(store, key, event.clientEventId);
            continue;
          }
          if (fresh.status === 'stopped') {
            const s = readSafety(store, key);
            s.stopped = true;
            writeStored(store, key, JSON.stringify(s));
            delivered(store, key, event.clientEventId);
            continue;
          }
          // An in-flight next may have committed first. Preserve the event ID and wait state.
          if (fresh.status === 'active') {
            const updated = { ...event, expectedRevision: fresh.revision };
            const s = readSafety(store, key);
            s.pending = s.pending.map((e) =>
              e.clientEventId === event.clientEventId ? updated : e,
            );
            writeStored(store, key, JSON.stringify(s));
            await transport.send(updated);
            delivered(store, key, event.clientEventId);
            continue;
          }
        } catch {}
      }
      return false;
    }
  }
  return true;
}
