import { Pool } from 'pg';

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'hr_bot',
  user: process.env.DB_USER || 'hr_user',
  password: process.env.DB_PASSWORD || 'hr_password',
});

async function testVacancies() {
  try {
    console.log('🔍 Checking for active vacancies...');
    
    // Test database connection
    const client = await pool.connect();
    console.log('✅ Database connected');
    
    // Check if vacancies table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'vacancies'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Vacancies table does not exist');
      client.release();
      return;
    }
    
    console.log('✅ Vacancies table exists');
    
    // Check for active vacancies
    const vacancies = await client.query("SELECT * FROM vacancies WHERE status = 'active'");
    console.log(`📊 Found ${vacancies.rows.length} active vacancies`);
    
    if (vacancies.rows.length === 0) {
      console.log('⚠️  No active vacancies found!');
      console.log('Creating a test vacancy...');
      
      // Create a test vacancy
      const insertResult = await client.query(`
        INSERT INTO vacancies (title, description, requirements, evaluation_weights, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'Test Software Engineer',
        'A test vacancy for debugging the Telegram bot',
        JSON.stringify({
          technicalSkills: [
            { name: 'JavaScript', level: 'intermediate', mandatory: true, weight: 8 }
          ],
          experience: [
            { domain: 'Web Development', minimumYears: 2, preferred: false }
          ],
          softSkills: ['Communication', 'Teamwork']
        }),
        JSON.stringify({
          technicalSkills: 50,
          communication: 30,
          problemSolving: 20
        }),
        'active'
      ]);
      
      console.log('✅ Test vacancy created:', insertResult.rows[0]);
    } else {
      console.log('📝 Active vacancies:');
      vacancies.rows.forEach((vacancy, index) => {
        console.log(`  ${index + 1}. ${vacancy.title} (ID: ${vacancy.id})`);
      });
    }
    
    client.release();
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error testing vacancies:', error.message);
  } finally {
    await pool.end();
  }
}

testVacancies();
