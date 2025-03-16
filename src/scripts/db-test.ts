import { createDbClient, checkConnection } from './client';
import { users } from '@/db/schema/users';
import { predictions, predictionOptions, bets } from '@/db/schema/predictions';
import { count, eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Check connection
    const isConnected = await checkConnection();
    if (!isConnected) {
      throw new Error('Failed to establish database connection');
    }
    console.log('✅ Database connection successful');
    
    // Create DB client
    const db = createDbClient();
    
    // Test query - count users
    console.log('Counting users...');
    const userCount = await db.select({ count: count(users.id) }).from(users);
    console.log(`✅ User count: ${userCount[0].count}`);
    
    // Test query - count predictions
    console.log('Counting predictions...');
    const predictionCount = await db.select({ count: count(predictions.id) }).from(predictions);
    console.log(`✅ Prediction count: ${predictionCount[0].count}`);
    
    // Test query - count prediction options
    console.log('Counting prediction options...');
    const optionCount = await db.select({ count: count(predictionOptions.id) }).from(predictionOptions);
    console.log(`✅ Prediction option count: ${optionCount[0].count}`);
    
    // Test query - count bets
    console.log('Counting bets...');
    const betCount = await db.select({ count: count(bets.id) }).from(bets);
    console.log(`✅ Bet count: ${betCount[0].count}`);
    
    // Test inserting a user
    console.log('Inserting a test user...');
    const testAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
    const testNonce = Math.random().toString(36).substring(2, 15);
    
    const insertResult = await db.insert(users).values({
      address: testAddress,
      nonce: testNonce,
      username: `test_user_${Date.now()}`,
    }).returning();
    
    console.log(`✅ Inserted test user with ID: ${insertResult[0].id}`);
    
    // Test querying the inserted user
    console.log('Querying the inserted user...');
    const insertedUser = await db.select().from(users).where(eq(users.address, testAddress));
    console.log(`✅ Retrieved user: ${insertedUser[0].username} with address ${insertedUser[0].address}`);
    
    // Test deleting the test user
    console.log('Deleting the test user...');
    await db.delete(users).where(eq(users.address, testAddress));
    console.log('✅ Test user deleted');
    
    console.log('\n🎉 All database tests completed successfully!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDatabase().catch(error => {
  console.error('Unhandled error in database test:', error);
  process.exit(1);
}); 