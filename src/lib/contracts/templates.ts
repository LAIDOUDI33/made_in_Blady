// Contract Templates for AlgeriaTrade.dz
// قوالب العقود لمنصة الجزائر تريد
// Modèles de contrats pour AlgeriaTrade.dz

import type { ContractType, ContractLanguage } from '../contracts';

// ============================================
// TYPES
// ============================================

export interface ContractClause {
  id: string;
  clauseType: string;
  title: string;
  titleAr: string;
  titleFr: string;
  content: string;
  contentAr: string;
  contentFr: string;
  isRequired: boolean;
  isEditable: boolean;
  order: number;
}

export interface ContractTemplate {
  type: ContractType;
  name: string;
  nameAr: string;
  nameFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  language: ContractLanguage;
  clauses: ContractClause[];
  defaultPenaltyClause: string;
  defaultWarrantyTerms: string;
}

// ============================================
// TEMPLATE GENERATOR
// ============================================

function createSalesAgreementTemplate(language: ContractLanguage): ContractTemplate {
  return {
    type: 'SALES_AGREEMENT',
    name: 'Sales Agreement',
    nameAr: 'اتفاقية البيع',
    nameFr: 'Contrat de vente',
    description: 'Standard sales agreement for product transactions',
    descriptionAr: 'اتفاقية بيع قياسية للمعاملات التجارية',
    descriptionFr: "Contrat de vente standard pour les transactions commerciales",
    language,
    clauses: [
      {
        id: 'sales-01',
        clauseType: 'PARTIES',
        title: 'Identified Parties',
        titleAr: 'الأطراف المعرفة',
        titleFr: 'Parties identifiées',
        content: 'This Sales Agreement ("Agreement") is entered into between {{partyA_name}} ("Seller") and {{partyB_name}} ("Buyer").',
        contentAr: 'تم إبرام هذه اتفاقية البيع ("الاتفاقية") بين {{partyA_name}} ("البائع") و{{partyB_name}} ("المشتري").',
        contentFr: `Le présent Contrat de Vente ("Contrat") est conclu entre {{partyA_name}} ("Vendeur") et {{partyB_name}} ("Acheteur").`,
        isRequired: true,
        isEditable: false,
        order: 1,
      },
      {
        id: 'sales-02',
        clauseType: 'SUBJECT',
        title: 'Subject Matter',
        titleAr: 'موضوع العقد',
        titleFr: 'Objet du contrat',
        content: 'The Seller agrees to sell and the Buyer agrees to purchase the goods described in Schedule A, in accordance with the terms and conditions of this Agreement.',
        contentAr: 'يوافق البائع على بيع والمشتري على شراء السلع الموضحة في الملحق A، وفقاً للشروط والأحكام هذه الاتفاقية.',
        contentFr: 'Le Vendeur convient de vendre et l\'Acheteur d\'acheter les biens décrits à l\'Annexe A, conformément aux termes et conditions du présent Contrat.',
        isRequired: true,
        isEditable: true,
        order: 2,
      },
      {
        id: 'sales-03',
        clauseType: 'PRICE',
        title: 'Price and Payment',
        titleAr: 'السعر والدفع',
        titleFr: 'Prix et paiement',
        content: 'The total price for the Goods shall be {{total_value}} {{currency}}, payable according to the payment terms specified herein.',
        contentAr: 'يكون السعر الإجمالي للسلع {{total_value}} {{currency}}، قابلة للدفع وفقاً لشروط الدفع المحددة هنا.',
        contentFr: `Le prix total des Biens s'élève à {{total_value}} {{currency}}, payable selon les conditions de paiement spécifiées ci-après.`,
        isRequired: true,
        isEditable: true,
        order: 3,
      },
      {
        id: 'sales-04',
        clauseType: 'DELIVERY',
        title: 'Delivery Terms',
        titleAr: 'شروط التسليم',
        titleFr: 'Conditions de livraison',
        content: 'Delivery shall be made within {{delivery_days}} days of the order confirmation, at the location specified by the Buyer. Risk of loss transfers upon delivery.',
        contentAr: 'يتم التسليم خلال {{delivery_days}} يوماً من تأكيد الطلب، في الموقع المحدد من المشتري. ينتقل خطر الفقدان عند التسليم.',
        contentFr: 'La livraison sera effectuée dans un délai de {{delivery_days} jours après la confirmation de la commande, au lieu désigné par l\'Acheteur. Le risque de perte est transféré à la livraison.',
        isRequired: true,
        isEditable: true,
        order: 4,
      },
      {
        id: 'sales-05',
        clauseType: 'TRANSFER',
        title: 'Transfer of Ownership',
        titleAr: 'نقل الملكية',
        titleFr: 'Transfert de propriété',
        content: 'Title and ownership of the Goods shall pass to the Buyer upon full payment of the purchase price.',
        contentAr: 'ينتقل عنوان وملكية السلع إلى المشتري عند الدفع الكامل لسعر الشراء.',
        contentFr: 'Le titre et la propriété des Biens seront transférés à l\'Acheteur après paiement intégral du prix d\'achat.',
        isRequired: true,
        isEditable: false,
        order: 5,
      },
      {
        id: 'sales-06',
        clauseType: 'WARRANTY',
        title: 'Warranty Terms',
        titleAr: 'شروط الضمان',
        titleFr: 'Conditions de garantie',
        content: 'The Seller warrants that the Goods shall be free from defects in materials and workmanship for a period of {{warranty_period}} months from delivery.',
        contentAr: 'يضمن البائع أن السلع خالية من عيوب المواد والتصنيع لمدة {{warranty_period}} شهراً من التسليم.',
        contentFr: 'Le Vendeur garantit que les Biens sont exempts de défauts de matériaux et de fabrication pour une période de {{warranty_period}} mois à compter de la livraison.',
        isRequired: true,
        isEditable: true,
        order: 6,
      },
      {
        id: 'sales-07',
        clauseType: 'PENALTY',
        title: 'Late Payment Penalty',
        titleAr: 'جزاء التأخير في الدفع',
        titleFr: 'Pénalité de retard de paiement',
        content: 'Late payments shall incur a penalty of {{penalty_rate}}% per month on the outstanding amount, in accordance with Algerian commercial law.',
        contentAr: 'تستوجب المدفوعات المتأخرة جزاء بنسبة {{penalty_rate}}% شهرياً على المبلغ المستحق، وفقاً للقانون التجاري الجزائري.',
        contentFr: 'Les retards de paiement entraîneront une pénalité de {{penalty_rate}}% par mois sur le montant dû, conformément à la loi commerciale algérienne.',
        isRequired: false,
        isEditable: true,
        order: 7,
      },
      {
        id: 'sales-08',
        clauseType: 'FORCE_MAJEURE',
        title: 'Force Majeure',
        titleAr: 'قوة قاهرة',
        titleFr: 'Force majeure',
        content: 'Neither party shall be liable for failure to perform due to events beyond their reasonable control, including natural disasters, war, or government actions.',
        contentAr: 'لا يتحمل أي طرف مسؤولية عدم الأداء بسبب أحداث خارج عن سيطرتهم المعقولة، بما في ذلك الكوارث الطبيعية أو الحرب أو الإجراءات الحكومية.',
        contentFr: 'Aucune partie ne sera responsable de l\'inexécution due à des événements échappant à leur contrôle raisonnable, y compris les catastrophes naturelles, la guerre ou les actions gouvernementales.',
        isRequired: true,
        isEditable: false,
        order: 8,
      },
      {
        id: 'sales-09',
        clauseType: 'DISPUTE',
        title: 'Dispute Resolution',
        titleAr: 'حل النزاعات',
        titleFr: 'Règlement des litiges',
        content: 'Any disputes arising from this Agreement shall be resolved through amicable negotiation, and if unsuccessful, through the competent Algerian courts.',
        contentAr: 'يتم حل أي نزاعات تنشأ عن هذه الاتفاقية عبر التفاود الودي، وإذا فشلت، عبر المحاكم الجزائرية المختصة.',
        contentFr: 'Tout litige découlant du présent Contrat sera réglé par négociation amiable, et en cas d\'échec, par les tribunaux algériens compétents.',
        isRequired: true,
        isEditable: false,
        order: 9,
      },
      {
        id: 'sales-10',
        clauseType: 'GOVERNING_LAW',
        title: 'Governing Law',
        titleAr: 'القانون الحاكم',
        titleFr: 'Droit applicable',
        content: 'This Agreement shall be governed by and construed in accordance with the laws of the People\'s Democratic Republic of Algeria.',
        contentAr: 'تخضع هذه الاتفاقية وتفسر وفقاً لقوانين الجمهورية الديمقراطية الشعبية الجزائرية.',
        contentFr: 'Le présent Contrat est régi et interprété conformément aux lois de la République Algérienne Démocratique et Populaire.',
        isRequired: true,
        isEditable: false,
        order: 10,
      },
    ],
    defaultPenaltyClause: '1.5% per month on overdue amounts - 1.5% شهرياً على المبالغ المتأخرة',
    defaultWarrantyTerms: '12 months from delivery - 12 شهراً من التسليم',
  };
}

