import { useState, useEffect } from "react";
import MainLayout from "../../components/layout/MainLayout";
import campaignService from "../../services/campaignService";
import type { CampaignDTO } from "../../services/campaignService";
import leadService from "../../services/leadService";
import type { LeadDTO } from "../../services/leadService";
import locationService from "../../services/locationService";
import type { LocationDTO } from "../../services/locationService";

export default function ArchivedItems() {
  const [activeTab, setActiveTab ] = useState<'campaigns' | 'leads' | 'locations'>('campaigns');
  const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
  const [leads, setLeads] = useState<LeadDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, l, loc] = await Promise.all([
        campaignService.getCampaigns({ showArchived: true }),
        leadService.getLeads({ showArchived: true }),
        locationService.getLocations({ showArchived: true })
      ]);
      setCampaigns(c.filter(x => x.isArchived).sort((a, b) => b.campaignID - a.campaignID));
      setLeads(l.filter(x => x.isArchived).sort((a, b) => b.leadID - a.leadID));
      setLocations(loc.filter(x => x.isArchived).sort((a, b) => b.locationID - a.locationID));
    } catch (e) {
      console.error("Failed to fetch archived items", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (type: string, id: number) => {
    if (!window.confirm("Are you sure you want to restore this item?")) return;
    try {
      if (type === 'campaign') await campaignService.restoreCampaign(id);
      if (type === 'lead') await leadService.restoreLead(id);
      if (type === 'location') await locationService.restoreLocation(id);
      fetchAll();
    } catch (e) {
      alert("Failed to restore item");
    }
  };

  return (
    <MainLayout>
      <div className="anim-slide-up">
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "white", marginBottom: "4px" }}>Archived Items</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>View and restore previously archived system data.</p>
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
          {(['campaigns', 'leads', 'locations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "var(--accent-soft)" : "transparent",
                color: activeTab === tab ? "#c4b5fd" : "var(--text-muted)",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                textTransform: "capitalize"
              }}
            >
              {tab} ({tab === 'campaigns' ? campaigns.length : tab === 'leads' ? leads.length : locations.length})
            </button>
          ))}
        </div>

        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center p-10 italic text-slate-500">Loading archives...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)", fontSize: "12px", color: "var(--text-muted)" }}>
                    <th style={{ padding: "12px" }}>Name / ID</th>
                    <th style={{ padding: "12px" }}>Details</th>
                    <th style={{ padding: "12px" }}>Archived At</th>
                    <th style={{ padding: "12px" }}>Archived By</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'campaigns' && campaigns.map(c => (
                    <tr key={c.campaignID} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "13px" }}>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: "600", color: "white" }}>{c.campaignName}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>#{c.campaignID}</div>
                      </td>
                      <td style={{ padding: "12px" }}>{c.status} • Budget: ${c.budget}</td>
                      <td style={{ padding: "12px" }}>{c.archivedDate ? new Date(c.archivedDate).toLocaleString() : '-'}</td>
                      <td style={{ padding: "12px" }}>{c.archivedByUserName || '-'}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button className="btn btn-sm" onClick={() => handleRestore('campaign', c.campaignID)}>Restore</button>
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'leads' && leads.map(l => (
                    <tr key={l.leadID} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "13px" }}>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: "600", color: "white" }}>Lead #{l.leadID}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{l.source || 'No source'}</div>
                      </td>
                      <td style={{ padding: "12px" }}>Status: {l.leadStatus} • Score: {l.leadScore}</td>
                      <td style={{ padding: "12px" }}>{l.archivedDate ? new Date(l.archivedDate).toLocaleString() : '-'}</td>
                      <td style={{ padding: "12px" }}>{l.archivedByUserName || '-'}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button className="btn btn-sm" onClick={() => handleRestore('lead', l.leadID)}>Restore</button>
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'locations' && locations.map(loc => (
                    <tr key={loc.locationID} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "13px" }}>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: "600", color: "white" }}>{loc.locationName}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>#{loc.locationID}</div>
                      </td>
                      <td style={{ padding: "12px" }}>{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</td>
                      <td style={{ padding: "12px" }}>{loc.archivedDate ? new Date(loc.archivedDate).toLocaleString() : '-'}</td>
                      <td style={{ padding: "12px" }}>{loc.archivedByUserName || '-'}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button className="btn btn-sm" onClick={() => handleRestore('location', loc.locationID)}>Restore</button>
                      </td>
                    </tr>
                  ))}
                  {(activeTab === 'campaigns' ? campaigns : activeTab === 'leads' ? leads : locations).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic" }}>
                        No archived items found in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
