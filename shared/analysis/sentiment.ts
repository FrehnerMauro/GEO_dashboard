/**
 * Sentiment analysis module
 */

import type { LLMResponse, SentimentAnalysis } from "../types.js";

export class SentimentAnalyzer {
  private readonly positiveKeywords = [
    "excellent",
    "great",
    "best",
    "top",
    "leading",
    "outstanding",
    "superior",
    "recommended",
    "popular",
    "trusted",
    "reliable",
    "innovative",
    "effective",
    "efficient",
    "powerful",
    "comprehensive",
    "advanced",
    "professional",
    "quality",
    "expert",
  ];

  private readonly negativeKeywords = [
    "poor",
    "bad",
    "worst",
    "limited",
    "lacks",
    "missing",
    "inadequate",
    "insufficient",
    "problematic",
    "difficult",
    "complex",
    "expensive",
    "overpriced",
    "slow",
    "unreliable",
    "outdated",
    "inferior",
    "weak",
    "flawed",
    "disappointing",
  ];

  analyzeSentiment(response: LLMResponse): SentimentAnalysis {
    const text = response.outputText.toLowerCase();
    const words = text.split(/\s+/);

    let positiveScore = 0;
    let negativeScore = 0;
    const foundKeywords: string[] = [];

    for (const word of words) {
      const cleanWord = word.replace(/[.,!?;:]/g, "");

      if (this.positiveKeywords.includes(cleanWord)) {
        positiveScore++;
        if (!foundKeywords.includes(cleanWord)) {
          foundKeywords.push(cleanWord);
        }
      }

      if (this.negativeKeywords.includes(cleanWord)) {
        negativeScore++;
        if (!foundKeywords.includes(cleanWord)) {
          foundKeywords.push(cleanWord);
        }
      }
    }

    // Determine tone
    let tone: SentimentAnalysis["tone"];
    const totalScore = positiveScore + negativeScore;

    if (totalScore === 0) {
      tone = "neutral";
    } else if (positiveScore > negativeScore * 2) {
      tone = "positive";
    } else if (negativeScore > positiveScore * 2) {
      tone = "negative";
    } else {
      tone = "mixed";
    }

    // Calculate confidence based on keyword density
    const confidence = Math.min(
      totalScore / Math.max(words.length / 100, 1),
      1.0
    );

    return {
      tone,
      confidence: Math.max(confidence, 0.1), // Minimum confidence
      keywords: foundKeywords.slice(0, 10),
    };
  }
}







