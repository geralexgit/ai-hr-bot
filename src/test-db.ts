#!/usr/bin/env node

/**
 * Database Test Script
 * This script tests the database connection and basic operations
 * Run with: npm run build && node dist/test-db.js
 */

import { DatabaseInitializer } from './database/init.js';
import { db } from './database/connection.js';
import { logger } from './utils/logger.js';
import { CreateVacancyDto, CreateCandidateDto } from './types/models.js';
import { SchemaValidator } from './database/validation.js';

async function testDatabase() {
  try {
    console.log('🔧 Testing database connection and setup...\n');
    
    // Test 1: Initialize database
    console.log('1. Initializing database...');
    await DatabaseInitializer.initialize();
    console.log('✅ Database initialized successfully\n');
    
    // Test 2: Health check
    console.log('2. Performing health check...');
    const health = await DatabaseInitializer.healthCheck();
    console.log('✅ Health check results:', health);
    console.log('');
    
    // Test 3: Test basic queries
    console.log('3. Testing basic queries...');
    
    // Check vacancies
    const vacancies = await db.query('SELECT id, title, status FROM vacancies ORDER BY id');
    console.log(`✅ Found ${vacancies.length} vacancies:`);
    vacancies.forEach((v: any) => {
      console.log(`   - ${v.title} (${v.status})`);
    });
    console.log('');
    
    // Test 4: Test data insertion
    console.log('4. Testing data insertion...');
    
    // Insert a test candidate
    const testCandidate = await db.query(`
      INSERT INTO candidates (telegram_user_id, first_name, last_name, username)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (telegram_user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        username = EXCLUDED.username
      RETURNING *
    `, [123456789, 'Test', 'User', 'testuser']);
    
    console.log('✅ Test candidate created/updated:', {
      id: testCandidate[0].id,
      name: `${testCandidate[0].first_name} ${testCandidate[0].last_name}`,
      username: testCandidate[0].username
    });
    
    // Test 5: Test complex query with JSON
    console.log('\n5. Testing JSON queries...');
    const vacancyWithRequirements = await db.query(`
      SELECT 
        id, 
        title, 
        requirements->'technicalSkills' as technical_skills,
        evaluation_weights
      FROM vacancies 
      WHERE id = 1
    `);
    
    if (vacancyWithRequirements.length > 0) {
      console.log('✅ JSON query successful:', {
        title: vacancyWithRequirements[0].title,
        technicalSkillsCount: vacancyWithRequirements[0].technical_skills?.length || 0,
        weights: vacancyWithRequirements[0].evaluation_weights
      });
    }
    
    // Test 6: Test transaction
    console.log('\n6. Testing transaction...');
    await db.transaction(async (client) => {
      await client.query('SELECT COUNT(*) FROM candidates');
      await client.query('SELECT COUNT(*) FROM vacancies');
      console.log('✅ Transaction completed successfully');
    });
    
    // Test 7: Schema validation
    console.log('\n7. Validating database schema...');
    const schemaValidation = await SchemaValidator.validateSchema();
    if (schemaValidation.valid) {
      console.log('✅ Schema validation passed');
      console.log(`   Tables found: ${Object.keys(schemaValidation.tables).join(', ')}`);
    } else {
      console.log('⚠️  Schema validation issues:');
      schemaValidation.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    // Test 8: CRUD operations test
    console.log('\n8. Testing CRUD operations...');
    const crudTest = await SchemaValidator.testCrudOperations();
    if (crudTest.success) {
      console.log('✅ All CRUD operations successful');
    } else {
      console.log('⚠️  CRUD operation issues:');
      crudTest.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('\n🎉 All database tests completed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    await db.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testDatabase();