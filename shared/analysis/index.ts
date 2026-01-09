/**
 * Analysis module entry point
 */

import type {
  Prompt,
  LLMResponse,
  PromptAnalysis,
  CategoryMetrics,
  CompetitiveAnalysis,
  BrandCitation,
} from "../types.js";
import { BrandMentionDetector } from "./brand_mention.js";
import { SentimentAnalyzer } from "./sentiment.js";

export class AnalysisEngine {
  private brandMentionDetector: BrandMentionDetector;
  private sentimentAnalyzer: SentimentAnalyzer;
  private brandName: string;

  constructor(
    brandName: string,
    fuzzyThreshold: number = 0.7
  ) {
    this.brandName = brandName;
    this.brandMentionDetector = new BrandMentionDetector(
      brandName,
      fuzzyThreshold
    );
    this.sentimentAnalyzer = new SentimentAnalyzer();
  }

  analyzeResponses(
    prompts: Prompt[],
    responses: LLMResponse[]
  ): PromptAnalysis[] {
    const analyses: PromptAnalysis[] = [];

    for (const prompt of prompts) {
      const response = responses.find((r) => r.promptId === prompt.id);
      if (!response) continue;

      const analysis = this.analyzeSingleResponse(prompt, response);
      analyses.push(analysis);
    }

    return analyses;
  }

  private analyzeSingleResponse(
    prompt: Prompt,
    response: LLMResponse
  ): PromptAnalysis {
    const brandMentions = this.brandMentionDetector.detectMentions(response);
    const sentiment = this.sentimentAnalyzer.analyzeSentiment(response);
    
    // Find citations where the brand is mentioned
    const brandCitations = this.findBrandCitations(response);
    
    // Calculate structured answers
    const isMentioned = brandMentions.exact > 0 || brandMentions.fuzzy > 0;
    const mentionCount = brandMentions.exact + brandMentions.fuzzy;
    const isCited = brandCitations.length > 0;
    
    // Citation details (where and what)
    const citationDetails = brandCitations.map(c => ({
      url: c.url,
      title: c.title,
      snippet: c.snippet,
    }));

    return {
      promptId: prompt.id,
      brandMentions,
      citationCount: response.citations.length,
      citationUrls: response.citations.map((c) => c.url),
      brandCitations,
      sentiment,
      timestamp: response.timestamp,
      // Structured answers
      isMentioned,
      mentionCount,
      isCited,
      citationDetails,
    };
  }
  
  private findBrandCitations(response: LLMResponse): BrandCitation[] {
    const brandLower = this.brandName.toLowerCase();
    const brandInUrl = brandLower.replace(/\s+/g, ""); // Remove spaces for URL matching
    const brandCitations: BrandCitation[] = [];
    
    for (const citation of response.citations) {
      const citationText = `${citation.title || ""} ${citation.snippet || ""}`.toLowerCase();
      const urlLower = citation.url.toLowerCase();
      
      // Check if brand is mentioned in citation title, snippet, or URL
      const mentionedInText = citationText.includes(brandLower);
      const mentionedInUrl = urlLower.includes(brandInUrl);
      
      if (mentionedInText || mentionedInUrl) {
        // Extract context where brand is mentioned
        let context = "";
        if (mentionedInText) {
          context = this.extractBrandContextFromCitation(citation, brandLower);
        } else if (mentionedInUrl) {
          // Find context in the main text where this URL is referenced
          context = this.findUrlContextInText(response.outputText, citation.url);
        }
        
        brandCitations.push({
          url: citation.url,
          title: citation.title,
          snippet: citation.snippet,
          context,
        });
      }
    }
    
    return brandCitations;
  }
  
