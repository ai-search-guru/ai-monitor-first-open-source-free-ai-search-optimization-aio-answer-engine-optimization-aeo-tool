'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Globe, Search, Sparkles, ArrowRight, AlertCircle, CheckCircle, Building2, Users, Tag, TrendingUp, ExternalLink, RefreshCw, Target } from 'lucide-react';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';

export default function AddBrandStep1(): React.ReactElement {
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();
  
  const { 
    companyState, 
    getCompanyInfo,
    clearCompanyInfo
  } = useCompanyInfo();
  
  const companyData = companyState.result;
  const isAnalyzing = companyState.loading;
  const analysisError = companyState.error;

  // Watch for successful company data fetch and navigate to step 2
  useEffect(() => {
    if (companyData && !isAnalyzing && !analysisError) {
      // Store company info in sessionStorage
      sessionStorage.setItem('companyInfo', JSON.stringify(companyData));
      
      // Navigate to step 2
      router.push('/dashboard/add-brand/step-2');
    }
    
    // Handle error case
    if (analysisError && !isAnalyzing) {
      setError(analysisError);
      setIsValidating(false);
    }
  }, [companyData, isAnalyzing, analysisError, router]);

  // Domain validation function
  const validateDomain = (inputDomain: string): { isValid: boolean; cleanDomain: string; error: string } => {
    if (!inputDomain.trim()) {
      return { isValid: false, cleanDomain: '', error: 'Domain is required' };
    }

    // Remove protocols and www
    let cleanDomain = inputDomain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
    cleanDomain = cleanDomain.replace(/^www\./, '');
    cleanDomain = cleanDomain.replace(/\/$/, ''); // Remove trailing slash

    // Basic format validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    
    if (!domainRegex.test(cleanDomain)) {
      return { isValid: false, cleanDomain, error: 'Please enter a valid domain (e.g., example.com)' };
    }

    // Check for spaces
    if (cleanDomain.includes(' ')) {
      return { isValid: false, cleanDomain, error: 'Domain cannot contain spaces' };
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9.-]+$/.test(cleanDomain)) {
      return { isValid: false, cleanDomain, error: 'Domain contains invalid characters' };
    }

    // Check if it has at least one dot (TLD)
    if (!cleanDomain.includes('.')) {
      return { isValid: false, cleanDomain, error: 'Please include a top-level domain (e.g., .com, .org)' };
    }

    // Check for consecutive dots
    if (cleanDomain.includes('..')) {
      return { isValid: false, cleanDomain, error: 'Domain cannot have consecutive dots' };
    }

    // Check length
    if (cleanDomain.length > 253) {
      return { isValid: false, cleanDomain, error: 'Domain is too long (max 253 characters)' };
    }

    return { isValid: true, cleanDomain, error: '' };
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDomain = e.target.value;
    setDomain(newDomain);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleAnalyzeDomain = async () => {
    setIsValidating(true);
    setError('');

    const validation = validateDomain(domain);
    
    if (!validation.isValid) {
      setError(validation.error);
      setIsValidating(false);
      return;
    }

    try {
      // Store cleaned domain in sessionStorage for next steps
      sessionStorage.setItem('brandDomain', validation.cleanDomain);
      
      // Get company information
      await getCompanyInfo(validation.cleanDomain);
      
      setIsValidating(false);
    } catch (err) {
      setError('Failed to validate domain. Please try again.');
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyzeDomain();
    }
  };

  const validation = validateDomain(domain);
  const isValid = validation.isValid;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Logo */}
      <div className="flex justify-center pt-8 pb-6">
        <div className="flex flex-col items-center space-y-2">
          {/* AI Monitor Logo */}
          <div className="relative w-48 h-12">
            <Image
              src="/AI-Monitor-Logo-V3-long-light-theme.webp"
              alt="AI Monitor Logo"
              width={192}
              height={48}
              className="block dark:hidden w-full h-auto"
              priority
            />
            <Image
              src="/AI-Monitor-Logo-V3-long-dark-themel.png"
              alt="AI Monitor Logo"
              width={192}
              height={48}
              className="hidden dark:block w-full h-auto"
              priority
            />
          </div>
          <p className="text-muted-foreground text-sm">
            Intelligent brand analysis and query optimization platform
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex justify-center px-4">
        <div className="w-full max-w-2xl">
          {/* Step Indicators */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-8">
              {/* Step 1 - Active */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-[#000C60] text-white rounded-full flex items-center justify-center text-lg font-semibold mb-2">
                  1
                </div>
                <span className="text-foreground text-sm font-medium">Domain</span>
              </div>

              {/* Connector */}
              <div className="w-16 h-px bg-border"></div>

              {/* Step 2 - Inactive */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-lg font-semibold mb-2">
                  2
                </div>
                <span className="text-muted-foreground text-sm">Brand</span>
              </div>

              {/* Connector */}
              <div className="w-16 h-px bg-border"></div>

              {/* Step 3 - Inactive */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-lg font-semibold mb-2">
                  3
                </div>
                <span className="text-muted-foreground text-sm">Queries</span>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            {/* Welcome Text */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Welcome to AI Monitor Brand Analytics
              </h1>
              <p className="text-muted-foreground text-lg">
                Let&apos;s create your brand profile starting with your website
              </p>
            </div>

            {/* Domain Input Section */}
            <div className="mb-8">
              <label className="block text-foreground text-lg font-semibold mb-4">
                Brand Website Domain
              </label>
              
              <div className="relative mb-3">
                <input
                  type="text"
                  value={domain}
                  onChange={handleDomainChange}
                  onKeyPress={handleKeyPress}
                  placeholder="yourbrand.com"
                  className={`w-full bg-background border text-foreground px-4 py-4 pr-12 rounded-xl focus:outline-none focus:ring-2 text-lg transition-all ${
                    error || analysisError
                      ? 'border-[#FF4D4D] focus:border-[#FF4D4D] focus:ring-[#FF4D4D]/20' 
                      : domain && isValid
                      ? 'border-[#00B087] focus:border-[#00B087] focus:ring-[#00B087]/20'
                      : 'border-border focus:border-[#000C60] focus:ring-[#000C60]/20'
                  }`}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  {domain && !error && !analysisError && isValid && (
                    <CheckCircle className="h-5 w-5 text-[#00B087]" />
                  )}
                  {(error || analysisError) && (
                    <AlertCircle className="h-5 w-5 text-[#FF4D4D]" />
                  )}
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              
              {/* Error Messages */}
              {error && (
                <div className="flex items-center space-x-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-[#FF4D4D] flex-shrink-0" />
                  <p className="text-[#FF4D4D] text-sm">{error}</p>
                </div>
              )}
              
              {analysisError && (
                <div className="flex items-center space-x-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-[#FF4D4D] flex-shrink-0" />
                  <p className="text-[#FF4D4D] text-sm">{analysisError}</p>
                </div>
              )}
              
              {/* Success Message */}
              {domain && !error && !analysisError && isValid && (
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-[#00B087] flex-shrink-0" />
                  <p className="text-[#00B087] text-sm">Valid domain: {validation.cleanDomain}</p>
                </div>
              )}
              
              <p className="text-muted-foreground text-sm">
                Enter your brand&apos;s main website domain (e.g., apple.com, nike.com)
              </p>
              <p className="text-muted-foreground text-sm">
                We&apos;ll use AI to research your domain and automatically extract company information for the next step.
              </p>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyzeDomain}
              disabled={!domain.trim() || !isValid || isValidating || isAnalyzing}
              className="w-full bg-[#000C60] hover:bg-[#000C60]/90 disabled:bg-muted disabled:text-muted-foreground text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-lg"
            >
              {(isValidating || isAnalyzing) ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{isValidating ? 'Validating...' : 'Getting Company Info...'}</span>
                </>
              ) : (
                <>
                  <span>Get Company Information</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
} 