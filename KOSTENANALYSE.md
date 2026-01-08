# Kostenanalyse für GEO-Analyse mit 50 Fragen

## Übersicht

Diese Analyse berechnet die geschätzten Kosten für eine vollständige GEO-Analyse mit **50 Fragen** (Prompts).

## System-Komponenten

### 1. Category Generation (Kategorien-Generierung)
- **Model**: `gpt-4o-mini`
- **Anzahl Calls**: 1 pro Analyse
- **Max Tokens**: 2.000 (Output)
- **Input**: ~500-1.000 Tokens (Website-Content + Prompt)

### 2. Prompt Generation (Fragen-Generierung)
- **Methode**: Template-basiert (keine API-Kosten)
- **Alternative**: GPT-basiert (optional, nicht standardmäßig aktiv)

### 3. LLM Execution (Hauptkosten)
- **Model**: `gpt-4o` (Standard) oder `gpt-5` (falls konfiguriert)
- **Anzahl Calls**: **50** (eine pro Frage)
- **Tool**: Web Search aktiviert
- **Input**: ~50-100 Tokens pro Frage
- **Output**: ~500-1.500 Tokens pro Antwort (Web Search generiert längere Antworten)

## OpenAI Preise (Stand: Januar 2025)

### GPT-4o
- **Input Tokens**: $2.50 pro Million Tokens
- **Output Tokens**: $10.00 pro Million Tokens

### GPT-4o-mini
- **Input Tokens**: $0.15 pro Million Tokens
- **Output Tokens**: $0.60 pro Million Tokens

### GPT-5 (falls verwendet)
- **Input Tokens**: $1.75 pro Million Tokens
- **Cached Input Tokens**: $0.175 pro Million Tokens
- **Output Tokens**: $14.00 pro Million Tokens

### Web Search Tool
- **Zusätzliche Kosten**: Keine separaten Kosten (in Token-Preisen enthalten)
- **Hinweis**: Web Search kann die Antwortlänge erhöhen, was zu mehr Output-Tokens führt

## Kostenberechnung für 50 Fragen

### Szenario 1: Mit GPT-4o (Standard)

#### Category Generation (1x)
- Input: 1.000 Tokens × $2.50 / 1.000.000 = **$0.0025**
- Output: 2.000 Tokens × $10.00 / 1.000.000 = **$0.02**
- **Subtotal**: **$0.0225**

#### LLM Execution (50x)
- Input pro Frage: 75 Tokens (Durchschnitt)
- Output pro Frage: 1.000 Tokens (Durchschnitt, Web Search erhöht Länge)

**Gesamt Input**: 50 × 75 = 3.750 Tokens
**Gesamt Output**: 50 × 1.000 = 50.000 Tokens

- Input: 3.750 × $2.50 / 1.000.000 = **$0.0094**
- Output: 50.000 × $10.00 / 1.000.000 = **$0.50**
- **Subtotal**: **$0.5094**

#### Gesamtkosten (GPT-4o)
- Category Generation: $0.0225
- LLM Execution: $0.5094
- **TOTAL**: **~$0.53** (ca. **0.48 €** bei 1 USD = 0.91 EUR)

---

### Szenario 2: Mit GPT-5 (falls konfiguriert)

#### Category Generation (1x)
- Input: 1.000 Tokens × $1.75 / 1.000.000 = **$0.00175**
- Output: 2.000 Tokens × $14.00 / 1.000.000 = **$0.028**
- **Subtotal**: **$0.02975**

#### LLM Execution (50x)
- Input pro Frage: 75 Tokens
- Output pro Frage: 1.000 Tokens

**Gesamt Input**: 3.750 Tokens
**Gesamt Output**: 50.000 Tokens

- Input: 3.750 × $1.75 / 1.000.000 = **$0.0066**
- Output: 50.000 × $14.00 / 1.000.000 = **$0.70**
- **Subtotal**: **$0.7066**

#### Gesamtkosten (GPT-5)
- Category Generation: $0.02975
- LLM Execution: $0.7066
- **TOTAL**: **~$0.74** (ca. **0.67 €**)

---

### Szenario 3: Mit GPT-4o-mini (Kosteneinsparung)

#### Category Generation (1x)
- Input: 1.000 Tokens × $0.15 / 1.000.000 = **$0.00015**
- Output: 2.000 Tokens × $0.60 / 1.000.000 = **$0.0012**
- **Subtotal**: **$0.00135**

