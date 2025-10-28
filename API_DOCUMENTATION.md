# Eagle Eye API Documentation

## Overview

The Eagle Eye API is a Node.js/Express.js RESTful API with Firebase integration following a layered architecture pattern. It provides endpoints for user management, event management, and map point management.

**Base URL:** `https://your-domain.com` (or `http://localhost:3000` for local development)

## Authentication

Most endpoints require authentication using Firebase session cookies. Include the session cookie in the Authorization header:

```
Authorization: Bearer <sessionCookie>
```

### Getting Authentication Tokens

1. **Register/Login**: Use `/users/register` or `/users/login` to get a session cookie
2. **Google Auth**: Use `/users/google-auth` for Google OAuth authentication

## Global Response Format

### Success Response
```json
{
  "id": "string",
  "field1": "value1",
  "field2": "value2"
}
```

### Error Response
```json
{
  "error": {
    "code": 400,
    "message": "Descriptive error message"
  }
}
```

---

## API Version Endpoint

### Get API Version
**GET** `/`

Get the current API version information.

**Authentication:** None required

**Response:**
```json
{
  "version": "1.0.0"
}
```

---

## User Management Endpoints

### 1. Register User
**POST** `/users/register`

Create a new user account with email/password authentication.

**Authentication:** None required

**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| displayName | string | Yes | Unique display name for the user |
| email | string | Yes | Valid email address |
| password | string | Yes | User password |
| profilePicture | file | No | Profile picture image (max 5MB) |

**Success Response (201):**
```json
{
  "id": "firebase-user-uid",
  "email": "user@example.com",
  "profilePicture": "https://storage.googleapis.com/... or null"
}
```

**Error Responses:**
- **400 Bad Request:** Invalid data, display name taken, or file validation errors
- **409 Conflict:** Email already exists

**Error Codes:**
- `EMAIL_EXISTS`: Email already in use
- `DISPLAY_NAME_TAKEN`: Display name already taken
- `INVALID_DATA`: Validation error
- `INVALID_FILE_TYPE`: Profile picture must be an image
- `FILE_TOO_LARGE`: Profile picture exceeds 5MB

---

### 2. Login User  
**PUT** `/users/login`

