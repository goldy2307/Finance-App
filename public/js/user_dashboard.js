/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * KASHLY â€” dashboard.js
 *
 * Architecture:
 *  - DataRepository   : single data-access layer â€” swap the
 *                       fetch calls to hit your real API; UI
 *                       code never touches raw endpoints.
 *  - DashboardApp     : orchestrates rendering & interactions.
 *
 * To migrate to a real backend:
 *  1. Set API_BASE to your server URL.
 *  2. Replace MockDataProvider methods with real fetch() calls.
 *  3. Add your auth token to AuthService and headers will auto-attach.
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */



'use strict';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CONFIG
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const CONFIG = {
  API_BASE: '/api/v1', // or your deployed backend URL,          // â† point to your Express server
  CURRENCY: 'INR',
  LOCALE:   'en-IN',
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   AUTH SERVICE
   Reads token from localStorage; attach to
   every fetch via getHeaders().
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const AuthService = {
  getToken() {
    // In production: return localStorage.getItem('kashly_token');
 return localStorage.getItem('kashly_token') || '';
  },
getHeaders() {
  const token = this.getToken();

  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
},
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MOCK DATA PROVIDER
   Replace each method body with a real fetch
   when your Express routes are ready.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const MockDataProvider = {
  async getUser() {
  const res = await fetch(`${CONFIG.API_BASE}/auth/me`, {
    headers: AuthService.getHeaders(),
  });
  if (!res.ok) {
    // Token expired or invalid — send back to login
    window.location.href = '/login';
    console.error('API failed', res.status);
    throw new Error('API error');
    
  }
  const body = await res.json();
  const user = body.data?.user || body.data || body.user;
  return {
    id:           user._id || user.id,
    name: user.name || [user.firstName, user.lastName].filter(Boolean).join(' '),
    email:        user.email || '',
    initials:     getInitials(user.name || user.email || 'U'),
    creditScore:  user.creditScore  || null,
    creditRating: user.creditRating || null,
  };
},

 async getLoans() {
  const res = await fetch(`${CONFIG.API_BASE}/loans`, {
    headers: AuthService.getHeaders(),
  });
  const result = await res.json();
 return result?.data?.loans || result?.loans || result?.data || [];
},

  async getTransactions() {
  try {
    const res = await fetch(`${CONFIG.API_BASE}/transactions`, {
      headers: AuthService.getHeaders(),
    });
    if (!res.ok) {
      console.error('getTransactions failed', res.status);
      return [];
    }
    const result = await res.json();
    return result?.data?.transactions ||
           result?.transactions ||
           result?.data ||
           [];
  } catch (err) {
    console.error('getTransactions error', err);
    return [];
  }
},

  async getDocuments() {
  try {
    const res = await fetch(`${CONFIG.API_BASE}/documents`, {
      headers: AuthService.getHeaders(),
    });
    if (!res.ok) return [];
    const result = await res.json();
    return result?.data?.documents || result?.documents || result?.data || [];
  } catch {
    return [];
  }
},

 async getNotifications() {
  try {
    const res = await fetch(`${CONFIG.API_BASE}/notifications`, {
      headers: AuthService.getHeaders(),
    });
    if (!res.ok) return [];
    const result = await res.json();
    return result?.data?.notifications || result?.notifications || result?.data || [];
  } catch {
    return [];
  }
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
  async getSummary() {
  const res = await fetch(`${CONFIG.API_BASE}/account/summary`, {
    headers: AuthService.getHeaders(),
  });

  if (!res.ok) throw new Error('Failed to fetch summary');

  const data = await res.json();
  return data;
},
};
function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DATA REPOSITORY
   The single source of truth for the UI.
   Caches results in memory.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   UTILITIES
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TOAST
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
let _toastTimer = null;
function showToast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   THEME
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const ThemeService = {
  init() {
    const saved = localStorage.getItem('kashly_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    // themeToggle button is optional — replaced by ThemeServiceExt in the additions
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggle());
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('kashly_theme', next);
  },
};



/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   NAVIGATION
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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
    const list = Array.isArray(txns) ? txns : (txns?.data?.transactions ?? txns?.transactions ?? txns?.data ?? []);
const filtered = filter === 'all' ? list : list.filter(t => t.status === filter);
    Renderers.renderTxnTable(document.getElementById('allTxns'), filtered);
  },
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   RENDERERS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const Renderers = {
  renderSummary(loans) {
    const active = loans.filter(l => l.status === 'active');
    const totalOutstanding = active.reduce((s, l) => s + l.outstanding, 0);
    const nextEmi = active.find(l => l.nextDue);
    const totalDisbursed = loans.reduce((s, l) => s + l.principal, 0);
  },

  renderActiveLoans(loans) {
    const el = document.getElementById('activeLoansList');
    console.log('Loans:', loans);
    if (!el) return;
   const loanList = Array.isArray(loans)
  ? loans
  : (loans?.data || loans?.loans || []);

const active = loanList.filter(
  l => (l.status || '').toLowerCase() === 'active'
);
// Filter active loans (case-safe)
const activeLoans = loanList.filter(
  l => (l.status || '').toLowerCase() === 'active'
);

// Render
el.innerHTML = activeLoans.map(l => {
      const pct = Utils.loanProgress(l);
      return `
        <div class="loan-item">
          <div class="loan-item-top">
            <span class="loan-item-name">${l.type} ${l.id}</span>
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
   const txnList = Array.isArray(txns)
  ? txns
  : (txns?.data?.transactions ||
     txns?.transactions ||
     txns?.data ||
     []);

const recentTxns = Array.isArray(txnList)
  ? txnList.slice(0, 5)
  : [];
 const maxAmt = Math.max(...recentTxns.map(t => t.amount));
    el.innerHTML = recentTxns.map(t => {
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
    const list = Array.isArray(txns) ? txns : [];
if (!list.length) {
  container.innerHTML = '<div style="padding:20px;color:var(--text-3);font-size:14px;text-align:center">No transactions found</div>';
  return;
}
const rows = list.map(t => `
      <div class="txn-row">
        <span class="txn-loan-name">${t.loanName ?? '—'}</span>
        <span class="txn-date">${t.date}</span>
        <span class="txn-amount">${Utils.formatCurrency(t.amount)}</span>
        <span class="txn-principal">${Utils.formatCurrency(t.principal ?? 0)}</span>
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
                <div class="ldc-id">${l.id} Â· Disbursed ${l.disbursedOn}</div>
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
              <div class="ldc-stat-value num">${l.emiAmount ? Utils.formatCurrency(l.emiAmount) : 'â€”'}</div>
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
          <div class="doc-meta">${d.type} Â· ${d.size} Â· ${d.date}</div>
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MOBILE SIDEBAR
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   NOTIFICATION PANEL
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DASHBOARD APP â€” bootstrap
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const DashboardApp = {
  async init() {
    ThemeService.init();
    NavService.init();
    MobileService.init();
    NotifService.init();

    // ── ADD: new service initialisations ──
    ThemeServiceExt.init();
    SidebarExtService.init();
    ProfileService.init();
    KYCService.init();
    CreditScoreService.init();
    AccountsService.init();
    QuickLinksService.init();
    SettingsService.init();
    ModalService.init();
    extendNavService();       // must run after NavService.init()

    // ── 1. User — greeting + topbar + sidebar ──────────────────────────────
try {
  const user = await DataRepository.get('getUser');
  if (user) {
    const hour = new Date().getHours();
    const salutation = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName  = (user.name || '').split(' ')[0] || 'there';
    const initials   = (user.name || user.email || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

    const greetEl = document.getElementById('greetingText');
    if (greetEl) greetEl.innerHTML = `${salutation}, <em>${Sanitize.text(firstName)}</em>`;

    const topbarAvatar = document.getElementById('topbarAvatar');
    if (topbarAvatar) topbarAvatar.textContent = initials;

    // Sidebar profile (already handled by ProfileService, but sync here too)
    const avatarEl = document.querySelector('.profile-avatar');
    if (avatarEl) avatarEl.textContent = initials;
    const nameEl  = document.querySelector('.profile-name');
    if (nameEl)  nameEl.textContent = Sanitize.text(user.name || '');
    const emailEl = document.querySelector('.profile-email');
    if (emailEl) emailEl.textContent = Sanitize.text(user.email || '');
  }
} catch (e) { console.warn('User fetch failed:', e); }

// ── 2. Account summary cards ───────────────────────────────────────────
try {
  const summary = await MockDataProvider.getSummary();
  const s = summary?.data || summary;
  const bal = s?.balances ?? {};
  const loans_meta = s?.loans ?? {};

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };
  setEl('sumOutstanding',     bal.outstanding  ?? '—');
  setEl('sumOutstandingMeta', `Across ${loans_meta.active ?? 0} active loan${loans_meta.active !== 1 ? 's' : ''}`);
  setEl('sumTotalLoaned',     bal.totalLoaned  ?? '—');

  // Credit score
  const cs = s?.creditScore;
  if (cs != null) {
    const pct  = Math.min(100, Math.max(0, ((cs - 300) / 600) * 100));
    const tag  = cs >= 750 ? 'Excellent' : cs >= 700 ? 'Good' : cs >= 650 ? 'Fair' : 'Poor';
    setEl('sidebarCreditScore', cs);
    setEl('sidebarCreditTag',   tag);
    setEl('csScoreVal',         cs);
    setEl('csScoreLabel',       tag);
    setTimeout(() => {
      document.getElementById('sidebarCreditFill')?.style.setProperty('width', pct + '%');
      document.querySelector('.csw-fill')?.style.setProperty('width', pct + '%');
    }, 300);
  }
} catch (e) { console.warn('Summary fetch failed:', e); }

// ── 3. Load loans + transactions in parallel ───────────────────────────
const [rawLoans, rawTxns, docs, notifs, faqs] = await Promise.all([
  DataRepository.get('getLoans'),
  DataRepository.get('getTransactions'),
  DataRepository.get('getDocuments'),
  DataRepository.get('getNotifications'),
  DataRepository.get('getFAQs'),
]);

// Normalise to arrays
const loanList = Array.isArray(rawLoans) ? rawLoans : (rawLoans?.data?.loans ?? rawLoans?.loans ?? rawLoans?.data ?? []);
const txnList  = Array.isArray(rawTxns)  ? rawTxns  : (rawTxns?.data?.transactions ?? rawTxns?.transactions ?? rawTxns?.data ?? []);

// ── 4. Derive next EMI from active loans ───────────────────────────────
const activeLoans = loanList.filter(l => (l.status || '').toLowerCase() === 'active');
const nextEmiLoan = activeLoans.find(l => l.nextDue || l.emiAmount);
if (nextEmiLoan) {
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };
  setEl('sumNextEmi',     nextEmiLoan.emiAmount ? Utils.formatCurrency(nextEmiLoan.emiAmount) : '—');
  setEl('sumNextEmiDate', nextEmiLoan.nextDue   ? `Due on ${nextEmiLoan.nextDue}` : '—');
}

// Repayment health (on-time %)
const paidTxns    = txnList.filter(t => t.status === 'paid').length;
const totalTxns   = txnList.filter(t => ['paid','overdue'].includes(t.status)).length;
const healthEl    = document.getElementById('sumRepaymentHealth');
if (healthEl) healthEl.textContent = totalTxns ? Math.round((paidTxns / totalTxns) * 100) + '%' : '—';

// ── 5. Render ──────────────────────────────────────────────────────────
Renderers.renderActiveLoans(loanList);
Renderers.renderEmiChart(txnList);
Renderers.renderTxnTable(document.getElementById('recentTxns'), txnList.slice(0, 5));
Renderers.renderLoansDetail(loanList);
Renderers.renderTxnTable(document.getElementById('allTxns'), txnList);
Renderers.renderDocuments(docs);
Renderers.renderNotifications(notifs);
Renderers.renderFAQs(faqs);
  },
};

/**
 * ═══════════════════════════════════════════════════════
 * KASHLY — dashboard-additions.js
 *
 * PASTE: at the very bottom of your existing dashboard.js,
 * BEFORE the final `document.addEventListener('DOMContentLoaded', …)`
 *
 * Then add these calls inside DashboardApp.init() after existing calls:
 *   ProfileService.init();
 *   KYCService.init();
 *   CreditScoreService.init();
 *   AccountsService.init();
 *   QuickLinksService.init();
 *   SettingsService.init();
 *   SidebarExtService.init();
 *   ModalService.init();
 * ═══════════════════════════════════════════════════════
 */

'use strict';

/* ══════════════════════════════════════════
   SECURITY HELPERS
   Sanitize all user input before display.
══════════════════════════════════════════ */
const Sanitize = {
  /** Strip HTML tags — NEVER inject raw API strings as innerHTML */
  text(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },
  /** Mask middle digits of Aadhaar */
  maskAadhaar(n) { return String(n).replace(/^(\d{4})\d{4}(\d{4})$/, '$1 XXXX $2'); },
  /** Mask PAN mid chars */
  maskPAN(p) { return String(p).replace(/^([A-Z]{5})\d{4}([A-Z])$/, '$1XXXX$2'); },
};

/* ══════════════════════════════════════════
   THEME SERVICE (EXTENDED)
   Removes toggle button dep — reads only from localStorage.
   ThemeService.set() called by theme selector buttons.
══════════════════════════════════════════ */
const ThemeServiceExt = {
  KEY: 'kashly_theme',
  get()  { return localStorage.getItem(this.KEY) || 'dark'; },
  set(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(this.KEY, t);
    // sync all theme-opt buttons
    document.querySelectorAll('.theme-opt').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === t);
    });
  },
  init() {
    this.set(this.get());
    // Event delegation for all .theme-opt buttons on the page
    document.addEventListener('click', e => {
      const btn = e.target.closest('.theme-opt');
      if (btn?.dataset.theme) this.set(btn.dataset.theme);
    });
  },
};

/* ══════════════════════════════════════════
   SIDEBAR EXTENDED (collapse + logout)
══════════════════════════════════════════ */
const SidebarExtService = {
  COLLAPSE_KEY: 'sidebar_collapsed',

  init() {
    const sidebar     = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    const logoutBtn   = document.getElementById('sidebarLogoutBtn');

    // Restore saved collapse state
    if (localStorage.getItem(this.COLLAPSE_KEY) === 'true') {
      sidebar?.classList.add('collapsed');
    }

    collapseBtn?.addEventListener('click', () => {
      const isCollapsed = sidebar?.classList.toggle('collapsed');
      localStorage.setItem(this.COLLAPSE_KEY, String(isCollapsed));
    });

    logoutBtn?.addEventListener('click', () => {
      localStorage.removeItem('kashly_token');
      localStorage.removeItem('kashly_refresh_token');
      localStorage.removeItem('kashly_user');
      window.location.href = 'login.html';
    });
  },
};

/* ══════════════════════════════════════════
   PROFILE SERVICE
══════════════════════════════════════════ */
const ProfileService = {
  _user: null,

  async _loadUser() {
    // First try localStorage (set on login), then fall back to API
    try {
      const cached = localStorage.getItem('kashly_user');
      if (cached) return JSON.parse(cached);
    } catch {}
    try {
      const res  = await fetch(`${CONFIG.API_BASE}/users/me`, { headers: AuthService.getHeaders() });
      const data = await res.json();
      return data.data;
    } catch { return null; }
  },

  async _saveUser(payload) {
    // REAL: PATCH /api/v1/users/me
    // return fetch(`${CONFIG.API_BASE}/users/me`, {
    //   method: 'PATCH',
    //   headers: AuthService.getHeaders(),
    //   body: JSON.stringify(payload),
    // }).then(r => r.json());
    return new Promise(r => setTimeout(() => r({ success: true, data: payload }), 600));
  },

  _render(user) {
    if (!user) return;
    this._user = user;
    const s = Sanitize;
    // View mode
    const el = id => document.getElementById(id);
    if (el('pfName'))  el('pfName').textContent  = s.text(user.name  || '—');
    if (el('pfEmail')) el('pfEmail').textContent = s.text(user.email || '—');
    if (el('pfPhone')) el('pfPhone').textContent = s.text(user.phone || '—');

    // KYC badge
    const kycBadge = el('kycStatusBadge');
    if (kycBadge) {
      const kyc = user.kycStatus || 'NOT_STARTED';
      const map = { VERIFIED: 'badge-paid', PENDING: 'badge-upcoming', REJECTED: 'badge-overdue', NOT_STARTED: 'badge-upcoming' };
      kycBadge.className = `badge ${map[kyc] || ''}`;
      kycBadge.textContent = kyc.replace('_', ' ');
    }

    // Sidebar avatar
    const avatarEl = document.querySelector('.profile-avatar');
    if (avatarEl && user.name) {
      avatarEl.textContent = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    }
    const nameEl  = document.querySelector('.profile-name');
    const emailEl = document.querySelector('.profile-email');
    if (nameEl)  nameEl.textContent  = s.text(user.name  || '');
    if (emailEl) emailEl.textContent = s.text(user.email || '');
  },

  _toggleEditMode(on) {
    document.getElementById('profileFieldsView')?.classList.toggle('hidden', on);
    document.getElementById('profileEditForm')?.classList.toggle('hidden', !on);
    if (on && this._user) {
      const el = id => document.getElementById(id);
      if (el('pefName'))  el('pefName').value  = this._user.name  || '';
      if (el('pefEmail')) el('pefEmail').value = this._user.email || '';
      if (el('pefPhone')) el('pefPhone').value = this._user.phone || '';
    }
  },

  _togglePwForm(on) {
    document.getElementById('changePwForm')?.classList.toggle('hidden', !on);
  },

  init() {
    // Load + render user
    this._loadUser().then(u => this._render(u));

    // Edit toggle
    document.getElementById('editBasicBtn')?.addEventListener('click', () => this._toggleEditMode(true));
    document.getElementById('cancelBasicBtn')?.addEventListener('click', () => this._toggleEditMode(false));

    // Save basic info
    document.getElementById('profileEditForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = {
        name:  document.getElementById('pefName')?.value.trim(),
        email: document.getElementById('pefEmail')?.value.trim(),
        phone: document.getElementById('pefPhone')?.value.trim(),
      };
      const btn = document.getElementById('saveBasicBtn');
      btn.textContent = 'Saving…'; btn.disabled = true;
      try {
        const res = await this._saveUser(payload);
        if (res.success) {
          this._user = { ...this._user, ...payload };
          // Update localStorage cache
          const cached = JSON.parse(localStorage.getItem('kashly_user') || '{}');
          localStorage.setItem('kashly_user', JSON.stringify({ ...cached, ...payload }));
          this._render(this._user);
          this._toggleEditMode(false);
          showToast('Profile updated successfully', 'success');
        }
      } catch { showToast('Failed to save. Try again.', 'error'); }
      finally  { btn.textContent = 'Save changes'; btn.disabled = false; }
    });

    // Password
    document.getElementById('changePasswordBtn')?.addEventListener('click', () => this._togglePwForm(true));
    document.getElementById('cancelPwBtn')?.addEventListener('click',       () => this._togglePwForm(false));

    document.getElementById('changePwForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      const cur     = document.getElementById('cpCurrent')?.value;
      const next    = document.getElementById('cpNew')?.value;
      const confirm = document.getElementById('cpConfirm')?.value;
      if (!cur || !next) { showToast('Fill all password fields', 'error'); return; }
      if (next.length < 8) { showToast('Password must be ≥ 8 characters', 'error'); return; }
      if (next !== confirm) { showToast('Passwords do not match', 'error'); return; }
      try {
        // REAL: await fetch(`${CONFIG.API_BASE}/auth/password`, { method:'PATCH', headers: AuthService.getHeaders(), body: JSON.stringify({ currentPassword: cur, newPassword: next }) });
        await new Promise(r => setTimeout(r, 700));
        this._togglePwForm(false);
        document.getElementById('changePwForm')?.reset();
        showToast('Password updated', 'success');
      } catch { showToast('Password change failed', 'error'); }
    });

    // 2FA toggle
    document.getElementById('twoFAToggle')?.addEventListener('change', async function () {
      // REAL: await fetch(`${CONFIG.API_BASE}/auth/2fa`, { method:'PATCH', headers: AuthService.getHeaders(), body: JSON.stringify({ enabled: this.checked }) });
      showToast(this.checked ? '2FA enabled' : '2FA disabled', 'info');
    });

    // Logout all
    document.getElementById('logoutAllBtn')?.addEventListener('click', async () => {
      // REAL: await fetch(`${CONFIG.API_BASE}/auth/sessions`, { method:'DELETE', headers: AuthService.getHeaders() });
      await new Promise(r => setTimeout(r, 500));
      showToast('All other sessions logged out', 'success');
    });

    // Notification prefs — persist in localStorage
    ['prefEmail','prefSMS','prefPush'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const key = `kashly_pref_${id}`;
      el.checked = localStorage.getItem(key) !== 'false';
      el.addEventListener('change', () => localStorage.setItem(key, String(el.checked)));
    });

    // Delete account
    document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
      document.getElementById('deleteAccountModal')?.classList.remove('hidden');
    });

    // Terms / Privacy buttons
    document.getElementById('openTermsBtn')?.addEventListener('click',   () => ModalService.openLegal('terms'));
    document.getElementById('openPrivacyBtn')?.addEventListener('click', () => ModalService.openLegal('privacy'));
  },
};

