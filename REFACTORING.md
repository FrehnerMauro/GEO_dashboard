# Refactoring: Separation of Concerns

Dieses Dokument beschreibt die neue, nach Separation of Concerns organisierte Projektstruktur.

## Übersicht

Das Projekt wurde refactored, um eine klare Trennung der Concerns zu erreichen:

1. **Backend**: Routing, Middleware, Services, Handlers
2. **Frontend**: Components, Services, Pages, Utils

## Backend-Struktur

### `/src/api/`
**Verantwortlichkeit**: HTTP-Layer, Request/Response-Handling

- **`middleware/`**: CORS, Error Handling
  - `cors.ts` - CORS-Header und Preflight-Handling
  - `error-handler.ts` - Zentrale Fehlerbehandlung
  - `index.ts` - Exports

- **`routes/`**: Route-Definitionen
  - `route-definitions.ts` - Zentrale Route-Konfiguration

- **`handlers/`**: HTTP-Handler (dünne Schicht)
  - `analysis.ts` - Analysis-Endpoints
  - `workflow.ts` - Workflow-Endpoints
  - `company-handler.ts` - Company-Endpoints
  - `schedule-handler.ts` - Schedule-Endpoints

- **`router.ts`**: Router-Klasse für Request-Routing

- **`types.ts`**: API-Typen und Interfaces

### `/src/services/`
**Verantwortlichkeit**: Business Logic

- `analysis-service.ts` - Analysis-Business-Logic
- `company-service.ts` - Company-Business-Logic
- `schedule-service.ts` - Schedule-Business-Logic
- `index.ts` - Exports

### `/src/persistence/`
**Verantwortlichkeit**: Datenbankzugriff (unverändert)

### `/src/analysis/`, `/src/ingestion/`, etc.
**Verantwortlichkeit**: Domain-Logic (unverändert)

## Frontend-Struktur

### `/web/scripts/core/`
**Verantwortlichkeit**: Kern-Funktionalität

- `api-client.ts` - Zentrale API-Client-Klasse

### `/web/scripts/services/`
**Verantwortlichkeit**: Business Logic Services

- `analysis-service.ts` - Analysis-API-Calls
- `workflow-service.ts` - Workflow-API-Calls
- `ai-readiness-service.ts` - AI Readiness-API-Calls
- `index.ts` - Exports

### `/web/scripts/components/`
**Verantwortlichkeit**: Wiederverwendbare UI-Komponenten

- `navigation.ts` - Navigation-Komponente

### `/web/scripts/pages/`
**Verantwortlichkeit**: Page-spezifische Logik

- `dashboard-page.ts` - Dashboard-Seite

### `/web/scripts/utils/`
**Verantwortlichkeit**: Utility-Funktionen

- `url-utils.ts` - URL-Normalisierung und Validierung
- `dom-utils.ts` - DOM-Hilfsfunktionen
- `index.ts` - Exports

## Migrations-Plan

### Phase 1: Backend (Teilweise implementiert)
- ✅ Middleware erstellt
- ✅ Services erstellt
- ✅ Route-Definitionen erstellt
- ✅ Router erstellt
- ⚠️ Alte `routes.ts` muss noch migriert werden (für AI Readiness, Chat, etc.)

### Phase 2: Frontend (Teilweise implementiert)
- ✅ API Client erstellt
- ✅ Services erstellt
- ✅ Utils erstellt
- ✅ Navigation Component erstellt
- ✅ Dashboard Page erstellt
- ⚠️ Alte `main.js` und `global.js` müssen noch migriert werden

### Phase 3: Vollständige Migration
- Migriere alle Handler aus `routes.ts` zu separaten Handler-Dateien
- Migriere alle Frontend-Funktionen aus `main.js` zu Pages/Components
- Entferne alte Dateien nach erfolgreicher Migration

## Vorteile der neuen Struktur

1. **Klarere Verantwortlichkeiten**: Jede Datei hat eine einzige, klare Verantwortlichkeit
2. **Bessere Testbarkeit**: Services können isoliert getestet werden
3. **Einfachere Wartung**: Änderungen sind lokalisiert
4. **Skalierbarkeit**: Neue Features können einfach hinzugefügt werden
5. **Wiederverwendbarkeit**: Services und Utils können überall verwendet werden

## Nächste Schritte

1. Migriere verbleibende Handler aus `routes.ts`
2. Migriere Frontend-Logik aus `main.js` und `global.js`
3. Erstelle weitere Page-Komponenten (Analyses, AI Readiness)
4. Implementiere State Management (falls nötig)
5. Entferne alte Dateien nach erfolgreicher Migration

## Verwendung

### Backend: Neuer Router verwenden

```typescript
// In src/index.ts
import { Router } from "./api/router.js";
import { GEOEngine } from "./engine.js";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const engine = new GEOEngine(env);
    const router = new Router(engine, env);
    return await router.route(request, ctx);
  },
};
```

### Frontend: Services verwenden

```typescript
import { analysisService } from "./services/analysis-service.js";

// Analysis starten
const result = await analysisService.startAnalysis({
  websiteUrl: "https://example.com",
  country: "CH",
  language: "de",
});
```

## Hinweise

- Die alte `routes.ts` bleibt vorerst bestehen für nicht-migrierte Endpoints
- Die alten Frontend-Dateien (`main.js`, `global.js`) bleiben vorerst bestehen
- Migration erfolgt schrittweise, um Stabilität zu gewährleisten

