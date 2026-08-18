// Security Utilities for ERP Integration
// AES-256 encryption for credentials, rate limiting, IP allowlisting
// AlgeriaTrade.dz B2B Platform - Inventory/ERP Sync System

import crypto from 'crypto'

// ============================================
// ENCRYPTION UTILITIES
// ============================================

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param text - Plain text to encrypt
 * @param key - Encryption key (should be stored securely, e.g., in environment variable)
 * @returns Encrypted string (base64 encoded with iv and tag)
 */
export function encrypt(text: string, key: string): string {
  try {
    const keyBuffer = Buffer.from(key.padEnd(32).slice(0, 32), 'hex')
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // Combine iv + tag + encrypted
    const combined = iv.toString('hex') + tag.toString('hex') + encrypted
    
    return Buffer.from(combined, 'hex').toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt data that was encrypted with encrypt()
 * @param encryptedData - Base64 encoded encrypted data
 * @param key - Same encryption key used for encryption
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string, key: string): string {
  try {
    const keyBuffer = Buffer.from(key.padEnd(32).slice(0, 32), 'hex')
    const combined = Buffer.from(encryptedData, 'base64').toString('hex')
    
    // Extract iv, tag, and encrypted data
    const iv = Buffer.from(combined.slice(0, IV_LENGTH * 2), 'hex')
    const tag = Buffer.from(combined.slice(IV_LENGTH * 2, IV_LENGTH * 2 + TAG_LENGTH * 2), 'hex')
    const encrypted = combined.slice((IV_LENGTH + TAG_LENGTH) * 2)
    
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data. The data may be corrupted or the key is incorrect.')
  }
}

/**
 * Generate a secure random key for encryption
 * @returns Hex-encoded 256-bit key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash a value using SHA-256 (for non-sensitive data like webhook signatures)
 */
export function hashSHA256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Generate HMAC-SHA256 signature for webhook verification
 */
export function generateHMAC(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

/**
 * Verify HMAC-SHA256 signature
 */
export function verifyHMAC(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateHMAC(payload, secret)
  
  // Use timing-safe comparison
  if (signature.length !== expectedSignature.length) {
    return false
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

// ============================================
// CREDENTIAL MASKING
// ============================================

/**
 * Mask sensitive credential values for logging/display
 * Masks all but first and last few characters
 */
export function maskCredential(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars * 2) {
    return '***'
  }
  
  const start = value.slice(0, visibleChars)
  const end = value.slice(-visibleChars)
  const maskLength = Math.max(0, value.length - visibleChars * 2)
  
  return `${start}${'*'.repeat(maskLength)}${end}`
}

/**
 * Mask URL credentials (user:pass in URL)
 */
export function maskURL(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // Mask password in userinfo
    if (url.password) {
      url.password = maskCredential(url.password, 2)
    }
    
    // Mask username if present
    if (url.username && url.username !== '') {
      url.username = maskCredential(url.username, 2)
    }
    
    return url.toString()
  } catch {
    // If URL parsing fails, do basic masking
    return url.replace(/\/\/[^:]+:[^@]+@/, '://***:***@')
  }
}

// ============================================
// RATE LIMITING (In-Memory Implementation)
// ============================================

interface RateLimitEntry {
  count: number
  resetAt: Date
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private maxRequests: number
  private windowMs: number
  
  constructor(maxRequests: number = 60, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }
  
  /**
   * Check if request is allowed
   * @param identifier - Unique identifier (IP address, API key, etc.)
   * @returns { allowed: boolean, remaining: number, resetAt: Date }
   */
  check(identifier: string): { allowed: boolean; remaining: number; resetAt: Date } {
    const now = new Date()
    const entry = this.limits.get(identifier)
    
    if (!entry || entry.resetAt < now) {
      // Create new entry or reset expired one
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: new Date(now.getTime() + this.windowMs),
      }
      this.limits.set(identifier, newEntry)
      
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: newEntry.resetAt,
      }
    }
    
    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      }
    }
    
    entry.count++
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetAt: entry.resetAt,
    }
  }
  
  /**
   * Reset rate limit for an identifier (e.g., after successful auth)
   */
  reset(identifier: string): void {
    this.limits.delete(identifier)
  }
  
  private cleanup(): void {
    const now = new Date()
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetAt < now) {
        this.limits.delete(key)
      }
    }
  }
}

// Pre-configured rate limiters for different use cases
export const apiRateLimiter = new RateLimiter(100, 60000) // 100 requests per minute
export const webhookRateLimiter = new RateLimiter(30, 60000) // 30 webhooks per minute
export const syncRateLimiter = new RateLimiter(10, 60000) // 10 sync triggers per minute

// ============================================
// IP ALLOWLISTING
// ============================================

class IPAllowlist {
  private allowedIPs: Set<string>
  private blockedIPs: Set<string>
  
  constructor(allowedIPs?: string[], blockedIPs?: string[]) {
    this.allowedIPs = new Set(allowedIPs || [])
    this.blockedIPs = new Set(blockedIPs || [])
  }
  
  /**
   * Check if IP is allowed
   */
  isAllowed(ip: string): boolean {
    // If blocked, always deny
    if (this.blockedIPs.has(ip)) {
      return false
    }
    
    // If no allowlist configured, allow all (except blocked)
    if (this.allowedIPs.size === 0) {
      return true
    }
    
    return this.allowedIPs.has(ip)
  }
  
  addAllowed(ip: string): void {
    this.allowedIPs.add(ip)
  }
  
  removeAllowed(ip: string): void {
    this.allowedIPs.delete(ip)
  }
  
  block(ip: string): void {
    this.blockedIPs.add(ip)
  }
  
  unblock(ip: string): void {
    this.blockedIPs.delete(ip)
  }
}

// Default allowlists for different services
export const webhookIPAllowlist = new IPAllowlist()

// ============================================
// INPUT VALIDATION & SANITIZATION
// ============================================

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
}

/**
 * Validate ERP type
 */
export function isValidERPType(type: string): boolean {
  const validTypes = ['SAP', 'Odoo', 'MicrosoftDynamics', 'Custom', 'REST']
  return validTypes.includes(type)
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validate API key format (basic validation)
 */
export function isValidAPIKey(key: string): boolean {
  // Basic validation: not empty, reasonable length
  return typeof key === 'string' && key.length >= 8 && key.length <= 256
}

// Export utilities
export default {
  encrypt,
  decrypt,
  generateEncryptionKey,
  hashSHA256,
  generateHMAC,
  verifyHMAC,
  maskCredential,
  maskURL,
  sanitizeString,
  isValidERPType,
  isValidURL,
  isValidAPIKey,
  RateLimiter,
  IPAllowlist,
}
