/* ══════════════════════════════════════════════════════════
   KASHLY — forgot-password.js
   Reset password flow — 3 steps + success
   1.  Theme toggle
   2.  Step router (panel switching + aside sync)
   3.  Step 1 — mobile number validation + send OTP
   4.  Step 2 — OTP input: auto-advance, paste, verify
   5.  OTP countdown timer + resend
   6.  Step 3 — new password + confirm + rules checklist
   7.  Password strength meter
   8.  Password visibility toggles
   9.  Success — auto-redirect countdown
══════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────
   1. THEME TOGGLE
────────────────────────────────────────── */
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
  document.querySelectorAll(
    '#themeToggleAside, #themeToggleMobile'
  ).forEach(btn => btn && btn.addEventListener('click', toggleTheme));
}

/* ──────────────────────────────────────────
   2. STEP ROUTER
   Steps: 1 | 2 | 3 | success
────────────────────────────────────────── */
let currentStep = 1;

const STEP_CONFIG = {
  1: { panelId: 'fp-step1',   asideSteps: [1],    msFill: '33.33%',  msLabel: 'Step 1 of 3' },
  2: { panelId: 'fp-step2',   asideSteps: [1,2],  msFill: '66.66%',  msLabel: 'Step 2 of 3' },
  3: { panelId: 'fp-step3',   asideSteps: [1,2,3],msFill: '100%',    msLabel: 'Step 3 of 3' },
  4: { panelId: 'fp-success',  asideSteps: [1,2,3],msFill: '100%',    msLabel: 'Complete' },
};

function showStep(step) {
  currentStep = step;
  const cfg = STEP_CONFIG[step];
  if (!cfg) return;

  // hide all panels
  document.querySelectorAll('.fp-panel').forEach(p => p.classList.remove('active'));

  // show target panel
  const target = document.getElementById(cfg.panelId);
  if (target) target.classList.add('active');

  // sync aside step indicators
  [1, 2, 3].forEach(n => {
    const el = document.getElementById(`rs-step-${n}`);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (cfg.asideSteps.includes(n)) {
      if (n < Math.max(...cfg.asideSteps)) {
        el.classList.add('done');
        // show checkmark
        const numEl = el.querySelector('.rs-num');
        if (numEl) numEl.innerHTML = '✓';
      } else {
        el.classList.add('active');
        const numEl = el.querySelector('.rs-num');
        if (numEl) numEl.textContent = n;
      }
    } else {
      const numEl = el.querySelector('.rs-num');
      if (numEl) numEl.textContent = n;
    }
  });

  // sync mobile progress bar
  const msBar = document.getElementById('msBarFill');
  const msLabel = document.getElementById('msLabel');
  if (msBar)   msBar.style.width   = cfg.msFill;
  if (msLabel) msLabel.textContent = cfg.msLabel;

  // scroll to top of form
  document.querySelector('.login-form-wrap')?.scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ──────────────────────────────────────────
   VALIDATION HELPERS
────────────────────────────────────────── */
function clearErrors(scope) {
  const root = scope || document;
  root.querySelectorAll('.field-error:not(#otpError)').forEach(e => e.remove());
  root.querySelectorAll('.error').forEach(e => e.classList.remove('error'));
}

function showError(el, msg) {
  if (!el) return;
  el.classList.add('error');
  const err = document.createElement('div');
  err.className   = 'field-error';
  err.textContent = msg;
  el.closest('.form-group, .input-wrap')
    ?.closest('.form-group')
    ?.appendChild(err);
}

/* ──────────────────────────────────────────
   3. STEP 1 — MOBILE NUMBER + SEND OTP
────────────────────────────────────────── */
let registeredPhone = '';

function initStep1() {
  const form = document.getElementById('fpStep1Form');
  const btn  = document.getElementById('fpStep1Btn');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors(form);

    const ph = document.getElementById('fpPhone');
    if (!ph.value.trim() || !/^[6-9]\d{9}$/.test(ph.value.trim())) {
      showError(ph, 'Enter a valid 10-digit Indian mobile number.');
      return;
    }

    registeredPhone = ph.value.trim();

    // set loading state
    btn.disabled = true;
    btn.innerHTML = `Sending OTP… <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;

    // simulate API call
    await delay(900);

    // populate phone displays
    const formatted = '+91 ' + registeredPhone.replace(/(\d{5})(\d{5})/, '$1 $2');
    const d1 = document.getElementById('otpPhoneDisplay');
    const d2 = document.getElementById('otpPhoneDisplay2');
    if (d1) d1.textContent = formatted;
    if (d2) d2.textContent = formatted;

    btn.disabled = false;
    btn.innerHTML = `Send OTP <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;

    showStep(2);
    startOTPTimer();
    setTimeout(() => document.querySelector('.otp-digit')?.focus(), 100);
  });
}

