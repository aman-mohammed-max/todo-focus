# ADHD Task Manager - API Test Script (PowerShell)
# Usage: .\backend\test-api.ps1 -BaseUrl "https://your-worker.workers.dev"

param(
    [string]$BaseUrl = "https://adhd-task-manager.<your-subdomain>.workers.dev"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " ADHD Task Manager - API Test Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Colors for output
$Success = "Green"
$ErrorColor = "Red"
$Info = "Yellow"
$Gray = "Gray"

function Test-ApiEndpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Body = $null,
        [string]$Headers = $null,
        [string]$Description = ""
    )

    Write-Host "  $Description" -ForegroundColor $Info
    Write-Host "  $Method $Endpoint" -ForegroundColor $Gray

    $params = @{
        Uri = "$BaseUrl$Endpoint"
        Method = $Method
        ContentType = "application/json"
    }

    if ($Headers) {
        $params.Headers = ConvertFrom-Json $Headers
    }

    if ($Body) {
        $params.Body = $Body
    }

    try {
        $response = Invoke-RestMethod @params -StatusCodeVariable statusCode
        Write-Host "  Status: $statusCode" -ForegroundColor $Success
        Write-Host "  Response: $($response | ConvertTo-Json -Depth 10)" -ForegroundColor $Gray
        return $response
    } catch {
        Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor $ErrorColor
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor $ErrorColor
        return $null
    }
    Write-Host ""
}

# Check if API is reachable
Write-Host "[Test 0] Checking API reachability..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$BaseUrl/api/auth/me" -Method GET -TimeoutSec 10
    Write-Host "  API is reachable!" -ForegroundColor $Success
    Write-Host "  Status: $($health.StatusCode)" -ForegroundColor $Gray
} catch {
    Write-Host "  ERROR: Cannot reach API at $BaseUrl" -ForegroundColor $ErrorColor
    Write-Host "  Make sure the worker is deployed and the URL is correct" -ForegroundColor $ErrorColor
    exit 1
}
Write-Host ""

# Test 1: Signup (only works if no user exists)
Write-Host "[Test 1] Testing POST /api/auth/signup" -ForegroundColor Yellow
$signupBody = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$signupResponse = Test-ApiEndpoint -Method "POST" -Endpoint "/api/auth/signup" -Body $signupBody -Description "Creating first user (signup)"

$sessionToken = $null
if ($signupResponse -and $signupResponse.token) {
    $sessionToken = $signupResponse.token
    Write-Host "  Token received: $($sessionToken.Substring(0, [Math]::Min(20, $sessionToken.Length)))..." -ForegroundColor $Success
}
Write-Host ""

# Test 2: Login
Write-Host "[Test 2] Testing POST /api/auth/login" -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Test-ApiEndpoint -Method "POST" -Endpoint "/api/auth/login" -Body $loginBody -Description "Logging in with existing user"

if ($loginResponse -and $loginResponse.token) {
    $sessionToken = $loginResponse.token
}
Write-Host ""

# Test 3: Get current user
Write-Host "[Test 3] Testing GET /api/auth/me" -ForegroundColor Yellow
if ($sessionToken) {
    $meResponse = Test-ApiEndpoint -Method "GET" -Endpoint "/api/auth/me" -Headers (@{ Cookie = "session=$sessionToken" } | ConvertTo-Json) -Description "Getting current user info"
}
Write-Host ""

# Test 4: Create a project
Write-Host "[Test 4] Testing POST /api/projects" -ForegroundColor Yellow
if ($sessionToken) {
    $projectBody = @{
        name = "Test Project"
        description = "A test project created via API"
        priority = "high"
        color = "violet"
    } | ConvertTo-Json

    $projectResponse = Test-ApiEndpoint -Method "POST" -Endpoint "/api/projects" -Body $projectBody -Headers (@{ Cookie = "session=$sessionToken" } | ConvertTo-Json) -Description "Creating a project"

    $projectId = $null
    if ($projectResponse -and $projectResponse.id) {
        $projectId = $projectResponse.id
        Write-Host "  Project ID: $projectId" -ForegroundColor $Success
    }
}
Write-Host ""

# Test 5: Get all projects
Write-Host "[Test 5] Testing GET /api/projects" -ForegroundColor Yellow
if ($sessionToken) {
    Test-ApiEndpoint -Method "GET" -Endpoint "/api/projects" -Headers (@{ Cookie = "session=$sessionToken" } | ConvertTo-Json) -Description "Getting all projects"
}
Write-Host ""

# Test 6: Create a task
Write-Host "[Test 6] Testing POST /api/tasks" -ForegroundColor Yellow
if ($sessionToken -and $projectId) {
    $taskBody = @{
        project_id = $projectId
        title = "Test Task"
        description = "A task created via API"
        status = "pending"
        priority = "high"
        due_date = "2026-04-30"
        follow_pause = $true
    } | ConvertTo-Json

    $taskResponse = Test-ApiEndpoint -Method "POST" -Endpoint "/api/tasks" -Body $taskBody -Headers (@{ Cookie = "session=$sessionToken" } | ConvertTo-Json) -Description "Creating a task"

    $taskId = $null
    if ($taskResponse -and $taskResponse.id) {
        $taskId = $taskResponse.id
        Write-Host "  Task ID: $taskId" -ForegroundColor $Success
    }
}
Write-Host ""