function createSupplyContractTemplate(language: ContractLanguage): ContractTemplate {
  return {
    type: 'SUPPLY_CONTRACT',
    name: 'Supply Contract',
    nameAr: 'عقد التوريد',
    nameFr: 'Contrat de fourniture',
    description: 'Ongoing supply agreement with quantity commitments and quality standards',
    descriptionAr: 'اتفاقية توريد مستمرة مع التزامات بالكمية ومعايير الجودة',
    descriptionFr: "Accord de fourniture continu avec des engagements quantitatifs et des normes de qualité",
    language,
    clauses: [
      {
        id: 'supply-01',
        clauseType: 'PARTIES',
        title: 'Supply Parties',
        titleAr: 'أطراف التوريد',
        titleFr: 'Parties fournisseur',
        content: 'This Supply Agreement is between {{partyA_name}} (Supplier) and {{partyB_name}} (Buyer) for ongoing supply of products.',
        contentAr: 'هذه اتفاقية التوريد بين {{partyA_name}} (المورد) و{{partyB_name}} (المشتري) لتوريد مستمر للمنتجات.',
        contentFr: 'Le présent Accord de Fourniture est conclu entre {{partyA_name}} (Fournisseur) et {{partyB_name}} (Acheteur) pour la fourniture continue de produits.',
        isRequired: true,
        isEditable: false,
        order: 1,
      },
      {
        id: 'supply-02',
        clauseType: 'SCOPE',
        title: 'Products and Quantities',
        titleAr: 'المنتجات والكميات',
        titleFr: 'Produits et quantités',
        content: 'Supplier agrees to supply Buyer with products as specified in Schedule B, with minimum order quantities (MOQ) of {{moq}} units per order.',
        contentAr: 'يوافق المورد على توريد المشتري بالمنتجات كما هو محدد في الملحق B، مع كميات أدنى للطلب (MOQ) تبلغ {{moq}} وحدة لكل طلب.',
        contentFr: 'Le Fournisseur s\'engage à fournir à l\'Acheteur les produits spécifiés à l\'Annexe B, avec des quantités minimales de commande (QMC) de {{moq}} unités par commande.',
        isRequired: true,
        isEditable: true,
        order: 2,
      },
      {
        id: 'supply-03',
        clauseType: 'PRICING',
        title: 'Pricing Structure',
        titleAr: 'هيكل التسعير',
        titleFr: 'Structure tarifaire',
        content: 'Prices are fixed for {{price_validity}} months, subject to revision based on raw material cost variations exceeding 10%.',
        contentAr: 'الأسعار ثابتة لمدة {{price_validity}} شهراً، خاضعة للمراجعة بناءً على تغيرات تكلفة المواد الخام التي تتجاوز 10%.',
        contentFr: 'Les prix sont fixes pour une durée de {{price_validity}} mois, sous révision en fonction des variations de coût des matières premières excédant 10%.',
        isRequired: true,
        isEditable: true,
        order: 3,
      },
      {
        id: 'supply-04',
        clauseType: 'LEAD_TIME',
        title: 'Lead Time',
        titleAr: 'وقت التنفيذ',
        titleFr: 'Délai d\'exécution',
        content: 'Standard lead time is {{lead_time}} days from order confirmation. Express delivery available at additional cost.',
        contentAr: 'وقت التنفيذ القياسي هو {{lead_time}} يوماً من تأكيد الطلب. التوصيل السريع متاح بتكلفة إضافية.',
        contentFr: 'Le délai d\'exécution standard est de {{lead_time}} jours après confirmation de commande. La livraison express disponible moyennant supplément.',
        isRequired: true,
        isEditable: true,
        order: 4,
      },
      {
        id: 'supply-05',
        clauseType: 'QUALITY',
        title: 'Quality Standards',
        titleAr: 'معايير الجودة',
        titleFr: 'Normes de qualité',
        content: 'All products must meet specifications defined in Schedule C and comply with applicable Algerian quality standards (INAPI certification where required).',
        contentAr: 'يجب أن تلبي جميع المنتجات المواصفات المحددة في الملحق C وأن تتوافق مع معايير الجودة الجزائرية المطبقة (شهادة INAPI حيث مطلوب).',
        contentFr: 'Tous les produits doivent répondre aux spécifications définies à l\'Annexe C et se conformer aux normes de qualité algériennes applicables (certification INAPI si requise).',
        isRequired: true,
        isEditable: true,
        order: 5,
      },
      {
        id: 'supply-06',
        clauseType: 'TERM',
        title: 'Contract Duration',
        titleAr: 'مدة العقد',
        titleFr: 'Durée du contrat',
        content: 'This Agreement is valid for an initial term of {{contract_term}} months, renewable automatically unless terminated with {{notice_period}} days notice.',
        contentAr: 'هذه الاتفاقية صالحة لمدة أولية تبلغ {{contract_term}} شهراً، قابلة للتجديد التلقائي ما لم يتم إنهاؤها بإشعار {{notice_period}} يوماً.',
        contentFr: 'Le présent Accord est valable pour une durée initiale de {{contract_term}} mois, renouvelable automatiquement sauf résiliation avec un préavis de {{notice_period}} jours.',
        isRequired: true,
        isEditable: true,
        order: 6,
      },
    ],
    defaultPenaltyClause: '1% per week on delayed deliveries - 1% أسبوعياً على التسليمات المتأخرة',
    defaultWarrantyTerms: 'As per product specifications - وفقاً لمواصفات المنتج',
  };
}

