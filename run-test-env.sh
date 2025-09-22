#!/bin/bash

# Test Environment Runner Script
# This script sets up and runs the application with the test database configuration

echo "🧪 Setting up test environment..."
echo "📁 Project: capstone-OG"
echo "🗄️  Database: postgresql://testuser:testpass@localhost:5444/ecom_test"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please ensure .env.local exists with your test database configuration."
    exit 1
fi

# Backup current .env if it exists
if [ -f ".env" ]; then
    echo "📦 Backing up current .env to .env.backup..."
    cp .env .env.backup
fi

# Copy test environment configuration
echo "🔄 Applying test environment configuration..."
cp .env.local .env

echo "✅ Test environment configured successfully!"
echo ""
echo "🚀 Starting development server with test database..."
echo "   - Test Database: localhost:5444/ecom_test"
echo "   - Server will start at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server and restore original environment"
echo ""

# Function to restore environment on exit
cleanup() {
    echo ""
    echo "🛑 Stopping test environment..."
    
    # Restore original .env if backup exists
    if [ -f ".env.backup" ]; then
        echo "🔄 Restoring original .env..."
        mv .env.backup .env
        echo "✅ Original environment restored"
    fi
    
    echo "👋 Test environment cleanup complete"
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start the development server
npm run dev
