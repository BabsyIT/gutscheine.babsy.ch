# Babsy Gutschein-Plattform - Quickstart 🚀

Die schnellste Art, die Plattform zum Laufen zu bringen!

## Mit Docker (5 Minuten)

### 1. Voraussetzungen prüfen

```bash
docker --version
docker compose version
```

Falls Docker noch nicht installiert ist:
- **Linux**: `sudo apt install docker.io docker-compose-plugin`
- **macOS/Windows**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 2. Umgebung konfigurieren

```bash
# .env-Datei erstellen
cp .env.docker .env

# Secret generieren (Linux/macOS)
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
```

Minimal-Konfiguration in `.env`:

```env
POSTGRES_PASSWORD=mein_sicheres_passwort
NEXTAUTH_SECRET=<generiertes-secret>
RUN_SEED=true
```

OAuth ist optional für den ersten Test!

### 3. Starten

```bash
docker compose up -d
```

### 4. Testen

Öffne [http://localhost:3000](http://localhost:3000)

**Fertig!** 🎉

## Erste Schritte

### Admin-Zugang erstellen

Da OAuth optional ist, kannst du direkt über die Datenbank einen Admin erstellen:

```bash
docker compose exec postgres psql -U babsy -d babsy_vouchers
```

Dann in der PostgreSQL-Shell:

```sql
-- User erstellen
INSERT INTO "User" (id, email, name, role)
VALUES ('admin-1', 'admin@babsy.ch', 'Admin', 'ADMIN');

-- Kategorien ansehen
SELECT * FROM "Category";
```

### Mit OAuth-Login (Google/GitHub)

1. OAuth Credentials besorgen (siehe [DOCKER.md](DOCKER.md))
2. In `.env` eintragen:
   ```env
   GOOGLE_CLIENT_ID=deine_client_id
   GOOGLE_CLIENT_SECRET=dein_secret
   ```
3. Container neu starten:
   ```bash
   docker compose restart app
   ```

## Nützliche Befehle

```bash
# Logs ansehen
docker compose logs -f app

# Stoppen
docker compose down

# Neu starten nach Änderungen
docker compose up -d --build

# Datenbank zurücksetzen
docker compose down -v
docker compose up -d
```

## Problemlösung

**Port 3000 bereits belegt?**

In `.env` ändern:
```env
APP_PORT=3001
```

**Datenbank-Fehler?**

```bash
# Container neu starten
docker compose restart

# Logs prüfen
docker compose logs postgres
docker compose logs app
```

**Alles zurücksetzen?**

```bash
docker compose down -v --rmi all
docker compose up -d
```

## Nächste Schritte

- 📖 Vollständige Doku: [DOCKER.md](DOCKER.md)
- 🔐 OAuth konfigurieren
- 🎨 Partner-Account erstellen
- 🎫 Ersten Gutschein anlegen

Viel Spaß mit Babsy! 🎉
