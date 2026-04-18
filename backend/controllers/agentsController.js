const prisma = require('../lib/prisma');

const VALID_SHIFTS          = ['day', 'night'];
const VALID_STATUSES        = ['online', 'busy', 'away', 'offline'];
const VALID_STATUSES_UPDATE = ['online', 'busy', 'away', 'offline', 'archived'];

// ─── Helpers ─────────────────────────────────────────────

function ok(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, data: null, message });
}

// ─── GET /api/agents ─────────────────────────────────────
// Returns only non-archived agents

async function getAll(req, res) {
  try {
    const agents = await prisma.agent.findMany({
      where:   { status: { not: 'archived' } },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, agents);
  } catch (err) {
    console.error('[agents:getAll]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// ─── GET /api/agents/archived ────────────────────────────

async function getArchived(req, res) {
  try {
    const agents = await prisma.agent.findMany({
      where:   { status: 'archived' },
      orderBy: { modifiedAt: 'desc' },
    });
    return ok(res, agents);
  } catch (err) {
    console.error('[agents:getArchived]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// ─── POST /api/agents ────────────────────────────────────

async function create(req, res) {
  const { name, email, shift, status } = req.body;

  if (!name)   return fail(res, 'Field name is required');
  if (!email)  return fail(res, 'Field email is required');
  if (!shift)  return fail(res, 'Field shift is required');
  if (!status) return fail(res, 'Field status is required');

  if (!VALID_SHIFTS.includes(shift)) {
    return fail(res, `Field shift must be one of: ${VALID_SHIFTS.join(', ')}`);
  }
  if (!VALID_STATUSES.includes(status)) {
    return fail(res, `Field status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  try {
    const agent = await prisma.agent.create({
      data: { name, email, shift, status },
    });
    return ok(res, agent, 'Agent created successfully', 201);
  } catch (err) {
    if (err.code === 'P2002') {
      return fail(res, 'An agent with this email already exists', 409);
    }
    console.error('[agents:create]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// ─── PUT /api/agents/:id ─────────────────────────────────

async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return fail(res, 'Invalid agent id');

  const { name, email, shift, status } = req.body;

  if (shift  && !VALID_SHIFTS.includes(shift)) {
    return fail(res, `Field shift must be one of: ${VALID_SHIFTS.join(', ')}`);
  }
  if (status && !VALID_STATUSES_UPDATE.includes(status)) {
    return fail(res, `Field status must be one of: ${VALID_STATUSES_UPDATE.join(', ')}`);
  }

  const data = {};
  if (name   !== undefined) data.name   = name;
  if (email  !== undefined) data.email  = email;
  if (shift  !== undefined) data.shift  = shift;
  if (status !== undefined) data.status = status;

  if (Object.keys(data).length === 0) {
    return fail(res, 'No fields provided to update');
  }

  try {
    const agent = await prisma.agent.update({
      where: { id },
      data,
    });
    return ok(res, agent, 'Agent updated successfully');
  } catch (err) {
    if (err.code === 'P2025') return fail(res, 'Record not found', 404);
    if (err.code === 'P2002') return fail(res, 'An agent with this email already exists', 409);
    console.error('[agents:update]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// ─── DELETE /api/agents/:id ──────────────────────────────

async function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return fail(res, 'Invalid agent id');

  try {
    await prisma.agent.delete({ where: { id } });
    return ok(res, null, 'Agent deleted successfully');
  } catch (err) {
    if (err.code === 'P2025') return fail(res, 'Record not found', 404);
    console.error('[agents:remove]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

module.exports = { getAll, getArchived, create, update, remove };
