/**
 * Company Use Cases - Application layer orchestration for company operations
 */

import { CompanyDomainService } from "../../domain/services/company-domain-service.js";
import { CompanyRepository } from "../../data/repositories/company-repository.js";
import type { D1Database } from "../../persistence/index.js";
import type { Company } from "../../types.js";

export interface CreateCompanyInput {
  name: string;
  websiteUrl: string;
  country: string;
  language: string;
  region?: string;
  description?: string;
}

export class CompanyUseCases {
  private domainService: CompanyDomainService;

  constructor(env: Record<string, any>) {
    const db = env.geo_db as D1Database;
    const companyRepo = new CompanyRepository(db);
    this.domainService = new CompanyDomainService(companyRepo);
  }

  /**
   * Use Case: Get all companies
   */
  async getAllCompanies(): Promise<Company[]> {
    return await this.domainService.getAllCompanies();
  }

  /**
   * Use Case: Get company by ID
   */
  async getCompany(companyId: string): Promise<Company | null> {
    return await this.domainService.getCompany(companyId);
  }

  /**
   * Use Case: Create new company
   */
  async createCompany(input: CreateCompanyInput): Promise<Company> {
    return await this.domainService.createCompany(input);
  }

  /**
   * Use Case: Get company prompts
   */
  async getCompanyPrompts(companyId: string): Promise<any[]> {
    return await this.domainService.getCompanyPrompts(companyId);
  }

  /**
   * Use Case: Get company analysis runs
   */
  async getCompanyAnalysisRuns(companyId: string): Promise<any[]> {
    return await this.domainService.getCompanyAnalysisRuns(companyId);
  }
}

