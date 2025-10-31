# Babsy Gutschein-Plattform

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

### Voraussetzungen

- Node.js 18+ und npm
- PostgreSQL Datenbank
- OAuth-Credentials (Google und/oder GitHub)

### Setup

1. Repository klonen
2. Dependencies installieren:
```bash
npm install
```

3. Umgebungsvariablen konfigurieren:
```bash
cp .env.example .env
```

4. Datenbank Setup und Migrations:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. Development Server starten:
```bash
npm run dev
```

Die Anwendung ist nun unter http://localhost:3000 erreichbar.

## Lizenz

Alle Rechte vorbehalten.
