# GitHub Container Registry (GHCR) Deployment

Diese Anleitung beschreibt, wie Docker Images automatisch zu GitHub Container Registry (GHCR) gepusht und verwendet werden.

## Übersicht

Die Plattform nutzt GitHub Actions, um bei jedem Push automatisch Docker Images zu bauen und zu GHCR zu pushen. Dies ermöglicht:

- ✅ Automatisches Build bei Code-Änderungen
- ✅ Versionierte Container Images (Tags)
- ✅ Multi-Architektur Support (amd64, arm64)
- ✅ Schnelles Deployment ohne lokales Build
- ✅ Kostenlos für öffentliche Repositories

## Setup

### 1. Repository auf GitHub pushen

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<username>/gutscheine.babsy.ch.git
git push -u origin main
```

### 2. GitHub Actions aktivieren

Die Workflow-Datei [.github/workflows/docker-publish.yml](.github/workflows/docker-publish.yml) ist bereits vorhanden. GitHub Actions startet automatisch beim nächsten Push.

### 3. Package Sichtbarkeit konfigurieren

Nach dem ersten erfolgreichen Build:

1. Gehe zu: `https://github.com/<username>?tab=packages`
2. Finde das Package `gutscheine.babsy.ch`
3. Klicke auf "Package settings"
4. Optional: Ändere Sichtbarkeit auf "Public"
5. Optional: Verbinde mit Repository

## Verwendung

### Images von GHCR pullen

#### Manueller Pull

```bash
# Login bei GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin

# Image pullen
docker pull ghcr.io/<username>/gutscheine.babsy.ch:latest
```

#### Mit docker-compose.ghcr.yml

```bash
# 1. docker-compose.ghcr.yml anpassen
# Ersetze <username> mit deinem GitHub Username in Zeile 35

# 2. Umgebungsvariablen konfigurieren
cp .env.docker .env
# .env bearbeiten

# 3. Image pullen und starten
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

## Verfügbare Image Tags

Der GitHub Actions Workflow erstellt automatisch verschiedene Tags:

| Tag | Beschreibung | Beispiel |
|-----|--------------|----------|
| `latest` | Neuester Build vom main Branch | `ghcr.io/username/gutscheine.babsy.ch:latest` |
| `main` | Main Branch | `ghcr.io/username/gutscheine.babsy.ch:main` |
| `develop` | Develop Branch | `ghcr.io/username/gutscheine.babsy.ch:develop` |
| `v*.*.*` | Semantic Versioning | `ghcr.io/username/gutscheine.babsy.ch:v1.0.0` |
| `v*.*` | Minor Version | `ghcr.io/username/gutscheine.babsy.ch:v1.0` |
| `v*` | Major Version | `ghcr.io/username/gutscheine.babsy.ch:v1` |
| `main-sha` | Commit SHA | `ghcr.io/username/gutscheine.babsy.ch:main-a1b2c3d` |

### Release erstellen

Für versionierte Releases:

```bash
# Tag erstellen
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions baut automatisch Image mit Tags:
# - ghcr.io/username/gutscheine.babsy.ch:v1.0.0
# - ghcr.io/username/gutscheine.babsy.ch:v1.0
# - ghcr.io/username/gutscheine.babsy.ch:v1
# - ghcr.io/username/gutscheine.babsy.ch:latest
```

## Production Deployment

### 1. Server vorbereiten

```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# User zu docker Gruppe hinzufügen
sudo usermod -aG docker $USER

# Neu einloggen oder:
newgrp docker
```

### 2. Repository clonen (nur für docker-compose.ghcr.yml)

```bash
git clone https://github.com/<username>/gutscheine.babsy.ch.git
cd gutscheine.babsy.ch
```

### 3. Umgebungsvariablen konfigurieren

```bash
cp .env.docker .env
nano .env
```

Wichtige Production-Einstellungen:

```env
# Production URLs
NEXTAUTH_URL=https://deine-domain.com
NEXT_PUBLIC_APP_URL=https://deine-domain.com

# Sichere Credentials
POSTGRES_PASSWORD=sehr_sicheres_passwort
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# OAuth Production Credentials
GOOGLE_CLIENT_ID=production_client_id
GOOGLE_CLIENT_SECRET=production_secret

# Seed nur beim ersten Mal
RUN_SEED=true
```

### 4. Deployment starten

```bash
# GHCR Login (falls Private Repository)
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin

# Image pullen und starten
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d

# Nach erstem Start: Seed deaktivieren
sed -i 's/RUN_SEED=true/RUN_SEED=false/' .env
docker compose -f docker-compose.ghcr.yml restart app
```

### 5. Updates deployen

```bash
# Neue Version pullen
docker compose -f docker-compose.ghcr.yml pull

