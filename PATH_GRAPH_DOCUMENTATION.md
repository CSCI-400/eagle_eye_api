# Path Graph System Documentation

## Overview

The Eagle Eye API now includes a bi-directional weighted graph system for connecting path points. This allows you to create a network of connected points where each connection (edge) has a weight representing the distance between two points.

## Key Features

- **Bi-directional Edges**: Each edge can be traversed in both directions
- **Automatic Distance Calculation**: Uses the Haversine formula to calculate geographic distances
- **Graph Operations**: Get neighbors, adjacency lists, and complete graph structure
- **Duplicate Prevention**: Prevents creation of duplicate edges between the same points
- **Edge Normalization**: Stores edges consistently with smaller ID first

## Data Model

### PathEdge Schema

```javascript
{
  point_a_id: string,      // ID of first path point (smaller ID stored first)
  point_b_id: string,      // ID of second path point
  weight: number,          // Distance in meters (auto-calculated if not provided)
  Created_by: string,      // User ID who created the edge
  created_at: string,      // ISO timestamp
  updated_at: string       // ISO timestamp
}
```

## API Endpoints

### Base URL: `/path-edges`

#### 1. Create Edge
**POST** `/path-edges`

Creates a new edge connecting two path points.

**Authentication**: Required

**Request Body**:
```json
{
  "point_a_id": "point-id-1",
  "point_b_id": "point-id-2",
  "weight": 1500  // Optional: distance in meters (auto-calculated if omitted)
}
```

**Response** (201 Created):
```json
{
  "id": "edge-abc123",
  "point_a_id": "point-id-1",
  "point_b_id": "point-id-2",
  "weight": 1500.5,
  "Created_by": "user-123",
  "created_at": "2025-11-11T12:00:00.000Z",
  "updated_at": "2025-11-11T12:00:00.000Z"
}
```

**Validation Rules**:
- Both point IDs must exist
- Point IDs must be different
- Weight must be positive (if provided)
- Edge must not already exist between the two points

---

#### 2. Get Edge by ID
**GET** `/path-edges/:id`

Retrieves a specific edge by its ID.

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "id": "edge-abc123",
  "point_a_id": "point-id-1",
  "point_b_id": "point-id-2",
  "weight": 1500.5,
  "Created_by": "user-123",
  "created_at": "2025-11-11T12:00:00.000Z",
  "updated_at": "2025-11-11T12:00:00.000Z"
}
```

---

#### 3. List Edges
**GET** `/path-edges`

Lists all edges, optionally filtered by a point ID.

**Authentication**: Not required

**Query Parameters**:
- `pointId` (optional): Filter edges connected to this point

**Example Requests**:
```
GET /path-edges
GET /path-edges?pointId=point-id-1
```

**Response** (200 OK):
```json
[
  {
    "id": "edge-abc123",
    "point_a_id": "point-id-1",
    "point_b_id": "point-id-2",
    "weight": 1500.5,
    "Created_by": "user-123",
    "created_at": "2025-11-11T12:00:00.000Z",
    "updated_at": "2025-11-11T12:00:00.000Z"
  },
  {
    "id": "edge-def456",
    "point_a_id": "point-id-1",
    "point_b_id": "point-id-3",
    "weight": 2300.8,
    "Created_by": "user-456",
    "created_at": "2025-11-11T12:05:00.000Z",
    "updated_at": "2025-11-11T12:05:00.000Z"
  }
]
```

---

#### 4. Get Neighbors
**GET** `/path-edges/neighbors/:pointId`

Gets all neighboring points connected to the specified point.

**Authentication**: Not required

**Response** (200 OK):
```json
[
  {
    "neighborId": "point-id-2",
    "weight": 1500.5,
    "edgeId": "edge-abc123"
  },
  {
    "neighborId": "point-id-3",
    "weight": 2300.8,
    "edgeId": "edge-def456"
  }
]
```

---

#### 5. Get Complete Graph
**GET** `/path-edges/graph`

Retrieves the complete graph structure including all vertices, edges, and adjacency list.

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "vertices": [
    {
      "id": "point-id-1",
      "latitude": 40.7128,
      "longtitude": -74.0060,
      "Created_by": "user-123",
      "created_at": "2025-11-11T11:00:00.000Z",
      "updated_at": "2025-11-11T11:00:00.000Z"
    },
    {
      "id": "point-id-2",
      "latitude": 34.0522,
      "longtitude": -118.2437,
      "Created_by": "user-123",
      "created_at": "2025-11-11T11:05:00.000Z",
      "updated_at": "2025-11-11T11:05:00.000Z"
    }
  ],
  "edges": [
    {
      "id": "edge-abc123",
      "point_a_id": "point-id-1",
      "point_b_id": "point-id-2",
      "weight": 3935000.5,
      "Created_by": "user-123",
      "created_at": "2025-11-11T12:00:00.000Z",
      "updated_at": "2025-11-11T12:00:00.000Z"
    }
  ],
  "adjacencyList": {
    "point-id-1": [
      {
        "to": "point-id-2",
        "weight": 3935000.5,
        "edgeId": "edge-abc123"
      }
    ],
    "point-id-2": [
      {
        "to": "point-id-1",
        "weight": 3935000.5,
        "edgeId": "edge-abc123"
      }
    ]
  }
}
```

---

#### 6. Update Edge
**PUT** `/path-edges/:id`

Updates an existing edge.

