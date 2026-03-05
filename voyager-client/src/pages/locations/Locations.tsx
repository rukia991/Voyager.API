import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import locationService from '../../services/locationService';
import type { LocationDTO } from '../../services/locationService';
import MapboxMap from '../../components/common/MapboxMap';

const Locations: React.FC = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<LocationDTO, 'locationID'>>({
    locationName: '', latitude: 0, longitude: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const isManager = !!user && (user.role === 'SuperAdmin' || user.role === 'Marketing Manager');


  useEffect(() => { fetchLocations(); }, []);

  const fetchLocations = async () => {
    try { 
      const data = await locationService.getLocations({ showArchived: false });
      setLocations(data.filter(l => !l.isArchived)); 
    } catch (_) { 
      console.error("Error occurred"); 
    }
  };

  const handleArchive = async (id: number) => {
    if (!window.confirm("Are you sure you want to archive this location? It will be moved to the Archived Items page.")) return;
    try {
      await locationService.archiveLocation(id);
      fetchLocations();
      if (selectedLocation?.locationID === id) setSelectedLocation(null);
    } catch (e) {
      alert("Failed to archive location");
    }
  };

  const handleSearchPlace = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${(window as any).mapboxToken || ''}`);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const name = data.features[0].text;
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng, locationName: name }));
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newLoc = await locationService.createLocation(formData);
      setIsModalOpen(false);
      fetchLocations();
      setSelectedLocation(newLoc);
      setFormData({ locationName: '', latitude: 0, longitude: 0 });
      setSearchQuery('');
    } catch (_) { 
      console.error("Error creating location"); 
    }
  };

  const filtered = locations.filter(l => l.locationName.toLowerCase().includes(search.toLowerCase()));

  return (
    <MainLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "26px" }} className="anim-slide-up">
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "white", marginBottom: "4px" }}>System Locations</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Manage service areas and campaign targets.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div className="search-box">
            <input placeholder="Filter locations..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "240px" }} />
          </div>
          {isManager && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <span>+</span> Add Location
            </button>
          )}
        </div>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: "320px 1fr", gap: "24px" }}>
        {/* Left Side: List */}
        <div className="anim-slide-up delay-1" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ height: "calc(100vh - 280px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "4px" }}>
            {filtered.map((loc) => (
              <div 
                key={loc.locationID} 
                className={`card ${selectedLocation?.locationID === loc.locationID ? 'border-purple-500/50 bg-purple-500/5' : ''}`}
                style={{ padding: "16px", cursor: "pointer", transition: "all 0.2s" }}
                onClick={() => setSelectedLocation(loc)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", color: "white" }}>{loc.locationName}</h3>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>ID: #{loc.locationID}</div>
                  </div>
                  <button 
                    className="btn btn-sm btn-ghost" 
                    onClick={(e) => { e.stopPropagation(); handleArchive(loc.locationID); }}
                    style={{ height: "28px", padding: "0 8px", fontSize: "11px" }}
                  >
                    Archive
                  </button>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                  {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "12px", fontStyle: "italic" }}>
                No locations found.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map */}
        <div className="anim-slide-up delay-2 h-full">
          <div className="card h-full" style={{ padding: "0", overflow: "hidden", minHeight: "500px" }}>
            {(selectedLocation || filtered.length > 0) ? (
              <MapboxMap 
                lat={(selectedLocation ?? filtered[0]).latitude} 
                lng={(selectedLocation ?? filtered[0]).longitude} 
                title={(selectedLocation ?? filtered[0]).locationName} 
                showRoute={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900/50 text-slate-500 italic">
                Add locations to view mapping
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h2>Add New Location</h2>
              <button onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                <input 
                  style={{ flex: 1 }}
                  placeholder="Search a place (e.g. Siargao)..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchPlace()}
                />
                <button className="btn btn-primary" onClick={handleSearchPlace} disabled={isSearching}>
                  {isSearching ? '...' : '🔍'}
                </button>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "20px", fontStyle: "italic" }}>
                Tip: Searching will auto-fill coordinates below.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Location Name</label>
                  <input 
                    value={formData.locationName} 
                    onChange={e => setFormData({ ...formData, locationName: e.target.value })} 
                    required 
                    placeholder="Enter location display name"
                  />
                </div>
                <div className="grid-2" style={{ gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Latitude</label>
                    <input 
                      type="number" step="any" 
                      value={formData.latitude} 
                      onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Longitude</label>
                    <input 
                      type="number" step="any" 
                      value={formData.longitude} 
                      onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })} 
                      required 
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: "10px", width: "100%" }}>
                  Save Location
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Locations;
