// ── CONFIG ─────────────────────────────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz5r1BUFh8EO9GKmvLNx1NYHeERdF6IU_Ol1c50NqL4YJdu0et_1sPxToGV5WaRmqME/exec';
// PSGC public API — no key needed (Philippines location data)
const PSGC_BASE = 'https://psgc.gitlab.io/api';
// Get agent from session storage (set by login)
const AGENT_NAME = sessionStorage.getItem('agent') || 'Leads';
// ───────────────────────────────────────────────────────────────────────────

let currentLead = null;
let callActive = false;
let timerInterval = null;
let timerSeconds = 0;
let locationData = { provinces: [], cities: {}, barangays: {} };
let salesData = [];
let callbackData = [];
let salesPage = 1;
let callbackPage = 1;
const ITEMS_PER_PAGE = 3;

const $ = id => document.getElementById(id);

// ── JSONP UTILITY ────────────────────────────────────────────────────────
function jsonp(url, callback) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const callbackName = 'jsonp_callback_' + Math.random().toString(36).substr(2, 9);

    window[callbackName] = function(data) {
      delete window[callbackName];
      document.head.removeChild(script);
      resolve(data);
    };

    script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
    script.onerror = function() {
      delete window[callbackName];
      document.head.removeChild(script);
      reject(new Error('JSONP request failed'));
    };

    document.head.appendChild(script);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (window[callbackName]) {
        delete window[callbackName];
        document.head.removeChild(script);
        reject(new Error('JSONP request timeout'));
      }
    }, 10000);
  });
}

