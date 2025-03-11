import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Setup environment variables
config({ path: '.env.local' });

// Get the directory paths (equivalent to __dirname in Node.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setting NODE_TLS_REJECT_UNAUTHORIZED programmatically
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function runMigrations() {
  console.log('Starting database migration...');
  
  // Create a connection using individual parameters instead of connection string
  // This is often more reliable for SSL connections with Supabase
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    port: 5432,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Connect to the database
    console.log('Connecting to database using direct parameters...');
    await client.connect();
    console.log('Connected successfully! 🎉');
    
    // Get all migration files and sort them
    const migrationsDir = join(__dirname, '../supabase/migrations');
    
    // Verify the migrations directory exists
    try {
      readdirSync(migrationsDir);
    } catch (error) {
      console.error(`❌ Migrations directory not found: ${migrationsDir}`);
      process.exit(1);
    }
    
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensures files are processed in correct order
    
    if (migrationFiles.length === 0) {
      console.warn('⚠️ No SQL migration files found in the directory');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Execute each migration file
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migrationPath = join(migrationsDir, file);
      
      try {
        const migration = readFileSync(migrationPath, 'utf8');
        
        // Begin transaction for each migration
        await client.query('BEGIN');
        try {
          await client.query(migration);
          await client.query('COMMIT');
          console.log(`✅ Migration ${file} completed successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Migration ${file} failed: ${error.message}`);
          throw error;
        }
      } catch (error) {
        console.error(`❌ Error processing migration file ${file}: ${error.message}`);
        throw error;
      }
    }
    
    console.log('All migrations completed successfully! 🎉');
  } catch (error) {
    console.error('Migration process failed:', error);
    
    // Display helpful error information
    if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      console.error('\n🔐 SSL Certificate Error still persists. Try running manually with:');
      console.error('NODE_TLS_REJECT_UNAUTHORIZED=0 bun run script/run-migrations.js');
      
      console.error('\nAlternatively, try updating .env.local with a non-SSL connection for local development.');
    }
    
    process.exit(1);
  } finally {
    // Close the client connection
    try {
      await client.end();
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

// Execute the function
runMigrations();