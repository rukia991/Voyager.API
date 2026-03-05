import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import campaignService from '../../services/campaignService';
import type { CampaignDTO } from '../../services/campaignService';
import MapboxMap from '../../components/common/MapboxMap';

const CampaignDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        if (id) {
          const data = await campaignService.getCampaign(parseInt(id));
          setCampaign(data);
        }
      } catch (_) {
        console.error("Failed to fetch campaign details");
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [id]);

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
          <button className="btn btn-ghost" onClick={() => navigate('/campaigns')}>← Back</button>
          <button className="btn btn-primary">Edit Campaign</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 anim-slide-up delay-1">
        {/* Left Column: Details */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <span className={`badge ${campaign.status === 'Active' ? 'badge-green' : 'badge-amber'}`}>{campaign.status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Budget</span>
                <span className="text-white font-bold">₱{campaign.budget.toLocaleString()}</span>
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

        {/* Right Column: Map */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-2 h-full min-h-[500px] flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span className="text-purple-400">📍</span> Destination Map
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
                  <div className="text-4xl mb-3">📡</div>
                  Location coordinates unavailable for this campaign.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CampaignDetails;
