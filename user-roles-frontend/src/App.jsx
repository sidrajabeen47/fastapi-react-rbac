import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://fastapi-user-roles-api.onrender.com';

// Dynamic Colorful Badges: Har role ko unique bright color milega
const getRoleBadgeStyle = (roleName) => {
  const name = (roleName || '').trim();
  const lower = name.toLowerCase();

  if (lower === 'admin') {
    return 'background: #6366f1; color: #ffffff; border: 1px solid #818cf8;';
  }
  if (lower === 'editor') {
    return 'background: #d97706; color: #ffffff; border: 1px solid #f59e0b;';
  }
  if (lower === 'developer') {
    return 'background: #0d9488; color: #ffffff; border: 1px solid #14b8a6;';
  }
  if (lower === 'hacker') {
    return 'background: #db2777; color: #ffffff; border: 1px solid #f472b6;';
  }
  if (lower.includes('sentinel') || lower.includes('cyber')) {
    return 'background: #059669; color: #ffffff; border: 1px solid #10b981;';
  }

  // Any other custom role palette
  const colors = [
    { bg: '#7c3aed', b: '#a78bfa' }, // Purple
    { bg: '#0284c7', b: '#38bdf8' }, // Sky Blue
    { bg: '#ea580c', b: '#fb923c' }, // Orange
    { bg: '#2563eb', b: '#60a5fa' }, // Blue
  ];

  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  const item = colors[Math.abs(hash) % colors.length];
  return `background: ${item.bg}; color: #ffffff; border: 1px solid ${item.b};`;
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('currentUser') || 'null')
  );
  const [authMode, setAuthMode] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const fetchData = async (activeToken = token) => {
    if (!activeToken) return;
    try {
      const [resUsers, resRoles] = await Promise.all([
        fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${activeToken}` } }),
        fetch(`${API_BASE}/roles`, { headers: { Authorization: `Bearer ${activeToken}` } }),
      ]);

      if (resUsers.ok && resRoles.ok) {
        setUsers(await resUsers.json());
        setRoles(await resRoles.json());
      } else if (resUsers.status === 401) {
        handleSignOut();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData(token);
    }
  }, [token]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authMode === 'register') {
        const payload = JSON.stringify({ email: email.trim(), password, full_name: fullName.trim() });
        let res = await fetch(`${API_BASE}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
        if (res.status === 404) {
          res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          });
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registration failed');
        setSuccessMsg('Registration successful! Please login.');
        setAuthMode('login');
      } else {
        const payload = JSON.stringify({ email: email.trim(), password });
        let res = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });

        if (res.status === 404 || res.status === 422) {
          const form = new URLSearchParams();
          form.append('username', email.trim());
          form.append('password', password);
          res = await fetch(`${API_BASE}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
          });
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Invalid email or password');

        const activeToken = data.access_token || data.token;
        localStorage.setItem('token', activeToken);
        setToken(activeToken);

        if (data.user) {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          setCurrentUser(data.user);
        } else {
          let meRes = await fetch(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            localStorage.setItem('currentUser', JSON.stringify(meData));
            setCurrentUser(meData);
          }
        }
        fetchData(activeToken);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Action failed');
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

  const handleAssignRole = async (userId, roleName) => {
    if (!roleName) return;
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role_name: roleName }),
      });
      if (res.ok) {
        setSuccessMsg('Role clearance updated successfully!');
        fetchData(token);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = currentUser?.roles?.some((r) => (r.name || r).toLowerCase() === 'admin');

  // VIEW 1: Login / Signup
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#1e1b4b]">
        <div className="w-full max-w-md bg-[#2e2a72]/90 border border-indigo-500/30 rounded-2xl shadow-2xl p-8 text-white">
          <div className="text-center mb-6">
            <span className="text-3xl">🛡️</span>
            <h1 className="text-2xl font-bold mt-2">AuthGuard Console</h1>
            <p className="text-xs text-indigo-200 mt-1">Identity &amp; Role Management</p>
          </div>

          <div className="flex bg-[#1e1b4b]/80 p-1 rounded-xl mb-6 border border-indigo-900/50">
            <button
              onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-300'
              }`}
            >
              Register
            </button>
          </div>

          {errorMsg && <div className="mb-4 p-3 bg-rose-950/60 border border-rose-700 text-rose-200 text-xs rounded-xl">⚠️ {errorMsg}</div>}
          {successMsg && <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs rounded-xl">✓ {successMsg}</div>}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-indigo-200 tracking-wider mb-1 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 bg-[#16143c] border border-indigo-500/40 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-indigo-200 tracking-wider mb-1 uppercase">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-[#16143c] border border-indigo-500/40 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-indigo-200 tracking-wider mb-1 uppercase">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#16143c] border border-indigo-500/40 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-all"
            >
              {loading ? 'Processing...' : authMode === 'login' ? 'Sign In to Portal →' : 'Create Account →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VIEW 2: Beautiful Directory Dashboard
  return (
    <div className="min-h-screen bg-[#1e1b4b] text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center pb-6 border-b border-indigo-900/50">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">User &amp; Role Directory</h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-indigo-200">
              <span>Signed in as: <strong className="text-white">{currentUser?.full_name || currentUser?.email}</strong></span>
              {currentUser?.roles?.map((r) => (
                <span
                  key={r.id || r.name || r}
                  style={{ cssText: getRoleBadgeStyle(r.name || r) }}
                  className="px-2.5 py-0.5 rounded-md text-xs font-bold shadow-sm inline-block ml-1"
                >
                  {r.name || r}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-[#2e2a72] hover:bg-indigo-700 border border-indigo-500/40 rounded-xl text-xs font-bold text-white transition-all shadow-md"
          >
            Sign Out
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-900/50 border border-emerald-500 rounded-xl text-emerald-200 text-center text-xs font-semibold">
            ✓ {successMsg}
          </div>
        )}

        {/* Directory Table */}
        <div className="bg-[#2a2663]/90 border border-indigo-500/30 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#1a1740] border-b border-indigo-900/60 text-[11px] uppercase tracking-wider text-indigo-300">
                <th className="py-4 px-6 font-bold">UID</th>
                <th className="py-4 px-6 font-bold">NAME</th>
                <th className="py-4 px-6 font-bold">EMAIL</th>
                <th className="py-4 px-6 font-bold">ASSIGNED ROLES</th>
                <th className="py-4 px-6 font-bold text-right">ADMIN ACTION: ASSIGN ROLE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-950/60">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-indigo-300 italic">
                    No users found. (Create accounts or sign in as Admin to manage).
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-indigo-900/20 transition-colors">
                    <td className="py-4 px-6 font-bold text-indigo-400 font-mono">#{u.id}</td>
                    <td className="py-4 px-6 font-bold text-white text-sm">{u.full_name || '—'}</td>
                    <td className="py-4 px-6 text-indigo-200 font-mono">{u.email}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r) => (
                            <span
                              key={r.id || r.name || r}
                              style={{ cssText: getRoleBadgeStyle(r.name || r) }}
                              className="px-3 py-1 rounded-md text-xs font-bold tracking-wide shadow"
                            >
                              {r.name || r}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-xs">Unassigned</span>
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
                          className="bg-[#16143c] border border-indigo-500/40 text-white text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                        >
                          <option value="" disabled>+ Assign Role...</option>
                          {roles.map((r) => (
                            <option key={r.id || r.name} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-indigo-400/60 italic text-xs">Restricted</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}