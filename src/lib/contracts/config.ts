// Contract Engine Configuration
// إعدادات محرك العقود
// Configuration du moteur de contrats

import type { ContractType, ContractLanguage, ContractClause } from '../contracts';

// ============================================
// SUPPORTED LANGUAGES
// ============================================

export const SUPPORTED_LANGUAGES: ContractLanguage[] = ['AR', 'FR', 'BILINGUAL'];

export const LANGUAGE_LABELS = {
  AR: { label: 'العربية', labelAr: 'العربية', labelFr: 'Arabe' },
  FR: { label: 'Français', labelAr: 'الفرنسية', labelFr: 'Français' },
  BILINGUAL: { label: 'Bilingual / ثنائي اللغة', labelAr: 'ثنائي اللغة', labelFr: 'Bilingue' },
};

// ============================================
// CONTRACT TYPES CONFIGURATION
// ============================================

export interface ContractTypeConfig {
  type: ContractType;
  name: string;
  nameAr: string;
  nameFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  icon: string;
  category: 'SALES' | 'PARTNERSHIP' | 'PROTECTION' | 'SERVICE';
  requiresOrder: boolean;
  defaultDurationDays: number;
}

export const CONTRACT_TYPES: Record<ContractType, ContractTypeConfig> = {
  SALES_AGREEMENT: {
    type: 'SALES_AGREEMENT',
    name: 'Sales Agreement',
    nameAr: 'اتفاقية البيع',
    nameFr: 'Contrat de vente',
    description: 'Standard sales agreement for product transactions between buyer and seller',
    descriptionAr: 'اتفاقية بيع قياسية للمعاملات التجارية بين المشتري والبائع',
    descriptionFr: "Contrat de vente standard pour les transactions commerciales entre acheteur et vendeur",
    icon: 'FileText',
    category: 'SALES',
    requiresOrder: true,
    defaultDurationDays: 365,
  },
  SUPPLY_CONTRACT: {
    type: 'SUPPLY_CONTRACT',
    name: 'Supply Contract / Purchase Order',
    nameAr: 'عقد التوريد / أمر الشراء',
    nameFr: 'Contrat de fourniture / Bon de commande',
    description: 'Purchase order and supply agreement for recurring orders',
    descriptionAr: 'أمر شراء واتفاقية توريد للطلبات المتكررة',
    descriptionFr: 'Bon de commande et accord de fourniture pour les commandes récurrentes',
    icon: 'Package',
    category: 'SALES',
    requiresOrder: true,
    defaultDurationDays: 180,
  },
  SERVICE_AGREEMENT: {
    type: 'SERVICE_AGREEMENT',
    name: 'Service Agreement',
    nameAr: 'اتفاقية الخدمات',
    nameFr: 'Contrat de prestation de services',
    description: 'Contract for service provision with deliverables and milestones',
    descriptionAr: 'عقد لتقديم الخدمات مع المخرجات والمراحل',
    descriptionFr: 'Contrat pour la prestation de services avec livrables et jalons',
    icon: 'Wrench',
    category: 'SERVICE',
    requiresOrder: false,
    defaultDurationDays: 365,
  },
  DISTRIBUTION_AGREEMENT: {
    type: 'DISTRIBUTION_AGREEMENT',
    name: 'Distribution Agreement',
    nameAr: 'اتفاقية التوزيع',
    nameFr: 'Contrat de distribution',
    description: 'Exclusive or non-exclusive distribution rights agreement',
    descriptionAr: 'اتفاقية حقوق التوزيع الحصرية أو غير الحصرية',
    descriptionFr: "Accord de droits d'exclusivité ou non-exclusivité de distribution",
    icon: 'Truck',
    category: 'PARTNERSHIP',
    requiresOrder: false,
    defaultDurationDays: 730,
  },
  NON_DISCLOSURE: {
    type: 'NON_DISCLOSURE',
    name: 'Non-Disclosure Agreement (NDA)',
    nameAr: 'اتفاقية عدم الإفصاح',
    nameFr: 'Accord de confidentialité (NDA)',
    description: 'Confidentiality agreement to protect sensitive business information',
    descriptionAr: 'اتفاقية سرية لحماية المعلومات التجارية الحساسة',
    descriptionFr: "Accord de confidentialité pour protéger les informations commerciales sensibles",
    icon: 'Shield',
    category: 'PROTECTION',
    requiresOrder: false,
    defaultDurationDays: 1095,
  },
  EXCLUSIVITY: {
    type: 'EXCLUSIVITY',
    name: 'Exclusivity Agreement',
    nameAr: 'اتفاقية الحصرية',
    nameFr: "Clause d'exclusivité",
    description: 'Grant exclusive rights for products, territories, or customer segments',
    descriptionAr: 'منح حقوق حصرية للمنتجات أو المناطق أو شرائح العملاء',
    descriptionFr: "Accorder des droits exclusifs pour les produits, territoires ou segments clients",
    icon: 'Lock',
    category: 'PARTNERSHIP',
    requiresOrder: false,
    defaultDurationDays: 730,
  },
  FRAMEWORK_AGREEMENT: {
    type: 'FRAMEWORK_AGREEMENT',
    name: 'Framework Agreement / Partnership',
    nameAr: 'اتفاقية إطار / شراكة',
    nameFr: "Accord-cadre / Partenariat",
    description: 'Long-term partnership or joint venture framework agreement',
    descriptionAr: 'اتفاقية إطار شراكة طويلة الأجل أو مشروع مشترك',
    descriptionFr: "Accord-cadre de partenariat ou coentreprise à long terme",
    icon: 'Handshake',
    category: 'PARTNERSHIP',
    requiresOrder: false,
    defaultDurationDays: 1825,
  },
};

