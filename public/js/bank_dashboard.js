/**
 * ═══════════════════════════════════════════════════════
 * KASHLY — bank-dashboard.js
 * Bank Employee / Loan Officer Operations Portal
 *
 * Architecture (mirrors dashboard.js — same migration path):
 *  - CONFIG           : single env config
 *  - AuthService      : JWT header injection
 *  - MockDataProvider : all data calls — replace with fetch()
 *  - DataRepository   : in-memory cache layer
 *  - SanctionService  : business logic for decisions
 *  - Renderers        : pure DOM-writing functions
 *  - BankApp          : bootstrap & orchestration
 *
 * DB Migration:
 *  Replace MockDataProvider.get* methods with real fetch() calls.
 *  SanctionService.submitDecision() calls your POST /loans/:id/decision.
 * ═══════════════════════════════════════════════════════
 */

'use strict';

/* ══════════════════════════════════════════
   CONFIG
══════════════════════════════════════════ */
const CONFIG = {
  API_BASE: '/api/v1',
  CURRENCY: 'INR',
  LOCALE:   'en-IN',
  OFFICER: {
    id:      'emp_pk_001',
    name:    'Priya Kapoor',
    role:    'Sr. Loan Officer',
    level:   'L2',
    initials:'PK',
    maxSanctionLimit: 5000000, // ₹50L
  },
};

/* ══════════════════════════════════════════
   AUTH SERVICE
══════════════════════════════════════════ */
const AuthService = {
  getToken() { return localStorage.getItem('kashly_ops_token') || 'mock-ops-token'; },
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
      'X-Officer-Id': CONFIG.OFFICER.id,
    };
  },
};

