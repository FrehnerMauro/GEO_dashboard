/**
 * Schedule Service - Business logic for scheduled runs
 */

import { Database } from "../persistence/index.js";
import type { D1Database } from "../persistence/index.js";

export interface CreateScheduleInput {
  companyId?: string;
  scheduleType: "daily" | "weekly" | "monthly";
  isActive?: boolean;
}

export class ScheduleService {
  private db: Database;

  constructor(env: Record<string, any>) {
    this.db = new Database(env.geo_db as D1Database);
  }

  private calculateNextRun(scheduleType: "daily" | "weekly" | "monthly"): Date {
    const now = new Date();
    const nextRun = new Date(now);
    
    if (scheduleType === "daily") {
      nextRun.setDate(nextRun.getDate() + 1);
    } else if (scheduleType === "weekly") {
      nextRun.setDate(nextRun.getDate() + 7);
    } else if (scheduleType === "monthly") {
      nextRun.setMonth(nextRun.getMonth() + 1);
    }
    
    return nextRun;
  }

  async getAllSchedules(companyId?: string, includeInactive: boolean = true) {
    return await this.db.getScheduledRuns(companyId, includeInactive);
  }

  async createSchedule(input: CreateScheduleInput) {
    const nextRunAt = this.calculateNextRun(input.scheduleType);
    
    const scheduleId = await this.db.createScheduledRun({
      companyId: input.companyId,
      scheduleType: input.scheduleType,
      nextRunAt: nextRunAt.toISOString(),
      isActive: input.isActive ?? true,
    });
    
    const schedules = await this.db.getScheduledRuns(undefined, false);
    return schedules.find(s => s.id === scheduleId);
  }

  async updateSchedule(scheduleId: string, updates: Partial<CreateScheduleInput>) {
    const updateData: any = { ...updates };
    
    // Recalculate next run time if schedule type changed
    if (updates.scheduleType) {
      const nextRunAt = this.calculateNextRun(updates.scheduleType);
      updateData.nextRunAt = nextRunAt.toISOString();
    }
    
    await this.db.updateScheduledRun(scheduleId, updateData);
    
    const schedules = await this.db.getScheduledRuns(undefined, false);
    return schedules.find(s => s.id === scheduleId);
  }
}

