// Partnership / Framework Agreement Template
// قالب اتفاقية الشراكة / اتفاقية إطار
// Modèle d'accord-cadre / partenariat

import type { ContractTemplate, ContractClause } from '../config';
import { getClausesByCategory } from '../config';

export function createPartnershipTemplate(language: 'AR' | 'FR' | 'BILINGUAL' = 'BILINGUAL'): ContractTemplate {
  const partiesClauses = getClausesByCategory('parties');
  const subjectClauses = getClausesByCategory('subject-matter');
  const paymentClauses = getClausesByCategory('payment').filter(c => 
    ['clause-payment-01', 'clause-payment-02'].includes(c.id)
  );
  const disputeClauses = getClausesByCategory('dispute-resolution');
  const generalClauses = getClausesByCategory('general');

  // Partnership-specific clauses
  const partnershipSpecificClauses: ContractClause[] = [
    {
      id: 'partner-clause-01',
      clauseType: 'PURPOSE',
      title: 'Purpose of Partnership',
      titleAr: 'غرض الشراكة',
      titleFr: 'Objet du partenariat',
      content: 'The Parties agree to collaborate for the purpose of {{partnership_purpose}}, combining their respective expertise, resources, and market presence to achieve mutual business objectives in Algeria.',
      contentAr: 'يتفق الأطراف على التعاون لغرض {{partnership_purpose}}، مع دمج خبراتهم ومواردهم وحضورهم في السوق على التوالي لتحقيق أهداف أعمال مشتركة في الجزائر.',
      contentFr: 'Les Parties conviennent de collaborer dans le but de {{partnership_purpose}}, combinant leurs expertises, ressources et présences respectives sur le marché pour atteindre des objectifs commerciaux mutuels en Algérie.',
      isRequired: true,
      isEditable: true,
      order: 3,
    },
    {
      id: 'partner-clause-02',
      clauseType: 'SCOPE_COLLABORATION',
      title: 'Scope of Collaboration',
      titleAr: 'نطاق التعاون',
      titleFr: 'Portée de la collaboration',
      content: 'Collaboration shall include but not be limited to: {{collaboration_areas}}. Specific projects under this framework shall be governed by separate work orders or project agreements referencing this Framework Agreement.',
      contentAr: 'يشمل التعاون ولكن لا يقتصر على: {{collaboration_areas}}. تخضع المشاريع المحددة بموجب هذا الإطار لأوامر عمل أو اتفاقات مشاريع منفصلة تشير إلى هذه الاتفاقية الإطار.',
      contentFr: 'La collaboration inclut mais n\'est pas limitée à : {{collaboration_areas}}. Les projets spécifiques dans le cadre du présent seront régis par des ordres de travail ou accords de projet distincts référençant le présent Accord-cadre.',
      isRequired: true,
      isEditable: true,
      order: 4,
    },
    {
      id: 'partner-clause-03',
      clauseType: 'CONTRIBUTIONS',
      title: 'Contributions of Each Party',
      titleAr: 'مساهمات كل طرف',
      titleFr: 'Apports de chaque partie',
      content: 'Each Party shall contribute to the partnership as follows:\nParty A: {{partyA_contributions}}\nParty B: {{partyB_contributions}}',
      contentAr: 'يساهم كل طرف في الشراكة على النحو التالي:\nالطرف أ: {{partyA_contributions}}\nالطرف ب: {{partyB_contributions}}',
      contentFr: 'Chaque Partie contribuera au partenariat comme suit :\nPartie A : {{partyA_contributions}}\nPartie B : {{partyB_contributions}}',
      isRequired: true,
      isEditable: true,
      order: 5,
    },
    {
      id: 'partner-clause-04',
      clauseType: 'GOVERNANCE',
      title: 'Governance Structure',
      titleAr: 'هيكل الحوكمة',
      titleFr: 'Structure de gouvernance',
      content: 'A Joint Steering Committee comprising {{committee_composition}} representatives from each party shall meet {{meeting_frequency}} to review progress, approve major decisions, and resolve disputes. Decisions require {{decision_threshold}} approval.',
      contentAr: 'تكون لجنة توجيه مشتركة تتكون من {{committee_composition}} ممثلين من كل طرف تجتمع {{meeting_frequency}} لمراجعة التقدم والموافقة على القرارات الرئيسية وحل النزاعات. تتطلب القرارات موافقة {{decision_threshold}}.',
      contentFr: 'Un Comité de Pilotage conjoint composé de {{committee_composition}} représentants de chaque partie se réunira {{meeting_frequency}} pour examiner l\'approuver les décisions majeures et résoudre les litiges. Les décisions requièrent une approbation {{decision_threshold}}.',
      isRequired: true,
      isEditable: true,
      order: 6,
    },
    {
      id: 'partner-clause-05',
      clauseType: 'INTELLECTUAL_PROPERTY_JOINT',
      title: 'Joint Intellectual Property',
      titleAr: 'الملكية الفكرية المشتركة',
      titleFr: 'Propriété intellectuelle conjointe',
      content: 'IP created jointly during the partnership shall be jointly owned by both parties. Pre-existing IP remains with its original owner. Licensing terms for use of joint IP in other contexts shall be negotiated in good faith.',
      contentAr: 'الملكية الفكرية المشتركة المنشأة خلال الشراكة تكون مملوكة بشكل مشترك من كلا الطرفين. تبقى الملكية الفكرية الموجودة مسبقاً مع صاحبها الأصلي. يتم التفاوض على شروط الترخيص لاستخدام الملكية الفكرية المشتركة في سياقات أخرى بحسن نية.',
      contentFr: 'La PI créée conjointement pendant le partenariat sera copropriété des deux parties. La PI préexistante reste chez son propriétaire initial. Les conditions de licence pour l\'utilisation de la PI conjointe dans d\'autres contextes seront négociées de bonne foi.',
      isRequired: true,
      isEditable: true,
      order: 7,
    },
    {
      id: 'partner-clause-06',
      clauseType: 'CONFIDENTIALITY_PARTNERSHIP',
      title: 'Mutual Confidentiality',
      titleAr: 'سرية متبادلة',
      titleFr: 'Confidentialité réciproque',
      content: 'Both parties agree to maintain strict confidentiality regarding all business information, technical data, and strategic plans shared during this partnership, for a period of five (5) years after termination.',
      contentAr: 'يوافق كلا الطرفين على الحفاظ على سرية صارمة بخصوص جميع معلومات الأعمال والبيانات التقنية والخطط الاستراتيجية المشاركة خلال هذه الشراكة، لمدة خمس (5) سنوات بعد الإنهاء.',
      contentFr: 'Les deux parties conviennent de maintenir une stricte confidentialité concernant toutes les informations commerciales, données techniques et plans stratégiques partagés durant ce partenariat, pour une période de cinq (5) ans après résiliation.',
      isRequired: true,
      isEditable: false,
      order: 8,
    },
    {
      id: 'partner-clause-07',
      clauseType: 'TERM_PARTNERSHIP',
      title: 'Duration and Renewal',
      titleAr: 'المدة والتجديد',
      titleFr: 'Durée et renouvellement',
      content: 'This Framework Agreement shall remain in effect for an initial term of {{initial_term}} years, automatically renewable for successive {{renewal_term}} year periods unless either party provides written notice of non-renewal at least ninety (90) days before expiration.',
      contentAr: 'تبقى هذه الاتفاقية الإطار سارية المفعول لمدة أولية {{initial_term}} سنة، تتجدد تلقائياً لفترات متتابعة {{renewal_term}} سنة ما لم يقدم أي طرف إخطاراً كتابياً بعدم التجديد قبل تسعين (90) يوماً على الأقل من انتهاء الصلاحية.',
      contentFr: 'Le présent Accord-cadre reste en vigueur pour une durée initiale de {{initial_term}} ans, renouvelable automatiquement pour des périodes successives de {{renewal_term}} ans sauf si l\'une des parties donne un avis écrit de non-renouvellement au moins quatre-vingt-dix (90) jours avant l\'expiration.',
      isRequired: true,
      isEditable: true,
      order: 9,
    },
  ];

  return {
    type: 'FRAMEWORK_AGREEMENT',
    name: language === 'AR' ? 'اتفاقية الشراكة / اتفاقية إطار' : language === 'FR' ? 'Accord-cadre / Partenariat' : 'Framework Agreement / Partnership',
    nameAr: 'اتفاقية الشراكة / اتفاقية إطار',
    nameFr: 'Accord-cadre / Partenariat',
    description: 'Long-term strategic partnership or joint venture framework agreement',
    descriptionAr: 'اتفاقية إطار شراكة استراتيجية طويلة الأجل أو مشروع مشترك',
    descriptionFr: "Accord-cadre de partenariat stratégique long terme ou coentreprise",
    language,
    clauses: [
      ...partiesClauses,
      ...subjectClauses.slice(0, 1),
      ...partnershipSpecificClauses,
      ...paymentClauses,
      ...disputeClauses,
      ...generalClauses.filter(c => !['clause-termination-01', 'clause-termination-02'].includes(c.id)),
    ],
    defaultPenaltyClause: 'Material breach may result in immediate suspension or termination',
    defaultPenaltyClauseAr: 'قد يؤدي الإخلال الجوهري إلى تعليق فوري أو إنهاء',
    defaultPenaltyClauseFr: 'La violation matérielle peut entraîner la suspension immédiate ou la résiliation',
    defaultWarrantyTerms: 'Each party warrants quality of their contributions',
    defaultWarrantyTermsAr: 'يضمن كل طرف جودة مساهماته',
    defaultWarrantyTermsFr: 'Chaque partie garantit la qualité de ses apports',
    metadata: {
      category: 'PARTNERSHIP',
      typicalUseCases: ['Joint ventures', 'Strategic alliances', 'Technology partnerships', 'Market expansion'],
      typicalUseCasesAr: ['المشاريع المشتركة', 'التحالفات الاستراتيجية', 'شراكات التكنولوجيا', ' توسع السوق'],
      typicalUseCasesFr: ['Coentreprises', 'Alliances stratégiques', 'Partenariats technologiques', 'Expansion de marché'],
      algerianLawReferences: [
        'Commercial Code (Partnerships)',
        'Investment promotion regulations',
        'Law on Economic Partnerships',
      ],
    },
  };
}

export default createPartnershipTemplate;
