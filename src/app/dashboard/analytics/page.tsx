'use client'
import React from 'react';
import Link from 'next/link';
import { useBrandContext } from '@/context/BrandContext';
import { useBrandAnalytics } from '@/hooks/useBrandAnalytics';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/shared/Card';
import WebLogo from '@/components/shared/WebLogo';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  BarChart3, 
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle
} from 'lucide-react';

export default function AnalyticsPage(): React.ReactElement {
  const { selectedBrand, brands, loading: brandLoading } = useBrandContext();
  const { data: analytics, loading: analyticsLoading, error, refetch } = useBrandAnalytics();

  // Show loading while brands are being fetched
  if (brandLoading) {
    return (
      <DashboardLayout title="Analytics">
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
      <DashboardLayout title="Analytics">
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Brands Found</h3>
          <p className="text-muted-foreground mb-4">
            Add your first brand to start viewing analytics data.
          </p>
          <Link href="/dashboard/add-brand/step-1" className="bg-[#000C60] text-white px-4 py-2 rounded-lg hover:bg-[#000C60]/90 transition-colors">
            Add Brand
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Show message if no brand is selected
  if (!selectedBrand) {
    return (
      <DashboardLayout title="Analytics">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Brand Selected</h3>
          <p className="text-muted-foreground">
            Please select a brand from the sidebar to view analytics.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Analytics">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <WebLogo domain={selectedBrand.domain} size={40} />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{selectedBrand.companyName}</h1>
              <p className="text-muted-foreground">{selectedBrand.domain}</p>
            </div>
          </div>
          <button
            onClick={refetch}
            disabled={analyticsLoading}
            className="flex items-center space-x-2 bg-[#000C60] text-white px-4 py-2 rounded-lg hover:bg-[#000C60]/90 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : analytics ? (
          <>
            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Mentions</p>
                    <p className="text-2xl font-bold text-foreground">
                      {analytics.overview.totalMentions.toLocaleString()}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-[#000C60]" />
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">+12%</span>
                  <span className="text-muted-foreground ml-1">vs last month</span>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Positive Ratio</p>
                    <p className="text-2xl font-bold text-foreground">
                      {analytics.overview.positiveRatio}%
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-[#00B087]" />
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">+5%</span>
                  <span className="text-muted-foreground ml-1">vs last month</span>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Avg Visibility</p>
                    <p className="text-2xl font-bold text-foreground">
                      {analytics.overview.averageVisibility}%
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-[#764F94]" />
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">+8%</span>
                  <span className="text-muted-foreground ml-1">vs last month</span>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Response Accuracy</p>
                    <p className="text-2xl font-bold text-foreground">
                      {analytics.overview.responseAccuracy}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">+3%</span>
                  <span className="text-muted-foreground ml-1">vs last month</span>
                </div>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time Series Chart */}
              <Card>
                <h3 className="text-lg font-semibold text-foreground mb-4">Mentions Over Time</h3>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Chart component would go here</p>
                    <p className="text-sm">({analytics.timeSeriesData.length} data points)</p>
                  </div>
                </div>
              </Card>

              {/* Top Queries */}
              <Card>
                <h3 className="text-lg font-semibold text-foreground mb-4">Top Queries</h3>
                <div className="space-y-3">
                  {analytics.topQueries.map((query, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex-1">
                        <p className="text-foreground font-medium text-sm">{query.query}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-muted-foreground">{query.aiProvider}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            query.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                            query.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {query.sentiment}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-foreground font-bold">{query.count}</p>
                        <p className="text-xs text-muted-foreground">mentions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
              <h3 className="text-lg font-semibold text-foreground mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{analytics.performanceMetrics.brandsDetected}</p>
                  <p className="text-muted-foreground text-sm">Brands Detected</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{analytics.performanceMetrics.linksProvided}</p>
                  <p className="text-muted-foreground text-sm">Links Provided</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{analytics.performanceMetrics.accurateResponses}</p>
                  <p className="text-muted-foreground text-sm">Accurate Responses</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <p className="text-2xl font-bold text-foreground">
                      {analytics.performanceMetrics.responseTime.toFixed(1)}s
                    </p>
                  </div>
                  <p className="text-muted-foreground text-sm">Avg Response Time</p>
                </div>
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
} 