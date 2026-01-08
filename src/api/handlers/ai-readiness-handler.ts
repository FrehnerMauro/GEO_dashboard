/**
 * AI Readiness API Handlers
 */

import type { Env, CorsHeaders } from "../types.js";

export class AIReadinessHandler {
  constructor(private env: Env) {}

  async handleAnalyze(
    request: Request,
    corsHeaders: CorsHeaders,
    ctx?: ExecutionContext
  ): Promise<Response> {
    try {
      const body = await request.json() as { websiteUrl: string };
      let { websiteUrl } = body;
      
      if (!websiteUrl || !websiteUrl.trim()) {
        return new Response(
          JSON.stringify({ error: "websiteUrl is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // URL Normalisierung: Ergänze https:// falls fehlend
      websiteUrl = websiteUrl.trim();
      const urlPattern = /^https?:\/\//i;
      if (!urlPattern.test(websiteUrl)) {
        websiteUrl = 'https://' + websiteUrl;
      }
      
      // Validiere URL
      try {
        new URL(websiteUrl);
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Invalid URL format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Erstelle Run-ID
      const runId = `ai_readiness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] 🚀 STARTING ANALYSIS`);
      console.log(`[AI Readiness ${runId}] URL: ${websiteUrl}`);
      console.log(`[AI Readiness ${runId}] RunId: ${runId}`);
      console.log(`[AI Readiness ${runId}] Timestamp: ${new Date().toISOString()}`);
      console.log(`[AI Readiness ${runId}] ctx available: ${!!ctx}`);
      console.log(`[AI Readiness ${runId}] ctx.waitUntil available: ${ctx ? typeof ctx.waitUntil : 'N/A'}`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      
      // Erstelle sofort einen Datenbankeintrag, damit der Status-Endpoint etwas zurückgeben kann
      let dbInitSuccess = false;
      try {
        console.log(`[AI Readiness ${runId}] → Step 1: Creating database connection...`);
        const { Database } = await import("../../persistence/index.js");
        const db = new Database(this.env.geo_db as any);
        console.log(`[AI Readiness ${runId}] → Step 2: Creating table if not exists...`);
        await db.db.exec(
          'CREATE TABLE IF NOT EXISTS ai_readiness_runs (id TEXT PRIMARY KEY, website_url TEXT NOT NULL, status TEXT NOT NULL, robots_txt TEXT, sitemap_urls TEXT, total_urls INTEGER, recommendations TEXT, message TEXT, error TEXT, logs TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'
        );
        console.log(`[AI Readiness ${runId}] → Step 3: Inserting initial record...`);
        const now = new Date().toISOString();
        const insertResult = await db.db
          .prepare('INSERT OR REPLACE INTO ai_readiness_runs (id, website_url, status, created_at, updated_at, message, logs) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(runId, websiteUrl, 'processing', now, now, '🚀 Analyse wird gestartet...', '[]')
          .run();
        console.log(`[AI Readiness ${runId}] ✓ Initial database record created:`, {
          success: insertResult.success,
          changes: insertResult.meta?.changes
        });
        
        // Verify it was created
        const verify = await db.db
          .prepare('SELECT id, status, message FROM ai_readiness_runs WHERE id = ?')
          .bind(runId)
          .first();
        console.log(`[AI Readiness ${runId}] ✓ Verified record exists:`, verify);
        dbInitSuccess = true;
      } catch (initError: any) {
        console.error(`[AI Readiness ${runId}] ❌ Database initialization failed:`, {
          message: initError?.message,
          stack: initError?.stack,
          name: initError?.name,
          error: initError
        });
      }
      
      // Starte asynchrone Verarbeitung - we need to import the processAIReadiness function
      // Since it's private in APIRoutes, we'll need to make it accessible or duplicate it
      // For now, let's use a workaround: call it through APIRoutes
      console.log(`[AI Readiness ${runId}] → Step 4: Starting processAIReadiness function...`);
      const processStartTime = Date.now();
      
      // Import the processAIReadiness logic
      // We'll need to make this accessible - for now, let's create a helper
      const processPromise = this.processAIReadiness(runId, websiteUrl).catch(async (error) => {
        const processTime = Date.now() - processStartTime;
        console.error(`[AI Readiness ${runId}] ========================================`);
        console.error(`[AI Readiness ${runId}] ❌ CRITICAL ERROR in processAIReadiness`);
        console.error(`[AI Readiness ${runId}] Time elapsed: ${processTime}ms`);
        console.error(`[AI Readiness ${runId}] Error type: ${error?.constructor?.name}`);
        console.error(`[AI Readiness ${runId}] Error message: ${error instanceof Error ? error.message : String(error)}`);
        console.error(`[AI Readiness ${runId}] Error stack:`, error instanceof Error ? error.stack : 'No stack');
        console.error(`[AI Readiness ${runId}] Full error:`, error);
        console.error(`[AI Readiness ${runId}] ========================================`);
        
        try {
          const { Database } = await import("../../persistence/index.js");
          const db = new Database(this.env.geo_db as any);
          await db.db
            .prepare('UPDATE ai_readiness_runs SET status = ?, error = ?, message = ?, updated_at = ? WHERE id = ?')
            .bind(
              'error',
              error instanceof Error ? error.message : 'Unknown error',
              `❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
              new Date().toISOString(),
              runId
            )
            .run();
          console.log(`[AI Readiness ${runId}] ✓ Error status saved to database`);
        } catch (dbError: any) {
          console.error(`[AI Readiness ${runId}] ❌ Could not update error status in database:`, {
            message: dbError?.message,
            stack: dbError?.stack,
            error: dbError
          });
        }
      });
      
      // In Cloudflare Workers: waitUntil sorgt dafür, dass die async Funktion vollständig ausgeführt wird
      console.log(`[AI Readiness ${runId}] → Step 5: Setting up waitUntil...`);
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(processPromise);
        console.log(`[AI Readiness ${runId}] ✓ Analysis promise started with ctx.waitUntil`);
        console.log(`[AI Readiness ${runId}] ✓ Promise will continue in background`);
      } else {
        console.warn(`[AI Readiness ${runId}] ⚠ No ExecutionContext available!`);
        console.warn(`[AI Readiness ${runId}] ⚠ ctx:`, ctx);
        console.warn(`[AI Readiness ${runId}] ⚠ Running without waitUntil - function may be cancelled`);
        // Fallback: Start promise anyway, but it might be cancelled
        processPromise.catch(err => {
          console.error(`[AI Readiness ${runId}] Promise failed (no waitUntil):`, err);
        });
      }
      
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] ✓ HANDLE REQUEST COMPLETE`);
      console.log(`[AI Readiness ${runId}] Returning response with runId: ${runId}`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      
      return new Response(
        JSON.stringify({
          runId,
          status: "started",
          message: "AI Readiness Check gestartet",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in handleAnalyze:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  async handleGetStatus(
    runId: string,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      console.log(`[AI Readiness Status] Requested runId: ${runId}`);
      
      const { Database } = await import("../../persistence/index.js");
      const db = new Database(this.env.geo_db as any);
      
      // Create table if not exists (using try-catch to ignore if already exists)
      try {
        await db.db.exec(
          'CREATE TABLE IF NOT EXISTS ai_readiness_runs (id TEXT PRIMARY KEY, website_url TEXT NOT NULL, status TEXT NOT NULL, robots_txt TEXT, sitemap_urls TEXT, total_urls INTEGER, recommendations TEXT, message TEXT, error TEXT, logs TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'
        );
        console.log(`[AI Readiness Status] Table created/verified for runId: ${runId}`);
      } catch (e: any) {
        // Ignore error if table already exists
        if (!e?.message?.includes('already exists') && !e?.message?.includes('duplicate')) {
          console.warn(`[AI Readiness Status] Could not create ai_readiness_runs table (may already exist):`, e);
        }
      }
      
      console.log(`[AI Readiness Status] Querying database for runId: ${runId}`);
      const result = await db.db
        .prepare("SELECT * FROM ai_readiness_runs WHERE id = ?")
        .bind(runId)
        .first<{
          id: string;
          status: string;
          recommendations: string | null;
          message: string | null;
          error: string | null;
        }>();
      
      console.log(`[AI Readiness Status] Query result for runId ${runId}:`, result ? 'Found' : 'Not found');
      
      if (!result) {
        // Check if there are any runs in the database
        const allRuns = await db.db
          .prepare("SELECT id, created_at FROM ai_readiness_runs ORDER BY created_at DESC LIMIT 5")
          .all();
        console.log(`[AI Readiness Status] Available runs in database:`, allRuns?.results || []);
        
        return new Response(
          JSON.stringify({ 
            error: "Run not found",
            runId: runId,
            message: `No run found with ID: ${runId}`
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Parse logs if available
      let logs: any[] = [];
      try {
        const logsField = (result as any).logs;
        if (logsField) {
          logs = JSON.parse(logsField);
        }
      } catch (e) {
        console.warn('Error parsing logs:', e);
      }
      
      return new Response(
        JSON.stringify({
          runId: result.id,
          status: result.status,
          recommendations: result.recommendations,
          message: result.message,
          error: result.error,
          logs: logs,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in handleGetStatus:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // Use APIRoutes' processAIReadiness method
  private async processAIReadiness(
    runId: string,
    websiteUrl: string
  ): Promise<void> {
    // Import APIRoutes and use its processAIReadiness method
    // This method is now public in APIRoutes
    const { APIRoutes } = await import("../routes.js");
    const { GEOEngine } = await import("../../engine.js");
    const engine = new GEOEngine(this.env);
    const routes = new APIRoutes(engine);
    
    // Call the public method
    await routes.processAIReadiness(runId, websiteUrl, this.env);
  }
}