function createServiceAgreementTemplate(language: ContractLanguage): ContractTemplate {
  return {
    type: 'SERVICE_AGREEMENT',
    name: 'Service Agreement',
    nameAr: 'اتفاقية الخدمات',
    nameFr: 'Contrat de prestation',
    description: 'Professional services agreement with scope, deliverables, and SLAs',
    descriptionAr: 'اتفاقية خدمات مهنية مع النطاق والتسليمات ومستويات الخدمة',
    descriptionFr: 'Contrat de services professionnels avec périmètre, livrables et SLA',
    language,
    clauses: [
      {
        id: 'service-01',
        clauseType: 'SCOPE',
        title: 'Scope of Services',
        titleAr: 'نطاق الخدمات',
        titleFr: 'Périmètre des services',
        content: 'Service Provider agrees to provide the services described in Schedule D to the Client, in a professional and workmanlike manner.',
        contentAr: 'يوافق مقدم الخدمة على تقديم الخدمات الموصفة في الملخص D للعميل، بطريقة احترافية وماهرة.',
        contentFr: 'Le Prestataire de Services s\'engage à fournir les services décrits à l\'Annexe D au Client, de manière professionnelle et soignée.',
        isRequired: true,
        isEditable: true,
        order: 1,
      },
      {
        id: 'service-02',
        clauseType: 'DELIVERABLES',
        title: 'Deliverables',
        titleAr: 'التسليمات',
        titleFr: 'Livrables',
        content: 'Deliverables and acceptance criteria are defined in Schedule E. Client has {{review_period}} business days to review each deliverable.',
        contentAr: 'التسليمات ومعايير القبول محددة في الملخص E. لديه العميل {{review_period}} أيام عمل لمراجعة كل تسليم.',
        contentFr: 'Les livrables et critères d\'acceptation sont définis à l\'Annexe E. Le Client dispose de {{review_period}} jours ouvrés pour examiner chaque livrable.',
        isRequired: true,
        isEditable: true,
        order: 2,
      },
      {
        id: 'service-03',
        clauseType: 'SLA',
        title: 'Service Level Agreement',
        titleAr: 'اتفاقية مستوى الخدمة',
        titleFr: 'Accord de niveau de service (SLA)',
        content: 'Service Provider shall maintain minimum uptime of {{uptime_percent}}% and respond to support requests within {{response_time}} hours during business hours.',
        contentAr: 'يجب على مقدم الخدمة الحفاظ على حد أدنى لتوفر {{uptime_percent}}% والرد على طلبات الدعم خلال {{response_time}} ساعة خلال ساعات العمل.',
        contentFr: 'Le Prestataire doit maintenir une disponibilité minimale de {{uptime_percent}}% et répondre aux demandes d\'assistance dans les {{response_time}} heures pendant les heures ouvrées.',
        isRequired: true,
        isEditable: true,
        order: 3,
      },
      {
        id: 'service-04',
        clauseType: 'CONFIDENTIALITY',
        title: 'Confidentiality',
        titleAr: 'السرية',
        titleFr: 'Confidentialité',
        content: 'Both parties agree to maintain confidentiality of proprietary information received during the engagement for a period of {{confidentiality_period}} years.',
        contentAr: 'يوافق الطرفان على الحفاظ على سرية المعلومات الخاصة المستلمة خلال التعيين لفترة تبلغ {{confidentiality_period}} سنة.',
        contentFr: 'Les deux parties conviennent de maintenir la confidentialité des informations propriétaires reçues durant la mission pour une période de {{confidentiality_period}} années.',
        isRequired: true,
        isEditable: false,
        order: 4,
      },
      {
        id: 'service-05',
        clauseType: 'IP',
        title: 'Intellectual Property',
        titleAr: 'الملكية الفكرية',
        titleFr: 'Propriété intellectuelle',
        content: 'IP created specifically for the Client belongs to the Client. Pre-existing IP remains with Service Provider.',
        contentAr: 'الملكية الفكرية المُنشأة خصيصاً للعميل تخص العميل. الملكية الفكرية الموجودة مسبقاً تبقى مع مقدم الخدمة.',
        contentFr: 'La PI créée spécifiquement pour le Client appartient au Client. La PI préexistante reste au Prestataire.',
        isRequired: true,
        isEditable: false,
        order: 5,
      },
    ],
    defaultPenaltyClause: '0.5% per day delay on critical milestones - 0.5% يومياً تأخر في المعالم الحرجة',
    defaultWarrantyTerms: '90-day defect correction warranty - ضمان تصحيح العيوب لمدة 90 يوماً',
  };
}

