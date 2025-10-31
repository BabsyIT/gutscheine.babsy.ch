#!/bin/bash

# Setup Script für GHCR Deployment
# Dieses Script hilft beim schnellen Setup der GHCR-Konfiguration

set -e

echo "🚀 Babsy GHCR Setup"
echo "==================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Kein Git-Repository gefunden!"
    echo "Bitte führe zuerst 'git init' aus."
    exit 1
fi

# Get GitHub username
echo "📝 GitHub Repository Information"
echo ""

# Try to get username from git remote
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

if [ -n "$CURRENT_REMOTE" ]; then
    echo "Gefundenes Git Remote: $CURRENT_REMOTE"
    # Extract username from URL
    if [[ $CURRENT_REMOTE =~ github.com[:/]([^/]+)/([^/.]+) ]]; then
        GITHUB_USER="${BASH_REMATCH[1]}"
        REPO_NAME="${BASH_REMATCH[2]}"
        echo "GitHub User: $GITHUB_USER"
        echo "Repository: $REPO_NAME"
        echo ""
        read -p "Ist das korrekt? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            GITHUB_USER=""
        fi
    fi
fi

# Ask for username if not found
if [ -z "$GITHUB_USER" ]; then
    read -p "GitHub Username/Organization: " GITHUB_USER
fi

echo ""
echo "✅ Verwende GitHub User: $GITHUB_USER"
echo ""

# Update docker-compose.ghcr.yml
echo "📝 Aktualisiere docker-compose.ghcr.yml..."
if [ -f "docker-compose.ghcr.yml" ]; then
    sed -i.bak "s|ghcr.io/<username>/gutscheine.babsy.ch|ghcr.io/$GITHUB_USER/gutscheine.babsy.ch|g" docker-compose.ghcr.yml
    rm docker-compose.ghcr.yml.bak 2>/dev/null || true
    echo "✅ docker-compose.ghcr.yml aktualisiert"
else
    echo "⚠️  docker-compose.ghcr.yml nicht gefunden"
fi

# Update README.md
echo "📝 Aktualisiere README.md..."
if [ -f "README.md" ]; then
    sed -i.bak "s|<username>|$GITHUB_USER|g" README.md
    rm README.md.bak 2>/dev/null || true
    echo "✅ README.md aktualisiert"
else
    echo "⚠️  README.md nicht gefunden"
fi

# Update GHCR.md
echo "📝 Aktualisiere GHCR.md..."
if [ -f "GHCR.md" ]; then
    sed -i.bak "s|<username>|$GITHUB_USER|g" GHCR.md
    rm GHCR.md.bak 2>/dev/null || true
    echo "✅ GHCR.md aktualisiert"
else
    echo "⚠️  GHCR.md nicht gefunden"
fi

echo ""
echo "🎉 Setup abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "=================="
echo ""
echo "1. Änderungen committen:"
echo "   git add ."
echo "   git commit -m 'Configure GHCR for $GITHUB_USER'"
echo ""
echo "2. Zum GitHub pushen:"
echo "   git remote add origin https://github.com/$GITHUB_USER/gutscheine.babsy.ch.git"
echo "   git push -u origin main"
echo ""
echo "3. GitHub Actions wird automatisch das Docker Image bauen"
echo ""
echo "4. Image verwenden:"
echo "   docker compose -f docker-compose.ghcr.yml up -d"
echo ""
echo "📖 Mehr Informationen in GHCR.md"
