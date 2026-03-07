import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import customerPortalService from '../../services/customerPortalService';
import type { CampaignOfferDTO, CustomerProfileDTO, CampaignFeedbackDTO, CustomerPreferencesDTO } from '../../services/customerPortalService';
import MapboxMap from '../../components/common/MapboxMap';

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
  offers: 'Personalized Offers',
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
  useAuth();
  const location = useLocation();

  const [offers, setOffers] = useState<CampaignOfferDTO[]>([]);
  const [profile, setProfile] = useState<CustomerProfileDTO>({ firstName: '', lastName: '', email: '', phoneNumber: '' });
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
    } catch (_) {
      console.error('Failed to fetch portal data');
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await customerPortalService.updateProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const openFeedback = (offer: CampaignOfferDTO) => {
    setActiveFeedback(offer);
    setFeedback({ campaignID: offer.campaignID, rating: 5 });
    setIsFeedbackOpen(true);
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    await customerPortalService.submitFeedback(feedback);
    setIsFeedbackOpen(false);
  };

  const enrolled = offers.filter(o => o.isEnrolled);

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Travel Portal</h1>
        <p className="text-slate-400 mt-1">{sectionTitle[section]}</p>
      </div>

      {(section === 'offers' || section === 'feedback') && (
        <section>
          <h2 className="text-xl font-bold text-slate-200 mb-4">Exclusive Campaign Offers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {offers.map(offer => (
              <div key={offer.campaignID} className="glass-card overflow-hidden border-white/5 group hover:border-purple-500/30 transition-all">
                <div className="h-36 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1f37 0%, #0d1124 100%)' }}>
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
                      <button className="flex-1 py-2 btn-gradient text-white text-xs font-semibold rounded-lg hover:scale-[1.02] transition-all">
                        Enroll Now
                      </button>
                    )}
                    <button onClick={() => openFeedback(offer)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold rounded-lg transition-all">
                      Feedback
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
          <div className="card h-[280px] sm:h-[340px] lg:h-[430px] overflow-hidden">
            {offers.length > 0 && offers[0].latitude ? (
              <MapboxMap
                lat={Number(offers[0].latitude)}
                lng={Number(offers[0].longitude)}
                title={offers[0].locationName || 'Travel Destination'}
                description={offers[0].description}
                showRoute={true}
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
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="px-6 py-4">Campaign</th>
                      <th className="px-6 py-4">Destination</th>
                      <th className="px-6 py-4 text-right">Ends</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {enrolled.map(o => (
                      <tr key={o.campaignID} className="hover:bg-white/5">
                        <td className="px-6 py-4 text-slate-200 font-medium">{o.campaignName}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{o.locationName ?? '-'}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 text-right">{new Date(o.endDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500 italic">You have not enrolled in any campaigns yet.</div>
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
                      onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {offers.map(offer => (
              <div key={offer.campaignID} className="glass-card p-5 border-white/5">
                <h3 className="text-white font-bold mb-2">{offer.campaignName}</h3>
                <p className="text-xs text-slate-400 mb-4">{offer.description ?? 'Share your campaign experience.'}</p>
                <button onClick={() => openFeedback(offer)} className="btn btn-primary">Open Feedback Form</button>
              </div>
            ))}
          </div>
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
    </MainLayout>
  );
};

export default CustomerPortal;
