import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import automationService from '../../services/automationService';
import type { WorkflowRuleDTO, CreateWorkflowRuleDTO, IntegrationSettingsDTO } from '../../services/automationService';

const Automation: React.FC = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<WorkflowRuleDTO[]>([]);
  const [settings, setSettings] = useState<IntegrationSettingsDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateWorkflowRuleDTO>({ ruleName: '', triggerEvent: 'New Lead', condition: '', action: 'Assign Lead', isActive: true });

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isManager    = isSuperAdmin || user?.role === 'Marketing Manager';

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try {
      const r = await automationService.getRules(); setRules(r);
      if (isSuperAdmin) { const s = await automationService.getSettings(); setSettings(s); }
    } catch (_) { console.error("Failed to fetch automation data"); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try { await automationService.createRule(formData); setIsModalOpen(false); fetchData(); }
    catch (_) { console.error("Error saving data"); } finally { setIsSubmitting(false); }
  };

  const handleToggle = async (id: number) => {
    try { await automationService.toggleRule(id); setRules(rules.map(r => r.ruleID === id ? { ...r, isActive: !r.isActive } : r)); }
    catch (_) { console.error("Error toggling status"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this rule?')) return;
    try { await automationService.deleteRule(id); fetchData(); } catch (_) { console.error("Failed to delete rule"); }
  };

  return (
    <MainLayout>
      <div className="page-header anim-slide-up">
        <div className="page-header-left">
          <div className="eyebrow">Operations</div>
          <h1>Workflow & Automation</h1>
          <p>Automate tasks and manage system integrations.</p>
        </div>
        {isManager && <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ New Rule</button>}
      </div>

      <div className="grid-2 anim-slide-up delay-1" style={{ alignItems: "start" }}>
        {/* Rules */}
        <div>
          <p className="section-label">Automation Rules</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {rules.map(rule => (
              <div key={rule.ruleID} className="card" style={{ padding: "16px", opacity: rule.isActive ? 1 : 0.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>{rule.ruleName}</div>
                    <div style={{ fontSize: "10px", color: "#a78bfa", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>{rule.triggerEvent}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button className={`toggle ${rule.isActive ? 'on' : 'off'}`} onClick={() => handleToggle(rule.ruleID)}>
                      <div className="toggle-thumb" />
                    </button>
                    {isManager && <button onClick={() => handleDelete(rule.ruleID)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px", fontSize: "13px", transition: "color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}>
                      🗑
                    </button>}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>Condition</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{rule.condition || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>Action</div>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{rule.action}</div>
                  </div>
                </div>
              </div>
            ))}
            {rules.length === 0 && (
              <div className="card" style={{ padding: "36px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>⚙</div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>No rules configured.</div>
              </div>
            )}
          </div>
        </div>

        {/* Integrations (SuperAdmin only) */}
        {isSuperAdmin && (
          <div>
            <p className="section-label">System Integrations</p>
            <div className="card" style={{ padding: "20px", marginBottom: "12px" }}>
              <div style={{ marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Mapbox Access Token</label>
                  <span className="badge badge-green">CONNECTED</span>
                </div>
                <input type="password" readOnly value={settings?.mapboxAccessToken ?? ''} style={{ fontFamily: "monospace", fontSize: "12px" }} />
              </div>
              <div style={{ marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Email Service (SMTP)</label>
                  <span className="badge badge-green">ACTIVE</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>Host</div>
                    <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>{settings?.emailSmtpHost}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>Port</div>
                    <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>{settings?.emailSmtpPort}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "3px" }}>Sender</div>
                  <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>{settings?.emailSender}</div>
                </div>
              </div>
              <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginBottom: "8px" }}>Configure Integrations</button>
              <button 
                className="btn btn-primary" 
                style={{ width: "100%", justifyContent: "center" }}
                onClick={async () => {
                  try {
                    await automationService.downloadBackup();
                  } catch (e) {
                    console.error("Backup failed", e);
                    alert("System backup failed. Please check server logs.");
                  }
                }}
              >
                📥 Download System Backup
              </button>
            </div>

            <div style={{ background: "var(--accent-soft)", border: "1px solid var(--border-accent)", borderRadius: "10px", padding: "14px 16px", display: "flex", gap: "10px" }}>
              <div style={{ fontSize: "20px" }}>🛡</div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#c4b5fd", marginBottom: "3px" }}>Admin Security</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>Integration settings are only visible to SuperAdmins. Marketing Managers can manage rules but cannot view API keys or SMTP credentials.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "440px" }}>
            <div className="modal-header">
              <h2>Create Rule</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label>Rule Name</label><input required value={formData.ruleName} onChange={e => setFormData(f => ({ ...f, ruleName: e.target.value }))} placeholder="e.g., Welcome Email" /></div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Trigger</label>
                  <select value={formData.triggerEvent} onChange={e => setFormData(f => ({ ...f, triggerEvent: e.target.value }))}>
                    {['New Lead', 'Email Opened', 'Lead Status Changed'].map(o => <option key={o} className="bg-slate-900">{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Action</label>
                  <select value={formData.action} onChange={e => setFormData(f => ({ ...f, action: e.target.value }))}>
                    {['Assign Lead', 'Send Email', 'Update Score'].map(o => <option key={o} className="bg-slate-900">{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Condition (JSON or text)</label><textarea style={{ height: "70px", resize: "none", fontFamily: "monospace", fontSize: "12px" }} value={formData.condition} onChange={e => setFormData(f => ({ ...f, condition: e.target.value }))} placeholder='{"score_gt": 50}' /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Create Rule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Automation;