/* ══════════════════════════════════════════
   KYC SERVICE
══════════════════════════════════════════ */
const KYCService = {
  _step: 1,
  _data: {},

  _setStep(n) {
    this._step = n;
    // Update progress bar
    document.querySelectorAll('#kycProgress .sp-step').forEach((el, i) => {
      el.classList.toggle('active', i + 1 === n);
      el.classList.toggle('done',   i + 1 < n);
    });
    // Show correct step panel
    document.querySelectorAll('.kyc-step').forEach((el, i) => {
      el.classList.toggle('active', i + 1 === n);
    });
  },

  _startTimer(timerEl, resendBtn, seconds = 30) {
    let t = seconds;
    resendBtn.disabled = true;
    const iv = setInterval(() => {
      t--;
      if (timerEl) timerEl.textContent = t + 's';
      if (t <= 0) {
        clearInterval(iv);
        resendBtn.disabled  = false;
        resendBtn.innerHTML = 'Resend OTP';
      }
    }, 1000);
  },

  _wireOTPDigits(containerId) {
    const digits = document.querySelectorAll(`#${containerId} .otp-digit`);
    digits.forEach((inp, idx) => {
      inp.addEventListener('input', () => {
        inp.value = inp.value.replace(/\D/g,'').slice(-1);
        if (inp.value && idx < digits.length - 1) digits[idx+1].focus();
      });
      inp.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !inp.value && idx > 0) digits[idx-1].focus();
      });
    });
    digits[0]?.addEventListener('paste', e => {
      e.preventDefault();
      const p = (e.clipboardData||window.clipboardData).getData('text').replace(/\D/g,'').slice(0,6);
      p.split('').forEach((c,i) => { if (digits[i]) digits[i].value = c; });
      digits[Math.min(p.length, digits.length-1)]?.focus();
    });
  },

  _getOTP(containerId) {
    return [...document.querySelectorAll(`#${containerId} .otp-digit`)].map(d => d.value).join('');
  },

  init() {
    // Step 1 — Mobile OTP
    document.getElementById('kycSendOtpBtn')?.addEventListener('click', async () => {
      const mobile = document.getElementById('kycMobile')?.value.trim();
      if (!/^\d{10}$/.test(mobile)) { showToast('Enter a valid 10-digit number', 'error'); return; }
      try {
        // REAL: await fetch(`${CONFIG.API_BASE}/kyc/mobile`, { method:'POST', headers: AuthService.getHeaders(), body: JSON.stringify({ mobile }) });
        await new Promise(r => setTimeout(r, 600));
        this._data.mobile = mobile;
        document.getElementById('kycOtpTarget').textContent = '+91 ' + mobile;
        document.getElementById('kycMobileForm').classList.add('hidden');
        document.getElementById('kycOtpForm').classList.remove('hidden');
        this._wireOTPDigits('kycOtpDigits');
        this._startTimer(document.getElementById('kycTimer'), document.getElementById('kycResendBtn'));
        document.querySelector('#kycOtpDigits .otp-digit')?.focus();
      } catch { showToast('Failed to send OTP', 'error'); }
    });

    document.getElementById('kycVerifyOtpBtn')?.addEventListener('click', async () => {
      const otp = this._getOTP('kycOtpDigits');
      if (otp.length < 6) { showToast('Enter complete 6-digit OTP', 'error'); return; }
      try {
        // REAL: await fetch(`${CONFIG.API_BASE}/kyc/mobile/verify`, { method:'POST', headers: AuthService.getHeaders(), body: JSON.stringify({ mobile: this._data.mobile, otp }) });
        await new Promise(r => setTimeout(r, 700));
        this._data.mobileVerified = true;
        showToast('Mobile verified ✓', 'success');
        this._setStep(2);
      } catch { showToast('Invalid OTP', 'error'); }
    });

    // Step 2 — Aadhaar
    document.getElementById('kycAadhaarSendBtn')?.addEventListener('click', async () => {
      const aadhaar = document.getElementById('kycAadhaar')?.value.replace(/\s/g,'');
      if (!/^\d{12}$/.test(aadhaar)) { showToast('Enter valid 12-digit Aadhaar', 'error'); return; }
      try {
        // REAL: await fetch(`${CONFIG.API_BASE}/kyc/aadhaar`, { method:'POST', headers: AuthService.getHeaders(), body: JSON.stringify({ aadhaar }) });
        await new Promise(r => setTimeout(r, 700));
        this._data.aadhaar = aadhaar;
        document.getElementById('kycAadhaarForm').classList.add('hidden');
        document.getElementById('kycAadhaarOtpForm').classList.remove('hidden');
        this._wireOTPDigits('kycAadhaarOtpDigits');
        document.querySelector('#kycAadhaarOtpDigits .otp-digit')?.focus();
      } catch { showToast('Failed to send OTP', 'error'); }
    });

    document.getElementById('kycAadhaarVerifyBtn')?.addEventListener('click', async () => {
      const otp = this._getOTP('kycAadhaarOtpDigits');
      if (otp.length < 6) { showToast('Enter complete 6-digit OTP', 'error'); return; }
      try {
        // REAL: await fetch(`${CONFIG.API_BASE}/kyc/aadhaar/verify`, { method:'POST', headers: AuthService.getHeaders(), body: JSON.stringify({ aadhaar: this._data.aadhaar, otp }) });
        await new Promise(r => setTimeout(r, 700));
        this._data.aadhaarVerified = true;
        showToast('Aadhaar verified ✓', 'success');
        this._setStep(3);
      } catch { showToast('Invalid OTP', 'error'); }
    });

    // Step 3 — PAN
    document.getElementById('kycPanVerifyBtn')?.addEventListener('click', async () => {
      const pan = document.getElementById('kycPAN')?.value.trim().toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) { showToast('Enter valid PAN (e.g. ABCDE1234F)', 'error'); return; }
      try {
        // REAL: await fetch(`${CONFIG.API_BASE}/kyc/pan`, { method:'POST', headers: AuthService.getHeaders(), body: JSON.stringify({ pan }) });
        await new Promise(r => setTimeout(r, 800));
        this._data.pan = pan;
        // Render review
        const grid = document.getElementById('kycReviewGrid');
        if (grid) {
          grid.innerHTML = [
            { label: 'Mobile',  val: '+91 ' + this._data.mobile },
            { label: 'Aadhaar', val: Sanitize.maskAadhaar(this._data.aadhaar) },
            { label: 'PAN',     val: Sanitize.maskPAN(this._data.pan) },
            { label: 'Status',  val: 'PENDING' },
          ].map(r => `<div class="kyc-rv-item"><div class="kyc-rv-label">${r.label}</div><div class="kyc-rv-val">${r.val}</div></div>`).join('');
        }
        const status = document.getElementById('kycFinalStatus');
        if (status) {
          status.className = 'badge badge-upcoming';
          status.textContent = 'PENDING REVIEW';
        }
        showToast('KYC submitted for review', 'success');
        this._setStep(4);
      } catch { showToast('PAN verification failed', 'error'); }
    });
  },
};

