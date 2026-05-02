import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function main() {
  const seedPath = path.join(__dirname, "../src/fixtures/seed-data.json");
  const data = JSON.parse(await fs.readFile(seedPath, "utf-8"));

  console.log("Seeding companies...");
  for (const company of data.companies) {
    await prisma.company.upsert({
      where: { id: company.id },
      update: {},
      create: {
        id: company.id,
        name: company.name,
        slug: company.slug
      }
    });
  }

  console.log("Seeding users...");
  for (const user of data.users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.email === "admin@fbr.local" ? "admin123" : "user123",
        role: user.role
      }
    });
  }

  console.log("Seeding agents...");
  for (const agent of data.agents) {
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: {},
      create: {
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        provider: agent.provider,
        provider_agent_id: agent.provider_agent_id,
        company_id: agent.company_id,
        tts_enabled: agent.tts_enabled ?? false,
        openclaw_config: {
          model: "claude-3-5-sonnet",
          system_prompt: `Você é ${agent.name}.`,
          temperature: 0.3,
          max_tokens: 1000,
          api_key_ref: `OPENCLAW_${agent.slug.toUpperCase()}_KEY`
        }
      }
    });
  }

  console.log("Seeding groups...");
  for (const group of data.groups) {
    await prisma.group.upsert({
      where: { id: group.id },
      update: {},
      create: {
        id: group.id,
        name: group.name,
        topic: group.topic,
        created_by: data.users[0].id
      }
    });

    // Add initial members
    await prisma.groupMember.upsert({
      where: {
        group_id_member_type_member_id: {
          group_id: group.id,
          member_type: "user",
          member_id: data.users[0].id
        }
      },
      update: {},
      create: {
        group_id: group.id,
        member_type: "user",
        member_id: data.users[0].id
      }
    });
  }

  console.log("Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
