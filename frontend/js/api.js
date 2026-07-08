const API_BASE = '/api';

const api = {
  async get(path) {
    const res = await fetch(API_BASE + path);
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async post(path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API_BASE + path, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async put(path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API_BASE + path, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async delete(path, token) {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API_BASE + path, { method: 'DELETE', headers });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async patch(path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API_BASE + path, { method: 'PATCH', headers, body: JSON.stringify(body) });
    if (!res.ok) throw await res.json();
    return res.json();
  }
};

function formatRupiah(amount) {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}
