const prisma = require('../lib/prisma');

function ok(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, data: null, message });
}

// ─── Helper: verify caller is admin ──────────────────────
async function requireAdmin(requesterEmail) {
  if (!requesterEmail) return false;
  const r = await prisma.user.findUnique({
    where:  { email: requesterEmail },
    select: { role: true },
  });
  return r?.role === 'admin';
}

// PATCH /api/users/avatar
// Body: { email, avatarData }
async function updateAvatar(req, res) {
  const { email, avatarData } = req.body;
  if (!email) return fail(res, 'Field email is required');

  try {
    const user = await prisma.user.update({
      where:  { email },
      data:   { avatarData: avatarData ?? null },
      select: { id: true, avatarData: true },
    });
    return ok(res, user, 'Avatar updated');
  } catch (err) {
    if (err.code === 'P2025') return fail(res, 'User not found', 404);
    console.error('[users:updateAvatar]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// PATCH /api/users/role
// Body: { email, role, requesterEmail }  — admin only
const VALID_ROLES = ['agent', 'manager', 'admin'];

async function updateRole(req, res) {
  const { email, role, requesterEmail } = req.body;
  if (!email)          return fail(res, 'Field email is required');
  if (!requesterEmail) return fail(res, 'Field requesterEmail is required');
  if (!role || !VALID_ROLES.includes(role))
    return fail(res, `Field role must be one of: ${VALID_ROLES.join(', ')}`);

  try {
    if (!await requireAdmin(requesterEmail))
      return fail(res, 'Only admins can change user roles', 403);

    const user = await prisma.user.update({
      where:  { email },
      data:   { role },
      select: { id: true, role: true },
    });
    return ok(res, user, 'Role updated');
  } catch (err) {
    if (err.code === 'P2025') return fail(res, 'User not found', 404);
    console.error('[users:updateRole]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// GET /api/users/staff  — all approved users (no admin restriction; used for dropdowns)
async function getStaffUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      where:   { status: 'approved' },
      select:  { id: true, name: true, role: true, permissionGroupId: true },
      orderBy: { name: 'asc' },
    });
    return ok(res, users, 'Staff users retrieved');
  } catch (err) {
    console.error('[users:getStaffUsers]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// GET /api/users/all?requesterEmail=...  — admin only
async function getAllUsers(req, res) {
  const { requesterEmail } = req.query;
  if (!requesterEmail) return fail(res, 'Query param requesterEmail is required');

  try {
    if (!await requireAdmin(requesterEmail))
      return fail(res, 'Only admins can view the user list', 403);

    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, status: true, createdAt: true,
        permissionGroupId: true,
        permissionGroup: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, users, 'Users retrieved');
  } catch (err) {
    console.error('[users:getAllUsers]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// PATCH /api/users/edit
// Body: { id, name, email, permissionGroupId, status, requesterEmail }  — admin only
// role is derived automatically from the assigned group; it is not accepted as input
const VALID_STATUSES = ['approved', 'pending', 'rejected'];

async function editUser(req, res) {
  const { id, name, email, status, requesterEmail, permissionGroupId } = req.body;
  if (!id)             return fail(res, 'Field id is required');
  if (!requesterEmail) return fail(res, 'Field requesterEmail is required');

  try {
    if (!await requireAdmin(requesterEmail))
      return fail(res, 'Only admins can edit users', 403);

    const data = {};
    if (name)   data.name  = name.trim();
    if (email)  data.email = email.trim();
    if (status && VALID_STATUSES.includes(status)) data.status = status;

    // Group assignment: derive role automatically from the group
    if ('permissionGroupId' in req.body) {
      const pgId = permissionGroupId || null;
      data.permissionGroupId = pgId;

      if (pgId) {
        const grp = await prisma.permissionGroup.findUnique({
          where:  { id: pgId },
          select: { isAdmin: true, isSystem: true, name: true },
        });
        if (!grp) return fail(res, 'Permission group not found', 404);
        // Derive internal role from group type
        if (grp.isAdmin)                         data.role = 'admin';
        else if (grp.isSystem && grp.name === 'Manager') data.role = 'manager';
        else                                     data.role = 'agent';
      }
      // Clearing the group (pgId = null) leaves the existing role unchanged
    }

    const user = await prisma.user.update({
      where:  { id: Number(id) },
      data,
      select: {
        id: true, name: true, email: true, role: true, status: true,
        permissionGroupId: true,
        permissionGroup: { select: { id: true, name: true } },
      },
    });
    return ok(res, user, 'User updated');
  } catch (err) {
    if (err.code === 'P2025') return fail(res, 'User not found', 404);
    if (err.code === 'P2002') return fail(res, 'Email already in use by another account', 409);
    console.error('[users:editUser]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

module.exports = { updateAvatar, updateRole, getAllUsers, editUser, getStaffUsers };
