/* ═══════════════════════════════════════════════════════
   CASHLY — login.js
   1.  Theme toggle
   2.  Auth tabs (Sign in / Register)
   3.  Login method toggle (mobile / email)
   4.  Password visibility toggles
   5.  Password strength meter
   6.  Login form validation + submission
   7.  Register form validation + submission
   8.  Forgot password flow + OTP block
   9.  OTP digit input auto-advance + paste
   10. OTP countdown timer + resend
   11. Panel router utility
═══════════════════════════════════════════════════════ */
// At the top of login.js and auth.js
const API_BASE = 'http://localhost:5000';
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
  document.querySelectorAll(
    '#themeToggle, #themeToggleAside, #themeToggleMobile'
  ).forEach(btn => btn && btn.addEventListener('click', toggleTheme));
}

/* ─────────────────────────────────────────
   11. PANEL ROUTER — central show/hide
───────────────────────────────────────── */
// Panels: 'login' | 'register' | 'forgot' | 'otp-success'
// Tabs only track login / register
function showPanel(id) {
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`panel-${id}`);
  if (target) target.classList.add('active');

  // sync tab highlight for login/register only
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === id);
  });
}

/* ─────────────────────────────────────────
   2. AUTH TABS
───────────────────────────────────────── */
function initAuthTabs() {
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => showPanel(tab.dataset.tab));
  });

  // "switch" links inside panels
  document.querySelectorAll('.auth-switch-btn').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.switch));
  });
}

/* ─────────────────────────────────────────
   3. LOGIN METHOD TOGGLE (mobile / email)
───────────────────────────────────────── */
function initMethodToggle() {
  const btns      = document.querySelectorAll('.method-btn');
  const phoneGrp  = document.getElementById('phoneGroup');
  const emailGrp  = document.getElementById('emailGroup');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (btn.dataset.method === 'phone') {
        phoneGrp?.classList.remove('hidden');
        emailGrp?.classList.add('hidden');
      } else {
        emailGrp?.classList.remove('hidden');
        phoneGrp?.classList.add('hidden');
      }
    });
  });
}

/* ─────────────────────────────────────────
   4. PASSWORD VISIBILITY TOGGLES
───────────────────────────────────────── */
function wireEyeBtn(btnId, inputId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.querySelector('.eye-open').style.display  = show ? 'none'  : '';
    btn.querySelector('.eye-closed').style.display = show ? ''      : 'none';
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
}

function initEyeButtons() {
  wireEyeBtn('togglePassword',    'loginPassword');
  wireEyeBtn('toggleRegPassword', 'regPassword');
  wireEyeBtn('toggleRegConfirm',  'regConfirm');
}

/* ─────────────────────────────────────────
   5. PASSWORD STRENGTH METER
───────────────────────────────────────── */
function getStrength(pw) {
  if (!pw || pw.length < 4) return { level: 0, label: 'Too short',  cls: ''       };
  let score = 0;
  if (pw.length >= 8)                    score++;
  if (/[A-Z]/.test(pw))                  score++;
  if (/[0-9]/.test(pw))                  score++;
  if (/[^A-Za-z0-9]/.test(pw))           score++;

  if (score <= 1) return { level: 1, label: 'Weak',   cls: 'weak'   };
  if (score === 2) return { level: 2, label: 'Fair',   cls: 'fair'   };
  if (score === 3) return { level: 3, label: 'Good',   cls: 'good'   };
  return            { level: 4, label: 'Strong', cls: 'strong' };
}

function initStrengthMeter() {
  const input = document.getElementById('regPassword');
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!input || !fill || !label) return;

  input.addEventListener('input', () => {
    const { label: lbl, cls } = getStrength(input.value);
    fill.className  = 'strength-fill ' + cls;
    label.className = 'strength-label ' + cls;
    label.textContent = lbl;
  });
}

