import { useState, useEffect, useCallback } from 'react';
import { useBrandContext } from '@/context/BrandContext';
import { useAuthContext } from '@/context/AuthContext';

interface AnalyticsData {
  overview: {
    totalMentions: number;
    positiveRatio: number;
    averageVisibility: number;
    responseAccuracy: number;
  };
  timeSeriesData: {
    date: string;
    mentions: number;
    sentiment: number;
    visibility: number;
  }[];
  topQueries: {
    query: string;
    count: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    aiProvider: string;
  }[];
  performanceMetrics: {
    brandsDetected: number;
    linksProvided: number;
    accurateResponses: number;
    responseTime: number;
  };
}

interface UseBrandAnalyticsReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBrandAnalytics(): UseBrandAnalyticsReturn {
  const { user } = useAuthContext();
  const { selectedBrand, selectedBrandId, loading: brandLoading } = useBrandContext();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!user?.uid || !selectedBrandId || brandLoading) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mock data specific to the selected brand
      const mockData: AnalyticsData = {
        overview: {
          totalMentions: Math.floor(Math.random() * 5000) + 1000,
          positiveRatio: Math.floor(Math.random() * 30) + 70,
          averageVisibility: Math.floor(Math.random() * 20) + 75,
          responseAccuracy: Math.floor(Math.random() * 15) + 85
        },
        timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          mentions: Math.floor(Math.random() * 50) + 10,
          sentiment: Math.random() * 2 + 7, // 7-9 range
          visibility: Math.floor(Math.random() * 30) + 70
        })),
        topQueries: [
          {
            query: `What is ${selectedBrand?.companyName || 'this company'}?`,
            count: 156,
            sentiment: 'positive',
            aiProvider: 'ChatGPT'
          },
          {
            query: `How does ${selectedBrand?.companyName || 'this service'} work?`,
            count: 134,
            sentiment: 'neutral',
            aiProvider: 'Claude'
          },
          {
            query: `${selectedBrand?.companyName || 'Company'} vs competitors`,
            count: 98,
            sentiment: 'positive',
            aiProvider: 'Gemini'
          }
        ],
        performanceMetrics: {
          brandsDetected: Math.floor(Math.random() * 50) + 200,
          linksProvided: Math.floor(Math.random() * 30) + 180,
          accurateResponses: Math.floor(Math.random() * 20) + 175,
          responseTime: Math.random() * 0.5 + 0.8
        }
      };

      setData(mockData);
    } catch (err) {
      console.error('Error fetching brand analytics:', err);
      setError('Failed to load analytics data. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, selectedBrandId, selectedBrand?.companyName, brandLoading]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics
  };
} 