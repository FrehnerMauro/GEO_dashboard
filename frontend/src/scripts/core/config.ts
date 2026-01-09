/**
 * Application Configuration
 * Centralized configuration for API endpoints and other settings
 */

/**
 * Get the API base URL
 * In production, this should point to the Cloudflare Worker
 * In development, it can be empty (relative URLs) or point to localhost
 */
export function getApiBaseUrl(): string {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    return "";
  }

  // Check for environment variable or data attribute
  const apiUrlFromMeta = document.querySelector('meta[name="api-base-url"]')?.getAttribute("content");
  if (apiUrlFromMeta) {
    return apiUrlFromMeta;
  }

  // Check for global config
  const globalConfig = (window as any).__GEO_CONFIG__;
  if (globalConfig?.apiBaseUrl) {
    return globalConfig.apiBaseUrl;
  }

  // Production default: Use the Cloudflare Worker URL
  // In production on Cloudflare Pages, we can use relative URLs if _redirects is configured
  // Otherwise, use the absolute URL
  if (window.location.hostname.includes("pages.dev") || window.location.hostname.includes("maurofrehner")) {
    // If we're on Cloudflare Pages, use relative URLs (they'll be proxied via _redirects)
    // Or use absolute URL to the worker
    return "https://geo-platform-backend.maurofrehner.workers.dev";
  }

  // Development: Use relative URLs or localhost
  // Check if we're on localhost
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    // For local development, point to the backend on port 8787
    return "http://localhost:8787";
  }

  // Default: Use relative URLs (will work if _redirects is configured)
  return "";
}

/**
 * Get the full API URL for an endpoint
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  if (baseUrl) {
    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}${cleanEndpoint}`;
  }
  
  return cleanEndpoint;
}
