/**
 * ═══════════════════════════════════════════════════════
 * KASHLY ADMIN — admin.js
 * Production-ready admin dashboard JS.
 *
 * Architecture note:
 *  - All data access goes through the `repo` layer (bottom of file).
 *    To swap DB/API: only edit the repo functions.
 *  - UI layer only calls repo functions — never fetch directly.
 *  - Services layer contains business logic (calculations, transforms).
 * ═══════════════════════════════════════════════════════
 */

'use strict';

/* ══════════════════════════════════════════
   CONFIG — edit API_BASE to point at your backend
══════════════════════════════════════════ */
const CONFIG = {
  API_BASE: '/api/v1',       // e.g. https://api.kashly.in/api/v1
  PAGE_SIZE: 8,
  CURRENCY: '₹',
  DATE_LOCALE: 'en-IN',
};


/* ══════════════════════════════════════════
   UTILS
══════════════════════════════════════════ */
const Utils = {
  fmtCurrency(val) {
    if (val >= 1e7) return `${CONFIG.CURRENCY}${(val / 1e7).toFixed(1)}Cr`;
    if (val >= 1e5) return `${CONFIG.CURRENCY}${(val / 1e5).toFixed(1)}L`;
    if (val >= 1e3) return `${CONFIG.CURRENCY}${(val / 1e3).toFixed(0)}K`;
    return `${CONFIG.CURRENCY}${val.toLocaleString('en-IN')}`;
  },
  fmtExact(val) {
    return `${CONFIG.CURRENCY}${val.toLocaleString('en-IN')}`;
  },
  fmtDate(iso) {
    return new Date(iso).toLocaleDateString(CONFIG.DATE_LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
  },
  timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  },
  scoreClass(score) {
    if (score >= 750) return 'high';
    if (score >= 650) return 'med';
    return 'low';
  },
  initials(name) {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  },
  slugify(s) {
    return s.toLowerCase().replace(/\s+/g, '-');
  },
};

/* ══════════════════════════════════════════
   REPOSITORY LAYER
   ─────────────────────────────────────────
   To switch from mock → real API:
     Replace the mock data with: return fetch(`${CONFIG.API_BASE}/...`).then(r => r.json())
   To switch DB adapters on the server side:
     Edit src/db/adapters/ (mongo.adapter.js | pg.adapter.js)
   The UI never calls fetch() directly.
══════════════════════════════════════════ */
const Repo = {

  /* ── KPI Metrics ── */
  async getMetrics() {
    // MOCK: replace with → fetch(`${CONFIG.API_BASE}/admin/metrics`)
    return {
      totalDisbursed:   { value: 850000000,  delta: 12.4,  dir: 'up' },
      activeBorrowers:  { value: 124300,     delta: 8.2,   dir: 'up' },
      pendingApps:      { value: 24,         delta: -3.1,  dir: 'down' },
      npaRate:          { value: '2.4%',     delta: 0.3,   dir: 'up', isPercent: true, warning: true },
    };
  },

  /* ── Disbursal Chart Data ── */
  async getDisbursalTrend(range = '6m') {
    const data6m = [
      { label: 'Nov', value: 108 }, { label: 'Dec', value: 127 },
      { label: 'Jan', value: 134 }, { label: 'Feb', value: 119 },
      { label: 'Mar', value: 145 }, { label: 'Apr', value: 158 },
    ];
    const data1y = [
      { label: 'May', value: 74 },  { label: 'Jun', value: 82 },
      { label: 'Jul', value: 91 },  { label: 'Aug', value: 103 },
      { label: 'Sep', value: 95 },  { label: 'Oct', value: 112 },
      { label: 'Nov', value: 108 }, { label: 'Dec', value: 127 },
      { label: 'Jan', value: 134 }, { label: 'Feb', value: 119 },
      { label: 'Mar', value: 145 }, { label: 'Apr', value: 158 },
    ];
    return range === '1y' ? data1y : data6m;
  },

  /* ── Loan Mix ── */
  async getLoanMix() {
    return [
      { label: 'Personal',  value: 42, color: '#B8F535' },
      { label: 'Business',  value: 28, color: '#7ba3ff' },
      { label: 'Home',      value: 18, color: '#f5a623' },
      { label: 'Education', value: 12, color: '#d07fff' },
    ];
  },

  /* ── Applications ── */
  async getApplications(filters = {}) {
    const all = MOCK_DATA.applications;
    let list = filters.status && filters.status !== 'all'
      ? all.filter(a => a.status === filters.status)
      : all;
    const page  = filters.page  || 1;
    const size  = filters.size  || CONFIG.PAGE_SIZE;
    const total = list.length;
    const items = list.slice((page - 1) * size, page * size);
    return { items, total, page, pages: Math.ceil(total / size) };
  },

  /* ── Borrowers ── */
  async getBorrowers() {
    return MOCK_DATA.borrowers;
  },

  /* ── Disbursals ── */
  async getDisbursals() {
    return MOCK_DATA.disbursals;
  },

  /* ── Repayments ── */
  async getRepayments() {
    return MOCK_DATA.repayments;
  },

  /* ── KYC Queue ── */
  async getKycQueue() {
    return MOCK_DATA.kycQueue;
  },

  /* ── Collections ── */
  async getCollections() {
    return MOCK_DATA.collections;
  },

  /* ── Activity Feed ── */
  async getActivity() {
    return MOCK_DATA.activity;
  },

  /* ── Single Application ── */
  async getApplicationById(id) {
    return MOCK_DATA.applications.find(a => a.id === id) || null;
  },

  /* ── Approve / Reject ── */
  async updateApplicationStatus(id, status) {
    // MOCK: replace with → fetch(`${CONFIG.API_BASE}/applications/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    const app = MOCK_DATA.applications.find(a => a.id === id);
    if (app) app.status = status;
    return { ok: true };
  },
};

