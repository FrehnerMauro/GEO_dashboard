/**
 * HTML Templates
 * 
 * Note: The frontend has been moved to web/ directory for better separation of concerns.
 * For production, use Cloudflare Pages to serve the frontend.
 * This template is kept for backward compatibility and development.
 * 
 * In production:
 * - Frontend is served by Cloudflare Pages from web/ directory
 * - API is served by Cloudflare Workers (this file)
 * - The root "/" endpoint can redirect to Pages or serve a simple HTML with redirect
 */

import { LANDING_PAGE_HTML } from './landing-page.js';

export function getLandingPageHTML(): string {
  // For now, use the old template for Workers compatibility
  // In production with Cloudflare Pages, this endpoint won't be used for the frontend
  // It's kept for development and backward compatibility
  return LANDING_PAGE_HTML;
}

