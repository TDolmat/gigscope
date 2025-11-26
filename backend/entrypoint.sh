#!/bin/bash
set -e

echo "🔄 Waiting for database..."

# Wait for PostgreSQL to be ready
while ! python -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.close()
    exit(0)
except:
    exit(1)
" 2>/dev/null; do
    echo "⏳ Database not ready, waiting..."
    sleep 2
done

echo "✅ Database is ready!"

echo "🔄 Running database migrations..."
flask db upgrade

echo "✅ Migrations complete!"

echo "🚀 Starting Gunicorn..."
exec gunicorn -c gunicorn.conf.py app:app

