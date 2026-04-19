// ────────────────────────────────────────────────────────
//  DATA
// ────────────────────────────────────────────────────────
const COLORS = ['#1a56db','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316','#6366f1','#14b8a6','#a855f7','#0ea5e9'];
const API_BASE = 'http://localhost:3000/api';

let agents = [
  { id:1,  name:'Lena Williams',   email:'lena.w@forexdesk.io',   shift:'day',   status:'online',  gender:'female', chats:4, maxChats:5, color:COLORS[0]  },
  { id:2,  name:'James Mitchell',  email:'james.m@forexdesk.io',  shift:'day',   status:'busy',    gender:'male',   chats:5, maxChats:5, color:COLORS[1]  },
  { id:3,  name:'Nadia Petrov',    email:'nadia.p@forexdesk.io',  shift:'night', status:'online',  gender:'female', chats:2, maxChats:5, color:COLORS[2]  },
  { id:4,  name:'Kai Anderson',    email:'kai.a@forexdesk.io',    shift:'day',   status:'away',    gender:'male',   chats:0, maxChats:5, color:COLORS[3]  },
  { id:5,  name:'Rita Brown',      email:'rita.b@forexdesk.io',   shift:'night', status:'online',  gender:'female', chats:3, maxChats:5, color:COLORS[4]  },
  { id:6,  name:'Tom Okafor',      email:'tom.o@forexdesk.io',    shift:'night', status:'offline', gender:'male',   chats:0, maxChats:5, color:COLORS[5]  },
  { id:7,  name:'Sara Chen',       email:'sara.c@forexdesk.io',   shift:'day',   status:'online',  gender:'female', chats:3, maxChats:5, color:COLORS[6]  },
  { id:8,  name:'Marco Rossi',     email:'marco.r@forexdesk.io',  shift:'night', status:'busy',    gender:'male',   chats:5, maxChats:5, color:COLORS[7]  },
  { id:9,  name:'Aisha Diallo',    email:'aisha.d@forexdesk.io',  shift:'day',   status:'away',    gender:'female', chats:0, maxChats:5, color:COLORS[8]  },
  { id:10, name:'Ryan Park',       email:'ryan.p@forexdesk.io',   shift:'night', status:'offline', gender:'male',   chats:0, maxChats:5, color:COLORS[9]  },
  { id:11, name:'Elena Vasquez',   email:'elena.v@forexdesk.io',  shift:'day',   status:'online',  gender:'female', chats:2, maxChats:5, color:COLORS[10] },
  { id:12, name:'David Kim',       email:'david.k@forexdesk.io',  shift:'night', status:'online',  gender:'male',   chats:4, maxChats:5, color:COLORS[11] },
];

let nextId = 13;
let editingId = null;
let currentFilter = 'all';
let _rtInterval = null;

// ────────────────────────────────────────────────────────
//  SVG AVATAR GENERATOR
// ────────────────────────────────────────────────────────
function avatarSVG(gender, color) {
  const w = 'rgba(255,255,255,0.93)';
  if (gender === 'female') {
    // Visible side-hair wings + narrower shoulders
    return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="${color}"/>
      <ellipse cx="24" cy="34" rx="7" ry="14" fill="${w}"/>
      <ellipse cx="56" cy="34" rx="7" ry="14" fill="${w}"/>
      <ellipse cx="40" cy="22" rx="14" ry="9" fill="${w}"/>
      <circle  cx="40" cy="29" r="13" fill="${w}"/>
      <path d="M18 80 Q20 60 40 56 Q60 60 62 80Z" fill="${w}"/>
    </svg>`;
  } else {
    // Plain round head, wider squarer shoulders
    return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="${color}"/>
      <circle cx="40" cy="28" r="14" fill="${w}"/>
      <path d="M10 80 Q12 58 40 54 Q68 58 70 80Z" fill="${w}"/>
    </svg>`;
  }
}

// ────────────────────────────────────────────────────────
//  THEME
// ────────────────────────────────────────────────────────
let currentTheme = (() => {
  const saved = localStorage.getItem('theme');
  return (saved === 'dark' || saved === 'light') ? saved : 'light';
})();

function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  _syncThemeUI();
}

function cycleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function _syncThemeUI() {
  const isDark = currentTheme === 'dark';
  // Main header icons
  const lightEl = document.getElementById('theme-icon-light');
  const darkEl  = document.getElementById('theme-icon-dark');
  if (lightEl) lightEl.style.display = isDark ? 'none' : '';
  if (darkEl)  darkEl.style.display  = isDark ? '' : 'none';
  // Auth page icons
  const aLight = document.getElementById('auth-theme-icon-light');
  const aDark  = document.getElementById('auth-theme-icon-dark');
  if (aLight) aLight.style.display = isDark ? 'none' : '';
  if (aDark)  aDark.style.display  = isDark ? '' : 'none';
  // Tooltips
  const title = isDark ? 'Switch to Light mode' : 'Switch to Dark mode';
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.title = title;
  const aBtn = document.getElementById('auth-theme-btn');
  if (aBtn) aBtn.title = title;
  document.querySelectorAll('.theme-option').forEach(b =>
    b.classList.toggle('active', b.dataset.theme === currentTheme)
  );
}

// Apply on load
(function() { applyTheme(currentTheme); })();

// ────────────────────────────────────────────────────────
//  AUTH
// ────────────────────────────────────────────────────────
let currentUser = {};

const SESSION_KEY        = 'forexdesk_session';
const LAST_ACTIVITY_KEY  = 'forexdesk_last_activity';

function saveSession() {
  const { id, name, email, role, status, avatarCustom, avatarIdx, shift } = currentUser;
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    id:           id            ?? null,
    name, email,
    role:         role          || 'agent',
    status:       status        || 'pending',
    avatarCustom: avatarCustom  || null,
    avatarIdx:    avatarIdx     ?? null,
    shift:        shift         || 'day'
  }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

function showScreen(s) {
  ['login', 'signup', 'pending', 'rejected'].forEach(id => {
    document.getElementById(id + '-screen').classList.add('hidden');
  });
  document.getElementById(s + '-screen').classList.remove('hidden');
}

function showErr(id, msg) { const e=document.getElementById(id); e.textContent=msg; e.style.display='block'; }
function hideErr(id) { const e=document.getElementById(id); if(e) e.style.display='none'; }

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  hideErr('login-email-err'); hideErr('login-pass-err');
  if (!emailValid(email)) { showErr('login-email-err','Please enter a valid email address (e.g. you@company.com).'); return; }
  if (!pass) { showErr('login-pass-err','Password is required.'); return; }
  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) btn.disabled = true;
  try {
    const res  = await fetch(`${API_BASE}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password: pass }) });
    const json = await res.json();
    if (!res.ok) { showErr('login-pass-err', json.message || 'Login failed. Please check your credentials.'); }
    else         { enterDashboard(json.data.name, email, json.data.role, json.data.id, json.data.avatarData, json.data.status); }
  } catch (err) {
    showErr('login-pass-err', 'Could not connect to server. Make sure the backend is running.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function selectSignupRole(btn) {
  document.querySelectorAll('#signup-screen .gender-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

async function handleSignup(e) {
  e.preventDefault();
  const name  = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const pass  = document.getElementById('su-password').value;
  hideErr('su-name-err'); hideErr('su-email-err'); hideErr('su-pass-err');
  if (!name)              { showErr('su-name-err',  'Please enter your full name.'); return; }
  if (!emailValid(email)) { showErr('su-email-err', 'Please enter a valid email address (e.g. you@company.com).'); return; }
  if (!passwordValid(pass)) { showErr('su-pass-err', 'Password must be 6+ characters with a letter, number, and special character (e.g. @#$!).'); return; }
  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) btn.disabled = true;
  try {
    const res  = await fetch(`${API_BASE}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password: pass }) });
    const json = await res.json();
    if (!res.ok) { showErr('su-email-err', json.message || 'Sign up failed. Please try again.'); }
    else         { enterDashboard(json.data.name, email, json.data.role, json.data.id, json.data.avatarData, json.data.status); }
  } catch (err) {
    showErr('su-email-err', 'Could not connect to server. Make sure the backend is running.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function _parseAvatarData(avatarData) {
  if (!avatarData) return { avatarCustom: null, avatarIdx: null };
  if (avatarData.startsWith('svg:')) return { avatarCustom: null, avatarIdx: parseInt(avatarData.slice(4), 10) };
  return { avatarCustom: avatarData, avatarIdx: null };
}

function enterDashboard(name, email, role, id, avatarData, status) {
  let { avatarCustom, avatarIdx } = _parseAvatarData(avatarData);

  // If the DB has no avatar, check whether a previous local session for this
  // same email already had one (e.g. set before the DB column existed).
  // Migrate it to the DB so it is never lost again.
  if (!avatarData) {
    let prev;
    try { prev = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(e) {}
    if (prev && prev.email === email) {
      if (prev.avatarCustom)       { avatarCustom = prev.avatarCustom; avatarIdx = null; }
      else if (prev.avatarIdx != null) { avatarIdx = prev.avatarIdx; avatarCustom = null; }
    }
    if (avatarCustom || avatarIdx != null) {
      const toSave = avatarCustom ? avatarCustom : `svg:${avatarIdx}`;
      setTimeout(() => _saveAvatarToAPI(toSave), 0);
    }
  }

  const resolvedStatus = status || 'pending';
  currentUser = { id: id ?? null, name, email, role: role || 'agent', status: resolvedStatus, avatarCustom, avatarIdx, shift: currentUser.shift || 'day' };
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  saveSession();

  if (resolvedStatus === 'pending')  { _showPendingScreen(name, email);  return; }
  if (resolvedStatus === 'rejected') { _showRejectedScreen(name, email); return; }

  _applyUserToDOM();
}

function _showPendingScreen(name, email) {
  document.getElementById('pending-user-name').textContent  = name;
  document.getElementById('pending-user-email').textContent = email;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-wrap').classList.remove('hidden');
  showScreen('pending');
  applyLanguage(currentLang);
}

function _showRejectedScreen(name, email) {
  document.getElementById('rejected-user-name').textContent  = name;
  document.getElementById('rejected-user-email').textContent = email;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-wrap').classList.remove('hidden');
  showScreen('rejected');
  applyLanguage(currentLang);
}

function _getLangLocale() {
  if (currentLang === 'ar') return 'ar-u-ca-gregory';
  if (currentLang === 'fa') return 'fa-u-ca-gregory';
  return 'en-US';
}

function _applyRolePermissions() {
  const isAgent = currentUser.role === 'agent';
  const isAdmin = currentUser.role === 'admin';
  // Agents cannot see Reports or Agent Management
  ['agents', 'reports'].forEach(page => {
    const el = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (el) el.style.display = isAgent ? 'none' : '';
  });
  // Users page — admin only
  const usersNav = document.querySelector('.nav-item[data-page="users"]');
  if (usersNav) usersNav.style.display = isAdmin ? '' : 'none';
  // Admin-only elements (Create User button, etc.)
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
}

function _applyUserToDOM() {
  const { name } = currentUser;
  const initials = name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('header-avatar').textContent  = initials;
  document.getElementById('sidebar-avatar').textContent = initials;
  document.getElementById('header-name').textContent    = name;
  document.getElementById('sidebar-name').textContent   = name;
  document.getElementById('greeting-name').textContent  = name.split(' ')[0];
  const now = new Date();
  document.getElementById('today-date').textContent =
    now.toLocaleDateString(_getLangLocale(),{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  document.getElementById('auth-wrap').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  if (currentUser.avatarCustom) updateHeaderAvatarImage();
  else if (currentUser.avatarIdx != null) updateHeaderAvatarSVG();
  _applyRolePermissions();
  const savedPage = localStorage.getItem('forexdesk_page') || 'dashboard';
  showPage(savedPage);
  updateNotifDot();
  _startIdleTimers();
}

function showLogoutPopup() {
  const nameEl   = document.getElementById('sidebar-name');
  const avatarEl = document.getElementById('sidebar-avatar');
  const logoutAv = document.getElementById('logout-avatar');

  if (nameEl) document.getElementById('logout-name').textContent = nameEl.textContent;

  // Mirror the sidebar avatar into the user card row
  if (currentUser && currentUser.avatarCustom) {
    logoutAv.innerHTML = `<img src="${currentUser.avatarCustom}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />`;
  } else if (avatarEl) {
    logoutAv.innerHTML = avatarEl.innerHTML;
  }

  // Fill the top icon circle with profile image when available
  const iconEl = document.getElementById('logout-popup-icon');
  if (iconEl) {
    if (currentUser && currentUser.avatarCustom) {
      iconEl.innerHTML = `<img src="${currentUser.avatarCustom}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />`;
      iconEl.classList.add('has-avatar');
    } else {
      // Restore default icon in case it was previously replaced
      iconEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
      iconEl.classList.remove('has-avatar');
    }
  }

  const overlay = document.getElementById('logout-overlay');
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('logout-overlay--visible'));
}

function openHelpModal() {
  document.getElementById('help-modal-overlay').classList.remove('hidden');
}
function closeHelpModal(e) {
  if (e && e.target !== document.getElementById('help-modal-overlay')) return;
  document.getElementById('help-modal-overlay').classList.add('hidden');
}

function hideLogoutPopup(e) {
  if (e && e.target !== document.getElementById('logout-overlay')) return;
  const overlay = document.getElementById('logout-overlay');
  overlay.classList.remove('logout-overlay--visible');
  overlay.addEventListener('transitionend', () => overlay.classList.add('hidden'), { once: true });
}

function handleLogout() {
  _clearIdleTimers();
  clearSession();
  localStorage.removeItem('forexdesk_page');
  document.getElementById('logout-overlay').classList.add('hidden');
  document.getElementById('logout-overlay').classList.remove('logout-overlay--visible');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-wrap').classList.remove('hidden');
  showScreen('login');
  document.getElementById('login-form').reset();
}

// ────────────────────────────────────────────────────────
//  PAGE SWITCHING
// ────────────────────────────────────────────────────────
const PAGE_TITLES = { dashboard:'Dashboard', agents:'Agent Management', livechats:'Live Chats', issues:'Platform Issues', tickets:'Tickets', reports:'Reports', settings:'Settings', notifications:'Notifications', profile:'My Profile', users:'User Management' };

function showPage(pageId) {
  const AGENT_RESTRICTED = ['agents', 'reports'];
  if (currentUser.role === 'agent' && AGENT_RESTRICTED.includes(pageId)) {
    pageId = 'dashboard';
  }
  if (currentUser.role !== 'admin' && pageId === 'users') {
    pageId = 'dashboard';
  }
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.remove('hidden');
  const t = translations[currentLang];
  document.getElementById('header-title').textContent = (t && t['page_' + pageId]) || PAGE_TITLES[pageId] || 'Dashboard';
  // Sync sidebar active state
  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.page === pageId));
  if (pageId === 'agents')        loadAgentsFromAPI();
  if (pageId === 'livechats')     renderLiveChats();
  if (pageId === 'issues')        loadPlatformIssuesFromAPI();
  if (pageId === 'tickets')       loadTicketsFromAPI();
  if (pageId === 'reports')       initReports();
  if (pageId === 'settings')      initSettings();
  if (pageId === 'profile')       initProfile();
  if (pageId === 'notifications') renderNotifPage();
  if (pageId === 'dashboard')     initDashboardOverview();
  if (pageId === 'users')         loadUsersFromAPI();
  // Persist the current page so refresh restores it
  localStorage.setItem('forexdesk_page', pageId);
}

function navClick(el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  const page = el.dataset.page;
  if (page) showPage(page);
  closeMobileSidebar();
}

function toggleMobileSidebar() {
  const open = document.getElementById('sidebar').classList.toggle('mobile-open');
  document.getElementById('sidebar-mobile-overlay').classList.toggle('visible', open);
}
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebar-mobile-overlay').classList.remove('visible');
}

function navToAgents() {
  const agentNav = document.querySelector('[data-page="agents"]');
  if (agentNav) navClick(agentNav);
}

function navToIssues() {
  const issuesNav = document.querySelector('[data-page="issues"]');
  if (issuesNav) navClick(issuesNav);
}

// ────────────────────────────────────────────────────────
//  AGENT MANAGEMENT
// ────────────────────────────────────────────────────────
let _archivedAgents = [];

function filterAgents(btn, filter) {
  document.querySelectorAll('#page-agents .filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = filter;
  if (filter === 'archived') {
    loadArchivedAgentsFromAPI();
  } else {
    renderAgents(filter);
  }
}

function getFilteredAgents(filter) {
  if (filter === 'archived') return _archivedAgents;
  if (filter === 'day')     return agents.filter(a => a.shift === 'day');
  if (filter === 'night')   return agents.filter(a => a.shift === 'night');
  if (filter === 'online')  return agents.filter(a => a.status === 'online');
  if (filter === 'busy')    return agents.filter(a => a.status === 'busy');
  if (filter === 'away')    return agents.filter(a => a.status === 'away');
  if (filter === 'offline') return agents.filter(a => a.status === 'offline');
  return agents;
}

function updateTabCounts() {
  document.getElementById('count-all').textContent      = agents.length;
  document.getElementById('count-day').textContent      = agents.filter(a=>a.shift==='day').length;
  document.getElementById('count-night').textContent    = agents.filter(a=>a.shift==='night').length;
  document.getElementById('count-online').textContent   = agents.filter(a=>a.status==='online').length;
  document.getElementById('count-busy').textContent     = agents.filter(a=>a.status==='busy').length;
  document.getElementById('count-away').textContent     = agents.filter(a=>a.status==='away').length;
  document.getElementById('count-offline').textContent  = agents.filter(a=>a.status==='offline').length;
  const el = document.getElementById('count-archived');
  if (el) el.textContent = _archivedAgents.length;
  const _ta = translations[currentLang];
  document.getElementById('agents-sub').textContent =
    `${agents.length} ${_ta.lbl_agents_word} · ${agents.filter(a=>a.shift==='day').length} ${_ta.lbl_day_word} · ${agents.filter(a=>a.shift==='night').length} ${_ta.lbl_night_word}`;
}

const STATUS_LABELS = { online:'Online', busy:'Busy', away:'Away', offline:'Offline' };
const SHIFT_ICONS   = { day:'☀', night:'🌙' };

function loadBarColor(pct) {
  if (pct >= 1)    return '#ef4444';
  if (pct >= 0.7)  return '#f59e0b';
  return '#10b981';
}

function renderAgents(filter) {
  updateTabCounts();
  const list = getFilteredAgents(filter);
  const grid = document.getElementById('agent-grid');

  if (list.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);font-size:15px">${translations[currentLang].no_agents_match}</div>`;
    return;
  }

  const _t = translations[currentLang];
  grid.innerHTML = list.map(a => {
    const pct    = a.chats / a.maxChats;
    const barClr = loadBarColor(pct);
    const svg    = avatarSVG(a.gender, a.color);
    const statusLabel = _t['status_' + a.status] || STATUS_LABELS[a.status];
    const shiftLabel  = a.shift === 'day' ? _t.shift_day : _t.shift_night;
    return `
    <div class="agent-card">
      <div class="agent-card-stripe ${a.shift}"></div>
      <div class="agent-card-body">

        <div class="agent-avatar-wrap">
          <div class="agent-avatar-img">${svg}</div>
          <div class="agent-status-dot ${a.status}" title="${statusLabel}"></div>
        </div>

        <div class="agent-name">${escHtml(a.name)}</div>
        <div class="agent-email">${escHtml(a.email)}</div>

        <span class="shift-badge ${a.shift}">${SHIFT_ICONS[a.shift]} ${shiftLabel}</span>

        <div class="agent-status-row">
          <span class="agent-status-label ${a.status}">${statusLabel}</span>
          ${a.status !== 'offline' ? `<span style="color:var(--text-muted);font-size:11px">· ${a.chats}/${a.maxChats} ${_t.lbl_chats_word}</span>` : ''}
        </div>

        <div class="agent-load-row">
          <div class="agent-load-header">
            <span>${_t.lbl_chat_load}</span>
            <span>${a.status === 'offline' ? '—' : Math.round(pct*100) + '%'}</span>
          </div>
          <div class="agent-load-track">
            <div class="agent-load-fill" style="width:${a.status==='offline'?0:Math.round(pct*100)}%;background:${barClr}"></div>
          </div>
        </div>

        <div style="display:flex;gap:6px;margin-top:10px;width:100%">
          <button class="btn-edit" style="flex:1" onclick="openEditModal(${a.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            ${_t.btn_edit_agent}
          </button>
          <button class="btn-edit" style="flex:1;background:#fef3c7;color:#92400e;border-color:#fde68a" onclick="archiveAgent(${a.id})">
            📦 ${_t.btn_archive}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ────────────────────────────────────────────────────────
//  EDIT MODAL
// ────────────────────────────────────────────────────────
function openEditModal(id) {
  editingId = id;
  const isNew = id === null;

  const _t = translations[currentLang];
  document.getElementById('modal-title').textContent = isNew ? _t.modal_add_agent_title : _t.modal_edit_agent_title;
  document.querySelector('.btn-primary[onclick="saveAgent()"]').textContent = isNew ? _t.btn_add_agent_modal : _t.btn_save_changes;

  // Reset errors
  ['modal-name-err','modal-email-err'].forEach(hideErr);

  let a = isNew
    ? { name:'', email:'', shift:'day', status:'online', gender:'female', color: COLORS[agents.length % COLORS.length] }
    : agents.find(ag => ag.id === id);

  // Populate fields
  document.getElementById('modal-name').value   = a.name;
  document.getElementById('modal-email').value  = a.email;
  document.getElementById('modal-status').value = a.status;

  // Gender buttons
  document.querySelectorAll('.gender-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.gender === a.gender);
  });

  // Shift buttons
  document.querySelectorAll('.shift-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.shift === a.shift);
  });

  // Avatar preview
  refreshModalAvatar(a.gender, a.color, a.status);

  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-name').focus();
}

function refreshModalAvatar(gender, color, status) {
  document.getElementById('modal-avatar-preview').innerHTML = avatarSVG(gender, color);
  const dot = document.getElementById('modal-avatar-dot');
  dot.className = 'avatar-preview-dot ' + status;
}

function updateModalAvatarDot() {
  const status = document.getElementById('modal-status').value;
  const dot = document.getElementById('modal-avatar-dot');
  dot.className = 'avatar-preview-dot ' + status;
}

function selectGender(btn) {
  document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const color = editingId === null
    ? COLORS[agents.length % COLORS.length]
    : agents.find(a => a.id === editingId).color;
  refreshModalAvatar(btn.dataset.gender, color, document.getElementById('modal-status').value);
}

function selectModalShift(btn) {
  document.querySelectorAll('.shift-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function closeEditModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}


async function saveAgent() {
  const name   = document.getElementById('modal-name').value.trim();
  const email  = document.getElementById('modal-email').value.trim();
  const status = document.getElementById('modal-status').value;
  const gender = document.querySelector('.gender-btn.active')?.dataset.gender || 'female';
  const shift  = document.querySelector('.shift-btn.active')?.dataset.shift  || 'day';

  hideErr('modal-name-err'); hideErr('modal-email-err');
  if (!name)  { showErr('modal-name-err','Please enter a name.'); return; }
  if (!emailValid(email)) { showErr('modal-email-err','Please enter a valid email address (e.g. jane@company.com).'); return; }

  const saveBtn = document.querySelector('.btn-primary[onclick="saveAgent()"]');
  if (saveBtn) saveBtn.disabled = true;
  try {
    let res, json;
    if (editingId === null) {
      res  = await fetch(`${API_BASE}/agents`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, shift, status }) });
    } else {
      res  = await fetch(`${API_BASE}/agents/${editingId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, shift, status }) });
    }
    json = await res.json();
    if (!res.ok) { showErr('modal-email-err', json.message || 'Could not save agent.'); return; }

    const a = json.data;
    if (editingId === null) {
      agents.push({ id: a.id, name: a.name, email: a.email, shift: a.shift, status: a.status, gender, chats: 0, maxChats: 5, color: COLORS[agents.length % COLORS.length] });
    } else {
      const ag = agents.find(x => x.id === editingId);
      if (ag) { ag.name = a.name; ag.email = a.email; ag.shift = a.shift; ag.status = a.status; ag.gender = gender; }
    }
    closeEditModal();
    renderAgents(currentFilter);
  } catch (err) {
    showErr('modal-email-err', 'Could not connect to server. Please try again.');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function loadAgentsFromAPI() {
  try {
    const [activeRes, archivedRes] = await Promise.all([
      fetch(`${API_BASE}/agents`),
      fetch(`${API_BASE}/agents/archived`)
    ]);
    const activeJson   = await activeRes.json();
    const archivedJson = await archivedRes.json();
    if (activeJson.success && Array.isArray(activeJson.data)) {
      agents = activeJson.data.map((a, i) => ({
        id: a.id, name: a.name, email: a.email,
        shift: a.shift, status: a.status,
        gender: i % 2 === 0 ? 'female' : 'male',
        chats:  a.status === 'offline' ? 0 : Math.floor(Math.random() * 4),
        maxChats: 5,
        color: COLORS[i % COLORS.length]
      }));
    }
    if (archivedJson.success && Array.isArray(archivedJson.data)) {
      _archivedAgents = archivedJson.data.map((a, i) => ({
        id: a.id, name: a.name, email: a.email,
        shift: a.shift, status: 'archived',
        gender: i % 2 === 0 ? 'female' : 'male',
        chats: 0, maxChats: 5,
        color: COLORS[i % COLORS.length]
      }));
    }
  } catch (err) {
    console.error('[loadAgentsFromAPI]', err);
  }
  renderAgents(currentFilter);
}

function archiveAgent(id) {
  const tl = translations[currentLang];
  showConfirm(
    tl.confirm_archive_title || 'Archive Agent',
    tl.confirm_archive_agent_sub || 'This agent will be archived. All their tickets and issues remain intact.',
    tl.btn_archive,
    async () => {
      try {
        const res  = await fetch(`${API_BASE}/agents/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'archived' })
        });
        const json = await res.json();
        if (!res.ok) { alert(json.message || 'Could not archive agent.'); return; }
        agents = agents.filter(a => a.id !== id);
        renderAgents(currentFilter);
      } catch (err) {
        alert('Could not connect to server. Please try again.');
      }
    }
  );
}

async function restoreAgent(id) {
  try {
    const res  = await fetch(`${API_BASE}/agents/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'offline' })
    });
    const json = await res.json();
    if (!res.ok) { alert(json.message || 'Could not restore agent.'); return; }
    await loadArchivedAgentsFromAPI();
  } catch (err) {
    alert('Could not connect to server. Please try again.');
  }
}

async function loadArchivedAgentsFromAPI() {
  try {
    const res  = await fetch(`${API_BASE}/agents/archived`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      _archivedAgents = json.data.map((a, i) => ({
        id: a.id, name: a.name, email: a.email,
        shift: a.shift, status: 'archived',
        gender: i % 2 === 0 ? 'female' : 'male',
        chats: 0, maxChats: 5,
        color: COLORS[i % COLORS.length]
      }));
    }
  } catch (err) {
    console.error('[loadArchivedAgentsFromAPI]', err);
  }
  renderArchivedAgents();
  updateTabCounts();
}

function renderArchivedAgents() {
  const grid = document.getElementById('agent-grid');
  const _t   = translations[currentLang];
  if (_archivedAgents.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);font-size:15px">${_t.no_agents_match}</div>`;
    return;
  }
  grid.innerHTML = _archivedAgents.map(a => {
    const svg = avatarSVG(a.gender, a.color);
    return `
    <div class="agent-card" style="opacity:0.75">
      <div class="agent-card-stripe ${a.shift}"></div>
      <div class="agent-card-body">
        <div class="agent-avatar-wrap">
          <div class="agent-avatar-img">${svg}</div>
          <div class="agent-status-dot offline" title="${_t.status_archived}"></div>
        </div>
        <div class="agent-name">${escHtml(a.name)}</div>
        <div class="agent-email">${escHtml(a.email)}</div>
        <span class="shift-badge ${a.shift}">${SHIFT_ICONS[a.shift]} ${a.shift === 'day' ? _t.shift_day : _t.shift_night}</span>
        <div class="agent-status-row">
          <span class="agent-status-label offline">📦 ${_t.status_archived}</span>
        </div>
        <div style="margin-top:auto;padding-top:10px;width:100%">
          <button class="btn-edit" style="width:100%" onclick="restoreAgent(${a.id})">
            ↩ ${_t.btn_restore_agent}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ────────────────────────────────────────────────────────
//  LIVE CHAT COUNTER TICKER
// ────────────────────────────────────────────────────────
(function liveCounter() {
  let count = 14;
  setInterval(() => {
    count = Math.max(8, Math.min(22, count + (Math.random() > .5 ? 1 : -1)));
    const el = document.getElementById('stat-active');
    if (el) el.textContent = count;
  }, 4000);
})();

// Keyboard: Esc closes modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeEditModal(); closeSupervisePanel(); closeIssueModal(); closeNewIssueModal(); closeTicketModal(); }
});

// ────────────────────────────────────────────────────────
//  REPORTS — DATA
// ────────────────────────────────────────────────────────

// Deterministic pseudo-random (seeded) so values are stable across renders
function seededVal(seed, min, max) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return min + Math.round((x - Math.floor(x)) * (max - min));
}

// Per-agent share of total chats (%)
const agentShare = { 1:13, 2:11, 3:10, 4:8, 5:9, 6:7, 7:10, 8:11, 9:7, 10:5, 11:5, 12:4 };

// Base agent satisfaction scores (%)
const agentBaseSat = { 1:96, 2:91, 3:94, 4:88, 5:93, 6:87, 7:95, 8:90, 9:92, 10:88, 11:94, 12:93 };

// Base first-response (seconds), efficiency (%), chatting time (seconds)
const agentBasePerf = {
  1:  { fr:72,  eff:94, ct:262 },
  2:  { fr:105, eff:88, ct:312 },
  3:  { fr:88,  eff:92, ct:285 },
  4:  { fr:118, eff:85, ct:334 },
  5:  { fr:95,  eff:91, ct:298 },
  6:  { fr:132, eff:83, ct:355 },
  7:  { fr:80,  eff:93, ct:271 },
  8:  { fr:98,  eff:89, ct:305 },
  9:  { fr:110, eff:87, ct:322 },
  10: { fr:125, eff:84, ct:348 },
  11: { fr:85,  eff:92, ct:278 },
  12: { fr:92,  eff:90, ct:294 },
};

// Chat totals per period (all agents)
const periodTotals = {
  today:     47,
  yesterday: 63,
  last7:     312,
  curMonth:  847,
  lastMonth: 921,
  curYear:   4821,
  total:     18432,
};

// Chart data (bars) per period — label + value pairs
const periodChartData = {
  today:     { xLabel:'Hour', bars:[{l:'08h',v:2},{l:'09h',v:6},{l:'10h',v:9},{l:'11h',v:7},{l:'12h',v:4},{l:'13h',v:6},{l:'14h',v:5},{l:'15h',v:4},{l:'16h',v:3},{l:'17h',v:1}] },
  yesterday: { xLabel:'Hour', bars:[{l:'08h',v:4},{l:'09h',v:8},{l:'10h',v:11},{l:'11h',v:9},{l:'12h',v:5},{l:'13h',v:8},{l:'14h',v:7},{l:'15h',v:6},{l:'16h',v:3},{l:'17h',v:2}] },
  last7:     { xLabel:'Day',  bars:[{l:'Mon',v:52},{l:'Tue',v:61},{l:'Wed',v:48},{l:'Thu',v:55},{l:'Fri',v:63},{l:'Sat',v:21},{l:'Sun',v:12}] },
  curMonth:  { xLabel:'Week', bars:[{l:'Wk 1',v:214},{l:'Wk 2',v:228},{l:'Wk 3',v:205},{l:'Wk 4',v:200}] },
  lastMonth: { xLabel:'Week', bars:[{l:'Wk 1',v:224},{l:'Wk 2',v:244},{l:'Wk 3',v:238},{l:'Wk 4',v:215}] },
  curYear:   { xLabel:'Month',bars:[{l:'Jan',v:380},{l:'Feb',v:342},{l:'Mar',v:415},{l:'Apr',v:428},{l:'May',v:398},{l:'Jun',v:445},{l:'Jul',v:421},{l:'Aug',v:389},{l:'Sep',v:402},{l:'Oct',v:435},{l:'Nov',v:388},{l:'Dec',v:378}] },
  total:     { xLabel:'Month',bars:[{l:'Jan\'24',v:380},{l:'Feb',v:342},{l:'Mar',v:415},{l:'Apr',v:428},{l:'May',v:398},{l:'Jun',v:445},{l:'Jul',v:421},{l:'Aug',v:389},{l:'Sep',v:402},{l:'Oct',v:435},{l:'Nov',v:388},{l:'Dec',v:1621}] },
};

// Satisfaction trend data per period
const satTrendData = {
  today:     { bars:[{l:'08h',v:100},{l:'09h',v:94},{l:'10h',v:91},{l:'11h',v:96},{l:'12h',v:88},{l:'13h',v:95},{l:'14h',v:97},{l:'15h',v:93},{l:'16h',v:89},{l:'17h',v:92}] },
  yesterday: { bars:[{l:'08h',v:95},{l:'09h',v:92},{l:'10h',v:88},{l:'11h',v:94},{l:'12h',v:90},{l:'13h',v:96},{l:'14h',v:93},{l:'15h',v:91},{l:'16h',v:94},{l:'17h',v:90}] },
  last7:     { bars:[{l:'Mon',v:94},{l:'Tue',v:91},{l:'Wed',v:96},{l:'Thu',v:89},{l:'Fri',v:93},{l:'Sat',v:97},{l:'Sun',v:95}] },
  curMonth:  { bars:[{l:'Wk 1',v:92},{l:'Wk 2',v:94},{l:'Wk 3',v:91},{l:'Wk 4',v:95}] },
  lastMonth: { bars:[{l:'Wk 1',v:93},{l:'Wk 2',v:91},{l:'Wk 3',v:94},{l:'Wk 4',v:92}] },
  curYear:   { bars:[{l:'Jan',v:91},{l:'Feb',v:93},{l:'Mar',v:90},{l:'Apr',v:94},{l:'May',v:92},{l:'Jun',v:95},{l:'Jul',v:93},{l:'Aug',v:91},{l:'Sep',v:94},{l:'Oct',v:92},{l:'Nov',v:95},{l:'Dec',v:94}] },
  total:     { bars:[{l:'Jan',v:91},{l:'Feb',v:93},{l:'Mar',v:90},{l:'Apr',v:94},{l:'May',v:92},{l:'Jun',v:95},{l:'Jul',v:93},{l:'Aug',v:91},{l:'Sep',v:94},{l:'Oct',v:92},{l:'Nov',v:95},{l:'Dec',v:94}] },
};

// Period multipliers for agent performance table
const periodChatMult = { today:1, yesterday:1.35, last7:6.6, curMonth:18, lastMonth:19.6, curYear:102.6, total:392 };

function fmtSec(s) {
  const m = Math.floor(s/60), r = s%60;
  return `${m}:${String(r).padStart(2,'0')}`;
}

// ────────────────────────────────────────────────────────
//  REPORTS — ANNUAL CHAT DATA
// ────────────────────────────────────────────────────────
const YEARLY_CHAT_DATA = {
  2025: [380, 342, 415, 428, 398, 445, 421, 389, 402, 435, 388, 378],
  2026: [412, 387, 445, 428, null, null, null, null, null, null, null, null]
};
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DONUT_PALETTE = [
  '#1a56db','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4',
  '#ec4899','#f97316','#6366f1','#14b8a6','#a855f7','#0ea5e9'
];

// ────────────────────────────────────────────────────────
//  REPORTS — STATE
// ────────────────────────────────────────────────────────
let rptActiveSub  = 'total-chats';
let tcPeriod = 'today', csPeriod = 'today', apPeriod = 'today';
let tcYearView = '2026';
let perfSortCol = 'totalChats', perfSortDir = 'desc';

// ────────────────────────────────────────────────────────
//  REPORTS — INIT
// ────────────────────────────────────────────────────────
function initReports() {
  // Populate agent dropdowns
  ['tc-agent-select','cs-agent-select'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel || sel.options.length > 1) return;
    agents.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id; opt.textContent = a.name;
      sel.appendChild(opt);
    });
  });
  renderTotalChats();
  renderYearlyCharts('2026');
}

// ────────────────────────────────────────────────────────
//  REPORTS — ANNUAL ANALYTICS CHARTS
// ────────────────────────────────────────────────────────
function setYearView(btn, year) {
  document.querySelectorAll('#tc-year-tabs .rpt-year-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  tcYearView = year;
  if (year === 'compare') renderCompareCharts();
  else renderYearlyCharts(year);
}

function renderYearlyCharts(year) {
  const raw = YEARLY_CHAT_DATA[year] || [];
  const active = raw
    .map((v, i) => ({ label: MONTH_LABELS[i], v, month: i }))
    .filter(d => d.v !== null && d.v !== undefined);
  const allMonths = raw
    .map((v, i) => ({ label: MONTH_LABELS[i], v: (v !== null && v !== undefined) ? v : 0, hasData: v !== null && v !== undefined, month: i }));
  const total = active.reduce((s, d) => s + d.v, 0);
  const body = document.getElementById('tc-yearly-body');
  if (!body) return;
  body.innerHTML = `
    <div class="rpt-yearly-grid">
      <div class="rpt-donut-wrap">
        <div class="rpt-chart-section-title">${translations[currentLang].rpt_monthly_dist}</div>
        ${buildDonutChart(active, total)}
      </div>
      <div class="rpt-mom-wrap">
        <div class="rpt-chart-section-title">${translations[currentLang].rpt_mom_trend}</div>
        ${buildMomChart(allMonths)}
      </div>
    </div>`;
}

function buildDonutChart(active, total) {
  const cx = 100, cy = 100, r = 68, sw = 26;
  const C = 2 * Math.PI * r;
  let cumFrac = 0, segs = '';
  active.forEach(d => {
    const frac = d.v / total;
    const dash = frac * C;
    const offset = C * (0.25 - cumFrac);
    segs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${DONUT_PALETTE[d.month]}" stroke-width="${sw}"
      stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}"
      stroke-dashoffset="${offset.toFixed(2)}" class="donut-seg"/>`;
    cumFrac += frac;
  });
  let legend = '<div class="donut-legend">';
  active.forEach(d => {
    const pct = ((d.v / total) * 100).toFixed(1);
    legend += `<div class="donut-legend-item">
      <span class="donut-legend-dot" style="background:${DONUT_PALETTE[d.month]}"></span>
      <span class="donut-legend-month">${d.label}</span>
      <span class="donut-legend-val">${d.v.toLocaleString()}</span>
      <span class="donut-legend-pct">${pct}%</span>
    </div>`;
  });
  legend += '</div>';
  return `<div class="donut-chart-wrap">
    <svg viewBox="0 0 200 200" class="donut-svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${sw}"/>
      ${segs}
      <text x="${cx}" y="${cy - 7}" text-anchor="middle" font-size="22" font-weight="700" style="fill:var(--text-primary)">${total.toLocaleString()}</text>
      <text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="10" style="fill:var(--text-muted)">${translations[currentLang].rpt_total_chats_svg}</text>
    </svg>
  </div>${legend}`;
}

