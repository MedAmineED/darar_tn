import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEntry,
  createExpense,
  createPartner,
  deleteEntry,
  deleteExpense,
  deletePartner,
  getSummary,
  listEntries,
  listExpenses,
  listPartners,
  updatePartner,
  type DateRange,
  type EntryInput,
  type ExpenseInput,
  type LedgerParams,
  type PartnerInput,
} from '@/lib/api/accounting';

const KEY = 'accounting';

export function useAccountingSummary(range: DateRange) {
  return useQuery({
    queryKey: [KEY, 'summary', range],
    queryFn: () => getSummary(range),
  });
}

export function usePartners() {
  return useQuery({ queryKey: [KEY, 'partners'], queryFn: listPartners });
}

export function useEntries(params: LedgerParams) {
  return useQuery({
    queryKey: [KEY, 'entries', params],
    queryFn: () => listEntries(params),
  });
}

export function useExpenses(params: LedgerParams) {
  return useQuery({
    queryKey: [KEY, 'expenses', params],
    queryFn: () => listExpenses(params),
  });
}

function useAccountingMutation<T>(fn: (input: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export const useSavePartner = () =>
  useAccountingMutation(
    ({ id, input }: { id?: string; input: PartnerInput }) =>
      id ? updatePartner(id, input) : createPartner(input),
  );
export const useDeletePartner = () => useAccountingMutation(deletePartner);
export const useCreateEntry = () =>
  useAccountingMutation((input: EntryInput) => createEntry(input));
export const useDeleteEntry = () => useAccountingMutation(deleteEntry);
export const useCreateExpense = () =>
  useAccountingMutation((input: ExpenseInput) => createExpense(input));
export const useDeleteExpense = () => useAccountingMutation(deleteExpense);