/* ══════════════════════════════════════════
   MOCK DATA
   ─────────────────────────────────────────
   In production, delete this entire block.
   Real data comes from Repo functions above.
══════════════════════════════════════════ */
const MOCK_DATA = (() => {
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const NAMES = ['Arjun Mehta','Priya Sharma','Rohit Verma','Deepa Nair','Karan Joshi','Sunita Rao',
    'Vikram Singh','Ananya Gupta','Rajesh Kumar','Meera Pillai','Aditya Shah','Kavita Reddy',
    'Suresh Iyer','Pooja Bose','Nikhil Patel','Ritu Agarwal','Sanjay Dubey','Lakshmi Menon'];
  const BANKS = ['HDFC Bank','ICICI Bank','SBI','Axis Bank','Kotak Mahindra','Yes Bank','PNB','Canara Bank'];
  const PRODUCTS = ['Personal','Business','Home','Education'];
  const STATUSES = ['pending','approved','rejected','disbursed'];
  const AGENTS = ['Agent Ravi','Agent Priya','Agent Suresh','Agent Deepa'];

  const applications = Array.from({ length: 48 }, (_, i) => ({
    id: `KL-2026-${String(1001 + i).padStart(4, '0')}`,
    name: NAMES[i % NAMES.length],
    product: PRODUCTS[i % PRODUCTS.length],
    amount: rnd(1, 50) * 50000,
    cibilScore: rnd(580, 820),
    status: STATUSES[i % STATUSES.length],
    appliedAt: new Date(Date.now() - rnd(1, 30) * 86400000).toISOString(),
    mobile: `+91 98${rnd(10,99)} ${rnd(10000,99999)}`,
    email: `${NAMES[i % NAMES.length].toLowerCase().replace(' ', '.')}@example.com`,
    employment: ['Salaried','Self-employed','Business'][i % 3],
    monthlyIncome: rnd(30, 200) * 1000,
    tenure: [12,24,36,48,60][i % 5],
    bank: BANKS[i % BANKS.length],
  }));

  const borrowers = NAMES.map((name, i) => ({
    id: `BW-${String(1001 + i).padStart(4, '0')}`,
    name,
    mobile: `+91 98${rnd(10,99)} ${rnd(10000,99999)}`,
    activeLoans: rnd(0, 3),
    totalBorrowed: rnd(1, 30) * 100000,
    repaymentRate: rnd(85, 100),
    kyc: ['verified','review','verified'][i % 3],
    joinedAt: new Date(Date.now() - rnd(30, 730) * 86400000).toISOString(),
  }));

  const disbursals = applications.slice(0, 20).map((a, i) => ({
    id: `DS-2026-${String(3001 + i).padStart(4, '0')}`,
    borrower: a.name,
    product: a.product,
    amount: a.amount,
    bank: BANKS[i % BANKS.length],
    date: new Date(Date.now() - rnd(1, 60) * 86400000).toISOString(),
    status: ['processing','paid','failed'][i % 3],
  }));

  const repayments = Array.from({ length: 30 }, (_, i) => ({
    id: `EMI-${String(5001 + i).padStart(5, '0')}`,
    borrower: NAMES[i % NAMES.length],
    loanId: `KL-2026-${String(1001 + i).padStart(4, '0')}`,
    dueDate: new Date(Date.now() + rnd(-10, 20) * 86400000).toISOString(),
    amount: rnd(5, 40) * 1000,
    paidOn: i % 4 === 0 ? null : new Date(Date.now() - rnd(1, 5) * 86400000).toISOString(),
    status: ['paid','pending','overdue'][i % 3],
  }));

  const kycQueue = NAMES.slice(0, 7).map((name, i) => ({
    id: `KL-2026-${String(1020 + i).padStart(4, '0')}`,
    name,
    docs: [
      { name: 'Aadhaar Card', status: ['verified','review','verified'][i % 3] },
      { name: 'PAN Card',     status: ['verified','verified','failed'][i % 3] },
      { name: 'Bank Statement',status: ['review','verified','review'][i % 3] },
    ],
  }));

  const collections = applications.slice(0, 10)
    .filter((_, i) => i % 3 === 0)
    .map((a, i) => ({
      name: a.name,
      loanId: a.id,
      overdueEmis: rnd(1, 5),
      overdueAmount: rnd(1, 10) * 10000,
      dpd: rnd(7, 90),
      agent: AGENTS[i % AGENTS.length],
    }));

  const activity = [
    { type: 'approved', text: '<strong>Arjun Mehta</strong> — ₹3.5L Personal Loan approved', time: new Date(Date.now() - 2 * 60000).toISOString(), color: 'green' },
    { type: 'applied',  text: '<strong>Priya Sharma</strong> applied for ₹5L Business Loan', time: new Date(Date.now() - 8 * 60000).toISOString(), color: 'blue' },
    { type: 'overdue',  text: '<strong>Rohit Verma</strong> — EMI overdue by 3 days', time: new Date(Date.now() - 15 * 60000).toISOString(), color: 'red' },
    { type: 'kyc',      text: '<strong>Deepa Nair</strong> — KYC documents submitted', time: new Date(Date.now() - 22 * 60000).toISOString(), color: 'amber' },
    { type: 'disbursed',text: '<strong>Karan Joshi</strong> — ₹8L disbursed to HDFC Bank', time: new Date(Date.now() - 38 * 60000).toISOString(), color: 'green' },
    { type: 'rejected', text: '<strong>Sunita Rao</strong> — Application rejected (low score)', time: new Date(Date.now() - 55 * 60000).toISOString(), color: 'red' },
    { type: 'applied',  text: '<strong>Vikram Singh</strong> applied for ₹1.5L Personal Loan', time: new Date(Date.now() - 72 * 60000).toISOString(), color: 'blue' },
    { type: 'paid',     text: '<strong>Ananya Gupta</strong> — EMI ₹12,400 paid on time', time: new Date(Date.now() - 90 * 60000).toISOString(), color: 'green' },
  ];

  return { applications, borrowers, disbursals, repayments, kycQueue, collections, activity };
})();

