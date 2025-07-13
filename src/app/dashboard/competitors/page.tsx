'use client'
import React from 'react';
import Link from 'next/link';
import { useBrandContext } from '@/context/BrandContext';
import { useCompetitors } from '@/hooks/useCompetitors';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/shared/Card';
import WebLogo from '@/components/shared/WebLogo';
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Eye,
  MessageSquare,
  Heart
} from 'lucide-react';

export default function CompetitorsPage(): React.ReactElement {
  const { selectedBrand, brands, loading: brandLoading } = useBrandContext();
  const { competitors, loading: competitorsLoading, error, refetch } = useCompetitors();

  // Show loading while brands are being fetched
  if (brandLoading) {
    return (
      <DashboardLayout title="Competitors">
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
      <DashboardLayout title="Competitors">
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Brands Found</h3>
          <p className="text-muted-foreground mb-4">
            Add your first brand to start analyzing competitors.
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
      <DashboardLayout title="Competitors">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Brand Selected</h3>
          <p className="text-muted-foreground">
            Please select a brand from the sidebar to view competitor analysis.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Competitors">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <WebLogo domain={selectedBrand.domain} size={40} />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Competitor Analysis</h1>
              <p className="text-muted-foreground">for {selectedBrand.companyName}</p>
            </div>
          </div>
          <button
            onClick={refetch}
            disabled={competitorsLoading}
            className="flex items-center space-x-2 bg-[#000C60] text-white px-4 py-2 rounded-lg hover:bg-[#000C60]/90 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${competitorsLoading ? 'animate-spin' : ''}`} />
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
        {competitorsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-8 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : competitors.length > 0 ? (
          <>
            {/* Competitors Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div className="text-center">
                  <Users className="h-8 w-8 text-[#000C60] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{competitors.length}</p>
                  <p className="text-muted-foreground text-sm">Competitors Tracked</p>
                </div>
              </Card>
              
              <Card>
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 text-[#00B087] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {competitors.reduce((sum, comp) => sum + comp.mentions, 0).toLocaleString()}
                  </p>
                  <p className="text-muted-foreground text-sm">Total Market Mentions</p>
                </div>
              </Card>
              
              <Card>
                <div className="text-center">
                  <Eye className="h-8 w-8 text-[#764F94] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round(competitors.reduce((sum, comp) => sum + comp.visibility, 0) / competitors.length)}%
                  </p>
                  <p className="text-muted-foreground text-sm">Avg Market Visibility</p>
                </div>
              </Card>
            </div>

            {/* Competitors List */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Competitor Performance</h3>
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
              
              <div className="space-y-4">
                {competitors.map((competitor, index) => (
                  <div key={competitor.id} className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                          <WebLogo domain={competitor.domain} size={32} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{competitor.name}</h4>
                          <p className="text-sm text-muted-foreground">{competitor.domain}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        {/* Mentions */}
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">{competitor.mentions.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Mentions</p>
                          <div className="flex items-center justify-center mt-1">
                            {competitor.trends.mentions > 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={`text-xs ml-1 ${
                              competitor.trends.mentions > 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {competitor.trends.mentions > 0 ? '+' : ''}{competitor.trends.mentions}%
                            </span>
                          </div>
                        </div>

                        {/* Visibility */}
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">{competitor.visibility}%</p>
                          <p className="text-xs text-muted-foreground">Visibility</p>
                          <div className="flex items-center justify-center mt-1">
                            {competitor.trends.visibility > 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={`text-xs ml-1 ${
                              competitor.trends.visibility > 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {competitor.trends.visibility > 0 ? '+' : ''}{competitor.trends.visibility}%
                            </span>
                          </div>
                        </div>

                        {/* Sentiment */}
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Heart className="h-4 w-4 text-pink-500" />
                            <p className="text-sm font-medium text-foreground">{competitor.sentimentScore}/10</p>
                          </div>
                          <p className="text-xs text-muted-foreground">Sentiment</p>
                          <div className="flex items-center justify-center mt-1">
                            {competitor.trends.sentiment > 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={`text-xs ml-1 ${
                              competitor.trends.sentiment > 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {competitor.trends.sentiment > 0 ? '+' : ''}{competitor.trends.sentiment.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Market Share */}
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">{competitor.marketShare}%</p>
                          <p className="text-xs text-muted-foreground">Market Share</p>
                          <div className="w-16 bg-muted rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-[#000C60] h-1.5 rounded-full" 
                              style={{ width: `${competitor.marketShare}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Market Analysis */}
            <Card>
              <h3 className="text-lg font-semibold text-foreground mb-4">Market Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Top Performers</h4>
                  <div className="space-y-2">
                    {competitors
                      .sort((a, b) => b.mentions - a.mentions)
                      .slice(0, 3)
                      .map((competitor, index) => (
                        <div key={competitor.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                            <span className="text-sm font-medium text-foreground">{competitor.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{competitor.mentions} mentions</span>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-3">Growth Leaders</h4>
                  <div className="space-y-2">
                    {competitors
                      .sort((a, b) => b.trends.mentions - a.trends.mentions)
                      .slice(0, 3)
                      .map((competitor, index) => (
                        <div key={competitor.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                            <span className="text-sm font-medium text-foreground">{competitor.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-sm text-green-500">+{competitor.trends.mentions}%</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card>
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Competitors Found</h3>
              <p className="text-muted-foreground">
                No competitor data available for {selectedBrand.companyName} yet.
              </p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 