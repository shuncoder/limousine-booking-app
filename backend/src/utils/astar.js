const { haversineMeters } = require('./osmGraph');

class MinHeap {
  constructor() {
    this.data = [];
  }
  size() {
    return this.data.length;
  }
  push(item) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  }
  pop() {
    if (!this.data.length) return null;
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }
  _bubbleUp(i) {
    const arr = this.data;
    while (i > 0) { 
      const parent = (i - 1) >> 1;
      if (arr[parent].f <= arr[i].f) break;
      [arr[parent], arr[i]] = [arr[i], arr[parent]];
      i = parent;
    }
  }
  _sinkDown(i) {
    const arr = this.data;
    const n = arr.length;
    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < n && arr[left].f < arr[smallest].f) smallest = left;
      if (right < n && arr[right].f < arr[smallest].f) smallest = right;
      if (smallest === i) break;
      [arr[i], arr[smallest]] = [arr[smallest], arr[i]];
      i = smallest;
    }
  }
}

/**
 * Heuristic = great-circle distance (meters). Admissible because edge weights
 * are also great-circle distances along road segments → monotone, optimal.
 */
function heuristic(a, b) {
  return haversineMeters(a.lat, a.lon, b.lat, b.lon);
}

/**
 * Runs A* on the OSM graph.
 *
 * f(n) = g(n) + h(n)
 *   g(n) = accumulated edge weight (meters) from start.
 *   h(n) = Haversine distance from n to goal (meters).
 *
 * @returns {{
 *   reachable: boolean,
 *   path: Array<{ id, lat, lon }>,
 *   distance: number,    // meters
 *   nodesExplored: number,
 *   runtimeMs: number,
 * }}
 */
//hàm chạy thuật toán A* , trả về kết quả có thể đi được hay không
function astar(graph, startId, goalId) {
  const startedAt = Date.now();

  if (startId == null || goalId == null) {
    return {
      reachable: false,
      path: [],
      distance: 0,
      nodesExplored: 0,
      runtimeMs: 0,
    };
  }

  const { nodes, adj } = graph;
  const goal = nodes.get(goalId);
  if (!goal) {
    return {
      reachable: false,
      path: [],
      distance: 0,
      nodesExplored: 0,
      runtimeMs: 0,
    };
  }

  if (startId === goalId) {
    const c = nodes.get(startId);
    return {
      reachable: true,
      path: c ? [{ id: startId, lat: c.lat, lon: c.lon }] : [],
      distance: 0,
      nodesExplored: 1,
      runtimeMs: Date.now() - startedAt,
    };
  }

  const openHeap = new MinHeap();
  const gScore = new Map();
  const cameFrom = new Map();
  const closed = new Set();

  const startNode = nodes.get(startId);
  if (!startNode) {
    return {
      reachable: false,
      path: [],
      distance: 0,
      nodesExplored: 0,
      runtimeMs: 0,
    };
  }

  gScore.set(startId, 0);
  openHeap.push({ id: startId, f: heuristic(startNode, goal) });

  let nodesExplored = 0;

  while (openHeap.size()) {
    const current = openHeap.pop();
    const cid = current.id;

    if (closed.has(cid)) continue;
    closed.add(cid);
    nodesExplored += 1;

    if (cid === goalId) {
      const path = reconstructPath(cameFrom, cid, nodes);
      return {
        reachable: true,
        path,
        distance: gScore.get(cid) || 0,
        nodesExplored,
        runtimeMs: Date.now() - startedAt,
      };
    }

    const neighbors = adj.get(cid);
    if (!neighbors) continue;

    const gCurrent = gScore.get(cid) || 0;
    for (const edge of neighbors) {
      if (closed.has(edge.to)) continue;
      const tentativeG = gCurrent + edge.weight;
      const prevG = gScore.get(edge.to);
      if (prevG !== undefined && tentativeG >= prevG) continue;

      cameFrom.set(edge.to, cid);
      gScore.set(edge.to, tentativeG);

      const nb = nodes.get(edge.to);
      if (!nb) continue;
      const f = tentativeG + heuristic(nb, goal);
      openHeap.push({ id: edge.to, f });
    }
  }

  return {
    reachable: false,
    path: [],
    distance: 0,
    nodesExplored,
    runtimeMs: Date.now() - startedAt,
  };
}
// xây dựng đường đi cuối cùng từ cameFrom map
function reconstructPath(cameFrom, endId, nodes) {
  const path = [];
  let cur = endId;
  let safety = 0;
  while (cur !== undefined && safety < 1_000_000) {
    const c = nodes.get(cur);
    if (c) path.push({ id: cur, lat: c.lat, lon: c.lon });
    if (!cameFrom.has(cur)) break;
    cur = cameFrom.get(cur);
    safety += 1;
  }
  path.reverse();
  return path;
}

module.exports = { astar, heuristic };
