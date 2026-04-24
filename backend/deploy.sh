#!/bin/bash
set -e

echo "=== Deploying ADHD Task Manager Backend ==="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Login to Cloudflare
echo "Logging into Cloudflare..."
wrangler login

# Create D1 Database
echo "Creating D1 database..."
wrangler d1 create adhd-task-manager-db

# Create KV Namespace
echo "Creating KV namespace..."
wrangler kv:namespace create ADHD_TASK_KV

echo ""
echo "=== IMPORTANT: Update wrangler.toml with the database_id and kv_id ==="
echo ""
echo "Then run:"
echo "  wrangler d1 execute adhd-task-manager-db --file=db/schema.sql"
echo "  wrangler deploy"
echo ""
echo "Or run these commands manually after updating wrangler.toml:"