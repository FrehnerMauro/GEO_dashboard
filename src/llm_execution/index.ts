/**
 * LLM execution module
 * Executes prompts against GPT-5 with Web Search enabled
 */

import type { Prompt, LLMResponse, WebSearchCitation } from "../types.js";
import type { Config } from "../config.js";

export class LLMExecutor {
  constructor(private config: Config) {}

  async executePrompt(prompt: Prompt): Promise<LLMResponse> {
    const response = await this.callResponsesAPI(prompt.question);

    return {
      promptId: prompt.id,
      outputText: response.outputText,
      citations: response.citations,
      timestamp: new Date().toISOString(),
      model: this.config.openai.model,
    };
  }

  async executePrompts(prompts: Prompt[]): Promise<LLMResponse[]> {
    const responses: LLMResponse[] = [];

    // Execute prompts sequentially to avoid rate limits
    for (const prompt of prompts) {
      try {
        const response = await this.executePrompt(prompt);
        responses.push(response);
      } catch (error) {
        console.error(`Failed to execute prompt ${prompt.id}:`, error);
        // Continue with other prompts even if one fails
      }
    }

    return responses;
  }

  private async callResponsesAPI(question: string): Promise<{
    outputText: string;
    citations: WebSearchCitation[];
  }> {
    // According to OpenAI Responses API documentation:
    // https://platform.openai.com/docs/guides/tools-web-search
    // The endpoint is: POST https://api.openai.com/v1/responses
    // Format: { model, tools: [{ type: "web_search" }], input }
    const url = "https://api.openai.com/v1/responses";
    
    if (!this.config.openai.apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const requestBody = {
      model: this.config.openai.model,
      tools: [
        {
          type: "web_search",
        },
      ],
      input: question,
    };

    console.log('📤 Sending request to OpenAI Responses API:');
    console.log('  URL:', url);
    console.log('  Model:', this.config.openai.model);
    console.log('  API Key present:', !!this.config.openai.apiKey);
    console.log('  API Key length:', this.config.openai.apiKey?.length || 0);
    console.log('  Request body:', JSON.stringify(requestBody, null, 2));

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.openai.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      throw new Error(`Failed to connect to OpenAI API: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }

    console.log('📥 Response status:', response.status, response.statusText);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('❌ API Error Response Text:', errorText);
      } catch (e) {
        errorText = 'Could not read error response';
        console.error('❌ Could not read error response:', e);
      }
      console.error('❌ API Error Response Status:', response.status);
      console.error('❌ API Error Response Status Text:', response.statusText);
      
      // Try to parse error as JSON
      let errorJson: any = null;
      try {
        errorJson = JSON.parse(errorText);
        console.error('❌ API Error JSON:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Not JSON, that's okay
      }
      
      const errorMessage = errorJson?.error?.message || errorJson?.error || errorText || response.statusText;
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText} - ${errorMessage.substring(0, 500)}`
      );
    }

    let data;
    try {
      data = await response.json();
      console.log('🔍 Raw API response type:', Array.isArray(data) ? 'array' : typeof data);
      try {
        console.log('🔍 Raw API response:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.error('❌ Failed to stringify response:', e);
      }
    } catch (jsonError) {
      const responseText = await response.text();
      console.error('❌ Failed to parse JSON response:', jsonError);
      console.error('❌ Response text:', responseText);
      throw new Error(`Failed to parse API response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}. Response: ${responseText.substring(0, 500)}`);
    }

    // According to OpenAI docs, response is an array:
    // [
    //   { type: "web_search_call", id: "...", status: "completed" },
    //   { id: "...", type: "message", status: "completed", role: "assistant", content: [...] }
    // ]
    // The response object also has output_text directly available
    let outputText: string;
    let citations: WebSearchCitation[];
    try {
      outputText = this.extractOutputText(data);
      citations = this.extractCitations(data);
    } catch (extractError) {
      throw extractError;
    }

    console.log('📝 Extracted outputText length:', outputText.length);
    console.log('📝 Extracted outputText preview:', outputText.substring(0, 200));
    console.log('📚 Extracted citations count:', citations.length);
    if (citations.length > 0) {
      console.log('📚 Extracted citations:', JSON.stringify(citations, null, 2));
    } else {
      console.warn('⚠️ No citations extracted! Raw data structure:', JSON.stringify(data, null, 2).substring(0, 1000));
    }

    if (!outputText || outputText.trim().length === 0) {
      console.error('❌ ERROR: Empty outputText extracted!');
      console.error('❌ Full raw data:', JSON.stringify(data, null, 2));
      throw new Error('Keine Antwort von GPT-5 erhalten. Die API hat eine leere Antwort zurückgegeben.');
    }

    return {
      outputText,
      citations,
    };
  }

  private extractOutputText(data: any): string {
    console.log('🔍 extractOutputText - Input data type:', Array.isArray(data) ? 'array' : typeof data);
    
    // According to OpenAI docs, the response can be:
    // 1. An array: [{ type: "web_search_call" }, { type: "message", content: [...] }]
    // 2. An object with 'output' field: { output: [{ type: "message", content: [...] }] }
    // The text is in: output[0].content[0].text where content[0].type === "output_text"
    
    // Check if data has an 'output' field that is an array (actual API response format)
    if (data && typeof data === 'object' && Array.isArray((data as any).output)) {
      const outputArray = (data as any).output;
      // Find the message object with type "message" and status "completed"
      const messageObj = outputArray.find(
        (item: any) => item.type === "message" && item.status === "completed"
      );
      
      if (messageObj?.content && Array.isArray(messageObj.content)) {
        // Find the output_text item in content array
        const outputTextItem = messageObj.content.find(
          (item: any) => item.type === "output_text"
        );
        
        if (outputTextItem?.text) {
          return outputTextItem.text;
        }
      }
    }
    
    // Check if data has a 'data' field that is an array (wrapped response)
    if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
      // Recursively call with the unwrapped array
      return this.extractOutputText((data as any).data);
    }
    
    // First, try direct output_text (if using SDK, response.output_text is available)
    if (data && typeof data === 'object' && 'output_text' in data) {
      console.log('✅ Found output_text directly on response object');
      return (data as any).output_text;
    }
    
    // If data is an array (raw API response - old format)
    if (Array.isArray(data)) {
      console.log('🔍 Data is array, length:', data.length);
      
      // Find the message object with type "message" and status "completed"
      // According to docs: second element is usually the message
      const messageObj = data.find(
        (item: any) => item.type === "message" && item.status === "completed"
      );
      
      console.log('🔍 Found messageObj:', messageObj ? 'yes' : 'no');
      
      if (messageObj?.content && Array.isArray(messageObj.content)) {
        console.log('🔍 messageObj.content is array, length:', messageObj.content.length);
        
        // Find the output_text item in content array
        // According to docs: content: [{ type: "output_text", text: "...", annotations: [...] }]
        const outputTextItem = messageObj.content.find(
          (item: any) => item.type === "output_text"
        );
        
        console.log('🔍 Found outputTextItem:', outputTextItem ? 'yes' : 'no');
        
        if (outputTextItem?.text) {
          console.log('✅ Extracted text from outputTextItem.text, length:', outputTextItem.text.length);
          return outputTextItem.text;
        } else if (outputTextItem) {
          console.warn('⚠️ outputTextItem found but no text property. Keys:', Object.keys(outputTextItem));
        }
      }
    }

    // Fallback: try nested paths
    if (data?.message?.output_text) {
      console.log('✅ Using fallback: data.message.output_text');
      return data.message.output_text;
    }

    if (data?.outputText) {
      console.log('✅ Using fallback: data.outputText');
      return data.outputText;
    }

    console.error('❌ No output text found in data structure');
    console.error('❌ Data structure:', JSON.stringify(data, null, 2));
    return "";
  }

