import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import tenantService, { type TenantDTO } from '../../services/tenantService';

const Tenants: React.FC = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantDTO[]>([]);
  const [search, setSearch] = useState('');

  const isSuperAdmin = user?.role === 'SuperAdmin';

  useEffect(() => {
    if (isSuperAdmin) fetchData();
  }, [isSuperAdmin]);

  const fetchData = async () => {
    try {
      const data = await tenantService.getTenants();
      setTenants(data);
    } catch (err) {
      console.error('Error fetching tenants', err);
    }
  };

  const toggleStatus = async (t: TenantDTO) => {
    try {
      await tenantService.toggleTenantStatus(t.tenantId);
      fetchData();
    } catch (err) {
      console.error('Error toggling status', err);
    }
  };

  const updatePlan = async (id: number, plan: string) => {
    try {
      await tenantService.updateTenantPlan(id, plan);
      fetchData();
    } catch (err) {
      console.error('Error updating plan', err);
    }
  };

  const filtered = tenants.filter(t => 
    t.companyName.toLowerCase().includes(search.toLowerCase())
  );

  if (!isSuperAdmin) {
    return <MainLayout><div className="p-8">Access Denied</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="page-header anim-slide-up">
        <div className="page-header-left">
          <div className="eyebrow">SuperAdmin</div>
          <h1>Tenants Management</h1>
          <p>Manage SaaS companies and their active subscriptions.</p>
        </div>
      </div>

      <div className="filter-bar anim-fade-in">
        <input
          type="text"
          placeholder="Search by company name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden anim-slide-up delay-1">
        <div className="tbl-header">
          <span>All Tenants</span>
          <small>{filtered.length} match{filtered.length !== 1 ? 'es' : ''}</small>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="tbl-head-row">
                <th className="tbl-cell" style={{ textAlign: "left" }}>ID</th>
                <th className="tbl-cell" style={{ textAlign: "left" }}>Company Name</th>
                <th className="tbl-cell" style={{ textAlign: "left" }}>Plan</th>
                <th className="tbl-cell" style={{ textAlign: "left" }}>Status</th>
                <th className="tbl-cell" style={{ textAlign: "left" }}>Joined</th>
                <th className="tbl-cell" style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.tenantId} className="tbl-row">
                  <td className="tbl-cell" style={{ fontSize: "12px", color: "var(--text-muted)" }}>#{t.tenantId}</td>
                  <td className="tbl-cell">
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{t.companyName}</div>
                  </td>
                  <td className="tbl-cell">
                    <select
                      value={t.subscriptionPlan || 'Basic'}
                      onChange={(e) => updatePlan(t.tenantId, e.target.value)}
                      className="text-xs font-semibold px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full cursor-pointer outline-none"
                    >
                      <option value="Basic" className="bg-slate-900 text-white">Basic</option>
                      <option value="Pro" className="bg-slate-900 text-white">Pro</option>
                      <option value="Enterprise" className="bg-slate-900 text-white">Enterprise</option>
                    </select>
                  </td>
                  <td className="tbl-cell">
                    <span className={t.isActive ? 'badge badge-green' : 'badge badge-red'}>
                      {t.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="tbl-cell" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {new Date(t.createdDate).toLocaleDateString()}
                  </td>
                  <td className="tbl-cell" style={{ textAlign: "right" }}>
                    <button
                      onClick={() => toggleStatus(t)}
                      className={t.isActive ? 'btn btn-danger' : 'btn btn-ghost'}
                      style={{ padding: "5px 12px", fontSize: "11px" }}
                    >
                      {t.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No tenants found.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Tenants;
