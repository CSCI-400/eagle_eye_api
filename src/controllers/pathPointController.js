const pathPointService = require('../services/pathPointService');

function errorResponse(res, status, message, code = null) {
  return res.status(status).json({
    error: { code: code || status, message },
  });
}

async function createPathPoint(req, res) {
  try {
    const body = {
      ...req.body,
      latitude: typeof req.body.latitude === 'string' ? Number(req.body.latitude) : req.body.latitude,
      longtitude: typeof req.body.longtitude === 'string' ? Number(req.body.longtitude) : req.body.longtitude,
    };
    const result = await pathPointService.createPathPoint(body, req.user);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating path point:', err);
    errorResponse(res, 400, err.message);
  }
}

async function getPathPoint(req, res) {
  try {
    const result = await pathPointService.getPathPointById(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error getting path point:', err);
    errorResponse(res, 404, err.message);
  }
}

async function listPathPoints(req, res) {
  try {
    const bbox = req.query.bbox ? req.query.bbox.split(',').map(Number) : undefined;
    const result = await pathPointService.listPathPoints({ bbox });
    res.json(result);
  } catch (err) {
    console.error('Error listing path points:', err);
    errorResponse(res, 400, err.message);
  }
}

async function updatePathPoint(req, res) {
  try {
    const body = {
      ...req.body,
      latitude:
        req.body.latitude !== undefined
          ? typeof req.body.latitude === 'string'
            ? Number(req.body.latitude)
            : req.body.latitude
          : undefined,
      longtitude:
        req.body.longtitude !== undefined
          ? typeof req.body.longtitude === 'string'
            ? Number(req.body.longtitude)
            : req.body.longtitude
          : undefined,
    };
    const result = await pathPointService.updatePathPoint(req.params.id, body);
    res.json(result);
  } catch (err) {
    console.error('Error updating path point:', err);
    errorResponse(res, 400, err.message);
  }
}

async function deletePathPoint(req, res) {
  try {
    const result = await pathPointService.deletePathPoint(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error deleting path point:', err);
    errorResponse(res, 400, err.message);
  }
}

module.exports = {
  createPathPoint,
  getPathPoint,
  listPathPoints,
  updatePathPoint,
  deletePathPoint,
};
