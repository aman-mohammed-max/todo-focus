# ADHD Task Manager - Deploy Script (PowerShell)
# Run from project root: .\backend\deploy.ps1

param(
    [string]$AccountId = "",
    [switch]$SkipLogin,
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$BackendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $BackendDir

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " ADHD Task Manager - Full Stack Deploy" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check prerequisites
Write-Host "[1/8] Checking prerequisites..." -ForegroundColor Yellow

$WranglerVersion = & wrangler --version 2>$null
if (-not $WranglerVersion) {
    Write-Host "  Installing wrangler globally..." -ForegroundColor Gray
    npm install -g wrangler
}

# Step 2: Login to Cloudflare
if (-not $SkipLogin) {
    Write-Host "[2/8] Logging into Cloudflare..." -ForegroundColor Yellow
    Write-Host "  Run 'wrangler login' in your browser" -ForegroundColor Gray
    & wrangler login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Cloudflare login failed" -ForegroundColor Red
        exit 1
    }
}

# Step 3: Create D1 Database
Write-Host "[3/8] Creating D1 database..." -ForegroundColor Yellow
$DbOutput = & wrangler d1 create adhd-task-manager-db 2>&1 | Out-String
Write-Host "  Database creation output received" -ForegroundColor Gray

# Extract database_id
$DbIdMatch = [regex]::Match($DbOutput, '"database_id"\s*:\s*"([^"]+)"')
if ($DbIdMatch.Success) {
    $DatabaseId = $DbIdMatch.Groups[1].Value
    Write-Host "  Database ID: $($DatabaseId.Substring(0, [Math]::Min(8, $DatabaseId.Length)))..." -ForegroundColor Green
} else {
    Write-Host "  Could not extract database_id from output. Trying to find existing..." -ForegroundColor Gray
    $ExistingDb = & wrangler d1 list 2>&1 | Out-String
    $DbIdMatch = [regex]::Match($ExistingDb, 'adhd-task-manager-db\s+([a-f0-9-]+)')
    if ($DbIdMatch.Success) {
        $DatabaseId = $DbIdMatch.Groups[1].Value
        Write-Host "  Using existing Database ID: $($DatabaseId.Substring(0, [Math]::Min(8, $DatabaseId.Length)))..." -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Could not find or create database" -ForegroundColor Red
        Write-Host "  Please create manually at: https://dash.cloudflare.com/d1" -ForegroundColor Red
        $DatabaseId = Read-Host "Enter database_id manually"
    }
}

# Step 4: Create KV Namespace
Write-Host "[4/8] Creating KV namespace..." -ForegroundColor Yellow
$KvOutput = & wrangler kv:namespace create ADHD_TASK_KV 2>&1 | Out-String

# Extract KV id
$KvIdMatch = [regex]::Match($KvOutput, '"id"\s*:\s*"([^"]+)"')
if ($KvIdMatch.Success) {
    $KvId = $KvIdMatch.Groups[1].Value
    Write-Host "  KV ID: $($KvId.Substring(0, [Math]::Min(8, $KvId.Length)))..." -ForegroundColor Green
} else {
    Write-Host "  Could not extract KV id from output. Trying to find existing..." -ForegroundColor Gray
    $ExistingKv = & wrangler kv:namespace list 2>&1 | Out-String
    $KvIdMatch = [regex]::Match($ExistingKv, 'ADHD_TASK_KV\s+([a-f0-9-]+)')
    if ($KvIdMatch.Success) {
        $KvId = $KvIdMatch.Groups[1].Value
        Write-Host "  Using existing KV ID: $($KvId.Substring(0, [Math]::Min(8, $KvId.Length)))..." -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Could not find or create KV namespace" -ForegroundColor Red
        Write-Host "  Please create manually at: https://dash.cloudflare.com/workers-and-pages/kv" -ForegroundColor Red
        $KvId = Read-Host "Enter KV id manually"
    }
}

# Step 5: Update wrangler.toml
Write-Host "[5/8] Updating wrangler.toml..." -ForegroundColor Yellow
$WranglerTomlPath = Join-Path $BackendDir "wrangler.toml"
$WranglerContent = Get-Content $WranglerTomlPath -Raw
$WranglerContent = $WranglerContent -replace 'database_id = "YOUR_D1_DATABASE_ID_HERE"', "database_id = ""$DatabaseId"""
$WranglerContent = $WranglerContent -replace 'id = "YOUR_KV_NAMESPACE_ID_HERE"', "id = ""$KvId"""
Set-Content -Path $WranglerTomlPath -Value $WranglerContent -NoNewline
Write-Host "  wrangler.toml updated" -ForegroundColor Green

# Step 6: Install backend dependencies
Write-Host "[6/8] Installing backend dependencies..." -ForegroundColor Yellow
Push-Location $BackendDir
try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    Write-Host "  Dependencies installed" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 7: Apply database schema
Write-Host "[7/8] Applying database schema..." -ForegroundColor Yellow
$SchemaPath = Join-Path $BackendDir "db\schema.sql"
& wrangler d1 execute adhd-task-manager-db --file=$SchemaPath --local
if ($LASTEXITCODE -ne 0) {
    Write-Host "  WARNING: Local schema apply had issues, trying remote..." -ForegroundColor Gray
    & wrangler d1 execute adhd-task-manager-db --file=$SchemaPath --remote
}
Write-Host "  Schema applied" -ForegroundColor Green

# Step 8: Deploy Worker
Write-Host "[8/8] Deploying Worker..." -ForegroundColor Yellow
Push-Location $BackendDir
try {
    & wrangler deploy
    if ($LASTEXITCODE -ne 0) { throw "wrangler deploy failed" }
    Write-Host "  Worker deployed!" -ForegroundColor Green
} finally {
    Pop-Location
}

# Frontend deployment instructions
if (-not $SkipFrontend) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host " Backend deployed successfully!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps for frontend:" -ForegroundColor Yellow
    Write-Host "  1. Build the frontend:" -ForegroundColor Gray
    Write-Host "     cd frontend" -ForegroundColor Gray
    Write-Host "     bun install" -ForegroundColor Gray
    Write-Host "     bun run build" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Deploy to Cloudflare Pages:" -ForegroundColor Gray
    Write-Host "     - Go to https://dash.cloudflare.com/pages" -ForegroundColor Gray
    Write-Host "     - Create a new project" -ForegroundColor Gray
    Write-Host "     - Upload the 'frontend/dist/public' folder" -ForegroundColor Gray
    Write-Host "     - Set build output directory: dist/public" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Or use Wrangler Pages:" -ForegroundColor Gray
    Write-Host "     npx wrangler pages deploy frontend/dist/public" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host " Backend deployed successfully!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Worker URL: https://adhd-task-manager.<your-subdomain>.workers.dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Test your API:" -ForegroundColor Cyan
Write-Host '  $response = Invoke-RestMethod -Uri "https://adhd-task-manager.<your-subdomain>.workers.dev/api/auth/me" -Method GET' -ForegroundColor Gray
Write-Host '  $response  # Should return: {"error":"Unauthorized"}' -ForegroundColor Gray