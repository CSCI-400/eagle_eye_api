const pathEdgeService = require('../services/pathEdgeService');

function errorResponse(res, status, message, code = null) {
  return res.status(status).json({
    error: { code: code || status, message },
  });
}

/**
 * Create a new path edge
 */
async function createPathEdge(req, res) {
  try {
    const body = {
      ...req.body,
      weight: req.body.weight !== undefined
        ? typeof req.body.weight === 'string'
          ? Number(req.body.weight)
          : req.body.weight
        : undefined,
    };
    const result = await pathEdgeService.createPathEdge(body, req.user);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating path edge:', err);
    errorResponse(res, 400, err.message);
  }
}

/**
 * Get a specific path edge by ID
 */
async function getPathEdge(req, res) {
  try {
    const result = await pathEdgeService.getPathEdgeById(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error getting path edge:', err);
    errorResponse(res, 404, err.message);
  }
}

/**
 * List all path edges, optionally filtered by point ID
 */
async function listPathEdges(req, res) {
  try {
    const pointId = req.query.pointId;
    const result = await pathEdgeService.listPathEdges({ pointId });
    res.json(result);
  } catch (err) {
    console.error('Error listing path edges:', err);
    errorResponse(res, 400, err.message);
  }
}

/**
 * Get all neighbors of a specific point
 */
async function getNeighbors(req, res) {
  try {
    const result = await pathEdgeService.getNeighbors(req.params.pointId);
    res.json(result);
  } catch (err) {
    console.error('Error getting neighbors:', err);
    errorResponse(res, 404, err.message);
  }
}

/**
 * Update an existing path edge
 */
async function updatePathEdge(req, res) {
  try {
    const body = {
      ...req.body,
      weight:
        req.body.weight !== undefined
          ? typeof req.body.weight === 'string'
            ? Number(req.body.weight)
            : req.body.weight
          : undefined,
    };
    const result = await pathEdgeService.updatePathEdge(req.params.id, body);
    res.json(result);
  } catch (err) {
    console.error('Error updating path edge:', err);
    errorResponse(res, 400, err.message);
  }
}

/**
 * Delete a path edge
 */
async function deletePathEdge(req, res) {
  try {
    const result = await pathEdgeService.deletePathEdge(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error deleting path edge:', err);
    errorResponse(res, 400, err.message);
  }
}

/**
 * Get the complete graph structure
 */
async function getGraph(req, res) {
  try {
    const result = await pathEdgeService.getGraph();
    res.json(result);
  } catch (err) {
    console.error('Error getting graph:', err);
    errorResponse(res, 500, err.message);
  }
}

module.exports = {
  createPathEdge,
  getPathEdge,
  listPathEdges,
  getNeighbors,
  updatePathEdge,
  deletePathEdge,
  getGraph,
};
