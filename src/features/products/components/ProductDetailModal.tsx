import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { ProductStatus, ProductStatusLabels, type ProductDto } from '../types/product.types';
import { X, FileText, Download, Calendar, User, Hash } from 'lucide-react';

interface ProductDetailModalProps {
  product: ProductDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const handleExportPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await productService.exportPdf(product.id, product.sku);
    } catch (err) {
      console.error('Failed to export PDF', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.Active:
        return 'bg-emerald-900 text-emerald-100 border-emerald-700';
      case ProductStatus.Draft:
        return 'bg-brand-900 text-brand-100 border-brand-700';
      case ProductStatus.OutOfStock:
        return 'bg-amber-900 text-amber-100 border-amber-700';
      case ProductStatus.Discontinued:
        return 'bg-rose-900 text-rose-100 border-rose-700';
      default:
        return 'bg-brand-900 text-brand-100 border-brand-700';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-elevated max-w-xl w-full border border-slate-200 overflow-hidden max-h-[92vh] sm:max-h-none flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-brand-950 text-white flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-brand-800 text-brand-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-brand-200">{product.sku}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                    product.status
                  )}`}
                >
                  {ProductStatusLabels[product.status]}
                </span>
              </div>
              <h3
                id="detail-modal-title"
                className="font-bold text-base sm:text-lg leading-snug mt-1 text-white break-words"
              >
                {product.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspection dossier"
            className="p-2 sm:p-1.5 rounded-lg text-brand-200 hover:text-white hover:bg-brand-900 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200 bg-slate-50">
            <div className="p-3.5 sm:p-4 border-r border-slate-200 sm:border-r-0">
              <div className="text-[11px] sm:text-xs font-medium text-slate-600">Unit Valuation</div>
              <div className="mt-1 text-base sm:text-lg font-bold font-mono text-slate-950 tabular-nums">
                ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3.5 sm:p-4">
              <div className="text-[11px] sm:text-xs font-medium text-slate-600">On-Hand Stock</div>
              <div className="mt-1 text-base sm:text-lg font-bold font-mono text-slate-950 tabular-nums">
                {product.stockQuantity} units
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4">
              <div className="text-[11px] sm:text-xs font-medium text-slate-600">Classification</div>
              <div className="mt-1 text-sm font-bold text-slate-950 truncate">
                {product.categoryName || 'Uncategorized'}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-5">
            {/* Technical Specification */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">
                Technical Specification &amp; Notes
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {product.description || 'No detailed technical specifications recorded for this inventory item.'}
              </p>
            </div>

            {/* Audit Trail Ledger */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 mb-3">
                Audit Trail &amp; Provenance
              </h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span>Created:</span>
                  <span className="font-mono tabular-nums text-slate-900 truncate">
                    {new Date(product.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span>Registered by:</span>
                  <span className="font-medium text-slate-900 truncate">{product.createdBy || 'System'}</span>
                </div>
                {product.lastModifiedAt && (
                  <>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>Modified:</span>
                      <span className="font-mono tabular-nums text-slate-900 truncate">
                        {new Date(product.lastModifiedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>Modified by:</span>
                      <span className="font-medium text-slate-900 truncate">
                        {product.lastModifiedBy || 'System'}
                      </span>
                    </div>
                  </>
                )}
                <div className="sm:col-span-2 flex items-center gap-2 text-slate-600 font-mono text-[11px] pt-1 break-all">
                  <Hash className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span>Ledger UUID: {product.id}</span>
                </div>
              </dl>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 border-t border-slate-200">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isDownloadingPdf}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg bg-brand-950 hover:bg-brand-900 text-white font-semibold text-xs shadow-subtle transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {isDownloadingPdf ? 'Generating PDF Certificate...' : 'Download Official PDF Report'}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
