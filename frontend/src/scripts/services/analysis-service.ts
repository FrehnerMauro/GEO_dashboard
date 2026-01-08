/**
 * Analysis Service - Business logic for analysis operations
 */

import { apiClient } from "../core/api-client.js";

export interface AnalysisInput {
  websiteUrl: string;
  country: string;
  language: string;
  region?: string;
  questionsPerCategory?: number;
}

export interface AnalysisResult {
  runId: string;
  status: string;
  message?: string;
}

export class AnalysisService {
  async startAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
    return await apiClient.post<AnalysisResult>("/api/analyze", input);
  }

  async getAllAnalyses(): Promise<any[]> {
    return await apiClient.get<any[]>("/api/analyses");
  }

  async getAnalysis(runId: string): Promise<any> {
    return await apiClient.get<any>(`/api/analysis/${runId}`);
  }

  async getAnalysisStatus(runId: string): Promise<any> {
    return await apiClient.get<any>(`/api/analysis/${runId}/status`);
  }

  async getAnalysisMetrics(runId: string): Promise<any> {
    return await apiClient.get<any>(`/api/analysis/${runId}/metrics`);
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

  async getGlobalPromptsByCategory(categoryName: string): Promise<any[]> {
    return await apiClient.get<any[]>(`/api/global/categories/${encodeURIComponent(categoryName)}/prompts`);
  }

  async getAnalysisPromptsAndSummary(runId: string): Promise<{ prompts: any[]; summary: any | null }> {
    return await apiClient.get<{ prompts: any[]; summary: any | null }>(`/api/analysis/${runId}/prompts-summary`);
  }
}

export const analysisService = new AnalysisService();

