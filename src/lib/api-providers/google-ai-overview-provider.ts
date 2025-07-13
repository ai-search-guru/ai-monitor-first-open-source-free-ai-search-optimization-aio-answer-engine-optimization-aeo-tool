import { BaseAPIProvider } from './base-provider';
import { APIResponse, ProviderConfig, GoogleAIOverviewRequest } from './types';

export class GoogleAIOverviewProvider extends BaseAPIProvider {
  private apiUrl: string;
  private authHeader: string;

  constructor(config: ProviderConfig & { 
    username?: string; 
    password?: string;
    authHeader?: string;
  }) {
    super('google-ai-overview', 'seo', config);
    this.apiUrl = 'https://api.dataforseo.com/v3/serp/google/organic/live/advanced';
    
    // Use provided auth header or create from username/password
    if (config.authHeader) {
      this.authHeader = config.authHeader;
    } else if (config.username && config.password) {
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      this.authHeader = `Basic ${credentials}`;
    } else {
      // Use the test credentials for now (we'll move to .env later)
      this.authHeader = 'Basic dGVhbUBnZXRhaW1vbml0b3IuY29tOjA2YjZjYzAwYTEyZTU0ZGI=';
    }
  }

  async execute(request: GoogleAIOverviewRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const requestId = `google-ai-overview-${Date.now()}`;

    try {
      if (!this.validateRequest(request)) {
        throw new Error('Invalid request format');
      }

      await this.checkRateLimit();

      const payload = [{
        keyword: request.keyword,
        location_code: request.location_code || 2840, // Default to US
        language_code: request.language_code || "en",
        device: request.device || "desktop",
        os: request.os || "windows",
        depth: request.depth || 10,
        group_organic_results: request.group_organic_results ?? true,
        load_async_ai_overview: request.load_async_ai_overview ?? true,
        people_also_ask_click_depth: request.people_also_ask_click_depth || 4
      }];

      console.log('🔍 Google AI Overview Request Payload:', JSON.stringify(payload, null, 2));

      const response = await this.retryRequest(async () => {
        const fetchResponse = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
        }

        return await fetchResponse.json();
      });

      // Console log the complete raw response
      console.log('🌐 Google AI Overview Complete Raw Response:', JSON.stringify(response, null, 2));
      
      // Log specific parts for easier debugging
      console.log('📊 Google AI Overview Response Summary:', {
        status: response.status_code,
        statusMessage: response.status_message,
        tasksCount: response.tasks?.length || 0,
        hasResults: !!(response.tasks?.[0]?.result),
        resultsCount: response.tasks?.[0]?.result?.length || 0,
        cost: response.cost || 0
      });

      const transformedData = this.transformResponse(response);
      
      // Console log the transformed data
      console.log('✨ Google AI Overview Transformed Data:', JSON.stringify(transformedData, null, 2));
      
      const responseTime = Date.now() - startTime;
      const cost = this.calculateCost(response);

      return {
        providerId: this.name,
        requestId,
        status: 'success',
        data: transformedData,
        responseTime,
        cost,
        timestamp: new Date(),
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Console log Google AI Overview errors
      console.error('❌ Google AI Overview Request Error:', {
        requestId,
        error: (error as Error).message,
        stack: (error as Error).stack,
        responseTime,
        request: JSON.stringify(request, null, 2)
      });
      
      return {
        providerId: this.name,
        requestId,
        status: 'error',
        error: (error as Error).message,
        responseTime,
        cost: 0,
        timestamp: new Date(),
      };
    }
  }

  validateRequest(request: GoogleAIOverviewRequest): boolean {
    return !!(
      request.keyword &&
      typeof request.keyword === 'string' &&
      request.keyword.trim().length > 0
    );
  }

