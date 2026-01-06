/**
 * Brand mention detection module
 */

import type { LLMResponse, BrandMention } from "../types.js";

export class BrandMentionDetector {
  constructor(
    private brandName: string,
    private fuzzyThreshold: number = 0.7
  ) {}

  detectMentions(response: LLMResponse): BrandMention {
    const text = response.outputText.toLowerCase();
    const brandLower = this.brandName.toLowerCase();

    // Exact mentions
    const exactMatches = this.countExactMatches(text, brandLower);

    // Fuzzy mentions (similarity-based)
    const fuzzyMatches = this.countFuzzyMatches(text, brandLower);

    // Extract contexts
    const contexts = this.extractContexts(response.outputText, brandLower);

    return {
      exact: exactMatches,
      fuzzy: fuzzyMatches,
      contexts,
    };
  }

  private countExactMatches(text: string, brandLower: string): number {
    const regex = new RegExp(`\\b${this.escapeRegex(brandLower)}\\b`, "gi");
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  private countFuzzyMatches(text: string, brandLower: string): number {
    const words = text.split(/\s+/);
    let fuzzyCount = 0;

    for (const word of words) {
      const similarity = this.calculateSimilarity(word, brandLower);
      if (similarity >= this.fuzzyThreshold && similarity < 1.0) {
        fuzzyCount++;
      }
    }

    return fuzzyCount;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private extractContexts(text: string, brandLower: string): string[] {
    const contexts: string[] = [];
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(brandLower)) {
        contexts.push(sentence.trim());
      }
    }

    return contexts.slice(0, 5); // Limit to 5 contexts
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}







