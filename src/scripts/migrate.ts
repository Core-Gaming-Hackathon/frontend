import { migrate } from 'drizzle-orm/postgres-js/migrator';
import dotenv from 'dotenv';
import path from 'path';
import { isUsingSupabaseAPI, checkConnection, createDbClient } from './client';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Get environment variables
const DATABASE_URL = process.env.DATABASE_URL;

// Ensure required variables are available
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not defined');
  process.exit(1);
}

// Run migrations
async function runMigrations() {
  try {
    console.log('Initializing database connection...');
    
    // First, check if we have a working connection
    const isConnected = await checkConnection();
    
    if (!isConnected) {
      throw new Error('Failed to establish database connection.');
    }
    
    console.log('Starting migration process...');
    
    // Check which mode we're using
    if (isUsingSupabaseAPI()) {
      console.log('Using Supabase API for database operations');
      
      // Read all migration files from the migrations folder
      const migrationsPath = path.resolve(process.cwd(), './src/db/migrations');
      const migrationFiles = fs.readdirSync(migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      if (migrationFiles.length === 0) {
        console.log('No migration files found. Skipping migrations.');
        process.exit(0);
      }
      
      console.log(`Found ${migrationFiles.length} migration file(s) to apply`);
      console.log('\n⚠️ IMPORTANT: Using Supabase API mode requires manual SQL execution');
      console.log('Please follow these steps to apply migrations:');
      console.log('1. Log in to your Supabase dashboard');
      console.log('2. Go to the SQL Editor');
      console.log('3. Copy and paste the SQL from each migration file:');
      
      // List all migration files for the user to manually apply
      for (const file of migrationFiles) {
        const filePath = path.join(migrationsPath, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        const fileSize = fs.statSync(filePath).size;
        
        console.log(`\n📄 ${file} (${(fileSize / 1024).toFixed(1)} KB):`);
        console.log('SQL statement length:', sql.length, 'characters');
        console.log('First 150 characters:', sql.substring(0, 150).replace(/\n/g, ' ') + '...');
      }
      
      console.log('\nFor security reasons, direct SQL execution via the API is restricted.');
      console.log('You can find the migration files in:', migrationsPath);
      
      console.log('\n✅ Migration preparation completed');
      console.log('Please apply migrations manually as described above.');
    } else {
      // Using direct database connection
      console.log('Using direct database connection for migrations');
      
      const db = createDbClient();
      
      console.log('Applying migrations...');
      
      // Run the migrations
      await migrate(db, { migrationsFolder: './src/db/migrations' });
      
      console.log('✅ Migrations completed successfully');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration script
runMigrations().catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});