  private findUrlContextInText(text: string, url: string): string {
    // Find markdown links or plain URLs in text
    // Pattern: [text](url) or just url
    const urlPattern = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const markdownPattern = new RegExp(`\\[([^\\]]+)\\]\\(${urlPattern}\\)`, "i");
    const match = text.match(markdownPattern);
    
    if (match && match[1]) {
      return match[1]; // Return the link text
    }
    
    // Try to find sentence containing the URL
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.includes(url)) {
        return sentence.trim();
      }
    }
    
    return "";
  }
  
  private extractBrandContextFromCitation(
    citation: { title?: string; snippet?: string },
    brandLower: string
  ): string | undefined {
    const text = `${citation.title || ""} ${citation.snippet || ""}`;
    const sentences = text.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(brandLower)) {
        return sentence.trim();
      }
    }
    
    return undefined;
  }

  calculateCategoryMetrics(
    categoryId: string,
    prompts: Prompt[],
    analyses: PromptAnalysis[]
  ): CategoryMetrics {
    const categoryPrompts = prompts.filter((p) => p.categoryId === categoryId);
    const categoryAnalyses = analyses.filter((a) =>
      categoryPrompts.some((p) => p.id === a.promptId)
    );

    if (categoryAnalyses.length === 0) {
      return {
        categoryId,
        visibilityScore: 0,
        citationRate: 0,
        brandMentionRate: 0,
        timestamp: new Date().toISOString(),
      };
    }

    const totalPrompts = categoryPrompts.length;
    const promptsWithBrandMentions = categoryAnalyses.filter(
      (a) => a.brandMentions.exact > 0 || a.brandMentions.fuzzy > 0
    ).length;
    const totalCitations = categoryAnalyses.reduce(
      (sum, a) => sum + a.citationCount,
      0
    );

    const visibilityScore = this.calculateVisibilityScore(categoryAnalyses);
    const citationRate = totalCitations / totalPrompts;
    const brandMentionRate = promptsWithBrandMentions / totalPrompts;

    return {
      categoryId,
      visibilityScore,
      citationRate,
      brandMentionRate,
      timestamp: new Date().toISOString(),
    };
  }

  private calculateVisibilityScore(analyses: PromptAnalysis[]): number {
    // Visibility score based on:
    // - Brand mentions (weighted)
    // - Citation count
    // - Sentiment (positive boosts score)

    let score = 0;

    for (const analysis of analyses) {
      // Brand mentions contribute to score
      score += analysis.brandMentions.exact * 10;
      score += analysis.brandMentions.fuzzy * 5;

      // Citations contribute
      score += analysis.citationCount * 2;

      // Positive sentiment boosts
      if (analysis.sentiment.tone === "positive") {
        score += 5;
      } else if (analysis.sentiment.tone === "negative") {
        score -= 5;
      }
    }

    // Normalize to 0-100
    const maxPossibleScore = analyses.length * 50; // Rough estimate
    return Math.min(Math.max((score / maxPossibleScore) * 100, 0), 100);
  }

  performCompetitiveAnalysis(
    analyses: PromptAnalysis[],
    prompts: Prompt[]
  ): CompetitiveAnalysis {
    const totalMentions = analyses.reduce(
      (sum, a) => sum + a.brandMentions.exact + a.brandMentions.fuzzy,
      0
    );

    // Calculate brand share (100% since no competitors)
    const brandShare = 100;

    // Identify white space topics (prompts with no brand mentions)
    const whiteSpaceTopics = prompts
      .filter((p) => {
        const analysis = analyses.find((a) => a.promptId === p.id);
        if (!analysis) return true;
        return (
          analysis.brandMentions.exact === 0 &&
          analysis.brandMentions.fuzzy === 0
        );
      })
      .map((p) => p.question);

    // Identify missing brand prompts
    const missingBrandPrompts = prompts
      .filter((p) => {
        const analysis = analyses.find((a) => a.promptId === p.id);
        if (!analysis) return true;
        return (
          analysis.brandMentions.exact === 0 &&
          analysis.brandMentions.fuzzy === 0
        );
      })
      .map((p) => p.id);

    return {
      brandShare,
      competitorShares: {},
      whiteSpaceTopics,
      dominatedPrompts: [],
      missingBrandPrompts,
      timestamp: new Date().toISOString(),
    };
  }
}

export { BrandMentionDetector } from "./brand_mention.js";
export { SentimentAnalyzer } from "./sentiment.js";


