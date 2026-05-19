/**
 * Tiny pub-sub store for the *global* unread notification count.
 *
 * Why this exists: two independent React hooks (the NotificationScreen list
 * and the tab badge) each used to own their own `count` state, and each
 * subscribed to the socket separately. When NotificationScreen marked all
 * notifications as read, the tab badge had no way to know → red "2" stuck
 * on the icon until full reload.
 *
 * Now both hooks read/write through this single store, so any update made
 * anywhere is reflected everywhere instantly. No React Context required –
 * we just keep a module-level number plus a Set of listeners.
 */

let count = 0;
const listeners = new Set();

function notify() {
  for (const fn of listeners) {
    try {
      fn(count);
    } catch {
      // ignore listener errors so one bad subscriber can't break others
    }
  }
}

export function getUnreadCount() {
  return count;
}

export function setUnreadCount(next) {
  const value = Math.max(0, Number(next) || 0);
  if (value === count) return;
  count = value;
  notify();
}

export function incrementUnreadCount(by = 1) {
  setUnreadCount(count + by);
}

export function decrementUnreadCount(by = 1) {
  setUnreadCount(count - by);
}

export function resetUnreadCount() {
  setUnreadCount(0);
}

/**
 * Subscribe to count changes. Returns an unsubscribe fn.
 */
export function subscribeUnreadCount(listener) {
  if (typeof listener !== 'function') return () => undefined;
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
