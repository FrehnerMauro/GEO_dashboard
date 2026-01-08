/**
 * Company Management Handlers
 */

import { Database } from "../../persistence/db.js";
import type { Env, CorsHeaders } from "../types.js";

export class CompaniesHandler {
  async handleGetAllCompanies(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const db = new Database(env.geo_db);
    const companies = await db.getAllCompanies();
    return new Response(JSON.stringify(companies), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async handleCreateCompany(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json() as {
      name: string;
      websiteUrl: string;
      country: string;
      language: string;
      region?: string;
      description?: string;
    };
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

  async handleGetCompany(
    companyId: string,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
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

  async handleGetCompanyPrompts(
    companyId: string,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const db = new Database(env.geo_db);
    const prompts = await db.getCompanyPrompts(companyId);
    return new Response(JSON.stringify(prompts), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async handleGetCompanyRuns(
    companyId: string,
    detailed: boolean,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const db = new Database(env.geo_db);
    
    if (detailed) {
      // Return detailed analysis data for all runs (for historical comparison)
      // This includes full analysis results with prompts, responses, and metrics
      const runs = await db.getCompanyAnalysisRuns(companyId);
      // For detailed view, we would need to fetch additional data
      // For now, return the runs with a flag indicating detailed mode
      return new Response(JSON.stringify({
        detailed: true,
        runs: runs,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Return just the run metadata (id, status, dates, etc.)
      const runs = await db.getCompanyAnalysisRuns(companyId);
      return new Response(JSON.stringify(runs), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  async handleGetCompanyTimeSeries(
    companyId: string,
    days: number,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const db = new Database(env.geo_db);
    const timeSeries = await db.getCompanyTimeSeries(companyId, days);
    return new Response(JSON.stringify(timeSeries), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