/* ══════════════════════════════════════════
   MOCK DATA PROVIDER
   Replace each method with a real fetch() when backend is ready.
══════════════════════════════════════════ */
const MockDataProvider = {

  async getApplications() {
    // REAL: return fetch(`${CONFIG.API_BASE}/loans/applications`, { headers: AuthService.getHeaders() }).then(r => r.json());
    return [
      {
        id: 'APP-2026-0481',
        applicantName: 'Riya Sharma',
        initials: 'RS',
        loanType: 'Personal Loan',
        requestedAmount: 350000,
        tenure: 36,
        requestedRate: 10.5,
        status: 'pending',
        priority: 'high',
        appliedOn: '11 Apr 2026',
        appliedAt: '09:14 AM',
        assignedTo: 'Priya Kapoor',
        profile: {
          dob: '14 Sep 1992', age: 33,
          pan: 'ABCDE1234F',
          phone: '+91 98765 43210', email: 'riya.sharma@email.com',
          address: '42 MG Road, Pune, MH 411001',
          employmentType: 'Salaried',
          employer: 'Infosys Ltd.',
          designation: 'Senior Engineer',
          yearsEmployed: 5,
        },
        financial: {
          monthlyIncome: 95000,
          monthlyExpenses: 32000,
          existingEMIs: 8500,
          bankBalance: 180000,
          annualTurnover: null,
          creditScore: 748,
          debtToIncome: 42,
          employmentScore: 88,
          riskScore: 72,
          riskLabel: 'Low Risk',
        },
        creditHistory: [
          { label: 'On-time',    pct: 96, color: '#22c984' },
          { label: 'Late 30d',   pct: 3,  color: '#f5c542' },
          { label: 'Defaults',   pct: 1,  color: '#f54b4b' },
          { label: 'Inquiries',  pct: 15, color: '#4b8ef5' },
        ],
        documents: [
          { label: 'PAN Card', tag: 'KYC', received: true },
          { label: 'Aadhaar Card', tag: 'KYC', received: true },
          { label: 'Last 3 Salary Slips', tag: 'Income', received: true },
          { label: 'Bank Statement (6 mo)', tag: 'Banking', received: true },
          { label: 'Form 16 / ITR (2 yr)', tag: 'Tax', received: false },
          { label: 'Employment Letter', tag: 'Employment', received: true },
        ],
        audit: [
          { action: 'Application Submitted', detail: 'Self-service portal', time: '11 Apr 09:14', color: 'blue' },
          { action: 'Documents Verified', detail: 'Auto-verification passed (5/6)', time: '11 Apr 09:22', color: 'accent' },
          { action: 'Assigned to Priya Kapoor', detail: 'Auto-assignment · L2 queue', time: '11 Apr 09:25', color: 'blue' },
        ],
      },
      {
        id: 'APP-2026-0479',
        applicantName: 'Karan Mehta',
        initials: 'KM',
        loanType: 'Business Loan',
        requestedAmount: 1200000,
        tenure: 60,
        requestedRate: 12.0,
        status: 'review',
        priority: 'medium',
        appliedOn: '10 Apr 2026',
        appliedAt: '02:30 PM',
        assignedTo: 'Priya Kapoor',
        profile: {
          dob: '02 Mar 1985', age: 41,
          pan: 'FGHIJ5678K',
          phone: '+91 99887 76655', email: 'karan.mehta@biz.com',
          address: '7 Commercial St., Mumbai, MH 400001',
          employmentType: 'Self-Employed',
          employer: 'Mehta Traders Pvt. Ltd.',
          designation: 'Director',
          yearsEmployed: 9,
        },
        financial: {
          monthlyIncome: 210000,
          monthlyExpenses: 85000,
          existingEMIs: 42000,
          bankBalance: 890000,
          annualTurnover: 15000000,
          creditScore: 691,
          debtToIncome: 58,
          employmentScore: 74,
          riskScore: 55,
          riskLabel: 'Medium Risk',
        },
        creditHistory: [
          { label: 'On-time',    pct: 84, color: '#22c984' },
          { label: 'Late 30d',   pct: 10, color: '#f5c542' },
          { label: 'Defaults',   pct: 6,  color: '#f54b4b' },
          { label: 'Inquiries',  pct: 32, color: '#4b8ef5' },
        ],
        documents: [
          { label: 'PAN Card', tag: 'KYC', received: true },
          { label: 'Aadhaar Card', tag: 'KYC', received: true },
          { label: 'Business Registration', tag: 'Business', received: true },
          { label: 'Bank Statement (12 mo)', tag: 'Banking', received: true },
          { label: 'GST Returns (2 yr)', tag: 'Tax', received: true },
          { label: 'ITR (2 yr)', tag: 'Tax', received: false },
          { label: 'Audited Balance Sheet', tag: 'Finance', received: false },
        ],
        audit: [
          { action: 'Application Submitted', detail: 'Branch assisted', time: '10 Apr 14:30', color: 'blue' },
          { action: 'Initial Screening', detail: 'DTI flag raised (58%)', time: '10 Apr 14:45', color: 'accent' },
          { action: 'Sent to Review Queue', detail: 'Manual review required', time: '10 Apr 15:00', color: 'accent' },
          { action: 'Assigned to Priya Kapoor', detail: 'L2 escalation', time: '10 Apr 15:05', color: 'blue' },
        ],
      },
      {
        id: 'APP-2026-0475',
        applicantName: 'Sunita Pillai',
        initials: 'SP',
        loanType: 'Home Loan',
        requestedAmount: 4500000,
        tenure: 240,
        requestedRate: 8.75,
        status: 'flagged',
        priority: 'high',
        appliedOn: '09 Apr 2026',
        appliedAt: '11:05 AM',
        assignedTo: 'Priya Kapoor',
        profile: {
          dob: '21 Jul 1979', age: 46,
          pan: 'LMNOP9012Q',
          phone: '+91 97654 32109', email: 'sunita.pillai@email.com',
          address: '14 Lake View, Bengaluru, KA 560001',
          employmentType: 'Salaried',
          employer: 'Karnataka Govt. (IAS)',
          designation: 'Deputy Commissioner',
          yearsEmployed: 18,
        },
        financial: {
          monthlyIncome: 185000,
          monthlyExpenses: 60000,
          existingEMIs: 25000,
          bankBalance: 3200000,
          annualTurnover: null,
          creditScore: 812,
          debtToIncome: 27,
          employmentScore: 98,
          riskScore: 88,
          riskLabel: 'Very Low Risk',
        },
        creditHistory: [
          { label: 'On-time',    pct: 100, color: '#22c984' },
          { label: 'Late 30d',   pct: 0,   color: '#f5c542' },
          { label: 'Defaults',   pct: 0,   color: '#f54b4b' },
          { label: 'Inquiries',  pct: 8,   color: '#4b8ef5' },
        ],
        documents: [
          { label: 'PAN Card', tag: 'KYC', received: true },
          { label: 'Aadhaar Card', tag: 'KYC', received: true },
          { label: 'Salary Slips (6 mo)', tag: 'Income', received: true },
          { label: 'Property Sale Deed', tag: 'Collateral', received: false },
          { label: 'Property Valuation', tag: 'Collateral', received: false },
          { label: 'Bank Statement (12 mo)', tag: 'Banking', received: true },
          { label: 'NOC from Society', tag: 'Legal', received: false },
        ],
        audit: [
          { action: 'Application Submitted', detail: 'Self-service portal', time: '09 Apr 11:05', color: 'blue' },
          { action: 'Auto-screening Passed', detail: 'High credit score 812', time: '09 Apr 11:10', color: 'green' },
          { action: 'Collateral Documents Missing', detail: 'Property docs not submitted', time: '09 Apr 11:12', color: 'accent' },
          { action: 'Flagged for Manual Review', detail: 'Missing 3 critical docs', time: '09 Apr 11:15', color: 'red' },
          { action: 'Assigned to Priya Kapoor', detail: 'L2 queue · high priority', time: '09 Apr 11:18', color: 'blue' },
        ],
      },
      {
        id: 'APP-2026-0468',
        applicantName: 'Dev Patel',
        initials: 'DP',
        loanType: 'Education Loan',
        requestedAmount: 800000,
        tenure: 84,
        requestedRate: 9.0,
        status: 'pending',
        priority: 'low',
        appliedOn: '08 Apr 2026',
        appliedAt: '04:18 PM',
        assignedTo: 'Priya Kapoor',
        profile: {
          dob: '05 Jan 2002', age: 24,
          pan: 'RSTUV3456W',
          phone: '+91 96543 21098', email: 'dev.patel@student.edu',
          address: '22 University Road, Ahmedabad, GJ 380009',
          employmentType: 'Student',
          employer: 'IIM Ahmedabad',
          designation: 'MBA Student (Y2)',
          yearsEmployed: 0,
        },
        financial: {
          monthlyIncome: 0,
          monthlyExpenses: 15000,
          existingEMIs: 0,
          bankBalance: 45000,
          annualTurnover: null,
          creditScore: 680,
          debtToIncome: 0,
          employmentScore: 60,
          riskScore: 48,
          riskLabel: 'Moderate Risk',
        },
        creditHistory: [
          { label: 'On-time',    pct: 90,  color: '#22c984' },
          { label: 'Late 30d',   pct: 10,  color: '#f5c542' },
          { label: 'Defaults',   pct: 0,   color: '#f54b4b' },
          { label: 'Inquiries',  pct: 22,  color: '#4b8ef5' },
        ],
        documents: [
          { label: 'PAN Card', tag: 'KYC', received: true },
          { label: 'Aadhaar Card', tag: 'KYC', received: true },
          { label: 'Admission Letter', tag: 'Education', received: true },
          { label: 'Fee Structure', tag: 'Education', received: true },
          { label: 'Co-applicant PAN', tag: 'KYC', received: true },
          { label: 'Co-applicant Income Proof', tag: 'Income', received: false },
        ],
        audit: [
          { action: 'Application Submitted', detail: 'Student portal', time: '08 Apr 16:18', color: 'blue' },
          { action: 'Co-applicant Added', detail: 'Father as guarantor', time: '08 Apr 16:22', color: 'blue' },
          { action: 'Pending Co-applicant Docs', detail: 'Income proof required', time: '08 Apr 16:25', color: 'accent' },
        ],
      },
    ];
  },

  async submitDecision(appId, decision) {
    // REAL:
    // return fetch(`${CONFIG.API_BASE}/loans/applications/${appId}/decision`, {
    //   method: 'POST',
    //   headers: AuthService.getHeaders(),
    //   body: JSON.stringify(decision),
    // }).then(r => r.json());
    return new Promise(resolve => setTimeout(() => resolve({ success: true, ref: `DEC-${Date.now()}` }), 600));
  },
};

