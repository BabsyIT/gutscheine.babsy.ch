# Docker Build Fix - Zusammenfassung

## Problem
GitHub Actions Build schlug fehl mit:
```
ERROR: failed to solve: process "/bin/sh -c npx prisma generate" did not complete successfully: exit code: 1
```

## Ursache
Prisma benötigt die `DATABASE_URL` Umgebungsvariable während `npx prisma generate`, aber diese wurde erst **nach** dem Prisma-Befehl gesetzt.

## Lösung

### 1. Dockerfile korrigiert
**Vorher** (Dockerfile.backup):
```dockerfile
COPY . .
RUN npx prisma generate  # ❌ DATABASE_URL nicht verfügbar
ENV DATABASE_URL="..."   # ⚠️ Zu spät!
```

**Nachher** (Dockerfile):
```dockerfile
COPY . .
# Umgebungsvariablen VOR prisma generate setzen
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXTAUTH_SECRET="build-placeholder"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate  # ✅ DATABASE_URL verfügbar
```

### 2. .env.build erstellt
Fallback-Datei für Build-Zeit mit Platzhalter-Werten (nicht mehr benötigt, da ENV direkt im Dockerfile).

### 3. .dockerignore aktualisiert
```
!.env.build  # Erlaubt .env.build trotz .env*-Regel
```

## Behobene Dateien

- ✅ [Dockerfile](Dockerfile) - Korrekte ENV-Reihenfolge
- ✅ [.env.build](.env.build) - Build-Zeit Platzhalter
- ✅ [.dockerignore](.dockerignore) - .env.build Exception
- ✅ [DOCKER-TROUBLESHOOTING.md](DOCKER-TROUBLESHOOTING.md) - Troubleshooting Guide

## Nächste Schritte

### 1. Committen und Pushen
```bash
git add Dockerfile .env.build .dockerignore DOCKER-TROUBLESHOOTING.md BUILD-FIX-SUMMARY.md
git commit -m "fix: Docker build - set DATABASE_URL before prisma generate"
git push origin main
```

### 2. GitHub Actions überwachen
1. Gehe zu: `https://github.com/<username>/gutscheine.babsy.ch/actions`
2. Warte auf automatischen Build (wird durch Push getriggert)
3. Überprüfe "Build and push Docker image" Step

### 3. Bei Erfolg
- Docker Image wird zu GHCR gepusht
- Tags: `latest`, `main`, `main-<sha>`
- Deployment möglich mit: `docker compose -f docker-compose.ghcr.yml up -d`

## Verifikation

### Build erfolgreich?
```bash
# GitHub Actions Status prüfen
# Grüner Haken bei: Docker Build and Push to GHCR

# Image auf GHCR prüfen
https://github.com/<username>?tab=packages
```

### Lokal testen (optional)
```bash
# Wenn Docker-Zugriff vorhanden:
docker build -t babsy-local .

# Image sollte ca. 400-600 MB sein:
docker images babsy-local
```

## Wichtige Hinweise

### Build-Zeit vs Runtime
- **Build-Zeit**: Platzhalter-Werte in ENV (nur für Prisma/Next.js Build)
- **Runtime**: Echte Werte aus docker-compose.yml oder Deployment-Config

### Secrets
Die Platzhalter-Werte im Dockerfile sind **nicht sicher** - sie sind nur für den Build-Prozess:
- `DATABASE_URL="postgresql://placeholder..."` ← Nur für Build!
- Echte Werte werden zur Runtime via Umgebungsvariablen injiziert

### Multi-Auth Implementation
Das Projekt nutzt jetzt 3 Auth-Methoden:
1. **Entra ID** - Babsy Mitarbeiter (@babsy.ch)
2. **Babsy App** - Sitter/Parents/Partner/Members via Token
3. **Email OTP** - Partner via Exchange Online

Alle benötigen Konfiguration - siehe [AUTHENTICATION.md](AUTHENTICATION.md)

## Troubleshooting

Falls Build weiterhin fehlschlägt:

### 1. Prisma-Fehler
```bash
# Prüfe ob DATABASE_URL gesetzt ist:
grep -A5 "ENV DATABASE_URL" Dockerfile
```

### 2. Node/NPM-Fehler
```bash
# Prüfe package.json:
grep -A10 "dependencies" package.json
```

### 3. GitHub Actions Cache
```bash
# In GitHub: Actions → Caches → Alle löschen
# Dann Re-run Workflow
```

### 4. Multi-Platform Build
```bash
# Falls ARM64 Build zu lange dauert:
# In .github/workflows/docker-publish.yml temporär:
platforms: linux/amd64  # Nur amd64
```

## Support-Informationen

- **Dockerfile**: Multi-Stage Build (deps → builder → runner)
- **Base Image**: node:20-alpine
- **Build-Zeit**: ~5-10 Minuten (mit Cache: 2-3 Minuten)
- **Image-Größe**: ~500 MB
- **Plattformen**: linux/amd64, linux/arm64

## Status

- [x] Dockerfile korrigiert
- [x] .env.build erstellt
- [x] .dockerignore aktualisiert
- [x] Dokumentation erstellt
- [ ] Zu GitHub gepusht (nächster Schritt)
- [ ] GitHub Actions Build erfolgreich
- [ ] Image auf GHCR verfügbar

---

**Erstellt**: 2025-11-01 00:15 UTC
**Status**: Ready to Push
**Nächster Schritt**: Git Push und Actions überwachen
