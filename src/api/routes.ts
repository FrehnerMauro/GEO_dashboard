/**
 * API routes for the GEO platform
 */

import type { UserInput, AnalysisResult, Prompt } from "../types.js";
import { GEOEngine } from "../engine.js";
import { WorkflowEngine } from "../engine_workflow.js";
import { Database } from "../persistence/db.js";

export interface Env {
  geo_db: D1Database;
  OPENAI_API_KEY: string;
  [key: string]: any;
}

export class APIRoutes {
  private workflowEngine: WorkflowEngine;

  constructor(private engine: GEOEngine) {
    // WorkflowEngine will be initialized per request with env
  }

  async handleRequest(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Initialize workflow engine
      if (!this.workflowEngine) {
        this.workflowEngine = new WorkflowEngine(env);
      }

      // POST /api/workflow/step1 - Find sitemap
      if (path === "/api/workflow/step1" && request.method === "POST") {
        return await this.handleStep1(request, env, corsHeaders);
      }

      // POST /api/workflow/step2 - Fetch content
      if (path === "/api/workflow/step2" && request.method === "POST") {
        return await this.handleStep2(request, env, corsHeaders);
      }

      // POST /api/workflow/step3 - Generate categories
      if (path === "/api/workflow/step3" && request.method === "POST") {
        return await this.handleStep3(request, env, corsHeaders);
      }

      // PUT /api/workflow/:runId/categories - Save selected categories
      if (
        path.includes("/categories") &&
        path.startsWith("/api/workflow/") &&
        request.method === "PUT"
      ) {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.handleSaveCategories(runId, request, env, corsHeaders);
        }
      }

      // POST /api/workflow/step4 - Generate prompts
      if (path === "/api/workflow/step4" && request.method === "POST") {
        return await this.handleStep4(request, env, corsHeaders);
      }

