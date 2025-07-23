'use client'
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBrandContext } from '@/context/BrandContext';
import { useBrandQueries } from '@/hooks/useBrandQueries';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/shared/Card';
import { extractChatGPTCitations } from '@/components/features/ChatGPTResponseRenderer';
import { extractGoogleAIOverviewCitations } from '@/components/features/GoogleAIOverviewRenderer';
import { extractPerplexityCitations } from '@/components/features/PerplexityResponseRenderer';
import WebLogo from '@/components/shared/WebLogo';
import { 
  Quote, 
  ExternalLink,
  Search, 
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Globe,
  BarChart3,
  Calendar,
  Clock,
  Eye,
  SortAsc,
  SortDesc,
  ArrowUpDown
} from 'lucide-react';
import CitationsTable from '@/components/features/CitationsTable';

// Citation interface
interface Citation {
  id: string;
  url: string;
  text: string;
  source: string;
  provider: 'chatgpt' | 'perplexity' | 'googleAI';
  query: string;
  queryId: string;
  brandName: string;
  domain?: string;
  timestamp: string;
  type?: string;
  isBrandMention?: boolean;
  isDomainCitation?: boolean;
}

// Sort options
type SortField = 'timestamp' | 'provider' | 'source' | 'domain' | 'query';
type SortDirection = 'asc' | 'desc';

// Helper function to extract search keywords from Google search URL
const extractSearchKeywords = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const q = urlObj.searchParams.get('q');
    return q || 'Google Search';
  } catch {
    return 'Google Search';
  }
};

// Helper function to check if search keywords mention the brand
const searchMentionsBrand = (keywords: string, brandName: string, brandDomain?: string): boolean => {
  const keywordsLower = keywords.toLowerCase();
  const brandLower = brandName.toLowerCase();
  
  // Check if keywords contain brand name
  if (keywordsLower.includes(brandLower)) return true;
  
  // Check if keywords contain brand domain (without TLD)
  if (brandDomain) {
    const domainWithoutTld = brandDomain.split('.')[0].toLowerCase();
    if (keywordsLower.includes(domainWithoutTld)) return true;
  }
  
  return false;
};

// Helper function to generate mock SEO data
const generateMockSEOData = (keywords: string) => {
  // Generate consistent mock data based on keywords hash
  const hash = keywords.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const difficulty = Math.abs(hash % 100) + 1; // 1-100
  const volume = Math.abs(hash % 50000) + 100; // 100-50,000
  
  return { difficulty, volume };
};

// Helper functions
const extractDomainFromUrl = (url: string): string | undefined => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    console.error('Invalid URL for domain extraction:', url, e);
    return undefined;
  }
};

const checkBrandMention = (text: string, url: string, brandName: string, brandDomain?: string): boolean => {
  const textLower = text.toLowerCase();
  const urlLower = url.toLowerCase();
  const brandLower = brandName.toLowerCase();

  if (textLower.includes(brandLower) || urlLower.includes(brandLower)) {
    return true;
  }

  if (brandDomain) {
    const domainWithoutTld = brandDomain.split('.')[0].toLowerCase();
    if (textLower.includes(domainWithoutTld) || urlLower.includes(domainWithoutTld)) {
      return true;
    }
  }
  return false;
};

const checkDomainCitation = (url: string, brandDomain?: string): boolean => {
  if (!brandDomain) return false;
  const citationDomain = extractDomainFromUrl(url);
  return citationDomain === brandDomain.replace(/^www\./, '');
};