// ============================================
// ALGERIAN COMMERCIAL LAW REFERENCES
// ============================================

export const ALGERIAN_LAW_REFERENCES = {
  // Code de Commerce Algérien
  COMMERCIAL_CODE: {
    reference: 'Ordonnance n° 75-59 du 26 septembre 1975',
    referenceAr: 'الأمر رقم 75-59 المؤرخ في 26 سبتمبر 1975',
    referenceFr: 'Ordonnance n° 75-59 du 26 septembre 1975',
    description: 'Algerian Commercial Code governing commercial activities',
    descriptionAr: 'القانون التجاري الجزائري المنشط للأنشطة التجارية',
    descriptionFr: 'Code de commerce algérien régissant les activités commerciales',
  },
  CIVIL_CODE: {
    reference: 'Ordonnance n° 70-05 du 25 janvier 1970',
    referenceAr: 'الأمر رقم 70-05 المؤرخ في 25 يناير 1970',
    referenceFr: 'Ordonnance n° 70-05 du 25 janvier 1970',
    description: 'Civil Code provisions applicable to contracts',
    descriptionAr: 'أحكام القانون المدني المطبقة على العقود',
    descriptionFr: 'Dispositions du code civil applicables aux contrats',
  },
  CONSUMER_PROTECTION: {
    reference: 'Loi n° 09-03 du 25 février 2009',
    referenceAr: 'القانون رقم 09-03 المؤرخ في 25 فبراير 2009',
    referenceFr: 'Loi n° 09-03 du 25 février 2009',
    description: 'Consumer Protection Law',
    descriptionAr: 'قانون حماية المستهلك',
    descriptionFr: 'Loi relative à la protection du consommateur',
  },
  ELECTRONIC_SIGNATURE: {
    reference: 'Loi n° 10-11 du 29 juin 2010',
    referenceAr: 'القانون رقم 10-11 المؤرخ في 29 يونيو 2010',
    referenceFr: 'Loi n° 10-11 du 29 juin 2010',
    description: 'Electronic Signature and Electronic Commerce Law',
    descriptionAr: 'قانون التوقيع الإلكتروني والتجارة الإلكترونية',
    descriptionFr: 'Loi relative à la signature électronique et au commerce électronique',
  },
};

// ============================================
// COMPANY LEGAL INFO PLACEHOLDERS
// ============================================

export interface CompanyLegalInfo {
  companyName: string;
  legalForm: string; // SARL, EURL, SPA, SNC
  commercialRegister: string; // NRC - Numéro au Registre de Commerce
  taxId: string; // NIF - Numéro d'Identification Fiscale
  statisticalId: string; // NIS - Numéro d'Identification Statistique
  address: string;
  wilaya: string;
  representativeName: string;
  representativeTitle: string;
  phone: string;
  email: string;
  bankAccount?: string;
  bankName?: string;
}

export const LEGAL_FORMS = [
  { value: 'SARL', label: 'SARL', labelAr: 'ذ.م.م', labelFr: 'SARL (Société à Responsabilité Limitée)' },
  { value: 'EURL', label: 'EURL', labelAr: 'ذ.م.م.و', labelFr: 'EURL (Entreprise Unipersonnelle à Responsabilité Limitée)' },
  { value: 'SPA', label: 'SPA', labelAr: 'ش.ذ.م.م', labelFr: 'SPA (Société par Actions)' },
  { value: 'SNC', label: 'SNC', labelAr: 'ش.تضامن', labelFr: 'SNC (Société en Nom Collectif)' },
  { value: 'SCS', label: 'SCS', labelAr: 'ش.توصية', labelFr: 'SCS (Société en Commandite Simple)' },
];

export const WILAYAS = [
  'Adrar', 'Chlef', Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar', 'Blida', 'Bouira',
  'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda',
  'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médea', 'Mostaganem', M\'Sila, 'Mascara',
  'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt',
  'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa',
  'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal', 'Béni Abbès', 'In Salah', 'In Guezzam',
  'Touggourt', 'Djanet', 'El M\'Ghair', 'El Meniaa'
];

// ============================================
// STANDARD CLAUSES LIBRARY (Algerian Law Compliant)
// ============================================

export interface ClauseCategory {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  clauses: ContractClause[];
}

