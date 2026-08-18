// Clause Library Management
// إدارة مكتبة البنود
// Gestion de la bibliothèque de clauses

import crypto from 'crypto';
import type { ContractClause } from './config';
import {
  CLAUSE_CATEGORIES,
  getAllClauses,
  getClausesByCategory,
  getClauseById,
  searchClauses,
  getRequiredClauses,
  getTemplatePlaceholders,
} from './config';

// ============================================
// TYPES
// ============================================

export interface CustomClause extends ContractClause {
  createdBy: string;
  createdAt: Date;
  isPublic: boolean; // Available to other users
  usageCount: number;
  tags: string[];
}

export interface ClauseFilter {
  category?: string;
  clauseType?: string;
  isRequired?: boolean;
  language?: 'AR' | 'FR' | 'BILINGUAL';
  keyword?: string;
  tags?: string[];
}

export interface ClauseLibraryStats {
  totalClauses: number;
  categories: number;
  customClauses: number;
  mostUsedClauses: ContractClause[];
}

// ============================================
// IN-MEMORY CLAUSE STORAGE (for demo)
// ============================================

const customClausesStore: Map<string, CustomClause> = new Map();

// ============================================
// CLAUSE CRUD OPERATIONS
// ============================================

/**
 * Create a custom clause
 * إنشاء بند مخصص
 */
export function createCustomClause(
  data: Omit<CustomClause, 'id' | 'createdAt' | 'usageCount'>,
  userId: string
): CustomClause {
  const id = `custom-${crypto.randomBytes(8).toString('hex')}`;
  
  const customClause: CustomClause = {
    ...data,
    id,
    createdAt: new Date(),
    usageCount: 0,
    createdBy: userId,
  };

  customClausesStore.set(id, customClause);
  return customClause;
}

/**
 * Get custom clause by ID
 * الحصول على بند مخصص حسب المعرف
 */
export function getCustomClause(id: string): CustomClause | undefined {
  return customClausesStore.get(id);
}

/**
 * Update a custom clause
 * تحديث بند مخصص
 */
export function updateCustomClause(
  id: string,
  updates: Partial<Omit<CustomClause, 'id' | 'createdBy' | 'createdAt'>>
): CustomClause | null {
  const existing = customClausesStore.get(id);
  if (!existing) return null;

  const updated: CustomClause = {
    ...existing,
    ...updates,
  };

  customClausesStore.set(id, updated);
  return updated;
}

/**
 * Delete a custom clause
 * حذف بند مخصص
 */
export function deleteCustomClause(id: string): boolean {
  return customClausesStore.delete(id);
}

/**
 * Increment usage count for a clause
 * زيادة عداد الاستخدام لبند
 */
export function incrementUsage(id: string): void {
  const clause = customClausesStore.get(id);
  if (clause) {
    clause.usageCount++;
    customClausesStore.set(id, clause);
  }
}

// ============================================
// CLAUSE SEARCH & FILTER
// ============================================

/**
 * Search and filter clauses
 * بحث وتصفية البنود
 */
