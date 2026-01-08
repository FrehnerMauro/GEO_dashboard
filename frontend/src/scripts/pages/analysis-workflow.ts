/**
 * Analysis Workflow - Handles the complete analysis workflow
 */

import { workflowService } from "../services/workflow-service.js";

interface WorkflowData {
  websiteUrl: string;
  country: string;
  language: string;
  region?: string;
  questionsPerCategory: number;
  runId?: string;
  urls?: string[];
  content?: string;
  categories?: any[];
  foundSitemap?: boolean;
}

export class AnalysisWorkflow {
  private workflowData: WorkflowData | null = null;

  /**
   * Start the analysis workflow
   */
  async startAnalysis(formData: {
    websiteUrl: string;
    country: string;
    language: string;
    region?: string;
    questionsPerCategory: number;
  }): Promise<void> {
    try {
      // Validate form data
      let websiteUrl = formData.websiteUrl.trim();
      if (!websiteUrl.match(/^https?:\/\//i)) {
        websiteUrl = "https://" + websiteUrl;
      }

      const validatedData: WorkflowData = {
        websiteUrl,
        country: formData.country.toUpperCase().trim(),
        language: formData.language.trim(),
        region: formData.region?.trim() || undefined,
        questionsPerCategory: formData.questionsPerCategory || 3,
      };

      if (!validatedData.websiteUrl || !validatedData.country || !validatedData.language) {
        throw new Error("Please fill in all required fields!");
      }

      this.workflowData = validatedData;

      // Hide configuration and show progress
      this.startAnalysisUI();

      // Update progress to initial state
      this.updateAnalysisUI(1, "Starting Analysis", "Preparing...", 5);

      // Start with step 1
      await this.executeStep1();
    } catch (error) {
      console.error("Error starting analysis:", error);
      this.showError(error instanceof Error ? error.message : "Unknown error");
      throw error;
    }
  }

  /**
   * Step 1: Find Sitemap
   */
  private async executeStep1(): Promise<void> {
    if (!this.workflowData) throw new Error("No workflow data");

    try {
      this.updateAnalysisUI(
        1,
        "Finding Sitemap",
        `Searching for sitemap.xml on ${this.workflowData.websiteUrl}`,
        5
      );

      const result = await workflowService.step1FindSitemap({
        websiteUrl: this.workflowData.websiteUrl,
        country: this.workflowData.country,
        language: this.workflowData.language,
        region: this.workflowData.region,
      });

      this.workflowData.runId = result.runId;
      this.workflowData.urls = result.urls || [];
      this.workflowData.foundSitemap = result.foundSitemap !== false;

      const urlCount = result.urls?.length || 0;
      if (result.foundSitemap) {
        this.updateAnalysisUI(
          1,
          "Sitemap Found",
          `${urlCount} URLs found. Preparing next step...`,
          20
        );
      } else {
        this.updateAnalysisUI(
          1,
          "Sitemap Not Found",
          `${urlCount} URLs extracted from homepage. Preparing next step...`,
          20
        );
      }

      if (result.urls && result.urls.length > 0) {
        setTimeout(() => this.executeStep2(), 1000);
      } else {
        this.showError("No URLs found. Please enter URLs manually or use crawling.");
      }
    } catch (error) {
      console.error("Error in executeStep1:", error);
      this.showError(error instanceof Error ? error.message : "Failed to start analysis");
      throw error;
    }
  }

  /**
   * Step 2: Fetch Content
   */
  private async executeStep2(): Promise<void> {
    if (!this.workflowData || !this.workflowData.runId || !this.workflowData.urls) {
      throw new Error("Missing workflow data for step 2");
    }

    try {
      const urlCount = this.workflowData.urls.length;
      this.updateAnalysisUI(2, "Fetching Content", `Loading content from ${urlCount} URLs`, 25);

      const resultContent = document.getElementById("resultContent");
      if (resultContent) {
        resultContent.innerHTML = '<h3>📄 Fetching Content:</h3><div id="contentList"></div>';
      }
      const result = document.getElementById("result");
      if (result) {
        result.style.display = "block";
        result.classList.add("show");
      }

      let fetchedCount = 0;
      const contentList = document.getElementById("contentList");
      const allContent: string[] = [];

      const maxUrls = Math.min(this.workflowData.urls.length, 50);
      for (let i = 0; i < maxUrls; i++) {
        const url = this.workflowData.urls[i];
        const progress = 25 + Math.floor((i / maxUrls) * 15);

        this.updateAnalysisUI(
          2,
          "Fetching Content",
          `Loading URL ${i + 1} of ${maxUrls}`,
          progress
        );

        try {
          const data = await workflowService.fetchUrl(url);
          if (data.content) {
            fetchedCount++;
            allContent.push(data.content);
            if (contentList) {
              const urlDiv = document.createElement("div");
              urlDiv.style.cssText =
                "margin: 5px 0; padding: 8px; background: #e8f5e9; border-radius: 4px; border-left: 3px solid #4caf50;";
              urlDiv.innerHTML = `<strong>✓ ${url}</strong><br><small>${data.content.substring(0, 100)}...</small>`;
              contentList.appendChild(urlDiv);
            }
          }
        } catch (error) {
          if (contentList) {
            const urlDiv = document.createElement("div");
            urlDiv.style.cssText =
              "margin: 5px 0; padding: 8px; background: #ffebee; border-radius: 4px; border-left: 3px solid #f44336;";
            urlDiv.innerHTML = `<strong>✗ ${url}</strong><br><small>Error loading</small>`;
            contentList.appendChild(urlDiv);
          }
        }
      }

      this.workflowData.content = allContent.join("\n\n");
      this.updateAnalysisUI(
        2,
        "Content Fetched",
        `${fetchedCount} pages successfully loaded. Preparing next step...`,
        40
      );

      setTimeout(() => this.executeStep3(), 1000);
    } catch (error) {
      console.error("Error in executeStep2:", error);
      this.showError(error instanceof Error ? error.message : "Failed to fetch content");
      throw error;
    }
  }

  /**
   * Step 3: Generate Categories
   */
  private async executeStep3(): Promise<void> {
    if (!this.workflowData || !this.workflowData.runId || !this.workflowData.content) {
      throw new Error("Missing workflow data for step 3");
    }

    try {
      this.updateAnalysisUI(3, "Generating Categories", "Analyzing content and generating categories...", 50);

      const result = await workflowService.step3GenerateCategories(
        this.workflowData.runId,
        this.workflowData.content,
        this.workflowData.language
      );

      if (!result.categories || !Array.isArray(result.categories)) {
        throw new Error("No categories received from server");
      }

      this.workflowData.categories = result.categories;

      this.updateAnalysisUI(
        3,
        "Categories Generated",
        `${result.categories.length} categories found. Select categories...`,
        60
      );

      this.showCategorySelection(result.categories);
    } catch (error) {
      console.error("Error in executeStep3:", error);
      this.showError(error instanceof Error ? error.message : "Failed to generate categories");
      throw error;
    }
  }

  /**
   * Show category selection UI
   */
  private showCategorySelection(categories: any[]): void {
    const result = document.getElementById("result");
    const resultContent = document.getElementById("resultContent");

    if (!result || !resultContent) {
      console.error("Result elements not found!");
      return;
    }

    result.style.display = "block";
    result.classList.add("show");

    let html = '<div style="margin-bottom: 20px;">';
    html += `<h3 style="margin-bottom: 16px; color: var(--gray-900); font-size: 20px;">📋 Select Categories (${categories.length} found):</h3>`;
    html +=
      '<p style="color: var(--gray-600); font-size: 14px; margin-bottom: 20px;">Select the categories for which questions should be generated. You can also add new categories.</p>';
    html += "</div>";

    html += '<form id="categoryForm" style="margin-top: 20px;">';

    if (categories.length === 0) {
      html +=
        '<div style="padding: 20px; background: var(--gray-100); border-radius: 8px; color: var(--gray-600);">';
      html += "No categories found. Please try again or add categories manually.";
      html += "</div>";
    } else {
      html +=
        '<div id="categoriesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; margin-bottom: 16px;">';
      categories.forEach((cat, index) => {
        const catId = (cat.id || `cat_${index}`).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        const catName = (cat.name || `Category ${index + 1}`)
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
        const catDesc = (cat.description || "No description")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
        html += `<div class="category-item-compact" data-cat-id="${catId}" style="padding: 10px; background: white; border: 1px solid var(--gray-200); border-radius: 6px; transition: all 0.2s; cursor: pointer;">`;
        html += '<label style="display: flex; align-items: center; cursor: pointer; gap: 8px; margin: 0;">';
        html += `<input type="checkbox" name="category" value="${catId}" checked style="width: 16px; height: 16px; cursor: pointer; flex-shrink: 0;">`;
        html += '<div style="flex: 1; min-width: 0;">';
        html += `<strong style="display: block; color: var(--gray-900); font-size: 14px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${catName}</strong>`;
        html += `<span style="display: block; color: var(--gray-600); font-size: 12px; line-height: 1.3; max-height: 2.6em; overflow: hidden; text-overflow: ellipsis;">${catDesc}</span>`;
        html += "</div>";
        html += "</label>";
        html += "</div>";
      });
      html += "</div>";
    }

    html += '<div style="margin-top: 24px; display: flex; gap: 12px;">';
    html +=
      '<button type="submit" class="btn btn-primary" style="flex: 1; padding: 14px 24px; font-size: 16px;">✅ Continue to Generate Questions</button>';
    html += "</div>";
    html += "</form>";

    resultContent.innerHTML = html;

    // Handle form submission
    const categoryForm = document.getElementById("categoryForm") as HTMLFormElement;
    if (categoryForm) {
      categoryForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleCategorySelection();
      });
    }

