/**
 * Generates a deterministic simulated user GPS location near a pickup point.
 *
 * The same `seed` always yields the same coordinates, which is convenient for
 * the academic A* visualization on top of OSM data: we want a stable
 * "where the user is" point relative to a real pickup location, then let the
 * client (or routing endpoint) compute the road-network path.
 */

function hashSeed(input) {
  let h = 2166136261 >>> 0;
  const str = String(input || 'seed');
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const APPROX_M_PER_DEG_LAT = 111_320;
function metersPerDegLng(lat) {
  return Math.cos((lat * Math.PI) / 180) * APPROX_M_PER_DEG_LAT;
}

/**
 * @param {object} args
 * @param {string|object} args.seed
 * @param {{lat:number,lng:number,name?:string,address?:string}} args.pickupPoint
 * @param {number} [args.minDistanceMeters=800]
 * @param {number} [args.maxDistanceMeters=2200]
 */
function buildRoutePlan({
  seed,
  pickupPoint,
  minDistanceMeters = 800,
  maxDistanceMeters = 2200,
} = {}) {
  if (
    !pickupPoint ||
    !Number.isFinite(Number(pickupPoint.lat)) ||
    !Number.isFinite(Number(pickupPoint.lng))
  ) {
    return null;
  }

  const pickupLat = Number(pickupPoint.lat);
  const pickupLng = Number(pickupPoint.lng);
  const rng = mulberry32(hashSeed(seed));

  const span = Math.max(0, maxDistanceMeters - minDistanceMeters);
  const distance = minDistanceMeters + Math.floor(rng() * span);
  const angle = rng() * Math.PI * 2;

  const dxMeters = Math.cos(angle) * distance;
  const dyMeters = Math.sin(angle) * distance;

  const userLat = pickupLat + dyMeters / APPROX_M_PER_DEG_LAT;
  const userLng = pickupLng + dxMeters / metersPerDegLng(pickupLat);

  return {
    user: {
      lat: Number(userLat.toFixed(6)),
      lng: Number(userLng.toFixed(6)),
      simulated: true,
      distanceMeters: Math.round(distance),
    },
    pickup: {
      lat: pickupLat,
      lng: pickupLng,
      name: pickupPoint.name || null,
      address: pickupPoint.address || null,
    },
    seed: String(seed),
  };
}

module.exports = { buildRoutePlan };
