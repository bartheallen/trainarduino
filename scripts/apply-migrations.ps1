# Apply SQL migrations to Supabase PostgreSQL database
# Usage: Set $env:DATABASE_URL to Supabase DB connection string, then run this script
# Example: $env:DATABASE_URL = "postgres://postgres:password@db.supabase.co:5432/postgres"
# Then: ./scripts/apply-migrations.ps1

# Color codes for output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

Write-Host "====================================================================" -ForegroundColor $InfoColor
Write-Host "Supabase Migration Script - Apply Migrations" -ForegroundColor $InfoColor
Write-Host "====================================================================" -ForegroundColor $InfoColor
Write-Host ""

# 1. Verify DATABASE_URL is set
if (-not $env:DATABASE_URL) {
  Write-Host "ERROR: DATABASE_URL environment variable is not set." -ForegroundColor $ErrorColor
  Write-Host "" -ForegroundColor $ErrorColor
  Write-Host "How to set DATABASE_URL:" -ForegroundColor $WarningColor
  Write-Host "1. Go to https://app.supabase.com" -ForegroundColor $WarningColor
  Write-Host "2. Select your project" -ForegroundColor $WarningColor
  Write-Host "3. Click 'Settings' -> 'Database'" -ForegroundColor $WarningColor
  Write-Host "4. Copy the 'Connection string' (URI) under the Postgres section" -ForegroundColor $WarningColor
  Write-Host "5. Set environment variable:" -ForegroundColor $WarningColor
  Write-Host "   \$env:DATABASE_URL = \"postgres://...\"" -ForegroundColor $WarningColor
  Write-Host "6. Re-run this script" -ForegroundColor $WarningColor
  exit 1
}

# 2. Check if psql is available
$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlCmd) {
  Write-Host "ERROR: psql command not found in PATH." -ForegroundColor $ErrorColor
  Write-Host "" -ForegroundColor $ErrorColor
  Write-Host "How to install PostgreSQL client tools:" -ForegroundColor $WarningColor
  Write-Host "- Windows (Chocolatey): choco install postgresql" -ForegroundColor $WarningColor
  Write-Host "- Windows (Official): Download from https://www.postgresql.org/download/windows/" -ForegroundColor $WarningColor
  Write-Host "- macOS (Homebrew): brew install postgresql" -ForegroundColor $WarningColor
  Write-Host "- Linux (apt): sudo apt-get install postgresql-client" -ForegroundColor $WarningColor
  Write-Host "" -ForegroundColor $WarningColor
  Write-Host "Or use Supabase SQL Editor instead:" -ForegroundColor $InfoColor
  Write-Host "1. Go to https://app.supabase.com" -ForegroundColor $InfoColor
  Write-Host "2. Open 'SQL Editor'" -ForegroundColor $InfoColor
  Write-Host "3. Create new query" -ForegroundColor $InfoColor
  Write-Host "4. Paste content of database/migrations.sql" -ForegroundColor $InfoColor
  Write-Host "5. Click 'Run'" -ForegroundColor $InfoColor
  exit 2
}

# 3. Find migrations.sql file
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$migrationFile = Join-Path $projectRoot "database\migrations.sql"

if (-not (Test-Path $migrationFile)) {
  Write-Host "ERROR: migrations.sql not found at $migrationFile" -ForegroundColor $ErrorColor
  Write-Host "Expected path: $migrationFile" -ForegroundColor $ErrorColor
  exit 3
}

Write-Host "Database URL: $(($env:DATABASE_URL -split '@')[1] ?? 'hidden')" -ForegroundColor $InfoColor
Write-Host "Migration file: $migrationFile" -ForegroundColor $InfoColor
Write-Host "File size: $((Get-Item $migrationFile).Length) bytes" -ForegroundColor $InfoColor
Write-Host ""

# 4. Test connection to database
Write-Host "Testing database connection..." -ForegroundColor $InfoColor
$testResult = & psql $env:DATABASE_URL -c "SELECT version();" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: Failed to connect to database" -ForegroundColor $ErrorColor
  Write-Host "Connection test output:" -ForegroundColor $ErrorColor
  Write-Host $testResult -ForegroundColor $ErrorColor
  exit 4
}
Write-Host "Connection test PASSED" -ForegroundColor $SuccessColor
Write-Host ""

# 5. Get database info
Write-Host "Database information:" -ForegroundColor $InfoColor
$dbInfo = & psql $env:DATABASE_URL -c "SELECT current_database(), current_user, version();" 2>&1
Write-Host $dbInfo -ForegroundColor $InfoColor
Write-Host ""

# 6. Apply migrations
Write-Host "Applying migrations..." -ForegroundColor $InfoColor
Write-Host "================================================================" -ForegroundColor $InfoColor
$migrationOutput = & psql $env:DATABASE_URL -f $migrationFile 2>&1
$migrationExitCode = $LASTEXITCODE

if ($migrationExitCode -ne 0) {
  Write-Host "ERROR: Migration failed with exit code $migrationExitCode" -ForegroundColor $ErrorColor
  Write-Host "" -ForegroundColor $ErrorColor
  Write-Host "Migration output:" -ForegroundColor $ErrorColor
  Write-Host $migrationOutput -ForegroundColor $ErrorColor
  exit $migrationExitCode
}

Write-Host $migrationOutput -ForegroundColor $InfoColor
Write-Host "================================================================" -ForegroundColor $InfoColor
Write-Host ""

Write-Host "Migrations applied successfully!" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "Next steps:" -ForegroundColor $InfoColor
Write-Host "1. Run verification: ./scripts/verify-migrations.ps1" -ForegroundColor $InfoColor
Write-Host "2. Check tables in Supabase Dashboard: https://app.supabase.com" -ForegroundColor $InfoColor
Write-Host "3. Test your application" -ForegroundColor $InfoColor
Write-Host ""