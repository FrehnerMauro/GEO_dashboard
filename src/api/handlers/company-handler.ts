/**
 * Company API Handler - HTTP layer for company operations
 */

import type { Env, CorsHeaders } from "../types.js";
import { CompanyService } from "../../services/company-service.js";

export class CompanyHandler {
  private service: CompanyService;

  constructor(env: Env) {
    this.service = new CompanyService(env);
  }

  async getAll(request: Request, corsHeaders: CorsHeaders): Promise<Response> {
    const companies = await this.service.getAllCompanies();
    return new Response(JSON.stringify(companies), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async get(companyId: string, corsHeaders: CorsHeaders): Promise<Response> {
    const company = await this.service.getCompany(companyId);
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

  async create(request: Request, corsHeaders: CorsHeaders): Promise<Response> {
    const body = await request.json();
    const company = await this.service.createCompany({
      name: body.name,
      websiteUrl: body.websiteUrl,
      country: body.country,
      language: body.language,
      region: body.region,
      description: body.description,
    });
    return new Response(JSON.stringify(company), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async getPrompts(companyId: string, corsHeaders: CorsHeaders): Promise<Response> {
    const prompts = await this.service.getCompanyPrompts(companyId);
    return new Response(JSON.stringify(prompts), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async getRuns(companyId: string, request: Request, corsHeaders: CorsHeaders): Promise<Response> {
    const url = new URL(request.url);
    const detailed = url.searchParams.get("detailed") === "true";
    
    if (detailed) {
      // For detailed runs, we need to get full analysis data
      // This is complex, so we'll keep it in the handler for now
      const { Database } = await import("../../persistence/index.js");
      const db = new Database((this.service as any).db.db);
      // Complex logic here - keeping it in handler for now
      return new Response(JSON.stringify({ error: "Not implemented" }), {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const runs = await this.service.getCompanyAnalysisRuns(companyId);
    return new Response(JSON.stringify(runs), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async getTimeSeries(companyId: string, request: Request, corsHeaders: CorsHeaders): Promise<Response> {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const timeSeries = await this.service.getCompanyTimeSeries(companyId, days);
    return new Response(JSON.stringify(timeSeries), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

