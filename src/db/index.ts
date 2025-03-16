import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Check if we're using a local database
const isLocalDatabase = () => {
  const dbUrl = process.env.POSTGRES_URL || '';
  return dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
};

// Use POSTGRES_URL or DATABASE_URL as fallback
const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('Database URL is not defined (POSTGRES_URL or DATABASE_URL)');
}

// Configure SSL based on whether we're connecting to a local database
const sslConfig = isLocalDatabase() 
  ? false 
  : {
      rejectUnauthorized: false,
      mode: 'require'
    };

// Connection for general queries (with connection pooling)
const client = postgres(dbUrl, {
  ssl: sslConfig,
});

export const db = drizzle(client, { schema });
