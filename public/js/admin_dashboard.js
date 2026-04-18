'use strict';
/**
 * ═══════════════════════════════════════════════════════
 * KASHLY ADMIN — admin_dashboard.js
 * Production-ready. All data flows through Repo layer.
 * To wire real API: replace each Repo method body with
 * an authFetch() call to the matching endpoint.
 * ═══════════════════════════════════════════════════════
 */

/* ══════════════════════════════════════════
   CONFIG
══════════════════════════════════════════ */
const CONFIG = {
  API_BASE:    '/api/v1',
  PAGE_SIZE:   8,
  CURRENCY:    '₹',
  DATE_LOCALE: 'en-IN',
};

/* ══════════════════════════════════════════
   UTILS
══════════════════════════════════════════ */
const Utils = {
  fmtCurrency(val) {
    const n = Number(val) || 0;
    if (n >= 1e7) return `${CONFIG.CURRENCY}${(n / 1e7).toFixed(1)}Cr`;
    if (n >= 1e5) return `${CONFIG.CURRENCY}${(n / 1e5).toFixed(1)}L`;
    if (n >= 1e3) return `${CONFIG.CURRENCY}${(n / 1e3).toFixed(0)}K`;
    return `${CONFIG.CURRENCY}${n.toLocaleString('en-IN')}`;
  },
  fmtExact(val) {
    return `${CONFIG.CURRENCY}${(Number(val) || 0).toLocaleString('en-IN')}`;
  },
  fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(CONFIG.DATE_LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
  },
  fmtDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(CONFIG.DATE_LOCALE);
  },
  timeAgo(iso) {
    if (!iso) return '—';
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
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  },
  val(v) { return (v !== null && v !== undefined && v !== '') ? v : '—'; },
};

/* ══════════════════════════════════════════
   REPOSITORY LAYER
   ─────────────────────────────────────────
   Replace mock bodies with real authFetch() calls.
   e.g.:
     async getMetrics() {
       const res = await authFetch('/admin/metrics');
       if (!res?.ok) return null;
       const body = await res.json();
       return body.data ?? body;
     }
══════════════════════════════════════════ */
const Repo = {

  async _get(path) {
    try {
      const res = await authFetch(path);
      if (!res?.ok) return null;
      const body = await res.json();
      return body.data ?? body;
    } catch { return null; }
  },

  async _patch(path, payload) {
    try {
      const res = await authFetch(path, { method: 'PATCH', body: JSON.stringify(payload) });
      if (!res?.ok) return null;
      const body = await res.json();
      return body.data ?? body;
    } catch { return null; }
  },

  async _post(path, payload) {
    try {
      const res = await authFetch(path, { method: 'POST', body: JSON.stringify(payload) });
      if (!res?.ok) return null;
      const body = await res.json();
      return body.data ?? body;
    } catch { return null; }
  },

  /* ── Dashboard ── */
  async getMetrics()              { return this._get('/admin/metrics'); },
  async getDisbursalTrend(range)  { return this._get(`/admin/disbursal-trend?range=${range}`); },
  async getLoanMix()              { return this._get('/admin/loan-mix'); },
  async getActivity()             { return this._get('/admin/activity'); },

  /* ── Applications ── */
  async getApplications(filters = {}) {
    const q = new URLSearchParams({
      status: filters.status || 'all',
      page:   filters.page   || 1,
      size:   filters.size   || CONFIG.PAGE_SIZE,
      q:      filters.q      || '',
    });
    return this._get(`/admin/loans?${q}`);
  },
  async getApplicationById(id)          { return this._get(`/admin/loans/${id}`); },
  async updateApplicationStatus(id, st) { return this._patch(`/admin/loans/${id}/${st}`, {}); },

  /* ── Borrowers ── */
  async getBorrowers(filters = {}) {
    const q = new URLSearchParams({ page: filters.page || 1, size: filters.size || CONFIG.PAGE_SIZE, q: filters.q || '' });
    return this._get(`/admin/borrowers?${q}`);
  },
  async getUserById(id)                 { return this._get(`/admin/users/${id}`); },
  async updateUser(id, payload)         { return this._patch(`/admin/users/${id}`, payload); },
  async resetUserPassword(id)           { return this._post(`/admin/users/${id}/reset-password`, {}); },
  async disableUser(id)                 { return this._patch(`/admin/users/${id}/disable`, {}); },
  async flagUser(id, reason)            { return this._patch(`/admin/users/${id}/flag`, { reason }); },

  /* ── Disbursals ── */
  async getDisbursals(filters = {}) {
    const q = new URLSearchParams({ page: filters.page || 1, size: filters.size || CONFIG.PAGE_SIZE, q: filters.q || '' });
    return this._get(`/admin/disbursals?${q}`);
  },

  /* ── Repayments ── */
  async getRepayments(filters = {}) {
    const q = new URLSearchParams({ page: filters.page || 1, size: filters.size || CONFIG.PAGE_SIZE, q: filters.q || '' });
    return this._get(`/admin/repayments?${q}`);
  },

  /* ── KYC ── */
  async getKycQueue(q = '')      { return this._get(`/admin/kyc?q=${q}`); },
  async updateKycStatus(id, st)  { return this._patch(`/admin/kyc/${id}`, { status: st }); },

  /* ── Collections ── */
  async getCollections(q = '')   { return this._get(`/admin/collections?q=${q}`); },

  /* ── Fraud & Risk ── */
  async getFraudList(filters = {}) {
    const q = new URLSearchParams({ filter: filters.filter || 'all', q: filters.q || '' });
    return this._get(`/admin/fraud?${q}`);
  },
  async flagAccount(id, reason)    { return this._patch(`/admin/users/${id}/flag`, { reason }); },
  async unflagAccount(id)          { return this._patch(`/admin/users/${id}/unflag`, {}); },
  async blockAccount(id)           { return this._patch(`/admin/users/${id}/block`, {}); },
  async adjustRisk(id, level)      { return this._patch(`/admin/users/${id}/risk`, { level }); },

  /* ── Audit Logs ── */
  async getAuditLogs(filters = {}) {
    const q = new URLSearchParams({
      q:       filters.q      || '',
      role:    filters.role   || '',
      action:  filters.action || '',
      from:    filters.from   || '',
      to:      filters.to     || '',
      page:    filters.page   || 1,
      size:    filters.size   || CONFIG.PAGE_SIZE,
    });
    return this._get(`/admin/audit?${q}`);
  },

  /* ── Reports ── */
  async getReports()          { return this._get('/admin/reports'); },

  /* ── Admin management ── */
  async getAdmins()           { return this._get('/admin/admins'); },
  async addAdmin(payload)     { return this._post('/admin/admins', payload); },
  async disableAdmin(id)      { return this._patch(`/admin/admins/${id}/disable`, {}); },
  async getRoles()            { return this._get('/admin/roles'); },
  async addRole(payload)      { return this._post('/admin/roles', payload); },
  async updateRole(id, p)     { return this._patch(`/admin/roles/${id}`, p); },
  async getBanks()            { return this._get('/admin/banks'); },
  async addBank(payload)      { return this._post('/admin/banks', payload); },

  /* ── Notifications ── */
  async sendNotification(payload)           { return this._post('/admin/notifications', payload); },
  async getNotifTemplates()                 { return this._get('/admin/notifications/templates'); },
  async getScheduledNotifs()                { return this._get('/admin/notifications/scheduled'); },
  async getNotifHistory()                   { return this._get('/admin/notifications/history'); },
  async deleteScheduled(id)                 { return this._patch(`/admin/notifications/scheduled/${id}/cancel`, {}); },

  /* ── Settings ── */
  async getSettings()          { return this._get('/admin/settings'); },
  async saveSettings(payload)  { return this._patch('/admin/settings', payload); },

  /* ── Global search ── */
  async search(q) { return this._get(`/admin/search?q=${encodeURIComponent(q)}`); },
};