      // PUT /api/workflow/:runId/prompts - Save edited prompts
      if (
        path.includes("/prompts") &&
        path.startsWith("/api/workflow/") &&
        request.method === "PUT"
      ) {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.handleSavePrompts(runId, request, env, corsHeaders);
        }
      }

      // POST /api/workflow/fetchUrl - Fetch single URL (for live updates)
      if (path === "/api/workflow/fetchUrl" && request.method === "POST") {
        return await this.handleFetchUrl(request, env, corsHeaders);
      }

      // POST /api/workflow/executePrompt - Execute single prompt (for live updates)
      if (path === "/api/workflow/executePrompt" && request.method === "POST") {
        return await this.handleExecutePrompt(request, env, corsHeaders);
      }

      // POST /api/chat - Chat with GPT-5 Web Search
      if (path === "/api/chat" && request.method === "POST") {
        return await this.handleChat(request, env, corsHeaders);
      }

      // POST /api/workflow/generateSummary - Generate summary/fazit
      if (path === "/api/workflow/generateSummary" && request.method === "POST") {
        return await this.handleGenerateSummary(request, env, corsHeaders);
      }

      // POST /api/workflow/step5 - Execute prompts
      if (path === "/api/workflow/step5" && request.method === "POST") {
        return await this.handleStep5(request, env, corsHeaders);
      }

      // POST /api/scheduler/execute - Execute scheduled run with saved prompts
      if (path === "/api/scheduler/execute" && request.method === "POST") {
        return await this.handleExecuteScheduledRun(request, env, corsHeaders);
      }

      // POST /api/analyze - Start new analysis (legacy)
      if (path === "/api/analyze" && request.method === "POST") {
        return await this.handleAnalyze(request, env, corsHeaders);
      }

      // GET /api/analyses - Get all analysis runs
      if (path === "/api/analyses" && request.method === "GET") {
        return await this.handleGetAllAnalyses(request, env, corsHeaders);
      }

      // DELETE /api/analysis/:runId - Delete analysis
      if (path.startsWith("/api/analysis/") && request.method === "DELETE") {
        const runId = path.split("/").pop();
        if (runId && runId !== "analyses") {
          return await this.handleDeleteAnalysis(runId, env, corsHeaders);
        }
      }

      // PUT /api/analysis/:runId/pause - Pause analysis
      if (path.startsWith("/api/analysis/") && path.endsWith("/pause") && request.method === "PUT") {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.handlePauseAnalysis(runId, env, corsHeaders);
        }
      }

      // GET /api/analysis/:runId - Get analysis results
      if (path.startsWith("/api/analysis/") && request.method === "GET") {
        const runId = path.split("/").pop();
        if (runId && runId !== "analyses") {
          // Check if it's the insights endpoint
          if (path.includes("/insights")) {
            const pathParts = path.split("/");
            const actualRunId = pathParts[pathParts.length - 2]; // runId is before "insights"
            if (actualRunId && actualRunId !== "analyses") {
            return await this.handleGetAnalysisInsights(actualRunId, env, corsHeaders);
            }
          }
          return await this.handleGetAnalysis(runId, env, corsHeaders);
        }
      }

      // GET /api/analysis/:runId/status - Get analysis status
      if (
        path.includes("/status") &&
        path.startsWith("/api/analysis/") &&
        !path.includes("/metrics") &&
        request.method === "GET"
      ) {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.handleGetStatus(runId, env, corsHeaders);
        }
      }

      // GET /api/analysis/:runId/metrics - Get category metrics
      if (
        path.includes("/metrics") &&
        path.startsWith("/api/analysis/") &&
        request.method === "GET"
      ) {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.handleGetMetrics(runId, env, corsHeaders);
        }
      }

      // GET /api/health - Health check
      if (path === "/api/health" && request.method === "GET") {
        return new Response(
          JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // POST /api/ai-readiness/analyze - Start AI Readiness analysis
      if (path === "/api/ai-readiness/analyze" && request.method === "POST") {
        return await this.handleAIReadinessAnalyze(request, env, corsHeaders);
      }

      // GET /api/ai-readiness/status/:runId - Get AI Readiness status
      if (path.startsWith("/api/ai-readiness/status/") && request.method === "GET") {
        const runId = path.split("/").pop();
        if (runId) {
          return await this.handleAIReadinessStatus(runId, env, corsHeaders);
        }
      }

      // POST /api/ai-readiness/analyze - Start AI Readiness analysis
      if (path === "/api/ai-readiness/analyze" && request.method === "POST") {
        return await this.handleAIReadinessAnalyze(request, env, corsHeaders);
      }

      // GET /api/ai-readiness/status/:runId - Get AI Readiness status
      if (path.startsWith("/api/ai-readiness/status/") && request.method === "GET") {
        const runId = path.split("/").pop();
        if (runId) {
          return await this.handleAIReadinessStatus(runId, env, corsHeaders);
        }
      }

      // POST /api/setup/database - Setup database (run migrations)
      if (path === "/api/setup/database" && request.method === "POST") {
        return await this.handleSetupDatabase(request, env, corsHeaders);
      }

      // Company Management Endpoints
      // GET /api/companies - Get all companies
      if (path === "/api/companies" && request.method === "GET") {
        const db = new Database(env.geo_db);
        const companies = await db.getAllCompanies();
        return new Response(JSON.stringify(companies), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST /api/companies - Create new company
      if (path === "/api/companies" && request.method === "POST") {
        const body = await request.json();
        const db = new Database(env.geo_db);
        const companyId = await db.createCompany({
          name: body.name,
          websiteUrl: body.websiteUrl,
          country: body.country,
          language: body.language,
          region: body.region,
          description: body.description,
          isActive: true,
        });
        const company = await db.getCompany(companyId);
        return new Response(JSON.stringify(company), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /api/companies/:id - Get company
      if (path.startsWith("/api/companies/") && request.method === "GET") {
        const companyId = path.split("/")[3];
        const db = new Database(env.geo_db);
        const company = await db.getCompany(companyId);
        if (!company) {
          return new Response(JSON.stringify({ error: "Company not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify(company), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /api/companies/:id/prompts - Get company prompts
      if (path.includes("/prompts") && path.startsWith("/api/companies/") && request.method === "GET") {
        const companyId = path.split("/")[3];
        const db = new Database(env.geo_db);
        const prompts = await db.getCompanyPrompts(companyId);
        return new Response(JSON.stringify(prompts), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /api/companies/:id/runs - Get company analysis runs
      if (path.includes("/runs") && path.startsWith("/api/companies/") && request.method === "GET") {
        const companyId = path.split("/")[3];
        const url = new URL(request.url);
        const detailed = url.searchParams.get("detailed") === "true";
        
        const db = new Database(env.geo_db);
        
        if (detailed) {
          // Return detailed analysis data for all runs (for historical comparison)
          return await this.handleGetCompanyAnalysisRunsDetailed(companyId, env, corsHeaders);
        } else {
          // Return just the run metadata
          const runs = await db.getCompanyAnalysisRuns(companyId);
          return new Response(JSON.stringify(runs), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // GET /api/companies/:id/timeseries - Get company time series data
      if (path.includes("/timeseries") && path.startsWith("/api/companies/") && request.method === "GET") {
        const companyId = path.split("/")[3];
        const url = new URL(request.url);
        const days = parseInt(url.searchParams.get("days") || "30");
        const db = new Database(env.geo_db);
        const timeSeries = await db.getCompanyTimeSeries(companyId, days);
        return new Response(JSON.stringify(timeSeries), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Scheduled Runs Endpoints
      // GET /api/schedules - Get all scheduled runs (optionally filtered by company)
      if (path === "/api/schedules" && request.method === "GET") {
        const url = new URL(request.url);
        const companyId = url.searchParams.get("companyId") || undefined;
        const db = new Database(env.geo_db);
        const schedules = await db.getScheduledRuns(companyId, true);
        return new Response(JSON.stringify(schedules), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST /api/schedules - Create new scheduled run
      if (path === "/api/schedules" && request.method === "POST") {
        const body = await request.json() as any;
        const db = new Database(env.geo_db);
        
        // Calculate next run time based on schedule type
        const now = new Date();
        let nextRunAt = new Date(now);
        if (body.scheduleType === "daily") {
          nextRunAt.setDate(nextRunAt.getDate() + 1);
        } else if (body.scheduleType === "weekly") {
          nextRunAt.setDate(nextRunAt.getDate() + 7);
        } else if (body.scheduleType === "monthly") {
          nextRunAt.setMonth(nextRunAt.getMonth() + 1);
        }
        
        const scheduleId = await db.createScheduledRun({
          companyId: body.companyId,
          scheduleType: body.scheduleType,
          nextRunAt: nextRunAt.toISOString(),
          isActive: true,
        });
        
        const schedule = await db.getScheduledRuns(undefined, false);
        const created = schedule.find(s => s.id === scheduleId);
        return new Response(JSON.stringify(created), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PUT /api/schedules/:id - Update scheduled run
      if (path.startsWith("/api/schedules/") && request.method === "PUT") {
        const scheduleId = path.split("/")[3];
        const body = await request.json() as any;
        const db = new Database(env.geo_db);
        
        // Recalculate next run time if schedule type changed
        if (body.scheduleType) {
          const now = new Date();
          let nextRunAt = new Date(now);
          if (body.scheduleType === "daily") {
            nextRunAt.setDate(nextRunAt.getDate() + 1);
          } else if (body.scheduleType === "weekly") {
            nextRunAt.setDate(nextRunAt.getDate() + 7);
          } else if (body.scheduleType === "monthly") {
            nextRunAt.setMonth(nextRunAt.getMonth() + 1);
          }
          body.nextRunAt = nextRunAt.toISOString();
        }
        
        await db.updateScheduledRun(scheduleId, body);
        const schedules = await db.getScheduledRuns(undefined, false);
        const updated = schedules.find(s => s.id === scheduleId);
        return new Response(JSON.stringify(updated), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET / - Root endpoint with HTML landing page
      if (path === "/" && request.method === "GET") {
        const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GEO Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌐</text></svg>">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --accent: #0ea5e9;
      --text: #0f172a;
      --text-light: #64748b;
      --border: #e2e8f0;
      --bg: #ffffff;
      --bg-secondary: #f8fafc;
      --bg-hover: #f1f5f9;
      --success: #059669;
      --warning: #d97706;
      --error: #dc2626;
      --sidebar-width: 240px;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-secondary);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .app-container {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: var(--sidebar-width);
      background: var(--bg);
      border-right: 1px solid var(--border);
      position: fixed;
      height: 100vh;
      left: 0;
      top: 0;
      z-index: 1000;
      overflow-y: auto;
    }
    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid var(--border);
    }
    .sidebar-header h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .sidebar-header p {
      font-size: 11px;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 1.2px;
      font-weight: 500;
    }
    .sidebar-nav {
      padding: 12px 0;
    }
    .nav-item {
      padding: 10px 20px;
      color: var(--text-light);
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 500;
    }
    .nav-item:hover {
      background: var(--bg-hover);
      color: var(--text);
    }
    .nav-item.active {
      background: var(--bg-hover);
      color: var(--primary);
      border-left: 3px solid var(--primary);
      padding-left: 17px;
    }
    .nav-item-icon {
      width: 18px;
      font-size: 16px;
    }
    .main-content {
      margin-left: var(--sidebar-width);
      flex: 1;
      min-height: 100vh;
    }
    .top-header {
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      padding: 18px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .top-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -0.3px;
    }
    .content-area {
      padding: 32px;
      max-width: 1200px;
    }
    .card {
      background: var(--bg);
      border-radius: 8px;
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .card-header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-header h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -0.2px;
    }
    .card-body {
      padding: 24px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .form-group label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }
    .form-group input,
    .form-group select {
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.15s;
      background: var(--bg);
      color: var(--text);
      font-family: inherit;
    }
    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
    }
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      font-family: inherit;
    }
    .btn-primary {
      background: var(--primary);
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      background: var(--primary-hover);
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-block {
      width: 100%;
      justify-content: center;
    }
    /* Progress */
    .progress-container {
      background: var(--gray-100);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--gray-200);
      border-radius: 4px;
      overflow: hidden;
      margin: 16px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%);
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }
    .progress-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: shimmer 2s infinite;
    }
    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    .progress-text {
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-700);
      margin-top: 12px;
    }
    /* Status Messages */
    .status-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid var(--gray-200);
      margin: 20px 0;
    }
    .status-title {
      font-weight: 600;
      color: var(--gray-900);
      margin-bottom: 8px;
      font-size: 15px;
    }
    .status-details {
      color: var(--gray-600);
      font-size: 14px;
    }
    /* Results */
    .results-container {
      margin-top: 32px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    .data-table th {
      text-align: left;
      padding: 12px 16px;
      background: var(--gray-50);
      font-size: 12px;
      font-weight: 600;
      color: var(--gray-700);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid var(--gray-200);
    }
    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--gray-200);
      font-size: 14px;
      color: var(--gray-700);
    }
    .data-table tr:hover {
      background: var(--gray-50);
    }
    /* Badges */
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .badge-warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .badge-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
    .badge-primary { background: rgba(99, 102, 241, 0.1); color: var(--primary); }
    /* Loading */
    .loading {
      display: none;
    }
    .loading.show {
      display: block;
    }
    /* Responsive */
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s;
      }
      .main-content {
        margin-left: 0;
      }
      .form-grid {
        grid-template-columns: 1fr;
      }
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
  <script>
    // GLOBAL FUNCTIONS - available immediately (before DOMContentLoaded)
    // These must be defined before any HTML tries to call them
    (function() {
      window.showDashboard = function(event) {
        if (event) event.preventDefault();
        const analysesSection = document.getElementById('analysesSection');
        const analysisDetailSection = document.getElementById('analysisDetailSection');
        const aiReadinessSection = document.getElementById('aiReadinessSection');
        const analysisSection = document.querySelector('.content-area > .card');
        if (analysesSection) analysesSection.style.display = 'none';
        if (analysisDetailSection) analysisDetailSection.style.display = 'none';
        if (aiReadinessSection) aiReadinessSection.style.display = 'none';
        if (analysisSection) analysisSection.style.display = 'block';
        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        if (event && event.target) {
          event.target.closest('.nav-item')?.classList.add('active');
        } else {
          const dashboardNav = document.querySelector('.nav-item');
          if (dashboardNav) dashboardNav.classList.add('active');
        }
        if (window.showDashboardFull) {
          window.showDashboardFull(event);
        }
      };
      
      window.showAnalyses = function(event) {
        if (event) event.preventDefault();
        const analysesSection = document.getElementById('analysesSection');
        const analysisDetailSection = document.getElementById('analysisDetailSection');
        const aiReadinessSection = document.getElementById('aiReadinessSection');
        const analysisSection = document.querySelector('.content-area > .card');
        if (analysesSection) analysesSection.style.display = 'block';
        if (analysisDetailSection) analysisDetailSection.style.display = 'none';
        if (aiReadinessSection) aiReadinessSection.style.display = 'none';
        if (analysisSection) analysisSection.style.display = 'none';
        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        if (event && event.target) {
          event.target.closest('.nav-item')?.classList.add('active');
        }
        if (window.loadAnalyses) {
          window.loadAnalyses();
        } else if (window.showAnalysesFull) {
          window.showAnalysesFull(event);
        }
      };
      
      window.showAIReadiness = function(event) {
        if (event) event.preventDefault();
        const analysesSection = document.getElementById('analysesSection');
        const analysisDetailSection = document.getElementById('analysisDetailSection');
        const aiReadinessSection = document.getElementById('aiReadinessSection');
        const analysisSection = document.querySelector('.content-area > .card');
        if (analysesSection) analysesSection.style.display = 'none';
        if (analysisDetailSection) analysisDetailSection.style.display = 'none';
        if (aiReadinessSection) aiReadinessSection.style.display = 'block';
        if (analysisSection) analysisSection.style.display = 'none';
        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        if (event && event.target) {
          event.target.closest('.nav-item')?.classList.add('active');
        }
        if (window.showAIReadinessFull) {
          window.showAIReadinessFull(event);
        }
      };
      
      window.startAIReadiness = async function() {
        // Direct implementation - no need to wait for DOMContentLoaded
        const urlInput = document.getElementById('aiReadinessUrl');
        const url = urlInput?.value?.trim();
        
        if (!url) {
          alert('Bitte geben Sie eine URL ein.');
          return;
        }
        
        // Auto-add https:// if missing
        let websiteUrl = url;
        const urlPattern = new RegExp('^https?:\\/\\/', 'i');
        if (!urlPattern.test(websiteUrl)) {
          websiteUrl = 'https://' + websiteUrl;
        }
        
        // Validate URL
        try {
          new URL(websiteUrl);
        } catch (e) {
          alert('Ungültige URL. Bitte geben Sie eine gültige URL ein.');
          return;
        }
        
        // Update input field with normalized URL
        if (urlInput) {
          urlInput.value = websiteUrl;
        }
        
        const loadingEl = document.getElementById('aiReadinessLoading');
        const resultsEl = document.getElementById('aiReadinessResults');
        const statusEl = document.getElementById('aiReadinessStatus');
        const statusDetailsEl = document.getElementById('aiReadinessStatusDetails');
        const progressEl = document.getElementById('aiReadinessProgress');
        const progressTextEl = document.getElementById('aiReadinessProgressText');
        const resultsContentEl = document.getElementById('aiReadinessResultsContent');
        const startBtn = document.getElementById('startAIReadinessBtn');
        
        if (loadingEl) {
          loadingEl.style.display = 'block';
          loadingEl.classList.add('show');
        }
        if (resultsEl) resultsEl.style.display = 'none';
        if (statusEl) statusEl.textContent = 'Vorbereitung...';
        if (statusDetailsEl) statusDetailsEl.textContent = 'Starte AI Readiness Check...';
        if (progressEl) progressEl.style.width = '0%';
        if (progressTextEl) progressTextEl.textContent = '0%';
        if (startBtn) {
          startBtn.disabled = true;
          startBtn.textContent = 'Läuft...';
        }
        
        try {
          // Step 1: Start analysis
          if (statusEl) statusEl.textContent = 'Schritt 1: Starte Analyse...';
          if (statusDetailsEl) statusDetailsEl.textContent = 'Hole robots.txt und Sitemap...';
          if (progressEl) progressEl.style.width = '10%';
          if (progressTextEl) progressTextEl.textContent = '10%';
          
          const step1Response = await fetch('/api/ai-readiness/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ websiteUrl })
          });
          
          if (!step1Response.ok) {
            throw new Error('Fehler beim Starten der Analyse');
          }
          
          const step1Data = await step1Response.json();
          const runId = step1Data.runId;
          
          // Step 2: Poll for status updates with live progress
          let attempts = 0;
          const maxAttempts = 120; // 10 minutes max (2 second intervals)
          let lastMessage = '';
          let pollingStopped = false;
          
          // Centralized error handler
          const handlePollingError = function(error) {
            pollingStopped = true;
            console.error('Error in AI Readiness polling:', error);
            if (statusEl) statusEl.textContent = '❌ Fehler';
            if (statusDetailsEl) statusDetailsEl.textContent = error instanceof Error ? error.message : 'Unbekannter Fehler';
            if (startBtn) {
              startBtn.disabled = false;
              startBtn.textContent = 'AI Readiness Check starten';
            }
            if (loadingEl) {
              setTimeout(() => {
                if (loadingEl) {
                  loadingEl.style.display = 'none';
                  loadingEl.classList.remove('show');
                }
              }, 2000);
            }
            alert('Fehler beim AI Readiness Check: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
          };
          
          const pollStatus = async function() {
            if (pollingStopped) {
              return;
            }
            
            attempts++;
            
            try {
              const statusResponse = await fetch('/api/ai-readiness/status/' + runId);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                
                // Update UI with live status
                if (statusData.message && statusData.message !== lastMessage) {
                  lastMessage = statusData.message;
                  if (statusDetailsEl) {
                    statusDetailsEl.textContent = statusData.message;
                  }
                  
                  // Update progress based on message content
                  if (statusData.message.includes('robots.txt')) {
                    if (progressEl) progressEl.style.width = '20%';
                    if (progressTextEl) progressTextEl.textContent = '20%';
                    if (statusEl) statusEl.textContent = 'Schritt 1: robots.txt und Sitemap';
                  } else if (statusData.message.includes('Sitemap gefunden')) {
                    if (progressEl) progressEl.style.width = '30%';
                    if (progressTextEl) progressTextEl.textContent = '30%';
                    if (statusEl) statusEl.textContent = 'Schritt 2: Sitemap gefunden';
                  } else if (statusData.message.includes('Hole Seiten-Inhalte')) {
                    const progressMatch = new RegExp('(\\\\d+)/(\\\\d+)');
                    const match = statusData.message.match(progressMatch);
                    if (match) {
                      const current = parseInt(match[1]);
                      const total = parseInt(match[2]);
                      const percent = 30 + Math.floor((current / total) * 50); // 30% to 80%
                      if (progressEl) progressEl.style.width = percent + '%';
                      if (progressTextEl) progressTextEl.textContent = percent + '%';
                      if (statusEl) statusEl.textContent = 'Schritt 3: Seiten-Inhalte holen';
                    }
                  } else if (statusData.message.includes('Generiere AI Readiness')) {
                    if (progressEl) progressEl.style.width = '85%';
                    if (progressTextEl) progressTextEl.textContent = '85%';
                    if (statusEl) statusEl.textContent = 'Schritt 4: GPT-Analyse';
                  }
                }
                
                if (statusData.status === 'completed') {
                  // Analysis complete
                  pollingStopped = true;
                  if (statusEl) statusEl.textContent = '✅ Analyse abgeschlossen';
                  if (statusDetailsEl) statusDetailsEl.textContent = 'AI Readiness Check erfolgreich durchgeführt';
                  if (progressEl) progressEl.style.width = '100%';
                  if (progressTextEl) progressTextEl.textContent = '100%';
                  
                  if (resultsContentEl && statusData.recommendations) {
                    resultsContentEl.innerHTML = 
                      '<div style="white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #374151;">' +
                      statusData.recommendations.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
                      '</div>';
                  }
                  
                  if (resultsEl) resultsEl.style.display = 'block';
                  if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.textContent = 'AI Readiness Check starten';
                  }
                  
                  // Hide loading after a delay
                  setTimeout(() => {
                    if (loadingEl) {
                      loadingEl.style.display = 'none';
                      loadingEl.classList.remove('show');
                    }
                  }, 2000);
                  
                  return; // Stop polling
                } else if (statusData.status === 'error') {
                  // Critical error - stop polling and handle
                  handlePollingError(new Error(statusData.error || 'Fehler bei der Analyse'));
                  return;
                }
              }
              
              // Check timeout before continuing
              if (attempts >= maxAttempts) {
                handlePollingError(new Error('Timeout: Die Analyse hat zu lange gedauert.'));
                return;
              }
              
              // Continue polling every 2 seconds for faster updates
              // All errors in scheduled calls are handled by the catch block
              setTimeout(() => {
                pollStatus().catch(handlePollingError);
              }, 2000);
              
            } catch (error) {
              // Check if this is a critical error that should stop polling
              const isCriticalError = error instanceof Error && (
                error.message.includes('Timeout') || 
                error.message.includes('Fehler bei der Analyse')
              );
              
              if (isCriticalError) {
                handlePollingError(error);
                return;
              }
              
              // Non-critical error - log and continue
              console.error('Non-critical error polling status:', error);
              
              // Check timeout even on error
              if (attempts >= maxAttempts) {
                handlePollingError(new Error('Timeout: Die Analyse hat zu lange gedauert.'));
                return;
              }
              
              // Continue polling on non-critical errors
              setTimeout(() => {
                pollStatus().catch(handlePollingError);
              }, 2000);
            }
          };
          
          // Start polling and handle errors
          pollStatus().catch(handlePollingError);
          
        } catch (error) {
          console.error('Error in AI Readiness check:', error);
          if (statusEl) statusEl.textContent = '❌ Fehler';
          if (statusDetailsEl) statusDetailsEl.textContent = error instanceof Error ? error.message : 'Unbekannter Fehler';
          alert('Fehler beim AI Readiness Check: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
          if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'AI Readiness Check starten';
          }
          if (loadingEl) {
            setTimeout(() => {
              loadingEl.style.display = 'none';
              loadingEl.classList.remove('show');
            }, 2000);
          }
        }
      };
    })();
  </script>
</head>
<body>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>GEO</h1>
        <p>Engine Optimization</p>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-item active" onclick="showDashboard(event)">
          <span>Dashboard</span>
        </div>
        <div class="nav-item" onclick="showAnalyses(event)">
          <span>Analysen</span>
        </div>
        <div class="nav-item" onclick="showAIReadiness(event)">
          <span>AI Readiness</span>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="top-header">
        <h2>Neue Analyse starten</h2>
        <div style="display: flex; gap: 12px; align-items: center;">
          <span style="font-size: 14px; color: var(--gray-500);">Status: Bereit</span>
        </div>
      </header>

      <div class="content-area">
        <!-- Analysis Form -->
        <div class="card">
          <div class="card-header">
            <h3>Analyse-Konfiguration</h3>
          </div>
          <div class="card-body">
            <form id="analyzeForm">
              <div class="form-grid">
                <div class="form-group">
                  <label for="websiteUrl">Website URL *</label>
                  <input type="url" id="websiteUrl" name="websiteUrl" 
                         placeholder="https://example.com" required>
                </div>
                <div class="form-group">
                  <label for="country">Land (ISO Code) *</label>
                  <input type="text" id="country" name="country" 
                         placeholder="CH, DE, US" maxlength="2" required>
                </div>
                <div class="form-group">
                  <label for="language">Sprache (ISO Code) *</label>
                  <select id="language" name="language" required>
                    <option value="de">Deutsch (de)</option>
                    <option value="en">English (en)</option>
                    <option value="fr">Français (fr)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="region">Region (optional)</label>
                  <input type="text" id="region" name="region" 
                         placeholder="z.B. Zurich, Berlin">
                </div>
                <div class="form-group">
                  <label for="questionsPerCategory">Fragen pro Kategorie</label>
                  <input type="number" id="questionsPerCategory" name="questionsPerCategory" 
                         value="3" min="1" max="10" style="width: 100px;">
                  <small style="display: block; margin-top: 4px; color: var(--gray-500); font-size: 12px;">Anzahl der Fragen, die pro Kategorie generiert werden (Standard: 3)</small>
                </div>
              </div>
              <button type="button" id="startAnalysisBtn" class="btn btn-primary btn-block" 
                      onclick="if(window.startAnalysisNow){window.startAnalysisNow();}else{alert('startAnalysisNow nicht gefunden!');} return false;">
                Analyse starten
              </button>
            </form>

            <!-- Loading/Progress -->
            <div class="loading" id="loading" style="display: none;">
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                </div>
                <div class="progress-text" id="progressText">Initializing...</div>
              </div>
              <div class="status-card">
                <div class="status-title" id="currentStatus">Bereit zum Starten...</div>
                <div class="status-details" id="statusDetails"></div>
              </div>
            </div>

            <!-- Results -->
            <div id="result" style="display: none; margin-top: 24px;">
              <div class="card">
                <div class="card-header">
                  <h3>Analyse-Ergebnisse</h3>
                </div>
                <div class="card-body">
                  <div id="resultContent"></div>
                </div>
              </div>
            </div>

            <div id="resultsContainer" style="display: none; margin-top: 24px;">
              <div class="card">
                <div class="card-header">
                  <h3>Detaillierte Analyse-Ergebnisse</h3>
                </div>
                <div class="card-body">
                  <div id="resultsContent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analyses Section (hidden by default) -->
        <div id="analysesSection" style="display: none;">
          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h3>Gespeicherte Analysen</h3>
              <button class="btn btn-primary" onclick="if(typeof hideAllSections === 'function'){hideAllSections();} (function(){var card = document.querySelector('.content-area > .card'); if(card){card.style.display = 'block';}})();" style="padding: 8px 16px; font-size: 14px;">
                + Neue Analyse
              </button>
            </div>
            <div class="card-body">
              <div id="analysesList" style="display: grid; gap: 16px;">
                <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                  Lade Analysen...
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analysis Detail Section (hidden by default) -->
        <div id="analysisDetailSection" style="display: none;">
          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h3 id="analysisDetailTitle">Analyse Details</h3>
              <button class="btn" onclick="showAnalyses(event)" style="padding: 8px 16px; font-size: 14px; background: var(--gray-100); color: var(--gray-700);">
                ← Zurück
              </button>
            </div>
            <div class="card-body">
              <div id="analysisDetailContent">
                <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                  Lade Analyse-Details...
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Readiness Section -->
        <div id="aiReadinessSection" style="display: none;">
          <div class="card">
            <div class="card-header">
              <h3>AI Readiness Check</h3>
              <p style="margin: 8px 0 0 0; color: var(--gray-600); font-size: 14px;">
                Analysiere die Website auf AI-Readiness: robots.txt, Sitemap und alle Seiten werden analysiert.
              </p>
            </div>
            <div class="card-body">
              <form id="aiReadinessForm">
                <div class="form-group">
                  <label for="aiReadinessUrl">Website URL *</label>
                  <input type="text" id="aiReadinessUrl" name="aiReadinessUrl" 
                         placeholder="example.com oder https://example.com" required>
                  <small style="display: block; margin-top: 4px; color: var(--gray-500); font-size: 12px;">
                    Die URL der zu analysierenden Website (https:// wird automatisch hinzugefügt)
                  </small>
                </div>
                <button type="button" id="startAIReadinessBtn" class="btn btn-primary btn-block" 
                        onclick="if(window.startAIReadiness){window.startAIReadiness();}else{alert('startAIReadiness nicht gefunden!');} return false;">
                  AI Readiness Check starten
                  </button>
                </form>
              
              <!-- Progress -->
              <div id="aiReadinessLoading" class="loading" style="margin-top: 24px;">
                <div class="status-card">
                  <div class="status-title" id="aiReadinessStatus">Vorbereitung...</div>
                  <div class="status-details" id="aiReadinessStatusDetails">Starte Analyse...</div>
                  <div class="progress-bar" style="margin-top: 16px;">
                    <div class="progress-fill" id="aiReadinessProgress" style="width: 0%;"></div>
                </div>
                  <div class="progress-text" id="aiReadinessProgressText">0%</div>
              </div>
              
              <!-- Console Log -->
              <div id="aiReadinessConsole" style="display: none; margin-top: 24px;">
                <div class="card" style="background: #1e1e1e; border: 1px solid #333;">
                  <div class="card-header" style="background: #2d2d2d; border-bottom: 1px solid #444; padding: 12px 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <h4 style="margin: 0; color: #fff; font-size: 14px; font-weight: 600;">📋 Console Log</h4>
                      <button type="button" id="clearConsoleBtn" style="background: #444; color: #fff; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Löschen</button>
                    </div>
                  </div>
                  <div class="card-body" style="padding: 16px;">
                    <div id="aiReadinessConsoleContent" style="background: #1e1e1e; color: #d4d4d4; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.6; max-height: 400px; overflow-y: auto; padding: 12px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word;">
                      <div style="color: #6a9955;">[System] Console bereit. Warte auf Logs...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              
              <!-- Results -->
              <div id="aiReadinessResults" style="display: none; margin-top: 32px;">
                <div class="card">
                  <div class="card-header">
                    <h3>AI Readiness Empfehlungen</h3>
          </div>
                  <div class="card-body" id="aiReadinessResultsContent">
                    <!-- Results werden hier angezeigt -->
        </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>

  <script>
    // GLOBAL FUNCTIONS - available immediately (before DOMContentLoaded)
    // These must be defined before any HTML tries to call them
    window.showDashboard = function(event) {
      if (event) event.preventDefault();
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const analysisSection = document.querySelector('.content-area > .card');
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (analysisSection) analysisSection.style.display = 'block';
      // Update navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      } else {
        // Set first nav item (Dashboard) as active
        const dashboardNav = document.querySelector('.nav-item');
        if (dashboardNav) dashboardNav.classList.add('active');
      }
      // Try to call full implementation if available
      if (window.showDashboardFull) {
        window.showDashboardFull(event);
      }
    };
    
    window.showAnalyses = function(event) {
      if (event) event.preventDefault();
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const aiReadinessSection = document.getElementById('aiReadinessSection');
      const analysisSection = document.querySelector('.content-area > .card');
      if (analysesSection) analysesSection.style.display = 'block';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (aiReadinessSection) aiReadinessSection.style.display = 'none';
      if (analysisSection) analysisSection.style.display = 'none';
      // Update navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      }
      // Try to load analyses if function is available
      if (window.loadAnalyses) {
        window.loadAnalyses();
      } else if (window.showAnalysesFull) {
        window.showAnalysesFull(event);
      } else {
        // Wait for DOMContentLoaded with max attempts
        let attempts = 0;
        const maxAttempts = 50;
        const tryLoad = function() {
          attempts++;
          if (window.loadAnalyses) {
            window.loadAnalyses();
          } else if (window.showAnalysesFull) {
            window.showAnalysesFull(event);
          } else if (attempts < maxAttempts) {
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                if (window.loadAnalyses) window.loadAnalyses();
                else if (window.showAnalysesFull) window.showAnalysesFull(event);
              });
            } else {
              setTimeout(tryLoad, 100);
            }
          } else {
            console.error('❌ loadAnalyses not available after ' + maxAttempts + ' attempts');
          }
        };
        tryLoad();
      }
    };
    
    window.showAIReadiness = function(event) {
      if (event) event.preventDefault();
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const aiReadinessSection = document.getElementById('aiReadinessSection');
      const analysisSection = document.querySelector('.content-area > .card');
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (aiReadinessSection) aiReadinessSection.style.display = 'block';
      if (analysisSection) analysisSection.style.display = 'none';
      // Update navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      }
      // Try to call full implementation if available
      if (window.showAIReadinessFull) {
        window.showAIReadinessFull(event);
      }
    };
    
    // startAIReadiness is already defined in <head> script tag above
    
    window.viewAnalysisDetails = function(runId) {
      console.log('🔍 viewAnalysisDetails called with runId:', runId);
      if (!runId) {
        console.error('❌ No runId provided');
        alert('Fehler: Keine Analyse-ID angegeben.');
        return;
      }
      // Try to call the full implementation, with retry logic and max attempts
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max (50 * 100ms)
      const startTime = Date.now();
      const maxTime = 5000; // 5 seconds in milliseconds
      let timeoutId = null;
      
      const tryCall = () => {
        attempts++;
        const elapsed = Date.now() - startTime;
        
        // Check if function is available
        if (window.viewAnalysisDetailsFull) {
          console.log('✅ Calling viewAnalysisDetailsFull');
          if (timeoutId) clearTimeout(timeoutId);
          window.viewAnalysisDetailsFull(runId);
          return; // Success, exit
        }
        
        // Check if we've exceeded max attempts or max time
        if (attempts >= maxAttempts || elapsed >= maxTime) {
          console.error('❌ viewAnalysisDetailsFull not available after ' + attempts + ' attempts or ' + elapsed + 'ms');
          if (timeoutId) clearTimeout(timeoutId);
          alert('Fehler: Funktion noch nicht geladen. Bitte Seite neu laden.');
          return; // Exit retry loop
        }
        
        // Continue retrying
        console.warn('⚠️ viewAnalysisDetailsFull not yet available, retrying... (' + attempts + '/' + maxAttempts + ')');
        timeoutId = setTimeout(tryCall, 100);
      };
      
      tryCall();
    };
    
    window.deleteAnalysis = function(runId) {
      if (!runId) {
        console.error('❌ No runId provided');
        return;
      }
      let attempts = 0;
      const maxAttempts = 50;
      const startTime = Date.now();
      const maxTime = 5000; // 5 seconds
      let timeoutId = null;
      
      const tryCall = () => {
        attempts++;
        const elapsed = Date.now() - startTime;
        
        if (window.deleteAnalysisFull) {
          if (timeoutId) clearTimeout(timeoutId);
          window.deleteAnalysisFull(runId);
          return;
        }
        
        if (attempts >= maxAttempts || elapsed >= maxTime) {
          console.error('❌ deleteAnalysisFull not available after ' + attempts + ' attempts or ' + elapsed + 'ms');
          if (timeoutId) clearTimeout(timeoutId);
          alert('Fehler: Funktion noch nicht geladen. Bitte Seite neu laden.');
          return;
        }
        
        timeoutId = setTimeout(tryCall, 100);
      };
      
      tryCall();
    };
    
    window.pauseAnalysis = function(runId) {
      if (!runId) {
        console.error('❌ No runId provided');
        return;
      }
      let attempts = 0;
      const maxAttempts = 50;
      const startTime = Date.now();
      const maxTime = 5000; // 5 seconds
      let timeoutId = null;
      
      const tryCall = () => {
        attempts++;
        const elapsed = Date.now() - startTime;
        
        if (window.pauseAnalysisFull) {
          if (timeoutId) clearTimeout(timeoutId);
          window.pauseAnalysisFull(runId);
          return;
        }
        
        if (attempts >= maxAttempts || elapsed >= maxTime) {
          console.error('❌ pauseAnalysisFull not available after ' + attempts + ' attempts or ' + elapsed + 'ms');
          if (timeoutId) clearTimeout(timeoutId);
          alert('Fehler: Funktion noch nicht geladen. Bitte Seite neu laden.');
          return;
        }
        
        timeoutId = setTimeout(tryCall, 100);
      };
      
      tryCall();
    };
    
    // GLOBAL FUNCTION - available immediately
    window.startAnalysisNow = async function() {
      try {
        const btn = document.getElementById('startAnalysisBtn');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Starte Analyse...';
        }
        
        const websiteUrlEl = document.getElementById('websiteUrl');
        const countryEl = document.getElementById('country');
        const languageEl = document.getElementById('language');
        const regionEl = document.getElementById('region');
        
        let websiteUrl = websiteUrlEl?.value?.trim();
        // Auto-add https:// if missing
        var urlPattern1 = new RegExp("^https?:\\/\\/", "i");
        if (websiteUrl && !urlPattern1.test(websiteUrl)) {
          websiteUrl = "https://" + websiteUrl;
        }
        const country = countryEl?.value?.toUpperCase()?.trim();
        const language = languageEl?.value?.trim();
        const region = regionEl?.value?.trim();
        const questionsPerCategoryEl = document.getElementById('questionsPerCategory');
        const questionsPerCategory = questionsPerCategoryEl ? parseInt(questionsPerCategoryEl.value) || 3 : 3;
        
        if (!websiteUrl || !country || !language) {
          alert('Bitte füllen Sie alle Pflichtfelder aus!\\n\\nURL: ' + (websiteUrl || 'FEHLT') + '\\nLand: ' + (country || 'FEHLT') + '\\nSprache: ' + (language || 'FEHLT'));
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Analyse starten';
          }
          return;
        }
        
        // Show loading
        const loading = document.getElementById('loading');
        if (loading) {
          loading.style.display = 'block';
          loading.classList.add('show');
        }
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill) progressFill.style.width = '5%';
        if (progressText) progressText.textContent = 'Starte Analyse...';
        
        // Call the API
        const response = await fetch('/api/workflow/step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteUrl,
            country,
            language,
            region: region || undefined
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', errorText);
          alert('API Fehler: ' + response.status + ' - ' + errorText.substring(0, 100));
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Analyse starten';
          }
          if (loading) {
            loading.style.display = 'none';
          }
          return;
        }
        
        const data = await response.json();
        
        if (data.error) {
          alert('Fehler: ' + (data.message || data.error));
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Analyse starten';
          }
          if (loading) {
            loading.style.display = 'none';
          }
          return;
        }
        
        // Continue with workflow - trigger executeStep1 from DOMContentLoaded scope
        // The executeStep1 function will handle the rest of the workflow
        if (data.runId && window.executeStep1) {
          window.currentRunId = data.runId;
          window.workflowData = { websiteUrl, country, language, region, questionsPerCategory };
          window.workflowData.urls = data.urls || [];
          // Call executeStep1 with the formData
          await window.executeStep1({ websiteUrl, country, language, region, questionsPerCategory });
        } else if (data.runId) {
          // If DOMContentLoaded hasn't run yet, wait for it
          document.addEventListener('DOMContentLoaded', async () => {
            if (window.executeStep1) {
              window.currentRunId = data.runId;
              window.workflowData = { websiteUrl, country, language, region };
              window.workflowData.urls = data.urls || [];
              await window.executeStep1({ websiteUrl, country, language, region });
            }
          });
        }
        
      } catch (error) {
        console.error('Error:', error);
        alert('Fehler: ' + (error.message || error));
        const btn = document.getElementById('startAnalysisBtn');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Analyse starten';
        }
      }
    };
    
    document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded, initializing form...');
    let pollInterval = null;

    async function pollStatus(runId) {
      try {
        const response = await fetch('/api/analysis/' + runId + '/status');
        const status = await response.json();
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (status.progress) {
          const progress = status.progress.progress || 0;
          progressFill.style.width = progress + '%';
          progressFill.textContent = progress + '%';
          progressText.textContent = status.progress.message || status.progress.step || 'Processing...';
        }
        
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          document.getElementById('loading').classList.remove('show');
          await loadResults(runId);
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          document.getElementById('loading').classList.remove('show');
          document.getElementById('result').classList.add('show');
          document.getElementById('resultContent').innerHTML = 
            '<div style="color: red;"><h4>❌ Analyse fehlgeschlagen</h4><p>' + 
            (status.error || status.progress?.message || 'Unknown error') + '</p></div>';
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    }

    async function loadResults(runId) {
      try {
        const response = await fetch('/api/analysis/' + runId);
        const result = await response.json();
        
        const resultsContainer = document.getElementById('resultsContainer');
        const resultsContent = document.getElementById('resultsContent');
        
        let html = '<div class="metric-card">';
        html += '<h4>🌐 Website</h4>';
        html += '<p><strong>URL:</strong> ' + result.websiteUrl + '</p>';
        html += '<p><strong>Land:</strong> ' + result.country + '</p>';
        html += '<p><strong>Sprache:</strong> ' + result.language + '</p>';
        html += '</div>';
        
        if (result.categoryMetrics && result.categoryMetrics.length > 0) {
          html += '<div class="metric-card">';
          html += '<h4>📈 Kategorie-Metriken</h4>';
          result.categoryMetrics.forEach(metric => {
            html += '<div style="margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 4px;">';
            html += '<strong>' + metric.categoryId + '</strong><br>';
            html += 'Sichtbarkeit: <span class="metric-value">' + metric.visibilityScore.toFixed(1) + '</span><br>';
            html += 'Zitationsrate: ' + metric.citationRate.toFixed(2) + '<br>';
            html += 'Brand-Erwähnungen: ' + (metric.brandMentionRate * 100).toFixed(1) + '%';
            html += '</div>';
          });
          html += '</div>';
        }
        
        if (result.competitiveAnalysis) {
          const comp = result.competitiveAnalysis;
          html += '<div class="metric-card">';
          html += '<h4>🏆 Wettbewerbsanalyse</h4>';
          html += '<p><span class="metric-value">' + comp.brandShare.toFixed(1) + '%</span> Brand-Anteil</p>';
          if (Object.keys(comp.competitorShares).length > 0) {
            html += '<p><strong>Konkurrenten:</strong></p><ul>';
            for (const [name, share] of Object.entries(comp.competitorShares)) {
              html += '<li>' + name + ': ' + share.toFixed(1) + '%</li>';
            }
            html += '</ul>';
          }
          html += '</div>';
        }
        
        resultsContent.innerHTML = html;
        resultsContainer.style.display = 'block';
        document.getElementById('result').classList.add('show');
        document.getElementById('resultContent').innerHTML = 
          '<div style="color: green;"><h4>✅ Analyse abgeschlossen!</h4><p>Run ID: ' + runId + '</p></div>';
      } catch (error) {
        document.getElementById('resultContent').innerHTML = 
          '<div style="color: red;">Fehler beim Laden der Ergebnisse: ' + error.message + '</div>';
      }
    }

    let currentRunId = null;
    let currentStep = 'step1';
    let workflowData = {};
    
    // Make variables available globally for startAnalysisNow
    window.currentRunId = currentRunId;
    window.workflowData = workflowData;

    // Extract form submission logic to a function (DEFINED FIRST)
    async function handleFormSubmit() {
      console.log('🔵 handleFormSubmit called');
      try {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        
        const websiteUrlEl = document.getElementById('websiteUrl');
        const countryEl = document.getElementById('country');
        const languageEl = document.getElementById('language');
        const regionEl = document.getElementById('region');
        
        console.log('Form elements:', {
          websiteUrl: !!websiteUrlEl,
          country: !!countryEl,
          language: !!languageEl,
          region: !!regionEl
        });
        
        if (!websiteUrlEl || !countryEl || !languageEl) {
          throw new Error('Form fields not found');
        }
        
        const questionsPerCategoryEl = document.getElementById('questionsPerCategory');
        const questionsPerCategory = questionsPerCategoryEl ? parseInt(questionsPerCategoryEl.value) || 3 : 3;
        
        let websiteUrl = websiteUrlEl.value.trim();
        // Auto-add https:// if missing
        var urlPattern2 = new RegExp("^https?:\\/\\/", "i");
        if (websiteUrl && !urlPattern2.test(websiteUrl)) {
          websiteUrl = "https://" + websiteUrl;
        }
        const formData = {
          websiteUrl: websiteUrl,
          country: countryEl.value.toUpperCase().trim(),
          language: languageEl.value.trim(),
          region: regionEl ? regionEl.value.trim() || undefined : undefined,
          questionsPerCategory: questionsPerCategory
        };
        
        console.log('📋 Form data extracted:', formData);
        
        // Validate form data
        if (!formData.websiteUrl) {
          throw new Error('Website URL ist erforderlich');
        }
        if (!formData.country) {
          throw new Error('Land ist erforderlich');
        }
        if (!formData.language) {
          throw new Error('Sprache ist erforderlich');
        }
        
        console.log('✅ Form validation passed');

        workflowData = { ...formData };

        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        const resultsContainer = document.getElementById('resultsContainer');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (!loading || !result || !progressFill || !progressText) {
          throw new Error('UI elements not found');
        }

        // Show loading immediately with visual feedback
        loading.style.display = 'block';
        loading.classList.add('show');
        result.classList.remove('show');
        if (resultsContainer) {
          resultsContainer.style.display = 'none';
        }
        
        // Reset progress and show initial status
        progressFill.style.width = '0%';
        progressText.textContent = 'Starte Analyse...';
        
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        if (statusEl) statusEl.textContent = '🚀 Analyse wird gestartet...';
        if (statusDetailsEl) statusDetailsEl.textContent = 'Vorbereitung der Analyse...';
        
        console.log('Form submitted, calling executeStep1 with:', formData);
        await executeStep1(formData);
      } catch (error) {
        console.error('Error in form submit:', error);
        const startBtn = document.getElementById('startAnalysisBtn');
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.textContent = 'Analyse starten';
        }
        const result = document.getElementById('result');
        const loading = document.getElementById('loading');
        const resultContent = document.getElementById('resultContent');
        
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="color: red; padding: 15px; background: #ffebee; border-radius: 6px; border-left: 4px solid #f44336;">' +
            '<strong>❌ Fehler:</strong><br>' + 
            (error.message || error || 'Unbekannter Fehler') + 
            '</div>';
        }
        if (result) result.classList.add('show');
        if (loading) loading.classList.remove('show');
        throw error;
      }
    }

    // Step 1: Find Sitemap
    async function executeStep1(formData) {
      try {
        console.log('executeStep1 called with:', formData);
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        
        if (!progressText || !progressFill || !loading) {
          throw new Error('UI elements not found');
        }
        
        // Show loading immediately
        loading.style.display = 'block';
        loading.classList.add('show');
        result.classList.remove('show');
        progressFill.style.width = '5%';
        progressText.textContent = 'Suche Sitemap.xml...';
        
        const statusEl1 = document.getElementById('currentStatus');
        const statusDetailsEl1 = document.getElementById('statusDetails');
        if (statusEl1) statusEl1.textContent = '🔍 Schritt 1: Sitemap wird gesucht...';
        if (statusDetailsEl1) statusDetailsEl1.textContent = 'Suche nach sitemap.xml auf ' + formData.websiteUrl;
        
        console.log('Making API call to /api/workflow/step1');
        const response = await fetch('/api/workflow/step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: 'Unknown error', message: response.statusText };
          }
          throw new Error(errorData.message || errorData.error || 'Failed to start analysis');
        }
        
        const data = await response.json();
        console.log('API response data:', data);
        
        if (data.error) {
          throw new Error(data.message || data.error);
        }
        
        if (!data.runId) {
          throw new Error('No runId received from server');
        }
        
        currentRunId = data.runId;
        workflowData.urls = data.urls || [];
        workflowData.foundSitemap = data.foundSitemap !== false; // Default to true if not specified
        progressFill.style.width = '20%';
        
        const statusEl2 = document.getElementById('currentStatus');
        const statusDetailsEl2 = document.getElementById('statusDetails');
        
        if (data.foundSitemap) {
          progressText.textContent = 'Sitemap gefunden: ' + (data.urls ? data.urls.length : 0) + ' URLs';
          if (statusEl2) {
            statusEl2.textContent = '✅ Schritt 1 abgeschlossen: Sitemap gefunden';
            statusEl2.style.color = '#059669';
          }
          if (statusDetailsEl2) statusDetailsEl2.textContent = data.urls && data.urls.length > 0 
            ? data.urls.length + ' URLs gefunden. Bereite Schritt 2 vor...'
            : 'Keine URLs in Sitemap gefunden.';
        } else {
          progressText.textContent = 'Keine Sitemap gefunden: ' + (data.urls ? data.urls.length : 0) + ' URLs von Startseite';
          if (statusEl2) {
            statusEl2.textContent = '⚠️ Schritt 1 abgeschlossen: Keine Sitemap gefunden';
            statusEl2.style.color = '#d97706';
          }
          if (statusDetailsEl2) {
            statusDetailsEl2.textContent = data.message || (data.urls && data.urls.length > 0 
              ? data.urls.length + ' URLs von Startseite extrahiert. Bereite Schritt 2 vor...'
              : 'Keine URLs gefunden.');
          }
        }
        
        console.log('Step 1 completed. RunId:', currentRunId, 'URLs:', data.urls?.length || 0, 'FoundSitemap:', data.foundSitemap);
        
        if (data.urls && data.urls.length > 0) {
          // Auto-proceed to step 2
          setTimeout(() => executeStep2(), 1000);
        } else {
          document.getElementById('resultContent').innerHTML = 
            '<div style="color: orange; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">' +
            '⚠️ Keine URLs gefunden. Bitte manuell URLs eingeben oder Crawling verwenden.</div>';
          result.classList.add('show');
          loading.classList.remove('show');
          loading.style.display = 'none';
        }
      } catch (error) {
        console.error('Error in executeStep1:', error);
        const result = document.getElementById('result');
        const loading = document.getElementById('loading');
        const resultContent = document.getElementById('resultContent');
        
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="color: red; padding: 15px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
            '<strong>❌ Fehler beim Starten der Analyse:</strong><br>' + 
            (error.message || error || 'Unbekannter Fehler') + 
            '</div>';
        }
        if (result) result.classList.add('show');
        if (loading) loading.classList.remove('show');
        throw error;
      }
    }

    // Step 2: Fetch Content (with live updates)
    async function executeStep2() {
      // Update global reference
      window.currentRunId = currentRunId;
      window.workflowData = workflowData;
      try {
        const statusEl3 = document.getElementById('currentStatus');
        const statusDetailsEl3 = document.getElementById('statusDetails');
        if (statusEl3) statusEl3.textContent = '📄 Schritt 2: Inhalte werden geholt...';
        if (statusDetailsEl3) statusDetailsEl3.textContent = 'Lade Inhalte von ' + workflowData.urls.length + ' URLs';
        
        const progressText = document.getElementById('progressText');
        const resultContent = document.getElementById('resultContent');
        resultContent.innerHTML = '<h3>📄 Geholte Inhalte:</h3><div id="contentList"></div>';
        document.getElementById('result').classList.add('show');
        
        let fetchedCount = 0;
        const contentList = document.getElementById('contentList');
        const allContent = [];
        
        // Fetch URLs one by one with live updates
        const maxUrls = Math.min(workflowData.urls.length, 50);
        for (let i = 0; i < maxUrls; i++) {
          const url = workflowData.urls[i];
          progressText.textContent = 'Hole Inhalte... (' + (i + 1) + '/' + maxUrls + ')';
          const statusDetailsEl3Loop = document.getElementById('statusDetails');
          if (statusDetailsEl3Loop) statusDetailsEl3Loop.textContent = 'Lade URL ' + (i + 1) + ' von ' + maxUrls + ': ' + url.substring(0, 50) + '...';
          document.getElementById('progressFill').style.width = (20 + (i / maxUrls) * 20) + '%';
          
          try {
            const response = await fetch('/api/workflow/fetchUrl', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: url })
            });
            const data = await response.json();
            
            if (data.content) {
              fetchedCount++;
              allContent.push(data.content);
              const urlDiv = document.createElement('div');
              urlDiv.style.cssText = 'margin: 5px 0; padding: 8px; background: #e8f5e9; border-radius: 4px; border-left: 3px solid #4caf50;';
              urlDiv.innerHTML = '<strong>✓ ' + url + '</strong><br><small>' + 
                (data.content.substring(0, 100) + '...') + '</small>';
              contentList.appendChild(urlDiv);
            }
          } catch (error) {
            const urlDiv = document.createElement('div');
            urlDiv.style.cssText = 'margin: 5px 0; padding: 8px; background: #ffebee; border-radius: 4px; border-left: 3px solid #f44336;';
            urlDiv.innerHTML = '<strong>✗ ' + url + '</strong><br><small>Fehler beim Laden</small>';
            contentList.appendChild(urlDiv);
          }
        }
        
        const separator = String.fromCharCode(10) + String.fromCharCode(10);
        workflowData.content = allContent.join(separator);
        document.getElementById('progressFill').style.width = '40%';
        progressText.textContent = 'Inhalte von ' + fetchedCount + ' Seiten geholt';
        
        const statusEl4 = document.getElementById('currentStatus');
        const statusDetailsEl4 = document.getElementById('statusDetails');
        if (statusEl4) statusEl4.textContent = '✅ Schritt 2 abgeschlossen: Inhalte geholt';
        if (statusDetailsEl4) statusDetailsEl4.textContent = fetchedCount + ' Seiten erfolgreich geladen. Bereite Schritt 3 vor...';
        
        // Auto-proceed to step 3
        setTimeout(() => executeStep3(), 1000);
      } catch (error) {
        throw error;
      }
    }

    // Step 3: Generate Categories
    async function executeStep3() {
      try {
        const statusEl5 = document.getElementById('currentStatus');
        const statusDetailsEl5 = document.getElementById('statusDetails');
        if (statusEl5) statusEl5.textContent = '🤖 Schritt 3: Kategorien werden generiert...';
        if (statusDetailsEl5) statusDetailsEl5.textContent = 'GPT analysiert Inhalte und generiert Kategorien/Keywords...';
        
        document.getElementById('progressText').textContent = 'Generiere Kategorien/Keywords mit GPT...';
        const response = await fetch('/api/workflow/step3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            runId: currentRunId,
            content: workflowData.content || 'Website content',
            language: workflowData.language
          })
        });
        const data = await response.json();
        console.log('📊 Step 3 Response:', data);
        console.log('📊 Categories received:', data.categories?.length || 0, data.categories);
        
        if (!data.categories || !Array.isArray(data.categories)) {
          console.error('❌ Invalid categories data:', data);
          alert('Fehler: Keine Kategorien erhalten. Bitte versuche es erneut.');
          return;
        }
        
        workflowData.categories = data.categories;
        document.getElementById('progressFill').style.width = '60%';
        document.getElementById('progressText').textContent = 
          data.categories.length + ' Kategorien generiert';
        
        // Update status (reuse existing variables)
        if (statusEl5) statusEl5.textContent = '✅ Schritt 3 abgeschlossen: ' + data.categories.length + ' Kategorien generiert';
        if (statusDetailsEl5) statusDetailsEl5.textContent = 'Bitte wähle die Kategorien aus, für die Fragen generiert werden sollen.';
        
        // Show categories for user selection
        try {
          showCategorySelection(data.categories);
        } catch (error) {
          console.error('❌ Error in showCategorySelection:', error);
          const resultContent = document.getElementById('resultContent');
          if (resultContent) {
            resultContent.innerHTML = 
              '<div style="color: red; padding: 15px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
              '<strong>❌ Fehler beim Anzeigen der Kategorien:</strong><br>' + 
              (error.message || error || 'Unbekannter Fehler') + 
              '</div>';
          }
          throw error;
        }
      } catch (error) {
        console.error('❌ Error in executeStep3:', error);
        throw error;
      }
    }

    function showCategorySelection(categories) {
      try {
        console.log('📋 Showing categories:', categories.length, categories);
        
        if (!categories || !Array.isArray(categories)) {
          throw new Error('Ungültige Kategorien-Daten: ' + typeof categories);
        }
        
        const result = document.getElementById('result');
        const resultContent = document.getElementById('resultContent');
        
        if (!result || !resultContent) {
          console.error('❌ Result elements not found!');
          alert('Fehler: Ergebnis-Container nicht gefunden. Bitte Seite neu laden.');
          return;
        }
      
      // Ensure result is visible
      result.style.display = 'block';
      result.classList.add('show');
      
      let html = '<div style="margin-bottom: 20px;">';
      html += '<h3 style="margin-bottom: 16px; color: var(--gray-900); font-size: 20px;">📋 Wähle Kategorien aus (' + categories.length + ' gefunden):</h3>';
      html += '<p style="color: var(--gray-600); font-size: 14px; margin-bottom: 20px;">Wähle die Kategorien aus, für die Fragen generiert werden sollen. Du kannst auch neue Kategorien hinzufügen.</p>';
      html += '</div>';
      
      html += '<form id="categoryForm" style="margin-top: 20px;">';
      
      if (!categories || categories.length === 0) {
        html += '<div style="padding: 20px; background: var(--gray-100); border-radius: 8px; color: var(--gray-600);">';
        html += 'Keine Kategorien gefunden. Bitte versuche es erneut oder füge manuell Kategorien hinzu.';
        html += '</div>';
      } else {
        // Use grid layout for compact display
        html += '<div id="categoriesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; margin-bottom: 16px;">';
        categories.forEach(function(cat, index) {
          const catId = (cat.id || 'cat_' + index).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          const catName = (cat.name || 'Kategorie ' + (index + 1)).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          const catDesc = (cat.description || 'Keine Beschreibung').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          html += '<div class="category-item-compact" data-cat-id="' + catId + '" style="padding: 10px; background: white; border: 1px solid var(--gray-200); border-radius: 6px; transition: all 0.2s; cursor: pointer;">';
          html += '<label style="display: flex; align-items: center; cursor: pointer; gap: 8px; margin: 0;">';
          html += '<input type="checkbox" name="category" value="' + catId + '" checked style="width: 16px; height: 16px; cursor: pointer; flex-shrink: 0;">';
          html += '<div style="flex: 1; min-width: 0;">';
          html += '<strong style="display: block; color: var(--gray-900); font-size: 14px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + catName + '</strong>';
          html += '<span style="display: block; color: var(--gray-600); font-size: 12px; line-height: 1.3; max-height: 2.6em; overflow: hidden; text-overflow: ellipsis;">' + catDesc + '</span>';
          html += '</div>';
          html += '</label>';
          html += '</div>';
        });
        html += '</div>';
      }
      
      // Add custom category input
      html += '<div style="margin-top: 24px; padding: 16px; background: var(--gray-50); border-radius: 8px; border: 2px dashed var(--gray-300);">';
      html += '<h4 style="margin-bottom: 12px; color: var(--gray-900); font-size: 14px; font-weight: 600;">➕ Neue Kategorie hinzufügen</h4>';
      html += '<div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-bottom: 12px;">';
      html += '<input type="text" id="newCategoryName" placeholder="Kategorie-Name" style="padding: 10px; border: 1px solid var(--gray-300); border-radius: 6px; font-size: 14px;">';
      html += '<input type="text" id="newCategoryDesc" placeholder="Beschreibung" style="padding: 10px; border: 1px solid var(--gray-300); border-radius: 6px; font-size: 14px;">';
      html += '</div>';
      html += '<button type="button" id="addCategoryBtn" class="btn" style="background: var(--gray-600); padding: 10px 20px; font-size: 14px;">Kategorie hinzufügen</button>';
      html += '</div>';
      
      html += '<div style="margin-top: 24px; display: flex; gap: 12px;">';
      html += '<button type="submit" class="btn btn-primary" style="flex: 1; padding: 14px 24px; font-size: 16px;">✅ Weiter zu Fragen generieren</button>';
      html += '<button type="button" id="regenerateCategoriesBtn" class="btn" style="background: var(--gray-600); padding: 14px 24px; font-size: 16px;">🔄 Kategorien neu generieren</button>';
      html += '</div>';
      html += '</form>';
      
      resultContent.innerHTML = html;
      
      // Add click handlers for category items (click anywhere on card to toggle checkbox)
      const categoryItems = document.querySelectorAll('.category-item-compact');
      categoryItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL' && e.target.tagName !== 'STRONG' && e.target.tagName !== 'SPAN' && e.target.tagName !== 'DIV') {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
              checkbox.click();
            }
          }
        });
      });
      
      // Add event listener for adding custom categories
      const addCategoryBtn = document.getElementById('addCategoryBtn');
      if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
          const nameInput = document.getElementById('newCategoryName');
          const descInput = document.getElementById('newCategoryDesc');
          const name = nameInput?.value?.trim();
          const desc = descInput?.value?.trim();
          
          if (!name) {
            alert('Bitte gib einen Kategorie-Namen ein.');
            return;
          }
          
          // Add new category to the form
          const form = document.getElementById('categoryForm');
          if (form) {
            const newCategoryDiv = document.createElement('div');
            newCategoryDiv.style.cssText = 'margin: 12px 0; padding: 16px; background: white; border: 2px solid var(--primary); border-radius: 8px;';
            newCategoryDiv.innerHTML = 
              '<label style="display: flex; align-items: flex-start; cursor: pointer; gap: 12px;">' +
              '<input type="checkbox" name="category" value="custom_' + Date.now() + '" checked style="margin-top: 4px; width: 18px; height: 18px; cursor: pointer;">' +
              '<div style="flex: 1;">' +
              '<strong style="display: block; color: var(--gray-900); font-size: 16px; margin-bottom: 4px;">' + name + '</strong>' +
              '<span style="display: block; color: var(--gray-600); font-size: 14px;">' + (desc || 'Benutzerdefinierte Kategorie') + '</span>' +
              '</div>' +
              '</label>';
            
            // Insert before the "Add category" section
            const addSection = document.querySelector('#categoryForm > div:last-of-type');
            if (addSection && addSection.previousElementSibling) {
              addSection.parentNode?.insertBefore(newCategoryDiv, addSection);
            } else {
              form.insertBefore(newCategoryDiv, form.lastElementChild);
            }
            
            // Clear inputs
            if (nameInput) nameInput.value = '';
            if (descInput) descInput.value = '';
            
            // Add to workflowData
            if (!workflowData.categories) workflowData.categories = [];
            workflowData.categories.push({
              id: 'custom_' + Date.now(),
              name: name,
              description: desc || 'Benutzerdefinierte Kategorie',
              confidence: 0.5,
              sourcePages: []
            });
          }
        });
      }
      
      // Add event listener for regenerate button
      const regenerateBtn = document.getElementById('regenerateCategoriesBtn');
      if (regenerateBtn) {
        regenerateBtn.addEventListener('click', async () => {
          if (confirm('Möchtest du die Kategorien wirklich neu generieren? Die aktuellen Auswahlen gehen verloren.')) {
            await executeStep3();
          }
        });
      }
      
      // Add form submit handler
      const categoryForm = document.getElementById('categoryForm');
      if (categoryForm) {
        console.log('📋 Setting up category form submit handler');
        
        // Remove existing listeners by cloning (but keep the form reference)
        const formClone = categoryForm.cloneNode(true);
        categoryForm.parentNode?.replaceChild(formClone, categoryForm);
        
        // Get the new form element
        const newForm = document.getElementById('categoryForm');
        if (newForm) {
          console.log('✅ Category form found, adding submit listener');
          
          newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔵 Category form submitted!');
            
            const selected = Array.from(document.querySelectorAll('input[name="category"]:checked'))
              .map(cb => cb.value);
            
            console.log('✅ Selected categories:', selected);
            console.log('📊 Available categories:', workflowData.categories?.length || 0);
            
            if (selected.length === 0) {
              alert('Bitte wähle mindestens eine Kategorie aus.');
              return;
            }
            
            // Update workflow data
            workflowData.selectedCategories = selected;
            
            // IMMEDIATE VISUAL FEEDBACK - Disable button and show loading
            const submitBtn = e.target.closest('form')?.querySelector('button[type="submit"]');
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.textContent = '⏳ Generiere Fragen...';
              submitBtn.style.opacity = '0.7';
              submitBtn.style.cursor = 'not-allowed';
            }
            
            // Show loading state immediately
            const loading = document.getElementById('loading');
            if (loading) {
              loading.style.display = 'block';
              loading.classList.add('show');
            }
            
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            if (progressFill) {
              progressFill.style.width = '60%';
              progressFill.style.transition = 'width 0.3s ease';
            }
            if (progressText) progressText.textContent = 'Starte Fragen-Generierung...';
            
            const statusEl = document.getElementById('currentStatus');
            const statusDetailsEl = document.getElementById('statusDetails');
            if (statusEl) {
              statusEl.textContent = '🤖 Schritt 4: Fragen werden generiert...';
              statusEl.style.color = '#2563eb';
            }
            if (statusDetailsEl) {
              statusDetailsEl.textContent = 'GPT generiert Fragen für ' + selected.length + ' ausgewählte Kategorien. Bitte warten...';
            }
            
            // Show progress in result area too
            const resultContent = document.getElementById('resultContent');
            if (resultContent) {
              resultContent.innerHTML = 
                '<div style="text-align: center; padding: 40px;">' +
                '<div style="font-size: 48px; margin-bottom: 20px;">⏳</div>' +
                '<h3 style="color: var(--gray-900); margin-bottom: 12px;">Fragen werden generiert...</h3>' +
                '<p style="color: var(--gray-600); margin-bottom: 20px;">GPT generiert ' + (workflowData.questionsPerCategory || 3) + ' Fragen pro Kategorie für ' + selected.length + ' Kategorien.</p>' +
                '<div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>' +
                '</div>';
              document.getElementById('result').style.display = 'block';
              document.getElementById('result').classList.add('show');
            }
            
            // Add spinning animation CSS if not already present
            if (!document.getElementById('spinnerStyle')) {
              const style = document.createElement('style');
              style.id = 'spinnerStyle';
              style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
              document.head.appendChild(style);
            }
            
            try {
              console.log('🚀 Calling executeStep4...');
              await executeStep4();
            } catch (error) {
              console.error('❌ Error in executeStep4:', error);
              const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
              alert('Fehler beim Generieren der Fragen: ' + errorMessage);
              
              // Re-enable button
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '✅ Weiter zu Fragen generieren';
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
              }
              
              if (loading) {
                loading.style.display = 'none';
              }
            }
          });
          
          console.log('✅ Category form submit handler attached');
        } else {
          console.error('❌ Could not find categoryForm after clone');
        }
      } else {
        console.error('❌ Category form not found!');
      }
      } catch (error) {
        console.error('❌ Error in showCategorySelection:', error);
        const resultContent = document.getElementById('resultContent');
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="color: red; padding: 15px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
            '<strong>❌ Fehler beim Anzeigen der Kategorien:</strong><br>' + 
            (error && typeof error === 'object' && 'message' in error ? error.message : String(error)) + 
            '<br><small>Bitte versuche es erneut oder lade die Seite neu.</small>' +
            '</div>';
        }
        throw error;
      }
    }

    // Step 4: Generate Prompts
    async function executeStep4() {
      try {
        console.log('🚀 executeStep4 called');
        console.log('📊 Selected categories:', workflowData.selectedCategories);
        console.log('📊 Available categories:', workflowData.categories?.length || 0);
        console.log('📊 Current runId:', currentRunId);
        
        if (!workflowData.selectedCategories || workflowData.selectedCategories.length === 0) {
          throw new Error('Keine Kategorien ausgewählt');
        }
        
        if (!workflowData.categories || workflowData.categories.length === 0) {
          throw new Error('Keine Kategorien verfügbar');
        }
        
        const selectedCats = workflowData.categories.filter(c => 
          workflowData.selectedCategories.includes(c.id)
        );
        
        console.log('📋 Filtered selected categories:', selectedCats.length, selectedCats);
        
        if (selectedCats.length === 0) {
          throw new Error('Keine passenden Kategorien gefunden. Bitte wähle Kategorien aus.');
        }
        
        const questionsPerCategory = workflowData.questionsPerCategory || 3;
        const totalQuestions = selectedCats.length * questionsPerCategory;
        console.log('📊 Questions per category:', questionsPerCategory);
        console.log('📊 Total questions to generate:', totalQuestions);
        
        // Update progress with detailed info
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        if (progressText) progressText.textContent = 'Generiere ' + totalQuestions + ' Fragen für ' + selectedCats.length + ' Kategorien...';
        if (progressFill) {
          progressFill.style.width = '65%';
          progressFill.style.transition = 'width 0.3s ease';
        }
        
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        if (statusEl) {
          statusEl.textContent = '🤖 Schritt 4: Fragen werden generiert...';
          statusEl.style.color = '#2563eb';
        }
        if (statusDetailsEl) {
          statusDetailsEl.textContent = 'GPT generiert ' + questionsPerCategory + ' Fragen pro Kategorie für ' + selectedCats.length + ' Kategorien. Dies kann einige Sekunden dauern...';
        }
        
        // Update result area with progress
        const resultContent = document.getElementById('resultContent');
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="text-align: center; padding: 40px;">' +
            '<div style="font-size: 48px; margin-bottom: 20px;">⏳</div>' +
            '<h3 style="color: var(--gray-900); margin-bottom: 12px;">Fragen werden generiert...</h3>' +
            '<p style="color: var(--gray-600); margin-bottom: 8px;">Generiere ' + questionsPerCategory + ' Fragen pro Kategorie</p>' +
            '<p style="color: var(--gray-600); margin-bottom: 20px;">für ' + selectedCats.length + ' Kategorien = ' + totalQuestions + ' Fragen insgesamt</p>' +
            '<div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>' +
            '<p style="color: var(--gray-500); font-size: 12px; margin-top: 20px;">Bitte warten, dies kann 30-60 Sekunden dauern...</p>' +
            '</div>';
        }
        
        console.log('📡 Making API call to /api/workflow/step4');
        console.log('📊 Sending questionsPerCategory:', questionsPerCategory);
        const response = await fetch('/api/workflow/step4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            runId: currentRunId,
            categories: selectedCats,
            userInput: workflowData,
            content: workflowData.content || '',
            questionsPerCategory: questionsPerCategory
          })
        });
        
        console.log('📡 API Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error:', errorText);
          throw new Error('API Fehler: ' + response.status + ' - ' + errorText.substring(0, 200));
        }
        
        const data = await response.json();
        console.log('✅ API Response data:', data);
        console.log('📋 Prompts received:', data.prompts?.length || 0);
        
        if (!data.prompts || !Array.isArray(data.prompts)) {
          throw new Error('Keine Fragen erhalten. Bitte versuche es erneut.');
        }
        
        workflowData.prompts = data.prompts;
        
        // Update progress to 80%
        if (progressFill) {
          progressFill.style.width = '80%';
          progressFill.style.transition = 'width 0.3s ease';
        }
        if (progressText) {
          progressText.textContent = '✅ ' + data.prompts.length + ' Fragen erfolgreich generiert!';
        }
        
        if (statusEl) {
          statusEl.textContent = '✅ Schritt 4 abgeschlossen: ' + data.prompts.length + ' Fragen generiert';
          statusEl.style.color = '#059669';
        }
        if (statusDetailsEl) {
          statusDetailsEl.textContent = 'Alle Fragen wurden erfolgreich generiert. Bitte überprüfe und bearbeite die Fragen.';
        }
        
        // Show success message briefly before showing prompts
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="text-align: center; padding: 40px;">' +
            '<div style="font-size: 48px; margin-bottom: 20px;">✅</div>' +
            '<h3 style="color: var(--success); margin-bottom: 12px;">Fragen erfolgreich generiert!</h3>' +
            '<p style="color: var(--gray-600); margin-bottom: 20px;">' + data.prompts.length + ' Fragen wurden generiert und werden gleich angezeigt...</p>' +
            '</div>';
        }
        
        // Wait a moment to show success, then display prompts
        setTimeout(function() {
          showPromptSelection(data.prompts);
        }, 1000);
      } catch (error) {
        console.error('❌ Error in executeStep4:', error);
        const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
        const errorStack = error && typeof error === 'object' && 'stack' in error ? error.stack : '';
        console.error('Error details:', errorMessage, errorStack);
        
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        if (statusEl) statusEl.textContent = '❌ Fehler beim Generieren der Fragen';
        if (statusDetailsEl) statusDetailsEl.textContent = errorMessage || 'Unbekannter Fehler';
        
        alert('Fehler beim Generieren der Fragen: ' + errorMessage);
        throw error;
      }
    }

    function showPromptSelection(prompts) {
      console.log('📋 Showing prompts:', prompts.length);
      const resultContent = document.getElementById('resultContent');
      if (!resultContent) {
        console.error('❌ resultContent not found!');
        return;
      }
      
      let html = '<div style="margin-bottom: 20px;">';
      html += '<h3 style="margin-bottom: 16px; color: var(--gray-900); font-size: 20px;">❓ Generierte Fragen (' + prompts.length + '):</h3>';
      html += '<p style="color: var(--gray-600); font-size: 14px; margin-bottom: 20px;">Du kannst die Fragen bearbeiten oder einzelne deaktivieren, bevor die Analyse startet.</p>';
      html += '</div>';
      
      html += '<form id="promptForm" style="margin-top: 20px;">';
      
      if (!prompts || prompts.length === 0) {
        html += '<div style="padding: 20px; background: var(--gray-100); border-radius: 8px; color: var(--gray-600);">';
        html += 'Keine Fragen gefunden. Bitte versuche es erneut.';
        html += '</div>';
      } else {
        prompts.forEach((prompt, idx) => {
          const promptId = prompt.id || 'prompt_' + idx;
          const promptQuestion = prompt.question || prompt.text || '';
          html += '<div style="margin-bottom: 16px; padding: 16px; background: white; border: 1px solid var(--gray-200); border-radius: 8px; transition: all 0.2s;">';
          html += '<div style="display: flex; align-items: flex-start; gap: 12px;">';
          html += '<input type="checkbox" name="selected" value="' + promptId + '" checked style="width: 20px; height: 20px; margin-top: 4px; cursor: pointer; flex-shrink: 0;">';
          html += '<div style="flex: 1;">';
          html += '<label style="display: block; color: var(--gray-700); font-size: 12px; font-weight: 600; margin-bottom: 6px;">Frage ' + (idx + 1) + ':</label>';
          html += '<textarea name="prompt_' + promptId + '" style="width: 100%; padding: 12px; border: 1px solid var(--gray-300); border-radius: 6px; font-size: 14px; font-family: inherit; resize: vertical; min-height: 60px;" rows="2">' + promptQuestion.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>';
          html += '</div>';
          html += '</div>';
          html += '</div>';
        });
      }
      
      html += '<div style="margin-top: 24px; display: flex; gap: 12px;">';
      html += '<button type="submit" class="btn btn-primary" style="flex: 1; padding: 14px 24px; font-size: 16px;">🚀 Analyse mit GPT-5 starten</button>';
      html += '</div>';
      html += '</form>';
      
      resultContent.innerHTML = html;
      
      // Remove existing form and recreate to avoid duplicate listeners
      const promptForm = document.getElementById('promptForm');
      if (promptForm) {
        const formClone = promptForm.cloneNode(true);
        promptForm.parentNode?.replaceChild(formClone, promptForm);
        
        const newPromptForm = document.getElementById('promptForm');
        if (newPromptForm) {
          newPromptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔵 Prompt form submitted!');
            
            const updatedPrompts = prompts.map(p => {
              const textarea = document.querySelector('textarea[name="prompt_' + p.id + '"]');
              const checkbox = document.querySelector('input[name="selected"][value="' + p.id + '"]');
              return {
                ...p,
                question: textarea ? textarea.value : p.question,
                isSelected: checkbox ? checkbox.checked : true
              };
            }).filter(p => p.isSelected);
            
            console.log('✅ Updated prompts:', updatedPrompts.length);
            
            if (updatedPrompts.length === 0) {
              alert('Bitte wähle mindestens eine Frage aus.');
              return;
            }
            
            workflowData.prompts = updatedPrompts;
            
            // Show loading
            const loading = document.getElementById('loading');
            if (loading) {
              loading.style.display = 'block';
              loading.classList.add('show');
            }
            
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            if (progressFill) progressFill.style.width = '80%';
            if (progressText) progressText.textContent = 'Starte GPT-5 Ausführung...';
            
            const statusEl = document.getElementById('currentStatus');
            const statusDetailsEl = document.getElementById('statusDetails');
            if (statusEl) statusEl.textContent = '🤖 Schritt 5: GPT-5 Ausführung...';
            if (statusDetailsEl) statusDetailsEl.textContent = 'Führe ' + updatedPrompts.length + ' Fragen aus...';
            
            try {
              await executeStep5();
            } catch (error) {
              console.error('❌ Error in executeStep5:', error);
              const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
              alert('Fehler beim Ausführen der Fragen: ' + errorMessage);
              if (loading) {
                loading.style.display = 'none';
              }
            }
          });
          
          console.log('✅ Prompt form submit handler attached');
        }
      }
    }

    // Step 5: Execute with GPT-5 (with live updates)
    async function executeStep5() {
      try {
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        const resultContent = document.getElementById('resultContent');
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        
        // Initialize result area
        resultContent.innerHTML = 
          '<div style="margin-bottom: 20px;">' +
          '<h3 style="margin-bottom: 16px; color: var(--gray-900); font-size: 20px;">🤖 GPT-5 Antworten (Live):</h3>' +
          '<p style="color: var(--gray-600); font-size: 14px;">Jede Frage wird einzeln ausgeführt und live angezeigt...</p>' +
          '</div>' +
          '<div id="responsesList" style="display: flex; flex-direction: column; gap: 16px;"></div>';
        document.getElementById('result').style.display = 'block';
        document.getElementById('result').classList.add('show');
        
        const responsesList = document.getElementById('responsesList');
        let executedCount = 0;
        const promptsLength = workflowData.prompts.length;
        
        // Store all questions and answers for summary
        const allQuestionsAndAnswers = [];
        
        // Update status
        if (statusEl) statusEl.textContent = '🤖 Schritt 5: GPT-5 Ausführung läuft...';
        if (statusDetailsEl) statusDetailsEl.textContent = 'Führe ' + promptsLength + ' Fragen mit Web Search aus...';
        
        // Execute prompts one by one with live updates
        for (let i = 0; i < promptsLength; i++) {
          const prompt = workflowData.prompts[i];
          const progressPercent = 80 + ((i / promptsLength) * 20);
          
          // Update progress
          if (progressText) progressText.textContent = 'Frage ' + (i + 1) + '/' + promptsLength + ' wird ausgeführt...';
          if (progressFill) {
            progressFill.style.width = progressPercent + '%';
            progressFill.style.transition = 'width 0.3s ease';
          }
          
          // Show "processing" indicator for current question
          const processingDiv = document.createElement('div');
          processingDiv.id = 'processing_' + i;
          processingDiv.style.cssText = 'padding: 16px; background: var(--gray-100); border: 2px dashed var(--gray-300); border-radius: 8px; text-align: center;';
          processingDiv.innerHTML = 
            '<div style="display: inline-block; width: 24px; height: 24px; border: 3px solid var(--gray-300); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 8px;"></div>' +
            '<p style="color: var(--gray-700); font-weight: 600; margin: 0;">Frage ' + (i + 1) + ' wird ausgeführt...</p>' +
            '<p style="color: var(--gray-600); font-size: 14px; margin: 4px 0 0 0;">' + prompt.question + '</p>';
          responsesList.appendChild(processingDiv);
          processingDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          
          try {
            const response = await fetch('/api/workflow/executePrompt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                runId: currentRunId,
                prompt: prompt,
                userInput: workflowData
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'API Fehler: ' + response.status);
            }
            
            const data = await response.json();
            
            console.log('📡 API Response data:', JSON.stringify(data, null, 2));
            console.log('📊 Response outputText:', data.response?.outputText);
            console.log('📊 Response citations:', JSON.stringify(data.response?.citations, null, 2));
            console.log('📊 Analysis citations:', JSON.stringify(data.analysis?.citations, null, 2));
            console.log('📊 Citations count in response:', data.response?.citations?.length || 0);
            console.log('📊 Citations count in analysis:', data.analysis?.citations?.length || 0);
            console.log('📊 Full response object keys:', data.response ? Object.keys(data.response) : 'no response');
            console.log('📊 Full analysis object keys:', data.analysis ? Object.keys(data.analysis) : 'no analysis');
            
            // Remove processing indicator
            const processingEl = document.getElementById('processing_' + i);
            if (processingEl) processingEl.remove();
            
            if (data.response && data.analysis) {
              executedCount++;
              let answerText = data.response.outputText || '';
              
              console.log('✅ Answer text length:', answerText.length);
              console.log('✅ Answer text preview:', answerText.substring(0, 100));
              console.log('📊 Full response object:', data.response);
              
              // If answer is empty, try to get it from different paths
              if (!answerText || answerText.trim().length === 0) {
                console.warn('⚠️ Empty answer text! Trying fallback paths...');
                if (data.response?.text) {
                  answerText = data.response.text;
                  console.log('✅ Found text in response.text');
                } else if (data.response?.content) {
                  answerText = typeof data.response.content === 'string' 
                    ? data.response.content 
                    : JSON.stringify(data.response.content);
                  console.log('✅ Found text in response.content');
                } else if (data.outputText) {
                  answerText = data.outputText;
                  console.log('✅ Found text in data.outputText');
                } else {
                  console.warn('⚠️ No answer text found anywhere! Full data:', JSON.stringify(data, null, 2));
                  answerText = '⚠️ Keine Antwort erhalten. Bitte Browser-Konsole für Details prüfen.';
                }
              }
              
              // Use citations directly from GPT-5 Web Search response (response.citations)
              // Fallback to analysis.citations if response.citations is not available
              const responseCitations = data.response?.citations || [];
              const analysisCitations = data.analysis?.citations || [];
              const citations = responseCitations.length > 0 ? responseCitations : analysisCitations;
              
              const brandMentions = data.analysis.brandMentions || { exact: 0, fuzzy: 0, contexts: [] };
              const competitors = data.analysis.competitors || [];
              const sentiment = data.analysis.sentiment || { tone: 'neutral', confidence: 0 };
              
              // Store question and answer for summary
              allQuestionsAndAnswers.push({
                question: prompt.question,
                answer: answerText,
                citations: citations,
                brandMentions: brandMentions,
                competitors: competitors
              });
              
              // Create response card
              const responseDiv = document.createElement('div');
              responseDiv.style.cssText = 'padding: 20px; background: white; border: 1px solid var(--gray-200); border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);';
              
              let citationsHtml = '';
              if (citations.length > 0) {
                citationsHtml = '<div style="margin-top: 16px; padding: 16px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">';
                citationsHtml += '<div style="font-size: 13px; font-weight: 500; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Quellen (' + citations.length + ')</div>';
                citationsHtml += '<div style="display: flex; flex-direction: column; gap: 8px;">';
                citations.forEach(function(citation, idx) {
                  const url = citation.url || '';
                  const title = citation.title || url || 'Unbenannte Quelle';
                  const snippet = citation.snippet || '';
                  citationsHtml += '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="citation-link" style="color: #0369a1; font-size: 13px; text-decoration: none; padding: 12px; background: #ffffff; border-radius: 6px; display: block; border: 1px solid #e5e7eb; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: pointer;">';
                  citationsHtml += '<div style="display: flex; align-items: start; gap: 10px;">';
                  citationsHtml += '<span style="font-weight: 600; color: #3b82f6; font-size: 13px; min-width: 24px; padding-top: 2px;">' + (idx + 1) + '.</span>';
                  citationsHtml += '<div style="flex: 1;">';
                  citationsHtml += '<div style="font-weight: 500; color: #111827; margin-bottom: 4px; line-height: 1.4;">' + title.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
                  if (url) {
                    try {
                      const hostname = new URL(url).hostname;
                      citationsHtml += '<div style="color: #6b7280; font-size: 11px; margin-bottom: 6px; font-family: ui-monospace, monospace;">' + hostname + '</div>';
                    } catch (e) {
                      // Invalid URL, skip hostname
                    }
                  }
                  if (snippet && snippet.trim().length > 0) {
                    citationsHtml += '<div style="color: #6b7280; font-size: 12px; line-height: 1.5; font-style: normal;">';
                    citationsHtml += snippet.substring(0, 120).replace(/</g, '&lt;').replace(/>/g, '&gt;') + (snippet.length > 120 ? '...' : '');
                    citationsHtml += '</div>';
                  }
                  citationsHtml += '</div></div></a>';
                });
                citationsHtml += '</div></div>';
                // Add CSS for citation links hover effect (after HTML is inserted)
                if (!document.getElementById('citation-link-style')) {
                  const style = document.createElement('style');
                  style.id = 'citation-link-style';
                  style.textContent = '.citation-link:hover { border-color: #3b82f6 !important; box-shadow: 0 2px 4px rgba(59,130,246,0.1) !important; transform: translateY(-1px) !important; }';
                  document.head.appendChild(style);
                }
              } else {
                // Show message if no citations available
                citationsHtml = '<div style="margin-top: 16px; padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">';
                citationsHtml += '<div style="font-size: 13px; color: #6b7280;">Keine Quellen verfügbar</div>';
                citationsHtml += '</div>';
              }
              
              let mentionsHtml = '';
              const totalMentions = brandMentions.exact + brandMentions.fuzzy;
              if (totalMentions > 0) {
                mentionsHtml = '<div style="margin-top: 16px; padding: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">';
                mentionsHtml += '<div style="display: flex; align-items: center; gap: 12px; font-size: 13px;">';
                mentionsHtml += '<span style="color: #10b981; font-weight: 600;">Markenerwähnungen gefunden</span>';
                mentionsHtml += '<span style="color: #6b7280;">•</span>';
                mentionsHtml += '<span style="color: #374151;"><strong>' + brandMentions.exact + '</strong> exakt</span>';
                if (brandMentions.fuzzy > 0) {
                  mentionsHtml += '<span style="color: #6b7280;">•</span>';
                  mentionsHtml += '<span style="color: #374151;"><strong>' + brandMentions.fuzzy + '</strong> ähnlich</span>';
                }
                mentionsHtml += '</div></div>';
              }
              
              // Competitors section removed as requested
              let competitorsHtml = '';
              
              responseDiv.innerHTML = 
                '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">' +
                '<span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #3b82f6; color: white; border-radius: 8px; font-weight: 600; font-size: 15px; flex-shrink: 0;">' + (i + 1) + '</span>' +
                '<h4 style="margin: 0; color: #111827; font-size: 17px; font-weight: 600; line-height: 1.4;">' + prompt.question.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</h4>' +
                '</div>' +
                '<div style="margin-bottom: 16px;">' +
                '<div style="font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Antwort</div>' +
                '<div style="white-space: pre-wrap; background: #f9fafb; padding: 18px; border-radius: 8px; border: 1px solid #e5e7eb; color: #374151; line-height: 1.7; font-size: 14px; max-height: 400px; overflow-y: auto;">' + 
                answerText.replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
                '</div>' +
                '</div>' +
                mentionsHtml +
                citationsHtml;
              
              responsesList.appendChild(responseDiv);
              responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
              throw new Error('Ungültige Antwort vom Server');
            }
          } catch (error) {
            // Remove processing indicator
            const processingEl = document.getElementById('processing_' + i);
            if (processingEl) processingEl.remove();
            
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'padding: 16px; background: #ffebee; border: 1px solid #f44336; border-radius: 8px; border-left: 4px solid #f44336;';
            errorDiv.innerHTML = 
              '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">' +
              '<span style="font-size: 20px;">❌</span>' +
              '<strong style="color: #c62828;">Fehler bei Frage ' + (i + 1) + ':</strong>' +
              '</div>' +
              '<p style="margin: 4px 0; color: var(--gray-700);">' + prompt.question + '</p>' +
              '<small style="color: #d32f2f;">' + (error.message || 'Unbekannter Fehler') + '</small>';
            responsesList.appendChild(errorDiv);
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
        
        // Final update
        if (progressFill) {
          progressFill.style.width = '100%';
          progressFill.style.transition = 'width 0.3s ease';
        }
        if (progressText) progressText.textContent = '✅ Analyse abgeschlossen! ' + executedCount + ' von ' + promptsLength + ' Fragen erfolgreich ausgeführt';
        if (statusEl) {
          statusEl.textContent = '✅ Schritt 5 abgeschlossen';
          statusEl.style.color = '#059669';
        }
        if (statusDetailsEl) statusDetailsEl.textContent = 'Alle Fragen wurden ausgeführt. Ergebnisse sind unten sichtbar.';
        
        // Save all responses
        try {
          await fetch('/api/workflow/step5', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              runId: currentRunId,
              prompts: workflowData.prompts
            })
          });
        } catch (error) {
          console.error('Error saving responses:', error);
        }
        
        // Generate summary/fazit after all questions are answered
        if (executedCount > 0 && allQuestionsAndAnswers.length > 0) {
          await generateSummary(allQuestionsAndAnswers, workflowData);
        }
        
        const loading = document.getElementById('loading');
        if (loading) {
          loading.style.display = 'none';
          loading.classList.remove('show');
        }
      } catch (error) {
        console.error('Error in executeStep5:', error);
        throw error;
      }
    }

    async function generateSummary(questionsAndAnswers, workflowData) {
      try {
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        const responsesList = document.getElementById('responsesList');
        
        if (statusEl) {
          statusEl.textContent = '📊 Fazit wird generiert...';
          statusEl.style.color = '#7c3aed';
        }
        if (statusDetailsEl) {
          statusDetailsEl.textContent = 'GPT analysiert alle Fragen und Antworten...';
        }
        
        // Check if responsesList exists
        if (!responsesList) {
          console.error('❌ responsesList element not found');
          throw new Error('Responses list element not found');
        }
        
        // Show loading indicator
        const summaryLoadingDiv = document.createElement('div');
        summaryLoadingDiv.id = 'summaryLoading';
        summaryLoadingDiv.style.cssText = 'padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center; margin-top: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        summaryLoadingDiv.innerHTML = 
          '<div style="display: inline-block; width: 32px; height: 32px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px;"></div>' +
          '<p style="color: white; font-weight: 600; margin: 0; font-size: 16px;">Fazit wird generiert...</p>' +
          '<p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">GPT analysiert alle Fragen und Antworten</p>';
        responsesList.appendChild(summaryLoadingDiv);
        summaryLoadingDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Call API to generate summary
        const response = await fetch('/api/workflow/generateSummary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            runId: currentRunId,
            questionsAndAnswers: questionsAndAnswers,
            userInput: workflowData
          })
        });
        
        if (!response.ok) {
          throw new Error('Fehler beim Generieren des Fazits');
        }
        
        const summaryData = await response.json();
        
        // Remove loading indicator
        const loadingEl = document.getElementById('summaryLoading');
        if (loadingEl) loadingEl.remove();
        
        // Display summary
        const summaryDiv = document.createElement('div');
        summaryDiv.id = 'summary';
        summaryDiv.style.cssText = 'padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-top: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: white;';
        
        const totalMentions = summaryData.totalMentions || 0;
        const totalCitations = summaryData.totalCitations || 0;
        const bestPrompts = summaryData.bestPrompts || [];
        const otherSources = summaryData.otherSources || {};
        
        let bestPromptsHtml = '';
        if (bestPrompts.length > 0) {
          bestPromptsHtml = '<div style="margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px);">';
          bestPromptsHtml += '<h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: white;">🏆 Beste Prompts:</h4>';
          bestPromptsHtml += '<ul style="margin: 0; padding-left: 20px; list-style: none;">';
          bestPrompts.forEach(function(prompt, idx) {
            bestPromptsHtml += '<li style="margin-bottom: 8px; padding: 8px 12px; background: rgba(255,255,255,0.1); border-radius: 6px; border-left: 3px solid white;">';
            bestPromptsHtml += '<span style="font-weight: 600; margin-right: 8px;">' + (idx + 1) + '.</span>';
            bestPromptsHtml += '<span>' + prompt.question.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
            bestPromptsHtml += '<div style="margin-top: 4px; font-size: 12px; opacity: 0.9;">Erwähnungen: ' + prompt.mentions + ', Zitierungen: ' + prompt.citations + '</div>';
            bestPromptsHtml += '</li>';
          });
          bestPromptsHtml += '</ul></div>';
        }
        
        let otherSourcesHtml = '';
        const sourceEntries = Object.entries(otherSources);
        if (sourceEntries.length > 0) {
          otherSourcesHtml = '<div style="margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px);">';
          otherSourcesHtml += '<h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: white;">📚 Andere Quellen:</h4>';
          otherSourcesHtml += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">';
          sourceEntries.forEach(function([source, count]) {
            otherSourcesHtml += '<div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px; text-align: center;">';
            otherSourcesHtml += '<div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">' + count + '</div>';
            otherSourcesHtml += '<div style="font-size: 12px; opacity: 0.9; word-break: break-word;">' + source.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
            otherSourcesHtml += '</div>';
          });
          otherSourcesHtml += '</div></div>';
        }
        
        summaryDiv.innerHTML = 
          '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">' +
          '<span style="font-size: 32px;">📊</span>' +
          '<h3 style="margin: 0; font-size: 24px; font-weight: 700; color: white;">Fazit</h3>' +
          '</div>' +
          '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">' +
          '<div style="padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px); text-align: center;">' +
          '<div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">' + totalMentions + '</div>' +
          '<div style="font-size: 14px; opacity: 0.9;">Anzahl Erwähnungen</div>' +
          '</div>' +
          '<div style="padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px); text-align: center;">' +
          '<div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">' + totalCitations + '</div>' +
          '<div style="font-size: 14px; opacity: 0.9;">Anzahl Zitierungen</div>' +
          '</div>' +
          '</div>' +
          bestPromptsHtml +
          otherSourcesHtml;
        
        // Check if responsesList still exists before appending
        if (responsesList) {
          responsesList.appendChild(summaryDiv);
          summaryDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          console.error('❌ responsesList element not found when trying to append summary');
        }
        
        if (statusEl) {
          statusEl.textContent = '✅ Fazit generiert';
          statusEl.style.color = '#059669';
        }
        if (statusDetailsEl) {
          statusDetailsEl.textContent = 'Alle Analysen abgeschlossen';
        }
      } catch (error) {
        console.error('Error generating summary:', error);
        const loadingEl = document.getElementById('summaryLoading');
        if (loadingEl) loadingEl.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'padding: 16px; background: #ffebee; border: 1px solid #f44336; border-radius: 8px; margin-top: 24px;';
        errorDiv.innerHTML = 
          '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">' +
          '<span style="font-size: 20px;">❌</span>' +
          '<strong style="color: #c62828;">Fehler beim Generieren des Fazits:</strong>' +
          '</div>' +
          '<small style="color: #d32f2f;">' + (error.message || 'Unbekannter Fehler') + '</small>';
        const responsesList = document.getElementById('responsesList');
        if (responsesList) responsesList.appendChild(errorDiv);
      }
    }

    const analyzeForm = document.getElementById('analyzeForm');
    if (!analyzeForm) {
      console.error('❌ Form element not found!');
      alert('Fehler: Formular nicht gefunden. Bitte Seite neu laden.');
      return;
    }
    
    console.log('✅ Form found, adding event listeners...');
    
    // Handle button click - PRIMARY METHOD
    const startBtn = document.getElementById('startAnalysisBtn');
    if (!startBtn) {
      console.error('❌ Start button not found!');
      alert('Fehler: Start-Button nicht gefunden. Bitte Seite neu laden.');
      return;
    }
    
    console.log('✅ Start button found, attaching click handler...');
    
    // Override the inline onclick with our full handler
    startBtn.onclick = async function(e) {
      console.log('🔵 Button clicked via onclick handler!');
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      try {
        // Visual feedback immediately
        startBtn.disabled = true;
        const originalText = startBtn.textContent;
        startBtn.textContent = 'Starte Analyse...';
        startBtn.style.opacity = '0.7';
        startBtn.style.cursor = 'not-allowed';
        
        console.log('🔵 Calling handleFormSubmit...');
        await handleFormSubmit();
        
        // Re-enable button after completion
        startBtn.disabled = false;
        startBtn.textContent = originalText;
        startBtn.style.opacity = '1';
        startBtn.style.cursor = 'pointer';
      } catch (error) {
        console.error('❌ Error in button click handler:', error);
        alert('Fehler beim Starten der Analyse: ' + (error.message || error));
        
        // Re-enable button on error
        startBtn.disabled = false;
        startBtn.textContent = 'Analyse starten';
        startBtn.style.opacity = '1';
        startBtn.style.cursor = 'pointer';
      }
    };
    
    console.log('✅ Button onclick handler attached');
    
    // Prevent form submission on Enter key in input fields
    const formInputs = analyzeForm.querySelectorAll('input, select');
    formInputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔵 Enter key pressed, triggering button click');
          startBtn.click();
        }
      });
    });
    
    // Also handle form submit (as fallback)
    analyzeForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔵 Form submitted (fallback)!');
      startBtn.click(); // Trigger button click instead
    });
    
    // Prevent AI Readiness form from submitting to wrong handler
    const aiReadinessForm = document.getElementById('aiReadinessForm');
    if (aiReadinessForm) {
      aiReadinessForm.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔵 AI Readiness form submitted - preventing default');
        // Call startAIReadiness if available
        if (window.startAIReadiness) {
          window.startAIReadiness();
        }
        return false;
      });
    }
    
    console.log('✅ All event listeners attached successfully');
    
    // Make functions available globally for startAnalysisNow
    window.executeStep1 = executeStep1;
    window.executeStep2 = executeStep2;
    window.executeStep3 = executeStep3;
    window.executeStep4 = executeStep4;
    window.executeStep5 = executeStep5;

    // Helper functions
    function hideAllSections() {
      const analysisSection = document.querySelector('.content-area > .card');
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const aiReadinessSection = document.getElementById('aiReadinessSection');
      if (analysisSection) analysisSection.style.display = 'none';
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (aiReadinessSection) aiReadinessSection.style.display = 'none';
    }
    
    function updateNavActive(event) {
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      }
    }
    
    // Dashboard functionality
    function showDashboard(event) {
      hideAllSections();
      const analysisSection = document.querySelector('.content-area > .card');
      if (analysisSection) {
        analysisSection.style.display = 'block';
      }
      updateNavActive(event);
    }
    
    // Analyses functionality
    function showAnalyses(event) {
      hideAllSections();
      const analysesSection = document.getElementById('analysesSection');
      if (analysesSection) {
        analysesSection.style.display = 'block';
        loadAnalyses();
      }
      updateNavActive(event);
    }
    
    // AI Readiness functionality
    function showAIReadiness(event) {
      hideAllSections();
      const aiReadinessSection = document.getElementById('aiReadinessSection');
      if (aiReadinessSection) {
        aiReadinessSection.style.display = 'block';
      }
      updateNavActive(event);
    }
    
    // Start AI Readiness Check
    async function startAIReadiness() {
      const urlInput = document.getElementById('aiReadinessUrl');
      const url = urlInput?.value?.trim();
      
      if (!url) {
        alert('Bitte geben Sie eine URL ein.');
            return;
          }
          
      // Validate URL
      let websiteUrl = url;
      const urlPattern = new RegExp('^https?:\\/\\/', 'i');
      if (!urlPattern.test(websiteUrl)) {
        websiteUrl = 'https://' + websiteUrl;
      }
      
      try {
        new URL(websiteUrl);
      } catch (e) {
        alert('Ungültige URL. Bitte geben Sie eine gültige URL ein.');
        return;
      }
      
      const loadingEl = document.getElementById('aiReadinessLoading');
      const resultsEl = document.getElementById('aiReadinessResults');
      const statusEl = document.getElementById('aiReadinessStatus');
      const statusDetailsEl = document.getElementById('aiReadinessStatusDetails');
      const progressEl = document.getElementById('aiReadinessProgress');
      const progressTextEl = document.getElementById('aiReadinessProgressText');
      const resultsContentEl = document.getElementById('aiReadinessResultsContent');
      const consoleEl = document.getElementById('aiReadinessConsole');
      const consoleContentEl = document.getElementById('aiReadinessConsoleContent');
      
      // Console logging function
      const addConsoleLog = (message, type = 'info') => {
        if (!consoleContentEl) return;
        const timestamp = new Date().toLocaleTimeString('de-DE');
        const colors = {
          info: '#4fc3f7',
          success: '#66bb6a',
          warning: '#ffa726',
          error: '#ef5350',
          system: '#6a9955'
        };
        const icons = {
          info: 'ℹ️',
          success: '✅',
          warning: '⚠️',
          error: '❌',
          system: '🔵'
        };
        const color = colors[type] || colors.info;
        const icon = icons[type] || icons.info;
        const logLine = document.createElement('div');
        logLine.style.color = color;
        logLine.style.marginBottom = '4px';
        const timestampSpan = document.createElement('span');
        timestampSpan.style.color = '#858585';
        timestampSpan.textContent = '[' + timestamp + ']';
        logLine.appendChild(timestampSpan);
        logLine.appendChild(document.createTextNode(' ' + icon + ' ' + message));
        consoleContentEl.appendChild(logLine);
        consoleContentEl.scrollTop = consoleContentEl.scrollHeight;
      };
      
      // Clear console function
      const clearConsole = () => {
        if (consoleContentEl) {
          consoleContentEl.innerHTML = '<div style="color: #6a9955;">[System] Console gelöscht.</div>';
        }
      };
      
      // Setup clear button
      const clearBtn = document.getElementById('clearConsoleBtn');
      if (clearBtn) {
        clearBtn.onclick = clearConsole;
      }
      
      if (loadingEl) {
        loadingEl.style.display = 'block';
        loadingEl.classList.add('show');
      }
      if (consoleEl) {
        consoleEl.style.display = 'block';
        clearConsole();
        addConsoleLog('AI Readiness Analyse gestartet', 'system');
        addConsoleLog('Ziel-URL: ' + websiteUrl, 'info');
      }
      if (resultsEl) resultsEl.style.display = 'none';
      if (statusEl) statusEl.textContent = 'Vorbereitung...';
      if (statusDetailsEl) statusDetailsEl.textContent = 'Starte AI Readiness Check...';
      if (progressEl) progressEl.style.width = '0%';
      if (progressTextEl) progressTextEl.textContent = '0%';
      
      try {
        // Step 1: Start analysis
        addConsoleLog('Starte Analyse-Request an Server...', 'info');
        if (statusEl) statusEl.textContent = 'Schritt 1: robots.txt und Sitemap holen...';
        if (statusDetailsEl) statusDetailsEl.textContent = 'Lade robots.txt und Sitemap...';
        if (progressEl) progressEl.style.width = '20%';
        if (progressTextEl) progressTextEl.textContent = '20%';
        
        const step1Response = await fetch('/api/ai-readiness/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteUrl })
        });
        
        if (!step1Response.ok) {
          addConsoleLog('Fehler beim Starten der Analyse', 'error');
          throw new Error('Fehler beim Starten der Analyse');
        }
        
        const step1Data = await step1Response.json();
        addConsoleLog('Analyse gestartet. Run ID: ' + step1Data.runId, 'success');
        addConsoleLog('Warte auf Hintergrund-Verarbeitung...', 'info');
        
        // Wait for completion (polling)
        let attempts = 0;
        const maxAttempts = 120; // 10 minutes max (120 * 5 seconds)
        let recommendations = null;
        let lastMessage = '';
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          
          const statusResponse = await fetch('/api/ai-readiness/status/' + step1Data.runId);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            // Log status updates
            if (statusData.message && statusData.message !== lastMessage) {
              addConsoleLog(statusData.message, 'info');
              lastMessage = statusData.message;
              
              // Parse step from message
              if (statusData.message.includes('Schritt 1')) {
                if (progressEl) progressEl.style.width = '15%';
                if (progressTextEl) progressTextEl.textContent = '15%';
                if (statusEl) statusEl.textContent = 'Schritt 1/6: robots.txt';
              } else if (statusData.message.includes('Schritt 2')) {
                if (progressEl) progressEl.style.width = '30%';
                if (progressTextEl) progressTextEl.textContent = '30%';
                if (statusEl) statusEl.textContent = 'Schritt 2/6: Sitemap';
              } else if (statusData.message.includes('Schritt 3')) {
                if (progressEl) progressEl.style.width = '45%';
                if (progressTextEl) progressTextEl.textContent = '45%';
                if (statusEl) statusEl.textContent = 'Schritt 3/6: Homepage';
              } else if (statusData.message.includes('Schritt 4')) {
                if (progressEl) progressEl.style.width = '60%';
                if (progressTextEl) progressTextEl.textContent = '60%';
                if (statusEl) statusEl.textContent = 'Schritt 4/6: Seiten scrapen';
              } else if (statusData.message.includes('Schritt 5')) {
                if (progressEl) progressEl.style.width = '75%';
                if (progressTextEl) progressTextEl.textContent = '75%';
                if (statusEl) statusEl.textContent = 'Schritt 5/6: Daten analysieren';
              } else if (statusData.message.includes('Schritt 6')) {
                if (progressEl) progressEl.style.width = '85%';
                if (progressTextEl) progressTextEl.textContent = '85%';
                if (statusEl) statusEl.textContent = 'Schritt 6/6: GPT-Analyse';
              }
            }
            
            if (statusData.status === 'completed') {
              addConsoleLog('Analyse erfolgreich abgeschlossen!', 'success');
              recommendations = statusData.recommendations;
              break;
            } else if (statusData.status === 'error') {
              addConsoleLog('Fehler: ' + (statusData.error || 'Unbekannter Fehler'), 'error');
              throw new Error(statusData.error || 'Fehler bei der Analyse');
            }
            
            // Update progress
            if (statusDetailsEl && statusData.message) {
              statusDetailsEl.textContent = statusData.message;
            }
          } else {
            addConsoleLog('Status-Abfrage fehlgeschlagen (Versuch ' + (attempts + 1) + '/' + maxAttempts + ')', 'warning');
          }
          
          attempts++;
        }
        
        if (!recommendations) {
          addConsoleLog('Timeout: Die Analyse hat zu lange gedauert.', 'error');
          throw new Error('Timeout: Die Analyse hat zu lange gedauert.');
        }
        
        // Display results
        addConsoleLog('Ergebnisse werden angezeigt...', 'success');
        if (statusEl) statusEl.textContent = '✅ Analyse abgeschlossen';
        if (statusDetailsEl) statusDetailsEl.textContent = 'AI Readiness Check erfolgreich durchgeführt';
        if (progressEl) progressEl.style.width = '100%';
        if (progressTextEl) progressTextEl.textContent = '100%';
        
        if (resultsContentEl) {
          resultsContentEl.innerHTML = 
            '<div style="white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #374151;">' +
            recommendations.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
            '</div>';
        }
        
        if (resultsEl) resultsEl.style.display = 'block';
        
      } catch (error) {
        console.error('Error in AI Readiness check:', error);
        addConsoleLog('Fehler: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'), 'error');
        if (statusEl) statusEl.textContent = '❌ Fehler';
        if (statusDetailsEl) statusDetailsEl.textContent = error instanceof Error ? error.message : 'Unbekannter Fehler';
        alert('Fehler beim AI Readiness Check: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      } finally {
        if (loadingEl) {
          setTimeout(() => {
            loadingEl.style.display = 'none';
            loadingEl.classList.remove('show');
          }, 2000);
        }
      }
    }
    
    function loadAnalyses() {
      const analysesList = document.getElementById('analysesList');
      if (!analysesList) return;
      
      analysesList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--gray-500);">Lade Analysen...</div>';
      
      fetch('/api/analyses')
        .then(res => res.json())
        .then(analyses => {
          if (analyses.length === 0) {
            analysesList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--gray-500);">Keine Analysen vorhanden. Starte eine neue Analyse.</div>';
            return;
          }
          
          analysesList.innerHTML = analyses.map(function(analysis) {
            const createdAt = new Date(analysis.createdAt);
            const statusBadge = analysis.status === 'completed' 
              ? '<span style="padding: 4px 12px; background: #059669; color: white; border-radius: 12px; font-size: 12px; font-weight: 600;">Abgeschlossen</span>'
              : analysis.status === 'running'
              ? '<span style="padding: 4px 12px; background: #d97706; color: white; border-radius: 12px; font-size: 12px; font-weight: 600;">Läuft</span>'
              : '<span style="padding: 4px 12px; background: #cbd5e1; color: white; border-radius: 12px; font-size: 12px; font-weight: 600;">' + analysis.status + '</span>';
            
            const runId = analysis.id || '';
            return '<div style="padding: 20px; background: white; border: 1px solid var(--gray-200); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: all 0.2s;">' +
              '<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">' +
                '<div style="flex: 1;">' +
                  '<h4 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: var(--gray-900);">' + (analysis.websiteUrl || 'Unbekannte URL') + '</h4>' +
                  '<p style="margin: 0; font-size: 13px; color: var(--gray-500);">' + createdAt.toLocaleString('de-DE') + '</p>' +
                '</div>' +
                statusBadge +
              '</div>' +
              '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px;">' +
                '<div>' +
                  '<div style="font-size: 11px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Land</div>' +
                  '<div style="font-size: 14px; font-weight: 600; color: var(--gray-900);">' + (analysis.country || '') + '</div>' +
                '</div>' +
                '<div>' +
                  '<div style="font-size: 11px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Sprache</div>' +
                  '<div style="font-size: 14px; font-weight: 600; color: var(--gray-900);">' + (analysis.language || '') + '</div>' +
                '</div>' +
                '<div>' +
                  '<div style="font-size: 11px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Region</div>' +
                  '<div style="font-size: 14px; font-weight: 600; color: var(--gray-900);">' + (analysis.region || '-') + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="margin-top: 16px; display: flex; gap: 8px;">' +
                '<button class="btn btn-primary" data-run-id="' + String(runId).replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" onclick="viewAnalysisDetails(this.dataset.runId)" style="flex: 1; padding: 8px 16px; font-size: 13px;">' +
                  '📊 Details anzeigen' +
                '</button>' +
                (analysis.status === 'running' 
                  ? '<button class="btn" data-run-id="' + String(runId).replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" onclick="pauseAnalysis(this.dataset.runId)" style="padding: 8px 16px; font-size: 13px; background: var(--warning); color: white;">⏸ Pausieren</button>'
                  : '') +
                '<button class="btn" data-run-id="' + String(runId).replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" onclick="deleteAnalysis(this.dataset.runId)" style="padding: 8px 16px; font-size: 13px; background: var(--error); color: white;">🗑 Löschen</button>' +
              '</div>' +
            '</div>';
          }).join('');
        })
        .catch(err => {
          console.error('Error loading analyses:', err);
          analysesList.innerHTML = '<div style="text-align: center; padding: 40px; color: #dc2626;">Fehler beim Laden der Analysen.</div>';
        });
    }
    
    function viewAnalysisDetails(runId) {
      console.log('🔍 Loading analysis details for runId:', runId);
      hideAllSections();
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const analysisDetailContent = document.getElementById('analysisDetailContent');
      const analysisDetailTitle = document.getElementById('analysisDetailTitle');
      
      if (!analysisDetailSection || !analysisDetailContent) {
        console.error('❌ Analysis detail elements not found!');
        return;
      }
      
      analysisDetailSection.style.display = 'block';
      analysisDetailContent.innerHTML = 
        '<div style="text-align: center; padding: 40px; color: var(--gray-500);">' +
        '<div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>' +
        '<p style="margin-top: 16px; font-size: 14px;">Lade Analyse-Insights...</p>' +
        '<p style="margin-top: 8px; font-size: 12px; color: var(--gray-400);">Dies kann einige Sekunden dauern</p>' +
        '</div>';
      
      // Add spinner animation if not already present
      if (!document.getElementById('spinnerStyle')) {
        const style = document.createElement('style');
        style.id = 'spinnerStyle';
        style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
      }
      
      // Fetch insights instead of full analysis
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      fetch('/api/analysis/' + runId + '/insights', {
        signal: controller.signal
      })
        .then(res => {
          if (!res.ok) {
            return res.text().then(text => {
              throw new Error('HTTP ' + res.status + ': ' + text.substring(0, 200));
            });
          }
          return res.json();
        })
        .then(insights => {
          clearTimeout(timeoutId);
          const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log('✅ Insights loaded in', loadTime, 'seconds');
          
          if (insights.error) {
            console.error('❌ API returned error:', insights.error);
            analysisDetailContent.innerHTML = '<div style="color: #dc2626; padding: 20px;">Fehler: ' + insights.error + '</div>';
            return;
          }
          
          // Validate that insights has required structure
          if (!insights || !insights.summary) {
            console.error('❌ Invalid insights data structure:', insights);
            analysisDetailContent.innerHTML = '<div style="color: #dc2626; padding: 20px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
              '<strong>❌ Fehler beim Laden der Insights</strong><br>' +
              '<p style="margin-top: 8px; color: #c62828;">Ungültige Datenstruktur erhalten. Bitte versuche es erneut.</p>' +
              '<p style="margin-top: 12px; font-size: 12px; color: #666;">Empfangen: ' + JSON.stringify(insights).substring(0, 200) + '</p>' +
              '</div>';
            return;
          }
          
          // Ensure all required fields exist with defaults
          if (!insights.summary) {
            insights.summary = { totalBrandMentions: 0, totalBrandCitations: 0, promptsWithMentions: 0, totalPrompts: 0 };
          }
          if (!insights.promptsWithMentions) {
            insights.promptsWithMentions = [];
          }
          if (!insights.allCompetitors) {
            insights.allCompetitors = [];
          }
          if (!insights.detailedData) {
            insights.detailedData = [];
          }
          
          console.log('📊 Insights data:', {
            totalBrandMentions: insights.summary.totalBrandMentions,
            totalBrandCitations: insights.summary.totalBrandCitations,
            promptsWithMentions: insights.summary.promptsWithMentions,
            totalPrompts: insights.summary.totalPrompts
          });
          
          // Build insights dashboard - Professional design
          let html = '<div style="margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">';
          html += '<h2 style="margin: 0 0 8px 0; color: #111827; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Analyse-Ergebnisse</h2>';
          html += '<div style="display: flex; gap: 24px; margin-top: 12px; font-size: 14px; color: #6b7280;">';
          html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;"></span> ' + (insights.websiteUrl || '') + '</span>';
          if (insights.brandName) {
            html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span> ' + insights.brandName + '</span>';
          }
          html += '</div>';
          html += '</div>';
          
          // Summary Metrics Cards - Clean, professional design
          html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 48px;">';
          html += '<div style="padding: 28px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;">';
          html += '<div style="font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Markenerwähnungen</div>';
          html += '<div style="font-size: 42px; font-weight: 700; color: #111827; margin-bottom: 4px; line-height: 1;">' + (insights.summary?.totalBrandMentions || 0) + '</div>';
          html += '<div style="font-size: 13px; color: #9ca3af; margin-top: 8px;">Gesamtanzahl</div>';
          html += '</div>';
          
          html += '<div style="padding: 28px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;">';
          html += '<div style="font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Zitationen</div>';
          html += '<div style="font-size: 42px; font-weight: 700; color: #111827; margin-bottom: 4px; line-height: 1;">' + (insights.summary?.totalBrandCitations || 0) + '</div>';
          html += '<div style="font-size: 13px; color: #9ca3af; margin-top: 8px;">Von dieser Marke</div>';
          html += '</div>';
          
          html += '<div style="padding: 28px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;">';
          html += '<div style="font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Erfolgreiche Prompts</div>';
          html += '<div style="font-size: 42px; font-weight: 700; color: #111827; margin-bottom: 4px; line-height: 1;">' + (insights.summary?.promptsWithMentions || 0) + '</div>';
          html += '<div style="font-size: 13px; color: #9ca3af; margin-top: 8px;">von ' + (insights.summary?.totalPrompts || 0) + ' analysiert</div>';
          html += '</div>';
          html += '</div>';
          
          // Prompts where brand is mentioned - Professional design
          if (insights.promptsWithMentions && insights.promptsWithMentions.length > 0) {
            html += '<div style="margin-bottom: 48px;">';
            html += '<h3 style="margin: 0 0 24px 0; color: #111827; font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">Prompts mit Markenerwähnungen</h3>';
            html += '<div style="display: grid; gap: 16px;">';
            insights.promptsWithMentions.forEach(function(prompt) {
              html += '<div style="padding: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">';
              html += '<div style="font-weight: 500; color: #111827; margin-bottom: 12px; font-size: 15px; line-height: 1.5;">' + (prompt?.question || 'Unbekannte Frage').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
              html += '<div style="display: flex; gap: 24px; font-size: 13px; color: #6b7280; padding-top: 12px; border-top: 1px solid #f3f4f6;">';
              html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="color: #3b82f6; font-weight: 600;">' + (prompt?.mentionCount || 0) + '</span> Erwähnungen</span>';
              html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="color: #10b981; font-weight: 600;">' + (prompt?.citationCount || 0) + '</span> Zitationen</span>';
              html += '</div>';
              html += '</div>';
            });
            html += '</div></div>';
          }
          
          // Competitors section removed as requested
          
          // Detailed data (collapsible) - Professional design
          html += '<div style="margin-bottom: 32px;">';
          html += '<details style="cursor: pointer;">';
          html += '<summary style="padding: 18px 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; font-weight: 500; color: #111827; font-size: 15px; user-select: none; transition: background 0.2s;">Detaillierte Analyse-Ergebnisse</summary>';
          html += '<div style="display: grid; gap: 20px; margin-top: 20px;">';
          (insights.detailedData || []).forEach(function(data) {
            html += '<div style="padding: 24px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">';
            html += '<div style="font-weight: 500; color: #111827; margin-bottom: 16px; font-size: 16px; line-height: 1.5;">' + (data?.question || 'Unbekannte Frage').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
            if (data?.answer) {
              const answerText = String(data.answer || '');
              html += '<div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 16px; font-size: 14px; color: #374151; line-height: 1.7;">';
              html += answerText.substring(0, 400).replace(/</g, '&lt;').replace(/>/g, '&gt;') + (answerText.length > 400 ? '...' : '');
              html += '</div>';
            }
            html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6;">';
            html += '<div style="font-size: 13px;"><span style="color: #6b7280; display: block; margin-bottom: 4px;">Erwähnungen</span><span style="color: #111827; font-weight: 600; font-size: 18px;">' + (data?.brandMentions?.total || 0) + '</span></div>';
            html += '<div style="font-size: 13px;"><span style="color: #6b7280; display: block; margin-bottom: 4px;">Zitate (Marke)</span><span style="color: #111827; font-weight: 600; font-size: 18px;">' + (data?.citations?.brandCitations || 0) + '</span></div>';
            html += '<div style="font-size: 13px;"><span style="color: #6b7280; display: block; margin-bottom: 4px;">Zitate (gesamt)</span><span style="color: #111827; font-weight: 600; font-size: 18px;">' + (data?.citations?.total || 0) + '</span></div>';
            html += '</div>';
            html += '</div>';
          });
          html += '</div></details></div>';
          
          analysisDetailContent.innerHTML = html;
          console.log('✅ Analysis details rendered successfully');
        })
        .catch(err => {
          clearTimeout(timeoutId);
          const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
          console.error('❌ Error loading analysis insights after', loadTime, 'seconds:', err);
          
          let errorMessage = 'Unbekannter Fehler';
          if (err.name === 'AbortError') {
            errorMessage = 'Zeitüberschreitung: Die Anfrage hat zu lange gedauert (>30 Sekunden). Bitte versuche es erneut.';
          } else if (err && err.message) {
            errorMessage = err.message;
          }
          analysisDetailContent.innerHTML = 
            '<div style="color: #dc2626; padding: 20px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
            '<strong>❌ Fehler beim Laden der Analyse-Insights</strong><br>' +
            '<p style="margin-top: 8px; color: #c62828;">' + errorMessage + '</p>' +
            '<p style="margin-top: 12px; font-size: 12px; color: #666;">Bitte überprüfe die Browser-Konsole für weitere Details oder versuche es später erneut.</p>' +
            '<button data-run-id="' + String(runId).replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" onclick="viewAnalysisDetails(this.dataset.runId)" class="btn" style="margin-top: 12px; padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">🔄 Erneut versuchen</button>' +
            '</div>';
        });
    }
    
    function deleteAnalysis(runId) {
      if (!confirm('Möchtest du diese Analyse wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
        return;
      }
      
      fetch('/api/analysis/' + runId, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert('Analyse erfolgreich gelöscht!');
            loadAnalyses(); // Reload the list
          } else {
            alert('Fehler beim Löschen: ' + (data.error || 'Unbekannter Fehler'));
          }
        })
        .catch(err => {
          console.error('Error deleting analysis:', err);
          alert('Fehler beim Löschen der Analyse.');
        });
    }
    
    function pauseAnalysis(runId) {
      if (!confirm('Möchtest du diese Analyse pausieren?')) {
            return;
          }
          
      fetch('/api/analysis/' + runId + '/pause', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
          })
            .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert('Analyse erfolgreich pausiert!');
            loadAnalyses(); // Reload the list
          } else {
            alert('Fehler beim Pausieren: ' + (data.error || 'Unbekannter Fehler'));
          }
        })
        .catch(err => {
          console.error('Error pausing analysis:', err);
          alert('Fehler beim Pausieren der Analyse.');
        });
    }
    
    // Store full implementations for use by global stubs
    window.showDashboardFull = showDashboard;
    window.showAnalysesFull = showAnalyses;
    window.showAIReadinessFull = showAIReadiness;
    window.startAIReadinessFull = startAIReadiness;
    window.loadAnalyses = loadAnalyses;
    window.viewAnalysisDetailsFull = viewAnalysisDetails;
    window.deleteAnalysisFull = deleteAnalysis;
    window.pauseAnalysisFull = pauseAnalysis;
    
    // Update global functions to use full implementations
    // Note: window.startAIReadiness is already defined in <head> script, don't override it
    window.showDashboard = showDashboard;
    window.showAnalyses = showAnalyses;
    window.showAIReadiness = showAIReadiness;
    window.viewAnalysisDetails = viewAnalysisDetails;
    window.deleteAnalysis = deleteAnalysis;
    window.pauseAnalysis = pauseAnalysis;
    }); // End of DOMContentLoaded
  </script>
