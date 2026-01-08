/**
 * Sitemap and Link Extraction Utilities
 */

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

/**
 * Try to fetch sitemap from common locations
 */
export async function fetchSitemap(baseUrl: string): Promise<{ found: boolean; urls: string[]; content?: string }> {
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap/sitemap.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: { "User-Agent": "GEO-Platform/1.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const content = await response.text();
        const urls = parseSitemap(content);
        if (urls.length > 0) {
          return { found: true, urls, content };
        }
      }
    } catch (error) {
      // Continue to next sitemap URL
      continue;
    }
  }

  return { found: false, urls: [] };
}

/**
 * Parse sitemap XML and extract URLs
 */
export function parseSitemap(xml: string): string[] {
  const urls: string[] = [];

  // Handle sitemap index (contains links to other sitemaps)
  const sitemapIndexMatch = xml.match(/<sitemapindex[^>]*>([\s\S]*?)<\/sitemapindex>/i);
  if (sitemapIndexMatch) {
    const sitemapLinks = xml.matchAll(/<sitemap[^>]*>[\s\S]*?<loc[^>]*>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/gi);
    for (const match of sitemapLinks) {
      urls.push(match[1].trim());
    }
    return urls; // Return sitemap URLs, not page URLs
  }

  // Handle regular sitemap
  const urlMatches = xml.matchAll(/<url[^>]*>[\s\S]*?<loc[^>]*>([^<]+)<\/loc>[\s\S]*?<\/url>/gi);
  for (const match of urlMatches) {
    urls.push(match[1].trim());
  }

  return urls;
}

/**
 * Extract links from HTML content
 */
export function extractLinksFromHtml(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const baseUrlObj = new URL(baseUrl);
  
  // Find all <a> tags with href attributes
  const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
  
  for (const match of linkMatches) {
    let href = match[1].trim();
    
    // Skip anchors, javascript, mailto, etc.
    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }
    
    try {
      // Convert relative URLs to absolute
      if (href.startsWith('/')) {
        href = `${baseUrlObj.protocol}//${baseUrlObj.host}${href}`;
      } else if (!href.startsWith('http')) {
        href = new URL(href, baseUrl).toString();
      }
      
      // Only include URLs from the same domain
      const hrefUrl = new URL(href);
      if (hrefUrl.hostname === baseUrlObj.hostname || hrefUrl.hostname.endsWith('.' + baseUrlObj.hostname)) {
        links.push(href);
      }
    } catch (error) {
      // Skip invalid URLs
      continue;
    }
  }
  
  // Remove duplicates
  return [...new Set(links)];
}

/**
 * Extract text content from HTML
 */
export function extractTextContent(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  
  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();
  
  return text;
}

/**
 * Check if URL should be fetched (exclude PDFs, images, etc.)
 */
export function shouldFetchUrl(url: string): boolean {
  const urlLower = url.toLowerCase();
  const excludedExtensions = [
    '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico',
    '.mp4', '.mp3', '.avi', '.mov', '.wmv', '.flv',
    '.zip', '.rar', '.tar', '.gz',
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.css', '.js', '.json', '.xml', '.txt'
  ];
  
  // Check if URL ends with excluded extension
  for (const ext of excludedExtensions) {
    if (urlLower.endsWith(ext)) {
      return false;
    }
  }
  
  // Check if URL contains image paths
  if (urlLower.includes('/images/') || urlLower.includes('/img/') || 
      urlLower.includes('/assets/') && (urlLower.includes('.jpg') || urlLower.includes('.png') || urlLower.includes('.gif'))) {
    return false;
  }
  
  return true;
}

/**
 * Normalize URL to remove duplicates (remove trailing slash, normalize query params, etc.)
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Remove trailing slash from pathname (except for root)
    if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    
    // Normalize to lowercase hostname
    urlObj.hostname = urlObj.hostname.toLowerCase();
    
    // Remove default ports
    if ((urlObj.protocol === 'https:' && urlObj.port === '443') ||
        (urlObj.protocol === 'http:' && urlObj.port === '80')) {
      urlObj.port = '';
    }
    
    // Sort query parameters for consistent comparison
    if (urlObj.search) {
      const params = new URLSearchParams(urlObj.search);
      const sortedParams = new URLSearchParams();
      Array.from(params.keys()).sort().forEach(key => {
        sortedParams.append(key, params.get(key) || '');
      });
      urlObj.search = sortedParams.toString();
    }
    
    // Remove fragment
    urlObj.hash = '';
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Deduplicate URLs by normalizing them
 */
export function deduplicateUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  
  for (const url of urls) {
    const normalized = normalizeUrl(url);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(url); // Keep original URL, not normalized one
    }
  }
  
  return unique;
}
