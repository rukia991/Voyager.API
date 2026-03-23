import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import customerPortalService from '../../services/customerPortalService';
import type { CustomerProfileDTO } from '../../services/customerPortalService';

export default function Profile() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<CustomerProfileDTO>({ userName: '', firstName: '', lastName: '', email: '', phoneNumber: '' });
  const [profileSaved, setProfileSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerPortalService.getProfile().then(data => {
      setProfile(data);
      setLoading(false);
    }).catch(e => {
        console.error(e);
        setLoading(false);
    });
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await customerPortalService.updateProfile(profile);
      updateUser({ userName: profile.userName, firstName: profile.firstName, lastName: profile.lastName });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      alert("Failed to update profile");
    }
  };

  if (loading) return <MainLayout><div className="p-8 text-center text-slate-500">Loading profile data...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="mb-8 anim-slide-up">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-secondary mb-1">Account & Security</div>
        <h1 className="text-3xl font-bold text-primary">User Profile</h1>
        <p className="text-secondary mt-2 text-sm">Update your personal account details and Voyager system identity.</p>
      </div>

      <section className="max-w-3xl mx-auto anim-slide-up delay-1">
        <div className="card border-main" style={{ padding: '40px' }}>
            <h2 className="text-xl font-bold text-primary mb-8">Profile Settings</h2>
            <form onSubmit={handleProfileSave} style={{ display: 'grid', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="form-group">
                  <label className="block text-xs font-medium text-secondary mb-2">First Name</label>
                  <input className="w-full bg-card border border-main rounded-xl px-4 py-3 text-primary text-sm focus:border-purple-500 focus:outline-none transition-colors" value={profile.firstName || ''} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="block text-xs font-medium text-slate-400 mb-2">Last Name</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500 focus:outline-none transition-colors" value={profile.lastName || ''} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="block text-xs font-medium text-slate-400 mb-2">Username</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500 focus:outline-none transition-colors" value={profile.userName} onChange={e => setProfile(p => ({ ...p, userName: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="form-group">
                  <label className="block text-xs font-medium text-secondary mb-2">Email address</label>
                  <input readOnly className="w-full bg-card/60 border border-main rounded-xl px-4 py-3 text-muted text-sm cursor-not-allowed" value={profile.email} />
                </div>
                <div className="form-group">
                  <label className="block text-xs font-medium text-secondary mb-2">Phone Number</label>
                  <input className="w-full bg-card border border-main rounded-xl px-4 py-3 text-primary text-sm focus:border-purple-500 focus:outline-none transition-colors" value={profile.phoneNumber || ''} onChange={e => setProfile(p => ({ ...p, phoneNumber: e.target.value }))} placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <button type="button" className="px-8 py-3 bg-card border border-main text-secondary rounded-xl font-bold text-sm transition-colors hover:bg-accent-soft" onClick={() => window.history.back()}>
                  Cancel
                </button>
                <button type="submit" className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${profileSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'btn-gradient text-white shadow-lg shadow-purple-500/20'}`}>
                  {profileSaved ? '✓ Profile Saved' : 'Save Changes'}
                </button>
              </div>
            </form>
        </div>
      </section>
    </MainLayout>
  );
}
