/**
 * Provides a fixed simulated user GPS location used by the A* visualization.
 *
 * In a real product this would come from the device GPS. For the academic
 * demo we want a stable, well-known point inside the loaded OSM extract so
 * the road-network path is reproducible and always routable.
 *
 * Default: 21.002122151375726, 105.84161887060333  (Hai Bà Trưng, Hà Nội).
 * Override with env vars `SIMULATED_USER_LAT` / `SIMULATED_USER_LNG`.
 */

const DEFAULT_USER_LAT = 21.002122151375726;
const DEFAULT_USER_LNG = 105.84161887060333;

function readEnvFloat(name) {
  const raw = process.env[name];
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function getSimulatedUserLocation() {
  return {
    lat: readEnvFloat('SIMULATED_USER_LAT') ?? DEFAULT_USER_LAT,
    lng: readEnvFloat('SIMULATED_USER_LNG') ?? DEFAULT_USER_LNG,
  };
}

const EARTH_RADIUS_M = 6371000;
function toRad(deg) {
  return (deg * Math.PI) / 180;
}
function haversineMeters(aLat, aLng, bLat, bLng) {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const sLat = Math.sin(dLat / 2);
  const sLng = Math.sin(dLng / 2);
  const a = sLat * sLat + Math.cos(lat1) * Math.cos(lat2) * sLng * sLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/**
 * @param {object} args
 * @param {string|object} [args.seed]  
 * @param {{lat:number,lng:number,name?:string,address?:string}} args.pickupPoint
 */
function buildRoutePlan({ seed, pickupPoint } = {}) {
  if (
    !pickupPoint ||
    !Number.isFinite(Number(pickupPoint.lat)) ||
    !Number.isFinite(Number(pickupPoint.lng))
  ) {
    return null;
  }

  const pickupLat = Number(pickupPoint.lat);
  const pickupLng = Number(pickupPoint.lng);
  const { lat: userLat, lng: userLng } = getSimulatedUserLocation();

  const distance = haversineMeters(userLat, userLng, pickupLat, pickupLng);

  return {
    user: {
      lat: userLat,
      lng: userLng,
      simulated: true,
      distanceMeters: Math.round(distance),
    },
    pickup: {
      lat: pickupLat,
      lng: pickupLng,
      name: pickupPoint.name || null,
      address: pickupPoint.address || null,
    },
    seed: seed != null ? String(seed) : null,
  };
}

module.exports = { buildRoutePlan, getSimulatedUserLocation };
