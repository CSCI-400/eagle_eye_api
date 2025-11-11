const { db } = require('../enviroment/firebase/firebase');
const { validatePathEdge, collectionPath } = require('../models/pathEdgeModel');
const { getPathPointById } = require('./pathPointService');

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Create a new path edge connecting two path points
 * @param {Object} data - Edge data
 * @param {Object} user - User object
 * @returns {Promise<Object>} Created edge with ID
 */
async function createPathEdge(data, user) {
  // Verify both path points exist
  const pointA = await getPathPointById(data.point_a_id);
  const pointB = await getPathPointById(data.point_b_id);

  // Calculate weight if not provided
  let weight = data.weight;
  if (!weight) {
    weight = calculateDistance(
      pointA.latitude,
      pointA.longtitude,
      pointB.latitude,
      pointB.longtitude
    );
  }

  // Normalize edge order (store with smaller ID first for consistency)
  const [pointAId, pointBId] =
    data.point_a_id < data.point_b_id
      ? [data.point_a_id, data.point_b_id]
      : [data.point_b_id, data.point_a_id];

  // Check if edge already exists
  const existing = await findEdgeBetweenPoints(pointAId, pointBId);
  if (existing) {
    throw new Error('Edge already exists between these points');
  }

  const valid = validatePathEdge({
    point_a_id: pointAId,
    point_b_id: pointBId,
    weight,
    Created_by: user?.uid,
  });

  const docRef = await db.collection(collectionPath).add(valid);
  return { id: docRef.id, ...valid };
}

/**
 * Find an edge between two specific points
 * @param {string} pointAId - First point ID
 * @param {string} pointBId - Second point ID
 * @returns {Promise<Object|null>} Edge if found, null otherwise
 */
async function findEdgeBetweenPoints(pointAId, pointBId) {
  const [minId, maxId] = pointAId < pointBId ? [pointAId, pointBId] : [pointBId, pointAId];
  
  const snapshot = await db
    .collection(collectionPath)
    .where('point_a_id', '==', minId)
    .where('point_b_id', '==', maxId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

/**
 * Get edge by ID
 * @param {string} id - Edge ID
 * @returns {Promise<Object>} Edge data
 */
async function getPathEdgeById(id) {
  const doc = await db.collection(collectionPath).doc(id).get();
  if (!doc.exists) throw new Error('Path edge not found');
  return { id: doc.id, ...doc.data() };
}

/**
 * List all edges, optionally filtered by a specific point
 * @param {Object} options - Query options
 * @param {string} options.pointId - Filter edges connected to this point
 * @returns {Promise<Array>} Array of edges
 */
async function listPathEdges({ pointId } = {}) {
  let query = db.collection(collectionPath);

  if (pointId) {
    // Get all edges where the point is either point_a or point_b
    const snapshotA = await db
      .collection(collectionPath)
      .where('point_a_id', '==', pointId)
      .get();
    
    const snapshotB = await db
      .collection(collectionPath)
      .where('point_b_id', '==', pointId)
      .get();

    const edgesA = snapshotA.docs.map((d) => ({ id: d.id, ...d.data() }));
    const edgesB = snapshotB.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Combine and deduplicate
    const edgeMap = new Map();
    [...edgesA, ...edgesB].forEach((edge) => edgeMap.set(edge.id, edge));
    return Array.from(edgeMap.values());
  }

  const snapshot = await query.get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Get all neighbors of a specific point in the graph
 * @param {string} pointId - The point ID
 * @returns {Promise<Array>} Array of neighbor data with {neighborId, weight, edgeId}
 */
async function getNeighbors(pointId) {
  const edges = await listPathEdges({ pointId });
  
  return edges.map((edge) => {
    const neighborId = edge.point_a_id === pointId ? edge.point_b_id : edge.point_a_id;
    return {
      neighborId,
      weight: edge.weight,
      edgeId: edge.id,
    };
  });
}

/**
 * Update an existing path edge
 * @param {string} id - Edge ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated edge
 */
async function updatePathEdge(id, updates) {
  const existing = await getPathEdgeById(id);

  // If updating point IDs, verify they exist
  if (updates.point_a_id && updates.point_a_id !== existing.point_a_id) {
    await getPathPointById(updates.point_a_id);
  }
  if (updates.point_b_id && updates.point_b_id !== existing.point_b_id) {
    await getPathPointById(updates.point_b_id);
  }

  const merged = validatePathEdge({
    ...existing,
    ...updates,
    created_at: existing.created_at,
    Created_by: existing.Created_by,
  });

  await db.collection(collectionPath).doc(id).set(merged, { merge: true });
  return { id, ...merged };
}

/**
 * Delete a path edge
 * @param {string} id - Edge ID
 * @returns {Promise<Object>} Deletion result
 */
async function deletePathEdge(id) {
  await db.collection(collectionPath).doc(id).delete();
  return { id, deleted: true };
}

/**
 * Get the complete graph structure
 * @returns {Promise<Object>} Graph with vertices and edges
 */
async function getGraph() {
  const { listPathPoints } = require('./pathPointService');
  const points = await listPathPoints();
  const edges = await listPathEdges();

  // Build adjacency list representation
  const adjacencyList = {};
  points.forEach((point) => {
    adjacencyList[point.id] = [];
  });

  edges.forEach((edge) => {
    // Bi-directional edges
    if (adjacencyList[edge.point_a_id]) {
      adjacencyList[edge.point_a_id].push({
        to: edge.point_b_id,
        weight: edge.weight,
        edgeId: edge.id,
      });
    }
    if (adjacencyList[edge.point_b_id]) {
      adjacencyList[edge.point_b_id].push({
        to: edge.point_a_id,
        weight: edge.weight,
        edgeId: edge.id,
      });
    }
  });

  return {
    vertices: points,
    edges,
    adjacencyList,
  };
}

module.exports = {
  createPathEdge,
  getPathEdgeById,
  listPathEdges,
  updatePathEdge,
  deletePathEdge,
  getNeighbors,
  findEdgeBetweenPoints,
  calculateDistance,
  getGraph,
};
