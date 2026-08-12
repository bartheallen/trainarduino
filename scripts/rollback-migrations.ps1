# Rollback Supabase migrations - drop tables (WARNING: destructive operation)
# Usage: Set $env:DATABASE_URL, then run this script
# WARNING: This will DELETE all data in migration tables
# Example: $env:DATABASE_URL = "postgres://postgres:password@db.supabase.co:5432/postgres"
# Then: ./scripts/rollback-migrations.ps1

$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

Write-Host "====================================================================" -ForegroundColor $WarningColor
Write-Host "⚠️  SUPABASE MIGRATION ROLLBACK - DESTRUCTIVE OPERATION" -ForegroundColor $WarningColor
Write-Host "====================================================================" -ForegroundColor $WarningColor
Write-Host ""
Write-Host "WARNING: This will DELETE all data in the following tables:" -ForegroundColor $ErrorColor
Write-Host "- recommendation_weights" -ForegroundColor $ErrorColor
Write-Host "- recommendation_history" -ForegroundColor $ErrorColor
Write-Host "- recommendation_feedback" -ForegroundColor $ErrorColor
Write-Host "- learning_dna" -ForegroundColor $ErrorColor
Write-Host "- concept_states" -ForegroundColor $ErrorColor
Write-Host "- concept_mastery_history" -ForegroundColor $ErrorColor
Write-Host "- And many others (see database/migrations.sql)" -ForegroundColor $ErrorColor
Write-Host ""

# Require confirmation
$confirm = Read-Host "Are you absolutely sure you want to rollback? Type 'yes' to confirm"
if ($confirm -ne "yes") {
  Write-Host "Rollback cancelled." -ForegroundColor $InfoColor
  exit 0
}

# 1. Verify DATABASE_URL
if (-not $env:DATABASE_URL) {
  Write-Host "ERROR: DATABASE_URL not set" -ForegroundColor $ErrorColor
  exit 1
}

# 2. Check psql
$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlCmd) {
  Write-Host "ERROR: psql not found in PATH" -ForegroundColor $ErrorColor
  exit 2
}

# 3. Test connection
Write-Host ""
Write-Host "Testing database connection..." -ForegroundColor $InfoColor
$connTest = & psql $env:DATABASE_URL -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: Cannot connect to database" -ForegroundColor $ErrorColor
  exit 3
}
Write-Host "Connection OK" -ForegroundColor $SuccessColor
Write-Host ""

# 4. Drop tables in reverse dependency order
$tablesToDrop = @(
  "recommendation_weights",
  "recommendation_events",
  "recommendation_feedback",
  "recommendation_history",
  "memory_events",
  "memory_dashboard_projections",
  "dashboard_projections",
  "recommendations",
  "student_learning_profiles",
  "mission_progress",
  "mission_unlock_conditions",
  "mission_steps",
  "missions",
  "skill_mastery",
  "skill_dependencies",
  "project_skill_map",
  "projects",
  "experiences",
  "concept_mastery_history",
  "concept_states",
  "concept_dependencies",
  "concepts",
  "ai_conversations",
  "learning_memory_records",
  "ai_evaluations",
  "submissions",
  "exercises",
  "lessons",
  "progress",
  "positioning_test_results",
  "modules",
  "profiles",
  "events"
)

Write-Host "Dropping tables..." -ForegroundColor $WarningColor
foreach ($table in $tablesToDrop) {
  $result = & psql $env:DATABASE_URL -c "DROP TABLE IF EXISTS public.$table CASCADE;" 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dropped $table" -ForegroundColor $SuccessColor
  } else {
    Write-Host "✗ Failed to drop $table: $result" -ForegroundColor $WarningColor
  }
}

# 5. Drop functions
Write-Host ""
Write-Host "Dropping functions..." -ForegroundColor $WarningColor
$dropFunctions = @(
  "handle_new_user",
  "update_updated_at_column"
)

foreach ($func in $dropFunctions) {
  $result = & psql $env:DATABASE_URL -c "DROP FUNCTION IF EXISTS public.$func CASCADE;" 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dropped function $func" -ForegroundColor $SuccessColor
  } else {
    Write-Host "✗ Failed to drop function $func: $result" -ForegroundColor $WarningColor
  }
}

Write-Host ""
Write-Host "====== ROLLBACK COMPLETE ======" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "Important: You may need to:" -ForegroundColor $InfoColor
Write-Host "1. Manually check for remaining objects using Supabase Dashboard" -ForegroundColor $InfoColor
Write-Host "2. Re-apply migrations when ready: ./scripts/apply-migrations.ps1" -ForegroundColor $InfoColor
Write-Host ""
