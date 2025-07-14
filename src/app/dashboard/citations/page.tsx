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
        perplexityResponse: queries[0].results?.perplexity?.response?.substring(0, 100) + '...'
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
      <DashboardLayout title="Citations">
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
      <DashboardLayout title="Citations">
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
      <DashboardLayout title="Citations">
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
    <DashboardLayout title="Citations">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Citations Analysis</h1>
            <p className="text-muted-foreground">
              Comprehensive view of all citations for {selectedBrand.companyName}
            </p>
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

        {/* Provider Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Domains</h3>
            <div className="space-y-2">
              {analytics.topDomains.slice(0, 5).map(([domain, count], index) => (
                <div key={domain} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <WebLogo domain={`https://${domain}`} size={16} />
                    <span className="text-sm text-muted-foreground truncate">{domain}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Sources</h3>
            <div className="space-y-2">
              {analytics.topSources.slice(0, 5).map(([source, count], index) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground truncate">{source}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Domain Analytics and Google Searches Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Domain Analytics Table - Matching the attached image format */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Most cited domains in AI answers</h3>
              <p className="text-sm text-muted-foreground mt-1">
                See which domains get cited most in AI answers, their authority scores, and how many individual pages get referenced.
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={filteredAndSortedCitations.length === 0}
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
          
          {queriesLoading ? (
            <div className="p-6">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading citations...</span>
              </div>
            </div>
          ) : queriesError ? (
            <div className="p-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>Error loading citations: {queriesError}</span>
              </div>
            </div>
          ) : filteredAndSortedCitations.length === 0 ? (
            <div className="p-6 text-center">
              <Quote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Citations Found</h3>
              <p className="text-muted-foreground">
                {allCitations.length === 0 
                  ? 'Process some queries first to generate citations data.'
                  : 'No citations match your current filters. Try adjusting your search criteria.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <div className="flex items-center space-x-1">
                         <span>Cited Domain</span>
                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                       </div>
                     </th>
                                         {/* DR Column - Commented out until we integrate real SEO API data
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <div className="flex items-center space-x-1">
                         <span>DR</span>
                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                       </div>
                     </th>
                     */}
                                         <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <div className="flex items-center justify-center space-x-1">
                         <span>Source type</span>
                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                       </div>
                     </th>
                     <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <div className="flex items-center justify-center space-x-1">
                         <span>Answer Distribution</span>
                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                       </div>
                     </th>

                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // Group citations by domain and calculate stats
                    const domainStats = new Map();
                    
                    allCitations.forEach(citation => {
                      if (!citation.domain || citation.domain === 'google.com') return; // Exclude google.com
                      
                      if (!domainStats.has(citation.domain)) {
                        domainStats.set(citation.domain, {
                          domain: citation.domain,
                          citations: [],
                          queries: new Set(),
                          uniquePages: new Set(),
                          isBrandDomain: citation.isDomainCitation,
                          isCompetitor: false // You can enhance this logic
                        });
                      }
                      
                      const stats = domainStats.get(citation.domain);
                      stats.citations.push(citation);
                      stats.queries.add(citation.queryId);
                      stats.uniquePages.add(citation.url);
                    });
                    
                    // Convert to array and sort by number of answers
                    const sortedDomains = Array.from(domainStats.values())
                      .sort((a, b) => b.queries.size - a.queries.size);
                    
                    // Show only top 10 for the overview
                    const topDomains = sortedDomains.slice(0, 10);
                    const hasMoreDomains = sortedDomains.length > 10;
                    
                    const domainData = { topDomains, hasMoreDomains, totalDomains: sortedDomains.length };
                    
                    return (
                      <>
                        {domainData.topDomains.map((domainStat, index) => {
                                             // TODO: Integrate real DR (Domain Rating) from SEO APIs like Ahrefs, SEMrush, or Moz
                       // const getDomainRating = (domain: string) => {
                       //   // Real implementation would call SEO API here
                       //   return seoApi.getDomainRating(domain);
                       // };
                      
                      const getSourceType = (domain: string, isBrandDomain: boolean, isCompetitor: boolean) => {
                        if (isBrandDomain) return 'Own Brand';
                        if (isCompetitor) return 'Competitor';
                        
                        // Common third-party domains
                        if (domain.includes('wikipedia')) return 'Third party';
                        if (domain.includes('reddit')) return 'Third party';
                        if (domain.includes('stackoverflow')) return 'Third party';
                        if (domain.includes('github')) return 'Third party';
                        if (domain.includes('medium')) return 'Third party';
                        if (domain.includes('forbes')) return 'Third party';
                        if (domain.includes('techcrunch')) return 'Third party';
                        
                        return 'Third party';
                      };
                      
                                             // const dr = getDomainRating(domainStat.domain); // TODO: Uncomment when SEO API is integrated
                       const sourceType = getSourceType(domainStat.domain, domainStat.isBrandDomain, domainStat.isCompetitor);
                      
                      return (
                                                 <tr key={domainStat.domain} className="hover:bg-gray-50">
                           <td className="px-6 py-4">
                             <div className="flex items-center space-x-3">
                               <WebLogo domain={`https://${domainStat.domain}`} size={20} />
                               <div className="flex-1">
                                 <div className="flex items-center space-x-2">
                                   <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                     {domainStat.domain}
                                   </div>
                                   <a
                                     href={`https://${domainStat.domain}`}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="text-gray-400 hover:text-gray-600 transition-colors"
                                     title={`Visit ${domainStat.domain}`}
                                   >
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                     </svg>
                                   </a>
                                 </div>
                                 <div className="text-xs text-gray-500 mt-1">
                                   {domainStat.uniquePages.size} page{domainStat.uniquePages.size !== 1 ? 's' : ''}
                                 </div>
                               </div>
                             </div>
                           </td>
                                                     {/* DR Cell - Commented out until we integrate real SEO API data
                           <td className="px-6 py-4">
                             <div className="flex items-center space-x-2">
                               <div className={`w-2 h-2 rounded-full ${
                                 dr >= 80 ? 'bg-green-500' : 
                                 dr >= 60 ? 'bg-yellow-500' : 
                                 dr >= 40 ? 'bg-orange-500' : 'bg-red-500'
                               }`}></div>
                               <span className="text-sm font-medium text-gray-900">{dr}</span>
                             </div>
                           </td>
                           */}
                                                     <td className="px-6 py-4 text-center">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                               sourceType === 'Own Brand' ? 'bg-blue-100 text-blue-800' :
                               sourceType === 'Competitor' ? 'bg-red-100 text-red-800' :
                               'bg-gray-100 text-gray-800'
                             }`}>
                               {sourceType}
                             </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                             <div className="flex items-center justify-center">
                               <div className="flex items-center space-x-3">
                                 {domainStat.queries.size > 1 && (
                                   <span className="text-lg font-bold text-gray-900">{domainStat.queries.size}</span>
                                 )}
                               </div>
                               <div className="flex items-center space-x-2">
                                {(() => {
                                  // Get unique providers for this domain
                                  const providers = [...new Set(domainStat.citations.map(c => c.provider))];
                                  const providerCounts = domainStat.citations.reduce((acc, citation) => {
                                    acc[citation.provider] = (acc[citation.provider] || 0) + 1;
                                    return acc;
                                  }, {} as Record<string, number>);
                                  
                                  return providers.map(provider => {
                                    const count = providerCounts[provider];
                                    return (
                                      <div key={provider} className="flex items-center space-x-1" title={`${provider}: ${count} citation${count > 1 ? 's' : ''}`}>
                                        {provider === 'chatgpt' && (
                                          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" role="img" viewBox="0 0 24 24" className="w-4 h-4 text-green-600" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"></path>
                                          </svg>
                                        )}
                                        {provider === 'perplexity' && (
                                          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" role="img" viewBox="0 0 24 24" className="w-4 h-4 text-purple-600" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z"></path>
                                          </svg>
                                        )}
                                        {provider === 'googleAI' && (
                                          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1" x="0px" y="0px" viewBox="0 0 48 48" enableBackground="new 0 0 48 48" className="w-4 h-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
	C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                          </svg>
                                        )}
                                        {count > 1 && (
                                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                            {count}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                        {(() => {
                          // Get domain data for View All button
                          const domainStats = new Map();
                          allCitations.forEach(citation => {
                            if (!citation.domain || citation.domain === 'google.com') return;
                            if (!domainStats.has(citation.domain)) {
                              domainStats.set(citation.domain, { domain: citation.domain });
                            }
                          });
                          const totalDomains = domainStats.size;
                          const hasMoreDomains = totalDomains > 10;
                          
                          return hasMoreDomains ? (
                            <tr>
                              <td colSpan={3} className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                                <Link 
                                  href="/dashboard/citations/all-domains"
                                  className="flex items-center justify-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <span>View All Domains ({totalDomains})</span>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </td>
                            </tr>
                          ) : null;
                        })()}
                      </>
                    );
                  })()}
                </tbody>
              </table>
             </div>
           )}
         </Card>

         {/* Google Searches Table */}
         <Card className="overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
             <div>
               <h3 className="text-lg font-semibold text-foreground">Most Cited Google Searches</h3>
               <p className="text-sm text-muted-foreground mt-1">
                 SERP pages that appear most frequently in AI answers. SEO optimization can influence these results.
               </p>
             </div>
             <button
               onClick={handleExport}
               className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
             >
               <Download className="h-4 w-4" />
             </button>
           </div>
           
           {queriesLoading ? (
             <div className="p-6">
               <div className="flex items-center space-x-2 text-muted-foreground">
                 <RefreshCw className="h-4 w-4 animate-spin" />
                 <span>Loading citations...</span>
               </div>
             </div>
           ) : queriesError ? (
             <div className="p-6">
               <div className="flex items-center space-x-2 text-red-600">
                 <AlertCircle className="h-4 w-4" />
                 <span>Error loading citations: {queriesError}</span>
               </div>
             </div>
           ) : (() => {
             // Get Google search citations
             const googleSearches = allCitations.filter(citation => 
               citation.domain === 'google.com' || citation.url.includes('google.com/search')
             );
             
             if (googleSearches.length === 0) {
               return (
                 <div className="p-6 text-center">
                   <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                   <h3 className="text-lg font-semibold text-foreground mb-2">No Google Searches Found</h3>
                   <p className="text-muted-foreground">
                     No Google search results were cited in the AI responses.
                   </p>
                 </div>
               );
             }

             // Group by search query/URL
             const searchStats = new Map();
             googleSearches.forEach(citation => {
               const key = citation.text || citation.url;
               if (!searchStats.has(key)) {
                 searchStats.set(key, {
                   searchText: citation.text,
                   url: citation.url,
                   citations: [],
                   queries: new Set(),
                   providers: new Set()
                 });
               }
               
               const stats = searchStats.get(key);
               stats.citations.push(citation);
               stats.queries.add(citation.queryId);
               stats.providers.add(citation.provider);
             });

             const sortedSearches = Array.from(searchStats.values())
               .sort((a, b) => b.queries.size - a.queries.size)
               .slice(0, 10); // Show top 10

             return (
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         <div className="flex items-center space-x-1">
                           <span>Search Query</span>
                           <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                           </svg>
                         </div>
                       </th>
                       <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                         <div className="flex items-center justify-center space-x-1">
                           <span>Answer Distribution</span>
                         </div>
                       </th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                     {sortedSearches.map((searchStat, index) => (
                       <tr key={index} className="hover:bg-gray-50">
                         <td className="px-6 py-4">
                           <div className="flex items-center space-x-3">
                             <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                             </svg>
                             <div className="flex-1">
                               <div className="flex items-center space-x-2">
                                 <div className="text-sm font-medium text-gray-900 truncate max-w-md" title={searchStat.searchText}>
                                   {searchStat.searchText || 'Google Search'}
                                 </div>
                                 <a
                                   href={searchStat.url}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="text-gray-400 hover:text-gray-600 transition-colors"
                                   title="View search results"
                                 >
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                   </svg>
                                 </a>
                               </div>
                               <div className="text-xs text-gray-500 mt-1">
                                 SERP Page
                               </div>
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-center">
                           <div className="flex items-center justify-center">
                             <div className="flex items-center space-x-3">
                               {searchStat.queries.size > 1 && (
                                 <span className="text-lg font-bold text-gray-900">{searchStat.queries.size}</span>
                               )}
                             </div>
                             <div className="flex items-center space-x-2 ml-4">
                               {Array.from(searchStat.providers).map(provider => (
                                 <div key={provider} className="flex items-center space-x-1" title={`${provider} citation`}>
                                   {provider === 'chatgpt' && (
                                     <svg stroke="currentColor" fill="currentColor" strokeWidth="0" role="img" viewBox="0 0 24 24" className="w-4 h-4 text-green-600" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                       <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"></path>
                                     </svg>
                                   )}
                                   {provider === 'perplexity' && (
                                     <svg stroke="currentColor" fill="currentColor" strokeWidth="0" role="img" viewBox="0 0 24 24" className="w-4 h-4 text-purple-600" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                       <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z"></path>
                                     </svg>
                                   )}
                                   {provider === 'googleAI' && (
                                     <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1" x="0px" y="0px" viewBox="0 0 48 48" enableBackground="new 0 0 48 48" className="w-4 h-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                       <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                       <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
	C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                                       <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                                       <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                     </svg>
                                   )}
                                 </div>
                               ))}
                             </div>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 
                 {(() => {
                   // Check if there are more than 10 Google searches
                   const allGoogleSearches = allCitations.filter(citation => 
                     citation.domain === 'google.com' || citation.url.includes('google.com/search')
                   );
                   const searchStats = new Map();
                   allGoogleSearches.forEach(citation => {
                     const key = citation.text || citation.url;
                     if (!searchStats.has(key)) {
                       searchStats.set(key, { count: 0 });
                     }
                   });
                   const totalSearches = searchStats.size;
                   const hasMoreSearches = totalSearches > 10;
                   
                   return hasMoreSearches ? (
                     <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                       <Link 
                         href="/dashboard/citations/all-searches"
                         className="flex items-center justify-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                       >
                         <span>View All Searches ({totalSearches})</span>
                         <ExternalLink className="h-4 w-4" />
                       </Link>
                                           </div>
                    ) : null;
                  })()}
               </div>
             );
           })()}
         </Card>
        </div>

                 {/* Filters and Search for Detailed Citations */}
         <Card className="p-6">
           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
             <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <input
                   type="text"
                   placeholder="Search citations..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000C60] focus:border-transparent"
                 />
               </div>

               <select
                 value={selectedProvider}
                 onChange={(e) => setSelectedProvider(e.target.value)}
                 className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000C60] focus:border-transparent"
               >
                 <option value="all">All Providers</option>
                 <option value="chatgpt">ChatGPT</option>
                 <option value="perplexity">Perplexity</option>
                 <option value="googleAI">Google AI</option>
               </select>

               <select
                 value={selectedSource}
                 onChange={(e) => setSelectedSource(e.target.value)}
                 className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000C60] focus:border-transparent"
               >
                 <option value="all">All Sources</option>
                 {Array.from(new Set(allCitations.map(c => c.source))).map(source => (
                   <option key={source} value={source}>{source}</option>
                 ))}
               </select>
             </div>

             <div className="flex items-center space-x-4">
               <label className="flex items-center space-x-2">
                 <input
                   type="checkbox"
                   checked={showBrandMentionsOnly}
                   onChange={(e) => setShowBrandMentionsOnly(e.target.checked)}
                   className="rounded border-gray-300 text-[#000C60] focus:ring-[#000C60]"
                 />
                 <span className="text-sm text-muted-foreground">Brand mentions only</span>
               </label>
               <span className="text-sm text-muted-foreground">
                 {filteredAndSortedCitations.length} of {allCitations.length} citations
               </span>
             </div>
           </div>
         </Card>

         {/* Detailed Citations Table */}
         {queriesLoading ? (
          <Card className="p-6">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading citations...</span>
            </div>
          </Card>
        ) : queriesError ? (
          <Card className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Error loading citations: {queriesError}</span>
            </div>
          </Card>
        ) : filteredAndSortedCitations.length === 0 ? (
          <Card className="p-6 text-center">
            <Quote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Citations Found</h3>
            <p className="text-muted-foreground">
              {allCitations.length === 0 
                ? 'Process some queries first to generate citations data.'
                : 'No citations match your current filters. Try adjusting your search criteria.'
              }
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-foreground">Detailed Citations</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Individual citations from all AI responses for detailed analysis.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('query')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Query</span>
                        {sortField === 'query' && (
                          sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('provider')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Provider</span>
                        {sortField === 'provider' && (
                          sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Citation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('domain')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Domain</span>
                        {sortField === 'domain' && (
                          sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand Impact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('timestamp')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Date</span>
                        {sortField === 'timestamp' && (
                          sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedCitations.map((citation) => (
                    <tr key={citation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm font-medium text-gray-900 truncate" title={citation.query}>
                            {citation.query}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          citation.provider === 'chatgpt' 
                            ? 'bg-green-100 text-green-800'
                            : citation.provider === 'perplexity'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {citation.provider === 'chatgpt' ? 'ChatGPT' : 
                           citation.provider === 'perplexity' ? 'Perplexity' : 'Google AI'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <p className="text-sm text-gray-900 truncate" title={citation.text}>
                            {citation.text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{citation.source}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {citation.domain && (
                          <div className="flex items-center space-x-2">
                            <WebLogo domain={`https://${citation.domain}`} size={16} />
                            <span className="text-sm text-gray-900">{citation.domain}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          {citation.isBrandMention && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Brand Mention
                            </span>
                          )}
                          {citation.isDomainCitation && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Domain Citation
                            </span>
                          )}
                          {!citation.isBrandMention && !citation.isDomainCitation && (
                            <span className="text-xs text-gray-500">No brand impact</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {new Date(citation.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#000C60] hover:text-[#000C60]/80 transition-colors"
                            title="Visit URL"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <Link
                            href={`/dashboard/queries?highlight=${citation.queryId}`}
                            className="text-gray-600 hover:text-gray-800 transition-colors"
                            title="View Query"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

// Helper functions
function extractDomainFromUrl(url: string): string | undefined {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return undefined;
  }
}

function checkBrandMention(text: string, url: string, brandName: string, brandDomain?: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerUrl = url.toLowerCase();
  const lowerBrandName = brandName.toLowerCase();
  
  // Check if brand name is mentioned in text or URL
  if (lowerText.includes(lowerBrandName) || lowerUrl.includes(lowerBrandName)) {
    return true;
  }
  
  // Check for brand domain variations
  if (brandDomain) {
    const cleanDomain = brandDomain.replace(/^https?:\/\/(www\.)?/, '').toLowerCase();
    if (lowerText.includes(cleanDomain) || lowerUrl.includes(cleanDomain)) {
      return true;
    }
  }
  
  return false;
}

function checkDomainCitation(url: string, brandDomain?: string): boolean {
  if (!brandDomain) return false;
  
  try {
    const urlObj = new URL(url);
    const cleanBrandDomain = brandDomain.replace(/^https?:\/\/(www\.)?/, '').toLowerCase();
    const urlDomain = urlObj.hostname.replace('www.', '').toLowerCase();
    
    return urlDomain === cleanBrandDomain;
  } catch {
    return false;
  }
} 