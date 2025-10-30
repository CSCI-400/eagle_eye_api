const request = require('supertest');

// Import app
const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());

// Mount root endpoint
app.get('/', (_req, res) => {
  const version = require('../package.json').version;
  console.log(`API Server Version: ${version}`);
  res.json({ version });
});

// Mount routers
app.use('/users', require('../src/routers/userRouter'));
app.use('/events', require('../src/routers/eventRouter'));
app.use('/path-points', require('../src/routers/pathPointRouter'));
app.use('/locations', require('../src/routers/locationRouter'));

describe('API Root Endpoint Tests', () => {
  describe('GET /', () => {
    it('should return API version information', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('version');
      expect(typeof response.body.version).toBe('string');
      expect(response.body.version).toBeTruthy();
    });

    it('should return valid JSON', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).toBe(200);
      expect(response.type).toBe('application/json');
    });

    it('should return consistent version', async () => {
      const response1 = await request(app).get('/');
      const response2 = await request(app).get('/');

      expect(response1.body.version).toBe(response2.body.version);
    });
  });
});
