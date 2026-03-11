// js/auth.js
const API = 'http://localhost:5000/api'; // ← change to deployed URL when live

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function saveSession(token, email) {
  localStorage.setItem('sa_token', token);
  localStorage.setItem('sa_email', email);
}

// Redirect to dashboard if already logged in
function redirectIfLoggedIn() {
  if (localStorage.getItem('sa_token')) {
    window.location.href = 'dashboard.html';
  }
}

// ── REGISTER ─────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  showError('reg-error', '');

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm').value;

  if (password !== confirm) return showError('reg-error', 'Passwords do not match.');

  const btn = document.getElementById('reg-btn');
  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    const res  = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showError('reg-error', data.error || 'Registration failed.');
    } else {
      // Support both response shapes: { token, email } or { token, user: { email } }
      const userEmail = data.email || (data.user && data.user.email) || email;
      saveSession(data.token, userEmail);
      window.location.href = 'dashboard.html';
    }
  } catch {
    showError('reg-error', 'Could not connect to server.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account →';
  }
}

// ── LOGIN ─────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  showError('login-error', '');

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Logging in…';

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showError('login-error', data.error || 'Login failed.');
    } else {
      const userEmail = data.email || (data.user && data.user.email) || email;
      saveSession(data.token, userEmail);
      window.location.href = 'dashboard.html';
    }
  } catch {
    showError('login-error', 'Could not connect to server.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log In →';
  }
}

// ── LOGOUT ────────────────────────────────────────────
function logout() {
  localStorage.removeItem('sa_token');
  localStorage.removeItem('sa_email');
  window.location.href = 'login.html';
}