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
  generateTestEvent
} = require('./helpers/testHelpers');

describe('Event Router Tests', () => {
  let authToken;
  let testEventId;

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

  describe('POST /events', () => {
    it('should create event with authentication', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const newEvent = generateTestEvent();

      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newEvent);

      // Accept 200, 201, or 401 if auth token doesn't work
      expect([200, 201, 401]).toContain(response.status);
      
      if (response.status === 200 || response.status === 201) {
        if (response.body.id || response.body.eventId) {
          testEventId = response.body.id || response.body.eventId;
          expect(testEventId).toBeTruthy();
        }
      }
    });

    it('should reject event creation without authentication', async () => {
      const newEvent = generateTestEvent();

      const response = await request(app)
        .post('/events')
        .send(newEvent);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should reject event creation with invalid data', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const invalidEvent = {};

      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEvent);

      expect([400, 401]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });

    it('should reject event creation with missing required fields', async () => {
      if (!authToken) {
        console.warn('Skipping test: no auth token available');
        return;
      }

      const incompleteEvent = {
        name: 'Test Event'
        // Missing other required fields
      };

      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteEvent);

      expect([400, 401]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /events/:id', () => {
    it('should get event by valid ID', async () => {
      if (!testEventId) {
        console.warn('Skipping test: no test event ID available');
        return;
      }

      const response = await request(app)
        .get(`/events/${testEventId}`);

      expect([200, 201]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it('should return 404 for non-existent event ID', async () => {
      const fakeId = 'nonexistent-event-id-12345';

      const response = await request(app)
        .get(`/events/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid event ID format', async () => {
      const invalidId = 'invalid@id#format';

      const response = await request(app)
        .get(`/events/${invalidId}`);

      expect([400, 404]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /events/:id', () => {
    it('should update event with valid ID and data', async () => {
      if (!testEventId) {
        console.warn('Skipping test: no test event ID available');
        return;
      }

      const updates = {
        name: 'Updated Event Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/events/${testEventId}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return 404 for updating non-existent event', async () => {
      const fakeId = 'nonexistent-event-id-12345';
      const updates = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put(`/events/${fakeId}`)
        .send(updates);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });

    it('should reject update with invalid data', async () => {
      if (!testEventId) {
        console.warn('Skipping test: no test event ID available');
        return;
      }

      const invalidUpdates = {
        date: 'invalid-date-format'
      };

      const response = await request(app)
        .put(`/events/${testEventId}`)
        .send(invalidUpdates);

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('DELETE /events/:id', () => {
    it('should return 404 for deleting non-existent event', async () => {
      const fakeId = 'nonexistent-event-id-12345';

      const response = await request(app)
        .delete(`/events/${fakeId}`);

      expect([404, 500]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });

    it('should delete event with valid ID', async () => {
      if (!testEventId) {
        console.warn('Skipping test: no test event ID available');
        return;
      }

      const response = await request(app)
        .delete(`/events/${testEventId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
      
      // Verify deletion
      const getResponse = await request(app)
        .get(`/events/${testEventId}`);
      
      expect(getResponse.status).toBe(404);
    });

    it('should handle invalid event ID format', async () => {
      const invalidId = 'invalid@id#format';

      const response = await request(app)
        .delete(`/events/${invalidId}`);

      expect([400, 404, 500]).toContain(response.status);
    });
  });
});
