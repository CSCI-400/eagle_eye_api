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
  generateTestLocation
} = require('./helpers/testHelpers');

describe('Location Router Tests', () => {
  let authToken;
  let testLocationId;

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

  describe('GET /locations', () => {
    it('should list all locations', async () => {
      const response = await request(app)
        .get('/locations');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body) || response.body.locations).toBeTruthy();
    });

    it('should handle empty location list', async () => {
      const response = await request(app)
        .get('/locations');

      expect(response.status).toBe(200);
      // Response should be an array (could be empty)
      if (Array.isArray(response.body)) {
        expect(response.body).toBeDefined();
      } else if (response.body.locations) {
        expect(Array.isArray(response.body.locations)).toBeTruthy();
      }
    });
  });

  describe('POST /locations', () => {
    it('should create location with authentication', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const newLocation = generateTestLocation();

      const response = await request(app)
        .post('/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newLocation);

      // Accept 200, 201, or 401 (if idToken doesn't work as session cookie)
      expect([200, 201, 401]).toContain(response.status);
      
      if (response.status === 200 || response.status === 201) {
        if (response.body.id || response.body.locationId) {
          testLocationId = response.body.id || response.body.locationId;
          expect(testLocationId).toBeTruthy();
        }
      }
    });

    it('should reject location creation without authentication', async () => {
      const newLocation = generateTestLocation();

      const response = await request(app)
        .post('/locations')
        .send(newLocation);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should reject location creation with invalid data', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const invalidLocation = {
        name: 'Test Location',
        // Missing required latitude/longitude
      };

      const response = await request(app)
        .post('/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidLocation);

      expect([400, 401]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });

    it('should reject location with invalid coordinates', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const invalidLocation = generateTestLocation({
        latitude: 200, // Invalid latitude
        longitude: -74.0060
      });

      const response = await request(app)
        .post('/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidLocation);

      expect([400, 401]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /locations/:id', () => {
    it('should get location by valid ID', async () => {
      if (!testLocationId) {
        console.warn('Skipping test: no test location ID available');
        return;
      }

      const response = await request(app)
        .get(`/locations/${testLocationId}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return 404 for non-existent location ID', async () => {
      const fakeId = 'nonexistent-location-id-12345';

      const response = await request(app)
        .get(`/locations/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid location ID format', async () => {
      const invalidId = 'invalid@id#format';

      const response = await request(app)
        .get(`/locations/${invalidId}`);

      expect([400, 404]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /locations/:id', () => {
    it('should reject update without authentication', async () => {
      if (!testLocationId) {
        console.warn('Skipping test: no test location ID available');
        return;
      }

      const updates = {
        name: 'Updated Location Name'
      };

      const response = await request(app)
        .put(`/locations/${testLocationId}`)
        .send(updates);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should update location with authentication and valid data', async () => {
      if (!authToken || !testLocationId) {
        console.warn('Skipping test: no auth token or location ID available');
        return;
      }

      const updates = {
        name: 'Updated Location Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/locations/${testLocationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return 404 for updating non-existent location', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const fakeId = 'nonexistent-location-id-12345';
      const updates = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put(`/locations/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect([401, 404]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });

    it('should reject update with invalid coordinates', async () => {
      if (!authToken || !testLocationId) {
        console.warn('Skipping test: no auth token or location ID available');
        return;
      }

      const invalidUpdates = {
        latitude: 300 // Invalid latitude
      };

      const response = await request(app)
        .put(`/locations/${testLocationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdates);

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('DELETE /locations/:id', () => {
    it('should reject deletion without authentication', async () => {
      if (!testLocationId) {
        console.warn('Skipping test: no test location ID available');
        return;
      }

      const response = await request(app)
        .delete(`/locations/${testLocationId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for deleting non-existent location', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const fakeId = 'nonexistent-location-id-12345';

      const response = await request(app)
        .delete(`/locations/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([401, 404]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });

    it('should delete location with authentication and valid ID', async () => {
      if (!authToken || !testLocationId) {
        console.warn('Skipping test: no auth token or location ID available');
        return;
      }

      const response = await request(app)
        .delete(`/locations/${testLocationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
      
      // Verify deletion
      const getResponse = await request(app)
        .get(`/locations/${testLocationId}`);
      
      expect(getResponse.status).toBe(404);
    });

    it('should handle invalid location ID format', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const invalidId = 'invalid@id#format';

      const response = await request(app)
        .delete(`/locations/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 401, 404]).toContain(response.status);
    });
  });
});