function createNDATemplate(language: ContractLanguage): ContractTemplate {
  return {
    type: 'NON_DISCLOSURE',
    name: 'Non-Disclosure Agreement',
    nameAr: 'اتفاقية عدم الإفشاء',
    nameFr: 'Accord de confidentialité (NDA)',
    description: 'Standard NDA for protecting confidential business information',
    descriptionAr: 'اتفاقية عدم إفشاء قياسية لحماية معلومات العمل السرية',
    descriptionFr: 'NDA standard pour protéger les informations commerciales confidentielles',
    language,
    clauses: [
      {
        id: 'nda-01',
        clauseType: 'DEFINITION',
        title: 'Definition of Confidential Information',
        titleAr: 'تعريف المعلومات السرية',
        titleFr: 'Définition des informations confidentielles',
        content: '"Confidential Information" includes all non-public business, technical, financial information disclosed by either party.',
        contentAr: '"المعلومات السرية" تشمل جميع المعلومات التجارية والمالية والتقنية غير العامة المفصحة من أي طرف.',
        contentFr: '"Informations Confidentielles" inclut toutes les informations commerciales, techniques, financières non publiques divulguées par l\'une des parties.',
        isRequired: true,
        isEditable: false,
        order: 1,
      },
      {
        id: 'nda-02',
        clauseType: 'OBLIGATIONS',
        title: 'Confidentiality Obligations',
        titleAr: 'التزامات السرية',
        titleFr: 'Obligations de confidentialité',
        content: 'Receiving Party must: (a) use same care as its own confidential info; (b) disclose only to need-to-know personnel; (c) return/destroy upon termination.',
        contentAr: 'يجب على الطرف المستلم: (أ) استخدام نفس العناية بمعلوماته السرية؛ (ب) الإفصاح فقط للموظفين الذين يحتاجون المعرفة؛ (ج) الإعادة/التدمير عند الإنتهاء.',
        contentFr: 'Le Partie Réceptrice doit : (a) utiliser les mêmes soins que ses propres informations confidentielles ; (b) divulguer uniquement au personnel besoin de savoir ; (c) retourner/détruire à la résiliation.',
        isRequired: true,
        isEditable: false,
        order: 2,
      },
      {
        id: 'nda-03',
        clauseType: 'EXCEPTIONS',
        title: 'Exceptions',
        titleAr: 'استثناءات',
        titleFr: 'Exceptions',
        content: 'Obligations do not apply to: publicly available info; independently developed; required by law or court order.',
        contentAr: 'لا تنطبق الالتزامات على: المعلومات المتاحة للجمهور؛ المطورة بشكل مستقل؛ المطلوبة قانوناً أو بأمر محكمة.',
        contentFr: 'Les obligations ne s\'appliquent pas aux : informations publiquement disponibles ; développées indépendamment ; requises par la loi ou ordonnance judiciaire.',
        isRequired: true,
        isEditable: false,
        order: 3,
      },
      {
        id: 'nda-04',
        clauseType: 'DURATION',
        title: 'Duration',
        titleAr: 'المدة',
        titleFr: 'Durée',
        content: 'This NDA remains in effect for {{nda_duration}} years from the effective date, or until the information becomes public knowledge.',
        contentAr: 'تبقى هذه الاتفاقية سارية المفعول لمدة {{nda_duration}} سنة من تاريخ السريان، أو حتى تصبح المعلومات علنية.',
        contentFr: 'Le présent NDA reste en vigueur pour une durée de {{nda_duration}} ans à compter de la date d\'effet, ou jusqu\'à ce que l\'information devienne publique.',
        isRequired: true,
        isEditable: true,
        order: 4,
      },
      {
        id: 'nda-05',
        clauseType: 'PENALTY',
        title: 'Breach Consequences',
        titleAr: 'عواقب الاخلال',
        titleFr: 'Conséquences de la violation',
        content: 'Unauthorized disclosure may result in injunctive relief and damages, without prejudice to other legal remedies available.',
        contentAr: 'قد يؤدي الإفصاح غير المصرح به إلى إنصاف قضائي وأضرار، دون المساس بالعلاج القانوني الآخر المتاح.',
        contentFr: 'La divulgation non autorisée peut entraîner des mesures conservatoires et dommages, sans préjudice des autres recours juridiques disponibles.',
        isRequired: true,
        isEditable: false,
        order: 5,
      },
    ],
    defaultPenaltyClause: 'Liquidated damages as determined by court - أضرار تحديدية حسب ما تحدده المحكمة',
    defaultWarrantyTerms: 'N/A - غير متوفر',
  };
}

