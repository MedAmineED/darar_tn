import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, type DashboardRange } from '@/lib/api/dashboard';

export function useDashboardStats(range: DashboardRange) {
  return useQuery({
    queryKey: ['dashboard', 'stats', range],
    queryFn: () => getDashboardStats(range),
    staleTime: 30_000,
  });
}
