/**
 * Prompt Repository - Data access layer for prompt entities
 */

import type { D1Database } from "../../persistence/index.js";
import type { Prompt } from "../../types.js";

export class PromptRepository {
  constructor(private db: D1Database) {}

  async createMany(runId: string, prompts: Prompt[]): Promise<void> {
    if (prompts.length === 0) return;

    const statements = prompts.map((prompt) =>
      this.db
        .prepare(
          `INSERT INTO prompts (id, run_id, category_id, question, language, country, region, intent, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          prompt.id,
          runId,
          prompt.categoryId || null,
          prompt.question,
          prompt.language,
          prompt.country,
          prompt.region || null,
          prompt.intent || "medium",
          prompt.createdAt || new Date().toISOString()
        )
    );

    await this.db.batch(statements);
  }

  async findByRunId(runId: string): Promise<Prompt[]> {
    const result = await this.db
      .prepare("SELECT * FROM prompts WHERE run_id = ?")
      .bind(runId)
      .all<any>();

    return (result.results || []).map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      question: row.question,
      language: row.language,
      country: row.country,
      region: row.region,
      intent: row.intent,
      createdAt: row.created_at,
    }));
  }
}

