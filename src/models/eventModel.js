
const z = require('zod')

const userId = z.string().uuid()
const visibility = z.enum(['public','private'])

const EventSchema = z.object({
        uid: userId,
        title: z.string().min(1, 'Title is required'),
        description: z.string().min(1, 'Description is required'),
        location_id: z.string().uuid(),
        start_time: z.string().datetime(),
        end_time: z.string().datetime(),
        createdBy: userId,
        visibility: visibility,
        invitees: z.record(userId,visibility).default({}),
        createdAt: z.string().datetime().optional()
}).refine(
    (data) => new Date(data.start_time) < new Date(data.end_time),
    {message: 'end time must be after start time', path: ['end_time']}
).transform((data) => {
    const now = new Date().toISOString()
    return{
            ...data,
            createdAt: data.createdAt || now,
            updatedAt: now,
    }
})

const validateEvent = (data) => {
    return EventSchema.parse(data)
}
 const collectionPath = 'events'

 module.exports = {validateEvent, EventSchema, collectionPath}
