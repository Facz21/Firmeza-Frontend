export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  productCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}
