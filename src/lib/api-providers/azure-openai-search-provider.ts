import { BaseAPIProvider } from './base-provider';
import { APIResponse, ProviderConfig, AzureOpenAISearchRequest } from './types';

export class AzureOpenAISearchProvider extends BaseAPIProvider {
  private azureEndpoint: string;
  private deploymentName: string;
  private apiVersion: string;
  private azureSearchEndpoint?: string;
  private azureSearchIndex?: string;
  private azureSearchApiKey?: string;
  private webSearchEnabled: boolean;

  constructor(config: ProviderConfig & {
    azureEndpoint: string;
    deploymentName: string;
    apiVersion?: string;
    azureSearchEndpoint?: string;
    azureSearchIndex?: string;
    azureSearchApiKey?: string;
  }) {
    super('azure-openai-search', 'ai', config);
    this.azureEndpoint = config.azureEndpoint;
    this.deploymentName = config.deploymentName;
    this.apiVersion = config.apiVersion || '2024-10-21';
    this.azureSearchEndpoint = config.azureSearchEndpoint;
    this.azureSearchIndex = config.azureSearchIndex;
    this.azureSearchApiKey = config.azureSearchApiKey;

    // Web search is enabled if Azure Search is configured
    this.webSearchEnabled = !!(this.azureSearchEndpoint && this.azureSearchIndex && this.azureSearchApiKey);

    if (this.webSearchEnabled) {
      console.log('✅ Azure OpenAI Search provider initialized WITH web search enabled via Azure Search');
    } else {
      console.log('⚠️ Azure OpenAI Search provider initialized WITHOUT web search (Azure Search not configured)');
    }
  }

  async execute(request: AzureOpenAISearchRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const requestId = `azure-openai-search-${Date.now()}`;

    try {
      if (!this.validateRequest(request)) {
        throw new Error('Invalid request format');
      }

      await this.checkRateLimit();

      const url = `${this.azureEndpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;

      // Build request body
      const requestBody: any = {
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 1000,
      };

      // Add Azure Search data sources if web search is enabled
      if (this.webSearchEnabled && this.azureSearchEndpoint && this.azureSearchIndex && this.azureSearchApiKey) {
        requestBody.data_sources = [
          {
            type: 'azure_search',
            parameters: {
              endpoint: this.azureSearchEndpoint,
              index_name: this.azureSearchIndex,
              authentication: {
                type: 'api_key',
                key: this.azureSearchApiKey,
              },
              query_type: 'simple',
              in_scope: true,
              top_n_documents: 5,
              strictness: 3,
              role_information: 'You are an AI assistant that helps people find information using web search.',
            }
          }
        ];
      }

      const rawResponse = await this.retryRequest(async () => {
        return await this.makeRequest(url, {
          method: 'POST',
          headers: {
            'api-key': this.config.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      });

      // Console log the complete raw response
      console.log('🔍 Azure OpenAI Search Complete Raw Response:', JSON.stringify(rawResponse, null, 2));

      // Log specific parts for easier debugging
      console.log('🌐 Azure OpenAI Search Response Summary:', {
        model: rawResponse.model,
        hasContent: !!rawResponse.choices?.[0]?.message?.content,
        contentLength: rawResponse.choices?.[0]?.message?.content?.length || 0,
        contentPreview: rawResponse.choices?.[0]?.message?.content?.substring(0, 200) + '...',
        usage: rawResponse.usage,
        hasCitations: !!rawResponse.choices?.[0]?.message?.context?.citations,
        citationsCount: rawResponse.choices?.[0]?.message?.context?.citations?.length || 0,
        citationsPreview: rawResponse.choices?.[0]?.message?.context?.citations?.slice(0, 3) || [],
        webSearchUsed: this.webSearchEnabled,
        finishReason: rawResponse.choices?.[0]?.finish_reason
      });

      const transformedData = this.transformResponse(rawResponse);

      // Console log the transformed data
      console.log('✨ Azure OpenAI Search Transformed Data:', JSON.stringify(transformedData, null, 2));

      const responseTime = Date.now() - startTime;
      const cost = this.calculateCost(rawResponse.usage?.total_tokens);

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

      // Console log Azure OpenAI Search errors
      console.error('❌ Azure OpenAI Search Request Error:', {
        requestId,
        error: (error as Error).message,
        stack: (error as Error).stack,
        responseTime,
        webSearchEnabled: this.webSearchEnabled,
        endpoint: `${this.azureEndpoint}/openai/deployments/${this.deploymentName}/chat/completions`,
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

  validateRequest(request: AzureOpenAISearchRequest): boolean {
    return !!(
      request.messages &&
      Array.isArray(request.messages) &&
      request.messages.length > 0 &&
      request.messages.every(msg => msg.role && msg.content)
    );
  }

  transformResponse(rawResponse: any): any {
    const message = rawResponse.choices?.[0]?.message;
    const content = message?.content || '';
    const context = message?.context;
    const citations = context?.citations || [];
    const intent = context?.intent;

    // Transform Azure Search citations to match ChatGPT Search annotations format
    const annotations = citations.map((citation: any, index: number) => ({
      text: citation.content || '',
      title: citation.title || '',
      url: citation.url || '',
      filepath: citation.filepath || '',
      chunk_id: citation.chunk_id || String(index),
      source: citation.url || citation.filepath || 'Unknown source',
    }));

    return {
      content: content,
      model: rawResponse.model || this.deploymentName,
      usage: rawResponse.usage,
      searchEnabled: this.webSearchEnabled,
      webSearchUsed: this.webSearchEnabled && citations.length > 0,
      tools: this.webSearchEnabled ? ['azure_search'] : [],
      // Include annotations (sources, citations, etc.) in ChatGPT Search format
      annotations: annotations,
      annotationsCount: annotations.length,
      // Include Azure-specific context
      context: context ? {
        intent: intent,
        hasCitations: citations.length > 0,
      } : undefined,
      // Include any other metadata
      metadata: {
        hasAnnotations: annotations.length > 0,
        hasCitations: citations.length > 0,
        responseId: rawResponse.id,
        created: rawResponse.created,
        object: rawResponse.object,
        finishReason: rawResponse.choices?.[0]?.finish_reason,
        webSearchConfigured: this.webSearchEnabled,
      },
      // Raw response for debugging (optional)
      rawResponse: rawResponse
    };
  }

  protected calculateCost(tokensUsed: number = 0): number {
    // Azure OpenAI pricing for GPT-4 (example rates - adjust based on your deployment)
    const baseCostPer1K = 0.03;  // Input: $0.03 per 1K tokens
    const outputCostPer1K = 0.06; // Output: $0.06 per 1K tokens

    // Add premium for Azure Search if web search is enabled
    const searchPremium = this.webSearchEnabled ? 0.01 : 0;

    // Simplified calculation - in production you'd track input/output tokens separately
    return (tokensUsed / 1000) * ((baseCostPer1K + outputCostPer1K) / 2 + searchPremium);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testRequest: AzureOpenAISearchRequest = {
        messages: [
          { role: 'user', content: 'Hello, this is a health check.' }
        ],
        max_tokens: 10,
      };

      const result = await this.execute(testRequest);
      return result.status === 'success';
    } catch {
      return false;
    }
  }
}
