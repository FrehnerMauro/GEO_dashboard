var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
  }
});

// ../node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "../node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// ../shared/utils/text-extraction.ts
var text_extraction_exports = {};
__export(text_extraction_exports, {
  extractConclusion: () => extractConclusion,
  extractTextStats: () => extractTextStats
});
function extractConclusion(answerText) {
  if (!answerText || answerText.trim().length === 0) {
    return answerText;
  }
  const empfehlungIndex = answerText.search(/##\s+Empfehlung/im);
  if (empfehlungIndex !== -1) {
    const startIndex = answerText.indexOf("\n", empfehlungIndex) + 1;
    const restOfText = answerText.substring(startIndex);
    const nextHeadingMatch = restOfText.match(/^\n##\s+/m);
    if (nextHeadingMatch && nextHeadingMatch.index !== void 0) {
      return restOfText.substring(0, nextHeadingMatch.index).trim();
    } else {
      return restOfText.trim();
    }
  }
  const conclusionPatterns = [
    /##\s+Fazit\s*\n([\s\S]*?)(?=\n##\s+|$)/im,
    /##\s+Zusammenfassung\s*\n([\s\S]*?)(?=\n##\s+|$)/im,
    /##\s+Summary\s*\n([\s\S]*?)(?=\n##\s+|$)/im,
    /##\s+Conclusion\s*\n([\s\S]*?)(?=\n##\s+|$)/im,
    /##\s+Recommendation\s*\n([\s\S]*?)(?=\n##\s+|$)/im
  ];
  for (const pattern of conclusionPatterns) {
    const match = answerText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return answerText;
}
function extractTextStats(text, brandName) {
  if (!text || text.trim().length === 0) {
    return {
      citations: 0,
      mentions: 0,
      otherLinks: 0,
      citationUrls: [],
      otherLinkUrls: []
    };
  }
  const MAX_TEXT_LENGTH = 5e4;
  const processedText = text.length > MAX_TEXT_LENGTH ? text.substring(0, MAX_TEXT_LENGTH) : text;
  const brandLower = brandName.toLowerCase();
  const brandDomain = brandLower.replace(/\s+/g, "");
  const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  const allLinks = [];
  let match;
  while ((match = markdownLinkRegex.exec(processedText)) !== null) {
    allLinks.push({
      text: match[1],
      url: match[2],
      index: match.index,
      length: match[0].length
    });
  }
  const citationRanges = [];
  const citationUrlsSet = /* @__PURE__ */ new Set();
  const otherLinkUrlsSet = /* @__PURE__ */ new Set();
  for (const link of allLinks) {
    const urlLower = link.url.toLowerCase();
    if (urlLower.includes(brandDomain)) {
      citationRanges.push({
        start: link.index,
        end: link.index + link.length
      });
      citationUrlsSet.add(link.url);
    } else {
      otherLinkUrlsSet.add(link.url);
    }
  }
  const sortedRanges = citationRanges.sort((a, b) => a.start - b.start);
  const escapedBrand = brandLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const mentionRegex = new RegExp(`\\b${escapedBrand}\\b`, "gi");
  let mentions = 0;
  let mentionMatch;
  while ((mentionMatch = mentionRegex.exec(processedText)) !== null) {
    const mentionIndex = mentionMatch.index;
    const mentionEnd = mentionIndex + mentionMatch[0].length;
    const isInCitation = sortedRanges.some(
      (range) => mentionIndex >= range.start && mentionEnd <= range.end
    );
    if (!isInCitation) {
      mentions++;
    }
  }
  return {
    citations: citationRanges.length,
    mentions,
    otherLinks: otherLinkUrlsSet.size,
    citationUrls: Array.from(citationUrlsSet),
    // Bereits dedupliziert durch Set
    otherLinkUrls: Array.from(otherLinkUrlsSet)
    // Bereits dedupliziert durch Set
  };
}
var init_text_extraction = __esm({
  "../shared/utils/text-extraction.ts"() {
    "use strict";
    init_modules_watch_stub();
    __name(extractConclusion, "extractConclusion");
    __name(extractTextStats, "extractTextStats");
  }
});

// ../shared/persistence/db.ts
var Database;
var init_db = __esm({
  "../shared/persistence/db.ts"() {
    "use strict";
    init_modules_watch_stub();
    Database = class {
      db;
      constructor(db) {
        this.db = db || {
          prepare: () => ({
            bind: () => ({ first: async () => null, run: async () => ({ success: true }), all: async () => ({ success: true, results: [] }) }),
            first: async () => null,
            run: async () => ({ success: true }),
            all: async () => ({ success: true, results: [] })
          }),
          batch: async () => [],
          exec: async () => ({ count: 0, duration: 0 })
        };
      }
      /**
       * Retry wrapper for D1 operations to handle transient errors
       * Retries on D1_ERROR, timeout, or reset errors
       */
      async retryD1Operation(operation, maxRetries = 3, baseDelay = 100, operationName) {
        let lastError;
        const opName = operationName || "D1 operation";
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const startTime = Date.now();
            const result = await operation();
            const duration = Date.now() - startTime;
            if (duration > 1e3) {
              console.log(`[D1 DEBUG] ${opName} completed in ${duration}ms`);
            }
            return result;
          } catch (error) {
            lastError = error;
            const errorMessage = error?.message || String(error);
            const isRetryable = errorMessage.includes("D1_ERROR") || errorMessage.includes("timeout") || errorMessage.includes("reset") || errorMessage.includes("Internal error while starting up") || errorMessage.includes("storage operation exceeded timeout");
            if (!isRetryable || attempt === maxRetries - 1) {
              console.error(`[D1 ERROR] ${opName} failed after ${attempt + 1} attempts:`, errorMessage);
              throw error;
            }
            const isStartupError = errorMessage.includes("Internal error while starting up");
            const delayMultiplier = isStartupError ? 3 : 1;
            const delay = baseDelay * Math.pow(2, attempt) * delayMultiplier;
            console.warn(`[D1 RETRY] ${opName} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms:`, errorMessage);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
        throw lastError;
      }
      /**
       * Execute batch operations in chunks to avoid D1 timeout limits
       * D1 has a limit of ~100 statements per batch, so we chunk larger batches
       */
      async batchInChunks(statements, chunkSize = 50, operationName) {
        if (statements.length === 0) {
          return;
        }
        const opName = operationName || `batch operation (${statements.length} statements)`;
        console.log(`[D1 DEBUG] Executing ${opName} in chunks of ${chunkSize}`);
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
          if (i + chunkSize < statements.length) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }
      }
      async saveAnalysisRun(runId, userInput, status = "pending") {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        try {
          await this.db.prepare(
            `INSERT INTO analysis_runs (id, website_url, country, region, language, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            runId,
            userInput.websiteUrl,
            userInput.country,
            userInput.region || null,
            userInput.language,
            status,
            now,
            now
          ).run();
        } catch (error) {
          if (error.message?.includes("no such table: analysis_runs")) {
            throw new Error(
              "Database tables not found. Please run the database setup first: POST /api/setup/database"
            );
          }
          throw error;
        }
      }
      async updateAnalysisStatus(runId, status, progress) {
        const progressJson = progress ? JSON.stringify(progress) : null;
        await this.retryD1Operation(async () => {
          await this.db.prepare(
            `UPDATE analysis_runs SET status = ?, progress = ?, updated_at = ? WHERE id = ?`
          ).bind(status, progressJson, (/* @__PURE__ */ new Date()).toISOString(), runId).run();
        }, 3, 150, "updateAnalysisStatus");
      }
      async getAnalysisStatus(runId) {
        const run = await this.db.prepare("SELECT status, progress, error_message, step FROM analysis_runs WHERE id = ?").bind(runId).first();
        if (!run)
          return null;
        return {
          status: run.status || "pending",
          progress: run.progress ? JSON.parse(run.progress) : null,
          error: run.error_message || void 0,
          step: run.step || "sitemap"
        };
      }
      async saveCategories(runId, categories) {
        if (categories.length === 0) {
          return;
        }
        const statements = categories.map(
          (cat) => this.db.prepare(
            `INSERT OR REPLACE INTO categories (id, analysis_run_id, name, description, confidence, source_pages, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 
             COALESCE((SELECT created_at FROM categories WHERE id = ?), ?)
           )`
          ).bind(
            cat.id,
            runId,
            cat.name,
            cat.description,
            cat.confidence,
            JSON.stringify(cat.sourcePages),
            cat.id,
            // For COALESCE subquery to preserve existing created_at
            (/* @__PURE__ */ new Date()).toISOString()
            // Fallback timestamp if category doesn't exist
          )
        );
        await this.retryD1Operation(async () => {
          await this.batchInChunks(statements, 50, `saveCategories (${categories.length} categories)`);
        }, 3, 100, "saveCategories");
      }
      async savePrompts(runId, prompts) {
        if (prompts.length === 0) {
          return;
        }
        const statements = prompts.map(
          (prompt) => this.db.prepare(
            `INSERT OR REPLACE INTO prompts (id, analysis_run_id, category_id, question, language, country, region, intent, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
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
        await this.retryD1Operation(async () => {
          await this.batchInChunks(statements, 30, `savePrompts (${prompts.length} prompts)`);
        }, 3, 150, "savePrompts");
      }
      async saveLLMResponses(responses) {
        if (responses.length === 0) {
          return;
        }
        const responseStatements = responses.map((response) => {
          const responseId = `resp_${response.promptId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          return {
            responseId,
            statement: this.db.prepare(
              `INSERT INTO llm_responses (id, prompt_id, output_text, model, timestamp)
             VALUES (?, ?, ?, ?, ?)`
            ).bind(
              responseId,
              response.promptId,
              response.outputText,
              response.model,
              response.timestamp
            ),
            citations: response.citations
          };
        });
        const responseOnlyStatements = responseStatements.map((rs) => rs.statement);
        if (responseOnlyStatements.length > 0) {
          console.log(`[D1 DEBUG] Saving ${responseOnlyStatements.length} responses first...`);
          await this.retryD1Operation(async () => {
            await this.batchInChunks(responseOnlyStatements, 20, `saveLLMResponses - responses only`);
          }, 3, 200, "saveLLMResponses - responses");
        }
        const citationStatements = [];
        for (const { responseId, citations } of responseStatements) {
          for (const citation of citations) {
            const citationId = `cite_${responseId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            citationStatements.push(
              this.db.prepare(
                `INSERT INTO citations (id, llm_response_id, url, title, snippet)
               VALUES (?, ?, ?, ?, ?)`
              ).bind(
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
            await this.batchInChunks(citationStatements, 15, `saveLLMResponses - citations (${citationStatements.length} total)`);
          }, 3, 200, "saveLLMResponses - citations");
        }
        console.log(`[D1 DEBUG] Completed saving ${responses.length} responses with ${citationStatements.length} citations`);
      }
      async savePromptAnalyses(analyses) {
        if (analyses.length === 0) {
          return;
        }
        const statements = analyses.map((analysis) => {
          const analysisId = `analysis_${analysis.promptId}_${Date.now()}`;
          return {
            analysis: this.db.prepare(
              `INSERT INTO prompt_analyses 
             (id, prompt_id, brand_mentions_exact, brand_mentions_fuzzy, brand_mentions_contexts,
              citation_count, citation_urls, sentiment_tone, sentiment_confidence, sentiment_keywords, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
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
              return this.db.prepare(
                `INSERT INTO competitor_mentions 
               (id, prompt_analysis_id, competitor_name, mention_count, contexts, citation_urls)
               VALUES (?, ?, ?, ?, ?, ?)`
              ).bind(
                competitorId,
                analysisId,
                competitor.name,
                competitor.count,
                JSON.stringify(competitor.contexts),
                JSON.stringify(competitor.citations)
              );
            })
          };
        });
        const allStatements = [];
        for (const { analysis, competitors } of statements) {
          allStatements.push(analysis);
          allStatements.push(...competitors);
        }
        if (allStatements.length > 0) {
          await this.retryD1Operation(async () => {
            await this.batchInChunks(allStatements, 25, `savePromptAnalyses (${analyses.length} analyses, ${allStatements.length} total statements)`);
          }, 3, 100, "savePromptAnalyses");
        }
      }
      async saveCategoryMetrics(runId, metrics) {
        if (metrics.length === 0) {
          return;
        }
        const statements = metrics.map((metric) => {
          const metricId = `metric_${metric.categoryId}_${Date.now()}`;
          return this.db.prepare(
            `INSERT INTO category_metrics 
           (id, analysis_run_id, category_id, visibility_score, citation_rate, 
            brand_mention_rate, competitor_mention_rate, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
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
      async saveCompetitiveAnalysis(runId, analysis) {
        const analysisId = `comp_analysis_${runId}_${Date.now()}`;
        await this.retryD1Operation(async () => {
          await this.db.prepare(
            `INSERT INTO competitive_analyses 
           (id, analysis_run_id, brand_share, competitor_shares, white_space_topics, 
            dominated_prompts, missing_brand_prompts, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            analysisId,
            runId,
            analysis.brandShare,
            JSON.stringify(analysis.competitorShares),
            JSON.stringify(analysis.whiteSpaceTopics),
            JSON.stringify(analysis.dominatedPrompts),
            JSON.stringify(analysis.missingBrandPrompts),
            analysis.timestamp
          ).run();
        });
      }
      async saveTimeSeriesData(runId, data) {
        const dataId = `ts_${runId}_${Date.now()}`;
        await this.retryD1Operation(async () => {
          await this.db.prepare(
            `INSERT INTO time_series 
           (id, analysis_run_id, timestamp, visibility_score, citation_count, 
            brand_mention_count, competitor_mention_count)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            dataId,
            runId,
            data.timestamp,
            data.visibilityScore,
            data.citationCount,
            data.brandMentionCount,
            data.competitorMentionCount
          ).run();
        });
      }
      async saveSummary(runId, summary) {
        const randomSuffix = Math.random().toString(36).substring(2, 9);
        const summaryId = `summary_${runId}_${Date.now()}_${randomSuffix}`;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await this.retryD1Operation(async () => {
          await this.db.prepare("DELETE FROM analysis_summaries WHERE analysis_run_id = ?").bind(runId).run();
          await this.db.prepare(
            `INSERT INTO analysis_summaries 
           (id, analysis_run_id, total_mentions, total_citations, best_prompts, other_sources, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            summaryId,
            runId,
            summary.totalMentions,
            summary.totalCitations,
            JSON.stringify(summary.bestPrompts),
            JSON.stringify(summary.otherSources),
            now
          ).run();
        }, 3, 150, "saveSummary");
      }
      async getSummary(runId) {
        const result = await this.db.prepare(
          `SELECT * FROM analysis_summaries 
         WHERE analysis_run_id = ? 
         ORDER BY created_at DESC 
         LIMIT 1`
        ).bind(runId).first();
        if (!result)
          return null;
        return {
          totalMentions: result.total_mentions,
          totalCitations: result.total_citations,
          bestPrompts: JSON.parse(result.best_prompts || "[]"),
          otherSources: JSON.parse(result.other_sources || "{}")
        };
      }
      async getPromptsForAnalysis(runId) {
        return this.retryD1Operation(async () => {
          const { extractConclusion: extractConclusion2, extractTextStats: extractTextStats2 } = await Promise.resolve().then(() => (init_text_extraction(), text_extraction_exports));
          const runInfo = await this.db.prepare("SELECT website_url FROM analysis_runs WHERE id = ?").bind(runId).first();
          let brandName = "the brand";
          if (runInfo?.website_url) {
            try {
              const domain = new URL(runInfo.website_url).hostname;
              const parts = domain.split(".");
              brandName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            } catch {
            }
          }
          const result = await this.db.prepare(
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
          ).bind(runId).all();
          const prompts = result.results || [];
          const batchSize = 10;
          const processedPrompts = [];
          for (let i = 0; i < prompts.length; i += batchSize) {
            const batch = prompts.slice(i, i + batchSize);
            const batchResults = batch.map((r) => {
              try {
                const conclusion = extractConclusion2(r.answer);
                const stats = r.answer && r.answer.trim().length > 0 ? extractTextStats2(r.answer, brandName) : null;
                return {
                  id: r.id,
                  question: r.question,
                  answer: conclusion,
                  // Das extrahierte Fazit
                  categoryId: r.category_id,
                  categoryName: r.category_name,
                  createdAt: r.created_at,
                  // Statistiken aus dem originalen Text
                  citations: stats?.citations ?? 0,
                  mentions: stats?.mentions ?? 0,
                  otherLinks: stats?.otherLinks ?? 0,
                  citationUrls: stats?.citationUrls ?? [],
                  otherLinkUrls: stats?.otherLinkUrls ?? []
                };
              } catch (error) {
                console.error(`Error processing prompt ${r.id}:`, error);
                return {
                  id: r.id,
                  question: r.question,
                  answer: extractConclusion2(r.answer),
                  categoryId: r.category_id,
                  categoryName: r.category_name,
                  createdAt: r.created_at,
                  citations: 0,
                  mentions: 0,
                  otherLinks: 0,
                  citationUrls: [],
                  otherLinkUrls: []
                };
              }
            });
            processedPrompts.push(...batchResults);
            if (i + batchSize < prompts.length) {
              await new Promise((resolve) => setTimeout(resolve, 10));
            }
          }
          return processedPrompts;
        }, 3, 200, `getPromptsForAnalysis (${runId})`);
      }
      async getAnalysisRun(runId) {
        return this.retryD1Operation(async () => {
          const run = await this.db.prepare("SELECT * FROM analysis_runs WHERE id = ?").bind(runId).first();
          if (!run)
            return null;
          const categoriesResult = await this.db.prepare("SELECT * FROM categories WHERE analysis_run_id = ?").bind(runId).all();
          const categories = (categoriesResult.results || []).map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            confidence: c.confidence,
            sourcePages: JSON.parse(c.source_pages || "[]")
          }));
          const promptsResult = await this.db.prepare("SELECT * FROM prompts WHERE analysis_run_id = ?").bind(runId).all();
          const prompts = (promptsResult.results || []).map((p) => ({
            id: p.id,
            categoryId: p.category_id,
            question: p.question,
            language: p.language,
            country: p.country || void 0,
            region: p.region || void 0,
            intent: p.intent,
            createdAt: p.created_at
          }));
          const analysesResult = await this.db.prepare(`
          SELECT pa.*, 
                 GROUP_CONCAT(cm.competitor_name || '|' || cm.mention_count, '|||') as competitors_data
          FROM prompt_analyses pa
          INNER JOIN prompts p ON pa.prompt_id = p.id
          LEFT JOIN competitor_mentions cm ON cm.prompt_analysis_id = pa.id
          WHERE p.analysis_run_id = ?
          GROUP BY pa.id
        `).bind(runId).all();
          const analyses = (analysesResult.results || []).map((a) => {
            const competitors = a.competitors_data ? a.competitors_data.split("|||").map((c) => {
              const [name, count] = c.split("|");
              return { name, count: parseInt(count || "0", 10), contexts: [], citations: [] };
            }) : [];
            return {
              promptId: a.prompt_id,
              brandMentions: {
                exact: a.brand_mentions_exact,
                fuzzy: a.brand_mentions_fuzzy,
                contexts: JSON.parse(a.brand_mentions_contexts || "[]")
              },
              citationCount: a.citation_count,
              citationUrls: JSON.parse(a.citation_urls || "[]"),
              brandCitations: [],
              competitors,
              sentiment: {
                tone: a.sentiment_tone,
                confidence: a.sentiment_confidence,
                keywords: JSON.parse(a.sentiment_keywords || "[]")
              },
              timestamp: a.timestamp,
              isMentioned: a.brand_mentions_exact + a.brand_mentions_fuzzy > 0,
              mentionCount: a.brand_mentions_exact + a.brand_mentions_fuzzy,
              isCited: a.citation_count > 0,
              citationDetails: JSON.parse(a.citation_urls || "[]").map((url) => ({ url })),
              competitorDetails: competitors.map((c) => ({ name: c.name, count: c.count, locations: [] }))
            };
          });
          const metricsResult = await this.db.prepare("SELECT * FROM category_metrics WHERE analysis_run_id = ?").bind(runId).all();
          const categoryMetrics = (metricsResult.results || []).map((m) => ({
            categoryId: m.category_id,
            visibilityScore: m.visibility_score,
            citationRate: m.citation_rate,
            brandMentionRate: m.brand_mention_rate,
            competitorMentionRate: m.competitor_mention_rate,
            timestamp: m.timestamp
          }));
          const competitiveResult = await this.db.prepare("SELECT * FROM competitive_analyses WHERE analysis_run_id = ? ORDER BY timestamp DESC LIMIT 1").bind(runId).first();
          const competitiveAnalysis = competitiveResult ? {
            brandShare: competitiveResult.brand_share,
            competitorShares: JSON.parse(competitiveResult.competitor_shares || "{}"),
            whiteSpaceTopics: JSON.parse(competitiveResult.white_space_topics || "[]"),
            dominatedPrompts: JSON.parse(competitiveResult.dominated_prompts || "[]"),
            missingBrandPrompts: JSON.parse(competitiveResult.missing_brand_prompts || "[]"),
            timestamp: competitiveResult.timestamp
          } : {
            brandShare: 0,
            competitorShares: {},
            whiteSpaceTopics: [],
            dominatedPrompts: [],
            missingBrandPrompts: [],
            timestamp: run.updated_at
          };
          const timeSeriesResult = await this.db.prepare("SELECT * FROM time_series WHERE analysis_run_id = ? ORDER BY timestamp ASC").bind(runId).all();
          const timeSeries = (timeSeriesResult.results || []).map((ts) => ({
            timestamp: ts.timestamp,
            visibilityScore: ts.visibility_score,
            citationCount: ts.citation_count,
            brandMentionCount: ts.brand_mention_count,
            competitorMentionCount: ts.competitor_mention_count
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
            updatedAt: run.updated_at
          };
        });
      }
      async getLatestAnalysisRun(websiteUrl) {
        const run = await this.db.prepare(
          "SELECT id FROM analysis_runs WHERE website_url = ? ORDER BY created_at DESC LIMIT 1"
        ).bind(websiteUrl).first();
        return run?.id || null;
      }
      async deleteAnalysis(runId) {
        await this.retryD1Operation(async () => {
          const prompts = await this.db.prepare("SELECT id FROM prompts WHERE analysis_run_id = ?").bind(runId).all();
          const promptIds = (prompts.results || []).map((p) => p.id);
          if (promptIds.length > 0) {
            const chunkSize = 50;
            for (let i = 0; i < promptIds.length; i += chunkSize) {
              const chunk = promptIds.slice(i, i + chunkSize);
              const responses = await this.db.prepare(`
              SELECT lr.id 
              FROM llm_responses lr
              INNER JOIN prompts p ON lr.prompt_id = p.id
              WHERE p.analysis_run_id = ? AND lr.prompt_id IN (${chunk.map(() => "?").join(",")})
            `).bind(runId, ...chunk).all();
              const responseIds = (responses.results || []).map((r) => r.id);
              if (responseIds.length > 0) {
                for (let j = 0; j < responseIds.length; j += chunkSize) {
                  const responseChunk = responseIds.slice(j, j + chunkSize);
                  await this.db.prepare(`DELETE FROM citations WHERE llm_response_id IN (${responseChunk.map(() => "?").join(",")})`).bind(...responseChunk).run();
                }
                for (let j = 0; j < responseIds.length; j += chunkSize) {
                  const responseChunk = responseIds.slice(j, j + chunkSize);
                  await this.db.prepare(`DELETE FROM llm_responses WHERE id IN (${responseChunk.map(() => "?").join(",")})`).bind(...responseChunk).run();
                }
              }
              const analyses = await this.db.prepare(`
              SELECT pa.id 
              FROM prompt_analyses pa
              INNER JOIN prompts p ON pa.prompt_id = p.id
              WHERE p.analysis_run_id = ? AND pa.prompt_id IN (${chunk.map(() => "?").join(",")})
            `).bind(runId, ...chunk).all();
              const analysisIds = (analyses.results || []).map((a) => a.id);
              if (analysisIds.length > 0) {
                for (let j = 0; j < analysisIds.length; j += chunkSize) {
                  const analysisChunk = analysisIds.slice(j, j + chunkSize);
                  await this.db.prepare(`DELETE FROM competitor_mentions WHERE prompt_analysis_id IN (${analysisChunk.map(() => "?").join(",")})`).bind(...analysisChunk).run();
                }
                for (let j = 0; j < analysisIds.length; j += chunkSize) {
                  const analysisChunk = analysisIds.slice(j, j + chunkSize);
                  await this.db.prepare(`DELETE FROM prompt_analyses WHERE id IN (${analysisChunk.map(() => "?").join(",")})`).bind(...analysisChunk).run();
                }
              }
              await this.db.prepare(`DELETE FROM prompts WHERE id IN (${chunk.map(() => "?").join(",")})`).bind(...chunk).run();
            }
          }
          await this.db.prepare("DELETE FROM category_metrics WHERE analysis_run_id = ?").bind(runId).run();
          await this.db.prepare("DELETE FROM competitive_analyses WHERE analysis_run_id = ?").bind(runId).run();
          await this.db.prepare("DELETE FROM time_series WHERE analysis_run_id = ?").bind(runId).run();
          await this.db.prepare("DELETE FROM categories WHERE analysis_run_id = ?").bind(runId).run();
          await this.db.prepare("DELETE FROM analysis_runs WHERE id = ?").bind(runId).run();
        });
      }
      // Company Management
      async createCompany(company) {
        const id = `company_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await this.db.prepare(
          `INSERT INTO companies (id, name, website_url, country, language, region, description, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
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
        ).run();
        return id;
      }
      async getCompany(companyId) {
        const company = await this.db.prepare("SELECT * FROM companies WHERE id = ?").bind(companyId).first();
        if (!company)
          return null;
        return {
          id: company.id,
          name: company.name,
          websiteUrl: company.website_url,
          country: company.country,
          language: company.language,
          region: company.region || void 0,
          description: company.description || void 0,
          isActive: company.is_active === 1,
          createdAt: company.created_at,
          updatedAt: company.updated_at
        };
      }
      async getAllCompanies() {
        const companies = await this.db.prepare(
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
        ).all();
        return (companies.results || []).map((c) => {
          let companyName = c.website_url;
          try {
            const url = new URL(c.website_url.startsWith("http") ? c.website_url : `https://${c.website_url}`);
            companyName = url.hostname.replace("www.", "");
          } catch (e) {
          }
          return {
            id: encodeURIComponent(c.website_url),
            name: companyName,
            websiteUrl: c.website_url,
            country: c.country,
            language: c.language,
            region: c.region || void 0,
            description: void 0,
            isActive: true,
            createdAt: c.last_analysis_date,
            updatedAt: c.last_analysis_date
          };
        });
      }
      async updateCompany(companyId, updates) {
        const fields = [];
        const values = [];
        if (updates.name !== void 0) {
          fields.push("name = ?");
          values.push(updates.name);
        }
        if (updates.websiteUrl !== void 0) {
          fields.push("website_url = ?");
          values.push(updates.websiteUrl);
        }
        if (updates.country !== void 0) {
          fields.push("country = ?");
          values.push(updates.country);
        }
        if (updates.language !== void 0) {
          fields.push("language = ?");
          values.push(updates.language);
        }
        if (updates.region !== void 0) {
          fields.push("region = ?");
          values.push(updates.region || null);
        }
        if (updates.description !== void 0) {
          fields.push("description = ?");
          values.push(updates.description || null);
        }
        if (updates.isActive !== void 0) {
          fields.push("is_active = ?");
          values.push(updates.isActive ? 1 : 0);
        }
        fields.push("updated_at = ?");
        values.push((/* @__PURE__ */ new Date()).toISOString());
        values.push(companyId);
        await this.db.prepare(`UPDATE companies SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
      }
      // Company Prompts (saved questions for re-use)
      async saveCompanyPrompt(prompt) {
        const id = `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await this.db.prepare(
          `INSERT INTO company_prompts (id, company_id, question, category_id, category_name, language, country, region, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
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
        ).run();
        return id;
      }
      async getCompanyPrompts(companyId, activeOnly = true) {
        const query = activeOnly ? "SELECT * FROM company_prompts WHERE company_id = ? AND is_active = 1 ORDER BY created_at DESC" : "SELECT * FROM company_prompts WHERE company_id = ? ORDER BY created_at DESC";
        const prompts = await this.db.prepare(query).bind(companyId).all();
        return (prompts.results || []).map((p) => ({
          id: p.id,
          companyId: p.company_id,
          question: p.question,
          categoryId: p.category_id || void 0,
          categoryName: p.category_name || void 0,
          language: p.language,
          country: p.country || void 0,
          region: p.region || void 0,
          isActive: p.is_active === 1,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
      }
      async getCompanyAnalysisRuns(companyId, limit = 50) {
        const websiteUrl = decodeURIComponent(companyId);
        const runs = await this.db.prepare(
          `SELECT id, website_url, country, language, region, status, created_at, updated_at 
         FROM analysis_runs 
         WHERE website_url = ? 
         ORDER BY created_at DESC 
         LIMIT ?`
        ).bind(websiteUrl, limit).all();
        return (runs.results || []).map((r) => ({
          id: r.id,
          websiteUrl: r.website_url,
          country: r.country,
          language: r.language,
          region: r.region || void 0,
          status: r.status || "pending",
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      }
      async getAllAnalysisRuns(limit = 100) {
        try {
          const runs = await this.db.prepare(
            `SELECT id, website_url, country, language, region, status, created_at, updated_at, company_id
         FROM analysis_runs 
         ORDER BY created_at DESC 
         LIMIT ?`
          ).bind(limit).all();
          if (!runs || !runs.results) {
            return [];
          }
          return runs.results.map((r) => ({
            id: r.id,
            websiteUrl: r.website_url,
            country: r.country,
            language: r.language,
            region: r.region || void 0,
            status: r.status || "pending",
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            companyId: r.company_id || void 0
          }));
        } catch (error) {
          console.error("Error in getAllAnalysisRuns:", error);
          return [];
        }
      }
      // Global view methods
      async getAllGlobalCategories() {
        return this.retryD1Operation(async () => {
          try {
            const result = await this.db.prepare(
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
            ).all();
            return (result.results || []).map((r) => ({
              name: r.name,
              description: r.description || "",
              count: r.count
            }));
          } catch (error) {
            console.error("Error in getAllGlobalCategories, trying fallback query:", error);
            const fallbackResult = await this.db.prepare(
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
            ).all();
            return (fallbackResult.results || []).map((r) => ({
              name: r.name,
              description: r.description || "",
              count: r.count
            }));
          }
        }).catch((error) => {
          console.error("All retry attempts failed for getAllGlobalCategories:", error);
          return [];
        });
      }
      async getGlobalPromptsByCategory(categoryName) {
        return this.retryD1Operation(async () => {
          try {
            const result = await this.db.prepare(
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
            ).bind(categoryName).all();
            const prompts = result.results || [];
            const promptIds = prompts.map((p) => p.id);
            if (promptIds.length === 0) {
              return { prompts: [], sourceStats: [] };
            }
            const answersResult = await this.db.prepare(
              `SELECT 
              prompt_id,
              output_text,
              ROW_NUMBER() OVER (PARTITION BY prompt_id ORDER BY timestamp DESC) as rn
             FROM llm_responses
             WHERE prompt_id IN (${promptIds.map(() => "?").join(",")})`
            ).bind(...promptIds).all();
            const answerMap = /* @__PURE__ */ new Map();
            (answersResult.results || []).forEach((a) => {
              if (a.rn === 1 && a.output_text && a.output_text.trim()) {
                answerMap.set(a.prompt_id, a.output_text);
              }
            });
            const citationsResult = await this.db.prepare(
              `SELECT 
              cit.url
             FROM citations cit
             INNER JOIN llm_responses lr ON cit.llm_response_id = lr.id
             WHERE lr.prompt_id IN (${promptIds.map(() => "?").join(",")})`
            ).bind(...promptIds).all();
            const domainCountMap = /* @__PURE__ */ new Map();
            (citationsResult.results || []).forEach((citation) => {
              try {
                const urlObj = new URL(citation.url);
                const domain = urlObj.hostname.replace(/^www\./, "").toLowerCase();
                domainCountMap.set(domain, (domainCountMap.get(domain) || 0) + 1);
              } catch {
              }
            });
            const sourceStats = Array.from(domainCountMap.entries()).map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count);
            const promptsWithAnswers = prompts.map((r) => {
              const answer = answerMap.get(r.id);
              if (!answer)
                return null;
              return {
                id: r.id,
                question: r.question,
                answer,
                language: r.language,
                country: r.country || null,
                region: r.region || null,
                intent: r.intent,
                createdAt: r.created_at,
                analysisRunId: r.analysis_run_id,
                websiteUrl: r.website_url
              };
            }).filter((p) => p !== null);
            const questionMap = /* @__PURE__ */ new Map();
            promptsWithAnswers.forEach((prompt) => {
              const existing = questionMap.get(prompt.question);
              if (!existing || new Date(prompt.createdAt) > new Date(existing.createdAt)) {
                questionMap.set(prompt.question, prompt);
              }
            });
            const deduplicatedPrompts = Array.from(questionMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return {
              prompts: deduplicatedPrompts,
              sourceStats
            };
          } catch (error) {
            console.error("Error in getGlobalPromptsByCategory, trying simpler query:", error);
            const fallbackResult = await this.db.prepare(
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
            ).bind(categoryName).all();
            const fallbackPromptIds = (fallbackResult.results || []).map((p) => p.id);
            if (fallbackPromptIds.length === 0) {
              return { prompts: [], sourceStats: [] };
            }
            const fallbackAnswersResult = await this.db.prepare(
              `SELECT 
              prompt_id,
              output_text,
              ROW_NUMBER() OVER (PARTITION BY prompt_id ORDER BY timestamp DESC) as rn
             FROM llm_responses
             WHERE prompt_id IN (${fallbackPromptIds.map(() => "?").join(",")})`
            ).bind(...fallbackPromptIds).all();
            const fallbackAnswerMap = /* @__PURE__ */ new Map();
            (fallbackAnswersResult.results || []).forEach((a) => {
              if (a.rn === 1 && a.output_text && a.output_text.trim()) {
                fallbackAnswerMap.set(a.prompt_id, a.output_text);
              }
            });
            const fallbackPromptsWithAnswers = (fallbackResult.results || []).map((r) => {
              const answer = fallbackAnswerMap.get(r.id);
              if (!answer)
                return null;
              return {
                id: r.id,
                question: r.question,
                answer,
                language: r.language,
                country: r.country || null,
                region: r.region || null,
                intent: r.intent,
                createdAt: r.created_at,
                analysisRunId: r.analysis_run_id,
                websiteUrl: r.website_url
              };
            }).filter((p) => p !== null);
            const fallbackQuestionMap = /* @__PURE__ */ new Map();
            fallbackPromptsWithAnswers.forEach((prompt) => {
              const existing = fallbackQuestionMap.get(prompt.question);
              if (!existing || new Date(prompt.createdAt) > new Date(existing.createdAt)) {
                fallbackQuestionMap.set(prompt.question, prompt);
              }
            });
            const deduplicatedFallbackPrompts = Array.from(fallbackQuestionMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return {
              prompts: deduplicatedFallbackPrompts,
              sourceStats: []
            };
          }
        });
      }
      async getCompanyTimeSeries(companyId, days = 30) {
        const cutoffDate = /* @__PURE__ */ new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const timeSeries = await this.db.prepare(
          `SELECT ts.timestamp, ts.visibility_score, ts.citation_count, 
                ts.brand_mention_count, ts.competitor_mention_count
         FROM time_series ts
         JOIN analysis_runs ar ON ts.analysis_run_id = ar.id
         WHERE ar.company_id = ? AND ts.timestamp >= ?
         ORDER BY ts.timestamp ASC`
        ).bind(companyId, cutoffDate.toISOString()).all();
        return (timeSeries.results || []).map((ts) => ({
          timestamp: ts.timestamp,
          visibilityScore: ts.visibility_score,
          citationCount: ts.citation_count,
          brandMentionCount: ts.brand_mention_count,
          competitorMentionCount: ts.competitor_mention_count
        }));
      }
      // Scheduled Runs
      async createScheduledRun(schedule) {
        const id = `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await this.db.prepare(
          `INSERT INTO scheduled_runs (id, company_id, schedule_type, next_run_at, last_run_at, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          schedule.companyId,
          schedule.scheduleType,
          schedule.nextRunAt,
          schedule.lastRunAt || null,
          schedule.isActive ? 1 : 0,
          now,
          now
        ).run();
        return id;
      }
      async getScheduledRuns(companyId, activeOnly = true) {
        let query = "SELECT * FROM scheduled_runs";
        const conditions = [];
        const values = [];
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
        const schedules = await this.db.prepare(query).bind(...values).all();
        return (schedules.results || []).map((s) => ({
          id: s.id,
          companyId: s.company_id,
          scheduleType: s.schedule_type,
          nextRunAt: s.next_run_at,
          lastRunAt: s.last_run_at || void 0,
          isActive: s.is_active === 1,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }));
      }
      async updateScheduledRun(scheduleId, updates) {
        const fields = [];
        const values = [];
        if (updates.scheduleType !== void 0) {
          fields.push("schedule_type = ?");
          values.push(updates.scheduleType);
        }
        if (updates.nextRunAt !== void 0) {
          fields.push("next_run_at = ?");
          values.push(updates.nextRunAt);
        }
        if (updates.lastRunAt !== void 0) {
          fields.push("last_run_at = ?");
          values.push(updates.lastRunAt || null);
        }
        if (updates.isActive !== void 0) {
          fields.push("is_active = ?");
          values.push(updates.isActive ? 1 : 0);
        }
        fields.push("updated_at = ?");
        values.push((/* @__PURE__ */ new Date()).toISOString());
        values.push(scheduleId);
        await this.db.prepare(`UPDATE scheduled_runs SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
      }
      async getScheduledRunsDue() {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const schedules = await this.db.prepare(
          `SELECT * FROM scheduled_runs 
         WHERE is_active = 1 AND next_run_at <= ? 
         ORDER BY next_run_at ASC`
        ).bind(now).all();
        return (schedules.results || []).map((s) => ({
          id: s.id,
          companyId: s.company_id,
          scheduleType: s.schedule_type,
          nextRunAt: s.next_run_at,
          lastRunAt: s.last_run_at || void 0,
          isActive: s.is_active === 1,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }));
      }
    };
    __name(Database, "Database");
  }
});

// ../shared/persistence/index.ts
var persistence_exports = {};
__export(persistence_exports, {
  Database: () => Database
});
var init_persistence = __esm({
  "../shared/persistence/index.ts"() {
    "use strict";
    init_modules_watch_stub();
    init_db();
  }
});

// .wrangler/tmp/bundle-Ad2mz9/middleware-loader.entry.ts
init_modules_watch_stub();

// .wrangler/tmp/bundle-Ad2mz9/middleware-insertion-facade.js
init_modules_watch_stub();

// src/index.ts
init_modules_watch_stub();

// src/api/router.ts
init_modules_watch_stub();

// src/api/routes/route-definitions.ts
init_modules_watch_stub();
var ROUTES = [
  // Workflow routes (used by frontend)
  { method: "POST", path: "/api/workflow/step1", handler: "workflow.step1" },
  { method: "POST", path: "/api/workflow/step3", handler: "workflow.step3" },
  { method: "PUT", path: /^\/api\/workflow\/([^\/]+)\/categories$/, handler: "workflow.saveCategories" },
  { method: "POST", path: "/api/workflow/step4", handler: "workflow.step4" },
  { method: "POST", path: "/api/workflow/step5", handler: "workflow.step5" },
  { method: "POST", path: "/api/workflow/fetchUrl", handler: "workflow.fetchUrl" },
  { method: "POST", path: "/api/workflow/generateSummary", handler: "workflow.generateSummary" },
  { method: "POST", path: "/api/workflow/aiReadiness", handler: "workflow.aiReadiness" },
  // Analysis routes (used by frontend)
  { method: "GET", path: "/api/analyses", handler: "analysis.getAll" },
  { method: "GET", path: /^\/api\/analysis\/([^\/]+)\/prompts-summary$/, handler: "analysis.getPromptsAndSummary" },
  { method: "DELETE", path: /^\/api\/analysis\/([^\/]+)$/, handler: "analysis.delete" },
  // Dashboard routes
  { method: "GET", path: "/api/companies", handler: "analysis.getAllCompanies" },
  { method: "GET", path: /^\/api\/companies\/([^\/]+)\/analyses$/, handler: "analysis.getCompanyAnalyses" },
  { method: "GET", path: "/api/global/categories", handler: "analysis.getGlobalCategories" },
  { method: "GET", path: /^\/api\/global\/categories\/([^\/]+)\/prompts$/, handler: "analysis.getGlobalPromptsByCategory" },
  // Health check (for monitoring)
  { method: "GET", path: "/api/health", handler: "health.check" }
];
function matchRoute(path, method) {
  for (const route of ROUTES) {
    if (route.method !== method)
      continue;
    if (typeof route.path === "string") {
      if (route.path === path) {
        return { route, params: {} };
      }
    } else {
      const match = path.match(route.path);
      if (match) {
        const params = {};
        if (match.groups) {
          Object.assign(params, match.groups);
        } else {
          match.slice(1).forEach((value, index) => {
            params[`param${index}`] = value;
          });
        }
        return { route, params };
      }
    }
  }
  return null;
}
__name(matchRoute, "matchRoute");

// src/api/middleware/index.ts
init_modules_watch_stub();

// src/api/middleware/cors.ts
init_modules_watch_stub();
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
__name(getCorsHeaders, "getCorsHeaders");
function handleCors(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders() });
  }
  return null;
}
__name(handleCors, "handleCors");

// src/api/middleware/error-handler.ts
init_modules_watch_stub();
function handleError(error, corsHeaders) {
  console.error("API error:", error);
  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error"
    }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}
__name(handleError, "handleError");
function handleNotFound(corsHeaders) {
  return new Response(
    JSON.stringify({
      error: "Not Found",
      message: "The requested endpoint does not exist"
    }),
    {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}
__name(handleNotFound, "handleNotFound");

// src/api/handlers/workflow.ts
init_modules_watch_stub();

// ../shared/llm_execution/index.ts
init_modules_watch_stub();
var LLMExecutor = class {
  constructor(config) {
    this.config = config;
  }
  async executePrompt(prompt) {
    const response = await this.callResponsesAPI(prompt.question);
    return {
      promptId: prompt.id,
      outputText: response.outputText,
      citations: response.citations,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      model: this.config.openai.model
    };
  }
  async executePrompts(prompts) {
    const responses = [];
    for (const prompt of prompts) {
      try {
        const response = await this.executePrompt(prompt);
        if (response && response.outputText && response.outputText.trim().length > 0) {
          responses.push(response);
        } else {
          console.warn(`Prompt ${prompt.id} executed but has no valid output text`);
        }
      } catch (error) {
        console.error(`Failed to execute prompt ${prompt.id}:`, error);
      }
    }
    return responses;
  }
  async callResponsesAPI(question) {
    if (this.config.debug?.enabled) {
      console.log("\u{1F41B} DEBUG MODE: Returning dummy LLM response (no API call)");
      return this.getDummyResponse(question);
    }
    const url = "https://api.openai.com/v1/responses";
    if (!this.config.openai.apiKey) {
      throw new Error("OpenAI API key is not configured");
    }
    const requestBody = {
      model: this.config.openai.model,
      tools: [
        {
          type: "web_search"
        }
      ],
      input: question
    };
    console.log("\u{1F4E4} Sending request to OpenAI Responses API:");
    console.log("  URL:", url);
    console.log("  Model:", this.config.openai.model);
    console.log("  API Key present:", !!this.config.openai.apiKey);
    console.log("  API Key length:", this.config.openai.apiKey?.length || 0);
    console.log("  Request body:", JSON.stringify(requestBody, null, 2));
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.openai.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
    } catch (fetchError) {
      console.error("\u274C Fetch error:", fetchError);
      throw new Error(`Failed to connect to OpenAI API: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }
    console.log("\u{1F4E5} Response status:", response.status, response.statusText);
    console.log("\u{1F4E5} Response headers:", Object.fromEntries(response.headers.entries()));
    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
        console.error("\u274C API Error Response Text:", errorText);
      } catch (e) {
        errorText = "Could not read error response";
        console.error("\u274C Could not read error response:", e);
      }
      console.error("\u274C API Error Response Status:", response.status);
      console.error("\u274C API Error Response Status Text:", response.statusText);
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
        console.error("\u274C API Error JSON:", JSON.stringify(errorJson, null, 2));
      } catch (e) {
      }
      const errorMessage = errorJson?.error?.message || errorJson?.error || errorText || response.statusText;
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText} - ${errorMessage.substring(0, 500)}`
      );
    }
    let data;
    try {
      data = await response.json();
      console.log("\u{1F50D} Raw API response type:", Array.isArray(data) ? "array" : typeof data);
      try {
        console.log("\u{1F50D} Raw API response:", JSON.stringify(data, null, 2));
      } catch (e) {
        console.error("\u274C Failed to stringify response:", e);
      }
    } catch (jsonError) {
      const responseText = await response.text();
      console.error("\u274C Failed to parse JSON response:", jsonError);
      console.error("\u274C Response text:", responseText);
      throw new Error(`Failed to parse API response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}. Response: ${responseText.substring(0, 500)}`);
    }
    let outputText;
    let citations;
    try {
      outputText = this.extractOutputText(data);
      citations = this.extractCitations(data);
    } catch (extractError) {
      throw extractError;
    }
    console.log("\u{1F4DD} Extracted outputText length:", outputText.length);
    console.log("\u{1F4DD} Extracted outputText preview:", outputText.substring(0, 200));
    console.log("\u{1F4DA} Extracted citations count:", citations.length);
    if (citations.length > 0) {
      console.log("\u{1F4DA} Extracted citations:", JSON.stringify(citations, null, 2));
    } else {
      console.warn("\u26A0\uFE0F No citations extracted! Raw data structure:", JSON.stringify(data, null, 2).substring(0, 1e3));
    }
    if (!outputText || outputText.trim().length === 0) {
      console.error("\u274C ERROR: Empty outputText extracted!");
      console.error("\u274C Full raw data:", JSON.stringify(data, null, 2));
      throw new Error("Keine Antwort von GPT-5 erhalten. Die API hat eine leere Antwort zur\xFCckgegeben.");
    }
    return {
      outputText,
      citations
    };
  }
  extractOutputText(data) {
    console.log("\u{1F50D} extractOutputText - Input data type:", Array.isArray(data) ? "array" : typeof data);
    if (data && typeof data === "object" && Array.isArray(data.output)) {
      const outputArray = data.output;
      const messageObj = outputArray.find(
        (item) => item.type === "message" && item.status === "completed"
      );
      if (messageObj?.content && Array.isArray(messageObj.content)) {
        const outputTextItem = messageObj.content.find(
          (item) => item.type === "output_text"
        );
        if (outputTextItem?.text) {
          return outputTextItem.text;
        }
      }
    }
    if (data && typeof data === "object" && Array.isArray(data.data)) {
      return this.extractOutputText(data.data);
    }
    if (data && typeof data === "object" && "output_text" in data) {
      console.log("\u2705 Found output_text directly on response object");
      return data.output_text;
    }
    if (Array.isArray(data)) {
      console.log("\u{1F50D} Data is array, length:", data.length);
      const messageObj = data.find(
        (item) => item.type === "message" && item.status === "completed"
      );
      console.log("\u{1F50D} Found messageObj:", messageObj ? "yes" : "no");
      if (messageObj?.content && Array.isArray(messageObj.content)) {
        console.log("\u{1F50D} messageObj.content is array, length:", messageObj.content.length);
        const outputTextItem = messageObj.content.find(
          (item) => item.type === "output_text"
        );
        console.log("\u{1F50D} Found outputTextItem:", outputTextItem ? "yes" : "no");
        if (outputTextItem?.text) {
          console.log("\u2705 Extracted text from outputTextItem.text, length:", outputTextItem.text.length);
          return outputTextItem.text;
        } else if (outputTextItem) {
          console.warn("\u26A0\uFE0F outputTextItem found but no text property. Keys:", Object.keys(outputTextItem));
        }
      }
    }
    if (data?.message?.output_text) {
      console.log("\u2705 Using fallback: data.message.output_text");
      return data.message.output_text;
    }
    if (data?.outputText) {
      console.log("\u2705 Using fallback: data.outputText");
      return data.outputText;
    }
    console.error("\u274C No output text found in data structure");
    console.error("\u274C Data structure:", JSON.stringify(data, null, 2));
    return "";
  }
  extractCitations(data) {
    const citations = [];
    if (data && typeof data === "object" && Array.isArray(data.output)) {
      const outputArray = data.output;
      const messageObj = outputArray.find(
        (item) => item.type === "message" && item.status === "completed"
      );
      if (messageObj?.content && Array.isArray(messageObj.content)) {
        const outputTextItem = messageObj.content.find(
          (item) => item.type === "output_text"
        );
        if (outputTextItem?.annotations && Array.isArray(outputTextItem.annotations)) {
          for (const annotation of outputTextItem.annotations) {
            if (annotation.type === "url_citation" && annotation.url) {
              citations.push({
                url: annotation.url,
                title: annotation.title || annotation.url,
                snippet: annotation.snippet || ""
              });
            }
          }
        }
      }
    }
    if (Array.isArray(data)) {
      const messageObj = data.find(
        (item) => item.type === "message" && item.status === "completed"
      );
      if (messageObj?.content && Array.isArray(messageObj.content)) {
        const outputTextItem = messageObj.content.find(
          (item) => item.type === "output_text"
        );
        if (outputTextItem?.annotations && Array.isArray(outputTextItem.annotations)) {
          for (const annotation of outputTextItem.annotations) {
            if (annotation.type === "url_citation" && annotation.url) {
              citations.push({
                url: annotation.url,
                title: annotation.title || annotation.url,
                snippet: annotation.snippet || ""
              });
            }
          }
        }
      }
    }
    if (data?.message?.content && Array.isArray(data.message.content)) {
      for (const item of data.message.content) {
        if (item.annotations && Array.isArray(item.annotations)) {
          for (const annotation of item.annotations) {
            if (annotation.type === "url_citation" && annotation.url) {
              citations.push({
                url: annotation.url,
                title: annotation.title || annotation.url,
                snippet: annotation.snippet || ""
              });
            }
          }
        }
      }
    }
    const uniqueCitations = /* @__PURE__ */ new Map();
    for (const citation of citations) {
      if (citation.url && !uniqueCitations.has(citation.url)) {
        uniqueCitations.set(citation.url, citation);
      }
    }
    return Array.from(uniqueCitations.values());
  }
  getDummyResponse(question) {
    const dummyOutputText = `[DEBUG MODE] Dies ist eine Dummy-Antwort f\xFCr die Frage: "${question}"

In einem echten Szenario w\xFCrde hier eine detaillierte Antwort von GPT-5 mit Web-Suche stehen. Diese Antwort enth\xE4lt relevante Informationen, Zitate und Verweise auf externe Quellen.

Die Antwort behandelt verschiedene Aspekte des Themas und bietet umfassende Informationen f\xFCr den Benutzer.`;
    const dummyCitations = [
      {
        url: "https://example.com/article1",
        title: "Beispiel-Artikel 1 - Relevante Informationen",
        snippet: "Dies ist ein Beispiel-Zitat aus einer externen Quelle, die relevante Informationen zum Thema enth\xE4lt."
      },
      {
        url: "https://example.com/article2",
        title: "Beispiel-Artikel 2 - Weitere Details",
        snippet: "Ein weiteres Beispiel-Zitat mit zus\xE4tzlichen Informationen und Kontext zum Thema."
      },
      {
        url: "https://example.com/article3",
        title: "Beispiel-Artikel 3 - Zus\xE4tzliche Ressourcen",
        snippet: "Ein drittes Beispiel-Zitat, das weitere Perspektiven und Ressourcen zum Thema bietet."
      }
    ];
    return {
      outputText: dummyOutputText,
      citations: dummyCitations
    };
  }
};
__name(LLMExecutor, "LLMExecutor");

// ../shared/config.ts
init_modules_watch_stub();
function getConfig(env) {
  const debugModeValue = env.DEBUG_MODE;
  const debugEnabled = debugModeValue === "true" || debugModeValue === "1" || debugModeValue === true;
  console.log("\u{1F527} Config loaded - DEBUG_MODE:", debugModeValue, "\u2192 enabled:", debugEnabled);
  if (debugEnabled) {
    console.log("\u{1F41B} DEBUG MODE ENABLED - Using dummy values, no API calls will be made");
  }
  return {
    debug: {
      enabled: debugEnabled
    },
    openai: {
      apiKey: env.OPENAI_API_KEY || "",
      model: env.OPENAI_MODEL || "gpt-4o",
      // Use gpt-4o by default, set OPENAI_MODEL=gpt-5 in .dev.vars if available
      responsesApiUrl: "https://api.openai.com/v1/responses"
    },
    crawling: {
      maxPages: parseInt(env.MAX_PAGES || "50"),
      maxDepth: parseInt(env.MAX_DEPTH || "3"),
      timeout: parseInt(env.CRAWL_TIMEOUT || "30000"),
      userAgent: env.USER_AGENT || "GEO-Platform/1.0"
    },
    analysis: {
      reRunSchedule: env.RE_RUN_SCHEDULE || "weekly",
      brandFuzzyThreshold: parseFloat(env.BRAND_FUZZY_THRESHOLD || "0.7"),
      sentimentConfidenceThreshold: parseFloat(
        env.SENTIMENT_CONFIDENCE_THRESHOLD || "0.6"
      )
    },
    categories: {
      minConfidence: parseFloat(env.MIN_CATEGORY_CONFIDENCE || "0.5"),
      maxCategories: parseInt(env.MAX_CATEGORIES || "10")
    },
    prompts: {
      questionsPerCategory: parseInt(env.QUESTIONS_PER_CATEGORY || "5"),
      minIntentScore: parseFloat(env.MIN_INTENT_SCORE || "0.7")
    }
  };
}
__name(getConfig, "getConfig");

// src/api/handlers/workflow.ts
init_persistence();

// ../shared/analysis/index.ts
init_modules_watch_stub();

// ../shared/analysis/brand_mention.ts
init_modules_watch_stub();
var BrandMentionDetector = class {
  brandName;
  fuzzyThreshold;
  debug;
  constructor(brandName, fuzzyThreshold = 0.7, debug = false) {
    this.brandName = brandName;
    this.fuzzyThreshold = fuzzyThreshold;
    this.debug = debug;
  }
  /**
   * Enable or disable debug logging
   */
  setDebug(enabled) {
    this.debug = enabled;
  }
  detectMentions(response) {
    const rawText = response.outputText;
    const lowerText = rawText.toLowerCase();
    const brandLower = this.brandName.toLowerCase();
    const brandDomain = brandLower.replace(/\s+/g, "");
    if (this.debug) {
      console.log("[BrandMentionDetector] Starting detection");
      console.log("[BrandMentionDetector] Brand name:", this.brandName);
      console.log("[BrandMentionDetector] Brand lower:", brandLower);
      console.log("[BrandMentionDetector] Brand domain:", brandDomain);
      console.log("[BrandMentionDetector] Text length:", rawText.length);
      console.log("[BrandMentionDetector] Text preview:", rawText.substring(0, 200));
    }
    const citationRanges = this.findCitationRanges(lowerText, brandDomain);
    const citations = citationRanges.length;
    const exact = this.countExactMentionsExcludingCitations(
      rawText,
      lowerText,
      brandLower,
      citationRanges
    );
    const contexts = this.extractContexts(rawText, brandLower, brandDomain);
    if (this.debug) {
      console.log("[BrandMentionDetector] Exact mentions (excluding citations):", exact);
      console.log("[BrandMentionDetector] Citations found:", citations);
      console.log("[BrandMentionDetector] Citation ranges:", citationRanges);
      console.log("[BrandMentionDetector] Contexts found:", contexts.length);
      console.log("[BrandMentionDetector] Contexts:", contexts);
    }
    return {
      exact,
      fuzzy: 0,
      // absichtlich: alles andere wäre unseriös
      contexts,
      citations
      // Anzahl der Markdown-Citations mit Brand-Domain
    };
  }
  // --------------------------------------------------
  // Exakte Text-Erwähnungen (kein Fuzzy, kein Ratespiel)
  // Ausschließt Erwähnungen, die bereits in Citations sind
  // Case-insensitive: brand is already lowercased, lowerText is used for matching
  // --------------------------------------------------
  countExactMentionsExcludingCitations(rawText, lowerText, brand, citationRanges) {
    const escapedBrand = this.escapeRegex(brand);
    const regex = new RegExp(`\\b${escapedBrand}\\b`, "gi");
    if (this.debug) {
      console.log("[countExactMentionsExcludingCitations] Regex pattern:", regex.source);
      console.log("[countExactMentionsExcludingCitations] Escaped brand:", escapedBrand);
    }
    let count = 0;
    let match;
    while ((match = regex.exec(lowerText)) !== null) {
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;
      const isInCitation = citationRanges.some(
        (range) => matchStart >= range.start && matchEnd <= range.end
      );
      if (!isInCitation) {
        count++;
        if (this.debug) {
          console.log(`[countExactMentionsExcludingCitations] Found mention at ${matchStart}-${matchEnd}: "${match[0]}"`);
        }
      } else {
        if (this.debug) {
          console.log(`[countExactMentionsExcludingCitations] Skipped mention at ${matchStart}-${matchEnd} (in citation)`);
        }
      }
    }
    if (this.debug) {
      console.log("[countExactMentionsExcludingCitations] Total count (excluding citations):", count);
    }
    return count;
  }
  // --------------------------------------------------
  // Markdown-Citations wie:
  // [frehnertec.ch](https://www.frehnertec.ch/...)
  // Oder auch: [text](https://www.frehnertec.ch/...)
  // Gibt die Positionen (start, end) der Citations zurück
  // --------------------------------------------------
  findCitationRanges(text, brandDomain) {
    const escapedDomain = this.escapeRegex(brandDomain);
    const citationRegex = new RegExp(
      `\\[([^\\]]*)\\]\\([^)]*${escapedDomain}[^)]*\\)`,
      "gi"
    );
    if (this.debug) {
      console.log("[findCitationRanges] Regex pattern:", citationRegex.source);
      console.log("[findCitationRanges] Escaped domain:", escapedDomain);
    }
    const ranges = [];
    let match;
    while ((match = citationRegex.exec(text)) !== null) {
      ranges.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }
    if (this.debug) {
      console.log("[findCitationRanges] Found citations:", ranges.length);
      console.log("[findCitationRanges] Citation ranges:", ranges);
    }
    return ranges;
  }
  // --------------------------------------------------
  // Kontext = ganze Sätze, die entweder
  // - Brand-Namen ODER
  // - Brand-Domain enthalten
  // --------------------------------------------------
  extractContexts(text, brand, brandDomain) {
    const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    if (this.debug) {
      console.log("[extractContexts] Total sentences:", sentences.length);
    }
    const contexts = [];
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (lower.includes(brand) || lower.includes(brandDomain)) {
        if (!contexts.includes(sentence)) {
          contexts.push(sentence);
        }
      }
    }
    if (this.debug) {
      console.log("[extractContexts] Found contexts:", contexts.length);
    }
    return contexts.slice(0, 5);
  }
  // --------------------------------------------------
  // Regex-Sicherheit
  // --------------------------------------------------
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
};
__name(BrandMentionDetector, "BrandMentionDetector");

// ../shared/analysis/sentiment.ts
init_modules_watch_stub();
var SentimentAnalyzer = class {
  positiveKeywords = [
    "excellent",
    "great",
    "best",
    "top",
    "leading",
    "outstanding",
    "superior",
    "recommended",
    "popular",
    "trusted",
    "reliable",
    "innovative",
    "effective",
    "efficient",
    "powerful",
    "comprehensive",
    "advanced",
    "professional",
    "quality",
    "expert"
  ];
  negativeKeywords = [
    "poor",
    "bad",
    "worst",
    "limited",
    "lacks",
    "missing",
    "inadequate",
    "insufficient",
    "problematic",
    "difficult",
    "complex",
    "expensive",
    "overpriced",
    "slow",
    "unreliable",
    "outdated",
    "inferior",
    "weak",
    "flawed",
    "disappointing"
  ];
  analyzeSentiment(response) {
    const text = response.outputText.toLowerCase();
    const words = text.split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    const foundKeywords = [];
    for (const word of words) {
      const cleanWord = word.replace(/[.,!?;:]/g, "");
      if (this.positiveKeywords.includes(cleanWord)) {
        positiveScore++;
        if (!foundKeywords.includes(cleanWord)) {
          foundKeywords.push(cleanWord);
        }
      }
      if (this.negativeKeywords.includes(cleanWord)) {
        negativeScore++;
        if (!foundKeywords.includes(cleanWord)) {
          foundKeywords.push(cleanWord);
        }
      }
    }
    let tone;
    const totalScore = positiveScore + negativeScore;
    if (totalScore === 0) {
      tone = "neutral";
    } else if (positiveScore > negativeScore * 2) {
      tone = "positive";
    } else if (negativeScore > positiveScore * 2) {
      tone = "negative";
    } else {
      tone = "mixed";
    }
    const confidence = Math.min(
      totalScore / Math.max(words.length / 100, 1),
      1
    );
    return {
      tone,
      confidence: Math.max(confidence, 0.1),
      // Minimum confidence
      keywords: foundKeywords.slice(0, 10)
    };
  }
};
__name(SentimentAnalyzer, "SentimentAnalyzer");

// ../shared/analysis/index.ts
var AnalysisEngine = class {
  brandMentionDetector;
  sentimentAnalyzer;
  brandName;
  constructor(brandName, fuzzyThreshold = 0.7) {
    this.brandName = brandName;
    this.brandMentionDetector = new BrandMentionDetector(
      brandName,
      fuzzyThreshold
    );
    this.sentimentAnalyzer = new SentimentAnalyzer();
  }
  analyzeResponses(prompts, responses) {
    const analyses = [];
    for (const prompt of prompts) {
      const response = responses.find((r) => r.promptId === prompt.id);
      if (!response)
        continue;
      const analysis = this.analyzeSingleResponse(prompt, response);
      analyses.push(analysis);
    }
    return analyses;
  }
  analyzeSingleResponse(prompt, response) {
    const brandMentions = this.brandMentionDetector.detectMentions(response);
    const sentiment = this.sentimentAnalyzer.analyzeSentiment(response);
    const brandCitations = this.findBrandCitations(response);
    const isMentioned = brandMentions.exact > 0 || brandMentions.fuzzy > 0;
    const mentionCount = brandMentions.exact + brandMentions.fuzzy;
    const isCited = brandCitations.length > 0;
    const citationDetails = brandCitations.map((c) => ({
      url: c.url,
      title: c.title,
      snippet: c.snippet
    }));
    return {
      promptId: prompt.id,
      brandMentions,
      citationCount: response.citations.length,
      citationUrls: response.citations.map((c) => c.url),
      brandCitations,
      sentiment,
      timestamp: response.timestamp,
      // Structured answers
      isMentioned,
      mentionCount,
      isCited,
      citationDetails
    };
  }
  findBrandCitations(response) {
    const brandLower = this.brandName.toLowerCase();
    const brandInUrl = brandLower.replace(/\s+/g, "");
    const brandCitations = [];
    for (const citation of response.citations) {
      const citationText = `${citation.title || ""} ${citation.snippet || ""}`.toLowerCase();
      const urlLower = citation.url.toLowerCase();
      const mentionedInText = citationText.includes(brandLower);
      const mentionedInUrl = urlLower.includes(brandInUrl);
      if (mentionedInText || mentionedInUrl) {
        let context = "";
        if (mentionedInText) {
          context = this.extractBrandContextFromCitation(citation, brandLower);
        } else if (mentionedInUrl) {
          context = this.findUrlContextInText(response.outputText, citation.url);
        }
        brandCitations.push({
          url: citation.url,
          title: citation.title,
          snippet: citation.snippet,
          context
        });
      }
    }
    return brandCitations;
  }
  findUrlContextInText(text, url) {
    const urlPattern = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const markdownPattern = new RegExp(`\\[([^\\]]+)\\]\\(${urlPattern}\\)`, "i");
    const match = text.match(markdownPattern);
    if (match && match[1]) {
      return match[1];
    }
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.includes(url)) {
        return sentence.trim();
      }
    }
    return "";
  }
  extractBrandContextFromCitation(citation, brandLower) {
    const text = `${citation.title || ""} ${citation.snippet || ""}`;
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(brandLower)) {
        return sentence.trim();
      }
    }
    return void 0;
  }
  calculateCategoryMetrics(categoryId, prompts, analyses) {
    const categoryPrompts = prompts.filter((p) => p.categoryId === categoryId);
    const categoryAnalyses = analyses.filter(
      (a) => categoryPrompts.some((p) => p.id === a.promptId)
    );
    if (categoryAnalyses.length === 0) {
      return {
        categoryId,
        visibilityScore: 0,
        citationRate: 0,
        brandMentionRate: 0,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const totalPrompts = categoryPrompts.length;
    const promptsWithBrandMentions = categoryAnalyses.filter(
      (a) => a.brandMentions.exact > 0 || a.brandMentions.fuzzy > 0
    ).length;
    const totalCitations = categoryAnalyses.reduce(
      (sum, a) => sum + a.citationCount,
      0
    );
    const visibilityScore = this.calculateVisibilityScore(categoryAnalyses);
    const citationRate = totalCitations / totalPrompts;
    const brandMentionRate = promptsWithBrandMentions / totalPrompts;
    return {
      categoryId,
      visibilityScore,
      citationRate,
      brandMentionRate,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  calculateVisibilityScore(analyses) {
    let score = 0;
    for (const analysis of analyses) {
      score += analysis.brandMentions.exact * 10;
      score += analysis.brandMentions.fuzzy * 5;
      score += analysis.citationCount * 2;
      if (analysis.sentiment.tone === "positive") {
        score += 5;
      } else if (analysis.sentiment.tone === "negative") {
        score -= 5;
      }
    }
    const maxPossibleScore = analyses.length * 50;
    return Math.min(Math.max(score / maxPossibleScore * 100, 0), 100);
  }
  performCompetitiveAnalysis(analyses, prompts) {
    const totalMentions = analyses.reduce(
      (sum, a) => sum + a.brandMentions.exact + a.brandMentions.fuzzy,
      0
    );
    const brandShare = 100;
    const whiteSpaceTopics = prompts.filter((p) => {
      const analysis = analyses.find((a) => a.promptId === p.id);
      if (!analysis)
        return true;
      return analysis.brandMentions.exact === 0 && analysis.brandMentions.fuzzy === 0;
    }).map((p) => p.question);
    const missingBrandPrompts = prompts.filter((p) => {
      const analysis = analyses.find((a) => a.promptId === p.id);
      if (!analysis)
        return true;
      return analysis.brandMentions.exact === 0 && analysis.brandMentions.fuzzy === 0;
    }).map((p) => p.id);
    return {
      brandShare,
      competitorShares: {},
      whiteSpaceTopics,
      dominatedPrompts: [],
      missingBrandPrompts,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};
__name(AnalysisEngine, "AnalysisEngine");

// src/api/utils.ts
init_modules_watch_stub();
function extractBrandName(websiteUrl) {
  try {
    const url = new URL(websiteUrl);
    const hostname = url.hostname;
    const domain = hostname.replace(/^www\./, "");
    const brandName = domain.split(".")[0];
    return brandName.charAt(0).toUpperCase() + brandName.slice(1);
  } catch (e) {
    return websiteUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].split(".")[0];
  }
}
__name(extractBrandName, "extractBrandName");

// src/api/utils/sitemap.ts
init_modules_watch_stub();
async function fetchSitemap(baseUrl) {
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap/sitemap.xml`
  ];
  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: { "User-Agent": "GEO-Platform/1.0" },
        signal: AbortSignal.timeout(1e4)
      });
      if (response.ok) {
        const content = await response.text();
        const urls = parseSitemap(content);
        if (urls.length > 0) {
          return { found: true, urls, content };
        }
      }
    } catch (error) {
      continue;
    }
  }
  return { found: false, urls: [] };
}
__name(fetchSitemap, "fetchSitemap");
function parseSitemap(xml) {
  const urls = [];
  const sitemapIndexMatch = xml.match(/<sitemapindex[^>]*>([\s\S]*?)<\/sitemapindex>/i);
  if (sitemapIndexMatch) {
    const sitemapLinks = xml.matchAll(/<sitemap[^>]*>[\s\S]*?<loc[^>]*>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/gi);
    for (const match of sitemapLinks) {
      urls.push(match[1].trim());
    }
    return urls;
  }
  const urlMatches = xml.matchAll(/<url[^>]*>[\s\S]*?<loc[^>]*>([^<]+)<\/loc>[\s\S]*?<\/url>/gi);
  for (const match of urlMatches) {
    urls.push(match[1].trim());
  }
  return urls;
}
__name(parseSitemap, "parseSitemap");
function extractLinksFromHtml(html, baseUrl) {
  const links = [];
  const baseUrlObj = new URL(baseUrl);
  const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
  for (const match of linkMatches) {
    let href = match[1].trim();
    if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }
    try {
      if (href.startsWith("/")) {
        href = `${baseUrlObj.protocol}//${baseUrlObj.host}${href}`;
      } else if (!href.startsWith("http")) {
        href = new URL(href, baseUrl).toString();
      }
      const hrefUrl = new URL(href);
      if (hrefUrl.hostname === baseUrlObj.hostname || hrefUrl.hostname.endsWith("." + baseUrlObj.hostname)) {
        links.push(href);
      }
    } catch (error) {
      continue;
    }
  }
  return [...new Set(links)];
}
__name(extractLinksFromHtml, "extractLinksFromHtml");
function extractTextContent(html) {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}
__name(extractTextContent, "extractTextContent");
function shouldFetchUrl(url) {
  const urlLower = url.toLowerCase();
  const excludedExtensions = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".webp",
    ".bmp",
    ".ico",
    ".mp4",
    ".mp3",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".zip",
    ".rar",
    ".tar",
    ".gz",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".css",
    ".js",
    ".json",
    ".xml",
    ".txt"
  ];
  for (const ext of excludedExtensions) {
    if (urlLower.endsWith(ext)) {
      return false;
    }
  }
  if (urlLower.includes("/images/") || urlLower.includes("/img/") || urlLower.includes("/assets/") && (urlLower.includes(".jpg") || urlLower.includes(".png") || urlLower.includes(".gif"))) {
    return false;
  }
  return true;
}
__name(shouldFetchUrl, "shouldFetchUrl");
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith("/")) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    urlObj.hostname = urlObj.hostname.toLowerCase();
    if (urlObj.protocol === "https:" && urlObj.port === "443" || urlObj.protocol === "http:" && urlObj.port === "80") {
      urlObj.port = "";
    }
    if (urlObj.search) {
      const params = new URLSearchParams(urlObj.search);
      const sortedParams = new URLSearchParams();
      Array.from(params.keys()).sort().forEach((key) => {
        sortedParams.append(key, params.get(key) || "");
      });
      urlObj.search = sortedParams.toString();
    }
    urlObj.hash = "";
    return urlObj.toString();
  } catch (error) {
    return url;
  }
}
__name(normalizeUrl, "normalizeUrl");
function deduplicateUrls(urls) {
  const seen = /* @__PURE__ */ new Set();
  const unique = [];
  for (const url of urls) {
    const normalized = normalizeUrl(url);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(url);
    }
  }
  return unique;
}
__name(deduplicateUrls, "deduplicateUrls");

// src/api/handlers/workflow.ts
var WorkflowHandlers = class {
  constructor(workflowEngine) {
    this.workflowEngine = workflowEngine;
  }
  async handleStep1(request, env, corsHeaders) {
    try {
      const body = await request.json();
      let websiteUrl = body.websiteUrl?.trim();
      if (websiteUrl) {
        const urlPattern = new RegExp("^https?:\\/\\/", "i");
        if (!urlPattern.test(websiteUrl)) {
          websiteUrl = "https://" + websiteUrl;
        }
      }
      const userInput = {
        websiteUrl: websiteUrl || "",
        country: body.country || "",
        region: body.region,
        language: body.language || ""
      };
      const result = await this.workflowEngine.step1FindSitemap(userInput, env);
      return new Response(JSON.stringify({
        runId: result.runId,
        urls: result.urls,
        foundSitemap: result.foundSitemap,
        message: result.foundSitemap ? `Sitemap found: ${result.urls.length} URLs` : `No sitemap found. ${result.urls.length} URLs extracted from homepage`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error in handleStep1:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to start analysis",
          message: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  async handleStep3(request, env, corsHeaders) {
    const body = await request.json();
    const { runId, content, language } = body;
    const categories = await this.workflowEngine.step3GenerateCategories(
      runId,
      content,
      language || "de",
      env
    );
    return new Response(JSON.stringify({ categories }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  async handleSaveCategories(runId, request, env, corsHeaders) {
    const body = await request.json();
    const { selectedCategoryIds, customCategories } = body;
    await this.workflowEngine.saveSelectedCategories(
      runId,
      selectedCategoryIds || [],
      customCategories || [],
      env
    );
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  async handleStep4(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { runId, categories, userInput, questionsPerCategory, companyId } = body;
      if (!runId) {
        return new Response(
          JSON.stringify({ error: "runId is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      if (!categories || categories.length === 0) {
        return new Response(
          JSON.stringify({ error: "categories are required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      const prompts = await this.workflowEngine.step4GeneratePrompts(
        runId,
        categories,
        userInput || { websiteUrl: "", country: "", language: "de" },
        body.content || "",
        env,
        questionsPerCategory || 3,
        companyId
      );
      return new Response(JSON.stringify({ prompts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error in handleStep4:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to generate prompts",
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : void 0
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  async handleStep5(request, env, corsHeaders) {
    const body = await request.json();
    const { runId, prompts: promptsFromBody } = body;
    try {
      const result = await this.workflowEngine.step5ExecutePrompts(
        runId,
        promptsFromBody || [],
        env
      );
      const config = getConfig(env);
      const db = new Database(env.geo_db);
      const runInfo = await db.retryD1Operation(async () => {
        return await db.db.prepare("SELECT website_url FROM analysis_runs WHERE id = ?").bind(runId).first();
      }, 3, 200, "getRunInfoForStep5");
      if (!runInfo) {
        throw new Error("Analysis run not found");
      }
      const brandName = extractBrandName(runInfo.website_url);
      const analysisEngine = new AnalysisEngine(brandName, config.analysis.brandFuzzyThreshold);
      console.log(`[D1 DEBUG] Loading prompts for runId: ${runId}`);
      const startPrompts = Date.now();
      const savedPrompts = await db.retryD1Operation(async () => {
        return await db.db.prepare("SELECT * FROM prompts WHERE analysis_run_id = ?").bind(runId).all();
      }, 3, 200, "loadPromptsForStep5");
      console.log(`[D1 DEBUG] Loaded ${savedPrompts.results?.length || 0} prompts in ${Date.now() - startPrompts}ms`);
      console.log(`[D1 DEBUG] Loading responses with citations for runId: ${runId}`);
      const startResponses = Date.now();
      let savedResponses;
      try {
        savedResponses = await db.retryD1Operation(async () => {
          return await db.db.prepare(`
              SELECT lr.*, 
                     GROUP_CONCAT(c.url || '|' || COALESCE(c.title, '') || '|' || COALESCE(c.snippet, ''), '|||') as citations_data
              FROM llm_responses lr
              INNER JOIN prompts p ON lr.prompt_id = p.id
              LEFT JOIN citations c ON c.llm_response_id = lr.id
              WHERE p.analysis_run_id = ?
              GROUP BY lr.id
            `).bind(runId).all();
        }, 3, 200, "loadResponsesWithCitations");
        console.log(`[D1 DEBUG] Loaded ${savedResponses.results?.length || 0} responses in ${Date.now() - startResponses}ms`);
      } catch (error) {
        console.error(`[D1 ERROR] Failed to load responses with GROUP_CONCAT, trying alternative approach:`, error.message);
        const responsesOnly = await db.retryD1Operation(async () => {
          return await db.db.prepare(`
              SELECT lr.*
              FROM llm_responses lr
              INNER JOIN prompts p ON lr.prompt_id = p.id
              WHERE p.analysis_run_id = ?
            `).bind(runId).all();
        }, 3, 200, "loadResponsesOnly");
        const responseIds = (responsesOnly.results || []).map((r) => r.id);
        const citationsMap = /* @__PURE__ */ new Map();
        if (responseIds.length > 0) {
          const chunkSize = 50;
          for (let i = 0; i < responseIds.length; i += chunkSize) {
            const chunk = responseIds.slice(i, i + chunkSize);
            const citations = await db.retryD1Operation(async () => {
              return await db.db.prepare(`SELECT * FROM citations WHERE llm_response_id IN (${chunk.map(() => "?").join(",")})`).bind(...chunk).all();
            }, 3, 200, `loadCitationsChunk_${i}`);
            (citations.results || []).forEach((cite) => {
              if (!citationsMap.has(cite.llm_response_id)) {
                citationsMap.set(cite.llm_response_id, []);
              }
              citationsMap.get(cite.llm_response_id).push(cite);
            });
          }
        }
        savedResponses = {
          results: (responsesOnly.results || []).map((r) => ({
            ...r,
            citations_data: (citationsMap.get(r.id) || []).map(
              (c) => `${c.url}|${c.title || ""}|${c.snippet || ""}`
            ).join("|||")
          }))
        };
        console.log(`[D1 DEBUG] Loaded ${savedResponses.results?.length || 0} responses (fallback method) in ${Date.now() - startResponses}ms`);
      }
      const responsesWithCitations = (savedResponses.results || []).map((r) => {
        const citations = r.citations_data ? r.citations_data.split("|||").map((c) => {
          const [url, title, snippet] = c.split("|");
          return { url, title: title || "", snippet: snippet || "" };
        }) : [];
        return {
          ...r,
          citations
        };
      });
      const promptsArray = savedPrompts.results || [];
      const analyses = analysisEngine.analyzeResponses(
        promptsArray,
        responsesWithCitations
      );
      await db.savePromptAnalyses(analyses);
      console.log(`[D1 DEBUG] Calculating category metrics for runId: ${runId}`);
      const startMetrics = Date.now();
      let categoryMetrics;
      try {
        categoryMetrics = await db.retryD1Operation(async () => {
          return await db.db.prepare(`
              SELECT p.category_id, 
                     COUNT(*) as prompt_count,
                     SUM(CASE WHEN pa.brand_mentions_exact + pa.brand_mentions_fuzzy > 0 THEN 1 ELSE 0 END) as mentions_count
              FROM prompt_analyses pa
              INNER JOIN prompts p ON pa.prompt_id = p.id
              WHERE p.analysis_run_id = ?
              GROUP BY p.category_id
            `).bind(runId).all();
        }, 3, 200, "calculateCategoryMetrics");
        console.log(`[D1 DEBUG] Category metrics calculated in ${Date.now() - startMetrics}ms`);
      } catch (error) {
        console.error(`[D1 ERROR] Failed to calculate category metrics:`, error.message);
        categoryMetrics = { results: [] };
      }
      const competitiveAnalysis = { results: [] };
      console.log(`[D1 DEBUG] Calculating time series for runId: ${runId}`);
      const startTS = Date.now();
      let timeSeries;
      try {
        timeSeries = await db.retryD1Operation(async () => {
          return await db.db.prepare(`
              SELECT DATE(lr.timestamp) as date, COUNT(*) as count
              FROM llm_responses lr
              INNER JOIN prompts p ON lr.prompt_id = p.id
              WHERE p.analysis_run_id = ?
              GROUP BY DATE(lr.timestamp)
              ORDER BY date
            `).bind(runId).all();
        }, 3, 200, "calculateTimeSeries");
        console.log(`[D1 DEBUG] Time series calculated in ${Date.now() - startTS}ms`);
      } catch (error) {
        console.error(`[D1 ERROR] Failed to calculate time series:`, error.message);
        timeSeries = { results: [] };
      }
      await db.updateAnalysisStatus(runId, "completed", {
        step: "completed",
        progress: 100,
        message: "Analysis completed"
      });
      console.log(`[D1 DEBUG] Generating summary for runId: ${runId}`);
      try {
        const summaryRunInfo = await db.db.prepare("SELECT website_url FROM analysis_runs WHERE id = ?").bind(runId).first();
        if (summaryRunInfo) {
          const summaryBrandName = extractBrandName(summaryRunInfo.website_url);
          const summaryBrandLower = summaryBrandName.toLowerCase();
          const brandInUrl = summaryBrandLower.replace(/\s+/g, "");
          const prompts = await db.getPromptsForAnalysis(runId);
          const totalMentions = prompts.reduce((sum, prompt) => sum + (prompt.mentions || 0), 0);
          const totalCitations = prompts.reduce((sum, prompt) => sum + (prompt.citations || 0), 0);
          const bestPrompts = prompts.map((prompt) => ({
            question: prompt.question,
            mentions: prompt.mentions || 0,
            citations: prompt.citations || 0
          })).sort((a, b) => b.mentions + b.citations - (a.mentions + a.citations)).slice(0, 10);
          let ownCompanyDomain = "";
          try {
            const websiteUrlObj = new URL(summaryRunInfo.website_url);
            ownCompanyDomain = websiteUrlObj.hostname.replace("www.", "").toLowerCase();
          } catch {
            ownCompanyDomain = brandInUrl;
          }
          const isOwnCompany = /* @__PURE__ */ __name((domain) => {
            const domainLower = domain.toLowerCase();
            return domainLower.includes(ownCompanyDomain) || domainLower.includes(summaryBrandLower);
          }, "isOwnCompany");
          const allCitationsResult = await db.retryD1Operation(async () => {
            return await db.db.prepare(`
                SELECT DISTINCT c.url, c.title, c.snippet
                FROM citations c
                INNER JOIN llm_responses lr ON c.llm_response_id = lr.id
                INNER JOIN prompts p ON lr.prompt_id = p.id
                WHERE p.analysis_run_id = ?
              `).bind(runId).all();
          }, 3, 200, "getAllCitationsForSummary");
          const otherSources = {};
          (allCitationsResult.results || []).forEach((citation) => {
            try {
              const urlObj = new URL(citation.url);
              const domain = urlObj.hostname.replace("www.", "").toLowerCase();
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
            otherSources
          };
          await db.saveSummary(runId, summary);
          console.log(`[D1 DEBUG] Summary generated and saved for runId: ${runId}`);
        }
      } catch (error) {
        console.error(`[D1 ERROR] Failed to generate summary automatically:`, error);
      }
      return new Response(JSON.stringify({
        success: true,
        runId,
        result: {
          categoryMetrics: categoryMetrics.results || [],
          competitiveAnalysis: competitiveAnalysis.results || [],
          timeSeries: timeSeries.results || []
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error in handleStep5:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to execute prompts",
          message: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  async handleFetchUrl(request, env, corsHeaders) {
    const body = await request.json();
    const { url } = body;
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "GEO-Platform/1.0" },
        signal: AbortSignal.timeout(1e4)
      });
      if (response.ok) {
        const html = await response.text();
        let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
        text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
        text = text.replace(/<[^>]+>/g, " ");
        text = text.replace(/\s+/g, " ").trim();
        return new Response(JSON.stringify({ content: text, text }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({ content: null, error: "Failed to fetch" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  async handleGenerateSummary(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { runId } = body;
      const db = new Database(env.geo_db);
      const runInfo = await db.retryD1Operation(async () => {
        return await db.db.prepare("SELECT website_url FROM analysis_runs WHERE id = ?").bind(runId).first();
      }, 3, 200, "getRunInfoForSummary");
      if (!runInfo) {
        throw new Error("Analysis run not found");
      }
      const brandName = extractBrandName(runInfo.website_url);
      const brandLower = brandName.toLowerCase();
      const brandInUrl = brandLower.replace(/\s+/g, "");
      const prompts = await db.getPromptsForAnalysis(runId);
      const totalMentions = prompts.reduce((sum, prompt) => sum + (prompt.mentions || 0), 0);
      const allCitationsResult = await db.retryD1Operation(async () => {
        return await db.db.prepare(`
            SELECT 
              c.url,
              c.title,
              c.snippet
            FROM citations c
            WHERE c.llm_response_id IN (
              SELECT id FROM llm_responses 
              WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?)
            )
          `).bind(runId).all();
      }, 3, 200, "getCitationsForSummary");
      const brandCitations = (allCitationsResult.results || []).filter((citation) => {
        const citationText = `${citation.title || ""} ${citation.snippet || ""}`.toLowerCase();
        const urlLower = citation.url.toLowerCase();
        const mentionedInText = citationText.includes(brandLower);
        const mentionedInUrl = urlLower.includes(brandInUrl);
        return mentionedInText || mentionedInUrl;
      });
      const totalCitations = brandCitations.length;
      const bestPrompts = prompts.map((prompt) => ({
        question: prompt.question,
        mentions: prompt.mentions || 0,
        citations: prompt.citations || 0
      })).sort((a, b) => b.mentions + b.citations - (a.mentions + a.citations)).slice(0, 10);
      let ownCompanyDomain = "";
      let ownCompanyBrandName = brandLower.replace(/\s+/g, "");
      try {
        const websiteUrlObj = new URL(runInfo.website_url);
        ownCompanyDomain = websiteUrlObj.hostname.replace("www.", "").toLowerCase();
        const domainParts = ownCompanyDomain.split(".");
        if (domainParts.length > 0) {
          ownCompanyBrandName = domainParts[0];
        }
      } catch {
        ownCompanyDomain = ownCompanyBrandName;
      }
      const isOwnCompany = /* @__PURE__ */ __name((domain) => {
        const domainLower = domain.toLowerCase();
        if (domainLower === ownCompanyDomain)
          return true;
        if (domainLower.startsWith(ownCompanyBrandName + ".") || domainLower === ownCompanyBrandName) {
          return true;
        }
        const domainWithoutTld = domainLower.split(".")[0];
        if (domainWithoutTld === ownCompanyBrandName)
          return true;
        return false;
      }, "isOwnCompany");
      const otherSources = {};
      const domainUrlMap = /* @__PURE__ */ new Map();
      (allCitationsResult.results || []).forEach((citation) => {
        try {
          const urlObj = new URL(citation.url);
          let domain = urlObj.hostname.replace(/^www\./, "").toLowerCase().replace(/\.$/, "");
          if (!isOwnCompany(domain)) {
            if (!domainUrlMap.has(domain)) {
              domainUrlMap.set(domain, /* @__PURE__ */ new Set());
            }
            const normalizedUrl = urlObj.origin + urlObj.pathname;
            domainUrlMap.get(domain).add(normalizedUrl);
          }
        } catch {
          try {
            const domainMatch = citation.url.match(/https?:\/\/(?:www\.)?([^\/\?]+)/i);
            if (domainMatch && domainMatch[1]) {
              let domain = domainMatch[1].replace(/^www\./, "").toLowerCase().replace(/\.$/, "");
              if (!isOwnCompany(domain)) {
                if (!domainUrlMap.has(domain)) {
                  domainUrlMap.set(domain, /* @__PURE__ */ new Set());
                }
                domainUrlMap.get(domain).add(citation.url);
              }
            }
          } catch {
          }
        }
      });
      domainUrlMap.forEach((urlSet, domain) => {
        otherSources[domain] = urlSet.size;
      });
      const summary = {
        totalMentions,
        totalCitations,
        bestPrompts,
        otherSources
      };
      await db.saveSummary(runId, summary);
      return new Response(
        JSON.stringify(summary),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Error in handleGenerateSummary:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to generate summary",
          message: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  async handleAIReadiness(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const baseUrl = body.url?.trim();
      if (!baseUrl) {
        return new Response(
          JSON.stringify({ error: "URL is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      let normalizedUrl = baseUrl;
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = "https://" + normalizedUrl;
      }
      const protocol = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        baseUrl: normalizedUrl,
        robotsTxt: {
          found: false
        },
        sitemap: {
          found: false,
          urls: []
        },
        pages: []
      };
      try {
        const robotsUrl = new URL("/robots.txt", normalizedUrl).toString();
        const robotsResponse = await fetch(robotsUrl, {
          headers: { "User-Agent": "GEO-Platform/1.0" },
          signal: AbortSignal.timeout(1e4)
        });
        if (robotsResponse.ok) {
          const robotsContent = await robotsResponse.text();
          protocol.robotsTxt = {
            found: true,
            content: robotsContent
          };
        } else {
          protocol.robotsTxt = { found: false };
        }
      } catch (error) {
        protocol.robotsTxt = { found: false };
      }
      const sitemapResult = await fetchSitemap(normalizedUrl);
      protocol.sitemap = {
        found: sitemapResult.found,
        content: sitemapResult.content,
        urls: sitemapResult.urls
      };
      let urlsToFetch = [];
      if (sitemapResult.found && sitemapResult.urls.length > 0) {
        if (sitemapResult.urls.some((url) => url.includes("sitemap"))) {
          const allUrls = [];
          for (const sitemapUrl of sitemapResult.urls.slice(0, 10)) {
            try {
              const response = await fetch(sitemapUrl, {
                headers: { "User-Agent": "GEO-Platform/1.0" },
                signal: AbortSignal.timeout(1e4)
              });
              if (response.ok) {
                const content = await response.text();
                const parsedUrls = parseSitemap(content);
                allUrls.push(...parsedUrls);
              }
            } catch (error) {
              continue;
            }
          }
          urlsToFetch = allUrls;
        } else {
          urlsToFetch = sitemapResult.urls;
        }
      } else {
        try {
          const response = await fetch(normalizedUrl, {
            headers: { "User-Agent": "GEO-Platform/1.0" },
            signal: AbortSignal.timeout(1e4)
          });
          if (response.ok) {
            const html = await response.text();
            const links = extractLinksFromHtml(html, normalizedUrl);
            urlsToFetch = links.slice(0, 50);
          }
        } catch (error) {
        }
      }
      if (!urlsToFetch.includes(normalizedUrl)) {
        urlsToFetch.unshift(normalizedUrl);
      }
      urlsToFetch = urlsToFetch.filter((url) => shouldFetchUrl(url));
      urlsToFetch = deduplicateUrls(urlsToFetch);
      urlsToFetch = urlsToFetch.slice(0, 50);
      for (const url of urlsToFetch) {
        const startTime = Date.now();
        try {
          const response = await fetch(url, {
            headers: { "User-Agent": "GEO-Platform/1.0" },
            signal: AbortSignal.timeout(15e3)
          });
          const fetchTime = Date.now() - startTime;
          const contentType = response.headers.get("content-type") || "";
          if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
            protocol.pages.push({
              url,
              fetchTime,
              content: "",
              success: false,
              error: `Nicht-HTML Content-Type: ${contentType}`
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
              success: true
            });
          } else {
            protocol.pages.push({
              url,
              fetchTime,
              content: "",
              success: false,
              error: `HTTP ${response.status}: ${response.statusText}`
            });
          }
        } catch (error) {
          const fetchTime = Date.now() - startTime;
          protocol.pages.push({
            url,
            fetchTime,
            content: "",
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      let protocolText = this.formatProtocol(protocol);
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
          const prompt = {
            id: "ai-readiness-analysis",
            categoryId: "ai-readiness",
            question: analysisPromptText,
            language: "en",
            intent: "high",
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          const analysisResult = await llmExecutor.executePrompt(prompt);
          try {
            const jsonMatch = analysisResult.outputText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              protocol.analysis = JSON.parse(jsonMatch[0]);
            } else {
              protocol.analysis = {
                summary: analysisResult.outputText,
                recommendations: analysisResult.outputText.split("\n").filter((line) => line.trim().startsWith("-") || line.trim().startsWith("\u2022"))
              };
            }
          } catch (parseError) {
            protocol.analysis = {
              summary: analysisResult.outputText,
              recommendations: []
            };
          }
          protocolText = this.formatProtocol(protocol);
        } catch (error) {
          console.error("Error calling GPT API:", error);
        }
      }
      return new Response(
        JSON.stringify({
          success: true,
          protocol,
          protocolText
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Error in handleAIReadiness:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to analyze AI readiness",
          message: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  formatProtocol(protocol) {
    let text = `\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
PROTOCOL
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

Timestamp: ${protocol.timestamp}
Website: ${protocol.baseUrl}

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
ROBOTS.TXT ANALYSIS
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
`;
    if (protocol.robotsTxt.found) {
      text += `\u2713 robots.txt found
`;
      text += `
Content:
${protocol.robotsTxt.content}
`;
    } else {
      text += `\u2717 No robots.txt found
`;
    }
    text += `
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
SITEMAP ANALYSIS
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
`;
    if (protocol.sitemap.found) {
      text += `\u2713 Sitemap found
`;
      text += `Number of URLs in Sitemap: ${protocol.sitemap.urls.length}
`;
      if (protocol.sitemap.content) {
        text += `
Sitemap Content (first 1000 characters):
${protocol.sitemap.content.substring(0, 1e3)}
`;
      }
    } else {
      text += `\u2717 No sitemap found
`;
      text += `Links were extracted from the landing page
`;
    }
    text += `
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
PAGES ANALYSIS
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
Number of Pages: ${protocol.pages.length}
Successful: ${protocol.pages.filter((p) => p.success).length}
Failed: ${protocol.pages.filter((p) => !p.success).length}

Average Load Time: ${Math.round(
      protocol.pages.reduce((sum, p) => sum + p.fetchTime, 0) / protocol.pages.length
    )}ms

`;
    protocol.pages.forEach((page, index) => {
      text += `
[${index + 1}] ${page.url}
`;
      text += `   Status: ${page.success ? "\u2713 Successful" : "\u2717 Error"}
`;
      text += `   Load Time: ${page.fetchTime}ms
`;
      if (page.error) {
        text += `   Error: ${page.error}
`;
      }
      text += `   Content (first 3000 characters):
   ${page.content.substring(0, 3e3).replace(/\n/g, " ")}${page.content.length > 3e3 ? "..." : ""}
`;
    });
    text += `
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
`;
    return text;
  }
};
__name(WorkflowHandlers, "WorkflowHandlers");

// src/api/handlers/analysis.ts
init_modules_watch_stub();
var AnalysisHandlers = class {
  constructor() {
  }
  async handleGetAllAnalyses(request, env, corsHeaders) {
    try {
      const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
      const db = new Database2(env.geo_db);
      const analyses = await db.getAllAnalysisRuns(100);
      const analysesArray = Array.isArray(analyses) ? analyses : [];
      return new Response(JSON.stringify(analysesArray), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error getting all analyses:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  async handleGetAllCompanies(request, env, corsHeaders) {
    try {
      const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
      const db = new Database2(env.geo_db);
      const companies = await db.getAllCompanies();
      return new Response(JSON.stringify(companies), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error getting all companies:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  async handleGetCompanyAnalyses(companyId, env, corsHeaders) {
    try {
      const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
      const db = new Database2(env.geo_db);
      const analyses = await db.getCompanyAnalysisRuns(companyId, 100);
      return new Response(JSON.stringify(analyses), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error getting company analyses:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  async handleGetGlobalCategories(request, env, corsHeaders) {
    try {
      const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
      const db = new Database2(env.geo_db);
      const categories = await db.getAllGlobalCategories();
      return new Response(JSON.stringify(categories || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error getting global categories:", error);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
  async handleGetGlobalPromptsByCategory(categoryName, env, corsHeaders) {
    try {
      const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
      const db = new Database2(env.geo_db);
      const prompts = await db.getGlobalPromptsByCategory(categoryName);
      return new Response(JSON.stringify(prompts), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error getting global prompts by category:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  async handleDeleteAnalysis(runId, env, corsHeaders) {
    try {
      const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
      const db = new Database2(env.geo_db);
      await db.deleteAnalysis(runId);
      return new Response(
        JSON.stringify({ success: true, message: "Analysis deleted" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Error deleting analysis:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  async handleGetAnalysisPromptsAndSummary(runId, env, corsHeaders) {
    try {
      const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
      const db = new Database2(env.geo_db);
      const prompts = await db.getPromptsForAnalysis(runId);
      const summary = await db.getSummary(runId);
      return new Response(JSON.stringify({
        prompts,
        summary
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error getting analysis prompts and summary:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
};
__name(AnalysisHandlers, "AnalysisHandlers");

// ../shared/engine_workflow.ts
init_modules_watch_stub();

// ../shared/ingestion/sitemap.ts
init_modules_watch_stub();
var SitemapParser = class {
  async findAndParseSitemap(baseUrl) {
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemaps/sitemap.xml`
    ];
    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await fetch(sitemapUrl, {
          headers: {
            "User-Agent": "GEO-Platform/1.0"
          },
          signal: AbortSignal.timeout(1e4)
          // 10 second timeout
        });
        if (response.ok) {
          const xml = await response.text();
          const urls2 = this.parseSitemap(xml);
          if (urls2.length > 0) {
            return { urls: urls2, foundSitemap: true };
          }
        }
      } catch (error) {
        continue;
      }
    }
    console.log("\u26A0\uFE0F Keine Sitemap gefunden. Crawle Startseite und extrahiere interne Links...");
    const urls = await this.crawlHomepageForLinks(baseUrl);
    return { urls, foundSitemap: false };
  }
  async crawlHomepageForLinks(baseUrl) {
    const urls = [];
    const baseUrlObj = new URL(baseUrl);
    const visited = /* @__PURE__ */ new Set();
    try {
      const response = await fetch(baseUrl, {
        headers: {
          "User-Agent": "GEO-Platform/1.0"
        },
        signal: AbortSignal.timeout(1e4)
        // 10 second timeout
      });
      if (!response.ok) {
        console.error("Failed to fetch homepage:", response.status);
        return [baseUrl];
      }
      const html = await response.text();
      urls.push(baseUrl);
      visited.add(baseUrl);
      const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
      let match;
      const foundLinks = /* @__PURE__ */ new Set();
      while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1].trim();
        if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) {
          continue;
        }
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          const urlObj = new URL(absoluteUrl);
          if (urlObj.hostname === baseUrlObj.hostname || urlObj.hostname === `www.${baseUrlObj.hostname}` || baseUrlObj.hostname === `www.${urlObj.hostname}`) {
            const normalizedUrl = urlObj.origin + urlObj.pathname + (urlObj.search || "");
            if (!visited.has(normalizedUrl) && !normalizedUrl.endsWith(".pdf") && !normalizedUrl.endsWith(".jpg") && !normalizedUrl.endsWith(".png") && !normalizedUrl.endsWith(".gif") && !normalizedUrl.endsWith(".zip")) {
              foundLinks.add(normalizedUrl);
            }
          }
        } catch (e) {
          continue;
        }
      }
      const linkArray = Array.from(foundLinks);
      const maxLinks = 50;
      urls.push(...linkArray.slice(0, maxLinks));
      console.log(`\u2705 ${urls.length} URLs von Startseite extrahiert (${foundLinks.size} interne Links gefunden)`);
      return urls;
    } catch (error) {
      console.error("Error crawling homepage:", error);
      return [baseUrl];
    }
  }
  parseSitemap(xml) {
    const urls = [];
    const urlRegex = /<loc>(.*?)<\/loc>/gi;
    let match;
    while ((match = urlRegex.exec(xml)) !== null) {
      const url = match[1].trim();
      if (url) {
        urls.push(url);
      }
    }
    const sitemapIndexRegex = /<sitemap><loc>(.*?)<\/loc><\/sitemap>/gi;
    while ((match = sitemapIndexRegex.exec(xml)) !== null) {
      const sitemapUrl = match[1].trim();
      console.log("Found sitemap index:", sitemapUrl);
    }
    return urls;
  }
  async parseSitemapFromUrl(sitemapUrl) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: {
          "User-Agent": "GEO-Platform/1.0"
        },
        signal: AbortSignal.timeout(1e4)
        // 10 second timeout
      });
      if (!response.ok) {
        return [];
      }
      const xml = await response.text();
      return this.parseSitemap(xml);
    } catch (error) {
      console.error("Error parsing sitemap:", error);
      return [];
    }
  }
};
__name(SitemapParser, "SitemapParser");

// ../shared/ingestion/index.ts
init_modules_watch_stub();

// ../shared/ingestion/crawler.ts
init_modules_watch_stub();
var WebsiteCrawler = class {
  constructor(options) {
    this.options = options;
  }
  visitedUrls = /* @__PURE__ */ new Set();
  pages = [];
  baseUrl;
  async crawl(baseUrl) {
    this.baseUrl = new URL(baseUrl);
    this.visitedUrls.clear();
    this.pages = [];
    await this.crawlPage(baseUrl, 0);
    return this.pages;
  }
  async crawlPage(url, depth) {
    if (depth > this.options.maxDepth)
      return;
    if (this.pages.length >= this.options.maxPages)
      return;
    const normalizedUrl = this.normalizeUrl(url);
    if (this.visitedUrls.has(normalizedUrl))
      return;
    this.visitedUrls.add(normalizedUrl);
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": this.options.userAgent
        },
        signal: AbortSignal.timeout(this.options.timeout)
      });
      if (!response.ok)
        return;
      const html = await response.text();
      const page = await this.parsePage(url, html);
      if (page) {
        this.pages.push(page);
        if (depth < this.options.maxDepth) {
          const links = this.extractLinks(html, url);
          for (const link of links) {
            if (this.pages.length >= this.options.maxPages)
              break;
            await this.crawlPage(link, depth + 1);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error);
    }
  }
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }
  extractLinks(html, baseUrl) {
    const links = [];
    const base = new URL(baseUrl);
    const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      try {
        const href = match[1];
        const absoluteUrl = new URL(href, base).href;
        if (new URL(absoluteUrl).hostname === base.hostname) {
          links.push(absoluteUrl);
        }
      } catch {
      }
    }
    return [...new Set(links)];
  }
  async parsePage(url, html) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? this.cleanText(titleMatch[1]) : "";
    const headings = [];
    const headingRegex = /<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi;
    let headingMatch;
    while ((headingMatch = headingRegex.exec(html)) !== null) {
      headings.push(this.cleanText(headingMatch[2]));
    }
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;
    const textContent = this.extractTextContent(bodyContent);
    const topics = this.extractTopics(textContent);
    const entities = this.extractEntities(textContent);
    return {
      url,
      title,
      headings,
      content: textContent,
      topics,
      entities,
      language: this.options.language || "en"
    };
  }
  cleanText(text) {
    return text.replace(/\s+/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
  }
  extractTextContent(html) {
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<[^>]+>/g, " ");
    return this.cleanText(text);
  }
  extractTopics(text) {
    const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const wordFreq = /* @__PURE__ */ new Map();
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
    return Array.from(wordFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word]) => word);
  }
  extractEntities(text) {
    const entityRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    const entities = /* @__PURE__ */ new Set();
    let match;
    while ((match = entityRegex.exec(text)) !== null) {
      const entity = match[1];
      if (entity.length > 3 && entity.length < 50) {
        entities.add(entity);
      }
    }
    return Array.from(entities).slice(0, 20);
  }
};
__name(WebsiteCrawler, "WebsiteCrawler");

// ../shared/ingestion/scraper.ts
init_modules_watch_stub();
var ContentScraper = class {
  constructor(config) {
    this.config = config;
  }
  async scrapeWebsite(websiteUrl, language) {
    const crawler = new WebsiteCrawler({
      ...this.config,
      language
    });
    const pages = await crawler.crawl(websiteUrl);
    const normalizedContent = this.normalizeContent(pages, language);
    return {
      rootDomain: new URL(websiteUrl).hostname,
      pages,
      normalizedContent,
      language
    };
  }
  normalizeContent(pages, language) {
    const allText = pages.map((page) => {
      const parts = [
        page.title,
        ...page.headings,
        page.content,
        ...page.topics
      ];
      return parts.join(" ");
    }).join("\n\n");
    return this.normalizeText(allText, language);
  }
  normalizeText(text, language) {
    let normalized = text.replace(/\s+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    if (language === "de") {
      normalized = normalized.replace(/ß/g, "ss");
    }
    return normalized;
  }
};
__name(ContentScraper, "ContentScraper");

// ../shared/categorization/index.ts
init_modules_watch_stub();
var CategoryGenerator = class {
  categoryTemplates = [
    {
      name: "Product",
      keywords: ["product", "feature", "solution", "offering", "service"],
      description: "Product features and capabilities"
    },
    {
      name: "Pricing",
      keywords: ["price", "cost", "pricing", "plan", "subscription", "fee"],
      description: "Pricing information and plans"
    },
    {
      name: "Comparison",
      keywords: ["compare", "vs", "versus", "alternative", "competitor"],
      description: "Comparisons with alternatives"
    },
    {
      name: "Use Cases",
      keywords: ["use case", "example", "scenario", "application", "how to"],
      description: "Use cases and applications"
    },
    {
      name: "Industry",
      keywords: ["industry", "sector", "vertical", "market", "domain"],
      description: "Industry-specific information"
    },
    {
      name: "Problems / Solutions",
      keywords: ["problem", "solution", "challenge", "issue", "solve"],
      description: "Problems addressed and solutions provided"
    },
    {
      name: "Integration",
      keywords: ["integrate", "api", "connection", "compatible", "works with"],
      description: "Integration capabilities"
    },
    {
      name: "Support",
      keywords: ["support", "help", "documentation", "guide", "tutorial"],
      description: "Support and documentation"
    }
  ];
  generateCategories(content, minConfidence = 0.5, maxCategories = 10) {
    const categories = [];
    const contentText = content.normalizedContent.toLowerCase();
    const allPages = content.pages.map((p) => p.url);
    for (const template of this.categoryTemplates) {
      const confidence = this.calculateCategoryConfidence(
        template,
        contentText,
        content.pages
      );
      if (confidence >= minConfidence) {
        const sourcePages = this.findRelevantPages(template, content.pages);
        categories.push({
          id: this.generateCategoryId(template.name),
          name: template.name,
          description: template.description,
          confidence,
          sourcePages: sourcePages.map((p) => p.url)
        });
      }
    }
    return categories.sort((a, b) => b.confidence - a.confidence).slice(0, maxCategories);
  }
  calculateCategoryConfidence(template, contentText, pages) {
    let keywordMatches = 0;
    let totalKeywords = template.keywords.length;
    for (const keyword of template.keywords) {
      if (contentText.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    }
    let confidence = keywordMatches / totalKeywords;
    const pagesWithKeywords = pages.filter((page) => {
      const pageText = page.content.toLowerCase();
      return template.keywords.some((kw) => pageText.includes(kw.toLowerCase()));
    }).length;
    if (pages.length > 0) {
      confidence += pagesWithKeywords / pages.length * 0.3;
    }
    return Math.min(confidence, 1);
  }
  findRelevantPages(template, pages) {
    return pages.filter((page) => {
      const pageText = (page.title + " " + page.headings.join(" ") + " " + page.content).toLowerCase();
      return template.keywords.some(
        (kw) => pageText.includes(kw.toLowerCase())
      );
    });
  }
  generateCategoryId(name) {
    return `cat_${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
  }
};
__name(CategoryGenerator, "CategoryGenerator");

// ../shared/prompt_generation/index.ts
init_modules_watch_stub();
var PromptGenerator = class {
  generatePrompts(categories, userInput, questionsPerCategory = 5) {
    const prompts = [];
    for (const category of categories) {
      const categoryPrompts = this.generateCategoryPrompts(
        category,
        userInput,
        questionsPerCategory
      );
      prompts.push(...categoryPrompts);
    }
    return prompts;
  }
  generateCategoryPrompts(category, userInput, count) {
    const prompts = [];
    const templates = this.getPromptTemplates(category.name, userInput.language);
    for (let i = 0; i < count && i < templates.length; i++) {
      const template = templates[i];
      const question = this.fillTemplate(template, userInput, category);
      prompts.push({
        id: this.generatePromptId(category.id, i),
        categoryId: category.id,
        question,
        language: userInput.language,
        country: userInput.country,
        region: userInput.region,
        intent: this.determineIntent(template),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    return prompts;
  }
  getPromptTemplates(categoryName, language) {
    const templates = {
      en: {
        Product: [
          "What are the key features of {product} in {country}?",
          "How does {product} work for businesses in {region}?",
          "What makes {product} different from other solutions?",
          "What are the main capabilities of {product}?",
          "How do companies in {country} use {product}?"
        ],
        Pricing: [
          "How much does {product} cost in {country}?",
          "What are the pricing plans for {product}?",
          "Is {product} affordable for small businesses in {region}?",
          "What is the pricing structure for {product}?",
          "Are there any discounts available for {product} in {country}?"
        ],
        Comparison: [
          "How does {product} compare to alternatives in {country}?",
          "What are the best alternatives to {product}?",
          "Should I choose {product} or {competitor}?",
          "How does {product} stack up against competitors?",
          "What are the pros and cons of {product} vs alternatives?"
        ],
        "Use Cases": [
          "What are common use cases for {product} in {region}?",
          "How do companies in {country} use {product}?",
          "What problems does {product} solve?",
          "When should I use {product}?",
          "What industries benefit from {product}?"
        ],
        Industry: [
          "What companies in {country} use {product}?",
          "Is {product} suitable for {industry} in {region}?",
          "What industries does {product} serve?",
          "How is {product} used in {industry}?",
          "What are the main use cases for {product} in {industry}?"
        ],
        "Problems / Solutions": [
          "What problems does {product} solve in {country}?",
          "How does {product} address common challenges?",
          "What issues can {product} help with?",
          "What solutions does {product} provide?",
          "How does {product} solve business problems?"
        ],
        Integration: [
          "What integrations does {product} support?",
          "How do I integrate {product} with other tools?",
          "Is {product} compatible with {tool}?",
          "What APIs does {product} offer?",
          "How does {product} connect with existing systems?"
        ],
        Support: [
          "How do I get started with {product}?",
          "What documentation is available for {product}?",
          "How do I get support for {product} in {country}?",
          "What resources are available for {product} users?",
          "Where can I find help with {product}?"
        ]
      },
      de: {
        Product: [
          "Was sind die Hauptfunktionen von {product} in {country}?",
          "Wie funktioniert {product} f\xFCr Unternehmen in {region}?",
          "Was unterscheidet {product} von anderen L\xF6sungen?",
          "Welche Hauptfunktionen bietet {product}?",
          "Wie nutzen Unternehmen in {country} {product}?"
        ],
        Pricing: [
          "Wie viel kostet {product} in {country}?",
          "Welche Preismodelle gibt es f\xFCr {product}?",
          "Ist {product} f\xFCr kleine Unternehmen in {region} erschwinglich?",
          "Wie ist die Preisstruktur von {product}?",
          "Gibt es Rabatte f\xFCr {product} in {country}?"
        ],
        Comparison: [
          "Wie schneidet {product} im Vergleich zu Alternativen in {country} ab?",
          "Was sind die besten Alternativen zu {product}?",
          "Sollte ich {product} oder {competitor} w\xE4hlen?",
          "Wie steht {product} im Vergleich zu Konkurrenten da?",
          "Was sind die Vor- und Nachteile von {product} vs Alternativen?"
        ],
        "Use Cases": [
          "Was sind h\xE4ufige Anwendungsf\xE4lle f\xFCr {product} in {region}?",
          "Wie nutzen Unternehmen in {country} {product}?",
          "Welche Probleme l\xF6st {product}?",
          "Wann sollte ich {product} verwenden?",
          "Welche Branchen profitieren von {product}?"
        ],
        Industry: [
          "Welche Unternehmen in {country} nutzen {product}?",
          "Ist {product} f\xFCr {industry} in {region} geeignet?",
          "Welche Branchen bedient {product}?",
          "Wie wird {product} in {industry} eingesetzt?",
          "Was sind die Hauptanwendungsf\xE4lle f\xFCr {product} in {industry}?"
        ],
        "Problems / Solutions": [
          "Welche Probleme l\xF6st {product} in {country}?",
          "Wie adressiert {product} h\xE4ufige Herausforderungen?",
          "Bei welchen Problemen kann {product} helfen?",
          "Welche L\xF6sungen bietet {product}?",
          "Wie l\xF6st {product} Gesch\xE4ftsprobleme?"
        ],
        Integration: [
          "Welche Integrationen unterst\xFCtzt {product}?",
          "Wie integriere ich {product} mit anderen Tools?",
          "Ist {product} kompatibel mit {tool}?",
          "Welche APIs bietet {product}?",
          "Wie verbindet sich {product} mit bestehenden Systemen?"
        ],
        Support: [
          "Wie beginne ich mit {product}?",
          "Welche Dokumentation ist f\xFCr {product} verf\xFCgbar?",
          "Wie erhalte ich Support f\xFCr {product} in {country}?",
          "Welche Ressourcen stehen {product}-Nutzern zur Verf\xFCgung?",
          "Wo finde ich Hilfe zu {product}?"
        ]
      },
      fr: {
        Product: [
          "Quelles sont les principales fonctionnalit\xE9s de {product} en {country}?",
          "Comment fonctionne {product} pour les entreprises en {region}?",
          "Qu'est-ce qui distingue {product} des autres solutions?",
          "Quelles sont les principales capacit\xE9s de {product}?",
          "Comment les entreprises en {country} utilisent-elles {product}?"
        ],
        Pricing: [
          "Combien co\xFBte {product} en {country}?",
          "Quels sont les plans tarifaires pour {product}?",
          "{product} est-il abordable pour les petites entreprises en {region}?",
          "Quelle est la structure tarifaire de {product}?",
          "Y a-t-il des remises disponibles pour {product} en {country}?"
        ],
        Comparison: [
          "Comment {product} se compare-t-il aux alternatives en {country}?",
          "Quelles sont les meilleures alternatives \xE0 {product}?",
          "Dois-je choisir {product} ou {competitor}?",
          "Comment {product} se compare-t-il aux concurrents?",
          "Quels sont les avantages et inconv\xE9nients de {product} vs alternatives?"
        ],
        "Use Cases": [
          "Quels sont les cas d'usage courants pour {product} en {region}?",
          "Comment les entreprises en {country} utilisent-elles {product}?",
          "Quels probl\xE8mes {product} r\xE9sout-il?",
          "Quand devrais-je utiliser {product}?",
          "Quelles industries b\xE9n\xE9ficient de {product}?"
        ],
        Industry: [
          "Quelles entreprises en {country} utilisent {product}?",
          "{product} est-il adapt\xE9 \xE0 {industry} en {region}?",
          "Quelles industries {product} sert-il?",
          "Comment {product} est-il utilis\xE9 dans {industry}?",
          "Quels sont les principaux cas d'usage pour {product} dans {industry}?"
        ],
        "Problems / Solutions": [
          "Quels probl\xE8mes {product} r\xE9sout-il en {country}?",
          "Comment {product} r\xE9pond-il aux d\xE9fis courants?",
          "\xC0 quels probl\xE8mes {product} peut-il aider?",
          "Quelles solutions {product} fournit-il?",
          "Comment {product} r\xE9sout-il les probl\xE8mes commerciaux?"
        ],
        Integration: [
          "Quelles int\xE9grations {product} prend-il en charge?",
          "Comment int\xE9grer {product} avec d'autres outils?",
          "{product} est-il compatible avec {tool}?",
          "Quelles API {product} offre-t-il?",
          "Comment {product} se connecte-t-il aux syst\xE8mes existants?"
        ],
        Support: [
          "Comment commencer avec {product}?",
          "Quelle documentation est disponible pour {product}?",
          "Comment obtenir du support pour {product} en {country}?",
          "Quelles ressources sont disponibles pour les utilisateurs de {product}?",
          "O\xF9 puis-je trouver de l'aide pour {product}?"
        ]
      }
    };
    const langTemplates = templates[language] || templates.en;
    return langTemplates[categoryName] || langTemplates.Product || [];
  }
  fillTemplate(template, userInput, category) {
    const productName = this.extractProductName(userInput.websiteUrl);
    return template.replace(/{product}/g, productName).replace(/{country}/g, userInput.country).replace(/{region}/g, userInput.region || userInput.country).replace(/{industry}/g, "the industry").replace(/{competitor}/g, "competitors").replace(/{tool}/g, "other tools");
  }
  extractProductName(websiteUrl) {
    try {
      const domain = new URL(websiteUrl).hostname;
      const parts = domain.split(".");
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch {
      return "the product";
    }
  }
  determineIntent(template) {
    if (/how|what|should|best|which|when/i.test(template) && /cost|price|compare|choose|recommend/i.test(template)) {
      return "high";
    }
    if (/is|are|does|can/i.test(template)) {
      return "medium";
    }
    return "low";
  }
  generatePromptId(categoryId, index) {
    return `prompt_${categoryId}_${index}_${Date.now()}`;
  }
};
__name(PromptGenerator, "PromptGenerator");

// ../shared/engine_workflow.ts
init_persistence();
var WorkflowEngine = class {
  config;
  contentScraper;
  categoryGenerator;
  promptGenerator;
  llmExecutor;
  sitemapParser;
  constructor(env) {
    this.config = getConfig(env);
    this.contentScraper = new ContentScraper(this.config.crawling);
    this.categoryGenerator = new CategoryGenerator();
    this.promptGenerator = new PromptGenerator();
    this.llmExecutor = new LLMExecutor(this.config);
    this.sitemapParser = new SitemapParser();
  }
  // Step 1: Find and parse sitemap
  async step1FindSitemap(userInput, env) {
    try {
      const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const db = new Database(env.geo_db);
      await db.saveAnalysisRun(runId, userInput, "running");
      const result = await this.sitemapParser.findAndParseSitemap(
        userInput.websiteUrl
      );
      await db.db.prepare(
        "UPDATE analysis_runs SET sitemap_urls = ?, step = ?, updated_at = ? WHERE id = ?"
      ).bind(JSON.stringify(result.urls), "content", (/* @__PURE__ */ new Date()).toISOString(), runId).run();
      return { runId, urls: result.urls, foundSitemap: result.foundSitemap };
    } catch (error) {
      console.error("Error in step1FindSitemap:", error);
      throw error;
    }
  }
  extractTextContent(html) {
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<[^>]+>/g, " ");
    return text.replace(/\s+/g, " ").trim();
  }
  // Step 3: Generate categories/keywords with GPT
  async step3GenerateCategories(runId, content, language, env) {
    const db = new Database(env.geo_db);
    const prompt = `Analyze the following website content and suggest 15-20 thematic categories/keywords that represent the main topics, products, or services. 
Return only a JSON object with a "categories" array of objects: {"categories": [{"name": "Category Name", "description": "Brief description", "keywords": ["keyword1", "keyword2"]}]}
Content (first 8000 chars): ${content.substring(0, 8e3)}
Language: ${language}
Return only valid JSON object with categories array, no other text.`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3e4);
      let response;
      try {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.openai.apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 2e3
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          throw new Error("OpenAI API request timed out after 30 seconds");
        }
        throw fetchError;
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from OpenAI API");
      }
      let gptResponse;
      try {
        const content2 = data.choices[0].message.content || "{}";
        gptResponse = JSON.parse(content2);
      } catch (parseError) {
        console.error("Failed to parse GPT response:", data.choices[0].message.content);
        throw new Error("Failed to parse JSON response from GPT");
      }
      const categories = [];
      let categoryArray = [];
      if (gptResponse.categories && Array.isArray(gptResponse.categories)) {
        categoryArray = gptResponse.categories;
      } else if (Array.isArray(gptResponse)) {
        categoryArray = gptResponse;
      }
      for (let i = 0; i < categoryArray.length; i++) {
        const cat = categoryArray[i];
        categories.push({
          id: `cat_${runId}_${i}`,
          name: cat.name || `Category ${i + 1}`,
          description: cat.description || "",
          confidence: 0.8,
          sourcePages: []
        });
      }
      let rootDomain = "";
      try {
        const urlMatch = content.match(/https?:\/\/([^\/\s]+)/i);
        if (urlMatch) {
          rootDomain = urlMatch[1];
        }
      } catch (e) {
      }
      const traditionalCategories = this.categoryGenerator.generateCategories(
        {
          rootDomain,
          pages: [],
          normalizedContent: content,
          language
        },
        0.3,
        10
      );
      const allCategories = [...categories, ...traditionalCategories];
      const uniqueCategories = Array.from(
        new Map(allCategories.map((c) => [c.name, c])).values()
      );
      await db.saveCategories(runId, uniqueCategories);
      return uniqueCategories;
    } catch (error) {
      console.error("GPT category generation error:", error);
      console.error("Error details:", error?.message || error, error?.stack);
      let rootDomain = "";
      try {
        const urlMatch = content.match(/https?:\/\/([^\/\s]+)/i);
        if (urlMatch) {
          rootDomain = urlMatch[1];
        }
      } catch (e) {
      }
      const categories = this.categoryGenerator.generateCategories(
        {
          rootDomain,
          pages: [],
          normalizedContent: content,
          language
        },
        0.3,
        15
        // Generate more categories as fallback
      );
      if (categories.length === 0) {
        categories.push(
          {
            id: `cat_${runId}_0`,
            name: "Products & Services",
            description: "Main products and services offered",
            confidence: 0.5,
            sourcePages: []
          },
          {
            id: `cat_${runId}_1`,
            name: "Features",
            description: "Key features and capabilities",
            confidence: 0.5,
            sourcePages: []
          },
          {
            id: `cat_${runId}_2`,
            name: "Use Cases",
            description: "Use cases and applications",
            confidence: 0.5,
            sourcePages: []
          }
        );
      }
      await db.saveCategories(runId, categories);
      return categories;
    }
  }
  // Step 4: Generate prompts (questionsPerCategory per category, no brand name) using GPT
  // Always generates per category with rate limiting to avoid overwhelming the API
  async step4GeneratePrompts(runId, categories, userInput, content, env, questionsPerCategory = 3, companyId) {
    const db = new Database(env.geo_db);
    const totalQuestions = categories.length * questionsPerCategory;
    const API_CALL_DELAY_MS = 2e3;
    const MAX_CONCURRENT_CALLS = 3;
    console.log(`Generating ${questionsPerCategory} questions per category (${categories.length} categories) = ${totalQuestions} total, will keep ${questionsPerCategory} per category (${categories.length * questionsPerCategory} total)`);
    const allPrompts = [];
    let processedCount = 0;
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      if (i > 0) {
        console.log(`Waiting ${API_CALL_DELAY_MS}ms before next API call to avoid rate limits...`);
        await new Promise((resolve) => setTimeout(resolve, API_CALL_DELAY_MS));
      }
      try {
        console.log(`[${i + 1}/${categories.length}] Generating prompts for category: ${category.name} (requesting ${questionsPerCategory} questions)`);
        const categoryPrompts = await this.generateCategoryPromptsWithGPT(
          category,
          userInput,
          content,
          questionsPerCategory,
          runId
        );
        const promptsToAdd = categoryPrompts.slice(0, questionsPerCategory);
        if (promptsToAdd.length !== questionsPerCategory) {
          console.warn(`[${i + 1}/${categories.length}] \u26A0\uFE0F Category ${category.name}: Got ${categoryPrompts.length} prompts, but expected ${questionsPerCategory}. Using first ${promptsToAdd.length}.`);
        }
        allPrompts.push(...promptsToAdd);
        processedCount++;
        console.log(`[${i + 1}/${categories.length}] \u2713 Added ${promptsToAdd.length} prompts for ${category.name} (expected: ${questionsPerCategory})`);
      } catch (error) {
        console.error(`[${i + 1}/${categories.length}] \u2717 Error generating prompts for category ${category.name}:`, error);
        const fallbackPrompts = this.promptGenerator.generatePrompts(
          [category],
          userInput,
          questionsPerCategory
        );
        const promptsToAdd = fallbackPrompts.slice(0, questionsPerCategory);
        allPrompts.push(...promptsToAdd);
        console.log(`[${i + 1}/${categories.length}] \u2713 Used fallback: Added ${promptsToAdd.length} prompts for ${category.name} (expected: ${questionsPerCategory})`);
      }
    }
    console.log(`Completed: Generated ${allPrompts.length} prompts across ${processedCount}/${categories.length} categories`);
    const filteredPrompts = [];
    const categoryPromptMap = /* @__PURE__ */ new Map();
    for (const prompt of allPrompts) {
      if (!categoryPromptMap.has(prompt.categoryId)) {
        categoryPromptMap.set(prompt.categoryId, []);
      }
      categoryPromptMap.get(prompt.categoryId).push(prompt);
    }
    console.log(`[step4GeneratePrompts] Before filtering: ${allPrompts.length} total prompts`);
    for (const [categoryId, prompts] of categoryPromptMap.entries()) {
      const category = categories.find((c) => c.id === categoryId);
      console.log(`[step4GeneratePrompts] Category ${category?.name || categoryId}: ${prompts.length} prompts generated`);
    }
    for (const [categoryId, prompts] of categoryPromptMap.entries()) {
      const promptsToKeep = prompts.slice(0, questionsPerCategory);
      if (promptsToKeep.length !== questionsPerCategory) {
        console.warn(`[step4GeneratePrompts] \u26A0\uFE0F Category ${categoryId}: Only ${promptsToKeep.length} prompts available, but ${questionsPerCategory} requested`);
      }
      filteredPrompts.push(...promptsToKeep);
      const category = categories.find((c) => c.id === categoryId);
      console.log(`[step4GeneratePrompts] Category ${category?.name || categoryId}: Keeping ${promptsToKeep.length} prompts (requested: ${questionsPerCategory})`);
    }
    const expectedTotal = categories.length * questionsPerCategory;
    if (filteredPrompts.length !== expectedTotal) {
      console.warn(`[step4GeneratePrompts] \u26A0\uFE0F Expected ${expectedTotal} prompts (${questionsPerCategory} \xD7 ${categories.length} categories), but got ${filteredPrompts.length}`);
    } else {
      console.log(`[step4GeneratePrompts] \u2713 Filtered to ${filteredPrompts.length} prompts (${questionsPerCategory} per category, ${categories.length} categories = ${expectedTotal} total)`);
    }
    await db.retryD1Operation(async () => {
      await db.db.prepare(
        "UPDATE analysis_runs SET prompts_generated = ?, step = ?, updated_at = ? WHERE id = ?"
      ).bind(
        filteredPrompts.length,
        "prompts",
        (/* @__PURE__ */ new Date()).toISOString(),
        runId
      ).run();
    }, 3, 150, "step4UpdateAnalysisRun");
    return filteredPrompts;
  }
  async generateAllCategoryPromptsWithGPT(categories, userInput, content, questionsPerCategory, runId) {
    if (this.config.debug?.enabled) {
      console.log("\u{1F41B} DEBUG MODE: Returning dummy prompts (no API call)");
      const allPrompts = [];
      for (const category of categories) {
        const dummyPrompts = await this.getDummyPrompts(category, userInput, questionsPerCategory, runId);
        allPrompts.push(...dummyPrompts);
      }
      return allPrompts;
    }
    const regionText = userInput.region || userInput.country;
    const totalQuestions = categories.length * questionsPerCategory;
    const categoriesList = categories.map((c) => `- ${c.name}: ${c.description}`).join("\n");
    const prompt = `Du bist ein Experte f\xFCr Kundenerfahrung. Generiere f\xFCr jede der folgenden Kategorien genau ${questionsPerCategory} SEHR REALISTISCHE, DIREKTE Fragen in ${userInput.language}, die echte Kunden wirklich in einer Suchmaschine oder ChatGPT eingeben w\xFCrden.

KRITISCHE ANFORDERUNGEN:
- Fragen m\xFCssen brand-neutral sein (KEINE Firmennamen, KEINE Markennamen)
- Verwende SEHR DIREKTE, SUCHMASCHINEN-\xC4HNLICHE Formulierungen
- BEVORZUGE "Wer ist..." Fragen statt "Wie..." Fragen
- Integriere IMMER LOKALE/REGIONALE Bez\xFCge (z.B. "${regionText}", "in Graub\xFCnden", "in Z\xFCrich")
- Fragen sollten kurz, pr\xE4gnant und sehr spezifisch sein
- Verwende Formulierungen wie "Wer ist...", "Wer bietet...", "Wer verkauft...", "Gibt es...", "Was kostet..."
- Vermeide "Wie..." Fragen - verwende stattdessen direkte Suchanfragen
- Fragen sollten zeigen, dass der Kunde aktiv nach einem Anbieter/L\xF6sung sucht

Beispiele f\xFCr PERFEKTE kundenorientierte Fragen (${userInput.language}):
${userInput.language === "de" ? `
- "Wer ist in ${regionText} f\xFCr Kassensystem?"
- "Wer bietet Kassensysteme in ${regionText}?"
- "Gibt es Kassensysteme f\xFCr Restaurants in ${regionText}?"
- "Was kostet ein Kassensystem in ${regionText}?"
` : userInput.language === "en" ? `
- "Who is in ${regionText} for POS system?"
- "Who offers POS systems in ${regionText}?"
- "Are there POS systems for restaurants in ${regionText}?"
- "What does a POS system cost in ${regionText}?"
` : `
- "Qui est en ${regionText} pour syst\xE8me de caisse?"
- "Qui offre des syst\xE8mes de caisse en ${regionText}?"
- "Y a-t-il des syst\xE8mes de caisse pour restaurants en ${regionText}?"
`}

Kategorien (f\xFCr jede Kategorie genau ${questionsPerCategory} Fragen generieren):
${categoriesList}

Kontext:
- Land: ${userInput.country}
- Region: ${userInput.region || userInput.country}
- Sprache: ${userInput.language}
- Relevanter Inhaltsauszug: ${content.substring(0, 2e3)}

WICHTIG: 
- Die Fragen m\xFCssen so klingen, als ob ein echter Kunde sie direkt in eine Suchmaschine oder ChatGPT eingibt
- BEVORZUGE "Wer ist..." statt "Wie..."
- IMMER lokale/regionale Bez\xFCge einbauen
- Sei SEHR DIREKT und PR\xC4GNANT
- F\xFCr jede Kategorie genau ${questionsPerCategory} Fragen generieren

Gib nur ein JSON-Objekt zur\xFCck mit einem "categories" Array, wobei jedes Element eine Kategorie mit ihren Fragen enth\xE4lt:
{
  "categories": [
    {
      "categoryName": "Kategorie 1 Name",
      "questions": ["Frage 1", "Frage 2", "Frage ${questionsPerCategory}"]
    },
    {
      "categoryName": "Kategorie 2 Name", 
      "questions": ["Frage 1", "Frage 2", "Frage ${questionsPerCategory}"]
    }
  ]
}
Kein anderer Text, nur g\xFCltiges JSON.`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6e4);
      let response;
      try {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.openai.apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.8,
            max_tokens: 2e3
            // More tokens for multiple categories
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          throw new Error("OpenAI API request timed out after 60 seconds");
        }
        throw fetchError;
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from OpenAI API");
      }
      let gptResponse;
      try {
        const responseContent = data.choices[0].message.content || "{}";
        gptResponse = JSON.parse(responseContent);
      } catch (parseError) {
        console.error("Failed to parse GPT response:", data.choices[0].message.content);
        throw new Error("Failed to parse JSON response from GPT");
      }
      const categoriesData = gptResponse.categories || [];
      const allPrompts = [];
      const now = (/* @__PURE__ */ new Date()).toISOString();
      for (const categoryData of categoriesData) {
        const categoryName = categoryData.categoryName;
        const questions = categoryData.questions || [];
        let category = categories.find((c) => c.name === categoryName);
        if (!category) {
          category = categories.find(
            (c) => c.name.toLowerCase() === categoryName.toLowerCase() || categoryName.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(categoryName.toLowerCase())
          );
        }
        if (!category) {
          console.warn(`Category "${categoryName}" from GPT not found in original categories. Available: ${categories.map((c) => c.name).join(", ")}`);
          const index = categoriesData.indexOf(categoryData);
          if (index < categories.length) {
            category = categories[index];
            console.log(`Using category by index: ${category.name}`);
          } else {
            continue;
          }
        }
        for (let i = 0; i < questions.length && allPrompts.filter((p) => p.categoryId === category.id).length < questionsPerCategory; i++) {
          const question = questions[i];
          if (question && typeof question === "string" && question.trim()) {
            allPrompts.push({
              id: `prompt_${runId}_${category.id}_${allPrompts.filter((p) => p.categoryId === category.id).length}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              categoryId: category.id,
              question: question.trim(),
              language: userInput.language,
              country: userInput.country,
              region: userInput.region,
              intent: "high",
              createdAt: now
            });
          }
        }
        const categoryPromptCount = allPrompts.filter((p) => p.categoryId === category.id).length;
        if (categoryPromptCount < questionsPerCategory) {
          console.warn(`Category ${category.name}: Only got ${categoryPromptCount} questions, using fallback for remaining ${questionsPerCategory - categoryPromptCount}`);
          const fallbackPrompts = this.promptGenerator.generatePrompts(
            [category],
            userInput,
            questionsPerCategory - categoryPromptCount
          );
          allPrompts.push(...fallbackPrompts.slice(0, questionsPerCategory - categoryPromptCount));
        }
      }
      if (allPrompts.length < totalQuestions) {
        console.warn(`Generated ${allPrompts.length} prompts, expected ${totalQuestions}. Filling with template-based prompts.`);
        const existingCount = allPrompts.length;
        const fallbackPrompts = this.promptGenerator.generatePrompts(
          categories,
          userInput,
          questionsPerCategory
        );
        const needed = totalQuestions - existingCount;
        allPrompts.push(...fallbackPrompts.slice(0, needed));
      }
      return allPrompts.slice(0, totalQuestions);
    } catch (error) {
      console.error("Error in generateAllCategoryPromptsWithGPT:", error);
      throw error;
    }
  }
  async generateCategoryPromptsWithGPT(category, userInput, content, count, runId) {
    if (this.config.debug?.enabled) {
      console.log("\u{1F41B} DEBUG MODE: Returning dummy prompts (no API call)");
      return this.getDummyPrompts(category, userInput, count, runId);
    }
    const regionText = userInput.region || userInput.country;
    const prompt = `Du bist ein Experte f\xFCr Kundenerfahrung. Generiere genau ${count} SEHR REALISTISCHE, DIREKTE Fragen in ${userInput.language}, die echte Kunden wirklich in einer Suchmaschine oder ChatGPT eingeben w\xFCrden.

KRITISCHE ANFORDERUNGEN:
- Fragen m\xFCssen brand-neutral sein (KEINE Firmennamen, KEINE Markennamen)
- Verwende SEHR DIREKTE, SUCHMASCHINEN-\xC4HNLICHE Formulierungen
- BEVORZUGE "Wer ist..." Fragen statt "Wie..." Fragen
- Integriere IMMER LOKALE/REGIONALE Bez\xFCge (z.B. "${regionText}", "in Graub\xFCnden", "in Z\xFCrich")
- Fragen sollten kurz, pr\xE4gnant und sehr spezifisch sein
- Verwende Formulierungen wie "Wer ist...", "Wer bietet...", "Wer verkauft...", "Gibt es...", "Was kostet..."
- Vermeide "Wie..." Fragen - verwende stattdessen direkte Suchanfragen
- Fragen sollten zeigen, dass der Kunde aktiv nach einem Anbieter/L\xF6sung sucht

Beispiele f\xFCr PERFEKTE kundenorientierte Fragen (${userInput.language}):
${userInput.language === "de" ? `
- "Wer ist in ${regionText} f\xFCr Kassensystem?"
- "Wer bietet Kassensysteme in ${regionText}?"
- "Gibt es Kassensysteme f\xFCr Restaurants in ${regionText}?"
- "Was kostet ein Kassensystem in ${regionText}?"
- "Wer verkauft Kassensysteme f\xFCr kleine L\xE4den in ${regionText}?"
- "Welche Kassensysteme gibt es in ${regionText}?"
- "Wer ist der beste Anbieter f\xFCr Kassensysteme in ${regionText}?"
` : userInput.language === "en" ? `
- "Who is in ${regionText} for POS system?"
- "Who offers POS systems in ${regionText}?"
- "Are there POS systems for restaurants in ${regionText}?"
- "What does a POS system cost in ${regionText}?"
- "Who sells POS systems for small shops in ${regionText}?"
- "What POS systems are available in ${regionText}?"
- "Who is the best provider for POS systems in ${regionText}?"
` : `
- "Qui est en ${regionText} pour syst\xE8me de caisse?"
- "Qui offre des syst\xE8mes de caisse en ${regionText}?"
- "Y a-t-il des syst\xE8mes de caisse pour restaurants en ${regionText}?"
- "Combien co\xFBte un syst\xE8me de caisse en ${regionText}?"
- "Qui vend des syst\xE8mes de caisse pour petits magasins en ${regionText}?"
`}

Kontext:
- Kategorie: ${category.name} - ${category.description}
- Land: ${userInput.country}
- Region: ${userInput.region || userInput.country}
- Sprache: ${userInput.language}
- Relevanter Inhaltsauszug: ${content.substring(0, 2e3)}

WICHTIG: 
- Die Fragen m\xFCssen so klingen, als ob ein echter Kunde sie direkt in eine Suchmaschine oder ChatGPT eingibt
- BEVORZUGE "Wer ist..." statt "Wie..."
- IMMER lokale/regionale Bez\xFCge einbauen
- Sei SEHR DIREKT und PR\xC4GNANT

Gib nur ein JSON-Objekt mit einem "questions" Array zur\xFCck, das genau ${count} Fragen enth\xE4lt:
{"questions": ["Frage 1 in ${userInput.language}", "Frage 2 in ${userInput.language}", ...]}
Kein anderer Text, nur g\xFCltiges JSON.`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45e3);
      let response;
      try {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.openai.apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.8,
            max_tokens: 1e3
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          throw new Error("OpenAI API request timed out after 30 seconds");
        }
        throw fetchError;
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from OpenAI API");
      }
      let gptResponse;
      try {
        const responseContent = data.choices[0].message.content || "{}";
        gptResponse = JSON.parse(responseContent);
      } catch (parseError) {
        console.error("Failed to parse GPT response:", data.choices[0].message.content);
        throw new Error("Failed to parse JSON response from GPT");
      }
      const questions = gptResponse.questions || [];
      const prompts = [];
      for (let i = 0; i < questions.length && prompts.length < count; i++) {
        const question = questions[i];
        if (question && typeof question === "string" && question.trim().length > 0) {
          prompts.push({
            id: `prompt_${runId}_${category.id}_${prompts.length}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            categoryId: category.id,
            question: question.trim(),
            language: userInput.language,
            country: userInput.country,
            region: userInput.region,
            intent: "high",
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
      if (prompts.length < count) {
        console.warn(`Only got ${prompts.length} questions for category ${category.name}, using fallback for remaining ${count - prompts.length}`);
        const fallbackPrompts = this.promptGenerator.generatePrompts([category], userInput, count - prompts.length);
        const needed = count - prompts.length;
        prompts.push(...fallbackPrompts.slice(0, needed));
      }
      const finalPrompts = prompts.slice(0, count);
      console.log(`[generateCategoryPromptsWithGPT] Category ${category.name}: Generated ${prompts.length} prompts, returning exactly ${finalPrompts.length} (requested: ${count})`);
      return finalPrompts;
    } catch (error) {
      console.error(`Error generating prompts for category ${category.name}:`, error);
      console.error("Error details:", error?.message || error, error?.stack);
      const fallbackPrompts = this.promptGenerator.generatePrompts([category], userInput, count);
      return fallbackPrompts;
    }
  }
  getDummyPrompts(category, userInput, count, runId) {
    const regionText = userInput.region || userInput.country;
    const prompts = [];
    const questionTemplates = {
      de: [
        `Wer ist in ${regionText} f\xFCr ${category.name}?`,
        `Wer bietet ${category.name} in ${regionText}?`,
        `Gibt es ${category.name} f\xFCr Unternehmen in ${regionText}?`,
        `Was kostet ${category.name} in ${regionText}?`,
        `Wer verkauft ${category.name} in ${regionText}?`,
        `Welche ${category.name} gibt es in ${regionText}?`,
        `Wer ist der beste Anbieter f\xFCr ${category.name} in ${regionText}?`,
        `Wo finde ich ${category.name} in ${regionText}?`
      ],
      en: [
        `Who is in ${regionText} for ${category.name}?`,
        `Who offers ${category.name} in ${regionText}?`,
        `Are there ${category.name} for businesses in ${regionText}?`,
        `What does ${category.name} cost in ${regionText}?`,
        `Who sells ${category.name} in ${regionText}?`,
        `What ${category.name} are available in ${regionText}?`,
        `Who is the best provider for ${category.name} in ${regionText}?`,
        `Where can I find ${category.name} in ${regionText}?`
      ],
      fr: [
        `Qui est en ${regionText} pour ${category.name}?`,
        `Qui offre ${category.name} en ${regionText}?`,
        `Y a-t-il ${category.name} pour entreprises en ${regionText}?`,
        `Combien co\xFBte ${category.name} en ${regionText}?`,
        `Qui vend ${category.name} en ${regionText}?`,
        `Quels ${category.name} sont disponibles en ${regionText}?`,
        `Qui est le meilleur fournisseur pour ${category.name} en ${regionText}?`,
        `O\xF9 puis-je trouver ${category.name} en ${regionText}?`
      ]
    };
    const templates = questionTemplates[userInput.language] || questionTemplates.de;
    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      prompts.push({
        id: `prompt_${runId}_${category.id}_${i}`,
        categoryId: category.id,
        question: template,
        language: userInput.language,
        country: userInput.country,
        region: userInput.region,
        intent: "high",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    return prompts;
  }
  // Save selected prompts
  async saveSelectedPrompts(runId, selectedPrompts, env) {
    const db = new Database(env.geo_db);
    await db.savePrompts(runId, selectedPrompts);
    await db.db.prepare(
      "UPDATE analysis_runs SET prompts_generated = ?, step = ?, updated_at = ? WHERE id = ?"
    ).bind(
      selectedPrompts.length,
      "prompts",
      (/* @__PURE__ */ new Date()).toISOString(),
      runId
    ).run();
    return selectedPrompts;
  }
  // Step 5: Execute prompts with GPT-5 Web Search
  // Only saves prompts that were successfully executed and have responses
  async step5ExecutePrompts(runId, prompts, env) {
    const db = new Database(env.geo_db);
    await db.db.prepare("UPDATE analysis_runs SET step = ?, updated_at = ? WHERE id = ?").bind("execution", (/* @__PURE__ */ new Date()).toISOString(), runId).run();
    const responses = await this.llmExecutor.executePrompts(prompts);
    const promptsWithResponses = [];
    const validResponses = [];
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      if (response && response.outputText && response.outputText.trim().length > 0) {
        const prompt = prompts.find((p) => p.id === response.promptId);
        if (prompt) {
          promptsWithResponses.push(prompt);
          validResponses.push(response);
        }
      }
    }
    if (promptsWithResponses.length > 0) {
      await db.savePrompts(runId, promptsWithResponses);
      console.log(`Saved ${promptsWithResponses.length} prompts with successful responses (out of ${prompts.length} total)`);
    } else {
      console.warn(`No prompts with valid responses to save (${prompts.length} prompts executed, ${responses.length} responses received)`);
    }
    await db.saveLLMResponses(responses);
    await db.db.prepare("UPDATE analysis_runs SET step = ?, updated_at = ? WHERE id = ?").bind("completed", (/* @__PURE__ */ new Date()).toISOString(), runId).run();
    return { executed: validResponses.length };
  }
  // Save user-selected categories
  async saveSelectedCategories(runId, categoryIds, customCategories, env) {
    const db = new Database(env.geo_db);
    if (customCategories.length > 0) {
      await db.saveCategories(runId, customCategories);
    }
    await db.db.prepare(
      "UPDATE analysis_runs SET selected_categories = ?, custom_categories = ?, updated_at = ? WHERE id = ?"
    ).bind(
      JSON.stringify(categoryIds),
      JSON.stringify(customCategories),
      (/* @__PURE__ */ new Date()).toISOString(),
      runId
    ).run();
  }
  // Save user-edited prompts
};
__name(WorkflowEngine, "WorkflowEngine");

// src/api/router.ts
var Router = class {
  constructor(env) {
    this.env = env;
    const workflowEngine = new WorkflowEngine(env);
    this.workflowHandlers = new WorkflowHandlers(workflowEngine);
    this.analysisHandlers = new AnalysisHandlers();
  }
  workflowHandlers;
  analysisHandlers;
  async route(request, ctx) {
    const corsHeaders = getCorsHeaders();
    const corsResponse = handleCors(request);
    if (corsResponse)
      return corsResponse;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    try {
      const match = matchRoute(path, method);
      if (!match) {
        return handleNotFound(corsHeaders);
      }
      const { route, params } = match;
      const [handlerName, methodName] = route.handler.split(".");
      switch (handlerName) {
        case "workflow":
          return await this.routeWorkflow(methodName, request, params, corsHeaders);
        case "analysis":
          return await this.routeAnalysis(methodName, request, params, corsHeaders);
        case "health":
          return new Response(
            JSON.stringify({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        default:
          return handleNotFound(corsHeaders);
      }
    } catch (error) {
      return handleError(error, corsHeaders);
    }
  }
  async routeWorkflow(method, request, params, corsHeaders) {
    switch (method) {
      case "step1":
        return await this.workflowHandlers.handleStep1(request, this.env, corsHeaders);
      case "step3":
        return await this.workflowHandlers.handleStep3(request, this.env, corsHeaders);
      case "saveCategories":
        return await this.workflowHandlers.handleSaveCategories(
          params.param0 || "",
          request,
          this.env,
          corsHeaders
        );
      case "step4":
        return await this.workflowHandlers.handleStep4(request, this.env, corsHeaders);
      case "step5":
        return await this.workflowHandlers.handleStep5(request, this.env, corsHeaders);
      case "fetchUrl":
        return await this.workflowHandlers.handleFetchUrl(request, this.env, corsHeaders);
      case "generateSummary":
        return await this.workflowHandlers.handleGenerateSummary(request, this.env, corsHeaders);
      case "aiReadiness":
        return await this.workflowHandlers.handleAIReadiness(request, this.env, corsHeaders);
      default:
        return handleNotFound(corsHeaders);
    }
  }
  async routeAnalysis(method, request, params, corsHeaders) {
    const runId = params.param0 || "";
    const companyId = params.param0 || "";
    const categoryName = params.param0 || "";
    switch (method) {
      case "getAll":
        return await this.analysisHandlers.handleGetAllAnalyses(request, this.env, corsHeaders);
      case "getPromptsAndSummary":
        return await this.analysisHandlers.handleGetAnalysisPromptsAndSummary(runId, this.env, corsHeaders);
      case "delete":
        return await this.analysisHandlers.handleDeleteAnalysis(runId, this.env, corsHeaders);
      case "getAllCompanies":
        return await this.analysisHandlers.handleGetAllCompanies(request, this.env, corsHeaders);
      case "getCompanyAnalyses":
        return await this.analysisHandlers.handleGetCompanyAnalyses(companyId, this.env, corsHeaders);
      case "getGlobalCategories":
        return await this.analysisHandlers.handleGetGlobalCategories(request, this.env, corsHeaders);
      case "getGlobalPromptsByCategory":
        return await this.analysisHandlers.handleGetGlobalPromptsByCategory(categoryName, this.env, corsHeaders);
      default:
        return handleNotFound(corsHeaders);
    }
  }
};
__name(Router, "Router");

// src/index.ts
var src_default = {
  async fetch(request, env, ctx) {
    const router = new Router(env);
    return await router.route(request, ctx);
  }
};

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-Ad2mz9/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = src_default;

// ../node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-Ad2mz9/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
