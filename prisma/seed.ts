import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Agents spread across Indian cities for realistic geospatial testing
const agents = [
  { name: "Alice Johnson",  latitude: 28.6139, longitude: 77.2090 }, // Delhi
  { name: "Bob Smith",      latitude: 28.6350, longitude: 77.2250 },
  { name: "Carol White",    latitude: 28.5921, longitude: 77.1680 },
  { name: "David Brown",    latitude: 28.6508, longitude: 77.2310 },
  { name: "Eva Martinez",   latitude: 28.6029, longitude: 77.1889 },
  { name: "Frank Lee",      latitude: 19.0760, longitude: 72.8777 }, // Mumbai
  { name: "Grace Chen",     latitude: 19.1136, longitude: 72.8697 },
  { name: "Henry Wilson",   latitude: 12.9716, longitude: 77.5946 }, // Bangalore
  { name: "Iris Patel",     latitude: 13.0007, longitude: 77.5965 },
  { name: "James Kumar",    latitude: 22.5726, longitude: 88.3639 }, // Kolkata
];

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.review.deleteMany();
  await prisma.agent.deleteMany();

  const created = await prisma.agent.createMany({
    data: agents.map((a) => ({ ...a, isActive: true })),
  });
  console.log(`✅ Created ${created.count} agents`);

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
