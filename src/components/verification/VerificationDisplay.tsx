'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Award,
  FileCheck,
  Building2,
  Star,
  ChevronRight
} from 'lucide-react';

interface VerificationBadge {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  level: string;
}

interface VerificationData {
  verifications: any[];
  badges: VerificationBadge[];
  currentLevel: string;
  status: string;
  isVerified: boolean;
}

interface VerificationDisplayProps {
  companyId?: string;
  data?: VerificationData;
  compact?: boolean;
  showActions?: boolean;
  onVerify?: () => void;
  onViewDetails?: () => void;
}

const VerificationLevelConfig = {
  BASIC: {
    color: 'bg-gray-100 text-gray-800',
    icon: Shield,
    label: 'Basic',
    description: 'Email & phone verified'
  },
  VERIFIED: {
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle2,
    label: 'Verified',
    description: 'Business documents verified'
  },
  CERTIFIED: {
    color: 'bg-purple-100 text-purple-800',
    icon: Award,
    label: 'Certified',
    description: 'On-site inspection passed'
  },
  PREMIUM: {
    color: 'bg-amber-100 text-amber-800',
    icon: Star,
    label: 'Premium',
    description: 'Third-party audit completed'
  },
  ENTERPRISE: {
    color: 'bg-emerald-100 text-emerald-800',
    icon: Building2,
    label: 'Enterprise',
    description: 'Full enterprise verification'
  }
};

export function VerificationDisplay({
  data,
  compact = false,
  showActions = true,
  onVerify,
  onViewDetails
}: VerificationDisplayProps) {
  const [showAllBadges, setShowAllBadges] = useState(false);

  if (!data && !companyId) {
    return null;
  }

  // Default data for demo
  const verificationData: VerificationData = data || {
    verifications: [],
    badges: [
      { id: '1', name: 'Verified Supplier', icon: '✓', color: '#006233', level: 'VERIFIED' },
      { id: '2', name: 'Business License', icon: '📋', color: '#2563eb', level: 'VERIFIED' }
    ],
    currentLevel: 'VERIFIED',
    status: 'VERIFIED',
    isVerified: true
  };

  const levelConfig = VerificationLevelConfig[verificationData.currentLevel as keyof typeof VerificationLevelConfig];
  const LevelIcon = levelConfig?.icon || Shield;

  // Compact mode for product cards, company listings
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {verificationData.isVerified && (
          <Badge variant="outline" className={`${levelConfig?.color} border-current gap-1`}>
            <LevelIcon className="h-3 w-3" />
            <span className="text-xs">{levelConfig?.label}</span>
          </Badge>
        )}
        {verificationData.badges.slice(0, 2).map((badge) => (
          <Badge key={badge.id} variant="secondary" className="text-xs">
            {badge.icon} {badge.name}
          </Badge>
        ))}
      </div>
    );
  }

  // Full verification display
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${levelConfig?.color}`}>
              <LevelIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Supplier Verification</CardTitle>
              <CardDescription>{levelConfig?.description}</CardDescription>
            </div>
          </div>
          {verificationData.isVerified ? (
            <Badge className="bg-green-100 text-green-800 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              Pending
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Verification Level Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Verification Level</span>
            <span className="font-medium">{levelConfig?.label}</span>
          </div>
          <Progress 
            value={Object.keys(VerificationLevelConfig).indexOf(verificationData.currentLevel) * 25 + 25} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            {Object.entries(VerificationLevelConfig).map(([key, config]) => (
              <span key={key} className={key === verificationData.currentLevel ? 'font-medium text-foreground' : ''}>
                {config.label}
              </span>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Award className="h-4 w-4" />
            Earned Badges ({verificationData.badges.length})
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            {(showAllBadges ? verificationData.badges : verificationData.badges.slice(0, 4)).map((badge) => (
              <div 
                key={badge.id}
                className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                style={{ borderColor: badge.color + '40' }}
              >
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{badge.name}</p>
                  {badge.description && (
                    <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {verificationData.badges.length > 4 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowAllBadges(!showAllBadges)}
            >
              {showAllBadges ? 'Show Less' : `View All ${verificationData.badges.length} Badges`}
              <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showAllBadges ? 'rotate-90' : ''}`} />
            </Button>
          )}
        </div>

        {/* Recent Verifications */}
        {verificationData.verifications.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Verification History
            </h4>
            
            <div className="space-y-2">
              {verificationData.verifications.slice(0, 3).map((v) => (
                <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    {v.status === 'VERIFIED' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : v.status === 'PENDING' ? (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm capitalize">{v.type?.toLowerCase().replace('_', ' ')}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {!verificationData.isVerified && onVerify && (
              <Button onClick={onVerify} className="flex-1">
                <Shield className="h-4 w-4 mr-2" />
                Start Verification
              </Button>
            )}
            {onViewDetails && (
              <Button variant="outline" onClick={onViewDetails} className="flex-1">
                View Details
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Individual badge component for inline use
export function VerificationBadge({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' | 'lg' }) {
  const config = VerificationLevelConfig[type as keyof typeof VerificationLevelConfig];
  const Icon = config?.icon || Shield;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2'
  };

  return (
    <Badge className={`${sizeClasses[size]} ${config?.color} border-current`}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      {config?.label}
    </Badge>
  );
}

export default VerificationDisplay;
