const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = 'lovepdf_admin_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const authHeaders = () => ({ Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' });

async function handle(res) {
  if (res.status === 401) { clearToken(); throw new Error('Your session has expired. Please log in again.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Something went wrong. Please try again.');
  return data;
}

export const adminApi = {
  login: (email, password) => fetch(`${BASE}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then(handle),
  me: () => fetch(`${BASE}/admin/me`, { headers: authHeaders() }).then(handle),
  changePassword: (current_password, new_password) => fetch(`${BASE}/admin/change-password`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ current_password, new_password }) }).then(handle),
  listSeoPages: () => fetch(`${BASE}/admin/seo/pages`, { headers: authHeaders() }).then(handle),
  saveSeoPage: (payload) => fetch(`${BASE}/admin/seo/pages`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) }).then(handle),
  getSite: () => fetch(`${BASE}/admin/site`, { headers: authHeaders() }).then(handle),
  saveSite: (payload) => fetch(`${BASE}/admin/site`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) }).then(handle),
  listBlog: () => fetch(`${BASE}/admin/blog`, { headers: authHeaders() }).then(handle),
  createBlog: (payload) => fetch(`${BASE}/admin/blog`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) }).then(handle),
  updateBlog: (id, payload) => fetch(`${BASE}/admin/blog/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) }).then(handle),
  deleteBlog: (id) => fetch(`${BASE}/admin/blog/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
};

export const publicApi = {
  blogList: () => fetch(`${BASE}/blog`).then((r) => r.json()),
  blogPost: (slug) => fetch(`${BASE}/blog/${slug}`).then(async (r) => { if (!r.ok) throw new Error('not found'); return r.json(); }),
};
