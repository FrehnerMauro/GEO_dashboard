/**
 * Company Repository - Data access layer for company entities
 */

import type { D1Database } from "../../persistence/index.js";
import type { Company, CompanyPrompt } from "../../types.js";

export class CompanyRepository {
  constructor(private db: D1Database) {}

  async findAll(): Promise<Company[]> {
    const result = await this.db
      .prepare("SELECT * FROM companies WHERE is_active = 1 ORDER BY created_at DESC")
      .all<any>();

    return (result.results || []).map((row) => ({
      id: row.id,
      name: row.name,
      websiteUrl: row.website_url,
      country: row.country,
      language: row.language,
      region: row.region,
      description: row.description,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async findById(companyId: string): Promise<Company | null> {
    const result = await this.db
      .prepare("SELECT * FROM companies WHERE id = ?")
      .bind(companyId)
      .first<any>();

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      websiteUrl: result.website_url,
      country: result.country,
      language: result.language,
      region: result.region,
      description: result.description,
      isActive: result.is_active === 1,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  async create(data: {
    name: string;
    websiteUrl: string;
    country: string;
    language: string;
    region?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<string> {
    const id = `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO companies (id, name, website_url, country, language, region, description, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        data.name,
        data.websiteUrl,
        data.country,
        data.language,
        data.region || null,
        data.description || null,
        data.isActive !== false ? 1 : 0,
        now,
        now
      )
      .run();

    return id;
  }

  async findPrompts(companyId: string): Promise<CompanyPrompt[]> {
    const result = await this.db
      .prepare("SELECT * FROM company_prompts WHERE company_id = ? AND is_active = 1 ORDER BY created_at DESC")
      .bind(companyId)
      .all<any>();

    return (result.results || []).map((row) => ({
      id: row.id,
      companyId: row.company_id,
      question: row.question,
      categoryId: row.category_id,
      categoryName: row.category_name,
      language: row.language,
      country: row.country,
      region: row.region,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async findAnalysisRuns(companyId: string): Promise<any[]> {
    const result = await this.db
      .prepare("SELECT * FROM analysis_runs WHERE company_id = ? ORDER BY created_at DESC")
      .bind(companyId)
      .all<any>();

    return result.results || [];
  }
}

