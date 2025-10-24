#!/bin/bash

# Biometric Service Startup Script

set -e

echo "🚀 Starting Biometric Verification Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Create data directory if it doesn't exist
if [ ! -d "data/faces" ]; then
    echo "📁 Creating data directory..."
    mkdir -p data/faces
fi

# Check if .env exists, create from example if not
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please review and update .env with your settings"
fi

# Start the service
echo "✅ Starting service on http://localhost:8000"
echo "📖 API documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

uvicorn app:app --reload --host 0.0.0.0 --port 8000
