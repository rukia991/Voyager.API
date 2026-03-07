import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import campaignService from '../../services/campaignService';
import type { CampaignDTO, CreateCampaignDTO } from '../../services/campaignService';
import locationService from '../../services/locationService';
import type { LocationDTO } from '../../services/locationService';

const defaultCampaign: CreateCampaignDTO = {
  campaignName: '',
  description: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  budget: 0,
  targetGoal: '',
  status: 'Active',
  locationID: 0,
};

const Campaigns: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDTO | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCampaignDTO>(defaultCampaign);

  const isManager = user?.role === 'SuperAdmin' || user?.role === 'Marketing Manager';

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campaignData, locationData] = await Promise.all([
        campaignService.getCampaigns({ search, showArchived: false }),
        locationService.getLocations({ showArchived: false })
      ]);

      const activeCampaigns = campaignData.filter(c => !c.isArchived).sort((a, b) => b.campaignID - a.campaignID);
      setCampaigns(activeCampaigns);
      setLocations(locationData.filter(l => !l.isArchived));

      if (activeCampaigns.length > 0 && (!selectedCampaign || selectedCampaign.isArchived)) {
        setSelectedCampaign(activeCampaigns[0]);
      }
    } catch (e) {
      console.error('Failed to fetch campaigns', e);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: number) => {
    if (!window.confirm('Archive this campaign? It will move to Archived Items.')) return;
    try {
      await campaignService.archiveCampaign(id);
      await fetchData();
      if (selectedCampaign?.campaignID === id) setSelectedCampaign(null);
    } catch {
      alert('Failed to archive campaign.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this campaign permanently?')) return;
    try {
      await campaignService.deleteCampaign(id);
      await fetchData();
      if (selectedCampaign?.campaignID === id) setSelectedCampaign(null);
    } catch {
      alert('Failed to delete campaign.');
    }
  };

  const openCreateModal = () => {
    setFormData({ ...defaultCampaign, locationID: locations[0]?.locationID ?? 0 });
    setIsCreateOpen(true);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await campaignService.createCampaign(formData);
      setIsCreateOpen(false);
      await fetchData();
    } catch {
      alert('Failed to create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const campaignSummary = useMemo(() => {
    if (!selectedCampaign) return 'Select a campaign to see details.';
    return selectedCampaign.description || 'No description provided for this campaign.';
  }, [selectedCampaign]);

  return (
    <MainLayout>
      <div className="anim-slide-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '26px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>Marketing Campaigns</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Active campaigns only. Archived campaigns are in the Archived Items page.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="search-box">
              <input type="text" placeholder="Filter campaigns..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '240px' }} />
            </div>
            {isManager && <button className="btn btn-primary" onClick={openCreateModal}>+ New Campaign</button>}
          </div>
        </div>

        <div className="grid-3" style={{ gridTemplateColumns: '1fr 330px', gap: '24px' }}>
          <div className="grid-2" style={{ alignContent: 'start', gap: '20px' }}>
            {loading ? (
              <div className="card col-span-2" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>Loading campaigns...</div>
            ) : campaigns.map((c, i) => (
              <div
                key={c.campaignID}
                className={`card anim-slide-up delay-${i + 1}`}
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  border: selectedCampaign?.campaignID === c.campaignID ? '1px solid var(--border-accent)' : '1px solid var(--border)'
                }}
                onClick={() => setSelectedCampaign(c)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>{c.campaignName}</h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Target: {c.locationName}</div>
                  </div>
                  <span className={`badge badge-${c.status === 'Active' ? 'green' : 'amber'}`}>{c.status}</span>
                </div>

                <div className="grid-2" style={{ gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Budget</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>${c.budget.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Ends</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{new Date(c.endDate).toLocaleDateString()}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <button className="btn btn-sm" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate(`/campaigns/${c.campaignID}`); }}>Details</button>
                  {isManager && <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); handleArchive(c.campaignID); }}>Archive</button>}
                  {isManager && <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(c.campaignID); }}>Delete</button>}
                </div>
              </div>
            ))}

            {campaigns.length === 0 && !loading && (
              <div className="card col-span-2" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No active campaigns found.
              </div>
            )}
          </div>

          <div className="anim-slide-right">
            <div className="card" style={{ height: '100%', padding: '24px', position: 'sticky', top: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginBottom: '16px' }}>Campaign Summary</h3>
              {selectedCampaign ? (
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>{selectedCampaign.campaignName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>{selectedCampaign.locationName}</div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>{campaignSummary}</p>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Status: {selectedCampaign.status}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Budget: ${selectedCampaign.budget.toLocaleString()}</div>
                  <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => navigate(`/campaigns/${selectedCampaign.campaignID}`)}>
                    Open Details
                  </button>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Select a campaign to preview.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2>Create Campaign</h2>
              <button className="modal-close-btn" onClick={() => setIsCreateOpen(false)}>x</button>
            </div>
            <form onSubmit={handleCreateCampaign}>
              <div className="form-group"><label>Campaign Name</label><input required value={formData.campaignName} onChange={e => setFormData(f => ({ ...f, campaignName: e.target.value }))} /></div>
              <div className="form-group"><label>Description</label><textarea value={formData.description || ''} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid-2">
                <div className="form-group"><label>Start Date</label><input type="date" required value={formData.startDate.slice(0, 10)} onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))} /></div>
                <div className="form-group"><label>End Date</label><input type="date" required value={formData.endDate.slice(0, 10)} onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))} /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Budget</label><input type="number" min={0} required value={formData.budget} onChange={e => setFormData(f => ({ ...f, budget: parseFloat(e.target.value || '0') }))} /></div>
                <div className="form-group"><label>Status</label><select value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}><option value="Active">Active</option><option value="Paused">Paused</option></select></div>
              </div>
              <div className="form-group"><label>Target Goal</label><input value={formData.targetGoal || ''} onChange={e => setFormData(f => ({ ...f, targetGoal: e.target.value }))} /></div>
              <div className="form-group"><label>Location</label><select required value={formData.locationID} onChange={e => setFormData(f => ({ ...f, locationID: parseInt(e.target.value, 10) }))}>{locations.map(l => <option key={l.locationID} value={l.locationID}>{l.locationName}</option>)}</select></div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Campaign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Campaigns;
