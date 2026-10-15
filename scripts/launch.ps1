<#
.SYNOPSIS
Opens one sprint-pilot unit on Windows: a Claude Desktop chat on a folder (the first message goes
on the clipboard), or a terminal tab running Claude with that message.
The script builds the message from -Workflow, so no caller (Git Bash included) can mangle it.
Exit: 0 opened; 2 bad arguments; 3 claude not found.
.EXAMPLE
powershell -NoProfile -ExecutionPolicy Bypass -File launch.ps1 -Dir C:\src\shop.worktrees\sprint-7-101 -Mode desktop -Workflow senior-dev
#>
param(
  [Parameter(Mandatory = $true)][string]$Dir,
  [Parameter(Mandatory = $true)][ValidateSet('desktop', 'terminal')][string]$Mode,
  [Parameter(Mandatory = $true)][ValidateSet('senior-dev', 'superpowers', 'none')][string]$Workflow,
  [switch]$DryRun
)
# Test hooks: SP_CLAUDE overrides the claude path; SP_WT overrides wt ('none' = no wt).

$Message = @{
  'senior-dev'  = '/senior-dev .ai-session/launch.md'
  'superpowers' = 'Use superpowers:brainstorming on .ai-session/launch.md'
  'none'        = 'Read .ai-session/launch.md, which describes the work in this worktree.'
}[$Workflow]

if (-not (Test-Path -LiteralPath $Dir -PathType Container)) {
  [Console]::Error.WriteLine("Folder not found: $Dir"); exit 2
}
$claude = $env:SP_CLAUDE
# -CommandType Application: npm puts claude.ps1 beside claude.cmd, and Start-Process can't run a .ps1.
if (-not $claude) { $found = Get-Command claude -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1; if ($found) { $claude = $found.Source } }
if (-not $claude) { [Console]::Error.WriteLine('claude is not on PATH'); exit 3 }

if ($Mode -eq 'desktop') {
  if ($DryRun) { "clipboard: $Message"; "run: $claude --desktop (in $Dir)"; exit 0 }
  Set-Clipboard -Value $Message
  # claude --desktop needs a console of its own; Start-Process gives it one.
  Start-Process -FilePath $claude -ArgumentList '--desktop' -WorkingDirectory $Dir
  exit 0
}

$wt = $env:SP_WT
if (-not $wt) { $found = Get-Command wt -ErrorAction SilentlyContinue; if ($found) { $wt = $found.Source } }
if ($wt -and $wt -ne 'none') {
  $wtArgs = @('-w', '0', 'nt', '-d', "`"$Dir`"", "`"$claude`"", "`"$Message`"")
  if ($DryRun) { "run: $wt $($wtArgs -join ' ')"; exit 0 }
  Start-Process -FilePath $wt -ArgumentList $wtArgs
} else {
  $command = "Set-Location -LiteralPath '$($Dir -replace "'", "''")'; & '$($claude -replace "'", "''")' '$Message'"
  if ($DryRun) { "run: powershell -NoExit -Command $command"; exit 0 }
  Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit', '-Command', $command)
}
exit 0
