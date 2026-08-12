# Verify Supabase migrations - check tables, indexes, triggers, RLS policies
# Usage: Set $env:DATABASE_URL, then run this script
# Example: $env:DATABASE_URL = "postgres://postgres:password@db.supabase.co:5432/postgres"
# Then: ./scripts/verify-migrations.ps1

$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

Write-Host "====================================================================" -ForegroundColor $InfoColor
Write-Host "Supabase Migration Script - Verify Migrations" -ForegroundColor $InfoColor
Write-Host "====================================================================" -ForegroundColor $InfoColor
Write-Host ""

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
Write-Host "Testing database connection..." -ForegroundColor $InfoColor
$connTest = & psql $env:DATABASE_URL -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: Cannot connect to database" -ForegroundColor $ErrorColor
  exit 3
}
Write-Host "Connection OK" -ForegroundColor $SuccessColor
Write-Host ""

# Helper function to run SQL query
function RunQuery($sql, $label) {
  Write-Host "$label..." -ForegroundColor $InfoColor
  $result = & psql $env:DATABASE_URL -t -c $sql 2>&1
  if ($LASTEXITCODE -eq 0) {
    $count = ($result | Measure-Object -Line).Lines
    if ($count -gt 0 -and $result -notmatch "^$") {
      Write-Host "✓ Found: $result" -ForegroundColor $SuccessColor
      return $true
    } else {
      Write-Host "✗ Not found or empty" -ForegroundColor $WarningColor
      return $false
    }
  } else {
    Write-Host "✗ Query failed: $result" -ForegroundColor $ErrorColor
    return $false
  }
}

# Verify critical tables for recommendation learning
Write-Host "====== CRITICAL RECOMMENDATION TABLES ======" -ForegroundColor $InfoColor
RunQuery "SELECT 'recommendation_weights' FROM information_schema.tables WHERE table_name='recommendation_weights'" "recommendation_weights table"
RunQuery "SELECT 'recommendation_history' FROM information_schema.tables WHERE table_name='recommendation_history'" "recommendation_history table"
RunQuery "SELECT 'recommendation_feedback' FROM information_schema.tables WHERE table_name='recommendation_feedback'" "recommendation_feedback table"
Write-Host ""

# Verify learning profile tables
Write-Host "====== LEARNING PROFILE TABLES ======" -ForegroundColor $InfoColor
RunQuery "SELECT 'learning_dna' FROM information_schema.tables WHERE table_name='learning_dna'" "learning_dna table"
RunQuery "SELECT 'student_learning_profiles' FROM information_schema.tables WHERE table_name='student_learning_profiles'" "student_learning_profiles table"
RunQuery "SELECT 'dashboard_projections' FROM information_schema.tables WHERE table_name='dashboard_projections'" "dashboard_projections table"
Write-Host ""

# Verify concept tables
Write-Host "====== CONCEPT & MASTERY TABLES ======" -ForegroundColor $InfoColor
RunQuery "SELECT 'concept_states' FROM information_schema.tables WHERE table_name='concept_states'" "concept_states table"
RunQuery "SELECT 'concept_mastery_history' FROM information_schema.tables WHERE table_name='concept_mastery_history'" "concept_mastery_history table"
RunQuery "SELECT 'concepts' FROM information_schema.tables WHERE table_name='concepts'" "concepts table"
Write-Host ""

# Verify indexes
Write-Host "====== INDEXES FOR RECOMMENDATION WEIGHTS ======" -ForegroundColor $InfoColor
RunQuery "SELECT count(*) FROM pg_indexes WHERE tablename='recommendation_weights'" "recommendation_weights indexes count"
RunQuery "SELECT indexname FROM pg_indexes WHERE tablename='recommendation_weights' ORDER BY indexname" "Specific indexes on recommendation_weights"
Write-Host ""

# Verify triggers
Write-Host "====== TRIGGERS ======" -ForegroundColor $InfoColor
RunQuery "SELECT count(*) FROM information_schema.triggers WHERE trigger_name LIKE 'update_%'" "Auto-update triggers count"
RunQuery "SELECT count(*) FROM information_schema.triggers WHERE trigger_name='on_auth_user_created'" "Profile creation trigger"
Write-Host ""

# Verify RLS policies
Write-Host "====== ROW LEVEL SECURITY POLICIES ======" -ForegroundColor $InfoColor
RunQuery "SELECT count(*) FROM pg_policies WHERE tablename='student_learning_profiles'" "student_learning_profiles policies"
RunQuery "SELECT count(*) FROM pg_policies WHERE tablename='dashboard_projections'" "dashboard_projections policies"
RunQuery "SELECT count(*) FROM pg_policies WHERE tablename='learning_dna'" "learning_dna policies"
RunQuery "SELECT count(*) FROM pg_policies WHERE tablename='recommendation_history'" "recommendation_history policies"
Write-Host ""

# Verify columns were added to exercises table
Write-Host "====== EXERCISES TABLE EXTENSIONS ======" -ForegroundColor $InfoColor
RunQuery "SELECT 'experience_id' FROM information_schema.columns WHERE table_name='exercises' AND column_name='experience_id'" "exercises.experience_id column"
RunQuery "SELECT 'skills_learned' FROM information_schema.columns WHERE table_name='exercises' AND column_name='skills_learned'" "exercises.skills_learned column"
Write-Host ""

# Summary stats
Write-Host "====== SUMMARY STATISTICS ======" -ForegroundColor $InfoColor
Write-Host ""
Write-Host "Table counts:" -ForegroundColor $InfoColor
$tableCount = & psql $env:DATABASE_URL -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" 2>&1
Write-Host "Total public tables: $tableCount" -ForegroundColor $InfoColor

$indexCount = & psql $env:DATABASE_URL -t -c "SELECT count(*) FROM pg_indexes WHERE schemaname='public'" 2>&1
Write-Host "Total public indexes: $indexCount" -ForegroundColor $InfoColor

$triggerCount = & psql $env:DATABASE_URL -t -c "SELECT count(*) FROM information_schema.triggers WHERE trigger_schema='public'" 2>&1
Write-Host "Total triggers: $triggerCount" -ForegroundColor $InfoColor

$policyCount = & psql $env:DATABASE_URL -t -c "SELECT count(*) FROM pg_policies" 2>&1
Write-Host "Total RLS policies: $policyCount" -ForegroundColor $InfoColor

Write-Host ""
Write-Host "====== VERIFICATION COMPLETE ======" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "For more details, run individual queries in Supabase SQL Editor:" -ForegroundColor $InfoColor
Write-Host "1. SELECT * FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;" -ForegroundColor $InfoColor
Write-Host "2. SELECT * FROM pg_indexes WHERE schemaname='public' ORDER BY tablename, indexname;" -ForegroundColor $InfoColor
Write-Host "3. SELECT * FROM pg_policies ORDER BY tablename, policyname;" -ForegroundColor $InfoColor
Write-Host ""