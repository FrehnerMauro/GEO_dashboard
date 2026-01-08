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
  // Always generates per category with rate limiting to avoid overwhelming the API
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

    const totalQuestions = categories.length * questionsPerCategory;
    const API_CALL_DELAY_MS = 2000; // 2 seconds delay between API calls to avoid rate limits
    const MAX_CONCURRENT_CALLS = 3; // Maximum concurrent API calls
    
    console.log(`Generating ${totalQuestions} questions across ${categories.length} categories (per-category mode with rate limiting)`);
    
    const allPrompts: Prompt[] = [];
    let processedCount = 0;

    // Process categories with rate limiting
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      
      // Add delay between API calls (except for the first one)
      if (i > 0) {
        console.log(`Waiting ${API_CALL_DELAY_MS}ms before next API call to avoid rate limits...`);
        await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY_MS));
      }
      
      try {
        console.log(`[${i + 1}/${categories.length}] Generating prompts for category: ${category.name}`);
        const categoryPrompts = await this.generateCategoryPromptsWithGPT(
          category,
          userInput,
          content,
          questionsPerCategory,
          runId
        );
        allPrompts.push(...categoryPrompts);
        processedCount++;
        console.log(`[${i + 1}/${categories.length}] ✓ Generated ${categoryPrompts.length} prompts for ${category.name}`);
      } catch (error: any) {
        console.error(`[${i + 1}/${categories.length}] ✗ Error generating prompts for category ${category.name}:`, error);
        // Fallback to template-based generation for this category
        const fallbackPrompts = this.promptGenerator.generatePrompts(
          [category],
          userInput,
          questionsPerCategory
        );
        allPrompts.push(...fallbackPrompts);
        console.log(`[${i + 1}/${categories.length}] ✓ Used fallback: Generated ${fallbackPrompts.length} prompts for ${category.name}`);
      }
    }
    
    console.log(`Completed: Generated ${allPrompts.length} prompts across ${processedCount}/${categories.length} categories`);

    // DO NOT save prompts here - they will only be saved after successful execution with responses
    // This ensures only questions that were actually asked and have answers are stored

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

  private async generateAllCategoryPromptsWithGPT(
    categories: Category[],
    userInput: UserInput,
    content: string,
    questionsPerCategory: number,
    runId: string
  ): Promise<Prompt[]> {
    // Debug mode: Return dummy prompts without making API calls
    if (this.config.debug?.enabled) {
      console.log('🐛 DEBUG MODE: Returning dummy prompts (no API call)');
      const allPrompts: Prompt[] = [];
      for (const category of categories) {
        const dummyPrompts = await this.getDummyPrompts(category, userInput, questionsPerCategory, runId);
        allPrompts.push(...dummyPrompts);
      }
      return allPrompts;
    }

    const regionText = userInput.region || userInput.country;
    const totalQuestions = categories.length * questionsPerCategory;
    
    // Build categories description
    const categoriesList = categories.map(c => `- ${c.name}: ${c.description}`).join('\n');
    
    const prompt = `Du bist ein Experte für Kundenerfahrung. Generiere für jede der folgenden Kategorien genau ${questionsPerCategory} SEHR REALISTISCHE, DIREKTE Fragen in ${userInput.language}, die echte Kunden wirklich in einer Suchmaschine oder ChatGPT eingeben würden.

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
` : userInput.language === 'en' ? `
- "Who is in ${regionText} for POS system?"
- "Who offers POS systems in ${regionText}?"
- "Are there POS systems for restaurants in ${regionText}?"
- "What does a POS system cost in ${regionText}?"
` : `
- "Qui est en ${regionText} pour système de caisse?"
- "Qui offre des systèmes de caisse en ${regionText}?"
- "Y a-t-il des systèmes de caisse pour restaurants en ${regionText}?"
`}

Kategorien (für jede Kategorie genau ${questionsPerCategory} Fragen generieren):
${categoriesList}

Kontext:
- Land: ${userInput.country}
- Region: ${userInput.region || userInput.country}
- Sprache: ${userInput.language}
- Relevanter Inhaltsauszug: ${content.substring(0, 2000)}

