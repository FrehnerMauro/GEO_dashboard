/**
 * Router - Handles request routing and delegation to handlers
 */

import type { Env } from "./types.js";
import { matchRoute } from "./routes/route-definitions.js";
import { handleCors, getCorsHeaders, handleError, handleNotFound } from "./middleware/index.js";
import { WorkflowHandlers } from "./handlers/workflow.js";
import { AnalysisHandlers } from "./handlers/analysis.js";
import { CompanyHandler } from "./handlers/company-handler.js";
import { ScheduleHandler } from "./handlers/schedule-handler.js";
import { WorkflowEngine } from "../engine_workflow.js";
import { GEOEngine } from "../engine.js";

export class Router {
  private workflowHandlers: WorkflowHandlers;
  private analysisHandlers: AnalysisHandlers;
  private companyHandler: CompanyHandler;
  private scheduleHandler: ScheduleHandler;

  constructor(
    private engine: GEOEngine,
    private env: Env
  ) {
    const workflowEngine = new WorkflowEngine(env);
    this.workflowHandlers = new WorkflowHandlers(workflowEngine);
    this.analysisHandlers = new AnalysisHandlers(engine);
    this.companyHandler = new CompanyHandler(env);
    this.scheduleHandler = new ScheduleHandler(env);
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
          return await this.routeWorkflow(methodName, request, params, corsHeaders, ctx);
        case "analysis":
          return await this.routeAnalysis(methodName, request, params, corsHeaders);
        case "company":
          return await this.routeCompany(methodName, request, params, corsHeaders);
        case "schedule":
          return await this.routeSchedule(methodName, request, params, corsHeaders);
        case "aiReadiness":
          return await this.routeAIReadiness(methodName, request, params, corsHeaders, ctx);
        case "chat":
        case "test":
        case "setup":
        case "health":
        case "root":
          // These still need to be handled by the old routes.ts for now
          // We'll migrate them gradually
          return handleNotFound(corsHeaders);
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
    corsHeaders: ReturnType<typeof getCorsHeaders>,
    ctx?: ExecutionContext
  ): Promise<Response> {
    switch (method) {
      case "step1":
        return await this.workflowHandlers.handleStep1(request, this.env, corsHeaders);
      case "step2":
        return await this.workflowHandlers.handleStep2(request, this.env, corsHeaders);
      case "step3":
        return await this.workflowHandlers.handleStep3(request, this.env, corsHeaders);
      case "saveCategories":
        return await this.workflowHandlers.handleSaveCategories(params.param0 || "", request, this.env, corsHeaders);
      case "step4":
        return await this.workflowHandlers.handleStep4(request, this.env, corsHeaders);
      case "savePrompts":
        return await this.workflowHandlers.handleSavePrompts(params.param0 || "", request, this.env, corsHeaders);
      case "step5":
        return await this.workflowHandlers.handleStep5(request, this.env, corsHeaders);
      case "fetchUrl":
      case "executePrompt":
      case "generateSummary":
        // These need to be added to WorkflowHandlers
        return new Response(JSON.stringify({ error: "Not implemented" }), {
          status: 501,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
      case "getInsights":
        return await this.analysisHandlers.handleGetAnalysisInsights(runId, this.env, corsHeaders);
      case "delete":
        return await this.analysisHandlers.handleDeleteAnalysis(runId, this.env, corsHeaders);
      case "pause":
        // This needs to be added to AnalysisHandlers
        return new Response(JSON.stringify({ error: "Not implemented" }), {
          status: 501,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      default:
        return handleNotFound(corsHeaders);
    }
  }

  private async routeCompany(
    method: string,
    request: Request,
    params: Record<string, string>,
    corsHeaders: ReturnType<typeof getCorsHeaders>
  ): Promise<Response> {
    const companyId = params.param0 || "";
    
    switch (method) {
      case "getAll":
        return await this.companyHandler.getAll(request, corsHeaders);
      case "get":
        return await this.companyHandler.get(companyId, corsHeaders);
      case "create":
        return await this.companyHandler.create(request, corsHeaders);
      case "getPrompts":
        return await this.companyHandler.getPrompts(companyId, corsHeaders);
      case "getRuns":
        return await this.companyHandler.getRuns(companyId, request, corsHeaders);
      case "getTimeSeries":
        return await this.companyHandler.getTimeSeries(companyId, request, corsHeaders);
      default:
        return handleNotFound(corsHeaders);
    }
  }

  private async routeSchedule(
    method: string,
    request: Request,
    params: Record<string, string>,
    corsHeaders: ReturnType<typeof getCorsHeaders>
  ): Promise<Response> {
    const scheduleId = params.param0 || "";
    
    switch (method) {
      case "getAll":
        return await this.scheduleHandler.getAll(request, corsHeaders);
      case "create":
        return await this.scheduleHandler.create(request, corsHeaders);
      case "update":
        return await this.scheduleHandler.update(scheduleId, request, corsHeaders);
      case "execute":
        return await this.scheduleHandler.execute(request, this.env, corsHeaders);
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
    // These still need to be implemented
    return new Response(JSON.stringify({ error: "Not implemented" }), {
      status: 501,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