/* ══════════════════════════════════════════
   CREDIT SCORE SERVICE
══════════════════════════════════════════ */
const CreditScoreService = {
  async _fetchScore() {
    // REAL: return fetch(`${CONFIG.API_BASE}/credit-score/check`, { method:'POST', headers: AuthService.getHeaders() }).then(r => r.json());
    return new Promise(r => setTimeout(() => r({
      success: true,
      data: {
        score: '-', label: 'Good',
        insights: [
          { label: 'Payment History', val: '-' },
          { label: 'Credit Utilisation', val: '-' },
          { label: 'Loan Age (avg)', val: '-' },
          { label: 'Active Accounts', val: '-' },
        ],
      },
    }), 1200));
  },

  _animateGauge(score) {
    const fill = document.querySelector('.cs-gauge-fill');
    if (!fill) return;
    const pct    = (score - 300) / 600;             // 300–900 range
    const length = 251;                              // half-circle arc ≈ π×r = π×80
    const offset = length - (pct * length);
    setTimeout(() => { fill.style.strokeDashoffset = offset; }, 200);
    // Colour
    const colour = score >= 750 ? 'var(--green)' : score >= 600 ? 'var(--warn)' : 'var(--red)';
    fill.style.stroke = colour;
  },

  _render(data) {
    const el = id => document.getElementById(id);
    if (el('csScoreVal'))   el('csScoreVal').textContent   = data.score;
    if (el('csScoreLabel')) el('csScoreLabel').textContent = data.label;
    this._animateGauge(data.score);

    const insights = document.getElementById('csInsights');
    if (insights) {
      insights.innerHTML = data.insights.map(i =>
        `<div class="cs-insight-card">
           <div class="cs-insight-label">${Sanitize.text(i.label)}</div>
           <div class="cs-insight-val">${Sanitize.text(i.val)}</div>
         </div>`
      ).join('');
    }

    // Show result step
    document.getElementById('csStep1')?.classList.remove('active');
    document.getElementById('csStep2')?.classList.add('active');
  },

  init() {
    document.getElementById('csFetchBtn')?.addEventListener('click', async () => {
      const consent = document.getElementById('csConsent');
      if (!consent?.checked) { showToast('Please give consent to continue', 'error'); return; }
      const btn = document.getElementById('csFetchBtn');
      btn.textContent = 'Fetching…'; btn.disabled = true;
      try {
        const res = await this._fetchScore();
        if (res.success) this._render(res.data);
      } catch { showToast('Failed to fetch credit score', 'error'); }
      finally  { btn.textContent = 'Fetch Credit Score'; btn.disabled = false; }
    });

    document.getElementById('csRefreshBtn')?.addEventListener('click', async () => {
      document.getElementById('csStep2')?.classList.remove('active');
      document.getElementById('csStep1')?.classList.add('active');
      const consent = document.getElementById('csConsent');
      if (consent) consent.checked = false;
    });
  },
};

