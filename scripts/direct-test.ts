/**
 * Direct SQLite inspection of Company table
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const dbPath = './db/custom.db';
  console.log('Database exists:', fs.existsSync(dbPath));
  
  // Try reading the schema.sql or using raw queries
  try {
    // Get all companies to see if table works at all
    const count = await prisma.company.count();
    console.log('Current company count:', count);
    
    // Try creating a test company with minimal fields
    const testSlug = 'test-direct-' + Date.now();
    const testData = {
      name: 'Direct Test',
      slug: testSlug,
      legalForm: 'SARL',
      rcNumber: '00/00-0000000DIR',
      nif: '',
      nis: '',
      website: null,
      description: 'Direct test',
      yearEstablished: 2020,
      employeeCount: 25,
      verificationStatus: 'PENDING',
      verificationLevel: 'BASIC',
      rating: 0,
      responseRate: 0,
      wilaya: '00',
      commune: 'Test',
      address: 'Test',
      contactEmail: 'test@test.dz',
      contactPhone: '+213 00 00 00 00',
      isVerified: false,
      isActive: true,
      tenantId: 'test-tenant',
      userId: 'test-user'
    };
    
    console.log('\\nAttempting direct create...');
    const result = await prisma.company.create({ data: testData });
    console.log('✅ SUCCESS! Created:', result.id, result.name);
    
  } catch (error: any) {
    console.error('\\n❌ Error details:');
    console.error('Full error:', error.message);
    
    // Log the stack trace
    if (error.stack) {
      console.error('\\nStack trace:', error.stack.split('\\n').slice(0, 10).join('\\n'));
    }
  }
  
  await prisma.$disconnect();
}

main().catch(console.error).finally(() => process.exit(0));
