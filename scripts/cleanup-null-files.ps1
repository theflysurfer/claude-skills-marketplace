# Supprime les fichiers avec noms reserves Windows (nul, null, con, prn, aux)
# Ces fichiers ne peuvent PAS etre supprimes avec PowerShell - il faut bash!
# Hook: PostToolUse avec matcher "Bash"

# Lire le JSON depuis stdin pour obtenir le CWD
$jsonInput = $null
try {
    $jsonInput = $input | Out-String | ConvertFrom-Json -ErrorAction SilentlyContinue
} catch {}

# Determiner le dossier a nettoyer (priorite: cwd du JSON, sinon CLAUDE_PROJECT_DIR)
$targetDir = if ($jsonInput -and $jsonInput.cwd) {
    $jsonInput.cwd
} elseif ($env:CLAUDE_PROJECT_DIR) {
    $env:CLAUDE_PROJECT_DIR
} else {
    $PWD.Path
}

# Liste des noms reserves Windows (legacy MS-DOS)
$reservedNames = @('nul', 'null', 'con', 'prn', 'aux')

foreach ($name in $reservedNames) {
    $filePath = Join-Path $targetDir $name
    if (Test-Path $filePath -PathType Leaf) {
        # IMPORTANT: PowerShell ne peut pas supprimer ces fichiers!
        # On utilise bash (Git Bash) qui ignore les restrictions Windows
        $unixPath = $filePath -replace '\\', '/'
        bash -c "rm -f '$unixPath'" 2>$null
    }
}
