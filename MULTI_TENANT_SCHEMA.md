# Multi-Tenant GEO-Analyse-Tool: Datenbank-Schema

## Übersicht

Dieses Dokument beschreibt das relationale Datenbank-Schema für das Multi-Tenant GEO-Analyse-Tool. Das Schema ist darauf ausgelegt, KI-Antworten global zu deduplizieren, Analysen als immutable Snapshots zu speichern und gleichzeitig firmen-spezifische und globale Sichten zu ermöglichen.

## Schema-Struktur

### Kern-Tabellen

1. **companies** - Multi-Tenant Firmen
2. **global_prompts** - Globale, deduplizierte Prompts
3. **global_ai_responses** - Globale, deduplizierte KI-Antworten
4. **web_contexts** - Web-Kontext (Citations) für KI-Antworten
5. **analyses** - Immutable Analysen-Snapshots pro Firma
6. **analysis_prompts** - Verknüpfung Analysen ↔ Prompts
7. **analysis_prompt_responses** - Verknüpfung Prompt ↔ KI-Antwort innerhalb einer Analyse
8. **prompt_metrics** - Metriken pro Prompt innerhalb einer Analyse

## Design-Entscheidungen

### 1. Globale Deduplizierung von Prompts

**Entscheidung:** Prompts werden über einen `content_hash` global dedupliziert gespeichert.

**Begründung:**
- Identische Prompts werden nur einmal gespeichert (Speicherplatz-Ersparnis)
- Ermöglicht globale Auswertungen über alle Firmen hinweg
- `usage_count` ermöglicht Performance-Optimierungen (häufig verwendete Prompts können gecacht werden)
- Prompts sind unabhängig von Firmen und können wiederverwendet werden

**Implementierung:**
- `content_hash` = SHA-256(question + language + country + region)
- Unique Constraint auf `content_hash`
- `usage_count` wird bei jeder Verwendung inkrementiert

### 2. Globale Deduplizierung von KI-Antworten

**Entscheidung:** KI-Antworten werden über einen `response_hash` (Prompt + Web-Kontext) global dedupliziert.

**Begründung:**
- KI-Antworten sind teuer (API-Kosten)
- Identische Prompt+Web-Kontext-Kombinationen erzeugen identische Antworten
- Deduplizierung spart erhebliche Kosten
- Ermöglicht globale Auswertungen der besten Prompts

**Implementierung:**
- `web_context_hash` = SHA-256(sortierte URLs aller Citations)
- `response_hash` = SHA-256(prompt_id + web_context_hash)
- Unique Constraint auf `response_hash`
- `usage_count` für Performance-Tracking

### 3. Immutable Analysen (Snapshots)

**Entscheidung:** Analysen werden niemals überschrieben, nur neue Snapshots werden erstellt.

**Begründung:**
- Historische Datenintegrität: Alte Analysen bleiben unverändert
- Zeitreihen-Analysen: Vergleich von Analysen über Zeit möglich
- Audit-Trail: Vollständige Historie aller Analysen
- Rollback-Fähigkeit: Alte Analysen können wieder aktiviert werden

**Implementierung:**
- Nur INSERT-Operationen, keine UPDATEs
- `snapshot_timestamp` speichert den Zeitpunkt der Analyse
- `is_latest` markiert die neueste Analyse (nur eine pro Firma)

### 4. Latest-Markierung pro Firma

**Entscheidung:** Pro Firma ist genau eine Analyse als `is_latest = 1` markiert.

**Begründung:**
- Schneller Zugriff auf aktuelle Analyse pro Firma
- Klare Semantik: "Was ist die neueste Analyse?"
- Wechsel zwischen Analysen durch Änderung der `is_latest`-Markierung

**Implementierung:**
- Unique Index auf `(company_id) WHERE is_latest = 1`
- Application Logic muss sicherstellen, dass beim Setzen einer neuen `latest` die alte auf `0` gesetzt wird
- Constraint verhindert mehrere `latest`-Analysen pro Firma

### 5. Separation of Concerns

**Entscheidung:** Prompts und KI-Antworten sind global, Analysen und Metriken sind firmen-spezifisch.

**Begründung:**
- **Prompts global:** Wiederverwendbarkeit, globale Auswertungen
- **KI-Antworten global:** Kostenersparnis durch Deduplizierung
- **Analysen firmen-spezifisch:** Multi-Tenant-Isolation, Datenschutz
- **Metriken analyse-spezifisch:** Metriken können sich über Zeit ändern

### 6. Web-Kontext Separation

