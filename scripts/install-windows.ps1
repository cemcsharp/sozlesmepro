param(
  [string]$InstallDir = (Get-Location).Path,
  [string]$EnvFile = "$InstallDir\.env",
  [string]$ServiceName = "SozlesmePRO",
  [string]$NssmPath = "",
  [switch]$DbMigrate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $InstallDir)) { throw "InstallDir not found: $InstallDir" }
if (-not (Test-Path $EnvFile)) { throw ".env not found: $EnvFile" }

Set-Location $InstallDir

$uploads = Join-Path $InstallDir "uploads\contracts"
New-Item -ItemType Directory -Force -Path $uploads | Out-Null

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { try { winget install OpenJS.NodeJS.LTS -e -h } catch {} }

npm ci
if ($DbMigrate) { npm run db:migrate; npm run db:generate }
npm run build

if ($NssmPath -and (Test-Path $NssmPath)) {
  $npmCmd = (Get-Command npm).Source
  & $NssmPath install $ServiceName $npmCmd "run start"
  & $NssmPath set $ServiceName AppDirectory $InstallDir
  & $NssmPath set $ServiceName DisplayName $ServiceName
  & $NssmPath set $ServiceName Start SERVICE_AUTO_START
  & $NssmPath set $ServiceName Stdout (Join-Path $InstallDir "server.log")
  & $NssmPath set $ServiceName Stderr (Join-Path $InstallDir "server.log")
  & $NssmPath start $ServiceName
} else {
  Write-Output "Start command: npm run start"
}

Write-Output "Done"