function createDistributionAgreementTemplate(language: ContractLanguage): ContractTemplate {
  return {
    type: 'DISTRIBUTION_AGREEMENT',
    name: 'Distribution Agreement',
    nameAr: 'اتفاقية التوزيع',
    nameFr: 'Contrat de distribution',
    description: 'Exclusive/non-exclusive distribution rights for products in defined territory',
    descriptionAr: 'حقوق توزيع حصرية/غير حصرية للمنتجات في منطقة محددة',
    descriptionFr: 'Droits de distribution exclusifs/non exclusifs pour produits sur un territoire défini',
    language,
    clauses: [
      {
        id: 'dist-01',
        clauseType: 'TERRITORY',
        title: 'Territory',
        titleAr: 'المنطقة',
        titleFr: 'Territoire',
        content: 'Distributor is granted {{exclusive_text}} distribution rights for the Products within {{territory}} territory.',
        contentAr: 'يمنح الموزع حقوق توزيع {{exclusive_text}} للمنتجات داخل منطقة {{territory}}.',
        contentFr: 'Le Distributeur se voit accorder des droits de distribution {{exclusive_text}} pour les Produits sur le territoire {{territory}}.',
        isRequired: true,
        isEditable: true,
        order: 1,
      },
      {
        id: 'dist-02',
        clauseType: 'MARGIN',
        title: 'Profit Margin',
        titleAr: 'هامش الربح',
        titleFr: 'Marge bénéficiaire',
        content: 'Distributor receives a discount of {{discount_percent}}% off list price, enabling resale margin.',
        contentAr: 'يحصل الموزع على خصم {{discount_percent}}% من سعر القائمة، مما يتيح هامش إعادة البيع.',
        contentFr: 'Le Distributeur reçoit une remise de {{discount_percent}% sur le prix catalogue, permettant une marge de revente.',
        isRequired: true,
        isEditable: true,
        order: 2,
      },
      {
        id: 'dist-03',
        clauseType: 'TARGETS',
        title: 'Sales Targets',
        titleAr: 'أهداف المبيعات',
        titleFr: 'Objectifs de vente',
        content: 'Minimum annual sales target of {{annual_target}} {{currency}}, subject to review and adjustment annually.',
        contentAr: 'هدف مبيعات سنوي أدنى يبلغ {{annual_target}} {{currency}}، خاضع للمراجعة والتعديل سنوياً.',
        contentFr: 'Objectif de ventes annuel minimum de {{annual_target}} {{currency}}, soumis à révision et ajustement annuel.',
        isRequired: true,
        isEditable: true,
        order: 3,
      },
      {
        id: 'dist-04',
        clauseType: 'MARKETING',
        title: 'Marketing Support',
        titleAr: 'الدعم التسويقي',
        titleFr: 'Support marketing',
        content: 'Supplier will provide marketing materials worth up to {{marketing_budget}} {{currency}} per year and co-branding approval.',
        contentAr: 'سيوفر المورد مواد تسويقية تصل قيمتها إلى {{marketing_budget}} {{currency}} سنوياً والموافقة على العلامة التجارية المشتركة.',
        contentFr: 'Le Fournisseur fournira des matériaux marketing d\'une valeur allant jusqu\'à {{marketing_budget}} {{currency}} par an et approbation de co-marque.',
        isRequired: false,
        isEditable: true,
        order: 4,
      },
      {
        id: 'dist-05',
        clauseType: 'TERMINATION',
        title: 'Termination Rights',
        titleAr: 'حقوق الإنهاء',
        titleFr: 'Droits de résiliation',
        content: 'Either party may terminate with {{termination_notice}} days written notice. Immediate termination for material breach after cure period.',
        contentAr: 'يمكن لأي طرف إنهاء الاتفاقية بإشعار كتابي {{termination_notice}} يوماً. إنهاء فوري للاخلال الجوهري بعد فترة التصحيح.',
        contentFr: 'Chaque partie peut résilier avec un préavis écrit de {{termination_notice}} jours. Résiliation immédiate pour violation matérielle après période de guérison.',
        isRequired: true,
        isEditable: true,
        order: 5,
      },
    ],
    defaultPenaltyClause: 'Forfeiture of unsold inventory discount - مصادرة خصم المخزون غير المباع',
    defaultWarrantyTerms: 'Pass-through manufacturer warranty - ضمان الصانع المنقول',
  };
}