#### LLM Execution (50x)
- Input pro Frage: 75 Tokens
- Output pro Frage: 1.000 Tokens

**Gesamt Input**: 3.750 Tokens
**Gesamt Output**: 50.000 Tokens

- Input: 3.750 × $0.15 / 1.000.000 = **$0.00056**
- Output: 50.000 × $0.60 / 1.000.000 = **$0.03**
- **Subtotal**: **$0.03056**

#### Gesamtkosten (GPT-4o-mini)
- Category Generation: $0.00135
- LLM Execution: $0.03056
- **TOTAL**: **~$0.032** (ca. **0.029 €**)

**⚠️ Hinweis**: GPT-4o-mini wird aktuell nur für Category Generation verwendet, nicht für die Haupt-LLM-Execution. Die Responses API unterstützt möglicherweise nicht alle Modelle.

---

## Kostenvergleich

| Modell | Category Gen | LLM Execution (50x) | **Gesamt** |
|--------|--------------|---------------------|------------|
| **GPT-4o** (Standard) | $0.0225 | $0.5094 | **~$0.53** (0.48 €) |
| **GPT-5** | $0.02975 | $0.7066 | **~$0.74** (0.67 €) |
| **GPT-4o-mini** | $0.00135 | $0.03056 | **~$0.032** (0.029 €) |

## Kostenfaktoren

### Hauptkostenfaktor: Output-Tokens
- **~95%** der Kosten entstehen durch Output-Tokens
- Web Search generiert längere, detailliertere Antworten
- Durchschnitt: ~1.000 Tokens pro Antwort

### Variable Faktoren
1. **Antwortlänge**: Kann zwischen 300-2.000 Tokens variieren
2. **Fragenlänge**: Input-Tokens sind relativ gering (50-100)
3. **Web Search Ergebnisse**: Mehr Suchergebnisse = längere Antworten

## Kostenschätzung bei Variationen

### Konservativ (kürzere Antworten)
- Output: 500 Tokens pro Frage
- **50 Fragen**: ~$0.25 (GPT-4o) / ~$0.35 (GPT-5)

### Realistisch (Standard)
- Output: 1.000 Tokens pro Frage
- **50 Fragen**: ~$0.53 (GPT-4o) / ~$0.74 (GPT-5)

### Maximal (lange Antworten)
- Output: 1.500 Tokens pro Frage
- **50 Fragen**: ~$0.75 (GPT-4o) / ~$1.05 (GPT-5)

## Zusätzliche Kosten

### Optional: GPT-basierte Prompt-Generierung
Falls aktiviert (aktuell nicht Standard):
- **Anzahl**: ~10 Kategorien × 5 Fragen = 50 Prompts
- **Model**: gpt-4o-mini
- **Kosten**: ~$0.01-0.02 zusätzlich

### Re-Runs
- **Tägliche Re-Runs**: Gleiche Kosten wie Initial-Analyse
- **Wöchentliche Re-Runs**: Gleiche Kosten wie Initial-Analyse
- **Hinweis**: Prompts werden wiederverwendet, nur LLM-Execution wird wiederholt

## Empfehlungen

### Für Kosteneinsparung
1. **Kürzere Fragen**: Reduziert Input-Tokens minimal
2. **Max Tokens Limit**: Setze `max_tokens` auf 800-1.000 statt unbegrenzt
3. **Batch-Processing**: Nutze Caching wo möglich (GPT-5 unterstützt cached input tokens)

### Für Qualität
1. **GPT-4o** bietet beste Balance zwischen Kosten und Qualität
2. **Web Search** ist essentiell für GEO-Analyse (keine Einsparung möglich)
3. **50 Fragen** ist ein guter Kompromiss zwischen Coverage und Kosten

## Zusammenfassung

**Für eine Analyse mit 50 Fragen:**
- **Standard (GPT-4o)**: **~$0.53** (ca. **0.48 €**)
- **Premium (GPT-5)**: **~$0.74** (ca. **0.67 €**)
- **Sparsam (GPT-4o-mini)**: **~$0.032** (ca. **0.029 €**) - falls unterstützt

**Pro Frage**: ~$0.01-0.015 (GPT-4o) bzw. ~$0.014-0.015 (GPT-5)

Die Kosten sind sehr moderat und machen die GEO-Analyse auch bei größeren Volumen wirtschaftlich.
