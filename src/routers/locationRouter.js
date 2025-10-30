const express = require('express');
const {
  createLocation,
  getLocation,
  listLocations,
  updateLocation,
  deleteLocation,
} = require('../controllers/locationController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', listLocations);
router.get('/:id', getLocation);

router.post('/', auth, createLocation);
router.put('/:id', auth, updateLocation);
router.delete('/:id', auth, deleteLocation);

module.exports = router;
