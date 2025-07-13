import { useState, useEffect, useCallback } from 'react';
import { useBrandContext } from '@/context/BrandContext';
import { useAuthContext } from '@/context/AuthContext';

interface CompetitorData {
  id: string;
  name: string;
  domain: string;
  mentions: number;
  visibility: number;
  sentimentScore: number;
  marketShare: number;
  trends: {
    mentions: number;
    visibility: number;
    sentiment: number;
  };
  lastUpdated: string;
}

interface UseCompetitorsReturn {
  competitors: CompetitorData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCompetitors(): UseCompetitorsReturn {
  const { user } = useAuthContext();
  const { selectedBrandId, loading: brandLoading } = useBrandContext();
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompetitors = useCallback(async () => {
    if (!user?.uid || !selectedBrandId || brandLoading) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mock data for now - replace with actual Firestore query
      const mockCompetitors: CompetitorData[] = [
        {
          id: '1',
          name: 'Competitor A',
          domain: 'competitor-a.com',
          mentions: 1250,
          visibility: 85,
          sentimentScore: 7.8,
          marketShare: 15.2,
          trends: { mentions: 12, visibility: 5, sentiment: 0.3 },
          lastUpdated: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Competitor B',
          domain: 'competitor-b.com',
          mentions: 980,
          visibility: 72,
          sentimentScore: 6.9,
          marketShare: 11.8,
          trends: { mentions: -5, visibility: -2, sentiment: -0.1 },
          lastUpdated: new Date().toISOString()
        }
      ];

      setCompetitors(mockCompetitors);
    } catch (err) {
      console.error('Error fetching competitors:', err);
      setError('Failed to load competitor data. Please try again.');
      setCompetitors([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, selectedBrandId, brandLoading]);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  return {
    competitors,
    loading,
    error,
    refetch: fetchCompetitors
  };
} 