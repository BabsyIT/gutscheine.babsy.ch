# Docker Deployment Guide

Diese Anleitung beschreibt, wie die Babsy Gutschein-Plattform mit Docker und Docker Compose bereitgestellt wird.

## Voraussetzungen

- Docker Engine 20.10+
- Docker Compose 2.0+

## Schnellstart

### 1. Umgebungsvariablen konfigurieren

Kopiere die Docker-Umgebungsvorlage:

```bash
cp .env.docker .env
```

Bearbeite die `.env` Datei und passe die Werte an:

```env
# PostgreSQL - Ändere das Passwort!
POSTGRES_PASSWORD=dein_sicheres_passwort

# NextAuth - Generiere ein Secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# OAuth Provider (Google)
GOOGLE_CLIENT_ID=deine_google_client_id
GOOGLE_CLIENT_SECRET=dein_google_client_secret

# OAuth Provider (GitHub)
GITHUB_CLIENT_ID=deine_github_client_id
GITHUB_CLIENT_SECRET=dein_github_client_secret

# Beim ersten Start auf "true" setzen für Seed-Daten
RUN_SEED=true
```

### 2. Container starten

```bash
# Im Hintergrund starten
docker compose up -d

# Mit Logs im Vordergrund
docker compose up

# Logs anzeigen
docker compose logs -f app
```

### 3. Anwendung aufrufen

Die Plattform ist nun unter [http://localhost:3000](http://localhost:3000) erreichbar.

## Detaillierte Konfiguration

### OAuth Providers konfigurieren

#### Google OAuth

1. Gehe zur [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein Projekt oder wähle ein bestehendes
3. Aktiviere die "Google+ API"
4. Erstelle OAuth 2.0 Credentials
5. Füge als Authorized Redirect URI hinzu:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://deine-domain.com/api/auth/callback/google`

#### GitHub OAuth

1. Gehe zu [GitHub Developer Settings](https://github.com/settings/developers)
2. Erstelle eine neue OAuth App
3. Füge als Authorization Callback URL hinzu:
   - Development: `http://localhost:3000/api/auth/callback/github`
   - Production: `https://deine-domain.com/api/auth/callback/github`

### NextAuth Secret generieren

```bash
openssl rand -base64 32
```

## Docker Compose Services

### Services

- **postgres**: PostgreSQL 16 Datenbank
- **app**: Next.js Anwendung

### Volumes

- **postgres_data**: Persistente Datenbank-Speicherung

### Netzwerk

- **babsy-network**: Bridge-Netzwerk für Service-Kommunikation

## Verwaltungskommandos

### Container Status prüfen

```bash
docker compose ps
```

### Logs anzeigen

```bash
# Alle Services
docker compose logs -f

# Nur App
docker compose logs -f app

# Nur Datenbank
docker compose logs -f postgres
```

### Container neu starten

```bash
docker compose restart
```

### Container stoppen

```bash
docker compose down
```

### Container stoppen und Volumes löschen

```bash
# ACHTUNG: Löscht alle Daten!
docker compose down -v
```

### In Container einsteigen

```bash
# App Container
docker compose exec app sh

# PostgreSQL Container
docker compose exec postgres psql -U babsy -d babsy_vouchers
```

## Datenbank-Management

### Migrations manuell ausführen

```bash
docker compose exec app npx prisma migrate deploy
```

### Datenbank seeden

```bash
docker compose exec app npx prisma db seed
```

### Prisma Studio (Datenbank-GUI)

```bash
docker compose exec app npx prisma studio
```

Öffne dann [http://localhost:5555](http://localhost:5555)

### Datenbank-Backup erstellen

```bash
docker compose exec postgres pg_dump -U babsy babsy_vouchers > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Datenbank-Backup wiederherstellen

```bash
docker compose exec -T postgres psql -U babsy babsy_vouchers < backup.sql
```

## Production Deployment

### 1. Environment anpassen

Für Production solltest du folgende Variablen in `.env` anpassen:

```env
# Production URLs
NEXTAUTH_URL=https://deine-domain.com
NEXT_PUBLIC_APP_URL=https://deine-domain.com

# Sichere Passwörter
POSTGRES_PASSWORD=sehr_sicheres_passwort
NEXTAUTH_SECRET=sehr_langes_zufälliges_secret

# Seed nur beim ersten Deployment
RUN_SEED=false
```

### 2. Mit reverse Proxy (nginx)

Beispiel nginx-Konfiguration:

```nginx
server {
    listen 80;
    server_name deine-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. SSL mit Let's Encrypt

```bash
# Certbot installieren
sudo apt install certbot python3-certbot-nginx

# SSL-Zertifikat erstellen
sudo certbot --nginx -d deine-domain.com
```

### 4. Container automatisch starten

```bash
# In docker-compose.yml ist bereits restart: unless-stopped gesetzt
# Stelle sicher, dass Docker beim Systemstart startet:
sudo systemctl enable docker
```

## Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker compose logs app

# Container neu bauen
docker compose build --no-cache
docker compose up -d
```

### Datenbank-Verbindungsfehler

```bash
# PostgreSQL Status prüfen
docker compose exec postgres pg_isready -U babsy

# Database URL in .env prüfen
# Sollte sein: postgresql://babsy:passwort@postgres:5432/babsy_vouchers
```

### Port bereits belegt

Ändere in `.env`:

```env
APP_PORT=3001
POSTGRES_PORT=5433
```

### Alles zurücksetzen

```bash
# Container, Volumes und Images löschen
docker compose down -v --rmi all

# Neu starten
docker compose up -d
```

## Monitoring

### Resource Usage

```bash
docker stats
```

### Health Checks

```bash
# App Health
curl http://localhost:3000/api/categories

# PostgreSQL Health
docker compose exec postgres pg_isready -U babsy
```

## Updates

### Anwendung aktualisieren

```bash
# Code pullen
git pull

# Neu bauen und starten
docker compose up -d --build

# Migrations ausführen (falls nötig)
docker compose exec app npx prisma migrate deploy
```

## Sicherheitshinweise

1. ✅ Ändere Standard-Passwörter in `.env`
2. ✅ Verwende sichere `NEXTAUTH_SECRET`
3. ✅ Setze `RUN_SEED=false` nach dem ersten Start
4. ✅ Verwende HTTPS in Production
5. ✅ Regelmäßige Backups der Datenbank
6. ✅ Halte Docker Images aktuell
7. ✅ Limitiere exposed Ports (nur 3000 für App)

## Support

Bei Problemen:
1. Logs prüfen: `docker compose logs -f`
2. Container Status: `docker compose ps`
3. Health Checks prüfen
4. GitHub Issues erstellen