function createExclusivityTemplate(language: ContractLanguage): ContractTemplate {
  return {
    type: 'EXCLUSIVITY',
    name: 'Exclusivity Agreement',
    nameAr: 'اتفاقية الحصرية',
    nameFr: "Clause d'exclusivité",
    description: 'Exclusive dealing arrangement for specific products or territories',
    descriptionAr: 'ترتيب تعامل حصري لمنتجات أو مناطق محددة',
    descriptionFr: "Arrangement d'exclusivité pour des produits ou territoires spécifiques",
    language,
    clauses: [
      {
        id: 'excl-01',
        clauseType: 'SCOPE',
        title: 'Exclusivity Scope',
        titleAr: 'نطاق الحصرية',
        titleFr: "Périmètre de l'exclusivité",
        content: '{{partyA}} grants {{partyB}} exclusive rights to sell/purchase {{product_scope}} within {{territory_scope}}.',
        contentAr: 'يمنح {{partyA}} {{partyB}} حقوقاً حصرية للبيع/شراء {{product_scope}} ضمن {{territory_scope}}.',
        contentFr: '{{partyA}} accorde à {{partyB}} les droits exclusifs de vendre/acheter {{product_scope}} dans {{territory_scope}}.',
        isRequired: true,
        isEditable: true,
        order: 1,
      },
      {
        id: 'excl-02',
        clauseType: 'COMMITMENT',
        title: 'Volume Commitment',
        titleAr: 'التزام بالحجم',
        titleFr: 'Engagement de volume',
        content: 'Buyer commits to minimum purchases of {{min_volume}} units/value per {{period}} during exclusivity period.',
        contentAr: 'يلتزم المشتري بشراء أدنى يبلغ {{min_volume}} وحدة/قيمة لكل {{period}} خلال فترة الحصرية.',
        contentFr: "L'Acheteur s'engage à des achats minimums de {{min_volume}} unités/valeur par {{période}} pendant la période d'exclusivité.",
        isRequired: true,
        isEditable: true,
        order: 2,
      },
      {
        id: 'excl-03',
        clauseType: 'PROTECTION',
        title: 'Exclusivity Protection',
        titleAr: 'حماية الحصرية',
        titleFr: 'Protection de l\'exclusivité',
        content: 'Supplier will not appoint other distributors/buyers for covered products in the agreed territory.',
        contentAr: 'لن يعين المورد موزعين/مشترين آخرين للمنتجات المغطاة في المنطقة المتفق عليها.',
        contentFr: 'Le Fournisseur ne nommera pas d\'autres distributeurs/acheteurs pour les produits couverts dans le territoire convenu.',
        isRequired: true,
        isEditable: false,
        order: 3,
      },
      {
        id: 'excl-04',
        clauseType: 'PERFORMANCE',
        title: 'Performance Review',
        titleAr: 'مراجعة الأداء',
        titleFr: 'Revue de performance',
        content: 'Performance reviewed quarterly. Exclusivity may be terminated if targets missed for {{consecutive_periods}} consecutive periods.',
        contentAr: 'مراجعة الأداء ربع سنوية. يمكن إنهاء الحصرية إذا تم تفويت الأهداف لـ {{consecutive_periods}} فترات متتالية.',
        contentFr: 'Revue de performance trimestrielle. L\'exclusivité peut être résiliée si les objectifs manqués pendant {{consecutive_periods}} périodes consécutives.',
        isRequired: true,
        isEditable: true,
        order: 4,
      },
    ],
    defaultPenaltyClause: 'Damages for breach equal to estimated lost profits - أضرار الاخلال تساوي الأرباح المفقودة المقدرة',
    defaultWarrantyTerms: 'As per underlying agreement - وفقاً للاتفاقية الأساسية',
  };
}