/* ══════════════════════════════════════════
   SERVICES — badge/display helpers
══════════════════════════════════════════ */
const Services = {
  badgeHtml(status) {
    const map = {
      approved: 'badge-approved', pending: 'badge-pending', rejected: 'badge-rejected',
      disbursed: 'badge-disbursed', overdue: 'badge-overdue', paid: 'badge-paid',
      processing: 'badge-processing', verified: 'badge-verified', review: 'badge-review',
      failed: 'badge-failed', active: 'badge-approved', disabled: 'badge-rejected',
      flagged: 'badge-overdue', blocked: 'badge-rejected', high: 'badge-rejected',
      medium: 'badge-pending', low: 'badge-approved',
    };
    if (!status) return '<span class="badge badge-pending">—</span>';
    const cls = map[status.toLowerCase()] || 'badge-pending';
    return `<span class="badge ${cls}"><span class="badge-dot"></span>${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
  },
  productBadgeHtml(product) {
    if (!product) return '—';
    const map = { Personal: 'badge-personal', Business: 'badge-business', Home: 'badge-home', Education: 'badge-education' };
    return `<span class="badge ${map[product] || ''}">${product}</span>`;
  },
  scoreHtml(score) {
    if (!score && score !== 0) return '<span class="score-pill">—</span>';
    return `<span class="score-pill score-${Utils.scoreClass(score)}">${score}</span>`;
  },
  riskBadge(level) {
    if (!level) return '<span class="score-pill">—</span>';
    const cls = { high: 'score-low', medium: 'score-med', low: 'score-high' };
    return `<span class="score-pill ${cls[level.toLowerCase()] || ''}">${level}</span>`;
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
   CHART ENGINE
══════════════════════════════════════════ */
const Charts = {
  getThemeColors() {
    const s = getComputedStyle(document.documentElement);
    return {
      green: s.getPropertyValue('--green').trim()  || '#D4AF37',
      text3: s.getPropertyValue('--text-3').trim() || 'rgba(255,255,255,0.42)',
      line:  s.getPropertyValue('--line').trim()   || 'rgba(255,255,255,0.08)',
      bg3:   s.getPropertyValue('--bg-3').trim()   || '#111111',
    };
  },
  drawBar(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !Array.isArray(data) || !data.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth, H = 180;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    const C = this.getThemeColors();
    const PAD = { top: 16, right: 16, bottom: 36, left: 40 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barW = (chartW / data.length) * 0.55;
    ctx.strokeStyle = C.line; ctx.lineWidth = 1;
    [0, 0.25, 0.5, 0.75, 1].forEach(t => {
      const y = PAD.top + chartH * (1 - t);
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
      ctx.fillStyle = C.text3; ctx.font = '11px Inter';
      ctx.fillText(Math.round(maxVal * t), 4, y + 4);
    });
    data.forEach((d, i) => {
      const x = PAD.left + (i / data.length) * chartW + (chartW / data.length - barW) / 2;
      const barH = (d.value / maxVal) * chartH;
      const y = PAD.top + chartH - barH;
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, C.green); grad.addColorStop(1, C.green + '44');
      ctx.fillStyle = grad;
      const r = Math.min(4, barW / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + barW - r, y);
      ctx.arcTo(x + barW, y, x + barW, y + r, r);
      ctx.lineTo(x + barW, y + barH); ctx.lineTo(x, y + barH);
      ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.text3; ctx.font = '11px Inter'; ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barW / 2, H - PAD.bottom + 16);
    });
  },
  drawDonut(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !Array.isArray(data) || !data.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const S = 180;
    canvas.width = S * dpr; canvas.height = S * dpr;
    canvas.style.width = S + 'px'; canvas.style.height = S + 'px';
    ctx.scale(dpr, dpr);
    const cx = S / 2, cy = S / 2, r = 72, ir = 50;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let angle = -Math.PI / 2;
    data.forEach(d => {
      const sweep = (d.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, angle + sweep);
      ctx.arc(cx, cy, ir, angle + sweep, angle, true);
      ctx.closePath();
      ctx.fillStyle = d.color; ctx.fill();
      angle += sweep;
    });
  },
};

/* ══════════════════════════════════════════
   NAV
══════════════════════════════════════════ */
const Nav = {
  current: 'dashboard',
  sectionMap: {
    dashboard: 'pageDashboard', applications: 'pageApplications',
    borrowers: 'pageBorrowers', disbursals: 'pageDisbursals',
    repayments: 'pageRepayments', kyc: 'pageKyc',
    collections: 'pageCollections', fraud: 'pageFraud',
    reports: 'pageReports', audit: 'pageAudit',
    users: 'pageUsers', admins: 'pageAdmins',
    notifications: 'pageNotifications', settings: 'pageSettings',
  },
  labelMap: {
    dashboard: 'Dashboard', applications: 'Applications', borrowers: 'Borrowers',
    disbursals: 'Disbursals', repayments: 'Repayments', kyc: 'KYC Review',
    collections: 'Collections', fraud: 'Fraud & Risk', reports: 'Reports',
    audit: 'Audit Logs', users: 'User Management', admins: 'Admin & Roles',
    notifications: 'Notifications', settings: 'Settings',
  },
  go(section) {
    if (!this.sectionMap[section]) return;
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const page = document.getElementById(this.sectionMap[section]);
    if (page) page.classList.remove('hidden');
    // Sidebar active state
    document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll(`[data-section="${section}"]`).forEach(l => l.classList.add('active'));
    // Breadcrumb
    const bc = document.getElementById('bcCurrent');
    if (bc) bc.textContent = this.labelMap[section] || section;
    this.current = section;
    // Close sidebar on mobile
    if (window.innerWidth <= 768) document.getElementById('sidebar')?.classList.remove('open');
    PageControllers.load(section);
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
    try {
      await (this[section]?.());
    } catch (e) {
      console.error(`PageControllers.${section} error:`, e);
    }
  },

  /* ── DASHBOARD ── */
  async dashboard() {
    const hour = new Date().getHours();
    const sal  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const user = getStoredUser();
    const name = user?.name?.split(' ')[0] || 'Admin';
    const greetEl = document.getElementById('dashGreeting');
    if (greetEl) greetEl.innerHTML = `${sal}, ${name} <span class="wave"><img src="assets/Logos/goodbye.png" height="35px" width="auto"/></span>`;

    const today = document.getElementById('todayDate');
    if (today) today.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Sidebar user info
    if (user) {
      const av = document.getElementById('sbAvatar');
      const nm = document.getElementById('sbUserName');
      const rl = document.getElementById('sbUserRole');
      if (av) av.textContent = Utils.initials(user.name || user.email || 'A');
      if (nm) nm.textContent = user.name || user.email || 'Admin';
      if (rl) rl.textContent = user.role || 'Admin';
    }

    const [metrics, activity] = await Promise.all([Repo.getMetrics(), Repo.getActivity()]);
    this._renderKpiGrid(metrics);
    this._renderActivity(activity);
    await Promise.all([this._renderDisbursalChart('6m'), this._renderDonut(), this._renderRecentApps()]);
  },

  _renderKpiGrid(metrics) {
    const grid = document.getElementById('kpiGrid');
    if (!grid) return;
    if (!metrics) { grid.innerHTML = '<p style="color:var(--text-3);padding:16px;">Failed to load metrics</p>'; return; }

    const cards = [
      { key: 'totalDisbursed',  label: 'Total Disbursed',    icon: `<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`, color: 'green',  fmt: v => Utils.fmtCurrency(v) },
      { key: 'activeBorrowers', label: 'Active Borrowers',    icon: `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,        color: 'blue',   fmt: v => v?.toLocaleString('en-IN') || '—' },
      { key: 'pendingApps',     label: 'Pending Applications',icon: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`, color: 'amber', fmt: v => v ?? '—' },
      { key: 'npaRate',         label: 'NPA Rate',             icon: `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`,  color: 'red',   fmt: v => v ?? '—' },
    ];

    grid.innerHTML = cards.map(c => {
      const m    = metrics[c.key];
      const val  = m ? c.fmt(m.value) : '—';
      const dir  = m?.dir;
      const delta = m?.delta != null ? `${Math.abs(m.delta)}%` : null;
      const warn  = m?.warning;
      return `
        <div class="kpi-card ${c.color}">
          <div class="kpi-icon ${c.color}">${c.icon}</div>
          <div class="kpi-val num">${val}</div>
          <div class="kpi-label">${c.label}</div>
          ${delta ? `<div class="kpi-delta ${warn ? 'delta-warn' : dir === 'up' ? 'delta-up' : 'delta-down'}">
            ${dir === 'up' ? '▲' : '▼'} ${delta} vs last month
          </div>` : ''}
        </div>`;
    }).join('');

    // Update applications badge
    const pend = metrics.pendingApps?.value;
    const badge = document.getElementById('sbBadgeApps');
    if (badge && pend != null) badge.textContent = pend;
  },

  async _renderDisbursalChart(range) {
    const data = await Repo.getDisbursalTrend(range);
    Charts.drawBar('barChart', Array.isArray(data) ? data : []);
  },

  async _renderDonut() {
    const data = await Repo.getLoanMix();
    Charts.drawDonut('donutChart', Array.isArray(data) ? data : []);
    const legend = document.getElementById('donutLegend');
    const totalEl = document.getElementById('donutTotal');
    if (!Array.isArray(data) || !data.length) return;
    const total = data.reduce((s, d) => s + (d.value || 0), 0);
    if (totalEl) totalEl.textContent = Utils.fmtCurrency(total * 1e7);
    if (legend) legend.innerHTML = data.map(d => `
      <li class="dl-item">
        <span class="dl-dot" style="background:${d.color}"></span>
        <span class="dl-name">${d.label}</span>
        <span class="dl-pct">${((d.value / total) * 100).toFixed(0)}%</span>
      </li>`).join('');
  },

  async _renderRecentApps() {
    const result = await Repo.getApplications({ page: 1, size: 5 });
    const items = result?.items ?? result?.loans ?? (Array.isArray(result) ? result : []);
    const tbody = document.getElementById('appsTableBody');
    if (!tbody) return;
    if (!items.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-3)">No applications</td></tr>'; return; }
    tbody.innerHTML = items.map(a => `
      <tr>
        <td><span class="td-bold user-link" data-id="${a.id || a._id}" data-type="application">${Utils.val(a.name || a.applicantName)}</span><br/><span style="font-size:11px;color:var(--text-3)">${Utils.val(a.id)}</span></td>
        <td>${Services.productBadgeHtml(a.product || a.loanType)}</td>
        <td class="td-green td-num">${Utils.fmtExact(a.amount)}</td>
        <td>${Services.scoreHtml(a.cibilScore || a.creditScore)}</td>
        <td>${Services.badgeHtml(a.status)}</td>
        <td><button class="btn btn-ghost btn-sm review-btn" data-id="${a.id || a._id}">Review</button></td>
      </tr>`).join('');
    tbody.querySelectorAll('.review-btn').forEach(btn => btn.addEventListener('click', () => Modal.openApplication(btn.dataset.id)));
    tbody.querySelectorAll('.user-link').forEach(el => el.addEventListener('click', () => Modal.openApplication(el.dataset.id)));
  },

  async _renderActivity(items) {
    const list = document.getElementById('activityList');
    if (!list) return;
    const data = Array.isArray(items) ? items : [];
    if (!data.length) { list.innerHTML = '<li style="color:var(--text-3);padding:16px;font-size:13px;">No recent activity</li>'; return; }
    list.innerHTML = data.map(item => `
      <li class="activity-item">
        <div class="activity-dot ${item.color || 'blue'}">${Services.activityIcon(item.color || 'blue')}</div>
        <div class="activity-body">
          <div class="activity-text">${item.text || item.message || '—'}</div>
          <div class="activity-time">${Utils.timeAgo(item.time || item.createdAt)}</div>
        </div>
      </li>`).join('');
  },

  /* ── APPLICATIONS ── */
  _appPage: 1, _appFilter: 'all', _appSearch: '',

  async applications() {
    await this._loadAppsTable();
    // Wire search
    const searchEl = document.getElementById('appsSearch');
    if (searchEl && !searchEl.dataset.wired) {
      searchEl.dataset.wired = '1';
      let t;
      searchEl.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          this._appSearch = searchEl.value.trim();
          this._appPage = 1;
          this.loaded.delete('applications');
          this._loadAppsTable();
        }, 400);
      });
    }
  },

  async _loadAppsTable() {
    const result = await Repo.getApplications({ status: this._appFilter, page: this._appPage, size: CONFIG.PAGE_SIZE, q: this._appSearch });
    const items  = result?.items ?? result?.loans ?? (Array.isArray(result) ? result : []);
    const total  = result?.total ?? items.length;
    const pages  = result?.pages ?? Math.ceil(total / CONFIG.PAGE_SIZE);
    const tbody = document.getElementById('fullAppsBody');
    if (!tbody) return;
    if (!items.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-3);padding:24px;">No applications found</td></tr>'; return; }
    tbody.innerHTML = items.map(a => `
      <tr>
        <td class="td-num td-bold">${Utils.val(a.id)}</td>
        <td><span class="td-bold user-link" data-id="${a.id || a._id}" style="cursor:pointer;color:var(--green)">${Utils.val(a.name || a.applicantName)}</span></td>
        <td>${Services.productBadgeHtml(a.product || a.loanType)}</td>
        <td class="td-green td-num">${Utils.fmtExact(a.amount)}</td>
        <td class="td-num">${Utils.fmtDate(a.appliedAt || a.createdAt)}</td>
        <td>${Services.scoreHtml(a.cibilScore || a.creditScore)}</td>
        <td>${Services.badgeHtml(a.status)}</td>
        <td>
          <div class="td-actions">
            <button class="btn btn-success btn-sm approve-btn" data-id="${a.id || a._id}">Approve</button>
            <button class="btn btn-danger btn-sm reject-btn" data-id="${a.id || a._id}">Reject</button>
            <button class="btn btn-ghost btn-sm review-btn" data-id="${a.id || a._id}">View</button>
          </div>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('.approve-btn').forEach(btn => btn.addEventListener('click', async () => {
      await Repo.updateApplicationStatus(btn.dataset.id, 'approve');
      Toast.show('Application approved', 'success');
      this.loaded.delete('applications');
      await this._loadAppsTable();
    }));
    tbody.querySelectorAll('.reject-btn').forEach(btn => btn.addEventListener('click', async () => {
      await Repo.updateApplicationStatus(btn.dataset.id, 'reject');
      Toast.show('Application rejected', 'error');
      this.loaded.delete('applications');
      await this._loadAppsTable();
    }));
    tbody.querySelectorAll('.review-btn').forEach(btn => btn.addEventListener('click', () => Modal.openApplication(btn.dataset.id)));
    tbody.querySelectorAll('.user-link').forEach(el => el.addEventListener('click', () => Modal.openApplication(el.dataset.id)));

    this._renderPagination('appPagination', pages, this._appPage, p => {
      this._appPage = p;
      this.loaded.delete('applications');
      this._loadAppsTable();
    });
  },

  /* ── BORROWERS ── */
  _borrowersPage: 1, _borrowersSearch: '',

  async borrowers() {
    await this._loadBorrowersTable();
    const searchEl = document.getElementById('borrowersSearch');
    if (searchEl && !searchEl.dataset.wired) {
      searchEl.dataset.wired = '1';
      let t;
      searchEl.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          this._borrowersSearch = searchEl.value.trim();
          this._borrowersPage = 1;
          this.loaded.delete('borrowers');
          this._loadBorrowersTable();
        }, 400);
      });
    }
  },

  async _loadBorrowersTable() {
    const result = await Repo.getBorrowers({ page: this._borrowersPage, size: CONFIG.PAGE_SIZE, q: this._borrowersSearch });
    const data = result?.items ?? result?.borrowers ?? (Array.isArray(result) ? result : []);
    const pages = result?.pages ?? 1;
    const tbody = document.getElementById('borrowersBody');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-3);padding:24px;">No borrowers found</td></tr>'; return; }

    tbody.innerHTML = data.map(b => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="kyc-avatar" style="width:32px;height:32px;font-size:11px">${Utils.initials(b.name)}</div>
            <span class="td-bold user-link" data-id="${b.userId || b.id || b._id}" style="cursor:pointer;color:var(--green)">${Utils.val(b.name)}</span>
          </div>
        </td>
        <td class="td-num">${Utils.val(b.mobile || b.phone)}</td>
        <td class="td-num" style="text-align:center">${b.activeLoans ?? b.activeLoanCount ?? '—'}</td>
        <td class="td-green td-num">${Utils.fmtCurrency(b.totalBorrowed || b.totalLoanedPaise / 100 || 0)}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="flex:1;height:4px;border-radius:2px;background:var(--line)">
              <div style="height:100%;width:${b.repaymentRate || 0}%;border-radius:2px;background:${(b.repaymentRate || 0) >= 95 ? 'var(--green)' : (b.repaymentRate || 0) >= 85 ? 'var(--amber)' : 'var(--red)'}"></div>
            </div>
            <span class="td-num" style="font-size:12px">${b.repaymentRate ?? '—'}%</span>
          </div>
        </td>
        <td>${Services.badgeHtml(b.kyc || b.kycStatus)}</td>
        <td>${Services.riskBadge(b.riskLevel || b.risk)}</td>
        <td class="td-num" style="color:var(--text-3)">${Utils.fmtDate(b.joinedAt || b.createdAt)}</td>
        <td>
          <div class="td-actions">
            <button class="btn btn-ghost btn-sm view-user-btn" data-id="${b.userId || b.id || b._id}">View</button>
            <div class="action-menu-wrap" style="position:relative">
              <button class="btn btn-ghost btn-sm action-menu-btn" data-id="${b.userId || b.id || b._id}">•••</button>
            </div>
          </div>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('.view-user-btn, .user-link').forEach(el => el.addEventListener('click', () => Modal.openUser(el.dataset.id)));
    tbody.querySelectorAll('.action-menu-btn').forEach(btn => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      UserActionsMenu.show(btn, btn.dataset.id);
    }));

    // KPI
    const kpi = document.getElementById('borrowerKpi');
    if (kpi && Array.isArray(data)) {
      const active = data.filter(b => (b.activeLoans || b.activeLoanCount || 0) > 0).length;
      const avgRate = data.length ? (data.reduce((s, b) => s + (b.repaymentRate || 0), 0) / data.length).toFixed(1) : '—';
      kpi.innerHTML = `
        <div class="kpi-card green"><div class="kpi-icon green"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div><div class="kpi-val num">${result?.total ?? data.length}</div><div class="kpi-label">Total Borrowers</div></div>
        <div class="kpi-card amber"><div class="kpi-icon amber"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div class="kpi-val num">${active}</div><div class="kpi-label">With Active Loans</div></div>
        <div class="kpi-card blue"><div class="kpi-icon blue"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div><div class="kpi-val num">${avgRate}%</div><div class="kpi-label">Avg Repayment Rate</div></div>`;
    }
    this._renderPagination('borrowersPagination', pages, this._borrowersPage, p => {
      this._borrowersPage = p;
      this.loaded.delete('borrowers');
      this._loadBorrowersTable();
    });
  },

  /* ── DISBURSALS ── */
  async disbursals() {
    const result = await Repo.getDisbursals();
    const data = result?.items ?? result?.disbursals ?? (Array.isArray(result) ? result : []);
    const tbody = document.getElementById('disbursalsBody');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-3);padding:24px;">No disbursals found</td></tr>'; return; }
    tbody.innerHTML = data.map(d => `
      <tr>
        <td class="td-num td-bold">${Utils.val(d.id)}</td>
        <td><span class="user-link" data-id="${d.borrowerId || d.userId}" style="cursor:pointer;color:var(--green)">${Utils.val(d.borrower || d.borrowerName)}</span></td>
        <td>${Services.productBadgeHtml(d.product || d.loanType)}</td>
        <td class="td-green td-num">${Utils.fmtExact(d.amount)}</td>
        <td>${Utils.val(d.bank)}</td>
        <td class="td-num" style="color:var(--text-3)">${Utils.fmtDate(d.date || d.disbursedAt)}</td>
        <td>${Services.badgeHtml(d.status)}</td>
      </tr>`).join('');
    tbody.querySelectorAll('.user-link').forEach(el => el.addEventListener('click', () => Modal.openUser(el.dataset.id)));

    const searchEl = document.getElementById('disbursalsSearch');
    if (searchEl && !searchEl.dataset.wired) {
      searchEl.dataset.wired = '1';
      let t; searchEl.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => { this.loaded.delete('disbursals'); this.disbursals(); }, 400);
      });
    }
  },

  /* ── REPAYMENTS ── */
  async repayments() {
    const result = await Repo.getRepayments();
    const data = result?.items ?? result?.repayments ?? (Array.isArray(result) ? result : []);
    const tbody = document.getElementById('repaymentsBody');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-3);padding:24px;">No repayments found</td></tr>'; return; }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td class="td-num">${Utils.val(r.id)}</td>
        <td><span class="user-link" data-id="${r.borrowerId}" style="cursor:pointer;color:var(--green)">${Utils.val(r.borrower)}</span></td>
        <td class="td-num">${Utils.val(r.loanId)}</td>
        <td class="td-num" style="${new Date(r.dueDate) < new Date() && r.status !== 'paid' ? 'color:var(--red)' : ''}">${Utils.fmtDate(r.dueDate)}</td>
        <td class="td-num td-green">${Utils.fmtExact(r.amount)}</td>
        <td class="td-num" style="color:var(--text-3)">${Utils.fmtDate(r.paidOn)}</td>
        <td>${Services.badgeHtml(r.status)}</td>
      </tr>`).join('');
    tbody.querySelectorAll('.user-link').forEach(el => el.addEventListener('click', () => Modal.openUser(el.dataset.id)));

    const kpi = document.getElementById('repaymentKpi');
    if (kpi) {
      const paid = data.filter(r => r.status === 'paid').length;
      const overdue = data.filter(r => r.status === 'overdue').length;
      const total = data.reduce((s, r) => s + (r.amount || 0), 0);
      kpi.innerHTML = `
        <div class="kpi-card green"><div class="kpi-icon green"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div class="kpi-val num">${paid}</div><div class="kpi-label">EMIs Paid</div></div>
        <div class="kpi-card red"><div class="kpi-icon red"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><div class="kpi-val num">${overdue}</div><div class="kpi-label">Overdue EMIs</div></div>
        <div class="kpi-card blue"><div class="kpi-icon blue"><svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div><div class="kpi-val num">${Utils.fmtCurrency(total)}</div><div class="kpi-label">Total Collected</div></div>`;
    }
  },

  /* ── KYC ── */
  async kyc() {
    const result = await Repo.getKycQueue();
    const data = result?.items ?? result?.queue ?? (Array.isArray(result) ? result : []);
    const grid = document.getElementById('kycGrid');
    if (!grid) return;
    const badge = document.getElementById('sbBadgeKyc');
    if (badge) badge.textContent = data.length || '0';
    if (!data.length) { grid.innerHTML = '<p style="color:var(--text-3);padding:24px;">No KYC cases pending</p>'; return; }
    grid.innerHTML = data.map(k => `
      <div class="kyc-card">
        <div class="kyc-card-top">
          <div class="kyc-avatar">${Utils.initials(k.name)}</div>
          <div>
            <div class="kyc-name user-link" data-id="${k.userId || k.id}" style="cursor:pointer;color:var(--green)">${Utils.val(k.name)}</div>
            <div class="kyc-id">${Utils.val(k.id)}</div>
          </div>
        </div>
        <div class="kyc-docs">
          ${(k.docs || []).map(d => `
            <div class="kyc-doc-row">
              <span class="kyc-doc-name">${d.name}</span>
              ${Services.badgeHtml(d.status)}
              ${d.url ? `<a href="${d.url}" target="_blank" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px">View</a>` : ''}
            </div>`).join('')}
        </div>
        <div class="kyc-card-actions">
          <button class="btn btn-success btn-sm kyc-approve" data-id="${k.id}">Approve</button>
          <button class="btn btn-danger btn-sm kyc-reject" data-id="${k.id}">Reject</button>
        </div>
      </div>`).join('');

    grid.querySelectorAll('.kyc-approve').forEach(btn => btn.addEventListener('click', async () => {
      await Repo.updateKycStatus(btn.dataset.id, 'verified');
      Toast.show('KYC approved', 'success');
      this.loaded.delete('kyc');
      await this.kyc();
    }));
    grid.querySelectorAll('.kyc-reject').forEach(btn => btn.addEventListener('click', async () => {
      await Repo.updateKycStatus(btn.dataset.id, 'rejected');
      Toast.show('KYC rejected', 'error');
      this.loaded.delete('kyc');
      await this.kyc();
    }));
    grid.querySelectorAll('.user-link').forEach(el => el.addEventListener('click', () => Modal.openUser(el.dataset.id)));
  },

  /* ── COLLECTIONS ── */
  async collections() {
    const result = await Repo.getCollections();
    const data = result?.items ?? (Array.isArray(result) ? result : []);
    const tbody = document.getElementById('collectionsBody');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-3);padding:24px;">No overdue accounts</td></tr>'; return; }
    tbody.innerHTML = data.map(c => `
      <tr>
        <td><span class="td-bold user-link" data-id="${c.userId}" style="cursor:pointer;color:var(--green)">${Utils.val(c.name)}</span></td>
        <td class="td-num">${Utils.val(c.loanId)}</td>
        <td class="td-num" style="text-align:center">${c.overdueEmis ?? '—'}</td>
        <td class="td-num" style="color:var(--red)">${Utils.fmtExact(c.overdueAmount)}</td>
        <td><span class="score-pill ${(c.dpd || 0) <= 30 ? 'score-med' : 'score-low'}">${c.dpd ?? '—'}d</span></td>
        <td style="color:var(--text-2)">${Utils.val(c.agent)}</td>
        <td><button class="btn btn-ghost btn-sm send-reminder" data-id="${c.userId}" data-name="${c.name}">Send reminder</button></td>
      </tr>`).join('');

    tbody.querySelectorAll('.send-reminder').forEach(btn => btn.addEventListener('click', async () => {
      await Repo.sendNotification({ userId: btn.dataset.id, type: 'reminder', message: 'EMI reminder' });
      Toast.show(`Reminder sent to ${btn.dataset.name}`, 'info');
    }));
    tbody.querySelectorAll('.user-link').forEach(el => el.addEventListener('click', () => Modal.openUser(el.dataset.id)));
  },

  /* ── FRAUD & RISK ── */
  _fraudFilter: 'all', _fraudSearch: '',

  async fraud() {
    await this._loadFraudTable();
    // Wire filter tabs
    document.querySelectorAll('[data-fraud-filter]').forEach(btn => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-fraud-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._fraudFilter = btn.dataset.fraudFilter;
        this.loaded.delete('fraud');
        this._loadFraudTable();
      });
    });
    const searchEl = document.getElementById('fraudSearch');
    if (searchEl && !searchEl.dataset.wired) {
      searchEl.dataset.wired = '1';
      let t; searchEl.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => { this._fraudSearch = searchEl.value.trim(); this.loaded.delete('fraud'); this._loadFraudTable(); }, 400);
      });
    }
  },

  async _loadFraudTable() {
    const result = await Repo.getFraudList({ filter: this._fraudFilter, q: this._fraudSearch });
    const data = result?.items ?? result?.users ?? (Array.isArray(result) ? result : []);
    const tbody = document.getElementById('fraudBody');
    if (!tbody) return;

    const kpi = document.getElementById('fraudKpi');
    if (kpi && Array.isArray(data)) {
      const flagged = data.filter(u => u.flagged).length;
      const blocked = data.filter(u => u.isBlacklisted || u.blocked).length;
      const highRisk = data.filter(u => (u.riskLevel || '').toLowerCase() === 'high').length;
      kpi.innerHTML = `
        <div class="kpi-card red"><div class="kpi-icon red"><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg></div><div class="kpi-val num">${flagged}</div><div class="kpi-label">Flagged</div></div>
        <div class="kpi-card amber"><div class="kpi-icon amber"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div><div class="kpi-val num">${blocked}</div><div class="kpi-label">Blocked</div></div>
        <div class="kpi-card blue"><div class="kpi-icon blue"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div><div class="kpi-val num">${highRisk}</div><div class="kpi-label">High Risk</div></div>`;
    }

    if (!data.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-3);padding:24px;">No flagged accounts</td></tr>'; return; }
    tbody.innerHTML = data.map(u => `
      <tr>
        <td><span class="td-bold user-link" data-id="${u.userId || u.id || u._id}" style="cursor:pointer;color:var(--green)">${Utils.val(u.name)}</span><br/><span style="font-size:11px;color:var(--text-3)">${Utils.val(u.email)}</span></td>
        <td>${Services.riskBadge(u.riskLevel || u.risk)}</td>
        <td style="font-size:12px;color:var(--text-2)">${Utils.val(u.flagReason || u.reason)}</td>
        <td class="td-num">${u.transactionCount ?? '—'}</td>
        <td>${Services.badgeHtml(u.isBlacklisted || u.blocked ? 'blocked' : u.flagged ? 'flagged' : 'active')}</td>
        <td class="td-num" style="color:var(--text-3)">${Utils.timeAgo(u.lastActivity || u.updatedAt)}</td>
        <td>
          <div class="td-actions">
            <button class="btn btn-ghost btn-sm view-user-btn" data-id="${u.userId || u.id}">View</button>
            <button class="btn btn-ghost btn-sm unflag-btn" data-id="${u.userId || u.id}" data-name="${u.name}">Unflag</button>
            <button class="btn btn-danger btn-sm block-btn" data-id="${u.userId || u.id}" data-name="${u.name}">Block</button>
          </div>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('.view-user-btn, .user-link').forEach(el => el.addEventListener('click', () => Modal.openUser(el.dataset.id)));
    tbody.querySelectorAll('.unflag-btn').forEach(btn => btn.addEventListener('click', async () => {
      await Repo.unflagAccount(btn.dataset.id);
      Toast.show(`${btn.dataset.name} unflagged`, 'success');
      this.loaded.delete('fraud'); this._loadFraudTable();
    }));
    tbody.querySelectorAll('.block-btn').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm(`Block ${btn.dataset.name}? This will disable their account.`)) return;
      await Repo.blockAccount(btn.dataset.id);
      Toast.show(`${btn.dataset.name} blocked`, 'error');
      this.loaded.delete('fraud'); this._loadFraudTable();
    }));
  },

  /* ── AUDIT LOGS ── */
  _auditPage: 1, _auditFilters: {},

  async audit() {
    await this._loadAuditTable();
    const applyBtn = document.getElementById('auditFilterBtn');
    if (applyBtn && !applyBtn.dataset.wired) {
      applyBtn.dataset.wired = '1';
      applyBtn.addEventListener('click', () => {
        this._auditFilters = {
          q:      document.getElementById('auditSearch')?.value || '',
          role:   document.getElementById('auditRoleFilter')?.value || '',
          action: document.getElementById('auditActionFilter')?.value || '',
          from:   document.getElementById('auditDateFrom')?.value || '',
          to:     document.getElementById('auditDateTo')?.value || '',
        };
        this._auditPage = 1;
        this.loaded.delete('audit');
        this._loadAuditTable();
      });
    }
    const searchEl = document.getElementById('auditSearch');
    if (searchEl && !searchEl.dataset.wired) {
      searchEl.dataset.wired = '1';
      let t; searchEl.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => { applyBtn?.click(); }, 400);
      });
    }
    document.getElementById('exportAuditBtn')?.addEventListener('click', () => Toast.show('Audit export started', 'info'));
  },

  async _loadAuditTable() {
    const result = await Repo.getAuditLogs({ ...this._auditFilters, page: this._auditPage, size: CONFIG.PAGE_SIZE });
    const data = result?.items ?? result?.logs ?? (Array.isArray(result) ? result : []);
    const pages = result?.pages ?? 1;
    const tbody = document.getElementById('auditBody');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-3);padding:24px;">No logs found</td></tr>'; return; }
    tbody.innerHTML = data.map(l => `
      <tr>
        <td class="td-num" style="font-size:12px;color:var(--text-3)">${Utils.fmtDateTime(l.createdAt || l.timestamp)}</td>
        <td class="td-bold">${Utils.val(l.actorId)}</td>
        <td>${Services.badgeHtml(l.actorRole || l.role)}</td>
        <td style="font-size:13px">${Utils.val(l.action)}</td>
        <td style="font-size:12px;color:var(--text-2)">${Utils.val(l.resourceType)} ${Utils.val(l.resourceId)}</td>
        <td class="td-num" style="font-size:12px;color:var(--text-3)">${Utils.val(l.ip)}</td>
        <td><button class="btn btn-ghost btn-sm log-detail-btn" data-log='${JSON.stringify({ before: l.before, after: l.after })}'>Details</button></td>
      </tr>`).join('');

    tbody.querySelectorAll('.log-detail-btn').forEach(btn => btn.addEventListener('click', () => {
      try {
        const d = JSON.parse(btn.dataset.log);
        Modal.openRaw('Audit Log Details', `<pre style="font-size:12px;white-space:pre-wrap;word-break:break-all;color:var(--text-2)">${JSON.stringify(d, null, 2)}</pre>`);
      } catch {}
    }));
    this._renderPagination('auditPagination', pages, this._auditPage, p => {
      this._auditPage = p;
      this.loaded.delete('audit');
      this._loadAuditTable();
    });
  },

  /* ── USER MANAGEMENT ── */
  _usersPage: 1, _usersSearch: '',

  async users() {
    await this._loadUsersTable();
    const searchEl = document.getElementById('usersSearch');
    if (searchEl && !searchEl.dataset.wired) {
      searchEl.dataset.wired = '1';
      let t; searchEl.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => { this._usersSearch = searchEl.value.trim(); this._usersPage = 1; this.loaded.delete('users'); this._loadUsersTable(); }, 400);
      });
    }
  },

  async _loadUsersTable() {
    const result = await Repo.getBorrowers({ page: this._usersPage, size: CONFIG.PAGE_SIZE, q: this._usersSearch });
    const data = result?.items ?? result?.users ?? result?.borrowers ?? (Array.isArray(result) ? result : []);
    const pages = result?.pages ?? 1;
    const tbody = document.getElementById('usersBody');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-3);padding:24px;">No users found</td></tr>'; return; }
    tbody.innerHTML = data.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="kyc-avatar" style="width:32px;height:32px;font-size:11px">${Utils.initials(u.name)}</div>
            <span class="td-bold user-link" data-id="${u.userId || u.id || u._id}" style="cursor:pointer;color:var(--green)">${Utils.val(u.name)}</span>
          </div>
        </td>
        <td style="font-size:12px;color:var(--text-2)">${Utils.val(u.email)}</td>
        <td class="td-num">${Utils.val(u.mobile || u.phone)}</td>
        <td>${Services.badgeHtml(u.kycStatus || u.kyc)}</td>
        <td>${Services.riskBadge(u.riskLevel || u.risk)}</td>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:60px;height:4px;border-radius:2px;background:var(--line)">
              <div style="height:100%;width:${u.repaymentRate || 0}%;border-radius:2px;background:var(--green)"></div>
            </div>
            <span style="font-size:12px">${u.repaymentRate ?? '—'}%</span>
          </div>
        </td>
        <td>${Services.badgeHtml(u.isBlacklisted || u.disabled ? 'disabled' : 'active')}</td>
        <td class="td-num" style="color:var(--text-3)">${Utils.fmtDate(u.joinedAt || u.createdAt)}</td>
        <td>
          <div class="td-actions">
            <button class="btn btn-ghost btn-sm view-user-btn" data-id="${u.userId || u.id || u._id}">View</button>
            <button class="btn btn-ghost btn-sm action-menu-btn" data-id="${u.userId || u.id || u._id}" data-name="${u.name}">•••</button>
          </div>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('.view-user-btn, .user-link').forEach(el => el.addEventListener('click', () => Modal.openUser(el.dataset.id)));
    tbody.querySelectorAll('.action-menu-btn').forEach(btn => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      UserActionsMenu.show(btn, btn.dataset.id, btn.dataset.name);
    }));
    this._renderPagination('usersPagination', pages, this._usersPage, p => {
      this._usersPage = p;
      this.loaded.delete('users');
      this._loadUsersTable();
    });
  },

  /* ── ADMIN & ROLES ── */
  async admins() {
    await this._loadAdminsTab('admins');
    // Sub-tab wiring
    document.querySelectorAll('[data-admin-tab]').forEach(btn => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ['adminTabAdmins', 'adminTabRoles', 'adminTabBanks'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
        const map = { admins: 'adminTabAdmins', roles: 'adminTabRoles', banks: 'adminTabBanks' };
        document.getElementById(map[btn.dataset.adminTab])?.classList.remove('hidden');
        this._loadAdminsTab(btn.dataset.adminTab);
      });
    });
    document.getElementById('addAdminBtn')?.addEventListener('click', () => Modal.openAddAdmin());
    document.getElementById('addRoleBtn')?.addEventListener('click', () => Modal.openAddRole());
    document.getElementById('addBankBtn')?.addEventListener('click', () => Modal.openAddBank());
  },

  async _loadAdminsTab(tab) {
    if (tab === 'admins') {
      const data = await Repo.getAdmins();
      const list = data?.admins ?? data?.items ?? (Array.isArray(data) ? data : []);
      const tbody = document.getElementById('adminsBody');
      if (!tbody) return;
      tbody.innerHTML = list.length ? list.map(a => `
        <tr>
          <td><div style="display:flex;align-items:center;gap:10px"><div class="kyc-avatar" style="width:32px;height:32px;font-size:11px">${Utils.initials(a.name)}</div><span class="td-bold">${Utils.val(a.name)}</span></div></td>
          <td style="font-size:12px;color:var(--text-2)">${Utils.val(a.email)}</td>
          <td>${Services.badgeHtml(a.role)}</td>
          <td class="td-num" style="color:var(--text-3)">${Utils.timeAgo(a.lastLogin)}</td>
          <td>${Services.badgeHtml(a.status || 'active')}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-ghost btn-sm edit-admin-btn" data-id="${a.id || a._id}">Edit</button>
              <button class="btn btn-danger btn-sm disable-admin-btn" data-id="${a.id || a._id}" data-name="${a.name}">Disable</button>
            </div>
          </td>
        </tr>`).join('')
        : '<tr><td colspan="6" style="text-align:center;color:var(--text-3);padding:24px;">No admins found</td></tr>';
      tbody.querySelectorAll('.disable-admin-btn').forEach(btn => btn.addEventListener('click', async () => {
        if (!confirm(`Disable ${btn.dataset.name}?`)) return;
        await Repo.disableAdmin(btn.dataset.id);
        Toast.show(`${btn.dataset.name} disabled`, 'error');
        this.loaded.delete('admins'); await this._loadAdminsTab('admins');
      }));
    } else if (tab === 'roles') {
      const data = await Repo.getRoles();
      const list = Array.isArray(data) ? data : data?.roles ?? [];
      const tbody = document.getElementById('rolesBody');
      if (!tbody) return;
      tbody.innerHTML = list.length ? list.map(r => `
        <tr>
          <td class="td-bold">${Utils.val(r.name)}</td>
          <td style="font-size:12px;color:var(--text-2)">${(r.permissions || []).join(', ') || '—'}</td>
          <td class="td-num">${r.userCount ?? '—'}</td>
          <td><button class="btn btn-ghost btn-sm" onclick="Modal.openEditRole('${r.id}','${r.name}')">Edit</button></td>
        </tr>`).join('')
        : '<tr><td colspan="4" style="text-align:center;color:var(--text-3);padding:24px;">No roles defined</td></tr>';
    } else if (tab === 'banks') {
      const data = await Repo.getBanks();
      const list = Array.isArray(data) ? data : data?.banks ?? [];
      const tbody = document.getElementById('banksBody');
      if (!tbody) return;
      tbody.innerHTML = list.length ? list.map(b => `
        <tr>
          <td class="td-bold">${Utils.val(b.name)}</td>
          <td class="td-num">${Utils.val(b.ifscPrefix || b.code)}</td>
          <td style="font-size:12px;color:var(--text-2)">${Utils.val(b.contactEmail || b.contact)}</td>
          <td class="td-num">${b.activeLoans ?? '—'}</td>
          <td>${Services.badgeHtml(b.status || 'active')}</td>
          <td><button class="btn btn-ghost btn-sm">Edit</button></td>
        </tr>`).join('')
        : '<tr><td colspan="6" style="text-align:center;color:var(--text-3);padding:24px;">No partner banks</td></tr>';
    }
  },

  /* ── NOTIFICATIONS ── */
  async notifications() {
    // Sub-tab wiring
    document.querySelectorAll('[data-notif-tab]').forEach(btn => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-notif-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ['notifTabCompose', 'notifTabTemplates', 'notifTabScheduled', 'notifTabHistory'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
        const map = { compose: 'notifTabCompose', templates: 'notifTabTemplates', scheduled: 'notifTabScheduled', history: 'notifTabHistory' };
        document.getElementById(map[btn.dataset.notifTab])?.classList.remove('hidden');
        if (btn.dataset.notifTab === 'templates') this._loadNotifTemplates();
        if (btn.dataset.notifTab === 'scheduled')  this._loadScheduled();
        if (btn.dataset.notifTab === 'history')    this._loadNotifHistory();
      });
    });

    // Preview sync
    ['notifTitle', 'notifMessage', 'notifChannel', 'notifRole'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.dataset.wired) {
        el.dataset.wired = '1';
        el.addEventListener('input', this._updateNotifPreview.bind(this));
      }
    });

    // Send now
    const sendBtn = document.getElementById('sendNotifNowBtn');
    if (sendBtn && !sendBtn.dataset.wired) {
      sendBtn.dataset.wired = '1';
      sendBtn.addEventListener('click', async () => {
        const payload = {
          title:   document.getElementById('notifTitle')?.value,
          message: document.getElementById('notifMessage')?.value,
          role:    document.getElementById('notifRole')?.value,
          channel: document.getElementById('notifChannel')?.value,
        };
        if (!payload.title || !payload.message) { Toast.show('Title and message required', 'error'); return; }
        await Repo.sendNotification(payload);
        Toast.show('Notification sent!', 'success');
      });
    }

    // Schedule
    const schedBtn = document.getElementById('scheduleNotifBtn');
    if (schedBtn && !schedBtn.dataset.wired) {
      schedBtn.dataset.wired = '1';
      schedBtn.addEventListener('click', async () => {
        const scheduledAt = document.getElementById('notifSchedule')?.value;
        if (!scheduledAt) { Toast.show('Set a schedule date/time first', 'error'); return; }
        const payload = {
          title: document.getElementById('notifTitle')?.value,
          message: document.getElementById('notifMessage')?.value,
          role: document.getElementById('notifRole')?.value,
          channel: document.getElementById('notifChannel')?.value,
          scheduledAt,
        };
        await Repo.sendNotification(payload);
        Toast.show('Notification scheduled!', 'success');
      });
    }
  },

  _updateNotifPreview() {
    const title   = document.getElementById('notifTitle')?.value || 'Notification Title';
    const message = document.getElementById('notifMessage')?.value || 'Your message will appear here.';
    const channel = document.getElementById('notifChannel')?.value || 'in_app';
    const preview = document.getElementById('notifPreview');
    if (preview) preview.innerHTML = `
      <div style="border-radius:8px;background:var(--bg-4);padding:14px 16px;border:1px solid var(--line)">
        <div style="font-size:11px;color:var(--text-3);margin-bottom:4px;text-transform:uppercase">${channel}</div>
        <div style="font-weight:600;font-size:14px;margin-bottom:6px">${title}</div>
        <div style="font-size:13px;color:var(--text-2)">${message}</div>
      </div>`;
  },

  async _loadNotifTemplates() {
    const data = await Repo.getNotifTemplates();
    const list = Array.isArray(data) ? data : data?.templates ?? [];
    const tbody = document.getElementById('notifTemplatesBody');
    if (!tbody) return;
    tbody.innerHTML = list.length ? list.map(t => `
      <tr>
        <td class="td-bold">${Utils.val(t.name)}</td>
        <td>${Utils.val(t.channel)}</td>
        <td>${Utils.val(t.targetRole)}</td>
        <td class="td-num" style="color:var(--text-3)">${Utils.fmtDate(t.lastUsed)}</td>
        <td>
          <div class="td-actions">
            <button class="btn btn-ghost btn-sm">Edit</button>
            <button class="btn btn-ghost btn-sm">Use</button>
          </div>
        </td>
      </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:24px;">No templates yet</td></tr>';
  },

  async _loadScheduled() {
    const data = await Repo.getScheduledNotifs();
    const list = Array.isArray(data) ? data : data?.items ?? [];
    const tbody = document.getElementById('notifScheduledBody');
    if (!tbody) return;
    tbody.innerHTML = list.length ? list.map(n => `
      <tr>
        <td class="td-bold">${Utils.val(n.title)}</td>
        <td>${Utils.val(n.targetRole)}</td>
        <td>${Utils.val(n.channel)}</td>
        <td class="td-num">${Utils.fmtDateTime(n.scheduledAt)}</td>
        <td>${Services.badgeHtml(n.status || 'pending')}</td>
        <td><button class="btn btn-danger btn-sm cancel-sched" data-id="${n.id}">Cancel</button></td>
      </tr>`).join('')
      : '<tr><td colspan="6" style="text-align:center;color:var(--text-3);padding:24px;">No scheduled notifications</td></tr>';
    tbody.querySelectorAll('.cancel-sched').forEach(btn => btn.addEventListener('click', async () => {
      await Repo.deleteScheduled(btn.dataset.id);
      Toast.show('Scheduled notification cancelled', 'info');
      this._loadScheduled();
    }));
  },

  async _loadNotifHistory() {
    const data = await Repo.getNotifHistory();
    const list = Array.isArray(data) ? data : data?.items ?? [];
    const tbody = document.getElementById('notifHistoryBody');
    if (!tbody) return;
    tbody.innerHTML = list.length ? list.map(n => `
      <tr>
        <td class="td-bold">${Utils.val(n.title)}</td>
        <td>${Utils.val(n.targetRole)}</td>
        <td>${Utils.val(n.channel)}</td>
        <td class="td-num" style="color:var(--text-3)">${Utils.fmtDateTime(n.sentAt)}</td>
        <td class="td-num" style="color:var(--green)">${n.delivered ?? '—'}</td>
        <td class="td-num" style="color:var(--red)">${n.failed ?? '—'}</td>
        <td>${Services.badgeHtml(n.status || 'sent')}</td>
      </tr>`).join('')
      : '<tr><td colspan="7" style="text-align:center;color:var(--text-3);padding:24px;">No notifications sent yet</td></tr>';
  },

  /* ── REPORTS ── */
  async reports() {
    const data = await Repo.getReports();
    const list = Array.isArray(data) ? data : data?.reports ?? [];
    const fallback = [
      { title: 'Monthly Disbursal Report', desc: 'All loans disbursed this month with product breakdown.', color: 'green', period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) },
      { title: 'NPA & Collections Report', desc: 'Non-performing assets and recovery status.', color: 'amber', period: 'Q1 2026' },
      { title: 'KYC Compliance Report', desc: 'Document verification and pending KYC cases.', color: 'blue', period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) },
      { title: 'Revenue & Interest Report', desc: 'Interest income, fees and net revenue.', color: 'green', period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) },
      { title: 'Borrower Onboarding Report', desc: 'New registrations, conversion and drop-off.', color: 'purple', period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) },
      { title: 'RBI Regulatory Report', desc: 'Mandatory NBFC reporting per RBI Fair Practice Code.', color: 'blue', period: 'March 2026' },
    ];
    const reports = list.length ? list : fallback;
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
          <span class="report-period">${r.period || '—'}</span>
          <span class="report-dl"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download</span>
        </div>
      </div>`).join('');
  },

  /* ── SETTINGS ── */
  async settings() {
    const data = await Repo.getSettings();
    // Populate fields if data exists
    if (data) {
      const setVal = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined) el.value = v; };
      const setCheck = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined) el.checked = !!v; };
      setVal('ratePersonal', data.ratePersonal); setVal('rateBusiness', data.rateBusiness);
      setVal('rateHome', data.rateHome); setVal('rateEducation', data.rateEducation);
      setVal('processingFee', data.processingFee); setVal('minCibil', data.minCibil);
      setVal('maxAutoAmount', data.maxAutoAmount); setCheck('autoApproveEnabled', data.autoApproveEnabled);
      setCheck('smsOnDisbursal', data.smsOnDisbursal); setCheck('dualAdminRequired', data.dualAdminRequired);
      setVal('penaltyLate', data.penaltyLate); setVal('bounceCharge', data.bounceCharge);
      setVal('prepayPenalty', data.prepayPenalty); setVal('legalThreshold', data.legalThreshold);
      setVal('npaThreshold', data.npaThreshold); setCheck('autoLatePenalty', data.autoLatePenalty);
      setCheck('notifyOnPenalty', data.notifyOnPenalty);
      setVal('siteHeroTitle', data.siteHeroTitle); setVal('siteHeroSub', data.siteHeroSub);
      setVal('siteCtaText', data.siteCtaText); setVal('siteFooter', data.siteFooter);
    }

    // Sub-tabs
    document.querySelectorAll('[data-settings-tab]').forEach(btn => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-settings-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ['settingsTabRates', 'settingsTabRules', 'settingsTabPenalties', 'settingsTabSite'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
        const map = { rates: 'settingsTabRates', rules: 'settingsTabRules', penalties: 'settingsTabPenalties', site: 'settingsTabSite' };
        document.getElementById(map[btn.dataset.settingsTab])?.classList.remove('hidden');
      });
    });

    // Save buttons
    document.querySelectorAll('.sf-save').forEach(btn => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', async () => {
        const payload = {
          ratePersonal: document.getElementById('ratePersonal')?.value,
          rateBusiness: document.getElementById('rateBusiness')?.value,
          rateHome: document.getElementById('rateHome')?.value,
          rateEducation: document.getElementById('rateEducation')?.value,
          processingFee: document.getElementById('processingFee')?.value,
          minCibil: document.getElementById('minCibil')?.value,
          maxAutoAmount: document.getElementById('maxAutoAmount')?.value,
          autoApproveEnabled: document.getElementById('autoApproveEnabled')?.checked,
          smsOnDisbursal: document.getElementById('smsOnDisbursal')?.checked,
          dualAdminRequired: document.getElementById('dualAdminRequired')?.checked,
          penaltyLate: document.getElementById('penaltyLate')?.value,
          bounceCharge: document.getElementById('bounceCharge')?.value,
          prepayPenalty: document.getElementById('prepayPenalty')?.value,
          legalThreshold: document.getElementById('legalThreshold')?.value,
          npaThreshold: document.getElementById('npaThreshold')?.value,
          autoLatePenalty: document.getElementById('autoLatePenalty')?.checked,
          notifyOnPenalty: document.getElementById('notifyOnPenalty')?.checked,
          siteHeroTitle: document.getElementById('siteHeroTitle')?.value,
          siteHeroSub: document.getElementById('siteHeroSub')?.value,
          siteCtaText: document.getElementById('siteCtaText')?.value,
          siteFooter: document.getElementById('siteFooter')?.value,
        };
        await Repo.saveSettings(payload);
        Toast.show('Settings saved', 'success');
      });
    });
  },

  /* ── PAGINATION HELPER ── */
  _renderPagination(containerId, pages, currentPage, onPageChange) {
    const pg = document.getElementById(containerId);
    if (!pg || pages <= 1) { if (pg) pg.innerHTML = ''; return; }
    pg.innerHTML = Array.from({ length: pages }, (_, i) => `
      <button class="pg-btn ${i + 1 === currentPage ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>
    `).join('');
    pg.querySelectorAll('.pg-btn').forEach(btn => btn.addEventListener('click', () => onPageChange(parseInt(btn.dataset.page))));
  },
};

/* ══════════════════════════════════════════
   USER ACTIONS MENU
══════════════════════════════════════════ */
const UserActionsMenu = {
  _current: null,

  show(anchor, userId, userName) {
    this.hide();
    const menu = document.createElement('div');
    menu.className = 'action-dropdown';
    menu.innerHTML = `
      <button data-action="view">View Profile</button>
      <button data-action="edit">Edit Details</button>
      <button data-action="kyc">Update KYC</button>
      <button data-action="reset">Reset Password</button>
      <button data-action="disable" class="danger">Disable Account</button>
      <button data-action="flag" class="danger">Flag User</button>`;

    const rect = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${rect.bottom + 4}px;left:${rect.left}px;z-index:9000;
      background:var(--bg-4);border:1px solid var(--line-2);border-radius:10px;
      min-width:160px;box-shadow:0 8px 32px rgba(0,0,0,0.25);overflow:hidden`;

    menu.querySelectorAll('button').forEach(btn => {
      btn.style.cssText = 'display:block;width:100%;padding:10px 16px;background:none;border:none;color:var(--text);font-size:13px;text-align:left;cursor:pointer;transition:background 0.15s';
      if (btn.classList.contains('danger')) btn.style.color = 'var(--red)';
      btn.addEventListener('mouseenter', () => btn.style.background = 'var(--bg-5)');
      btn.addEventListener('mouseleave', () => btn.style.background = 'none');
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        this.hide();
        await this._handleAction(btn.dataset.action, userId, userName);
      });
    });

    document.body.appendChild(menu);
    this._current = menu;
    setTimeout(() => document.addEventListener('click', this._onClickOutside.bind(this), { once: true }), 0);
  },

  hide() {
    this._current?.remove();
    this._current = null;
  },

  _onClickOutside() { this.hide(); },

  async _handleAction(action, userId, userName) {
    switch (action) {
      case 'view':    Modal.openUser(userId); break;
      case 'edit':    Modal.openEditUser(userId); break;
      case 'kyc':     Modal.openKycUpdate(userId); break;
      case 'reset':
        if (!confirm(`Reset password for ${userName || userId}?`)) break;
        await Repo.resetUserPassword(userId);
        Toast.show('Password reset email sent', 'info'); break;
      case 'disable':
        if (!confirm(`Disable ${userName || userId}? They will lose access.`)) break;
        await Repo.disableUser(userId);
        Toast.show('User disabled', 'error'); break;
      case 'flag': {
        const reason = prompt('Flag reason:');
        if (!reason) break;
        await Repo.flagUser(userId, reason);
        Toast.show('User flagged', 'info'); break;
      }
    }
  },
};

