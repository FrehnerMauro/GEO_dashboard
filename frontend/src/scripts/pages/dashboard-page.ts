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
          <h2>Dashboard</h2>
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
      
      if (this.selectedCompanyId) {
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
                      <h4>${prompt.question}</h4>
                    </div>
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
      this.selectedCompanyId = null;
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

