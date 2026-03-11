// js/dashboard.js
const API = 'http://localhost:5000/api'; // ← change to deployed URL when live

// ── Auth guard ─────────────────────────────────────────
const token = localStorage.getItem('sa_token');
if (!token) window.location.href = 'login.html';

// Show email in navbar
const emailEl = document.getElementById('user-email');
if (emailEl) emailEl.textContent = localStorage.getItem('sa_email') || '';

// ── Authorized fetch helper ────────────────────────────
async function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
}

// ── Toast ──────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  const icon = type === 'success' ? '✓' : '✕';
  t.innerHTML = `<span>${icon}</span> ${msg}`;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

// ── Time formatting ────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Render sites list ──────────────────────────────────
function renderSites(sites) {
  const list = document.getElementById('sites-list');

  // Update stats
  document.getElementById('stat-total').textContent  = sites.length;
  document.getElementById('stat-active').textContent = sites.filter(s => s.is_active).length;
  document.getElementById('stat-paused').textContent = sites.filter(s => !s.is_active).length;

  if (sites.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌙</div>
        <div class="empty-title">No sites added yet</div>
        <div class="empty-sub">Add a URL above to start keeping it alive.</div>
      </div>`;
    return;
  }

  // Build status chip for last HTTP status
  function statusChip(status, lastPinged) {
    if (!lastPinged) return `<span class="meta-chip never">Never pinged</span>`;
    if (!status)     return `<span class="meta-chip err">Unreachable</span>`;
    if (status >= 200 && status < 400) return `<span class="meta-chip ok">HTTP ${status}</span>`;
    return `<span class="meta-chip err">HTTP ${status}</span>`;
  }

  list.innerHTML = sites.map((site, i) => `
    <div class="site-card" style="animation-delay:${i * 0.05}s">
      <div class="site-status ${site.is_active ? 'active' : 'paused'}"></div>

      <div class="site-body">
        <div class="site-url" title="${site.url}">${site.url}</div>
        <div class="site-meta">
          <span class="meta-chip">Every ${site.interval_min}m</span>
          ${statusChip(site.last_status, site.last_pinged)}
          ${site.last_pinged
            ? `<span style="color:var(--text3)">Last ping: ${timeAgo(site.last_pinged)}</span>`
            : ''}
        </div>
      </div>

      <span class="${site.is_active ? 'site-badge-active' : 'site-badge-paused'}">
        ${site.is_active ? '● Active' : '⏸ Paused'}
      </span>

      <div class="site-actions">
        <button class="btn-toggle" onclick="toggleSite(${site.id})">
          ${site.is_active ? 'Pause' : 'Resume'}
        </button>
        <button class="btn-del" onclick="deleteSite(${site.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

// ── Load sites ─────────────────────────────────────────
async function loadSites() {
  try {
    const res  = await authFetch(`${API}/sites`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    // Backend returns { sites: [...] }
    renderSites(data.sites || []);
  } catch (err) {
    showToast('Could not load sites: ' + err.message, 'error');
  }
}

// ── Add site ───────────────────────────────────────────
async function addSite() {
  const url      = document.getElementById('new-url').value.trim();
  const interval = document.getElementById('new-interval').value.trim();
  const errEl    = document.getElementById('add-error');
  errEl.textContent = '';

  if (!url || !interval) {
    errEl.textContent = 'Both URL and interval are required.';
    return;
  }

  const btn = document.getElementById('add-btn');
  btn.disabled = true;
  btn.textContent = 'Adding…';

  try {
    const res  = await authFetch(`${API}/sites`, {
      method: 'POST',
      body: JSON.stringify({ url, interval_min: parseInt(interval) })
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error;
    } else {
      document.getElementById('new-url').value      = '';
      document.getElementById('new-interval').value = '';
      showToast('Site added! Pinging will start shortly. ✓');
      loadSites();
    }
  } catch {
    errEl.textContent = 'Could not connect to server.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add Site';
  }
}

// ── Toggle pause/resume ────────────────────────────────
async function toggleSite(id) {
  try {
    const res  = await authFetch(`${API}/sites/${id}`, { method: 'PATCH' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showToast(data.site.is_active ? 'Site resumed.' : 'Site paused.');
    loadSites();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

// ── Delete site ────────────────────────────────────────
async function deleteSite(id) {
  if (!confirm('Delete this site? Pings will stop permanently.')) return;
  try {
    const res  = await authFetch(`${API}/sites/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showToast('Site removed.');
    loadSites();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

// ── Auto-refresh stats every 30s ──────────────────────
loadSites();
setInterval(loadSites, 30000);