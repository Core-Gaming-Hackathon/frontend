import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not defined');
}

// Connection for general queries (with connection pooling)
const client = postgres(process.env.POSTGRES_URL, {
  ssl: {
    rejectUnauthorized: false
  },
});

export const db = drizzle(client, { schema });
