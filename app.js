// ────────────────────────────────────────────────────────
//  DATA
// ────────────────────────────────────────────────────────
const COLORS = ['#1a56db','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316','#6366f1','#14b8a6','#a855f7','#0ea5e9'];

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
//  AUTH
// ────────────────────────────────────────────────────────
let currentUser = {};

function showScreen(s) {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('signup-screen').classList.add('hidden');
  document.getElementById(s + '-screen').classList.remove('hidden');
}

function showErr(id, msg) { const e=document.getElementById(id); e.textContent=msg; e.style.display='block'; }
function hideErr(id) { const e=document.getElementById(id); if(e) e.style.display='none'; }

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  let ok = true;
  hideErr('login-email-err'); hideErr('login-pass-err');
  if (!email || !email.includes('@')) { showErr('login-email-err','Please enter a valid email address.'); ok=false; }
  if (!pass) { showErr('login-pass-err','Please enter your password.'); ok=false; }
  if (ok) {
    const localPart = email.split('@')[0].replace(/[._]/g,' ');
    const name = localPart.split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ') || 'User';
    enterDashboard(name, email);
  }
}

function handleSignup(e) {
  e.preventDefault();
  const name  = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const pass  = document.getElementById('su-password').value;
  let ok = true;
  hideErr('su-name-err'); hideErr('su-email-err'); hideErr('su-pass-err');
  if (!name)              { showErr('su-name-err','Please enter your full name.'); ok=false; }
  if (!email||!email.includes('@')) { showErr('su-email-err','Please enter a valid email address.'); ok=false; }
  if (pass.length < 6)   { showErr('su-pass-err','Password must be at least 6 characters.'); ok=false; }
  if (ok) enterDashboard(name, email);
}

function enterDashboard(name, email) {
  currentUser = { name, email };
  const initials = name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('header-avatar').textContent  = initials;
  document.getElementById('sidebar-avatar').textContent = initials;
  document.getElementById('header-name').textContent    = name;
  document.getElementById('sidebar-name').textContent   = name;
  document.getElementById('greeting-name').textContent  = name.split(' ')[0];
  const now = new Date();
  document.getElementById('today-date').textContent =
    now.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  document.getElementById('auth-wrap').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  showPage('dashboard');
}

function handleLogout() {
  if (!confirm('Sign out of ForexDesk?')) return;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-wrap').classList.remove('hidden');
  showScreen('login');
  document.getElementById('login-form').reset();
}

// ────────────────────────────────────────────────────────
//  PAGE SWITCHING
// ────────────────────────────────────────────────────────
const PAGE_TITLES = { dashboard:'Dashboard', agents:'Agent Management' };

function showPage(pageId) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.remove('hidden');
  document.getElementById('header-title').textContent = PAGE_TITLES[pageId] || 'Dashboard';
  if (pageId === 'agents') renderAgents(currentFilter);
}

function navClick(el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  const page = el.dataset.page;
  if (page) showPage(page);
}

function navToAgents() {
  const agentNav = document.querySelector('[data-page="agents"]');
  if (agentNav) navClick(agentNav);
}

// ────────────────────────────────────────────────────────
//  AGENT MANAGEMENT
// ────────────────────────────────────────────────────────
function filterAgents(btn, filter) {
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = filter;
  renderAgents(filter);
}

function getFilteredAgents(filter) {
  if (filter === 'day')     return agents.filter(a => a.shift === 'day');
  if (filter === 'night')   return agents.filter(a => a.shift === 'night');
  if (filter === 'online')  return agents.filter(a => a.status === 'online');
  if (filter === 'busy')    return agents.filter(a => a.status === 'busy');
  if (filter === 'away')    return agents.filter(a => a.status === 'away');
  if (filter === 'offline') return agents.filter(a => a.status === 'offline');
  return agents;
}

