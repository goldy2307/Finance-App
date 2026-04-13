/* ═══════════════════════════════════════════════════════
   CASHLY — contact.js
   1. Theme toggle
   2. Nav scroll + hamburger
   3. Channel cards injection
   4. Topic tabs
   5. Contact form — validation + submission
   6. File attachment
   7. FAQ accordion
   8. Office + hours + social injection
   9. Scroll reveal
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
   3. DATA — CHANNELS
───────────────────────────────────────── */
const CHANNELS = [
  {
    title: 'Live chat',
    value: 'Start a chat',
    desc:  'Talk to a support agent instantly. Available around the clock.',
    badge: 'Under 2 min',
    href:  '#chat',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
           </svg>`,
  },
  {
    title: 'Phone support',
    value: '1800-123-4567',
    desc:  'Toll-free. Speak to a loan advisor Monday–Sunday.',
    badge: 'Under 5 min',
    href:  'tel:18001234567',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12a19.79 19.79 0 0 1-3.07-8.67 2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
           </svg>`,
  },
  {
    title: 'Email us',
    value: 'support@cashly.in',
    desc:  'Write to us for detailed queries. We reply within 4 hours.',
    badge: 'Within 4 hrs',
    href:  'mailto:support@cashly.in',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
             <polyline points="22,6 12,13 2,6"/>
           </svg>`,
  },
  {
    title: 'WhatsApp',
    value: '+91 98200 00000',
    desc:  'Message us on WhatsApp for quick loan status updates.',
    badge: 'Instant',
    href:  'https://wa.me/919820000000',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
           </svg>`,
  },
];

function buildChannels() {
  const grid = document.getElementById('channelsGrid');
  if (!grid) return;
  grid.innerHTML = CHANNELS.map(ch => `
    <a class="channel-card reveal" href="${ch.href}">
      <div class="ch-icon">${ch.icon}</div>
      <div class="ch-body">
        <div class="ch-title">${ch.title}</div>
        <div class="ch-value num">${ch.value}</div>
        <div class="ch-desc">${ch.desc}</div>
      </div>
      <div class="ch-badge"><span class="rp-dot"></span>${ch.badge}</div>
    </a>
  `).join('');
}

/* ─────────────────────────────────────────
   4. TOPIC TABS
───────────────────────────────────────── */
const TOPICS = [
  'Loan application',
  'EMI & repayment',
  'Account issue',
  'Document upload',
  'Foreclosure',
  'Other',
];

function buildTopicTabs() {
  const wrap = document.getElementById('topicTabs');
  if (!wrap) return;
  wrap.innerHTML = TOPICS.map((t, i) => `
    <button class="topic-tab${i === 0 ? ' active' : ''}" data-topic="${t}">${t}</button>
  `).join('');

  wrap.querySelectorAll('.topic-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      wrap.querySelectorAll('.topic-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // auto-fill subject field
      const subjectEl = document.getElementById('cfSubject');
      if (subjectEl && !subjectEl.dataset.manual) {
        subjectEl.value = tab.dataset.topic;
      }
    });
  });
}

// mark subject as manually edited if user types in it
document.addEventListener('DOMContentLoaded', () => {
  const subjectEl = document.getElementById('cfSubject');
  if (subjectEl) {
    subjectEl.addEventListener('input', () => {
      subjectEl.dataset.manual = 'true';
    });
  }
});

/* ─────────────────────────────────────────
   5. CONTACT FORM
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

function validateForm() {
  clearErrors();
  let valid = true;

  const name = document.getElementById('cfName');
  if (!name.value.trim()) {
    showError(name, 'Please enter your full name.');
    valid = false;
  }

  const phone = document.getElementById('cfPhone');
  if (!phone.value.trim() || !/^\d{10}$/.test(phone.value.trim())) {
    showError(phone, 'Enter a valid 10-digit mobile number.');
    valid = false;
  }

  const email = document.getElementById('cfEmail');
  if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    showError(email, 'Enter a valid email address.');
    valid = false;
  }

  const subject = document.getElementById('cfSubject');
  if (!subject.value.trim()) {
    showError(subject, 'Please add a subject.');
    valid = false;
  }

  const message = document.getElementById('cfMessage');
  if (!message.value.trim() || message.value.trim().length < 10) {
    showError(message, 'Message must be at least 10 characters.');
    valid = false;
  }

  if (!valid) {
    const first = document.querySelector('.error');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return valid;
}

function generateTicketId() {
  return 'TKT-' + Date.now().toString(36).toUpperCase().slice(-7);
}

function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const btn = document.getElementById('cfSubmitBtn');
  if (btn) {
    btn.textContent = 'Sending…';
    btn.disabled = true;
  }

  // simulate API delay
  setTimeout(() => {
    const emailVal = document.getElementById('cfEmail')?.value || 'your email';
    const ticketId = generateTicketId();

    const emailConfirm = document.getElementById('cfEmailConfirm');
    if (emailConfirm) emailConfirm.textContent = emailVal;

    const ticketEl = document.getElementById('ticketId');
    if (ticketEl) ticketEl.textContent = ticketId;

    // hide form, show success
    const form = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');
    if (form)    form.style.display = 'none';
    if (success) success.classList.add('visible');
  }, 1200);
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', handleFormSubmit);

  const sendAnotherBtn = document.getElementById('sendAnotherBtn');
  if (sendAnotherBtn) {
    sendAnotherBtn.addEventListener('click', () => {
      const form    = document.getElementById('contactForm');
      const success = document.getElementById('formSuccess');
      const btn     = document.getElementById('cfSubmitBtn');

      if (form)    { form.reset(); form.style.display = ''; }
      if (success) success.classList.remove('visible');
      if (btn)     { btn.textContent = 'Send message'; btn.disabled = false; }

      clearErrors();
    });
  }
}

/* ─────────────────────────────────────────
   6. FILE ATTACHMENT
───────────────────────────────────────── */
function initAttachment() {
  const input   = document.getElementById('cfAttachment');
  const zone    = document.getElementById('attachZone');
  const nameEl  = document.getElementById('attachFilename');
  if (!input || !zone || !nameEl) return;

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    zone.classList.add('filled');
    nameEl.textContent = file.name;
  });

  // drag & drop
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('filled'); });
  zone.addEventListener('dragleave', () => { if (!input.files[0]) zone.classList.remove('filled'); });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      nameEl.textContent = file.name;
      zone.classList.add('filled');
    }
  });
}

