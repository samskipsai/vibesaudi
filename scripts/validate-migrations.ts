#!/usr/bin/env tsx
/**
 * Migration Validation Script
 * 
 * This script validates that:
 * 1. All migrations are properly formatted
 * 2. Schema changes are reflected in migrations
 * 3. No pending migrations exist before deployment
 * 
 * Usage: npm run db:validate
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');
const SCHEMA_FILE = join(process.cwd(), 'worker/database/schema.ts');

function validateMigrations() {
  console.log('🔍 Validating migrations...\n');

  // Check if schema file exists
  if (!existsSync(SCHEMA_FILE)) {
    console.error('❌ Schema file not found:', SCHEMA_FILE);
    process.exit(1);
  }

  // Check if migrations directory exists
  if (!existsSync(MIGRATIONS_DIR)) {
    console.error('❌ Migrations directory not found:', MIGRATIONS_DIR);
    process.exit(1);
  }

  try {
    // Check for pending migrations using drizzle-kit
    console.log('📋 Checking for pending migrations...');
    execSync('npm run db:check', { stdio: 'inherit' });
    
    console.log('\n✅ Migration validation passed!');
    console.log('💡 Run "npm run db:generate" to create new migrations if needed.');
  } catch (error) {
    console.error('\n❌ Migration validation failed!');
    console.error('💡 Fix the issues above before deploying.');
    process.exit(1);
  }
}

validateMigrations();

