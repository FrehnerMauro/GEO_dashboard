/**
 * Main Application Entry Point
 * Initializes the application and sets up page routing
 */

import { DashboardPage } from "./pages/dashboard-page.js";
import { AnalysesPage } from "./pages/analyses-page.js";
import { AIReadinessPage } from "./pages/ai-readiness-page.js";
import { navigation } from "./components/navigation.js";

export class App {
  private dashboardPage: DashboardPage;
  private analysesPage: AnalysesPage;
  private aiReadinessPage: AIReadinessPage;

  constructor() {
    // Initialize pages
    this.dashboardPage = new DashboardPage();
    this.analysesPage = new AnalysesPage();
    this.aiReadinessPage = new AIReadinessPage();

    // Setup global navigation functions
    this.setupGlobalFunctions();
  }

  private setupGlobalFunctions(): void {
    // These functions are called from HTML onclick handlers
    (window as any).showDashboard = (event?: Event) => {
      if (event) event.preventDefault();
      this.dashboardPage.show();
    };

    (window as any).showAnalyses = (event?: Event) => {
      if (event) event.preventDefault();
      this.analysesPage.show();
    };

    (window as any).showAIReadiness = (event?: Event) => {
      if (event) event.preventDefault();
      this.aiReadinessPage.show();
    };

    // Analysis start function
    (window as any).startAnalysisNow = async () => {
      // This will be handled by DashboardPage
      const form = document.getElementById("analyzeForm") as HTMLFormElement;
      if (form) {
        const event = new Event("submit", { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
      }
    };

    // AI Readiness start function
    (window as any).startAIReadiness = async () => {
      await this.aiReadinessPage.startAnalysis();
    };
  }

  init(): void {
    // Initialize navigation
    console.log("GEO Dashboard initialized");

    // Show dashboard by default
    this.dashboardPage.show();
  }
}

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const app = new App();
    app.init();
  });
} else {
  const app = new App();
  app.init();
}

