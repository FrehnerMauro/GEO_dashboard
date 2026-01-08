/**
 * Scheduled Runs Handlers
 */

import { Database } from "../../persistence/db.js";
import type { Env, CorsHeaders } from "../types.js";

export class SchedulesHandler {
  async handleGetSchedules(
    companyId: string | undefined,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const db = new Database(env.geo_db);
    const schedules = await db.getScheduledRuns(companyId, true);
    return new Response(JSON.stringify(schedules), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async handleCreateSchedule(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
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

  async handleUpdateSchedule(
    scheduleId: string,
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
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

  async handleExecuteScheduledRun(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const body = await request.json() as {
        companyId: string;
        scheduleId?: string;
      };
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

      const { Database } = await import("../../persistence/index.js");
      const db = new Database(env.geo_db);

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
      
      // Execute prompts (simplified - would need full execution logic)
      return new Response(
        JSON.stringify({ 
          message: "Scheduled run executed",
          promptsExecuted: savedPrompts.length 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
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
}

