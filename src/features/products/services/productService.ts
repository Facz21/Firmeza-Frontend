import { apiClient, downloadFileBlob } from '../../../services/apiClient';
import type {
  CreateProductRequest,
  PaginatedList,
  ProductDto,
  ProductImportResultDto,
  ProductQueryParams,
  UpdateProductRequest,
} from '../types/product.types';

export const productService = {
  async getProducts(params?: ProductQueryParams): Promise<PaginatedList<ProductDto>> {
    const response = await apiClient.get<PaginatedList<ProductDto>>('/products', {
      params,
    });
    return response.data;
  },

  async getProductById(id: string): Promise<ProductDto> {
    const response = await apiClient.get<ProductDto>(`/products/${id}`);
    return response.data;
  },

  async createProduct(request: CreateProductRequest): Promise<string> {
    const response = await apiClient.post<string>('/products', request);
    return response.data;
  },

  async updateProduct(id: string, request: UpdateProductRequest): Promise<void> {
    await apiClient.put(`/products/${id}`, request);
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  async exportExcel(params?: ProductQueryParams): Promise<void> {
    const response = await apiClient.get('/products/export/excel', {
      params,
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'];
    const fallbackFilename = `Products_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    downloadFileBlob(response.data, fallbackFilename, contentDisposition);
  },

  async exportPdf(id: string, sku: string): Promise<void> {
    const response = await apiClient.get(`/products/${id}/export/pdf`, {
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'];
    const fallbackFilename = `Product_${sku}_${new Date().toISOString().slice(0, 10)}.pdf`;
    downloadFileBlob(response.data, fallbackFilename, contentDisposition);
  },

  async importExcel(file: File): Promise<ProductImportResultDto> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ProductImportResultDto>('/products/import/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
