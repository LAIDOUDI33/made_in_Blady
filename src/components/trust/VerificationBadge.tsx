'use client';

import React from 'react';
import { 
  Shield, 
  Crown, 
  Award, 
  Star, 
  CheckCircle,
  Building,
  IdCard,
  Trophy,
  Clock,
  Truck,
  Certificate,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  VerificationBadge, 
  VerificationLevel, 
  VERIFICATION_LEVELS, 
  getTrustScoreDisplay,
  type CompanyTrustData 
} from '@/lib/trust/verification-badges';

interface VerificationBadgeProps {
  badge: VerificationBadge;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

// Icon mapping
const ICON_MAP: Record<string, React.ReactNode> = {
  'id-card': <IdCard className="h-full w-full" />,
  'building': <Building className="h-full w-full" />,
  'crown': <Crown className="h-full w-full" />,
  'award': <Award className="h-full w-full" />,
  'trophy': <Trophy className="h-full w-full" />,
  'clock': <Clock className="h-full w-full" />,
  'truck': <Truck className="h-full w-full" />,
  'certificate': <Certificate className="h-full w-full" />,
  'star': <Star className="h-full w-full" />,
  'shield-check': <Shield className="h-full w-full" />,
  'circle': <div className="h-full w-full rounded-full border-2 current-color" />,
  'user': <div className="h-full w-full rounded-full bg-current opacity-50" />,
};

const SIZE_CLASSES = {
  sm: { container: 'w-6 h-6', icon: 'h-3.5 w-3.5' },
  md: { container: 'w-8 h-8', icon: 'h-5 w-5' },
  lg: { container: 'w-12 h-12', icon: 'h-7 w-7' },
};

export function VerificationBadgeComponent({ 
  badge, 
  size = 'md', 
  showTooltip = true,
  className = '' 
}: VerificationBadgeProps) {
  const sizeClass = SIZE_CLASSES[size];
  const icon = ICON_MAP[badge.icon] || <Shield className={sizeClass.icon} />;

  const badgeContent = (
    <div 
      className={`${sizeClass.container} rounded-full flex items-center justify-center ${className}`}
      style={{ 
        backgroundColor: badge.color + '20',
        color: badge.color,
        border: `2px solid ${badge.color}`
      }}
    >
      <span className={sizeClass.icon}>{icon}</span>
    </div>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold text-sm">{badge.name}</p>
            <p className="text-xs text-muted-foreground">{badge.description}</p>
            {badge.requirements.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <p className="text-xs font-medium mb-1">Conditions :</p>
                <ul className="text-xs space-y-0.5">
                  {badge.requirements.map((req, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface VerificationLevelBadgeProps {
  level: VerificationLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VerificationLevelBadge({ 
  level, 
  showLabel = true, 
  size = 'md',
  className = '' 
}: VerificationLevelBadgeProps) {
  const config = VERIFICATION_LEVELS[level];
  const sizeConfig = SIZE_CLASSES[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div 
        className={`${sizeConfig.container} rounded-full flex items-center justify-center`}
        style={{ 
          backgroundColor: config.bgColor,
          color: config.color,
          border: `2px solid ${config.borderColor}`
        }}
      >
        {level === 'trusted_partner' && <Award className={sizeConfig.icon} />}
        {level === 'premium' && <Crown className={sizeConfig.icon} />}
        {level === 'verified' && <Shield className={sizeConfig.icon} />}
        {level === 'basic' && <div className={`${sizeConfig.icon} rounded-full bg-current opacity-50`} />}
        {level === 'none' && <div className={`${sizeConfig.icon} rounded-full border-2 border-current`} />}
      </div>
      {showLabel && (
        <span className="text-sm font-medium" style={{ color: config.color }}>
          {config.label}
        </span>
      )}
    </div>
  );
}

interface TrustScoreDisplayProps {
  score: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TrustScoreDisplay({ 
  score, 
  showDetails = false, 
  size = 'md',
  className = '' 
}: TrustScoreDisplayProps) {
  const display = getTrustScoreDisplay(score);
  
  const sizes = {
    sm: { circle: 'w-12 h-12', text: 'text-lg', label: 'text-xs' },
    md: { circle: 'w-16 h-16', text: 'text-2xl', label: 'text-sm' },
    lg: { circle: 'w-24 h-24', text: 'text-4xl', label: 'text-base' },
  };

  const sizeConfig = sizes[size];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div 
        className={`${sizeConfig.circle} rounded-full flex items-center justify-center relative`}
        style={{ 
          background: `conic-gradient(${display.color} ${score}%, #e5e7eb ${score}%)` 
        }}
      >
        <div className="bg-background rounded-full flex items-center justify-center"
          style={{
            width: size === 'lg' ? '80%' : '75%',
            height: size === 'lg' ? '80%' : '75%',
          }}
        >
          <span className={`font-bold ${sizeConfig.text}`} style={{ color: display.color }}>
            {display.value}
          </span>
        </div>
      </div>
      <span className={`${sizeConfig.label} font-medium mt-2`} style={{ color: display.color }}>
        {display.label}
      </span>
      {showDetails && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground mt-1 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Score de confiance calculé selon :</p>
              <ul className="text-xs mt-1 space-y-0.5">
                <li>• Vérification d'identité</li>
                <li>• Réputation et avis clients</li>
                <li>• Performance commerciale</li>
                <li>• Fiabilité des livraisons</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

interface TrustCardProps {
  companyName: string;
  trustData: CompanyTrustData;
  badges?: VerificationBadge[];
  className?: string;
}

export function TrustCard({ companyName, trustData, badges = [], className = '' }: TrustCardProps) {
  const score = calculateTrustScore(trustData);
  const display = getTrustScoreDisplay(score.overall);

  return (
    <div className={`border rounded-lg p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Confiance & Vérification</h3>
        <VerificationLevelBadge level={score.level} size="sm" />
      </div>

      {/* Score */}
      <div className="flex items-center gap-4">
        <TrustScoreDisplay score={score.overall} size="md" />
        <div className="flex-1 space-y-2">
          {/* Score Components */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Vérification</span>
              <span>{score.components.verification}/25</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(score.components.verification / 25) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Réputation</span>
              <span>{score.components.reputation}/25</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${(score.components.reputation / 25) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Performance</span>
              <span>{score.components.performance}/25</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 rounded-full transition-all"
                style={{ width: `${(score.components.performance / 25) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Fiabilité</span>
              <span>{score.components.reliability}/25</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${(score.components.reliability / 25) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-muted/50 rounded p-2 text-center">
          <p className="font-bold text-lg">{trustData.completedOrders}</p>
          <p className="text-xs text-muted-foreground">Commandes</p>
        </div>
        <div className="bg-muted/50 rounded p-2 text-center">
          <p className="font-bold text-lg">{trustData.averageRating.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Note moyenne</p>
        </div>
        <div className="bg-muted/50 rounded p-2 text-center">
          <p className="font-bold text-lg">{trustData.responseTimeHours}h</p>
          <p className="text-xs text-muted-foreground">Temps de réponse</p>
        </div>
        <div className="bg-muted/50 rounded p-2 text-center">
          <p className="font-bold text-lg">{trustData.onTimeDeliveryRate}%</p>
          <p className="text-xs text-muted-foreground">Livraison à temps</p>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Badges obtenus</p>
          <div className="flex flex-wrap gap-2">
            {badges.map(badge => (
              <VerificationBadgeComponent key={badge.id} badge={badge} size="sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export types and utilities
export { calculateTrustScore, getEarnedBadges, VERIFICATION_LEVELS, BADGE_CATALOG };
export type { VerificationLevel, VerificationBadge, TrustScore, CompanyTrustData };
