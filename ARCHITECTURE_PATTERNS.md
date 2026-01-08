# Architecture Patterns - Clean Architecture

Dieses Dokument beschreibt die implementierten Architekturmuster und die klare Trennung der Schichten.

## Architektur-Übersicht

Das Projekt folgt einer **Clean Architecture** mit klarer Trennung der Concerns:

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│  (API Handlers, UI Components, Pages)                   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                Application Layer                         │
│  (Use Cases - Orchestriert Domain Services)             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                Domain Layer                              │
│  (Business Logic, Domain Services, Domain Models)        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                Data Layer                                │
│  (Repositories - Datenzugriff, keine Business Logic)     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                Infrastructure Layer                     │
│  (Database, External APIs, File System)                   │
└─────────────────────────────────────────────────────────┘
```

## Schichten-Details

### 1. Data Layer (`/src/data/repositories/`)

**Verantwortlichkeit**: Datenzugriff, keine Business Logic

**Pattern**: Repository Pattern

**Beispiele**:
- `AnalysisRepository` - CRUD für Analysis-Entitäten
- `CategoryRepository` - CRUD für Category-Entitäten
- `PromptRepository` - CRUD für Prompt-Entitäten
- `CompanyRepository` - CRUD für Company-Entitäten

**Prinzipien**:
- ✅ Nur Datenzugriff, keine Business Rules
- ✅ Abstrahiert Datenbank-Details
- ✅ Einfach testbar (Mockable)
- ✅ Keine Abhängigkeiten zu Domain-Logic

**Beispiel**:
```typescript
export class AnalysisRepository {
  async findById(runId: string): Promise<AnalysisRunEntity | null> {
    // Nur Datenzugriff, keine Business Logic
    return await this.db.prepare("SELECT * FROM analysis_runs WHERE id = ?")
      .bind(runId)
      .first();
  }
}
```

### 2. Domain Layer (`/src/domain/services/`)

**Verantwortlichkeit**: Business Logic, Domain Rules

**Pattern**: Domain Service Pattern

**Beispiele**:
- `AnalysisDomainService` - Analysis-Business-Logic
- `CompanyDomainService` - Company-Business-Logic

**Prinzipien**:
- ✅ Enthält Business Rules und Validierungen
- ✅ Nutzt Repositories für Datenzugriff
- ✅ Unabhängig von Presentation Layer
- ✅ Domain-spezifische Logik

**Beispiel**:
```typescript
export class AnalysisDomainService {
  async startAnalysis(userInput: UserInput): Promise<string> {
    // Business Rule: Generate unique run ID
    const runId = this.generateRunId();
    
    // Business Rule: Validate input
    this.validateUserInput(userInput);
    
    // Use repository for data access
    await this.analysisRepo.create(runId, userInput, "running");
    
    return runId;
  }
}
```

### 3. Application Layer (`/src/application/use-cases/`)

**Verantwortlichkeit**: Orchestriert Domain Services für Use Cases

**Pattern**: Use Case Pattern

**Beispiele**:
- `AnalysisUseCases` - Orchestriert Analysis-Workflow
- `CompanyUseCases` - Orchestriert Company-Operationen

**Prinzipien**:
- ✅ Koordiniert mehrere Domain Services
- ✅ Implementiert Use Cases (User Stories)
- ✅ Keine Business Logic (delegiert an Domain Layer)
- ✅ Transaction-Management

**Beispiel**:
```typescript
export class AnalysisUseCases {
  async runCompleteAnalysis(userInput: UserInput): Promise<string> {
    // Orchestrate multiple domain services
    const runId = await this.domainService.startAnalysis(userInput);
    const categories = await this.domainService.generateCategories(runId, content);
    const prompts = await this.domainService.generatePrompts(runId, categories, userInput);
    // ...
    return runId;
  }
}
```

### 4. Presentation Layer

#### Backend (`/src/api/handlers/`)

**Verantwortlichkeit**: HTTP-Request/Response-Handling

**Pattern**: Handler Pattern

**Prinzipien**:
- ✅ Nur HTTP-Concerns (Request/Response, Status Codes)
- ✅ Delegiert an Application Layer
- ✅ Input-Validierung und Transformation
- ✅ Keine Business Logic

**Beispiel**:
```typescript
export class AnalysisHandler {
  async handleAnalyze(request: Request): Promise<Response> {
    const body = await request.json();
    const runId = await this.useCases.runCompleteAnalysis(body);
    return new Response(JSON.stringify({ runId }), { status: 202 });
  }
}
```

#### Frontend (`/web/scripts/`)

**Verantwortlichkeit**: UI-Logik, User Interaction

**Struktur**:
- `services/` - API-Client, Service-Layer
- `components/` - Wiederverwendbare UI-Komponenten
- `pages/` - Page-spezifische Logik
- `utils/` - Utility-Funktionen

**Prinzipien**:
- ✅ Trennung von UI und Business Logic
- ✅ Services für API-Kommunikation
- ✅ Komponenten für wiederverwendbare UI
- ✅ Pages für Page-spezifische Logik

## Dependency Flow

Die Abhängigkeiten fließen nur in eine Richtung:

```
Presentation → Application → Domain → Data → Infrastructure
```

**Regel**: Innere Schichten kennen keine äußeren Schichten.

- ✅ Domain Layer kennt keine API-Handler
- ✅ Data Layer kennt keine Business Logic
- ✅ Application Layer kennt keine HTTP-Details

## Vorteile dieser Architektur

### 1. **Testbarkeit**
- Jede Schicht kann isoliert getestet werden
- Repositories können gemockt werden
- Domain Services können ohne Datenbank getestet werden

### 2. **Wartbarkeit**
- Änderungen sind lokalisiert
- Klare Verantwortlichkeiten
- Einfach zu verstehen

### 3. **Skalierbarkeit**
- Neue Features können einfach hinzugefügt werden
- Schichten können unabhängig erweitert werden
- Keine Kopplung zwischen Schichten

### 4. **Flexibilität**
- Datenbank kann ausgetauscht werden (Repository Pattern)
- API kann geändert werden ohne Business Logic zu ändern
- Business Rules können geändert werden ohne API zu ändern

## Implementierungs-Status

### ✅ Implementiert

1. **Data Layer**
   - ✅ AnalysisRepository
   - ✅ CategoryRepository
   - ✅ PromptRepository
   - ✅ CompanyRepository

2. **Domain Layer**
   - ✅ AnalysisDomainService
   - ✅ CompanyDomainService

3. **Application Layer**
   - ✅ AnalysisUseCases
   - ✅ CompanyUseCases

4. **Presentation Layer (Backend)**
   - ✅ Handler-Struktur
   - ✅ Router-System

5. **Presentation Layer (Frontend)**
   - ✅ Service-Layer
   - ✅ Component-Struktur
   - ✅ Page-Struktur

### ⚠️ In Arbeit

1. **Migration**
   - ⚠️ Alte `routes.ts` muss noch migriert werden
   - ⚠️ Alte Services müssen auf neue Struktur umgestellt werden
   - ⚠️ Frontend muss vollständig migriert werden

2. **Erweiterungen**
   - ⚠️ LLMResponseRepository fehlt noch
   - ⚠️ Weitere Repositories für alle Entitäten
   - ⚠️ Vollständige Use Cases für alle Features

## Nächste Schritte

1. **Vervollständigung der Repositories**
   - LLMResponseRepository
   - PromptAnalysisRepository
   - CategoryMetricsRepository

2. **Migration der bestehenden Services**
   - Alte Services auf neue Struktur umstellen
   - Schrittweise Migration für Stabilität

3. **Testing**
   - Unit Tests für Domain Services
   - Integration Tests für Use Cases
   - Repository Tests mit Mock-Datenbank

4. **Dokumentation**
   - API-Dokumentation
   - Domain-Model-Dokumentation
   - Use Case-Dokumentation

## Beispiel: Vollständiger Flow

### Use Case: "Start Analysis"

```
1. User sendet POST /api/analyze
   ↓
2. AnalysisHandler.handleAnalyze()
   - Validiert HTTP-Request
   - Transformiert zu Domain-Modell
   ↓
3. AnalysisUseCases.runCompleteAnalysis()
   - Orchestriert Domain Services
   ↓
4. AnalysisDomainService.startAnalysis()
   - Business Rule: Generate Run ID
   - Business Rule: Validate Input
   ↓
5. AnalysisRepository.create()
   - Datenbank-Zugriff
   ↓
6. Response zurück an User
```

Jede Schicht hat eine klare Verantwortlichkeit und ist unabhängig testbar.

