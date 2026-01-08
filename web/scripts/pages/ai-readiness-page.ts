/**
 * AI Readiness Page - AI Readiness Check functionality
 */

import { getElement, showElement, hideElement, setText } from "../utils/dom-utils.js";
import { normalizeUrl, validateUrl } from "../utils/url-utils.js";
import { aiReadinessService } from "../services/ai-readiness-service.js";
import { navigation } from "../components/navigation.js";

export class AIReadinessPage {
  private urlInput: HTMLInputElement | null;
  private startBtn: HTMLButtonElement | null;
  private loadingEl: HTMLElement | null;
  private resultsEl: HTMLElement | null;
  private statusEl: HTMLElement | null;
  private statusDetailsEl: HTMLElement | null;
  private progressEl: HTMLElement | null;
  private progressTextEl: HTMLElement | null;
  private resultsContentEl: HTMLElement | null;
  private consoleEl: HTMLElement | null;
  private consoleContentEl: HTMLElement | null;
  private stepsEl: HTMLElement | null;
  private stepsContentEl: HTMLElement | null;

  private pollingInterval: number | null = null;
  private currentRunId: string | null = null;

  constructor() {
    this.initializeElements();
    this.initialize();
  }

  private initializeElements(): void {
    this.urlInput = getElement<HTMLInputElement>("aiReadinessUrl");
    this.startBtn = getElement<HTMLButtonElement>("startAIReadinessBtn");
    this.loadingEl = getElement("aiReadinessLoading");
    this.resultsEl = getElement("aiReadinessResults");
    this.statusEl = getElement("aiReadinessStatus");
    this.statusDetailsEl = getElement("aiReadinessStatusDetails");
    this.progressEl = getElement("aiReadinessProgress");
    this.progressTextEl = getElement("aiReadinessProgressText");
    this.resultsContentEl = getElement("aiReadinessResultsContent");
    this.consoleEl = getElement("aiReadinessConsole");
    this.consoleContentEl = getElement("aiReadinessConsoleContent");
    this.stepsEl = getElement("aiReadinessSteps");
    this.stepsContentEl = getElement("aiReadinessStepsContent");
  }

  private initialize(): void {
    if (this.startBtn) {
      this.startBtn.addEventListener("click", () => this.startAnalysis());
    }
  }

  async startAnalysis(): Promise<void> {
    if (!this.urlInput) return;

    const url = this.urlInput.value.trim();
    if (!url) {
      alert("Bitte geben Sie eine URL ein.");
      return;
    }

    // Normalize and validate URL
    let websiteUrl = normalizeUrl(url);
    if (!validateUrl(websiteUrl)) {
      alert("Ungültige URL. Bitte geben Sie eine gültige URL ein.");
      return;
    }

    // Update input field
    this.urlInput.value = websiteUrl;

    // Reset UI
    this.resetUI();

    try {
      // Start analysis
      const result = await aiReadinessService.startAnalysis({ websiteUrl });
      this.currentRunId = result.runId;

      // Start polling for status
      this.startPolling(result.runId);
    } catch (error) {
      console.error("Error starting AI Readiness check:", error);
      this.handleError(error instanceof Error ? error.message : "Unbekannter Fehler");
    }
  }

  private resetUI(): void {
    // Show console and loading
    if (this.consoleEl) showElement(this.consoleEl);
    if (this.consoleContentEl) {
      this.consoleContentEl.innerHTML =
        '<div style="color: #6a9955;">[System] Console bereit. Warte auf Logs...</div>';
    }
    if (this.loadingEl) showElement(this.loadingEl);
    if (this.resultsEl) hideElement(this.resultsEl);

    // Reset status
    if (this.statusEl) setText(this.statusEl, "Vorbereitung...");
    if (this.statusDetailsEl) setText(this.statusDetailsEl, "Starte AI Readiness Check...");
    if (this.progressEl) this.progressEl.style.width = "0%";
    if (this.progressTextEl) setText(this.progressTextEl, "0%");
    if (this.startBtn) {
      this.startBtn.disabled = true;
      this.startBtn.textContent = "Läuft...";
    }
  }

  private startPolling(runId: string): void {
    // Clear any existing polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max (2 second intervals)

    const poll = async () => {
      attempts++;

      try {
        const status = await aiReadinessService.getStatus(runId);
        this.updateUI(status);

        if (status.status === "completed") {
          this.stopPolling();
          this.showResults(status);
        } else if (status.status === "error") {
          this.stopPolling();
          this.handleError(status.message || "Fehler bei der Analyse");
        } else if (attempts >= maxAttempts) {
          this.stopPolling();
          this.handleError("Timeout: Die Analyse hat zu lange gedauert.");
        }
      } catch (error) {
        console.error("Error polling status:", error);
        if (attempts >= maxAttempts) {
          this.stopPolling();
          this.handleError("Fehler beim Abrufen des Status.");
        }
      }
    };

    // Poll immediately, then every 2 seconds
    poll();
    this.pollingInterval = window.setInterval(poll, 2000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.startBtn) {
      this.startBtn.disabled = false;
      this.startBtn.textContent = "🚀 AI Readiness Check starten";
    }
  }

  private updateUI(status: any): void {
    // Update status text
    if (status.message && this.statusDetailsEl) {
      setText(this.statusDetailsEl, status.message);
    }

    // Update progress based on logs
    if (status.logs && Array.isArray(status.logs)) {
      const totalSteps = 6;
      const completedSteps = status.logs.filter(
        (log: any) => log.status === "OK" || log.status === "ERROR"
      ).length;
      const progressPercent = Math.min(95, Math.round((completedSteps / totalSteps) * 100));

      if (this.progressEl) this.progressEl.style.width = `${progressPercent}%`;
      if (this.progressTextEl) setText(this.progressTextEl, `${progressPercent}%`);

      // Update status title
      const latestLog = status.logs[status.logs.length - 1];
      if (latestLog && this.statusEl) {
        setText(this.statusEl, `Schritt ${status.logs.length}: ${latestLog.stepName || ""}`);
      }

      // Update steps overview
      this.updateStepsOverview(status.logs);

      // Update console
      this.updateConsole(status.logs);
    }
  }

