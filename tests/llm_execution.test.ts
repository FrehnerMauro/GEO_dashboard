/**
 * Unit tests for LLM execution with Web Search (Responses API)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { LLMExecutor } from "../shared/llm_execution/index.js";
import type { Config } from "../shared/config.js";
import type { Prompt } from "../shared/types.js";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe("LLMExecutor with Web Search", () => {
  let executor: LLMExecutor;
  let mockConfig: Config;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    global.fetch = mockFetch as any;
    
    mockConfig = {
      openai: {
        apiKey: "test-api-key",
        model: "gpt-5",
        responsesApiUrl: "https://api.openai.com/v1/responses",
      },
      crawling: {
        maxPages: 50,
        maxDepth: 3,
        timeout: 30000,
        userAgent: "GEO-Platform/1.0",
      },
      analysis: {
        reRunSchedule: "weekly",
        brandFuzzyThreshold: 0.7,
        sentimentConfidenceThreshold: 0.6,
      },
      categories: {
        minConfidence: 0.5,
        maxCategories: 10,
      },
      prompts: {
        questionsPerCategory: 5,
        minIntentScore: 0.7,
      },
    };

    executor = new LLMExecutor(mockConfig);
  });

  describe("callResponsesAPI - Correct API format", () => {
    it("should use 'input' instead of 'messages' in request body", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => [
          {
            type: "web_search_call",
            id: "ws_test123",
            status: "completed",
          },
          {
            id: "msg_test123",
            type: "message",
            status: "completed",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "This is a test response with web search results.",
                annotations: [],
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const prompt: Prompt = {
        id: "test_prompt_1",
        categoryId: "test_category",
        question: "What are the latest AI trends?",
        language: "en",
        country: "US",
        intent: "high",
        createdAt: new Date().toISOString(),
      };

      await executor.executePrompt(prompt);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/responses",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-api-key",
          },
          body: expect.stringContaining('"input"'),
        })
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty("input", "What are the latest AI trends?");
      expect(callBody).not.toHaveProperty("messages");
      expect(callBody).toHaveProperty("tools", [{ type: "web_search" }]);
      expect(callBody).toHaveProperty("model", "gpt-5");
    });
  });

  describe("extractOutputText - Responses API format", () => {
    it("should extract output_text from correct Responses API structure", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => [
          {
            type: "web_search_call",
            id: "ws_test123",
            status: "completed",
          },
          {
            id: "msg_test123",
            type: "message",
            status: "completed",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Based on recent web search results, AI trends include large language models, multimodal AI, and AI agents.",
                annotations: [],
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const prompt: Prompt = {
        id: "test_prompt_1",
        categoryId: "test_category",
        question: "What are the latest AI trends?",
        language: "en",
        country: "US",
        intent: "high",
        createdAt: new Date().toISOString(),
      };

      const result = await executor.executePrompt(prompt);

      expect(result.outputText).toBe(
        "Based on recent web search results, AI trends include large language models, multimodal AI, and AI agents."
      );
    });

    it("should handle empty output_text gracefully", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => [
          {
            type: "message",
            status: "completed",
            content: [
              {
                type: "output_text",
                text: "",
                annotations: [],
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const prompt: Prompt = {
        id: "test_prompt_1",
        categoryId: "test_category",
        question: "Test question",
        language: "en",
        country: "US",
        intent: "high",
        createdAt: new Date().toISOString(),
      };

      await expect(executor.executePrompt(prompt)).rejects.toThrow(
        "Keine Antwort von GPT-5 erhalten"
      );
    });
  });

  describe("extractCitations - Responses API format", () => {
    it("should extract citations from annotations array", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => [
          {
            type: "web_search_call",
            id: "ws_test123",
            status: "completed",
          },
          {
            id: "msg_test123",
            type: "message",
            status: "completed",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "AI trends include large language models and multimodal AI.",
                annotations: [
                  {
                    type: "url_citation",
                    start_index: 0,
                    end_index: 50,
                    url: "https://example.com/ai-trends-2025",
                    title: "AI Trends 2025",
                    snippet: "Latest AI trends and developments",
                  },
                  {
                    type: "url_citation",
                    start_index: 51,
                    end_index: 100,
                    url: "https://example.com/multimodal-ai",
                    title: "Multimodal AI Guide",
                    snippet: "Understanding multimodal AI systems",
                  },
                ],
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const prompt: Prompt = {
        id: "test_prompt_1",
        categoryId: "test_category",
        question: "What are the latest AI trends?",
        language: "en",
        country: "US",
        intent: "high",
        createdAt: new Date().toISOString(),
      };

      const result = await executor.executePrompt(prompt);

      expect(result.citations).toHaveLength(2);
      expect(result.citations[0]).toEqual({
        url: "https://example.com/ai-trends-2025",
        title: "AI Trends 2025",
        snippet: "Latest AI trends and developments",
      });
      expect(result.citations[1]).toEqual({
        url: "https://example.com/multimodal-ai",
        title: "Multimodal AI Guide",
        snippet: "Understanding multimodal AI systems",
      });
    });

    it("should handle citations without title or snippet", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => [
          {
            type: "message",
            status: "completed",
            content: [
              {
                type: "output_text",
                text: "Test response",
                annotations: [
                  {
                    type: "url_citation",
                    start_index: 0,
                    end_index: 10,
                    url: "https://example.com/test",
                  },
                ],
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const prompt: Prompt = {
        id: "test_prompt_1",
        categoryId: "test_category",
        question: "Test question",
        language: "en",
        country: "US",
        intent: "high",
        createdAt: new Date().toISOString(),
      };

      const result = await executor.executePrompt(prompt);

      expect(result.citations).toHaveLength(1);
      expect(result.citations[0]).toEqual({
        url: "https://example.com/test",
        title: "https://example.com/test",
        snippet: "",
      });
    });

    it("should deduplicate citations by URL", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => [
          {
            type: "message",
            status: "completed",
            content: [
              {
                type: "output_text",
                text: "Test response",
                annotations: [
                  {
                    type: "url_citation",
                    url: "https://example.com/duplicate",
                    title: "First",
                  },
                  {
                    type: "url_citation",
                    url: "https://example.com/duplicate",
                    title: "Second",
                  },
                  {
                    type: "url_citation",
                    url: "https://example.com/unique",
                    title: "Unique",
                  },
                ],
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const prompt: Prompt = {
        id: "test_prompt_1",
        categoryId: "test_category",
        question: "Test question",
        language: "en",
        country: "US",
        intent: "high",
        createdAt: new Date().toISOString(),
      };

      const result = await executor.executePrompt(prompt);

      expect(result.citations).toHaveLength(2);
      expect(result.citations.find((c) => c.url === "https://example.com/duplicate")).toBeDefined();
      expect(result.citations.find((c) => c.url === "https://example.com/unique")).toBeDefined();
    });
  });

  describe("Error handling", () => {
    it("should throw error when API returns non-OK status", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: new Headers(),
        text: async () => "Invalid API key",
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const prompt: Prompt = {
        id: "test_prompt_1",
        categoryId: "test_category",
        question: "Test question",
        language: "en",
        country: "US",
        intent: "high",
        createdAt: new Date().toISOString(),
      };

      await expect(executor.executePrompt(prompt)).rejects.toThrow(
        "OpenAI API error: 401 Unauthorized - Invalid API key"
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const prompt: Prompt = {
        id: "test_prompt_1",
        categoryId: "test_category",
        question: "Test question",
        language: "en",
        country: "US",
        intent: "high",
        createdAt: new Date().toISOString(),
      };

      await expect(executor.executePrompt(prompt)).rejects.toThrow("Network error");
    });
  });

  describe("executePrompts - Multiple prompts", () => {
    it("should execute multiple prompts sequentially", async () => {
      const mockResponse1 = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => [
          {
            type: "message",
            status: "completed",
            content: [
              {
                type: "output_text",
                text: "Response 1",
                annotations: [],
              },
            ],
          },
        ],
      };

      const mockResponse2 = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => [
          {
            type: "message",
            status: "completed",
            content: [
              {
                type: "output_text",
                text: "Response 2",
                annotations: [],
              },
            ],
          },
        ],
      };

      mockFetch
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const prompts: Prompt[] = [
        {
          id: "test_prompt_1",
          categoryId: "test_category",
          question: "Question 1",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
        {
          id: "test_prompt_2",
          categoryId: "test_category",
          question: "Question 2",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
      ];

      const results = await executor.executePrompts(prompts);

      expect(results).toHaveLength(2);
      expect(results[0].outputText).toBe("Response 1");
      expect(results[1].outputText).toBe("Response 2");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should continue with other prompts if one fails", async () => {
      const mockResponse1 = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers(),
        text: async () => "Server error",
      };

      const mockResponse2 = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => [
          {
            type: "message",
            status: "completed",
            content: [
              {
                type: "output_text",
                text: "Response 2",
                annotations: [],
              },
            ],
          },
        ],
      };

      mockFetch
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const prompts: Prompt[] = [
        {
          id: "test_prompt_1",
          categoryId: "test_category",
          question: "Question 1",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
        {
          id: "test_prompt_2",
          categoryId: "test_category",
          question: "Question 2",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
      ];

      const results = await executor.executePrompts(prompts);

      // Should only have one result (the successful one)
      expect(results).toHaveLength(1);
      expect(results[0].outputText).toBe("Response 2");
    });
  });

  describe("Real-world example", () => {
    it("should handle complete Responses API response structure", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => [
          {
            type: "web_search_call",
            id: "ws_67c9fa0502748190b7dd390736892e100be649c1a5ff9609",
            status: "completed",
          },
          {
            id: "msg_67c9fa077e288190af08fdffda2e34f20be649c1a5ff9609",
            type: "message",
            status: "completed",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "On March 6, 2025, several positive news stories emerged...",
                annotations: [
                  {
                    type: "url_citation",
                    start_index: 2606,
                    end_index: 2758,
                    url: "https://example.com/news/march-6",
                    title: "Positive News Stories - March 6, 2025",
                    snippet: "Several positive developments occurred today...",
                  },
                ],
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const prompt: Prompt = {
        id: "test_prompt_1",
        categoryId: "test_category",
        question: "What was a positive news story from today?",
        language: "en",
        country: "US",
        intent: "high",
        createdAt: new Date().toISOString(),
      };

      const result = await executor.executePrompt(prompt);

      expect(result.outputText).toContain("On March 6, 2025");
      expect(result.citations).toHaveLength(1);
      expect(result.citations[0].url).toBe("https://example.com/news/march-6");
      expect(result.citations[0].title).toBe("Positive News Stories - March 6, 2025");
      expect(result.promptId).toBe("test_prompt_1");
      expect(result.model).toBe("gpt-5");
      expect(result.timestamp).toBeDefined();
    });
  });
});

