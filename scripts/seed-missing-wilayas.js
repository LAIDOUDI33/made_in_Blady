/**
 * AlgeriaTrade - Seed Missing Wilayas (01, 03, 08, 12, 15, 20, 22, 28, 29, 42, 44, 45, 49)
 * 
 * This script imports companies from the newly researched wilayas that were missing from the database.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Mapping of JSON files to their wilaya codes
const WILAYA_FILES = [
  { file: 'adrar_companies_b2b.json', code: '01' },
  { file: 'laghouat_companies_b2b.json', code: '03' },
  { file: 'bechar_companies_b2b.json', code: '08' },
  { file: 'tebessa_companies_b2b.json', code: '12' },
  { file: 'tizi_ouzou_companies_b2b.json', code: '15' },
  { file: 'setif_companies_b2b.json', code: '20' },
  { file: 'skikda_companies_b2b.json', code: '22' },
  { file: 'mostaganem_companies_b2b.json', code: '28' },
  { file: 'msila_companies_b2b.json', code: '29' },
  { file: 'naama_companies_b2b.json', code: '42' },
  { file: 'ghardaia_companies_b2b.json', code: '44' },
  { file: 'relizane_companies_b2b.json', code: '45' },
  { file: 'bordj_badji_mokhtar_companies_b2b.json', code: '49' }
];

async function main() {
  console.log('🌍 AlgeriaTrade - Seeding Missing Wilayas');
  console.log('='.repeat(55));
  console.log('');
  
  try {
    // Get or create default tenant
    let tenant = await prisma.tenant.findFirst({
      where: { slug: 'algeriatrade' }
    });
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          slug: 'algeriatrade',
          name: 'AlgeriaTrade',
          primaryColor: '#006233',
          secondaryColor: '#D52B1E',
          countryName: 'Algérie',
          countryCode: 'DZ',
          phonePrefix: '+213',
          currency: 'DZD',
          currencySymbol: 'د.ج'
        }
      });
    }
    
    console.log(`📦 Tenant: ${tenant.name} (${tenant.id})`);
    console.log('');
    
    // Get or create default user
    let user = await prisma.user.findFirst();
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@algeriatrade.dz',
          name: 'Admin User',
          passwordHash: '$2b$10$hashedpassword',
          role: 'ADMIN',
          tenantId: tenant.id,
          isEmailVerified: true,
          isActive: true
        }
      });
    }
    
    console.log(`👤 User: ${user.email} (${user.id})`);
    console.log('');
    
    // Statistics
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const resultsByWilaya = {};
    
    // Process each wilaya file
    for (const wilayaInfo of WILAYA_FILES) {
      const filePath = path.join(__dirname, '..', 'data', wilayaInfo.file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${wilayaInfo.file}`);
        continue;
      }
      
      try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        let parsedData = JSON.parse(rawData);
        
        // Handle both formats: direct array or wrapped with metadata
        let companies = [];
        if (Array.isArray(parsedData)) {
          companies = parsedData;
        } else if (parsedData && Array.isArray(parsedData.companies)) {
          companies = parsedData.companies;
        }
        
        if (!Array.isArray(companies) || companies.length === 0) {
          console.log(`⚠️  No valid data in: ${wilayaInfo.file}`);
          continue;
        }
        
        console.log(`\n📍 Processing Wilaya ${wilayaInfo.code}: ${companies.length} companies`);
        
        let imported = 0;
        let skipped = 0;
        let errors = 0;
        
        for (const company of companies) {
          try {
            // Create company directly, catch unique constraint errors
            await prisma.company.create({
              data: {
                name: company.name,
                slug: company.slug,
                legalForm: company.legalForm || 'SARL',
                rcNumber: company.rcNumber || '',
                nif: company.nif || '',
                nis: company.nis || '',
                website: company.website || null,
                description: company.description || null,
                yearEstablished: company.yearEstablished || null,
                employeeCount: company.employeeCount || null,
                productionCapacity: company.productionCapacity || null,
                exportCapability: company.exportCapability || false,
                verificationStatus: company.verificationStatus || 'PENDING',
                rating: company.rating || 4.0,
                reviewCount: company.reviewCount || 0,
                responseRate: company.responseRate || 80,
                wilaya: company.wilaya || wilayaInfo.code,
                commune: company.commune || null,
                address: company.address || null,
                contactEmail: company.contactEmail || `contact@${company.slug.replace(/-/g, '')}.dz`,
                contactPhone: company.contactPhone || '+213 XX XX XX XX',
                isVerified: company.isVerified || false,
                isActive: company.isActive !== undefined ? company.isActive : true,
                tenantId: tenant.id,
                userId: user.id
              }
            });
            
            imported++;
            
          } catch (error) {
            // Handle unique constraint violations gracefully
            if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
              skipped++;
            } else {
              errors++;
              if (errors <= 3) {
                console.error(`   ❌ Error importing ${company.name}: ${error.message?.substring(0, 100)}`);
              }
            }
          }
        }
        
        totalImported += imported;
        totalSkipped += skipped;
        totalErrors += errors;
        
        resultsByWilaya[wilayaInfo.code] = {
          file: wilayaInfo.file,
          total: companies.length,
          imported,
          skipped,
          errors
        };
        
        console.log(`   ✅ Imported: ${imported}, Skipped: ${skipped}, Errors: ${errors}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${wilayaInfo.file}: ${error.message}`);
        totalErrors++;
      }
    }
    
    // Final Summary
    console.log('\n');
    console.log('='.repeat(60));
    console.log('✅ SEEDING COMPLETE - MISSING WILAYAS');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 RESULTS BY WILAYA:');
    console.log('-'.repeat(50));
    
    Object.entries(resultsByWilaya).forEach(([code, result]) => {
      const status = result.imported > 0 ? '✅' : (result.skipped > 0 ? '⏭️' : '⚠️');
      console.log(`${status} Wilaya ${code}: +${result.imported} (${result.total} in file)`);
    });
    
    console.log('');
    console.log('📈 TOTALS:');
    console.log('-'.repeat(40));
    console.log(`   ✅ New Companies Imported: ${totalImported}`);
    console.log(`   ⏭️  Already Existed:       ${totalSkipped}`);
    console.log(`   ❌ Errors:                 ${totalErrors}`);
    console.log('');
    
    // Database totals after seeding
    const finalCount = await prisma.company.count();
    const finalWilayas = await prisma.company.groupBy({
      by: ['wilaya'],
      _count: { id: true }
    });
    
    console.log('🗄️  DATABASE STATUS:');
    console.log('-'.repeat(40));
    console.log(`   Total Companies: ${finalCount}`);
    console.log(`   Wilayas Covered: ${finalWilayas.length}/58`);
    console.log('');
    
    // Identify any still-missing wilayas
    const existingWilayas = finalWilayas.map(w => w.wilaya);
    const allWilayas = Array.from({length: 58}, (_, i) => (i + 1).toString().padStart(2, '0'));
    const stillMissing = allWilayas.filter(w => !existingWilayas.includes(w));
    
    if (stillMissing.length > 0) {
      console.log(`⚠️  Still Missing (${stillMissing.length}): ${stillMissing.join(', ')}`);
    } else {
      console.log('🎉 ALL 58 WILAYAS NOW COVERED!');
    }
    
    console.log('');
    console.log('🌟 AlgeriaTrade database is now comprehensive!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✨ Seeding completed successfully.');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
