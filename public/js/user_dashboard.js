/**
 * ═══════════════════════════════════════════════════════
 * KASHLY — dashboard.js
 *
 * Architecture:
 *  - DataRepository   : single data-access layer — swap the
 *                       fetch calls to hit your real API; UI
 *                       code never touches raw endpoints.
 *  - DashboardApp     : orchestrates rendering & interactions.
 *
 * To migrate to a real backend:
 *  1. Set API_BASE to your server URL.
 *  2. Replace MockDataProvider methods with real fetch() calls.
 *  3. Add your auth token to AuthService and headers will auto-attach.
 * ═══════════════════════════════════════════════════════
 */



'use strict';

/* ══════════════════════════════════════════
   CONFIG
══════════════════════════════════════════ */
const CONFIG = {
  API_BASE: '/api/v1',          // ← point to your Express server
  CURRENCY: 'INR',
  LOCALE:   'en-IN',
};

/* ══════════════════════════════════════════
   AUTH SERVICE
   Reads token from localStorage; attach to
   every fetch via getHeaders().
══════════════════════════════════════════ */
const AuthService = {
  getToken() {
    // In production: return localStorage.getItem('kashly_token');
    return 'mock-jwt-token';
  },
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    };
  },
};

/* ══════════════════════════════════════════
   MOCK DATA PROVIDER
   Replace each method body with a real fetch
   when your Express routes are ready.
══════════════════════════════════════════ */
const MockDataProvider = {
  async getUser() {
    // REAL: return fetch(`${CONFIG.API_BASE}/users/me`, { headers: AuthService.getHeaders() }).then(r => r.json());
    return {
      id: 'usr_001',
      name: 'Arjun Rao',
      email: 'arjun@example.com',
      initials: 'AR',
      creditScore: 742,
      creditRating: 'Good',
    };
  },

  async getLoans() {
    // REAL: return fetch(`${CONFIG.API_BASE}/loans`, { headers: AuthService.getHeaders() }).then(r => r.json());
    return [
      {
        id: 'LN20240001',
        type: 'Personal Loan',
        principal: 500000,
        outstanding: 342800,
        emiAmount: 16133,
        interestRate: 10.5,
        tenureMonths: 36,
        monthsPaid: 9,
        nextDue: '2026-04-15',
        status: 'active',
        disbursedOn: '2025-07-01',
      },
      {
        id: 'LN20240032',
        type: 'Business Loan',
        principal: 200000,
        outstanding: 0,
        emiAmount: 0,
        interestRate: 12.0,
        tenureMonths: 12,
        monthsPaid: 12,
        nextDue: null,
        status: 'closed',
        disbursedOn: '2024-04-01',
      },
    ];
  },

  async getTransactions() {
    // REAL: return fetch(`${CONFIG.API_BASE}/transactions`, { headers: AuthService.getHeaders() }).then(r => r.json());
    const months = ['Apr 2026','Mar 2026','Feb 2026','Jan 2026','Dec 2025','Nov 2025','Oct 2025','Sep 2025','Aug 2025','Jul 2025'];
    return months.map((m, i) => ({
      id: `TXN_${String(i + 1).padStart(4, '0')}`,
      loanId: 'LN20240001',
      loanName: 'Personal Loan',
      date: m,
      amount: 16133,
      principal: 12800,
      interest: 3333,
      status: i === 0 ? 'upcoming' : 'paid',
    }));
  },

  async getDocuments() {
    // REAL: return fetch(`${CONFIG.API_BASE}/documents`, { headers: AuthService.getHeaders() }).then(r => r.json());
    return [
      { id: 'doc_001', name: 'Loan Agreement – LN20240001', type: 'PDF', size: '1.2 MB', date: '01 Jul 2025', loanId: 'LN20240001' },
      { id: 'doc_002', name: 'Sanction Letter – LN20240001', type: 'PDF', size: '480 KB', date: '28 Jun 2025', loanId: 'LN20240001' },
      { id: 'doc_003', name: 'Account Statement – Mar 2026', type: 'PDF', size: '320 KB', date: '01 Apr 2026', loanId: 'LN20240001' },
      { id: 'doc_004', name: 'Loan Agreement – LN20240032', type: 'PDF', size: '1.1 MB', date: '01 Apr 2024', loanId: 'LN20240032' },
      { id: 'doc_005', name: 'NOC – LN20240032', type: 'PDF', size: '210 KB', date: '10 Apr 2025', loanId: 'LN20240032' },
      { id: 'doc_006', name: 'KYC Documents', type: 'ZIP', size: '2.4 MB', date: '25 Jun 2025', loanId: null },
    ];
  },

  async getNotifications() {
    // REAL: return fetch(`${CONFIG.API_BASE}/notifications`, { headers: AuthService.getHeaders() }).then(r => r.json());
    return [
      { id: 'n1', title: 'EMI Due Reminder', body: 'Your EMI of ₹16,133 is due on 15 Apr 2026.', time: '2 hours ago', read: false },
      { id: 'n2', title: 'Loan Statement Ready', body: 'Your Mar 2026 statement is available for download.', time: '1 day ago', read: false },
      { id: 'n3', title: 'Payment Confirmed', body: 'Your EMI payment of ₹16,133 for Mar 2026 was successful.', time: '32 days ago', read: true },
      { id: 'n4', title: 'New Offer Available', body: 'You are eligible for a top-up loan of up to ₹2,00,000.', time: '5 days ago', read: true },
    ];
  },

  async getFAQs() {
    return [
      { q: 'How do I pay my EMI early?', href: '#' },
      { q: 'Can I foreclose my loan online?', href: '#' },
      { q: 'How is interest calculated?', href: '#' },
      { q: 'What happens if I miss an EMI?', href: '#' },
      { q: 'How to update bank account details?', href: '#' },
    ];
  },
};

