# GEO Platform - Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Background & Evolution](#project-background--evolution)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Core Modules](#core-modules)
7. [API Documentation](#api-documentation)
8. [Frontend Documentation](#frontend-documentation)
9. [Database Schema](#database-schema)
10. [Configuration](#configuration)
11. [Development Guide](#development-guide)
12. [Deployment Guide](#deployment-guide)
13. [Testing](#testing)
14. [Workflow Engine](#workflow-engine)
15. [Analysis Engine](#analysis-engine)
16. [Implementation Status](#implementation-status)
17. [Future Enhancements](#future-enhancements)

---

## Project Overview

**GEO Platform** (Generative Engine Optimization) analyzes brand visibility in generative AI responses.

**🌐 Live:** https://geo.socialhabit.org

### Core Purpose

Analyzes how ChatGPT responds to questions about a company and tracks changes over time.

### Features

- Website content crawling and extraction
- Category generation from content
- Prompt generation
- LLM execution with web search (OpenAI API)
- Analysis: brand mentions, citations, competitors
- Interactive step-by-step workflow
- Multi-tenant support (company-based)
- AI readiness analysis

---

## Project Background & Evolution

### First Project: Bot Observatory

The first project (Bot Observatory) addressed three questions:

1. **How can I measure bot traffic?** → Bot Observatory
   - Tools for bot traffic analysis
   - Dashboard: https://Bot-dashboard.socialhabit.org

2. **How can I improve content for AI?** → AI Readiness Evaluation
   - Assessment of content's AI-friendliness

3. **How close together are topics on my site?** → Semantic Analysis
   - Analysis of content relationships
   - Topic proximity and content clustering

**Tools used in first project:**
- ChatGPT for development assistance
- Cloudflare for hosting

### Origin of GEO Platform Idea

After Bot Observatory, new ideas were explored:

1. **Research:** Asked GPT: "What are the 5 best LLM optimization sites?"
2. **Analysis:** Examined what other platforms do (see "State of the Art" section)
3. **Idea:** Instead of just observing own crawler on own site → **Ask questions to GPT with Web Search**
   - Generate questions that should make the webpage appear
   - Check if brand appears as desired in AI responses
   - Identify which other providers appear in the same context
   - Analyze competitive positioning

### Development of GEO Platform

**Differences from Bot Observatory:**
- Question-based approach instead of passive observation
- Competitive analysis
- Better architecture (separation of concerns, unit tests)

**Development tools:**
- **Cursor** instead of ChatGPT (better code navigation, context across multiple files)
- Cloudflare Workers + D1

---

## Architecture

### High-Level Architecture

The platform follows a **monorepo structure** with clear separation between:

- **Backend**: Cloudflare Workers API
- **Frontend**: Cloudflare Pages static site
- **Shared**: Common business logic and types

```
GEO_dashboard/
├── backend/          # Cloudflare Workers API
├── frontend/         # Cloudflare Pages frontend
├── shared/           # Shared business logic
├── migrations/       # Database migrations
└── tests/            # Test suite
```

### Architectural Principles

1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Dependency Injection**: Components receive dependencies via constructors for testability
3. **Async/Non-Blocking**: Long-running operations don't block the main thread
4. **Error Resilience**: Multiple fallback mechanisms and graceful error handling
5. **Type Safety**: Strict TypeScript with comprehensive type definitions

### Request Flow

```
Client Request
    ↓
Router (backend/src/api/router.ts)
    ↓
Handler (backend/src/api/handlers/)
    ↓
Engine (shared/engine.ts or shared/engine_workflow.ts)
    ↓
Business Logic (shared/*/)
    ↓
Database (shared/persistence/)
    ↓
Response
```

---

## Technology Stack

### Backend

- **Runtime**: Cloudflare Workers (edge computing)
- **Database**: Cloudflare D1 (SQLite)
- **Language**: TypeScript 5.5+ (strict mode)
- **HTTP Framework**: Native Fetch API
- **HTML Parsing**: Cheerio
- **LLM Integration**: OpenAI API

### Frontend

- **Framework**: Vanilla TypeScript (no framework)
- **Build Tool**: Custom build script
- **Deployment**: Cloudflare Pages
- **Styling**: CSS with CSS Variables
- **HTTP Client**: Native Fetch API

### Development Tools

- **Testing**: Vitest
- **Type Checking**: TypeScript compiler
- **Package Manager**: npm
- **Deployment**: Wrangler CLI

### External Services

- **OpenAI API**: GPT-4o (default, configurable) for LLM execution
- **Cloudflare**: Workers, D1, Pages

---

## Project Structure

### Backend Structure

```
backend/
├── src/
│   ├── index.ts                    # Entry point (Cloudflare Workers)
│   └── api/
│       ├── router.ts                # Request routing
│       ├── handlers/
│       │   ├── analysis.ts          # Analysis endpoints
│       │   └── workflow.ts          # Workflow endpoints
│       ├── middleware/
│       │   ├── cors.ts              # CORS handling
│       │   ├── error-handler.ts     # Error handling
│       │   └── index.ts             # Middleware exports
│       ├── routes/
│       │   └── route-definitions.ts # Route configuration
│       ├── types.ts                 # Backend-specific types
│       └── utils/                   # Utility functions
├── package.json
├── tsconfig.json
└── wrangler.toml                    # Cloudflare Workers config
```

### Frontend Structure

```
frontend/
├── src/
│   └── scripts/
│       ├── app.ts                   # Application entry point
│       ├── components/
│       │   └── navigation.ts        # Navigation component
│       ├── core/
│       │   ├── api-client.ts        # HTTP client
│       │   └── config.ts            # Frontend configuration
│       ├── pages/
│       │   ├── dashboard-page.ts    # Dashboard view
│       │   ├── analyses-page.ts     # Analyses list view
│       │   ├── analysis-workflow.ts # Interactive workflow
│       │   └── readability-workflow.ts # AI Readiness workflow
│       ├── services/
│       │   ├── analysis-service.ts  # Analysis API client
│       │   └── workflow-service.ts  # Workflow API client
│       └── utils/
│           └── dom-utils.ts         # DOM utilities
├── public/
│   └── styles/                      # CSS files
├── index.html                       # Main HTML file
├── package.json
├── tsconfig.json
└── wrangler.toml                    # Cloudflare Pages config
```

### Shared Structure

```
shared/
├── analysis/                        # Analysis modules
│   ├── brand_mention.ts            # Brand mention detection
│   ├── competitor.ts               # Competitor detection
│   ├── sentiment.ts                # Sentiment analysis
│   └── index.ts                    # Analysis engine
├── categorization/
│   └── index.ts                    # Category generation
├── config.ts                       # Configuration management
├── engine.ts                       # Main GEO engine
├── engine_workflow.ts              # Interactive workflow engine
├── ingestion/                      # Website crawling
│   ├── crawler.ts                  # Website crawler
│   ├── scraper.ts                  # Content scraper
│   └── sitemap.ts                  # Sitemap parser
├── llm_execution/
│   └── index.ts                    # LLM execution
├── persistence/
│   ├── db.ts                       # Database operations
│   └── index.ts                    # Database class
├── prompt_generation/
│   └── index.ts                    # Prompt generation
├── types.ts                        # Type definitions
└── utils/
    └── text-extraction.ts          # Text extraction utilities
```

---

## Core Modules

### 1. Ingestion Module (`shared/ingestion/`)

**Purpose**: Crawl and extract content from websites

**Components**:
- `Crawler`: Recursive website crawling with depth limits
- `Scraper`: HTML parsing and content extraction
- `SitemapParser`: XML sitemap parsing

**Key Features**:
- Depth-limited crawling (prevents infinite loops)
- URL normalization (handles duplicates)
- Content extraction (headings, topics, entities)
- Language detection
- Error resilience (continues on failures)

**Configuration**:
```typescript
{
  maxPages: number;      // Maximum pages to crawl (default: 50)
  maxDepth: number;      // Maximum crawl depth (default: 3)
  timeout: number;        // Request timeout in ms (default: 30000)
  userAgent: string;      // User agent string
}
```

### 2. Categorization Module (`shared/categorization/`)

**Purpose**: Extract thematic categories from website content

**Approach**:
- GPT-based: Uses GPT-4o-mini to generate categories
- Traditional fallback: Keyword-based extraction
- Hybrid: Merges GPT and traditional results

**Category Types**:
- Product
- Pricing
- Comparison
- Use Cases
- Industry
- Problems / Solutions
- Integration
- Support

**Output**:
```typescript
interface Category {
  id: string;
  name: string;
  description: string;
  confidence: number;      // 0-1 confidence score
  sourcePages: string[];  // URLs where category was found
}
```

### 3. Prompt Generation Module (`shared/prompt_generation/`)

**Purpose**: Generate high-intent, brand-neutral questions

**Features**:
- Language-specific: English, German, French
- Region-aware: Incorporates country/region context
- Brand-neutral: No forced self-mentions
- Intent-scored: High/medium/low classification
- GPT-based: Uses GPT-4o-mini for question generation

**Example Output**:
- German: "Wer ist in Zürich für Kassensystem?"
- English: "Who offers POS systems in New York?"
- French: "Qui vend des systèmes de caisse en Paris?"

**Configuration**:
```typescript
{
  questionsPerCategory: number;  // Default: 3-5
  minIntentScore: number;        // Default: 0.7
}
```

### 4. LLM Execution Module (`shared/llm_execution/`)

**Purpose**: Execute prompts against OpenAI's GPT models with web search

**Features**:
- Model support: GPT-4o (default, configurable)
- Web search: Via OpenAI Responses API (`/v1/responses`)
- Citation extraction: Parses citations from responses
- Rate limiting: Built-in delays between API calls
- Error handling: Fallback mechanisms

**Note**: The system uses two OpenAI APIs:
- **Responses API** (`/v1/responses`): For prompt execution with web search
- **Chat Completions API** (`/v1/chat/completions`): For category and prompt generation (GPT-4o-mini)

**API Integration**:
```typescript
{
  model: config.openai.model, // Default: "gpt-4o"
  tools: [{ type: "web_search" }],
  input: question
}
```

**Response Extraction**:
- `output[].content[].text`: Response text
- `output[].content[].annotations`: URL citations

### 5. Analysis Module (`shared/analysis/`)

**Purpose**: Analyze LLM responses for brand mentions, citations, competitors, and sentiment

**Components**:

#### Brand Mention Detection (`brand_mention.ts`)
- Exact matches: Direct brand name mentions
- Fuzzy matches: Similarity-based detection (threshold: 0.7)
- Context extraction: Surrounding text
- Citation analysis: Detects brand mentions in citation URLs

#### Competitor Detection (`competitor.ts`)
- Co-mention detection: Identifies competitors mentioned alongside brand
- Comparison phrases: Detects comparison language
- Mention counting: Tracks frequency
- Context extraction: Captures mention contexts

#### Sentiment Analysis (`sentiment.ts`)
- Tone classification: positive, neutral, negative, mixed
- Confidence scoring: 0-1
- Keyword extraction: Identifies sentiment keywords
- Keyword-based: Uses keyword matching (LLM-based planned)

**Output**:
```typescript
interface PromptAnalysis {
  promptId: string;
  brandMentions: {
    exact: number;
    fuzzy: number;
    contexts: string[];
    citations: number;
  };
  citationCount: number;
  citationUrls: string[];
  brandCitations: BrandCitation[];
  competitors: CompetitorMention[];
  sentiment: {
    tone: "positive" | "neutral" | "negative" | "mixed";
    confidence: number;
    keywords: string[];
  };
  isMentioned: boolean;
  mentionCount: number;
  isCited: boolean;
  citationDetails: Array<{ url: string; title?: string; snippet?: string }>;
  competitorDetails: Array<{ name: string; count: number; locations: string[] }>;
}
```

### 6. Persistence Module (`shared/persistence/`)

**Purpose**: Database operations and data persistence

**Features**:
- **D1 Integration**: Cloudflare D1 (SQLite) database
- **Type-Safe Operations**: TypeScript interfaces for all operations
- **Transaction Support**: Atomic operations where needed
- **Query Optimization**: Indexed queries for performance

**Main Operations**:
- `saveAnalysisRun()`: Save analysis run metadata
- `saveCategories()`: Save generated categories
- `savePrompts()`: Save generated prompts
- `saveLLMResponses()`: Save LLM responses
- `savePromptAnalyses()`: Save analysis results
- `getAnalysisRun()`: Retrieve complete analysis results

### 7. Engine Modules

#### GEOEngine (`shared/engine.ts`)

**Purpose**: Main orchestrator for automated analysis runs

**Workflow**:
1. Website ingestion
2. Category generation
3. Prompt generation
4. LLM execution
5. Result analysis
6. Time-series data storage

**Features**:
- **Non-Blocking**: Returns runId immediately, processes asynchronously
- **Status Updates**: Real-time progress tracking
- **Error Handling**: Graceful error handling with status updates

#### WorkflowEngine (`shared/engine_workflow.ts`)

**Purpose**: Interactive, step-by-step workflow engine

**Steps**:
1. **Step 1**: Find and parse sitemap
2. **Step 2**: Fetch content from URLs
3. **Step 3**: Generate categories (with GPT)
4. **Step 4**: Generate prompts (with GPT, rate-limited)
5. **Step 5**: Execute prompts with LLM

**Features**:
- **Interactive**: User can control each step
- **Rate Limiting**: 2-second delays between API calls
- **Fallback Mechanisms**: Multiple fallbacks for each step
- **State Management**: Database state allows resumption

---

## API Documentation

### Base URL

- **Development**: `http://localhost:8787`
- **Production**: https://geo.socialhabit.org
- **API Endpoint**: The backend API is accessible through the production domain

### Authentication

Currently, the API does not require authentication. This should be added for production use.

### CORS

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

### Workflow Endpoints

#### POST `/api/workflow/step1`

Find and parse sitemap for a website.

**Request**:
```json
{
  "websiteUrl": "https://example.com",
  "country": "CH",
  "region": "Zurich",
  "language": "de"
}
```

**Response**:
```json
{
  "runId": "run_1234567890_abc123",
  "urls": ["https://example.com/page1", "https://example.com/page2"],
  "foundSitemap": true
}
```

#### POST `/api/workflow/step2`

Fetch content from URLs.

**Request**:
```json
{
  "runId": "run_1234567890_abc123",
  "urls": ["https://example.com/page1", "https://example.com/page2"],
  "language": "de"
}
```

**Response**:
```json
{
  "pageCount": 2,
  "content": "Extracted text content..."
}
```

#### POST `/api/workflow/step3`

Generate categories from content.

**Request**:
```json
{
  "runId": "run_1234567890_abc123",
  "content": "Website content...",
  "language": "de"
}
```

**Response**:
```json
{
  "categories": [
    {
      "id": "cat_123",
      "name": "Products & Services",
      "description": "Main products and services",
      "confidence": 0.8,
      "sourcePages": []
    }
  ]
}
```

#### PUT `/api/workflow/:runId/categories`

Save selected categories.

**Request**:
```json
{
  "categoryIds": ["cat_123", "cat_456"],
  "customCategories": []
}
```

#### POST `/api/workflow/step4`

Generate prompts for categories.

**Request**:
```json
{
  "runId": "run_1234567890_abc123",
  "categories": [...],
  "userInput": {
    "websiteUrl": "https://example.com",
    "country": "CH",
    "region": "Zurich",
    "language": "de"
  },
  "content": "Website content...",
  "questionsPerCategory": 3
}
```

**Response**:
```json
{
  "prompts": [
    {
      "id": "prompt_123",
      "categoryId": "cat_123",
      "question": "Wer ist in Zürich für Kassensystem?",
      "language": "de",
      "country": "CH",
      "region": "Zurich",
      "intent": "high",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### PUT `/api/workflow/:runId/prompts`

Save selected prompts.

**Request**:
```json
{
  "prompts": [...]
}
```

#### POST `/api/workflow/step5`

Execute prompts with LLM.

**Request**:
```json
{
  "runId": "run_1234567890_abc123",
  "prompts": [...]
}
```

**Response**:
```json
{
  "executed": 15
}
```

#### POST `/api/workflow/fetchUrl`

Fetch content from a single URL.

**Request**:
```json
{
  "url": "https://example.com/page"
}
```

**Response**:
```json
{
  "content": "Extracted content...",
  "title": "Page Title"
}
```

#### POST `/api/workflow/executePrompt`

Execute a single prompt.

**Request**:
```json
{
  "prompt": "Who offers POS systems in New York?",
  "language": "en"
}
```

**Response**:
```json
{
  "response": {
    "outputText": "LLM response text...",
    "citations": [
      {
        "url": "https://example.com",
        "title": "Example",
        "snippet": "Snippet text"
      }
    ]
  }
}
```

#### POST `/api/workflow/generateSummary`

Generate analysis summary.

**Request**:
```json
{
  "runId": "run_1234567890_abc123"
}
```

**Response**:
```json
{
  "summary": {
    "totalMentions": 42,
    "totalCitations": 15,
    "bestPrompts": [...],
    "otherSources": {...}
  }
}
```

#### POST `/api/workflow/aiReadiness`

Start AI Readiness analysis.

**Request**:
```json
{
  "url": "https://example.com"
}
```

**Response**:
```json
{
  "statusId": "status_123",
  "status": "processing"
}
```

#### GET `/api/workflow/aiReadiness/:statusId`

Get AI Readiness status.

**Response**:
```json
{
  "status": "completed",
  "result": {
    "score": 85,
    "recommendations": [...]
  }
}
```

### Analysis Endpoints

#### POST `/api/analyze`

Start a new automated analysis run.

**Request**:
```json
{
  "websiteUrl": "https://example.com",
  "country": "CH",
  "region": "Zurich",
  "language": "de"
}
```

**Response**:
```json
{
  "runId": "run_1234567890_abc123",
  "status": "started",
  "message": "Analysis started successfully"
}
```

#### GET `/api/analyses`

Get all analysis runs.

**Response**:
```json
[
  {
    "id": "run_123",
    "websiteUrl": "https://example.com",
    "country": "CH",
    "language": "de",
    "status": "completed",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T01:00:00Z"
  }
]
```

#### GET `/api/analysis/:runId`

Get full analysis results.

**Response**: Complete `AnalysisResult` object (see Types section)

#### GET `/api/analysis/:runId/status`

Get analysis status.

**Response**:
```json
{
  "status": "running",
  "step": "llm_execution",
  "progress": 50,
  "message": "Executing prompts with LLM..."
}
```

#### GET `/api/analysis/:runId/metrics`

Get metrics only.

**Response**:
```json
{
  "categoryMetrics": [...],
  "competitiveAnalysis": {...},
  "timeSeries": [...]
}
```

#### GET `/api/analysis/:runId/prompts-summary`

Get prompts and summary.

**Response**:
```json
{
  "prompts": [...],
  "summary": {
    "totalMentions": 42,
    "totalCitations": 15,
    "bestPrompts": [...],
    "otherSources": {...}
  }
}
```

#### DELETE `/api/analysis/:runId`

Delete an analysis run.

**Response**:
```json
{
  "success": true,
  "message": "Analysis deleted"
}
```

### Dashboard Endpoints

#### GET `/api/companies`

Get all companies.

**Response**:
```json
[
  {
    "id": "company_123",
    "name": "Example Corp",
    "websiteUrl": "https://example.com",
    "country": "CH",
    "language": "de",
    "isActive": true
  }
]
```

#### GET `/api/companies/:companyId/analyses`

Get all analyses for a company.

**Response**: Array of analysis runs

#### GET `/api/global/categories`

Get global categories across all analyses.

**Response**:
```json
[
  {
    "name": "Products & Services",
    "count": 15
  }
]
```

#### GET `/api/global/categories/:categoryName/prompts`

Get prompts for a global category.

**Response**: Array of prompts

### Health Check

#### GET `/api/health`

Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Frontend Documentation

### Application Structure

The frontend is a single-page application (SPA) built with vanilla TypeScript.

### Main Components

#### App (`app.ts`)

Main application entry point that:
- Initializes all pages
- Sets up navigation
- Handles routing
- Manages global state

#### Pages

1. **DashboardPage** (`dashboard-page.ts`): Overview dashboard
2. **AnalysesPage** (`analyses-page.ts`): List of all analyses
3. **AnalysisWorkflow** (`analysis-workflow.ts`): Interactive analysis workflow
4. **ReadabilityWorkflow** (`readability-workflow.ts`): AI Readiness analysis

#### Services

1. **AnalysisService** (`analysis-service.ts`): API client for analysis endpoints
2. **WorkflowService** (`workflow-service.ts`): API client for workflow endpoints

#### Core

1. **ApiClient** (`api-client.ts`): HTTP client wrapper
2. **Config** (`config.ts`): Frontend configuration

### User Flows

#### 1. Interactive Analysis Workflow

1. User enters website URL, country, region, language
2. **Step 1**: System finds sitemap
3. **Step 2**: System fetches content from URLs
4. **Step 3**: System generates categories (user can select/edit)
5. **Step 4**: System generates prompts (user can select/edit)
6. **Step 5**: System executes prompts with LLM
7. Results are displayed with analysis

#### 2. Automated Analysis

1. User enters website URL, country, region, language
2. System runs complete analysis automatically
3. Progress is shown in real-time
4. Results are displayed when complete

#### 3. AI Readiness Analysis

1. User enters URL
2. System analyzes content for AI readability
3. Score and recommendations are displayed

### Configuration

Frontend configuration is in `frontend/src/scripts/core/config.ts`:

```typescript
export function getApiBaseUrl(): string {
  // Returns API base URL based on environment
}
```

---

## Database Schema

### Tables

#### `analysis_runs`

Stores analysis run metadata.

```sql
CREATE TABLE analysis_runs (
  id TEXT PRIMARY KEY,
  website_url TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  language TEXT NOT NULL,
  status TEXT,                    -- running, completed, failed
  step TEXT,                      -- Current workflow step
  progress INTEGER,               -- 0-100
  message TEXT,                   -- Status message
  sitemap_urls TEXT,              -- JSON array
  selected_categories TEXT,        -- JSON array
  custom_categories TEXT,         -- JSON array
  prompts_generated INTEGER,
  selected_prompts TEXT,          -- JSON array
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### `categories`

Stores generated categories.

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence REAL NOT NULL,
  source_pages TEXT NOT NULL,    -- JSON array
  created_at TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
);
```

#### `prompts`

Stores generated prompts.

```sql
CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  question TEXT NOT NULL,
  language TEXT NOT NULL,
  country TEXT,
  region TEXT,
  intent TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

#### `llm_responses`

Stores LLM responses.

```sql
CREATE TABLE llm_responses (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  output_text TEXT NOT NULL,
  model TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id)
);
```

#### `citations`

Stores web search citations.

```sql
CREATE TABLE citations (
  id TEXT PRIMARY KEY,
  llm_response_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  snippet TEXT,
  FOREIGN KEY (llm_response_id) REFERENCES llm_responses(id)
);
```

#### `prompt_analyses`

Stores analysis results per prompt.

```sql
CREATE TABLE prompt_analyses (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  brand_mentions_exact INTEGER NOT NULL DEFAULT 0,
  brand_mentions_fuzzy INTEGER NOT NULL DEFAULT 0,
  brand_mentions_contexts TEXT NOT NULL,  -- JSON array
  citation_count INTEGER NOT NULL DEFAULT 0,
  citation_urls TEXT NOT NULL,             -- JSON array
  sentiment_tone TEXT NOT NULL,
  sentiment_confidence REAL NOT NULL,
  sentiment_keywords TEXT NOT NULL,        -- JSON array
  timestamp TEXT NOT NULL,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id)
);
```

#### `competitor_mentions`

Stores competitor mentions.

```sql
CREATE TABLE competitor_mentions (
  id TEXT PRIMARY KEY,
  prompt_analysis_id TEXT NOT NULL,
  competitor_name TEXT NOT NULL,
  mention_count INTEGER NOT NULL,
  contexts TEXT NOT NULL,                  -- JSON array
  citation_urls TEXT NOT NULL,             -- JSON array
  FOREIGN KEY (prompt_analysis_id) REFERENCES prompt_analyses(id)
);
```

#### `category_metrics`

Stores aggregated metrics per category.

```sql
CREATE TABLE category_metrics (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  visibility_score REAL NOT NULL,
  citation_rate REAL NOT NULL,
  brand_mention_rate REAL NOT NULL,
  competitor_mention_rate REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

#### `competitive_analyses`

Stores overall competitive analysis.

```sql
CREATE TABLE competitive_analyses (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  brand_share REAL NOT NULL,
  competitor_shares TEXT NOT NULL,        -- JSON object
  white_space_topics TEXT NOT NULL,       -- JSON array
  dominated_prompts TEXT NOT NULL,        -- JSON array
  missing_brand_prompts TEXT NOT NULL,    -- JSON array
  timestamp TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
);
```

#### `time_series`

Stores historical trend data.

```sql
CREATE TABLE time_series (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  visibility_score REAL NOT NULL,
  citation_count INTEGER NOT NULL,
  brand_mention_count INTEGER NOT NULL,
  competitor_mention_count INTEGER NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
);
```

#### `companies`

Stores company information (multi-tenant support).

```sql
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  country TEXT NOT NULL,
  language TEXT NOT NULL,
  region TEXT,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### `company_prompts`

Stores company-specific prompts.

```sql
CREATE TABLE company_prompts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  question TEXT NOT NULL,
  category_id TEXT,
  category_name TEXT,
  language TEXT NOT NULL,
  country TEXT,
  region TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

#### `scheduled_runs`

Stores scheduled analysis runs.

```sql
CREATE TABLE scheduled_runs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  schedule_type TEXT NOT NULL,            -- daily, weekly, monthly
  next_run_at TEXT NOT NULL,
  last_run_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

#### `analysis_summaries`

Stores analysis summaries.

```sql
CREATE TABLE analysis_summaries (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  total_mentions INTEGER NOT NULL,
  total_citations INTEGER NOT NULL,
  best_prompts TEXT NOT NULL,              -- JSON array
  other_sources TEXT NOT NULL,             -- JSON object
  created_at TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
);
```

### Indexes

Performance indexes are defined in migration `0010_add_performance_indexes.sql`:

- `idx_analysis_runs_website`: On `analysis_runs(website_url)`
- `idx_categories_run`: On `categories(analysis_run_id)`
- `idx_prompts_run`: On `prompts(analysis_run_id)`
- `idx_prompts_category`: On `prompts(category_id)`
- `idx_llm_responses_prompt`: On `llm_responses(prompt_id)`
- `idx_citations_response`: On `citations(llm_response_id)`
- `idx_prompt_analyses_prompt`: On `prompt_analyses(prompt_id)`
- `idx_time_series_run`: On `time_series(analysis_run_id)`
- `idx_time_series_timestamp`: On `time_series(timestamp)`

---

## Configuration

### Environment Variables

Configuration is managed via environment variables and `shared/config.ts`.

#### Required Variables

- `OPENAI_API_KEY`: OpenAI API key (required)

#### Optional Variables

**OpenAI Configuration**:
- `OPENAI_MODEL`: Model to use (default: `gpt-4o`, can be set to `gpt-5` if available)
- `DEBUG_MODE`: Enable debug mode (default: `false`)

**Crawling Configuration**:
- `MAX_PAGES`: Maximum pages to crawl (default: `50`)
- `MAX_DEPTH`: Maximum crawl depth (default: `3`)
- `CRAWL_TIMEOUT`: Request timeout in ms (default: `30000`)
- `USER_AGENT`: User agent string (default: `GEO-Platform/1.0`)

**Analysis Configuration**:
- `RE_RUN_SCHEDULE`: Re-run schedule (default: `weekly`)
- `BRAND_FUZZY_THRESHOLD`: Fuzzy matching threshold (default: `0.7`)
- `SENTIMENT_CONFIDENCE_THRESHOLD`: Sentiment confidence threshold (default: `0.6`)

**Category Configuration**:
- `MIN_CATEGORY_CONFIDENCE`: Minimum category confidence (default: `0.5`)
- `MAX_CATEGORIES`: Maximum categories to generate (default: `10`)

**Prompt Configuration**:
- `QUESTIONS_PER_CATEGORY`: Questions per category (default: `5`)
- `MIN_INTENT_SCORE`: Minimum intent score (default: `0.7`)

### Configuration File

Configuration is loaded in `shared/config.ts`:

```typescript
export function getConfig(env: Record<string, any>): Config {
  // Loads configuration from environment variables
  // Provides sensible defaults
  // Returns typed Config object
}
```

### Cloudflare Workers Configuration

Backend configuration is in `backend/wrangler.toml`:

```toml
name = "geo-platform-backend"
main = "src/index.ts"
compatibility_date = "2024-11-27"

[[d1_databases]]
binding = "geo_db"
database_name = "geo-db"
database_id = "7e73f7d1-492d-4ca3-a5f9-916139ddebec"
migrations_dir = "../migrations"

[vars]
ENVIRONMENT = "production"
DEBUG_MODE = "false"
OPENAI_MODEL = "gpt-4o"
MAX_PAGES = "50"
MAX_DEPTH = "3"
RE_RUN_SCHEDULE = "weekly"
```

### Cloudflare Pages Configuration

Frontend configuration is in `frontend/wrangler.toml`:

```toml
name = "geo-platform-frontend"
pages_build_output_dir = "dist"
compatibility_date = "2024-11-27"
```

---

## Development Guide

### Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **npm**: Comes with Node.js
- **Cloudflare Account**: For deployment
- **OpenAI API Key**: For LLM execution

### Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd GEO_dashboard
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
   - Create `.dev.vars` in `backend/` directory:
```toml
OPENAI_API_KEY=your-api-key-here
DEBUG_MODE=false
OPENAI_MODEL=gpt-4o
```

4. **Create D1 database**:
```bash
npm run db:create
```

5. **Update `backend/wrangler.toml`** with the database ID from step 4.

6. **Run migrations**:
```bash
npm run db:migrate
```

### Development Commands

#### Backend Development

```bash
# Start backend development server
npm run dev:backend

# Type check
cd backend && npm run typecheck

# Deploy backend
npm run deploy:backend
```

#### Frontend Development

```bash
# Start frontend development server
npm run dev:frontend

# Build frontend
cd frontend && npm run build

# Type check
cd frontend && npm run typecheck

# Deploy frontend
npm run deploy:frontend
```

#### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

#### Type Checking

```bash
# Type check entire project
npm run typecheck
```

### Development Workflow

1. **Make changes** to code
2. **Run type check**: `npm run typecheck`
3. **Run tests**: `npm test`
4. **Test locally**: `npm run dev:backend` and `npm run dev:frontend`
5. **Commit changes**

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Follow existing code style
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: Document complex logic and architectural decisions

### Debug Mode

Enable debug mode to skip API calls and use dummy data:

```toml
# In .dev.vars
DEBUG_MODE=true
```

When debug mode is enabled:
- No actual API calls are made
- Dummy data is returned
- Useful for frontend development without API costs

---

## Deployment Guide

### Production Environment

**🌐 Live Production URL:** https://geo.socialhabit.org

The platform is deployed and accessible at the above URL. The backend API and frontend are both served through this domain.

### Prerequisites

- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)
- Authenticated with Cloudflare (`wrangler login`)

### Backend Deployment

1. **Set environment variables** in Cloudflare Workers dashboard or `wrangler.toml`

2. **Deploy**:
```bash
npm run deploy:backend
```

3. **Run remote migrations** (if needed):
```bash
npm run db:migrate:remote
```

### Frontend Deployment

1. **Build**:
```bash
cd frontend && npm run build
```

2. **Deploy**:
```bash
npm run deploy:frontend
```

### Environment-Specific Configuration

Update `wrangler.toml` files for different environments:

```toml
[env.production]
name = "geo-platform-backend-prod"

[env.staging]
name = "geo-platform-backend-staging"
```

### Database Migrations

Migrations are in `migrations/` directory and are automatically applied during deployment if configured in `wrangler.toml`.

To manually apply migrations:

```bash
# Local
npm run db:migrate

# Remote
npm run db:migrate:remote
```

---

## Testing

### Test Structure

Tests are in `tests/` directory:

- `engine.test.ts`: GEOEngine tests
- `workflow-engine.test.ts`: WorkflowEngine tests
- `analysis-engine.test.ts`: AnalysisEngine tests
- `crawler.test.ts`: Website crawler tests
- `categorization.test.ts`: Category generation tests
- `prompt_generation.test.ts`: Prompt generation tests
- `llm_execution.test.ts`: LLM execution tests
- `brand_mention.test.ts`: Brand mention detection tests
- `competitor.test.ts`: Competitor detection tests
- `citation.test.ts`: Citation extraction tests
- `config.test.ts`: Configuration tests
- `utils.test.ts`: Utility function tests

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/engine.test.ts

# Run in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Test Coverage

The test suite covers:
- Core engine functionality
- Workflow steps
- Analysis logic
- Website crawling
- Category generation
- Prompt generation
- LLM execution
- Brand mention detection
- Competitor detection
- Citation extraction
- Configuration management
- Utility functions

### Writing Tests

Tests use Vitest with the following patterns:

```typescript
import { describe, it, expect } from 'vitest';

describe('ModuleName', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

---

## Workflow Engine

The WorkflowEngine provides an interactive, step-by-step analysis process.

### Workflow Steps

#### Step 1: Sitemap Discovery

- Finds XML sitemap at standard locations (`/sitemap.xml`, `/sitemap_index.xml`)
- Parses sitemap to extract URLs
- Returns list of URLs for content fetching

#### Step 2: Content Fetching

- Fetches content from URLs (limited to 50 for performance)
- Extracts text content from HTML
- Combines content for analysis

#### Step 3: Category Generation

- Uses GPT-4o-mini to generate categories from content
- Falls back to keyword-based extraction
- Merges results and deduplicates
- Ultimate fallback creates basic categories if all else fails

**Rate Limiting**: 30-second timeout per API call

#### Step 4: Prompt Generation

- Generates prompts per category using GPT-4o-mini
- Rate-limited: 2-second delay between API calls
- Ensures exactly `questionsPerCategory` prompts per category
- Falls back to template-based generation on errors

**Rate Limiting**: 
- 2-second delay between category API calls
- 45-second timeout per category

#### Step 5: LLM Execution

- Executes prompts with LLM (default: GPT-4o, configurable)
- Only saves prompts with successful responses
- Extracts citations from responses
- Stores responses in database

### User Interaction Points

1. **Category Selection**: User can select which categories to use
2. **Custom Categories**: User can add custom categories
3. **Prompt Selection**: User can select which prompts to execute
4. **Prompt Editing**: User can edit prompts before execution

### State Management

Each step updates database state, allowing:
- Resumption from any point
- Progress tracking
- Error recovery

---

## Analysis Engine

The AnalysisEngine performs comprehensive analysis of LLM responses.

### Analysis Components

#### 1. Brand Mention Detection

- Exact matches: Direct brand name mentions (case-insensitive)
- Fuzzy matches: Similarity-based detection
- Context extraction: Surrounding text (50 chars before/after)
- Citation analysis: Checks if brand domain appears in citation URLs

#### 2. Competitor Detection

- Co-mention detection: Identifies other companies mentioned
- Comparison phrases: Detects comparison language
- Mention counting: Tracks frequency
- Context extraction: Captures mention contexts

#### 3. Sentiment Analysis

- Tone classification: positive, neutral, negative, mixed
- Keyword-based: Uses keyword matching (LLM-based planned)
- Confidence scoring: 0-1
- Keyword extraction: Identifies sentiment keywords

#### 4. Citation Analysis

- Citation counting: Total citations
- URL extraction: All citation URLs
- Brand citation detection: Citations where brand is mentioned

### Metrics Calculation

#### Visibility Score

Calculated per category:

```
Visibility Score = (
  (exact_mentions × 10) +
  (fuzzy_mentions × 5) +
  (citations × 2) +
  (positive_sentiment ? 5 : negative_sentiment ? -5 : 0)
) / normalization_factor

Normalized to 0-100 scale
```

#### Category Metrics

- Visibility score: 0-100
- Citation rate: Average citations per prompt
- Brand mention rate: Percentage of prompts with brand mentions
- Competitor mention rate: Percentage of prompts with competitor mentions

#### Competitive Analysis

- Brand share: Percentage of total mentions
- Competitor shares: Individual percentages
- White space topics: Topics with demand but no dominant brand
- Dominated prompts: Prompts where competitors dominate
- Missing brand prompts: Prompts with no brand mentions

### Time-Series Tracking

Stores historical data for trend analysis:
- Visibility score over time
- Citation count trends
- Brand mention trends
- Competitor mention trends

---

## Implementation Status

**Considerations:** What is already implemented, what is not yet? This section provides an overview of the current state.

### ✅ Fully Implemented Features

#### Core Functionality

- ✅ **Website Ingestion**
  - Website crawling with depth and page limits
  - Sitemap discovery and parsing
  - Content extraction from HTML pages
  - URL normalization and duplicate handling
  - Language detection

- ✅ **Category Generation**
  - GPT-based category generation (GPT-4o-mini)
  - Traditional keyword-based fallback
  - Hybrid approach (merges GPT + traditional)
  - Confidence scoring
  - Source page tracking

- ✅ **Prompt Generation**
  - GPT-based prompt generation per category
  - Language-specific prompts (English, German, French)
  - Region-aware question generation
  - Brand-neutral question creation
  - Intent scoring (high/medium/low)
  - Rate limiting between API calls

- ✅ **LLM Execution**
  - Integration with OpenAI API (GPT-4o default, configurable)
  - Web search via Responses API
  - Citation extraction from responses
  - Response parsing and storage
  - Error handling and retries

- ✅ **Analysis Engine**
  - Brand mention detection (exact + fuzzy)
  - Competitor detection and analysis
  - Sentiment analysis (keyword-based)
  - Citation analysis
  - Context extraction

- ✅ **Metrics & Analytics**
  - Visibility score calculation
  - Category-level metrics
  - Competitive analysis
  - Brand share calculation
  - White space detection

- ✅ **Time-Series Tracking**
  - Historical data storage
  - Trend analysis support
  - Performance monitoring over time

#### Backend API

- ✅ **Workflow Endpoints**
  - Step 1: Sitemap discovery
  - Step 2: Content fetching
  - Step 3: Category generation
  - Step 4: Prompt generation
  - Step 5: LLM execution
  - URL fetching
  - Single prompt execution
  - Summary generation
  - AI Readiness analysis

- ✅ **Analysis Endpoints**
  - Start analysis
  - Get all analyses
  - Get analysis by ID
  - Get analysis status
  - Get metrics
  - Get prompts and summary
  - Delete analysis

- ✅ **Dashboard Endpoints**
  - Get all companies
  - Get company analyses
  - Get global categories
  - Get global prompts by category

- ✅ **Infrastructure**
  - CORS handling
  - Error handling middleware
  - Request routing
  - Database operations

#### Frontend

- ✅ **Dashboard Page**
  - Overview dashboard
  - Company listing
  - Analysis statistics

- ✅ **Analyses Page**
  - List of all analyses
  - Analysis details view
  - Status indicators
  - Delete functionality

- ✅ **Analysis Workflow**
  - Interactive step-by-step workflow
  - Real-time progress tracking
  - Category selection/editing
  - Prompt selection/editing
  - Results visualization

- ✅ **AI Readiness Workflow**
  - URL input
  - Content fetching
  - AI readiness analysis
  - Score and recommendations

- ✅ **UI/UX**
  - Responsive design
  - Navigation system
  - Loading states
  - Error handling
  - Real-time updates

#### Database

- ✅ **Schema**
  - All core tables implemented
  - Relationships and foreign keys
  - Indexes for performance
  - Multi-tenant support (companies)

- ✅ **Operations**
  - CRUD operations for all entities
  - Transaction support
  - Query optimization

#### Testing

- ✅ **Unit Tests**
  - Engine tests
  - Workflow engine tests
  - Analysis engine tests
  - Crawler tests
  - Category generation tests
  - Prompt generation tests
  - LLM execution tests
  - Brand mention tests
  - Competitor detection tests
  - Citation extraction tests
  - Configuration tests
  - Utility function tests

- ✅ **Test Infrastructure**
  - Vitest setup
  - Test coverage reporting
  - Mock implementations

#### Configuration & Deployment

- ✅ **Configuration Management**
  - Environment variable support
  - Default values
  - Type-safe configuration

- ✅ **Deployment**
  - Cloudflare Workers deployment
  - Cloudflare Pages deployment
  - Database migrations
  - Environment-specific configs

### 🚧 Partially Implemented Features

#### AI Readiness

- ✅ Basic AI readiness analysis implemented
- ⚠️ Advanced recommendations could be enhanced
- ⚠️ More comprehensive technical checks could be added

#### Sentiment Analysis

- ✅ Keyword-based sentiment analysis working
- ⚠️ LLM-based sentiment analysis not yet implemented (planned)

#### Multi-Tenant Features

- ✅ Database schema supports multi-tenancy
- ✅ Company management endpoints
- ⚠️ User authentication/authorization not yet implemented
- ⚠️ Access control per company not yet implemented

### ❌ Not Yet Implemented

#### Authentication & Authorization

- ❌ User authentication system
- ❌ Role-based access control (RBAC)
- ❌ API key authentication
- ❌ Session management
- ❌ Company-based access control

#### Advanced Features

- ❌ Scheduled analysis runs (database schema exists, but scheduler not implemented)
- ❌ Email notifications
- ❌ Export functionality (PDF, CSV)
- ❌ Advanced filtering and search
- ❌ Bulk operations

#### Enhanced Analysis

- ❌ LLM-based sentiment analysis (currently keyword-based)
- ❌ Advanced entity extraction (NER models)
- ❌ Content recommendations based on analysis
- ❌ A/B testing for content optimization
- ❌ Multi-LLM support (Claude, Gemini) - currently only OpenAI API

#### Performance & Scalability

- ❌ Caching layer
- ❌ Rate limiting per user/company
- ❌ Background job queue
- ❌ Webhook support
- ❌ API versioning

#### UI Enhancements

- ❌ Data visualization charts (beyond basic tables)
- ❌ Interactive dashboards
- ❌ Custom report generation
- ❌ Dark mode
- ❌ Advanced filtering UI

#### Integration

- ❌ Third-party integrations (Google Analytics, etc.)
- ❌ Webhook support for external systems
- ❌ API for external access
- ❌ OAuth integration

---

## Future Enhancements

**Considerations:** Possible future improvements and features. This list should be understood as a collection of ideas, not as a roadmap.

### High Priority Enhancements

#### 1. Authentication & Security

**User Authentication System**
- User registration and login
- JWT-based authentication
- Password reset
- Email verification
- OAuth integration (Google, GitHub)

**Access Control**
- Role-based access control (Admin, User, Viewer)
- Company-based access control
- API key management
- Permission system

**Security**
- Rate limiting per user
- Request validation
- SQL injection prevention (D1 handles this, additional validation possible)
- XSS protection

#### 2. Scheduled Analysis Runs

**Implementation**
- Cron job scheduler for Cloudflare Workers
- Scheduled run management UI
- Email notifications on completion
- Failure notifications
- Retry logic

**Features**
- Daily/weekly/monthly schedules
- Custom schedule configuration
- Pause/resume schedules
- Schedule history

#### 3. Enhanced Sentiment Analysis

**LLM-Based Sentiment**
- Replace keyword-based with LLM-based sentiment analysis
- More accurate detection
- Nuanced scoring
- Context-aware sentiment

**Advanced Features**
- Emotion detection (beyond positive/negative)
- Sentiment trends over time
- Sentiment by category

#### 4. Multi-LLM Support

**Additional LLM Providers**
- Claude (Anthropic) integration
- Gemini (Google) integration
- Perplexity integration
- Comparison across multiple LLMs

**Features**
- LLM selection per analysis
- Multi-LLM comparison
- Cost optimization

#### 5. Advanced Export & Reporting

**Export Formats**
- PDF reports
- CSV export
- Excel export
- JSON API responses

**Report Generation**
- Custom report templates
- Scheduled generation
- Email delivery
- Report history

### Medium Priority Enhancements

#### 6. Data Visualization

**Charts & Graphs**
- Visibility score trends
- Category comparison
- Competitor share charts
- Citation source distribution
- Sentiment distribution

**Interactive Dashboards**
- Customizable widgets
- Drag-and-drop builder
- Real-time updates
- Dashboard sharing

#### 7. Content Recommendations

**AI-Powered Recommendations**
- Content gap analysis
- Optimization suggestions
- Topic suggestions
- Content structure recommendations

**Features**
- Actionable insights
- Priority scoring
- Implementation tracking

#### 8. Advanced Entity Extraction

**NER Models**
- Named Entity Recognition
- Product/service extraction
- Person/company detection
- Location extraction

**Features**
- Entity relationship mapping
- Entity mention tracking
- Entity-based analysis

#### 9. A/B Testing Support

**Content Testing**
- A/B test setup and management
- Variant comparison
- Statistical significance testing
- Winner determination

**Integration**
- Integration with analysis results
- Performance tracking
- Automated recommendations

#### 10. Webhook Support

**Webhooks**
- Webhook configuration UI
- Event-based webhooks (analysis complete, etc.)
- Retry logic
- History and logs

**Use Cases**
- Integration with external systems
- Automated workflows
- Notification systems

### Low Priority / Nice-to-Have Features

#### 11. Advanced Filtering & Search

**Search**
- Full-text search across analyses
- Advanced filters
- Saved queries
- Search history

**Filtering**
- Multi-criteria filtering
- Date range filtering
- Category-based filtering
- Status filtering

#### 12. Bulk Operations

**Bulk Actions**
- Bulk analysis creation
- Bulk deletion
- Bulk export
- Bulk status updates

#### 13. Caching Layer

**Performance Optimization**
- Response caching
- Category/prompt caching
- Redis integration (if moving beyond Cloudflare)
- Cache invalidation

#### 14. Background Job Queue

**Async Processing**
- Job queue for long-running tasks
- Job status tracking
- Retry logic
- Priority system

#### 15. API Versioning

**API Management**
- Versioned endpoints
- API documentation (OpenAPI/Swagger)
- Rate limiting per tier
- Usage analytics

#### 16. Dark Mode

**UI Enhancement**
- Dark theme
- Theme persistence
- System theme detection

#### 17. Mobile App

**Mobile Support**
- React Native or Flutter app
- Push notifications
- Mobile-optimized views
- Offline support

#### 18. Integration Marketplace

**Third-Party Integrations**
- Google Analytics
- Google Search Console
- SEMrush
- Custom integration framework
- Integration marketplace UI

### Technical Improvements

#### 19. Performance Optimization

- Database query optimization
- Response time improvements
- Caching strategies
- CDN integration

#### 20. Monitoring & Observability

- Application performance monitoring (APM)
- Error tracking (Sentry integration)
- Log aggregation
- Metrics dashboard
- Alerting

#### 21. Testing Enhancements

- Integration tests
- End-to-end tests
- Performance tests
- Load tests

#### 22. Documentation Improvements

- API documentation (OpenAPI)
- Interactive API explorer
- Video tutorials
- Use case examples

### Research & Experimental Features

#### 23. Advanced AI Features

- Custom fine-tuned models
- Domain-specific models
- Multi-modal analysis (images, videos)
- Predictive analytics

#### 24. Collaborative Features

- Team collaboration
- Comments and annotations
- Shared workspaces

#### 25. Marketplace Features

- Question marketplace
- Template marketplace
- Plugin system
- Custom analysis modules

---

## Additional Resources

### Migration History

See `migrations/` directory for complete migration history:
- `0001_initial_schema.sql`: Initial schema
- `0002_add_status.sql`: Status tracking
- `0003_interactive_workflow.sql`: Workflow support
- `0004_companies.sql`: Multi-tenant support
- `0005_multi_tenant_schema.sql`: Enhanced multi-tenant
- `0006_add_summaries.sql`: Analysis summaries
- `0007_cleanup_unused_tables.sql`: Cleanup
- `0008_restore_required_tables.sql`: Restore tables
- `0009_clear_all_data.sql`: Data cleanup
- `0010_add_performance_indexes.sql`: Performance indexes
- `0011_clear_all_data_keep_structure.sql`: Structure preservation

### Architecture Documentation

See `tests/ARCHITECTURE.md` for detailed architectural decisions demonstrated through tests.

### Type Definitions

All TypeScript types are defined in `shared/types.ts`. Key interfaces:
- `UserInput`: User input for analysis
- `Category`: Generated category
- `Prompt`: Generated prompt
- `LLMResponse`: LLM response
- `PromptAnalysis`: Analysis result
- `CategoryMetrics`: Category-level metrics
- `CompetitiveAnalysis`: Competitive analysis
- `AnalysisResult`: Complete analysis result

---

## Support & Contributing

### Getting Help

For issues or questions:
1. Check this documentation
2. Review code comments
3. Check test files for usage examples
4. Contact the development team

### Contributing

When contributing:
1. Maintain strict TypeScript types
2. Add tests for new logic
3. Follow separation of concerns
4. Document architectural decisions
5. Ensure Cloudflare Workers compatibility
6. Update this documentation

### License

Proprietary - All rights reserved

---

**Last Updated**: 2024-01-01
**Version**: 1.0.0
