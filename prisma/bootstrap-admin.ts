/**
 * One-time first-admin provisioning (BACKEND_ARCHITECTURE.md §6). Invite-only
 * staff account creation has no answer for the very first `admin` account —
 * this script is that answer. It is NOT part of `prisma/seed.ts` (that
 * script is dev/preview mock-data seeding, INFRASTRUCTURE_ARCHITECTURE.md
 * §3; this is a real, any-environment, one-time provisioning step, a
 * different concern) and is idempotent: it no-ops the moment any `ADMIN`
 * user already exists in the target database, so it's safe to run again by
 * mistake and safe to leave in a deploy script rather than requiring
 * someone to remember to remove it. Run with `npm run bootstrap:admin`.
 */
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Must match server/auth/staff.ts's ARGON2_OPTIONS — kept as a separate
// constant rather than a shared import because that module has a
// server-only guard incompatible with running as a plain script.
const ARGON2_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "bootstrap-admin: BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must both be set. Aborting — nothing created."
    );
    process.exit(1);
  }

  const existingAdminCount = await prisma.user.count({
    where: { role: "ADMIN" },
  });
  if (existingAdminCount > 0) {
    console.log(
      `bootstrap-admin: ${existingAdminCount} admin user(s) already exist — no-op.`
    );
    return;
  }

  const passwordHash = await hash(password, ARGON2_OPTIONS);
  const admin = await prisma.user.create({
    data: {
      email,
      role: "ADMIN",
      passwordHash,
      // Forces a real password change on first login — the bootstrap
      // password is a temporary provisioning credential, not a permanent
      // one. Enforcing this flag is a later PR's job (see docs/DECISIONS.md's
      // "Sprint 5 PR3" entry); this script only records the intent.
      mustChangePassword: true,
    },
  });

  console.log(`bootstrap-admin: created admin user ${admin.email} (${admin.id}).`);
}

main()
  .catch((err) => {
    console.error("bootstrap-admin: failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
