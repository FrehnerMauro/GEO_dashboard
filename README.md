# GEO Platform

A production-ready **Generative Engine Optimization (GEO)** platform that helps companies optimize their website, content, and brand visibility for generative AI systems, starting with ChatGPT.
## Overview

This platform answers the core question: **"How does ChatGPT talk about my company?"**

The system performs comprehensive analysis by:
1. Crawling and ingesting website content
2. Generating thematic categories
3. Creating high-intent prompts
4. Executing prompts against GPT-5 with Web Search
5. Analyzing brand mentions, citations, competitors, and sentiment


## Architecture

### Separation of Concerns

The platform is built with strict separation of concerns:

```
src/
├── ingestion/          # Website crawling and scraping
├── categorization/     # Thematic category extraction
├── prompt_generation/  # High-intent question generation
├── llm_execution/      # GPT-5 Web Search integration
├── analysis/           # Brand mentions, competitors, sentiment
├── persistence/        # D1 database operations
├── api/                # REST API endpoints
├── engine.ts           # Main orchestration
└── index.ts            # Cloudflare Workers entry point
```

### Technology Stack

- **Runtime**: Cloudflare Workers (edge computing)
- **Database**: Cloudflare D1 (SQLite)
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest
- **LLM**: OpenAI Responses API with Web Search

## Core Workflow

### Step 1: Website Ingestion

- Crawls website up to configured depth and page limits
- Extracts:
  - Main pages
  - Headings (H1-H6)
  - Key topics 
  - Product/service entities (capitalized phrases)
- Normalizes content with language-aware processing

**Module**: `src/ingestion/`

### Step 2: Category Generation

Derives thematic categories from website content using keyword matching and confidence scoring:

- Product
- Pricing
- Comparison
- Use Cases
- Industry
- Problems / Solutions
- Integration
- Support

Categories are deterministic and explainable, with confidence scores based on keyword density and page coverage.

**Module**: `src/categorization/`

### Step 3: Prompt Generation

Generates 5 high-intent questions per category that represent realistic customer queries:

- Language-specific (English, German, French supported)
- Region-aware (incorporates country/region context)
- Brand-neutral (no forced self-mentions)
- Intent-scored (high/medium/low)

Example: *"How do companies in Switzerland choose accounting software for SMEs?"*

**Module**: `src/prompt_generation/`

### Step 4: LLM Execution

Executes each prompt against GPT-4 with Web Search enabled via the OpenAI Responses API:

```typescript
{
  model: "gpt-4o",
  messages: [{ role: "user", content: question }],
  tools: [{ type: "web_search" }],
  tool_choice: "auto"
}
```

Extracts:
- `message.output_text` - Main response text
- `message.content[].annotations` - URL citations
- `message.web_search_call.action.sources` - Web search sources (if included)

**Module**: `src/llm_execution/`

### Step 5: Result Analysis

For each prompt execution, extracts:

- **Brand Mentions**: Exact and fuzzy (similarity-based) matches
- **Citations**: Count and URLs from web search
- **Competitors**: Detected from comparison phrases and co-mentions

**Module**: `src/analysis/`

## Data Model

### Database Schema

The platform uses Cloudflare D1 with the following main tables:

- `analysis_runs` - User inputs and run metadata
- `categories` - Generated categories
- `prompts` - Generated questions
- `llm_responses` - GPT-5 responses
- `citations` - Web search citations
- `prompt_analyses` - Analysis results per prompt
- `competitor_mentions` - Detected competitors
- `category_metrics` - Aggregated metrics per category
- `competitive_analyses` - Overall competitive analysis
- `time_series` - Historical trend data

See `migrations/0001_initial_schema.sql` for full schema.

### API Data Model

**Analysis Result**:
```typescript
{
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
```

## API Endpoints

### POST `/api/analyze`

Start a new analysis run.

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

### GET `/api/analysis/:runId`

Get full analysis results.

**Response**: Full `AnalysisResult` object

### GET `/api/analysis/:runId/metrics`

Get metrics only (category metrics, competitive analysis, time series).

**Response**:
```json
{
  "categoryMetrics": [...],
  "competitiveAnalysis": {...},
  "timeSeries": [...]
}
```

### GET `/api/health`

Health check endpoint.

## Configuration

Configuration is managed via environment variables and `src/config.ts`:

```typescript
{
  openai: {
    apiKey: string;
    model: string;
    responsesApiUrl: string;
  },
  crawling: {
    maxPages: number;
    maxDepth: number;
    timeout: number;
    userAgent: string;
  },
  analysis: {
    reRunSchedule: "daily" | "weekly";
    brandFuzzyThreshold: number;
    sentimentConfidenceThreshold: number;
  },
  categories: {
    minConfidence: number;
    maxCategories: number;
  },
  prompts: {
    questionsPerCategory: number;
    minIntentScore: number;
  }
}
```

## Installation & Setup

### Prerequisites

- Node.js 18+
- Cloudflare account
- OpenAI API key

### Installation

```bash
npm install
```

### Database Setup

```bash
# Create D1 database
npm run db:create

# Update wrangler.toml with database_id

# Run migrations
npm run db:migrate
```

### Environment Variables

Set in Cloudflare Workers dashboard or `wrangler.toml`:

```toml
[vars]
OPENAI_API_KEY = "your-api-key"
MAX_PAGES = "50"
MAX_DEPTH = "3"
```

### Development

```bash
# Run locally
npm run dev

# Run tests
npm test

# Type check
npm run typecheck
```

### Deployment

```bash
npm run deploy
```

## Testing

Unit tests cover:

- Category extraction logic
- Prompt generation (language-specific, region-aware)
- Brand mention detection (exact + fuzzy)
- Citation parsing from Responses API
- Competitor extraction

Run tests:
```bash
npm test
```

## Architecture Decisions

### Why Cloudflare Workers?

- **Edge Computing**: Low latency globally
- **Stateless**: Perfect for GEO analysis jobs
- **D1 Integration**: Native SQLite database
- **Cost-Effective**: 

### Why Responses API?

- **Web Search**: Native integration with web search
- **Citations**: Structured citation format
- **Future-Proof**: Designed for GPT-5 and beyond

### Why Deterministic Categories?

- **Explainable**: Users understand why categories were chosen
- **Reproducible**: Same website = same categories
- **Testable**: Can verify category extraction logic

### Why Language-Aware Prompts?

- **Realistic**: Matches how users actually query
- **Regional**: Incorporates country/region context
- **Brand-Neutral**: Avoids forced self-mentions

## Limitations & Future Enhancements

### Current Limitations

- Simplified HTML parsing (no full DOM parsing in Workers)
- Basic entity extraction (could use NER models)
- Sentiment analysis uses keyword matching (could use LLM-based)

### Future Enhancements

- Multi-LLM support (Claude, Gemini)
- Advanced entity extraction (NER)
- LLM-based sentiment analysis
- Real-time monitoring dashboard
- Automated content recommendations
- A/B testing for content optimization

## License

Proprietary - All rights reserved

## Support

For issues or questions, please refer to the codebase documentation or contact the development team.
