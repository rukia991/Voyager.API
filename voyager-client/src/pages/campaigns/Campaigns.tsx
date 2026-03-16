import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import campaignService from '../../services/campaignService';
import type { CampaignDTO, CreateCampaignDTO } from '../../services/campaignService';
import locationService from '../../services/locationService';
import type { LocationDTO } from '../../services/locationService';

const todayIso = new Date().toISOString().slice(0, 10);

const defaultCampaign: CreateCampaignDTO = {
  campaignName: '',
  description: '',
  startDate: todayIso,
  endDate: todayIso,
  imageUrl: '',
  budget: 0,
  targetGoal: '',
  status: 'Upcoming',
  locationID: 0,
};

const toDateOnly = (value: string): Date => new Date(`${value}T00:00:00`);

const deriveAutoStatus = (startDate: string, endDate: string): 'Upcoming' | 'Active' | 'Completed' => {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  const today = toDateOnly(new Date().toISOString().slice(0, 10));

  if (today < start) return 'Upcoming';
  if (today > end) return 'Completed';
  return 'Active';
};

const badgeVariant = (status: string) => {
  if (status === 'Active') return 'green';
  if (status === 'Paused') return 'gray';
  if (status === 'Completed') return 'blue';
  return 'amber';
};

const getApiErrorMessage = (err: any, fallback: string) => {
  const responseData = err?.response?.data;
  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }
  const message = responseData?.message || responseData?.title || err?.message;
  if (!message) return fallback;
  const status = err?.response?.status;
  return status ? `${message} (HTTP ${status})` : message;
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationLoadError, setLocationLoadError] = useState('');

  const [formData, setFormData] = useState<CreateCampaignDTO>(defaultCampaign);
  const [budgetInput, setBudgetInput] = useState('0');
  const [editFormData, setEditFormData] = useState<CreateCampaignDTO>(defaultCampaign);
  const [editBudgetInput, setEditBudgetInput] = useState('0');
  const [pauseOnEdit, setPauseOnEdit] = useState(false);

  const isManager = !!user && (user.role === 'SuperAdmin' || user.role === 'Admin' || user.role === 'Marketing Manager');

  useEffect(() => {
    fetchData();
  }, [search]);

  useEffect(() => {
    if (!isCreateOpen) return;
    if (locations.length === 0) return;
    if (formData.locationID > 0) return;
    setFormData(prev => ({ ...prev, locationID: locations[0].locationID }));
  }, [isCreateOpen, locations, formData.locationID]);

  useEffect(() => {
    if (!isEditOpen) return;
    if (locations.length === 0) return;
    if (editFormData.locationID > 0) return;
    setEditFormData(prev => ({ ...prev, locationID: locations[0].locationID }));
  }, [isEditOpen, locations, editFormData.locationID]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campaignData, locationData] = await Promise.all([
        campaignService.getCampaigns({ search, showArchived: false }),
        locationService.getLocations({ showArchived: false }),
      ]);

      const activeCampaigns = campaignData.filter(c => !c.isArchived).sort((a, b) => b.campaignID - a.campaignID);
      setCampaigns(activeCampaigns);
      setLocations(locationData.filter(l => !l.isArchived).sort((a, b) => b.locationID - a.locationID));
      setLocationLoadError('');

      if (activeCampaigns.length > 0 && (!selectedCampaign || selectedCampaign.isArchived)) {
        setSelectedCampaign(activeCampaigns[0]);
      }
    } catch (e) {
      console.error('Failed to fetch campaigns', e);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async (): Promise<LocationDTO[]> => {
    setIsLoadingLocations(true);
    setLocationLoadError('');
    try {
      const data = await locationService.getLocations({ showArchived: false });
      const active = data.filter(l => !l.isArchived).sort((a, b) => b.locationID - a.locationID);
      setLocations(active);
      if (active.length === 0) {
        setLocationLoadError('No active locations found. Add one in Locations page first.');
      }
      return active;
    } catch (e) {
      setLocationLoadError('Failed to load locations. Check API and try again.');
      return [];
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const validateCampaignForm = (name: string, startDate: string, endDate: string, rawBudget: string, locationID: number): string | null => {
    if (!name.trim()) return 'Campaign name is required.';
    if (!startDate) return 'Start date is required.';
    if (!endDate) return 'End date is required.';
    if (toDateOnly(endDate) < toDateOnly(startDate)) return 'End date must be on or after start date.';

    const budget = Number(rawBudget);
    if (!rawBudget.trim() || Number.isNaN(budget) || budget <= 0) return 'Budget is required and must be greater than 0.';

    if (locationID <= 0) return 'Location is required.';

    return null;
  };

  const handleArchive = async (id: number) => {
    if (!window.confirm('Archive this campaign? It will move to Archived Items.')) return;
    try {
      await campaignService.archiveCampaign(id);
      setCampaigns(prev => prev.filter(c => c.campaignID !== id));
      if (selectedCampaign?.campaignID === id) setSelectedCampaign(null);
      await fetchData();
    } catch (err: any) {
      alert(getApiErrorMessage(err, 'Failed to archive campaign.'));
    }
  };

  const openCreateModal = async () => {
    const currentLocations = await loadLocations();

    const locationID = currentLocations[0]?.locationID ?? 0;
    const initial = { ...defaultCampaign, locationID };
    setFormData(initial);
    setBudgetInput('0');
    setIsCreateOpen(true);
  };

  const openEditModal = (campaign: CampaignDTO) => {
    setEditFormData({
      campaignName: campaign.campaignName,
      description: campaign.description || '',
      startDate: campaign.startDate.slice(0, 10),
      endDate: campaign.endDate.slice(0, 10),
      imageUrl: campaign.imageUrl || '',
      budget: campaign.budget,
      targetGoal: campaign.targetGoal || '',
      status: campaign.status,
      locationID: campaign.locationID,
    });
    setEditBudgetInput(String(campaign.budget));
    setPauseOnEdit(campaign.status === 'Paused');
    setSelectedCampaign(campaign);
    setIsEditOpen(true);
  };

  useEffect(() => {
    if (!isEditOpen) return;
    loadLocations();
  }, [isEditOpen]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateCampaignForm(formData.campaignName, formData.startDate, formData.endDate, budgetInput, formData.locationID);
    if (error) {
      alert(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateCampaignDTO = {
        ...formData,
        campaignName: formData.campaignName.trim(),
        budget: Number(budgetInput),
        status: deriveAutoStatus(formData.startDate, formData.endDate),
      };

      await campaignService.createCampaign(payload);
      setIsCreateOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(getApiErrorMessage(err, 'Failed to create campaign.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCampaign) {
      alert('No campaign selected for editing.');
      return;
    }

    const error = validateCampaignForm(editFormData.campaignName, editFormData.startDate, editFormData.endDate, editBudgetInput, editFormData.locationID);
    if (error) {
      alert(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateCampaignDTO = {
        ...editFormData,
        campaignName: editFormData.campaignName.trim(),
        budget: Number(editBudgetInput),
        status: pauseOnEdit ? 'Paused' : deriveAutoStatus(editFormData.startDate, editFormData.endDate),
      };

      await campaignService.updateCampaign(selectedCampaign.campaignID, payload);
      setIsEditOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(getApiErrorMessage(err, 'Failed to update campaign.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const createStatusPreview = deriveAutoStatus(formData.startDate, formData.endDate);
  const editAutoStatusPreview = deriveAutoStatus(editFormData.startDate, editFormData.endDate);

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
                  border: selectedCampaign?.campaignID === c.campaignID ? '1px solid var(--border-accent)' : '1px solid var(--border)',
                }}
                onClick={() => setSelectedCampaign(c)}
              >
                {c.imageUrl && (
                  <img
                    src={c.imageUrl}
                    alt={c.campaignName}
                    style={{ width: '100%', height: '138px', objectFit: 'cover', borderRadius: '12px', marginBottom: '14px', border: '1px solid var(--border)' }}
                  />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>{c.campaignName}</h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Target: {c.locationName}</div>
                  </div>
                  <span className={`badge badge-${badgeVariant(c.status)}`}>{c.status}</span>
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
                  {isManager && <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); openEditModal(c); }}>Edit</button>}
                  {isManager && <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); handleArchive(c.campaignID); }}>Archive</button>}
                </div>
              </div>
            ))}

            {campaigns.length === 0 && !loading && (
              <div className="card col-span-2" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No active campaigns found.
              </div>
            )}
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
              <div className="form-group"><label>Campaign Name *</label><input required value={formData.campaignName} onChange={e => setFormData(f => ({ ...f, campaignName: e.target.value }))} /></div>
              <div className="form-group"><label>Description</label><textarea value={formData.description || ''} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="form-group"><label>Campaign Image URL</label><input value={formData.imageUrl || ''} onChange={e => setFormData(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://example.com/image.jpg" /></div>
              <div className="grid-2">
                <div className="form-group"><label>Start Date *</label><input type="date" required value={formData.startDate.slice(0, 10)} onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))} /></div>
                <div className="form-group"><label>End Date *</label><input type="date" required min={formData.startDate.slice(0, 10)} value={formData.endDate.slice(0, 10)} onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))} /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Budget *</label><input type="number" min={0} step="0.01" required value={budgetInput} onFocus={() => budgetInput === '0' && setBudgetInput('')} onBlur={() => !budgetInput.trim() && setBudgetInput('0')} onChange={e => setBudgetInput(e.target.value)} /></div>
                <div className="form-group"><label>Status</label><input disabled value={createStatusPreview} /></div>
              </div>
              <div className="form-group"><label>Target Goal</label><input value={formData.targetGoal || ''} onChange={e => setFormData(f => ({ ...f, targetGoal: e.target.value }))} /></div>
              <div className="form-group">
                <label>Location *</label>
                <select required value={formData.locationID} onChange={e => setFormData(f => ({ ...f, locationID: parseInt(e.target.value, 10) }))} disabled={isLoadingLocations || locations.length === 0}>
                  {isLoadingLocations && <option value={0}>Loading locations...</option>}
                  {!isLoadingLocations && locations.length === 0 && <option value={0}>No locations available</option>}
                  {locations.map(l => <option key={l.locationID} value={l.locationID}>{l.locationName}</option>)}
                </select>
                {locationLoadError && <small style={{ color: '#fca5a5' }}>{locationLoadError}</small>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Campaign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && selectedCampaign && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2>Edit Campaign</h2>
              <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>x</button>
            </div>
            <form onSubmit={handleUpdateCampaign}>
              <div className="form-group"><label>Campaign Name *</label><input required value={editFormData.campaignName} onChange={e => setEditFormData(f => ({ ...f, campaignName: e.target.value }))} /></div>
              <div className="form-group"><label>Description</label><textarea value={editFormData.description || ''} onChange={e => setEditFormData(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="form-group"><label>Campaign Image URL</label><input value={editFormData.imageUrl || ''} onChange={e => setEditFormData(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://example.com/image.jpg" /></div>
              <div className="grid-2">
                <div className="form-group"><label>Start Date *</label><input type="date" required value={editFormData.startDate.slice(0, 10)} onChange={e => setEditFormData(f => ({ ...f, startDate: e.target.value }))} /></div>
                <div className="form-group"><label>End Date *</label><input type="date" required min={editFormData.startDate.slice(0, 10)} value={editFormData.endDate.slice(0, 10)} onChange={e => setEditFormData(f => ({ ...f, endDate: e.target.value }))} /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Budget *</label><input type="number" min={0} step="0.01" required value={editBudgetInput} onFocus={() => editBudgetInput === '0' && setEditBudgetInput('')} onBlur={() => !editBudgetInput.trim() && setEditBudgetInput('0')} onChange={e => setEditBudgetInput(e.target.value)} /></div>
                <div className="form-group"><label>Status</label><input disabled value={pauseOnEdit ? 'Paused' : editAutoStatusPreview} /></div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={pauseOnEdit} onChange={e => setPauseOnEdit(e.target.checked)} />
                  Pause campaign
                </label>
              </div>
              <div className="form-group"><label>Target Goal</label><input value={editFormData.targetGoal || ''} onChange={e => setEditFormData(f => ({ ...f, targetGoal: e.target.value }))} /></div>
              <div className="form-group">
                <label>Location *</label>
                <select required value={editFormData.locationID} onChange={e => setEditFormData(f => ({ ...f, locationID: parseInt(e.target.value, 10) }))} disabled={isLoadingLocations || locations.length === 0}>
                  {isLoadingLocations && <option value={0}>Loading locations...</option>}
                  {!isLoadingLocations && locations.length === 0 && <option value={0}>No locations available</option>}
                  {locations.map(l => <option key={l.locationID} value={l.locationID}>{l.locationName}</option>)}
                </select>
                {locationLoadError && <small style={{ color: '#fca5a5' }}>{locationLoadError}</small>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Campaigns;