  transformResponse(rawResponse: any): any {
    const task = rawResponse.tasks?.[0];
    const result = task?.result?.[0];
    const items = result?.items || [];
    
    // Filter different types of results from the items array
    const organicResults = items.filter((item: any) => item.type === 'organic');
    const peopleAlsoAskResults = items.filter((item: any) => item.type === 'people_also_ask_element');
    const relatedSearchResults = items.filter((item: any) => item.type === 'related_searches');
    const videoResults = items.filter((item: any) => item.type === 'video');
    const peopleAlsoSearchResults = items.filter((item: any) => item.type === 'people_also_search');
    
    // Enhanced AI Overview extraction - look in multiple places
    let aiOverview = null;
    let aiOverviewItems = [];
    
    // Method 1: Direct ai_overview field
    if (result?.ai_overview) {
      aiOverview = result.ai_overview;
    }
    
    // Method 2: Look for ai_overview in items array
    const aiOverviewItemsInResults = items.filter((item: any) => 
      item.type === 'ai_overview' || 
      item.type === 'ai_overview_element' ||
      (item.type === 'organic' && item.ai_overview)
    );
    
    if (aiOverviewItemsInResults.length > 0) {
      aiOverviewItems = aiOverviewItemsInResults;
      // Extract content from the first AI overview item
      if (!aiOverview && aiOverviewItemsInResults[0]) {
        aiOverview = aiOverviewItemsInResults[0].ai_overview || 
                    aiOverviewItemsInResults[0].description || 
                    aiOverviewItemsInResults[0].snippet;
      }
    }
    
    // Method 3: Look for AI Overview in expanded elements
    const expandedAIOverview = items.filter((item: any) => 
      item.type === 'people_also_ask_element' && 
      item.expanded_element?.some((exp: any) => 
        exp.type === 'people_also_ask_ai_overview_expanded_element' ||
        exp.type === 'ai_overview_expanded_element'
      )
    );
    
    if (expandedAIOverview.length > 0) {
      aiOverviewItems = [...aiOverviewItems, ...expandedAIOverview];
    }
    
    // Method 4: Look for featured snippets that might contain AI-generated content
    const featuredSnippets = items.filter((item: any) => 
      item.type === 'featured_snippet' && 
      (item.description?.toLowerCase().includes('ai') || 
       item.snippet?.toLowerCase().includes('generated'))
    );
    
    if (featuredSnippets.length > 0 && !aiOverview) {
      aiOverview = featuredSnippets[0].description || featuredSnippets[0].snippet;
    }
    
    // Log what we found for debugging
    console.log('🔍 AI Overview Extraction Results:', {
      hasDirectAIOverview: !!result?.ai_overview,
      aiOverviewItemsCount: aiOverviewItemsInResults.length,
      expandedAIOverviewCount: expandedAIOverview.length,
      featuredSnippetsCount: featuredSnippets.length,
      finalAIOverview: !!aiOverview,
      totalItemTypes: [...new Set(items.map((item: any) => item.type))]
    });
    
    return {
      status: rawResponse.status_code,
      statusMessage: rawResponse.status_message,
      keyword: task?.data?.keyword,
      location: task?.data?.location_name,
      language: task?.data?.language_name,
      device: task?.data?.device,
      
      // Enhanced AI Overview data
      aiOverview: aiOverview,
      aiOverviewItems: aiOverviewItems,
      hasAIOverview: !!aiOverview,
      
      // Organic search results
      organicResults: organicResults,
      organicResultsCount: organicResults.length,
      
      // People Also Ask
      peopleAlsoAsk: peopleAlsoAskResults,
      peopleAlsoAskCount: peopleAlsoAskResults.length,
      
      // Related searches
      relatedSearches: relatedSearchResults,
      relatedSearchesCount: relatedSearchResults.length,
      
      // Video results
      videoResults: videoResults,
      videoResultsCount: videoResults.length,
      
      // People Also Search
      peopleAlsoSearch: peopleAlsoSearchResults,
      peopleAlsoSearchCount: peopleAlsoSearchResults.length,
      
      // SERP features
      serpFeatures: result?.features || [],
      
      // Summary counts
      totalItems: items.length,
      itemTypes: [...new Set(items.map((item: any) => item.type))],
      
      // Metadata
      metadata: {
        searchEngineUrl: result?.se_domain,
        checkUrl: result?.check_url,
        datetime: result?.datetime,
        spellingChanges: result?.spell,
        totalResults: result?.total_count,
        timesTaken: result?.time_taken_displayed
      },
      
      // Raw response for debugging
      rawResponse: rawResponse
    };
  }

  protected calculateCost(response: any): number {
    // DataForSEO pricing - typically around $0.0001 per request
    // The actual cost is usually provided in the response
    return response.cost || 0.0001;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testRequest: GoogleAIOverviewRequest = {
        keyword: 'test search query',
        location_code: 2840,
        language_code: 'en',
        device: 'desktop'
      };
      
      const result = await this.execute(testRequest);
      return result.status === 'success';
    } catch {
      return false;
    }
  }
} 