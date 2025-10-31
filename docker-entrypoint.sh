#!/bin/sh
set -e

echo "🚀 Starting Babsy Gutschein Platform..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until nc -z -v -w30 postgres 5432
do
  echo "Waiting for database connection..."
  sleep 1
done

echo "✅ PostgreSQL is ready!"

# Run database migrations
echo "🔧 Running database migrations..."
npx prisma migrate deploy

# Seed database (optional, only on first run)
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Seeding database..."
  npx prisma db seed || echo "⚠️  Seed failed or already completed"
fi

echo "✅ Database setup complete!"
echo "🎉 Starting application..."

# Execute the CMD from Dockerfile
exec "$@"
