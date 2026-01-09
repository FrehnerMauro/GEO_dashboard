/**
 * Readability Workflow - Handles AI Readability/AI Readiness analysis
 */

import { apiClient } from "../core/api-client.js";

export class ReadabilityWorkflow {
  /**
   * Start the AI Readiness analysis
   */
  async startAnalysis(url: string): Promise<void> {
    const urlInput = document.getElementById("readabilityUrl") as HTMLInputElement;
    const progressSection = document.getElementById("readabilityProgress");
    const stepNumber = document.getElementById("readabilityStepNumber");
    const stepTitle = document.getElementById("readabilityStepTitle");
    const stepDescription = document.getElementById("readabilityStepDescription");
    const progressPercentage = document.getElementById("readabilityProgressPercentage");
    const progressFill = document.getElementById("readabilityProgressFill");
    const stepsContainer = document.getElementById("readabilityStepsContainer");
    const configurationCard = document.getElementById("readabilityConfigurationCard");
    const contentSection = document.getElementById("readabilityContent");
    const protocolDisplay = document.getElementById("readabilityProtocolDisplay");
    const gptAnalysisSection = document.getElementById("gptAnalysisSection");
    const gptAnalysisDisplay = document.getElementById("gptAnalysisDisplay");
    const pagesSummaryDisplay = document.getElementById("pagesSummaryDisplay");
    const fetchContentBtn = document.getElementById("fetchContentBtn") as HTMLButtonElement;

    if (!url || !url.trim()) {
      alert("Please enter a URL.");
      return;
    }

    let validatedUrl = url.trim();
    // Add https:// if missing
    if (!validatedUrl.match(/^https?:\/\//i)) {
      validatedUrl = "https://" + validatedUrl;
    }

    // Validate URL
    try {
      new URL(validatedUrl);
    } catch (e) {
      alert("Invalid URL. Please enter a valid URL.");
      return;
    }

    // Reset UI
    if (configurationCard) {
      configurationCard.style.display = "none";
      configurationCard.classList.add("hidden");
    }
    if (progressSection) progressSection.style.display = "block";
    if (contentSection) contentSection.style.display = "none";
    if (gptAnalysisSection) gptAnalysisSection.style.display = "none";

    // Initialize progress UI
    if (stepNumber) stepNumber.textContent = "1";
    if (stepTitle) stepTitle.textContent = "Preparing Analysis";
    if (stepDescription) stepDescription.textContent = "Initializing...";
    if (progressPercentage) progressPercentage.textContent = "0%";
    if (progressFill) progressFill.style.width = "0%";
    if (stepsContainer) stepsContainer.innerHTML = "";

    // Update button state
    if (fetchContentBtn) {
      fetchContentBtn.disabled = true;
      fetchContentBtn.textContent = "Analyzing...";
    }

    try {
      // Helper function to add/update a step
      const addStep = (stepId: string, title: string, status: "running" | "completed" | "error" = "running", details: string = "") => {
        if (!stepsContainer) return;

        let stepEl = document.getElementById(`step-${stepId}`);
        if (!stepEl) {
          stepEl = document.createElement("div");
          stepEl.id = `step-${stepId}`;
          stepEl.style.cssText =
            "padding: 16px; background: var(--bg-secondary); border-radius: 8px; border-left: 4px solid #2196F3; transition: all 0.3s; margin-bottom: 8px;";
          stepsContainer.appendChild(stepEl);
        }

        const statusIcon = status === "completed" ? "✓" : status === "error" ? "✗" : "⟳";
        const statusColor = status === "completed" ? "#4CAF50" : status === "error" ? "#F44336" : "#2196F3";

        stepEl.style.borderLeftColor = statusColor;
        stepEl.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: ${details ? "8px" : "0"};">
            <span style="font-size: 20px; color: ${statusColor};">${statusIcon}</span>
            <div style="flex: 1;">
              <div style="font-weight: 500; color: var(--text-primary);">${title}</div>
              ${details ? `<div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">${details}</div>` : ""}
            </div>
          </div>
        `;

        // Auto-remove completed steps after delay
        if (status === "completed") {
          setTimeout(() => {
            if (stepEl && stepEl.parentNode) {
              stepEl.style.opacity = "0";
              stepEl.style.transform = "translateX(-20px)";
              setTimeout(() => {
                if (stepEl && stepEl.parentNode) {
                  stepEl.parentNode.removeChild(stepEl);
                }
              }, 300);
            }
          }, 2000);
        }
      };

      // Step 1: Fetch robots.txt
      addStep("robots", "Searching for robots.txt...", "running");
      if (stepNumber) stepNumber.textContent = "1";
      if (stepTitle) stepTitle.textContent = "Searching for robots.txt...";
      if (stepDescription) stepDescription.textContent = "Checking robots.txt file";
      if (progressPercentage) progressPercentage.textContent = "5%";
      if (progressFill) progressFill.style.width = "5%";

      // Use backend API for AI Readiness analysis
      const apiUrl = (window as any).getApiUrl ? (window as any).getApiUrl("/api/workflow/aiReadiness") : "/api/workflow/aiReadiness";

      // Simulate step-by-step progress while waiting for response
      const progressSteps = [
        { id: "robots", title: "Searching for robots.txt...", description: "Checking robots.txt file", step: 1, progress: 5 },
        { id: "sitemap", title: "Searching for sitemap...", description: "Looking for sitemap.xml", step: 2, progress: 15 },
        { id: "links", title: "Extracting links...", description: "Collecting page URLs", step: 3, progress: 25 },
        { id: "pages", title: "Analyzing pages...", description: "Fetching and analyzing content", step: 4, progress: 50 },
        { id: "gpt", title: "Running GPT analysis...", description: "Generating AI readiness score", step: 5, progress: 80 },
      ];

      let currentStepIndex = 0;
      const stepInterval = setInterval(() => {
        if (currentStepIndex < progressSteps.length) {
          const step = progressSteps[currentStepIndex];
          addStep(step.id, step.title, "running");
          if (stepNumber) stepNumber.textContent = step.step.toString();
          if (stepTitle) stepTitle.textContent = step.title;
          if (stepDescription) stepDescription.textContent = step.description;
          if (progressPercentage) progressPercentage.textContent = step.progress + "%";
          if (progressFill) progressFill.style.width = step.progress + "%";
          currentStepIndex++;
        }
      }, 800);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: validatedUrl }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as any).error || (errorData as any).message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as {
        success: boolean;
        error?: string;
        protocol?: any;
        protocolText?: string;
      };

      if (!data.success) {
        throw new Error(data.error || "Analysis failed");
      }

      // Update all steps with actual results
      if (data.protocol?.robotsTxt) {
        if (data.protocol.robotsTxt.found) {
          addStep(
            "robots",
            "robots.txt found",
            "completed",
            data.protocol.robotsTxt.content ? `${data.protocol.robotsTxt.content.length} characters` : ""
          );
        } else {
          addStep("robots", "No robots.txt found", "completed");
        }
      }

      if (data.protocol?.sitemap) {
        if (data.protocol.sitemap.found) {
          addStep("sitemap", "Sitemap found", "completed", `${data.protocol.sitemap.urls.length} URLs found`);
        } else {
          addStep("sitemap", "No sitemap found", "completed", "Links extracted from landing page");
        }
      }

      addStep("links", "Links extracted", "completed", `${data.protocol?.pages?.length || 0} pages to analyze`);

      const successful = data.protocol?.pages?.filter((p: any) => p.success).length || 0;
      const failed = data.protocol?.pages?.filter((p: any) => !p.success).length || 0;
      addStep("pages", "Pages analyzed", "completed", `${successful} successful, ${failed} failed`);

      if (data.protocol?.analysis) {
        addStep("gpt", "GPT analysis completed", "completed", `Score: ${data.protocol.analysis.score || "N/A"}/100`);
      } else {
        addStep("gpt", "GPT Analysis Skipped", "completed", "No API Key configured");
      }

      // Update progress to completion
      if (stepNumber) stepNumber.textContent = "5";
      if (stepTitle) stepTitle.textContent = "Analysis Completed";
      if (stepDescription) stepDescription.textContent = "All steps finished successfully";
      if (progressPercentage) progressPercentage.textContent = "100%";
      if (progressFill) progressFill.style.width = "100%";

      // Display protocol
      if (protocolDisplay && data.protocolText) {
        protocolDisplay.textContent = data.protocolText;
      }

      // Display GPT analysis if available
      if (data.protocol?.analysis) {
        if (gptAnalysisSection) gptAnalysisSection.style.display = "block";
        if (gptAnalysisDisplay) {
          let html = "";
          if (data.protocol.analysis.summary) {
            html += `<div style="margin-bottom: 16px;"><strong>Summary:</strong><p style="margin-top: 8px; line-height: 1.6;">${data.protocol.analysis.summary}</p></div>`;
          }
          if (data.protocol.analysis.score !== undefined) {
            const scoreColor = data.protocol.analysis.score >= 70 ? "#4CAF50" : data.protocol.analysis.score >= 50 ? "#FF9800" : "#F44336";
            html += `<div style="margin-bottom: 16px;"><strong>AI Readiness Score:</strong> <span style="font-size: 24px; font-weight: bold; color: ${scoreColor}">${data.protocol.analysis.score}/100</span></div>`;
          }
          if (data.protocol.analysis.recommendations && data.protocol.analysis.recommendations.length > 0) {
            html += `<div style="margin-bottom: 16px;"><strong>Recommendations:</strong><ul style="margin-top: 8px; padding-left: 20px;">`;
            data.protocol.analysis.recommendations.forEach((rec: string) => {
              html += `<li style="margin-bottom: 4px; line-height: 1.6;">${rec}</li>`;
            });
            html += `</ul></div>`;
          }
          if (data.protocol.analysis.issues && data.protocol.analysis.issues.length > 0) {
            html += `<div style="margin-bottom: 16px;"><strong style="color: #F44336;">Issues:</strong><ul style="margin-top: 8px; padding-left: 20px; color: #F44336;">`;
            data.protocol.analysis.issues.forEach((issue: string) => {
              html += `<li style="margin-bottom: 4px; line-height: 1.6;">${issue}</li>`;
            });
            html += `</ul></div>`;
          }
          if (data.protocol.analysis.strengths && data.protocol.analysis.strengths.length > 0) {
            html += `<div><strong style="color: #4CAF50;">Strengths:</strong><ul style="margin-top: 8px; padding-left: 20px; color: #4CAF50;">`;
            data.protocol.analysis.strengths.forEach((strength: string) => {
              html += `<li style="margin-bottom: 4px; line-height: 1.6;">${strength}</li>`;
            });
            html += `</ul></div>`;
          }
          gptAnalysisDisplay.innerHTML = html;
        }
      }

      // Display pages summary
      if (pagesSummaryDisplay && data.protocol?.pages) {
        const successful = data.protocol.pages.filter((p: any) => p.success).length;
        const failed = data.protocol.pages.filter((p: any) => !p.success).length;
        const avgTime = Math.round(data.protocol.pages.reduce((sum: number, p: any) => sum + p.fetchTime, 0) / data.protocol.pages.length);

        let html = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">`;
        html += `<div style="padding: 16px; background: var(--bg-secondary); border-radius: 8px;"><strong>Total Pages</strong><div style="font-size: 24px; font-weight: bold; margin-top: 8px;">${data.protocol.pages.length}</div></div>`;
        html += `<div style="padding: 16px; background: var(--bg-secondary); border-radius: 8px;"><strong>Successful</strong><div style="font-size: 24px; font-weight: bold; margin-top: 8px; color: #4CAF50;">${successful}</div></div>`;
        html += `<div style="padding: 16px; background: var(--bg-secondary); border-radius: 8px;"><strong>Failed</strong><div style="font-size: 24px; font-weight: bold; margin-top: 8px; color: ${failed > 0 ? "#F44336" : "#4CAF50"}">${failed}</div></div>`;
        html += `<div style="padding: 16px; background: var(--bg-secondary); border-radius: 8px;"><strong>Avg Load Time</strong><div style="font-size: 24px; font-weight: bold; margin-top: 8px;">${avgTime}ms</div></div>`;
        html += `</div>`;

        html += `<div style="max-height: 400px; overflow-y: auto;"><table style="width: 100%; border-collapse: collapse;">`;
        html += `<thead><tr style="background: var(--bg-secondary);"><th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">URL</th><th style="padding: 12px; text-align: center; border-bottom: 2px solid var(--border-color);">Status</th><th style="padding: 12px; text-align: center; border-bottom: 2px solid var(--border-color);">Time</th></tr></thead><tbody>`;
        data.protocol.pages.forEach((page: any) => {
          html += `<tr style="border-bottom: 1px solid var(--border-color);">`;
          html += `<td style="padding: 12px; font-size: 13px; word-break: break-all;">${page.url}</td>`;
          html += `<td style="padding: 12px; text-align: center;"><span style="color: ${page.success ? "#4CAF50" : "#F44336"}; font-weight: bold;">${page.success ? "✓" : "✗"}</span></td>`;
          html += `<td style="padding: 12px; text-align: center;">${page.fetchTime}ms</td>`;
          html += `</tr>`;
        });
        html += `</tbody></table></div>`;

        pagesSummaryDisplay.innerHTML = html;
      }

      // Show content section
      if (contentSection) {
        contentSection.style.display = "block";
      }

      // Hide progress after a short delay and show configuration again
      setTimeout(() => {
        if (progressSection) progressSection.style.display = "none";
        if (configurationCard) {
          configurationCard.style.display = "block";
          configurationCard.classList.remove("hidden");
        }
      }, 2000);
    } catch (error) {
      console.error("Error in AI Readiness analysis:", error);

      // Show error in last step
      if (stepsContainer) {
        const errorStep = document.createElement("div");
        errorStep.style.cssText = "padding: 16px; background: #ffebee; border-radius: 8px; border-left: 4px solid #F44336; margin-bottom: 8px;";
        errorStep.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 20px; color: #F44336;">✗</span>
            <div style="flex: 1;">
              <div style="font-weight: 500; color: #F44336;">Error occurred</div>
              <div style="font-size: 13px; color: #d32f2f; margin-top: 4px;">${error instanceof Error ? error.message : "Unknown error"}</div>
            </div>
          </div>
        `;
        stepsContainer.appendChild(errorStep);
      }

      if (stepTitle) stepTitle.textContent = "Error Occurred";
      if (stepDescription) stepDescription.textContent = error instanceof Error ? error.message : "Unknown error";
      if (progressPercentage) progressPercentage.textContent = "0%";
      if (progressFill) progressFill.style.width = "0%";

      // Show configuration again on error
      if (configurationCard) {
        configurationCard.style.display = "block";
        configurationCard.classList.remove("hidden");
      }

      alert("Analysis error: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      if (fetchContentBtn) {
        fetchContentBtn.disabled = false;
        fetchContentBtn.textContent = "Start AI Readiness Analysis";
      }
    }
  }
}
