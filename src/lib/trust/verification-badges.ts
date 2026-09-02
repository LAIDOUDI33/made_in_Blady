/**
 * Trust & Verification Badges System - AlgeriaTrade.dz
 * Système de badges de confiance pour les entreprises algériennes
 * Trust score calculation and verification badge management
 */

export type VerificationLevel = 'none' | 'basic' | 'verified' | 'premium' | 'trusted_partner';
export type BadgeType = 
  | 'verification' 
  | 'quality' 
  | 'performance' 
  | 'response_time' 
  | 'reliability'
  | 'certification'
  | 'top_seller';

export interface VerificationBadge {
  id: string;
  type: BadgeType;
  level: VerificationLevel;
  name: string;
  nameAr?: string; // Arabic translation
  description: string;
  icon: string; // Icon name or URL
  color: string; // CSS color or Tailwind class
  requirements: string[];
  benefits: string[];
  issuedAt?: Date;
  expiresAt?: Date;
}

export interface TrustScore {
  overall: number; // 0-100
  components: {
    verification: number;   // 0-25 points
    reputation: number;     // 0-25 points
    performance: number;    // 0-25 points
    reliability: number;    // 0-25 points
  };
  level: VerificationLevel;
  lastCalculated: Date;
}

export interface CompanyTrustData {
  companyId: string;
  isIdentityVerified: boolean;
  isBusinessRegistered: boolean;
  hasCommercialRegister: boolean;
  hasNifNumber: boolean;
  hasNisNumber: boolean;
  accountAgeDays: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageRating: number;
  totalReviews: number;
  responseTimeHours: number;
  onTimeDeliveryRate: number;
  disputeRate: number;
  returnRate: number;
  certifications: string[];
  isPremiumSubscriber: boolean;
  transactionVolumeDZD: number;
  yearsActive: number;
}

// Verification levels configuration
export const VERIFICATION_LEVELS: Record<VerificationLevel, {
  label: string;
  labelAr: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  minScore: number;
}> = {
  none: {
    label: 'Non vérifié',
    labelAr: 'غير موثق',
    color: '#9ca3af',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db',
    icon: 'circle',
    minScore: 0
  },
  basic: {
    label: 'Compte de base',
    labelAr: 'حساب أساسي',
    color: '#6b7280',
    bgColor: '#e5e7eb',
    borderColor: '#9ca3af',
    icon: 'user',
    minScore: 1
  },
  verified: {
    label: 'Vérifié',
    labelAr: 'موثق',
    color: '#16a34a',
    bgColor: '#dcfce7',
    borderColor: '#22c55e',
    icon: 'shield-check',
    minScore: 30
  },
  premium: {
    label: 'Premium',
    labelAr: 'مميز',
    color: '#2563eb',
    bgColor: '#dbeafe',
    borderColor: '#3b82f6',
    icon: 'crown',
    minScore: 60
  },
  trusted_partner: {
    label: 'Partenaire de confiance',
    labelAr: 'شريك موثوق',
    color: '#9333ea',
    bgColor: '#f3e8ff',
    borderColor: '#a855f7',
    icon: 'award',
    minScore: 85
  }
};

