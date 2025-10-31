# Babsy Gutschein-Plattform

[![Docker Build](https://github.com/<username>/gutscheine.babsy.ch/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/<username>/gutscheine.babsy.ch/actions/workflows/docker-publish.yml)
[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

Eine moderne Web-Plattform für digitale Gutscheine, die es Partnern ermöglicht, Angebote zu erstellen und Kunden diese einzulösen.

## Features

### Für User
- 🔍 Gutscheine durchsuchen und filtern nach Kategorien
- 🎫 Gutscheine mit QR-Codes einlösen
- 🔐 OAuth-Authentifizierung (Google, GitHub)
- 📱 Responsive Design für alle Geräte

### Für Partner
- 🏢 Partner-Registrierung und Profilverwaltung
- ➕ Gutscheine erstellen und verwalten
- 📊 Dashboard mit Statistiken
- ⚙️ Flexible Einstellungen (Gültigkeit, Einlösungen, Rabatte)
- 🏷️ Kategorisierung der Gutscheine

### Für Admins
- ✅ Partner-Freigaben verwalten
- 📂 Kategorien erstellen und verwalten
- 👥 Benutzer- und Gutscheinverwaltung

## Tech Stack

- **Frontend & Backend**: Next.js 14+ (App Router) mit TypeScript
- **Datenbank**: PostgreSQL mit Prisma ORM
- **Authentifizierung**: NextAuth.js v5 (Auth.js) mit OAuth
- **Styling**: Tailwind CSS
- **QR-Codes**: qrcode Library
- **Icons**: React Icons

## Installation

Es gibt drei Möglichkeiten, die Plattform zu installieren:

### Option 1: GHCR (Production-Ready) 🚀

Verwende vorgebaute Images von GitHub Container Registry:

```bash
# 1. Umgebungsvariablen konfigurieren
cp .env.docker .env
# Bearbeite .env und füge OAuth-Credentials ein

# 2. Container mit GHCR Image starten
docker compose -f docker-compose.ghcr.yml up -d

# 3. Anwendung ist verfügbar unter http://localhost:3000
```

Detaillierte GHCR-Anleitung: Siehe [GHCR.md](GHCR.md)

### Option 2: Docker (Lokales Build) 🐳

Baue Images lokal:

```bash
# 1. Umgebungsvariablen konfigurieren
cp .env.docker .env
# Bearbeite .env und füge OAuth-Credentials ein

# 2. Container starten
docker compose up -d

# 3. Anwendung ist verfügbar unter http://localhost:3000
```

Detaillierte Docker-Anleitung: Siehe [DOCKER.md](DOCKER.md)

### Option 3: Lokale Installation

#### Voraussetzungen

- Node.js 18+ und npm
- PostgreSQL Datenbank
- OAuth-Credentials (Google und/oder GitHub)

#### Setup

1. Repository klonen

2. Dependencies installieren:
```bash
npm install
```

3. Umgebungsvariablen konfigurieren:
```bash
cp .env.example .env
# Bearbeite .env und füge Datenbank-URL und OAuth-Credentials ein
```

4. Datenbank Setup und Migrations:
```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
```

5. Development Server starten:
```bash
npm run dev
```

Die Anwendung ist nun unter http://localhost:3000 erreichbar.

## Lizenz

Alle Rechte vorbehalten.
