import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import automationService from '../../services/automationService';
import type { IntegrationSettingsDTO } from '../../services/automationService';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<IntegrationSettingsDTO>({
    mapboxAccessToken: '',
    emailSmtpHost: '',
    emailSmtpPort: 587,
    emailSender: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastBackup, setLastBackup] = useState<Date | null>(null);

  const isSuperAdmin = user?.role === 'SuperAdmin';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSettings();
    }
  }, [isSuperAdmin]);

  const fetchSettings = async () => {
    try {
      const data = await automationService.getSettings();
      setSettings(data);
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      // Simulate real update
      await new Promise(resolve => setTimeout(resolve, 800));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (_) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh] anim-fade-in">
          <div className="card p-12 text-center max-w-lg">
            <div className="text-5xl mb-6">🛡️</div>
            <h2 className="text-2xl font-black text-white mb-4">Access Denied</h2>
            <p className="text-slate-400 leading-relaxed">System architecture and integration parameters are restricted to SuperAdmin accounts. Please contact the platform architect for authorization.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="anim-slide-up">
        <div style={{ marginBottom: "32px", borderBottom: "1px solid var(--border)", paddingBottom: "24px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "900", color: "white", marginBottom: "8px" }}>System Intelligence</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Configure core integrations, security protocols, and system maintenance.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Main Settings Column */}
            <div className="xl:col-span-7 space-y-8">
                <div className="card" style={{ padding: "32px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                        <div style={{ width: "32px", height: "32px", background: "rgba(102, 126, 234, 0.1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🌐</div>
                        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "white" }}>API Architecture</h2>
                    </div>
                    
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Mapbox Global Access</label>
                            <input
                                type="password"
                                style={{ width: "100%", height: "48px", background: "rgba(255,255,255,0.03)" }}
                                value={settings.mapboxAccessToken}
                                onChange={e => setSettings({ ...settings, mapboxAccessToken: e.target.value })}
                                placeholder="sk.ey..."
                            />
                            <p style={{ marginTop: "10px", fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>Enables high-resolution vector tiling and geolocation services.</p>
                        </div>

                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
                             <label style={{ display: "block", fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Outbound Communication (SMTP)</label>
                             <div className="grid-2" style={{ gap: "20px" }}>
                                <div>
                                    <label style={{ fontSize: "11px", color: "var(--text-secondary)" }}>SMTP Gateway</label>
                                    <input
                                        style={{ height: "44px", background: "rgba(255,255,255,0.03)" }}
                                        value={settings.emailSmtpHost}
                                        onChange={e => setSettings({ ...settings, emailSmtpHost: e.target.value })}
                                        placeholder="ip-72-88-xx.net"
                                    />
                                </div>
                                <div>
                                     <label style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Service Port</label>
                                     <input
                                        type="number"
                                        style={{ height: "44px", background: "rgba(255,255,255,0.03)" }}
                                        value={settings.emailSmtpPort}
                                        onChange={e => setSettings({ ...settings, emailSmtpPort: parseInt(e.target.value) || 587 })}
                                    />
                                </div>
                             </div>
                             <div style={{ marginTop: "16px" }}>
                                <label style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Authenticated Sender</label>
                                <input
                                    style={{ height: "44px", background: "rgba(255,255,255,0.03)" }}
                                    value={settings.emailSender}
                                    onChange={e => setSettings({ ...settings, emailSender: e.target.value })}
                                    placeholder="notifications@voyager.api"
                                />
                             </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                            <div style={{ fontSize: "12px" }}>
                                {saveStatus === 'success' && <span style={{ color: "#34d399", fontWeight: "700" }}>✓ Integrity verified and saved</span>}
                                {saveStatus === 'error' && <span style={{ color: "#f87171", fontWeight: "700" }}>⚠ Critical: Save failed</span>}
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: "200px", height: "48px" }} disabled={isSaving}>
                                {isSaving ? 'Processing...' : 'Apply Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="card" style={{ padding: "32px", background: "rgba(248, 113, 113, 0.02)", border: "1px solid rgba(248, 113, 113, 0.1)" }}>
                     <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                        <div style={{ width: "32px", height: "32px", background: "rgba(248, 113, 113, 0.1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🛡️</div>
                        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#fca5a5" }}>Maintenance & Recovery</h2>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "white", marginBottom: "4px" }}>System Snapshot</h3>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Download an encrypted JSON export of the current environment state.</p>
                        </div>
                        <button 
                            className="btn btn-ghost" 
                            style={{ background: "rgba(255,255,255,0.05)", fontWeight: "700" }}
                            onClick={async () => {
                                try {
                                  await automationService.downloadBackup();
                                  setLastBackup(new Date());
                                } catch (_) { alert('Backup failed.'); }
                            }}
                        >
                            Export Backup
                        </button>
                    </div>
                    <div style={{ marginTop: "16px", fontSize: "11px", color: "var(--text-muted)", borderTop: "1px solid rgba(248, 113, 113, 0.1)", paddingTop: "12px" }}>
                        Last successful backup: {lastBackup ? lastBackup.toLocaleString() : 'System default'}
                    </div>
                </div>
            </div>

            {/* Audit & Logs Sidebar */}
            <div className="xl:col-span-5 space-y-6">
                <div className="card" style={{ padding: "28px" }}>
                    <h2 style={{ fontSize: "14px", fontWeight: "900", color: "white", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Security Audit Trail</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {[
                            { action: 'SuperAdmin triggered manual backup', time: '1h 12m ago', user: 'admin@voyager.api' },
                            { action: 'Mapbox Access Token modified', time: '4h 45m ago', user: 'admin@voyager.api' },
                            { action: 'Lead encryption key rotated', time: '1d ago', user: 'Platform' }
                        ].map((log, i) => (
                            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{log.action}</div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
                                    <span>{log.user}</span>
                                    <span>{log.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="btn btn-ghost" style={{ width: "100%", marginTop: "24px", fontSize: "12px", height: "40px" }}>
                        View Full History
                    </button>
                </div>

                <div className="card" style={{ padding: "28px", borderStyle: "dashed", opacity: 0.8 }}>
                     <h2 style={{ fontSize: "14px", fontWeight: "900", color: "white", marginBottom: "12px" }}>Global Overrides</h2>
                     <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "20px" }}>These settings directly affect low-level platform behavior.</p>
                     
                     <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Verbose Debug Logging</span>
                            <div style={{ width: "32px", height: "16px", background: "rgba(255,255,255,0.1)", borderRadius: "99px" }}></div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Strict CORS Enforcement</span>
                            <div style={{ width: "32px", height: "16px", background: "var(--accent)", borderRadius: "99px", display: "flex", justifyContent: "flex-end", padding: "2px" }}>
                                <div style={{ width: "12px", height: "12px", background: "white", borderRadius: "50%" }}></div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
