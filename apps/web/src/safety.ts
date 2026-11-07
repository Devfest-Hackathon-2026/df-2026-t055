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
export function safetyKey(uid: string, sessionId: string) {
    return `safety:${uid}:${sessionId}`;
}
export function readSafety(store: Store, key: string): SafetyState {
    const value = store.getItem(key);
    return value ? JSON.parse(value) : { stopped: false, waiting: false, pending: [] };
}
// Persist before issuing a network request; stopped is retained after acknowledgement.
export function hold(store: Store, key: string, event: SafetyEvent) {
    const s = readSafety(store, key);
    if (event.type === 'stop')
        s.stopped = true;
    else
        s.waiting = true;
    s.pending.push(event);
    store.setItem(key, JSON.stringify(s));
    return s;
}
export function delivered(store: Store, key: string, eventId: string) {
    const s = readSafety(store, key);
    s.pending = s.pending.filter(e => e.clientEventId !== eventId);
    store.setItem(key, JSON.stringify(s));
    return s;
}
export function clearWaiting(store: Store, key: string) {
    const s = readSafety(store, key);
    s.waiting = false;
    store.setItem(key, JSON.stringify(s));
}