/* ══════════════════════════════════════════
   DATA REPOSITORY
   The single source of truth for the UI.
   Caches results in memory.
══════════════════════════════════════════ */
const DataRepository = {
  _cache: {},

  async get(resource) {
    if (this._cache[resource]) return this._cache[resource];
    const data = await MockDataProvider[resource]();
    this._cache[resource] = data;
    return data;
  },

  invalidate(resource) {
    delete this._cache[resource];
  },
};

/* ══════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════ */
const Utils = {
  formatCurrency(amount) {
    return new Intl.NumberFormat(CONFIG.LOCALE, {
      style: 'currency',
      currency: CONFIG.CURRENCY,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  pct(part, total) {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  },

  loanProgress(loan) {
    return Utils.pct(loan.monthsPaid, loan.tenureMonths);
  },

  statusBadge(status) {
    const map = {
      paid:     ['badge-paid',     'Paid'],
      upcoming: ['badge-upcoming', 'Upcoming'],
      overdue:  ['badge-overdue',  'Overdue'],
      active:   ['badge-paid',     'Active'],
      closed:   ['badge-upcoming', 'Closed'],
    };
    const [cls, label] = map[status] || ['', status];
    return `<span class="badge ${cls}">${label}</span>`;
  },
};

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
let _toastTimer = null;
function showToast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ══════════════════════════════════════════
   THEME
══════════════════════════════════════════ */
const ThemeService = {
  init() {
    const saved = localStorage.getItem('kashly_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('themeToggle').addEventListener('click', () => this.toggle());
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('kashly_theme', next);
  },
};



/* ══════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════ */
const NavService = {
  currentPage: 'overview',

  init() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page) this.navigate(page);
        // close mobile drawer
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('active');
      });
    });

    // card "View all" links
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-nav]');
      if (el) { e.preventDefault(); this.navigate(el.dataset.nav); }
    });

    // filter tabs (repayments page)
    document.getElementById('txnFilterTabs')?.addEventListener('click', e => {
      const tab = e.target.closest('.filter-tab');
      if (!tab) return;
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      this._filterTxns(tab.dataset.filter);
    });
  },

  navigate(page) {
    this.currentPage = page;

    // update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) { target.classList.add('active'); target.scrollIntoView({ behavior: 'instant', block: 'start' }); }

    // update sidebar active
    document.querySelectorAll('.nav-item').forEach(li => li.classList.remove('active'));
    const navLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (navLink) navLink.closest('.nav-item')?.classList.add('active');

    // breadcrumb
    const labels = { overview: 'Overview', loans: 'My Loans', repayments: 'Repayments', documents: 'Documents', support: 'Support' };
    document.getElementById('breadcrumbPage').textContent = labels[page] || page;
  },

  async _filterTxns(filter) {
    const txns = await DataRepository.get('getTransactions');
    const filtered = filter === 'all' ? txns : txns.filter(t => t.status === filter);
    Renderers.renderTxnTable(document.getElementById('allTxns'), filtered);
  },
};