/* ══════════════════════════════════════════
   ACCOUNTS SERVICE
══════════════════════════════════════════ */
const AccountsService = {
  _accounts: [],

  async _load() {
    if (this._accounts.length) return this._accounts;
    try {
      // REAL: const res = await fetch(`${CONFIG.API_BASE}/accounts`, { headers: AuthService.getHeaders() }); return (await res.json()).data;
      return [
        { id: 'acc_1', bank: 'State Bank of India', number: '••••6789', ifsc: 'SBIN0001234', isDefault: true },
      ];
    } catch { return []; }
  },

  _render(accounts) {
    this._accounts = accounts;
    const list = document.getElementById('accountsList');
    if (!list) return;
    if (!accounts.length) {
      list.innerHTML = '<div class="empty-accounts">No accounts linked yet.</div>';
      return;
    }
    list.innerHTML = accounts.map(a => `
      <div class="acc-item" data-id="${a.id}">
        <div class="acc-item-left">
          <div class="acc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
          <div>
            <div class="acc-bank">${Sanitize.text(a.bank)}</div>
            <div class="acc-num">${Sanitize.text(a.number)}</div>
          </div>
        </div>
        <div class="acc-actions">
          ${a.isDefault ? '<span class="acc-default-badge">Default</span>' : `<button class="btn btn-ghost btn-sm acc-set-default" data-id="${a.id}">Set Default</button>`}
          <button class="acc-delete-btn" data-id="${a.id}" aria-label="Delete account">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>`).join('');
  },

  init() {
    this._load().then(a => this._render(a));

    document.getElementById('addAccountBtn')?.addEventListener('click', () => {
      document.getElementById('addAccountForm')?.classList.toggle('hidden');
    });
    document.getElementById('cancelAddAccBtn')?.addEventListener('click', () => {
      document.getElementById('addAccountForm')?.classList.add('hidden');
    });

    document.getElementById('addAccountFormEl')?.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = {
        name:   document.getElementById('accName')?.value.trim(),
        number: document.getElementById('accNumber')?.value.trim(),
        ifsc:   document.getElementById('accIFSC')?.value.trim().toUpperCase(),
        bank:   document.getElementById('accBank')?.value.trim(),
      };
      if (!payload.name || !payload.number || !payload.ifsc) { showToast('Fill all required fields', 'error'); return; }
      try {
        // REAL: const res = await fetch(`${CONFIG.API_BASE}/accounts`, { method:'POST', headers: AuthService.getHeaders(), body: JSON.stringify(payload) });
        await new Promise(r => setTimeout(r, 600));
        const newAcc = { id: 'acc_' + Date.now(), bank: payload.bank, number: '••••' + payload.number.slice(-4), ifsc: payload.ifsc, isDefault: false };
        this._accounts.push(newAcc);
        this._render(this._accounts);
        document.getElementById('addAccountFormEl')?.reset();
        document.getElementById('addAccountForm')?.classList.add('hidden');
        showToast('Account added successfully', 'success');
      } catch { showToast('Failed to add account', 'error'); }
    });

    // Event delegation for delete + set default
    document.getElementById('accountsList')?.addEventListener('click', async e => {
      const delBtn     = e.target.closest('.acc-delete-btn');
      const defaultBtn = e.target.closest('.acc-set-default');

      if (delBtn) {
        const id = delBtn.dataset.id;
        try {
          // REAL: await fetch(`${CONFIG.API_BASE}/accounts/${id}`, { method:'DELETE', headers: AuthService.getHeaders() });
          await new Promise(r => setTimeout(r, 400));
          this._accounts = this._accounts.filter(a => a.id !== id);
          this._render(this._accounts);
          showToast('Account removed', 'info');
        } catch { showToast('Delete failed', 'error'); }
      }

      if (defaultBtn) {
        const id = defaultBtn.dataset.id;
        this._accounts = this._accounts.map(a => ({ ...a, isDefault: a.id === id }));
        this._render(this._accounts);
        showToast('Default account updated', 'success');
      }
    });
  },
};

