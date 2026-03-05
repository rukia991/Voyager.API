import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import { useAuth } from "../../context/AuthContext";
import analyticsService from "../../services/analyticsService";
import type { AnalyticsSummaryDTO } from "../../services/analyticsService";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AnalyticsSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const isCustomer = user?.role === 'Customer';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await analyticsService.getSummary();
      setStats(data);
    } catch (e) {
      console.error("Dashboard failed to fetch stats", e);
    } finally {
      setLoading(false);
    }
  };

  const dashboardKPIs = stats ? [
    { label: "Active Campaigns", value: stats.performanceOverTime.length.toString(), change: "+N/A", up: true,  icon: "📢", accent: "#667eea" },
    { label: "Total Leads",      value: stats.totalLeads.toLocaleString(), change: "+", up: true,  icon: "👥", accent: "#f093fb" },
    { label: "Emails Sent",      value: stats.emailsSent.toLocaleString(), change: "+", up: true,  icon: "📧", accent: "#34d399" },
    { label: "Conversions",      value: stats.conversions.toString(), change: "", up: true, icon: "🎯", accent: "#f59e0b" },
  ] : [];

  const quickActions = [
    { icon: "📢", label: "New Campaign",  sub: "Launch a campaign",    path: "/campaigns" },
    { icon: "👤", label: "Add Lead",      sub: "Register a prospect",  path: "/leads" },
    { icon: "📧", label: "Send Email",    sub: "Compose & send",        path: "/email" },
    { icon: "📊", label: "View Reports",  sub: "Check performance",    path: "/analytics" },
  ];

  // Placeholder activity - in a real app, this should also come from an API
  const activity = [
    { user: "System", action: "fetched real-time system metrics", time: "Just now", icon: "⚙️", color: "#a78bfa" },
  ];

  return (
    <MainLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px] text-slate-500 italic">
          Fetching system overview...
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          {!isCustomer && (
            <section className="anim-slide-up" style={{ marginBottom: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>What would you like to do?</p>
              </div>
              <div className="grid-4">
                {quickActions.map((a, i) => (
                  <button key={a.label} className={`action-card delay-${i + 1} anim-fade-in`} onClick={() => navigate(a.path)}>
                    <div style={{
                      width: "34px", height: "34px", borderRadius: "9px",
                      background: "var(--accent-soft)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "16px"
                    }}>{a.icon}</div>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{a.label}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{a.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* KPI Stats */}
          {!isCustomer && stats && (
            <section style={{ marginBottom: "22px" }}>
              <p className="section-label">Performance Overview</p>
              <div className="grid-4">
                {dashboardKPIs.map((s, i) => (
                  <div key={s.label} className={`stat-card delay-${i + 1} anim-slide-up`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                      <div style={{
                        width: "38px", height: "38px", borderRadius: "10px",
                        background: `${s.accent}18`,
                        border: `1px solid ${s.accent}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "18px"
                      }}>{s.icon}</div>
                    </div>
                    <div style={{ fontSize: "26px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: "2px" }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bottom: Activity + Side panel */}
          <div className="grid-2" style={{ alignItems: "start" }}>
            {/* Activity feed */}
            <div className="card anim-slide-up" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>🕐 Recent Activity</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", cursor: "pointer" }}>See all</span>
              </div>
              {activity.map((a, i) => (
                <div key={i} style={{
                  display: "flex", gap: "10px", padding: "10px 0",
                  borderBottom: i < activity.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none"
                }}>
                  <div style={{
                    width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
                    background: `${a.color}18`, border: `1px solid ${a.color}28`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px"
                  }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{a.user}</span> {a.action}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right side */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Profile card */}
              <div className="card anim-slide-up delay-1" style={{ padding: "18px" }}>
                <div style={{
                  height: "48px", borderRadius: "10px", marginBottom: "12px",
                  background: "var(--gradient)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px"
                }}>✈</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" }}>
                  Welcome back!
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "14px" }}>
                  Your campaigns are running. Here's your overview.
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "8px 10px", borderRadius: "9px",
                  background: "var(--accent-soft)", border: "1px solid var(--border-accent)"
                }}>
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: "var(--gradient)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: "700", color: "white"
                  }}>{(user?.userName?.[0] ?? '?').toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-primary)" }}>{user?.userName}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{user?.role}</div>
                  </div>
                </div>
              </div>

              {/* System status */}
              <div className="card anim-slide-up delay-2" style={{ padding: "16px 18px" }}>
                <p className="section-label">System Status</p>
                {[
                  { label: "API Server",     ok: true },
                  { label: "Email Service",  ok: true },
                  { label: "Database",       ok: true },
                ].map(s => (
                  <div key={s.label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)"
                  }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{s.label}</span>
                    <span className={s.ok ? "badge badge-green" : "badge badge-red"}>
                      {s.ok ? "Online" : "Down"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}