/* ══════════════════════════════════════════
   DATA REPOSITORY
══════════════════════════════════════════ */
const DataRepository = {
  _cache: {},
  async get(resource) {
    if (this._cache[resource]) return this._cache[resource];
    const data = await MockDataProvider[resource]();
    this._cache[resource] = data;
    return data;
  },
  updateApp(app) {
    const apps = this._cache['getApplications'];
    if (!apps) return;
    const idx = apps.findIndex(a => a.id === app.id);
    if (idx > -1) apps[idx] = app;
  },
};

/* ══════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════ */
const Utils = {
  fmt(n) {
    return new Intl.NumberFormat(CONFIG.LOCALE, {
      style: 'currency', currency: CONFIG.CURRENCY, maximumFractionDigits: 0,
    }).format(n);
  },
  fmtNum(n) {
    return new Intl.NumberFormat(CONFIG.LOCALE).format(n);
  },
  initials(name) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  },
  calcEMI(principal, annualRate, months) {
    if (!principal || !annualRate || !months) return { emi: 0, totalInterest: 0, total: 0 };
    const r = annualRate / 100 / 12;
    const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    const total = emi * months;
    return { emi: Math.round(emi), totalInterest: Math.round(total - principal), total: Math.round(total) };
  },
  statusBadge(status) {
    const map = {
      pending:  ['badge-pending',  'Pending'],
      review:   ['badge-review',   'Under Review'],
      flagged:  ['badge-flagged',  '⚑ Flagged'],
      approved: ['badge-approved', 'Approved'],
      rejected: ['badge-rejected', 'Rejected'],
    };
    const [cls, label] = map[status] || ['', status];
    return `<span class="badge ${cls}">${label}</span>`;
  },
  priorityBadge(p) {
    const map = { high: 'pri-high', medium: 'pri-medium', low: 'pri-low' };
    return `<span class="priority-badge ${map[p] || ''}">${p}</span>`;
  },
  riskColor(score) {
    if (score >= 75) return 'var(--green)';
    if (score >= 50) return 'var(--warn)';
    return 'var(--red)';
  },
};

