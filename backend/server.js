require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/users',  require('./routes/users'));
app.use('/api/agents',          require('./routes/agents'));
app.use('/api/platform_issues', require('./routes/platformIssues'));
app.use('/api/tickets',         require('./routes/tickets'));
app.use('/api/access-groups',   require('./routes/accessGroups'));

// ── Reset-password page ───────────────────────────────────
// Served at http://localhost:3000/reset-password?token=XXX
app.get('/reset-password', (req, res) => {
  const token = req.query.token || '';
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password — OpoSupportDesk</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Inter, system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1a2e50 55%, #1a56db 100%);
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff; border-radius: 20px; padding: 40px 36px;
      width: 100%; max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,.35);
    }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
    .logo-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: #1a56db; display: flex; align-items: center; justify-content: center;
    }
    .logo-icon svg { width: 20px; height: 20px; color: #fff; }
    .logo-name { font-size: 17px; font-weight: 800; color: #1a1c22; letter-spacing: -.3px; }
    h1 { font-size: 22px; font-weight: 700; color: #1a1c22; margin-bottom: 6px; }
    .sub { font-size: 14px; color: #74777f; margin-bottom: 24px; line-height: 1.5; }
    label { display: block; font-size: 13px; font-weight: 600; color: #44474e; margin-bottom: 6px; }
    .input-wrap { position: relative; margin-bottom: 14px; }
    input[type=password], input[type=text] {
      width: 100%; padding: 11px 44px 11px 14px;
      border: 1.5px solid #c4c6d0; border-radius: 10px;
      font-size: 14px; color: #1a1c22; outline: none;
      transition: border-color .15s;
      font-family: inherit;
    }
    input:focus { border-color: #1a56db; }
    .toggle-btn {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #74777f; padding: 4px;
    }
    .btn {
      width: 100%; padding: 12px; background: #1a56db; color: #fff;
      border: none; border-radius: 100px; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: background .15s; margin-top: 8px;
      font-family: inherit;
    }
    .btn:hover { background: #0d3abf; }
    .btn:disabled { background: #94a3b8; cursor: not-allowed; }
    .msg {
      margin-top: 16px; padding: 12px 14px; border-radius: 10px;
      font-size: 13.5px; font-weight: 500; display: none;
    }
    .msg.error   { background: #fee2e2; color: #991b1b; }
    .msg.success { background: #d1fae5; color: #065f46; }
    .back { display: block; text-align: center; margin-top: 20px; font-size: 13px; color: #1a56db; text-decoration: none; font-weight: 600; }
    .back:hover { text-decoration: underline; }
    .requirements { font-size: 12px; color: #74777f; margin-bottom: 16px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <span class="logo-name">OpoSupportDesk</span>
    </div>

    <div id="invalid-state" style="display:none">
      <h1>Link Expired</h1>
      <p class="sub">This password reset link is invalid or has already been used. Please request a new one.</p>
      <div class="msg error" id="invalid-msg" style="display:block">Reset link is invalid or expired.</div>
    </div>

    <div id="form-state">
      <h1>Set New Password</h1>
      <p class="sub">Choose a strong password for your OpoSupportDesk account.</p>
      <p class="requirements">At least 6 characters including a letter, a number, and a special character.</p>
      <form id="reset-form" onsubmit="handleReset(event)">
        <input type="hidden" id="token-input" value="${token}">
        <div>
          <label for="new-password">New Password</label>
          <div class="input-wrap">
            <input type="password" id="new-password" placeholder="Enter new password" autocomplete="new-password" required>
            <button type="button" class="toggle-btn" onclick="togglePw('new-password',this)" tabindex="-1">
              <svg id="eye1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg id="eye1s" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
        </div>
        <div>
          <label for="confirm-password">Confirm Password</label>
          <div class="input-wrap">
            <input type="password" id="confirm-password" placeholder="Confirm new password" autocomplete="new-password" required>
            <button type="button" class="toggle-btn" onclick="togglePw('confirm-password',this)" tabindex="-1">
              <svg id="eye2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg id="eye2s" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
        </div>
        <button class="btn" type="submit" id="submit-btn">Reset Password</button>
        <div class="msg error"   id="err-msg"></div>
        <div class="msg success" id="ok-msg"></div>
      </form>
    </div>

    <div id="success-state" style="display:none">
      <h1>Password Updated!</h1>
      <p class="sub">Your password has been reset successfully. You can now log in to OpoSupportDesk with your new password.</p>
      <div class="msg success" style="display:block">Password changed successfully.</div>
    </div>
  </div>

  <script>
    const API = 'http://localhost:${PORT}';

    // Verify the token on load
    window.addEventListener('DOMContentLoaded', async () => {
      const token = document.getElementById('token-input').value;
      if (!token) { showInvalid(); return; }
      try {
        const r = await fetch(API + '/api/auth/verify-reset-token/' + token);
        const j = await r.json();
        if (!j.success) showInvalid();
      } catch { showInvalid(); }
    });

    function showInvalid() {
      document.getElementById('form-state').style.display    = 'none';
      document.getElementById('invalid-state').style.display = 'block';
    }

    function togglePw(id, btn) {
      const inp = document.getElementById(id);
      const isText = inp.type === 'text';
      inp.type = isText ? 'password' : 'text';
      btn.querySelectorAll('svg').forEach(s => s.style.display = s.style.display === 'none' ? '' : 'none');
    }

    function passwordValid(p) {
      return p.length >= 6 &&
        /[a-zA-Z]/.test(p) &&
        /[0-9]/.test(p) &&
        /[@#$!%^&*()_+\\-=\\[\\]{};':"\\\\|,.<>/?\`~]/.test(p);
    }

    async function handleReset(e) {
      e.preventDefault();
      const token    = document.getElementById('token-input').value;
      const password = document.getElementById('new-password').value;
      const confirm  = document.getElementById('confirm-password').value;
      const errEl    = document.getElementById('err-msg');
      const okEl     = document.getElementById('ok-msg');
      const btn      = document.getElementById('submit-btn');

      errEl.style.display = 'none';
      okEl.style.display  = 'none';

      if (!passwordValid(password)) {
        errEl.textContent = 'Password must be at least 6 characters and include a letter, number, and special character.';
        errEl.style.display = 'block'; return;
      }
      if (password !== confirm) {
        errEl.textContent = 'Passwords do not match.';
        errEl.style.display = 'block'; return;
      }

      btn.disabled = true;
      btn.textContent = 'Resetting…';
      try {
        const r = await fetch(API + '/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        });
        const j = await r.json();
        if (j.success) {
          document.getElementById('form-state').style.display    = 'none';
          document.getElementById('success-state').style.display = 'block';
        } else {
          errEl.textContent = j.message || 'Something went wrong.';
          errEl.style.display = 'block';
          btn.disabled = false; btn.textContent = 'Reset Password';
        }
      } catch {
        errEl.textContent = 'Could not connect to server.';
        errEl.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Reset Password';
      }
    }
  </script>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
