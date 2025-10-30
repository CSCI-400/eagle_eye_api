const request = require('supertest');

// Test credentials provided by user
const TEST_USER = {
  email: 'pedropascal@gmail.com',
  password: 'Llama@830'
};

let authToken = null;

/**
 * Login with test user credentials and return auth token
 */
async function loginTestUser(app) {
  const response = await request(app)
    .put('/users/login')
    .send({
      email: TEST_USER.email,
      password: TEST_USER.password
    });

  if (response.body && response.body.idToken) {
    authToken = response.body.idToken;
    return authToken;
  }

  throw new Error('Failed to login test user');
}

/**
 * Get the current auth token
 */
function getAuthToken() {
  return authToken;
}

/**
 * Clear the auth token
 */
function clearAuthToken() {
  authToken = null;
}

/**
 * Create a test user (for registration tests)
 */
function generateTestUser(overrides = {}) {
  const timestamp = Date.now();
  return {
    email: `testuser${timestamp}@test.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    ...overrides
  };
}

/**
 * Create test event data
 */
function generateTestEvent(overrides = {}) {
  const timestamp = Date.now();
  return {
    name: `Test Event ${timestamp}`,
    description: 'Test event description',
    date: new Date().toISOString(),
    location: 'Test Location',
    ...overrides
  };
}

/**
 * Create test location data
 */
function generateTestLocation(overrides = {}) {
  const timestamp = Date.now();
  return {
    name: `Test Location ${timestamp}`,
    latitude: 40.7128,
    longitude: -74.0060,
    description: 'Test location description',
    ...overrides
  };
}

/**
 * Create test path point data
 */
function generateTestPathPoint(overrides = {}) {
  return {
    latitude: 40.7128 + Math.random() * 0.1,
    longitude: -74.0060 + Math.random() * 0.1,
    timestamp: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Make authenticated request
 */
function authenticatedRequest(app, method, path) {
  const req = request(app)[method.toLowerCase()](path);
  if (authToken) {
    req.set('Authorization', `Bearer ${authToken}`);
  }
  return req;
}

module.exports = {
  TEST_USER,
  loginTestUser,
  getAuthToken,
  clearAuthToken,
  generateTestUser,
  generateTestEvent,
  generateTestLocation,
  generateTestPathPoint,
  authenticatedRequest
};
