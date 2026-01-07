/**
 * Competitor detection module
 */

import type { LLMResponse, CompetitorMention } from "../types.js";

export class CompetitorDetector {
  constructor(private brandName: string) {}

  detectCompetitors(
    response: LLMResponse,
    knownCompetitors?: string[]
  ): CompetitorMention[] {
    const text = response.outputText;
    const competitors: Map<string, CompetitorMention> = new Map();

    // Extract potential competitor names
    const potentialCompetitors = this.extractPotentialCompetitors(
      text,
      knownCompetitors
    );

    for (const competitor of potentialCompetitors) {
      // Skip if this is the brand itself (check various variations)
      if (this.isBrandName(competitor)) {
        continue;
      }

      const count = this.countMentions(text, competitor);
      if (count > 0) {
        const contexts = this.extractContexts(text, competitor);
        const citations = this.extractRelevantCitations(
          response.citations,
          competitor
        );

        competitors.set(competitor, {
          name: competitor,
          count,
          contexts,
          citations: citations.map((c) => c.url),
        });
      }
    }

    return Array.from(competitors.values()).sort(
      (a, b) => b.count - a.count
    );
  }

  private extractPotentialCompetitors(
    text: string,
    knownCompetitors?: string[]
  ): string[] {
    const competitors = new Set<string>();

    // Add known competitors
    if (knownCompetitors) {
      for (const comp of knownCompetitors) {
        competitors.add(comp);
      }
    }

    // Common words that should NOT be considered competitors
    const commonWords = new Set([
      'this', 'that', 'these', 'those', 'the', 'a', 'an', 'and', 'or', 'but',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might',
      'can', 'must', 'shall', 'should', 'will', 'would', 'get', 'got', 'go',
      'come', 'see', 'know', 'think', 'take', 'give', 'make', 'find', 'say',
      'tell', 'ask', 'work', 'try', 'use', 'want', 'need', 'feel', 'become',
      'leave', 'put', 'mean', 'keep', 'let', 'begin', 'seem', 'help', 'show',
      'hear', 'play', 'run', 'move', 'like', 'live', 'believe', 'bring', 'happen',
      'write', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue',
      'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop',
      'create', 'speak', 'read', 'spend', 'grow', 'open', 'walk', 'win', 'offer',
      'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die',
      'send', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'raise', 'pass',
      'sell', 'decide', 'return', 'explain', 'develop', 'carry', 'break', 'receive',
      'agree', 'support', 'hit', 'produce', 'eat', 'cover', 'catch', 'draw',
      'choose', 'cause', 'provide', 'happen', 'focus', 'routine', 'values',
      'staying', 'define', 'divide', 'establish', 'consistency', 'track',
      'progress', 'seeing', 'celebrate', 'positive', 'believing', 'accountability',
      'share', 'being', 'eliminate', 'distractions', 'identify', 'reflect',
      'adjust', 'regularly', 'practice', 'patience', 'connect', 'habits', 'align',
      'clear', 'goals', 'break', 'down', 'create', 'use', 'reminders', 'keep',
      'reward', 'yourself', 'stay', 'share', 'being', 'eliminate', 'identify',
      'reflect', 'adjust', 'regularly', 'practice', 'understand', 'connect', 'align'
    ]);

    // Extract from comparison phrases (more specific patterns)
    const comparisonPatterns = [
      /(?:compared to|vs\.?|versus|alternative to|instead of|rather than)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)+)(?:[.,;]|\s+is|\s+are|$)/gi,
      /([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)+)\s+(?:is|are)\s+(?:a|an|another)\s+(?:good|popular|better|alternative|leading|major)\s+(?:option|choice|solution|company|service|platform|tool)/gi,
      /(?:competitors?|alternatives?|similar|other)\s+(?:include|are|like)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)+)/gi,
    ];

    for (const pattern of comparisonPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1].trim();
        // Only add if it's at least 2 words and not a common word
        const words = name.split(/\s+/);
        if (words.length >= 2 && name.length >= 4 && name.length < 50) {
          const firstWord = words[0].toLowerCase();
          if (!commonWords.has(firstWord) && !commonWords.has(name.toLowerCase())) {
            competitors.add(name);
          }
        }
      }
    }

    // Extract company-like names (must be at least 2 words, start with capital)
    // Look for patterns like "Company Name", "Brand Inc", "Service LLC", etc.
    const companyPatterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:Inc|LLC|Ltd|Corp|Corporation|Company|Co|Group|Solutions|Services|Technologies|Tech|Systems|Software|Digital|Media|Consulting|Partners|Associates|Enterprises|Industries|International|Global|Worldwide)\b/gi,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s+(?:is|are|offers|provides|delivers|creates|develops|designs|builds|sells|manufactures)\s+(?:a|an|the)\s+[a-z]+/gi,
    ];

    for (const pattern of companyPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1].trim();
        const words = name.split(/\s+/);
        if (words.length >= 2 && name.length >= 4 && name.length < 50) {
          const firstWord = words[0].toLowerCase();
          if (!commonWords.has(firstWord)) {
            competitors.add(name);
          }
        }
      }
    }

    return Array.from(competitors);
  }

  private countMentions(text: string, competitor: string): number {
    const regex = new RegExp(
      `\\b${this.escapeRegex(competitor)}\\b`,
      "gi"
    );
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  private extractContexts(text: string, competitor: string): string[] {
    const contexts: string[] = [];
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      if (new RegExp(`\\b${this.escapeRegex(competitor)}\\b`, "i").test(sentence)) {
        contexts.push(sentence.trim());
      }
    }

    return contexts.slice(0, 3); // Limit to 3 contexts
  }

  private extractRelevantCitations(
    citations: LLMResponse["citations"],
    competitor: string
  ): LLMResponse["citations"] {
    return citations.filter((citation) => {
      const text = `${citation.title || ""} ${citation.snippet || ""}`.toLowerCase();
      return text.includes(competitor.toLowerCase());
    });
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Check if a competitor name is actually the brand itself
   * Compares various variations (case-insensitive, with/without spaces, domain, etc.)
   */
  private isBrandName(competitor: string): boolean {
    const brandLower = this.brandName.toLowerCase().trim();
    const competitorLower = competitor.toLowerCase().trim();
    
    // Exact match (case-insensitive)
    if (competitorLower === brandLower) {
      return true;
    }
    
    // Match without spaces
    const brandNoSpaces = brandLower.replace(/\s+/g, '');
    const competitorNoSpaces = competitorLower.replace(/\s+/g, '');
    if (competitorNoSpaces === brandNoSpaces) {
      return true;
    }
    
    // Match brand name with domain extensions (e.g., "frehnertec.ch" contains "frehnertec")
    const brandWords = brandLower.split(/\s+/);
    if (brandWords.length > 0) {
      const firstBrandWord = brandWords[0];
      // Check if competitor starts with brand word (e.g., "frehnertec.ch" starts with "frehnertec")
      if (competitorLower.startsWith(firstBrandWord) && 
          competitorLower.length <= firstBrandWord.length + 10) { // Allow for domain extensions
        // Additional check: if it's just the brand word with a domain, it's the brand
        const domainPattern = /^[a-z0-9]+\.(ch|com|de|org|net|io|co|app|dev)$/i;
        if (domainPattern.test(competitorLower.substring(firstBrandWord.length))) {
          return true;
        }
      }
    }
    
    // Match if competitor contains brand name as a significant part
    // (but not if it's just a substring in a longer name)
    if (competitorLower.includes(brandLower) && 
        competitorLower.length <= brandLower.length + 15) {
      // Check if it's the brand with additional words that are common domain/business terms
      const commonSuffixes = ['.ch', '.com', '.de', ' ag', ' gmbh', ' ltd', ' inc', ' corp', ' company', ' solutions', ' technologies', ' tech'];
      for (const suffix of commonSuffixes) {
        if (competitorLower === brandLower + suffix || 
            competitorLower === brandLower.replace(/\s+/g, '') + suffix) {
          return true;
        }
      }
    }
    
    return false;
  }
}

