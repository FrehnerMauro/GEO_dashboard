/**
 * Dashboard Page - Main analysis configuration page
 */

import { getElement, showElement, hideElement, querySelector } from "../utils/dom-utils.js";
import { normalizeUrl, validateUrl } from "../utils/url-utils.js";
import { analysisService } from "../services/analysis-service.js";
import { navigation } from "../components/navigation.js";

export class DashboardPage {
  private form: HTMLFormElement | null;
  private startBtn: HTMLButtonElement | null;
  private websiteUrlInput: HTMLInputElement | null;

  constructor() {
    this.form = getElement<HTMLFormElement>("analyzeForm");
    this.startBtn = getElement<HTMLButtonElement>("startAnalysisBtn");
    this.websiteUrlInput = getElement<HTMLInputElement>("websiteUrl");
    
    this.initialize();
  }

  private initialize(): void {
    if (this.startBtn) {
      this.startBtn.addEventListener("click", () => this.handleStartAnalysis());
    }
  }

  private async handleStartAnalysis(): Promise<void> {
    if (!this.form || !this.websiteUrlInput) return;

    const formData = new FormData(this.form);
    let websiteUrl = (formData.get("websiteUrl") as string)?.trim() || "";

    if (!websiteUrl) {
      alert("Bitte geben Sie eine Website-URL ein.");
      return;
    }

    // Normalize URL
    websiteUrl = normalizeUrl(websiteUrl);
    if (!validateUrl(websiteUrl)) {
      alert("Ungültige URL. Bitte geben Sie eine gültige URL ein.");
      return;
    }

    // Update input field
    this.websiteUrlInput.value = websiteUrl;

    const country = (formData.get("country") as string) || "";
    const language = (formData.get("language") as string) || "";
    const region = (formData.get("region") as string) || "";
    const questionsPerCategory = parseInt((formData.get("questionsPerCategory") as string) || "3");

    try {
      if (this.startBtn) {
        this.startBtn.disabled = true;
        this.startBtn.textContent = "Starte Analyse...";
      }

      const result = await analysisService.startAnalysis({
        websiteUrl,
        country,
        language,
        region,
        questionsPerCategory,
      });

      // Redirect to analysis status page or show progress
      console.log("Analysis started:", result);
      // TODO: Implement progress tracking
    } catch (error) {
      console.error("Error starting analysis:", error);
      alert(`Fehler beim Starten der Analyse: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
    } finally {
      if (this.startBtn) {
        this.startBtn.disabled = false;
        this.startBtn.textContent = "Analyse starten";
      }
    }
  }

  show(): void {
    const configurationCard = querySelector(".content-area > .card");
    const analysesSection = getElement("analysesSection");
    const analysisDetailSection = getElement("analysisDetailSection");
    const aiReadinessSection = getElement("aiReadinessSection");

    showElement(configurationCard);
    hideElement(analysesSection);
    hideElement(analysisDetailSection);
    hideElement(aiReadinessSection);
    
    navigation.setActiveNavItem(0);
  }
}

// Export global function for backward compatibility
(window as any).showDashboard = (event?: Event) => {
  if (event) event.preventDefault();
  const page = new DashboardPage();
  page.show();
};

