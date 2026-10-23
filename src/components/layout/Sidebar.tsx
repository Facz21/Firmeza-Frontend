import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import {
  Package,
  FileText,
  CheckCircle2,
  ShieldAlert,
  ExternalLink,
  X,
  Users,
  UserCheck,
  ShoppingCart,
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user, isAdmin } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
      isActive
        ? 'bg-brand-950 text-white shadow-subtle'
        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
    }`;

  const sidebarContent = (
    <div className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between p-4 flex-shrink-0 h-full min-h-[calc(100vh-3.75rem)]">
      <div className="space-y-6">
        {onCloseMobile && (
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-900">Navigation Menu</span>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div>
          <span className="px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Operations &amp; Identity
          </span>
          <nav aria-label="Primary inventory navigation" className="space-y-1">
            <NavLink
              to="/products"
              onClick={onCloseMobile}
              className={navItemClass}
            >
              <span className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Asset Registry</span>
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-brand-800 text-brand-100">
                LIVE
              </span>
            </NavLink>

            <NavLink
              to="/orders"
              onClick={onCloseMobile}
              className={navItemClass}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4" />
                <span>{isAdmin ? 'Cart Approvals' : 'My Purchase Carts'}</span>
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-700 text-amber-100">
                {isAdmin ? 'ADMIN' : 'ORDERS'}
              </span>
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/users"
                onClick={onCloseMobile}
                className={navItemClass}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  <span>Users &amp; Roles</span>
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-100">
                  RBAC
                </span>
              </NavLink>
            )}

            <NavLink
              to="/profile"
              onClick={onCloseMobile}
              className={navItemClass}
            >
              <span className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4" />
                <span>Identity &amp; Security</span>
              </span>
            </NavLink>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <nav aria-label="External documentation" className="space-y-1">
            <a
              href="http://localhost:5193/scalar/v1"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition"
            >
              <span className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-brand-600" />
                <span>Scalar OpenAPI Spec</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </nav>
        </div>
      </div>

      {/* Role permission status panel */}
      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/90">
        <div className="flex items-center gap-2 mb-1.5">
          {isAdmin ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
          )}
          <span className="text-xs font-bold text-slate-900">
            {isAdmin ? 'Administrative Tier' : 'Operator & Audit Tier'}
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {isAdmin
            ? 'Authorized for SKU registration, cart purchase approvals, Identity RBAC, and deletions.'
            : 'Authorized for cart purchase requests, catalog inspection, PDF certificates, and Excel exports.'}
        </p>
        <div className="mt-2.5 pt-2.5 border-t border-slate-200 font-mono text-[11px] text-slate-700 truncate">
          {user?.email}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:block">{sidebarContent}</aside>

      {/* Mobile Drawer Sidebar */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
