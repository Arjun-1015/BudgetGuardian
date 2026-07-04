// Usage: node scripts/make-admin.js you@example.com
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/make-admin.js you@example.com");
    process.exit(1);
  }

  const user = await db.user.update({
    where: { email },
    data: { isAdmin: true },
  });

  console.log(`${user.email} is now an admin.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
