# Test fast-skill-router.js - Top 10 Skills Ranking Output
# Usage: .\test-router-unit.ps1

param(
    [string]$TestPrompt = "create an excel file"
)

Write-Host "🧪 Testing fast-skill-router.js (Unit Test)" -ForegroundColor Cyan
Write-Host "   Test Prompt: $TestPrompt" -ForegroundColor Gray
Write-Host ""

# Construct JSON input
$input = @{
    user_prompt = $TestPrompt
} | ConvertTo-Json -Compress

# Test the router directly
$routerPath = "C:\Users\julien\.claude\scripts\fast-skill-router.js"

if (-not (Test-Path $routerPath)) {
    Write-Host "❌ FAILED: Router script not found at $routerPath" -ForegroundColor Red
    Write-Host "   Expected location: ~/.claude/scripts/fast-skill-router.js" -ForegroundColor Yellow
    Write-Host "   This means scripts are not synced. Run /julien-sync first." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Router script found: $routerPath" -ForegroundColor Green

# Run the router with test input
try {
    $output = $input | node $routerPath 2>&1 | Out-String

    Write-Host ""
    Write-Host "📄 Router Output:" -ForegroundColor Cyan
    Write-Host "─" * 70 -ForegroundColor Gray
    Write-Host $output
    Write-Host "─" * 70 -ForegroundColor Gray
    Write-Host ""

    # Check for expected output
    $hasTop10Ranking = $output -like "*Top 10 Skills Ranking*"
    $hasVisualBars = $output -match "█"
    $hasStatusIcons = $output -match "[✓~✗]"
    $hasThresholdLegend = $output -like "*Above threshold*"

    # Results
    Write-Host "🔍 Validation Results:" -ForegroundColor Cyan

    if ($hasTop10Ranking) {
        Write-Host "   ✓ Contains 'Top 10 Skills Ranking'" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Missing 'Top 10 Skills Ranking'" -ForegroundColor Red
    }

    if ($hasVisualBars) {
        Write-Host "   ✓ Contains visual bars (█)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Missing visual bars" -ForegroundColor Red
    }

    if ($hasStatusIcons) {
        Write-Host "   ✓ Contains status icons (✓/~/✗)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Missing status icons" -ForegroundColor Red
    }

    if ($hasThresholdLegend) {
        Write-Host "   ✓ Contains threshold legend" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Missing threshold legend" -ForegroundColor Red
    }

    Write-Host ""

    # Overall result
    if ($hasTop10Ranking -and $hasVisualBars -and $hasStatusIcons -and $hasThresholdLegend) {
        Write-Host "🎉 SUCCESS: Router Top 10 output is working!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ FAILURE: Router output is incomplete or missing" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "   1. Check VERBOSE_ROUTING env var (should not be 'false')" -ForegroundColor Gray
        Write-Host "   2. Verify require paths in fast-skill-router.js" -ForegroundColor Gray
        Write-Host "   3. Check if unified-logger.js is in ~/.claude/scripts/lib/" -ForegroundColor Gray
        exit 1
    }

} catch {
    Write-Host "❌ ERROR: Failed to run router script" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}
