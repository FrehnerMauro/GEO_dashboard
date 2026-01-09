/**
 * Analysis Service - Business logic for analysis operations
 */

import { apiClient } from "../core/api-client.js";

export class AnalysisService {
  async getAllAnalyses(): Promise<any[]> {
    return await apiClient.get<any[]>("/api/analyses");
  }

  async deleteAnalysis(runId: string): Promise<void> {
    await apiClient.delete(`/api/analysis/${runId}`);
  }

  async getAllCompanies(): Promise<any[]> {
    return await apiClient.get<any[]>("/api/companies");
  }

  async getCompanyAnalyses(companyId: string): Promise<any[]> {
    return await apiClient.get<any[]>(`/api/companies/${companyId}/analyses`);
  }

  async getGlobalCategories(): Promise<any[]> {
    return await apiClient.get<any[]>("/api/global/categories");
  }

  async getGlobalPromptsByCategory(categoryName: string): Promise<{ prompts: any[]; sourceStats: any[] }> {
    return await apiClient.get<{ prompts: any[]; sourceStats: any[] }>(`/api/global/categories/${encodeURIComponent(categoryName)}/prompts`);
  }

  async getAnalysisPromptsAndSummary(runId: string): Promise<{ prompts: any[]; summary: any | null }> {
    return await apiClient.get<{ prompts: any[]; summary: any | null }>(`/api/analysis/${runId}/prompts-summary`);
  }
}

export const analysisService = new AnalysisService();