/* ──────────────────────────────────────────
   4. STEP 2 — OTP INPUT
────────────────────────────────────────── */
function initOTPInputs() {
  const digits = document.querySelectorAll('.otp-digit');
  if (!digits.length) return;

  digits.forEach((inp, idx) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(-1);
      if (inp.value && idx < digits.length - 1) {
        digits[idx + 1].focus();
      }
      // clear error on input
      const errEl = document.getElementById('otpError');
      if (errEl) errEl.classList.add('hidden');
    });

    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && idx > 0) {
        digits[idx - 1].focus();
      }
    });

    inp.addEventListener('focus', () => inp.select());
  });

  // paste full OTP
  digits[0].addEventListener('paste', e => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData)
      .getData('text').replace(/\D/g, '').slice(0, 6);
    pasted.split('').forEach((ch, i) => {
      if (digits[i]) digits[i].value = ch;
    });
    const next = digits[Math.min(pasted.length, digits.length - 1)];
    next?.focus();
  });
}

function initStep2() {
  // Back to step 1
  document.getElementById('backToStep1')?.addEventListener('click', () => {
    clearOTPInputs();
    showStep(1);
  });

  // Wrong number — start over
  document.getElementById('wrongNumberBtn')?.addEventListener('click', () => {
    clearOTPInputs();
    showStep(1);
  });

  // Verify OTP
  const verifyBtn = document.getElementById('verifyOtpBtn');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', async () => {
      const digits = [...document.querySelectorAll('.otp-digit')].map(i => i.value).join('');
      const errEl  = document.getElementById('otpError');

      if (digits.length < 6) {
        // show error + shake
        if (errEl) errEl.classList.remove('hidden');
        shakeEl(document.getElementById('otpInputs'));
        return;
      }

      if (errEl) errEl.classList.add('hidden');
      verifyBtn.disabled = true;
      verifyBtn.innerHTML = `Verifying… <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

      await delay(900);

      verifyBtn.disabled = false;
      verifyBtn.innerHTML = `Verify OTP <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

      showStep(3);
      setTimeout(() => document.getElementById('fpNewPassword')?.focus(), 100);
    });
  }
}

function clearOTPInputs() {
  document.querySelectorAll('.otp-digit').forEach(d => d.value = '');
  const errEl = document.getElementById('otpError');
  if (errEl) errEl.classList.add('hidden');
}

/* ──────────────────────────────────────────
   5. OTP COUNTDOWN + RESEND
────────────────────────────────────────── */
let otpInterval = null;

function startOTPTimer(seconds = 30) {
  const resendBtn = document.getElementById('resendOtpBtn');
  if (!resendBtn) return;

  let remaining = seconds;
  resendBtn.disabled    = true;
  resendBtn.innerHTML   = `Resend in <span class="num" id="otpTimer">${remaining}s</span>`;

  clearInterval(otpInterval);
  otpInterval = setInterval(() => {
    remaining--;
    const t = document.getElementById('otpTimer');
    if (t) t.textContent = remaining + 's';

    if (remaining <= 0) {
      clearInterval(otpInterval);
      resendBtn.disabled    = false;
      resendBtn.textContent = 'Resend OTP';
    }
  }, 1000);

  resendBtn.onclick = function() {
    if (resendBtn.disabled) return;
    clearOTPInputs();
    document.querySelector('.otp-digit')?.focus();
    startOTPTimer(30);
  };
}

/* ──────────────────────────────────────────
   6. STEP 3 — NEW PASSWORD + RULES
────────────────────────────────────────── */

