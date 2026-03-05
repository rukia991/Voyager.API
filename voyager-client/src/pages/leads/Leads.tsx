import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import leadService from '../../services/leadService';
import type { LeadDTO, CreateLeadDTO } from '../../services/leadService';
import campaignService from '../../services/campaignService';
import type { CampaignDTO } from '../../services/campaignService';
import MapboxMap from '../../components/common/MapboxMap';

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
    campaignID: 0, 
    leadStatus: 'New', 
    leadScore: 0, 
    source: '', 
    notes: '' 
  });

  const isManager = !!user && (user.role === 'SuperAdmin' || user.role === 'Marketing Manager');

  useEffect(() => { 
    fetchLeads(); 
    fetchCampaigns(); 
  }, [search]);

  const fetchLeads = async () => {
    try { 
      const data = await leadService.getLeads({ search, showArchived: false });
      setLeads(data.filter(l => !l.isArchived)); 
    } catch (_) { 
      console.error("Error fetching leads"); 
    }
  };

  const fetchCampaigns = async () => {
    try {
      const data = await campaignService.getCampaigns();
      setCampaigns(data);
      if (data.length > 0) setFormData(f => ({ ...f, campaignID: data[0].campaignID }));
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
          <div className="xl:col-span-8 card" style={{ padding: "0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)", fontSize: "12px", color: "var(--text-muted)" }}>
                    <th style={{ padding: "16px" }}>Lead Details</th>
                    <th style={{ padding: "16px" }}>Campaign</th>
                    <th style={{ padding: "16px" }}>Status</th>
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
                        background: selectedLead?.leadID === l.leadID ? "rgba(167, 139, 250, 0.05)" : "transparent"
                      }} 
                      onClick={() => setSelectedLead(l)}
                    >
                      <td style={{ padding: "16px" }}>
                        <div style={{ fontWeight: "700", color: "white" }}>{l.userName || `Lead #${l.leadID}`}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Source: {l.source || 'Direct'}</div>
                      </td>
                      <td style={{ padding: "16px" }}>{l.campaignName}</td>
                      <td style={{ padding: "16px" }}>
                        <span className={`badge badge-${l.leadStatus === 'Hot' ? 'red' : l.leadStatus === 'Warm' ? 'amber' : 'blue'}`}>
                          {l.leadStatus}
                        </span>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button 
                            className="btn btn-sm btn-ghost" 
                            onClick={(e) => { e.stopPropagation(); setEditingLead(l); setIsEditModalOpen(true); }}
                          >Edit</button>
                          <button 
                            className="btn btn-sm btn-ghost" 
                            onClick={(e) => { e.stopPropagation(); handleArchive(l.leadID); }}
                          >Archive</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontStyle: "italic" }}>No leads found.</td></tr>
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

          {/* Side Panel: Lead Details & Map */}
          <div className="xl:col-span-4 anim-slide-right">
            {selectedLead ? (
              <div className="card" style={{ height: "100%", padding: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "white", marginBottom: "16px" }}>Lead Intelligence</h3>
                
                <div style={{ height: "200px", borderRadius: "12px", overflow: "hidden", marginBottom: "20px", border: "1px solid var(--border)" }}>
                  <MapboxMap 
                    lat={selectedLead.leadScore} // Placeholder use of leadScore for demo visualization
                    lng={0}
                    title={selectedLead.userName || 'Lead'}
                    showRoute={false}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Performance Score</label>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)" }}>{selectedLead.leadScore}<span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: "400" }}>/100</span></div>
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</label>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", marginTop: "4px" }}>
                      {selectedLead.notes || "No additional notes for this prospect."}
                    </p>
                  </div>
                  <button className="btn btn-primary" style={{ width: "100%", marginTop: "10px", height: "48px" }} onClick={() => navigate('/email')}>
                    📧 Reach Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="card" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "40px" }}>
                Select a lead to view detailed analytics and location data.
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
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Campaign</label>
                <select value={formData.campaignID} onChange={e => setFormData({ ...formData, campaignID: parseInt(e.target.value) })}>
                  {campaigns.map(c => <option key={c.campaignID} value={c.campaignID}>{c.campaignName}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Status</label>
                <select value={formData.leadStatus} onChange={e => setFormData({ ...formData, leadStatus: e.target.value })}>
                  {['New', 'Contacted', 'Qualified', 'Converted', 'Lost'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
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
            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Status</label>
                <select value={editingLead.leadStatus} onChange={e => setEditingLead({ ...editingLead, leadStatus: e.target.value })}>
                  {['New', 'Contacted', 'Qualified', 'Converted', 'Lost'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Lead Score</label>
                <input type="number" value={editingLead.leadScore} onChange={e => setEditingLead({ ...editingLead, leadScore: parseInt(e.target.value) })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Notes</label>
                <textarea value={editingLead.notes || ''} onChange={e => setEditingLead({ ...editingLead, notes: e.target.value })} />
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
