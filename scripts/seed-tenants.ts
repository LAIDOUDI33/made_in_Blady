/**
 * Multi-Tenant Seeder Script
 * 
 * Script to initialize data for new country tenants:
 * - Senegal (SenegalTrade)
 * - Ivory Coast (CIV Trade)  
 * - Saudi Arabia (SaudiTrade)
 * - UAE (EmiratesTrade)
 * 
 * Usage:
 *   bun run scripts/seed-tenants.ts              # Execute
 *   bun run scripts/seed-tenants.ts --force       # Force reset
 *   bun run scripts/seed-tenants.ts --dry-run     # Simulation (no writes)
 *   bun run scripts/seed-tenants.ts --tenant senegal  # Seed specific tenant only
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// Import template data
import { 
  senegalTemplate, 
  senegaleseRegions, 
  senegaleseCategories,
  senegalPaymentMethods 
} from '../src/lib/multi-tenant/templates/senegal';

import { 
  ivoryCoastTemplate, 
  ivorianRegions, 
  ivorianCategories,
  ivoryCoastPaymentMethods 
} from '../src/lib/multi-tenant/templates/ivorycoast';

import { 
  saudiArabiaTemplate, 
  saudiProvinces, 
  saudiCategories,
  saudiPaymentMethods 
} from '../src/lib/multi-tenant/templates/saudiarabia';

import { 
  uaeTemplate, 
  uaeEmirates, 
  uaeCategories,
  uaePaymentMethods 
} from '../src/lib/multi-tenant/templates/uae';

import { CountryTemplate } from '../src/lib/multi-tenant/templates';

const prisma = new PrismaClient();

// =============================================================================
// Configuration
// =============================================================================

const FORCE_RESET = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');
const TENANT_FILTER = process.argv.find((arg, i) => arg === '--tenant' && process.argv[i + 1]) 
  ? process.argv[process.argv.findIndex((arg, i) => arg === '--tenant') + 1] 
  : null;

// =============================================================================
// Types
// =============================================================================

interface TenantSeedData {
  template: CountryTemplate;
  regions: Array<{ code: string; name: string; nameAr: string }>;
  categories: Array<{ name: string; slug: string; icon?: string }>;
  paymentMethods: Array<{ id: string; name: string; type: string }>;
  demoCompanies: DemoCompany[];
}

interface DemoCompany {
  name: string;
  email: string;
  regionCode: string;
  category: string;
  description: string;
}

// =============================================================================
// Tenant Configurations
// =============================================================================

const TENANT_SEED_DATA: Record<string, TenantSeedData> = {
  senegal: {
    template: senegalTemplate,
    regions: senegaleseRegions,
    categories: senegaleseCategories,
    paymentMethods: senegalPaymentMethods,
    demoCompanies: [
      { name: 'Sénégal Arachides SA', email: 'contact@senegal-arachides.sn', regionCode: 'DK', category: 'agriculture', description: 'Leader de la production et exportation d\'arachides sénégalaises' },
      { name: 'Dakar Pêche Industries', email: 'info@dakar-peche.sn', regionCode: 'DK', category: 'fishing', description: 'Transformation et export de produits de la mer frais' },
      { name: 'Thiès Textiles', email: 'contact@thies-textiles.sn', regionCode: 'TH', category: 'textiles', description: 'Fabricant de tissus traditionnels et modernes' },
      { name: 'Kaolack Construction', email: 'info@kaolack-btp.sn', regionCode: 'KA', category: 'construction', description: 'Matériaux de construction et équipements BTP' },
      { name: 'Saint-Louis Mines', email: 'contact@sl-mines.sn', regionCode: 'SL', category: 'mining', description: 'Extraction et traitement de phosphates et or' },
    ],
  },
  ivorycoast: {
    template: ivoryCoastTemplate,
    regions: ivorianRegions,
    categories: ivorianCategories,
    paymentMethods: ivoryCoastPaymentMethods,
    demoCompanies: [
      { name: 'Cacao Côte d\'Ivoire SA', email: 'export@civo-cacao.ci', regionCode: 'ABJ', category: 'agriculture', description: 'Producteur et exportateur premium de cacao ivoirien' },
      { name: 'Abidjan Café Export', email: 'sales@abidjan-cafe.ci', regionCode: 'ABJ', category: 'food', description: 'Spécialiste du café robusta de Côte d\'Ivoire' },
      { name: 'San-Pédro Mining Corp', email: 'info@sp-mining.ci', regionCode: 'SAN', category: 'mining', description: 'Exploitation minière responsable or et diamants' },
      { name: 'Bouaké Industries', email: 'contact@bouake-industries.ci', regionCode: 'BKF', category: 'textiles', description: 'Industrie textile et confection' },
      { name: 'Yamoussoukro Energy', email: 'info@yam-energy.ci', regionCode: 'YSS', category: 'energy', description: 'Solutions énergétiques renouvelables' },
    ],
  },
  saudiarabia: {
    template: saudiArabiaTemplate,
    regions: saudiProvinces,
    categories: saudiCategories,
    paymentMethods: saudiPaymentMethods,
    demoCompanies: [
      { name: 'Riyadh Petrochemicals Co.', email: 'info@riyadh-petro.sa', regionCode: '01', category: 'chemicals', description: 'Leader pétrochimique en Arabie Saoudite' },
      { name: 'Makkah Construction Group', email: 'projects@makkah-construction.sa', regionCode: '02', category: 'construction', description: 'Grands projets Vision 2030 et NEOM' },
      { name: 'Eastern Province Oil & Gas', email: 'supply@ep-oil.sa', regionCode: '04', category: 'oil_gas', description: 'Solutions complètes secteur énergétique' },
      { name: 'Jeddah Tech Solutions', email: 'hello@jeddah-tech.sa', regionCode: '02', category: 'technology', description: 'Solutions IT et logiciels enterprise' },
      { name: 'Qassim Food Industries', email: 'export@qassim-food.sa', regionCode: '05', category: 'food', description: 'Production alimentaire halal certifiée' },
    ],
  },
  uae: {
    template: uaeTemplate,
    regions: uaeEmirates,
    categories: uaeCategories,
    paymentMethods: uaePaymentMethods,
    demoCompanies: [
      { name: 'Dubai Properties LLC', email: 'invest@dubai-properties.ae', regionCode: 'DU', category: 'real_estate', description: 'Immobilier premium à Dubaï et Émirats' },
      { name: 'Abu Dhabi Logistics Hub', email: 'operations@ad-logistics.ae', regionCode: 'AB', category: 'logistics', description: 'Hub logistique international port Khalifa' },
      { name: 'Sharjah Tourism Group', email: 'info@sharjah-tourism.ae', regionCode: 'SH', category: 'tourism', description: 'Hôtellerie et tourisme de luxe' },
      { name: 'Dubai Fintech Solutions', email: 'partners@dubai-fintech.ae', regionCode: 'DU', category: 'finance', description: 'Technologies financières et paiement digital' },
      { name: 'Abu Dhabi Smart City Tech', email: 'contact@ad-smartcity.ae', regionCode: 'AB', category: 'technology', description: 'Solutions smart city IoT et AI' },
    ],
  },
};

// =============================================================================
// Utility Functions
// =============================================================================

function log(message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
  };
  console.log(`${colors[type]}[${type.toUpperCase()}]${'\x1b[0m'} ${message}`);
}

function getTenantFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    SN: '🇸🇳',
    CI: '🇨🇮',
    SA: '🇸🇦',
    AE: '🇦🇪',
  };
  return flags[countryCode] || '🌍';
}

// =============================================================================
// Seeding Functions
// =============================================================================

async function seedTenant(tenantId: string, data: TenantSeedData) {
  const { template, regions, categories, paymentMethods, demoCompanies } = data;
  const flag = getTenantFlag(template.countryCode);
  
  console.log('\n──────────────────────────────────────────────');
  console.log(`  ${flag} Seeding ${template.name} (${template.country})`);
  console.log('──────────────────────────────────────────────\n');

  // 1. Create/Update Tenant Record
  await seedTenantRecord(template);
  
  // 2. Seed Regions
  await seedRegions(tenantId, regions, template);
  
  // 3. Seed Categories
  await seedCategories(tenantId, categories, template);
  
  // 4. Seed Payment Methods
  await seedPaymentMethods(tenantId, paymentMethods, template);
  
  // 5. Seed Demo Companies
  await seedDemoCompanies(tenantId, demoCompanies, template);
}

async function seedTenantRecord(template: CountryTemplate) {
  log('Creating tenant record...');
  
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: template.slug },
  });
  
  if (existingTenant && !FORCE_RESET) {
    log(`Tenant ${template.slug} already exists, skipping...`, 'warn');
    return existingTenant.id;
  }
  
  const tenantData = {
    name: template.name,
    slug: template.slug,
    displayName: template.displayName,
    country: template.country,
    countryCode: template.countryCode,
    currency: template.currency,
    currencySymbol: template.currencySymbol,
    language: template.language,
    languages: JSON.stringify(template.languages),
    phonePrefix: template.phonePrefix,
    primaryColor: template.primaryColor,
    secondaryColor: template.secondaryColor,
    timezone: template.timezone,
    flagEmoji: template.flagEmoji,
    features: JSON.stringify(template.features),
    isActive: true,
    domain: `${template.slug}.com`, // Default domain placeholder
    config: JSON.stringify({
      regions: template.regions,
      regionName: template.regionName,
      regionNameFr: template.regionNameFr,
      description: template.description,
      descriptionFr: template.descriptionFr,
      defaultStrings: template.defaultStrings,
    }),
  };
  
  let tenantId: string;
  
  if (!DRY_RUN) {
    if (existingTenant && FORCE_RESET) {
      const updated = await prisma.tenant.update({
        where: { id: existingTenant.id },
        data: tenantData,
      });
      tenantId = updated.id;
      log('Updated existing tenant record', 'warn');
    } else {
      const created = await prisma.tenant.create({
        data: tenantData,
      });
      tenantId = created.id;
      log(`✓ Created tenant: ${template.name}`, 'success');
    }
  } else {
    tenantId = `mock-${template.slug}-id`;
    log(`Would create tenant: ${template.name}`, 'info');
  }
  
  return tenantId;
}

async function seedRegions(
  tenantId: string, 
  regions: Array<{ code: string; name: string; nameAr: string }>,
  template: CountryTemplate
) {
  log(`Seeding ${regions.length} ${template.regionName.toLowerCase()}...`);
  
  for (const region of regions) {
    if (!DRY_RUN) {
      // Check if we have a Region model, otherwise use generic approach
      try {
        await prisma.region.upsert({
          where: { 
            code_tenantId: {
              code: region.code,
              tenantId: tenantId,
            }
          },
          update: { 
            name: region.name,
            nameAr: region.nameAr,
          },
          create: {
            code: region.code,
            name: region.name,
            nameAr: region.nameAr,
            tenantId: tenantId,
          },
        });
      } catch (error) {
        // Region model might not exist with this schema, skip gracefully
        log(`Region upsert skipped (model may differ)`, 'warn');
        break;
      }
    }
  }
  
  log(`✓ Processed ${regions.length} regions`, 'success');
}

async function seedCategories(
  tenantId: string,
  categories: Array<{ name: string; slug: string; icon?: string }>,
  template: CountryTemplate
) {
  log(`Seeding ${categories.length} categories...`);
  
  for (const category of categories) {
    if (!DRY_RUN) {
      try {
        await prisma.category.upsert({
          where: {
            slug_tenantId: {
              slug: category.slug,
              tenantId: tenantId,
            }
          },
          update: {
            name: category.name,
            icon: category.icon,
          },
          create: {
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            tenantId: tenantId,
          },
        });
      } catch (error) {
        // Category model might not have tenantId, use basic upsert
        try {
          await prisma.category.upsert({
            where: { slug: category.slug },
            update: { name: category.name },
            create: {
              name: category.name,
              slug: category.slug,
              icon: category.icon,
            },
          });
        } catch (e2) {
          log(`Category ${category.slug} skipped`, 'warn');
        }
      }
    }
  }
  
  log(`✓ Processed ${categories.length} categories`, 'success');
}

async function seedPaymentMethods(
  tenantId: string,
  paymentMethods: Array<{ id: string; name: string; type: string }>,
  template: CountryTemplate
) {
  log(`Seeding ${paymentMethods.length} payment methods...`);
  
  for (const pm of paymentMethods) {
    if (!DRY_RUN) {
      // Store in settings or dedicated table if available
      try {
        await prisma.setting.upsert({
          where: { 
            key: `payment_${template.slug}_${pm.id}` 
          },
          update: { 
            value: JSON.stringify(pm) 
          },
          create: {
            key: `payment_${template.slug}_${pm.id}`,
            value: JSON.stringify(pm),
            type: 'JSON',
            tenantId: tenantId,
          },
        });
      } catch (error) {
        // Settings might not support tenantId, store as simple key
        await prisma.setting.upsert({
          where: { key: `payment_${template.slug}_${pm.id}` },
          update: { value: JSON.stringify(pm) },
          create: {
            key: `payment_${template.slug}_${pm.id}`,
            value: JSON.stringify(pm),
            type: 'JSON',
          },
        });
      }
    }
  }
  
  log(`✓ Processed ${paymentMethods.length} payment methods`, 'success');
}

async function seedDemoCompanies(
  tenantId: string,
  companies: DemoCompany[],
  template: CountryTemplate
) {
  log(`Seeding ${companies.length} demo companies...`);
  
  for (const company of companies) {
    const hashedPassword = await hash('Demo123!', 12);
    
    if (!DRY_RUN) {
      try {
        // Create user first
        const user = await prisma.user.upsert({
          where: { email: company.email },
          update: {
            name: company.name,
            role: 'COMPANY',
            emailVerified: true,
            isActive: true,
          },
          create: {
            email: company.email,
            name: company.name,
            password: hashedPassword,
            role: 'COMPANY',
            emailVerified: true,
            isActive: true,
          },
        });
        
        // Create company profile
        await prisma.company.upsert({
          where: { 
            userId: user.id 
          },
          update: {
            name: company.name,
            slug: company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: company.description,
            region: company.regionCode,
            tenantId: tenantId,
          },
          create: {
            name: company.name,
            slug: company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: company.description,
            email: company.email,
            phone: `${template.phonePrefix} XXXXXXXX`,
            region: company.regionCode,
            userId: user.id,
            tenantId: tenantId,
            isVerified: true,
            status: 'ACTIVE',
          },
        });
        
        log(`  ✓ Created demo company: ${company.name}`, 'success');
      } catch (error) {
        log(`  ⚠ Company ${company.name} creation failed: ${(error as Error).message}`, 'warn');
      }
    } else {
      log(`  Would create demo company: ${company.name}`, 'info');
    }
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║     🌍 Multi-Tenant Country Templates Seeder       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  if (DRY_RUN) {
    log('🔍 DRY RUN MODE - No changes will be made\n', 'warn');
  }
  
  if (FORCE_RESET) {
    log('⚠️  FORCE RESET ENABLED - Existing data will be overwritten!\n', 'warn');
  }
  
  if (TENANT_FILTER) {
    log(`🎯 Filtering for tenant only: ${TENANT_FILTER}\n`, 'info');
  }
  
  const startTime = Date.now();
  
  try {
    // Connect to database
    await prisma.$connect();
    log('Connected to database ✓\n', 'success');
    
    // Determine which tenants to seed
    const tenantsToSeed = TENANT_FILTER 
      ? { [TENANT_FILTER]: TENANT_SEED_DATA[TENANT_FILTER] }
      : TENANT_SEED_DATA;
    
    // Validate tenant filter
    if (TENANT_FILTER && !TENANT_SEED_DATA[TENANT_FILTER]) {
      log(`Invalid tenant filter: ${TENANT_FILTER}`, 'error');
      log(`Available tenants: ${Object.keys(TENANT_SEED_DATA).join(', ')}`, 'info');
      process.exit(1);
    }
    
    // Seed each tenant
    for (const [tenantId, data] of Object.entries(tenantsToSeed)) {
      await seedTenant(tenantId, data);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const tenantCount = Object.keys(tenantsToSeed).length;
    
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log(`║  ✅ Multi-tenant seeding completed               ║`);
    console.log(`║     Tenants processed: ${tenantCount}                           ║`);
    console.log(`║     Duration: ${duration}s                              ║`);
    console.log('╚═══════════════════════════════════════════════════╝\n');
    
    if (DRY_RUN) {
      log('Run without --dry-run to apply changes.', 'info');
    }
    
    // Summary
    console.log('\n📋 Summary of seeded templates:');
    console.log('┌─────────────────┬──────────────┬─────────┬──────────┐');
    console.log('│ Tenant          │ Currency     │ Regions │ Language │');
    console.log('├─────────────────┼──────────────┼─────────┼──────────┤');
    
    for (const [id, data] of Object.entries(tenantsToSeed)) {
      const t = data.template;
      console.log(
        `│ ${t.name.padEnd(15)} │ ${t.currencySymbol.padEnd(12)} │ ${String(t.regions).padEnd(7)} │ ${t.language.padEnd(8)} │`
      );
    }
    
    console.log('└─────────────────┴──────────────┴─────────┴──────────┘\n');
    
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
