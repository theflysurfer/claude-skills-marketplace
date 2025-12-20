# Start MkDocs server + Skill API server for Claude Code Marketplace
# MkDocs: port 8000, Skill API: port 8888

$MarketplacePath = "C:\Users\julien\OneDrive\Coding\_Projets de code\2025.11 Claude Code MarketPlace"
$LogDir = "$env:USERPROFILE\.claude\logs"
$MkDocsLog = "$LogDir\mkdocs-server.log"
$ApiLog = "$LogDir\skill-api-server.log"

# Create log directory if needed
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# ========================================
# Start MkDocs Server (port 8000)
# ========================================
$mkdocsRunning = Get-Process -Name "python*" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*mkdocs*serve*" }

if (-not $mkdocsRunning) {
    Start-Process -FilePath "python" `
        -ArgumentList "-m", "mkdocs", "serve", "--dev-addr", "127.0.0.1:8000" `
        -WorkingDirectory $MarketplacePath `
        -WindowStyle Hidden `
        -RedirectStandardOutput $MkDocsLog `
        -RedirectStandardError "$MkDocsLog.err"
    Write-Host "[OK] MkDocs server started on http://127.0.0.1:8000"
} else {
    Write-Host "[--] MkDocs server already running"
}

# ========================================
# Start Skill API Server (port 8888)
# ========================================
$apiRunning = Get-Process -Name "python*" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*skill-api-server*" }

if (-not $apiRunning) {
    Start-Process -FilePath "python" `
        -ArgumentList "$MarketplacePath\scripts\skill-api-server.py" `
        -WorkingDirectory $MarketplacePath `
        -WindowStyle Hidden `
        -RedirectStandardOutput $ApiLog `
        -RedirectStandardError "$ApiLog.err"
    Write-Host "[OK] Skill API server started on http://127.0.0.1:8888"
} else {
    Write-Host "[--] Skill API server already running"
}

Write-Host ""
Write-Host "Services:"
Write-Host "  - MkDocs:    http://127.0.0.1:8000"
Write-Host "  - Skill API: http://127.0.0.1:8888"
Write-Host ""
Write-Host "Logs: $LogDir"
