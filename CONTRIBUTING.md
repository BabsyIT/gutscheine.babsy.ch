# Contributing to Babsy Gutschein-Plattform

Vielen Dank für dein Interesse an der Babsy Gutschein-Plattform!

## Entwicklung

### Setup

1. Repository forken und klonen
2. Dependencies installieren:
   ```bash
   npm install
   ```
3. Datenbank setup (siehe README.md)
4. Development Server starten:
   ```bash
   npm run dev
   ```

### Branches

- `main` - Production-ready Code
- `develop` - Development Branch
- `feature/*` - Feature Branches
- `bugfix/*` - Bugfix Branches

### Workflow

1. Feature Branch erstellen:
   ```bash
   git checkout -b feature/mein-feature
   ```

2. Änderungen machen und testen

3. Committen:
   ```bash
   git add .
   git commit -m "feat: Beschreibung des Features"
   ```

4. Pushen und Pull Request erstellen:
   ```bash
   git push origin feature/mein-feature
   ```

### Commit Messages

Verwende [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Neue Features
- `fix:` - Bugfixes
- `docs:` - Dokumentation
- `style:` - Code-Formatierung
- `refactor:` - Code-Refactoring
- `test:` - Tests
- `chore:` - Build/Tooling

### Code Style

- TypeScript strict mode
- ESLint Regeln befolgen
- Prettier für Formatierung

```bash
npm run lint
```

### Testing

```bash
# Tests ausführen (wenn vorhanden)
npm test
```

### Docker Testing

```bash
# Lokal builden und testen
docker compose up --build

# GHCR Image testen
docker compose -f docker-compose.ghcr.yml up
```

## Pull Requests

### Checklist

- [ ] Code folgt dem Projekt-Style
- [ ] Tests wurden hinzugefügt/aktualisiert
- [ ] Dokumentation wurde aktualisiert
- [ ] Build läuft erfolgreich
- [ ] Docker Image baut erfolgreich

### Beschreibung

Pull Requests sollten enthalten:

1. **Was** wurde geändert
2. **Warum** die Änderung notwendig war
3. **Wie** es getestet wurde
4. Screenshots (bei UI-Änderungen)

## Lizenz

Durch Beiträge akzeptierst du, dass dein Code unter der Projekt-Lizenz veröffentlicht wird.
