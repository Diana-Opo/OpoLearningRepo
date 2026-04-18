const prisma = require('../lib/prisma');

const VALID_STATUSES   = ['open', 'in_progress', 'resolved', 'closed', 'archived'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// ─── Helpers ─────────────────────────────────────────────

function ok(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, data: null, message });
}

// ─── GET /api/tickets ────────────────────────────────────

async function getAll(req, res) {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        agent: { select: { id: true, name: true, email: true, shift: true, status: true } },
      },
    });
    return ok(res, tickets);
  } catch (err) {
    console.error('[tickets:getAll]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// ─── POST /api/tickets ───────────────────────────────────

async function create(req, res) {
  const { subject, clientEmail, status, priority, assignedTo } = req.body;

  if (!subject)     return fail(res, 'Field subject is required');
  if (!clientEmail) return fail(res, 'Field clientEmail is required');
  if (!status)      return fail(res, 'Field status is required');
  if (!priority)    return fail(res, 'Field priority is required');

  if (!VALID_STATUSES.includes(status)) {
    return fail(res, `Field status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (!VALID_PRIORITIES.includes(priority)) {
    return fail(res, `Field priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  if (assignedTo !== undefined && assignedTo !== null) {
    const agent = await prisma.agent.findUnique({ where: { id: assignedTo } });
    if (!agent) return fail(res, 'Provided assignedTo agent does not exist', 404);
  }

  try {
    const ticket = await prisma.ticket.create({
      data: {
        subject,
        clientEmail,
        status,
        priority,
        assignedTo: assignedTo ?? null,
      },
      include: {
        agent: { select: { id: true, name: true, email: true, shift: true, status: true } },
      },
    });
    return ok(res, ticket, 'Ticket created successfully', 201);
  } catch (err) {
    console.error('[tickets:create]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// ─── PUT /api/tickets/:id ────────────────────────────────

async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return fail(res, 'Invalid ticket id');

  const { subject, clientEmail, status, priority, assignedTo } = req.body;

  if (status   && !VALID_STATUSES.includes(status)) {
    return fail(res, `Field status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return fail(res, `Field priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  if (assignedTo !== undefined && assignedTo !== null) {
    const agent = await prisma.agent.findUnique({ where: { id: assignedTo } });
    if (!agent) return fail(res, 'Provided assignedTo agent does not exist', 404);
  }

  const data = {};
  if (subject     !== undefined) data.subject     = subject;
  if (clientEmail !== undefined) data.clientEmail = clientEmail;
  if (status      !== undefined) data.status      = status;
  if (priority    !== undefined) data.priority    = priority;
  if (assignedTo  !== undefined) data.assignedTo  = assignedTo;

  if (Object.keys(data).length === 0) {
    return fail(res, 'No fields provided to update');
  }

  try {
    const ticket = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        agent: { select: { id: true, name: true, email: true, shift: true, status: true } },
      },
    });
    return ok(res, ticket, 'Ticket updated successfully');
  } catch (err) {
    if (err.code === 'P2025') return fail(res, 'Record not found', 404);
    console.error('[tickets:update]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// ─── DELETE /api/tickets/:id ─────────────────────────────

async function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return fail(res, 'Invalid ticket id');

  try {
    await prisma.ticket.delete({ where: { id } });
    return ok(res, null, 'Ticket deleted successfully');
  } catch (err) {
    if (err.code === 'P2025') return fail(res, 'Record not found', 404);
    console.error('[tickets:remove]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

module.exports = { getAll, create, update, remove };
