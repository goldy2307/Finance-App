/* ═══════════════════════════════════════════════════════
   CASHLY — apply.js
   1. Theme toggle  (re-used from main.js pattern)
   2. Nav scroll + hamburger
   3. Loan type selector
   4. Step navigation + progress bar
   5. Live EMI preview
   6. Aside summary updater
   7. File upload handlers
   8. Per-step validation
   9. Form submission + success screen
═══════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   1. THEME
───────────────────────────────────────── */
const THEME_KEY = 'cashly-theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}
function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
  document.querySelectorAll('#themeToggle, #themeToggleMobile')
    .forEach(btn => btn.addEventListener('click', toggleTheme));
}

/* ─────────────────────────────────────────
   2. NAV
───────────────────────────────────────── */
function initNav() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const drawer    = document.getElementById('mobileDrawer');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      drawer.classList.toggle('open');
    });
    drawer.querySelectorAll('.drawer-link').forEach(l => {
      l.addEventListener('click', () => {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
      });
    });
  }
}

/* ─────────────────────────────────────────
   3. LOAN TYPES DATA + SELECTOR
───────────────────────────────────────── */
const LOAN_TYPES = [
  {
    id:    'personal',
    label: 'Personal',
    rate:  '10.5%',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
             <circle cx="12" cy="7" r="4"/>
           </svg>`,
  },
  {
    id:    'business',
    label: 'Business',
    rate:  '12%',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <rect x="2" y="7" width="20" height="14" rx="2"/>
             <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
           </svg>`,
  },
  {
    id:    'home',
    label: 'Home',
    rate:  '8.75%',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
             <polyline points="9 22 9 12 15 12 15 22"/>
           </svg>`,
  },
  {
    id:    'education',
    label: 'Education',
    rate:  '9.25%',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
             <path d="M6 12v5c3 3 9 3 12 0v-5"/>
           </svg>`,
  },
];

// Rate map for EMI calc
const RATE_MAP = { personal: 10.5, business: 12, home: 8.75, education: 9.25 };

// Application state
const state = {
  currentStep:  1,
  totalSteps:   4,
  selectedLoan: null,
  uploadedDocs: {},
};

function buildLoanTypes() {
  const grid = document.getElementById('loanTypeGrid');
  if (!grid) return;
  grid.innerHTML = LOAN_TYPES.map(lt => `
    <div class="loan-type-card" data-loan="${lt.id}" role="button" tabindex="0">
      <div class="ltc-icon">${lt.icon}</div>
      <div class="ltc-label">${lt.label}</div>
      <div class="ltc-rate">${lt.rate} p.a.</div>
    </div>
  `).join('');

  grid.querySelectorAll('.loan-type-card').forEach(card => {
    card.addEventListener('click', () => selectLoanType(card.dataset.loan));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') selectLoanType(card.dataset.loan);
    });
  });
}

function selectLoanType(id) {
  state.selectedLoan = id;
  document.querySelectorAll('.loan-type-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.loan === id);
  });
  recalcEMI();
  updateAsideSummary();
}

/* ─────────────────────────────────────────
   4. PROGRESS BAR + STEP NAVIGATION
───────────────────────────────────────── */
const STEP_LABELS = ['Loan details', 'Personal info', 'Employment', 'Documents'];

function buildProgressSteps() {
  const wrap = document.getElementById('progressSteps');
  if (!wrap) return;
  wrap.innerHTML = STEP_LABELS.map((label, i) => `
    <div class="progress-step ${i === 0 ? 'active' : ''}" data-step="${i + 1}">
      <div class="ps-circle">${i + 1}</div>
      <span class="ps-label">${label}</span>
    </div>
  `).join('');
}

function updateProgress(step) {
  const steps = document.querySelectorAll('.progress-step');
  steps.forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i + 1 < step)  s.classList.add('done');
    if (i + 1 === step) s.classList.add('active');
  });

  // fill bar: step 1 = 0%, step 4 = 100%
  const pct = ((step - 1) / (state.totalSteps - 1)) * 100;
  const fill = document.getElementById('progressFill');
  if (fill) fill.style.width = pct + '%';
}

