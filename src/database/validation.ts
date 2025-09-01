/**
 * Database Schema Validation
 * This module provides utilities to validate that our TypeScript models
 * align with the actual database schema
 */

import { db } from './connection.js';
import { logger } from '../utils/logger.js';

export interface TableInfo {
  tableName: string;
  columnName: string;
  dataType: string;
  isNullable: string;
  columnDefault: string | null;
}

export class SchemaValidator {
  
  /**
   * Get detailed information about all tables in the database
   */
  public static async getTableInfo(): Promise<TableInfo[]> {
    const query = `
      SELECT 
        table_name as "tableName",
        column_name as "columnName", 
        data_type as "dataType",
        is_nullable as "isNullable",
        column_default as "columnDefault"
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('vacancies', 'candidates', 'dialogues', 'evaluations')
      ORDER BY table_name, ordinal_position
    `;
    
    return await db.query<TableInfo>(query);
  }
  
  /**
   * Validate that all expected tables exist with correct structure
   */
  public static async validateSchema(): Promise<{
    valid: boolean;
    issues: string[];
    tables: Record<string, TableInfo[]>;
  }> {
    const issues: string[] = [];
    const tables: Record<string, TableInfo[]> = {};
    
    try {
      const tableInfo = await this.getTableInfo();
      
      // Group by table name
      for (const info of tableInfo) {
        if (!tables[info.tableName]) {
          tables[info.tableName] = [];
        }
        tables[info.tableName]!.push(info);
      }
      
      // Expected tables and their critical columns
      const expectedTables = {
        vacancies: ['id', 'title', 'description', 'requirements', 'evaluation_weights', 'status'],
        candidates: ['id', 'telegram_user_id', 'first_name', 'last_name', 'username'],
        dialogues: ['id', 'candidate_id', 'vacancy_id', 'message_type', 'content', 'sender'],
        evaluations: ['id', 'candidate_id', 'vacancy_id', 'overall_score', 'recommendation']
      };
      
      // Check each expected table
      for (const [tableName, expectedColumns] of Object.entries(expectedTables)) {
        if (!tables[tableName]) {
          issues.push(`Missing table: ${tableName}`);
          continue;
        }
        
        const actualColumns = tables[tableName].map(col => col.columnName);
        
        for (const expectedColumn of expectedColumns) {
          if (!actualColumns.includes(expectedColumn)) {
            issues.push(`Missing column: ${tableName}.${expectedColumn}`);
          }
        }
      }
      
      // Check for JSONB columns (requirements, evaluation_weights, analysis_data)
      const jsonbColumns = [
        { table: 'vacancies', column: 'requirements' },
        { table: 'vacancies', column: 'evaluation_weights' },
        { table: 'evaluations', column: 'analysis_data' }
      ];
      
      for (const { table, column } of jsonbColumns) {
        const columnInfo = tables[table]?.find(col => col.columnName === column);
        if (columnInfo && columnInfo.dataType !== 'jsonb') {
          issues.push(`Column ${table}.${column} should be JSONB but is ${columnInfo.dataType}`);
        }
      }
      
      return {
        valid: issues.length === 0,
        issues,
        tables
      };
      
    } catch (error) {
      issues.push(`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        valid: false,
        issues,
        tables
      };
    }
  }
  
  /**
   * Test that we can perform basic CRUD operations on each table
   */
  public static async testCrudOperations(): Promise<{
    success: boolean;
    results: Record<string, boolean>;
    errors: string[];
  }> {
    const results: Record<string, boolean> = {};
    const errors: string[] = [];
    
    try {
      // Test vacancies table
      try {
        await db.query('SELECT COUNT(*) FROM vacancies');
        results.vacancies = true;
      } catch (error) {
        results.vacancies = false;
        errors.push(`Vacancies query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test candidates table
      try {
        await db.query('SELECT COUNT(*) FROM candidates');
        results.candidates = true;
      } catch (error) {
        results.candidates = false;
        errors.push(`Candidates query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test dialogues table
      try {
        await db.query('SELECT COUNT(*) FROM dialogues');
        results.dialogues = true;
      } catch (error) {
        results.dialogues = false;
        errors.push(`Dialogues query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test evaluations table
      try {
        await db.query('SELECT COUNT(*) FROM evaluations');
        results.evaluations = true;
      } catch (error) {
        results.evaluations = false;
        errors.push(`Evaluations query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      return {
        success: Object.values(results).every(Boolean),
        results,
        errors
      };
      
    } catch (error) {
      errors.push(`CRUD test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        results,
        errors
      };
    }
  }
}