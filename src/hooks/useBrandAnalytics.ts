'use client'
import { useState, useEffect } from 'react';
import { 
  getLatestBrandAnalytics, 
  getBrandAnalyticsHistory, 
  getUserBrandAnalytics,
  calculateLifetimeBrandAnalytics,
  type BrandAnalyticsData, 
  type BrandAnalyticsHistory,
  type LifetimeBrandAnalytics
} from '@/firebase/firestore/brandAnalytics';

// Hook for getting latest brand analytics (session-based)
export function useLatestBrandAnalytics(brandId: string | undefined) {
  const [analytics, setAnalytics] = useState<BrandAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!brandId) {
        setAnalytics(null);
      setLoading(false);
      return;
    }

      try {
    setLoading(true);
    setError(null);

        const { result, error: fetchError } = await getLatestBrandAnalytics(brandId);
        
        if (fetchError) {
          setError('Failed to fetch analytics');
          console.error('Analytics fetch error:', fetchError);
        } else {
          setAnalytics(result || null);
        }
    } catch (err) {
        setError('Failed to fetch analytics');
        console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
    }

    fetchAnalytics();
  }, [brandId]);

  return { analytics, loading, error };
}

// Hook for getting lifetime brand analytics (all historical data)
export function useLifetimeBrandAnalytics(brandId: string | undefined) {
  const [lifetimeAnalytics, setLifetimeAnalytics] = useState<LifetimeBrandAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLifetimeAnalytics() {
      if (!brandId) {
        setLifetimeAnalytics(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { result, error: fetchError } = await calculateLifetimeBrandAnalytics(brandId);
        
        if (fetchError) {
          setError('Failed to calculate lifetime analytics');
          console.error('Lifetime analytics error:', fetchError);
        } else {
          setLifetimeAnalytics(result || null);
        }
      } catch (err) {
        setError('Failed to calculate lifetime analytics');
        console.error('Lifetime analytics error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLifetimeAnalytics();
  }, [brandId]);

  return { lifetimeAnalytics, loading, error };
}

// Combined hook for getting both latest and lifetime analytics
export function useBrandAnalyticsCombined(brandId: string | undefined) {
  const { analytics: latestAnalytics, loading: latestLoading, error: latestError } = useLatestBrandAnalytics(brandId);
  const { lifetimeAnalytics, loading: lifetimeLoading, error: lifetimeError } = useLifetimeBrandAnalytics(brandId);

  const loading = latestLoading || lifetimeLoading;
  const error = latestError || lifetimeError;

  return {
    latestAnalytics,
    lifetimeAnalytics,
    loading,
    error,
    hasLatestData: !!latestAnalytics,
    hasLifetimeData: !!lifetimeAnalytics
  };
}

// Hook for getting brand analytics history with trend analysis
export function useBrandAnalyticsHistory(brandId: string | undefined) {
  const [history, setHistory] = useState<BrandAnalyticsHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!brandId) {
        setHistory(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { result, error: fetchError } = await getBrandAnalyticsHistory(brandId);
        
        if (fetchError) {
          setError('Failed to fetch analytics history');
          console.error('Analytics history error:', fetchError);
        } else {
          setHistory(result || null);
        }
      } catch (err) {
        setError('Failed to fetch analytics history');
        console.error('Analytics history error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [brandId]);

  return { history, loading, error };
}

// Hook for getting all user brand analytics
export function useUserBrandAnalytics(userId: string | undefined) {
  const [userAnalytics, setUserAnalytics] = useState<BrandAnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserAnalytics() {
      if (!userId) {
        setUserAnalytics([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { result, error: fetchError } = await getUserBrandAnalytics(userId);
        
        if (fetchError) {
          setError('Failed to fetch user analytics');
          console.error('User analytics error:', fetchError);
        } else {
          setUserAnalytics(result || []);
        }
      } catch (err) {
        setError('Failed to fetch user analytics');
        console.error('User analytics error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAnalytics();
  }, [userId]);

  return { userAnalytics, loading, error };
}

// Hook for aggregated user analytics summary
export function useUserAnalyticsSummary(userId: string | undefined) {
  const { userAnalytics, loading, error } = useUserBrandAnalytics(userId);

  const summary = {
    totalBrands: userAnalytics.length,
    totalBrandMentions: userAnalytics.reduce((sum, analytics) => sum + analytics.totalBrandMentions, 0),
    totalCitations: userAnalytics.reduce((sum, analytics) => sum + analytics.totalCitations, 0),
    averageVisibilityScore: userAnalytics.length > 0 
      ? userAnalytics.reduce((sum, analytics) => sum + analytics.brandVisibilityScore, 0) / userAnalytics.length
      : 0,
    topPerformingBrand: userAnalytics.length > 0
      ? userAnalytics.reduce((prev, current) => 
          prev.totalBrandMentions > current.totalBrandMentions ? prev : current
        ).brandName
      : null
  };

  return { summary, loading, error };
} 