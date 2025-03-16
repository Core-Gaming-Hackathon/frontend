# Core DAO Frontend

A modern, production-ready frontend application for the Core DAO platform, built with Next.js 15, React 19, and Bun.

## 🚀 Features

- **Prediction Markets**: Create and participate in prediction markets
- **Gaming**: Interactive gaming experiences
- **Chat Interface**: AI-powered chat interface using Gemini 2.0 Flash
- **Marketplace**: Buy and sell digital assets
- **Leaderboard**: Track user rankings and achievements

## 📋 Prerequisites

- [Bun](https://bun.sh/) v1.2.5 or higher
- [Node.js](https://nodejs.org/) v20 or higher (for certain tools)
- [PostgreSQL](https://www.postgresql.org/) database

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/core-dao-frontend.git
   cd core-dao-frontend
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your specific configuration.

4. Run database migrations:
   ```bash
   bun run db:migrate
   ```

5. Start the development server:
   ```bash
   bun run dev
   ```

## 🧪 Testing

Run the test suite:
```bash
bun test
```

Run specific tests:
```bash
bun test tests/prediction-market-e2e.test.tsx
```

Watch mode for development:
```bash
bun test:watch
```

## 🏗️ Build

Build for production:
```bash
bun run prod:build
```

Start production server:
```bash
bun run prod:start
```

## 📊 Bundle Analysis

Analyze the bundle size:
```bash
bun run analyze
```

## 🗄️ Database

The application uses PostgreSQL with Drizzle ORM for database operations. For comprehensive database documentation, see [DATABASE.md](./DATABASE.md).

### Database Commands

Generate migrations:
```bash
bun run db:generate
```

Run migrations:
```bash
bun run db:migrate
```

View database with Drizzle Studio:
```bash
bun run db:studio
```

Test database functionality:
```bash
bun run db:test
```

### Database Schema

The database stores information about:
- Users and their statistics
- Predictions and their options
- Bets placed on predictions

See [DATABASE.md](./DATABASE.md) for detailed schema information and usage examples.

## 📚 Documentation

- [Database Documentation](./DATABASE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
- [Test Summary](./TEST_SUMMARY.md)

## 🧩 Project Structure

```
core-dao-frontend/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app router pages
│   ├── db/              # Database schema and migrations
│   │   ├── migrations/  # Database migration files
│   │   └── schema/      # Database schema definitions
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   ├── scripts/         # Utility scripts
│   ├── services/        # API services
│   ├── styles/          # Global styles
│   └── utils/           # Utility functions
├── tests/               # Test files
├── .env.example         # Example environment variables
├── DATABASE.md          # Database documentation
├── DEPLOYMENT.md        # Deployment guide
├── next.config.js       # Next.js configuration
├── package.json         # Project dependencies
└── tsconfig.json        # TypeScript configuration
```

## 🔧 Environment Variables

See [.env.example](./.env.example) for all required environment variables.

## 🚢 Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🔒 Security

For security concerns, please email security@your-organization.com.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.