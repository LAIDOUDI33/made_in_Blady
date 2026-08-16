/**
 * Seed script for ALL newly researched wilayas (Batch 1 & 2)
 * Wilayas: 02, 04, 05, 06, 07, 09, 10, 11, 31, 33, 35
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DATA_DIR = '/home/z/my-project/data';

function generateSlug(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function parseEmployeeCount(count) {
  if (!count) return null;
  if (typeof count === 'number') return count;
  const match = String(count).match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function extractName(data) {
  if (!data.company_name) return 'Entreprise Non Spécifiée';
  if (typeof data.company_name === 'string') return data.company_name;
  if (typeof data.company_name === 'object') return data.company_name.fr || data.company_name.ar || 'Unknown';
  return String(data.company_name);
}

// All newly researched wilayas
const NEW_WILAYAS = [
  // Batch 1
  { code: '02', name: 'Chlef', file: 'chlef_companies_b2b.json' },
  { code: '04', name: 'Oum El Bouaghi', file: 'oum_el_bouaghi_companies_b2b.json' },
  { code: '05', name: 'Batna', file: 'batna_companies_b2b.json' },
  { code: '06', name: 'Béjaïa', file: 'bejaia_companies_b2b.json' },
  { code: '07', name: 'Biskra', file: 'biskra_companies_b2b.json' },
  
  // Batch 2
  { code: '09', name: 'Blida', file: 'blida_companies_b2b.json' },
  { code: '10', name: 'Bouira', file: 'bouira_companies_b2b.json' },
  { code: '11', name: 'Tamanrasset', file: 'tamanrasset_companies_b2b.json' },
  
  // Additional major wilayas
  { code: '31', name: 'Oran', file: 'oran_companies_b2b.json' },
  { code: '33', name: 'Illizi', file: 'illizi_companies_b2b.json' },
  { code: '35', name: 'Boumerdès', file: 'boumerdes_companies_b2b.json' },
];

async function main() {
  console.log('🚀 Seeding ALL Newly Researched Wilayas...\n');
  console.log('═'.repeat(60));
  
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'algeriatrade' } });
  const user = await prisma.user.findFirst({ where: { email: 'system@algeriatrade.dz' } });
  
  if (!tenant || !user) {
    console.log('❌ Tenant or user not found!');
    return;
  }
  
  console.log(`✅ Tenant: ${tenant.id}, User: ${user.id}\n`);
  
  const initialCount = await prisma.company.count();
  let totalAdded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const wilaya of NEW_WILAYAS) {
    const filePath = path.join(DATA_DIR, wilaya.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  [${wilaya.code}] ${wilaya.name}: File not found`);
      continue;
    }
    
    try {
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(rawData);
      const companies = json.companies || [];
      
      let added = 0;
      let skipped = 0;
      let errors = 0;
      
      for (const c of companies) {
        try {
          const name = extractName(c);
          const slug = generateSlug(name);
          const email = c.contact_email || `contact@${slug.replace(/-/g, '')}.dz`;
          const phone = c.phone || '+213 XX XX XX XX';
          
          // Determine verification level based on company info
          let verificationStatus = 'VERIFIED';
          let verificationLevel = 'VERIFIED';
          
          if (c.verification_level?.toLowerCase().includes('government') || 
              c.legal_form?.includes('EPE') ||
              c.legal_form?.includes('EP ')) {
            verificationStatus = 'GOVERNMENT_VERIFIED';
            verificationLevel = 'GOVERNMENT_VERIFIED';
          } else if (c.verification_level?.toLowerCase().includes('certified')) {
            verificationStatus = 'CERTIFIED';
            verificationLevel = 'CERTIFIED';
          } else if (c.verification_level?.toLowerCase() === 'basic') {
            verificationStatus = 'PENDING';
            verificationLevel = 'BASIC';
          }
          
          // Check for export capability
          const hasExport = 
            c.export_markets?.length > 0 ||
            name.toLowerCase().includes('export') ||
            c.business_sector?.toLowerCase().includes('export');
          
          await prisma.company.create({
            data: {
              name,
              slug,
              legalForm: c.legal_form || 'SARL',
              rcNumber: c.rc_number_format || '',
              nif: '',
              nis: '',
              description: `${c.business_sector || 'Entreprise active'}${c.products_services?.length ? '. Services: ' + c.products_services.slice(0,3).join(', ') : ''}`,
              yearEstablished: c.year_established || null,
              employeeCount: parseEmployeeCount(c.employee_count),
              verificationStatus,
              verificationLevel,
              rating: (() => {
                if (verificationLevel === 'GOVERNMENT_VERIFIED') return 4.5 + Math.random() * 0.5;
                if (verificationLevel === 'CERTIFIED') return 4.0 + Math.random() * 0.5;
                if (verificationLevel === 'VERIFIED') return 3.5 + Math.random() * 1.0;
                return 2.5 + Math.random() * 1.0;
              })(),
              reviewCount: 0,
              responseRate: (() => {
                if (verificationLevel === 'GOVERNMENT_VERIFIED') return 90 + Math.floor(Math.random() * 10);
                if (verificationLevel === 'CERTIFIED') return 80 + Math.floor(Math.random() * 15);
                return 65 + Math.floor(Math.random() * 30);
              })(),
              wilaya: String(wilaya.code).padStart(2, '0'),
              commune: wilaya.name,
              address: `${wilaya.name}, Algérie`,
              contactEmail: email,
              contactPhone: phone,
              isVerified: ['GOVERNMENT_VERIFIED', 'CERTIFIED', 'VERIFIED'].includes(verificationStatus),
              isActive: true,
              exportCapability: hasExport,
              tenantId: tenant.id,
              userId: user.id,
            }
          });
          added++;
        } catch (e) {
          if (e.code === 'P2002' || (e.message && e.message.includes('Unique constraint'))) {
            skipped++;
          } else {
            errors++;
            totalErrors++;
          }
        }
      }
      
      totalAdded += added;
      totalSkipped += skipped;
      
      if (added > 0) {
        console.log(`✅ [${wilaya.code}] ${wilaya.name}: +${added} new${skipped > 0 ? `, ${skipped} existed` : ''}`);
      } else if (skipped > 0 && errors === 0) {
        console.log(`ℹ️  [${wilaya.code}] ${wilaya.name}: All ${skipped} already seeded`);
      } else {
        console.log(`⚠️  [${wilaya.code}] ${wilaya.name}: ${added} added, ${skipped} skipped, ${errors} errors`);
      }
      
    } catch (e) {
      console.log(`❌ [${wilaya.code}] ${wilaya.name}: File error`);
      totalErrors++;
    }
  }
  
  const finalCount = await prisma.company.count();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 SEEDING COMPLETE!');
  console.log(`\n📊 Summary:`);
  console.log(`   • New companies added: ${totalAdded}`);
  console.log(`   • Already existed: ${totalSkipped}`);
  console.log(`   • Errors: ${totalErrors}`);
  console.log(`\n📈 Database: ${initialCount} → ${finalCount} (+${finalCount - initialCount} net new)\n`);
  
  // Show all wilayas now in database
  console.log('🗺️  Complete Wilaya Coverage:');
  const wilayaCounts = await prisma.company.groupBy({
    by: ['wilaya'],
    _count: { id: true },
    orderBy: { wilaya: 'asc' }
  });
  
  wilayaCounts.forEach(w => {
    if (w._count.id > 0) {
      console.log(`   [${w.wilaya}] ${String(w._count.id).padStart(4)} companies`);
    }
  });
}

main()
  .catch(e => console.error('Fatal Error:', e))
  .finally(() => prisma.$disconnect());
