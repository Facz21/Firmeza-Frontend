import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractApiErrorMessage } from '../../../services/apiClient';
import { Lock, Mail, User, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'El nombre completo debe tener al menos 2 caracteres.')
    .max(150, 'El nombre no puede superar los 150 caracteres.'),
  email: z
    .string()
    .min(1, 'Por favor ingresa tu correo electrónico.')
    .email('Ingresa una dirección de correo electrónico válida.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula (A-Z).')
    .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula (a-z).')
    .regex(/[0-9]/, 'Debe incluir al menos un número (0-9).')
    .regex(/[^a-zA-Z0-9]/, 'Debe incluir al menos un carácter especial (ej. @, #, !, $).'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      password: '',
    },
  });

  const watchedPassword = useWatch({ control, name: 'password' }) || '';

  const policyChecks = [
    { label: '8+ chars', valid: watchedPassword.length >= 8 },
    { label: 'Uppercase (A-Z)', valid: /[A-Z]/.test(watchedPassword) },
    { label: 'Lowercase (a-z)', valid: /[a-z]/.test(watchedPassword) },
    { label: 'Number (0-9)', valid: /[0-9]/.test(watchedPassword) },
    { label: 'Symbol (!@#$)', valid: /[^a-zA-Z0-9]/.test(watchedPassword) },
  ];

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      await registerUser({
        ...data,
        role: 'StandardUser',
      });
      navigate('/products');
    } catch (err: unknown) {
      setServerError(
        extractApiErrorMessage(
          err,
          'No se pudo registrar la cuenta. Verifica la información ingresada.'
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
          Provision Operator Account
        </h2>
        <p className="text-sm text-slate-600 mt-1.5">
          Register corporate credentials and assign an operational access tier.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        onChange={() => {
          if (serverError) setServerError(null);
        }}
        className="space-y-4"
      >
        {serverError && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-700" />
            <div className="space-y-0.5">
              <p className="font-bold text-rose-900">No se pudo completar el registro</p>
              <p className="text-rose-800 leading-relaxed">{serverError}</p>
            </div>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label htmlFor="reg-fullname" className="block text-xs font-semibold text-slate-800 mb-1.5">
            Operator Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              id="reg-fullname"
              type="text"
              autoComplete="name"
              {...register('fullName')}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-lg border text-sm ${
                errors.fullName
                  ? 'border-rose-400 focus:border-rose-600'
                  : 'border-slate-300 focus:border-brand-600'
              } bg-white text-slate-900 placeholder-slate-400 focus:outline-none transition`}
              placeholder="Elena Rostova"
            />
          </div>
          {errors.fullName && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-800 mb-1.5">
            Corporate Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-lg border font-mono text-xs ${
                errors.email
                  ? 'border-rose-400 focus:border-rose-600'
                  : 'border-slate-300 focus:border-brand-600'
              } bg-white text-slate-900 placeholder-slate-400 focus:outline-none transition`}
              placeholder="elena.rostova@enterprise.com"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-800 mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('password')}
              className={`w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm ${
                errors.password
                  ? 'border-rose-400 focus:border-rose-600'
                  : 'border-slate-300 focus:border-brand-600'
              } bg-white text-slate-900 placeholder-slate-400 focus:outline-none transition`}
              placeholder="Minimum 8 characters (e.g. Operator@123)"
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

          {/* Live Identity Password Policy Indicator */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {policyChecks.map((check) => (
              <span
                key={check.label}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                  check.valid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <CheckCircle2 className={`w-3 h-3 ${check.valid ? 'text-emerald-600' : 'text-slate-400'}`} />
                {check.label}
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-subtle transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? (
            <span>Provisioning account...</span>
          ) : (
            <>
              <span>Complete Provisioning</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="text-center text-xs text-slate-600 pt-3 border-t border-slate-200">
          Already have active credentials?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800 underline underline-offset-4">
            Sign in to portal
          </Link>
        </div>
      </form>
    </div>
  );
};
