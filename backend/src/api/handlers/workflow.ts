/**
 * Workflow API Handlers
 */

import type { UserInput, Prompt } from "../../../shared/types.js";
import type { Env, CorsHeaders } from "../types.js";
import { WorkflowEngine } from "../../../shared/engine_workflow.js";
import { LLMExecutor } from "../../../shared/llm_execution/index.js";
import { getConfig } from "../../../shared/config.js";
import { Database } from "../../../shared/persistence/index.js";
import { AnalysisEngine } from "../../../shared/analysis/index.js";
import { extractBrandName } from "../utils.js";
import { fetchSitemap, parseSitemap, extractLinksFromHtml, extractTextContent, shouldFetchUrl, deduplicateUrls } from "../utils/sitemap.js";

export class WorkflowHandlers {
  constructor(private workflowEngine: WorkflowEngine) {}

  async handleStep1(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const body = await request.json() as {
        websiteUrl?: string;
        country?: string;
        region?: string;
        language?: string;
      };
      let websiteUrl = body.websiteUrl?.trim();
      // Auto-add https:// if missing
      if (websiteUrl) {
        const urlPattern = new RegExp('^https?:\\/\\/', 'i');
        if (!urlPattern.test(websiteUrl)) {
          websiteUrl = 'https://' + websiteUrl;
        }
      }
      const userInput: UserInput = {
        websiteUrl: websiteUrl || '',
        country: body.country || '',
        region: body.region,
        language: body.language || '',
      };

      const result = await this.workflowEngine.step1FindSitemap(userInput, env);

      return new Response(JSON.stringify({
        runId: result.runId,
        urls: result.urls,
        foundSitemap: result.foundSitemap,
        message: result.foundSitemap 
          ? `Sitemap found: ${result.urls.length} URLs`
          : `No sitemap found. ${result.urls.length} URLs extracted from homepage`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in handleStep1:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to start analysis",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  async handleStep2(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json() as {
      runId: string;
      urls: string[];
      language?: string;
    };
    const { runId, urls } = body;

    const result = await this.workflowEngine.step2FetchContent(
      runId,
      urls,
      body.language || 'de',
      env
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async handleStep3(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json() as {
      runId: string;
      content: string;
      language?: string;
    };
    const { runId, content, language } = body;

    const categories = await this.workflowEngine.step3GenerateCategories(
      runId,
      content,
      language || 'de',
      env
    );

    return new Response(JSON.stringify({ categories }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async handleSaveCategories(
    runId: string,
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json() as {
      selectedCategoryIds?: string[];
      customCategories?: any[];
    };
    const { selectedCategoryIds, customCategories } = body;

    await this.workflowEngine.saveSelectedCategories(
      runId,
      selectedCategoryIds || [],
      customCategories || [],
      env
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async handleStep4(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const body = await request.json() as {
        runId: string;
        categories: any[];
        userInput?: UserInput;
        questionsPerCategory?: number;
        companyId?: string;
        content?: string;
      };
      const { runId, categories, userInput, questionsPerCategory, companyId } = body;

      if (!runId) {
        return new Response(
          JSON.stringify({ error: "runId is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!categories || categories.length === 0) {
        return new Response(
          JSON.stringify({ error: "categories are required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const prompts = await this.workflowEngine.step4GeneratePrompts(
        runId,
        categories,
        userInput || { websiteUrl: '', country: '', language: 'de' },
        body.content || "",
        env,
        questionsPerCategory || 3,
        companyId
      );

      return new Response(JSON.stringify({ prompts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Error in handleStep4:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to generate prompts",
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  async handleSavePrompts(
    runId: string,
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json() as {
      prompts?: any[];
    };
    const { prompts } = body;

    await this.workflowEngine.saveUserPrompts(runId, prompts || [], env);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async handleStep5(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json() as {
      runId: string;
      prompts?: any[];
    };
    const { runId, prompts: promptsFromBody } = body;

    try {
      const result = await this.workflowEngine.step5ExecutePrompts(
        runId,
        promptsFromBody || [],
        env
      );

      // Step 2: Perform full analysis after all prompts are executed
      const config = getConfig(env);
      const db = new Database(env.geo_db as any);

      // Get run info to extract brand name
      const runInfo = await db.db
        .prepare("SELECT website_url FROM analysis_runs WHERE id = ?")
        .bind(runId)
        .first<{ website_url: string }>();

      if (!runInfo) {
        throw new Error("Analysis run not found");
      }

      const brandName = extractBrandName(runInfo.website_url);
      const analysisEngine = new AnalysisEngine(brandName, config.analysis.brandFuzzyThreshold);

      // Load all prompts for this run
      console.log(`[D1 DEBUG] Loading prompts for runId: ${runId}`);
      const startPrompts = Date.now();
      const savedPrompts = await db.db
        .prepare("SELECT * FROM prompts WHERE analysis_run_id = ?")
        .bind(runId)
        .all<any>();
      console.log(`[D1 DEBUG] Loaded ${savedPrompts.results?.length || 0} prompts in ${Date.now() - startPrompts}ms`);

      // Load all responses for this run
      // Optimized: Use JOIN instead of nested subquery to avoid timeout
      // Note: GROUP_CONCAT can be slow with many citations, so we add LIMIT and retry logic
      console.log(`[D1 DEBUG] Loading responses with citations for runId: ${runId}`);
      const startResponses = Date.now();
      let savedResponses;
      try {
        savedResponses = await db.db
          .prepare(`
            SELECT lr.*, 
                   GROUP_CONCAT(c.url || '|' || COALESCE(c.title, '') || '|' || COALESCE(c.snippet, ''), '|||') as citations_data
            FROM llm_responses lr
            INNER JOIN prompts p ON lr.prompt_id = p.id
            LEFT JOIN citations c ON c.llm_response_id = lr.id
            WHERE p.analysis_run_id = ?
            GROUP BY lr.id
          `)
          .bind(runId)
          .all<any>();
        console.log(`[D1 DEBUG] Loaded ${savedResponses.results?.length || 0} responses in ${Date.now() - startResponses}ms`);
      } catch (error: any) {
        console.error(`[D1 ERROR] Failed to load responses with GROUP_CONCAT, trying alternative approach:`, error.message);
        // Fallback: Load responses and citations separately if GROUP_CONCAT times out
        const responsesOnly = await db.db
          .prepare(`
            SELECT lr.*
            FROM llm_responses lr
            INNER JOIN prompts p ON lr.prompt_id = p.id
            WHERE p.analysis_run_id = ?
          `)
          .bind(runId)
          .all<any>();
        
        const responseIds = (responsesOnly.results || []).map((r: any) => r.id);
        const citationsMap = new Map<string, any[]>();
        
        if (responseIds.length > 0) {
          // Load citations in chunks to avoid timeout
          const chunkSize = 50;
          for (let i = 0; i < responseIds.length; i += chunkSize) {
            const chunk = responseIds.slice(i, i + chunkSize);
            const citations = await db.db
              .prepare(`SELECT * FROM citations WHERE llm_response_id IN (${chunk.map(() => '?').join(',')})`)
              .bind(...chunk)
              .all<any>();
            
            (citations.results || []).forEach((cite: any) => {
              if (!citationsMap.has(cite.llm_response_id)) {
                citationsMap.set(cite.llm_response_id, []);
              }
              citationsMap.get(cite.llm_response_id)!.push(cite);
            });
          }
        }
        
        // Combine responses with citations
        savedResponses = {
          results: (responsesOnly.results || []).map((r: any) => ({
            ...r,
            citations_data: (citationsMap.get(r.id) || []).map(c => 
              `${c.url}|${c.title || ''}|${c.snippet || ''}`
            ).join('|||')
          }))
        };
        console.log(`[D1 DEBUG] Loaded ${savedResponses.results?.length || 0} responses (fallback method) in ${Date.now() - startResponses}ms`);
      }

      // Parse citations from concatenated string
      const responsesWithCitations = (savedResponses.results || []).map((r: any) => {
        const citations = r.citations_data
          ? r.citations_data.split('|||').map((c: string) => {
              const [url, title, snippet] = c.split('|');
              return { url, title: title || '', snippet: snippet || '' };
            })
          : [];
        return {
          ...r,
          citations
        };
      });

      // Perform analysis
      const promptsArray = (savedPrompts.results || []) as any[];
      const analyses = analysisEngine.analyzeResponses(
        promptsArray, 
        responsesWithCitations
      );

      // Save analyses
      await db.savePromptAnalyses(analyses);

      // Calculate metrics - using direct database queries since methods don't exist
      // Optimized: Use JOINs instead of nested subqueries to avoid timeout
      console.log(`[D1 DEBUG] Calculating category metrics for runId: ${runId}`);
      const startMetrics = Date.now();
      let categoryMetrics;
      try {
        categoryMetrics = await db.db
          .prepare(`
            SELECT p.category_id, 
                   COUNT(*) as prompt_count,
                   SUM(CASE WHEN pa.brand_mentions_exact + pa.brand_mentions_fuzzy > 0 THEN 1 ELSE 0 END) as mentions_count
            FROM prompt_analyses pa
            INNER JOIN prompts p ON pa.prompt_id = p.id
            WHERE p.analysis_run_id = ?
            GROUP BY p.category_id
          `)
          .bind(runId)
          .all<any>();
        console.log(`[D1 DEBUG] Category metrics calculated in ${Date.now() - startMetrics}ms`);
      } catch (error: any) {
        console.error(`[D1 ERROR] Failed to calculate category metrics:`, error.message);
        categoryMetrics = { results: [] };
      }

      console.log(`[D1 DEBUG] Calculating competitive analysis for runId: ${runId}`);
      const startComp = Date.now();
      let competitiveAnalysis;
      try {
        competitiveAnalysis = await db.db
          .prepare(`
            SELECT cm.competitor_name, COUNT(*) as mention_count
            FROM competitor_mentions cm
            INNER JOIN prompt_analyses pa ON cm.prompt_analysis_id = pa.id
            INNER JOIN prompts p ON pa.prompt_id = p.id
            WHERE p.analysis_run_id = ?
            GROUP BY cm.competitor_name
            ORDER BY mention_count DESC
          `)
          .bind(runId)
          .all<any>();
        console.log(`[D1 DEBUG] Competitive analysis calculated in ${Date.now() - startComp}ms`);
      } catch (error: any) {
        console.error(`[D1 ERROR] Failed to calculate competitive analysis:`, error.message);
        competitiveAnalysis = { results: [] };
      }

      console.log(`[D1 DEBUG] Calculating time series for runId: ${runId}`);
      const startTS = Date.now();
      let timeSeries;
      try {
        timeSeries = await db.db
          .prepare(`
            SELECT DATE(lr.timestamp) as date, COUNT(*) as count
            FROM llm_responses lr
            INNER JOIN prompts p ON lr.prompt_id = p.id
            WHERE p.analysis_run_id = ?
            GROUP BY DATE(lr.timestamp)
            ORDER BY date
          `)
          .bind(runId)
          .all<any>();
        console.log(`[D1 DEBUG] Time series calculated in ${Date.now() - startTS}ms`);
      } catch (error: any) {
        console.error(`[D1 ERROR] Failed to calculate time series:`, error.message);
        timeSeries = { results: [] };
      }

      // Update run status
      await db.updateAnalysisStatus(runId, "completed", {
        step: "completed",
        progress: 100,
        message: "Analysis completed",
      });

      // Automatically generate summary after analysis is complete
      console.log(`[D1 DEBUG] Generating summary for runId: ${runId}`);
      try {
        // Call the summary generation logic inline
        const summaryRunInfo = await db.db
          .prepare("SELECT website_url FROM analysis_runs WHERE id = ?")
          .bind(runId)
          .first<{ website_url: string }>();

        if (summaryRunInfo) {
          const summaryBrandName = extractBrandName(summaryRunInfo.website_url);
          const summaryBrandLower = summaryBrandName.toLowerCase();
          const brandInUrl = summaryBrandLower.replace(/\s+/g, '');

          // Get all prompts with mentions and citations
          const promptsWithCitationsResult = await db.db
            .prepare(`
              SELECT 
                p.id,
                p.question,
                COALESCE(pa.brand_mentions_exact, 0) + COALESCE(pa.brand_mentions_fuzzy, 0) as mentions,
                c.url as citation_url,
                c.title as citation_title,
                c.snippet as citation_snippet
              FROM prompts p
              LEFT JOIN prompt_analyses pa ON pa.prompt_id = p.id
              LEFT JOIN llm_responses lr ON lr.prompt_id = p.id
              LEFT JOIN citations c ON c.llm_response_id = lr.id
              WHERE p.analysis_run_id = ?
            `)
            .bind(runId)
            .all<any>();

          const promptMap = new Map<string, { question: string; mentions: number; citationUrls: Set<string> }>();
          let totalMentions = 0;
          let totalCitations = 0;

          (promptsWithCitationsResult.results || []).forEach((row) => {
            if (!promptMap.has(row.id)) {
              promptMap.set(row.id, {
                question: row.question,
                mentions: row.mentions || 0,
                citationUrls: new Set<string>(),
              });
              totalMentions += row.mentions || 0;
            }

            if (row.citation_url) {
              totalCitations++;
              const citationText = `${row.citation_title || ""} ${row.citation_snippet || ""}`.toLowerCase();
              const urlLower = row.citation_url.toLowerCase();
              const mentionedInText = citationText.includes(summaryBrandLower);
              const mentionedInUrl = urlLower.includes(brandInUrl);
              
              if (mentionedInText || mentionedInUrl) {
                const prompt = promptMap.get(row.id)!;
                prompt.citationUrls.add(row.citation_url);
              }
            }
          });

          const bestPrompts = Array.from(promptMap.entries())
            .map(([id, data]) => ({
              question: data.question,
              mentions: data.mentions,
              citations: data.citationUrls.size,
            }))
            .sort((a, b) => (b.mentions + b.citations) - (a.mentions + a.citations))
            .slice(0, 10);

          // Get other sources
          let ownCompanyDomain = '';
          try {
            const websiteUrlObj = new URL(summaryRunInfo.website_url);
            ownCompanyDomain = websiteUrlObj.hostname.replace('www.', '').toLowerCase();
          } catch {
            ownCompanyDomain = brandInUrl;
          }

          const isOwnCompany = (domain: string) => {
            const domainLower = domain.toLowerCase();
            return domainLower.includes(ownCompanyDomain) || domainLower.includes(summaryBrandLower);
          };

          const allCitationsResult = await db.db
            .prepare(`
              SELECT DISTINCT c.url, c.title, c.snippet
              FROM citations c
              INNER JOIN llm_responses lr ON c.llm_response_id = lr.id
              INNER JOIN prompts p ON lr.prompt_id = p.id
              WHERE p.analysis_run_id = ?
            `)
            .bind(runId)
            .all<any>();

          const otherSources: Record<string, number> = {};
          (allCitationsResult.results || []).forEach((citation) => {
            try {
              const urlObj = new URL(citation.url);
              const domain = urlObj.hostname.replace('www.', '').toLowerCase();
              if (!isOwnCompany(domain)) {
                otherSources[domain] = (otherSources[domain] || 0) + 1;
              }
            } catch {
              const urlLower = citation.url.toLowerCase();
              if (!isOwnCompany(urlLower)) {
                otherSources[citation.url] = (otherSources[citation.url] || 0) + 1;
              }
            }
          });

          const summary = {
            totalMentions,
            totalCitations,
            bestPrompts,
            otherSources,
          };

          await db.saveSummary(runId, summary);
          console.log(`[D1 DEBUG] Summary generated and saved for runId: ${runId}`);
        }
      } catch (error) {
        console.error(`[D1 ERROR] Failed to generate summary automatically:`, error);
        // Don't fail the whole request if summary generation fails
      }

      return new Response(JSON.stringify({
        success: true,
        runId,
        result: {
          categoryMetrics: categoryMetrics.results || [],
          competitiveAnalysis: competitiveAnalysis.results || [],
          timeSeries: timeSeries.results || [],
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in handleStep5:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to execute prompts",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  async handleFetchUrl(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json() as { url?: string };
    const { url } = body;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "GEO-Platform/1.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const html = await response.text();
        // Extract text content
        let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
        text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
        text = text.replace(/<[^>]+>/g, " ");
        text = text.replace(/\s+/g, " ").trim();

        return new Response(JSON.stringify({ content: text, text: text }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ content: null, error: "Failed to fetch" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  async handleExecutePrompt(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json() as {
      runId?: string;
      prompt?: any;
      userInput?: any;
    };
    const { runId, prompt, userInput } = body;

    if (!runId || !prompt) {
      return new Response(
        JSON.stringify({ error: "runId and prompt are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    try {
      const config = getConfig(env);
      const executor = new LLMExecutor(config);

      // Execute prompt with GPT-5 Web Search
      const response = await executor.executePrompt(prompt);

      // Only save prompt if response is valid and has output text
      if (!response || !response.outputText || response.outputText.trim().length === 0) {
        throw new Error("Prompt execution failed: No valid response received");
      }

      // Extract brand name from website URL
      const websiteUrl = userInput?.websiteUrl || '';
      const brandName = extractBrandName(websiteUrl);

      // Save prompt, response, and analysis immediately (with timestamps)
      // Only prompts with successful responses are saved
      const db = new Database(env.geo_db as any);
      
      // Ensure prompt has an ID and required fields
      if (!prompt.id) {
        prompt.id = `prompt_${runId}_${Date.now()}`;
      }
      if (!prompt.language) {
        prompt.language = userInput?.language || 'de';
      }
      if (!prompt.country) {
        prompt.country = userInput?.country || '';
      }
      if (!prompt.region) {
        prompt.region = userInput?.region || null;
      }
      if (!prompt.intent) {
        prompt.intent = 'high';
      }
      if (!prompt.createdAt) {
        prompt.createdAt = new Date().toISOString();
      }
      
      // Save prompt only after successful execution with valid response
      await db.savePrompts(runId, [prompt]);
      
      // Ensure response has correct promptId
      response.promptId = prompt.id;

      // Save response and citations using the proper method
      await db.saveLLMResponses([response]);

      // Perform analysis: Brand mentions, Citations, Competitors, Sentiment
      const analysisEngine = new AnalysisEngine(brandName, 0.7);
      const analyses = analysisEngine.analyzeResponses([prompt], [response]);
      
      if (!analyses || analyses.length === 0) {
        throw new Error("Analysis failed: No analysis result returned");
      }
      
      const analysis = analyses[0];

      // Save analysis using the proper method
      await db.savePromptAnalyses([analysis]);

      return new Response(JSON.stringify({
        success: true,
        response,
        analysis,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error('Error in handleExecutePrompt:', error);
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  async handleGenerateSummary(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const body = await request.json() as {
        runId: string;
        questionsAndAnswers?: any[];
        userInput?: any;
      };
      const { runId } = body;

      const db = new Database(env.geo_db as any);

      // Get run info to extract brand name
      const runInfo = await db.db
        .prepare("SELECT website_url FROM analysis_runs WHERE id = ?")
        .bind(runId)
        .first<{ website_url: string }>();

      if (!runInfo) {
        throw new Error("Analysis run not found");
      }

      const brandName = extractBrandName(runInfo.website_url);
      const brandLower = brandName.toLowerCase();
      const brandInUrl = brandLower.replace(/\s+/g, ""); // Remove spaces for URL matching

      // Calculate total mentions (exact + fuzzy)
      const mentionsResult = await db.db
        .prepare(`
          SELECT 
            SUM(brand_mentions_exact + brand_mentions_fuzzy) as totalMentions
          FROM prompt_analyses
          WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?)
        `)
        .bind(runId)
        .first<{ totalMentions: number | null }>();

      const totalMentions = mentionsResult?.totalMentions || 0;

      // Get all citations for this run
      const allCitationsResult = await db.db
        .prepare(`
          SELECT 
            c.url,
            c.title,
            c.snippet
          FROM citations c
          WHERE c.llm_response_id IN (
            SELECT id FROM llm_responses 
            WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?)
          )
        `)
        .bind(runId)
        .all<{ url: string; title: string | null; snippet: string | null }>();

      // Filter citations where brand is mentioned (same logic as AnalysisEngine.findBrandCitations)
      const brandCitations = (allCitationsResult.results || []).filter((citation) => {
        const citationText = `${citation.title || ""} ${citation.snippet || ""}`.toLowerCase();
        const urlLower = citation.url.toLowerCase();
        
        // Check if brand is mentioned in citation title, snippet, or URL
        const mentionedInText = citationText.includes(brandLower);
        const mentionedInUrl = urlLower.includes(brandInUrl);
        
        return mentionedInText || mentionedInUrl;
      });

      const totalCitations = brandCitations.length;

      // Get best prompts (top prompts by mentions + brand citations)
      // Get all prompts with their citations in one query
      const promptsWithCitationsResult = await db.db
        .prepare(`
          SELECT 
            p.id,
            p.question,
            COALESCE(pa.brand_mentions_exact, 0) + COALESCE(pa.brand_mentions_fuzzy, 0) as mentions,
            c.url as citation_url,
            c.title as citation_title,
            c.snippet as citation_snippet
          FROM prompts p
          LEFT JOIN prompt_analyses pa ON pa.prompt_id = p.id
          LEFT JOIN llm_responses lr ON lr.prompt_id = p.id
          LEFT JOIN citations c ON c.llm_response_id = lr.id
          WHERE p.analysis_run_id = ?
        `)
        .bind(runId)
        .all<{
          id: string;
          question: string;
          mentions: number;
          citation_url: string | null;
          citation_title: string | null;
          citation_snippet: string | null;
        }>();

      // Group by prompt and count unique brand citations
      const promptMap = new Map<string, { question: string; mentions: number; citationUrls: Set<string> }>();
      
      (promptsWithCitationsResult.results || []).forEach((row) => {
        if (!promptMap.has(row.id)) {
          promptMap.set(row.id, {
            question: row.question,
            mentions: row.mentions,
            citationUrls: new Set<string>(),
          });
        }

        // Track brand citations by URL to avoid double counting
        if (row.citation_url) {
          const citationText = `${row.citation_title || ""} ${row.citation_snippet || ""}`.toLowerCase();
          const urlLower = row.citation_url.toLowerCase();
          const mentionedInText = citationText.includes(brandLower);
          const mentionedInUrl = urlLower.includes(brandInUrl);
          
          if (mentionedInText || mentionedInUrl) {
            const prompt = promptMap.get(row.id)!;
            prompt.citationUrls.add(row.citation_url);
          }
        }
      });

      // Convert to array with citation counts and sort
      const bestPrompts = Array.from(promptMap.entries())
        .map(([id, data]) => ({
          question: data.question,
          mentions: data.mentions,
          citations: data.citationUrls.size,
        }))
        .sort((a, b) => (b.mentions + b.citations) - (a.mentions + a.citations))
        .slice(0, 10);

      // Get other sources (all citation URLs grouped by domain, excluding own company)
      // Extract own company domain from website URL
      let ownCompanyDomain = '';
      let ownCompanyBrandName = brandLower.replace(/\s+/g, ''); // Brand name without spaces for matching
      try {
        const websiteUrlObj = new URL(runInfo.website_url);
        ownCompanyDomain = websiteUrlObj.hostname.replace('www.', '').toLowerCase();
        // Also extract the base domain name (without TLD) for better matching
        const domainParts = ownCompanyDomain.split('.');
        if (domainParts.length > 0) {
          ownCompanyBrandName = domainParts[0]; // e.g., "frehnertec" from "frehnertec.ch"
        }
      } catch {
        // If URL parsing fails, use brand name
        ownCompanyDomain = ownCompanyBrandName;
      }

      // Helper function to check if a domain should be excluded
      const isOwnCompany = (domain: string): boolean => {
        const domainLower = domain.toLowerCase();
        // Exact match
        if (domainLower === ownCompanyDomain) return true;
        // Check if domain starts with brand name (e.g., "frehnertec.ch" contains "frehnertec")
        if (domainLower.startsWith(ownCompanyBrandName + '.') || domainLower === ownCompanyBrandName) {
          return true;
        }
        // Check if domain contains brand name as a significant part
        const domainWithoutTld = domainLower.split('.')[0];
        if (domainWithoutTld === ownCompanyBrandName) return true;
        return false;
      };

      const otherSources: Record<string, number> = {};
      // Use a Set to track unique citation URLs per domain to avoid double counting
      // This ensures that [acotec.ch](https://www.acotec.ch/?utm_source=openai) counts as ONE source
      const domainUrlMap = new Map<string, Set<string>>();
      
      // Use ALL citations, not just brand citations
      (allCitationsResult.results || []).forEach((citation) => {
        try {
          const urlObj = new URL(citation.url);
          // Normalize domain: remove www., convert to lowercase, remove trailing dots
          let domain = urlObj.hostname.replace(/^www\./, '').toLowerCase().replace(/\.$/, '');
          
          // Exclude own company domain
          if (!isOwnCompany(domain)) {
            // Track unique URLs per domain to avoid counting the same URL multiple times
            if (!domainUrlMap.has(domain)) {
              domainUrlMap.set(domain, new Set<string>());
            }
            // Normalize URL by removing query parameters and fragments for comparison
            // This ensures https://www.acotec.ch/?utm_source=openai and https://www.acotec.ch/ count as the same
            const normalizedUrl = urlObj.origin + urlObj.pathname;
            domainUrlMap.get(domain)!.add(normalizedUrl);
          }
        } catch {
          // If URL parsing fails, try to extract domain from the URL string
          try {
            // Try to extract domain using regex as fallback
            const domainMatch = citation.url.match(/https?:\/\/(?:www\.)?([^\/\?]+)/i);
            if (domainMatch && domainMatch[1]) {
              let domain = domainMatch[1].replace(/^www\./, '').toLowerCase().replace(/\.$/, '');
              if (!isOwnCompany(domain)) {
                if (!domainUrlMap.has(domain)) {
                  domainUrlMap.set(domain, new Set<string>());
                }
                // Use the original URL as fallback
                domainUrlMap.get(domain)!.add(citation.url);
              }
            }
          } catch {
            // If all parsing fails, skip this citation
          }
        }
      });
      
      // Count unique URLs per domain (each unique URL counts as 1, not multiple times)
      domainUrlMap.forEach((urlSet, domain) => {
        otherSources[domain] = urlSet.size;
      });

      // Create summary object
      const summary = {
        totalMentions,
        totalCitations,
        bestPrompts,
        otherSources,
      };

      // Save summary to database
      await db.saveSummary(runId, summary);

      return new Response(
        JSON.stringify(summary),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in handleGenerateSummary:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to generate summary",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  async handleAIReadiness(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const body = await request.json() as { url: string };
      const baseUrl = body.url?.trim();
      
      if (!baseUrl) {
        return new Response(
          JSON.stringify({ error: "URL is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Normalize URL
      let normalizedUrl = baseUrl;
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      const protocol: {
        timestamp: string;
        baseUrl: string;
        robotsTxt: {
          found: boolean;
          content?: string;
        };
        sitemap: {
          found: boolean;
          content?: string;
          urls: string[];
        };
        pages: Array<{
          url: string;
          fetchTime: number;
          content: string;
          success: boolean;
          error?: string;
        }>;
        analysis?: {
          summary: string;
          recommendations: string[];
          score?: number;
        };
      } = {
        timestamp: new Date().toISOString(),
        baseUrl: normalizedUrl,
        robotsTxt: {
          found: false,
        },
        sitemap: {
          found: false,
          urls: [],
        },
        pages: [],
      };

      // Step 1: Try to fetch robots.txt
      try {
        const robotsUrl = new URL('/robots.txt', normalizedUrl).toString();
        const robotsResponse = await fetch(robotsUrl, {
          headers: { "User-Agent": "GEO-Platform/1.0" },
          signal: AbortSignal.timeout(10000),
        });
        if (robotsResponse.ok) {
          const robotsContent = await robotsResponse.text();
          protocol.robotsTxt = {
            found: true,
            content: robotsContent,
          };
        } else {
          protocol.robotsTxt = { found: false };
        }
      } catch (error) {
        protocol.robotsTxt = { found: false };
      }

      // Step 2: Try to fetch sitemap
      const sitemapResult = await fetchSitemap(normalizedUrl);
      protocol.sitemap = {
        found: sitemapResult.found,
        content: sitemapResult.content,
        urls: sitemapResult.urls,
      };

      let urlsToFetch: string[] = [];

      if (sitemapResult.found && sitemapResult.urls.length > 0) {
        // If sitemap index, fetch individual sitemaps
        if (sitemapResult.urls.some(url => url.includes('sitemap'))) {
          const allUrls: string[] = [];
          for (const sitemapUrl of sitemapResult.urls.slice(0, 10)) { // Limit to 10 sitemaps
            try {
              const response = await fetch(sitemapUrl, {
                headers: { "User-Agent": "GEO-Platform/1.0" },
                signal: AbortSignal.timeout(10000),
              });
              if (response.ok) {
                const content = await response.text();
                const parsedUrls = parseSitemap(content);
                allUrls.push(...parsedUrls);
              }
            } catch (error) {
              // Skip failed sitemaps
              continue;
            }
          }
          urlsToFetch = allUrls;
        } else {
          urlsToFetch = sitemapResult.urls;
        }
      } else {
        // No sitemap found - extract links from landing page
        try {
          const response = await fetch(normalizedUrl, {
            headers: { "User-Agent": "GEO-Platform/1.0" },
            signal: AbortSignal.timeout(10000),
          });
          if (response.ok) {
            const html = await response.text();
            const links = extractLinksFromHtml(html, normalizedUrl);
            urlsToFetch = links.slice(0, 50); // Limit to 50 pages
          }
        } catch (error) {
          // Continue with just the base URL
        }
      }

      // Always include the base URL
      if (!urlsToFetch.includes(normalizedUrl)) {
        urlsToFetch.unshift(normalizedUrl);
      }

      // Filter out PDFs, images, and other non-HTML files
      urlsToFetch = urlsToFetch.filter(url => shouldFetchUrl(url));

      // Deduplicate URLs to avoid fetching the same page twice
      urlsToFetch = deduplicateUrls(urlsToFetch);

      // Limit total pages to fetch
      urlsToFetch = urlsToFetch.slice(0, 50);

      // Step 3: Fetch all pages with timing
      for (const url of urlsToFetch) {
        const startTime = Date.now();
        try {
          const response = await fetch(url, {
            headers: { "User-Agent": "GEO-Platform/1.0" },
            signal: AbortSignal.timeout(15000),
          });

          const fetchTime = Date.now() - startTime;

          // Check content type - only process HTML
          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
            protocol.pages.push({
              url,
              fetchTime,
              content: "",
              success: false,
              error: `Nicht-HTML Content-Type: ${contentType}`,
            });
            continue;
          }

          if (response.ok) {
            const html = await response.text();
            const textContent = extractTextContent(html);
            
            protocol.pages.push({
              url,
              fetchTime,
              content: textContent,
              success: true,
            });
          } else {
            protocol.pages.push({
              url,
              fetchTime,
              content: "",
              success: false,
              error: `HTTP ${response.status}: ${response.statusText}`,
            });
          }
        } catch (error) {
          const fetchTime = Date.now() - startTime;
          protocol.pages.push({
            url,
            fetchTime,
            content: "",
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Step 4: Generate initial protocol text (without GPT analysis)
      let protocolText = this.formatProtocol(protocol);

      // Step 5: Send to GPT API for analysis
      const config = getConfig(env);
      if (config.openai.apiKey) {
        try {
          const llmExecutor = new LLMExecutor(config);
          const analysisPromptText = `Analyze the following website analysis protocol. Focus: How well can an AI read and understand the content? What is missing?

${protocolText}

Please provide a structured analysis with:
1. Summary - How well can an AI read the content?
2. AI Readiness Score (0-100) - How well is the website optimized for AI readability?
3. Concrete Recommendations (as a list) - What is missing for better AI readability?
4. Identified Issues - What prevents AI from reading the content well?
5. Website Strengths - What is already good for AI readability?

Format: JSON with fields: summary, score, recommendations (Array), issues (Array), strengths (Array)`;

          // Use the LLM executor to get analysis
          const prompt: Prompt = {
            id: 'ai-readiness-analysis',
            categoryId: 'ai-readiness',
            question: analysisPromptText,
            language: 'en',
            intent: 'high',
            createdAt: new Date().toISOString(),
          };
          const analysisResult = await llmExecutor.executePrompt(prompt);
          
          try {
            // Try to parse JSON from the response
            const jsonMatch = analysisResult.outputText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              protocol.analysis = JSON.parse(jsonMatch[0]);
            } else {
              // Fallback: create structured response from text
              protocol.analysis = {
                summary: analysisResult.outputText,
                recommendations: analysisResult.outputText.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•')),
              };
            }
          } catch (parseError) {
            protocol.analysis = {
              summary: analysisResult.outputText,
              recommendations: [],
            };
          }
          
          // Regenerate protocol text with GPT analysis included
          protocolText = this.formatProtocol(protocol);
        } catch (error) {
          console.error("Error calling GPT API:", error);
          // Continue without analysis - protocolText already generated
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          protocol,
          protocolText,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in handleAIReadiness:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to analyze AI readiness",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  private formatProtocol(protocol: any): string {
    let text = `═══════════════════════════════════════════════════════════
PROTOCOL
═══════════════════════════════════════════════════════════

Timestamp: ${protocol.timestamp}
Website: ${protocol.baseUrl}

───────────────────────────────────────────────────────────
ROBOTS.TXT ANALYSIS
───────────────────────────────────────────────────────────
`;

    if (protocol.robotsTxt.found) {
      text += `✓ robots.txt found\n`;
      text += `\nContent:\n${protocol.robotsTxt.content}\n`;
    } else {
      text += `✗ No robots.txt found\n`;
    }

    text += `\n───────────────────────────────────────────────────────────
SITEMAP ANALYSIS
───────────────────────────────────────────────────────────
`;

    if (protocol.sitemap.found) {
      text += `✓ Sitemap found\n`;
      text += `Number of URLs in Sitemap: ${protocol.sitemap.urls.length}\n`;
      if (protocol.sitemap.content) {
        text += `\nSitemap Content (first 1000 characters):\n${protocol.sitemap.content.substring(0, 1000)}\n`;
      }
    } else {
      text += `✗ No sitemap found\n`;
      text += `Links were extracted from the landing page\n`;
    }

    text += `\n───────────────────────────────────────────────────────────
PAGES ANALYSIS
───────────────────────────────────────────────────────────
Number of Pages: ${protocol.pages.length}
Successful: ${protocol.pages.filter((p: any) => p.success).length}
Failed: ${protocol.pages.filter((p: any) => !p.success).length}

Average Load Time: ${Math.round(
      protocol.pages.reduce((sum: number, p: any) => sum + p.fetchTime, 0) / protocol.pages.length
    )}ms

`;

    protocol.pages.forEach((page: any, index: number) => {
      text += `\n[${index + 1}] ${page.url}\n`;
      text += `   Status: ${page.success ? '✓ Successful' : '✗ Error'}\n`;
      text += `   Load Time: ${page.fetchTime}ms\n`;
      if (page.error) {
        text += `   Error: ${page.error}\n`;
      }
      text += `   Content (first 3000 characters):\n   ${page.content.substring(0, 3000).replace(/\n/g, ' ')}${page.content.length > 3000 ? '...' : ''}\n`;
    });

    text += `\n═══════════════════════════════════════════════════════════\n`;

    return text;
  }

  async handleGetAIReadinessStatus(
    runId: string,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    // For now, return a simple status
    // This can be extended to store status in database if needed
    return new Response(
      JSON.stringify({ status: "completed", message: "AI Readiness analysis completed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
