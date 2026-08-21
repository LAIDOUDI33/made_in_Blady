'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback } from '@/lib/pwa/enhancements';
import {
  QrCode,
  Barcode,
  Camera,
  FileText,
  CreditCard,
  X,
  Zap,
  Check,
  AlertCircle,
  RotateCcw,
  Flashlight,
  FlashlightOff,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============ Types ============
type ScannerMode = 'qr' | 'barcode' | 'document' | 'businesscard';

interface ScanResult {
  type: ScannerMode;
  data: string;
  format?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface BusinessCardData {
  name?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
}

interface MobileCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (result: ScanResult) => void;
  initialMode?: ScannerMode;
  allowedModes?: ScannerMode[];
  title?: string;
}

// ============ Main Scanner Component ============
export function MobileCameraScanner({
  isOpen,
  onClose,
  onScanComplete,
  initialMode = 'qr',
  allowedModes = ['qr', 'barcode', 'document', 'businesscard'],
  title = 'Scanner',
}: MobileCameraScannerProps) {
  const [currentMode, setCurrentMode] = useState<ScannerMode>(initialMode);
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Start camera when scanner opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
        setIsScanning(true);
        startScanningLoop();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
      triggerHapticFeedback('error');
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsScanning(false);
  };

  const startScanningLoop = () => {
    const scan = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // Get image data for scanning
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Process based on current mode
        processImageData(imageData);
      }

      animationFrameRef.current = requestAnimationFrame(scan);
    };

    animationFrameRef.current = requestAnimationFrame(scan);
  };

  const processImageData = async (imageData: ImageData) => {
    // This is a simplified implementation
    // In production, you would use libraries like:
    // - ZXing for QR/Barcode scanning
    // - Tesseract.js for OCR
    // - ML models for document/business card detection
    
    switch (currentMode) {
      case 'qr':
        await scanQRCode(imageData);
        break;
      case 'barcode':
        await scanBarcode(imageData);
        break;
      case 'document':
        await captureDocument(imageData);
        break;
      case 'businesscard':
        await scanBusinessCard(imageData);
        break;
    }
  };

  const scanQRCode = async (imageData: ImageData): Promise<void> => {
    // Simulated QR code detection
    // In production, use jsQR or similar library
    if (Math.random() > 0.995) { // Simulate occasional detection
      const mockResult: ScanResult = {
        type: 'qr',
        data: `https://algeriatrade.dz/products/${Math.random().toString(36).substr(2, 9)}`,
        format: 'QR_CODE',
        timestamp: new Date(),
      };
      handleSuccessfulScan(mockResult);
    }
  };

  const scanBarcode = async (imageData: ImageData): Promise<void> => {
    // Simulated barcode detection
    // In production, use ZXing or similar library
    if (Math.random() > 0.998) {
      const formats = ['EAN_13', 'CODE_128', 'UPC_A'];
      const mockResult: ScanResult = {
        type: 'barcode',
        data: Math.floor(Math.random() * 1000000000000).toString(),
        format: formats[Math.floor(Math.random() * formats.length)],
        timestamp: new Date(),
      };
      handleSuccessfulScan(mockResult);
    }
  };

  const captureDocument = async (imageData: ImageData): Promise<void> => {
    // Document capture - user triggers manually
  };

  const scanBusinessCard = async (imageData: ImageData): Promise<void> => {
    // Business card OCR - simulated
    // In production, use Tesseract.js or cloud OCR API
  };

  const handleSuccessfulScan = (result: ScanResult) => {
    triggerHapticFeedback('success');
    setLastResult(result);
    onScanComplete(result);
    
    // Vibrate to indicate success
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = track.getCapabilities();
      if ('torch' in capabilities) {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled }],
        });
        setFlashEnabled(!flashEnabled);
        triggerHapticFeedback('light');
      }
    } catch (err) {
      console.error('Flash toggle error:', err);
    }
  };

  const handleManualCapture = () => {
    if (!canvasRef.current || !videoRef.current) return;

    setIsProcessing(true);
    triggerHapticFeedback('medium');

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Convert to blob and process based on mode
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        let result: ScanResult;

        switch (currentMode) {
          case 'document':
            result = {
              type: 'document',
              data: URL.createObjectURL(blob),
              format: 'IMAGE_PNG',
              timestamp: new Date(),
              metadata: { size: blob.size, type: blob.type },
            };
            break;
          
          case 'businesscard':
            // Simulate OCR processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            result = {
              type: 'businesscard',
              data: JSON.stringify({
                name: 'Ahmed Benali',
                company: 'AlgeriaTrade SARL',
                title: 'Sales Director',
                email: 'ahmed@algeriatrade.dz',
                phone: '+213 555 123 456',
              } as BusinessCardData),
              format: 'BUSINESS_CARD_OCR',
              timestamp: new Date(),
              metadata: { size: blob.size, type: blob.type },
            };
            break;
          
          default:
            result = {
              type: currentMode,
              data: URL.createObjectURL(blob),
              format: 'IMAGE_PNG',
              timestamp: new Date(),
            };
        }

        handleSuccessfulScan(result);
        setIsProcessing(false);
      }, 'image/png');
    }
  };

  const switchMode = (mode: ScannerMode) => {
    setCurrentMode(mode);
    triggerHapticFeedback('selection');
    setLastResult(null);
  };

  const resetScanner = () => {
    setLastResult(null);
    setError(null);
    triggerHapticFeedback('light');
  };

  if (!isOpen) return null;

  const modeConfig = {
    qr: {
      icon: QrCode,
      label: 'QR Code',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500',
      description: 'Align QR code within frame',
    },
    barcode: {
      icon: Barcode,
      label: 'Barcode',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
      description: 'Align barcode within frame',
    },
    document: {
      icon: FileText,
      label: 'Document',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
      description: 'Position document clearly',
    },
    businesscard: {
      icon: CreditCard,
      label: 'Business Card',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500',
      description: 'Place card on flat surface',
    },
  };

  const currentConfig = modeConfig[currentMode];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
        <button
          onClick={() => {
            stopCamera();
            onClose();
            triggerHapticFeedback('light');
          }}
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white min-w-[44px] min-h-[44px]"
          aria-label="Close scanner"
        >
          <X className="w-6 h-6" />
        </button>

        <h1 className="text-white font-semibold text-lg">{title}</h1>

        <button
          onClick={toggleFlash}
          disabled={currentMode === 'document'}
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 min-w-[44px] min-h-[44px]"
          aria-label={flashEnabled ? 'Disable flash' : 'Enable flash'}
        >
          {flashEnabled ? (
            <FlashlightOff className="w-5 h-5" />
          ) : (
            <Flashlight className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning Frame Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-64 h-64 border-2 rounded-3xl relative ${currentConfig.color.replace("text-", "border-")}`}>
            {/* Corner Markers */}
            <div className={cn(
              "absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl",
              currentConfig.color.replace('text-', 'border-')
            )} />
            <div className={cn(
              "absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl",
              currentConfig.color.replace('text-', 'border-')
            )} />
            <div className={cn(
              "absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl",
              currentConfig.color.replace('text-', 'border-')
            )} />
            <div className={cn(
              "absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 rounded-br-xl",
              currentConfig.color.replace('text-', 'border-')
            )} />

            {/* Scan Line Animation */}
            {(currentMode === 'qr' || currentMode === 'barcode') && isScanning && (
              <div 
                className={cn(
                  "absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-currentConfig-color to-transparent animate-scan",
                  currentConfig.bgColor
                )}
                style={{
                  animation: 'scan 2s ease-in-out infinite',
                  boxShadow: `0 0 20px ${currentConfig.color.includes('emerald') ? '#10b981' : currentConfig.color.includes('blue') ? '#3b82f6' : '#fff'}`,
                }}
              />
            )}
          </div>
        </div>

        {/* Mode Description */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white/80 text-sm">{currentConfig.description}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-500/90 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-white shrink-0" />
            <p className="text-white text-sm">{error}</p>
          </div>
        )}

        {/* Success Result */}
        {lastResult && (
          <div className="absolute top-4 left-4 right-4 bg-green-500/90 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-white shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">Scan Successful!</p>
                <p className="text-white/80 text-xs mt-1 truncate">{lastResult.data}</p>
              </div>
              <button
                onClick={resetScanner}
                className="text-white/80 hover:text-white min-w-[44px] min-h-[44px] p-2"
                aria-label="Scan again"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Processing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Mode Selector */}
      <div className="bg-black/90 backdrop-blur-sm p-4">
        <div className="flex justify-around mb-4">
          {allowedModes.map((mode) => {
            const config = modeConfig[mode];
            const IconComponent = config.icon;
            const isActive = mode === currentMode;

            return (
              <button
                key={mode}
                onClick={() => switchMode(mode)}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all",
                  "min-w-[72px]",
                  isActive ? 'bg-white/15' : 'hover:bg-white/5'
                )}
                aria-label={`Switch to ${config.label} mode`}
                aria-pressed={isActive}
              >
                <IconComponent className={cn(
                  "w-7 h-7 transition-colors",
                  isActive ? config.color : 'text-gray-400'
                )} />
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? 'text-white' : 'text-gray-400'
                )}>
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Capture Button (for document/card modes) */}
        {(currentMode === 'document' || currentMode === 'businesscard') && (
          <div className="flex justify-center pb-2">
            <button
              onClick={handleManualCapture}
              disabled={isProcessing}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center",
                "transition-all active:scale-95",
                "border-4 border-white shadow-lg",
                currentConfig.bgColor,
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Capture"
            >
              {isProcessing ? (
                <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-white" />
              )}
            </button>
          </div>
        )}

        {/* Upload Alternative */}
        <div className="flex justify-center pt-2">
          <label className="
            flex items-center gap-2 px-4 py-2
            bg-white/10 rounded-full
            text-white/70 text-sm
            cursor-pointer hover:bg-white/15
            transition-colors
            min-h-[44px]
          ">
            <ImageIcon className="w-4 h-4" />
            Upload Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  triggerHapticFeedback('success');
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result: ScanResult = {
                      type: currentMode,
                      data: reader.result as string,
                      format: 'UPLOAD_IMAGE',
                      timestamp: new Date(),
                    };
                    handleSuccessfulScan(result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes scan {
          0%, 100% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: calc(100% - 2px); opacity: 0; }
        }
        
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// ============ Quick Scan Button Component ============
interface QuickScanButtonProps {
  mode: ScannerMode;
  onOpen: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function QuickScanButton({ mode, onOpen, size = 'md' }: QuickScanButtonProps) {
  const icons = {
    qr: QrCode,
    barcode: Barcode,
    document: FileText,
    businesscard: CreditCard,
  };

  const labels = {
    qr: 'Scan QR',
    barcode: 'Scan Barcode',
    doc: 'Scan Document',
    businesscard: 'Scan Card',
  };

  const IconComponent = icons[size === 'sm' ? 'qr' : mode];

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  return (
    <button
      onClick={() => {
        triggerHapticFeedback('medium');
        onOpen();
      }}
      className={cn(
        "rounded-2xl",
        "bg-gradient-to-br from-violet-500 to-purple-600",
        "text-white shadow-lg shadow-purple-500/25",
        "flex items-center justify-center",
        "transition-all duration-200",
        "active:scale-95 hover:shadow-xl hover:shadow-purple-500/40",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/50",
        sizeClasses[size],
        "min-w-[56px] min-h-[56px]"
      )}
      aria-label={`Open ${labels[mode]} scanner`}
    >
      <IconComponent className={iconSizes[size]} strokeWidth={2} />
    </button>
  );
}

// ============ Scan Result Display ============
interface ScanResultDisplayProps {
  result: ScanResult;
  onAction?: (action: 'copy' | 'open' | 'share') => void;
}

export function ScanResultDisplay({ result, onAction }: ScanResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.data);
      setCopied(true);
      triggerHapticFeedback('success');
      setTimeout(() => setCopied(false), 2000);
      onAction?.('copy');
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const openLink = () => {
    if (result.data.startsWith('http')) {
      window.open(result.data, '_blank');
      onAction?.('open');
    }
  };

  const shareResult = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Scanned Code',
          text: result.data,
        });
        onAction?.('share');
      } catch (err) {
        // User cancelled sharing
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          result.type === 'qr' && "bg-emerald-100 text-emerald-600",
          result.type === 'barcode' && "bg-blue-100 text-blue-600",
          result.type === 'document' && "bg-orange-100 text-orange-600",
          result.type === 'businesscard' && "bg-purple-100 text-purple-600"
        )}>
          {{
            qr: QrCode,
            barcode: Barcode,
            document: FileText,
            businesscard: CreditCard,
          }[result.type]?.({ className: 'w-5 h-5' })}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 capitalize">
              {result.type.replace('businesscard', 'Business Card')}
            </span>
            {result.format && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {result.format}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 font-mono truncate">
            {result.data}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {result.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="flex-1 min-h-[40px]"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1.5" />
              Copied!
            </>
          ) : (
            'Copy'
          )}
        </Button>

        {result.data.startsWith('http') && (
          <Button
            variant="outline"
            size="sm"
            onClick={openLink}
            className="flex-1 min-h-[40px]"
          >
            Open
          </Button>
        )}

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button
            variant="outline"
            size="sm"
            onClick={shareResult}
            className="min-h-[40px] px-3"
          >
            Share
          </Button>
        )}
      </div>
    </div>
  );
}

export default MobileCameraScanner;
