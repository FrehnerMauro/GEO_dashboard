/**
 * Schedule API Handler - HTTP layer for schedule operations
 */

import type { Env, CorsHeaders } from "../types.js";
import { ScheduleService } from "../../services/schedule-service.js";

export class ScheduleHandler {
  private service: ScheduleService;

  constructor(env: Env) {
    this.service = new ScheduleService(env);
  }

  async getAll(request: Request, corsHeaders: CorsHeaders): Promise<Response> {
    const url = new URL(request.url);
    const companyId = url.searchParams.get("companyId") || undefined;
    const schedules = await this.service.getAllSchedules(companyId, true);
    return new Response(JSON.stringify(schedules), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async create(request: Request, corsHeaders: CorsHeaders): Promise<Response> {
    const body = await request.json();
    const schedule = await this.service.createSchedule({
      companyId: body.companyId,
      scheduleType: body.scheduleType,
      isActive: body.isActive,
    });
    return new Response(JSON.stringify(schedule), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async update(scheduleId: string, request: Request, corsHeaders: CorsHeaders): Promise<Response> {
    const body = await request.json();
    const schedule = await this.service.updateSchedule(scheduleId, body);
    return new Response(JSON.stringify(schedule), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async execute(request: Request, env: Env, corsHeaders: CorsHeaders): Promise<Response> {
    // This is complex business logic - keeping it in handler for now
    // TODO: Move to service layer
    return new Response(JSON.stringify({ error: "Not implemented" }), {
      status: 501,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