const RULES = [
  { id: 'rule-length',  test: pw => pw.length >= 8 },
  { id: 'rule-upper',   test: pw => /[A-Z]/.test(pw) },
  { id: 'rule-number',  test: pw => /[0-9]/.test(pw) },
  { id: 'rule-special', test: pw => /[^A-Za-z0-9]/.test(pw) },
];

function updateRules(pw) {
  RULES.forEach(rule => {
    const el = document.getElementById(rule.id);
    if (!el) return;
    const pass = rule.test(pw);
    el.classList.toggle('pass', pass);
    // swap SVG: circle → checkmark
    el.querySelector('svg').innerHTML = pass
      ? '<polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<circle cx="12" cy="12" r="10"/>';
  });
}

function initStep3() {
  const form     = document.getElementById('fpStep3Form');
  const btn      = document.getElementById('fpStep3Btn');
  const pwInput  = document.getElementById('fpNewPassword');
  const cfmInput = document.getElementById('fpConfirmPassword');

  if (!form) return;

  // live rule checking
  pwInput?.addEventListener('input', () => {
    updateRules(pwInput.value);
    updateStrengthMeter(pwInput.value);
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors(form);

    let valid = true;

    // validate new password
    if (!pwInput.value || pwInput.value.length < 8) {
      showError(pwInput, 'Password must be at least 8 characters.');
      valid = false;
    }

    // validate confirm password
    if (!cfmInput.value) {
      showError(cfmInput, 'Please confirm your new password.');
      valid = false;
    } else if (pwInput.value !== cfmInput.value) {
      showError(cfmInput, 'Passwords do not match.');
      valid = false;
    }

    if (!valid) return;

    btn.disabled  = true;
    btn.innerHTML = `Resetting… <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

    await delay(1000);

    btn.disabled  = false;
    btn.innerHTML = `Reset password <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

    showStep(4);
    startRedirectCountdown();
  });
}

/* ──────────────────────────────────────────
   7. PASSWORD STRENGTH METER
────────────────────────────────────────── */
function getStrength(pw) {
  if (!pw || pw.length < 4) return { label: 'Too short', cls: '' };
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: 'Weak',   cls: 'weak'   };
  if (score === 2) return { label: 'Fair',   cls: 'fair'   };
  if (score === 3) return { label: 'Good',   cls: 'good'   };
  return             { label: 'Strong', cls: 'strong' };
}

function updateStrengthMeter(pw) {
  const fill  = document.getElementById('fpStrengthFill');
  const label = document.getElementById('fpStrengthLabel');
  if (!fill || !label) return;

  const { label: lbl, cls } = getStrength(pw);
  fill.className  = 'strength-fill ' + cls;
  label.className = 'strength-label ' + cls;
  label.textContent = lbl;
}

/* ──────────────────────────────────────────
   8. PASSWORD VISIBILITY TOGGLES
────────────────────────────────────────── */
function wireEyeBtn(btnId, inputId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.querySelector('.eye-open').style.display   = show ? 'none' : '';
    btn.querySelector('.eye-closed').style.display  = show ? ''     : 'none';
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
}

function initEyeButtons() {
  wireEyeBtn('toggleNewPassword',     'fpNewPassword');
  wireEyeBtn('toggleConfirmPassword', 'fpConfirmPassword');
}

/* ──────────────────────────────────────────
   9. SUCCESS — AUTO REDIRECT
────────────────────────────────────────── */
function startRedirectCountdown(seconds = 5) {
  let remaining = seconds;
  const timerEl = document.getElementById('redirectTimer');

  const interval = setInterval(() => {
    remaining--;
    if (timerEl) timerEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(interval);
      window.location.href = 'login.html';
    }
  }, 1000);
}

/* ──────────────────────────────────────────
   UTILITIES
────────────────────────────────────────── */
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function shakeEl(el) {
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake 0.35s ease';
}

// inject shake keyframes
(function injectShake() {
  const s = document.createElement('style');
  s.textContent = `
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-6px); }
      40%      { transform: translateX(6px); }
      60%      { transform: translateX(-4px); }
      80%      { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(s);
})();

/* ──────────────────────────────────────────
   INIT
────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  showStep(1);
  initStep1();
  initOTPInputs();
  initStep2();
  initStep3();
  initEyeButtons();
});