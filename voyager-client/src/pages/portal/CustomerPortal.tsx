import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import customerPortalService from '../../services/customerPortalService';
import type { CampaignOfferDTO, CustomerProfileDTO, CampaignFeedbackDTO, CustomerPreferencesDTO } from '../../services/customerPortalService';
import MapboxMap from '../../components/common/MapboxMap';

export type PortalSection = 'offers' | 'map' | 'campaigns' | 'profile' | 'subscriptions' | 'feedback';

const CATEGORY_ICONS: Record<string, string> = {
  Luxury: '👑',
  Cultural: '🏛️',
  Tropical: '🌴',
  Adventure: '⛰️',
};

const defaultPrefs: CustomerPreferencesDTO = {
  subscribeLuxury: true,
  subscribeCultural: true,
  subscribeTropical: false,
  subscribeAdventure: false,
};

const sectionTitle: Record<PortalSection, string> = {
  offers: 'Discover Your Next Adventure',
  map: 'Destination Map',
  campaigns: 'My Travel Portfolio',
  profile: 'Profile Settings',
  subscriptions: 'Email Preferences',
  feedback: 'Share Your Experience',
};

interface CustomerPortalProps {
  forcedSection?: PortalSection;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ forcedSection }) => {
  const { updateUser } = useAuth();
  const location = useLocation();

  const [offers, setOffers] = useState<CampaignOfferDTO[]>([]);
  const [profile, setProfile] = useState<CustomerProfileDTO>({ userName: '', firstName: '', lastName: '', email: '', phoneNumber: '' });
  const [prefs, setPrefs] = useState<CustomerPreferencesDTO>(() => {
    const raw = localStorage.getItem('voyager_customer_prefs');
    if (raw) {
      try {
        return JSON.parse(raw) as CustomerPreferencesDTO;
      } catch {
        return defaultPrefs;
      }
    }
    return defaultPrefs;
  });
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<CampaignOfferDTO | null>(null);
  const [feedback, setFeedback] = useState<CampaignFeedbackDTO>({ campaignID: 0, rating: 5 });
  const [profileSaved, setProfileSaved] = useState(false);
  const [subscriptionSaved, setSubscriptionSaved] = useState(false);
  const [enrollingCampaignId, setEnrollingCampaignId] = useState<number | null>(null);
  const [selectedMapCampaignId, setSelectedMapCampaignId] = useState<number | null>(null);
  const [itineraryCampaign, setItineraryCampaign] = useState<CampaignOfferDTO | null>(null);

  const section = useMemo<PortalSection>(() => {
    if (forcedSection) return forcedSection;
    const raw = new URLSearchParams(location.search).get('section') as PortalSection | null;
    const allowed: PortalSection[] = ['offers', 'map', 'campaigns', 'profile', 'subscriptions', 'feedback'];
    return raw && allowed.includes(raw) ? raw : 'offers';
  }, [forcedSection, location.search]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('voyager_customer_prefs', JSON.stringify(prefs));
  }, [prefs]);

  const fetchData = async () => {
    try {
      const [offerData, profileData] = await Promise.all([
        customerPortalService.getOffers(),
        customerPortalService.getProfile(),
      ]);
      setOffers(offerData);
      setProfile(profileData);
      const firstEnrolledWithCoords = offerData.find(o => o.isEnrolled && o.status === 'Active' && o.latitude && o.longitude);
      setSelectedMapCampaignId(firstEnrolledWithCoords?.campaignID ?? null);
    } catch {
      console.error('Failed to fetch portal data');
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await customerPortalService.updateProfile(profile);
    updateUser({ userName: profile.userName });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleEnroll = async (offer: CampaignOfferDTO) => {
    if (offer.isEnrolled) return;

    setEnrollingCampaignId(offer.campaignID);
    try {
      await customerPortalService.enrollCampaign(offer.campaignID);
      setOffers(prev => prev.map(o => o.campaignID === offer.campaignID ? { ...o, isEnrolled: true } : o));
      if (offer.status === 'Active' && offer.latitude && offer.longitude) {
        setSelectedMapCampaignId(offer.campaignID);
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || 'Failed to enroll in campaign.');
    } finally {
      setEnrollingCampaignId(null);
    }
  };

  const openFeedback = (offer: CampaignOfferDTO) => {
    if (!offer.isEnrolled) {
      alert('Please enroll first before giving feedback.');
      return;
    }
    if (offer.status !== 'Completed') {
      alert('Feedback can only be submitted after the package date is completed.');
      return;
    }

    setActiveFeedback(offer);
    setFeedback({ campaignID: offer.campaignID, rating: 5 });
    setIsFeedbackOpen(true);
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await customerPortalService.submitFeedback(feedback);
      setIsFeedbackOpen(false);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || 'Failed to submit feedback.');
    }
  };

  const updatePreference = (key: keyof CustomerPreferencesDTO, value: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
    setSubscriptionSaved(true);
    setTimeout(() => setSubscriptionSaved(false), 1800);
  };

  const subscribeAll = () => {
    setPrefs({ subscribeLuxury: true, subscribeCultural: true, subscribeTropical: true, subscribeAdventure: true });
    setSubscriptionSaved(true);
    setTimeout(() => setSubscriptionSaved(false), 1800);
  };

  const unsubscribeAll = () => {
    setPrefs({ subscribeLuxury: false, subscribeCultural: false, subscribeTropical: false, subscribeAdventure: false });
    setSubscriptionSaved(true);
    setTimeout(() => setSubscriptionSaved(false), 1800);
  };

  const enrolled = offers.filter(o => o.isEnrolled);
  const featuredOffers = offers.slice(0, 4);
  const activeEnrolled = enrolled.filter(o => o.status === 'Active');
  const mapOffer = activeEnrolled.find(o => o.campaignID === selectedMapCampaignId) ?? activeEnrolled.find(o => o.latitude && o.longitude) ?? null;

  return (
    <MainLayout>
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-12 md:pb-24">
        {/* Centered Header */}
        <div className="mb-8 md:mb-12 flex flex-col items-center text-center w-full">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-400 mb-2 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Customer Portal
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-2 leading-tight tracking-tight w-full">
            {sectionTitle[section]}
          </h1>
          <p className="text-xs md:text-sm text-secondary leading-relaxed max-w-xl px-4">
            Manage your travel campaigns, preferences, and feedback in one
            consistent space.
          </p>
        </div>

        {/* Centered Stats */}
        {section === 'offers' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-10 md:mb-14 w-full">
            {[
              { label: 'Enrolled', value: enrolled.length, color: 'purple' },
              { label: 'Featured', value: featuredOffers.length, color: 'blue' },
              { label: 'Active', value: offers.filter(o => o.status === 'Active').length, color: 'emerald' },
              { label: 'Ready', value: enrolled.length, color: 'amber' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-card rounded-2xl p-4 md:p-5 border border-main hover:border-purple-500/30 transition-all flex flex-col items-center text-center shadow-md">
                <div className="text-[10px] font-bold uppercase tracking-wider text-secondary mb-1">
                  {stat.label}
                </div>
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[10px] text-muted font-semibold uppercase truncate w-full mt-1">
                  {stat.label === 'Enrolled' && 'campaigns'}
                  {stat.label === 'Featured' && 'top offers'}
                  {stat.label === 'Active' && 'running'}
                  {stat.label === 'Ready' && 'feedback'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Campaign Cards */}
        {(section === 'offers' || section === 'feedback') && (
          <section className="w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 md:mb-8 pb-4 border-b border-main text-center sm:text-left w-full">
              <h2 className="text-lg md:text-xl font-bold text-primary tracking-tight">
                Available Campaigns
              </h2>
              <div className="px-3 py-1.5 mt-3 sm:mt-0 rounded-full bg-card border border-main text-xs text-secondary font-semibold shadow-sm">
                {offers.length} Destination{offers.length !== 1 && 's'} Found
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 w-full">
              {offers.map(offer => (
                <div
                  key={offer.campaignID}
                  className="bg-card rounded-xl border border-main overflow-hidden hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group flex flex-col"
                >
                  <div className="relative h-40 bg-card border-b border-main">
                    {offer.imageUrl && (
                      <img
                        src={offer.imageUrl}
                        alt={offer.campaignName}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-sm">
                      <span className="text-sm">{offer.locationName?.[0] ?? '🌍'}</span>
                      <span className="text-[9px] font-bold text-white tracking-wider uppercase">{offer.locationName}</span>
                    </div>

                    {offer.isEnrolled && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-emerald-500/90 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm shadow-emerald-500/30">
                        Enrolled
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-primary mb-2 leading-tight tracking-tight">
                      {offer.campaignName}
                    </h3>
                    <p className="text-xs text-secondary mb-6 line-clamp-2 leading-relaxed">
                      {offer.description ?? 'A pristine, premium travel experience awaits you on this journey.'}
                    </p>

                    <div className="mt-auto">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono font-semibold mb-4 bg-slate-900/80 p-2.5 rounded-lg border border-white/5 shadow-inner">
                        <span className="text-xs">🗓️</span>
                        {new Date(offer.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                        <span className="text-purple-500/50 mx-1">→</span>
                        {new Date(offer.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </div>

                      <div className="flex flex-col sm:flex-row xl:flex-row gap-2.5">
                        {!offer.isEnrolled && (
                          <button
                            onClick={() => handleEnroll(offer)}
                            disabled={enrollingCampaignId === offer.campaignID}
                            className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-[11px] font-bold uppercase tracking-wide transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
                          >
                            {enrollingCampaignId === offer.campaignID ? '...' : "I'm Interested"}
                          </button>
                        )}
                        <button
                          onClick={() => openFeedback(offer)}
                          disabled={!offer.isEnrolled || offer.status !== 'Completed'}
                          className="flex-1 py-2 px-3 rounded-lg bg-card hover:bg-slate-700 border border-main text-secondary text-[11px] font-bold uppercase tracking-wide transition-all disabled:opacity-30 shadow-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Map Section */}
        {section === 'map' && (
          <section className="flex flex-col items-center w-full">
            <div className="mb-6 md:mb-8 text-center">
              <h2 className="text-xl md:text-2xl font-bold text-primary mb-4">Destination Tracker</h2>
              {activeEnrolled.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                  {activeEnrolled.map(c => (
                    <button
                      key={c.campaignID}
                      onClick={() => setSelectedMapCampaignId(c.campaignID)}
                      className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                        c.campaignID === mapOffer?.campaignID
                          ? 'bg-purple-500 text-white shadow-purple-500/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {c.campaignName}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-full max-w-5xl rounded-xl overflow-hidden border border-white/10 h-[350px] md:h-[450px] shadow-lg relative">
              {mapOffer && mapOffer.latitude && mapOffer.longitude ? (
                <MapboxMap
                  lat={Number(mapOffer.latitude)}
                  lng={Number(mapOffer.longitude)}
                  title={`${mapOffer.campaignName} - ${mapOffer.locationName || 'Destination'}`}
                  description={mapOffer.description}
                  showRoute={true}
                  showTravelInfo={true}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/60 text-slate-500">
                  <span className="text-4xl mb-3 opacity-40">🗺️</span>
                  <span className="text-xs font-semibold tracking-wide">Select an enrolled campaign to view its active map</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* My Campaigns Table */}
        {section === 'campaigns' && (
          <section className="w-full flex justify-center">
            <div className="w-full max-w-5xl">
              <h2 className="text-xl md:text-2xl font-bold text-primary mb-6 text-center sm:text-left tracking-tight">My Campaigns</h2>
              <div className="bg-card rounded-xl border border-main overflow-x-auto shadow-lg">
                {enrolled.length > 0 ? (
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-main bg-black/10">
                        <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted">Campaign Name</th>
                        <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted">Destination</th>
                        <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-muted">Itinerary</th>
                        <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted">End Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-main">
                      {enrolled.map(o => (
                        <tr key={o.campaignID} className="hover:bg-accent-soft transition-colors">
                          <td className="px-5 py-4 text-[13px] font-bold text-primary tracking-wide">{o.campaignName}</td>
                          <td className="px-5 py-4 text-xs text-secondary font-medium">{o.locationName ?? '-'}</td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => setItineraryCampaign(o)}
                              className="px-3 py-1.5 bg-card hover:bg-accent border border-main text-secondary hover:text-white rounded-md text-[11px] font-bold transition-all shadow-sm"
                            >
                              View Guide
                            </button>
                          </td>
                          <td className="px-5 py-4 text-right text-xs text-secondary font-mono font-medium">{new Date(o.endDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-20 text-center flex flex-col items-center">
                    <span className="text-3xl mb-4 opacity-30">🧭</span>
                    <span className="text-slate-400 font-medium text-xs">No campaigns enrolled yet. Time to explore.</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Profile Section */}
        {section === 'profile' && (
          <section className="w-full flex justify-center mt-4">
            <div className="w-full max-w-2xl bg-card rounded-2xl border border-main shadow-lg overflow-hidden">
              <div className="p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-primary mb-6 tracking-tight text-center sm:text-left">Profile Settings</h2>
                <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">First Name</label>
                      <input
                        className="w-full bg-card border border-main rounded-lg px-4 py-3 text-sm text-primary focus:outline-none focus:border-purple-500 transition-all shadow-inner"
                        value={profile.firstName}
                        onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Last Name</label>
                      <input
                        className="w-full bg-card border border-main rounded-lg px-4 py-3 text-sm text-primary focus:outline-none focus:border-purple-500 transition-all shadow-inner"
                        value={profile.lastName}
                        onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-secondary mb-2">Username</label>
                    <input
                      className="w-full bg-card border border-main rounded-lg px-4 py-3 text-sm text-primary focus:outline-none focus:border-purple-500 transition-all shadow-inner"
                      value={profile.userName}
                      onChange={e => setProfile(p => ({ ...p, userName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-secondary mb-2">Email Address</label>
                      <input
                        readOnly
                        className="w-full bg-card/60 border border-main rounded-lg px-4 py-3 text-sm text-muted cursor-not-allowed"
                        value={profile.email}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Phone Number</label>
                      <input
                        className="w-full bg-card border border-main rounded-lg px-4 py-3 text-sm text-primary focus:outline-none focus:border-purple-500 transition-all shadow-inner"
                        value={profile.phoneNumber}
                        onChange={e => setProfile(p => ({ ...p, phoneNumber: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                  <div className="pt-4 w-full">
                    <button
                      type="submit"
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                        profileSaved
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                          : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/20'
                      }`}
                    >
                      {profileSaved ? 'Profile Updated ✓' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Subscriptions */}
        {section === 'subscriptions' && (
          <section className="w-full flex justify-center mt-4">
            <div className="w-full max-w-2xl bg-card rounded-2xl border border-main shadow-lg overflow-hidden">
              <div className="p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-primary mb-3 tracking-tight text-center sm:text-left">Campaign Subscriptions</h2>
                <p className="text-xs md:text-sm text-secondary mb-6 text-center sm:text-left leading-relaxed">Personalize the exact destination deals and travel offers you receive in your inbox.</p>
                
                <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-800/50 p-4 rounded-xl border border-white/5 shadow-inner">
                  <button
                    onClick={subscribeAll}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    Subscribe All
                  </button>
                  <button
                    onClick={unsubscribeAll}
                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    Unsubscribe All
                  </button>
                </div>

                {subscriptionSaved && (
                  <div className="mb-6 text-center text-xs text-emerald-400 font-bold uppercase tracking-wide bg-emerald-500/10 py-3 rounded-xl border border-emerald-500/20 shadow-sm">
                    Preferences Saved Successfully!
                  </div>
                )}

                <div className="space-y-3">
                  {(Object.keys(CATEGORY_ICONS) as (keyof typeof CATEGORY_ICONS)[]).map(cat => {
                    const key = `subscribe${cat}` as keyof typeof prefs;
                    return (
                      <div key={cat} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-800 rounded-xl border border-white/5 hover:border-white/10 transition-all group gap-4 shadow-sm">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="w-10 h-10 shrink-0 rounded-lg bg-black/20 flex items-center justify-center text-lg border border-white/5 shadow-inner transition-transform group-hover:scale-110">
                            {CATEGORY_ICONS[cat]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-100 mb-0.5">{cat} Travel</p>
                            <p className="text-[10px] uppercase font-semibold text-slate-500">Exclusive {cat} Drops</p>
                          </div>
                        </div>
                        <button
                          onClick={() => updatePreference(key, !prefs[key])}
                          className={`w-12 h-6 shrink-0 rounded-full p-1 transition-all relative self-end sm:self-auto ${
                            prefs[key] ? 'bg-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.4)]' : 'bg-slate-900 border border-white/10'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${prefs[key] ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Feedback Section */}
        {section === 'feedback' && enrolled.length > 0 && (
          <section className="w-full flex justify-center mt-4">
            <div className="w-full max-w-5xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-6 tracking-tight text-center sm:text-left">Provide Feedback</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {enrolled.map(offer => (
                  <div key={offer.campaignID} className="bg-slate-900/60 rounded-xl border border-white/10 p-6 shadow-lg flex flex-col hover:border-purple-500/30 transition-all">
                    <h3 className="text-lg font-bold text-white mb-2">{offer.campaignName}</h3>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed flex-1">{offer.description ?? 'Share your unique experience with us.'}</p>
                    <button
                      onClick={() => openFeedback(offer)}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-xs font-bold uppercase tracking-wide rounded-lg transition-all shadow-md shadow-purple-500/20"
                    >
                      Open Feedback
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Feedback Modal */}
      {isFeedbackOpen && activeFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-card rounded-2xl md:rounded-3xl border border-main p-6 md:p-10 shadow-2xl">
            <div className="flex items-start justify-between mb-6 md:mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-primary mb-1">{activeFeedback.campaignName}</h2>
                <p className="text-xs md:text-sm text-secondary">We value your travel feedback</p>
              </div>
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="text-secondary hover:text-primary text-2xl md:text-3xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitFeedback} className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary mb-2 md:mb-3">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedback(f => ({ ...f, rating: star }))}
                      className={`flex-1 h-10 md:h-12 rounded-xl text-lg md:text-xl transition-all ${
                        star <= feedback.rating
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                          : 'bg-accent-soft text-muted hover:bg-slate-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary mb-2">Comment</label>
                <textarea
                  required
                  className="w-full bg-card border border-main rounded-xl px-4 py-3 md:py-4 text-sm text-primary min-h-[100px] md:min-h-[120px] focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  placeholder="Tell us about your experience..."
                  onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(false)}
                  className="flex-1 py-3 md:py-3.5 bg-card hover:bg-accent-soft border border-main text-secondary rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 md:py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/20"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Itinerary Modal */}
      {itineraryCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-card rounded-2xl md:rounded-3xl border border-main p-6 md:p-8 shadow-2xl">
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-2">{itineraryCampaign.campaignName}</h2>
            <p className="text-xs md:text-sm text-secondary mb-6 font-mono bg-black/5 p-3 rounded-lg border border-main">
              {new Date(itineraryCampaign.startDate).toLocaleDateString()} - {new Date(itineraryCampaign.endDate).toLocaleDateString()}
            </p>
            <div className="space-y-4 text-sm mb-8 bg-card p-5 rounded-xl border border-main">
              <div><span className="text-muted block text-[10px] uppercase font-bold tracking-wider mb-1">Destination</span><span className="text-secondary font-semibold">{itineraryCampaign.locationName ?? 'N/A'}</span></div>
              <div className="border-t border-main pt-3"><span className="text-muted block text-[10px] uppercase font-bold tracking-wider mb-1">Target Goal</span><span className="text-secondary">{itineraryCampaign.targetGoal || 'Standard package'}</span></div>
              <div className="border-t border-main pt-3"><span className="text-muted block text-[10px] uppercase font-bold tracking-wider mb-1">General Notes</span><span className="text-secondary leading-relaxed">{itineraryCampaign.description || 'Details provided by manager'}</span></div>
            </div>
            <button
              onClick={() => setItineraryCampaign(null)}
              className="w-full py-3 md:py-3.5 bg-card hover:bg-accent-soft border border-main text-primary rounded-xl text-sm font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CustomerPortal;
