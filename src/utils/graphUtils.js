/**
 * Graph Utility Functions
 * Helper functions for working with the path graph
 */

const {
  getGraph,
  getNeighbors,
  calculateDistance,
} = require('./services/pathEdgeService');

/**
 * Dijkstra's shortest path algorithm
 * @param {string} startId - Starting point ID
 * @param {string} endId - Ending point ID
 * @returns {Promise<Object>} Path with distance and route
 */
async function findShortestPath(startId, endId) {
  const graph = await getGraph();
  const { adjacencyList, vertices } = graph;

  // Check if start and end points exist
  if (!adjacencyList[startId] || !adjacencyList[endId]) {
    throw new Error('Start or end point not found in graph');
  }

  const distances = {};
  const previous = {};
  const unvisited = new Set();

  // Initialize distances
  vertices.forEach((vertex) => {
    distances[vertex.id] = Infinity;
    previous[vertex.id] = null;
    unvisited.add(vertex.id);
  });

  distances[startId] = 0;

  while (unvisited.size > 0) {
    // Find unvisited node with smallest distance
    let currentId = null;
    let smallestDistance = Infinity;
    
    for (const id of unvisited) {
      if (distances[id] < smallestDistance) {
        smallestDistance = distances[id];
        currentId = id;
      }
    }

    if (currentId === null || distances[currentId] === Infinity) {
      break; // No more reachable nodes
    }

    if (currentId === endId) {
      break; // Found the target
    }

    unvisited.delete(currentId);

    // Update distances to neighbors
    const neighbors = adjacencyList[currentId] || [];
    for (const neighbor of neighbors) {
      if (unvisited.has(neighbor.to)) {
        const distance = distances[currentId] + neighbor.weight;
        if (distance < distances[neighbor.to]) {
          distances[neighbor.to] = distance;
          previous[neighbor.to] = currentId;
        }
      }
    }
  }

  // Build path
  const path = [];
  let current = endId;
  
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  // Check if path exists
  if (path[0] !== startId) {
    return {
      found: false,
      distance: Infinity,
      path: [],
    };
  }

  return {
    found: true,
    distance: distances[endId],
    path,
    pathWithCoords: path.map((id) => {
      const vertex = vertices.find((v) => v.id === id);
      return {
        id,
        latitude: vertex.latitude,
        longtitude: vertex.longtitude,
      };
    }),
  };
}

/**
 * Find all connected components in the graph
 * @returns {Promise<Array>} Array of connected components
 */
async function findConnectedComponents() {
  const graph = await getGraph();
  const { adjacencyList, vertices } = graph;

  const visited = new Set();
  const components = [];

  function dfs(nodeId, component) {
    visited.add(nodeId);
    component.push(nodeId);

    const neighbors = adjacencyList[nodeId] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.to)) {
        dfs(neighbor.to, component);
      }
    }
  }

  for (const vertex of vertices) {
    if (!visited.has(vertex.id)) {
      const component = [];
      dfs(vertex.id, component);
      components.push(component);
    }
  }

  return components;
}

/**
 * Check if two points are connected (path exists)
 * @param {string} pointAId - First point ID
 * @param {string} pointBId - Second point ID
 * @returns {Promise<boolean>} True if connected
 */
async function arePointsConnected(pointAId, pointBId) {
  const result = await findShortestPath(pointAId, pointBId);
  return result.found;
}

/**
 * Get all points within a certain distance from a starting point
 * @param {string} startId - Starting point ID
 * @param {number} maxDistance - Maximum distance in meters
 * @returns {Promise<Array>} Array of reachable points with distances
 */
async function getPointsWithinDistance(startId, maxDistance) {
  const graph = await getGraph();
  const { adjacencyList, vertices } = graph;

  const distances = {};
  const visited = new Set();
  const queue = [{ id: startId, distance: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.distance - b.distance);
    const { id, distance } = queue.shift();

    if (visited.has(id)) continue;
    visited.add(id);
    distances[id] = distance;

    if (distance >= maxDistance) continue;

    const neighbors = adjacencyList[id] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.to)) {
        queue.push({
          id: neighbor.to,
          distance: distance + neighbor.weight,
        });
      }
    }
  }

  return Object.entries(distances)
    .filter(([id, distance]) => distance <= maxDistance && id !== startId)
    .map(([id, distance]) => {
      const vertex = vertices.find((v) => v.id === id);
      return {
        id,
        distance,
        latitude: vertex.latitude,
        longtitude: vertex.longtitude,
      };
    })
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Calculate total path distance for a sequence of points
 * @param {Array<string>} pointIds - Array of point IDs in order
 * @returns {Promise<number>} Total distance in meters
 */
async function calculatePathDistance(pointIds) {
  if (pointIds.length < 2) return 0;

  const graph = await getGraph();
  const { vertices } = graph;

  let totalDistance = 0;

  for (let i = 0; i < pointIds.length - 1; i++) {
    const pointA = vertices.find((v) => v.id === pointIds[i]);
    const pointB = vertices.find((v) => v.id === pointIds[i + 1]);

    if (!pointA || !pointB) {
      throw new Error(`Point not found: ${!pointA ? pointIds[i] : pointIds[i + 1]}`);
    }

    const distance = calculateDistance(
      pointA.latitude,
      pointA.longtitude,
      pointB.latitude,
      pointB.longtitude
    );

    totalDistance += distance;
  }

  return totalDistance;
}

/**
 * Get graph statistics
 * @returns {Promise<Object>} Graph statistics
 */
async function getGraphStatistics() {
  const graph = await getGraph();
  const components = await findConnectedComponents();

  const degrees = {};
  Object.entries(graph.adjacencyList).forEach(([id, neighbors]) => {
    degrees[id] = neighbors.length;
  });

  const degreeValues = Object.values(degrees);
  const avgDegree = degreeValues.length > 0
    ? degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length
    : 0;

  const weights = graph.edges.map((e) => e.weight);
  const avgWeight = weights.length > 0
    ? weights.reduce((a, b) => a + b, 0) / weights.length
    : 0;

  return {
    vertices: graph.vertices.length,
    edges: graph.edges.length,
    connectedComponents: components.length,
    averageDegree: avgDegree,
    maxDegree: Math.max(...degreeValues, 0),
    minDegree: Math.min(...degreeValues, Infinity),
    averageEdgeWeight: avgWeight,
    maxEdgeWeight: Math.max(...weights, 0),
    minEdgeWeight: Math.min(...weights, Infinity),
    isConnected: components.length === 1,
  };
}

module.exports = {
  findShortestPath,
  findConnectedComponents,
  arePointsConnected,
  getPointsWithinDistance,
  calculatePathDistance,
  getGraphStatistics,
};
