import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../features/auth/services/authService';
import { Boxes, KeyRound, Mail, Lock, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [email, setEmail] = useState('admin@enterprise.com');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const result = await authService.forgotPassword({ email });
      if (result.succeeded && result.resetToken) {
        setToken(result.resetToken);
        setInfoMessage('ASP.NET Core Identity reset token generated and auto-filled below.');
        setStep('reset');
      } else {
        setError(result.errors?.[0] || 'Could not generate reset token.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate password reset token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const result = await authService.resetPassword({
        email,
        token,
        newPassword,
      });
      if (result.succeeded) {
        setStep('done');
      } else {
        setError(result.errors?.[0] || 'Failed to reset password.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col justify-center px-6 py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-brand-950 text-white flex items-center justify-center">
            <Boxes className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 block leading-none">
              FIRMEZA IDENTITY
            </span>
            <span className="text-xs text-slate-600 block mt-0.5">
              Account Recovery &amp; Lockout Unlock
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-subtle p-8 sm:p-10">
          {step === 'request' && (
            <>
              <div className="mb-6">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center mb-3">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Request Identity Reset Token
                </h2>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Generate a cryptographic token via ASP.NET Core Identity Token Provider to reset your password and clear account lockouts.
                </p>
              </div>

              <form onSubmit={handleRequestToken} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-700" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="recovery-email" className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-brand-600 font-mono text-xs bg-white text-slate-900 focus:outline-none"
                      placeholder="operator@enterprise.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-subtle transition disabled:opacity-60"
                >
                  {isLoading ? 'Generating Token...' : 'Generate Reset Token'}
                </button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <div className="mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Set New Password
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Account: <span className="font-mono font-semibold text-slate-900">{email}</span>
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                {infoMessage && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                    {infoMessage}
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-700" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="reset-token" className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Identity Security Token
                  </label>
                  <textarea
                    id="reset-token"
                    rows={2}
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-brand-600 font-mono text-[11px] bg-slate-50 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="reset-new-password" className="block text-xs font-semibold text-slate-800 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="reset-new-password"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-brand-600 text-sm bg-white text-slate-900 focus:outline-none"
                      placeholder="Min 8 chars, A-Z, a-z, 0-9, symbol"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-subtle transition disabled:opacity-60"
                >
                  {isLoading ? 'Resetting Password...' : 'Reset Password & Unlock Account'}
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Password Updated</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your password has been updated and any security lockouts on <span className="font-mono font-semibold">{email}</span> have been cleared.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-subtle transition"
              >
                Return to Sign In
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
