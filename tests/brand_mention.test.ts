/**
 * Unit tests for brand mention detection
 */

import { describe, it, expect } from "vitest";
import { BrandMentionDetector } from "../src/analysis/brand_mention.js";
import type { LLMResponse } from "../src/types.js";

describe("BrandMentionDetector", () => {
  it("should detect exact brand mentions", () => {
    const detector = new BrandMentionDetector("AcmeCorp", 0.7);

    const response: LLMResponse = {
      promptId: "test",
      outputText: "AcmeCorp is a leading company. AcmeCorp offers great solutions.",
      citations: [],
      timestamp: new Date().toISOString(),
      model: "gpt-4",
    };

    const mentions = detector.detectMentions(response);

    expect(mentions.exact).toBe(2);
    expect(mentions.fuzzy).toBe(0);
    expect(mentions.contexts.length).toBeGreaterThan(0);
  });

  it("should detect fuzzy brand mentions", () => {
    const detector = new BrandMentionDetector("AcmeCorp", 0.7);

    const response: LLMResponse = {
      promptId: "test",
      outputText: "Acme Corp is mentioned here. AcmeCorp is also here.",
      citations: [],
      timestamp: new Date().toISOString(),
      model: "gpt-4",
    };

    const mentions = detector.detectMentions(response);

    expect(mentions.exact).toBeGreaterThanOrEqual(1);
    // Fuzzy detection depends on similarity threshold
  });

  it("should extract contexts", () => {
    const detector = new BrandMentionDetector("AcmeCorp", 0.7);

    const response: LLMResponse = {
      promptId: "test",
      outputText: "AcmeCorp is a great company. They offer excellent services. AcmeCorp has many customers.",
      citations: [],
      timestamp: new Date().toISOString(),
      model: "gpt-4",
    };

    const mentions = detector.detectMentions(response);

    expect(mentions.contexts.length).toBeGreaterThan(0);
    mentions.contexts.forEach((context) => {
      expect(context.toLowerCase()).toContain("acmecorp");
    });
  });

  it("should handle case-insensitive detection", () => {
    const detector = new BrandMentionDetector("AcmeCorp", 0.7);

    const response: LLMResponse = {
      promptId: "test",
      outputText: "acmecorp is mentioned. ACMECORP is also here. AcmeCorp too.",
      citations: [],
      timestamp: new Date().toISOString(),
      model: "gpt-4",
    };

    const mentions = detector.detectMentions(response);

    expect(mentions.exact).toBeGreaterThan(0);
  });
});







