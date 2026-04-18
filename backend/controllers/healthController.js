const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getHealth(req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: err.message });
  }
}

module.exports = { getHealth };
