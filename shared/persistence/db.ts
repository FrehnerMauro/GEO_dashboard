/**
 * Database persistence layer for D1
 */

import type {
  UserInput,
  Category,
  Prompt,
  LLMResponse,
  PromptAnalysis,
  CategoryMetrics,
  CompetitiveAnalysis,
  TimeSeriesData,
  AnalysisResult,
  Company,
  CompanyPrompt,
  ScheduledRun,
  AnalysisSummary,
} from "../types.js";

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = any>(): Promise<D1Result<T>>;
}

export interface D1Result<T = any> {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
  };
  results?: T[];
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export class Database {
  public db: D1Database;
  constructor(db?: D1Database) {
    // No-op: create a mock db object if none provided
    this.db = db || {
      prepare: () => ({
        bind: () => ({ first: async () => null, run: async () => ({ success: true }), all: async () => ({ success: true, results: [] }) }),
        first: async () => null,
        run: async () => ({ success: true }),
        all: async () => ({ success: true, results: [] })
      } as any),
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 })
    } as D1Database;
  }

  /**
   * Retry wrapper for D1 operations to handle transient errors
   * Retries on D1_ERROR, timeout, or reset errors
   */
  private async retryD1Operation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 100,
    operationName?: string
  ): Promise<T> {
    let lastError: any;
    const opName = operationName || "D1 operation";
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const duration = Date.now() - startTime;
        
        if (duration > 1000) {
          console.log(`[D1 DEBUG] ${opName} completed in ${duration}ms`);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || String(error);
        
        // Check if this is a retryable D1 error
        const isRetryable = 
          errorMessage.includes("D1_ERROR") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("reset") ||
          errorMessage.includes("Internal error while starting up") ||
          errorMessage.includes("storage operation exceeded timeout");
        
        if (!isRetryable || attempt === maxRetries - 1) {
          console.error(`[D1 ERROR] ${opName} failed after ${attempt + 1} attempts:`, errorMessage);
          throw error;
        }
        
        // Exponential backoff: 100ms, 200ms, 400ms
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`[D1 RETRY] ${opName} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms:`, errorMessage);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Execute batch operations in chunks to avoid D1 timeout limits
   * D1 has a limit of ~100 statements per batch, so we chunk larger batches
   */
  private async batchInChunks(
    statements: D1PreparedStatement[],
    chunkSize: number = 50,
    operationName?: string
  ): Promise<void> {
    if (statements.length === 0) {
      return;
    }

    const opName = operationName || `batch operation (${statements.length} statements)`;
    console.log(`[D1 DEBUG] Executing ${opName} in chunks of ${chunkSize}`);

    // Process in chunks to avoid timeout
    for (let i = 0; i < statements.length; i += chunkSize) {
      const chunk = statements.slice(i, i + chunkSize);
      const chunkNum = Math.floor(i / chunkSize) + 1;
      const totalChunks = Math.ceil(statements.length / chunkSize);
      
      await this.retryD1Operation(async () => {
        const startTime = Date.now();
        await this.db.batch(chunk);
        const duration = Date.now() - startTime;
        console.log(`[D1 DEBUG] ${opName} chunk ${chunkNum}/${totalChunks} (${chunk.length} statements) completed in ${duration}ms`);
      }, 3, 100, `${opName} chunk ${chunkNum}/${totalChunks}`);
      
      // Add a small delay between chunks to avoid overwhelming D1
      if (i + chunkSize < statements.length) {
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between chunks
      }
    }
  }

  async saveAnalysisRun(
    runId: string,
    userInput: UserInput,
    status: string = "pending"
  ): Promise<void> {
    const now = new Date().toISOString();
    try {
      await this.db
        .prepare(
          `INSERT INTO analysis_runs (id, website_url, country, region, language, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          runId,
          userInput.websiteUrl,
          userInput.country,
          userInput.region || null,
          userInput.language,
          status,
          now,
          now
        )
        .run();
    } catch (error: any) {
      if (error.message?.includes("no such table: analysis_runs")) {
        throw new Error(
          "Database tables not found. Please run the database setup first: POST /api/setup/database"
        );
      }
      throw error;
    }
  }

  async updateAnalysisStatus(
    runId: string,
    status: string,
    progress?: { step: string; progress: number; message?: string }
  ): Promise<void> {
    const progressJson = progress ? JSON.stringify(progress) : null;
    await this.db
      .prepare(
        `UPDATE analysis_runs SET status = ?, progress = ?, updated_at = ? WHERE id = ?`
      )
      .bind(status, progressJson, new Date().toISOString(), runId)
      .run();
  }

  async getAnalysisStatus(runId: string): Promise<{
    status: string;
    progress: { step: string; progress: number; message?: string } | null;
    error?: string;
    step?: string;
  } | null> {
    const run = await this.db
      .prepare("SELECT status, progress, error_message, step FROM analysis_runs WHERE id = ?")
      .bind(runId)
      .first<{
        status: string;
        progress: string | null;
        error_message: string | null;
        step: string | null;
      }>();

    if (!run) return null;

    return {
      status: run.status || "pending",
      progress: run.progress ? JSON.parse(run.progress) : null,
      error: run.error_message || undefined,
      step: run.step || "sitemap",
    };
  }

  async saveCategories(
    runId: string,
    categories: Category[]
  ): Promise<void> {
    if (categories.length === 0) {
      return; // Skip empty batches
    }

    // Use INSERT OR REPLACE to handle cases where categories already exist
    // This prevents UNIQUE constraint errors when the same category ID is saved multiple times
    // Preserve created_at if category already exists, otherwise use current timestamp
    const statements = categories.map((cat) =>
      this.db
        .prepare(
          `INSERT OR REPLACE INTO categories (id, analysis_run_id, name, description, confidence, source_pages, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 
             COALESCE((SELECT created_at FROM categories WHERE id = ?), ?)
           )`
        )
        .bind(
          cat.id,
          runId,
          cat.name,
          cat.description,
          cat.confidence,
          JSON.stringify(cat.sourcePages),
          cat.id, // For COALESCE subquery to preserve existing created_at
          new Date().toISOString() // Fallback timestamp if category doesn't exist
        )
    );

    await this.retryD1Operation(async () => {
      await this.batchInChunks(statements, 50, `saveCategories (${categories.length} categories)`);
    }, 3, 100, "saveCategories");
  }

  async savePrompts(runId: string, prompts: Prompt[]): Promise<void> {
    if (prompts.length === 0) {
      return; // Skip empty batches
    }

    const statements = prompts.map((prompt) =>
      this.db
        .prepare(
          `INSERT OR REPLACE INTO prompts (id, analysis_run_id, category_id, question, language, country, region, intent, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          prompt.id,
          runId,
          prompt.categoryId,
          prompt.question,
          prompt.language,
          prompt.country || null,
          prompt.region || null,
          prompt.intent,
          prompt.createdAt
        )
    );

    // Use smaller chunks for prompts to avoid timeout
    await this.retryD1Operation(async () => {
      await this.batchInChunks(statements, 30, `savePrompts (${prompts.length} prompts)`);
    }, 3, 150, "savePrompts");
  }

  async saveLLMResponses(responses: LLMResponse[]): Promise<void> {
    if (responses.length === 0) {
      return; // Skip empty batches
    }

    // First, save all responses (without citations) to get response IDs
    const responseStatements = responses.map((response) => {
      const responseId = `resp_${response.promptId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        responseId,
        statement: this.db
          .prepare(
            `INSERT INTO llm_responses (id, prompt_id, output_text, model, timestamp)
             VALUES (?, ?, ?, ?, ?)`
          )
          .bind(
            responseId,
            response.promptId,
            response.outputText,
            response.model,
            response.timestamp
          ),
        citations: response.citations,
      };
    });

    // Save responses first in smaller chunks
    const responseOnlyStatements = responseStatements.map(rs => rs.statement);
    if (responseOnlyStatements.length > 0) {
      console.log(`[D1 DEBUG] Saving ${responseOnlyStatements.length} responses first...`);
      await this.retryD1Operation(async () => {
        await this.batchInChunks(responseOnlyStatements, 20, `saveLLMResponses - responses only`);
      }, 3, 200, "saveLLMResponses - responses");
    }

    // Then save citations separately in smaller chunks
    const citationStatements: D1PreparedStatement[] = [];
    for (const { responseId, citations } of responseStatements) {
      for (const citation of citations) {
        const citationId = `cite_${responseId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        citationStatements.push(
          this.db
            .prepare(
              `INSERT INTO citations (id, llm_response_id, url, title, snippet)
               VALUES (?, ?, ?, ?, ?)`
            )
            .bind(
              citationId,
              responseId,
              citation.url,
              citation.title || null,
              citation.snippet || null
            )
        );
      }
    }

    if (citationStatements.length > 0) {
      console.log(`[D1 DEBUG] Saving ${citationStatements.length} citations in separate batches...`);
      await this.retryD1Operation(async () => {
        // Use even smaller chunks for citations to avoid timeout
        await this.batchInChunks(citationStatements, 15, `saveLLMResponses - citations (${citationStatements.length} total)`);
      }, 3, 200, "saveLLMResponses - citations");
    }

    console.log(`[D1 DEBUG] Completed saving ${responses.length} responses with ${citationStatements.length} citations`);
  }

  async savePromptAnalyses(analyses: PromptAnalysis[]): Promise<void> {
    if (analyses.length === 0) {
      return; // Skip empty batches
    }

    const statements = analyses.map((analysis) => {
      const analysisId = `analysis_${analysis.promptId}_${Date.now()}`;
      return {
        analysis: this.db
          .prepare(
            `INSERT INTO prompt_analyses 
             (id, prompt_id, brand_mentions_exact, brand_mentions_fuzzy, brand_mentions_contexts,
              citation_count, citation_urls, sentiment_tone, sentiment_confidence, sentiment_keywords, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            analysisId,
            analysis.promptId,
            analysis.brandMentions.exact,
            analysis.brandMentions.fuzzy,
            JSON.stringify(analysis.brandMentions.contexts),
            analysis.citationCount,
            JSON.stringify(analysis.citationUrls),
            analysis.sentiment.tone,
            analysis.sentiment.confidence,
            JSON.stringify(analysis.sentiment.keywords),
            analysis.timestamp
          ),
        competitors: analysis.competitors.map((competitor) => {
          const competitorId = `comp_${analysisId}_${Date.now()}_${Math.random()}`;
          return this.db
            .prepare(
              `INSERT INTO competitor_mentions 
               (id, prompt_analysis_id, competitor_name, mention_count, contexts, citation_urls)
               VALUES (?, ?, ?, ?, ?, ?)`
            )
            .bind(
              competitorId,
              analysisId,
              competitor.name,
              competitor.count,
              JSON.stringify(competitor.contexts),
              JSON.stringify(competitor.citations)
            );
        }),
      };
    });

    const allStatements: D1PreparedStatement[] = [];
    for (const { analysis, competitors } of statements) {
      allStatements.push(analysis);
      allStatements.push(...competitors);
    }

    if (allStatements.length > 0) {
      await this.retryD1Operation(async () => {
        // Use smaller chunks for analyses to avoid timeout
      await this.batchInChunks(allStatements, 25, `savePromptAnalyses (${analyses.length} analyses, ${allStatements.length} total statements)`);
      }, 3, 100, "savePromptAnalyses");
    }
  }

  async saveCategoryMetrics(
    runId: string,
    metrics: CategoryMetrics[]
  ): Promise<void> {
    if (metrics.length === 0) {
      return; // Skip empty batches
    }

    const statements = metrics.map((metric) => {
      const metricId = `metric_${metric.categoryId}_${Date.now()}`;
      return this.db
        .prepare(
          `INSERT INTO category_metrics 
           (id, analysis_run_id, category_id, visibility_score, citation_rate, 
            brand_mention_rate, competitor_mention_rate, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          metricId,
          runId,
          metric.categoryId,
          metric.visibilityScore,
          metric.citationRate,
          metric.brandMentionRate,
          metric.competitorMentionRate,
          metric.timestamp
        );
    });

    await this.retryD1Operation(async () => {
      await this.batchInChunks(statements, 50, `saveCategoryMetrics (${metrics.length} metrics)`);
    }, 3, 100, "saveCategoryMetrics");
  }

  async saveCompetitiveAnalysis(
    runId: string,
    analysis: CompetitiveAnalysis
  ): Promise<void> {
    const analysisId = `comp_analysis_${runId}_${Date.now()}`;
    await this.retryD1Operation(async () => {
      await this.db
        .prepare(
          `INSERT INTO competitive_analyses 
           (id, analysis_run_id, brand_share, competitor_shares, white_space_topics, 
            dominated_prompts, missing_brand_prompts, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          analysisId,
          runId,
          analysis.brandShare,
          JSON.stringify(analysis.competitorShares),
          JSON.stringify(analysis.whiteSpaceTopics),
          JSON.stringify(analysis.dominatedPrompts),
          JSON.stringify(analysis.missingBrandPrompts),
          analysis.timestamp
        )
        .run();
    });
  }

  async saveTimeSeriesData(
    runId: string,
    data: TimeSeriesData
  ): Promise<void> {
    const dataId = `ts_${runId}_${Date.now()}`;
    await this.retryD1Operation(async () => {
      await this.db
        .prepare(
          `INSERT INTO time_series 
           (id, analysis_run_id, timestamp, visibility_score, citation_count, 
            brand_mention_count, competitor_mention_count)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          dataId,
          runId,
          data.timestamp,
          data.visibilityScore,
          data.citationCount,
          data.brandMentionCount,
          data.competitorMentionCount
        )
        .run();
    });
  }

  async saveSummary(
    runId: string,
    summary: AnalysisSummary
  ): Promise<void> {
    const summaryId = `summary_${runId}_${Date.now()}`;
    const now = new Date().toISOString();
    await this.retryD1Operation(async () => {
      await this.db
        .prepare(
          `INSERT INTO analysis_summaries 
           (id, analysis_run_id, total_mentions, total_citations, best_prompts, other_sources, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          summaryId,
          runId,
          summary.totalMentions,
          summary.totalCitations,
          JSON.stringify(summary.bestPrompts),
          JSON.stringify(summary.otherSources),
          now
        )
        .run();
    });
  }

  async getSummary(runId: string): Promise<AnalysisSummary | null> {
    const result = await this.db
      .prepare(
        `SELECT * FROM analysis_summaries 
         WHERE analysis_run_id = ? 
         ORDER BY created_at DESC 
         LIMIT 1`
      )
      .bind(runId)
      .first<{
        total_mentions: number;
        total_citations: number;
        best_prompts: string;
        other_sources: string;
        created_at: string;
      }>();

    if (!result) return null;

    return {
      totalMentions: result.total_mentions,
      totalCitations: result.total_citations,
      bestPrompts: JSON.parse(result.best_prompts || '[]'),
      otherSources: JSON.parse(result.other_sources || '{}'),
    };
  }

  async getPromptsForAnalysis(runId: string): Promise<Array<{
    id: string;
    question: string;
    answer: string | null;
    categoryId: string;
    categoryName: string | null;
    createdAt: string;
    citations?: number;
    mentions?: number;
    otherLinks?: number;
    citationUrls?: string[];
    otherLinkUrls?: string[];
  }>> {
    const { extractConclusion, extractTextStats } = await import("../utils/text-extraction.js");
    
    // Hole die website_url, um den Brand-Namen zu extrahieren
    const runInfo = await this.db
      .prepare("SELECT website_url FROM analysis_runs WHERE id = ?")
      .bind(runId)
      .first<{ website_url: string }>();
    
    // Extrahiere Brand-Namen aus URL
    let brandName = "the brand";
    if (runInfo?.website_url) {
      try {
        const domain = new URL(runInfo.website_url).hostname;
        const parts = domain.split(".");
        brandName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      } catch {
        // Fallback: verwende "the brand"
      }
    }
    
    const result = await this.db
      .prepare(
        `SELECT 
          p.id,
          p.question,
          p.category_id,
          c.name as category_name,
          p.created_at,
          (SELECT lr.output_text 
           FROM llm_responses lr 
           WHERE lr.prompt_id = p.id 
           ORDER BY lr.timestamp DESC 
           LIMIT 1) as answer
         FROM prompts p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.analysis_run_id = ?
         ORDER BY p.created_at ASC`
      )
      .bind(runId)
      .all<{
        id: string;
        question: string;
        answer: string | null;
        category_id: string;
        category_name: string | null;
        created_at: string;
      }>();

    return (result.results || []).map(r => {
      // Extrahiere das Fazit
      const conclusion = extractConclusion(r.answer);
      
      // Berechne Statistiken aus dem ORIGINALEN Text (vor Fazit-Extraktion)
      const stats = r.answer ? extractTextStats(r.answer, brandName) : null;
      
      return {
        id: r.id,
        question: r.question,
        answer: conclusion, // Das extrahierte Fazit
        categoryId: r.category_id,
        categoryName: r.category_name,
        createdAt: r.created_at,
        // Statistiken aus dem originalen Text
        citations: stats?.citations ?? 0,
        mentions: stats?.mentions ?? 0,
        otherLinks: stats?.otherLinks ?? 0,
        citationUrls: stats?.citationUrls ?? [],
        otherLinkUrls: stats?.otherLinkUrls ?? [],
      };
    });
  }

  async getAnalysisRun(runId: string): Promise<AnalysisResult | null> {
    return this.retryD1Operation(async () => {
      const run = await this.db
        .prepare("SELECT * FROM analysis_runs WHERE id = ?")
        .bind(runId)
        .first<{
          id: string;
          website_url: string;
          country: string;
          region: string | null;
          language: string;
          created_at: string;
          updated_at: string;
        }>();

      if (!run) return null;

      // Fetch categories
      const categoriesResult = await this.db
        .prepare("SELECT * FROM categories WHERE analysis_run_id = ?")
        .bind(runId)
        .all<{
          id: string;
          name: string;
          description: string;
          confidence: number;
          source_pages: string;
        }>();
      
      const categories: Category[] = (categoriesResult.results || []).map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        confidence: c.confidence,
        sourcePages: JSON.parse(c.source_pages || '[]'),
      }));

      // Fetch prompts
      const promptsResult = await this.db
        .prepare("SELECT * FROM prompts WHERE analysis_run_id = ?")
        .bind(runId)
        .all<{
          id: string;
          category_id: string;
          question: string;
          language: string;
          country: string | null;
          region: string | null;
          intent: string;
          created_at: string;
        }>();
      
      const prompts: Prompt[] = (promptsResult.results || []).map(p => ({
        id: p.id,
        categoryId: p.category_id,
        question: p.question,
        language: p.language,
        country: p.country || undefined,
        region: p.region || undefined,
        intent: p.intent,
        createdAt: p.created_at,
      }));

      // Fetch prompt analyses
      // Optimized: Use JOIN instead of nested subquery to avoid timeout
      const analysesResult = await this.db
        .prepare(`
          SELECT pa.*, 
                 GROUP_CONCAT(cm.competitor_name || '|' || cm.mention_count, '|||') as competitors_data
          FROM prompt_analyses pa
          INNER JOIN prompts p ON pa.prompt_id = p.id
          LEFT JOIN competitor_mentions cm ON cm.prompt_analysis_id = pa.id
          WHERE p.analysis_run_id = ?
          GROUP BY pa.id
        `)
        .bind(runId)
        .all<{
          id: string;
          prompt_id: string;
          brand_mentions_exact: number;
          brand_mentions_fuzzy: number;
          brand_mentions_contexts: string;
          citation_count: number;
          citation_urls: string;
          sentiment_tone: string;
          sentiment_confidence: number;
          sentiment_keywords: string;
          timestamp: string;
          competitors_data: string | null;
        }>();
      
      const analyses: PromptAnalysis[] = (analysesResult.results || []).map(a => {
        const competitors: any[] = a.competitors_data
          ? a.competitors_data.split('|||').map(c => {
              const [name, count] = c.split('|');
              return { name, count: parseInt(count || '0', 10), contexts: [], citations: [] };
            })
          : [];
        
        return {
          promptId: a.prompt_id,
          brandMentions: {
            exact: a.brand_mentions_exact,
            fuzzy: a.brand_mentions_fuzzy,
            contexts: JSON.parse(a.brand_mentions_contexts || '[]'),
          },
          citationCount: a.citation_count,
          citationUrls: JSON.parse(a.citation_urls || '[]'),
          brandCitations: [],
          competitors,
          sentiment: {
            tone: a.sentiment_tone,
            confidence: a.sentiment_confidence,
            keywords: JSON.parse(a.sentiment_keywords || '[]'),
          },
          timestamp: a.timestamp,
          isMentioned: (a.brand_mentions_exact + a.brand_mentions_fuzzy) > 0,
          mentionCount: a.brand_mentions_exact + a.brand_mentions_fuzzy,
          isCited: a.citation_count > 0,
          citationDetails: JSON.parse(a.citation_urls || '[]').map((url: string) => ({ url })),
          competitorDetails: competitors.map(c => ({ name: c.name, count: c.count, locations: [] })),
        };
      });

      // Fetch category metrics
      const metricsResult = await this.db
        .prepare("SELECT * FROM category_metrics WHERE analysis_run_id = ?")
        .bind(runId)
        .all<{
          id: string;
          category_id: string;
          visibility_score: number;
          citation_rate: number;
          brand_mention_rate: number;
          competitor_mention_rate: number;
          timestamp: string;
        }>();
      
      const categoryMetrics: CategoryMetrics[] = (metricsResult.results || []).map(m => ({
        categoryId: m.category_id,
        visibilityScore: m.visibility_score,
        citationRate: m.citation_rate,
        brandMentionRate: m.brand_mention_rate,
        competitorMentionRate: m.competitor_mention_rate,
        timestamp: m.timestamp,
      }));

      // Fetch competitive analysis
      const competitiveResult = await this.db
        .prepare("SELECT * FROM competitive_analyses WHERE analysis_run_id = ? ORDER BY timestamp DESC LIMIT 1")
        .bind(runId)
        .first<{
          brand_share: number;
          competitor_shares: string;
          white_space_topics: string;
          dominated_prompts: string;
          missing_brand_prompts: string;
          timestamp: string;
        }>();
      
      const competitiveAnalysis: CompetitiveAnalysis = competitiveResult ? {
        brandShare: competitiveResult.brand_share,
        competitorShares: JSON.parse(competitiveResult.competitor_shares || '{}'),
        whiteSpaceTopics: JSON.parse(competitiveResult.white_space_topics || '[]'),
        dominatedPrompts: JSON.parse(competitiveResult.dominated_prompts || '[]'),
        missingBrandPrompts: JSON.parse(competitiveResult.missing_brand_prompts || '[]'),
        timestamp: competitiveResult.timestamp,
      } : {
        brandShare: 0,
        competitorShares: {},
        whiteSpaceTopics: [],
        dominatedPrompts: [],
        missingBrandPrompts: [],
        timestamp: run.updated_at,
      };

      // Fetch time series
      const timeSeriesResult = await this.db
        .prepare("SELECT * FROM time_series WHERE analysis_run_id = ? ORDER BY timestamp ASC")
        .bind(runId)
        .all<{
          timestamp: string;
          visibility_score: number;
          citation_count: number;
          brand_mention_count: number;
          competitor_mention_count: number;
        }>();
      
      const timeSeries: TimeSeriesData[] = (timeSeriesResult.results || []).map(ts => ({
        timestamp: ts.timestamp,
        visibilityScore: ts.visibility_score,
        citationCount: ts.citation_count,
        brandMentionCount: ts.brand_mention_count,
        competitorMentionCount: ts.competitor_mention_count,
      }));

      return {
        websiteUrl: run.website_url,
        country: run.country,
        language: run.language,
        categories,
        prompts,
        analyses,
        categoryMetrics,
        competitiveAnalysis,
        timeSeries,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
      };
    });
  }

  async getLatestAnalysisRun(
    websiteUrl: string
  ): Promise<string | null> {
    const run = await this.db
      .prepare(
        "SELECT id FROM analysis_runs WHERE website_url = ? ORDER BY created_at DESC LIMIT 1"
      )
      .bind(websiteUrl)
      .first<{ id: string }>();

    return run?.id || null;
  }

  async deleteAnalysis(runId: string): Promise<void> {
    // Delete in order: child records first, then parent
    // Use retry logic and optimize queries to avoid timeouts
    await this.retryD1Operation(async () => {
      // Get all prompt IDs for this run
      const prompts = await this.db
        .prepare("SELECT id FROM prompts WHERE analysis_run_id = ?")
        .bind(runId)
        .all<{ id: string }>();

      const promptIds = (prompts.results || []).map(p => p.id);

      if (promptIds.length > 0) {
        // Delete in chunks if there are many prompts
        const chunkSize = 50;
        for (let i = 0; i < promptIds.length; i += chunkSize) {
          const chunk = promptIds.slice(i, i + chunkSize);
          
          // Get all LLM response IDs for these prompts using JOIN (more efficient)
          const responses = await this.db
            .prepare(`
              SELECT lr.id 
              FROM llm_responses lr
              INNER JOIN prompts p ON lr.prompt_id = p.id
              WHERE p.analysis_run_id = ? AND lr.prompt_id IN (${chunk.map(() => '?').join(',')})
            `)
            .bind(runId, ...chunk)
            .all<{ id: string }>();

          const responseIds = (responses.results || []).map(r => r.id);

          if (responseIds.length > 0) {
            // Delete citations in chunks
            for (let j = 0; j < responseIds.length; j += chunkSize) {
              const responseChunk = responseIds.slice(j, j + chunkSize);
              await this.db
                .prepare(`DELETE FROM citations WHERE llm_response_id IN (${responseChunk.map(() => '?').join(',')})`)
                .bind(...responseChunk)
                .run();
            }

            // Delete LLM responses in chunks
            for (let j = 0; j < responseIds.length; j += chunkSize) {
              const responseChunk = responseIds.slice(j, j + chunkSize);
              await this.db
                .prepare(`DELETE FROM llm_responses WHERE id IN (${responseChunk.map(() => '?').join(',')})`)
                .bind(...responseChunk)
                .run();
            }
          }

          // Get all prompt analysis IDs using JOIN
          const analyses = await this.db
            .prepare(`
              SELECT pa.id 
              FROM prompt_analyses pa
              INNER JOIN prompts p ON pa.prompt_id = p.id
              WHERE p.analysis_run_id = ? AND pa.prompt_id IN (${chunk.map(() => '?').join(',')})
            `)
            .bind(runId, ...chunk)
            .all<{ id: string }>();

          const analysisIds = (analyses.results || []).map(a => a.id);

          if (analysisIds.length > 0) {
            // Delete competitor mentions in chunks
            for (let j = 0; j < analysisIds.length; j += chunkSize) {
              const analysisChunk = analysisIds.slice(j, j + chunkSize);
              await this.db
                .prepare(`DELETE FROM competitor_mentions WHERE prompt_analysis_id IN (${analysisChunk.map(() => '?').join(',')})`)
                .bind(...analysisChunk)
                .run();
            }

            // Delete prompt analyses in chunks
            for (let j = 0; j < analysisIds.length; j += chunkSize) {
              const analysisChunk = analysisIds.slice(j, j + chunkSize);
              await this.db
                .prepare(`DELETE FROM prompt_analyses WHERE id IN (${analysisChunk.map(() => '?').join(',')})`)
                .bind(...analysisChunk)
                .run();
            }
          }

          // Delete prompts in chunks
          await this.db
            .prepare(`DELETE FROM prompts WHERE id IN (${chunk.map(() => '?').join(',')})`)
            .bind(...chunk)
            .run();
        }
      }

      // Delete category metrics
      await this.db
        .prepare("DELETE FROM category_metrics WHERE analysis_run_id = ?")
        .bind(runId)
        .run();

      // Delete competitive analyses
      await this.db
        .prepare("DELETE FROM competitive_analyses WHERE analysis_run_id = ?")
        .bind(runId)
        .run();

      // Delete time series
      await this.db
        .prepare("DELETE FROM time_series WHERE analysis_run_id = ?")
        .bind(runId)
        .run();

      // Delete categories
      await this.db
        .prepare("DELETE FROM categories WHERE analysis_run_id = ?")
        .bind(runId)
        .run();

      // Finally, delete the analysis run
      await this.db
        .prepare("DELETE FROM analysis_runs WHERE id = ?")
        .bind(runId)
        .run();
    });
  }

  // Company Management
  async createCompany(company: Omit<Company, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const id = `company_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO companies (id, name, website_url, country, language, region, description, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        company.name,
        company.websiteUrl,
        company.country,
        company.language,
        company.region || null,
        company.description || null,
        company.isActive ? 1 : 0,
        now,
        now
      )
      .run();
    return id;
  }

  async getCompany(companyId: string): Promise<Company | null> {
    const company = await this.db
      .prepare("SELECT * FROM companies WHERE id = ?")
      .bind(companyId)
      .first<{
        id: string;
        name: string;
        website_url: string;
        country: string;
        language: string;
        region: string | null;
        description: string | null;
        is_active: number;
        created_at: string;
        updated_at: string;
      }>();
    
    if (!company) return null;
    
    return {
      id: company.id,
      name: company.name,
      websiteUrl: company.website_url,
      country: company.country,
      language: company.language,
      region: company.region || undefined,
      description: company.description || undefined,
      isActive: company.is_active === 1,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
    };
  }

  async getAllCompanies(): Promise<Company[]> {
    // Get companies from analysis_runs grouped by website_url
    // This shows all firms that have been analyzed
    const companies = await this.db
      .prepare(
        `SELECT 
          website_url,
          MAX(country) as country,
          MAX(language) as language,
          MAX(region) as region,
          COUNT(*) as analysis_count,
          MAX(created_at) as last_analysis_date
         FROM analysis_runs
         GROUP BY website_url
         ORDER BY last_analysis_date DESC`
      )
      .all<{
        website_url: string;
        country: string;
        language: string;
        region: string | null;
        analysis_count: number;
        last_analysis_date: string;
      }>();
    
    return (companies.results || []).map((c) => {
      // Extract domain name as company name
      let companyName = c.website_url;
      try {
        const url = new URL(c.website_url.startsWith('http') ? c.website_url : `https://${c.website_url}`);
        companyName = url.hostname.replace('www.', '');
      } catch (e) {
        // Keep original if URL parsing fails
      }
      
      // Use URL-encoded website_url as ID for easy retrieval
      return {
        id: encodeURIComponent(c.website_url),
        name: companyName,
        websiteUrl: c.website_url,
        country: c.country,
        language: c.language,
        region: c.region || undefined,
        description: undefined,
        isActive: true,
        createdAt: c.last_analysis_date,
        updatedAt: c.last_analysis_date,
      };
    });
  }

  async updateCompany(companyId: string, updates: Partial<Company>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.websiteUrl !== undefined) {
      fields.push("website_url = ?");
      values.push(updates.websiteUrl);
    }
    if (updates.country !== undefined) {
      fields.push("country = ?");
      values.push(updates.country);
    }
    if (updates.language !== undefined) {
      fields.push("language = ?");
      values.push(updates.language);
    }
    if (updates.region !== undefined) {
      fields.push("region = ?");
      values.push(updates.region || null);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description || null);
    }
    if (updates.isActive !== undefined) {
      fields.push("is_active = ?");
      values.push(updates.isActive ? 1 : 0);
    }
    
    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(companyId);
    
    await this.db
      .prepare(`UPDATE companies SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  // Company Prompts (saved questions for re-use)
  async saveCompanyPrompt(prompt: Omit<CompanyPrompt, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const id = `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO company_prompts (id, company_id, question, category_id, category_name, language, country, region, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        prompt.companyId,
        prompt.question,
        prompt.categoryId || null,
        prompt.categoryName || null,
        prompt.language,
        prompt.country || null,
        prompt.region || null,
        prompt.isActive ? 1 : 0,
        now,
        now
      )
      .run();
    return id;
  }

  async getCompanyPrompts(companyId: string, activeOnly: boolean = true): Promise<CompanyPrompt[]> {
    const query = activeOnly
      ? "SELECT * FROM company_prompts WHERE company_id = ? AND is_active = 1 ORDER BY created_at DESC"
      : "SELECT * FROM company_prompts WHERE company_id = ? ORDER BY created_at DESC";
    
    const prompts = await this.db
      .prepare(query)
      .bind(companyId)
      .all<{
        id: string;
        company_id: string;
        question: string;
        category_id: string | null;
        category_name: string | null;
        language: string;
        country: string | null;
        region: string | null;
        is_active: number;
        created_at: string;
        updated_at: string;
      }>();
    
    return (prompts.results || []).map(p => ({
      id: p.id,
      companyId: p.company_id,
      question: p.question,
      categoryId: p.category_id || undefined,
      categoryName: p.category_name || undefined,
      language: p.language,
      country: p.country || undefined,
      region: p.region || undefined,
      isActive: p.is_active === 1,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  }

  async getCompanyAnalysisRuns(companyId: string, limit: number = 50): Promise<any[]> {
    // companyId is URL-encoded website_url
    const websiteUrl = decodeURIComponent(companyId);
    
    const runs = await this.db
      .prepare(
        `SELECT id, website_url, country, language, region, status, created_at, updated_at 
         FROM analysis_runs 
         WHERE website_url = ? 
         ORDER BY created_at DESC 
         LIMIT ?`
      )
      .bind(websiteUrl, limit)
      .all<{
        id: string;
        website_url: string;
        country: string;
        language: string;
        region: string | null;
        status: string;
        created_at: string;
        updated_at: string;
      }>();
    
    return (runs.results || []).map(r => ({
      id: r.id,
      websiteUrl: r.website_url,
      country: r.country,
      language: r.language,
      region: r.region || undefined,
      status: r.status || 'pending',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getAllAnalysisRuns(limit: number = 100): Promise<any[]> {
    try {
    const runs = await this.db
      .prepare(
        `SELECT id, website_url, country, language, region, status, created_at, updated_at, company_id
         FROM analysis_runs 
         ORDER BY created_at DESC 
         LIMIT ?`
      )
      .bind(limit)
      .all<{
        id: string;
        website_url: string;
        country: string;
        language: string;
        region: string | null;
        status: string;
        created_at: string;
        updated_at: string;
        company_id: string | null;
      }>();
    
      // Ensure we always return an array
      if (!runs || !runs.results) {
        return [];
      }
      
      return runs.results.map(r => ({
      id: r.id,
      websiteUrl: r.website_url,
      country: r.country,
      language: r.language,
      region: r.region || undefined,
        status: r.status || "pending",
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      companyId: r.company_id || undefined,
    }));
    } catch (error) {
      console.error("Error in getAllAnalysisRuns:", error);
      return []; // Always return an array, even on error
    }
  }

  // Global view methods
  async getAllGlobalCategories(): Promise<Array<{ name: string; description: string; count: number }>> {
    // Only show categories that have prompts with web search (citations)
    // Optimized query using JOINs instead of EXISTS for better performance
    // This avoids D1 timeout issues with complex EXISTS subqueries
    // Uses retry logic to handle transient D1 startup errors
    
    return this.retryD1Operation(async () => {
      try {
        const result = await this.db
          .prepare(
            `SELECT 
              c.name,
              MAX(c.description) as description,
              COUNT(DISTINCT p.id) as count
             FROM categories c
             INNER JOIN prompts p ON p.category_id = c.id
             INNER JOIN llm_responses lr ON lr.prompt_id = p.id
             INNER JOIN citations cit ON cit.llm_response_id = lr.id
             GROUP BY c.name
             HAVING count > 0
             ORDER BY count DESC, c.name ASC
             LIMIT 100`
          )
          .all<{
            name: string;
            description: string;
            count: number;
          }>();
        
        return (result.results || []).map(r => ({
          name: r.name,
          description: r.description || "",
          count: r.count,
        }));
      } catch (error) {
        console.error("Error in getAllGlobalCategories, trying fallback query:", error);
        // Fallback: simpler query without citations check if the main query times out
        const fallbackResult = await this.db
          .prepare(
            `SELECT 
              c.name,
              MAX(c.description) as description,
              COUNT(DISTINCT p.id) as count
             FROM categories c
             INNER JOIN prompts p ON p.category_id = c.id
             GROUP BY c.name
             HAVING count > 0
             ORDER BY count DESC, c.name ASC
             LIMIT 100`
          )
          .all<{
            name: string;
            description: string;
            count: number;
          }>();
        
        return (fallbackResult.results || []).map(r => ({
          name: r.name,
          description: r.description || "",
          count: r.count,
        }));
      }
    }).catch((error) => {
      console.error("All retry attempts failed for getAllGlobalCategories:", error);
      // Return empty array if all attempts fail
      return [];
    });
  }

  async getGlobalPromptsByCategory(categoryName: string): Promise<Array<{
    id: string;
    question: string;
    answer: string | null;
    language: string;
    country: string | null;
    region: string | null;
    intent: string;
    createdAt: string;
    analysisRunId: string;
    websiteUrl: string;
  }>> {
    // Optimized query: Use JOINs instead of EXISTS and correlated subqueries
    // This avoids D1 timeout issues with complex nested queries
    return this.retryD1Operation(async () => {
      try {
        // First, get prompts with citations using JOIN (more efficient than EXISTS)
        const result = await this.db
          .prepare(
            `SELECT DISTINCT
              p.id,
              p.question,
              p.language,
              p.country,
              p.region,
              p.intent,
              p.created_at,
              p.analysis_run_id,
              ar.website_url
             FROM prompts p
             INNER JOIN categories c ON p.category_id = c.id
             INNER JOIN analysis_runs ar ON p.analysis_run_id = ar.id
             INNER JOIN llm_responses lr ON lr.prompt_id = p.id
             INNER JOIN citations cit ON cit.llm_response_id = lr.id
             WHERE c.name = ?
             ORDER BY p.created_at DESC
             LIMIT 500`
          )
          .bind(categoryName)
          .all<{
            id: string;
            question: string;
            language: string;
            country: string | null;
            region: string | null;
            intent: string;
            created_at: string;
            analysis_run_id: string;
            website_url: string;
          }>();

        // Then fetch answers separately for better performance
        const prompts = result.results || [];
        const promptIds = prompts.map(p => p.id);
        
        if (promptIds.length === 0) {
          return [];
        }

        // Get latest answer for each prompt in a single query
        const answersResult = await this.db
          .prepare(
            `SELECT 
              prompt_id,
              output_text,
              ROW_NUMBER() OVER (PARTITION BY prompt_id ORDER BY timestamp DESC) as rn
             FROM llm_responses
             WHERE prompt_id IN (${promptIds.map(() => '?').join(',')})`
          )
          .bind(...promptIds)
          .all<{
            prompt_id: string;
            output_text: string;
            rn: number;
          }>();

        // Create a map of prompt_id -> latest answer
        const answerMap = new Map<string, string>();
        (answersResult.results || []).forEach(a => {
          if (a.rn === 1) {
            answerMap.set(a.prompt_id, a.output_text);
          }
        });

        return prompts.map(r => ({
          id: r.id,
          question: r.question,
          answer: answerMap.get(r.id) || null,
          language: r.language,
          country: r.country || undefined,
          region: r.region || undefined,
          intent: r.intent,
          createdAt: r.created_at,
          analysisRunId: r.analysis_run_id,
          websiteUrl: r.website_url,
        }));
      } catch (error) {
        console.error("Error in getGlobalPromptsByCategory, trying simpler query:", error);
        // Fallback: simpler query without citations check
        const fallbackResult = await this.db
          .prepare(
            `SELECT 
              p.id,
              p.question,
              p.language,
              p.country,
              p.region,
              p.intent,
              p.created_at,
              p.analysis_run_id,
              ar.website_url
             FROM prompts p
             INNER JOIN categories c ON p.category_id = c.id
             INNER JOIN analysis_runs ar ON p.analysis_run_id = ar.id
             WHERE c.name = ?
             ORDER BY p.created_at DESC
             LIMIT 500`
          )
          .bind(categoryName)
          .all<{
            id: string;
            question: string;
            language: string;
            country: string | null;
            region: string | null;
            intent: string;
            created_at: string;
            analysis_run_id: string;
            website_url: string;
          }>();

        return (fallbackResult.results || []).map(r => ({
          id: r.id,
          question: r.question,
          answer: null,
          language: r.language,
          country: r.country || undefined,
          region: r.region || undefined,
          intent: r.intent,
          createdAt: r.created_at,
          analysisRunId: r.analysis_run_id,
          websiteUrl: r.website_url,
        }));
      }
    });
  }

  async getCompanyTimeSeries(companyId: string, days: number = 30): Promise<TimeSeriesData[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const timeSeries = await this.db
      .prepare(
        `SELECT ts.timestamp, ts.visibility_score, ts.citation_count, 
                ts.brand_mention_count, ts.competitor_mention_count
         FROM time_series ts
         JOIN analysis_runs ar ON ts.analysis_run_id = ar.id
         WHERE ar.company_id = ? AND ts.timestamp >= ?
         ORDER BY ts.timestamp ASC`
      )
      .bind(companyId, cutoffDate.toISOString())
      .all<{
        timestamp: string;
        visibility_score: number;
        citation_count: number;
        brand_mention_count: number;
        competitor_mention_count: number;
      }>();
    
    return (timeSeries.results || []).map(ts => ({
      timestamp: ts.timestamp,
      visibilityScore: ts.visibility_score,
      citationCount: ts.citation_count,
      brandMentionCount: ts.brand_mention_count,
      competitorMentionCount: ts.competitor_mention_count,
    }));
  }

  // Scheduled Runs
  async createScheduledRun(schedule: Omit<ScheduledRun, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const id = `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO scheduled_runs (id, company_id, schedule_type, next_run_at, last_run_at, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        schedule.companyId,
        schedule.scheduleType,
        schedule.nextRunAt,
        schedule.lastRunAt || null,
        schedule.isActive ? 1 : 0,
        now,
        now
      )
      .run();
    return id;
  }

  async getScheduledRuns(companyId?: string, activeOnly: boolean = true): Promise<ScheduledRun[]> {
    let query = "SELECT * FROM scheduled_runs";
    const conditions: string[] = [];
    const values: any[] = [];
    
    if (companyId) {
      conditions.push("company_id = ?");
      values.push(companyId);
    }
    if (activeOnly) {
      conditions.push("is_active = 1");
    }
    
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    
    query += " ORDER BY next_run_at ASC";
    
    const schedules = await this.db
      .prepare(query)
      .bind(...values)
      .all<{
        id: string;
        company_id: string;
        schedule_type: string;
        next_run_at: string;
        last_run_at: string | null;
        is_active: number;
        created_at: string;
        updated_at: string;
      }>();
    
    return (schedules.results || []).map(s => ({
      id: s.id,
      companyId: s.company_id,
      scheduleType: s.schedule_type as "daily" | "weekly" | "monthly",
      nextRunAt: s.next_run_at,
      lastRunAt: s.last_run_at || undefined,
      isActive: s.is_active === 1,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));
  }

  async updateScheduledRun(scheduleId: string, updates: Partial<ScheduledRun>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.scheduleType !== undefined) {
      fields.push("schedule_type = ?");
      values.push(updates.scheduleType);
    }
    if (updates.nextRunAt !== undefined) {
      fields.push("next_run_at = ?");
      values.push(updates.nextRunAt);
    }
    if (updates.lastRunAt !== undefined) {
      fields.push("last_run_at = ?");
      values.push(updates.lastRunAt || null);
    }
    if (updates.isActive !== undefined) {
      fields.push("is_active = ?");
      values.push(updates.isActive ? 1 : 0);
    }
    
    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(scheduleId);
    
    await this.db
      .prepare(`UPDATE scheduled_runs SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  async getScheduledRunsDue(): Promise<ScheduledRun[]> {
    const now = new Date().toISOString();
    const schedules = await this.db
      .prepare(
        `SELECT * FROM scheduled_runs 
         WHERE is_active = 1 AND next_run_at <= ? 
         ORDER BY next_run_at ASC`
      )
      .bind(now)
      .all<{
        id: string;
        company_id: string;
        schedule_type: string;
        next_run_at: string;
        last_run_at: string | null;
        is_active: number;
        created_at: string;
        updated_at: string;
      }>();
    
    return (schedules.results || []).map(s => ({
      id: s.id,
      companyId: s.company_id,
      scheduleType: s.schedule_type as "daily" | "weekly" | "monthly",
      nextRunAt: s.next_run_at,
      lastRunAt: s.last_run_at || undefined,
      isActive: s.is_active === 1,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));
  }
}