</body>
</html>`;

        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            ...corsHeaders,
          },
        });
      }

      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "The requested endpoint does not exist",
          availableEndpoints: [
            "GET /",
            "POST /api/analyze",
            "GET /api/analysis/:runId",
            "GET /api/analysis/:runId/metrics",
            "GET /api/health",
          ],
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
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
  }

  private async handleFetchUrl(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { url } = body;

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "GEO-Platform/1.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const html = await response.text();
        // Extract text content
        let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
        text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
        text = text.replace(/<[^>]+>/g, " ");
        text = text.replace(/\s+/g, " ").trim();
        
        return new Response(JSON.stringify({ content: text.substring(0, 2000) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ content: null, error: "Failed to fetch" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ content: null, error: error instanceof Error ? error.message : "Unknown error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  private async handleExecutePrompt(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { runId, prompt, userInput } = body;

    try {
      const { LLMExecutor } = await import("../llm_execution/index.js");
      const { getConfig } = await import("../config.js");
      const config = getConfig(env);
      const executor = new LLMExecutor(config);
      
      // Execute prompt with GPT-5 Web Search
      const response = await executor.executePrompt(prompt);
      
      // Extract brand name from website URL
      const websiteUrl = userInput?.websiteUrl || '';
      const brandName = this.extractBrandName(websiteUrl);
      
      // Perform analysis: Brand mentions, Citations, Competitors, Sentiment
      const { AnalysisEngine } = await import("../analysis/index.js");
      const analysisEngine = new AnalysisEngine(brandName, 0.7);
      const analysis = analysisEngine.analyzeResponses([prompt], [response])[0];
      
      // Save prompt, response, and analysis immediately (with timestamps)
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);
      
      // Ensure prompt is saved (if runId is provided)
      // Use INSERT OR REPLACE to avoid duplicate key errors
      if (runId) {
        try {
          await db.savePrompts(runId, [prompt]);
        } catch (error: any) {
          // If it's a unique constraint error, the prompt already exists - that's okay
          if (!error.message?.includes("UNIQUE constraint")) {
            console.warn("Error saving prompt (may already exist):", error.message);
          }
        }
      }
      
      // Save response (with timestamp)
      await db.saveLLMResponses([response]);
      
      // Save analysis immediately (with structured answers)
      await db.savePromptAnalyses([analysis]);
      
      console.log(`✅ Saved question, answer, and analysis for prompt ${prompt.id} at ${new Date().toISOString()}`);
      
      // Return response with structured analysis
      // Structured answers to the three key questions:
      return new Response(JSON.stringify({ 
        response,
        analysis: {
          // Original analysis fields
          brandMentions: analysis.brandMentions,
          citations: response.citations || [], // Use citations directly from GPT-5 Web Search response
          competitors: analysis.competitors,
          sentiment: analysis.sentiment,
          citationCount: response.citations?.length || 0,
          citationUrls: response.citations?.map((c: any) => c.url) || [],
          brandCitations: analysis.brandCitations || [],
          
          // Structured answers to the three key questions:
          // 1. Bin ich erwähnt? Wenn ja, wie viel?
          isMentioned: analysis.isMentioned,
          mentionCount: analysis.mentionCount,
          
          // 2. Werde ich zitiert? Wenn ja, wo und was?
          isCited: analysis.isCited,
          citationDetails: analysis.citationDetails,
          
          // 3. Welche anderen Unternehmen werden genannt und wo?
          competitorDetails: analysis.competitorDetails,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error('Error in handleExecutePrompt:', error);
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
  
  private async handleGenerateSummary(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { runId, questionsAndAnswers, userInput } = body;

    try {
      // Extract brand name from website URL
      const websiteUrl = userInput?.websiteUrl || '';
      const brandName = this.extractBrandName(websiteUrl);
      
      // Calculate totals
      let totalMentions = 0;
      let totalCitations = 0;
      const promptScores: Array<{ question: string; mentions: number; citations: number; score: number }> = [];
      const sourceCounts: Record<string, number> = {};
      
      questionsAndAnswers.forEach((qa: any) => {
        const mentions = (qa.brandMentions?.exact || 0) + (qa.brandMentions?.fuzzy || 0);
        const citations = qa.citations?.length || 0;
        
        totalMentions += mentions;
        totalCitations += citations;
        
        // Score = mentions * 2 + citations (weighted)
        const score = mentions * 2 + citations;
        promptScores.push({
          question: qa.question,
          mentions: mentions,
          citations: citations,
          score: score
        });
        
        // Count sources
        if (qa.citations && Array.isArray(qa.citations)) {
          qa.citations.forEach((citation: any) => {
            if (citation.url) {
              try {
                const url = new URL(citation.url);
                const hostname = url.hostname.replace(/^www\./, '');
                sourceCounts[hostname] = (sourceCounts[hostname] || 0) + 1;
              } catch (e) {
                // Invalid URL, skip
              }
            }
          });
        }
      });
      
      // Sort prompts by score (best first)
      promptScores.sort((a, b) => b.score - a.score);
      const bestPrompts = promptScores.slice(0, 5).map(p => ({
        question: p.question,
        mentions: p.mentions,
        citations: p.citations
      }));
      
      // Prepare summary prompt for GPT
      const summaryPrompt = `Du bist ein Experte für Markenanalyse. Analysiere die folgenden Fragen und Antworten und erstelle ein präzises Fazit.