# Neu starten
docker compose -f docker-compose.ghcr.yml up -d
```

## CI/CD Workflow Details

### Trigger

Der Workflow wird ausgelöst bei:

- **Push** auf `main` oder `develop` Branch
- **Tag** im Format `v*.*.*`
- **Pull Request** gegen `main` (nur Build, kein Push)
- **Manuell** über GitHub UI (workflow_dispatch)

### Build-Prozess

1. **Checkout**: Code wird ausgecheckt
2. **Docker Buildx**: Multi-Plattform Build Setup
3. **Login**: Authentifizierung bei GHCR
4. **Metadata**: Tags und Labels generieren
5. **Build & Push**:
   - Multi-Architektur Build (amd64, arm64)
   - Layer Caching für schnellere Builds
   - Push zu GHCR (außer bei PRs)
6. **Attestation**: Build Provenance für Sicherheit

### Build-Cache

Der Workflow nutzt GitHub Actions Cache:

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

Dies beschleunigt Builds erheblich (oft unter 2 Minuten).

## Authentifizierung

### Für öffentliche Images

Kein Login erforderlich:

```bash
docker pull ghcr.io/<username>/gutscheine.babsy.ch:latest
```

### Für private Images

#### Personal Access Token (PAT)

1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token mit Scope: `read:packages`
3. Token kopieren

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin
```

#### In docker-compose

```yaml
services:
  app:
    image: ghcr.io/<username>/gutscheine.babsy.ch:latest
    # Vorher docker login durchführen
```

## Monitoring

### Build Status prüfen

1. GitHub Repository → Actions
2. Workflow "Docker Build and Push to GHCR" auswählen
3. Builds und Logs einsehen

### Images anzeigen

```bash
# Lokal gepullte Images
docker images | grep gutscheine.babsy.ch

# Über GitHub UI
https://github.com/<username>?tab=packages
```

### Image Details

```bash
docker inspect ghcr.io/<username>/gutscheine.babsy.ch:latest
```

## Troubleshooting

### Build schlägt fehl

```bash
# Logs in GitHub Actions prüfen
https://github.com/<username>/gutscheine.babsy.ch/actions

# Lokal testen
docker buildx build --platform linux/amd64 -t test .
```

### Image kann nicht gepullt werden

```bash
# Login-Status prüfen
docker login ghcr.io

# Token-Berechtigungen prüfen (read:packages erforderlich)

# Image-Sichtbarkeit prüfen (GitHub Package Settings)
```

### Alte Images aufräumen

GitHub behält Images für 30 Tage. Manuelles Löschen:

1. GitHub → Packages → gutscheine.babsy.ch
2. Package versions → Delete

Oder via API/CLI tools.

## Sicherheit

### Best Practices

- ✅ Verwende spezifische Tags statt `latest` in Production
- ✅ Scanne Images auf Vulnerabilities
- ✅ Minimiere Image-Größe (bereits durch Multi-Stage Build)
- ✅ Nutze non-root User (bereits konfiguriert)
- ✅ Aktiviere Image Signing (bereits via Attestation)

### Vulnerability Scanning

GitHub scannt Images automatisch. Ergebnisse in:
`Security → Code scanning alerts`

### Image Signing

Der Workflow erstellt automatisch Attestations:

```bash
# Attestation verifizieren
gh attestation verify \
  oci://ghcr.io/<username>/gutscheine.babsy.ch:latest \
  --owner <username>
```

## Kosten

- **Public Repositories**: Unbegrenzt kostenlos
- **Private Repositories**:
  - 500 MB Speicher kostenlos
  - 1 GB Datenverkehr/Monat kostenlos
  - Danach: $0.25/GB Speicher, $0.50/GB Verkehr

Für diese App (Image ~500 MB):
- Speicher: 1-2 GB für mehrere Versionen
- Verkehr: ~500 MB pro Deployment

→ Meist innerhalb des kostenlosen Kontingents

## Alternative: Docker Hub

Falls GHCR nicht gewünscht ist, kann der Workflow angepasst werden:

```yaml
env:
  REGISTRY: docker.io
  IMAGE_NAME: <username>/babsy-vouchers
```

Dann:
- Docker Hub Account erstellen
- GitHub Secrets: DOCKER_USERNAME, DOCKER_TOKEN
- Workflow anpassen

## Nützliche Befehle

```bash
# Image pullen
docker pull ghcr.io/<username>/gutscheine.babsy.ch:latest

# Mit spezifischer Version
docker pull ghcr.io/<username>/gutscheine.babsy.ch:v1.0.0

# Alle lokalen Images
docker images ghcr.io/<username>/gutscheine.babsy.ch

# Image inspizieren
docker inspect ghcr.io/<username>/gutscheine.babsy.ch:latest

# Container starten
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  ghcr.io/<username>/gutscheine.babsy.ch:latest

# Mit docker-compose
docker compose -f docker-compose.ghcr.yml up -d

# Updates
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

## Support

Bei Problemen:

1. GitHub Actions Logs prüfen
2. [GitHub Packages Dokumentation](https://docs.github.com/en/packages)
3. [Docker Build Push Action](https://github.com/docker/build-push-action)
4. GitHub Issues erstellen
