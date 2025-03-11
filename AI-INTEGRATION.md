# AI Integration for Baultro

This project uses Google's Gemini API for AI-powered game modes. This document explains how to set up and configure the AI integration.

## Gemini API Integration

### Getting Started

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Create an account or sign in
   - Go to the API keys section and create a new key
   - Copy your API key

2. **Set Up Environment Variables**:
   - Edit the `.env.local` file in the project root
   - Update the `GEMINI_API_KEY` with your key:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     ```

3. **Install Dependencies**:
   - Ensure you have the required dependencies:
     ```bash
     npm install @google/generative-ai
     ```

### Features

The Gemini integration supports the following game modes:

- **Battle Mode**: Challenge the AI security system
- **Love Mode**: Try to get the AI to express love
- **Mystery Mode**: Extract a secret phrase from the AI
- **Raid Mode**: Break into an AI-protected vault

### Configuration

The default configuration uses the `gemini-2.0-flash` model, which provides a good balance of speed and quality. You can adjust the following parameters:

- **Temperature**: Controls randomness (0.0 to 1.0)
- **Max Tokens**: Controls response length
- **Top-K** and **Top-P**: Controls sampling variety

These settings are optimized for each game mode to provide the best experience.

## Using Different AI Providers

The system is designed to support multiple AI providers:

1. **Gemini** (default): Google's AI
2. **ZerePy**: Alternative implementation

To change the provider, update the `getDefaultAIProvider` function in `src/lib/env.ts`:

```typescript
export function getDefaultAIProvider(): string {
  return 'gemini'; // or 'zerepy'
}
```

## Troubleshooting

If you encounter issues with the AI:

1. **Mock Mode**: The system automatically falls back to mock mode if the API key is not properly configured
2. **API Limits**: Ensure you haven't exceeded your API usage limits
3. **Network Issues**: Check your internet connection and firewall settings

## Development

For development, you can use the mock mode to avoid consuming API credits:

```typescript
// Initialize with mock mode forced
const provider = new GeminiProvider({}, true);
```

---

For more details, see the implementation in:
- `src/lib/gemini-provider.ts` - Core Gemini API integration
- `src/lib/gemini-game-service.ts` - Game-specific logic
- `src/lib/ai-service-factory.ts` - Factory for creating AI services