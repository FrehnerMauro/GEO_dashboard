/**
 * Analyses Page - List and manage saved analyses
 */

import { getElement, showElement, hideElement, querySelector } from "../utils/dom-utils.js";
import { analysisService } from "../services/analysis-service.js";
import { navigation } from "../components/navigation.js";

export class AnalysesPage {
  private analysesList: HTMLElement | null;

  constructor() {
    this.analysesList = getElement("analysesList");
    this.initialize();
  }

  private initialize(): void {
    // Load analyses when page is shown
  }

  async loadAnalyses(): Promise<void> {
    if (!this.analysesList) return;

    try {
      // Show loading state
      this.analysesList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary); grid-column: 1 / -1;">
          Lade Analysen...
        </div>
      `;

      const analyses = await analysisService.getAllAnalyses();

      if (analyses.length === 0) {
        this.analysesList.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--text-secondary); grid-column: 1 / -1;">
            Noch keine Analysen vorhanden. Starten Sie eine neue Analyse!
          </div>
        `;
        return;
      }

      // Render analyses
      this.analysesList.innerHTML = analyses
        .map((analysis) => this.renderAnalysisCard(analysis))
        .join("");

      // Attach event listeners
      this.attachEventListeners();
    } catch (error) {
      console.error("Error loading analyses:", error);
      this.analysesList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--error); grid-column: 1 / -1;">
          Fehler beim Laden der Analysen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}
        </div>
      `;
    }
  }

  private renderAnalysisCard(analysis: any): string {
    const status = analysis.status || "unknown";
    const statusColor =
      status === "completed"
        ? "var(--success)"
        : status === "failed"
        ? "var(--error)"
        : status === "running"
        ? "var(--warning)"
        : "var(--text-secondary)";

    const date = analysis.created_at
      ? new Date(analysis.created_at).toLocaleDateString("de-DE", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unbekannt";

    return `
      <div class="analysis-card" data-run-id="${analysis.id}">
        <div class="analysis-card-header">
          <h4>${analysis.website_url || "Unbekannte URL"}</h4>
          <span class="analysis-status" style="color: ${statusColor}">
            ${this.getStatusText(status)}
          </span>
        </div>
        <div class="analysis-card-body">
          <p><strong>Land:</strong> ${analysis.country || "N/A"}</p>
          <p><strong>Sprache:</strong> ${analysis.language || "N/A"}</p>
          <p><strong>Erstellt:</strong> ${date}</p>
        </div>
        <div class="analysis-card-actions">
          <button class="btn btn-primary" data-action="view" data-run-id="${analysis.id}">
            Details anzeigen
          </button>
          <button class="btn" data-action="delete" data-run-id="${analysis.id}" style="background: var(--error); color: white;">
            Löschen
          </button>
        </div>
      </div>
    `;
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      completed: "✓ Abgeschlossen",
      running: "⟳ Läuft...",
      failed: "✗ Fehlgeschlagen",
      pending: "⏳ Wartend",
    };
    return statusMap[status] || status;
  }

  private attachEventListeners(): void {
    // View button
    this.analysesList?.querySelectorAll('[data-action="view"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const runId = (e.target as HTMLElement).getAttribute("data-run-id");
        if (runId) {
          this.viewAnalysis(runId);
        }
      });
    });

    // Delete button
    this.analysesList?.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const runId = (e.target as HTMLElement).getAttribute("data-run-id");
        if (runId && confirm("Möchten Sie diese Analyse wirklich löschen?")) {
          await this.deleteAnalysis(runId);
        }
      });
    });
  }

  private async viewAnalysis(runId: string): Promise<void> {
    // Navigate to analysis detail page
    // This will be implemented in AnalysisDetailPage
    console.log("View analysis:", runId);
    // TODO: Implement navigation to detail page
  }

  private async deleteAnalysis(runId: string): Promise<void> {
    try {
      await analysisService.deleteAnalysis(runId);
      // Reload analyses
      await this.loadAnalyses();
    } catch (error) {
      console.error("Error deleting analysis:", error);
      alert(`Fehler beim Löschen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
    }
  }

  show(): void {
    const analysesSection = getElement("analysesSection");
    const analysisDetailSection = getElement("analysisDetailSection");
    const configurationCard = querySelector(".content-area > .card");

    showElement(analysesSection);
    hideElement(analysisDetailSection);
    hideElement(configurationCard);

    navigation.setActiveNavItem(1);
    this.loadAnalyses();
  }
}

// Export global function for backward compatibility
(window as any).showAnalyses = (event?: Event) => {
  if (event) event.preventDefault();
  const page = new AnalysesPage();
  page.show();
};

// Export for use in other modules
(window as any).loadAnalyses = async () => {
  const page = new AnalysesPage();
  await page.loadAnalyses();
};

