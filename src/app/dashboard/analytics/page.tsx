'use client'
import React from 'react';
import Link from 'next/link';
import { useBrandContext } from '@/context/BrandContext';
import { useBrandAnalyticsCombined } from '@/hooks/useBrandAnalytics';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/shared/Card';
import WebLogo from '@/components/shared/WebLogo';
import BrandAnalyticsDisplay from '@/components/features/BrandAnalyticsDisplay';
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
  const { 
    latestAnalytics, 
    lifetimeAnalytics, 
    loading: analyticsLoading, 
    error: analyticsError,
    hasLatestData,
    hasLifetimeData
  } = useBrandAnalyticsCombined(selectedBrand?.id);

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
            onClick={() => window.location.reload()}
            disabled={analyticsLoading}
            className="flex items-center space-x-2 bg-[#000C60] text-white px-4 py-2 rounded-lg hover:bg-[#000C60]/90 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error State */}
        {analyticsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{analyticsError}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {analyticsLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center space-x-2 text-gray-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading analytics...</span>
              </div>
          </div>
        ) : (hasLatestData || hasLifetimeData) ? (
          <BrandAnalyticsDisplay 
            latestAnalytics={latestAnalytics} 
            lifetimeAnalytics={lifetimeAnalytics}
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Available</h3>
            <p className="text-gray-600 mb-4">
              No analytics data has been generated for this brand yet.
            </p>
            <p className="text-sm text-gray-500">
              Process some queries first to generate analytics data, then refresh this page.
                    </p>
                  </div>
        )}
      </div>
    </DashboardLayout>
  );
} 