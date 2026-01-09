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
  prompts?: any[];
  selectedPrompts?: any[];
  foundSitemap?: boolean;
}

export class AnalysisWorkflow {
  private workflowData: WorkflowData | null = null;
  private isRunning: boolean = false;

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
    // Prevent starting a new analysis if one is already running
    if (this.isRunning) {
      throw new Error("Analysis is already running. Please wait for it to complete.");
    }

    try {
      this.isRunning = true;
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
      this.updateAnalysisUI(1, "Starting Analysis", "Initializing analysis workflow and preparing to extract content from your website...", 5);

      // Start with step 1
      await this.executeStep1();
    } catch (error) {
      console.error("Error starting analysis:", error);
      this.isRunning = false;
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
        `Searching for sitemap.xml on ${this.workflowData.websiteUrl}. A sitemap helps us discover all pages on your website efficiently.`,
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
          `✓ Found ${urlCount} URLs in sitemap. These pages will be analyzed for content extraction.`,
          20
        );
      } else {
        this.updateAnalysisUI(
          1,
          "Sitemap Not Found",
          `No sitemap found. Extracted ${urlCount} URLs from homepage links. These will be used for analysis.`,
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
      this.updateAnalysisUI(2, "Fetching Content", `Extracting text content from ${urlCount} URLs. This content will be analyzed to generate relevant categories and questions.`, 25);

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
          `Processing URL ${i + 1} of ${maxUrls}. Extracting and cleaning text content for analysis...`,
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
        `✓ Successfully extracted content from ${fetchedCount} pages. The content is now ready for AI-powered category generation.`,
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
      this.updateAnalysisUI(3, "Generating Categories", "Using AI to analyze your content and identify relevant topic categories. This helps organize questions by theme.", 50);
      this.showLoadingSpinner("Analyzing content with AI to generate relevant categories...");

      const result = await workflowService.step3GenerateCategories(
        this.workflowData.runId,
        this.workflowData.content,
        this.workflowData.language
      );

      this.hideLoadingSpinner();

      if (!result.categories || !Array.isArray(result.categories)) {
        throw new Error("No categories received from server");
      }

      this.workflowData.categories = result.categories;

      // Hide spinner when waiting for user input
      this.hideLoadingSpinner();

      this.updateAnalysisUI(
        3,
        "Categories Generated",
        `✓ AI identified ${result.categories.length} relevant categories. Please select which categories you want to analyze. You can select multiple categories.`,
        60
      );

      this.showCategorySelection(result.categories);
    } catch (error) {
      this.hideLoadingSpinner();
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
    html += `<h3 style="margin-bottom: 16px; color: var(--gray-900); font-size: 20px;">📋 Select Categories (${categories.length} found)</h3>`;
    html +=
      '<div style="padding: 16px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(251, 191, 36, 0.08) 100%); border-radius: 8px; border-left: 4px solid var(--primary); margin-bottom: 20px;">';
    html += '<p style="color: var(--gray-600); font-size: 14px; line-height: 1.6; margin: 0;"><strong>What happens next?</strong> For each selected category, the system will generate questions that test how well your content answers common user queries. Select all categories you want to analyze, or choose specific ones to focus on.</p>';
    html += '</div>';
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
    if (!this.workflowData || !this.workflowData.runId || !this.workflowData.categories) {
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

    if (selectedCategoryIds.length === 0) {
      alert("Please select at least one category!");
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "✅ Continue to Generate Questions";
        submitButton.style.opacity = "1";
        submitButton.style.cursor = "pointer";
      }
      return;
    }

    // Filter categories to only include selected ones
    const selectedCategories = this.workflowData.categories.filter((cat) =>
      selectedCategoryIds.includes(cat.id)
    );

    // Update workflow data with selected categories only
    this.workflowData.categories = selectedCategories;

    // Save selected categories
    await workflowService.saveCategories(this.workflowData.runId, selectedCategoryIds, []);

    // Proceed to step 4 with only selected categories
    await this.executeStep4();
  }

  /**
   * Step 4: Generate Prompts
   */
  private async executeStep4(): Promise<void> {
    if (!this.workflowData || !this.workflowData.runId || !this.workflowData.categories) {
      throw new Error("Missing workflow data for step 4");
    }

    // Declare statusInterval outside try block so it's available in catch
    let statusInterval: ReturnType<typeof setInterval> | null = null;
    
    try {
      const categoryCount = this.workflowData.categories.length;
      const questionsPerCat = this.workflowData.questionsPerCategory;
      const totalExpected = categoryCount * questionsPerCat;
      
      this.updateAnalysisUI(4, "Generating Questions", `Creating ${questionsPerCat} questions per category for ${categoryCount} selected categories (${totalExpected} total). These questions will test your content's coverage.`, 70);
      this.showLoadingSpinner(`Using AI to generate ${totalExpected} relevant questions across ${categoryCount} categories. This may take a moment...`);

      // Update status as we progress through categories
      let processedCategories = 0;
      statusInterval = setInterval(() => {
        processedCategories++;
        if (processedCategories <= categoryCount) {
        this.updateDetailedStatus(
          `Processing category ${processedCategories}/${categoryCount}... Generating ${questionsPerCat} questions tailored to your content.`
        );
        }
      }, 3000); // Update every 3 seconds to show progress

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

      if (statusInterval) clearInterval(statusInterval);
      this.hideLoadingSpinner();

      if (result.prompts && Array.isArray(result.prompts)) {
        // Hide spinner when waiting for user input
        this.hideLoadingSpinner();

        // DO NOT save prompts here - they will only be saved after successful execution with responses
        // Store prompts in workflow data for selection
        this.workflowData.prompts = result.prompts;
        
        this.updateAnalysisUI(4, "Questions Generated", `✓ Successfully created ${result.prompts.length} questions. Review and select which questions you want to execute with web search to find mentions and citations.`, 75);
        
        // Show prompts to user for selection BEFORE execution
        setTimeout(() => this.showPromptSelection(result.prompts), 1000);
      } else {
        throw new Error("No prompts received from server");
      }
    } catch (error) {
      if (statusInterval) clearInterval(statusInterval);
      this.hideLoadingSpinner();
      console.error("Error in executeStep4:", error);
      this.showError(error instanceof Error ? error.message : "Failed to generate prompts");
      throw error;
    }
  }

  /**
   * Show prompt selection UI
   */
  private showPromptSelection(prompts: any[]): void {
    const result = document.getElementById("result");
    const resultContent = document.getElementById("resultContent");

    if (!result || !resultContent) {
      console.error("Result elements not found!");
      return;
    }

    result.style.display = "block";
    result.classList.add("show");

    let html = '<div style="margin-bottom: 20px;">';
    html += `<h3 style="margin-bottom: 16px; color: var(--gray-900); font-size: 20px;">❓ Select Questions (${prompts.length} generated)</h3>`;
    html +=
      '<div style="padding: 16px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(251, 191, 36, 0.08) 100%); border-radius: 8px; border-left: 4px solid var(--primary); margin-bottom: 20px;">';
    html += '<p style="color: var(--gray-600); font-size: 14px; line-height: 1.6; margin: 0;"><strong>What happens next?</strong> Selected questions will be executed with web search to find where your brand is mentioned and cited. This helps measure your content\'s visibility and authority. Select all questions or choose specific ones to analyze.</p>';
    html += '</div>';
    html += "</div>";

    html += '<form id="promptForm" style="margin-top: 20px;">';

    if (prompts.length === 0) {
      html +=
        '<div style="padding: 20px; background: var(--gray-100); border-radius: 8px; color: var(--gray-600);">';
      html += "No questions generated. Please try again.";
      html += "</div>";
    } else {
      // Group prompts by category
      const promptsByCategory = new Map<string, any[]>();
      prompts.forEach((prompt) => {
        const categoryName = prompt.categoryName || prompt.category_id || "Unknown";
        if (!promptsByCategory.has(categoryName)) {
          promptsByCategory.set(categoryName, []);
        }
        promptsByCategory.get(categoryName)!.push(prompt);
      });

      // Display prompts grouped by category
      promptsByCategory.forEach((categoryPrompts, categoryName) => {
        html += `<div style="margin-bottom: 24px;">`;
        html += `<h4 style="color: var(--gray-800); font-size: 16px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid var(--gray-200);">📁 ${categoryName} (${categoryPrompts.length})</h4>`;
        html += '<div style="display: flex; flex-direction: column; gap: 8px;">';
        
        categoryPrompts.forEach((prompt, index) => {
          const promptId = prompt.id || `prompt_${index}`;
          const question = (prompt.question || prompt.text || "No question")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
          
          html += `<div class="prompt-item-selection" data-prompt-id="${promptId}" style="padding: 12px; background: white; border: 2px solid var(--gray-200); border-radius: 6px; transition: all 0.2s; cursor: pointer;">`;
          html += '<label style="display: flex; align-items: start; cursor: pointer; gap: 10px; margin: 0;">';
          html += `<input type="checkbox" name="prompt" value="${promptId}" checked style="width: 18px; height: 18px; cursor: pointer; flex-shrink: 0; margin-top: 2px;">`;
          html += '<div style="flex: 1; min-width: 0;">';
          html += `<div style="color: var(--gray-900); font-size: 14px; line-height: 1.5;">${question}</div>`;
          html += "</div>";
          html += "</label>";
          html += "</div>";
        });
        
        html += "</div>";
        html += "</div>";
      });
    }

    html += '<div style="margin-top: 24px; display: flex; gap: 12px;">';
    html +=
      '<button type="button" id="selectAllPromptsBtn" class="btn" style="flex: 0 0 auto; padding: 14px 24px; font-size: 16px; background: var(--gray-100); color: var(--gray-700);">Select All</button>';
    html +=
      '<button type="submit" class="btn btn-primary" style="flex: 1; padding: 14px 24px; font-size: 16px;">✅ Execute Selected Questions</button>';
    html += "</div>";
    html += "</form>";

    resultContent.innerHTML = html;

    // Handle form submission
    const promptForm = document.getElementById("promptForm") as HTMLFormElement;
    if (promptForm) {
      promptForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handlePromptSelection();
      });
    }

    // Handle select all button
    const selectAllBtn = document.getElementById("selectAllPromptsBtn");
    if (selectAllBtn) {
      selectAllBtn.addEventListener("click", () => {
        const checkboxes = promptForm.querySelectorAll('input[name="prompt"]') as NodeListOf<HTMLInputElement>;
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => {
          cb.checked = !allChecked;
          const item = cb.closest('.prompt-item-selection') as HTMLElement;
          if (item) {
            this.updatePromptSelectionStyle(item, cb.checked);
          }
        });
        selectAllBtn.textContent = allChecked ? "Select All" : "Deselect All";
      });
    }

    // Add click handlers for prompt items
    const promptItems = resultContent.querySelectorAll(".prompt-item-selection");
    promptItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (
          target.tagName !== "INPUT" &&
          target.tagName !== "LABEL"
        ) {
          const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
          if (checkbox) {
            checkbox.checked = !checkbox.checked;
            this.updatePromptSelectionStyle(item as HTMLElement, checkbox.checked);
          }
        }
      });
    });

    // Add change handlers for checkboxes
    const checkboxes = resultContent.querySelectorAll('input[name="prompt"]');
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const item = (e.target as HTMLElement).closest('.prompt-item-selection') as HTMLElement;
        if (item) {
          this.updatePromptSelectionStyle(item, (e.target as HTMLInputElement).checked);
        }
      });
    });
  }

  /**
   * Update prompt selection item style
   */
  private updatePromptSelectionStyle(item: HTMLElement, selected: boolean): void {
    if (selected) {
      item.style.borderColor = "var(--primary)";
      item.style.background = "#E3F2FD";
    } else {
      item.style.borderColor = "var(--gray-200)";
      item.style.background = "white";
    }
  }

  /**
   * Handle prompt selection and proceed to step 5
   */
  private async handlePromptSelection(): Promise<void> {
    if (!this.workflowData || !this.workflowData.runId || !this.workflowData.prompts) {
      throw new Error("Missing workflow data");
    }

    const form = document.getElementById("promptForm") as HTMLFormElement;
    if (!form) return;

    // Disable/hide the button immediately to prevent spamming
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Executing questions...";
      submitButton.style.opacity = "0.6";
      submitButton.style.cursor = "not-allowed";
    }

    const selectedCheckboxes = form.querySelectorAll('input[name="prompt"]:checked');
    const selectedPromptIds: string[] = [];
    selectedCheckboxes.forEach((cb) => {
      const value = (cb as HTMLInputElement).value;
      if (value) {
        selectedPromptIds.push(value);
      }
    });

    if (selectedPromptIds.length === 0) {
      alert("Please select at least one question!");
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "✅ Execute Selected Questions";
        submitButton.style.opacity = "1";
        submitButton.style.cursor = "pointer";
      }
      return;
    }

    // Filter prompts to only include selected ones
    const selectedPrompts = this.workflowData.prompts.filter((p) =>
      selectedPromptIds.includes(p.id)
    );

    // Update workflow data with selected prompts
    this.workflowData.selectedPrompts = selectedPrompts;

    // Proceed to step 5 with selected prompts
    await this.executeStep5(selectedPrompts);
  }

  /**
   * Step 5: Execute Prompts
   */
  private async executeStep5(selectedPrompts?: any[]): Promise<void> {
    if (!this.workflowData || !this.workflowData.runId) {
      throw new Error("Missing workflow data for step 5");
    }

    // Declare statusInterval outside try block so it's available in catch
    let statusInterval: ReturnType<typeof setInterval> | null = null;
    
    try {
      const promptsToExecute = selectedPrompts || this.workflowData.selectedPrompts || [];
      const promptCount = promptsToExecute.length;
      
      this.updateAnalysisUI(5, "Executing Questions", `Running ${promptCount} questions through AI with web search to find brand mentions and citations. This measures your content's visibility and authority.`, 85);
      this.showLoadingSpinner(`Processing question 1/${promptCount}... Searching the web and analyzing results for mentions and citations.`);

      // Update status as prompts are executed
      let executedCount = 0;
      statusInterval = setInterval(() => {
        executedCount++;
        if (executedCount <= promptCount) {
          this.updateDetailedStatus(
            `Processing question ${executedCount}/${promptCount}... Analyzing web search results for brand mentions and citations.`
          );
        }
      }, 2000); // Update every 2 seconds

      await workflowService.step5ExecutePrompts(this.workflowData.runId, promptsToExecute);

      if (statusInterval) clearInterval(statusInterval);

      // Hide spinner after API call completes
      if (statusInterval) clearInterval(statusInterval);
      this.hideLoadingSpinner();

      this.updateAnalysisUI(5, "Analysis Completed", "✓ All questions executed successfully! Compiling results, calculating mentions and citations, and generating insights...", 95);

      // Wait a bit for analysis to complete, then load and display results
      setTimeout(async () => {
        try {
          if (!this.workflowData?.runId) {
            throw new Error("Run ID is missing");
          }
          
          // Hide spinner before loading results
          this.hideLoadingSpinner();
          
          // Generate summary with mentions, citations, best prompts, and other sources
          await workflowService.generateSummary(this.workflowData.runId);
          
          // Load prompts and summary to display
          const promptsAndSummary = await workflowService.getPromptsAndSummary(this.workflowData.runId);
          this.displayFinalResults(promptsAndSummary);
          this.isRunning = false;
        } catch (error) {
          console.error("Error loading prompts and summary:", error);
          this.isRunning = false;
          // Fallback to simple message
          this.displaySimpleCompletion();
        }
      }, 2000);
    } catch (error) {
      if (statusInterval) clearInterval(statusInterval);
      this.hideLoadingSpinner();
      this.isRunning = false;
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
    if (currentStepDescription) {
      // Check if description contains HTML (spinner), if not, set as text
      if (currentStepDescription.innerHTML.includes('spinner')) {
        // Keep spinner, just update the text part
        const span = currentStepDescription.querySelector('span');
        if (span) span.textContent = description;
      } else {
        currentStepDescription.textContent = description;
      }
    }
    if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
    if (progressFill) progressFill.style.width = `${percentage}%`;
  }

  /**
   * Show loading spinner during API calls with detailed status
   */
  private showLoadingSpinner(message: string = "Loading..."): void {
    const currentStepDescription = document.getElementById("currentStepDescription");
    if (currentStepDescription) {
      currentStepDescription.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="spinner" style="
            border: 3px solid #f3f3f3;
            border-top: 3px solid var(--primary);
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            flex-shrink: 0;
          "></div>
          <span style="flex: 1;">${message}</span>
        </div>
      `;
    }

    // Add spinner CSS animation if not already present
    if (!document.getElementById('spinner-style')) {
      const style = document.createElement('style');
      style.id = 'spinner-style';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Hide loading spinner and restore normal text
   */
  private hideLoadingSpinner(): void {
    const currentStepDescription = document.getElementById("currentStepDescription");
    if (currentStepDescription && currentStepDescription.innerHTML.includes('spinner')) {
      // Extract text from spinner if present, otherwise keep current
      const span = currentStepDescription.querySelector('span');
      if (span) {
        currentStepDescription.textContent = span.textContent || currentStepDescription.textContent;
      } else {
        // Remove spinner HTML, keep only text
        currentStepDescription.textContent = currentStepDescription.textContent || currentStepDescription.innerText;
      }
    }
  }

  /**
   * Update detailed status message during API calls
   */
  private updateDetailedStatus(message: string): void {
    const currentStepDescription = document.getElementById("currentStepDescription");
    if (currentStepDescription) {
      // If spinner is showing, update the message
      if (currentStepDescription.innerHTML.includes('spinner')) {
        const span = currentStepDescription.querySelector('span');
        if (span) {
          span.textContent = message;
        }
      } else {
        // Show spinner with message
        this.showLoadingSpinner(message);
      }
    }
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

    this.isRunning = false;
    const startBtn = document.getElementById("startAnalysisBtn") as HTMLButtonElement;
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "Start Analysis";
    }
  }

  /**
   * Display final results with mentions, citations, best prompts, and other sources
   */
  private displayFinalResults(data: { prompts: any[]; summary: any }): void {
    // Hide spinner when showing final results
    this.hideLoadingSpinner();
    const resultContent = document.getElementById("resultContent");
    const result = document.getElementById("result");
    
    if (!resultContent || !result) return;

    const { prompts = [], summary } = data;
    
      this.updateAnalysisUI(5, "Analysis Completed", "Displaying results...", 100);
    
    let html = `
      <div style="color: green; padding: 24px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%); border-radius: 12px; border-left: 4px solid #22c55e; margin-bottom: 24px; box-shadow: var(--shadow-md);">
        <div style="display: flex; align-items: start; gap: 16px;">
          <div style="font-size: 36px; flex-shrink: 0;">✅</div>
          <div style="flex: 1;">
            <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #16a34a;">Analysis Successfully Completed!</h3>
            <p style="margin-bottom: 8px; color: var(--text-secondary);"><strong>Run ID:</strong> <code style="background: rgba(34, 197, 94, 0.1); padding: 4px 8px; border-radius: 4px; font-size: 13px;">${this.workflowData?.runId}</code></p>
            <p style="color: var(--text-secondary); line-height: 1.6; margin: 0;">All questions have been executed and analyzed. The results show mentions (brand references) and citations (links to your website). Your analysis has been saved and can be viewed anytime in the Dashboard.</p>
          </div>
        </div>
      </div>
    `;

    // Display Summary with mentions and citations
    if (summary) {
      html += `
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; color: #333;">📊 Summary</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
            <div style="padding: 20px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%); border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2); text-align: center;">
              <div style="font-size: 36px; font-weight: 800; color: #3b82f6; margin-bottom: 8px; font-family: 'Space Grotesk', sans-serif;">${summary.totalMentions || 0}</div>
              <div style="color: var(--text-secondary); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Brand Mentions</div>
              <div style="color: var(--text-light); font-size: 12px; margin-top: 6px;">References to your brand in search results</div>
            </div>
            <div style="padding: 20px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%); border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.2); text-align: center;">
              <div style="font-size: 36px; font-weight: 800; color: #22c55e; margin-bottom: 8px; font-family: 'Space Grotesk', sans-serif;">${summary.totalCitations || 0}</div>
              <div style="color: var(--text-secondary); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Citations</div>
              <div style="color: var(--text-light); font-size: 12px; margin-top: 6px;">Links to your website as a source</div>
            </div>
          </div>
          
          ${summary.bestPrompts && summary.bestPrompts.length > 0 ? `
            <h4 style="color: #333; margin-top: 24px; font-size: 18px; font-weight: 700; margin-bottom: 12px;">🏆 Top Performing Questions (Top ${Math.min(summary.bestPrompts.length, 10)})</h4>
            <p style="color: #666; font-size: 14px; margin-bottom: 16px; line-height: 1.6;">These questions generated the most brand mentions and citations, indicating strong content coverage and visibility:</p>
            <ul style="list-style: none; padding: 0;">
              ${summary.bestPrompts.slice(0, 10).map((p: any, idx: number) => `
                <li style="padding: 12px; margin: 8px 0; background: #f9f9f9; border-left: 4px solid #4CAF50; border-radius: 4px;">
                  <div style="font-weight: 500; color: #333; margin-bottom: 5px;">
                    ${idx + 1}. ${p.question}
                  </div>
                  <div style="font-size: 12px; color: #666; margin-top: 5px; display: flex; gap: 15px;">
                    <span>📌 Mentions: <strong>${p.mentions || 0}</strong></span>
                    <span>🔗 Citations: <strong>${p.citations || 0}</strong></span>
                  </div>
                </li>
              `).join('')}
            </ul>
          ` : ''}
          
          ${summary.otherSources && Object.keys(summary.otherSources).length > 0 ? `
            <h4 style="color: #333; margin-top: 32px; font-size: 18px; font-weight: 700; margin-bottom: 12px;">🔗 External Sources Referenced</h4>
            <p style="color: #666; font-size: 14px; margin-bottom: 16px; line-height: 1.6;">These are other websites that appeared in search results. Understanding competitor sources helps identify content opportunities:</p>
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
          <h3 style="margin-top: 0; color: #333;">❓ Questions and Answers</h3>
          <p style="color: #666; margin-bottom: 15px;">All questions asked with their answers (saved for later retrieval):</p>
          <div style="max-height: 600px; overflow-y: auto;">
            <div id="promptsList" style="display: flex; flex-direction: column; gap: 15px;">
              ${prompts.map((prompt: any, index: number) => `
                <div style="padding: 15px; border: 2px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
                  <div style="margin-bottom: 10px;">
                    <div style="font-weight: 600; color: #333; font-size: 15px; margin-bottom: 8px;">
                      ${index + 1}. ${prompt.question || 'No question'}
                    </div>
                    ${prompt.categoryName ? `
                      <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                        Category: <span style="background: #e3f2fd; padding: 3px 8px; border-radius: 3px;">${prompt.categoryName}</span>
                      </div>
                    ` : ''}
                  </div>
                  ${prompt.answer ? `
                    <details style="margin-top: 10px;" open>
                      <summary style="cursor: pointer; color: #2196F3; font-size: 14px; font-weight: 500; margin-bottom: 10px;">Show Answer</summary>
                      <div style="margin-top: 10px; padding: 15px; background: white; border-radius: 4px; border-left: 3px solid #2196F3; font-size: 14px; color: #555; line-height: 1.6; white-space: pre-wrap;">
                        ${prompt.answer}
                      </div>
                    </details>
                  ` : '<div style="color: #999; font-size: 12px; margin-top: 5px;">No answer yet</div>'}
                  ${prompt.mentions !== undefined || prompt.citations !== undefined || prompt.otherLinks !== undefined ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
                      <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 10px;">
                        <span>📌 Mentions: <strong>${prompt.mentions || 0}</strong></span>
                        <span>🔗 Citations: <strong>${prompt.citations || 0}</strong></span>
                        ${prompt.otherLinks !== undefined ? `<span>🔗 Other Links: <strong>${prompt.otherLinks || 0}</strong></span>` : ''}
                      </div>
                      ${prompt.citationUrls && prompt.citationUrls.length > 0 ? `
                        <div style="margin-top: 8px; padding: 8px; background: #e8f5e9; border-radius: 4px;">
                          <div style="font-weight: 500; margin-bottom: 4px; color: #2e7d32;">Citation URLs:</div>
                          <div style="display: flex; flex-direction: column; gap: 4px;">
                            ${prompt.citationUrls.map((url: string) => `
                              <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: none; word-break: break-all; font-size: 11px;">
                                ${url}
                              </a>
                            `).join('')}
                          </div>
                        </div>
                      ` : ''}
                      ${prompt.otherLinkUrls && prompt.otherLinkUrls.length > 0 ? `
                        <div style="margin-top: 8px; padding: 8px; background: #fff3e0; border-radius: 4px;">
                          <div style="font-weight: 500; margin-bottom: 4px; color: #e65100;">Other Link URLs:</div>
                          <div style="display: flex; flex-direction: column; gap: 4px;">
                            ${prompt.otherLinkUrls.map((url: string) => `
                              <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: none; word-break: break-all; font-size: 11px;">
                                ${url}
                              </a>
                            `).join('')}
                          </div>
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    resultContent.innerHTML = html;
    result.style.display = "block";
    result.classList.add("show");
  }

  /**
   * Display results with prompts and summary (legacy method, kept for compatibility)
   */
  private displayResults(data: { prompts: any[]; summary: any }): void {
    const resultContent = document.getElementById("resultContent");
    const result = document.getElementById("result");
    
    if (!resultContent || !result) return;

    const { prompts = [], summary } = data;
    
    let html = `
      <div style="color: green; padding: 20px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50; margin-bottom: 20px;">
        <h3>✅ Analysis Completed!</h3>
        <p><strong>Run ID:</strong> ${this.workflowData?.runId}</p>
        <p>The analysis has been completed successfully.</p>
      </div>
    `;

    // Display Summary
    if (summary) {
      html += `
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; color: #333;">📊 Summary</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="padding: 15px; background: #f5f5f5; border-radius: 6px;">
              <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${summary.totalMentions || 0}</div>
              <div style="color: #666; font-size: 14px;">Brand Mentions</div>
            </div>
            <div style="padding: 15px; background: #f5f5f5; border-radius: 6px;">
              <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${summary.totalCitations || 0}</div>
              <div style="color: #666; font-size: 14px;">Total Citations</div>
            </div>
          </div>
          
          ${summary.bestPrompts && summary.bestPrompts.length > 0 ? `
            <h4 style="color: #333; margin-top: 20px;">Top Prompts</h4>
            <ul style="list-style: none; padding: 0;">
              ${summary.bestPrompts.slice(0, 5).map((p: any) => `
                <li style="padding: 10px; margin: 5px 0; background: #f9f9f9; border-left: 3px solid #4CAF50; border-radius: 4px;">
                  <strong>${p.question}</strong>
                  <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    Mentions: ${p.mentions || 0} | Citations: ${p.citations || 0}
                  </div>
                </li>
              `).join('')}
            </ul>
          ` : ''}
        </div>
      `;
    }

    // Display Prompts with selection
    if (prompts && prompts.length > 0) {
      html += `
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; color: #333;">❓ Generated Questions</h3>
          <p style="color: #666; margin-bottom: 15px;">You can select questions that you want to re-execute.</p>
          <div style="max-height: 500px; overflow-y: auto;">
            <div id="promptsList" style="display: flex; flex-direction: column; gap: 10px;">
              ${prompts.map((prompt: any, index: number) => `
                <div style="padding: 15px; border: 2px solid #e0e0e0; border-radius: 8px; background: #fafafa; transition: all 0.2s;" 
                     data-prompt-id="${prompt.id}"
                     class="prompt-item">
                  <div style="display: flex; align-items: start; gap: 10px;">
                    <input type="checkbox" 
                           id="prompt-${prompt.id}" 
                           style="margin-top: 4px; cursor: pointer;"
                           class="prompt-checkbox">
                    <div style="flex: 1;">
                      <div style="font-weight: 500; color: #333; margin-bottom: 5px;">
                        ${prompt.question || 'No question'}
                      </div>
                      ${prompt.categoryName ? `
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                          Category: <span style="background: #e3f2fd; padding: 2px 6px; border-radius: 3px;">${prompt.categoryName}</span>
                        </div>
                      ` : ''}
                      ${prompt.answer ? `
                        <details style="margin-top: 10px;">
                          <summary style="cursor: pointer; color: #2196F3; font-size: 14px;">Show Answer</summary>
                          <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 4px; border-left: 3px solid #2196F3; font-size: 14px; color: #555;">
                            ${prompt.answer.substring(0, 500)}${prompt.answer.length > 500 ? '...' : ''}
                          </div>
                        </details>
                      ` : '<div style="color: #999; font-size: 12px; margin-top: 5px;">No answer yet</div>'}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <button id="executeSelectedPrompts" 
                    style="padding: 12px 24px; background: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;"
                    onclick="window.analysisWorkflow?.executeSelectedPrompts()">
              Re-execute Selected Questions
            </button>
            <button id="selectAllPrompts" 
                    style="padding: 12px 24px; background: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; margin-left: 10px;"
                    onclick="window.analysisWorkflow?.selectAllPrompts()">
              Select All
            </button>
          </div>
        </div>
      `;
    }

    resultContent.innerHTML = html;
    result.style.display = "block";
    result.classList.add("show");

    // Add click handlers for prompt items
    const promptItems = resultContent.querySelectorAll('.prompt-item');
    promptItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'SUMMARY') {
          const checkbox = item.querySelector('.prompt-checkbox') as HTMLInputElement;
          if (checkbox) {
            checkbox.checked = !checkbox.checked;
            this.updatePromptItemStyle(item as HTMLElement, checkbox.checked);
          }
        }
      });
    });

    // Add change handlers for checkboxes
    const checkboxes = resultContent.querySelectorAll('.prompt-checkbox');
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', (e) => {
        const item = (e.target as HTMLElement).closest('.prompt-item') as HTMLElement;
        if (item) {
          this.updatePromptItemStyle(item, (e.target as HTMLInputElement).checked);
        }
      });
    });
  }

  /**
   * Update prompt item style based on selection
   */
  private updatePromptItemStyle(item: HTMLElement, selected: boolean): void {
    if (selected) {
      item.style.borderColor = '#2196F3';
      item.style.background = '#E3F2FD';
    } else {
      item.style.borderColor = '#e0e0e0';
      item.style.background = '#fafafa';
    }
  }

  /**
   * Select all prompts
   */
  selectAllPrompts(): void {
    const resultContent = document.getElementById("resultContent");
    if (!resultContent) return;

    const checkboxes = resultContent.querySelectorAll('.prompt-checkbox') as NodeListOf<HTMLInputElement>;
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach((checkbox) => {
      checkbox.checked = !allChecked;
      const item = checkbox.closest('.prompt-item') as HTMLElement;
      if (item) {
        this.updatePromptItemStyle(item, checkbox.checked);
      }
    });
  }

  /**
   * Execute selected prompts
   */
  async executeSelectedPrompts(): Promise<void> {
    const resultContent = document.getElementById("resultContent");
    if (!resultContent || !this.workflowData?.runId) {
      alert('Error: Run ID is missing.');
      return;
    }

    const runId = this.workflowData.runId;
    const checkboxes = resultContent.querySelectorAll('.prompt-checkbox:checked') as NodeListOf<HTMLInputElement>;
    const selectedPromptIds = Array.from(checkboxes).map(cb => {
      const item = cb.closest('.prompt-item') as HTMLElement;
      return item?.dataset.promptId;
    }).filter(id => id) as string[];

    if (selectedPromptIds.length === 0) {
      alert('Please select at least one question.');
      return;
    }

    // Get full prompt data
    const promptsAndSummary = await workflowService.getPromptsAndSummary(runId);
    const selectedPrompts = promptsAndSummary.prompts.filter((p: any) => selectedPromptIds.includes(p.id));

    try {
      const executeBtn = document.getElementById("executeSelectedPrompts") as HTMLButtonElement;
      if (executeBtn) {
        executeBtn.disabled = true;
        executeBtn.textContent = 'Executing...';
      }

      await workflowService.step5ExecutePrompts(runId, selectedPrompts);

      alert(`✅ ${selectedPrompts.length} questions were successfully re-executed!`);
      
      // Reload results
      const updatedData = await workflowService.getPromptsAndSummary(runId);
      this.displayResults(updatedData);
    } catch (error) {
      console.error("Error executing selected prompts:", error);
      alert('Error executing questions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      const executeBtn = document.getElementById("executeSelectedPrompts") as HTMLButtonElement;
      if (executeBtn) {
        executeBtn.disabled = false;
        executeBtn.textContent = 'Re-execute Selected Questions';
      }
    }
  }

  /**
   * Display simple completion message (fallback)
   */
  private displaySimpleCompletion(): void {
    // Hide spinner when showing completion
    this.hideLoadingSpinner();
    const resultContent = document.getElementById("resultContent");
    const result = document.getElementById("result");
    
    if (!resultContent || !result) return;

    resultContent.innerHTML = `
      <div style="color: green; padding: 20px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
        <h3>✅ Analysis Completed!</h3>
        <p>Run ID: ${this.workflowData?.runId}</p>
        <p>The analysis has been completed successfully. You can view the results in the Dashboard.</p>
      </div>
    `;
    result.style.display = "block";
    result.classList.add("show");
  }
}