function buildMomChart(active) {
  if (!active.length) return '<p class="rpt-no-data">No data available</p>';
  const W = 720, H = 200, pL = 42, pB = 46, pT = 20, pR = 12;
  const cW = W - pL - pR, cH = H - pB - pT;
  const max = Math.max(...active.map(d => d.v), 1);
  const slot = cW / active.length;
  const bW = Math.min(28, slot * 0.55);
  let grid = '', bars = '', labs = '', deltas = '';
  [0.5, 1].forEach(p => {
    const y = pT + cH * (1 - p);
    grid += `<line x1="${pL}" y1="${y.toFixed(0)}" x2="${W - pR}" y2="${y.toFixed(0)}" stroke="var(--border)" stroke-width="1"/>`;
    grid += `<text x="${pL - 5}" y="${(y + 4).toFixed(0)}" text-anchor="end" font-size="9" style="fill:var(--text-muted)">${Math.round(max * p)}</text>`;
  });
  const baseY = pT + cH;
  grid += `<line x1="${pL}" y1="${baseY}" x2="${W - pR}" y2="${baseY}" stroke="var(--border)" stroke-width="1"/>`;
  active.forEach((d, i) => {
    const x = pL + slot * i + slot / 2;
    const hasData = d.hasData !== false;
    const bH = hasData && d.v > 0 ? Math.max(2, (d.v / max) * cH) : 0;
    const by = pT + cH - bH;
    let color = '#1a56db', deltaTxt = '';
    if (hasData && d.v > 0 && i > 0) {
      const prev = active[i - 1];
      if (prev.hasData !== false && prev.v > 0) {
        const pct = (d.v - prev.v) / prev.v * 100;
        color = pct >= 0 ? '#10b981' : '#ef4444';
        deltaTxt = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
      }
    }
    if (bH > 0) {
      bars += `<rect x="${(x - bW/2).toFixed(1)}" y="${by.toFixed(1)}" width="${bW}" height="${bH.toFixed(1)}" fill="${color}" rx="3" opacity="0.88"/>`;
      bars += `<text x="${x.toFixed(1)}" y="${(by - 4).toFixed(1)}" text-anchor="middle" font-size="8.5" style="fill:var(--text-secondary)">${d.v}</text>`;
    } else {
      bars += `<rect x="${(x - bW/2).toFixed(1)}" y="${(pT + cH - 2).toFixed(1)}" width="${bW}" height="2" fill="var(--border)" rx="1" opacity="0.6"/>`;
    }
    labs  += `<text x="${x.toFixed(1)}" y="${(H - pB + 13).toFixed(0)}" text-anchor="middle" font-size="10" style="fill:var(--text-${hasData ? 'secondary' : 'muted'})">${d.label}</text>`;
    if (deltaTxt) {
      const dc = deltaTxt.startsWith('+') ? '#10b981' : '#ef4444';
      deltas += `<text x="${x.toFixed(1)}" y="${(H - pB + 28).toFixed(0)}" text-anchor="middle" font-size="8" fill="${dc}" font-weight="600">${deltaTxt}</text>`;
    }
  });
  return `<div class="mom-chart-wrap">
    <svg viewBox="0 0 ${W} ${H}" class="mom-svg" preserveAspectRatio="xMidYMid meet">${grid}${bars}${labs}${deltas}</svg>
  </div>`;
}

function renderCompareCharts() {
  const d25 = YEARLY_CHAT_DATA[2025];
  const d26 = YEARLY_CHAT_DATA[2026];
  const body = document.getElementById('tc-yearly-body');
  if (!body) return;
  const W = 760, H = 210, pL = 42, pB = 46, pT = 20, pR = 12;
  const cW = W - pL - pR, cH = H - pB - pT;
  const slot = cW / 12;
  const bW = Math.min(16, slot * 0.35);
  const allV = [...d25, ...d26.filter(v => v !== null)];
  const max = Math.max(...allV, 1);
  let grid = '', b25 = '', b26 = '', labs = '', diff = '';
  [0.5, 1].forEach(p => {
    const y = pT + cH * (1 - p);
    grid += `<line x1="${pL}" y1="${y.toFixed(0)}" x2="${W - pR}" y2="${y.toFixed(0)}" stroke="var(--border)" stroke-width="1"/>`;
    grid += `<text x="${pL - 5}" y="${(y + 4).toFixed(0)}" text-anchor="end" font-size="9" style="fill:var(--text-muted)">${Math.round(max * p)}</text>`;
  });
  const baseY2 = pT + cH;
  grid += `<line x1="${pL}" y1="${baseY2}" x2="${W - pR}" y2="${baseY2}" stroke="var(--border)" stroke-width="1"/>`;
  MONTH_LABELS.forEach((lbl, i) => {
    const cx = pL + slot * i + slot / 2;
    const v25 = d25[i] || 0;
    const h25 = v25 > 0 ? Math.max(2, (v25 / max) * cH) : 0;
    if (h25 > 0) {
      b25 += `<rect x="${(cx - bW - 1.5).toFixed(1)}" y="${(pT + cH - h25).toFixed(1)}" width="${bW}" height="${h25.toFixed(1)}" fill="#94a3b8" rx="2" opacity="0.85"/>`;
      b25 += `<text x="${(cx - bW/2 - 1.5).toFixed(1)}" y="${(pT + cH - h25 - 3).toFixed(1)}" text-anchor="middle" font-size="7.5" style="fill:var(--text-secondary)">${v25}</text>`;
    }
    labs += `<text x="${cx.toFixed(1)}" y="${(H - pB + 13).toFixed(0)}" text-anchor="middle" font-size="9.5" style="fill:var(--text-secondary)">${lbl}</text>`;
    const v26 = d26[i];
    if (v26 !== null && v26 > 0) {
      const h26 = Math.max(2, (v26 / max) * cH);
      b26 += `<rect x="${(cx + 1.5).toFixed(1)}" y="${(pT + cH - h26).toFixed(1)}" width="${bW}" height="${h26.toFixed(1)}" fill="#1a56db" rx="2" opacity="0.85"/>`;
      b26 += `<text x="${(cx + bW/2 + 1.5).toFixed(1)}" y="${(pT + cH - h26 - 3).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="#1a56db">${v26}</text>`;
      if (v25 > 0) {
        const pct = (v26 - v25) / v25 * 100;
        const dc = pct >= 0 ? '#10b981' : '#ef4444';
        diff += `<text x="${cx.toFixed(1)}" y="${(H - pB + 28).toFixed(0)}" text-anchor="middle" font-size="7.5" fill="${dc}" font-weight="600">${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%</text>`;
      }
    }
  });
  const svg = `<svg viewBox="0 0 ${W} ${H}" class="yoy-svg" preserveAspectRatio="xMidYMid meet">${grid}${b25}${b26}${labs}${diff}</svg>`;
  const _trc = translations[currentLang];
  const legend = `<div class="yoy-legend">
    <span class="yoy-legend-dot" style="background:#94a3b8"></span><span>${_trc.rpt_legend_2025}</span>
    <span class="yoy-legend-dot" style="background:#1a56db"></span><span>${_trc.rpt_legend_2026}</span>
    <span class="yoy-legend-note">${_trc.rpt_yoy_change}</span>
  </div>`;
  body.innerHTML = `<div class="rpt-yoy-wrap">${legend}${svg}</div>`;
}

// ────────────────────────────────────────────────────────
//  REPORTS — SUB-TAB SWITCH
// ────────────────────────────────────────────────────────
function showReportTab(btn, tabId) {
  document.querySelectorAll('.rpt-subnav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.rpt-section').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById('rpt-' + tabId);
  if (el) el.classList.remove('hidden');
  rptActiveSub = tabId;
  if (tabId === 'total-chats')  { renderTotalChats(); renderYearlyCharts(tcYearView === 'compare' ? '2026' : tcYearView); }
  if (tabId === 'satisfaction') renderSatisfaction();
  if (tabId === 'agent-perf')   renderAgentPerf();
}

// ────────────────────────────────────────────────────────
//  REPORTS — DATE PERIOD SWITCH
// ────────────────────────────────────────────────────────
function setRptPeriod(btn, prefix) {
  const group = btn.closest('.rpt-date-pills').querySelectorAll('.rpt-date-pill');
  group.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const period = btn.dataset.period;
  if (prefix === 'tc') { tcPeriod = period; renderTotalChats(); }
  if (prefix === 'cs') { csPeriod = period; renderSatisfaction(); }
  if (prefix === 'ap') { apPeriod = period; renderAgentPerf(); }
}

