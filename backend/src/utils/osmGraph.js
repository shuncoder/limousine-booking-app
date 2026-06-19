const path = require('path');
const fs = require('fs');
const osmread = require('osm-read');

/**
 * Streams an OSM PBF file and builds a routing graph in memory:
 *   nodes: Map<id, { lat, lon }>
 *   adj:   Map<fromId, Array<{ to: nodeId, weight: meters }>>
 *
 * Only ways tagged as drivable highways contribute edges. After loading we
 * drop nodes that are not referenced by any kept way.
 *
 * The loader is wrapped in a singleton: the first call parses the file and
 * caches the result; subsequent calls return the same graph instantly.
 */

const DRIVABLE_HIGHWAYS = new Set([
  'motorway',
  'trunk',
  'primary',
  'secondary',
  'tertiary',
  'unclassified',
  'residential',
  'service',
  'living_street',
  'motorway_link',
  'trunk_link',
  'primary_link',
  'secondary_link',
  'tertiary_link',
  'road',
]);

const EARTH_RADIUS_M = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}
// hàm tính khoảng cách giữa 2 điểm trên bề mặt trái đất theo công thức Haversine, trả về kết quả bằng mét
function haversineMeters(aLat, aLon, bLat, bLon) {
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}
// xác định file bản đồ OSM PBF để tải. Mặc định là backend/data/hanoi.osm.pbf, nhưng có thể ghi đè bằng biến môi trường OSM_PBF_PATH
function defaultPbfPath() {
  if (process.env.OSM_PBF_PATH) return process.env.OSM_PBF_PATH;
  return path.resolve(__dirname, '..', '..', 'data', 'hanoi.osm.pbf');
}

let graphPromise = null;

function isOneway(tags) {
  if (!tags) return false;
  const v = String(tags.oneway || '').toLowerCase();
  return v === 'yes' || v === 'true' || v === '1' || v === '-1';
}
//nếu thẻ oneway có giá trị là -1 thì đây là đường một chiều ngược lại, chỉ cho phép đi từ cuối đến đầu
function isReverseOneway(tags) {
  return tags && String(tags.oneway || '').toLowerCase() === '-1';
}
//đọc , tạo graph , spatial index ,trả về graph dưới dạng Promise
function loadGraphFromPbf(pbfPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(pbfPath)) {
      reject(
        new Error(
          `OSM PBF file not found at "${pbfPath}". Set OSM_PBF_PATH or place hanoi.osm.pbf at backend/data/.`
        )
      );
      return;
    }

    console.log('[osmGraph] Loading PBF:', pbfPath);
    const startedAt = Date.now();

    const nodes = new Map();
    const adj = new Map();
    let kepWayCount = 0;

    function addEdge(fromId, toId, weight) {
      let bucket = adj.get(fromId);
      if (!bucket) {
        bucket = [];
        adj.set(fromId, bucket);
      }
      bucket.push({ to: toId, weight });
    }

    osmread.parse({
      filePath: pbfPath,
      node(node) {
        nodes.set(node.id, { lat: node.lat, lon: node.lon });
      },
      way(way) {
        const tags = way.tags || {};
        const highway = tags.highway;
        if (!highway || !DRIVABLE_HIGHWAYS.has(highway)) return;

        const refs = Array.isArray(way.nodeRefs) ? way.nodeRefs : [];
        if (refs.length < 2) return;

        const oneway = isOneway(tags);
        const reverse = isReverseOneway(tags);

        for (let i = 0; i < refs.length - 1; i += 1) {
          const a = refs[i];
          const b = refs[i + 1];
          const na = nodes.get(a);
          const nb = nodes.get(b);
          if (!na || !nb) continue;
          const w = haversineMeters(na.lat, na.lon, nb.lat, nb.lon);
          if (!Number.isFinite(w) || w <= 0) continue;

          if (reverse) {
            addEdge(b, a, w);
          } else {
            addEdge(a, b, w);
            if (!oneway) addEdge(b, a, w);
          }
        }
        kepWayCount += 1;
      },
      relation() {
        // not used for routing
      },
      endDocument() {
        // Drop nodes that are not connected (not part of any kept way).
        const kept = new Map();
        for (const [id, list] of adj.entries()) {
          if (list.length === 0) continue;
          const c = nodes.get(id);
          if (c) kept.set(id, c);
          for (const e of list) {
            const c2 = nodes.get(e.to);
            if (c2) kept.set(e.to, c2);
          }
        }

        const elapsed = Date.now() - startedAt;
        console.log(
          '[osmGraph] Loaded',
          { nodes: kept.size, edges: countEdges(adj), keptWays: kepWayCount, ms: elapsed }
        );

        const grid = buildSpatialIndex(kept);
        resolve({ nodes: kept, adj, grid });
      },
      error(err) {
        reject(err);
      },
    });
  });
}

function countEdges(adj) {
  let n = 0;
  for (const list of adj.values()) n += list.length;
  return n;
}

/**
 * Simple uniform-grid spatial index for fast nearest-node queries.
 * Cell size ≈ 0.005 degrees (~500m at the equator) — good enough for
 * city-scale OSM extracts.
 */
function buildSpatialIndex(nodes) {
  const cellSize = 0.005;
  const buckets = new Map();
  const keyFor = (lat, lon) => {
    const i = Math.floor(lat / cellSize);
    const j = Math.floor(lon / cellSize);
    return `${i}|${j}`;
  };

  for (const [id, c] of nodes.entries()) {
    const key = keyFor(c.lat, c.lon);
    let arr = buckets.get(key);
    if (!arr) {
      arr = [];
      buckets.set(key, arr);
    }
    arr.push(id);
  }

  return { cellSize, buckets, keyFor };
}
// Hàm tìm node gần nhất trong graph với tọa độ lat, lon cho trước. Sử dụng spatial index để giới hạn số node cần tính khoảng cách
function nearestNode(graph, lat, lon) {
  if (!graph) return null;
  const { grid, nodes } = graph;
  const i0 = Math.floor(lat / grid.cellSize);
  const j0 = Math.floor(lon / grid.cellSize);

  let bestId = null;
  let bestDist = Infinity;

  for (let radius = 0; radius < 25; radius += 1) {
    for (let i = i0 - radius; i <= i0 + radius; i += 1) {
      for (let j = j0 - radius; j <= j0 + radius; j += 1) {
        if (
          radius > 0 &&
          i !== i0 - radius &&
          i !== i0 + radius &&
          j !== j0 - radius &&
          j !== j0 + radius
        ) {
          continue;
        }
        const arr = grid.buckets.get(`${i}|${j}`);
        if (!arr) continue;
        for (const id of arr) {
          const c = nodes.get(id);
          if (!c) continue;
          const d = haversineMeters(lat, lon, c.lat, c.lon);
          if (d < bestDist) {
            bestDist = d;
            bestId = id;
          }
        }
      }
    }
    if (bestId !== null && radius >= 1) break;
  }

  return bestId == null ? null : { id: bestId, distance: bestDist };
}

function getGraph() {
  if (!graphPromise) {
    graphPromise = loadGraphFromPbf(defaultPbfPath()).catch((err) => {
      graphPromise = null;
      throw err;
    });
  }
  return graphPromise;
}

module.exports = {
  getGraph,
  nearestNode,
  haversineMeters,
};
