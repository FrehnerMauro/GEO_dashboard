/**
 * URL Utilities
 */

export function normalizeUrl(url: string): string {
  if (!url) return "";
  
  const urlPattern = /^https?:\/\//i;
  if (!urlPattern.test(url)) {
    return `https://${url}`;
  }
  return url;
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