// ── TOAST ─────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = $('toast');
  const icons = { success: '✓', error: '✕', info: '→' };
  t.className = `toast ${type}`;
  $('toastIcon').textContent = icons[type] || '→';
  $('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ── STATUS BAR ────────────────────────────────────────────────────────────
function setStatus(text) { $('statusBar').textContent = text; }

// ── CALL TIMER ────────────────────────────────────────────────────────────
function startTimer() {
  timerSeconds = 0;
  $('callTimer').classList.add('active');
  timerInterval = setInterval(() => {
    timerSeconds++;
    const m = String(Math.floor(timerSeconds / 60)).padStart(2,'0');
    const s = String(timerSeconds % 60).padStart(2,'0');
    $('timerDisplay').textContent = `${m}:${s}`;
  }, 1000);
}
function stopTimer() {
  clearInterval(timerInterval);
  $('callTimer').classList.remove('active');
}

// ── FETCH NEXT LEAD ───────────────────────────────────────────────────────
async function fetchNextLead() {
  const btn = $('btnNext');
  const content = $('nextBtnContent');

  btn.disabled = true;
  content.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;"><div class="spinner"></div>Loading…</div>';
  setStatus('FETCHING');
  $('footerNote').textContent = 'Fetching next available lead…';

  // Demo mode if URL not configured
  if (APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
    await sleep(900);
    const demo = {
      row: Math.floor(Math.random() * 100) + 2,
      id: 'LD-' + Math.floor(Math.random() * 9000 + 1000),
      name: 'Maria Santos',
      phone: '+63 917 555 0192',
      address: '123 Rizal St., Brgy. Sta. Cruz'
    };
    populateLead(demo);
    updateLeadsCount();
    return;
  }

  try {
    const data = await jsonp(`${APPS_SCRIPT_URL}?action=getNextLead&agent=${encodeURIComponent(AGENT_NAME)}`);
    if (data.error) { showToast(data.error, 'error'); btn.disabled = false; content.textContent = '▶ Next Lead'; setStatus('READY'); return; }
    populateLead(data.lead);
    updateLeadsCount();
  } catch (e) {
    showToast('Failed to fetch lead. Check network or Apps Script URL.', 'error');
    btn.disabled = false;
    content.textContent = '▶ Next Lead';
    setStatus('ERROR');
    $('footerNote').textContent = 'Connection error';
  }
}

function populateLead(lead) {
  currentLead = lead;
  callActive = true;

  $('clientName').textContent = lead.name || '—';
  $('clientPhone').textContent = lead.phone || '—';
  $('clientAddress').textContent = lead.address || '—';
  $('leadBadge').textContent = `ID: ${lead.id || lead.row}`;

  $('remarks').value = '';
  $('callStatus').value = '';
  $('stateProvince').value = '';
  $('cityMunicipality').value = '';
  $('townBarangay').value = '';
  $('cityMunicipality').disabled = true;
  $('townBarangay').disabled = true;

  $('idleState').style.display = 'none';
  $('clientBlock').classList.add('visible');

  $('btnNext').disabled = true;
  $('nextBtnContent').textContent = '▶ Next Lead';
  $('btnEnd').disabled = false;

  setStatus('IN CALL');
  $('footerNote').textContent = `Lead loaded — Row ${lead.row}`;
  startTimer();
  showToast(`Lead loaded: ${lead.name}`, 'info');
}

// ── END CALL ──────────────────────────────────────────────────────────────
async function endCall() {
  const status = $('callStatus').value;
  const remarks = $('remarks').value.trim();
  const province = $('stateProvince').options[$('stateProvince').selectedIndex]?.text || '';
  const city = $('cityMunicipality').options[$('cityMunicipality').selectedIndex]?.text || '';
  const barangay = $('townBarangay').options[$('townBarangay').selectedIndex]?.text || '';

  if (!status) { showToast('Please select a Call Status before ending.', 'error'); return; }
  if (!remarks) { showToast('Please enter remarks before ending.', 'error'); return; }

  $('btnEnd').disabled = true;
  $('btnEnd').textContent = 'Saving…';
  setStatus('SAVING');

  stopTimer();

  if (APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
    await sleep(800);
    finishCall(province, city, barangay, status, remarks);
    return;
  }

  try {
    const params = new URLSearchParams({
      action: 'updateLead',
      row: currentLead.row,
      province, city, barangay,
      remarks, callStatus: status,
      agent: AGENT_NAME
    });
    const data = await jsonp(`${APPS_SCRIPT_URL}?${params.toString()}`);
    if (data.success) {
      finishCall(province, city, barangay, status, remarks);
    } else {
      showToast('Update failed. Try again.', 'error');
      $('btnEnd').disabled = false;
      $('btnEnd').textContent = '✕ End Call';
      setStatus('ERROR');
    }
  } catch (e) {
    showToast('Network error saving call data.', 'error');
    $('btnEnd').disabled = false;
    $('btnEnd').textContent = '✕ End Call';
    setStatus('ERROR');
  }
}

function finishCall(province, city, barangay, status, remarks) {
  showToast('Call data saved successfully!', 'success');
  setStatus('SAVED');
  $('footerNote').textContent = `Saved — ${status} | ${new Date().toLocaleTimeString()}`;

  $('clientBlock').classList.remove('visible');
  $('idleState').style.display = '';
  $('leadBadge').textContent = '— / —';
  $('btnEnd').textContent = '✕ End Call';
  $('btnEnd').disabled = true;
  $('btnNext').disabled = false;
  callActive = false;
  currentLead = null;

  updateLeadsCount();
  if (status.toLowerCase() === 'sales') loadTodaySales();
  loadCallbacks();
  setTimeout(() => setStatus('READY'), 2000);
}

// ── PSGC LOCATION DROPDOWNS ───────────────────────────────────────────────
async function loadProvinces() {
  try {
    const res = await fetch(`${PSGC_BASE}/provinces/`);
    const provinces = await res.json();
    provinces.sort((a, b) => a.name.localeCompare(b.name));
    const sel = $('stateProvince');
    provinces.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.code;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
  } catch (e) {
    // Fallback: leave with empty
    console.warn('PSGC province load failed:', e);
  }
}

$('stateProvince').addEventListener('change', async function() {
  const code = this.value;
  const cityEl = $('cityMunicipality');
  const bgyEl = $('townBarangay');
  cityEl.innerHTML = '<option value="">— Loading… —</option>';
  cityEl.disabled = true;
  bgyEl.innerHTML = '<option value="">— Select Barangay —</option>';
  bgyEl.disabled = true;

  if (!code) { cityEl.innerHTML = '<option value="">— Select City / Municipality —</option>'; return; }

  try {
    const [citiesRes, munRes] = await Promise.all([
      fetch(`${PSGC_BASE}/provinces/${code}/cities/`).catch(() => ({ json: () => [] })),
      fetch(`${PSGC_BASE}/provinces/${code}/municipalities/`).catch(() => ({ json: () => [] }))
    ]);
    const cities = await citiesRes.json().catch(() => []);
    const munis = await munRes.json().catch(() => []);
    const combined = [...(Array.isArray(cities) ? cities : []), ...(Array.isArray(munis) ? munis : [])];
    combined.sort((a, b) => a.name.localeCompare(b.name));
    cityEl.innerHTML = '<option value="">— Select City / Municipality —</option>';
    combined.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = c.name;
      cityEl.appendChild(opt);
    });
    cityEl.disabled = false;
  } catch (e) {
    cityEl.innerHTML = '<option value="">— Failed to load —</option>';
  }
});

$('cityMunicipality').addEventListener('change', async function() {
  const code = this.value;
  const bgyEl = $('townBarangay');
  bgyEl.innerHTML = '<option value="">— Loading… —</option>';
  bgyEl.disabled = true;
  if (!code) { bgyEl.innerHTML = '<option value="">— Select Barangay —</option>'; return; }

  try {
    // Try city first, then municipality
    let res = await fetch(`${PSGC_BASE}/cities/${code}/barangays/`);
    if (!res.ok) res = await fetch(`${PSGC_BASE}/municipalities/${code}/barangays/`);
    const bgys = await res.json();
    bgys.sort((a, b) => a.name.localeCompare(b.name));
    bgyEl.innerHTML = '<option value="">— Select Barangay —</option>';
    bgys.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.code;
      opt.textContent = b.name;
      bgyEl.appendChild(opt);
    });
    bgyEl.disabled = false;
  } catch (e) {
    bgyEl.innerHTML = '<option value="">— Failed to load —</option>';
  }
});

