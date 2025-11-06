const express = require('express')
const{ createEvent, getEvent, getAllEvents, updateEvent,deleteEvent} = require('../controllers/eventController')
const auth = require('../middleware/auth')

const router = express.Router()

router.post('/', auth, createEvent)
router.get('/', getAllEvents)
router.get('/:id', getEvent)
router.put('/:id', updateEvent)
router.delete('/:id', deleteEvent)

module.exports = router