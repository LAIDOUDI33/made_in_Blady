/**
 * Password Policy Service
 * Enforces strong password requirements for AlgeriaTrade.dz
 */

import crypto from 'crypto';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number; // 0-100
}

export interface PasswordPolicyConfig {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  minUniqueChars: number;
  maxConsecutiveSame: number;
  historyCheckCount: number; // Check last N passwords
}

// Common passwords that should be rejected (in French and English)
const COMMON_PASSWORDS = new Set([
  // English common passwords
  'password', 'password1', 'password123', 'pass', 'pass123',
  'admin', 'admin123', 'root', 'root123', 'user', 'user123',
  'qwerty', 'abc123', 'letmein', 'welcome', 'monkey',
  'dragon', 'master', 'login', 'baseball', 'football',
  'iloveyou', 'trustno1', 'sunshine', 'shadow', '123456',
  '12345678', '123456789', '1234567890', '123123', '111111',
  
  // French common passwords
  'motdepasse', 'motdepasse1', 'azerty', 'soleil', 'bonjour',
  'pomme', 'marseille', 'algerie', 'alger', 'dzaïr', 'dzayer',
  'café', 'france', 'paris', 'cheval', 'chien', 'chat',
  'coucou', 'salut', 'merci', 'amour', 'princesse',
]);

// Default password policy configuration
const DEFAULT_POLICY: PasswordPolicyConfig = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  minUniqueChars: 8,
  maxConsecutiveSame: 3,
  historyCheckCount: 5, // Cannot reuse last 5 passwords
};

/**
 * Calculate password strength score (0-100)
 */
