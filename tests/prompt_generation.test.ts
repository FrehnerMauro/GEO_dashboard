/**
 * Unit tests for prompt generation
 */

import { describe, it, expect } from "vitest";
import { PromptGenerator } from "../shared/prompt_generation/index.js";
import type { Category, UserInput } from "../shared/types.js";

describe("PromptGenerator", () => {
  const generator = new PromptGenerator();

  it("should generate prompts for categories", () => {
    const categories: Category[] = [
      {
        id: "cat_product_123",
        name: "Product",
        description: "Product features",
        confidence: 0.8,
        sourcePages: ["https://example.com"],
      },
    ];

    const userInput: UserInput = {
      websiteUrl: "https://example.com",
      country: "US",
      language: "en",
    };

    const prompts = generator.generatePrompts(categories, userInput, 5);

    expect(prompts.length).toBe(5);
    expect(prompts[0]).toHaveProperty("id");
    expect(prompts[0]).toHaveProperty("categoryId", "cat_product_123");
    expect(prompts[0]).toHaveProperty("question");
    expect(prompts[0]).toHaveProperty("language", "en");
    expect(prompts[0]).toHaveProperty("country", "US");
    expect(prompts[0].question).toContain("US");
  });

  it("should generate language-specific prompts", () => {
    const categories: Category[] = [
      {
        id: "cat_product_123",
        name: "Product",
        description: "Product features",
        confidence: 0.8,
        sourcePages: [],
      },
    ];

    const userInput: UserInput = {
      websiteUrl: "https://example.com",
      country: "DE",
      language: "de",
    };

    const prompts = generator.generatePrompts(categories, userInput, 3);

    expect(prompts.length).toBe(3);
    expect(prompts[0].language).toBe("de");
    // German prompts should contain German words
    expect(prompts[0].question).toMatch(/[äöüÄÖÜß]|Was|Wie|Welche/i);
  });

  it("should generate prompts with region awareness", () => {
    const categories: Category[] = [
      {
        id: "cat_product_123",
        name: "Product",
        description: "Product features",
        confidence: 0.8,
        sourcePages: [],
      },
    ];

    const userInput: UserInput = {
      websiteUrl: "https://example.com",
      country: "CH",
      region: "Zurich",
      language: "en",
    };

    const prompts = generator.generatePrompts(categories, userInput, 2);

    expect(prompts[0].region).toBe("Zurich");
  });

  it("should assign intent levels", () => {
    const categories: Category[] = [
      {
        id: "cat_pricing_123",
        name: "Pricing",
        description: "Pricing information",
        confidence: 0.8,
        sourcePages: [],
      },
    ];

    const userInput: UserInput = {
      websiteUrl: "https://example.com",
      country: "US",
      language: "en",
    };

    const prompts = generator.generatePrompts(categories, userInput, 5);

    prompts.forEach((prompt) => {
      expect(["high", "medium", "low"]).toContain(prompt.intent);
    });
  });
});







