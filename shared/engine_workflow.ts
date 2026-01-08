/**
 * Interactive workflow engine for step-by-step analysis
 */

import type { UserInput, Category, Prompt } from "./types.js";
import type { Config } from "./config.js";
import { getConfig } from "./config.js";
import { SitemapParser } from "./ingestion/sitemap.js";
import { ContentScraper } from "./ingestion/index.js";
import { CategoryGenerator } from "./categorization/index.js";
import { PromptGenerator } from "./prompt_generation/index.js";
import { LLMExecutor } from "./llm_execution/index.js";
import { AnalysisEngine } from "./analysis/index.js";
import { Database } from "./persistence/index.js";
import type { D1Database } from "./persistence/index.js";
// Note: OpenAI SDK might not be available in Workers, using fetch instead

export class WorkflowEngine {
  private config: Config;
  private contentScraper: ContentScraper;
  private categoryGenerator: CategoryGenerator;
  private promptGenerator: PromptGenerator;
  private llmExecutor: LLMExecutor;
  private sitemapParser: SitemapParser;
  constructor(env: Record<string, any>) {
    this.config = getConfig(env);
    this.contentScraper = new ContentScraper(this.config.crawling);
    this.categoryGenerator = new CategoryGenerator();
    this.promptGenerator = new PromptGenerator();
    this.llmExecutor = new LLMExecutor(this.config);
    this.sitemapParser = new SitemapParser();
  }

  // Step 1: Find and parse sitemap
  async step1FindSitemap(
    userInput: UserInput,
    env: Record<string, any>
  ): Promise<{ runId: string; urls: string[]; foundSitemap: boolean }> {
    try {
      const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const db = new Database(env.geo_db as D1Database);

      await db.saveAnalysisRun(runId, userInput, "running");

      const result = await this.sitemapParser.findAndParseSitemap(
        userInput.websiteUrl
      );

      await db.db
        .prepare(
          "UPDATE analysis_runs SET sitemap_urls = ?, step = ?, updated_at = ? WHERE id = ?"
        )
        .bind(JSON.stringify(result.urls), "content", new Date().toISOString(), runId)
        .run();

      return { runId, urls: result.urls, foundSitemap: result.foundSitemap };
    } catch (error) {
      console.error("Error in step1FindSitemap:", error);
      throw error;
    }
  }

  // Step 2: Fetch content from URLs
  async step2FetchContent(
    runId: string,
    urls: string[],
    language: string,
    env: Record<string, any>
  ): Promise<{ pageCount: number; content: string }> {
    const db = new Database(env.geo_db as D1Database);

    await db.db
      .prepare("UPDATE analysis_runs SET step = ?, updated_at = ? WHERE id = ?")
      .bind("content", new Date().toISOString(), runId)
      .run();

    // Limit to first 50 URLs for performance
    const urlsToFetch = urls.slice(0, 50);
    let pageCount = 0;
    const allContent: string[] = [];

    for (const url of urlsToFetch) {
      try {
        const response = await fetch(url, {
          headers: { "User-Agent": this.config.crawling.userAgent },
          signal: AbortSignal.timeout(this.config.crawling.timeout),
        });

        if (response.ok) {
          const html = await response.text();
          // Extract text content (simplified)
          const textContent = this.extractTextContent(html);
          allContent.push(textContent);
          pageCount++;
        }
      } catch (error) {
        // Skip failed URLs
        continue;
      }
    }

    const combinedContent = allContent.join("\n\n");

    await db.db
      .prepare("UPDATE analysis_runs SET step = ?, updated_at = ? WHERE id = ?")
      .bind("categories", new Date().toISOString(), runId)
      .run();

    return { pageCount, content: combinedContent };
  }

