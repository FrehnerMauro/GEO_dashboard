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
              Local
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
                <h4 style="margin-bottom: 16px; font-size: 18px; font-weight: 700; color: var(--text);">Analysis Questions</h4>
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
                <div style="margin-top: 32px; padding: 28px; background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); border-radius: 16px; backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <span style="font-size: 28px;">🏆</span>
                    <h5 style="margin: 0; font-size: 20px; font-weight: 700; color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">Top Prompts</h5>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 16px;">
                    ${bestPrompts.slice(0, 5).map((p: any, idx: number) => `
                      <div style="padding: 20px; background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%); border-radius: 12px; border-left: 4px solid rgba(255,255,255,0.8); box-shadow: 0 4px 16px rgba(0,0,0,0.1); transition: transform 0.2s ease;">
                        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
                          <div style="width: 32px; height: 32px; background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1)); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 16px; flex-shrink: 0;">${idx + 1}</div>
                          <div style="flex: 1; color: white; font-size: 15px; line-height: 1.6; font-weight: 500;">${p.question}</div>
                        </div>
                        <div style="display: flex; gap: 20px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
                          <div style="display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 600;">
                            <span>📌</span>                            <span>Mentions: <strong style="color: white;">${p.mentions}</strong></span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 600;">
                            <span>🔗</span><span>Citations: <strong style="color: white;">${p.citations}</strong></span>
                          </div>
                        </div>
                      </div>
                    `).join("")}
                  </div>
                </div>
              `;
            }
            
            let otherSourcesHtml = '';
            const sourceEntries = Object.entries(otherSources);
            if (sourceEntries.length > 0) {
              otherSourcesHtml = `
                <div style="margin-top: 32px; padding: 28px; background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); border-radius: 16px; backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <span style="font-size: 28px;">🔗</span>
                    <h5 style="margin: 0; font-size: 20px; font-weight: 700; color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">Other Links (Citations)</h5>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
                    ${sourceEntries.slice(0, 10).map(([source, count]) => `
                      <div style="padding: 20px; background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%); border-radius: 12px; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.1); transition: transform 0.2s ease;">
                        <div style="font-size: 36px; font-weight: 800; margin-bottom: 8px; color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.2); font-family: 'Space Grotesk', sans-serif;">${count}</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.9); word-break: break-word; line-height: 1.5; font-weight: 500;">${source}</div>
                      </div>
                    `).join("")}
                  </div>
                </div>
              `;
            }
            
            summaryHtml = `
              <div class="summary-section" style="padding: 0; background: transparent; border-radius: 20px; margin-bottom: 32px; overflow: hidden; position: relative;">
                <div style="padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); border-radius: 20px; box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4); position: relative; overflow: hidden; color: white;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 0%, transparent 50%); pointer-events: none;"></div>
                  <div style="position: relative; z-index: 1;">
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid rgba(255,255,255,0.2);">
                      <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 36px; box-shadow: 0 8px 24px rgba(0,0,0,0.2);">📊</div>
                      <div>
                        <h4 style="margin: 0; font-size: 32px; font-weight: 800; color: white; text-shadow: 0 2px 20px rgba(0,0,0,0.3); font-family: 'Space Grotesk', sans-serif; letter-spacing: -1px;">Summary</h4>
                        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 500;">Analysis Summary</p>
                      </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px;">
                      <div style="padding: 28px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%); border-radius: 16px; backdrop-filter: blur(20px); text-align: center; box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3); border: 1px solid rgba(255,255,255,0.2); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);"></div>
                        <div style="position: relative; z-index: 1;">
                          <div style="font-size: 48px; font-weight: 800; margin-bottom: 12px; color: white; text-shadow: 0 2px 20px rgba(0,0,0,0.2); font-family: 'Space Grotesk', sans-serif;">${summary.totalMentions || 0}</div>
                          <div style="font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.95); text-transform: uppercase; letter-spacing: 0.5px;">Total Mentions</div>
                        </div>
                      </div>
                      <div style="padding: 28px; background: linear-gradient(135deg, rgba(236, 72, 153, 0.95) 0%, rgba(219, 39, 119, 0.95) 100%); border-radius: 16px; backdrop-filter: blur(20px); text-align: center; box-shadow: 0 8px 32px rgba(236, 72, 153, 0.3); border: 1px solid rgba(255,255,255,0.2); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);"></div>
                        <div style="position: relative; z-index: 1;">
                          <div style="font-size: 48px; font-weight: 800; margin-bottom: 12px; color: white; text-shadow: 0 2px 20px rgba(0,0,0,0.2); font-family: 'Space Grotesk', sans-serif;">${summary.totalCitations || 0}</div>
                          <div style="font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.95); text-transform: uppercase; letter-spacing: 0.5px;">Total Citations</div>
                        </div>
                      </div>
                    </div>
                    ${bestPromptsHtml}
                    ${otherSourcesHtml}
                  </div>
                </div>
              </div>
            `;
          } else {
            summaryHtml = `
              <div class="summary-section" style="padding: 16px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px; margin-bottom: 32px;">
                <p style="margin: 0; color: var(--text-secondary); font-style: italic;">No summary available for this analysis.</p>
              </div>
            `;
          }
          
          return `
            <div class="local-view">
              <button class="back-btn" onclick="window.dashboardPage?.goBack()">← Back</button>
              <h3 style="margin-bottom: 24px;">Analysis Details</h3>
              ${promptsHtml}
              ${summaryHtml}
            </div>
          `;
        } catch (error) {
          console.error("Error loading analysis:", error);
          return `
            <div class="error-state">
              <p>Error loading analysis: ${error instanceof Error ? error.message : "Unknown error"}</p>
              <button class="back-btn" onclick="(window.dashboardPage as any).selectedAnalysisId = null; window.dashboardPage?.render();">← Back</button>
            </div>
          `;
        }
      } else if (this.selectedCompanyId) {
        // Show analyses for selected company
        const analyses = await analysisService.getCompanyAnalyses(this.selectedCompanyId);
        const company = companies.find(c => c.id === this.selectedCompanyId);
        
        return `
          <div class="local-view">
            <button class="back-btn" onclick="window.dashboardPage?.goBack()">← Back</button>
            <h3>Analyses: ${company?.name || company?.websiteUrl || "Unknown"}</h3>
            <div class="analyses-grid">
              ${analyses.length === 0 
                ? '<div class="empty-state">No analyses found</div>'
                : analyses.map(analysis => `
                  <div class="analysis-card" data-run-id="${analysis.id}">
                    <div class="analysis-header">
                      <h4>${new URL(analysis.websiteUrl).hostname}</h4>
                      <span class="status-badge ${analysis.status}">${analysis.status}</span>
                    </div>
                    <div class="analysis-details">
                      <div class="detail-item">
                        <span class="label">Country:</span>
                        <span>${analysis.country}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Language:</span>
                        <span>${analysis.language}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Created:</span>
                        <span>${new Date(analysis.createdAt).toLocaleDateString("en-US")}</span>
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
            <h3>Available Companies</h3>
            <div class="companies-grid">
              ${companies.length === 0 
                ? '<div class="empty-state">No companies found</div>'
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
                        <span class="label">Country:</span>
                        <span>${company.country}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Language:</span>
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
          <p>Error loading data: ${error instanceof Error ? error.message : "Unknown error"}</p>
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
            <button class="back-btn" onclick="window.dashboardPage?.goBack()">← Back</button>
            <h3>Category: ${this.selectedCategory}</h3>
            <div class="prompts-list">
              ${prompts.length === 0 
                ? '<div class="empty-state">No questions found in this category</div>'
                : prompts.map(prompt => `
                  <div class="prompt-card">
                    <div class="prompt-question">
                      <h4>Question:</h4>
                      <p>${prompt.question}</p>
                    </div>
                    ${prompt.answer && prompt.answer.trim() ? `
                      <div class="prompt-answer">
                        <h4>Answer:</h4>
                        <div style="max-height: 500px; overflow-y: auto; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-top: 12px;">
                          <p style="white-space: pre-wrap; line-height: 1.6;">${prompt.answer}</p>
                        </div>
                      </div>
                    ` : prompt.answer === null || prompt.answer === undefined ? `
                      <div class="prompt-answer" style="opacity: 0.6;">
                        <h4>Answer:</h4>
                        <p style="font-style: italic;">No answer available</p>
                      </div>
                    ` : ''}
                    <div class="prompt-details">
                      <div class="detail-item">
                        <span class="label">Website:</span>
                        <span>${new URL(prompt.websiteUrl).hostname}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Language:</span>
                        <span>${prompt.language}</span>
                      </div>
                      ${prompt.country ? `
                        <div class="detail-item">
                          <span class="label">Country:</span>
                          <span>${prompt.country}</span>
                        </div>
                      ` : ""}
                      <div class="detail-item">
                        <span class="label">Created:</span>
                        <span>${new Date(prompt.createdAt).toLocaleDateString("en-US")}</span>
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
            <h3>All Categories</h3>
            <div class="categories-grid">
              ${categories.length === 0 
                ? '<div class="empty-state">No categories found</div>'
                : categories.map(category => `
                  <div class="category-card" data-category-name="${category.name}">
                    <div class="category-header">
                      <h4>${category.name}</h4>
                      <span class="count-badge">${category.count}</span>
                    </div>
                    <div class="category-description">
                      <p>${category.description || "No description"}</p>
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
          <p>Error loading data: ${error instanceof Error ? error.message : "Unknown error"}</p>
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

