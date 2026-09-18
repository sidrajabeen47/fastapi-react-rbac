import React, { useState } from "react";

const API_BASE = "https://fastapi-user-roles-api.onrender.com";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(
    localStorage.getItem("userName")
      ? {
          name: localStorage.getItem("userName"),
          role: localStorage.getItem("role"),
          token: localStorage.getItem("token"),
        }
      : null
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid email or password");
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userName", data.user_name);
      localStorage.setItem("role", data.role);

      setLoggedInUser({
        name: data.user_name,
        role: data.role,
        token: data.access_token,
      });
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Unable to reach server. Please wake the Render instance or verify network."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    setLoggedInUser(null);
  };

  return (
    <div style={styles.wrapper}>
      {/* Background Animated Glow Orbs */}
      <div style={{ ...styles.glowOrb, top: "-10%", left: "-10%", background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)" }} />
      <div style={{ ...styles.glowOrb, bottom: "-15%", right: "-5%", background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)" }} />
      <div style={{ ...styles.glowOrb, top: "40%", right: "20%", background: "radial-gradient(circle, rgba(14,165,233,0.25) 0%, transparent 70%)" }} />

      <div style={styles.container}>
        {loggedInUser ? (
          /* Profile & Session Card */
          <div style={styles.sessionCard}>
            <div style={styles.avatarRing}>
              <div style={styles.avatar}>
                {loggedInUser.name.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <span style={styles.statusPill}>
              <span style={styles.statusDot} /> Active Session
            </span>
            
            <h2 style={styles.welcomeHeading}>{loggedInUser.name}</h2>
            <p style={styles.welcomeSub}>Signed in as <span style={styles.roleHighlight}>{loggedInUser.role}</span></p>

            <div style={styles.terminalBox}>
              <div style={styles.terminalHeader}>
                <span style={{ ...styles.terminalDot, background: "#ef4444" }} />
                <span style={{ ...styles.terminalDot, background: "#f59e0b" }} />
                <span style={{ ...styles.terminalDot, background: "#10b981" }} />
                <span style={styles.terminalTitle}>Token Info</span>
              </div>
              <p style={styles.terminalText}><strong>Status:</strong> Authenticated (200 OK)</p>
              <p style={styles.terminalText}><strong>Storage:</strong> localStorage.token (Active)</p>
              <p style={styles.terminalText}><strong>Access:</strong> Level {loggedInUser.role}</p>
            </div>

            <button onClick={handleLogout} style={styles.logoutBtn}>
              Terminate Session
            </button>
          </div>
        ) : (
          /* Split Layout Card */
          <div style={styles.card}>
            {/* Left Brand Panel */}
            <div style={styles.brandPanel}>
              <div style={styles.brandHeader}>
                <div style={styles.logoBadge}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <span style={styles.brandName}>AuthGuard</span>
              </div>

              <div style={styles.brandHero}>
                <h1 style={styles.heroTitle}>Secure Identity & Role Management</h1>
                <p style={styles.heroDescription}>
                  High-speed API authentication backed by FastAPI and PostgreSQL cloud instances.
                </p>
              </div>

              <div style={styles.featureList}>
                <div style={styles.featureItem}>
                  <span style={styles.featureCheck}>✓</span>
                  <span>End-to-end JWT encryption</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={styles.featureCheck}>✓</span>
                  <span>Dynamic Role-Based Access</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={styles.featureCheck}>✓</span>
                  <span>Cloud DB synchronization</span>
                </div>
              </div>
            </div>

            {/* Right Form Panel */}
            <div style={styles.formPanel}>
              <div style={{ marginBottom: "28px" }}>
                <h2 style={styles.formHeading}>Sign In</h2>
                <p style={styles.formSubtitle}>Access your administrative workspace</p>
              </div>

              {error && (
                <div style={styles.errorBox}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} style={styles.form}>
                <div style={styles.inputContainer}>
                  <label style={styles.inputLabel}>Work Email</label>
                  <div style={styles.inputWrapper}>
                    <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                      <rect width="20" height="16" x="2" y="4" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={styles.fieldInput}
                    />
                  </div>
                </div>

                <div style={styles.inputContainer}>
                  <label style={styles.inputLabel}>Password</label>
                  <div style={styles.inputWrapper}>
                    <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={styles.fieldInput}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.primaryBtn,
                    opacity: loading ? 0.75 : 1,
                    cursor: loading ? "wait" : "pointer",
                  }}
                >
                  {loading ? (
                    <span style={styles.spinnerWrapper}>
                      <span style={styles.spinner} /> Authenticating...
                    </span>
                  ) : (
                    "Authorize & Log In →"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    backgroundColor: "#090d16",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
    padding: "24px",
    boxSizing: "border-box",
  },
  glowOrb: {
    position: "absolute",
    width: "550px",
    height: "550px",
    borderRadius: "50%",
    filter: "blur(90px)",
    pointerEvents: "none",
  },
  container: {
    width: "100%",
    maxWidth: "920px",
    zIndex: 1,
  },
  card: {
    display: "grid",
    gridTemplateColumns: "1fr 1.1fr",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
  },
  brandPanel: {
    padding: "48px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    background: "linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
    borderRight: "1px solid rgba(255, 255, 255, 0.08)",
  },
  brandHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoBadge: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 16px rgba(99, 102, 241, 0.3)",
  },
  brandName: {
    color: "#ffffff",
    fontSize: "19px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
  },
  brandHero: {
    margin: "40px 0",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: "28px",
    lineHeight: "1.25",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    marginBottom: "14px",
  },
  heroDescription: {
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: 0,
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#cbd5e1",
    fontSize: "13px",
  },
  featureCheck: {
    color: "#818cf8",
    fontWeight: "bold",
  },
  formPanel: {
    padding: "48px 44px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  formHeading: {
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "700",
    margin: "0 0 6px 0",
  },
  formSubtitle: {
    color: "#94a3b8",
    fontSize: "14px",
    margin: 0,
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#fca5a5",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  inputContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  inputLabel: {
    color: "#cbd5e1",
    fontSize: "12.5px",
    fontWeight: "600",
    letterSpacing: "0.2px",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    pointerEvents: "none",
  },
  fieldInput: {
    width: "100%",
    padding: "13px 48px 13px 44px",
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
  },
  eyeButton: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  primaryBtn: {
    width: "100%",
    padding: "13px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    marginTop: "8px",
    boxShadow: "0 10px 20px -5px rgba(99, 102, 241, 0.4)",
    transition: "all 0.2s ease",
  },
  spinnerWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #ffffff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  sessionCard: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "24px",
    padding: "44px 36px",
    textAlign: "center",
    maxWidth: "460px",
    margin: "0 auto",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
  },
  avatarRing: {
    width: "84px",
    height: "84px",
    borderRadius: "50%",
    padding: "3px",
    background: "linear-gradient(135deg, #6366f1, #ec4899)",
    margin: "0 auto 16px",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    backgroundColor: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "30px",
    fontWeight: "700",
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    borderRadius: "20px",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    color: "#34d399",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "12px",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
  },
  welcomeHeading: {
    color: "#ffffff",
    fontSize: "24px",
    margin: "0 0 6px 0",
    fontWeight: "700",
  },
  welcomeSub: {
    color: "#94a3b8",
    fontSize: "14px",
    margin: "0 0 24px 0",
  },
  roleHighlight: {
    color: "#818cf8",
    fontWeight: "600",
  },
  terminalBox: {
    backgroundColor: "rgba(2, 6, 23, 0.7)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "left",
    marginBottom: "24px",
  },
  terminalHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "12px",
  },
  terminalDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
  },
  terminalTitle: {
    marginLeft: "6px",
    color: "#64748b",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: "700",
  },
  terminalText: {
    margin: "4px 0",
    color: "#cbd5e1",
    fontSize: "12px",
    fontFamily: "monospace",
  },
  logoutBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#f87171",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
};