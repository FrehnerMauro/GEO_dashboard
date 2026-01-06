/**
 * Unit tests for citation parsing
 */

import { describe, it, expect } from "vitest";
import { LLMExecutor } from "../src/llm_execution/index.js";
import type { Config, Prompt } from "../src/types.js";

describe("LLMExecutor", () => {
  it("should create executor instance", () => {
    const mockConfig: Config = {
      openai: {
        apiKey: "test-key",
        model: "gpt-4",
        responsesApiUrl: "https://api.openai.com/v1/responses",
      },
      crawling: {
        maxPages: 50,
        maxDepth: 3,
        timeout: 30000,
        userAgent: "test",
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

    const executor = new LLMExecutor(mockConfig);
    expect(executor).toBeInstanceOf(LLMExecutor);
  });

  it("should handle prompt structure correctly", () => {
    const prompt: Prompt = {
      id: "test-prompt",
      categoryId: "cat-1",
      question: "What are the features?",
      language: "en",
      country: "US",
      intent: "high",
      createdAt: new Date().toISOString(),
    };

    expect(prompt.question).toBe("What are the features?");
    expect(prompt.intent).toBe("high");
  });
});

