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
  updateNotifDot();
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
const PAGE_TITLES = { dashboard:'Dashboard', agents:'Agent Management', livechats:'Live Chats', issues:'Platform Issues', tickets:'Tickets', reports:'Reports', settings:'Settings', notifications:'Notifications' };

function showPage(pageId) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.remove('hidden');
  const t = translations[currentLang];
  document.getElementById('header-title').textContent = (t && t['page_' + pageId]) || PAGE_TITLES[pageId] || 'Dashboard';
  if (pageId === 'agents')        renderAgents(currentFilter);
  if (pageId === 'livechats')     renderLiveChats();
  if (pageId === 'issues')        renderIssues(currentIssueFilter);
  if (pageId === 'tickets')       renderTicketList(currentTicketFilter);
  if (pageId === 'reports')       initReports();
  if (pageId === 'settings')      initSettings();
  if (pageId === 'notifications') renderNotifPage();
  if (pageId === 'dashboard')     initDashboardOverview();
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

function navToIssues() {
  const issuesNav = document.querySelector('[data-page="issues"]');
  if (issuesNav) navClick(issuesNav);
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
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeEditModal(); closeSupervisePanel(); closeIssueModal(); }
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
//  REPORTS — STATE
// ────────────────────────────────────────────────────────
let rptActiveSub  = 'total-chats';
let tcPeriod = 'today', csPeriod = 'today', apPeriod = 'today';
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
  if (tabId === 'total-chats')  renderTotalChats();
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
  const W = 700, H = 200, padL = 44, padB = 28, padT = 12, padR = 10;
  const cW = W - padL - padR, cH = H - padB - padT;
  const max = Math.max(...bars.map(b => b.v), 1);
  const bW  = Math.max(8, Math.min(40, cW / bars.length - 8));
  const slot = cW / bars.length;
  let svgBars = '', svgLabels = '', svgGrid = '';

  [0,.25,.5,.75,1].forEach(pct => {
    const y = padT + cH * (1 - pct);
    const val = Math.round(max * pct);
    svgGrid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="${pct===0?'#e2e8f0':'#f1f5f9'}" stroke-width="1"/>`;
    svgGrid += `<text x="${padL - 5}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="9" fill="#94a3b8">${val}</text>`;
  });

  bars.forEach((b, i) => {
    const bH = (b.v / max) * cH;
    const x  = padL + slot * i + (slot - bW) / 2;
    const y  = padT + cH - bH;
    svgBars   += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bW}" height="${bH.toFixed(1)}" fill="${color}" rx="3"><title>${b.l}: ${b.v}</title></rect>`;
    svgLabels += `<text x="${(x + bW/2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="9" fill="#94a3b8">${b.l}</text>`;
  });

  document.getElementById(containerId).innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${svgGrid}${svgBars}${svgLabels}</svg>`;
}

// ────────────────────────────────────────────────────────
//  REPORTS — SVG DONUT CHART
// ────────────────────────────────────────────────────────
function renderDonut(containerId, pct, color) {
  const r = 52, cx = 70, cy = 70, circ = 2 * Math.PI * r;
  const filled = circ * (pct / 100);
  document.getElementById(containerId).innerHTML =
    `<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" style="width:100%">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="14"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="14"
        stroke-dasharray="${filled.toFixed(2)} ${circ.toFixed(2)}"
        stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy-8}" text-anchor="middle" font-size="24" font-weight="800" fill="#0f172a">${pct}%</text>
      <text x="${cx}" y="${cy+12}" text-anchor="middle" font-size="10" fill="#64748b">Satisfaction</text>
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

  const periodLabelMap = { today:'Today', yesterday:'Yesterday', last7:'Last 7 Days', curMonth:'Current Month', lastMonth:'Last Month', curYear:'Current Year', total:'All Time' };

  // KPIs
  const avgPerBar = total / adjBars.length;
  const peakBar   = adjBars.reduce((a,b) => b.v > a.v ? b : a);
  const prevTotal = Math.round(total * (1 + seededVal(agentId||0, -12, 15) / 100));
  const deltaDir  = total >= prevTotal ? 'up' : 'down';
  const deltaPct  = Math.abs(Math.round((total - prevTotal) / Math.max(prevTotal,1) * 100));

  document.getElementById('tc-kpis').innerHTML = [
    { icon:'chat', cls:'blue',   val: total.toLocaleString(), lbl:'Total Chats',   delta:`${deltaDir==='up'?'↑':'↓'} ${deltaPct}%`, dCls: deltaDir },
    { icon:'avg',  cls:'green',  val: avgPerBar.toFixed(1),   lbl:`Avg / ${data.xLabel}`, delta:'vs prev', dCls:'neu' },
    { icon:'peak', cls:'orange', val: peakBar.v,              lbl:`Peak (${peakBar.l})`, delta:'Highest', dCls:'neu' },
    { icon:'rate', cls:'purple', val: ((total / Math.max(periodTotals[period],1))*100).toFixed(0)+'%', lbl:'Share of Team', delta: agentId ? agents.find(a=>a.id===agentId)?.name.split(' ')[0]||'' : 'All agents', dCls:'neu' },
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
        <span class="rpt-kpi-delta ${k.dCls}">${k.delta}</span>
      </div>
      <div class="rpt-kpi-value">${k.val}</div>
      <div class="rpt-kpi-label">${k.lbl}</div>
    </div>`;
  }).join('');

  const agentLabel = agentId ? ` — ${agents.find(a=>a.id===agentId)?.name || ''}` : '';
  document.getElementById('tc-chart-title').textContent = `Total Chats — ${periodLabelMap[period]}${agentLabel}`;
  document.getElementById('tc-chart-sub').textContent   = `${total.toLocaleString()} chats · per ${data.xLabel.toLowerCase()}`;

  renderBarChart('tc-chart', adjBars, '#1a56db');
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
  document.getElementById('cs-legend').innerHTML = `
    <div class="rpt-legend-row"><div class="rpt-legend-dot" style="background:#10b981"></div><span>Positive</span><span class="rpt-legend-val">${positive}</span></div>
    <div class="rpt-legend-row"><div class="rpt-legend-dot" style="background:#ef4444"></div><span>Negative</span><span class="rpt-legend-val">${negative}</span></div>
    <div class="rpt-legend-row"><div class="rpt-legend-dot" style="background:#94a3b8"></div><span>No rating</span><span class="rpt-legend-val">${Math.round(positive * .08)}</span></div>`;

  // KPI cards
  const npsScore = Math.round(csat - 35);
  document.getElementById('cs-kpis').innerHTML = [
    { val:`${csat}%`,         lbl:'CSAT Score',       cls:'green',  delta: csat>=90?'↑ Excellent':'↑ Good', dCls: csat>=90?'up':'neu' },
    { val:`${positive}`,      lbl:'Positive Ratings',  cls:'blue',   delta:'😊 Happy clients', dCls:'up' },
    { val:`${negative}`,      lbl:'Negative Ratings',  cls:'orange', delta: negative>5?'↑ Review needed':'↓ Low', dCls: negative>5?'down':'up' },
    { val:`${npsScore}`,      lbl:'NPS Score',         cls:'purple', delta: npsScore>=50?'↑ Promoters':'Passives', dCls: npsScore>=50?'up':'neu' },
  ].map(k => `<div class="rpt-kpi-card">
    <div class="rpt-kpi-top"><div class="rpt-kpi-icon ${k.cls}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div>
      <span class="rpt-kpi-delta ${k.dCls}">${k.delta}</span></div>
    <div class="rpt-kpi-value">${k.val}</div>
    <div class="rpt-kpi-label">${k.lbl}</div>
  </div>`).join('');

  // Trend chart (satisfaction % over bars)
  const trendBars = satTrendData[period].bars;
  const agentTrend = trendBars.map(b => ({
    l: b.l,
    v: Math.min(100, Math.max(70, b.v + (agentId ? (agentBaseSat[agentId]-92) : 0)))
  }));

  const periodLabelMap = { today:'Today', yesterday:'Yesterday', last7:'Last 7 Days', curMonth:'Current Month', lastMonth:'Last Month', curYear:'Current Year', total:'All Time' };
  const agentLabel = agentId ? ` — ${agents.find(a=>a.id===agentId)?.name || ''}` : '';
  document.getElementById('cs-chart-title').textContent = `Satisfaction Trend — ${periodLabelMap[period]}${agentLabel}`;
  document.getElementById('cs-chart-sub').textContent   = `CSAT % per ${satTrendData[period].bars.length > 7 ? 'month' : period==='last7'?'day':'hour'}`;

  renderBarChart('cs-chart', agentTrend, '#10b981');
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

  document.getElementById('rpt-perf-tbody').innerHTML = rows.map((r, idx) => {
    const satColor = r.satisfaction >= 93 ? '#10b981' : r.satisfaction >= 85 ? '#f59e0b' : '#ef4444';
    const initials = r.name.split(' ').map(w=>w[0]).join('').slice(0,2);
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
    </tr>`;
  }).join('');
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
  // Update counts
  document.getElementById('lc-queue-count').textContent  = queueChats.length;
  document.getElementById('lc-active-count').textContent = activeChats.length;
  document.getElementById('lc-queue-badge').textContent  = queueChats.length;
  document.getElementById('lc-active-badge').textContent = activeChats.length;
  document.getElementById('lc-sub').textContent =
    `${queueChats.length} in queue · ${activeChats.length} ongoing`;
  document.getElementById('nav-livechats-badge').textContent =
    queueChats.length + activeChats.length;

  // Render queue
  const qList = document.getElementById('lc-queue-list');
  if (queueChats.length === 0) {
    qList.innerHTML = `<div class="lc-empty">No chats waiting in queue.</div>`;
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
          <span class="lc-wait-tag ${urgency}">⏱ ${c.waitMins}m waiting</span>
        </div>
        <button class="btn-pickup" onclick="pickUpChat('${c.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Pick Up
        </button>
      </div>`;
    }).join('');
  }

  // Render active chats
  const aList = document.getElementById('lc-active-list');
  if (activeChats.length === 0) {
    aList.innerHTML = `<div class="lc-empty">No active chats right now.</div>`;
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
          Supervise
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
  document.getElementById('sv-meta').textContent =
    `Agent: ${agentName} · ${chat.channel} · ${chat.durationMins}m ongoing`;

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

function closeSuperviseOnBackdrop(e) {
  if (e.target === document.getElementById('supervise-overlay')) closeSupervisePanel();
}

// ────────────────────────────────────────────────────────
//  PLATFORM ISSUES DATA
// ────────────────────────────────────────────────────────
const PLATFORM_META = {
  mt4:       { label:'MT4',        icon:'💻', cls:'mt4'       },
  webtrader: { label:'WebTrader',  icon:'🌐', cls:'webtrader' },
  mobile:    { label:'Mobile App', icon:'📱', cls:'mobile'    },
  web:       { label:'Web Portal', icon:'🖥️', cls:'web'       },
  payment:   { label:'Payments',   icon:'💳', cls:'payment'   },
  email:     { label:'Email / SMS',icon:'📧', cls:'email'     },
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
    description:'Since the iOS 17.4 system update rolled out on Monday, 8 clients have reported that the ForexDesk mobile app crashes immediately when attempting to open the full-screen chart view. The crash does not occur on iOS 17.3 or earlier, or on Android. The crash log points to a rendering conflict in the WebKit chart library used by the app. A workaround (using the condensed chart view) is available.',
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

let currentIssueFilter = 'all';

// ────────────────────────────────────────────────────────
//  PLATFORM ISSUES RENDER
// ────────────────────────────────────────────────────────
function filterIssues(btn, filter) {
  document.querySelectorAll('#pi-filter-bar .filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentIssueFilter = filter;
  renderIssues(filter);
}

function renderIssues(filter) {
  const filtered = filter === 'all'
    ? platformIssues
    : platformIssues.filter(i => i.severity === filter);

  // Update counts
  document.getElementById('pi-count-all').textContent      = platformIssues.length;
  document.getElementById('pi-count-critical').textContent = platformIssues.filter(i=>i.severity==='critical').length;
  document.getElementById('pi-count-high').textContent     = platformIssues.filter(i=>i.severity==='high').length;
  document.getElementById('pi-count-medium').textContent   = platformIssues.filter(i=>i.severity==='medium').length;
  document.getElementById('pi-count-resolved').textContent = platformIssues.filter(i=>i.severity==='resolved').length;

  const active = platformIssues.filter(i => i.severity !== 'resolved').length;
  document.getElementById('pi-sub').textContent =
    `${active} active issue${active!==1?'s':''} · ${platformIssues.filter(i=>i.severity==='resolved').length} resolved`;

  const navBadge = document.getElementById('nav-issues-badge');
  if (navBadge) navBadge.textContent = active;

  // Stat pills
  const pills = document.getElementById('pi-stat-pills');
  const counts = {critical:0,high:0,medium:0,resolved:0};
  platformIssues.forEach(i => counts[i.severity]++);
  const pillDefs = [
    { key:'critical', label:'Critical', bg:'#fee2e2', color:  'var(--red)'    },
    { key:'high',     label:'High',     bg:'#ffedd5', color:'var(--orange)'   },
    { key:'medium',   label:'Medium',   bg:'#fef3c7', color:'#b45309'         },
    { key:'resolved', label:'Resolved', bg:'#d1fae5', color:'#059669'         },
  ];
  pills.innerHTML = pillDefs.map(p =>
    `<div style="background:${p.bg};color:${p.color};padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700">
      ${counts[p.key]} ${p.label}
    </div>`
  ).join('');

  // Sort: active first by severity, then resolved
  const sorted = [...filtered].sort((a,b) =>
    (SEVERITY_ORDER[a.severity]??99) - (SEVERITY_ORDER[b.severity]??99)
  );

  const grid = document.getElementById('pi-grid');
  if (sorted.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);font-size:15px">No issues match this filter.</div>`;
    return;
  }

  grid.innerHTML = sorted.map(issue => {
    const pm   = PLATFORM_META[issue.platform];
    const last = issue.timeline[issue.timeline.length - 1];
    const lastActivity = `Last update: ${last.time} · ${last.author}`;
    return `
    <div class="pi-card ${issue.severity}">
      <div class="pi-card-header">
        <div class="pi-platform-icon ${pm.cls}" title="${pm.label}">${pm.icon}</div>
        <div class="pi-card-header-info">
          <div class="pi-card-title">${escHtml(issue.title)}</div>
          <div class="pi-card-platform">${pm.label} · ${escHtml(issue.reportedAt)}</div>
        </div>
        <span class="pi-status-badge ${issue.severity}">${issue.severity.charAt(0).toUpperCase()+issue.severity.slice(1)}</span>
      </div>
      <div class="pi-card-body">
        <div class="pi-meta-row">
          <span class="pi-meta-tag">${issue.impact.clients} clients affected</span>
          <span class="pi-meta-tag ${issue.severity!=='resolved'?'orange':''}">${issue.impact.tickets} tickets</span>
          <span class="pi-meta-tag">⏱ ${issue.impact.downtime}</span>
        </div>
        <div class="pi-summary">${escHtml(issue.summary)}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px">${escHtml(lastActivity)}</div>
        <button class="btn-details" onclick="openIssueModal('${issue.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          More Details
        </button>
      </div>
    </div>`;
  }).join('');
}

