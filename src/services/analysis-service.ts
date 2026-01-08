/**
 * Analysis Service - Legacy service layer (deprecated)
 * @deprecated Use AnalysisUseCases from application layer instead
 * This is kept for backward compatibility during migration
 */

import type { UserInput, AnalysisResult } from "../types.js";
import { GEOEngine } from "../engine.js";
import { Database } from "../persistence/index.js";
import type { D1Database } from "../persistence/index.js";

/**
 * @deprecated Use AnalysisUseCases instead
 */
export class AnalysisService {
  constructor(
    private engine: GEOEngine,
    private env: Record<string, any>
  ) {}

  async startAnalysis(userInput: UserInput): Promise<string> {
    return await this.engine.runAnalysis(userInput, this.env);
  }

  async getAnalysisResult(runId: string): Promise<AnalysisResult | null> {
    return await this.engine.getAnalysisResult(runId, this.env);
  }

  async getAllAnalyses(limit: number = 100): Promise<any[]> {
    const db = new Database(this.env.geo_db as D1Database);
    const analyses = await db.getAllAnalysisRuns(limit);
    return Array.isArray(analyses) ? analyses : [];
  }

  async deleteAnalysis(runId: string): Promise<void> {
    const db = new Database(this.env.geo_db as D1Database);
    await db.deleteAnalysis(runId);
  }

  async getAnalysisStatus(runId: string): Promise<any | null> {
    const db = new Database(this.env.geo_db as D1Database);
    return await db.getAnalysisStatus(runId);
  }
}