**Authentication**: Required

**Request Body**:
```json
{
  "weight": 1600.0
}
```

**Response** (200 OK):
```json
{
  "id": "edge-abc123",
  "point_a_id": "point-id-1",
  "point_b_id": "point-id-2",
  "weight": 1600.0,
  "Created_by": "user-123",
  "created_at": "2025-11-11T12:00:00.000Z",
  "updated_at": "2025-11-11T13:00:00.000Z"
}
```

---

#### 7. Delete Edge
**DELETE** `/path-edges/:id`

Deletes an edge.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "edge-abc123",
  "deleted": true
}
```

---

## Distance Calculation

The system uses the **Haversine formula** to calculate the great-circle distance between two geographic coordinates. This provides accurate distance measurements in meters.

### Formula

```
a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
c = 2 × atan2(√a, √(1−a))
distance = R × c
```

Where:
- φ is latitude in radians
- λ is longitude in radians
- R is Earth's radius (6,371,000 meters)

### Example

Distance between New York (40.7128°N, 74.0060°W) and Los Angeles (34.0522°N, 118.2437°W):
- Result: ~3,935,000 meters (~3,935 km)

---

## Use Cases

### 1. Building a Walking Path Network

```javascript
// Create points
const parkEntrance = await POST('/path-points', {
  latitude: 40.7829,
  longtitude: -73.9654
});

const fountain = await POST('/path-points', {
  latitude: 40.7812,
  longtitude: -73.9665
});

// Connect them
const path = await POST('/path-edges', {
  point_a_id: parkEntrance.id,
  point_b_id: fountain.id
  // Weight auto-calculated: ~200 meters
});
```

### 2. Finding All Connected Points

```javascript
// Get all neighbors of a point
const neighbors = await GET(`/path-edges/neighbors/${pointId}`);

// Returns:
// [
//   { neighborId: "point-2", weight: 150.5, edgeId: "edge-1" },
//   { neighborId: "point-3", weight: 300.2, edgeId: "edge-2" }
// ]
```

### 3. Graph Algorithms (Path Finding, etc.)

```javascript
// Get complete graph for algorithms like Dijkstra's
const graph = await GET('/path-edges/graph');

// Use adjacency list for traversal
function dijkstra(graph, startId, endId) {
  const { adjacencyList } = graph;
  // Implement shortest path algorithm
  // ...
}
```

### 4. Filtering Edges by Area

```javascript
// Get all edges connected to points in a specific area
const pointsInArea = await GET('/path-points?bbox=40.7,-74.1,40.8,-73.9');
const edgesInArea = [];

for (const point of pointsInArea) {
  const edges = await GET(`/path-edges?pointId=${point.id}`);
  edgesInArea.push(...edges);
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "error": {
    "code": 400,
    "message": "point_a_id and point_b_id must be different"
  }
}
```

**404 Not Found**:
```json
{
  "error": {
    "code": 404,
    "message": "Path edge not found"
  }
}
```

**401 Unauthorized**:
```json
{
  "error": {
    "code": 401,
    "message": "Unauthorized"
  }
}
```

---

## Graph Properties

### Bi-Directional
Each edge can be traversed in both directions. If you create an edge from Point A to Point B, you can traverse it from B to A with the same weight.

### Weighted
Each edge has a weight (distance in meters) that represents the cost of traversing between two points.

### Simple Graph
- No self-loops: A point cannot connect to itself
- No multi-edges: Only one edge can exist between any two points

---

## Integration Example

### Complete Workflow

```javascript
// 1. Create path points
const point1 = await fetch('http://api.example.com/path-points', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    latitude: 40.7128,
    longtitude: -74.0060
  })
}).then(r => r.json());

const point2 = await fetch('http://api.example.com/path-points', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    latitude: 34.0522,
    longtitude: -118.2437
  })
}).then(r => r.json());

// 2. Connect them with an edge
const edge = await fetch('http://api.example.com/path-edges', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    point_a_id: point1.id,
    point_b_id: point2.id
  })
}).then(r => r.json());

console.log(`Created edge with weight: ${edge.weight} meters`);

// 3. Get the complete graph
const graph = await fetch('http://api.example.com/path-edges/graph')
  .then(r => r.json());

console.log(`Graph has ${graph.vertices.length} vertices and ${graph.edges.length} edges`);
```

---

## Performance Considerations

- **Indexing**: Firebase queries are indexed on `point_a_id` and `point_b_id` for fast neighbor lookups
- **Normalization**: Edges are stored with the smaller ID first to prevent duplicates
- **Caching**: Consider caching the complete graph structure for read-heavy workloads
- **Batch Operations**: For creating many edges, consider batching requests to reduce overhead

---

## Future Enhancements

Potential features to consider:
- **Directed Edges**: Support for one-way paths
- **Edge Types**: Different types of connections (walking, biking, driving)
- **Dynamic Weights**: Time-based or condition-based weight adjustments
- **Graph Algorithms**: Built-in shortest path, minimum spanning tree, etc.
- **Subgraphs**: Extract connected components or regions
- **Visualization**: Export graph in formats like DOT for visualization tools

---

## Testing

Comprehensive tests are available in `tests/pathEdges.test.js`. Run tests with:

```bash
npm test -- pathEdges.test.js
```

Test coverage includes:
- Distance calculation
- Edge creation and validation
- Neighbor retrieval
- Graph structure
- Bi-directional traversal
- Error cases
