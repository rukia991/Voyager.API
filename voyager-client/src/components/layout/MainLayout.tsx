import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const displayName = user?.userName || "User";
  const initials = (user?.userName?.[0] ?? "?").toUpperCase();
  const profilePath = user?.role === "Customer" ? "/portal/profile" : "/profile";

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [accent, setAccent] = useState('purple');
  const [isThemeInit, setIsThemeInit] = useState(false);

  // Load user specific theme and accent ONCE on mount/user login
  useEffect(() => {
    if (user?.userName && !isThemeInit) {
      const savedTheme = localStorage.getItem(`voyager-theme-${user.userName}`);
      const savedAccent = localStorage.getItem(`voyager-accent-${user.userName}`);
      
      const initialTheme = savedTheme || 'dark';
      const initialAccent = savedAccent || 'purple';

      setTheme(initialTheme);
      setAccent(initialAccent);

      if (initialTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }

      if (initialAccent !== 'purple') {
        document.documentElement.setAttribute('data-accent', initialAccent);
      } else {
        document.documentElement.removeAttribute('data-accent');
      }

      setIsThemeInit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isThemeInit]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    if (user?.userName) {
      localStorage.setItem(`voyager-theme-${user.userName}`, newTheme);
    }
  };

  const handleAccentChange = (newAccent: string) => {
    setAccent(newAccent);
    if (newAccent !== 'purple') {
      document.documentElement.setAttribute('data-accent', newAccent);
    } else {
      document.documentElement.removeAttribute('data-accent');
    }
    if (user?.userName) {
      localStorage.setItem(`voyager-accent-${user.userName}`, newAccent);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)", position: "relative" }}>
      <div className="glow-orb orb-purple" />
      <div className="glow-orb orb-pink" />
      <div className={`sidebar-container ${!sidebarOpen ? 'collapsed' : ''}`}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="content-area" style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", width: "100%", overflowX: "hidden" }}>
        <header className="top-header">
          <div className="top-header-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle menu"
            >
              {"\u2630"}
            </button>
            <span className="top-header-wave">Hi</span>
            <span className="top-header-greeting">{getGreeting()},</span>
            <span className="top-header-username">{displayName}</span>
          </div>

          <div className="top-header-right" style={{ position: "relative" }}>
            <button 
              className="btn btn-sm btn-ghost" 
              style={{ width: "36px", height: "36px", padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              title="Appearance Settings"
            >
              🎨
            </button>
            
            {themeMenuOpen && (
              <div 
                className="card anim-scale-in" 
                style={{ position: "absolute", top: "48px", right: "0", width: "220px", padding: "16px", zIndex: 500 }}
              >
                <div style={{ fontSize: "12px", fontWeight: "700", marginBottom: "12px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Appearance</div>
                
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Mode</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }} onClick={() => { handleThemeChange('dark'); setThemeMenuOpen(false); }}>Dark</button>
                    <button className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }} onClick={() => { handleThemeChange('light'); setThemeMenuOpen(false); }}>Light</button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "8px" }}>
                  <label>Accent Color</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => { handleAccentChange('purple'); setThemeMenuOpen(false); }} style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#7c5cbf", border: accent === 'purple' ? "2px solid var(--text-primary)" : "none", cursor: "pointer" }} title="Purple" />
                    <button onClick={() => { handleAccentChange('blue'); setThemeMenuOpen(false); }} style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#3b82f6", border: accent === 'blue' ? "2px solid var(--text-primary)" : "none", cursor: "pointer" }} title="Blue" />
                    <button onClick={() => { handleAccentChange('emerald'); setThemeMenuOpen(false); }} style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#10b981", border: accent === 'emerald' ? "2px solid var(--text-primary)" : "none", cursor: "pointer" }} title="Emerald" />
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate(profilePath)}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", cursor: "pointer" }}
              aria-label="Open profile"
              title="Open profile"
            >
              <span className="top-header-username" style={{ maxWidth: "120px" }}>{displayName}</span>
              <div className="top-header-avatar">{initials}</div>
            </button>
          </div>
        </header>

        <main className="page-main">{children}</main>
      </div>
    </div>
  );
}