/* ══════════════════════════════════════════
   SANCTION SERVICE
══════════════════════════════════════════ */
const SanctionService = {
  async submitDecision(app, decisionType, fields) {
    const payload = {
      applicationId: app.id,
      officerId: CONFIG.OFFICER.id,
      officerName: CONFIG.OFFICER.name,
      decision: decisionType,
      sanctionedAmount: fields.amount,
      interestRate: fields.rate,
      tenureMonths: fields.tenure,
      processingFee: fields.fee,
      remarks: fields.remarks,
      internalNote: fields.note,
      timestamp: new Date().toISOString(),
    };
    return MockDataProvider.submitDecision(app.id, payload);
  },
};

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
const State = {
  apps: [],
  selectedApp: null,
  pendingDecision: null,
  filter: 'all',
};

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
let _toastT = null;
function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(_toastT);
  _toastT = setTimeout(() => el.classList.remove('show'), 3400);
}

/* ══════════════════════════════════════════
   THEME
══════════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem('kashly_banker_theme');
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeToggle').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('kashly_ops_theme', next);
  });
}

/* ══════════════════════════════════════════
   CLOCK
══════════════════════════════════════════ */
function initClock() {
  const el = document.getElementById('cbTime');
  function tick() {
    el.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

/* ══════════════════════════════════════════
   COMMAND BAR STATS
══════════════════════════════════════════ */
function updateCommandBarStats(apps) {
  const counts = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  document.getElementById('cbPending').textContent  = (counts.pending || 0) + (counts.review || 0);
  document.getElementById('cbApproved').textContent = counts.approved || 0;
  document.getElementById('cbFlagged').textContent  = counts.flagged  || 0;
  document.getElementById('cbRejected').textContent = counts.rejected || 0;
}

/* ══════════════════════════════════════════
   QUEUE RENDERER
══════════════════════════════════════════ */
function renderQueue(apps) {
  const el = document.getElementById('queueList');
  const filtered = State.filter === 'all' ? apps : apps.filter(a => a.status === State.filter);

  const search = document.getElementById('queueSearch').value.toLowerCase();
  const shown = search
    ? filtered.filter(a => a.applicantName.toLowerCase().includes(search) || a.id.toLowerCase().includes(search))
    : filtered;

  if (!shown.length) {
    el.innerHTML = `<div style="padding:20px;text-align:center;font-size:13px;color:var(--text-3)">No applications found</div>`;
    return;
  }

  el.innerHTML = shown.map(app => `
    <div class="q-item${State.selectedApp?.id === app.id ? ' selected' : ''}" data-id="${app.id}">
      <div class="q-item-top">
        <span class="q-item-name">${app.applicantName}</span>
        <span class="q-item-amount">${Utils.fmt(app.requestedAmount)}</span>
      </div>
      <div class="q-item-meta">
        <span class="q-item-type">${app.loanType}</span>
        <span class="q-item-time">${app.appliedOn} · ${app.appliedAt}</span>
      </div>
      <div class="q-item-bottom">
        ${Utils.statusBadge(app.status)}
        ${Utils.priorityBadge(app.priority)}
        <span style="font-size:10px;color:var(--text-3);margin-left:auto">${app.id}</span>
      </div>
    </div>`).join('');

  el.querySelectorAll('.q-item').forEach(item => {
    item.addEventListener('click', () => {
      const app = apps.find(a => a.id === item.dataset.id);
      if (app) selectApplication(app);
    });
  });
}

/* ══════════════════════════════════════════
   APPLICATION DETAIL RENDERER
══════════════════════════════════════════ */
function selectApplication(app) {
  State.selectedApp = app;

  // toggle panels
  document.getElementById('emptyState').style.display  = 'none';
  document.getElementById('appDetail').style.display = 'flex';

  // re-render queue to update selection highlight
  renderQueue(State.apps);

  // Header
  const avatarEl = document.getElementById('adAvatar');
  avatarEl.textContent = app.initials || Utils.initials(app.applicantName);
  avatarEl.style.background = priorityColor(app.priority);
  document.getElementById('adName').textContent      = app.applicantName;
  document.getElementById('adAppId').textContent     = app.id;
  document.getElementById('adLoanType').textContent  = app.loanType;
  document.getElementById('adAppliedOn').textContent = app.appliedOn;
  document.getElementById('adStatusBadge').innerHTML = Utils.statusBadge(app.status);
  document.getElementById('adPriority').innerHTML    = Utils.priorityBadge(app.priority);

  // Risk scorecard
  const f = app.financial;
  document.getElementById('rsCredit').textContent = f.creditScore;
  document.getElementById('rsDTI').textContent    = f.debtToIncome + '%';
  document.getElementById('rsEmployment').textContent = f.employmentScore + '/100';
  document.getElementById('rsRisk').textContent   = f.riskScore;
  document.getElementById('rsRiskTag').textContent   = f.riskLabel;
  document.getElementById('rsRiskTag').style.cssText  = `background:${Utils.riskColor(f.riskScore)}22;color:${Utils.riskColor(f.riskScore)};padding:2px 10px;border-radius:100px;font-size:11px;font-weight:700;`;

  setTimeout(() => {
    document.getElementById('rsCreditBar').style.width     = Math.round(f.creditScore / 900 * 100) + '%';
    document.getElementById('rsDTIBar').style.width        = Math.min(f.debtToIncome, 100) + '%';
    document.getElementById('rsEmploymentBar').style.width = f.employmentScore + '%';
  }, 100);

  // Profile grid
  const p = app.profile;
  document.getElementById('profileGrid').innerHTML = [
    { k: 'DOB / Age',      v: `${p.dob} · ${p.age} yrs` },
    { k: 'PAN',            v: p.pan },
    { k: 'Phone',          v: p.phone, cls: 'normal' },
    { k: 'Email',          v: p.email, cls: 'normal' },
    { k: 'Employment',     v: p.employmentType },
    { k: 'Employer',       v: p.employer, cls: 'normal' },
    { k: 'Designation',    v: p.designation, cls: 'normal' },
    { k: 'Years Employed', v: p.yearsEmployed ? p.yearsEmployed + ' yrs' : 'N/A' },
  ].map(r => `<div class="dc-kv"><span class="dc-key">${r.k}</span><span class="dc-val ${r.cls || ''}">${r.v}</span></div>`).join('');

  // Financial grid
  document.getElementById('financialGrid').innerHTML = [
    { k: 'Monthly Income',    v: Utils.fmt(f.monthlyIncome),  cls: 'good' },
    { k: 'Monthly Expenses',  v: Utils.fmt(f.monthlyExpenses) },
    { k: 'Existing EMIs',     v: Utils.fmt(f.existingEMIs),   cls: f.existingEMIs > 30000 ? 'warn' : '' },
    { k: 'Bank Balance',      v: Utils.fmt(f.bankBalance),    cls: 'good' },
    { k: 'Annual Turnover',   v: f.annualTurnover ? Utils.fmt(f.annualTurnover) : '—' },
    { k: 'DTI Ratio',         v: f.debtToIncome + '%',        cls: f.debtToIncome > 50 ? 'bad' : f.debtToIncome > 35 ? 'warn' : 'good' },
  ].map(r => `<div class="dc-kv"><span class="dc-key">${r.k}</span><span class="dc-val ${r.cls || ''}">${r.v}</span></div>`).join('');

  // Credit history
  document.getElementById('creditHistory').innerHTML = app.creditHistory.map(c => `
    <div class="ch-row">
      <span class="ch-label">${c.label}</span>
      <div class="ch-bar-track">
        <div class="ch-bar-fill" data-w="${c.pct}" style="width:0%;background:${c.color}"></div>
      </div>
      <span class="ch-val">${c.pct}%</span>
    </div>`).join('');
  setTimeout(() => {
    document.querySelectorAll('.ch-bar-fill[data-w]').forEach(b => { b.style.width = b.dataset.w + '%'; });
  }, 150);

  // Loan request box
  const calc = Utils.calcEMI(app.requestedAmount, app.requestedRate, app.tenure);
  document.getElementById('loanRequestBox').innerHTML = `
    <div class="lrb-amount">${Utils.fmt(app.requestedAmount)}</div>
    <div class="lrb-label">Requested Loan Amount</div>
    <div class="lrb-grid">
      <div><div class="lrb-item-k">Requested Rate</div><div class="lrb-item-v">${app.requestedRate}% p.a.</div></div>
      <div><div class="lrb-item-k">Tenure</div><div class="lrb-item-v">${app.tenure} months</div></div>
      <div><div class="lrb-item-k">Indicative EMI</div><div class="lrb-item-v">${Utils.fmt(calc.emi)}/mo</div></div>
      <div><div class="lrb-item-k">Total Payable</div><div class="lrb-item-v">${Utils.fmt(calc.total)}</div></div>
      <div><div class="lrb-item-k">Purpose</div><div class="lrb-item-v">${app.loanType}</div></div>
      <div><div class="lrb-item-k">Applied On</div><div class="lrb-item-v">${app.appliedOn}</div></div>
    </div>`;

  // Pre-fill sanction form
  document.getElementById('sfRequestedAmt').textContent = Utils.fmt(app.requestedAmount);
  document.getElementById('sfAmount').value = app.requestedAmount;
  document.getElementById('sfRate').value   = app.requestedRate;
  const sel = document.getElementById('sfTenure');
  const opt = [...sel.options].find(o => o.value == app.tenure);
  if (opt) opt.selected = true;
  updateEMIPreview();

  // Documents checklist
  document.getElementById('docChecklist').innerHTML = app.documents.map((d, i) => `
    <div class="dc-item${d.received ? ' received' : ''}" data-idx="${i}" onclick="toggleDoc(${i})">
      <div class="dc-checkbox">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span class="dc-item-label">${d.label}</span>
      <span class="dc-item-tag">${d.received ? '✓ Received' : 'Pending'} · ${d.tag}</span>
    </div>`).join('');

  // Audit trail
  renderAudit(app.audit);

  // Reset sanction section
  document.getElementById('sanctionForm').style.display = '';
  document.getElementById('decidedState').style.display = 'none';
}

function renderAudit(trail) {
  document.getElementById('auditTimeline').innerHTML = [...trail].reverse().map(e => `
    <div class="at-item">
      <div class="at-dot ${e.color}"></div>
      <div class="at-content">
        <div class="at-action">${e.action}</div>
        <div class="at-detail">${e.detail}</div>
      </div>
      <div class="at-meta">${e.time}</div>
    </div>`).join('');
}

function priorityColor(p) {
  return p === 'high' ? 'var(--red)' : p === 'medium' ? 'var(--accent)' : 'var(--green)';
}

/* ══════════════════════════════════════════
   TOGGLE DOCUMENT RECEIVED
══════════════════════════════════════════ */
function toggleDoc(idx) {
  if (!State.selectedApp) return;
  State.selectedApp.documents[idx].received = !State.selectedApp.documents[idx].received;
  // re-render only checklist
  const app = State.selectedApp;
  document.getElementById('docChecklist').innerHTML = app.documents.map((d, i) => `
    <div class="dc-item${d.received ? ' received' : ''}" data-idx="${i}" onclick="toggleDoc(${i})">
      <div class="dc-checkbox">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span class="dc-item-label">${d.label}</span>
      <span class="dc-item-tag">${d.received ? '✓ Received' : 'Pending'} · ${d.tag}</span>
    </div>`).join('');
}

/* ══════════════════════════════════════════
   LIVE EMI PREVIEW
══════════════════════════════════════════ */
function updateEMIPreview() {
  const amount  = parseFloat(document.getElementById('sfAmount').value)  || 0;
  const rate    = parseFloat(document.getElementById('sfRate').value)    || 0;
  const tenure  = parseInt(document.getElementById('sfTenure').value)    || 0;
  const feePct  = parseFloat(document.getElementById('sfFee').value)     || 0;

  const { emi, totalInterest, total } = Utils.calcEMI(amount, rate, tenure);
  const fee = Math.round(amount * feePct / 100);

  document.getElementById('epEMI').textContent      = emi      ? Utils.fmt(emi)          : '—';
  document.getElementById('epInterest').textContent = totalInterest ? Utils.fmt(totalInterest) : '—';
  document.getElementById('epTotal').textContent    = total    ? Utils.fmt(total)         : '—';
  document.getElementById('epFee').textContent      = fee      ? Utils.fmt(fee)           : '—';
}

/* ══════════════════════════════════════════
   DECISION FLOW
══════════════════════════════════════════ */
function handleDecision(type) {
  if (!State.selectedApp) return;

  const amount  = parseFloat(document.getElementById('sfAmount').value);
  const rate    = parseFloat(document.getElementById('sfRate').value);
  const tenure  = parseInt(document.getElementById('sfTenure').value);
  const fee     = parseFloat(document.getElementById('sfFee').value);
  const remarks = document.getElementById('sfRemarks').value.trim();

  // Validation
  if (type === 'approved') {
    if (!amount || amount <= 0) { showToast('Enter a valid sanctioned amount', 'error'); return; }
    if (!rate   || rate <= 0)   { showToast('Enter a valid interest rate', 'error'); return; }
    if (amount > CONFIG.OFFICER.maxSanctionLimit) {
      showToast(`Exceeds your sanction limit of ${Utils.fmt(CONFIG.OFFICER.maxSanctionLimit)}`, 'error'); return;
    }
  }

  State.pendingDecision = { type, amount, rate, tenure, fee, remarks, note: document.getElementById('sfNote').value };

  // Open confirm modal
  const configs = {
    approved: {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
      iconBg: 'var(--green-dim)',
      title:  'Confirm Sanction & Approval',
      body:   `You are about to sanction <strong>${Utils.fmt(amount)}</strong> to <strong>${State.selectedApp.applicantName}</strong> at <strong>${rate}%</strong> for <strong>${tenure} months</strong>.<br/><br/>This action will notify the applicant and trigger disbursement.`,
      btnCls: 'approve', btnLabel: 'Confirm Approval',
    },
    review: {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      iconBg: 'var(--blue-dim)',
      title:  'Send for Further Review',
      body:   `Application <strong>${State.selectedApp.id}</strong> will be escalated to the L3 review queue.<br/><br/>${remarks ? `Remarks: "${remarks}"` : 'Add remarks to help the reviewer.'}`,
      btnCls: 'review-btn', btnLabel: 'Send to Review',
    },
    rejected: {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      iconBg: 'var(--red-dim)',
      title:  'Confirm Rejection',
      body:   `Application <strong>${State.selectedApp.id}</strong> from <strong>${State.selectedApp.applicantName}</strong> will be rejected.<br/><br/>${remarks ? `Reason: "${remarks}"` : 'Please add a rejection reason in the Remarks field.'}`,
      btnCls: 'reject', btnLabel: 'Confirm Rejection',
    },
  };

  const c = configs[type];
  document.getElementById('modalIcon').innerHTML    = c.icon;
  document.getElementById('modalIcon').style.background = c.iconBg;
  document.getElementById('modalTitle').innerHTML   = c.title;
  document.getElementById('modalBody').innerHTML    = c.body;
  const confirmBtn = document.getElementById('modalConfirmBtn');
  confirmBtn.className = `action-btn ${c.btnCls}`;
  confirmBtn.textContent = c.btnLabel;

  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  State.pendingDecision = null;
}

async function confirmDecision() {
  closeModal();
  if (!State.pendingDecision || !State.selectedApp) return;

  const { type } = State.pendingDecision;
  const app = State.selectedApp;

  // Show loading state
  ['btnApprove', 'btnReview', 'btnReject'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
  });

  try {
    const result = await SanctionService.submitDecision(app, type, State.pendingDecision);

    if (result.success) {
      // Update app status in state
      app.status = type === 'review' ? 'review' : type;

      // Add audit entry
      const auditMap = {
        approved: { action: `Sanctioned & Approved by ${CONFIG.OFFICER.name}`, detail: `Amount: ${Utils.fmt(State.pendingDecision.amount)} · ${State.pendingDecision.rate}% · ${State.pendingDecision.tenure}mo · Ref: ${result.ref}`, color: 'green' },
        review:   { action: `Escalated for Review by ${CONFIG.OFFICER.name}`,  detail: State.pendingDecision.remarks || 'No remarks', color: 'blue' },
        rejected: { action: `Rejected by ${CONFIG.OFFICER.name}`,              detail: State.pendingDecision.remarks || 'No remarks', color: 'red' },
      };
      app.audit.push({ ...auditMap[type], time: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) });

      // Update decided state UI
      const decidedConfigs = {
        approved: {
          iconHtml: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
          iconBg: 'var(--green-dim)', title: 'Loan Sanctioned & Approved',
          body: `${Utils.fmt(State.pendingDecision.amount)} approved for ${app.applicantName} at ${State.pendingDecision.rate}% p.a. for ${State.pendingDecision.tenure} months.<br/>Reference: <strong>${result.ref}</strong>`,
        },
        review: {
          iconHtml: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
          iconBg: 'var(--blue-dim)', title: 'Sent for L3 Review',
          body: `Application ${app.id} has been escalated to the senior review queue.`,
        },
        rejected: {
          iconHtml: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
          iconBg: 'var(--red-dim)', title: 'Application Rejected',
          body: `Application ${app.id} has been rejected. Notification sent to applicant.`,
        },
      };

      const dc = decidedConfigs[type];
      const dsIcon  = document.getElementById('dsIcon');
      dsIcon.innerHTML = dc.iconHtml;
      dsIcon.style.background = dc.iconBg;
      document.getElementById('dsTitle').textContent = dc.title;
      document.getElementById('dsBody').innerHTML    = dc.body;

      document.getElementById('sanctionForm').style.display  = 'none';
      document.getElementById('decidedState').style.display  = '';

      // Update audit + header badge
      renderAudit(app.audit);
      document.getElementById('adStatusBadge').innerHTML = Utils.statusBadge(app.status);

      // Update queue
      DataRepository.updateApp(app);
      renderQueue(State.apps);
      updateCommandBarStats(State.apps);

      const toastMap = { approved: 'success', review: 'info', rejected: 'error' };
      const msgMap   = { approved: `✓ Loan sanctioned — ${result.ref}`, review: 'Application sent for review', rejected: 'Application rejected' };
      showToast(msgMap[type], toastMap[type]);
    }
  } catch (err) {
    showToast('Server error. Try again.', 'error');
  } finally {
    ['btnApprove', 'btnReview', 'btnReject'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) { btn.disabled = false; btn.style.opacity = ''; }
    });
  }
}

