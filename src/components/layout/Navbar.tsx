import React from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useCart } from '../../features/orders/context/CartContext';
import { LogOut, Boxes, Shield, Menu, ChevronRight, ShoppingCart } from 'lucide-react';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const { totalItems, setIsDrawerOpen } = useCart();

  return (
    <header className="h-[3.75rem] bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-950 text-white">
            <Boxes className="w-4 h-4 text-brand-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-slate-950">
              FIRMEZA
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <span className="hidden sm:inline-block text-xs font-medium text-slate-600">
              Physical Asset &amp; Stock Ledger
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-3">
            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open shopping cart"
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-brand-600" />
              <span className="hidden sm:inline">Carrito</span>
              {totalItems > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-brand-600 text-white font-mono text-[10px] font-bold">
                  {totalItems}
                </span>
              )}
            </button>

            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {user.fullName || user.email}
              </div>
              <div className="flex items-center justify-end gap-1 text-[11px] text-slate-600 mt-0.5">
                <Shield className="w-3 h-3 text-brand-600" />
                <span>{user.roles.join(', ') || 'Operator'}</span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-lg bg-brand-950 text-white font-mono font-semibold flex items-center justify-center text-xs">
              {(user.fullName || user.email).charAt(0).toUpperCase()}
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign out of session"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
