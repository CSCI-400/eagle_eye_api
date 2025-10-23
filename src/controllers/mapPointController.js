const mapPointService = require('../services/mapPointService');

function errorResponse(res, status, message, code = null) {
  return res.status(status).json({
    error: { code: code || status, message },
  });
}

async function createMapPoint(req, res) {
  try {
    const body = {
      ...req.body,
      lat: typeof req.body.lat === 'string' ? Number(req.body.lat) : req.body.lat,
      lng: typeof req.body.lng === 'string' ? Number(req.body.lng) : req.body.lng,
    };
    const result = await mapPointService.createMapPoint(body, req.user);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating map point:', err);
    errorResponse(res, 400, err.message);
  }
}

async function getMapPoint(req, res) {
  try {
    const result = await mapPointService.getMapPointById(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error getting map point:', err);
    errorResponse(res, 404, err.message);
  }
}

async function listMapPoints(req, res) {
  try {
    const bbox = req.query.bbox ? req.query.bbox.split(',').map(Number) : undefined;
    const category = req.query.category || undefined;
    const result = await mapPointService.listMapPoints({ bbox, category });
    res.json(result);
  } catch (err) {
    console.error('Error listing map points:', err);
    errorResponse(res, 400, err.message);
  }
}

async function updateMapPoint(req, res) {
  try {
    const body = {
      ...req.body,
      lat:
        req.body.lat !== undefined
          ? typeof req.body.lat === 'string'
            ? Number(req.body.lat)
            : req.body.lat
          : undefined,
      lng:
        req.body.lng !== undefined
          ? typeof req.body.lng === 'string'
            ? Number(req.body.lng)
            : req.body.lng
          : undefined,
    };
    const result = await mapPointService.updateMapPoint(req.params.id, body);
    res.json(result);
  } catch (err) {
    console.error('Error updating map point:', err);
    errorResponse(res, 400, err.message);
  }
}

async function deleteMapPoint(req, res) {
  try {
    const result = await mapPointService.deleteMapPoint(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error deleting map point:', err);
    errorResponse(res, 400, err.message);
  }
}

module.exports = {
  createMapPoint,
  getMapPoint,
  listMapPoints,
  updateMapPoint,
  deleteMapPoint,
};
