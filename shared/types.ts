/**
 * Core type definitions for the GEO platform
 */

export interface UserInput {
  websiteUrl: string;
  country: string; // ISO code (e.g., CH, DE, US)
  region?: string; // Optional free text
  language: string; // ISO code (e.g., de, en, fr)
}

export interface WorkflowStep {
  step: "sitemap" | "content" | "categories" | "prompts" | "execution" | "completed";
  data?: any;
}

export interface CrawledPage {
  url: string;
  title: string;
  headings: string[];
  content: string;
  topics: string[];
  entities: string[];
  language: string;
}

export interface WebsiteContent {
  rootDomain: string;
  pages: CrawledPage[];
  normalizedContent: string;
  language: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  confidence: number;
  sourcePages: string[];
}

export interface Prompt {
  id: string;
  categoryId: string;
  question: string;
  language: string;
  country?: string;
  region?: string;
  intent: "high" | "medium" | "low";
  createdAt: string;
}

export interface WebSearchCitation {
  url: string;
  title?: string;
  snippet?: string;
}

export interface LLMResponse {
  promptId: string;
  outputText: string;
  citations: WebSearchCitation[];
  timestamp: string;
  model: string;
}

export interface BrandMention {
  exact: number;
  fuzzy: number;
  contexts: string[];
  citations: number; // Anzahl der Markdown-Citations mit Brand-Domain
}

export interface SentimentAnalysis {
  tone: "positive" | "neutral" | "negative" | "mixed";
  confidence: number;
  keywords: string[];
}

export interface BrandCitation {
  url: string;
  title?: string;
  snippet?: string;
  context?: string; // Context where brand is mentioned in the citation
}

export interface PromptAnalysis {
  promptId: string;
  brandMentions: BrandMention;
  citationCount: number;
  citationUrls: string[];
  brandCitations: BrandCitation[]; // Citations where the brand is mentioned
  sentiment: SentimentAnalysis;
  timestamp: string;
  // Structured answers to the three key questions:
  isMentioned: boolean; // Bin ich erwähnt?
  mentionCount: number; // Wie viel?
  isCited: boolean; // Werde ich zitiert?
  citationDetails: Array<{ url: string; title?: string; snippet?: string }>; // Wo und was?
}

export interface CategoryMetrics {
  categoryId: string;
  visibilityScore: number; // 0-100
  citationRate: number;
  brandMentionRate: number;
  timestamp: string;
}

export interface CompetitiveAnalysis {
  brandShare: number; // percentage
  competitorShares: Record<string, number>; // Kept for compatibility, always empty
  whiteSpaceTopics: string[];
  dominatedPrompts: string[];
  missingBrandPrompts: string[];
  timestamp: string;
}

export interface TimeSeriesData {
  timestamp: string;
  visibilityScore: number;
  citationCount: number;
  brandMentionCount: number;
}

export interface AnalysisResult {
  websiteUrl: string;
  country: string;
  language: string;
  categories: Category[];
  prompts: Prompt[];
  analyses: PromptAnalysis[];
  categoryMetrics: CategoryMetrics[];
  competitiveAnalysis: CompetitiveAnalysis;
  timeSeries: TimeSeriesData[];
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  websiteUrl: string;
  country: string;
  language: string;
  region?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyPrompt {
  id: string;
  companyId: string;
  question: string;
  categoryId?: string;
  categoryName?: string;
  language: string;
  country?: string;
  region?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledRun {
  id: string;
  companyId: string;
  scheduleType: "daily" | "weekly" | "monthly";
  nextRunAt: string;
  lastRunAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisSummary {
  totalMentions: number;
  totalCitations: number;
  bestPrompts: Array<{
    question: string;
    mentions: number;
    citations: number;
  }>;
  otherSources: Record<string, number>;
}

