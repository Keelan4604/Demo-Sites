# Deploys the beer tracker. Run from this folder after `npx wrangler login`.
#   .\deploy.ps1                 deploy the Worker + Pages site
#   .\deploy.ps1 -Pin 4820       same, and set (or change) the PIN
#   .\deploy.ps1 -Project name   override the Pages project (default: the one serving beer.keelanodoherty.org)
param(
  [string]$Pin = "",
  [string]$Project = ""
)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$who = npx --yes wrangler@latest whoami 2>&1 | Out-String
if ($who -match "not authenticated") {
  Write-Host "Wrangler is not logged in. Run: npx wrangler login" -ForegroundColor Red
  exit 1
}

if (-not $Project) {
  $list = npx --yes wrangler@latest pages project list 2>&1 | Out-String
  $line = ($list -split "`n") | Where-Object { $_ -match "beer\.keelanodoherty\.org" } | Select-Object -First 1
  if ($line) { $Project = ($line -split "\|")[0].Trim().Trim("│").Trim() }
}
if (-not $Project) {
  Write-Host "No Pages project serves beer.keelanodoherty.org yet. Creating 'beer-tracker'; attach the domain in the dashboard afterwards." -ForegroundColor Yellow
  npx --yes wrangler@latest pages project create beer-tracker --production-branch main
  $Project = "beer-tracker"
}
Write-Host "Pages project: $Project" -ForegroundColor Cyan

Write-Host "`n1/3  Durable Object worker" -ForegroundColor Cyan
Push-Location do
npx --yes wrangler@latest deploy
Pop-Location

if ($Pin) {
  Write-Host "`n2/3  PIN secret" -ForegroundColor Cyan
  $Pin | npx --yes wrangler@latest pages secret put PIN --project-name $Project
} else {
  Write-Host "`n2/3  PIN unchanged (pass -Pin 1234 to set it)" -ForegroundColor DarkGray
}

Write-Host "`n3/3  Pages site" -ForegroundColor Cyan
npx --yes wrangler@latest pages deploy . --project-name $Project --branch main --commit-dirty=true

Write-Host "`nDone. https://beer.keelanodoherty.org" -ForegroundColor Green
