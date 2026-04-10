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
const PAGE_TITLES = { dashboard:'Dashboard', agents:'Agent Management', livechats:'Live Chats' };

function showPage(pageId) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.remove('hidden');
  document.getElementById('header-title').textContent = PAGE_TITLES[pageId] || 'Dashboard';
  if (pageId === 'agents')    renderAgents(currentFilter);
  if (pageId === 'livechats') renderLiveChats();
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
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeEditModal(); closeSupervisePanel(); }
});

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
