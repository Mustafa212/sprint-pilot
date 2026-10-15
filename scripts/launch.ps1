<#
.SYNOPSIS
Opens one sprint-pilot unit on Windows: a Claude Desktop chat on a folder (the message goes on the
clipboard), or a terminal tab running Claude with the message.
.EXAMPLE
powershell -NoProfile -ExecutionPolicy Bypass -File launch.ps1 -Dir C:\src\shop.worktrees\sprint-7-101 -Mode desktop -Message "/senior-dev .ai-session/launch.md"
#>
param(
  [Parameter(Mandatory = $true)][string]$Dir,
  [Parameter(Mandatory = $true)][ValidateSet('desktop', 'terminal')][string]$Mode,
  [Parameter(Mandatory = $true)][string]$Message,
  [switch]$DryRun
)
# Test hooks: SP_CLAUDE overrides the claude path; SP_WT overrides wt ('none' = no wt).

if (-not (Test-Path -LiteralPath $Dir -PathType Container)) {
  [Console]::Error.WriteLine("Folder not found: $Dir"); exit 2
}
$claude = $env:SP_CLAUDE
if (-not $claude) { $found = Get-Command claude -ErrorAction SilentlyContinue; if ($found) { $claude = $found.Source } }
if (-not $claude) { [Console]::Error.WriteLine('claude is not on PATH'); exit 3 }

if ($Mode -eq 'desktop') {
  if ($DryRun) { "clipboard: $Message"; "run: claude --desktop (in $Dir)"; exit 0 }
  Set-Clipboard -Value $Message
  # claude --desktop needs a console of its own; Start-Process gives it one.
  Start-Process -FilePath $claude -ArgumentList '--desktop' -WorkingDirectory $Dir
  exit 0
}

$wt = $env:SP_WT
if (-not $wt) { $found = Get-Command wt -ErrorAction SilentlyContinue; if ($found) { $wt = $found.Source } }
if ($wt -and $wt -ne 'none') {
  $quoted = '"' + ($Message -replace '"', '\"') + '"'
  $wtArgs = @('-w', '0', 'nt', '-d', "`"$Dir`"", "`"$claude`"", $quoted)
  if ($DryRun) { "run: $wt $($wtArgs -join ' ')"; exit 0 }
  Start-Process -FilePath $wt -ArgumentList $wtArgs
} else {
  $psMessage = "'" + ($Message -replace "'", "''") + "'"
  $command = "Set-Location -LiteralPath '$($Dir -replace "'", "''")'; & '$($claude -replace "'", "''")' $psMessage"
  if ($DryRun) { "run: powershell -NoExit -Command $command"; exit 0 }
  Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit', '-Command', $command)
}
exit 0
