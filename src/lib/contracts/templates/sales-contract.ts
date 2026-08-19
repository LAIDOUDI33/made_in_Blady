// Sales Contract Template
// قالب عقد البيع
// Modèle de contrat de vente

import type { ContractTemplate, ContractClause } from '../config';
import { getClausesByCategory } from '../config';

export function createSalesContractTemplate(language: 'AR' | 'FR' | 'BILINGUAL' = 'BILINGUAL'): ContractTemplate {
  const partiesClauses = getClausesByCategory('parties');
  const subjectClauses = getClausesByCategory('subject-matter');
  const paymentClauses = getClausesByCategory('payment');
  const deliveryClauses = getClausesByCategory('delivery');
  const warrantyClauses = getClausesByCategory('warranty');
  const disputeClauses = getClausesByCategory('dispute-resolution');
  const terminationClauses = getClausesByCategory('termination');
  const generalClauses = getClausesByCategory('general');

  return {
    type: 'SALES_AGREEMENT',
    name: language === 'AR' ? 'اتفاقية البيع' : language === 'FR' ? 'Contrat de vente' : 'Sales Agreement',
    nameAr: 'اتفاقية البيع',
    nameFr: 'Contrat de vente',
    description: 'Standard sales agreement for product transactions compliant with Algerian Commercial Code',
    descriptionAr: 'اتفاقية بيع قياسية للمعاملات التجارية متوافقة مع القانون التجاري الجزائري',
    descriptionFr: "Contrat de vente standard pour les transactions commerciales conforme au Code de commerce algérien",
    language,
    clauses: [
      ...partiesClauses,
      ...subjectClauses,
      ...paymentClauses,
      ...deliveryClauses,
      ...warrantyClauses,
      ...disputeClauses,
      ...terminationClauses,
      ...generalClauses,
    ],
    defaultPenaltyClause: 'Late payment penalty of 1% per month of delay as per Article 524 of the Algerian Commercial Code',
    defaultPenaltyClauseAr: 'غرامة تأخير في الدفع بنسبة 1% شهرياً من مدة التأخير وفقاً للمادة 524 من القانون التجاري الجزائري',
    defaultPenaltyClauseFr: 'Pénalité de retard de paiement de 1% par mois de retard conformément à l\'article 524 du Code de commerce algérien',
    defaultWarrantyTerms: '12 months warranty from delivery date covering manufacturing defects',
    defaultWarrantyTermsAr: 'ضمان لمدة 12 شهراً من تاريخ التسليم يغطي عيوب التصنيع',
    defaultWarrantyTermsFr: 'Garantie de 12 mois à compter de la date de livraison couvrant les défauts de fabrication',
    // Template-specific metadata
    metadata: {
      category: 'SALES',
      typicalUseCases: ['Product sales', 'Equipment purchase', 'Raw materials supply'],
      typicalUseCasesAr: ['بيع المنتجات', 'شراء المعدات', 'توريد المواد الخام'],
      typicalUseCasesFr: ['Vente de produits', "Achat d'équipements", 'Fourniture de matières premières'],
      algerianLawReferences: [
        'Articles 388-396 Civil Code (Sale)',
        'Articles 523-525 Commercial Code (Payment terms)',
        'Law 09-03 Consumer Protection',
      ],
    },
  };
}

export default createSalesContractTemplate;
