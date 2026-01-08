/**
 * Router - Handles request routing and delegation to handlers
 * Clean separation: Router -> Handlers -> Services -> Repositories
 */

import type { Env } from "./types.js";
import { matchRoute } from "./routes/route-definitions.js";
import { handleCors, getCorsHeaders, handleError, handleNotFound } from "./middleware/index.js";
import { WorkflowHandlers } from "./handlers/workflow.js";
import { AnalysisHandlers } from "./handlers/analysis.js";
import { AIReadinessHandler } from "./handlers/ai-readiness-handler.js";
import { WorkflowEngine } from "../../shared/engine_workflow.js";
import { GEOEngine } from "../../shared/engine.js";

export class Router {
  private workflowHandlers: WorkflowHandlers;
  private analysisHandlers: AnalysisHandlers;
  private aiReadinessHandler: AIReadinessHandler;

  constructor(
    private engine: GEOEngine,
    private env: Env
  ) {
    const workflowEngine = new WorkflowEngine(env);
    this.workflowHandlers = new WorkflowHandlers(workflowEngine);
    this.analysisHandlers = new AnalysisHandlers(engine);
    this.aiReadinessHandler = new AIReadinessHandler(env);
  }

  async route(request: Request, ctx?: ExecutionContext): Promise<Response> {
    const corsHeaders = getCorsHeaders();
    
    // Handle CORS preflight
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      const match = matchRoute(path, method);
      
      if (!match) {
        return handleNotFound(corsHeaders);
      }

      const { route, params } = match;
      const [handlerName, methodName] = route.handler.split(".");

      // Route to appropriate handler
      switch (handlerName) {
        case "workflow":
          return await this.routeWorkflow(methodName, request, params, corsHeaders);
        case "analysis":
          return await this.routeAnalysis(methodName, request, params, corsHeaders);
        case "aiReadiness":
          return await this.routeAIReadiness(methodName, request, params, corsHeaders, ctx);
        case "health":
          return new Response(
            JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        default:
          return handleNotFound(corsHeaders);
      }
    } catch (error) {
      return handleError(error, corsHeaders);
    }
  }

  private async routeWorkflow(
    method: string,
    request: Request,
    params: Record<string, string>,
    corsHeaders: ReturnType<typeof getCorsHeaders>
  ): Promise<Response> {
    switch (method) {
      case "step1":
        return await this.workflowHandlers.handleStep1(request, this.env, corsHeaders);
      case "step2":
        return await this.workflowHandlers.handleStep2(request, this.env, corsHeaders);
      case "step3":
        return await this.workflowHandlers.handleStep3(request, this.env, corsHeaders);
      case "saveCategories":
        return await this.workflowHandlers.handleSaveCategories(
          params.param0 || "",
          request,
          this.env,
          corsHeaders
        );
      case "step4":
        return await this.workflowHandlers.handleStep4(request, this.env, corsHeaders);
      case "savePrompts":
        return await this.workflowHandlers.handleSavePrompts(
          params.param0 || "",
          request,
          this.env,
          corsHeaders
        );
      case "step5":
        return await this.workflowHandlers.handleStep5(request, this.env, corsHeaders);
      case "fetchUrl":
        return await this.workflowHandlers.handleFetchUrl(request, this.env, corsHeaders);
      case "executePrompt":
        return await this.workflowHandlers.handleExecutePrompt(request, this.env, corsHeaders);
      default:
        return handleNotFound(corsHeaders);
    }
  }

  private async routeAnalysis(
    method: string,
    request: Request,
    params: Record<string, string>,
    corsHeaders: ReturnType<typeof getCorsHeaders>
  ): Promise<Response> {
    const runId = params.param0 || "";
    
    switch (method) {
      case "analyze":
        return await this.analysisHandlers.handleAnalyze(request, this.env, corsHeaders);
      case "getAll":
        return await this.analysisHandlers.handleGetAllAnalyses(request, this.env, corsHeaders);
      case "get":
        return await this.analysisHandlers.handleGetAnalysis(runId, this.env, corsHeaders);
      case "getStatus":
        return await this.analysisHandlers.handleGetStatus(runId, this.env, corsHeaders);
      case "getMetrics":
        return await this.analysisHandlers.handleGetMetrics(runId, this.env, corsHeaders);
      case "delete":
        return await this.analysisHandlers.handleDeleteAnalysis(runId, this.env, corsHeaders);
      default:
        return handleNotFound(corsHeaders);
    }
  }

  private async routeAIReadiness(
    method: string,
    request: Request,
    params: Record<string, string>,
    corsHeaders: ReturnType<typeof getCorsHeaders>,
    ctx?: ExecutionContext
  ): Promise<Response> {
    switch (method) {
      case "analyze":
        return await this.aiReadinessHandler.handleAnalyze(request, corsHeaders, ctx);
      case "getStatus":
        const runId = params.param0 || "";
        if (!runId) {
          return handleNotFound(corsHeaders);
        }
        return await this.aiReadinessHandler.handleGetStatus(runId, corsHeaders);
      default:
        return handleNotFound(corsHeaders);
    }
  }
}