/* ─────────────────────────────────────────
   7. DATA + FAQ ACCORDION
───────────────────────────────────────── */
const FAQS = [
  {
    q: 'How do I check my loan application status?',
    a: 'Log in to your Cashly account and go to "My Applications". You can also call 1800-123-4567 with your application ID.',
  },
  {
    q: 'I missed an EMI. What should I do?',
    a: 'Contact us immediately. A grace period of 3 days applies. Late fees may apply after that. We can help you reschedule if needed.',
  },
  {
    q: 'How do I foreclose my loan early?',
    a: 'Log in to your dashboard and go to Loan Details → Foreclosure. A 1% foreclosure charge applies after 6 months of loan tenure.',
  },
  {
    q: 'My documents were rejected. Why?',
    a: 'Common reasons include blurry images, expired documents, or name mismatch. Re-upload clear, valid documents from your dashboard.',
  },
  {
    q: 'Can I increase my loan amount after approval?',
    a: 'Top-up loans are available after 6 EMIs of regular repayment. Eligibility is subject to credit assessment at the time of top-up.',
  },
];

function buildFAQs() {
  const list = document.getElementById('faqList');
  if (!list) return;
  list.innerHTML = FAQS.map(f => `
    <div class="faq-item">
      <div class="faq-q">
        <span>${f.q}</span>
        <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="faq-a">${f.a}</div>
    </div>
  `).join('');

  list.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      // close all
      list.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

/* ─────────────────────────────────────────
   8. DATA — OFFICES, HOURS, SOCIALS
───────────────────────────────────────── */
const OFFICES = [
  {
    city: 'Mumbai',
    hq:   true,
    addr: 'Level 14, One BKC, Bandra Kurla Complex, Mumbai — 400051',
  },
  {
    city: 'Bengaluru',
    hq:   false,
    addr: '4th Floor, Prestige Tower, MG Road, Bengaluru — 560001',
  },
  {
    city: 'Delhi NCR',
    hq:   false,
    addr: 'DLF Cyber City, Tower B, Gurugram — 122002',
  },
];

const HOURS = [
  { day: 'Monday – Friday', time: '9:00 AM – 9:00 PM', open: true  },
  { day: 'Saturday',        time: '10:00 AM – 6:00 PM', open: true  },
  { day: 'Sunday',          time: '10:00 AM – 4:00 PM', open: true  },
  { day: 'Public holidays', time: 'Closed',             open: false },
];

const SOCIALS = [
  {
    label: 'Twitter',
    href:  'https://twitter.com/cashly',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
           </svg>`,
  },
  {
    label: 'LinkedIn',
    href:  'https://linkedin.com/company/cashly',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
             <rect x="2" y="9" width="4" height="12"/>
             <circle cx="4" cy="4" r="2"/>
           </svg>`,
  },
  {
    label: 'Instagram',
    href:  'https://instagram.com/cashly',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
             <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
             <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
           </svg>`,
  },
  {
    label: 'YouTube',
    href:  'https://youtube.com/@cashly',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
             <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
           </svg>`,
  },
];

function buildOffices() {
  const list = document.getElementById('officeList');
  if (!list) return;
  list.innerHTML = OFFICES.map((o, i) => `
    <div class="office-item">
      <div class="office-city">
        ${o.city}
        ${o.hq ? '<span class="office-hq">HQ</span>' : ''}
      </div>
      <div class="office-addr">${o.addr}</div>
      ${i < OFFICES.length - 1 ? '<div class="office-divider"></div>' : ''}
    </div>
  `).join('');
}

function buildHours() {
  const list = document.getElementById('hoursList');
  if (!list) return;
  list.innerHTML = HOURS.map(h => `
    <div class="hours-row">
      <span class="hours-day">${h.day}</span>
      <span class="hours-time ${h.open ? 'open' : 'closed'}">${h.time}</span>
    </div>
  `).join('');
}

function buildSocials() {
  const row = document.getElementById('socialRow');
  if (!row) return;
  row.innerHTML = SOCIALS.map(s => `
    <a class="social-btn" href="${s.href}" target="_blank" rel="noopener">
      ${s.icon}
      ${s.label}
    </a>
  `).join('');
}

/* ─────────────────────────────────────────
   9. SCROLL REVEAL
───────────────────────────────────────── */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
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
   INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  buildChannels();
  buildTopicTabs();
  buildFAQs();
  buildOffices();
  buildHours();
  buildSocials();
  initContactForm();
  initAttachment();
  initReveal();
});