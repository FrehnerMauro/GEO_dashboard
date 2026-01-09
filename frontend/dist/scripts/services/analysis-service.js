/**
 * Analysis Service - Business logic for analysis operations
 */
import { apiClient } from "../core/api-client.js";
export class AnalysisService {
    async getAllAnalyses() {
        return await apiClient.get("/api/analyses");
    }
    async deleteAnalysis(runId) {
        await apiClient.delete(`/api/analysis/${runId}`);
    }
    async getAllCompanies() {
        return await apiClient.get("/api/companies");
    }
    async getCompanyAnalyses(companyId) {
        return await apiClient.get(`/api/companies/${companyId}/analyses`);
    }
    async getGlobalCategories() {
        return await apiClient.get("/api/global/categories");
    }
    async getGlobalPromptsByCategory(categoryName) {
        return await apiClient.get(`/api/global/categories/${encodeURIComponent(categoryName)}/prompts`);
    }
    async getAnalysisPromptsAndSummary(runId) {
        return await apiClient.get(`/api/analysis/${runId}/prompts-summary`);
    }
}
export const analysisService = new AnalysisService();
//# sourceMappingURL=analysis-service.js.map