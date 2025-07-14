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
  ArrowLeft,
  ExternalLink, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  AlertCircle
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

export default function AllDomainsPage(): React.ReactElement {
  const { selectedBrand } = useBrandContext();
  const { 
    queries, 
    loading: queriesLoading, 
    error: queriesError 
  } = useBrandQueries({ brandId: selectedBrand?.id });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedSource, setSelectedSource] = useState('');

  // Helper functions
  const getSourceType = (domain: string, isBrandDomain: boolean, isCompetitor: boolean) => {
    if (isBrandDomain) return 'Own Brand';
    if (isCompetitor) return 'Competitor';
    
    // Common third-party domains
    if (domain.includes('wikipedia')) return 'Third Party';
    if (domain.includes('reddit')) return 'Third Party';
    if (domain.includes('stackoverflow')) return 'Third Party';
    if (domain.includes('github')) return 'Third Party';
    if (domain.includes('medium')) return 'Third Party';
    if (domain.includes('forbes')) return 'Third Party';
    if (domain.includes('techcrunch')) return 'Third Party';
    
    return 'Third Party';
  };

  // Extract all citations from queries
  const allCitations = useMemo(() => {
    if (!queries || !Array.isArray(queries)) return [];

    const citations: Citation[] = [];
    
    queries.forEach((query: any) => {
      if (!query.results) return;
      
      // Extract citations from each provider
      ['chatgpt', 'perplexity', 'googleAI'].forEach(provider => {
        const result = query.results[provider];
        if (!result) return;

        let providerCitations: { url: string; text: string; source?: string }[] = [];
        
        switch (provider) {
          case 'chatgpt':
            providerCitations = extractChatGPTCitations(result.response || '');
            break;
          case 'perplexity':
            providerCitations = extractPerplexityCitations(result.response || '');
            break;
          case 'googleAI':
            providerCitations = extractGoogleAIOverviewCitations(result.response || '', result);
            break;
        }

        providerCitations.forEach((citation, index) => {
          const domain = extractDomainFromUrl(citation.url);
          if (!domain) return;

          citations.push({
            id: `${query.id}-${provider}-${index}`,
            url: citation.url,
            text: citation.text,
            source: citation.source || provider,
            provider: provider as 'chatgpt' | 'perplexity' | 'googleAI',
            query: query.query,
            queryId: query.id,
            brandName: selectedBrand?.name || '',
            domain,
            timestamp: query.timestamp || new Date().toISOString(),
            isBrandMention: checkBrandMention(citation.text, citation.url, selectedBrand?.name || '', selectedBrand?.domain),
            isDomainCitation: checkDomainCitation(citation.url, selectedBrand?.domain)
          });
        });
      });
    });

    return citations;
  }, [queries, selectedBrand]);

  // Filter citations
  const filteredCitations = useMemo(() => {
    return allCitations.filter(citation => {
      // Exclude Google search results for domain analysis
      if (citation.domain === 'google.com') return false;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!citation.domain?.toLowerCase().includes(searchLower) &&
            !citation.text.toLowerCase().includes(searchLower) &&
            !citation.query.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Provider filter
      if (selectedProvider && citation.provider !== selectedProvider) {
        return false;
      }

      // Source filter
      if (selectedSource) {
        const sourceType = getSourceType(citation.domain || '', citation.isDomainCitation || false, false);
        if (selectedSource === 'own' && sourceType !== 'Own Brand') return false;
        if (selectedSource === 'competitor' && sourceType !== 'Competitor') return false;
        if (selectedSource === 'third-party' && sourceType !== 'Third Party') return false;
      }

      return true;
    });
  }, [allCitations, searchTerm, selectedProvider, selectedSource]);

  // Group citations by domain and calculate stats
  const domainStats = useMemo(() => {
    const stats = new Map();
    
    filteredCitations.forEach(citation => {
      if (!stats.has(citation.domain)) {
        stats.set(citation.domain, {
          domain: citation.domain,
          citations: [],
          queries: new Set(),
          uniquePages: new Set(),
          isBrandDomain: citation.isDomainCitation,
          isCompetitor: false // You can enhance this logic
        });
      }
      
      const domainStat = stats.get(citation.domain);
      domainStat.citations.push(citation);
      domainStat.queries.add(citation.queryId);
      domainStat.uniquePages.add(citation.url);
    });
    
    // Convert to array and sort by number of answers
    return Array.from(stats.values())
      .sort((a, b) => b.queries.size - a.queries.size);
  }, [filteredCitations]);

  const getProviderStats = (citations: Citation[]) => {
    return citations.reduce((acc, citation) => {
      acc[citation.provider] = (acc[citation.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const handleExport = () => {
    const csvContent = [
      ['Domain', 'Source Type', 'Total Citations', 'Unique Pages', 'Providers'].join(','),
      ...domainStats.map(stat => [
        stat.domain,
        getSourceType(stat.domain, stat.isBrandDomain, stat.isCompetitor),
        stat.citations.length,
        stat.uniquePages.size,
        [...new Set(stat.citations.map(c => c.provider))].join(';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-domains-citations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLayout>
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard/citations"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Citations</span>
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Cited Domains</h1>
            <p className="mt-2 text-gray-600">
              Complete list of all domains referenced in AI answers across all providers.
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search domains by name, query, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Providers</option>
                  <option value="chatgpt">ChatGPT</option>
                  <option value="perplexity">Perplexity</option>
                  <option value="googleAI">Google AI</option>
                </select>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Sources</option>
                  <option value="own">Own Brand</option>
                  <option value="competitor">Competitor</option>
                  <option value="third-party">Third Party</option>
                </select>
                <button
                  onClick={handleExport}
                  disabled={domainStats.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Showing {domainStats.length} domains from {filteredCitations.length} citations
            </div>
          </div>

          {/* All Domains Table */}
          {queriesLoading ? (
            <Card className="p-6">
              <div className="flex items-center space-x-2 text-gray-600">
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
          ) : domainStats.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Domains Found</h3>
              <p className="text-gray-600">
                {allCitations.length === 0 
                  ? 'Process some queries first to generate citations data.'
                  : 'No domains match your current filters. Try adjusting your search criteria.'
                }
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">All Cited Domains ({domainStats.length})</h2>
                <p className="text-sm text-gray-600">Complete list of domains referenced in AI answers</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cited Domain
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source Type
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Answer Distribution
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {domainStats.map((domainStat, index) => {
                      const sourceType = getSourceType(domainStat.domain, domainStat.isBrandDomain, domainStat.isCompetitor);
                      const providerStats = getProviderStats(domainStat.citations);
                      
                      return (
                        <tr key={domainStat.domain} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <WebLogo domain={`https://${domainStat.domain}`} className="w-6 h-6" size={24} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900 truncate">
                                    {domainStat.domain}
                                  </span>
                                  <a
                                    href={`https://${domainStat.domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title={`Visit ${domainStat.domain}`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {domainStat.uniquePages.size} page{domainStat.uniquePages.size !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          </td>
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
                            <div className="flex items-center justify-center space-x-3">
                              {domainStat.queries.size > 1 && (
                                <span className="text-2xl font-bold text-gray-900">
                                  {domainStat.queries.size}
                                </span>
                              )}
                              <div className="flex items-center space-x-1">
                                {providerStats.chatgpt > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="#10A37F"/>
                                    </svg>
                                    {providerStats.chatgpt > 1 && (
                                      <span className="text-xs font-medium text-gray-600">
                                        {providerStats.chatgpt}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {providerStats.perplexity > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                      <circle cx="12" cy="12" r="3" fill="#20B2AA"/>
                                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" stroke="#20B2AA" strokeWidth="2" fill="none"/>
                                    </svg>
                                    {providerStats.perplexity > 1 && (
                                      <span className="text-xs font-medium text-gray-600">
                                        {providerStats.perplexity}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {providerStats.googleAI > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    {providerStats.googleAI > 1 && (
                                      <span className="text-xs font-medium text-gray-600">
                                        {providerStats.googleAI}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </div>
  );
}

function extractDomainFromUrl(url: string): string | undefined {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return undefined;
  }
}

function checkBrandMention(text: string, url: string, brandName: string, brandDomain?: string): boolean {
  if (!brandName) return false;
  
  const lowerText = text.toLowerCase();
  const lowerBrandName = brandName.toLowerCase();
  
  // Check if brand name is mentioned in the citation text
  if (lowerText.includes(lowerBrandName)) return true;
  
  // Check if the URL is from the brand's domain
  if (brandDomain && url.includes(brandDomain)) return true;
  
  return false;
}

function checkDomainCitation(url: string, brandDomain?: string): boolean {
  if (!brandDomain) return false;
  return url.includes(brandDomain);
} 