/* ══════════════════════════════════════════
   MODAL
══════════════════════════════════════════ */
const Modal = {
  _overlay: null,
  _body: null,
  _title: null,

  _init() {
    if (!this._overlay) {
      this._overlay = document.getElementById('appModal');
      this._body    = document.getElementById('modalBody');
      this._title   = document.getElementById('modalTitle');
    }
  },

  open() {
    this._init();
    this._overlay?.classList.remove('hidden');
  },

  close() {
    this._init();
    this._overlay?.classList.add('hidden');
    if (this._body) this._body.innerHTML = '';
  },

  openRaw(title, html) {
    this._init();
    if (this._title) this._title.textContent = title;
    if (this._body)  this._body.innerHTML = html;
    this.open();
  },

  async openApplication(appId) {
    this._init();
    if (this._title) this._title.textContent = 'Application Review';
    if (this._body)  this._body.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-3)">Loading…</div>';
    this.open();
    const app = await Repo.getApplicationById(appId);
    if (!app) { if (this._body) this._body.innerHTML = '<div style="padding:32px;text-align:center;color:var(--red)">Failed to load application</div>'; return; }
    if (this._body) this._body.innerHTML = `
      <div class="modal-grid">
        <div class="modal-field"><label>Loan ID</label><div class="mf-val num">${Utils.val(app.id)}</div></div>
        <div class="modal-field"><label>Status</label><div class="mf-val">${Services.badgeHtml(app.status)}</div></div>
        <div class="modal-field"><label>Applicant</label><div class="mf-val">${Utils.val(app.name || app.applicantName)}</div></div>
        <div class="modal-field"><label>Product</label><div class="mf-val">${Utils.val(app.product || app.loanType)} Loan</div></div>
        <div class="modal-field"><label>Loan Amount</label><div class="mf-val green num">${Utils.fmtExact(app.amount)}</div></div>
        <div class="modal-field"><label>Tenure</label><div class="mf-val num">${Utils.val(app.tenure)} months</div></div>
        <div class="modal-field"><label>CIBIL Score</label><div class="mf-val">${Services.scoreHtml(app.cibilScore || app.creditScore)}</div></div>
        <div class="modal-field"><label>Employment</label><div class="mf-val">${Utils.val(app.employment)}</div></div>
        <div class="modal-field"><label>Monthly Income</label><div class="mf-val num">${app.monthlyIncome ? Utils.fmtExact(app.monthlyIncome) : '—'}</div></div>
        <div class="modal-field"><label>Bank</label><div class="mf-val">${Utils.val(app.bank)}</div></div>
        <div class="modal-field"><label>Mobile</label><div class="mf-val num">${Utils.val(app.mobile)}</div></div>
        <div class="modal-field"><label>Applied On</label><div class="mf-val num">${Utils.fmtDate(app.appliedAt || app.createdAt)}</div></div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-success" id="modalApprove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>Approve</button>
        <button class="btn btn-danger" id="modalReject"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Reject</button>
        <button class="btn btn-ghost" id="modalClose2" style="margin-left:auto">Close</button>
      </div>`;

    document.getElementById('modalApprove')?.addEventListener('click', async () => {
      await Repo.updateApplicationStatus(app.id, 'approve');
      Toast.show(`${app.name || 'Application'} approved`, 'success');
      this.close();
      PageControllers.loaded.delete('applications');
      PageControllers.loaded.delete('dashboard');
    });
    document.getElementById('modalReject')?.addEventListener('click', async () => {
      await Repo.updateApplicationStatus(app.id, 'reject');
      Toast.show(`${app.name || 'Application'} rejected`, 'error');
      this.close();
      PageControllers.loaded.delete('applications');
      PageControllers.loaded.delete('dashboard');
    });
    document.getElementById('modalClose2')?.addEventListener('click', () => this.close());
  },

  async openUser(userId) {
    this._init();
    if (!userId || userId === 'undefined') { Toast.show('User ID not available', 'error'); return; }
    if (this._title) this._title.textContent = 'User Profile';
    if (this._body)  this._body.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-3)">Loading…</div>';
    this.open();
    const user = await Repo.getUserById(userId);
    if (!user) { if (this._body) this._body.innerHTML = '<div style="padding:32px;text-align:center;color:var(--red)">User not found</div>'; return; }
    const u = user.user || user;
    const a = user.account || user;
    if (this._body) this._body.innerHTML = `
      <div class="modal-grid">
        <div class="modal-field"><label>Name</label><div class="mf-val">${Utils.val(u.firstName)} ${Utils.val(u.lastName)}</div></div>
        <div class="modal-field"><label>Email</label><div class="mf-val">${Utils.val(u.email)}</div></div>
        <div class="modal-field"><label>Mobile</label><div class="mf-val num">${Utils.val(u.mobile || u.phone)}</div></div>
        <div class="modal-field"><label>KYC Status</label><div class="mf-val">${Services.badgeHtml(a.kycStatus)}</div></div>
        <div class="modal-field"><label>Credit Score</label><div class="mf-val">${Services.scoreHtml(a.creditScore)}</div></div>
        <div class="modal-field"><label>Risk Level</label><div class="mf-val">${Services.riskBadge(a.riskLevel)}</div></div>
        <div class="modal-field"><label>Outstanding</label><div class="mf-val num">${a.outstandingPaise != null ? Utils.fmtCurrency(a.outstandingPaise / 100) : '—'}</div></div>
        <div class="modal-field"><label>Active Loans</label><div class="mf-val num">${a.activeLoanCount ?? '—'}</div></div>
        <div class="modal-field"><label>Total Loaned</label><div class="mf-val num">${a.totalLoanedPaise != null ? Utils.fmtCurrency(a.totalLoanedPaise / 100) : '—'}</div></div>
        <div class="modal-field"><label>Blacklisted</label><div class="mf-val">${Services.badgeHtml(a.isBlacklisted ? 'blocked' : 'active')}</div></div>
        <div class="modal-field"><label>NACH Active</label><div class="mf-val">${a.nachMandateActive != null ? (a.nachMandateActive ? 'Yes' : 'No') : '—'}</div></div>
        <div class="modal-field"><label>Joined</label><div class="mf-val num">${Utils.fmtDate(u.createdAt)}</div></div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="Modal.close()">Close</button>
        <button class="btn btn-ghost" onclick="UserActionsMenu._handleAction('edit','${userId}','${u.firstName || u.email}')">Edit</button>
        <button class="btn btn-danger" style="margin-left:auto" onclick="UserActionsMenu._handleAction('disable','${userId}','${u.firstName || u.email}')">Disable</button>
      </div>`;
  },

  openEditUser(userId) {
    this.openRaw('Edit User', `<div style="padding:16px;color:var(--text-2);font-size:13px">Edit user form — wire to PATCH /admin/users/${userId}</div>`);
  },
  openKycUpdate(userId) {
    this.openRaw('Update KYC', `<div style="padding:16px;color:var(--text-2);font-size:13px">KYC update form — wire to PATCH /admin/kyc/${userId}</div>`);
  },
  openAddAdmin() {
    this.openRaw('Add Admin', `<div style="padding:16px;color:var(--text-2);font-size:13px">Add admin form — wire to POST /admin/admins</div>`);
  },
  openAddRole() {
    this.openRaw('Add Role', `<div style="padding:16px;color:var(--text-2);font-size:13px">Add role form — wire to POST /admin/roles</div>`);
  },
  openEditRole(id, name) {
    this.openRaw(`Edit Role: ${name}`, `<div style="padding:16px;color:var(--text-2);font-size:13px">Edit role form — wire to PATCH /admin/roles/${id}</div>`);
  },
  openAddBank() {
    this.openRaw('Add Partner Bank', `<div style="padding:16px;color:var(--text-2);font-size:13px">Add bank form — wire to POST /admin/banks</div>`);
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
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = `toast ${type} toast-left`;
    el.innerHTML = `${this.icons[type] || this.icons.info}<span>${message}</span>`;
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 250); }, 3000);
  },
};

