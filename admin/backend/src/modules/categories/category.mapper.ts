import type { CategoryWithMeta } from './categories.repository';

export interface CategoryResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export function toCategoryResponse(
  category: CategoryWithMeta,
): CategoryResponse {
  return {
    id: category.id,
    nameAr: category.nameAr,
    nameFr: category.nameFr,
    slug: category.slug,
    descriptionAr: category.descriptionAr,
    descriptionFr: category.descriptionFr,
    image: category.image,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    parentId: category.parentId,
    parent: category.parent,
    childrenCount: category._count.children,
    productCount: category._count.products,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}
