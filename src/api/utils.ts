/**
 * Utility functions for API handlers
 */

export function extractBrandName(websiteUrl: string): string {
  try {
    const url = new URL(websiteUrl);
    const hostname = url.hostname;
    // Remove www. prefix
    const domain = hostname.replace(/^www\./, '');
    // Extract brand name (first part before first dot)
    const brandName = domain.split('.')[0];
    // Capitalize first letter
    return brandName.charAt(0).toUpperCase() + brandName.slice(1);
  } catch (e) {
    // Fallback: use the URL itself
    return websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('.')[0];
  }
}

