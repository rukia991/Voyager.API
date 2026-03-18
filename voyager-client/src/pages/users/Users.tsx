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
    try {
      await userService.createUser(formData);
      setIsModalOpen(false);
      setFormData({ userName: '', email: '', firstName: '', lastName: '', role: 'Marketing Staff', password: '' });
      fetchData();
    } catch (_) { console.error("Error fetching data"); }
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

  const shareViaEmail = () => {
    if (!user?.tenantId) return;
    const link = `${window.location.origin}/register?tid=${user.tenantId}`;
    const subject = encodeURIComponent('Invitation to Join Our Travel Portal');
    const body = encodeURIComponent(`Hello!\n\nYou're invited to join our travel portal at Voyager. Click the link below to create your account and start planning your next adventure with us.\n\nRegister here: ${link}\n\nWe look forward to having you!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="ghost" onClick={copyInviteLink}>
                <span className="mr-2">🔗</span> Copy Invite Link
              </Button>
              <Button variant="ghost" onClick={shareViaEmail}>
                <span className="mr-2">✉️</span> Share via Email
              </Button>
            </>
          )}
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>+ Add User</Button>
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
          <div className="p-4 border-t border-white/5 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between sm:items-center text-xs text-slate-400">
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
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-4">
            <span className="text-xl">🛡️</span>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Security &amp; Audit
              </span>
              <h2 className="text-lg font-bold text-white leading-tight">System Audit Log</h2>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] bg-purple-500/20 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-500/40">
                Super Admin Only
              </span>
              <span className="text-[10px] bg-white/5 text-slate-200 px-2.5 py-0.5 rounded-full border border-white/10">
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
                <tr className="border-b border-white/5 bg-white/5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Module</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="px-6 py-3 text-sm text-slate-100 font-semibold">@{log.userName}</td>
                    <td className="px-6 py-3">
                      <span className="text-[11px] bg-blue-500/15 text-blue-200 px-2.5 py-1 rounded-md font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-[11px] text-slate-300">
                      <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-[11px] text-slate-400 max-w-sm truncate">
                      {log.details}
                    </td>
                    <td className="px-6 py-3 text-[11px] text-slate-500 text-right font-mono">
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-8 shadow-2xl border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Add New User</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={formData.firstName} onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={formData.lastName} onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={formData.userName} onChange={e => setFormData(f => ({ ...f, userName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                  <select required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}>
                    {assignableRoles.map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <input required type="password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={formData.password} onChange={e => setFormData(f => ({ ...f, password: e.target.value }))} />
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
