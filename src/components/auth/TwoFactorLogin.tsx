'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  ShieldCheck,
  Key,
  Smartphone,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Timer,
} from 'lucide-react';
import { TWO_FACTOR_MESSAGES } from '@/lib/auth/twoFactor';

interface TwoFactorLoginProps {
  userId: string;
  email: string;
  onVerifySuccess: (token: string) => void;
  onCancel?: () => void;
}

type LoginStep = 'otp' | 'backup';

export default function TwoFactorLogin({
  userId,
  email,
  onVerifySuccess,
  onCancel,
}: TwoFactorLoginProps) {
  const [step, setStep] = useState<LoginStep>('otp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // OTP state
  const [otpCode, setOtpCode] = useState('');
  
  // Backup code state
  const [backupCode, setBackupCode] = useState('');
  
  // Remember device
  const [rememberDevice, setRememberDevice] = useState(false);
  
  // Countdown timer
  const [countdown, setCountdown] = useState(30); // TOTP codes change every 30s
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer effect
  useEffect(() => {
    // Reset countdown when component mounts
    setCountdown(30 - (Math.floor(Date.now() / 1000) % 30));
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 30; // Reset to 30
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Verify OTP code
  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code: otpCode,
          rememberDevice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || TWO_FACTOR_MESSAGES.errors.invalidCode);
      }

      onVerifySuccess(data.token || data.sessionToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Verify backup code
  const handleVerifyBackup = async () => {
    if (backupCode.length < 8) {
      setError('Veuillez entrer un code de secours valide');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          backupCode: backupCode.toUpperCase(),
          type: 'backup',
          rememberDevice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Code de secours invalide');
      }

      onVerifySuccess(data.token || data.sessionToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission based on current step
  const handleSubmit = () => {
    if (step === 'otp') {
      handleVerifyOTP();
    } else {
      handleVerifyBackup();
    }
  };

  // Switch between OTP and Backup
  const toggleStep = () => {
    setStep(step === 'otp' ? 'backup' : 'otp');
    setError(null);
    setOtpCode('');
    setBackupCode('');
  };

  // Get countdown color based on time remaining
  const getCountdownColor = () => {
    if (countdown <= 5) return 'text-red-500';
    if (countdown <= 10) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {step === 'otp' ? (
            <Smartphone className="w-8 h-8 text-primary" />
          ) : (
            <Key className="w-8 h-8 text-primary" />
          )}
        </div>
        
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="w-5 h-5" />
          {TWO_FACTOR_MESSAGES.login.title}
        </CardTitle>
        
        <CardDescription>
          {step === 'otp'
            ? `${TWO_FACTOR_MESSAGES.login.description} pour ${email}`
            : 'Entrez l\'un de vos codes de secours'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <div className="space-y-6">
            {/* Countdown Timer */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <Timer className={`w-4 h-4 ${getCountdownColor()}`} />
              <span className={getCountdownColor()}>
                {TWO_FACTOR_MESSAGES.login.codeExpires}{' '}
                <span className="font-bold">{countdown}s</span>
              </span>
              {countdown <= 5 && (
                <RefreshCw className="w-3 h-3 animate-spin text-red-500" />
              )}
            </div>

            {/* OTP Input */}
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(value) => {
                  setOtpCode(value);
                  // Auto-submit when 6 digits entered
                  if (value.length === 6) {
                    setTimeout(() => handleVerifyOTP(), 100);
                  }
                }}
                disabled={loading}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <InputOTPSlot key={idx} index={idx} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-muted-foreground text-center">
              Ouvrez votre application d&apos;authentification et entrez le code affiché
            </p>
          </div>
        )}

        {/* Backup Code Step */}
        {step === 'backup' && (
          <div className="space-y-4">
            <Alert className="border-amber-200 bg-amber-50">
              <Key className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Les codes de secours sont à usage unique. Chaque code ne peut être utilisé qu&apos;une seule fois.
              </AlertDescription>
            </Alert>

            <Input
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              maxLength={9}
              className="font-mono text-center tracking-widest text-lg"
              disabled={loading}
            />

            <p className="text-xs text-muted-foreground text-center">
              Entrez le code au format XXXX-XXXX (sans espaces)
            </p>
          </div>
        )}

        {/* Remember Device Option */}
        <div className="flex items-center space-x-2 px-2">
          <Checkbox
            id="remember-device"
            checked={rememberDevice}
            onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
          />
          <label
            htmlFor="remember-device"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {TWO_FACTOR_MESSAGES.login.rememberDevice}
          </label>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={
            loading ||
            (step === 'otp' && otpCode.length !== 6) ||
            (step === 'backup' && backupCode.length < 8)
          }
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Vérification...
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5 mr-2" />
              {TWO_FACTOR_MESSAGES.login.verifyButton}
            </>
          )}
        </Button>

        {/* Toggle between OTP and Backup */}
        <Separator />

        <Button
          variant="ghost"
          onClick={toggleStep}
          className="w-full"
          disabled={loading}
        >
          {step === 'otp' ? (
            <>
              <Key className="w-4 h-4 mr-2" />
              {TWO_FACTOR_MESSAGES.login.useBackup}
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4 mr-2" />
              Utiliser le code de l&apos;application
            </>
          )}
        </Button>

        {/* Cancel Button */}
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
            disabled={loading}
          >
            Annuler
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
