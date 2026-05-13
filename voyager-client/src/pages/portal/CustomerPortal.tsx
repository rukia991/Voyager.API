import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/useAuth';
import customerPortalService from '../../services/customerPortalService';
import type { CampaignOfferDTO, CustomerProfileDTO, CampaignFeedbackDTO, CustomerPreferencesDTO } from '../../services/customerPortalService';
import MapboxMap from '../../components/common/MapboxMap';
import { getApiErrorMessage } from '../../utils/apiError';

export type PortalSection = 'offers' | 'map' | 'campaigns' | 'profile' | 'subscriptions' | 'feedback';

const CATEGORY_ICONS: Record<string, string> = {
  Luxury: 'L',
  Cultural: 'C',
  Tropical: 'T',
  Adventure: 'A',
};

const defaultPrefs: CustomerPreferencesDTO = {
  subscribeLuxury: true,
  subscribeCultural: true,
  subscribeTropical: false,
  subscribeAdventure: false,
};

const sectionTitle: Record<PortalSection, string> = {
  offers: 'Customer Home',
  map: 'Destination Map',
  campaigns: 'My Campaigns',
  profile: 'Profile & Contact Preferences',
  subscriptions: 'Email Subscription Preferences',
  feedback: 'Campaign Feedback',
};

interface CustomerPortalProps {
  forcedSection?: PortalSection;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ forcedSection }) => {
  const { updateUser } = useAuth();
  const location = useLocation();

  const [offers, setOffers] = useState<CampaignOfferDTO[]>([]);
  const [profile, setProfile] = useState<CustomerProfileDTO>({ userName: '', firstName: '', lastName: '', email: '', phoneNumber: '', address: '' });
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
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Record<number, boolean>>({});

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
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, 'Failed to enroll in campaign.'));
    } finally {
      setEnrollingCampaignId(null);
    }
  };

  const openFeedback = (offer: CampaignOfferDTO) => {
    if (!offer.isEnrolled) {
      alert('Please enroll first before giving feedback.');
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
      setFeedbackSubmitted(prev => ({ ...prev, [feedback.campaignID]: true }));
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, 'Failed to submit feedback.'));
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
      <div className="mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
          Customer Portal
        </div>
        <h1 className="text-3xl font-bold text-slate-100">
          {sectionTitle[section]}
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Manage your travel campaigns, preferences, and feedback in one
          consistent space.
        </p>
      </div>

      {(section === 'offers' || section === 'feedback') && (
        <section>
          <h2 className="text-xl font-bold text-slate-200 mb-4">Available Campaigns</h2>

          {section === 'offers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4 border-white/5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Most Picked</div>
                <div className="text-2xl font-black text-white">{enrolled.length}</div>
                <div className="text-xs text-slate-400">campaigns you availed</div>
              </div>
              <div className="glass-card p-4 border-white/5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Featured</div>
                <div className="text-2xl font-black text-white">{featuredOffers.length}</div>
                <div className="text-xs text-slate-400">top campaigns on this page</div>
              </div>
              <div className="glass-card p-4 border-white/5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Active Now</div>
                <div className="text-2xl font-black text-white">{offers.filter(o => o.status === 'Active').length}</div>
                <div className="text-xs text-slate-400">currently running</div>
              </div>
              <div className="glass-card p-4 border-white/5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Feedback Ready</div>
                <div className="text-2xl font-black text-white">{enrolled.length}</div>
                <div className="text-xs text-slate-400">enrolled campaigns only</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {offers.map(offer => (
              <div key={offer.campaignID} className="glass-card overflow-hidden border-white/5 group hover:border-purple-500/30 transition-all">
                <div className="h-36 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1f37 0%, #0d1124 100%)' }}>
                  {offer.imageUrl && (
                    <img
                      src={offer.imageUrl}
                      alt={offer.campaignName}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl mb-2">{offer.locationName?.[0] ?? 'D'}</span>
                    <span className="text-xs text-slate-400">{offer.locationName}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {offer.isEnrolled && (
                    <div className="absolute top-3 right-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ENROLLED
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-white font-bold mb-1">{offer.campaignName}</h3>
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">{offer.description ?? 'Exclusive travel experience awaits.'}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span>{new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    {!offer.isEnrolled && (
                      <button
                        onClick={() => handleEnroll(offer)}
                        disabled={enrollingCampaignId === offer.campaignID}
                        className="flex-1 py-2 btn-gradient text-white text-xs font-semibold rounded-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {enrollingCampaignId === offer.campaignID ? 'Availing...' : 'Avail Campaign'}
                      </button>
                    )}
                  <button
                    onClick={() => openFeedback(offer)}
                    disabled={!offer.isEnrolled}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {feedbackSubmitted[offer.campaignID] ? 'Feedback Sent' : 'Feedback'}
                  </button>
                </div>
              </div>
            </div>
            ))}
            {offers.length === 0 && (
              <div className="md:col-span-2 glass-card p-12 text-center text-slate-500 italic">No active campaign offers.</div>
            )}
          </div>
        </section>
      )}

      {section === 'map' && (
        <section>
          <h2 className="text-xl font-bold text-slate-200 mb-4">Destination Tracker</h2>
          {activeEnrolled.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {activeEnrolled.map(c => (
                <button
                  key={c.campaignID}
                  onClick={() => setSelectedMapCampaignId(c.campaignID)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    c.campaignID === mapOffer?.campaignID
                      ? 'bg-purple-500/20 border-purple-400/40 text-purple-200'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {c.campaignName}
                </button>
              ))}
            </div>
          )}
          <div className="card h-[280px] sm:h-[340px] lg:h-[430px] overflow-hidden">
            {mapOffer && mapOffer.latitude && mapOffer.longitude ? (
              <MapboxMap
                lat={Number(mapOffer.latitude)}
                lng={Number(mapOffer.longitude)}
                title={`${mapOffer.campaignName} - ${mapOffer.locationName || 'Travel Destination'}`}
                description={mapOffer.description}
                showRoute={true}
                showTravelInfo={true}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 italic">
                <span className="text-4xl mb-4">Map</span>
                Enroll in a campaign to see your journey route.
              </div>
            )}
          </div>
        </section>
      )}

      {section === 'campaigns' && (
        <section>
          <h2 className="text-xl font-bold text-slate-200 mb-4">My Campaigns</h2>
          <div className="glass-card overflow-hidden border-white/5">
            {enrolled.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-3">Campaign</th>
                      <th className="px-6 py-3">Destination</th>
                      <th className="px-6 py-3">Itinerary</th>
                      <th className="px-6 py-3 text-right">Ends</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {enrolled.map(o => (
                      <tr key={o.campaignID} className="hover:bg-white/5">
                        <td className="px-6 py-3 text-slate-100 font-semibold">
                          {o.campaignName}
                        </td>
                        <td className="px-6 py-3 text-[11px] text-slate-300">
                          {o.locationName ?? '-'}
                        </td>
                        <td className="px-6 py-3 text-[11px] text-slate-300">
                          <button
                            className="btn btn-sm btn-ghost text-xs"
                            style={{ height: '30px', padding: '0 10px' }}
                            onClick={() => setItineraryCampaign(o)}
                          >
                            View Plan
                          </button>
                        </td>
                        <td className="px-6 py-3 text-[11px] text-slate-500 text-right font-mono">
                          {new Date(o.endDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500 italic">
                You have not availed any campaigns yet.
              </div>
            )}
          </div>
        </section>
      )}

      {section === 'profile' && (
        <section className="max-w-xl">
          <div className="glass-card p-6 border-white/5">
            <h2 className="text-lg font-bold text-white mb-5">Profile Settings</h2>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm" value={profile.userName} onChange={e => setProfile(p => ({ ...p, userName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">First Name</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Last Name</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <input readOnly className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-500 text-sm cursor-not-allowed" value={profile.email} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm" value={profile.phoneNumber} onChange={e => setProfile(p => ({ ...p, phoneNumber: e.target.value }))} placeholder="+1 (555) 000-0000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Address</label>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm min-h-[110px]" value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} placeholder="Street, city, province, postal code" />
              </div>
              <button type="submit" className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${profileSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'btn-gradient text-white shadow-lg shadow-purple-500/20'}`}>
                {profileSaved ? 'Saved' : 'Save Changes'}
              </button>
            </form>
          </div>
        </section>
      )}

      {section === 'subscriptions' && (
        <section className="max-w-xl">
          <div className="glass-card p-6 border-white/5">
            <h2 className="text-lg font-bold text-white mb-5">Campaign Subscriptions</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button className="btn btn-sm btn-ghost" onClick={subscribeAll}>Subscribe All</button>
              <button className="btn btn-sm btn-ghost" onClick={unsubscribeAll}>Unsubscribe All</button>
              {subscriptionSaved && <span style={{ fontSize: '11px', color: '#34d399', alignSelf: 'center' }}>Preferences saved</span>}
            </div>
            <div className="space-y-4">
              {(Object.keys(CATEGORY_ICONS) as (keyof typeof CATEGORY_ICONS)[]).map(cat => {
                const key = `subscribe${cat}` as keyof typeof prefs;
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{cat} Travel</p>
                        <p className="text-xs text-slate-500">Receive {cat.toLowerCase()} deals</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updatePreference(key, !prefs[key])}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${prefs[key] ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-slate-700'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${prefs[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {section === 'feedback' && (
        <section>
          <h2 className="text-xl font-bold text-slate-200 mb-4">Provide Feedback</h2>
          {enrolled.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-500 italic">
              Enroll in a campaign first, then feedback options will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {enrolled.map(offer => (
                <div key={offer.campaignID} className="glass-card p-5 border-white/5">
                  <h3 className="text-white font-bold mb-2">{offer.campaignName}</h3>
                  <p className="text-xs text-slate-400 mb-4">{offer.description ?? 'Share your campaign experience.'}</p>
                  <button onClick={() => openFeedback(offer)} className="btn btn-primary">Open Feedback Form</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {isFeedbackOpen && activeFeedback && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-8 shadow-2xl border-white/20">
            <h2 className="text-xl font-bold text-white mb-1">Campaign Feedback</h2>
            <p className="text-slate-400 text-sm mb-6">{activeFeedback.campaignName}</p>
            <form onSubmit={submitFeedback} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedback(f => ({ ...f, rating: star }))}
                      className={`text-2xl transition-all ${star <= feedback.rating ? 'scale-110' : 'opacity-30'}`}
                    >
                      *
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Comment</label>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white h-28 text-sm" placeholder="Share your experience..." onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))} />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button type="button" onClick={() => setIsFeedbackOpen(false)} className="px-5 py-2.5 bg-white/5 text-slate-300 rounded-xl border border-white/10 text-sm font-semibold">Cancel</button>
                <button type="submit" className="px-7 py-2.5 btn-gradient text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/20">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {itineraryCampaign && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-8 border-white/20">
            <h2 className="text-xl font-bold text-white mb-2">Campaign Itinerary</h2>
            <p className="text-slate-300 mb-1">{itineraryCampaign.campaignName}</p>
            <p className="text-xs text-slate-500 mb-5">{new Date(itineraryCampaign.startDate).toLocaleDateString()} - {new Date(itineraryCampaign.endDate).toLocaleDateString()}</p>
            <div className="space-y-3 text-sm">
              <div><span className="text-slate-500">Destination: </span><span className="text-slate-200">{itineraryCampaign.locationName ?? 'N/A'}</span></div>
              <div><span className="text-slate-500">Category Goal: </span><span className="text-slate-200">{itineraryCampaign.targetGoal || 'Standard campaign package'}</span></div>
              <div><span className="text-slate-500">Plan Notes: </span><span className="text-slate-200">{itineraryCampaign.description || 'Detailed itinerary will be provided by campaign manager.'}</span></div>
            </div>
            <div className="flex justify-end mt-6">
              <button className="btn btn-ghost" onClick={() => setItineraryCampaign(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CustomerPortal;