Marke: ${brandName}
Website: ${websiteUrl}

Fragen und Antworten:
${questionsAndAnswers.map((qa: any, idx: number) => 
  `${idx + 1}. Frage: ${qa.question}\n   Antwort: ${qa.answer.substring(0, 500)}${qa.answer.length > 500 ? '...' : ''}\n   Erwähnungen: ${(qa.brandMentions?.exact || 0) + (qa.brandMentions?.fuzzy || 0)}, Zitierungen: ${qa.citations?.length || 0}`
).join('\n\n')}

Bitte erstelle ein strukturiertes Fazit im JSON-Format mit folgenden Feldern:
{
  "totalMentions": ${totalMentions},
  "totalCitations": ${totalCitations},
  "bestPrompts": [${bestPrompts.map(p => JSON.stringify({ question: p.question, mentions: p.mentions, citations: p.citations })).join(', ')}],
  "otherSources": ${JSON.stringify(sourceCounts)},
  "summary": "Eine kurze Zusammenfassung der wichtigsten Erkenntnisse"
}

Antworte NUR mit dem JSON-Objekt, ohne zusätzlichen Text.`;

      // Call GPT to generate summary
      const { LLMExecutor } = await import("../llm_execution/index.js");
      const { getConfig } = await import("../config.js");
      const config = getConfig(env);
      const executor = new LLMExecutor(config);
      
      // Create a prompt object for GPT
      const summaryPromptObj = {
        id: `summary-${runId}`,
        question: summaryPrompt,
        category: "summary",
        intent: "high" as const
      };
      
      const gptResponse = await executor.executePrompt(summaryPromptObj);
      const responseText = gptResponse.outputText || '';
      
      // Try to parse JSON from response
      let summaryData: any = {
        totalMentions: totalMentions,
        totalCitations: totalCitations,
        bestPrompts: bestPrompts,
        otherSources: sourceCounts,
        summary: responseText
      };
      
      // Try to extract JSON from GPT response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          summaryData = { ...summaryData, ...parsed };
        }
      } catch (e) {
        // Use default summary data if JSON parsing fails
        console.warn('Could not parse JSON from GPT response, using calculated values');
      }
      
      return new Response(JSON.stringify(summaryData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error('Error in handleGenerateSummary:', error);
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
  
  private extractBrandName(websiteUrl: string): string {
    try {
      const url = new URL(websiteUrl);
      const hostname = url.hostname.replace('www.', '');
      const parts = hostname.split('.');
      // Return the main domain name (e.g., "example" from "example.com")
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch {
      return 'Company';
    }
  }

  private async handleChat(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      console.log("💬 Chat endpoint called");
      console.log("💬 Request method:", request.method);
      console.log("💬 Request URL:", request.url);
      
      let body;
      try {
        body = await request.json() as { question: string };
      } catch (jsonError) {
        console.error("❌ Failed to parse request JSON:", jsonError);
        return new Response(
          JSON.stringify({ error: "Invalid JSON in request body" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const { question } = body;

      console.log("💬 Chat request received:", question);

      if (!question || question.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Question is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Check if API key is available
      if (!env.OPENAI_API_KEY) {
        console.error("❌ OPENAI_API_KEY not found in environment");
        return new Response(
          JSON.stringify({ error: "OpenAI API key not configured" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("📦 Importing modules...");
      const { LLMExecutor } = await import("../llm_execution/index.js");
      const { getConfig } = await import("../config.js");
      
      console.log("⚙️ Getting config...");
      const config = getConfig(env);
      console.log("✅ Config received, model:", config.openai.model);
      
      console.log("🔧 Creating LLMExecutor...");
      const executor = new LLMExecutor(config);
      
      // Create a temporary prompt object for the chat question
      const chatPrompt = {
        id: `chat_${Date.now()}`,
        categoryId: "chat",
        question: question.trim(),
        language: "de",
        country: "CH",
        intent: "high" as const,
        createdAt: new Date().toISOString(),
      };
      
      console.log("🤖 Executing chat prompt with GPT-5 Web Search...");
      console.log("📋 Prompt:", JSON.stringify(chatPrompt, null, 2));
      
      // Execute with GPT-5 Web Search
      const response = await executor.executePrompt(chatPrompt);
      
      console.log("✅ Chat response received:");
      console.log("  - OutputText length:", response.outputText?.length || 0);
      console.log("  - Citations count:", response.citations?.length || 0);
      console.log("  - OutputText preview:", response.outputText?.substring(0, 200) || "EMPTY");
      
      if (!response.outputText || response.outputText.trim().length === 0) {
        console.warn("⚠️ Empty response from LLMExecutor!");
        return new Response(
          JSON.stringify({
            error: "Keine Antwort von GPT-5 erhalten. Bitte versuche es erneut.",
            answer: "",
            citations: response.citations || [],
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          answer: response.outputText,
          outputText: response.outputText, // Also include as outputText for compatibility
          citations: response.citations || [],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("❌ Error in chat handler:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : "Error";
      
      console.error("❌ Error name:", errorName);
      console.error("❌ Error message:", errorMessage);
      if (errorStack) {
        console.error("❌ Error stack:", errorStack);
      }
      
      // Log full error object for debugging
      console.error("❌ Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      // Return user-friendly error message with details
      return new Response(
        JSON.stringify({
          error: errorMessage,
          errorName: errorName,
          details: errorStack ? errorStack.split('\n').slice(0, 5).join('\n') : undefined, // First 5 lines of stack
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  private async handleAnalyze(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    let websiteUrl = body.websiteUrl?.trim();
    // Auto-add https:// if missing
    if (websiteUrl) {
      const urlPattern4 = new RegExp('^https?:\\/\\/', 'i');
      if (!urlPattern4.test(websiteUrl)) {
      websiteUrl = 'https://' + websiteUrl;
      }
    }
    const userInput: UserInput = {
      websiteUrl: websiteUrl,
      country: body.country,
      region: body.region,
      language: body.language,
    };

    // Validate input
    if (!userInput.websiteUrl || !userInput.country || !userInput.language) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const runId = await this.engine.runAnalysis(userInput, env);

    return new Response(
      JSON.stringify({
        runId,
        status: "started",
        message: "Analysis started successfully",
      }),
      {
        status: 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  private async handleGetAllAnalyses(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);
      const analyses = await db.getAllAnalysisRuns(100);
      
      // Ensure we always return an array, even if empty or if there's an error
      const analysesArray = Array.isArray(analyses) ? analyses : [];
      
      return new Response(JSON.stringify(analysesArray), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting all analyses:", error);
      // Return empty array instead of error object to prevent frontend errors
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  private async handleGetAnalysis(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const result = await this.engine.getAnalysisResult(runId, env);

    if (!result) {
      return new Response(JSON.stringify({ error: "Analysis not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleGetStatus(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const { Database } = await import("../persistence/index.js");
    const db = new Database(env.geo_db as any);
    const status = await db.getAnalysisStatus(runId);

    if (!status) {
      return new Response(JSON.stringify({ error: "Analysis not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(status), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleGetMetrics(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const result = await this.engine.getAnalysisResult(runId, env);

    if (!result) {
      return new Response(JSON.stringify({ error: "Analysis not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        categoryMetrics: result.categoryMetrics,
        competitiveAnalysis: result.competitiveAnalysis,
        timeSeries: result.timeSeries,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  private async handleStep1(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const body = await request.json();
      let websiteUrl = body.websiteUrl?.trim();
      // Auto-add https:// if missing
      if (websiteUrl) {
        const urlPattern5 = new RegExp('^https?:\\/\\/', 'i');
        if (!urlPattern5.test(websiteUrl)) {
        websiteUrl = 'https://' + websiteUrl;
        }
      }
      const userInput: UserInput = {
        websiteUrl: websiteUrl,
        country: body.country,
        region: body.region,
        language: body.language,
      };

      const result = await this.workflowEngine.step1FindSitemap(userInput, env);

      return new Response(JSON.stringify({
        runId: result.runId,
        urls: result.urls,
        foundSitemap: result.foundSitemap,
        message: result.foundSitemap 
          ? `Sitemap gefunden: ${result.urls.length} URLs` 
          : `Keine Sitemap gefunden. ${result.urls.length} URLs von Startseite extrahiert`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in handleStep1:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to start analysis",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  private async handleStep2(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { runId, urls } = body;

    const result = await this.workflowEngine.step2FetchContent(
      runId,
      urls,
      body.language,
      env
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleStep3(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { runId, content, language } = body;

    const categories = await this.workflowEngine.step3GenerateCategories(
      runId,
      content,
      language,
      env
    );

    return new Response(JSON.stringify({ categories }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleSaveCategories(
    runId: string,
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { selectedCategoryIds, customCategories } = body;

    await this.workflowEngine.saveSelectedCategories(
      runId,
      selectedCategoryIds || [],
      customCategories || [],
      env
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleStep4(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { runId, categories, userInput, questionsPerCategory, companyId } = body;

    const prompts = await this.workflowEngine.step4GeneratePrompts(
      runId,
      categories,
      userInput,
      body.content || "",
      env,
      questionsPerCategory || 3,
      companyId // Pass companyId to save prompts to company_prompts
    );

    return new Response(JSON.stringify({ prompts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleSavePrompts(
    runId: string,
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { prompts } = body;

    await this.workflowEngine.saveUserPrompts(runId, prompts, env);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleStep5(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { runId, prompts } = body;

    const result = await this.workflowEngine.step5ExecutePrompts(
      runId,
      prompts,
      env
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Execute scheduled run: Load saved prompts from company_prompts and execute them
  private async handleExecuteScheduledRun(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const body = await request.json();
      const { companyId, scheduleId } = body;

      if (!companyId) {
        return new Response(
          JSON.stringify({ error: "companyId is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);

      // Get company info
      const company = await db.getCompany(companyId);
      if (!company) {
        return new Response(
          JSON.stringify({ error: "Company not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get saved prompts for this company
      const savedPrompts = await db.getCompanyPrompts(companyId, true);
      if (savedPrompts.length === 0) {
        return new Response(
          JSON.stringify({ error: "No active prompts found for this company" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Create a new analysis run
      const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await db.saveAnalysisRun(runId, {
        websiteUrl: company.websiteUrl,
        country: company.country,
        region: company.region,
        language: company.language,
      }, "running");

      // Update run with company_id (using Database method if available, otherwise direct access)
      // Note: This requires a method in Database class or direct D1 access
      const dbDirect = env.geo_db as any;
      await dbDirect
        .prepare("UPDATE analysis_runs SET company_id = ? WHERE id = ?")
        .bind(companyId, runId)
        .run();

      // Convert CompanyPrompt to Prompt format
      const prompts: Prompt[] = savedPrompts.map((cp) => ({
        id: cp.id,
        categoryId: cp.categoryId || `cat_${runId}_unknown`,
        question: cp.question,
        language: cp.language,
        country: cp.country,
        region: cp.region,
        intent: "high",
        createdAt: cp.createdAt,
      }));

      // Execute all prompts with GPT-5 Web Search
      const { LLMExecutor } = await import("../llm_execution/index.js");
      const { getConfig } = await import("../config.js");
      const config = getConfig(env);
      const executor = new LLMExecutor(config);

      // Ensure all prompts are saved to the prompts table for this run
      // Use INSERT OR REPLACE to avoid duplicate key errors if prompts already exist
      try {
        await db.savePrompts(runId, prompts);
      } catch (error: any) {
        // If it's a unique constraint error, some prompts may already exist - that's okay
        if (!error.message?.includes("UNIQUE constraint")) {
          console.error("Error saving prompts:", error);
          throw error;
        }
        console.warn("Some prompts may already exist, continuing...");
      }
      
      const responses: any[] = [];
      for (const prompt of prompts) {
        try {
          // Execute prompt with GPT-5 Web Search
          const response = await executor.executePrompt(prompt);
          responses.push(response);
          
          // Save response immediately (with timestamp)
          await db.saveLLMResponses([response]);
          
          // Perform analysis (with structured answers)
          const { AnalysisEngine } = await import("../analysis/index.js");
          const brandName = this.extractBrandName(company.websiteUrl);
          const analysisEngine = new AnalysisEngine(brandName, 0.7);
          const analysis = analysisEngine.analyzeResponses([prompt], [response])[0];
          
          // Save analysis (includes structured answers to the three key questions)
          await db.savePromptAnalyses([analysis]);
          
          console.log(`✅ Saved question, answer, and analysis for prompt ${prompt.id} at ${new Date().toISOString()}`);
        } catch (error) {
          console.error(`Error executing prompt ${prompt.id}:`, error);
        }
      }

      // Update schedule if scheduleId provided
      if (scheduleId) {
        const now = new Date();
        let nextRunAt: Date;
        const schedules = await db.getScheduledRuns(companyId, true);
        const schedule = schedules.find(s => s.id === scheduleId);
        
        if (schedule) {
          if (schedule.scheduleType === "daily") {
            nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          } else if (schedule.scheduleType === "weekly") {
            nextRunAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          } else {
            nextRunAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          }
          
          await db.updateScheduledRun(scheduleId, {
            lastRunAt: now.toISOString(),
            nextRunAt: nextRunAt.toISOString(),
          });
        }
      }

      // Mark run as completed
      await db.updateAnalysisStatus(runId, "completed", {
        step: "completed",
        progress: 100,
        message: `Executed ${responses.length} saved prompts`,
      });

      return new Response(
        JSON.stringify({
          success: true,
          runId,
          executed: responses.length,
          total: prompts.length,
          message: `Successfully executed ${responses.length} of ${prompts.length} prompts`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in handleExecuteScheduledRun:", error);
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

  // Get detailed analysis runs for a company (for historical comparison)
  private async handleGetCompanyAnalysisRunsDetailed(
    companyId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);
      
      // Get all run IDs for this company
      const runs = await db.getCompanyAnalysisRuns(companyId, 100);
      
      // For each run, get full analysis data
      const detailedRuns = await Promise.all(
        runs.map(async (run) => {
          const runId = run.id;
          
          // Get prompts for this run
          const prompts = await db.db
            .prepare("SELECT * FROM prompts WHERE analysis_run_id = ? ORDER BY created_at ASC")
            .bind(runId)
            .all<{
              id: string;
              question: string;
              category_id: string;
              language: string;
              country: string | null;
              region: string | null;
              created_at: string;
            }>();
          
          // Get responses and analyses for each prompt
          const questionsWithAnswers = await Promise.all(
            (prompts.results || []).map(async (prompt) => {
              // Get LLM response
              const response = await db.db
                .prepare("SELECT * FROM llm_responses WHERE prompt_id = ? ORDER BY timestamp DESC LIMIT 1")
                .bind(prompt.id)
                .first<{
                  id: string;
                  output_text: string;
                  model: string;
                  timestamp: string;
                }>();
              
              // Get citations
              const citations = response
                ? await db.db
                    .prepare("SELECT * FROM citations WHERE llm_response_id = ?")
                    .bind(response.id)
                    .all<{
                      id: string;
                      url: string;
                      title: string | null;
                      snippet: string | null;
                    }>()
                : { results: [] };
              
              // Get analysis
              const analysis = await db.db
                .prepare("SELECT * FROM prompt_analyses WHERE prompt_id = ? ORDER BY timestamp DESC LIMIT 1")
                .bind(prompt.id)
                .first<{
                  id: string;
                  brand_mentions_exact: number;
                  brand_mentions_fuzzy: number;
                  brand_mentions_contexts: string;
                  citation_count: number;
                  citation_urls: string;
                  sentiment_tone: string;
                  sentiment_confidence: number;
                  timestamp: string;
                }>();
              
              // Get competitor mentions
              const competitors = analysis
                ? await db.db
                    .prepare("SELECT * FROM competitor_mentions WHERE prompt_analysis_id = ?")
                    .bind(analysis.id)
                    .all<{
                      id: string;
                      competitor_name: string;
                      mention_count: number;
                      contexts: string;
                      citation_urls: string;
                    }>()
                : { results: [] };
              
              return {
                question: prompt.question,
                questionId: prompt.id,
                timestamp: prompt.created_at,
                answer: response?.output_text || null,
                answerTimestamp: response?.timestamp || null,
                citations: (citations.results || []).map(c => ({
                  url: c.url,
                  title: c.title,
                  snippet: c.snippet,
                })),
                analysis: analysis ? {
                  // Structured answers to the three key questions:
                  // 1. Bin ich erwähnt? Wenn ja, wie viel?
                  isMentioned: (analysis.brand_mentions_exact + analysis.brand_mentions_fuzzy) > 0,
                  mentionCount: analysis.brand_mentions_exact + analysis.brand_mentions_fuzzy,
                  exactMentions: analysis.brand_mentions_exact,
                  fuzzyMentions: analysis.brand_mentions_fuzzy,
                  
                  // 2. Werde ich zitiert? Wenn ja, wo und was?
                  isCited: analysis.citation_count > 0,
                  citationCount: analysis.citation_count,
                  citationUrls: JSON.parse(analysis.citation_urls || "[]"),
                  
                  // 3. Welche anderen Unternehmen werden genannt und wo?
                  competitors: (competitors.results || []).map(c => ({
                    name: c.competitor_name,
                    count: c.mention_count,
                    locations: JSON.parse(c.citation_urls || "[]"),
                  })),
                  
                  sentiment: {
                    tone: analysis.sentiment_tone,
                    confidence: analysis.sentiment_confidence,
                  },
                  timestamp: analysis.timestamp,
                } : null,
              };
            })
          );
          
          return {
            runId: run.id,
            createdAt: run.createdAt,
            updatedAt: run.updatedAt,
            status: run.status,
            questionsWithAnswers,
          };
        })
      );
      
      return new Response(JSON.stringify(detailedRuns), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting detailed analysis runs:", error);
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

  // Setup database - Run all migrations
  private async handleSetupDatabase(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const db = env.geo_db as any;
      const results: string[] = [];

      // Migration 1: Initial schema
      const migration1 = `
