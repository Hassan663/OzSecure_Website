// Admin API client — talks to the Express backend at NEXT_PUBLIC_API_URL.
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const TOKEN_KEY = 'oz_admin_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(t) {
  try {
    localStorage.setItem(TOKEN_KEY, t);
  } catch {
    /* ignore */
  }
}
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function login(password) {
  const res = await fetch(`${API}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.message || 'Login failed');
  setToken(data.token);
  return data.token;
}

/** Authed request to /api/admin/*. Throws {code:401} on auth failure. */
export async function adminFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API}/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token || ''}`,
    },
  });
  if (res.status === 401) {
    clearToken();
    const err = new Error('Session expired. Please log in again.');
    err.code = 401;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.message || 'Request failed');
  return data;
}
