# Test Hooks Integration - Parse Session JSONL Files
# Usage: .\test-hooks-integration.ps1

param(
    [string]$ProjectPath = "C:\Users\julien\OneDrive\Coding\_Projets de code\2025.11 Claude Code MarketPlace",
    [string]$TestPrompt = "create an excel file",
    [switch]$SkipManualTest = $false
)

Write-Host "🧪 Testing Hooks Integration (Session JSONL Parser)" -ForegroundColor Cyan
Write-Host "   Project: $ProjectPath" -ForegroundColor Gray
Write-Host "   Test Prompt: $TestPrompt" -ForegroundColor Gray
Write-Host ""

# For this specific project, use the known encoded name
# TODO: Improve encoding logic to match Claude's algorithm
$projectEncoded = "C--Users-julien-OneDrive-Coding--Projets-de-code-2025-11-Claude-Code-MarketPlace"
$sessionsDir = "$env:USERPROFILE\.claude\projects\$projectEncoded"

if (-not (Test-Path $sessionsDir)) {
    Write-Host "❌ FAILED: Sessions directory not found" -ForegroundColor Red
    Write-Host "   Expected: $sessionsDir" -ForegroundColor Yellow
    Write-Host "   This project may not have any Claude Code sessions yet." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Sessions directory found: $sessionsDir" -ForegroundColor Green

# Find the most recent session BEFORE the test
$beforeSession = Get-ChildItem "$sessionsDir\*.jsonl" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $beforeSession) {
    Write-Host "⚠️  No existing sessions found. This will be the first session." -ForegroundColor Yellow
    $beforeTime = [DateTime]::MinValue
} else {
    Write-Host "✓ Current latest session: $($beforeSession.Name) ($(Get-Date $beforeSession.LastWriteTime -Format 'HH:mm:ss'))" -ForegroundColor Green
    $beforeTime = $beforeSession.LastWriteTime
}

Write-Host ""

if (-not $SkipManualTest) {
    Write-Host "📝 MANUAL TEST REQUIRED:" -ForegroundColor Yellow
    Write-Host "   1. Start a NEW Claude Code session in this project" -ForegroundColor Gray
    Write-Host "   2. Send the prompt: '$TestPrompt'" -ForegroundColor Gray
    Write-Host "   3. Wait for Claude's response to complete" -ForegroundColor Gray
    Write-Host "   4. Press Enter when done" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter when you've completed the test"
    Write-Host ""
}

# Find the NEW session created after the test
Write-Host "🔍 Searching for new session..." -ForegroundColor Cyan

