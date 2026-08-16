/**
 * Quick test script - Seed just first 5 wilayas to verify the process works
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function main() {
  console.log('🚀 Quick test - seeding sample companies...\n');
  
  // Check current database state
  const companyCount = await prisma.company.count();
  console.log(`📊 Current company count in DB: ${companyCount}\n`);
  
  // Get or create tenant
  let tenant = await prisma.tenant.findFirst({ where: { slug: 'algeriatrade' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { slug: 'algeriatrade', name: 'AlgeriaTrade', primaryColor: '#006233' }
    });
    console.log(`✅ Created tenant: ${tenant.id}`);
  } else {
    console.log(`✅ Found tenant: ${tenant.id}`);
  }
  
  // Get or create user
  let user = await prisma.user.findFirst({ where: { email: 'system@algeriatrade.dz' } });
  if (!user) {
    user = await prisma.user.create({
      data: { 
        email: 'system@algeriatrade.dz', 
        firstName: 'System', 
        lastName: 'Account',
        role: 'ADMIN',
        tenantId: tenant.id,
        password: 'system_hash_not_used'
      }
    });
    console.log(`✅ Created user: ${user.id}`);
  } else {
    console.log(`✅ Found user: ${user.id}`);
  }
  
  // Test with just Adrar (01) wilaya
  const testFile = '/home/z/my-project/data/adrar_companies_b2b.json';
  console.log(`\n📁 Testing with: ${testFile}`);
  
  if (fs.existsSync(testFile)) {
    const rawData = fs.readFileSync(testFile, 'utf-8');
    const json = JSON.parse(rawData);
    const companies = json.companies || [];
    
    console.log(`📦 Found ${companies.length} companies in file\n`);
    
    let seeded = 0;
    for (const c of companies.slice(0, 5)) { // Just first 5 for testing
      const name = typeof c.company_name === 'string' ? c.company_name : c.company_name?.fr || 'Unknown';
      try {
        await prisma.company.upsert({
          where: { slug_tenantId: { slug: generateSlug(name), tenantId: tenant.id } },
          create: {
            name,
            slug: generateSlug(name),
            legalForm: c.legal_form || 'SARL',
            verificationStatus: 'VERIFIED',
            verificationLevel: 'VERIFIED',
            rating: 4.0,
            responseRate: 85,
            wilaya: '01',
            wilayaName: 'Adrar',
            address: `${c.address || 'Adrar'}, Algérie`,
            contactEmail: c.contact_email || `contact@test.dz`,
            contactPhone: c.phone || '+213 XX XX XX XX',
            isVerified: true,
            isActive: true,
            tenantId: tenant.id,
            userId: user.id,
          },
          update: { updatedAt: new Date() }
        });
        seeded++;
        console.log(`   ✅ Seeded: ${name.substring(0, 50)}`);
      } catch (e: any) {
        console.log(`   ❌ Error: ${e.message?.substring(0, 60)}`);
      }
    }
    
    console.log(`\n🎉 Test complete! Seeded ${seeded} companies`);
  } else {
    console.log('❌ File not found');
  }
  
  // Final count
  const finalCount = await prisma.company.count();
  console.log(`\n📊 Final company count: ${finalCount}`);
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
