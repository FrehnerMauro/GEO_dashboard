/**
 * Cloudflare Workers entry point
 */

import { APIRoutes } from "./api/routes.js";
import { GEOEngine } from "./engine.js";
import type { Env } from "./api/routes.js";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const engine = new GEOEngine(env);
    const routes = new APIRoutes(engine);
    
    // For async analysis, use waitUntil to allow background processing
    const response = await routes.handleRequest(request, env, ctx);
    
    return response;
  },
};

