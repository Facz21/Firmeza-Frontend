import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Boxes } from 'lucide-react';
import { categoryService } from '../../categories/services/categoryService';
import type { CategoryDto } from '../../categories/types/category.types';
import { ProductStatus, type ProductDto } from '../types/product.types';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU code is required').max(50, 'SKU must not exceed 50 characters'),
  name: z.string().min(1, 'Asset name is required').max(200, 'Name must not exceed 200 characters'),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Unit price must be greater than zero'),
  stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative'),
  status: z.union([
    z.literal(ProductStatus.Draft),
    z.literal(ProductStatus.Active),
    z.literal(ProductStatus.OutOfStock),
    z.literal(ProductStatus.Discontinued),
  ]),
  categoryId: z.string().min(1, 'Category selection is required'),
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  productToEdit?: ProductDto | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productToEdit,
}) => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isEditing = !!productToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      price: 100,
      stockQuantity: 10,
      status: ProductStatus.Active,
      categoryId: '',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (isOpen) {
      categoryService.getCategories().then(setCategories).catch(console.error);

      if (productToEdit) {
        reset({
          sku: productToEdit.sku,
          name: productToEdit.name,
          description: productToEdit.description || '',
          price: productToEdit.price,
          stockQuantity: productToEdit.stockQuantity,
          status: productToEdit.status,
          categoryId: productToEdit.categoryId,
        });
      } else {
        reset({
          sku: '',
          name: '',
          description: '',
          price: 100,
          stockQuantity: 10,
          status: ProductStatus.Active,
          categoryId: '',
        });
      }
    }
  }, [isOpen, productToEdit, reset]);

  if (!isOpen) return null;

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      await onSubmit(data);
      handleClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('An error occurred while saving the asset specification.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-elevated max-w-lg w-full border border-slate-200 overflow-hidden max-h-[92vh] sm:max-h-none flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-brand-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-brand-800 text-brand-200 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="product-modal-title" className="font-bold text-sm sm:text-base leading-snug text-white truncate">
                {isEditing ? 'Modify SKU Specification' : 'Register New Inventory SKU'}
              </h3>
              <p className="text-xs text-brand-200 truncate">
                {isEditing
                  ? `Updating ledger entry for ${productToEdit?.sku}`
                  : 'Enter physical catalog and valuation parameters'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="p-2 sm:p-1.5 rounded-lg text-brand-200 hover:text-white hover:bg-brand-900 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {serverError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label htmlFor="field-sku" className="block text-xs font-semibold text-slate-800 mb-1.5">
                SKU Code
              </label>
              <input
                id="field-sku"
                type="text"
                {...register('sku')}
                disabled={isEditing}
                className={`w-full px-3 py-2 rounded-lg border font-mono text-xs ${
                  errors.sku ? 'border-rose-400' : 'border-slate-300 focus:border-brand-600'
                } ${
                  isEditing
                    ? 'bg-slate-100 cursor-not-allowed text-slate-600'
                    : 'bg-white text-slate-900'
                } focus:outline-none transition`}
                placeholder="e.g. SRV-DL380-G11"
              />
              {errors.sku && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.sku.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="field-category" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Category
              </label>
              <select
                id="field-category"
                {...register('categoryId')}
                className={`w-full px-3 py-2 rounded-lg border text-xs font-medium bg-white text-slate-900 ${
                  errors.categoryId ? 'border-rose-400' : 'border-slate-300 focus:border-brand-600'
                } focus:outline-none transition`}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.categoryId.message}</p>
              )}
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label htmlFor="field-name" className="block text-xs font-semibold text-slate-800 mb-1.5">
              Asset Title
            </label>
            <input
              id="field-name"
              type="text"
              {...register('name')}
              className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-900 ${
                errors.name ? 'border-rose-400' : 'border-slate-300 focus:border-brand-600'
              } focus:outline-none transition`}
              placeholder="e.g. HPE ProLiant DL380 Gen11 Rack Server"
            />
            {errors.name && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Price */}
            <div>
              <label htmlFor="field-price" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Unit Price ($ USD)
              </label>
              <input
                id="field-price"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className={`w-full px-3 py-2 rounded-lg border font-mono text-xs tabular-nums text-slate-900 ${
                  errors.price ? 'border-rose-400' : 'border-slate-300 focus:border-brand-600'
                } focus:outline-none transition`}
              />
              {errors.price && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.price.message}</p>}
            </div>

            {/* Stock Quantity */}
            <div>
              <label htmlFor="field-stock" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Stock Quantity
              </label>
              <input
                id="field-stock"
                type="number"
                {...register('stockQuantity', { valueAsNumber: true })}
                className={`w-full px-3 py-2 rounded-lg border font-mono text-xs tabular-nums text-slate-900 ${
                  errors.stockQuantity ? 'border-rose-400' : 'border-slate-300 focus:border-brand-600'
                } focus:outline-none transition`}
              />
              {errors.stockQuantity && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.stockQuantity.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="field-status" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Lifecycle Status
              </label>
              <select
                id="field-status"
                {...register('status', { valueAsNumber: true })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium bg-white text-slate-900 focus:border-brand-600 focus:outline-none transition"
              >
                <option value={ProductStatus.Draft}>Draft</option>
                <option value={ProductStatus.Active}>Active</option>
                <option value={ProductStatus.OutOfStock}>Out of Stock</option>
                <option value={ProductStatus.Discontinued}>Discontinued</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="field-desc" className="block text-xs font-semibold text-slate-800 mb-1.5">
              Technical Specification &amp; Notes
            </label>
            <textarea
              id="field-desc"
              rows={3}
              {...register('description')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-brand-600 focus:outline-none resize-none transition"
              placeholder="Hardware configuration, serial series, rack location, or warranty terms..."
            />
            {errors.description && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.description.message}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 grid grid-cols-2 sm:flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 sm:py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-subtle transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Register SKU'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
