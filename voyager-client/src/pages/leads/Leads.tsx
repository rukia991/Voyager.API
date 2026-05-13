import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/useAuth';
import leadService from '../../services/leadService';
import type { LeadDTO, CreateLeadDTO, LeadEnrollmentDTO } from '../../services/leadService';
import campaignService from '../../services/campaignService';
import type { CampaignDTO } from '../../services/campaignService';
import { maskEmail } from '../../utils/masking';

const Leads: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadDTO[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedLead, setSelectedLead] = useState<LeadDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadDTO | null>(null);
  const [formData, setFormData] = useState<CreateLeadDTO>({ 
    email: '',
    fullName: '',
    campaignID: 0, 
    leadStatus: 'New', 
    leadScore: 0, 
    source: '', 
    notes: '' 
  });

  const isManager = !!user && (user.role === 'SuperAdmin' || user.role === 'Admin' || user.role === 'Marketing Manager');

  const fetchLeads = useCallback(async () => {
    try { 
      const data = await leadService.getLeads({ search, showArchived: false });
      const active = data.filter(l => !l.isArchived).sort((a, b) => b.leadID - a.leadID);
      setLeads(active);
      if (active.length > 0 && (!selectedLead || selectedLead.isArchived)) {
        setSelectedLead(active[0]);
      }
    } catch { 
      console.error("Error fetching leads"); 
    }
  }, [search, selectedLead]);

  const fetchCampaigns = async () => {
    try {
      const data = await campaignService.getCampaigns();
      setCampaigns(data);
      if (data.length > 0) setFormData((f: CreateLeadDTO) => ({ ...f, campaignID: data[0].campaignID }));
    } catch { 
      console.error("Error fetching campaigns"); 
    }
  };

  useEffect(() => { 
    void fetchLeads(); 
    void fetchCampaigns(); 
  }, [fetchLeads, search]);

  const handleArchive = async (id: number) => {
    if (!window.confirm("Are you sure you want to archive this lead? It will be moved to the Archived Items page.")) return;
    try { 
      await leadService.archiveLead(id); 
      fetchLeads(); 
      if (selectedLead?.leadID === id) setSelectedLead(null);
    } catch { 
      console.error('Failed to archive lead'); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitting(true);
    try { 
      await leadService.createLead(formData); 
      setIsModalOpen(false); 
      fetchLeads(); 
      setFormData({ 
        email: '',
        fullName: '',
        campaignID: campaigns[0]?.campaignID || 0, 
        leadStatus: 'New', 
        leadScore: 0, 
        source: '', 
        notes: '' 
      });
    } catch { 
      console.error("Error creating lead"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setIsSubmitting(true);
    try {
      await leadService.updateLead(editingLead.leadID, {
        leadStatus: editingLead.leadStatus,
        leadScore: editingLead.leadScore,
        notes: editingLead.notes,
        source: editingLead.source
      });
      setIsEditModalOpen(false);
      fetchLeads();
    } catch { 
      console.error("Error updating lead"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const paginated = leads.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(leads.length / pageSize);

  return (
    <MainLayout>
      <div className="anim-slide-up">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "26px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "white", marginBottom: "4px" }}>Lead Management</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Qualify prospects and monitor sales performance.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div className="search-box">
              <input type="text" placeholder="Filter leads..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "240px" }} />
            </div>
            {isManager && (
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                <span>+</span> Add Lead
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-7 card" style={{ padding: "0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)", fontSize: "12px", color: "var(--text-muted)" }}>
                    <th style={{ padding: "16px" }}>Lead Name</th>
                    <th style={{ padding: "16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((l) => (
                    <tr 
                      key={l.leadID} 
                      style={{ 
                        borderBottom: "1px solid rgba(255,255,255,0.03)", 
                        fontSize: "13px", 
                        cursor: "pointer",
                        transition: "all 0.2s",
                        background: selectedLead?.leadID === l.leadID ? "rgba(167, 139, 250, 0.08)" : "transparent"
                      }} 
                      onClick={() => setSelectedLead(l)}
                      className="hover:bg-white/[0.02]"
                    >
                      <td style={{ padding: "16px" }}>
                        <div style={{ fontWeight: "700", color: "white", fontSize: "15px" }}>{l.fullName || l.userName || `Lead #${l.leadID}`}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{l.email ? maskEmail(l.email) : 'No email associated'}</div>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button 
                            className="btn btn-sm btn-ghost" 
                            style={{ padding: "4px 12px" }}
                            onClick={(e) => { e.stopPropagation(); setEditingLead(l); setIsEditModalOpen(true); }}
                          >Edit</button>
                          <button 
                            className="btn btn-sm btn-ghost text-red-400 hover:text-red-300" 
                            style={{ padding: "4px 12px" }}
                            onClick={(e) => { e.stopPropagation(); handleArchive(l.leadID); }}
                          >Archive</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={2} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontStyle: "italic" }}>No leads found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-white/5 flex justify-between items-center text-[11px] text-slate-400">
              <div>Page {page} of {totalPages || 1}</div>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-sm btn-ghost">Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-sm btn-ghost">Next</button>
              </div>
            </div>
          </div>

          {/* Side Panel: Campaign Enrollment History */}
          <div className="xl:col-span-5 anim-slide-right">
            {selectedLead ? (
              <div className="card" style={{ height: "100%", padding: "24px" }}>
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "white", marginBottom: "4px" }}>Campaign Enrollment</h3>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Registration history for {selectedLead.fullName || selectedLead.userName}</p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {(selectedLead.enrollmentHistory && selectedLead.enrollmentHistory.length > 0) ? (
                    selectedLead.enrollmentHistory.map((h: LeadEnrollmentDTO, idx: number) => (
                      <div key={idx} style={{ 
                        padding: "16px", 
                        background: "rgba(255,255,255,0.03)", 
                        borderRadius: "12px", 
                        border: "1px solid rgba(255,255,255,0.05)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <div>
                          <div style={{ fontWeight: "700", color: "white", fontSize: "14px" }}>{h.campaignName}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                            Registered: {new Date(h.enrolledDate).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`badge badge-${h.status === 'Active' ? 'blue' : 'gray'}`} style={{ fontSize: "10px" }}>
                          {h.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "40px 20px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>No active enrollments found for this lead.</p>
                    </div>
                  )}

                  <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ marginBottom: "16px" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>Recent Notes</span>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", marginTop: "8px" }}>
                        {selectedLead.notes || "No additional workflow notes documented."}
                      </p>
                    </div>
                    <button className="btn btn-primary" style={{ width: "100%", height: "48px" }} onClick={() => navigate('/email')}>
                      📧 Reach Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "40px" }}>
                Select a lead to view their campaign enrollment history and engagement details.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header"><h2>Add New Lead</h2><button onClick={() => setIsModalOpen(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name <span style={{ color: "var(--accent)" }}>*</span></label>
                <input required placeholder="e.g. Juan dela Cruz" value={formData.fullName || ''} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email Address <span style={{ color: "var(--accent)" }}>*</span></label>
                <input required type="email" placeholder="e.g. juan@example.com" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Campaign</label>
                  <select value={formData.campaignID} onChange={e => setFormData({ ...formData, campaignID: parseInt(e.target.value) })}>
                    {campaigns.map(c => <option key={c.campaignID} value={c.campaignID}>{c.campaignName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.leadStatus} onChange={e => setFormData({ ...formData, leadStatus: e.target.value })}>
                    {['New', 'Contacted', 'Qualified', 'Converted', 'Lost'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Add Prospect'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingLead && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header"><h2>Update Information</h2><button onClick={() => setIsEditModalOpen(false)}>✕</button></div>
            <form onSubmit={handleUpdate}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Status</label>
                  <select value={editingLead.leadStatus} onChange={e => setEditingLead({ ...editingLead, leadStatus: e.target.value })}>
                    {['New', 'Contacted', 'Qualified', 'Converted', 'Lost'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Lead Score</label>
                  <input type="number" min={0} max={100} value={editingLead.leadScore} onChange={e => setEditingLead({ ...editingLead, leadScore: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={4} value={editingLead.notes || ''} onChange={e => setEditingLead({ ...editingLead, notes: e.target.value })} />
              </div>
              <div className="modal-footer">
                 <button type="button" className="btn btn-ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                 <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Leads;


