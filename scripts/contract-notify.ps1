param(
  [string]$BaseUrl = "http://localhost:3000/api/notifications"
)

try {
  Invoke-RestMethod -Method POST -Uri $BaseUrl -ContentType "application/json" -Body '{"action":"check-expiring"}' | Out-Null
  Invoke-RestMethod -Method POST -Uri $BaseUrl -ContentType "application/json" -Body '{"action":"send-pending"}' | Out-Null
} catch {
  Write-Error $_
}