-- Initial schema for GEO platform

-- User inputs and analysis runs
CREATE TABLE IF NOT EXISTS analysis_runs (
  id TEXT PRIMARY KEY,
  website_url TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  language TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence REAL NOT NULL,
  source_pages TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
);

-- Prompts
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  question TEXT NOT NULL,
  language TEXT NOT NULL,
  country TEXT,
  region TEXT,
  intent TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- LLM responses
CREATE TABLE IF NOT EXISTS llm_responses (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  output_text TEXT NOT NULL,
  model TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id)
);

-- Citations
CREATE TABLE IF NOT EXISTS citations (
  id TEXT PRIMARY KEY,
  llm_response_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  snippet TEXT,
  FOREIGN KEY (llm_response_id) REFERENCES llm_responses(id)
);

-- Prompt analyses
CREATE TABLE IF NOT EXISTS prompt_analyses (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  brand_mentions_exact INTEGER NOT NULL DEFAULT 0,
  brand_mentions_fuzzy INTEGER NOT NULL DEFAULT 0,
  brand_mentions_contexts TEXT NOT NULL,
  citation_count INTEGER NOT NULL DEFAULT 0,
  citation_urls TEXT NOT NULL,
  sentiment_tone TEXT NOT NULL,
  sentiment_confidence REAL NOT NULL,
  sentiment_keywords TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id)
);