/* ══════════════════════════════════════════
   RENDERERS
══════════════════════════════════════════ */
const Renderers = {
  renderSummary(loans) {
    const active = loans.filter(l => l.status === 'active');
    const totalOutstanding = active.reduce((s, l) => s + l.outstanding, 0);
    const nextEmi = active.find(l => l.nextDue);
    const totalDisbursed = loans.reduce((s, l) => s + l.principal, 0);
  },

  renderActiveLoans(loans) {
    const el = document.getElementById('activeLoansList');
    if (!el) return;
    const active = loans.filter(l => l.status === 'active');
    el.innerHTML = active.map(l => {
      const pct = Utils.loanProgress(l);
      return `
        <div class="loan-item">
          <div class="loan-item-top">
            <span class="loan-item-name">${l.type} · ${l.id}</span>
            <span class="loan-item-amount">${Utils.formatCurrency(l.outstanding)}</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar" data-width="${pct}" style="width:0%"></div>
          </div>
          <div class="loan-item-meta">
            <span>${l.monthsPaid} of ${l.tenureMonths} months paid</span>
            <span>EMI: ${Utils.formatCurrency(l.emiAmount)}/mo</span>
          </div>
        </div>`;
    }).join('');
    // animate bars
    requestAnimationFrame(() => {
      el.querySelectorAll('.progress-bar[data-width]').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    });
  },

  renderEmiChart(txns) {
    const el = document.getElementById('emiChart');
    if (!el) return;
    const recent = txns.slice(0, 6).reverse();
    const maxAmt = Math.max(...recent.map(t => t.amount));
    el.innerHTML = recent.map(t => {
      const h = Math.round((t.amount / maxAmt) * 80);
      return `
        <div class="emi-bar-wrap">
          <div class="emi-bar ${t.status}" style="height:${h}px" title="${t.date}: ${Utils.formatCurrency(t.amount)}"></div>
          <span class="emi-bar-label">${t.date.split(' ')[0]}</span>
        </div>`;
    }).join('');
  },

  renderTxnTable(container, txns) {
    if (!container) return;
    const rows = txns.map(t => `
      <div class="txn-row">
        <span class="txn-loan-name">${t.loanName}</span>
        <span class="txn-date">${t.date}</span>
        <span class="txn-amount">${Utils.formatCurrency(t.amount)}</span>
        <span class="txn-principal">${Utils.formatCurrency(t.principal)}</span>
        <span>${Utils.statusBadge(t.status)}</span>
      </div>`).join('');
    container.innerHTML = `
      <div class="txn-head">
        <span>Loan</span><span>Date</span><span>EMI</span><span>Principal</span><span>Status</span>
      </div>
      ${rows || '<div style="padding:20px;color:var(--text-3);font-size:14px;text-align:center">No transactions found</div>'}`;
  },

  renderLoansDetail(loans) {
    const el = document.getElementById('loansDetailList');
    if (!el) return;
    el.innerHTML = loans.map(l => {
      const pct = Utils.loanProgress(l);
      const repaid = l.principal - l.outstanding;
      return `
        <div class="loan-detail-card">
          <div class="ldc-header">
            <div class="ldc-title-wrap">
              <div class="ldc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </div>
              <div>
                <div class="ldc-name">${l.type}</div>
                <div class="ldc-id">${l.id} · Disbursed ${l.disbursedOn}</div>
              </div>
            </div>
            <div class="ldc-status">
              ${Utils.statusBadge(l.status)}
              ${l.status === 'active' ? `<button class="btn btn-primary" onclick="showToast('EMI payment initiated for ${l.id}')">Pay EMI</button>` : ''}
            </div>
          </div>
          <div class="ldc-body">
            <div class="ldc-stat">
              <div class="ldc-stat-label">Loan Amount</div>
              <div class="ldc-stat-value num">${Utils.formatCurrency(l.principal)}</div>
            </div>
            <div class="ldc-stat">
              <div class="ldc-stat-label">Outstanding</div>
              <div class="ldc-stat-value num green">${Utils.formatCurrency(l.outstanding)}</div>
            </div>
            <div class="ldc-stat">
              <div class="ldc-stat-label">Monthly EMI</div>
              <div class="ldc-stat-value num">${l.emiAmount ? Utils.formatCurrency(l.emiAmount) : '—'}</div>
            </div>
            <div class="ldc-stat">
              <div class="ldc-stat-label">Interest Rate</div>
              <div class="ldc-stat-value num">${l.interestRate}% p.a.</div>
            </div>
            <div class="ldc-stat">
              <div class="ldc-stat-label">Tenure</div>
              <div class="ldc-stat-value num">${l.tenureMonths} mo</div>
            </div>
          </div>
          ${l.status === 'active' ? `
          <div class="ldc-progress-section">
            <div class="ldc-prog-label">
              <span>Repayment Progress (${l.monthsPaid}/${l.tenureMonths} months)</span>
              <span>${pct}%</span>
            </div>
            <div class="ldc-prog-bar">
              <div class="ldc-prog-fill" data-width="${pct}" style="width:0%"></div>
            </div>
          </div>` : ''}
          <div class="ldc-footer">
            <button class="btn btn-ghost" onclick="showToast('Statement emailed!')">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Statement
            </button>
            <button class="btn btn-ghost" onclick="showToast('Document package downloading...')">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Documents
            </button>
            ${l.status === 'active' ? `
            <button class="btn btn-ghost" onclick="showToast('Foreclosure quote sent to your email')">
              Foreclose
            </button>` : ''}
          </div>
        </div>`;
    }).join('');
    // animate progress bars
    requestAnimationFrame(() => {
      el.querySelectorAll('.ldc-prog-fill[data-width]').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    });
  },

  renderDocuments(docs) {
    const el = document.getElementById('docsGrid');
    if (!el) return;
    const icons = {
      PDF: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
      ZIP: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
    };
    el.innerHTML = docs.map(d => `
      <div class="doc-card">
        <div class="doc-icon">${icons[d.type] || icons.PDF}</div>
        <div>
          <div class="doc-name">${d.name}</div>
          <div class="doc-meta">${d.type} · ${d.size} · ${d.date}</div>
        </div>
        <div class="doc-actions">
          <button class="doc-btn" onclick="showToast('Downloading ${d.name}...')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
          </button>
          <button class="doc-btn" onclick="showToast('Opening ${d.name}...')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View
          </button>
        </div>
      </div>`).join('');
  },

  renderNotifications(notifs) {
    const el = document.getElementById('notifList');
    if (!el) return;
    el.innerHTML = notifs.map(n => `
      <li class="notif-item">
        <div style="display:flex;align-items:center">
          ${!n.read ? '<span class="notif-dot-badge"></span>' : '<span style="width:16px;display:inline-block"></span>'}
          <div class="notif-item-title">${n.title}</div>
        </div>
        <div class="notif-item-body">${n.body}</div>
        <div class="notif-item-time">${n.time}</div>
      </li>`).join('');
  },

  renderFAQs(faqs) {
    const el = document.getElementById('faqList');
    if (!el) return;
    el.innerHTML = faqs.map(f => `
      <li><a href="${f.href}">${f.q}</a></li>`).join('');
  },
};

