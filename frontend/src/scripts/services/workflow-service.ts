/**
 * Workflow Service - Business logic for workflow operations
 */

import { apiClient } from "../core/api-client.js";

export interface WorkflowStep1Input {
  websiteUrl: string;
  country: string;
  language: string;
  region?: string;
}

export interface WorkflowStep1Result {
  runId: string;
  urls: string[];
  foundSitemap: boolean;
  message: string;
}

export class WorkflowService {
  async step1FindSitemap(input: WorkflowStep1Input): Promise<WorkflowStep1Result> {
    return await apiClient.post<WorkflowStep1Result>("/api/workflow/step1", input);
  }

  async step3GenerateCategories(runId: string, content: string, language: string): Promise<any> {
    return await apiClient.post("/api/workflow/step3", { runId, content, language });
  }

  async saveCategories(runId: string, selectedCategoryIds: string[], customCategories: any[]): Promise<void> {
    await apiClient.put(`/api/workflow/${runId}/categories`, {
      selectedCategoryIds,
      customCategories,
    });
  }

  async step4GeneratePrompts(
    runId: string,
    categories: any[],
    userInput: any,
    content: string,
    questionsPerCategory: number = 3,
    companyId?: string
  ): Promise<any> {
    return await apiClient.post("/api/workflow/step4", {
      runId,
      categories,
      userInput,
      content,
      questionsPerCategory,
      companyId,
    });
  }

  async step5ExecutePrompts(runId: string, prompts?: any[]): Promise<any> {
    return await apiClient.post("/api/workflow/step5", { runId, prompts });
  }

  async fetchUrl(url: string): Promise<any> {
    return await apiClient.post("/api/workflow/fetchUrl", { url });
  }

  async getPromptsAndSummary(runId: string): Promise<any> {
    return await apiClient.get(`/api/analysis/${runId}/prompts-summary`);
  }

  async generateSummary(runId: string): Promise<any> {
    return await apiClient.post("/api/workflow/generateSummary", { runId });
  }
}

export const workflowService = new WorkflowService();

