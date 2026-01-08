/**
 * Category Repository - Data access layer for category entities
 */

import type { D1Database } from "../../persistence/index.js";
import type { Category } from "../../types.js";

export class CategoryRepository {
  constructor(private db: D1Database) {}

  async createMany(runId: string, categories: Category[]): Promise<void> {
    if (categories.length === 0) return;

    const statements = categories.map((category) =>
      this.db
        .prepare(
          `INSERT INTO categories (id, run_id, name, description, confidence, source_pages)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(
          category.id,
          runId,
          category.name,
          category.description || null,
          category.confidence,
          JSON.stringify(category.sourcePages || [])
        )
    );

    await this.db.batch(statements);
  }

  async findByRunId(runId: string): Promise<Category[]> {
    const result = await this.db
      .prepare("SELECT * FROM categories WHERE run_id = ? ORDER BY confidence DESC")
      .bind(runId)
      .all<any>();

    return (result.results || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || "",
      confidence: row.confidence,
      sourcePages: JSON.parse(row.source_pages || "[]"),
    }));
  }
}

