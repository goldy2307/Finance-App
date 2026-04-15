/* ═══════════════════════════════════════════════════════
   CASHLY — main.js
   1. Theme toggle (dark / light) — persists via localStorage
   2. Dynamic content injection
   3. EMI Calculator
   4. Scroll reveal (IntersectionObserver)
   5. Navbar scroll + active link
   6. Mobile drawer + hamburger
   7. Smooth anchor scrolling (offset for fixed nav)
═══════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   1. THEME TOGGLE
───────────────────────────────────────── */
const THEME_KEY = 'cashly-theme';

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  // Apply stored / default theme before paint
  applyTheme(getStoredTheme());

  // Wire up both toggle buttons (desktop + mobile)
  document.querySelectorAll('#themeToggle, #themeToggleMobile').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
}

/* ─────────────────────────────────────────
   2. DATA
───────────────────────────────────────── */
const PRODUCTS = [
  {
    title: 'Personal Loan',
    rate:  '10.5% p.a.',
    desc:  'Instant funds for medical, travel, wedding, or any personal need. No collateral. Paperless.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
             <circle cx="12" cy="7" r="4"/>
           </svg>`,
  },
  {
    title: 'Business Loan',
    rate:  '12% p.a.',
    desc:  'Scale operations, buy inventory, or expand to new markets — up to ₹50 lakhs.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <rect x="2" y="7" width="20" height="14" rx="2"/>
             <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
           </svg>`,
  },
  {
    title: 'Home Loan',
    rate:  '8.75% p.a.',
    desc:  'Buy, build, or renovate your home with long tenure, low EMI and flexible repayment.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
             <polyline points="9 22 9 12 15 12 15 22"/>
           </svg>`,
  },
  {
    title: 'Education Loan',
    rate:  '9.25% p.a.',
    desc:  'Fund your dream degree in India or abroad. Covers tuition, living costs, and more.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
             <path d="M6 12v5c3 3 9 3 12 0v-5"/>
           </svg>`,
  },
];

const STEPS = [
  {
    num:   '01',
    title: 'Check eligibility',
    desc:  'Fill a 2-minute form. No documents needed at this stage. No credit score impact.',
  },
  {
    num:   '02',
    title: 'Choose your offer',
    desc:  'See personalised loan offers with exact interest rates, EMI, and tenure options.',
  },
  {
    num:   '03',
    title: 'Upload documents',
    desc:  'PAN, Aadhaar, bank statement. All online in under 5 minutes.',
  },
  {
    num:   '04',
    title: 'Money in account',
    desc:  'Approval in as little as 4 hours. Funds transferred directly to your bank.',
  },
];

const FEATURES = [
  {
    title: 'No hidden charges',
    desc:  'Processing fee, interest rate, and all costs are shown upfront before you sign anything.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <rect x="3" y="11" width="18" height="11" rx="2"/>
             <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
           </svg>`,
  },
  {
    title: '100% online process',
    desc:  'From application to disbursal — no branch visits, no physical paperwork, ever.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <rect x="2" y="3" width="20" height="14" rx="2"/>
             <line x1="8" y1="21" x2="16" y2="21"/>
             <line x1="12" y1="17" x2="12" y2="21"/>
           </svg>`,
  },
  {
    title: 'Flexible repayment',
    desc:  'Part-prepay anytime, switch EMI dates, or foreclose with minimal charges.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <polyline points="23 4 23 10 17 10"/>
             <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
           </svg>`,
  },
  {
    title: 'RBI regulated NBFC',
    desc:  'Cashly is a registered Non-Banking Financial Company governed by RBI guidelines.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
           </svg>`,
  },
  {
    title: 'Real-time tracking',
    desc:  'Track your application, EMI schedule, and outstanding balance from your dashboard.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
           </svg>`,
  },
  {
    title: '24/7 support',
    desc:  'Reach us via chat, call, or email. Real humans who understand lending, not bots.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
           </svg>`,
  },
];

const DISBURSALS = [
  { name: 'Rahul M.',  type: 'personal',  badge: 'badge-personal',  location: 'Mumbai, MH',    amount: '₹3,50,000' },
  { name: 'Priya S.',  type: 'business',  badge: 'badge-business',  location: 'Bengaluru, KA', amount: '₹12,00,000' },
  { name: 'Arjun T.',  type: 'home',      badge: 'badge-home',      location: 'Pune, MH',      amount: '₹28,00,000' },
  { name: 'Sneha K.',  type: 'personal',  badge: 'badge-personal',  location: 'Hyderabad, TS', amount: '₹1,80,000' },
  { name: 'Dev R.',    type: 'education', badge: 'badge-education', location: 'Delhi, DL',     amount: '₹6,25,000' },
];

/* ─────────────────────────────────────────
   3. INJECT DYNAMIC CONTENT
───────────────────────────────────────── */
function buildProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = PRODUCTS.map(p => `
    <div class="product-card">
      <div class="pc-icon">${p.icon}</div>
      <div class="pc-title">${p.title}</div>
      <div class="pc-rate num">${p.rate}</div>
      <div class="pc-desc">${p.desc}</div>
    </div>
  `).join('');
}

function buildSteps() {
  const row = document.getElementById('stepsRow');
  if (!row) return;
  row.innerHTML = STEPS.map(s => `
    <div class="step">
      <div class="step-num num">${s.num}</div>
      <div class="step-body">
        <div class="step-title">${s.title}</div>
        <div class="step-desc">${s.desc}</div>
      </div>
    </div>
  `).join('');
}

