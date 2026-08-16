/**
 * Quick script to seed only NEW wilayas 51-58
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

// New wilayas 51-58 configuration
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
  
  console.log(`✅ Using Tenant: ${tenant.id}, User: ${user.id}\n`);
  
  const initialCount = await prisma.company.count();
  let totalAdded = 0;
  
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
      
      for (const c of companies) {
        try {
          const name = extractName(c);
          const email = c.contact_email || `contact@${generateSlug(name).replace(/-/g, '')}.dz`;
          const phone = c.phone || '+213 XX XX XX XX';
          
          await prisma.company.upsert({
            where: { slug_tenantId: { slug: generateSlug(name), tenantId: tenant.id } },
            create: {
              name,
              slug: generateSlug(name),
              legalForm: c.legal_form || 'SARL',
              rcNumber: c.rc_number_format || '',
              description: `${c.business_sector || 'Entreprise active'}${c.products_services?.length ? '. Services: ' + c.products_services.slice(0,2).join(', ') : ''}`,
              yearEstablished: c.year_established || null,
              employeeCount: parseEmployeeCount(c.employee_count),
              verificationStatus: 'VERIFIED',
              verificationLevel: c.verification_level?.toLowerCase().includes('government') ? 'GOVERNMENT_VERIFIED' : 'VERIFIED',
              rating: 3.5 + Math.random() * 1.5,
              responseRate: 75 + Math.floor(Math.random() * 25),
              wilaya: String(wilaya.code).padStart(2, '0'),
              commune: c.commune || wilaya.name,
              address: `${wilaya.name}, Algérie`,
              contactEmail: email,
              contactPhone: phone,
              isVerified: true,
              isActive: true,
              tenantId: tenant.id,
              userId: user.id,
            },
            update: { updatedAt: new Date() }
          });
          added++;
        } catch (e) {
          // Skip duplicates
        }
      }
      
      totalAdded += added;
      console.log(`✅ [${wilaya.code}] ${wilaya.name}: +${added} companies`);
      
    } catch (e) {
      console.log(`❌ [${wilaya.code}] ${wilaya.name}: Error parsing file`);
    }
  }
  
  const finalCount = await prisma.company.count();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n🎉 NEW WILAYAS SEEDED!');
  console.log(`\n📊 Companies added: ${totalAdded}`);
  console.log(`📈 Database: ${initialCount} → ${finalCount} (+${finalCount - initialCount} net new)\n`);
}

main()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
