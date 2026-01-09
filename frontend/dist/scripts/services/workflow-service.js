/**
 * Workflow Service - Business logic for workflow operations
 */
import { apiClient } from "../core/api-client.js";
export class WorkflowService {
    async step1FindSitemap(input) {
        return await apiClient.post("/api/workflow/step1", input);
    }
    async step3GenerateCategories(runId, content, language) {
        return await apiClient.post("/api/workflow/step3", { runId, content, language });
    }
    async saveCategories(runId, selectedCategoryIds, customCategories) {
        await apiClient.put(`/api/workflow/${runId}/categories`, {
            selectedCategoryIds,
            customCategories,
        });
    }
    async step4GeneratePrompts(runId, categories, userInput, content, questionsPerCategory = 3, companyId) {
        return await apiClient.post("/api/workflow/step4", {
            runId,
            categories,
            userInput,
            content,
            questionsPerCategory,
            companyId,
        });
    }
    async step5ExecutePrompts(runId, prompts) {
        return await apiClient.post("/api/workflow/step5", { runId, prompts });
    }
    async fetchUrl(url) {
        return await apiClient.post("/api/workflow/fetchUrl", { url });
    }
    async getPromptsAndSummary(runId) {
        return await apiClient.get(`/api/analysis/${runId}/prompts-summary`);
    }
    async generateSummary(runId) {
        return await apiClient.post("/api/workflow/generateSummary", { runId });
    }
}
export const workflowService = new WorkflowService();
//# sourceMappingURL=workflow-service.js.map