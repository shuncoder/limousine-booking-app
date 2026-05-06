import { useEffect, useState } from 'react';

function secondsLeft(expireAt) {
  if (!expireAt) return 0;
  const target = new Date(expireAt).getTime();
  if (!Number.isFinite(target)) return 0;
  return Math.max(0, Math.floor((target - Date.now()) / 1000));
}

/**
 * Counts down to the earliest expiry from a list of tickets / dates and
 * exposes a formatted m:ss string. Pure logic — drop-in for any UI.
 */
export default function usePaymentCountdown(expiresAtList) {
  const earliest = (() => {
    const list = (Array.isArray(expiresAtList) ? expiresAtList : []).filter(Boolean);
    if (!list.length) return null;
    return list
      .slice()
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
  })();

  const [leftSeconds, setLeftSeconds] = useState(() => secondsLeft(earliest));

  useEffect(() => {
    setLeftSeconds(secondsLeft(earliest));
    const interval = setInterval(() => {
      setLeftSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [earliest]);

  const minutes = Math.floor(leftSeconds / 60);
  const seconds = leftSeconds % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { leftSeconds, formatted, expired: leftSeconds === 0, setLeftSeconds };
}
