const express = require('express');
const {
  createPathEdge,
  getPathEdge,
  listPathEdges,
  getNeighbors,
  updatePathEdge,
  deletePathEdge,
  getGraph,
} = require('../controllers/pathEdgeController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', listPathEdges);
router.get('/graph', getGraph);
router.get('/:id', getPathEdge);
router.get('/neighbors/:pointId', getNeighbors);

// Protected routes (require authentication)
router.post('/', auth, createPathEdge);
router.put('/:id', auth, updatePathEdge);
router.delete('/:id', auth, deletePathEdge);

module.exports = router;
