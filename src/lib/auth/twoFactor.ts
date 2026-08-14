/**
 * Two-Factor Authentication (2FA) Library
 * Implements TOTP-based 2FA with backup codes
 * For AlgeriaTrade.dz B2B Platform
 */

import { TOTP, Secret } from 'otpauth';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Get encryption key from environment or generate a deterministic one for development
function getEncryptionKey(): Buffer {
  const key = process.env.TWO_FACTOR_ENCRYPTION_KEY || 'algeriatrade-2fa-encryption-key-2024!';
  return crypto.scryptSync(key, 'salt', ENCRYPTION_KEY_LENGTH);
}

/**
 * Encrypt a string using AES-256-GCM
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Return iv:tag:encrypted
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string using AES-256-GCM
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate a new TOTP secret
 */
export function generateSecret(): { secret: string; encryptedSecret: string } {
  const secret = new Secret({ size: 20 }); // 160 bits (standard)
  const base32Secret = secret.base32;
  const encryptedSecret = encrypt(base32Secret);
  
  return {
    secret: base32Secret,
    encryptedSecret,
  };
}

/**
 * Generate TOTP QR code URI for authenticator apps
 * Format: otpauth://totp/Issuer:Account?secret=SECRET&issuer=ISSUER&algorithm=SHA1&digits=6&period=30
 */
export function generateQRCodeURI(
  email: string,
  secret: string,
  issuer: string = 'AlgeriaTrade'
): string {
  const totp = new TOTP({
    issuer,
    label: email,
    secret: Secret.fromBase32(secret),
    digits: 6,
    period: 30,
  });
  
  return totp.toString(); // Returns otpauth:// URI
}

/**
 * Generate QR code as data URL (for display in browser)
 */
export async function generateQRCodeDataURL(uri: string): Promise<string> {
  try {
    const dataURL = await QRCode.toDataURL(uri, {
      width: 256,
      margin: 2,
      color: {
        dark: '#006233', // Algeria green
        light: '#FFFFFF',
      },
    });
    return dataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Impossible de générer le code QR');
  }
}

/**
 * Verify TOTP code against secret
 * Allows for clock drift (window of 1 period before and after)
 */
export function verifyTOTP(
  token: string,
  encryptedSecret: string,
  window: number = 1
): boolean {
  try {
    const secretString = decrypt(encryptedSecret);
    const secret = Secret.fromBase32(secretString);
    
    const totp = new TOTP({
      issuer: 'AlgeriaTrade',
      label: '',
      secret,
      digits: 6,
      period: 30,
    });
    
    // Validate with window for clock drift tolerance
    const delta = totp.validate({ token, window });
    
    // delta === 0 means exact match, positive/negative values indicate time drift
    return delta !== null;
  } catch (error) {
    console.error('Error verifying TOTP:', error);
    return false;
  }
}

/**
 * Generate backup codes (10 codes)
 * Each code is a random 8-character alphanumeric string
 */
export function generateBackupCodes(count: number = 10): { codes: string[]; encryptedCodes: string } {
  const codes: string[] = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32-like characters (no confusing chars)
  
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Format as XXXX-XXXX for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  
  const encryptedCodes = encrypt(JSON.stringify(codes));
  
  return { codes, encryptedCodes };
}

/**
 * Verify a backup code
 * Marks the code as used by removing it from the list
 */
export function verifyBackupCode(
  code: string,
  encryptedCodes: string
): { valid: boolean; remainingEncryptedCodes?: string } {
  try {
    const codes: string[] = JSON.parse(decrypt(encryptedCodes));
    const normalizedInput = code.toUpperCase().trim();
    
    const codeIndex = codes.findIndex(
      (c) => c.toUpperCase().trim() === normalizedInput
    );
    
    if (codeIndex === -1) {
      return { valid: false };
    }
    
    // Remove the used code
    codes.splice(codeIndex, 1);
    
    return {
      valid: true,
      remainingEncryptedCodes: encrypt(JSON.stringify(codes)),
    };
  } catch (error) {
    console.error('Error verifying backup code:', error);
    return { valid: false };
  }
}

/**
 * Get remaining backup codes count
 */
export function getRemainingBackupCodesCount(encryptedCodes: string | null): number {
  if (!encryptedCodes) return 0;
  
  try {
    const codes: string[] = JSON.parse(decrypt(encryptedCodes));
    return codes.length;
  } catch {
    return 0;
  }
}

/**
 * Hash a verification code for storage (for rate limiting/comparison)
 */
export function hashVerificationCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Generate a secure random token for session/verification
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Check if 2FA is properly configured for a user
 */
export interface TwoFactorConfig {
  enabled: boolean;
  hasSecret: boolean;
  hasBackupCodes: boolean;
  backupCodesCount: number;
}

export function getTwoFactorConfig(
  enabled: boolean,
  encryptedSecret: string | null,
  encryptedBackupCodes: string | null
): TwoFactorConfig {
  return {
    enabled,
    hasSecret: !!encryptedSecret,
    hasBackupCodes: !!encryptedBackupCodes && getRemainingBackupCodesCount(encryptedBackupCodes) > 0,
    backupCodesCount: getRemainingBackupCodesCount(encryptedBackupCodes),
  };
}

// French language constants for UI
export const TWO_FACTOR_MESSAGES = {
  setup: {
    title: "Configuration de l'authentification à deux facteurs",
    description: 'Protégez votre compte avec une couche de sécurité supplémentaire.',
    step1: 'Scannez ce QR code avec votre application d\'authentification',
    step2: 'Ou entrez ce code manuellement :',
    step3: 'Entrez le code de vérification de 6 chiffres pour confirmer la configuration',
    scanWith: 'Scannez avec Google Authenticator, Authy, ou toute application compatible TOTP',
    backupTitle: 'Codes de secours',
    backupDescription: 'Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu\'une seule fois.',
    downloadCodes: 'Télécharger les codes',
    printCodes: 'Imprimer les codes',
    verifyButton: 'Vérifier et activer',
    success: "L'authentification à deux facteurs est maintenant activée !",
  },
  login: {
    title: 'Vérification en deux étapes',
    description: 'Entrez le code de votre application d\'authentification',
    codePlaceholder: '000000',
    verifyButton: 'Vérifier',
    useBackup: 'Utiliser un code de secours',
    rememberDevice: 'Se souvenir de cet appareil pendant 30 jours',
    resendCode: 'Renvoyer le code',
    codeExpires: 'Le code expire dans',
    seconds: 'secondes',
  },
  disable: {
    title: "Désactiver l'authentification à deux facteurs",
    confirmation: 'Êtes-vous sûr de vouloir désactiver la 2FA ?',
    warning: 'Votre compte sera moins sécurisé sans l\'authentification à deux facteurs.',
    enterPassword: 'Entrez votre mot de passe',
    enter2FACode: 'Entrez votre code 2FA actuel',
    confirmButton: 'Confirmer la désactivation',
    success: 'La 2FA a été désactivée avec succès.',
  },
  errors: {
    invalidCode: 'Code invalide. Veuillez réessayer.',
    expiredCode: 'Ce code a expiré. Veuillez en demander un nouveau.',
    rateLimit: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
    setupFailed: 'Échec de la configuration. Veuillez réessayer.',
    notEnabled: 'La 2FA n\'est pas activée sur ce compte.',
    alreadyEnabled: 'La 2FA est déjà activée sur ce compte.',
  },
};
