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
}

export const analysisService = new AnalysisService();

