import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../features/auth/services/authService';
import { useAuth } from '../features/auth/context/AuthContext';
import { useToast } from '../components/ui/ToastContext';
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  Lock,
  KeyRound,
  Calendar,
  Save,
  ShieldCheck,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { updateSessionUser } = useAuth();
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['identity-profile'],
    queryFn: () => authService.getProfile(),
  });

  const [editedFullName, setEditedFullName] = useState<string | null>(null);
  const [editedPhoneNumber, setEditedPhoneNumber] = useState<string | null>(null);

  const fullName = editedFullName ?? profile?.fullName ?? '';
  const phoneNumber = editedPhoneNumber ?? profile?.phoneNumber ?? '';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: () => authService.updateProfile({ fullName, phoneNumber }),
    onSuccess: (res) => {
      if (res.succeeded) {
        updateSessionUser({ fullName });
        queryClient.invalidateQueries({ queryKey: ['identity-profile'] });
        notify({
          title: 'Identity Profile Updated',
          description: res.message || 'Your operator profile details have been saved.',
          variant: 'success',
        });
      }
    },
    onError: (err: unknown) => {
      notify({
        title: 'Update Failed',
        description: err instanceof Error ? err.message : 'Could not update profile.',
        variant: 'error',
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => authService.changePassword({ currentPassword, newPassword }),
    onSuccess: (res) => {
      if (res.succeeded) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        notify({
          title: 'Password Updated',
          description: res.message || 'Your Identity security credentials have been rotated.',
          variant: 'success',
        });
      }
    },
    onError: (err: unknown) => {
      notify({
        title: 'Password Change Failed',
        description: err instanceof Error ? err.message : 'Check your current password and complexity requirements.',
        variant: 'error',
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      notify({
        title: 'Password Mismatch',
        description: 'New password and confirmation do not match.',
        variant: 'error',
      });
      return;
    }
    changePasswordMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-48 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Identity &amp; Security Profile
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage your ASP.NET Core Identity operator attributes, contact metadata, and password credentials.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Identity Verified Session</span>
        </div>
      </div>

      {/* Overview Card */}
      {profile && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-subtle p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-brand-950 text-white font-mono text-xl font-bold flex items-center justify-center">
                {(profile.fullName || profile.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{profile.fullName}</h2>
                <p className="font-mono text-xs text-slate-600 mt-0.5">{profile.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {profile.roles.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-brand-50 border border-brand-200 text-brand-800 text-[11px] font-semibold"
                    >
                      <Shield className="w-3 h-3" />
                      {r}
                    </span>
                  ))}
                  {profile.emailConfirmed && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Email Confirmed
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-600 space-y-1">
              <div className="flex items-center sm:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Provisioned: {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Lockout Protection: {profile.lockoutEnabled ? 'Active (Max 5 attempts)' : 'Disabled'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
            {/* Edit Profile Form */}
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900">Operator Metadata</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Email (Immutable Identifier)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-mono text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setEditedFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-brand-600 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (Identity Contact)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setEditedPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-brand-600 font-mono text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-subtle transition disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{updateProfileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>

            {/* Change Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <KeyRound className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900">Rotate Security Password</h3>
              </div>

              <div>
                <label htmlFor="current-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="current-password"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-brand-600 text-xs text-slate-900 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (8+ chars, uppercase, lowercase, digit, symbol)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="new-password"
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-brand-600 text-xs text-slate-900 focus:outline-none"
                    placeholder="New strong password"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-brand-600 text-xs text-slate-900 focus:outline-none"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-subtle transition disabled:opacity-60"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
