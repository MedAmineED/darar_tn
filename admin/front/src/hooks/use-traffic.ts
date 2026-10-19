import { useQuery } from '@tanstack/react-query';
import {
  getTrafficSessions,
  getTrafficStats,
  type Granularity,
  type SessionParams,
} from '@/lib/api/traffic';
import type { DashboardRange } from '@/lib/api/dashboard';

export function useTrafficStats(
  range: DashboardRange & { granularity: Granularity },
) {
  return useQuery({
    queryKey: ['traffic', range],
    queryFn: () => getTrafficStats(range),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useTrafficSessions(params: SessionParams) {
  return useQuery({
    queryKey: ['traffic', 'sessions', params],
    queryFn: () => getTrafficSessions(params),
    staleTime: 15_000,
  });
}
