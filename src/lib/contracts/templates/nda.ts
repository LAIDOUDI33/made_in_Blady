// Non-Disclosure Agreement (NDA) Template
// قالب اتفاقية عدم الإفصاح
// Modèle d'accord de confidentialité (NDA)

import type { ContractTemplate, ContractClause } from '../config';
import { getClausesByCategory } from '../config';

export function createNDATemplate(language: 'AR' | 'FR' | 'BILINGUAL' = 'BILINGUAL'): ContractTemplate {
  const partiesClauses = getClausesByCategory('parties');
  const disputeClauses = getClausesByCategory('dispute-resolution');
  const generalClauses = getClausesByCategory('general').filter(c => 
    ['clause-general-01', 'clause-general-02', 'clause-general-03'].includes(c.id)
  );

  // NDA-specific clauses
  const ndaSpecificClauses: ContractClause[] = [
    {
      id: 'nda-clause-01',
      clauseType: 'DEFINITION_CONFIDENTIAL',
      title: 'Definition of Confidential Information',
      titleAr: 'تعريف المعلومات السرية',
      titleFr: 'Définition des informations confidentielles',
      content: '"Confidential Information" means any information, technical data, trade secrets, know-how, customer lists, business plans, financial information, or other sensitive data disclosed by either party to the other, whether orally, in writing, or electronically, marked as confidential or reasonably understood to be confidential given the nature of the information.',
      contentAr: '"المعلومات السرية" تعني أي معلومات أو بيانات تقنية أو أسرار تجارية أو خبرة فنية أو قوائم عملاء أو خطط أعمال أو معلومات مالية أو بيانات حساسة أخرى يكشفها أي طرف للآخر، سواء شفهياً أو كتابياً أو إلكترونياً، موضحة كسرية أو يفهم بشكل معقول أنها سرية نظراً لطبيعة المعلومات.',
      contentFr: '"Informations confidentielles" désigne toute information, donnée technique, secret commercial, savoir-faire, listes clients, plans d\'affaires, informations financières ou autres données sensibles divulguées par l\'une des parties à l\'autre, que ce soit oralement, par écrit ou électroniquement, marquées comme confidentielles ou raisonnablement comprises comme telles compte tenu de la nature de l\'information.',
      isRequired: true,
      isEditable: true,
      order: 2,
    },
    {
      id: 'nda-clause-02',
      clauseType: 'OBLIGATIONS',
      title: 'Confidentiality Obligations',
      titleAr: 'التزامات السرية',
      titleFr: 'Obligations de confidentialité',
      content: 'The Receiving Party shall: (a) hold Confidential Information in strict confidence; (b) use Confidential Information only for the Purpose; (c) not disclose Confidential Information to third parties without prior written consent; (d) restrict access to employees with a need-to-know who are bound by confidentiality obligations; (e) protect Confidential Information with at least the same degree of care used for its own confidential information.',
      contentAr: 'يلتزم الطرف المستلم بـ: (أ) الاحتفاظ بالمعلومات السرية بسرية صارمة؛ (ب) استخدام المعلومات السرية فقط للغرض المحدد؛ (ج) عدم الإفصاح عن المعلومات السرية لأطراف ثالثة دون موافقة كتابية مسبقة؛ (د) تقييد الوصول للموظفين الذين لديهم حاجة للمعرفة وملتزمين بالتزامات السرية؛ (هـ) حماية المعلومات السرية بنفس درجة العناية على الأقل المستخدمة لمعلوماته السرية.',
      contentFr: 'La Partie Réceptrice s\'engage à : (a) maintenir les Informations Confidentielles dans la stricte confidentialité ; (b) utiliser les Informations Confidentielles uniquement pour l\'Objet ; (c) ne pas divulguer les Informations Confidentielles à des tiers sans consentement écrit préalable ; (d) limiter l\'accès aux employés ayant besoin de savoir et liés par des obligations de confidentialité ; (e) protéger les Informations Confidentielles avec au moins le même degré de soin que celui utilisé pour ses propres informations confidentielles.',
      isRequired: true,
      isEditable: true,
      order: 3,
    },
    {
      id: 'nda-clause-03',
      clauseType: 'EXCEPTIONS',
      title: 'Exceptions to Confidentiality',
      titleAr: 'استثناءات السرية',
      titleFr: 'Exceptions à la confidentialité',
      content: 'Obligations under this NDA do not apply to information that: (a) is or becomes publicly available through no fault of Receiving Party; (b) was already known to Receiving Party without restriction; (c) is independently developed by Receiving Party; (d) is rightfully received from a third party without confidentiality restrictions; (e) disclosure is required by law or court order, provided prompt written notice is given to Disclosing Party.',
      contentAr: 'لا تنطبق الالتزامات بموجب هذه الاتفاقية على المعلومات التي: (أ) هي أو أصبحت متاحة للجمهور دون خطأ من الطرف المستلم؛ (ب) كانت معروفة مسبقاً للطرف المستلم دون قيود؛ (ج) تم تطويرها بشكل مستقل من قبل الطرف المستلم؛ (د) تم استلامها بحق من طرف ثالث دون قيود سرية؛ (هـ) الإلزام بالإفصاح مطلوب قانوناً أو بأمر محكمة، شريطة تقديم إخطار كتابي فوري للطرف الكاشف.',
      contentFr: 'Les obligations au titre du présent Accord ne s\'appliquent pas aux informations qui : (a) sont ou deviennent publiques sans faute de la Partie Réceptrice ; (b) étaient déjà connues de la Partie Réceptrice sans restriction ; (c) sont développées indépendamment par la Partie Réceptrice ; (d) sont reçues légitimement d\'un tiers sans restriction de confidentialité ; (e) la divulgation est requise par la loi ou une ordonnance judiciaire, sous réserve d\'avis écrit prompt à la Partie Divulguante.',
      isRequired: true,
      isEditable: false,
      order: 4,
    },
    {
      id: 'nda-clause-04',
      clauseType: 'RETURN_DESTRUCTION',
      title: 'Return or Destruction of Information',
      titleAr: 'إرجاع أو تدمير المعلومات',
      titleFr: 'Restitution ou destruction des informations',
      content: 'Upon termination of this Agreement or at Disclosing Party\'s request, Receiving Party shall promptly return or certify destruction of all Confidential Information and copies thereof, including derivatives.',
      contentAr: 'عند إنهاء هذه الاتفاقية أو عند طلب الطرف الكاشف، يجب على الطرف المستلم إرجاع فوري أو شهادة تدمير جميع المعلومات السرية ونسخها، بما في ذلك المشتقات.',
      contentFr: 'Lors de la résolution du présent Accord ou sur demande de la Partie Divulguante, la Partie Réceptrice devra promptement restituer ou certifier la destruction de toutes les Informations Confidentielles et leurs copies, y compris les dérivés.',
      isRequired: true,
      isEditable: true,
      order: 5,
    },
    {
      id: 'nda-clause-05',
      clauseType: 'REMEDIES',
      title: 'Remedies for Breach',
      titleAr: 'العلاجات عند الإخلال',
      titleFr: 'Recours en cas de violation',
      content: 'The Parties acknowledge that breach of confidentiality provisions may cause irreparable harm. In addition to any legal remedies available, Disclosing Party shall be entitled to seek injunctive relief without proof of actual damages.',
      contentAr: 'يعترف الأطراف أن الإخلال بأحكام السرية قد يسبب ضرراً لا يمكن إصلاحه. بالإضافة إلى أي علاجات قانونية متاحة، يحق للطرف الكاشف طلب إنصاف قضائي دون إثبات الأضرار الفعلية.',
      contentFr: 'Les Parties reconnaissent que la violation des dispositions de confidentialité peut causer un dommage irréparable. En plus des recours juridiques disponibles, la Partie Divulguante sera en droit de demander une injonction sans preuve de dommages effectifs.',
      isRequired: true,
      isEditable: false,
      order: 6,
    },
  ];

  return {
    type: 'NON_DISCLOSURE',
    name: language === 'AR' ? 'اتفاقية عدم الإفصاح (NDA)' : language === 'FR' ? 'Accord de confidentialité (NDA)' : 'Non-Disclosure Agreement (NDA)',
    nameAr: 'اتفاقية عدم الإفصاح (NDA)',
    nameFr: 'Accord de confidentialité (NDA)',
    description: 'Comprehensive NDA template for protecting sensitive business information',
    descriptionAr: 'قالب اتفاقية عدم إفصاح شامل لحماية المعلومات التجارية الحساسة',
    descriptionFr: "Modèle d'accord de confidentialité complet pour protéger les informations commerciales sensibles",
    language,
    clauses: [
      ...partiesClauses,
      ...ndaSpecificClauses,
      ...disputeClauses,
      ...generalClauses,
    ],
    defaultPenaltyClause: 'N/A - Remedies include injunctive relief and damages',
    defaultPenaltyClauseAr: 'غير متاح - تشمل العلاجات الإنصاف القضائي والأضرار',
    defaultPenaltyClauseFr: 'N/A - Les recours incluent l\'injonction et les dommages-intérêts',
    defaultWarrantyTerms: 'N/A',
    defaultWarrantyTermsAr: 'غير متاح',
    defaultWarrantyTermsFr: 'N/A',
    metadata: {
      category: 'PROTECTION',
      typicalUseCases: ['Business partnerships', 'M&A discussions', 'Vendor negotiations', 'Employee agreements'],
      typicalUseCasesAr: ['شراكات الأعمال', 'مناقشات الاندماج والاستحواذ', 'مفاوضات الموردين', 'اتفاقيات الموظفين'],
      typicalUseCasesFr: ['Partenariats d\'affaires', 'Discussions de fusions-acquisitions', 'Négociations fournisseurs', 'Accords salariés'],
      algerianLawReferences: [
        'Civil Code Articles 97-115 (Obligations)',
        'Commercial Code Article 114 (Trade secrets)',
      ],
    },
  };
}

export default createNDATemplate;
