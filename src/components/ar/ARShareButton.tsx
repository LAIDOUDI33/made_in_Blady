'use client'

import React, { useState } from 'react'
import { 
  Share2, 
  Download, 
  Link2, 
  MessageCircle,
  QrCode,
  Check,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface ARShareButtonProps {
  productName: string
  onShare: (platform: string) => void
  className?: string
}

export default function ARShareButton({
  productName,
  onShare,
  className = '',
}: ARShareButtonProps) {
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      toast.success('Link copied to clipboard!')
      
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = (platform: string) => {
    onShare(platform)
    toast.success(`Sharing to ${platform}...`)
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-sm font-medium text-gray-700">Share this model</span>
      
      <div className="flex items-center gap-2">
        {/* Direct action buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('download')}
          className="gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Screenshot
        </Button>

        {copiedLink ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-green-600 border-green-300 bg-green-50"
          >
            <Check className="w-3.5 h-3.5" />
            Copied!
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Link
          </Button>
        )}

        {/* More options dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* WhatsApp */}
            <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="cursor-pointer gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              WhatsApp
            </DropdownMenuItem>

            {/* Email */}
            <DropdownMenuItem onClick={() => handleShare('email')} className="cursor-pointer gap-2">
              <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              Email
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Generate QR Code */}
            <DropdownMenuItem onClick={() => handleShare('qrcode')} className="cursor-pointer gap-2">
              <QrCode className="w-4 h-4" />
              QR Code
            </DropdownMenuItem>

            {/* Facebook */}
            <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer gap-2">
              <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </DropdownMenuItem>

            {/* Twitter/X */}
            <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer gap-2">
              <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X (Twitter)
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* LinkedIn */}
            <DropdownMenuItem onClick={() => handleShare('linkedin')} className="cursor-pointer gap-2">
              <svg className="w-4 h-4 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Simple share button for product cards
export function ARViewBadge({
  productId,
  className = '',
}: {
  productId: string
  className?: string
}) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        window.location.href = `/products/${productId}?ar=true`
      }}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
        bg-gradient-to-r from-purple-500 to-indigo-500
        text-white text-xs font-medium
        hover:from-purple-600 hover:to-indigo-600
        transition-all duration-200 shadow-md hover:shadow-lg
        ${className}
      `}
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
      View in AR
    </button>
  )
}
