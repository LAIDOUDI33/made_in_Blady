'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  PenTool,
  Type,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Clock,
  FileText,
} from 'lucide-react';

// Types
export type SignatureMethod = 'draw' | 'type' | 'upload';

interface SigningData {
  method: SignatureMethod;
  typedName: string;
  drawnSignature: string | null; // Base64 data URL
  uploadedFile: File | null;
  agreedToTerms: boolean;
}

interface ContractSignerProps {
  contractId: string;
  contractNumber: string;
  signerRole: 'PARTY_A' | 'PARTY_B';
  signerName: string;
  signerEmail: string;
  onSign?: (data: SigningData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ContractSigner({
  contractId,
  contractNumber,
  signerRole,
  signerName,
  signerEmail,
  onSign,
  onCancel,
  isLoading = false,
}: ContractSignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signingData, setSigningData] = useState<SigningData>({
    method: 'draw',
    typedName: '',
    drawnSignature: null,
    uploadedFile: null,
    agreedToTerms: false,
  });
  const [isDrawing, setIsDrawing] = useState(false);

  // Drawing functions
  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      
      let x: number, y: number;
      if ('touches' in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    []
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      
      let x: number, y: number;
      if ('touches' in e) {
        e.preventDefault();
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      ctx.lineTo(x, y);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    },
    [isDrawing]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSigningData((prev) => ({
        ...prev,
        drawnSignature: canvas.toDataURL('image/png'),
      }));
    }
  }, [isDrawing]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigningData((prev) => ({
      ...prev,
      drawnSignature: null,
    }));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSigningData((prev) => ({
        ...prev,
        uploadedFile: file,
      }));
    }
  };

  const handleSubmit = async () => {
    if (onSign) {
      await onSign(signingData);
    }
  };

  const canSubmit = (): boolean => {
    switch (signingData.method) {
      case 'draw':
        return !!signingData.drawnSignature && signingData.agreedToTerms;
      case 'type':
        return signingData.typedName.trim() !== '' && signingData.agreedToTerms;
      case 'upload':
        return !!signingData.uploadedFile && signingData.agreedToTerms;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-primary" />
            E-Signature / التوقيع الإلكتروني
          </CardTitle>
          <CardDescription>
            Sign contract <strong>{contractNumber}</strong> as{' '}
            <Badge variant="outline">{signerRole.replace('_', ' ')}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Signer Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Name / الاسم:</dt>
                <dd className="font-medium">{signerName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email / البريد:</dt>
                <dd className="font-medium">{signerEmail}</dd>
              </div>
            </dl>
          </div>

          {/* Method Selection */}
          <div>
            <Label className="text-base font-medium">Choose Signature Method</Label>
            <p className="text-sm text-muted-foreground mb-3">
              اختر طريقة التوقيع / Choisissez la méthode de signature
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  method: 'draw' as SignatureMethod,
                  icon: PenTool,
                  label: 'Draw',
                  labelAr: 'رسم',
                },
                {
                  method: 'type' as SignatureMethod,
                  icon: Type,
                  label: 'Type Name',
                  labelAr: 'كتابة',
                },
                {
                  method: 'upload' as SignatureMethod,
                  icon: Upload,
                  label: 'Upload',
                  labelAr: 'رفع',
                },
              ].map(({ method, icon: Icon, label, labelAr }) => (
                <button
                  key={method}
                  onClick={() =>
                    setSigningData((prev) => ({ ...prev, method }))
                  }
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                    signingData.method === method
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      signingData.method === method
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {labelAr}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Signature Area based on method */}
          {signingData.method === 'draw' && (
            <div className="space-y-3">
              <Label>Draw your signature below / ارسم توقيعك أدناه</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-2 bg-white">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full cursor-crosshair touch-none"
                  style={{ height: '150px' }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Clear / مسح
              </Button>
            </div>
          )}

          {signingData.method === 'type' && (
            <div className="space-y-3">
              <Label htmlFor="typed-name">
                Type your full name as it appears in legal documents
              </Label>
              <Input
                id="typed-name"
                placeholder="Enter your full name..."
                value={signingData.typedName}
                onChange={(e) =>
                  setSigningData((prev) => ({
                    ...prev,
                    typedName: e.target.value,
                  }))
                }
                className="text-lg"
              />
              {signingData.typedName && (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <p
                    className="text-3xl font-signature"
                    style={{ fontFamily: 'cursive' }}
                  >
                    {signingData.typedName}
                  </p>
                </div>
              )}
            </div>
          )}

          {signingData.method === 'upload' && (
            <div className="space-y-3">
              <Label htmlFor="signature-upload">
                Upload a scanned image of your signature
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="signature-upload"
                  className="cursor-pointer inline-flex flex-col items-center gap-2"
                >
                  <Upload className="w-10 h-10 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG up to 5MB
                  </span>
                </label>
                {signingData.uploadedFile && (
                  <div className="mt-4 p-2 bg-green-50 rounded inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      {signingData.uploadedFile.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Legal Notice & Terms */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Legal Notice / إشعار قانوني</p>
                <p>
                  By signing this document electronically, you agree that your electronic
                  signature has the same legal validity as a handwritten signature under
                  Algerian Law 10-11 of June 29, 2010.
                </p>
                <p className="mt-1" dir="rtl">
                  من خلال توقيع هذا المستند إلكترونياً، توافق على أن توقيعك الإلكتروني له نفس
                  الصلاحية القانونية للتوقيع بخط اليد بموجب القانون الجزائري 10-11 المؤرخ في 29 يونيو 2010.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={signingData.agreedToTerms}
                onChange={(e) =>
                  setSigningData((prev) => ({
                    ...prev,
                    agreedToTerms: e.target.checked,
                  }))
                }
                className="mt-1 w-4 h-4 rounded border-input"
              />
              <span className="text-sm">
                I have read and agree to the terms of this contract and confirm that I am
                authorized to sign on behalf of{' '}
                <strong>{signerRole === 'PARTY_A' ? 'the Supplier (Party A)' : 'the Buyer (Party B)'}</strong>.
                <br />
                <span className="text-muted-foreground">
                  لقد قرأت ووافقت على شروط هذا العقد وأؤكد أنا مفوض للتوقيع نيابة عن الطرف المعني.
                </span>
              </span>
            </label>
          </div>

          {/* Security Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
            <Shield className="w-4 h-4" />
            <span>Your signature will be encrypted and timestamped for security.</span>
            <Clock className="w-4 h-4 ml-auto" />
            <span>Timestamp: {new Date().toISOString()}</span>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel / إلغاء
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || isLoading}
              className="min-w-[160px]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Signature
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ContractSigner;
