'use client'
import React, { useEffect, useCallback } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Shield, Link as LinkIcon, MessageSquare, Heart, BarChart3, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricCard from '@/components/features/MetricCard';
import LeaderboardTable from '@/components/features/LeaderboardTable';
import RecommendationSection from '@/components/features/RecommendationSection';
import TopDomains from '@/components/features/TopDomains';
import TrendCharts from '@/components/features/TrendCharts';
import Card from '@/components/shared/Card';
import BrandTrackingModal from '@/components/shared/BrandTrackingModal';
import ProcessQueriesButton from '@/components/features/ProcessQueriesButton';
import QueriesOverview from '@/components/features/QueriesOverview';
import { useDashboardData } from '@/hooks/useDashboardData';
import { seedAllData } from '@/firebase/firestore/seedData';
import { useBrandContext } from '@/context/BrandContext';
import { UserBrand } from '@/firebase/firestore/getUserBrands';
import { useUserBrands } from '@/hooks/useUserBrands';
import WebLogo from '@/components/shared/WebLogo';
import BrandAnalyticsDisplay from '@/components/features/BrandAnalyticsDisplay';
import { useBrandAnalyticsCombined } from '@/hooks/useBrandAnalytics';
import LifetimeAnalyticsCharts from '@/components/features/LifetimeAnalyticsCharts';

// Mock data - in real app this would come from API
const metricsData = [
  {
    title: "Brand Validity",
    value: "94.2%",
    change: 5.3,
    changeLabel: "vs last month",
    icon: Shield,
    color: "green" as const,
    description: "Accuracy of brand mentions"
  },
  {
    title: "Link Validity", 
    value: "87.8%",
    change: -2.1,
    changeLabel: "vs last month", 
    icon: LinkIcon,
    color: "blue" as const,
    description: "Valid reference links"
  },
  {
    title: "Brand Mentions",
    value: "1,247",
    change: 12.5,
    changeLabel: "vs last month",
    icon: MessageSquare,
    color: "yellow" as const,
    description: "Total mentions tracked"
  },
  {
    title: "Sentiment Analysis",
    value: "8.6/10",
    change: 0.8,
    changeLabel: "vs last month",
    icon: Heart,
    color: "green" as const,
    description: "Average sentiment score"
  }
];

const leaderboardData = [
  { rank: 1, brand: "OpenAI", domain: "openai.com", mentions: 15420, visibility: 94, change: 12.3, sentiment: "positive" as const },
  { rank: 2, brand: "Google", domain: "google.com", mentions: 12890, visibility: 87, change: 8.7, sentiment: "positive" as const },
  { rank: 3, brand: "Microsoft", domain: "microsoft.com", mentions: 11200, visibility: 82, change: -2.1, sentiment: "neutral" as const },
  { rank: 4, brand: "Anthropic", domain: "anthropic.com", mentions: 8950, visibility: 76, change: 15.4, sentiment: "positive" as const },
  { rank: 5, brand: "Meta", domain: "meta.com", mentions: 7650, visibility: 71, change: -5.3, sentiment: "negative" as const },
  { rank: 6, brand: "Apple", domain: "apple.com", mentions: 6420, visibility: 68, change: 3.2, sentiment: "positive" as const }
];

const brandPromptsData = [
  { rank: 1, brand: "ChatGPT Integration", domain: "chat.openai.com", mentions: 892, visibility: 89, change: 24.1, sentiment: "positive" as const },
  { rank: 2, brand: "AI Assistant Features", domain: "assistant.google.com", mentions: 745, visibility: 82, change: 18.7, sentiment: "positive" as const },
  { rank: 3, brand: "Machine Learning APIs", domain: "cloud.google.com", mentions: 634, visibility: 76, change: -3.2, sentiment: "neutral" as const },
  { rank: 4, brand: "Natural Language Processing", domain: "huggingface.co", mentions: 521, visibility: 71, change: 9.8, sentiment: "positive" as const },
  { rank: 5, brand: "Deep Learning Models", domain: "pytorch.org", mentions: 456, visibility: 65, change: 7.2, sentiment: "positive" as const },
  { rank: 6, brand: "Neural Networks", domain: "tensorflow.org", mentions: 389, visibility: 58, change: -1.5, sentiment: "neutral" as const }
];