function createFrameworkAgreementTemplate(language: ContractLanguage): ContractTemplate {
  return {
    type: 'FRAMEWORK_AGREEMENT',
    name: 'Framework Agreement',
    nameAr: 'اتفاقية إطار',
    nameFr: 'Accord-cadre',
    description: 'Master framework for multiple future transactions under agreed terms',
    descriptionAr: 'إطار رئيسي لمعاملات مستقبلية متعددة بشروط متفق عليها',
    descriptionFr: 'Cadre principal pour multiples transactions futures selon termes convenus',
    language,
    clauses: [
      {
        id: 'fw-01',
        clauseType: 'PURPOSE',
        title: 'Framework Purpose',
        titleAr: 'غرض الإطار',
        titleFr: "Objet du cadre",
        content: 'This Framework Agreement establishes general terms for future orders between the parties without requiring separate contract negotiations.',
        contentAr: 'تنشئ هذه اتفاقية الإطار شروطاً عامة لأوامر مستقبلية بين الأطراف دون الحاجة إلى مفاوضات عقود منفصلة.',
        contentFr: 'Le présent Accord-cadre établit les termes généraux pour les commandes futures entre les parties sans nécessiter de négociations contractuelles séparées.',
        isRequired: true,
        isEditable: false,
        order: 1,
      },
      {
        id: 'fw-02',
        clauseType: 'ORDERS',
        title: 'Order Process',
        titleAr: 'عملية الطلب',
        titleFr: "Processus de commande",
        content: 'Orders placed via platform with automatic confirmation. Each order forms a separate binding contract incorporating these framework terms.',
        contentAr: 'الطلبات الموضوعة عبر المنصة مع تأكيد تلقائي. كل طلب يشكل عقداً منفصلاً ملزماً يتضمن شروط الإطار هذه.',
        contentFr: 'Les commandes passées via plateforme avec confirmation automatique. Chaque commande forme un contrat séparé liant intégrant ces termes-cadres.',
        isRequired: true,
        isEditable: false,
        order: 2,
      },
      {
        id: 'fw-03',
        clauseType: 'PRICING',
        title: 'Pricing Mechanism',
        titleAr: 'آلية التسعير',
        titleFr: 'Mécanisme de tarification',
        content: 'Prices based on published price list or negotiated rates as specified in Schedule F, valid for {{pricing_validity}} months.',
        contentAr: 'الأسعار بناءً على قائمة أسعار منشورة أو أسعار مفاوض عليها كما هو محدد في الملخص F، صالحة لمدة {{pricing_validity}} شهراً.',
        contentFr: 'Les prix basés sur liste de prix publiée ou tarifs négociés comme spécifié à l\'Annexe F, valables pour {{pricing_validity}} mois.',
        isRequired: true,
        isEditable: true,
        order: 3,
      },
      {
        id: 'fw-04',
        clauseType: 'VOLUME',
        title: 'Volume Tiers',
        titleAr: 'مستويات الحجم',
        titleFr: 'Paliers de volume',
        content: 'Tiered pricing applies: Tier 1 ({{tier1_min}}+ units), Tier 2 ({{tier2_min}}+), Tier 3 ({{tier3_min}}+) with progressive discounts.',
        contentAr: 'تسعير متدرج ينطبق: المستوى 1 ({{tier1_min}}+ وحدة)، المستوى 2 ({{tier2_min}}+)، المستوى 3 ({{tier3_min}}+) مع خصومات تدريجية.',
        contentFr: 'Tarification par paliers appliquée : Palier 1 ({{tier1_min}}+ unités), Palier 2 ({{tier2_min}}+), Palier 3 ({{tier3_min}}+) avec remises progressives.',
        isRequired: false,
        isEditable: true,
        order: 4,
      },
      {
        id: 'fw-05',
        clauseType: 'DURATION',
        title: 'Framework Validity',
        titleAr: 'صلاحية الإطار',
        titleFr: 'Validité du cadre',
        content: 'This Framework Agreement is valid for {{framework_duration}} years, automatically renewable unless terminated with {{notice_period}} months notice.',
        contentAr: 'هذه اتفاقية الإطار صالحة لمدة {{framework_duration}} سنة، قابلة للتجديد التلقائي ما لم يتم إنهاؤها بإشعار {{notice_period}} شهراً.',
        contentFr: 'Le présent Accord-cadre est valable pour une durée de {{framework_duration}} ans, renouvelable automatiquement sauf résiliation avec un préavis de {{notice_period}} mois.',
        isRequired: true,
        isEditable: true,
        order: 5,
      },
    ],
    defaultPenaltyClause: 'As per individual order terms - وفقاً لشروط كل طلب',
    defaultWarrantyTerms: 'As per product specification - وفقاً لمواصفات المنتج',
  };
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export function getContractTemplate(
  type: ContractType,
  language: ContractLanguage = 'BILINGUAL'
): ContractTemplate {
  switch (type) {
    case 'SALES_AGREEMENT':
      return createSalesAgreementTemplate(language);
    case 'SUPPLY_CONTRACT':
      return createSupplyContractTemplate(language);
    case 'SERVICE_AGREEMENT':
      return createServiceAgreementTemplate(language);
    case 'NON_DISCLOSURE':
      return createNDATemplate(language);
    case 'DISTRIBUTION_AGREEMENT':
      return createDistributionAgreementTemplate(language);
    case 'EXCLUSIVITY':
      return createExclusivityTemplate(language);
    case 'FRAMEWORK_AGREEMENT':
      return createFrameworkAgreementTemplate(language);
    default:
      return createSalesAgreementTemplate(language);
  }
}

/**
 * Get all available contract types
 * الحصول على جميع أنواع العقود المتاحة
 */
export function getAvailableContractTypes(): { 
  value: ContractType; 
  label: string; 
  ar: string; 
  fr: string;
  description: string;
}[] {
  return [
    {
      value: 'SALES_AGREEMENT',
      label: 'Sales Agreement',
      ar: 'اتفاقية البيع',
      fr: 'Contrat de vente',
      description: 'Standard product sale contract',
    },
    {
      value: 'SUPPLY_CONTRACT',
      label: 'Supply Contract',
      ar: 'عقد التوريد',
      fr: 'Contrat de fourniture',
      description: 'Ongoing supply arrangement',
    },
    {
      value: 'SERVICE_AGREEMENT',
      label: 'Service Agreement',
      ar: 'اتفاقية الخدمات',
      fr: 'Contrat de prestation',
      description: 'Professional services contract',
    },
    {
      value: 'DISTRIBUTION_AGREEMENT',
      label: 'Distribution Agreement',
      ar: 'اتفاقية التوزيع',
      fr: 'Contrat de distribution',
      description: 'Distribution rights contract',
    },
    {
      value: 'NON_DISCLOSURE',
      label: 'NDA / Confidentiality',
      ar: 'اتفاقية عدم الإفشاء',
      fr: 'NDA / Confidentialité',
      description: 'Protect confidential information',
    },
    {
      value: 'EXCLUSIVITY',
      label: 'Exclusivity Agreement',
      ar: 'اتفاقية الحصرية',
      fr: "Clause d'exclusivité",
      description: 'Exclusive dealing rights',
    },
    {
      value: 'FRAMEWORK_AGREEMENT',
      label: 'Framework Agreement',
      ar: 'اتفاقية إطار',
      fr: 'Accord-cadre',
      description: 'Master terms for multiple orders',
    },
  ];
}
