/**
 * Backend Entry Point - Cloudflare Workers
 * 
 * Architecture:
 * - Routes: Request routing
 * - Handlers: Request/Response handling
 * - Services: Business logic
 * - Repositories: Data access
 * - Domain: Domain models and business rules
 */

import { Router } from "./api/router.js";
import type { Env } from "./api/types.js";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const router = new Router(env);
    
    return await router.route(request, ctx);
  },
};
