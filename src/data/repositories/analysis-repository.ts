/**
 * Analysis Repository - Data access layer for analysis entities
 * Implements Repository Pattern for clean data access abstraction
 */

import type { D1Database } from "../../persistence/index.js";
import type { UserInput, AnalysisResult, Category, Prompt, LLMResponse } from "../../types.js";

export interface AnalysisRunEntity {
  id: string;
  website_url: string;
  country: string;
  region: string | null;
  language: string;
  status: string;
  step: string | null;
  progress: number | null;
  message: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export class AnalysisRepository {
  constructor(private db: D1Database) {}

  async create(runId: string, userInput: UserInput, status: string = "pending"): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO analysis_runs (id, website_url, country, region, language, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        runId,
        userInput.websiteUrl,
        userInput.country,
        userInput.region || null,
        userInput.language,
        status,
        now,
        now
      )
      .run();
  }

  async findById(runId: string): Promise<AnalysisRunEntity | null> {
    const result = await this.db
      .prepare("SELECT * FROM analysis_runs WHERE id = ?")
      .bind(runId)
      .first<AnalysisRunEntity>();
    return result || null;
  }

  async findAll(limit: number = 100): Promise<AnalysisRunEntity[]> {
    const result = await this.db
      .prepare("SELECT * FROM analysis_runs ORDER BY created_at DESC LIMIT ?")
      .bind(limit)
      .all<AnalysisRunEntity>();
    return result.results || [];
  }

  async updateStatus(
    runId: string,
    status: string,
    progress?: { step: string; progress: number; message?: string }
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (progress) {
      updateData.step = progress.step;
      updateData.progress = progress.progress;
      updateData.message = progress.message || null;
    }

    await this.db
      .prepare(
        `UPDATE analysis_runs 
         SET status = ?, step = ?, progress = ?, message = ?, updated_at = ? 
         WHERE id = ?`
      )
      .bind(
        updateData.status,
        updateData.step || null,
        updateData.progress || null,
        updateData.message,
        updateData.updated_at,
        runId
      )
      .run();
  }

  async delete(runId: string): Promise<void> {
    // Delete in correct order due to foreign keys
    await this.db.prepare("DELETE FROM prompt_analyses WHERE prompt_id IN (SELECT id FROM prompts WHERE run_id = ?)").bind(runId).run();
    await this.db.prepare("DELETE FROM citations WHERE llm_response_id IN (SELECT id FROM llm_responses WHERE prompt_id IN (SELECT id FROM prompts WHERE run_id = ?))").bind(runId).run();
    await this.db.prepare("DELETE FROM llm_responses WHERE prompt_id IN (SELECT id FROM prompts WHERE run_id = ?)").bind(runId).run();
    await this.db.prepare("DELETE FROM prompts WHERE run_id = ?").bind(runId).run();
    await this.db.prepare("DELETE FROM categories WHERE run_id = ?").bind(runId).run();
    await this.db.prepare("DELETE FROM category_metrics WHERE run_id = ?").bind(runId).run();
    await this.db.prepare("DELETE FROM competitive_analysis WHERE run_id = ?").bind(runId).run();
    await this.db.prepare("DELETE FROM time_series_data WHERE run_id = ?").bind(runId).run();
    await this.db.prepare("DELETE FROM analysis_runs WHERE id = ?").bind(runId).run();
  }

  async getStatus(runId: string): Promise<{ status: string; step: string | null; progress: number | null; message: string | null } | null> {
    const result = await this.db
      .prepare("SELECT status, step, progress, message FROM analysis_runs WHERE id = ?")
      .bind(runId)
      .first<{ status: string; step: string | null; progress: number | null; message: string | null }>();
    return result || null;
  }
}

