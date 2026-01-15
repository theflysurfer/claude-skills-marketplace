<#
.SYNOPSIS
    Sync skills from marketplace to ~/.claude/skills/ using junctions (single source of truth)

.DESCRIPTION
    Creates Windows junction points instead of copying files.
    - No duplication
    - Changes in marketplace are immediately reflected
    - No sync drift

.PARAMETER Skills
    Array of skill names to sync. If not specified, uses sync-config.json

.EXAMPLE
    .\sync-skills-junction.ps1
    .\sync-skills-junction.ps1 -Skills @("julien-skill-help", "julien-infra-hostinger-web")
#>

param(
    [string[]]$Skills = @()
)

$MarketplacePath = "C:\Users\julien\OneDrive\Coding\_Projets de code\2025.11 Claude Code MarketPlace"
$TargetPath = "$env:USERPROFILE\.claude\skills"
$SyncConfigPath = "$MarketplacePath\registry\sync-config.json"

# Load skills from sync-config.json if not specified
if ($Skills.Count -eq 0) {
    if (Test-Path $SyncConfigPath) {
        $config = Get-Content $SyncConfigPath | ConvertFrom-Json
        $Skills = $config.skills_to_sync
        Write-Host "Loaded $($Skills.Count) skills from sync-config.json" -ForegroundColor Cyan
    } else {
        Write-Error "No skills specified and sync-config.json not found"
        exit 1
    }
}

# Ensure target directory exists
if (-not (Test-Path $TargetPath)) {
    New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
}

$synced = 0
$skipped = 0
$errors = 0

foreach ($skill in $Skills) {
    $sourcePath = "$MarketplacePath\skills\$skill"
    $linkPath = "$TargetPath\$skill"

    # Check if source exists
    if (-not (Test-Path $sourcePath)) {
        Write-Host "  [SKIP] $skill - source not found in marketplace" -ForegroundColor Yellow
        $skipped++
        continue
    }

    # Check if it's already a junction pointing to the right place
    if (Test-Path $linkPath) {
        $item = Get-Item $linkPath -Force
        if ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
            # Already a junction, check target
            $target = (Get-Item $linkPath).Target
            if ($target -eq $sourcePath) {
                Write-Host "  [OK] $skill - junction already correct" -ForegroundColor DarkGray
                $skipped++
                continue
            }
        }
        # Remove existing (copy or wrong junction)
        Remove-Item $linkPath -Recurse -Force
        Write-Host "  [DEL] $skill - removed existing copy" -ForegroundColor DarkYellow
    }

    # Create junction
    try {
        cmd /c mklink /J "$linkPath" "$sourcePath" 2>&1 | Out-Null
        Write-Host "  [LINK] $skill -> marketplace" -ForegroundColor Green
        $synced++
    } catch {
        Write-Host "  [ERR] $skill - $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Synced (junctions): $synced"
Write-Host "  Skipped: $skipped"
Write-Host "  Errors: $errors"

if ($synced -gt 0) {
    Write-Host ""
    Write-Host "Skills are now linked to the marketplace." -ForegroundColor Green
    Write-Host "Any changes in the marketplace are immediately reflected." -ForegroundColor Green
}
