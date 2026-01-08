/**
 * Utility functions for extracting specific sections from text
 */

/**
 * Extrahiert den Abschnitt "## Empfehlung" oder "## Fazit" aus dem Text
 * 
 * @param answerText Der vollständige Antworttext
 * @returns Der extrahierte Fazit-Abschnitt oder der gesamte Text, falls kein Fazit gefunden wird
 */
export function extractConclusion(answerText: string | null): string | null {
  if (!answerText || answerText.trim().length === 0) {
    return answerText;
  }

  // Finde die Position der "## Empfehlung" Überschrift
  const empfehlungIndex = answerText.search(/##\s+Empfehlung/im);
  if (empfehlungIndex !== -1) {
    // Finde alles nach "## Empfehlung\n" bis zum Ende oder bis zur nächsten ## Überschrift
    const startIndex = answerText.indexOf('\n', empfehlungIndex) + 1;
    const restOfText = answerText.substring(startIndex);
    
    // Suche nach der nächsten ## Überschrift
    const nextHeadingMatch = restOfText.match(/^\n##\s+/m);
    if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
      return restOfText.substring(0, nextHeadingMatch.index).trim();
    } else {
      // Keine weitere Überschrift gefunden, nimm alles bis zum Ende
      return restOfText.trim();
    }
  }
  
  // Fallback: Suche nach anderen möglichen Überschriften
  const conclusionPatterns = [
    /##\s+Fazit\s*\n([\s\S]*?)(?=\n##\s+|$)/im,
    /##\s+Zusammenfassung\s*\n([\s\S]*?)(?=\n##\s+|$)/im,
    /##\s+Summary\s*\n([\s\S]*?)(?=\n##\s+|$)/im,
    /##\s+Conclusion\s*\n([\s\S]*?)(?=\n##\s+|$)/im,
    /##\s+Recommendation\s*\n([\s\S]*?)(?=\n##\s+|$)/im,
  ];

  for (const pattern of conclusionPatterns) {
    const match = answerText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: Wenn keine Überschrift gefunden wird, gib den gesamten Text zurück
  return answerText;
}

/**
 * Extrahiert Statistiken aus einem Text:
 * - Anzahl Zitierungen (Markdown-Links zur eigenen Marke)
 * - Anzahl Erwähnungen (Text-Erwähnungen der Marke, außerhalb von Citations)
 * - Anzahl andere Links (Links, die nicht zur eigenen Marke gehören)
 * 
 * @param text Der Text, aus dem extrahiert werden soll
 * @param brandName Der Markenname (z.B. "FrehnerTec")
 * @returns Objekt mit citations, mentions und otherLinks
 */
export function extractTextStats(
  text: string,
  brandName: string
): {
  citations: number;
  mentions: number;
  otherLinks: number;
  citationUrls: string[];
  otherLinkUrls: string[];
} {
  if (!text || text.trim().length === 0) {
    return {
      citations: 0,
      mentions: 0,
      otherLinks: 0,
      citationUrls: [],
      otherLinkUrls: [],
    };
  }

  const brandLower = brandName.toLowerCase();
  const brandDomain = brandLower.replace(/\s+/g, ""); // "frehnertec" aus "FrehnerTec"
  const escapedDomain = brandDomain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 1. Finde alle Markdown-Links: [text](url)
  const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  const allLinks: Array<{ text: string; url: string; index: number; length: number }> = [];
  let match;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    allLinks.push({
      text: match[1],
      url: match[2],
      index: match.index,
      length: match[0].length,
    });
  }

  // 2. Finde Zitierungen (Links zur eigenen Marke)
  const citationRanges: Array<{ start: number; end: number }> = [];
  const citationUrls: string[] = [];
  const lowerText = text.toLowerCase();

  for (const link of allLinks) {
    const urlLower = link.url.toLowerCase();
    // Prüfe, ob die URL die Brand-Domain enthält
    if (urlLower.includes(brandDomain)) {
      citationRanges.push({
        start: link.index,
        end: link.index + link.length,
      });
      citationUrls.push(link.url);
    }
  }

  // 3. Finde andere Links (nicht zur eigenen Marke)
  const otherLinkUrls: string[] = [];
  for (const link of allLinks) {
    const urlLower = link.url.toLowerCase();
    if (!urlLower.includes(brandDomain)) {
      otherLinkUrls.push(link.url);
    }
  }

  // 4. Zähle Erwähnungen (Text-Erwähnungen der Marke, außerhalb von Citations)
  const escapedBrand = brandLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const mentionRegex = new RegExp(`\\b${escapedBrand}\\b`, "gi");
  
  let mentions = 0;
  let mentionMatch;
  
  while ((mentionMatch = mentionRegex.exec(text)) !== null) {
    const mentionIndex = mentionMatch.index;
    const mentionEnd = mentionIndex + mentionMatch[0].length;
    
    // Prüfe, ob diese Erwähnung in einem Citation-Bereich liegt
    const isInCitation = citationRanges.some(
      (range) => mentionIndex >= range.start && mentionEnd <= range.end
    );
    
    if (!isInCitation) {
      mentions++;
    }
  }

  return {
    citations: citationRanges.length,
    mentions,
    otherLinks: otherLinkUrls.length,
    citationUrls: Array.from(new Set(citationUrls)), // Deduplizieren
    otherLinkUrls: Array.from(new Set(otherLinkUrls)), // Deduplizieren
  };
}
