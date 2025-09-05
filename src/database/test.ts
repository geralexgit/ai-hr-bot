import { DatabaseInitializer } from './init.js';
import { db } from './connection.js';
import { logger } from '../utils/logger.js';
import {
  VacancyRepository,
  CandidateRepository,
  DialogueRepository,
  EvaluationRepository
} from '../repositories/index.js';
import {
  CreateVacancyDto,
  CreateCandidateDto,
  CreateDialogueDto,
  CreateEvaluationDto
} from '../types/index.js';

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

    // Reset database to ensure clean state
    await DatabaseInitializer.reset();
    console.log('✅ Database reset completed');

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

async function testRepositories(): Promise<void> {
  try {
    console.log('🧪 Testing repositories...');

    // Initialize repositories
    const vacancyRepo = new VacancyRepository();
    const candidateRepo = new CandidateRepository();
    const dialogueRepo = new DialogueRepository();
    const evaluationRepo = new EvaluationRepository();

    // Test data
    const testVacancy: CreateVacancyDto = {
      title: 'Test Software Engineer',
      description: 'Test vacancy for unit testing',
      requirements: {
        technicalSkills: [{
          name: 'JavaScript',
          level: 'intermediate',
          mandatory: true,
          weight: 8
        }],
        experience: [{
          domain: 'Web Development',
          minimumYears: 2,
          preferred: false
        }],
        softSkills: ['Communication', 'Teamwork']
      },
      evaluationWeights: {
        technicalSkills: 50,
        communication: 30,
        problemSolving: 20
      }
    };

    const testCandidate: CreateCandidateDto = {
      telegramUserId: Date.now(), // Use timestamp to ensure uniqueness
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe'
    };

    // Test VacancyRepository
    console.log('  Testing VacancyRepository...');
    const createdVacancy = await vacancyRepo.create(testVacancy);
    console.log('    ✅ Created vacancy:', createdVacancy.id);

    const foundVacancy = await vacancyRepo.findById(createdVacancy.id);
    if (!foundVacancy) throw new Error('Vacancy not found');
    console.log('    ✅ Found vacancy by ID');

    const activeVacancies = await vacancyRepo.findActive();
    console.log('    ✅ Found active vacancies:', activeVacancies.length);

    const searchedVacancies = await vacancyRepo.search('Software');
    console.log('    ✅ Searched vacancies:', searchedVacancies.length);

    // Test CandidateRepository
    console.log('  Testing CandidateRepository...');
    const createdCandidate = await candidateRepo.create(testCandidate);
    console.log('    ✅ Created candidate:', createdCandidate.id);

    const foundCandidate = await candidateRepo.findByTelegramUserId(testCandidate.telegramUserId);
    if (!foundCandidate) throw new Error('Candidate not found');
    console.log('    ✅ Found candidate by Telegram ID');

    const foundOrCreated = await candidateRepo.findOrCreateByTelegramUserId(testCandidate.telegramUserId);
    console.log('    ✅ Found or created candidate');

    // Test DialogueRepository
    console.log('  Testing DialogueRepository...');
    const testDialogue: CreateDialogueDto = {
      candidateId: createdCandidate.id,
      vacancyId: createdVacancy.id,
      messageType: 'text',
      content: 'Hello, I am interested in this position',
      sender: 'candidate'
    };

    const createdDialogue = await dialogueRepo.create(testDialogue);
    console.log('    ✅ Created dialogue:', createdDialogue.id);

    const candidateDialogues = await dialogueRepo.findByCandidateId(createdCandidate.id);
    console.log('    ✅ Found dialogues by candidate:', candidateDialogues.length);

    const vacancyDialogues = await dialogueRepo.findByVacancyId(createdVacancy.id);
    console.log('    ✅ Found dialogues by vacancy:', vacancyDialogues.length);

    const conversationHistory = await dialogueRepo.getConversationHistory(createdCandidate.id, createdVacancy.id);
    console.log('    ✅ Got conversation history:', conversationHistory.length);

    // Test EvaluationRepository
    console.log('  Testing EvaluationRepository...');
    const testEvaluation: CreateEvaluationDto = {
      candidateId: createdCandidate.id,
      vacancyId: createdVacancy.id,
      overallScore: 85,
      technicalScore: 80,
      communicationScore: 90,
      problemSolvingScore: 85,
      strengths: ['Good communication', 'Technical skills'],
      gaps: ['Experience with certain frameworks'],
      contradictions: [],
      recommendation: 'proceed',
      feedback: 'Strong candidate with good potential',
      analysisData: {
        extractedSkills: [{
          name: 'JavaScript',
          confidence: 0.9,
          evidence: ['Mentioned in conversation'],
          level: 'intermediate'
        }],
        experienceAnalysis: {
          totalYears: 3,
          relevantYears: 2,
          domains: ['Web Development'],
          gaps: []
        },
        communicationMetrics: {
          clarity: 8,
          completeness: 9,
          relevance: 8,
          professionalTone: 9
        },
        redFlags: [],
        matchingResults: [{
          skill: 'JavaScript',
          match: true,
          candidateLevel: 'intermediate',
          requiredLevel: 'intermediate'
        }]
      }
    };

    const createdEvaluation = await evaluationRepo.create(testEvaluation);
    console.log('    ✅ Created evaluation:', createdEvaluation.id);

    const foundEvaluation = await evaluationRepo.findByCandidateAndVacancy(createdCandidate.id, createdVacancy.id);
    if (!foundEvaluation) throw new Error('Evaluation not found');
    console.log('    ✅ Found evaluation by candidate and vacancy');

    const candidateEvaluations = await evaluationRepo.findByCandidateId(createdCandidate.id);
    console.log('    ✅ Found evaluations by candidate:', candidateEvaluations.length);

    const vacancyEvaluations = await evaluationRepo.findByVacancyId(createdVacancy.id);
    console.log('    ✅ Found evaluations by vacancy:', vacancyEvaluations.length);

    const proceedEvaluations = await evaluationRepo.findByRecommendation('proceed');
    console.log('    ✅ Found evaluations by recommendation:', proceedEvaluations.length);

    const highScoreEvaluations = await evaluationRepo.findByMinScore(80);
    console.log('    ✅ Found evaluations by minimum score:', highScoreEvaluations.length);

    const averageScores = await evaluationRepo.getAverageScoresByVacancy(createdVacancy.id);
    if (averageScores) {
      console.log('    ✅ Got average scores for vacancy');
    }

    const statistics = await evaluationRepo.getStatistics();
    console.log('    ✅ Got evaluation statistics');

    // Test upsert
    const upsertedEvaluation = await evaluationRepo.upsert(createdCandidate.id, createdVacancy.id, {
      ...testEvaluation,
      overallScore: 90
    });
    console.log('    ✅ Upserted evaluation:', upsertedEvaluation.overallScore);

    // Clean up test data
    console.log('  Cleaning up test data...');
    await evaluationRepo.delete(createdEvaluation.id);
    await dialogueRepo.delete(createdDialogue.id);
    await candidateRepo.delete(createdCandidate.id);
    await vacancyRepo.delete(createdVacancy.id);
    console.log('    ✅ Test data cleaned up');

    console.log('🎉 All repository tests passed!');

  } catch (error) {
    console.error('❌ Repository tests failed:', error);
    throw error;
  }
}

async function runAllTests(): Promise<void> {
  try {
    console.log('🚀 Starting database tests...\n');

    await testDatabaseConnection();
    console.log('');
    await testDatabaseSchema();
    console.log('');
    await testRepositories();

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
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { testDatabaseConnection, testDatabaseSchema, testRepositories, runAllTests };