/* ══════════════════════════════════════════
   QUICK LINKS SERVICE
══════════════════════════════════════════ */
const QuickLinksService = {
  _links: [
    { title: 'Pay EMI',      desc: 'Make your next EMI payment',          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`, action: () => showToast('EMI payment initiated') },
    { title: 'Foreclose',    desc: 'Close your loan early',               icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`, action: () => showToast('Foreclosure quote requested') },
    { title: 'Statement',    desc: 'Download your loan statement',        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`, action: () => showToast('Statement emailed') },
    { title: 'Support',      desc: 'Raise a ticket or call us',           icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`, action: () => NavService.navigate('support') },
    { title: 'Top-up Loan',  desc: 'Check eligibility for top-up',        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`, action: () => showToast('Top-up eligibility checked') },
    { title: 'New Loan',     desc: 'Apply for another loan',              icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 17L17 7M17 7H9M17 7V15"/></svg>`, action: () => window.location.href = 'apply.html' },
    { title: 'Credit Score', desc: 'Check your live credit score',        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`, action: () => NavService.navigate('credit-score') },
    { title: 'KYC',          desc: 'Complete your identity verification', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`, action: () => NavService.navigate('kyc') },
    { title: 'Accounts',     desc: 'Manage linked bank accounts',         icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`, action: () => NavService.navigate('accounts') },
  ],

  init() {
    const grid = document.getElementById('quickLinksGrid');
    if (!grid) return;
    grid.innerHTML = this._links.map((l, i) => `
      <div class="ql-card" data-ql="${i}">
        <div class="ql-icon">${l.icon}</div>
        <div class="ql-title">${Sanitize.text(l.title)}</div>
        <div class="ql-desc">${Sanitize.text(l.desc)}</div>
      </div>`).join('');

    // Single delegated listener
    grid.addEventListener('click', e => {
      const card = e.target.closest('.ql-card[data-ql]');
      if (!card) return;
      this._links[+card.dataset.ql]?.action();
    });
  },
};

/* ══════════════════════════════════════════
   SETTINGS SERVICE
══════════════════════════════════════════ */
const SettingsService = {
  _PREFS_KEY: 'kashly_prefs',

  _load() {
    try { return JSON.parse(localStorage.getItem(this._PREFS_KEY)) || {}; }
    catch { return {}; }
  },
  _save(key, val) {
    const prefs = this._load();
    prefs[key] = val;
    localStorage.setItem(this._PREFS_KEY, JSON.stringify(prefs));
  },

  init() {
    const prefs = this._load();
    const toggleIds = ['settPrefEmail','settPrefSMS','settPrefPush','settPrefEMI','settPrivAnalytics','settPrivOffers'];
    toggleIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id in prefs) el.checked = prefs[id];
      el.addEventListener('change', () => this._save(id, el.checked));
    });
  },
};

/* ══════════════════════════════════════════
   MODAL SERVICE (delete account + legal)
══════════════════════════════════════════ */
const LEGAL_CONTENT = {
  terms: `
    <h4>1. Acceptance of Terms</h4>
    <p>By accessing Kashly's services, you agree to be bound by these Terms of Use and all applicable laws and regulations.</p>
    <h4>2. Loan Products</h4>
    <p>All loan products offered are subject to eligibility criteria, credit assessment, and RBI guidelines. Approval is not guaranteed.</p>
    <h4>3. Interest & Charges</h4>
    <p>Interest rates, processing fees, and other charges are disclosed upfront. No hidden charges will be levied without prior notice.</p>
    <h4>4. Repayment Obligations</h4>
    <p>Borrowers are obligated to repay EMIs on scheduled due dates. Late payments may attract penalty charges as per the loan agreement.</p>
    <h4>5. Foreclosure</h4>
    <p>Loans may be foreclosed after a minimum lock-in period, subject to applicable foreclosure charges disclosed at the time of disbursement.</p>`,
  privacy: `
    <h4>1. Data We Collect</h4>
    <p>We collect personal identification data (name, PAN, Aadhaar), financial data (income, bank statements), and device/usage data for service delivery.</p>
    <h4>2. How We Use Your Data</h4>
    <p>Your data is used for credit assessment, loan processing, regulatory compliance (KYC/AML), and improving our services.</p>
    <h4>3. Data Sharing</h4>
    <p>We share data only with credit bureaus (CIBIL, Experian), banking partners, and RBI as required by law. We never sell your data.</p>
    <h4>4. Data Retention</h4>
    <p>Data is retained for 7 years post loan closure as mandated by RBI guidelines, after which it is securely deleted.</p>
    <h4>5. Your Rights</h4>
    <p>You may request access, correction, or deletion of personal data subject to legal obligations. Contact grievance@kashly.in.</p>`,
  agreement: `
    <h4>User Agreement</h4>
    <p>This User Agreement ("Agreement") governs your use of Kashly Finance Pvt. Ltd. ("Kashly") services.</p>
    <h4>Eligibility</h4>
    <p>You must be an Indian citizen aged 21–65, with a valid PAN and Aadhaar, and meet minimum income criteria to use Kashly's loan services.</p>
    <h4>Account Responsibility</h4>
    <p>You are responsible for maintaining the confidentiality of your login credentials. Any activity under your account is your responsibility.</p>
    <h4>Prohibited Use</h4>
    <p>You may not use Kashly's services for illegal purposes, money laundering, or fraudulent activities. Violations will result in immediate account termination and legal action.</p>
    <h4>Governing Law</h4>
    <p>This Agreement is governed by the laws of India. All disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.</p>`,
};

const ModalService = {
  openLegal(tab = 'terms') {
    document.getElementById('legalModal')?.classList.remove('hidden');
    this._switchTab(tab);
  },

  _switchTab(tab) {
    document.querySelectorAll('.legal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = document.getElementById('legalContent');
    if (content) content.innerHTML = LEGAL_CONTENT[tab] || '';
  },

  init() {
    // Legal modal tabs — event delegation
    document.getElementById('legalModal')?.addEventListener('click', e => {
      const tab = e.target.closest('.legal-tab');
      if (tab?.dataset.tab) this._switchTab(tab.dataset.tab);
    });

    document.getElementById('closeLegalModal')?.addEventListener('click', () => {
      document.getElementById('legalModal')?.classList.add('hidden');
    });

    // Delete account modal
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
      document.getElementById('deleteAccountModal')?.classList.add('hidden');
    });

    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
      try {
        // REAL: await fetch(`${CONFIG.API_BASE}/user`, { method:'DELETE', headers: AuthService.getHeaders() });
        await new Promise(r => setTimeout(r, 800));
        localStorage.clear();
        window.location.href = 'index.html';
      } catch { showToast('Delete failed. Contact support.', 'error'); }
    });

    // Close modals on backdrop click
    ['deleteAccountModal','legalModal'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', e => {
        if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
      });
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      ['deleteAccountModal','legalModal'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
      });
    });
  },
};

/* ══════════════════════════════════════════
   NAV SERVICE EXTENSION
   Adds new page labels to the existing NavService breadcrumb map.
   PASTE this right after the existing NavService object definition.
══════════════════════════════════════════ */
// Extend NavService labels for new pages (call after NavService is defined)
function extendNavService() {
  const extraLabels = {
    profile:      'Profile',
    kyc:          'KYC Verification',
    'credit-score': 'Credit Score',
    accounts:     'Linked Accounts',
    'quick-links': 'Quick Actions',
    settings:     'Settings',
  };
  // Merge into NavService if it exposes a labels map, otherwise patch navigate directly
  const origNavigate = NavService.navigate.bind(NavService);
  NavService.navigate = function(page) {
    origNavigate(page);
    // Update breadcrumb for new pages not in original labels map
    if (extraLabels[page]) {
      const bc = document.getElementById('breadcrumbPage');
      if (bc) bc.textContent = extraLabels[page];
    }
    // Init profile data lazily when first visited
    if (page === 'profile') ProfileService._loadUser().then(u => ProfileService._render(u));
    if (page === 'accounts') AccountsService._load().then(a => AccountsService._render(a));
  };
}
function handleInitialRoute() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');

  if (tab) {
    NavService.navigate(tab);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  DashboardApp.init();
  handleInitialRoute(); 
});