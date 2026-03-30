import fs from "fs";
import path from "path";
import stream from "stream";
import { promisify } from "util";
import csvParser from "csv-parser";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CSV_PATH = path.join(__dirname, "agents_dataset.csv");

// Zod Schema for extremely robust coordinate validation during CSV import
const AgentCsvRowSchema = z.object({
  name: z.string().min(1),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  isActive: z.enum(["true", "false"]).transform((val) => val === "true"),
});

type ValidatedAgent = z.infer<typeof AgentCsvRowSchema>;

/**
 * Helper: Only generates the dataset if it doesn't physically exist yet.
 * In a real production environment, this CSV would be provided by a data team.
 */
function ensureDatasetExists(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(CSV_PATH)) {
      resolve();
      return;
    }

    console.log("📝 Generating massive dummy CSV dataset...");
    const stream = fs.createWriteStream(CSV_PATH);
    stream.write("name,latitude,longitude,isActive\n");

    // Specific Guaranteed Valid Nodes
    stream.write("Alice Johnson (Delhi),28.6139,77.2090,true\n");
    stream.write("Bob Smith (Delhi),28.6350,77.2250,true\n");
    stream.write("Frank Lee (Mumbai),19.0760,72.8777,true\n");

    // Purposely inject INVALID coordinate rows to prove our strictly-typed validation works!
    stream.write("Mr. Invalid Geo,120.555,200.555,true\n"); // Out of bounds Math
    stream.write("Missing GPS,NaN,NaN,true\n"); // Corrupted Math

    // Generate remainder up to ~5000 valid agents mathematically
    for (let i = 0; i < 4995; i++) {
      const lat = 8.0 + Math.random() * (37.0 - 8.0);
      const lng = 68.0 + Math.random() * (97.0 - 68.0);
      stream.write(`Agent ${i},${lat},${lng},true\n`);
    }

    stream.end(() => {
      console.log("📝 CSV Dataset compiled locally.");
      resolve();
    });
    stream.on("error", reject);
  });
}

async function main() {
  console.log("🌱 Starting Agent Import Pipeline...");

  // 1. Prepare raw dataset file
  await ensureDatasetExists();

  // 2. Clear previous entries
  await prisma.review.deleteMany();
  await prisma.agent.deleteMany();

  // 3. Import + Validate Pipeline
  const validAgents: ValidatedAgent[] = [];
  let totalRowsChecked = 0;
  let invalidRowsCount = 0;

  console.log("🚀 Streaming and Validating CSV dataset...");
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csvParser())
      .on("data", (row) => {
        totalRowsChecked++;
        const parsed = AgentCsvRowSchema.safeParse(row);

        if (parsed.success) {
          validAgents.push(parsed.data);
        } else {
          invalidRowsCount++;
          if (invalidRowsCount <= 3) {
             // Only log the first few errors to avoid spamming the console
            console.warn(`⚠️ Skipped invalid row: ${row.name} - Reason: ${parsed.error.issues[0].message}`);
          }
        }
      })
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`📊 Validation Complete! Checked: ${totalRowsChecked} | Valid: ${validAgents.length} | Rejected: ${invalidRowsCount}`);

  // 4. Batch Insertion into Database
  let totalCreated = 0;
  for (let i = 0; i < validAgents.length; i += 1000) {
    const batch = validAgents.slice(i, i + 1000);
    const created = await prisma.agent.createMany({ data: batch });
    totalCreated += created.count;
  }
  
  console.log(`✅ Safely imported ${totalCreated} valid agents into Postgres!`);

  // 5. Seed dependent models for testing endpoints mathematically
  const dbAgents = await prisma.agent.findMany({ take: 5 });
  for (const agent of dbAgents) {
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

  console.log("✅ Verified transactional review seeds generated for 5 agents.");
  console.log("🎉 Complete!");
}

main()
  .catch((e: unknown) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
