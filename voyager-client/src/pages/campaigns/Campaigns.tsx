import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import campaignService from '../../services/campaignService';
import type { CampaignDTO } from '../../services/campaignService';
import MapboxMap from '../../components/common/MapboxMap';

const Campaigns: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDTO | null>(null);

  const isManager = user?.role === 'SuperAdmin' || user?.role === 'Marketing Manager';

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getCampaigns({ search, showArchived: false });
      setCampaigns(data.filter(c => !c.isArchived));
    } catch (_) {
      console.error("Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: number) => {
    if (!window.confirm("Are you sure you want to archive this campaign? It will be moved to the Archived Items page.")) return;
    try { 
      await campaignService.archiveCampaign(id); 
      fetchData(); 
      if (selectedCampaign?.campaignID === id) setSelectedCampaign(null);
    } catch (_) { 
      console.error('Failed to archive'); 
    }
  };

  return (
    <MainLayout>
      <div className="anim-slide-up">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "26px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "white", marginBottom: "4px" }}>Marketing Campaigns</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Track and manage your global marketing initiatives.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div className="search-box">
              <input type="text" placeholder="Filter campaigns..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "240px" }} />
            </div>
            {isManager && (
              <button className="btn btn-primary">
                <span>+</span> New Campaign
              </button>
            )}
          </div>
        </div>

        <div className="grid-3" style={{ gridTemplateColumns: "1fr 340px", gap: "24px" }}>
          {/* Main Grid */}
          <div className="grid-2" style={{ alignContent: "start", gap: "20px" }}>
            {loading ? (
              <div className="card col-span-2" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontStyle: "italic" }}>
                Loading campaigns...
              </div>
            ) : campaigns.map((c, i) => (
              <div 
                key={c.campaignID} 
                className={`card anim-slide-up delay-${i + 1}`} 
                style={{ 
                  padding: "24px", 
                  cursor: "pointer", 
                  border: selectedCampaign?.campaignID === c.campaignID ? "1px solid var(--border-accent)" : "1px solid var(--border)"
                }}
                onClick={() => setSelectedCampaign(c)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "white" }}>{c.campaignName}</h3>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Target: {c.locationName}</div>
                  </div>
                  <span className={`badge badge-${c.status === 'Active' ? 'green' : 'amber'}`}>{c.status}</span>
                </div>

                <div className="grid-2" style={{ gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Budget</div>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "white" }}>${c.budget.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Ends</div>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "white" }}>{new Date(c.endDate).toLocaleDateString()}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                  <button className="btn btn-sm" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate(`/campaigns/${c.campaignID}`); }}>Details</button>
                  <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); handleArchive(c.campaignID); }}>Archive</button>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && !loading && (
              <div className="card col-span-2" style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)", fontStyle: "italic" }}>
                No active campaigns found. Check the Archived Items for older records.
              </div>
            )}
          </div>

          {/* Map Preview Side Panel */}
          <div className="anim-slide-right">
            <div className="card" style={{ height: "100%", padding: "24px", position: "sticky", top: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "white", marginBottom: "16px" }}>Live Deployment</h3>
              <div style={{ height: "300px", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", marginBottom: "20px" }}>
                {(selectedCampaign || campaigns.length > 0) ? (
                  <MapboxMap 
                    lat={(selectedCampaign ?? campaigns[0]).latitude || 0} 
                    lng={(selectedCampaign ?? campaigns[0]).longitude || 0} 
                    title={(selectedCampaign ?? campaigns[0]).campaignName} 
                    showRoute={false}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900/50 flex items-center justify-center text-slate-500 italic">No map data available</div>
                )}
              </div>
              {selectedCampaign && (
                <div className="anim-fade-in">
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "20px" }}>
                    {selectedCampaign.description || "No description provided for this campaign."}
                  </div>
                  <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={() => navigate(`/campaigns/${selectedCampaign.campaignID}`)}>
                    Analyze Performance
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Campaigns;
