/**
 * Company Service - Business logic for company operations
 */

import { Database } from "../persistence/index.js";
import type { D1Database } from "../persistence/index.js";

export interface CreateCompanyInput {
  name: string;
  websiteUrl: string;
  country: string;
  language: string;
  region?: string;
  description?: string;
  isActive?: boolean;
}

export class CompanyService {
  private db: Database;

  constructor(env: Record<string, any>) {
    this.db = new Database(env.geo_db as D1Database);
  }

  async getAllCompanies() {
    return await this.db.getAllCompanies();
  }

  async getCompany(companyId: string) {
    return await this.db.getCompany(companyId);
  }

  async createCompany(input: CreateCompanyInput) {
    const companyId = await this.db.createCompany({
      name: input.name,
      websiteUrl: input.websiteUrl,
      country: input.country,
      language: input.language,
      region: input.region,
      description: input.description,
      isActive: input.isActive ?? true,
    });
    return await this.db.getCompany(companyId);
  }

  async getCompanyPrompts(companyId: string) {
    return await this.db.getCompanyPrompts(companyId);
  }

  async getCompanyAnalysisRuns(companyId: string) {
    return await this.db.getCompanyAnalysisRuns(companyId);
  }

  async getCompanyTimeSeries(companyId: string, days: number = 30) {
    return await this.db.getCompanyTimeSeries(companyId, days);
  }
}

