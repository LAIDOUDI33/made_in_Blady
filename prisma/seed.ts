import { PrismaClient, UserRole, VerificationStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// 58 Algerian Wilayas
const WILAYAS = [
  { code: "01", name: "Adrar", nameAr: "أدرار" },
  { code: "02", name: "Chlef", nameAr: "الشلف" },
  { code: "03", name: "Laghouat", nameAr: "الأغواط" },
  { code: "04", name: "Oum El Bouaghi", nameAr: "أم البواقي" },
  { code: "05", name: "Batna", nameAr: "باتنة" },
  { code: "06", name: "Béjaïa", nameAr: "بجاية" },
  { code: "07", name: "Biskra", nameAr: "بسكرة" },
  { code: "08", name: "Béchar", nameAr: "بشار" },
  { code: "09", name: "Blida", nameAr: "البليدة" },
  { code: "10", name: "Bouira", nameAr: "البويرة" },
  { code: "11", name: "Tamanrasset", nameAr: "تمنراست" },
  { code: "12", name: "Tébessa", nameAr: "تبسة" },
  { code: "13", name: "Tlemcen", nameAr: "تلمسان" },
  { code: "14", name: "Tiaret", nameAr: "تيارت" },
  { code: "15", name: "Tizi Ouzou", nameAr: "تيزي وزو" },
  { code: "16", name: "Alger", nameAr: "الجزائر" },
  { code: "17", name: "Djelfa", nameAr: "الجلفة" },
  { code: "18", name: "Jijel", nameAr: "جيجل" },
  { code: "19", name: "Sétif", nameAr: "سطيف" },
  { code: "20", name: "Saïda", nameAr: "سعيدة" },
  { code: "21", name: "Skikda", nameAr: "سكيكدة" },
  { code: "22", name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس" },
  { code: "23", name: "Annaba", nameAr: "عنابة" },
  { code: "24", name: "Guelma", nameAr: "قالة" },
  { code: "25", name: "Constantine", nameAr: "قسنطينة" },
  { code: "26", name: "Médéa", nameAr: "المدية" },
  { code: "27", name: "Mostaganem", nameAr: "مستغانم" },
  { code: "28", name: "M'Sila", nameAr: "المسيلة" },
  { code: "29", name: "Mascara", nameAr: "معسكر" },
  { code: "30", name: "Ouargla", nameAr: "ورقلة" },
  { code: "31", name: "Oran", nameAr: "وهران" },
  { code: "32", name: "El Bayadh", nameAr: " البيض" },
  { code: "33", name: "Illizi", nameAr: "إليزي" },
  { code: "34", name: "Bordj Bou Arréridj", nameAr: "برج بوعريريج" },
  { code: "35", name: "Boumerdès", nameAr: "بومرداس" },
  { code: "36", name: "El Tarf", nameAr: "الطارف" },
  { code: "37", name: "Tindouf", nameAr: "تندوف" },
  { code: "38", name: "Tissemsilt", nameAr: "تيسمسيلت" },
  { code: "39", name: "El Oued", nameAr: "الوادي" },
  { code: "40", name: "Khenchela", nameAr: "خنشلة" },
  { code: "41", name: "Souk Ahras", nameAr: "سوق أهراس" },
  { code: "42", name: "Tipaza", nameAr: "تيبازة" },
  { code: "43", name: "Mila", nameAr: "ميلة" },
  { code: "44", name: "Aïn Defla", nameAr: "عين الدفلى" },
  { code: "45", name: "Naâma", nameAr: "النعامة" },
  { code: "46", name: "Aïn Témouchent", nameAr: "عين تموشنت" },
  { code: "47", name: "Ghardaïa", nameAr: "غداية" },
  { code: "48", name: "Relizane", nameAr: "غليزان" },
  { code: "49", name: "El M'Ghair", nameAr: "المغير" },
  { code: "50", name: "El Meniaa", nameAr: "المنيعة" },
  { code: "51", name: "Ouled Djellal", nameAr: "أولاد جلال" },
  { code: "52", name: "Bordj Baji Mokhtar", nameAr: "برج باجي مختار" },
  { code: "53", name: "Béni Abbès", nameAr: "بنى عباس" },
  { code: "54", name: "Timimoun", nameAr: "تيميمون" },
  { code: "55", name: "Touggourt", nameAr: "تقرت" },
  { code: "56", name: "Djanet", nameAr: "جانيت" },
  { code: "57", name: "In Salah", nameAr: "إن سلام" },
  { code: "58", name: "In Guezzam", nameAr: "إن قزام" }
];

// Product Categories for Algerian Market
const CATEGORIES = [
  // Agriculture & Food
  { name: "Agriculture & Alimentation", slug: "agriculture-alimentation", icon: "🌾", description: "Machines agricoles, engrais, produits alimentaires algériens", subcategories: [
    { name: "Machines Agricoles", slug: "machines-agricoles" },
    { name: "Produits Alimentaires", slug: "produits-alimentaires" },
    { name: "Engrais & Pesticides", slug: "engrais-pesticides" },
    { name: "Irrigation", slug: "irrigation" }
  ]},
  // Construction
  { name: "Construction & BTP", slug: "construction-btp", icon: "🏗️", description: "Ciment, acier, matériaux de construction pour projets immobiliers", subcategories: [
    { name: "Ciment & Matériaux", slug: "ciment-materiaux" },
    { name: "Acier & Fer", slug: "acier-fer" },
    { name: "Peinture & Enduit", slug: "peinture-enduit" },
    { name: "Plomberie & Sanitaire", slug: "plomberie-sanitaire" }
  ]},
  // Industrial Equipment
  { name: "Équipement Industriel", slug: "equipement-industriel", icon: "⚙️", description: "Machines CNC, compresseurs, pompes industrielles", subcategories: [
    { name: "Machines CNC", slug: "machines-cnc" },
    { name: "Compresseurs", slug: "compresseurs" },
    { name: "Pompes Industrielles", slug: "pompes-industrielles" },
    { name: "Engrenages & Transmission", slug: "engrenages-transmission" }
  ]},
  // Solar Energy
  { name: "Énergie Solaire", slug: "energie-solaire", icon: "☀️", description: "Panneaux solaires, onduleurs, batteries pour énergie renouvelable", subcategories: [
    { name: "Panneaux Solaires", slug: "panneaux-solaires" },
    { name: "Onduleurs", slug: "onduleurs" },
    { name: "Batteries Solaire", slug: "batteries-solaire" },
    { name: "Éclairage LED", slug: "eclairage-led" }
  ]},
  // ICT & Telecom
  { name: "ICT & Télécoms", slug: "ict-telecoms", icon: "💻", description: "Réseaux, serveurs, fibre optique, équipements télécoms", subcategories: [
    { name: "Réseau & Connectique", slug: "reseau-connectique" },
    { name: "Serveurs & Stockage", slug: "serveurs-stockage" },
    { name: "Fibre Optique", slug: "fibre-optique" },
    { name: "Sécurité Informatique", slug: "securite-informatique" }
  ]},
  // Automotive
  { name: "Automobile", slug: "automobile", icon: "🚗", description: "Véhicules, pièces détachées, pneus et accessoires auto", subcategories: [
    { name: "Pièces Détachées", slug: "pieces-detachees" },
    { name: "Pneus", slug: "pneus" },
    { name: "Lubrifiants", slug: "lubrifiants" },
    { name: "Accessoires Auto", slug: "accessoires-auto" }
  ]},
  // Textiles
  { name: "Textiles & Habillement", slug: "textiles-habillement", icon: "👕", description: "Tissus, vêtements de travail, EPI pour l'industrie", subcategories: [
    { name: "Tissus", slug: "tissus" },
    { name: "Vêtements Travail", slug: "vetements-travail" },
    { name: "EPI", slug: "epi" },
    { name: "Chaussures Sécurité", slug: "chaussures-securite" }
  ]},
  // Chemicals
  { name: "Produits Chimiques", slug: "produits-chimiques", icon: "🧪", description: "Peintures industrielles, plastiques, produits chimiques de base", subcategories: [
    { name: "Peintures Industrielles", slug: "peintures-industrielles" },
    { name: "Plastiques", slug: "plastiques" },
    { name: "Solvants", slug: "solvants" },
    { name: "Produits de Nettoyage", slug: "produits-nettoyage" }
  ]}
];

// Sample Companies (Suppliers)
const COMPANIES = [
  {
    name: "Groupe Industriel Algérien (GIA)",
    slug: "groupe-industriel-algerien-gia",
    legalForm: "SPA",
    rcNumber: "16/00-1234567/16",
    nif: "001612345678912",
    nis: "1123456789",
    wilaya: "Alger",
    commune: "Alger Centre",
    address: "123 Rue des Frères Zian, Alger Centre",
    contactEmail: "contact@gia.dz",
    contactPhone: "+213551234567",
    yearEstablished: 2005,
    employeeCount: 250,
    productionCapacity: "1000 unités/mois",
    exportCapability: true,
    description: "Leader algérien en équipement industriel"
  },
  {
    name: "SolarTech Algeria",
    slug: "solartech-algeria",
    legalForm: "SARL",
    rcNumber: "16/00-2345678/16",
    nif: "001623456789012",
    nis: "2234567890",
    wilaya: "Oran",
    commune: "Bir Mourad Raïs",
    address: "45 Zone Industrielle, Oran",
    contactEmail: "info@solartech.dz",
    contactPhone: "+213552345678",
    yearEstablished: 2015,
    employeeCount: 85,
    productionCapacity: "500 systèmes/mois",
    exportCapability: false,
    description: "Spécialiste panneaux solaires et énergie renouvelable"
  },
  {
    name: "AgriTech Solutions",
    slug: "agritech-solutions",
    legalForm: "EURL",
    rcNumber: "32/00-3456789/32",
    nif: "003234567890123",
    nis: "3345678901",
    wilaya: "Sidi Bel Abbès",
    commune: "Sidi Bel Abbès",
    address: "78 Route de Mascara, Sidi Bel Abbès",
    contactEmail: "contact@agritech.dz",
    contactPhone: "+213553456789",
    yearEstablished: 2018,
    employeeCount: 45,
    productionCapacity: "200 machines/mois",
    exportCapability: true,
    description: "Solutions technologiques pour l'agriculture moderne"
  },
  {
    name: "CableAlger",
    slug: "cablealger",
    legalForm: "SPA",
    rcNumber: "16/00-4567890/16",
    nif: "001645678901234",
    nis: "1456789012",
    wilaya: "Oran",
    commune: "Arzew",
    address: "Zone Industrielle Arzew, Oran",
    contactEmail: "ventes@cablealger.dz",
    contactPhone: "+213554567890",
    yearEstablished: 2010,
    employeeCount: 150,
    productionCapacity: "5000m câble/jour",
    exportCapability: true,
    description: "Fabricant de câbles électriques et télécoms"
  },
  {
    name: "HydroEquip Algérie",
    slug: "hydroequip-algerie",
    legalForm: "SARL",
    rcNumber: "19/00-5678901/19",
    nif: "001956789012345",
    nis: "2567890123",
    wilaya: "Sétif",
    commune: "Sétif",
    address: "Zone Industrielle Ain Oulmene, Sétif",
    contactEmail: "info@hydroequip.dz",
    contactPhone: "+213555678901",
    yearEstablished: 2012,
    employeeCount: 65,
    productionCapacity: "300 pompes/mois",
    exportCapability: false,
    description: "Pompes et équipements hydrauliques industriels"
  },
  {
    name: "MetalPro",
    slug: "metalpro",
    legalForm: "SNC",
    rcNumber: "25/00-6789012/25",
    nif: "002567890123456",
    nis: "3678901234",
    wilaya: "Constantine",
    commune: "Constantine",
    address: "Zone Industrielle Hamma Bouziane, Constantine",
    contactEmail: "commercial@metalpro.dz",
    contactPhone: "+213556789012",
    yearEstablished: 2008,
    employeeCount: 120,
    productionCapacity: "500 tonnes/mois",
    exportCapability: true,
    description: "Spécialiste acier et métaux pour construction"
  }
];

// Sample Products
const PRODUCTS = [
  {
    name: "Panneau Solaire Monocristallin 550W",
    slug: "panneau-solaire-monocristallin-550w",
    shortDescription: "Panneau solaire haute efficacité pour installations résidentielles et industrielles",
    description: "Panneau solaire monocristallin de dernière génération avec rendement supérieur à 22%. Garantie 25 ans, résistant aux conditions climatiques algériennes extrêmes. Certifié CE et conforme aux normes internationales.",
    priceRangeMin: 45000,
    priceRangeMax: 55000,
    currency: "DZD",
    negotiablePrice: true,
    moq: 10,
    unit: "unités",
    availability: "in_stock",
    leadTime: "2-3 semaines",
    countryOfOrigin: "Algérie",
    categorySlug: "panneaux-solares",
    companySlug: "solartech-algeria"
  },
  {
    name: "Câble Industriel Cuivre 16mm²",
    slug: "cable-industriel-cuivre-16mm2",
    shortDescription: "Câble électrique cuivre pour installations industrielles",
    description: "Câble électrique en cuivre pur de haute conductivité. Isolation PVC résistant au feu et aux UV. Conforme aux normes IEC et algériennes. Idéal pour installations industrielles et chantiers.",
    price: 850,
    currency: "DZD",
    negotiablePrice: false,
    moq: 100,
    unit: "mètres",
    availability: "in_stock",
    leadTime: "5-7 jours",
    countryOfOrigin: "Algérie",
    categorySlug: "reseau-connectique",
    companySlug: "cablealger"
  },
  {
    name: "Pompe Submersible pour Irrigation 5HP",
    slug: "pompe-submersible-irrigation-5hp",
    shortDescription: "Pompe submersible haute performance pour irrigation agricole",
    description: "Pompe submersible conçue spécialement pour l'irrigation agricole en Algérie. Corps en inox 316, moteur immergé refroidi par huile. Faible consommation énergétique, durée de vie supérieure à 10 ans.",
    price: 125000,
    currency: "DZD",
    negotiablePrice: true,
    moq: 1,
    unit: "unité",
    availability: "in_stock",
    leadTime: "1-2 semaines",
    countryOfOrigin: "Algérie",
    categorySlug: "pompes-industrielles",
    companySlug: "hydroequip-algerie"
  },
  {
    name: "Acier de Construction Fe500 Ø12mm",
    slug: "acier-construction-fe500-12mm",
    shortDescription: "Barre d'acier HA Fe500 pour béton armé",
    description: "Barre d'acier à haute adhérence Fe500 conform à la norme NA 16002. Produit par laminage à chaud, excellente ductilité. Utilisé dans tous les grands projets de construction en Algérie.",
    priceRangeMin: 285000,
    priceRangeMax: 295000,
    currency: "DZD",
    negotiablePrice: false,
    moq: 5000,
    unit: "kg",
    availability: "in_stock",
    leadTime: "3-5 jours",
    countryOfOrigin: "Algérie",
    categorySlug: "acier-fer",
    companySlug: "metalpro"
  },
  {
    name: "Machine CNC 3 Axes 1040",
    slug: "machine-cnc-3-axes-1040",
    shortDescription: "Tour CNC compact pour usinage précision",
    description: "Machine CNC 3 axes avec table 1000x400mm. Système de contrôle DSP, precision ±0.05mm. Idéal pour la fabrication de pièces métalliques, bois, plastique. Formation incluse.",
    priceRangeMin: 2500000,
    priceRangeMax: 3500000,
    currency: "DZD",
    negotiablePrice: true,
    moq: 1,
    unit: "unité",
    availability: "pre_order",
    leadTime: "8-12 semaines",
    countryOfOrigin: "Chine",
    categorySlug: "machines-cnc",
    companySlug: "groupe-industriel-algerien-gia"
  },
  {
    name: "Onduleur Hybride 5kW MPPT",
    slug: "onduleur-hybride-5kw-mppt",
    shortDescription: "Onduleur solaire hybride avec régulateur MPPT intégré",
    description: "Onduleur hybride 5kW avec MPPT intégré, compatible batteries lithium. Écran tactile LCD, monitoring WiFi. Fonction backup intégrée. Garantie 5 ans, SAV en Algérie.",
    price: 180000,
    currency: "DZD",
    negotiablePrice: true,
    moq: 1,
    unit: "unité",
    availability: "in_stock",
    leadTime: "1 semaine",
    countryOfOrigin: "Europe",
    categorySlug: "onduleurs",
    companySlug: "solartech-algeria"
  },
  {
    name: "Système d'Irrigation Goutte à Goutte",
    slug: "systeme-irrigation-goutte-goutte",
    shortDescription: "Kit d'irrigation goutte à goutte complet pour 1 hectare",
    description: "Système d'irrigation goutte à goutte complet comprenant: tuyaux PEHD 16mm, goutteurs autoregulants, filtres disque, manomètres, vannes. Couverture 1 hectare, installation facile.",
    priceRangeMin: 150000,
    priceRangeMax: 200000,
    currency: "DZD",
    negotiablePrice: true,
    moq: 5,
    unit: "kits",
    availability: "in_stock",
    leadTime: "1-2 semaines",
    countryOfOrigin: "Algérie",
    categorySlug: "irrigation",
    companySlug: "agritech-solutions"
  },
  {
    name: "Vêtement de Travail Haute Visibilité",
    slug: "vetement-travail-haute-visibilite",
    shortDescription: "Combinaison de travail haute visibilité EN ISO 20471",
    description: "Combinaison de travail haute visibilité classe 3, tissu polycoton 245g/m². Bandes réfléchissantes certifiées. Multiples poches, renforts coudes/genoux. Lavable industrielle.",
    price: 4500,
    currency: "DZD",
    negotiablePrice: false,
    moq: 50,
    unit: "unités",
    availability: "in_stock",
    leadTime: "5-10 jours",
    countryOfOrigin: "Algérie",
    categorySlug: "vetements-travail",
    companySlug: "groupe-industriel-algerien-gia"
  }
];

async function main() {
  console.log('🌱 Seeding AlgeriaTrade database...\n');

  // 1. Seed Wilayas
  console.log('📍 Seeding 58 Wilayas...');
  for (const wilaya of WILAYAS) {
    await prisma.wilaya.upsert({
      where: { code: wilaya.code },
      update: {},
      create: wilaya
    });
  }

  // 2. Seed Categories
  console.log('📂 Seeding Categories...');
  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        sortOrder: CATEGORIES.indexOf(cat)
      }
    });

    // Subcategories
    if (cat.subcategories && cat.subcategories.length > 0) {
      for (const sub of cat.subcategories) {
        await prisma.category.upsert({
          where: { slug: sub.slug },
          update: {},
          create: {
            name: sub.name,
            slug: sub.slug,
            parentId: category.id,
            sortOrder: cat.subcategories.indexOf(sub)
          }
        });
      }
    }
  }

  // 3. Create Admin User
  console.log('👤 Creating admin user...');
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@algeriatrade.dz' },
    update: {},
    create: {
      email: 'admin@algeriatrade.dz',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'AlgeriaTrade',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      emailVerified: true
    }
  });

  // 4. Create Sample Suppliers with Companies
  console.log('🏭 Creating supplier accounts...');
  for (const comp of COMPANIES) {
    const supplierPassword = await hash('supplier123', 12);
    const email = `contact@${comp.slug.replace('-', '')}.dz`;
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: supplierPassword,
        firstName: comp.name.split(' ')[0],
        lastName: comp.name.includes(' ') ? comp.name.split(' ').slice(1).join(' ') : '',
        phone: comp.contactPhone,
        role: UserRole.SUPPLIER,
        isActive: true,
        emailVerified: true
      }
    });

    await prisma.company.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        ...comp,
        userId: user.id,
        verificationStatus: Math.random() > 0.3 ? VerificationStatus.VERIFIED : VerificationStatus.PENDING,
        isVerified: Math.random() > 0.3,
        rating: parseFloat((4 + Math.random()).toFixed(1)),
        responseRate: parseFloat((80 + Math.random() * 20).toFixed(0))
      }
    });
  }

  // 5. Create Buyer Account
  console.log('🛒 Creating buyer account...');
  const buyerPassword = await hash('buyer123', 12);
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@entreprise.dz' },
    update: {},
    create: {
      email: 'buyer@entreprise.dz',
      password: buyerPassword,
      firstName: 'Ahmed',
      lastName: 'Benali',
      phone: '+213661234567',
      role: UserRole.BUYER,
      isActive: true,
      emailVerified: true
    }
  });

  // 6. Create Products
  console.log('📦 Creating products...');
  for (const prod of PRODUCTS) {
    const company = await prisma.company.findUnique({ where: { slug: prod.companySlug } });
    const category = await prisma.category.findFirst({ 
      where: { slug: prod.categorySlug } 
    }) || await prisma.category.findFirst();

    if (company && category) {
      const product = await prisma.product.upsert({
        where: { slug: prod.slug },
        update: {},
        create: {
          name: prod.name,
          slug: prod.slug,
          shortDescription: prod.shortDescription,
          description: prod.description,
          price: prod.price,
          priceRangeMin: prod.priceRangeMin,
          priceRangeMax: prod.priceRangeMax,
          currency: prod.currency,
          negotiablePrice: prod.negotiablePrice,
          moq: prod.moq,
          unit: prod.unit,
          availability: prod.availability,
          leadTime: prod.leadTime,
          countryOfOrigin: prod.countryOfOrigin,
          companyId: company.id,
          categoryId: category.id,
          status: 'published',
          isFeatured: Math.random() > 0.5,
          viewCount: Math.floor(Math.random() * 1000)
        }
      });

      // Add product image (check if exists first)
      const existingImage = await prisma.productImage.findFirst({
        where: { productId: product.id, isPrimary: true }
      });
      if (!existingImage) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: `https://images.unsplash.com/photo-1509391366600-2e10622a1a11?w=400&h=300&fit=crop`,
            alt: prod.name,
            isPrimary: true
          }
        });
      }
    }
  }

  console.log('\n✅ Seed completed successfully!');
  console.log('\n🔑 Test Accounts:');
  console.log('   Admin: admin@algeriatrade.dz / admin123');
  console.log('   Buyer: buyer@entreprise.dz / buyer123');
  console.log('   Supplier: contact@[company].dz / supplier123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
