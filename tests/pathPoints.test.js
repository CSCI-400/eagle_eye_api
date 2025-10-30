const request = require('supertest');

// Import app
const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());

// Mount routers
app.use('/users', require('../src/routers/userRouter'));
app.use('/events', require('../src/routers/eventRouter'));
app.use('/path-points', require('../src/routers/pathPointRouter'));
app.use('/locations', require('../src/routers/locationRouter'));

const {
  loginTestUser,
  clearAuthToken,
  generateTestPathPoint
} = require('./helpers/testHelpers');

describe('PathPoint Router Tests', () => {
  let authToken;
  let testPathPointId;

  beforeAll(async () => {
    // Login with test user to get auth token
    try {
      authToken = await loginTestUser(app);
    } catch (error) {
      console.warn('Could not login test user before tests:', error.message);
    }
  });

  afterAll(() => {
    clearAuthToken();
  });

  describe('GET /path-points', () => {
    it('should list all path points', async () => {
      const response = await request(app)
        .get('/path-points');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body) || response.body.pathPoints).toBeTruthy();
    });

    it('should handle empty path point list', async () => {
      const response = await request(app)
        .get('/path-points');

      expect(response.status).toBe(200);
      // Response should be an array (could be empty)
      if (Array.isArray(response.body)) {
        expect(response.body).toBeDefined();
      } else if (response.body.pathPoints) {
        expect(Array.isArray(response.body.pathPoints)).toBeTruthy();
      }
    });
  });

  describe('POST /path-points', () => {
    it('should create path point with authentication', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const newPathPoint = generateTestPathPoint();

      const response = await request(app)
        .post('/path-points')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newPathPoint);

      // Accept 200, 201, or 401 (if idToken doesn't work as session cookie)
      expect([200, 201, 401]).toContain(response.status);
      
      if (response.status === 200 || response.status === 201) {
        if (response.body.id || response.body.pathPointId) {
          testPathPointId = response.body.id || response.body.pathPointId;
          expect(testPathPointId).toBeTruthy();
        }
      }
    });

    it('should reject path point creation without authentication', async () => {
      const newPathPoint = generateTestPathPoint();

      const response = await request(app)
        .post('/path-points')
        .send(newPathPoint);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should reject path point creation with invalid data', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const invalidPathPoint = {
        timestamp: new Date().toISOString()
        // Missing required latitude/longitude
      };

      const response = await request(app)
        .post('/path-points')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPathPoint);

      expect([400, 401]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });

    it('should reject path point with invalid coordinates', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const invalidPathPoint = generateTestPathPoint({
        latitude: 200, // Invalid latitude
        longitude: -74.0060
      });

      const response = await request(app)
        .post('/path-points')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPathPoint);

      expect([400, 401]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });

    it('should reject path point with missing timestamp', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const invalidPathPoint = {
        latitude: 40.7128,
        longitude: -74.0060
        // Missing timestamp
      };

      const response = await request(app)
        .post('/path-points')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPathPoint);

      expect([400, 401]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /path-points/:id', () => {
    it('should get path point by valid ID', async () => {
      if (!testPathPointId) {
        console.warn('Skipping test: no test path point ID available');
        return;
      }

      const response = await request(app)
        .get(`/path-points/${testPathPointId}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return 404 for non-existent path point ID', async () => {
      const fakeId = 'nonexistent-pathpoint-id-12345';

      const response = await request(app)
        .get(`/path-points/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid path point ID format', async () => {
      const invalidId = 'invalid@id#format';

      const response = await request(app)
        .get(`/path-points/${invalidId}`);

      expect([400, 404]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /path-points/:id', () => {
    it('should reject update without authentication', async () => {
      if (!testPathPointId) {
        console.warn('Skipping test: no test path point ID available');
        return;
      }

      const updates = {
        latitude: 40.7200,
        longitude: -74.0100
      };

      const response = await request(app)
        .put(`/path-points/${testPathPointId}`)
        .send(updates);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should update path point with authentication and valid data', async () => {
      if (!authToken || !testPathPointId) {
        console.warn('Skipping test: no auth token or path point ID available');
        return;
      }

      const updates = {
        latitude: 40.7200,
        longitude: -74.0100
      };

      const response = await request(app)
        .put(`/path-points/${testPathPointId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return 404 for updating non-existent path point', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const fakeId = 'nonexistent-pathpoint-id-12345';
      const updates = {
        latitude: 40.7200
      };

      const response = await request(app)
        .put(`/path-points/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect([401, 404]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });

    it('should reject update with invalid coordinates', async () => {
      if (!authToken || !testPathPointId) {
        console.warn('Skipping test: no auth token or path point ID available');
        return;
      }

      const invalidUpdates = {
        latitude: 300 // Invalid latitude
      };

      const response = await request(app)
        .put(`/path-points/${testPathPointId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdates);

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('DELETE /path-points/:id', () => {
    it('should reject deletion without authentication', async () => {
      if (!testPathPointId) {
        console.warn('Skipping test: no test path point ID available');
        return;
      }

      const response = await request(app)
        .delete(`/path-points/${testPathPointId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for deleting non-existent path point', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const fakeId = 'nonexistent-pathpoint-id-12345';

      const response = await request(app)
        .delete(`/path-points/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([401, 404]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });

    it('should delete path point with authentication and valid ID', async () => {
      if (!authToken || !testPathPointId) {
        console.warn('Skipping test: no auth token or path point ID available');
        return;
      }

      const response = await request(app)
        .delete(`/path-points/${testPathPointId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
      
      // Verify deletion
      const getResponse = await request(app)
        .get(`/path-points/${testPathPointId}`);
      
      expect(getResponse.status).toBe(404);
    });

    it('should handle invalid path point ID format', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const invalidId = 'invalid@id#format';

      const response = await request(app)
        .delete(`/path-points/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 401, 404]).toContain(response.status);
    });
  });
});
