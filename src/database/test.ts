import { DatabaseInitializer } from './init.js';
import { db } from './connection.js';
import { logger } from '../utils/logger.js';

/**
 * Test script to verify database connection and basic operations
 */
async function testDatabaseConnection(): Promise<void> {
  try {
    console.log('🧪 Testing database connection...');

    // Test basic connection
    await db.connect();
    console.log('✅ Database connection established');

    // Test health check
    const isHealthy = await db.healthCheck();
    if (isHealthy) {
      console.log('✅ Database health check passed');
    } else {
      throw new Error('Database health check failed');
    }

    // Test basic query
    const result = await db.query('SELECT NOW() as current_time');
    console.log('✅ Basic query executed successfully');
    console.log('   Current database time:', result.rows[0].current_time);

    // Test connection pool stats
    const poolStats = db.getPoolStats();
    console.log('📊 Connection pool stats:');
    console.log('   Total connections:', poolStats.totalCount);
    console.log('   Idle connections:', poolStats.idleCount);
    console.log('   Waiting clients:', poolStats.waitingCount);
    console.log('   Is connected:', poolStats.isConnected);

    console.log('🎉 All database connection tests passed!');

  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    throw error;
  }
}

async function testDatabaseSchema(): Promise<void> {
  try {
    console.log('🧪 Testing database schema...');

    // Initialize schema
    await DatabaseInitializer.initialize();
    console.log('✅ Database schema initialized');

    // Get schema information
    const status = await DatabaseInitializer.getStatus();
    console.log('📋 Database schema status:');
    console.log('   Tables:', status.schema.tables.length);
    console.log('   Indexes:', status.schema.indexes.length);

    console.log('🎉 Database schema tests passed!');

  } catch (error) {
    console.error('❌ Database schema test failed:', error);
    throw error;
  }
}

async function runAllTests(): Promise<void> {
  try {
    console.log('🚀 Starting database tests...\n');

    await testDatabaseConnection();
    console.log('');
    await testDatabaseSchema();

    console.log('\n🎊 All database tests completed successfully!');

  } catch (error) {
    console.error('\n💥 Database tests failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    try {
      await DatabaseInitializer.close();
      console.log('🔌 Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export { testDatabaseConnection, testDatabaseSchema, runAllTests };
