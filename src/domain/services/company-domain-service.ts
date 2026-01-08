/**
 * Company Domain Service - Business logic for company operations
 */

import { CompanyRepository } from "../../data/repositories/company-repository.js";
import type { Company, CompanyPrompt } from "../../types.js";

export interface CreateCompanyInput {
  name: string;
  websiteUrl: string;
  country: string;
  language: string;
  region?: string;
  description?: string;
}

export class CompanyDomainService {
  constructor(private companyRepo: CompanyRepository) {}

  /**
   * Get all active companies
   * Business rule: Only return active companies, sorted by creation date
   */
  async getAllCompanies(): Promise<Company[]> {
    return await this.companyRepo.findAll();
  }

  /**
   * Get company by ID
   * Business rule: Return null if not found (not throw error)
   */
  async getCompany(companyId: string): Promise<Company | null> {
    return await this.companyRepo.findById(companyId);
  }

  /**
   * Create a new company
   * Business rule: Validate input, generate ID, set defaults
   */
  async createCompany(input: CreateCompanyInput): Promise<Company> {
    // Business rule: Validate required fields
    this.validateCompanyInput(input);
    
    // Business rule: Normalize website URL
    const websiteUrl = this.normalizeWebsiteUrl(input.websiteUrl);
    
    const companyId = await this.companyRepo.create({
      name: input.name,
      websiteUrl,
      country: input.country,
      language: input.language,
      region: input.region,
      description: input.description,
      isActive: true, // Default to active
    });
    
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new Error("Failed to create company");
    }
    
    return company;
  }

  /**
   * Get company prompts
   * Business rule: Only return active prompts
   */
  async getCompanyPrompts(companyId: string): Promise<CompanyPrompt[]> {
    return await this.companyRepo.findPrompts(companyId);
  }

  /**
   * Get company analysis runs
   * Business rule: Return all runs for company, sorted by date
   */
  async getCompanyAnalysisRuns(companyId: string): Promise<any[]> {
    return await this.companyRepo.findAnalysisRuns(companyId);
  }

  // Private helper methods

  private validateCompanyInput(input: CreateCompanyInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error("Company name is required");
    }
    if (!input.websiteUrl || input.websiteUrl.trim().length === 0) {
      throw new Error("Website URL is required");
    }
    if (!input.country || input.country.trim().length === 0) {
      throw new Error("Country is required");
    }
    if (!input.language || input.language.trim().length === 0) {
      throw new Error("Language is required");
    }
  }

  private normalizeWebsiteUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed.match(/^https?:\/\//i)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }
}

