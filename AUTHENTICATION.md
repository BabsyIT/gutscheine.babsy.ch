# Babsy Gutscheine - Authentifizierungs-System

## Übersicht

Die Plattform unterstützt **drei verschiedene Authentifizierungsmethoden** für unterschiedliche Benutzergruppen:

1. **Entra ID (Azure AD)** - für Babsy Mitarbeiter
2. **Babsy App API** - für Sitter, Parents, Partner und Members
3. **Email OTP** - für Geschäftspartner (Fallback)

## Benutzerrollen

### UserRole
- `USER` - Reguläre Benutzer (Sitter, Parents, Members)
- `PARTNER` - Geschäftspartner
- `ADMIN` - Babsy Mitarbeiter

### BabsyUserType
- `SITTER` - Babysitter aus der Babsy App
- `PARENT` - Eltern aus der Babsy App
- `PARTNER` - Partner aus der Babsy App
- `MEMBER` - Mitglieder aus der Babsy App

### AuthMethod
- `ENTRA_ID` - Microsoft Entra ID (Azure AD)
- `BABSY_APP` - Babsy App API Token
- `OTP` - Email One-Time Password
- `OAUTH` - Legacy (Google, GitHub - deaktiviert)

## 1. Entra ID / Azure AD (Mitarbeiter)

### Konfiguration

Erstellen Sie eine App-Registrierung in Azure:

1. **Azure Portal** → App registrations → New registration
2. **Redirect URI**: `https://your-domain.com/api/auth/callback/azure-ad`
3. **API Permissions**:
   - Microsoft Graph: `openid`
   - Microsoft Graph: `profile`
   - Microsoft Graph: `email`
   - Microsoft Graph: `User.Read`

4. **Certificates & secrets** → New client secret

### Umgebungsvariablen

```env
# Azure AD / Entra ID
AZURE_AD_CLIENT_ID=your-application-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id  # z.B. babsy.onmicrosoft.com
```

### Verhalten

- Nur `@babsy.ch` E-Mail-Adressen werden akzeptiert
- Automatische Rolle: `ADMIN`
- AuthMethod: `ENTRA_ID`

### API

```typescript
// Automatisch via NextAuth
await signIn('azure-ad', { callbackUrl: '/admin' })
```

## 2. Babsy App API (Sitter, Parents, Partner, Members)

### Konfiguration

Die Babsy App stellt einen API-Endpunkt bereit, der Tokens verifiziert.

### Umgebungsvariablen

```env
# Babsy App API
BABSY_APP_API_URL=https://api.babsy.ch/v1
BABSY_APP_API_KEY=your-api-key
```

### API Endpunkt

**POST** `/api/auth/babsy/verify`

Request:
```json
{
  "token": "babsy-app-token-from-mobile-app"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "Erfolgreich über Babsy App angemeldet",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Max Mustermann",
    "role": "USER",
    "babsyUserType": "SITTER"
  },
  "redirectTo": "/vouchers"
}
```

### Babsy App API Spezifikation

Die Babsy App API muss folgende Endpunkte bereitstellen:

#### POST /auth/verify
```json
{
  "token": "string"
}
```

Response:
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "firstName": "string",
    "lastName": "string",
    "type": "SITTER" | "PARENT" | "PARTNER" | "MEMBER",
    "verified": boolean
  }
}
```

#### GET /users/{userId}
Response: Same as above

### Workflow

1. User öffnet Babsy App
2. App generiert Token (JWT oder Session-Token)
3. User gibt Token auf Webseite ein
4. Webseite verifiziert Token bei Babsy API
5. User wird erstellt/aktualisiert und Session erstellt

## 3. Email OTP (Partner Fallback)

### Konfiguration

Verwendet Exchange Online mit OAuth2 für E-Mail-Versand.

### Exchange Online Setup

1. **Azure Portal** → App registrations → New registration
2. **API Permissions**:
   - Microsoft Graph: `Mail.Send`
   - Microsoft Graph: `SMTP.Send`
3. **Certificates & secrets** → New client secret

4. **Exchange Online** → Postfach erstellen:
   - z.B. `noreply@babsy.ch`
   - Mailbox-Type: Shared oder User

5. **Token generieren**:
```bash
# Mit Azure CLI oder PowerShell
# Refresh Token für OAuth2 flow generieren
```

### Umgebungsvariablen

```env
# Exchange Online OAuth2
EXCHANGE_USER=noreply@babsy.ch
EXCHANGE_CLIENT_ID=your-application-id
EXCHANGE_CLIENT_SECRET=your-client-secret
EXCHANGE_REFRESH_TOKEN=your-refresh-token
EXCHANGE_ACCESS_TOKEN=your-access-token  # optional, wird automatisch erneuert
```

### API Endpunkte

#### POST /api/auth/otp/request

Request:
```json
{
  "email": "partner@firma.ch"
}
```

Response:
```json
{
  "success": true,
  "message": "Ein Login-Code wurde an Ihre E-Mail-Adresse gesendet.",
  "email": "partner@firma.ch"
}
```

#### POST /api/auth/otp/verify

Request:
```json
{
  "email": "partner@firma.ch",
  "code": "123456"
}
```

Response:
```json
{
  "success": true,
  "message": "Erfolgreich angemeldet",
  "user": {
    "id": "user-id",
    "email": "partner@firma.ch",
    "role": "PARTNER",
    "isPartner": true,
    "partnerApproved": false
  },
  "redirectTo": "/partner/pending"
}
```

### Domain-Einschränkungen

Folgende Domains sind **nicht** für Partner-OTP erlaubt:
- gmail.com
- yahoo.com
- hotmail.com
- outlook.com
- icloud.com
- proton.me
- protonmail.com

Nur geschäftliche E-Mail-Domains werden akzeptiert.

### Sicherheit

- **Rate Limiting**: Max. 1 OTP pro Minute pro E-Mail
- **Gültigkeit**: 10 Minuten
- **Einmalverwendung**: Token wird nach Verwendung ungültig
- **Auto-Cleanup**: Abgelaufene Tokens werden automatisch gelöscht

## Datenbank-Schema

### User Model
```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  role          UserRole       @default(USER)
  authMethod    AuthMethod     @default(OAUTH)
  babsyUserId   String?        @unique
  babsyUserType BabsyUserType?
  // ...
}
```

### OtpToken Model
```prisma
model OtpToken {
  id        String   @id @default(cuid())
  userId    String
  email     String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  // ...
}
```

## Migration

```bash
# Prisma Schema aktualisiert - Migration erstellen
npx prisma migrate dev --name add_multi_auth

