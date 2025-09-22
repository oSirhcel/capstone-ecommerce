#!/bin/bash

# Test Database Operations Script
# This script runs database operations with the test environment

echo "🗄️  Test Database Operations"
echo "Database: postgresql://testuser:testpass@localhost:5444/ecom_test"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    exit 1
fi

# Backup current .env if it exists
if [ -f ".env" ]; then
    cp .env .env.backup
fi

# Apply test configuration
cp .env.local .env

echo "Available database operations:"
echo "1. Push schema to test database (db:push)"
echo "2. Run migrations on test database (db:migrate)"
echo "3. Open Drizzle Studio for test database (db:studio)"
echo "4. Generate migrations (db:generate)"
echo ""

read -p "Select operation (1-4): " choice

case $choice in
    1)
        echo "🔄 Pushing schema to test database..."
        npm run db:push
        ;;
    2)
        echo "🔄 Running migrations on test database..."
        npm run db:migrate
        ;;
    3)
        echo "🔄 Opening Drizzle Studio for test database..."
        npm run db:studio
        ;;
    4)
        echo "🔄 Generating migrations..."
        npm run db:generate
        ;;
    *)
        echo "❌ Invalid selection"
        ;;
esac

# Restore original environment
if [ -f ".env.backup" ]; then
    mv .env.backup .env
    echo "✅ Original environment restored"
fi
