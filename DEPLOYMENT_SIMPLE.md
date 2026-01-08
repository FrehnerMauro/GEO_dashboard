# Einfache Deployment-Anleitung

## Was ist was?

### Cloudflare Workers
- **Was:** Backend-API (Node.js-ähnlich, läuft am Edge)
- **Datei:** `wrangler.toml`
- **Code:** `src/index.ts` + `src/api/`
- **Zweck:** API-Endpunkte (`/api/*`)

### Cloudflare Pages
- **Was:** Statische Dateien (HTML, CSS, JS)
- **Datei:** `_pages.yml`
- **Code:** `web/` Verzeichnis
- **Zweck:** Frontend (HTML, CSS, JavaScript)

## Empfohlene Lösung: Alles über Workers

**Warum?** Einfacher zu verwalten, alles in einem Deployment.

### Schritt 1: Worker erweitern für statische Dateien

Der Worker muss die statischen Dateien aus `web/` servieren. Dafür müssen wir die Dateien beim Build einbinden.

### Schritt 2: Cloudflare Pages deaktivieren

Wenn alles über Workers läuft, brauchen wir Pages nicht mehr.

## Alternative: Workers + Pages (getrennt)

**Warum?** Bessere Performance für statische Dateien, aber komplexer.

### Konfiguration:

**Cloudflare Workers:**
- Nur API (`/api/*`)
- Root Directory: `.` (Projekt-Root)
- Main: `src/index.ts`

**Cloudflare Pages:**
- Nur Frontend (statische Dateien)
- Root Directory: `web`
- Build Output Directory: `.` (oder leer)
- Build Command: (leer)