function updateTabCounts() {
  document.getElementById('count-all').textContent    = agents.length;
  document.getElementById('count-day').textContent    = agents.filter(a=>a.shift==='day').length;
  document.getElementById('count-night').textContent  = agents.filter(a=>a.shift==='night').length;
  document.getElementById('count-online').textContent  = agents.filter(a=>a.status==='online').length;
  document.getElementById('count-busy').textContent    = agents.filter(a=>a.status==='busy').length;
  document.getElementById('count-away').textContent    = agents.filter(a=>a.status==='away').length;
  document.getElementById('count-offline').textContent = agents.filter(a=>a.status==='offline').length;
  document.getElementById('agents-sub').textContent   =
    `${agents.length} agents · ${agents.filter(a=>a.shift==='day').length} day · ${agents.filter(a=>a.shift==='night').length} night`;
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
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);font-size:15px">No agents match this filter.</div>`;
    return;
  }

  grid.innerHTML = list.map(a => {
    const pct    = a.chats / a.maxChats;
    const barClr = loadBarColor(pct);
    const svg    = avatarSVG(a.gender, a.color);
    return `
    <div class="agent-card">
      <div class="agent-card-stripe ${a.shift}"></div>
      <div class="agent-card-body">

        <div class="agent-avatar-wrap">
          <div class="agent-avatar-img">${svg}</div>
          <div class="agent-status-dot ${a.status}" title="${STATUS_LABELS[a.status]}"></div>
        </div>

        <div class="agent-name">${escHtml(a.name)}</div>
        <div class="agent-email">${escHtml(a.email)}</div>

        <span class="shift-badge ${a.shift}">${SHIFT_ICONS[a.shift]} ${a.shift === 'day' ? 'Day Shift' : 'Night Shift'}</span>

        <div class="agent-status-row">
          <span class="agent-status-label ${a.status}">${STATUS_LABELS[a.status]}</span>
          ${a.status !== 'offline' ? `<span style="color:var(--text-muted);font-size:11px">· ${a.chats}/${a.maxChats} chats</span>` : ''}
        </div>

        <div class="agent-load-row">
          <div class="agent-load-header">
            <span>Chat load</span>
            <span>${a.status === 'offline' ? '—' : Math.round(pct*100) + '%'}</span>
          </div>
          <div class="agent-load-track">
            <div class="agent-load-fill" style="width:${a.status==='offline'?0:Math.round(pct*100)}%;background:${barClr}"></div>
          </div>
        </div>

        <button class="btn-edit" onclick="openEditModal(${a.id})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit Agent
        </button>
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

  document.getElementById('modal-title').textContent = isNew ? 'Add New Agent' : 'Edit Agent';
  document.querySelector('.btn-primary[onclick="saveAgent()"]').textContent = isNew ? 'Add Agent' : 'Save Changes';

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

function selectShift(btn) {
  document.querySelectorAll('.shift-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function closeEditModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function closeModalOnBackdrop(e) {
  if (e.target === document.getElementById('modal-overlay')) closeEditModal();
}

function saveAgent() {
  const name   = document.getElementById('modal-name').value.trim();
  const email  = document.getElementById('modal-email').value.trim();
  const status = document.getElementById('modal-status').value;
  const gender = document.querySelector('.gender-btn.active')?.dataset.gender || 'female';
  const shift  = document.querySelector('.shift-btn.active')?.dataset.shift  || 'day';

  let ok = true;
  hideErr('modal-name-err'); hideErr('modal-email-err');
  if (!name)  { showErr('modal-name-err','Please enter a name.'); ok=false; }
  if (!email || !email.includes('@')) { showErr('modal-email-err','Please enter a valid email.'); ok=false; }
  if (!ok) return;

  if (editingId === null) {
    // Add new agent
    agents.push({
      id: nextId++, name, email, shift, status, gender,
      chats: status === 'offline' ? 0 : Math.floor(Math.random()*3),
      maxChats: 5,
      color: COLORS[(agents.length) % COLORS.length]
    });
  } else {
    // Update existing
    const a = agents.find(ag => ag.id === editingId);
    if (a) { a.name = name; a.email = email; a.shift = shift; a.status = status; a.gender = gender; }
  }

  closeEditModal();
  renderAgents(currentFilter);
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
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeEditModal(); });
