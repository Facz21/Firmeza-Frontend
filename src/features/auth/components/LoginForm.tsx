import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractApiErrorMessage } from '../../../services/apiClient';
import { Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Por favor ingresa tu correo electrónico.')
    .email('Ingresa una dirección de correo electrónico válida.'),
  password: z.string().min(1, 'Por favor ingresa tu contraseña.'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const savedEmail =
    typeof window !== 'undefined'
      ? localStorage.getItem('enterprise_remembered_email') || ''
      : '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: savedEmail,
      password: '',
      rememberMe: Boolean(savedEmail),
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      await login(
        {
          email: data.email,
          password: data.password,
        },
        Boolean(data.rememberMe)
      );
      navigate('/products');
    } catch (err: unknown) {
      setServerError(
        extractApiErrorMessage(
          err,
          'No se pudo iniciar sesión. Verifica tu correo y contraseña e inténtalo de nuevo.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-subtle p-8 sm:p-10">
      <div className="mb-7">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to Firmeza
        </h2>
        <p className="text-sm text-slate-600 mt-1.5">
          Enter your corporate operator credentials to access the inventory ledger.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        onChange={() => {
          if (serverError) setServerError(null);
        }}
        className="space-y-5"
      >
        {serverError && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-700" />
            <div className="space-y-0.5">
              <p className="font-bold text-rose-900">No se pudo iniciar sesión</p>
              <p className="text-rose-800 leading-relaxed">{serverError}</p>
            </div>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label htmlFor="login-email" className="block text-xs font-semibold text-slate-800 mb-1.5">
            Corporate Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-lg border font-mono text-xs ${
                errors.email
                  ? 'border-rose-400 focus:border-rose-600'
                  : 'border-slate-300 focus:border-brand-600'
              } bg-white text-slate-900 placeholder-slate-400 focus:outline-none transition`}
              placeholder="operator@enterprise.com"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-800">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              <KeyRound className="w-3 h-3" />
              <span>Forgot or locked out?</span>
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className={`w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm ${
                errors.password
                  ? 'border-rose-400 focus:border-rose-600'
                  : 'border-slate-300 focus:border-brand-600'
              } bg-white text-slate-900 placeholder-slate-400 focus:outline-none transition`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-800 transition"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-remember"
            className="inline-flex items-center gap-2.5 cursor-pointer select-none"
          >
            <input
              id="login-remember"
              type="checkbox"
              {...register('rememberMe')}
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600 accent-brand-600 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-700">
              Remember me on this workstation
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-subtle transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span>Authenticating session...</span>
          ) : (
            <>
              <span>Access Inventory Ledger</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="text-center text-xs text-slate-600 pt-3 border-t border-slate-200">
          Need to provision a new operator account?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800 underline underline-offset-4">
            Register credentials
          </Link>
        </div>
      </form>
    </div>
  );
};
