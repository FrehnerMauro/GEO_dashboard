# GEO Platform Architecture

## System Overview

The GEO Platform is a production-ready system designed to analyze and optimize brand visibility in generative AI responses. It follows a modular, stateless architecture optimized for Cloudflare Workers.

## Core Principles

1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Stateless Design**: All state is persisted in D1 database
3. **Deterministic Logic**: Same inputs produce same outputs (where applicable)
4. **Type Safety**: Full TypeScript with strict mode
5. **Testability**: Core logic is unit-testable without mocks

## Module Architecture

### 1. Ingestion Module (`src/ingestion/`)

**Responsibility**: Crawl and extract content from websites

**Components**:
- `crawler.ts`: Website crawling with depth and page limits
- `scraper.ts`: Content extraction and normalization

**Key Features**:
- Same-domain crawling only
- Language-aware normalization
- Topic and entity extraction
- Configurable depth and page limits

**Dependencies**: None (pure logic)

### 2. Categorization Module (`src/categorization/`)

**Responsibility**: Derive thematic categories from content

**Components**:
- `index.ts`: CategoryGenerator class

**Algorithm**:
1. Match content against category templates (Product, Pricing, etc.)
2. Calculate confidence based on keyword density
3. Boost confidence for multi-page coverage
4. Filter by minConfidence threshold
5. Sort and limit by maxCategories

**Deterministic**: Yes - same content always produces same categories

### 3. Prompt Generation Module (`src/prompt_generation/`)

**Responsibility**: Generate high-intent questions per category

**Components**:
- `index.ts`: PromptGenerator class

**Features**:
- Language-specific templates (en, de, fr)
- Region-aware (incorporates country/region)
- Brand-neutral (no forced mentions)
- Intent scoring (high/medium/low)

**Templates**: Stored in code for determinism and control

### 4. LLM Execution Module (`src/llm_execution/`)

**Responsibility**: Execute prompts via OpenAI Responses API with Web Search

**Components**:
- `index.ts`: LLMExecutor class

**API Integration**:
- Uses Responses API (not Chat Completions)
- Enables web_search tool
- Extracts citations from annotations
- Handles rate limiting (sequential execution)

**Citation Extraction**:
- From `message.content[].annotations` (url_citation)
- From `message.web_search_call.action.sources` (if included)
- Deduplicates by URL

### 5. Analysis Module (`src/analysis/`)

**Responsibility**: Analyze LLM responses for brand mentions, competitors, sentiment

**Components**:
- `brand_mention.ts`: Exact and fuzzy brand detection
- `competitor.ts`: Competitor extraction from text
- `sentiment.ts`: Keyword-based sentiment analysis
- `index.ts`: AnalysisEngine orchestrator

**Brand Mention Detection**:
- Exact: Regex-based word boundary matching
- Fuzzy: Levenshtein distance similarity (configurable threshold)
- Context extraction: Sentence-level context

**Competitor Detection**:
- Pattern matching for comparison phrases
- Capitalized phrase extraction
- Known competitor list support
- Context and citation extraction

**Sentiment Analysis**:
- Keyword-based (positive/negative lists)
- Tone classification (positive/neutral/negative/mixed)
- Confidence based on keyword density

### 6. Persistence Module (`src/persistence/`)

**Responsibility**: Database operations for D1

**Components**:
- `db.ts`: Database class with CRUD operations

**Schema Design**:
- Normalized relational structure
- JSON columns for arrays/objects
- Indexes on foreign keys and timestamps
- Supports time-series queries

**Operations**:
- Save analysis runs
- Save categories, prompts, responses
- Save analyses and metrics
- Retrieve analysis results

### 7. API Module (`src/api/`)

**Responsibility**: REST API endpoints

**Components**:
- `routes.ts`: APIRoutes class

**Endpoints**:
- `POST /api/analyze`: Start analysis
- `GET /api/analysis/:runId`: Get results
- `GET /api/analysis/:runId/metrics`: Get metrics only
- `GET /api/health`: Health check

