'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ShieldAlert,
  Clock,
  RefreshCw,
  Mail,
  Phone,
  XCircle,
  Timer,
} from 'lucide-react';

interface RateLimitExceededProps {
  endpointType?: string;
  retryAfter?: number; // seconds
  resetTime?: Date;
  message?: string;
  onRetry?: () => void;
}

export default function RateLimitExceeded({
  endpointType,
  retryAfter = 60,
  resetTime,
  message,
  onRetry,
}: RateLimitExceededProps) {
  const [countdown, setCountdown] = useState(() => {
    // Initialize with calculated value
    if (resetTime) {
      return Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
    }
    return retryAfter;
  });
  const [canRetry, setCanRetry] = useState(false);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanRetry(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format countdown as MM:SS
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get specific message based on endpoint type
  const getDefaultMessage = (): string => {
    switch (endpointType) {
      case 'login':
        return "Trop de tentatives de connexion. Pour la sécurité de votre compte, veuillez attendre avant de réessayer.";
      case 'register':
        return "Trop de tentatives d'inscription. Veuillez patienter et réessayer plus tard.";
      case 'passwordReset':
        return "Trop de demandes de réinitialisation. Veuillez attendre avant de faire une nouvelle demande.";
      case 'twoFactorSetup':
      case 'twoFactorVerify':
        return "Trop de tentatives de vérification 2FA. Veuillez patienter.";
      default:
        return "Vous avez effectué trop de requêtes. Veuillez patienter avant de continuer.";
    }
  };

  const displayMessage = message || getDefaultMessage();

  // Get severity based on endpoint type
  const getSeverity = (): 'warning' | 'error' => {
    const severeEndpoints = ['login', 'adminLogin', 'passwordReset'];
    return severeEndpoints.includes(endpointType || '') ? 'error' : 'warning';
  };

  const severity = getSeverity();

  return (
    <Card className={`w-full max-w-lg mx-auto ${severity === 'error' ? 'border-red-200' : 'border-amber-200'}`}>
      <CardHeader className="text-center pb-4">
        <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
          severity === 'error' ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          <ShieldAlert className={`w-8 h-8 ${
            severity === 'error' ? 'text-red-600' : 'text-amber-600'
          }`} />
        </div>
        
        <CardTitle className="flex items-center justify-center gap-2">
          {severity === 'error' ? (
            <>
              <XCircle className="w-5 h-5 text-red-500" />
              Accès Temporairement Bloqué
            </>
          ) : (
            <>
              <Clock className="w-5 h-5 text-amber-500" />
              Limite de Requêtes Atteinte
            </>
          )}
        </CardTitle>
        
        <CardDescription>
          Cette mesure est en place pour protéger notre plateforme
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Message */}
        <Alert variant={severity === 'error' ? 'destructive' : undefined} 
              className={severity === 'warning' ? 'border-amber-200 bg-amber-50' : ''}>
          <ShieldAlert className={`h-4 w-4 ${
            severity === 'error' ? '' : 'text-amber-600'
          }`} />
          <AlertDescription className={severity === 'warning' ? 'text-amber-800' : ''}>
            {displayMessage}
          </AlertDescription>
        </Alert>

        {/* Countdown Timer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Disponible dans :
          </p>
          
          <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-lg font-mono text-3xl font-bold ${
            severity === 'error' 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <Timer className="w-8 h-8" />
            {formatCountdown(countdown)}
          </div>

          {countdown > 0 && (
            <p className="text-xs text-muted-foreground">
              Le compteur se réinitialise automatiquement...
            </p>
          )}
        </div>

        {/* Retry Button */}
        {(canRetry || countdown <= 0) && onRetry && (
          <Button onClick={onRetry} className="w-full" size="lg">
            <RefreshCw className="w-5 h-5 mr-2" />
            Réessayer Maintenant
          </Button>
        )}

        {!canRetry && countdown > 0 && (
          <Button disabled className="w-full" size="lg" variant="outline">
            <RefreshCw className="w-5 h-5 mr-2" />
            Réessayer dans {formatCountdown(countdown)}
          </Button>
        )}

        {/* Help Section */}
        <div className="pt-4 border-t space-y-4">
          <h4 className="font-medium text-sm">Besoin d&apos;aide ?</h4>
          
          <div className="grid gap-3">
            <a
              href="mailto:support@algeriatrade.dz"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Mail className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Email Support</p>
                <p className="text-xs text-muted-foreground">support@algeriatrade.dz</p>
              </div>
            </a>

            <a
              href="tel:+213XXXXXXXXX"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Phone className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Téléphone</p>
                <p className="text-xs text-muted-foreground">+213 XX XX XX XX XX</p>
              </div>
            </a>
          </div>
        </div>

        {/* Security Tips */}
        <div className="pt-4 border-t">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Conseils pour éviter ce problème
            </summary>
            
            <div className="mt-3 p-4 bg-slate-50 rounded-lg text-sm space-y-2 text-muted-foreground">
              {endpointType === 'login' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Vérifiez que votre mot de passe est correct</li>
                  <li>Utilisez la fonction &quot;Mot de passe oublié&quot; si nécessaire</li>
                  <li>Attendez quelques minutes entre chaque tentative</li>
                  <li>Vérifiez que votre clavier est bien configuré (majuscules/minuscules)</li>
                </ul>
              )}
              
              {endpointType !== 'login' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Évitez de rafraîchir la page trop rapidement</li>
                  <li>Attendez entre vos actions sur le site</li>
                  <li>Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez le support</li>
                </ul>
              )}
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}
