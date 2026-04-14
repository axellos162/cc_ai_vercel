#!/bin/bash

# Shopify Scraper Runner
# Usage:
#   ./run-scraper.sh              # Scrape all stores
#   ./run-scraper.sh elkel.nyc    # Scrape single store by domain

set -e

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  echo "Please create .env file with your credentials:"
  echo "  SUPABASE_URL=your_url"
  echo "  SUPABASE_SERVICE_ROLE_KEY=your_key"
  echo "  OPENAI_API_KEY=your_key"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

if [ -z "$1" ]; then
  echo "🚀 Starting scraper for all stores..."
  node src/index.js
else
  echo "🚀 Starting scraper for $1..."
  node src/index.js --store "$1"
fi
