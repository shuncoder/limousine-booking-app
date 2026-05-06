import { useEffect, useState } from 'react';
import { getRemainingTime } from '../utils/time';

export const useCountdown = (expiresAt) => {
  const [remaining, setRemaining] = useState(
    getRemainingTime(expiresAt)
  );

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const time = getRemainingTime(expiresAt);
      setRemaining(time);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return remaining;
};