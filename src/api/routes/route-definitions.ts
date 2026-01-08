/**
 * Route Definitions - Centralized route configuration
 */

export interface RouteDefinition {
  method: string;
  path: string | RegExp;
  handler: string; // Handler method name
}

export const ROUTES: RouteDefinition[] = [
  // Workflow routes
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
  
  // Analysis routes
  { method: "POST", path: "/api/analyze", handler: "analysis.analyze" },
  { method: "GET", path: "/api/analyses", handler: "analysis.getAll" },
  { method: "GET", path: /^\/api\/analysis\/([^\/]+)$/, handler: "analysis.get" },
  { method: "GET", path: /^\/api\/analysis\/([^\/]+)\/status$/, handler: "analysis.getStatus" },
  { method: "GET", path: /^\/api\/analysis\/([^\/]+)\/metrics$/, handler: "analysis.getMetrics" },
  { method: "GET", path: /^\/api\/analysis\/([^\/]+)\/insights$/, handler: "analysis.getInsights" },
  { method: "DELETE", path: /^\/api\/analysis\/([^\/]+)$/, handler: "analysis.delete" },
  { method: "PUT", path: /^\/api\/analysis\/([^\/]+)\/pause$/, handler: "analysis.pause" },
  
  // Company routes
  { method: "GET", path: "/api/companies", handler: "company.getAll" },
  { method: "POST", path: "/api/companies", handler: "company.create" },
  { method: "GET", path: /^\/api\/companies\/([^\/]+)$/, handler: "company.get" },
  { method: "GET", path: /^\/api\/companies\/([^\/]+)\/prompts$/, handler: "company.getPrompts" },
  { method: "GET", path: /^\/api\/companies\/([^\/]+)\/runs$/, handler: "company.getRuns" },
  { method: "GET", path: /^\/api\/companies\/([^\/]+)\/timeseries$/, handler: "company.getTimeSeries" },
  
  // Schedule routes
  { method: "GET", path: "/api/schedules", handler: "schedule.getAll" },
  { method: "POST", path: "/api/schedules", handler: "schedule.create" },
  { method: "PUT", path: /^\/api\/schedules\/([^\/]+)$/, handler: "schedule.update" },
  { method: "POST", path: "/api/scheduler/execute", handler: "schedule.execute" },
  
  // AI Readiness routes
  { method: "POST", path: "/api/ai-readiness/analyze", handler: "aiReadiness.analyze" },
  { method: "GET", path: /^\/api\/ai-readiness\/status\/([^\/]+)$/, handler: "aiReadiness.getStatus" },
  
  // Other routes
  { method: "POST", path: "/api/chat", handler: "chat.send" },
  { method: "POST", path: "/api/test/analyze", handler: "test.analyze" },
  { method: "POST", path: "/api/setup/database", handler: "setup.database" },
  { method: "GET", path: "/api/health", handler: "health.check" },
  { method: "GET", path: "/", handler: "root.landing" },
];

export function matchRoute(path: string, method: string): { route: RouteDefinition; params: Record<string, string> } | null {
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

