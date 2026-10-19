import { apiClient, unwrap } from './client';
import type { ProductStatus } from './catalog-types';
import type { ApiSuccess, Paginated } from './types';

export type Availability = 'IN' | 'LOW' | 'OUT';
export type MovementKind = 'ADJUSTMENT' | 'DEDUCTION' | 'RESTORATION';
export type InventorySort =
  'updatedAt' | 'quantity' | 'lowStockThreshold' | 'nameAr' | 'nameFr';
export type MovementSort = 'createdAt' | 'delta' | 'balanceAfter';

export interface InventoryItem {
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  updatedAt: string;
  availability: Availability;
  product: {
    nameAr: string;
    nameFr: string;
    sku: string | null;
    status: ProductStatus;
  };
}

export interface StockMovement {
  id: string;
  productId: string;
  orderId: string | null;
  kind: MovementKind;
  delta: number;
  balanceAfter: number;
  reason: string;
  actorId: string | null;
  productNameAr: string;
  productNameFr: string;
  productSku: string | null;
  createdAt: string;
}

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: 'asc' | 'desc';
}
export interface InventoryParams extends ListParams {
  sortBy?: InventorySort;
  availability?: Availability;
  status?: ProductStatus;
  categoryId?: string;
}
export interface MovementParams extends ListParams {
  sortBy?: MovementSort;
  kind?: MovementKind;
}
export interface StockAdjustment {
  delta: number;
  reason: string;
  lowStockThreshold?: number;
}
export interface ThresholdUpdate {
  lowStockThreshold: number;
  reason: string;
}

export async function listInventory(
  params: InventoryParams,
): Promise<Paginated<InventoryItem>> {
  return unwrap(
    await apiClient.get<ApiSuccess<Paginated<InventoryItem>>>('/inventory', {
      params,
    }),
  );
}
export async function listStockMovements(
  productId: string,
  params: MovementParams,
): Promise<Paginated<StockMovement>> {
  return unwrap(
    await apiClient.get<ApiSuccess<Paginated<StockMovement>>>(
      `/inventory/${productId}/movements`,
      { params },
    ),
  );
}
export async function adjustStock(
  productId: string,
  input: StockAdjustment,
): Promise<
  Pick<InventoryItem, 'productId' | 'quantity' | 'lowStockThreshold'>
> {
  return unwrap(
    await apiClient.post<
      ApiSuccess<
        Pick<InventoryItem, 'productId' | 'quantity' | 'lowStockThreshold'>
      >
    >(`/inventory/${productId}/adjustments`, input),
  );
}
export async function updateStockThreshold(
  productId: string,
  input: ThresholdUpdate,
): Promise<Omit<InventoryItem, 'product' | 'availability'>> {
  return unwrap(
    await apiClient.patch<
      ApiSuccess<Omit<InventoryItem, 'product' | 'availability'>>
    >(`/inventory/${productId}/threshold`, input),
  );
}
