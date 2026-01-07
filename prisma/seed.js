// prisma/seed.js

import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt"

const prisma = new PrismaClient();
// enum Roles {
// 	ADMIN = 'ADMIN',
// 	USER = 'USER',
// }
async function main() {
  // Crea i ruoli necessari
  const adminRole = await prisma.roles.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  await prisma.roles.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER' },
  });

  // Crea l'utente admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: await bcrypt.hash('letmein>', 10),
      userAuthToken: '01010101010101010101',
      roleId: adminRole.id,
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
