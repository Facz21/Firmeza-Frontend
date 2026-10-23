import React from 'react';
import { LoginForm } from '../features/auth/components/LoginForm';
import { Boxes, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
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
            Traceable physical inventory, audited from intake to dispatch.
          </h1>
          <p className="mt-4 text-base text-brand-100 leading-relaxed">
            Centralized SKU registry with role-enforced governance, bulk spreadsheet ingestion, and signed PDF compliance reports for warehouse and procurement teams.
          </p>

          <dl className="mt-10 border-t border-brand-800/80 divide-y divide-brand-800/80 text-sm">
            <div className="py-3.5 flex items-center justify-between gap-4">
              <dt className="text-brand-200 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>Access Governance</span>
              </dt>
              <dd className="font-mono text-xs text-brand-100 tabular-nums">
                RBAC · 3-Tier Roles
              </dd>
            </div>
            <div className="py-3.5 flex items-center justify-between gap-4">
              <dt className="text-brand-200 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>Batch Operations</span>
              </dt>
              <dd className="font-mono text-xs text-brand-100 tabular-nums">
                .XLSX Ingest &amp; Export
              </dd>
            </div>
            <div className="py-3.5 flex items-center justify-between gap-4">
              <dt className="text-brand-200 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>Inspection Certificates</span>
              </dt>
              <dd className="font-mono text-xs text-brand-100 tabular-nums">
                Per-SKU PDF Dossier
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex items-center justify-between text-xs text-brand-200 pt-6 border-t border-brand-900">
          <span>Firmeza Enterprise Suite</span>
          <span className="font-mono tabular-nums">v2.4 · Production Ready</span>
        </div>
      </aside>

      {/* Right Authentication Area */}
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
          <LoginForm />
        </div>
      </main>
    </div>
  );
};
