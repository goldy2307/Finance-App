// Shared auth helpers for all frontend pages.
// Works with plain <script> includes (no bundler).

const CASHLY_API_BASE = (window.CASHLY_API_BASE || 'http://localhost:5000')
  .toString()
  .trim();

const AUTH_KEY    = 'kashly_user';
const TOKEN_KEY   = 'kashly_token';
const REFRESH_KEY = 'kashly_refresh_token';

function stripTrailingSlashes(value) {
  return value.toString().replace(/\/+$/, '');
}

function stripLeadingSlashes(value) {
  return value.toString().replace(/^\/+/, '');
}

function joinUrl(base, path) {
  const b = stripTrailingSlashes((base || '').toString().trim());
  const p = stripLeadingSlashes((path || '').toString().trim());
  return `${b}/${p}`;
}

function apiUrl(path) {
  // Accepts:
  // - "/auth/login"          -> <base>/api/v1/auth/login
  // - "/api/v1/auth/login"   -> <base>/api/v1/auth/login
  // - "api/v1/auth/login"    -> <base>/api/v1/auth/login
  // - full URL                -> unchanged
  const p = (path || '').toString().trim();
  if (/^https?:\/\//i.test(p)) return p;

  const base = stripTrailingSlashes(CASHLY_API_BASE);
  const normalized = p.startsWith('/') ? p : `/${p}`;

  if (normalized.startsWith('/api/')) {
    return `${base}${normalized}`;
  }

  return `${base}/api/v1${normalized}`;
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
  catch { return null; }
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

function isLoggedIn() {
  return !!getToken() && !!getStoredUser();
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') return null;
  const firstName = user.firstName || '';
  const lastName  = user.lastName || '';
  const name = (user.name || `${firstName} ${lastName}`)
    .toString()
    .replace(/\s+/g, ' ')
    .trim();
  return { ...user, firstName, lastName, name };
}

function setSession({ accessToken, refreshToken, user } = {}) {
  if (accessToken)  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (user)         localStorage.setItem(AUTH_KEY, JSON.stringify(normalizeUser(user)));
}

function clearSession() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function logout() {
  clearSession();
  window.location.href = 'index.html';
}

function safeRedirectTarget(raw) {
  if (!raw) return null;
  const t = raw.toString().trim();
  // Prevent open redirects; only allow same-site relative paths.
  if (!t.startsWith('/')) return null;
  if (t.includes('://')) return null;
  return t;
}

// Role → dashboard mapping. Add new roles here as needed.
const ROLE_DASHBOARDS = {
  borrower: 'user_dashboard.html',
  admin:    'admin_dashboard.html',
  bank:     'bank_dashboard.html',
};

function getDashboardForRole(role) {
  if (!role) return 'user_dashboard.html';
  const key = role.toString().toLowerCase().trim();
  // If a dashboard exists for this role, use it.
  // Otherwise fall back to user_dashboard.html (auto-fallback).
  return ROLE_DASHBOARDS[key] || `${key}_dashboard.html`;
}
// Protect pages -- call this on dashboards/apply/profile etc.
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = `login.html?redirect=${encodeURIComponent(location.pathname)}`;
  }
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(apiUrl('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return false;
  const body = await res.json().catch(() => null);
  const accessToken = body && body.data ? body.data.accessToken : null;
  if (!accessToken) return false;

  localStorage.setItem(TOKEN_KEY, accessToken);
  return true;
}

// Attach token to API requests; retries once via refresh token on 401.
async function authFetch(path, options = {}, retry = true) {
  const token = getToken();

  const headers = { ...(options.headers || {}) };
  if (!('Content-Type' in headers) && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return authFetch(path, options, false);
    logout();
    return null;
  }

  return res;
}

function getInitials(name) {
  const parts = (name || '').toString().trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

function initAuthNav() {
  const navSignIn = document.getElementById('navSignIn');
  const navUser   = document.getElementById('navUser');

  if (!navSignIn || !navUser) return;
  if (navUser.dataset.authNavInit === '1') return;
  navUser.dataset.authNavInit = '1';

  const avatarBtn = document.getElementById('navAvatarBtn');
  const dropdown  = document.getElementById('navDropdown');
  const logoutBtn = document.getElementById('navLogoutBtn');
  const resetBtn  = document.getElementById('navResetPasswordBtn');

  const user = getStoredUser();

  if (user) {
    navSignIn.style.display  = 'none';
    navUser.style.display    = 'flex';
    navUser.style.alignItems = 'center';

    const initialsEl = document.getElementById('navAvatarInitials');
    const nameEl     = document.getElementById('navDdName');
    const emailEl    = document.getElementById('navDdEmail');

    if (initialsEl) initialsEl.textContent = getInitials(user.name || user.email || 'U');
    if (nameEl)     nameEl.textContent     = user.name  || 'User';
    if (emailEl)    emailEl.textContent    = user.email || '';
  } else {
    navSignIn.style.display = '';
    navUser.style.display   = 'none';
  }

  if (avatarBtn) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dropdown) dropdown.classList.toggle('open');
    });
  }

  document.addEventListener('click', (e) => {
    if (navUser.contains(e.target)) return;
    if (dropdown) dropdown.classList.remove('open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dropdown) dropdown.classList.remove('open');
  });

  if (logoutBtn) logoutBtn.addEventListener('click', () => logout());

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (dropdown) dropdown.classList.remove('open');
      window.location.href = 'reset-password.html';
    });
  }
}

// Safe no-op on pages that don't have the nav dropdown markup.
document.addEventListener('DOMContentLoaded', () => {
  initAuthNav();
});
