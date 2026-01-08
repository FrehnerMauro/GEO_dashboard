/**
 * Dashboard Page - Main dashboard with Local/Global view
 */

import { getElement, showElement, hideElement, querySelector } from "../utils/dom-utils.js";
import { analysisService } from "../services/analysis-service.js";
import { navigation } from "../components/navigation.js";

type ViewMode = "local" | "global";

export class DashboardPage {
  private dashboardSection: HTMLElement | null;
  private viewMode: ViewMode = "local";
  private selectedCompanyId: string | null = null;
  private selectedCategory: string | null = null;

  constructor() {
    this.dashboardSection = getElement("dashboardSection");
    this.initialize();
  }

  private initialize(): void {
    this.render();
  }

  private async render(): Promise<void> {
    if (!this.dashboardSection) return;

    this.dashboardSection.innerHTML = `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <div class="view-toggle">
            <button class="toggle-btn ${this.viewMode === "local" ? "active" : ""}" data-mode="local">
              Lokal
            </button>
            <button class="toggle-btn ${this.viewMode === "global" ? "active" : ""}" data-mode="global">
              Global
            </button>
          </div>
        </div>
        <div class="dashboard-content">
          ${this.viewMode === "local" ? await this.renderLocalView() : await this.renderGlobalView()}
        </div>
      </div>
    `;

    // Attach event listeners
    const toggleButtons = this.dashboardSection.querySelectorAll(".toggle-btn");
    toggleButtons.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const mode = (e.target as HTMLElement).dataset.mode as ViewMode;
        if (mode) {
          this.viewMode = mode;
          this.selectedCompanyId = null;
          this.selectedCategory = null;
          this.render();
        }
      });
    });

    // Attach company selection listeners
    if (this.viewMode === "local") {
      const companyCards = this.dashboardSection.querySelectorAll(".company-card");
      companyCards.forEach(card => {
        card.addEventListener("click", async (e) => {
          const companyId = (e.currentTarget as HTMLElement).dataset.companyId;
          if (companyId) {
            this.selectedCompanyId = companyId;
            (this as any).selectedAnalysisId = null;
            await this.render();
          }
        });
      });
      
      // Attach analysis selection listeners
      const analysisCards = this.dashboardSection.querySelectorAll(".analysis-card");
      analysisCards.forEach(card => {
        card.addEventListener("click", async (e) => {
          const runId = (e.currentTarget as HTMLElement).dataset.runId;
          if (runId) {
            (this as any).selectedAnalysisId = runId;
            await this.render();
          }
        });
      });
    }

    // Attach category selection listeners
    if (this.viewMode === "global") {
      const categoryCards = this.dashboardSection.querySelectorAll(".category-card");
      categoryCards.forEach(card => {
        card.addEventListener("click", async (e) => {
          const categoryName = (e.currentTarget as HTMLElement).dataset.categoryName;
          if (categoryName) {
            this.selectedCategory = categoryName;
            await this.render();
          }
        });
      });
    }
  }

  private async renderLocalView(): Promise<string> {
    try {
      const companies = await analysisService.getAllCompanies();
      
      // Check if we have a selected analysis ID (new property)
      const selectedAnalysisId = (this as any).selectedAnalysisId;
      
      if (selectedAnalysisId) {
        // Show analysis questions and summary
        try {
          const promptsSummaryData = await analysisService.getAnalysisPromptsAndSummary(selectedAnalysisId);
          const prompts = promptsSummaryData.prompts || [];
          const summary = promptsSummaryData.summary;
          
          let promptsHtml = '';
          if (prompts.length > 0) {
            promptsHtml = `
              <div class="summary-section" style="margin-bottom: 32px;">
                <h4 style="margin-bottom: 16px; font-size: 18px; font-weight: 700; color: var(--text);">Fragen der Analyse</h4>
                <div class="prompts-list" style="display: flex; flex-direction: column; gap: 16px;">
                  ${prompts.map((prompt: any, idx: number) => `
                    <div class="prompt-card" style="padding: 16px; background: var(--bg-glass); border: 1px solid var(--border-light); border-radius: 8px;">
                      <div style="display: flex; align-items: start; gap: 12px;">
                        <span style="flex-shrink: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; border-radius: 50%; font-weight: 700; font-size: 14px;">${idx + 1}</span>
                        <div style="flex: 1;">
                          <p style="margin: 0; font-weight: 500; color: var(--text); line-height: 1.5;">${prompt.question}</p>
                          ${prompt.categoryName ? `
                            <span style="display: inline-block; margin-top: 8px; padding: 4px 8px; background: rgba(99, 102, 241, 0.1); color: #6366f1; border-radius: 4px; font-size: 12px;">${prompt.categoryName}</span>
                          ` : ''}
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
              </div>
            `;
          }
          
          let summaryHtml = '';
          if (summary) {
            const bestPrompts = summary.bestPrompts || [];
            const otherSources = summary.otherSources || {};
            
            let bestPromptsHtml = '';
            if (bestPrompts.length > 0) {
              bestPromptsHtml = `
                <div style="margin-top: 16px;">
                  <h5 style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9);">Beste Prompts:</h5>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    ${bestPrompts.slice(0, 5).map((p: any) => `
                      <li style="padding: 8px 12px; margin-bottom: 8px; background: rgba(255,255,255,0.1); border-radius: 6px; border-left: 3px solid white;">
                        <div style="font-size: 13px; color: white;">${p.question}</div>
                        <div style="margin-top: 4px; font-size: 11px; opacity: 0.9;">
                          Erwähnungen: ${p.mentions}, Zitierungen: ${p.citations}
                        </div>
                      </li>
                    `).join("")}
                  </ul>
                </div>
              `;
            }
            
            let otherSourcesHtml = '';
            const sourceEntries = Object.entries(otherSources);
            if (sourceEntries.length > 0) {
              otherSourcesHtml = `
                <div style="margin-top: 16px;">
                  <h5 style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9);">Andere Quellen:</h5>
                  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px;">
                    ${sourceEntries.slice(0, 10).map(([source, count]) => `
                      <div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 700; color: white;">${count}</div>
                        <div style="font-size: 11px; opacity: 0.9; word-break: break-word; margin-top: 4px;">${source}</div>
                      </div>
                    `).join("")}
                  </div>
                </div>
              `;
            }
            
            summaryHtml = `
              <div class="summary-section" style="padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; margin-bottom: 32px;">
                <h4 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: white;">📊 Fazit</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 20px;">
                  <div style="padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px); text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">${summary.totalMentions || 0}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Anzahl Erwähnungen</div>
                  </div>
                  <div style="padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px); text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">${summary.totalCitations || 0}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Anzahl Zitierungen</div>
                  </div>
                </div>
                ${bestPromptsHtml}
                ${otherSourcesHtml}
              </div>
            `;
          } else {
            summaryHtml = `
              <div class="summary-section" style="padding: 16px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px; margin-bottom: 32px;">
                <p style="margin: 0; color: var(--text-secondary); font-style: italic;">Kein Fazit verfügbar für diese Analyse.</p>
              </div>
            `;
          }
          
          return `
            <div class="local-view">
              <button class="back-btn" onclick="window.dashboardPage?.goBack()">← Zurück</button>
              <h3 style="margin-bottom: 24px;">Analyse-Details</h3>
              ${promptsHtml}
              ${summaryHtml}
            </div>
          `;
        } catch (error) {
          console.error("Error loading analysis:", error);
          return `
            <div class="error-state">
              <p>Fehler beim Laden der Analyse: ${error instanceof Error ? error.message : "Unbekannter Fehler"}</p>
              <button class="back-btn" onclick="(window.dashboardPage as any).selectedAnalysisId = null; window.dashboardPage?.render();">← Zurück</button>
            </div>
          `;
        }
      } else if (this.selectedCompanyId) {
        // Show analyses for selected company
        const analyses = await analysisService.getCompanyAnalyses(this.selectedCompanyId);
        const company = companies.find(c => c.id === this.selectedCompanyId);
        
        return `
          <div class="local-view">
            <button class="back-btn" onclick="window.dashboardPage?.goBack()">← Zurück</button>
            <h3>Analysen: ${company?.name || company?.websiteUrl || "Unbekannt"}</h3>
            <div class="analyses-grid">
              ${analyses.length === 0 
                ? '<div class="empty-state">Keine Analysen gefunden</div>'
                : analyses.map(analysis => `
                  <div class="analysis-card" data-run-id="${analysis.id}">
                    <div class="analysis-header">
                      <h4>${new URL(analysis.websiteUrl).hostname}</h4>
                      <span class="status-badge ${analysis.status}">${analysis.status}</span>
                    </div>
                    <div class="analysis-details">
                      <div class="detail-item">
                        <span class="label">Land:</span>
                        <span>${analysis.country}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Sprache:</span>
                        <span>${analysis.language}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Erstellt:</span>
                        <span>${new Date(analysis.createdAt).toLocaleDateString("de-DE")}</span>
                      </div>
                    </div>
                  </div>
                `).join("")
              }
            </div>
          </div>
        `;
      } else {
        // Show company list
        return `
          <div class="local-view">
            <h3>Verfügbare Firmen</h3>
            <div class="companies-grid">
              ${companies.length === 0 
                ? '<div class="empty-state">Keine Firmen gefunden</div>'
                : companies.map(company => `
                  <div class="company-card" data-company-id="${company.id}">
                    <div class="company-header">
                      <h4>${company.name}</h4>
                    </div>
                    <div class="company-details">
                      <div class="detail-item">
                        <span class="label">Website:</span>
                        <span>${company.websiteUrl}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Land:</span>
                        <span>${company.country}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Sprache:</span>
                        <span>${company.language}</span>
                      </div>
                    </div>
                  </div>
                `).join("")
              }
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error("Error loading local view:", error);
      return `
        <div class="error-state">
          <p>Fehler beim Laden der Daten: ${error instanceof Error ? error.message : "Unbekannter Fehler"}</p>
        </div>
      `;
    }
  }

  private async renderGlobalView(): Promise<string> {
    try {
      if (this.selectedCategory) {
        // Show prompts for selected category
        const prompts = await analysisService.getGlobalPromptsByCategory(this.selectedCategory);
        
        // Debug: Log prompts to see if answers are included
        console.log('Prompts with answers:', prompts.map(p => ({ question: p.question.substring(0, 50), hasAnswer: !!p.answer, answerLength: p.answer?.length || 0 })));
        
        return `
          <div class="global-view">
            <button class="back-btn" onclick="window.dashboardPage?.goBack()">← Zurück</button>
            <h3>Kategorie: ${this.selectedCategory}</h3>
            <div class="prompts-list">
              ${prompts.length === 0 
                ? '<div class="empty-state">Keine Fragen in dieser Kategorie gefunden</div>'
                : prompts.map(prompt => `
                  <div class="prompt-card">
                    <div class="prompt-question">
                      <h4>Frage:</h4>
                      <p>${prompt.question}</p>
                    </div>
                    ${prompt.answer && prompt.answer.trim() ? `
                      <div class="prompt-answer">
                        <h4>Antwort:</h4>
                        <div style="max-height: 500px; overflow-y: auto; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-top: 12px;">
                          <p style="white-space: pre-wrap; line-height: 1.6;">${prompt.answer}</p>
                        </div>
                      </div>
                    ` : prompt.answer === null || prompt.answer === undefined ? `
                      <div class="prompt-answer" style="opacity: 0.6;">
                        <h4>Antwort:</h4>
                        <p style="font-style: italic;">Keine Antwort verfügbar</p>
                      </div>
                    ` : ''}
                    <div class="prompt-details">
                      <div class="detail-item">
                        <span class="label">Website:</span>
                        <span>${new URL(prompt.websiteUrl).hostname}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Sprache:</span>
                        <span>${prompt.language}</span>
                      </div>
                      ${prompt.country ? `
                        <div class="detail-item">
                          <span class="label">Land:</span>
                          <span>${prompt.country}</span>
                        </div>
                      ` : ""}
                      <div class="detail-item">
                        <span class="label">Erstellt:</span>
                        <span>${new Date(prompt.createdAt).toLocaleDateString("de-DE")}</span>
                      </div>
                    </div>
                  </div>
                `).join("")
              }
            </div>
          </div>
        `;
      } else {
        // Show category list
        const categories = await analysisService.getGlobalCategories();
        
        return `
          <div class="global-view">
            <h3>Alle Kategorien</h3>
            <div class="categories-grid">
              ${categories.length === 0 
                ? '<div class="empty-state">Keine Kategorien gefunden</div>'
                : categories.map(category => `
                  <div class="category-card" data-category-name="${category.name}">
                    <div class="category-header">
                      <h4>${category.name}</h4>
                      <span class="count-badge">${category.count}</span>
                    </div>
                    <div class="category-description">
                      <p>${category.description || "Keine Beschreibung"}</p>
                    </div>
                  </div>
                `).join("")
              }
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error("Error loading global view:", error);
      return `
        <div class="error-state">
          <p>Fehler beim Laden der Daten: ${error instanceof Error ? error.message : "Unbekannter Fehler"}</p>
        </div>
      `;
    }
  }

  goBack(): void {
    if (this.viewMode === "local") {
      if ((this as any).selectedAnalysisId) {
        (this as any).selectedAnalysisId = null;
      } else {
        this.selectedCompanyId = null;
      }
    } else {
      this.selectedCategory = null;
    }
    this.render();
  }

  show(): void {
    const configurationCard = querySelector(".content-area > .card");
    const analysesSection = getElement("analysesSection");
    const analysisDetailSection = getElement("analysisDetailSection");

    hideElement(configurationCard);
    hideElement(analysesSection);
    hideElement(analysisDetailSection);
    
    if (this.dashboardSection) {
      showElement(this.dashboardSection);
    }
    
    navigation.setActiveNavItem(0);
    this.render();
  }
}

// Export global function for backward compatibility
(window as any).showDashboard = (event?: Event) => {
  if (event) event.preventDefault();
  if (!(window as any).dashboardPage) {
    (window as any).dashboardPage = new DashboardPage();
  }
  (window as any).dashboardPage.show();
};