function goToStep(n) {
  // hide current
  const cur = document.getElementById(`step-${state.currentStep}`);
  if (cur) cur.classList.remove('active');

  state.currentStep = n;

  const next = document.getElementById(`step-${n}`);
  if (next) next.classList.add('active');

  updateProgress(n);

  // scroll form panel back to top
  const formWrap = document.querySelector('.apply-form-wrap');
  if (formWrap) formWrap.scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initStepNavigation() {
  // Next buttons
  document.querySelectorAll('.step-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = parseInt(btn.dataset.next, 10);
      if (validateStep(state.currentStep)) goToStep(next);
    });
  });

  // Back buttons
  document.querySelectorAll('.step-back').forEach(btn => {
    btn.addEventListener('click', () => {
      goToStep(parseInt(btn.dataset.back, 10));
    });
  });

  // Submit button
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleSubmit);
  }
}

/* ─────────────────────────────────────────
   5. LIVE EMI PREVIEW
───────────────────────────────────────── */
function calcEMI(principal, annualRate, months) {
  if (!principal || !months || annualRate === 0) return 0;
  const r = annualRate / 12 / 100;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function formatINR(n) {
  if (!n || isNaN(n)) return '—';
  return '₹ ' + Math.round(n).toLocaleString('en-IN');
}

function recalcEMI() {
  const amountEl = document.getElementById('loanAmountInp');
  const tenureEl = document.getElementById('tenureInp');
  const previewEl = document.getElementById('emiPreviewVal');
  if (!amountEl || !tenureEl || !previewEl) return;

  const principal = parseFloat(amountEl.value) || 0;
  const months    = parseInt(tenureEl.value, 10)  || 0;
  const rate      = RATE_MAP[state.selectedLoan]  || 10.5;

  const emi = calcEMI(principal, rate, months);
  previewEl.textContent = emi > 0 ? formatINR(emi) : '—';

  updateAsideSummary();
}

function initEMIPreview() {
  ['loanAmountInp', 'tenureInp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', recalcEMI);
  });
}

/* ─────────────────────────────────────────
   6. ASIDE SUMMARY
───────────────────────────────────────── */
function updateAsideSummary() {
  const amountEl = document.getElementById('loanAmountInp');
  const tenureEl = document.getElementById('tenureInp');

  const amount  = parseFloat(amountEl?.value) || 0;
  const months  = parseInt(tenureEl?.value, 10) || 0;
  const loanId  = state.selectedLoan;
  const rate    = RATE_MAP[loanId] || 10.5;
  const emi     = calcEMI(amount, rate, months);

  const loanLabel = loanId
    ? LOAN_TYPES.find(l => l.id === loanId)?.label + ' Loan'
    : '—';

  const amountEl2 = document.getElementById('summaryAmount');
  if (amountEl2) amountEl2.textContent = amount > 0 ? formatINR(amount) : '₹ —';

  const typeEl = document.getElementById('summaryType');
  if (typeEl) typeEl.textContent = loanLabel;

  const tenureDisplay = months > 0 ? months + ' months' : '—';
  const tenureEl2 = document.getElementById('summaryTenure');
  if (tenureEl2) tenureEl2.textContent = tenureDisplay;

  const emiEl = document.getElementById('summaryEMI');
  if (emiEl) emiEl.textContent = emi > 0 ? formatINR(emi) + '/mo' : '—';
}

