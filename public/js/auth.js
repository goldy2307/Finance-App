// At the top of login.js and auth.js
const API_BASE = 'http://localhost:5000';

const AUTH_KEY     = 'kashly_user';
const TOKEN_KEY    = 'kashly_token';
const REFRESH_KEY  = 'kashly_refresh_token';

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
  catch { return null; }
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function isLoggedIn() {
  return !!getToken() && !!getStoredUser();
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  window.location.href = 'index.html';
}

// Protect pages — call this on dashboard, apply, profile etc.
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(location.pathname);
  }
}

// Attach token to every API request
async function authFetch(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    }
  });

  if (res.status === 401) {
    // Token expired — log out
    logout();
    return;
  }

  return res;
}