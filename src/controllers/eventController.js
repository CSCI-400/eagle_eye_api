const eventService = require('../services/eventService')

function errorResponse(res, status, message, code = null){
    return res.status(status).json({
        error: {code: code || status, message}
    })
}

async function createEvent(req,res){
    try{
        const result = await eventService.createEvent(req.body)
        res.status(201).json(result)
    }catch(error){
        console.error('Error creating event:', error)
        errorResponse(res, 400, error.message)
    }
}

async function getEvent(req,res){
    try{
        const result = await eventService.getEvent(req.params.id)
        res.status(201).json(result)
    }catch(error){
        console.error('Error getting post:', error)
        errorResponse(res, 404, error.message)
    }
}

async function getAllEvents(req,res){
    try{
        const result = await eventService.getAllEvents()
        res.status(200).json(result)
    }catch(error){
        console.error('Error getting all events:', error)
        errorResponse(res, 500, error.message)
    }
}

async function updateEvent(req,res){
    try{
        const eventId = req.params.id
        const updates = req.body

        const updatedEvent = await eventService.updateEvent(eventId, updates)
        res.status(200).json(updatedEvent)
    }catch(error){
        console.error('Error updating event', error)
        if(error.message === 'Event not found'){
            return errorResponse(res, 404, 'Event not found', 'NOT_FOUND')
        }
        return errorResponse(res, 500, 'Internal server error')
    }
}

async function deleteEvent(req, res){
    try{
        await eventService.deleteEvent(req.params.id)
        res.status(200).json({ message: 'Event deleted successfully'})
    }catch(error){
        console.error('Error deleting event:', error)
        return errorResponse(res,500, 'Internal server error')
    }
}

module.exports = {createEvent, getEvent, getAllEvents, updateEvent, deleteEvent}