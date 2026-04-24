const prisma = require('../lib/prisma');

function ok(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, data, message });
}
function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, data: null, message });
}

async function requireAdmin(requesterEmail) {
  if (!requesterEmail) return false;
  const r = await prisma.user.findUnique({
    where:  { email: requesterEmail },
    select: { role: true },
  });
  return r?.role === 'admin';
}

// All permission fields that can be toggled
const PERM_FIELDS = [
  'viewDashboard','viewLivechats','viewTickets','viewIssues','viewAgents','viewReports',
  'ticketsCreate','ticketsEdit','ticketsDelete','ticketsExport',
  'issuesCreate','issuesEdit','issuesDelete','issuesExport',
  'agentsCreate','agentsEdit','agentsArchive','agentsExport',
  'reportsExport',
];

function extractPermFields(raw) {
  const out = {};
  for (const f of PERM_FIELDS) {
    if (f in raw) out[f] = Boolean(raw[f]);
  }
  return out;
}

// GET /api/access-groups
// Returns all groups; admin gets all, others get just their own effective group
async function getGroups(req, res) {
  try {
    const groups = await prisma.permissionGroup.findMany({
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
    });
    return ok(res, groups);
  } catch (err) {
    console.error('[access-groups:getGroups]', err);
    return fail(res, 'Database error', 500);
  }
}

// POST /api/access-groups
// Body: { requesterEmail, name, ...permissionFields }
async function createGroup(req, res) {
  const { requesterEmail, name, ...rest } = req.body;
  if (!requesterEmail)      return fail(res, 'requesterEmail is required');
  if (!name || !name.trim()) return fail(res, 'name is required');

  try {
    if (!await requireAdmin(requesterEmail)) return fail(res, 'Admin access required', 403);

    const group = await prisma.permissionGroup.create({
      data: {
        name: name.trim(),
        isSystem: false,
        isAdmin:  false,
        ...extractPermFields(rest),
      },
    });
    return ok(res, group, 'Group created', 201);
  } catch (err) {
    if (err.code === 'P2002') return fail(res, 'A group with this name already exists', 409);
    console.error('[access-groups:createGroup]', err);
    return fail(res, 'Database error', 500);
  }
}

// PUT /api/access-groups/:id
// Body: { requesterEmail, name (optional, only for custom groups), ...permissionFields }
async function updateGroup(req, res) {
  const { id } = req.params;
  const { requesterEmail, name, ...rest } = req.body;
  if (!requesterEmail) return fail(res, 'requesterEmail is required');

  try {
    if (!await requireAdmin(requesterEmail)) return fail(res, 'Admin access required', 403);

    const existing = await prisma.permissionGroup.findUnique({ where: { id } });
    if (!existing)       return fail(res, 'Group not found', 404);
    if (existing.isAdmin) return fail(res, 'The Admin group cannot be modified', 403);

    const data = { ...extractPermFields(rest) };
    // Only custom groups can have their name changed
    if (!existing.isSystem && name && name.trim()) {
      data.name = name.trim();
    }

    const group = await prisma.permissionGroup.update({ where: { id }, data });
    return ok(res, group, 'Group updated');
  } catch (err) {
    if (err.code === 'P2002') return fail(res, 'A group with this name already exists', 409);
    console.error('[access-groups:updateGroup]', err);
    return fail(res, 'Database error', 500);
  }
}

// DELETE /api/access-groups/:id
// Body: { requesterEmail }
async function deleteGroup(req, res) {
  const { id } = req.params;
  const { requesterEmail } = req.body;
  if (!requesterEmail) return fail(res, 'requesterEmail is required');

  try {
    if (!await requireAdmin(requesterEmail)) return fail(res, 'Admin access required', 403);

    const existing = await prisma.permissionGroup.findUnique({ where: { id } });
    if (!existing)         return fail(res, 'Group not found', 404);
    if (existing.isSystem) return fail(res, 'System groups cannot be deleted', 403);

    // Remove group assignment from affected users before deleting
    await prisma.user.updateMany({
      where: { permissionGroupId: id },
      data:  { permissionGroupId: null },
    });

    await prisma.permissionGroup.delete({ where: { id } });
    return ok(res, null, 'Group deleted');
  } catch (err) {
    console.error('[access-groups:deleteGroup]', err);
    return fail(res, 'Database error', 500);
  }
}

module.exports = { getGroups, createGroup, updateGroup, deleteGroup };
