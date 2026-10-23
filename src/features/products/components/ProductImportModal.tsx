import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import type { ProductImportResultDto } from '../types/product.types';
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ProductImportModal: React.FC<ProductImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ProductImportResultDto | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUploading, onClose]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx')) {
        setSelectedFile(file);
        setUploadError(null);
      } else {
        setUploadError('Only standard Excel (.xlsx) workbooks are accepted.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.xlsx')) {
        setSelectedFile(file);
        setUploadError(null);
      } else {
        setUploadError('Only standard Excel (.xlsx) workbooks are accepted.');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      const res = await productService.importExcel(selectedFile);
      setResult(res);
      onImportSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setUploadError(err.message);
      } else {
        setUploadError('An error occurred during Excel ingestion.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setUploadError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-elevated max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-800 text-brand-200 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 id="import-modal-title" className="font-bold text-base leading-snug text-white">
                Bulk Excel Ingestion
              </h3>
              <p className="text-xs text-brand-200">
                Synchronize SKU records from an .xlsx spreadsheet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import modal"
            className="p-1.5 rounded-lg text-brand-200 hover:text-white hover:bg-brand-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-700" />
              <span>{uploadError}</span>
            </div>
          )}

          {result ? (
            /* Results Summary (No nested cards) */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>Workbook ingestion completed</span>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-200 border border-slate-200 rounded-lg bg-slate-50 text-center overflow-hidden">
                <div className="p-3">
                  <div className="text-lg font-bold font-mono text-slate-950 tabular-nums">
                    {result.totalProcessed}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium mt-0.5">Processed</div>
                </div>
                <div className="p-3">
                  <div className="text-lg font-bold font-mono text-emerald-700 tabular-nums">
                    +{result.inserted}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium mt-0.5">Inserted</div>
                </div>
                <div className="p-3">
                  <div className="text-lg font-bold font-mono text-brand-700 tabular-nums">
                    {result.updated}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium mt-0.5">Updated</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-xs font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Row Validation Exceptions ({result.errors.length})</span>
                  </div>
                  <ul className="text-xs text-amber-900 max-h-32 overflow-y-auto space-y-1 list-disc pl-4">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ingest Another File</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-950 text-white hover:bg-brand-900 transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Upload Zone */
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center ${
                  dragActive
                    ? 'border-brand-600 bg-brand-50 text-brand-950'
                    : selectedFile
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70 text-slate-900'
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-mono font-bold">{selectedFile.name}</p>
                    <p className="text-xs font-mono mt-1 tabular-nums">
                      {(selectedFile.size / 1024).toFixed(1)} KB · Ready for ingestion
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold">
                      Drag and drop your Excel (.xlsx) workbook here
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Or select a file from your workstation
                    </p>
                  </div>
                )}

                <label className="mt-4 inline-flex items-center px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer shadow-subtle transition">
                  <span>Browse Workstation</span>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900">Expected columns:</span>{' '}
                <span className="font-mono text-[11px]">
                  Sku, Name, Description, Price, StockQuantity, Status, CategoryName
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-subtle transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Ingesting Workbook...' : 'Start Ingestion'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
