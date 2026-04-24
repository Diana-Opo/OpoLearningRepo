const nodemailer = require('nodemailer');

/**
 * Send a password-reset email.
 * If SMTP credentials are not configured, the reset link is printed to the
 * console instead so development works out of the box.
 */
async function sendResetEmail(toEmail, toName, resetLink) {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

  // No SMTP configured — fall back to console output
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log('\n─────────────────────────────────────────────');
    console.log('  PASSWORD RESET LINK (email not configured)');
    console.log('─────────────────────────────────────────────');
    console.log(`  To    : ${toEmail}`);
    console.log(`  Link  : ${resetLink}`);
    console.log('─────────────────────────────────────────────\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST || 'smtp.gmail.com',
    port: Number(EMAIL_PORT) || 587,
    secure: Number(EMAIL_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  await transporter.sendMail({
    from: EMAIL_FROM || `"OpoSupportDesk" <${EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset your OpoSupportDesk password',
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:32px 24px;border-radius:12px">
        <h2 style="margin:0 0 8px;color:#1a1c22;font-size:22px">Password Reset Request</h2>
        <p style="color:#44474e;margin:0 0 20px">Hi ${toName},</p>
        <p style="color:#44474e;margin:0 0 24px">
          We received a request to reset your password for OpoSupportDesk.
          Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
        </p>
        <a href="${resetLink}" style="display:inline-block;background:#1a56db;color:#fff;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:600;font-size:15px">
          Reset Password
        </a>
        <p style="color:#74777f;margin:24px 0 0;font-size:13px">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
        <p style="color:#94a3b8;font-size:12px;margin:0">OpoSupportDesk · Support Portal</p>
      </div>
    `,
  });
}

module.exports = { sendResetEmail };
