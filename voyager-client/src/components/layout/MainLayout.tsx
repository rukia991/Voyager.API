import { useState, type ReactNode } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = user?.userName || "User";
  const initials = (user?.userName?.[0] ?? "?").toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)", position: "relative" }}>
      <div className="glow-orb orb-purple" />
      <div className="glow-orb orb-pink" />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="content-area" style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", width: "100%", overflowX: "hidden" }}>
        <header className="top-header">
          <div className="top-header-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              {"\u2630"}
            </button>
            <span className="top-header-wave">Hi</span>
            <span className="top-header-greeting">{getGreeting()},</span>
            <span className="top-header-username">{displayName}</span>
          </div>

          <div className="top-header-right">
            <span className="top-header-role">{user?.role}</span>
            <div className="top-header-avatar">{initials}</div>
          </div>
        </header>

        <main className="page-main">{children}</main>
      </div>
    </div>
  );
}