    // Add click handlers for category items
    const categoryItems = document.querySelectorAll(".category-item-compact");
    categoryItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (
          target.tagName !== "INPUT" &&
          target.tagName !== "LABEL" &&
          target.tagName !== "STRONG" &&
          target.tagName !== "SPAN" &&
          target.tagName !== "DIV"
        ) {
          const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
          if (checkbox) {
            checkbox.click();
          }
        }
      });
    });
  }

  /**
   * Handle category selection and proceed to step 4
   */
  private async handleCategorySelection(): Promise<void> {
    if (!this.workflowData || !this.workflowData.runId) {
      throw new Error("Missing workflow data");
    }

    const form = document.getElementById("categoryForm") as HTMLFormElement;
    if (!form) return;

    // Disable/hide the button immediately to prevent spamming
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Generating Questions...";
      submitButton.style.opacity = "0.6";
      submitButton.style.cursor = "not-allowed";
    }

    const selectedCheckboxes = form.querySelectorAll('input[name="category"]:checked');
    const selectedCategoryIds: string[] = [];
    selectedCheckboxes.forEach((cb) => {
      const value = (cb as HTMLInputElement).value;
      if (value && !value.startsWith("custom_")) {
        selectedCategoryIds.push(value);
      }
    });

    // Save selected categories
    await workflowService.saveCategories(this.workflowData.runId, selectedCategoryIds, []);

    // Proceed to step 4
    await this.executeStep4();
  }

  /**
   * Step 4: Generate Prompts
   */
  private async executeStep4(): Promise<void> {
    if (!this.workflowData || !this.workflowData.runId || !this.workflowData.categories) {
      throw new Error("Missing workflow data for step 4");
    }

    try {
      this.updateAnalysisUI(4, "Generating Prompts", "Generating questions for selected categories...", 70);

      const result = await workflowService.step4GeneratePrompts(
        this.workflowData.runId,
        this.workflowData.categories,
        {
          websiteUrl: this.workflowData.websiteUrl,
          country: this.workflowData.country,
          language: this.workflowData.language,
          region: this.workflowData.region,
        },
        this.workflowData.content || "",
        this.workflowData.questionsPerCategory
      );

      if (result.prompts && Array.isArray(result.prompts)) {
        await workflowService.savePrompts(this.workflowData.runId, result.prompts);
        this.updateAnalysisUI(4, "Prompts Generated", `${result.prompts.length} prompts created. Executing...`, 80);
        setTimeout(() => this.executeStep5(), 1000);
      } else {
        throw new Error("No prompts received from server");
      }
    } catch (error) {
      console.error("Error in executeStep4:", error);
      this.showError(error instanceof Error ? error.message : "Failed to generate prompts");
      throw error;
    }
  }

  /**
   * Step 5: Execute Prompts
   */
  private async executeStep5(): Promise<void> {
    if (!this.workflowData || !this.workflowData.runId) {
      throw new Error("Missing workflow data for step 5");
    }

    try {
      this.updateAnalysisUI(5, "Executing Prompts", "Running prompts and collecting results...", 90);

      await workflowService.step5ExecutePrompts(this.workflowData.runId);

      this.updateAnalysisUI(5, "Analysis Complete", "All prompts executed successfully!", 100);

      // Show completion message
      setTimeout(() => {
        const resultContent = document.getElementById("resultContent");
        if (resultContent) {
          resultContent.innerHTML = `
            <div style="color: green; padding: 20px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
              <h3>✅ Analysis Completed!</h3>
              <p>Run ID: ${this.workflowData?.runId}</p>
              <p>The analysis has been completed successfully. You can view the results in the Dashboard.</p>
            </div>
          `;
        }
        const result = document.getElementById("result");
        if (result) {
          result.style.display = "block";
          result.classList.add("show");
        }
      }, 1000);
    } catch (error) {
      console.error("Error in executeStep5:", error);
      this.showError(error instanceof Error ? error.message : "Failed to execute prompts");
      throw error;
    }
  }

  /**
   * UI Helper: Start analysis UI
   */
  private startAnalysisUI(): void {
    const configurationCard = document.getElementById("configurationCard");
    const analysisProgress = document.getElementById("analysisProgress");
    const loading = document.getElementById("loading");
    const result = document.getElementById("result");

    if (configurationCard) {
      configurationCard.style.display = "none";
      configurationCard.classList.add("hidden");
    }

    if (analysisProgress) {
      analysisProgress.style.display = "block";
    }

    if (loading) {
      loading.style.display = "none";
      loading.classList.remove("show");
    }

    if (result) {
      result.style.display = "none";
      result.classList.remove("show");
    }
  }

  /**
   * UI Helper: Update analysis UI
   */
  private updateAnalysisUI(step: number, title: string, description: string, percentage: number): void {
    const stepNumber = document.getElementById("stepNumber");
    const currentStepTitle = document.getElementById("currentStepTitle");
    const currentStepDescription = document.getElementById("currentStepDescription");
    const progressPercentage = document.getElementById("progressPercentage");
    const progressFill = document.getElementById("progressFill");

    if (stepNumber) stepNumber.textContent = step.toString();
    if (currentStepTitle) currentStepTitle.textContent = title;
    if (currentStepDescription) currentStepDescription.textContent = description;
    if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
    if (progressFill) progressFill.style.width = `${percentage}%`;
  }

  /**
   * UI Helper: Show error
   */
  private showError(message: string): void {
    const result = document.getElementById("result");
    const resultContent = document.getElementById("resultContent");
    const loading = document.getElementById("loading");
    const configurationCard = document.getElementById("configurationCard");
    const analysisProgress = document.getElementById("analysisProgress");

    if (resultContent) {
      resultContent.innerHTML = `
        <div style="color: red; padding: 15px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">
          <strong>❌ Error:</strong><br>${message}
        </div>
      `;
    }

    if (result) {
      result.style.display = "block";
      result.classList.add("show");
    }

    if (loading) {
      loading.style.display = "none";
      loading.classList.remove("show");
    }

    if (configurationCard) {
      configurationCard.style.display = "block";
      configurationCard.classList.remove("hidden");
    }

    if (analysisProgress) {
      analysisProgress.style.display = "none";
    }

    const startBtn = document.getElementById("startAnalysisBtn") as HTMLButtonElement;
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "Start Analysis";
    }
  }
}
