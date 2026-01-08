# Multi-Tenant Schema: Entity-Relationship-Diagramm

## Visuelle Darstellung

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MULTI-TENANT SCHEMA                             │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  companies   │
├──────────────┤
│ id (PK)      │
│ name         │
│ website_url  │
│ country      │
│ language     │
│ region       │
│ is_active    │
│ created_at   │
│ updated_at   │
└──────┬───────┘
       │
       │ 1:N
       │
       ▼
┌──────────────┐
│  analyses    │
├──────────────┤
│ id (PK)      │
│ company_id   │──FK──► companies.id
│ is_latest    │  (UNIQUE: company_id WHERE is_latest=1)
│ snapshot_    │
│   timestamp  │
│ created_at   │
│ status       │
└──────┬───────┘
       │
       │ 1:N
       │
       ▼
┌──────────────────────┐
│  analysis_prompts    │
├──────────────────────┤
│ id (PK)              │
│ analysis_id          │──FK──► analyses.id
│ prompt_id            │──FK──► global_prompts.id
│ position             │
│ (UNIQUE: analysis_id,│
│          prompt_id)  │
└──────┬───────────────┘
       │
       │ N:1
       │
       ▼
┌──────────────────────┐
│  global_prompts      │
├──────────────────────┤
│ id (PK)              │
│ content_hash (UNIQUE)│  ◄─── Deduplizierung
│ question             │
│ language             │
│ country              │
│ region               │
│ intent               │
│ usage_count          │
│ created_at           │
└──────┬───────────────┘
       │
       │ 1:N
       │
       ▼
┌──────────────────────────────┐
│  global_ai_responses         │
├──────────────────────────────┤
│ id (PK)                      │
│ response_hash (UNIQUE)       │  ◄─── Deduplizierung
│ prompt_id                    │──FK──► global_prompts.id
│ web_context_hash             │
│ output_text                  │
│ model                        │
│ raw_response                 │
│ usage_count                  │
│ created_at                   │
└──────┬───────────────────────┘
       │
       │ 1:N
       │
       ▼
┌──────────────────────┐
│  web_contexts        │
├──────────────────────┤
│ id (PK)              │
│ web_context_hash     │
│ ai_response_id       │──FK──► global_ai_responses.id
│ url                  │
│ title                │
│ snippet              │
│ position             │
└──────────────────────┘

       │
       │ (Verknüpfung über analysis_prompt_responses)
       │
       ▼
┌──────────────────────────────┐
│  analysis_prompt_responses   │
├──────────────────────────────┤
│ id (PK)                      │
│ analysis_id                  │──FK──► analyses.id
│ prompt_id                    │──FK──► global_prompts.id
│ ai_response_id               │──FK──► global_ai_responses.id
│ (UNIQUE: analysis_id,        │
│          prompt_id,          │
│          ai_response_id)     │
└──────┬───────────────────────┘
       │
       │ 1:1
       │
       ▼
┌──────────────────────┐
│  prompt_metrics      │
├──────────────────────┤
│ id (PK)              │
│ analysis_id          │──FK──► analyses.id
│ prompt_id            │──FK──► global_prompts.id
│ citation_count       │
│ mention_count        │
│ external_link_count  │
│ brand_mentions_exact │
│ brand_mentions_fuzzy │
│ sentiment_tone       │
│ sentiment_confidence │
│ calculated_at        │
│ (UNIQUE: analysis_id,│
│          prompt_id)  │
└──────────────────────┘
```

## Datenfluss

### 1. Erstellung einer neuen Analyse

```
1. Firma existiert bereits (companies)
   ↓
2. Neue Analyse erstellen (analyses)
   - is_latest = 0 (wird später gesetzt)
   ↓
3. Für jeden Prompt:
   a) Prompt in global_prompts suchen/erstellen (via content_hash)
   b) KI-Antwort in global_ai_responses suchen/erstellen (via response_hash)
   c) Web-Kontext in web_contexts speichern
   d) Verknüpfung in analysis_prompts erstellen
   e) Verknüpfung in analysis_prompt_responses erstellen
   f) Metriken in prompt_metrics berechnen und speichern
   ↓