/* ─────────────────────────────────────────
   VALIDATION HELPERS
───────────────────────────────────────── */
function clearErrors(scope) {
  const root = scope || document;
  root.querySelectorAll('.field-error').forEach(e => e.remove());
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

/* ─────────────────────────────────────────
   6. LOGIN FORM
───────────────────────────────────────── */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  const btn  = document.getElementById('loginSubmitBtn');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors(form);

    let valid = true;
    const usePhone = !document.getElementById('emailGroup') ||
      document.getElementById('emailGroup').classList.contains('hidden');

    if (usePhone) {
      const ph = document.getElementById('loginPhone');
      if (!ph.value.trim() || !/^\d{10}$/.test(ph.value.trim())) {
        showError(ph, 'Enter a valid 10-digit mobile number.');
        valid = false;
      }
    } else {
      const em = document.getElementById('loginEmail');
      if (!em.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) {
        showError(em, 'Enter a valid email address.');
        valid = false;
      }
    }

    const pw = document.getElementById('loginPassword');
    if (!pw.value) {
      showError(pw, 'Please enter your password.');
      valid = false;
    }

    if (!valid) return;

    // simulate login
  btn.textContent = 'Signing in…';
btn.disabled = true;

try {
  const usePhone = document.getElementById('emailGroup')
    ?.classList.contains('hidden');

  const identifier = usePhone
    ? document.getElementById('loginPhone')?.value.trim()
    : document.getElementById('loginEmail')?.value.trim();

  const pwEl = document.getElementById('loginPassword');

  const res = await fetch('http://localhost:5000/api/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: identifier, // or phone depending on backend
      password: pwEl.value
    })
  });

  const data = await res.json();

  if (!res.ok) {
    btn.textContent = 'Sign in';
    btn.disabled = false;
    showError(pwEl, data.message || 'Invalid credentials.');
    return;
  }

  // Save JWT + user
  localStorage.setItem('kashly_token', data.accessToken);
  localStorage.setItem('kashly_refresh_token', data.refreshToken);
  localStorage.setItem('kashly_user', JSON.stringify({
    name:  data.user.name,
    email: data.user.email,
  }));

  window.location.href = 'index.html';

} catch (err) {
  btn.textContent = 'Sign in';
  btn.disabled = false;
  showError(document.getElementById('loginPassword'), 'Network error. Try again.');
}
  });
}

/* ─────────────────────────────────────────
   7. REGISTER FORM
───────────────────────────────────────── */
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  const btn  = document.getElementById('registerSubmitBtn');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors(form);

    const fields = [
      { id: 'regFirstName', msg: 'Enter your first name.' },
      { id: 'regLastName',  msg: 'Enter your last name.'  },
    ];
    let valid = true;

    fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el?.value.trim()) { showError(el, f.msg); valid = false; }
    });

    const phone = document.getElementById('regPhone');
    if (!phone.value.trim() || !/^\d{10}$/.test(phone.value.trim())) {
      showError(phone, 'Enter a valid 10-digit mobile number.');
      valid = false;
    }

    const email = document.getElementById('regEmail');
    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      showError(email, 'Enter a valid email address.');
      valid = false;
    }

    const pw = document.getElementById('regPassword');
    if (!pw.value || pw.value.length < 8) {
      showError(pw, 'Password must be at least 8 characters.');
      valid = false;
    }

    const confirm = document.getElementById('regConfirm');
    if (confirm.value !== pw.value) {
      showError(confirm, 'Passwords do not match.');
      valid = false;
    }

    const terms = document.getElementById('regTerms');
    if (!terms.checked) {
      const termsGroup = terms.closest('.remember-row');
      if (termsGroup) {
        const err = document.createElement('div');
        err.className   = 'field-error';
        err.textContent = 'Please accept the Terms of Use to continue.';
        err.style.marginTop = '4px';
        termsGroup.insertAdjacentElement('afterend', err);
      }
      valid = false;
    }

    if (!valid) {
      document.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

   btn.textContent = 'Creating account…';
btn.disabled    = true;
setTimeout(() => {
  const firstName = document.getElementById('regFirstName')?.value.trim() || '';
  const lastName  = document.getElementById('regLastName')?.value.trim()  || '';
  const email     = document.getElementById('regEmail')?.value.trim()     || '';

  localStorage.setItem('kashly_user', JSON.stringify({
    name:  `${firstName} ${lastName}`.trim(),
    email: email,
  }));

  window.location.href = 'index.html';
}, 1400);
  });
}

