/**
 * Analysis Domain Service - Business logic for analysis operations
 * This layer contains domain-specific business rules and orchestration
 */

import type { UserInput, AnalysisResult, Category, Prompt, LLMResponse, PromptAnalysis } from "../../types.js";
import { AnalysisRepository } from "../../data/repositories/analysis-repository.js";
import { CategoryRepository } from "../../data/repositories/category-repository.js";
import { PromptRepository } from "../../data/repositories/prompt-repository.js";
import { CategoryGenerator } from "../categorization/index.js";
import { PromptGenerator } from "../prompt_generation/index.js";
import { LLMExecutor } from "../llm_execution/index.js";
import { AnalysisEngine } from "../analysis/index.js";
import type { Config } from "../config.js";

export class AnalysisDomainService {
  constructor(
    private analysisRepo: AnalysisRepository,
    private categoryRepo: CategoryRepository,
    private promptRepo: PromptRepository,
    private categoryGenerator: CategoryGenerator,
    private promptGenerator: PromptGenerator,
    private llmExecutor: LLMExecutor,
    private analysisEngine: AnalysisEngine,
    private config: Config
  ) {}

  /**
   * Start a new analysis run
   * Business rule: Generate runId, validate input, initialize run
   */
  async startAnalysis(userInput: UserInput): Promise<string> {
    // Business rule: Generate unique run ID
    const runId = this.generateRunId();
    
    // Business rule: Validate required fields
    this.validateUserInput(userInput);
    
    // Initialize run in database
    await this.analysisRepo.create(runId, userInput, "running");
    
    return runId;
  }

  /**
   * Generate categories from website content
   * Business rule: Apply confidence thresholds, limit categories
   */
  async generateCategories(runId: string, websiteContent: any): Promise<Category[]> {
    const categories = this.categoryGenerator.generateCategories(
      websiteContent,
      this.config.categories.minConfidence,
      this.config.categories.maxCategories
    );
    
    await this.categoryRepo.createMany(runId, categories);
    await this.analysisRepo.updateStatus(runId, "running", {
      step: "categorizing",
      progress: 30,
      message: `Generated ${categories.length} categories`,
    });
    
    return categories;
  }

  /**
   * Generate prompts for categories
   * Business rule: Questions per category, language/region awareness
   */
  async generatePrompts(
    runId: string,
    categories: Category[],
    userInput: UserInput
  ): Promise<Prompt[]> {
    const prompts = this.promptGenerator.generatePrompts(
      categories,
      userInput,
      this.config.prompts.questionsPerCategory
    );
    
    await this.promptRepo.createMany(runId, prompts);
    await this.analysisRepo.updateStatus(runId, "running", {
      step: "generating_prompts",
      progress: 40,
      message: `Generated ${prompts.length} prompts`,
    });
    
    return prompts;
  }

  /**
   * Execute prompts with LLM
   * Business rule: Sequential execution, error handling per prompt
   */
  async executePrompts(runId: string, prompts: Prompt[]): Promise<LLMResponse[]> {
    await this.analysisRepo.updateStatus(runId, "running", {
      step: "llm_execution",
      progress: 50,
      message: `Executing ${prompts.length} prompts`,
    });
    
    const responses = await this.llmExecutor.executePrompts(prompts);
    
    // Save responses (would need LLMResponseRepository)
    // For now, this is handled by the application layer
    
    return responses;
  }

  /**
   * Analyze LLM responses
   * Business rule: Extract brand mentions, competitors, sentiment
   */
  analyzeResponses(prompts: Prompt[], responses: LLMResponse[]): PromptAnalysis[] {
    return this.analysisEngine.analyzeResponses(prompts, responses);
  }

  /**
   * Complete analysis run
   * Business rule: Mark as completed, calculate final metrics
   */
  async completeAnalysis(runId: string): Promise<void> {
    await this.analysisRepo.updateStatus(runId, "completed", {
      step: "completed",
      progress: 100,
      message: "Analysis completed successfully",
    });
  }

  /**
   * Fail analysis run
   * Business rule: Mark as failed, store error message
   */
  async failAnalysis(runId: string, error: Error): Promise<void> {
    await this.analysisRepo.updateStatus(runId, "failed", {
      step: "error",
      progress: 0,
      message: error.message,
    });
  }

  // Private helper methods

  private generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateUserInput(input: UserInput): void {
    if (!input.websiteUrl) {
      throw new Error("Website URL is required");
    }
    if (!input.country) {
      throw new Error("Country is required");
    }
    if (!input.language) {
      throw new Error("Language is required");
    }
  }
}

