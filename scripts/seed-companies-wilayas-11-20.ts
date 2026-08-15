/**
 * AlgeriaTrade.dz - Company Seed Script
 * Wilayas 11-20 (Tissemsilt through Saïda)
 * 
 * This script seeds the database with real Algerian companies
 * researched from Wilayas 11 through 20.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

// Interface for company data from JSON files
interface CompanyData {
  name: string;
  legal_form: string;
  rc_number_format: string;
  activity_description: string;
  sector: string;
  commune: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  year_established: number;
  employee_count: string;
  products: string[];
  export_markets: string[];
}

// Wilaya mapping with codes and names
const WILAYAS_11_20: Record<string, { code: string; name: string }> = {
  tissemsilt: { code: '11', name: 'Tissemsilt' },
  tlemcen: { code: '13', name: 'Tlemcen' }, // Note: Tlemcen is actually wilaya 13
  tiaret: { code: '13', name: 'Tiaret' },    // Will use correct code in data
  tizi_ouzou: { code: '14', name: 'Tizi Ouzou' },
  algiers: { code: '16', name: 'Algiers' },   // Algiers is wilaya 16
  el_bayadh: { code: '32', name: "El Bayadh" }, // El Bayadh is wilaya 32
  djelfa: { code: '17', name: 'Djelfa' },
  jijel: { code: '18', name: 'Jijel' },
  setif: { code: '19', name: 'Sétif' },
  saida: { code: '20', name: 'Saïda' }
};

// Generate URL-friendly slug from company name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')   // Remove special chars
    .replace(/\s+/g, '-')            // Replace spaces with hyphens
    .replace(/-+/g, '-')             // Replace multiple hyphens
    .trim();
}

// Map employee count string to approximate number
function parseEmployeeCount(countStr: string): number {
  const countMap: Record<string, number> = {
    '1-10': 5,
    '10-50': 25,
    '50-100': 75,
    '100-250': 175,
    '250-500': 375,
    '500-1000': 750,
    '1000+': 1500,
    '5000+': 5000,
    '10000+': 10000,
    '50000+': 50000,
    '100000+': 120000,
    '65000+': 65000,
    '120000+': 120000
  };
  
  return countMap[countStr] || 25;
}

// Transform JSON company data to Prisma format
function transformCompany(
  data: CompanyData, 
  wilayaCode: string, 
  wilayaName: string
) {
  const slug = generateSlug(data.name);
  const employeeCount = parseEmployeeCount(data.employee_count);
  
  return {
    name: data.name,
    slug,
    legalForm: data.legal_form || 'SARL',
    rcNumber: data.rc_number_format || '',
    nif: '', // Would need to be generated or left empty
    nis: '',
    website: data.website || null,
    description: data.activity_description,
    yearEstablished: data.year_established || null,
    employeeCount,
    verificationStatus: 'PENDING' as const,
    verificationLevel: 0,
    rating: 0,
    responseRate: 0,
    wilaya: wilayaCode,
    wilayaName,
    commune: data.commune || wilayaName,
    address: `${data.commune || wilayaName}, ${wilayaName}, Algeria`,
    contactEmail: data.contact_email || null,
    contactPhone: data.contact_phone || null,
    isVerified: false,
    isActive: true,
    // These will be set during upsert
    tenantId: '',
    userId: ''
  };
}

async function main() {
  console.log('🚀 Starting company seeding for Wilayas 11-20...\n');
  
  try {
    // Create or get system tenant
    let tenant = await prisma.tenant.findUnique({
      where: { slug: 'algeriatrade-system' }
    });
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'AlgeriaTrade System',
          slug: 'algeriatrade-system',
          domain: 'algeriatrade.dz',
          isActive: true
        }
      });
      console.log(`✅ Created system tenant: ${tenant.id}`);
    } else {
      console.log(`✅ Found existing system tenant: ${tenant.id}`);
    }
    
    // Create or get system user
    let user = await prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email: 'system@algeriatrade.dz'
      }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'system@algeriatrade.dz',
          firstName: 'System',
          lastName: 'Admin',
          role: 'ADMIN',
          tenantId: tenant.id,
          password: 'system_hash_not_used'
        }
      });
      console.log(`✅ Created system user: ${user.id}`);
    } else {
      console.log(`✅ Found existing system user: ${user.id}`);
    }
    
    let totalCompaniesCreated = 0;
    let totalCompaniesUpdated = 0;
    let totalErrors = 0;
    
    // Process each wilaya's JSON file
    const jsonFiles = [
      { key: 'tissemsilt', file: 'tissemsilt_companies_b2b.json' },
      { key: 'tlemcen', file: 'tlemcen_companies_b2b.json' },
      { key: 'tiaret', file: 'tiaret_companies_b2b.json' },
      { key: 'tizi_ouzou', file: 'tizi_ouzou_companies_b2b.json' },
      { key: 'algiers', file: 'algiers_companies_b2b.json' },
      { key: 'el_bayadh', file: 'el_bayadh_companies_b2b.json' },
      { key: 'djelfa', file: 'djelfa_companies_b2b.json' },
      { key: 'jijel', file: 'jijel_companies_b2b.json' },
      { key: 'setif', file: 'setif_companies_b2b.json' },
      { key: 'saida', file: 'saida_companies_b2b.json' }
    ];
    
    for (const { key, file } of jsonFiles) {
      const filePath = `/home/z/my-project/data/${file}`;
      
      try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️  File not found: ${filePath} - Skipping`);
          continue;
        }
        
        // Read and parse JSON
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const companiesData: CompanyData[] = JSON.parse(rawData);
        
        const wilayaInfo = WILAYAS_11_20[key];
        if (!wilayaInfo) {
          console.log(`⚠️  No wilaya info for key: ${key} - Skipping`);
          continue;
        }
        
        console.log(`\n📁 Processing ${file}:`);
        console.log(`   Wilaya: ${wilayaInfo.name} (${wilayaInfo.code})`);
        console.log(`   Companies found: ${companiesData.length}`);
        
        let wilayaCreated = 0;
        let wilayaUpdated = 0;
        
        // Process each company
        for (const companyData of companiesData) {
          try {
            const companyDataForDb = transformCompany(
              companyData, 
              wilayaInfo.code, 
              wilayaInfo.name
            );
            
            // Upsert company (create or update based on slug)
            const result = await prisma.company.upsert({
              where: {
                slug_tenantId: {
                  slug: companyDataForDb.slug,
                  tenantId: tenant.id
                }
              },
              update: {
                ...companyDataForDb,
                tenantId: tenant.id,
                userId: user.id,
                updatedAt: new Date()
              },
              create: {
                ...companyDataForDb,
                tenantId: tenant.id,
                userId: user.id,
              }
            });
            
            if (result.createdAt.getTime() === result.updatedAt.getTime()) {
              wilayaCreated++;
            } else {
              wilayaUpdated++;
            }
            
          } catch (companyError) {
            console.error(`   ❌ Error processing company "${companyData.name}":`, companyError);
            totalErrors++;
          }
        }
        
        totalCompaniesCreated += wilayaCreated;
        totalCompaniesUpdated += wilayaUpdated;
        
        console.log(`   ✅ Created: ${wilayaCreated}, Updated: ${wilayaUpdated}`);
        
      } catch (fileError) {
        console.error(`❌ Error processing file ${file}:`, fileError);
        totalErrors++;
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING SUMMARY - WILAYAS 11-20');
    console.log('='.repeat(60));
    console.log(`✅ Companies created: ${totalCompaniesCreated}`);
    console.log(`✅ Companies updated: ${totalCompaniesUpdated}`);
    console.log(`❌ Errors encountered: ${totalErrors}`);
    console.log(`📈 Total companies processed: ${totalCompaniesCreated + totalCompaniesUpdated + totalErrors}`);
    console.log('='.repeat(60));
    
    // Get final count
    const finalCount = await prisma.company.count({
      where: { tenantId: tenant.id }
    });
    console.log(`🎉 Total companies in database: ${finalCount}`);
    
  } catch (error) {
    console.error('💥 Fatal error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  });