/* ─────────────────────────────────────────
   8. FORGOT PASSWORD FLOW
───────────────────────────────────────── */
function initForgotFlow() {
  // open forgot panel
  const forgotLink = document.getElementById('forgotLink');
  if (forgotLink) {
    forgotLink.addEventListener('click', e => {
      e.preventDefault();
      showPanel('forgot');
    });
  }

  // back button
  const backBtn = document.getElementById('backFromForgot');
  if (backBtn) {
    backBtn.addEventListener('click', () => showPanel('login'));
  }

  // send OTP
  const forgotForm = document.getElementById('forgotForm');
  const forgotBtn  = document.getElementById('forgotSubmitBtn');
  const otpBlock   = document.getElementById('otpBlock');
  const otpDisplay = document.getElementById('otpPhoneDisplay');

  if (forgotForm) {
    forgotForm.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors(forgotForm);

      const ph = document.getElementById('forgotPhone');
      if (!ph.value.trim() || !/^\d{10}$/.test(ph.value.trim())) {
        showError(ph, 'Enter a valid 10-digit mobile number.');
        return;
      }

      forgotBtn.textContent = 'Sending OTP…';
      forgotBtn.disabled    = true;

      setTimeout(() => {
        if (otpDisplay) otpDisplay.textContent = '+91 ' + ph.value.trim();
        otpBlock?.classList.remove('hidden');
        forgotForm.style.display = 'none';
        startOTPTimer();
        // focus first OTP digit
        document.querySelector('.otp-digit')?.focus();
      }, 900);
    });
  }

  // verify OTP button
  const verifyBtn = document.getElementById('verifyOtpBtn');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', () => {
      const digits = [...document.querySelectorAll('.otp-digit')].map(i => i.value).join('');
      if (digits.length < 6) {
        // shake effect
        const wrap = document.getElementById('otpInputs');
        if (wrap) {
          wrap.style.animation = 'none';
          wrap.offsetHeight;
          wrap.style.animation = 'shake 0.35s ease';
        }
        return;
      }
      verifyBtn.textContent = 'Verifying…';
      verifyBtn.disabled    = true;
      setTimeout(() => showPanel('otp-success'), 900);
    });
  }
}

/* ─────────────────────────────────────────
   9. OTP INPUT — auto-advance + paste
───────────────────────────────────────── */
function initOTPInputs() {
  const digits = document.querySelectorAll('.otp-digit');
  if (!digits.length) return;

  digits.forEach((inp, idx) => {
    inp.addEventListener('input', () => {
      // allow only single digit
      inp.value = inp.value.replace(/\D/g, '').slice(-1);
      if (inp.value && idx < digits.length - 1) {
        digits[idx + 1].focus();
      }
    });

    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && idx > 0) {
        digits[idx - 1].focus();
      }
    });
  });

  // handle paste of full OTP
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

/* shake animation for wrong OTP */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }
`;
document.head.appendChild(shakeStyle);

/* ─────────────────────────────────────────
   10. OTP COUNTDOWN + RESEND
───────────────────────────────────────── */
let otpInterval = null;

function startOTPTimer(seconds = 30) {
  const timerEl  = document.getElementById('otpTimer');
  const resendBtn = document.getElementById('resendOtpBtn');
  if (!timerEl || !resendBtn) return;

  let remaining = seconds;
  resendBtn.disabled     = true;
  resendBtn.innerHTML    = `Resend in <span class="num" id="otpTimer">${remaining}s</span>`;

  clearInterval(otpInterval);
  otpInterval = setInterval(() => {
    remaining--;
    const t = document.getElementById('otpTimer');
    if (t) t.textContent = remaining + 's';

    if (remaining <= 0) {
      clearInterval(otpInterval);
      resendBtn.disabled   = false;
      resendBtn.textContent = 'Resend OTP';
    }
  }, 1000);

  resendBtn.addEventListener('click', function onResend() {
    if (resendBtn.disabled) return;
    resendBtn.removeEventListener('click', onResend);
    // clear digits
    document.querySelectorAll('.otp-digit').forEach(d => d.value = '');
    document.querySelector('.otp-digit')?.focus();
    startOTPTimer(30);
  }, { once: true });
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuthTabs();
  initMethodToggle();
  initEyeButtons();
  initStrengthMeter();
  initLoginForm();
  initRegisterForm();
  initForgotFlow();
  initOTPInputs();
});