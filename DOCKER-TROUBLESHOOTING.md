# Docker & GitHub Actions Troubleshooting

## Häufige Build-Fehler und Lösungen

### 1. GitHub Actions Build schlägt fehl

#### Problem: "Missing environment variables during build"

**Ursache**: Next.js benötigt beim Build-Prozess Zugriff auf einige Umgebungsvariablen.

**Lösung**: Wir haben `.env.build` mit Platzhaltern erstellt.

**Verifikation**:
```bash
# Lokal testen
docker build -t test-build .

# Falls Fehler, prüfe:
ls -la .env.build
cat .env.build
```

#### Problem: "Prisma Client generation failed"

**Ursache**: DATABASE_URL fehlt während `prisma generate`.

**Lösung**: Bereits in `.env.build` und Dockerfile konfiguriert.

**Verifikation**:
```bash
# Im Dockerfile ist jetzt:
ENV DATABASE_URL="postgresql://placeholder..."
```

#### Problem: "COPY failed: file not found: .env.build"

**Ursache**: `.env.build` wird durch `.dockerignore` blockiert.

**Lösung**: Bereits behoben mit `!.env.build` in `.dockerignore`.

**Verifikation**:
```bash
grep -A5 "Environment files" .dockerignore
# Sollte zeigen: !.env.build
```

### 2. Multi-Platform Build schlägt fehl

#### Problem: "error: multiple platforms feature is currently not supported for docker driver"

**Ursache**: Docker Buildx benötigt einen multi-platform Builder.

**Lösung** (GitHub Actions macht das automatisch, lokal):
```bash
# Builder erstellen
docker buildx create --name multiplatform --use

# Build testen
docker buildx build --platform linux/amd64,linux/arm64 -t test .
```

#### Problem: ARM64 Build dauert sehr lange

**Ursache**: QEMU-Emulation ist langsam.

**Lösung**: Für schnelleres Testen nur eine Plattform:
```yaml
# In .github/workflows/docker-publish.yml temporär:
platforms: linux/amd64  # Nur amd64 für schnellere Tests
```

### 3. Runtime-Fehler nach Deployment

#### Problem: "Environment variable ... is not defined"

**Ursache**: Echte Env-Variablen fehlen zur Laufzeit.

**Lösung**: In docker-compose.yml oder Deployment setzen:
```yaml
environment:
  DATABASE_URL: ${DATABASE_URL}
  AZURE_AD_CLIENT_ID: ${AZURE_AD_CLIENT_ID}
  # ... alle aus .env.example
```

#### Problem: "Prisma Client not found"

**Ursache**: Prisma wurde nicht korrekt generiert.

**Lösung**:
```bash
# Im laufenden Container:
docker exec -it babsy-app npx prisma generate

# Oder Container neu bauen:
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 4. GitHub Actions Spezifisch

#### Problem: "permission denied while trying to connect to the Docker daemon"

**Ursache**: Runner hat keine Docker-Berechtigungen.

**Lösung**: Bereits in Workflow konfiguriert:
```yaml
permissions:
  contents: read
  packages: write
  id-token: write
```

#### Problem: "rate limit exceeded"

**Ursache**: Docker Hub API Rate Limits.

**Lösung**: Wir nutzen ghcr.io statt Docker Hub.

#### Problem: "attestation failed"

**Ursache**: ID Token fehlt oder Package-Berechtigungen.

**Lösung**: Temporär attestation deaktivieren:
```yaml
# .github/workflows/docker-publish.yml
# Kommentiere den "Generate artifact attestation" Step aus
```

## Schnell-Fixes

### Build lokal testen (ohne GitHub Actions)

```bash
# Vollständiger Test
docker build -t babsy-local .

# Mit BuildKit (empfohlen)
DOCKER_BUILDKIT=1 docker build -t babsy-local .

# Nur bis zu einer Stage
docker build --target builder -t babsy-builder .

# Build-Logs ausführlich
docker build --progress=plain -t babsy-local .
```

### GitHub Actions Logs analysieren

1. GitHub Repository → Actions
2. Fehlgeschlagenen Workflow anklicken
3. "Build and push Docker image" expandieren
4. Nach Fehlern suchen (Ctrl+F "error")

Häufige Fehler-Keywords:
- `ERROR`
- `failed`
- `missing`
- `not found`
- `permission denied`

### GitHub Actions Re-Run

```bash
# Via GitHub UI:
Actions → Fehlgeschlagener Workflow → "Re-run jobs"

# Oder neuen Commit machen:
git commit --allow-empty -m "Trigger rebuild"
git push
```

## Lokales Testen der Auth-Features

Da die Auth-Konfiguration fehlt, werden einige Features nicht funktionieren:

### Entra ID (lokal mocken)

In `src/auth.ts` temporär:
```typescript
// Für lokales Testen ohne echtes Azure AD
if (process.env.NODE_ENV === 'development' && !process.env.AZURE_AD_CLIENT_ID) {
  // Mock provider - NICHT in Production nutzen!
}
```

### OTP (ohne Exchange)

In `src/lib/exchange-email.ts` für Entwicklung:
```typescript
// Statt echtem Exchange: Console-Logging
console.log('OTP Code:', otp)
// Oder Mailtrap/Mailhog nutzen
```

### Babsy App (Mocken)

In `src/lib/babsy-api.ts` bereits implementiert:
```typescript
if (process.env.NODE_ENV === 'development') {
  return {
    success: true,
    user: { /* mock data */ }
  }
}
```

## Docker Build Optimierungen

### Layer Caching nutzen

```dockerfile
# Gute Reihenfolge (bereits im Dockerfile):
1. package.json kopieren
2. npm install
3. Source Code kopieren
4. Build
```

### Build beschleunigen

```bash
# Cache von GitHub Actions nutzen (im Workflow bereits aktiv)
cache-from: type=gha
cache-to: type=gha,mode=max

# Lokal: BuildKit Cache
export DOCKER_BUILDKIT=1
```

### Image-Größe reduzieren

```bash
# Aktuelles Image (Multi-Stage bereits optimiert)
docker images babsy-local

# Sollte ca. 400-600 MB sein
```

## Deployment-Checkliste

- [ ] `.env.build` existiert und ist committed
- [ ] `.dockerignore` enthält `!.env.build`
- [ ] Dockerfile hat ENV-Platzhalter
- [ ] GitHub Actions Workflow ist korrekt
- [ ] Lokaler Build erfolgreich: `docker build .`
- [ ] Packages-Berechtigung in GitHub gesetzt
- [ ] Produktions-Env-Variablen vorbereitet

## Support-Kontakte

Bei anhaltenden Problemen:

1. **GitHub Actions Logs** sichern und analysieren
2. **Docker Build Log** speichern: `docker build . 2>&1 | tee build.log`
3. **Issue erstellen** mit:
   - Fehler-Log
   - Docker Version: `docker --version`
   - OS: `uname -a`
   - Node Version: `node --version`

## Bekannte Issues

### Issue #1: TypeScript Build-Fehler
**Status**: Behoben
**Lösung**: `error.errors` → `error.issues` in allen API Routes

### Issue #2: Missing Auth Providers
**Status**: Konfiguration erforderlich
**Workaround**: Mock-Mode für Development

### Issue #3: Prisma Client Generation
**Status**: Behoben
**Lösung**: `.env.build` mit DATABASE_URL Placeholder

---

Zuletzt aktualisiert: 2025-01-11
