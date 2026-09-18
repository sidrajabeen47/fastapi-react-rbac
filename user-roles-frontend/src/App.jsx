import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://fastapi-user-roles-api.onrender.com';

const getRoleBadgeStyle = (roleName) => {
  const name = (roleName || '').trim();
  const lower = name.toLowerCase();

  let bg = '#4f46e5';
  let border = '#6366f1';

  if (lower === 'admin') {
    bg = '#4338ca';
    border = '#6366f1';
  } else if (lower === 'editor') {
    bg = '#b45309';
    border = '#f59e0b';
  } else if (lower === 'developer') {
    bg = '#0f766e';
    border = '#14b8a6';
  } else if (lower === 'hacker') {
    bg = '#be185d';
    border = '#f472b6';
  } else if (lower.includes('sentinel') || lower.includes('cyber')) {
    bg = '#047857';
    border = '#10b981';
  } else {
    const palette = [
      { bg: '#6d28d9', border: '#a78bfa' },
      { bg: '#0369a1', border: '#38bdf8' },
      { bg: '#c2410c', border: '#fb923c' },
      { bg: '#1d4ed8', border: '#60a5fa' }
    ];
    let hash = 0;
    for (let i = 0; i < lower.length; i++) {
      hash = lower.charCodeAt(i) + ((hash << 5) - hash);
    }
    const item = palette[Math.abs(hash) % palette.length];
    bg = item.bg;
    border = item.border;
  }

  return {
    backgroundColor: bg,
    color: '#ffffff',
    border: '1px solid ' + border,
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-block',
    letterSpacing: '0.02em',
    textTransform: 'uppercase'
  };
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch {
      return null;
    }
  });
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
        fetch(`${API_BASE}/api/v1/users`, { headers: { Authorization: `Bearer ${activeToken}` } }),
        fetch(`${API_BASE}/api/v1/roles`, { headers: { Authorization: `Bearer ${activeToken}` } })
      ]);

      if (resUsers.ok) {
        setUsers(await resUsers.json());
      }
      if (resRoles.ok) {
        setRoles(await resRoles.json());
      }
      if (resUsers.status === 401) {
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
        const res = await fetch(`${API_BASE}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password, name: fullName.trim(), full_name: fullName.trim() })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registration failed');
        setSuccessMsg('Registration successful! Please sign in.');
        setAuthMode('login');
      } else {
        const res = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Invalid email or password');

        const activeToken = data.access_token || data.token;
        localStorage.setItem('token', activeToken);
        setToken(activeToken);

        if (data.user) {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          setCurrentUser(data.user);
        } else {
          const meRes = await fetch(`${API_BASE}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${activeToken}` }
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

  // UPDATE 1: roleId le kar body me integer bhejna (422 fix)
  const handleAssignRole = async (userId, roleId) => {
    if (!roleId) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role_id: parseInt(roleId, 10) })
      });
      if (res.ok) {
        setSuccessMsg('Role assigned successfully!');
        fetchData(token);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.detail || 'Failed to assign role');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = currentUser?.roles?.some((r) => (r.name || r).toLowerCase() === 'admin');

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '36px', boxSizing: 'border-box' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🛡️</span>
            <h1 style={{ color: '#ffffff', fontSize: '24px', fontWeight: '800', margin: '0 0 6px' }}>AuthGuard Console</h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Role-Based Access Control</p>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#0f172a', padding: '4px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #334155' }}>
            <button
              onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', color: '#ffffff', backgroundColor: authMode === 'login' ? '#4f46e5' : 'transparent' }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', color: '#ffffff', backgroundColor: authMode === 'register' ? '#4f46e5' : 'transparent' }}
            >
              Register
            </button>
          </div>

          {errorMsg && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>⚠️ {errorMsg}</div>}
          {successMsg && <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#6ee7b7', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>✓ {successMsg}</div>}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {authMode === 'register' && (
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Work Email</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', backgroundColor: '#4f46e5', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', marginTop: '6px' }}
            >
              {loading ? 'Processing...' : authMode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: '36px 24px', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid #334155', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px', color: '#ffffff' }}>User &amp; Role Directory</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
              <span>Signed in as: <strong style={{ color: '#ffffff' }}>{currentUser?.name || currentUser?.full_name || currentUser?.email}</strong></span>
              {currentUser?.roles?.map((r, i) => (
                <span key={i} style={getRoleBadgeStyle(r.name || r)}>
                  {r.name || r}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{ padding: '8px 16px', backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '8px', color: '#ffffff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>

        {successMsg && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#6ee7b7', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textAlign: 'center', marginBottom: '20px' }}>
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textAlign: 'center', marginBottom: '20px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '11px', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 20px' }}>UID</th>
                <th style={{ padding: '16px 20px' }}>NAME</th>
                <th style={{ padding: '16px 20px' }}>EMAIL</th>
                <th style={{ padding: '16px 20px' }}>ASSIGNED ROLES</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>ADMIN ACTION</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '16px 20px', color: '#818cf8', fontWeight: '700', fontFamily: 'monospace' }}>
                      #{u.id}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#ffffff', fontWeight: '600' }}>
                      {u.name || u.full_name || '—'}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r, idx) => (
                            <span key={idx} style={getRoleBadgeStyle(r.name || r)}>
                              {r.name || r}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '12px' }}>Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      {isAdmin ? (
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignRole(u.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff', padding: '7px 12px', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
                        >
                          <option value="" disabled>+ Assign Role...</option>
                          {/* UPDATE 2: value me role.id pass kar rahe hain */}
                          {roles.map((r) => (
                            <option key={r.id || r.name} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '12px' }}>Restricted</span>
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