/* ══════════════════════════════════════════
   SERVICES — business logic / transforms
══════════════════════════════════════════ */
const Services = {
  badgeHtml(status) {
    const map = {
      approved:   'badge-approved',
      pending:    'badge-pending',
      rejected:   'badge-rejected',
      disbursed:  'badge-disbursed',
      overdue:    'badge-overdue',
      paid:       'badge-paid',
      processing: 'badge-processing',
      verified:   'badge-verified',
      review:     'badge-review',
      failed:     'badge-failed',
    };
    const cls = map[status] || 'badge-pending';
    return `<span class="badge ${cls}"><span class="badge-dot"></span>${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
  },

  productBadgeHtml(product) {
    const map = {
      Personal:  'badge-personal',
      Business:  'badge-business',
      Home:      'badge-home',
      Education: 'badge-education',
    };
    const cls = map[product] || '';
    return `<span class="badge ${cls}">${product}</span>`;
  },

  scoreHtml(score) {
    const cls = Utils.scoreClass(score);
    return `<span class="score-pill score-${cls}">${score}</span>`;
  },

  activityIcon(color) {
    const icons = {
      green: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
      red:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      amber: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      blue:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    };
    return icons[color] || icons.blue;
  },
};

/* ══════════════════════════════════════════
   CHART ENGINE (pure canvas — no dependencies)
══════════════════════════════════════════ */
const Charts = {
  getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      green:  style.getPropertyValue('--green').trim()  || '#B8F535',
      text3:  style.getPropertyValue('--text-3').trim() || 'rgba(255,255,255,0.42)',
      line:   style.getPropertyValue('--line').trim()   || 'rgba(255,255,255,0.08)',
      bg3:    style.getPropertyValue('--bg-3').trim()   || '#111111',
    };
  },

  drawBar(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.offsetWidth;
    const H   = 180;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const C = this.getThemeColors();
    const PAD = { top: 16, right: 16, bottom: 36, left: 40 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    const maxVal = Math.max(...data.map(d => d.value));
    const barW   = (chartW / data.length) * 0.55;
    const gap    = chartW / data.length;

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    [0.25, 0.5, 0.75, 1].forEach(frac => {
      const y = PAD.top + chartH - chartH * frac;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + chartW, y);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = C.text3;
      ctx.font = `500 10px 'Space Grotesk', monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal * frac), PAD.left - 6, y + 3);
    });

    data.forEach((d, i) => {
      const x   = PAD.left + i * gap + gap / 2 - barW / 2;
      const h   = (d.value / maxVal) * chartH;
      const y   = PAD.top + chartH - h;
      const rad = 5;

      // Bar gradient
      const grad = ctx.createLinearGradient(0, y, 0, PAD.top + chartH);
      grad.addColorStop(0, C.green);
      grad.addColorStop(1, C.green + '33');

      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + barW - rad, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + rad);
      ctx.lineTo(x + barW, PAD.top + chartH);
      ctx.lineTo(x, PAD.top + chartH);
      ctx.lineTo(x, y + rad);
      ctx.quadraticCurveTo(x, y, x + rad, y);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Label
      ctx.fillStyle = C.text3;
      ctx.font = `500 10px 'Space Grotesk', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barW / 2, H - 10);
    });
  },

  drawDonut(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const SIZE = 180;
    canvas.width  = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width  = SIZE + 'px';
    canvas.style.height = SIZE + 'px';
    ctx.scale(dpr, dpr);

    const cx = SIZE / 2, cy = SIZE / 2, R = 72, r = 50;
    let startAngle = -Math.PI / 2;
    const total = data.reduce((s, d) => s + d.value, 0);

    ctx.clearRect(0, 0, SIZE, SIZE);

    data.forEach(d => {
      const angle = (d.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, R, startAngle, startAngle + angle);
      ctx.arc(cx, cy, r, startAngle + angle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();
      startAngle += angle + 0.02;
    });
  },
};

/* ══════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════ */
const Nav = {
  pages: {
    dashboard:    document.getElementById('pageDashboard'),
    applications: document.getElementById('pageApplications'),
    borrowers:    document.getElementById('pageBorrowers'),
    disbursals:   document.getElementById('pageDisbursals'),
    repayments:   document.getElementById('pageRepayments'),
    kyc:          document.getElementById('pageKyc'),
    collections:  document.getElementById('pageCollections'),
    reports:      document.getElementById('pageReports'),
    settings:     document.getElementById('pageSettings'),
  },
  current: 'dashboard',

  async go(section) {
    if (section === this.current) return;
    // hide all
    Object.values(this.pages).forEach(p => { if (p) p.classList.add('hidden'); });
    // show target
    const page = this.pages[section];
    if (page) page.classList.remove('hidden');
    this.current = section;

    // update sidebar active
    document.querySelectorAll('.sb-link').forEach(l => {
      l.classList.toggle('active', l.dataset.section === section);
    });

    // update breadcrumb
    const bc = document.getElementById('bcCurrent');
    if (bc) bc.textContent = section.charAt(0).toUpperCase() + section.slice(1).replace('-', ' ');

    // lazy-load section data
    await PageControllers.load(section);

    // close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
  },
};

/* ══════════════════════════════════════════
   PAGE CONTROLLERS
══════════════════════════════════════════ */
const PageControllers = {
  loaded: new Set(),

  async load(section) {
    if (this.loaded.has(section)) return;
    this.loaded.add(section);
    const fn = this[section];
    if (typeof fn === 'function') await fn.call(this);
  },

  /* ── DASHBOARD ── */
  async dashboard() {
    this._renderDate();
    await Promise.all([
      this._renderKpi(),
      this._renderDisbursalChart('6m'),
      this._renderDonut(),
      this._renderRecentApps(),
      this._renderActivity(),
    ]);
  },

  _renderDate() {
    const el = document.getElementById('todayDate');
    if (el) el.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  },

  async _renderKpi() {
    const data = await Repo.getMetrics();
    const grid = document.getElementById('kpiGrid');
    if (!grid) return;

    const cards = [
      {
        label: 'Total Disbursed', val: Utils.fmtCurrency(data.totalDisbursed.value),
        delta: data.totalDisbursed.delta, dir: data.totalDisbursed.dir,
        color: 'green',
        icon: `<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      },
      {
        label: 'Active Borrowers', val: (data.activeBorrowers.value / 1000).toFixed(1) + 'K',
        delta: data.activeBorrowers.delta, dir: data.activeBorrowers.dir,
        color: 'blue',
        icon: `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      },
      {
        label: 'Pending Applications', val: data.pendingApps.value,
        delta: Math.abs(data.pendingApps.delta), dir: data.pendingApps.dir,
        color: 'amber',
        icon: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      },
      {
        label: 'NPA Rate', val: data.npaRate.value,
        delta: data.npaRate.delta, dir: 'up',
        color: 'red', deltaDir: 'down', // higher NPA = bad
        icon: `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      },
    ];

    grid.innerHTML = cards.map(c => `
      <div class="kpi-card ${c.color}">
        <div class="kpi-icon ${c.color}">${c.icon}</div>
        <div class="kpi-val num">${c.val}</div>
        <div class="kpi-label">${c.label}</div>
        <div class="kpi-delta ${c.dir === 'up' && c.color !== 'red' ? 'up' : c.dir === 'down' && c.color === 'amber' ? 'up' : 'down'}">
          <svg viewBox="0 0 24 24">${c.dir === 'up' ? '<polyline points="18 15 12 9 6 15"/>' : '<polyline points="6 9 12 15 18 9"/>'}</svg>
          ${c.delta}${c.label === 'Pending Applications' ? '' : '%'} vs last month
        </div>
      </div>
    `).join('');
  },

  async _renderDisbursalChart(range) {
    const data = await Repo.getDisbursalTrend(range);
    Charts.drawBar('barChart', data);
  },

  async _renderDonut() {
    const data = await Repo.getLoanMix();
    Charts.drawDonut('donutChart', data);
    const legend = document.getElementById('donutLegend');
    if (legend) {
      const total = data.reduce((s, d) => s + d.value, 0);
      legend.innerHTML = data.map(d => `
        <li class="dl-item">
          <span class="dl-dot" style="background:${d.color}"></span>
          <span class="dl-name">${d.label}</span>
          <span class="dl-pct">${((d.value / total) * 100).toFixed(0)}%</span>
        </li>
      `).join('');
    }
  },

  async _renderRecentApps() {
    const { items } = await Repo.getApplications({ page: 1, size: 5 });
    const tbody = document.getElementById('appsTableBody');
    if (!tbody) return;
    tbody.innerHTML = items.map(a => `
      <tr>
        <td><span class="td-bold">${a.name}</span><br/><span style="font-size:11px;color:var(--text-3)">${a.id}</span></td>
        <td>${Services.productBadgeHtml(a.product)}</td>
        <td class="td-green td-num">${Utils.fmtExact(a.amount)}</td>
        <td>${Services.scoreHtml(a.cibilScore)}</td>
        <td>${Services.badgeHtml(a.status)}</td>
        <td><button class="btn btn-ghost btn-sm review-btn" data-id="${a.id}">Review</button></td>
      </tr>
    `).join('');
    tbody.querySelectorAll('.review-btn').forEach(btn => {
      btn.addEventListener('click', () => Modal.open(btn.dataset.id));
    });
  },

  async _renderActivity() {
    const items = await Repo.getActivity();
    const list = document.getElementById('activityList');
    if (!list) return;
    list.innerHTML = items.map(item => `
      <li class="activity-item">
        <div class="activity-dot ${item.color}">${Services.activityIcon(item.color)}</div>
        <div class="activity-body">
          <div class="activity-text">${item.text}</div>
          <div class="activity-time">${Utils.timeAgo(item.time)}</div>
        </div>
      </li>
    `).join('');
  },

  /* ── APPLICATIONS ── */
  _appPage: 1,
  _appFilter: 'all',

  async applications() {
    await this._loadAppsTable();
  },

  async _loadAppsTable() {
    const { items, total, pages } = await Repo.getApplications({
      status: this._appFilter,
      page: this._appPage,
      size: CONFIG.PAGE_SIZE,
    });
    const tbody = document.getElementById('fullAppsBody');
    if (!tbody) return;
    tbody.innerHTML = items.map(a => `
      <tr>
        <td class="td-num td-bold">${a.id}</td>
        <td><span class="td-bold">${a.name}</span></td>
        <td>${Services.productBadgeHtml(a.product)}</td>
        <td class="td-green td-num">${Utils.fmtExact(a.amount)}</td>
        <td class="td-num">${Utils.fmtDate(a.appliedAt)}</td>
        <td>${Services.scoreHtml(a.cibilScore)}</td>
        <td>${Services.badgeHtml(a.status)}</td>
        <td>
          <div class="td-actions">
            <button class="btn btn-success btn-sm approve-btn" data-id="${a.id}">Approve</button>
            <button class="btn btn-danger btn-sm reject-btn" data-id="${a.id}">Reject</button>
            <button class="btn btn-ghost btn-sm review-btn" data-id="${a.id}">View</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Action handlers
    tbody.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await Repo.updateApplicationStatus(btn.dataset.id, 'approved');
        Toast.show('Application approved successfully', 'success');
        this.loaded.delete('applications');
        await this._loadAppsTable();
      });
    });
    tbody.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await Repo.updateApplicationStatus(btn.dataset.id, 'rejected');
        Toast.show('Application rejected', 'error');
        this.loaded.delete('applications');
        await this._loadAppsTable();
      });
    });
    tbody.querySelectorAll('.review-btn').forEach(btn => {
      btn.addEventListener('click', () => Modal.open(btn.dataset.id));
    });

    // Pagination
    const pg = document.getElementById('appPagination');
    if (pg) {
      pg.innerHTML = Array.from({ length: pages }, (_, i) => `
        <button class="pg-btn ${i + 1 === this._appPage ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>
      `).join('');
      pg.querySelectorAll('.pg-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          this._appPage = parseInt(btn.dataset.page);
          await this._loadAppsTable();
        });
      });
    }
  },

  /* ── BORROWERS ── */
  async borrowers() {
    const data = await Repo.getBorrowers();
    const tbody = document.getElementById('borrowersBody');
    if (tbody) {
      tbody.innerHTML = data.map(b => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="kyc-avatar" style="width:32px;height:32px;font-size:11px">${Utils.initials(b.name)}</div>
              <span class="td-bold">${b.name}</span>
            </div>
          </td>
          <td class="td-num">${b.mobile}</td>
          <td class="td-num" style="text-align:center">${b.activeLoans}</td>
          <td class="td-green td-num">${Utils.fmtCurrency(b.totalBorrowed)}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;height:4px;border-radius:2px;background:var(--line)">
                <div style="height:100%;width:${b.repaymentRate}%;border-radius:2px;background:${b.repaymentRate >= 95 ? 'var(--green)' : b.repaymentRate >= 85 ? 'var(--amber)' : 'var(--red)'}"></div>
              </div>
              <span class="td-num" style="font-size:12px">${b.repaymentRate}%</span>
            </div>
          </td>
          <td>${Services.badgeHtml(b.kyc)}</td>
          <td class="td-num" style="color:var(--text-3)">${Utils.fmtDate(b.joinedAt)}</td>
        </tr>
      `).join('');
    }
    // Mini KPIs
    const kpi = document.getElementById('borrowerKpi');
    if (kpi) {
      kpi.innerHTML = `
        <div class="kpi-card green">
          <div class="kpi-icon green"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
          <div class="kpi-val num">${data.length}</div>
          <div class="kpi-label">Total Borrowers</div>
        </div>
        <div class="kpi-card amber">
          <div class="kpi-icon amber"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="kpi-val num">${data.filter(b => b.activeLoans > 0).length}</div>
          <div class="kpi-label">With Active Loans</div>
        </div>
        <div class="kpi-card blue">
          <div class="kpi-icon blue"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
          <div class="kpi-val num">${(data.reduce((s,b) => s + b.repaymentRate, 0) / data.length).toFixed(1)}%</div>
          <div class="kpi-label">Avg Repayment Rate</div>
        </div>
      `;
    }
  },

  /* ── DISBURSALS ── */
  async disbursals() {
    const data = await Repo.getDisbursals();
    const tbody = document.getElementById('disbursalsBody');
    if (tbody) {
      tbody.innerHTML = data.map(d => `
        <tr>
          <td class="td-num td-bold">${d.id}</td>
          <td>${d.borrower}</td>
          <td>${Services.productBadgeHtml(d.product)}</td>
          <td class="td-green td-num">${Utils.fmtExact(d.amount)}</td>
          <td>${d.bank}</td>
          <td class="td-num" style="color:var(--text-3)">${Utils.fmtDate(d.date)}</td>
          <td>${Services.badgeHtml(d.status)}</td>
        </tr>
      `).join('');
    }
  },

  /* ── REPAYMENTS ── */
  async repayments() {
    const data = await Repo.getRepayments();
    const tbody = document.getElementById('repaymentsBody');
    if (tbody) {
      tbody.innerHTML = data.map(r => `
        <tr>
          <td class="td-num">${r.id}</td>
          <td class="td-bold">${r.borrower}</td>
          <td class="td-num">${r.loanId}</td>
          <td class="td-num ${new Date(r.dueDate) < new Date() && r.status !== 'paid' ? 'td-green' : ''}" style="${new Date(r.dueDate) < new Date() && r.status !== 'paid' ? 'color:var(--red)' : ''}">${Utils.fmtDate(r.dueDate)}</td>
          <td class="td-num td-green">${Utils.fmtExact(r.amount)}</td>
          <td class="td-num" style="color:var(--text-3)">${r.paidOn ? Utils.fmtDate(r.paidOn) : '—'}</td>
          <td>${Services.badgeHtml(r.status)}</td>
        </tr>
      `).join('');
    }
    // Repayment KPIs
    const kpi = document.getElementById('repaymentKpi');
    if (kpi) {
      const paid    = data.filter(r => r.status === 'paid').length;
      const overdue = data.filter(r => r.status === 'overdue').length;
      const total   = data.reduce((s, r) => s + r.amount, 0);
      kpi.innerHTML = `
        <div class="kpi-card green">
          <div class="kpi-icon green"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="kpi-val num">${paid}</div><div class="kpi-label">EMIs Paid</div>
        </div>
        <div class="kpi-card red">
          <div class="kpi-icon red"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
          <div class="kpi-val num">${overdue}</div><div class="kpi-label">Overdue EMIs</div>
        </div>
        <div class="kpi-card blue">
          <div class="kpi-icon blue"><svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="kpi-val num">${Utils.fmtCurrency(total)}</div><div class="kpi-label">Total Collected</div>
        </div>
      `;
    }
  },

  /* ── KYC ── */
  async kyc() {
    const data = await Repo.getKycQueue();
    const grid = document.getElementById('kycGrid');
    if (!grid) return;
    grid.innerHTML = data.map(k => `
      <div class="kyc-card">
        <div class="kyc-card-top">
          <div class="kyc-avatar">${Utils.initials(k.name)}</div>
          <div>
            <div class="kyc-name">${k.name}</div>
            <div class="kyc-id">${k.id}</div>
          </div>
        </div>
        <div class="kyc-docs">
          ${k.docs.map(d => `
            <div class="kyc-doc-row">
              <span class="kyc-doc-name">${d.name}</span>
              ${Services.badgeHtml(d.status)}
            </div>
          `).join('')}
        </div>
        <div class="kyc-card-actions">
          <button class="btn btn-success btn-sm" onclick="Toast.show('KYC approved for ${k.name}','success')">Approve</button>
          <button class="btn btn-danger btn-sm" onclick="Toast.show('KYC rejected for ${k.name}','error')">Reject</button>
        </div>
      </div>
    `).join('');
  },

  /* ── COLLECTIONS ── */
  async collections() {
    const data = await Repo.getCollections();
    const tbody = document.getElementById('collectionsBody');
    if (!tbody) return;
    tbody.innerHTML = data.map(c => `
      <tr>
        <td class="td-bold">${c.name}</td>
        <td class="td-num">${c.loanId}</td>
        <td class="td-num" style="text-align:center">${c.overdueEmis}</td>
        <td class="td-num" style="color:var(--red)">${Utils.fmtExact(c.overdueAmount)}</td>
        <td><span class="score-pill ${c.dpd <= 30 ? 'score-med' : 'score-low'}">${c.dpd}d</span></td>
        <td style="color:var(--text-2)">${c.agent}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="Toast.show('Reminder sent to ${c.name}','info')">Send reminder</button></td>
      </tr>
    `).join('');
  },

  /* ── REPORTS ── */
  async reports() {
    const reports = [
      { title: 'Monthly Disbursal Report', desc: 'Summary of all loans disbursed in the current month with product-wise breakdown.', color: 'green', period: 'April 2026' },
      { title: 'NPA & Collections Report', desc: 'Non-performing assets, overdue accounts, and recovery status.', color: 'amber', period: 'Q1 2026' },
      { title: 'KYC Compliance Report', desc: 'Document verification status and pending KYC cases.', color: 'blue', period: 'April 2026' },
      { title: 'Revenue & Interest Report', desc: 'Interest income, processing fee collections, and net revenue.', color: 'green', period: 'April 2026' },
      { title: 'Borrower Onboarding Report', desc: 'New borrower registrations, conversion rates, and drop-off analysis.', color: 'purple', period: 'April 2026' },
      { title: 'RBI Regulatory Report', desc: 'Mandatory NBFC reporting as per RBI Fair Practice Code.', color: 'blue', period: 'March 2026' },
    ];
    const icons = {
      green:  `<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
      amber:  `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`,
      blue:   `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      purple: `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
    };
    const grid = document.getElementById('reportsGrid');
    if (!grid) return;
    grid.innerHTML = reports.map(r => `
      <div class="report-card" onclick="Toast.show('Generating ${r.title}…','info')">
        <div class="report-icon ${r.color}">${icons[r.color] || icons.green}</div>
        <div class="report-title">${r.title}</div>
        <div class="report-desc">${r.desc}</div>
        <div class="report-gen">
          <span class="report-period">${r.period}</span>
          <span class="report-dl">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
          </span>
        </div>
      </div>
    `).join('');
  },

  /* ── SETTINGS ── (HTML pre-rendered, nothing to load) */
  async settings() {},
};

/* ══════════════════════════════════════════
   MODAL
══════════════════════════════════════════ */
const Modal = {
  async open(appId) {
    const app = await Repo.getApplicationById(appId);
    if (!app) return;
    const body = document.getElementById('modalBody');
    if (!body) return;

    body.innerHTML = `
      <div class="modal-grid">
        <div class="modal-field"><label>Loan ID</label><div class="mf-val num">${app.id}</div></div>
        <div class="modal-field"><label>Status</label><div class="mf-val">${Services.badgeHtml(app.status)}</div></div>
        <div class="modal-field"><label>Applicant</label><div class="mf-val">${app.name}</div></div>
        <div class="modal-field"><label>Product</label><div class="mf-val">${app.product} Loan</div></div>
        <div class="modal-field"><label>Loan Amount</label><div class="mf-val green num">${Utils.fmtExact(app.amount)}</div></div>
        <div class="modal-field"><label>Tenure</label><div class="mf-val num">${app.tenure} months</div></div>
        <div class="modal-field"><label>CIBIL Score</label><div class="mf-val">${Services.scoreHtml(app.cibilScore)}</div></div>
        <div class="modal-field"><label>Employment</label><div class="mf-val">${app.employment}</div></div>
        <div class="modal-field"><label>Monthly Income</label><div class="mf-val num">${Utils.fmtExact(app.monthlyIncome)}</div></div>
        <div class="modal-field"><label>Bank</label><div class="mf-val">${app.bank}</div></div>
        <div class="modal-field"><label>Mobile</label><div class="mf-val num">${app.mobile}</div></div>
        <div class="modal-field"><label>Applied On</label><div class="mf-val num">${Utils.fmtDate(app.appliedAt)}</div></div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-success" id="modalApprove">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Approve
        </button>
        <button class="btn btn-danger" id="modalReject">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Reject
        </button>
        <button class="btn btn-ghost" id="modalClose2" style="margin-left:auto">Close</button>
      </div>
    `;

    document.getElementById('modalApprove').addEventListener('click', async () => {
      await Repo.updateApplicationStatus(app.id, 'approved');
      Toast.show(`${app.name}'s application approved`, 'success');
      this.close();
      PageControllers.loaded.delete('applications');
    });
    document.getElementById('modalReject').addEventListener('click', async () => {
      await Repo.updateApplicationStatus(app.id, 'rejected');
      Toast.show(`${app.name}'s application rejected`, 'error');
      this.close();
      PageControllers.loaded.delete('applications');
    });
    document.getElementById('modalClose2').addEventListener('click', () => this.close());

    document.getElementById('appModal').classList.remove('hidden');
  },

  close() {
    document.getElementById('appModal').classList.add('hidden');
  },
};

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
const Toast = {
  icons: {
    success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    info:    `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>`,
  },

  show(message, type = 'info') {
    const wrap = document.getElementById('toastWrap');
    const el = document.createElement('div');
    el.className = `toast ${type} toast-left`;
    el.innerHTML = `${this.icons[type] || this.icons.info}<span>${message}</span>`;
    wrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 250);
    }, 3000);
  },
};

