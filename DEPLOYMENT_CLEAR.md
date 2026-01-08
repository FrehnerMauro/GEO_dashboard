# Klare Deployment-Anleitung

## 🎯 Was ist was?

### Cloudflare Workers (Backend)
- **Zweck:** API-Endpunkte (`/api/*`)
- **Konfiguration:** `wrangler.toml`
- **Code:** `src/index.ts` + `src/api/`
- **Deployment:** `npm run deploy` oder `wrangler deploy`

### Cloudflare Pages (Frontend)
- **Zweck:** Statische Dateien (HTML, CSS, JS)
- **Konfiguration:** `_pages.yml`
- **Code:** `web/` Verzeichnis
- **Deployment:** Automatisch bei Git Push auf `main`

---

## ✅ Korrekte Cloudflare Pages Konfiguration

Im **Cloudflare Pages Dashboard** einstellen:

### Build Settings:
1. **Root directory:** `web` ⚠️ WICHTIG!
2. **Build output directory:** `.` (Punkt) oder leer lassen
3. **Build command:** (leer lassen)

### Warum?
- Root directory `web` bedeutet: Cloudflare Pages sucht die Dateien im `web/` Verzeichnis
- Build output directory `.` bedeutet: Die Dateien werden vom Root des `web/` Verzeichnisses serviert
- Die Pfade in `index.html` (`/styles/...`, `/scripts/...`) funktionieren dann korrekt

---

## 🔧 Aktuelle Konfiguration prüfen

### 1. Worker Deployment (Backend)
```bash
npm run deploy
```
Oder:
```bash
wrangler deploy
```

### 2. Pages Deployment (Frontend)
- Automatisch bei Git Push auf `main` Branch
- Oder manuell im Cloudflare Pages Dashboard: "Retry deployment"

---

## 🐛 Troubleshooting

### Problem: Weiße Seite
**Ursache:** CSS-Dateien werden nicht geladen

**Lösung:**
1. Prüfe im Browser (F12 → Network), ob CSS-Dateien geladen werden
2. Prüfe, ob Root directory auf `web` gesetzt ist
3. Prüfe, ob die Dateien im `web/` Verzeichnis existieren

### Problem: 404 für CSS/JS
**Ursache:** Falsche Pfade

**Lösung:**
- Root directory muss `web` sein
- Build output directory muss `.` sein

---

## 📝 Zusammenfassung

**Workers (Backend):**
- Root: `.` (Projekt-Root)
- Main: `src/index.ts`
- Deploy: `wrangler deploy`

**Pages (Frontend):**
- Root: `web` ⚠️
- Output: `.`
- Deploy: Automatisch bei Git Push