function calculateStrength(password: string): number {
  let score = 0;

  // Length scoring (up to 25 points)
  if (password.length >= 8) score += 5;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety (up to 40 points)
  if (/[a-z]/.test(password)) score += 8;   // Lowercase
  if (/[A-Z]/.test(password)) score += 8;   // Uppercase
  if (/[0-9]/.test(password)) score += 8;   // Numbers
  if (/[^a-zA-Z0-9]/.test(password)) score += 16; // Special chars

  // Complexity bonuses (up to 35 points)
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.7) score += 10; // Good unique char ratio
  
  // Mixed patterns
  const patterns = [
    /[a-z][A-Z]/, // Case transition
    /[A-Z][a-z]/, // Case transition
    /\d\D/,      // Number-letter transition
    /\D\d/,      // Letter-number transition
    /\W\w/,      // Special-char transition
    /\w\W/,      // Char-special transition
  ];
  const patternMatches = patterns.filter(p => p.test(password)).length;
  score += Math.min(patternMatches * 5, 15);

  // Penalize common patterns
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated chars
  if (/^(?:012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/.test(password)) {
    score -= 15; // Sequential numbers
  }
  if (/^(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    score -= 15; // Sequential letters
  }
  if (/^(?:qwer|wert|erty|rtyu|tyui|yuio|uiop|asdf|sdfg|dfgh|fghj|ghjk|hjkl|jkl|zxcv|xcvc|cvbn|vbnm)/i.test(password)) {
    score -= 20; // Keyboard patterns
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get strength label from score
 */
function getStrengthLabel(score: number): PasswordValidationResult['strength'] {
  if (score < 30) return 'weak';
  if (score < 50) return 'fair';
  if (score < 75) return 'good';
  return 'strong';
}

/**
 * Get strength color class for UI
 */
export function getStrengthColor(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'weak': return 'text-red-600 bg-red-100';
    case 'fair': return 'text-orange-600 bg-orange-100';
    case 'good': return 'text-yellow-600 bg-yellow-100';
    case 'strong': return 'text-green-600 bg-green-100';
  }
}

/**
 * Get strength percentage width for progress bar
 */
export function getStrengthWidth(score: number): string {
  return `${score}%`;
}

/**
 * Validate password against policy
 */
export function validatePassword(
  password: string,
  user?: { email: string; firstName: string; lastName: string },
  customPolicy?: Partial<PasswordPolicyConfig>,
  oldPasswordsHashes?: string[] // For history check
): PasswordValidationResult {
  const policy = { ...DEFAULT_POLICY, ...customPolicy };
  const errors: string[] = [];

  // Length checks
  if (password.length < policy.minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${policy.minLength} caractères.`);
  }
  if (password.length > policy.maxLength) {
    errors.push(`Le mot de passe ne peut pas dépasser ${policy.maxLength} caractères.`);
  }

  // Character requirements
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule.');
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule.');
  }
  if (policy.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre.');
  }
  if (policy.requireSpecialChar && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*(),.?":{}|<>).');
  }

  // Unique characters check
  const uniqueChars = new Set(password).size;
  if (uniqueChars < policy.minUniqueChars) {
    errors.push(`Le mot de passe doit contenir au moins ${policy.minUniqueChars} caractères uniques.`);
  }

  // Consecutive same character check
  const consecutivePattern = new RegExp(`(.)\\1{${policy.maxConsecutiveSame},}`, 'g');
  if (consecutivePattern.test(password)) {
    errors.push(`Le mot de passe ne peut pas contenir plus de ${policy.maxConsecutiveSame + 1} caractères identiques consécutifs.`);
  }

  // Common password check
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Ce mot de passe est trop courant. Veuillez choisir un mot de passe plus sécurisé.');
  }

  // User info check (prevent using personal info in password)
  if (user) {
    const lowerPassword = password.toLowerCase();
    
    if (user.email && lowerPassword.includes(user.email.split('@')[0].toLowerCase())) {
      errors.push('Le mot de passe ne peut pas contenre votre adresse email.');
    }
    if (user.firstName && lowerPassword.includes(user.firstName.toLowerCase())) {
      errors.push('Le mot de passe ne peut pas contenre votre prénom.');
    }
    if (user.lastName && lowerPassword.includes(user.lastName.toLowerCase())) {
      errors.push('Le mot de passe ne peut pas contenre votre nom de famille.');
    }
  }

  // History check (if old passwords provided)
  if (oldPasswordsHashes && oldPasswordsHashes.length > 0) {
    const currentHash = crypto.createHash('sha256').update(password).digest('hex');
    
    const recentHashes = oldPasswordsHashes.slice(0, policy.historyCheckCount);
    if (recentHashes.includes(currentHash)) {
      errors.push(`Vous ne pouvez pas réutiliser l'un de vos ${policy.historyCheckCount} derniers mots de passe.`);
    }
  }

  // Calculate strength
  const score = calculateStrength(password);
  const strength = getStrengthLabel(score);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

/**
 * Generate a random secure password suggestion
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = lowercase + uppercase + numbers + special;
  
  // Ensure at least one of each required type
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * French language messages for password policy
 */
export const PASSWORD_MESSAGES = {
  title: 'Politique de mot de passe',
  requirements: 'Exigences du mot de passe',
  minLength: (n: number) => `Minimum ${n} caractères`,
  maxLength: (n: number) => `Maximum ${n} caractères`,
  requireUppercase: 'Au moins une majuscule (A-Z)',
  requireLowercase: 'Au moins une minuscule (a-z)',
  requireNumber: 'Au moins un chiffre (0-9)',
  requireSpecialChar: 'Au moins un caractère spécial (!@#$%^&*)',
  minUniqueChars: (n: number) => `Au moins ${n} caractères uniques`,
  noPersonalInfo: 'Ne pas utiliser vos informations personnelles',
  noCommonPasswords: 'Éviter les mots de passe courants',
  strength: {
    weak: 'Faible',
    fair: 'Moyen',
    good: 'Bon',
    strong: 'Fort',
  },
  error: {
    tooShort: 'Mot de passe trop court',
    tooLong: 'Mot de passe trop long',
    missingUppercase: 'Majuscule requise',
    missingLowercase: 'Minuscule requise',
    missingNumber: 'Chiffre requis',
    missingSpecialChar: 'Caractère spécial requis',
    notEnoughUnique: 'Pas assez de caractères uniques',
    containsPersonalInfo: 'Contient des informations personnelles',
    isCommonPassword: 'Mot de passe trop courant',
    reusedPassword: 'Ce mot de passe a déjà été utilisé récemment',
  },
  generateButton: 'Générer un mot de passe',
  generatedPassword: 'Mot de passe généré :',
};

// Export default policy for reference
export { DEFAULT_POLICY };