// ────────────────────────────────────────────────────────
//  ISSUE DETAILS MODAL
// ────────────────────────────────────────────────────────
function openIssueModal(id) {
  const issue = platformIssues.find(i => i.id === id);
  if (!issue) return;

  const pm = PLATFORM_META[issue.platform];

  // Header
  const iconEl = document.getElementById('id-platform-icon');
  iconEl.textContent  = pm.icon;
  iconEl.className    = `pi-platform-icon ${pm.cls}`;
  document.getElementById('id-title').textContent       = issue.title;
  document.getElementById('id-platform-meta').textContent =
    `${pm.label} · Reported ${issue.reportedAt} by ${issue.reportedBy}`;
  const badge = document.getElementById('id-status-badge');
  badge.textContent = issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1);
  badge.className   = `pi-status-badge ${issue.severity}`;

  // Description
  document.getElementById('id-description').textContent = issue.description;

  // Impact
  document.getElementById('id-impact-row').innerHTML = `
    <div class="id-impact-pill"><div class="id-impact-value">${issue.impact.clients}</div><div class="id-impact-label">Clients Affected</div></div>
    <div class="id-impact-pill"><div class="id-impact-value">${issue.impact.tickets}</div><div class="id-impact-label">Tickets Opened</div></div>
    <div class="id-impact-pill"><div class="id-impact-value">${issue.impact.downtime}</div><div class="id-impact-label">Downtime</div></div>
    <div class="id-impact-pill"><div class="id-impact-value">${issue.timeline.length}</div><div class="id-impact-label">Updates</div></div>
  `;

  // Timeline
  document.getElementById('id-timeline').innerHTML = issue.timeline.map(t => `
    <div class="id-timeline-item">
      <div class="id-tl-dot ${t.color}"></div>
      <div class="id-tl-content">
        <div class="id-tl-time">${escHtml(t.time)}</div>
        <div class="id-tl-author">${escHtml(t.author)}</div>
        <div class="id-tl-text">${escHtml(t.text)}</div>
      </div>
    </div>
  `).join('');

  document.getElementById('issue-modal-overlay').classList.remove('hidden');
}