export default function CitationsPage(): React.ReactElement {
  const { selectedBrand, brands, loading: brandLoading } = useBrandContext();
  const { queries, loading: queriesLoading, error: queriesError, refetch } = useBrandQueries({ 
    brandId: selectedBrand?.id 
  });
  
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showBrandMentionsOnly, setShowBrandMentionsOnly] = useState(false);

  // Extract all citations from queries
  const allCitations = useMemo(() => {
    if (!queries || !selectedBrand) return [];

    console.log('🔍 Citations page - processing queries:', {
      queriesCount: queries.length,
      selectedBrand: selectedBrand.companyName,
      firstQuery: queries[0] ? {
        query: queries[0].query,
        hasResults: !!queries[0].results,
        resultKeys: queries[0].results ? Object.keys(queries[0].results) : [],
        chatgptResponse: queries[0].results?.chatgpt?.response?.substring(0, 100) + '...',
        googleAIResponse: queries[0].results?.googleAI?.aiOverview?.substring(0, 100) + '...',
        perplexityRawResponse: queries[0].results?.perplexity?.response?.substring(0, 100) + '...'
      } : null
    });

    const citations: Citation[] = [];
    let citationId = 1;

    queries.forEach((query) => {
      const queryTimestamp = query.date || new Date().toISOString();
      
      // Extract ChatGPT citations
      if (query.results?.chatgpt?.response) {
        const chatgptCitations = extractChatGPTCitations(query.results.chatgpt.response);
        console.log('🔍 ChatGPT citations extracted:', chatgptCitations.length, 'for query:', query.query.substring(0, 50));
        chatgptCitations.forEach((citation) => {
          citations.push({
            id: `chatgpt-${citationId++}`,
            url: citation.url,
            text: citation.text,
            source: citation.source || 'ChatGPT',
            provider: 'chatgpt',
            query: query.query,
            queryId: query.id || '',
            brandName: selectedBrand.companyName,
            domain: extractDomainFromUrl(citation.url),
            timestamp: queryTimestamp,
            type: 'text_extraction',
            isBrandMention: checkBrandMention(citation.text, citation.url, selectedBrand.companyName, selectedBrand.domain),
            isDomainCitation: checkDomainCitation(citation.url, selectedBrand.domain)
          });
        });
      }

      // Extract Google AI citations
      if (query.results?.googleAI?.aiOverview) {
        const googleCitations = extractGoogleAIOverviewCitations(query.results.googleAI.aiOverview, query.results.googleAI);
        console.log('🔍 Google AI citations extracted:', googleCitations.length, 'for query:', query.query.substring(0, 50));
        googleCitations.forEach((citation) => {
          citations.push({
            id: `google-${citationId++}`,
            url: citation.url,
            text: citation.text,
            source: citation.source || 'Google AI Overview',
            provider: 'googleAI',
            query: query.query,
            queryId: query.id || '',
            brandName: selectedBrand.companyName,
            domain: extractDomainFromUrl(citation.url),
            timestamp: queryTimestamp,
            type: 'ai_overview',
            isBrandMention: checkBrandMention(citation.text, citation.url, selectedBrand.companyName, selectedBrand.domain),
            isDomainCitation: checkDomainCitation(citation.url, selectedBrand.domain)
          });
        });
      }

      // Extract Perplexity citations
      if (query.results?.perplexity?.response) {
        const perplexityCitations = extractPerplexityCitations(query.results.perplexity.response, query.results.perplexity);
        console.log('🔍 Perplexity citations extracted:', perplexityCitations.length, 'for query:', query.query.substring(0, 50));
        perplexityCitations.forEach((citation) => {
          citations.push({
            id: `perplexity-${citationId++}`,
            url: citation.url,
            text: citation.text,
            source: citation.source || 'Perplexity',
            provider: 'perplexity',
            query: query.query,
            queryId: query.id || '',
            brandName: selectedBrand.companyName,
            domain: extractDomainFromUrl(citation.url),
            timestamp: queryTimestamp,
            type: citation.type || 'structured',
            isBrandMention: checkBrandMention(citation.text, citation.url, selectedBrand.companyName, selectedBrand.domain),
            isDomainCitation: checkDomainCitation(citation.url, selectedBrand.domain)
          });
        });
      }
    });

    console.log('🔍 Total citations extracted:', citations.length);
    return citations;
  }, [queries, selectedBrand]);

  // Filter and sort citations
  const filteredAndSortedCitations = useMemo(() => {
    let filtered = allCitations;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(citation => 
        citation.text.toLowerCase().includes(term) ||
        citation.url.toLowerCase().includes(term) ||
        citation.query.toLowerCase().includes(term) ||
        citation.source.toLowerCase().includes(term) ||
        citation.domain?.toLowerCase().includes(term)
      );
    }

    // Apply provider filter
    if (selectedProvider !== 'all') {
      filtered = filtered.filter(citation => citation.provider === selectedProvider);
    }

    // Apply source filter
    if (selectedSource !== 'all') {
      filtered = filtered.filter(citation => citation.source === selectedSource);
    }

    // Apply brand mentions filter
    if (showBrandMentionsOnly) {
      filtered = filtered.filter(citation => citation.isBrandMention || citation.isDomainCitation);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'provider':
          comparison = a.provider.localeCompare(b.provider);
          break;
        case 'source':
          comparison = a.source.localeCompare(b.source);
          break;
        case 'domain':
          comparison = (a.domain || '').localeCompare(b.domain || '');
          break;
        case 'query':
          comparison = a.query.localeCompare(b.query);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allCitations, searchTerm, selectedProvider, selectedSource, showBrandMentionsOnly, sortField, sortDirection]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalCitations = allCitations.length;
    const brandMentions = allCitations.filter(c => c.isBrandMention).length;
    const domainCitations = allCitations.filter(c => c.isDomainCitation).length;
    const uniqueDomains = new Set(allCitations.map(c => c.domain).filter(Boolean)).size;
    
    const providerStats = {
      chatgpt: allCitations.filter(c => c.provider === 'chatgpt').length,
      perplexity: allCitations.filter(c => c.provider === 'perplexity').length,
      googleAI: allCitations.filter(c => c.provider === 'googleAI').length
    };

    const topDomains = Object.entries(
      allCitations.reduce((acc, citation) => {
        if (citation.domain) {
          acc[citation.domain] = (acc[citation.domain] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    )
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

    const topSources = Object.entries(
      allCitations.reduce((acc, citation) => {
        acc[citation.source] = (acc[citation.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

    return {
      totalCitations,
      brandMentions,
      domainCitations,
      uniqueDomains,
      providerStats,
      topDomains,
      topSources,
      brandMentionRate: totalCitations > 0 ? (brandMentions / totalCitations * 100) : 0,
      domainCitationRate: totalCitations > 0 ? (domainCitations / totalCitations * 100) : 0
    };
  }, [allCitations]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Export citations
  const handleExport = () => {
    const csvContent = [
      ['Query', 'Provider', 'Source', 'Citation Text', 'URL', 'Domain', 'Brand Mention', 'Domain Citation', 'Timestamp'].join(','),
      ...filteredAndSortedCitations.map(citation => [
        `"${citation.query.replace(/"/g, '""')}"`,
        citation.provider,
        `"${citation.source.replace(/"/g, '""')}"`,
        `"${citation.text.replace(/"/g, '""')}"`,
        citation.url,
        citation.domain || '',
        citation.isBrandMention ? 'Yes' : 'No',
        citation.isDomainCitation ? 'Yes' : 'No',
        citation.timestamp
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citations-${selectedBrand?.companyName || 'brand'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Show loading while brands are being fetched
  if (brandLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading brands...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show empty state if no brands
  if (brands.length === 0) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Quote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Brands Found</h3>
          <p className="text-muted-foreground mb-4">
            Add your first brand to start analyzing citations.
          </p>
          <Link href="/dashboard/add-brand/step-1" className="bg-[#000C60] text-white px-4 py-2 rounded-lg hover:bg-[#000C60]/90 transition-colors">
            Add Brand
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Show brand selection if no brand selected
  if (!selectedBrand) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Quote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Select a Brand</h3>
          <p className="text-muted-foreground mb-4">
            Choose a brand from the sidebar to view its citations data.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <WebLogo domain={selectedBrand.domain} size={40} />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Citations Analysis</h1>
              <p className="text-muted-foreground">for {selectedBrand.companyName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refetch}
              disabled={queriesLoading}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${queriesLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExport}
              disabled={filteredAndSortedCitations.length === 0}
              className="flex items-center space-x-2 bg-[#000C60] text-white px-4 py-2 rounded-lg hover:bg-[#000C60]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Quote className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Citations</p>
                <p className="text-2xl font-bold text-foreground">{analytics.totalCitations}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Brand Mentions</p>
                <p className="text-2xl font-bold text-foreground">{analytics.brandMentions}</p>
                <p className="text-xs text-green-600">{analytics.brandMentionRate.toFixed(1)}% of total</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Domain Citations</p>
                <p className="text-2xl font-bold text-foreground">{analytics.domainCitations}</p>
                <p className="text-xs text-purple-600">{analytics.domainCitationRate.toFixed(1)}% of total</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Domains</p>
                <p className="text-2xl font-bold text-foreground">{analytics.uniqueDomains}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Provider Statistics and Most Cited Domains */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Provider Distribution</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ChatGPT</span>
                <span className="font-medium">{analytics.providerStats.chatgpt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Perplexity</span>
                <span className="font-medium">{analytics.providerStats.perplexity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Google AI</span>
                <span className="font-medium">{analytics.providerStats.googleAI}</span>
              </div>
            </div>
          </Card>

          {/* Most Cited Domains - Full Width */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Most Cited Domains</h3>
              <Link href="/dashboard/citations/all-domains" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                View All <ExternalLink className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {analytics.topDomains.map(([domain, count], index) => (
                <div key={domain} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <WebLogo domain={`https://${domain}`} className="w-6 h-6" size={24} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-foreground">{domain}</span>
                        <a
                          href={`https://${domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {count} citation{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(count / analytics.topDomains[0][1]) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      
        {/* All Citations Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">All Citations</h3>
            <div className="text-sm text-muted-foreground">
              Total: {allCitations.length} citations
            </div>
          </div>
          <CitationsTable citations={allCitations} />
        </Card>
      </div>
    </DashboardLayout>
  );
} 