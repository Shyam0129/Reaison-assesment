import { prisma } from "../config/prisma";
import { cache } from "../config/redis";
import { env } from "../config/env";
import { NotFoundError } from "../utils/errors";
import { PaginatedResponse } from "../types/api.types";
import { SearchAgentsQuery } from "../validators/agent.validators";
import type { Agent } from "../types/models.types";

// Shape of a row returned from the raw PostGIS query (snake_case from DB)
interface NearbyAgentRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  avg_rating: number;
  total_reviews: number;
  created_at: Date;
  distance_km: number;
}

export interface AgentWithDistance extends Agent {
  distanceKm: number;
}

export class AgentService {
  // Deterministic cache key — same params always map to the same Redis entry
  private buildCacheKey(q: SearchAgentsQuery): string {
    return `agents:${q.lat}:${q.lng}:${q.radius}:${q.page}:${q.limit}`;
  }

  /**
   * Finds active agents within a radius using PostGIS ST_DWithin.
   * Results are cached in Redis for 5 minutes.
   */
  async searchNearby(query: SearchAgentsQuery): Promise<PaginatedResponse<AgentWithDistance>> {
    const cacheKey = this.buildCacheKey(query);

    const cached = await cache.get<PaginatedResponse<AgentWithDistance>>(cacheKey);
    if (cached) return cached;

    const { lat, lng, radius, page, limit } = query;
    const offset = (page - 1) * limit;
    const radiusMeters = radius * 1000;

    // Raw SQL required — Prisma cannot express ST_DWithin with geography type natively
    const rows = await prisma.$queryRaw<NearbyAgentRow[]>`
      SELECT
        id,
        name,
        latitude,
        longitude,
        is_active,
        avg_rating,
        total_reviews,
        created_at,
        ROUND(
          (ST_Distance(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) / 1000.0)::numeric,
          2
        )::float AS distance_km
      FROM agents
      WHERE
        is_active = true
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance_km ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) AS count
      FROM agents
      WHERE
        is_active = true
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
    `;

    const total = Number(countResult[0].count);

    const items: AgentWithDistance[] = rows.map((row: NearbyAgentRow) => ({
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      isActive: row.is_active,
      avgRating: row.avg_rating,
      totalReviews: row.total_reviews,
      createdAt: row.created_at,
      distanceKm: row.distance_km,
    }));

    const result: PaginatedResponse<AgentWithDistance> = {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    await cache.set(cacheKey, result, env.cache.searchTtlSeconds);
    return result;
  }

  /**
   * Fetches a single active agent by ID.
   * Throws NotFoundError if missing or inactive.
   */
  async getById(id: string): Promise<Agent> {
    const agent = await prisma.agent.findUnique({ where: { id } });

    if (!agent || !agent.isActive) {
      throw new NotFoundError(`Agent with ID ${id} not found`);
    }

    return agent as Agent;
  }
}

export const agentService = new AgentService();
