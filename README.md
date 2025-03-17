# Core DAO Frontend

A frontend application for interacting with the Core Blockchain Testnet.

## Getting Started

### Prerequisites

- Node.js 18+ and Bun package manager
- Core DAO wallet (for production use)

### Installation

```bash
# Install dependencies
bun install
```

### Development

```bash
# Run the development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Network Configuration

### Mock Mode

The application includes a mock mode for development that simulates blockchain interactions without making actual RPC calls. This is useful for development and testing when the blockchain network is unavailable or you want to avoid making excessive network requests.

To enable mock mode, set the following environment variable:

```
NEXT_PUBLIC_ENABLE_MOCK_MODE=true
```

This is enabled by default in the `.env.local` file for development.

### RPC Configuration

The application uses the following RPC endpoints:

- Primary: `NEXT_PUBLIC_RPC_URL` (default: https://rpc.test2.btcs.network)
- Fallbacks:
  - `NEXT_PUBLIC_FALLBACK_RPC_URL_1` (default: https://rpc.test2.coredao.org)
  - `NEXT_PUBLIC_FALLBACK_RPC_URL_2` (default: https://rpc-core.icecreamswap.com)

If the primary RPC endpoint is unavailable, the application will automatically try the fallback URLs.

### Handling Network Issues

If you encounter network issues with the Core Blockchain Testnet RPC endpoints:

1. **Enable Mock Mode**: Set `NEXT_PUBLIC_ENABLE_MOCK_MODE=true` in your `.env.local` file
2. **Try Alternative RPC Endpoints**: Configure alternative RPC endpoints in your `.env.local` file:
   ```
   NEXT_PUBLIC_RPC_URL=https://rpc.test2.coredao.org
   NEXT_PUBLIC_FALLBACK_RPC_URL_1=https://rpc-core.icecreamswap.com
   ```
3. **Increase Timeout**: If the network is slow, increase the timeout:
   ```
   NEXT_PUBLIC_RPC_TIMEOUT=60000
   ```

## Features

- **Prediction Market**: Create and participate in prediction markets
- **Mock Mode**: Develop and test without actual blockchain interactions
- **Responsive Design**: Works on desktop and mobile devices

## Troubleshooting

### Network Errors

If you see errors like:

```
HTTP request failed. URL: https://rpc.test2.btcs.network
Request body: {"method":"eth_call","params":[...]}
Details: Failed to fetch
```

This indicates that the RPC endpoint is unreachable. Try the following:

1. Check your internet connection
2. Enable mock mode as described above
3. Try alternative RPC endpoints
4. Check if the Core Blockchain Testnet is experiencing issues

### CORS Errors

The application includes a CORS proxy to handle CORS issues with the RPC endpoints. If you still encounter CORS errors, try:

1. Enable mock mode
2. Use a browser extension to disable CORS (for development only)
3. Set up a local proxy server

## Development Setup

### Prerequisites

- Node.js 18+ and Bun package manager
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/core-dao-frontend.git
cd core-dao-frontend
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env.local` file with your configuration:
```
NEXT_PUBLIC_RPC_URL=https://rpc.test2.btcs.network
NEXT_PUBLIC_CHAIN_ID=1114
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0xC44DE09ab7eEFC2a9a2116E04ca1fcEc86F520fF
```

4. Start the development server:
```bash
bun run dev
```

## Mock Mode

To avoid excessive network requests during development, you can enable mock mode. This will use generated mock data instead of making actual blockchain calls.

### Enabling Mock Mode

Add the following to your `.env.local` file:

```
NEXT_PUBLIC_ENABLE_MOCK_MODE=true
```

When mock mode is enabled:
- A "Mock Data Mode" indicator will appear in the UI
- No actual blockchain calls will be made
- Random mock predictions will be generated
- Contract interactions will return successful mock responses

This is useful for:
- UI development without blockchain connectivity
- Testing the application without spending gas
- Avoiding rate limits on RPC providers
- Working offline

### Disabling Mock Mode

To disable mock mode and use real blockchain data, set:

```
NEXT_PUBLIC_ENABLE_MOCK_MODE=false
```

Or remove the variable entirely from your `.env.local` file.

## Performance Optimizations

The application includes several optimizations to reduce network requests:

1. **Data Caching**: Predictions and user bets are cached for 5 minutes
2. **Auto-refresh Control**: Auto-refresh is disabled by default
3. **Debounced Requests**: Multiple rapid requests are debounced
4. **CORS Proxy**: A CORS proxy is used to avoid cross-origin issues
5. **Mock Mode**: For development without blockchain calls

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.