4. Alte latest-Analyse deaktivieren, neue aktivieren
```

### 2. Deduplizierung

```
PROMPT DEDUPLIZIERUNG:
- Neuer Prompt kommt an
- content_hash = SHA-256(question + language + country + region)
- Suche in global_prompts WHERE content_hash = ?
- Wenn gefunden: Verwende existierenden Prompt, inkrementiere usage_count
- Wenn nicht gefunden: Erstelle neuen Prompt

KI-ANTWORT DEDUPLIZIERUNG:
- Neue KI-Antwort kommt an
- web_context_hash = SHA-256(sortierte URLs)
- response_hash = SHA-256(prompt_id + web_context_hash)
- Suche in global_ai_responses WHERE response_hash = ?
- Wenn gefunden: Verwende existierende Antwort, inkrementiere usage_count
- Wenn nicht gefunden: Erstelle neue Antwort, speichere Web-Kontext
```

### 3. Zugriff auf Daten

```
FIRMEN-SPEZIFISCHE SICHT:
companies → analyses (WHERE is_latest = 1)
         → analysis_prompts
         → global_prompts
         → analysis_prompt_responses
         → global_ai_responses
         → web_contexts
         → prompt_metrics

GLOBALE SICHT:
global_prompts → global_ai_responses
              → web_contexts
              → prompt_metrics (aggregiert über alle Analysen)
```

## Wichtige Constraints

### Unique Constraints
- `global_prompts.content_hash` - Verhindert Duplikate von Prompts
- `global_ai_responses.response_hash` - Verhindert Duplikate von KI-Antworten
- `analyses(company_id) WHERE is_latest = 1` - Genau eine latest-Analyse pro Firma
- `analysis_prompts(analysis_id, prompt_id)` - Ein Prompt nur einmal pro Analyse
- `analysis_prompt_responses(analysis_id, prompt_id, ai_response_id)` - Eindeutige Verknüpfung
- `prompt_metrics(analysis_id, prompt_id)` - Genau eine Metrik-Set pro Prompt pro Analyse

### Foreign Key Constraints
- `ON DELETE CASCADE`: Wenn Analyse gelöscht wird, werden alle Verknüpfungen gelöscht
- `ON DELETE RESTRICT`: Prompts und KI-Antworten können nicht gelöscht werden, wenn sie verwendet werden

## Beispiel: Datenstruktur für eine Analyse

```
Company: "Acme Corp" (id: "comp_123")
  │
  └─ Analysis: "Analysis 2024-01-15" (id: "analysis_456", is_latest: true)
       │
       ├─ Prompt 1: "What is Acme Corp?" (global_prompt_id: "prompt_789")
       │    │
       │    ├─ AI Response: "Acme Corp is..." (global_ai_response_id: "resp_101")
       │    │    └─ Web Context: [url1, url2, url3]
       │    │
       │    └─ Metrics: citations=5, mentions=3, links=2
       │
       ├─ Prompt 2: "Where is Acme Corp located?" (global_prompt_id: "prompt_790")
       │    │
       │    ├─ AI Response: "Acme Corp is located..." (global_ai_response_id: "resp_102")
       │    │    └─ Web Context: [url4, url5]
       │    │
       │    └─ Metrics: citations=3, mentions=1, links=1
       │
       └─ Prompt 3: "What does Acme Corp do?" (global_prompt_id: "prompt_791")
            │
            ├─ AI Response: "Acme Corp provides..." (global_ai_response_id: "resp_103")
            │    └─ Web Context: [url6, url7, url8, url9]
            │
            └─ Metrics: citations=7, mentions=5, links=4
```

## Vorteile des Designs

1. **Kostenersparnis**: KI-Antworten werden nur einmal gespeichert, auch wenn sie in mehreren Analysen verwendet werden
2. **Speicherplatz**: Prompts werden dedupliziert, keine Redundanz
3. **Historische Integrität**: Analysen sind immutable, vollständige Historie verfügbar
4. **Performance**: Indizes auf allen wichtigen Pfaden
5. **Flexibilität**: Wechsel zwischen Analysen durch Änderung von `is_latest`
6. **Globale Auswertungen**: Prompts und KI-Antworten können über alle Firmen hinweg analysiert werden
7. **Multi-Tenant-Sicherheit**: Firmen-spezifische Daten sind klar getrennt
