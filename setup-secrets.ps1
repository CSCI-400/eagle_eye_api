# PowerShell script to set up secrets in Google Cloud Secret Manager
# Run this script to create the secrets for Firebase App Hosting

$PROJECT_ID = "eagleeye-e31ac"

Write-Host "Setting up secrets for project: $PROJECT_ID" -ForegroundColor Green

# Check if gcloud is installed
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "`nError: gcloud CLI is not installed!" -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host "`nAlternatively, use Firebase CLI or Google Cloud Console (see DEPLOYMENT_SETUP.md)" -ForegroundColor Yellow
    exit 1
}

# Set the project
gcloud config set project $PROJECT_ID

Write-Host "`nCreating FIREBASE_API_KEY secret..." -ForegroundColor Cyan
$apiKey = "AIzaSyCAQkSykCX3EYF1ZbzLiqvRDoGMWX7hdUE"
$apiKey | gcloud secrets create FIREBASE_API_KEY --data-file=- --replication-policy="automatic" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Secret already exists, adding new version..." -ForegroundColor Yellow
    $apiKey | gcloud secrets versions add FIREBASE_API_KEY --data-file=-
}

Write-Host "`nCreating FIREBASE_SERVICE_ACCOUNT secret..." -ForegroundColor Cyan
$serviceAccount = Get-Content .env | Where-Object { $_ -match "^FIREBASE_SERVICE_ACCOUNT=" }
if ($serviceAccount) {
    $serviceAccountValue = $serviceAccount -replace "^FIREBASE_SERVICE_ACCOUNT='", "" -replace "'$", ""
    $serviceAccountValue | gcloud secrets create FIREBASE_SERVICE_ACCOUNT --data-file=- --replication-policy="automatic" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Secret already exists, adding new version..." -ForegroundColor Yellow
        $serviceAccountValue | gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT --data-file=-
    }
} else {
    Write-Host "Error: Could not find FIREBASE_SERVICE_ACCOUNT in .env file" -ForegroundColor Red
}

Write-Host "`nSecrets setup complete!" -ForegroundColor Green
Write-Host "Your secrets are now stored in Google Cloud Secret Manager." -ForegroundColor Green
Write-Host "`nTo verify, run: gcloud secrets list --project=$PROJECT_ID" -ForegroundColor Cyan
