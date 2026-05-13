import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/useAuth';
import userService from '../../services/userService';
import type { AuditLogDTO, CreateUserDTO, UserDTO } from '../../services/userService';
import { maskEmail, maskIpAddress } from '../../utils/masking';

const ADMIN_ROLES = ['Marketing Manager', 'Marketing Staff', 'Customer'];
const SUPER_ADMIN_ROLES = ['Admin', 'SuperAdmin'];
const PROTECTED_ROLES = new Set(['Admin', 'SuperAdmin']);

const roleColor: Record<string, string> = {
  SuperAdmin: 'bg-purple-500/20 text-purple-300',
  Admin: 'bg-blue-500/20 text-blue-300',
  'Marketing Manager': 'bg-violet-500/20 text-violet-300',
  'Marketing Staff': 'bg-slate-500/20 text-slate-300',
  Customer: 'bg-teal-500/20 text-teal-300',
};

const Users: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDTO[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortKey, setSortKey] = useState<keyof UserDTO>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isAdmin = user?.role === 'Admin';
  const assignableRoles = isSuperAdmin ? [...ADMIN_ROLES, 'Admin'] : ADMIN_ROLES;

  const [formData, setFormData] = useState<CreateUserDTO>({
    userName: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'Marketing Staff',
    password: '',
  });

  const canEditRow = (u: UserDTO) => {
    if (isSuperAdmin) return u.role !== 'SuperAdmin';
    if (isAdmin) return !PROTECTED_ROLES.has(u.role);
    return false;
  };

  const fetchData = useCallback(async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);

      if (isSuperAdmin) {
        const logs = await userService.getAuditLogs();
        setAuditLogs(logs);
      }
    } catch {
      console.error('Error fetching data');
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await userService.createUser(formData);
      setIsModalOpen(false);
      setFormData({
        userName: '',
        email: '',
        firstName: '',
        lastName: '',
        role: 'Marketing Staff',
        password: '',
      });
      await fetchData();
    } catch {
      console.error('Error creating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (u: UserDTO) => {
    const next = u.accountStatus === 'Active' ? 'Suspended' : 'Active';
    await userService.updateStatus(u.id, next);
    await fetchData();
  };

  const handleRoleChange = async (id: number, role: string) => {
    await userService.updateRole(id, role);
    await fetchData();
  };

  const sorted = users
    .filter((u) => {
      const matchSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter ? u.role === roleFilter : true;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === undefined || valB === undefined) return 0;
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);
  const filterRoleOptions = isSuperAdmin ? [...ADMIN_ROLES, ...SUPER_ADMIN_ROLES] : ADMIN_ROLES;

  return (
    <MainLayout>
      <div className="page-header anim-slide-up">
        <div className="page-header-left">
          <div className="eyebrow">Admin</div>
          <h1>User Management</h1>
          <p>Manage accounts, roles, and access across the system.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>+ Add User</Button>
      </div>

      <div className="filter-bar anim-fade-in">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="" className="bg-slate-900">All Roles</option>
          {filterRoleOptions.map((r) => (
            <option key={r} value={r} className="bg-slate-900">
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden anim-slide-up delay-1" style={{ marginBottom: '22px' }}>
        <div className="tbl-header">
          <span>All Users</span>
          <small>{sorted.length} matches</small>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="tbl-head-row">
                <th className="tbl-cell cursor-pointer hover:text-purple-300" onClick={() => { setSortKey('lastName'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>User</th>
                <th className="tbl-cell cursor-pointer hover:text-purple-300" onClick={() => { setSortKey('email'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>Email</th>
                <th className="tbl-cell cursor-pointer hover:text-purple-300" onClick={() => { setSortKey('role'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>Role</th>
                <th className="tbl-cell">Status</th>
                <th className="tbl-cell">Joined</th>
                <th className="tbl-cell" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((u) => (
                <tr key={u.id} className="tbl-row">
                  <td className="tbl-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: 'var(--gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: 'white',
                        }}
                      >
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>@{u.userName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="tbl-cell" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{maskEmail(u.email)}</td>
                  <td className="tbl-cell">
                    {canEditRow(u) ? (
                      <select
                        value={u.role}
                        onChange={(e) => void handleRoleChange(u.id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer ${roleColor[u.role] ?? 'bg-slate-500/20 text-slate-300'}`}
                        style={{ fontFamily: 'inherit' }}
                      >
                        {assignableRoles.map((r) => (
                          <option key={r} value={r} className="bg-slate-900">{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${roleColor[u.role] ?? 'bg-slate-500/20 text-slate-300'}`}>
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="tbl-cell">
                    <span className={u.accountStatus === 'Active' ? 'badge badge-green' : u.accountStatus === 'Suspended' ? 'badge badge-red' : 'badge badge-gray'}>
                      {u.accountStatus}
                    </span>
                  </td>
                  <td className="tbl-cell" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(u.createdDate).toLocaleDateString()}</td>
                  <td className="tbl-cell" style={{ textAlign: 'right' }}>
                    {canEditRow(u) ? (
                      <button
                        onClick={() => void toggleStatus(u)}
                        className={u.accountStatus === 'Active' ? 'btn btn-danger' : 'btn btn-ghost'}
                        style={{ padding: '5px 12px', fontSize: '11px' }}
                      >
                        {u.accountStatus === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Protected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 border-t border-white/5 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between sm:items-center text-xs text-slate-400">
            <div>Page {page} of {totalPages || 1}</div>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn btn-ghost px-3 py-1">Previous</button>
              <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage((p) => p + 1)} className="btn btn-ghost px-3 py-1">Next</button>
            </div>
          </div>

          {sorted.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">User</div>
              <h3>No users found</h3>
              <p>Adjust your filters or add a new user.</p>
            </div>
          )}
        </div>
      </div>

{/* AUDIT LOG SECTION */}
{isSuperAdmin && (
  <div className="glass-card overflow-hidden border border-white/5 rounded-2xl bg-slate-900/40 anim-slide-up delay-2">
    {/* Header Area */}
    <div className="px-12 lg:px-14 py-6 border-b border-white/5 flex items-center justify-between flex-wrap gap-5 bg-white/[0.01]">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-bold text-white tracking-tight">Shield</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 border-l border-white/20 pl-2">Security & Audit</span>
        </div>
        <h2 className="text-xl font-bold text-white leading-tight">System Audit Log</h2>
      </div>
      
      <div className="flex items-center gap-3 flex-wrap justify-end">
        <span className="text-[9px] bg-purple-500/20 text-purple-200 px-2.5 py-1 rounded-full border border-purple-500/30 font-black uppercase tracking-wider">
          Super Admin Only
        </span>
        <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block"></div>
        <button 
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold text-slate-300 transition-all uppercase tracking-widest"
          onClick={() => void fetchData()}
        >
          Refresh
        </button>
        <button 
          className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-[11px] font-bold text-purple-200 transition-all uppercase tracking-widest"
          onClick={() => navigate('/security')}
        >
          Open Security Center
        </button>
      </div>
    </div>

    {/* Info Grid - Keeping px-8 to match header */}
    <div className="px-12 lg:px-14 py-5 border-b border-white/5 bg-black/20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        <div className="space-y-1">
          <p className="text-[9px] uppercase font-black text-purple-400 tracking-widest">IP Visibility</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">Each audit event now shows a masked IP address used for that login or action.</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] uppercase font-black text-purple-400 tracking-widest">Reveal Details</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">Use the Security Center when you need the full unmasked email and IP for an event.</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] uppercase font-black text-purple-400 tracking-widest">System Logs</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">Showing the latest 100 events recorded across all system modules.</p>
        </div>
      </div>
    </div>

    {/* THE FIX: Padding on the wrapper, not just the cells */}
    <div className="px-12 lg:px-14 py-5">
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/10 px-4 sm:px-5 lg:px-6">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">
            <th className="py-4 pl-4 pr-6">Identity</th>
            <th className="py-4 px-6">Action</th>
            <th className="py-4 px-6">Module</th>
            <th className="py-4 px-6">Endpoint IP</th>
            <th className="py-4 pl-6 pr-4 text-right">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {auditLogs.map((log) => (
            <tr key={log.id} className="hover:bg-white/[0.03] transition-colors group">
              <td className="py-4 pl-4 pr-6">
                <div className="flex flex-col">
                  <span className="text-xs text-white font-bold">@{log.userName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{maskEmail(log.email)}</span>
                </div>
              </td>
              <td className="py-4 px-6">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-tight">
                  {log.action}
                </span>
              </td>
              <td className="py-4 px-6">
                <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-bold uppercase">
                  {log.module}
                </span>
              </td>
              <td className="py-4 px-6 text-[11px] text-slate-400 font-mono tracking-widest">
                {maskIpAddress(log.ipAddress)}
              </td>
              <td className="py-4 pl-6 pr-4 text-[11px] text-slate-500 text-right font-mono">
                {new Date(log.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
    
    <div className="px-12 lg:px-14 py-4 bg-black/20 border-t border-white/5 text-[9px] text-slate-600 font-bold uppercase tracking-[0.3em]">
      End of secure audit trail
    </div>
  </div>
)}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-8 shadow-2xl border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Add New User</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={formData.firstName} onChange={(e) => setFormData((f) => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={formData.lastName} onChange={(e) => setFormData((f) => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={formData.userName} onChange={(e) => setFormData((f) => ({ ...f, userName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={formData.email} onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                  <select required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={formData.role} onChange={(e) => setFormData((f) => ({ ...f, role: e.target.value }))}>
                    {assignableRoles.map((r) => (
                      <option key={r} value={r} className="bg-slate-900">{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <input required type="password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={formData.password} onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))} />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-white/5 text-slate-300 rounded-xl border border-white/10 font-semibold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 btn-gradient text-white rounded-xl font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Users;