// ────────────────────────────────────────────────────────
//  REPORTS — SVG BAR CHART
// ────────────────────────────────────────────────────────
function renderBarChart(containerId, bars, color, yLabel) {
  if (!bars || !bars.length) return;
  const W = 700, H = 214, padL = 44, padB = 28, padT = 26, padR = 10;
  const cW = W - padL - padR, cH = H - padB - padT;
  const max = Math.max(...bars.map(b => b.v), 1);
  const bW  = Math.max(8, Math.min(40, cW / bars.length - 8));
  const slot = cW / bars.length;
  let svgBars = '', svgLabels = '', svgVals = '', svgGrid = '';

  [0,.25,.5,.75,1].forEach(pct => {
    const y = padT + cH * (1 - pct);
    const val = Math.round(max * pct);
    svgGrid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="1" opacity="${pct === 0 ? 1 : 0.5}"/>`;
    svgGrid += `<text x="${padL - 5}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="9" style="fill:var(--text-muted)">${val}</text>`;
  });

  bars.forEach((b, i) => {
    const bH = (b.v / max) * cH;
    const x  = padL + slot * i + (slot - bW) / 2;
    const y  = padT + cH - bH;
    svgBars   += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bW}" height="${bH.toFixed(1)}" fill="${color}" rx="3"><title>${b.l}: ${b.v}</title></rect>`;
    svgLabels += `<text x="${(x + bW/2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="9" style="fill:var(--text-muted)">${b.l}</text>`;
    svgVals   += `<text x="${(x + bW/2).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="600" style="fill:var(--text-secondary)">${b.v}</text>`;
  });

  document.getElementById(containerId).innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${svgGrid}${svgBars}${svgVals}${svgLabels}</svg>`;
}

// ────────────────────────────────────────────────────────
//  REPORTS — SVG DONUT CHART
// ────────────────────────────────────────────────────────
function renderDonut(containerId, pct, color) {
  const r = 52, cx = 70, cy = 70, circ = 2 * Math.PI * r;
  const filled = circ * (pct / 100);
  document.getElementById(containerId).innerHTML =
    `<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" style="width:100%">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="14"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="14"
        stroke-dasharray="${filled.toFixed(2)} ${circ.toFixed(2)}"
        stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy-8}" text-anchor="middle" font-size="24" font-weight="800" style="fill:var(--text-primary)">${pct}%</text>
      <text x="${cx}" y="${cy+12}" text-anchor="middle" font-size="10" style="fill:var(--text-muted)">Satisfaction</text>
    </svg>`;
}

// ────────────────────────────────────────────────────────
//  REPORTS — 1. TOTAL CHATS
// ────────────────────────────────────────────────────────
function renderTotalChats() {
  const period = tcPeriod;
  const agentId = parseInt(document.getElementById('tc-agent-select')?.value) || null;
  const share = agentId ? (agentShare[agentId] / 100) : 1;
  const total = Math.round(periodTotals[period] * share);
  const data  = periodChartData[period];
  const adjBars = data.bars.map(b => ({ l:b.l, v: Math.round(b.v * share) }));

  const _t = translations[currentLang];
  const periodLabelMap = { today:_t.period_today, yesterday:_t.period_yesterday, last7:_t.period_last7, curMonth:_t.period_curMonth, lastMonth:_t.period_lastMonth, curYear:_t.period_curYear, total:_t.period_total };

  // KPIs
  const avgPerBar = total / adjBars.length;
  const peakBar   = adjBars.reduce((a,b) => b.v > a.v ? b : a);
  const prevTotal = Math.round(total * (1 + seededVal(agentId||0, -12, 15) / 100));
  const deltaDir  = total >= prevTotal ? 'up' : 'down';
  const deltaPct  = Math.abs(Math.round((total - prevTotal) / Math.max(prevTotal,1) * 100));

  document.getElementById('tc-kpis').innerHTML = [
    { icon:'chat', cls:'blue',   val: total.toLocaleString(), lbl:_t.rpt_kpi_total_chats,   delta:`${deltaDir==='up'?'↑':'↓'} ${deltaPct}%`, dCls: deltaDir },
    { icon:'avg',  cls:'green',  val: avgPerBar.toFixed(1),   lbl:`${_t.rpt_avg_per} ${data.xLabel}`, delta:_t.rpt_vs_prev, dCls:'neu' },
    { icon:'peak', cls:'orange', val: peakBar.v,              lbl:`${_t.rpt_peak} (${peakBar.l})`, delta:_t.rpt_highest, dCls:'neu' },
    { icon:'rate', cls:'purple', val: ((total / Math.max(periodTotals[period],1))*100).toFixed(0)+'%', lbl:_t.rpt_share_of_team, delta: agentId ? agents.find(a=>a.id===agentId)?.name.split(' ')[0]||'' : _t.rpt_all_agents_delta, dCls:'neu' },
  ].map(k => {
    const icons = {
      chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      avg:  '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
      peak: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
      rate: '<polyline points="20 6 9 17 4 12"/>',
    };
    return `<div class="rpt-kpi-card">
      <div class="rpt-kpi-top">
        <div class="rpt-kpi-icon ${k.cls}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[k.icon]}</svg></div>
        <span class="rpt-kpi-label">${k.lbl}</span>
      </div>
      <div class="rpt-kpi-value">${k.val}</div>
      <span class="rpt-kpi-delta ${k.dCls}">${k.delta}</span>
    </div>`;
  }).join('');

  const agentLabel = agentId ? ` — ${agents.find(a=>a.id===agentId)?.name || ''}` : '';
  document.getElementById('tc-chart-title').textContent = `${_t.kpi_total_chats} — ${periodLabelMap[period]}${agentLabel}`;
  document.getElementById('tc-chart-sub').textContent   = `${total.toLocaleString()} ${_t.lbl_chats_word} · ${_t.lbl_per_day}`;

  renderBarChart('tc-chart', adjBars, '#1a56db');
  renderThisWeekChart();
}

function renderThisWeekChart() {
  const wrap = document.getElementById('tc-week-chart');
  if (!wrap) return;
  const agentId = parseInt(document.getElementById('tc-agent-select')?.value) || null;
  const share = agentId ? (agentShare[agentId] / 100) : 1;
  const bars = periodChartData.last7.bars.map(b => ({ l: b.l, v: Math.round(b.v * share) }));
  const total = bars.reduce((s, b) => s + b.v, 0);
  const sub = document.getElementById('tc-week-sub');
  if (sub) { const _t2 = translations[currentLang]; sub.textContent = `${total.toLocaleString()} ${_t2.lbl_chats_word} · ${_t2.lbl_per_day}`; }
  renderBarChart('tc-week-chart', bars, '#8b5cf6');
}

// ────────────────────────────────────────────────────────
//  REPORTS — 2. CHAT SATISFACTION
// ────────────────────────────────────────────────────────
function renderSatisfaction() {
  const period  = csPeriod;
  const agentId = parseInt(document.getElementById('cs-agent-select')?.value) || null;

  // Overall CSAT for selection
  let csat;
  if (agentId) {
    const base = agentBaseSat[agentId] || 92;
    csat = Math.min(100, Math.max(70, base + seededVal(agentId * 3 + ['today','yesterday','last7','curMonth','lastMonth','curYear','total'].indexOf(period), -3, 3)));
  } else {
    const allSat = Object.values(agentBaseSat);
    csat = Math.round(allSat.reduce((s,v)=>s+v,0) / allSat.length);
    csat = Math.min(100, Math.max(70, csat + seededVal(['today','yesterday','last7','curMonth','lastMonth','curYear','total'].indexOf(period), -2, 2)));
  }

  const positive = Math.round(periodTotals[period] * (agentId ? agentShare[agentId]/100 : 1) * (csat/100));
  const negative = Math.round(periodTotals[period] * (agentId ? agentShare[agentId]/100 : 1) * ((100-csat)/100));
  const neutral  = 0;

  // Donut
  renderDonut('cs-donut', csat, csat >= 90 ? '#10b981' : csat >= 80 ? '#f59e0b' : '#ef4444');

  // Legend
  const _tsat = translations[currentLang];
  document.getElementById('cs-legend').innerHTML = `
    <div class="rpt-legend-row"><div class="rpt-legend-dot" style="background:#10b981"></div><span>${_tsat.rpt_positive}</span><span class="rpt-legend-val">${positive}</span></div>
    <div class="rpt-legend-row"><div class="rpt-legend-dot" style="background:#ef4444"></div><span>${_tsat.rpt_negative}</span><span class="rpt-legend-val">${negative}</span></div>
    <div class="rpt-legend-row"><div class="rpt-legend-dot" style="background:#94a3b8"></div><span>${_tsat.rpt_no_rating}</span><span class="rpt-legend-val">${Math.round(positive * .08)}</span></div>`;

  // KPI cards
  const npsScore = Math.round(csat - 35);
  document.getElementById('cs-kpis').innerHTML = [
    { val:`${csat}%`,         lbl:_tsat.rpt_csat_score,       cls:'green',  delta: csat>=90?_tsat.rpt_excellent:_tsat.rpt_good_delta, dCls: csat>=90?'up':'neu' },
    { val:`${positive}`,      lbl:_tsat.rpt_positive_ratings,  cls:'blue',   delta:_tsat.rpt_happy_clients, dCls:'up' },
    { val:`${negative}`,      lbl:_tsat.rpt_negative_ratings,  cls:'orange', delta: negative>5?_tsat.rpt_review_needed:_tsat.rpt_low_delta, dCls: negative>5?'down':'up' },
    { val:`${npsScore}`,      lbl:_tsat.rpt_nps_score,         cls:'purple', delta: npsScore>=50?_tsat.rpt_promoters:_tsat.rpt_passives, dCls: npsScore>=50?'up':'neu' },
  ].map(k => `<div class="rpt-kpi-card">
    <div class="rpt-kpi-top"><div class="rpt-kpi-icon ${k.cls}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div>
      <span class="rpt-kpi-label">${k.lbl}</span></div>
    <div class="rpt-kpi-value">${k.val}</div>
    <span class="rpt-kpi-delta ${k.dCls}">${k.delta}</span>
  </div>`).join('');

  // Trend chart (satisfaction % over bars)
  const trendBars = satTrendData[period].bars;
  const agentTrend = trendBars.map(b => ({
    l: b.l,
    v: Math.min(100, Math.max(70, b.v + (agentId ? (agentBaseSat[agentId]-92) : 0)))
  }));

  const agentOffset = agentId ? (agentBaseSat[agentId] - 92) : 0;
  const agentName   = agentId ? (agents.find(a => a.id === agentId)?.name || '') : '';

  // This Week chart (last7 — fixed)
  const weekBars = satTrendData.last7.bars.map(b => ({
    l: b.l, v: Math.min(100, Math.max(70, b.v + agentOffset))
  }));
  const weekSub = document.getElementById('cs-chart-week-sub');
  if (weekSub) { const _tcs = translations[currentLang]; weekSub.textContent = `${_tcs.lbl_csat_per_day}${agentName ? ' · ' + agentName : ''}`; }
  renderBarChart('cs-chart-week', weekBars, '#10b981');

  // Current Month chart (curMonth — fixed)
  const monthBars = satTrendData.curMonth.bars.map(b => ({
    l: b.l, v: Math.min(100, Math.max(70, b.v + agentOffset))
  }));
  const monthSub = document.getElementById('cs-chart-month-sub');
  if (monthSub) { const _tcs2 = translations[currentLang]; monthSub.textContent = `${_tcs2.lbl_csat_per_week}${agentName ? ' · ' + agentName : ''}`; }
  renderBarChart('cs-chart-month', monthBars, '#10b981');
}

// ────────────────────────────────────────────────────────
//  REPORTS — 3. AGENT PERFORMANCE TABLE
// ────────────────────────────────────────────────────────
function renderAgentPerf() {
  const period = apPeriod;
  const mult   = periodChatMult[period] || 1;
  const pidx   = ['today','yesterday','last7','curMonth','lastMonth','curYear','total'].indexOf(period);

  let rows = agents.map(a => {
    const p  = agentBasePerf[a.id];
    const tc = Math.round((agentShare[a.id] / 100) * periodTotals[period]);
    const sat = Math.min(100, Math.max(70, agentBaseSat[a.id] + seededVal(a.id * 7 + pidx, -4, 4)));
    const fr  = Math.max(30, p.fr + seededVal(a.id * 11 + pidx, -15, 20));
    const eff = Math.min(100, Math.max(70, p.eff + seededVal(a.id * 13 + pidx, -5, 5)));
    const ct  = Math.max(120, p.ct + seededVal(a.id * 17 + pidx, -30, 40));
    return { agentId: a.id, name: a.name, color: a.color, gender: a.gender, shift: a.shift,
             totalChats: tc, satisfaction: sat, firstResponse: fr, efficiency: eff, chattingTime: ct };
  });

  // Sort
  rows.sort((a,b) => {
    const av = a[perfSortCol], bv = b[perfSortCol];
    if (typeof av === 'string') return perfSortDir==='asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return perfSortDir === 'asc' ? av - bv : bv - av;
  });

  // Update sort icons
  ['name','totalChats','satisfaction','firstResponse','efficiency','chattingTime'].forEach(col => {
    const el = document.getElementById(`sort-icon-${col}`);
    if (!el) return;
    el.textContent = col === perfSortCol ? (perfSortDir==='asc' ? '↑' : '↓') : '';
  });

  // Update th classes
  document.querySelectorAll('.rpt-th').forEach(th => {
    const onclick = th.getAttribute('onclick') || '';
    const match   = onclick.match(/sortPerfTable\('(\w+)'\)/);
    if (match) th.classList.toggle('sorted', match[1] === perfSortCol);
  });

  const periodTotal = periodTotals[period] || 1;

  document.getElementById('rpt-perf-tbody').innerHTML = rows.map((r, idx) => {
    const satColor = r.satisfaction >= 93 ? '#10b981' : r.satisfaction >= 85 ? '#f59e0b' : '#ef4444';
    const initials = r.name.split(' ').map(w=>w[0]).join('').slice(0,2);
    const sharePct = (r.totalChats / periodTotal) * 100;
    return `<tr>
      <td>
        <div class="rpt-agent-cell">
          <div class="rpt-agent-cell-avatar" style="background:${r.color}">${initials}</div>
          <div>
            <div class="rpt-agent-cell-name">${escHtml(r.name)}</div>
            <div class="rpt-agent-cell-shift">${r.shift==='day'?'☀ Day':'🌙 Night'} Shift</div>
          </div>
        </div>
      </td>
      <td><strong>${r.totalChats.toLocaleString()}</strong></td>
      <td>
        <div class="rpt-sat-cell">
          <strong style="color:${satColor}">${r.satisfaction}%</strong>
          <div class="rpt-sat-bar-track">
            <div class="rpt-sat-bar-fill" style="width:${r.satisfaction}%;background:${satColor}"></div>
          </div>
        </div>
      </td>
      <td>${fmtSec(r.firstResponse)}</td>
      <td>
        <div class="rpt-sat-cell">
          <strong>${r.efficiency}%</strong>
          <div class="rpt-sat-bar-track">
            <div class="rpt-sat-bar-fill" style="width:${r.efficiency}%;background:${r.efficiency>=90?'#10b981':r.efficiency>=80?'#f59e0b':'#ef4444'}"></div>
          </div>
        </div>
      </td>
      <td>${fmtSec(r.chattingTime)}</td>
      <td class="rpt-share-cell">${buildShareRing(sharePct)}</td>
      <td class="rpt-trend-cell">${buildAgentTrendSVG(r.agentId)}</td>
    </tr>`;
  }).join('');
}

function buildShareRing(pct) {
  const r = 17, sw = 5, cx = 21, cy = 21;
  const C = 2 * Math.PI * r;
  const fill = Math.min(pct / 100, 1) * C;
  const color = pct >= 15 ? '#1a56db' : pct >= 8 ? '#8b5cf6' : '#94a3b8';
  return `<div class="share-ring-wrap">
    <svg viewBox="0 0 42 42" class="share-ring-svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${sw}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}"
        stroke-dasharray="${fill.toFixed(2)} ${(C - fill).toFixed(2)}"
        stroke-dashoffset="${(C * 0.25).toFixed(2)}" stroke-linecap="round"/>
      <text x="${cx}" y="${cy + 3.5}" text-anchor="middle" font-size="8" font-weight="700" fill="#1e293b">${pct.toFixed(1)}%</text>
    </svg>
  </div>`;
}

function buildAgentTrendSVG(agentId) {
  const p = agentBasePerf[agentId];
  if (!p) return '';
  // Generate monthly data for Jan–Apr 2026
  const months = [0, 1, 2, 3];
  const mLabels = ['Jan','Feb','Mar','Apr'];
  const monthly = months.map(m => {
    const yearTotal = YEARLY_CHAT_DATA[2026][m] || 1;
    const chats = Math.round((agentShare[agentId] / 100) * yearTotal);
    const fr    = Math.max(30,  p.fr  + seededVal(agentId * 11 + m, -18, 22));
    const eff   = Math.min(100, Math.max(65, p.eff + seededVal(agentId * 13 + m, -6, 6)));
    const ct    = Math.max(100, p.ct  + seededVal(agentId * 17 + m, -35, 45));
    return { chats, fr, eff, ct };
  });

  // Series: [values, color, higherIsBetter]
  const series = [
    { vals: monthly.map(d => d.chats), color: '#1a56db', hi: true  },
    { vals: monthly.map(d => d.fr),    color: '#10b981', hi: false },
    { vals: monthly.map(d => d.eff),   color: '#f59e0b', hi: true  },
    { vals: monthly.map(d => d.ct),    color: '#8b5cf6', hi: false },
  ];

  const W = 130, H = 58, pL = 6, pR = 6, pT = 6, pB = 16;
  const cW = W - pL - pR, cH = H - pT - pB;
  const xStep = cW / (months.length - 1);
  let svgContent = '';

  series.forEach(s => {
    const mn = Math.min(...s.vals), mx = Math.max(...s.vals);
    const range = mx - mn || 1;
    const pts = s.vals.map((v, i) => {
      const x = pL + i * xStep;
      const norm = (v - mn) / range;
      const y = s.hi ? pT + cH * (1 - norm) : pT + cH * norm;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    svgContent += `<polyline points="${pts.join(' ')}" fill="none" stroke="${s.color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>`;
    s.vals.forEach((v, i) => {
      const x = pL + i * xStep;
      const norm = (v - mn) / range;
      const y = s.hi ? pT + cH * (1 - norm) : pT + cH * norm;
      svgContent += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="${s.color}"/>`;
    });
  });

  // Month labels
  mLabels.forEach((lbl, i) => {
    const x = pL + i * xStep;
    svgContent += `<text x="${x.toFixed(1)}" y="${H - 2}" text-anchor="middle" font-size="7.5" fill="#94a3b8">${lbl}</text>`;
  });

  // Grid lines (faint)
  [0, 0.5, 1].forEach(p => {
    const y = pT + cH * p;
    svgContent = `<line x1="${pL}" y1="${y.toFixed(1)}" x2="${W - pR}" y2="${y.toFixed(1)}" stroke="#f1f5f9" stroke-width="1"/>` + svgContent;
  });

  return `<svg viewBox="0 0 ${W} ${H}" class="agent-trend-svg">${svgContent}</svg>`;
}

function sortPerfTable(col) {
  if (perfSortCol === col) {
    perfSortDir = perfSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    perfSortCol = col;
    perfSortDir = col === 'name' ? 'asc' : 'desc';
  }
  renderAgentPerf();
}

// ────────────────────────────────────────────────────────
//  LIVE CHATS DATA
// ────────────────────────────────────────────────────────
let queueChats = [
  { id:'q1', client:'Michael K.',  initials:'MK', topic:'EUR/USD trade not executed for 10+ mins', channel:'WebTrader', waitMins:8,  priority:'high'   },
  { id:'q2', client:'Sofia R.',    initials:'SR', topic:'How to withdraw funds to bank account',    channel:'Mobile App', waitMins:3,  priority:'normal' },
  { id:'q3', client:'Ahmed L.',    initials:'AL', topic:'Leverage settings not applying on MT4',    channel:'MT4 Plugin', waitMins:2,  priority:'normal' },
  { id:'q4', client:'Yuki P.',     initials:'YP', topic:'Platform showing wrong balance after swap',channel:'WebTrader', waitMins:6,  priority:'high'   },
  { id:'q5', client:'Carlos T.',   initials:'CT', topic:'Cannot login after password reset',        channel:'Web',       waitMins:1,  priority:'normal' },
];

let activeChats = [
  {
    id:'c1', client:'Diana M.', initials:'DM', agentId:1, topic:'Deposit not reflecting in account',
    channel:'WebTrader', durationMins:12,
    messages:[
      { role:'client',  sender:'Diana M.',    time:'09:42', text:'Hi, I made a deposit of $500 via credit card 2 hours ago but it\'s not showing in my account.' },
      { role:'agent',   sender:'Lena W.',     time:'09:43', text:'Hello Diana! I\'m sorry to hear that. Could you share your account ID so I can look this up?' },
      { role:'client',  sender:'Diana M.',    time:'09:44', text:'Sure — it\'s FD-28471.' },
      { role:'agent',   sender:'Lena W.',     time:'09:44', text:'Thank you. I can see the transaction in our system — it\'s currently pending with the payment processor. These typically clear within 1–3 hours.' },
      { role:'client',  sender:'Diana M.',    time:'09:45', text:'It\'s already been 2 hours. This is really frustrating.' },
      { role:'agent',   sender:'Lena W.',     time:'09:46', text:'I completely understand, Diana. Let me escalate this to our finance team to expedite it for you right now.' },
    ]
  },
  {
    id:'c2', client:'Peter W.',  initials:'PW', agentId:3, topic:'Account verification pending 3 days',
    channel:'Web', durationMins:5,
    messages:[
      { role:'client', sender:'Peter W.',  time:'09:58', text:'I uploaded my verification documents 3 days ago and my account is still unverified.' },
      { role:'agent',  sender:'Nadia P.', time:'09:59', text:'Hi Peter! I\'ll check the status of your documents right away.' },
      { role:'agent',  sender:'Nadia P.', time:'10:00', text:'I can see your documents were received and are currently in our compliance review queue.' },
      { role:'client', sender:'Peter W.',  time:'10:01', text:'3 days is too long. I need to start trading urgently.' },
      { role:'agent',  sender:'Nadia P.', time:'10:02', text:'I understand your urgency, Peter. Normal review is 24–48 hours. I\'ll flag your case for priority review immediately.' },
    ]
  },
  {
    id:'c3', client:'Anna S.',   initials:'AS', agentId:7, topic:'Stop-loss order not triggered',
    channel:'WebTrader', durationMins:8,
    messages:[
      { role:'client', sender:'Anna S.',  time:'10:05', text:'My stop-loss at 1.0820 on GBP/USD was never triggered. The price went well below that.' },
      { role:'agent',  sender:'Sara C.', time:'10:06', text:'Hi Anna, I can see the trade. This may be related to a slippage event during the London open. Let me pull the tick data.' },
      { role:'client', sender:'Anna S.',  time:'10:07', text:'I lost more than I should have. I need this investigated.' },
      { role:'agent',  sender:'Sara C.', time:'10:08', text:'Absolutely. I\'ve submitted a review request to our trading desk. You\'ll receive a full report within 24 hours.' },
    ]
  },
  {
    id:'c4', client:'Raj P.',    initials:'RP', agentId:5, topic:'Bonus credit not showing after deposit',
    channel:'Mobile App', durationMins:3,
    messages:[
      { role:'client', sender:'Raj P.',   time:'10:15', text:'I deposited $1000 yesterday to claim the 50% bonus but it\'s not in my account.' },
      { role:'agent',  sender:'Rita B.', time:'10:16', text:'Hi Raj! The bonus is applied manually within 24 hours of the qualifying deposit. Let me check if yours is queued.' },
      { role:'client', sender:'Raj P.',   time:'10:17', text:'The promo said it would be instant.' },
    ]
  },
  {
    id:'c5', client:'Helen C.',  initials:'HC', agentId:11, topic:'MT4 password reset not working',
    channel:'MT4 Plugin', durationMins:19,
    messages:[
      { role:'client', sender:'Helen C.',    time:'09:50', text:'I reset my MT4 investor password but the platform still won\'t connect.' },
      { role:'agent',  sender:'Elena V.', time:'09:51', text:'Hello Helen! After a password reset, it can take up to 5 minutes to propagate to the MT4 servers.' },
      { role:'client', sender:'Helen C.',    time:'09:56', text:'It\'s been 20 minutes now and still no luck.' },
      { role:'agent',  sender:'Elena V.', time:'09:58', text:'I see the issue — your server is currently showing a sync delay. I\'m pushing a manual refresh now.' },
      { role:'client', sender:'Helen C.',    time:'10:00', text:'Still the same error: "Invalid account".' },
      { role:'agent',  sender:'Elena V.', time:'10:02', text:'One moment — I\'ll escalate this to our tech team directly.' },
    ]
  },
  {
    id:'c6', client:'Omar F.',   initials:'OF', agentId:12, topic:'IB commission not credited',
    channel:'Web', durationMins:7,
    messages:[
      { role:'client', sender:'Omar F.',   time:'10:10', text:'My IB commission for last week hasn\'t been credited. The amount should be $340.' },
      { role:'agent',  sender:'David K.', time:'10:11', text:'Hi Omar! IB commissions are processed every Monday. Let me verify your IB code and the period.' },
      { role:'client', sender:'Omar F.',   time:'10:12', text:'IB code is FD-IB-0042.' },
      { role:'agent',  sender:'David K.', time:'10:13', text:'Got it. I can see the calculation is pending final approval — it should be credited by end of day today.' },
    ]
  },
  {
    id:'c7', client:'Lisa T.',   initials:'LT', agentId:3, topic:'Spread wider than advertised',
    channel:'WebTrader', durationMins:2,
    messages:[
      { role:'client', sender:'Lisa T.',   time:'10:20', text:'The spread on EUR/USD is showing 3.2 pips but your website says 0.8 pips.' },
      { role:'agent',  sender:'Nadia P.', time:'10:21', text:'Hi Lisa! During high-volatility periods, spreads can widen significantly. Are you looking at a fixed or variable spread account?' },
    ]
  },
  {
    id:'c8', client:'Ben H.',    initials:'BH', agentId:1, topic:'Withdrawal rejected without reason',
    channel:'Mobile App', durationMins:15,
    messages:[
      { role:'client', sender:'Ben H.',    time:'09:38', text:'My withdrawal of $2,000 was rejected and I received no explanation.' },
      { role:'agent',  sender:'Lena W.',  time:'09:39', text:'Hi Ben, I\'m sorry about that. Let me pull up your withdrawal request now.' },
      { role:'agent',  sender:'Lena W.',  time:'09:40', text:'I can see it was flagged automatically for a compliance review. This is standard for first-time withdrawals above $1,500.' },
      { role:'client', sender:'Ben H.',    time:'09:42', text:'Nobody told me that. How long will the review take?' },
      { role:'agent',  sender:'Lena W.',  time:'09:43', text:'Usually 1 business day. I\'ve added a note to expedite it for you and you\'ll be emailed once it\'s approved.' },
      { role:'client', sender:'Ben H.',    time:'09:50', text:'It\'s been an hour. Any update?' },
    ]
  },
  {
    id:'c9', client:'Priya M.',  initials:'PM', agentId:8, topic:'Charts not loading on WebTrader',
    channel:'WebTrader', durationMins:4,
    messages:[
      { role:'client', sender:'Priya M.', time:'10:18', text:'The charts on WebTrader are completely blank. I can\'t see any price data.' },
      { role:'agent',  sender:'Marco R.', time:'10:19', text:'Hi Priya! This is a known issue affecting some users this morning. Our tech team is actively working on a fix.' },
      { role:'client', sender:'Priya M.', time:'10:20', text:'Is there a workaround? I have open positions I need to monitor.' },
      { role:'agent',  sender:'Marco R.', time:'10:21', text:'Yes — you can use our MT4 platform as a backup. I\'ll send you the download link now.' },
    ]
  },
];

let supervisingChatId = null;

// ────────────────────────────────────────────────────────
//  LIVE CHATS RENDER
// ────────────────────────────────────────────────────────
function renderLiveChats() {
  const t = translations[currentLang];

  // Update counts
  document.getElementById('lc-queue-count').textContent  = queueChats.length;
  document.getElementById('lc-active-count').textContent = activeChats.length;
  document.getElementById('lc-queue-badge').textContent  = queueChats.length;
  document.getElementById('lc-active-badge').textContent = activeChats.length;
  document.getElementById('lc-sub').textContent =
    `${queueChats.length} ${t.lc_in_queue.toLowerCase()} · ${activeChats.length} ${t.lc_ongoing}`;
  document.getElementById('nav-livechats-badge').textContent =
    queueChats.length + activeChats.length;

  // Render queue
  const qList = document.getElementById('lc-queue-list');
  if (queueChats.length === 0) {
    qList.innerHTML = `<div class="lc-empty">${t.lc_no_queue}</div>`;
  } else {
    qList.innerHTML = queueChats.map(c => {
      const urgency = c.waitMins >= 5 ? 'urgent' : 'normal';
      return `
      <div class="lc-queue-card" id="qcard-${c.id}">
        <div class="lc-card-top">
          <div class="lc-client-avatar">${escHtml(c.initials)}</div>
          <div class="lc-client-info">
            <div class="lc-client-name">${escHtml(c.client)}</div>
            <div class="lc-client-topic">${escHtml(c.topic)}</div>
          </div>
          <div class="lc-priority-dot ${c.priority}" title="${c.priority === 'high' ? 'High priority' : 'Normal priority'}"></div>
        </div>
        <div class="lc-card-meta">
          <span class="lc-channel-tag">${escHtml(c.channel)}</span>
          <span class="lc-wait-tag ${urgency}">⏱ ${c.waitMins}m ${t.lc_waiting}</span>
        </div>
        <button class="btn-pickup" onclick="pickUpChat('${c.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ${t.lc_pick_up}
        </button>
      </div>`;
    }).join('');
  }

  // Render active chats
  const aList = document.getElementById('lc-active-list');
  if (activeChats.length === 0) {
    aList.innerHTML = `<div class="lc-empty">${t.lc_no_active}</div>`;
  } else {
    aList.innerHTML = activeChats.map(c => {
      const agent = agents.find(a => a.id === c.agentId);
      const agentName   = agent ? agent.name.split(' ')[0] + ' ' + agent.name.split(' ')[1]?.[0] + '.' : 'Unassigned';
      const agentColor  = agent ? agent.color : '#94a3b8';
      const agentInitials = agent ? agent.name.split(' ').map(w=>w[0]).join('').slice(0,2) : '?';
      return `
      <div class="lc-active-card" id="acard-${c.id}">
        <div class="lc-card-top">
          <div class="lc-client-avatar" style="background:#e2e8f0;color:#475569">${escHtml(c.initials)}</div>
          <div class="lc-client-info">
            <div class="lc-client-name">${escHtml(c.client)}</div>
            <div class="lc-client-topic">${escHtml(c.topic)}</div>
          </div>
        </div>
        <div class="lc-agent-row">
          <div class="lc-agent-mini-avatar" style="background:${agentColor}">${agentInitials}</div>
          <span class="lc-agent-name">${agentName}</span>
          <span class="lc-channel-tag">${escHtml(c.channel)}</span>
          <span class="lc-duration-tag">🕐 ${c.durationMins}m</span>
        </div>
        <button class="btn-supervise" onclick="openSupervisePanel('${c.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          ${t.lc_supervise}
        </button>
      </div>`;
    }).join('');
  }
}

// ────────────────────────────────────────────────────────
//  PICK UP CHAT
// ────────────────────────────────────────────────────────
function pickUpChat(queueId) {
  const chat = queueChats.find(c => c.id === queueId);
  if (!chat) return;

  // Find an available agent (online, not at max)
  const available = agents.find(a => a.status === 'online' && a.chats < a.maxChats);
  if (!available) {
    alert('No available agents right now. All online agents are at full capacity.');
    return;
  }

  // Move from queue to active
  queueChats = queueChats.filter(c => c.id !== queueId);
  available.chats++;

  activeChats.push({
    id: 'c' + Date.now(),
    client: chat.client,
    initials: chat.initials,
    agentId: available.id,
    topic: chat.topic,
    channel: chat.channel,
    durationMins: 0,
    messages: [
      { role:'client', sender: chat.client, time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false}), text: chat.topic + '.' },
      { role:'agent',  sender: available.name.split(' ')[0] + ' ' + (available.name.split(' ')[1]?.[0] || '') + '.', time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false}), text: `Hi ${chat.client.split(' ')[0]}, I'm ${available.name.split(' ')[0]} and I'll be helping you today. Let me look into this right away.` },
    ]
  });

  renderLiveChats();
}

// ────────────────────────────────────────────────────────
//  SUPERVISE PANEL
// ────────────────────────────────────────────────────────
function openSupervisePanel(chatId) {
  const chat  = activeChats.find(c => c.id === chatId);
  if (!chat) return;
  supervisingChatId = chatId;

  const agent = agents.find(a => a.id === chat.agentId);
  const agentName = agent ? agent.name : 'Unassigned';

  document.getElementById('sv-client-avatar').textContent = chat.initials;
  document.getElementById('sv-client-name').textContent   = chat.client;
  const _t = translations[currentLang];
  document.getElementById('sv-meta').textContent =
    `${_t.lbl_agent_label}: ${agentName} · ${chat.channel} · ${chat.durationMins}m ${_t.lc_ongoing}`;

  renderTranscript(chat);

  document.getElementById('sv-note-input').value = '';
  document.getElementById('supervise-overlay').classList.remove('hidden');

  // Scroll to bottom of transcript
  setTimeout(() => {
    const t = document.getElementById('sv-transcript');
    if (t) t.scrollTop = t.scrollHeight;
    const b = document.querySelector('.supervise-body');
    if (b) b.scrollTop = b.scrollHeight;
  }, 50);
}

function renderTranscript(chat) {
  const transcript = document.getElementById('sv-transcript');
  transcript.innerHTML = chat.messages.map(m => {
    if (m.role === 'manager') {
      return `<div class="msg-row manager">
        <div class="msg-note-wrap">
          <div class="msg-note-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Manager Note · ${escHtml(m.time)}
          </div>
          <div class="msg-note-text">${escHtml(m.text)}</div>
        </div>
      </div>`;
    }
    return `<div class="msg-row ${m.role}">
      <div class="msg-sender">${escHtml(m.sender)} · ${escHtml(m.time)}</div>
      <div class="msg-bubble">${escHtml(m.text)}</div>
    </div>`;
  }).join('');
}

function sendManagerNote() {
  const input = document.getElementById('sv-note-input');
  const text  = input.value.trim();
  if (!text) return;

  const chat = activeChats.find(c => c.id === supervisingChatId);
  if (!chat) return;

  const now = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false});
  chat.messages.push({ role:'manager', sender:'Manager', time: now, text });
  input.value = '';

  renderTranscript(chat);

  setTimeout(() => {
    const b = document.querySelector('.supervise-body');
    if (b) b.scrollTop = b.scrollHeight;
  }, 30);
}

function closeSupervisePanel() {
  document.getElementById('supervise-overlay').classList.add('hidden');
  supervisingChatId = null;
}


// ────────────────────────────────────────────────────────
//  PLATFORM ISSUES DATA
// ────────────────────────────────────────────────────────
const PLATFORM_META = {
  mt4:         { label:'MT4 Platform',  icon:'💻', cls:'mt4'         },
  mt5:         { label:'MT5 Platform',  icon:'🖥️', cls:'mt5'         },
  ctrader:     { label:'cTrader',       icon:'📊', cls:'ctrader'     },
  opotrade:    { label:'OpoTrade',      icon:'💹', cls:'opotrade'    },
  tradingview: { label:'TradingView',   icon:'📈', cls:'tradingview' },
  webterminal: { label:'Web Terminal',  icon:'🌐', cls:'webterminal' },
  socialtrade: { label:'SocialTrade',   icon:'👥', cls:'socialtrade' },
  portal:      { label:'Portal',        icon:'🔗', cls:'portal'      },
  payment:     { label:'Payment',       icon:'💳', cls:'payment'     },
  mobile:      { label:'Mobile App',    icon:'📱', cls:'mobile'      },
  email:       { label:'Email/SMS',     icon:'📧', cls:'email'       },
  // legacy keys kept for existing data
  webtrader:   { label:'WebTrader',     icon:'🌐', cls:'webterminal' },
  web:         { label:'Web Portal',    icon:'🔗', cls:'portal'      },
};

const SEVERITY_ORDER = { critical:0, high:1, medium:2, resolved:3 };

let platformIssues = [
  {
    id:'i1', platform:'mt4', severity:'critical',
    title:'MT4 Order Execution Lag — All Symbols',
    summary:'Trade orders taking 8–25 seconds to execute across all symbols, affecting live trading.',
    reportedAt:'Today, 08:42', reportedBy:'Support Team',
    impact:{ clients:47, tickets:23, downtime:'1h 14m' },
    description:'Since 08:30 this morning, clients on all MT4 servers (Live01, Live02, Live03) are experiencing severe order execution delays ranging from 8 to 25 seconds. This affects market orders, pending orders, and stop-loss triggers. The issue is correlated with elevated tick data volume during the London session open. Clients report orders executing at significantly worse prices than requested.',
    timeline:[
      { time:'08:30', author:'System Alert',    color:'red',    text:'Automated monitoring detected elevated execution times exceeding SLA threshold (>2s) on all MT4 servers.' },
      { time:'08:42', author:'Support Team',    color:'red',    text:'First client reports received. 3 tickets opened. Escalation to tech team initiated.' },
      { time:'08:55', author:'Tech — Ivan R.',  color:'orange', text:'Root cause investigation started. Preliminary findings point to a tick data feed bottleneck on the bridge server.' },
      { time:'09:10', author:'Tech — Ivan R.',  color:'orange', text:'Bridge server restarted. Execution times improved to 4–8s but not yet within SLA. Monitoring continues.' },
      { time:'09:28', author:'Tech — Ivan R.',  color:'yellow', text:'Second bridge node brought online. Load distributed. Execution times now averaging 2–3s. Further optimization in progress.' },
      { time:'09:44', author:'Support Manager', color:'blue',   text:'Client-facing notice published on status page. Agents instructed to proactively reach out to affected clients.' },
    ]
  },
  {
    id:'i2', platform:'webtrader', severity:'high',
    title:'WebTrader 2FA Login Failures',
    summary:'Subset of users unable to complete two-factor authentication via SMS on WebTrader.',
    reportedAt:'Today, 09:05', reportedBy:'Lena Williams',
    impact:{ clients:12, tickets:7, downtime:'Intermittent' },
    description:'Since 09:00, approximately 12 clients have reported being unable to log into WebTrader due to SMS 2FA codes not being delivered or arriving after the 60-second expiry window. The issue is intermittent and appears to affect clients registered with certain mobile carriers (Vodafone UK, O2 UK). Email 2FA is functioning normally as a workaround.',
    timeline:[
      { time:'09:05', author:'Lena W. (Agent)', color:'red',    text:'First client complaint received. Client unable to login for 15 minutes. Ticket #8841 opened.' },
      { time:'09:12', author:'Support Manager', color:'orange', text:'Pattern identified — 4 tickets all referencing SMS 2FA. Escalated to IT security team.' },
      { time:'09:20', author:'IT Security',     color:'orange', text:'Confirmed issue with SMS gateway provider (Twilio) affecting UK carrier routes. Provider notified.' },
      { time:'09:35', author:'Support Manager', color:'blue',   text:'Agents advised to offer email-based 2FA as a workaround. Template response distributed.' },
      { time:'09:50', author:'IT Security',     color:'yellow', text:'Twilio acknowledged the issue and are rerouting UK traffic through a backup carrier. ETA for fix: 30–60 mins.' },
    ]
  },
  {
    id:'i3', platform:'payment', severity:'high',
    title:'Stripe Deposit Gateway Timeouts',
    summary:'Credit/debit card deposits via Stripe timing out intermittently for some clients.',
    reportedAt:'Today, 07:58', reportedBy:'System Alert',
    impact:{ clients:18, tickets:9, downtime:'22m' },
    description:'Between 07:45 and 08:07, the Stripe payment gateway experienced elevated timeout rates (>40%) for deposit transactions. Clients attempting to deposit via Visa/Mastercard received timeout errors, though in most cases funds were not charged. A small number of transactions (~3) resulted in pending charges without account credit, which require manual reconciliation.',
    timeline:[
      { time:'07:45', author:'System Alert',     color:'red',    text:'Payment success rate dropped to 58%. Automated alert triggered.' },
      { time:'07:58', author:'Finance Team',     color:'red',    text:'Stripe dashboard confirmed elevated error rates. Stripe status page updated to "Degraded Performance".' },
      { time:'08:07', author:'Stripe (External)',color:'yellow', text:'Stripe resolved the underlying infrastructure issue. Gateway success rate returned to 99%+.' },
      { time:'08:12', author:'Finance Team',     color:'green',  text:'Confirmed recovery. Manual review of 3 pending transactions initiated for reconciliation.' },
      { time:'08:30', author:'Finance Team',     color:'green',  text:'All 3 pending transactions manually credited. Affected clients notified via email.' },
      { time:'08:35', author:'Support Manager',  color:'grey',   text:'Issue marked resolved. Post-mortem scheduled for end of week.' },
    ]
  },
  {
    id:'i4', platform:'mt4', severity:'medium',
    title:'Incorrect Swap Rates Displayed on MT4',
    summary:'Swap rates shown in MT4 Symbol Properties do not match the published rate sheet for FX majors.',
    reportedAt:'Today, 09:18', reportedBy:'Ahmed L. (Client)',
    impact:{ clients:3, tickets:3, downtime:'N/A' },
    description:'Three clients reported that the overnight swap rates visible in MT4 under View > Symbols > Properties do not match the rates published on the website for EUR/USD, GBP/USD, and USD/JPY. The discrepancy is approximately 5–10% and appears to be a display issue rather than an actual charging error — overnight positions are being charged at the correct published rate according to finance team records.',
    timeline:[
      { time:'09:18', author:'Ahmed L. (Client)', color:'yellow', text:'Client reported swap discrepancy for EUR/USD. Screenshot provided.' },
      { time:'09:25', author:'Support — Nadia P.', color:'blue',  text:'Replicated on internal MT4 instance. Confirmed display inconsistency. Ticket escalated to data team.' },
      { time:'09:40', author:'Data Team',          color:'orange', text:'Root cause identified: swap rate feed from liquidity provider did not sync after Sunday\'s scheduled update. Fix being deployed.' },
      { time:'10:05', author:'Data Team',          color:'yellow', text:'Rate feed sync triggered manually. Verification in progress — rates should update within 15 minutes.' },
    ]
  },
  {
    id:'i5', platform:'mobile', severity:'medium',
    title:'Mobile App Crash on iOS 17.4 — Chart View',
    summary:'App crashes when opening the chart view on devices running iOS 17.4.',
    reportedAt:'Yesterday, 16:30', reportedBy:'Rita Brown',
    impact:{ clients:8, tickets:5, downtime:'Ongoing' },
    description:'Since the iOS 17.4 system update rolled out on Monday, 8 clients have reported that the OpoSupportDesk mobile app crashes immediately when attempting to open the full-screen chart view. The crash does not occur on iOS 17.3 or earlier, or on Android. The crash log points to a rendering conflict in the WebKit chart library used by the app. A workaround (using the condensed chart view) is available.',
    timeline:[
      { time:'Mon 16:30', author:'Rita B. (Agent)',   color:'orange', text:'First crash report received. Client on iPhone 15 Pro running iOS 17.4.' },
      { time:'Mon 17:10', author:'Mobile Dev Team',   color:'orange', text:'Issue reproduced internally on iOS 17.4 simulator. Logged as bug #MOB-2241.' },
      { time:'Mon 18:00', author:'Mobile Dev Team',   color:'yellow', text:'Root cause: WebKit breaking change in iOS 17.4 affecting SVG rendering in WKWebView. Patch in development.' },
      { time:'Tue 09:00', author:'Support Manager',   color:'blue',   text:'Workaround (condensed chart) communicated to all affected clients. App Store update ETA: 2–3 business days.' },
      { time:'Tue 11:30', author:'Mobile Dev Team',   color:'yellow', text:'Patch completed. Submitted to App Store for review. Awaiting Apple approval.' },
    ]
  },
  {
    id:'i6', platform:'email', severity:'medium',
    title:'SMS Trade Confirmation Delays',
    summary:'Outbound SMS notifications for trade confirmations delayed by 5–20 minutes.',
    reportedAt:'Yesterday, 22:15', reportedBy:'System Alert',
    impact:{ clients:34, tickets:6, downtime:'3h 20m' },
    description:'Between 21:40 and 01:00, SMS trade confirmations and account alerts were delayed by 5–20 minutes. This was caused by a rate-limiting issue on the SMS provider\'s (MessageBird) side during a high-volume period. Email notifications were unaffected. No trade execution was impacted — only the confirmation delivery.',
    timeline:[
      { time:'21:40', author:'System Alert',           color:'red',   text:'SMS delivery latency exceeded 5 minutes. Alert triggered.' },
      { time:'22:15', author:'IT Ops',                 color:'red',   text:'MessageBird dashboard confirmed high queue depth. Provider support contacted.' },
      { time:'22:50', author:'MessageBird (External)', color:'orange', text:'Provider identified the issue as a queue processing bottleneck. Working on resolution.' },
      { time:'00:30', author:'MessageBird (External)', color:'yellow', text:'Queue cleared. SMS delivery latency returning to normal (<30s).' },
      { time:'01:00', author:'IT Ops',                 color:'green',  text:'Confirmed full recovery. All queued messages delivered. Monitoring normalised.' },
      { time:'01:05', author:'Support Manager',         color:'grey',  text:'Incident closed. Clients who raised tickets notified. Capacity review with MessageBird scheduled.' },
    ]
  },
  {
    id:'i7', platform:'web', severity:'resolved',
    title:'Client Portal Password Reset Loop',
    summary:'Password reset emails redirecting clients to an expired token page.',
    reportedAt:'2 days ago, 11:30', reportedBy:'Sara Chen',
    impact:{ clients:6, tickets:6, downtime:'47m' },
    description:'For approximately 47 minutes on Tuesday morning, clients who requested a password reset via the Web Portal received an email with a link that immediately returned a "token expired" error. This was caused by a misconfigured token TTL (time-to-live) value that was set to 0 seconds following a routine deployment. The deployment was rolled back and the correct 24-hour TTL was restored.',
    timeline:[
      { time:'11:30', author:'Sara C. (Agent)',  color:'red',   text:'Client unable to reset password. Link showing "invalid token". Ticket #8819 opened.' },
      { time:'11:38', author:'Dev Team',         color:'red',   text:'Confirmed bug — token TTL set to 0 in last deployment config. Rollback initiated.' },
      { time:'11:55', author:'Dev Team',         color:'green', text:'Rollback complete. TTL corrected to 24 hours. New reset emails functioning correctly.' },
      { time:'12:05', author:'Support Manager',  color:'green', text:'All 6 affected clients manually issued new reset links. Issue confirmed resolved.' },
      { time:'12:10', author:'Dev Team',         color:'grey',  text:'Post-mortem: deployment checklist updated to include TTL validation step.' },
    ]
  },
  {
    id:'i8', platform:'webtrader', severity:'resolved',
    title:'WebTrader Chart Data Not Loading',
    summary:'Historical chart data failing to load for all instruments on WebTrader.',
    reportedAt:'3 days ago, 08:10', reportedBy:'System Alert',
    impact:{ clients:31, tickets:11, downtime:'28m' },
    description:'For 28 minutes on Monday morning, the WebTrader platform failed to load historical chart data for all instruments. The live price feed was unaffected, meaning clients could place trades but could not see price history or perform technical analysis. The root cause was a cache invalidation failure in the chart data microservice following a scheduled maintenance window.',
    timeline:[
      { time:'08:10', author:'System Alert',   color:'red',    text:'Chart data service returning 503 errors. Alert sent to on-call engineer.' },
      { time:'08:18', author:'Dev Team',       color:'red',    text:'Identified cache invalidation failure post-maintenance. Service restart attempted.' },
      { time:'08:25', author:'Dev Team',       color:'yellow', text:'First restart unsuccessful — dependency lock preventing full restart. Manual cache flush initiated.' },
      { time:'08:38', author:'Dev Team',       color:'green',  text:'Cache flushed and service restarted successfully. Historical chart data loading normally.' },
      { time:'08:45', author:'Support Manager',color:'grey',   text:'Incident resolved. 11 client tickets updated and closed. Maintenance runbook updated.' },
    ]
  },
];

let currentIssueFilter         = 'all';
let currentIssueAssigneeFilter = '';

// ────────────────────────────────────────────────────────
//  PLATFORM ISSUES RENDER
// ────────────────────────────────────────────────────────
function filterIssues(btn, filter) {
  document.querySelectorAll('#pi-filter-bar .filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentIssueFilter = filter;
  renderIssues(filter);
}

function filterIssuesByAssignee() {
  const sel = document.getElementById('pi-assignee-filter');
  currentIssueAssigneeFilter = sel ? sel.value : '';
  renderIssues(currentIssueFilter);
}

function ensureIssueFields() {
  platformIssues.forEach((i, idx) => {
    if (!i.priority)  i.priority  = (i.severity === 'resolved') ? 'medium' : i.severity;
    if (!i.status)    i.status    = (i.severity === 'resolved') ? 'resolved' : 'inprogress';
    if (!i.createdAt) i.createdAt = platformIssues.length - idx;
  });
}

function issueStatusLabel(s) {
  const t = translations[currentLang];
  return s === 'todo'       ? t.pi_todo
    : s === 'inprogress'    ? t.pi_inprogress
    : s === 'pending'       ? t.pi_pending
    : s === 'postponed'     ? t.pi_postponed
    : s === 'archived'      ? t.pi_archived
    : t.pi_resolved;
}

function translateTimeStr(str) {
  const t = translations[currentLang];
  if (currentLang === 'en') return str;
  return str
    .replace(/\bToday\b/g,     t.day_today      || 'Today')
    .replace(/\bYesterday\b/g, t.period_yesterday || 'Yesterday')
    .replace(/\b(\d+) days ago\b/g, (_, n) => `${n} ${t.pi_days_ago || 'days ago'}`)
    .replace(/\bMon\b/g, t.day_mon || 'Mon')
    .replace(/\bTue\b/g, t.day_tue || 'Tue')
    .replace(/\bWed\b/g, t.day_wed || 'Wed')
    .replace(/\bThu\b/g, t.day_thu || 'Thu')
    .replace(/\bFri\b/g, t.day_fri || 'Fri')
    .replace(/\bSat\b/g, t.day_sat || 'Sat')
    .replace(/\bSun\b/g,       t.day_sun      || 'Sun')
    .replace(/\bMonday\b/g,    t.day_long_mon  || 'Monday')
    .replace(/\bLast week\b/g, t.tkt_last_week || 'Last week');
}

function translateAuthor(str) {
  const t = translations[currentLang];
  if (currentLang === 'en') return str;
  const map = {
    'Support Team':    t.team_support,
    'Support Manager': t.role_label,
    'Mobile Dev Team': t.team_mobile_dev,
    'Data Team':       t.team_data,
    'IT Security':     t.team_it_security,
    'Dev Team':        t.team_dev,
    'Finance Team':    t.team_finance,
    'IT Ops':          t.team_it_ops,
  };
  return map[str] || str;
}

function renderIssues(filter) {
  ensureIssueFields();
  const t = translations[currentLang];

  const myIssues    = platformIssues.filter(i => i.status !== 'archived' && i._assignedToId && i._assignedToId === currentUser.id);
  const nonArchived = platformIssues.filter(i => i.status !== 'archived');
  let filtered = filter === 'all'      ? nonArchived
    : filter === 'mine'     ? myIssues
    : filter === 'archived' ? platformIssues.filter(i => i.status === 'archived')
    : platformIssues.filter(i => i.status === filter);

  // Apply assignee filter on top of status filter
  if (currentIssueAssigneeFilter) {
    const aid = parseInt(currentIssueAssigneeFilter, 10);
    filtered = filtered.filter(i => i._assignedToId === aid);
  }

  // Tab counts
  const statusKeys = ['todo','inprogress','pending','postponed','resolved'];
  document.getElementById('pi-count-all').textContent  = nonArchived.length;
  const mineCountEl = document.getElementById('pi-count-mine');
  if (mineCountEl) mineCountEl.textContent = myIssues.length;
  statusKeys.forEach(k => {
    const el = document.getElementById('pi-count-' + k);
    if (el) el.textContent = platformIssues.filter(i => i.status === k).length;
  });
  const archivedCountEl = document.getElementById('pi-count-archived');
  if (archivedCountEl) archivedCountEl.textContent = platformIssues.filter(i => i.status === 'archived').length;

  const active   = nonArchived.filter(i => i.status !== 'resolved').length;
  const resolved = nonArchived.filter(i => i.status === 'resolved').length;
  const activeLabel = active !== 1 ? t.pi_active_issues : t.pi_active_issue;
  document.getElementById('pi-sub').textContent =
    `${active} ${activeLabel} · ${resolved} ${t.pi_resolved_word}`;

  const navBadge = document.getElementById('nav-issues-badge');
  if (navBadge) navBadge.textContent = active;

  // Stat cards (by status)
  statusKeys.forEach(k => {
    const el = document.getElementById('pi-sc-' + k);
    if (el) el.textContent = platformIssues.filter(i => i.status === k).length;
  });

  // Populate assignee filter dropdown
  populateAssigneeFilterDropdown();

  // Sort: most recently created first
  const sorted = [...filtered].sort((a,b) => (b.createdAt||0) - (a.createdAt||0));

  const grid = document.getElementById('pi-grid');
  if (sorted.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);font-size:15px">${t.pi_no_match}</div>`;
    return;
  }

  const priorityLabelMap = { critical: t.badge_critical, high: t.badge_high, medium: t.badge_medium };

  grid.innerHTML = sorted.map(issue => {
    const pm     = PLATFORM_META[issue.platform] || { label: issue.platform, icon:'🔧', cls:'portal' };
    const last   = issue.timeline[issue.timeline.length - 1];
    const sLabel = issueStatusLabel(issue.status);
    const pLabel = priorityLabelMap[issue.priority||'medium'] || (issue.priority||'medium');
    return `
    <div class="pi-card ${issue.priority||'medium'}">
      <div class="pi-card-header">
        <div class="pi-platform-icon ${pm.cls}" title="${pm.label}">${pm.icon}</div>
        <div class="pi-card-header-info">
          <div class="pi-card-title">${escHtml(issue.title)}</div>
          <div class="pi-card-platform">${pm.label} · ${escHtml(translateTimeStr(issue.reportedAt))}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
          <span class="pi-status-badge ${issue.status}">${sLabel}</span>
          <span class="pi-priority-badge ${issue.priority||'medium'}">${pLabel}</span>
        </div>
      </div>
      <div class="pi-card-body">
        <div class="pi-meta-row">
          <span class="pi-meta-tag">${issue.impact.clients} ${t.pi_clients_affected}</span>
          <span class="pi-meta-tag ${issue.status!=='resolved'?'orange':''}">${issue.impact.tickets} ${t.pi_tickets_word}</span>
          <span class="pi-meta-tag">⏱ ${issue.impact.downtime}</span>
        </div>
        <div class="pi-summary">${escHtml(issue.summary)}</div>
        ${issue.assigneeName ? `<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">👤 ${escHtml(issue.assigneeName)}</div>` : ''}
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.pi_last_update}: ${escHtml(translateTimeStr(last.time))} · ${escHtml(translateAuthor(last.author))}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:auto">
          <button class="btn-details" style="flex:1" onclick="openIssueModal('${issue.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            ${t.pi_more_details}
          </button>
          ${issue._apiId && issue.status !== 'archived' ? `
          <button class="btn-details" style="flex:1;background:#e0f2fe;color:#0369a1;border-color:#bae6fd" onclick="openNewIssueModal(${issue._apiId})">
            ✏ ${t.btn_edit}
          </button>
          <button class="btn-details" style="flex:1;background:#fef3c7;color:#92400e;border-color:#fde68a" onclick="archivePlatformIssue(${issue._apiId},event)">
            📦 ${t.btn_archive}
          </button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function populateAssigneeFilterDropdown() {
  const sel = document.getElementById('pi-assignee-filter');
  if (!sel) return;
  const t = translations[currentLang];
  const current = sel.value;
  // Collect unique assignees from all issues
  const seen = new Map();
  platformIssues.forEach(i => {
    if (i._assignedToId && i.assigneeName) seen.set(i._assignedToId, i.assigneeName);
  });
  sel.innerHTML = `<option value="">${t.pi_assignee_all || 'All users'}</option>`;
  seen.forEach((name, id) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = name;
    sel.appendChild(opt);
  });
  sel.value = current;
}

// ────────────────────────────────────────────────────────
//  ISSUE DETAILS MODAL
// ────────────────────────────────────────────────────────
async function openIssueModal(id) {
  const issue = platformIssues.find(i => i.id === id);
  if (!issue) return;
  currentModalIssueId = id;

  // Fetch comments from API
  if (issue._apiId) {
    try {
      const res  = await fetch(`${API_BASE}/platform_issues/${issue._apiId}/comments`);
      const json = await res.json();
      if (json.success) issue.comments = json.data;
    } catch (e) {
      if (!issue.comments) issue.comments = [];
    }
  } else {
    if (!issue.comments) issue.comments = [];
  }

  const pm = PLATFORM_META[issue.platform];

  // Header
  const iconEl = document.getElementById('id-platform-icon');
  iconEl.textContent  = pm.icon;
  iconEl.className    = `pi-platform-icon ${pm.cls}`;
  document.getElementById('id-title').textContent       = issue.title;
  const _t = translations[currentLang];
  document.getElementById('id-platform-meta').textContent =
    `${pm.label} · ${_t.issue_reported} ${translateTimeStr(issue.reportedAt)} ${_t.pi_by_word} ${translateAuthor(issue.reportedBy)}`;
  const _pLabelMap = { critical: _t.badge_critical, high: _t.badge_high, medium: _t.badge_medium };
  const priorityBadge = document.getElementById('id-priority-badge');
  priorityBadge.className   = `pi-priority-badge ${issue.priority || 'medium'}`;
  priorityBadge.textContent = _pLabelMap[issue.priority || 'medium'] || (issue.priority || 'medium');
  const statusBadge = document.getElementById('id-status-badge');
  statusBadge.className   = `pi-status-badge ${issue.status || 'todo'}`;
  statusBadge.textContent = issueStatusLabel(issue.status || 'todo');

  // Description
  document.getElementById('id-description').textContent = issue.description;

  // Impact
  document.getElementById('id-impact-row').innerHTML = `
    <div class="id-impact-pill"><div class="id-impact-value">${issue.impact.clients}</div><div class="id-impact-label">${_t.pi_clients_affected_label}</div></div>
    <div class="id-impact-pill"><div class="id-impact-value">${issue.impact.tickets}</div><div class="id-impact-label">${_t.pi_tickets_opened}</div></div>
    <div class="id-impact-pill"><div class="id-impact-value">${issue.impact.downtime}</div><div class="id-impact-label">${_t.pi_impact_downtime}</div></div>
    <div class="id-impact-pill"><div class="id-impact-value">${issue.timeline.length}</div><div class="id-impact-label">${_t.pi_impact_updates}</div></div>
  `;

  // Timeline
  document.getElementById('id-timeline').innerHTML = issue.timeline.map(entry => `
    <div class="id-timeline-item">
      <div class="id-tl-dot ${entry.color}"></div>
      <div class="id-tl-content">
        <div class="id-tl-time">${escHtml(translateTimeStr(entry.time))}</div>
        <div class="id-tl-author">${escHtml(translateAuthor(entry.author))}</div>
        <div class="id-tl-text">${escHtml(entry.text)}</div>
      </div>
    </div>
  `).join('');

  // Comments
  renderIssueComments(issue);
  document.getElementById('id-comment-input').value = '';

  document.getElementById('issue-modal-overlay').classList.remove('hidden');
}

let currentModalIssueId = null;

function renderIssueComments(issue) {
  const list = document.getElementById('id-comments-list');
  if (!issue.comments || issue.comments.length === 0) {
    list.innerHTML = `<div class="id-no-comments">${translations[currentLang].pi_no_comments}</div>`;
    return;
  }
  list.innerHTML = issue.comments.map(c => {
    const author   = c.authorName || c.author || 'Unknown';
    const initials = author.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    const date     = c.createdAt
      ? new Date(c.createdAt).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
      : (c.time || '');
    return `
      <div class="id-comment-item">
        <div class="id-comment-meta">
          <div class="id-comment-avatar">${escHtml(initials)}</div>
          <span class="id-comment-author">${escHtml(author)}</span>
          <span class="id-comment-time">${escHtml(date)}</span>
        </div>
        <div class="id-comment-text">${escHtml(c.text)}</div>
      </div>`;
  }).join('');
}

async function addIssueComment() {
  const input = document.getElementById('id-comment-input');
  const text  = input.value.trim();
  if (!text) return;
  const issue = platformIssues.find(i => i.id === currentModalIssueId);
  if (!issue) return;

  if (issue._apiId) {
    try {
      const res  = await fetch(`${API_BASE}/platform_issues/${issue._apiId}/comments`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ authorName: currentUser.name || 'Manager', text }),
      });
      const json = await res.json();
      if (!res.ok) { alert(json.message || 'Could not save comment.'); return; }
      if (!issue.comments) issue.comments = [];
      issue.comments.push(json.data);
      input.value = '';
      renderIssueComments(issue);
    } catch (e) {
      alert('Could not connect to server. Please try again.');
    }
  } else {
    if (!issue.comments) issue.comments = [];
    const now = new Date();
    issue.comments.push({ authorName: currentUser.name || 'Manager', createdAt: now.toISOString(), text });
    input.value = '';
    renderIssueComments(issue);
  }
}

function changeIssuePriority(newPriority) {
  if (!newPriority) return;
  const issue = platformIssues.find(i => i.id === currentModalIssueId);
  if (!issue) return;
  const oldLabel = (issue.priority||'medium').charAt(0).toUpperCase() + (issue.priority||'medium').slice(1);
  issue.priority = newPriority;
  const newLabel = newPriority.charAt(0).toUpperCase() + newPriority.slice(1);

  const now  = new Date();
  const time = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  const text = `Priority changed from "${oldLabel}" to "${newLabel}".`;
  issue.timeline.push({ time, author: currentUser.name || 'Manager', color: 'orange', text });
  document.getElementById('id-timeline').innerHTML += `
    <div class="id-timeline-item">
      <div class="id-tl-dot orange"></div>
      <div class="id-tl-content">
        <div class="id-tl-time">${time}</div>
        <div class="id-tl-author">${escHtml(currentUser.name || 'Manager')}</div>
        <div class="id-tl-text">${escHtml(text)}</div>
      </div>
    </div>`;
  renderIssues(currentIssueFilter);
}

function changeIssueStatus(newStatus) {
  if (!newStatus) return;
  const issue = platformIssues.find(i => i.id === currentModalIssueId);
  if (!issue) return;
  const oldLabel = issueStatusLabel(issue.status);
  issue.status = newStatus;
  const newLabel = issueStatusLabel(newStatus);

  // Add timeline entry
  const now   = new Date();
  const time  = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  const color = newStatus === 'resolved' ? 'green' : newStatus === 'inprogress' ? 'blue' : 'orange';
  const text  = `Status changed from "${oldLabel}" to "${newLabel}".`;
  issue.timeline.push({ time, author: currentUser.name || 'Manager', color, text });
  document.getElementById('id-timeline').innerHTML += `
    <div class="id-timeline-item">
      <div class="id-tl-dot ${color}"></div>
      <div class="id-tl-content">
        <div class="id-tl-time">${time}</div>
        <div class="id-tl-author">${escHtml(currentUser.name || 'Manager')}</div>
        <div class="id-tl-text">${escHtml(text)}</div>
      </div>
    </div>`;

  renderIssues(currentIssueFilter);
}

function closeIssueModal() {
  document.getElementById('issue-modal-overlay').classList.add('hidden');
  currentModalIssueId = null;
}


function piFilterBySeverity(sev) {
  const tab = document.querySelector(`#pi-filter-bar .filter-tab[onclick*="${sev}"]`);
  if (tab) filterIssues(tab, sev);
}

function piFilterByStatus(status) {
  const tab = document.querySelector(`#pi-filter-bar .filter-tab[onclick*="'${status}'"]`);
  if (tab) filterIssues(tab, status);
}

function exportIssuesToExcel() {
  ensureIssueFields();
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

  // ── Summary counts ──────────────────────────────────────
  const statusList   = ['todo','inprogress','pending','postponed','resolved'];
  const statusMeta   = {
    todo:       { label:'To Do',       color:'#94a3b8', bg:'#f1f5f9' },
    inprogress: { label:'In Progress', color:'#1a56db', bg:'#dbeafe' },
    pending:    { label:'Pending',     color:'#b45309', bg:'#fef3c7' },
    postponed:  { label:'Postponed',   color:'#7c3aed', bg:'#f3e8ff' },
    resolved:   { label:'Resolved',    color:'#059669', bg:'#d1fae5' },
  };
  const priorityMeta = {
    critical: { label:'Critical', color:'#dc2626', bg:'#fee2e2' },
    high:     { label:'High',     color:'#ea580c', bg:'#ffedd5' },
    medium:   { label:'Medium',   color:'#b45309', bg:'#fffbeb' },
  };

  const countBy = (key, val) => platformIssues.filter(i => i[key] === val).length;

  const summaryStatusCards = statusList.map(s => {
    const m = statusMeta[s];
    return `<div class="sum-card" style="border-top-color:${m.color}">
      <div class="sum-label">${m.label}</div>
      <div class="sum-val" style="color:${m.color}">${countBy('status', s)}</div>
    </div>`;
  }).join('');

  const priorityBar = ['critical','high','medium'].map(p => {
    const m = priorityMeta[p]; const n = countBy('priority', p);
    return `<div class="pri-row">
      <span class="badge" style="background:${m.bg};color:${m.color};min-width:72px;text-align:center">${m.label}</span>
      <div class="pri-bar-bg"><div class="pri-bar" style="width:${Math.round(n/Math.max(platformIssues.length,1)*100)}%;background:${m.color}"></div></div>
      <span class="pri-count">${n}</span>
    </div>`;
  }).join('');

  // ── Issue rows ──────────────────────────────────────────
  const issueRows = platformIssues.map(issue => {
    const pm      = PLATFORM_META[issue.platform] || { label: issue.platform, icon:'🔧' };
    const sm      = statusMeta[issue.status]   || { label: issue.status,   color:'#64748b', bg:'#f1f5f9' };
    const pm2     = priorityMeta[issue.priority] || { label: issue.priority, color:'#64748b', bg:'#f1f5f9' };
    const lastTl  = issue.timeline[issue.timeline.length - 1];
    const lastCmt = (issue.comments||[]).slice(-1)[0];

    const tlHtml = issue.timeline.map(t =>
      `<div class="tl-row"><span class="tl-time">${escHtml(t.time)}</span><span class="tl-author">${escHtml(t.author)}</span><span class="tl-text">${escHtml(t.text)}</span></div>`
    ).join('');

    const cmtHtml = (issue.comments||[]).length
      ? (issue.comments||[]).map(c =>
          `<div class="tl-row"><span class="tl-time">${escHtml(c.time)}</span><span class="tl-author">${escHtml(c.author)}</span><span class="tl-text">${escHtml(c.text)}</span></div>`
        ).join('')
      : `<span style="color:#94a3b8;font-style:italic">No comments</span>`;

    return `
    <div class="issue-card priority-${issue.priority||'medium'}">
      <div class="issue-header">
        <div class="issue-title-row">
          <span class="issue-platform">${pm.icon} ${escHtml(pm.label)}</span>
          <span class="badge" style="background:${sm.bg};color:${sm.color}">${sm.label}</span>
          <span class="badge" style="background:${pm2.bg};color:${pm2.color}">${pm2.label}</span>
        </div>
        <div class="issue-title">${escHtml(issue.title)}</div>
        <div class="issue-summary">${escHtml(issue.summary||'')}</div>
      </div>
      <div class="issue-body">
        <div class="issue-meta-grid">
          <div class="meta-item"><div class="meta-lbl">Reported By</div><div class="meta-val">${escHtml(issue.reportedBy||'—')}</div></div>
          <div class="meta-item"><div class="meta-lbl">Reported At</div><div class="meta-val">${escHtml(issue.reportedAt||'—')}</div></div>
          <div class="meta-item"><div class="meta-lbl">Clients Affected</div><div class="meta-val impact">${issue.impact.clients}</div></div>
          <div class="meta-item"><div class="meta-lbl">Tickets Linked</div><div class="meta-val impact">${issue.impact.tickets}</div></div>
          <div class="meta-item"><div class="meta-lbl">Downtime</div><div class="meta-val">${escHtml(issue.impact.downtime||'—')}</div></div>
          <div class="meta-item"><div class="meta-lbl">Category</div><div class="meta-val">${escHtml(issue.category||'—')}</div></div>
        </div>
        ${issue.description ? `<div class="issue-desc"><strong>Description:</strong> ${escHtml(issue.description)}</div>` : ''}
        <div class="issue-sections">
          <div class="issue-section">
            <div class="section-lbl">📋 Timeline</div>
            <div class="tl-list">${tlHtml}</div>
          </div>
          ${(issue.comments||[]).length ? `<div class="issue-section">
            <div class="section-lbl">💬 Comments</div>
            <div class="tl-list">${cmtHtml}</div>
          </div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OpoSupportDesk — Platform Issues Report</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Roboto,Arial,sans-serif;background:#f3f4ff;color:#1a1c22;font-size:14px;line-height:1.5}
  .page{max-width:960px;margin:32px auto;padding:0 24px 48px}

  /* ── Header ── */
  .rpt-header{background:linear-gradient(135deg,#1e3a5f 0%,#1a56db 100%);color:#fff;border-radius:16px;padding:32px 36px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
  .rpt-header h1{font-size:22px;font-weight:800;letter-spacing:-.3px}
  .rpt-header .sub{font-size:12px;opacity:.75;margin-top:4px}
  .rpt-header .total{display:inline-block;background:rgba(255,255,255,.2);border-radius:20px;padding:3px 14px;font-size:12px;font-weight:700;margin-top:10px}
  .rpt-header .meta{text-align:right;font-size:12px;opacity:.85;line-height:1.8;flex-shrink:0}
  .rpt-header .meta strong{font-size:13px;display:block;opacity:1}

  /* ── Section cards ── */
  .section{background:#fff;border-radius:14px;box-shadow:0 1px 6px rgba(0,0,0,.07);margin-bottom:20px;overflow:hidden}
  .section-title{padding:14px 22px;border-bottom:1px solid #eef0f6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#64748b}
  .section-body{padding:22px}

  /* ── Summary status cards ── */
  .sum-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:0}
  .sum-card{background:#f8f9ff;border-radius:10px;padding:16px 18px;border-top:3px solid;text-align:center}
  .sum-label{font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
  .sum-val{font-size:28px;font-weight:800;line-height:1}

  /* ── Priority bar ── */
  .pri-rows{display:flex;flex-direction:column;gap:10px}
  .pri-row{display:flex;align-items:center;gap:12px}
  .pri-bar-bg{flex:1;background:#e8eaf0;border-radius:6px;height:10px}
  .pri-bar{border-radius:6px;height:10px}
  .pri-count{font-weight:700;font-size:14px;min-width:24px;text-align:right;color:#1a1c22}

  /* ── Badge ── */
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}

  /* ── Issue cards ── */
  .issue-card{background:#fff;border-radius:12px;box-shadow:0 1px 6px rgba(0,0,0,.07);margin-bottom:16px;overflow:hidden;border-left:4px solid}
  .issue-card.priority-critical{border-left-color:#ef4444}
  .issue-card.priority-high{border-left-color:#f97316}
  .issue-card.priority-medium{border-left-color:#f59e0b}
  .issue-header{padding:18px 20px 14px;border-bottom:1px solid #f1f5f9}
  .issue-title-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
  .issue-platform{font-size:12px;font-weight:600;color:#64748b}
  .issue-title{font-size:15px;font-weight:700;color:#1a1c22;margin-bottom:5px}
  .issue-summary{font-size:13px;color:#475569}
  .issue-body{padding:18px 20px}
  .issue-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px}
  .meta-item{background:#f8f9ff;border-radius:8px;padding:10px 12px}
  .meta-lbl{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
  .meta-val{font-size:14px;font-weight:600;color:#1a1c22}
  .meta-val.impact{font-size:18px;font-weight:800;color:#1a56db}
  .issue-desc{font-size:13px;color:#475569;background:#f8f9ff;border-radius:8px;padding:12px;margin-bottom:14px}
  .issue-sections{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .issue-section{background:#f8f9ff;border-radius:8px;padding:12px 14px}
  .section-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:8px}
  .tl-list{display:flex;flex-direction:column;gap:6px}
  .tl-row{font-size:12px;display:flex;gap:6px;flex-wrap:wrap;align-items:baseline}
  .tl-time{color:#94a3b8;flex-shrink:0;font-size:11px}
  .tl-author{font-weight:600;color:#475569;flex-shrink:0}
  .tl-text{color:#1a1c22}

  /* ── Footer ── */
  .rpt-footer{text-align:center;color:#94a3b8;font-size:11px;padding:28px 0 0;border-top:1px solid #eef0f6;margin-top:8px}

  @media print{
    body{background:#fff}
    .page{margin:0;padding:16px}
    .section,.issue-card{box-shadow:none;border:1px solid #eef0f6;break-inside:avoid}
    .rpt-header{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  }
</style>
</head>
<body>
<div class="page">

  <div class="rpt-header">
    <div>
      <h1>🐛 Platform Issues Report</h1>
      <div class="sub">OpoSupportDesk — Chat Support Manager</div>
      <div class="total">${platformIssues.length} issue${platformIssues.length !== 1 ? 's' : ''} total</div>
    </div>
    <div class="meta">
      <strong>${dateStr}</strong>
      Generated at ${timeStr}<br>
      Exported by ${currentUser?.name || 'Support Manager'}
    </div>
  </div>

  <div class="section">
    <div class="section-title">📊 Summary by Status</div>
    <div class="section-body">
      <div class="sum-grid">${summaryStatusCards}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">⚠️ Priority Breakdown</div>
    <div class="section-body">
      <div class="pri-rows">${priorityBar}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📋 All Issues</div>
    <div class="section-body" style="padding:18px">
      ${issueRows}
    </div>
  </div>

  <div class="rpt-footer">
    Generated by <strong>OpoSupportDesk</strong> &nbsp;·&nbsp; ${dateStr} at ${timeStr} &nbsp;·&nbsp; Data captured at time of export
  </div>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `platform-issues-${now.toISOString().slice(0,10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let _editingIssueApiId = null;

async function openNewIssueModal(apiId) {
  _editingIssueApiId = apiId || null;
  const isNew = !apiId;
  const tl = translations[currentLang];
  const titleEl = document.querySelector('#new-issue-overlay .modal-title');
  if (titleEl) titleEl.textContent = isNew ? tl.modal_new_issue_title : tl.modal_edit_issue_title || 'Edit Issue';
  ['ni-title-err','ni-platform-err','ni-priority-err','ni-summary-err'].forEach(id => hideErr(id));

  document.getElementById('new-issue-overlay').classList.remove('hidden');

  // Populate reporter and assignee dropdowns
  const sel         = document.getElementById('ni-reporter');
  const selAssignee = document.getElementById('ni-assignee');
  const blankOpt    = `<option value="">${tl.lbl_unassigned_opt || '— Select —'}</option>`;
  sel.innerHTML         = blankOpt;
  selAssignee.innerHTML = blankOpt;
  try {
    const res   = await fetch(`${API_BASE}/users/staff`);
    const json  = await res.json();
    if (json.success && Array.isArray(json.data)) {
      json.data.forEach(u => {
        const label = `${u.name} (${u.role})`;
        [sel, selAssignee].forEach(s => {
          const opt = document.createElement('option');
          opt.value = u.id;
          opt.textContent = label;
          s.appendChild(opt);
        });
      });
    }
  } catch (_) { /* non-fatal */ }

  if (isNew) {
    document.getElementById('ni-title').value       = '';
    document.getElementById('ni-platform').value    = '';
    document.getElementById('ni-priority').value    = '';
    document.getElementById('ni-status').value      = 'todo';
    document.getElementById('ni-summary').value     = '';
    document.getElementById('ni-description').value = '';
    if (currentUser.id) sel.value = String(currentUser.id);
  } else {
    const issue = platformIssues.find(i => i._apiId === apiId);
    if (issue) {
      document.getElementById('ni-title').value       = issue.title;
      document.getElementById('ni-platform').value    = issue.platform;
      document.getElementById('ni-priority').value    = issue.priority;
      document.getElementById('ni-status').value      = issue.status;
      document.getElementById('ni-summary').value     = issue.summary;
      document.getElementById('ni-description').value = issue.description || '';
      if (issue._reportedById)  sel.value         = String(issue._reportedById);
      if (issue._assignedToId)  selAssignee.value = String(issue._assignedToId);
    }
  }
}

function closeNewIssueModal() {
  document.getElementById('new-issue-overlay').classList.add('hidden');
}


async function saveNewIssue() {
  const title    = document.getElementById('ni-title').value.trim();
  const platform = document.getElementById('ni-platform').value;
  const uiPriority = document.getElementById('ni-priority').value;
  const uiStatus   = document.getElementById('ni-status').value || 'todo';
  const summary  = document.getElementById('ni-summary').value.trim();
  const desc     = document.getElementById('ni-description').value.trim();
  const reporterVal  = document.getElementById('ni-reporter').value;
  const reportedBy   = reporterVal ? parseInt(reporterVal, 10) : null;
  const assigneeVal  = document.getElementById('ni-assignee').value;
  const assignedTo   = assigneeVal ? parseInt(assigneeVal, 10) : null;
  ['ni-title-err','ni-platform-err','ni-priority-err','ni-summary-err'].forEach(id => hideErr(id));
  if (!title)      { showErr('ni-title-err',    'Please enter a title.');     return; }
  if (!platform)   { showErr('ni-platform-err', 'Please select a platform.'); return; }
  if (!uiPriority) { showErr('ni-priority-err', 'Please select a priority.'); return; }
  if (!summary)    { showErr('ni-summary-err',  'Please enter a summary.');   return; }

  // Map display values to API enums
  const apiPriority = { critical:'urgent', high:'high', medium:'medium', low:'low' }[uiPriority] || uiPriority;
  const apiStatus   = { todo:'investigating', inprogress:'identified', pending:'monitoring', postponed:'monitoring', resolved:'resolved' }[uiStatus] || 'investigating';

  const saveBtn = document.querySelector('#new-issue-overlay .btn-primary');
  if (saveBtn) saveBtn.disabled = true;
  try {
    let res, json;
    const body = { title, platform, priority: apiPriority, status: apiStatus, summary, description: desc || null, reportedBy, assignedTo };
    if (_editingIssueApiId === null) {
      res  = await fetch(`${API_BASE}/platform_issues`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    } else {
      res  = await fetch(`${API_BASE}/platform_issues/${_editingIssueApiId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    }
    json = await res.json();
    if (!res.ok) { showErr('ni-summary-err', json.message || 'Could not save issue.'); return; }
    closeNewIssueModal();
    await loadPlatformIssuesFromAPI();
  } catch (err) {
    showErr('ni-summary-err', 'Could not connect to server. Please try again.');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function loadPlatformIssuesFromAPI() {
  try {
    const res  = await fetch(`${API_BASE}/platform_issues`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const statusMap   = { investigating:'todo', identified:'inprogress', monitoring:'pending', resolved:'resolved', archived:'archived' };
      const priorityMap = { urgent:'critical', high:'high', medium:'medium', low:'medium' };
      platformIssues = json.data.map((i, idx) => ({
        _apiId:      i.id,
        id:          `api-${i.id}`,
        platform:    i.platform,
        title:       i.title,
        summary:     i.summary,
        description: i.description || i.summary,
        priority:    priorityMap[i.priority] || i.priority,
        severity:    priorityMap[i.priority] || i.priority,
        status:      statusMap[i.status]     || i.status,
        reportedAt:  new Date(i.createdAt).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
        reportedBy:    i.reporter?.name || 'Unknown',
        _reportedById: i.reportedBy ?? null,
        assigneeName:  i.assignee?.name || null,
        _assignedToId: i.assignedTo ?? null,
        createdAt:   new Date(i.createdAt).getTime(),
        impact:      { clients: 0, tickets: 0, downtime: 'TBD' },
        timeline:    [{ time: new Date(i.createdAt).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }), author: i.reporter?.name || 'System', color: 'blue', text: i.summary }],
        comments:    []
      }));
    }
  } catch (err) {
    console.error('[loadPlatformIssuesFromAPI]', err);
  }
  renderIssues(currentIssueFilter);
}

async function deletePlatformIssue(apiId, event) {
  if (event) event.stopPropagation();
  if (!confirm('Delete this platform issue? This cannot be undone.')) return;
  try {
    const res  = await fetch(`${API_BASE}/platform_issues/${apiId}`, { method:'DELETE' });
    const json = await res.json();
    if (!res.ok) { alert(json.message || 'Could not delete issue.'); return; }
    await loadPlatformIssuesFromAPI();
  } catch (err) {
    alert('Could not connect to server. Please try again.');
  }
}

function archivePlatformIssue(apiId, event) {
  if (event) event.stopPropagation();
  const tl = translations[currentLang];
  showConfirm(
    tl.confirm_archive_title || 'Archive Issue',
    tl.confirm_archive_issue_sub || 'This issue will be moved to the Archived tab.',
    tl.btn_archive,
    async () => {
      try {
        const res  = await fetch(`${API_BASE}/platform_issues/${apiId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'archived' })
        });
        const json = await res.json();
        if (!res.ok) { alert(json.message || 'Could not archive issue.'); return; }
        await loadPlatformIssuesFromAPI();
      } catch (err) {
        alert('Could not connect to server. Please try again.');
      }
    }
  );
}

// ────────────────────────────────────────────────────────
//  TICKETS DATA
// ────────────────────────────────────────────────────────
let tickets = [
  {
    id:'TK-1001', subject:'MT4 order not executing — EUR/USD',
    client:{ name:'Michael K.', initials:'MK', email:'michael.k@email.com' },
    status:'open', priority:'urgent', agentId:1, channel:'WebTrader',
    createdAt:'Today, 09:14', updatedAt:'5m ago', unread:true,
    messages:[
      { role:'client',   sender:'Michael K.',   time:'09:14', text:'Hi, my EUR/USD market order has been pending for over 10 minutes now. I need it filled immediately or cancelled.' },
      { role:'agent',    sender:'Lena W.',       time:'09:20', text:"Hi Michael, I can see the issue. We're currently experiencing execution delays on MT4. I've escalated this to our tech team. Your order will be processed as soon as possible." },
      { role:'internal', sender:'Lena W.',       time:'09:21', text:'Client is very frustrated. If execution not resolved in 5 mins, escalate to senior trader desk for manual execution.' },
      { role:'client',   sender:'Michael K.',   time:'09:25', text:'This is unacceptable. I am losing money because of this delay. I want a manager.' },
      { role:'agent',    sender:'Lena W.',       time:'09:27', text:"I completely understand your frustration, Michael. I've flagged this to our support manager who will reach out to you shortly." },
    ]
  },
  {
    id:'TK-1002', subject:'Withdrawal of $2,000 rejected without explanation',
    client:{ name:'Ben H.', initials:'BH', email:'ben.h@email.com' },
    status:'open', priority:'high', agentId:2, channel:'Mobile App',
    createdAt:'Today, 09:38', updatedAt:'18m ago', unread:true,
    messages:[
      { role:'client',  sender:'Ben H.',      time:'09:38', text:'My withdrawal request for $2,000 was rejected this morning. No reason was given. This is my own money and I need it now.' },
      { role:'agent',   sender:'James M.',    time:'09:40', text:"Hi Ben, I'm sorry to hear that. Let me pull up your request. One moment." },
      { role:'internal',sender:'James M.',    time:'09:41', text:'Withdrawal flagged by our compliance auto-check — first-time withdrawal over $1,500. Need to confirm client identity docs before approving. Do NOT tell client this triggers a compliance hold without manager approval.' },
      { role:'agent',   sender:'James M.',    time:'09:43', text:'Ben, your withdrawal was flagged for a routine compliance review — standard for first-time large withdrawals. This typically takes 1 business day. I have added a note to expedite your case.' },
      { role:'client',  sender:'Ben H.',      time:'09:50', text:"It's been over an hour. When will this actually be processed?" },
    ]
  },
  {
    id:'TK-1003', subject:'Leverage settings not applying on MT4',
    client:{ name:'Ahmed L.', initials:'AL', email:'ahmed.l@email.com' },
    status:'open', priority:'normal', agentId:null, channel:'MT4 Plugin',
    createdAt:'Today, 09:22', updatedAt:'32m ago', unread:false,
    messages:[
      { role:'client', sender:'Ahmed L.', time:'09:22', text:'I changed my leverage from 1:100 to 1:500 in the portal but MT4 still shows 1:100. Is there a delay?' },
      { role:'agent',  sender:'System Auto-Reply', time:'09:22', text:'Thank you for contacting OpoSupportDesk support. Your ticket has been received and a support agent will respond shortly.' },
    ]
  },
  {
    id:'TK-1004', subject:'Account balance incorrect after overnight swap',
    client:{ name:'Yuki P.', initials:'YP', email:'yuki.p@email.com' },
    status:'open', priority:'urgent', agentId:7, channel:'WebTrader',
    createdAt:'Today, 09:23', updatedAt:'10m ago', unread:true,
    messages:[
      { role:'client',  sender:'Yuki P.',   time:'09:23', text:'My account balance went from $4,820 to $4,650 overnight. I had no open positions. Something is wrong.' },
      { role:'agent',   sender:'Sara C.',   time:'09:30', text:'Hi Yuki, that does sound concerning. Let me review your account statement and swap records right away.' },
      { role:'internal',sender:'Sara C.',   time:'09:31', text:"Client has no open positions per our system but the balance change matches a swap charge on a position that was closed mid-second at rollover. Looks like a timing edge case — flagging to finance team." },
      { role:'agent',   sender:'Sara C.',   time:'09:35', text:"Yuki, I've found a discrepancy in how a rollover charge was applied to a position that closed at exactly midnight. I've escalated this to our finance team for a manual review and potential correction." },
    ]
  },
  {
    id:'TK-1005', subject:'IB commission for last week not credited',
    client:{ name:'Omar F.', initials:'OF', email:'omar.f@email.com' },
    status:'open', priority:'normal', agentId:12, channel:'Web Portal',
    createdAt:'Today, 10:10', updatedAt:'2m ago', unread:false,
    messages:[
      { role:'client', sender:'Omar F.',   time:'10:10', text:'My IB commission of $340 for the week of 31 March to 6 April has not been credited. It should have been processed by Monday.' },
      { role:'agent',  sender:'David K.', time:'10:12', text:"Hi Omar, I can see the calculation for your IB code FD-IB-0042. It's currently pending final approval in the finance queue. I'll follow up with the finance team directly to get an ETA." },
    ]
  },

  {
    id:'TK-1006', subject:'Account verification documents pending 3+ days',
    client:{ name:'Peter W.', initials:'PW', email:'peter.w@email.com' },
    status:'pending', priority:'high', agentId:3, channel:'Web Portal',
    createdAt:'Yesterday, 14:30', updatedAt:'1h ago', unread:false,
    messages:[
      { role:'client',  sender:'Peter W.',  time:'14:30', text:'I uploaded my passport and proof of address 3 days ago. My account is still unverified. I cannot trade.' },
      { role:'agent',   sender:'Nadia P.', time:'14:45', text:'Hi Peter, I can see your documents in our compliance queue. I have flagged your case for priority review. You should hear back within 24 hours.' },
      { role:'internal',sender:'Nadia P.', time:'14:46', text:"Compliance team says they're backed up 48–72 hours due to high volume this week. Told Peter '24 hours' to manage expectations — check with compliance by EOD tomorrow." },
      { role:'client',  sender:'Peter W.',  time:'09:00', text:"It's now been another day. Still no update. What is happening?" },
      { role:'agent',   sender:'Nadia P.', time:'09:15', text:"Peter, I've just spoken with our compliance team. Your documents are next in the review queue and should be processed today. I've marked this ticket as Pending — I'll update you the moment it's done." },
    ]
  },
  {
    id:'TK-1007', subject:'50% deposit bonus not applied to account',
    client:{ name:'Raj P.', initials:'RP', email:'raj.p@email.com' },
    status:'pending', priority:'normal', agentId:5, channel:'Mobile App',
    createdAt:'Yesterday, 18:20', updatedAt:'3h ago', unread:false,
    messages:[
      { role:'client',  sender:'Raj P.',   time:'18:20', text:'I deposited $1,000 to qualify for the 50% welcome bonus but it has not been added to my account.' },
      { role:'agent',   sender:'Rita B.', time:'18:35', text:'Hi Raj! Bonuses are applied manually within 24 hours of the qualifying deposit. I have submitted a request to our promotions team to apply it to your account.' },
      { role:'client',  sender:'Raj P.',   time:'08:00', text:'Still no bonus this morning. The promotion said it would be applied automatically.' },
      { role:'agent',   sender:'Rita B.', time:'08:30', text:"Raj, I sincerely apologise for the delay. I've escalated this directly to our promotions team manager. You're now in their priority queue and the bonus will be applied by midday today." },
    ]
  },
  {
    id:'TK-1008', subject:'Spread on EUR/USD wider than advertised',
    client:{ name:'Lisa T.', initials:'LT', email:'lisa.t@email.com' },
    status:'pending', priority:'normal', agentId:3, channel:'WebTrader',
    createdAt:'Today, 10:20', updatedAt:'45m ago', unread:false,
    messages:[
      { role:'client',  sender:'Lisa T.',   time:'10:20', text:'The spread on EUR/USD is showing 3.2 pips in WebTrader. Your website advertises 0.8 pips. This is very misleading.' },
      { role:'agent',   sender:'Nadia P.', time:'10:28', text:'Hi Lisa, thank you for flagging this. The 0.8 pip spread applies to our Raw account type during standard market conditions. Variable spreads can widen during high-volatility periods such as news events. May I ask which account type you hold?' },
      { role:'client',  sender:'Lisa T.',   time:'10:35', text:'I have a Standard account. But the website does not make this distinction clear at all.' },
      { role:'agent',   sender:'Nadia P.', time:'10:40', text:"You raise a fair point, Lisa. I've noted your feedback and will pass it to our marketing team. I'm also checking whether your current spread is within the expected range for your account type — I'll update you shortly." },
    ]
  },

  {
    id:'TK-1009', subject:'Stop-loss on GBP/USD not triggered — requesting investigation',
    client:{ name:'Anna S.', initials:'AS', email:'anna.s@email.com' },
    status:'hold', priority:'high', agentId:7, channel:'WebTrader',
    createdAt:'Yesterday, 10:05', updatedAt:'2h ago', unread:false,
    messages:[
      { role:'client',  sender:'Anna S.',  time:'10:05', text:'My stop-loss at 1.0820 was never triggered. GBP/USD went to 1.0791. I lost significantly more than my risk limit.' },
      { role:'agent',   sender:'Sara C.', time:'10:15', text:"Hi Anna, that's a very serious concern. I've submitted a tick data review request to our trading desk. This requires a full investigation of the price feed at the time of the event." },
      { role:'internal',sender:'Sara C.', time:'10:16', text:'Trading desk confirmed this happened during a liquidity gap at the London open. Stop-loss was technically executed at 1.0802 — best available price in the gap. Client may not accept this. Need manager review before responding further.' },
      { role:'agent',   sender:'Sara C.', time:'11:00', text:"Anna, I have the preliminary findings from our trading desk. Your stop-loss was triggered but executed at 1.0802 due to a liquidity gap at market open — this is referenced in our order execution policy. I'm putting this ticket on hold while our senior trading team prepares a full written explanation for you." },
    ]
  },
  {
    id:'TK-1010', subject:'iOS 17.4 app crash when opening charts',
    client:{ name:'Helen C.', initials:'HC', email:'helen.c@email.com' },
    status:'hold', priority:'normal', agentId:null, channel:'Mobile App',
    createdAt:'Monday, 16:30', updatedAt:'Yesterday', unread:false,
    messages:[
      { role:'client', sender:'Helen C.',       time:'16:30', text:'Your mobile app crashes every time I try to open the charts section. I am on iPhone 14 Pro with iOS 17.4.' },
      { role:'agent',  sender:'Elena V.',        time:'17:00', text:'Hi Helen, thank you for reporting this. This is a known issue affecting iOS 17.4 users that our development team is actively working on. An App Store update is being submitted this week. In the meantime, you can use the condensed chart view in the portfolio tab as a workaround.' },
    ]
  },

  {
    id:'TK-1011', subject:'Cannot login — password reset link not working',
    client:{ name:'Carlos T.', initials:'CT', email:'carlos.t@email.com' },
    status:'solved', priority:'normal', agentId:1, channel:'Web Portal',
    createdAt:'2 days ago, 11:25', updatedAt:'2 days ago', unread:false,
    messages:[
      { role:'client', sender:'Carlos T.', time:'11:25', text:'The password reset link I received goes to an error page saying "token invalid". I have tried three times.' },
      { role:'agent',  sender:'Lena W.',   time:'11:32', text:'Hi Carlos, we identified a temporary issue with our password reset system that has since been fixed. I am sending you a fresh reset link manually right now.' },
      { role:'agent',  sender:'Lena W.',   time:'11:35', text:'Fresh link sent to your registered email. Please use it within 24 hours. Let me know if you have any issues!' },
      { role:'client', sender:'Carlos T.', time:'11:42', text:'That worked perfectly. Thank you for the quick help!' },
      { role:'agent',  sender:'Lena W.',   time:'11:44', text:"Great to hear, Carlos! I've marked this ticket as solved. Don't hesitate to reach out if you need anything else." },
    ]
  },
  {
    id:'TK-1012', subject:'Deposit of $500 not credited for 3 hours',
    client:{ name:'Diana M.', initials:'DM', email:'diana.m@email.com' },
    status:'solved', priority:'normal', agentId:1, channel:'WebTrader',
    createdAt:'Today, 09:42', updatedAt:'30m ago', unread:false,
    messages:[
      { role:'client', sender:'Diana M.', time:'09:42', text:'I deposited $500 via credit card 3 hours ago. It is still not showing in my account.' },
      { role:'agent',  sender:'Lena W.',  time:'09:48', text:'Hi Diana! I can see the transaction is in our system. There was a delay with our payment processor this morning. I have manually expedited your deposit.' },
      { role:'agent',  sender:'Lena W.',  time:'10:05', text:'Diana, your $500 deposit has now been credited to your account. I also added a $25 goodwill credit for the inconvenience caused.' },
      { role:'client', sender:'Diana M.', time:'10:08', text:'I can see it now. Thank you so much, and the credit is a really nice touch!' },
    ]
  },

  {
    id:'TK-1013', subject:'Complaint about requote frequency on Standard account',
    client:{ name:'John B.', initials:'JB', email:'john.b@email.com' },
    status:'closed', priority:'low', agentId:11, channel:'WebTrader',
    createdAt:'Last week', updatedAt:'Last week', unread:false,
    messages:[
      { role:'client',  sender:'John B.',    time:'—', text:'I keep getting requotes on my Standard account during news events. This happens every single time and it is not acceptable.' },
      { role:'agent',   sender:'Elena V.',   time:'—', text:"Hi John, requotes on Standard accounts can occur during extreme volatility — this is outlined in our execution policy. I'd recommend considering our ECN account which uses a no-requote model." },
      { role:'client',  sender:'John B.',    time:'—', text:'I understand. I will look into the ECN account. Thanks.' },
      { role:'internal',sender:'Elena V.',   time:'—', text:'Client is considering account upgrade. Flagged to sales team for ECN onboarding follow-up.' },
      { role:'agent',   sender:'Elena V.',   time:'—', text:'Glad to help, John! Our team will reach out with information on the ECN account. Closing this ticket — feel free to reopen if you have further questions.' },
    ]
  },
];

let currentTicketStatusFilter = '';
let currentTicketAgentFilter  = '';
let selectedTicketId          = null;
let ticketReplyMode      = 'reply';
let editingTicketApiId   = null;

// ────────────────────────────────────────────────────────
//  TICKETS — RENDER LIST
// ────────────────────────────────────────────────────────
function updateTicketCounts() {
  const statuses = ['open','pending','hold','solved','closed','archived'];
  statuses.forEach(s => {
    const el = document.getElementById(`tkt-count-${s}`);
    if (el) el.textContent = tickets.filter(t => t.status === s).length;
  });
  const openCount = tickets.filter(t => t.status === 'open').length;
  const badge = document.getElementById('nav-tickets-badge');
  if (badge) badge.textContent = openCount;
  const totalBadge = document.getElementById('tkt-total-badge');
  if (totalBadge) totalBadge.textContent = tickets.length;
  // Keep empty-state stats in sync if panel is showing empty state
  [['open','open'],['pending','pending'],['hold','hold'],['resolved','solved'],['closed','closed']].forEach(([id, status]) => {
    const el = document.getElementById('tkt-es-' + id);
    if (el) el.textContent = tickets.filter(t => t.status === status).length;
  });
}

function renderTicketEmptyPanel() {
  const open     = tickets.filter(t => t.status === 'open').length;
  const pending  = tickets.filter(t => t.status === 'pending').length;
  const hold     = tickets.filter(t => t.status === 'hold').length;
  const resolved = tickets.filter(t => t.status === 'solved').length;
  const closed   = tickets.filter(t => t.status === 'closed').length;
  const t = translations[currentLang];
  document.getElementById('tkt-detail-panel').innerHTML = `
    <div class="tkt-empty-state">
      <div class="tkt-empty-visual">
        <div class="tkt-empty-icon-ring">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="32" height="32">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
        </div>
        <div class="tkt-empty-chip tkt-empty-chip--hold"><span class="tkt-empty-chip-dot" style="background:#f97316"></span>${t.tkt_hold}</div>
        <div class="tkt-empty-chip tkt-empty-chip--open"><span class="tkt-empty-chip-dot" style="background:#ef4444"></span>${t.tkt_open}</div>
        <div class="tkt-empty-chip tkt-empty-chip--pending"><span class="tkt-empty-chip-dot" style="background:#f59e0b"></span>${t.tkt_pending}</div>
        <div class="tkt-empty-chip tkt-empty-chip--resolved"><span class="tkt-empty-chip-dot" style="background:#10b981"></span>${t.tkt_solved}</div>
        <div class="tkt-empty-chip tkt-empty-chip--closed"><span class="tkt-empty-chip-dot" style="background:#94a3b8"></span>${t.tkt_closed}</div>
      </div>
      <div class="tkt-empty-title">${t.tkt_empty_title}</div>
      <div class="tkt-empty-desc">${t.tkt_empty_desc}</div>
      <div class="tkt-empty-stats">
        <div class="tkt-empty-stat">
          <span class="tkt-empty-stat-num">${open}</span>
          <span class="tkt-empty-stat-lbl">${t.tkt_open}</span>
        </div>
        <div class="tkt-empty-stat-div"></div>
        <div class="tkt-empty-stat">
          <span class="tkt-empty-stat-num">${pending}</span>
          <span class="tkt-empty-stat-lbl">${t.tkt_pending}</span>
        </div>
        <div class="tkt-empty-stat-div"></div>
        <div class="tkt-empty-stat">
          <span class="tkt-empty-stat-num">${hold}</span>
          <span class="tkt-empty-stat-lbl">${t.tkt_hold}</span>
        </div>
        <div class="tkt-empty-stat-div"></div>
        <div class="tkt-empty-stat">
          <span class="tkt-empty-stat-num">${resolved}</span>
          <span class="tkt-empty-stat-lbl">${t.tkt_solved}</span>
        </div>
        <div class="tkt-empty-stat-div"></div>
        <div class="tkt-empty-stat">
          <span class="tkt-empty-stat-num">${closed}</span>
          <span class="tkt-empty-stat-lbl">${t.tkt_closed}</span>
        </div>
      </div>
    </div>`;
}

function applyTicketFilters() {
  const statusSel = document.getElementById('tkt-filter-status');
  const agentSel  = document.getElementById('tkt-filter-agent');
  currentTicketStatusFilter = statusSel ? statusSel.value : '';
  currentTicketAgentFilter  = agentSel  ? agentSel.value  : '';
  selectedTicketId = null;
  renderTicketList();
  renderTicketEmptyPanel();
}

function populateTicketAgentFilter() {
  const sel = document.getElementById('tkt-filter-agent');
  if (!sel) return;
  const current = sel.value;
  const t = translations[currentLang];
  sel.innerHTML = `<option value="">${t.tkt_filter_all_agents || 'All agents'}</option>
    <option value="unassigned">${t.lbl_unassigned || 'Unassigned'}</option>`;
  agents.filter(a => a.status !== 'archived').forEach(agent => {
    const opt = document.createElement('option');
    opt.value = agent.id;
    opt.textContent = agent.name;
    sel.appendChild(opt);
  });
  sel.value = current;
}

const PRIORITY_LABELS = { urgent:'Urgent', high:'High', medium:'Medium', normal:'Medium', low:'Low' };
const STATUS_DISPLAY  = { open:'Open', pending:'Pending', hold:'On Hold', solved:'Solved', closed:'Closed' };
function getPriorityLabel(p) { const t = translations[currentLang]; return { urgent:t.tkt_priority_urgent, high:t.tkt_priority_high, medium:t.tkt_priority_medium, normal:t.tkt_priority_medium, low:t.tkt_priority_low }[p] || PRIORITY_LABELS[p]; }
function getStatusLabel(s)   { const t = translations[currentLang]; return { open:t.tkt_open, pending:t.tkt_pending, hold:t.tkt_hold, solved:t.tkt_solved, closed:t.tkt_closed, archived:t.tkt_archived }[s] || STATUS_DISPLAY[s]; }

function renderTicketList() {
  updateTicketCounts();
  populateTicketAgentFilter();
  let list = tickets;
  if (currentTicketStatusFilter) list = list.filter(t => t.status === currentTicketStatusFilter);
  if (currentTicketAgentFilter === 'unassigned') list = list.filter(t => !t.agentId || !agents.find(a => a.id === t.agentId));
  else if (currentTicketAgentFilter)             list = list.filter(t => String(t.agentId) === currentTicketAgentFilter);
  const listEl = document.getElementById('tkt-list');

  if (list.length === 0) {
    listEl.innerHTML = `<div class="tkt-list-empty">${translations[currentLang].tkt_no_tickets}</div>`;
    return;
  }

  listEl.innerHTML = list.map(t => {
    const agent = agents.find(a => a.id === t.agentId);
    const tr = translations[currentLang];
    const agentHtml = agent
      ? `<div class="tkt-row-agent" style="background:${agent.color}" title="${agent.name}">${agent.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>`
      : `<span class="tkt-row-unassigned">${tr.lbl_unassigned}</span>`;
    const actionBtns = t._apiId && t.status !== 'archived' ? `
      <div class="tkt-row-actions" style="display:flex;gap:4px;margin-top:6px">
        <button class="btn-edit" style="flex:1;font-size:11px;padding:4px 8px" onclick="openAddTicketModal(${t._apiId});event.stopPropagation()">✏ ${tr.btn_edit}</button>
        <button class="btn-edit" style="flex:1;font-size:11px;padding:4px 8px;background:#fef3c7;color:#92400e;border-color:#fde68a" onclick="archiveTicket(${t._apiId},event)">📦 ${tr.btn_archive}</button>
      </div>` : '';
    return `
    <div class="tkt-row${selectedTicketId===t.id?' active':''}" onclick="selectTicket('${t.id}')">
      ${t.unread ? '<div class="tkt-unread-dot"></div>' : ''}
      <div class="tkt-row-top">
        <span class="tkt-row-id">${t.id}</span>
        <span class="tkt-priority ${t.priority}">${getPriorityLabel(t.priority)}</span>
        <span class="tkt-row-time">${translateTimeStr(t.updatedAt)}</span>
      </div>
      <div class="tkt-row-subject">${escHtml(t.subject)}</div>
      <div class="tkt-row-meta">
        <span class="tkt-row-client">${escHtml(t.client.name)}</span>
        ${agentHtml}
      </div>
      ${actionBtns}
    </div>`;
  }).join('');
}

// ────────────────────────────────────────────────────────
//  TICKETS — API CRUD
// ────────────────────────────────────────────────────────
async function loadTicketsFromAPI() {
  try {
    // Always fetch agents so the filter dropdown is populated regardless of
    // whether the user has visited the Agents page in this session.
    const agentsRes  = await fetch(`${API_BASE}/agents`);
    const agentsJson = await agentsRes.json();
    if (agentsJson.success && Array.isArray(agentsJson.data)) {
      agents = agentsJson.data.map((a, i) => ({
        id: a.id, name: a.name, email: a.email,
        shift: a.shift, status: a.status,
        gender: i % 2 === 0 ? 'female' : 'male',
        chats: 0, maxChats: 5,
        color: COLORS[i % COLORS.length]
      }));
    }
  } catch (err) {
    console.error('[loadTicketsFromAPI:agents]', err);
  }
  try {
    const res  = await fetch(`${API_BASE}/tickets`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const statusMap = { open:'open', in_progress:'pending', resolved:'solved', closed:'closed', archived:'archived' };
      tickets = json.data.map(t => ({
        _apiId:      t.id,
        id:          `TK-${t.id}`,
        subject:     t.subject,
        description: t.description || '',
        client: {
          name:     t.clientEmail.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g, c => c.toUpperCase()),
          initials: t.clientEmail.slice(0, 2).toUpperCase(),
          email:    t.clientEmail
        },
        status:    statusMap[t.status] || t.status,
        priority:  t.priority,
        agentId:   t.assignedTo,
        channel:   'Support',
        createdAt: new Date(t.createdAt).toLocaleString(),
        updatedAt: new Date(t.createdAt).toLocaleString(),
        unread:    false,
        messages:  (t.comments || []).map(c => ({
          role:   c.role,
          sender: c.authorName,
          time:   new Date(c.createdAt).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12: false }),
          text:   c.text,
          _apiId: c.id,
        })),
      }));
    }
  } catch (err) {
    console.error('[loadTicketsFromAPI]', err);
  }
  renderTicketList();
  updateTicketCounts();
}

async function openAddTicketModal(apiId) {
  editingTicketApiId = apiId || null;
  const isNew = !apiId;
  const tl = translations[currentLang];
  document.getElementById('ticket-modal-title').textContent = isNew ? tl.modal_add_ticket_title : tl.modal_edit_ticket_title;
  hideErr('tk-subject-err'); hideErr('tk-client-email-err'); hideErr('tk-description-err');
  const apiErrEl = document.getElementById('tk-api-err');
  if (apiErrEl) apiErrEl.style.display = 'none';

  // Open modal immediately so the user sees it right away
  document.getElementById('ticket-modal-overlay').classList.remove('hidden');

  const subjectEl     = document.getElementById('tk-subject');
  const emailEl       = document.getElementById('tk-client-email');
  const descriptionEl = document.getElementById('tk-description');
  const sel           = document.getElementById('tk-agent');

  let savedAgentId = null;

  if (isNew) {
    subjectEl.value     = '';
    emailEl.value       = '';
    descriptionEl.value = '';
    document.getElementById('tk-status').value   = 'open';
    document.getElementById('tk-priority').value = 'medium';
    subjectEl.disabled = false; emailEl.disabled = false; descriptionEl.disabled = false;
    subjectEl.style.opacity = ''; emailEl.style.opacity = ''; descriptionEl.style.opacity = '';
  } else {
    const ticket = tickets.find(tk => tk._apiId === apiId);
    if (ticket) {
      const statusRevMap = { open:'open', pending:'in_progress', hold:'in_progress', solved:'resolved', closed:'closed' };
      subjectEl.value     = ticket.subject;
      emailEl.value       = ticket.client.email;
      descriptionEl.value = ticket.description || '';
      document.getElementById('tk-status').value   = statusRevMap[ticket.status] || 'open';
      document.getElementById('tk-priority').value = ticket.priority;
      const resolvedAgent = ticket.agentId ? agents.find(a => a.id === ticket.agentId) : null;
      savedAgentId = resolvedAgent ? ticket.agentId : null;
    }
    subjectEl.disabled = true; emailEl.disabled = true;
    subjectEl.style.opacity = '0.6'; emailEl.style.opacity = '0.6';
  }

  // Populate agent dropdown fresh from API
  sel.innerHTML = `<option value="">${tl.lbl_unassigned_opt}</option>`;
  try {
    const res  = await fetch(`${API_BASE}/agents`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      sel.innerHTML = `<option value="">${tl.lbl_unassigned_opt}</option>` +
        json.data
          .filter(a => a.status !== 'offline')
          .map(a => `<option value="${a.id}">${escHtml(a.name)} (${a.status})</option>`)
          .join('') +
        json.data
          .filter(a => a.status === 'offline')
          .map(a => `<option value="${a.id}" style="color:var(--text-muted)">${escHtml(a.name)} (offline)</option>`)
          .join('');
    }
  } catch (err) {
    // Fallback to cached agents array
    sel.innerHTML = `<option value="">${tl.lbl_unassigned_opt}</option>` +
      agents.map(a => `<option value="${a.id}">${escHtml(a.name)}</option>`).join('');
  }
  sel.value = savedAgentId !== null ? String(savedAgentId) : '';

  if (isNew) subjectEl.focus();
}

function closeTicketModal() {
  document.getElementById('ticket-modal-overlay').classList.add('hidden');
}

async function saveTicket() {
  const subject     = document.getElementById('tk-subject').value.trim();
  const clientEmail = document.getElementById('tk-client-email').value.trim();
  const description = document.getElementById('tk-description').value.trim();
  const status      = document.getElementById('tk-status').value;
  const priority    = document.getElementById('tk-priority').value;
  const agentVal    = document.getElementById('tk-agent').value;
  const assignedTo  = agentVal ? parseInt(agentVal, 10) : null;

  const tl = translations[currentLang];
  const isEditMode = editingTicketApiId !== null;
  hideErr('tk-subject-err'); hideErr('tk-client-email-err'); hideErr('tk-description-err');
  if (!isEditMode) {
    if (!subject)                { showErr('tk-subject-err',     tl.err_subject_required);       return; }
    if (!emailValid(clientEmail)){ showErr('tk-client-email-err',tl.err_agent_email);             return; }
    if (!description)            { showErr('tk-description-err', tl.err_description_required || 'Please enter a description.'); return; }
  }

  const apiErrEl = document.getElementById('tk-api-err');
  const saveBtn  = document.querySelector('#ticket-modal-overlay .btn-primary');
  if (saveBtn) saveBtn.disabled = true;
  try {
    let res, json;
    if (!isEditMode) {
      res  = await fetch(`${API_BASE}/tickets`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ subject, clientEmail, description, status, priority, assignedTo }) });
    } else {
      res  = await fetch(`${API_BASE}/tickets/${editingTicketApiId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status, priority, assignedTo }) });
    }
    json = await res.json();
    if (!res.ok) {
      if (apiErrEl) { apiErrEl.textContent = json.message || tl.err_tkt_save; apiErrEl.style.display = 'block'; }
      return;
    }
    closeTicketModal();
    await loadTicketsFromAPI();
  } catch (err) {
    if (apiErrEl) { apiErrEl.textContent = tl.err_server_connect; apiErrEl.style.display = 'block'; }
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

function archiveTicket(apiId, event) {
  if (event) event.stopPropagation();
  const tl = translations[currentLang];
  showConfirm(tl.confirm_archive_title, tl.confirm_archive_sub, tl.btn_archive, async () => {
    try {
      const res  = await fetch(`${API_BASE}/tickets/${apiId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status:'archived' }) });
      const json = await res.json();
      if (!res.ok) { alert(json.message || tl.err_tkt_archive); return; }
      selectedTicketId = null;
      await loadTicketsFromAPI();
      renderTicketEmptyPanel();
    } catch (err) {
      alert(tl.err_server_connect);
    }
  });
}

// ────────────────────────────────────────────────────────
//  CONFIRM POPUP
// ────────────────────────────────────────────────────────
let _confirmCallback = null;

function showConfirm(title, message, confirmLabel, onConfirm) {
  const tl = translations[currentLang];
  document.getElementById('confirm-title').textContent   = title;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-ok-btn').textContent  = confirmLabel;
  document.getElementById('confirm-cancel-btn').textContent = tl.btn_cancel;
  _confirmCallback = onConfirm;
  document.getElementById('confirm-overlay').classList.remove('hidden');
}

function hideConfirm() {
  _confirmCallback = null;
  document.getElementById('confirm-overlay').classList.add('hidden');
}

function _runConfirm() {
  const cb = _confirmCallback;
  hideConfirm();
  if (cb) cb();
}

// ────────────────────────────────────────────────────────
//  TICKETS — DETAIL VIEW
// ────────────────────────────────────────────────────────
function selectTicket(id) {
  selectedTicketId = id;
  const t = tickets.find(tk => tk.id === id);
  if (!t) return;

  // Mark as read
  t.unread = false;

  // Highlight selected row
  document.querySelectorAll('.tkt-row').forEach(r => r.classList.remove('active'));
  const row = document.querySelector(`.tkt-row[onclick="selectTicket('${id}')"]`);
  if (row) row.classList.add('active');

  const agent = agents.find(a => a.id === t.agentId);
  const agentName = agent ? agent.name : translations[currentLang].lbl_unassigned;
  const agentColor = agent ? agent.color : '#94a3b8';
  const agentInitials = agent ? agent.name.split(' ').map(w=>w[0]).join('').slice(0,2) : '?';

  // Build agent options for assign dropdown
  const agentOptions = agents
    .filter(a => a.status !== 'offline')
    .map(a => `<div class="tkt-assign-option" onclick="assignTicket('${id}',${a.id})">
      <div class="tkt-row-agent" style="background:${a.color};width:22px;height:22px;font-size:9px">${a.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
      <span class="status-dot-sm ${a.status}"></span>
      <span>${escHtml(a.name)}</span>
    </div>`).join('');

  document.getElementById('tkt-detail-panel').innerHTML = `
    <!-- Header -->
    <div class="tkt-detail-header">
      <div class="tkt-detail-header-top">
        <div class="tkt-detail-subject">${escHtml(t.subject)}</div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <span class="tkt-priority ${t.priority}">${getPriorityLabel(t.priority)}</span>
          <span class="tkt-status-badge ${t.status}" id="tkt-status-badge-display">${getStatusLabel(t.status)}</span>
        </div>
      </div>
      <div class="tkt-detail-parties">
        <div class="tkt-party">
          <div class="tkt-party-avatar" style="background:#cbd5e1;color:#475569">${escHtml(t.client.initials)}</div>
          <span class="tkt-party-label">${translations[currentLang].lbl_client}:</span>
          <span class="tkt-party-name">${escHtml(t.client.name)}</span>
          <span style="font-size:12px;color:var(--text-muted)">${escHtml(t.client.email)}</span>
        </div>
        <div style="width:1px;height:18px;background:var(--border)"></div>
        <div class="tkt-party">
          <div class="tkt-party-avatar" style="background:${agentColor}">${agentInitials}</div>
          <span class="tkt-party-label">${translations[currentLang].lbl_agent_label}:</span>
          <div class="tkt-assign-btn" onclick="toggleAssignDropdown(event)" id="tkt-assign-btn-wrap">
            <span id="tkt-assigned-name">${escHtml(agentName)}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            <div class="tkt-assign-dropdown hidden" id="tkt-assign-dropdown">
              ${agentOptions}
            </div>
          </div>
        </div>
        <div style="margin-left:auto;font-size:12px;color:var(--text-muted)">${escHtml(t.channel)} · ${escHtml(translateTimeStr(t.createdAt))}</div>
      </div>
    </div>

    <!-- Description -->
    ${t.description ? `
    <div class="tkt-description-block">
      <div class="tkt-description-label"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>${translations[currentLang].lbl_tk_description || 'Description'}</div>
      <div class="tkt-description-text">${escHtml(t.description)}</div>
    </div>` : ''}

    <!-- Conversation -->
    <div class="tkt-conversation" id="tkt-conversation">
      ${renderTicketMessages(t)}
    </div>

    <!-- Reply area -->
    <div class="tkt-reply-area">
      <div class="tkt-reply-mode-toggle">
        <button class="tkt-reply-mode-btn reply active" onclick="setTicketReplyMode(this,'reply')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
          ${translations[currentLang].tkt_reply_to_client}
        </button>
        <button class="tkt-reply-mode-btn internal" onclick="setTicketReplyMode(this,'internal')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          ${translations[currentLang].tkt_internal_note}
        </button>
      </div>
      <textarea class="tkt-reply-textarea" id="tkt-reply-input" rows="3" placeholder="${translations[currentLang].ph_tkt_reply}"></textarea>
      <div class="tkt-reply-actions">
        <div class="tkt-reply-actions-left">
          <select class="tkt-status-select" id="tkt-status-action" onchange="changeTicketStatus('${id}',this.value)">
            <option value="">${translations[currentLang].tkt_change_status}</option>
            <option value="open"   ${t.status==='open'   ?'disabled':''}>${translations[currentLang].tkt_status_open}</option>
            <option value="pending"${t.status==='pending'?'disabled':''}>${translations[currentLang].tkt_status_pending}</option>
            <option value="hold"   ${t.status==='hold'   ?'disabled':''}>${translations[currentLang].tkt_status_hold}</option>
            <option value="solved" ${t.status==='solved' ?'disabled':''}>${translations[currentLang].tkt_status_solved}</option>
            <option value="closed" ${t.status==='closed' ?'disabled':''}>${translations[currentLang].tkt_status_closed}</option>
          </select>
        </div>
        <button class="btn-send-reply reply" id="tkt-send-btn" onclick="sendTicketReply('${id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          ${translations[currentLang].btn_send_reply}
        </button>
      </div>
    </div>`;

  // Scroll conversation to bottom
  setTimeout(() => {
    const conv = document.getElementById('tkt-conversation');
    if (conv) conv.scrollTop = conv.scrollHeight;
  }, 30);
}

function renderTicketMessages(t) {
  return t.messages.map(m => {
    if (m.role === 'internal') {
      return `<div class="tkt-msg-row internal">
        <div class="tkt-internal-wrap">
          <div class="tkt-internal-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            ${translations[currentLang].tkt_internal_note} · ${escHtml(m.sender)} · ${escHtml(m.time)}
          </div>
          <div class="tkt-internal-text">${escHtml(m.text)}</div>
        </div>
      </div>`;
    }
    return `<div class="tkt-msg-row ${m.role}">
      <div class="tkt-msg-sender">${escHtml(m.sender)} · ${escHtml(m.time)}</div>
      <div class="tkt-msg-bubble">${escHtml(m.text)}</div>
    </div>`;
  }).join('');
}

function setTicketReplyMode(btn, mode) {
  ticketReplyMode = mode;
  document.querySelectorAll('.tkt-reply-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const textarea = document.getElementById('tkt-reply-input');
  const sendBtn  = document.getElementById('tkt-send-btn');
  const _t = translations[currentLang];
  if (mode === 'internal') {
    textarea.classList.add('internal');
    textarea.placeholder = _t.ph_tkt_internal;
    sendBtn.className    = 'btn-send-reply internal';
    sendBtn.innerHTML    = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> ${_t.tkt_add_note}`;
  } else {
    textarea.classList.remove('internal');
    textarea.placeholder = _t.ph_tkt_reply;
    sendBtn.className    = 'btn-send-reply reply';
    sendBtn.innerHTML    = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> ${_t.btn_send_reply}`;
  }
}

async function sendTicketReply(id) {
  const input = document.getElementById('tkt-reply-input');
  const text  = input.value.trim();
  if (!text) return;

  const t = tickets.find(tk => tk.id === id);
  if (!t) return;

  const now = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false});
  const agent = agents.find(a => a.id === t.agentId);
  const senderName = ticketReplyMode === 'internal'
    ? (currentUser.name || 'Manager')
    : (agent ? agent.name : 'Support');

  const msg = { role: ticketReplyMode, sender: senderName, time: now, text };
  t.messages.push(msg);
  t.updatedAt = 'Just now';
  input.value = '';

  // Re-render conversation
  const conv = document.getElementById('tkt-conversation');
  if (conv) {
    conv.innerHTML = renderTicketMessages(t);
    setTimeout(() => { conv.scrollTop = conv.scrollHeight; }, 20);
  }

  // Persist to API
  if (t._apiId) {
    try {
      await fetch(`${API_BASE}/tickets/${t._apiId}/comments`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ authorName: senderName, role: ticketReplyMode, text }),
      });
    } catch (_) { /* non-fatal — message already shown locally */ }
  }
}

async function changeTicketStatus(id, newStatus) {
  if (!newStatus) return;
  const t = tickets.find(tk => tk.id === id);
  if (!t) return;
  t.status    = newStatus;
  t.updatedAt = 'Just now';

  // Update badge in detail header
  const badge = document.getElementById('tkt-status-badge-display');
  if (badge) {
    badge.textContent = getStatusLabel(newStatus);
    badge.className   = `tkt-status-badge ${newStatus}`;
  }
  // Reset select
  const sel = document.getElementById('tkt-status-action');
  if (sel) sel.value = '';

  // Re-render list and move ticket to new filter if needed
  renderTicketList();
  updateTicketCounts();

  // Persist to API
  const statusMap = { open:'open', pending:'in_progress', hold:'in_progress', solved:'resolved', closed:'closed', archived:'archived' };
  const apiStatus = statusMap[newStatus] || newStatus;
  if (t._apiId) {
    try {
      await fetch(`${API_BASE}/tickets/${t._apiId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: apiStatus }),
      });
    } catch (_) { /* non-fatal */ }
  }
}

async function assignTicket(ticketId, agentId) {
  const t = tickets.find(tk => tk.id === ticketId);
  if (!t) return;
  t.agentId   = agentId;
  t.updatedAt = 'Just now';

  const agent = agents.find(a => a.id === agentId);
  const nameEl = document.getElementById('tkt-assigned-name');
  if (nameEl) nameEl.textContent = agent ? agent.name : (translations[currentLang]?.lbl_unassigned || 'Unassigned');

  closeAssignDropdown();
  renderTicketList();

  // Persist to API
  if (t._apiId) {
    try {
      await fetch(`${API_BASE}/tickets/${t._apiId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ assignedTo: agentId || null }),
      });
    } catch (_) { /* non-fatal */ }
  }
}

function toggleAssignDropdown(e) {
  e.stopPropagation();
  const dd = document.getElementById('tkt-assign-dropdown');
  if (dd) dd.classList.toggle('hidden');
}

function closeAssignDropdown() {
  const dd = document.getElementById('tkt-assign-dropdown');
  if (dd) dd.classList.add('hidden');
}

// Close assign dropdown and notification dropdown when clicking elsewhere
document.addEventListener('click', () => {
  closeAssignDropdown();
  closeNotifDropdown();
});

// ────────────────────────────────────────────────────────
//  NOTIFICATIONS
// ────────────────────────────────────────────────────────
let notifications = [
  { id:1,  type:'chat',   title:'New chat in queue',           desc:'Michael K. — MT4 order execution issue',          time:'2m ago',     read:false },
  { id:2,  type:'agent',  title:'Agent went offline',          desc:'Tom Okafor (Night Shift) disconnected',           time:'5m ago',     read:false },
  { id:3,  type:'ticket', title:'New ticket received',         desc:'TK-1003 — Leverage settings not applying on MT4', time:'12m ago',    read:false },
  { id:4,  type:'issue',  title:'Platform issue reported',     desc:'MT4 execution delays — Critical severity',        time:'18m ago',    read:true  },
  { id:5,  type:'chat',   title:'Chat queue alert',            desc:'12 clients waiting — queue is critically long',   time:'25m ago',    read:true  },
  { id:6,  type:'perf',   title:'Performance milestone',       desc:'Sara Chen reached 98% CSAT this week',            time:'1h ago',     read:true  },
  { id:7,  type:'ticket', title:'Ticket SLA breach detected',  desc:'TK-1002 — Response time exceeded 2 hours',        time:'1h 20m ago', read:true  },
  { id:8,  type:'agent',  title:'Agent at full capacity',      desc:'Marco Rossi is now at full capacity (5/5 chats)', time:'2h ago',     read:true  },
  { id:9,  type:'issue',  title:'Issue resolved',              desc:'MT5 Web Platform outage — now fully resolved',    time:'3h ago',     read:true  },
  { id:10, type:'chat',   title:'High priority chat assigned', desc:'Carlos T. — Account access flagged urgent',       time:'4h ago',     read:true  },
];

const NOTIF_ICONS = {
  chat:   { emoji:'💬', cls:'chat'   },
  agent:  { emoji:'👤', cls:'agent'  },
  ticket: { emoji:'🎫', cls:'ticket' },
  issue:  { emoji:'⚠️', cls:'issue'  },
  perf:   { emoji:'📊', cls:'perf'   },
};

let prevPage = 'dashboard';

function getUnreadCount() {
  return notifications.filter(n => !n.read).length;
}

function updateNotifDot() {
  const dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = getUnreadCount() > 0 ? '' : 'none';
}

function toggleNotifDropdown(e) {
  e.stopPropagation();
  const dd = document.getElementById('notif-dropdown');
  if (!dd) return;
  const wasHidden = dd.classList.contains('hidden');
  dd.classList.toggle('hidden');
  if (wasHidden) renderNotifDropdown();
}

function closeNotifDropdown() {
  const dd = document.getElementById('notif-dropdown');
  if (dd) dd.classList.add('hidden');
}

function renderNotifDropdown() {
  const recent = notifications.slice(0, 3);
  const unread = getUnreadCount();

  const countEl = document.getElementById('notif-unread-count');
  if (countEl) countEl.textContent = unread > 0 ? unread : '';

  const list = document.getElementById('notif-dd-list');
  if (!list) return;

  list.innerHTML = recent.map(n => {
    const ic = NOTIF_ICONS[n.type] || NOTIF_ICONS.chat;
    return `
    <div class="notif-dd-item ${n.read ? '' : 'unread'}" onclick="markRead(${n.id}); renderNotifDropdown(); event.stopPropagation();">
      <div class="notif-type-icon ${ic.cls}">${ic.emoji}</div>
      <div class="notif-item-body">
        <div class="notif-item-title">${escHtml(n.title)}</div>
        <div class="notif-item-desc">${escHtml(n.desc)}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
        <div class="notif-item-time">${escHtml(n.time)}</div>
        ${!n.read ? '<div class="notif-unread-dot"></div>' : ''}
      </div>
    </div>`;
  }).join('');
}

function markRead(id) {
  const n = notifications.find(n => n.id === id);
  if (n) n.read = true;
  updateNotifDot();
}

function markAllRead() {
  notifications.forEach(n => n.read = true);
  updateNotifDot();
  renderNotifDropdown();
  const pg = document.getElementById('page-notifications');
  if (pg && !pg.classList.contains('hidden')) renderNotifPage();
}

function showNotifPage() {
  closeNotifDropdown();
  const activeNav = document.querySelector('.nav-item.active');
  prevPage = (activeNav && activeNav.dataset.page) ? activeNav.dataset.page : 'dashboard';
  showPage('notifications');
}

function goBack() {
  showPage(prevPage || 'dashboard');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = document.querySelector(`.nav-item[data-page="${prevPage}"]`);
  if (navEl) navEl.classList.add('active');
}

function renderNotifPage() {
  const unread = getUnreadCount();
  const _tn = translations[currentLang];
  const sub = document.getElementById('notif-page-sub');
  if (sub) sub.textContent = unread > 0 ? `${unread} ${_tn.notif_unread_word}` : _tn.notif_all_caught_up;

  const list = document.getElementById('notif-page-list');
  if (!list) return;

  list.innerHTML = notifications.map(n => {
    const ic = NOTIF_ICONS[n.type] || NOTIF_ICONS.chat;
    return `
    <div class="notif-page-item ${n.read ? 'read' : 'unread'}">
      <div class="notif-type-icon ${ic.cls}">${ic.emoji}</div>
      <div class="notif-item-body" style="flex:1;min-width:0">
        <div class="notif-item-title">${escHtml(n.title)}</div>
        <div class="notif-item-desc">${escHtml(n.desc)}</div>
        <span class="notif-item-time">${escHtml(n.time)}</span>
      </div>
      <div class="notif-page-meta">
        ${!n.read
          ? `<button class="notif-mark-read-btn" onclick="markReadOnPage(${n.id})">${_tn.notif_mark_read}</button>`
          : `<span class="notif-read-label">${_tn.notif_read_label}</span>`
        }
      </div>
    </div>`;
  }).join('');
}

function markReadOnPage(id) {
  markRead(id);
  renderNotifPage();
}

// ────────────────────────────────────────────────────────
//  SETTINGS & LANGUAGE
// ────────────────────────────────────────────────────────
let currentLang = (() => {
  const saved = localStorage.getItem('lang');
  return ['en', 'ar', 'fa'].includes(saved) ? saved : 'en';
})();

const translations = {
  en: {
    // Navigation
    nav_overview:'Overview', nav_operations:'Operations',
    nav_dashboard:'Dashboard', nav_livechats:'Live Chats',
    nav_agents:'Agent Management', nav_issues:'Platform Issues',
    nav_tickets:'Tickets', nav_performance:'Performance',
    nav_reports:'Reports', nav_escalations:'Escalations',
    nav_settings:'Settings', role_label:'Support Manager',
    // Page titles
    page_dashboard:'Dashboard', page_livechats:'Live Chats',
    page_agents:'Agent Management', page_issues:'Platform Issues',
    page_tickets:'Tickets', page_reports:'Reports', page_settings:'Settings',
    page_profile:'My Profile', page_notifications:'All Notifications',
    // Settings
    settings_title:'Settings', settings_sub:'Manage your preferences and configurations',
    settings_appearance:'Appearance', settings_appearance_sub:'Choose your preferred color theme',
    theme_light:'Light', theme_dark:'Dark',
    lang_title:'Language & Region', lang_sub:'Select your preferred display language',
    // Notifications settings
    notif_title:'Notification Settings', notif_sub:'Choose which events trigger notifications',
    notif_new_chat:'New chat assigned to an agent', notif_new_chat_desc:'Alert when a queued chat is picked up',
    notif_agent_offline:'Agent goes offline during shift', notif_agent_offline_desc:'Alert when an active agent drops offline',
    notif_platform_issue:'New platform issue reported', notif_platform_issue_desc:'Alert for newly opened platform incidents',
    notif_new_ticket:'New ticket received', notif_new_ticket_desc:'Alert for each new client support ticket',
    notif_queue_alert:'Chat queue exceeds 10 clients', notif_queue_alert_desc:'Alert when waiting queue is critically long',
    notif_perf_drop:'Agent satisfaction drops below 85%', notif_perf_drop_desc:'Alert when CSAT score falls under threshold',
    notif_sla:'Ticket SLA breach detected', notif_sla_desc:'Alert when a ticket exceeds its response SLA',
    // Notification panel/page
    notif_dd_title:'Notifications', notif_mark_all:'Mark all read',
    notif_view_all:'View All Notifications', notif_mark_all_btn:'Mark All as Read',
    // Dashboard
    dash_export:'↓ Export Report', dash_live:'Live',
    dash_customers_online:'Customers Online', dash_ongoing_chats:'Ongoing Chats', dash_logged_agents:'Logged-in Agents',
    stat_active_chats:'Active Chats', stat_agents_online:'Agents Online',
    stat_avg_response:'Avg. First Response', stat_csat:'CSAT Score',
    perf_overview_title:'Performance Overview', perf_updated:'↻ Updated every Monday',
    kpi_total_chats:'Total Chats', kpi_satisfaction:'Satisfaction',
    kpi_response_time:'Response Time', kpi_efficiency:'Efficiency',
    kpi_chat_vol_tip:'Chat volume is growing. Ensure sufficient agent coverage during peak hours.',
    kpi_sat_tip:'CSAT is above target. Maintain response quality and empathy in conversations.',
    kpi_resp_tip:'Response time improved. Keep encouraging quick first replies from agents.',
    kpi_eff_tip:'Efficiency is at a high level. Monitor chat concurrency to avoid agent fatigue.',
    dash_agent_board_title:'Agent Status Board', dash_manage:'Manage',
    tbl_agent:'Agent', tbl_status:'Status', tbl_chats:'Chats', tbl_load:'Load',
    dash_pi_title:'Platform Issues Tracker', dash_pi_sub:'Active incidents & recent resolutions', dash_viewall:'View All',
    // Live Chats
    lc_in_queue:'In Queue', lc_chatting:'Chatting', lc_queue_title:'Queue',
    lc_ongoing:'ongoing', lc_pick_up:'Pick Up', lc_supervise:'Supervise',
    lc_waiting:'waiting', lc_no_queue:'No chats waiting in queue.', lc_no_active:'No active chats right now.',
    // Platform Issues
    pi_export:'↓ Export Excel', pi_new_issue:'+ New Issue', pi_filter_all:'All', pi_filter_mine:'My Issues',
    lbl_pi_assignee_filter:'Assigned To:', pi_assignee_all:'All users',
    lbl_ni_assignee:'Assigned To',
    pi_todo:'To Do', pi_inprogress:'In Progress', pi_pending:'Pending',
    pi_postponed:'Postponed', pi_resolved:'Resolved', pi_archived:'Archived',
    confirm_archive_issue_sub:'This issue will be moved to the Archived tab.',
    pi_active_issue:'active issue', pi_active_issues:'active issues',
    pi_resolved_word:'resolved',
    pi_clients_affected:'clients affected', pi_tickets_word:'tickets',
    pi_last_update:'Last update', pi_more_details:'More Details',
    pi_no_comments:'No comments yet. Be the first to comment.',
    pi_no_match:'No issues match this filter.',
    pi_clients_affected_label:'Clients Affected', pi_tickets_opened:'Tickets Opened',
    pi_impact_downtime:'Downtime', pi_impact_updates:'Updates',
    pi_by_word:'by', pi_days_ago:'days ago',
    team_support:'Support Team', team_mobile_dev:'Mobile Dev Team',
    team_data:'Data Team', team_it_security:'IT Security',
    team_dev:'Dev Team', team_finance:'Finance Team', team_it_ops:'IT Ops',
    // Tickets
    tkt_all_tickets:'All Tickets', tkt_open:'Open', tkt_hold:'On Hold',
    tkt_solved:'Solved', tkt_closed:'Closed',
    tkt_filter_all_statuses:'All statuses', tkt_filter_all_agents:'All agents',
    tkt_empty_title:'No ticket selected',
    tkt_empty_desc:'Choose a ticket from the list on the left to view its full conversation, details, and history.',
    // Reports
    rpt_total_chats_tab:'Total Chats', rpt_satisfaction_tab:'Chat Satisfaction', rpt_agent_perf_tab:'Agent Performance',
    period_today:'Today', period_yesterday:'Yesterday', period_last7:'Last 7 Days',
    period_curMonth:'Current Month', period_lastMonth:'Last Month',
    period_curYear:'Current Year', period_total:'Total',
    rpt_all_agents:'All Agents',
    rpt_annual_title:'Annual Chat Analytics',
    rpt_annual_sub:'Monthly distribution, MoM trends & year-over-year comparison',
    rpt_sat_week_title:'Satisfaction Trend — This Week',
    rpt_sat_month_title:'Satisfaction Trend — Current Month',
    rpt_this_week_title:'Total Chats — This Week',
    tbl_total_chats:'Total Chats', tbl_chat_sat:'Chat Satisfaction',
    tbl_first_resp:'First Response', tbl_efficiency:'Efficiency',
    tbl_avg_chat:'Avg Chat Time', tbl_chat_share:'Chat Share', tbl_monthly_trend:'Monthly Trend',
    rpt_kpi_total_chats:'Total Chats', rpt_avg_per:'Avg /', rpt_peak:'Peak', rpt_share_of_team:'Share of Team',
    rpt_all_agents_delta:'All agents', rpt_vs_prev:'vs prev', rpt_highest:'Highest',
    rpt_monthly_dist:'Monthly Distribution', rpt_mom_trend:'Month-over-Month Trend',
    rpt_yoy_change:'% = YoY change', rpt_legend_2025:'2025', rpt_legend_2026:'2026', rpt_compare_btn:'2025 vs 2026',
    rpt_total_chats_svg:'total chats',
    rpt_positive:'Positive', rpt_negative:'Negative', rpt_no_rating:'No rating',
    rpt_csat_score:'CSAT Score', rpt_positive_ratings:'Positive Ratings', rpt_negative_ratings:'Negative Ratings',
    rpt_nps_score:'NPS Score', rpt_excellent:'↑ Excellent', rpt_good_delta:'↑ Good',
    rpt_happy_clients:'😊 Happy clients', rpt_review_needed:'↑ Review needed', rpt_low_delta:'↓ Low',
    rpt_promoters:'↑ Promoters', rpt_passives:'Passives',
    rpt_trend_chats:'— Chats', rpt_trend_1st_resp:'— 1st Resp', rpt_trend_effic:'— Effic.', rpt_trend_duration:'— Duration',
    // Agent filters / statuses
    agent_filter_all:'All Agents', agent_filter_day:'☀ Day Shift', agent_filter_night:'🌙 Night Shift',
    status_online:'Online', status_busy:'Busy', status_away:'Away', status_offline:'Offline', status_archived:'Archived',
    // Profile
    profile_sub:'Manage your account information and preferences',
    profile_picture:'Profile Picture', profile_personal_info:'Personal Information',
    lbl_display_name:'Display Name', lbl_email_addr:'Email Address',
    btn_save_info:'Save Info',
    profile_work_shift:'Work Shift', shift_day:'Day Shift', shift_night:'Night Shift',
    btn_save_shift:'Save Shift',
    lbl_role:'Role', role_agent:'Agent', role_manager:'Manager', role_admin:'Admin',
    btn_save_role:'Save Role',
    btn_create_user:'Create User', modal_create_user_title:'Create User',
    lbl_full_name:'Full Name', lbl_password:'Password',
    profile_security:'Password & Security',
    lbl_new_pass:'New Password', lbl_confirm_pass:'Confirm Password',
    btn_send_reset:'📧 Send Reset Link', btn_set_password:'Set Password',
    // Notifications page
    btn_back:'Back',
    // Agent modal
    modal_add_agent_title:'Add New Agent', modal_edit_agent_title:'Edit Agent',
    btn_add_agent_modal:'Add Agent', btn_save_changes:'Save Changes',
    // Ticket modal
    modal_add_ticket_title:'Add Ticket', modal_edit_ticket_title:'Edit Ticket',
    lbl_subject:'Subject', ph_tk_subject:'Brief description of the issue',
    lbl_tk_description:'Description', ph_tk_description:'Describe the issue in detail…',
    lbl_client_email:'Client Email',
    lbl_assign_agent:'Assign To Agent',
    lbl_unassigned:'Unassigned', lbl_unassigned_opt:'— Unassigned —',
    btn_save_ticket:'Save Ticket', btn_delete:'Delete',
    btn_archive:'Archive',
    tkt_in_progress:'In Progress', tkt_resolved:'Resolved', tkt_archived:'Archived',
    tkt_priority_medium:'Medium',
    confirm_archive_title:'Archive Ticket',
    confirm_archive_sub:'This ticket will be moved to the Archived tab.',
    err_subject_required:'Subject is required.',
    err_description_required:'Description is required.',
    err_tkt_save:'Could not save ticket.',
    err_tkt_archive:'Could not archive ticket.',
    err_server_connect:'Could not connect to server. Please try again.',
    // Error messages
    err_email_invalid:'Please enter a valid email address (e.g. you@company.com).',
    err_password_invalid:'Password must be 6+ characters with a letter, number, and special character.',
    err_name_required:'Please enter your full name.',
    err_agent_name:'Please enter a name.',
    err_agent_email:'Please enter a valid email address.',
    err_profile_name_short:'Display name must be at least 3 characters.',
    err_profile_email:'Enter a valid email (must include @ and .).',
    err_password_weak:'Min. 6 characters with a letter, number, and special character (e.g. @#$!).',
    err_passwords_mismatch:'Passwords do not match.',
    err_issue_title:'Please enter a title.',
    err_issue_platform:'Please select a platform.',
    err_issue_priority:'Please select a priority.',
    err_issue_summary:'Please enter a summary.',
    // Password strength
    pass_weak:'Weak', pass_fair:'Fair', pass_good:'Good', pass_strong:'Strong',
    // Success / info messages
    msg_saved:'Saved',
    msg_password_updated:'✓ Password updated successfully.',
    msg_reset_sent_prefix:'📧 Reset link sent to',
    no_agents_match:'No agents match this filter.',
    // Add agent button in header
    btn_add_agent:'Add Agent',
    btn_add_ticket:'+ Add',
    // Auth page
    auth_headline:'Command your support team with confidence',
    auth_desc:'Real-time supervision, agent analytics, and ticket management — unified in one powerful dashboard.',
    auth_feat_chat_title:'Live Chat Supervision',
    auth_feat_chat_sub:'Monitor and guide agents in real time',
    auth_feat_analytics_title:'Performance Analytics',
    auth_feat_analytics_sub:'Deep insights into agent efficiency',
    auth_feat_tickets_title:'Ticket Management',
    auth_feat_tickets_sub:'Track and resolve client issues fast',
    auth_stat_agents:'Agents Online',
    auth_stat_satisfaction:'Satisfaction',
    auth_stat_response:'Avg Response',
    auth_login_title:'Welcome back',
    auth_login_sub:'Sign in to your support dashboard',
    auth_lbl_email:'Email address',
    auth_lbl_password:'Password',
    auth_lbl_fullname:'Full name',
    auth_login_btn:'Sign In',
    auth_no_account:"Don't have an account?",
    auth_create_link:'Create one',
    auth_signup_title:'Create account',
    auth_signup_sub:'Join the OpoSupportDesk support team',
    auth_signup_btn:'Create Account',
    auth_have_account:'Already have an account?',
    auth_signin_link:'Sign In',
    // Logout popup
    logout_title:'Sign out?',
    logout_sub:"You'll need to sign back in to access your dashboard.",
    btn_cancel:'Cancel',
    btn_sign_out:'Sign Out',
    // Idle warning
    idle_title:'Session Expiring',
    idle_sub:"You've been inactive. Your session will automatically end in",
    idle_unit:'sec',
    idle_stay:'Stay Logged In',
    idle_logout:'Log Out Now',
    // Dashboard
    dash_greeting:'Good morning',
    dash_chart_7days:'Last 7 Days — Total Chats',
    dash_chart_curmonth:'Current Month — Total Chats',
    // Navigation
    nav_profile:'Profile',
    // Tickets
    tkt_pending:'Pending',
    // Agent modal
    lbl_avatar_style:'Default Avatar Style',
    gender_male:'👨 Male',
    gender_female:'👩 Female',
    lbl_full_name:'Full Name',
    lbl_shift:'Shift',
    btn_close:'Close',
    // Issue detail modal
    lbl_priority:'Priority',
    priority_critical:'🔴 Critical',
    priority_high:'🟠 High',
    priority_medium:'🟡 Medium',
    lbl_comments:'Comments',
    btn_post:'Post',
    lbl_description:'Description',
    lbl_timeline:'Resolution Timeline',
    // New issue modal
    modal_new_issue_title:'Report New Issue', modal_edit_issue_title:'Edit Issue',
    modal_fields_required:'All fields marked * are required',
    lbl_ni_title:'Title *',
    lbl_ni_platform:'Platform *',
    lbl_ni_priority:'Priority *',
    lbl_ni_summary:'Summary *',
    lbl_ni_desc:'Description',
    lbl_ni_reporter:'Reported By',
    btn_submit_issue:'Submit Issue',
    ph_platform_select:'Select platform…',
    ph_priority_select:'Select priority…',
    // Supervise panel
    sv_note_label:'Private note to agent — only you and the agent can see this',
    // Profile avatar buttons
    btn_upload_avatar:'📁 Upload', btn_choose_avatar:'✏️ Choose', btn_remove_avatar:'🗑 Remove',
    // Notifications
    notif_mark_read:'Mark as read', notif_read_label:'✓ Read',
    notif_unread_word:'unread', notif_all_caught_up:'All caught up',
    // Help modal
    help_title:'Quick Help',
    help_pages_title:'Pages',
    help_tips_title:'Tips',
    help_demo_title:'Demo Credentials',
    help_pg_dashboard:'Dashboard', help_pg_dashboard_desc:'Overview of live stats, agent status, and platform issues.',
    help_pg_livechats:'Live Chats', help_pg_livechats_desc:'Supervise active conversations and pick up queued chats.',
    help_pg_agents:'Agents', help_pg_agents_desc:'Manage agents, shifts, and statuses.',
    help_pg_issues:'Platform Issues', help_pg_issues_desc:'Track and resolve technical incidents by platform.',
    help_pg_tickets:'Tickets', help_pg_tickets_desc:'Handle client support tickets with full conversation history.',
    help_pg_reports:'Reports', help_pg_reports_desc:'Analyse chat volumes, satisfaction scores, and agent performance.',
    help_tip_1:'🔍 Use the <strong>search bar</strong> in the header to jump to any page or record instantly.',
    help_tip_2:'🌙 Toggle <strong>Light / Dark</strong> mode with the sun/moon icon in the header or in Settings.',
    help_tip_3:'🌐 Switch language (English / Arabic / Persian) via the globe icon or Settings → Language.',
    help_tip_4:'📤 Export reports or issue data using the <strong>Export</strong> button on Dashboard and Platform Issues.',
    help_tip_5:'⏱️ Your session auto-expires after <strong>10 minutes</strong> of inactivity — a warning appears at 9 min.',
    help_tip_6:'👤 Edit your profile, avatar, and password in the <strong>Profile</strong> page.',
    help_cred_email_label:'Email', help_cred_email_val:'any valid email address',
    help_cred_pass_label:'Password', help_cred_pass_val:'6+ chars · letter · number · special char',
    // Placeholders
    ph_login_password:'Enter your password',
    ph_su_password:'6+ chars, letter, number & symbol',
    ph_profile_name:'Your full name',
    ph_profile_confirm_pass:'Repeat new password',
    ph_ni_title_ph:'Brief description of the issue',
    ph_ni_summary_ph:'One-line summary of the issue',
    ph_ni_desc_ph:'Detailed description, affected clients, steps to reproduce…',
    ph_comment:'Add a comment…',
    ph_sv_note:'Type a coaching note or instruction for the agent…',
    ph_search:'Search anything…',
    // Dashboard — platform issue items
    issue_reported:'Reported', issue_affects:'Affects', issue_clients:'clients',
    issue_investigating:'Investigating', issue_monitoring:'Monitoring',
    issue_team_notified:'Data team notified', issue_provider_issue:'Provider issue',
    badge_critical:'Critical', badge_high:'High', badge_medium:'Medium', badge_resolved:'Resolved',
    // Dashboard — chart day labels
    day_today:'Today', day_sun:'Sun', day_mon:'Mon', day_tue:'Tue',
    day_wed:'Wed', day_thu:'Thu', day_fri:'Fri', day_sat:'Sat',
    // Dashboard — chart week label
    lbl_wk:'Wk',
    // Agent cards & management
    btn_edit_agent:'Edit Agent', btn_restore_agent:'Restore Agent',
    confirm_archive_agent_sub:'This agent will be archived. All their tickets and issues remain intact.',
    lbl_chat_load:'Chat load',
    lbl_agents_word:'agents', lbl_day_word:'day', lbl_night_word:'night',
    lbl_chats_word:'chats', lbl_per_day:'per day',
    // Ticket detail
    lbl_client:'Client', lbl_agent_label:'Agent',
    tkt_reply_to_client:'Reply to Client', tkt_internal_note:'Internal Note',
    ph_tkt_reply:'Type your reply to the client…',
    ph_tkt_internal:'Write an internal note — not visible to the client…',
    tkt_add_note:'Add Note', tkt_last_week:'Last week', day_long_mon:'Monday',
    tkt_change_status:'Change status…',
    tkt_status_open:'→ Open', tkt_status_pending:'→ Pending',
    tkt_status_hold:'→ On Hold', tkt_status_solved:'→ Solved', tkt_status_closed:'→ Closed',
    btn_send_reply:'Send Reply',
    tkt_priority_urgent:'Urgent', tkt_priority_high:'High', tkt_priority_normal:'Normal', tkt_priority_low:'Low',
    tkt_no_tickets:'No tickets found.',
    // Report chart subs
    lbl_csat_per_day:'CSAT % per day', lbl_csat_per_week:'CSAT % per week',
    // Password hint
    pass_hint:'Min. 6 characters with at least one letter, one number, and one special character (e.g. <code>@&nbsp;&nbsp;#&nbsp;&nbsp;$&nbsp;&nbsp;!&nbsp;&nbsp;%</code>)',
    // Users Management
    label_male:'Male', label_female:'Female',
    nav_users:'User Management', page_users:'User Management',
    users_sub:'All registered users',
    users_filter_all:'All',
    status_approved:'Approved', status_pending:'Pending', status_rejected:'Rejected',
    modal_edit_user_title:'Edit User',
    pending_title:'Awaiting Approval',
    pending_sub:'Your account is pending review by an admin.',
    pending_detail:'Once approved, you will gain access to the dashboard. Please contact your team leader if you need urgent access.',
    rejected_title:'Account Rejected',
    rejected_sub:'Your account has been rejected by an admin.',
    rejected_detail:'If you believe this is a mistake, please contact your team leader or admin for assistance.',
    btn_logout:'Log Out',
    pending_joined:'Joined',
    btn_edit:'Edit',
  },
  ar: {
    nav_overview:'نظرة عامة', nav_operations:'العمليات',
    nav_dashboard:'لوحة التحكم', nav_livechats:'المحادثات المباشرة',
    nav_agents:'إدارة الوكلاء', nav_issues:'مشكلات المنصة',
    nav_tickets:'التذاكر', nav_performance:'الأداء',
    nav_reports:'التقارير', nav_escalations:'التصعيدات',
    nav_settings:'الإعدادات', role_label:'مدير الدعم',
    page_dashboard:'لوحة التحكم', page_livechats:'المحادثات المباشرة',
    page_agents:'إدارة الوكلاء', page_issues:'مشكلات المنصة',
    page_tickets:'التذاكر', page_reports:'التقارير', page_settings:'الإعدادات',
    page_profile:'ملفي الشخصي', page_notifications:'جميع الإشعارات',
    settings_title:'الإعدادات', settings_sub:'إدارة تفضيلاتك وإعداداتك',
    settings_appearance:'المظهر', settings_appearance_sub:'اختر مظهر الألوان المفضل',
    theme_light:'فاتح', theme_dark:'داكن',
    lang_title:'اللغة والمنطقة', lang_sub:'اختر لغة العرض المفضلة لديك',
    notif_title:'إعدادات الإشعارات', notif_sub:'اختر الأحداث التي تُنشئ إشعارات',
    notif_new_chat:'تعيين محادثة جديدة لوكيل', notif_new_chat_desc:'تنبيه عند انتزاع محادثة من القائمة',
    notif_agent_offline:'الوكيل يتوقف عن الاتصال أثناء الوردية', notif_agent_offline_desc:'تنبيه عندما يصبح الوكيل النشط غير متصل',
    notif_platform_issue:'تم الإبلاغ عن مشكلة في المنصة', notif_platform_issue_desc:'تنبيه للحوادث المنصة المفتوحة حديثاً',
    notif_new_ticket:'تم استلام تذكرة جديدة', notif_new_ticket_desc:'تنبيه لكل تذكرة دعم عميل جديدة',
    notif_queue_alert:'قائمة المحادثة تتجاوز 10 عملاء', notif_queue_alert_desc:'تنبيه عندما تكون قائمة الانتظار حرجة',
    notif_perf_drop:'رضا الوكيل ينخفض عن 85%', notif_perf_drop_desc:'تنبيه عندما تنخفض درجة CSAT عن الحد الأدنى',
    notif_sla:'تم رصد خرق مستوى الخدمة', notif_sla_desc:'تنبيه عندما تتجاوز تذكرة وقت استجابة SLA',
    notif_dd_title:'الإشعارات', notif_mark_all:'تحديد الكل كمقروء',
    notif_view_all:'عرض جميع الإشعارات', notif_mark_all_btn:'تحديد الكل كمقروء',
    dash_export:'↓ تصدير التقرير', dash_live:'مباشر',
    dash_customers_online:'العملاء المتصلون', dash_ongoing_chats:'المحادثات الجارية', dash_logged_agents:'الوكلاء المسجلون',
    stat_active_chats:'المحادثات النشطة', stat_agents_online:'الوكلاء المتصلون',
    stat_avg_response:'متوسط وقت الرد الأول', stat_csat:'درجة رضا العملاء',
    perf_overview_title:'نظرة عامة على الأداء', perf_updated:'↻ يُحدَّث كل اثنين',
    kpi_total_chats:'إجمالي المحادثات', kpi_satisfaction:'الرضا',
    kpi_response_time:'وقت الاستجابة', kpi_efficiency:'الكفاءة',
    kpi_chat_vol_tip:'حجم المحادثات آخذ في التزايد. تأكد من توفر تغطية وكلاء كافية خلال ساعات الذروة.',
    kpi_sat_tip:'معدل رضا العملاء فوق الهدف. حافظ على جودة الردود والتعاطف في المحادثات.',
    kpi_resp_tip:'تحسّن وقت الاستجابة. واصل تشجيع الردود الأولى السريعة من الوكلاء.',
    kpi_eff_tip:'الكفاءة عالية. راقب التزامن في المحادثات لتجنب إجهاد الوكلاء.',
    dash_agent_board_title:'لوحة حالة الوكلاء', dash_manage:'إدارة',
    tbl_agent:'الوكيل', tbl_status:'الحالة', tbl_chats:'محادثات', tbl_load:'الحمل',
    dash_pi_title:'متتبع مشكلات المنصة', dash_pi_sub:'الحوادث النشطة والحلول الأخيرة', dash_viewall:'عرض الكل',
    lc_in_queue:'في قائمة الانتظار', lc_chatting:'محادثة', lc_queue_title:'قائمة الانتظار',
    lc_ongoing:'جارية', lc_pick_up:'استلام', lc_supervise:'إشراف',
    lc_waiting:'انتظار', lc_no_queue:'لا توجد محادثات في قائمة الانتظار.', lc_no_active:'لا توجد محادثات نشطة الآن.',
    pi_export:'↓ تصدير إلى Excel', pi_new_issue:'+ مشكلة جديدة', pi_filter_all:'الكل', pi_filter_mine:'مشكلاتي',
    lbl_pi_assignee_filter:'مُعيَّن إلى:', pi_assignee_all:'جميع المستخدمين',
    lbl_ni_assignee:'تعيين إلى',
    pi_todo:'قيد التنفيذ', pi_inprogress:'قيد المعالجة', pi_pending:'معلق',
    pi_postponed:'مؤجل', pi_resolved:'تم الحل', pi_archived:'مؤرشف',
    confirm_archive_issue_sub:'سيتم نقل هذه المشكلة إلى تبويب الأرشيف.',
    pi_active_issue:'مشكلة نشطة', pi_active_issues:'مشكلات نشطة',
    pi_resolved_word:'محلولة',
    pi_clients_affected:'عميل متأثر', pi_tickets_word:'تذاكر',
    pi_last_update:'آخر تحديث', pi_more_details:'مزيد من التفاصيل',
    pi_no_comments:'لا توجد تعليقات بعد. كن أول من يعلق.',
    pi_no_match:'لا توجد مشكلات تطابق هذا المرشح.',
    pi_clients_affected_label:'العملاء المتأثرون', pi_tickets_opened:'تذاكر مفتوحة',
    pi_impact_downtime:'وقت التوقف', pi_impact_updates:'تحديثات',
    pi_by_word:'بواسطة', pi_days_ago:'أيام مضت',
    team_support:'فريق الدعم', team_mobile_dev:'فريق تطوير الجوال',
    team_data:'فريق البيانات', team_it_security:'أمن تقنية المعلومات',
    team_dev:'فريق التطوير', team_finance:'فريق المالية', team_it_ops:'عمليات IT',
    tkt_all_tickets:'جميع التذاكر', tkt_open:'مفتوح', tkt_hold:'قيد الانتظار',
    tkt_solved:'تم الحل', tkt_closed:'مغلق',
    tkt_filter_all_statuses:'كل الحالات', tkt_filter_all_agents:'كل العوامل',
    tkt_empty_title:'لم يتم اختيار تذكرة',
    tkt_empty_desc:'اختر تذكرة من القائمة على اليسار لعرض محادثتها الكاملة وتفاصيلها وتاريخها.',
    rpt_total_chats_tab:'إجمالي المحادثات', rpt_satisfaction_tab:'رضا المحادثة', rpt_agent_perf_tab:'أداء الوكيل',
    period_today:'اليوم', period_yesterday:'أمس', period_last7:'آخر 7 أيام',
    period_curMonth:'الشهر الحالي', period_lastMonth:'الشهر الماضي',
    period_curYear:'السنة الحالية', period_total:'الإجمالي',
    rpt_all_agents:'جميع الوكلاء',
    rpt_annual_title:'تحليلات المحادثات السنوية',
    rpt_annual_sub:'التوزيع الشهري واتجاهات MoM ومقارنة سنة بأخرى',
    rpt_sat_week_title:'اتجاه الرضا — هذا الأسبوع',
    rpt_sat_month_title:'اتجاه الرضا — الشهر الحالي',
    rpt_this_week_title:'إجمالي المحادثات — هذا الأسبوع',
    tbl_total_chats:'إجمالي المحادثات', tbl_chat_sat:'رضا المحادثة',
    tbl_first_resp:'أول رد', tbl_efficiency:'الكفاءة',
    tbl_avg_chat:'متوسط وقت المحادثة', tbl_chat_share:'حصة المحادثة', tbl_monthly_trend:'الاتجاه الشهري',
    rpt_kpi_total_chats:'إجمالي المحادثات', rpt_avg_per:'متوسط /', rpt_peak:'ذروة', rpt_share_of_team:'حصة الفريق',
    rpt_all_agents_delta:'جميع الوكلاء', rpt_vs_prev:'مقابل السابق', rpt_highest:'الأعلى',
    rpt_monthly_dist:'التوزيع الشهري', rpt_mom_trend:'اتجاه شهر على شهر',
    rpt_yoy_change:'% = تغيير سنوي', rpt_legend_2025:'2025', rpt_legend_2026:'2026', rpt_compare_btn:'2026 مقابل 2025',
    rpt_total_chats_svg:'إجمالي المحادثات',
    rpt_positive:'إيجابي', rpt_negative:'سلبي', rpt_no_rating:'بدون تقييم',
    rpt_csat_score:'درجة رضا العملاء', rpt_positive_ratings:'التقييمات الإيجابية', rpt_negative_ratings:'التقييمات السلبية',
    rpt_nps_score:'درجة NPS', rpt_excellent:'↑ ممتاز', rpt_good_delta:'↑ جيد',
    rpt_happy_clients:'😊 عملاء سعداء', rpt_review_needed:'↑ يحتاج مراجعة', rpt_low_delta:'↓ منخفض',
    rpt_promoters:'↑ المروجون', rpt_passives:'المحايدون',
    rpt_trend_chats:'— محادثات', rpt_trend_1st_resp:'— الرد الأول', rpt_trend_effic:'— الكفاءة', rpt_trend_duration:'— المدة',
    agent_filter_all:'جميع الوكلاء', agent_filter_day:'☀ وردية النهار', agent_filter_night:'🌙 وردية الليل',
    status_online:'متصل', status_busy:'مشغول', status_away:'بعيد', status_offline:'غير متصل', status_archived:'مؤرشف',
    profile_sub:'إدارة معلومات حسابك وتفضيلاتك',
    profile_picture:'صورة الملف الشخصي', profile_personal_info:'المعلومات الشخصية',
    lbl_display_name:'اسم العرض', lbl_email_addr:'عنوان البريد الإلكتروني',
    btn_save_info:'حفظ المعلومات',
    profile_work_shift:'وردية العمل', shift_day:'وردية النهار', shift_night:'وردية الليل',
    btn_save_shift:'حفظ الوردية',
    lbl_role:'الدور', role_agent:'وكيل', role_manager:'مدير', role_admin:'مشرف',
    btn_save_role:'حفظ الدور',
    btn_create_user:'إنشاء مستخدم', modal_create_user_title:'إنشاء مستخدم',
    lbl_full_name:'الاسم الكامل', lbl_password:'كلمة المرور',
    profile_security:'كلمة المرور والأمان',
    lbl_new_pass:'كلمة المرور الجديدة', lbl_confirm_pass:'تأكيد كلمة المرور',
    btn_send_reset:'📧 إرسال رابط إعادة التعيين', btn_set_password:'تعيين كلمة المرور',
    btn_back:'رجوع',
    modal_add_agent_title:'إضافة وكيل جديد', modal_edit_agent_title:'تعديل الوكيل',
    btn_add_agent_modal:'إضافة وكيل', btn_save_changes:'حفظ التغييرات',
    // Ticket modal
    modal_add_ticket_title:'إضافة تذكرة', modal_edit_ticket_title:'تعديل التذكرة',
    lbl_subject:'الموضوع', ph_tk_subject:'وصف موجز للمشكلة',
    lbl_tk_description:'الوصف', ph_tk_description:'صف المشكلة بالتفصيل…',
    lbl_client_email:'البريد الإلكتروني للعميل',
    lbl_assign_agent:'تعيين إلى وكيل',
    lbl_unassigned:'غير معيّن', lbl_unassigned_opt:'— غير معيّن —',
    btn_save_ticket:'حفظ التذكرة', btn_delete:'حذف',
    btn_archive:'أرشفة',
    tkt_in_progress:'قيد التنفيذ', tkt_resolved:'تم الحل', tkt_archived:'مؤرشف',
    tkt_priority_medium:'متوسط',
    confirm_archive_title:'أرشفة التذكرة',
    confirm_archive_sub:'سيتم نقل هذه التذكرة إلى تبويب الأرشيف.',
    err_subject_required:'الموضوع مطلوب.',
    err_description_required:'الوصف مطلوب.',
    err_tkt_save:'تعذر حفظ التذكرة.',
    err_tkt_archive:'تعذر أرشفة التذكرة.',
    err_server_connect:'تعذر الاتصال بالخادم. يُرجى المحاولة مرة أخرى.',
    err_email_invalid:'يرجى إدخال عنوان بريد إلكتروني صالح.',
    err_password_invalid:'يجب أن تتكون كلمة المرور من 6 أحرف أو أكثر مع حرف ورقم ورمز خاص.',
    err_name_required:'يرجى إدخال اسمك الكامل.',
    err_agent_name:'يرجى إدخال اسم.',
    err_agent_email:'يرجى إدخال عنوان بريد إلكتروني صالح.',
    err_profile_name_short:'يجب أن يتكون اسم العرض من 3 أحرف على الأقل.',
    err_profile_email:'أدخل بريدًا إلكترونيًا صالحًا (يجب أن يحتوي على @ و.).',
    err_password_weak:'6 أحرف على الأقل مع حرف ورقم ورمز خاص.',
    err_passwords_mismatch:'كلمتا المرور غير متطابقتين.',
    err_issue_title:'يرجى إدخال عنوان.',
    err_issue_platform:'يرجى تحديد منصة.',
    err_issue_priority:'يرجى تحديد أولوية.',
    err_issue_summary:'يرجى إدخال ملخص.',
    pass_weak:'ضعيف', pass_fair:'متوسط', pass_good:'جيد', pass_strong:'قوي',
    msg_saved:'تم الحفظ',
    msg_password_updated:'✓ تم تحديث كلمة المرور بنجاح.',
    msg_reset_sent_prefix:'📧 تم إرسال رابط إعادة التعيين إلى',
    no_agents_match:'لا يوجد وكلاء يطابقون هذا الفلتر.',
    btn_add_agent:'إضافة وكيل',
    btn_add_ticket:'+ إضافة',
    // Auth page
    auth_headline:'أدِر فريق الدعم بثقة واقتدار',
    auth_desc:'إشراف فوري وتحليلات الوكلاء وإدارة التذاكر — كل ذلك في لوحة تحكم واحدة قوية.',
    auth_feat_chat_title:'الإشراف على المحادثات المباشرة',
    auth_feat_chat_sub:'مراقبة وتوجيه الوكلاء في الوقت الفعلي',
    auth_feat_analytics_title:'تحليلات الأداء',
    auth_feat_analytics_sub:'رؤى عميقة حول كفاءة الوكلاء',
    auth_feat_tickets_title:'إدارة التذاكر',
    auth_feat_tickets_sub:'تتبع مشكلات العملاء وحلها بسرعة',
    auth_stat_agents:'الوكلاء المتصلون',
    auth_stat_satisfaction:'الرضا',
    auth_stat_response:'متوسط وقت الرد',
    auth_login_title:'مرحباً بعودتك',
    auth_login_sub:'سجّل دخولك إلى لوحة التحكم',
    auth_lbl_email:'البريد الإلكتروني',
    auth_lbl_password:'كلمة المرور',
    auth_lbl_fullname:'الاسم الكامل',
    auth_login_btn:'تسجيل الدخول',
    auth_no_account:'ليس لديك حساب؟',
    auth_create_link:'أنشئ حساباً',
    auth_signup_title:'إنشاء حساب',
    auth_signup_sub:'انضم إلى فريق دعم OpoSupportDesk',
    auth_signup_btn:'إنشاء حساب',
    auth_have_account:'هل لديك حساب بالفعل؟',
    auth_signin_link:'تسجيل الدخول',
    // Logout popup
    logout_title:'تسجيل الخروج؟',
    logout_sub:'ستحتاج إلى تسجيل الدخول مرة أخرى للوصول إلى لوحة التحكم.',
    btn_cancel:'إلغاء',
    btn_sign_out:'تسجيل الخروج',
    // Idle warning
    idle_title:'انتهاء صلاحية الجلسة',
    idle_sub:'كنت غير نشط. ستنتهي جلستك تلقائياً في',
    idle_unit:'ثانية',
    idle_stay:'البقاء متصلاً',
    idle_logout:'تسجيل الخروج الآن',
    // Dashboard
    dash_greeting:'صباح الخير',
    dash_chart_7days:'آخر 7 أيام — إجمالي المحادثات',
    dash_chart_curmonth:'الشهر الحالي — إجمالي المحادثات',
    // Navigation
    nav_profile:'الملف الشخصي',
    // Tickets
    tkt_pending:'معلق',
    // Agent modal
    lbl_avatar_style:'نمط الصورة الافتراضية',
    gender_male:'👨 ذكر',
    gender_female:'👩 أنثى',
    lbl_full_name:'الاسم الكامل',
    lbl_shift:'الوردية',
    btn_close:'إغلاق',
    // Issue detail modal
    lbl_priority:'الأولوية',
    priority_critical:'🔴 حرجة',
    priority_high:'🟠 عالية',
    priority_medium:'🟡 متوسطة',
    lbl_comments:'التعليقات',
    btn_post:'نشر',
    lbl_description:'الوصف',
    lbl_timeline:'جدول الحل الزمني',
    // New issue modal
    modal_new_issue_title:'الإبلاغ عن مشكلة جديدة', modal_edit_issue_title:'تعديل المشكلة',
    modal_fields_required:'جميع الحقول المميزة بـ * إلزامية',
    lbl_ni_title:'العنوان *',
    lbl_ni_platform:'المنصة *',
    lbl_ni_priority:'الأولوية *',
    lbl_ni_summary:'الملخص *',
    lbl_ni_desc:'الوصف',
    lbl_ni_reporter:'تم الإبلاغ بواسطة',
    btn_submit_issue:'إرسال المشكلة',
    ph_platform_select:'اختر المنصة…',
    ph_priority_select:'اختر الأولوية…',
    // Supervise panel
    sv_note_label:'ملاحظة خاصة للوكيل — لا يمكن لأحد سواك وللوكيل رؤية هذا',
    // Profile avatar buttons
    btn_upload_avatar:'📁 رفع', btn_choose_avatar:'✏️ اختيار', btn_remove_avatar:'🗑 إزالة',
    // Notifications
    notif_mark_read:'تحديد كمقروء', notif_read_label:'✓ مقروء',
    notif_unread_word:'غير مقروء', notif_all_caught_up:'لا توجد إشعارات جديدة',
    // Help modal
    help_title:'مساعدة سريعة',
    help_pages_title:'الصفحات',
    help_tips_title:'نصائح',
    help_demo_title:'بيانات تجريبية',
    help_pg_dashboard:'لوحة التحكم', help_pg_dashboard_desc:'نظرة عامة على الإحصائيات المباشرة وحالة الوكلاء والمشكلات.',
    help_pg_livechats:'المحادثات المباشرة', help_pg_livechats_desc:'الإشراف على المحادثات النشطة والتقاط المحادثات المنتظرة.',
    help_pg_agents:'الوكلاء', help_pg_agents_desc:'إدارة الوكلاء والورديات والحالات.',
    help_pg_issues:'مشكلات المنصة', help_pg_issues_desc:'تتبع الحوادث التقنية وحلها حسب المنصة.',
    help_pg_tickets:'التذاكر', help_pg_tickets_desc:'معالجة تذاكر دعم العملاء مع سجل المحادثة الكامل.',
    help_pg_reports:'التقارير', help_pg_reports_desc:'تحليل أحجام المحادثات ودرجات الرضا وأداء الوكلاء.',
    help_tip_1:'🔍 استخدم <strong>شريط البحث</strong> في الرأس للانتقال إلى أي صفحة أو سجل فوراً.',
    help_tip_2:'🌙 بدّل بين الوضع <strong>الفاتح / الداكن</strong> بأيقونة الشمس/القمر في الرأس أو الإعدادات.',
    help_tip_3:'🌐 غيّر اللغة (الإنجليزية / العربية / الفارسية) عبر أيقونة الكرة الأرضية أو الإعدادات ← اللغة.',
    help_tip_4:'📤 صدّر التقارير أو بيانات المشكلات باستخدام زر <strong>التصدير</strong> في لوحة التحكم والمشكلات.',
    help_tip_5:'⏱️ تنتهي جلستك تلقائياً بعد <strong>10 دقائق</strong> من عدم النشاط — تظهر تحذيرات عند الدقيقة 9.',
    help_tip_6:'👤 عدّل ملفك الشخصي والصورة الرمزية وكلمة المرور في صفحة <strong>الملف الشخصي</strong>.',
    help_cred_email_label:'البريد الإلكتروني', help_cred_email_val:'أي عنوان بريد إلكتروني صالح',
    help_cred_pass_label:'كلمة المرور', help_cred_pass_val:'6 أحرف أو أكثر · حرف · رقم · رمز خاص',
    // Placeholders
    ph_login_password:'أدخل كلمة المرور',
    ph_su_password:'6+ أحرف وحرف ورقم ورمز خاص',
    ph_profile_name:'اسمك الكامل',
    ph_profile_confirm_pass:'كرر كلمة المرور الجديدة',
    ph_ni_title_ph:'وصف موجز للمشكلة',
    ph_ni_summary_ph:'ملخص في سطر واحد للمشكلة',
    ph_ni_desc_ph:'وصف مفصل والعملاء المتأثرون وخطوات التكرار…',
    ph_comment:'أضف تعليقاً…',
    ph_sv_note:'اكتب ملاحظة أو تعليمات للوكيل…',
    ph_search:'ابحث عن أي شيء…',
    // Dashboard — platform issue items
    issue_reported:'تم الإبلاغ', issue_affects:'يؤثر على', issue_clients:'عملاء',
    issue_investigating:'قيد التحقيق', issue_monitoring:'قيد المراقبة',
    issue_team_notified:'تم إخطار فريق البيانات', issue_provider_issue:'مشكلة مزود الخدمة',
    badge_critical:'حرج', badge_high:'عالي', badge_medium:'متوسط', badge_resolved:'تم الحل',
    // Dashboard — chart day labels
    day_today:'اليوم', day_sun:'أحد', day_mon:'إثن', day_tue:'ثلث',
    day_wed:'أرب', day_thu:'خمس', day_fri:'جمع', day_sat:'سبت',
    // Dashboard — chart week label
    lbl_wk:'أسب',
    btn_edit_agent:'تعديل الوكيل', btn_restore_agent:'استعادة الوكيل',
    confirm_archive_agent_sub:'سيتم أرشفة هذا الوكيل. تبقى جميع تذاكره ومشكلاته سليمة.',
    lbl_chat_load:'حمل المحادثات',
    lbl_agents_word:'وكيل', lbl_day_word:'نهار', lbl_night_word:'ليل',
    lbl_chats_word:'محادثات', lbl_per_day:'يومياً',
    lbl_client:'العميل', lbl_agent_label:'الوكيل',
    tkt_reply_to_client:'الرد على العميل', tkt_internal_note:'ملاحظة داخلية',
    ph_tkt_reply:'اكتب ردك على العميل…',
    ph_tkt_internal:'اكتب ملاحظة داخلية — غير مرئية للعميل…',
    tkt_add_note:'إضافة ملاحظة', tkt_last_week:'الأسبوع الماضي', day_long_mon:'الاثنين',
    tkt_change_status:'تغيير الحالة…',
    tkt_status_open:'→ مفتوح', tkt_status_pending:'→ معلق',
    tkt_status_hold:'→ قيد الانتظار', tkt_status_solved:'→ تم الحل', tkt_status_closed:'→ مغلق',
    btn_send_reply:'إرسال الرد',
    tkt_priority_urgent:'عاجل', tkt_priority_high:'عالية', tkt_priority_normal:'عادي', tkt_priority_low:'منخفض',
    tkt_no_tickets:'لا توجد تذاكر.',
    lbl_csat_per_day:'CSAT % يومياً', lbl_csat_per_week:'CSAT % أسبوعياً',
    pass_hint:'الحد الأدنى 6 أحرف مع حرف واحد ورقم واحد ورمز خاص (مثل <code>@&nbsp;&nbsp;#&nbsp;&nbsp;$&nbsp;&nbsp;!&nbsp;&nbsp;%</code>)',
    // Users Management
    label_male:'ذكر', label_female:'أنثى',
    nav_users:'إدارة المستخدمين', page_users:'إدارة المستخدمين',
    users_sub:'جميع المستخدمين المسجلين',
    users_filter_all:'الكل',
    status_approved:'مقبول', status_pending:'قيد الانتظار', status_rejected:'مرفوض',
    modal_edit_user_title:'تعديل المستخدم',
    pending_title:'في انتظار الموافقة',
    pending_sub:'حسابك قيد المراجعة من قِبل المسؤول.',
    pending_detail:'بعد الموافقة، ستتمكن من الوصول إلى لوحة التحكم. تواصل مع قائد فريقك إذا كنت بحاجة إلى وصول عاجل.',
    rejected_title:'تم رفض الحساب',
    rejected_sub:'تم رفض حسابك من قِبل المسؤول.',
    rejected_detail:'إذا كنت تعتقد أن هذا خطأ، يُرجى التواصل مع قائد الفريق أو المسؤول للمساعدة.',
    btn_logout:'تسجيل الخروج',
    pending_joined:'تاريخ الانضمام',
    btn_edit:'تعديل',
  },
  fa: {
    nav_overview:'نمای کلی', nav_operations:'عملیات',
    nav_dashboard:'داشبورد', nav_livechats:'چت‌های زنده',
    nav_agents:'مدیریت عوامل', nav_issues:'مشکلات پلتفرم',
    nav_tickets:'تیکت‌ها', nav_performance:'عملکرد',
    nav_reports:'گزارش‌ها', nav_escalations:'تشدیدها',
    nav_settings:'تنظیمات', role_label:'مدیر پشتیبانی',
    page_dashboard:'داشبورد', page_livechats:'چت‌های زنده',
    page_agents:'مدیریت عوامل', page_issues:'مشکلات پلتفرم',
    page_tickets:'تیکت‌ها', page_reports:'گزارش‌ها', page_settings:'تنظیمات',
    page_profile:'پروفایل من', page_notifications:'همه اعلان‌ها',
    settings_title:'تنظیمات', settings_sub:'مدیریت تنظیمات و ترجیحات شما',
    settings_appearance:'ظاهر', settings_appearance_sub:'تم رنگی مورد نظر را انتخاب کنید',
    theme_light:'روشن', theme_dark:'تیره',
    lang_title:'زبان و منطقه', lang_sub:'زبان نمایش مورد نظر خود را انتخاب کنید',
    notif_title:'تنظیمات اعلان‌ها', notif_sub:'انتخاب رویدادهایی که اعلان ایجاد می‌کنند',
    notif_new_chat:'تخصیص چت جدید به عامل', notif_new_chat_desc:'هشدار هنگام دریافت چت از صف',
    notif_agent_offline:'آفلاین شدن عامل در طول شیفت', notif_agent_offline_desc:'هشدار هنگامی که عامل فعال آفلاین می‌شود',
    notif_platform_issue:'گزارش مشکل جدید در پلتفرم', notif_platform_issue_desc:'هشدار برای حوادث جدید پلتفرم',
    notif_new_ticket:'دریافت تیکت جدید', notif_new_ticket_desc:'هشدار برای هر تیکت پشتیبانی جدید',
    notif_queue_alert:'صف چت بیش از ۱۰ کلاینت', notif_queue_alert_desc:'هشدار هنگامی که صف انتظار بحرانی طولانی است',
    notif_perf_drop:'افت رضایت عامل زیر ۸۵٪', notif_perf_drop_desc:'هشدار هنگامی که امتیاز CSAT زیر حد آستانه می‌افتد',
    notif_sla:'نقض SLA تیکت شناسایی شد', notif_sla_desc:'هشدار هنگامی که تیکت از زمان پاسخ SLA تجاوز می‌کند',
    notif_dd_title:'اعلان‌ها', notif_mark_all:'علامت‌گذاری همه به‌عنوان خوانده‌شده',
    notif_view_all:'مشاهده همه اعلان‌ها', notif_mark_all_btn:'علامت‌گذاری همه به‌عنوان خوانده‌شده',
    dash_export:'↓ خروجی گزارش', dash_live:'زنده',
    dash_customers_online:'مشتریان آنلاین', dash_ongoing_chats:'چت‌های در جریان', dash_logged_agents:'عوامل وارد شده',
    stat_active_chats:'چت‌های فعال', stat_agents_online:'عوامل آنلاین',
    stat_avg_response:'میانگین اولین پاسخ', stat_csat:'امتیاز CSAT',
    perf_overview_title:'نمای کلی عملکرد', perf_updated:'↻ هر دوشنبه به‌روز می‌شود',
    kpi_total_chats:'مجموع چت‌ها', kpi_satisfaction:'رضایت',
    kpi_response_time:'زمان پاسخ', kpi_efficiency:'کارایی',
    kpi_chat_vol_tip:'حجم چت در حال رشد است. اطمینان حاصل کنید که در ساعات اوج تقاضا پوشش کافی وجود دارد.',
    kpi_sat_tip:'CSAT بالاتر از هدف است. کیفیت پاسخ و همدلی را در مکالمات حفظ کنید.',
    kpi_resp_tip:'زمان پاسخ بهبود یافت. به تشویق پاسخ‌های سریع اول از عوامل ادامه دهید.',
    kpi_eff_tip:'کارایی در سطح بالایی است. تعداد چت‌های همزمان را برای جلوگیری از خستگی عوامل رصد کنید.',
    dash_agent_board_title:'تابلوی وضعیت عوامل', dash_manage:'مدیریت',
    tbl_agent:'عامل', tbl_status:'وضعیت', tbl_chats:'چت‌ها', tbl_load:'بار',
    dash_pi_title:'ردیاب مشکلات پلتفرم', dash_pi_sub:'حوادث فعال و حل‌های اخیر', dash_viewall:'مشاهده همه',
    lc_in_queue:'در صف انتظار', lc_chatting:'در حال گفتگو', lc_queue_title:'صف انتظار',
    lc_ongoing:'در جریان', lc_pick_up:'دریافت', lc_supervise:'نظارت',
    lc_waiting:'در انتظار', lc_no_queue:'هیچ چتی در صف انتظار نیست.', lc_no_active:'هیچ چت فعالی در حال حاضر وجود ندارد.',
    pi_export:'↓ خروجی Excel', pi_new_issue:'+ مشکله جدید', pi_filter_all:'همه', pi_filter_mine:'مشکلات من',
    lbl_pi_assignee_filter:'تخصیص‌یافته به:', pi_assignee_all:'همه کاربران',
    lbl_ni_assignee:'تخصیص به',
    pi_todo:'انجام دادنی', pi_inprogress:'در حال انجام', pi_pending:'معلق',
    pi_postponed:'به تعویق افتاده', pi_resolved:'حل‌شده', pi_archived:'بایگانی‌شده',
    confirm_archive_issue_sub:'این مشکل به تب بایگانی منتقل خواهد شد.',
    pi_active_issue:'مشکل فعال', pi_active_issues:'مشکل فعال',
    pi_resolved_word:'حل‌شده',
    pi_clients_affected:'کلاینت تحت تأثیر', pi_tickets_word:'تیکت',
    pi_last_update:'آخرین به‌روزرسانی', pi_more_details:'جزئیات بیشتر',
    pi_no_comments:'هنوز نظری ثبت نشده. اولین نفر باشید.',
    pi_no_match:'هیچ مشکلی با این فیلتر مطابقت ندارد.',
    pi_clients_affected_label:'کلاینت‌های تحت تأثیر', pi_tickets_opened:'تیکت‌های باز',
    pi_impact_downtime:'زمان توقف', pi_impact_updates:'به‌روزرسانی‌ها',
    pi_by_word:'توسط', pi_days_ago:'روز پیش',
    team_support:'تیم پشتیبانی', team_mobile_dev:'تیم توسعه موبایل',
    team_data:'تیم داده', team_it_security:'امنیت IT',
    team_dev:'تیم توسعه', team_finance:'تیم مالی', team_it_ops:'عملیات IT',
    tkt_all_tickets:'همه تیکت‌ها', tkt_open:'باز', tkt_hold:'در انتظار',
    tkt_solved:'حل‌شده', tkt_closed:'بسته‌شده',
    tkt_filter_all_statuses:'همه وضعیت‌ها', tkt_filter_all_agents:'همه عوامل',
    tkt_empty_title:'هیچ تیکتی انتخاب نشده',
    tkt_empty_desc:'یک تیکت از فهرست سمت چپ انتخاب کنید تا مکالمه کامل، جزئیات و تاریخچه آن را مشاهده کنید.',
    rpt_total_chats_tab:'مجموع چت‌ها', rpt_satisfaction_tab:'رضایت از چت', rpt_agent_perf_tab:'عملکرد عامل',
    period_today:'امروز', period_yesterday:'دیروز', period_last7:'۷ روز گذشته',
    period_curMonth:'ماه جاری', period_lastMonth:'ماه گذشته',
    period_curYear:'سال جاری', period_total:'کل',
    rpt_all_agents:'همه عوامل',
    rpt_annual_title:'تحلیل سالانه چت',
    rpt_annual_sub:'توزیع ماهانه، روندهای MoM و مقایسه سال به سال',
    rpt_sat_week_title:'روند رضایت — این هفته',
    rpt_sat_month_title:'روند رضایت — ماه جاری',
    rpt_this_week_title:'مجموع چت‌ها — این هفته',
    tbl_total_chats:'مجموع چت‌ها', tbl_chat_sat:'رضایت از چت',
    tbl_first_resp:'اولین پاسخ', tbl_efficiency:'کارایی',
    tbl_avg_chat:'میانگین زمان چت', tbl_chat_share:'سهم چت', tbl_monthly_trend:'روند ماهانه',
    rpt_kpi_total_chats:'مجموع چت‌ها', rpt_avg_per:'میانگین /', rpt_peak:'اوج', rpt_share_of_team:'سهم تیم',
    rpt_all_agents_delta:'همه عوامل', rpt_vs_prev:'در مقابل قبلی', rpt_highest:'بالاترین',
    rpt_monthly_dist:'توزیع ماهانه', rpt_mom_trend:'روند ماه به ماه',
    rpt_yoy_change:'% = تغییر سالانه', rpt_legend_2025:'2025', rpt_legend_2026:'2026', rpt_compare_btn:'2026 در مقابل 2025',
    rpt_total_chats_svg:'مجموع چت‌ها',
    rpt_positive:'مثبت', rpt_negative:'منفی', rpt_no_rating:'بدون رتبه',
    rpt_csat_score:'امتیاز CSAT', rpt_positive_ratings:'رتبه‌بندی‌های مثبت', rpt_negative_ratings:'رتبه‌بندی‌های منفی',
    rpt_nps_score:'امتیاز NPS', rpt_excellent:'↑ عالی', rpt_good_delta:'↑ خوب',
    rpt_happy_clients:'😊 مشتریان خوشحال', rpt_review_needed:'↑ نیاز به بررسی', rpt_low_delta:'↓ پایین',
    rpt_promoters:'↑ مروجان', rpt_passives:'خنثی',
    rpt_trend_chats:'— چت‌ها', rpt_trend_1st_resp:'— پاسخ اول', rpt_trend_effic:'— کارایی', rpt_trend_duration:'— مدت',
    agent_filter_all:'همه عوامل', agent_filter_day:'☀ شیفت روز', agent_filter_night:'🌙 شیفت شب',
    status_online:'آنلاین', status_busy:'مشغول', status_away:'دور', status_offline:'آفلاین', status_archived:'بایگانی‌شده',
    profile_sub:'مدیریت اطلاعات حساب و ترجیحات',
    profile_picture:'عکس پروفایل', profile_personal_info:'اطلاعات شخصی',
    lbl_display_name:'نام نمایشی', lbl_email_addr:'آدرس ایمیل',
    btn_save_info:'ذخیره اطلاعات',
    profile_work_shift:'شیفت کاری', shift_day:'شیفت روز', shift_night:'شیفت شب',
    btn_save_shift:'ذخیره شیفت',
    lbl_role:'نقش', role_agent:'عامل', role_manager:'مدیر', role_admin:'مدیر ارشد',
    btn_save_role:'ذخیره نقش',
    btn_create_user:'ایجاد کاربر', modal_create_user_title:'ایجاد کاربر',
    lbl_full_name:'نام کامل', lbl_password:'رمز عبور',
    profile_security:'رمز عبور و امنیت',
    lbl_new_pass:'رمز عبور جدید', lbl_confirm_pass:'تأیید رمز عبور',
    btn_send_reset:'📧 ارسال لینک بازنشانی', btn_set_password:'تنظیم رمز عبور',
    btn_back:'بازگشت',
    modal_add_agent_title:'افزودن عامل جدید', modal_edit_agent_title:'ویرایش عامل',
    btn_add_agent_modal:'افزودن عامل', btn_save_changes:'ذخیره تغییرات',
    // Ticket modal
    modal_add_ticket_title:'افزودن تیکت', modal_edit_ticket_title:'ویرایش تیکت',
    lbl_subject:'موضوع', ph_tk_subject:'توضیح مختصری از مشکل',
    lbl_tk_description:'توضیحات', ph_tk_description:'مشکل را به تفصیل شرح دهید…',
    lbl_client_email:'ایمیل کلاینت',
    lbl_assign_agent:'تخصیص به عامل',
    lbl_unassigned:'بدون تخصیص', lbl_unassigned_opt:'— بدون تخصیص —',
    btn_save_ticket:'ذخیره تیکت', btn_delete:'حذف',
    btn_archive:'بایگانی',
    tkt_in_progress:'در حال انجام', tkt_resolved:'حل‌شده', tkt_archived:'بایگانی‌شده',
    tkt_priority_medium:'متوسط',
    confirm_archive_title:'بایگانی تیکت',
    confirm_archive_sub:'این تیکت به تب بایگانی منتقل می‌شود.',
    err_subject_required:'موضوع الزامی است.',
    err_description_required:'توضیحات الزامی است.',
    err_tkt_save:'ذخیره تیکت امکان‌پذیر نشد.',
    err_tkt_archive:'بایگانی تیکت امکان‌پذیر نشد.',
    err_server_connect:'اتصال به سرور امکان‌پذیر نشد. لطفاً دوباره امتحان کنید.',
    err_email_invalid:'لطفاً یک آدرس ایمیل معتبر وارد کنید.',
    err_password_invalid:'رمز عبور باید حداقل ۶ کاراکتر با یک حرف، عدد و کاراکتر خاص باشد.',
    err_name_required:'لطفاً نام کامل خود را وارد کنید.',
    err_agent_name:'لطفاً یک نام وارد کنید.',
    err_agent_email:'لطفاً یک آدرس ایمیل معتبر وارد کنید.',
    err_profile_name_short:'نام نمایشی باید حداقل ۳ کاراکتر باشد.',
    err_profile_email:'یک ایمیل معتبر وارد کنید (باید شامل @ و . باشد).',
    err_password_weak:'حداقل ۶ کاراکتر با حرف، عدد و کاراکتر خاص.',
    err_passwords_mismatch:'رمزهای عبور مطابقت ندارند.',
    err_issue_title:'لطفاً یک عنوان وارد کنید.',
    err_issue_platform:'لطفاً یک پلتفرم انتخاب کنید.',
    err_issue_priority:'لطفاً یک اولویت انتخاب کنید.',
    err_issue_summary:'لطفاً یک خلاصه وارد کنید.',
    pass_weak:'ضعیف', pass_fair:'متوسط', pass_good:'خوب', pass_strong:'قوی',
    msg_saved:'ذخیره شد',
    msg_password_updated:'✓ رمز عبور با موفقیت به‌روز شد.',
    msg_reset_sent_prefix:'📧 لینک بازنشانی به',
    no_agents_match:'هیچ عاملی با این فیلتر مطابقت ندارد.',
    btn_add_agent:'افزودن عامل',
    btn_add_ticket:'+ افزودن',
    // Auth page
    auth_headline:'تیم پشتیبانی خود را با اطمینان مدیریت کنید',
    auth_desc:'نظارت لحظه‌ای، تحلیل عوامل، و مدیریت تیکت — همه در یک داشبورد قدرتمند.',
    auth_feat_chat_title:'نظارت بر چت زنده',
    auth_feat_chat_sub:'نظارت و هدایت عوامل در لحظه',
    auth_feat_analytics_title:'تحلیل عملکرد',
    auth_feat_analytics_sub:'بینش عمیق درباره کارایی عوامل',
    auth_feat_tickets_title:'مدیریت تیکت',
    auth_feat_tickets_sub:'پیگیری و حل سریع مشکلات کلاینت',
    auth_stat_agents:'عوامل آنلاین',
    auth_stat_satisfaction:'رضایت',
    auth_stat_response:'میانگین پاسخ',
    auth_login_title:'خوش آمدید',
    auth_login_sub:'به داشبورد پشتیبانی وارد شوید',
    auth_lbl_email:'آدرس ایمیل',
    auth_lbl_password:'رمز عبور',
    auth_lbl_fullname:'نام کامل',
    auth_login_btn:'ورود',
    auth_no_account:'حساب کاربری ندارید؟',
    auth_create_link:'بسازید',
    auth_signup_title:'ایجاد حساب',
    auth_signup_sub:'به تیم پشتیبانی OpoSupportDesk بپیوندید',
    auth_signup_btn:'ایجاد حساب',
    auth_have_account:'قبلاً حساب دارید؟',
    auth_signin_link:'ورود',
    // Logout popup
    logout_title:'خروج از سیستم؟',
    logout_sub:'برای دسترسی مجدد به داشبورد باید وارد شوید.',
    btn_cancel:'لغو',
    btn_sign_out:'خروج',
    // Idle warning
    idle_title:'انقضای جلسه',
    idle_sub:'غیرفعال بودید. جلسه شما به‌طور خودکار در این مدت پایان می‌یابد',
    idle_unit:'ثانیه',
    idle_stay:'ادامه جلسه',
    idle_logout:'خروج همین حالا',
    // Dashboard
    dash_greeting:'صبح بخیر',
    dash_chart_7days:'۷ روز گذشته — مجموع چت‌ها',
    dash_chart_curmonth:'ماه جاری — مجموع چت‌ها',
    // Navigation
    nav_profile:'پروفایل',
    // Tickets
    tkt_pending:'معلق',
    // Agent modal
    lbl_avatar_style:'سبک آواتار پیش‌فرض',
    gender_male:'👨 مرد',
    gender_female:'👩 زن',
    lbl_full_name:'نام کامل',
    lbl_shift:'شیفت',
    btn_close:'بستن',
    // Issue detail modal
    lbl_priority:'اولویت',
    priority_critical:'🔴 بحرانی',
    priority_high:'🟠 بالا',
    priority_medium:'🟡 متوسط',
    lbl_comments:'نظرات',
    btn_post:'ارسال',
    lbl_description:'توضیحات',
    lbl_timeline:'جدول زمانی حل',
    // New issue modal
    modal_new_issue_title:'گزارش مشکل جدید', modal_edit_issue_title:'ویرایش مشکل',
    modal_fields_required:'تمام فیلدهای علامت‌گذاری شده با * الزامی هستند',
    lbl_ni_title:'عنوان *',
    lbl_ni_platform:'پلتفرم *',
    lbl_ni_priority:'اولویت *',
    lbl_ni_summary:'خلاصه *',
    lbl_ni_desc:'توضیحات',
    lbl_ni_reporter:'گزارش‌دهنده',
    btn_submit_issue:'ارسال مشکله',
    ph_platform_select:'پلتفرم را انتخاب کنید…',
    ph_priority_select:'اولویت را انتخاب کنید…',
    // Supervise panel
    sv_note_label:'یادداشت خصوصی برای عامل — فقط شما و عامل می‌توانید این را ببینید',
    // Profile avatar buttons
    btn_upload_avatar:'📁 بارگذاری', btn_choose_avatar:'✏️ انتخاب', btn_remove_avatar:'🗑 حذف',
    // Notifications
    notif_mark_read:'علامت‌گذاری به‌عنوان خوانده‌شده', notif_read_label:'✓ خوانده شد',
    notif_unread_word:'خوانده‌نشده', notif_all_caught_up:'همه خوانده شده',
    // Help modal
    help_title:'راهنمای سریع',
    help_pages_title:'صفحات',
    help_tips_title:'نکات',
    help_demo_title:'اعتبارنامه‌های آزمایشی',
    help_pg_dashboard:'داشبورد', help_pg_dashboard_desc:'نمای کلی از آمار زنده، وضعیت عوامل و مشکلات پلتفرم.',
    help_pg_livechats:'چت‌های زنده', help_pg_livechats_desc:'نظارت بر مکالمات فعال و پاسخ به چت‌های در صف انتظار.',
    help_pg_agents:'عوامل', help_pg_agents_desc:'مدیریت عوامل، شیفت‌ها و وضعیت‌ها.',
    help_pg_issues:'مشکلات پلتفرم', help_pg_issues_desc:'ردیابی و حل حوادث فنی بر اساس پلتفرم.',
    help_pg_tickets:'تیکت‌ها', help_pg_tickets_desc:'رسیدگی به تیکت‌های پشتیبانی مشتری با تاریخچه کامل مکالمه.',
    help_pg_reports:'گزارش‌ها', help_pg_reports_desc:'تحلیل حجم چت‌ها، امتیاز رضایت و عملکرد عوامل.',
    help_tip_1:'🔍 از <strong>نوار جستجو</strong> در هدر برای رفتن سریع به هر صفحه یا رکورد استفاده کنید.',
    help_tip_2:'🌙 حالت <strong>روشن / تاریک</strong> را با آیکون خورشید/ماه در هدر یا تنظیمات تغییر دهید.',
    help_tip_3:'🌐 زبان (انگلیسی / عربی / فارسی) را از طریق آیکون کره زمین یا تنظیمات ← زبان تغییر دهید.',
    help_tip_4:'📤 گزارش‌ها یا داده‌های مشکل را با دکمه <strong>خروجی</strong> در داشبورد و مشکلات صادر کنید.',
    help_tip_5:'⏱️ جلسه شما بعد از <strong>۱۰ دقیقه</strong> عدم فعالیت منقضی می‌شود — در دقیقه ۹ هشدار نمایش داده می‌شود.',
    help_tip_6:'👤 پروفایل، آواتار و رمز عبور خود را در صفحه <strong>پروفایل</strong> ویرایش کنید.',
    help_cred_email_label:'ایمیل', help_cred_email_val:'هر آدرس ایمیل معتبر',
    help_cred_pass_label:'رمز عبور', help_cred_pass_val:'۶+ کاراکتر · حرف · عدد · کاراکتر خاص',
    // Placeholders
    ph_login_password:'رمز عبور را وارد کنید',
    ph_su_password:'۶+ کاراکتر با حرف، عدد و کاراکتر خاص',
    ph_profile_name:'نام کامل شما',
    ph_profile_confirm_pass:'رمز عبور جدید را تکرار کنید',
    ph_ni_title_ph:'توضیح مختصر مشکله',
    ph_ni_summary_ph:'خلاصه یک خطی مشکله',
    ph_ni_desc_ph:'توضیح مفصل، کلاینت‌های تحت تأثیر، مراحل بازتولید…',
    ph_comment:'نظر بگذارید…',
    ph_sv_note:'یادداشت آموزشی یا دستورالعمل برای عامل بنویسید…',
    ph_search:'جستجو کنید…',
    // Dashboard — platform issue items
    issue_reported:'گزارش', issue_affects:'تأثیر بر', issue_clients:'کلاینت',
    issue_investigating:'در حال بررسی', issue_monitoring:'در حال رصد',
    issue_team_notified:'تیم داده مطلع شد', issue_provider_issue:'مشکل ارائه‌دهنده',
    badge_critical:'بحرانی', badge_high:'بالا', badge_medium:'متوسط', badge_resolved:'حل‌شده',
    // Dashboard — chart day labels
    day_today:'امروز', day_sun:'یکش', day_mon:'دوش', day_tue:'سه‌ش',
    day_wed:'چهار', day_thu:'پنج', day_fri:'جمع', day_sat:'شنب',
    // Dashboard — chart week label
    lbl_wk:'هف',
    btn_edit_agent:'ویرایش عامل', btn_restore_agent:'بازگرداندن عامل',
    confirm_archive_agent_sub:'این عامل بایگانی خواهد شد. تمام تیکت‌ها و مشکلات آن‌ها دست‌نخورده باقی می‌مانند.',
    lbl_chat_load:'بار چت',
    lbl_agents_word:'عامل', lbl_day_word:'روز', lbl_night_word:'شب',
    lbl_chats_word:'چت', lbl_per_day:'در روز',
    lbl_client:'کلاینت', lbl_agent_label:'عامل',
    tkt_reply_to_client:'پاسخ به کلاینت', tkt_internal_note:'یادداشت داخلی',
    ph_tkt_reply:'پاسخ خود را برای کلاینت بنویسید…',
    ph_tkt_internal:'یادداشت داخلی بنویسید — برای کلاینت نمایش داده نمی‌شود…',
    tkt_add_note:'افزودن یادداشت', tkt_last_week:'هفته گذشته', day_long_mon:'دوشنبه',
    tkt_change_status:'تغییر وضعیت…',
    tkt_status_open:'→ باز', tkt_status_pending:'→ معلق',
    tkt_status_hold:'→ در انتظار', tkt_status_solved:'→ حل‌شده', tkt_status_closed:'→ بسته‌شده',
    btn_send_reply:'ارسال پاسخ',
    tkt_priority_urgent:'فوری', tkt_priority_high:'بالا', tkt_priority_normal:'معمولی', tkt_priority_low:'پایین',
    tkt_no_tickets:'تیکتی یافت نشد.',
    lbl_csat_per_day:'CSAT % در روز', lbl_csat_per_week:'CSAT % در هفته',
    pass_hint:'حداقل ۶ کاراکتر با یک حرف، یک عدد، و یک کاراکتر خاص (مثل <code>@&nbsp;&nbsp;#&nbsp;&nbsp;$&nbsp;&nbsp;!&nbsp;&nbsp;%</code>)',
    // Users Management
    label_male:'مرد', label_female:'زن',
    nav_users:'مدیریت کاربران', page_users:'مدیریت کاربران',
    users_sub:'همه کاربران ثبت‌نام‌شده',
    users_filter_all:'همه',
    status_approved:'تأیید شده', status_pending:'در انتظار', status_rejected:'رد شده',
    modal_edit_user_title:'ویرایش کاربر',
    pending_title:'در انتظار تأیید',
    pending_sub:'حساب شما در انتظار بررسی توسط مدیر است.',
    pending_detail:'پس از تأیید، به داشبورد دسترسی خواهید داشت. اگر نیاز به دسترسی فوری دارید با سرپرست تیم تماس بگیرید.',
    rejected_title:'حساب رد شد',
    rejected_sub:'حساب شما توسط مدیر رد شده است.',
    rejected_detail:'اگر فکر می‌کنید این اشتباه است، برای راهنمایی با سرپرست تیم یا مدیر تماس بگیرید.',
    btn_logout:'خروج از سیستم',
    pending_joined:'تاریخ عضویت',
    btn_edit:'ویرایش',
  }
};

function _syncLangUI() {
  const LABELS = { en: 'EN', ar: 'AR', fa: 'FA' };
  const label = LABELS[currentLang] || 'EN';
  document.querySelectorAll('.lang-switcher-label').forEach(el => el.textContent = label);
  // Mark active items in all open dropdowns
  document.querySelectorAll('.lang-drop-item').forEach(item => {
    const code = item.querySelector('.lang-drop-code');
    if (code) item.classList.toggle('active', code.textContent.toLowerCase() === currentLang);
  });
}

function toggleLangDrop(dropId, event) {
  event.stopPropagation();
  const drop = document.getElementById(dropId);
  if (!drop) return;
  const isHidden = drop.classList.contains('hidden');
  // Close all lang dropdowns first
  document.querySelectorAll('.lang-drop').forEach(d => d.classList.add('hidden'));
  if (isHidden) drop.classList.remove('hidden');
}

function selectLang(lang) {
  document.querySelectorAll('.lang-drop').forEach(d => d.classList.add('hidden'));
  applyLanguage(lang);
}

// Close lang dropdowns on outside click
document.addEventListener('click', function() {
  document.querySelectorAll('.lang-drop').forEach(d => d.classList.add('hidden'));
});

function applyLanguage(lang, btn) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  const t = translations[lang];

  // Translate all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });

  // Translate elements that contain inner HTML markup
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  // Translate placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  // Update page header title for current page
  const activeNav = document.querySelector('.nav-item.active');
  if (activeNav && activeNav.dataset.page) {
    const key = 'page_' + activeNav.dataset.page;
    if (t[key]) document.getElementById('header-title').textContent = t[key];
  }

  // RTL/LTR direction
  const isRtl = lang === 'ar' || lang === 'fa';
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  // Highlight active language card
  document.querySelectorAll('.lang-card').forEach(c => c.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    const card = document.getElementById('lang-' + lang);
    if (card) card.classList.add('active');
  }

  // Sync global lang switcher labels
  _syncLangUI();

  // Password hint (contains HTML)
  const passHint = document.getElementById('pass-hint-text');
  if (passHint) passHint.innerHTML = t.pass_hint;

  // Agent modal status options
  const statusOpts = { online: t.status_online, busy: t.status_busy, away: t.status_away, offline: t.status_offline };
  ['online','busy','away','offline'].forEach(s => {
    const opt = document.querySelector(`#modal-status option[value="${s}"]`);
    if (opt && statusOpts[s]) opt.textContent = (s === 'offline' ? '○ ' : '● ') + statusOpts[s];
  });

  // Re-render dynamic pages if currently visible
  if (!document.getElementById('page-livechats')?.classList.contains('hidden')) renderLiveChats();
  if (!document.getElementById('page-issues')?.classList.contains('hidden')) renderIssues(currentIssueFilter);
  if (!document.getElementById('page-dashboard')?.classList.contains('hidden')) {
    const todayEl = document.getElementById('today-date');
    if (todayEl) todayEl.textContent =
      new Date().toLocaleDateString(_getLangLocale(), {weekday:'long',year:'numeric',month:'long',day:'numeric'});
    initDashboardOverview();
  }
  if (!document.getElementById('page-agents')?.classList.contains('hidden')) renderAgents();
  if (!document.getElementById('page-tickets')?.classList.contains('hidden')) {
    renderTicketList();
    if (selectedTicketId) renderTicketDetail(selectedTicketId);
    else renderTicketEmptyPanel();
  }
  if (!document.getElementById('page-notifications')?.classList.contains('hidden')) renderNotifPage();
  if (!document.getElementById('page-users')?.classList.contains('hidden')) renderUsersTable(_usersCache, _usersFilter);
  if (!document.getElementById('page-reports')?.classList.contains('hidden')) {
    if (rptActiveSub === 'total-chats') { renderTotalChats(); renderYearlyCharts(tcYearView === 'compare' ? '2026' : tcYearView); }
    if (rptActiveSub === 'satisfaction') renderSatisfaction();
    if (rptActiveSub === 'agent-perf') renderAgentPerf();
  }
}

// Apply saved language on startup
(function() { applyLanguage(currentLang); })();

// ────────────────────────────────────────────────────────
//  PROFILE PAGE
// ────────────────────────────────────────────────────────
const PROFILE_MALE_COLORS   = ['#1a56db','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'];
const PROFILE_FEMALE_COLORS = ['#ec4899','#8b5cf6','#10b981','#f97316','#6366f1','#0ea5e9'];

function goToProfile() {
  const navEl = document.querySelector('.nav-item[data-page="profile"]');
  if (navEl) navClick(navEl);
}

function initProfile() {
  document.getElementById('profile-name').value  = currentUser.name  || '';
  document.getElementById('profile-email').value = currentUser.email || '';

  const shift = currentUser.shift || 'day';
  document.getElementById('shift-' + shift).checked = true;
  updateShiftUI(shift);

  // Build avatar grids
  document.getElementById('profile-avatar-grid-male').innerHTML =
    PROFILE_MALE_COLORS.map((c, i) => avatarOptionHTML('male', c, i)).join('');
  document.getElementById('profile-avatar-grid-female').innerHTML =
    PROFILE_FEMALE_COLORS.map((c, i) => avatarOptionHTML('female', c, i + PROFILE_MALE_COLORS.length)).join('');

  renderProfilePreview();
  syncAvatarSelection();

  // Role card — admins get editable toggle; others get read-only display
  const role    = currentUser.role || 'agent';
  const isAdmin = role === 'admin';

  const roleToggle   = document.getElementById('profile-role-toggle');
  const roleReadonly = document.getElementById('profile-role-readonly');
  const roleSaveArea = document.getElementById('profile-role-save-area');

  if (roleReadonly) roleReadonly.style.display = 'none';
  if (roleSaveArea) roleSaveArea.style.display = isAdmin ? 'flex' : 'none';

  // Always show the toggle, but disable buttons for non-admins
  if (roleToggle) {
    roleToggle.style.display = '';
    roleToggle.querySelectorAll('.gender-btn').forEach(btn => {
      btn.disabled = !isAdmin;
      btn.style.cursor = isAdmin ? '' : 'not-allowed';
      // Non-admins: dim inactive buttons, keep active one fully visible in blue
      if (!isAdmin) {
        const isActive = btn.dataset.role === role;
        btn.style.opacity = isActive ? '1' : '0.45';
      } else {
        btn.style.opacity = '';
      }
    });
  }

  // Pre-select active role button
  ['agent', 'manager', 'admin'].forEach(r => {
    const btn = document.getElementById('profile-role-' + r);
    if (btn) btn.classList.toggle('active', role === r);
  });
}

function avatarOptionHTML(gender, color, idx) {
  const sel = currentUser.avatarIdx === idx ? 'selected' : '';
  return `<div class="profile-avatar-option ${sel}" onclick="selectAvatar(${idx},'${gender}','${color}')">${avatarSVG(gender, color)}</div>`;
}

function renderProfilePreview() {
  const preview = document.getElementById('profile-avatar-preview');
  const nameEl  = document.getElementById('profile-avatar-name');
  const emailEl = document.getElementById('profile-avatar-email');
  if (currentUser.avatarCustom) {
    preview.innerHTML = `<img src="${currentUser.avatarCustom}" style="width:100%;height:100%;object-fit:cover;display:block" />`;
    preview.classList.remove('initials');
  } else if (currentUser.avatarIdx != null) {
    const { gender, color } = resolveAvatar(currentUser.avatarIdx);
    preview.innerHTML = avatarSVG(gender, color);
    preview.classList.remove('initials');
  } else {
    const initials = (currentUser.name || 'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    preview.innerHTML = `<span class="profile-initials-text">${initials}</span>`;
    preview.classList.add('initials');
  }
  nameEl.textContent  = currentUser.name  || '—';
  emailEl.textContent = currentUser.email || '—';
}

async function _saveAvatarToAPI(avatarData) {
  if (!currentUser.email) return;
  try {
    await fetch(`${API_BASE}/users/avatar`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: currentUser.email, avatarData: avatarData ?? null })
    });
  } catch (err) {
    console.error('[saveAvatarToAPI]', err);
  }
}

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    currentUser.avatarCustom = e.target.result;
    currentUser.avatarIdx    = null;
    syncAvatarSelection();
    renderProfilePreview();
    updateHeaderAvatarImage();
    saveSession();
    _saveAvatarToAPI(e.target.result);
    document.getElementById('profile-avatar-picker').style.display = 'none';
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function resolveAvatar(idx) {
  if (idx < PROFILE_MALE_COLORS.length)
    return { gender:'male',   color: PROFILE_MALE_COLORS[idx] };
  return { gender:'female', color: PROFILE_FEMALE_COLORS[idx - PROFILE_MALE_COLORS.length] };
}

function syncAvatarSelection() {
  document.querySelectorAll('.profile-avatar-option').forEach((el, i) =>
    el.classList.toggle('selected', i === currentUser.avatarIdx));
}

function toggleAvatarPicker() {
  const picker = document.getElementById('profile-avatar-picker');
  picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
}

function selectAvatar(idx, gender, color) {
  currentUser.avatarIdx    = idx;
  currentUser.avatarCustom = null;
  syncAvatarSelection();
  renderProfilePreview();
  updateHeaderAvatarSVG();
  saveSession();
  _saveAvatarToAPI(`svg:${idx}`);
  document.getElementById('profile-avatar-picker').style.display = 'none';
}

function removeAvatar() {
  currentUser.avatarIdx    = null;
  currentUser.avatarCustom = null;
  syncAvatarSelection();
  renderProfilePreview();
  saveSession();
  _saveAvatarToAPI(null);
  const initials = (currentUser.name || 'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  ['header-avatar','sidebar-avatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = initials; el.innerHTML = initials; }
  });
}

function selectShift(val) {
  currentUser.shift = val;
  updateShiftUI(val);
}

function updateShiftUI(val) {
  ['day','night'].forEach(s =>
    document.getElementById('shift-' + s + '-box').classList.toggle('active', s === val));
}

function updateHeaderAvatarSVG() {
  if (currentUser.avatarIdx == null) return;
  const { gender, color } = resolveAvatar(currentUser.avatarIdx);
  const svg = avatarSVG(gender, color);
  ['header-avatar','sidebar-avatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = svg;
  });
}

function updateHeaderAvatarImage() {
  if (!currentUser.avatarCustom) return;
  ['header-avatar','sidebar-avatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<img src="${currentUser.avatarCustom}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />`;
  });
}

function profileSaveFeedback(btnEl, msg) {
  const orig = btnEl.textContent;
  btnEl.textContent = '✓ ' + msg;
  btnEl.style.background = '#10b981';
  btnEl.style.borderColor = '#10b981';
  btnEl.style.color = '#fff';
  setTimeout(() => {
    btnEl.textContent = orig;
    btnEl.style.background = '';
    btnEl.style.borderColor = '';
    btnEl.style.color = '';
  }, 2200);
}

function saveProfileInfo() {
  const name  = document.getElementById('profile-name').value.trim();
  const email = document.getElementById('profile-email').value.trim();
  hideErr('profile-name-err'); hideErr('profile-email-err');
  let ok = true;
  if (name.length < 3)                         { showErr('profile-name-err',  'Display name must be at least 3 characters.'); ok = false; }
  if (!email || !email.includes('@') || !email.slice(email.indexOf('@')).includes('.'))
                                               { showErr('profile-email-err', 'Enter a valid email (must include @ and .).'); ok = false; }
  if (!ok) return;

  currentUser.name  = name;
  currentUser.email = email;
  document.getElementById('header-name').textContent   = name;
  document.getElementById('sidebar-name').textContent  = name;
  document.getElementById('greeting-name').textContent = name.split(' ')[0];
  renderProfilePreview();
  if (currentUser.avatarCustom)       updateHeaderAvatarImage();
  else if (currentUser.avatarIdx != null) updateHeaderAvatarSVG();
  saveSession();

  profileSaveFeedback(document.getElementById('profile-info-save-btn'), 'Saved');
}

function saveProfileShift() {
  const val = document.querySelector('input[name="profile-shift"]:checked')?.value || 'day';
  currentUser.shift = val;
  saveSession();
  profileSaveFeedback(document.getElementById('profile-shift-save-btn'), 'Saved');
}

function selectProfileRole(btn) {
  document.querySelectorAll('#page-profile [data-role]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

async function saveProfileRole() {
  const role = document.querySelector('#page-profile [data-role].active')?.dataset.role;
  if (!role) return;
  const saveBtn = document.getElementById('profile-role-save-btn');
  if (saveBtn) saveBtn.disabled = true;
  try {
    const res  = await fetch(`${API_BASE}/users/role`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: currentUser.email, role, requesterEmail: currentUser.email })
    });
    const json = await res.json();
    if (!res.ok) { alert(json.message || 'Could not save role.'); return; }
    currentUser.role = role;
    saveSession();
    profileSaveFeedback(saveBtn, 'Role updated — logging out…');
    setTimeout(() => handleLogout(), 1500);
  } catch (err) {
    alert('Could not connect to server. Please try again.');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

// ────────────────────────────────────────────────────────
//  USERS MANAGEMENT PAGE
// ────────────────────────────────────────────────────────
let _usersCache = [];
let _usersFilter = 'all';

async function loadUsersFromAPI() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">Loading…</td></tr>';
  try {
    const res  = await fetch(`${API_BASE}/users/all?requesterEmail=${encodeURIComponent(currentUser.email)}`);
    const json = await res.json();
    if (!res.ok) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">${json.message || 'Failed to load users.'}</td></tr>`; return; }
    _usersCache = json.data || [];
    _updateUsersTabCounts();
    renderUsersTable(_usersCache, _usersFilter);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">Could not connect to server.</td></tr>';
  }
}

function _updateUsersTabCounts() {
  const counts = { all: _usersCache.length, approved: 0, pending: 0, rejected: 0 };
  _usersCache.forEach(u => { if (counts[u.status] !== undefined) counts[u.status]++; });
  ['all','approved','pending','rejected'].forEach(k => {
    const el = document.getElementById(`ucount-${k}`);
    if (el) el.textContent = counts[k];
  });
}

function renderUsersTable(users, filter) {
  _usersFilter = filter;
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  const t = translations[currentLang];
  const filtered = filter === 'all' ? users : users.filter(u => u.status === filter);
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">${t.no_agents_match || 'No users found.'}</td></tr>`;
    return;
  }
  const roleMap   = { agent: t.role_agent, manager: t.role_manager, admin: t.role_admin };
  const statusMap = { approved: t.status_approved, pending: t.status_pending, rejected: t.status_rejected };
  tbody.innerHTML = filtered.map(u => {
    const initials  = u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const joined    = new Date(u.createdAt).toLocaleDateString(_getLangLocale(), { year: 'numeric', month: 'short', day: 'numeric' });
    const roleLabel = roleMap[u.role]   || u.role;
    const statLabel = statusMap[u.status] || u.status;
    return `<tr>
      <td>
        <div class="user-cell">
          <div class="user-mini-avatar">${initials}</div>
          <span>${_esc(u.name)}</span>
        </div>
      </td>
      <td>${_esc(u.email)}</td>
      <td>${_esc(roleLabel)}</td>
      <td><span class="user-status-badge ${u.status}">${_esc(statLabel)}</span></td>
      <td>${joined}</td>
      <td><button class="btn-ghost" style="padding:5px 14px;font-size:12px" onclick="openUserEditModal(${u.id})">${_esc(t.btn_edit || 'Edit')}</button></td>
    </tr>`;
  }).join('');
}

function filterUsers(btn, filter) {
  document.querySelectorAll('#page-users .filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderUsersTable(_usersCache, filter);
}

function openUserEditModal(userId) {
  const user = _usersCache.find(u => u.id === userId);
  if (!user) return;
  document.getElementById('ue-id').value    = user.id;
  document.getElementById('ue-name').value  = user.name;
  document.getElementById('ue-email').value = user.email;
  document.getElementById('ue-role').value   = user.role;
  document.getElementById('ue-status').value = user.status;
  const apiErr = document.getElementById('ue-api-err');
  if (apiErr) apiErr.style.display = 'none';
  document.getElementById('user-edit-overlay').classList.remove('hidden');
}

function closeUserEditModal() {
  document.getElementById('user-edit-overlay').classList.add('hidden');
}

async function saveUserEdit() {
  const id     = document.getElementById('ue-id').value;
  const name   = document.getElementById('ue-name').value.trim();
  const email  = document.getElementById('ue-email').value.trim();
  const role   = document.getElementById('ue-role').value;
  const status = document.getElementById('ue-status').value;
  const apiErr = document.getElementById('ue-api-err');
  if (apiErr) apiErr.style.display = 'none';

  hideErr('ue-name-err'); hideErr('ue-email-err');
  if (!name)              { showErr('ue-name-err',  'Name is required.'); return; }
  if (!emailValid(email)) { showErr('ue-email-err', 'Valid email is required.'); return; }

  const btn = document.getElementById('ue-save-btn');
  if (btn) btn.disabled = true;
  try {
    const res  = await fetch(`${API_BASE}/users/edit`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, name, email, role, status, requesterEmail: currentUser.email }),
    });
    const json = await res.json();
    if (!res.ok) {
      if (apiErr) { apiErr.textContent = json.message || 'Could not update user.'; apiErr.style.display = ''; }
      return;
    }
    // Update cache
    const idx = _usersCache.findIndex(u => u.id === Number(id));
    if (idx !== -1) Object.assign(_usersCache[idx], { name, email, role, status });
    closeUserEditModal();
    _updateUsersTabCounts();
    renderUsersTable(_usersCache, _usersFilter);
  } catch (err) {
    if (apiErr) { apiErr.textContent = 'Could not connect to server. Please try again.'; apiErr.style.display = ''; }
  } finally {
    if (btn) btn.disabled = false;
  }
}

function _esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function emailValid(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function passwordValid(p) {
  return p.length >= 6 &&
    /[a-zA-Z]/.test(p) &&
    /[0-9]/.test(p) &&
    /[@#$!%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p);
}

function togglePassVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  // swap icon: eye vs eye-off
  btn.innerHTML = isHidden
    ? `<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

function updatePassStrength(p) {
  const fill  = document.getElementById('pass-strength-fill');
  const label = document.getElementById('pass-strength-label');
  if (!fill || !label) return;
  let score = 0;
  if (p.length >= 6)                                                         score++;
  if (/[a-zA-Z]/.test(p))                                                   score++;
  if (/[0-9]/.test(p))                                                       score++;
  if (/[@#$!%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p))                    score++;
  if (p.length >= 12)                                                        score++;
  const levels = [
    { pct:0,   cls:'',       lbl:'' },
    { pct:20,  cls:'weak',   lbl:'Weak' },
    { pct:40,  cls:'weak',   lbl:'Weak' },
    { pct:60,  cls:'fair',   lbl:'Fair' },
    { pct:80,  cls:'good',   lbl:'Good' },
    { pct:100, cls:'strong', lbl:'Strong' },
  ];
  const lvl = levels[score];
  fill.style.width    = lvl.pct + '%';
  fill.className      = 'pass-strength-fill ' + lvl.cls;
  label.textContent   = lvl.lbl;
  label.className     = 'pass-strength-label ' + lvl.cls;
}

function savePassword() {
  const np = document.getElementById('profile-new-pass').value;
  const cp = document.getElementById('profile-confirm-pass').value;
  hideErr('profile-pass-err'); hideErr('profile-confirm-err');
  const msg = document.getElementById('profile-pass-msg');
  msg.style.display = 'none';
  let ok = true;
  if (!passwordValid(np)) {
    showErr('profile-pass-err', 'Min. 6 characters with a letter, number, and special character (e.g. @#$!).');
    ok = false;
  }
  if (np !== cp) { showErr('profile-confirm-err', 'Passwords do not match.'); ok = false; }
  if (!ok) return;
  currentUser.password = np;
  document.getElementById('profile-new-pass').value    = '';
  document.getElementById('profile-confirm-pass').value = '';
  msg.textContent    = '✓ Password updated successfully.';
  msg.className      = 'profile-msg success';
  msg.style.display  = 'block';
  setTimeout(() => { msg.style.display = 'none'; }, 3000);
}

function resetPassword() {
  const email = currentUser.email || document.getElementById('profile-email').value.trim();
  const msg   = document.getElementById('profile-pass-msg');
  msg.textContent   = `📧 Reset link sent to ${email || 'your email'}.`;
  msg.className     = 'profile-msg info';
  msg.style.display = 'block';
  setTimeout(() => { msg.style.display = 'none'; }, 4000);
}

function initSettings() {
  // Sync language
  document.querySelectorAll('.lang-card').forEach(c => c.classList.remove('active'));
  const card = document.getElementById('lang-' + currentLang);
  if (card) card.classList.add('active');
  // Sync theme
  _syncThemeUI();
}

// ────────────────────────────────────────────────────────
//  DASHBOARD — PERFORMANCE OVERVIEW, REAL-TIME & CHART
// ────────────────────────────────────────────────────────

function getLastWeekPeriod() {
  const now = new Date();
  const dow = now.getDay(); // 0 = Sun
  const daysToMon = dow === 0 ? 6 : dow - 1;
  const thisMon = new Date(now);
  thisMon.setDate(now.getDate() - daysToMon);
  thisMon.setHours(0, 0, 0, 0);
  const lastMon = new Date(thisMon);
  lastMon.setDate(thisMon.getDate() - 7);
  const lastSun = new Date(thisMon);
  lastSun.setDate(thisMon.getDate() - 1);
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(lastMon)} – ${fmt(lastSun)}, ${lastSun.getFullYear()}`;
}

function getLast7DayLabels() {
  const t = translations[currentLang];
  const dayKeys = ['day_sun','day_mon','day_tue','day_wed','day_thu','day_fri','day_sat'];
  const labels = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    if (i === 0) {
      labels.push(t.day_today || 'Today');
    } else {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      labels.push(t[dayKeys[d.getDay()]] || d.toLocaleDateString('en-US', { weekday: 'short' }));
    }
  }
  return labels;
}

function render7DayChart() {
  const wrap = document.getElementById('chats-7day-chart');
  if (!wrap) return;
  // Values sum to 312 (matches periodTotals.last7)
  const data   = [38, 44, 55, 41, 62, 48, 24];
  const labels = getLast7DayLabels();
  const W = 580, H = 180, padB = 32, padT = 20, padL = 8, padR = 8;
  const chartH = H - padB - padT;
  const n      = data.length;
  const max    = Math.max(...data);
  const barW   = (W - padL - padR - (n - 1) * 12) / n;

  // Detect current theme for text color
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textCol = isDark ? '#94a3b8' : '#64748b';
  const valCol  = isDark ? '#e2e8f0' : '#1e293b';

  const todayCol  = '#1a56db';
  const todayText = isDark ? '#60a5fa' : '#1a56db';

  let bars = '', vals = '', texts = '';
  data.forEach((v, i) => {
    const isToday = i === data.length - 1;
    const x  = padL + i * (barW + 12);
    const bh = (v / max) * chartH;
    const y  = padT + chartH - bh;
    const op = isToday ? '1' : (0.35 + 0.45 * (v / max)).toFixed(2);
    const fill = isToday ? todayCol : '#1a56db';
    bars  += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="${fill}" opacity="${op}"/>`;
    vals  += `<text x="${(x + barW / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="600" fill="${isToday ? todayCol : valCol}">${v}</text>`;
    texts += `<text x="${(x + barW / 2).toFixed(1)}" y="${(H - 8).toFixed(1)}" text-anchor="middle" font-size="${isToday ? 11 : 11}" font-weight="${isToday ? '700' : '400'}" fill="${isToday ? todayText : textCol}">${labels[i]}</text>`;
  });

  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${bars}${vals}${texts}</svg>`;
}

function renderCurMonthChart() {
  const wrap = document.getElementById('chats-curmonth-chart');
  if (!wrap) return;
  const data   = periodChartData.curMonth.bars;
  const t      = translations[currentLang];
  const wkStr  = t.lbl_wk || 'Wk';
  const W = 580, H = 180, padB = 32, padT = 20, padL = 8, padR = 8;
  const chartH = H - padB - padT;
  const n      = data.length;
  const max    = Math.max(...data.map(b => b.v));
  const barW   = (W - padL - padR - (n - 1) * 16) / n;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textCol = isDark ? '#94a3b8' : '#64748b';
  const valCol  = isDark ? '#e2e8f0' : '#1e293b';
  let bars = '', vals = '', texts = '';
  data.forEach((b, i) => {
    const label = b.l.replace(/^Wk/, wkStr);
    const x  = padL + i * (barW + 16);
    const bh = (b.v / max) * chartH;
    const y  = padT + chartH - bh;
    const op = (0.45 + 0.55 * (b.v / max)).toFixed(2);
    bars  += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="#8b5cf6" opacity="${op}"/>`;
    vals  += `<text x="${(x + barW / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="600" fill="${valCol}">${b.v}</text>`;
    texts += `<text x="${(x + barW / 2).toFixed(1)}" y="${(H - 8).toFixed(1)}" text-anchor="middle" font-size="11" fill="${textCol}">${label}</text>`;
  });
  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${bars}${vals}${texts}</svg>`;
}

// ────────────────────────────────────────────────────────
//  GLOBAL SEARCH
// ────────────────────────────────────────────────────────
const SEARCH_INDEX = [
  // Dashboard
  { icon:'📊', title:'Dashboard',              crumb:'Dashboard',                           page:'dashboard' },
  { icon:'📈', title:'Performance Overview',   crumb:'Dashboard → Performance Overview',    page:'dashboard' },
  { icon:'💬', title:'Total Chats',            crumb:'Dashboard → Performance Overview',    page:'dashboard' },
  { icon:'😊', title:'Satisfaction Rate',      crumb:'Dashboard → Performance Overview',    page:'dashboard' },
  { icon:'⏱', title:'Response Time',          crumb:'Dashboard → Performance Overview',    page:'dashboard' },
  { icon:'⚡', title:'Efficiency',             crumb:'Dashboard → Performance Overview',    page:'dashboard' },
  { icon:'🟢', title:'Customers Online',       crumb:'Dashboard → Real-time Overview',      page:'dashboard' },
  { icon:'💬', title:'Ongoing Chats',          crumb:'Dashboard → Real-time Overview',      page:'dashboard' },
  { icon:'👥', title:'Logged-in Agents',       crumb:'Dashboard → Real-time Overview',      page:'dashboard' },
  { icon:'📅', title:'Last 7-day Chart',       crumb:'Dashboard → Last 7 Days',             page:'dashboard' },
  { icon:'👤', title:'Agent Status Board',     crumb:'Dashboard → Agent Status Board',      page:'dashboard' },
  { icon:'🐛', title:'Platform Issues Tracker',crumb:'Dashboard → Platform Issues Tracker', page:'dashboard' },
  { icon:'📥', title:'Export Report',          crumb:'Dashboard → Export Report',           page:'dashboard' },
  // Live Chats
  { icon:'💬', title:'Live Chats',             crumb:'Live Chats',                          page:'livechats' },
  { icon:'💬', title:'Active Chats',           crumb:'Live Chats → Chatting',               page:'livechats' },
  { icon:'⏳', title:'Chat Queue',             crumb:'Live Chats → Queue',                  page:'livechats' },
  // Agent Management
  { icon:'👥', title:'Agent Management',       crumb:'Agent Management',                    page:'agents' },
  { icon:'➕', title:'Add New Agent',          crumb:'Agent Management → Add Agent',        page:'agents' },
  { icon:'🔍', title:'Agent Status',           crumb:'Agent Management → Agent Status',     page:'agents' },
  { icon:'☀️', title:'Day Shift Agents',       crumb:'Agent Management → Shifts',           page:'agents' },
  { icon:'🌙', title:'Night Shift Agents',     crumb:'Agent Management → Shifts',           page:'agents' },
  // Platform Issues
  { icon:'🐛', title:'Platform Issues',        crumb:'Platform Issues',                     page:'issues' },
  { icon:'📋', title:'To Do Issues',           crumb:'Platform Issues → To Do',             page:'issues', action:()=>{ showPage('issues'); setTimeout(()=>piFilterByStatus('todo'),100); } },
  { icon:'🔄', title:'In Progress Issues',     crumb:'Platform Issues → In Progress',       page:'issues', action:()=>{ showPage('issues'); setTimeout(()=>piFilterByStatus('inprogress'),100); } },
  { icon:'⏸', title:'Pending Issues',         crumb:'Platform Issues → Pending',           page:'issues', action:()=>{ showPage('issues'); setTimeout(()=>piFilterByStatus('pending'),100); } },
  { icon:'📅', title:'Postponed Issues',       crumb:'Platform Issues → Postponed',         page:'issues', action:()=>{ showPage('issues'); setTimeout(()=>piFilterByStatus('postponed'),100); } },
  { icon:'✅', title:'Resolved Issues',        crumb:'Platform Issues → Resolved',          page:'issues', action:()=>{ showPage('issues'); setTimeout(()=>piFilterByStatus('resolved'),100); } },
  { icon:'➕', title:'New Issue',             crumb:'Platform Issues → New Issue',          page:'issues', action:()=>{ showPage('issues'); setTimeout(openNewIssueModal,100); } },
  { icon:'📤', title:'Export Issues to Excel', crumb:'Platform Issues → Export Excel',      page:'issues' },
  // Tickets
  { icon:'🎫', title:'Tickets',               crumb:'Tickets',                              page:'tickets' },
  // Reports
  { icon:'📊', title:'Reports',               crumb:'Reports',                              page:'reports' },
  // Profile
  { icon:'👤', title:'My Profile',            crumb:'Profile',                              page:'profile' },
  { icon:'✏️', title:'Display Name',          crumb:'Profile → Personal Information',       page:'profile' },
  { icon:'📧', title:'Email Address',         crumb:'Profile → Personal Information',       page:'profile' },
  { icon:'☀️', title:'Day Shift',             crumb:'Profile → Work Shift',                 page:'profile' },
  { icon:'🌙', title:'Night Shift',           crumb:'Profile → Work Shift',                 page:'profile' },
  { icon:'🔒', title:'Password & Security',   crumb:'Profile → Password',                  page:'profile' },
  { icon:'🖼', title:'Upload Avatar',         crumb:'Profile → Profile Picture',            page:'profile' },
  { icon:'🖼', title:'Profile Picture',       crumb:'Profile → Avatar',                    page:'profile' },
  // Settings
  { icon:'⚙️', title:'Settings',             crumb:'Settings',                             page:'settings' },
  { icon:'🌐', title:'Language',              crumb:'Settings → Language',                  page:'settings' },
  { icon:'🎨', title:'Theme',                 crumb:'Settings → Theme',                     page:'settings' },
  // Notifications
  { icon:'🔔', title:'Notifications',         crumb:'Notifications',                        page:'notifications' },
];

let searchFocusedIdx = -1;

function buildDynamicSearchEntries(q) {
  const results = [];
  const lq = q.toLowerCase();
  // Agents
  agents.forEach(a => {
    const text = `${a.name} ${a.email} ${a.shift} ${a.status}`;
    if (text.toLowerCase().includes(lq)) {
      results.push({ icon:'👤', title: a.name, crumb:`Agent Management → ${a.email}`, page:'agents' });
    }
  });
  // Platform issues
  ensureIssueFields();
  platformIssues.forEach(issue => {
    const pm = PLATFORM_META[issue.platform] || { label: issue.platform };
    const text = `${issue.title} ${issue.summary || ''} ${pm.label} ${issue.reportedBy || ''}`;
    if (text.toLowerCase().includes(lq)) {
      const iid = issue.id;
      results.push({ icon:'🐛', title: issue.title, crumb:`Platform Issues → ${pm.label}`, page:'issues',
        action: () => { showPage('issues'); setTimeout(() => openIssueModal(iid), 150); } });
    }
  });
  // Tickets
  if (typeof tickets !== 'undefined') {
    tickets.forEach(t => {
      const text = `${t.subject} ${t.client?.name || ''} ${t.status}`;
      if (text.toLowerCase().includes(lq)) {
        results.push({ icon:'🎫', title: t.subject, crumb:`Tickets → ${t.client?.name || ''}`, page:'tickets' });
      }
    });
  }
  return results;
}

function highlight(text, q) {
  if (!q) return escHtml(text);
  const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi');
  return escHtml(text).replace(re, '<mark>$1</mark>');
}

function handleGlobalSearch(q) {
  const dropdown = document.getElementById('search-dropdown');
  const clearBtn = document.getElementById('search-clear-btn');
  clearBtn.style.display = q ? 'block' : 'none';
  searchFocusedIdx = -1;

  if (!q || q.trim().length < 1) {
    dropdown.classList.add('hidden');
    return;
  }
  const lq = q.trim().toLowerCase();

  // Static index matches
  const staticMatches = SEARCH_INDEX.filter(e =>
    e.title.toLowerCase().includes(lq) || (e.crumb || '').toLowerCase().includes(lq));

  // Dynamic matches
  const dynamicMatches = buildDynamicSearchEntries(lq);

  const all = [...staticMatches, ...dynamicMatches];

  if (all.length === 0) {
    dropdown.innerHTML = `<div class="search-no-results">No results for "<strong>${escHtml(q)}</strong>"</div>`;
    dropdown.classList.remove('hidden');
    return;
  }

  // Group by page
  const groups = {};
  all.forEach(r => {
    if (!groups[r.page]) groups[r.page] = [];
    groups[r.page].push(r);
  });

  const pageLabels = { dashboard:'Dashboard', agents:'Agent Management', livechats:'Live Chats',
    issues:'Platform Issues', tickets:'Tickets', reports:'Reports',
    settings:'Settings', profile:'Profile', notifications:'Notifications' };

  let html = '';
  let itemIdx = 0;
  Object.entries(groups).forEach(([page, items]) => {
    html += `<div class="search-section-label">${pageLabels[page] || page}</div>`;
    items.forEach(item => {
      html += `<div class="search-result-item" data-idx="${itemIdx}" onclick="searchNavigate(${itemIdx})">
        <div class="search-result-icon">${item.icon}</div>
        <div class="search-result-body">
          <div class="search-result-title">${highlight(item.title, q.trim())}</div>
          <div class="search-result-crumb">${escHtml(item.crumb)}</div>
        </div>
      </div>`;
      itemIdx++;
    });
  });

  // Store flattened for keyboard nav
  window._searchResults = all;
  dropdown.innerHTML = html;
  dropdown.classList.remove('hidden');
}

function searchNavigate(idx) {
  const results = window._searchResults || [];
  const item = results[idx];
  if (!item) return;
  closeSearch();
  if (item.action) {
    item.action();
  } else {
    showPage(item.page);
    const navEl = document.querySelector(`.nav-item[data-page="${item.page}"]`);
    if (navEl) navClick(navEl);
  }
}

function searchKeyNav(e) {
  const dropdown = document.getElementById('search-dropdown');
  if (dropdown.classList.contains('hidden')) return;
  const items = dropdown.querySelectorAll('.search-result-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    searchFocusedIdx = Math.min(searchFocusedIdx + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    searchFocusedIdx = Math.max(searchFocusedIdx - 1, 0);
  } else if (e.key === 'Enter') {
    if (searchFocusedIdx >= 0) { e.preventDefault(); searchNavigate(searchFocusedIdx); return; }
  } else if (e.key === 'Escape') {
    closeSearch(); return;
  } else return;
  items.forEach((el, i) => el.classList.toggle('focused', i === searchFocusedIdx));
  items[searchFocusedIdx]?.scrollIntoView({ block:'nearest' });
}

function clearSearch() {
  const inp = document.getElementById('global-search-input');
  inp.value = '';
  closeSearch();
  inp.focus();
}

function closeSearch() {
  document.getElementById('search-dropdown').classList.add('hidden');
  document.getElementById('search-clear-btn').style.display = 'none';
  searchFocusedIdx = -1;
}

// Close on outside click
document.addEventListener('click', e => {
  const wrap = document.getElementById('header-search-wrap');
  const drop = document.getElementById('search-dropdown');
  if (wrap && drop && !wrap.contains(e.target) && !drop.contains(e.target)) {
    closeSearch();
  }
});

// ────────────────────────────────────────────────────────
//  EXPORT REPORT
// ────────────────────────────────────────────────────────
function exportDashboardReport() {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  const period  = getLastWeekPeriod();

  const customersOnline = document.getElementById('rt-customers')?.textContent || '—';
  const ongoingChats    = document.getElementById('rt-ongoing')?.textContent   || '—';
  const loggedAgents    = document.getElementById('rt-agents')?.textContent    || '—';
  const activeChats     = document.getElementById('stat-active')?.textContent  || '14';

  const data7  = [38, 44, 55, 41, 62, 48, 24];
  const labels = getLast7DayLabels();
  const total7 = data7.reduce((s, v) => s + v, 0);
  const max7   = Math.max(...data7);

  const agentRows = agents.map(a => `
    <tr>
      <td><strong>${a.name}</strong></td>
      <td>${a.shift === 'day' ? '☀️ Day' : '🌙 Night'}</td>
      <td><span class="badge badge-${a.status}">${a.status.charAt(0).toUpperCase()+a.status.slice(1)}</span></td>
      <td>${a.chats} / ${a.maxChats}</td>
      <td><div class="bar-bg"><div class="bar-fill" style="width:${Math.round(a.chats/a.maxChats*100)}%"></div></div></td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OpoSupportDesk — Dashboard Report</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Roboto,Arial,sans-serif;background:#f3f4ff;color:#1a1c22;font-size:14px;line-height:1.5}
  .page{max-width:960px;margin:32px auto;padding:0 24px 48px}

  /* ── Header ── */
  .rpt-header{background:linear-gradient(135deg,#1a56db 0%,#3b6fe0 100%);color:#fff;border-radius:16px;padding:32px 36px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
  .rpt-header h1{font-size:22px;font-weight:800;letter-spacing:-.3px}
  .rpt-header .sub{font-size:12px;opacity:.75;margin-top:4px}
  .rpt-header .period{display:inline-block;background:rgba(255,255,255,.18);border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;margin-top:10px;letter-spacing:.04em}
  .rpt-header .meta{text-align:right;font-size:12px;opacity:.85;line-height:1.8;flex-shrink:0}
  .rpt-header .meta strong{font-size:13px;display:block;opacity:1}

  /* ── Section cards ── */
  .section{background:#fff;border-radius:14px;box-shadow:0 1px 6px rgba(0,0,0,.07);margin-bottom:20px;overflow:hidden}
  .section-title{padding:14px 22px;border-bottom:1px solid #eef0f6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#64748b;display:flex;align-items:center;gap:8px}
  .section-body{padding:22px}

  /* ── RT grid ── */
  .rt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
  .rt-card{background:#f8f9ff;border-radius:10px;padding:16px 18px;display:flex;align-items:center;gap:14px}
  .rt-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
  .rt-icon.gray{background:#f1f5f9}.rt-icon.blue{background:#dbeafe}.rt-icon.green{background:#d1fae5}
  .rt-lbl{font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em}
  .rt-val{font-size:26px;font-weight:800;color:#1a1c22;line-height:1;margin-top:2px}

  /* ── KPI grid ── */
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  .kpi-card{background:#f8f9ff;border-radius:10px;padding:18px;border-top:3px solid}
  .kpi-card.blue{border-color:#1a56db}.kpi-card.green{border-color:#10b981}.kpi-card.yellow{border-color:#f59e0b}.kpi-card.purple{border-color:#8b5cf6}
  .kpi-lbl{font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
  .kpi-val{font-size:30px;font-weight:800;line-height:1;color:#1a1c22}
  .kpi-delta{font-size:11px;font-weight:600;margin-top:7px}
  .kpi-card.blue .kpi-delta{color:#1a56db}.kpi-card.green .kpi-delta{color:#10b981}
  .kpi-card.yellow .kpi-delta{color:#b45309}.kpi-card.purple .kpi-delta{color:#8b5cf6}

  /* ── Tables ── */
  table{width:100%;border-collapse:collapse}
  th{background:#f8f9ff;text-align:left;padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;border-bottom:1px solid #eef0f6}
  td{padding:11px 14px;border-bottom:1px solid #f5f6fb;font-size:13px;vertical-align:middle;color:#374151}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#fafbff}

  /* ── Perf table change column ── */
  .up{color:#10b981;font-weight:600}.down{color:#ef4444;font-weight:600}.neu{color:#64748b;font-weight:600}

  /* ── Badges ── */
  .badge{display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600}
  .badge-online{background:#d1fae5;color:#059669}.badge-busy{background:#fee2e2;color:#dc2626}
  .badge-away{background:#fef3c7;color:#b45309}.badge-offline{background:#f1f5f9;color:#64748b}
  .badge-good{background:#d1fae5;color:#059669}.badge-warn{background:#fef3c7;color:#b45309}

  /* ── Bar chart (7-day) ── */
  .bar-bg{background:#e8eaf0;border-radius:6px;height:10px;width:160px}
  .bar-fill{background:#1a56db;border-radius:6px;height:10px;transition:width .3s}
  .day-val{font-weight:700;color:#1a56db;text-align:right;min-width:40px}

  /* ── Footer ── */
  .rpt-footer{text-align:center;color:#94a3b8;font-size:11px;padding:28px 0 0;border-top:1px solid #eef0f6;margin-top:8px}

  @media print{
    body{background:#fff}
    .page{margin:0;padding:16px}
    .section{box-shadow:none;border:1px solid #eef0f6;break-inside:avoid}
    .rpt-header{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  }
</style>
</head>
<body>
<div class="page">

  <div class="rpt-header">
    <div>
      <h1>📊 Dashboard Report</h1>
      <div class="sub">OpoSupportDesk — Chat Support Manager</div>
      <div class="period">Period: ${period}</div>
    </div>
    <div class="meta">
      <strong>${dateStr}</strong>
      Generated at ${timeStr}<br>
      Exported by ${currentUser?.name || 'Support Manager'}
    </div>
  </div>

  <div class="section">
    <div class="section-title">🔴 Live Snapshot at Export Time</div>
    <div class="section-body">
      <div class="rt-grid">
        <div class="rt-card"><div class="rt-icon gray">👥</div><div><div class="rt-lbl">Customers Online</div><div class="rt-val">${customersOnline}</div></div></div>
        <div class="rt-card"><div class="rt-icon blue">💬</div><div><div class="rt-lbl">Ongoing Chats</div><div class="rt-val">${ongoingChats}</div></div></div>
        <div class="rt-card"><div class="rt-icon green">👤</div><div><div class="rt-lbl">Logged-in Agents</div><div class="rt-val">${loggedAgents}</div></div></div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📈 Today's Key Metrics</div>
    <div class="section-body">
      <div class="kpi-grid">
        <div class="kpi-card blue"><div class="kpi-lbl">Active Chats</div><div class="kpi-val">${activeChats}</div><div class="kpi-delta">↑ +12% vs yesterday</div></div>
        <div class="kpi-card green"><div class="kpi-lbl">Agents Online</div><div class="kpi-val">8</div><div class="kpi-delta">+2 from last shift</div></div>
        <div class="kpi-card yellow"><div class="kpi-lbl">Avg. First Response</div><div class="kpi-val">1:42</div><div class="kpi-delta">Target: under 2 min</div></div>
        <div class="kpi-card purple"><div class="kpi-lbl">CSAT Score</div><div class="kpi-val">94%</div><div class="kpi-delta">↑ +3% vs last week</div></div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">⚡ Performance Overview — ${period}</div>
    <div class="section-body">
      <table>
        <thead><tr><th>Metric</th><th>Value</th><th>Change</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Total Chats</td><td><strong>427</strong></td><td class="up">↑ +8%</td><td><span class="badge badge-good">On Track</span></td></tr>
          <tr><td>Chat Satisfaction</td><td><strong>94%</strong></td><td class="up">↑ +3%</td><td><span class="badge badge-good">Excellent</span></td></tr>
          <tr><td>Avg. Response Time</td><td><strong>1m 38s</strong></td><td class="up">↓ −12%</td><td><span class="badge badge-good">Improved</span></td></tr>
          <tr><td>Agent Efficiency</td><td><strong>87%</strong></td><td class="up">↑ +5%</td><td><span class="badge badge-good">Good</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📅 Last 7 Days — Total Chats &nbsp;<span style="font-weight:400;text-transform:none;letter-spacing:0;color:#1a1c22">${total7} total</span></div>
    <div class="section-body">
      <table>
        <thead><tr><th>Day</th><th>Volume</th><th style="text-align:right">Chats</th></tr></thead>
        <tbody>
          ${labels.map((lbl, i) => `<tr><td><strong>${lbl}</strong></td><td><div class="bar-bg"><div class="bar-fill" style="width:${Math.round(data7[i]/max7*100)}%"></div></div></td><td class="day-val">${data7[i]}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-title">👥 Agent Status Board</div>
    <div class="section-body">
      <table>
        <thead><tr><th>Agent</th><th>Shift</th><th>Status</th><th>Chats</th><th>Load</th></tr></thead>
        <tbody>${agentRows}</tbody>
      </table>
    </div>
  </div>

  <div class="rpt-footer">
    Generated by <strong>OpoSupportDesk</strong> &nbsp;·&nbsp; ${dateStr} at ${timeStr} &nbsp;·&nbsp; Data captured at time of export
  </div>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `oposupportdesk-report-${now.toISOString().slice(0,10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function startRealTimeSim() {
  if (_rtInterval) clearInterval(_rtInterval);
  function tick() {
    const ce = document.getElementById('rt-customers');
    const oe = document.getElementById('rt-ongoing');
    const ae = document.getElementById('rt-agents');
    if (!ce) return;
    ce.textContent = 28 + Math.floor(Math.random() * 22);
    oe.textContent = 10 + Math.floor(Math.random() * 10);
    ae.textContent = agents.filter(a => a.status !== 'offline').length;
  }
  tick();
  _rtInterval = setInterval(tick, 5000);
}

function initDashboardOverview() {
  // Performance period label
  const perfEl = document.getElementById('perf-period-label');
  if (perfEl) perfEl.textContent = 'Last week · ' + getLastWeekPeriod();

  // Chart period label
  const chartEl = document.getElementById('chart-7days-period');
  if (chartEl) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    const fmt = d => d.toLocaleDateString(_getLangLocale(), { month: 'short', day: 'numeric' });
    chartEl.textContent = `${fmt(start)} – ${fmt(now)}`;
  }

  // Current month period label
  const monthEl = document.getElementById('chart-curmonth-period');
  if (monthEl) {
    const now = new Date();
    monthEl.textContent = now.toLocaleDateString(_getLangLocale(), { month: 'long', year: 'numeric' });
  }

  render7DayChart();
  renderCurMonthChart();
  startRealTimeSim();
}

// ────────────────────────────────────────────────────────
//  SESSION TIMEOUT — 10-min inactivity auto-logout
// ────────────────────────────────────────────────────────
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;   // 10 minutes
const IDLE_WARN_MS    =  9 * 60 * 1000;   // warn after 9 minutes
const IDLE_EVENTS     = ['mousemove','mousedown','keydown','touchstart','scroll','click'];

let _idleTimer    = null;
let _warnTimer    = null;
let _cdInterval   = null;

function _startIdleTimers() {
  _clearIdleTimers();
  _warnTimer = setTimeout(_showIdleWarning, IDLE_WARN_MS);
  _idleTimer = setTimeout(forceLogout,      IDLE_TIMEOUT_MS);
}

function _clearIdleTimers() {
  clearTimeout(_idleTimer);
  clearTimeout(_warnTimer);
  clearInterval(_cdInterval);
}

function _resetIdleTimers() {
  // Only act when the app is visible and the warning is not already showing
  if (document.getElementById('app').classList.contains('hidden')) return;
  if (!document.getElementById('idle-warning').classList.contains('hidden')) return;
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  _startIdleTimers();
}

function _showIdleWarning() {
  clearInterval(_cdInterval);
  let remaining = 60;
  const el = document.getElementById('idle-countdown');
  if (el) el.textContent = remaining;

  const overlay = document.getElementById('idle-warning');
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('idle-overlay--visible'));

  _cdInterval = setInterval(() => {
    remaining--;
    if (el) el.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(_cdInterval);
      forceLogout();
    }
  }, 1000);

  // Hard cutoff after exactly 60 s in case interval drifts
  _idleTimer = setTimeout(forceLogout, 60 * 1000);
}

function dismissIdleWarning() {
  const overlay = document.getElementById('idle-warning');
  overlay.classList.remove('idle-overlay--visible');
  overlay.addEventListener('transitionend', () => overlay.classList.add('hidden'), { once: true });
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  _startIdleTimers();          // fresh 10-minute window
}

function forceLogout() {
  _clearIdleTimers();
  const overlay = document.getElementById('idle-warning');
  if (overlay) { overlay.classList.add('hidden'); overlay.classList.remove('idle-overlay--visible'); }
  handleLogout();
}

// Attach activity listeners once (passive for performance)
IDLE_EVENTS.forEach(evt =>
  document.addEventListener(evt, _resetIdleTimers, { passive: true })
);

// ────────────────────────────────────────────────────────
//  SESSION RESTORE — runs once after all functions defined
// ────────────────────────────────────────────────────────
(function restoreSession() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(e) {}
  if (!saved || !saved.name || !saved.email) return;

  // Check how long the user has been inactive
  const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
  if (lastActivity) {
    const elapsed = Date.now() - lastActivity;
    if (elapsed >= IDLE_TIMEOUT_MS) {
      // Inactive for 10+ minutes — treat as expired session
      clearSession();
      return;
    }
  }

  currentUser = {
    id:           saved.id           ?? null,
    name:         saved.name,
    email:        saved.email,
    role:         saved.role         || 'agent',
    status:       saved.status       || 'pending',
    avatarCustom: saved.avatarCustom || null,
    avatarIdx:    saved.avatarIdx    ?? null,
    shift:        saved.shift        || 'day'
  };

  if (saved.status === 'pending')  { _showPendingScreen(saved.name, saved.email);  return; }
  if (saved.status === 'rejected') { _showRejectedScreen(saved.name, saved.email); return; }

  _applyUserToDOM();

  // If lastActivity is known, override timers with the actual remaining window
  if (lastActivity) {
    const elapsed    = Date.now() - lastActivity;
    const remaining  = IDLE_TIMEOUT_MS - elapsed;
    const warnIn     = IDLE_WARN_MS    - elapsed;
    _clearIdleTimers();
    _idleTimer = setTimeout(forceLogout, remaining);
    if (warnIn > 0) {
      _warnTimer = setTimeout(_showIdleWarning, warnIn);
    } else {
      _showIdleWarning();
    }
  }
})();
