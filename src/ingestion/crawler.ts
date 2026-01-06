/**
 * Website crawler for discovering and indexing pages
 */

import type { CrawledPage } from "../types.js";

export interface CrawlOptions {
  maxPages: number;
  maxDepth: number;
  timeout: number;
  userAgent: string;
  language?: string;
}

export class WebsiteCrawler {
  private visitedUrls = new Set<string>();
  private pages: CrawledPage[] = [];
  private baseUrl?: URL;

  constructor(private options: CrawlOptions) {}

  async crawl(baseUrl: string): Promise<CrawledPage[]> {
    this.baseUrl = new URL(baseUrl);
    this.visitedUrls.clear();
    this.pages = [];

    await this.crawlPage(baseUrl, 0);
    return this.pages;
  }

  private async crawlPage(url: string, depth: number): Promise<void> {
    if (depth > this.options.maxDepth) return;
    if (this.pages.length >= this.options.maxPages) return;

    const normalizedUrl = this.normalizeUrl(url);
    if (this.visitedUrls.has(normalizedUrl)) return;

    this.visitedUrls.add(normalizedUrl);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": this.options.userAgent,
        },
        signal: AbortSignal.timeout(this.options.timeout),
      });

      if (!response.ok) return;

      const html = await response.text();
      const page = await this.parsePage(url, html);

      if (page) {
        this.pages.push(page);

        // Extract links for further crawling
        if (depth < this.options.maxDepth) {
          const links = this.extractLinks(html, url);
          for (const link of links) {
            if (this.pages.length >= this.options.maxPages) break;
            await this.crawlPage(link, depth + 1);
          }
        }
      }
    } catch (error) {
      // Silently skip failed pages
      console.error(`Failed to crawl ${url}:`, error);
    }
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const base = new URL(baseUrl);
    const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;

    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      try {
        const href = match[1];
        const absoluteUrl = new URL(href, base).href;

        // Only include same-domain links
        if (new URL(absoluteUrl).hostname === base.hostname) {
          links.push(absoluteUrl);
        }
      } catch {
        // Skip invalid URLs
      }
    }

    return [...new Set(links)];
  }

  private async parsePage(url: string, html: string): Promise<CrawledPage | null> {
    // Use Cheerio-like parsing (simplified for Cloudflare Workers)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? this.cleanText(titleMatch[1]) : "";

    const headings: string[] = [];
    const headingRegex = /<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi;
    let headingMatch;
    while ((headingMatch = headingRegex.exec(html)) !== null) {
      headings.push(this.cleanText(headingMatch[2]));
    }

    // Extract main content (simplified - remove scripts, styles, etc.)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;
    const textContent = this.extractTextContent(bodyContent);

    // Extract topics (simplified keyword extraction)
    const topics = this.extractTopics(textContent);

    // Extract entities (simplified - look for capitalized phrases)
    const entities = this.extractEntities(textContent);

    return {
      url,
      title,
      headings,
      content: textContent,
      topics,
      entities,
      language: this.options.language || "en",
    };
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }

  private extractTextContent(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, " ");
    // Clean up whitespace
    return this.cleanText(text);
  }

  private extractTopics(text: string): string[] {
    // Simplified topic extraction - look for repeated important words
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4);

    const wordFreq = new Map<string, number>();
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private extractEntities(text: string): string[] {
    // Simplified entity extraction - look for capitalized phrases
    const entityRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    const entities = new Set<string>();
    let match;

    while ((match = entityRegex.exec(text)) !== null) {
      const entity = match[1];
      if (entity.length > 3 && entity.length < 50) {
        entities.add(entity);
      }
    }

    return Array.from(entities).slice(0, 20);
  }
}

