/**
 * AlgeriaTrade.dz - MASTER Company Seed Script
 * 
 * This script seeds the database with ALL researched Algerian companies
 * from Wilayas 01-50+ (1,484+ companies across 47 data files)
 * 
 * Features:
 * - Automatic deduplication by company slug
 * - Handles multiple data file formats
 * - Creates system tenant and admin user
 * - Comprehensive logging and statistics
 * - Error handling and recovery
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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

// Comprehensive wilaya mapping (code -> name)
const WILAYA_MAP: Record<string, string> = {
  '01': 'Adrar',
  '02': 'Chlef',
  '03': 'Laghouat',
  '04': "Oum El Bouaghi",
  '05': 'Batna',
  '06': 'Béjaïa',
  '07': 'Biskra',
  '08': 'Béchar',
  '09': 'Blida',
  '10': 'Bouira',
  '11': 'Tissemsilt',
  // Note: Tlemcen is actually 13, but some data may use different codes
  '13': 'Tlemcen', // Also used for Tiaret in some contexts
  '14': 'Tizi Ouzou',
  // Algiers is typically 16
  '16': 'Algiers',
  '17': 'Djelfa',
  '18': 'Jijel',
  '19': 'Sétif',
  '20': 'Saïda',
  '21': 'Skikda',
  '22': 'Sidi Bel Abbès',
  '23': 'Annaba',
  '24': 'Guelma',
  '25': 'Constantine',
  '26': 'Médéa',
  '27': 'Mostaganem',
  '28': "M'Sila",
  '29': 'Mascara',
  '30': 'Ouargla',
  '31': 'El Tarf',
  '32': 'Tindouf',
  '34': 'El Oued',
  '35': 'Khenchela',
  '36': 'Souk Ahras',
  '37': 'Tipaza',
  '38': 'Mila',
  '39': "Aïn Defla",
  '40': 'Naama',
  '41': 'Tébessa',
  '43': 'Bordj Bou Arréridj',
  '44': "El M'Ghair", // NEW 2019
  '45': "Aïn Témouchent",
  '47': 'Ghardaïa',
  '48': 'Relizane'
};

// Data directory
const DATA_DIR = '/home/z/my-project/data';

// Get all company JSON files
function getCompanyJsonFiles(): string[] {
  try {
    const files = fs.readdirSync(DATA_DIR);
    return files
      .filter(file => file.endsWith('_companies_b2b.json') || file.match(/wilaya_\d+_companies\.json/))
      .map(file => path.join(DATA_DIR, file))
      .filter(filePath => fs.existsSync(filePath));
  } catch (error) {
    console.error('Error reading data directory:', error);
    return [];
  }
}

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
    '2000+': 2500,
    '2500+': 2750,
    '3500+': 3750,
    '4000+': 4500,
    '5000+': 5500,
    '8000+': 8500,
    '12000+': 12500,
    '65000+': 65000,
    '100000+': 100000,
    '120000+': 120000
  };
  
  return countMap[countStr] || 25;
}

// Extract wilaya code from filename or RC number
function extractWilayaInfo(filePath: string, companyData: CompanyData): { code: string; name: string } {
  const fileName = path.basename(filePath);
  
  // Try to extract from filename first
  const wilayaCodeMatch = fileName.match(/wilaya_(\d+)/);
  if (wilayaCodeMatch) {
    const code = wilayaCodeMatch[1];
    const name = WILAYA_MAP[code] || `Wilaya ${code}`;
    return { code, name };
  }
  
  // Try to extract from RC number format
  const rcMatch = companyData.rc_number_format?.match(/^(\d+)/);
  if (rcMatch) {
    const code = rcMatch[1].padStart(2, '0');
    const name = WILAYA_MAP[code] || `Wilaya ${code}`;
    return { code, name };
  }
  
  // Default to unknown
  return { code: '00', name: 'Unknown' };
}

// Transform JSON company data to Prisma format
function transformCompany(
  data: CompanyData, 
  wilayaCode: string, 
  wilayaName: string,
  sourceFile: string
) {
  const slug = generateSlug(data.name);
  const employeeCount = parseEmployeeCount(data.employee_count);
  
  return {
    name: data.name,
    slug,
    legalForm: data.legal_form || 'SARL',
    rcNumber: data.rc_number_format || '',
    nif: '',
    nis: '',
    website: data.website || null,
    description: data.activity_description,
    yearEstablished: data.year_established || null,
    employeeCount,
    verificationStatus: 'PENDING' as const,
    verificationLevel: 'BASIC' as const,
    rating: 0,
    responseRate: 0,
    wilaya: wilayaCode, // Store wilaya code (name can be derived)
    commune: data.commune || wilayaName,
    address: `${data.commune || wilayaName}, ${wilayaName}, Algeria`,
    contactEmail: data.contact_email || null,
    contactPhone: data.contact_phone || null,
    isVerified: false,
    isActive: true,
    sourceFile, // Track where this data came from (not stored in DB)
    tenantId: '',
    userId: ''
  };
}

// Main seeding function
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 ALGERIATRADE.DZ - MASTER COMPANY SEED SCRIPT');
  console.log('📅 Execution Date:', new Date().toISOString());
  console.log('='.repeat(70) + '\n');
  
  const startTime = Date.now();
  let totalCompaniesProcessed = 0;
  let totalCompaniesCreated = 0;
  let totalCompaniesUpdated = 0;
  let totalErrors = 0;
  let totalFilesProcessed = 0;
  let skippedFiles = 0;
  
  // Statistics tracking
  const sectorStats: Record<string, number> = {};
  const wilayaStats: Record<string, number> = {};
  const errorLog: string[] = [];
  
  try {
    // Step 1: Create or get system tenant
    console.log('📋 Step 1: Setting up system tenant and user...');
    
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
      console.log(`   ✅ Created system tenant: ${tenant.id}`);
    } else {
      console.log(`   ✅ Found existing system tenant: ${tenant.id}`);
    }
    
    // Step 2: Create or get system user (use upsert to handle existing users)
    const userEmail = 'system@algeriatrade.dz';
    let user = await prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email: userEmail
      }
    });
    
    if (!user) {
      // Try to find user by email only (might exist from different tenant)
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      
      if (existingUserByEmail) {
        // User exists but with different tenant - update to current tenant
        user = await prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: {
            tenantId: tenant.id,
            firstName: 'System',
            lastName: 'Admin',
            role: 'ADMIN',
            password: 'system_hash_not_used'
          }
        });
        console.log(`   ✅ Updated existing system user to new tenant: ${user.id}`);
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: userEmail,
            firstName: 'System',
            lastName: 'Admin',
            role: 'ADMIN',
            tenantId: tenant.id,
            password: 'system_hash_not_used'
          }
        });
        console.log(`   ✅ Created system user: ${user.id}`);
      }
    } else {
      console.log(`   ✅ Found existing system user: ${user.id}`);
    }
    
    // Step 3: Get all company JSON files
    console.log('\n📁 Step 2: Scanning for company data files...');
    const jsonFiles = getCompanyJsonFiles();
    console.log(`   📊 Found ${jsonFiles.length} company data files`);
    
    // Step 4: Process each file
    console.log('\n🔄 Step 3: Processing company data files...\n');
    
    for (const filePath of jsonFiles) {
      const fileName = path.basename(filePath);
      totalFilesProcessed++;
      
      try {
        // Read and parse JSON
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const companiesData: CompanyData[] = JSON.parse(rawData);
        
        if (!Array.isArray(companiesData) || companiesData.length === 0) {
          console.log(`   ⚠️  ${fileName}: No valid data found - Skipping`);
          skippedFiles++;
          continue;
        }
        
        console.log(`   📂 Processing: ${fileName} (${companiesData.length} companies)`);
        
        let fileCreated = 0;
        let fileUpdated = 0;
        let fileErrors = 0;
        
        // Process each company in the file
        for (const companyData of companiesData) {
          try {
            // Extract wilaya information
            const { code: wilayaCode, name: wilayaName } = extractWilayaInfo(filePath, companyData);
            
            // Transform data
            const companyDataForDb = transformCompany(companyData, wilayaCode, wilayaName, fileName);
            
            // Upsert company (using slug as unique identifier per schema)
            const { sourceFile: _src, ...dbData } = companyDataForDb;
            
            const result = await prisma.company.upsert({
              where: {
                slug: dbData.slug
              },
              update: {
                ...dbData,
                tenantId: tenant.id,
                userId: user.id, // Use actual user ID (one-to-many relation allows this)
                updatedAt: new Date()
              },
              create: {
                ...dbData,
                tenantId: tenant.id,
                userId: user.id, // Use actual user ID
              }
            });
            
            // Track statistics
            if (result.createdAt.getTime() === result.updatedAt.getTime()) {
              fileCreated++;
              totalCompaniesCreated++;
            } else {
              fileUpdated++;
              totalCompaniesUpdated++;
            }
            
            totalCompaniesProcessed++;
            
            // Update sector stats
            const sector = companyData.sector || 'Unknown';
            sectorStats[sector] = (sectorStats[sector] || 0) + 1;
            
            // Update wilaya stats
            wilayaStats[wilayaName] = (wilayaStats[wilayaName] || 0) + 1;
            
          } catch (companyError) {
            fileErrors++;
            totalErrors++;
            errorLog.push(`${fileName} - "${companyData.name}": ${companyError.message}`);
          }
        }
        
        console.log(`      ✅ Created: ${fileCreated}, Updated: ${fileUpdated}, Errors: ${fileErrors}`);
        
      } catch (fileError) {
        console.error(`   ❌ Error processing ${fileName}:`, fileError.message);
        totalErrors++;
        errorLog.push(`${fileName}: ${fileError.message}`);
      }
    }
    
    // Step 5: Print comprehensive summary
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 SEEDING COMPLETE - COMPREHENSIVE SUMMARY');
    console.log('='.repeat(70));
    
    console.log('\n📈 OVERALL STATISTICS:');
    console.log(`   ⏱️  Total Duration: ${durationSeconds} seconds`);
    console.log(`   📁 Files Processed: ${totalFilesProcessed}`);
    console.log(`   ⚠️  Files Skipped: ${skippedFiles}`);
    console.log(`   🏢 Total Companies Processed: ${totalCompaniesProcessed}`);
    console.log(`   ✅ Companies Created: ${totalCompaniesCreated}`);
    console.log(`   🔄 Companies Updated: ${totalCompaniesUpdated}`);
    console.log(`   ❌ Errors Encountered: ${totalErrors}`);
    
    // Final database count
    const finalCount = await prisma.company.count({
      where: { tenantId: tenant.id }
    });
    console.log(`   🎉 TOTAL COMPANIES IN DATABASE: ${finalCount}`);
    
    // Top sectors
    console.log('\n🏭 TOP SECTORS BY COMPANY COUNT:');
    const sortedSectors = Object.entries(sectorStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15);
    
    for (const [sector, count] of sortedSectors) {
      console.log(`   ${sector.padEnd(25)} ${count.toString().padStart(5)} companies`);
    }
    
    // Top wilayas
    console.log('\n🗺️ TOP WILAYAS BY COMPANY COUNT:');
    const sortedWilayas = Object.entries(wilayaStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15);
    
    for (const [wilaya, count] of sortedWilayas) {
      console.log(`   ${wilaya.padEnd(25)} ${count.toString().padStart(5)} companies`);
    }
    
    // Error summary
    if (errorLog.length > 0) {
      console.log(`\n⚠️  ERROR SUMMARY (${errorLog.length} errors):`);
      const errorsToShow = errorLog.slice(0, 10); // Show first 10 errors
      for (const error of errorsToShow) {
        console.log(`   • ${error}`);
      }
      if (errorLog.length > 10) {
        console.log(`   ... and ${errorLog.length - 10} more errors`);
      }
    } else {
      console.log('\n✅ NO ERRORS ENCOUNTERED - Perfect execution!');
    }
    
    // Major companies highlight
    console.log('\n🌟 MAJOR COMPANIES SEEDED (by employee count):');
    const majorCompanies = await prisma.company.findMany({
      where: {
        tenantId: tenant.id,
        employeeCount: { gte: 500 }
      },
      orderBy: { employeeCount: 'desc' },
      take: 20,
      select: {
        name: true,
        employeeCount: true,
        wilaya: true,
        sector: true
      }
    });
    
    for (const company of majorCompanies) {
      console.log(`   ${company.name.padEnd(45)} ${company.employeeCount.toString().padStart(8)} emp. (${company.wilaya})`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✨ MASTER SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70) + '\n');
    
  } catch (fatalError) {
    console.error('\n💥 FATAL ERROR DURING SEEDING:', fatalError);
    process.exit(1);
    
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
