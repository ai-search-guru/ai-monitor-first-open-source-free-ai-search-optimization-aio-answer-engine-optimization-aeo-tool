import { BaseAPIProvider } from './base-provider';
import { APIResponse, ProviderConfig, PerplexityRequest } from './types';

export class PerplexityProvider extends BaseAPIProvider {
  private apiKey: string;
  private apiUrl: string;

  constructor(config: ProviderConfig) {
    super('perplexity', 'ai', config);
    this.apiKey = config.apiKey;
    this.apiUrl = 'https://api.perplexity.ai/chat/completions';
  }

  async execute(request: PerplexityRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const requestId = `perplexity-${Date.now()}`;

    try {
      if (!this.validateRequest(request)) {
        throw new Error('Invalid request format');
      }

      await this.checkRateLimit();

      const payload = {
        model: request.model || 'sonar-pro',
        messages: request.messages || [
          {
            role: 'system',
            content: 'Be precise and concise. Provide current and accurate information with sources when available.'
          },
          {
            role: 'user',
            content: request.prompt || request.input || 'Please provide information on this topic.'
          }
        ],
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 1000,
        top_p: request.top_p || 1,
        stream: false,
        presence_penalty: request.presence_penalty || 0,
        frequency_penalty: request.frequency_penalty || 0
      };

      console.log('🔍 Perplexity Request Payload:', JSON.stringify(payload, null, 2));

      const response = await this.retryRequest(async () => {
        const fetchResponse = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload)
        });

        if (!fetchResponse.ok) {
          const errorText = await fetchResponse.text();
          throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText} - ${errorText}`);
        }

        return await fetchResponse.json();
      });

      console.log('🌐 Perplexity Raw Response:', JSON.stringify(response, null, 2));

      const transformedData = this.transformResponse(response);
      const responseTime = Date.now() - startTime;
      const cost = this.calculateCost(response);

      console.log('✅ Perplexity completed:', {
        status: 'success',
        responseTime,
        cost,
        hasContent: !!transformedData.content
      });

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
      
      console.error('❌ Perplexity Request Error:', {
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

  validateRequest(request: PerplexityRequest): boolean {
    return !!(
      (request.prompt || request.input || request.messages) &&
      (typeof request.prompt === 'string' || 
       typeof request.input === 'string' || 
       Array.isArray(request.messages))
    );
  }

  transformResponse(rawResponse: any): any {
    const choice = rawResponse.choices?.[0];
    const message = choice?.message;
    
    return {
      content: message?.content || '',
      model: rawResponse.model || 'sonar-pro',
      usage: {
        prompt_tokens: rawResponse.usage?.prompt_tokens || 0,
        completion_tokens: rawResponse.usage?.completion_tokens || 0,
        total_tokens: rawResponse.usage?.total_tokens || 0
      },
      finish_reason: choice?.finish_reason || 'unknown',
      citations: this.extractCitations(message?.content || ''),
      webSearchEnabled: true,
      realTimeData: true,
      metadata: {
        id: rawResponse.id,
        object: rawResponse.object,
        created: rawResponse.created,
        provider: 'perplexity'
      },
      rawResponse: rawResponse
    };
  }

  private extractCitations(content: string): string[] {
    // Perplexity often includes citations in the format [1], [2], etc.
    // or as URLs. This extracts them for easier access.
    const citations: string[] = [];
    
    // Extract numbered citations like [1], [2], etc.
    const numberedCitations = content.match(/\[\d+\]/g);
    if (numberedCitations) {
      citations.push(...numberedCitations);
    }
    
    // Extract URLs
    const urlRegex = /https?:\/\/[^\s\)]+/g;
    const urls = content.match(urlRegex);
    if (urls) {
      citations.push(...urls);
    }
    
    return [...new Set(citations)]; // Remove duplicates
  }

  protected calculateCost(response: any): number {
    // Perplexity Sonar pricing (approximate)
    // Sonar models: ~$0.005 per 1K tokens
    const totalTokens = response.usage?.total_tokens || 0;
    const costPer1KTokens = 0.005;
    return (totalTokens / 1000) * costPer1KTokens;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testRequest: PerplexityRequest = {
        prompt: 'What is the current date?',
        model: 'sonar-pro',
        max_tokens: 50
      };
      
      const result = await this.execute(testRequest);
      return result.status === 'success';
    } catch {
      return false;
    }
  }
} 