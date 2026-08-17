'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pen, 
  Eraser, 
  RotateCcw,
  Check,
  Download
} from 'lucide-react';

interface SignaturePadProps {
  onSignatureComplete: (signatureDataUrl: string) => void;
  width?: number;
  height?: number;
  label?: string;
  labelAr?: string;
  labelFr?: string;
  partyName?: string;
  language?: 'en' | 'ar' | 'fr';
}

export function SignaturePad({
  onSignatureComplete,
  width = 400,
  height = 200,
  label,
  labelAr,
  labelFr,
  partyName,
  language = 'en',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in event) {
      const touch = event.touches[0] || event.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    setIsDrawing(true);
    const pos = getCoordinates(event);
    setLastPos(pos);
  }, []);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPos) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPos = getCoordinates(event);

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    setLastPos(currentPos);
    setHasSignature(true);
  }, [isDrawing, lastPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setLastPos(null);
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const signatureDataUrl = canvas.toDataURL('image/png');
    onSignatureComplete(signatureDataUrl);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const link = document.createElement('a');
    link.download = `signature-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Initialize canvas with white background
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set actual canvas size
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale context for retina displays
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw signature line
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.85);
    ctx.lineTo(width * 0.9, height * 0.85);
    ctx.stroke();

    // Draw "Sign above" text
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      getLabel('Sign above this line', 'وقّع فوق هذا الخط', 'Signez au-dessus de cette ligne'),
      width / 2,
      height * 0.95
    );
  }, [width, height, language]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Pen className="h-4 w-4" />
            {label || getLabel('Digital Signature', 'التوقيع الرقمي', 'Signature numérique')}
          </span>
          
          {hasSignature && (
            <Badge variant="default" className="bg-green-500">
              ✓ Signed
            </Badge>
          )}
        </CardTitle>
        
        {partyName && (
          <p className="text-sm text-muted-foreground">
            {getLabel('Signing as', 'التوقيع كـ', 'Signer en tant que')}: {partyName}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Canvas */}
        <div className="border rounded-lg overflow-hidden bg-white shadow-inner">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="touch-none cursor-crosshair w-full"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            disabled={!hasSignature}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            {getLabel('Clear', 'مسح', 'Effacer')}
          </Button>

          <div className="flex items-center gap-2">
            {hasSignature && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Save
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!hasSignature}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4" />
              {getLabel('Confirm', 'تأكيد', 'Confirmer')}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-xs text-center text-muted-foreground">
          {getLabel(
            'Use your mouse or touch to draw your signature',
            'استخدم الماوس أو اللمس لرسم توقيعك',
            'Utilisez la souris ou le tactile pour dessiner votre signature'
          )}
        </p>
      </CardContent>
    </Card>
  );
}

// Typed signature input alternative
interface TypedSignatureProps {
  onSignatureComplete: (signatureText: string) => void;
  name?: string;
  language?: 'en' | 'ar' | 'fr';
}

export function TypedSignature({ 
  onSignatureComplete, 
  name,
  language = 'en'
}: TypedSignatureProps) {
  const [signatureText, setSignatureText] = useState('');

  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {getLabel('Type Your Full Name', 'اكتب اسمك الكامل', 'Tapez votre nom complet')}
          </label>
          <input
            type="text"
            value={signatureText}
            onChange={(e) => setSignatureText(e.target.value)}
            placeholder={name || getLabel('Full Legal Name', 'الاسم القانوني الكامل', 'Nom légal complet')}
            className="w-full px-3 py-2 border rounded-md font-serif italic text-xl tracking-wider"
            style={{ fontFamily: "'Brush Script MT', cursive" }}
          />
        </div>

        <div className="border-t pt-4 mt-4">
          <p className="text-sm text-muted-foreground mb-2">
            {getLabel('Preview:', 'معاينة:', 'Aperçu:')}
          </p>
          <div className="min-h-[60px] p-4 bg-muted/50 rounded-md flex items-end justify-start">
            {signatureText ? (
              <span 
                className="font-serif italic text-2xl tracking-wider text-primary"
                style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
              >
                {signatureText}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm italic">
                Your signature will appear here
              </span>
            )}
          </div>
        </div>

        <Button
          onClick={() => onSignatureComplete(signatureText)}
          disabled={!signatureText.trim()}
          className="w-full"
        >
          {getLabel('Confirm Signature', 'تأكيد التوقيع', 'Confirmer la signature')}
        </Button>

        <p className="text-xs text-center text-orange-600">
          ⚠️ {getLabel(
            'Typed signatures may have limited legal validity',
            'قد تكون التوقيعات المكتوبة محدودة الصلاحية القانونية',
            'Les signatures tapées peuvent avoir une validité juridique limitée'
          )}
        </p>
      </CardContent>
    </Card>
  );
}

export default SignaturePad;
