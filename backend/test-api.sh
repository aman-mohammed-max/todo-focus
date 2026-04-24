#!/bin/bash

# Test script for ADHD Task Manager API
# Usage: ./test-api.sh <BASE_URL>

BASE_URL="${1:-http://localhost:8787}"

echo "=== Testing ADHD Task Manager API ==="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Signup (first user only)
echo "1. Testing signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}')
echo "Response: $SIGNUP_RESPONSE"

# Extract session cookie
SESSION_TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Session token: $SESSION_TOKEN"
echo ""

if [ -z "$SESSION_TOKEN" ]; then
    echo "Login instead..."
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","password":"password123"}')
    echo "Response: $LOGIN_RESPONSE"
    SESSION_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

COOKIE="session=$SESSION_TOKEN"
echo "Using cookie: $COOKIE"
echo ""

# Test 2: Get projects
echo "2. Getting projects..."
curl -s -X GET "$BASE_URL/api/projects" -H "Cookie: $COOKIE"
echo ""
echo ""

# Test 3: Create project
echo "3. Creating project..."
curl -s -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{"name":"Test Project","description":"A test project","priority":"high","color":"violet"}'
echo ""
echo ""

# Test 4: Get API key
echo "4. Getting API key status..."
curl -s -X GET "$BASE_URL/api/api-key" -H "Cookie: $COOKIE"
echo ""
echo ""

# Test 5: Generate API key
echo "5. Generating API key..."
API_KEY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/api-key/generate" -H "Cookie: $COOKIE")
echo "Response: $API_KEY_RESPONSE"
API_KEY=$(echo $API_KEY_RESPONSE | grep -o '"apiKey":"[^"]*"' | cut -d'"' -f4)
echo ""
echo ""

if [ -n "$API_KEY" ]; then
    echo "6. Testing MCP endpoint with API key..."
    curl -s -X POST "$BASE_URL/mcp" \
      -H "Content-Type: application/json" \
      -H "X-API-Key: $API_KEY" \
      -d '{"action":"projects.list"}'
    echo ""
fi

echo ""
echo "=== API Tests Complete ==="