Authenticate user with email/password and get session cookie.

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Success Response (200):**
```json
{
  "idToken": "firebase-id-token",
  "sessionCookie": "session-cookie-string"
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid credentials or account disabled

**Error Codes:**
- `AUTH_FAILED`: Authentication failed

---

### 3. Google Authentication
**POST** `/users/google-auth`

Authenticate user with Google OAuth and create account if needed.

**Authentication:** None required

**Request Body:**
```json
{
  "accessToken": "google-access-token"
}
```

**Success Response (200):**
```json
{
  "uid": "firebase-user-uid",
  "email": "user@gmail.com", 
  "sessionCookie": "session-cookie-string",
  "isNewUser": true
}
```

**Error Responses:**
- **400 Bad Request:** Missing access token
- **401 Unauthorized:** Invalid or expired token

**Error Codes:**
- `MISSING_ACCESSTOKEN`: Access token not provided
- `ID_TOKEN_EXPIRED`: Token expired
- `ID_TOKEN_REVOKED`: Token revoked
- `INVALID_ID_TOKEN`: Invalid token format
- `GOOGLE_AUTH_FAILED`: General Google auth failure

---

### 4. Logout User
**PUT** `/users/logout`

Invalidate user session and logout.

**Authentication:** Required (Bearer token or request body)

**Request Body (optional):**
```json
{
  "sessionCookie": "session-cookie-string"
}
```

**Success Response (200):**
```json
{
  "message": "Signed out successfully",
  "uid": "user-uid"
}
```

**Error Responses:**
- **401 Unauthorized:** Missing or invalid session cookie

**Error Codes:**
- `NO_SESSION`: Missing session cookie
- `INVALID_SESSION`: Invalid or expired session

---

### 5. Delete User Account
**DELETE** `/users/delete`

Permanently delete user account and all associated data.

**Authentication:** Required

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**
- **401 Unauthorized:** Missing or invalid session cookie

**Error Codes:**
- `NO_SESSION`: Missing session cookie
- `INVALID_SESSION`: Invalid or expired session

---

### 6. Get Current User Info
**GET** `/users/me`

Get complete information for the currently authenticated user.

**Authentication:** Required

**Success Response (200):**
```json
{
  "id": "user-uid",
  "displayName": "User Display Name",
  "email": "user@example.com",
  "profilePicture": "https://storage.googleapis.com/...",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid or missing authentication
- **404 Not Found:** User not found

**Error Codes:**
- `UNAUTHORIZED`: Invalid authentication
- `NOT_FOUND`: User not found

---

### 7. Update User Information
**PUT** `/users/`

Update user profile information.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| displayName | string | No | New display name |
| email | string | No | New email address |
| profilePicture | file | No | New profile picture (max 5MB) |

**Success Response (200):**
```json
{
  "id": "user-uid",
  "displayName": "Updated Name",
  "email": "newemail@example.com",
  "profilePicture": "https://storage.googleapis.com/...",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- **400 Bad Request:** Invalid data or file validation errors
- **404 Not Found:** User not found

**Error Codes:**
- `INVALID_FILE_TYPE`: Profile picture must be an image
- `FILE_TOO_LARGE`: Profile picture exceeds 5MB
- `NOT_FOUND`: User not found

---

### 8. Get Public User Info
**GET** `/users/public/:email`

Get public information for a user by email address.

**Authentication:** None required

**URL Parameters:**
- `email`: Email address of the user to look up

**Success Response (200):**
```json
{
  "id": "user-uid",
  "firstName": "John",
  "lastName": "Doe", 
  "fullName": "John Doe",
  "email": "user@example.com"
}
```

**Error Responses:**
- **404 Not Found:** User not found
- **400 Bad Request:** Invalid email format

**Error Codes:**
- `NOT_FOUND`: User not found
- `BAD_REQUEST`: Invalid request

---

## Event Management Endpoints

### 1. Create Event
**POST** `/events/`

Create a new event.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Event Title",
  "description": "Event description",
  "location_id": "uuid-string",
  "start_time": "2023-12-01T10:00:00.000Z",
  "end_time": "2023-12-01T12:00:00.000Z",
  "visibility": "public",
  "invitees": {
    "user-uid-1": "public",
    "user-uid-2": "private"
  }
}
```

**Field Descriptions:**
- `title`: Event name (required)
- `description`: Event details (required)
- `location_id`: UUID reference to location (optional)
- `start_time`: ISO datetime string (required)
- `end_time`: ISO datetime string (required, must be after start_time)
- `visibility`: "public" or "private" (optional)
- `invitees`: Object mapping user UIDs to visibility levels (optional)

**Success Response (201):**
```json
{
  "id": "event-document-id",
  "title": "Event Title",
  "description": "Event description",
  "location_id": "uuid-string",
  "start_time": "2023-12-01T10:00:00.000Z",
  "end_time": "2023-12-01T12:00:00.000Z",
  "createdBy": "user-uid",
  "visibility": "public",
  "invitees": {},
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- **400 Bad Request:** Validation errors (invalid datetime, end_time before start_time, etc.)

---

### 2. Get Event
**GET** `/events/:id`

Retrieve a specific event by ID.

**Authentication:** None required

**URL Parameters:**
- `id`: Event document ID

**Success Response (201):**
```json
{
  "id": "event-document-id",
  "title": "Event Title",
  "description": "Event description",
  "location_id": "uuid-string",
  "start_time": "2023-12-01T10:00:00.000Z", 
  "end_time": "2023-12-01T12:00:00.000Z",
  "createdBy": "user-uid",
  "visibility": "public",
  "invitees": {},
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- **404 Not Found:** Event not found

---

### 3. Update Event
**PUT** `/events/:id`

Update an existing event.

**Authentication:** None required

**URL Parameters:**
- `id`: Event document ID

**Request Body:** (partial update - include only fields to update)
```json
{
  "title": "Updated Event Title",
  "description": "Updated description",
  "end_time": "2023-12-01T14:00:00.000Z"
}
```

**Success Response (200):**
```json
{
  "id": "event-document-id",
  "title": "Updated Event Title",
  "description": "Updated description", 
  "location_id": "uuid-string",
  "start_time": "2023-12-01T10:00:00.000Z",
  "end_time": "2023-12-01T14:00:00.000Z",
  "createdBy": "user-uid",
  "visibility": "public",
  "invitees": {},
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- **404 Not Found:** Event not found
- **500 Internal Server Error:** Update failed

**Error Codes:**
- `NOT_FOUND`: Event not found

---

### 4. Delete Event
**DELETE** `/events/:id`

Delete an event permanently.

**Authentication:** None required

**URL Parameters:**
- `id`: Event document ID

**Success Response (200):**
```json
{
  "message": "Event deleted successfully"
}
```

**Error Responses:**
- **500 Internal Server Error:** Deletion failed

---

## Map Point Management Endpoints

### 1. List Map Points
**GET** `/map-points/`

Get a list of map points with optional filtering.

**Authentication:** None required

**Query Parameters:**
- `bbox`: Comma-separated bounding box coordinates (minLat,minLng,maxLat,maxLng)
- `category`: Filter by category name

**Example:**
```
GET /map-points/?bbox=40.7,-74.1,40.8,-73.9&category=restaurant
```

**Success Response (200):**
```json
[
  {
    "id": "map-point-id",
    "title": "Point Title",
    "description": "Point description", 
    "lat": 40.7589,
    "lng": -73.9851,
    "category": "general",
    "createdBy": "user-uid",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

**Error Responses:**
- **400 Bad Request:** Invalid query parameters

---

### 2. Get Map Point
**GET** `/map-points/:id`

Retrieve a specific map point by ID.

**Authentication:** None required

**URL Parameters:**
- `id`: Map point document ID

**Success Response (200):**
```json
{
  "id": "map-point-id",
  "title": "Point Title",
  "description": "Point description",
  "lat": 40.7589,
  "lng": -73.9851,
  "category": "general",
  "createdBy": "user-uid",
  "createdAt": "2023-01-01T00:00:00.000Z", 
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- **404 Not Found:** Map point not found

---

### 3. Create Map Point
**POST** `/map-points/`

Create a new map point.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Point Title",
  "description": "Point description",
  "lat": 40.7589,
  "lng": -73.9851,
  "category": "restaurant"
}
```

**Field Descriptions:**
- `title`: Point name (required)
- `description`: Point description (optional, defaults to empty string)
- `lat`: Latitude between -90 and 90 (required)
- `lng`: Longitude between -180 and 180 (required)  
- `category`: Category name (optional, defaults to "general")

**Success Response (201):**
```json
{
  "id": "map-point-id",
  "title": "Point Title", 
  "description": "Point description",
  "lat": 40.7589,
  "lng": -73.9851,
  "category": "restaurant",
  "createdBy": "user-uid",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- **400 Bad Request:** Validation errors (invalid coordinates, missing required fields)

---

### 4. Update Map Point
**PUT** `/map-points/:id`

Update an existing map point.

**Authentication:** Required

**URL Parameters:**
- `id`: Map point document ID

**Request Body:** (partial update - include only fields to update)
```json
{
  "title": "Updated Point Title",
  "lat": 40.7600,
  "lng": -73.9800
}
```

**Success Response (200):**
```json
{
  "id": "map-point-id",
  "title": "Updated Point Title",
  "description": "Point description",
  "lat": 40.7600,
  "lng": -73.9800, 
  "category": "restaurant",
  "createdBy": "user-uid",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- **400 Bad Request:** Validation errors or map point not found

---

### 5. Delete Map Point
**DELETE** `/map-points/:id`

Delete a map point permanently.

**Authentication:** Required

**URL Parameters:**
- `id`: Map point document ID

**Success Response (200):**
```json
{
  "id": "map-point-id",
  "deleted": true
}
```

**Error Responses:**
- **400 Bad Request:** Deletion failed or map point not found

---

## Data Models

### User Model
```typescript
{
  displayName: string,        // Required, unique
  email: string,              // Required, valid email
  profilePicture?: string,    // Optional, URL to image
  createdAt: string,          // ISO timestamp
  updatedAt: string           // ISO timestamp
}
```

### Event Model
```typescript
{
  uid?: string,               // UUID
  title: string,              // Required
  description: string,        // Required  
  location_id?: string,       // UUID reference
  start_time: string,         // Required, ISO datetime
  end_time: string,           // Required, ISO datetime, must be after start_time
  createdBy?: string,         // User UID
  visibility?: 'public' | 'private',
  invitees?: Record<string, 'public' | 'private'>, // User UID -> visibility
  createdAt: string,          // ISO timestamp
  updatedAt: string           // ISO timestamp
}
```

### Map Point Model
```typescript
{
  title: string,              // Required
  description: string,        // Defaults to empty string
  lat: number,                // Required, -90 to 90
  lng: number,                // Required, -180 to 180
  category: string,           // Defaults to "general"
  createdBy?: string,         // User UID
  createdAt: string,          // ISO timestamp
  updatedAt: string           // ISO timestamp
}
```

---

## Environment Variables

Required environment variables:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_SERVICE_ACCOUNT=your_firebase_service_account_json

# Server Configuration  
PORT=3000
NODE_ENV=development
```

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required or invalid |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error - Server error |

---

## Rate Limiting & Best Practices

1. **Authentication**: Always include the session cookie in the Authorization header for protected endpoints
2. **File Uploads**: Profile pictures must be images under 5MB
3. **Coordinates**: Latitude must be between -90 and 90, longitude between -180 and 180
4. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
5. **Display Names**: Must be unique across all users
6. **Email Addresses**: Must be valid and unique

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": 400,
    "message": "Descriptive error message"
  }
}
```

Common error codes include validation errors, authentication failures, and resource not found errors. Check the specific endpoint documentation for detailed error codes and meanings.