WICHTIG: 
- Die Fragen müssen so klingen, als ob ein echter Kunde sie direkt in eine Suchmaschine oder ChatGPT eingibt
- BEVORZUGE "Wer ist..." statt "Wie..."
- IMMER lokale/regionale Bezüge einbauen
- Sei SEHR DIREKT und PRÄGNANT
- Für jede Kategorie genau ${questionsPerCategory} Fragen generieren

Gib nur ein JSON-Objekt zurück mit einem "categories" Array, wobei jedes Element eine Kategorie mit ihren Fragen enthält:
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
Kein anderer Text, nur gültiges JSON.`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for multiple categories
      
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
            max_tokens: 2000, // More tokens for multiple categories
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
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

      let gptResponse: any;
      try {
        const responseContent = data.choices[0].message.content || "{}";
        gptResponse = JSON.parse(responseContent);
      } catch (parseError) {
        console.error("Failed to parse GPT response:", data.choices[0].message.content);
        throw new Error("Failed to parse JSON response from GPT");
      }

      const categoriesData = gptResponse.categories || [];
      const allPrompts: Prompt[] = [];
      const now = new Date().toISOString();

      for (const categoryData of categoriesData) {
        const categoryName = categoryData.categoryName;
        const questions = categoryData.questions || [];
        
        // Find matching category - try exact match first, then fuzzy match
        let category = categories.find(c => c.name === categoryName);
        
        // If exact match fails, try case-insensitive or partial match
        if (!category) {
          category = categories.find(c => 
            c.name.toLowerCase() === categoryName.toLowerCase() ||
            categoryName.toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(categoryName.toLowerCase())
          );
        }
        
        if (!category) {
          console.warn(`Category "${categoryName}" from GPT not found in original categories. Available: ${categories.map(c => c.name).join(', ')}`);
          // Try to match by index if count matches
          const index = categoriesData.indexOf(categoryData);
          if (index < categories.length) {
            category = categories[index];
            console.log(`Using category by index: ${category.name}`);
          } else {
            continue;
          }
        }

        // Process questions, ensuring we get exactly 'questionsPerCategory' questions per category
        for (let i = 0; i < questions.length && allPrompts.filter(p => p.categoryId === category.id).length < questionsPerCategory; i++) {
          const question = questions[i];
          if (question && typeof question === 'string' && question.trim()) {
            allPrompts.push({
              id: `prompt_${runId}_${category.id}_${allPrompts.filter(p => p.categoryId === category.id).length}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              categoryId: category.id,
              question: question.trim(),
              language: userInput.language,
              country: userInput.country,
              region: userInput.region,
              intent: "high",
              createdAt: now,
            });
          }
        }
        
        // If we got fewer questions than requested for this category, fill with fallback
        const categoryPromptCount = allPrompts.filter(p => p.categoryId === category.id).length;
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

      // Ensure we have the right number of prompts
      if (allPrompts.length < totalQuestions) {
        console.warn(`Generated ${allPrompts.length} prompts, expected ${totalQuestions}. Filling with template-based prompts.`);
        const existingCount = allPrompts.length;
        const fallbackPrompts = this.promptGenerator.generatePrompts(
          categories,
          userInput,
          questionsPerCategory
        );
        // Only add prompts we're missing
        const needed = totalQuestions - existingCount;
        allPrompts.push(...fallbackPrompts.slice(0, needed));
      }

      return allPrompts.slice(0, totalQuestions); // Ensure we don't exceed expected count
    } catch (error: any) {
      console.error("Error in generateAllCategoryPromptsWithGPT:", error);
      throw error;
    }
  }

  private async generateCategoryPromptsWithGPT(
    category: Category,
    userInput: UserInput,
    content: string,
    count: number,
    runId: string
  ): Promise<Prompt[]> {
    // Debug mode: Return dummy prompts without making API calls
    if (this.config.debug?.enabled) {
      console.log('🐛 DEBUG MODE: Returning dummy prompts (no API call)');
      return this.getDummyPrompts(category, userInput, count, runId);
    }

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
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout per category
      
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

      // Process questions, ensuring we get exactly 'count' questions
      for (let i = 0; i < questions.length && prompts.length < count; i++) {
        const question = questions[i];
        if (question && typeof question === 'string' && question.trim().length > 0) {
          prompts.push({
            id: `prompt_${runId}_${category.id}_${prompts.length}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
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

      // If we got fewer questions than requested, fill with fallback to ensure exactly 'count' questions
      if (prompts.length < count) {
        console.warn(`Only got ${prompts.length} questions for category ${category.name}, using fallback for remaining ${count - prompts.length}`);
        const fallbackPrompts = this.promptGenerator.generatePrompts([category], userInput, count - prompts.length);
        const needed = count - prompts.length;
        prompts.push(...fallbackPrompts.slice(0, needed));
      }

      // Ensure we return exactly 'count' questions (trim if GPT returned more)
      return prompts.slice(0, count);
    } catch (error: any) {
      console.error(`Error generating prompts for category ${category.name}:`, error);
      console.error("Error details:", error?.message || error, error?.stack);
      // Fallback to template-based generation
      const fallbackPrompts = this.promptGenerator.generatePrompts([category], userInput, count);
      return fallbackPrompts;
    }
  }

  private getDummyPrompts(
    category: Category,
    userInput: UserInput,
    count: number,
    runId: string
  ): Prompt[] {
    const regionText = userInput.region || userInput.country;
    const prompts: Prompt[] = [];
    
    // Generate dummy questions based on category and language
    const questionTemplates: Record<string, string[]> = {
      de: [
        `Wer ist in ${regionText} für ${category.name}?`,
        `Wer bietet ${category.name} in ${regionText}?`,
        `Gibt es ${category.name} für Unternehmen in ${regionText}?`,
        `Was kostet ${category.name} in ${regionText}?`,
        `Wer verkauft ${category.name} in ${regionText}?`,
        `Welche ${category.name} gibt es in ${regionText}?`,
        `Wer ist der beste Anbieter für ${category.name} in ${regionText}?`,
        `Wo finde ich ${category.name} in ${regionText}?`,
      ],
      en: [
        `Who is in ${regionText} for ${category.name}?`,
        `Who offers ${category.name} in ${regionText}?`,
        `Are there ${category.name} for businesses in ${regionText}?`,
        `What does ${category.name} cost in ${regionText}?`,
        `Who sells ${category.name} in ${regionText}?`,
        `What ${category.name} are available in ${regionText}?`,
        `Who is the best provider for ${category.name} in ${regionText}?`,
        `Where can I find ${category.name} in ${regionText}?`,
      ],
      fr: [
        `Qui est en ${regionText} pour ${category.name}?`,
        `Qui offre ${category.name} en ${regionText}?`,
        `Y a-t-il ${category.name} pour entreprises en ${regionText}?`,
        `Combien coûte ${category.name} en ${regionText}?`,
        `Qui vend ${category.name} en ${regionText}?`,
        `Quels ${category.name} sont disponibles en ${regionText}?`,
        `Qui est le meilleur fournisseur pour ${category.name} en ${regionText}?`,
        `Où puis-je trouver ${category.name} en ${regionText}?`,
      ],
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
        createdAt: new Date().toISOString(),
      });
    }

    return prompts;
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
  // Only saves prompts that were successfully executed and have responses
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
    
    // Only save prompts that have successful responses
    const promptsWithResponses: Prompt[] = [];
    const validResponses: any[] = [];
    
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      // Only include prompts that have a valid response with output text
      if (response && response.outputText && response.outputText.trim().length > 0) {
        // Find the corresponding prompt
        const prompt = prompts.find(p => p.id === response.promptId);
        if (prompt) {
          promptsWithResponses.push(prompt);
          validResponses.push(response);
        }
      }
    }
    
    // Save only prompts that have successful responses
    if (promptsWithResponses.length > 0) {
      await db.savePrompts(runId, promptsWithResponses);
      console.log(`Saved ${promptsWithResponses.length} prompts with successful responses (out of ${prompts.length} total)`);
    } else {
      console.warn(`No prompts with valid responses to save (${prompts.length} prompts executed, ${responses.length} responses received)`);
    }
    
    // Save all responses (including failed ones for debugging, but only prompts with valid responses are saved)
    await db.saveLLMResponses(responses);

    await db.db
      .prepare("UPDATE analysis_runs SET step = ?, updated_at = ? WHERE id = ?")
      .bind("completed", new Date().toISOString(), runId)
      .run();

    return { executed: validResponses.length };
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