**Entscheidung:** Web-Kontext (Citations) wird in separater Tabelle gespeichert.

**Begründung:**
- Flexibilität: Verschiedene KI-Antworten können ähnliche Web-Kontexte haben
- Performance: Effiziente Suche nach ähnlichen Web-Kontexten
- Wiederverwendbarkeit: Web-Kontexte können zwischen Antworten geteilt werden
- Normalisierung: Vermeidet Redundanz

### 7. Metriken pro Prompt pro Analyse

**Entscheidung:** Metriken sind nicht global, sondern spezifisch für jeden Prompt innerhalb einer Analyse.

**Begründung:**
- Metriken können sich über Zeit ändern (z.B. mehr Zitate bei späterer Analyse)
- Analyse-spezifische Werte: Verschiedene Analysen können unterschiedliche Metriken für denselben Prompt haben
- Historische Vergleichbarkeit: Metriken können zwischen Analysen verglichen werden

## Primär- und Fremdschlüssel

### Primärschlüssel
- Alle Tabellen verwenden `id TEXT PRIMARY KEY`
- UUIDs oder ähnliche eindeutige Identifikatoren

### Fremdschlüssel
- `global_ai_responses.prompt_id` → `global_prompts.id` (ON DELETE RESTRICT)
- `web_contexts.ai_response_id` → `global_ai_responses.id` (ON DELETE CASCADE)
- `analyses.company_id` → `companies.id` (ON DELETE CASCADE)
- `analysis_prompts.analysis_id` → `analyses.id` (ON DELETE CASCADE)
- `analysis_prompts.prompt_id` → `global_prompts.id` (ON DELETE RESTRICT)
- `analysis_prompt_responses.analysis_id` → `analyses.id` (ON DELETE CASCADE)
- `analysis_prompt_responses.prompt_id` → `global_prompts.id` (ON DELETE RESTRICT)
- `analysis_prompt_responses.ai_response_id` → `global_ai_responses.id` (ON DELETE RESTRICT)
- `prompt_metrics.analysis_id` → `analyses.id` (ON DELETE CASCADE)
- `prompt_metrics.prompt_id` → `global_prompts.id` (ON DELETE RESTRICT)

### Unique Constraints
- `global_prompts.content_hash` UNIQUE
- `global_ai_responses.response_hash` UNIQUE
- `analyses(company_id) WHERE is_latest = 1` UNIQUE (via Index)
- `analysis_prompts(analysis_id, prompt_id)` UNIQUE
- `analysis_prompt_responses(analysis_id, prompt_id, ai_response_id)` UNIQUE
- `prompt_metrics(analysis_id, prompt_id)` UNIQUE

## Beispiel-Queries

### 1. Neueste Analyse einer Firma abrufen

```sql
-- Neueste Analyse einer Firma (via is_latest)
SELECT 
  a.id,
  a.company_id,
  a.snapshot_timestamp,
  a.created_at,
  c.name AS company_name
FROM analyses a
JOIN companies c ON a.company_id = c.id
WHERE a.company_id = ? 
  AND a.is_latest = 1;
```

**Alternative:** Neueste Analyse nach Timestamp (falls `is_latest` nicht gesetzt ist)

```sql
SELECT 
  a.id,
  a.company_id,
  a.snapshot_timestamp,
  a.created_at
FROM analyses a
WHERE a.company_id = ?
ORDER BY a.snapshot_timestamp DESC
LIMIT 1;
```

### 2. Alle Prompts einer Analyse abrufen

```sql
SELECT 
  gp.id,
  gp.question,
  gp.language,
  gp.country,
  gp.region,
  ap.position
FROM analysis_prompts ap
JOIN global_prompts gp ON ap.prompt_id = gp.id
WHERE ap.analysis_id = ?
ORDER BY ap.position;
```

### 3. KI-Antworten einer Analyse abrufen

```sql
SELECT 
  gp.question,
  gar.output_text,
  gar.model,
  gar.created_at,
  wc.url AS citation_url,
  wc.title AS citation_title
FROM analysis_prompt_responses apr
JOIN global_prompts gp ON apr.prompt_id = gp.id
JOIN global_ai_responses gar ON apr.ai_response_id = gar.id
LEFT JOIN web_contexts wc ON gar.id = wc.ai_response_id
WHERE apr.analysis_id = ?
ORDER BY gp.question, wc.position;
```

### 4. Metriken einer Analyse abrufen

