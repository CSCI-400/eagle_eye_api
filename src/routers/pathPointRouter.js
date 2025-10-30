const express = require('express');
const {
  createPathPoint,
  getPathPoint,
  listPathPoints,
  updatePathPoint,
  deletePathPoint,
} = require('../controllers/pathPointController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', listPathPoints);
router.get('/:id', getPathPoint);

router.post('/', auth, createPathPoint);
router.put('/:id', auth, updatePathPoint);
router.delete('/:id', auth, deletePathPoint);

module.exports = router;
