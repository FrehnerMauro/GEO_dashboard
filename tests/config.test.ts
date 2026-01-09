/**
 * Unit tests for Config - Configuration management
 * 
 * Architectural decisions demonstrated:
 * - Environment-based configuration: Reads from env variables
 * - Default values: Sensible defaults when env vars are missing
 * - Type safety: Strongly typed configuration
 * - Debug mode: Special mode for development/testing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getConfig, type Config } from "../shared/config.js";

describe("Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getConfig", () => {
    it("should read configuration from environment variables", () => {
      process.env.OPENAI_API_KEY = "test-api-key";
      process.env.OPENAI_MODEL = "gpt-4o";
      process.env.MAX_PAGES = "100";
      process.env.MAX_DEPTH = "5";
      process.env.CRAWL_TIMEOUT = "60000";
      process.env.USER_AGENT = "CustomBot/2.0";
      process.env.RE_RUN_SCHEDULE = "daily";
      process.env.BRAND_FUZZY_THRESHOLD = "0.8";
      process.env.SENTIMENT_CONFIDENCE_THRESHOLD = "0.7";
      process.env.MIN_CATEGORY_CONFIDENCE = "0.6";
      process.env.MAX_CATEGORIES = "20";
      process.env.QUESTIONS_PER_CATEGORY = "10";
      process.env.MIN_INTENT_SCORE = "0.8";

      const config = getConfig(process.env);

      expect(config.openai.apiKey).toBe("test-api-key");
      expect(config.openai.model).toBe("gpt-4o");
      expect(config.crawling.maxPages).toBe(100);
      expect(config.crawling.maxDepth).toBe(5);
      expect(config.crawling.timeout).toBe(60000);
      expect(config.crawling.userAgent).toBe("CustomBot/2.0");
      expect(config.analysis.reRunSchedule).toBe("daily");
      expect(config.analysis.brandFuzzyThreshold).toBe(0.8);
      expect(config.analysis.sentimentConfidenceThreshold).toBe(0.7);
      expect(config.categories.minConfidence).toBe(0.6);
      expect(config.categories.maxCategories).toBe(20);
      expect(config.prompts.questionsPerCategory).toBe(10);
      expect(config.prompts.minIntentScore).toBe(0.8);
    });

    it("should use default values when env vars are missing", () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_MODEL;
      delete process.env.MAX_PAGES;

      const config = getConfig(process.env);

      expect(config.openai.apiKey).toBe("");
      expect(config.openai.model).toBe("gpt-4o");
      expect(config.crawling.maxPages).toBe(50);
      expect(config.crawling.maxDepth).toBe(3);
      expect(config.crawling.timeout).toBe(30000);
      expect(config.crawling.userAgent).toBe("GEO-Platform/1.0");
    });

    it("should parse numeric values correctly", () => {
      process.env.MAX_PAGES = "75";
      process.env.MAX_DEPTH = "4";
      process.env.CRAWL_TIMEOUT = "45000";
      process.env.BRAND_FUZZY_THRESHOLD = "0.75";
      process.env.SENTIMENT_CONFIDENCE_THRESHOLD = "0.65";
      process.env.MIN_CATEGORY_CONFIDENCE = "0.55";
      process.env.MAX_CATEGORIES = "15";
      process.env.QUESTIONS_PER_CATEGORY = "7";
      process.env.MIN_INTENT_SCORE = "0.75";

      const config = getConfig(process.env);

      expect(typeof config.crawling.maxPages).toBe("number");
      expect(config.crawling.maxPages).toBe(75);
      expect(typeof config.crawling.maxDepth).toBe("number");
      expect(config.crawling.maxDepth).toBe(4);
      expect(typeof config.crawling.timeout).toBe("number");
      expect(config.crawling.timeout).toBe(45000);
      expect(typeof config.analysis.brandFuzzyThreshold).toBe("number");
      expect(config.analysis.brandFuzzyThreshold).toBe(0.75);
    });

    it("should handle debug mode correctly", () => {
      process.env.DEBUG_MODE = "true";
      const config = getConfig(process.env);
      expect(config.debug.enabled).toBe(true);

      process.env.DEBUG_MODE = "1";
      const config2 = getConfig(process.env);
      expect(config2.debug.enabled).toBe(true);

      process.env.DEBUG_MODE = "false";
      const config3 = getConfig(process.env);
      expect(config3.debug.enabled).toBe(false);

      delete process.env.DEBUG_MODE;
      const config4 = getConfig(process.env);
      expect(config4.debug.enabled).toBe(false);
    });

    it("should have correct API URL", () => {
      const config = getConfig(process.env);
      expect(config.openai.responsesApiUrl).toBe("https://api.openai.com/v1/responses");
    });

    it("should have valid default schedule", () => {
      const config = getConfig(process.env);
      expect(["daily", "weekly"]).toContain(config.analysis.reRunSchedule);
    });
  });

  describe("Type safety", () => {
    it("should return strongly typed config", () => {
      const config = getConfig(process.env);

      // TypeScript should enforce these types
      expect(typeof config.debug.enabled).toBe("boolean");
      expect(typeof config.openai.apiKey).toBe("string");
      expect(typeof config.openai.model).toBe("string");
      expect(typeof config.crawling.maxPages).toBe("number");
      expect(typeof config.crawling.maxDepth).toBe("number");
      expect(typeof config.crawling.timeout).toBe("number");
      expect(typeof config.analysis.reRunSchedule).toBe("string");
      expect(typeof config.analysis.brandFuzzyThreshold).toBe("number");
      expect(typeof config.categories.minConfidence).toBe("number");
      expect(typeof config.prompts.questionsPerCategory).toBe("number");
    });
  });

  describe("Architectural patterns", () => {
    it("should centralize configuration management", () => {
      // All configuration is managed in one place
      // Makes it easy to change defaults or add new config options
      const config = getConfig(process.env);
      expect(config).toBeDefined();
      expect(config.openai).toBeDefined();
      expect(config.crawling).toBeDefined();
      expect(config.analysis).toBeDefined();
      expect(config.categories).toBeDefined();
      expect(config.prompts).toBeDefined();
    });

    it("should support environment-specific configuration", () => {
      // Different environments can have different configs via env vars
      process.env.OPENAI_MODEL = "gpt-4o-mini";
      const devConfig = getConfig(process.env);
      expect(devConfig.openai.model).toBe("gpt-4o-mini");

      process.env.OPENAI_MODEL = "gpt-5";
      const prodConfig = getConfig(process.env);
      expect(prodConfig.openai.model).toBe("gpt-5");
    });

    it("should provide sensible defaults", () => {
      // Defaults allow the system to work out of the box
      const config = getConfig({});
      expect(config.crawling.maxPages).toBe(50);
      expect(config.crawling.maxDepth).toBe(3);
      expect(config.categories.maxCategories).toBe(10);
      expect(config.prompts.questionsPerCategory).toBe(5);
    });
  });
});