function closeIssueModal() {
  document.getElementById('issue-modal-overlay').classList.add('hidden');
}

function closeIssueModalOnBackdrop(e) {
  if (e.target === document.getElementById('issue-modal-overlay')) closeIssueModal();
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
      { role:'agent',  sender:'System Auto-Reply', time:'09:22', text:'Thank you for contacting ForexDesk support. Your ticket has been received and a support agent will respond shortly.' },
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

let currentTicketFilter = 'open';
let selectedTicketId    = null;
let ticketReplyMode     = 'reply';

// ────────────────────────────────────────────────────────
//  TICKETS — RENDER LIST
// ────────────────────────────────────────────────────────
function updateTicketCounts() {
  const statuses = ['open','pending','hold','solved','closed'];
  statuses.forEach(s => {
    const el = document.getElementById(`tkt-count-${s}`);
    if (el) el.textContent = tickets.filter(t => t.status === s).length;
  });
  const openCount = tickets.filter(t => t.status === 'open').length;
  const badge = document.getElementById('nav-tickets-badge');
  if (badge) badge.textContent = openCount;
  const totalBadge = document.getElementById('tkt-total-badge');
  if (totalBadge) totalBadge.textContent = tickets.length;
}

function filterTickets(btn, status) {
  document.querySelectorAll('.tkt-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentTicketFilter = status;
  selectedTicketId = null;
  renderTicketList(status);
  // Reset detail panel
  document.getElementById('tkt-detail-panel').innerHTML = `
    <div class="tkt-empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      <p>Select a ticket to view details</p>
    </div>`;
}

const PRIORITY_LABELS = { urgent:'Urgent', high:'High', normal:'Normal', low:'Low' };
const STATUS_DISPLAY  = { open:'Open', pending:'Pending', hold:'On Hold', solved:'Solved', closed:'Closed' };

function renderTicketList(filter) {
  updateTicketCounts();
  const list   = tickets.filter(t => t.status === filter);
  const listEl = document.getElementById('tkt-list');

  if (list.length === 0) {
    listEl.innerHTML = `<div class="tkt-list-empty">No ${STATUS_DISPLAY[filter].toLowerCase()} tickets.</div>`;
    return;
  }

  listEl.innerHTML = list.map(t => {
    const agent = agents.find(a => a.id === t.agentId);
    const agentHtml = agent
      ? `<div class="tkt-row-agent" style="background:${agent.color}" title="${agent.name}">${agent.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>`
      : `<div class="tkt-row-agent" style="background:#94a3b8" title="Unassigned">?</div>`;
    return `
    <div class="tkt-row${selectedTicketId===t.id?' active':''}" onclick="selectTicket('${t.id}')">
      ${t.unread ? '<div class="tkt-unread-dot"></div>' : ''}
      <div class="tkt-row-top">
        <span class="tkt-row-id">${t.id}</span>
        <span class="tkt-priority ${t.priority}">${PRIORITY_LABELS[t.priority]}</span>
        <span class="tkt-row-time">${t.updatedAt}</span>
      </div>
      <div class="tkt-row-subject">${escHtml(t.subject)}</div>
      <div class="tkt-row-meta">
        <span class="tkt-row-client">${escHtml(t.client.name)}</span>
        ${agentHtml}
      </div>
    </div>`;
  }).join('');
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
  const agentName = agent ? agent.name : 'Unassigned';
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
          <span class="tkt-priority ${t.priority}">${PRIORITY_LABELS[t.priority]}</span>
          <span class="tkt-status-badge ${t.status}" id="tkt-status-badge-display">${STATUS_DISPLAY[t.status]}</span>
        </div>
      </div>
      <div class="tkt-detail-parties">
        <div class="tkt-party">
          <div class="tkt-party-avatar" style="background:#cbd5e1;color:#475569">${escHtml(t.client.initials)}</div>
          <span class="tkt-party-label">Client:</span>
          <span class="tkt-party-name">${escHtml(t.client.name)}</span>
          <span style="font-size:12px;color:var(--text-muted)">${escHtml(t.client.email)}</span>
        </div>
        <div style="width:1px;height:18px;background:var(--border)"></div>
        <div class="tkt-party">
          <div class="tkt-party-avatar" style="background:${agentColor}">${agentInitials}</div>
          <span class="tkt-party-label">Agent:</span>
          <div class="tkt-assign-btn" onclick="toggleAssignDropdown(event)" id="tkt-assign-btn-wrap">
            <span id="tkt-assigned-name">${escHtml(agentName)}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            <div class="tkt-assign-dropdown hidden" id="tkt-assign-dropdown">
              ${agentOptions}
            </div>
          </div>
        </div>
        <div style="margin-left:auto;font-size:12px;color:var(--text-muted)">${escHtml(t.channel)} · ${escHtml(t.createdAt)}</div>
      </div>
    </div>

    <!-- Conversation -->
    <div class="tkt-conversation" id="tkt-conversation">
      ${renderTicketMessages(t)}
    </div>

    <!-- Reply area -->
    <div class="tkt-reply-area">
      <div class="tkt-reply-mode-toggle">
        <button class="tkt-reply-mode-btn reply active" onclick="setTicketReplyMode(this,'reply')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
          Reply to Client
        </button>
        <button class="tkt-reply-mode-btn internal" onclick="setTicketReplyMode(this,'internal')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Internal Note
        </button>
      </div>
      <textarea class="tkt-reply-textarea" id="tkt-reply-input" rows="3" placeholder="Type your reply to the client…"></textarea>
      <div class="tkt-reply-actions">
        <div class="tkt-reply-actions-left">
          <select class="tkt-status-select" id="tkt-status-action" onchange="changeTicketStatus('${id}',this.value)">
            <option value="">Change status…</option>
            <option value="open"   ${t.status==='open'   ?'disabled':''}>→ Open</option>
            <option value="pending"${t.status==='pending'?'disabled':''}>→ Pending</option>
            <option value="hold"   ${t.status==='hold'   ?'disabled':''}>→ On Hold</option>
            <option value="solved" ${t.status==='solved' ?'disabled':''}>→ Solved</option>
            <option value="closed" ${t.status==='closed' ?'disabled':''}>→ Closed</option>
          </select>
        </div>
        <button class="btn-send-reply reply" id="tkt-send-btn" onclick="sendTicketReply('${id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Send Reply
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
            Internal Note · ${escHtml(m.sender)} · ${escHtml(m.time)}
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
  if (mode === 'internal') {
    textarea.classList.add('internal');
    textarea.placeholder = 'Write an internal note — not visible to the client…';
    sendBtn.className    = 'btn-send-reply internal';
    sendBtn.innerHTML    = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Add Note`;
  } else {
    textarea.classList.remove('internal');
    textarea.placeholder = 'Type your reply to the client…';
    sendBtn.className    = 'btn-send-reply reply';
    sendBtn.innerHTML    = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Reply`;
  }
}

function sendTicketReply(id) {
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

  t.messages.push({ role: ticketReplyMode, sender: senderName, time: now, text });
  t.updatedAt = 'Just now';
  input.value = '';

  // Re-render conversation
  const conv = document.getElementById('tkt-conversation');
  if (conv) {
    conv.innerHTML = renderTicketMessages(t);
    setTimeout(() => { conv.scrollTop = conv.scrollHeight; }, 20);
  }
}

function changeTicketStatus(id, newStatus) {
  if (!newStatus) return;
  const t = tickets.find(tk => tk.id === id);
  if (!t) return;
  t.status    = newStatus;
  t.updatedAt = 'Just now';

  // Update badge in detail header
  const badge = document.getElementById('tkt-status-badge-display');
  if (badge) {
    badge.textContent = STATUS_DISPLAY[newStatus];
    badge.className   = `tkt-status-badge ${newStatus}`;
  }
  // Reset select
  const sel = document.getElementById('tkt-status-action');
  if (sel) sel.value = '';

  // Re-render list and move ticket to new filter if needed
  renderTicketList(currentTicketFilter);
  updateTicketCounts();
}

function assignTicket(ticketId, agentId) {
  const t = tickets.find(tk => tk.id === ticketId);
  if (!t) return;
  t.agentId   = agentId;
  t.updatedAt = 'Just now';

  const agent = agents.find(a => a.id === agentId);
  const nameEl = document.getElementById('tkt-assigned-name');
  if (nameEl && agent) nameEl.textContent = agent.name;

  closeAssignDropdown();
  renderTicketList(currentTicketFilter);
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
  const sub = document.getElementById('notif-page-sub');
  if (sub) sub.textContent = unread > 0 ? `${unread} unread` : 'All caught up';

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
          ? `<button class="notif-mark-read-btn" onclick="markReadOnPage(${n.id})">Mark as read</button>`
          : '<span class="notif-read-label">✓ Read</span>'
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
let currentLang = 'en';

const translations = {
  en: {
    nav_overview:'Overview', nav_operations:'Operations',
    nav_dashboard:'Dashboard', nav_livechats:'Live Chats',
    nav_agents:'Agent Management', nav_issues:'Platform Issues',
    nav_tickets:'Tickets', nav_performance:'Performance',
    nav_reports:'Reports', nav_escalations:'Escalations',
    nav_settings:'Settings', role_label:'Support Manager',
    page_dashboard:'Dashboard', page_livechats:'Live Chats',
    page_agents:'Agent Management', page_issues:'Platform Issues',
    page_tickets:'Tickets', page_reports:'Reports', page_settings:'Settings',
    settings_title:'Settings', settings_sub:'Manage your preferences and configurations',
    notif_title:'Notification Settings', notif_sub:'Choose which events trigger notifications',
    notif_new_chat:'New chat assigned to an agent', notif_new_chat_desc:'Alert when a queued chat is picked up',
    notif_agent_offline:'Agent goes offline during shift', notif_agent_offline_desc:'Alert when an active agent drops offline',
    notif_platform_issue:'New platform issue reported', notif_platform_issue_desc:'Alert for newly opened platform incidents',
    notif_new_ticket:'New ticket received', notif_new_ticket_desc:'Alert for each new client support ticket',
    notif_queue_alert:'Chat queue exceeds 10 clients', notif_queue_alert_desc:'Alert when waiting queue is critically long',
    notif_perf_drop:'Agent satisfaction drops below 85%', notif_perf_drop_desc:'Alert when CSAT score falls under threshold',
    notif_sla:'Ticket SLA breach detected', notif_sla_desc:'Alert when a ticket exceeds its response SLA',
    lang_title:'Language & Region', lang_sub:'Select your preferred display language',
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
    settings_title:'الإعدادات', settings_sub:'إدارة تفضيلاتك وإعداداتك',
    notif_title:'إعدادات الإشعارات', notif_sub:'اختر الأحداث التي تُنشئ إشعارات',
    notif_new_chat:'تعيين محادثة جديدة لوكيل', notif_new_chat_desc:'تنبيه عند انتزاع محادثة من القائمة',
    notif_agent_offline:'الوكيل يتوقف عن الاتصال أثناء الوردية', notif_agent_offline_desc:'تنبيه عندما يصبح الوكيل النشط غير متصل',
    notif_platform_issue:'تم الإبلاغ عن مشكلة في المنصة', notif_platform_issue_desc:'تنبيه للحوادث المنصة المفتوحة حديثاً',
    notif_new_ticket:'تم استلام تذكرة جديدة', notif_new_ticket_desc:'تنبيه لكل تذكرة دعم عميل جديدة',
    notif_queue_alert:'قائمة المحادثة تتجاوز 10 عملاء', notif_queue_alert_desc:'تنبيه عندما تكون قائمة الانتظار حرجة',
    notif_perf_drop:'رضا الوكيل ينخفض عن 85%', notif_perf_drop_desc:'تنبيه عندما تنخفض درجة CSAT عن الحد الأدنى',
    notif_sla:'تم رصد خرق مستوى الخدمة', notif_sla_desc:'تنبيه عندما تتجاوز تذكرة وقت استجابة SLA',
    lang_title:'اللغة والمنطقة', lang_sub:'اختر لغة العرض المفضلة لديك',
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
    settings_title:'تنظیمات', settings_sub:'مدیریت تنظیمات و ترجیحات شما',
    notif_title:'تنظیمات اعلان‌ها', notif_sub:'انتخاب رویدادهایی که اعلان ایجاد می‌کنند',
    notif_new_chat:'تخصیص چت جدید به عامل', notif_new_chat_desc:'هشدار هنگام دریافت چت از صف',
    notif_agent_offline:'آفلاین شدن عامل در طول شیفت', notif_agent_offline_desc:'هشدار هنگامی که عامل فعال آفلاین می‌شود',
    notif_platform_issue:'گزارش مشکل جدید در پلتفرم', notif_platform_issue_desc:'هشدار برای حوادث جدید پلتفرم',
    notif_new_ticket:'دریافت تیکت جدید', notif_new_ticket_desc:'هشدار برای هر تیکت پشتیبانی جدید',
    notif_queue_alert:'صف چت بیش از ۱۰ کلاینت', notif_queue_alert_desc:'هشدار هنگامی که صف انتظار بحرانی طولانی است',
    notif_perf_drop:'افت رضایت عامل زیر ۸۵٪', notif_perf_drop_desc:'هشدار هنگامی که امتیاز CSAT زیر حد آستانه می‌افتد',
    notif_sla:'نقض SLA تیکت شناسایی شد', notif_sla_desc:'هشدار هنگامی که تیکت از زمان پاسخ SLA تجاوز می‌کند',
    lang_title:'زبان و منطقه', lang_sub:'زبان نمایش مورد نظر خود را انتخاب کنید',
  }
};

function applyLanguage(lang, btn) {
  currentLang = lang;
  const t = translations[lang];

  // Translate all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
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
}

function initSettings() {
  // Sync the active language card with currentLang
  document.querySelectorAll('.lang-card').forEach(c => c.classList.remove('active'));
  const card = document.getElementById('lang-' + currentLang);
  if (card) card.classList.add('active');
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
  const labels = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  return labels;
}

function render7DayChart() {
  const wrap = document.getElementById('chats-7day-chart');
  if (!wrap) return;
  const data   = [52, 67, 71, 43, 89, 76, 58];
  const labels = getLast7DayLabels();
  const W = 580, H = 180, padB = 32, padT = 20, padL = 8, padR = 8;
  const chartH = H - padB - padT;
  const n      = data.length;
  const max    = Math.max(...data);
  const barW   = (W - padL - padR - (n - 1) * 12) / n;

  let bars = '', vals = '', texts = '';
  data.forEach((v, i) => {
    const x  = padL + i * (barW + 12);
    const bh = (v / max) * chartH;
    const y  = padT + chartH - bh;
    const op = (0.45 + 0.55 * (v / max)).toFixed(2);
    bars  += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="#1a56db" opacity="${op}"/>`;
    vals  += `<text x="${(x + barW / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="600" fill="#0f172a">${v}</text>`;
    texts += `<text x="${(x + barW / 2).toFixed(1)}" y="${(H - 8).toFixed(1)}" text-anchor="middle" font-size="11" fill="#64748b">${labels[i]}</text>`;
  });

  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${bars}${vals}${texts}</svg>`;
}

// ────────────────────────────────────────────────────────
//  EXPORT REPORT
// ────────────────────────────────────────────────────────
function exportDashboardReport() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const period  = getLastWeekPeriod();

  const rows = [
    ['ForexDesk — Dashboard Report'],
    ['Generated', dateStr],
    [''],
    ['── PERFORMANCE OVERVIEW (' + period + ') ──'],
    ['Metric', 'Value', 'Change'],
    ['Total Chats',    '427',    '+8%'],
    ['Satisfaction',   '94%',    '+3%'],
    ['Response Time',  '1m 38s', '-12%'],
    ['Efficiency',     '87%',    '+5%'],
    [''],
    ['── TODAY\'S SNAPSHOT ──'],
    ['Metric', 'Value', 'Change'],
    ['Active Chats',       document.getElementById('stat-active')?.textContent || '14', '+12%'],
    ['Agents Online',      '8',    '+2'],
    ['Avg. First Response','1:42', '—'],
    ['CSAT Score',         '94%',  '+3%'],
    [''],
    ['── LAST 7 DAYS — TOTAL CHATS ──'],
    ['Day', 'Chats'],
  ];

  const data7  = [52, 67, 71, 43, 89, 76, 58];
  const labels = getLast7DayLabels();
  labels.forEach((lbl, i) => rows.push([lbl, data7[i]]));

  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `forexdesk-report-${now.toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let _rtInterval = null;

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
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    chartEl.textContent = `${fmt(start)} – ${fmt(now)}`;
  }

  render7DayChart();
  startRealTimeSim();
}
