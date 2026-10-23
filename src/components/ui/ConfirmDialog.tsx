import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemCode?: string;
  itemName?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  itemCode,
  itemName,
  confirmLabel = 'Delete Permanently',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-elevated max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="text-base font-bold text-slate-900">
                {title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close confirmation dialog"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {(itemCode || itemName) && (
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-slate-600">Target Record</span>
              {itemCode && (
                <span className="font-mono font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {itemCode}
                </span>
              )}
            </div>
            {itemName && (
              <p className="text-sm font-semibold text-slate-900 mt-1 truncate">{itemName}</p>
            )}
          </div>
        )}

        <div className="px-6 py-4 bg-white flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-subtle transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Deleting...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
