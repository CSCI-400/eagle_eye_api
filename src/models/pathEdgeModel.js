const z = require('zod');

/**
 * PathEdgeSchema - Represents a bi-directional edge connecting two path points
 * The weight represents the distance between the two points in meters
 */
const PathEdgeSchema = z.object({
  // IDs of the two connected path points
  point_a_id: z.string().min(1, 'point_a_id is required'),
  point_b_id: z.string().min(1, 'point_b_id is required'),
  
  // Weight of the edge (distance in meters)
  weight: z.number().positive('weight must be a positive number'),
  
  // Optional metadata
  Created_by: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).refine(
  (data) => data.point_a_id !== data.point_b_id,
  { message: 'point_a_id and point_b_id must be different' }
).transform((data) => {
  const now = new Date().toISOString();
  return { 
    ...data, 
    created_at: data.created_at || now, 
    updated_at: now 
  };
});

const validatePathEdge = (data) => PathEdgeSchema.parse(data);
const collectionPath = 'pathEdges';

module.exports = { PathEdgeSchema, validatePathEdge, collectionPath };
