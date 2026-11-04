export interface CategoryDto {
  id: number;
  name: string;
}

export interface ProductListDto {
  id: number;
  name: string;
  price: number;
  stock: number;
  warrantyMonths: number;
  description: string;
  imageUrl: string | null;
  category: CategoryDto;
  userId: number;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ProductCreateUpdateDto {
  name: string;
  price: number;
  stock: number;
  warrantyMonths: number;
  description: string;
  categoryId: number;
}
