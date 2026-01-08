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
          Loading analyses...
        </div>
      `;

      const analyses = await analysisService.getAllAnalyses();

      if (analyses.length === 0) {
        this.analysesList.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--text-secondary); grid-column: 1 / -1;">
            No analyses yet. Start a new analysis!
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
          Error loading analyses: ${error instanceof Error ? error.message : "Unknown error"}
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
      ? new Date(analysis.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unknown";

    return `
      <div class="analysis-card" data-run-id="${analysis.id}">
        <div class="analysis-card-header">
          <h4>${analysis.website_url || "Unknown URL"}</h4>
          <span class="analysis-status" style="color: ${statusColor}">
            ${this.getStatusText(status)}
          </span>
        </div>
        <div class="analysis-card-body">
          <p><strong>Country:</strong> ${analysis.country || "N/A"}</p>
          <p><strong>Language:</strong> ${analysis.language || "N/A"}</p>
          <p><strong>Created:</strong> ${date}</p>
        </div>
        <div class="analysis-card-actions">
          <button class="btn btn-primary" data-action="view" data-run-id="${analysis.id}">
            View Details
          </button>
          <button class="btn" data-action="delete" data-run-id="${analysis.id}" style="background: var(--error); color: white;">
            Delete
          </button>
        </div>
      </div>
    `;
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      completed: "✓ Completed",
      running: "⟳ Running...",
      failed: "✗ Failed",
      pending: "⏳ Pending",
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
        if (runId && confirm("Are you sure you want to delete this analysis?")) {
          await this.deleteAnalysis(runId);
        }
      });
    });
  }

  private async viewAnalysis(runId: string): Promise<void> {
    try {
      // Get prompts and summary for this analysis
      const data = await analysisService.getAnalysisPromptsAndSummary(runId);
      const { prompts = [], summary } = data;

      // Show the analysis detail section
      const analysesSection = getElement("analysesSection");
      const analysisDetailSection = getElement("analysisDetailSection");

      if (analysesSection) hideElement(analysesSection);
      if (analysisDetailSection) {
        showElement(analysisDetailSection);
        this.renderAnalysisDetail(runId, prompts, summary);
      }
    } catch (error) {
      console.error("Error viewing analysis:", error);
      alert(`Error loading analysis: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private renderAnalysisDetail(runId: string, prompts: any[], summary: any): void {
    const analysisDetailSection = getElement("analysisDetailSection");
    if (!analysisDetailSection) return;

    let html = `
      <div style="padding: 20px;">
        <button class="btn" onclick="window.analysesPage?.goBackToList()" style="margin-bottom: 20px; background: var(--gray-100); color: var(--gray-700);">
          ← Zurück zur Liste
        </button>
        
        <div style="color: green; padding: 20px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50; margin-bottom: 20px;">
          <h3>📊 Gespeicherte Analyse</h3>
          <p><strong>Run ID:</strong> ${runId}</p>
          <p>Diese Analyse wurde gespeichert und kann jederzeit abgerufen werden.</p>
        </div>
    `;

    // Display Summary with mentions and citations
    if (summary) {
      html += `
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; color: #333;">📊 Zusammenfassung (Fazit)</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="padding: 15px; background: #f5f5f5; border-radius: 6px;">
              <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${summary.totalMentions || 0}</div>
              <div style="color: #666; font-size: 14px;">Erwähnungen (außerhalb von markierten Quellen)</div>
            </div>
            <div style="padding: 15px; background: #f5f5f5; border-radius: 6px;">
              <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${summary.totalCitations || 0}</div>
              <div style="color: #666; font-size: 14px;">Zitierungen (Firmenlink als Quelle)</div>
            </div>
          </div>
          
          ${summary.bestPrompts && summary.bestPrompts.length > 0 ? `
            <h4 style="color: #333; margin-top: 20px;">🏆 Beste Prompts (Top ${Math.min(summary.bestPrompts.length, 10)})</h4>
            <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Die besten Fragen basierend auf Erwähnungen und Zitierungen:</p>
            <ul style="list-style: none; padding: 0;">
              ${summary.bestPrompts.slice(0, 10).map((p: any, idx: number) => `
                <li style="padding: 12px; margin: 8px 0; background: #f9f9f9; border-left: 4px solid #4CAF50; border-radius: 4px;">
                  <div style="font-weight: 500; color: #333; margin-bottom: 5px;">
                    ${idx + 1}. ${p.question}
                  </div>
                  <div style="font-size: 12px; color: #666; margin-top: 5px; display: flex; gap: 15px;">
                    <span>📌 Erwähnungen: <strong>${p.mentions || 0}</strong></span>
                    <span>🔗 Zitierungen: <strong>${p.citations || 0}</strong></span>
                  </div>
                </li>
              `).join('')}
            </ul>
          ` : ''}
          
          ${summary.otherSources && Object.keys(summary.otherSources).length > 0 ? `
            <h4 style="color: #333; margin-top: 30px;">🔗 Andere Quellen (außer eigener Firma)</h4>
            <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Häufigkeit der Quellen in den Antworten:</p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${Object.entries(summary.otherSources)
                .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                .slice(0, 20)
                .map(([domain, count]: [string, any]) => `
                  <div style="padding: 10px; background: #f5f5f5; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #333; font-size: 14px; word-break: break-all;">${domain}</span>
                    <span style="color: #2196F3; font-weight: bold; font-size: 14px; margin-left: 10px;">${count}x</span>
                  </div>
                `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    // Display all questions with answers
    if (prompts && prompts.length > 0) {
      html += `
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; color: #333;">❓ Fragen und Antworten</h3>
          <p style="color: #666; margin-bottom: 15px;">Alle gestellten Fragen mit ihren Antworten:</p>
          <div style="max-height: 600px; overflow-y: auto;">
            <div style="display: flex; flex-direction: column; gap: 15px;">
              ${prompts.map((prompt: any, index: number) => `
                <div style="padding: 15px; border: 2px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
                  <div style="margin-bottom: 10px;">
                    <div style="font-weight: 600; color: #333; font-size: 15px; margin-bottom: 8px;">
                      ${index + 1}. ${prompt.question || 'Keine Frage'}
                    </div>
                    ${prompt.categoryName ? `
                      <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                        Kategorie: <span style="background: #e3f2fd; padding: 3px 8px; border-radius: 3px;">${prompt.categoryName}</span>
                      </div>
                    ` : ''}
                  </div>
                  ${prompt.answer ? `
                    <details style="margin-top: 10px;" open>
                      <summary style="cursor: pointer; color: #2196F3; font-size: 14px; font-weight: 500; margin-bottom: 10px;">Antwort anzeigen</summary>
                      <div style="margin-top: 10px; padding: 15px; background: white; border-radius: 4px; border-left: 3px solid #2196F3; font-size: 14px; color: #555; line-height: 1.6; white-space: pre-wrap;">
                        ${prompt.answer}
                      </div>
                    </details>
                  ` : '<div style="color: #999; font-size: 12px; margin-top: 5px;">Noch keine Antwort</div>'}
                  ${prompt.mentions !== undefined || prompt.citations !== undefined ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
                      <span style="margin-right: 15px;">📌 Erwähnungen: <strong>${prompt.mentions || 0}</strong></span>
                      <span>🔗 Zitierungen: <strong>${prompt.citations || 0}</strong></span>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      html += `
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="color: #666;">Keine Fragen gefunden für diese Analyse.</p>
        </div>
      `;
    }

    html += `</div>`;
    analysisDetailSection.innerHTML = html;
  }

  goBackToList(): void {
    const analysesSection = getElement("analysesSection");
    const analysisDetailSection = getElement("analysisDetailSection");

    if (analysesSection) showElement(analysesSection);
    if (analysisDetailSection) hideElement(analysisDetailSection);
    
    this.loadAnalyses();
  }

  private async deleteAnalysis(runId: string): Promise<void> {
    try {
      await analysisService.deleteAnalysis(runId);
      // Reload analyses
      await this.loadAnalyses();
    } catch (error) {
      console.error("Error deleting analysis:", error);
      alert(`Error deleting: ${error instanceof Error ? error.message : "Unknown error"}`);
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

// Export instance for global access
(window as any).analysesPage = new AnalysesPage();

