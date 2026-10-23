export const ProductStatus = {
  Draft: 0,
  Active: 1,
  OutOfStock: 2,
  Discontinued: 3,
} as const;

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const ProductStatusLabels: Record<ProductStatus, string> = {
  [ProductStatus.Draft]: 'Draft',
  [ProductStatus.Active]: 'Active',
  [ProductStatus.OutOfStock]: 'Out of Stock',
  [ProductStatus.Discontinued]: 'Discontinued',
};

export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  status: ProductStatus;
  categoryId: string;
  categoryName: string;
  createdAt: string;
  createdBy?: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  status: ProductStatus;
  categoryId: string;
}

export interface UpdateProductRequest {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  status: ProductStatus;
  categoryId: string;
}

export interface ProductImportResultDto {
  totalProcessed: number;
  inserted: number;
  updated: number;
  errors: string[];
}

export interface ProductQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  categoryId?: string;
  status?: ProductStatus;
}
