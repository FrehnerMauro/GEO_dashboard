/**
 * Error Handling Middleware
 */

import { getCorsHeaders } from "./cors.js";

export function handleError(error: unknown, corsHeaders: ReturnType<typeof getCorsHeaders>): Response {
  console.error("API error:", error);
  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error",
    }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

export function handleNotFound(corsHeaders: ReturnType<typeof getCorsHeaders>): Response {
  return new Response(
    JSON.stringify({
      error: "Not Found",
      message: "The requested endpoint does not exist",
    }),
    {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

