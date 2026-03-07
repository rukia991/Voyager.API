import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import emailService from '../../services/emailService';
import type { EmailTemplateDTO, CreateEmailTemplateDTO, EmailLogDTO } from '../../services/emailService';
import campaignService from '../../services/campaignService';
import type { CampaignDTO } from '../../services/campaignService';
import leadService from '../../services/leadService';
import type { LeadDTO } from '../../services/leadService';

const emptyTemplate: CreateEmailTemplateDTO = { templateName: '', subject: '', body: '' };

const EmailMarketing: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplateDTO[]>([]);
  const [logs, setLogs] = useState<EmailLogDTO[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
  const [leads, setLeads] = useState<LeadDTO[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateData, setTemplateData] = useState<CreateEmailTemplateDTO>(emptyTemplate);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [sendData, setSendData] = useState({ campaignID: 0, templateID: 0 });

  const isManager = user?.role === 'SuperAdmin' || user?.role === 'Marketing Manager';
  const isApprover = user?.role === 'SuperAdmin' || user?.role === 'Admin';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [td, ld, cd, led] = await Promise.all([
        emailService.getTemplates(),
        emailService.getLogs(),
        campaignService.getCampaigns({ showArchived: false }),
        leadService.getLeads({ showArchived: false })
      ]);
      setTemplates(td);
      setLogs(ld);
      setCampaigns(cd.filter(c => !c.isArchived));
      setLeads(led.filter(l => !l.isArchived));

      const firstCampaignId = cd.find(c => !c.isArchived)?.campaignID ?? 0;
      const firstTemplateId = td.find(t => t.isApproved === 'Approved')?.templateID ?? 0;
      setSendData({ campaignID: firstCampaignId, templateID: firstTemplateId });
    } catch (e) {
      console.error('Error fetching email marketing data', e);
    }
  };

  const openCreateModal = () => {
    setEditingTemplateId(null);
    setTemplateData(emptyTemplate);
    setIsTemplateModalOpen(true);
  };

  const openEditModal = (t: EmailTemplateDTO) => {
    setEditingTemplateId(t.templateID);
    setTemplateData({ templateName: t.templateName, subject: t.subject, body: t.body });
    setIsTemplateModalOpen(true);
  };

  const handleCreateOrUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingTemplateId) {
        await emailService.updateTemplate(editingTemplateId, templateData);
      } else {
        await emailService.createTemplate(templateData);
      }
      setIsTemplateModalOpen(false);
      setEditingTemplateId(null);
      setTemplateData(emptyTemplate);
      fetchData();
    } catch (e) {
      console.error('Error saving template', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await emailService.deleteTemplate(id);
      fetchData();
    } catch {
      alert('Template cannot be deleted if already used in logs.');
    }
  };

  const handleApprove = async (id: number, status: 'Approved' | 'Rejected') => {
    try {
      await emailService.approveTemplate(id, status);
      fetchData();
    } catch (e) {
      console.error('Error approving template', e);
    }
  };

  const campaignLeads = useMemo(
    () => leads.filter(l => l.campaignID === sendData.campaignID),
    [leads, sendData.campaignID]
  );

  const handleBulkSend = async () => {
    if (!sendData.campaignID || !sendData.templateID) return;
    setIsSubmitting(true);
    try {
      await emailService.bulkSend({
        campaignID: sendData.campaignID,
        templateID: sendData.templateID,
        leadIDs: campaignLeads.map(l => l.leadID),
      });
      setIsSendModalOpen(false);
      fetchData();
    } catch (e) {
      console.error('Error launching bulk send', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusClass: Record<string, string> = { Sent: 'badge badge-green', Failed: 'badge badge-red', Pending: 'badge badge-amber' };

  return (
    <MainLayout>
      <div className="page-header anim-slide-up">
        <div className="page-header-left">
          <div className="eyebrow">Communications</div>
          <h1>Email Marketing</h1>
          <p>Design templates and launch campaign communications.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {isManager && <button className="btn btn-ghost" onClick={openCreateModal}>+ New Template</button>}
          <button className="btn btn-primary" onClick={() => setIsSendModalOpen(true)}>Bulk Send</button>
        </div>
      </div>

      <p className="section-label anim-fade-in">Email Templates</p>
      <div className="grid-3 anim-slide-up delay-1" style={{ marginBottom: '24px' }}>
        {templates.map(t => (
          <div key={t.templateID} className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>T</div>
              <span className={t.isApproved === 'Approved' ? 'badge badge-green' : t.isApproved === 'Rejected' ? 'badge badge-red' : 'badge badge-amber'}>{t.isApproved}</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px' }}>{t.templateName}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>

            {isApprover && t.isApproved === 'Pending' && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                <button className="btn btn-primary" style={{ flex: 1, padding: '5px', fontSize: '10px' }} onClick={() => handleApprove(t.templateID, 'Approved')}>Approve</button>
                <button className="btn btn-danger" style={{ flex: 1, padding: '5px', fontSize: '10px' }} onClick={() => handleApprove(t.templateID, 'Rejected')}>Reject</button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>By {t.creatorName}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {isManager && <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => openEditModal(t)}>Edit</button>}
                {isManager && <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleDeleteTemplate(t.templateID)}>Delete</button>}
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="card" style={{ padding: '36px', textAlign: 'center', gridColumn: '1/-1' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>Mail</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No templates yet. Create your first one.</div>
          </div>
        )}
      </div>

      <div className="card overflow-hidden anim-slide-up delay-2">
        <div className="tbl-header">
          <span>Recent Email Activity</span>
          <small>{logs.length} records</small>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="tbl-head-row">
                <th className="tbl-cell">Recipient</th>
                <th className="tbl-cell">Template</th>
                <th className="tbl-cell">Campaign</th>
                <th className="tbl-cell">Status</th>
                <th className="tbl-cell">Sent</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.emailLogID} className="tbl-row">
                  <td className="tbl-cell" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{log.leadName}</td>
                  <td className="tbl-cell" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.templateName}</td>
                  <td className="tbl-cell" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.campaignName}</td>
                  <td className="tbl-cell"><span className={statusClass[log.status] ?? 'badge badge-gray'}>{log.status}</span></td>
                  <td className="tbl-cell" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(log.sentDate).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">@</div><h3>No emails sent yet</h3><p>Use Bulk Send to launch your first campaign.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isTemplateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>{editingTemplateId ? 'Edit Email Template' : 'Create Email Template'}</h2>
              <button className="modal-close-btn" onClick={() => { setIsTemplateModalOpen(false); setEditingTemplateId(null); }}>x</button>
            </div>
            <form onSubmit={handleCreateOrUpdateTemplate}>
              <div className="form-group"><label>Template Name</label><input required value={templateData.templateName} onChange={e => setTemplateData(t => ({ ...t, templateName: e.target.value }))} /></div>
              <div className="form-group"><label>Subject</label><input required value={templateData.subject} onChange={e => setTemplateData(t => ({ ...t, subject: e.target.value }))} /></div>
              <div className="form-group"><label>HTML Body</label><textarea required style={{ height: '140px', resize: 'none', fontFamily: 'monospace', fontSize: '12px' }} value={templateData.body} onChange={e => setTemplateData(t => ({ ...t, body: e.target.value }))} placeholder="<p>Hello!</p>" /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => { setIsTemplateModalOpen(false); setEditingTemplateId(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : editingTemplateId ? 'Update Template' : 'Save Template'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSendModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2>Bulk Email Launch</h2>
              <button className="modal-close-btn" onClick={() => setIsSendModalOpen(false)}>x</button>
            </div>
            <div className="form-group">
              <label>Campaign</label>
              <select value={sendData.campaignID} onChange={e => setSendData(s => ({ ...s, campaignID: parseInt(e.target.value, 10) }))}>
                {campaigns.map(c => <option key={c.campaignID} value={c.campaignID} className="bg-slate-900">{c.campaignName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Template</label>
              <select value={sendData.templateID} onChange={e => setSendData(s => ({ ...s, templateID: parseInt(e.target.value, 10) }))}>
                {templates.filter(t => t.isApproved === 'Approved').map(t => <option key={t.templateID} value={t.templateID} className="bg-slate-900">{t.templateName}</option>)}
              </select>
            </div>
            <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-accent)', borderRadius: '9px', padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Target: <span style={{ color: '#a78bfa', fontWeight: '700' }}>{campaignLeads.length} leads</span> in selected campaign
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setIsSendModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBulkSend} disabled={isSubmitting || campaignLeads.length === 0 || !sendData.templateID}>
                {isSubmitting ? 'Launching...' : 'Launch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default EmailMarketing;
