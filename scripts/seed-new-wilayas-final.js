/**
 * Final working script to seed NEW wilayas 51-58
 * Uses CREATE with duplicate handling
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

const NEW_WILAYAS = [
  { code: '51', name: 'Ouled Djellal', file: 'ouled_djellal_companies_b2b.json' },
  { code: '52', name: 'Béni Abbès', file: 'beni_abbes_companies_b2b.json' },
  { code: '53', name: 'Bordj Badji Mokhtar', file: 'wilaya_53_companies_b2b.json' },
  { code: '54', name: 'Touggourt', file: 'touggourt_companies_b2b.json' },
  { code: '55', name: 'Djanet', file: 'djanet_companies_b2b.json' },
  { code: '56', name: 'In Salah', file: 'in_salah_companies_b2b.json' },
  { code: '57', name: 'In Guezzam', file: 'in_guezzam_companies_b2b.json' },
  { code: '58', name: 'Timimoun', file: 'wilaya_58_companies_b2b.json' },
];

async function main() {
  console.log('🚀 Seeding NEW Wilayas 51-58...\n');
  
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
      
      for (const c of companies) {
        try {
          const name = extractName(c);
          const slug = generateSlug(name);
          const email = c.contact_email || `contact@${slug.replace(/-/g, '')}.dz`;
          const phone = c.phone || '+213 XX XX XX XX';
          
          // Try to create - will fail if slug+tenant already exists
          await prisma.company.create({
            data: {
              name,
              slug,
              legalForm: c.legal_form || 'SARL',
              rcNumber: c.rc_number_format || '',
              nif: '',
              nis: '',
              description: `${c.business_sector || 'Entreprise active'}${c.products_services?.length ? '. Services: ' + c.products_services.slice(0,2).join(', ') : ''}`,
              yearEstablished: c.year_established || null,
              employeeCount: parseEmployeeCount(c.employee_count),
              verificationStatus: 'VERIFIED',
              verificationLevel: 'VERIFIED',
              rating: 3.5 + Math.random() * 1.5,
              reviewCount: 0,
              responseRate: 75 + Math.floor(Math.random() * 25),
              wilaya: String(wilaya.code).padStart(2, '0'),
              commune: wilaya.name,
              address: `${wilaya.name}, Algérie`,
              contactEmail: email,
              contactPhone: phone,
              isVerified: true,
              isActive: true,
              tenantId: tenant.id,
              userId: user.id,
            }
          });
          added++;
        } catch (e) {
          // Skip if already exists (unique constraint)
          if (e.code === 'P2002' || (e.message && e.message.includes('Unique constraint'))) {
            skipped++;
          } else {
            // Log other errors
            const name = extractName(c);
            console.log(`   ❌ Error on "${name.substring(0, 30)}": ${e.code}`);
          }
        }
      }
      
      totalAdded += added;
      totalSkipped += skipped;
      
      if (added > 0) {
        console.log(`✅ [${wilaya.code}] ${wilaya.name}: +${added} new${skipped > 0 ? `, ${skipped} skipped (exists)` : ''}`);
      } else if (skipped > 0) {
        console.log(`ℹ️  [${wilaya.code}] ${wilaya.name}: All ${skipped} already exist`);
      } else {
        console.log(`⚠️  [${wilaya.code}] ${wilaya.name}: No companies processed`);
      }
      
    } catch (e) {
      console.log(`❌ [${wilaya.code}] ${wilaya.name}: File parse error`);
    }
  }
  
  const finalCount = await prisma.company.count();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n🎉 SEEDING COMPLETE!');
  console.log(`\n📊 New companies added: ${totalAdded}`);
  console.log(`📊 Already existed: ${totalSkipped}`);
  console.log(`📈 Database: ${initialCount} → ${finalCount} (+${finalCount - initialCount} net new)\n`);
  
  // Show wilaya distribution
  console.log('🗺️  New Wilayas Distribution:');
  for (const w of ['51', '52', '53', '54', '55', '56', '57', '58']) {
    const cnt = await prisma.company.count({ where: { wilaya: w } });
    if (cnt > 0) {
      console.log(`   [${w}] ${cnt} companies`);
    }
  }
}

main()
  .catch(e => console.error('Fatal Error:', e))
  .finally(() => prisma.$disconnect());
