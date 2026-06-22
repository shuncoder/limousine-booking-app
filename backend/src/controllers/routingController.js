const { getGraph, nearestNode } = require('../utils/osmGraph');
const { astar } = require('../utils/astar');

function isValidLatLng(p) {
  return (
    p &&
    Number.isFinite(Number(p.lat)) &&
    Number.isFinite(Number(p.lng))
  );
}

function toLatLon(p) {
  return { lat: Number(p.lat), lon: Number(p.lng) };
}
exports.runAstar = async (req, res) => {
  try {
    const { from, to } = req.body || {};
    if (!isValidLatLng(from) || !isValidLatLng(to)) {
      return res
        .status(400)
        .json({ msg: 'from and to must be { lat, lng } numbers' });
    }

    let graph;
    try {
      graph = await getGraph();
    } catch (err) {
      return res
        .status(503)
        .json({ msg: err?.message || 'OSM graph not available' });
    }

    const fromLatLon = toLatLon(from);
    const toLatLon2 = toLatLon(to);

    const startSnap = nearestNode(graph, fromLatLon.lat, fromLatLon.lon);
    const goalSnap = nearestNode(graph, toLatLon2.lat, toLatLon2.lon);

    if (!startSnap || !goalSnap) {
      return res
        .status(404)
        .json({ msg: 'No road network nodes near the given coordinates' });
    }

    const result = astar(graph, startSnap.id, goalSnap.id);

    const startCoord = graph.nodes.get(startSnap.id);
    const goalCoord = graph.nodes.get(goalSnap.id);

    res.json({
      from: { lat: fromLatLon.lat, lng: fromLatLon.lon },
      to: { lat: toLatLon2.lat, lng: toLatLon2.lon },
      start: {
        id: String(startSnap.id),
        lat: startCoord?.lat,
        lng: startCoord?.lon,
        snapDistance: Math.round(startSnap.distance),
      },
      goal: {
        id: String(goalSnap.id),
        lat: goalCoord?.lat,
        lng: goalCoord?.lon,
        snapDistance: Math.round(goalSnap.distance),
      },
      reachable: result.reachable,
      distance: Math.round(result.distance),
      nodesExplored: result.nodesExplored,
      runtimeMs: result.runtimeMs,
      path: result.path.map((n) => ({ lat: n.lat, lng: n.lon })),
    });
  } catch (err) {
    console.error('[routing/astar] error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
