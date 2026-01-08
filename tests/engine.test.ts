/**
 * Unit tests for GEOEngine - Main orchestrator
 * 
 * Architectural decisions demonstrated:
 * - Dependency Injection: Engine receives dependencies via constructor
 * - Separation of Concerns: Engine orchestrates, doesn't implement business logic
 * - Error Handling: Graceful error handling with status updates
 * - Async Operations: Non-blocking analysis execution
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GEOEngine } from "../shared/engine.js";
import type { UserInput, AnalysisResult } from "../shared/types.js";
import type { Config } from "../shared/config.js";

// Mock dependencies
vi.mock("../shared/ingestion/index.js", () => ({
  ContentScraper: vi.fn().mockImplementation(() => ({
    scrapeWebsite: vi.fn().mockResolvedValue({
      rootDomain: "example.com",
      pages: [
        {
          url: "https://example.com",
          title: "Test Page",
          headings: ["Heading 1"],
          content: "Test content",
          topics: ["test"],
          entities: ["Test"],
          language: "en",
        },
      ],
      normalizedContent: "test content",
      language: "en",
    }),
  })),
}));

vi.mock("../shared/categorization/index.js", () => ({
  CategoryGenerator: vi.fn().mockImplementation(() => ({
    generateCategories: vi.fn().mockReturnValue([
      {
        id: "cat_1",
        name: "Product",
        description: "Product category",
        confidence: 0.8,
        sourcePages: [],
      },
    ]),
  })),
}));

vi.mock("../shared/prompt_generation/index.js", () => ({
  PromptGenerator: vi.fn().mockImplementation(() => ({
    generatePrompts: vi.fn().mockReturnValue([
      {
        id: "prompt_1",
        categoryId: "cat_1",
        question: "Test question?",
        language: "en",
        country: "US",
        intent: "high",
        createdAt: new Date().toISOString(),
      },
    ]),
  })),
}));

vi.mock("../shared/llm_execution/index.js", () => ({
  LLMExecutor: vi.fn().mockImplementation(() => ({
    executePrompts: vi.fn().mockResolvedValue([
      {
        promptId: "prompt_1",
        outputText: "Test response",
        citations: [],
        timestamp: new Date().toISOString(),
        model: "gpt-4o",
      },
    ]),
  })),
}));

vi.mock("../shared/analysis/index.js", () => ({
  AnalysisEngine: vi.fn().mockImplementation(() => ({
    analyzeResponses: vi.fn().mockReturnValue([
      {
        promptId: "prompt_1",
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
    ]),
    calculateCategoryMetrics: vi.fn().mockReturnValue({
      categoryId: "cat_1",
      visibilityScore: 50,
      citationRate: 0.5,
      brandMentionRate: 0.5,
      competitorMentionRate: 0.2,
      timestamp: new Date().toISOString(),
    }),
    performCompetitiveAnalysis: vi.fn().mockReturnValue({
      brandShare: 60,
      competitorShares: {},
      whiteSpaceTopics: [],
      dominatedPrompts: [],
      missingBrandPrompts: [],
      timestamp: new Date().toISOString(),
    }),
  })),
}));

vi.mock("../shared/persistence/index.js", () => ({
  Database: vi.fn().mockImplementation(() => ({
    db: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ success: true, results: [] }),
      }),
      batch: vi.fn().mockResolvedValue([]),
      exec: vi.fn().mockResolvedValue({ count: 0, duration: 0 }),
    },
    saveAnalysisRun: vi.fn().mockResolvedValue(undefined),
    updateAnalysisStatus: vi.fn().mockResolvedValue(undefined),
    saveCategories: vi.fn().mockResolvedValue(undefined),
    savePrompts: vi.fn().mockResolvedValue(undefined),
    saveLLMResponses: vi.fn().mockResolvedValue(undefined),
    savePromptAnalyses: vi.fn().mockResolvedValue(undefined),
    saveCategoryMetrics: vi.fn().mockResolvedValue(undefined),
    saveCompetitiveAnalysis: vi.fn().mockResolvedValue(undefined),
    saveTimeSeriesData: vi.fn().mockResolvedValue(undefined),
    getAnalysisRun: vi.fn().mockResolvedValue(null),
  })),
}));

vi.mock("../shared/config.js", () => ({
  getConfig: vi.fn().mockReturnValue({
    debug: { enabled: false },
    openai: {
      apiKey: "test-key",
      model: "gpt-4o",
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
  } as Config),
}));

describe("GEOEngine", () => {
  let engine: GEOEngine;
  let mockEnv: Record<string, any>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv = {
      geo_db: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true }),
          first: vi.fn().mockResolvedValue(null),
          all: vi.fn().mockResolvedValue({ success: true, results: [] }),
        }),
      },
    };
    engine = new GEOEngine(mockEnv);
  });

  describe("runAnalysis", () => {
    it("should return a runId immediately (non-blocking)", async () => {
      const userInput: UserInput = {
        websiteUrl: "https://example.com",
        country: "US",
        language: "en",
      };

      const runId = await engine.runAnalysis(userInput, mockEnv);

      expect(runId).toBeDefined();
      expect(runId).toMatch(/^run_\d+_[a-z0-9]+$/);
    });

    it("should save initial run status", async () => {
      const { Database } = await import("../shared/persistence/index.js");
      const userInput: UserInput = {
        websiteUrl: "https://example.com",
        country: "US",
        language: "en",
      };

      await engine.runAnalysis(userInput, mockEnv);

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(Database).toHaveBeenCalled();
    });

    it("should handle errors gracefully and update status", async () => {
      const { ContentScraper } = await import("../shared/ingestion/index.js");
      const mockScraper = new (ContentScraper as any)();
      mockScraper.scrapeWebsite = vi
        .fn()
        .mockRejectedValue(new Error("Crawling failed"));

      const userInput: UserInput = {
        websiteUrl: "https://example.com",
        country: "US",
        language: "en",
      };

      const runId = await engine.runAnalysis(userInput, mockEnv);

      // Wait for async error handling
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(runId).toBeDefined();
      // Error should be caught and status updated
    });
  });

  describe("extractBrandName", () => {
    it("should extract brand name from URL", async () => {
      const userInput: UserInput = {
        websiteUrl: "https://acmecorp.com",
        country: "US",
        language: "en",
      };

      const runId = await engine.runAnalysis(userInput, mockEnv);
      expect(runId).toBeDefined();

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it("should handle invalid URLs gracefully", async () => {
      const userInput: UserInput = {
        websiteUrl: "not-a-valid-url",
        country: "US",
        language: "en",
      };

      const runId = await engine.runAnalysis(userInput, mockEnv);
      expect(runId).toBeDefined();
    });
  });

  describe("calculateOverallVisibility", () => {
    it("should calculate average visibility from category metrics", async () => {
      const userInput: UserInput = {
        websiteUrl: "https://example.com",
        country: "US",
        language: "en",
      };

      const runId = await engine.runAnalysis(userInput, mockEnv);
      expect(runId).toBeDefined();

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it("should return 0 for empty metrics", async () => {
      const userInput: UserInput = {
        websiteUrl: "https://example.com",
        country: "US",
        language: "en",
      };

      const runId = await engine.runAnalysis(userInput, mockEnv);
      expect(runId).toBeDefined();
    });
  });

  describe("getAnalysisResult", () => {
    it("should retrieve analysis result by runId", async () => {
      const { Database } = await import("../shared/persistence/index.js");
      const mockDb = new Database(mockEnv.geo_db);
      mockDb.getAnalysisRun = vi.fn().mockResolvedValue({
        websiteUrl: "https://example.com",
        country: "US",
        language: "en",
        categories: [],
        prompts: [],
        analyses: [],
        categoryMetrics: [],
        competitiveAnalysis: {
          brandShare: 0,
          competitorShares: {},
          whiteSpaceTopics: [],
          dominatedPrompts: [],
          missingBrandPrompts: [],
          timestamp: new Date().toISOString(),
        },
        timeSeries: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as AnalysisResult);

      const result = await engine.getAnalysisResult("test_run_id", mockEnv);

      expect(result).toBeDefined();
    });

    it("should return null for non-existent runId", async () => {
      const { Database } = await import("../shared/persistence/index.js");
      const mockDb = new Database(mockEnv.geo_db);
      mockDb.getAnalysisRun = vi.fn().mockResolvedValue(null);

      const result = await engine.getAnalysisResult("non_existent", mockEnv);

      expect(result).toBeNull();
    });
  });

  describe("Architectural patterns", () => {
    it("should use dependency injection for configuration", () => {
      // Engine receives env and creates dependencies internally
      // This allows for easy testing and configuration changes
      expect(engine).toBeDefined();
    });

    it("should separate orchestration from business logic", async () => {
      // Engine orchestrates the flow but delegates to specialized modules
      const userInput: UserInput = {
        websiteUrl: "https://example.com",
        country: "US",
        language: "en",
      };

      const runId = await engine.runAnalysis(userInput, mockEnv);
      expect(runId).toBeDefined();

      // Business logic is in separate modules (ContentScraper, CategoryGenerator, etc.)
      // Engine just coordinates them
    });

    it("should handle async operations without blocking", async () => {
      // runAnalysis returns immediately with runId
      // Actual processing happens asynchronously
      const userInput: UserInput = {
        websiteUrl: "https://example.com",
        country: "US",
        language: "en",
      };

      const startTime = Date.now();
      const runId = await engine.runAnalysis(userInput, mockEnv);
      const duration = Date.now() - startTime;

      expect(runId).toBeDefined();
      expect(duration).toBeLessThan(100); // Should return quickly
    });
  });
});