function undoDecision() {
  if (!State.selectedApp) return;
  // Reset status to pending for undo (in production this would call a PATCH endpoint)
  State.selectedApp.status = 'pending';
  State.selectedApp.audit.pop();
  document.getElementById('sanctionForm').style.display  = '';
  document.getElementById('decidedState').style.display  = 'none';
  document.getElementById('adStatusBadge').innerHTML = Utils.statusBadge('pending');
  renderAudit(State.selectedApp.audit);
  renderQueue(State.apps);
  updateCommandBarStats(State.apps);
  showToast('Decision undone', 'info');
}

/* ══════════════════════════════════════════
   QUEUE FILTER & SEARCH
══════════════════════════════════════════ */
function initQueueControls() {
  document.getElementById('queueFilters').addEventListener('click', e => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    State.filter = pill.dataset.filter;
    renderQueue(State.apps);
  });

  document.getElementById('queueSearch').addEventListener('input', () => renderQueue(State.apps));
}

/* ══════════════════════════════════════════
   LIVE EMI PREVIEW — wire inputs
══════════════════════════════════════════ */
function initEMIPreview() {
  ['sfAmount', 'sfRate', 'sfTenure', 'sfFee'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateEMIPreview);
  });
}

/* ══════════════════════════════════════════
   BOOTSTRAP
══════════════════════════════════════════ */
const BankApp = {
  async init() {
    initTheme();
    initClock();
    initQueueControls();
    initEMIPreview();

    State.apps = await DataRepository.get('getApplications');
    updateCommandBarStats(State.apps);
    renderQueue(State.apps);

    // Auto-select first application
    if (State.apps.length > 0) selectApplication(State.apps[0]);
  },
};

document.addEventListener('DOMContentLoaded', () => BankApp.init());