/* ══════════════════════════════════════════
   THEME
══════════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem('kashly_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('kashly_theme', next);
    setTimeout(() => {
      PageControllers.loaded.delete('dashboard');
      if (Nav.current === 'dashboard') PageControllers.load('dashboard');
    }, 350);
  });
}

/* ══════════════════════════════════════════
   SIDEBAR (collapse + mobile)
══════════════════════════════════════════ */
function initSidebar() {
  const sidebar      = document.getElementById('sidebar');
  const hamburger    = document.getElementById('hamburgerAdmin');
  const closeBtn     = document.getElementById('sidebarClose');
  const collapseBtn  = document.getElementById('sidebarCollapseBtn');
  const COLLAPSE_KEY = 'admin_sidebar_collapsed';

  // Restore collapse state
  if (localStorage.getItem(COLLAPSE_KEY) === 'true') sidebar?.classList.add('collapsed');

  collapseBtn?.addEventListener('click', () => {
    const collapsed = sidebar?.classList.toggle('collapsed');
    localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  });

  hamburger?.addEventListener('click', () => sidebar?.classList.toggle('open'));
  closeBtn?.addEventListener('click',  () => sidebar?.classList.remove('open'));

  document.addEventListener('click', e => {
    if (window.innerWidth <= 768 && sidebar?.classList.contains('open')) {
      if (!sidebar.contains(e.target) && !hamburger?.contains(e.target)) sidebar.classList.remove('open');
    }
  });

  document.getElementById('sidebarLogoutBtn')?.addEventListener('click', () => {
    logout(); // FIX #2: use shared logout() from auth.js — clears session + redirects to login.html
  });
}

