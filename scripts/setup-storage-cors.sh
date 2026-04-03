#!/bin/bash

# Firebase Storage CORS Setup Script
# This script configures CORS for Firebase Storage to allow uploads from localhost

set -e

PROJECT_ID="tripplanner-d4df2"
BUCKET="gs://tripplanner-d4df2.appspot.com"
CORS_FILE="cors.json"

echo "🔧 Setting up Firebase Storage CORS..."
echo ""

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "❌ gsutil is not installed!"
    echo ""
    echo "Install Google Cloud SDK:"
    echo "  macOS:   brew install google-cloud-sdk"
    echo "  Other:   https://cloud.google.com/storage/docs/gsutil_install"
    echo ""
    exit 1
fi

# Check if cors.json exists
if [ ! -f "$CORS_FILE" ]; then
    echo "❌ cors.json not found!"
    echo "Make sure you're in the project root directory."
    exit 1
fi

echo "✅ gsutil is installed"
echo "✅ cors.json found"
echo ""

# Login to Google Cloud (if needed)
echo "🔐 Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "Please login to Google Cloud:"
    gcloud auth login
else
    ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    echo "✅ Logged in as: $ACTIVE_ACCOUNT"
fi

echo ""

# Set project
echo "📦 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

echo ""

# Apply CORS
echo "🚀 Applying CORS configuration to: $BUCKET"
gsutil cors set $CORS_FILE $BUCKET

echo ""

# Verify CORS
echo "✅ Verifying CORS configuration:"
gsutil cors get $BUCKET

echo ""
echo "✅ CORS configuration applied successfully!"
echo ""
echo "Next steps:"
echo "1. Refresh your browser (Cmd+R or Ctrl+R)"
echo "2. Try uploading an image again"
echo "3. It should work now! 🎉"
