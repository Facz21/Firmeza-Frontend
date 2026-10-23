import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { categoryService } from '../../categories/services/categoryService';
import {
  ProductStatus,
  ProductStatusLabels,
  type ProductDto,
  type CreateProductRequest,
  type UpdateProductRequest,
} from '../types/product.types';
import { useAuth } from '../../auth/context/AuthContext';
import { useCart } from '../../orders/context/CartContext';
import { useToast } from '../../../components/ui/ToastContext';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { ProductModal } from './ProductModal';
import { ProductImportModal } from './ProductImportModal';
import { ProductDetailModal } from './ProductDetailModal';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Boxes,
  AlertCircle,
  X,
  ShoppingCart,
  LayoutGrid,
  List,
  ArrowUpDown,
} from 'lucide-react';

type SortOption = 'default' | 'name-asc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc';
type ViewMode = 'auto' | 'grid' | 'table';

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: String(ProductStatus.Active) },
  { label: 'Out of Stock', value: String(ProductStatus.OutOfStock) },
  { label: 'Draft', value: String(ProductStatus.Draft) },
  { label: 'Discontinued', value: String(ProductStatus.Discontinued) },
];

export const ProductTable: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { addItem, items: cartItems } = useCart();
  const { notify } = useToast();

  // Filters, Sorting, View Mode & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [inspectingProduct, setInspectingProduct] = useState<ProductDto | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductDto | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Fetch Categories for Filter Dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  // Fetch Products with TanStack Query
  const {
    data: paginatedProducts,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['products', pageNumber, pageSize, searchTerm, selectedCategory, selectedStatus],
    queryFn: () =>
      productService.getProducts({
        pageNumber,
        pageSize,
        searchTerm: searchTerm.trim() || undefined,
        categoryId: selectedCategory || undefined,
        status: selectedStatus !== '' ? (Number(selectedStatus) as ProductStatus) : undefined,
      }),
  });

  // Compute Telemetry Strip Metrics from current view
  const telemetry = useMemo(() => {
    const items = paginatedProducts?.items ?? [];
    const totalValuation = items.reduce(
      (sum, item) => sum + item.price * item.stockQuantity,
      0
    );
    const totalUnits = items.reduce((sum, item) => sum + item.stockQuantity, 0);
    const criticalCount = items.filter((item) => item.stockQuantity < 5).length;

    return {
      totalCount: paginatedProducts?.totalCount ?? 0,
      totalValuation,
      totalUnits,
      criticalCount,
    };
  }, [paginatedProducts]);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      notify({
        variant: 'success',
        title: 'Asset removed from registry',
        description: productToDelete
          ? `${productToDelete.sku} (${productToDelete.name}) was permanently deleted.`
          : undefined,
      });
      setProductToDelete(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to delete asset';
      notify({
        variant: 'error',
        title: 'Deletion failed',
        description: msg,
      });
      setProductToDelete(null);
    },
  });

  // Create Product Mutation
  const createMutation = useMutation({
    mutationFn: (req: CreateProductRequest) => productService.createProduct(req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      notify({
        variant: 'success',
        title: 'Asset registered',
        description: `SKU ${variables.sku} has been added to the inventory ledger.`,
      });
    },
  });

  // Update Product Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateProductRequest }) =>
      productService.updateProduct(id, req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      notify({
        variant: 'success',
        title: 'Asset record updated',
        description: `Specifications for ${variables.req.sku} were saved.`,
      });
    },
  });

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      await productService.exportExcel({
        searchTerm: searchTerm.trim() || undefined,
        categoryId: selectedCategory || undefined,
        status: selectedStatus !== '' ? (Number(selectedStatus) as ProductStatus) : undefined,
      });
      notify({
        variant: 'info',
        title: 'Excel ledger exported',
        description: 'Your filtered inventory workbook download has started.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to generate Excel workbook.';
      notify({
        variant: 'error',
        title: 'Export failed',
        description: msg,
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportSinglePdf = async (product: ProductDto) => {
    try {
      await productService.exportPdf(product.id, product.sku);
      notify({
        variant: 'info',
        title: 'PDF dossier generated',
        description: `Downloaded compliance report for ${product.sku}.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to generate PDF report.';
      notify({
        variant: 'error',
        title: 'PDF export failed',
        description: msg,
      });
    }
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCategory !== '' ||
    selectedStatus !== '' ||
    sortBy !== 'default';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSortBy('default');
    setPageNumber(1);
  };

  // Client-side sort of current page items for quick navigation
  const displayedProducts = useMemo(() => {
    const items = [...(paginatedProducts?.items ?? [])];
    switch (sortBy) {
      case 'name-asc':
        return items.sort((a, b) => a.name.localeCompare(b.name));
      case 'price-asc':
        return items.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return items.sort((a, b) => b.price - a.price);
      case 'stock-asc':
        return items.sort((a, b) => a.stockQuantity - b.stockQuantity);
      case 'stock-desc':
        return items.sort((a, b) => b.stockQuantity - a.stockQuantity);
      default:
        return items;
    }
  }, [paginatedProducts?.items, sortBy]);

  // Compute compact page numbers for quick page jumping
  const pageNumbers = useMemo(() => {
    const total = paginatedProducts?.totalPages ?? 1;
    const current = paginatedProducts?.pageNumber ?? 1;
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, total];
    }
    if (current >= total - 2) {
      return [1, total - 3, total - 2, total - 1, total];
    }
    return [1, current - 1, current, current + 1, total];
  }, [paginatedProducts?.totalPages, paginatedProducts?.pageNumber]);

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.Active:
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case ProductStatus.Draft:
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case ProductStatus.OutOfStock:
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case ProductStatus.Discontinued:
        return 'bg-rose-50 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Header & Primary Operational Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
            Asset &amp; Stock Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Physical equipment registry, stock valuation, and compliance reporting.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-xs shadow-subtle transition disabled:opacity-50"
            title="Export filtered records as styled Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate">{isExportingExcel ? 'Exporting...' : 'Export Excel'}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-xs shadow-subtle transition"
              title="Bulk import inventory via Excel spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span className="truncate">Bulk Import .xlsx</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-xs shadow-subtle transition"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Register SKU</span>
            </button>
          )}
        </div>
      </div>

      {/* Unified Operational Telemetry Strip */}
      <section
        aria-label="Inventory telemetry summary"
        className="bg-white rounded-xl border border-slate-200/90 shadow-subtle grid grid-cols-2 lg:grid-cols-4 overflow-hidden"
      >
        <div className="p-3.5 sm:p-4 sm:px-5 border-b border-r border-slate-200 lg:border-b-0">
          <div className="text-[11px] sm:text-xs font-medium text-slate-600 truncate">
            Matched SKUs
          </div>
          <div className="mt-1 text-lg sm:text-2xl font-bold font-mono text-slate-950 tabular-nums">
            {isLoading ? '—' : telemetry.totalCount}
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 truncate">
            Active query scope
          </div>
        </div>

        <div className="p-3.5 sm:p-4 sm:px-5 border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="text-[11px] sm:text-xs font-medium text-slate-600 truncate">
            Page Valuation
          </div>
          <div className="mt-1 text-lg sm:text-2xl font-bold font-mono text-slate-950 tabular-nums truncate">
            {isLoading
              ? '—'
              : `$${telemetry.totalValuation.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 truncate">
            Price × stock on page
          </div>
        </div>

        <div className="p-3.5 sm:p-4 sm:px-5 border-r border-slate-200">
          <div className="text-[11px] sm:text-xs font-medium text-slate-600 truncate">
            Units on Page
          </div>
          <div className="mt-1 text-lg sm:text-2xl font-bold font-mono text-slate-950 tabular-nums">
            {isLoading ? '—' : telemetry.totalUnits.toLocaleString('en-US')}
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 truncate">
            Physical stock count
          </div>
        </div>

        <div className="p-3.5 sm:p-4 sm:px-5">
          <div className="text-[11px] sm:text-xs font-medium text-slate-600 truncate">
            Low / Depleted
          </div>
          <div
            className={`mt-1 text-lg sm:text-2xl font-bold font-mono tabular-nums ${
              telemetry.criticalCount > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {isLoading ? '—' : telemetry.criticalCount}
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 truncate">
            Below 5 units threshold
          </div>
        </div>
      </section>

      {/* Filter, Search, Sort & View Control Bar (Zero Horizontal Scroll) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-subtle p-3.5 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center justify-between gap-2.5 sm:gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:flex-1 lg:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageNumber(1);
              }}
              placeholder="Buscar por código SKU, nombre o especificación..."
              aria-label="Search inventory by SKU, name, or specification"
              className="w-full pl-10 pr-8 py-2.5 sm:py-2 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-600 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPageNumber(1);
                }}
                aria-label="Clear search query"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPageNumber(1);
              }}
              aria-label="Filter by category"
              className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-slate-300 text-xs font-medium bg-white text-slate-900 focus:outline-none focus:border-brand-600"
            >
              <option value="">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown & View Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort products"
                className="w-full pl-8 pr-3 py-2.5 sm:py-2 rounded-lg border border-slate-300 text-xs font-medium bg-white text-slate-900 focus:outline-none focus:border-brand-600"
              >
                <option value="default">Orden: Por defecto</option>
                <option value="name-asc">Nombre (A - Z)</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="stock-asc">Stock: Menor a Mayor</option>
                <option value="stock-desc">Stock: Mayor a Menor</option>
              </select>
            </div>

            {/* View Switcher (Visible on Tablet & Desktop md+) */}
            <div
              className="hidden md:inline-flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5 shrink-0"
              role="group"
              aria-label="Modo de visualización"
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Vista en cuadrícula de tarjetas (sin scroll horizontal)"
                className={`p-1.5 rounded-md text-xs font-semibold transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-brand-950 shadow-subtle'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Vista en tabla compacta"
                className={`p-1.5 rounded-md text-xs font-semibold transition ${
                  viewMode === 'table'
                    ? 'bg-white text-brand-950 shadow-subtle'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Quick-Filter Pills (Wrapped cleanly, NO horizontal scroll) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 mr-1">Estado:</span>
            {STATUS_FILTERS.map((pill) => {
              const isActive = selectedStatus === pill.value;
              return (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(pill.value);
                    setPageNumber(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand-950 text-white shadow-subtle'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-50 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Data Ledger Container (Responsive Grid for Mobile & Tablets + Compact Zero-Sidescroll Table for Desktop) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-subtle overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-200">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              Synchronizing inventory records...
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 p-4">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3 animate-pulse"
                >
                  <div className="flex items-center justify-between xl:w-28">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                    <div className="h-5 w-16 bg-slate-200 rounded-full xl:hidden" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 xl:w-48 bg-slate-200 rounded" />
                    <div className="h-3 w-1/2 xl:w-64 bg-slate-100 rounded" />
                  </div>
                  <div className="flex items-center justify-between xl:gap-4">
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                    <div className="hidden xl:block h-5 w-16 bg-slate-200 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-900 mt-1">
              Unable to load inventory registry
            </p>
            <p className="text-xs text-slate-600 max-w-md">
              {(error as Error)?.message || 'Verify that the backend API service is reachable.'}
            </p>
          </div>
        ) : !displayedProducts.length ? (
          <div className="p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">No matching inventory records</p>
              <p className="text-xs text-slate-600 mt-1 max-w-sm">
                No assets match the active search query or lifecycle filter criteria.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-1 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition"
              >
                Clear active filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Responsive Card Grid:
                - Shown on Mobile (< 768px) and Tablets (768px - 1279px) by default when viewMode === 'auto'
                - Also shown on all screens when viewMode === 'grid'
                - 1 column on phones, 2 columns on tablets (sm/md/lg), 3 columns on wide desktop in grid mode */}
            <div
              className={`${
                viewMode === 'grid'
                  ? 'grid'
                  : viewMode === 'table'
                  ? 'md:hidden grid'
                  : 'xl:hidden grid'
              } grid-cols-1 sm:grid-cols-2 ${
                viewMode === 'grid' ? 'xl:grid-cols-3' : ''
              } gap-3.5 p-3.5 sm:p-4 bg-slate-50/50`}
            >
              {displayedProducts.map((product) => {
                const cartQuantity =
                  cartItems.find((i) => i.product.id === product.id)?.quantity ?? 0;
                const canAddToCart =
                  product.status === ProductStatus.Active && product.stockQuantity > 0;

                return (
                  <article
                    key={product.id}
                    className="bg-white rounded-xl border border-slate-200/90 p-4 flex flex-col justify-between gap-3 shadow-subtle hover:border-slate-300 transition"
                  >
                    <div className="space-y-2.5">
                      {/* Top Meta Row: SKU + Category + Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => setInspectingProduct(product)}
                            className="font-mono text-xs font-bold text-brand-700 hover:text-brand-900 underline decoration-brand-300 underline-offset-4 truncate"
                          >
                            {product.sku}
                          </button>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] truncate">
                            {product.categoryName || 'Uncategorized'}
                          </span>
                        </div>

                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border shrink-0 ${getStatusBadge(
                            product.status
                          )}`}
                        >
                          {ProductStatusLabels[product.status]}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setInspectingProduct(product)}
                          className="text-left font-bold text-sm text-slate-950 hover:text-brand-700 transition line-clamp-1"
                        >
                          {product.name}
                        </button>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 min-h-[2rem]">
                          {product.description || 'No technical notes recorded'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Price & Stock Strip */}
                      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                            Unit Price
                          </span>
                          <span className="font-mono text-sm font-bold text-slate-950 tabular-nums">
                            $
                            {product.price.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                            Available Stock
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-semibold text-xs tabular-nums ${
                              product.stockQuantity === 0
                                ? 'bg-rose-100 text-rose-800'
                                : product.stockQuantity < 5
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {product.stockQuantity} units
                          </span>
                        </div>
                      </div>

                      {/* Touch-Friendly Actions */}
                      <div className="flex items-center justify-between gap-2">
                        {canAddToCart ? (
                          <button
                            type="button"
                            onClick={() => {
                              addItem(product, 1);
                              notify({
                                variant: 'success',
                                title: 'Agregado al carrito',
                                description: `${product.name} (${product.sku}) añadido a tu carrito de compra.`,
                              });
                            }}
                            aria-label={`Add ${product.sku} to cart`}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-xs shadow-subtle transition"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {cartQuantity > 0
                                ? `En carrito (${cartQuantity})`
                                : 'Agregar al carrito'}
                            </span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 italic truncate">
                            No disponible
                          </span>
                        )}

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setInspectingProduct(product)}
                            title="Inspect Dossier"
                            aria-label={`Inspect details for ${product.sku}`}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:bg-slate-200 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportSinglePdf(product)}
                            title="Download PDF Certificate"
                            aria-label={`Download PDF report for ${product.sku}`}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:bg-slate-200 transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setEditingProduct(product)}
                              title="Edit Asset Record"
                              aria-label={`Edit ${product.sku}`}
                              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:bg-slate-200 transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setProductToDelete(product)}
                              title="Delete Asset Record"
                              aria-label={`Delete ${product.sku}`}
                              className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 text-rose-700 hover:text-rose-900 hover:bg-rose-100 active:bg-rose-200 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Compact Zero-Sidescroll Table (Desktop xl+ by default, or md+ when viewMode === 'table') */}
            <div
              className={`${
                viewMode === 'grid'
                  ? 'hidden'
                  : viewMode === 'table'
                  ? 'hidden md:block'
                  : 'hidden xl:block'
              }`}
            >
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-3 px-3.5 w-[18%]">SKU &amp; Categoría</th>
                    <th className="py-3 px-3.5 w-[32%]">Activo y Especificación</th>
                    <th className="py-3 px-3.5 text-right w-[13%]">Precio Unit.</th>
                    <th className="py-3 px-3.5 text-right w-[12%]">Stock</th>
                    <th className="py-3 px-3.5 text-center w-[11%]">Estado</th>
                    <th className="py-3 px-3.5 text-right w-[22%]">Operaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 text-xs">
                  {displayedProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/90 transition group"
                    >
                      {/* SKU & Category stacked to prevent horizontal overflow */}
                      <td className="py-3 px-3.5 align-middle">
                        <button
                          type="button"
                          onClick={() => setInspectingProduct(product)}
                          className="font-mono font-semibold text-brand-700 hover:text-brand-900 underline decoration-brand-300 underline-offset-4 transition block truncate max-w-full"
                          title="Open technical dossier"
                        >
                          {product.sku}
                        </button>
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px] truncate max-w-full">
                          {product.categoryName || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Asset Details */}
                      <td className="py-3 px-3.5 align-middle min-w-0">
                        <button
                          type="button"
                          onClick={() => setInspectingProduct(product)}
                          className="text-left font-semibold text-slate-950 hover:text-brand-700 truncate block max-w-full"
                        >
                          {product.name}
                        </button>
                        <div className="text-[11px] text-slate-600 truncate mt-0.5">
                          {product.description || 'No technical notes recorded'}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-950 tabular-nums align-middle">
                        ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-3.5 text-right align-middle">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-semibold text-[11px] tabular-nums ${
                            product.stockQuantity === 0
                              ? 'bg-rose-100 text-rose-800'
                              : product.stockQuantity < 5
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {product.stockQuantity} u.
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3.5 text-center align-middle">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border truncate max-w-full ${getStatusBadge(
                            product.status
                          )}`}
                        >
                          {ProductStatusLabels[product.status]}
                        </span>
                      </td>

                      {/* Actions Menu */}
                      <td className="py-3 px-3.5 text-right align-middle">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1">
                          {/* Add to Cart Button */}
                          {product.status === ProductStatus.Active && product.stockQuantity > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                addItem(product, 1);
                                notify({
                                  variant: 'success',
                                  title: 'Agregado al carrito',
                                  description: `${product.name} (${product.sku}) añadido a tu carrito de compra.`,
                                });
                              }}
                              title="Agregar al carrito de compra"
                              aria-label={`Add ${product.sku} to cart`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-800 font-semibold text-[11px] transition"
                            >
                              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {cartItems.find((i) => i.product.id === product.id)?.quantity
                                  ? `(${cartItems.find((i) => i.product.id === product.id)?.quantity})`
                                  : 'Agregar'}
                              </span>
                            </button>
                          )}

                          {/* Inspect Details */}
                          <button
                            type="button"
                            onClick={() => setInspectingProduct(product)}
                            title="Inspect Dossier"
                            aria-label={`Inspect details for ${product.sku}`}
                            className="p-1.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Direct PDF Download */}
                          <button
                            type="button"
                            onClick={() => handleExportSinglePdf(product)}
                            title="Download PDF Certificate"
                            aria-label={`Download PDF report for ${product.sku}`}
                            className="p-1.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Edit Button (Admin Only) */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setEditingProduct(product)}
                              title="Edit Asset Record"
                              aria-label={`Edit ${product.sku}`}
                              className="p-1.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Button (Admin Only) */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setProductToDelete(product)}
                              title="Delete Asset Record"
                              aria-label={`Delete ${product.sku}`}
                              className="p-1.5 rounded-lg text-rose-700 hover:text-rose-900 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Enhanced Pagination Footer with Page Size & Direct Page Numbers */}
        {paginatedProducts && paginatedProducts.totalCount > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-700">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full md:w-auto">
              <div className="font-mono tabular-nums">
                Página <span className="font-bold text-slate-950">{paginatedProducts.pageNumber}</span> de{' '}
                <span className="font-bold text-slate-950">{paginatedProducts.totalPages}</span> ·{' '}
                <span className="font-semibold text-slate-900">{paginatedProducts.totalCount}</span> SKUs
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="page-size-select" className="text-slate-500">
                  Mostrar:
                </label>
                <select
                  id="page-size-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPageNumber(1);
                  }}
                  className="px-2 py-1 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-600"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={!paginatedProducts.hasPreviousPage}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              {/* Direct Page Number Buttons */}
              <div className="flex items-center gap-1">
                {pageNumbers.map((num, idx) => {
                  const prevNum = idx > 0 ? pageNumbers[idx - 1] : null;
                  const showEllipsis = prevNum !== null && num - prevNum > 1;
                  return (
                    <React.Fragment key={num}>
                      {showEllipsis && (
                        <span className="px-1 text-slate-400 font-mono">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPageNumber(num)}
                        aria-label={`Ir a la página ${num}`}
                        aria-current={paginatedProducts.pageNumber === num ? 'page' : undefined}
                        className={`min-w-[2rem] h-8 px-2 rounded-lg font-mono text-xs font-bold transition ${
                          paginatedProducts.pageNumber === num
                            ? 'bg-brand-950 text-white shadow-subtle'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setPageNumber((p) => p + 1)}
                disabled={!paginatedProducts.hasNextPage}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold disabled:opacity-40 transition"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Product */}
      <ProductModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (data) => {
          await createMutation.mutateAsync({
            sku: data.sku,
            name: data.name,
            description: data.description || undefined,
            price: data.price,
            stockQuantity: data.stockQuantity,
            status: data.status,
            categoryId: data.categoryId,
          });
        }}
      />

      {/* Modal: Edit Product */}
      <ProductModal
        isOpen={!!editingProduct}
        productToEdit={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSubmit={async (data) => {
          if (!editingProduct) return;
          await updateMutation.mutateAsync({
            id: editingProduct.id,
            req: {
              id: editingProduct.id,
              sku: data.sku,
              name: data.name,
              description: data.description || undefined,
              price: data.price,
              stockQuantity: data.stockQuantity,
              status: data.status,
              categoryId: data.categoryId,
            },
          });
        }}
      />

      {/* Modal: Import Excel */}
      <ProductImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
          notify({
            variant: 'success',
            title: 'Spreadsheet ingestion completed',
            description: 'Inventory ledger has been synchronized with your workbook.',
          });
        }}
      />

      {/* Modal: Product Details & PDF */}
      <ProductDetailModal
        isOpen={!!inspectingProduct}
        product={inspectingProduct}
        onClose={() => setInspectingProduct(null)}
      />

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        title="Delete Inventory Asset"
        description="This action permanently removes the SKU record from the ledger and cannot be undone."
        itemCode={productToDelete?.sku}
        itemName={productToDelete?.name}
        isLoading={deleteMutation.isPending}
        onCancel={() => setProductToDelete(null)}
        onConfirm={() => {
          if (productToDelete) {
            deleteMutation.mutate(productToDelete.id);
          }
        }}
      />
    </div>
  );
};
