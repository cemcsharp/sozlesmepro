# SözleşmePRO Automated Database Backup Script
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/backup-db.ps1

$BACKUP_DIR = Join-Path $PSScriptRoot "..\backups"
$CONTAINER_NAME = "sozlesmepro-db"
$DB_NAME = "sozlesmepro"
$DB_USER = "postgres"

# Create backup directory structure
$DAILY_DIR = Join-Path $BACKUP_DIR "daily"
$WEEKLY_DIR = Join-Path $BACKUP_DIR "weekly"
$MONTHLY_DIR = Join-Path $BACKUP_DIR "monthly"

foreach ($dir in @($DAILY_DIR, $WEEKLY_DIR, $MONTHLY_DIR)) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$DAY_OF_WEEK = (Get-Date).DayOfWeek
$DAY_OF_MONTH = (Get-Date).Day
$FILENAME = "backup_${DB_NAME}_${TIMESTAMP}.sql"
$TEMP_FILE = Join-Path $BACKUP_DIR $FILENAME

Write-Host "--- Starting Backup: $TIMESTAMP ---" -ForegroundColor Cyan

# 1. Create the Backup using Docker
try {
    Write-Host "Dumping database from container..."
    docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > $TEMP_FILE
    
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }

    Write-Host "Backup created: $FILENAME" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Daily Rotation (Keep last 7 days)
$DAILY_PATH = Join-Path $DAILY_DIR $FILENAME
Copy-Item $TEMP_FILE $DAILY_PATH
Get-ChildItem $DAILY_DIR | Sort-Object LastWriteTime -Descending | Select-Object -Skip 7 | Remove-Item -Force

# 3. Weekly Rotation (Every Sunday, keep last 4 weeks)
if ($DAY_OF_WEEK -eq "Sunday") {
    $WEEKLY_PATH = Join-Path $WEEKLY_DIR $FILENAME
    Copy-Item $TEMP_FILE $WEEKLY_PATH
    Get-ChildItem $WEEKLY_DIR | Sort-Object LastWriteTime -Descending | Select-Object -Skip 4 | Remove-Item -Force
    Write-Host "Weekly backup saved." -ForegroundColor Yellow
}

# 4. Monthly Rotation (1st of every month, keep last 12 months)
if ($DAY_OF_MONTH -eq 1) {
    $MONTHLY_PATH = Join-Path $MONTHLY_DIR $FILENAME
    Copy-Item $TEMP_FILE $MONTHLY_PATH
    Get-ChildItem $MONTHLY_DIR | Sort-Object LastWriteTime -Descending | Select-Object -Skip 12 | Remove-Item -Force
    Write-Host "Monthly backup saved." -ForegroundColor Yellow
}

# Cleanup temp file
if (Test-Path $TEMP_FILE) {
    Remove-Item $TEMP_FILE -Force
}

Write-Host "--- Backup Complete ---" -ForegroundColor Cyan
