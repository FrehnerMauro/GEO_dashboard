/**
 * Content scraper and normalizer for website content
 */

import type { WebsiteContent, CrawledPage } from "../types.js";
import { WebsiteCrawler, type CrawlOptions } from "./crawler.js";

export class ContentScraper {
  constructor(private config: CrawlOptions) {}

  async scrapeWebsite(
    websiteUrl: string,
    language: string
  ): Promise<WebsiteContent> {
    const crawler = new WebsiteCrawler({
      ...this.config,
      language,
    });

    const pages = await crawler.crawl(websiteUrl);
    const normalizedContent = this.normalizeContent(pages, language);

    return {
      rootDomain: new URL(websiteUrl).hostname,
      pages,
      normalizedContent,
      language,
    };
  }

  private normalizeContent(pages: CrawledPage[], language: string): string {
    // Combine all content with language-aware normalization
    const allText = pages
      .map((page) => {
        const parts = [
          page.title,
          ...page.headings,
          page.content,
          ...page.topics,
        ];
        return parts.join(" ");
      })
      .join("\n\n");

    // Language-aware normalization
    return this.normalizeText(allText, language);
  }

  private normalizeText(text: string, language: string): string {
    // Basic normalization - remove extra whitespace, normalize line breaks
    let normalized = text
      .replace(/\s+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Language-specific normalization could be added here
    // For now, we do basic cleanup
    if (language === "de") {
      // German-specific normalization
      normalized = normalized.replace(/ß/g, "ss");
    }

    return normalized;
  }
}