/* ══════════════════════════════════════════
   THEME TOGGLE
══════════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem('kashly-admin-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('kashly-admin-theme', next);
    // Redraw charts with new theme colors
    setTimeout(() => {
      PageControllers.loaded.delete('dashboard');
      if (Nav.current === 'dashboard') PageControllers.load('dashboard');
    }, 350);
  });
}

/* ══════════════════════════════════════════
   SIDEBAR & MOBILE
══════════════════════════════════════════ */
function initSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburgerAdmin');
  const closeBtn  = document.getElementById('sidebarClose');

  hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));
  closeBtn.addEventListener('click',  () => sidebar.classList.remove('open'));

  // Click outside
  document.addEventListener('click', e => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });
}

/* ══════════════════════════════════════════
   NAVIGATION WIRING
══════════════════════════════════════════ */
function initNav() {
  document.querySelectorAll('[data-section]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      Nav.go(el.dataset.section);
    });
  });

  // Link buttons inside pages (e.g. "View all" → applications)
  document.addEventListener('click', e => {
    const target = e.target.closest('[data-section]');
    if (target && !target.classList.contains('sb-link')) {
      e.preventDefault();
      Nav.go(target.dataset.section);
    }
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', () => Modal.close());
  document.getElementById('appModal').addEventListener('click', e => {
    if (e.target === document.getElementById('appModal')) Modal.close();
  });

  // Chart range toggle
  document.getElementById('chartFilter').addEventListener('click', async e => {
    const btn = e.target.closest('.cf-btn');
    if (!btn) return;
    document.querySelectorAll('.cf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const data = await Repo.getDisbursalTrend(btn.dataset.range);
    Charts.drawBar('barChart', data);
  });

  // App filter tabs
  document.getElementById('appFilterTabs').addEventListener('click', e => {
    const tab = e.target.closest('.ftab');
    if (!tab) return;
    document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    PageControllers._appFilter = tab.dataset.filter;
    PageControllers._appPage   = 1;
    PageControllers._loadAppsTable();
  });

  // Export button
  document.getElementById('exportBtn').addEventListener('click', () => {
    Toast.show('Report export started — check your email shortly', 'info');
  });

  // New loan button
  document.getElementById('newLoanBtn').addEventListener('click', () => {
    Toast.show('Redirecting to new application form…', 'info');
  });

  // Notifications
  document.getElementById('notifBtn').addEventListener('click', () => {
    Toast.show('3 new notifications', 'info');
  });

  // Global search (demo)
  const searchInput = document.getElementById('globalSearch');
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (searchInput.value.trim().length > 2) {
        Toast.show(`Searching for "${searchInput.value.trim()}"…`, 'info');
      }
    }, 500);
  });
}

/* ══════════════════════════════════════════
   RESIZE — redraw charts
══════════════════════════════════════════ */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(async () => {
    if (Nav.current === 'dashboard') {
      const range = document.querySelector('.cf-btn.active')?.dataset.range || '6m';
      const data  = await Repo.getDisbursalTrend(range);
      Charts.drawBar('barChart', data);
      const donut = await Repo.getLoanMix();
      Charts.drawDonut('donutChart', donut);
    }
  }, 200);
});

/* ══════════════════════════════════════════
   BOOT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  // ── Auth guard ────────────────────────────────────────────
  if (!isLoggedIn()) {
    window.location.replace(`login.html?redirect=${encodeURIComponent(location.pathname)}`);
    return;
  }
  const user = getStoredUser();
  if (!user || user.role !== 'admin') {
    // Logged in but not admin — kick to their own dashboard
    window.location.replace(getDashboardForRole(user?.role));
    return;
  }
  // ── Proceed ───────────────────────────────────────────────
  initTheme();
  initSidebar();
  initNav();
  await PageControllers.load('dashboard');
});