```sql
SELECT 
  gp.question,
  pm.citation_count,
  pm.mention_count,
  pm.external_link_count,
  pm.brand_mentions_exact,
  pm.brand_mentions_fuzzy,
  pm.sentiment_tone,
  pm.sentiment_confidence
FROM prompt_metrics pm
JOIN global_prompts gp ON pm.prompt_id = gp.id
WHERE pm.analysis_id = ?
ORDER BY pm.citation_count DESC;
```

### 5. Wechsel zwischen Analysen (neue latest setzen)

```sql
-- Transaction: Alte latest auf 0 setzen, neue auf 1 setzen
BEGIN TRANSACTION;

-- Alte latest-Analyse deaktivieren
UPDATE analyses 
SET is_latest = 0 
WHERE company_id = ? AND is_latest = 1;

-- Neue latest-Analyse aktivieren
UPDATE analyses 
SET is_latest = 1 
WHERE id = ? AND company_id = ?;

COMMIT;
```

**Wichtig:** Diese Operation muss atomar sein (Transaction). Der Unique Index verhindert, dass mehrere Analysen gleichzeitig `is_latest = 1` haben.

### 6. Alle Analysen einer Firma (Historie)

```sql
SELECT 
  a.id,
  a.snapshot_timestamp,
  a.is_latest,
  a.created_at,
  COUNT(DISTINCT ap.prompt_id) AS prompt_count,
  COUNT(DISTINCT apr.ai_response_id) AS response_count
FROM analyses a
LEFT JOIN analysis_prompts ap ON a.id = ap.analysis_id
LEFT JOIN analysis_prompt_responses apr ON a.id = apr.analysis_id
WHERE a.company_id = ?
GROUP BY a.id
ORDER BY a.snapshot_timestamp DESC;
```

### 7. Globale Auswertung: Beste Prompts (nach Citation Count)

```sql
-- Globale Auswertung: Prompts mit höchster durchschnittlicher Citation Count
SELECT 
  gp.id,
  gp.question,
  gp.language,
  COUNT(DISTINCT pm.analysis_id) AS usage_count,
  AVG(pm.citation_count) AS avg_citations,
  MAX(pm.citation_count) AS max_citations,
  SUM(pm.citation_count) AS total_citations
FROM global_prompts gp
JOIN prompt_metrics pm ON gp.id = pm.prompt_id
GROUP BY gp.id, gp.question, gp.language
HAVING COUNT(DISTINCT pm.analysis_id) >= 3  -- Mindestens 3 Verwendungen
ORDER BY avg_citations DESC
LIMIT 20;
```

### 8. Globale Auswertung: Prompts über alle Firmen

```sql
-- Alle Prompts, die von mindestens einer Firma verwendet werden
SELECT 
  gp.id,
  gp.question,
  gp.language,
  gp.usage_count AS global_usage_count,
  COUNT(DISTINCT a.company_id) AS company_count,
  COUNT(DISTINCT a.id) AS analysis_count
FROM global_prompts gp
JOIN analysis_prompts ap ON gp.id = ap.prompt_id
JOIN analyses a ON ap.analysis_id = a.id
GROUP BY gp.id, gp.question, gp.language
ORDER BY company_count DESC, analysis_count DESC;
```

### 9. Vergleich zwischen zwei Analysen

```sql
-- Vergleich der Metriken zwischen zwei Analysen
SELECT 
  gp.question,
  pm1.citation_count AS citations_analysis1,
  pm2.citation_count AS citations_analysis2,
  (pm2.citation_count - pm1.citation_count) AS citation_delta,
  pm1.mention_count AS mentions_analysis1,
  pm2.mention_count AS mentions_analysis2,
  (pm2.mention_count - pm1.mention_count) AS mention_delta
FROM global_prompts gp
JOIN prompt_metrics pm1 ON gp.id = pm1.prompt_id AND pm1.analysis_id = ?
JOIN prompt_metrics pm2 ON gp.id = pm2.prompt_id AND pm2.analysis_id = ?
ORDER BY ABS(pm2.citation_count - pm1.citation_count) DESC;
```

### 10. Wiederverwendete KI-Antworten finden

```sql
-- KI-Antworten, die in mehreren Analysen verwendet werden (Kostenersparnis)
SELECT 
  gar.id,
  gar.response_hash,
  gar.usage_count,
  COUNT(DISTINCT apr.analysis_id) AS analysis_count,
  COUNT(DISTINCT a.company_id) AS company_count,
  gp.question
FROM global_ai_responses gar
JOIN analysis_prompt_responses apr ON gar.id = apr.ai_response_id
JOIN analyses a ON apr.analysis_id = a.id
JOIN global_prompts gp ON gar.prompt_id = gp.id
GROUP BY gar.id, gar.response_hash, gar.usage_count, gp.question
HAVING COUNT(DISTINCT apr.analysis_id) > 1
ORDER BY analysis_count DESC;
```

