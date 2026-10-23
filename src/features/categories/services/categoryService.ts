import { apiClient } from '../../../services/apiClient';
import type { CategoryDto, CreateCategoryRequest } from '../types/category.types';

export const categoryService = {
  async getCategories(): Promise<CategoryDto[]> {
    const response = await apiClient.get<CategoryDto[]>('/categories');
    return response.data;
  },

  async createCategory(request: CreateCategoryRequest): Promise<string> {
    const response = await apiClient.post<string>('/categories', request);
    return response.data;
  },
};
