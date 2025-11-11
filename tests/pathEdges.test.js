const request = require('supertest');
const express = require('express');
const { 
  createPathEdge, 
  getPathEdgeById, 
  listPathEdges,
  deletePathEdge,
  calculateDistance,
  getNeighbors,
  getGraph 
} = require('../src/services/pathEdgeService');
const { 
  createPathPoint, 
  deletePathPoint 
} = require('../src/services/pathPointService');

describe('Path Edge Service - Graph Tests', () => {
  let pointA, pointB, pointC;
  let testUser = { uid: 'test-user-graph' };

  beforeAll(async () => {
    // Create test path points for the graph
    pointA = await createPathPoint({
      latitude: 40.7128,
      longtitude: -74.0060, // New York
    }, testUser);

    pointB = await createPathPoint({
      latitude: 34.0522,
      longtitude: -118.2437, // Los Angeles
    }, testUser);

    pointC = await createPathPoint({
      latitude: 41.8781,
      longtitude: -87.6298, // Chicago
    }, testUser);
  });

  afterAll(async () => {
    // Clean up test points
    if (pointA?.id) await deletePathPoint(pointA.id).catch(() => {});
    if (pointB?.id) await deletePathPoint(pointB.id).catch(() => {});
    if (pointC?.id) await deletePathPoint(pointC.id).catch(() => {});
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      // Distance between NYC and LA (approx 3935 km)
      const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
      expect(distance).toBeGreaterThan(3900000); // meters
      expect(distance).toBeLessThan(4000000);
    });

    it('should return 0 for identical coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBeCloseTo(0, 0);
    });
  });

  describe('createPathEdge', () => {
    let edge;

    afterEach(async () => {
      if (edge?.id) {
        await deletePathEdge(edge.id).catch(() => {});
        edge = null;
      }
    });

    it('should create an edge with auto-calculated weight', async () => {
      edge = await createPathEdge({
        point_a_id: pointA.id,
        point_b_id: pointB.id,
      }, testUser);

      expect(edge).toBeDefined();
      expect(edge.id).toBeDefined();
      // Edge IDs are normalized (smaller ID first), so check both are present
      const edgePoints = [edge.point_a_id, edge.point_b_id].sort();
      const inputPoints = [pointA.id, pointB.id].sort();
      expect(edgePoints).toEqual(inputPoints);
      expect(edge.weight).toBeGreaterThan(0);
      expect(edge.Created_by).toBe(testUser.uid);
    });

    it('should create an edge with custom weight', async () => {
      const customWeight = 1000;
      edge = await createPathEdge({
        point_a_id: pointA.id,
        point_b_id: pointC.id,
        weight: customWeight,
      }, testUser);

      expect(edge.weight).toBe(customWeight);
    });

    it('should normalize edge order (smaller ID first)', async () => {
      edge = await createPathEdge({
        point_a_id: pointB.id, // Larger ID
        point_b_id: pointA.id, // Smaller ID
      }, testUser);

      // Should be stored with smaller ID first
      expect(edge.point_a_id).toBe(pointA.id < pointB.id ? pointA.id : pointB.id);
      expect(edge.point_b_id).toBe(pointA.id < pointB.id ? pointB.id : pointA.id);
    });

    it('should reject edge with same point_a and point_b', async () => {
      await expect(
        createPathEdge({
          point_a_id: pointA.id,
          point_b_id: pointA.id,
        }, testUser)
      ).rejects.toThrow();
    });

    it('should reject edge with non-existent points', async () => {
      await expect(
        createPathEdge({
          point_a_id: 'non-existent-1',
          point_b_id: 'non-existent-2',
        }, testUser)
      ).rejects.toThrow();
    });

    it('should reject duplicate edges', async () => {
      edge = await createPathEdge({
        point_a_id: pointA.id,
        point_b_id: pointC.id,
      }, testUser);

      await expect(
        createPathEdge({
          point_a_id: pointA.id,
          point_b_id: pointC.id,
        }, testUser)
      ).rejects.toThrow('Edge already exists');
    });
  });

  describe('getPathEdgeById', () => {
    let edge;

    beforeAll(async () => {
      edge = await createPathEdge({
        point_a_id: pointA.id,
        point_b_id: pointB.id,
      }, testUser);
    });

    afterAll(async () => {
      if (edge?.id) await deletePathEdge(edge.id).catch(() => {});
    });

    it('should retrieve an edge by ID', async () => {
      const retrieved = await getPathEdgeById(edge.id);
      expect(retrieved.id).toBe(edge.id);
      expect(retrieved.weight).toBe(edge.weight);
    });

    it('should throw error for non-existent edge', async () => {
      await expect(
        getPathEdgeById('non-existent-edge')
      ).rejects.toThrow('Path edge not found');
    });
  });

  describe('listPathEdges', () => {
    let edgeAB, edgeBC;

    beforeAll(async () => {
      edgeAB = await createPathEdge({
        point_a_id: pointA.id,
        point_b_id: pointB.id,
      }, testUser);

      edgeBC = await createPathEdge({
        point_a_id: pointB.id,
        point_b_id: pointC.id,
      }, testUser);
    });

    afterAll(async () => {
      if (edgeAB?.id) await deletePathEdge(edgeAB.id).catch(() => {});
      if (edgeBC?.id) await deletePathEdge(edgeBC.id).catch(() => {});
    });

    it('should list all edges', async () => {
      const edges = await listPathEdges();
      expect(edges.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter edges by point ID', async () => {
      const edgesForB = await listPathEdges({ pointId: pointB.id });
      expect(edgesForB.length).toBe(2); // Connected to A and C
      
      const ids = edgesForB.map(e => e.id);
      expect(ids).toContain(edgeAB.id);
      expect(ids).toContain(edgeBC.id);
    });

    it('should return empty array for point with no edges', async () => {
      const orphanPoint = await createPathPoint({
        latitude: 51.5074,
        longtitude: -0.1278, // London
      }, testUser);

      const edges = await listPathEdges({ pointId: orphanPoint.id });
      expect(edges).toEqual([]);

      await deletePathPoint(orphanPoint.id);
    });
  });

  describe('getNeighbors', () => {
    let edgeAB, edgeAC;

    beforeAll(async () => {
      edgeAB = await createPathEdge({
        point_a_id: pointA.id,
        point_b_id: pointB.id,
      }, testUser);

      edgeAC = await createPathEdge({
        point_a_id: pointA.id,
        point_b_id: pointC.id,
      }, testUser);
    });

    afterAll(async () => {
      if (edgeAB?.id) await deletePathEdge(edgeAB.id).catch(() => {});
      if (edgeAC?.id) await deletePathEdge(edgeAC.id).catch(() => {});
    });

    it('should get all neighbors of a point', async () => {
      const neighbors = await getNeighbors(pointA.id);
      expect(neighbors.length).toBe(2);
      
      const neighborIds = neighbors.map(n => n.neighborId);
      expect(neighborIds).toContain(pointB.id);
      expect(neighborIds).toContain(pointC.id);

      neighbors.forEach(neighbor => {
        expect(neighbor.weight).toBeGreaterThan(0);
        expect(neighbor.edgeId).toBeDefined();
      });
    });

    it('should return empty array for isolated point', async () => {
      const isolatedPoint = await createPathPoint({
        latitude: 48.8566,
        longtitude: 2.3522, // Paris
      }, testUser);

      const neighbors = await getNeighbors(isolatedPoint.id);
      expect(neighbors).toEqual([]);

      await deletePathPoint(isolatedPoint.id);
    });
  });

  describe('getGraph', () => {
    let edgeAB, edgeBC, edgeAC;

    beforeAll(async () => {
      edgeAB = await createPathEdge({
        point_a_id: pointA.id,
        point_b_id: pointB.id,
      }, testUser);

      edgeBC = await createPathEdge({
        point_a_id: pointB.id,
        point_b_id: pointC.id,
      }, testUser);

      edgeAC = await createPathEdge({
        point_a_id: pointA.id,
        point_b_id: pointC.id,
      }, testUser);
    });

    afterAll(async () => {
      if (edgeAB?.id) await deletePathEdge(edgeAB.id).catch(() => {});
      if (edgeBC?.id) await deletePathEdge(edgeBC.id).catch(() => {});
      if (edgeAC?.id) await deletePathEdge(edgeAC.id).catch(() => {});
    });

    it('should return complete graph structure', async () => {
      const graph = await getGraph();

      expect(graph.vertices).toBeDefined();
      expect(graph.edges).toBeDefined();
      expect(graph.adjacencyList).toBeDefined();

      expect(Array.isArray(graph.vertices)).toBe(true);
      expect(Array.isArray(graph.edges)).toBe(true);
      expect(typeof graph.adjacencyList).toBe('object');
    });

    it('should have correct adjacency list for bi-directional edges', async () => {
      const graph = await getGraph();
      const adjList = graph.adjacencyList;

      // Point A should have edges to B and C
      expect(adjList[pointA.id].length).toBe(2);
      const aNeighbors = adjList[pointA.id].map(n => n.to);
      expect(aNeighbors).toContain(pointB.id);
      expect(aNeighbors).toContain(pointC.id);

      // Point B should have edges to A and C
      expect(adjList[pointB.id].length).toBe(2);
      const bNeighbors = adjList[pointB.id].map(n => n.to);
      expect(bNeighbors).toContain(pointA.id);
      expect(bNeighbors).toContain(pointC.id);

      // Point C should have edges to A and B
      expect(adjList[pointC.id].length).toBe(2);
      const cNeighbors = adjList[pointC.id].map(n => n.to);
      expect(cNeighbors).toContain(pointA.id);
      expect(cNeighbors).toContain(pointB.id);
    });

    it('should include weights in adjacency list', async () => {
      const graph = await getGraph();
      const adjList = graph.adjacencyList;

      adjList[pointA.id].forEach(neighbor => {
        expect(neighbor.weight).toBeGreaterThan(0);
        expect(neighbor.to).toBeDefined();
        expect(neighbor.edgeId).toBeDefined();
      });
    });
  });

  describe('deletePathEdge', () => {
    it('should delete an edge', async () => {
      const edge = await createPathEdge({
        point_a_id: pointA.id,
        point_b_id: pointB.id,
      }, testUser);

      const result = await deletePathEdge(edge.id);
      expect(result.deleted).toBe(true);
      expect(result.id).toBe(edge.id);

      // Verify deletion
      await expect(
        getPathEdgeById(edge.id)
      ).rejects.toThrow('Path edge not found');
    });
  });
});
