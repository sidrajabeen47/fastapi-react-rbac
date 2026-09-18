// Automatically picks up localhost or Render backend depending on environment
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";


export const getStoredToken = () => localStorage.getItem("access_token");
export const getStoredUser = () => {
  const user = localStorage.getItem("user_data");
  return user ? JSON.parse(user) : null;
};

export const clearSession = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_data");
};

/**
 * Universal fetch wrapper that injects JWT Bearer token into headers
 */
export async function apiFetch(endpoint, options = {}) {
  const token = getStoredToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If token expired, clear session and notify
    if (response.status === 401) {
      clearSession();
    }
    const errorMsg = data.detail || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// --- Specific API helpers ---

// 1. Public Auth Endpoints (No Lock)
export async function apiLogin(email, password) {
  const data = await apiFetch("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user_data", JSON.stringify(data));
  return data;
}

export async function apiSignup(name, email, password) {
  const data = await apiFetch("/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user_data", JSON.stringify(data));
  return data;
}

// 2. Locked Endpoints (/api/v1 prefix)
export async function apiGetCurrentUser() {
  return await apiFetch("/api/v1/users/me");
}

export async function apiGetUsers() {
  return await apiFetch("/api/v1/users");
}

export async function apiGetRoles() {
  return await apiFetch("/api/v1/roles");
}

export async function apiAssignRole(userId, roleId) {
  return await apiFetch(`/api/v1/users/${userId}/roles`, {
    method: "POST",
    body: JSON.stringify({ role_id: roleId }),
  });
}

export async function apiRemoveRole(userId, roleId) {
  return await apiFetch(`/api/v1/users/${userId}/roles/${roleId}`, {
    method: "DELETE",
  });
}