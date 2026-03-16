import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import campaignService from '../../services/campaignService';
import type { CampaignDTO, CreateCampaignDTO } from '../../services/campaignService';
import locationService from '../../services/locationService';
import type { LocationDTO } from '../../services/locationService';
import MapboxMap from '../../components/common/MapboxMap';

const toDateOnly = (value: string): Date => new Date(`${value}T00:00:00`);

const deriveAutoStatus = (startDate: string, endDate: string): 'Upcoming' | 'Active' | 'Completed' => {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  const today = toDateOnly(new Date().toISOString().slice(0, 10));

  if (today < start) return 'Upcoming';
  if (today > end) return 'Completed';
  return 'Active';
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

const CampaignDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [campaign, setCampaign] = useState<CampaignDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationLoadError, setLocationLoadError] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pauseOnEdit, setPauseOnEdit] = useState(false);
  const [budgetInput, setBudgetInput] = useState('0');
  const [formData, setFormData] = useState<CreateCampaignDTO>({
    campaignName: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    imageUrl: '',
    budget: 0,
    targetGoal: '',
    status: 'Upcoming',
    locationID: 0,
  });

  const isManager = user?.role === 'SuperAdmin' || user?.role === 'Marketing Manager';

  const fetchCampaign = async () => {
    if (!id) return;

    try {
      const data = await campaignService.getCampaign(parseInt(id, 10));
      if (data.isArchived) {
        navigate('/archived');
        return;
      }
      setCampaign(data);
    } catch (_) {
      console.error('Failed to fetch campaign details');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchCampaign(), loadLocations()]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const loadLocations = async () => {
    setIsLoadingLocations(true);
    setLocationLoadError('');
    try {
      const data = await locationService.getLocations({ showArchived: false });
      const active = data.filter(l => !l.isArchived).sort((a, b) => b.locationID - a.locationID);
      setLocations(active);
      if (active.length === 0) {
        setLocationLoadError('No active locations found. Add one in Locations page first.');
      }
    } catch {
      setLocationLoadError('Failed to load locations. Check API and try again.');
    } finally {
      setIsLoadingLocations(false);
    }
  };

  useEffect(() => {
    if (!isEditOpen) return;
    if (locations.length === 0) return;
    if (formData.locationID > 0) return;
    setFormData(prev => ({ ...prev, locationID: locations[0].locationID }));
  }, [isEditOpen, locations, formData.locationID]);

  const openEditModal = () => {
    if (!campaign) return;

    setFormData({
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
    setBudgetInput(String(campaign.budget));
    setPauseOnEdit(campaign.status === 'Paused');
    setIsEditOpen(true);
    loadLocations();
  };

  const validateForm = (): string | null => {
    if (!formData.campaignName.trim()) return 'Campaign name is required.';
    if (!formData.startDate) return 'Start date is required.';
    if (!formData.endDate) return 'End date is required.';
    if (toDateOnly(formData.endDate) < toDateOnly(formData.startDate)) return 'End date must be on or after start date.';

    const budget = Number(budgetInput);
    if (!budgetInput.trim() || Number.isNaN(budget) || budget <= 0) return 'Budget is required and must be greater than 0.';

    if (formData.locationID <= 0) return 'Location is required.';

    return null;
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;

    const error = validateForm();
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
        status: pauseOnEdit ? 'Paused' : deriveAutoStatus(formData.startDate, formData.endDate),
      };

      await campaignService.updateCampaign(campaign.campaignID, payload);
      setIsEditOpen(false);
      await fetchCampaign();
    } catch (err: any) {
      alert(getApiErrorMessage(err, 'Failed to update campaign.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadgeClass = campaign?.status === 'Active'
    ? 'badge-green'
    : campaign?.status === 'Paused'
      ? 'badge-gray'
      : campaign?.status === 'Completed'
        ? 'badge-blue'
        : 'badge-amber';

  const editStatusPreview = pauseOnEdit ? 'Paused' : deriveAutoStatus(formData.startDate, formData.endDate);

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </MainLayout>
  );

  if (!campaign) return (
    <MainLayout>
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Campaign not found</h2>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/campaigns')}>Back to Campaigns</button>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="page-header anim-slide-up">
        <div className="page-header-left">
          <div className="eyebrow">Marketing / Campaigns</div>
          <h1>{campaign.campaignName}</h1>
          <p>{campaign.description}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-ghost" onClick={() => navigate('/campaigns')}>? Back</button>
          {isManager && <button className="btn btn-primary" onClick={openEditModal}>Edit Campaign</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 anim-slide-up delay-1">
        <div className="space-y-6">
          {campaign.imageUrl && (
            <div className="card p-2">
              <img src={campaign.imageUrl} alt={campaign.campaignName} className="w-full h-44 object-cover rounded-xl" />
            </div>
          )}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <span className={`badge ${statusBadgeClass}`}>{campaign.status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Budget</span>
                <span className="text-white font-bold">?{campaign.budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Destination</span>
                <span className="text-purple-300 font-medium">{campaign.locationName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Target Goal</span>
                <span className="text-slate-200">{campaign.targetGoal}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Timeline</h3>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Starts</div>
                <div className="text-slate-200">{new Date(campaign.startDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Ends</div>
                <div className="text-slate-200">{new Date(campaign.endDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-2 h-full min-h-[500px] flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span className="text-purple-400">??</span> Destination Map
              </h3>
              <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-1 rounded border border-purple-500/20">LIVE INTEL</span>
            </div>
            <div className="flex-1 p-2">
              {campaign.latitude && campaign.longitude ? (
                <MapboxMap
                  lat={Number(campaign.latitude)}
                  lng={Number(campaign.longitude)}
                  title={campaign.locationName || campaign.campaignName}
                  description={campaign.description}
                  showRoute={true}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 rounded-xl text-slate-500 italic p-10 text-center">
                  <div className="text-4xl mb-3">??</div>
                  Location coordinates unavailable for this campaign.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2>Edit Campaign</h2>
              <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>x</button>
            </div>
            <form onSubmit={handleUpdateCampaign}>
              <div className="form-group"><label>Campaign Name *</label><input required value={formData.campaignName} onChange={e => setFormData(f => ({ ...f, campaignName: e.target.value }))} /></div>
              <div className="form-group"><label>Description</label><textarea value={formData.description || ''} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="form-group"><label>Campaign Image URL</label><input value={formData.imageUrl || ''} onChange={e => setFormData(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://example.com/image.jpg" /></div>
              <div className="grid-2">
                <div className="form-group"><label>Start Date *</label><input type="date" required value={formData.startDate.slice(0, 10)} onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))} /></div>
                <div className="form-group"><label>End Date *</label><input type="date" required min={formData.startDate.slice(0, 10)} value={formData.endDate.slice(0, 10)} onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))} /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Budget *</label><input type="number" min={0} step="0.01" required value={budgetInput} onFocus={() => budgetInput === '0' && setBudgetInput('')} onBlur={() => !budgetInput.trim() && setBudgetInput('0')} onChange={e => setBudgetInput(e.target.value)} /></div>
                <div className="form-group"><label>Status</label><input disabled value={editStatusPreview} /></div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={pauseOnEdit} onChange={e => setPauseOnEdit(e.target.checked)} />
                  Pause campaign
                </label>
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

export default CampaignDetails;
