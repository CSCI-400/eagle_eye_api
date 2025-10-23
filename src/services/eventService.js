const {db} = require('../enviroment/firebase/firebase')
const {validateEvent, collectionPath} = require('../models/eventModel')

async function createEvent(eventData){
    const validData = validateEvent(eventData);
    const docRef = await db.collection(collectionPath).add(validData)
    return {id: docRef.id, ...validData}
}

async function getEvent(eventId){
        const doc = await db.collection(collectionPath).doc(eventId).get()
        if(!doc.exists) throw new Error('Event not found')
        return {id: doc.id, ...doc.data()}
}

async function updateEvent(eventId, eventData){
        const eventRef = db.collection(collectionPath).doc(eventId)
        const eventSnap = await eventRef.get()
        if(!eventSnap.exists) throw new Error('Event not found')
        const prevData = eventSnap.data()
        const mergedData = {...prevData, ...eventData}
        const validData = validateEvent(mergedData)
        await eventRef.update(validData)
        return {id: eventId, ...validData}
}

async function deleteEvent(eventId){
    try{
        const eventRef = db.collection(collectionPath).doc(eventId)
        const docSnap = await eventRef.get()
        if(!docSnap.exists){
            throw new Error('Event not found')
        }
        await eventRef.delete()
        console.log('Event Deleted', eventId)
        return {id: eventId, message: 'Event successfully deleted'}
    }catch(error){
        console.log('Error deleting event',error)
        throw error;
    }
}

module.exports = {createEvent, getEvent, updateEvent, deleteEvent}