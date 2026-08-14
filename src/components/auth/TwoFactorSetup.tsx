'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  Key,
  Copy,
  Check,
  Download,
  Printer,
  Eye,
  EyeOff,
  AlertTriangle,
  Smartphone,
  Lock,
} from 'lucide-react';
import { TWO_FACTOR_MESSAGES } from '@/lib/auth/twoFactor';

interface TwoFactorSetupProps {
  userId: string;
  email: string;
  isEnabled: boolean;
  onSetupComplete?: () => void;
  onDisableComplete?: () => void;
}

interface SetupData {
  secret: string;
  qrCodeUri: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export default function TwoFactorSetup({
  userId,
  email,
  isEnabled,
  onSetupComplete,
  onDisableComplete,
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'complete' | 'disable'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Setup data
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodesDownloaded, setBackupCodesDownloaded] = useState(false);
  
  // Disable data
  const [password, setPassword] = useState('');
  const [current2FACode, setCurrent2FACode] = useState('');

  // Generate new 2FA setup
  const handleStartSetup = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération du secret 2FA');
      }
      
      setSetupData(data);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Verify and enable 2FA
  const handleVerifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code: verificationCode,
          secret: setupData?.secret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Code de vérification invalide');
      }

      setSuccess(TWO_FACTOR_MESSAGES.setup.success);
      setStep('complete');
      setShowBackupCodes(true);
      onSetupComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  // Copy secret to clipboard
  const copySecretToClipboard = async () => {
    if (setupData?.secret) {
      try {
        await navigator.clipboard.writeText(setupData.secret);
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Download backup codes as text file
  const downloadBackupCodes = () => {
    if (!setupData) return;

    const content = `AlgeriaTrade.dz - Codes de secours 2FA\n`;
    const date = new Date().toLocaleString('fr-FR', { 
      timeZone: 'Africa/Algiers',
      dateStyle: 'full',
      timeStyle: 'short'
    });
    
    const fileContent = `${content}
Date de génération: ${date}
Email: ${email}

IMPORTANT: Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une seule fois.

Codes de secours:
${setupData.backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

Si vous perdez l'accès à votre application d'authentification, utilisez l'un de ces codes pour vous connecter.
`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algeriatrade-2fa-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setBackupCodesDownloaded(true);
  };

  // Print backup codes
  const printBackupCodes = () => {
    if (!setupData) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>AlgeriaTrade - Codes de secours 2FA</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              h1 { color: #006233; }
              .codes { font-family: monospace; font-size: 18px; line-height: 1.8; }
              .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <h1>🔐 AlgeriaTrade.dz</h1>
            <h2>Codes de secours d'authentification à deux facteurs</h2>
            <p>Email: ${email}</p>
            <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
            <div class="warning">
              ⚠️ IMPORTANT: Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une seule fois.
            </div>
            <div class="codes">
              ${setupData.backupCodes.map((code, i) => `<div>${i + 1}. ${code}</div>`).join('')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Start disable process
  const handleStartDisable = () => {
    setPassword('');
    setCurrent2FACode('');
    setError(null);
    setStep('disable');
  };

  // Confirm disable 2FA
  const handleDisable = async () => {
    if (!password || !current2FACode) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          password,
          twoFactorCode: current2FACode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la désactivation');
      }

      setSuccess(TWO_FACTOR_MESSAGES.disable.success);
      setStep('idle');
      onDisableComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {isEnabled ? (
            <ShieldCheck className="w-8 h-8 text-green-600" />
          ) : (
            <Shield className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Lock className="w-5 h-5" />
          Authentification à Deux Facteurs
        </CardTitle>
        <CardDescription>
          {isEnabled
            ? 'La 2FA est activée sur votre compte'
            : 'Protégez votre compte avec une sécurité supplémentaire'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge variant={isEnabled ? 'default' : 'secondary'} className={isEnabled ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
            {isEnabled ? (
              <>
                <ShieldCheck className="w-4 h-4 mr-1" />
                Activée
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 mr-1" />
                Désactivée
              </>
            )}
          </Badge>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Idle State */}
        {step === 'idle' && (
          <div className="space-y-4">
            {!isEnabled ? (
              <Button onClick={handleStartSetup} disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>Chargement...</>
                ) : (
                  <>
                    <Smartphone className="w-5 h-5 mr-2" />
                    Activer l'authentification à deux facteurs
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Votre compte est protégé par l&apos;authentification à deux facteurs.
                </p>
                <div className="flex gap-3 justify-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Key className="w-4 h-4 mr-2" />
                        Voir les codes de secours
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Codes de secours</DialogTitle>
                        <DialogDescription>
                          Utilisez ces codes si vous perdez l&apos;accès à votre application d&apos;authentification
                        </DialogDescription>
                      </DialogHeader>
                      <ViewBackupCodes userId={userId} />
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="outline" onClick={handleStartDisable}>
                    Désactiver la 2FA
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Setup Step - QR Code Display */}
        {(step === 'verify' || step === 'complete') && setupData && (
          <div className="space-y-6">
            {/* QR Code Section */}
            <div className="text-center space-y-4">
              <p className="font-medium">{TWO_FACTOR_MESSAGES.setup.step1}</p>
              
              <div className="inline-block p-4 bg-white rounded-lg border shadow-sm">
                <img
                  src={setupData.qrCodeDataUrl}
                  alt="QR Code pour configuration 2FA"
                  className="w-48 h-48"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                {TWO_FACTOR_MESSAGES.setup.scanWith}
              </p>

              {/* Manual Entry Option */}
              <div className="pt-4">
                <Separator className="mb-4" />
                <p className="text-sm font-medium mb-2">{TWO_FACTOR_MESSAGES.setup.step2}</p>
                
                <div className="flex items-center gap-2 max-w-md mx-auto">
                  <div className="flex-1 relative">
                    <Input
                      type={showSecret ? 'text' : 'password'}
                      value={setupData.secret}
                      readOnly
                      className="font-mono text-xs pr-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copySecretToClipboard}
                  >
                    {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Verification Code Input */}
            {step === 'verify' && (
              <div className="space-y-4 pt-4 border-t">
                <p className="text-center font-medium">{TWO_FACTOR_MESSAGES.setup.step3}</p>
                
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <InputOTPSlot key={idx} index={idx} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifyAndEnable}
                  disabled={verificationCode.length !== 6 || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Vérification...' : (
                    <>
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      {TWO_FACTOR_MESSAGES.setup.verifyButton}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Backup Codes (shown after successful verification) */}
            {step === 'complete' && (
              <div className="space-y-4 pt-4 border-t">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold flex items-center gap-2 text-yellow-800">
                    <QrCode className="w-5 h-5" />
                    {TWO_FACTOR_MESSAGES.setup.backupTitle}
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    {TWO_FACTOR_MESSAGES.setup.backupDescription}
                  </p>
                </div>

                {/* Show/Hide Backup Codes Toggle */}
                <Button
                  variant="outline"
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  className="w-full"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {showBackupCodes ? 'Masquer les codes' : 'Afficher les codes de secours'}
                </Button>

                {showBackupCodes && (
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {setupData.backupCodes.map((code, i) => (
                        <code
                          key={i}
                          className="block bg-white px-3 py-2 rounded border text-center font-mono text-sm"
                        >
                          {code}
                        </code>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadBackupCodes}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        {TWO_FACTOR_MESSAGES.setup.downloadCodes}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={printBackupCodes}
                        className="flex-1"
                      >
                        <Printer className="w-4 h-4 mr-1" />
                        {TWO_FACTOR_MESSAGES.setup.printCodes}
                      </Button>
                    </div>
                    
                    {!backupCodesDownloaded && (
                      <p className="text-xs text-amber-600 text-center">
                        ⚠️ N&apos;oubliez pas de télécharger ou imprimer ces codes !
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Disable Confirmation */}
        {step === 'disable' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{TWO_FACTOR_MESSAGES.disable.warning}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  {TWO_FACTOR_MESSAGES.disable.enterPassword}
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  {TWO_FACTOR_MESSAGES.disable.enter2FACode}
                </label>
                <InputOTP
                  maxLength={6}
                  value={current2FACode}
                  onChange={setCurrent2FACode}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <InputOTPSlot key={idx} index={idx} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('idle')}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleDisable}
                  disabled={loading || !password || current2FACode.length !== 6}
                  className="flex-1"
                  variant="destructive"
                >
                  {loading ? 'Traitement...' : TWO_FACTOR_MESSAGES.disable.confirmButton}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Sub-component to view existing backup codes
function ViewBackupCodes({ userId }: { userId: string }) {
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/auth/2fa/backup-codes?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.codes) {
          setCodes(data.codes);
        }
      })
      .catch(() => setError('Impossible de charger les codes'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <p className="text-center py-4">Chargement...</p>;
  if (error) return <p className="text-red-500 text-center py-4">{error}</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Codes restants: {codes.length}/10
      </p>
      <div className="grid grid-cols-2 gap-2">
        {codes.map((code, i) => (
          <code
            key={i}
            className="block bg-slate-50 px-2 py-1.5 rounded border text-center font-mono text-sm"
          >
            {code}
          </code>
        ))}
      </div>
      {codes.length === 0 && (
        <p className="text-amber-600 text-sm text-center">
          Plus aucun code disponible. Régénérez depuis les paramètres.
        </p>
      )}
    </div>
  );
}
