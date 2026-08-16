/**
 * AlgeriaTrade.dz - FAST Master Seed Script (Node.js)
 * 
 * Optimized for speed - processes all wilayas efficiently
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DATA_DIR = '/home/z/my-project/data';

// Helper functions
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
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

function transformCompany(data, wilayaCode, wilayaName, tenantId, userId) {
  const name = extractName(data);
  const email = data.contact_email || data.contact?.email || `contact@${generateSlug(name).replace(/-/g, '')}.dz`;
  const phone = data.phone || data.contact?.phone || data.contact?.mobile || '+213 XX XX XX XX';
  
  return {
    name,
    slug: generateSlug(name),
    legalForm: data.legal_form || 'SARL',
    rcNumber: data.rc_number_format || '',
    description: `${data.business_sector || 'Entreprise active'}${data.products_services?.length ? '. Services: ' + data.products_services.slice(0,2).join(', ') : ''}`,
    yearEstablished: data.year_established || null,
    employeeCount: parseEmployeeCount(data.employee_count),
    verificationStatus: 'VERIFIED',
    verificationLevel: data.verification_level?.toLowerCase().includes('government') ? 'GOVERNMENT_VERIFIED' : 'VERIFIED',
    rating: 3.5 + Math.random() * 1.5,
    responseRate: 75 + Math.floor(Math.random() * 25),
    wilaya: String(wilayaCode).padStart(2, '0'),
    wilayaName,
    commune: data.commune || (typeof data.address === 'object' ? data.address?.city : wilayaName) || wilayaName,
    address: typeof data.address === 'string' ? data.address : `${data.address?.street || wilayaName}, ${wilayaName}, Algérie`,
    contactEmail: email,
    contactPhone: phone,
    isVerified: true,
    isActive: true,
    tenantId,
    userId
  };
}

// All wilayas configuration
const WILAYAS = [
  // Batch 1: 01-10
  { code: '01', name: 'Adrar', file: 'adrar_companies_b2b.json' },
  { code: '02', name: 'Chlef', file: 'chlef_companies_b2b.json' },
  { code: '03', name: 'Laghouat', file: 'laghouat_companies_b2b.json' },
  { code: '04', name: 'Oum El Bouaghi', file: 'oum_el_bouaghi_companies.json' },
  { code: '05', name: 'Batna', file: 'batna_companies_b2b_database.json' },
  { code: '06', name: 'Béjaïa', file: 'bejaia_companies.json' },
  { code: '07', name: 'Biskra', file: 'biskra_companies.json' },
  { code: '08', name: 'Béchar', file: 'bechar_companies_b2b.json' },
  { code: '09', name: 'Blida', file: 'blida_companies_b2b_enhanced.json' },
  { code: '10', name: 'Bouira', file: 'bouira_companies_b2b.json' },
  
  // Batch 2: 11-20
  { code: '12', name: 'Tébessa', file: 'tebessa_companies_b2b.json' },
  { code: '13', name: 'Tlemcen', file: 'tlemcen_companies_b2b.json' },
  { code: '14', name: 'Tiaret', file: 'tiaret_companies_b2b.json' },
  { code: '15', name: 'Tizi Ouzou', file: 'tizi_ouzou_companies_b2b.json' },
  { code: '16', name: 'Alger', file: 'algiers_companies_b2b.json' },
  { code: '17', name: 'Djelfa', file: 'djelfa_companies_b2b.json' },
  { code: '18', name: 'Jijel', file: 'jijel_companies_b2b.json' },
  { code: '19', name: 'Sétif', file: 'setif_companies_b2b.json' },
  { code: '20', name: 'Saïda', file: 'saida_companies_b2b.json' },
  
  // Batch 3: 21-30
  { code: '21', name: 'Skikda', file: 'skikda_companies_b2b.json' },
  { code: '22', name: 'Sidi Bel Abbès', file: 'sidi_bel_abbas_companies_b2b.json' },
  { code: '23', name: 'Annaba', file: 'annaba_companies_b2b.json' },
  { code: '24', name: 'Guelma', file: 'guelma_companies_b2b.json' },
  { code: '25', name: 'Constantine', file: 'constantine_companies_b2b.json' },
  { code: '26', name: 'Médéa', file: 'medea_companies_b2b.json' },
  { code: '27', name: 'Mostaganem', file: 'mostaganem_companies_b2b.json' },
  { code: '28', name: "M'Sila", file: 'msila_companies_b2b.json' },
  { code: '29', name: 'Mascara', file: 'mascara_companies_b2b.json' },
  { code: '30', name: 'Ouargla', file: 'ouargla_companies_b2b.json' },
  
  // Batch 4: 31-40
  { code: '32', name: 'El Bayadh', file: 'el_bayadh_companies_b2b.json' },
  { code: '34', name: 'Bordj Bou Arreridj', file: 'bordj_bou_arreridj_companies_b2b.json' },
  { code: '36', name: 'El Tarf', file: 'el_tarf_companies_b2b.json' },
  { code: '37', name: 'Tindouf', file: 'tindouf_companies_b2b.json' },
  { code: '38', name: 'Tissemsilt', file: 'tissemsilt_companies_b2b.json' },
  { code: '39', name: 'El Oued', file: 'el_oued_companies_b2b.json' },
  { code: '40', name: 'Khenchela', file: 'khenchela_companies_b2b.json' },
  
  // Batch 5: 41-50
  { code: '41', name: 'Souk Ahras', file: 'souk_ahras_companies_b2b.json' },
  { code: '42', name: 'Tipaza', file: 'tipaza_companies_b2b.json' },
  { code: '43', name: 'Mila', file: 'mila_companies_b2b.json' },
  { code: '44', name: 'Aïn Defla', file: 'ain_defla_companies_b2b.json' },
  { code: '45', name: 'Naâma', file: 'naama_companies_b2b.json' },
  { code: '46', name: 'Aïn Témouchent', file: 'wilaya_46_companies_b2b.json' },
  { code: '47', name: 'Ghardaïa', file: 'wilaya_47_companies_b2b.json' },
  { code: '48', name: 'Relizane', file: 'wilaya_48_companies_b2b.json' },
  { code: '49', name: "El M'Ghair", file: 'wilaya_49_companies_b2d.json' },
  { code: '50', name: 'El Meniaa', file: 'wilaya_50_companies_b2b.json' },
];

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  🇩🇿 ALGERIATRADE - FAST MASTER SEED SCRIPT   ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  
  // Get/create tenant and user
  let tenant = await prisma.tenant.findFirst({ where: { slug: 'algeriatrade' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { slug: 'algeriatrade', name: 'AlgeriaTrade' } });
  }
  
  let user = await prisma.user.findFirst({ where: { email: 'system@algeriatrade.dz' } });
  if (!user) {
    user = await prisma.user.create({ 
      data: { email: 'system@algeriatrade.dz', firstName: 'System', lastName: 'Account', role: 'ADMIN', tenantId: tenant.id, password: 'hash' }
    });
  }
  
  console.log(`✅ Tenant: ${tenant.id}, User: ${user.id}`);
  
  const initialCount = await prisma.company.count();
  console.log(`📊 Initial company count: ${initialCount}\n`);
  
  let totalSeeded = 0;
  let totalErrors = 0;
  let filesProcessed = 0;
  let filesSkipped = 0;
  
  for (const wilaya of WILAYAS) {
    const filePath = path.join(DATA_DIR, wilaya.file);
    
    if (!fs.existsSync(filePath)) {
      process.stdout.write(`⚠️  [${wilaya.code}] ${wilaya.name}: File missing\n`);
      filesSkipped++;
      continue;
    }
    
    try {
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(rawData);
      const companies = json.companies || [];
      
      let seeded = 0;
      
      for (const c of companies) {
        try {
          const input = transformCompany(c, wilaya.code, wilaya.name, tenant.id, user.id);
          await prisma.company.upsert({
            where: { slug_tenantId: { slug: input.slug, tenantId: tenant.id } },
            create: input,
            update: { updatedAt: new Date() }
          });
          seeded++;
        } catch (e) {
          // Skip duplicates silently
          if (!e.message?.includes('Unique constraint')) totalErrors++;
        }
      }
      
      totalSeeded += seeded;
      filesProcessed++;
      process.stdout.write(`✅ [${wilaya.code}] ${wilaya.name}: +${seeded} companies\n`);
      
    } catch (e) {
      process.stdout.write(`❌ [${wilaya.code}] ${wilaya.name}: Parse error\n`);
      totalErrors++;
    }
  }
  
  const finalCount = await prisma.company.count();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n' + '='.repeat(50));
  console.log('\n🎉 SEEDING COMPLETE!');
  console.log(`\n📈 SUMMARY:`);
  console.log(`   • Files processed: ${filesProcessed}/${WILAYAS.length}`);
  console.log(`   • Files skipped: ${filesSkipped} (not yet researched)`);
  console.log(`   • Companies added: ${totalSeeded}`);
  console.log(`   • Errors: ${totalErrors}`);
  console.log(`   • Time: ${duration}s`);
  console.log(`\n📊 Database: ${initialCount} → ${finalCount} companies (+${finalCount - initialCount} net new)`);
  console.log('\n✨ AlgeriaTrade.dz is populated!\n');
}

main()
  .catch(e => { console.error('Fatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
