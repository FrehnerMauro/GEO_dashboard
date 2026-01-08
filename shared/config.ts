/**
 * Configuration management for the GEO platform
 */

export interface Config {
  debug: {
    enabled: boolean;
  };
  openai: {
    apiKey: string;
    model: string;
    responsesApiUrl: string;
  };
  crawling: {
    maxPages: number;
    maxDepth: number;
    timeout: number;
    userAgent: string;
  };
  analysis: {
    reRunSchedule: "daily" | "weekly";
    brandFuzzyThreshold: number;
    sentimentConfidenceThreshold: number;
  };
  categories: {
    minConfidence: number;
    maxCategories: number;
  };
  prompts: {
    questionsPerCategory: number;
    minIntentScore: number;
  };
}

export function getConfig(env: Record<string, any>): Config {
  return {
    debug: {
      enabled: env.DEBUG_MODE === "true" || env.DEBUG_MODE === "1",
    },
    openai: {
      apiKey: env.OPENAI_API_KEY || "",
      model: env.OPENAI_MODEL || "gpt-4o", // Use gpt-4o by default, set OPENAI_MODEL=gpt-5 in .dev.vars if available
      responsesApiUrl: "https://api.openai.com/v1/responses",
    },
    crawling: {
      maxPages: parseInt(env.MAX_PAGES || "50"),
      maxDepth: parseInt(env.MAX_DEPTH || "3"),
      timeout: parseInt(env.CRAWL_TIMEOUT || "30000"),
      userAgent: env.USER_AGENT || "GEO-Platform/1.0",
    },
    analysis: {
      reRunSchedule: (env.RE_RUN_SCHEDULE as "daily" | "weekly") || "weekly",
      brandFuzzyThreshold: parseFloat(env.BRAND_FUZZY_THRESHOLD || "0.7"),
      sentimentConfidenceThreshold: parseFloat(
        env.SENTIMENT_CONFIDENCE_THRESHOLD || "0.6"
      ),
    },
    categories: {
      minConfidence: parseFloat(env.MIN_CATEGORY_CONFIDENCE || "0.5"),
      maxCategories: parseInt(env.MAX_CATEGORIES || "10"),
    },
    prompts: {
      questionsPerCategory: parseInt(env.QUESTIONS_PER_CATEGORY || "5"),
      minIntentScore: parseFloat(env.MIN_INTENT_SCORE || "0.7"),
    },
  };
}

