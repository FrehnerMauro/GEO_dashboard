# Frontend Structure - Separation of Concerns

Das Frontend wurde in einen separaten `web/` Ordner verschoben und nach Separation of Concerns organisiert.

## Struktur

```
web/
├── index.html              # Haupt-HTML-Datei
├── styles/                 # CSS-Dateien (aufgeteilt nach Verantwortlichkeit)
│   ├── variables.css      # CSS-Variablen (Design-Tokens)
│   ├── base.css           # Basis-Styles (Layout, Komponenten)
│   ├── ai-readiness.css  # AI Readiness spezifische Styles
│   └── responsive.css     # Responsive Design (Media Queries)
├── scripts/               # JavaScript-Module
│   ├── global.js         # Globale Funktionen (vor DOMContentLoaded)
│   └── main.js           # Haupt-Anwendungslogik (nach DOMContentLoaded)
└── assets/               # Statische Assets
```

## Separation of Concerns

### HTML (index.html)
- **Verantwortlichkeit**: Struktur und semantisches Markup
- **Keine**: Inline-Styles oder Scripts
- **Enthält**: Links zu externen CSS- und JS-Dateien

### CSS (styles/)
- **variables.css**: Design-Tokens (Farben, Abstände, Typografie)
- **base.css**: Core-Layout, Komponenten, Utilities
- **ai-readiness.css**: Feature-spezifische Styles
- **responsive.css**: Media Queries für verschiedene Bildschirmgrößen

### JavaScript (scripts/)
- **global.js**: Funktionen, die sofort verfügbar sein müssen
  - Navigation
  - Sidebar-Toggle
  - Globale Event-Handler
- **main.js**: Haupt-Anwendungslogik
  - Dashboard-Funktionalität
  - Analyse-Workflow
  - API-Interaktionen
  - DOM-Manipulation

## Cloudflare Pages Setup

### 1. Repository verbinden
- GitHub Repository mit Cloudflare Pages verbinden
- Build-Einstellungen konfigurieren

### 2. Build-Konfiguration
```yaml
# _pages.yml (bereits erstellt)
name: geo-platform-frontend
production_branch: main
build_command: echo "No build step needed - static files"
build_output_dir: web
root_dir: .
```

### 3. Deployment
- Frontend wird von Cloudflare Pages aus `web/` Verzeichnis serviert
- API wird von Cloudflare Workers serviert
- `_redirects` Datei leitet API-Calls an Workers weiter

## Dateigrößen

- **HTML**: < 50KB
- **CSS**: < 100KB pro Datei
- **JavaScript**: < 200KB pro Datei

## Nächste Schritte

Die JavaScript-Dateien können weiter aufgeteilt werden in:
- `api.js` - API-Client-Funktionen
- `dashboard.js` - Dashboard-Funktionalität
- `analyses.js` - Analyse-Liste und Details
- `ai-readiness.js` - AI Readiness Workflow
- `workflow.js` - Analyse-Workflow-Schritte
- `utils.js` - Utility-Funktionen

## Migration

Die alte `landing-page.ts` Datei (4913 Zeilen) wurde aufgeteilt in:
- ✅ HTML → `web/index.html`
- ✅ CSS → `web/styles/*.css` (4 Dateien)
- ✅ JavaScript → `web/scripts/*.js` (2 Dateien, kann weiter aufgeteilt werden)

Die alte Datei bleibt für Backward-Compatibility erhalten, sollte aber langfristig entfernt werden.

