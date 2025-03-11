import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Extract Database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Log that we're using the URL with pgBouncer mode
console.log('Using DATABASE_URL for drizzle-kit with pgBouncer mode');

export default defineConfig({
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  dialect: 'postgresql',  // Must be 'postgresql', not 'pg'
  dbCredentials: {
    url: databaseUrl,  // Use 'url' instead of 'connectionString'
    ssl: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
  },
  verbose: true,
  strict: true,
});
