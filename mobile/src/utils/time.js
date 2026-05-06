export const getRemainingTime = (expiresAt) => {
  if (!expiresAt) return 0;
  return Math.max(0, new Date(expiresAt) - new Date());
};

export const formatCountdown = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};