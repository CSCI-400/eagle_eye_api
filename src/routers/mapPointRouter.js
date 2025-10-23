const express = require('express');
const {
  createMapPoint,
  getMapPoint,
  listMapPoints,
  updateMapPoint,
  deleteMapPoint,
} = require('../controllers/mapPointController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', listMapPoints);
router.get('/:id', getMapPoint);

router.post('/', auth, createMapPoint);
router.put('/:id', auth, updateMapPoint);
router.delete('/:id', auth, deleteMapPoint);

module.exports = router;
