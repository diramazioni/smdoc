// prisma/seed.js

import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt"

const prisma = new PrismaClient();
// enum Roles {
// 	ADMIN = 'ADMIN',
// 	USER = 'USER',
// }
async function main() {

  await prisma.user.create({
    data: {
        username: 'admin',
        passwordHash: await bcrypt.hash('demo', 10),
        userAuthToken: crypto.randomUUID(),
        role: { connect: { name: 'ADMIN' } },
    },
  })
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