  private updateStepsOverview(logs: any[]): void {
    if (!this.stepsContentEl) return;

    const sortedLogs = [...logs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let stepsHtml = "";
    sortedLogs.forEach((log, index) => {
      const stepNum = index + 1;
      const time = new Date(log.timestamp).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const isActive = index === sortedLogs.length - 1;
      const isCompleted = log.status === "OK";
      const hasError = log.status === "ERROR";
      const hasWarning = log.status === "WARN";

      let statusClass = "pending";
      let statusIcon = "⏳";
      let statusText = "Wartend";

      if (hasError) {
        statusClass = "error";
        statusIcon = "✗";
        statusText = "Fehler";
      } else if (hasWarning) {
        statusClass = "warning";
        statusIcon = "⚠";
        statusText = "Warnung";
      } else if (isCompleted) {
        statusClass = "completed";
        statusIcon = "✓";
        statusText = "Abgeschlossen";
      } else if (isActive) {
        statusClass = "active";
        statusIcon = "⟳";
        statusText = "Läuft...";
      }

      stepsHtml += `
        <div class="ai-readiness-step-item ${statusClass}">
          <div class="ai-readiness-step-header">
            <div class="ai-readiness-step-number">${stepNum}</div>
            <div class="ai-readiness-step-content">
              <div class="ai-readiness-step-title">${this.escapeHtml(log.stepName || "")}</div>
              <div class="ai-readiness-step-meta">
                <span class="ai-readiness-step-status ${statusClass}">
                  ${statusIcon} ${statusText}
                </span>
                <span>•</span>
                <span>${time}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    if (this.stepsEl) showElement(this.stepsEl);
    this.stepsContentEl.innerHTML = stepsHtml || '<div style="text-align: center; color: var(--text-light); padding: 40px;">Noch keine Schritte ausgeführt...</div>';
  }

  private updateConsole(logs: any[]): void {
    if (!this.consoleContentEl) return;

    const sortedLogs = [...logs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let logHtml = "";
    sortedLogs.forEach((log, index) => {
      const time = new Date(log.timestamp).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
      });

      const statusColor =
        log.status === "OK" ? "#6a9955" : log.status === "WARN" ? "#d7ba7d" : "#f48771";
      const statusIcon = log.status === "OK" ? "✓" : log.status === "WARN" ? "⚠" : "✗";
      const isLatest = index === sortedLogs.length - 1;

      logHtml += `
        <div style="margin-bottom: 6px; padding: 8px 12px; border-bottom: 1px solid #2d2d2d; ${
          isLatest ? "background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6;" : ""
        }">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="color: #858585; font-family: monospace; font-size: 11px;">[${time}]</span>
            <span style="color: #569cd6; font-family: monospace; font-size: 11px;">[${this.escapeHtml(
              log.stepId || ""
            )}]</span>
            <span style="color: ${statusColor}; font-weight: 600;">[${statusIcon} ${this.escapeHtml(
              log.status || ""
            )}]</span>
            <span style="color: #d4d4d4; font-weight: 600;">${this.escapeHtml(log.stepName || "")}</span>
          </div>
        </div>
      `;
    });

    this.consoleContentEl.innerHTML = logHtml || '<div style="color: #6a9955;">[System] Warte auf Logs...</div>';
    this.consoleContentEl.scrollTop = this.consoleContentEl.scrollHeight;
  }

  private showResults(status: any): void {
    if (this.statusEl) setText(this.statusEl, "✅ Analyse abgeschlossen");
    if (this.statusDetailsEl) setText(this.statusDetailsEl, "AI Readiness Check erfolgreich durchgeführt");
    if (this.progressEl) this.progressEl.style.width = "100%";
    if (this.progressTextEl) setText(this.progressTextEl, "100%");

    if (this.resultsContentEl && status.recommendations) {
      this.resultsContentEl.innerHTML = `
        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #374151;">
          ${this.escapeHtml(status.recommendations)}
        </div>
      `;
    }

    if (this.resultsEl) showElement(this.resultsEl);

    // Hide loading after delay
    setTimeout(() => {
      if (this.loadingEl) hideElement(this.loadingEl);
    }, 2000);
  }

  private handleError(message: string): void {
    if (this.statusEl) setText(this.statusEl, "❌ Fehler");
    if (this.statusDetailsEl) setText(this.statusDetailsEl, message);
    alert(`Fehler beim AI Readiness Check: ${message}`);
    this.stopPolling();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  show(): void {
    const aiReadinessSection = getElement("aiReadinessSection");
    const analysesSection = getElement("analysesSection");
    const analysisDetailSection = getElement("analysisDetailSection");
    const configurationCard = querySelector(".content-area > .card");

    showElement(aiReadinessSection);
    hideElement(analysesSection);
    hideElement(analysisDetailSection);
    hideElement(configurationCard);

    navigation.setActiveNavItem(2);
  }
}

// Export global function for backward compatibility
(window as any).showAIReadiness = (event?: Event) => {
  if (event) event.preventDefault();
  const page = new AIReadinessPage();
  page.show();
};

// Export startAIReadiness for global access
(window as any).startAIReadiness = async () => {
  const page = new AIReadinessPage();
  await page.startAnalysis();
};