/* ══════════════════════════════════════════
   NAV WIRING
══════════════════════════════════════════ */
function initNav() {
  document.querySelectorAll('[data-section]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); Nav.go(el.dataset.section); });
  });

  document.getElementById('modalClose')?.addEventListener('click', () => Modal.close());
  document.getElementById('appModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('appModal')) Modal.close();
  });

  document.getElementById('chartFilter')?.addEventListener('click', async e => {
    const btn = e.target.closest('.cf-btn');
    if (!btn) return;
    document.querySelectorAll('.cf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const data = await Repo.getDisbursalTrend(btn.dataset.range);
    Charts.drawBar('barChart', Array.isArray(data) ? data : []);
  });

  document.getElementById('appFilterTabs')?.addEventListener('click', e => {
    const tab = e.target.closest('.ftab');
    if (!tab) return;
    document.querySelectorAll('#appFilterTabs .ftab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    PageControllers._appFilter = tab.dataset.filter;
    PageControllers._appPage   = 1;
    PageControllers.loaded.delete('applications');
    PageControllers._loadAppsTable();
  });

  document.getElementById('exportBtn')?.addEventListener('click', () => Toast.show('Report export started — check your email shortly', 'info'));
  document.getElementById('newLoanBtn')?.addEventListener('click', () => Nav.go('applications'));
  document.getElementById('notifBtn')?.addEventListener('click', () => Nav.go('notifications'));

  // Global search
  const searchInput = document.getElementById('globalSearch');
  const searchResults = document.getElementById('searchResults');
  let searchTimeout;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = searchInput.value.trim();
    if (q.length < 2) { if (searchResults) searchResults.innerHTML = ''; return; }
    searchTimeout = setTimeout(async () => {
      const result = await Repo.search(q);
      if (!searchResults) return;
      const items = result?.items ?? (Array.isArray(result) ? result : []);
      if (!items.length) { searchResults.innerHTML = '<div style="padding:12px 16px;font-size:13px;color:var(--text-3)">No results</div>'; return; }
      searchResults.innerHTML = items.slice(0, 8).map(r => `
        <div class="search-result-item" data-id="${r.id}" data-type="${r.type}" style="padding:10px 16px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--line)">
          <span style="font-weight:500">${r.name || r.id}</span>
          <span style="margin-left:8px;color:var(--text-3);font-size:11px">${r.type || ''}</span>
        </div>`).join('');
      searchResults.querySelectorAll('.search-result-item').forEach(el => {
        el.addEventListener('mouseenter', () => el.style.background = 'var(--bg-4)');
        el.addEventListener('mouseleave', () => el.style.background = '');
        el.addEventListener('click', () => {
          searchResults.innerHTML = '';
          searchInput.value = '';
          if (el.dataset.type === 'loan') Modal.openApplication(el.dataset.id);
          else Modal.openUser(el.dataset.id);
        });
      });
    }, 400);
  });
  document.addEventListener('click', e => {
    if (!searchInput?.contains(e.target) && !searchResults?.contains(e.target)) {
      if (searchResults) searchResults.innerHTML = '';
    }
  });
}

/* ══════════════════════════════════════════
   RESIZE
══════════════════════════════════════════ */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(async () => {
    if (Nav.current === 'dashboard') {
      const range = document.querySelector('.cf-btn.active')?.dataset.range || '6m';
      const data  = await Repo.getDisbursalTrend(range);
      Charts.drawBar('barChart', Array.isArray(data) ? data : []);
      const donut = await Repo.getLoanMix();
      Charts.drawDonut('donutChart', Array.isArray(donut) ? donut : []);
    }
  }, 200);
});

/* ══════════════════════════════════════════
   BOOT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  // ── Auth guard ────────────────────────────────────────
  if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
    window.location.replace(`login.html?redirect=${encodeURIComponent(location.pathname)}`);
    return;
  }
  const user = typeof getStoredUser === 'function' ? getStoredUser() : null;
  if (user && user.role !== 'admin') {
    window.location.replace(typeof getDashboardForRole === 'function' ? getDashboardForRole(user.role) : 'user_dashboard.html');
    return;
  }
  // ── Init ──────────────────────────────────────────────
  initTheme();
  initSidebar();
  initNav();
  await PageControllers.load('dashboard');
});
