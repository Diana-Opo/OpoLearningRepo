const bcrypt = require('bcrypt');
const prisma  = require('../lib/prisma');

const SALT_ROUNDS  = 12;
const VALID_ROLES  = ['agent', 'manager', 'admin'];

function ok(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, data: null, message });
}

// POST /api/auth/register
async function register(req, res) {
  const { name, email, password, role } = req.body;

  if (!name)     return fail(res, 'Field name is required');
  if (!email)    return fail(res, 'Field email is required');
  if (!password) return fail(res, 'Field password is required');

  const assignedRole = role || 'agent';
  if (!VALID_ROLES.includes(assignedRole)) {
    return fail(res, `Field role must be one of: ${VALID_ROLES.join(', ')}`);
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return fail(res, 'An account with this email already exists', 409);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: assignedRole },
      select: { id: true, name: true, role: true, status: true, avatarData: true },
    });

    return ok(res, user, 'Account created successfully', 201);
  } catch (err) {
    console.error('[auth:register]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  if (!email)    return fail(res, 'Field email is required');
  if (!password) return fail(res, 'Field password is required');

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return fail(res, 'No account found with this email', 404);

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return fail(res, 'Incorrect password', 401);

    return ok(res, { id: user.id, name: user.name, role: user.role, status: user.status, avatarData: user.avatarData ?? null }, 'Login successful');
  } catch (err) {
    console.error('[auth:login]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

module.exports = { register, login };
