# GEO Platform - Quick Start Guide

## Prerequisites

1. **Node.js 18+** installed
2. **Cloudflare account** with Workers and D1 enabled
3. **OpenAI API key** with access to Responses API

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create D1 Database

```bash
npm run db:create
```

This will output a database ID. Copy it.

### 3. Update Configuration

Edit `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "geo-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Paste the ID from step 2
```

### 4. Set Environment Variables

Create a `.dev.vars` file (for local development):

```
OPENAI_API_KEY=your-openai-api-key-here
MAX_PAGES=50
MAX_DEPTH=3
RE_RUN_SCHEDULE=weekly
DEBUG_MODE=true
```

**Debug Mode**: Set `DEBUG_MODE=true` to use dummy values instead of making API calls. This saves costs during development and testing. In debug mode:
- No OpenAI API calls are made
- Dummy LLM responses are returned
- Dummy prompts are generated
- All analysis still works with the dummy data

For production, set these in Cloudflare Workers dashboard.

### 5. Run Migrations

```bash
npm run db:migrate
```

### 6. Test Locally

```bash
npm run dev
```

The worker will start on `http://localhost:8787`

### 7. Run Tests

```bash
npm test
```

## First Analysis

### Using cURL

```bash
curl -X POST http://localhost:8787/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "websiteUrl": "https://example.com",
    "country": "US",
    "language": "en"
  }'
```

Response:
```json
{
  "runId": "run_1234567890_abc123",
  "status": "started",
  "message": "Analysis started successfully"
}
```

### Get Results

```bash
curl http://localhost:8787/api/analysis/run_1234567890_abc123
```

### Get Metrics Only

```bash
curl http://localhost:8787/api/analysis/run_1234567890_abc123/metrics
```

## Deployment

### Deploy to Cloudflare

```bash
npm run deploy
```

### Set Production Environment Variables

In Cloudflare Workers dashboard:
1. Go to your worker
2. Settings → Variables
3. Add:
   - `OPENAI_API_KEY`
   - `MAX_PAGES`
   - `MAX_DEPTH`
   - `RE_RUN_SCHEDULE`

## Understanding Results

### Category Metrics

Each category has:
- **Visibility Score** (0-100): Overall brand visibility
- **Citation Rate**: Avg citations per prompt
- **Brand Mention Rate**: % of prompts with brand mentions
- **Competitor Mention Rate**: % of prompts with competitors

### Competitive Analysis

- **Brand Share**: Your % of total mentions
- **Competitor Shares**: Individual competitor percentages
- **White Space Topics**: Opportunities (no dominant brand)
- **Dominated Prompts**: Where competitors win
- **Missing Brand Prompts**: Where you're not mentioned

### Time Series

Track changes over time:
- Visibility score trends
- Citation growth/decline
- Brand vs competitor share changes

## Common Issues

### Database Not Found

- Ensure `database_id` is set in `wrangler.toml`
- Run `npm run db:migrate` again

### OpenAI API Errors

- Check API key is set correctly
- Verify you have access to Responses API
- Check rate limits

### Crawling Fails

- Website may block crawlers
- Check `MAX_PAGES` and `MAX_DEPTH` settings
- Verify website is publicly accessible

## Next Steps

1. **Customize Categories**: Edit `src/categorization/index.ts`
2. **Add Languages**: Edit `src/prompt_generation/index.ts`
3. **Adjust Analysis**: Modify `src/analysis/` modules
4. **Set Up Monitoring**: Add logging/error tracking
5. **Schedule Re-runs**: Use Cloudflare Cron Triggers

## Support

See `README.md` for full documentation and `ARCHITECTURE.md` for system design.







