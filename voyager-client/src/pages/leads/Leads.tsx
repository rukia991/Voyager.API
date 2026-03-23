import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import leadService from '../../services/leadService';
import type { LeadDTO, CreateLeadDTO, LeadEnrollmentDTO } from '../../services/leadService';
import campaignService from '../../services/campaignService';
import type { CampaignDTO } from '../../services/campaignService';

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

  useEffect(() => { 
    fetchLeads(); 
    fetchCampaigns(); 
  }, [search]);

  const fetchLeads = async () => {
    try { 
      const data = await leadService.getLeads({ search, showArchived: false });
      const active = data.filter(l => !l.isArchived).sort((a, b) => b.leadID - a.leadID);
      setLeads(active);
      if (active.length > 0 && (!selectedLead || selectedLead.isArchived)) {
        setSelectedLead(active[0]);
      }
    } catch (_) { 
      console.error("Error fetching leads"); 
    }
  };

  const fetchCampaigns = async () => {
    try {
      const data = await campaignService.getCampaigns();
      setCampaigns(data);
      if (data.length > 0) setFormData((f: CreateLeadDTO) => ({ ...f, campaignID: data[0].campaignID }));
    } catch (_) { 
      console.error("Error fetching campaigns"); 
    }
  };

  const handleArchive = async (id: number) => {
    if (!window.confirm("Are you sure you want to archive this lead? It will be moved to the Archived Items page.")) return;
    try { 
      await leadService.archiveLead(id); 
      fetchLeads(); 
      if (selectedLead?.leadID === id) setSelectedLead(null);
    } catch (_) { 
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
    } catch (_) { 
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
    } catch (_) { 
      console.error("Error updating lead"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const paginated = leads.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(leads.length / pageSize);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto w-full pb-12">
        <div className="anim-slide-up">
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <div>
              <h2 style={{ fontSize: "28px", fontWeight: "800", color: "white", marginBottom: "8px" }}>Lead Management</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Qualify prospects and monitor sales performance.</p>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <div className="search-box">
                <input type="text" placeholder="Filter leads..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "240px", padding: '12px 16px', borderRadius: '10px' }} />
              </div>
              {isManager && (
                <button className="btn btn-primary shadow-lg shadow-purple-500/20" onClick={() => setIsModalOpen(true)} style={{ padding: '0 24px', borderRadius: '10px' }}>
                  <span>+</span> Add Lead
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            <div className="xl:col-span-7 card glass-card border-white/5" style={{ padding: "0", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)", fontSize: "11px", textTransform: 'uppercase', letterSpacing: '0.05em', color: "var(--text-muted)" }}>
                    <th style={{ padding: "20px 24px" }}>Lead Name</th>
                    <th style={{ padding: "20px 24px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((l) => (
                    <tr 
                      key={l.leadID} 
                      style={{ 
                        borderBottom: "1px solid rgba(255,255,255,0.03)", 
                        fontSize: "14px", 
                        cursor: "pointer",
                        transition: "all 0.2s",
                        background: selectedLead?.leadID === l.leadID ? "rgba(167, 139, 250, 0.08)" : "transparent"
                      }} 
                      onClick={() => setSelectedLead(l)}
                      className="hover:bg-white/[0.04]"
                    >
                      <td style={{ padding: "20px 24px" }}>
                        <div style={{ fontWeight: "700", color: "white", fontSize: "16px" }}>{l.fullName || l.userName || `Lead #${l.leadID}`}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{l.email || 'No email associated'}</div>
                      </td>
                      <td style={{ padding: "20px 24px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                          <button 
                            className="bg-white/5 hover:bg-white/10 text-slate-300 font-semibold" 
                            style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "12px", transition: "all 0.2s" }}
                            onClick={(e) => { e.stopPropagation(); setEditingLead(l); setIsEditModalOpen(true); }}
                          >Edit</button>
                          <button 
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold" 
                            style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "12px", transition: "all 0.2s" }}
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
            <div className="p-6 border-t border-white/5 flex justify-between items-center text-[12px] text-slate-400">
              <div>Page {page} of {totalPages || 1}</div>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors font-semibold disabled:opacity-50">Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors font-semibold disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>

          {/* Side Panel: Campaign Enrollment History */}
          <div className="xl:col-span-5 anim-slide-right">
            {selectedLead ? (
              <div className="card glass-card border-white/5" style={{ height: "100%", padding: "40px" }}>
                <div style={{ marginBottom: "32px" }}>
                  <h3 style={{ fontSize: "20px", fontWeight: "800", color: "white", marginBottom: "8px" }}>Campaign Enrollment</h3>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Registration history for {selectedLead.fullName || selectedLead.userName}</p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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

                  <div style={{ marginTop: "32px", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ marginBottom: "24px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>Recent Notes</span>
                      <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", marginTop: "12px" }}>
                        {selectedLead.notes || "No additional workflow notes documented."}
                      </p>
                    </div>
                    <button className="btn btn-primary shadow-lg shadow-purple-500/20" style={{ width: "100%", height: "56px", borderRadius: "12px" }} onClick={() => navigate('/email')}>
                      📧 Reach Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card glass-card border-white/5" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "40px" }}>
                Select a lead to view their campaign enrollment history and engagement details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Modals */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ padding: '32px', maxWidth: '520px' }}>
            <div className="modal-header" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Add New Lead</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ fontSize: '20px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Full Name <span style={{ color: "var(--accent)" }}>*</span></label>
                <input required placeholder="e.g. Juan dela Cruz" style={{ padding: '12px 16px', borderRadius: '10px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} value={formData.fullName || ''} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Email Address <span style={{ color: "var(--accent)" }}>*</span></label>
                <input required type="email" placeholder="e.g. juan@example.com" style={{ padding: '12px 16px', borderRadius: '10px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Campaign</label>
                  <select style={{ padding: '12px 16px', borderRadius: '10px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} value={formData.campaignID} onChange={e => setFormData({ ...formData, campaignID: parseInt(e.target.value) })}>
                    {campaigns.map(c => <option key={c.campaignID} value={c.campaignID} style={{ background: '#0f172a' }}>{c.campaignName}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Status</label>
                  <select style={{ padding: '12px 16px', borderRadius: '10px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} value={formData.leadStatus} onChange={e => setFormData({ ...formData, leadStatus: e.target.value })}>
                    {['New', 'Contacted', 'Qualified', 'Converted', 'Lost'].map(s => <option key={s} value={s} style={{ background: '#0f172a' }}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-ghost" style={{ padding: '10px 20px', borderRadius: '10px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: '10px' }} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Add Prospect'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingLead && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ padding: '32px', maxWidth: '500px' }}>
            <div className="modal-header" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Update Information</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ fontSize: '20px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleUpdate} style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Status</label>
                  <select style={{ padding: '12px 16px', borderRadius: '10px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} value={editingLead.leadStatus} onChange={e => setEditingLead({ ...editingLead, leadStatus: e.target.value })}>
                    {['New', 'Contacted', 'Qualified', 'Converted', 'Lost'].map(s => <option key={s} value={s} style={{ background: '#0f172a' }}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Lead Score</label>
                  <input type="number" min={0} max={100} style={{ padding: '12px 16px', borderRadius: '10px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} value={editingLead.leadScore} onChange={e => setEditingLead({ ...editingLead, leadScore: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Notes</label>
                <textarea rows={4} style={{ padding: '12px 16px', borderRadius: '10px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', resize: 'vertical' }} value={editingLead.notes || ''} onChange={e => setEditingLead({ ...editingLead, notes: e.target.value })} />
              </div>
              <div className="modal-footer" style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                 <button type="button" className="btn btn-ghost" style={{ padding: '10px 20px', borderRadius: '10px' }} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                 <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: '10px' }} disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Leads;