const recommendationsData = [
  {
    id: "1",
    title: "Optimize brand mentions in ChatGPT responses",
    description: "Increase your brand visibility by 23% through strategic content optimization and keyword targeting.",
    priority: "high" as const,
    category: "Content Strategy",
    imageUrl: "https://picsum.photos/400/300?random=10",
    readTime: "5 min read",
    rating: 4.8
  },
  {
    id: "2", 
    title: "Improve sentiment analysis on Perplexity",
    description: "Address negative sentiment patterns detected in recent brand mentions to improve overall rating.",
    priority: "medium" as const,
    category: "Reputation Management",
    imageUrl: "https://picsum.photos/400/300?random=11",
    readTime: "3 min read",
    rating: 4.2
  },
  {
    id: "3",
    title: "Expand competitor analysis coverage",
    description: "Track 12 additional competitors to get more comprehensive market intelligence.",
    priority: "low" as const,
    category: "Market Intelligence",
    imageUrl: "https://picsum.photos/400/300?random=12",
    readTime: "7 min read",
    rating: 4.5
  }
];

const topDomainsData = [
  { rank: 1, domain: "www.zeni.ai", mentions: 6, progress: 90, icon: "⚡" },
  { rank: 2, domain: "mercury.com", mentions: 5, progress: 75, icon: "▪️" },
  { rank: 3, domain: "affoweb.com", mentions: 4, progress: 60, icon: "🔺" },
  { rank: 4, domain: "kruzeconsulting.c...", mentions: 4, progress: 85, icon: "📊" },
  { rank: 5, domain: "topapps.ai", mentions: 3, progress: 50, icon: "⚫" },
  { rank: 6, domain: "www.codemasters...", mentions: 3, progress: 45, icon: "⚪" },
  { rank: 7, domain: "www.freshbooks.c...", mentions: 3, progress: 65, icon: "🔷" },
  { rank: 8, domain: "www.phoenixstrat...", mentions: 3, progress: 70, icon: "🔶" }
];

