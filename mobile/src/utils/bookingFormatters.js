/**
 * Pure formatting helpers reused across booking-related screens.
 * No React imports here on purpose – this module is UI-agnostic.
 */

export function formatCurrency(value, currency = 'VND') {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch {
    return `${value} ${currency}`;
  }
}

export function formatDateTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Compact "DD/MM HH:mm" – used by driver dashboards. */
export function formatDayTimeShort(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('vi-VN');
}

export function formatTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString('vi-VN');
}

export function formatPointLabel(point, fallback = '--') {
  if (!point) return fallback;
  if (typeof point === 'string') return point;
  const name = String(point.name || '').trim();
  const address = String(point.address || '').trim();
  const label = [name, address].filter(Boolean).join(' - ');
  return label || fallback;
}

/**
 * Like formatPointLabel but uses ' • ' as a separator (used in passenger /
 * ticket detail rows).
 */
export function formatPointDetail(point, fallback = '--') {
  if (!point) return fallback;
  if (typeof point === 'string') return point;
  const name = String(point.name || '').trim();
  const address = String(point.address || '').trim();
  const label = [name, address].filter(Boolean).join(' • ');
  return label || fallback;
}

/**
 * Returns a human-friendly Vietnamese relative time (e.g. "3 phút trước").
 * Falls back to a full date for anything older than a week.
 */
export function formatRelativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} giờ trước`;

  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return formatDateTime(value);
}

export function buildPointOptionLabel(point) {
  if (!point) return '';
  return formatPointLabel(point, '');
}

export function isSamePoint(a, b) {
  if (!a || !b) return a === b;
  return (
    String(a.name) === String(b.name) &&
    String(a.address) === String(b.address) &&
    Number(a.lat) === Number(b.lat) &&
    Number(a.lng) === Number(b.lng)
  );
}