**Features**:
- CORS support
- Error handling
- Input validation

### 8. Engine Module (`src/engine.ts`)

**Responsibility**: Orchestrate the full analysis workflow

**Workflow**:
1. Save analysis run
2. Scrape website
3. Generate categories
4. Generate prompts
5. Execute LLM prompts
6. Analyze responses
7. Calculate metrics
8. Perform competitive analysis
9. Save time-series data

**Error Handling**: Continues on individual failures, logs errors

## Data Flow

```
User Input
    ↓
[Engine] → [Ingestion] → WebsiteContent
    ↓
[Engine] → [Categorization] → Categories
    ↓
[Engine] → [Prompt Generation] → Prompts
    ↓
[Engine] → [LLM Execution] → LLMResponses
    ↓
[Engine] → [Analysis] → PromptAnalyses
    ↓
[Engine] → [Analysis] → CategoryMetrics + CompetitiveAnalysis
    ↓
[Engine] → [Persistence] → D1 Database
    ↓
[API] → Return Results
```

## Configuration Management

Configuration is centralized in `src/config.ts`:

- Environment-based (via `env` object)
- Type-safe (Config interface)
- Defaults provided
- No hardcoded values

## Error Handling Strategy

1. **Ingestion**: Skip failed pages, continue crawling
2. **LLM Execution**: Log errors, continue with other prompts
3. **Analysis**: Return empty/default values on failure
4. **Persistence**: Transaction-like batching (D1 limitations)

## Scalability Considerations

### Current Design

- **Stateless Workers**: Can scale horizontally
- **D1 Database**: SQLite-based, single region
- **Sequential LLM Calls**: Rate limit friendly but slow

### Future Optimizations

- **Parallel LLM Execution**: With rate limit queuing
- **Caching**: Cache website content and categories
- **Queue System**: For long-running analyses
- **D1 Replication**: For multi-region (when available)

## Testing Strategy

### Unit Tests

- Category generation logic
- Prompt generation (language, region)
- Brand mention detection
- Competitor extraction
- Citation parsing

### Integration Tests (Future)

- Full workflow with mocked LLM
- Database operations
- API endpoints

### Test Philosophy

- Test real logic, not mocks
- Deterministic tests
- Fast execution
- CI-ready

## Deployment Architecture

### Cloudflare Workers

- **Entry Point**: `src/index.ts`
- **Binding**: D1 database via `env.DB`
- **Environment Variables**: Via `env` object
- **Migrations**: Via Wrangler CLI

### Database

- **Type**: Cloudflare D1 (SQLite)
- **Migrations**: SQL files in `migrations/`
- **Schema Versioning**: Sequential migration files

## Security Considerations

1. **API Keys**: Stored in environment variables
2. **Input Validation**: All user inputs validated
3. **SQL Injection**: Parameterized queries only
4. **CORS**: Configurable (currently open)
5. **Rate Limiting**: Sequential execution prevents abuse

## Monitoring & Observability

### Current

- Console logging for errors
- Timestamp tracking in database

### Future

- Structured logging
- Metrics collection
- Error tracking (Sentry, etc.)
- Performance monitoring

## Performance Characteristics

### Typical Analysis

- **Website Crawling**: 10-30 seconds (50 pages)
- **Category Generation**: <1 second
- **Prompt Generation**: <1 second
- **LLM Execution**: 30-60 seconds (25 prompts, sequential)
- **Analysis**: <1 second
- **Total**: ~1-2 minutes

### Bottlenecks

1. **LLM Execution**: Sequential calls are slow
2. **Website Crawling**: Network latency
3. **Database Writes**: Batch operations help

## Future Enhancements

1. **Multi-LLM Support**: Claude, Gemini
2. **Advanced NER**: Better entity extraction
3. **LLM-based Sentiment**: More accurate sentiment
4. **Real-time Dashboard**: WebSocket updates
5. **Content Recommendations**: AI-generated suggestions
6. **A/B Testing**: Content optimization experiments