$afterSession = Get-ChildItem "$sessionsDir\*.jsonl" -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -gt $beforeTime } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $afterSession) {
    # Maybe we're analyzing the current session
    $afterSession = Get-ChildItem "$sessionsDir\*.jsonl" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if ($afterSession) {
        Write-Host "⚠️  No new session found, using current session: $($afterSession.Name)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ FAILED: No sessions found!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ New session found: $($afterSession.Name)" -ForegroundColor Green
}

Write-Host "   File size: $([math]::Round($afterSession.Length / 1MB, 2)) MB" -ForegroundColor Gray
Write-Host "   Modified: $(Get-Date $afterSession.LastWriteTime -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Parse the JSONL file
Write-Host "📄 Parsing session JSONL..." -ForegroundColor Cyan

$foundTopRanking = $false
$foundRouterInvocation = $false
$routerOutput = ""
$lineCount = 0

Get-Content $afterSession.FullName -ErrorAction SilentlyContinue | ForEach-Object {
    $lineCount++
    try {
        $event = $_ | ConvertFrom-Json

        # Look for assistant responses containing "Top 10 Skills Ranking"
        if ($event.type -eq "assistant_response" -or $event.content) {
            if ($event.content -like "*Top 10 Skills Ranking*") {
                $foundTopRanking = $true
                # Extract the router output
                if ($event.content -match "📊 Top 10 Skills Ranking:[\s\S]{0,2000}") {
                    $routerOutput = $matches[0]
                }
            }
        }

        # Look for router skill invocations
        if ($event.type -eq "tool_use" -and $event.tool -eq "Skill") {
            if ($event.args -like "*fast-skill-router*") {
                $foundRouterInvocation = $true
            }
        }

    } catch {
        # Ignore JSON parsing errors (some lines might be malformed)
    }
}

Write-Host "   Parsed $lineCount events" -ForegroundColor Gray
Write-Host ""

# Also check unified.jsonl for RouterDecision events
Write-Host "📊 Checking unified.jsonl for RouterDecision events..." -ForegroundColor Cyan

$unifiedLog = "$env:USERPROFILE\.claude\logs\unified.jsonl"
$recentRouterEvents = @()

if (Test-Path $unifiedLog) {
    Get-Content $unifiedLog -Tail 100 -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            $event = $_ | ConvertFrom-Json
            if ($event.event_type -eq "RouterDecision") {
                $eventTime = [DateTime]::Parse($event.timestamp)
                if ($eventTime -gt $beforeTime) {
                    $recentRouterEvents += $event
                }
            }
        } catch {
            # Ignore parsing errors
        }
    }

    if ($recentRouterEvents.Count -gt 0) {
        Write-Host "   ✓ Found $($recentRouterEvents.Count) RouterDecision events since test" -ForegroundColor Green

        # Check if they have top_10_scores
        $withTop10 = $recentRouterEvents | Where-Object { $_.top_10_scores }
        if ($withTop10.Count -gt 0) {
            Write-Host "   ✓ Found $($withTop10.Count) events with top_10_scores data" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  RouterDecision events found but NO top_10_scores data" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  No recent RouterDecision events found" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  unified.jsonl not found at $unifiedLog" -ForegroundColor Yellow
}

Write-Host ""

# Validation Results
Write-Host "🔍 Validation Results:" -ForegroundColor Cyan

if ($foundTopRanking) {
    Write-Host "   ✓ Found 'Top 10 Skills Ranking' in session JSONL" -ForegroundColor Green
    if ($routerOutput) {
        Write-Host ""
        Write-Host "   📊 Router Output Found:" -ForegroundColor Cyan
        Write-Host "   ─" * 35 -ForegroundColor Gray
        $routerOutput -split "`n" | Select-Object -First 15 | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
        Write-Host "   ─" * 35 -ForegroundColor Gray
    }
} else {
    Write-Host "   ✗ 'Top 10 Skills Ranking' NOT FOUND in session JSONL" -ForegroundColor Red
}

if ($recentRouterEvents.Count -gt 0) {
    Write-Host "   ✓ RouterDecision events logged to unified.jsonl" -ForegroundColor Green
} else {
    Write-Host "   ✗ No RouterDecision events in unified.jsonl" -ForegroundColor Red
}

Write-Host ""

# Overall result
if ($foundTopRanking -or ($recentRouterEvents.Count -gt 0)) {
    Write-Host "🎉 SUCCESS: Hook is working! Router output detected." -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Summary:" -ForegroundColor Cyan
    Write-Host "   • Session JSONL: $(if ($foundTopRanking) {'✓ Contains Top 10'} else {'✗ Missing'})" -ForegroundColor Gray
    Write-Host "   • Unified Logs: $(if ($recentRouterEvents.Count -gt 0) {"✓ $($recentRouterEvents.Count) events"} else {'✗ No events'})" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "❌ FAILURE: Router output not detected in session or logs" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Verify UserPromptSubmit hook is configured in settings.json" -ForegroundColor Gray
    Write-Host "   2. Check ~/.claude/scripts/fast-skill-router.js exists" -ForegroundColor Gray
    Write-Host "   3. Restart Claude Code to reload hook configuration" -ForegroundColor Gray
    Write-Host "   4. Check VERBOSE_ROUTING env var (should not be 'false')" -ForegroundColor Gray
    exit 1
}
