export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface Category {
  id: string;
  nameAr: string;
  nameFr: string;
  slug: string;
  descriptionAr: string | null;
  descriptionFr: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  parentId: string | null;
  parent: { id: string; nameAr: string; nameFr: string } | null;
  childrenCount: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

export interface ProductImage {
  id: string;
  url: string;
  altAr: string | null;
  altFr: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  nameAr: string;
  nameFr: string;
  slug: string;
  shortDescriptionAr: string | null;
  shortDescriptionFr: string | null;
  descriptionAr: string | null;
  descriptionFr: string | null;
  sku: string | null;
  price: number;
  oldPrice: number | null;
  costPrice: number | null;
  discountPercentage: number | null;
  status: ProductStatus;
  isFeatured: boolean;
  featuredOrder: number;
  categoryId: string | null;
  category: { id: string; nameAr: string; nameFr: string; slug: string } | null;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  nameAr: string;
  nameFr: string;
  slug?: string;
  descriptionAr?: string;
  descriptionFr?: string;
  image?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  parentId?: string | null;
}

export interface ProductInput {
  nameAr: string;
  nameFr: string;
  slug?: string;
  shortDescriptionAr?: string;
  shortDescriptionFr?: string;
  descriptionAr?: string;
  descriptionFr?: string;
  sku?: string;
  price: number;
  oldPrice?: number | null;
  costPrice?: number | null;
  status?: ProductStatus;
  isFeatured?: boolean;
  categoryId?: string | null;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
  isFeatured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Opening stock is accepted only when creating a new product. */
export interface CreateProductInput extends ProductInput {
  initialQuantity?: number;
  lowStockThreshold?: number;
  stockReason?: string;
}
