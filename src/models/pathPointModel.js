const z = require('zod');

const PathPointSchema = z.object({
  latitude: z.number().refine((v) => v >= -90 && v <= 90, 'latitude must be between -90 and 90'),
  longtitude: z.number().refine((v) => v >= -180 && v <= 180, 'longtitude must be between -180 and 180'),
  Created_by: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).transform((data) => {
  const now = new Date().toISOString();
  return { ...data, created_at: data.created_at || now, updated_at: now };
});

const validatePathPoint = (data) => PathPointSchema.parse(data);
const collectionPath = 'pathPoints';

module.exports = { PathPointSchema, validatePathPoint, collectionPath };
