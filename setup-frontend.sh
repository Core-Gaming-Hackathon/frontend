#!/bin/bash
# Frontend Setup Script
# This script sets up the frontend to use the running ZerePy API

# Color codes for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}      Frontend Setup Script           ${NC}"
echo -e "${BLUE}=======================================${NC}"

# Check if the ZerePy API is running
echo -e "\n${BLUE}Checking if ZerePy API is running...${NC}"
API_RESPONSE=$(curl -s "$API_URL/")

if [ -n "$API_RESPONSE" ]; then
    echo -e "${GREEN}✅ ZerePy API is running at: $API_URL${NC}"
    echo "$API_RESPONSE" | python -m json.tool || echo "$API_RESPONSE"
else
    echo -e "${RED}❌ ZerePy API is not running at $API_URL${NC}"
    echo -e "${YELLOW}Please start the ZerePy API first using:${NC}"
    echo -e "${YELLOW}cd /Users/pc/apps/MPC/hackathons/game/ZerePy && ./run-zerepy-test.sh${NC}"
    exit 1
fi

# Set up the frontend environment
echo -e "\n${BLUE}Setting up frontend environment...${NC}"
echo "NEXT_PUBLIC_ZEREPY_API_URL=$API_URL" > .env.local
echo -e "${GREEN}✅ Created .env.local file${NC}"

# Install dependencies if needed
echo -e "\n${BLUE}Checking for dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️ node_modules not found, installing dependencies...${NC}"
    npm install --quiet
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Build the frontend
echo -e "\n${BLUE}Building the frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build the frontend${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Start the frontend
echo -e "\n${BLUE}Starting the frontend...${NC}"
npm run start &
FRONTEND_PID=$!

# Wait for the frontend to start
echo -e "${BLUE}Waiting for the frontend to start...${NC}"
ATTEMPTS=0
MAX_ATTEMPTS=30
FRONTEND_READY=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    if curl -s -I "$FRONTEND_URL" 2>/dev/null | head -1 | grep -q "200\|304"; then
        FRONTEND_READY=true
        break
    fi
    ATTEMPTS=$((ATTEMPTS+1))
    echo -n "."
    sleep 1
done
echo "" # New line after dots

if [ "$FRONTEND_READY" = false ]; then
    echo -e "${RED}❌ Failed to start the frontend after $MAX_ATTEMPTS attempts${NC}"
    kill $FRONTEND_PID &> /dev/null
    exit 1
fi

# Final instructions
echo -e "\n${BLUE}=======================================${NC}"
echo -e "${GREEN}✅ Frontend is now running!${NC}"
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}Frontend URL:${NC} $FRONTEND_URL"
echo -e "${BLUE}API URL:${NC} $API_URL"
echo -e ""
echo -e "${YELLOW}Note: The frontend is running with PID: $FRONTEND_PID${NC}"
echo -e "${YELLOW}To stop it, press Ctrl+C or run: kill $FRONTEND_PID${NC}"
echo -e ""
echo -e "${GREEN}Enjoy your Baultro demo!${NC}"

# Wait for the user to press Ctrl+C
trap "kill $FRONTEND_PID &> /dev/null; echo -e '\n${BLUE}Frontend stopped.${NC}'" SIGINT SIGTERM
wait $FRONTEND_PID
