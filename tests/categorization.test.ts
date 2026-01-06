/**
 * Unit tests for category generation
 */

import { describe, it, expect } from "vitest";
import { CategoryGenerator } from "../src/categorization/index.js";
import type { WebsiteContent } from "../src/types.js";

describe("CategoryGenerator", () => {
  const generator = new CategoryGenerator();

  it("should generate categories from website content", () => {
    const content: WebsiteContent = {
      rootDomain: "example.com",
      pages: [
        {
          url: "https://example.com",
          title: "Product Features",
          headings: ["Features", "Pricing", "Support"],
          content: "Our product has many features. Check our pricing plans. Contact support for help.",
          topics: ["product", "pricing", "support"],
          entities: ["Product", "Support"],
          language: "en",
        },
      ],
      normalizedContent: "product features pricing support",
      language: "en",
    };

    const categories = generator.generateCategories(content, 0.3, 10);

    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]).toHaveProperty("id");
    expect(categories[0]).toHaveProperty("name");
    expect(categories[0]).toHaveProperty("confidence");
    expect(categories[0].confidence).toBeGreaterThanOrEqual(0.3);
  });

  it("should respect minConfidence threshold", () => {
    const content: WebsiteContent = {
      rootDomain: "example.com",
      pages: [
        {
          url: "https://example.com",
          title: "Home",
          headings: [],
          content: "Welcome to our website",
          topics: [],
          entities: [],
          language: "en",
        },
      ],
      normalizedContent: "welcome website",
      language: "en",
    };

    const categories = generator.generateCategories(content, 0.9, 10);

    // Should filter out low-confidence categories
    categories.forEach((cat) => {
      expect(cat.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  it("should respect maxCategories limit", () => {
    const content: WebsiteContent = {
      rootDomain: "example.com",
      pages: [
        {
          url: "https://example.com",
          title: "Comprehensive Product",
          headings: ["Product", "Pricing", "Comparison", "Use Cases", "Industry", "Problems", "Integration", "Support"],
          content: "product pricing comparison use cases industry problems integration support",
          topics: ["product", "pricing", "comparison"],
          entities: [],
          language: "en",
        },
      ],
      normalizedContent: "product pricing comparison use cases industry problems integration support",
      language: "en",
    };

    const categories = generator.generateCategories(content, 0.3, 3);

    expect(categories.length).toBeLessThanOrEqual(3);
  });
});







