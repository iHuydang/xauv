
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fredApi, ECONOMIC_INDICATORS, type FredObservation } from '@/lib/fred-api';

export function useFredIndicators() {
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([
    'FEDFUNDS',
    'DGS10',
    'UNRATE',
    'CPIAUCSL',
    'DTWEXBGS'
  ]);

  const { data: indicatorData, isLoading, error } = useQuery({
    queryKey: ['fred-indicators', selectedIndicators],
    queryFn: async () => {
      const results = await Promise.allSettled(
        selectedIndicators.map(async (seriesId) => {
          const [series, latestValue] = await Promise.all([
            fredApi.getSeries(seriesId),
            fredApi.getLatestValue(seriesId)
          ]);
          
          const indicator = Object.values(ECONOMIC_INDICATORS).find(ind => ind.id === seriesId);
          
          return {
            seriesId,
            series,
            latestValue,
            indicator
          };
        })
      );

      return results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(item => item.series && item.latestValue);
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
    enabled: selectedIndicators.length > 0
  });

  return {
    indicatorData: indicatorData || [],
    isLoading,
    error,
    selectedIndicators,
    setSelectedIndicators,
    availableIndicators: ECONOMIC_INDICATORS
  };
}

export function useFredSeries(seriesId: string, options: {
  limit?: number;
  startDate?: string;
  endDate?: string;
} = {}) {
  const { data: observations, isLoading, error } = useQuery({
    queryKey: ['fred-series', seriesId, options],
    queryFn: () => fredApi.getObservations(seriesId, {
      limit: options.limit || 100,
      startDate: options.startDate,
      endDate: options.endDate,
      sort: 'asc'
    }),
    enabled: !!seriesId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  return {
    observations: observations || [],
    isLoading,
    error
  };
}
