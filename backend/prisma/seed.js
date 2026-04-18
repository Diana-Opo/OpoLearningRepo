const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: 'diana@opofinance.com' },
    select: { id: true, role: true },
  });

  if (!existing) {
    const hash = await bcrypt.hash('Admin@1234', 12);
    await prisma.user.create({
      data: {
        name: 'Diana',
        email: 'diana@opofinance.com',
        passwordHash: hash,
        role: 'admin',
      },
    });
    console.log('Created admin user: diana@opofinance.com  (password: Admin@1234)');
  } else if (existing.role !== 'admin') {
    await prisma.user.update({
      where: { email: 'diana@opofinance.com' },
      data:  { role: 'admin' },
    });
    console.log('Updated diana@opofinance.com to admin role');
  } else {
    console.log('Admin user diana@opofinance.com already exists — nothing to do');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
