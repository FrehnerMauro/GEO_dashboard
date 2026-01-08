/**
 * Analysis Use Cases - Application layer orchestration
 * Coordinates domain services to fulfill business use cases
 */

import type { UserInput } from "../../types.js";
import { AnalysisDomainService } from "../../domain/services/analysis-domain-service.js";
import { AnalysisRepository } from "../../data/repositories/analysis-repository.js";
import { CategoryRepository } from "../../data/repositories/category-repository.js";
import { PromptRepository } from "../../data/repositories/prompt-repository.js";
import { ContentScraper } from "../ingestion/index.js";
import { CategoryGenerator } from "../categorization/index.js";
import { PromptGenerator } from "../prompt_generation/index.js";
import { LLMExecutor } from "../llm_execution/index.js";
import { AnalysisEngine } from "../analysis/index.js";
import { getConfig, type Config } from "../config.js";
import type { D1Database } from "../../persistence/index.js";

export class AnalysisUseCases {
  private domainService: AnalysisDomainService;
  private config: Config;

  constructor(env: Record<string, any>) {
    this.config = getConfig(env);
    const db = env.geo_db as D1Database;
    
    // Initialize repositories (Data Layer)
    const analysisRepo = new AnalysisRepository(db);
    const categoryRepo = new CategoryRepository(db);
    const promptRepo = new PromptRepository(db);
    
    // Initialize domain services (Business Logic Layer)
    const categoryGenerator = new CategoryGenerator();
    const promptGenerator = new PromptGenerator();
    const llmExecutor = new LLMExecutor(this.config);
    const analysisEngine = new AnalysisEngine(
      this.extractBrandName(""), // Will be set per analysis
      this.config.analysis.brandFuzzyThreshold
    );
    
    this.domainService = new AnalysisDomainService(
      analysisRepo,
      categoryRepo,
      promptRepo,
      categoryGenerator,
      promptGenerator,
      llmExecutor,
      analysisEngine,
      this.config
    );
  }

  /**
   * Use Case: Start and run a complete analysis
   * Orchestrates the full analysis workflow
   */
  async runCompleteAnalysis(userInput: UserInput, env: Record<string, any>): Promise<string> {
    // Step 1: Start analysis (Business Logic)
    const runId = await this.domainService.startAnalysis(userInput);
    
    // Step 2: Scrape website (Domain Logic)
    const contentScraper = new ContentScraper(this.config.crawling);
    const websiteContent = await contentScraper.scrapeWebsite(
      userInput.websiteUrl,
      userInput.language
    );
    
    // Step 3: Generate categories (Business Logic)
    const categories = await this.domainService.generateCategories(runId, websiteContent);
    
    // Step 4: Generate prompts (Business Logic)
    const prompts = await this.domainService.generatePrompts(runId, categories, userInput);
    
    // Step 5: Execute prompts (Business Logic)
    const responses = await this.domainService.executePrompts(runId, prompts);
    
    // Step 6: Analyze responses (Business Logic)
    const analyses = this.domainService.analyzeResponses(prompts, responses);
    
    // Step 7: Save results (Data Layer - would need repositories)
    // This is currently handled by the old Database class
    // TODO: Create LLMResponseRepository and AnalysisRepository methods
    
    // Step 8: Complete analysis (Business Logic)
    await this.domainService.completeAnalysis(runId);
    
    return runId;
  }

  /**
   * Use Case: Get analysis result
   * Retrieves and formats analysis data for presentation
   */
  async getAnalysisResult(runId: string, env: Record<string, any>): Promise<any> {
    // This would use repositories to fetch and assemble the result
    // For now, delegate to existing engine
    const { GEOEngine } = await import("../engine.js");
    const engine = new GEOEngine(env);
    return await engine.getAnalysisResult(runId, env);
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
}

