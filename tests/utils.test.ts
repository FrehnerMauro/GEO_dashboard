/**
 * Unit tests for utility functions
 * 
 * Architectural decisions demonstrated:
 * - Pure functions: No side effects, easy to test
 * - Text processing: Efficient regex-based extraction
 * - Edge case handling: Handles null, empty, and malformed input
 */

import { describe, it, expect } from "vitest";
import { extractConclusion, extractTextStats } from "../shared/utils/text-extraction.js";

describe("Text Extraction Utilities", () => {
  describe("extractConclusion", () => {
    it("should extract '## Empfehlung' section", () => {
      const text = `
# Introduction
Some introduction text here.

## Empfehlung
This is the recommendation section that should be extracted.
It contains important conclusions.

## Other Section
This should not be included.
      `;

      const result = extractConclusion(text);

      expect(result).toContain("recommendation section");
      expect(result).not.toContain("Other Section");
    });

    it("should extract '## Fazit' section", () => {
      const text = `
# Introduction
Some text.

## Fazit
This is the conclusion in German.
It should be extracted.

## Next Section
Not included.
      `;

      const result = extractConclusion(text);

      expect(result).toContain("conclusion in German");
      expect(result).not.toContain("Next Section");
    });

    it("should extract '## Conclusion' section (English)", () => {
      const text = `
# Main Content
Content here.

## Conclusion
This is the English conclusion.
Important points here.
      `;

      const result = extractConclusion(text);

      expect(result).toContain("English conclusion");
    });

    it("should return entire text if no conclusion section found", () => {
      const text = "This is just regular text without any conclusion section.";

      const result = extractConclusion(text);

      expect(result).toBe(text);
    });

    it("should handle null input", () => {
      const result = extractConclusion(null);
      expect(result).toBeNull();
    });

    it("should handle empty string", () => {
      const result = extractConclusion("");
      expect(result).toBe("");
    });

    it("should handle whitespace-only input", () => {
      const result = extractConclusion("   \n\n   ");
      expect(result?.trim()).toBe("");
    });
  });

  describe("extractTextStats", () => {
    it("should count brand citations correctly", () => {
      const text = `
This is some text about FrehnerTec.
[FrehnerTec website](https://www.frehnertec.ch) is great.
More text here. [Another link](https://www.frehnertec.ch/about) to FrehnerTec.
      `;
      const brandName = "FrehnerTec";

      const stats = extractTextStats(text, brandName);

      expect(stats.citations).toBe(2); // Two markdown links to frehnertec.ch
      expect(stats.citationUrls.length).toBe(2);
      expect(stats.citationUrls).toContain("https://www.frehnertec.ch");
      expect(stats.citationUrls).toContain("https://www.frehnertec.ch/about");
    });

    it("should count brand mentions outside citations", () => {
      const text = `
FrehnerTec is mentioned here.
[FrehnerTec website](https://www.frehnertec.ch) is a link.
More text with FrehnerTec here.
      `;
      const brandName = "FrehnerTec";

      const stats = extractTextStats(text, brandName);

      // "FrehnerTec" appears 3 times:
      // 1. "FrehnerTec is mentioned" - mention (not in citation)
      // 2. "[FrehnerTec website]" - in citation (not counted as mention)
      // 3. "with FrehnerTec" - mention (not in citation)
      // So mentions should be 2
      expect(stats.mentions).toBe(2);
      expect(stats.citations).toBe(1);
    });

    it("should count other links (non-brand)", () => {
      const text = `
[Brand link](https://www.frehnertec.ch) is a brand citation.
[Other link](https://www.example.com) is not a brand citation.
[Another](https://www.google.com) external link.
      `;
      const brandName = "FrehnerTec";

      const stats = extractTextStats(text, brandName);

      expect(stats.citations).toBe(1);
      expect(stats.otherLinks).toBe(2);
      expect(stats.otherLinkUrls).toContain("https://www.example.com");
      expect(stats.otherLinkUrls).toContain("https://www.google.com");
    });

    it("should handle case-insensitive brand matching", () => {
      const text = `
frehnertec is mentioned in lowercase.
FREHNERTEC is in uppercase.
FrehnerTec is in mixed case.
[Link](https://www.frehnertec.ch) to website.
      `;
      const brandName = "FrehnerTec";

      const stats = extractTextStats(text, brandName);

      // All variations should be counted
      expect(stats.mentions).toBeGreaterThan(0);
    });

    it("should deduplicate citation URLs", () => {
      const text = `
[Link 1](https://www.frehnertec.ch) first mention.
[Link 2](https://www.frehnertec.ch) duplicate URL.
[Link 3](https://www.frehnertec.ch/about) different path.
      `;
      const brandName = "FrehnerTec";

      const stats = extractTextStats(text, brandName);

      // Should have 2 unique citation URLs
      expect(stats.citationUrls.length).toBe(2);
      expect(stats.citations).toBe(3); // But 3 total citations
    });

    it("should handle empty text", () => {
      const stats = extractTextStats("", "BrandName");

      expect(stats.citations).toBe(0);
      expect(stats.mentions).toBe(0);
      expect(stats.otherLinks).toBe(0);
      expect(stats.citationUrls).toEqual([]);
      expect(stats.otherLinkUrls).toEqual([]);
    });

    it("should handle null text", () => {
      const stats = extractTextStats(null as any, "BrandName");

      expect(stats.citations).toBe(0);
      expect(stats.mentions).toBe(0);
      expect(stats.otherLinks).toBe(0);
    });

    it("should handle very long text efficiently", () => {
      // Create a long text (over 50KB)
      const longText = "FrehnerTec " + "x".repeat(60000);
      const brandName = "FrehnerTec";

      const startTime = Date.now();
      const stats = extractTextStats(longText, brandName);
      const duration = Date.now() - startTime;

      // Should complete quickly despite long text (due to MAX_TEXT_LENGTH limit)
      expect(duration).toBeLessThan(1000);
      expect(stats.mentions).toBeGreaterThan(0);
    });

    it("should handle brand name with spaces in URL", () => {
      const text = `
[Brand link](https://www.frehnertec.ch) is a citation.
More text about Frehner Tec here.
      `;
      const brandName = "Frehner Tec"; // Brand name with space

      const stats = extractTextStats(text, brandName);

      // Should match "frehnertec" in URL (spaces removed for URL matching)
      expect(stats.citations).toBe(1);
      // Should also match "Frehner Tec" in text (with space)
      expect(stats.mentions).toBeGreaterThan(0);
    });

    it("should not count mentions inside citation markdown", () => {
      const text = `
FrehnerTec is mentioned here (should count).
[FrehnerTec website](https://www.frehnertec.ch) More FrehnerTec text (should count).
      `;
      const brandName = "FrehnerTec";

      const stats = extractTextStats(text, brandName);

      // Only mentions outside citations should count
      // "FrehnerTec is mentioned" - count (outside citation)
      // "[FrehnerTec website]" - in citation markdown, don't count as mention
      // "More FrehnerTec text" - count (outside citation)
      expect(stats.mentions).toBe(2);
      expect(stats.citations).toBe(1);
    });
  });

  describe("Architectural patterns", () => {
    it("should be pure functions (no side effects)", () => {
      // Functions don't modify input or have external dependencies
      const text = "Test text";
      const result1 = extractTextStats(text, "Brand");
      const result2 = extractTextStats(text, "Brand");

      // Same input should produce same output
      expect(result1).toEqual(result2);
      expect(text).toBe("Test text"); // Input unchanged
    });

    it("should handle edge cases gracefully", () => {
      // Functions handle null, empty, and malformed input
      expect(() => extractConclusion(null)).not.toThrow();
      expect(() => extractConclusion("")).not.toThrow();
      expect(() => extractTextStats(null as any, "Brand")).not.toThrow();
      expect(() => extractTextStats("", "Brand")).not.toThrow();
    });

    it("should be efficient for large inputs", () => {
      // Functions use optimized regex and limit processing
      const largeText = "x ".repeat(100000); // ~200KB
      const startTime = Date.now();
      extractTextStats(largeText, "Brand");
      const duration = Date.now() - startTime;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000);
    });
  });
});
