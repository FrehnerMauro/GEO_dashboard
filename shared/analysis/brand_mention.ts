/**
 * Brand mention & citation detection module
 * Ziel:
 * - exact   = echte Text-Erwähnungen der Brand
 * - fuzzy   = bewusst 0 (LLM-Texte sind deterministisch)
 * - contexts = Sätze mit Erwähnung ODER Citation
 */

import type { LLMResponse, BrandMention } from "../types.js";

export class BrandMentionDetector {
  private brandName: string;
  private fuzzyThreshold: number;
  private debug: boolean;

  constructor(brandName: string, fuzzyThreshold: number = 0.7, debug: boolean = false) {
    this.brandName = brandName;
    this.fuzzyThreshold = fuzzyThreshold;
    this.debug = debug;
  }

  /**
   * Enable or disable debug logging
   */
  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  detectMentions(response: LLMResponse): BrandMention {
    const rawText = response.outputText;
    const lowerText = rawText.toLowerCase();

    const brandLower = this.brandName.toLowerCase();
    const brandDomain = brandLower.replace(/\s+/g, "");

    if (this.debug) {
      console.log("[BrandMentionDetector] Starting detection");
      console.log("[BrandMentionDetector] Brand name:", this.brandName);
      console.log("[BrandMentionDetector] Brand lower:", brandLower);
      console.log("[BrandMentionDetector] Brand domain:", brandDomain);
      console.log("[BrandMentionDetector] Text length:", rawText.length);
      console.log("[BrandMentionDetector] Text preview:", rawText.substring(0, 200));
    }

    // Zuerst Citations finden, um deren Positionen zu kennen
    // Use lowerText for citation ranges to ensure case-insensitive matching
    const citationRanges = this.findCitationRanges(lowerText, brandDomain);
    const citations = citationRanges.length;

    // Exakte Erwähnungen zählen, aber die in Citations ausschließen
    // Case-insensitive: uses lowerText and brandLower for matching
    const exact = this.countExactMentionsExcludingCitations(
      rawText,
      lowerText,
      brandLower,
      citationRanges
    );

    const contexts = this.extractContexts(rawText, brandLower, brandDomain);

    if (this.debug) {
      console.log("[BrandMentionDetector] Exact mentions (excluding citations):", exact);
      console.log("[BrandMentionDetector] Citations found:", citations);
      console.log("[BrandMentionDetector] Citation ranges:", citationRanges);
      console.log("[BrandMentionDetector] Contexts found:", contexts.length);
      console.log("[BrandMentionDetector] Contexts:", contexts);
    }

    return {
      exact,
      fuzzy: 0, // absichtlich: alles andere wäre unseriös
      contexts,
      citations // Anzahl der Markdown-Citations mit Brand-Domain
    };
  }

  // --------------------------------------------------
  // Exakte Text-Erwähnungen (kein Fuzzy, kein Ratespiel)
  // Ausschließt Erwähnungen, die bereits in Citations sind
  // Case-insensitive: brand is already lowercased, lowerText is used for matching
  // --------------------------------------------------
  private countExactMentionsExcludingCitations(
    rawText: string,
    lowerText: string,
    brand: string,
    citationRanges: Array<{ start: number; end: number }>
  ): number {
    const escapedBrand = this.escapeRegex(brand);
    // Use case-insensitive flag 'i' (though we're already using lowerText)
    // This ensures robustness even if called with mixed case
    const regex = new RegExp(`\\b${escapedBrand}\\b`, "gi");
    
    if (this.debug) {
      console.log("[countExactMentionsExcludingCitations] Regex pattern:", regex.source);
      console.log("[countExactMentionsExcludingCitations] Escaped brand:", escapedBrand);
    }
    
    let count = 0;
    let match;
    
    // Alle Matches durchgehen
    while ((match = regex.exec(lowerText)) !== null) {
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;
      
      // Prüfen, ob diese Erwähnung innerhalb eines Citations liegt
      const isInCitation = citationRanges.some(range => 
        matchStart >= range.start && matchEnd <= range.end
      );
      
      if (!isInCitation) {
        count++;
        if (this.debug) {
          console.log(`[countExactMentionsExcludingCitations] Found mention at ${matchStart}-${matchEnd}: "${match[0]}"`);
        }
      } else {
        if (this.debug) {
          console.log(`[countExactMentionsExcludingCitations] Skipped mention at ${matchStart}-${matchEnd} (in citation)`);
        }
      }
    }
    
    if (this.debug) {
      console.log("[countExactMentionsExcludingCitations] Total count (excluding citations):", count);
    }
    
    return count;
  }

  // --------------------------------------------------
  // Markdown-Citations wie:
  // [frehnertec.ch](https://www.frehnertec.ch/...)
  // Oder auch: [text](https://www.frehnertec.ch/...)
  // Gibt die Positionen (start, end) der Citations zurück
  // --------------------------------------------------
  private findCitationRanges(
    text: string,
    brandDomain: string
  ): Array<{ start: number; end: number }> {
    // Pattern für Markdown-Links: [text](url)
    // Wir suchen nach Links, die die Brand-Domain enthalten
    const escapedDomain = this.escapeRegex(brandDomain);
    
    // Pattern: [irgendwas](url_mit_brand_domain)
    const citationRegex = new RegExp(
      `\\[([^\\]]*)\\]\\([^)]*${escapedDomain}[^)]*\\)`,
      "gi"
    );

    if (this.debug) {
      console.log("[findCitationRanges] Regex pattern:", citationRegex.source);
      console.log("[findCitationRanges] Escaped domain:", escapedDomain);
    }

    const ranges: Array<{ start: number; end: number }> = [];
    let match;
    
    while ((match = citationRegex.exec(text)) !== null) {
      ranges.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    if (this.debug) {
      console.log("[findCitationRanges] Found citations:", ranges.length);
      console.log("[findCitationRanges] Citation ranges:", ranges);
    }

    return ranges;
  }

  // --------------------------------------------------
  // Kontext = ganze Sätze, die entweder
  // - Brand-Namen ODER
  // - Brand-Domain enthalten
  // --------------------------------------------------
  private extractContexts(
    text: string,
    brand: string,
    brandDomain: string
  ): string[] {
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (this.debug) {
      console.log("[extractContexts] Total sentences:", sentences.length);
    }

    const contexts: string[] = [];

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();

      if (lower.includes(brand) || lower.includes(brandDomain)) {
        if (!contexts.includes(sentence)) {
          contexts.push(sentence);
        }
      }
    }

    if (this.debug) {
      console.log("[extractContexts] Found contexts:", contexts.length);
    }

    return contexts.slice(0, 5);
  }

  // --------------------------------------------------
  // Regex-Sicherheit
  // --------------------------------------------------
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}