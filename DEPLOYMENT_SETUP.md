# Firebase App Hosting - Secrets Setup Guide

## Overview
Your `.env` file contains sensitive credentials that should **never** be committed to Git. For Firebase App Hosting deployments, these secrets must be stored in Google Cloud Secret Manager.

## Secrets Configuration

Your `apphosting.yaml` is now configured to use the following secrets:

1. **FIREBASE_API_KEY** - Your Firebase API key
2. **FIREBASE_SERVICE_ACCOUNT** - Your Firebase service account JSON

## Setup Instructions

### Option 1: Using Firebase CLI (Recommended)

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set your project
firebase use eagleeye-e31ac

# Create secrets using Firebase CLI
firebase apphosting:secrets:set FIREBASE_API_KEY
# When prompted, paste: AIzaSyCAQkSykCX3EYF1ZbzLiqvRDoGMWX7hdUE

firebase apphosting:secrets:set FIREBASE_SERVICE_ACCOUNT
# When prompted, paste the entire service account JSON from your .env file
```

### Option 2: Using Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `eagleeye-e31ac`
3. Navigate to **Security** → **Secret Manager**
4. Click **Create Secret**

#### Create FIREBASE_API_KEY:
- Name: `FIREBASE_API_KEY`
- Secret value: `AIzaSyCAQkSykCX3EYF1ZbzLiqvRDoGMWX7hdUE`
- Click **Create**

#### Create FIREBASE_SERVICE_ACCOUNT:
- Name: `FIREBASE_SERVICE_ACCOUNT`
- Secret value: Paste the entire JSON from your `.env` file (the value of FIREBASE_SERVICE_ACCOUNT)
- Click **Create**

### Option 3: Using gcloud CLI (Linux/Mac/WSL)

If you have Google Cloud SDK installed:

```bash
# Make the setup script executable
chmod +x setup-secrets.sh

# Run the script
./setup-secrets.sh
```

## Verification

After creating the secrets, you can verify them:

```bash
# List all secrets
firebase apphosting:secrets:list

# Or using gcloud
gcloud secrets list --project=eagleeye-e31ac
```

## Deploy

Once secrets are set up, deploy your app:

```bash
# Using Firebase CLI
firebase deploy --only hosting

# Or push to your Git repository - Firebase App Hosting will auto-deploy
git add .
git commit -m "Configure secrets for deployment"
git push
```

## Local Development

For local development, continue using your `.env` file as before:

```bash
npm run dev
```

The `dotenv` package will load environment variables from `.env` during local development, while Firebase App Hosting will use Secret Manager during deployment.

## Security Best Practices

✅ **DO:**
- Keep `.env` in `.gitignore`
- Use Secret Manager for production secrets
- Rotate secrets regularly
- Limit secret access to necessary service accounts

❌ **DON'T:**
- Commit `.env` to Git
- Share secrets in chat/email
- Hardcode secrets in your code
- Use the same secrets for dev and production

## Troubleshooting

### Secret not found during deployment
- Verify secret names match exactly (case-sensitive)
- Ensure secrets exist in the correct GCP project
- Check IAM permissions for the App Hosting service account

### How to update a secret
```bash
# Using Firebase CLI
firebase apphosting:secrets:set FIREBASE_API_KEY
# Enter new value when prompted

# Or using gcloud
echo "new-value" | gcloud secrets versions add FIREBASE_API_KEY --data-file=-
```

## Reference
- [Firebase App Hosting Secrets Documentation](https://firebase.google.com/docs/app-hosting/configure#secret-parameters)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)
