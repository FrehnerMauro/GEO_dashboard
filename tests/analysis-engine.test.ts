/**
 * Unit tests for AnalysisEngine - Core analysis logic
 * 
 * Architectural decisions demonstrated:
 * - Single Responsibility: Each detector handles one concern
 * - Composition: Engine composes multiple detectors
 * - Strategy Pattern: Different analysis strategies (brand, competitor, sentiment)
 * - Metrics Calculation: Aggregated metrics from individual analyses
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalysisEngine } from "../shared/analysis/index.js";
import type { Prompt, LLMResponse, PromptAnalysis, CategoryMetrics, CompetitiveAnalysis } from "../shared/types.js";

// Mock dependencies
vi.mock("../shared/analysis/brand_mention.js", () => ({
  BrandMentionDetector: vi.fn().mockImplementation(() => ({
    detectMentions: vi.fn().mockReturnValue({
      exact: 2,
      fuzzy: 1,
      contexts: ["context 1", "context 2"],
      citations: 1,
    }),
  })),
}));

vi.mock("../shared/analysis/competitor.js", () => ({
  CompetitorDetector: vi.fn().mockImplementation(() => ({
    detectCompetitors: vi.fn().mockReturnValue([
      {
        name: "Competitor A",
        count: 3,
        contexts: ["context 1"],
        citations: ["https://competitor.com"],
      },
    ]),
  })),
}));

vi.mock("../shared/analysis/sentiment.js", () => ({
  SentimentAnalyzer: vi.fn().mockImplementation(() => ({
    analyzeSentiment: vi.fn().mockReturnValue({
      tone: "positive",
      confidence: 0.8,
      keywords: ["great", "excellent"],
    }),
  })),
}));

describe("AnalysisEngine", () => {
  let engine: AnalysisEngine;
  const brandName = "TestBrand";

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new AnalysisEngine(brandName, 0.7);
  });

  describe("analyzeResponses", () => {
    it("should analyze all prompt-response pairs", () => {
      const prompts: Prompt[] = [
        {
          id: "prompt_1",
          categoryId: "cat_1",
          question: "Test question?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
        {
          id: "prompt_2",
          categoryId: "cat_1",
          question: "Another question?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
      ];

      const responses: LLMResponse[] = [
        {
          promptId: "prompt_1",
          outputText: "Test response mentioning TestBrand",
          citations: [
            {
              url: "https://testbrand.com",
              title: "TestBrand Website",
              snippet: "TestBrand is great",
            },
          ],
          timestamp: new Date().toISOString(),
          model: "gpt-4o",
        },
        {
          promptId: "prompt_2",
          outputText: "Another response",
          citations: [],
          timestamp: new Date().toISOString(),
          model: "gpt-4o",
        },
      ];

      const analyses = engine.analyzeResponses(prompts, responses);

      expect(analyses.length).toBe(2);
      expect(analyses[0].promptId).toBe("prompt_1");
      expect(analyses[1].promptId).toBe("prompt_2");
    });

    it("should skip prompts without responses", () => {
      const prompts: Prompt[] = [
        {
          id: "prompt_1",
          categoryId: "cat_1",
          question: "Test question?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
        {
          id: "prompt_2",
          categoryId: "cat_1",
          question: "Another question?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
      ];

      const responses: LLMResponse[] = [
        {
          promptId: "prompt_1",
          outputText: "Test response",
          citations: [],
          timestamp: new Date().toISOString(),
          model: "gpt-4o",
        },
        // prompt_2 has no response
      ];

      const analyses = engine.analyzeResponses(prompts, responses);

      expect(analyses.length).toBe(1);
      expect(analyses[0].promptId).toBe("prompt_1");
    });

    it("should include structured answers in analysis", () => {
      const prompts: Prompt[] = [
        {
          id: "prompt_1",
          categoryId: "cat_1",
          question: "Test question?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
      ];

      const responses: LLMResponse[] = [
        {
          promptId: "prompt_1",
          outputText: "TestBrand is mentioned here",
          citations: [
            {
              url: "https://testbrand.com",
              title: "TestBrand",
              snippet: "TestBrand info",
            },
          ],
          timestamp: new Date().toISOString(),
          model: "gpt-4o",
        },
      ];

      const analyses = engine.analyzeResponses(prompts, responses);

      expect(analyses[0].isMentioned).toBe(true);
      expect(analyses[0].mentionCount).toBeGreaterThan(0);
      expect(analyses[0].isCited).toBeDefined();
      expect(analyses[0].citationDetails).toBeDefined();
      expect(analyses[0].competitorDetails).toBeDefined();
    });
  });

  describe("calculateCategoryMetrics", () => {
    it("should calculate metrics for a category", () => {
      const prompts: Prompt[] = [
        {
          id: "prompt_1",
          categoryId: "cat_1",
          question: "Question 1?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
        {
          id: "prompt_2",
          categoryId: "cat_1",
          question: "Question 2?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
      ];

      const analyses: PromptAnalysis[] = [
        {
          promptId: "prompt_1",
          brandMentions: { exact: 2, fuzzy: 0, contexts: [], citations: 0 },
          citationCount: 3,
          citationUrls: ["url1", "url2", "url3"],
          brandCitations: [],
          competitors: [],
          sentiment: { tone: "positive", confidence: 0.8, keywords: [] },
          timestamp: new Date().toISOString(),
          isMentioned: true,
          mentionCount: 2,
          isCited: true,
          citationDetails: [],
          competitorDetails: [],
        },
        {
          promptId: "prompt_2",
          brandMentions: { exact: 0, fuzzy: 0, contexts: [], citations: 0 },
          citationCount: 1,
          citationUrls: ["url4"],
          brandCitations: [],
          competitors: [
            {
              name: "Competitor",
              count: 2,
              contexts: [],
              citations: [],
            },
          ],
          sentiment: { tone: "neutral", confidence: 0.5, keywords: [] },
          timestamp: new Date().toISOString(),
          isMentioned: false,
          mentionCount: 0,
          isCited: false,
          citationDetails: [],
          competitorDetails: [],
        },
      ];

      const metrics = engine.calculateCategoryMetrics("cat_1", prompts, analyses);

      expect(metrics.categoryId).toBe("cat_1");
      expect(metrics.visibilityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.visibilityScore).toBeLessThanOrEqual(100);
      expect(metrics.citationRate).toBe(2); // (3 + 1) / 2 prompts
      expect(metrics.brandMentionRate).toBe(0.5); // 1 out of 2 prompts
      expect(metrics.competitorMentionRate).toBe(0.5); // 1 out of 2 prompts
    });

    it("should return zero metrics for empty category", () => {
      const metrics = engine.calculateCategoryMetrics("cat_empty", [], []);

      expect(metrics.visibilityScore).toBe(0);
      expect(metrics.citationRate).toBe(0);
      expect(metrics.brandMentionRate).toBe(0);
      expect(metrics.competitorMentionRate).toBe(0);
    });
  });

  describe("performCompetitiveAnalysis", () => {
    it("should calculate brand and competitor shares", () => {
      const prompts: Prompt[] = [
        {
          id: "prompt_1",
          categoryId: "cat_1",
          question: "Question?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
      ];

      const analyses: PromptAnalysis[] = [
        {
          promptId: "prompt_1",
          brandMentions: { exact: 5, fuzzy: 2, contexts: [], citations: 0 },
          citationCount: 0,
          citationUrls: [],
          brandCitations: [],
          competitors: [
            {
              name: "Competitor A",
              count: 3,
              contexts: [],
              citations: [],
            },
            {
              name: "Competitor B",
              count: 2,
              contexts: [],
              citations: [],
            },
          ],
          sentiment: { tone: "positive", confidence: 0.8, keywords: [] },
          timestamp: new Date().toISOString(),
          isMentioned: true,
          mentionCount: 7,
          isCited: false,
          citationDetails: [],
          competitorDetails: [],
        },
      ];

      const competitive = engine.performCompetitiveAnalysis(analyses, prompts);

      // Brand: 7 mentions, Competitors: 5 mentions, Total: 12
      // Brand share: 7/12 = 58.33%
      expect(competitive.brandShare).toBeCloseTo(58.33, 1);
      expect(competitive.competitorShares["Competitor A"]).toBeCloseTo(25, 1);
      expect(competitive.competitorShares["Competitor B"]).toBeCloseTo(16.67, 1);
    });

    it("should identify white space topics", () => {
      const prompts: Prompt[] = [
        {
          id: "prompt_1",
          categoryId: "cat_1",
          question: "White space question?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
        {
          id: "prompt_2",
          categoryId: "cat_1",
          question: "Mentioned question?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
      ];

      const analyses: PromptAnalysis[] = [
        {
          promptId: "prompt_1",
          brandMentions: { exact: 0, fuzzy: 0, contexts: [], citations: 0 },
          citationCount: 0,
          citationUrls: [],
          brandCitations: [],
          competitors: [],
          sentiment: { tone: "neutral", confidence: 0.5, keywords: [] },
          timestamp: new Date().toISOString(),
          isMentioned: false,
          mentionCount: 0,
          isCited: false,
          citationDetails: [],
          competitorDetails: [],
        },
        {
          promptId: "prompt_2",
          brandMentions: { exact: 1, fuzzy: 0, contexts: [], citations: 0 },
          citationCount: 0,
          citationUrls: [],
          brandCitations: [],
          competitors: [],
          sentiment: { tone: "neutral", confidence: 0.5, keywords: [] },
          timestamp: new Date().toISOString(),
          isMentioned: true,
          mentionCount: 1,
          isCited: false,
          citationDetails: [],
          competitorDetails: [],
        },
      ];

      const competitive = engine.performCompetitiveAnalysis(analyses, prompts);

      expect(competitive.whiteSpaceTopics).toContain("White space question?");
      expect(competitive.whiteSpaceTopics).not.toContain("Mentioned question?");
    });

    it("should identify dominated prompts", () => {
      const prompts: Prompt[] = [
        {
          id: "prompt_1",
          categoryId: "cat_1",
          question: "Dominated question?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
      ];

      const analyses: PromptAnalysis[] = [
        {
          promptId: "prompt_1",
          brandMentions: { exact: 0, fuzzy: 0, contexts: [], citations: 0 },
          citationCount: 0,
          citationUrls: [],
          brandCitations: [],
          competitors: [
            {
              name: "Competitor",
              count: 5,
              contexts: [],
              citations: [],
            },
          ],
          sentiment: { tone: "neutral", confidence: 0.5, keywords: [] },
          timestamp: new Date().toISOString(),
          isMentioned: false,
          mentionCount: 0,
          isCited: false,
          citationDetails: [],
          competitorDetails: [],
        },
      ];

      const competitive = engine.performCompetitiveAnalysis(analyses, prompts);

      expect(competitive.dominatedPrompts).toContain("prompt_1");
    });

    it("should identify missing brand prompts", () => {
      const prompts: Prompt[] = [
        {
          id: "prompt_1",
          categoryId: "cat_1",
          question: "Missing brand question?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
        {
          id: "prompt_2",
          categoryId: "cat_1",
          question: "Mentioned question?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
      ];

      const analyses: PromptAnalysis[] = [
        {
          promptId: "prompt_1",
          brandMentions: { exact: 0, fuzzy: 0, contexts: [], citations: 0 },
          citationCount: 0,
          citationUrls: [],
          brandCitations: [],
          competitors: [],
          sentiment: { tone: "neutral", confidence: 0.5, keywords: [] },
          timestamp: new Date().toISOString(),
          isMentioned: false,
          mentionCount: 0,
          isCited: false,
          citationDetails: [],
          competitorDetails: [],
        },
        {
          promptId: "prompt_2",
          brandMentions: { exact: 1, fuzzy: 0, contexts: [], citations: 0 },
          citationCount: 0,
          citationUrls: [],
          brandCitations: [],
          competitors: [],
          sentiment: { tone: "neutral", confidence: 0.5, keywords: [] },
          timestamp: new Date().toISOString(),
          isMentioned: true,
          mentionCount: 1,
          isCited: false,
          citationDetails: [],
          competitorDetails: [],
        },
      ];

      const competitive = engine.performCompetitiveAnalysis(analyses, prompts);

      expect(competitive.missingBrandPrompts).toContain("prompt_1");
      expect(competitive.missingBrandPrompts).not.toContain("prompt_2");
    });
  });

  describe("Architectural patterns", () => {
    it("should use composition for different detectors", () => {
      // Engine composes BrandMentionDetector, CompetitorDetector, SentimentAnalyzer
      // Each handles a single responsibility
      expect(engine).toBeDefined();
    });

    it("should aggregate individual analyses into metrics", () => {
      // Individual prompt analyses are aggregated into category-level metrics
      const prompts: Prompt[] = [
        {
          id: "prompt_1",
          categoryId: "cat_1",
          question: "Question?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
      ];

      const analyses: PromptAnalysis[] = [
        {
          promptId: "prompt_1",
          brandMentions: { exact: 1, fuzzy: 0, contexts: [], citations: 0 },
          citationCount: 2,
          citationUrls: [],
          brandCitations: [],
          competitors: [],
          sentiment: { tone: "positive", confidence: 0.8, keywords: [] },
          timestamp: new Date().toISOString(),
          isMentioned: true,
          mentionCount: 1,
          isCited: false,
          citationDetails: [],
          competitorDetails: [],
        },
      ];

      const metrics = engine.calculateCategoryMetrics("cat_1", prompts, analyses);

      // Metrics are calculated from individual analyses
      expect(metrics.visibilityScore).toBeGreaterThan(0);
    });

    it("should use strategy pattern for different analysis types", () => {
      // Different detectors use different strategies:
      // - BrandMentionDetector: Pattern matching
      // - CompetitorDetector: Entity extraction
      // - SentimentAnalyzer: Sentiment analysis
      // Engine coordinates them all
      const prompts: Prompt[] = [
        {
          id: "prompt_1",
          categoryId: "cat_1",
          question: "Question?",
          language: "en",
          country: "US",
          intent: "high",
          createdAt: new Date().toISOString(),
        },
      ];

      const responses: LLMResponse[] = [
        {
          promptId: "prompt_1",
          outputText: "Test response",
          citations: [],
          timestamp: new Date().toISOString(),
          model: "gpt-4o",
        },
      ];

      const analyses = engine.analyzeResponses(prompts, responses);

      // All strategies are applied
      expect(analyses[0].brandMentions).toBeDefined();
      expect(analyses[0].competitors).toBeDefined();
      expect(analyses[0].sentiment).toBeDefined();
    });
  });
});
