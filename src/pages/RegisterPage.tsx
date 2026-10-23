import React from 'react';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { Boxes, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f4f6f8] grid lg:grid-cols-12">
      {/* Left Architectural Brand Panel */}
      <aside className="hidden lg:flex lg:col-span-5 xl:col-span-6 bg-brand-950 text-white flex-col justify-between p-12 xl:p-16 border-r border-brand-900">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-subtle">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block leading-none">
              FIRMEZA
            </span>
            <span className="text-xs text-brand-200 font-medium block mt-1">
              Asset &amp; Inventory Control Ledger
            </span>
          </div>
        </div>

        <div className="max-w-lg my-auto py-12">
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight">
            Role-scoped credentials for operational clarity.
          </h1>
          <p className="mt-4 text-base text-brand-100 leading-relaxed">
            Provision operator, auditor, or administrator credentials with strict permission boundaries across catalog mutations, spreadsheet imports, and compliance exports.
          </p>

          <dl className="mt-10 border-t border-brand-800/80 divide-y divide-brand-800/80 text-sm">
            <div className="py-3.5 flex items-center justify-between gap-4">
              <dt className="text-brand-200 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>Administrator</span>
              </dt>
              <dd className="text-xs text-brand-100">
                Full CRUD, Excel Import &amp; Deletion
              </dd>
            </div>
            <div className="py-3.5 flex items-center justify-between gap-4">
              <dt className="text-brand-200 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>Auditor</span>
              </dt>
              <dd className="text-xs text-brand-100">
                Read-Only Inspection &amp; PDF/Excel Reports
              </dd>
            </div>
            <div className="py-3.5 flex items-center justify-between gap-4">
              <dt className="text-brand-200 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>Standard User</span>
              </dt>
              <dd className="text-xs text-brand-100">
                Catalog Consultation &amp; Stock Lookup
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex items-center justify-between text-xs text-brand-200 pt-6 border-t border-brand-900">
          <span>Firmeza Identity Provisioning</span>
          <span className="font-mono tabular-nums">JWT · Bearer Auth</span>
        </div>
      </aside>

      {/* Right Registration Area */}
      <main className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center px-6 py-12 sm:px-12 xl:px-20">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-none">
                FIRMEZA
              </span>
              <span className="text-xs text-slate-600 block mt-0.5">
                Asset &amp; Inventory Control
              </span>
            </div>
          </div>
          <RegisterForm />
        </div>
      </main>
    </div>
  );
};
