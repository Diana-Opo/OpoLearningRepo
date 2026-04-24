const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma  = require('../lib/prisma');
const { sendResetEmail } = require('../lib/mailer');

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

    return ok(res, {
      id: user.id, name: user.name, role: user.role, status: user.status,
      avatarData: user.avatarData ?? null,
      permissionGroupId: user.permissionGroupId ?? null,
    }, 'Login successful');
  } catch (err) {
    console.error('[auth:login]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return fail(res, 'Field email is required');

  // Always respond with the same message to prevent email enumeration
  const SUCCESS_MSG = 'If an account exists for that email, a reset link has been sent.';

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return ok(res, null, SUCCESS_MSG);

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data:  { used: true },
    });

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const base      = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${base}/reset-password?token=${token}`;

    await sendResetEmail(user.email, user.name, resetLink);

    return ok(res, null, SUCCESS_MSG);
  } catch (err) {
    console.error('[auth:forgotPassword]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// GET /api/auth/verify-reset-token/:token
async function verifyResetToken(req, res) {
  const { token } = req.params;
  try {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expiresAt < new Date()) {
      return fail(res, 'This reset link is invalid or has expired.', 400);
    }
    return ok(res, null, 'Token is valid');
  } catch (err) {
    return fail(res, 'Database error', 500);
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token)    return fail(res, 'Token is required');
  if (!password) return fail(res, 'Password is required');
  if (password.length < 6) return fail(res, 'Password must be at least 6 characters');

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where:   { token },
      include: { user: true },
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      return fail(res, 'This reset link is invalid or has expired.', 400);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data:  { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data:  { used: true },
      }),
    ]);

    return ok(res, null, 'Password has been reset successfully. You can now log in.');
  } catch (err) {
    console.error('[auth:resetPassword]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

module.exports = { register, login, forgotPassword, verifyResetToken, resetPassword };
