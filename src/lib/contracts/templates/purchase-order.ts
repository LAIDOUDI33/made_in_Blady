// Purchase Order / Supply Contract Template
// قالب أمر الشراء / عقد التوريد
// Modèle de bon de commande / contrat de fourniture

import type { ContractTemplate } from '../config';
import { getClausesByCategory } from '../config';

export function createPurchaseOrderTemplate(language: 'AR' | 'FR' | 'BILINGUAL' = 'BILINGUAL'): ContractTemplate {
  const partiesClauses = getClausesByCategory('parties');
  const subjectClauses = getClausesByCategory('subject-matter');
  const paymentClauses = getClausesByCategory('payment');
  const deliveryClauses = getClausesByCategory('delivery');
  const warrantyClauses = getClausesByCategory('warranty');
  const disputeClauses = getClausesByCategory('dispute-resolution');
  const generalClauses = getClausesByCategory('general');

  // Add PO-specific clauses
  const poSpecificClauses: ContractClause[] = [
    {
      id: 'po-clause-01',
      clauseType: 'ORDER_ACCEPTANCE',
      title: 'Order Acceptance',
      titleAr: 'قبول الطلب',
      titleFr: 'Acceptation de commande',
      content: 'This Purchase Order constitutes an offer to purchase. Acceptance occurs upon Supplier\'s written confirmation or commencement of performance.',
      contentAr: 'يشكل أمر الشراء هذا عرضاً للشراء. يتم القبول عند التأكيد الكتابي من المورد أو بدء التنفيذ.',
      contentFr: 'Le présent Bon de commande constitue une offre d\'achat. L\'acceptation intervient lors de la confirmation écrite du Fournisseur ou du début d\'exécution.',
      isRequired: true,
      isEditable: true,
      order: 3,
    },
    {
      id: 'po-clause-02',
      clauseType: 'QUANTITY_VARIATION',
      title: 'Quantity Variation',
      titleAr: 'تغير الكمية',
      titleFr: 'Variation de quantité',
      content: 'Buyer may vary the ordered quantity by up to {{quantity_variation}}% with fifteen (15) days prior notice, subject to supplier capacity confirmation.',
      contentAr: 'يجوز للمشتري تغيير الكمية المطلوبة بما يصل إلى {{quantity_variation}}% مع إخطار مسبق بخمسة عشر (15) يوماً، رهناً بتأكيد قدرة المورد.',
      contentFr: 'L\'Acheteur peut faire varier la quantité commandée jusqu\'à {{quantity_variation}}% avec un préavis de quinze (15) jours, sous réserve de confirmation de capacité du Fournisseur.',
      isRequired: false,
      isEditable: true,
      order: 4,
    },
    {
      id: 'po-clause-03',
      clauseType: 'INSPECTION',
      title: 'Inspection and Acceptance',
      titleAr: 'الفحص والقبول',
      titleFr: 'Inspection et acceptation',
      content: 'Buyer shall have {{inspection_period}} days from delivery to inspect goods and notify Supplier of any non-conformities. Failure to notify shall constitute acceptance.',
      contentAr: 'يكون للمشتري {{inspection_period}} يوماً من التسليم لفحص البضائع وإخطار المورد بأي عدم مطابقة. الفشل في الإخطار يشكل قبولاً.',
      contentFr: 'L\'Acheteur dispose de {{inspection_period}} jours à compter de la livraison pour inspecter les marchandises et notifier le Fournisseur de toute non-conformité. Le défaut de notification vaut acceptation.',
      isRequired: true,
      isEditable: true,
      order: 5,
    },
  ];

  return {
    type: 'SUPPLY_CONTRACT',
    name: language === 'AR' ? 'أمر الشراء / عقد التوريد' : language === 'FR' ? 'Bon de commande / Contrat de fourniture' : 'Purchase Order / Supply Contract',
    nameAr: 'أمر الشراء / عقد التوريد',
    nameFr: 'Bon de commande / Contrat de fourniture',
    description: 'Purchase order template for recurring supply agreements',
    descriptionAr: 'قالب أمر شراء لاتفاقيات التوريد المتكررة',
    descriptionFr: 'Modèle de bon de commande pour les accords de fourniture récurrents',
    language,
    clauses: [
      ...partiesClauses,
      ...subjectClauses.slice(0, 1),
      ...poSpecificClauses,
      ...paymentClauses,
      ...deliveryClauses,
      ...warrantyClauses,
      ...disputeClauses,
      ...generalClauses,
    ],
    defaultPenaltyClause: '1% monthly late payment penalty plus potential order cancellation after 60 days',
    defaultPenaltyClauseAr: 'غرامة تأخير شهرية 1% بالإضافة إلى إمكانية إلغاء الطلب بعد 60 يوماً',
    defaultPenaltyClauseFr: 'Pénalité mensuelle de retard de 1% plus annulation potentielle de la commande après 60 jours',
    defaultWarrantyTerms: 'Standard manufacturer warranty applies unless otherwise specified in product specifications',
    defaultWarrantyTermsAr: 'يطبق ضمان المصنع القياسي ما لم ينص على خلاف ذلك في مواصفات المنتج',
    defaultWarrantyTermsFr: 'La garantie constructeur standard s\'applique sauf spécification contraire dans les fiches techniques produit',
    metadata: {
      category: 'SALES',
      typicalUseCases: ['Recurring orders', 'Bulk purchases', 'Raw materials', 'Inventory restocking'],
      typicalUseCasesAr: ['الطلبات المتكررة', 'الشراء بالجملة', 'المواد الخام', 'إعادة تخزين المخزون'],
      typicalUseCasesFr: ['Commandes récurrentes', 'Achats en gros', 'Matières premières', 'Réapprovisionnement des stocks'],
      algerianLawReferences: [
        'Articles 71-78 Commercial Code (Supply contracts)',
        'Article 524 Late payment penalties',
      ],
    },
  };
}

export default createPurchaseOrderTemplate;
