# Product: Agent Locator Backend System

## Objective
Build a scalable backend service to locate nearby agents using geospatial queries, along with a review and rating system. The system should be optimized for performance using caching and designed with production-grade practices.

---

## Tech Stack

- Frontend: Next.js (client)
- Backend: Node.js (Express or Fastify)
- Database: PostgreSQL with PostGIS extension
- Cache: Redis (TTL-based caching)
- Containerization: Docker & Docker Compose

---

## Core Features

### 1. Geospatial Search API

#### Description
Find nearby agents based on latitude, longitude, and radius.

#### Input
- latitude (float)
- longitude (float)
- radius (in kilometers)
- page (optional)
- limit (optional)

#### Flow
1. Client sends request with location and radius
2. Backend validates input
3. Check Redis cache:
   - If cache HIT → return cached results
   - If cache MISS:
     - Query PostgreSQL using PostGIS (ST_DWithin)
     - Filter only active agents
     - Apply pagination
     - Store result in Redis (TTL: 5 minutes)
     - Return response

---

### 2. Agent Details API

#### Description
Fetch agent details by ID

#### Flow
1. Client sends request with agent ID
2. Backend validates ID
3. Fetch agent from database
4. If agent not found or inactive:
   - Return 404 error
5. Else:
   - Return agent details

---

### 3. Reviews & Rating System

#### Add Review (POST)

Input:
- agent_id
- rating (1–5)
- comment

Flow:
1. Validate input
2. Sanitize comment (XSS protection)
3. Start database transaction
4. Insert review into reviews table
5. Recalculate average rating:
   avg_rating = total_rating_sum / total_reviews
6. Update agent table:
   - avg_rating
   - total_reviews
7. Commit transaction
8. Return success response

---

#### Get Reviews (GET)

Input:
- agent_id
- page
- limit

Flow:
1. Fetch reviews from database
2. Apply pagination
3. Return response

---

## Database Design

### Agents Table

- id (UUID, primary key)
- name (string)
- location (GEOGRAPHY(Point)) [PostGIS]
- is_active (boolean)
- avg_rating (float)
- total_reviews (integer)
- created_at (timestamp)

---

### Reviews Table

- id (UUID, primary key)
- agent_id (foreign key → agents.id)
- rating (integer, 1–5)
- comment (text)
- created_at (timestamp)

---

## Caching Strategy

- Use Redis for caching search results
- Cache key:
  agents:{lat}:{lng}:{radius}:{page}:{limit}
- TTL: 5 minutes
- Cache only GET search responses

---

## Security & Middleware

- Rate Limiting (prevent abuse)
- CORS configuration
- Input validation (Joi/Zod)
- SQL injection protection (ORM)
- XSS protection (sanitize inputs)

---

## Error Handling

- Centralized error handler
- Standard response format:

{
  "success": false,
  "message": "Error message",
  "error": {}
}

---

## Logging

- Log all requests and errors
- Use structured logging (e.g., Winston/Pino)

---

## API Endpoints

### Search Agents
GET /agents/search?lat=&lng=&radius=&page=&limit=

### Get Agent Details
GET /agents/:id

### Add Review
POST /agents/:id/reviews

### Get Reviews
GET /agents/:id/reviews?page=&limit=

---

## System Architecture

### Components

- Client (Next.js)
- API Server (Node.js)
- Middleware Layer
- Service Layer:
  - Agent Service
  - Review Service
- Redis Cache
- PostgreSQL + PostGIS
- Logging System
- Error Handler

---

## Key Flows

### 1. Search Flow (with Cache)

Client → API → Check Redis  
→ (Hit → Return)  
→ (Miss → Query DB → Store in Redis → Return)

---

### 2. Review Flow

Client → API → Validate → Start Transaction  
→ Insert Review → Update Rating  
→ Commit → Return

---

## Deployment

- Use Docker Compose with:
  - Backend service
  - PostgreSQL (PostGIS image)
  - Redis

---

## Non-Functional Requirements

- Scalable (stateless backend)
- Fast response time (cache-enabled)
- Consistent rating updates
- Clean and maintainable architecture

---

## Expected Output
- API structure
- Docker-ready backend system