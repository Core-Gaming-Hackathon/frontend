# Baultro: AI-Powered Gaming Platform on Electroneum

Baultro is a submission to the Electroneum Hackathon 2025, combining AI-powered gameplay with Electroneum blockchain technology to create competitive games where players can stake tokens and earn rewards.

## Project Overview

Baultro allows players to interact with AI personalities that guard virtual vaults. Players attempt to breach these vaults through strategic conversation and social engineering. The platform integrates with the Electroneum blockchain for economic incentives, creating a gaming experience with real stakes.

## Current Development Status

Baultro is in active development with several features ready for demonstration:

- **AI Gameplay**: Interactive AI vaults in single-player mode using Google's Gemini API
- **Electroneum Integration**: Smart contracts deployed on Electroneum testnet
- **Custom AI System**: Multiple difficulty levels and game modes
- **Frontend**: Responsive UI built with Next.js and React
- **Single Game Sessions**: Functional prediction creation and resolution

## Electroneum Integration

The project leverages Electroneum blockchain for several key functions:

- **Fast Transactions**: Taking advantage of Electroneum's 5-second block finality for near-instant game outcomes
- **Low Fees**: Affordable transaction costs make microtransactions viable for game mechanics
- **Smart Contracts**: Two main contracts handle game logic:
  - `BaultroFinal.sol`: Manages predictions and bets
  - `BaultroGames.sol`: Handles game modes including battles, raids, and matches
- **ANKR API**: Uses ANKR's Premium API for reliable blockchain interactions

## Game Modes

### Battle Mode
Players attempt to hack into an AI-protected vault using social engineering and technical approaches.

### Love Mode
Players try to make an AI with professional boundaries express romantic feelings through conversation.

### Mystery Mode
The AI guards a secret phrase that players must extract through strategic questioning.

### Raid Mode
One player sets up a vault that others try to break into, with fees and rewards.

## Technical Implementation

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Component Library**: ShadCN UI
- **Build Tool**: Bun

### AI Integration
- **AI Provider**: Google Gemini API
- **Customization**: Game-specific system prompts
- **Integration**: Server-side API calls with client-side state management

### Blockchain
- **Network**: Electroneum Testnet
- **Contracts**: Solidity smart contracts verified on Electroneum block explorer
- **Client**: viem for type-safe contract interactions
- **Connection**: Web3 wallet connectors (MetaMask compatible)
- **APIs**: ANKR Premium API for reliable RPC access

## Development Roadmap

As a solo developer, I'm planning the following improvements:

1. **Complete Multiplayer**: Add player vs. player functionality
2. **Full Prediction Market**: Implement the complete market system on Electroneum
3. **Mobile Support**: Enhance mobile responsiveness
4. **AI Personality Editor**: Allow custom AI vault configurations
5. **Backend Services**: Eventually rebuild backend components in Elixir for better scalability
6. **Mainnet Deployment**: Move from testnet to Electroneum mainnet

## Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/baultro.git

# Install dependencies
npm install --legacy-peers-deps

# Set up Gemini AI integration
./setup-ai.sh

# Run the development server
npm run dev
```

## Configuration

The project uses environment variables for configuration:

```
# Electroneum Configuration
NEXT_PUBLIC_EVM_NETWORK=testnet
NEXT_PUBLIC_PREDICTION_MARKET_CONTRACT=0x93012953008ef9AbcB71F48C340166E8f384e985
NEXT_PUBLIC_GAME_MODES_CONTRACT=0xC44DE09ab7eEFC2a9a2116E04ca1fcEc86F520fF
NEXT_PUBLIC_ANKR_API_KEY=your_ankr_api_key_here

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

## Contact

For questions about this hackathon submission:

- Email: tricodex.dev@gmail.com