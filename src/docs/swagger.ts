export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Agent Locator API",
    version: "1.0.0",
    description: "Backend system for locating nearby local agents using geospatial capabilities.",
  },
  servers: [
    {
      url: "http://localhost:3000/api/v1",
      description: "Local Development Server",
    },
  ],
  paths: {
    "/agents/search": {
      get: {
        summary: "Search nearby agents",
        description: "Fetch dynamic paginated active agents within a designated radius using PostGIS ST_DWithin.",
        tags: ["Agents"],
        parameters: [
          { name: "lat", in: "query", required: true, schema: { type: "number", example: 28.6139 } },
          { name: "lng", in: "query", required: true, schema: { type: "number", example: 77.209 } },
          { name: "radius", in: "query", required: true, schema: { type: "number", example: 10 } },
          { name: "page", in: "query", required: false, schema: { type: "number", default: 1 } },
          { name: "limit", in: "query", required: false, schema: { type: "number", default: 20 } },
        ],
        responses: {
          "200": {
            description: "A paginated list of nearby agents.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              latitude: { type: "number" },
                              longitude: { type: "number" },
                              isActive: { type: "boolean" },
                              avgRating: { type: "number" },
                              totalReviews: { type: "number" },
                              distanceKm: { type: "number" },
                            },
                          },
                        },
                        meta: {
                          type: "object",
                          properties: {
                            page: { type: "number" },
                            limit: { type: "number" },
                            total: { type: "number" },
                            totalPages: { type: "number" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/agents/{id}": {
      get: {
        summary: "Get agent details",
        description: "Fetch exact details for a specific active agent.",
        tags: ["Agents"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Agent found" },
          "404": { description: "Agent not found" },
        },
      },
    },
    "/agents/{id}/reviews": {
      get: {
        summary: "Get agent reviews",
        description: "Fetch paginated reviews for a specific active agent.",
        tags: ["Reviews"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", required: false, schema: { type: "number", default: 1 } },
          { name: "limit", in: "query", required: false, schema: { type: "number", default: 10 } },
        ],
        responses: { "200": { description: "Paginated list of reviews" } },
      },
      post: {
        summary: "Add a new review",
        description: "Atomically adds a core review and updates the agent profile.",
        tags: ["Reviews"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating", "comment"],
                properties: {
                  rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
                  comment: { type: "string", minLength: 1, maxLength: 1000, example: "Excellent agent, great follow up." },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Review saved successfully" } },
      },
    },
  },
};
