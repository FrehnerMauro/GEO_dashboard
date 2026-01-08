# GEO Platform Frontend

This directory contains the frontend application for the GEO Platform, organized with proper separation of concerns.

## Structure

```
web/
├── index.html              # Main HTML file
├── styles/                 # CSS files
│   ├── variables.css      # CSS custom properties (colors, spacing, etc.)
│   ├── base.css           # Base styles (layout, typography, components)
│   ├── ai-readiness.css  # AI Readiness section specific styles
│   └── responsive.css     # Responsive design (media queries)
├── scripts/               # JavaScript modules
│   ├── global.js         # Global functions (available before DOMContentLoaded)
│   └── main.js           # Main application logic (runs after DOMContentLoaded)
└── assets/               # Static assets (images, fonts, etc.)
```

## Separation of Concerns

### HTML (`index.html`)
- Structure and semantic markup
- Links to external CSS and JS files
- No inline styles or scripts

### CSS (`styles/`)
- **variables.css**: Design tokens (colors, spacing, typography scales)
- **base.css**: Core layout, components, and utilities
- **ai-readiness.css**: Feature-specific styles
- **responsive.css**: Media queries for different screen sizes

### JavaScript (`scripts/`)
- **global.js**: Functions that must be available immediately (before DOMContentLoaded)
  - Navigation functions
  - Sidebar toggle
  - Global event handlers
- **main.js**: Main application logic
  - Dashboard functionality
  - Analysis workflow
  - API interactions
  - DOM manipulation

## Development

### Local Development
1. Serve the `web/` directory with a static file server
2. Point API calls to your local Workers instance
3. Or use Cloudflare Pages for local development

### Cloudflare Pages Deployment

1. **Connect Repository**: Connect your GitHub repository to Cloudflare Pages
2. **Build Settings**:
   - Build command: (none needed - static files)
   - Build output directory: `web`
   - Root directory: `.`
3. **Environment Variables**: Set in Cloudflare Pages dashboard
   - API URL (if different from default)

### API Integration

The frontend makes API calls to `/api/*` endpoints. These are handled by Cloudflare Workers.

For production:
- Frontend: Served by Cloudflare Pages
- API: Served by Cloudflare Workers
- Use `_redirects` file to proxy API calls to Workers

## File Size Guidelines

- **HTML files**: < 50KB
- **CSS files**: < 100KB each
- **JavaScript files**: < 200KB each (consider splitting further if needed)

## Future Improvements

- Split `main.js` into modules:
  - `api.js` - API client functions
  - `dashboard.js` - Dashboard functionality
  - `analyses.js` - Analysis list and details
  - `ai-readiness.js` - AI Readiness workflow
  - `workflow.js` - Analysis workflow steps
  - `utils.js` - Utility functions
- Add build step for minification and bundling
- Consider using a module bundler (esbuild, Vite, etc.)

