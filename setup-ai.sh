#!/bin/bash

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Print banner
echo "=========================================="
echo "  Setting up Baultro AI with Gemini"
echo "=========================================="
echo

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install Google Generative AI dependency
echo "Installing Google Generative AI package..."
npm install @google/generative-ai --save

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cp .env.example .env.local 2>/dev/null || echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env.local
fi

# Check if GEMINI_API_KEY is in .env.local
if ! grep -q "GEMINI_API_KEY" .env.local; then
    echo "Adding GEMINI_API_KEY to .env.local..."
    echo >> .env.local
    echo "# AI Configuration" >> .env.local
    echo "GEMINI_API_KEY=your_gemini_api_key_here" >> .env.local
fi

echo
echo "Setup complete! Please update your .env.local file with your actual Gemini API key."
echo "For more details, see the AI-INTEGRATION.md file."
echo