/* ══════════════════════════════════════════
   MOBILE SIDEBAR
══════════════════════════════════════════ */
const MobileService = {
  init() {
    const sidebar   = document.getElementById('sidebar');
    const overlay   = document.getElementById('overlay');
    const hamburger = document.getElementById('hamburger');
    const closeBtn  = document.getElementById('sidebarClose');

    hamburger?.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    });
    closeBtn?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  },
};

/* ══════════════════════════════════════════
   NOTIFICATION PANEL
══════════════════════════════════════════ */
const NotifService = {
  init() {
    const btn   = document.getElementById('notifBtn');
    const panel = document.getElementById('notifPanel');
    btn?.addEventListener('click', e => {
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!panel.contains(e.target) && e.target !== btn) {
        panel.classList.remove('open');
      }
    });
  },
};

/* ══════════════════════════════════════════
   DASHBOARD APP — bootstrap
══════════════════════════════════════════ */
const DashboardApp = {
  async init() {
    ThemeService.init();
    NavService.init();
    MobileService.init();
    NotifService.init();

    // Load all data in parallel
    const [loans, txns, docs, notifs, faqs] = await Promise.all([
      DataRepository.get('getLoans'),
      DataRepository.get('getTransactions'),
      DataRepository.get('getDocuments'),
      DataRepository.get('getNotifications'),
      DataRepository.get('getFAQs'),
    ]);

    // Render overview
    Renderers.renderActiveLoans(loans);
    Renderers.renderEmiChart(txns);
    Renderers.renderTxnTable(document.getElementById('recentTxns'), txns.slice(0, 5));

    // Render loans page
    Renderers.renderLoansDetail(loans);

    // Render repayments page (all txns)
    Renderers.renderTxnTable(document.getElementById('allTxns'), txns);

    // Render documents
    Renderers.renderDocuments(docs);

    // Notifications panel
    Renderers.renderNotifications(notifs);

    // FAQs
    Renderers.renderFAQs(faqs);

    // Animate credit score bar on load
    setTimeout(() => {
      document.querySelector('.csw-fill')?.style.setProperty('width', '74.2%');
    }, 300);
  },
};

document.addEventListener('DOMContentLoaded', () => DashboardApp.init());