  private extractTextContent(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, " ");
    // Clean up whitespace
    return text.replace(/\s+/g, " ").trim();
  }

  // Step 3: Generate categories/keywords with GPT
  async step3GenerateCategories(
    runId: string,
    content: string,
    language: string,
    env: Record<string, any>
  ): Promise<Category[]> {
    const db = new Database(env.geo_db as D1Database);

    // Use GPT to generate categories from content
    const prompt = `Analyze the following website content and suggest 15-20 thematic categories/keywords that represent the main topics, products, or services. 
Return only a JSON object with a "categories" array of objects: {"categories": [{"name": "Category Name", "description": "Brief description", "keywords": ["keyword1", "keyword2"]}]}
Content (first 8000 chars): ${content.substring(0, 8000)}
Language: ${language}
Return only valid JSON object with categories array, no other text.`;

    try {
      // Use OpenAI API via fetch (compatible with Workers) with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      let response: Response;
      try {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.openai.apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 2000,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
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

      let gptResponse: any;
      try {
        const content = data.choices[0].message.content || "{}";
        gptResponse = JSON.parse(content);
      } catch (parseError) {
        console.error("Failed to parse GPT response:", data.choices[0].message.content);
        throw new Error("Failed to parse JSON response from GPT");
      }

      const categories: Category[] = [];

      // Parse GPT response - handle both formats
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
          sourcePages: [],
        });
      }

      // Also use traditional category generator as fallback
      // Extract domain from content or use a default
      let rootDomain = "";
      try {
        // Try to extract domain from content if it contains URLs
        const urlMatch = content.match(/https?:\/\/([^\/\s]+)/i);
        if (urlMatch) {
          rootDomain = urlMatch[1];
        }
      } catch (e) {
        // Ignore
      }

      const traditionalCategories = this.categoryGenerator.generateCategories(
        {
          rootDomain: rootDomain,
          pages: [],
          normalizedContent: content,
          language,
        },
        0.3,
        10
      );

      // Merge and deduplicate
      const allCategories = [...categories, ...traditionalCategories];
      const uniqueCategories = Array.from(
        new Map(allCategories.map((c) => [c.name, c])).values()
      );

      await db.saveCategories(runId, uniqueCategories);

      return uniqueCategories;
    } catch (error: any) {
      console.error("GPT category generation error:", error);
      console.error("Error details:", error?.message || error, error?.stack);
      
      // Fallback to traditional method
      let rootDomain = "";
      try {
        const urlMatch = content.match(/https?:\/\/([^\/\s]+)/i);
        if (urlMatch) {
          rootDomain = urlMatch[1];
        }
      } catch (e) {
        // Ignore
      }
      
      const categories = this.categoryGenerator.generateCategories(
        {
          rootDomain: rootDomain,
          pages: [],
          normalizedContent: content,
          language,
        },
        0.3,
        15 // Generate more categories as fallback
      );
      
      if (categories.length === 0) {
        // Ultimate fallback: create some basic categories
        categories.push(
          {
            id: `cat_${runId}_0`,
            name: "Products & Services",
            description: "Main products and services offered",
            confidence: 0.5,
            sourcePages: [],
          },
          {
            id: `cat_${runId}_1`,
            name: "Features",
            description: "Key features and capabilities",
            confidence: 0.5,
            sourcePages: [],
          },
          {
            id: `cat_${runId}_2`,
            name: "Use Cases",
            description: "Use cases and applications",
            confidence: 0.5,
            sourcePages: [],
          }
        );
      }
      
      await db.saveCategories(runId, categories);
      return categories;
    }
  }

  // Step 4: Generate prompts (questionsPerCategory per category, no brand name) using GPT
  async step4GeneratePrompts(
    runId: string,
    categories: Category[],
    userInput: UserInput,
    content: string,
    env: Record<string, any>,
    questionsPerCategory: number = 3,
    companyId?: string
  ): Promise<Prompt[]> {
    const db = new Database(env.geo_db as D1Database);

    // Generate 5 brand-neutral questions per category using GPT
    const allPrompts: Prompt[] = [];

    for (const category of categories) {
      try {
        const categoryPrompts = await this.generateCategoryPromptsWithGPT(
          category,
          userInput,
          content,
          questionsPerCategory, // Use user-specified count
          runId
        );
        allPrompts.push(...categoryPrompts);
      } catch (error: any) {
        console.error(`Error generating prompts for category ${category.name}:`, error);
        // Fallback to template-based generation for this category
        const fallbackPrompts = this.promptGenerator.generatePrompts(
          [category],
          userInput,
          questionsPerCategory // Use the same count as requested
        );
        allPrompts.push(...fallbackPrompts);
      }
    }

    await db.savePrompts(runId, allPrompts);

    // Save prompts to company_prompts if companyId is provided
    if (companyId) {
      for (const prompt of allPrompts) {
        const category = categories.find(c => c.id === prompt.categoryId);
        await db.saveCompanyPrompt({
          companyId: companyId,
          question: prompt.question,
          categoryId: prompt.categoryId || null,
          categoryName: category?.name || null,
          language: prompt.language,
          country: prompt.country || null,
          region: prompt.region || null,
          isActive: true,
        });
      }
      console.log(`Saved ${allPrompts.length} prompts to company_prompts for company ${companyId}`);
    }

    await db.db
      .prepare(
        "UPDATE analysis_runs SET prompts_generated = ?, step = ?, updated_at = ? WHERE id = ?"
      )
      .bind(
        allPrompts.length,
        "prompts",
        new Date().toISOString(),
        runId
      )
      .run();

    return allPrompts;
  }

  private async generateCategoryPromptsWithGPT(
    category: Category,
    userInput: UserInput,
    content: string,
    count: number,
    runId: string
  ): Promise<Prompt[]> {
    const regionText = userInput.region || userInput.country;
    const prompt = `Du bist ein Experte für Kundenerfahrung. Generiere genau ${count} SEHR REALISTISCHE, DIREKTE Fragen in ${userInput.language}, die echte Kunden wirklich in einer Suchmaschine oder ChatGPT eingeben würden.

KRITISCHE ANFORDERUNGEN:
- Fragen müssen brand-neutral sein (KEINE Firmennamen, KEINE Markennamen)
- Verwende SEHR DIREKTE, SUCHMASCHINEN-ÄHNLICHE Formulierungen
- BEVORZUGE "Wer ist..." Fragen statt "Wie..." Fragen
- Integriere IMMER LOKALE/REGIONALE Bezüge (z.B. "${regionText}", "in Graubünden", "in Zürich")
- Fragen sollten kurz, prägnant und sehr spezifisch sein
- Verwende Formulierungen wie "Wer ist...", "Wer bietet...", "Wer verkauft...", "Gibt es...", "Was kostet..."
- Vermeide "Wie..." Fragen - verwende stattdessen direkte Suchanfragen
- Fragen sollten zeigen, dass der Kunde aktiv nach einem Anbieter/Lösung sucht

Beispiele für PERFEKTE kundenorientierte Fragen (${userInput.language}):
${userInput.language === 'de' ? `
- "Wer ist in ${regionText} für Kassensystem?"
- "Wer bietet Kassensysteme in ${regionText}?"
- "Gibt es Kassensysteme für Restaurants in ${regionText}?"
- "Was kostet ein Kassensystem in ${regionText}?"
- "Wer verkauft Kassensysteme für kleine Läden in ${regionText}?"
- "Welche Kassensysteme gibt es in ${regionText}?"
- "Wer ist der beste Anbieter für Kassensysteme in ${regionText}?"
` : userInput.language === 'en' ? `
- "Who is in ${regionText} for POS system?"
- "Who offers POS systems in ${regionText}?"
- "Are there POS systems for restaurants in ${regionText}?"
- "What does a POS system cost in ${regionText}?"
- "Who sells POS systems for small shops in ${regionText}?"
- "What POS systems are available in ${regionText}?"
- "Who is the best provider for POS systems in ${regionText}?"
` : `
- "Qui est en ${regionText} pour système de caisse?"
- "Qui offre des systèmes de caisse en ${regionText}?"
- "Y a-t-il des systèmes de caisse pour restaurants en ${regionText}?"
- "Combien coûte un système de caisse en ${regionText}?"
- "Qui vend des systèmes de caisse pour petits magasins en ${regionText}?"
`}

Kontext:
- Kategorie: ${category.name} - ${category.description}
- Land: ${userInput.country}
- Region: ${userInput.region || userInput.country}
- Sprache: ${userInput.language}
- Relevanter Inhaltsauszug: ${content.substring(0, 2000)}

WICHTIG: 
- Die Fragen müssen so klingen, als ob ein echter Kunde sie direkt in eine Suchmaschine oder ChatGPT eingibt
- BEVORZUGE "Wer ist..." statt "Wie..."
- IMMER lokale/regionale Bezüge einbauen
- Sei SEHR DIREKT und PRÄGNANT

Gib nur ein JSON-Objekt mit einem "questions" Array zurück, das genau ${count} Fragen enthält:
{"questions": ["Frage 1 in ${userInput.language}", "Frage 2 in ${userInput.language}", ...]}
Kein anderer Text, nur gültiges JSON.`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      let response: Response;
      try {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.openai.apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.8,
            max_tokens: 1000,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
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

      let gptResponse: any;
      try {
        const responseContent = data.choices[0].message.content || "{}";
        gptResponse = JSON.parse(responseContent);
      } catch (parseError) {
        console.error("Failed to parse GPT response:", data.choices[0].message.content);
        throw new Error("Failed to parse JSON response from GPT");
      }

      const questions = gptResponse.questions || [];
      const prompts: Prompt[] = [];

      for (let i = 0; i < questions.length && i < count; i++) {
        const question = questions[i];
        if (question && typeof question === 'string' && question.trim().length > 0) {
          prompts.push({
            id: `prompt_${runId}_${category.id}_${i}`,
            categoryId: category.id,
            question: question.trim(),
            language: userInput.language,
            country: userInput.country,
            region: userInput.region,
            intent: "high",
            createdAt: new Date().toISOString(),
          });
        }
      }

      // If we got fewer questions than requested, fill with fallback
      if (prompts.length < count) {
        console.warn(`Only got ${prompts.length} questions for category ${category.name}, using fallback for remaining`);
        const fallbackPrompts = this.promptGenerator.generatePrompts([category], userInput, count - prompts.length);
        prompts.push(...fallbackPrompts.slice(0, count - prompts.length));
      }

      return prompts;
    } catch (error: any) {
      console.error(`Error generating prompts for category ${category.name}:`, error);
      console.error("Error details:", error?.message || error, error?.stack);
      // Fallback to template-based generation
      const fallbackPrompts = this.promptGenerator.generatePrompts([category], userInput, count);
      return fallbackPrompts;
    }
  }

  // Save selected prompts
  async saveSelectedPrompts(
    runId: string,
    selectedPrompts: Prompt[],
    env: Record<string, any>
  ): Promise<Prompt[]> {
    const db = new Database(env.geo_db as D1Database);

    await db.savePrompts(runId, selectedPrompts);

    await db.db
      .prepare(
        "UPDATE analysis_runs SET prompts_generated = ?, step = ?, updated_at = ? WHERE id = ?"
      )
      .bind(
        selectedPrompts.length,
        "prompts",
        new Date().toISOString(),
        runId
      )
      .run();

    return selectedPrompts;
  }

  // Step 5: Execute prompts with GPT-5 Web Search
  async step5ExecutePrompts(
    runId: string,
    prompts: Prompt[],
    env: Record<string, any>
  ): Promise<{ executed: number }> {
    const db = new Database(env.geo_db as D1Database);

    await db.db
      .prepare("UPDATE analysis_runs SET step = ?, updated_at = ? WHERE id = ?")
      .bind("execution", new Date().toISOString(), runId)
      .run();

    const responses = await this.llmExecutor.executePrompts(prompts);
    await db.saveLLMResponses(responses);

    await db.db
      .prepare("UPDATE analysis_runs SET step = ?, updated_at = ? WHERE id = ?")
      .bind("completed", new Date().toISOString(), runId)
      .run();

    return { executed: responses.length };
  }

  // Save user-selected categories
  async saveSelectedCategories(
    runId: string,
    categoryIds: string[],
    customCategories: Category[],
    env: Record<string, any>
  ): Promise<void> {
    const db = new Database(env.geo_db as D1Database);

    // Save custom categories
    if (customCategories.length > 0) {
      await db.saveCategories(runId, customCategories);
    }

    await db.db
      .prepare(
        "UPDATE analysis_runs SET selected_categories = ?, custom_categories = ?, updated_at = ? WHERE id = ?"
      )
      .bind(
        JSON.stringify(categoryIds),
        JSON.stringify(customCategories),
        new Date().toISOString(),
        runId
      )
      .run();
  }

  // Save user-edited prompts
  async saveUserPrompts(
    runId: string,
    prompts: Prompt[],
    env: Record<string, any>
  ): Promise<void> {
    const db = new Database(env.geo_db as D1Database);

    await db.db
      .prepare(
        "UPDATE analysis_runs SET selected_prompts = ?, updated_at = ? WHERE id = ?"
      )
      .bind(JSON.stringify(prompts), new Date().toISOString(), runId)
      .run();
  }
}

