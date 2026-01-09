# GEO Platform

**Generative Engine Optimization (GEO)** platform for analyzing brand visibility in generative AI responses.

**🌐 Live:** https://geo.socialhabit.org

> 📚 **Documentation:** [DOCUMENTATION.md](./DOCUMENTATION.md)

## Overview

Analyzes how ChatGPT responds to questions about a company.

Workflow:
1. Crawl and extract website content
2. Generate thematic categories
3. Create prompts
4. Execute prompts with OpenAI API (default: GPT-4o, configurable)
5. Analyze brand mentions, citations, competitors

## Architecture

### Separation of Concerns

The platform is built with strict separation of concerns:

```
src/
├── ingestion/          # Website crawling and scraping
├── categorization/     # Thematic category extraction
├── prompt_generation/  # High-intent question generation
├── llm_execution/      # GPT Web Search integration
├── analysis/           # Brand mentions, competitors, sentiment
├── persistence/        # D1 database operations
├── api/                # REST API endpoints
├── engine.ts           # Main orchestration
└── index.ts            # Cloudflare Workers entry point
```

### Technology Stack

- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest
- **LLM**: OpenAI API
  - Responses API (`/v1/responses`) for prompt execution with web search
  - Chat Completions API (`/v1/chat/completions`) for category/prompt generation

## Core Workflow

### Step 1: Website Ingestion

- Crawls website up to configured depth and page limits
- Extracts:
  - Main pages
  - Headings (H1-H6)
  - Key topics (frequency-based)
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

Executes prompts via OpenAI Responses API with web search:

```typescript
{
  model: config.openai.model, // Default: "gpt-4o", configurable
  tools: [{ type: "web_search" }],
  input: question
}
```

Extracts:
- `output[].content[].text` - Response text
- `output[].content[].annotations` - URL citations

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
- `llm_responses` - LLM responses
- `citations` - Web search citations
- `prompt_analyses` - Analysis results per prompt
- `competitor_mentions` - Detected competitors
- `category_metrics` - Aggregated metrics per category
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
RE_RUN_SCHEDULE = "weekly"
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
- **Cost-Effective**: Pay-per-request model

### Why Responses API?

- Web search integration
- Structured citation format
- Supports GPT-4o and newer models

### Why Deterministic Categories?

- Explainable category selection
- Reproducible results
- Testable logic

### Why Language-Aware Prompts?

- Language-specific question generation
- Region-aware context
- Brand-neutral (no forced mentions)

## Limitations & Future Enhancements

### Current Limitations

- Simplified HTML parsing (no full DOM parsing in Workers)
- Basic entity extraction (could use NER models)

### Future Enhancements

- Multi-LLM support (Claude, Gemini)
- Advanced entity extraction (NER)
- LLM-based sentiment analysis
- Real-time monitoring dashboard
- Automated content recommendations
- A/B testing for content optimization

## Contributing

When contributing:

1. Maintain strict TypeScript types
2. Add tests for new logic
3. Follow separation of concerns
4. Document architectural decisions
5. Ensure Cloudflare Workers compatibility

## License

Proprietary - All rights reserved

## Support

For issues or questions, please refer to the codebase documentation or contact the development team.
