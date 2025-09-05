import { db } from '../connection.js';
import { logger } from '../../utils/logger.js';

export async function up(): Promise<void> {
  logger.info('Running migration: 001_enhance_requirements_validation');
  
  // Create validation function for technical skills
  await db.query(`
    CREATE OR REPLACE FUNCTION validate_technical_skills(skills JSONB) 
    RETURNS BOOLEAN 
    LANGUAGE plpgsql
    AS $validate_technical_skills$
    BEGIN
      -- If skills is null or empty array, it's valid
      IF skills IS NULL OR jsonb_array_length(skills) = 0 THEN
        RETURN TRUE;
      END IF;
      
      -- Check each skill has required fields
      FOR i IN 0..jsonb_array_length(skills) - 1 LOOP
        -- Check required fields exist
        IF NOT (skills -> i ? 'name' AND 
                skills -> i ? 'level' AND 
                skills -> i ? 'mandatory' AND 
                skills -> i ? 'weight') THEN
          RETURN FALSE;
        END IF;
        
        -- Check level is valid
        IF NOT (skills -> i ->> 'level' IN ('beginner', 'intermediate', 'advanced', 'expert')) THEN
          RETURN FALSE;
        END IF;
        
        -- Check weight is valid (1-10)
        IF NOT ((skills -> i ->> 'weight')::INTEGER BETWEEN 1 AND 10) THEN
          RETURN FALSE;
        END IF;
        
        -- Check mandatory is boolean
        IF NOT (skills -> i ->> 'mandatory' IN ('true', 'false')) THEN
          RETURN FALSE;
        END IF;
      END LOOP;
      
      RETURN TRUE;
    END;
    $validate_technical_skills$
  `);
  
  // Create validation function for experience requirements
  await db.query(`
    CREATE OR REPLACE FUNCTION validate_experience_requirements(experience JSONB) 
    RETURNS BOOLEAN 
    LANGUAGE plpgsql
    AS $validate_experience_requirements$
    BEGIN
      -- If experience is null or empty array, it's valid
      IF experience IS NULL OR jsonb_array_length(experience) = 0 THEN
        RETURN TRUE;
      END IF;
      
      -- Check each experience requirement has required fields
      FOR i IN 0..jsonb_array_length(experience) - 1 LOOP
        -- Check required fields exist
        IF NOT (experience -> i ? 'domain' AND 
                experience -> i ? 'minimumYears' AND 
                experience -> i ? 'preferred') THEN
          RETURN FALSE;
        END IF;
        
        -- Check minimumYears is valid (0-50)
        IF NOT ((experience -> i ->> 'minimumYears')::INTEGER BETWEEN 0 AND 50) THEN
          RETURN FALSE;
        END IF;
        
        -- Check preferred is boolean
        IF NOT (experience -> i ->> 'preferred' IN ('true', 'false')) THEN
          RETURN FALSE;
        END IF;
      END LOOP;
      
      RETURN TRUE;
    END;
    $validate_experience_requirements$
  `);
  
  // Create validation function for evaluation weights
  await db.query(`
    CREATE OR REPLACE FUNCTION validate_evaluation_weights(weights JSONB) 
    RETURNS BOOLEAN 
    LANGUAGE plpgsql
    AS $validate_evaluation_weights$
    BEGIN
      -- Check required fields exist
      IF NOT (weights ? 'technicalSkills' AND 
              weights ? 'communication' AND 
              weights ? 'problemSolving') THEN
        RETURN FALSE;
      END IF;
      
      -- Check all weights are valid percentages (0-100)
      IF NOT ((weights ->> 'technicalSkills')::INTEGER BETWEEN 0 AND 100 AND
              (weights ->> 'communication')::INTEGER BETWEEN 0 AND 100 AND
              (weights ->> 'problemSolving')::INTEGER BETWEEN 0 AND 100) THEN
        RETURN FALSE;
      END IF;
      
      -- Check weights sum to 100
      IF ((weights ->> 'technicalSkills')::INTEGER + 
          (weights ->> 'communication')::INTEGER + 
          (weights ->> 'problemSolving')::INTEGER) != 100 THEN
        RETURN FALSE;
      END IF;
      
      RETURN TRUE;
    END;
    $validate_evaluation_weights$
  `);
  
  // Add indexes for better performance on JSONB queries
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_vacancies_technical_skills 
    ON vacancies USING GIN ((requirements -> 'technicalSkills'))
  `);
  
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_vacancies_experience 
    ON vacancies USING GIN ((requirements -> 'experience'))
  `);
  
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_vacancies_soft_skills 
    ON vacancies USING GIN ((requirements -> 'softSkills'))
  `);
  
  // Add comments for documentation
  await db.query(`
    COMMENT ON FUNCTION validate_technical_skills(JSONB) IS 'Validates technical skills array structure in vacancy requirements'
  `);
  
  await db.query(`
    COMMENT ON FUNCTION validate_experience_requirements(JSONB) IS 'Validates experience requirements array structure in vacancy requirements'
  `);
  
  await db.query(`
    COMMENT ON FUNCTION validate_evaluation_weights(JSONB) IS 'Validates evaluation weights structure and ensures they sum to 100%'
  `);
  
  logger.info('Migration 001_enhance_requirements_validation completed successfully');
}

export async function down(): Promise<void> {
  logger.info('Rolling back migration: 001_enhance_requirements_validation');
  
  // Drop indexes
  await db.query('DROP INDEX IF EXISTS idx_vacancies_technical_skills');
  await db.query('DROP INDEX IF EXISTS idx_vacancies_experience');
  await db.query('DROP INDEX IF EXISTS idx_vacancies_soft_skills');
  
  // Drop functions
  await db.query('DROP FUNCTION IF EXISTS validate_technical_skills(JSONB)');
  await db.query('DROP FUNCTION IF EXISTS validate_experience_requirements(JSONB)');
  await db.query('DROP FUNCTION IF EXISTS validate_evaluation_weights(JSONB)');
  
  logger.info('Migration 001_enhance_requirements_validation rolled back successfully');
}