function buildFeatures() {
  const grid = document.getElementById('featuresGrid');
  if (!grid) return;
  grid.innerHTML = FEATURES.map(f => `
    <div class="feat-card">
      <div class="feat-icon">${f.icon}</div>
      <div class="feat-title">${f.title}</div>
      <div class="feat-desc">${f.desc}</div>
    </div>
  `).join('');
}

function buildDisbursals() {
  const body = document.getElementById('txnBody');
  if (!body) return;
  body.innerHTML = DISBURSALS.map(d => `
    <div class="txn-row">
      <span class="txn-name">${d.name}</span>
      <span class="txn-badge ${d.badge}">${capitalise(d.type)} Loan</span>
      <span class="hide-mobile" style="color:var(--text-3);font-size:13px">${d.location}</span>
      <span class="txn-amount num">${d.amount}</span>
    </div>
  `).join('');
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ─────────────────────────────────────────
   4. EMI CALCULATOR
───────────────────────────────────────── */
function calcEMI(principal, annualRate, months) {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 12 / 100;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function formatINR(amount) {
  return '₹ ' + Math.round(amount).toLocaleString('en-IN');
}

function formatINRLabel(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function updateCalc() {
  const principal = parseFloat(document.getElementById('loanAmount').value);
  const rate      = parseFloat(document.getElementById('interestRate').value);
  const months    = parseInt(document.getElementById('tenure').value, 10);

  document.getElementById('loanAmountVal').textContent   = formatINRLabel(principal);
  document.getElementById('interestRateVal').textContent = rate.toFixed(1) + '%';
  document.getElementById('tenureVal').textContent       = months + ' months';

  const emi           = calcEMI(principal, rate, months);
  const totalPayable  = emi * months;
  const totalInterest = totalPayable - principal;

  document.getElementById('emiResult').textContent     = formatINR(emi);
  document.getElementById('totalInterest').textContent = formatINR(totalInterest);
  document.getElementById('totalPayable').textContent  = formatINR(totalPayable);

  // Update range track fill (visual progress)
  updateRangeTrack(document.getElementById('loanAmount'));
  updateRangeTrack(document.getElementById('interestRate'));
  updateRangeTrack(document.getElementById('tenure'));
}

function updateRangeTrack(input) {
  const min = parseFloat(input.min);
  const max = parseFloat(input.max);
  const val = parseFloat(input.value);
  const pct = ((val - min) / (max - min)) * 100;
  input.style.background = `linear-gradient(to right, var(--green) ${pct}%, var(--bg-5) ${pct}%)`;
}

function initCalc() {
  ['loanAmount', 'interestRate', 'tenure'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', updateCalc);
  });
  updateCalc(); // initial render
}

/* ─────────────────────────────────────────
   5. SCROLL REVEAL
───────────────────────────────────────── */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      // stagger siblings
      const siblings = [...entry.target.parentElement
        .querySelectorAll('.reveal:not(.visible)')];
      const idx = siblings.indexOf(entry.target);
      setTimeout(() => entry.target.classList.add('visible'), idx * 80);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => io.observe(el));
}

/* ─────────────────────────────────────────
   6. NAVBAR
───────────────────────────────────────── */
function initNav() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const drawer    = document.getElementById('mobileDrawer');

  // scroll class
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // hamburger
  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      drawer.classList.toggle('open');
    });
    drawer.querySelectorAll('.drawer-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
      });
    });
  }

  // active nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 100) current = sec.id;
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }, { passive: true });
}

/* ─────────────────────────────────────────
   7. SMOOTH SCROLL (offset for fixed nav)
───────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href   = anchor.getAttribute('href');
      const target = document.querySelector(href);
      if (!target || href === '#') return;
      e.preventDefault();
      const navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
      ) || 68;
      window.scrollTo({ top: target.offsetTop - navH, behavior: 'smooth' });
    });
  });
}

/* ─────────────────────────────────────────
   8. AUTH NAV — show avatar when logged in
───────────────────────────────────────── */
const AUTH_KEY = 'kashly_user';

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
  catch { return null; }
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function initAuthNav() {
  const user      = getStoredUser();
  const navSignIn = document.getElementById('navSignIn');
  const navUser   = document.getElementById('navUser');
  const avatarBtn = document.getElementById('navAvatarBtn');
  const dropdown  = document.getElementById('navDropdown');
  const logoutBtn = document.getElementById('navLogoutBtn');
  const resetBtn  = document.getElementById('navResetPasswordBtn');

  if (!navSignIn || !navUser) return;

  if (user) {
    navSignIn.style.display  = 'none';
    navUser.style.display    = 'flex';
    navUser.style.alignItems = 'center';

    document.getElementById('navAvatarInitials').textContent = getInitials(user.name || 'U');
    document.getElementById('navDdName').textContent         = user.name  || 'User';
    document.getElementById('navDdEmail').textContent        = user.email || '';
  }

  avatarBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!navUser.contains(e.target)) dropdown.classList.remove('open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dropdown.classList.remove('open');
  });

  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('kashly_token');
    localStorage.removeItem('kashly_refresh_token');
    window.location.href = 'index.html';
  });

  // 👇 New: redirect to reset password page (adjust URL as needed)
  resetBtn?.addEventListener('click', () => {
    dropdown.classList.remove('open');
    window.location.href = 'reset-password.html';
  });
}

/* ─────────────────────────────────────────
   INIT — DOMContentLoaded
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();        // must be first — sets data-theme before any paint
  buildProducts();
  buildSteps();
  buildFeatures();
  buildDisbursals();
  initCalc();
  initReveal();
  initNav();
  initSmoothScroll();
  initAuthNav();
});