export function findClauses(filter: ClauseFilter = {}): ContractClause[] {
  let clauses: ContractClause[] = [];

  // Start with standard or category-specific clauses
  if (filter.category) {
    clauses = getClausesByCategory(filter.category);
  } else {
    clauses = getAllClauses();
  }

  // Apply filters
  if (filter.clauseType) {
    clauses = clauses.filter(c => c.clauseType === filter.clauseType);
  }

  if (filter.isRequired !== undefined) {
    clauses = clauses.filter(c => c.isRequired === filter.isRequired);
  }

  if (filter.keyword) {
    const keyword = filter.keyword.toLowerCase();
    clauses = clauses.filter(c =>
      c.title.toLowerCase().includes(keyword) ||
      c.titleAr.includes(filter.keyword || '') ||
      c.titleFr.toLowerCase().includes(keyword) ||
      c.content.toLowerCase().includes(keyword) ||
      c.contentAr.includes(filter.keyword || '') ||
      c.contentFr.toLowerCase().includes(keyword)
    );
  }

  // Include matching custom clauses
  const customResults = Array.from(customClausesStore.values()).filter(cc => {
    if (filter.tags?.length) {
      return filter.tags.some(tag => cc.tags.includes(tag));
    }
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase();
      return (
        cc.title.toLowerCase().includes(kw) ||
        cc.content.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  return [...clauses, ...customResults];
}

/**
 * Get suggested clauses for contract type
 * الحصول على بنود مقترحة لنوع عقد
 */
export function getSuggestedClauses(contractType: string): ContractClause[] {
  const suggestions: Record<string, string[]> = {
    SALES_AGREEMENT: ['PARTIES', 'SUBJECT', 'PRICE', 'PAYMENT_TERMS', 'DELIVERY', 'WARRANTY', 'FORCE_MAJEURE'],
    SUPPLY_CONTRACT: ['PARTIES', 'ORDER_ACCEPTANCE', 'QUANTITY_VARIATION', 'INSPECTION', 'PRICE', 'PAYMENT_TERMS'],
    SERVICE_AGREEMENT: ['PARTIES', 'SCOPE_OF_SERVICES', 'DELIVERABLES', 'STANDARDS', 'INTELLECTUAL_PROPERTY', 'LIABILITY'],
    DISTRIBUTION_AGREEMENT: ['APPOINTMENT', 'TERRITORY', 'PRICING', 'SALES_TARGETS', 'POST_TERMINATION'],
    NON_DISCLOSURE: ['DEFINITION_CONFIDENTIAL', 'OBLIGATIONS', 'EXCEPTIONS', 'RETURN_DESTRUCTION', 'REMEDIES'],
    EXCLUSIVITY: ['GRANT_EXCLUSIVITY', 'SCOPE_EXCLUSIVITY', 'PERFORMANCE_OBLIGATIONS', 'NON_COMPETE'],
    FRAMEWORK_AGREEMENT: ['PURPOSE', 'SCOPE_COLLABORATION', 'CONTRIBUTIONS', 'GOVERNANCE', 'INTELLECTUAL_PROPERTY_JOINT'],
  };

  const typesToFind = suggestions[contractType] || [];
  return getAllClauses().filter(c => typesToFind.includes(c.clauseType));
}

/**
 * Get clause categories with counts
 * الحصول على فئات البنود مع العدادات
 */
export function getCategorySummary(): Array<{
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  clauseCount: number;
}> {
  return CLAUSE_CATEGORIES.map(category => ({
    id: category.id,
    name: category.name,
    nameAr: category.nameAr,
    nameFr: category.nameFr,
    clauseCount: category.clauses.length,
  }));
}

// ============================================
// CLAUSE VALIDATION
// ============================================

/**
 * Validate clause data
 * التحقق من صحة بيانات البند
 */
export function validateClause(clause: Partial<ContractClause>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!clause.id || clause.id.trim() === '') {
    errors.push('Clause ID is required - معرف البند مطلوب');
  }

  if (!clause.clauseType || clause.clauseType.trim() === '') {
    errors.push('Clause type is required - نوع البند مطلوب');
  }

  if (!clause.title || clause.title.trim() === '') {
    errors.push('Title (English) is required - العنوان (إنجليزي) مطلوب');
  }

  if (!clause.titleAr || clause.titleAr.trim() === '') {
    errors.push('Title (Arabic) is required - العنوان (عربي) مطلوب');
  }

  if (!clause.titleFr || clause.titleFr.trim() === '') {
    errors.push('Title (French) is required - العنوان (فرنسي) مطلوب');
  }

  if (!clause.content || clause.content.trim() === '') {
    errors.push('Content (English) is required - المحتوى (إنجليزي) مطلوب');
  }

  if (!clause.contentAr || clause.contentAr.trim() === '') {
    errors.push('Content (Arabic) is required - المحتوى (عربي) مطلوب');
  }

  if (!clause.contentFr || clause.contentFr.trim() === '') {
    errors.push('Content (French) is required - المحتوى (فرنسي) مطلوب');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if clause has unfilled placeholders
 * التحقق مما إذا كان البند يحتوي على عناصر نائبة غير ممتلئة
 */
export function hasUnfilledPlaceholders(content: string): string[] {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;

  while ((match = placeholderRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

// ============================================
// LIBRARY STATISTICS
// ============================================

/**
 * Get library statistics
 * الحصول على إحصائيات المكتبة
 */
export function getLibraryStats(): ClauseLibraryStats {
  const standardClauses = getAllClauses();
  const customClauses = Array.from(customClausesStore.values());

  // Find most used custom clauses
  const mostUsed = customClauses
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5);

  return {
    totalClauses: standardClauses.length + customClauses.length,
    categories: CLAUSE_CATEGORIES.length,
    customClauses: customClauses.length,
    mostUsedClauses: mostUsed,
  };
}

// ============================================
// EXPORTS
// ============================================

export {
  CLAUSE_CATEGORIES,
  getAllClauses,
  getClausesByCategory,
  getClauseById,
  searchClauses,
  getRequiredClauses,
  getTemplatePlaceholders,
};

export default {
  findClauses,
  getSuggestedClauses,
  getCategorySummary,
  validateClause,
  hasUnfilledPlaceholders,
  getLibraryStats,
  createCustomClause,
  getCustomClause,
  updateCustomClause,
  deleteCustomClause,
};
