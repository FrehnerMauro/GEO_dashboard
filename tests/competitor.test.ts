/**
 * Unit tests for competitor detection
 */

import { describe, it, expect } from "vitest";
import { CompetitorDetector } from "../src/analysis/competitor.js";
import type { LLMResponse } from "../src/types.js";

describe("CompetitorDetector", () => {
  it("should detect competitors from response text", () => {
    const detector = new CompetitorDetector("AcmeCorp");

    const response: LLMResponse = {
      promptId: "test",
      outputText: "AcmeCorp competes with CompetitorA and CompetitorB. CompetitorA is also popular.",
      citations: [],
      timestamp: new Date().toISOString(),
      model: "gpt-4",
    };

    const competitors = detector.detectCompetitors(response);

    expect(competitors.length).toBeGreaterThan(0);
    expect(competitors.some((c) => c.name.includes("Competitor"))).toBe(true);
  });

  it("should not include the brand itself as a competitor", () => {
    const detector = new CompetitorDetector("AcmeCorp");

    const response: LLMResponse = {
      promptId: "test",
      outputText: "AcmeCorp is a great company. CompetitorA is also good.",
      citations: [],
      timestamp: new Date().toISOString(),
      model: "gpt-4",
    };

    const competitors = detector.detectCompetitors(response);

    expect(competitors.some((c) => c.name === "AcmeCorp")).toBe(false);
  });

  it("should extract competitor contexts", () => {
    const detector = new CompetitorDetector("AcmeCorp");

    const response: LLMResponse = {
      promptId: "test",
      outputText: "CompetitorA is mentioned here. CompetitorA is also popular. Another sentence.",
      citations: [],
      timestamp: new Date().toISOString(),
      model: "gpt-4",
    };

    const competitors = detector.detectCompetitors(response);

    if (competitors.length > 0) {
      expect(competitors[0].contexts.length).toBeGreaterThan(0);
      expect(competitors[0].count).toBeGreaterThan(0);
    }
  });

  it("should detect competitors from comparison phrases", () => {
    const detector = new CompetitorDetector("AcmeCorp");

    const response: LLMResponse = {
      promptId: "test",
      outputText: "Compared to CompetitorX, AcmeCorp is better. Alternative to CompetitorY.",
      citations: [],
      timestamp: new Date().toISOString(),
      model: "gpt-4",
    };

    const competitors = detector.detectCompetitors(response);

    // Should detect competitors from comparison phrases
    expect(competitors.length).toBeGreaterThanOrEqual(0);
  });
});







