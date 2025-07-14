'use client'
import React from 'react';
import { BrandAnalyticsData, LifetimeBrandAnalytics } from '@/firebase/firestore/brandAnalytics';
import { TrendingUp, TrendingDown, Minus, Award, Eye, Link, MessageSquare, Calendar, Clock, BarChart3 } from 'lucide-react';

interface BrandAnalyticsDisplayProps {
  latestAnalytics?: BrandAnalyticsData | null;
  lifetimeAnalytics?: LifetimeBrandAnalytics | null;
  showDetails?: boolean;
  className?: string;
}

export default function BrandAnalyticsDisplay({ 
  latestAnalytics,
  lifetimeAnalytics, 
  showDetails = true, 
  className = '' 
}: BrandAnalyticsDisplayProps): React.ReactElement {
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.seconds ? 
      new Date(timestamp.seconds * 1000) : 
      new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'chatgpt':
        return (
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" role="img" viewBox="0 0 24 24" className="w-5 h-5 text-green-600" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"></path>
          </svg>
        );
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        );
      case 'perplexity':
        return (
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" role="img" viewBox="0 0 24 24" className="w-5 h-5 text-[#20B8CD]" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z"></path>
          </svg>
        );
      default:
        return <Award className="w-5 h-5 text-gray-600" />;
    }
  };

  // Helper function to render analytics section
  const renderAnalyticsSection = (
    analytics: BrandAnalyticsData | LifetimeBrandAnalytics,
    title: string,
    icon: React.ReactNode,
    isLifetime: boolean = false
  ) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="text-sm font-semibold text-gray-700">{title}</span>
          </div>
          {!isLifetime && latestAnalytics && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {getTrendIcon(latestAnalytics.insights.brandVisibilityTrend)}
              <span className="capitalize">{latestAnalytics.insights.brandVisibilityTrend}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">Brand Mentions</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">{analytics.totalBrandMentions}</div>
            <div className="text-xs text-blue-600 mt-1">
              Avg: {analytics.insights.averageBrandMentionsPerQuery} per query
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Brand Visibility</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{analytics.brandVisibilityScore}%</div>
            <div className="text-xs text-green-600 mt-1">
              {analytics.totalQueriesProcessed} queries{isLifetime && 'totalProcessingSessions' in analytics && `, ${analytics.totalProcessingSessions} sessions`}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Link className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-600 font-medium">Citations</span>
            </div>
            <div className="text-2xl font-bold text-purple-700">{analytics.totalCitations}</div>
            <div className="text-xs text-purple-600 mt-1">
              Avg: {analytics.insights.averageCitationsPerQuery} per query
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-orange-600 font-medium">
                Top Provider{analytics.insights.topProviders && analytics.insights.topProviders.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {analytics.insights.topPerformingProvider === 'none' ? (
                // No meaningful performance to rank
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-xs text-gray-600">?</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">None</span>
                </div>
              ) : analytics.insights.topProviders && analytics.insights.topProviders.length > 1 ? (
                // Multiple top providers (tied)
                <div className="flex items-center space-x-1">
                  {analytics.insights.topProviders.map((provider, index) => (
                    <div key={provider} className="flex items-center space-x-1">
                      {getProviderIcon(provider)}
                      {index < analytics.insights.topProviders.length - 1 && (
                        <span className="text-orange-600 font-medium">&</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Single top provider
                <>
                  {getProviderIcon(analytics.insights.topPerformingProvider)}
                  <span className="text-sm font-semibold text-orange-700 capitalize">
                    {analytics.insights.topPerformingProvider}
                  </span>
                </>
              )}
            </div>
            {analytics.insights.topPerformingProvider === 'none' ? (
              <div className="text-xs text-gray-600 mt-1">
                No brand mentions or domain citations found
              </div>
            ) : analytics.insights.topProviders && analytics.insights.topProviders.length > 1 ? (
              <div className="text-xs text-orange-600 mt-1">
                Tied performance
              </div>
            ) : null}
          </div>
        </div>

        {showDetails && (
          <>
            {/* Provider Breakdown */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Provider Performance</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(analytics.providerStats).map(([provider, stats]) => {
                  const rankingDetails = analytics.insights.providerRankingDetails?.[provider];
                  const isTopProvider = analytics.insights.topPerformingProvider !== 'none' && analytics.insights.topProviders?.includes(provider);
                  
                  return (
                    <div key={provider} className={`p-4 rounded-lg border ${isTopProvider ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center space-x-2 mb-3">
                        {getProviderIcon(provider)}
                        <span className="font-medium text-gray-700 capitalize">{provider}</span>
                        {isTopProvider && (
                          <Award className="w-4 h-4 text-orange-500" title="Top Performer" />
                        )}
                        {rankingDetails && analytics.insights.topPerformingProvider !== 'none' && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            #{rankingDetails.rank}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Queries:</span>
                          <span className="font-medium">{stats.queriesProcessed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Brand Mentions:</span>
                          <span className="font-medium">{stats.brandMentions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Citations:</span>
                          <span className="font-medium">{stats.citations}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Domain Citations:</span>
                          <span className="font-medium">{stats.domainCitations}</span>
                        </div>
                        {rankingDetails && analytics.insights.topPerformingProvider !== 'none' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Domain Ratio:</span>
                            <span className="font-medium">{rankingDetails.domainCitationsRatio}%</span>
                          </div>
                        )}
                        {stats.averageResponseTime && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Avg Response:</span>
                            <span className="font-medium">{Math.round(stats.averageResponseTime)}ms</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Session/Lifetime Info */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
                {isLifetime && 'firstQueryProcessed' in analytics ? (
                  <>
                    <div>
                      <span className="font-medium">First Query:</span> {analytics.firstQueryProcessed ? formatDate(analytics.firstQueryProcessed) : 'Unknown'}
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className="font-medium">Last Query:</span> {analytics.lastQueryProcessed ? formatDate(analytics.lastQueryProcessed) : 'Unknown'}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="font-medium">Last Updated:</span> {formatDate(analytics.lastUpdated)}
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className="font-medium">Session:</span> {'processingSessionId' in analytics && analytics.processingSessionId ? analytics.processingSessionId.slice(-8) : 'Unknown'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={className}>
      {/* Latest Performance Section */}
      {latestAnalytics && renderAnalyticsSection(
        latestAnalytics,
        "Latest Performance",
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>,
        false
      )}

      {/* Lifetime Analytics Section */}
      {lifetimeAnalytics && renderAnalyticsSection(
        lifetimeAnalytics,
        "Lifetime Analytics",
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>,
        true
      )}

      {/* No Data State */}
      {!latestAnalytics && !lifetimeAnalytics && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">No Analytics Available</h3>
              <p className="text-xs text-gray-600">Process some queries to generate analytics data</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 