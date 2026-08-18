// Exclusivity Agreement Template
// قالب اتفاقية الحصرية
// Modèle de clause d'exclusivité

import type { ContractTemplate, ContractClause } from '../config';
import { getClausesByCategory } from '../config';

export function createExclusivityTemplate(language: 'AR' | 'FR' | 'BILINGUAL' = 'BILINGUAL'): ContractTemplate {
  const partiesClauses = getClausesByCategory('parties');
  const subjectClauses = getClausesByCategory('subject-matter');
  const disputeClauses = getClausesByCategory('dispute-resolution');
  const generalClauses = getClausesByCategory('general').filter(c => 
    ['clause-general-01', 'clause-general-02', 'clause-general-03', 'clause-general-05'].includes(c.id)
  );

  // Exclusivity-specific clauses
  const exclusivitySpecificClauses: ContractClause[] = [
    {
      id: 'excl-clause-01',
      clauseType: 'GRANT_EXCLUSIVITY',
      title: 'Grant of Exclusive Rights',
      titleAr: 'منح حقوق حصرية',
      titleFr: 'Octroi de droits exclusifs',
      content: 'Grantor hereby grants Grantee exclusive rights to {{exclusivity_scope}} within the Territory of {{territory}} for the duration of this Agreement, subject to the terms herein.',
      contentAr: 'يمنح المانح هنا الحاصل على حقوق حصرية لـ {{exclusivity_scope}} ضمن إقليم {{territory}} لمدة هذه الاتفاقية، رهناً بالشروط هنا.',
      contentFr: 'L\'Octant confère ici à l\'Attributaire les droits exclusifs de {{exclusivity_scope}} sur le Territoire de {{territory}} pour la durée du présent Contrat, soumis aux conditions ci-après.',
      isRequired: true,
      isEditable: true,
      order: 2,
    },
    {
      id: 'excl-clause-02',
      clauseType: 'SCOPE_EXCLUSIVITY',
      title: 'Scope of Exclusivity',
      titleAr: 'نطاق الحصرية',
      titleFr: 'Portée de l\'exclusivité',
      content: 'Exclusivity covers: {{detailed_scope}}. Grantor agrees not to grant similar rights to any third party, nor itself engage in activities that would compete with Grantee\'s exclusive rights during the term.',
      contentAr: 'تشمل الحصرية: {{detailed_scope}}. يوافق المانح على عدم منح حقوق مماثلة لأي طرف ثالث، ولا الانخراط في أنشطة تنافس مع حقوق الحاصل الحصرية خلال المدة.',
      contentFr: 'L\'exclusivité couvre : {{detailed_scope}}. L\'Octant s\'engage à ne pas accorder de droits similaires à un tiers, ni à exercer d\'activités qui concurrenceraient les droits exclusifs de l\'Attributaire pendant la durée.',
      isRequired: true,
      isEditable: true,
      order: 3,
    },
    {
      id: 'excl-clause-03',
      clauseType: 'EXCLUSIVITY_PERIOD',
      title: 'Exclusivity Period',
      titleAr: 'فترة الحصرية',
      titleFr: 'Période d\'exclusivité',
      content: 'Exclusive rights shall commence on {{start_date}} and continue until {{end_date}}, unless earlier terminated according to the provisions hereof.',
      contentAr: 'تبدأ الحقوق الحصرية في {{start_date}} وتستمر حتى {{end_date}}، ما لم يتم إنهاؤها مبكراً وفقاً للأحكام هنا.',
      contentFr: 'Les droits exclusifs commenceront le {{start_date}} et se poursuivront jusqu\'au {{end_date}}, sauf résiliation antérieure conformément aux dispositions des présentes.',
      isRequired: true,
      isEditable: true,
      order: 4,
    },
    {
      id: 'excl-clause-04',
      clauseType: 'PERFORMANCE_OBLIGATIONS',
      title: 'Performance Obligations',
      titleAr: 'التزامات الأداء',
      titleFr: 'Obligations de performance',
      content: 'To maintain exclusivity, Grantee must achieve minimum performance metrics: {{performance_metrics}}. Failure to meet these obligations may result in conversion to non-exclusive status or termination upon {{notice_period}} days notice.',
      contentAr: 'للحفاظ على الحصرية، يجب على الحاصل تحقيق أدنى مقاييس أداء: {{performance_metrics}}. الفشل في الوفاء بهذه الالتزامات قد يؤدي إلى تحويل إلى وضع غير حصري أو إنهاء بعد إخطار {{notice_period}} يوم.',
      contentFr: 'Pour maintenir l\'exclusivité, l\'Attributaire doit atteindre les métriques de performance minimales : {{performance_metrics}}. Le défaut de remplir ces obligations peut entraîner la conversion au statut non-exclusif ou la résiliation après un préavis de {{notice_period}} jours.',
      isRequired: true,
      isEditable: true,
      order: 5,
    },
    {
      id: 'excl-clause-05',
      clauseType: 'COMPENSATION',
      title: 'Compensation for Exclusivity',
      titleAr: 'تعويض عن الحصرية',
      titleFr: 'Rémunération de l\'exclusivité',
      content: 'In consideration of exclusive rights granted, Grantee shall pay Grantor: {{compensation_terms}}. Payment schedule: {{payment_schedule}}.',
      contentAr: 'مقابل الحقوق الحصرية الممنوحة، يدفع الحاصل للمانح: {{compensation_terms}}. جدولة الدفع: {{payment_schedule}}.',
      contentFr: 'En contrepartie des droits exclusifs octroyés, l\'Attributaire paiera à l\'Octant : {{compensation_terms}}. Échéancier de paiement : {{payment_schedule}}.',
      isRequired: true,
      isEditable: true,
      order: 6,
    },
    {
      id: 'excl-clause-06',
      clauseType: 'NON_COMPETE',
      title: 'Non-Compete Obligation',
      titleAr: 'التزام عدم المنافسة',
      titleFr: 'Obligation de non-concurrence',
      content: 'During the exclusivity period and for {{non_compete_period}} months thereafter, Grantor shall not directly or indirectly engage in any business competing with the exclusive rights granted herein within the Territory.',
      contentAr: 'خلال فترة الحصرية ولمدة {{non_compete_period}} شهراً بعدها، لا يجوز للمانح الانخراط بشكل مباشر أو غير مباشر في أي عمل ينافس الحقوق الحصرية الممنوحة هنا داخل الإقليم.',
      contentFr: 'Pendant la période d\'exclusivité et pendant {{non_compete_period}} mois suivants, l\'Octant ne pourra pas directement ou indirectement exercer toute activité concurrente aux droits exclusifs octroyés aux présentes sur le Territoire.',
      isRequired: true,
      isEditable: true,
      order: 7,
    },
    {
      id: 'excl-clause-07',
      clauseType: 'TERMINATION_EXCLUSIVITY',
      title: 'Termination of Exclusivity',
      titleAr: 'إنهاء الحصرية',
      titleFr: 'Résiliation de l\'exclusivité',
      content: 'Either party may terminate exclusivity upon material breach by the other party with {{termination_notice}} days written notice. Upon termination, standard (non-exclusive) terms may apply unless otherwise agreed.',
      contentAr: 'يجوز لأي طرف إنهاء الحصرية عند إخلال جوهري من الطرف الآخر بإخطار كتابي {{termination_notice}} يوم. عند الإنهاء، قد تطبق الشروط القياسية (غير الحصرية) ما لم يتم الاتفاق على خلاف ذلك.',
      contentFr: 'Chaque partie peut résilier l\'exclusivité en cas de violation matérielle par l\'autre partie avec un préavis écrit de {{termination_notice}} jours. Lors de la résiliation, les conditions standards (non exclusives) peuvent s\'appliquer sauf accord contraire.',
      isRequired: true,
      isEditable: true,
      order: 8,
    },
  ];

  return {
    type: 'EXCLUSIVITY',
    name: language === 'AR' ? 'اتفاقية الحصرية' : language === 'FR' ? "Clause d'exclusivité" : 'Exclusivity Agreement',
    nameAr: 'اتفاقية الحصرية',
    nameFr: "Clause d'exclusivité",
    description: 'Exclusive rights agreement for products, territories, or market segments',
    descriptionAr: 'اتفاقية حقوق حصرية للمنتجات أو المناطق أو شرائح السوق',
    descriptionFr: "Accord de droits exclusifs pour les produits, territoires ou segments de marché",
    language,
    clauses: [
      ...partiesClauses,
      ...subjectClauses.slice(0, 1),
      ...exclusivitySpecificClauses,
      ...disputeClauses,
      ...generalClauses,
    ],
    defaultPenaltyClause: 'Breach of exclusivity entitles non-breaching party to damages and injunctive relief',
    defaultPenaltyClauseAr: 'إخلال الحصرية يحق للطرف غير المخالف الأضرار والإنصاف القضائي',
    defaultPenaltyClauseFr: 'La violation de l\'exclusivite donne droit à la partie non-violatrice aux dommages-intérêts et à l\'injonction',
    defaultWarrantyTerms: 'N/A - This is a rights-based agreement',
    defaultWarrantyTermsAr: 'غير متاح - هذه اتفاقية قائمة على الحقوق',
    defaultWarrantyTermsFr: 'N/A - Il s\'agit d\'un accord basé sur les droits',
    metadata: {
      category: 'PARTNERSHIP',
      typicalUseCases: ['Product exclusivity', 'Territorial exclusivity', 'Customer segment exclusivity'],
      typicalUseCasesAr: ['حصرية المنتج', 'حصرية الإقليم', 'حصرية شريحة العملاء'],
      typicalUseCasesFr: ['Exclusivité produit', 'Exclusivité territoriale', 'Exclusivité segment clientèle'],
      algerianLawReferences: [
        'Commercial Code (Exclusive agreements)',
        'Competition Law Article restrictions',
        'Civil Code (Contractual freedom limits)',
      ],
    },
  };
}

export default createExclusivityTemplate;
