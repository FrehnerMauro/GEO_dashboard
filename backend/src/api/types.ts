/**
 * API Types and Interfaces
 */

import { getCorsHeaders } from "./middleware/cors.js";

export interface Env {
  geo_db: D1Database;
  OPENAI_API_KEY: string;
  [key: string]: any;
}

export type CorsHeaders = ReturnType<typeof getCorsHeaders>;