  private extractCitations(data: any): WebSearchCitation[] {
    const citations: WebSearchCitation[] = [];

    // According to OpenAI docs, citations are in:
    // 1. data.output[0].content[0].annotations[] (actual API format)
    // 2. data[1].content[0].annotations[] (old array format)
    
    // Check if data has an 'output' field that is an array (actual API response format)
    if (data && typeof data === 'object' && Array.isArray((data as any).output)) {
      const outputArray = (data as any).output;
      // Find the message object with type "message" and status "completed"
      const messageObj = outputArray.find(
        (item: any) => item.type === "message" && item.status === "completed"
      );
      
      if (messageObj?.content && Array.isArray(messageObj.content)) {
        // Find the output_text item in content array
        const outputTextItem = messageObj.content.find(
          (item: any) => item.type === "output_text"
        );
        
        // Extract citations from annotations array
        // According to docs: annotations: [{ type: "url_citation", url: "...", title: "...", ... }]
        if (outputTextItem?.annotations && Array.isArray(outputTextItem.annotations)) {
          for (const annotation of outputTextItem.annotations) {
            if (annotation.type === "url_citation" && annotation.url) {
              citations.push({
                url: annotation.url,
                title: annotation.title || annotation.url,
                snippet: annotation.snippet || "",
              });
            }
          }
        }
      }
    }
    
    // If data is an array (raw API response - old format)
    if (Array.isArray(data)) {
      // Find the message object with type "message" and status "completed"
      const messageObj = data.find(
        (item: any) => item.type === "message" && item.status === "completed"
      );
      
      if (messageObj?.content && Array.isArray(messageObj.content)) {
        // Find the output_text item in content array
        const outputTextItem = messageObj.content.find(
          (item: any) => item.type === "output_text"
        );
        
        // Extract citations from annotations array
        // According to docs: annotations: [{ type: "url_citation", url: "...", title: "...", ... }]
        if (outputTextItem?.annotations && Array.isArray(outputTextItem.annotations)) {
          for (const annotation of outputTextItem.annotations) {
            if (annotation.type === "url_citation" && annotation.url) {
              citations.push({
                url: annotation.url,
                title: annotation.title || annotation.url,
                snippet: annotation.snippet || "",
              });
            }
          }
        }
      }
    }

    // Fallback: try nested paths (for backward compatibility)
    if (data?.message?.content && Array.isArray(data.message.content)) {
      for (const item of data.message.content) {
        if (item.annotations && Array.isArray(item.annotations)) {
          for (const annotation of item.annotations) {
            if (annotation.type === "url_citation" && annotation.url) {
              citations.push({
                url: annotation.url,
                title: annotation.title || annotation.url,
                snippet: annotation.snippet || "",
              });
            }
          }
        }
      }
    }

    // Deduplicate by URL
    const uniqueCitations = new Map<string, WebSearchCitation>();
    for (const citation of citations) {
      if (citation.url && !uniqueCitations.has(citation.url)) {
        uniqueCitations.set(citation.url, citation);
      }
    }

    return Array.from(uniqueCitations.values());
  }
}

