const z = require('zod');

const LocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().default(''),
  lat: z.number().refine((v) => v >= -90 && v <= 90, 'Latitude must be between -90 and 90'),
  lng: z.number().refine((v) => v >= -180 && v <= 180, 'Longitude must be between -180 and 180'),
  metadata: z.record(z.unknown()).default({}),
  created_by: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).transform((data) => {
  const now = new Date().toISOString();
  return { 
    ...data, 
    created_at: data.created_at || now, 
    updated_at: now 
  };
});

const validateLocation = (data) => LocationSchema.parse(data);
const collectionPath = 'locations';

module.exports = { LocationSchema, validateLocation, collectionPath };