### 11. Web-Kontext einer KI-Antwort abrufen

```sql
SELECT 
  wc.url,
  wc.title,
  wc.snippet,
  wc.position
FROM web_contexts wc
WHERE wc.ai_response_id = ?
ORDER BY wc.position;
```

### 12. Ähnliche Web-Kontexte finden (für Deduplizierung)

```sql
-- Finde KI-Antworten mit ähnlichem Web-Kontext
SELECT 
  gar1.id AS response1_id,
  gar2.id AS response2_id,
  gar1.web_context_hash,
  COUNT(DISTINCT wc1.url) AS shared_urls
FROM global_ai_responses gar1
JOIN global_ai_responses gar2 ON gar1.web_context_hash = gar2.web_context_hash
JOIN web_contexts wc1 ON gar1.id = wc1.ai_response_id
JOIN web_contexts wc2 ON gar2.id = wc2.ai_response_id AND wc1.url = wc2.url
WHERE gar1.id != gar2.id
GROUP BY gar1.id, gar2.id, gar1.web_context_hash
HAVING COUNT(DISTINCT wc1.url) >= 3;  -- Mindestens 3 gemeinsame URLs
```

## Offene Design-Fragen

### 1. Hash-Algorithmus
**Frage:** Welcher Hash-Algorithmus soll für `content_hash` und `response_hash` verwendet werden?
**Vorschlag:** SHA-256 (kollisionsresistent, Standard)
**Offen:** Sollte in Application Logic definiert werden

### 2. Web-Kontext-Hash
**Frage:** Wie genau soll der `web_context_hash` berechnet werden?
**Vorschlag:** SHA-256(sortierte URLs aller Citations, getrennt durch `|`)
**Offen:** Sollte Position/Reihenfolge berücksichtigt werden?

### 3. Latest-Update-Strategie
**Frage:** Wie soll sichergestellt werden, dass beim Setzen einer neuen `latest` die alte auf `0` gesetzt wird?
**Vorschlag:** 
- Option A: Application Logic (Transaction mit zwei UPDATEs)
- Option B: Trigger (automatisch)
**Offen:** Sollte als Trigger implementiert werden?

### 4. Metriken-Berechnung
**Frage:** Wie werden `external_link_count` und `mention_count` berechnet?
**Vorschlag:** Aus den Citations und der KI-Antwort extrahiert
**Offen:** Sollte in Application Logic definiert werden

### 5. Soft Deletes
**Frage:** Sollen gelöschte Firmen/Analysen soft-deleted werden?
**Vorschlag:** `is_active` Flag bereits vorhanden für Companies
**Offen:** Sollte auch für Analyses implementiert werden?

### 6. Partitionierung
**Frage:** Sollte das Schema für große Datenmengen partitioniert werden?
**Vorschlag:** Bei Bedarf nach `snapshot_timestamp` oder `company_id`
**Offen:** Abhängig von Datenvolumen

## Migration von bestehendem Schema

Das neue Schema ist in `migrations/0005_multi_tenant_schema.sql` definiert. Eine Migrations-Strategie sollte:

1. Bestehende Daten aus `analysis_runs`, `prompts`, `llm_responses` extrahieren
2. Prompts in `global_prompts` migrieren (Deduplizierung)
3. KI-Antworten in `global_ai_responses` migrieren (Deduplizierung)
4. Analysen in `analyses` migrieren (eine pro `analysis_run`)
5. Verknüpfungen in `analysis_prompts` und `analysis_prompt_responses` erstellen
6. Metriken aus `prompt_analyses` in `prompt_metrics` migrieren

## Performance-Überlegungen

### Indizes
- Alle Foreign Keys sind indiziert
- Häufige Query-Pfade sind indiziert (z.B. `company_id`, `is_latest`)
- Composite Indizes für häufige JOIN-Operationen

### Optimierungen
- `usage_count` in `global_prompts` und `global_ai_responses` für Caching-Strategien
- Unique Constraints verhindern Duplikate auf DB-Ebene
- CASCADE/RESTRICT Constraints für Datenintegrität

### Skalierung
- Schema ist horizontal skalierbar (keine komplexen Transaktionen zwischen Tabellen)
- Partitionierung nach `company_id` oder `snapshot_timestamp` möglich
- Read-Replicas für analytische Queries möglich
