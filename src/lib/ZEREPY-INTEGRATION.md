# ZerePy Integration for Baultro

This document describes how to integrate ZerePy as an AI provider for the Baultro gaming platform.

## Overview

Baultro now supports multiple AI providers:
- Gemini (default)
- ZerePy

This integration allows you to switch between providers or use both simultaneously.

## Setup Instructions

### 1. Set up the ZerePy API Server

The ZerePy API server provides endpoints for Baultro to communicate with ZerePy. You can run it either directly or using Docker.

#### Option A: Docker Setup (Recommended)

##### Prerequisites

- Docker and Docker Compose

##### Installation Steps

1. Navigate to the ZerePy directory:
   ```bash
   cd /Users/pc/apps/MPC/hackathons/game/ZerePy
   ```

2. Run the quick start script:
   ```bash
   ./quick-start-docker.sh
   ```
   This will:
   - Build the Docker image
   - Start the container
   - Run tests to verify the API is working
   - Display information on how to manage the container

3. The API will be available at http://localhost:8000

#### Option B: Direct Setup

##### Prerequisites

- Python 3.10+
- Poetry (for dependency management)
- ZerePy repository

##### Installation Steps

1. Navigate to the ZerePy directory:
   ```bash
   cd /Users/pc/apps/MPC/hackathons/game/ZerePy
   ```

2. Install dependencies with Poetry:
   ```bash
   poetry install
   ```

3. Configure at least one LLM provider in ZerePy:
   ```bash
   poetry run python main.py
   ```
   
   In the ZerePy CLI, configure at least one of these providers:
   ```
   configure-connection openai
   # OR
   configure-connection anthropic
   # OR
   configure-connection eternalai
   ```

4. Start the ZerePy API server:
   ```bash
   ./start_baultro_api.sh
   ```
   This will start the FastAPI server on http://localhost:8000

### 2. Configure Baultro to use ZerePy

1. Add environment variables to your `.env.local` file:
   ```
   ZEREPY_API_URL=http://localhost:8000
   DEFAULT_AI_PROVIDER=gemini  # Use 'zerepy' to make ZerePy the default
   ```

2. Add the provided TypeScript files to your project:
   - `zerepy-provider.ts` → `src/lib/ai/zerepy-provider.ts`
   - `zerepy-game-service.ts` → `src/lib/ai/zerepy-game-service.ts`
   - `ai-service-factory.ts` → `src/lib/ai/ai-service-factory.ts`

3. Update your environment configuration:
   Add the functions from `server-env-additions.ts` to your `server/env.ts` file.

4. Update your game API route:
   Replace your existing `/api/game/prompt` route with the updated version in `unified-prompt-api.ts`.

## Usage

### Testing the API Server

You can test the ZerePy API server directly:

1. Generate text:
   ```bash
   curl -X POST http://localhost:8000/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt":"Hello, who are you?", "temperature":0.7}'
   ```

2. Chat:
   ```bash
   curl -X POST http://localhost:8000/chat \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hello, who are you?"}], "temperature":0.7}'
   ```

### Switching Providers in Baultro

To use ZerePy for a specific game session, add the provider parameter to your API calls:

```typescript
// In your game component
const handleSendMessage = async (message: string) => {
  const response = await fetch('/api/game/prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      gameType: 'BATTLE',
      chatHistory: currentChatHistory,
      provider: 'zerepy'  // Use 'gemini' for Gemini
    }),
  });
  
  const result = await response.json();
  // Handle the result...
};
```

To make ZerePy the default for the entire application, set `DEFAULT_AI_PROVIDER=zerepy` in your `.env.local` file.

## Troubleshooting

### API Server Issues

#### Docker Setup

If you're using Docker and encounter issues:

1. Check container status:
   ```bash
   docker ps | grep zerepy-api
   ```

2. View container logs:
   ```bash
   docker compose logs zerepy-api
   ```

3. Restart the container:
   ```bash
   docker compose restart zerepy-api
   ```

4. Rebuild and restart the container:
   ```bash
   docker compose down
   docker compose build
   docker compose up -d
   ```

#### Direct Setup

If you're running without Docker and encounter issues:

1. Check that the server is running:
   ```bash
   curl http://localhost:8000/
   ```
   Should return a status response.

2. Check the server logs for errors.

3. Ensure at least one LLM provider is configured in ZerePy:
   ```bash
   curl http://localhost:8000/providers
   ```
   Should list available providers.

### Integration Issues

1. Check the browser console for errors in API calls.

2. Ensure the environment variables are correctly set.

3. If using mock mode, ensure that's intentional (check logs for "Using mock ZerePy mode").

## Technical Details

### API Endpoints

The ZerePy API server provides these endpoints:

- `GET /` - Server status
- `GET /providers` - List available LLM providers
- `POST /generate` - Generate text from a prompt
- `POST /chat` - Generate a response based on chat history
- `POST /game/prompt` - Generate a response for a game-specific prompt

### Provider Switching

The `AIServiceFactory` class handles provider switching based on the `provider` parameter passed to API calls.

### Mock Mode

Both Gemini and ZerePy providers have a mock mode that returns simulated responses when the actual API is unavailable.

## Mock Mode

Both the Docker container and direct setup support a mock mode for LLM responses, which is useful for development and testing without real API credentials.

### Enabling Mock Mode in Docker

Mock mode is enabled by default in the Docker setup. To disable it and use real LLM providers:

1. Edit the `docker-compose.yml` file:
   ```yaml
   environment:
     - MOCK_LLM=false  # Change from true to false
   ```

2. Restart the container:
   ```bash
   docker compose restart zerepy-api
   ```

### Enabling Mock Mode in Direct Setup

To enable mock mode in direct setup:

```bash
export MOCK_LLM=true
./start_baultro_api.sh
```

## Advanced Configuration

### Customizing Game Personalities

You can create custom AI personalities for different game modes that work with both providers. See the AIPersonalityService implementation for details.