import React, { useState, useEffect } from "react";
import { 
  apiLogin, 
  apiSignup, 
  apiGetUsers, 
  apiGetRoles, 
  apiAssignRole,
  getStoredUser, 
  clearSession 
} from "./api";

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setError("");
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        apiGetUsers(),
        apiGetRoles()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      let userData;
      if (isSignUp) {
        userData = await apiSignup(name, email, password);
      } else {
        userData = await apiLogin(email, password);
      }
      setCurrentUser(userData);
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (userId, roleId) => {
    if (!roleId) return;
    setError("");
    setSuccessMsg("");

    try {
      await apiAssignRole(userId, parseInt(roleId));
      setSuccessMsg("Role clearance updated successfully!");
      loadDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setUsers([]);
    setRoles([]);
  };

  const isAdmin = currentUser?.role === "Admin";

  const getRoleBadgeStyle = (roleName) => {
    switch (roleName) {
      case "Admin":
        return { background: "#4338ca", color: "#e0e7ff", border: "1px solid #6366f1" };
      case "Security Analyst":
        return { background: "#0369a1", color: "#e0f2fe", border: "1px solid #38bdf8" };
      case "Cipher Cadet":
        return { background: "#15803d", color: "#dcfce7", border: "1px solid #4ade80" };
      case "Editor":
        return { background: "#b45309", color: "#fef3c7", border: "1px solid #f59e0b" };
      default:
        return { background: "#334155", color: "#94a3b8", border: "1px solid #475569" };
    }
  };

  return (
    <div className="aurora-scope">
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
        }

        body {
          background-color: #1e1b4b;
          color: #f8fafc;
        }

        .aurora-scope {
          min-height: 100vh;
          width: 100vw;
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #1e293b 70%, #0f172a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 36px 20px;
        }

        /* ---------------- AUTH CARD ---------------- */
        .glass-auth-box {
          width: 100%;
          max-width: 440px;
          background: linear-gradient(180deg, rgba(30, 27, 75, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(129, 140, 248, 0.3);
          border-radius: 20px;
          padding: 40px 34px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.25);
        }

        .logo-glow {
          width: 50px;
          height: 50px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.45);
        }

        .auth-head-title {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          text-align: center;
          letter-spacing: -0.4px;
        }

        .auth-head-sub {
          font-size: 13px;
          color: #c7d2fe;
          text-align: center;
          margin-top: 6px;
          margin-bottom: 26px;
        }

        .tab-wrap {
          display: flex;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(129, 140, 248, 0.2);
          padding: 4px;
          border-radius: 10px;
          margin-bottom: 24px;
        }

        .tab-item {
          flex: 1;
          padding: 10px 0;
          font-size: 13px;
          font-weight: 600;
          color: #cbd5e1;
          background: transparent;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-item.active {
          background: #4f46e5;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
        }

        .input-title {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #e0e7ff;
          margin-bottom: 7px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .custom-field {
          width: 100%;
          padding: 12px 14px;
          background: rgba(15, 23, 42, 0.7);
          border: 1.5px solid rgba(129, 140, 248, 0.3);
          border-radius: 9px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
          margin-bottom: 16px;
        }

        .custom-field:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
          background: rgba(15, 23, 42, 0.95);
        }

        .action-cta {
          width: 100%;
          padding: 13px;
          margin-top: 6px;
          background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 9px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
        }

        .action-cta:hover {
          background: linear-gradient(135deg, #4338ca 0%, #1d4ed8 100%);
          transform: translateY(-1px);
        }

        .action-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .alert-error {
          background: rgba(220, 38, 38, 0.2);
          border: 1px solid rgba(248, 113, 113, 0.4);
          color: #fca5a5;
          padding: 11px 14px;
          border-radius: 9px;
          font-size: 13px;
          margin-bottom: 18px;
        }

        .alert-success {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(52, 211, 153, 0.4);
          color: #86efac;
          padding: 11px 14px;
          border-radius: 9px;
          font-size: 13px;
          margin-bottom: 18px;
        }

        /* ---------------- DASHBOARD ---------------- */
        .dash-indigo-card {
          width: 100%;
          max-width: 1120px;
          background: linear-gradient(180deg, rgba(30, 27, 75, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(129, 140, 248, 0.25);
          border-radius: 20px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 35px rgba(99, 102, 241, 0.15);
          overflow: hidden;
        }

        .dash-indigo-nav {
          padding: 24px 32px;
          background: rgba(49, 46, 129, 0.35);
          border-bottom: 1px solid rgba(129, 140, 248, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dash-heading-main {
          font-size: 21px;
          font-weight: 700;
          color: #ffffff;
        }

        .dash-subhead {
          font-size: 13px;
          color: #c7d2fe;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .user-tag {
          color: #ffffff;
          font-weight: 600;
        }

        .role-chip {
          background: rgba(99, 102, 241, 0.25);
          color: #c7d2fe;
          border: 1px solid rgba(129, 140, 248, 0.4);
          font-size: 12px;
          font-weight: 600;
          padding: 2px 9px;
          border-radius: 6px;
        }

        .exit-btn {
          background: rgba(15, 23, 42, 0.6);
          border: 1.5px solid rgba(129, 140, 248, 0.3);
          color: #f8fafc;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .exit-btn:hover {
          background: #ef4444;
          border-color: #ef4444;
        }

        .grid-wrapper {
          padding: 28px 32px;
        }

        .indigo-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .indigo-table th {
          text-align: left;
          color: #c7d2fe;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(129, 140, 248, 0.2);
          background: rgba(49, 46, 129, 0.2);
        }

        .indigo-table td {
          padding: 15px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #f1f5f9;
        }

        .indigo-table tr:hover td {
          background: rgba(99, 102, 241, 0.08);
        }

        .badge-style {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          margin-right: 4px;
        }

        .unassigned-badge {
          color: #94a3b8;
          font-style: italic;
          font-size: 12px;
        }

        .role-picker {
          background: rgba(15, 23, 42, 0.9);
          color: #ffffff;
          border: 1.5px solid rgba(129, 140, 248, 0.3);
          border-radius: 7px;
          padding: 7px 12px;
          font-size: 12px;
          outline: none;
          cursor: pointer;
        }

        .role-picker:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      {/* VIEW 1: SIGN IN / SIGN UP */}
      {!currentUser ? (
        <div className="glass-auth-box">
          <div className="logo-glow">🛡️</div>
          <h1 className="auth-head-title">AuthGuard Console</h1>
          <p className="auth-head-sub">Identity & Role Management</p>

          <div className="tab-wrap">
            <button 
              className={`tab-item ${!isSignUp ? "active" : ""}`}
              onClick={() => { setIsSignUp(false); setError(""); setSuccessMsg(""); }}
            >
              Sign In
            </button>
            <button 
              className={`tab-item ${isSignUp ? "active" : ""}`}
              onClick={() => { setIsSignUp(true); setError(""); setSuccessMsg(""); }}
            >
              Register
            </button>
          </div>

          {error && <div className="alert-error">⚠️ {error}</div>}
          {successMsg && <div className="alert-success">✓ {successMsg}</div>}

          <form onSubmit={handleAuthSubmit}>
            {isSignUp && (
              <div>
                <label className="input-title">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sidra Jabeen"
                  className="custom-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="input-title">Work Email</label>
              <input
                type="email"
                placeholder="name@example.com"
                className="custom-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ position: "relative" }}>
              <label className="input-title">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                className="custom-field"
                style={{ paddingRight: "44px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "36px",
                  background: "none",
                  border: "none",
                  color: "#cbd5e1",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>

            <button type="submit" className="action-cta" disabled={loading}>
              {loading ? "Authorizing..." : isSignUp ? "Create Account (Unassigned) →" : "Sign In →"}
            </button>
          </form>
        </div>
      ) : (
        /* VIEW 2: DASHBOARD */
        <div className="dash-indigo-card">
          <div className="dash-indigo-nav">
            <div>
              <h2 className="dash-heading-main">User & Role Directory</h2>
              <div className="dash-subhead">
                Signed in as: <span className="user-tag">{currentUser.user_name}</span>
                <span className="role-chip">{currentUser.role}</span>
                {!isAdmin && (
                  <span style={{ color: "#94a3b8", marginLeft: 4 }}>
                    (Read-Only: Admin role required to modify assignments)
                  </span>
                )}
              </div>
            </div>

            <button onClick={handleLogout} className="exit-btn">
              Sign Out
            </button>
          </div>

          <div className="grid-wrapper">
            {error && <div className="alert-error">⚠️ {error}</div>}
            {successMsg && <div className="alert-success">✓ {successMsg}</div>}

            {loading ? (
              <p style={{ color: "#c7d2fe", fontSize: 13 }}>Querying directory records...</p>
            ) : (
              <table className="indigo-table">
                <thead>
                  <tr>
                    <th style={{ borderRadius: "8px 0 0 8px" }}>UID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Assigned Roles</th>
                    <th style={{ borderRadius: "0 8px 8px 0" }}>Admin Action: Assign Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: "monospace", color: "#818cf8", fontWeight: 600 }}>
                        #{u.id}
                      </td>
                      <td style={{ fontWeight: 600, color: "#ffffff" }}>{u.name}</td>
                      <td style={{ color: "#cbd5e1" }}>{u.email}</td>
                      <td>
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r) => (
                            <span key={r.id} className="badge-style" style={getRoleBadgeStyle(r.name)}>
                              {r.name}
                            </span>
                          ))
                        ) : (
                          <span className="unassigned-badge">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <select
                          className="role-picker"
                          disabled={!isAdmin}
                          defaultValue=""
                          onChange={(e) => handleAssignRole(u.id, e.target.value)}
                        >
                          <option value="" disabled>
                            {isAdmin ? "+ Assign Role..." : "Admin Required"}
                          </option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}