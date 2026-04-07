import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log('Creating roles...');
  await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } });
  await prisma.role.upsert({ where: { name: 'USER' }, update: {}, create: { name: 'USER' } });

  console.log('Creating admin user (upsert)...');
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: await bcrypt.hash('demo', 10),
      userAuthToken: '01010101010101010101',
      role: { connect: { name: 'ADMIN' } }
    }
  });

  console.log('Database initialized');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
