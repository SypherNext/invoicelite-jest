# Installs, type-checks and tests every step folder and final\, one after the other.
#
# Usage (from anywhere):
#   .\scripts\verify-all.ps1           check everything
#   .\scripts\verify-all.ps1 -Clean    also delete node_modules\, coverage\ and reports\ afterwards
#
# Needs Node.js 24 or 26 and npm. Docker must be running for the projects that have
# integration tests (lesson 20 on): `npm run test:integration` starts PostgreSQL with Testcontainers.

param(
    [switch]$Clean
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$passed = 0
$failed = @()

$projects = @()
$projects += Get-ChildItem -Path (Join-Path $repoRoot 'steps') -Directory | Sort-Object Name | ForEach-Object { $_.FullName }
$projects += Join-Path $repoRoot 'final'

function Invoke-Check {
    & npm.cmd ci --no-audit --no-fund *> $null
    if ($LASTEXITCODE -ne 0) { return $false }
    & npm.cmd run typecheck --if-present *> $null
    if ($LASTEXITCODE -ne 0) { return $false }
    & npm.cmd test *> $null
    if ($LASTEXITCODE -ne 0) { return $false }
    & npm.cmd run test:integration --if-present *> $null
    return ($LASTEXITCODE -eq 0)
}

foreach ($dir in $projects) {
    if (-not (Test-Path (Join-Path $dir 'package.json'))) { continue }
    Write-Host "==> $dir"
    Push-Location $dir
    try {
        $ok = Invoke-Check
    } finally {
        Pop-Location
    }
    if ($ok) {
        Write-Host '    PASS'
        $passed++
    } else {
        Write-Host "    FAIL (run the commands in $dir to see why)"
        $failed += $dir
    }
    if ($Clean) {
        foreach ($folder in @('node_modules', 'coverage', 'reports', '.stryker-tmp')) {
            $target = Join-Path $dir $folder
            if (Test-Path $target) { Remove-Item -Recurse -Force $target }
        }
    }
}

Write-Host ''
Write-Host "Passed: $passed  Failed: $($failed.Count)"
if ($failed.Count -gt 0) {
    Write-Host 'Failed projects:'
    $failed | ForEach-Object { Write-Host "  $_" }
    exit 1
}
