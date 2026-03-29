# Agent Locator Backend

A production-grade, highly scalable backend system for locating nearby local agents using geospatial capabilities, built with Node.js, Express, PostgreSQL (PostGIS), Redis, and Prisma.

## 🌟 Key Features

- **Geospatial Agent Search**: Discover nearby agents within a dynamic radius leveraging PostGIS `ST_DWithin` raw queries for high-performance spatial searches.
- **Review System & Transactions**: Submit reviews for an agent. Atomic database transactions securely recalculate the agent's aggregate rating dynamically.
- **Aggressive Caching**: Search results are aggressively cached to Redis for 5 minutes, significantly reducing query loads during heavy traffic.
- **Security Protocols**: Built-in Request Rate Limiting, HTTP Helmet Headers, and explicit Cross-Site Scripting (XSS) sanitation on reviews.
- **Bulletproof Validation**: Runtime validation mappings using Zod + TypeScript configurations.

---

## 🏗️ Technology Stack

- **Backend Framework**: Node.js & Express 5
- **Database**: PostgreSQL with PostGIS extension natively implemented
- **Caching Layer**: Redis
- **ORM**: Prisma (v7 strict schemas)
- **Containerization**: Docker & Docker Compose
- **Validation**: Zod schema mappings

---

## 🚀 Quick Setup (Docker) - Recommended

Requires: [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.

1. **Clone the repository and set up environment variables**
   ```bash
   git clone https://github.com/sai-sunnapu/reaison-assesment.git
   cd reaison-assesment
   npm install

   # Setup the secret keys referencing the local instances
   cp .env.example .env
   ```

2. **Boot up Docker Clusters**
   ```bash
   # Starts up PostgreSQL (with PostGIS enabled) and Redis instances
   docker-compose up -d
   ```

3. **Database Schema & PostGIS Setup**
   ```bash
   # Generate Prisma interfaces and migrate schema definitions
   npm run db:migrate

   # Map native PostGIS fields via manually generated trigger SQL
   npm run db:postgis
   ```

4. **Seed Database and Start Dev Server**
   ```bash
   npm run db:seed
   npm run dev
   ```

> 🌟 **API is now active at:** `http://localhost:3000`

---

## ⚙️ Manual Setup (Without Docker)

1. Ensure **PostgreSQL** (with the PostGIS extension) and **Redis** are installed and listening locally on matching ports (`5432` and `6379`).
2. Map your `.env` connection strings appropriately (`DATABASE_URL` and `REDIS_URL`).
3. Run migrations and PostGIS scripts (`npm run db:migrate` then `npm run db:postgis`).
4. Execute `npm run db:seed` and `npm run dev`.

---

## 📝 API Documentation (Swagger)

This project features a fully documented self-hosted API playground using **Swagger UI**.

🔥 **Access Swagger Playground:**
Navigate to [http://localhost:3000/api-docs](http://localhost:3000/api-docs) when the server is running to view interactive definitions, test endpoints seamlessly, and generate custom client queries!

---

## 🚥 Testing & API Endpoints

You can test endpoints easily via Swagger (above) or programmatically via tools like Postman / cURL.

**1. 📡 System Health Check**
```bash
curl "http://localhost:3000/health"
```

**2. 🔎 Search Nearby Agents** (Paginated + Cached)
Searches for agents strictly matching spatial coordinates within `radius` kilometers.
```bash
curl "http://localhost:3000/api/v1/agents/search?lat=28.6139&lng=77.2090&radius=15&page=1&limit=20"
```

**3. 📌 Fetch Specific Agent Profile**
*(Replace `<AGENT_ID>` with one of the UUIDs returned from the search result above)*
```bash
curl "http://localhost:3000/api/v1/agents/<AGENT_ID>"
```

**4. ✍️ Add New Agent Review** (Transactional)
*Executes atomicity check on inserting logic vs recalculating aggregate.*
```bash
curl -X POST "http://localhost:3000/api/v1/agents/<AGENT_ID>/reviews" \
-H 'Content-Type: application/json' \
-d '{"rating": 5, "comment": "Unbelievably quick, very trustworthy."}'
```

**5. 📜 Read Agent Reviews**
```bash
curl "http://localhost:3000/api/v1/agents/<AGENT_ID>/reviews?page=1&limit=5"
```