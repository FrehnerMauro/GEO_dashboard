# Deployment Guide - Cloudflare D1 Database Setup

## Wichtige Information

Cloudflare D1 hat **zwei separate Datenbanken**:
1. **Lokale Datenbank** (für `wrangler dev`) - nur für lokale Entwicklung
2. **Remote/Production Datenbank** (in Cloudflare) - für die echte Anwendung

## Schritt 1: Migrationen in Cloudflare D1 ausführen

### Für Production (Remote-Datenbank):

```bash
# Migrationen auf die Remote-Datenbank anwenden
npm run db:migrate -- --remote
```

Oder direkt mit Wrangler:

```bash
# Alle Migrationen auf Remote-Datenbank anwenden
wrangler d1 migrations apply geo-db --remote
```

### Für lokale Entwicklung:

```bash
# Migrationen auf lokale Datenbank anwenden (für wrangler dev)
npm run db:migrate
```

Oder:

```bash
wrangler d1 migrations apply geo-db
```

## Schritt 2: Alternative - Setup-Endpoint verwenden

Sie können auch den Setup-Endpoint verwenden, der automatisch alle Tabellen erstellt:

### In Production:

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/setup/database
```

### Lokal:

```bash
curl -X POST http://localhost:8787/api/setup/database
```

**Vorteil:** Der Setup-Endpoint funktioniert sowohl lokal als auch in Production und erstellt alle Tabellen automatisch.

## Schritt 3: Deployment

Nachdem die Migrationen ausgeführt wurden:

```bash
npm run deploy
```

## Überprüfung

### Migrationen-Status prüfen:

```bash
# Remote-Datenbank
wrangler d1 migrations list geo-db --remote

# Lokale Datenbank
wrangler d1 migrations list geo-db
```

### Datenbank direkt abfragen:

```bash
# Remote-Datenbank
wrangler d1 execute geo-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"

# Lokale Datenbank
wrangler d1 execute geo-db --command "SELECT name FROM sqlite_master WHERE type='table';"
```

## Wichtige Hinweise

1. **Lokale und Remote-Datenbanken sind getrennt** - Migrationen müssen für beide ausgeführt werden
2. **Der Setup-Endpoint ist idempotent** - kann mehrfach aufgerufen werden ohne Probleme
3. **Nach dem Deployment** sollten Sie den Setup-Endpoint in Production aufrufen, um sicherzustellen, dass alle Tabellen existieren

## Troubleshooting

### Fehler: "no such table"

- Stellen Sie sicher, dass Migrationen auf der Remote-Datenbank ausgeführt wurden
- Oder rufen Sie den Setup-Endpoint auf: `POST /api/setup/database`

### Fehler: "UNIQUE constraint failed"

- Dies wurde bereits behoben mit `INSERT OR REPLACE`
- Sollte nicht mehr auftreten






