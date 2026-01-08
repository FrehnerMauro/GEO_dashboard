/**
 * Route Definitions - Only routes used by the frontend
 */

export interface RouteDefinition {
  method: string;
  path: string | RegExp;
  handler: string; // Format: "handlerName.methodName"
}

export const ROUTES: RouteDefinition[] = [
  // Workflow routes (used by frontend)
  { method: "POST", path: "/api/workflow/step1", handler: "workflow.step1" },
  { method: "POST", path: "/api/workflow/step2", handler: "workflow.step2" },
  { method: "POST", path: "/api/workflow/step3", handler: "workflow.step3" },
  { method: "PUT", path: /^\/api\/workflow\/([^\/]+)\/categories$/, handler: "workflow.saveCategories" },
  { method: "POST", path: "/api/workflow/step4", handler: "workflow.step4" },
  { method: "PUT", path: /^\/api\/workflow\/([^\/]+)\/prompts$/, handler: "workflow.savePrompts" },
  { method: "POST", path: "/api/workflow/step5", handler: "workflow.step5" },
  { method: "POST", path: "/api/workflow/fetchUrl", handler: "workflow.fetchUrl" },
  { method: "POST", path: "/api/workflow/executePrompt", handler: "workflow.executePrompt" },
  { method: "POST", path: "/api/workflow/generateSummary", handler: "workflow.generateSummary" },
  
  // Analysis routes (used by frontend)
  { method: "POST", path: "/api/analyze", handler: "analysis.analyze" },
  { method: "GET", path: "/api/analyses", handler: "analysis.getAll" },
  { method: "GET", path: /^\/api\/analysis\/([^\/]+)$/, handler: "analysis.get" },
  { method: "GET", path: /^\/api\/analysis\/([^\/]+)\/status$/, handler: "analysis.getStatus" },
  { method: "GET", path: /^\/api\/analysis\/([^\/]+)\/metrics$/, handler: "analysis.getMetrics" },
  { method: "GET", path: /^\/api\/analysis\/([^\/]+)\/prompts-summary$/, handler: "analysis.getPromptsAndSummary" },
  { method: "DELETE", path: /^\/api\/analysis\/([^\/]+)$/, handler: "analysis.delete" },
  
  // Dashboard routes
  { method: "GET", path: "/api/companies", handler: "analysis.getAllCompanies" },
  { method: "GET", path: /^\/api\/companies\/([^\/]+)\/analyses$/, handler: "analysis.getCompanyAnalyses" },
  { method: "GET", path: "/api/global/categories", handler: "analysis.getGlobalCategories" },
  { method: "GET", path: /^\/api\/global\/categories\/([^\/]+)\/prompts$/, handler: "analysis.getGlobalPromptsByCategory" },
  
  // Health check (for monitoring)
  { method: "GET", path: "/api/health", handler: "health.check" },
];

export function matchRoute(
  path: string,
  method: string
): { route: RouteDefinition; params: Record<string, string> } | null {
  for (const route of ROUTES) {
    if (route.method !== method) continue;

    if (typeof route.path === "string") {
      if (route.path === path) {
        return { route, params: {} };
      }
    } else {
      const match = path.match(route.path);
      if (match) {
        const params: Record<string, string> = {};
        // Extract named groups or use indices
        if (match.groups) {
          Object.assign(params, match.groups);
        } else {
          // Use indices for unnamed groups
          match.slice(1).forEach((value, index) => {
            params[`param${index}`] = value;
          });
        }
        return { route, params };
      }
    }
  }
  return null;
}
