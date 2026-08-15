import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format amount as Algerian Dinar (DZD) currency
 * @param amount - The numeric amount to format
 * @returns Formatted currency string (e.g., "1 234,56 DA" or "1,234.56 DZD")
 */
export function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format number with Algerian locale
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-DZ').format(num)
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes script tags, event handlers, and dangerous attributes
 */
export function sanitizeHTML(html: string): string {
  if (!html) return ''
  
  return html
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers (onclick, onload, onerror, etc.)
    .replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Remove javascript: URLs
    .replace(/(href|src|action)\s*=\s*(?:")?\s*javascript:[^"]*"?/gi, '$1="#"')
    // Remove iframe/embed/object tags that could contain malicious content
    .replace(/<(iframe|embed|object|form|input|button|select|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Remove data: URIs (can contain inline scripts)
    .replace(/(href|src)\s*=\s*(?:")?\s*data:[^"]*"?/gi, '$1="#"')
    // Limit tag usage to safe set only
    .replace(/<(?!\/?(p|br|strong|b|em|i|u|ul|ol|li|span|h[1-6]|blockquote|code|pre|a|img|div)\b)[^>]*>/gi, '')
}
