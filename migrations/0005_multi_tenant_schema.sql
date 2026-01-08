-- ============================================================================
-- Multi-Tenant GEO-Analyse-Tool: Relationales Datenbank-Schema
-- ============================================================================
-- 
-- Design-Prinzipien:
-- 1. KI-Antworten sind teuer und werden global dedupliziert gespeichert
-- 2. Firmen besitzen keine KI-Antworten, sondern referenzieren sie über Analysen
-- 3. Analysen sind zeitliche Snapshots und dürfen niemals überschrieben werden
-- 4. Prompts sind global wiederverwendbar (Deduplizierung)
-- 5. Pro Firma ist genau eine Analyse als "latest" markiert
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FIRMEN (Multi-Tenant)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  country TEXT NOT NULL,
  language TEXT NOT NULL,
  region TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_companies_website ON companies(website_url);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- ----------------------------------------------------------------------------
-- 2. GLOBALE PROMPTS (Dedupliziert, wiederverwendbar)
-- ----------------------------------------------------------------------------
-- Prompts werden global gespeichert und über einen Content-Hash dedupliziert
-- Ein identischer Prompt-Text wird nur einmal gespeichert, unabhängig von Firma/Analyse
CREATE TABLE IF NOT EXISTS global_prompts (
  id TEXT PRIMARY KEY,
  -- Content-Hash für Deduplizierung (SHA-256 des question + language + country + region)
  content_hash TEXT NOT NULL UNIQUE,
  question TEXT NOT NULL,
  language TEXT NOT NULL,
  country TEXT,
  region TEXT,
  intent TEXT,
  category_name TEXT,
  created_at TEXT NOT NULL,
  -- Zähler für globale Nutzung (Performance-Optimierung)
  usage_count INTEGER DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_global_prompts_hash ON global_prompts(content_hash);
CREATE INDEX IF NOT EXISTS idx_global_prompts_question ON global_prompts(question);
CREATE INDEX IF NOT EXISTS idx_global_prompts_language ON global_prompts(language);

-- ----------------------------------------------------------------------------
-- 3. GLOBALE KI-ANTWORTEN (Dedupliziert, mit Web-Kontext)
-- ----------------------------------------------------------------------------
-- KI-Antworten werden global dedupliziert gespeichert
-- Ein identischer Prompt + identischer Web-Kontext = identische Antwort
-- Web-Kontext wird als Hash der Citations-URLs gespeichert
CREATE TABLE IF NOT EXISTS global_ai_responses (
  id TEXT PRIMARY KEY,
  -- Kombinierter Hash: prompt_id + web_context_hash für Deduplizierung
  response_hash TEXT NOT NULL UNIQUE,
  prompt_id TEXT NOT NULL,
  -- Hash des Web-Kontexts (alle Citation-URLs sortiert und gehasht)
  web_context_hash TEXT NOT NULL,
  output_text TEXT NOT NULL,
  model TEXT NOT NULL,
  -- Rohantwort (vollständiger Text)
  raw_response TEXT NOT NULL,
  created_at TEXT NOT NULL,
  -- Zähler für globale Nutzung
  usage_count INTEGER DEFAULT 1,
  FOREIGN KEY (prompt_id) REFERENCES global_prompts(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_global_ai_responses_hash ON global_ai_responses(response_hash);
CREATE INDEX IF NOT EXISTS idx_global_ai_responses_prompt ON global_ai_responses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_global_ai_responses_web_context ON global_ai_responses(web_context_hash);

-- ----------------------------------------------------------------------------
-- 4. WEB-KONTEXT (Citations für KI-Antworten)
-- ----------------------------------------------------------------------------
-- Speichert die Web-Suchzitate für jede KI-Antwort
-- Wird über web_context_hash mit global_ai_responses verknüpft
CREATE TABLE IF NOT EXISTS web_contexts (
  id TEXT PRIMARY KEY,
  web_context_hash TEXT NOT NULL,
  ai_response_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  snippet TEXT,
  -- Position/Reihenfolge im Kontext
  position INTEGER NOT NULL,
  FOREIGN KEY (ai_response_id) REFERENCES global_ai_responses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_web_contexts_hash ON web_contexts(web_context_hash);
CREATE INDEX IF NOT EXISTS idx_web_contexts_response ON web_contexts(ai_response_id);
CREATE INDEX IF NOT EXISTS idx_web_contexts_url ON web_contexts(url);

-- ----------------------------------------------------------------------------
-- 5. ANALYSEN (Immutable Snapshots pro Firma)
-- ----------------------------------------------------------------------------
-- Analysen sind zeitliche Snapshots und dürfen NIEMALS überschrieben werden
-- Jede Analyse ist ein vollständiger Snapshot zu einem bestimmten Zeitpunkt
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  -- Markierung der neuesten Analyse pro Firma (genau eine pro Firma)
  is_latest BOOLEAN DEFAULT 0,
  -- Snapshot-Metadaten
  snapshot_timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL,
  -- Zusätzliche Metadaten (optional)
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Constraint: Pro Firma darf nur eine Analyse is_latest = 1 haben
-- (Wird durch Application Logic + Unique Index sichergestellt)
CREATE UNIQUE INDEX IF NOT EXISTS idx_analyses_company_latest 
  ON analyses(company_id) 
  WHERE is_latest = 1;

CREATE INDEX IF NOT EXISTS idx_analyses_company ON analyses(company_id);
CREATE INDEX IF NOT EXISTS idx_analyses_timestamp ON analyses(snapshot_timestamp);
CREATE INDEX IF NOT EXISTS idx_analyses_latest ON analyses(is_latest);

-- ----------------------------------------------------------------------------
-- 6. ANALYSE-PROMPTS (Verknüpfung Analysen <-> Prompts)
-- ----------------------------------------------------------------------------
-- Verbindet Analysen mit den verwendeten Prompts
-- Ein Prompt kann in mehreren Analysen verwendet werden
-- Eine Analyse kann mehrere Prompts haben
CREATE TABLE IF NOT EXISTS analysis_prompts (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  -- Position/Reihenfolge in der Analyse
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
  FOREIGN KEY (prompt_id) REFERENCES global_prompts(id) ON DELETE RESTRICT,
  -- Ein Prompt kann nur einmal pro Analyse vorkommen
  UNIQUE(analysis_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_analysis_prompts_analysis ON analysis_prompts(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_prompts_prompt ON analysis_prompts(prompt_id);
CREATE INDEX IF NOT EXISTS idx_analysis_prompts_position ON analysis_prompts(analysis_id, position);

-- ----------------------------------------------------------------------------
-- 7. PROMPT-KI-ANTWORT-VERKNÜPFUNG (Innerhalb einer Analyse)
-- ----------------------------------------------------------------------------
-- Verbindet einen Prompt innerhalb einer Analyse mit einer KI-Antwort
-- Ein Prompt kann genau eine KI-Antwort pro Web-Kontext haben
-- Die gleiche KI-Antwort kann in mehreren Analysen verwendet werden
CREATE TABLE IF NOT EXISTS analysis_prompt_responses (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  ai_response_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
  FOREIGN KEY (prompt_id) REFERENCES global_prompts(id) ON DELETE RESTRICT,
  FOREIGN KEY (ai_response_id) REFERENCES global_ai_responses(id) ON DELETE RESTRICT,
  -- Ein Prompt kann nur einmal pro Analyse mit einer bestimmten KI-Antwort verknüpft sein
  UNIQUE(analysis_id, prompt_id, ai_response_id)
);

CREATE INDEX IF NOT EXISTS idx_analysis_prompt_responses_analysis ON analysis_prompt_responses(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_prompt_responses_prompt ON analysis_prompt_responses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_analysis_prompt_responses_response ON analysis_prompt_responses(ai_response_id);

-- ----------------------------------------------------------------------------
-- 8. PROMPT-METRIKEN (Pro Prompt innerhalb einer Analyse)
-- ----------------------------------------------------------------------------
-- Speichert Metriken für jeden Prompt innerhalb einer spezifischen Analyse
-- Diese Metriken sind Analyse-spezifisch und können sich zwischen Analysen unterscheiden
CREATE TABLE IF NOT EXISTS prompt_metrics (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  -- Metriken
  citation_count INTEGER NOT NULL DEFAULT 0,
  mention_count INTEGER NOT NULL DEFAULT 0,
  external_link_count INTEGER NOT NULL DEFAULT 0,
  -- Zusätzliche Metriken (optional)
  brand_mentions_exact INTEGER DEFAULT 0,
  brand_mentions_fuzzy INTEGER DEFAULT 0,
  sentiment_tone TEXT,
  sentiment_confidence REAL,
  -- Timestamp der Metriken-Erstellung
  calculated_at TEXT NOT NULL,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
  FOREIGN KEY (prompt_id) REFERENCES global_prompts(id) ON DELETE RESTRICT,
  -- Ein Prompt hat genau eine Metrik-Set pro Analyse
  UNIQUE(analysis_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_metrics_analysis ON prompt_metrics(analysis_id);
CREATE INDEX IF NOT EXISTS idx_prompt_metrics_prompt ON prompt_metrics(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_metrics_citations ON prompt_metrics(citation_count);
CREATE INDEX IF NOT EXISTS idx_prompt_metrics_mentions ON prompt_metrics(mention_count);

-- ============================================================================
-- TRIGGER & CONSTRAINTS
-- ============================================================================

-- Trigger: Automatische Aktualisierung von usage_count bei global_prompts
-- (Kann in Application Logic implementiert werden, hier als Kommentar)

-- Trigger: Automatische Aktualisierung von usage_count bei global_ai_responses
-- (Kann in Application Logic implementiert werden, hier als Kommentar)

-- ============================================================================
-- DESIGN-BEGRÜNDUNGEN
-- ============================================================================
-- 
-- 1. GLOBALE DEDUPLIZIERUNG VON PROMPTS:
--    - Prompts werden über content_hash dedupliziert
--    - Identische Prompts werden nur einmal gespeichert
--    - usage_count ermöglicht Performance-Optimierungen
--    - Begründung: Reduziert Speicherplatz und ermöglicht globale Auswertungen
--
-- 2. GLOBALE DEDUPLIZIERUNG VON KI-ANTWORTEN:
--    - KI-Antworten werden über response_hash (prompt + web_context) dedupliziert
--    - Identische Prompt+Web-Kontext-Kombinationen erzeugen nur eine Antwort
--    - Begründung: KI-Antworten sind teuer, Deduplizierung spart Kosten
--
-- 3. IMMUTABLE ANALYSEN:
--    - Analysen werden nur INSERTed, niemals UPDATEd
--    - Jede Analyse ist ein vollständiger Snapshot
--    - Begründung: Historische Datenintegrität, Zeitreihen-Analysen möglich
--
-- 4. LATEST-MARKIERUNG:
--    - Unique Index auf (company_id) WHERE is_latest = 1
--    - Application Logic muss sicherstellen, dass beim Setzen einer neuen latest
--      die alte auf 0 gesetzt wird
--    - Begründung: Schneller Zugriff auf aktuelle Analyse pro Firma
--
-- 5. SEPARATION OF CONCERNS:
--    - Prompts sind global (keine Firma-Zuordnung)
--    - KI-Antworten sind global (keine Firma-Zuordnung)
--    - Analysen sind firmen-spezifisch
--    - Metriken sind analyse-spezifisch
--    - Begründung: Klare Trennung, Wiederverwendbarkeit, Multi-Tenant-Sicherheit
--
-- 6. WEB-KONTEXT SEPARATION:
--    - Web-Kontext (Citations) ist in separater Tabelle
--    - Ermöglicht effiziente Suche nach ähnlichen Web-Kontexten
--    - Begründung: Flexibilität, Performance, Wiederverwendbarkeit
--
-- 7. METRIKEN PRO PROMPT PRO ANALYSE:
--    - Metriken sind nicht global, sondern analyse-spezifisch
--    - Ein Prompt kann in verschiedenen Analysen unterschiedliche Metriken haben
--    - Begründung: Metriken können sich über Zeit ändern, Analyse-spezifische Werte
--
-- ============================================================================
