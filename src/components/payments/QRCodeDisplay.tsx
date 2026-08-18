'use client'

import { useRef, useState, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Download, QrCode, Printer, Maximize2 } from 'lucide-react'

interface QRCodeDisplayProps {
  value: string
  size?: number
  title?: string
  showDownload?: boolean
  showPrint?: boolean
  bgColor?: string
  fgColor?: string
  // For crypto-specific display
  amount?: string
  cryptocurrency?: string
  address?: string
}

export function QRCodeDisplay({
  value,
  size = 200,
  title = 'Scan to Pay',
  showDownload = true,
  showPrint = true,
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  amount,
  cryptocurrency,
  address,
}: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const downloadQRCode = useCallback(() => {
    if (!qrRef.current) return

    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = size * 2
      canvas.height = size * 2
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      const pngUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = `qrcode-${cryptocurrency || 'payment'}-${Date.now()}.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }, [size, bgColor, cryptocurrency])

  const printQRCode = useCallback(() => {
    if (!qrRef.current) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${title}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 40px;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
            }
            h2 { margin-bottom: 10px; color: #1f2937; }
            p { margin: 5px 0; color: #6b7280; }
            .address { 
              font-family: monospace; 
              word-break: break-all;
              max-width: 300px;
              margin-top: 15px;
              padding: 10px;
              background: #f3f4f6;
              border-radius: 6px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>${title}</h2>
            ${amount ? `<p><strong>Amount:</strong> ${amount} ${cryptocurrency || ''}</p>` : ''}
            ${address ? `<div class="address"><strong>Address:</strong> ${address}</div>` : ''}
            <div style="margin-top: 20px;">
              ${svgData}
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
              Scan this QR code with your cryptocurrency wallet
            </p>
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }, [title, amount, cryptocurrency, address])

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        {(title || (amount && cryptocurrency)) && (
          <div className="text-center mb-3">
            {title && <h3 className="font-semibold text-sm">{title}</h3>}
            {amount && cryptocurrency && (
              <p className="text-lg font-bold mt-1">
                {amount} <span className="text-muted-foreground text-sm">{cryptocurrency}</span>
              </p>
            )}
          </div>
        )}

        {/* QR Code */}
        <div className="flex justify-center">
          <div 
            ref={qrRef}
            className="relative bg-white p-3 rounded-lg border"
          >
            <QRCodeSVG
              value={value}
              size={size}
              level="H" // High error correction
              bgColor={bgColor}
              fgColor={fgColor}
              includeMargin={true}
            />
            
            {/* Cryptocurrency icon overlay in center */}
            {cryptocurrency && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white p-2 rounded-md shadow-sm">
                  <CryptoIcon type={cryptocurrency} size={size * 0.15} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Address display */}
        {address && (
          <div className="mt-3 p-2 bg-muted rounded text-xs font-mono break-all text-center">
            {address.slice(0, 20)}...{address.slice(-8)}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-4 justify-center">
          {showDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQRCode}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Save
            </Button>
          )}
          
          {showPrint && (
            <Button
              variant="outline"
              size="sm"
              onClick={printQRCode}
              className="flex items-center gap-1"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Maximize2 className="h-4 w-4" />
                Enlarge
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                  Scan this QR code with your wallet app
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-4">
                <div ref={qrRef} className="bg-white p-6 rounded-lg border">
                  <QRCodeSVG
                    value={value}
                    size={300}
                    level="H"
                    bgColor={bgColor}
                    fgColor={fgColor}
                    includeMargin={true}
                  />
                </div>
              </div>
              {address && (
                <div className="mt-2 p-3 bg-muted rounded text-xs font-mono break-all">
                  {address}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

// Simple cryptocurrency icon component
function CryptoIcon({ type, size }: { type: string; size: number }) {
  const icons: Record<string, string> = {
    BTC: '₿',
    ETH: 'Ξ',
    USDT: '₮',
    USDC: '$',
  }

  return (
    <span 
      style={{ fontSize: `${size}px` }}
      className="font-bold"
    >
      icons[type] || '?'
    </span>
  )
}

export default QRCodeDisplay
