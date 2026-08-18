// Distribution Agreement Template
// قالب اتفاقية التوزيع
// Modèle de contrat de distribution

import type { ContractTemplate, ContractClause } from '../config';
import { getClausesByCategory } from '../config';

export function createDistributionTemplate(language: 'AR' | 'FR' | 'BILINGUAL' = 'BILINGUAL'): ContractTemplate {
  const partiesClauses = getClausesByCategory('parties');
  const subjectClauses = getClausesByCategory('subject-matter');
  const paymentClauses = getClausesByCategory('payment');
  const disputeClauses = getClausesByCategory('dispute-resolution');
  const terminationClauses = getClausesByCategory('termination');
  const generalClauses = getClausesByCategory('general');

  // Distribution-specific clauses
  const distributionSpecificClauses: ContractClause[] = [
    {
      id: 'dist-clause-01',
      clauseType: 'APPOINTMENT',
      title: 'Appointment as Distributor',
      titleAr: 'تعيين موزع',
      titleFr: 'Nomination comme distributeur',
      content: 'Supplier appoints Distributor as its {{exclusive_nonexclusive}} distributor for the Products in the Territory defined in Annex A, subject to the terms and conditions of this Agreement.',
      contentAr: 'يعين المورد الموزع كموزع {{exclusive_nonexclusive}} للمنتجات في الإقليم المحدد في الملخص أ، رهناً بشروط وأحكام هذه الاتفاقية.',
      contentFr: 'Le Fournisseur nomme le Distributeur en tant que son distributeur {{exclusive_nonexclusive}} des Produits sur le Territoire défini à l\'Annexe A, soumis aux termes et conditions du présent Contrat.',
      isRequired: true,
      isEditable: true,
      order: 3,
    },
    {
      id: 'dist-clause-02',
      clauseType: 'TERRITORY',
      title: 'Territorial Rights',
      titleAr: 'حقوق الإقليم',
      titleFr: 'Droits territoriaux',
      content: 'The Territory covered by this Agreement comprises: {{territory_description}}. Distributor shall not actively solicit customers outside the Territory without prior written consent from Supplier.',
      contentAr: 'يشمل الإقليم المغطى بهذه الاتفاقية: {{territory_description}}. لا يجوز للموزع استقطاب العملاء بنشاط خارج الإقليم دون موافقة كتابية مسبقة من المورد.',
      contentFr: 'Le Territoire couvert par le présent Contrat comprend : {{territory_description}}. Le Distributeur ne devra pas solliciter activement des clients en dehors du Territoire sans accord écrit préalable du Fournisseur.',
      isRequired: true,
      isEditable: true,
      order: 4,
    },
    {
      id: 'dist-clause-03',
      clauseType: 'PRICING',
      title: 'Pricing and Discounts',
      titleAr: 'التسعير والخصومات',
      titleFr: 'Tarification et remises',
      content: 'Supplier shall provide price lists for Products. Distributor is entitled to a discount of {{discount_percentage}}% on list prices. Prices may be adjusted by Supplier with sixty (60) days written notice.',
      contentAr: 'يوفر المورد قوائم أسعار للمنتجات. يحق للموزع خصم {{discount_percentage}%} على الأسعار القائمة. يجوز للمورد تعديل الأسعار بإخطار كتابي خلال ستين (60) يوماً.',
      contentFr: 'Le Fournisseur fournira les listes de prix des Produits. Le Distributeur a droit à une remise de {{discount_percentage}}% sur les tarifs liste. Les prix peuvent être ajustés par le Fournisseur avec un préavis écrit de soixante (60) jours.',
      isRequired: true,
      isEditable: true,
      order: 5,
    },
    {
      id: 'dist-clause-04',
      clauseType: 'SALES_TARGETS',
      title: 'Sales Targets',
      titleAr: 'أهداف المبيعات',
      titleFr: 'Objectifs de vente',
      content: 'Distributor commits to achieving minimum annual purchase quantities/sales targets as set forth in Annex B for each contract year. Failure to meet targets may result in termination or conversion to non-exclusive status.',
      contentAr: 'يلتزم الموزع بتحقيق الحد الأدنى من الكميات المشتراة السنوية/أهداف المبيعات كما هو محدد في الملخص ب لكل سنة عقد. الفشل في تحقيق الأهداف قد يؤدي إلى إنهاء أو تحويل إلى وضع غير حصري.',
      contentFr: 'Le Distributeur s\'engage à atteindre les quantités d\'achat annuelles minimales/objectifs de vente définis à l\'Annexe B pour chaque année contractuelle. Le non-respect des objectifs peut entraîner la résiliation ou la conversion au statut non-exclusif.',
      isRequired: true,
      isEditable: true,
      order: 6,
    },
    {
      id: 'dist-clause-05',
      clauseType: 'MARKETING',
      title: 'Marketing and Promotion',
      titleAr: 'التسويق والترويج',
      titleFr: 'Marketing et promotion',
      content: 'Distributor shall devote adequate resources to marketing and promoting Products in the Territory, including participation in trade shows, advertising, and maintaining adequate inventory levels.',
      contentAr: 'يجب على الموزع تخصيص موارد كافية للتسويق والترويج للمنتجات في الإقليم، بما في ذلك المشاركة في المعارض التجارية والإعلان والحفاظ على مستويات مخزون كافية.',
      contentFr: 'Le Distributeur consacrera des ressources adéquates au marketing et à la promotion des Produits sur le Territoire, y compris la participation aux salons, la publicité et le maintien de niveaux de stock adéquats.',
      isRequired: false,
      isEditable: true,
      order: 7,
    },
    {
      id: 'dist-clause-06',
      clauseType: 'POST_TERMINATION',
      title: 'Post-Termination Obligations',
      titleAr: 'الالتزامات بعد الإنهاء',
      titleFr: 'Obligations post-résiliation',
      content: 'Upon termination, Distributor shall: (a) cease all use of Supplier trademarks within thirty (30) days; (b) return all unsold Products or purchase them at net cost; (c) fulfill pending customer orders if agreed.',
      contentAr: 'عند الإنهاء، يجب على الموزع: (أ) وقف جميع استخدامات علامات المورد التجارية خلال ثلاثين (30) يوماً؛ (ب) إرجاع جميع المنتجات غير المباعة أو شرائها بالتكلفة الصافية؛ (ج) تنفيذ طلبات العملاء المعلقة إذا تم الاتفاق.',
      contentFr: 'Lors de la résiliation, le Distributor devra : (a) cesser toute utilisation des marques du Fournisseur dans les trente (30) jours ; (b) retourner tous les produits invendus ou les acheter au coût net ; (c) honorer les commandes clients en cours si convenu.',
      isRequired: true,
      isEditable: true,
      order: 8,
    },
  ];

  return {
    type: 'DISTRIBUTION_AGREEMENT',
    name: language === 'AR' ? 'اتفاقية التوزيع' : language === 'FR' ? 'Contrat de distribution' : 'Distribution Agreement',
    nameAr: 'اتفاقية التوزيع',
    nameFr: 'Contrat de distribution',
    description: 'Comprehensive distribution agreement with territorial rights and sales targets',
    descriptionAr: 'اتفاقية توزيع شاملة مع حقوق إقليمية وأهداف مبيعات',
    descriptionFr: "Accord de distribution complet avec droits territoriaux et objectifs de vente",
    language,
    clauses: [
      ...partiesClauses,
      ...subjectClauses.slice(0, 1),
      ...distributionSpecificClauses,
      ...paymentClauses.filter(c => ['clause-payment-01', 'clause-payment-02'].includes(c.id)),
      ...disputeClauses,
      ...terminationClauses,
      ...generalClauses,
    ],
    defaultPenaltyClause: 'Breaches may result in loss of exclusivity or contract termination',
    defaultPenaltyClauseAr: 'قد يؤدي الإخلال إلى فقدان الحصرية أو إنهاء العقد',
    defaultPenaltyClauseFr: 'Les violations peuvent entraîner la perte d\'exclusivité ou la résiliation du contrat',
    defaultWarrantyTerms: 'Product warranties remain with Supplier; Distributor handles local service support',
    defaultWarrantyTermsAr: 'تبقى ضمانات المنتجات مع المورد؛ يتولى الموزع دعم الخدمة المحلي',
    defaultWarrantyTermsFr: 'Les garanties produit restent chez le Fournisseur ; le Distributeur gère le support service local',
    metadata: {
      category: 'PARTNERSHIP',
      typicalUseCases: ['Product distribution', 'Regional representation', 'Dealer networks'],
      typicalUseCasesAr: ['توزيع المنتجات', 'التمثيل الإقليمي', 'شبكات الوكلاء'],
      typicalUseCasesFr: ['Distribution de produits', 'Représentation régionale', 'Réseaux de concessionnaires'],
      algerianLawReferences: [
        'Commercial Code Articles 79-93 (Distribution)',
        'Competition Law provisions',
      ],
    },
  };
}

export default createDistributionTemplate;
