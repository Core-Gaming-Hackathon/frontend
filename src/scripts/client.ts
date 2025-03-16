import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/db/schema';

export const isUsingSupabaseAPI = () => {
  return process.env.USE_SUPABASE_API === 'true';
};

// Check if we're using a local database
export const isLocalDatabase = () => {
  const dbUrl = process.env.DATABASE_URL || '';
  return dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
};

export const checkConnection = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }

    // Configure SSL based on whether we're connecting to a local database
    const sslConfig = isLocalDatabase() 
      ? false 
      : {
          rejectUnauthorized: false,
          mode: 'require'
        };

    const client = postgres(process.env.DATABASE_URL, {
      max: 1,
      idle_timeout: 10,
      connect_timeout: 30,
      ssl: sslConfig,
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

  // Configure SSL based on whether we're connecting to a local database
  const sslConfig = isLocalDatabase() 
    ? false 
    : {
        rejectUnauthorized: false,
        mode: 'require'
      };

  const client = postgres(process.env.DATABASE_URL, {
    max: 1,
    idle_timeout: 10,
    connect_timeout: 30,
    ssl: sslConfig,
    prepare: false,
  });

  return drizzle(client, { schema });
};