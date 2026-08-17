// Chatbot Intents Definition
export interface Intent {
  id: string;
  category: 'product_search' | 'rfq' | 'pricing' | 'account' | 'payment' | 'shipping' | 'verification' | 'support' | 'greeting' | 'thanks' | 'goodbye' | 'fallback';
  patterns: RegExp[];
  examples: string[];
  priority: number; // Higher = checked first
  responseKey: string;
  suggestions?: string[];
}

// French language patterns for Algerian B2B marketplace
export const INTENTS: Intent[] = [
  // Greetings
  {
    id: 'greeting',
    category: 'greeting',
    patterns: [
      /^(bonjour|salut|hello|hi|bonsoir|cc|slt|bjr|bns|salam|a\s*salamou\s*alaykoum|aslk)\b/i,
      /^(ca\s*va|comment\s*allez\s*vous|comment\s*vas?\b)/i,
      /^(hey|yo|coucou)\b/i,
    ],
    examples: ['Bonjour', 'Salut, ça va ?', 'Salam, comment allez-vous ?', 'CC'],
    priority: 100,
    responseKey: 'greeting',
    suggestions: ['Rechercher un produit', 'Poster un appel d\'offres', 'Contacter le support'],
  },

  // Thanks
  {
    id: 'thanks',
    category: 'thanks',
    patterns: [
      /(merci|thank\s*you|thanks|baraka|barakallah|jazakallah|choukran)\b/i,
      /(c\'?est\s*gentil|sympa|super)\b.*\bmerci/i,
    ],
    examples: ['Merci pour votre aide', 'Barakallahufik', 'Merci beaucoup !', 'C\'est gentil merci'],
    priority: 95,
    responseKey: 'thanks',
    suggestions: ['Autre question', 'Fermer le chat'],
  },

  // Goodbye
  {
    id: 'goodbye',
    category: 'goodbye',
    patterns: [
      /^(au\s*revoir|bye|goodbye|a\+|à\s*bientôt|bonne\s*journée|bonne\s*soirée)\b/i,
      /(je\s*dois\s*y\s*aller|je\s*part|c\'?est\s*tout)\b/i,
    ],
    examples: ['Au revoir !', 'À bientôt', 'Bye', 'Bonne journée'],
    priority: 90,
    responseKey: 'goodbye',
    suggestions: [],
  },

  // Product Search
  {
    id: 'search_products',
    category: 'product_search',
    patterns: [
      /(?:cherche|rechercher|trouver|je\s*veux|je\s*cherche|j'ai\s*besoin\s*de|où\s*trouver)\b.+(?:produit|article|marchandise|matériel|fourniture)/i,
      /(?:cherche|rechercher|trouver|voir)\b.+(?:panneau\s*solaire|pompe|machine|outils?|matériaux?|acier|ciment|engrais)/i,
      /^(?:cherche|search|recherche)\b[:\s]+/i,
      /(?:avez\s*vous|tu\s*as)\b.+(?:ce\s*que|quelque\s*chose)\b/i,
    ],
    examples: [
      'Je cherche des panneaux solaires',
      'Chercher pompe industrielle',
      'J\'ai besoin de matériel de construction',
      'Où trouver du ciment ?',
      'Avez-vous des engrais ?',
    ],
    priority: 80,
    responseKey: 'search_products',
    suggestions: ['Voir les résultats', 'Affiner ma recherche', 'Poster un AO'],
  },

  // RFQ Help
  {
    id: 'post_rfq',
    category: 'rfq',
    patterns: [
      /(?:poster|publier|créer|déposer|lancer)\b.+(?:appel\s*d\'?offre|ao|demande\s*de\s*prix|devis|rfq|cotation)/i,
      /(?:comment\s*)(?:poster|publier|créer|faire)\b.+(?:ao|appel\s*d\'?offre|devis|demande)/i,
      /(?:appel\s*d\'?offre|ao|rfq|demande\s*de\s*prix|devis)\b.+(?:comment|comment\s*faire|aide)/i,
      /(?:demander|obtenir|avoir)\b.+(?:un\s*)?(devis|prix|cotation)/i,
    ],
    examples: [
      'Comment poster un appel d\'offres ?',
      'Je veux demander un devis',
      'Comment créer une demande de prix ?',
      'Aide pour poster un AO',
    ],
    priority: 75,
    responseKey: 'post_rfq',
    suggestions: ['Créer un AO maintenant', 'Voir les étapes', 'Exemple de AO'],
  },

  // Pricing
  {
    id: 'pricing_info',
    category: 'pricing',
    patterns: [
      /(?:prix|tarif|coût|combien|coûte|payer|abonnement|plan|pricing)\b/i,
      /(?:gratuit|free|essai|trial)\b/i,
      /(?:premium|professionnel|enterprise|entreprise)\b.+(?:prix|tarif|coût)/i,
    ],
    examples: [
      'Combien coûte l\'abonnement ?',
      'Tarifs premium',
      'Quels sont vos tarifs ?',
      'Est-ce gratuit ?',
    ],
    priority: 70,
    responseKey: 'pricing_info',
    suggestions: ['Voir les tarifs', 'Essai gratuit', 'Comparer les plans'],
  },

  // Account Help
  {
    id: 'account_help',
    category: 'account',
    patterns: [
      /(?:compte|profil|mon\s*compte|mon\s*profil)\b/i,
      /(?:inscription|s\'?inscrire|créer\s*un\s*compte|register|sign\s*up)\b/i,
      /(?:connexion|se\s*connecter|login|sign\s*in|mot\s*de\s*passe|password)\b/i,
      /(?:modifier|changer|mettre\s*à\s*jour|update)\b.+(?:compte|profil|email|téléphone)/i,
      /(?:oubli[ée]?\s*|perdu\s*|réinitialiser|reset)\b.+(?:mot\s*de\s*passe|mdp|password)/i,
    ],
    examples: [
      'J\'ai oublié mon mot de passe',
      'Comment modifier mon profil ?',
      'Comment m\'inscrire ?',
      'Problème de connexion',
    ],
    priority: 65,
    responseKey: 'account_help',
    suggestions: ['Réinitialiser MDP', 'Modifier mon profil', 'Créer un compte'],
  },

  // Payment Help
  {
    id: 'payment_help',
    category: 'payment',
    patterns: [
      /(?:paiement|payer|payment|paiment)\b/i,
      /(?:ccp|chèque\s*postal|baridimob|baridi|carte bancaire|cib|visa|mastercard)\b/i,
      /(?:virement|bank\s*transfer|transfer)\b/i,
      /(?:mode\s*de\s*(?:paiement|payment)|comment\s*payer)\b/i,
    ],
    examples: [
      'Comment payer avec BaridiMob ?',
      'Modes de paiement acceptés',
      'Comment faire un virement CCP ?',
      'Payer par carte bancaire',
    ],
    priority: 60,
    responseKey: 'payment_help',
    suggestions: ['BaridiMob', 'CCP', 'Carte Bancaire', 'Virement'],
  },

  // Shipping/Delivery
  {
    id: 'shipping_info',
    category: 'shipping',
    patterns: [
      /(?:livraison|expédition|délai|delivery|shipping)\b/i,
      /(?:transport|acheminement|envoi)\b/i,
      /(?:wilaya|ville|région|algérie|oran|alger|constantine|blida)\b.+(?:livraison|envoi|transport)/i,
      /(?:combien\s*de\s*temps|quand|délai)\b.+(?:recevoir|livrer|arriver)/i,
    ],
    examples: [
      'Quel est le délai de livraison à Oran ?',
      'Livrez-vous à toutes les wilayas ?',
      'Combien de temps pour recevoir ma commande ?',
      'Frais de livraison',
    ],
    priority: 55,
    responseKey: 'shipping_info',
    suggestions: ['Wilayas couvertes', 'Délais standards', 'Suivi commande'],
  },

  // Verification Help
  {
    id: 'verification_help',
    category: 'verification',
    patterns: [
      /(?:vérifier|certifier|vérification|certification|verified)\b/i,
      /(?:compte\s*vérifié|fournisseur\s*vérifié|supplier\s*verified)\b/i,
      /(?:documents|justificatif|preuve)\b.+(?:vérification|certification)/i,
      /(?:devenir|être)\b.+(?:vérifié|certifié|confié)\b/i,
    ],
    examples: [
      'Comment devenir fournisseur vérifié ?',
      'Quels documents pour la vérification ?',
      'Comment obtenir le badge vérifié ?',
      'Certification entreprise',
    ],
    priority: 50,
    responseKey: 'verification_help',
    suggestions: ['Documents requis', 'Processus de vérification', 'Avantages'],
  },

  // Contact Human Support
  {
    id: 'contact_human',
    category: 'support',
    patterns: [
      /(?:agent|humain|personne|opérateur|représendant|conseiller)\b/i,
      /(?:parler|talk|discuter|communiquer)\b.+(?:quelqu\'?un|agent|personne|humain)/i,
      /(?:transférer|mettre\s*en\s*relation|contacter)\b/i,
      /(?:support|assistance|aide)\b.+(?:humain|direct|vrai|réel)/i,
    ],
    examples: [
      'Je veux parler à un agent',
      'Me mettre en relation avec une personne',
      'Je préfère parler à un humain',
      'Contactez-moi avec un conseiller',
    ],
    priority: 45,
    responseKey: 'contact_human',
    suggestions: ['Ouvrir un ticket', 'Email support', 'Téléphone'],
  },
];

// Fallback intent - when nothing matches
export const FALLBACK_INTENT: Intent = {
  id: 'fallback',
  category: 'fallback',
  patterns: [/.*/], // Matches everything (lowest priority)
  examples: [],
  priority: 0,
  responseKey: 'fallback',
  suggestions: ['Rechercher un produit', 'Poster un AO', 'Contacter le support', 'FAQ'],
};

/**
 * Detect intent from user message
 */
export function detectIntent(message: string): { intent: Intent; confidence: number } {
  const normalizedMessage = message.toLowerCase().trim();

  let bestMatch: Intent = FALLBACK_INTENT;
  let bestConfidence = 0;

  for (const intent of INTENTS) {
    for (const pattern of intent.patterns) {
      if (pattern.test(normalizedMessage)) {
        // Calculate confidence based on match quality and intent priority
        const matchLength = normalizedMessage.match(pattern)?.[0]?.length || 0;
        const coverage = matchLength / normalizedMessage.length;
        const confidence = Math.min(1, (coverage * 0.7) + (intent.priority / 200));

        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = intent;
        }
        
        break; // Stop checking patterns for this intent once matched
      }
    }
  }

  return { intent: bestMatch, confidence: bestConfidence };
}

/**
 * Extract entities from message (simple keyword extraction)
 */
export function extractEntities(message: string): Record<string, string> {
  const entities: Record<string, string> = {};

  // Extract product keywords
  const productKeywords = [
    'panneau solaire', 'pompe', 'machine', 'outils', 'matériaux', 'acier', 
    'ciment', 'engrais', 'tube', 'câble', 'moteur', 'transformateur',
    'climatisation', 'réfrigérateur', 'pompes', 'valve', 'robinet'
  ];
  
  for (const keyword of productKeywords) {
    if (message.toLowerCase().includes(keyword)) {
      entities.product = keyword;
      break;
    }
  }

  // Extract location/wilaya
  const wilayas = [
    'alger', 'oran', 'constantine', 'annaba', 'blida', 'batna', 'béjaïa',
    'tlemcen', 'setif', 'sidi bel abbès', 'skikda', 'msila', 'tébessa',
    'mascara', 'tijert', 'medea', 'mostaganem', 'tissemsilt', 'ouargla',
    'bouira', 'boumerdes', 'tarf', 'tindouf', 'tissemsilt', 'el oued',
    'khenchela', 'souk ahras', 'tipaza', 'mila', 'ain defla', 'naama',
    'ain temouchent', 'ghardaia', 'relizane', 'el m\'ghair', 'timimoun',
    'djelfa', 'ilizi', ' bordj bou arreridj', 'oum el bouaghi', 'illizi',
    'baïech', 'bou saada', 'hassi messaoud', 'ougta', 'guelma', 'grarem gouga'
  ];

  const lowerMessage = message.toLowerCase();
  for (const wilaya of wilayas) {
    if (lowerMessage.includes(wilaya)) {
      entities.location = wilaya;
      break;
    }
  }

  // Extract payment method mentions
  const paymentMethods = ['ccp', 'baridimob', 'baridi', 'carte', 'cib', 'virement'];
  for (const method of paymentMethods) {
    if (lowerMessage.includes(method)) {
      entities.paymentMethod = method;
      break;
    }
  }

  return entities;
}