// ── UPDATE LEADS COUNT ───────────────────────────────────────────────────
async function updateLeadsCount() {
  try {
    const data = await jsonp(`${APPS_SCRIPT_URL}?action=getLeadsCount&agent=${encodeURIComponent(AGENT_NAME)}`);
    if (data.dialedToday !== undefined) {
      $('dialedCount').textContent = data.dialedToday;
    }
    if (data.available !== undefined) {
      $('availableCount').textContent = data.available;
    }
  } catch (e) {
    console.error('Lead count error:', e);
    $('dialedCount').textContent = '—';
    $('availableCount').textContent = '—';
  }
}

// ── LOAD TODAY'S SALES ───────────────────────────────────────────────────────
async function loadTodaySales() {
  try {
    const data = await jsonp(`${APPS_SCRIPT_URL}?action=getTodaySales&agent=${encodeURIComponent(AGENT_NAME)}`);
    salesData = data.sales || [];
    $('salesTotal').textContent = salesData.length;
    salesPage = 1;
    renderSalesPage();
  } catch (e) {
    console.error('Sales load error:', e);
    $('salesTableBody').innerHTML = '<tr><td colspan="3" class="sales-empty">Failed to load</td></tr>';
    $('salesTotal').textContent = '—';
  }
}

function renderSalesPage() {
  const tbody = $('salesTableBody');
  if (salesData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="sales-empty">No sales today</td></tr>';
    $('salesPageInfo').textContent = '0 / 0';
    return;
  }
  const totalPages = Math.ceil(salesData.length / ITEMS_PER_PAGE);
  const start = (salesPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageData = salesData.slice(start, end);
  tbody.innerHTML = pageData.map(s => `
    <tr>
      <td>${s.name}</td>
      <td>${s.phone}</td>
      <td>${s.address}</td>
    </tr>
  `).join('');
  $('salesPageInfo').textContent = `${salesPage} / ${totalPages}`;
}

function changeSalesPage(dir) {
  const totalPages = Math.ceil(salesData.length / ITEMS_PER_PAGE);
  salesPage = Math.max(1, Math.min(totalPages, salesPage + dir));
  renderSalesPage();
}

// ── LOAD CALLBACKS ───────────────────────────────────────────────────────────
async function loadCallbacks() {
  try {
    const data = await jsonp(`${APPS_SCRIPT_URL}?action=getCallbacks&agent=${encodeURIComponent(AGENT_NAME)}`);
    callbackData = data.callbacks || [];
    $('callbackTotal').textContent = callbackData.length;
    callbackPage = 1;
    renderCallbackPage();
  } catch (e) {
    console.error('Callback load error:', e);
    $('callbackTableBody').innerHTML = '<tr><td colspan="4" class="sales-empty">Failed to load</td></tr>';
    $('callbackTotal').textContent = '—';
  }
}

function renderCallbackPage() {
  const tbody = $('callbackTableBody');
  if (callbackData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="sales-empty">No callbacks</td></tr>';
    $('callbackPageInfo').textContent = '0 / 0';
    return;
  }
  const totalPages = Math.ceil(callbackData.length / ITEMS_PER_PAGE);
  const start = (callbackPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageData = callbackData.slice(start, end);
  tbody.innerHTML = pageData.map(c => `
    <tr>
      <td>${c.name}</td>
      <td>${c.phone}</td>
      <td style="white-space: normal; max-width: 200px;">${c.remarks || '—'}</td>
      <td><button class="btn-call" onclick="callLead(${c.row})"><span class="material-symbols-outlined">phone_callback</span>Call</button></td>
    </tr>
  `).join('');
  $('callbackPageInfo').textContent = `${callbackPage} / ${totalPages}`;
}

function changeCallbackPage(dir) {
  const totalPages = Math.ceil(callbackData.length / ITEMS_PER_PAGE);
  callbackPage = Math.max(1, Math.min(totalPages, callbackPage + dir));
  renderCallbackPage();
}

async function callLead(row) {
  if (callActive) {
    showToast('Please end current call first', 'error');
    return;
  }
  try {
    const data = await jsonp(`${APPS_SCRIPT_URL}?action=getLeadByRow&row=${row}&agent=${encodeURIComponent(AGENT_NAME)}`);
    if (data.lead) {
      populateLead(data.lead);
    } else {
      showToast('Lead not found', 'error');
    }
  } catch (e) {
    showToast('Failed to load lead', 'error');
    console.error('callLead error:', e);
  }
}

// ── UTILS ─────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── INIT ──────────────────────────────────────────────────────────────────
loadProvinces();
updateLeadsCount();
loadTodaySales();
loadCallbacks();
