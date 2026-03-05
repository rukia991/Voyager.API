import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isAdmin    = user?.role === 'SuperAdmin' || user?.role === 'Admin';
  const isCustomer = user?.role === 'Customer';

  const nav = [
    { icon: "⊞", label: "Dashboard",       path: "/dashboard" },
    !isCustomer && { icon: "📢", label: "Campaigns",      path: "/campaigns" },
    !isCustomer && { icon: "👥", label: "Leads",           path: "/leads" },
    !isCustomer && { icon: "📧", label: "Email Marketing", path: "/email" },
    !isCustomer && { icon: "📊", label: "Analytics",       path: "/analytics" },
    !isCustomer && { icon: "📍", label: "Locations",       path: "/locations" },
    !isCustomer && { icon: "🗄️", label: "Archived Items",  path: "/archived" },
    !isCustomer && { icon: "⚙", label: "Automation",      path: "/automation" },
    isAdmin      && { icon: "🛡", label: "Users",           path: "/users" },
    user?.role === 'SuperAdmin' && { icon: "⚙", label: "Settings", path: "/settings" },
    isCustomer   && { icon: "✈", label: "Travel Portal",   path: "/portal" },
  ].filter(Boolean) as { icon: string; label: string; path: string }[];

  const initials = (user?.userName?.[0] ?? '?').toUpperCase();

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        {/* Brand */}
        <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", flexShrink: 0,
              background: "var(--gradient)",
              borderRadius: "9px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "15px"
            }}>✈</div>
            <div>
              <div style={{
                fontWeight: "800", fontSize: "14px",
                background: "var(--gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>Voyager</div>
              <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Marketing Suite
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          <div style={{ padding: "8px 8px 4px", fontSize: "9px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Navigation
          </div>

          {nav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", gap: "9px",
                  padding: "8px 10px",
                  borderRadius: "9px",
                  border: "none",
                  cursor: "pointer",
                  marginBottom: "1px",
                  background: active ? "var(--accent-soft)" : "transparent",
                  color: active ? "#c4b5fd" : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: active ? "600" : "400",
                  transition: "all 0.15s",
                  textAlign: "left",
                  fontFamily: "inherit",
                  borderLeft: active ? "2px solid #a78bfa" : "2px solid transparent",
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "#c4b5fd"; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; } }}
              >
                <span style={{ fontSize: "14px", opacity: active ? 1 : 0.65, width: "18px", textAlign: "center" }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#a78bfa", flexShrink: 0 }} />}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: "10px 8px", borderTop: "1px solid var(--border)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "9px",
            padding: "8px 10px", borderRadius: "10px",
            background: "rgba(255,255,255,0.03)",
            marginBottom: "8px"
          }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
              background: "var(--gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: "700", color: "white"
            }}>{initials}</div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.userName}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{user?.role}</div>
            </div>
          </div>

          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="btn btn-danger"
            style={{ width: "100%", justifyContent: "center", fontSize: "12px", padding: "7px" }}
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}