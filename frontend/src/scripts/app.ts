/**
 * Main Application Entry Point
 * Initializes the application and sets up page routing
 */

import { DashboardPage } from "./pages/dashboard-page.js";
import { AnalysesPage } from "./pages/analyses-page.js";
import { navigation } from "./components/navigation.js";

export class App {
  private dashboardPage: DashboardPage;
  private analysesPage: AnalysesPage;

  constructor() {
    // Initialize pages
    this.dashboardPage = new DashboardPage();
    this.analysesPage = new AnalysesPage();

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

    // AI Analysis function
    (window as any).showAIAnalysis = (event?: Event) => {
      if (event) event.preventDefault();
      this.showAIAnalysisSection();
    };

    // AI Readability function
    (window as any).showAIReadability = (event?: Event) => {
      if (event) event.preventDefault();
      this.showAIReadabilitySection();
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
  }

  private showAIAnalysisSection(): void {
    // Hide all sections
    const dashboardSection = document.getElementById("dashboardSection");
    const aiAnalysisSection = document.getElementById("aiAnalysisSection");
    const aiReadabilitySection = document.getElementById("aiReadabilitySection");
    const analysesSection = document.getElementById("analysesSection");
    const analysisDetailSection = document.getElementById("analysisDetailSection");

    if (dashboardSection) dashboardSection.style.display = "none";
    if (aiAnalysisSection) {
      aiAnalysisSection.style.display = "flex"; // Use flex to match CSS
      // Make sure the configuration card is visible
      const configurationCard = document.getElementById("configurationCard");
      if (configurationCard) {
        configurationCard.style.display = "block";
        configurationCard.classList.remove("hidden");
      }
    }
    if (aiReadabilitySection) aiReadabilitySection.style.display = "none";
    if (analysesSection) analysesSection.style.display = "none";
    if (analysisDetailSection) analysisDetailSection.style.display = "none";

    // Update header
    const headerTitle = document.getElementById("headerTitle");
    if (headerTitle) headerTitle.textContent = "AI Analysis";

    // Update navigation
    navigation.setActiveNavItem(1);
  }

  private showAIReadabilitySection(): void {
    // Hide all sections
    const dashboardSection = document.getElementById("dashboardSection");
    const aiAnalysisSection = document.getElementById("aiAnalysisSection");
    const aiReadabilitySection = document.getElementById("aiReadabilitySection");
    const analysesSection = document.getElementById("analysesSection");
    const analysisDetailSection = document.getElementById("analysisDetailSection");

    if (dashboardSection) dashboardSection.style.display = "none";
    if (aiAnalysisSection) aiAnalysisSection.style.display = "none";
    if (aiReadabilitySection) aiReadabilitySection.style.display = "flex"; // Use flex to match CSS
    if (analysesSection) analysesSection.style.display = "none";
    if (analysisDetailSection) analysisDetailSection.style.display = "none";

    // Update header
    const headerTitle = document.getElementById("headerTitle");
    if (headerTitle) headerTitle.textContent = "AI Readability";

    // Update navigation
    navigation.setActiveNavItem(2);
  }

  init(): void {
    // Initialize navigation
    console.log("GEO Dashboard initialized");

    // Setup button event listeners
    this.setupButtonListeners();

    // Show dashboard by default
    this.dashboardPage.show();
  }

  private setupButtonListeners(): void {
    // Button listeners setup
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

