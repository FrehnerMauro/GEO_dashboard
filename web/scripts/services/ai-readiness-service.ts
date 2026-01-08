/**
 * AI Readiness Service - Business logic for AI Readiness operations
 */

import { apiClient } from "../core/api-client.js";

export interface AIReadinessInput {
  websiteUrl: string;
}

export interface AIReadinessStatus {
  status: "processing" | "completed" | "error";
  message?: string;
  logs?: any[];
  recommendations?: string;
}

export class AIReadinessService {
  async startAnalysis(input: AIReadinessInput): Promise<{ runId: string }> {
    return await apiClient.post<{ runId: string }>("/api/ai-readiness/analyze", input);
  }

  async getStatus(runId: string): Promise<AIReadinessStatus> {
    return await apiClient.get<AIReadinessStatus>(`/api/ai-readiness/status/${runId}`);
  }
}

export const aiReadinessService = new AIReadinessService();