// Available badges catalog
export const BADGE_CATALOG: VerificationBadge[] = [
  // Verification Badges
  {
    id: 'badge_identity_verified',
    type: 'verification',
    level: 'verified',
    name: 'Identité Vérifiée',
    nameAr: 'الهوية موثقة',
    description: 'L\'identité du représentant légal a été vérifiée avec pièce d\'identité officielle.',
    icon: 'id-card',
    color: '#16a34a',
    requirements: ['Pièce d\'identité valide', 'Auto-photo clair', 'Données cohérentes'],
    benefits: ['Badge vert sur le profil', 'Confiance accrue des acheteurs', 'Accès aux fonctionnalités avancées']
  },
  {
    id: 'badge_business_registered',
    type: 'verification',
    level: 'verified',
    name: 'Entreprise Enregistrée',
    nameAr: 'شركة مسجلة',
    description: 'Le registre commercial a été vérifié auprès des autorités algériennes.',
    icon: 'building',
    color: '#16a34a',
    requirements: ['Registre commercial valide', 'NIF/NIS vérifié', 'Statut juridique confirmé'],
    benefits: ['Badge "Entreprise"', 'Apparition prioritaire dans les recherches', 'Accès au tableau de bord avancé']
  },
  {
    id: 'badge_premium_member',
    type: 'verification',
    level: 'premium',
    name: 'Membre Premium',
    nameAr: 'عضو مميز',
    description: 'Souscripteur d\'un abonnement Premium avec avantages exclusifs.',
    icon: 'crown',
    color: '#2563eb',
    requirements: ['Abonnement Premium actuel', 'Paiement à jour', 'Respect des CGU'],
    benefits: ['Support prioritaire 24/7', 'Frais réduits', 'Analyses avancées', 'Badge bleu distinctif']
  },
  {
    id: 'badge_trusted_partner',
    type: 'verification',
    level: 'trusted_partner',
    name: 'Partenaire de Confiance',
    nameAr: 'شريك موثوق',
    description: 'Partenaire établi avec un historique prouvé de fiabilité et d\'excellence.',
    icon: 'award',
    color: '#9333ea',
    requirements: ['Minimum 2 ans d\'activité', 'Score de confiance > 85', 'Moins de 2% de litiges', '100+ commandes complétées'],
    benefits: ['Badge violet exclusif', 'Account manager dédié', 'Conditions préférentielles', 'Visibilité maximale']
  },
  
  // Performance Badges
  {
    id: 'badge_top_seller',
    type: 'top_seller',
    level: 'premium',
    name: 'Vendeur Populaire',
    nameAr: 'بائع شهير',
    description: 'Parmi les meilleurs vendeurs de sa catégorie en termes de ventes et de satisfaction client.',
    icon: 'trophy',
    color: '#f59e0b',
    requirements: ['Top 10% des ventes de la catégorie', 'Note moyenne ≥ 4.5', 'Au moins 50 avis positifs'],
    benefits: ['Badge "Top Vendeur" doré', 'Mise en avant sur la page d\'accueil', 'Rapports de vente détaillés']
  },
  {
    id: 'badge_fast_responder',
    type: 'response_time',
    level: 'verified',
    name: 'Réponse Rapide',
    nameAr: 'رد سريع',
    description: 'Répond généralement aux messages et demandes de devis en moins de 2 heures.',
    icon: 'clock',
    color: '#06b6d4',
    requirements: ['Temps de réponse moyen < 2h', 'Taux de réponse > 90%', 'Sur les 30 derniers jours'],
    benefits: ['Badge "Réponse rapide" cyan', 'Indicateur de disponibilité', 'Priorité dans les recherches']
  },
  {
    id: 'badge_reliable_delivery',
    type: 'reliability',
    level: 'verified',
    name: 'Livraison Fiable',
    nameAr: 'تسليم موثوق',
    description: 'Historique excellent de livraisons dans les délais annoncés.',
    icon: 'truck',
    color: '#10b981',
    requirements: ['Taux de livraison à temps > 95%', 'Moins de 2% de retards', 'Sur les 100 dernières commandes'],
    benefits: ['Badge "Livraison fiable" vert', 'Confiance accrue des acheteurs', 'Réduction des litiges']
  },
  
  // Quality & Certification Badges
  {
    id: 'badge_quality_certified',
    type: 'certification',
    level: 'premium',
    name: 'Certifié Qualité',
    nameAr: 'معتمد الجودة',
    description: 'Produits ou services certifiés conformes aux normes de qualité reconnues (ISO, etc.).',
    icon: 'certificate',
    color: '#8b5cf6',
    requirements: ['Certification ISO ou équivalente', 'Audit par tiers validé', 'Certificat à jour'],
    benefits: ['Badge "Qualité certifiée" violet', 'Accès au programme Export', 'Partenariats B2G privilégiés']
  },
  {
    id: 'badge_5_star_rating',
    type: 'quality',
    level: 'trusted_partner',
    name: 'Excellence Client',
    nameAr: 'تميز العملاء',
    description: 'Maintient une note moyenne de 5 étoiles avec un nombre significatif d\'avis.',
    icon: 'star',
    color: '#f97316',
    requirements: ['Note moyenne = 5.0', 'Minimum 100 avis', 'Aucun avis < 4 étoiles sur 90 jours'],
    benefits: ['Badge "Excellence" orange', 'Mise en avant dans les résultats', 'Témoignages mis en avant']
  }
];

/**
 * Calculate trust score for a company
 */
