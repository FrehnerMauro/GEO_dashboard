/**
 * Sitemap.xml parser and crawler
 */

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export class SitemapParser {
  async findAndParseSitemap(baseUrl: string): Promise<{ urls: string[]; foundSitemap: boolean }> {
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemaps/sitemap.xml`,
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await fetch(sitemapUrl, {
          headers: {
            "User-Agent": "GEO-Platform/1.0",
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (response.ok) {
          const xml = await response.text();
          const urls = this.parseSitemap(xml);
          if (urls.length > 0) {
            return { urls, foundSitemap: true };
          }
        }
      } catch (error) {
        // Try next sitemap URL
        continue;
      }
    }

    // If no sitemap found, crawl homepage and extract internal links
    console.log("⚠️ Keine Sitemap gefunden. Crawle Startseite und extrahiere interne Links...");
    const urls = await this.crawlHomepageForLinks(baseUrl);
    return { urls, foundSitemap: false };
  }

  private async crawlHomepageForLinks(baseUrl: string): Promise<string[]> {
    const urls: string[] = [];
    const baseUrlObj = new URL(baseUrl);
    const visited = new Set<string>();
    
    try {
      // Fetch homepage
      const response = await fetch(baseUrl, {
        headers: {
          "User-Agent": "GEO-Platform/1.0",
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        console.error("Failed to fetch homepage:", response.status);
        return [baseUrl]; // Return at least the homepage
      }

      const html = await response.text();
      urls.push(baseUrl); // Add homepage
      visited.add(baseUrl);

      // Extract all links from homepage
      const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
      let match;
      const foundLinks = new Set<string>();

      while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1].trim();
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
          continue;
        }

        try {
          // Resolve relative URLs
          const absoluteUrl = new URL(href, baseUrl).href;
          const urlObj = new URL(absoluteUrl);

          // Only include internal links (same domain)
          if (urlObj.hostname === baseUrlObj.hostname || urlObj.hostname === `www.${baseUrlObj.hostname}` || baseUrlObj.hostname === `www.${urlObj.hostname}`) {
            // Normalize URL (remove fragment, trailing slash)
            const normalizedUrl = urlObj.origin + urlObj.pathname + (urlObj.search || '');
            if (!visited.has(normalizedUrl) && !normalizedUrl.endsWith('.pdf') && !normalizedUrl.endsWith('.jpg') && !normalizedUrl.endsWith('.png') && !normalizedUrl.endsWith('.gif') && !normalizedUrl.endsWith('.zip')) {
              foundLinks.add(normalizedUrl);
            }
          }
        } catch (e) {
          // Invalid URL, skip
          continue;
        }
      }

      // Convert to array and limit to reasonable number
      const linkArray = Array.from(foundLinks);
      const maxLinks = 50; // Limit to prevent too many URLs
      urls.push(...linkArray.slice(0, maxLinks));

      console.log(`✅ ${urls.length} URLs von Startseite extrahiert (${foundLinks.size} interne Links gefunden)`);
      
      return urls;
    } catch (error) {
      console.error("Error crawling homepage:", error);
      // Return at least the homepage
      return [baseUrl];
    }
  }

  private parseSitemap(xml: string): string[] {
    const urls: string[] = [];

    // Parse sitemap.xml format
    const urlRegex = /<loc>(.*?)<\/loc>/gi;
    let match;
    while ((match = urlRegex.exec(xml)) !== null) {
      const url = match[1].trim();
      if (url) {
        urls.push(url);
      }
    }

    // Also check for sitemap index
    const sitemapIndexRegex = /<sitemap><loc>(.*?)<\/loc><\/sitemap>/gi;
    while ((match = sitemapIndexRegex.exec(xml)) !== null) {
      const sitemapUrl = match[1].trim();
      // Could recursively fetch, but for now just note it
      console.log("Found sitemap index:", sitemapUrl);
    }

    return urls;
  }

  async parseSitemapFromUrl(sitemapUrl: string): Promise<string[]> {
    try {
      const response = await fetch(sitemapUrl, {
        headers: {
          "User-Agent": "GEO-Platform/1.0",
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        return [];
      }

      const xml = await response.text();
      return this.parseSitemap(xml);
    } catch (error) {
      console.error("Error parsing sitemap:", error);
      return [];
    }
  }
}

