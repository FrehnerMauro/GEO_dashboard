/**
 * Main Application Entry Point
 * Initializes the application and sets up page routing
 */

import { DashboardPage } from "./pages/dashboard-page.js";
import { AnalysesPage } from "./pages/analyses-page.js";
import { AnalysisWorkflow } from "./pages/analysis-workflow.js";
import { navigation } from "./components/navigation.js";

export class App {
  private dashboardPage: DashboardPage;
  private analysesPage: AnalysesPage;
  private analysisWorkflow: AnalysisWorkflow;

  constructor() {
    // Initialize pages
    this.dashboardPage = new DashboardPage();
    this.analysesPage = new AnalysesPage();
    this.analysisWorkflow = new AnalysisWorkflow();

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
      await this.handleAnalysisStart();
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

    // Setup form event listeners
    this.setupAnalysisFormListeners();
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

  private setupAnalysisFormListeners(): void {
    const analyzeForm = document.getElementById("analyzeForm") as HTMLFormElement;
    const startBtn = document.getElementById("startAnalysisBtn");

    if (!analyzeForm || !startBtn) {
      console.warn("Analysis form elements not found");
      return;
    }

    // Remove existing listeners to avoid duplicates
    const newForm = analyzeForm.cloneNode(true) as HTMLFormElement;
    analyzeForm.parentNode?.replaceChild(newForm, analyzeForm);

    const newStartBtn = document.getElementById("startAnalysisBtn");
    if (!newStartBtn) return;

    // Handle form submission
    newForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleAnalysisStart();
    });

    // Handle Enter key in input fields
    const formInputs = newForm.querySelectorAll("input, select");
    formInputs.forEach((input) => {
      input.addEventListener("keydown", (e) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          newStartBtn.click();
        }
      });
    });
  }

  private async handleAnalysisStart(): Promise<void> {
    const startBtn = document.getElementById("startAnalysisBtn") as HTMLButtonElement;
    const websiteUrlEl = document.getElementById("websiteUrl") as HTMLInputElement;
    const countryEl = document.getElementById("country") as HTMLInputElement;
    const languageEl = document.getElementById("language") as unknown as HTMLSelectElement;
    const regionEl = document.getElementById("region") as HTMLInputElement;
    const questionsPerCategoryEl = document.getElementById("questionsPerCategory") as HTMLInputElement;

    if (!websiteUrlEl || !countryEl || !languageEl) {
      alert("Form fields not found. Please reload the page.");
      return;
    }

    try {
      // Disable button and show loading state
      if (startBtn) {
        startBtn.disabled = true;
        const originalText = startBtn.textContent;
        startBtn.textContent = "Starting Analysis...";

        try {
          const formData = {
            websiteUrl: websiteUrlEl.value,
            country: countryEl.value,
            language: languageEl.value,
            region: regionEl?.value || undefined,
            questionsPerCategory: questionsPerCategoryEl
              ? parseInt(questionsPerCategoryEl.value) || 3
              : 3,
          };

          await this.analysisWorkflow.startAnalysis(formData);
        } finally {
          // Re-enable button
          if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = originalText || "Start Analysis";
          }
        }
      }
    } catch (error) {
      console.error("Error starting analysis:", error);
      alert(error instanceof Error ? error.message : "Failed to start analysis");
    }
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

