/**
 * Main GEO engine orchestrator
 */

import type {
  UserInput,
  AnalysisResult,
  Category,
  Prompt,
  LLMResponse,
  PromptAnalysis,
  CategoryMetrics,
  CompetitiveAnalysis,
  TimeSeriesData,
} from "./types.js";
import type { Config } from "./config.js";
import { getConfig } from "./config.js";
import { ContentScraper } from "./ingestion/index.js";
import { CategoryGenerator } from "./categorization/index.js";
import { PromptGenerator } from "./prompt_generation/index.js";
import { LLMExecutor } from "./llm_execution/index.js";
import { AnalysisEngine } from "./analysis/index.js";
import { Database } from "./persistence/index.js";
import type { D1Database } from "./persistence/index.js";

export class GEOEngine {
  private config: Config;
  private contentScraper: ContentScraper;
  private categoryGenerator: CategoryGenerator;
  private promptGenerator: PromptGenerator;
  private llmExecutor: LLMExecutor;
  private analysisEngine: AnalysisEngine;

  constructor(env: Record<string, any>) {
    this.config = getConfig(env);
    this.contentScraper = new ContentScraper(this.config.crawling);
    this.categoryGenerator = new CategoryGenerator();
    this.promptGenerator = new PromptGenerator();
    this.llmExecutor = new LLMExecutor(this.config);
  }

  async runAnalysis(
    userInput: UserInput,
    env: Record<string, any>
  ): Promise<string> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const db = new Database(env.geo_db as D1Database);

    // Save initial run
    await db.saveAnalysisRun(runId, userInput, "running");

    // Run analysis asynchronously
    this.runAnalysisAsync(runId, userInput, env, db).catch(async (error) => {
      console.error("Analysis error:", error);
      await db.updateAnalysisStatus(runId, "failed", {
        step: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      await db.db
        .prepare("UPDATE analysis_runs SET error_message = ? WHERE id = ?")
        .bind(error instanceof Error ? error.message : "Unknown error", runId)
        .run();
    });

    return runId;
  }

  private async runAnalysisAsync(
    runId: string,
    userInput: UserInput,
    env: Record<string, any>,
    db: Database
  ): Promise<void> {
    try {
      // Extract brand name from URL
      const brandName = this.extractBrandName(userInput.websiteUrl);
      this.analysisEngine = new AnalysisEngine(
        brandName,
        this.config.analysis.brandFuzzyThreshold
      );

      // Step 1: Website ingestion
      await db.updateAnalysisStatus(runId, "running", {
        step: "crawling",
        progress: 10,
        message: "Crawling website...",
      });
      const websiteContent = await this.contentScraper.scrapeWebsite(
        userInput.websiteUrl,
        userInput.language
      );

      // Step 2: Category generation
      await db.updateAnalysisStatus(runId, "running", {
        step: "categorizing",
        progress: 30,
        message: "Generating categories...",
      });
      const categories = this.categoryGenerator.generateCategories(
        websiteContent,
        this.config.categories.minConfidence,
        this.config.categories.maxCategories
      );
      await db.saveCategories(runId, categories);

      // Step 3: Prompt generation
      await db.updateAnalysisStatus(runId, "running", {
        step: "generating_prompts",
        progress: 40,
        message: `Generating prompts for ${categories.length} categories...`,
      });
      const prompts = this.promptGenerator.generatePrompts(
        categories,
        userInput,
        this.config.prompts.questionsPerCategory
      );
      await db.savePrompts(runId, prompts);

      // Step 4: LLM execution
      await db.updateAnalysisStatus(runId, "running", {
        step: "llm_execution",
        progress: 50,
        message: `Executing ${prompts.length} prompts with GPT-5...`,
      });
      const responses = await this.llmExecutor.executePrompts(prompts);
      await db.saveLLMResponses(responses);

      // Step 5: Result analysis
      await db.updateAnalysisStatus(runId, "running", {
        step: "analyzing",
        progress: 80,
        message: "Analyzing responses...",
      });
      const analyses = this.analysisEngine.analyzeResponses(prompts, responses);
      await db.savePromptAnalyses(analyses);

      // Step 6: Category metrics
      await db.updateAnalysisStatus(runId, "running", {
        step: "calculating_metrics",
        progress: 90,
        message: "Calculating metrics...",
      });
      const categoryMetrics: CategoryMetrics[] = [];
      for (const category of categories) {
        const metrics = this.analysisEngine.calculateCategoryMetrics(
          category.id,
          prompts,
          analyses
        );
        categoryMetrics.push(metrics);
      }
      await db.saveCategoryMetrics(runId, categoryMetrics);

      // Step 7: Competitive analysis
      const competitiveAnalysis =
        this.analysisEngine.performCompetitiveAnalysis(analyses, prompts);
      await db.saveCompetitiveAnalysis(runId, competitiveAnalysis);

      // Step 8: Time series data
      const timeSeriesData: TimeSeriesData = {
        timestamp: new Date().toISOString(),
        visibilityScore: this.calculateOverallVisibility(categoryMetrics),
        citationCount: responses.reduce(
          (sum, r) => sum + r.citations.length,
          0
        ),
        brandMentionCount: analyses.reduce(
          (sum, a) => sum + a.brandMentions.exact + a.brandMentions.fuzzy,
          0
        ),
        competitorMentionCount: analyses.reduce(
          (sum, a) =>
            sum + a.competitors.reduce((s, c) => s + c.count, 0),
          0
        ),
      };
      await db.saveTimeSeriesData(runId, timeSeriesData);

      // Mark as completed
      await db.updateAnalysisStatus(runId, "completed", {
        step: "completed",
        progress: 100,
        message: "Analysis completed successfully!",
      });

      // Update run timestamp
      await db.db
        .prepare("UPDATE analysis_runs SET updated_at = ? WHERE id = ?")
        .bind(new Date().toISOString(), runId)
        .run();
    } catch (error) {
      console.error("Analysis error:", error);
      await db.updateAnalysisStatus(runId, "failed", {
        step: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      await db.db
        .prepare("UPDATE analysis_runs SET error_message = ? WHERE id = ?")
        .bind(error instanceof Error ? error.message : "Unknown error", runId)
        .run();
      throw error;
    }
  }

  async getAnalysisResult(
    runId: string,
    env: Record<string, any>
  ): Promise<AnalysisResult | null> {
    const db = new Database(env.geo_db as D1Database);
    return await db.getAnalysisRun(runId);
  }

  private extractBrandName(websiteUrl: string): string {
    try {
      const domain = new URL(websiteUrl).hostname;
      const parts = domain.split(".");
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch {
      return "the brand";
    }
  }

  private calculateOverallVisibility(
    categoryMetrics: CategoryMetrics[]
  ): number {
    if (categoryMetrics.length === 0) return 0;
    const sum = categoryMetrics.reduce(
      (s, m) => s + m.visibilityScore,
      0
    );
    return sum / categoryMetrics.length;
  }
}