/* ─────────────────────────────────────────
   7. FILE UPLOADS
───────────────────────────────────────── */
function initUploads() {
  document.querySelectorAll('.upload-input').forEach(input => {
    input.addEventListener('change', e => {
      const file    = e.target.files[0];
      const docKey  = input.dataset.doc;
      const card    = input.closest('.upload-card');
      if (!file || !card) return;

      state.uploadedDocs[docKey] = file;

      // show filename and mark card as done
      card.classList.add('success');
      let fnEl = card.querySelector('.upload-filename');
      if (!fnEl) {
        fnEl = document.createElement('div');
        fnEl.className = 'upload-filename';
        card.querySelector('.upload-info').appendChild(fnEl);
      }
      fnEl.textContent = file.name;

      // swap button text
      const btn = card.querySelector('.upload-btn');
      if (btn) {
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><polyline points="20 6 9 17 4 12"/></svg>
          Uploaded
        `;
      }
    });
  });
}

/* ─────────────────────────────────────────
   8. VALIDATION
───────────────────────────────────────── */
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(e => e.remove());
  document.querySelectorAll('.error').forEach(e => e.classList.remove('error'));
}

function showError(el, msg) {
  el.classList.add('error');
  const err = document.createElement('div');
  err.className = 'field-error';
  err.textContent = msg;
  el.closest('.form-group')?.appendChild(err);
}

function validateStep(step) {
  clearErrors();
  let valid = true;

  if (step === 1) {
    if (!state.selectedLoan) {
      const grid = document.getElementById('loanTypeGrid');
      if (grid) {
        const note = document.createElement('div');
        note.className = 'field-error';
        note.style.marginBottom = '8px';
        note.textContent = 'Please select a loan type.';
        grid.insertAdjacentElement('beforebegin', note);
      }
      valid = false;
    }
    const amt = document.getElementById('loanAmountInp');
    if (!amt.value || parseFloat(amt.value) < 10000) {
      showError(amt, 'Enter a valid loan amount (min ₹10,000).');
      valid = false;
    }
    const ten = document.getElementById('tenureInp');
    if (!ten.value) {
      showError(ten, 'Please select a tenure.');
      valid = false;
    }
    const purpose = document.getElementById('loanPurpose');
    if (!purpose.value) {
      showError(purpose, 'Please select a purpose.');
      valid = false;
    }
  }

  if (step === 2) {
    const fields = [
      { id: 'firstName', msg: 'Enter your first name.' },
      { id: 'lastName',  msg: 'Enter your last name.'  },
      { id: 'dob',       msg: 'Enter your date of birth.' },
      { id: 'gender',    msg: 'Select your gender.' },
      { id: 'phone',     msg: 'Enter a valid 10-digit mobile number.', pattern: /^\d{10}$/ },
      { id: 'email',     msg: 'Enter a valid email address.', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      { id: 'pan',       msg: 'Enter a valid PAN number.', pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/ },
      { id: 'pincode',   msg: 'Enter a valid 6-digit pincode.', pattern: /^\d{6}$/ },
    ];
    fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el) return;
      const val = el.value.trim().toUpperCase();
      if (!el.value.trim()) {
        showError(el, f.msg); valid = false;
      } else if (f.pattern && !f.pattern.test(f.id === 'phone' || f.id === 'pincode' ? el.value.trim() : val)) {
        showError(el, f.msg); valid = false;
      }
    });
  }

  if (step === 3) {
    const empType = document.querySelector('input[name="empType"]:checked');
    if (!empType) {
      const group = document.getElementById('empTypeGroup');
      if (group) {
        const note = document.createElement('div');
        note.className = 'field-error';
        note.style.marginBottom = '8px';
        note.textContent = 'Please select your employment type.';
        group.insertAdjacentElement('beforebegin', note);
      }
      valid = false;
    }
    const income = document.getElementById('monthlyIncome');
    if (!income.value || parseFloat(income.value) < 5000) {
      showError(income, 'Enter your monthly income (min ₹5,000).');
      valid = false;
    }
    const employer = document.getElementById('employer');
    if (!employer.value.trim()) {
      showError(employer, 'Enter your employer / company name.');
      valid = false;
    }
    const bank = document.getElementById('bankName');
    if (!bank.value) {
      showError(bank, 'Please select your bank.');
      valid = false;
    }
  }

  if (step === 4) {
    const consentTerms = document.getElementById('consentTerms');
    const consentBureau = document.getElementById('consentBureau');
    if (!consentTerms.checked || !consentBureau.checked) {
      const block = document.querySelector('.consent-block');
      if (block) {
        const note = document.createElement('div');
        note.className = 'field-error';
        note.style.marginTop = '8px';
        note.textContent = 'Please agree to the required terms to proceed.';
        block.appendChild(note);
      }
      valid = false;
    }
  }

  // scroll to first error
  if (!valid) {
    const firstErr = document.querySelector('.error, .field-error');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return valid;
}

/* ─────────────────────────────────────────
   9. SUBMISSION
───────────────────────────────────────── */
function generateAppId() {
  return 'CLY-' + Date.now().toString(36).toUpperCase().slice(-6);
}

function handleSubmit() {
  if (!validateStep(4)) return;

  const btn = document.getElementById('submitBtn');
  if (btn) {
    btn.textContent = 'Submitting…';
    btn.disabled = true;
  }

  // Simulate API call
  setTimeout(() => {
    const appId = generateAppId();
    const appIdEl = document.getElementById('appId');
    if (appIdEl) appIdEl.textContent = appId;

    goToStep(5);

    // hide progress bar on success screen
    const progressWrap = document.querySelector('.progress-bar-wrap');
    if (progressWrap) progressWrap.style.display = 'none';
  }, 1400);
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  buildLoanTypes();
  buildProgressSteps();
  updateProgress(1);
  initStepNavigation();
  initEMIPreview();
  initUploads();
});