export function calculateTrustScore(data: CompanyTrustData): TrustScore {
  let verificationScore = 0;
  let reputationScore = 0;
  let performanceScore = 0;
  let reliabilityScore = 0;

  // Verification Component (0-25 points)
  if (data.isIdentityVerified) verificationScore += 5;
  if (data.isBusinessRegistered) verificationScore += 5;
  if (data.hasCommercialRegister) verificationScore += 4;
  if (data.hasNifNumber) verificationScore += 3;
  if (data.hasNisNumber) verificationScore += 3;
  if (data.accountAgeDays >= 365) verificationScore += 3;
  else if (data.accountAgeDays >= 180) verificationScore += 2;
  else if (data.accountAgeDays >= 90) verificationScore += 1;
  if (data.isPremiumSubscriber) verificationScore += 2;

  // Reputation Component (0-25 points)
  if (data.totalReviews >= 100) reputationScore += 10;
  else if (data.totalReviews >= 50) reputationScore += 7;
  else if (data.totalReviews >= 20) reputationScore += 4;
  else if (data.totalReviews >= 5) reputationScore += 2;
  
  if (data.averageRating >= 4.8) reputationScore += 10;
  else if (data.averageRating >= 4.5) reputationScore += 8;
  else if (data.averageRating >= 4.0) reputationScore += 5;
  else if (data.averageRating >= 3.5) reputationScore += 3;
  else if (data.averageRating >= 3.0) reputationScore += 1;

  if (data.certifications.length > 0) reputationScore += 5;

  // Performance Component (0-25 points)
  if (data.completedOrders >= 500) performanceScore += 10;
  else if (data.completedOrders >= 200) performanceScore += 7;
  else if (data.completedOrders >= 50) performanceScore += 4;
  else if (data.completedOrders >= 10) performanceScore += 2;

  if (data.transactionVolumeDZD >= 100000000) performanceScore += 8; // 100M DZD
  else if (data.transactionVolumeDZD >= 50000000) performanceScore += 6;
  else if (data.transactionVolumeDZD >= 10000000) performanceScore += 4;
  else if (data.transactionVolumeDZD >= 1000000) performanceScore += 2;

  if (data.responseTimeHours <= 2) performanceScore += 4;
  else if (data.responseTimeHours <= 6) performanceScore += 3;
  else if (data.responseTimeHours <= 24) performanceScore += 2;
  else if (data.responseTimeHours <= 48) performanceScore += 1;

  // Reliability Component (0-25 points)
  const completionRate = data.totalOrders > 0 
    ? (data.completedOrders / data.totalOrders) * 100 
    : 0;
  
  if (completionRate >= 98) reliabilityScore += 8;
  else if (completionRate >= 95) reliabilityScore += 6;
  else if (completionRate >= 90) reliabilityScore += 4;
  else if (completionRate >= 80) reliabilityScore += 2;

  if (data.onTimeDeliveryRate >= 98) reliabilityScore += 6;
  else if (data.onTimeDeliveryRate >= 95) reliabilityScore += 4;
  else if (data.onTimeDeliveryRate >= 90) reliabilityScore += 2;

  if (data.disputeRate <= 0.5) reliabilityScore += 5;
  else if (data.disputeRate <= 1) reliabilityScore += 3;
  else if (data.disputeRate <= 2) reliabilityScore += 1;

  if (data.returnRate <= 1) reliabilityScore += 3;
  else if (data.returnRate <= 3) reliabilityScore += 2;
  else if (data.returnRate <= 5) reliabilityScore += 1;

  if (data.yearsActive >= 5) reliabilityScore += 3;
  else if (data.yearsActive >= 2) reliabilityScore += 2;
  else if (data.yearsActive >= 1) reliabilityScore += 1;

  const overall = verificationScore + reputationScore + performanceScore + reliabilityScore;

  // Determine level based on score
  let level: VerificationLevel = 'none';
  if (overall >= 85) level = 'trusted_partner';
  else if (overall >= 60) level = 'premium';
  else if (overall >= 30) level = 'verified';
  else if (overall >= 1) level = 'basic';

  return {
    overall: Math.min(100, overall),
    components: {
      verification: Math.min(25, verificationScore),
      reputation: Math.min(25, reputationScore),
      performance: Math.min(25, performanceScore),
      reliability: Math.min(25, reliabilityScore)
    },
    level,
    lastCalculated: new Date()
  };
}

/**
 * Get badges earned by a company based on their data
 */
export function getEarnedBadges(data: CompanyTrustData): VerificationBadge[] {
  const earned: VerificationBadge[] = [];
  const score = calculateTrustScore(data);

  // Check each badge's requirements
  for (const badge of BADGE_CATALOG) {
    let eligible = false;

    switch (badge.id) {
      case 'badge_identity_verified':
        eligible = data.isIdentityVerified;
        break;
      case 'badge_business_registered':
        eligible = data.isBusinessRegistered && data.hasCommercialRegister;
        break;
      case 'badge_premium_member':
        eligible = data.isPremiumSubscriber;
        break;
      case 'badge_trusted_partner':
        eligible = score.level === 'trusted_partner' && data.yearsActive >= 2 && data.completedOrders >= 100;
        break;
      case 'badge_top_seller':
        eligible = data.averageRating >= 4.5 && data.totalReviews >= 50 && data.completedOrders >= 50;
        break;
      case 'badge_fast_responder':
        eligible = data.responseTimeHours <= 2;
        break;
      case 'badge_reliable_delivery':
        eligible = data.onTimeDeliveryRate >= 95;
        break;
      case 'badge_quality_certified':
        eligible = data.certifications.length > 0;
        break;
      case 'badge_5_star_rating':
        eligible = data.averageRating >= 4.9 && data.totalReviews >= 100;
        break;
    }

    if (eligible) {
      earned.push(badge);
    }
  }

  return earned;
}

/**
 * Format trust score as percentage with color
 */
export function getTrustScoreDisplay(score: number): {
  value: string;
  color: string;
  label: string;
} {
  const percentage = Math.round(score);
  
  if (percentage >= 85) {
    return { value: `${percentage}%`, color: '#9333ea', label: 'Excellent' };
  } else if (percentage >= 70) {
    return { value: `${percentage}%`, color: '#16a34a', label: 'Très bon' };
  } else if (percentage >= 50) {
    return { value: `${percentage}%`, color: '#2563eb', label: 'Bon' };
  } else if (percentage >= 30) {
    return { value: `${percentage}%`, color: '#f59e0b', label: 'Correct' };
  } else if (percentage > 0) {
    return { value: `${percentage}%`, color: '#f97316', label: 'À améliorer' };
  } else {
    return { value: 'N/A', color: '#9ca3af', label: 'Non évalué' };
  }
}
