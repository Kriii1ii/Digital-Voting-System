# 📡 API Reference

Complete reference for all Biometric Verification Service endpoints.

**Base URL**: `http://localhost:8000`

**Content-Type**: `application/json` (for all POST requests)

---

## 📋 Table of Contents

1. [Health & Info](#health--info)
2. [Face Registration](#face-registration)
3. [Face Authentication](#face-authentication)
4. [Face Quality](#face-quality)
5. [Face Management](#face-management)
6. [Fingerprint](#fingerprint)
7. [Error Handling](#error-handling)

---

## Health & Info

### GET `/`

Get service information and available endpoints.

**Response**:
```json
{
  "service": "Biometric Verification Service",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "face_register": "/face/register",
    ...
  }
}
```

### GET `/health`

Health check endpoint for monitoring.

**Response**:
```json
{
  "status": "ok",
  "service": "Biometric Verification Service",
  "version": "1.0.0"
}
```

---

## Face Registration

### POST `/face/register`

Register a user's face for future authentication.

**Request Body**:
```json
{
  "user_id": "string (required)",
  "imageBase64": "string (required, base64 encoded image)"
}
```

**Example**:
```json
{
  "user_id": "voter_12345",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Face registered successfully",
  "embedding_shape": [128]
}
```

**Quality Check Failed Response** (200):
```json
{
  "success": false,
  "message": "Image quality check failed",
  "reasons": [
    "Image too blurry (blur score: 85.3, minimum: 100)",
    "Image too dark (brightness: 42.1, minimum: 50)"
  ]
}
```

**Error Response** (400):
```json
{
  "detail": "No face detected in image"
}
```

**Quality Criteria**:
- Exactly 1 face detected
- Blur score ≥ 100
- Brightness between 50-200
- Frontal face orientation

---

## Face Authentication

### POST `/face/authenticate`

Authenticate a user by comparing their face to stored registration.

**Request Body**:
```json
{
  "user_id": "string (required)",
  "imageBase64": "string (required, base64 encoded image)"
}
```

**Example**:
```json
{
  "user_id": "voter_12345",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Success Response - Match** (200):
```json
{
  "success": true,
  "match": true,
  "score": 0.38,
  "message": "Authentication successful"
}
```

**Success Response - No Match** (200):
```json
{
  "success": true,
  "match": false,
  "score": 0.67,
  "message": "Face does not match"
}
```

**Score Interpretation**:
- `score < 0.45`: Match (authenticated)
- `score ≥ 0.45`: No match (not authenticated)
- Lower score = better match

**Error Response** (404):
```json
{
  "detail": "No face registration found for this user"
}
```

**Error Response** (400):
```json
{
  "detail": "No face detected in image"
}
```

---

## Face Quality

### POST `/face/quality-check`

Check image quality without registering. Useful for real-time feedback during capture.

**Request Body**:
```json
{
  "imageBase64": "string (required, base64 encoded image)"
}
```

**Success Response - Good Quality** (200):
```json
{
  "passed": true,
  "reasons": ["All quality checks passed"],
  "metrics": {
    "blur_score": 145.2,
    "blur_pass": true,
    "brightness": 128.5,
    "brightness_pass": true,
    "face_count": 1,
    "face_count_pass": true
  }
}
```

**Success Response - Poor Quality** (200):
```json
{
  "passed": false,
  "reasons": [
    "Image too blurry (blur score: 65.8, minimum: 100)",
    "Multiple faces detected - only one face required"
  ],
  "metrics": {
    "blur_score": 65.8,
    "blur_pass": false,
    "brightness": 125.0,
    "brightness_pass": true,
    "face_count": 2,
    "face_count_pass": false
  }
}
```

---

## Face Management

### GET `/face/check-registration/{user_id}`

Check if a user has a face registered.

**Parameters**:
- `user_id` (path): User identifier

**Example**:
```
GET /face/check-registration/voter_12345
```

**Response - Registered** (200):
```json
{
  "user_id": "voter_12345",
  "registered": true,
  "message": "Face registered"
}
```

**Response - Not Registered** (200):
```json
{
  "user_id": "voter_12345",
  "registered": false,
  "message": "No face registration found"
}
```

### DELETE `/face/reset/{user_id}`

Delete a user's face registration. Allows re-registration.

**Parameters**:
- `user_id` (path): User identifier

**Example**:
```
DELETE /face/reset/voter_12345
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Face registration reset successfully"
}
```

**Error Response** (404):
```json
{
  "detail": "No face registration found for this user"
}
```

---

## Fingerprint

### POST `/fingerprint/register`

Register fingerprint (WebAuthn simulation).

**Request Body**:
```json
{
  "user_id": "string (required)",
  "challenge": "string (optional)",
  "credential_id": "string (optional)",
  "public_key": "string (optional)"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Fingerprint registered successfully (simulated)",
  "status": "registered"
}
```

### POST `/fingerprint/authenticate`

Authenticate fingerprint (WebAuthn simulation).

**Request Body**:
```json
{
  "user_id": "string (required)",
  "challenge": "string (optional)",
  "signature": "string (optional)"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Fingerprint authenticated successfully (simulated)",
  "status": "authenticated"
}
```

### GET `/fingerprint/simulate`

Simulate fingerprint scan with progress updates.

**Response**: Server-Sent Events stream

**Example Events**:
```
data: {"progress": 0, "message": "Place finger on sensor"}

data: {"progress": 20, "message": "Detecting fingerprint..."}

data: {"progress": 40, "message": "Scanning ridges..."}

data: {"progress": 60, "message": "Analyzing patterns..."}

data: {"progress": 80, "message": "Verifying quality..."}

data: {"progress": 100, "message": "Scan complete"}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid image, no face detected, etc. |
| 404 | Not Found | User not registered |
| 422 | Validation Error | Invalid request body |
| 500 | Internal Server Error | Unexpected server error |

### Common Error Responses

**Invalid Image Format** (400):
```json
{
  "detail": "Invalid image format: Unsupported image type"
}
```

**No Face Detected** (400):
```json
{
  "detail": "No face detected in image"
}
```

**Validation Error** (422):
```json
{
  "detail": [
    {
      "loc": ["body", "user_id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## 🧪 Testing with cURL

### Register a Face
```bash
curl -X POST http://localhost:8000/face/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "imageBase64": "data:image/jpeg;base64,..."
  }'
```

### Authenticate
```bash
curl -X POST http://localhost:8000/face/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "imageBase64": "data:image/jpeg;base64,..."
  }'
```

### Check Quality
```bash
curl -X POST http://localhost:8000/face/quality-check \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "data:image/jpeg;base64,..."
  }'
```

### Check Registration
```bash
curl http://localhost:8000/face/check-registration/test_user
```

### Reset Registration
```bash
curl -X DELETE http://localhost:8000/face/reset/test_user
```

---

## 🌐 JavaScript Examples

### Capture Image from Video
```javascript
function captureImage(videoElement) {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  canvas.getContext('2d').drawImage(videoElement, 0, 0);
  return canvas.toDataURL('image/jpeg');
}
```

### Register Face
```javascript
async function registerFace(userId, imageBase64) {
  const response = await fetch('http://localhost:8000/face/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, imageBase64 })
  });
  return await response.json();
}
```

### Authenticate Face
```javascript
async function authenticateFace(userId, imageBase64) {
  const response = await fetch('http://localhost:8000/face/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, imageBase64 })
  });
  return await response.json();
}
```

---

## 🔐 Security Considerations

1. **HTTPS Required**: Always use HTTPS in production
2. **CORS**: Configure `ALLOWED_ORIGINS` appropriately
3. **Rate Limiting**: Implement to prevent abuse
4. **Authentication**: Add API key or JWT validation
5. **Data Privacy**: Embeddings only, no raw images stored
6. **Audit Logging**: Log all authentication attempts

---

## 📊 Rate Limits (Recommended)

| Endpoint | Limit | Window |
|----------|-------|--------|
| Registration | 10 requests | per minute |
| Authentication | 30 requests | per minute |
| Quality Check | 60 requests | per minute |

---

## 🔄 WebSocket Alternative (Future)

For real-time quality feedback:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/quality-check');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateQualityIndicator(data);
};
```

---

## 📖 Interactive Documentation

Visit these URLs when the service is running:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These provide interactive API testing capabilities.

---

**Last Updated**: 2025-10-24  
**API Version**: 1.0.0
