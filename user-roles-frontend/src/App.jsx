import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://fastapi-user-roles-api.onrender.com';

// --------------------------------------------------
// Deterministic Dynamic Color Generator for ALL Roles
// --------------------------------------------------
const getRoleBadgeStyle = (roleName) => {
  const name = (roleName || '').trim();
  const lower = name.toLowerCase();

  // 1. Signature anchors for core roles
  if (lower === 'admin') {
    return { backgroundColor: '#4f46e5', color: '#ffffff', border: '1px solid #6366f1' }; // Electric Indigo
  }
  if (lower === 'editor') {
    return { backgroundColor: '#d97706', color: '#ffffff', border: '1px solid #f59e0b' }; // Amber
  }

  // 2. High-contrast vivid palette for ANY current or newly created role
  const palette = [
    { bg: '#0d9488', border: '#14b8a6' }, // Teal
    { bg: '#db2777', border: '#f472b6' }, // Neon Rose / Pink
    { bg: '#059669', border: '#10b981' }, // Emerald Green
    { bg: '#0284c7', border: '#38bdf8' }, // Sky Blue
    { bg: '#7c3aed', border: '#a78bfa' }, // Vivid Violet
    { bg: '#ea580c', border: '#fb923c' }, // Deep Orange
    { bg: '#2563eb', border: '#60a5fa' }, // Cobalt Blue
    { bg: '#9333ea', border: '#c084fc' }, // Purple
    { bg: '#0891b2', border: '#22d3ee' }, // Cyan
  ];

  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % palette.length;
  const item = palette[index];

  return {
    backgroundColor: item.bg,
    color: '#ffffff',
    border: `1px solid ${item.border}`,
  };
};

export default function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('currentUser') || 'null')
  );
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // UI state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Directory Data
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  // Fetch Directory Data when logged in
  const fetchData = async () => {
    if (!token) return;
    try {
      const [resUsers, resRoles] = await Promise.all([
        fetch(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resUsers.ok && resRoles.ok) {
        const uData = await resUsers.json();
        const rData = await resRoles.json();
        setUsers(uData);
        setRoles(rData);
      } else if (resUsers.status === 401 || resRoles.status === 401) {
        handleSignOut();
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Auth Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authMode === 'register') {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
            full_name: fullName.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registration failed');

        setSuccessMsg('Account registered successfully! Please sign in.');
        setAuthMode('login');
      } else {
        const formData = new URLSearchParams();
        formData.append('username', email.trim());
        formData.append('password', password);

        const res = await fetch(`${API_BASE}/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Invalid email or password');

        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);

        // Fetch current user details
        const meRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          localStorage.setItem('currentUser', JSON.stringify(meData));
          setCurrentUser(meData);
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setToken('');
    setCurrentUser(null);
    setUsers([]);
    setRoles([]);
  };

  // Role Assignment (Admin Only)
  const handleAssignRole = async (userId, roleName) => {
    if (!roleName) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role_name: roleName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update role');

      setSuccessMsg('Role clearance updated successfully!');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const isAdmin = currentUser?.roles?.some(
    (r) => (r.name || r).toLowerCase() === 'admin'
  );

  // --------------------------------------------------
  // View 1: Auth Screen
  // --------------------------------------------------
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
        <div className="w-full max-w-md bg-[#1e293b]/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-3">
              <span className="text-2xl">🛡️</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">AuthGuard Console</h1>
            <p className="text-xs text-slate-400 mt-1">Identity & Role Management</p>
          </div>

          <div className="flex bg-[#0f172a]/80 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-300 tracking-wider mb-1.5 uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 bg-[#0f172a]/60 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-300 tracking-wider mb-1.5 uppercase">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-[#0f172a]/60 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 tracking-wider mb-1.5 uppercase">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#0f172a]/60 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              {loading
                ? 'Processing...'
                : authMode === 'login'
                ? 'Sign In to Portal →'
                : 'Create Account (Unassigned) →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // View 2: User & Role Directory Dashboard
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6 md:p-10 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              User &amp; Role Directory
            </h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-400">
              <span>Signed in as: <strong className="text-white">{currentUser?.full_name || currentUser?.email}</strong></span>
              {currentUser?.roles?.map((r) => (
                <span
                  key={r.id || r.name}
                  style={getRoleBadgeStyle(r.name || r)}
                  className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                >
                  {r.name || r}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm"
          >
            Sign Out
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/70 rounded-xl text-emerald-300 text-xs font-medium flex items-center justify-center gap-2">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-red-950/40 border border-red-800/70 rounded-xl text-red-300 text-xs font-medium flex items-center justify-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Directory Table */}
        <div className="bg-[#1e293b]/70 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0f172a]/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6 font-semibold">UID</th>
                  <th className="py-4 px-6 font-semibold">Name</th>
                  <th className="py-4 px-6 font-semibold">Email</th>
                  <th className="py-4 px-6 font-semibold">Assigned Roles</th>
                  <th className="py-4 px-6 font-semibold text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-mono font-medium text-indigo-400">
                      #{u.id}
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">
                      {u.full_name || '—'}
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono">
                      {u.email}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r) => (
                            <span
                              key={r.id || r.name}
                              style={getRoleBadgeStyle(r.name || r)}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide shadow-sm"
                            >
                              {r.name || r}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {isAdmin ? (
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignRole(u.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="bg-[#0f172a] hover:bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                        >
                          <option value="" disabled>+ Assign Role...</option>
                          {roles.map((r) => (
                            <option key={r.id || r.name} value={r.name}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-600 text-[11px] italic">Restricted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}