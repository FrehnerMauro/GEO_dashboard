/**
 * Dashboard Page - Main dashboard with Local/Global view
 */

import { getElement, showElement, hideElement, querySelector } from "../utils/dom-utils.js";
import { analysisService } from "../services/analysis-service.js";
import { navigation } from "../components/navigation.js";

type ViewMode = "local" | "global";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class DashboardPage {
  private dashboardSection: HTMLElement | null;
  private viewMode: ViewMode = "local";
  private selectedCompanyId: string | null = null;
  private selectedCategory: string | null = null;
  private selectedAnalysisId: string | null = null;
  private isLoading: boolean = false;
  
  // Cache for API responses (5 minutes TTL)
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.dashboardSection = getElement("dashboardSection");
    this.initialize();
  }

  private initialize(): void {
    // Don't render immediately - wait for show() to be called
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (age > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  private async render(): Promise<void> {
    if (!this.dashboardSection || this.isLoading) return;
    
    this.isLoading = true;

    try {
      // Show loading state
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
            <div class="loading-state" style="display: flex; align-items: center; justify-content: center; padding: 60px; min-height: 400px;">
              <div style="text-align: center;">
                <div class="spinner" style="width: 48px; height: 48px; border: 4px solid var(--border-light); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px;"></div>
                <p style="color: var(--text-secondary); font-size: 15px; font-weight: 500;">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      `;

      // Render content
      const content = this.viewMode === "local" 
        ? await this.renderLocalView() 
        : await this.renderGlobalView();

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
            ${content}
          </div>
        </div>
      `;

      // Attach event listeners after DOM is ready
      this.attachEventListeners();
    } catch (error) {
      console.error("Error rendering dashboard:", error);
      if (this.dashboardSection) {
        this.dashboardSection.innerHTML = `
          <div class="dashboard-container">
            <div class="error-state" style="padding: 60px; text-align: center;">
              <p style="color: var(--error); font-size: 16px; margin-bottom: 16px;">Error loading dashboard</p>
              <button class="btn btn-primary" onclick="window.dashboardPage?.render()">Retry</button>
            </div>
          </div>
        `;
      }
    } finally {
      this.isLoading = false;
    }
  }

  private attachEventListeners(): void {
    if (!this.dashboardSection) return;

    // Toggle buttons
    const toggleButtons = this.dashboardSection.querySelectorAll(".toggle-btn");
    toggleButtons.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const mode = (e.target as HTMLElement).dataset.mode as ViewMode;
        if (mode && mode !== this.viewMode) {
          this.viewMode = mode;
          this.selectedCompanyId = null;
          this.selectedCategory = null;
          this.selectedAnalysisId = null;
          this.render();
        }
      });
    });

    // Back buttons
    const backButtons = this.dashboardSection.querySelectorAll(".back-btn");
    backButtons.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.goBack();
      });
    });

    // Company cards (local view)
    if (this.viewMode === "local") {
      const companyCards = this.dashboardSection.querySelectorAll(".company-card");
      companyCards.forEach(card => {
        card.addEventListener("click", async (e) => {
          e.stopPropagation();
          const companyId = (e.currentTarget as HTMLElement).dataset.companyId;
          if (companyId && companyId !== this.selectedCompanyId) {
            this.selectedCompanyId = companyId;
            this.selectedAnalysisId = null;
            await this.render();
          }
        });
      });
      
      // Analysis cards
      const analysisCards = this.dashboardSection.querySelectorAll(".analysis-card");
      analysisCards.forEach(card => {
        card.addEventListener("click", async (e) => {
          e.stopPropagation();
          const runId = (e.currentTarget as HTMLElement).dataset.runId;
          if (runId && runId !== this.selectedAnalysisId) {
            this.selectedAnalysisId = runId;
            await this.render();
          }
        });
      });
    }

    // Category cards (global view)
    if (this.viewMode === "global") {
      const categoryCards = this.dashboardSection.querySelectorAll(".category-card");
      categoryCards.forEach(card => {
        card.addEventListener("click", async (e) => {
          e.stopPropagation();
          const categoryName = (e.currentTarget as HTMLElement).dataset.categoryName;
          if (categoryName && categoryName !== this.selectedCategory) {
            this.selectedCategory = categoryName;
            await this.render();
          }
        });
      });
    }
  }

  private async renderLocalView(): Promise<string> {
    try {
      // Use cache for companies
      let companies = this.getCached<any[]>("companies");
      if (!companies) {
        companies = await analysisService.getAllCompanies();
        this.setCache("companies", companies);
      }
      
      if (this.selectedAnalysisId) {
        // Show analysis questions and summary
        try {
          // Use cache for analysis data
          const cacheKey = `analysis-${this.selectedAnalysisId}`;
          let promptsSummaryData = this.getCached<{ prompts: any[]; summary: any }>(cacheKey);
          
          if (!promptsSummaryData) {
            promptsSummaryData = await analysisService.getAnalysisPromptsAndSummary(this.selectedAnalysisId);
            this.setCache(cacheKey, promptsSummaryData);
          }
          
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
              <button class="back-btn">← Back to Analyses</button>
              <div class="info-box-compact">
                <h3 class="info-box-compact-title">📊 Analysis Details</h3>
                <p class="info-box-compact-description">
                  View all questions asked during this analysis, their answers, and performance metrics including brand mentions and citations.
                </p>
              </div>
              ${promptsHtml}
              ${summaryHtml}
            </div>
          `;
        } catch (error) {
          console.error("Error loading analysis:", error);
          return `
            <div class="error-state" style="padding: 40px; text-align: center;">
              <p style="color: var(--error); margin-bottom: 16px; font-size: 16px;">Error loading analysis: ${error instanceof Error ? error.message : "Unknown error"}</p>
              <button class="back-btn">← Back</button>
            </div>
          `;
        }
      } else if (this.selectedCompanyId) {
        // Show analyses for selected company
        const cacheKey = `company-analyses-${this.selectedCompanyId}`;
        let analyses = this.getCached<any[]>(cacheKey);
        
        if (!analyses) {
          analyses = await analysisService.getCompanyAnalyses(this.selectedCompanyId);
          this.setCache(cacheKey, analyses);
        }
        
        const company = companies.find(c => c.id === this.selectedCompanyId);
        
        return `
          <div class="local-view">
            <button class="back-btn">← Back to Companies</button>
            <div class="info-box-compact">
              <h3 class="info-box-compact-title">📋 Analyses: ${company?.name || company?.websiteUrl || "Unknown"}</h3>
              <p class="info-box-compact-description">
                Click on an analysis to view detailed results including all questions, answers, brand mentions, and citations.
              </p>
            </div>
            <div class="analyses-grid">
              ${analyses.length === 0 
                ? '<div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-secondary);">No analyses found</div>'
                : analyses.map(analysis => `
                  <div class="analysis-card" data-run-id="${analysis.id}" style="cursor: pointer;">
                    <div class="analysis-header">
                      <h4 style="font-size: 18px; font-weight: 700; color: var(--text); margin: 0;">${new URL(analysis.websiteUrl).hostname}</h4>
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
            <div class="info-box-compact">
              <h3 class="info-box-compact-title">📊 Local View - Companies</h3>
              <p class="info-box-compact-description">
                Browse analyses organized by company. Click on a company to see all its analyses, then click on an analysis to view detailed results including questions, answers, mentions, and citations.
              </p>
            </div>
            <div class="companies-grid">
              ${companies.length === 0 
                ? '<div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-secondary);"><div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📭</div><p style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">No companies found</p><p style="font-size: 14px; color: var(--text-light);">Start a new analysis to create your first company entry.</p></div>'
                : companies.map(company => `
                  <div class="company-card" data-company-id="${company.id}" style="cursor: pointer;">
                    <div class="company-header">
                      <h4 style="font-size: 18px; font-weight: 700; color: var(--text); margin: 0; font-family: \'Space Grotesk\', sans-serif;">${company.name}</h4>
                    </div>
                    <div class="company-details">
                      <div class="detail-item">
                        <span class="label">Website:</span>
                        <span style="word-break: break-all;">${company.websiteUrl}</span>
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
        const cacheKey = `category-prompts-${this.selectedCategory}`;
        let categoryData = this.getCached<{ prompts: any[]; sourceStats: any[] }>(cacheKey);
        
        if (!categoryData) {
          const result = await analysisService.getGlobalPromptsByCategory(this.selectedCategory);
          // Handle both old format (array) and new format (object with prompts and sourceStats)
          if (Array.isArray(result)) {
            categoryData = { prompts: result, sourceStats: [] };
          } else {
            categoryData = result;
          }
          this.setCache(cacheKey, categoryData);
        }
        
        const prompts = categoryData.prompts || [];
        const sourceStats = categoryData.sourceStats || [];
        
        // Build source statistics overview
        let sourceStatsHtml = '';
        if (sourceStats.length > 0) {
          const topSources = sourceStats.slice(0, 10); // Show top 10 sources
          const totalCitations = sourceStats.reduce((sum, stat) => sum + stat.count, 0);
          
          sourceStatsHtml = `
            <div style="margin-bottom: 32px; padding: 28px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%); border-radius: 16px; backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                <span style="font-size: 28px;">📊</span>
                <h4 style="margin: 0; font-size: 20px; font-weight: 700; color: var(--text);">Source Statistics</h4>
              </div>
              <p style="margin: 0 0 20px 0; color: var(--text-secondary); font-size: 14px;">
                Total citations: <strong style="color: var(--text);">${totalCitations}</strong> from <strong style="color: var(--text);">${sourceStats.length}</strong> unique sources
              </p>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                ${topSources.map((stat, idx) => {
                  const percentage = ((stat.count / totalCitations) * 100).toFixed(1);
                  return `
                    <div style="padding: 16px; background: rgba(255,255,255,0.08); border-radius: 12px; border-left: 4px solid ${idx < 3 ? 'var(--primary)' : 'rgba(255,255,255,0.3)'};">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-size: 24px; font-weight: 800; color: var(--text);">${stat.count}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">${percentage}%</div>
                      </div>
                      <div style="font-size: 13px; color: var(--text-secondary); word-break: break-word; line-height: 1.4;">${stat.domain}</div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          `;
        }
        
        return `
          <div class="global-view">
            <button class="back-btn">← Back to Categories</button>
            <div class="info-box-compact">
              <h3 class="info-box-compact-title">📁 Category: ${this.selectedCategory}</h3>
              <p class="info-box-compact-description">
                View all questions and answers in this category across all analyses. Duplicate questions are automatically removed (keeping the newest version), and only questions with answers are shown.
              </p>
            </div>
            ${sourceStatsHtml}
            <div class="prompts-list">
              ${prompts.length === 0 
                ? '<div class="empty-state">No questions with answers found in this category</div>'
                : prompts.map(prompt => `
                  <div class="prompt-card">
                    <div class="prompt-question">
                      <h4>Question:</h4>
                      <p>${prompt.question}</p>
                    </div>
                    <div class="prompt-answer">
                      <h4>Answer:</h4>
                      <div style="max-height: 500px; overflow-y: auto; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-top: 12px;">
                        <p style="white-space: pre-wrap; line-height: 1.6;">${prompt.answer}</p>
                      </div>
                    </div>
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
        let categories = this.getCached<any[]>("global-categories");
        if (!categories) {
          categories = await analysisService.getGlobalCategories();
          this.setCache("global-categories", categories);
        }
        
        return `
          <div class="global-view">
            <div class="info-box-compact">
              <h3 class="info-box-compact-title">🌐 Global View - All Categories</h3>
              <p class="info-box-compact-description">
                Explore all questions and answers across all analyses, organized by category. This view helps you identify patterns, find common questions, and understand content coverage across different topics.
              </p>
            </div>
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
      if (this.selectedAnalysisId) {
        this.selectedAnalysisId = null;
      } else {
        this.selectedCompanyId = null;
      }
    } else {
      this.selectedCategory = null;
    }
    this.render();
  }

  show(): void {
    // Hide all other sections to prevent chaos
    const aiAnalysisSection = getElement("aiAnalysisSection");
    const aiReadabilitySection = getElement("aiReadabilitySection");
    const analysesSection = getElement("analysesSection");
    const analysisDetailSection = getElement("analysisDetailSection");
    const configurationCard = querySelector(".content-area > .card");
    const analysisProgress = getElement("analysisProgress");
    const loading = getElement("loading");
    const result = getElement("result");

    if (aiAnalysisSection) {
      aiAnalysisSection.style.display = "none";
      aiAnalysisSection.classList.remove("show");
    }
    if (aiReadabilitySection) {
      aiReadabilitySection.style.display = "none";
      aiReadabilitySection.classList.remove("show");
    }
    hideElement(analysesSection);
    hideElement(analysisDetailSection);
    hideElement(configurationCard);
    
    if (analysisProgress) {
      analysisProgress.style.display = "none";
    }
    if (loading) {
      loading.style.display = "none";
      loading.classList.remove("show");
    }
    if (result) {
      result.style.display = "none";
      result.classList.remove("show");
    }
    
    if (this.dashboardSection) {
      showElement(this.dashboardSection);
      this.dashboardSection.style.display = "block";
    }
    
    // Update header
    const headerTitle = document.getElementById("headerTitle");
    if (headerTitle) headerTitle.textContent = "Dashboard";
    
    navigation.setActiveNavItem(0);
    this.render();
  }
}

// Note: dashboardPage instance is created in app.ts and exposed globally

