# Self-tests for launch.ps1 (dry runs only).
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test/launch_test.ps1
$script = Join-Path $PSScriptRoot '..\launch.ps1'
$root = Join-Path ([IO.Path]::GetTempPath()) ('sp launch ' + [guid]::NewGuid().ToString('N'))
$dir = Join-Path $root 'shop.worktrees\sprint-7-101'
New-Item -ItemType Directory -Path $dir -Force | Out-Null
$env:SP_CLAUDE = 'C:\tools\claude.exe'
$sd = '/senior-dev .ai-session/launch.md'
$failures = 0
function Check([string]$name, [bool]$ok) { if ($ok) { "ok   $name" } else { "FAIL $name"; $script:failures++ } }
function Invoke-Launch([string[]]$extra) {
  $out = (& powershell -NoProfile -ExecutionPolicy Bypass -File $script @extra 2>&1) -join "`n"
  return @{ Out = $out; Code = $LASTEXITCODE }
}

$r = Invoke-Launch @('-Dir', $dir, '-Mode', 'desktop', '-Workflow', 'senior-dev', '-DryRun')
Check 'desktop: exit 0' ($r.Code -eq 0)
Check 'desktop: the senior-dev message on the clipboard' ($r.Out.Contains("clipboard: $sd"))
Check 'desktop: claude --desktop in the folder' ($r.Out.Contains("--desktop (in $dir)"))

$r = Invoke-Launch @('-Dir', $dir, '-Mode', 'desktop', '-Workflow', 'none', '-DryRun')
Check 'none message, without ;' ($r.Out.Contains('clipboard: Read .ai-session/launch.md, which describes the work in this worktree.'))

$env:SP_WT = 'C:\tools\wt.exe'
$r = Invoke-Launch @('-Dir', $dir, '-Mode', 'terminal', '-Workflow', 'senior-dev', '-DryRun')
Check 'terminal with wt: new tab in the folder' ($r.Code -eq 0 -and $r.Out.Contains("run: C:\tools\wt.exe -w 0 nt -d `"$dir`""))

$env:SP_WT = 'none'
$r = Invoke-Launch @('-Dir', $dir, '-Mode', 'terminal', '-Workflow', 'senior-dev', '-DryRun')
Check 'terminal without wt: PowerShell window' ($r.Code -eq 0 -and $r.Out.Contains('run: powershell -NoExit -Command Set-Location -LiteralPath'))

$r = Invoke-Launch @('-Dir', $dir, '-Mode', 'background', '-Workflow', 'senior-dev', '-DryRun')
Check 'background: --bg with the unit name and the message, in the folder' ($r.Code -eq 0 -and $r.Out.Contains("run: C:\tools\claude.exe --bg --name sprint-7-101 $sd (in $dir)"))

$r = Invoke-Launch @('-Dir', (Join-Path $dir 'missing'), '-Mode', 'desktop', '-Workflow', 'senior-dev', '-DryRun')
Check 'missing folder: exit 2' ($r.Code -eq 2)

# npm installs claude.ps1 beside claude.cmd; Start-Process can't run a .ps1, so the .cmd must win.
$bin = Join-Path $root 'bin'
New-Item -ItemType Directory -Path $bin -Force | Out-Null
Set-Content -Path (Join-Path $bin 'claude.ps1') -Value 'exit 0'
Set-Content -Path (Join-Path $bin 'claude.cmd') -Value '@exit /b 0'
$savedPath = $env:Path; $env:Path = "$bin;$env:Path"; Remove-Item Env:SP_CLAUDE
$r = Invoke-Launch @('-Dir', $dir, '-Mode', 'desktop', '-Workflow', 'senior-dev', '-DryRun')
Check 'claude found on PATH: the .cmd, not the .ps1 shim' ($r.Out.Contains((Join-Path $bin 'claude.cmd') + ' --desktop'))
$env:Path = $savedPath

Remove-Item -LiteralPath $root -Recurse -Force
if ($failures -eq 0) { 'all launch.ps1 tests passed'; exit 0 } else { "$failures launch.ps1 test(s) failed"; exit 1 }
