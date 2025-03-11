import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/db/schema';

export const isUsingSupabaseAPI = () => {
  return process.env.USE_SUPABASE_API === 'true';
};

export const checkConnection = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }

    const client = postgres(process.env.DATABASE_URL, {
      max: 1,
      idle_timeout: 10,
      connect_timeout: 30,
      ssl: {
        rejectUnauthorized: false,
        mode: 'require'
      },
      prepare: false,
    });

    // Test the connection with a simple query
    await client`SELECT 1`;
    await client.end();
    
    return true;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

export const createDbClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const client = postgres(process.env.DATABASE_URL, {
    max: 1,
    idle_timeout: 10,
    connect_timeout: 30,
    ssl: {
      rejectUnauthorized: false,
      mode: 'require'
    },
    prepare: false,
  });

  return drizzle(client, { schema });
};