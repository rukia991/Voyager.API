import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import analyticsService from '../../services/analyticsService';
import type { AnalyticsSummaryDTO, CampaignMetricDTO } from '../../services/analyticsService';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#667eea', '#f093fb', '#4fd1c5', '#fbbf24', '#f87171'];

const Analytics: React.FC = () => {
  const auth = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummaryDTO | null>(null);
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetricDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isManager = auth.user?.role === 'SuperAdmin' || auth.user?.role === 'Marketing Manager';

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);
  const fetchData = async () => {
    try {
      const [s, m] = await Promise.all([analyticsService.getSummary(), analyticsService.getCampaignMetrics()]);
      setSummary(s); setCampaignMetrics(m);
      setLastUpdated(new Date());
    } catch (_) { console.error("Error fetching analytics"); } finally { setLoading(false); }
  };

  if (loading) return <MainLayout><div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading analytics…</div></MainLayout>;

  const kpis = [
    { label: 'Total Leads',   value: summary?.totalLeads,  icon: '👥', accent: '#667eea' },
    { label: 'Emails Sent',   value: summary?.emailsSent,  icon: '📧', accent: '#f093fb' },
    { label: 'Conversions',   value: summary?.conversions, icon: '🎯', accent: '#34d399' },
    { label: 'ROI',           value: isManager ? `${summary?.totalROI}%` : '—', icon: '💰', accent: '#fbbf24' },
  ];

  const handleExport = () => {
    if (!campaignMetrics.length) return;
    const headers = ['Campaign', 'Engagement Rate', 'Conversion Rate', 'Cost Per Lead', 'Revenue'];
    const rows = campaignMetrics.map(m => [
      m.campaignName,
      `${m.engagementRate}%`,
      `${m.conversionRate}%`,
      `$${m.costPerLead}`,
      `$${m.revenue}`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `voyager_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MainLayout>
      <div className="page-header anim-slide-up">
        <div className="page-header-left">
          <div className="eyebrow">Insights</div>
          <h1>Analytics</h1>
          <p>Deep-dive into your marketing performance and ROI. Auto-refreshes every 30 seconds.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {lastUpdated && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Updated: {lastUpdated.toLocaleTimeString()}</span>}
          {isManager && <button className="btn btn-primary" onClick={handleExport}>📥 Export</button>}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid-4 anim-slide-up delay-1" style={{ marginBottom: "22px" }}>
        {kpis.map((k, i) => (
          <div key={k.label} className={`stat-card delay-${i + 1}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: `${k.accent}18`, border: `1px solid ${k.accent}25`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px"
              }}>{k.icon}</div>
              <span style={{ fontSize: "9px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Global</span>
            </div>
            <div style={{ fontSize: "26px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: "2px" }}>{k.value ?? '—'}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2 anim-slide-up delay-2" style={{ marginBottom: "22px" }}>
        <div className="card" style={{ padding: "18px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "16px" }}>Campaign Performance Trends</div>
          <div style={{ height: "240px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.performanceOverTime}>
                <defs>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#667eea" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid var(--border)", borderRadius: "10px", color: "#f0f2f7", fontSize: "12px" }} />
                <Area type="monotone" dataKey="leads" stroke="#667eea" strokeWidth={2} fillOpacity={1} fill="url(#gLeads)" />
                <Area type="monotone" dataKey="conversions" stroke="#f093fb" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: "18px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "16px" }}>Emails Sent vs Leads</div>
          <div style={{ height: "240px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.performanceOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid var(--border)", borderRadius: "10px", color: "#f0f2f7", fontSize: "12px" }} />
                <Bar dataKey="emailsSent" fill="#667eea" radius={[4,4,0,0]} barSize={16} />
                <Bar dataKey="leads" fill="#f093fb" radius={[4,4,0,0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card anim-slide-up delay-3 xl:col-span-1" style={{ padding: "18px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "16px" }}>Lead Status Distribution</div>
          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary?.leadStatusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="count" nameKey="status">
                  {summary?.leadStatusDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px" }} />
                <Legend verticalAlign="bottom" height={28} iconSize={8} wrapperStyle={{ fontSize: "10px", color: "var(--text-muted)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card overflow-hidden anim-slide-up delay-3 xl:col-span-2">
          <div className="tbl-header"><span>Campaign Efficiency Metrics</span></div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr className="tbl-head-row">
                  {['Campaign', 'Engagement', 'Conv. Rate', 'Cost/Lead', 'Revenue'].map(h => (
                    <th key={h} className="tbl-cell" style={{ textAlign: h === 'Revenue' ? "right" : undefined }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaignMetrics.map((m, i) => (
                  <tr key={i} className="tbl-row">
                    <td className="tbl-cell" style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{m.campaignName}</td>
                    <td className="tbl-cell">
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "#667eea", width: `${m.engagementRate}%` }} />
                        </div>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{m.engagementRate}%</span>
                      </div>
                    </td>
                    <td className="tbl-cell" style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>{m.conversionRate}%</td>
                    <td className="tbl-cell" style={{ fontSize: "11px", color: "var(--text-muted)" }}>${m.costPerLead}</td>
                    <td className="tbl-cell" style={{ fontSize: "12px", fontWeight: "700", color: "#34d399", textAlign: "right" }}>${m.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;
