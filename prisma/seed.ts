import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Generate 5000 Agents spread across India for realistic geospatial testing
// India bounds approx: Lat 8.0 to 37.0, Lng 68.0 to 97.0
const agents: any[] = [];
for (let i = 0; i < 5000; i++) {
  const lat = 8.0 + Math.random() * (37.0 - 8.0);
  const lng = 68.0 + Math.random() * (97.0 - 68.0);

  // Explicit coordinate validation as per requirement
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error(`Invalid coordinates generated: ${lat}, ${lng}`);
  }

  agents.push({
    name: `Agent ${i + 1}`,
    latitude: lat,
    longitude: lng,
    isActive: true, // 90% active rate
  });
}

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.review.deleteMany();
  await prisma.agent.deleteMany();

  // Insert in batches of 1000 to prevent overwhelming the connection
  let totalCreated = 0;
  for (let i = 0; i < agents.length; i += 1000) {
    const batch = agents.slice(i, i + 1000);
    const created = await prisma.agent.createMany({ data: batch });
    totalCreated += created.count;
  }
  console.log(`✅ Created ${totalCreated} agents`);

  const allAgents = await prisma.agent.findMany();

  for (const agent of allAgents.slice(0, 5)) {
    await prisma.review.createMany({
      data: [
        { agentId: agent.id, rating: 5, comment: "Excellent service!" },
        { agentId: agent.id, rating: 4, comment: "Very helpful and responsive." },
        { agentId: agent.id, rating: 3, comment: "Average experience overall." },
      ],
    });

    await prisma.agent.update({
      where: { id: agent.id },
      data: { avgRating: 4.0, totalReviews: 3 },
    });
  }

  console.log("✅ Reviews seeded for 5 agents");
  console.log("🎉 Done!");
}

main()
  .catch((e: unknown) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
