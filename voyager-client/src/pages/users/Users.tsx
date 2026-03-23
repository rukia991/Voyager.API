import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import type { UserDTO, CreateUserDTO, AuditLogDTO } from '../../services/userService';

// Roles an Admin can assign and see
const ADMIN_ROLES = ['Marketing Manager', 'Marketing Staff', 'Customer'];
// Roles only a SuperAdmin can assign or see
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
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDTO[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortKey, setSortKey] = useState<keyof UserDTO>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isAdmin = user?.role === 'Admin';

  // Roles this user is allowed to assign
  const assignableRoles = isSuperAdmin ? [...ADMIN_ROLES, 'Admin'] : ADMIN_ROLES;

  const [formData, setFormData] = useState<CreateUserDTO>({
    userName: '', email: '', firstName: '', lastName: '', role: 'Marketing Staff', password: ''
  });

  // Can this user interact with the given row?
  const canEditRow = (u: UserDTO) => {
    if (isSuperAdmin) return u.role !== 'SuperAdmin'; // SuperAdmin can edit everyone except other SuperAdmins
    if (isAdmin) return !PROTECTED_ROLES.has(u.role);  // Admin cannot touch Admin/SuperAdmin rows
    return false;
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
      if (isSuperAdmin) {
        const logs = await userService.getAuditLogs();
        setAuditLogs(logs);
      }
    } catch (_) { console.error("Error fetching data"); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError('');
    try {
      await userService.createUser(formData);
      setIsModalOpen(false);
      setFormData({ userName: '', email: '', firstName: '', lastName: '', role: 'Marketing Staff', password: '' });
      fetchData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) { 
      console.error("Error creating user", err);
      let errorMsg = 'Failed to create user. Please try again.';
      if (err.response?.data) {
        if (Array.isArray(err.response.data)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          errorMsg = err.response.data.map((e: any) => e.description || e.code).join(' ');
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setCreateError(errorMsg);
    }
    finally { setIsSubmitting(false); }
  };

  const toggleStatus = async (u: UserDTO) => {
    const next = u.accountStatus === 'Active' ? 'Suspended' : 'Active';
    await userService.updateStatus(u.id, next);
    fetchData();
  };

  const handleRoleChange = async (id: number, role: string) => {
    await userService.updateRole(id, role);
    fetchData();
  };

  const copyInviteLink = () => {
    if (!user?.tenantId) return;
    const link = `${window.location.origin}/register?tid=${user.tenantId}`;
    navigator.clipboard.writeText(link);
    alert('Invitation link copied to clipboard!');
  };



  const sorted = users
    .filter(u => {
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

  // Filter dropdown options based on viewer role
  const filterRoleOptions = isSuperAdmin
    ? [...ADMIN_ROLES, ...SUPER_ADMIN_ROLES]
    : ADMIN_ROLES;

  return (
    <MainLayout>
      {/* Header */}
      <div className="page-header anim-slide-up">
        <div className="page-header-left">
          <div className="eyebrow">Admin</div>
          <h1>User Management</h1>
          <p>Manage accounts, roles, and access across the system.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {isAdmin && (
            <Button variant="ghost" onClick={copyInviteLink} style={{ padding: '8px 18px', borderRadius: '8px' }}>
              <span className="mr-2">🔗</span> Copy Invite Link
            </Button>
          )}
          <Button variant="primary" onClick={() => setIsModalOpen(true)} style={{ padding: '8px 24px', borderRadius: '8px' }}>+ Add User</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar anim-fade-in">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="" className="bg-slate-900">All Roles</option>
          {filterRoleOptions.map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
        </select>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden anim-slide-up delay-1" style={{ marginBottom: "22px" }}>
        <div className="tbl-header">
          <span>All Users</span>
          <small>{sorted.length} matches</small>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr className="tbl-head-row">
                <th className="tbl-cell cursor-pointer hover:text-purple-300" onClick={() => { setSortKey('lastName'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>User</th>
                <th className="tbl-cell cursor-pointer hover:text-purple-300" onClick={() => { setSortKey('email'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>Email</th>
                <th className="tbl-cell cursor-pointer hover:text-purple-300" onClick={() => { setSortKey('role'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>Role</th>
                <th className="tbl-cell">Status</th>
                <th className="tbl-cell">Joined</th>
                <th className="tbl-cell" style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(u => (
                <tr key={u.id} className="tbl-row">
                  <td className="tbl-cell">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                        background: "var(--gradient)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: "700", color: "white"
                      }}>{u.firstName?.[0]}{u.lastName?.[0]}</div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>@{u.userName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="tbl-cell" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{u.email}</td>
                  <td className="tbl-cell">
                    {canEditRow(u) ? (
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer ${roleColor[u.role] ?? 'bg-slate-500/20 text-slate-300'}`}
                        style={{ fontFamily: 'inherit' }}
                      >
                        {assignableRoles.map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
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
                  <td className="tbl-cell" style={{ fontSize: "11px", color: "var(--text-muted)" }}>{new Date(u.createdDate).toLocaleDateString()}</td>
                  <td className="tbl-cell" style={{ textAlign: "right" }}>
                    {canEditRow(u) ? (
                      <button
                        onClick={() => toggleStatus(u)}
                        className={u.accountStatus === 'Active' ? 'btn btn-danger' : 'btn btn-ghost'}
                        style={{ padding: "5px 12px", fontSize: "11px" }}
                      >
                        {u.accountStatus === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>Protected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="p-4 border-t border-main flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between sm:items-center text-xs text-secondary">
            <div>Page {page} of {totalPages || 1}</div>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-ghost px-3 py-1">Previous</button>
              <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)} className="btn btn-ghost px-3 py-1">Next</button>
            </div>
          </div>

          {sorted.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <h3>No users found</h3>
              <p>Adjust your filters or add a new user.</p>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log — Super Admin only */}
      {isSuperAdmin && (
        <div className="card overflow-hidden mt-10">
          <div className="px-6 py-5 border-b border-main flex items-center gap-4">
            <span className="text-xl">🛡️</span>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-secondary">
                Security &amp; Audit
              </span>
              <h2 className="text-lg font-bold text-primary leading-tight">System Audit Log</h2>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] bg-purple-500/20 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-500/40">
                Super Admin Only
              </span>
              <span className="text-[10px] bg-card text-secondary px-2.5 py-0.5 rounded-full border border-main">
                {auditLogs.length} events
              </span>
              <button
                className="btn btn-sm btn-ghost text-xs"
                onClick={fetchData}
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-main bg-accent-soft text-[10px] font-semibold text-secondary uppercase tracking-widest">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y border-main">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-accent-soft transition-colors">
                    <td className="px-6 py-4 text-sm text-primary font-semibold">@{log.userName}</td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] bg-blue-500/15 text-blue-200 px-2.5 py-1 rounded-md font-semibold tracking-wide">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-secondary">
                      <span className="px-3 py-1.5 rounded-full bg-card border border-main font-medium">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-muted max-w-sm truncate leading-relaxed">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-muted text-right font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 text-center text-slate-600 italic"
                    >
                      No audit entries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-xl">
          <div className="w-full max-w-2xl p-8 shadow-2xl border border-main rounded-2xl bg-card relative">
            <h2 className="text-2xl font-bold text-primary mb-6">Add New User</h2>
            
            {createError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-semibold flex items-start gap-3 shadow-inner">
                <span className="text-lg">⚠️</span>
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'grid', gap: '24px' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">First Name</label>
                  <input required className="w-full bg-card border border-main rounded-xl px-4 py-3 text-primary focus:border-purple-500 focus:outline-none transition-colors" value={formData.firstName} onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Last Name</label>
                  <input required className="w-full bg-card border border-main rounded-xl px-4 py-3 text-primary focus:border-purple-500 focus:outline-none transition-colors" value={formData.lastName} onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Username</label>
                  <input required className="w-full bg-card border border-main rounded-xl px-4 py-3 text-primary focus:border-purple-500 focus:outline-none transition-colors" value={formData.userName} onChange={e => setFormData(f => ({ ...f, userName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Email</label>
                  <input required type="email" className="w-full bg-card border border-main rounded-xl px-4 py-3 text-primary focus:border-purple-500 focus:outline-none transition-colors" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Role</label>
                  <select required className="w-full bg-card border border-main rounded-xl px-4 py-3 text-primary focus:border-purple-500 focus:outline-none transition-colors" value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}>
                    {assignableRoles.map(r => <option key={r} value={r} className="bg-card text-primary">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Password</label>
                  <input required type="password" className="w-full bg-card border border-main rounded-xl px-4 py-3 text-primary focus:border-purple-500 focus:outline-none transition-colors" value={formData.password} onChange={e => setFormData(f => ({ ...f, password: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setCreateError(''); }} className="px-6 py-3 bg-card text-secondary rounded-xl border border-main font-semibold hover:bg-accent-soft transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 btn-gradient text-white rounded-xl font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50">
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
