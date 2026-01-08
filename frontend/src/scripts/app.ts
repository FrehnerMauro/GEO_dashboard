/**
 * Main Application Entry Point
 * Initializes the application and sets up page routing
 */

import { DashboardPage } from "./pages/dashboard-page.js";
import { AnalysesPage } from "./pages/analyses-page.js";
import { AnalysisWorkflow } from "./pages/analysis-workflow.js";
import { ReadabilityWorkflow } from "./pages/readability-workflow.js";
import { navigation } from "./components/navigation.js";

export class App {
  private dashboardPage: DashboardPage;
  private analysesPage: AnalysesPage;
  private analysisWorkflow: AnalysisWorkflow;
  private readabilityWorkflow: ReadabilityWorkflow;

  constructor() {
    // Initialize pages
    this.dashboardPage = new DashboardPage();
    this.analysesPage = new AnalysesPage();
    this.analysisWorkflow = new AnalysisWorkflow();
    this.readabilityWorkflow = new ReadabilityWorkflow();

    // Setup global navigation functions
    this.setupGlobalFunctions();
  }

  private setupGlobalFunctions(): void {
    // Make analysisWorkflow globally available for onclick handlers
    (window as any).analysisWorkflow = this.analysisWorkflow;

    // These functions are called from HTML onclick handlers
    (window as any).showDashboard = (event?: Event) => {
      if (event) event.preventDefault();
      // Hide all sections first to prevent chaos
      this.hideAllSections();
      this.dashboardPage.show();
    };

    (window as any).showAnalyses = (event?: Event) => {
      if (event) event.preventDefault();
      // Hide all sections first to prevent chaos
      this.hideAllSections();
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

  /**
   * Hide all sections and reset state - prevents chaos when switching menus
   */
  private hideAllSections(): void {
    // Hide all main sections
    const sections = [
      "dashboardSection",
      "aiAnalysisSection",
      "aiReadabilitySection",
      "analysesSection",
      "analysisDetailSection",
    ];

    sections.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.style.display = "none";
        section.classList.remove("show");
        section.classList.add("hidden");
      }
    });

    // Hide/Reset analysis progress
    const analysisProgress = document.getElementById("analysisProgress");
    if (analysisProgress) {
      analysisProgress.style.display = "none";
    }

    // Hide/Reset loading states
    const loading = document.getElementById("loading");
    if (loading) {
      loading.style.display = "none";
      loading.classList.remove("show");
    }

    // Hide/Reset result sections
    const result = document.getElementById("result");
    if (result) {
      result.style.display = "none";
      result.classList.remove("show");
    }

    // Reset configuration card visibility
    const configurationCard = document.getElementById("configurationCard");
    if (configurationCard) {
      configurationCard.style.display = "block";
      configurationCard.classList.remove("hidden");
    }

    // Clear any running workflows
    if (this.analysisWorkflow) {
      // Reset workflow state if needed
      (this.analysisWorkflow as any).workflowData = null;
    }
  }

  private showAIAnalysisSection(): void {
    // First, hide all sections to prevent chaos
    this.hideAllSections();

    // Now show the AI Analysis section
    const aiAnalysisSection = document.getElementById("aiAnalysisSection");
    if (aiAnalysisSection) {
      aiAnalysisSection.style.display = "flex"; // Use flex to match CSS
      // Make sure the configuration card is visible
      const configurationCard = document.getElementById("configurationCard");
      if (configurationCard) {
        configurationCard.style.display = "block";
        configurationCard.classList.remove("hidden");
      }
    }

    // Update header
    const headerTitle = document.getElementById("headerTitle");
    if (headerTitle) headerTitle.textContent = "Prompt Analyse";

    // Update navigation
    navigation.setActiveNavItem(1);

    // Setup form event listeners
    this.setupAnalysisFormListeners();
  }

  private showAIReadabilitySection(): void {
    // First, hide all sections to prevent chaos
    this.hideAllSections();

    // Now show the AI Readability section
    const aiReadabilitySection = document.getElementById("aiReadabilitySection");
    if (aiReadabilitySection) {
      aiReadabilitySection.style.display = "flex"; // Use flex to match CSS
    }

    // Update header
    const headerTitle = document.getElementById("headerTitle");
    if (headerTitle) headerTitle.textContent = "AI Readability";

    // Update navigation
    navigation.setActiveNavItem(2);

    // Setup form event listeners
    this.setupReadabilityFormListeners();
  }

  private setupReadabilityFormListeners(): void {
    const readabilityForm = document.getElementById("readabilityForm") as HTMLFormElement;
    const fetchContentBtn = document.getElementById("fetchContentBtn") as HTMLButtonElement;
    const readabilityUrl = document.getElementById("readabilityUrl") as HTMLInputElement;

    if (!readabilityForm || !fetchContentBtn || !readabilityUrl) {
      console.warn("Readability form elements not found");
      return;
    }

    // Remove existing listeners to avoid duplicates
    const newForm = readabilityForm.cloneNode(true) as HTMLFormElement;
    readabilityForm.parentNode?.replaceChild(newForm, readabilityForm);

    const newFetchBtn = document.getElementById("fetchContentBtn") as HTMLButtonElement;
    const newUrlInput = document.getElementById("readabilityUrl") as HTMLInputElement;
    if (!newFetchBtn || !newUrlInput) return;

    // Handle button click
    newFetchBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleReadabilityStart();
    });

    // Handle form submission
    newForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleReadabilityStart();
    });

    // Handle Enter key in input field
    newUrlInput.addEventListener("keydown", (e) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        newFetchBtn.click();
      }
    });
  }

  private async handleReadabilityStart(): Promise<void> {
    const fetchContentBtn = document.getElementById("fetchContentBtn") as HTMLButtonElement;
    const readabilityUrl = document.getElementById("readabilityUrl") as HTMLInputElement;

    if (!readabilityUrl) {
      alert("URL input field not found. Please reload the page.");
      return;
    }

    const url = readabilityUrl.value;
    if (!url || !url.trim()) {
      alert("Please enter a URL.");
      return;
    }

    try {
      if (fetchContentBtn) {
        fetchContentBtn.disabled = true;
        fetchContentBtn.textContent = "Analyzing...";
      }

      await this.readabilityWorkflow.startAnalysis(url);
    } catch (error) {
      console.error("Error starting readability analysis:", error);
      alert(error instanceof Error ? error.message : "Failed to start analysis");
    } finally {
      if (fetchContentBtn) {
        fetchContentBtn.disabled = false;
        fetchContentBtn.textContent = "Start AI Readiness Analysis";
      }
    }
  }

  init(): void {
    // Initialize navigation
    console.log("GEO Dashboard initialized");

    // Show dashboard by default
    this.dashboardPage.show();
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

