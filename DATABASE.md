# Core DAO Frontend Database Documentation

This document provides comprehensive information about the database setup, schema, and functionality for the Core DAO Frontend application.

## Table of Contents

- [Overview](#overview)
- [Database Configuration](#database-configuration)
- [Schema](#schema)
- [Migrations](#migrations)
- [Usage](#usage)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

The Core DAO Frontend application uses PostgreSQL as its database and Drizzle ORM for database operations. The database stores information about users, predictions, prediction options, and bets.

### Technology Stack

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Migration Tool**: Drizzle Kit

## Database Configuration

### Environment Variables

The following environment variables are used for database configuration:

```env
# Main database URL (for Drizzle)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/core_dao

# Alternative configuration for direct Postgres connection
POSTGRES_URL=postgres://postgres:postgres@localhost:5432/core_dao
POSTGRES_HOST=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=core_dao

# Supabase Configuration (if using Supabase)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
USE_SUPABASE_API=false
```

### Connection Setup

The database connection is established using the `postgres` package and Drizzle ORM. The connection configuration is defined in `src/scripts/client.ts`:

```typescript
const client = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 10,
  connect_timeout: 30,
  ssl: sslConfig, // Configured based on whether it's a local or remote database
  prepare: false,
});

return drizzle(client, { schema });
```

## Schema

The database schema is defined in the `src/db/schema` directory and consists of the following tables:

### Users

```typescript
// src/db/schema/users.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: text('address').notNull().unique(), // ethereum address
  nonce: text('nonce').notNull(), // for wallet authentication
  username: text('username').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  isAdmin: boolean('is_admin').default(false),
});

export const userStats = pgTable('user_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  totalBets: integer('total_bets').default(0),
  totalWins: integer('total_wins').default(0),
  totalStaked: decimal('total_staked', { precision: 36, scale: 18 }).default('0'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Predictions

```typescript
// src/db/schema/predictions.ts
export const predictions = pgTable('predictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  predictionId: integer('prediction_id').notNull().unique(), // matches contract uint64
  creator: text('creator').notNull(), // ethereum address
  title: text('title').notNull(),
  description: text('description').notNull(),
  stake: decimal('stake', { precision: 36, scale: 18 }).notNull(), // for ETH amounts
  totalBets: decimal('total_bets', { precision: 36, scale: 18 }).notNull(),
  resolvedOption: integer('resolved_option').default(-1), // -1 means unresolved
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  chainId: integer('chain_id').notNull(),
  txHash: text('tx_hash').notNull(),
});

export const predictionOptions = pgTable('prediction_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  predictionId: uuid('prediction_id').references(() => predictions.id).notNull(),
  optionId: integer('option_id').notNull(),
  text: text('text').notNull(),
});

export const bets = pgTable('bets', {
  id: uuid('id').primaryKey().defaultRandom(),
  predictionId: uuid('prediction_id').references(() => predictions.id).notNull(),
  bettor: text('bettor').notNull(), // ethereum address
  optionId: integer('option_id').notNull(),
  amount: decimal('amount', { precision: 36, scale: 18 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  claimed: boolean('claimed').default(false),
  txHash: text('tx_hash').notNull(),
  sourceChain: text('source_chain'),
});
```

### Relations

The schema defines relations between tables using Drizzle's relations API:

```typescript
export const predictionsRelations = relations(predictions, ({ many }) => ({
  options: many(predictionOptions),
  bets: many(bets),
}));

export const predictionOptionsRelations = relations(predictionOptions, ({ one }) => ({
  prediction: one(predictions, {
    fields: [predictionOptions.predictionId],
    references: [predictions.id],
  }),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  prediction: one(predictions, {
    fields: [bets.predictionId],
    references: [predictions.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId],
  }),
  bets: many(bets),
}));
```

## Migrations

Database migrations are managed using Drizzle Kit. The migration files are stored in the `src/db/migrations` directory.

### Running Migrations

To run migrations, use the following command:

```bash
bun run db:migrate
```

This command executes the `src/scripts/migrate.ts` script, which applies all pending migrations to the database.

### Generating Migrations

To generate new migrations based on schema changes, use:

```bash
bun run db:generate
```

### Pushing Schema Changes

To push schema changes directly to the database without generating migration files:

```bash
bun run db:push
```

## Usage

### Basic Database Operations

Here are some examples of basic database operations using Drizzle ORM:

#### Querying Data

```typescript
// Select all users
const allUsers = await db.select().from(users);

// Select user by address
const user = await db.select().from(users).where(eq(users.address, address));

// Count predictions
const predictionCount = await db.select({ count: count(predictions.id) }).from(predictions);

// Join tables
const userWithBets = await db
  .select({
    user: users,
    bets: bets,
  })
  .from(users)
  .leftJoin(bets, eq(users.id, bets.bettor))
  .where(eq(users.address, address));
```

#### Inserting Data

```typescript
// Insert a new user
const newUser = await db.insert(users).values({
  address: walletAddress,
  nonce: generateNonce(),
  username: username,
}).returning();

// Insert a prediction with options
const prediction = await db.insert(predictions).values({
  predictionId: contractPredictionId,
  creator: creatorAddress,
  title: title,
  description: description,
  stake: stake,
  totalBets: '0',
  chainId: chainId,
  txHash: txHash,
}).returning();

// Insert prediction options
const options = await db.insert(predictionOptions).values(
  optionsArray.map((option, index) => ({
    predictionId: prediction[0].id,
    optionId: index,
    text: option,
  }))
).returning();
```

#### Updating Data

```typescript
// Update user information
await db.update(users)
  .set({ username: newUsername, updatedAt: new Date() })
  .where(eq(users.address, address));

// Resolve a prediction
await db.update(predictions)
  .set({ 
    resolvedOption: winningOptionId, 
    resolvedAt: new Date() 
  })
  .where(eq(predictions.predictionId, predictionId));
```

#### Deleting Data

```typescript
// Delete a user
await db.delete(users).where(eq(users.address, address));

// Delete a prediction and its related data
await db.delete(bets).where(eq(bets.predictionId, predictionId));
await db.delete(predictionOptions).where(eq(predictionOptions.predictionId, predictionId));
await db.delete(predictions).where(eq(predictions.id, predictionId));
```

## Testing

### Database Test Script

The application includes a database test script (`src/scripts/db-test.ts`) that verifies the database connection and performs basic CRUD operations. To run the test:

```bash
bun run db:test
```

The test script:
1. Verifies the database connection
2. Counts records in each table
3. Inserts a test user
4. Queries the inserted user
5. Deletes the test user

### Expected Output

```
Testing database connection...
✅ Database connection successful
Counting users...
✅ User count: 0
Counting predictions...
✅ Prediction count: 0
Counting prediction options...
✅ Prediction option count: 0
Counting bets...
✅ Bet count: 0
Inserting a test user...
✅ Inserted test user with ID: dd965073-c001-41e4-83fd-93d729313a72
Querying the inserted user...
✅ Retrieved user: test_user_1742089648790 with address 0x567bf56ae42918
Deleting the test user...
✅ Test user deleted

🎉 All database tests completed successfully!
```

## Troubleshooting

### Common Issues

#### Connection Errors

If you encounter connection errors, check:
- The database server is running
- The connection credentials are correct
- The database exists
- Firewall settings allow the connection
- SSL settings match the server configuration

#### SSL Configuration

The application automatically detects local database connections and disables SSL for them:

```typescript
// Check if we're using a local database
export const isLocalDatabase = () => {
  const dbUrl = process.env.DATABASE_URL || '';
  return dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
};

// Configure SSL based on whether we're connecting to a local database
const sslConfig = isLocalDatabase() 
  ? false 
  : {
      rejectUnauthorized: false,
      mode: 'require'
    };
```

#### Migration Failures

If migrations fail:
- Check the database connection
- Ensure the migrations directory exists
- Verify that the user has sufficient permissions
- Check for syntax errors in migration files

### Debugging

For debugging database issues:
1. Check the database logs
2. Enable verbose logging in the application
3. Use the database studio to inspect the database:
   ```bash
   bun run db:studio
   ```

## Conclusion

The Core DAO Frontend application uses a PostgreSQL database with Drizzle ORM to store and manage data related to users, predictions, and bets. The database schema is designed to support the application's features while maintaining data integrity through relations between tables.

For any questions or issues, please refer to the troubleshooting section or contact the development team. 