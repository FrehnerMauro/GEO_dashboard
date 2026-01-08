/**
 * API Types and Interfaces
 */

import { getCorsHeaders as getCorsHeadersFromMiddleware } from "./middleware/cors.js";

export interface Env {
  geo_db: D1Database;
  OPENAI_API_KEY: string;
  [key: string]: any;
}

export type CorsHeaders = ReturnType<typeof getCorsHeadersFromMiddleware>;

// Re-export for backward compatibility
export { getCorsHeadersFromMiddleware as getCorsHeaders };