function Page(): React.ReactElement {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const { 
    data, 
    loading: dataLoading, 
    error, 
    refetch, 
    isGeneratingData, 
    generationStatus 
  } = useDashboardData();
  const { selectedBrand, selectedBrandId, brands, loading: brandsLoading, error: brandsError, setSelectedBrandId, clearBrandContext } = useBrandContext();
  const { refetch: refetchBrands } = useUserBrands();
  const { 
    latestAnalytics, 
    lifetimeAnalytics, 
    loading: analyticsLoading, 
    error: analyticsError,
    hasLatestData,
    hasLifetimeData
  } = useBrandAnalyticsCombined(selectedBrand?.id);
  
  // Modal state
  const [showTrackingModal, setShowTrackingModal] = React.useState(false);
  const [newBrandName, setNewBrandName] = React.useState('');
  const [newBrandId, setNewBrandId] = React.useState('');

  useEffect(() => {
    // Only redirect if not loading and user is null
    if (!authLoading && user == null) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Check for brand tracking modal when dashboard loads
  useEffect(() => {
    if (user && !authLoading) {
      // Check if we should show the brand tracking modal
      const showModal = sessionStorage.getItem('showBrandTrackingModal');
      const brandName = sessionStorage.getItem('newBrandName');
      
      if (showModal === 'true') {
        console.log('🎯 Showing brand tracking modal for:', brandName);
        setNewBrandName(brandName || '');
        const brandId = sessionStorage.getItem('newBrandId');
        setNewBrandId(brandId || '');
        setShowTrackingModal(true);
        
        // Clear the modal flag (but keep other data for when user clicks "Start Tracking")
        sessionStorage.removeItem('showBrandTrackingModal');
      }
    }
  }, [user, authLoading]);

  // Handle "Great, Start Tracking!" button click
  const handleStartTracking = async () => {
    console.log('🚀 Starting brand tracking...');
    
    // Close modal first
    setShowTrackingModal(false);
    
    // Clear current brand context to ensure fresh state
    clearBrandContext();
    
    // Clear current selection and refresh brands
    setSelectedBrandId('');
    
    // Refresh brands list and auto-select new brand
    console.log('🔄 Refreshing brands list...');
    await refetchBrands();
    
    if (newBrandId) {
      console.log('✅ Auto-selecting newly created brand:', newBrandId);
      setTimeout(() => {
        setSelectedBrandId(newBrandId);
      }, 100); // Small delay to ensure brands are loaded
    }
    
    // Clean up remaining session storage
    sessionStorage.removeItem('newBrandId');
    sessionStorage.removeItem('newBrandName');
    sessionStorage.removeItem('firestoreDocId');
    sessionStorage.removeItem('brandsbasicData');
    sessionStorage.removeItem('generatedQueries');
    
    console.log('✅ Brand tracking started successfully!');
    
    // Redirect to queries page
    console.log('🎯 Redirecting to queries page...');
    router.push('/dashboard/queries');
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowTrackingModal(false);
    
    // Clean up session storage
    sessionStorage.removeItem('newBrandId');
    sessionStorage.removeItem('newBrandName');
    sessionStorage.removeItem('firestoreDocId');
    sessionStorage.removeItem('brandsbasicData');
    sessionStorage.removeItem('generatedQueries');
  };

  // Function to seed data for development
  const handleSeedData = useCallback(async () => {
    if (user?.uid) {
      const result = await seedAllData(user.uid);
      if (result.success) {
        console.log('✅ Sample data seeded successfully!');
        refetch(); // Refresh the data after seeding
      } else {
        console.error('❌ Failed to seed sample data:', result.error);
      }
    }
  }, [user?.uid, refetch]);

  // Developer keyboard shortcut for seeding data (Ctrl+Shift+S)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'S') {
          event.preventDefault();
          handleSeedData();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [user?.uid, handleSeedData]);

  // Expose seed function to global scope for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user?.uid) {
      (window as any).seedSampleData = handleSeedData;
      (window as any).refreshDashboard = refetch;
      (window as any).debugDashboard = () => {
        console.log('🔍 Dashboard Debug Info:', {
          user: user?.uid,
          selectedBrand: selectedBrand?.companyName,
          selectedBrandId,
          hasBasicData: !!selectedBrand?.brandsbasicData,
          brandsbasicData: selectedBrand?.brandsbasicData,
          metricsCount: data.metrics.length,
          dataLoading,
          error,
          data
        });
      };
      console.log('🔧 Developer tools available:');
      console.log('- seedSampleData() - Populate database with sample data');
      console.log('- refreshDashboard() - Refresh dashboard data');
      console.log('- debugDashboard() - Show debug information');
      console.log('- Ctrl+Shift+S - Keyboard shortcut to seed data');
      
      // Test context availability
      console.log('🧪 Context Test:', {
        brandsLoaded: brands.length > 0,
        selectedBrandId,
        selectedBrandName: selectedBrand?.companyName,
        contextWorking: 'Brand context is working!'
      });
    }
  }, [user?.uid, handleSeedData, refetch, selectedBrand, selectedBrandId, data, dataLoading, error, brands]);

  // Show loading while auth state is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-lg">Loading dashboard...</div>
      </div>
    );
  }

  // Redirect is handled by useEffect, but return loading while redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-lg">Redirecting...</div>
      </div>
    );
  }

  // Show loading while brands are being fetched
  if (brandsLoading) {
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

  // Determine which analytics section comes first
  const showLatestFirst = !!latestAnalytics;
  const showLifetimeFirst = !latestAnalytics && !!lifetimeAnalytics;

  return (
    <DashboardLayout title="Analytics">
      <div className="space-y-6">
        {/* --- Analytics Section (First Available) --- */}
        {showLatestFirst && (
          <BrandAnalyticsDisplay 
            latestAnalytics={latestAnalytics} 
            lifetimeAnalytics={null}
          />
        )}
        {showLifetimeFirst && (
          <BrandAnalyticsDisplay 
            latestAnalytics={null} 
            lifetimeAnalytics={lifetimeAnalytics}
          />
        )}

        {/* --- AI Recommendations Section --- */}
        <RecommendationSection 
          recommendations={data.recommendations.length > 0 ? data.recommendations : recommendationsData}
          defaultExpanded={true}
        />

        {/* --- Queries Overview Section --- */}
        <QueriesOverview 
          variant="compact"
          maxQueries={5}
          showProcessButton={true}
          showSearch={false}
          showEyeIcons={true}
          onViewAll={() => {
            window.location.href = '/dashboard/queries';
          }}
          onQueryClick={(query, result) => {
            console.log('Dashboard: Query clicked', query, result);
          }}
        />

        {/* --- Remaining Analytics Section (if both exist) --- */}
        
      </div>
      {/* Brand Tracking Modal remains as is */}
      <BrandTrackingModal
        isOpen={showTrackingModal}
        onStartTracking={handleStartTracking}
        onClose={handleCloseModal}
        brandName={newBrandName}
      />
    </DashboardLayout>
  );
}

export default Page; 