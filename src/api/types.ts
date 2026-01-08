/**
 * API Types and Interfaces
 */

export interface Env {
  geo_db: D1Database;
  OPENAI_API_KEY: string;
  [key: string]: any;
}

export interface CorsHeaders {
  "Access-Control-Allow-Origin": string;
  "Access-Control-Allow-Methods": string;
  "Access-Control-Allow-Headers": string;
}

export function getCorsHeaders(): CorsHeaders {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

