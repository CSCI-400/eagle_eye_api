const locationService = require('../services/locationService');

function errorResponse(res, status, message, code = null) {
  return res.status(status).json({
    error: { code: code || status, message },
  });
}

async function createLocation(req, res) {
  try {
    const body = {
      ...req.body,
      lat: typeof req.body.lat === 'string' ? Number(req.body.lat) : req.body.lat,
      lng: typeof req.body.lng === 'string' ? Number(req.body.lng) : req.body.lng,
    };
    const result = await locationService.createLocation(body, req.user);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating location:', err);
    errorResponse(res, 400, err.message);
  }
}

async function getLocation(req, res) {
  try {
    const result = await locationService.getLocationById(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error getting location:', err);
    errorResponse(res, 404, err.message);
  }
}

async function listLocations(req, res) {
  try {
    const bbox = req.query.bbox ? req.query.bbox.split(',').map(Number) : undefined;
    const result = await locationService.listLocations({ bbox });
    res.json(result);
  } catch (err) {
    console.error('Error listing locations:', err);
    errorResponse(res, 400, err.message);
  }
}

async function updateLocation(req, res) {
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
    const result = await locationService.updateLocation(req.params.id, body);
    res.json(result);
  } catch (err) {
    console.error('Error updating location:', err);
    errorResponse(res, 400, err.message);
  }
}

async function deleteLocation(req, res) {
  try {
    const result = await locationService.deleteLocation(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error deleting location:', err);
    errorResponse(res, 400, err.message);
  }
}

module.exports = {
  createLocation,
  getLocation,
  listLocations,
  updateLocation,
  deleteLocation,
};
