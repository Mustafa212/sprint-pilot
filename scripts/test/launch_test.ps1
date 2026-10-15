# Self-tests for launch.ps1 (dry runs only).
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test/launch_test.ps1
$script = Join-Path $PSScriptRoot '..\launch.ps1'
$root = Join-Path ([IO.Path]::GetTempPath()) ('sp launch ' + [guid]::NewGuid().ToString('N'))
$dir = Join-Path $root 'shop.worktrees\sprint-7-101'
New-Item -ItemType Directory -Path $dir -Force | Out-Null
$env:SP_CLAUDE = 'C:\tools\claude.exe'
$msg = "/senior-dev .ai-session/launch.md (it's a test)"
$failures = 0
function Check([string]$name, [bool]$ok) { if ($ok) { "ok   $name" } else { "FAIL $name"; $script:failures++ } }
function Invoke-Launch([string[]]$extra) {
  $out = (& powershell -NoProfile -ExecutionPolicy Bypass -File $script @extra 2>&1) -join "`n"
  return @{ Out = $out; Code = $LASTEXITCODE }
}

$r = Invoke-Launch @('-Dir', $dir, '-Mode', 'desktop', '-Message', $msg, '-DryRun')
Check 'desktop: exit 0' ($r.Code -eq 0)
Check 'desktop: message on the clipboard, intact' ($r.Out.Contains("clipboard: $msg"))
Check 'desktop: claude --desktop in the folder' ($r.Out.Contains("run: claude --desktop (in $dir)"))

$env:SP_WT = 'C:\tools\wt.exe'
$r = Invoke-Launch @('-Dir', $dir, '-Mode', 'terminal', '-Message', $msg, '-DryRun')
Check 'terminal with wt: new tab in the folder' ($r.Code -eq 0 -and $r.Out.Contains("run: C:\tools\wt.exe -w 0 nt -d `"$dir`""))

$env:SP_WT = 'none'
$r = Invoke-Launch @('-Dir', $dir, '-Mode', 'terminal', '-Message', $msg, '-DryRun')
Check 'terminal without wt: PowerShell window' ($r.Code -eq 0 -and $r.Out.Contains('run: powershell -NoExit -Command Set-Location -LiteralPath'))

$r = Invoke-Launch @('-Dir', (Join-Path $dir 'missing'), '-Mode', 'desktop', '-Message', $msg, '-DryRun')
Check 'missing folder: exit 2' ($r.Code -eq 2)

Remove-Item -LiteralPath $root -Recurse -Force
if ($failures -eq 0) { 'all launch.ps1 tests passed'; exit 0 } else { "$failures launch.ps1 test(s) failed"; exit 1 }
