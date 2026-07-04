#!/usr/bin/env bash

# ============================================================================
# TrainArduino Dashboard Deployment Script
# ============================================================================
# This script verifies the dashboard is ready and helps debug issues
# ============================================================================

echo "🔍 TrainArduino Dashboard Deployment Check"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "   Please run this script from the project root"
    exit 1
fi

echo "✅ Found package.json"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found, installing dependencies..."
    npm install --legacy-peer-deps
else
    echo "✅ node_modules exists"
fi

# Check if required packages are installed
echo ""
echo "Checking dependencies..."

packages=("react" "next" "@supabase/supabase-js" "@heroicons/react" "tailwindcss")

for package in "${packages[@]}"; do
    if npm list "$package" > /dev/null 2>&1; then
        echo "✅ $package installed"
    else
        echo "❌ $package NOT installed"
    fi
done

# Check environment variables
echo ""
echo "Checking environment variables..."

if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_URL found"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_URL missing"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY found"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY missing"
    fi
else
    echo "❌ .env.local not found"
    echo "   Create it with your Supabase credentials"
fi

# Check if dashboard page exists
echo ""
echo "Checking dashboard files..."

if [ -f "app/(dashboard)/page.tsx" ]; then
    echo "✅ Dashboard page found"
else
    echo "❌ Dashboard page not found"
fi

if [ -f "app/(dashboard)/layout.tsx" ]; then
    echo "✅ Dashboard layout found"
else
    echo "❌ Dashboard layout not found"
fi

# Check if database files exist
echo ""
echo "Checking database files..."

if [ -f "database/migrations.sql" ]; then
    echo "✅ migrations.sql found"
else
    echo "❌ migrations.sql not found"
fi

if [ -f "database/seed.sql" ]; then
    echo "✅ seed.sql found"
else
    echo "❌ seed.sql not found"
fi

# Check if required lib files exist
echo ""
echo "Checking library files..."

lib_files=("lib/auth.ts" "lib/db.ts" "lib/types.ts" "lib/supabase.ts")

for file in "${lib_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file found"
    else
        echo "❌ $file not found"
    fi
done

echo ""
echo "=========================================="
echo "📊 Dashboard Status Check Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Ensure .env.local has your Supabase credentials"
echo "2. Run: npm run dev"
echo "3. Visit: http://localhost:3000/auth/signup"
echo "4. Create an account and complete the positioning test"
echo "5. You should see the dashboard at http://localhost:3000/dashboard"
echo ""
echo "If you see errors, check DASHBOARD_SETUP.md for troubleshooting"
