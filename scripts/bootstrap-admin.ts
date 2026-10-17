/**
 * Creates (or resets) the private administrator account.
 *
 *   npm run db:seed                 create the account if missing
 *   npm run db:seed -- --reset      force the temporary password again
 *
 * Credentials come from the environment (ADMIN_USERNAME /
 * ADMIN_BOOTSTRAP_PASSWORD) and are never hard-coded in the source.
 * The first login forces a password change.
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

try {
  process.loadEnvFile(".env");
} catch {
  // .env is optional when variables are provided by the environment.
}

const prisma = new PrismaClient();

const USERNAME = process.env.ADMIN_USERNAME ?? "lemzo";
const PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const RESET = process.argv.includes("--reset");

async function main() {
  if (!PASSWORD || PASSWORD.length < 4) {
    console.error(
      "ADMIN_BOOTSTRAP_PASSWORD is missing or too short. Set it in .env before seeding.",
    );
    process.exit(1);
  }

  const passwordHash = await hash(PASSWORD, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const existing = await prisma.adminUser.findUnique({ where: { username: USERNAME } });

  if (existing && !RESET) {
    console.log(`Admin "${USERNAME}" already exists — nothing to do.`);
    console.log("Use `npm run db:seed -- --reset` to reset the temporary password.");
    return;
  }

  await prisma.adminUser.upsert({
    where: { username: USERNAME },
    create: { username: USERNAME, passwordHash, mustChangePassword: true },
    update: { passwordHash, mustChangePassword: true },
  });

  await prisma.session.deleteMany({ where: { user: { username: USERNAME } } });

  console.log(`✔ Admin "${USERNAME}" ready.`);
  console.log("  Temporary password loaded from ADMIN_BOOTSTRAP_PASSWORD.");
  console.log("  You will be asked to change it on first login.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
