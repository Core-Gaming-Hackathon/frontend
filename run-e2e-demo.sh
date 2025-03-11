#!/bin/bash
# Baultro E2E Demo Setup Script
# This script sets up ZerePy API and connects the frontend to it

# Color codes for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
FRONTEND_DIR="/Users/pc/apps/MPC/hackathons/game/demo-frontend"
ZEREPY_DIR="/Users/pc/apps/MPC/hackathons/game/ZerePy"
API_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}      Baultro E2E Demo Setup          ${NC}"
echo -e "${BLUE}=======================================${NC}"

# Make sure we're in the frontend directory
cd "$FRONTEND_DIR"

# 1. First, start and test the ZerePy API
echo -e "\n${BLUE}Step 1: Starting ZerePy API${NC}"
cd "$ZEREPY_DIR"

# Stop any existing API processes
echo -e "${BLUE}Stopping any existing API processes...${NC}"
pkill -f "uvicorn src.simple_together:app" &> /dev/null || true
docker stop $(docker ps -aq --filter "name=zerepy") &> /dev/null || true

# Start the simple API in the background
echo -e "${BLUE}Starting simple ZerePy API...${NC}"

# Make sure the script is executable
chmod +x run-simple-api.sh

# Run in background
./run-simple-api.sh > /dev/null 2>&1 &
API_PID=$!

# Wait for API to start
echo -e "${BLUE}Waiting for API to start...${NC}"
ATTEMPTS=0
MAX_ATTEMPTS=30
API_READY=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    if curl -s "$API_URL" > /dev/null; then
        API_READY=true
        break
    fi
    ATTEMPTS=$((ATTEMPTS+1))
    echo -n "."
    sleep 1
done
echo "" # New line after dots

if [ "$API_READY" = false ]; then
    echo -e "${RED}❌ Failed to start ZerePy API after $MAX_ATTEMPTS attempts.${NC}"
    kill $API_PID &> /dev/null
    exit 1
fi

echo -e "${GREEN}✅ ZerePy API is running at: $API_URL${NC}"

# 2. Test the API with a basic endpoint
echo -e "\n${BLUE}Step 2: Testing API endpoints${NC}"

# Test root endpoint
ROOT_RESPONSE=$(curl -s "$API_URL/")
if [ -n "$ROOT_RESPONSE" ]; then
    echo -e "${GREEN}✅ API root endpoint working${NC}"
else
    echo -e "${RED}❌ API root endpoint not responding${NC}"
    kill $API_PID &> /dev/null
    exit 1
fi

# Test game prompt endpoint
GAME_RESPONSE=$(curl -s -X POST "$API_URL/game/prompt" \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Hi, who are you?", "system_prompt":"You are a gaming AI."}')

if [ -n "$GAME_RESPONSE" ]; then
    echo -e "${GREEN}✅ Game prompt endpoint working${NC}"
    echo -e "${BLUE}Sample response:${NC}"
    echo "$GAME_RESPONSE" | python -m json.tool 2>/dev/null || echo "$GAME_RESPONSE"
else
    echo -e "${RED}❌ Game prompt endpoint not responding${NC}"
    kill $API_PID &> /dev/null
    exit 1
fi

# 3. Set up frontend to use the API
echo -e "\n${BLUE}Step 3: Setting up frontend${NC}"
cd "$FRONTEND_DIR"

# Create or update .env.local file
echo -e "${BLUE}Creating .env.local file...${NC}"
echo "NEXT_PUBLIC_ZEREPY_API_URL=$API_URL" > .env.local
echo -e "${GREEN}✅ Created .env.local file${NC}"

# 4. Build and start the frontend
echo -e "\n${BLUE}Step 4: Building frontend${NC}"

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found, installing dependencies...${NC}"
    npm install --quiet
fi

# Build the Next.js application
echo -e "${BLUE}Building the Next.js application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build the frontend application.${NC}"
    kill $API_PID &> /dev/null
    exit 1
fi

echo -e "${GREEN}✅ Frontend application built successfully!${NC}"

# 5. Start the frontend
echo -e "\n${BLUE}Step 5: Starting frontend${NC}"
npm run start &
FRONTEND_PID=$!

# Wait for frontend to start
echo -e "${BLUE}Waiting for frontend to start...${NC}"
ATTEMPTS=0
MAX_ATTEMPTS=30
FRONTEND_READY=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    if curl -s "$FRONTEND_URL" > /dev/null; then
        FRONTEND_READY=true
        break
    fi
    ATTEMPTS=$((ATTEMPTS+1))
    echo -n "."
    sleep 1
done
echo "" # New line after dots

if [ "$FRONTEND_READY" = false ]; then
    echo -e "${RED}❌ Failed to start frontend after $MAX_ATTEMPTS attempts.${NC}"
    kill $API_PID &> /dev/null
    kill $FRONTEND_PID &> /dev/null
    exit 1
fi

# 6. Show summary and instructions
echo -e "\n${BLUE}=======================================${NC}"
echo -e "${GREEN}✅ Baultro E2E Demo is now running!${NC}"
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}ZerePy API:${NC} $API_URL"
echo -e "${BLUE}Frontend:${NC} $FRONTEND_URL"
echo -e ""
echo -e "${BLUE}To stop the demo:${NC}"
echo -e "1. Press Ctrl+C to stop this script"
echo -e "2. Kill the API with 'kill $API_PID'"
echo -e "3. Kill the frontend with 'kill $FRONTEND_PID'"
echo -e ""
echo -e "${YELLOW}Note: The demo is running in mock mode without a real Together API key.${NC}"
echo -e "${YELLOW}      Responses will be simulated but all functionality works.${NC}"
echo -e ""
echo -e "${GREEN}Enjoy your demo!${NC}"

# Keep the script running
trap "kill $API_PID; kill $FRONTEND_PID; echo -e '\n${BLUE}Demo stopped.${NC}'" EXIT
wait $FRONTEND_PID