# Prisma Client neu generieren
npx prisma generate
```

## Sign-In UI

Die neue Sign-In Seite (`/auth/signin`) bietet:

1. **Auswahl-Screen**: User wählt Authentifizierungsmethode
2. **Method-Spezifische Formulare**:
   - Entra ID: Single Button → Redirect zu Microsoft
   - Babsy App: Token-Eingabefeld
   - Partner OTP: E-Mail → Code-Eingabe (2-Step)

### Screenshots (Beschreibung)

**Schritt 1**: Drei große Karten:
- 🏢 Babsy Mitarbeiter (Lila)
- 📱 Sitter & Parents (Blau)
- 🏪 Geschäftspartner (Grün)

**Schritt 2a - Mitarbeiter**: Microsoft Login Button

**Schritt 2b - Babsy App**:
- Token-Eingabefeld
- Anleitung zum Token-Abruf

**Schritt 2c - Partner**:
- Phase 1: E-Mail-Eingabe
- Phase 2: 6-stelliger Code-Eingabe

## Testing

### Entra ID
1. Erstelle Test-User in Azure AD mit @babsy.ch Domain
2. Teste Login-Flow
3. Prüfe Admin-Rolle

### Babsy App
1. Mock Babsy API für Development:
```typescript
// src/lib/babsy-api.ts - Development Mode
if (process.env.NODE_ENV === 'development') {
  return {
    success: true,
    user: {
      id: 'test-123',
      email: 'test@babsy.app',
      name: 'Test User',
      type: 'SITTER',
      verified: true
    }
  }
}
```

### OTP
1. Konfiguriere SMTP mit Mailtrap/Mailhog für Testing
2. Teste E-Mail-Versand
3. Teste Code-Verifizierung
4. Teste Ablauf und Fehlerbehandlung

## Deployment Checklist

- [ ] Azure AD App registriert
- [ ] Exchange Online Postfach erstellt
- [ ] OAuth2 Tokens generiert
- [ ] Babsy App API-Key erhalten
- [ ] Umgebungsvariablen gesetzt
- [ ] Prisma Migration durchgeführt
- [ ] Sign-In Page deployed
- [ ] Redirect URIs konfiguriert
- [ ] DNS/Domain konfiguriert
- [ ] SSL-Zertifikat aktiv

## Troubleshooting

### Entra ID Login funktioniert nicht
- Prüfe Tenant ID
- Prüfe Redirect URI
- Prüfe API Permissions (Admin Consent?)
- Prüfe @babsy.ch Domain-Einschränkung

### OTP E-Mails kommen nicht an
- Prüfe Exchange OAuth2 Token
- Prüfe SMTP-Verbindung
- Prüfe Postfach-Konfiguration
- Prüfe Spam-Ordner

### Babsy App Token ungültig
- Prüfe API-Endpunkt Erreichbarkeit
- Prüfe API-Key
- Prüfe Token-Format
- Logs der Babsy App API prüfen

## Sicherheitshinweise

1. **Secrets nie committen**
2. **Rate Limiting aktiviert**
3. **HTTPS in Production**
4. **Session-Cookies: httpOnly, secure, sameSite**
5. **Input Validation (Zod)**
6. **SQL Injection Prevention (Prisma)**

## Support

Bei Problemen:
1. Logs prüfen: `/var/log/app/auth.log`
2. Database prüfen: `SELECT * FROM "OtpToken" WHERE used = false`
3. GitHub Issues erstellen mit Details

---

Dokumentation erstellt: ${new Date().toISOString()}
Version: 1.0
