import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://fastapi-user-roles-api.onrender.com';

// --------------------------------------------------
// Dynamic High-Contrast Role Badge Color Generator
// --------------------------------------------------
const getRoleBadgeStyle = (roleName) => {
  const name = (roleName || '').trim();
  const lower = name.toLowerCase();

  // Primary Anchor Roles
  if (lower === 'admin') {
    return { backgroundColor: '#4f46e5', color: '#ffffff', border: '1px solid #6366f1' }; // Indigo
  }
  if (lower === 'editor') {
    return { backgroundColor: '#d97706', color: '#ffffff', border: '1px solid #f59e0b' }; // Amber
  }

  // Vivid Palette for ALL other custom/future roles
  const palette = [
    { bg: '#0d9488', border: '#14b8a6' }, // Teal
    { bg: '#db2777', border: '#f472b6' }, // Pink/Rose
    { bg: '#059669', border: '#10b981' }, // Emerald
    { bg: '#0284c7', border: '#38bdf8' }, // Sky Blue
    { bg: '#7c3aed', border: '#a78bfa' }, // Violet
    { bg: '#ea580c', border: '#fb923c' }, // Orange
    { bg: '#2563eb', border: '#60a5fa' }, // Blue
    { bg: '#9333ea', border: '#c084fc' }, // Purple
    { bg: '#0891b2', border: '#22d3ee' }, // Cyan
  ];

  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }

  const item = palette[Math.abs(hash) % palette.length];
  return {
    backgroundColor: item.bg,
    color: '#ffffff',
    border: `1px solid ${item.border}`,
  };
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

  // Fetch Directory Data
  const fetchData = async (currentToken = token) => {
    if (!currentToken) return;
    try {
      const [resUsers, resRoles] = await Promise.all([
        fetch(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        }),
        fetch(`${API_BASE}/roles`, {
          headers: { Authorization: `Bearer ${currentToken}` },
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
      console.error('Fetch directory error:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData(token);
    }
  }, [token]);

  // Auth Submit with automatic endpoint fallback
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authMode === 'register') {
        const payload = JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
        });

        // Try /signup first, fallback to /auth/register
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

        setSuccessMsg('Account registered successfully! Please sign in.');
        setAuthMode('login');
      } else {
        const formData = new URLSearchParams();
        formData.append('username', email.trim());
        formData.append('password', password);

        // Try /token first, fallback to /auth/token
        let res = await fetch(`${API_BASE}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        if (res.status === 404) {
          res = await fetch(`${API_BASE}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
          });
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Invalid email or password');

        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);

        // Fetch User Info
        let meRes = await fetch(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });

        if (meRes.status === 404) {
          meRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
          });
        }

        if (meRes.ok) {
          const meData = await meRes.json();
          localStorage.setItem('currentUser', JSON.stringify(meData));
          setCurrentUser(meData);
        }

        fetchData(data.access_token);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network request failed');
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
      fetchData(token);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const isAdmin = currentUser?.roles?.some(
    (r) => (r.name || r).toLowerCase() === 'admin'
  );

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    boxSizing: 'border-box',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '430px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '36px 32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
    boxSizing: 'border-box',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '16px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    color: '#94a3b8',
    marginBottom: '6px',
    textTransform: 'uppercase',
  };

  // --------------------------------------------------
  // Screen 1: Auth Screen
  // --------------------------------------------------
  if (!token) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              🛡️
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>
              AuthGuard Console
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
              Identity &amp; Role Management
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              backgroundColor: '#0f172a',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '22px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                flex: 1,
                padding: '9px 0',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: authMode === 'login' ? '#4f46e5' : 'transparent',
                color: authMode === 'login' ? '#ffffff' : '#94a3b8',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                flex: 1,
                padding: '9px 0',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: authMode === 'register' ? '#4f46e5' : 'transparent',
                color: authMode === 'register' ? '#ffffff' : '#94a3b8',
              }}
            >
              Register
            </button>
          </div>

          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(153, 27, 27, 0.35)',
                border: '1px solid #b91c1c',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#fca5a5',
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                backgroundColor: 'rgba(6, 95, 70, 0.35)',
                border: '1px solid #059669',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#6ee7b7',
              }}
            >
              ✓ {successMsg}
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
                marginTop: '6px',
              }}
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
  // Screen 2: Dashboard Table with Vivid Badges
  // --------------------------------------------------
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        padding: '40px 24px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '24px',
            borderBottom: '1px solid #334155',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800' }}>
              User &amp; Role Directory
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
              <span>
                Signed in as: <strong style={{ color: '#ffffff' }}>{currentUser?.full_name || currentUser?.email}</strong>
              </span>
              {currentUser?.roles?.map((r) => (
                <span
                  key={r.id || r.name || r}
                  style={{
                    ...getRoleBadgeStyle(r.name || r),
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}
                >
                  {r.name || r}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>

        {successMsg && (
          <div
            style={{
              backgroundColor: 'rgba(6, 95, 70, 0.35)',
              border: '1px solid #059669',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
              fontSize: '13px',
              color: '#6ee7b7',
              marginBottom: '20px',
            }}
          >
            ✓ {successMsg}
          </div>
        )}

        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: '#0f172a',
                  borderBottom: '1px solid #334155',
                  color: '#94a3b8',
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '16px 20px' }}>UID</th>
                <th style={{ padding: '16px 20px' }}>NAME</th>
                <th style={{ padding: '16px 20px' }}>EMAIL</th>
                <th style={{ padding: '16px 20px' }}>ASSIGNED ROLES</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>ADMIN ACTION</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '16px 20px', color: '#818cf8', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    #{u.id}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#ffffff', fontWeight: '600' }}>
                    {u.full_name || '—'}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {u.roles && u.roles.length > 0 ? (
                        u.roles.map((r) => (
                          <span
                            key={r.id || r.name || r}
                            style={{
                              ...getRoleBadgeStyle(r.name || r),
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                            }}
                          >
                            {r.name || r}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '12px' }}>
                          Unassigned
                        </span>
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
                        style={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#ffffff',
                          padding: '7px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="" disabled>+ Assign Role...</option>
                        {roles.map((r) => (
                          <option key={r.id || r.name} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ color: '#475569', fontStyle: 'italic', fontSize: '12px' }}>
                        Restricted
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}