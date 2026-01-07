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

// .wrangler/tmp/bundle-doaM6S/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
var init_strip_cf_connecting_ip_header = __esm({
  ".wrangler/tmp/bundle-doaM6S/strip-cf-connecting-ip-header.js"() {
    "use strict";
    __name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        return Reflect.apply(target, thisArg, [
          stripCfConnectingIPHeader.apply(null, argArray)
        ]);
      }
    });
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// src/config.ts
var config_exports = {};
__export(config_exports, {
  getConfig: () => getConfig
});
function getConfig(env) {
  return {
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
var init_config = __esm({
  "src/config.ts"() {
    "use strict";
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    __name(getConfig, "getConfig");
  }
});

// src/ingestion/sitemap.ts
var sitemap_exports = {};
__export(sitemap_exports, {
  SitemapParser: () => SitemapParser
});
var SitemapParser;
var init_sitemap = __esm({
  "src/ingestion/sitemap.ts"() {
    "use strict";
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    SitemapParser = class {
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
  }
});

// src/llm_execution/index.ts
var llm_execution_exports = {};
__export(llm_execution_exports, {
  LLMExecutor: () => LLMExecutor
});
var LLMExecutor;
var init_llm_execution = __esm({
  "src/llm_execution/index.ts"() {
    "use strict";
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    LLMExecutor = class {
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
            responses.push(response);
          } catch (error) {
            console.error(`Failed to execute prompt ${prompt.id}:`, error);
          }
        }
        return responses;
      }
      async callResponsesAPI(question) {
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
        } catch (jsonError2) {
          const responseText = await response.text();
          console.error("\u274C Failed to parse JSON response:", jsonError2);
          console.error("\u274C Response text:", responseText);
          throw new Error(`Failed to parse API response: ${jsonError2 instanceof Error ? jsonError2.message : String(jsonError2)}. Response: ${responseText.substring(0, 500)}`);
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
    };
    __name(LLMExecutor, "LLMExecutor");
  }
});

// src/persistence/db.ts
var Database;
var init_db = __esm({
  "src/persistence/db.ts"() {
    "use strict";
    init_strip_cf_connecting_ip_header();
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
        await this.db.prepare(
          `UPDATE analysis_runs SET status = ?, progress = ?, updated_at = ? WHERE id = ?`
        ).bind(status, progressJson, (/* @__PURE__ */ new Date()).toISOString(), runId).run();
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
            `INSERT INTO categories (id, analysis_run_id, name, description, confidence, source_pages, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            cat.id,
            runId,
            cat.name,
            cat.description,
            cat.confidence,
            JSON.stringify(cat.sourcePages),
            (/* @__PURE__ */ new Date()).toISOString()
          )
        );
        await this.db.batch(statements);
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
        await this.db.batch(statements);
      }
      async saveLLMResponses(responses) {
        if (responses.length === 0) {
          return;
        }
        const responseStatements = responses.map((response) => {
          const responseId = `resp_${response.promptId}_${Date.now()}`;
          return {
            response: this.db.prepare(
              `INSERT INTO llm_responses (id, prompt_id, output_text, model, timestamp)
             VALUES (?, ?, ?, ?, ?)`
            ).bind(
              responseId,
              response.promptId,
              response.outputText,
              response.model,
              response.timestamp
            ),
            citations: response.citations.map((citation) => {
              const citationId = `cite_${responseId}_${Date.now()}_${Math.random()}`;
              return this.db.prepare(
                `INSERT INTO citations (id, llm_response_id, url, title, snippet)
               VALUES (?, ?, ?, ?, ?)`
              ).bind(
                citationId,
                responseId,
                citation.url,
                citation.title || null,
                citation.snippet || null
              );
            })
          };
        });
        const allStatements = [];
        for (const { response, citations } of responseStatements) {
          allStatements.push(response);
          allStatements.push(...citations);
        }
        if (allStatements.length > 0) {
          await this.db.batch(allStatements);
        }
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
          await this.db.batch(allStatements);
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
        await this.db.batch(statements);
      }
      async saveCompetitiveAnalysis(runId, analysis) {
        const analysisId = `comp_analysis_${runId}_${Date.now()}`;
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
      }
      async saveTimeSeriesData(runId, data) {
        const dataId = `ts_${runId}_${Date.now()}`;
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
      }
      async getAnalysisRun(runId) {
        const run = await this.db.prepare("SELECT * FROM analysis_runs WHERE id = ?").bind(runId).first();
        if (!run)
          return null;
        return {
          websiteUrl: run.website_url,
          country: run.country,
          language: run.language,
          categories: [],
          prompts: [],
          analyses: [],
          categoryMetrics: [],
          competitiveAnalysis: {
            brandShare: 0,
            competitorShares: {},
            whiteSpaceTopics: [],
            dominatedPrompts: [],
            missingBrandPrompts: [],
            timestamp: run.updated_at
          },
          timeSeries: [],
          createdAt: run.created_at,
          updatedAt: run.updated_at
        };
      }
      async getLatestAnalysisRun(websiteUrl) {
        const run = await this.db.prepare(
          "SELECT id FROM analysis_runs WHERE website_url = ? ORDER BY created_at DESC LIMIT 1"
        ).bind(websiteUrl).first();
        return run?.id || null;
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
        const companies = await this.db.prepare("SELECT * FROM companies WHERE is_active = 1 ORDER BY created_at DESC").all();
        return (companies.results || []).map((c) => ({
          id: c.id,
          name: c.name,
          websiteUrl: c.website_url,
          country: c.country,
          language: c.language,
          region: c.region || void 0,
          description: c.description || void 0,
          isActive: c.is_active === 1,
          createdAt: c.created_at,
          updatedAt: c.updated_at
        }));
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
        const runs = await this.db.prepare(
          `SELECT id, website_url, country, language, status, created_at, updated_at 
         FROM analysis_runs 
         WHERE company_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`
        ).bind(companyId, limit).all();
        return (runs.results || []).map((r) => ({
          id: r.id,
          websiteUrl: r.website_url,
          country: r.country,
          language: r.language,
          status: r.status,
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

// src/persistence/index.ts
var persistence_exports = {};
__export(persistence_exports, {
  Database: () => Database
});
var init_persistence = __esm({
  "src/persistence/index.ts"() {
    "use strict";
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_db();
  }
});

// src/analysis/brand_mention.ts
var BrandMentionDetector;
var init_brand_mention = __esm({
  "src/analysis/brand_mention.ts"() {
    "use strict";
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    BrandMentionDetector = class {
      constructor(brandName, fuzzyThreshold = 0.7) {
        this.brandName = brandName;
        this.fuzzyThreshold = fuzzyThreshold;
      }
      detectMentions(response) {
        const text = response.outputText.toLowerCase();
        const brandLower = this.brandName.toLowerCase();
        const brandInUrl = brandLower.replace(/\s+/g, "");
        const exactMatches = this.countExactMatches(text, brandLower);
        const markdownLinkPattern = new RegExp(`\\[([^\\]]*${this.escapeRegex(brandInUrl)}[^\\]]*)\\]`, "gi");
        const markdownMatches = response.outputText.match(markdownLinkPattern);
        const markdownMentions = markdownMatches ? markdownMatches.length : 0;
        const totalExact = exactMatches + markdownMentions;
        const fuzzyMatches = this.countFuzzyMatches(text, brandLower);
        const contexts = this.extractContexts(response.outputText, brandLower);
        return {
          exact: totalExact,
          fuzzy: fuzzyMatches,
          contexts
        };
      }
      countExactMatches(text, brandLower) {
        const brandWords = brandLower.split(/\s+/);
        if (brandWords.length === 1) {
          const regex = new RegExp(`\\b${this.escapeRegex(brandLower)}\\b`, "gi");
          const matches = text.match(regex);
          return matches ? matches.length : 0;
        } else {
          const phraseRegex = new RegExp(`\\b${this.escapeRegex(brandLower)}\\b`, "gi");
          const phraseMatches = text.match(phraseRegex);
          const phraseCount = phraseMatches ? phraseMatches.length : 0;
          const wordsPattern = brandWords.map((w) => this.escapeRegex(w)).join("\\s+");
          const wordsRegex = new RegExp(`\\b${wordsPattern}\\b`, "gi");
          const wordsMatches = text.match(wordsRegex);
          const wordsCount = wordsMatches ? wordsMatches.length : 0;
          return Math.max(phraseCount, wordsCount);
        }
      }
      countFuzzyMatches(text, brandLower) {
        const brandWords = brandLower.split(/\s+/);
        let fuzzyCount = 0;
        const foundPositions = /* @__PURE__ */ new Set();
        if (brandWords.length === 1) {
          const words = text.split(/\s+/);
          for (let i = 0; i < words.length; i++) {
            const word = words[i].replace(/[^\w]/g, "");
            if (word.length === 0)
              continue;
            const similarity = this.calculateSimilarity(word, brandLower);
            if (similarity >= this.fuzzyThreshold && similarity < 1) {
              if (!foundPositions.has(i)) {
                fuzzyCount++;
                foundPositions.add(i);
              }
            }
          }
          const brandWithoutSpaces = brandLower.replace(/\s+/g, "");
          for (let i = 0; i < words.length; i++) {
            const word = words[i].replace(/[^\w]/g, "");
            if (word.length === 0)
              continue;
            const similarity = this.calculateSimilarity(word, brandWithoutSpaces);
            if (similarity >= this.fuzzyThreshold && similarity < 1) {
              if (!foundPositions.has(i)) {
                fuzzyCount++;
                foundPositions.add(i);
              }
            }
          }
        } else {
          const textWords = text.split(/\s+/).map((w) => w.replace(/[^\w]/g, ""));
          for (let i = 0; i <= textWords.length - brandWords.length; i++) {
            const window = textWords.slice(i, i + brandWords.length);
            const phrase = window.join(" ");
            const originalPhrase = text.split(/\s+/).slice(i, i + brandWords.length).join(" ");
            const similarity = this.calculateSimilarity(phrase, brandLower);
            if (similarity >= this.fuzzyThreshold && similarity < 1) {
              const startPos = text.indexOf(originalPhrase);
              if (startPos !== -1 && !foundPositions.has(startPos)) {
                fuzzyCount++;
                foundPositions.add(startPos);
              }
            }
            const phraseNoSpaces = phrase.replace(/\s+/g, "");
            const brandNoSpaces = brandLower.replace(/\s+/g, "");
            const similarityNoSpaces = this.calculateSimilarity(phraseNoSpaces, brandNoSpaces);
            if (similarityNoSpaces >= this.fuzzyThreshold && similarityNoSpaces < 1) {
              const startPos = text.indexOf(originalPhrase);
              if (startPos !== -1 && !foundPositions.has(startPos)) {
                fuzzyCount++;
                foundPositions.add(startPos);
              }
            }
          }
        }
        return fuzzyCount;
      }
      calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
          return 1;
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
      }
      levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
          matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
          matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
          for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              );
            }
          }
        }
        return matrix[str2.length][str1.length];
      }
      extractContexts(text, brandLower) {
        const contexts = [];
        const brandWords = brandLower.split(/\s+/);
        const brandInUrl = brandLower.replace(/\s+/g, "");
        const sentences = text.split(/([.!?]+)/);
        const sentenceList = [];
        for (let i = 0; i < sentences.length; i += 2) {
          if (sentences[i]) {
            const sentence = sentences[i] + (sentences[i + 1] || "");
            sentenceList.push(sentence);
          }
        }
        const allMatches = [];
        const exactRegex = new RegExp(`\\b${this.escapeRegex(brandLower)}\\b`, "gi");
        let match;
        while ((match = exactRegex.exec(text)) !== null) {
          allMatches.push({ start: match.index, end: match.index + match[0].length });
        }
        const markdownLinkPattern = new RegExp(`\\[([^\\]]*${this.escapeRegex(brandInUrl)}[^\\]]*)\\]`, "gi");
        while ((match = markdownLinkPattern.exec(text)) !== null) {
          allMatches.push({ start: match.index, end: match.index + match[0].length });
        }
        const textLower = text.toLowerCase();
        const words = textLower.split(/\s+/);
        if (brandWords.length === 1) {
          let currentPos = 0;
          for (const word of words) {
            const cleanWord = word.replace(/[^\w]/g, "");
            if (cleanWord.length > 0) {
              const similarity = this.calculateSimilarity(cleanWord, brandLower);
              if (similarity >= this.fuzzyThreshold && similarity < 1) {
                const wordIndex = textLower.indexOf(word, currentPos);
                if (wordIndex !== -1) {
                  allMatches.push({ start: wordIndex, end: wordIndex + word.length });
                  currentPos = wordIndex + word.length;
                }
              }
            }
          }
        } else {
          for (let i = 0; i <= words.length - brandWords.length; i++) {
            const window = words.slice(i, i + brandWords.length);
            const phrase = window.join(" ");
            const similarity = this.calculateSimilarity(phrase, brandLower);
            if (similarity >= this.fuzzyThreshold && similarity < 1) {
              const phraseIndex = textLower.indexOf(phrase);
              if (phraseIndex !== -1) {
                allMatches.push({ start: phraseIndex, end: phraseIndex + phrase.length });
              }
            }
          }
        }
        for (const match2 of allMatches) {
          const start = Math.max(0, match2.start - 100);
          const end = Math.min(text.length, match2.end + 100);
          const context = text.substring(start, end).trim();
          const cleanContext = context.replace(/^[^\w\s]+/, "").replace(/[^\w\s]+$/, "");
          if (cleanContext && !contexts.includes(cleanContext)) {
            contexts.push(cleanContext);
          }
        }
        for (const sentence of sentenceList) {
          const sentenceLower = sentence.toLowerCase();
          if (sentenceLower.includes(brandLower) || sentenceLower.includes(brandInUrl)) {
            const trimmed = sentence.trim();
            if (trimmed && !contexts.includes(trimmed)) {
              contexts.push(trimmed);
            }
          }
        }
        return contexts.slice(0, 5);
      }
      escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
    };
    __name(BrandMentionDetector, "BrandMentionDetector");
  }
});

// src/analysis/competitor.ts
var CompetitorDetector;
var init_competitor = __esm({
  "src/analysis/competitor.ts"() {
    "use strict";
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    CompetitorDetector = class {
      constructor(brandName) {
        this.brandName = brandName;
      }
      detectCompetitors(response, knownCompetitors) {
        const text = response.outputText;
        const competitors = /* @__PURE__ */ new Map();
        const potentialCompetitors = this.extractPotentialCompetitors(
          text,
          knownCompetitors
        );
        for (const competitor of potentialCompetitors) {
          if (competitor.toLowerCase() === this.brandName.toLowerCase()) {
            continue;
          }
          const count = this.countMentions(text, competitor);
          if (count > 0) {
            const contexts = this.extractContexts(text, competitor);
            const citations = this.extractRelevantCitations(
              response.citations,
              competitor
            );
            competitors.set(competitor, {
              name: competitor,
              count,
              contexts,
              citations: citations.map((c) => c.url)
            });
          }
        }
        return Array.from(competitors.values()).sort(
          (a, b) => b.count - a.count
        );
      }
      extractPotentialCompetitors(text, knownCompetitors) {
        const competitors = /* @__PURE__ */ new Set();
        if (knownCompetitors) {
          for (const comp of knownCompetitors) {
            competitors.add(comp);
          }
        }
        const commonWords = /* @__PURE__ */ new Set([
          "this",
          "that",
          "these",
          "those",
          "the",
          "a",
          "an",
          "and",
          "or",
          "but",
          "is",
          "are",
          "was",
          "were",
          "be",
          "been",
          "being",
          "have",
          "has",
          "had",
          "do",
          "does",
          "did",
          "will",
          "would",
          "should",
          "could",
          "may",
          "might",
          "can",
          "must",
          "shall",
          "should",
          "will",
          "would",
          "get",
          "got",
          "go",
          "come",
          "see",
          "know",
          "think",
          "take",
          "give",
          "make",
          "find",
          "say",
          "tell",
          "ask",
          "work",
          "try",
          "use",
          "want",
          "need",
          "feel",
          "become",
          "leave",
          "put",
          "mean",
          "keep",
          "let",
          "begin",
          "seem",
          "help",
          "show",
          "hear",
          "play",
          "run",
          "move",
          "like",
          "live",
          "believe",
          "bring",
          "happen",
          "write",
          "sit",
          "stand",
          "lose",
          "pay",
          "meet",
          "include",
          "continue",
          "set",
          "learn",
          "change",
          "lead",
          "understand",
          "watch",
          "follow",
          "stop",
          "create",
          "speak",
          "read",
          "spend",
          "grow",
          "open",
          "walk",
          "win",
          "offer",
          "remember",
          "love",
          "consider",
          "appear",
          "buy",
          "wait",
          "serve",
          "die",
          "send",
          "build",
          "stay",
          "fall",
          "cut",
          "reach",
          "kill",
          "raise",
          "pass",
          "sell",
          "decide",
          "return",
          "explain",
          "develop",
          "carry",
          "break",
          "receive",
          "agree",
          "support",
          "hit",
          "produce",
          "eat",
          "cover",
          "catch",
          "draw",
          "choose",
          "cause",
          "provide",
          "happen",
          "focus",
          "routine",
          "values",
          "staying",
          "define",
          "divide",
          "establish",
          "consistency",
          "track",
          "progress",
          "seeing",
          "celebrate",
          "positive",
          "believing",
          "accountability",
          "share",
          "being",
          "eliminate",
          "distractions",
          "identify",
          "reflect",
          "adjust",
          "regularly",
          "practice",
          "patience",
          "connect",
          "habits",
          "align",
          "clear",
          "goals",
          "break",
          "down",
          "create",
          "use",
          "reminders",
          "keep",
          "reward",
          "yourself",
          "stay",
          "share",
          "being",
          "eliminate",
          "identify",
          "reflect",
          "adjust",
          "regularly",
          "practice",
          "understand",
          "connect",
          "align"
        ]);
        const comparisonPatterns = [
          /(?:compared to|vs\.?|versus|alternative to|instead of|rather than)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)+)(?:[.,;]|\s+is|\s+are|$)/gi,
          /([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)+)\s+(?:is|are)\s+(?:a|an|another)\s+(?:good|popular|better|alternative|leading|major)\s+(?:option|choice|solution|company|service|platform|tool)/gi,
          /(?:competitors?|alternatives?|similar|other)\s+(?:include|are|like)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)+)/gi
        ];
        for (const pattern of comparisonPatterns) {
          let match;
          while ((match = pattern.exec(text)) !== null) {
            const name = match[1].trim();
            const words = name.split(/\s+/);
            if (words.length >= 2 && name.length >= 4 && name.length < 50) {
              const firstWord = words[0].toLowerCase();
              if (!commonWords.has(firstWord) && !commonWords.has(name.toLowerCase())) {
                competitors.add(name);
              }
            }
          }
        }
        const companyPatterns = [
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:Inc|LLC|Ltd|Corp|Corporation|Company|Co|Group|Solutions|Services|Technologies|Tech|Systems|Software|Digital|Media|Consulting|Partners|Associates|Enterprises|Industries|International|Global|Worldwide)\b/gi,
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s+(?:is|are|offers|provides|delivers|creates|develops|designs|builds|sells|manufactures)\s+(?:a|an|the)\s+[a-z]+/gi
        ];
        for (const pattern of companyPatterns) {
          let match;
          while ((match = pattern.exec(text)) !== null) {
            const name = match[1].trim();
            const words = name.split(/\s+/);
            if (words.length >= 2 && name.length >= 4 && name.length < 50) {
              const firstWord = words[0].toLowerCase();
              if (!commonWords.has(firstWord)) {
                competitors.add(name);
              }
            }
          }
        }
        return Array.from(competitors);
      }
      countMentions(text, competitor) {
        const regex = new RegExp(
          `\\b${this.escapeRegex(competitor)}\\b`,
          "gi"
        );
        const matches = text.match(regex);
        return matches ? matches.length : 0;
      }
      extractContexts(text, competitor) {
        const contexts = [];
        const sentences = text.split(/[.!?]+/);
        for (const sentence of sentences) {
          if (new RegExp(`\\b${this.escapeRegex(competitor)}\\b`, "i").test(sentence)) {
            contexts.push(sentence.trim());
          }
        }
        return contexts.slice(0, 3);
      }
      extractRelevantCitations(citations, competitor) {
        return citations.filter((citation) => {
          const text = `${citation.title || ""} ${citation.snippet || ""}`.toLowerCase();
          return text.includes(competitor.toLowerCase());
        });
      }
      escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
    };
    __name(CompetitorDetector, "CompetitorDetector");
  }
});

// src/analysis/sentiment.ts
var SentimentAnalyzer;
var init_sentiment = __esm({
  "src/analysis/sentiment.ts"() {
    "use strict";
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    SentimentAnalyzer = class {
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
  }
});

// src/analysis/index.ts
var analysis_exports = {};
__export(analysis_exports, {
  AnalysisEngine: () => AnalysisEngine,
  BrandMentionDetector: () => BrandMentionDetector,
  CompetitorDetector: () => CompetitorDetector,
  SentimentAnalyzer: () => SentimentAnalyzer
});
var AnalysisEngine;
var init_analysis = __esm({
  "src/analysis/index.ts"() {
    "use strict";
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_brand_mention();
    init_competitor();
    init_sentiment();
    init_brand_mention();
    init_competitor();
    init_sentiment();
    AnalysisEngine = class {
      brandMentionDetector;
      competitorDetector;
      sentimentAnalyzer;
      brandName;
      constructor(brandName, fuzzyThreshold = 0.7, knownCompetitors) {
        this.brandName = brandName;
        this.brandMentionDetector = new BrandMentionDetector(
          brandName,
          fuzzyThreshold
        );
        this.competitorDetector = new CompetitorDetector(brandName);
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
        const competitors = this.competitorDetector.detectCompetitors(response);
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
        const competitorDetails = competitors.map((c) => ({
          name: c.name,
          count: c.count,
          locations: c.citations
          // URLs where competitor is mentioned
        }));
        return {
          promptId: prompt.id,
          brandMentions,
          citationCount: response.citations.length,
          citationUrls: response.citations.map((c) => c.url),
          brandCitations,
          competitors,
          sentiment,
          timestamp: response.timestamp,
          // Structured answers
          isMentioned,
          mentionCount,
          isCited,
          citationDetails,
          competitorDetails
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
            competitorMentionRate: 0,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
        const totalPrompts = categoryPrompts.length;
        const promptsWithBrandMentions = categoryAnalyses.filter(
          (a) => a.brandMentions.exact > 0 || a.brandMentions.fuzzy > 0
        ).length;
        const promptsWithCompetitors = categoryAnalyses.filter(
          (a) => a.competitors.length > 0
        ).length;
        const totalCitations = categoryAnalyses.reduce(
          (sum, a) => sum + a.citationCount,
          0
        );
        const visibilityScore = this.calculateVisibilityScore(categoryAnalyses);
        const citationRate = totalCitations / totalPrompts;
        const brandMentionRate = promptsWithBrandMentions / totalPrompts;
        const competitorMentionRate = promptsWithCompetitors / totalPrompts;
        return {
          categoryId,
          visibilityScore,
          citationRate,
          brandMentionRate,
          competitorMentionRate,
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
        const competitorMentions = /* @__PURE__ */ new Map();
        for (const analysis of analyses) {
          for (const competitor of analysis.competitors) {
            competitorMentions.set(
              competitor.name,
              (competitorMentions.get(competitor.name) || 0) + competitor.count
            );
          }
        }
        const totalCompetitorMentions = Array.from(
          competitorMentions.values()
        ).reduce((sum, count) => sum + count, 0);
        const totalAllMentions = totalMentions + totalCompetitorMentions;
        const brandShare = totalAllMentions > 0 ? totalMentions / totalAllMentions * 100 : 0;
        const competitorShares = {};
        for (const [name, count] of competitorMentions.entries()) {
          competitorShares[name] = totalAllMentions > 0 ? count / totalAllMentions * 100 : 0;
        }
        const whiteSpaceTopics = prompts.filter((p) => {
          const analysis = analyses.find((a) => a.promptId === p.id);
          if (!analysis)
            return true;
          return analysis.brandMentions.exact === 0 && analysis.brandMentions.fuzzy === 0 && analysis.competitors.length === 0;
        }).map((p) => p.question);
        const dominatedPrompts = prompts.filter((p) => {
          const analysis = analyses.find((a) => a.promptId === p.id);
          if (!analysis)
            return false;
          const brandCount = analysis.brandMentions.exact + analysis.brandMentions.fuzzy;
          const competitorCount = analysis.competitors.reduce(
            (sum, c) => sum + c.count,
            0
          );
          return competitorCount > brandCount && brandCount === 0;
        }).map((p) => p.id);
        const missingBrandPrompts = prompts.filter((p) => {
          const analysis = analyses.find((a) => a.promptId === p.id);
          if (!analysis)
            return true;
          return analysis.brandMentions.exact === 0 && analysis.brandMentions.fuzzy === 0;
        }).map((p) => p.id);
        return {
          brandShare,
          competitorShares,
          whiteSpaceTopics,
          dominatedPrompts,
          missingBrandPrompts,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    };
    __name(AnalysisEngine, "AnalysisEngine");
  }
});

// .wrangler/tmp/bundle-doaM6S/middleware-loader.entry.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// .wrangler/tmp/bundle-doaM6S/middleware-insertion-facade.js
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/index.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/api/routes.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/engine_workflow.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_config();
init_sitemap();

// src/ingestion/index.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/ingestion/crawler.ts
init_strip_cf_connecting_ip_header();
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

// src/ingestion/scraper.ts
init_strip_cf_connecting_ip_header();
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

// src/categorization/index.ts
init_strip_cf_connecting_ip_header();
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

// src/prompt_generation/index.ts
init_strip_cf_connecting_ip_header();
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

// src/engine_workflow.ts
init_llm_execution();
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
  // Step 2: Fetch content from URLs
  async step2FetchContent(runId, urls, language, env) {
    const db = new Database(env.geo_db);
    await db.db.prepare("UPDATE analysis_runs SET step = ?, updated_at = ? WHERE id = ?").bind("content", (/* @__PURE__ */ new Date()).toISOString(), runId).run();
    const urlsToFetch = urls.slice(0, 50);
    let pageCount = 0;
    const allContent = [];
    for (const url of urlsToFetch) {
      try {
        const response = await fetch(url, {
          headers: { "User-Agent": this.config.crawling.userAgent },
          signal: AbortSignal.timeout(this.config.crawling.timeout)
        });
        if (response.ok) {
          const html = await response.text();
          const textContent = this.extractTextContent(html);
          allContent.push(textContent);
          pageCount++;
        }
      } catch (error) {
        continue;
      }
    }
    const combinedContent = allContent.join("\n\n");
    await db.db.prepare("UPDATE analysis_runs SET step = ?, updated_at = ? WHERE id = ?").bind("categories", (/* @__PURE__ */ new Date()).toISOString(), runId).run();
    return { pageCount, content: combinedContent };
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
  async step4GeneratePrompts(runId, categories, userInput, content, env, questionsPerCategory = 3, companyId) {
    const db = new Database(env.geo_db);
    const allPrompts = [];
    for (const category of categories) {
      try {
        const categoryPrompts = await this.generateCategoryPromptsWithGPT(
          category,
          userInput,
          content,
          questionsPerCategory,
          // Use user-specified count
          runId
        );
        allPrompts.push(...categoryPrompts);
      } catch (error) {
        console.error(`Error generating prompts for category ${category.name}:`, error);
        const fallbackPrompts = this.promptGenerator.generatePrompts(
          [category],
          userInput,
          questionsPerCategory
          // Use the same count as requested
        );
        allPrompts.push(...fallbackPrompts);
      }
    }
    await db.savePrompts(runId, allPrompts);
    if (companyId) {
      for (const prompt of allPrompts) {
        const category = categories.find((c) => c.id === prompt.categoryId);
        await db.saveCompanyPrompt({
          companyId,
          question: prompt.question,
          categoryId: prompt.categoryId || null,
          categoryName: category?.name || null,
          language: prompt.language,
          country: prompt.country || null,
          region: prompt.region || null,
          isActive: true
        });
      }
      console.log(`Saved ${allPrompts.length} prompts to company_prompts for company ${companyId}`);
    }
    await db.db.prepare(
      "UPDATE analysis_runs SET prompts_generated = ?, step = ?, updated_at = ? WHERE id = ?"
    ).bind(
      allPrompts.length,
      "prompts",
      (/* @__PURE__ */ new Date()).toISOString(),
      runId
    ).run();
    return allPrompts;
  }
  async generateCategoryPromptsWithGPT(category, userInput, content, count, runId) {
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
      for (let i = 0; i < questions.length && i < count; i++) {
        const question = questions[i];
        if (question && typeof question === "string" && question.trim().length > 0) {
          prompts.push({
            id: `prompt_${runId}_${category.id}_${i}`,
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
        console.warn(`Only got ${prompts.length} questions for category ${category.name}, using fallback for remaining`);
        const fallbackPrompts = this.promptGenerator.generatePrompts([category], userInput, count - prompts.length);
        prompts.push(...fallbackPrompts.slice(0, count - prompts.length));
      }
      return prompts;
    } catch (error) {
      console.error(`Error generating prompts for category ${category.name}:`, error);
      console.error("Error details:", error?.message || error, error?.stack);
      const fallbackPrompts = this.promptGenerator.generatePrompts([category], userInput, count);
      return fallbackPrompts;
    }
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
  async step5ExecutePrompts(runId, prompts, env) {
    const db = new Database(env.geo_db);
    await db.db.prepare("UPDATE analysis_runs SET step = ?, updated_at = ? WHERE id = ?").bind("execution", (/* @__PURE__ */ new Date()).toISOString(), runId).run();
    const responses = await this.llmExecutor.executePrompts(prompts);
    await db.saveLLMResponses(responses);
    await db.db.prepare("UPDATE analysis_runs SET step = ?, updated_at = ? WHERE id = ?").bind("completed", (/* @__PURE__ */ new Date()).toISOString(), runId).run();
    return { executed: responses.length };
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
  async saveUserPrompts(runId, prompts, env) {
    const db = new Database(env.geo_db);
    await db.db.prepare(
      "UPDATE analysis_runs SET selected_prompts = ?, updated_at = ? WHERE id = ?"
    ).bind(JSON.stringify(prompts), (/* @__PURE__ */ new Date()).toISOString(), runId).run();
  }
};
__name(WorkflowEngine, "WorkflowEngine");

// src/api/routes.ts
init_db();
var APIRoutes = class {
  constructor(engine) {
    this.engine = engine;
  }
  workflowEngine;
  async handleRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      if (!this.workflowEngine) {
        this.workflowEngine = new WorkflowEngine(env);
      }
      if (path === "/api/workflow/step1" && request.method === "POST") {
        return await this.handleStep1(request, env, corsHeaders);
      }
      if (path === "/api/workflow/step2" && request.method === "POST") {
        return await this.handleStep2(request, env, corsHeaders);
      }
      if (path === "/api/workflow/step3" && request.method === "POST") {
        return await this.handleStep3(request, env, corsHeaders);
      }
      if (path.includes("/categories") && path.startsWith("/api/workflow/") && request.method === "PUT") {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.handleSaveCategories(runId, request, env, corsHeaders);
        }
      }
      if (path === "/api/workflow/step4" && request.method === "POST") {
        return await this.handleStep4(request, env, corsHeaders);
      }
      if (path.includes("/prompts") && path.startsWith("/api/workflow/") && request.method === "PUT") {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.handleSavePrompts(runId, request, env, corsHeaders);
        }
      }
      if (path === "/api/workflow/fetchUrl" && request.method === "POST") {
        return await this.handleFetchUrl(request, env, corsHeaders);
      }
      if (path === "/api/workflow/executePrompt" && request.method === "POST") {
        return await this.handleExecutePrompt(request, env, corsHeaders);
      }
      if (path === "/api/chat" && request.method === "POST") {
        return await this.handleChat(request, env, corsHeaders);
      }
      if (path === "/api/test/analyze" && request.method === "POST") {
        return await this.handleTestAnalyze(request, env, corsHeaders);
      }
      if (path === "/api/workflow/generateSummary" && request.method === "POST") {
        return await this.handleGenerateSummary(request, env, corsHeaders);
      }
      if (path === "/api/workflow/step5" && request.method === "POST") {
        return await this.handleStep5(request, env, corsHeaders);
      }
      if (path === "/api/scheduler/execute" && request.method === "POST") {
        return await this.handleExecuteScheduledRun(request, env, corsHeaders);
      }
      if (path === "/api/analyze" && request.method === "POST") {
        return await this.handleAnalyze(request, env, corsHeaders);
      }
      if (path === "/api/analyses" && request.method === "GET") {
        return await this.handleGetAllAnalyses(request, env, corsHeaders);
      }
      if (path.startsWith("/api/analysis/") && request.method === "DELETE") {
        const runId = path.split("/").pop();
        if (runId && runId !== "analyses") {
          return await this.handleDeleteAnalysis(runId, env, corsHeaders);
        }
      }
      if (path.startsWith("/api/analysis/") && path.endsWith("/pause") && request.method === "PUT") {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.handlePauseAnalysis(runId, env, corsHeaders);
        }
      }
      if (path.startsWith("/api/analysis/") && request.method === "GET") {
        const runId = path.split("/").pop();
        if (runId && runId !== "analyses") {
          if (path.includes("/insights")) {
            const pathParts = path.split("/");
            const actualRunId = pathParts[pathParts.length - 2];
            if (actualRunId && actualRunId !== "analyses") {
              return await this.handleGetAnalysisInsights(actualRunId, env, corsHeaders);
            }
          }
          return await this.handleGetAnalysis(runId, env, corsHeaders);
        }
      }
      if (path.includes("/status") && path.startsWith("/api/analysis/") && !path.includes("/metrics") && request.method === "GET") {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.handleGetStatus(runId, env, corsHeaders);
        }
      }
      if (path.includes("/metrics") && path.startsWith("/api/analysis/") && request.method === "GET") {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.handleGetMetrics(runId, env, corsHeaders);
        }
      }
      if (path === "/api/health" && request.method === "GET") {
        return new Response(
          JSON.stringify({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      if (path === "/api/ai-readiness/analyze" && request.method === "POST") {
        return await this.handleAIReadinessAnalyze(request, env, corsHeaders);
      }
      if (path.startsWith("/api/ai-readiness/status/") && request.method === "GET") {
        const runId = path.split("/").pop();
        if (runId) {
          return await this.handleAIReadinessStatus(runId, env, corsHeaders);
        }
      }
      if (path === "/api/ai-readiness/analyze" && request.method === "POST") {
        return await this.handleAIReadinessAnalyze(request, env, corsHeaders);
      }
      if (path.startsWith("/api/ai-readiness/status/") && request.method === "GET") {
        const runId = path.split("/").pop();
        if (runId) {
          return await this.handleAIReadinessStatus(runId, env, corsHeaders);
        }
      }
      if (path === "/api/setup/database" && request.method === "POST") {
        return await this.handleSetupDatabase(request, env, corsHeaders);
      }
      if (path === "/api/companies" && request.method === "GET") {
        const db = new Database(env.geo_db);
        const companies = await db.getAllCompanies();
        return new Response(JSON.stringify(companies), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (path === "/api/companies" && request.method === "POST") {
        const body = await request.json();
        const db = new Database(env.geo_db);
        const companyId = await db.createCompany({
          name: body.name,
          websiteUrl: body.websiteUrl,
          country: body.country,
          language: body.language,
          region: body.region,
          description: body.description,
          isActive: true
        });
        const company = await db.getCompany(companyId);
        return new Response(JSON.stringify(company), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (path.startsWith("/api/companies/") && request.method === "GET") {
        const companyId = path.split("/")[3];
        const db = new Database(env.geo_db);
        const company = await db.getCompany(companyId);
        if (!company) {
          return new Response(JSON.stringify({ error: "Company not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        return new Response(JSON.stringify(company), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (path.includes("/prompts") && path.startsWith("/api/companies/") && request.method === "GET") {
        const companyId = path.split("/")[3];
        const db = new Database(env.geo_db);
        const prompts = await db.getCompanyPrompts(companyId);
        return new Response(JSON.stringify(prompts), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (path.includes("/runs") && path.startsWith("/api/companies/") && request.method === "GET") {
        const companyId = path.split("/")[3];
        const url2 = new URL(request.url);
        const detailed = url2.searchParams.get("detailed") === "true";
        const db = new Database(env.geo_db);
        if (detailed) {
          return await this.handleGetCompanyAnalysisRunsDetailed(companyId, env, corsHeaders);
        } else {
          const runs = await db.getCompanyAnalysisRuns(companyId);
          return new Response(JSON.stringify(runs), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }
      if (path.includes("/timeseries") && path.startsWith("/api/companies/") && request.method === "GET") {
        const companyId = path.split("/")[3];
        const url2 = new URL(request.url);
        const days = parseInt(url2.searchParams.get("days") || "30");
        const db = new Database(env.geo_db);
        const timeSeries = await db.getCompanyTimeSeries(companyId, days);
        return new Response(JSON.stringify(timeSeries), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (path === "/api/schedules" && request.method === "GET") {
        const url2 = new URL(request.url);
        const companyId = url2.searchParams.get("companyId") || void 0;
        const db = new Database(env.geo_db);
        const schedules = await db.getScheduledRuns(companyId, true);
        return new Response(JSON.stringify(schedules), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (path === "/api/schedules" && request.method === "POST") {
        const body = await request.json();
        const db = new Database(env.geo_db);
        const now = /* @__PURE__ */ new Date();
        let nextRunAt = new Date(now);
        if (body.scheduleType === "daily") {
          nextRunAt.setDate(nextRunAt.getDate() + 1);
        } else if (body.scheduleType === "weekly") {
          nextRunAt.setDate(nextRunAt.getDate() + 7);
        } else if (body.scheduleType === "monthly") {
          nextRunAt.setMonth(nextRunAt.getMonth() + 1);
        }
        const scheduleId = await db.createScheduledRun({
          companyId: body.companyId,
          scheduleType: body.scheduleType,
          nextRunAt: nextRunAt.toISOString(),
          isActive: true
        });
        const schedule = await db.getScheduledRuns(void 0, false);
        const created = schedule.find((s) => s.id === scheduleId);
        return new Response(JSON.stringify(created), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (path.startsWith("/api/schedules/") && request.method === "PUT") {
        const scheduleId = path.split("/")[3];
        const body = await request.json();
        const db = new Database(env.geo_db);
        if (body.scheduleType) {
          const now = /* @__PURE__ */ new Date();
          let nextRunAt = new Date(now);
          if (body.scheduleType === "daily") {
            nextRunAt.setDate(nextRunAt.getDate() + 1);
          } else if (body.scheduleType === "weekly") {
            nextRunAt.setDate(nextRunAt.getDate() + 7);
          } else if (body.scheduleType === "monthly") {
            nextRunAt.setMonth(nextRunAt.getMonth() + 1);
          }
          body.nextRunAt = nextRunAt.toISOString();
        }
        await db.updateScheduledRun(scheduleId, body);
        const schedules = await db.getScheduledRuns(void 0, false);
        const updated = schedules.find((s) => s.id === scheduleId);
        return new Response(JSON.stringify(updated), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (path === "/" && request.method === "GET") {
        const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GEO Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u{1F310}</text></svg>">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --accent: #0ea5e9;
      --text: #0f172a;
      --text-light: #64748b;
      --border: #e2e8f0;
      --bg: #ffffff;
      --bg-secondary: #f8fafc;
      --bg-hover: #f1f5f9;
      --success: #059669;
      --warning: #d97706;
      --error: #dc2626;
      --sidebar-width: 240px;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-secondary);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .app-container {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: var(--sidebar-width);
      background: var(--bg);
      border-right: 1px solid var(--border);
      position: fixed;
      height: 100vh;
      left: 0;
      top: 0;
      z-index: 1000;
      overflow-y: auto;
    }
    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid var(--border);
    }
    .sidebar-header h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .sidebar-header p {
      font-size: 11px;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 1.2px;
      font-weight: 500;
    }
    .sidebar-nav {
      padding: 12px 0;
    }
    .nav-item {
      padding: 10px 20px;
      color: var(--text-light);
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 500;
    }
    .nav-item:hover {
      background: var(--bg-hover);
      color: var(--text);
    }
    .nav-item.active {
      background: var(--bg-hover);
      color: var(--primary);
      border-left: 3px solid var(--primary);
      padding-left: 17px;
    }
    .nav-item-icon {
      width: 18px;
      font-size: 16px;
    }
    .main-content {
      margin-left: var(--sidebar-width);
      flex: 1;
      min-height: 100vh;
    }
    .top-header {
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      padding: 18px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .top-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -0.3px;
    }
    .content-area {
      padding: 32px;
      max-width: 1200px;
    }
    .card {
      background: var(--bg);
      border-radius: 8px;
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .card-header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-header h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -0.2px;
    }
    .card-body {
      padding: 24px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .form-group label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }
    .form-group input,
    .form-group select {
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.15s;
      background: var(--bg);
      color: var(--text);
      font-family: inherit;
    }
    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
    }
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      font-family: inherit;
    }
    .btn-primary {
      background: var(--primary);
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      background: var(--primary-hover);
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-block {
      width: 100%;
      justify-content: center;
    }
    /* Progress */
    .progress-container {
      background: var(--gray-100);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--gray-200);
      border-radius: 4px;
      overflow: hidden;
      margin: 16px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%);
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }
    .progress-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: shimmer 2s infinite;
    }
    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    .progress-text {
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-700);
      margin-top: 12px;
    }
    /* Status Messages */
    .status-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid var(--gray-200);
      margin: 20px 0;
    }
    .status-title {
      font-weight: 600;
      color: var(--gray-900);
      margin-bottom: 8px;
      font-size: 15px;
    }
    .status-details {
      color: var(--gray-600);
      font-size: 14px;
    }
    /* Results */
    .results-container {
      margin-top: 32px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    .data-table th {
      text-align: left;
      padding: 12px 16px;
      background: var(--gray-50);
      font-size: 12px;
      font-weight: 600;
      color: var(--gray-700);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid var(--gray-200);
    }
    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--gray-200);
      font-size: 14px;
      color: var(--gray-700);
    }
    .data-table tr:hover {
      background: var(--gray-50);
    }
    /* Badges */
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .badge-warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .badge-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
    .badge-primary { background: rgba(99, 102, 241, 0.1); color: var(--primary); }
    /* Loading */
    .loading {
      display: none;
    }
    .loading.show {
      display: block;
    }
    /* Responsive */
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s;
      }
      .main-content {
        margin-left: 0;
      }
      .form-grid {
        grid-template-columns: 1fr;
      }
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
  <script>
    // GLOBAL FUNCTIONS - available immediately (before DOMContentLoaded)
    // These must be defined before any HTML tries to call them
    (function() {
      window.showDashboard = function(event) {
        if (event) event.preventDefault();
        const analysesSection = document.getElementById('analysesSection');
        const analysisDetailSection = document.getElementById('analysisDetailSection');
        const aiReadinessSection = document.getElementById('aiReadinessSection');
        const analysisSection = document.querySelector('.content-area > .card');
        if (analysesSection) analysesSection.style.display = 'none';
        if (analysisDetailSection) analysisDetailSection.style.display = 'none';
        if (aiReadinessSection) aiReadinessSection.style.display = 'none';
        if (analysisSection) analysisSection.style.display = 'block';
        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        if (event && event.target) {
          event.target.closest('.nav-item')?.classList.add('active');
        } else {
          const dashboardNav = document.querySelector('.nav-item');
          if (dashboardNav) dashboardNav.classList.add('active');
        }
        if (window.showDashboardFull) {
          window.showDashboardFull(event);
        }
      };
      
      window.showAnalyses = function(event) {
        if (event) event.preventDefault();
        const analysesSection = document.getElementById('analysesSection');
        const analysisDetailSection = document.getElementById('analysisDetailSection');
        const aiReadinessSection = document.getElementById('aiReadinessSection');
        const analysisSection = document.querySelector('.content-area > .card');
        if (analysesSection) analysesSection.style.display = 'block';
        if (analysisDetailSection) analysisDetailSection.style.display = 'none';
        if (aiReadinessSection) aiReadinessSection.style.display = 'none';
        if (analysisSection) analysisSection.style.display = 'none';
        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        if (event && event.target) {
          event.target.closest('.nav-item')?.classList.add('active');
        }
        if (window.loadAnalyses) {
          window.loadAnalyses();
        } else if (window.showAnalysesFull) {
          window.showAnalysesFull(event);
        }
      };
      
      window.showAIReadiness = function(event) {
        if (event) event.preventDefault();
        const analysesSection = document.getElementById('analysesSection');
        const analysisDetailSection = document.getElementById('analysisDetailSection');
        const aiReadinessSection = document.getElementById('aiReadinessSection');
        const analysisSection = document.querySelector('.content-area > .card');
        if (analysesSection) analysesSection.style.display = 'none';
        if (analysisDetailSection) analysisDetailSection.style.display = 'none';
        if (aiReadinessSection) aiReadinessSection.style.display = 'block';
        if (analysisSection) analysisSection.style.display = 'none';
        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        if (event && event.target) {
          event.target.closest('.nav-item')?.classList.add('active');
        }
        if (window.showAIReadinessFull) {
          window.showAIReadinessFull(event);
        }
      };
      
      window.startAIReadiness = async function() {
        // Direct implementation - no need to wait for DOMContentLoaded
        const urlInput = document.getElementById('aiReadinessUrl');
        const url = urlInput?.value?.trim();
        
        if (!url) {
          alert('Bitte geben Sie eine URL ein.');
          return;
        }
        
        // Auto-add https:// if missing
        let websiteUrl = url;
        const urlPattern = new RegExp('^https?:\\/\\/', 'i');
        if (!urlPattern.test(websiteUrl)) {
          websiteUrl = 'https://' + websiteUrl;
        }
        
        // Validate URL
        try {
          new URL(websiteUrl);
        } catch (e) {
          alert('Ung\xFCltige URL. Bitte geben Sie eine g\xFCltige URL ein.');
          return;
        }
        
        // Update input field with normalized URL
        if (urlInput) {
          urlInput.value = websiteUrl;
        }
        
        const loadingEl = document.getElementById('aiReadinessLoading');
        const resultsEl = document.getElementById('aiReadinessResults');
        const statusEl = document.getElementById('aiReadinessStatus');
        const statusDetailsEl = document.getElementById('aiReadinessStatusDetails');
        const progressEl = document.getElementById('aiReadinessProgress');
        const progressTextEl = document.getElementById('aiReadinessProgressText');
        const resultsContentEl = document.getElementById('aiReadinessResultsContent');
        const startBtn = document.getElementById('startAIReadinessBtn');
        
        if (loadingEl) {
          loadingEl.style.display = 'block';
          loadingEl.classList.add('show');
        }
        if (resultsEl) resultsEl.style.display = 'none';
        if (statusEl) statusEl.textContent = 'Vorbereitung...';
        if (statusDetailsEl) statusDetailsEl.textContent = 'Starte AI Readiness Check...';
        if (progressEl) progressEl.style.width = '0%';
        if (progressTextEl) progressTextEl.textContent = '0%';
        if (startBtn) {
          startBtn.disabled = true;
          startBtn.textContent = 'L\xE4uft...';
        }
        
        try {
          // Step 1: Start analysis
          if (statusEl) statusEl.textContent = 'Schritt 1: Starte Analyse...';
          if (statusDetailsEl) statusDetailsEl.textContent = 'Hole robots.txt und Sitemap...';
          if (progressEl) progressEl.style.width = '10%';
          if (progressTextEl) progressTextEl.textContent = '10%';
          
          const step1Response = await fetch('/api/ai-readiness/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ websiteUrl })
          });
          
          if (!step1Response.ok) {
            throw new Error('Fehler beim Starten der Analyse');
          }
          
          const step1Data = await step1Response.json();
          const runId = step1Data.runId;
          
          // Step 2: Poll for status updates with live progress
          let attempts = 0;
          const maxAttempts = 120; // 10 minutes max (2 second intervals)
          let lastMessage = '';
          let pollingStopped = false;
          
          // Centralized error handler
          const handlePollingError = function(error) {
            pollingStopped = true;
            console.error('Error in AI Readiness polling:', error);
            if (statusEl) statusEl.textContent = '\u274C Fehler';
            if (statusDetailsEl) statusDetailsEl.textContent = error instanceof Error ? error.message : 'Unbekannter Fehler';
            if (startBtn) {
              startBtn.disabled = false;
              startBtn.textContent = 'AI Readiness Check starten';
            }
            if (loadingEl) {
              setTimeout(() => {
                if (loadingEl) {
                  loadingEl.style.display = 'none';
                  loadingEl.classList.remove('show');
                }
              }, 2000);
            }
            alert('Fehler beim AI Readiness Check: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
          };
          
          const pollStatus = async function() {
            if (pollingStopped) {
              return;
            }
            
            attempts++;
            
            try {
              const statusResponse = await fetch('/api/ai-readiness/status/' + runId);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                
                // Update UI with live status
                if (statusData.message && statusData.message !== lastMessage) {
                  lastMessage = statusData.message;
                  if (statusDetailsEl) {
                    statusDetailsEl.textContent = statusData.message;
                  }
                  
                  // Update progress based on message content
                  if (statusData.message.includes('robots.txt')) {
                    if (progressEl) progressEl.style.width = '20%';
                    if (progressTextEl) progressTextEl.textContent = '20%';
                    if (statusEl) statusEl.textContent = 'Schritt 1: robots.txt und Sitemap';
                  } else if (statusData.message.includes('Sitemap gefunden')) {
                    if (progressEl) progressEl.style.width = '30%';
                    if (progressTextEl) progressTextEl.textContent = '30%';
                    if (statusEl) statusEl.textContent = 'Schritt 2: Sitemap gefunden';
                  } else if (statusData.message.includes('Hole Seiten-Inhalte')) {
                    const progressMatch = new RegExp('(\\\\d+)/(\\\\d+)');
                    const match = statusData.message.match(progressMatch);
                    if (match) {
                      const current = parseInt(match[1]);
                      const total = parseInt(match[2]);
                      const percent = 30 + Math.floor((current / total) * 50); // 30% to 80%
                      if (progressEl) progressEl.style.width = percent + '%';
                      if (progressTextEl) progressTextEl.textContent = percent + '%';
                      if (statusEl) statusEl.textContent = 'Schritt 3: Seiten-Inhalte holen';
                    }
                  } else if (statusData.message.includes('Generiere AI Readiness')) {
                    if (progressEl) progressEl.style.width = '85%';
                    if (progressTextEl) progressTextEl.textContent = '85%';
                    if (statusEl) statusEl.textContent = 'Schritt 4: GPT-Analyse';
                  }
                }
                
                if (statusData.status === 'completed') {
                  // Analysis complete
                  pollingStopped = true;
                  if (statusEl) statusEl.textContent = '\u2705 Analyse abgeschlossen';
                  if (statusDetailsEl) statusDetailsEl.textContent = 'AI Readiness Check erfolgreich durchgef\xFChrt';
                  if (progressEl) progressEl.style.width = '100%';
                  if (progressTextEl) progressTextEl.textContent = '100%';
                  
                  if (resultsContentEl && statusData.recommendations) {
                    resultsContentEl.innerHTML = 
                      '<div style="white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #374151;">' +
                      statusData.recommendations.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
                      '</div>';
                  }
                  
                  if (resultsEl) resultsEl.style.display = 'block';
                  if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.textContent = 'AI Readiness Check starten';
                  }
                  
                  // Hide loading after a delay
                  setTimeout(() => {
                    if (loadingEl) {
                      loadingEl.style.display = 'none';
                      loadingEl.classList.remove('show');
                    }
                  }, 2000);
                  
                  return; // Stop polling
                } else if (statusData.status === 'error') {
                  // Critical error - stop polling and handle
                  handlePollingError(new Error(statusData.error || 'Fehler bei der Analyse'));
                  return;
                }
              }
              
              // Check timeout before continuing
              if (attempts >= maxAttempts) {
                handlePollingError(new Error('Timeout: Die Analyse hat zu lange gedauert.'));
                return;
              }
              
              // Continue polling every 2 seconds for faster updates
              // All errors in scheduled calls are handled by the catch block
              setTimeout(() => {
                pollStatus().catch(handlePollingError);
              }, 2000);
              
            } catch (error) {
              // Check if this is a critical error that should stop polling
              const isCriticalError = error instanceof Error && (
                error.message.includes('Timeout') || 
                error.message.includes('Fehler bei der Analyse')
              );
              
              if (isCriticalError) {
                handlePollingError(error);
                return;
              }
              
              // Non-critical error - log and continue
              console.error('Non-critical error polling status:', error);
              
              // Check timeout even on error
              if (attempts >= maxAttempts) {
                handlePollingError(new Error('Timeout: Die Analyse hat zu lange gedauert.'));
                return;
              }
              
              // Continue polling on non-critical errors
              setTimeout(() => {
                pollStatus().catch(handlePollingError);
              }, 2000);
            }
          };
          
          // Start polling and handle errors
          pollStatus().catch(handlePollingError);
          
        } catch (error) {
          console.error('Error in AI Readiness check:', error);
          if (statusEl) statusEl.textContent = '\u274C Fehler';
          if (statusDetailsEl) statusDetailsEl.textContent = error instanceof Error ? error.message : 'Unbekannter Fehler';
          alert('Fehler beim AI Readiness Check: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
          if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'AI Readiness Check starten';
          }
          if (loadingEl) {
            setTimeout(() => {
              loadingEl.style.display = 'none';
              loadingEl.classList.remove('show');
            }, 2000);
          }
        }
      };
    })();
  <\/script>
</head>
<body>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>GEO</h1>
        <p>Engine Optimization</p>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-item active" onclick="showDashboard(event)">
          <span>Dashboard</span>
        </div>
        <div class="nav-item" onclick="showAnalyses(event)">
          <span>Analysen</span>
        </div>
        <div class="nav-item" onclick="showAIReadiness(event)">
          <span>AI Readiness</span>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="top-header">
        <h2>Neue Analyse starten</h2>
        <div style="display: flex; gap: 12px; align-items: center;">
          <span style="font-size: 14px; color: var(--gray-500);">Status: Bereit</span>
        </div>
      </header>

      <div class="content-area">
        <!-- Analysis Form -->
        <div class="card">
          <div class="card-header">
            <h3>Analyse-Konfiguration</h3>
          </div>
          <div class="card-body">
            <form id="analyzeForm">
              <div class="form-grid">
                <div class="form-group">
                  <label for="websiteUrl">Website URL *</label>
                  <input type="url" id="websiteUrl" name="websiteUrl" 
                         placeholder="https://example.com" required>
                </div>
                <div class="form-group">
                  <label for="country">Land (ISO Code) *</label>
                  <input type="text" id="country" name="country" 
                         placeholder="CH, DE, US" maxlength="2" required>
                </div>
                <div class="form-group">
                  <label for="language">Sprache (ISO Code) *</label>
                  <select id="language" name="language" required>
                    <option value="de">Deutsch (de)</option>
                    <option value="en">English (en)</option>
                    <option value="fr">Fran\xE7ais (fr)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="region">Region (optional)</label>
                  <input type="text" id="region" name="region" 
                         placeholder="z.B. Zurich, Berlin">
                </div>
                <div class="form-group">
                  <label for="questionsPerCategory">Fragen pro Kategorie</label>
                  <input type="number" id="questionsPerCategory" name="questionsPerCategory" 
                         value="3" min="1" max="10" style="width: 100px;">
                  <small style="display: block; margin-top: 4px; color: var(--gray-500); font-size: 12px;">Anzahl der Fragen, die pro Kategorie generiert werden (Standard: 3)</small>
                </div>
              </div>
              <button type="button" id="startAnalysisBtn" class="btn btn-primary btn-block" 
                      onclick="if(window.startAnalysisNow){window.startAnalysisNow();}else{alert('startAnalysisNow nicht gefunden!');} return false;">
                Analyse starten
              </button>
            </form>

            <!-- Loading/Progress -->
            <div class="loading" id="loading" style="display: none;">
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                </div>
                <div class="progress-text" id="progressText">Initializing...</div>
              </div>
              <div class="status-card">
                <div class="status-title" id="currentStatus">Bereit zum Starten...</div>
                <div class="status-details" id="statusDetails"></div>
              </div>
            </div>

            <!-- Results -->
            <div id="result" style="display: none; margin-top: 24px;">
              <div class="card">
                <div class="card-header">
                  <h3>Analyse-Ergebnisse</h3>
                </div>
                <div class="card-body">
                  <div id="resultContent"></div>
                </div>
              </div>
            </div>

            <div id="resultsContainer" style="display: none; margin-top: 24px;">
              <div class="card">
                <div class="card-header">
                  <h3>Detaillierte Analyse-Ergebnisse</h3>
                </div>
                <div class="card-body">
                  <div id="resultsContent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analyses Section (hidden by default) -->
        <div id="analysesSection" style="display: none;">
          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h3>Gespeicherte Analysen</h3>
              <button class="btn btn-primary" onclick="if(typeof hideAllSections === 'function'){hideAllSections();} (function(){var card = document.querySelector('.content-area > .card'); if(card){card.style.display = 'block';}})();" style="padding: 8px 16px; font-size: 14px;">
                + Neue Analyse
              </button>
            </div>
            <div class="card-body">
              <div id="analysesList" style="display: grid; gap: 16px;">
                <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                  Lade Analysen...
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analysis Detail Section (hidden by default) -->
        <div id="analysisDetailSection" style="display: none;">
          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h3 id="analysisDetailTitle">Analyse Details</h3>
              <button class="btn" onclick="showAnalyses(event)" style="padding: 8px 16px; font-size: 14px; background: var(--gray-100); color: var(--gray-700);">
                \u2190 Zur\xFCck
              </button>
            </div>
            <div class="card-body">
              <div id="analysisDetailContent">
                <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                  Lade Analyse-Details...
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Readiness Section -->
        <div id="aiReadinessSection" style="display: none;">
          <div class="card">
            <div class="card-header">
              <h3>AI Readiness Check</h3>
              <p style="margin: 8px 0 0 0; color: var(--gray-600); font-size: 14px;">
                Analysiere die Website auf AI-Readiness: robots.txt, Sitemap und alle Seiten werden analysiert.
              </p>
            </div>
            <div class="card-body">
              <form id="aiReadinessForm">
                <div class="form-group">
                  <label for="aiReadinessUrl">Website URL *</label>
                  <input type="text" id="aiReadinessUrl" name="aiReadinessUrl" 
                         placeholder="example.com oder https://example.com" required>
                  <small style="display: block; margin-top: 4px; color: var(--gray-500); font-size: 12px;">
                    Die URL der zu analysierenden Website (https:// wird automatisch hinzugef\xFCgt)
                  </small>
                </div>
                <button type="button" id="startAIReadinessBtn" class="btn btn-primary btn-block" 
                        onclick="if(window.startAIReadiness){window.startAIReadiness();}else{alert('startAIReadiness nicht gefunden!');} return false;">
                  AI Readiness Check starten
                  </button>
                </form>
              
              <!-- Progress -->
              <div id="aiReadinessLoading" class="loading" style="margin-top: 24px;">
                <div class="status-card">
                  <div class="status-title" id="aiReadinessStatus">Vorbereitung...</div>
                  <div class="status-details" id="aiReadinessStatusDetails">Starte Analyse...</div>
                  <div class="progress-bar" style="margin-top: 16px;">
                    <div class="progress-fill" id="aiReadinessProgress" style="width: 0%;"></div>
                </div>
                  <div class="progress-text" id="aiReadinessProgressText">0%</div>
              </div>
              
              <!-- Console Log -->
              <div id="aiReadinessConsole" style="display: none; margin-top: 24px;">
                <div class="card" style="background: #1e1e1e; border: 1px solid #333;">
                  <div class="card-header" style="background: #2d2d2d; border-bottom: 1px solid #444; padding: 12px 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <h4 style="margin: 0; color: #fff; font-size: 14px; font-weight: 600;">\u{1F4CB} Console Log</h4>
                      <button type="button" id="clearConsoleBtn" style="background: #444; color: #fff; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">L\xF6schen</button>
                    </div>
                  </div>
                  <div class="card-body" style="padding: 16px;">
                    <div id="aiReadinessConsoleContent" style="background: #1e1e1e; color: #d4d4d4; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.6; max-height: 400px; overflow-y: auto; padding: 12px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word;">
                      <div style="color: #6a9955;">[System] Console bereit. Warte auf Logs...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              
              <!-- Results -->
              <div id="aiReadinessResults" style="display: none; margin-top: 32px;">
                <div class="card">
                  <div class="card-header">
                    <h3>AI Readiness Empfehlungen</h3>
          </div>
                  <div class="card-body" id="aiReadinessResultsContent">
                    <!-- Results werden hier angezeigt -->
        </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>

  <script>
    // GLOBAL FUNCTIONS - available immediately (before DOMContentLoaded)
    // These must be defined before any HTML tries to call them
    window.showDashboard = function(event) {
      if (event) event.preventDefault();
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const analysisSection = document.querySelector('.content-area > .card');
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (analysisSection) analysisSection.style.display = 'block';
      // Update navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      } else {
        // Set first nav item (Dashboard) as active
        const dashboardNav = document.querySelector('.nav-item');
        if (dashboardNav) dashboardNav.classList.add('active');
      }
      // Try to call full implementation if available
      if (window.showDashboardFull) {
        window.showDashboardFull(event);
      }
    };
    
    window.showAnalyses = function(event) {
      if (event) event.preventDefault();
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const aiReadinessSection = document.getElementById('aiReadinessSection');
      const analysisSection = document.querySelector('.content-area > .card');
      if (analysesSection) analysesSection.style.display = 'block';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (aiReadinessSection) aiReadinessSection.style.display = 'none';
      if (analysisSection) analysisSection.style.display = 'none';
      // Update navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      }
      // Try to load analyses if function is available
      if (window.loadAnalyses) {
        window.loadAnalyses();
      } else if (window.showAnalysesFull) {
        window.showAnalysesFull(event);
      } else {
        // Wait for DOMContentLoaded with max attempts
        let attempts = 0;
        const maxAttempts = 50;
        const tryLoad = function() {
          attempts++;
          if (window.loadAnalyses) {
            window.loadAnalyses();
          } else if (window.showAnalysesFull) {
            window.showAnalysesFull(event);
          } else if (attempts < maxAttempts) {
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                if (window.loadAnalyses) window.loadAnalyses();
                else if (window.showAnalysesFull) window.showAnalysesFull(event);
              });
            } else {
              setTimeout(tryLoad, 100);
            }
          } else {
            console.error('\u274C loadAnalyses not available after ' + maxAttempts + ' attempts');
          }
        };
        tryLoad();
      }
    };
    
    window.showAIReadiness = function(event) {
      if (event) event.preventDefault();
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const aiReadinessSection = document.getElementById('aiReadinessSection');
      const analysisSection = document.querySelector('.content-area > .card');
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (aiReadinessSection) aiReadinessSection.style.display = 'block';
      if (analysisSection) analysisSection.style.display = 'none';
      // Update navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      }
      // Try to call full implementation if available
      if (window.showAIReadinessFull) {
        window.showAIReadinessFull(event);
      }
    };
    
    // startAIReadiness is already defined in <head> script tag above
    
    window.viewAnalysisDetails = function(runId) {
      console.log('\u{1F50D} viewAnalysisDetails called with runId:', runId);
      if (!runId) {
        console.error('\u274C No runId provided');
        alert('Fehler: Keine Analyse-ID angegeben.');
        return;
      }
      // Try to call the full implementation, with retry logic and max attempts
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max (50 * 100ms)
      const startTime = Date.now();
      const maxTime = 5000; // 5 seconds in milliseconds
      let timeoutId = null;
      
      const tryCall = () => {
        attempts++;
        const elapsed = Date.now() - startTime;
        
        // Check if function is available
        if (window.viewAnalysisDetailsFull) {
          console.log('\u2705 Calling viewAnalysisDetailsFull');
          if (timeoutId) clearTimeout(timeoutId);
          window.viewAnalysisDetailsFull(runId);
          return; // Success, exit
        }
        
        // Check if we've exceeded max attempts or max time
        if (attempts >= maxAttempts || elapsed >= maxTime) {
          console.error('\u274C viewAnalysisDetailsFull not available after ' + attempts + ' attempts or ' + elapsed + 'ms');
          if (timeoutId) clearTimeout(timeoutId);
          alert('Fehler: Funktion noch nicht geladen. Bitte Seite neu laden.');
          return; // Exit retry loop
        }
        
        // Continue retrying
        console.warn('\u26A0\uFE0F viewAnalysisDetailsFull not yet available, retrying... (' + attempts + '/' + maxAttempts + ')');
        timeoutId = setTimeout(tryCall, 100);
      };
      
      tryCall();
    };
    
    window.deleteAnalysis = function(runId) {
      if (!runId) {
        console.error('\u274C No runId provided');
        return;
      }
      let attempts = 0;
      const maxAttempts = 50;
      const startTime = Date.now();
      const maxTime = 5000; // 5 seconds
      let timeoutId = null;
      
      const tryCall = () => {
        attempts++;
        const elapsed = Date.now() - startTime;
        
        if (window.deleteAnalysisFull) {
          if (timeoutId) clearTimeout(timeoutId);
          window.deleteAnalysisFull(runId);
          return;
        }
        
        if (attempts >= maxAttempts || elapsed >= maxTime) {
          console.error('\u274C deleteAnalysisFull not available after ' + attempts + ' attempts or ' + elapsed + 'ms');
          if (timeoutId) clearTimeout(timeoutId);
          alert('Fehler: Funktion noch nicht geladen. Bitte Seite neu laden.');
          return;
        }
        
        timeoutId = setTimeout(tryCall, 100);
      };
      
      tryCall();
    };
    
    window.pauseAnalysis = function(runId) {
      if (!runId) {
        console.error('\u274C No runId provided');
        return;
      }
      let attempts = 0;
      const maxAttempts = 50;
      const startTime = Date.now();
      const maxTime = 5000; // 5 seconds
      let timeoutId = null;
      
      const tryCall = () => {
        attempts++;
        const elapsed = Date.now() - startTime;
        
        if (window.pauseAnalysisFull) {
          if (timeoutId) clearTimeout(timeoutId);
          window.pauseAnalysisFull(runId);
          return;
        }
        
        if (attempts >= maxAttempts || elapsed >= maxTime) {
          console.error('\u274C pauseAnalysisFull not available after ' + attempts + ' attempts or ' + elapsed + 'ms');
          if (timeoutId) clearTimeout(timeoutId);
          alert('Fehler: Funktion noch nicht geladen. Bitte Seite neu laden.');
          return;
        }
        
        timeoutId = setTimeout(tryCall, 100);
      };
      
      tryCall();
    };
    
    // GLOBAL FUNCTION - available immediately
    window.startAnalysisNow = async function() {
      try {
        const btn = document.getElementById('startAnalysisBtn');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Starte Analyse...';
        }
        
        const websiteUrlEl = document.getElementById('websiteUrl');
        const countryEl = document.getElementById('country');
        const languageEl = document.getElementById('language');
        const regionEl = document.getElementById('region');
        
        let websiteUrl = websiteUrlEl?.value?.trim();
        // Auto-add https:// if missing
        var urlPattern1 = new RegExp("^https?:\\/\\/", "i");
        if (websiteUrl && !urlPattern1.test(websiteUrl)) {
          websiteUrl = "https://" + websiteUrl;
        }
        const country = countryEl?.value?.toUpperCase()?.trim();
        const language = languageEl?.value?.trim();
        const region = regionEl?.value?.trim();
        const questionsPerCategoryEl = document.getElementById('questionsPerCategory');
        const questionsPerCategory = questionsPerCategoryEl ? parseInt(questionsPerCategoryEl.value) || 3 : 3;
        
        if (!websiteUrl || !country || !language) {
          alert('Bitte f\xFCllen Sie alle Pflichtfelder aus!\\n\\nURL: ' + (websiteUrl || 'FEHLT') + '\\nLand: ' + (country || 'FEHLT') + '\\nSprache: ' + (language || 'FEHLT'));
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Analyse starten';
          }
          return;
        }
        
        // Show loading
        const loading = document.getElementById('loading');
        if (loading) {
          loading.style.display = 'block';
          loading.classList.add('show');
        }
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill) progressFill.style.width = '5%';
        if (progressText) progressText.textContent = 'Starte Analyse...';
        
        // Call the API
        const response = await fetch('/api/workflow/step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteUrl,
            country,
            language,
            region: region || undefined
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', errorText);
          alert('API Fehler: ' + response.status + ' - ' + errorText.substring(0, 100));
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Analyse starten';
          }
          if (loading) {
            loading.style.display = 'none';
          }
          return;
        }
        
        const data = await response.json();
        
        if (data.error) {
          alert('Fehler: ' + (data.message || data.error));
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Analyse starten';
          }
          if (loading) {
            loading.style.display = 'none';
          }
          return;
        }
        
        // Continue with workflow - trigger executeStep1 from DOMContentLoaded scope
        // The executeStep1 function will handle the rest of the workflow
        if (data.runId && window.executeStep1) {
          window.currentRunId = data.runId;
          window.workflowData = { websiteUrl, country, language, region, questionsPerCategory };
          window.workflowData.urls = data.urls || [];
          // Call executeStep1 with the formData
          await window.executeStep1({ websiteUrl, country, language, region, questionsPerCategory });
        } else if (data.runId) {
          // If DOMContentLoaded hasn't run yet, wait for it
          document.addEventListener('DOMContentLoaded', async () => {
            if (window.executeStep1) {
              window.currentRunId = data.runId;
              window.workflowData = { websiteUrl, country, language, region };
              window.workflowData.urls = data.urls || [];
              await window.executeStep1({ websiteUrl, country, language, region });
            }
          });
        }
        
      } catch (error) {
        console.error('Error:', error);
        alert('Fehler: ' + (error.message || error));
        const btn = document.getElementById('startAnalysisBtn');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Analyse starten';
        }
      }
    };
    
    document.addEventListener('DOMContentLoaded', function() {
    console.log('\u2705 DOM loaded, initializing form...');
    let pollInterval = null;

    async function pollStatus(runId) {
      try {
        const response = await fetch('/api/analysis/' + runId + '/status');
        const status = await response.json();
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (status.progress) {
          const progress = status.progress.progress || 0;
          progressFill.style.width = progress + '%';
          progressFill.textContent = progress + '%';
          progressText.textContent = status.progress.message || status.progress.step || 'Processing...';
        }
        
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          document.getElementById('loading').classList.remove('show');
          await loadResults(runId);
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          document.getElementById('loading').classList.remove('show');
          document.getElementById('result').classList.add('show');
          document.getElementById('resultContent').innerHTML = 
            '<div style="color: red;"><h4>\u274C Analyse fehlgeschlagen</h4><p>' + 
            (status.error || status.progress?.message || 'Unknown error') + '</p></div>';
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    }

    async function loadResults(runId) {
      try {
        const response = await fetch('/api/analysis/' + runId);
        const result = await response.json();
        
        const resultsContainer = document.getElementById('resultsContainer');
        const resultsContent = document.getElementById('resultsContent');
        
        let html = '<div class="metric-card">';
        html += '<h4>\u{1F310} Website</h4>';
        html += '<p><strong>URL:</strong> ' + result.websiteUrl + '</p>';
        html += '<p><strong>Land:</strong> ' + result.country + '</p>';
        html += '<p><strong>Sprache:</strong> ' + result.language + '</p>';
        html += '</div>';
        
        if (result.categoryMetrics && result.categoryMetrics.length > 0) {
          html += '<div class="metric-card">';
          html += '<h4>\u{1F4C8} Kategorie-Metriken</h4>';
          result.categoryMetrics.forEach(metric => {
            html += '<div style="margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 4px;">';
            html += '<strong>' + metric.categoryId + '</strong><br>';
            html += 'Sichtbarkeit: <span class="metric-value">' + metric.visibilityScore.toFixed(1) + '</span><br>';
            html += 'Zitationsrate: ' + metric.citationRate.toFixed(2) + '<br>';
            html += 'Brand-Erw\xE4hnungen: ' + (metric.brandMentionRate * 100).toFixed(1) + '%';
            html += '</div>';
          });
          html += '</div>';
        }
        
        if (result.competitiveAnalysis) {
          const comp = result.competitiveAnalysis;
          html += '<div class="metric-card">';
          html += '<h4>\u{1F3C6} Wettbewerbsanalyse</h4>';
          html += '<p><span class="metric-value">' + comp.brandShare.toFixed(1) + '%</span> Brand-Anteil</p>';
          if (Object.keys(comp.competitorShares).length > 0) {
            html += '<p><strong>Konkurrenten:</strong></p><ul>';
            for (const [name, share] of Object.entries(comp.competitorShares)) {
              html += '<li>' + name + ': ' + share.toFixed(1) + '%</li>';
            }
            html += '</ul>';
          }
          html += '</div>';
        }
        
        resultsContent.innerHTML = html;
        resultsContainer.style.display = 'block';
        document.getElementById('result').classList.add('show');
        document.getElementById('resultContent').innerHTML = 
          '<div style="color: green;"><h4>\u2705 Analyse abgeschlossen!</h4><p>Run ID: ' + runId + '</p></div>';
      } catch (error) {
        document.getElementById('resultContent').innerHTML = 
          '<div style="color: red;">Fehler beim Laden der Ergebnisse: ' + error.message + '</div>';
      }
    }

    let currentRunId = null;
    let currentStep = 'step1';
    let workflowData = {};
    
    // Make variables available globally for startAnalysisNow
    window.currentRunId = currentRunId;
    window.workflowData = workflowData;

    // Extract form submission logic to a function (DEFINED FIRST)
    async function handleFormSubmit() {
      console.log('\u{1F535} handleFormSubmit called');
      try {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        
        const websiteUrlEl = document.getElementById('websiteUrl');
        const countryEl = document.getElementById('country');
        const languageEl = document.getElementById('language');
        const regionEl = document.getElementById('region');
        
        console.log('Form elements:', {
          websiteUrl: !!websiteUrlEl,
          country: !!countryEl,
          language: !!languageEl,
          region: !!regionEl
        });
        
        if (!websiteUrlEl || !countryEl || !languageEl) {
          throw new Error('Form fields not found');
        }
        
        const questionsPerCategoryEl = document.getElementById('questionsPerCategory');
        const questionsPerCategory = questionsPerCategoryEl ? parseInt(questionsPerCategoryEl.value) || 3 : 3;
        
        let websiteUrl = websiteUrlEl.value.trim();
        // Auto-add https:// if missing
        var urlPattern2 = new RegExp("^https?:\\/\\/", "i");
        if (websiteUrl && !urlPattern2.test(websiteUrl)) {
          websiteUrl = "https://" + websiteUrl;
        }
        const formData = {
          websiteUrl: websiteUrl,
          country: countryEl.value.toUpperCase().trim(),
          language: languageEl.value.trim(),
          region: regionEl ? regionEl.value.trim() || undefined : undefined,
          questionsPerCategory: questionsPerCategory
        };
        
        console.log('\u{1F4CB} Form data extracted:', formData);
        
        // Validate form data
        if (!formData.websiteUrl) {
          throw new Error('Website URL ist erforderlich');
        }
        if (!formData.country) {
          throw new Error('Land ist erforderlich');
        }
        if (!formData.language) {
          throw new Error('Sprache ist erforderlich');
        }
        
        console.log('\u2705 Form validation passed');

        workflowData = { ...formData };

        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        const resultsContainer = document.getElementById('resultsContainer');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (!loading || !result || !progressFill || !progressText) {
          throw new Error('UI elements not found');
        }

        // Show loading immediately with visual feedback
        loading.style.display = 'block';
        loading.classList.add('show');
        result.classList.remove('show');
        if (resultsContainer) {
          resultsContainer.style.display = 'none';
        }
        
        // Reset progress and show initial status
        progressFill.style.width = '0%';
        progressText.textContent = 'Starte Analyse...';
        
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        if (statusEl) statusEl.textContent = '\u{1F680} Analyse wird gestartet...';
        if (statusDetailsEl) statusDetailsEl.textContent = 'Vorbereitung der Analyse...';
        
        console.log('Form submitted, calling executeStep1 with:', formData);
        await executeStep1(formData);
      } catch (error) {
        console.error('Error in form submit:', error);
        const startBtn = document.getElementById('startAnalysisBtn');
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.textContent = 'Analyse starten';
        }
        const result = document.getElementById('result');
        const loading = document.getElementById('loading');
        const resultContent = document.getElementById('resultContent');
        
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="color: red; padding: 15px; background: #ffebee; border-radius: 6px; border-left: 4px solid #f44336;">' +
            '<strong>\u274C Fehler:</strong><br>' + 
            (error.message || error || 'Unbekannter Fehler') + 
            '</div>';
        }
        if (result) result.classList.add('show');
        if (loading) loading.classList.remove('show');
        throw error;
      }
    }

    // Step 1: Find Sitemap
    async function executeStep1(formData) {
      try {
        console.log('executeStep1 called with:', formData);
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        
        if (!progressText || !progressFill || !loading) {
          throw new Error('UI elements not found');
        }
        
        // Show loading immediately
        loading.style.display = 'block';
        loading.classList.add('show');
        result.classList.remove('show');
        progressFill.style.width = '5%';
        progressText.textContent = 'Suche Sitemap.xml...';
        
        const statusEl1 = document.getElementById('currentStatus');
        const statusDetailsEl1 = document.getElementById('statusDetails');
        if (statusEl1) statusEl1.textContent = '\u{1F50D} Schritt 1: Sitemap wird gesucht...';
        if (statusDetailsEl1) statusDetailsEl1.textContent = 'Suche nach sitemap.xml auf ' + formData.websiteUrl;
        
        console.log('Making API call to /api/workflow/step1');
        const response = await fetch('/api/workflow/step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: 'Unknown error', message: response.statusText };
          }
          throw new Error(errorData.message || errorData.error || 'Failed to start analysis');
        }
        
        const data = await response.json();
        console.log('API response data:', data);
        
        if (data.error) {
          throw new Error(data.message || data.error);
        }
        
        if (!data.runId) {
          throw new Error('No runId received from server');
        }
        
        currentRunId = data.runId;
        workflowData.urls = data.urls || [];
        workflowData.foundSitemap = data.foundSitemap !== false; // Default to true if not specified
        progressFill.style.width = '20%';
        
        const statusEl2 = document.getElementById('currentStatus');
        const statusDetailsEl2 = document.getElementById('statusDetails');
        
        if (data.foundSitemap) {
          progressText.textContent = 'Sitemap gefunden: ' + (data.urls ? data.urls.length : 0) + ' URLs';
          if (statusEl2) {
            statusEl2.textContent = '\u2705 Schritt 1 abgeschlossen: Sitemap gefunden';
            statusEl2.style.color = '#059669';
          }
          if (statusDetailsEl2) statusDetailsEl2.textContent = data.urls && data.urls.length > 0 
            ? data.urls.length + ' URLs gefunden. Bereite Schritt 2 vor...'
            : 'Keine URLs in Sitemap gefunden.';
        } else {
          progressText.textContent = 'Keine Sitemap gefunden: ' + (data.urls ? data.urls.length : 0) + ' URLs von Startseite';
          if (statusEl2) {
            statusEl2.textContent = '\u26A0\uFE0F Schritt 1 abgeschlossen: Keine Sitemap gefunden';
            statusEl2.style.color = '#d97706';
          }
          if (statusDetailsEl2) {
            statusDetailsEl2.textContent = data.message || (data.urls && data.urls.length > 0 
              ? data.urls.length + ' URLs von Startseite extrahiert. Bereite Schritt 2 vor...'
              : 'Keine URLs gefunden.');
          }
        }
        
        console.log('Step 1 completed. RunId:', currentRunId, 'URLs:', data.urls?.length || 0, 'FoundSitemap:', data.foundSitemap);
        
        if (data.urls && data.urls.length > 0) {
          // Auto-proceed to step 2
          setTimeout(() => executeStep2(), 1000);
        } else {
          document.getElementById('resultContent').innerHTML = 
            '<div style="color: orange; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">' +
            '\u26A0\uFE0F Keine URLs gefunden. Bitte manuell URLs eingeben oder Crawling verwenden.</div>';
          result.classList.add('show');
          loading.classList.remove('show');
          loading.style.display = 'none';
        }
      } catch (error) {
        console.error('Error in executeStep1:', error);
        const result = document.getElementById('result');
        const loading = document.getElementById('loading');
        const resultContent = document.getElementById('resultContent');
        
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="color: red; padding: 15px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
            '<strong>\u274C Fehler beim Starten der Analyse:</strong><br>' + 
            (error.message || error || 'Unbekannter Fehler') + 
            '</div>';
        }
        if (result) result.classList.add('show');
        if (loading) loading.classList.remove('show');
        throw error;
      }
    }

    // Step 2: Fetch Content (with live updates)
    async function executeStep2() {
      // Update global reference
      window.currentRunId = currentRunId;
      window.workflowData = workflowData;
      try {
        const statusEl3 = document.getElementById('currentStatus');
        const statusDetailsEl3 = document.getElementById('statusDetails');
        if (statusEl3) statusEl3.textContent = '\u{1F4C4} Schritt 2: Inhalte werden geholt...';
        if (statusDetailsEl3) statusDetailsEl3.textContent = 'Lade Inhalte von ' + workflowData.urls.length + ' URLs';
        
        const progressText = document.getElementById('progressText');
        const resultContent = document.getElementById('resultContent');
        resultContent.innerHTML = '<h3>\u{1F4C4} Geholte Inhalte:</h3><div id="contentList"></div>';
        document.getElementById('result').classList.add('show');
        
        let fetchedCount = 0;
        const contentList = document.getElementById('contentList');
        const allContent = [];
        
        // Fetch URLs one by one with live updates
        const maxUrls = Math.min(workflowData.urls.length, 50);
        for (let i = 0; i < maxUrls; i++) {
          const url = workflowData.urls[i];
          progressText.textContent = 'Hole Inhalte... (' + (i + 1) + '/' + maxUrls + ')';
          const statusDetailsEl3Loop = document.getElementById('statusDetails');
          if (statusDetailsEl3Loop) statusDetailsEl3Loop.textContent = 'Lade URL ' + (i + 1) + ' von ' + maxUrls + ': ' + url.substring(0, 50) + '...';
          document.getElementById('progressFill').style.width = (20 + (i / maxUrls) * 20) + '%';
          
          try {
            const response = await fetch('/api/workflow/fetchUrl', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: url })
            });
            const data = await response.json();
            
            if (data.content) {
              fetchedCount++;
              allContent.push(data.content);
              const urlDiv = document.createElement('div');
              urlDiv.style.cssText = 'margin: 5px 0; padding: 8px; background: #e8f5e9; border-radius: 4px; border-left: 3px solid #4caf50;';
              urlDiv.innerHTML = '<strong>\u2713 ' + url + '</strong><br><small>' + 
                (data.content.substring(0, 100) + '...') + '</small>';
              contentList.appendChild(urlDiv);
            }
          } catch (error) {
            const urlDiv = document.createElement('div');
            urlDiv.style.cssText = 'margin: 5px 0; padding: 8px; background: #ffebee; border-radius: 4px; border-left: 3px solid #f44336;';
            urlDiv.innerHTML = '<strong>\u2717 ' + url + '</strong><br><small>Fehler beim Laden</small>';
            contentList.appendChild(urlDiv);
          }
        }
        
        const separator = String.fromCharCode(10) + String.fromCharCode(10);
        workflowData.content = allContent.join(separator);
        document.getElementById('progressFill').style.width = '40%';
        progressText.textContent = 'Inhalte von ' + fetchedCount + ' Seiten geholt';
        
        const statusEl4 = document.getElementById('currentStatus');
        const statusDetailsEl4 = document.getElementById('statusDetails');
        if (statusEl4) statusEl4.textContent = '\u2705 Schritt 2 abgeschlossen: Inhalte geholt';
        if (statusDetailsEl4) statusDetailsEl4.textContent = fetchedCount + ' Seiten erfolgreich geladen. Bereite Schritt 3 vor...';
        
        // Auto-proceed to step 3
        setTimeout(() => executeStep3(), 1000);
      } catch (error) {
        throw error;
      }
    }

    // Step 3: Generate Categories
    async function executeStep3() {
      try {
        const statusEl5 = document.getElementById('currentStatus');
        const statusDetailsEl5 = document.getElementById('statusDetails');
        if (statusEl5) statusEl5.textContent = '\u{1F916} Schritt 3: Kategorien werden generiert...';
        if (statusDetailsEl5) statusDetailsEl5.textContent = 'GPT analysiert Inhalte und generiert Kategorien/Keywords...';
        
        document.getElementById('progressText').textContent = 'Generiere Kategorien/Keywords mit GPT...';
        const response = await fetch('/api/workflow/step3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            runId: currentRunId,
            content: workflowData.content || 'Website content',
            language: workflowData.language
          })
        });
        const data = await response.json();
        console.log('\u{1F4CA} Step 3 Response:', data);
        console.log('\u{1F4CA} Categories received:', data.categories?.length || 0, data.categories);
        
        if (!data.categories || !Array.isArray(data.categories)) {
          console.error('\u274C Invalid categories data:', data);
          alert('Fehler: Keine Kategorien erhalten. Bitte versuche es erneut.');
          return;
        }
        
        workflowData.categories = data.categories;
        document.getElementById('progressFill').style.width = '60%';
        document.getElementById('progressText').textContent = 
          data.categories.length + ' Kategorien generiert';
        
        // Update status (reuse existing variables)
        if (statusEl5) statusEl5.textContent = '\u2705 Schritt 3 abgeschlossen: ' + data.categories.length + ' Kategorien generiert';
        if (statusDetailsEl5) statusDetailsEl5.textContent = 'Bitte w\xE4hle die Kategorien aus, f\xFCr die Fragen generiert werden sollen.';
        
        // Show categories for user selection
        try {
          showCategorySelection(data.categories);
        } catch (error) {
          console.error('\u274C Error in showCategorySelection:', error);
          const resultContent = document.getElementById('resultContent');
          if (resultContent) {
            resultContent.innerHTML = 
              '<div style="color: red; padding: 15px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
              '<strong>\u274C Fehler beim Anzeigen der Kategorien:</strong><br>' + 
              (error.message || error || 'Unbekannter Fehler') + 
              '</div>';
          }
          throw error;
        }
      } catch (error) {
        console.error('\u274C Error in executeStep3:', error);
        throw error;
      }
    }

    function showCategorySelection(categories) {
      try {
        console.log('\u{1F4CB} Showing categories:', categories.length, categories);
        
        if (!categories || !Array.isArray(categories)) {
          throw new Error('Ung\xFCltige Kategorien-Daten: ' + typeof categories);
        }
        
        const result = document.getElementById('result');
        const resultContent = document.getElementById('resultContent');
        
        if (!result || !resultContent) {
          console.error('\u274C Result elements not found!');
          alert('Fehler: Ergebnis-Container nicht gefunden. Bitte Seite neu laden.');
          return;
        }
      
      // Ensure result is visible
      result.style.display = 'block';
      result.classList.add('show');
      
      let html = '<div style="margin-bottom: 20px;">';
      html += '<h3 style="margin-bottom: 16px; color: var(--gray-900); font-size: 20px;">\u{1F4CB} W\xE4hle Kategorien aus (' + categories.length + ' gefunden):</h3>';
      html += '<p style="color: var(--gray-600); font-size: 14px; margin-bottom: 20px;">W\xE4hle die Kategorien aus, f\xFCr die Fragen generiert werden sollen. Du kannst auch neue Kategorien hinzuf\xFCgen.</p>';
      html += '</div>';
      
      html += '<form id="categoryForm" style="margin-top: 20px;">';
      
      if (!categories || categories.length === 0) {
        html += '<div style="padding: 20px; background: var(--gray-100); border-radius: 8px; color: var(--gray-600);">';
        html += 'Keine Kategorien gefunden. Bitte versuche es erneut oder f\xFCge manuell Kategorien hinzu.';
        html += '</div>';
      } else {
        // Use grid layout for compact display
        html += '<div id="categoriesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; margin-bottom: 16px;">';
        categories.forEach(function(cat, index) {
          const catId = (cat.id || 'cat_' + index).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          const catName = (cat.name || 'Kategorie ' + (index + 1)).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          const catDesc = (cat.description || 'Keine Beschreibung').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          html += '<div class="category-item-compact" data-cat-id="' + catId + '" style="padding: 10px; background: white; border: 1px solid var(--gray-200); border-radius: 6px; transition: all 0.2s; cursor: pointer;">';
          html += '<label style="display: flex; align-items: center; cursor: pointer; gap: 8px; margin: 0;">';
          html += '<input type="checkbox" name="category" value="' + catId + '" checked style="width: 16px; height: 16px; cursor: pointer; flex-shrink: 0;">';
          html += '<div style="flex: 1; min-width: 0;">';
          html += '<strong style="display: block; color: var(--gray-900); font-size: 14px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + catName + '</strong>';
          html += '<span style="display: block; color: var(--gray-600); font-size: 12px; line-height: 1.3; max-height: 2.6em; overflow: hidden; text-overflow: ellipsis;">' + catDesc + '</span>';
          html += '</div>';
          html += '</label>';
          html += '</div>';
        });
        html += '</div>';
      }
      
      // Add custom category input
      html += '<div style="margin-top: 24px; padding: 16px; background: var(--gray-50); border-radius: 8px; border: 2px dashed var(--gray-300);">';
      html += '<h4 style="margin-bottom: 12px; color: var(--gray-900); font-size: 14px; font-weight: 600;">\u2795 Neue Kategorie hinzuf\xFCgen</h4>';
      html += '<div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-bottom: 12px;">';
      html += '<input type="text" id="newCategoryName" placeholder="Kategorie-Name" style="padding: 10px; border: 1px solid var(--gray-300); border-radius: 6px; font-size: 14px;">';
      html += '<input type="text" id="newCategoryDesc" placeholder="Beschreibung" style="padding: 10px; border: 1px solid var(--gray-300); border-radius: 6px; font-size: 14px;">';
      html += '</div>';
      html += '<button type="button" id="addCategoryBtn" class="btn" style="background: var(--gray-600); padding: 10px 20px; font-size: 14px;">Kategorie hinzuf\xFCgen</button>';
      html += '</div>';
      
      html += '<div style="margin-top: 24px; display: flex; gap: 12px;">';
      html += '<button type="submit" class="btn btn-primary" style="flex: 1; padding: 14px 24px; font-size: 16px;">\u2705 Weiter zu Fragen generieren</button>';
      html += '<button type="button" id="regenerateCategoriesBtn" class="btn" style="background: var(--gray-600); padding: 14px 24px; font-size: 16px;">\u{1F504} Kategorien neu generieren</button>';
      html += '</div>';
      html += '</form>';
      
      resultContent.innerHTML = html;
      
      // Add click handlers for category items (click anywhere on card to toggle checkbox)
      const categoryItems = document.querySelectorAll('.category-item-compact');
      categoryItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL' && e.target.tagName !== 'STRONG' && e.target.tagName !== 'SPAN' && e.target.tagName !== 'DIV') {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
              checkbox.click();
            }
          }
        });
      });
      
      // Add event listener for adding custom categories
      const addCategoryBtn = document.getElementById('addCategoryBtn');
      if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
          const nameInput = document.getElementById('newCategoryName');
          const descInput = document.getElementById('newCategoryDesc');
          const name = nameInput?.value?.trim();
          const desc = descInput?.value?.trim();
          
          if (!name) {
            alert('Bitte gib einen Kategorie-Namen ein.');
            return;
          }
          
          // Add new category to the form
          const form = document.getElementById('categoryForm');
          if (form) {
            const newCategoryDiv = document.createElement('div');
            newCategoryDiv.style.cssText = 'margin: 12px 0; padding: 16px; background: white; border: 2px solid var(--primary); border-radius: 8px;';
            newCategoryDiv.innerHTML = 
              '<label style="display: flex; align-items: flex-start; cursor: pointer; gap: 12px;">' +
              '<input type="checkbox" name="category" value="custom_' + Date.now() + '" checked style="margin-top: 4px; width: 18px; height: 18px; cursor: pointer;">' +
              '<div style="flex: 1;">' +
              '<strong style="display: block; color: var(--gray-900); font-size: 16px; margin-bottom: 4px;">' + name + '</strong>' +
              '<span style="display: block; color: var(--gray-600); font-size: 14px;">' + (desc || 'Benutzerdefinierte Kategorie') + '</span>' +
              '</div>' +
              '</label>';
            
            // Insert before the "Add category" section
            const addSection = document.querySelector('#categoryForm > div:last-of-type');
            if (addSection && addSection.previousElementSibling) {
              addSection.parentNode?.insertBefore(newCategoryDiv, addSection);
            } else {
              form.insertBefore(newCategoryDiv, form.lastElementChild);
            }
            
            // Clear inputs
            if (nameInput) nameInput.value = '';
            if (descInput) descInput.value = '';
            
            // Add to workflowData
            if (!workflowData.categories) workflowData.categories = [];
            workflowData.categories.push({
              id: 'custom_' + Date.now(),
              name: name,
              description: desc || 'Benutzerdefinierte Kategorie',
              confidence: 0.5,
              sourcePages: []
            });
          }
        });
      }
      
      // Add event listener for regenerate button
      const regenerateBtn = document.getElementById('regenerateCategoriesBtn');
      if (regenerateBtn) {
        regenerateBtn.addEventListener('click', async () => {
          if (confirm('M\xF6chtest du die Kategorien wirklich neu generieren? Die aktuellen Auswahlen gehen verloren.')) {
            await executeStep3();
          }
        });
      }
      
      // Add form submit handler
      const categoryForm = document.getElementById('categoryForm');
      if (categoryForm) {
        console.log('\u{1F4CB} Setting up category form submit handler');
        
        // Remove existing listeners by cloning (but keep the form reference)
        const formClone = categoryForm.cloneNode(true);
        categoryForm.parentNode?.replaceChild(formClone, categoryForm);
        
        // Get the new form element
        const newForm = document.getElementById('categoryForm');
        if (newForm) {
          console.log('\u2705 Category form found, adding submit listener');
          
          newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('\u{1F535} Category form submitted!');
            
            const selected = Array.from(document.querySelectorAll('input[name="category"]:checked'))
              .map(cb => cb.value);
            
            console.log('\u2705 Selected categories:', selected);
            console.log('\u{1F4CA} Available categories:', workflowData.categories?.length || 0);
            
            if (selected.length === 0) {
              alert('Bitte w\xE4hle mindestens eine Kategorie aus.');
              return;
            }
            
            // Update workflow data
            workflowData.selectedCategories = selected;
            
            // IMMEDIATE VISUAL FEEDBACK - Disable button and show loading
            const submitBtn = e.target.closest('form')?.querySelector('button[type="submit"]');
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.textContent = '\u23F3 Generiere Fragen...';
              submitBtn.style.opacity = '0.7';
              submitBtn.style.cursor = 'not-allowed';
            }
            
            // Show loading state immediately
            const loading = document.getElementById('loading');
            if (loading) {
              loading.style.display = 'block';
              loading.classList.add('show');
            }
            
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            if (progressFill) {
              progressFill.style.width = '60%';
              progressFill.style.transition = 'width 0.3s ease';
            }
            if (progressText) progressText.textContent = 'Starte Fragen-Generierung...';
            
            const statusEl = document.getElementById('currentStatus');
            const statusDetailsEl = document.getElementById('statusDetails');
            if (statusEl) {
              statusEl.textContent = '\u{1F916} Schritt 4: Fragen werden generiert...';
              statusEl.style.color = '#2563eb';
            }
            if (statusDetailsEl) {
              statusDetailsEl.textContent = 'GPT generiert Fragen f\xFCr ' + selected.length + ' ausgew\xE4hlte Kategorien. Bitte warten...';
            }
            
            // Show progress in result area too
            const resultContent = document.getElementById('resultContent');
            if (resultContent) {
              resultContent.innerHTML = 
                '<div style="text-align: center; padding: 40px;">' +
                '<div style="font-size: 48px; margin-bottom: 20px;">\u23F3</div>' +
                '<h3 style="color: var(--gray-900); margin-bottom: 12px;">Fragen werden generiert...</h3>' +
                '<p style="color: var(--gray-600); margin-bottom: 20px;">GPT generiert ' + (workflowData.questionsPerCategory || 3) + ' Fragen pro Kategorie f\xFCr ' + selected.length + ' Kategorien.</p>' +
                '<div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>' +
                '</div>';
              document.getElementById('result').style.display = 'block';
              document.getElementById('result').classList.add('show');
            }
            
            // Add spinning animation CSS if not already present
            if (!document.getElementById('spinnerStyle')) {
              const style = document.createElement('style');
              style.id = 'spinnerStyle';
              style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
              document.head.appendChild(style);
            }
            
            try {
              console.log('\u{1F680} Calling executeStep4...');
              await executeStep4();
            } catch (error) {
              console.error('\u274C Error in executeStep4:', error);
              const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
              alert('Fehler beim Generieren der Fragen: ' + errorMessage);
              
              // Re-enable button
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '\u2705 Weiter zu Fragen generieren';
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
              }
              
              if (loading) {
                loading.style.display = 'none';
              }
            }
          });
          
          console.log('\u2705 Category form submit handler attached');
        } else {
          console.error('\u274C Could not find categoryForm after clone');
        }
      } else {
        console.error('\u274C Category form not found!');
      }
      } catch (error) {
        console.error('\u274C Error in showCategorySelection:', error);
        const resultContent = document.getElementById('resultContent');
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="color: red; padding: 15px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
            '<strong>\u274C Fehler beim Anzeigen der Kategorien:</strong><br>' + 
            (error && typeof error === 'object' && 'message' in error ? error.message : String(error)) + 
            '<br><small>Bitte versuche es erneut oder lade die Seite neu.</small>' +
            '</div>';
        }
        throw error;
      }
    }

    // Step 4: Generate Prompts
    async function executeStep4() {
      try {
        console.log('\u{1F680} executeStep4 called');
        console.log('\u{1F4CA} Selected categories:', workflowData.selectedCategories);
        console.log('\u{1F4CA} Available categories:', workflowData.categories?.length || 0);
        console.log('\u{1F4CA} Current runId:', currentRunId);
        
        if (!workflowData.selectedCategories || workflowData.selectedCategories.length === 0) {
          throw new Error('Keine Kategorien ausgew\xE4hlt');
        }
        
        if (!workflowData.categories || workflowData.categories.length === 0) {
          throw new Error('Keine Kategorien verf\xFCgbar');
        }
        
        const selectedCats = workflowData.categories.filter(c => 
          workflowData.selectedCategories.includes(c.id)
        );
        
        console.log('\u{1F4CB} Filtered selected categories:', selectedCats.length, selectedCats);
        
        if (selectedCats.length === 0) {
          throw new Error('Keine passenden Kategorien gefunden. Bitte w\xE4hle Kategorien aus.');
        }
        
        const questionsPerCategory = workflowData.questionsPerCategory || 3;
        const totalQuestions = selectedCats.length * questionsPerCategory;
        console.log('\u{1F4CA} Questions per category:', questionsPerCategory);
        console.log('\u{1F4CA} Total questions to generate:', totalQuestions);
        
        // Update progress with detailed info
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        if (progressText) progressText.textContent = 'Generiere ' + totalQuestions + ' Fragen f\xFCr ' + selectedCats.length + ' Kategorien...';
        if (progressFill) {
          progressFill.style.width = '65%';
          progressFill.style.transition = 'width 0.3s ease';
        }
        
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        if (statusEl) {
          statusEl.textContent = '\u{1F916} Schritt 4: Fragen werden generiert...';
          statusEl.style.color = '#2563eb';
        }
        if (statusDetailsEl) {
          statusDetailsEl.textContent = 'GPT generiert ' + questionsPerCategory + ' Fragen pro Kategorie f\xFCr ' + selectedCats.length + ' Kategorien. Dies kann einige Sekunden dauern...';
        }
        
        // Update result area with progress
        const resultContent = document.getElementById('resultContent');
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="text-align: center; padding: 40px;">' +
            '<div style="font-size: 48px; margin-bottom: 20px;">\u23F3</div>' +
            '<h3 style="color: var(--gray-900); margin-bottom: 12px;">Fragen werden generiert...</h3>' +
            '<p style="color: var(--gray-600); margin-bottom: 8px;">Generiere ' + questionsPerCategory + ' Fragen pro Kategorie</p>' +
            '<p style="color: var(--gray-600); margin-bottom: 20px;">f\xFCr ' + selectedCats.length + ' Kategorien = ' + totalQuestions + ' Fragen insgesamt</p>' +
            '<div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>' +
            '<p style="color: var(--gray-500); font-size: 12px; margin-top: 20px;">Bitte warten, dies kann 30-60 Sekunden dauern...</p>' +
            '</div>';
        }
        
        console.log('\u{1F4E1} Making API call to /api/workflow/step4');
        console.log('\u{1F4CA} Sending questionsPerCategory:', questionsPerCategory);
        const response = await fetch('/api/workflow/step4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            runId: currentRunId,
            categories: selectedCats,
            userInput: workflowData,
            content: workflowData.content || '',
            questionsPerCategory: questionsPerCategory
          })
        });
        
        console.log('\u{1F4E1} API Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('\u274C API Error:', errorText);
          throw new Error('API Fehler: ' + response.status + ' - ' + errorText.substring(0, 200));
        }
        
        const data = await response.json();
        console.log('\u2705 API Response data:', data);
        console.log('\u{1F4CB} Prompts received:', data.prompts?.length || 0);
        
        if (!data.prompts || !Array.isArray(data.prompts)) {
          throw new Error('Keine Fragen erhalten. Bitte versuche es erneut.');
        }
        
        workflowData.prompts = data.prompts;
        
        // Update progress to 80%
        if (progressFill) {
          progressFill.style.width = '80%';
          progressFill.style.transition = 'width 0.3s ease';
        }
        if (progressText) {
          progressText.textContent = '\u2705 ' + data.prompts.length + ' Fragen erfolgreich generiert!';
        }
        
        if (statusEl) {
          statusEl.textContent = '\u2705 Schritt 4 abgeschlossen: ' + data.prompts.length + ' Fragen generiert';
          statusEl.style.color = '#059669';
        }
        if (statusDetailsEl) {
          statusDetailsEl.textContent = 'Alle Fragen wurden erfolgreich generiert. Bitte \xFCberpr\xFCfe und bearbeite die Fragen.';
        }
        
        // Show success message briefly before showing prompts
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="text-align: center; padding: 40px;">' +
            '<div style="font-size: 48px; margin-bottom: 20px;">\u2705</div>' +
            '<h3 style="color: var(--success); margin-bottom: 12px;">Fragen erfolgreich generiert!</h3>' +
            '<p style="color: var(--gray-600); margin-bottom: 20px;">' + data.prompts.length + ' Fragen wurden generiert und werden gleich angezeigt...</p>' +
            '</div>';
        }
        
        // Wait a moment to show success, then display prompts
        setTimeout(function() {
          showPromptSelection(data.prompts);
        }, 1000);
      } catch (error) {
        console.error('\u274C Error in executeStep4:', error);
        const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
        const errorStack = error && typeof error === 'object' && 'stack' in error ? error.stack : '';
        console.error('Error details:', errorMessage, errorStack);
        
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        if (statusEl) statusEl.textContent = '\u274C Fehler beim Generieren der Fragen';
        if (statusDetailsEl) statusDetailsEl.textContent = errorMessage || 'Unbekannter Fehler';
        
        alert('Fehler beim Generieren der Fragen: ' + errorMessage);
        throw error;
      }
    }

    function showPromptSelection(prompts) {
      console.log('\u{1F4CB} Showing prompts:', prompts.length);
      const resultContent = document.getElementById('resultContent');
      if (!resultContent) {
        console.error('\u274C resultContent not found!');
        return;
      }
      
      let html = '<div style="margin-bottom: 20px;">';
      html += '<h3 style="margin-bottom: 16px; color: var(--gray-900); font-size: 20px;">\u2753 Generierte Fragen (' + prompts.length + '):</h3>';
      html += '<p style="color: var(--gray-600); font-size: 14px; margin-bottom: 20px;">Du kannst die Fragen bearbeiten oder einzelne deaktivieren, bevor die Analyse startet.</p>';
      html += '</div>';
      
      html += '<form id="promptForm" style="margin-top: 20px;">';
      
      if (!prompts || prompts.length === 0) {
        html += '<div style="padding: 20px; background: var(--gray-100); border-radius: 8px; color: var(--gray-600);">';
        html += 'Keine Fragen gefunden. Bitte versuche es erneut.';
        html += '</div>';
      } else {
        prompts.forEach((prompt, idx) => {
          const promptId = prompt.id || 'prompt_' + idx;
          const promptQuestion = prompt.question || prompt.text || '';
          html += '<div style="margin-bottom: 16px; padding: 16px; background: white; border: 1px solid var(--gray-200); border-radius: 8px; transition: all 0.2s;">';
          html += '<div style="display: flex; align-items: flex-start; gap: 12px;">';
          html += '<input type="checkbox" name="selected" value="' + promptId + '" checked style="width: 20px; height: 20px; margin-top: 4px; cursor: pointer; flex-shrink: 0;">';
          html += '<div style="flex: 1;">';
          html += '<label style="display: block; color: var(--gray-700); font-size: 12px; font-weight: 600; margin-bottom: 6px;">Frage ' + (idx + 1) + ':</label>';
          html += '<textarea name="prompt_' + promptId + '" style="width: 100%; padding: 12px; border: 1px solid var(--gray-300); border-radius: 6px; font-size: 14px; font-family: inherit; resize: vertical; min-height: 60px;" rows="2">' + promptQuestion.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>';
          html += '</div>';
          html += '</div>';
          html += '</div>';
        });
      }
      
      html += '<div style="margin-top: 24px; display: flex; gap: 12px;">';
      html += '<button type="submit" class="btn btn-primary" style="flex: 1; padding: 14px 24px; font-size: 16px;">\u{1F680} Analyse mit GPT-5 starten</button>';
      html += '</div>';
      html += '</form>';
      
      resultContent.innerHTML = html;
      
      // Remove existing form and recreate to avoid duplicate listeners
      const promptForm = document.getElementById('promptForm');
      if (promptForm) {
        const formClone = promptForm.cloneNode(true);
        promptForm.parentNode?.replaceChild(formClone, promptForm);
        
        const newPromptForm = document.getElementById('promptForm');
        if (newPromptForm) {
          newPromptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('\u{1F535} Prompt form submitted!');
            
            const updatedPrompts = prompts.map(p => {
              const textarea = document.querySelector('textarea[name="prompt_' + p.id + '"]');
              const checkbox = document.querySelector('input[name="selected"][value="' + p.id + '"]');
              return {
                ...p,
                question: textarea ? textarea.value : p.question,
                isSelected: checkbox ? checkbox.checked : true
              };
            }).filter(p => p.isSelected);
            
            console.log('\u2705 Updated prompts:', updatedPrompts.length);
            
            if (updatedPrompts.length === 0) {
              alert('Bitte w\xE4hle mindestens eine Frage aus.');
              return;
            }
            
            workflowData.prompts = updatedPrompts;
            
            // Show loading
            const loading = document.getElementById('loading');
            if (loading) {
              loading.style.display = 'block';
              loading.classList.add('show');
            }
            
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            if (progressFill) progressFill.style.width = '80%';
            if (progressText) progressText.textContent = 'Starte GPT-5 Ausf\xFChrung...';
            
            const statusEl = document.getElementById('currentStatus');
            const statusDetailsEl = document.getElementById('statusDetails');
            if (statusEl) statusEl.textContent = '\u{1F916} Schritt 5: GPT-5 Ausf\xFChrung...';
            if (statusDetailsEl) statusDetailsEl.textContent = 'F\xFChre ' + updatedPrompts.length + ' Fragen aus...';
            
            try {
              await executeStep5();
            } catch (error) {
              console.error('\u274C Error in executeStep5:', error);
              const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
              alert('Fehler beim Ausf\xFChren der Fragen: ' + errorMessage);
              if (loading) {
                loading.style.display = 'none';
              }
            }
          });
          
          console.log('\u2705 Prompt form submit handler attached');
        }
      }
    }

    // Step 5: Execute with GPT-5 (with live updates)
    async function executeStep5() {
      try {
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        const resultContent = document.getElementById('resultContent');
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        
        // Initialize result area
        resultContent.innerHTML = 
          '<div style="margin-bottom: 20px;">' +
          '<h3 style="margin-bottom: 16px; color: var(--gray-900); font-size: 20px;">\u{1F916} GPT-5 Antworten (Live):</h3>' +
          '<p style="color: var(--gray-600); font-size: 14px;">Jede Frage wird einzeln ausgef\xFChrt und live angezeigt...</p>' +
          '</div>' +
          '<div id="responsesList" style="display: flex; flex-direction: column; gap: 16px;"></div>';
        document.getElementById('result').style.display = 'block';
        document.getElementById('result').classList.add('show');
        
        const responsesList = document.getElementById('responsesList');
        let executedCount = 0;
        const promptsLength = workflowData.prompts.length;
        
        // Store all questions and answers for summary
        const allQuestionsAndAnswers = [];
        
        // Update status
        if (statusEl) statusEl.textContent = '\u{1F916} Schritt 5: GPT-5 Ausf\xFChrung l\xE4uft...';
        if (statusDetailsEl) statusDetailsEl.textContent = 'F\xFChre ' + promptsLength + ' Fragen mit Web Search aus...';
        
        // Execute prompts one by one with live updates
        for (let i = 0; i < promptsLength; i++) {
          const prompt = workflowData.prompts[i];
          const progressPercent = 80 + ((i / promptsLength) * 20);
          
          // Update progress
          if (progressText) progressText.textContent = 'Frage ' + (i + 1) + '/' + promptsLength + ' wird ausgef\xFChrt...';
          if (progressFill) {
            progressFill.style.width = progressPercent + '%';
            progressFill.style.transition = 'width 0.3s ease';
          }
          
          // Show "processing" indicator for current question
          const processingDiv = document.createElement('div');
          processingDiv.id = 'processing_' + i;
          processingDiv.style.cssText = 'padding: 16px; background: var(--gray-100); border: 2px dashed var(--gray-300); border-radius: 8px; text-align: center;';
          processingDiv.innerHTML = 
            '<div style="display: inline-block; width: 24px; height: 24px; border: 3px solid var(--gray-300); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 8px;"></div>' +
            '<p style="color: var(--gray-700); font-weight: 600; margin: 0;">Frage ' + (i + 1) + ' wird ausgef\xFChrt...</p>' +
            '<p style="color: var(--gray-600); font-size: 14px; margin: 4px 0 0 0;">' + prompt.question + '</p>';
          responsesList.appendChild(processingDiv);
          processingDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          
          try {
            const response = await fetch('/api/workflow/executePrompt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                runId: currentRunId,
                prompt: prompt,
                userInput: workflowData
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'API Fehler: ' + response.status);
            }
            
            const data = await response.json();
            
            console.log('\u{1F4E1} API Response data:', JSON.stringify(data, null, 2));
            console.log('\u{1F4CA} Response outputText:', data.response?.outputText);
            console.log('\u{1F4CA} Response citations:', JSON.stringify(data.response?.citations, null, 2));
            console.log('\u{1F4CA} Analysis citations:', JSON.stringify(data.analysis?.citations, null, 2));
            console.log('\u{1F4CA} Citations count in response:', data.response?.citations?.length || 0);
            console.log('\u{1F4CA} Citations count in analysis:', data.analysis?.citations?.length || 0);
            console.log('\u{1F4CA} Full response object keys:', data.response ? Object.keys(data.response) : 'no response');
            console.log('\u{1F4CA} Full analysis object keys:', data.analysis ? Object.keys(data.analysis) : 'no analysis');
            
            // Remove processing indicator
            const processingEl = document.getElementById('processing_' + i);
            if (processingEl) processingEl.remove();
            
            if (data.response && data.analysis) {
              executedCount++;
              let answerText = data.response.outputText || '';
              
              console.log('\u2705 Answer text length:', answerText.length);
              console.log('\u2705 Answer text preview:', answerText.substring(0, 100));
              console.log('\u{1F4CA} Full response object:', data.response);
              
              // If answer is empty, try to get it from different paths
              if (!answerText || answerText.trim().length === 0) {
                console.warn('\u26A0\uFE0F Empty answer text! Trying fallback paths...');
                if (data.response?.text) {
                  answerText = data.response.text;
                  console.log('\u2705 Found text in response.text');
                } else if (data.response?.content) {
                  answerText = typeof data.response.content === 'string' 
                    ? data.response.content 
                    : JSON.stringify(data.response.content);
                  console.log('\u2705 Found text in response.content');
                } else if (data.outputText) {
                  answerText = data.outputText;
                  console.log('\u2705 Found text in data.outputText');
                } else {
                  console.warn('\u26A0\uFE0F No answer text found anywhere! Full data:', JSON.stringify(data, null, 2));
                  answerText = '\u26A0\uFE0F Keine Antwort erhalten. Bitte Browser-Konsole f\xFCr Details pr\xFCfen.';
                }
              }
              
              // Use citations directly from GPT-5 Web Search response (response.citations)
              // Fallback to analysis.citations if response.citations is not available
              const responseCitations = data.response?.citations || [];
              const analysisCitations = data.analysis?.citations || [];
              const citations = responseCitations.length > 0 ? responseCitations : analysisCitations;
              
              const brandMentions = data.analysis.brandMentions || { exact: 0, fuzzy: 0, contexts: [] };
              const competitors = data.analysis.competitors || [];
              const sentiment = data.analysis.sentiment || { tone: 'neutral', confidence: 0 };
              
              // Store question and answer for summary
              allQuestionsAndAnswers.push({
                question: prompt.question,
                answer: answerText,
                citations: citations,
                brandMentions: brandMentions,
                competitors: competitors
              });
              
              // Create response card
              const responseDiv = document.createElement('div');
              responseDiv.style.cssText = 'padding: 20px; background: white; border: 1px solid var(--gray-200); border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);';
              
              let citationsHtml = '';
              if (citations.length > 0) {
                citationsHtml = '<div style="margin-top: 16px; padding: 16px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">';
                citationsHtml += '<div style="font-size: 13px; font-weight: 500; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Quellen (' + citations.length + ')</div>';
                citationsHtml += '<div style="display: flex; flex-direction: column; gap: 8px;">';
                citations.forEach(function(citation, idx) {
                  const url = citation.url || '';
                  const title = citation.title || url || 'Unbenannte Quelle';
                  const snippet = citation.snippet || '';
                  citationsHtml += '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="citation-link" style="color: #0369a1; font-size: 13px; text-decoration: none; padding: 12px; background: #ffffff; border-radius: 6px; display: block; border: 1px solid #e5e7eb; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: pointer;">';
                  citationsHtml += '<div style="display: flex; align-items: start; gap: 10px;">';
                  citationsHtml += '<span style="font-weight: 600; color: #3b82f6; font-size: 13px; min-width: 24px; padding-top: 2px;">' + (idx + 1) + '.</span>';
                  citationsHtml += '<div style="flex: 1;">';
                  citationsHtml += '<div style="font-weight: 500; color: #111827; margin-bottom: 4px; line-height: 1.4;">' + title.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
                  if (url) {
                    try {
                      const hostname = new URL(url).hostname;
                      citationsHtml += '<div style="color: #6b7280; font-size: 11px; margin-bottom: 6px; font-family: ui-monospace, monospace;">' + hostname + '</div>';
                    } catch (e) {
                      // Invalid URL, skip hostname
                    }
                  }
                  if (snippet && snippet.trim().length > 0) {
                    citationsHtml += '<div style="color: #6b7280; font-size: 12px; line-height: 1.5; font-style: normal;">';
                    citationsHtml += snippet.substring(0, 120).replace(/</g, '&lt;').replace(/>/g, '&gt;') + (snippet.length > 120 ? '...' : '');
                    citationsHtml += '</div>';
                  }
                  citationsHtml += '</div></div></a>';
                });
                citationsHtml += '</div></div>';
                // Add CSS for citation links hover effect (after HTML is inserted)
                if (!document.getElementById('citation-link-style')) {
                  const style = document.createElement('style');
                  style.id = 'citation-link-style';
                  style.textContent = '.citation-link:hover { border-color: #3b82f6 !important; box-shadow: 0 2px 4px rgba(59,130,246,0.1) !important; transform: translateY(-1px) !important; }';
                  document.head.appendChild(style);
                }
              } else {
                // Show message if no citations available
                citationsHtml = '<div style="margin-top: 16px; padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">';
                citationsHtml += '<div style="font-size: 13px; color: #6b7280;">Keine Quellen verf\xFCgbar</div>';
                citationsHtml += '</div>';
              }
              
              let mentionsHtml = '';
              const totalMentions = brandMentions.exact + brandMentions.fuzzy;
              if (totalMentions > 0) {
                mentionsHtml = '<div style="margin-top: 16px; padding: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">';
                mentionsHtml += '<div style="display: flex; align-items: center; gap: 12px; font-size: 13px;">';
                mentionsHtml += '<span style="color: #10b981; font-weight: 600;">Markenerw\xE4hnungen gefunden</span>';
                mentionsHtml += '<span style="color: #6b7280;">\u2022</span>';
                mentionsHtml += '<span style="color: #374151;"><strong>' + brandMentions.exact + '</strong> exakt</span>';
                if (brandMentions.fuzzy > 0) {
                  mentionsHtml += '<span style="color: #6b7280;">\u2022</span>';
                  mentionsHtml += '<span style="color: #374151;"><strong>' + brandMentions.fuzzy + '</strong> \xE4hnlich</span>';
                }
                mentionsHtml += '</div></div>';
              }
              
              // Competitors section removed as requested
              let competitorsHtml = '';
              
              responseDiv.innerHTML = 
                '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">' +
                '<span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #3b82f6; color: white; border-radius: 8px; font-weight: 600; font-size: 15px; flex-shrink: 0;">' + (i + 1) + '</span>' +
                '<h4 style="margin: 0; color: #111827; font-size: 17px; font-weight: 600; line-height: 1.4;">' + prompt.question.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</h4>' +
                '</div>' +
                '<div style="margin-bottom: 16px;">' +
                '<div style="font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Antwort</div>' +
                '<div style="white-space: pre-wrap; background: #f9fafb; padding: 18px; border-radius: 8px; border: 1px solid #e5e7eb; color: #374151; line-height: 1.7; font-size: 14px; max-height: 400px; overflow-y: auto;">' + 
                answerText.replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
                '</div>' +
                '</div>' +
                mentionsHtml +
                citationsHtml;
              
              responsesList.appendChild(responseDiv);
              responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
              throw new Error('Ung\xFCltige Antwort vom Server');
            }
          } catch (error) {
            // Remove processing indicator
            const processingEl = document.getElementById('processing_' + i);
            if (processingEl) processingEl.remove();
            
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'padding: 16px; background: #ffebee; border: 1px solid #f44336; border-radius: 8px; border-left: 4px solid #f44336;';
            errorDiv.innerHTML = 
              '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">' +
              '<span style="font-size: 20px;">\u274C</span>' +
              '<strong style="color: #c62828;">Fehler bei Frage ' + (i + 1) + ':</strong>' +
              '</div>' +
              '<p style="margin: 4px 0; color: var(--gray-700);">' + prompt.question + '</p>' +
              '<small style="color: #d32f2f;">' + (error.message || 'Unbekannter Fehler') + '</small>';
            responsesList.appendChild(errorDiv);
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
        
        // Final update
        if (progressFill) {
          progressFill.style.width = '100%';
          progressFill.style.transition = 'width 0.3s ease';
        }
        if (progressText) progressText.textContent = '\u2705 Analyse abgeschlossen! ' + executedCount + ' von ' + promptsLength + ' Fragen erfolgreich ausgef\xFChrt';
        if (statusEl) {
          statusEl.textContent = '\u2705 Schritt 5 abgeschlossen';
          statusEl.style.color = '#059669';
        }
        if (statusDetailsEl) statusDetailsEl.textContent = 'Alle Fragen wurden ausgef\xFChrt. Ergebnisse sind unten sichtbar.';
        
        // Save all responses
        try {
          await fetch('/api/workflow/step5', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              runId: currentRunId,
              prompts: workflowData.prompts
            })
          });
        } catch (error) {
          console.error('Error saving responses:', error);
        }
        
        // Generate summary/fazit after all questions are answered
        if (executedCount > 0 && allQuestionsAndAnswers.length > 0) {
          await generateSummary(allQuestionsAndAnswers, workflowData);
        }
        
        const loading = document.getElementById('loading');
        if (loading) {
          loading.style.display = 'none';
          loading.classList.remove('show');
        }
      } catch (error) {
        console.error('Error in executeStep5:', error);
        throw error;
      }
    }

    async function generateSummary(questionsAndAnswers, workflowData) {
      try {
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        const responsesList = document.getElementById('responsesList');
        
        if (statusEl) {
          statusEl.textContent = '\u{1F4CA} Fazit wird generiert...';
          statusEl.style.color = '#7c3aed';
        }
        if (statusDetailsEl) {
          statusDetailsEl.textContent = 'GPT analysiert alle Fragen und Antworten...';
        }
        
        // Check if responsesList exists
        if (!responsesList) {
          console.error('\u274C responsesList element not found');
          throw new Error('Responses list element not found');
        }
        
        // Show loading indicator
        const summaryLoadingDiv = document.createElement('div');
        summaryLoadingDiv.id = 'summaryLoading';
        summaryLoadingDiv.style.cssText = 'padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center; margin-top: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        summaryLoadingDiv.innerHTML = 
          '<div style="display: inline-block; width: 32px; height: 32px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px;"></div>' +
          '<p style="color: white; font-weight: 600; margin: 0; font-size: 16px;">Fazit wird generiert...</p>' +
          '<p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">GPT analysiert alle Fragen und Antworten</p>';
        responsesList.appendChild(summaryLoadingDiv);
        summaryLoadingDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Call API to generate summary
        const response = await fetch('/api/workflow/generateSummary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            runId: currentRunId,
            questionsAndAnswers: questionsAndAnswers,
            userInput: workflowData
          })
        });
        
        if (!response.ok) {
          throw new Error('Fehler beim Generieren des Fazits');
        }
        
        const summaryData = await response.json();
        
        // Remove loading indicator
        const loadingEl = document.getElementById('summaryLoading');
        if (loadingEl) loadingEl.remove();
        
        // Display summary
        const summaryDiv = document.createElement('div');
        summaryDiv.id = 'summary';
        summaryDiv.style.cssText = 'padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-top: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: white;';
        
        const totalMentions = summaryData.totalMentions || 0;
        const totalCitations = summaryData.totalCitations || 0;
        const bestPrompts = summaryData.bestPrompts || [];
        const otherSources = summaryData.otherSources || {};
        
        let bestPromptsHtml = '';
        if (bestPrompts.length > 0) {
          bestPromptsHtml = '<div style="margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px);">';
          bestPromptsHtml += '<h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: white;">\u{1F3C6} Beste Prompts:</h4>';
          bestPromptsHtml += '<ul style="margin: 0; padding-left: 20px; list-style: none;">';
          bestPrompts.forEach(function(prompt, idx) {
            bestPromptsHtml += '<li style="margin-bottom: 8px; padding: 8px 12px; background: rgba(255,255,255,0.1); border-radius: 6px; border-left: 3px solid white;">';
            bestPromptsHtml += '<span style="font-weight: 600; margin-right: 8px;">' + (idx + 1) + '.</span>';
            bestPromptsHtml += '<span>' + prompt.question.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
            bestPromptsHtml += '<div style="margin-top: 4px; font-size: 12px; opacity: 0.9;">Erw\xE4hnungen: ' + prompt.mentions + ', Zitierungen: ' + prompt.citations + '</div>';
            bestPromptsHtml += '</li>';
          });
          bestPromptsHtml += '</ul></div>';
        }
        
        let otherSourcesHtml = '';
        const sourceEntries = Object.entries(otherSources);
        if (sourceEntries.length > 0) {
          otherSourcesHtml = '<div style="margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px);">';
          otherSourcesHtml += '<h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: white;">\u{1F4DA} Andere Quellen:</h4>';
          otherSourcesHtml += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">';
          sourceEntries.forEach(function([source, count]) {
            otherSourcesHtml += '<div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px; text-align: center;">';
            otherSourcesHtml += '<div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">' + count + '</div>';
            otherSourcesHtml += '<div style="font-size: 12px; opacity: 0.9; word-break: break-word;">' + source.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
            otherSourcesHtml += '</div>';
          });
          otherSourcesHtml += '</div></div>';
        }
        
        summaryDiv.innerHTML = 
          '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">' +
          '<span style="font-size: 32px;">\u{1F4CA}</span>' +
          '<h3 style="margin: 0; font-size: 24px; font-weight: 700; color: white;">Fazit</h3>' +
          '</div>' +
          '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">' +
          '<div style="padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px); text-align: center;">' +
          '<div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">' + totalMentions + '</div>' +
          '<div style="font-size: 14px; opacity: 0.9;">Anzahl Erw\xE4hnungen</div>' +
          '</div>' +
          '<div style="padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px); text-align: center;">' +
          '<div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">' + totalCitations + '</div>' +
          '<div style="font-size: 14px; opacity: 0.9;">Anzahl Zitierungen</div>' +
          '</div>' +
          '</div>' +
          bestPromptsHtml +
          otherSourcesHtml;
        
        // Check if responsesList still exists before appending
        if (responsesList) {
          responsesList.appendChild(summaryDiv);
          summaryDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          console.error('\u274C responsesList element not found when trying to append summary');
        }
        
        if (statusEl) {
          statusEl.textContent = '\u2705 Fazit generiert';
          statusEl.style.color = '#059669';
        }
        if (statusDetailsEl) {
          statusDetailsEl.textContent = 'Alle Analysen abgeschlossen';
        }
      } catch (error) {
        console.error('Error generating summary:', error);
        const loadingEl = document.getElementById('summaryLoading');
        if (loadingEl) loadingEl.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'padding: 16px; background: #ffebee; border: 1px solid #f44336; border-radius: 8px; margin-top: 24px;';
        errorDiv.innerHTML = 
          '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">' +
          '<span style="font-size: 20px;">\u274C</span>' +
          '<strong style="color: #c62828;">Fehler beim Generieren des Fazits:</strong>' +
          '</div>' +
          '<small style="color: #d32f2f;">' + (error.message || 'Unbekannter Fehler') + '</small>';
        const responsesList = document.getElementById('responsesList');
        if (responsesList) responsesList.appendChild(errorDiv);
      }
    }

    const analyzeForm = document.getElementById('analyzeForm');
    if (!analyzeForm) {
      console.error('\u274C Form element not found!');
      alert('Fehler: Formular nicht gefunden. Bitte Seite neu laden.');
      return;
    }
    
    console.log('\u2705 Form found, adding event listeners...');
    
    // Handle button click - PRIMARY METHOD
    const startBtn = document.getElementById('startAnalysisBtn');
    if (!startBtn) {
      console.error('\u274C Start button not found!');
      alert('Fehler: Start-Button nicht gefunden. Bitte Seite neu laden.');
      return;
    }
    
    console.log('\u2705 Start button found, attaching click handler...');
    
    // Override the inline onclick with our full handler
    startBtn.onclick = async function(e) {
      console.log('\u{1F535} Button clicked via onclick handler!');
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      try {
        // Visual feedback immediately
        startBtn.disabled = true;
        const originalText = startBtn.textContent;
        startBtn.textContent = 'Starte Analyse...';
        startBtn.style.opacity = '0.7';
        startBtn.style.cursor = 'not-allowed';
        
        console.log('\u{1F535} Calling handleFormSubmit...');
        await handleFormSubmit();
        
        // Re-enable button after completion
        startBtn.disabled = false;
        startBtn.textContent = originalText;
        startBtn.style.opacity = '1';
        startBtn.style.cursor = 'pointer';
      } catch (error) {
        console.error('\u274C Error in button click handler:', error);
        alert('Fehler beim Starten der Analyse: ' + (error.message || error));
        
        // Re-enable button on error
        startBtn.disabled = false;
        startBtn.textContent = 'Analyse starten';
        startBtn.style.opacity = '1';
        startBtn.style.cursor = 'pointer';
      }
    };
    
    console.log('\u2705 Button onclick handler attached');
    
    // Prevent form submission on Enter key in input fields
    const formInputs = analyzeForm.querySelectorAll('input, select');
    formInputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          console.log('\u{1F535} Enter key pressed, triggering button click');
          startBtn.click();
        }
      });
    });
    
    // Also handle form submit (as fallback)
    analyzeForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('\u{1F535} Form submitted (fallback)!');
      startBtn.click(); // Trigger button click instead
    });
    
    // Prevent AI Readiness form from submitting to wrong handler
    const aiReadinessForm = document.getElementById('aiReadinessForm');
    if (aiReadinessForm) {
      aiReadinessForm.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('\u{1F535} AI Readiness form submitted - preventing default');
        // Call startAIReadiness if available
        if (window.startAIReadiness) {
          window.startAIReadiness();
        }
        return false;
      });
    }
    
    console.log('\u2705 All event listeners attached successfully');
    
    // Make functions available globally for startAnalysisNow
    window.executeStep1 = executeStep1;
    window.executeStep2 = executeStep2;
    window.executeStep3 = executeStep3;
    window.executeStep4 = executeStep4;
    window.executeStep5 = executeStep5;

    // Helper functions
    function hideAllSections() {
      const analysisSection = document.querySelector('.content-area > .card');
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const aiReadinessSection = document.getElementById('aiReadinessSection');
      if (analysisSection) analysisSection.style.display = 'none';
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (aiReadinessSection) aiReadinessSection.style.display = 'none';
    }
    
    function updateNavActive(event) {
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      }
    }
    
    // Dashboard functionality
    function showDashboard(event) {
      hideAllSections();
      const analysisSection = document.querySelector('.content-area > .card');
      if (analysisSection) {
        analysisSection.style.display = 'block';
      }
      updateNavActive(event);
    }
    
    // Analyses functionality
    function showAnalyses(event) {
      hideAllSections();
      const analysesSection = document.getElementById('analysesSection');
      if (analysesSection) {
        analysesSection.style.display = 'block';
        loadAnalyses();
      }
      updateNavActive(event);
    }
    
    // AI Readiness functionality
    function showAIReadiness(event) {
      hideAllSections();
      const aiReadinessSection = document.getElementById('aiReadinessSection');
      if (aiReadinessSection) {
        aiReadinessSection.style.display = 'block';
      }
      updateNavActive(event);
    }
    
    // Start AI Readiness Check
    async function startAIReadiness() {
      const urlInput = document.getElementById('aiReadinessUrl');
      const url = urlInput?.value?.trim();
      
      if (!url) {
        alert('Bitte geben Sie eine URL ein.');
            return;
          }
          
      // Validate URL
      let websiteUrl = url;
      const urlPattern = new RegExp('^https?:\\/\\/', 'i');
      if (!urlPattern.test(websiteUrl)) {
        websiteUrl = 'https://' + websiteUrl;
      }
      
      try {
        new URL(websiteUrl);
      } catch (e) {
        alert('Ung\xFCltige URL. Bitte geben Sie eine g\xFCltige URL ein.');
        return;
      }
      
      const loadingEl = document.getElementById('aiReadinessLoading');
      const resultsEl = document.getElementById('aiReadinessResults');
      const statusEl = document.getElementById('aiReadinessStatus');
      const statusDetailsEl = document.getElementById('aiReadinessStatusDetails');
      const progressEl = document.getElementById('aiReadinessProgress');
      const progressTextEl = document.getElementById('aiReadinessProgressText');
      const resultsContentEl = document.getElementById('aiReadinessResultsContent');
      const consoleEl = document.getElementById('aiReadinessConsole');
      const consoleContentEl = document.getElementById('aiReadinessConsoleContent');
      
      // Console logging function
      const addConsoleLog = (message, type = 'info') => {
        if (!consoleContentEl) return;
        const timestamp = new Date().toLocaleTimeString('de-DE');
        const colors = {
          info: '#4fc3f7',
          success: '#66bb6a',
          warning: '#ffa726',
          error: '#ef5350',
          system: '#6a9955'
        };
        const icons = {
          info: '\u2139\uFE0F',
          success: '\u2705',
          warning: '\u26A0\uFE0F',
          error: '\u274C',
          system: '\u{1F535}'
        };
        const color = colors[type] || colors.info;
        const icon = icons[type] || icons.info;
        const logLine = document.createElement('div');
        logLine.style.color = color;
        logLine.style.marginBottom = '4px';
        const timestampSpan = document.createElement('span');
        timestampSpan.style.color = '#858585';
        timestampSpan.textContent = '[' + timestamp + ']';
        logLine.appendChild(timestampSpan);
        logLine.appendChild(document.createTextNode(' ' + icon + ' ' + message));
        consoleContentEl.appendChild(logLine);
        consoleContentEl.scrollTop = consoleContentEl.scrollHeight;
      };
      
      // Clear console function
      const clearConsole = () => {
        if (consoleContentEl) {
          consoleContentEl.innerHTML = '<div style="color: #6a9955;">[System] Console gel\xF6scht.</div>';
        }
      };
      
      // Setup clear button
      const clearBtn = document.getElementById('clearConsoleBtn');
      if (clearBtn) {
        clearBtn.onclick = clearConsole;
      }
      
      if (loadingEl) {
        loadingEl.style.display = 'block';
        loadingEl.classList.add('show');
      }
      if (consoleEl) {
        consoleEl.style.display = 'block';
        clearConsole();
        addConsoleLog('AI Readiness Analyse gestartet', 'system');
        addConsoleLog('Ziel-URL: ' + websiteUrl, 'info');
      }
      if (resultsEl) resultsEl.style.display = 'none';
      if (statusEl) statusEl.textContent = 'Vorbereitung...';
      if (statusDetailsEl) statusDetailsEl.textContent = 'Starte AI Readiness Check...';
      if (progressEl) progressEl.style.width = '0%';
      if (progressTextEl) progressTextEl.textContent = '0%';
      
      try {
        // Step 1: Start analysis
        addConsoleLog('Starte Analyse-Request an Server...', 'info');
        if (statusEl) statusEl.textContent = 'Schritt 1: robots.txt und Sitemap holen...';
        if (statusDetailsEl) statusDetailsEl.textContent = 'Lade robots.txt und Sitemap...';
        if (progressEl) progressEl.style.width = '20%';
        if (progressTextEl) progressTextEl.textContent = '20%';
        
        const step1Response = await fetch('/api/ai-readiness/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteUrl })
        });
        
        if (!step1Response.ok) {
          addConsoleLog('Fehler beim Starten der Analyse', 'error');
          throw new Error('Fehler beim Starten der Analyse');
        }
        
        const step1Data = await step1Response.json();
        addConsoleLog('Analyse gestartet. Run ID: ' + step1Data.runId, 'success');
        addConsoleLog('Warte auf Hintergrund-Verarbeitung...', 'info');
        
        // Wait for completion (polling)
        let attempts = 0;
        const maxAttempts = 120; // 10 minutes max (120 * 5 seconds)
        let recommendations = null;
        let lastMessage = '';
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          
          const statusResponse = await fetch('/api/ai-readiness/status/' + step1Data.runId);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            // Log status updates
            if (statusData.message && statusData.message !== lastMessage) {
              addConsoleLog(statusData.message, 'info');
              lastMessage = statusData.message;
              
              // Parse step from message
              if (statusData.message.includes('Schritt 1')) {
                if (progressEl) progressEl.style.width = '15%';
                if (progressTextEl) progressTextEl.textContent = '15%';
                if (statusEl) statusEl.textContent = 'Schritt 1/6: robots.txt';
              } else if (statusData.message.includes('Schritt 2')) {
                if (progressEl) progressEl.style.width = '30%';
                if (progressTextEl) progressTextEl.textContent = '30%';
                if (statusEl) statusEl.textContent = 'Schritt 2/6: Sitemap';
              } else if (statusData.message.includes('Schritt 3')) {
                if (progressEl) progressEl.style.width = '45%';
                if (progressTextEl) progressTextEl.textContent = '45%';
                if (statusEl) statusEl.textContent = 'Schritt 3/6: Homepage';
              } else if (statusData.message.includes('Schritt 4')) {
                if (progressEl) progressEl.style.width = '60%';
                if (progressTextEl) progressTextEl.textContent = '60%';
                if (statusEl) statusEl.textContent = 'Schritt 4/6: Seiten scrapen';
              } else if (statusData.message.includes('Schritt 5')) {
                if (progressEl) progressEl.style.width = '75%';
                if (progressTextEl) progressTextEl.textContent = '75%';
                if (statusEl) statusEl.textContent = 'Schritt 5/6: Daten analysieren';
              } else if (statusData.message.includes('Schritt 6')) {
                if (progressEl) progressEl.style.width = '85%';
                if (progressTextEl) progressTextEl.textContent = '85%';
                if (statusEl) statusEl.textContent = 'Schritt 6/6: GPT-Analyse';
              }
            }
            
            if (statusData.status === 'completed') {
              addConsoleLog('Analyse erfolgreich abgeschlossen!', 'success');
              recommendations = statusData.recommendations;
              break;
            } else if (statusData.status === 'error') {
              addConsoleLog('Fehler: ' + (statusData.error || 'Unbekannter Fehler'), 'error');
              throw new Error(statusData.error || 'Fehler bei der Analyse');
            }
            
            // Update progress
            if (statusDetailsEl && statusData.message) {
              statusDetailsEl.textContent = statusData.message;
            }
          } else {
            addConsoleLog('Status-Abfrage fehlgeschlagen (Versuch ' + (attempts + 1) + '/' + maxAttempts + ')', 'warning');
          }
          
          attempts++;
        }
        
        if (!recommendations) {
          addConsoleLog('Timeout: Die Analyse hat zu lange gedauert.', 'error');
          throw new Error('Timeout: Die Analyse hat zu lange gedauert.');
        }
        
        // Display results
        addConsoleLog('Ergebnisse werden angezeigt...', 'success');
        if (statusEl) statusEl.textContent = '\u2705 Analyse abgeschlossen';
        if (statusDetailsEl) statusDetailsEl.textContent = 'AI Readiness Check erfolgreich durchgef\xFChrt';
        if (progressEl) progressEl.style.width = '100%';
        if (progressTextEl) progressTextEl.textContent = '100%';
        
        if (resultsContentEl) {
          resultsContentEl.innerHTML = 
            '<div style="white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #374151;">' +
            recommendations.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
            '</div>';
        }
        
        if (resultsEl) resultsEl.style.display = 'block';
        
      } catch (error) {
        console.error('Error in AI Readiness check:', error);
        addConsoleLog('Fehler: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'), 'error');
        if (statusEl) statusEl.textContent = '\u274C Fehler';
        if (statusDetailsEl) statusDetailsEl.textContent = error instanceof Error ? error.message : 'Unbekannter Fehler';
        alert('Fehler beim AI Readiness Check: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      } finally {
        if (loadingEl) {
          setTimeout(() => {
            loadingEl.style.display = 'none';
            loadingEl.classList.remove('show');
          }, 2000);
        }
      }
    }
    
    function loadAnalyses() {
      const analysesList = document.getElementById('analysesList');
      if (!analysesList) return;
      
      analysesList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--gray-500);">Lade Analysen...</div>';
      
      fetch('/api/analyses')
        .then(res => res.json())
        .then(analyses => {
          if (analyses.length === 0) {
            analysesList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--gray-500);">Keine Analysen vorhanden. Starte eine neue Analyse.</div>';
            return;
          }
          
          analysesList.innerHTML = analyses.map(function(analysis) {
            const createdAt = new Date(analysis.createdAt);
            const statusBadge = analysis.status === 'completed' 
              ? '<span style="padding: 4px 12px; background: #059669; color: white; border-radius: 12px; font-size: 12px; font-weight: 600;">Abgeschlossen</span>'
              : analysis.status === 'running'
              ? '<span style="padding: 4px 12px; background: #d97706; color: white; border-radius: 12px; font-size: 12px; font-weight: 600;">L\xE4uft</span>'
              : '<span style="padding: 4px 12px; background: #cbd5e1; color: white; border-radius: 12px; font-size: 12px; font-weight: 600;">' + analysis.status + '</span>';
            
            const runId = analysis.id || '';
            return '<div style="padding: 20px; background: white; border: 1px solid var(--gray-200); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: all 0.2s;">' +
              '<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">' +
                '<div style="flex: 1;">' +
                  '<h4 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: var(--gray-900);">' + (analysis.websiteUrl || 'Unbekannte URL') + '</h4>' +
                  '<p style="margin: 0; font-size: 13px; color: var(--gray-500);">' + createdAt.toLocaleString('de-DE') + '</p>' +
                '</div>' +
                statusBadge +
              '</div>' +
              '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px;">' +
                '<div>' +
                  '<div style="font-size: 11px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Land</div>' +
                  '<div style="font-size: 14px; font-weight: 600; color: var(--gray-900);">' + (analysis.country || '') + '</div>' +
                '</div>' +
                '<div>' +
                  '<div style="font-size: 11px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Sprache</div>' +
                  '<div style="font-size: 14px; font-weight: 600; color: var(--gray-900);">' + (analysis.language || '') + '</div>' +
                '</div>' +
                '<div>' +
                  '<div style="font-size: 11px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Region</div>' +
                  '<div style="font-size: 14px; font-weight: 600; color: var(--gray-900);">' + (analysis.region || '-') + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="margin-top: 16px; display: flex; gap: 8px;">' +
                '<button class="btn btn-primary" data-run-id="' + String(runId).replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" onclick="viewAnalysisDetails(this.dataset.runId)" style="flex: 1; padding: 8px 16px; font-size: 13px;">' +
                  '\u{1F4CA} Details anzeigen' +
                '</button>' +
                (analysis.status === 'running' 
                  ? '<button class="btn" data-run-id="' + String(runId).replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" onclick="pauseAnalysis(this.dataset.runId)" style="padding: 8px 16px; font-size: 13px; background: var(--warning); color: white;">\u23F8 Pausieren</button>'
                  : '') +
                '<button class="btn" data-run-id="' + String(runId).replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" onclick="deleteAnalysis(this.dataset.runId)" style="padding: 8px 16px; font-size: 13px; background: var(--error); color: white;">\u{1F5D1} L\xF6schen</button>' +
              '</div>' +
            '</div>';
          }).join('');
        })
        .catch(err => {
          console.error('Error loading analyses:', err);
          analysesList.innerHTML = '<div style="text-align: center; padding: 40px; color: #dc2626;">Fehler beim Laden der Analysen.</div>';
        });
    }
    
    function viewAnalysisDetails(runId) {
      console.log('\u{1F50D} Loading analysis details for runId:', runId);
      hideAllSections();
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const analysisDetailContent = document.getElementById('analysisDetailContent');
      const analysisDetailTitle = document.getElementById('analysisDetailTitle');
      
      if (!analysisDetailSection || !analysisDetailContent) {
        console.error('\u274C Analysis detail elements not found!');
        return;
      }
      
      analysisDetailSection.style.display = 'block';
      analysisDetailContent.innerHTML = 
        '<div style="text-align: center; padding: 40px; color: var(--gray-500);">' +
        '<div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>' +
        '<p style="margin-top: 16px; font-size: 14px;">Lade Analyse-Insights...</p>' +
        '<p style="margin-top: 8px; font-size: 12px; color: var(--gray-400);">Dies kann einige Sekunden dauern</p>' +
        '</div>';
      
      // Add spinner animation if not already present
      if (!document.getElementById('spinnerStyle')) {
        const style = document.createElement('style');
        style.id = 'spinnerStyle';
        style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
      }
      
      // Fetch insights instead of full analysis
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      fetch('/api/analysis/' + runId + '/insights', {
        signal: controller.signal
      })
        .then(res => {
          if (!res.ok) {
            return res.text().then(text => {
              throw new Error('HTTP ' + res.status + ': ' + text.substring(0, 200));
            });
          }
          return res.json();
        })
        .then(insights => {
          clearTimeout(timeoutId);
          const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log('\u2705 Insights loaded in', loadTime, 'seconds');
          
          if (insights.error) {
            console.error('\u274C API returned error:', insights.error);
            analysisDetailContent.innerHTML = '<div style="color: #dc2626; padding: 20px;">Fehler: ' + insights.error + '</div>';
            return;
          }
          
          // Validate that insights has required structure
          if (!insights || !insights.summary) {
            console.error('\u274C Invalid insights data structure:', insights);
            analysisDetailContent.innerHTML = '<div style="color: #dc2626; padding: 20px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
              '<strong>\u274C Fehler beim Laden der Insights</strong><br>' +
              '<p style="margin-top: 8px; color: #c62828;">Ung\xFCltige Datenstruktur erhalten. Bitte versuche es erneut.</p>' +
              '<p style="margin-top: 12px; font-size: 12px; color: #666;">Empfangen: ' + JSON.stringify(insights).substring(0, 200) + '</p>' +
              '</div>';
            return;
          }
          
          // Ensure all required fields exist with defaults
          if (!insights.summary) {
            insights.summary = { totalBrandMentions: 0, totalBrandCitations: 0, promptsWithMentions: 0, totalPrompts: 0 };
          }
          if (!insights.promptsWithMentions) {
            insights.promptsWithMentions = [];
          }
          if (!insights.allCompetitors) {
            insights.allCompetitors = [];
          }
          if (!insights.detailedData) {
            insights.detailedData = [];
          }
          
          console.log('\u{1F4CA} Insights data:', {
            totalBrandMentions: insights.summary.totalBrandMentions,
            totalBrandCitations: insights.summary.totalBrandCitations,
            promptsWithMentions: insights.summary.promptsWithMentions,
            totalPrompts: insights.summary.totalPrompts
          });
          
          // Build insights dashboard - Professional design
          let html = '<div style="margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">';
          html += '<h2 style="margin: 0 0 8px 0; color: #111827; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Analyse-Ergebnisse</h2>';
          html += '<div style="display: flex; gap: 24px; margin-top: 12px; font-size: 14px; color: #6b7280;">';
          html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;"></span> ' + (insights.websiteUrl || '') + '</span>';
          if (insights.brandName) {
            html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span> ' + insights.brandName + '</span>';
          }
          html += '</div>';
          html += '</div>';
          
          // Summary Metrics Cards - Clean, professional design
          html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 48px;">';
          html += '<div style="padding: 28px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;">';
          html += '<div style="font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Markenerw\xE4hnungen</div>';
          html += '<div style="font-size: 42px; font-weight: 700; color: #111827; margin-bottom: 4px; line-height: 1;">' + (insights.summary?.totalBrandMentions || 0) + '</div>';
          html += '<div style="font-size: 13px; color: #9ca3af; margin-top: 8px;">Gesamtanzahl</div>';
          html += '</div>';
          
          html += '<div style="padding: 28px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;">';
          html += '<div style="font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Zitationen</div>';
          html += '<div style="font-size: 42px; font-weight: 700; color: #111827; margin-bottom: 4px; line-height: 1;">' + (insights.summary?.totalBrandCitations || 0) + '</div>';
          html += '<div style="font-size: 13px; color: #9ca3af; margin-top: 8px;">Von dieser Marke</div>';
          html += '</div>';
          
          html += '<div style="padding: 28px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;">';
          html += '<div style="font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Erfolgreiche Prompts</div>';
          html += '<div style="font-size: 42px; font-weight: 700; color: #111827; margin-bottom: 4px; line-height: 1;">' + (insights.summary?.promptsWithMentions || 0) + '</div>';
          html += '<div style="font-size: 13px; color: #9ca3af; margin-top: 8px;">von ' + (insights.summary?.totalPrompts || 0) + ' analysiert</div>';
          html += '</div>';
          html += '</div>';
          
          // Prompts where brand is mentioned - Professional design
          if (insights.promptsWithMentions && insights.promptsWithMentions.length > 0) {
            html += '<div style="margin-bottom: 48px;">';
            html += '<h3 style="margin: 0 0 24px 0; color: #111827; font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">Prompts mit Markenerw\xE4hnungen</h3>';
            html += '<div style="display: grid; gap: 16px;">';
            insights.promptsWithMentions.forEach(function(prompt) {
              html += '<div style="padding: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">';
              html += '<div style="font-weight: 500; color: #111827; margin-bottom: 12px; font-size: 15px; line-height: 1.5;">' + (prompt?.question || 'Unbekannte Frage').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
              html += '<div style="display: flex; gap: 24px; font-size: 13px; color: #6b7280; padding-top: 12px; border-top: 1px solid #f3f4f6;">';
              html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="color: #3b82f6; font-weight: 600;">' + (prompt?.mentionCount || 0) + '</span> Erw\xE4hnungen</span>';
              html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="color: #10b981; font-weight: 600;">' + (prompt?.citationCount || 0) + '</span> Zitationen</span>';
              html += '</div>';
              html += '</div>';
            });
            html += '</div></div>';
          }
          
          // Competitors section removed as requested
          
          // Detailed data (collapsible) - Professional design
          html += '<div style="margin-bottom: 32px;">';
          html += '<details style="cursor: pointer;">';
          html += '<summary style="padding: 18px 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; font-weight: 500; color: #111827; font-size: 15px; user-select: none; transition: background 0.2s;">Detaillierte Analyse-Ergebnisse</summary>';
          html += '<div style="display: grid; gap: 20px; margin-top: 20px;">';
          (insights.detailedData || []).forEach(function(data) {
            html += '<div style="padding: 24px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">';
            html += '<div style="font-weight: 500; color: #111827; margin-bottom: 16px; font-size: 16px; line-height: 1.5;">' + (data?.question || 'Unbekannte Frage').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
            if (data?.answer) {
              const answerText = String(data.answer || '');
              html += '<div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 16px; font-size: 14px; color: #374151; line-height: 1.7;">';
              html += answerText.substring(0, 400).replace(/</g, '&lt;').replace(/>/g, '&gt;') + (answerText.length > 400 ? '...' : '');
              html += '</div>';
            }
            html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6;">';
            html += '<div style="font-size: 13px;"><span style="color: #6b7280; display: block; margin-bottom: 4px;">Erw\xE4hnungen</span><span style="color: #111827; font-weight: 600; font-size: 18px;">' + (data?.brandMentions?.total || 0) + '</span></div>';
            html += '<div style="font-size: 13px;"><span style="color: #6b7280; display: block; margin-bottom: 4px;">Zitate (Marke)</span><span style="color: #111827; font-weight: 600; font-size: 18px;">' + (data?.citations?.brandCitations || 0) + '</span></div>';
            html += '<div style="font-size: 13px;"><span style="color: #6b7280; display: block; margin-bottom: 4px;">Zitate (gesamt)</span><span style="color: #111827; font-weight: 600; font-size: 18px;">' + (data?.citations?.total || 0) + '</span></div>';
            html += '</div>';
            html += '</div>';
          });
          html += '</div></details></div>';
          
          analysisDetailContent.innerHTML = html;
          console.log('\u2705 Analysis details rendered successfully');
        })
        .catch(err => {
          clearTimeout(timeoutId);
          const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
          console.error('\u274C Error loading analysis insights after', loadTime, 'seconds:', err);
          
          let errorMessage = 'Unbekannter Fehler';
          if (err.name === 'AbortError') {
            errorMessage = 'Zeit\xFCberschreitung: Die Anfrage hat zu lange gedauert (>30 Sekunden). Bitte versuche es erneut.';
          } else if (err && err.message) {
            errorMessage = err.message;
          }
          analysisDetailContent.innerHTML = 
            '<div style="color: #dc2626; padding: 20px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
            '<strong>\u274C Fehler beim Laden der Analyse-Insights</strong><br>' +
            '<p style="margin-top: 8px; color: #c62828;">' + errorMessage + '</p>' +
            '<p style="margin-top: 12px; font-size: 12px; color: #666;">Bitte \xFCberpr\xFCfe die Browser-Konsole f\xFCr weitere Details oder versuche es sp\xE4ter erneut.</p>' +
            '<button data-run-id="' + String(runId).replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" onclick="viewAnalysisDetails(this.dataset.runId)" class="btn" style="margin-top: 12px; padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">\u{1F504} Erneut versuchen</button>' +
            '</div>';
        });
    }
    
    function deleteAnalysis(runId) {
      if (!confirm('M\xF6chtest du diese Analyse wirklich l\xF6schen? Diese Aktion kann nicht r\xFCckg\xE4ngig gemacht werden.')) {
        return;
      }
      
      fetch('/api/analysis/' + runId, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert('Analyse erfolgreich gel\xF6scht!');
            loadAnalyses(); // Reload the list
          } else {
            alert('Fehler beim L\xF6schen: ' + (data.error || 'Unbekannter Fehler'));
          }
        })
        .catch(err => {
          console.error('Error deleting analysis:', err);
          alert('Fehler beim L\xF6schen der Analyse.');
        });
    }
    
    function pauseAnalysis(runId) {
      if (!confirm('M\xF6chtest du diese Analyse pausieren?')) {
            return;
          }
          
      fetch('/api/analysis/' + runId + '/pause', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
          })
            .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert('Analyse erfolgreich pausiert!');
            loadAnalyses(); // Reload the list
          } else {
            alert('Fehler beim Pausieren: ' + (data.error || 'Unbekannter Fehler'));
          }
        })
        .catch(err => {
          console.error('Error pausing analysis:', err);
          alert('Fehler beim Pausieren der Analyse.');
        });
    }
    
    // Store full implementations for use by global stubs
    window.showDashboardFull = showDashboard;
    window.showAnalysesFull = showAnalyses;
    window.showAIReadinessFull = showAIReadiness;
    window.startAIReadinessFull = startAIReadiness;
    window.loadAnalyses = loadAnalyses;
    window.viewAnalysisDetailsFull = viewAnalysisDetails;
    window.deleteAnalysisFull = deleteAnalysis;
    window.pauseAnalysisFull = pauseAnalysis;
    
    // Update global functions to use full implementations
    // Note: window.startAIReadiness is already defined in <head> script, don't override it
    window.showDashboard = showDashboard;
    window.showAnalyses = showAnalyses;
    window.showAIReadiness = showAIReadiness;
    window.viewAnalysisDetails = viewAnalysisDetails;
    window.deleteAnalysis = deleteAnalysis;
    window.pauseAnalysis = pauseAnalysis;
    }); // End of DOMContentLoaded
  <\/script>
</body>
</html>`;
        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            ...corsHeaders
          }
        });
      }
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "The requested endpoint does not exist",
          availableEndpoints: [
            "GET /",
            "POST /api/analyze",
            "POST /api/test/analyze",
            "POST /api/chat",
            "GET /api/analysis/:runId",
            "GET /api/analysis/:runId/metrics",
            "GET /api/health"
          ]
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (error) {
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
  }
  async handleFetchUrl(request, env, corsHeaders) {
    const body = await request.json();
    const { url } = body;
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
        return new Response(JSON.stringify({ content: text.substring(0, 2e3) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({ content: null, error: "Failed to fetch" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ content: null, error: error instanceof Error ? error.message : "Unknown error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
  async handleExecutePrompt(request, env, corsHeaders) {
    const body = await request.json();
    const { runId, prompt, userInput } = body;
    try {
      const { LLMExecutor: LLMExecutor2 } = await Promise.resolve().then(() => (init_llm_execution(), llm_execution_exports));
      const { getConfig: getConfig2 } = await Promise.resolve().then(() => (init_config(), config_exports));
      const config = getConfig2(env);
      const executor = new LLMExecutor2(config);
      const response = await executor.executePrompt(prompt);
      const websiteUrl = userInput?.websiteUrl || "";
      const brandName = this.extractBrandName(websiteUrl);
      const { AnalysisEngine: AnalysisEngine2 } = await Promise.resolve().then(() => (init_analysis(), analysis_exports));
      const analysisEngine = new AnalysisEngine2(brandName, 0.7);
      const analysis = analysisEngine.analyzeResponses([prompt], [response])[0];
      const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
      const db = new Database2(env.geo_db);
      if (runId) {
        try {
          await db.savePrompts(runId, [prompt]);
        } catch (error) {
          if (!error.message?.includes("UNIQUE constraint")) {
            console.warn("Error saving prompt (may already exist):", error.message);
          }
        }
      }
      await db.saveLLMResponses([response]);
      await db.savePromptAnalyses([analysis]);
      console.log(`\u2705 Saved question, answer, and analysis for prompt ${prompt.id} at ${(/* @__PURE__ */ new Date()).toISOString()}`);
      return new Response(JSON.stringify({
        response,
        analysis: {
          // Original analysis fields
          brandMentions: analysis.brandMentions,
          citations: response.citations || [],
          // Use citations directly from GPT-5 Web Search response
          competitors: analysis.competitors,
          sentiment: analysis.sentiment,
          citationCount: response.citations?.length || 0,
          citationUrls: response.citations?.map((c) => c.url) || [],
          brandCitations: analysis.brandCitations || [],
          // Structured answers to the three key questions:
          // 1. Bin ich erwähnt? Wenn ja, wie viel?
          isMentioned: analysis.isMentioned,
          mentionCount: analysis.mentionCount,
          // 2. Werde ich zitiert? Wenn ja, wo und was?
          isCited: analysis.isCited,
          citationDetails: analysis.citationDetails,
          // 3. Welche anderen Unternehmen werden genannt und wo?
          competitorDetails: analysis.competitorDetails
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error in handleExecutePrompt:", error);
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : void 0
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
  async handleGenerateSummary(request, env, corsHeaders) {
    const body = await request.json();
    const { runId, questionsAndAnswers, userInput } = body;
    try {
      const websiteUrl = userInput?.websiteUrl || "";
      const brandName = this.extractBrandName(websiteUrl);
      let totalMentions = 0;
      let totalCitations = 0;
      const promptScores = [];
      const sourceCounts = {};
      questionsAndAnswers.forEach((qa) => {
        const mentions = (qa.brandMentions?.exact || 0) + (qa.brandMentions?.fuzzy || 0);
        const citations = qa.citations?.length || 0;
        totalMentions += mentions;
        totalCitations += citations;
        const score = mentions * 2 + citations;
        promptScores.push({
          question: qa.question,
          mentions,
          citations,
          score
        });
        if (qa.citations && Array.isArray(qa.citations)) {
          qa.citations.forEach((citation) => {
            if (citation.url) {
              try {
                const url = new URL(citation.url);
                const hostname = url.hostname.replace(/^www\./, "");
                sourceCounts[hostname] = (sourceCounts[hostname] || 0) + 1;
              } catch (e) {
              }
            }
          });
        }
      });
      promptScores.sort((a, b) => b.score - a.score);
      const bestPrompts = promptScores.slice(0, 5).map((p) => ({
        question: p.question,
        mentions: p.mentions,
        citations: p.citations
      }));
      const summaryPrompt = `Du bist ein Experte f\xFCr Markenanalyse. Analysiere die folgenden Fragen und Antworten und erstelle ein pr\xE4zises Fazit.

Marke: ${brandName}
Website: ${websiteUrl}

Fragen und Antworten:
${questionsAndAnswers.map(
        (qa, idx) => `${idx + 1}. Frage: ${qa.question}
   Antwort: ${qa.answer.substring(0, 500)}${qa.answer.length > 500 ? "..." : ""}
   Erw\xE4hnungen: ${(qa.brandMentions?.exact || 0) + (qa.brandMentions?.fuzzy || 0)}, Zitierungen: ${qa.citations?.length || 0}`
      ).join("\n\n")}

Bitte erstelle ein strukturiertes Fazit im JSON-Format mit folgenden Feldern:
{
  "totalMentions": ${totalMentions},
  "totalCitations": ${totalCitations},
  "bestPrompts": [${bestPrompts.map((p) => JSON.stringify({ question: p.question, mentions: p.mentions, citations: p.citations })).join(", ")}],
  "otherSources": ${JSON.stringify(sourceCounts)},
  "summary": "Eine kurze Zusammenfassung der wichtigsten Erkenntnisse"
}

Antworte NUR mit dem JSON-Objekt, ohne zus\xE4tzlichen Text.`;
      const { LLMExecutor: LLMExecutor2 } = await Promise.resolve().then(() => (init_llm_execution(), llm_execution_exports));
      const { getConfig: getConfig2 } = await Promise.resolve().then(() => (init_config(), config_exports));
      const config = getConfig2(env);
      const executor = new LLMExecutor2(config);
      const summaryPromptObj = {
        id: `summary-${runId}`,
        question: summaryPrompt,
        category: "summary",
        intent: "high"
      };
      const gptResponse = await executor.executePrompt(summaryPromptObj);
      const responseText = gptResponse.outputText || "";
      let summaryData = {
        totalMentions,
        totalCitations,
        bestPrompts,
        otherSources: sourceCounts,
        summary: responseText
      };
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          summaryData = { ...summaryData, ...parsed };
        }
      } catch (e) {
        console.warn("Could not parse JSON from GPT response, using calculated values");
      }
      return new Response(JSON.stringify(summaryData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error in handleGenerateSummary:", error);
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : void 0
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
  extractBrandName(websiteUrl) {
    try {
      const url = new URL(websiteUrl);
      const hostname = url.hostname.replace("www.", "");
      const parts = hostname.split(".");
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch {
      return "Company";
    }
  }
  async handleChat(request, env, corsHeaders) {
    try {
      console.log("\u{1F4AC} Chat endpoint called");
      console.log("\u{1F4AC} Request method:", request.method);
      console.log("\u{1F4AC} Request URL:", request.url);
      let body;
      try {
        body = await request.json();
      } catch (jsonError2) {
        console.error("\u274C Failed to parse request JSON:", jsonError2);
        return new Response(
          JSON.stringify({ error: "Invalid JSON in request body" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      const { question } = body;
      console.log("\u{1F4AC} Chat request received:", question);
      if (!question || question.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Question is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      if (!env.OPENAI_API_KEY) {
        console.error("\u274C OPENAI_API_KEY not found in environment");
        return new Response(
          JSON.stringify({ error: "OpenAI API key not configured" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      console.log("\u{1F4E6} Importing modules...");
      const { LLMExecutor: LLMExecutor2 } = await Promise.resolve().then(() => (init_llm_execution(), llm_execution_exports));
      const { getConfig: getConfig2 } = await Promise.resolve().then(() => (init_config(), config_exports));
      console.log("\u2699\uFE0F Getting config...");
      const config = getConfig2(env);
      console.log("\u2705 Config received, model:", config.openai.model);
      console.log("\u{1F527} Creating LLMExecutor...");
      const executor = new LLMExecutor2(config);
      const chatPrompt = {
        id: `chat_${Date.now()}`,
        categoryId: "chat",
        question: question.trim(),
        language: "de",
        country: "CH",
        intent: "high",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("\u{1F916} Executing chat prompt with GPT-5 Web Search...");
      console.log("\u{1F4CB} Prompt:", JSON.stringify(chatPrompt, null, 2));
      const response = await executor.executePrompt(chatPrompt);
      console.log("\u2705 Chat response received:");
      console.log("  - OutputText length:", response.outputText?.length || 0);
      console.log("  - Citations count:", response.citations?.length || 0);
      console.log("  - OutputText preview:", response.outputText?.substring(0, 200) || "EMPTY");
      if (!response.outputText || response.outputText.trim().length === 0) {
        console.warn("\u26A0\uFE0F Empty response from LLMExecutor!");
        return new Response(
          JSON.stringify({
            error: "Keine Antwort von GPT-5 erhalten. Bitte versuche es erneut.",
            answer: "",
            citations: response.citations || []
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      return new Response(
        JSON.stringify({
          answer: response.outputText,
          outputText: response.outputText,
          // Also include as outputText for compatibility
          citations: response.citations || []
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("\u274C Error in chat handler:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : void 0;
      const errorName = error instanceof Error ? error.name : "Error";
      console.error("\u274C Error name:", errorName);
      console.error("\u274C Error message:", errorMessage);
      if (errorStack) {
        console.error("\u274C Error stack:", errorStack);
      }
      console.error("\u274C Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return new Response(
        JSON.stringify({
          error: errorMessage,
          errorName,
          details: errorStack ? errorStack.split("\n").slice(0, 5).join("\n") : void 0
          // First 5 lines of stack
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  async handleAnalyze(request, env, corsHeaders) {
    const body = await request.json();
    let websiteUrl = body.websiteUrl?.trim();
    if (websiteUrl) {
      const urlPattern4 = new RegExp("^https?:\\/\\/", "i");
      if (!urlPattern4.test(websiteUrl)) {
        websiteUrl = "https://" + websiteUrl;
      }
    }
    const userInput = {
      websiteUrl,
      country: body.country,
      region: body.region,
      language: body.language
    };
    if (!userInput.websiteUrl || !userInput.country || !userInput.language) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    const runId = await this.engine.runAnalysis(userInput, env);
    return new Response(
      JSON.stringify({
        runId,
        status: "started",
        message: "Analysis started successfully"
      }),
      {
        status: 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
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
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
  async handleGetAnalysis(runId, env, corsHeaders) {
    const result = await this.engine.getAnalysisResult(runId, env);
    if (!result) {
      return new Response(JSON.stringify({ error: "Analysis not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  async handleGetStatus(runId, env, corsHeaders) {
    const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
    const db = new Database2(env.geo_db);
    const status = await db.getAnalysisStatus(runId);
    if (!status) {
      return new Response(JSON.stringify({ error: "Analysis not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(status), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  async handleGetMetrics(runId, env, corsHeaders) {
    const result = await this.engine.getAnalysisResult(runId, env);
    if (!result) {
      return new Response(JSON.stringify({ error: "Analysis not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    return new Response(
      JSON.stringify({
        categoryMetrics: result.categoryMetrics,
        competitiveAnalysis: result.competitiveAnalysis,
        timeSeries: result.timeSeries
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
  async handleStep1(request, env, corsHeaders) {
    try {
      const body = await request.json();
      let websiteUrl = body.websiteUrl?.trim();
      if (websiteUrl) {
        const urlPattern5 = new RegExp("^https?:\\/\\/", "i");
        if (!urlPattern5.test(websiteUrl)) {
          websiteUrl = "https://" + websiteUrl;
        }
      }
      const userInput = {
        websiteUrl,
        country: body.country,
        region: body.region,
        language: body.language
      };
      const result = await this.workflowEngine.step1FindSitemap(userInput, env);
      return new Response(JSON.stringify({
        runId: result.runId,
        urls: result.urls,
        foundSitemap: result.foundSitemap,
        message: result.foundSitemap ? `Sitemap gefunden: ${result.urls.length} URLs` : `Keine Sitemap gefunden. ${result.urls.length} URLs von Startseite extrahiert`
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
  async handleStep2(request, env, corsHeaders) {
    const body = await request.json();
    const { runId, urls } = body;
    const result = await this.workflowEngine.step2FetchContent(
      runId,
      urls,
      body.language,
      env
    );
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  async handleStep3(request, env, corsHeaders) {
    const body = await request.json();
    const { runId, content, language } = body;
    const categories = await this.workflowEngine.step3GenerateCategories(
      runId,
      content,
      language,
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
    const body = await request.json();
    const { runId, categories, userInput, questionsPerCategory, companyId } = body;
    const prompts = await this.workflowEngine.step4GeneratePrompts(
      runId,
      categories,
      userInput,
      body.content || "",
      env,
      questionsPerCategory || 3,
      companyId
      // Pass companyId to save prompts to company_prompts
    );
    return new Response(JSON.stringify({ prompts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  async handleSavePrompts(runId, request, env, corsHeaders) {
    const body = await request.json();
    const { prompts } = body;
    await this.workflowEngine.saveUserPrompts(runId, prompts, env);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  async handleStep5(request, env, corsHeaders) {
    const body = await request.json();
    const { runId, prompts } = body;
    const result = await this.workflowEngine.step5ExecutePrompts(
      runId,
      prompts,
      env
    );
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  // Execute scheduled run: Load saved prompts from company_prompts and execute them
  async handleExecuteScheduledRun(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { companyId, scheduleId } = body;
      if (!companyId) {
        return new Response(
          JSON.stringify({ error: "companyId is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
      const db = new Database2();
      const savedPrompts = await db.getCompanyPrompts(companyId, true);
      if (savedPrompts.length === 0) {
        return new Response(
          JSON.stringify({ error: "No active prompts found for this company" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      return new Response(
        JSON.stringify({
          message: "Scheduled run executed",
          promptsExecuted: savedPrompts.length
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
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
  // Setup database - Run all migrations
  async handleSetupDatabase(request, env, corsHeaders) {
    return new Response(
      JSON.stringify({
        success: true,
        message: "Database setup is disabled - no database dependencies in this project",
        results: ["Database operations are disabled"]
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
  // Test Analysis: Analyze manual input
  async handleTestAnalyze(request, env, corsHeaders) {
    try {
      const body = await request.json();
      if (!body.brandName || !body.question || !body.answer) {
        return new Response(
          JSON.stringify({ error: "brandName, question, and answer are required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      const prompt = {
        id: `test_${Date.now()}`,
        categoryId: "test",
        question: body.question,
        language: "de",
        country: "CH",
        intent: "high",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const response = {
        promptId: prompt.id,
        outputText: body.answer,
        citations: body.citations || [],
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        model: "test"
      };
      const { AnalysisEngine: AnalysisEngine2 } = await Promise.resolve().then(() => (init_analysis(), analysis_exports));
      const analysisEngine = new AnalysisEngine2(body.brandName, 0.7);
      const analysis = analysisEngine.analyzeResponses([prompt], [response])[0];
      return new Response(
        JSON.stringify({
          prompt: {
            id: prompt.id,
            question: prompt.question
          },
          response: {
            outputText: response.outputText,
            citations: response.citations,
            timestamp: response.timestamp
          },
          analysis: {
            // Brand Mentions
            brandMentions: {
              exact: analysis.brandMentions.exact,
              fuzzy: analysis.brandMentions.fuzzy,
              total: analysis.brandMentions.exact + analysis.brandMentions.fuzzy,
              contexts: analysis.brandMentions.contexts
            },
            // Citations
            citations: {
              total: analysis.citationCount,
              urls: analysis.citationUrls,
              brandCitations: analysis.brandCitations,
              allCitations: response.citations
            },
            // Competitors
            competitors: analysis.competitors.map((c) => ({
              name: c.name,
              count: c.count,
              contexts: c.contexts,
              citationUrls: c.citations
            })),
            // Sentiment
            sentiment: {
              tone: analysis.sentiment.tone,
              confidence: analysis.sentiment.confidence,
              keywords: analysis.sentiment.keywords
            },
            // Structured Answers
            isMentioned: analysis.isMentioned,
            mentionCount: analysis.mentionCount,
            isCited: analysis.isCited,
            citationDetails: analysis.citationDetails,
            competitorDetails: analysis.competitorDetails
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Error in handleTestAnalyze:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          details: error instanceof Error ? error.stack : void 0
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
  // Get detailed insights for an analysis
  async handleGetAnalysisInsights(runId, env, corsHeaders) {
    try {
      const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
      const db = new Database2(env.geo_db);
      const run = await db.db.prepare("SELECT * FROM analysis_runs WHERE id = ?").bind(runId).first();
      if (!run) {
        return new Response(JSON.stringify({ error: "Analysis not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const brandName = this.extractBrandName(run.website_url);
      const prompts = await db.db.prepare("SELECT * FROM prompts WHERE analysis_run_id = ? ORDER BY created_at ASC").bind(runId).all();
      if (!prompts.results || prompts.results.length === 0) {
        return new Response(JSON.stringify({
          error: "No prompts found for this analysis",
          summary: {
            totalBrandMentions: 0,
            totalBrandCitations: 0,
            promptsWithMentions: 0,
            totalPrompts: 0
          },
          promptsWithMentions: [],
          allCompetitors: [],
          detailedData: []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const insightsData = await Promise.all(
        (prompts.results || []).map(async (prompt) => {
          const response = await db.db.prepare("SELECT * FROM llm_responses WHERE prompt_id = ? ORDER BY timestamp DESC LIMIT 1").bind(prompt.id).first();
          const citations = response ? await db.db.prepare("SELECT * FROM citations WHERE llm_response_id = ?").bind(response.id).all() : { results: [] };
          const analysis = await db.db.prepare("SELECT * FROM prompt_analyses WHERE prompt_id = ? ORDER BY timestamp DESC LIMIT 1").bind(prompt.id).first();
          let competitors = { results: [] };
          try {
            if (analysis) {
              const competitorsResult = await db.db.prepare("SELECT * FROM competitor_mentions WHERE prompt_analysis_id = ?").bind(analysis.id).all();
              competitors = {
                results: competitorsResult.results || []
              };
            }
          } catch (e) {
            console.warn("Error fetching competitors for prompt", prompt.id, ":", e);
            competitors = { results: [] };
          }
          const brandCitations = (citations.results || []).filter((citation) => {
            try {
              const text = `${citation.title || ""} ${citation.snippet || ""}`.toLowerCase();
              return text.includes(brandName.toLowerCase());
            } catch (e) {
              console.warn("Error checking brand citation:", e);
              return false;
            }
          });
          let contexts = [];
          try {
            if (analysis?.brand_mentions_contexts) {
              contexts = JSON.parse(analysis.brand_mentions_contexts);
            }
          } catch (e) {
            console.warn("Error parsing brand_mentions_contexts:", e);
            contexts = [];
          }
          return {
            promptId: prompt.id,
            question: prompt.question,
            answer: response?.output_text || null,
            timestamp: response?.timestamp || null,
            // Metriken
            brandMentions: {
              total: (analysis?.brand_mentions_exact || 0) + (analysis?.brand_mentions_fuzzy || 0),
              exact: analysis?.brand_mentions_exact || 0,
              fuzzy: analysis?.brand_mentions_fuzzy || 0,
              contexts
            },
            citations: {
              total: analysis?.citation_count || 0,
              brandCitations: brandCitations.length,
              // Wie oft zitiert von meiner Seite
              allCitations: (citations.results || []).map((c) => ({
                url: c.url,
                title: c.title,
                snippet: c.snippet,
                mentionsBrand: brandCitations.some((bc) => bc.id === c.id)
              }))
            },
            competitors: (competitors.results || []).map((c) => {
              let citationUrls = [];
              try {
                citationUrls = JSON.parse(c.citation_urls || "[]");
              } catch (e) {
                console.warn("Error parsing citation_urls for competitor:", e);
                citationUrls = [];
              }
              return {
                name: c.competitor_name,
                count: c.mention_count,
                citationUrls
              };
            })
          };
        })
      );
      const totalBrandMentions = insightsData.reduce((sum, d) => sum + (d?.brandMentions?.total || 0), 0);
      const totalBrandCitations = insightsData.reduce((sum, d) => sum + (d?.citations?.brandCitations || 0), 0);
      const promptsWithMentions = insightsData.filter((d) => (d?.brandMentions?.total || 0) > 0);
      const allCompetitors = /* @__PURE__ */ new Map();
      insightsData.forEach((data) => {
        if (data?.competitors && Array.isArray(data.competitors)) {
          data.competitors.forEach((comp) => {
            if (comp?.name) {
              if (!allCompetitors.has(comp.name)) {
                allCompetitors.set(comp.name, { count: 0, prompts: [] });
              }
              const entry = allCompetitors.get(comp.name);
              entry.count += comp.count || 0;
              if (data.question) {
                entry.prompts.push(data.question);
              }
            }
          });
        }
      });
      const insights = {
        runId,
        websiteUrl: run.website_url,
        brandName,
        summary: {
          totalBrandMentions: totalBrandMentions || 0,
          totalBrandCitations: totalBrandCitations || 0,
          promptsWithMentions: promptsWithMentions.length || 0,
          totalPrompts: insightsData.length || 0
        },
        promptsWithMentions: (promptsWithMentions || []).map((d) => ({
          question: d?.question || "",
          mentionCount: d?.brandMentions?.total || 0,
          citationCount: d?.citations?.brandCitations || 0
        })),
        allCompetitors: Array.from(allCompetitors.entries()).map(([name, data]) => ({
          name: name || "",
          totalMentions: data?.count || 0,
          mentionedInPrompts: data?.prompts || []
        })),
        detailedData: insightsData || []
      };
      return new Response(JSON.stringify(insights), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error getting analysis insights:", error);
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
  // Delete an analysis
  async handleDeleteAnalysis(runId, env, corsHeaders) {
    try {
      const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
      const db = new Database2(env.geo_db);
      await db.db.prepare("DELETE FROM citations WHERE llm_response_id IN (SELECT id FROM llm_responses WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?))").bind(runId).run();
      await db.db.prepare("DELETE FROM competitor_mentions WHERE prompt_analysis_id IN (SELECT id FROM prompt_analyses WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?))").bind(runId).run();
      await db.db.prepare("DELETE FROM prompt_analyses WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?)").bind(runId).run();
      await db.db.prepare("DELETE FROM llm_responses WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?)").bind(runId).run();
      await db.db.prepare("DELETE FROM prompts WHERE analysis_run_id = ?").bind(runId).run();
      await db.db.prepare("DELETE FROM categories WHERE analysis_run_id = ?").bind(runId).run();
      await db.db.prepare("DELETE FROM analysis_runs WHERE id = ?").bind(runId).run();
      return new Response(JSON.stringify({ success: true, message: "Analysis deleted successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
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
  // Pause an analysis
  // AI Readiness: Get status
  async handleAIReadinessStatus(runId, env, corsHeaders) {
    try {
      const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
      const db = new Database2(env.geo_db);
      try {
        await db.db.exec(
          "CREATE TABLE IF NOT EXISTS ai_readiness_runs (id TEXT PRIMARY KEY, website_url TEXT NOT NULL, status TEXT NOT NULL, robots_txt TEXT, sitemap_urls TEXT, total_urls INTEGER, recommendations TEXT, message TEXT, error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"
        );
      } catch (e) {
        if (!e?.message?.includes("already exists") && !e?.message?.includes("duplicate")) {
          console.warn("Could not create ai_readiness_runs table (may already exist):", e);
        }
      }
      const result = await db.db.prepare("SELECT * FROM ai_readiness_runs WHERE id = ?").bind(runId).first();
      if (!result) {
        return new Response(
          JSON.stringify({ error: "Run not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      return new Response(
        JSON.stringify({
          runId: result.id,
          status: result.status,
          recommendations: result.recommendations,
          message: result.message,
          error: result.error
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Error in handleAIReadinessStatus:", error);
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
  // AI Readiness: Process analysis (async)
  async processAIReadiness(runId, websiteUrl, env) {
    const { Database: Database2 } = await Promise.resolve().then(() => (init_persistence(), persistence_exports));
    const db = new Database2(env.geo_db);
    const report = {
      websiteUrl,
      robotsTxt: { found: false, content: "", note: "" },
      sitemap: { found: false, urls: [], note: "" },
      homepage: { scraped: false, data: null },
      pages: [],
      summary: {
        totalPages: 0,
        successfulPages: 0,
        averageResponseTime: 0,
        fastestPage: "",
        slowestPage: ""
      }
    };
    const updateStatus = /* @__PURE__ */ __name(async (message) => {
      try {
        console.log(`[AI Readiness ${runId}] Status update: ${message}`);
        await db.db.prepare("UPDATE ai_readiness_runs SET message = ?, updated_at = ? WHERE id = ?").bind(message, (/* @__PURE__ */ new Date()).toISOString(), runId).run();
      } catch (e) {
        console.error(`[AI Readiness ${runId}] Error updating status:`, e);
      }
    }, "updateStatus");
    console.log(`[AI Readiness ${runId}] processAIReadiness started for ${websiteUrl}`);
    try {
      try {
        await db.db.exec(
          "CREATE TABLE IF NOT EXISTS ai_readiness_runs (id TEXT PRIMARY KEY, website_url TEXT NOT NULL, status TEXT NOT NULL, robots_txt TEXT, sitemap_urls TEXT, total_urls INTEGER, recommendations TEXT, message TEXT, error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"
        );
      } catch (e) {
        if (!e?.message?.includes("already exists") && !e?.message?.includes("duplicate")) {
          console.warn("Could not create ai_readiness_runs table:", e);
        }
      }
      try {
        await db.db.prepare("INSERT OR IGNORE INTO ai_readiness_runs (id, website_url, status, created_at, updated_at, message) VALUES (?, ?, ?, ?, ?, ?)").bind(runId, websiteUrl, "processing", (/* @__PURE__ */ new Date()).toISOString(), (/* @__PURE__ */ new Date()).toISOString(), "Starte Analyse...").run();
      } catch (e) {
        await db.db.prepare("UPDATE ai_readiness_runs SET message = ?, updated_at = ? WHERE id = ?").bind("Starte Analyse...", (/* @__PURE__ */ new Date()).toISOString(), runId).run();
      }
      console.log(`[AI Readiness ${runId}] Updating status to Step 1...`);
      await updateStatus("Schritt 1/6: Pr\xFCfe robots.txt...");
      console.log(`[AI Readiness ${runId}] Status updated successfully`);
      const measureResponseTime = /* @__PURE__ */ __name(async (url) => {
        const startTime2 = Date.now();
        try {
          const response = await fetch(url, {
            headers: { "User-Agent": "GEO-Platform/1.0" },
            signal: AbortSignal.timeout(15e3)
            // 15 second timeout
          });
          const html = await response.text();
          const responseTime = Date.now() - startTime2;
          return { responseTime, response, html };
        } catch (error) {
          const responseTime = Date.now() - startTime2;
          return {
            responseTime,
            response: new Response(null, { status: 0, statusText: error.message || "Request failed" }),
            html: ""
          };
        }
      }, "measureResponseTime");
      const scrapePage = /* @__PURE__ */ __name((html, url) => {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : url;
        let textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (textContent.length > 1e4) {
          textContent = textContent.substring(0, 1e4) + "...";
        }
        return { title, content: textContent };
      }, "scrapePage");
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] STEP 1: Checking robots.txt`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      await updateStatus("Schritt 1/6: Pr\xFCfe robots.txt...");
      try {
        const robotsUrl = new URL("/robots.txt", websiteUrl).toString();
        console.log(`[AI Readiness ${runId}] \u2192 Fetching robots.txt from: ${robotsUrl}`);
        const startTime2 = Date.now();
        const { responseTime, response, html } = await measureResponseTime(robotsUrl);
        const totalTime2 = Date.now() - startTime2;
        console.log(`[AI Readiness ${runId}] \u2192 Response Status: ${response.status}`);
        console.log(`[AI Readiness ${runId}] \u2192 Response Time: ${responseTime}ms`);
        console.log(`[AI Readiness ${runId}] \u2192 Content Length: ${html.length} bytes`);
        if (response.ok && response.status !== 0) {
          report.robotsTxt = { found: true, content: html, note: `Gefunden (${responseTime}ms)` };
          console.log(`[AI Readiness ${runId}] \u2713 robots.txt gefunden (${responseTime}ms, ${html.length} bytes)`);
          await updateStatus(`\u2713 robots.txt gefunden (${responseTime}ms)`);
        } else {
          report.robotsTxt = { found: false, content: "", note: `Nicht gefunden (Status: ${response.status})` };
          console.log(`[AI Readiness ${runId}] \u26A0 robots.txt nicht gefunden (Status: ${response.status})`);
          await updateStatus(`\u26A0 robots.txt nicht gefunden`);
        }
      } catch (e) {
        console.error(`[AI Readiness ${runId}] \u274C Error checking robots.txt:`, e.message || e);
        report.robotsTxt = { found: false, content: "", note: "Nicht erreichbar" };
        await updateStatus(`\u26A0 robots.txt nicht erreichbar`);
      }
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] STEP 2: Checking sitemap`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      await updateStatus("Schritt 2/6: Pr\xFCfe Sitemap...");
      try {
        const { SitemapParser: SitemapParser2 } = await Promise.resolve().then(() => (init_sitemap(), sitemap_exports));
        const sitemapParser = new SitemapParser2();
        console.log(`[AI Readiness ${runId}] \u2192 Parsing sitemap for: ${websiteUrl}`);
        const startTime2 = Date.now();
        const sitemapResult = await sitemapParser.findAndParseSitemap(websiteUrl);
        const parseTime = Date.now() - startTime2;
        console.log(`[AI Readiness ${runId}] \u2192 Sitemap found: ${sitemapResult.foundSitemap}`);
        console.log(`[AI Readiness ${runId}] \u2192 URLs found: ${sitemapResult.urls.length}`);
        console.log(`[AI Readiness ${runId}] \u2192 Parse time: ${parseTime}ms`);
        if (sitemapResult.foundSitemap && sitemapResult.urls.length > 0) {
          report.sitemap = { found: true, urls: sitemapResult.urls, note: `${sitemapResult.urls.length} URLs gefunden` };
          console.log(`[AI Readiness ${runId}] \u2713 Sitemap gefunden (${sitemapResult.urls.length} URLs in ${parseTime}ms)`);
          await updateStatus(`\u2713 Sitemap gefunden (${sitemapResult.urls.length} URLs)`);
        } else {
          report.sitemap = { found: false, urls: [], note: "Nicht gefunden" };
          console.log(`[AI Readiness ${runId}] \u26A0 Sitemap nicht gefunden`);
          await updateStatus(`\u26A0 Sitemap nicht gefunden`);
        }
      } catch (e) {
        console.error(`[AI Readiness ${runId}] \u274C Error checking sitemap:`, e.message || e);
        report.sitemap = { found: false, urls: [], note: "Fehler beim Parsen" };
        await updateStatus(`\u26A0 Sitemap-Fehler`);
      }
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] STEP 3: Scraping homepage`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      await updateStatus("Schritt 3/6: Scrape Homepage...");
      try {
        console.log(`[AI Readiness ${runId}] \u2192 Fetching homepage: ${websiteUrl}`);
        const { responseTime, response, html } = await measureResponseTime(websiteUrl);
        console.log(`[AI Readiness ${runId}] \u2192 Response Status: ${response.status}`);
        console.log(`[AI Readiness ${runId}] \u2192 Response Time: ${responseTime}ms`);
        console.log(`[AI Readiness ${runId}] \u2192 HTML Length: ${html.length} bytes`);
        if (response.ok && response.status !== 0 && html) {
          const { title, content } = scrapePage(html, websiteUrl);
          console.log(`[AI Readiness ${runId}] \u2192 Title extracted: ${title.substring(0, 60)}${title.length > 60 ? "..." : ""}`);
          console.log(`[AI Readiness ${runId}] \u2192 Content extracted: ${content.length} characters`);
          report.homepage = {
            scraped: true,
            data: { url: websiteUrl, title, content, responseTime, status: response.status, success: true }
          };
          console.log(`[AI Readiness ${runId}] \u2713 Homepage gescraped (${responseTime}ms, ${content.length} Zeichen)`);
          await updateStatus(`\u2713 Homepage gescraped (${responseTime}ms, ${content.length} Zeichen)`);
        } else {
          report.homepage = {
            scraped: false,
            data: { url: websiteUrl, title: "", content: "", responseTime, status: response.status || 0, success: false }
          };
          console.log(`[AI Readiness ${runId}] \u26A0 Homepage-Fehler (Status: ${response.status || 0})`);
          await updateStatus(`\u26A0 Homepage-Fehler (Status: ${response.status || 0})`);
        }
      } catch (e) {
        console.error(`[AI Readiness ${runId}] \u274C Error scraping homepage:`, e.message || e);
        report.homepage = {
          scraped: false,
          data: { url: websiteUrl, title: "", content: "", responseTime: 0, status: 0, success: false }
        };
        await updateStatus(`\u26A0 Homepage-Fehler`);
      }
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] STEP 4: Scraping pages`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      const urlsToScrape = report.sitemap.found ? report.sitemap.urls.slice(0, 50) : [websiteUrl];
      console.log(`[AI Readiness ${runId}] \u2192 Total pages to scrape: ${urlsToScrape.length}`);
      await updateStatus(`Schritt 4/6: Scrape ${urlsToScrape.length} Seiten...`);
      const startTime = Date.now();
      let successCount = 0;
      let failCount = 0;
      for (let i = 0; i < urlsToScrape.length; i++) {
        const url = urlsToScrape[i];
        try {
          console.log(`[AI Readiness ${runId}] \u2192 [${i + 1}/${urlsToScrape.length}] Scraping: ${url}`);
          const { responseTime, response, html } = await measureResponseTime(url);
          if (response.ok && response.status !== 0 && html) {
            const { title, content } = scrapePage(html, url);
            report.pages.push({
              url,
              title,
              content,
              responseTime,
              status: response.status,
              success: true
            });
            successCount++;
            console.log(`[AI Readiness ${runId}]   \u2713 Success (${responseTime}ms, ${content.length} chars)`);
          } else {
            report.pages.push({
              url,
              title: "",
              content: "",
              responseTime,
              status: response.status || 0,
              success: false
            });
            failCount++;
            console.log(`[AI Readiness ${runId}]   \u2717 Failed (Status: ${response.status || 0})`);
          }
          if ((i + 1) % 5 === 0 || i === urlsToScrape.length - 1) {
            const elapsed = Date.now() - startTime;
            console.log(`[AI Readiness ${runId}] \u2192 Progress: ${i + 1}/${urlsToScrape.length} (${successCount} success, ${failCount} failed, ${elapsed}ms elapsed)`);
            await updateStatus(`Schritt 4/6: ${i + 1}/${urlsToScrape.length} Seiten gescraped...`);
          }
        } catch (e) {
          console.error(`[AI Readiness ${runId}]   \u274C Error scraping ${url}:`, e.message || e);
          report.pages.push({
            url,
            title: "",
            content: "",
            responseTime: 0,
            status: 0,
            success: false
          });
          failCount++;
        }
      }
      const totalTime = Date.now() - startTime;
      console.log(`[AI Readiness ${runId}] \u2713 Step 4 complete: ${report.pages.length} pages scraped (${successCount} success, ${failCount} failed, ${totalTime}ms total)`);
      const successfulPages = report.pages.filter((p) => p.success);
      const responseTimes = report.pages.filter((p) => p.responseTime > 0).map((p) => p.responseTime);
      const avgResponseTime = responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
      const fastestPage = responseTimes.length > 0 ? report.pages.find((p) => p.responseTime === Math.min(...responseTimes))?.url || "" : "";
      const slowestPage = responseTimes.length > 0 ? report.pages.find((p) => p.responseTime === Math.max(...responseTimes))?.url || "" : "";
      report.summary = {
        totalPages: report.pages.length,
        successfulPages: successfulPages.length,
        averageResponseTime: avgResponseTime,
        fastestPage,
        slowestPage
      };
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] STEP 5: Analyzing data`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] \u2192 Total pages: ${report.pages.length}`);
      console.log(`[AI Readiness ${runId}] \u2192 Successful pages: ${successfulPages.length}`);
      console.log(`[AI Readiness ${runId}] \u2192 Average response time: ${avgResponseTime}ms`);
      console.log(`[AI Readiness ${runId}] \u2192 Fastest page: ${fastestPage}`);
      console.log(`[AI Readiness ${runId}] \u2192 Slowest page: ${slowestPage}`);
      await updateStatus(`Schritt 5/6: Analysiere Daten (${successfulPages.length}/${report.pages.length} erfolgreich, \xD8 ${avgResponseTime}ms)...`);
      console.log(`[AI Readiness ${runId}] \u2192 Building GPT prompt...`);
      const promptStartTime = Date.now();
      const prompt = this.buildAIReadinessPromptFromReport(report);
      const promptTime = Date.now() - promptStartTime;
      console.log(`[AI Readiness ${runId}] \u2192 GPT prompt built (${prompt.length} characters, ${promptTime}ms)`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] STEP 6: Sending to GPT`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      await updateStatus("Schritt 6/6: Generiere AI Readiness Analyse mit GPT...");
      console.log(`[AI Readiness ${runId}] \u2192 Sending request to OpenAI API...`);
      const gptStartTime = Date.now();
      const gptResponse = await this.callGPTForAIReadiness(prompt, env);
      const gptTime = Date.now() - gptStartTime;
      console.log(`[AI Readiness ${runId}] \u2192 GPT response received (${gptResponse.length} characters, ${gptTime}ms)`);
      console.log(`[AI Readiness ${runId}] \u2192 Saving results to database...`);
      await db.db.prepare("UPDATE ai_readiness_runs SET status = ?, recommendations = ?, message = ?, robots_txt = ?, updated_at = ? WHERE id = ?").bind(
        "completed",
        gptResponse,
        "\u2713 Analyse abgeschlossen",
        JSON.stringify(report),
        (/* @__PURE__ */ new Date()).toISOString(),
        runId
      ).run();
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] \u2713 ANALYSIS COMPLETE`);
      console.log(`[AI Readiness ${runId}] ========================================`);
    } catch (error) {
      console.error(`[AI Readiness ${runId}] ========================================`);
      console.error(`[AI Readiness ${runId}] \u274C ERROR in processAIReadiness:`, error);
      console.error(`[AI Readiness ${runId}] ========================================`);
      await db.db.prepare(`
          UPDATE ai_readiness_runs 
          SET status = ?, error = ?, updated_at = ?
          WHERE id = ?
        `).bind(
        "error",
        error instanceof Error ? error.message : "Unknown error",
        (/* @__PURE__ */ new Date()).toISOString()
      ).run();
    }
  }
  // Build prompt for AI Readiness analysis from comprehensive report
  buildAIReadinessPromptFromReport(report) {
    let prompt = `# AI READINESS ANALYSE

`;
    prompt += `Analysiere die folgende Website auf AI-Readiness und bewerte, wie gut sie von KI-Systemen gelesen und verstanden werden kann.

`;
    prompt += `## WEBSITE
${report.websiteUrl}

`;
    prompt += `## ROBOTS.TXT
`;
    if (report.robotsTxt.found) {
      prompt += `Status: \u2713 Gefunden
`;
      prompt += `Hinweis: ${report.robotsTxt.note}
`;
      prompt += `Inhalt:
\`\`\`
${report.robotsTxt.content}
\`\`\`

`;
    } else {
      prompt += `Status: \u2717 Nicht gefunden
`;
      prompt += `Hinweis: ${report.robotsTxt.note}

`;
    }
    prompt += `## SITEMAP
`;
    if (report.sitemap.found) {
      prompt += `Status: \u2713 Gefunden
`;
      prompt += `Anzahl URLs: ${report.sitemap.urls.length}
`;
      prompt += `Hinweis: ${report.sitemap.note}
`;
      prompt += `Erste 20 URLs:
${report.sitemap.urls.slice(0, 20).map((url, i) => `${i + 1}. ${url}`).join("\n")}

`;
    } else {
      prompt += `Status: \u2717 Nicht gefunden
`;
      prompt += `Hinweis: ${report.sitemap.note}

`;
    }
    prompt += `## HOMEPAGE
`;
    if (report.homepage.scraped && report.homepage.data) {
      const hp = report.homepage.data;
      prompt += `Status: \u2713 Gescraped
`;
      prompt += `Response Time: ${hp.responseTime}ms
`;
      prompt += `HTTP Status: ${hp.status}
`;
      prompt += `Titel: ${hp.title}
`;
      prompt += `Content-L\xE4nge: ${hp.content.length} Zeichen
`;
      prompt += `Inhalt (Auszug, erste 2000 Zeichen):
${hp.content.substring(0, 2e3)}${hp.content.length > 2e3 ? "..." : ""}

`;
    } else {
      prompt += `Status: \u2717 Nicht gescraped
`;
      prompt += `Hinweis: Homepage konnte nicht geladen werden

`;
    }
    prompt += `## GESCRAEPTE SEITEN (${report.pages.length} Seiten)

`;
    prompt += `### PERFORMANCE-\xDCBERSICHT
`;
    prompt += `- Gesamt: ${report.summary.totalPages} Seiten
`;
    prompt += `- Erfolgreich: ${report.summary.successfulPages} Seiten
`;
    prompt += `- Durchschnittliche Response Time: ${report.summary.averageResponseTime}ms
`;
    prompt += `- Schnellste Seite: ${report.summary.fastestPage} (${report.pages.find((p) => p.url === report.summary.fastestPage)?.responseTime || 0}ms)
`;
    prompt += `- Langsamste Seite: ${report.summary.slowestPage} (${report.pages.find((p) => p.url === report.summary.slowestPage)?.responseTime || 0}ms)

`;
    prompt += `### SEITEN-DETAILS
`;
    report.pages.slice(0, 20).forEach((page, i) => {
      prompt += `
#### Seite ${i + 1}: ${page.title || "Kein Titel"}
`;
      prompt += `- URL: ${page.url}
`;
      prompt += `- Response Time: ${page.responseTime}ms
`;
      prompt += `- HTTP Status: ${page.status}
`;
      prompt += `- Erfolg: ${page.success ? "\u2713" : "\u2717"}
`;
      if (page.success && page.content) {
        prompt += `- Content-L\xE4nge: ${page.content.length} Zeichen
`;
        prompt += `- Inhalt (Auszug, erste 1000 Zeichen):
${page.content.substring(0, 1e3)}${page.content.length > 1e3 ? "..." : ""}
`;
      }
    });
    prompt += `

## AUFGABE

`;
    prompt += `Bewerte diese Website auf AI-Readiness und gib eine strukturierte Analyse:

`;
    prompt += `1. **GESAMTBEWERTUNG**
`;
    prompt += `   - Wie gut ist die Website f\xFCr KI-Systeme lesbar? (1-10)
`;
    prompt += `   - Kurze Zusammenfassung der Hauptprobleme und St\xE4rken

`;
    prompt += `2. **STRUKTUR & ORGANISATION**
`;
    prompt += `   - Bewertung der Sitemap (falls vorhanden)
`;
    prompt += `   - URL-Struktur und -Konsistenz
`;
    prompt += `   - robots.txt Konfiguration

`;
    prompt += `3. **CONTENT-QUALIT\xC4T**
`;
    prompt += `   - Wie strukturiert und semantisch ist der Content?
`;
    prompt += `   - Gibt es klare \xDCberschriften, Meta-Informationen?
`;
    prompt += `   - Ist der Content f\xFCr KI verst\xE4ndlich?

`;
    prompt += `4. **PERFORMANCE**
`;
    prompt += `   - Bewertung der Response Times
`;
    prompt += `   - Empfehlungen zur Performance-Optimierung

`;
    prompt += `5. **PRIORIT\xC4TEN**
`;
    prompt += `   - Top 5 sofort umsetzbare Ma\xDFnahmen
`;
    prompt += `   - Langfristige Verbesserungen

`;
    prompt += `Gib konkrete, umsetzbare Empfehlungen auf Deutsch. Sei spezifisch und beziehe dich auf die tats\xE4chlich gefundenen Daten.`;
    return prompt;
  }
  // Legacy function for backward compatibility
  buildAIReadinessPrompt(websiteUrl, robotsTxt, sitemapUrls, pageContents) {
    return this.buildAIReadinessPromptFromReport({
      websiteUrl,
      robotsTxt: { found: !!robotsTxt, content: robotsTxt, note: robotsTxt ? "Gefunden" : "Nicht gefunden" },
      sitemap: { found: sitemapUrls.length > 0, urls: sitemapUrls, note: sitemapUrls.length > 0 ? `${sitemapUrls.length} URLs` : "Nicht gefunden" },
      homepage: { scraped: true, data: pageContents[0] || null },
      pages: pageContents.map((p) => ({ ...p, responseTime: 0, status: 200, success: true })),
      summary: { totalPages: pageContents.length, successfulPages: pageContents.length, averageResponseTime: 0, fastestPage: "", slowestPage: "" }
    });
  }
  // Call GPT API for AI Readiness recommendations
  async callGPTForAIReadiness(prompt, env) {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[GPT] OPENAI_API_KEY not configured");
      throw new Error("OPENAI_API_KEY not configured");
    }
    try {
      console.log("[GPT] \u2192 Preparing request to OpenAI API...");
      console.log("[GPT] \u2192 Model: gpt-4o-mini");
      console.log("[GPT] \u2192 Prompt length: " + prompt.length + " characters");
      console.log("[GPT] \u2192 Max tokens: 3000");
      console.log("[GPT] \u2192 Timeout: 120 seconds");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Du bist ein Experte f\xFCr AI-Readiness und bewertest, wie gut Websites von KI-Systemen (wie ChatGPT, Claude, etc.) gelesen, verstanden und verarbeitet werden k\xF6nnen. Du analysierst die technische Struktur, Content-Qualit\xE4t, Performance und Zug\xE4nglichkeit und gibst strukturierte, umsetzbare Empfehlungen auf Deutsch."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3e3
        }),
        signal: AbortSignal.timeout(12e4)
        // 2 minutes timeout
      });
      console.log("[GPT] \u2192 Response status: " + response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GPT] \u274C API error: " + response.status + " - " + errorText);
        throw new Error(`GPT API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      const content = data.choices[0]?.message?.content || "Keine Empfehlungen generiert.";
      console.log("[GPT] \u2713 Response received: " + content.length + " characters");
      return content;
    } catch (error) {
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        console.error("[GPT] \u274C Timeout error after 120 seconds");
        throw new Error("GPT API timeout: Die Anfrage hat zu lange gedauert (\xFCber 2 Minuten). Bitte versuchen Sie es erneut.");
      }
      console.error("[GPT] \u274C Error: " + (error.message || error));
      throw error;
    }
  }
};
__name(APIRoutes, "APIRoutes");

// src/engine.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_config();
init_llm_execution();
init_analysis();
init_persistence();
var GEOEngine = class {
  config;
  contentScraper;
  categoryGenerator;
  promptGenerator;
  llmExecutor;
  analysisEngine;
  constructor(env) {
    this.config = getConfig(env);
    this.contentScraper = new ContentScraper(this.config.crawling);
    this.categoryGenerator = new CategoryGenerator();
    this.promptGenerator = new PromptGenerator();
    this.llmExecutor = new LLMExecutor(this.config);
  }
  async runAnalysis(userInput, env) {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const db = new Database(env.geo_db);
    await db.saveAnalysisRun(runId, userInput, "running");
    this.runAnalysisAsync(runId, userInput, env, db).catch(async (error) => {
      console.error("Analysis error:", error);
      await db.updateAnalysisStatus(runId, "failed", {
        step: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Unknown error"
      });
      await db.db.prepare("UPDATE analysis_runs SET error_message = ? WHERE id = ?").bind(error instanceof Error ? error.message : "Unknown error", runId).run();
    });
    return runId;
  }
  async runAnalysisAsync(runId, userInput, env, db) {
    try {
      const brandName = this.extractBrandName(userInput.websiteUrl);
      this.analysisEngine = new AnalysisEngine(
        brandName,
        this.config.analysis.brandFuzzyThreshold
      );
      await db.updateAnalysisStatus(runId, "running", {
        step: "crawling",
        progress: 10,
        message: "Crawling website..."
      });
      const websiteContent = await this.contentScraper.scrapeWebsite(
        userInput.websiteUrl,
        userInput.language
      );
      await db.updateAnalysisStatus(runId, "running", {
        step: "categorizing",
        progress: 30,
        message: "Generating categories..."
      });
      const categories = this.categoryGenerator.generateCategories(
        websiteContent,
        this.config.categories.minConfidence,
        this.config.categories.maxCategories
      );
      await db.saveCategories(runId, categories);
      await db.updateAnalysisStatus(runId, "running", {
        step: "generating_prompts",
        progress: 40,
        message: `Generating prompts for ${categories.length} categories...`
      });
      const prompts = this.promptGenerator.generatePrompts(
        categories,
        userInput,
        this.config.prompts.questionsPerCategory
      );
      await db.savePrompts(runId, prompts);
      await db.updateAnalysisStatus(runId, "running", {
        step: "llm_execution",
        progress: 50,
        message: `Executing ${prompts.length} prompts with GPT-5...`
      });
      const responses = await this.llmExecutor.executePrompts(prompts);
      await db.saveLLMResponses(responses);
      await db.updateAnalysisStatus(runId, "running", {
        step: "analyzing",
        progress: 80,
        message: "Analyzing responses..."
      });
      const analyses = this.analysisEngine.analyzeResponses(prompts, responses);
      await db.savePromptAnalyses(analyses);
      await db.updateAnalysisStatus(runId, "running", {
        step: "calculating_metrics",
        progress: 90,
        message: "Calculating metrics..."
      });
      const categoryMetrics = [];
      for (const category of categories) {
        const metrics = this.analysisEngine.calculateCategoryMetrics(
          category.id,
          prompts,
          analyses
        );
        categoryMetrics.push(metrics);
      }
      await db.saveCategoryMetrics(runId, categoryMetrics);
      const competitiveAnalysis = this.analysisEngine.performCompetitiveAnalysis(analyses, prompts);
      await db.saveCompetitiveAnalysis(runId, competitiveAnalysis);
      const timeSeriesData = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
          (sum, a) => sum + a.competitors.reduce((s, c) => s + c.count, 0),
          0
        )
      };
      await db.saveTimeSeriesData(runId, timeSeriesData);
      await db.updateAnalysisStatus(runId, "completed", {
        step: "completed",
        progress: 100,
        message: "Analysis completed successfully!"
      });
      await db.db.prepare("UPDATE analysis_runs SET updated_at = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), runId).run();
    } catch (error) {
      console.error("Analysis error:", error);
      await db.updateAnalysisStatus(runId, "failed", {
        step: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Unknown error"
      });
      await db.db.prepare("UPDATE analysis_runs SET error_message = ? WHERE id = ?").bind(error instanceof Error ? error.message : "Unknown error", runId).run();
      throw error;
    }
  }
  async getAnalysisResult(runId, env) {
    const db = new Database(env.geo_db);
    return await db.getAnalysisRun(runId);
  }
  extractBrandName(websiteUrl) {
    try {
      const domain = new URL(websiteUrl).hostname;
      const parts = domain.split(".");
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch {
      return "the brand";
    }
  }
  calculateOverallVisibility(categoryMetrics) {
    if (categoryMetrics.length === 0)
      return 0;
    const sum = categoryMetrics.reduce(
      (s, m) => s + m.visibilityScore,
      0
    );
    return sum / categoryMetrics.length;
  }
};
__name(GEOEngine, "GEOEngine");

// src/index.ts
var src_default = {
  async fetch(request, env, ctx) {
    const engine = new GEOEngine(env);
    const routes = new APIRoutes(engine);
    const response = await routes.handleRequest(request, env);
    return response;
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_strip_cf_connecting_ip_header();
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

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-doaM6S/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
init_strip_cf_connecting_ip_header();
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

// .wrangler/tmp/bundle-doaM6S/middleware-loader.entry.ts
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
