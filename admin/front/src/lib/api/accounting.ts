import { apiClient, unwrap } from './client';
import type { ApiSuccess, Paginated } from './types';

export type PartnerEntryKind = 'CONTRIBUTION' | 'WITHDRAWAL';

export interface Partner {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PartnerEntry {
  id: string;
  partnerId: string;
  kind: PartnerEntryKind;
  amount: number;
  date: string;
  note: string | null;
  partner: { id: string; name: string };
}

export interface Expense {
  id: string;
  label: string;
  category: string | null;
  amount: number;
  date: string;
  paidByPartnerId: string | null;
  paidBy: { id: string; name: string } | null;
}

export interface DateRange {
  from?: string;
  to?: string;
}

export interface PartnerSummary {
  id: string;
  name: string;
  isActive: boolean;
  contributions: number;
  expensesPaid: number;
  spent: number;
  withdrawals: number;
  percent: number;
  profitShare: number;
  cumulativeProfitShare: number;
  balance: number;
}

export interface AccountingSummary {
  range: { from: string | null; to: string | null };
  period: {
    orders: number;
    revenue: number;
    shippingCollected: number;
    discounts: number;
    cogs: number;
    linesWithoutCost: number;
    revenueWithoutCost: number;
    expenses: number;
    grossProfit: number;
    netProfit: number;
  };
  cumulativeNetProfit: number;
  margin: number | null;
  expensesByCategory: { category: string | null; amount: number }[];
  stock: { units: number; valueAtCost: number; productsWithoutCost: number };
  partners: PartnerSummary[];
  totals: { spent: number; withdrawals: number; balance: number };
}

export interface PartnerInput {
  name: string;
  phone?: string;
  notes?: string;
  isActive?: boolean;
}

export interface EntryInput {
  partnerId: string;
  kind: PartnerEntryKind;
  amount: number;
  date: string;
  note?: string;
}

export interface ExpenseInput {
  label: string;
  category?: string;
  amount: number;
  date: string;
  paidByPartnerId?: string;
}

export interface LedgerParams extends DateRange {
  page?: number;
  limit?: number;
  search?: string;
  partnerId?: string;
}

const clean = <T extends object>(params: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined),
  ) as Partial<T>;

export async function getSummary(range: DateRange) {
  return unwrap(
    await apiClient.get<ApiSuccess<AccountingSummary>>('/accounting/summary', {
      params: clean(range),
    }),
  );
}

export async function listPartners() {
  return unwrap(
    await apiClient.get<ApiSuccess<Partner[]>>('/accounting/partners'),
  );
}

export async function createPartner(input: PartnerInput) {
  return unwrap(
    await apiClient.post<ApiSuccess<Partner>>('/accounting/partners', input),
  );
}

export async function updatePartner(id: string, input: PartnerInput) {
  return unwrap(
    await apiClient.patch<ApiSuccess<Partner>>(
      `/accounting/partners/${id}`,
      input,
    ),
  );
}

export async function deletePartner(id: string) {
  await apiClient.delete(`/accounting/partners/${id}`);
}

export async function listEntries(params: LedgerParams) {
  return unwrap(
    await apiClient.get<ApiSuccess<Paginated<PartnerEntry>>>(
      '/accounting/entries',
      { params: clean(params) },
    ),
  );
}

export async function createEntry(input: EntryInput) {
  return unwrap(
    await apiClient.post<ApiSuccess<PartnerEntry>>(
      '/accounting/entries',
      input,
    ),
  );
}

export async function deleteEntry(id: string) {
  await apiClient.delete(`/accounting/entries/${id}`);
}

export async function listExpenses(params: LedgerParams) {
  return unwrap(
    await apiClient.get<ApiSuccess<Paginated<Expense>>>(
      '/accounting/expenses',
      { params: clean(params) },
    ),
  );
}

export async function createExpense(input: ExpenseInput) {
  return unwrap(
    await apiClient.post<ApiSuccess<Expense>>('/accounting/expenses', input),
  );
}

export async function deleteExpense(id: string) {
  await apiClient.delete(`/accounting/expenses/${id}`);
}
