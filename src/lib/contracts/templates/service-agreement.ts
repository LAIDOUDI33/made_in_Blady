// Service Agreement Template
// قالب اتفاقية الخدمات
// Modèle de contrat de prestation de services

import type { ContractTemplate, ContractClause } from '../config';
import { getClausesByCategory } from '../config';

export function createServiceAgreementTemplate(language: 'AR' | 'FR' | 'BILINGUAL' = 'BILINGUAL'): ContractTemplate {
  const partiesClauses = getClausesByCategory('parties');
  const subjectClauses = getClausesByCategory('subject-matter');
  const paymentClauses = getClausesByCategory('payment');
  const disputeClauses = getClausesByCategory('dispute-resolution');
  const terminationClauses = getClausesByCategory('termination');
  const generalClauses = getClausesByCategory('general');

  // Service-specific clauses
  const serviceSpecificClauses: ContractClause[] = [
    {
      id: 'service-clause-01',
      clauseType: 'SCOPE_OF_SERVICES',
      title: 'Scope of Services',
      titleAr: 'نطاق الخدمات',
      titleFr: 'Prestation des services',
      content: 'Service Provider agrees to provide the services described in Annex A ("Services") to Client in a professional and workmanlike manner, consistent with industry standards and applicable regulations in Algeria.',
      contentAr: 'يوافق مقدم الخدمة على تقديم الخدمات الموصوفة في الملحق أ ("الخدمات") للعميل بطريقة احترافية ومتقنة، متسقة مع معايير الصناعة واللوائح المطبقة في الجزائر.',
      contentFr: 'Le Prestataire de services s\'engage à fournir les services décrits à l\'Annexe A ("Prestations") au Client de manière professionnelle et soignée, conforme aux normes de l\'industrie et aux réglementations applicables en Algérie.',
      isRequired: true,
      isEditable: true,
      order: 3,
    },
    {
      id: 'service-clause-02',
      clauseType: 'DELIVERABLES',
      title: 'Deliverables and Milestones',
      titleAr: 'المخرجات والمراحل',
      titleFr: 'Livrables et jalons',
      content: 'Service Provider shall deliver the following deliverables according to the schedule set forth in Annex B: {{deliverables_list}}. Each deliverable shall be subject to Client acceptance within {{acceptance_period}} days of submission.',
      contentAr: 'يسلم مقدم الخدمة المخرجات التالية وفقاً للجدول الزمني المحدد في الملخص ب: {{deliverables_list}}. يكون كل مخرج خاضعاً لقبول العميل خلال {{acceptance_period}} يوماً من التقديم.',
      contentFr: 'Le Prestataire livrera les livrables suivants selon l\'échéancier défini à l\'Annexe B : {{deliverables_list}}. Chaque livrable sera soumis à l\'acceptation du Client dans un délai de {{acceptance_period}} jours suivant la soumission.',
      isRequired: true,
      isEditable: true,
      order: 4,
    },
    {
      id: 'service-clause-03',
      clauseType: 'STANDARDS',
      title: 'Performance Standards',
      titleAr: 'معايير الأداء',
      titleFr: 'Normes de performance',
      content: 'Services shall be performed in accordance with professional standards and specifications agreed upon by the parties. Service Provider warrants that all personnel assigned will possess necessary qualifications and experience.',
      contentAr: 'يتم أداء الخدمات وفقاً للمعايير والمواصفات المهنية المتفق عليها بين الأطراف. يضمن مقدم الخدمة أن جميع الموظفين المعينين يمتلكون المؤهلات والخبرة اللازمة.',
      contentFr: 'Les prestations seront effectuées conformément aux normes et spécifications professionnelles convenues entre les parties. Le Prestataire garantit que tout le personnel affecté possédera les qualifications et expériences nécessaires.',
      isRequired: true,
      isEditable: true,
      order: 5,
    },
    {
      id: 'service-clause-04',
      clauseType: 'INTELLECTUAL_PROPERTY',
      title: 'Intellectual Property Rights',
      titleAr: 'حقوق الملكية الفكرية',
      titleFr: 'Droits de propriété intellectuelle',
      content: '{{ip_ownership}}. For custom-developed deliverables, IP rights shall transfer to Client upon full payment. Pre-existing IP remains with Service Provider.',
      contentAr: '{{ip_ownership}}. بالنسبة للمخرجات المطورة خصيصاً، تنتقل حقوق الملكية الفكرية إلى العميل عند الدفع الكامل. تبقى الملكية الفكرية الموجودة مسبقاً مع مقدم الخدمة.',
      contentFr: '{{ip_ownership}}. Pour les livrables développés sur mesure, les droits de PI seront transférés au Client après paiement intégral. La PI préexistante reste au Prestataire.',
      isRequired: true,
      isEditable: true,
      order: 6,
    },
    {
      id: 'service-clause-05',
      clauseType: 'LIABILITY',
      title: 'Limitation of Liability',
      titleAr: 'تحديد المسؤولية',
      titleFr: 'Limitation de responsabilité',
      content: 'Service Provider\'s total liability under this Agreement shall not exceed {{liability_cap}} times the total contract value. Under no circumstances shall either party be liable for indirect, incidental, or consequential damages.',
      contentAr: 'لا تجاوز المسؤولية الإجمالية لمقدم الخدمة بموجب هذه الاتفاقية {{liability_cap}} مرات من إجمالي قيمة العقد. في أي حال من الأحوال لا يتحمل أي طرف مسؤولية الأضرار غير المباشرة أو العرضية أو التبعية.',
      contentFr: 'La responsabilité totale du Prestataire au titre du présent Contrat n\'excèdera pas {{liability_cap}} fois le montant total du contrat. En aucun cas aucune partie ne pourra être tenue responsable des dommages indirects, accessoires ou consécutifs.',
      isRequired: true,
      isEditable: true,
      order: 7,
    },
  ];

  return {
    type: 'SERVICE_AGREEMENT',
    name: language === 'AR' ? 'اتفاقية الخدمات' : language === 'FR' ? 'Contrat de prestation de services' : 'Service Agreement',
    nameAr: 'اتفاقية الخدمات',
    nameFr: 'Contrat de prestation de services',
    description: 'Professional service agreement with deliverables, milestones, and IP provisions',
    descriptionAr: 'اتفاقية خدمات مهنية مع المخرجات والمراحل وأحكام الملكية الفكرية',
    descriptionFr: 'Contrat de prestation professionnel avec livrables, jalons et dispositions PI',
    language,
    clauses: [
      ...partiesClauses,
      ...subjectClauses,
      ...serviceSpecificClauses,
      ...paymentClauses,
      ...disputeClauses,
      ...terminationClauses,
      ...generalClauses,
    ],
    defaultPenaltyClause: 'Late delivery penalty of 0.5% per day of delay, capped at 10% of milestone value',
    defaultPenaltyClauseAr: 'غرامة تأخير في التسليم بنسبة 0.5% يومياً من التأخير، بسقف 10% من قيمة المرحلة',
    defaultPenaltyClauseFr: 'Pénalité de retard de livraison de 0.5% par jour de retard, plafonnée à 10% de la valeur du jalon',
    defaultWarrantyTerms: '90-day defect rectification period for service deliverables',
    defaultWarrantyTermsAr: 'فترة تصحيح العيوب 90 يوماً لمخرجات الخدمات',
    defaultWarrantyTermsFr: 'Période de correction des défauts de 90 jours pour les livrables de services',
    metadata: {
      category: 'SERVICE',
      typicalUseCases: ['Consulting', 'IT development', 'Marketing services', 'Engineering', 'Legal services'],
      typicalUseCasesAr: ['الاستشارات', 'تطوير تكنولوجيا المعلومات', 'خدمات التسويق', 'الهندسة', 'الخدمات القانونية'],
      typicalUseCasesFr: ['Conseil', 'Développement IT', 'Services marketing', 'Ingénierie', 'Services juridiques'],
      algerianLawReferences: [
        'Civil Code Articles 544-594 (Services contracts)',
        'Commercial Code (Service providers)',
      ],
    },
  };
}

export default createServiceAgreementTemplate;
