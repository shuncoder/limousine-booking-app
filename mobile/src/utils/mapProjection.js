/**
 * Equirectangular (plate-carrée) projection scaled to the bounding box of
 * a list of (lat, lng) points. Used by RouteVisualizationScreen for the
 * academic A* visualization. Pure module – no React, no native modules.
 */

export function formatLatLng(value) {
  if (!Number.isFinite(Number(value))) return '--';
  return Number(value).toFixed(5);
}

export function formatMeters(value) {
  if (!Number.isFinite(Number(value))) return '--';
  const m = Number(value);
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${Math.round(m)} m`;
}

/**
 * Build a project(lat, lng) -> { x, y } function that maps the supplied
 * `points` into a (width × height) SVG viewport with the given padding.
 *
 * Returns `{ project, bbox }`. When `points` is empty, `bbox` is null and
 * `project` returns `{0,0}` for any input.
 */
export function projectPath(points, width, height, padding = 12) {
  if (!points.length) {
    return { project: () => ({ x: 0, y: 0 }), bbox: null };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  const dLat = Math.max(1e-6, maxLat - minLat);
  const dLng = Math.max(1e-6, maxLng - minLng);

  const midLat = (minLat + maxLat) / 2;
  const lngScale = Math.cos((midLat * Math.PI) / 180);
  const dLngEff = dLng * lngScale;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const scale = Math.min(innerW / dLngEff, innerH / dLat);

  const offsetX = (innerW - dLngEff * scale) / 2 + padding;
  const offsetY = (innerH - dLat * scale) / 2 + padding;

  return {
    bbox: { minLat, maxLat, minLng, maxLng },
    project: (lat, lng) => {
      const x = (lng - minLng) * lngScale * scale + offsetX;
      // SVG y axis points down; latitude grows up → flip.
      const y = (maxLat - lat) * scale + offsetY;
      return { x, y };
    },
  };
}

/** Convert a list of {lat,lng} points into an SVG polyline `points` string. */
export function buildPolylinePoints(path, project) {
  if (!Array.isArray(path) || !path.length || typeof project !== 'function') {
    return '';
  }
  return path
    .map((p) => {
      const { x, y } = project(p.lat, p.lng);
      return `${x},${y}`;
    })
    .join(' ');
}
