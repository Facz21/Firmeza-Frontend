import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../features/auth/services/authService';
import { useAuth } from '../features/auth/context/AuthContext';
import { useToast } from '../components/ui/ToastContext';
import type { UserProfileDto } from '../features/auth/types/auth.types';
import {
  Users,
  UserPlus,
  Shield,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Mail,
  Phone,
  User,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resetUserTarget, setResetUserTarget] = useState<UserProfileDto | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserProfileDto | null>(null);

  // Create user form state
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('StandardUser');
  const [newPassword, setNewPassword] = useState('');

  // Reset password state
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['identity-users'],
    queryFn: () => authService.getAllUsers(),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['identity-roles'],
    queryFn: () => authService.getAllRoles(),
  });

  const refreshIdentityData = () => {
    queryClient.invalidateQueries({ queryKey: ['identity-users'] });
    queryClient.invalidateQueries({ queryKey: ['identity-roles'] });
  };

  const createUserMutation = useMutation({
    mutationFn: () =>
      authService.createUser({
        email: newEmail,
        password: newPassword,
        fullName: newFullName,
        phoneNumber: newPhone || null,
        role: newRole,
      }),
    onSuccess: (res) => {
      if (res.succeeded) {
        refreshIdentityData();
        setIsCreateOpen(false);
        setNewFullName('');
        setNewEmail('');
        setNewPhone('');
        setNewRole('StandardUser');
        setNewPassword('');
        notify({
          title: 'Operator Provisioned',
          description: res.message || 'New Identity account created.',
          variant: 'success',
        });
      }
    },
    onError: (err: unknown) => {
      notify({
        title: 'Provisioning Failed',
        description: err instanceof Error ? err.message : 'Check input fields and password policy.',
        variant: 'error',
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      authService.updateUserRole(userId, role),
    onSuccess: (res) => {
      refreshIdentityData();
      notify({
        title: 'Role Updated',
        description: res.message || 'Operator access tier updated.',
        variant: 'success',
      });
    },
    onError: (err: unknown) => {
      notify({
        title: 'Role Update Failed',
        description: err instanceof Error ? err.message : 'Could not change user role.',
        variant: 'error',
      });
    },
  });

  const toggleLockoutMutation = useMutation({
    mutationFn: ({ userId, lockAccount }: { userId: string; lockAccount: boolean }) =>
      authService.setUserLockout(userId, lockAccount),
    onSuccess: (res) => {
      refreshIdentityData();
      notify({
        title: 'Account Security Updated',
        description: res.message || 'Lockout status changed.',
        variant: 'info',
      });
    },
    onError: (err: unknown) => {
      notify({
        title: 'Lockout Action Failed',
        description: err instanceof Error ? err.message : 'Could not update lockout status.',
        variant: 'error',
      });
    },
  });

  const adminResetPasswordMutation = useMutation({
    mutationFn: () => {
      if (!resetUserTarget) throw new Error('No user selected');
      return authService.adminResetPassword(resetUserTarget.id, resetPasswordValue);
    },
    onSuccess: (res) => {
      refreshIdentityData();
      setResetUserTarget(null);
      setResetPasswordValue('');
      notify({
        title: 'Password Reset Complete',
        description: res.message || 'User password reset and lockout cleared.',
        variant: 'success',
      });
    },
    onError: (err: unknown) => {
      notify({
        title: 'Reset Failed',
        description: err instanceof Error ? err.message : 'Ensure password meets complexity rules.',
        variant: 'error',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => authService.deleteUser(userId),
    onSuccess: (res) => {
      refreshIdentityData();
      setDeleteUserTarget(null);
      notify({
        title: 'Account Deleted',
        description: res.message || 'Operator removed from Identity store.',
        variant: 'warning',
      });
    },
    onError: (err: unknown) => {
      notify({
        title: 'Delete Failed',
        description: err instanceof Error ? err.message : 'Could not delete account.',
        variant: 'error',
      });
    },
  });

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchTerm ||
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.roles.includes(roleFilter);
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const lockedCount = users.filter((u) => u.isLockedOut).length;
  const activeCount = users.length - lockedCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Identity Users &amp; RBAC Governance
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Administer ASP.NET Core Identity operator accounts, role assignments, lockout policies, and security resets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-subtle transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Operator</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Operators</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-2">{users.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Registered in Identity Store</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Active Sessions / Ready</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono mt-2">{activeCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Email confirmed &amp; unlocked</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Locked Accounts</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 font-mono mt-2">{lockedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Policy: 5 failed attempts = 15m lock</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>RBAC Tiers</span>
            <Shield className="w-4 h-4 text-brand-600" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {roles.map((r) => (
              <span
                key={r.id}
                className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] font-semibold"
              >
                {r.name}: {r.userCount}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-brand-600 text-xs text-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-600">Role Filter:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="Administrator">Administrator</option>
            <option value="Auditor">Auditor</option>
            <option value="StandardUser">StandardUser</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Access Role (RBAC)</th>
                <th className="py-3.5 px-4">Security Status</th>
                <th className="py-3.5 px-4">Provisioned</th>
                <th className="py-3.5 px-4 text-right">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading Identity accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No operators match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = currentUser?.userId === u.id;
                  const primaryRole = u.roles[0] || 'StandardUser';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-950 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {(u.fullName || u.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 text-[10px] font-mono">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500">{u.email}</div>
                            {u.phoneNumber && (
                              <div className="font-mono text-[11px] text-slate-400">{u.phoneNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          aria-label={`Role for ${u.email}`}
                          disabled={isSelf || updateRoleMutation.isPending}
                          value={primaryRole}
                          onChange={(e) =>
                            updateRoleMutation.mutate({ userId: u.id, role: e.target.value })
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:border-brand-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="Administrator">Administrator</option>
                          <option value="Auditor">Auditor</option>
                          <option value="StandardUser">StandardUser</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          {u.isLockedOut ? (
                            <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold">
                              <Lock className="w-3 h-3" />
                              Locked Out
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-slate-500">
                            Failed attempts: {u.accessFailedCount}/5
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isSelf || toggleLockoutMutation.isPending}
                            onClick={() =>
                              toggleLockoutMutation.mutate({
                                userId: u.id,
                                lockAccount: !u.isLockedOut,
                              })
                            }
                            title={u.isLockedOut ? 'Unlock Account' : 'Lock Account'}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.isLockedOut
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            }`}
                          >
                            {u.isLockedOut ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Unlock</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Lock</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setResetUserTarget(u);
                              setResetPasswordValue('');
                            }}
                            title="Reset Password"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Reset Pwd</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeleteUserTarget(u)}
                            title="Delete Operator"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Operator Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-elevated max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Provision New Operator</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createUserMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Carlos Mendoza"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="carlos.mendoza@enterprise.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+57 300 123 4567"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:border-brand-600 focus:outline-none"
                >
                  <option value="StandardUser">StandardUser</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password (8+ chars, A-Z, a-z, 0-9, symbol)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Operator@123"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-subtle disabled:opacity-60"
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Force Reset Password Modal */}
      {resetUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-elevated max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Force Password Reset</h2>
              <button
                type="button"
                onClick={() => setResetUserTarget(null)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Resetting credentials for <span className="font-mono font-bold text-slate-900">{resetUserTarget.email}</span>. This will also clear any active account lockout.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                adminResetPasswordMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (8+ chars, A-Z, a-z, 0-9, symbol)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="NewPassword@123"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetUserTarget(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminResetPasswordMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-subtle disabled:opacity-60"
                >
                  {adminResetPasswordMutation.isPending ? 'Resetting...' : 'Apply New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-elevated max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Delete Identity Account</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently remove <span className="font-mono font-bold text-slate-900">{deleteUserTarget.email}</span> ({deleteUserTarget.fullName}) from ASP.NET Core Identity?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteUserTarget(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteUserMutation.isPending}
                onClick={() => deleteUserMutation.mutate(deleteUserTarget.id)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-subtle disabled:opacity-60"
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
