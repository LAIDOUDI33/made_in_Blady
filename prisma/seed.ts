import { PrismaClient, UserRole, VerificationStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Complete Algerian Wilayas (58 official + 11 proposed = 69)
// Data source: Official Algerian administrative data (2008 census)
const WILAYAS = [
  // ===== ORIGINAL 48 WILAYAS (1984-2019) =====
  { 
    code: "01", name: "Adrar", nameAr: "أدرار",
    numberOfDairas: 6, numberOfCommunes: 16, surfaceAreaKm2: 242942,
    population2008: 399714, density: 0.94, isNewWilaya: false, isProposed: false
  },
  { 
    code: "02", name: "Chlef", nameAr: "الشلف",
    numberOfDairas: 13, numberOfCommunes: 35, surfaceAreaKm2: 4795,
    population2008: 1002088, density: 209, isNewWilaya: false, isProposed: false
  },
  { 
    code: "03", name: "Laghouat", nameAr: "الأغواط",
    numberOfDairas: 5, numberOfCommunes: 12, surfaceAreaKm2: 18404,
    population2008: 273402, density: 15, isNewWilaya: false, isProposed: false
  },
  { 
    code: "04", name: "Oum El Bouaghi", nameAr: "أم البواقي",
    numberOfDairas: 12, numberOfCommunes: 29, surfaceAreaKm2: 7638,
    population2008: 621612, density: 81, isNewWilaya: false, isProposed: false
  },
  { 
    code: "05", name: "Batna", nameAr: "باتنة",
    numberOfDairas: 18, numberOfCommunes: 53, surfaceAreaKm2: 8681,
    population2008: 938075, density: 108, isNewWilaya: false, isProposed: false
  },
  { 
    code: "06", name: "Béjaïa", nameAr: "بجاية",
    numberOfDairas: 19, numberOfCommunes: 52, surfaceAreaKm2: 3268,
    population2008: 912577, density: 279, isNewWilaya: false, isProposed: false
  },
  { 
    code: "07", name: "Biskra", nameAr: "بسكرة",
    numberOfDairas: 7, numberOfCommunes: 22, surfaceAreaKm2: 19543,
    population2008: 678246, density: 35, isNewWilaya: false, isProposed: false
  },
  { 
    code: "08", name: "Béchar", nameAr: "بشار",
    numberOfDairas: 6, numberOfCommunes: 11, surfaceAreaKm2: 162200,
    population2008: 270061, density: 1.7, isNewWilaya: false, isProposed: false
  },
  { 
    code: "09", name: "Blida", nameAr: "البليدة",
    numberOfDairas: 10, numberOfCommunes: 25, surfaceAreaKm2: 1575,
    population2008: 1002937, density: 591, isNewWilaya: false, isProposed: false
  },
  { 
    code: "10", name: "Bouira", nameAr: "البويرة",
    numberOfDairas: 12, numberOfCommunes: 45, surfaceAreaKm2: 4439,
    population2008: 695583, density: 157, isNewWilaya: false, isProposed: false
  },
  { 
    code: "11", name: "Tamanrasset", nameAr: "تمنراست",
    numberOfDairas: 3, numberOfCommunes: 5, surfaceAreaKm2: 335563,
    population2008: 176637, density: 0.32, isNewWilaya: false, isProposed: false
  },
  { 
    code: "12", name: "Tébessa", nameAr: "تبسة",
    numberOfDairas: 10, numberOfCommunes: 24, surfaceAreaKm2: 9168,
    population2008: 550262, density: 60, isNewWilaya: false, isProposed: false
  },
  { 
    code: "13", name: "Tlemcen", nameAr: "تلمسان",
    numberOfDairas: 19, numberOfCommunes: 49, surfaceAreaKm2: 6131,
    population2008: 918521, density: 150, isNewWilaya: false, isProposed: false
  },
  { 
    code: "14", name: "Tiaret", nameAr: "تيارت",
    numberOfDairas: 11, numberOfCommunes: 36, surfaceAreaKm2: 20673,
    population2008: 846823, density: 41, isNewWilaya: false, isProposed: false
  },
  { 
    code: "15", name: "Tizi Ouzou", nameAr: "تيزي وزو",
    numberOfDairas: 21, numberOfCommunes: 67, surfaceAreaKm2: 2956,
    population2008: 1127608, density: 316, isNewWilaya: false, isProposed: false
  },
  { 
    code: "16", name: "Alger", nameAr: "الجزائر",
    numberOfDairas: 13, numberOfCommunes: 57, surfaceAreaKm2: 1190,
    population2008: 2988145, density: 2511, isNewWilaya: false, isProposed: false
  },
  { 
    code: "17", name: "Djelfa", nameAr: "الجلفة",
    numberOfDairas: 6, numberOfCommunes: 18, surfaceAreaKm2: 10461,
    population2008: 621077, density: 46, isNewWilaya: false, isProposed: false
  },
  { 
    code: "18", name: "Jijel", nameAr: "جيجل",
    numberOfDairas: 11, numberOfCommunes: 28, surfaceAreaKm2: 2577,
    population2008: 636948, density: 247, isNewWilaya: false, isProposed: false
  },
  { 
    code: "19", name: "Sétif", nameAr: "سطيف",
    numberOfDairas: 20, numberOfCommunes: 60, surfaceAreaKm2: 6504,
    population2008: 1489979, density: 229, isNewWilaya: false, isProposed: false
  },
  { 
    code: "20", name: "Saïda", nameAr: "سعيدة",
    numberOfDairas: 6, numberOfCommunes: 16, surfaceAreaKm2: 6764,
    population2008: 330641, density: 49, isNewWilaya: false, isProposed: false
  },
  { 
    code: "21", name: "Skikda", nameAr: "سكيكدة",
    numberOfDairas: 13, numberOfCommunes: 38, surfaceAreaKm2: 4026,
    population2008: 898680, density: 223, isNewWilaya: false, isProposed: false
  },
  { 
    code: "22", name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس",
    numberOfDairas: 15, numberOfCommunes: 52, surfaceAreaKm2: 9096,
    population2008: 604744, density: 66, isNewWilaya: false, isProposed: false
  },
  { 
    code: "23", name: "Annaba", nameAr: "عنابة",
    numberOfDairas: 6, numberOfCommunes: 12, surfaceAreaKm2: 1439,
    population2008: 609499, density: 424, isNewWilaya: false, isProposed: false
  },
  { 
    code: "24", name: "Guelma", nameAr: "قالمة",
    numberOfDairas: 10, numberOfCommunes: 34, surfaceAreaKm2: 4101,
    population2008: 482430, density: 118, isNewWilaya: false, isProposed: false
  },
  { 
    code: "25", name: "Constantine", nameAr: "قسنطينة",
    numberOfDairas: 7, numberOfCommunes: 12, surfaceAreaKm2: 2187,
    population2008: 938475, density: 427, isNewWilaya: false, isProposed: false
  },
  { 
    code: "26", name: "Médéa", nameAr: "المدية",
    numberOfDairas: 13, numberOfCommunes: 43, surfaceAreaKm2: 4142,
    population2008: 563012, density: 136, isNewWilaya: false, isProposed: false
  },
  { 
    code: "27", name: "Mostaganem", nameAr: "مستغانم",
    numberOfDairas: 10, numberOfCommunes: 32, surfaceAreaKm2: 2175,
    population2008: 737118, density: 325, isNewWilaya: false, isProposed: false
  },
  { 
    code: "28", name: "M'Sila", nameAr: "المسيلة",
    numberOfDairas: 7, numberOfCommunes: 24, surfaceAreaKm2: 18718,
    population2008: 574462, density: 30.69, isNewWilaya: false, isProposed: false
  },
  { 
    code: "29", name: "Mascara", nameAr: "معسكر",
    numberOfDairas: 16, numberOfCommunes: 47, surfaceAreaKm2: 5941,
    population2008: 784073, density: 132, isNewWilaya: false, isProposed: false
  },
  { 
    code: "30", name: "Ouargla", nameAr: "ورقلة",
    numberOfDairas: 5, numberOfCommunes: 8, surfaceAreaKm2: 145805,
    population2008: 558558, density: 2.6, isNewWilaya: false, isProposed: false
  },
  { 
    code: "31", name: "Oran", nameAr: "وهران",
    numberOfDairas: 9, numberOfCommunes: 26, surfaceAreaKm2: 2121,
    population2008: 1584607, density: 688, isNewWilaya: false, isProposed: false
  },
  { 
    code: "32", name: "El Bayadh", nameAr: "البيض",
    numberOfDairas: 5, numberOfCommunes: 15, surfaceAreaKm2: 42038,
    population2008: 185347, density: 4.40, isNewWilaya: false, isProposed: false
  },
  { 
    code: "33", name: "Illizi", nameAr: "إليزي",
    numberOfDairas: 4, numberOfCommunes: 4, surfaceAreaKm2: 198433,
    population2008: 52333, density: 0.18, isNewWilaya: false, isProposed: false
  },
  { 
    code: "34", name: "Bordj Bou Arreridj", nameAr: "برج بوعريريج",
    numberOfDairas: 10, numberOfCommunes: 34, surfaceAreaKm2: 4115,
    population2008: 628475, density: 160, isNewWilaya: false, isProposed: false
  },
  { 
    code: "35", name: "Boumerdès", nameAr: "بومرداس",
    numberOfDairas: 9, numberOfCommunes: 32, surfaceAreaKm2: 1356,
    population2008: 802083, density: 504, isNewWilaya: false, isProposed: false
  },
  { 
    code: "36", name: "El Tarf", nameAr: "الطارف",
    numberOfDairas: 7, numberOfCommunes: 24, surfaceAreaKm2: 3339,
    population2008: 408414, density: 122, isNewWilaya: false, isProposed: false
  },
  { 
    code: "37", name: "Tindouf", nameAr: "تندوف",
    numberOfDairas: 1, numberOfCommunes: 2, surfaceAreaKm2: 159000,
    population2008: 49149, density: 0.31, isNewWilaya: false, isProposed: false
  },
  { 
    code: "38", name: "Tissemsilt", nameAr: "تيسمسيلت",
    numberOfDairas: 8, numberOfCommunes: 22, surfaceAreaKm2: 3152,
    population2008: 294476, density: 93, isNewWilaya: false, isProposed: false
  },
  { 
    code: "39", name: "El Oued", nameAr: "الوادي",
    numberOfDairas: 10, numberOfCommunes: 22, surfaceAreaKm2: 54573,
    population2008: 647548, density: 12, isNewWilaya: false, isProposed: false
  },
  { 
    code: "40", name: "Khenchela", nameAr: "خنشلة",
    numberOfDairas: 8, numberOfCommunes: 21, surfaceAreaKm2: 9811,
    population2008: 386683, density: 40, isNewWilaya: false, isProposed: false
  },
  { 
    code: "41", name: "Souk Ahras", nameAr: "سوق أهراس",
    numberOfDairas: 10, numberOfCommunes: 26, surfaceAreaKm2: 4541,
    population2008: 438127, density: 95, isNewWilaya: false, isProposed: false
  },
  { 
    code: "42", name: "Tipaza", nameAr: "تيبازة",
    numberOfDairas: 10, numberOfCommunes: 28, surfaceAreaKm2: 1605,
    population2008: 591010, density: 273, isNewWilaya: false, isProposed: false
  },
  { 
    code: "43", name: "Mila", nameAr: "ميلة",
    numberOfDairas: 13, numberOfCommunes: 32, surfaceAreaKm2: 3407,
    population2008: 766886, density: 220, isNewWilaya: false, isProposed: false
  },
  { 
    code: "44", name: "Aïn Defla", nameAr: "عين الدفلى",
    numberOfDairas: 14, numberOfCommunes: 36, surfaceAreaKm2: 4891,
    population2008: 766013, density: 156, isNewWilaya: false, isProposed: false
  },
  { 
    code: "45", name: "Naâma", nameAr: "النعامة",
    numberOfDairas: 7, numberOfCommunes: 12, surfaceAreaKm2: 29950,
    population2008: 192891, density: 6.5, isNewWilaya: false, isProposed: false
  },
  { 
    code: "46", name: "Aïn Témouchent", nameAr: "عين تموشنت",
    numberOfDairas: 8, numberOfCommunes: 28, surfaceAreaKm2: 2379,
    population2008: 371239, density: 156, isNewWilaya: false, isProposed: false
  },
  { 
    code: "47", name: "Ghardaïa", nameAr: "غرداية",
    numberOfDairas: 8, numberOfCommunes: 10, surfaceAreaKm2: 86105,
    population2008: 363598, density: 4.2, isNewWilaya: false, isProposed: false
  },
  { 
    code: "48", name: "Relizane", nameAr: "غليزان",
    numberOfDairas: 13, numberOfCommunes: 38, surfaceAreaKm2: 4870,
    population2008: 726180, density: 152, isNewWilaya: false, isProposed: false
  },

  // ===== NEW WILAYAS CREATED IN 2019 (49-58) =====
  { 
    code: "49", name: "Timimoun", nameAr: "تيميمون",
    numberOfDairas: 4, numberOfCommunes: 10, surfaceAreaKm2: 65203,
    population2008: 122019, density: 1.87, isNewWilaya: true, isProposed: false
  },
  { 
    code: "50", name: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار",
    numberOfDairas: 1, numberOfCommunes: 2, surfaceAreaKm2: 120026,
    population2008: 16437, density: 0.13, isNewWilaya: true, isProposed: false
  },
  { 
    code: "51", name: "Ouled Djellal", nameAr: "أولاد جلال",
    numberOfDairas: 2, numberOfCommunes: 6, surfaceAreaKm2: 11410,
    population2008: 174219, density: 15.26, isNewWilaya: true, isProposed: false
  },
  { 
    code: "52", name: "Béni Abbès", nameAr: "بني عباس",
    numberOfDairas: 6, numberOfCommunes: 10, surfaceAreaKm2: 101350,
    population2008: 50163, density: 0.49, isNewWilaya: true, isProposed: false
  },
  { 
    code: "53", name: "In Salah", nameAr: "إن سلام",
    numberOfDairas: 2, numberOfCommunes: 3, surfaceAreaKm2: 134218,
    population2008: 50392, density: 0.38, isNewWilaya: true, isProposed: false
  },
  { 
    code: "54", name: "In Guezzam", nameAr: "إن قزام",
    numberOfDairas: 2, numberOfCommunes: 2, surfaceAreaKm2: 88126,
    population2008: 11202, density: 0.12, isNewWilaya: true, isProposed: false
  },
  { 
    code: "55", name: "Touggourt", nameAr: "تقرت",
    numberOfDairas: 5, numberOfCommunes: 13, surfaceAreaKm2: 17428,
    population2008: 247221, density: 14.18, isNewWilaya: true, isProposed: false
  },
  { 
    code: "56", name: "Djanet", nameAr: "جانيت",
    numberOfDairas: 1, numberOfCommunes: 2, surfaceAreaKm2: 86185,
    population2008: 17618, density: 0.2, isNewWilaya: true, isProposed: false
  },
  { 
    code: "57", name: "El M'Ghair", nameAr: "المغير",
    numberOfDairas: 2, numberOfCommunes: 8, surfaceAreaKm2: 8835,
    population2008: 162267, density: 18.36, isNewWilaya: true, isProposed: false
  },
  { 
    code: "58", name: "El Meniaa", nameAr: "المنيعة",
    numberOfDairas: 2, numberOfCommunes: 3, surfaceAreaKm2: 62215,
    population2008: 57276, density: 0.92, isNewWilaya: true, isProposed: false
  },

  // ===== PROPOSED NEW WILAYAS (59-69) - Administrative Reform Project =====
  { 
    code: "59", name: "Aflou", nameAr: "الأفلو",
    numberOfDairas: 5, numberOfCommunes: 12, surfaceAreaKm2: 6653,
    population2008: 182938, density: 27, isNewWilaya: true, isProposed: true
  },
  { 
    code: "60", name: "Barika", nameAr: "البريكة",
    numberOfDairas: 3, numberOfCommunes: 8, surfaceAreaKm2: 3511,
    population2008: 181716, density: 58, isNewWilaya: true, isProposed: true
  },
  { 
    code: "61", name: "El Kantara", nameAr: "القنطرة",
    numberOfDairas: 3, numberOfCommunes: 5, surfaceAreaKm2: 1443,
    population2008: 43110, density: 29, isNewWilaya: true, isProposed: true
  },
  { 
    code: "62", name: "Bir El Ater", nameAr: "بئر العاتر",
    numberOfDairas: 2, numberOfCommunes: 4, surfaceAreaKm2: 5059,
    population2008: 98441, density: 19.45, isNewWilaya: true, isProposed: true
  },
  { 
    code: "63", name: "El Aricha", nameAr: "العريشة",
    numberOfDairas: 2, numberOfCommunes: 4, surfaceAreaKm2: 2930,
    population2008: 30614, density: 10.44, isNewWilaya: true, isProposed: true
  },
  { 
    code: "64", name: "Ksar Chellala", nameAr: "قصر الشلالة",
    numberOfDairas: 3, numberOfCommunes: 6, surfaceAreaKm2: 0,
    population2008: null, density: null, isNewWilaya: true, isProposed: true
  },
  { 
    code: "65", name: "Aïn Ouessara", nameAr: "عين وسارة",
    numberOfDairas: 4, numberOfCommunes: 10, surfaceAreaKm2: 6265,
    population2008: 251038, density: 40, isNewWilaya: true, isProposed: true
  },
  { 
    code: "66", name: "Messaad", nameAr: "مسعد",
    numberOfDairas: 2, numberOfCommunes: 8, surfaceAreaKm2: 15530,
    population2008: 220069, density: 14.17, isNewWilaya: true, isProposed: true
  },
  { 
    code: "67", name: "Ksar El Boukhari", nameAr: "قصر البخاري",
    numberOfDairas: 6, numberOfCommunes: 21, surfaceAreaKm2: 4724,
    population2008: 256920, density: 54, isNewWilaya: true, isProposed: true
  },
  { 
    code: "68", name: "Bou Saâda", nameAr: "بو سعادة",
    numberOfDairas: 8, numberOfCommunes: 23, surfaceAreaKm2: 0,
    population2008: 416129, density: null, isNewWilaya: true, isProposed: true
  },
  { 
    code: "69", name: "El Abiodh Sidi Cheikh", nameAr: "الأبيض سيدي الشيخ",
    numberOfDairas: 3, numberOfCommunes: 7, surfaceAreaKm2: 36832,
    population2008: 43277, density: 1.17, isNewWilaya: true, isProposed: true
  }
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

  // 1. Seed Wilayas (69 total: 48 original + 10 new 2019 + 11 proposed)
  console.log(`📍 Seeding ${WILAYAS.length} Wilayas...`);
  for (const wilaya of WILAYAS) {
    await prisma.wilaya.upsert({
      where: { code: wilaya.code },
      update: {
        name: wilaya.name,
        nameAr: wilaya.nameAr,
        numberOfDairas: wilaya.numberOfDairas,
        numberOfCommunes: wilaya.numberOfCommunes,
        surfaceAreaKm2: wilaya.surfaceAreaKm2,
        population2008: wilaya.population2008,
        density: wilaya.density,
        isNewWilaya: wilaya.isNewWilaya,
        isProposed: wilaya.isProposed,
      },
      create: {
        code: wilaya.code,
        name: wilaya.name,
        nameAr: wilaya.nameAr,
        numberOfDairas: wilaya.numberOfDairas,
        numberOfCommunes: wilaya.numberOfCommunes,
        surfaceAreaKm2: wilaya.surfaceAreaKm2,
        population2008: wilaya.population2008,
        density: wilaya.density,
        isActive: true,
        isNewWilaya: wilaya.isNewWilaya,
        isProposed: wilaya.isProposed,
      }
    });
  }
  
  // Log summary
  const originalCount = WILAYAS.filter(w => !w.isNewWilaya).length;
  const newWilayas = WILAYAS.filter(w => w.isNewWilaya && !w.isProposed).length;
  const proposed = WILAYAS.filter(w => w.isProposed).length;
  console.log(`   ✓ ${originalCount} original wilayas (1984)`);
  console.log(`   ✓ ${newWilayas} new wilayas (2019)`);
  if (proposed > 0) {
    console.log(`   ✓ ${proposed} proposed wilayas`);
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
