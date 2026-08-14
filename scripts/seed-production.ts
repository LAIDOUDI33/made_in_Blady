/**
 * AlgeriaTrade.dz - Production Seed Script
 * 
 * Script pour initialiser les données de production :
 * - Wilayas algériennes (58 provinces)
 * - Catégories de produits B2B
 * - Utilisateurs administrateurs
 * - Paramètres système
 * 
 * Usage:
 *   bun run scripts/seed-production.ts              # Exécuter
 *   bun run scripts/seed-production.ts --force       # Forcer la réinitialisation
 *   bun run scripts/seed-production.ts --dry-run     # Simulation (pas d'écriture)
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// =============================================================================
// Configuration
// =============================================================================

const FORCE_RESET = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

// =============================================================================
// Types
// =============================================================================

interface Wilaya {
  code: number;
  name: string;
  nameAr: string;
  latitude: number;
  longitude: number;
}

interface Category {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
}

interface AdminUser {
  email: string;
  name: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
}

// =============================================================================
// Données de référence
// =============================================================================

// Liste des 58 wilayas algériennes
const WILAYAS: Wilaya[] = [
  { code: 1, name: 'Adrar', nameAr: 'أدرار', latitude: 27.8833, longitude: -0.2833 },
  { code: 2, name: 'Chlef', nameAr: 'الشلف', latitude: 36.1667, longitude: 1.3333 },
  { code: 3, name: 'Laghouat', nameAr: 'الأغواط', latitude: 33.4333, longitude: 2.8667 },
  { code: 4, name: 'Oum El Bouaghi', nameAr: 'أم البواقي', latitude: 35.8667, longitude: 7.1167 },
  { code: 5, name: 'Batna', nameAr: 'باتنة', latitude: 35.55, longitude: 6.1833 },
  { code: 6, name: 'Béjaïa', nameAr: 'بجاية', latitude: 36.7167, longitude: 5.0667 },
  { code: 7, name: 'Biskra', nameAr: 'بسكرة', latitude: 34.8167, longitude: 5.7167 },
  { code: 8, name: 'Béchar', nameAr: 'بشار', latitude: 31.6167, longitude: -2.2333 },
  { code: 9, name: 'Blida', nameAr: 'البليدة', latitude: 36.4667, longitude: 2.8333 },
  { code: 10, name: 'Bouira', nameAr: 'البويرة', latitude: 36.3833, longitude: 3.9 },
  { code: 11, name: 'Tamanrasset', nameAr: 'تمنراست', latitude: 22.7833, longitude: 5.5167 },
  { code: 12, name: 'Tébessa', nameAr: 'تبسة', latitude: 35.4167, longitude: 8.1167 },
  { code: 13, name: 'Tlemcen', nameAr: 'تلمسان', latitude: 34.8833, longitude: -1.3167 },
  { code: 14, name: 'Tiaret', nameAr: 'تيارت', latitude: 35.3667, longitude: 1.3167 },
  { code: 15, name: 'Tizi Ouzou', nameAr: 'تيزي وزو', latitude: 36.7167, longitude: 4.05 },
  { code: 16, name: 'Alger', nameAr: 'الجزائر', latitude: 36.75, longitude: 3.05 },
  { code: 17, name: 'Djelfa', nameAr: 'الجلفة', latitude: 34.6833, longitude: 2.9833 },
  { code: 18, name: 'Jijel', nameAr: 'جيجل', latitude: 36.8, longitude: 5.75 },
  { code: 19, name: 'Sétif', nameAr: 'سطيف', latitude: 36.1833, longitude: 5.4167 },
  { code: 20, name: 'Saïda', nameAr: 'سعيدة', latitude: 34.8333, longitude: 0.15 },
  { code: 21, name: 'Skikda', nameAr: 'سكيكدة', latitude: 36.8833, longitude: 6.9167 },
  { code: 22, name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس', latitude: 35.2, longitude: -0.65 },
  { code: 23, name: 'Annaba', nameAr: 'عنابة', latitude: 36.9, longitude: 7.7667 },
  { code: 24, name: 'Guelma', nameAr: 'قالمة', latitude: 36.45, longitude: 7.4167 },
  { code: 25, name: 'Constantine', nameAr: 'قسنطينة', latitude: 36.35, longitude: 6.6167 },
  { code: 26, name: 'Médéa', nameAr: 'المدية', latitude: 36.25, longitude: 2.75 },
  { code: 27, name: 'Mostaganem', nameAr: 'مستغانم', latitude: 35.9333, longitude: 0.0833 },
  { code: 28, name: "M'Sila", nameAr: 'المسيلة', latitude: 35.7167, longitude: 4.5333 },
  { code: 29, name: 'Mascara', nameAr: 'معسكر', latitude: 35.4, longitude: 0.15 },
  { code: 30, name: 'Ouargla', nameAr: 'ورقلة', latitude: 33.8167, longitude: 5.3333 },
  { code: 31, name: 'Oran', nameAr: 'وهران', latitude: 35.6911, longitude: -0.6417 },
  { code: 32, name: 'El Bayadh', nameAr: 'البيض', latitude: 33.6833, longitude: 0.9833 },
  { code: 33, name: 'Illizi', nameAr: 'إليزي', latitude: 26.4833, longitude: 8.2667 },
  { code: 34, name: 'Bordj Bou Arreridj', nameAr: 'برج بوعريريج', latitude: 36.0667, longitude: 4.75 },
  { code: 35, name: 'Boumerdès', nameAr: 'بومرداس', latitude: 36.7667, longitude: 3.4833 },
  { code: 36, name: 'El Tarf', nameAr: 'الطارف', latitude: 36.75, longitude: 8.3167 },
  { code: 37, name: 'Tindouf', nameAr: 'تندوف', latitude: 27.6667, longitude: -8.1333 },
  { code: 38, name: 'Tissemsilt', nameAr: 'تيسمسيلت', latitude: 35.6167, longitude: 1.8167 },
  { code: 39, name: 'El Oued', nameAr: 'الوادي', latitude: 33.5167, longitude: 6.85 },
  { code: 40, name: 'Khenchela', nameAr: 'خنشلة', latitude: 35.4333, longitude: 7.15 },
  { code: 41, name: 'Souk Ahras', nameAr: 'سوق أهراس', latitude: 36.2833, longitude: 7.95 },
  { code: 42, name: 'Tipaza', nameAr: 'تيبازة', latitude: 36.5833, longitude: 2.45 },
  { code: 43, name: 'Mila', nameAr: 'ميلة', latitude: 36.45, longitude: 6.2667 },
  { code: 44, name: 'Aïn Defla', nameAr: 'عين الدفلى', latitude: 36.25, longitude: 2.1167 },
  { code: 45, name: 'Naâma', nameAr: 'النعامة', latitude: 33.2667, longitude: 0.4833 },
  { code: 46, name: 'Aïn Témouchent', nameAr: 'عين تموشنت', latitude: 35.3, longitude: -1.1333 },
  { code: 47, name: 'Ghardaïa', nameAr: 'غرداية', latitude: 32.4833, longitude: 3.8167 },
  { code: 48, name: 'Relizane', nameAr: 'غليزان', latitude: 35.9, longitude: 0.55 },
  // Nouvelles wilayas créées en 2019
  { code: 49, name: 'Timimoun', nameAr: 'تيميمون', latitude: 29.2833, longitude: 0.2333 },
  { code: 50, name: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', latitude: 21.3333, longitude: 0.95 },
  { code: 51, name: 'Ouled Djellal', nameAr: 'أولاد جلال', latitude: 35.8167, longitude: 5.3 },
  { code: 52, name: 'Béni Abbès', nameAr: 'بي عباس', latitude: 30.1, longitude: -2.2 },
  { code: 53, name: 'In Salah', nameAr: 'إن صلاح', latitude: 27.2, longitude: 2.4667 },
  { code: 54, name: 'In Guezzam', nameAr: 'ان قزام', latitude: 23.0, longitude: 5.7667 },
  { code: 55, name: 'Touggourt', nameAr: 'تقرت', latitude: 33.1, longitude: 6.0667 },
  { code: 56, name: 'Djanet', nameAr: 'جانت', latitude: 24.65, longitude: 9.4833 },
  { code: 57, name: 'El M\'Ghair', nameAr: 'المغير', latitude: 33.4, longitude: 6.0 },
  { code: 58, name: 'El Meniaa', nameAr: 'المينية', latitude: 29.95, longitude: 2.85 },
];

// Catégories de produits B2B adaptées au marché algérien
const CATEGORIES: Category[] = [
  // Agriculture & Agroalimentaire
  { name: 'Agriculture & Équipement', slug: 'agriculture-equipment', description: 'Machines agricoles, engrais, semences, irrigation' },
  { name: 'Produits Alimentaires', slug: 'food-products', description: 'Conserves, épices, huiles, céréales', parentId: 'food-products' },
  { name: 'Fruits & Légumes', slug: 'fruits-vegetables', description: 'Frais, secs, transformés', parentId: 'food-products' },
  
  // Construction & BTP
  { name: 'Construction & BTP', slug: 'construction-btp', description: 'Matériaux de construction, outillage' },
  { name: 'Matériaux de Construction', slug: 'building-materials', description: 'Ciment, fer, bois, carrelage', parentId: 'construction-btp' },
  { name: 'Électricité & Plomberie', slug: 'electrical-plumbing', description: 'Câblage, sanitaires, climatisation', parentId: 'construction-btp' },
  
  // Industrie & Énergie
  { name: 'Industrie & Énergie', slug: 'industry-energy', description: 'Équipements industriels, énergies renouvelables' },
  { name: 'Machines Industrielles', slug: 'industrial-machinery', description: 'CNC, presses, convoyeurs', parentId: 'industry-energy' },
  { name: 'Énergie Solaire', slug: 'solar-energy', description: 'Panneaux, onduleurs, batteries', parentId: 'industry-energy' },
  
  // Technologies & Informatique
  { name: 'Technologies & Informatique', slug: 'technology-it', description: 'Matériel informatique, logiciels, réseaux' },
  { name: 'Matériel Informatique', slug: 'computer-hardware', description: 'PC, serveurs, périphériques', parentId: 'technology-it' },
  { name: 'Logiciels & Solutions', slug: 'software-solutions', description: 'ERP, CRM, solutions métier', parentId: 'technology-it' },
  
  // Textile & Habillement
  { name: 'Textile & Habillement', slug: 'textile-clothing', description: 'Tissus, vêtements, chaussures' },
  { name: 'Tissus & Matières Premières', slug: 'fabrics-materials', description: 'Coton, laine, synthétiques', parentId: 'textile-clothing' },
  
  // Chimie & Pharmacie
  { name: 'Chimie & Pharmacie', slug: 'chemistry-pharma', description: 'Produits chimiques, pharmaceutiques' },
  { name: 'Cosmétiques & Hygiène', slug: 'cosmetics-hygiene', description: 'Soins personnels, parfums', parentId: 'chemistry-pharma' },
  
  // Automobile & Pièces
  { name: 'Automobile & Pièces Détachées', slug: 'automotive-parts', description: 'Véhicules, pièces, accessoires' },
  { name: 'Pièces Détachées', slug: 'spare-parts', description: 'Moteurs, freins, suspensions', parentId: 'automotive-parts' },
  
  // Services
  { name: 'Services B2B', slug: 'b2b-services', description: 'Conseil, transport, logistique' },
  { name: 'Transport & Logistique', slug: 'transport-logistics', description: 'Fret, entreposage, distribution', parentId: 'b2b-services' },
];

// Utilisateur admin par défaut
const ADMIN_USERS: AdminUser[] = [
  {
    email: 'admin@algeriatrade.dz',
    name: 'Administrateur AlgeriaTrade',
    password: process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeMe123!',
    role: 'SUPER_ADMIN',
  },
];

// =============================================================================
// Fonctions utilitaires
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

async function seedWilayas() {
  log('Seeding wilayas algériennes...');
  
  const count = await prisma.wilaya.count();
  
  if (count > 0 && !FORCE_RESET) {
    log(`Found ${count} existing wilayas, skipping...`, 'warn');
    return;
  }
  
  if (count > 0 && FORCE_RESET) {
    await prisma.wilaya.deleteMany();
    log('Cleared existing wilayas', 'warn');
  }
  
  for (const wilaya of WILAYAS) {
    if (!DRY_RUN) {
      await prisma.wilaya.upsert({
        where: { code: wilaya.code },
        update: wilaya,
        create: wilaya,
      });
    }
  }
  
  log(`✓ Seeded ${WILAYAS.length} wilayas`, 'success');
}

async function seedCategories() {
  log('Seeding categories...');
  
  const count = await prisma.category.count();
  
  if (count > 0 && !FORCE_RESET) {
    log(`Found ${count} existing categories, skipping...`, 'warn');
    return;
  }
  
  if (count > 0 && FORCE_RESET) {
    await prisma.category.deleteMany();
    log('Cleared existing categories', 'warn');
  }
  
  // Créer les catégories sans parent_id d'abord
  const topLevelCategories = CATEGORIES.filter(c => !c.parentId);
  const childCategories = CATEGORIES.filter(c => c.parentId);
  
  // Map pour stocker les IDs créés
  const categoryMap = new Map<string, string>();
  
  for (const category of topLevelCategories) {
    if (!DRY_RUN) {
      const created = await prisma.category.create({
        data: {
          name: category.name,
          slug: category.slug,
          description: category.description,
        },
      });
      categoryMap.set(category.slug, created.id);
    } else {
      categoryMap.set(category.slug, `mock-id-${category.slug}`);
    }
  }
  
  // Créer les sous-catégories avec le bon parentId
  for (const category of childCategories) {
    if (!DRY_RUN) {
      const parentId = categoryMap.get(category.parentId!);
      if (parentId) {
        await prisma.category.create({
          data: {
            name: category.name,
            slug: category.slug,
            description: category.description,
            parentId: parentId,
          },
        });
      }
    }
  }
  
  log(`✓ Seeded ${CATEGORIES.length} categories`, 'success');
}

async function seedAdminUsers() {
  log('Seeding admin users...');
  
  for (const admin of ADMIN_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: admin.email },
    });
    
    if (existing) {
      log(`Admin user ${admin.email} already exists, updating...`, 'warn');
      
      if (!DRY_RUN) {
        await prisma.user.update({
          where: { email: admin.email },
          data: {
            name: admin.name,
            role: admin.role,
            emailVerified: true,
          },
        });
      }
    } else {
      const hashedPassword = await hash(admin.password, 12);
      
      if (!DRY_RUN) {
        await prisma.user.create({
          data: {
            email: admin.email,
            name: admin.name,
            password: hashedPassword,
            role: admin.role,
            emailVerified: true,
            isActive: true,
          },
        });
        
        log(`✓ Created admin user: ${admin.email}`, 'success');
      } else {
        log(`Would create admin user: ${admin.email}`, 'info');
      }
    }
  }
}

async function seedSystemSettings() {
  log('Seeding system settings...');
  
  const defaultSettings = [
    { key: 'site_name', value: 'AlgeriaTrade.dz', type: 'STRING' as const },
    { key: 'site_description', value: 'Plateforme B2B de commerce électronique pour le marché algérien', type: 'STRING' as const },
    { key: 'default_currency', value: 'DZD', type: 'STRING' as const },
    { key: 'default_language', value: 'fr', type: 'STRING' as const },
    { key: 'enable_registrations', value: 'true', type: 'BOOLEAN' as const },
    { key: 'require_email_verification', value: 'true', type: 'BOOLEAN' as const },
    { key: 'require_company_verification', value: 'true', type: 'BOOLEAN' as const },
    { key: 'max_product_images', value: '10', type: 'NUMBER' as const },
    { key: 'max_file_size_mb', value: '10', type: 'NUMBER' as const },
    { key: 'maintenance_mode', value: 'false', type: 'BOOLEAN' as const },
  ];
  
  for (const setting of defaultSettings) {
    if (!DRY_RUN) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      });
    }
  }
  
  log(`✓ Seeded ${defaultSettings.length} system settings`, 'success');
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║     🇩🇿 AlgeriaTrade.dz Production Seeder     ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  
  if (DRY_RUN) {
    log('🔍 DRY RUN MODE - No changes will be made\n', 'warn');
  }
  
  if (FORCE_RESET) {
    log('⚠️  FORCE RESET ENABLED - Existing data will be overwritten!\n', 'warn');
  }
  
  const startTime = Date.now();
  
  try {
    // Vérifier la connexion à la base de données
    await prisma.$connect();
    log('Connected to database ✓\n', 'success');
    
    // Exécuter les seeds dans l'ordre
    await seedWilayas();
    console.log('');
    
    await seedCategories();
    console.log('');
    
    await seedAdminUsers();
    console.log('');
    
    await seedSystemSettings();
    console.log('');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('╔══════════════════════════════════════════════╗');
    console.log(`║  ✅ Production seeding completed in ${duration}s     ║`);
    console.log('╚══════════════════════════════════════════════╝\n');
    
    if (DRY_RUN) {
      log('Run without --dry-run to apply changes.', 'info');
    }
    
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
