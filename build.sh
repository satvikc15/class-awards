#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Install frontend dependencies and build the static files
echo "Building frontend..."
npm install
npm run build

# 2. Install backend Python dependencies
echo "Installing backend dependencies..."
pip install -r backend/requirements.txt