-- Competitor mentions
CREATE TABLE IF NOT EXISTS competitor_mentions (
  id TEXT PRIMARY KEY,
  prompt_analysis_id TEXT NOT NULL,
  competitor_name TEXT NOT NULL,
  mention_count INTEGER NOT NULL,
  contexts TEXT NOT NULL,
  citation_urls TEXT NOT NULL,
  FOREIGN KEY (prompt_analysis_id) REFERENCES prompt_analyses(id)
);

-- Category metrics
CREATE TABLE IF NOT EXISTS category_metrics (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  visibility_score REAL NOT NULL,
  citation_rate REAL NOT NULL,
  brand_mention_rate REAL NOT NULL,
  competitor_mention_rate REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Competitive analysis
CREATE TABLE IF NOT EXISTS competitive_analyses (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  brand_share REAL NOT NULL,
  competitor_shares TEXT NOT NULL,
  white_space_topics TEXT NOT NULL,
  dominated_prompts TEXT NOT NULL,
  missing_brand_prompts TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
);

-- Time series data
CREATE TABLE IF NOT EXISTS time_series (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  visibility_score REAL NOT NULL,
  citation_count INTEGER NOT NULL,
  brand_mention_count INTEGER NOT NULL,
  competitor_mention_count INTEGER NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analysis_runs_website ON analysis_runs(website_url);
CREATE INDEX IF NOT EXISTS idx_categories_run ON categories(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_prompts_run ON prompts(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_llm_responses_prompt ON llm_responses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_citations_response ON citations(llm_response_id);
CREATE INDEX IF NOT EXISTS idx_prompt_analyses_prompt ON prompt_analyses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_time_series_run ON time_series(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_time_series_timestamp ON time_series(timestamp);
`;

      await db.exec(migration1);
      results.push("Migration 1: Initial schema applied");

      // Migration 2: Add status tracking (with error handling for existing columns)
      try {
        await db.exec(`ALTER TABLE analysis_runs ADD COLUMN status TEXT DEFAULT 'pending';`);
        results.push("Migration 2: Added status column");
      } catch (e: any) {
        if (!e.message?.includes("duplicate column")) {
          throw e;
        }
        results.push("Migration 2: status column already exists");
      }

      try {
        await db.exec(`ALTER TABLE analysis_runs ADD COLUMN progress TEXT;`);
        results.push("Migration 2: Added progress column");
      } catch (e: any) {
        if (!e.message?.includes("duplicate column")) {
          throw e;
        }
        results.push("Migration 2: progress column already exists");
      }

      try {
        await db.exec(`ALTER TABLE analysis_runs ADD COLUMN error_message TEXT;`);
        results.push("Migration 2: Added error_message column");
      } catch (e: any) {
        if (!e.message?.includes("duplicate column")) {
          throw e;
        }
        results.push("Migration 2: error_message column already exists");
      }

      // Migration 3: Interactive workflow
      try {
        await db.exec(`ALTER TABLE analysis_runs ADD COLUMN step TEXT DEFAULT 'sitemap';`);
        results.push("Migration 3: Added step column");
      } catch (e: any) {
        if (!e.message?.includes("duplicate column")) {
          throw e;
        }
        results.push("Migration 3: step column already exists");
      }

      try {
        await db.exec(`ALTER TABLE analysis_runs ADD COLUMN sitemap_urls TEXT;`);
        results.push("Migration 3: Added sitemap_urls column");
      } catch (e: any) {
        if (!e.message?.includes("duplicate column")) {
          throw e;
        }
        results.push("Migration 3: sitemap_urls column already exists");
      }

      try {
        await db.exec(`ALTER TABLE analysis_runs ADD COLUMN selected_categories TEXT;`);
        results.push("Migration 3: Added selected_categories column");
      } catch (e: any) {
        if (!e.message?.includes("duplicate column")) {
          throw e;
        }
        results.push("Migration 3: selected_categories column already exists");
      }

      try {
        await db.exec(`ALTER TABLE analysis_runs ADD COLUMN custom_categories TEXT;`);
        results.push("Migration 3: Added custom_categories column");
      } catch (e: any) {
        if (!e.message?.includes("duplicate column")) {
          throw e;
        }
        results.push("Migration 3: custom_categories column already exists");
      }

      try {
        await db.exec(`ALTER TABLE analysis_runs ADD COLUMN selected_prompts TEXT;`);
        results.push("Migration 3: Added selected_prompts column");
      } catch (e: any) {
        if (!e.message?.includes("duplicate column")) {
          throw e;
        }
        results.push("Migration 3: selected_prompts column already exists");
      }

      try {
        await db.exec(`ALTER TABLE analysis_runs ADD COLUMN prompts_generated INTEGER DEFAULT 0;`);
        results.push("Migration 3: Added prompts_generated column");
      } catch (e: any) {
        if (!e.message?.includes("duplicate column")) {
          throw e;
        }
        results.push("Migration 3: prompts_generated column already exists");
      }

      await db.exec(`
        CREATE TABLE IF NOT EXISTS user_prompts (
          id TEXT PRIMARY KEY,
          analysis_run_id TEXT NOT NULL,
          question TEXT NOT NULL,
          category_id TEXT,
          is_custom BOOLEAN DEFAULT 0,
          is_selected BOOLEAN DEFAULT 1,
          created_at TEXT NOT NULL,
          FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
        );
      `);
      results.push("Migration 3: Created user_prompts table");

      // Migration 4: Companies
      await db.exec(`
        CREATE TABLE IF NOT EXISTS companies (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          website_url TEXT NOT NULL,
          country TEXT NOT NULL,
          language TEXT NOT NULL,
          region TEXT,
          description TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      results.push("Migration 4: Created companies table");

      try {
        await db.exec(`ALTER TABLE analysis_runs ADD COLUMN company_id TEXT;`);
        results.push("Migration 4: Added company_id column");
      } catch (e: any) {
        if (!e.message?.includes("duplicate column")) {
          throw e;
        }
        results.push("Migration 4: company_id column already exists");
      }

      await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_analysis_runs_company ON analysis_runs(company_id);
        CREATE TABLE IF NOT EXISTS company_prompts (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          question TEXT NOT NULL,
          category_id TEXT,
          category_name TEXT,
          language TEXT NOT NULL,
          country TEXT,
          region TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (company_id) REFERENCES companies(id)
        );
        CREATE TABLE IF NOT EXISTS scheduled_runs (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          schedule_type TEXT NOT NULL,
          next_run_at TEXT NOT NULL,
          last_run_at TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (company_id) REFERENCES companies(id)
        );
        CREATE INDEX IF NOT EXISTS idx_companies_website ON companies(website_url);
        CREATE INDEX IF NOT EXISTS idx_company_prompts_company ON company_prompts(company_id);
        CREATE INDEX IF NOT EXISTS idx_scheduled_runs_company ON scheduled_runs(company_id);
        CREATE INDEX IF NOT EXISTS idx_scheduled_runs_next_run ON scheduled_runs(next_run_at);
      `);
      results.push("Migration 4: Created company tables and indexes");

      return new Response(
        JSON.stringify({
          success: true,
          message: "Database setup completed successfully",
          results,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error setting up database:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          details: error instanceof Error ? error.stack : undefined,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // Get detailed insights for an analysis
  private async handleGetAnalysisInsights(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);
      
      // Get analysis run info
      const run = await db.db
        .prepare("SELECT * FROM analysis_runs WHERE id = ?")
        .bind(runId)
        .first<{
          id: string;
          website_url: string;
          country: string;
          language: string;
          region: string | null;
          created_at: string;
        }>();
      
      if (!run) {
        return new Response(JSON.stringify({ error: "Analysis not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Extract brand name from website URL
      const brandName = this.extractBrandName(run.website_url);
      
      // Get all prompts for this run
      const prompts = await db.db
        .prepare("SELECT * FROM prompts WHERE analysis_run_id = ? ORDER BY created_at ASC")
        .bind(runId)
        .all<{
          id: string;
          question: string;
          category_id: string;
          created_at: string;
        }>();
      
      if (!prompts.results || prompts.results.length === 0) {
        return new Response(JSON.stringify({ 
          error: "No prompts found for this analysis",
          summary: {
            totalBrandMentions: 0,
            totalBrandCitations: 0,
            promptsWithMentions: 0,
            totalPrompts: 0,
          },
          promptsWithMentions: [],
          allCompetitors: [],
          detailedData: [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Get all responses and analyses
      const insightsData = await Promise.all(
        (prompts.results || []).map(async (prompt) => {
          // Get LLM response
          const response = await db.db
            .prepare("SELECT * FROM llm_responses WHERE prompt_id = ? ORDER BY timestamp DESC LIMIT 1")
            .bind(prompt.id)
            .first<{
              id: string;
              output_text: string;
              timestamp: string;
            }>();
          
          // Get citations
          const citations = response
            ? await db.db
                .prepare("SELECT * FROM citations WHERE llm_response_id = ?")
                .bind(response.id)
                .all<{
                  id: string;
                  url: string;
                  title: string | null;
                  snippet: string | null;
                }>()
            : { results: [] };
          
          // Get analysis
          const analysis = await db.db
            .prepare("SELECT * FROM prompt_analyses WHERE prompt_id = ? ORDER BY timestamp DESC LIMIT 1")
            .bind(prompt.id)
            .first<{
              id: string;
              brand_mentions_exact: number;
              brand_mentions_fuzzy: number;
              brand_mentions_contexts: string;
              citation_count: number;
              citation_urls: string;
              timestamp: string;
            }>();
          
          // Get competitor mentions
          let competitors: { results: Array<{
            id: string;
            competitor_name: string;
            mention_count: number;
            citation_urls: string;
          }> } = { results: [] };
          try {
            if (analysis) {
              const competitorsResult = await db.db
                .prepare("SELECT * FROM competitor_mentions WHERE prompt_analysis_id = ?")
                .bind(analysis.id)
                .all<{
                  id: string;
                  competitor_name: string;
                  mention_count: number;
                  citation_urls: string;
                }>();
              competitors = {
                results: competitorsResult.results || []
              };
            }
          } catch (e) {
            console.warn('Error fetching competitors for prompt', prompt.id, ':', e);
            competitors = { results: [] };
          }
          
          // Check which citations mention the brand
          const brandCitations = (citations.results || []).filter(citation => {
            try {
            const text = `${citation.title || ""} ${citation.snippet || ""}`.toLowerCase();
            return text.includes(brandName.toLowerCase());
            } catch (e) {
              console.warn('Error checking brand citation:', e);
              return false;
            }
          });
          
          // Safely parse JSON fields
          let contexts = [];
          try {
            if (analysis?.brand_mentions_contexts) {
              contexts = JSON.parse(analysis.brand_mentions_contexts);
            }
          } catch (e) {
            console.warn('Error parsing brand_mentions_contexts:', e);
            contexts = [];
          }
          
          return {
            promptId: prompt.id,
            question: prompt.question,
            answer: response?.output_text || null,
            timestamp: response?.timestamp || null,
            // Metriken
            brandMentions: {
              total: (analysis?.brand_mentions_exact || 0) + (analysis?.brand_mentions_fuzzy || 0),
              exact: analysis?.brand_mentions_exact || 0,
              fuzzy: analysis?.brand_mentions_fuzzy || 0,
              contexts: contexts,
            },
            citations: {
              total: analysis?.citation_count || 0,
              brandCitations: brandCitations.length, // Wie oft zitiert von meiner Seite
              allCitations: (citations.results || []).map(c => ({
                url: c.url,
                title: c.title,
                snippet: c.snippet,
                mentionsBrand: brandCitations.some(bc => bc.id === c.id),
              })),
            },
            competitors: (competitors.results || []).map(c => {
              let citationUrls = [];
              try {
                citationUrls = JSON.parse(c.citation_urls || "[]");
              } catch (e) {
                console.warn('Error parsing citation_urls for competitor:', e);
                citationUrls = [];
              }
              return {
              name: c.competitor_name,
              count: c.mention_count,
                citationUrls: citationUrls,
              };
            }),
          };
        })
      );
      
      // Calculate summary metrics (with safety checks)
      const totalBrandMentions = insightsData.reduce((sum, d) => sum + (d?.brandMentions?.total || 0), 0);
      const totalBrandCitations = insightsData.reduce((sum, d) => sum + (d?.citations?.brandCitations || 0), 0);
      const promptsWithMentions = insightsData.filter(d => (d?.brandMentions?.total || 0) > 0);
      const allCompetitors = new Map<string, { count: number; prompts: string[] }>();
      
      insightsData.forEach((data) => {
        if (data?.competitors && Array.isArray(data.competitors)) {
        data.competitors.forEach(comp => {
            if (comp?.name) {
          if (!allCompetitors.has(comp.name)) {
            allCompetitors.set(comp.name, { count: 0, prompts: [] });
          }
          const entry = allCompetitors.get(comp.name)!;
              entry.count += comp.count || 0;
              if (data.question) {
          entry.prompts.push(data.question);
              }
            }
        });
        }
      });
      
      const insights = {
        runId,
        websiteUrl: run.website_url,
        brandName,
        summary: {
          totalBrandMentions: totalBrandMentions || 0,
          totalBrandCitations: totalBrandCitations || 0,
          promptsWithMentions: promptsWithMentions.length || 0,
          totalPrompts: insightsData.length || 0,
        },
        promptsWithMentions: (promptsWithMentions || []).map(d => ({
          question: d?.question || '',
          mentionCount: d?.brandMentions?.total || 0,
          citationCount: d?.citations?.brandCitations || 0,
        })),
        allCompetitors: Array.from(allCompetitors.entries()).map(([name, data]) => ({
          name: name || '',
          totalMentions: data?.count || 0,
          mentionedInPrompts: data?.prompts || [],
        })),
        detailedData: insightsData || [],
      };
      
      return new Response(JSON.stringify(insights), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting analysis insights:", error);
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

  // Delete an analysis
  private async handleDeleteAnalysis(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);

      // Delete all related data
      await db.db.prepare("DELETE FROM citations WHERE llm_response_id IN (SELECT id FROM llm_responses WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?))").bind(runId).run();
      await db.db.prepare("DELETE FROM competitor_mentions WHERE prompt_analysis_id IN (SELECT id FROM prompt_analyses WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?))").bind(runId).run();
      await db.db.prepare("DELETE FROM prompt_analyses WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?)").bind(runId).run();
      await db.db.prepare("DELETE FROM llm_responses WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?)").bind(runId).run();
      await db.db.prepare("DELETE FROM prompts WHERE analysis_run_id = ?").bind(runId).run();
      await db.db.prepare("DELETE FROM categories WHERE analysis_run_id = ?").bind(runId).run();
      await db.db.prepare("DELETE FROM analysis_runs WHERE id = ?").bind(runId).run();

      return new Response(JSON.stringify({ success: true, message: "Analysis deleted successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error deleting analysis:", error);
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

  // Pause an analysis
  private async handlePauseAnalysis(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);

      // Update status to paused
      await db.db
        .prepare("UPDATE analysis_runs SET status = ?, updated_at = ? WHERE id = ?")
        .bind("paused", new Date().toISOString(), runId)
        .run();

      return new Response(JSON.stringify({ success: true, message: "Analysis paused successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error pausing analysis:", error);
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

  // AI Readiness: Start analysis
  private async handleAIReadinessAnalyze(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const body = await request.json() as { websiteUrl: string };
      let websiteUrl = body.websiteUrl?.trim();
      
      if (!websiteUrl) {
        return new Response(
          JSON.stringify({ error: "Website URL is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Auto-add https:// if missing
      const urlPattern3 = new RegExp('^https?:\\/\\/', 'i');
      if (!urlPattern3.test(websiteUrl)) {
        websiteUrl = 'https://' + websiteUrl;
      }
      
      const runId = `ai_readiness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create table and insert initial record immediately (before async processing)
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);
      
      try {
        // Create table if not exists
        try {
          await db.db.exec(
            'CREATE TABLE IF NOT EXISTS ai_readiness_runs (id TEXT PRIMARY KEY, website_url TEXT NOT NULL, status TEXT NOT NULL, robots_txt TEXT, sitemap_urls TEXT, total_urls INTEGER, recommendations TEXT, message TEXT, error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'
          );
        } catch (e: any) {
          // Ignore error if table already exists
          if (!e?.message?.includes('already exists') && !e?.message?.includes('duplicate')) {
            console.warn('Could not create ai_readiness_runs table (may already exist):', e);
          }
        }
        
        // Insert initial record immediately so status endpoint can find it
        await db.db
          .prepare(
            'INSERT INTO ai_readiness_runs (id, website_url, status, created_at, updated_at, message) VALUES (?, ?, ?, ?, ?, ?)'
          )
          .bind(runId, websiteUrl, 'processing', new Date().toISOString(), new Date().toISOString(), 'Starte Analyse...')
          .run();
      } catch (e: any) {
        console.error('Error creating initial AI Readiness record:', e);
        // Continue anyway - processAIReadiness will try to create it again
      }
      
      // Start async processing
      this.processAIReadiness(runId, websiteUrl, env).catch(err => {
        console.error('Error in AI Readiness processing:', err);
      });
      
      return new Response(
        JSON.stringify({
          runId,
          message: "AI Readiness Analyse gestartet",
          status: "processing",
          totalUrls: 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in handleAIReadinessAnalyze:", error);
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

  // AI Readiness: Get status
  private async handleAIReadinessStatus(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);
      
      // Create table if not exists (using try-catch to ignore if already exists)
      try {
        await db.db.exec(
          'CREATE TABLE IF NOT EXISTS ai_readiness_runs (id TEXT PRIMARY KEY, website_url TEXT NOT NULL, status TEXT NOT NULL, robots_txt TEXT, sitemap_urls TEXT, total_urls INTEGER, recommendations TEXT, message TEXT, error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'
        );
      } catch (e: any) {
        // Ignore error if table already exists
        if (!e?.message?.includes('already exists') && !e?.message?.includes('duplicate')) {
          console.warn('Could not create ai_readiness_runs table (may already exist):', e);
        }
      }
      
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
      
      if (!result) {
        return new Response(
          JSON.stringify({ error: "Run not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          runId: result.id,
          status: result.status,
          recommendations: result.recommendations,
          message: result.message,
          error: result.error,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in handleAIReadinessStatus:", error);
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

  // AI Readiness: Process analysis (async)
  private async processAIReadiness(
    runId: string,
    websiteUrl: string,
    env: Env
  ): Promise<void> {
    const { Database } = await import("../persistence/index.js");
    const db = new Database(env.geo_db as any);
    
    // Report structure
    interface PageData {
      url: string;
      title: string;
      content: string;
      responseTime: number;
      status: number;
      success: boolean;
    }
    
    const report = {
      websiteUrl,
      robotsTxt: { found: false, content: '', note: '' },
      sitemap: { found: false, urls: [] as string[], note: '' },
      homepage: { scraped: false, data: null as PageData | null },
      pages: [] as PageData[],
      summary: {
        totalPages: 0,
        successfulPages: 0,
        averageResponseTime: 0,
        fastestPage: '',
        slowestPage: ''
      }
    };
    
    const updateStatus = async (message: string) => {
      try {
        console.log(`[AI Readiness ${runId}] Status update: ${message}`);
        await db.db
          .prepare('UPDATE ai_readiness_runs SET message = ?, updated_at = ? WHERE id = ?')
          .bind(message, new Date().toISOString(), runId)
          .run();
      } catch (e: any) {
        console.error(`[AI Readiness ${runId}] Error updating status:`, e);
      }
    };
    
    console.log(`[AI Readiness ${runId}] processAIReadiness started for ${websiteUrl}`);
    
    try {
      // Create table if not exists
      try {
        await db.db.exec(
          'CREATE TABLE IF NOT EXISTS ai_readiness_runs (id TEXT PRIMARY KEY, website_url TEXT NOT NULL, status TEXT NOT NULL, robots_txt TEXT, sitemap_urls TEXT, total_urls INTEGER, recommendations TEXT, message TEXT, error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'
        );
      } catch (e: any) {
        if (!e?.message?.includes('already exists') && !e?.message?.includes('duplicate')) {
          console.warn('Could not create ai_readiness_runs table:', e);
        }
      }
      
      // Update initial record
      try {
        await db.db
          .prepare('INSERT OR IGNORE INTO ai_readiness_runs (id, website_url, status, created_at, updated_at, message) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(runId, websiteUrl, 'processing', new Date().toISOString(), new Date().toISOString(), 'Starte Analyse...')
          .run();
      } catch (e: any) {
        await db.db
          .prepare('UPDATE ai_readiness_runs SET message = ?, updated_at = ? WHERE id = ?')
          .bind('Starte Analyse...', new Date().toISOString(), runId)
          .run();
      }
      
      // Immediately update to first step to confirm function is running
      console.log(`[AI Readiness ${runId}] Updating status to Step 1...`);
      await updateStatus('Schritt 1/6: Prüfe robots.txt...');
      console.log(`[AI Readiness ${runId}] Status updated successfully`);
      
      // Helper function to measure response time
      const measureResponseTime = async (url: string): Promise<{ responseTime: number; response: Response; html: string }> => {
        const startTime = Date.now();
        try {
          const response = await fetch(url, {
            headers: { "User-Agent": "GEO-Platform/1.0" },
            signal: AbortSignal.timeout(15000) // 15 second timeout
          });
          const html = await response.text();
          const responseTime = Date.now() - startTime;
          return { responseTime, response, html };
        } catch (error: any) {
          const responseTime = Date.now() - startTime;
          // Return a failed response object
          return {
            responseTime,
            response: new Response(null, { status: 0, statusText: error.message || 'Request failed' }) as any,
            html: ''
          };
        }
      };
      
      // Helper function to scrape page
      const scrapePage = (html: string, url: string): { title: string; content: string } => {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : url;
        
        let textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (textContent.length > 10000) {
          textContent = textContent.substring(0, 10000) + '...';
        }
        
        return { title, content: textContent };
      };
      
      // STEP 1: Check robots.txt
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] STEP 1: Checking robots.txt`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      await updateStatus('Schritt 1/6: Prüfe robots.txt...');
      try {
        const robotsUrl = new URL('/robots.txt', websiteUrl).toString();
        console.log(`[AI Readiness ${runId}] → Fetching robots.txt from: ${robotsUrl}`);
        const startTime = Date.now();
        const { responseTime, response, html } = await measureResponseTime(robotsUrl);
        const totalTime = Date.now() - startTime;
        console.log(`[AI Readiness ${runId}] → Response Status: ${response.status}`);
        console.log(`[AI Readiness ${runId}] → Response Time: ${responseTime}ms`);
        console.log(`[AI Readiness ${runId}] → Content Length: ${html.length} bytes`);
        if (response.ok && response.status !== 0) {
          report.robotsTxt = { found: true, content: html, note: `Gefunden (${responseTime}ms)` };
          console.log(`[AI Readiness ${runId}] ✓ robots.txt gefunden (${responseTime}ms, ${html.length} bytes)`);
          await updateStatus(`✓ robots.txt gefunden (${responseTime}ms)`);
        } else {
          report.robotsTxt = { found: false, content: '', note: `Nicht gefunden (Status: ${response.status})` };
          console.log(`[AI Readiness ${runId}] ⚠ robots.txt nicht gefunden (Status: ${response.status})`);
          await updateStatus(`⚠ robots.txt nicht gefunden`);
        }
      } catch (e: any) {
        console.error(`[AI Readiness ${runId}] ❌ Error checking robots.txt:`, e.message || e);
        report.robotsTxt = { found: false, content: '', note: 'Nicht erreichbar' };
        await updateStatus(`⚠ robots.txt nicht erreichbar`);
      }
      
      // STEP 2: Check sitemap
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] STEP 2: Checking sitemap`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      await updateStatus('Schritt 2/6: Prüfe Sitemap...');
      try {
        const { SitemapParser } = await import("../ingestion/sitemap.js");
        const sitemapParser = new SitemapParser();
        console.log(`[AI Readiness ${runId}] → Parsing sitemap for: ${websiteUrl}`);
        const startTime = Date.now();
        const sitemapResult = await sitemapParser.findAndParseSitemap(websiteUrl);
        const parseTime = Date.now() - startTime;
        console.log(`[AI Readiness ${runId}] → Sitemap found: ${sitemapResult.foundSitemap}`);
        console.log(`[AI Readiness ${runId}] → URLs found: ${sitemapResult.urls.length}`);
        console.log(`[AI Readiness ${runId}] → Parse time: ${parseTime}ms`);
        if (sitemapResult.foundSitemap && sitemapResult.urls.length > 0) {
          report.sitemap = { found: true, urls: sitemapResult.urls, note: `${sitemapResult.urls.length} URLs gefunden` };
          console.log(`[AI Readiness ${runId}] ✓ Sitemap gefunden (${sitemapResult.urls.length} URLs in ${parseTime}ms)`);
          await updateStatus(`✓ Sitemap gefunden (${sitemapResult.urls.length} URLs)`);
        } else {
          report.sitemap = { found: false, urls: [], note: 'Nicht gefunden' };
          console.log(`[AI Readiness ${runId}] ⚠ Sitemap nicht gefunden`);
          await updateStatus(`⚠ Sitemap nicht gefunden`);
        }
      } catch (e: any) {
        console.error(`[AI Readiness ${runId}] ❌ Error checking sitemap:`, e.message || e);
        report.sitemap = { found: false, urls: [], note: 'Fehler beim Parsen' };
        await updateStatus(`⚠ Sitemap-Fehler`);
      }
      
      // STEP 3: Scrape homepage
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] STEP 3: Scraping homepage`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      await updateStatus('Schritt 3/6: Scrape Homepage...');
      try {
        console.log(`[AI Readiness ${runId}] → Fetching homepage: ${websiteUrl}`);
        const { responseTime, response, html } = await measureResponseTime(websiteUrl);
        console.log(`[AI Readiness ${runId}] → Response Status: ${response.status}`);
        console.log(`[AI Readiness ${runId}] → Response Time: ${responseTime}ms`);
        console.log(`[AI Readiness ${runId}] → HTML Length: ${html.length} bytes`);
        if (response.ok && response.status !== 0 && html) {
          const { title, content } = scrapePage(html, websiteUrl);
          console.log(`[AI Readiness ${runId}] → Title extracted: ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`);
          console.log(`[AI Readiness ${runId}] → Content extracted: ${content.length} characters`);
          report.homepage = {
            scraped: true,
            data: { url: websiteUrl, title, content, responseTime, status: response.status, success: true }
          };
          console.log(`[AI Readiness ${runId}] ✓ Homepage gescraped (${responseTime}ms, ${content.length} Zeichen)`);
          await updateStatus(`✓ Homepage gescraped (${responseTime}ms, ${content.length} Zeichen)`);
        } else {
          report.homepage = {
            scraped: false,
            data: { url: websiteUrl, title: '', content: '', responseTime, status: response.status || 0, success: false }
          };
          console.log(`[AI Readiness ${runId}] ⚠ Homepage-Fehler (Status: ${response.status || 0})`);
          await updateStatus(`⚠ Homepage-Fehler (Status: ${response.status || 0})`);
        }
      } catch (e: any) {
        console.error(`[AI Readiness ${runId}] ❌ Error scraping homepage:`, e.message || e);
        report.homepage = {
          scraped: false,
          data: { url: websiteUrl, title: '', content: '', responseTime: 0, status: 0, success: false }
        };
        await updateStatus(`⚠ Homepage-Fehler`);
      }
      
      // STEP 4: Scrape all sitemap links
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] STEP 4: Scraping pages`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      const urlsToScrape = report.sitemap.found ? report.sitemap.urls.slice(0, 50) : [websiteUrl];
      console.log(`[AI Readiness ${runId}] → Total pages to scrape: ${urlsToScrape.length}`);
      await updateStatus(`Schritt 4/6: Scrape ${urlsToScrape.length} Seiten...`);
      
      const startTime = Date.now();
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < urlsToScrape.length; i++) {
        const url = urlsToScrape[i];
        try {
          console.log(`[AI Readiness ${runId}] → [${i + 1}/${urlsToScrape.length}] Scraping: ${url}`);
          const { responseTime, response, html } = await measureResponseTime(url);
          if (response.ok && response.status !== 0 && html) {
            const { title, content } = scrapePage(html, url);
            report.pages.push({
              url,
              title,
              content,
              responseTime,
              status: response.status,
              success: true
            });
            successCount++;
            console.log(`[AI Readiness ${runId}]   ✓ Success (${responseTime}ms, ${content.length} chars)`);
          } else {
            report.pages.push({
              url,
              title: '',
              content: '',
              responseTime,
              status: response.status || 0,
              success: false
            });
            failCount++;
            console.log(`[AI Readiness ${runId}]   ✗ Failed (Status: ${response.status || 0})`);
          }
          
          if ((i + 1) % 5 === 0 || i === urlsToScrape.length - 1) {
            const elapsed = Date.now() - startTime;
            console.log(`[AI Readiness ${runId}] → Progress: ${i + 1}/${urlsToScrape.length} (${successCount} success, ${failCount} failed, ${elapsed}ms elapsed)`);
            await updateStatus(`Schritt 4/6: ${i + 1}/${urlsToScrape.length} Seiten gescraped...`);
          }
        } catch (e: any) {
          console.error(`[AI Readiness ${runId}]   ❌ Error scraping ${url}:`, e.message || e);
          report.pages.push({
            url,
            title: '',
            content: '',
            responseTime: 0,
            status: 0,
            success: false
          });
          failCount++;
        }
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`[AI Readiness ${runId}] ✓ Step 4 complete: ${report.pages.length} pages scraped (${successCount} success, ${failCount} failed, ${totalTime}ms total)`);
      
      // Calculate summary
      const successfulPages = report.pages.filter(p => p.success);
      const responseTimes = report.pages.filter(p => p.responseTime > 0).map(p => p.responseTime);
      const avgResponseTime = responseTimes.length > 0 
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;
      const fastestPage = responseTimes.length > 0 
        ? report.pages.find(p => p.responseTime === Math.min(...responseTimes))?.url || ''
        : '';
      const slowestPage = responseTimes.length > 0
        ? report.pages.find(p => p.responseTime === Math.max(...responseTimes))?.url || ''
        : '';
      
      report.summary = {
        totalPages: report.pages.length,
        successfulPages: successfulPages.length,
        averageResponseTime: avgResponseTime,
        fastestPage,
        slowestPage
      };
      
      // STEP 5: Analyze data
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] STEP 5: Analyzing data`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] → Total pages: ${report.pages.length}`);
      console.log(`[AI Readiness ${runId}] → Successful pages: ${successfulPages.length}`);
      console.log(`[AI Readiness ${runId}] → Average response time: ${avgResponseTime}ms`);
      console.log(`[AI Readiness ${runId}] → Fastest page: ${fastestPage}`);
      console.log(`[AI Readiness ${runId}] → Slowest page: ${slowestPage}`);
      await updateStatus(`Schritt 5/6: Analysiere Daten (${successfulPages.length}/${report.pages.length} erfolgreich, Ø ${avgResponseTime}ms)...`);
      
      // STEP 5: Build comprehensive report for GPT
      console.log(`[AI Readiness ${runId}] → Building GPT prompt...`);
      const promptStartTime = Date.now();
      const prompt = this.buildAIReadinessPromptFromReport(report);
      const promptTime = Date.now() - promptStartTime;
      console.log(`[AI Readiness ${runId}] → GPT prompt built (${prompt.length} characters, ${promptTime}ms)`);
      
      // STEP 6: Send to GPT
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] STEP 6: Sending to GPT`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      await updateStatus('Schritt 6/6: Generiere AI Readiness Analyse mit GPT...');
      console.log(`[AI Readiness ${runId}] → Sending request to OpenAI API...`);
      const gptStartTime = Date.now();
      const gptResponse = await this.callGPTForAIReadiness(prompt, env);
      const gptTime = Date.now() - gptStartTime;
      console.log(`[AI Readiness ${runId}] → GPT response received (${gptResponse.length} characters, ${gptTime}ms)`);
      
      // Save final results
      console.log(`[AI Readiness ${runId}] → Saving results to database...`);
      await db.db
        .prepare('UPDATE ai_readiness_runs SET status = ?, recommendations = ?, message = ?, robots_txt = ?, updated_at = ? WHERE id = ?')
        .bind(
          'completed',
          gptResponse,
          '✓ Analyse abgeschlossen',
          JSON.stringify(report),
          new Date().toISOString(),
          runId
        )
        .run();
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] ✓ ANALYSIS COMPLETE`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      
    } catch (error) {
      console.error(`[AI Readiness ${runId}] ========================================`);
      console.error(`[AI Readiness ${runId}] ❌ ERROR in processAIReadiness:`, error);
      console.error(`[AI Readiness ${runId}] ========================================`);
      await db.db
        .prepare(`
          UPDATE ai_readiness_runs 
          SET status = ?, error = ?, updated_at = ?
          WHERE id = ?
        `)
        .bind(
          'error',
          error instanceof Error ? error.message : 'Unknown error',
          new Date().toISOString()
        )
        .run();
    }
  }

  // Build prompt for AI Readiness analysis from comprehensive report
  private buildAIReadinessPromptFromReport(report: any): string {
    let prompt = `# AI READINESS ANALYSE\n\n`;
    prompt += `Analysiere die folgende Website auf AI-Readiness und bewerte, wie gut sie von KI-Systemen gelesen und verstanden werden kann.\n\n`;
    prompt += `## WEBSITE\n${report.websiteUrl}\n\n`;
    
    // Robots.txt
    prompt += `## ROBOTS.TXT\n`;
    if (report.robotsTxt.found) {
      prompt += `Status: ✓ Gefunden\n`;
      prompt += `Hinweis: ${report.robotsTxt.note}\n`;
      prompt += `Inhalt:\n\`\`\`\n${report.robotsTxt.content}\n\`\`\`\n\n`;
    } else {
      prompt += `Status: ✗ Nicht gefunden\n`;
      prompt += `Hinweis: ${report.robotsTxt.note}\n\n`;
    }
    
    // Sitemap
    prompt += `## SITEMAP\n`;
    if (report.sitemap.found) {
      prompt += `Status: ✓ Gefunden\n`;
      prompt += `Anzahl URLs: ${report.sitemap.urls.length}\n`;
      prompt += `Hinweis: ${report.sitemap.note}\n`;
      prompt += `Erste 20 URLs:\n${report.sitemap.urls.slice(0, 20).map((url: string, i: number) => `${i + 1}. ${url}`).join('\n')}\n\n`;
    } else {
      prompt += `Status: ✗ Nicht gefunden\n`;
      prompt += `Hinweis: ${report.sitemap.note}\n\n`;
    }
    
    // Homepage
    prompt += `## HOMEPAGE\n`;
    if (report.homepage.scraped && report.homepage.data) {
      const hp = report.homepage.data;
      prompt += `Status: ✓ Gescraped\n`;
      prompt += `Response Time: ${hp.responseTime}ms\n`;
      prompt += `HTTP Status: ${hp.status}\n`;
      prompt += `Titel: ${hp.title}\n`;
      prompt += `Content-Länge: ${hp.content.length} Zeichen\n`;
      prompt += `Inhalt (Auszug, erste 2000 Zeichen):\n${hp.content.substring(0, 2000)}${hp.content.length > 2000 ? '...' : ''}\n\n`;
    } else {
      prompt += `Status: ✗ Nicht gescraped\n`;
      prompt += `Hinweis: Homepage konnte nicht geladen werden\n\n`;
    }
    
    // Pages with response times
    prompt += `## GESCRAEPTE SEITEN (${report.pages.length} Seiten)\n\n`;
    prompt += `### PERFORMANCE-ÜBERSICHT\n`;
    prompt += `- Gesamt: ${report.summary.totalPages} Seiten\n`;
    prompt += `- Erfolgreich: ${report.summary.successfulPages} Seiten\n`;
    prompt += `- Durchschnittliche Response Time: ${report.summary.averageResponseTime}ms\n`;
    prompt += `- Schnellste Seite: ${report.summary.fastestPage} (${report.pages.find((p: any) => p.url === report.summary.fastestPage)?.responseTime || 0}ms)\n`;
    prompt += `- Langsamste Seite: ${report.summary.slowestPage} (${report.pages.find((p: any) => p.url === report.summary.slowestPage)?.responseTime || 0}ms)\n\n`;
    
    prompt += `### SEITEN-DETAILS\n`;
    report.pages.slice(0, 20).forEach((page: any, i: number) => {
      prompt += `\n#### Seite ${i + 1}: ${page.title || 'Kein Titel'}\n`;
      prompt += `- URL: ${page.url}\n`;
      prompt += `- Response Time: ${page.responseTime}ms\n`;
      prompt += `- HTTP Status: ${page.status}\n`;
      prompt += `- Erfolg: ${page.success ? '✓' : '✗'}\n`;
      if (page.success && page.content) {
        prompt += `- Content-Länge: ${page.content.length} Zeichen\n`;
        prompt += `- Inhalt (Auszug, erste 1000 Zeichen):\n${page.content.substring(0, 1000)}${page.content.length > 1000 ? '...' : ''}\n`;
      }
    });
    
    // Task
    prompt += `\n\n## AUFGABE\n\n`;
    prompt += `Bewerte diese Website auf AI-Readiness und gib eine strukturierte Analyse:\n\n`;
    prompt += `1. **GESAMTBEWERTUNG**\n`;
    prompt += `   - Wie gut ist die Website für KI-Systeme lesbar? (1-10)\n`;
    prompt += `   - Kurze Zusammenfassung der Hauptprobleme und Stärken\n\n`;
    prompt += `2. **STRUKTUR & ORGANISATION**\n`;
    prompt += `   - Bewertung der Sitemap (falls vorhanden)\n`;
    prompt += `   - URL-Struktur und -Konsistenz\n`;
    prompt += `   - robots.txt Konfiguration\n\n`;
    prompt += `3. **CONTENT-QUALITÄT**\n`;
    prompt += `   - Wie strukturiert und semantisch ist der Content?\n`;
    prompt += `   - Gibt es klare Überschriften, Meta-Informationen?\n`;
    prompt += `   - Ist der Content für KI verständlich?\n\n`;
    prompt += `4. **PERFORMANCE**\n`;
    prompt += `   - Bewertung der Response Times\n`;
    prompt += `   - Empfehlungen zur Performance-Optimierung\n\n`;
    prompt += `5. **PRIORITÄTEN**\n`;
    prompt += `   - Top 5 sofort umsetzbare Maßnahmen\n`;
    prompt += `   - Langfristige Verbesserungen\n\n`;
    prompt += `Gib konkrete, umsetzbare Empfehlungen auf Deutsch. Sei spezifisch und beziehe dich auf die tatsächlich gefundenen Daten.`;
    
    return prompt;
  }
  
  // Legacy function for backward compatibility
  private buildAIReadinessPrompt(
    websiteUrl: string,
    robotsTxt: string,
    sitemapUrls: string[],
    pageContents: Array<{ url: string; content: string; title: string }>
  ): string {
    return this.buildAIReadinessPromptFromReport({
      websiteUrl,
      robotsTxt: { found: !!robotsTxt, content: robotsTxt, note: robotsTxt ? 'Gefunden' : 'Nicht gefunden' },
      sitemap: { found: sitemapUrls.length > 0, urls: sitemapUrls, note: sitemapUrls.length > 0 ? `${sitemapUrls.length} URLs` : 'Nicht gefunden' },
      homepage: { scraped: true, data: pageContents[0] || null },
      pages: pageContents.map(p => ({ ...p, responseTime: 0, status: 200, success: true })),
      summary: { totalPages: pageContents.length, successfulPages: pageContents.length, averageResponseTime: 0, fastestPage: '', slowestPage: '' }
    });
  }

  // Call GPT API for AI Readiness recommendations
  private async callGPTForAIReadiness(prompt: string, env: Env): Promise<string> {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[GPT] OPENAI_API_KEY not configured");
      throw new Error("OPENAI_API_KEY not configured");
    }
    
    try {
      console.log("[GPT] → Preparing request to OpenAI API...");
      console.log("[GPT] → Model: gpt-4o-mini");
      console.log("[GPT] → Prompt length: " + prompt.length + " characters");
      console.log("[GPT] → Max tokens: 3000");
      console.log("[GPT] → Timeout: 120 seconds");
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Du bist ein Experte für AI-Readiness und bewertest, wie gut Websites von KI-Systemen (wie ChatGPT, Claude, etc.) gelesen, verstanden und verarbeitet werden können. Du analysierst die technische Struktur, Content-Qualität, Performance und Zugänglichkeit und gibst strukturierte, umsetzbare Empfehlungen auf Deutsch."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
        signal: AbortSignal.timeout(120000) // 2 minutes timeout
      });
      
      console.log("[GPT] → Response status: " + response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GPT] ❌ API error: " + response.status + " - " + errorText);
        throw new Error(`GPT API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      const content = data.choices[0]?.message?.content || "Keine Empfehlungen generiert.";
      console.log("[GPT] ✓ Response received: " + content.length + " characters");
      return content;
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        console.error("[GPT] ❌ Timeout error after 120 seconds");
        throw new Error("GPT API timeout: Die Anfrage hat zu lange gedauert (über 2 Minuten). Bitte versuchen Sie es erneut.");
      }
      console.error("[GPT] ❌ Error: " + (error.message || error));
      throw error;
    }
  }
}


