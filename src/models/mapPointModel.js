const z = require('zod');

const MapPointSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  lat: z.number().refine((v) => v >= -90 && v <= 90, 'lat must be between -90 and 90'),
  lng: z.number().refine((v) => v >= -180 && v <= 180, 'lng must be between -180 and 180'),
  category: z.string().default('general'),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).transform((data) => {
  const now = new Date().toISOString();
  return { ...data, createdAt: data.createdAt || now, updatedAt: now };
});

const validateMapPoint = (data) => MapPointSchema.parse(data);
const collectionPath = 'mapPoints';

module.exports = { MapPointSchema, validateMapPoint, collectionPath };