export const CLAUSE_CATEGORIES: ClauseCategory[] = [
  {
    id: 'parties',
    name: 'Parties Identification',
    nameAr: 'تحديد الأطراف',
    nameFr: 'Identification des parties',
    clauses: [
      {
        id: 'clause-parties-01',
        clauseType: 'PARTIES',
        title: 'Party Identification',
        titleAr: 'تحديد الأطراف',
        titleFr: 'Identification des parties',
        content: 'This Agreement is made between {{partyA_name}}, a company duly organized under the laws of Algeria, with its registered office at {{partyA_address}}, represented by {{partyA_representative}} in their capacity as {{partyA_title}} (hereinafter referred to as "Party A" or the "Supplier"), AND {{partyB_name}}, a company duly organized under the laws of Algeria, with its registered office at {{partyB_address}}, represented by {{partyB_representative}} in their capacity as {{partyB_title}} (hereinafter referred to as "Party B" or the "Buyer").',
        contentAr: 'تم إبرام هذه الاتفاقية بين {{partyA_name}}، شركة منظمة وفقاً لقوانين الجزائر، ومقرها المسجل في {{partyA_address}}، ممثلة من قبل {{partyA_representative}} بصفتهم {{partyA_title}} (المشار إليها فيما بعد بـ "الطرف أ" أو "المورد")، وبين {{partyB_name}}، شركة منظمة وفقاً لقوانين الجزائر، ومقرها المسجل في {{partyB_address}}، ممثلة من قبل {{partyB_representative}} بصفتهم {{partyB_title}} (المشار إليها فيما بعد بـ "الطرف ب" أو "المشتري").',
        contentFr: 'Le présent Contrat est conclu entre {{partyA_name}}, société dûment constituée selon les lois algériennes, ayant son siège social à {{partyA_address}}, représentée par {{partyA_representative}} en sa qualité de {{partyA_title}} (ci-après dénommée "Partie A" ou le "Fournisseur"), ET {{partyB_name}}, société dûment constituée selon les lois algériennes, ayant son siège social à {{partyB_address}}, représentée par {{partyB_representative}} en sa qualité de {{partyB_title}} (ci-après dénommée "Partie B" ou l\'"Acheteur").',
        isRequired: true,
        isEditable: true,
        order: 1,
      },
      {
        id: 'clause-parties-02',
        clauseType: 'CAPACITY',
        title: 'Legal Capacity',
        titleAr: 'الأهلية القانونية',
        titleFr: 'Capacité juridique',
        content: 'Each party represents that it has full power and authority to enter into this Agreement and that the person signing on its behalf is duly authorized to do so.',
        contentAr: 'يمثل كل طرف أنه يملك السلطة الكاملة والصلاحية لإبرام هذه الاتفاقية وأن الشخص الموقع باسمه مفوض بشكل صحيح للقيام بذلك.',
        contentFr: 'Chaque partie déclare avoir pleins pouvoirs et autorité pour conclure le présent Contrat et que la personne signant en son nom est dûment habilitée à le faire.',
        isRequired: true,
        isEditable: false,
        order: 2,
      },
    ],
  },
  {
    id: 'subject-matter',
    name: 'Subject Matter & Scope',
    nameAr: 'الموضوع والنطاق',
    nameFr: 'Objet et portée',
    clauses: [
      {
        id: 'clause-subject-01',
        clauseType: 'SUBJECT',
        title: 'Subject Matter of Contract',
        titleAr: 'موضوع العقد',
        titleFr: 'Objet du contrat',
        content: 'The subject matter of this Agreement is {{subject_description}} as detailed in Annex A attached hereto and forming an integral part hereof.',
        contentAr: 'موضوع هذه الاتفاقية هو {{subject_description}} كما هو مفصل في الملحق أ المرفق بها والمكون جزءاً لا يتجزأ منها.',
        contentFr: "L'objet du présent Contrat est {{subject_description}} tel que détaillé dans l'Annexe A ci-jointe et en formant partie intégrante.",
        isRequired: true,
        isEditable: true,
        order: 1,
      },
      {
        id: 'clause-subject-02',
        clauseType: 'SCOPE',
        title: 'Scope of Work/Delivery',
        titleAr: 'نطاق العمل/التسليم',
        titleFr: 'Prestation/Livraison',
        content: 'Party A undertakes to supply Party B with the products/services described in accordance with the specifications, quantities, and quality standards set forth in this Agreement.',
        contentAr: 'يلتزم الطرف أ بتزويد الطرف ب بالمنتجات/الخدمات الموصوفة وفقاً للمواصفات والكميات ومعايير الجودة المنصوص عليها في هذه الاتفاقية.',
        contentFr: 'La Partie A s\'engage à fournir à la Partie B les produits/services décrits conformément aux spécifications, quantités et normes de qualité définies dans le présent Contrat.',
        isRequired: true,
        isEditable: true,
        order: 2,
      },
    ],
  },
  {
    id: 'payment',
    name: 'Payment Terms',
    nameAr: 'شروط الدفع',
    nameFr: 'Conditions de paiement',
    clauses: [
      {
        id: 'clause-payment-01',
        clauseType: 'PRICE',
        title: 'Price and Total Amount',
        titleAr: 'سعر وإجمالي المبلغ',
        titleFr: 'Prix et montant total',
        content: 'The total price for the products/services under this Agreement shall be {{total_amount}} {{currency}} ({{amount_in_words}}), subject to any adjustments as provided herein.',
        contentAr: 'يكون السعر الإجمالي للمنتجات/الخدمات بموجب هذه الاتفاقية {{total_amount}} {{currency}} ({{amount_in_words}})، خاضعاً لأي تعديلات كما هو منصوص عليه هنا.',
        contentFr: 'Le prix total des produits/services au titre du présent Contrat s\'élève à {{total_amount}} {{currency}} ({{amount_in_words}}), sous réserve des ajustements prévus aux présentes.',
        isRequired: true,
        isEditable: true,
        order: 1,
      },
      {
        id: 'clause-payment-02',
        clauseType: 'PAYMENT_TERMS',
        title: 'Payment Terms and Schedule',
        titleAr: 'شروط وجدولة الدفع',
        titleFr: 'Conditions et échéancier de paiement',
        content: 'Payment shall be made in accordance with the following terms: {{payment_terms}}. Payment shall be due within {{payment_due_days}} days from the date of invoice receipt.',
        contentAr: 'يتم الدفع وفقاً للشروط التالية: {{payment_terms}}. يستحق الدفع خلال {{payment_due_days}} يوماً من تاريخ استلام الفاتورة.',
        contentFr: 'Le paiement sera effectué selon les conditions suivantes : {{payment_terms}}. Le paiement est dû dans un délai de {{payment_due_days}} jours à compter de la date de réception de la facture.',
        isRequired: true,
        isEditable: true,
        order: 2,
      },
      {
        id: 'clause-payment-03',
        clauseType: 'PAYMENT_METHOD',
        title: 'Accepted Payment Methods',
        titleAr: 'طرق الدفع المقبولة',
        titleFr: 'Modes de paiement acceptés',
        content: 'Payments may be made by bank transfer to the account specified in Annex B, by certified check, or through SATIM/CIB payment gateway for electronic payments. All banking charges are borne by the payer.',
        contentAr: 'يمكن الدفع عن طريق التحويل البنكي إلى الحساب المحدد في الملحق ب، أو بشيك معتمد، أو عبر بوابة دفع SATIM/CIB للمدفوعات الإلكترونية. تتحمل طرف الدافع جميع الرسوم المصرفية.',
        contentFr: 'Les paiements peuvent être effectués par virement bancaire sur le compte spécifié à l\'Annexe B, par chèque certifié, ou via le passerelle de paiement SATIM/CIB pour les paiements électroniques. Tous les frais bancaires sont à la charge du payeur.',
        isRequired: false,
        isEditable: true,
        order: 3,
      },
      {
        id: 'clause-payment-04',
        clauseType: 'LATE_PAYMENT',
        title: 'Late Payment Penalties',
        titleAr: 'غرامات التأخير في الدفع',
        titleFr: 'Pénalités de retard de paiement',
        content: 'In case of late payment, late penalties shall be applied at a rate of {{late_payment_rate}}% per month of delay, calculated pro rata temporis, without prejudice to any other remedies available under Article 524 of the Algerian Commercial Code.',
        contentAr: 'في حالة التأخير في الدفع، يتم تطبيق غرامات تأخير بمعدل {{late_payment_rate}}% شهرياً من مدة التأخير، محسبة بالتناسب، دون الإضرار بأي علاجات أخرى متاحة بموجب المادة 524 من القانون التجاري الجزائري.',
        contentFr: 'En cas de retard de paiement, des pénalités de retard seront appliquées au taux de {{late_payment_rate}}% par mois de retard, calculées au prorata temporis, sans préjudice des autres recours prévus à l\'article 524 du Code de commerce algérien.',
        isRequired: true,
        isEditable: true,
        order: 4,
      },
    ],
  },
  {
    id: 'delivery',
    name: 'Delivery & Performance',
    nameAr: 'التسليم والأداء',
    titleFr: 'Livraison et exécution',
    clauses: [
      {
        id: 'clause-delivery-01',
        clauseType: 'DELIVERY',
        title: 'Delivery Terms',
        titleAr: 'شروط التسليم',
        titleFr: 'Conditions de livraison',
        content: 'Delivery shall be made {{delivery_terms}} within {{delivery_period}} days from the date of order confirmation. Delivery location shall be {{delivery_location}} unless otherwise agreed in writing.',
        contentAr: 'يتم التسليم {{delivery_terms}} خلال {{delivery_period}} يوماً من تأكيد الطلب. يكون موقع التسليم {{delivery_location}} ما لم يتم الاتفاق على خلاف ذلك كتابة.',
        contentFr: 'La livraison sera effectuée {{delivery_terms}} dans un délai de {{delivery_period}} jours à compter de la date de confirmation de commande. Le lieu de livraison sera {{delivery_location}} sauf accord écrit contraire.',
        isRequired: true,
        isEditable: true,
        order: 1,
      },
      {
        id: 'clause-delivery-02',
        clauseType: 'TRANSFER_OF_RISK',
        title: 'Transfer of Risk',
        titleAr: 'نقل المخاطر',
        titleFr: 'Transfert de risque',
        content: 'Risk of loss or damage to the goods passes to Party B upon delivery at the agreed location, in accordance with Article 388 et seq. of the Algerian Civil Code.',
        contentAr: 'ينتقل مخاطر فقدان أو تلف البضائع إلى الطرف b عند التسليم في الموقع المتفق عليه، وفقاً للمادة 388 وما يليها من القانون المدني الجزائري.',
        contentFr: 'Le risque de perte ou d\'endommagement des marchandises est transféré à la Partie B lors de la livraison au lieu convenu, conformément à l\'article 388 et suivants du Code civil algérien.',
        isRequired: true,
        isEditable: false,
        order: 2,
      },
      {
        id: 'clause-delivery-03',
        clauseType: 'FORCE_MAJEURE',
        title: 'Force Majeure',
        titleAr: 'قوة قاهرة',
        titleFr: 'Force majeure',
        content: 'Neither party shall be liable for failure to perform its obligations if such failure results from force majeure events including but not limited to natural disasters, war, government actions, epidemics, or any circumstances beyond reasonable control. The affected party must notify the other party within fifteen (15) days of occurrence.',
        contentAr: 'لا يتحمل أي طرف مسؤولية عدم الوفاء بالتزاماته إذا كان هذا الفشل نتيجة لأحداث قوة قاهرة تشمل但不 limited إلى الكوارث الطبيعية والحرب والإجراءات الحكومية والأوبئة أو أي ظروف خارج عن السيطرة المعقولة. يجب على الطرف المتأثر إخطار الطرف الآخر خلال خمسة عشر (15) يوماً من حدوثه.',
        contentFr: 'Aucune partie ne sera responsable de l\'inexécution de ses obligations si cette inexécution résulte d\'un cas de force majeure incluant mais non limité aux catastrophes naturelles, la guerre, les actions gouvernementales, les épidémies ou toute circonstance hors contrôle raisonnable. La partie affectée doit notifier l\'autre partie dans les quinze (15) jours de l\'événement.',
        isRequired: true,
        isEditable: true,
        order: 3,
      },
    ],
  },
  {
    id: 'warranty',
    name: 'Warranty & Quality',
    nameAr: 'الضمانة والجودة',
    nameFr: 'Garantie et qualité',
    clauses: [
      {
        id: 'clause-warranty-01',
        clauseType: 'WARRANTY',
        title: 'Product/Service Warranty',
        titleAr: 'ضمان المنتج/الخدمة',
        titleFr: 'Garantie produit/service',
        content: 'Party A warrants that all products/services shall conform to the specifications set forth herein and shall be free from defects in materials and workmanship for a period of {{warranty_period}} months from delivery, in accordance with consumer protection regulations.',
        contentAr: 'يضمن الطرف أ أن جميع المنتج/الخدمات تتوافق مع المواصفات المنصوص عليها هنا وتكون خالية من العيوب في المواد وصنعها لمدة {{warranty_period}} شهراً من التسليم، وفقاً لوائح حماية المستهلك.',
        contentFr: 'La Partie A garantit que tous les produits/services seront conformes aux spécifications définies aux présentes et seront exempts de défauts de matériaux et de fabrication pendant une période de {{warranty_period}} mois à compter de la livraison, conformément aux réglementations de protection des consommateurs.',
        isRequired: true,
        isEditable: true,
        order: 1,
      },
      {
        id: 'clause-warranty-02',
        clauseType: 'QUALITY',
        title: 'Quality Standards',
        titleAr: 'معايير الجودة',
        titleFr: 'Normes de qualité',
        content: 'Products shall comply with Algerian quality standards and certifications as applicable to the product category, including NAJAH certification where required.',
        contentAr: 'يجب أن تتوافق المنتجات مع معايير وشهادات الجودة الجزائرية المطبقة على فئة المنتج، بما في ذلك شهادة NAJAM حيث مطلوب.',
        contentFr: 'Les produits doivent être conformes aux normes et certifications de qualité algériennes applicables à la catégorie de produit, y compris la certification NAJAH lorsque requise.',
        isRequired: true,
        isEditable: true,
        order: 2,
      },
      {
        id: 'clause-warranty-03',
        clauseType: 'REMEDIES',
        title: 'Warranty Remedies',
        titleAr: 'علاجات الضمان',
        titleFr: 'Recours en garantie',
        content: 'In case of defect notification within the warranty period, Party A shall at its option repair, replace, or refund the defective products within thirty (30) days of receiving the return.',
        contentAr: 'في حالة إخطار بالعيوب خلال فترة الضمان، يختار الطرف أ إصلاح أو استبدال أو استرداد المنتجات المعيبة خلال ثلاثين (30) يوماً من استلام المرتجع.',
        contentFr: 'En cas de notification de défaut dans le délai de garantie, la Partie A aura le choix de réparer, remplacer ou rembourser les produits défectueux dans les trente (30) jours suivant la réception du retour.',
        isRequired: true,
        isEditable: true,
        order: 3,
      },
    ],
  },
  {
    id: 'confidentiality',
    name: 'Confidentiality',
    nameAr: 'السرية',
    nameFr: 'Confidentialité',
    clauses: [
      {
        id: 'clause-confidentiality-01',
        clauseType: 'CONFIDENTIALITY',
        title: 'Confidential Information',
        titleAr: 'المعلومات السرية',
        titleFr: 'Informations confidentielles',
        content: 'Each party agrees to maintain strict confidentiality regarding all confidential information disclosed by the other party, including but not limited to business plans, technical data, pricing information, and customer lists. This obligation survives termination of this Agreement for a period of {{confidentiality_period}} years.',
        contentAr: 'يوافق كل طرف على الحفاظ على سرية صارمة بخصوص جميع المعلومات السرية التي يكشفها الطرف الآخر، تشمل但不 limited إلى خطط الأعمال والبيانات التقنية ومعلومات الأسعار وقوائم العملاء. يستمر هذا الالتزام بعد إنهاء هذه الاتفاقية لمدة {{confidentiality_period}} سنة.',
        contentFr: 'Chaque partie convient de maintenir une stricte confidentialité concernant toutes les informations confidentielles divulguées par l\'autre partie, incluant mais non limité aux plans d\'affaires, données techniques, informations tarifaires et listes clients. Cette obligation survit à la résolution du présent Contrat pour une période de {{confidentiality_period}} années.',
        isRequired: true,
        isEditable: true,
        order: 1,
      },
    ],
  },
  {
    id: 'dispute-resolution',
    name: 'Dispute Resolution',
    nameAr: 'حل النزاعات',
    nameFr: 'Règlement des différends',
    clauses: [
      {
        id: 'clause-dispute-01',
        clauseType: 'NEGOTIATION',
        title: 'Amicable Settlement',
        titleAr: 'التسوية الودية',
        titleFr: 'Règlement amiable',
        content: 'In case of dispute arising from or in connection with this Agreement, the parties shall first attempt to resolve the matter amicably through good faith negotiations within thirty (30) days.',
        contentAr: 'في حالة نشوء نزاع من هذه الاتفاقية أو مرتبط بها، يجب على الأطراف أولاً محاولة حل الأمر ودياً من خلال مفاوضات بحسن نية خلال ثلاثين (30) يوماً.',
        contentFr: 'En cas de différend découlant du présent Contrat ou s\'y rapportant, les parties tenteront d\'abord de régler le litige à l\'amiable par des négociations de bonne foi dans un délai de trente (30) jours.',
        isRequired: true,
        isEditable: false,
        order: 1,
      },
      {
        id: 'clause-dispute-02',
        clauseType: 'ARBITRATION',
        title: 'Arbitration',
        titleAr: 'التحكيم',
        titleFr: 'Arbitrage',
        content: 'If amicable settlement fails, the dispute shall be submitted to the Arbitration Center of Algiers (Centre d\'Arbitrage d\'Alger) in accordance with its rules. The arbitration shall be conducted in {{arbitration_language}} language, and the award shall be final and binding.',
        contentAr: 'إذا فشلت التسوية الودية، يتم عرض النزاع على مركز تحكيم الجزائر وفقاً لقواعده. يجري التحكيم بلغة {{arbitration_language}}، ويكون القرار نهائياً وملزماً.',
        contentFr: 'Si le règlement amiable échoue, le différend sera soumis au Centre d\'Arbitrage d\'Alger conformément à son règlement. L\'arbitrage se tiendra en langue {{arbitration_language}}, et la sentence sera définitive et obligatoire.',
        isRequired: true,
        isEditable: true,
        order: 2,
      },
      {
        id: 'clause-dispute-03',
        clauseType: 'JURISDICTION',
        title: 'Competent Courts',
        titleAr: 'المحاكم المختصة',
        titleFr: 'Tribunaux compétents',
        content: 'Subject to the arbitration clause above, the courts of {{jurisdiction_city}} shall have exclusive jurisdiction over any disputes arising from this Agreement.',
        contentAr: 'بخلاف بند التحكيم أعلاه، تكون محاكم {{jurisdiction_city}} ذات اختصاص حصري بالنظر في أي نزاعات تنشأ عن هذه الاتفاقية.',
        contentFr: 'Sous réserve de la clause d\'arbitrage ci-dessus, les tribunaux de {{jurisdiction_city}} auront compétence exclusive pour connaître de tout différend découlant du présent Contrat.',
        isRequired: true,
        isEditable: true,
        order: 3,
      },
    ],
  },
  {
    id: 'termination',
    name: 'Termination',
    nameAr: 'الإنهاء',
    nameFr: 'Résiliation',
    clauses: [
      {
        id: 'clause-termination-01',
        clauseType: 'TERM',
        title: 'Term and Termination',
        titleAr: 'المدة والإنهاء',
        titleFr: 'Durée et résiliation',
        content: 'This Agreement shall remain in effect for a period of {{contract_duration}} months commencing on the effective date, unless terminated earlier in accordance with this section.',
        contentAr: 'تبقى هذه الاتفاقية سارية المفعول لمدة {{contract_duration}} شهراً ابتداء من التاريخ الفعلي، ما لم يتم إنهاؤها مبكراً وفقاً لهذا القسم.',
        contentFr: 'Le présent Contrat reste en vigueur pour une période de {{contract_duration}} mois à compter de la date d\'effet, sauf résiliation antérieure conformément à la présente section.',
        isRequired: true,
        isEditable: true,
        order: 1,
      },
      {
        id: 'clause-termination-02',
        clauseType: 'TERMINATION_FOR_CAUSE',
        title: 'Termination for Cause',
        titleAr: 'الإنهاء بسبب',
        titleFr: 'Résiliation pour cause',
        content: 'Either party may terminate this Agreement upon thirty (30) days written notice if the other party materially breaches any provision hereof and fails to cure such breach within fifteen (15) days of receiving written notice thereof.',
        contentAr: 'يجوز لأي طرف إنهاء هذه الاتفاقية بإخطار كتابي خلال ثلاثين (30) يوماً إذا أخل الطرف الآخر إخلالاً جوهرياً بأي حكم هنا وفشل في تصحيح هذا الإخلال خلال خمسة عشر (15) يوماً من استلام الإخطار الكتابي بذلك.',
        contentFr: 'Chaque partie peut résilier le présent Contrat sous préavis de trente (30) jours si l\'autre partie viole substantiellement une disposition des présentes et ne remédie pas à cette violation dans les quinze (15) jours suivant la réception d\'un avis écrit à cet effet.',
        isRequired: true,
        isEditable: true,
        order: 2,
      },
    ],
  },
  {
    id: 'general',
    name: 'General Provisions',
    nameAr: 'أحكام عامة',
    nameFr: 'Dispositions générales',
    clauses: [
      {
        id: 'clause-general-01',
        clauseType: 'ENTIRE_AGREEMENT',
        title: 'Entire Agreement',
        titleAr: 'الاتفاقية الكاملة',
        titleFr: 'Accord entier',
        content: 'This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, representations, and understandings relating to its subject matter.',
        contentAr: 'تشكل هذه الاتفاقية الفهم الكامل بين الأطراف وتحل محل جميع الاتفاقات السابقة والتصريحات والفهومات المتعلقة بموضوعها.',
        contentFr: 'Le présent Constitue l\'entente entière entre les parties et remplace tous accords, représentations et ententes antérieurs relatifs à son objet.',
        isRequired: true,
        isEditable: false,
        order: 1,
      },
      {
        id: 'clause-general-02',
        clauseType: 'GOVERNING_LAW',
        title: 'Governing Law',
        titleAr: 'القانون الحاكم',
        titleFr: 'Droit applicable',
        content: 'This Agreement shall be governed by and construed in accordance with the laws of the People\'s Democratic Republic of Algeria, specifically the Commercial Code (Ordinance 75-59) and Civil Code (Ordinance 70-05).',
        contentAr: 'تخضع هذه الاتفاقية وتفسر وفقاً لقوانين الجمهورية الجزائرية الديمقراطية الشعبية، وتحديداً القانون التجاري (الأمر 75-59) والقانون المدني (الأمر 70-05).',
        contentFr: 'Le présent Contrat est régi par et interprété conformément aux lois de la République Algérienne Démocratique et Populaire, notamment le Code de commerce (Ordonnance 75-59) et le Code civil (Ordonnance 70-05).',
        isRequired: true,
        isEditable: false,
        order: 2,
      },
      {
        id: 'clause-general-03',
        clauseType: 'AMENDMENTS',
        title: 'Amendments',
        titleAr: 'التعديلات',
        titleFr: 'Modifications',
        content: 'No amendment, modification, or waiver of any provision of this Agreement shall be effective unless made in writing and signed by both parties.',
        contentAr: 'لا يكون أي تعديل أو تغيير أو تنازل عن أي حكم من هذه الاتفاقية فعالاً إلا إذا تم كتابة وتوقيعه من كلا الطرفين.',
        contentFr: 'Aucune modification ou renonciation à une disposition du présent Contrat ne sera efficace que si elle est faite par écrit et signée par les deux parties.',
        isRequired: true,
        isEditable: false,
        order: 3,
      },
      {
        id: 'clause-general-04',
        clauseType: 'NOTICES',
        title: 'Notices',
        titleAr: 'الإخطارات',
        titleFr: 'Notifications',
        content: 'All notices under this Agreement shall be in writing and delivered by registered mail, courier service, or confirmed electronic mail to the addresses specified herein.',
        contentAr: 'جميع الإخطارات بموجب هذه الاتفاقية تكون كتابية وتسلم بالبريد المسجل أو خدمة البريد السريع أو البريد الإلكتروني المؤكد إلى العناوين المحددة هنا.',
        contentFr: 'Toutes notifications au titre du présent Contrat seront faites par écrit et livrées par courrier recommandé, service de messagerie ou courrier électronique confirmé aux adresses spécifiées aux présentes.',
        isRequired: true,
        isEditable: true,
        order: 4,
      },
      {
        id: 'clause-general-05',
        clauseType: 'SIGNATURES',
        title: 'Signatures',
        titleAr: 'التوقيعات',
        titleFr: 'Signatures',
        content: 'This Agreement may be executed in counterparts, each of which shall be deemed an original. Electronic signatures shall be valid and enforceable under Law 10-11 of June 29, 2010 on Electronic Signature.',
        contentAr: 'يجوز تنفيذ هذه الاتفاقية في نظائر، يعتبر كل منها أصلياً. تكون التوقيعات الإلكترونية صالحة ونافذة بموجب القانون 10-11 المؤرخ في 29 يونيو 2010 بشأن التوقيع الإلكتروني.',
        contentFr: 'Le présent Contrat peut être exécuté en contreparties, chacune étant considérée comme originale. Les signatures électroniques seront valides et exécutoires en vertu de la Loi 10-11 du 29 juin 2010 sur la signature électronique.',
        isRequired: true,
        isEditable: false,
        order: 5,
      },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all available clauses
 * الحصول على جميع البنود المتاحة
 */
export function getAllClauses(): ContractClause[] {
  return CLAUSE_CATEGORIES.flatMap(category => category.clauses);
}

/**
 * Get clauses by category
 * الحصول على بنود حسب الفئة
 */
export function getClausesByCategory(categoryId: string): ContractClause[] {
  const category = CLAUSE_CATEGORIES.find(c => c.id === categoryId);
  return category?.clauses || [];
}

/**
 * Get clause by ID
 * الحصول على بند حسب المعرف
 */
export function getClauseById(clauseId: string): ContractClause | undefined {
  return getAllClauses().find(c => c.id === clauseId);
}

/**
 * Search clauses by keyword
 * بحث البنود بكلمة مفتاحية
 */
export function searchClauses(keyword: string): ContractClause[] {
  const lowerKeyword = keyword.toLowerCase();
  return getAllClauses().filter(clause =>
    clause.title.toLowerCase().includes(lowerKeyword) ||
    clause.titleAr.includes(keyword) ||
    clause.titleFr.toLowerCase().includes(lowerKeyword) ||
    clause.content.toLowerCase().includes(lowerKeyword) ||
    clause.contentAr.includes(keyword) ||
    clause.contentFr.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * Get required clauses for contract type
 * الحصول على البنود المطلوبة لنوع العقد
 */
export function getRequiredClauses(contractType?: ContractType): ContractClause[] {
  let clauses = getAllClauses();
  
  // Filter by contract type if specified
  if (contractType) {
    // Different contract types might require different base clauses
    switch (contractType) {
      case 'NON_DISCLOSURE':
        clauses = clauses.filter(c => 
          ['CONFIDENTIALITY', 'PARTIES', 'DISPUTE_RESOLUTION', 'GENERAL'].includes(c.clauseType)
        );
        break;
      case 'EXCLUSIVITY':
        clauses = clauses.filter(c => 
          !['WARRANTY', 'DELIVERY'].includes(c.clauseType)
        );
        break;
      default:
        break;
    }
  }
  
  return clauses.filter(c => c.isRequired);
}

/**
 * Get template placeholders
 * الحصول على عناصر نائبة للقالب
 */
export function getTemplatePlaceholders(): { key: string; label: string; labelAr: string; labelFr: string }[] {
  return [
    { key: '{{partyA_name}}', label: 'Party A Company Name', labelAr: 'اسم شركة الطرف أ', labelFr: 'Nom de la société Partie A' },
    { key: '{{partyA_address}}', label: 'Party A Address', labelAr: 'عنوان الطرف أ', labelFr: 'Adresse Partie A' },
    { key: '{{partyA_representative}}', label: 'Party A Representative Name', labelAr: 'اسم ممثل الطرف أ', labelFr: 'Nom du représentant Partie A' },
    { key: '{{partyA_title}}', label: 'Party A Representative Title', labelAr: 'صفة ممثل الطرف أ', labelFr: 'Titre du représentant Partie A' },
    { key: '{{partyB_name}}', label: 'Party B Company Name', labelAr: 'اسم شركة الطرف ب', labelFr: 'Nom de la société Partie B' },
    { key: '{{partyB_address}}', label: 'Party B Address', labelAr: 'عنوان الطرف ب', labelFr: 'Adresse Partie B' },
    { key: '{{partyB_representative}}', label: 'Party B Representative Name', labelAr: 'اسم ممثل الطرف ب', labelFr: 'Nom du représentant Partie B' },
    { key: '{{partyB_title}}', label: 'Party B Representative Title', labelAr: 'صفة ممثل الطرف ب', labelFr: 'Titre du représentant Partie B' },
    { key: '{{subject_description}}', label: 'Subject Description', labelAr: 'وصف الموضوع', labelFr: 'Description de l\'objet' },
    { key: '{{total_amount}}', label: 'Total Amount', labelAr: 'إجمالي المبلغ', labelFr: 'Montant total' },
    { key: '{{currency}}', label: 'Currency', labelAr: 'العملة', labelFr: 'Devise' },
    { key: '{{amount_in_words}}', label: 'Amount in Words', labelAr: 'المبلغ بالكلمات', labelFr: 'Montant en lettres' },
    { key: '{{payment_terms}}', label: 'Payment Terms', labelAr: 'شروط الدفع', labelFr: 'Conditions de paiement' },
    { key: '{{payment_due_days}}', label: 'Payment Due Days', labelAr: 'أيام استحقاق الدفع', labelFr: 'Délai de paiement (jours)' },
    { key: '{{late_payment_rate}}', label: 'Late Payment Rate %', labelAr: 'نسبة غرامة التأخير', labelFr: 'Taux de pénalité de retard (%)' },
    { key: '{{delivery_terms}}', label: 'Delivery Terms', labelAr: 'شروط التسليم', labelFr: 'Conditions de livraison' },
    { key: '{{delivery_period}}', label: 'Delivery Period (days)', labelAr: 'فترة التسليم (أيام)', labelFr: 'Délai de livraison (jours)' },
    { key: '{{delivery_location}}', label: 'Delivery Location', labelAr: 'موقع التسليم', labelFr: 'Lieu de livraison' },
    { key: '{{warranty_period}}', label: 'Warranty Period (months)', labelAr: 'فترة الضمان (أشهر)', labelFr: 'Période de garantie (mois)' },
    { key: '{{contract_duration}}', label: 'Contract Duration (months)', labelAr: 'مدة العقد (أشهر)', labelFr: 'Durée du contrat (mois)' },
    { key: '{{confidentiality_period}}', label: 'Confidentiality Period (years)', labelAr: 'فترة السرية (سنوات)', labelFr: 'Période de confidentialité (années)' },
    { key: '{{arbitration_language}}', label: 'Arbitration Language', labelAr: 'لغة التحكيم', labelFr: 'Langue d\'arbitrage' },
    { key: '{{jurisdiction_city}}', label: 'Jurisdiction City', labelAr: 'مدينة الاختصاص', labelFr: 'Ville de juridiction' },
  ];
}