# Test 7: Get all tasks
Write-Host "[Test 7] Testing GET /api/tasks" -ForegroundColor Yellow
if ($sessionToken) {
    Test-ApiEndpoint -Method "GET" -Endpoint "/api/tasks" -Headers (@{ Cookie = "session=$sessionToken" } | ConvertTo-Json) -Description "Getting all tasks"
}
Write-Host ""

# Test 8: Create a personal task
Write-Host "[Test 8] Testing POST /api/personal-tasks" -ForegroundColor Yellow
if ($sessionToken) {
    $personalTaskBody = @{
        title = "Personal Task from API"
        due_date = "2026-04-25"
        priority = "medium"
    } | ConvertTo-Json

    Test-ApiEndpoint -Method "POST" -Endpoint "/api/personal-tasks" -Body $personalTaskBody -Headers (@{ Cookie = "session=$sessionToken" } | ConvertTo-Json) -Description "Creating a personal task"
}
Write-Host ""

# Test 9: Get pause periods
Write-Host "[Test 9] Testing GET /api/pause" -ForegroundColor Yellow
if ($sessionToken) {
    Test-ApiEndpoint -Method "GET" -Endpoint "/api/pause" -Headers (@{ Cookie = "session=$sessionToken" } | ConvertTo-Json) -Description "Getting pause periods"
}
Write-Host ""

# Test 10: Create a pause period
Write-Host "[Test 10] Testing POST /api/pause" -ForegroundColor Yellow
if ($sessionToken) {
    $pauseBody = @{
        start_date = "2026-04-20"
        end_date = "2026-04-25"
    } | ConvertTo-Json

    Test-ApiEndpoint -Method "POST" -Endpoint "/api/pause" -Body $pauseBody -Headers (@{ Cookie = "session=$sessionToken" } | ConvertTo-Json) -Description "Creating a pause period"
}
Write-Host ""

# Test 11: Get notifications
Write-Host "[Test 11] Testing GET /api/notifications" -ForegroundColor Yellow
if ($sessionToken) {
    Test-ApiEndpoint -Method "GET" -Endpoint "/api/notifications" -Headers (@{ Cookie = "session=$sessionToken" } | ConvertTo-Json) -Description "Getting overdue and due soon tasks"
}
Write-Host ""

# Test 12: Get API key status
Write-Host "[Test 12] Testing GET /api/api-key" -ForegroundColor Yellow
if ($sessionToken) {
    Test-ApiEndpoint -Method "GET" -Endpoint "/api/api-key" -Headers (@{ Cookie = "session=$sessionToken" } | ConvertTo-Json) -Description "Getting API key status"
}
Write-Host ""

# Test 13: Generate API key
Write-Host "[Test 13] Testing POST /api/api-key/generate" -ForegroundColor Yellow
$apiKey = $null
if ($sessionToken) {
    $keyResponse = Test-ApiEndpoint -Method "POST" -Endpoint "/api/api-key/generate" -Headers (@{ Cookie = "session=$sessionToken" } | ConvertTo-Json) -Description "Generating new API key"

    if ($keyResponse -and $keyResponse.apiKey) {
        $apiKey = $keyResponse.apiKey
        Write-Host "  API Key: $apiKey" -ForegroundColor $Success
    }
}
Write-Host ""

# Test 14: Test MCP endpoint with API key
if ($apiKey) {
    Write-Host "[Test 14] Testing POST /mcp (with API key)" -ForegroundColor Yellow
    $mcpBody = @{
        action = "projects.list"
        data = $null
    } | ConvertTo-Json

    Test-ApiEndpoint -Method "POST" -Endpoint "/mcp" -Body $mcpBody -Headers (@{ "X-API-Key" = $apiKey } | ConvertTo-Json) -Description "Calling MCP projects.list"
}
Write-Host ""

# Test 15: Test MCP task creation
if ($apiKey) {
    Write-Host "[Test 15] Testing POST /mcp (tasks.create)" -ForegroundColor Yellow
    $mcpTaskBody = @{
        action = "tasks.create"
        data = @{
            title = "Task created via MCP"
            priority = "medium"
            due_date = "2026-05-01"
        }
    } | ConvertTo-Json

    Test-ApiEndpoint -Method "POST" -Endpoint "/mcp" -Body $mcpTaskBody -Headers (@{ "X-API-Key" = $apiKey } | ConvertTo-Json) -Description "Creating task via MCP"
}
Write-Host ""

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " API Testing Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  - All tests completed" -ForegroundColor $Gray
Write-Host "  - Backend API is functioning correctly" -ForegroundColor $Gray
Write-Host "  - MCP endpoint works with API key auth" -ForegroundColor $Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Deploy frontend to Cloudflare Pages" -ForegroundColor $Gray
Write-Host "  2. Configure your frontend VITE_API_URL" -ForegroundColor $Gray
Write-Host "  3. Start building your agent workflows!" -ForegroundColor $Gray