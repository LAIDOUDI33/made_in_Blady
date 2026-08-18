// Contract Generator
// مولد العقود
// Générateur de contrats

import type { 
  Contract, 
  ContractType, 
  ContractLanguage, 
  ContractParty, 
  ContractClause,
  CreateContractParams 
} from '../contracts';
import type { ContractTemplate } from './config';
import { getContractTemplate as getTemplate } from './templates';

// ============================================
// TYPES
// ============================================

export interface TemplateVariable {
  key: string;
  value: string;
  label?: string;
}

export interface GenerateContractOptions {
  templateType: ContractType;
  language?: ContractLanguage;
  variables: TemplateVariable[];
  partyA: ContractParty;
  partyB: ContractParty;
  additionalClauses?: string[]; // Clause IDs to add
  removeClauses?: string[]; // Clause IDs to remove
  customClauses?: Partial<ContractClause>[];
}

export interface PreviewData {
  title: string;
  titleAr?: string;
  titleFr?: string;
  sections: PreviewSection[];
  metadata: {
    templateType: ContractType;
    language: ContractLanguage;
    generatedAt: Date;
    placeholderCount: number;
  };
}

export interface PreviewSection {
  id: string;
  title: string;
  titleAr?: string;
  titleFr?: string;
  content: string;
  contentAr?: string;
  contentFr?: string;
  order: number;
  type: 'PARTIES' | 'SUBJECT' | 'PAYMENT' | 'DELIVERY' | 'WARRANTY' | 'DISPUTE' | 'TERMINATION' | 'GENERAL' | 'CUSTOM';
}

// ============================================
// TEMPLATE FILLING FUNCTIONS
// ============================================

/**
 * Fill a template with provided variables
 * ملء قالب بالمتغيرات المقدمة
 */
export function fillTemplate(
  template: ContractTemplate,
  variables: TemplateVariable[]
): ContractTemplate {
  let filledTemplate = JSON.parse(JSON.stringify(template)) as ContractTemplate;

  // Process all text fields in clauses
  filledTemplate.clauses = filledTemplate.clauses.map(clause => ({
    ...clause,
    content: replacePlaceholders(clause.content, variables),
    contentAr: replacePlaceholders(clause.contentAr, variables),
    contentFr: replacePlaceholders(clause.contentFr, variables),
    title: replacePlaceholders(clause.title, variables),
    titleAr: replacePlaceholders(clause.titleAr, variables),
    titleFr: replacePlaceholders(clause.titleFr, variables),
  }));

  // Fill default penalty clause
  if ('defaultPenaltyClause' in filledTemplate) {
    (filledTemplate as any).defaultPenaltyClause = replacePlaceholders(
      (filledTemplate as any).defaultPenaltyClause || '',
      variables
    );
  }

  return filledTemplate;
}

/**
 * Replace placeholders in text with values
 * استبدال العناصر النصية في النص بقيم
 */
function replacePlaceholders(text: string, variables: TemplateVariable[]): string {
  if (!text) return text;
  
  let result = text;
  for (const variable of variables) {
    const regex = new RegExp(escapeRegex(variable.key), 'g');
    result = result.replace(regex, variable.value);
  }
  
  return result;
}

/**
 * Escape special regex characters
 * هروب الأحرف الخاصة للتعبير النمطي
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// CLAUSE MANAGEMENT FUNCTIONS
// ============================================

/**
 * Add clauses to a contract template
 * إضافة بنود لقالب عقد
 */
export function addClauses(
  template: ContractTemplate,
  clauseIds: string[],
  allAvailableClauses: ContractClause[]
): ContractTemplate {
  const updatedTemplate = JSON.parse(JSON.stringify(template)) as ContractTemplate;
  
  for (const clauseId of clauseIds) {
    const clauseToAdd = allAvailableClauses.find(c => c.id === clauseId);
    if (clauseToAdd && !updatedTemplate.clauses.find(c => c.id === clauseId)) {
      updatedTemplate.clauses.push({ ...clauseToAdd });
    }
  }
  
  // Reorder clauses
  updatedTemplate.clauses.sort((a, b) => a.order - b.order);
  
  return updatedTemplate;
}

/**
 * Remove clauses from a contract template
 * إزالة بنود من قالب عقد
 */
export function removeClauses(
  template: ContractTemplate,
  clauseIds: string[]
): ContractTemplate {
  const updatedTemplate = JSON.parse(JSON.stringify(template)) as ContractTemplate;
  
  // Check if trying to remove required clauses
  const requiredToRemove = clauseIds.filter(id => {
    const clause = updatedTemplate.clauses.find(c => c.id === id);
    return clause?.isRequired;
  });
  
  if (requiredToRemove.length > 0) {
    console.warn(`Warning: Attempting to remove required clauses: ${requiredToRemove.join(', ')}`);
  }
  
  updatedTemplate.clauses = updatedTemplate.clauses.filter(
    c => !clauseIds.includes(c.id)
  );
  
  return updatedTemplate;
}

// ============================================
// PREVIEW GENERATION
// ============================================

/**
 * Generate preview data for a contract
 * توليد بيانات معاينة لعقد
 */
export function generatePreview(options: GenerateContractOptions): PreviewData {
  const template = getTemplate(options.templateType, options.language || 'BILINGUAL');
  
  // Fill template with variables
  let processedTemplate = fillTemplate(template, options.variables);
  
  // Add additional clauses if specified
  if (options.additionalClauses?.length) {
    // In a real implementation, would fetch from clause library
    console.log('Additional clauses to add:', options.additionalClauses);
  }
  
  // Remove specified clauses
  if (options.removeClauses?.length) {
    processedTemplate = removeClauses(processedTemplate, options.removeClauses);
  }

  // Group clauses into sections
  const sectionsMap = new Map<string, PreviewSection>();
  
  for (const clause of processedTemplate.clauses) {
    const sectionKey = clause.clauseType.split('_')[0];
    
    if (!sectionsMap.has(sectionKey)) {
      sectionsMap.set(sectionKey, {
        id: `section-${sectionKey}`,
        title: clause.clauseType,
        titleAr: clause.titleAr,
        titleFr: clause.titleFr,
        content: '',
        contentAr: '',
        contentFr: '',
        order: clause.order,
        type: clause.clauseType as PreviewSection['type'],
      });
    }
    
    const section = sectionsMap.get(sectionKey)!;
    section.content += `\n\n${clause.content}`;
    if (clause.contentAr) section.contentAr += `\n\n${clause.contentAr}`;
    if (clause.contentFr) section.contentFr += `\n\n${clause.contentFr}`;
  }

  // Count remaining placeholders
  const allContent = processedTemplate.clauses.map(c => c.content + c.contentAr + c.contentFr).join(' ');
  const placeholderMatches = allContent.match(/\{\{[^}]+\}\}/g);
  const placeholderCount = placeholderMatches?.length || 0;

  return {
    title: processedTemplate.name,
    titleAr: processedTemplate.nameAr,
    titleFr: processedTemplate.nameFr,
    sections: Array.from(sectionsMap.values()).sort((a, b) => a.order - b.order),
    metadata: {
      templateType: options.templateType,
      language: options.language || 'BILINGUAL',
      generatedAt: new Date(),
      placeholderCount,
    },
  };
}

// ============================================
// CONTRACT GENERATION
// ============================================

/**
 * Generate a complete contract object
 * توليد كائن عقد كامل
 */
export function generateContract(options: GenerateContractOptions): Omit<Contract, 'id' | 'createdAt' | 'updatedAt'> {
  const template = getTemplate(options.templateType, options.language || 'BILINGUAL');
  const filledTemplate = fillTemplate(template, options.variables);

  // Generate contract number
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const contractNumber = `CTR-${dateStr}-${random}`;

  return {
    contractNumber,
    contractType: options.templateType,
    status: 'DRAFT',
    language: options.language || 'BILINGUAL',
    partyA: options.partyA,
    partyB: options.partyB,
    subject: extractSubject(filledTemplate),
    subjectAr: extractSubjectAr(filledTemplate),
    subjectFr: extractSubjectFr(filledTemplate),
    effectiveDate: new Date(),
    endDate: calculateEndDate(filledTemplate, options.variables),
    totalValue: extractTotalValue(options.variables),
    currency: extractCurrency(options.variables),
    paymentTerms: extractPaymentTerms(filledTemplate, options.variables),
    penaltyClause: (filledTemplate as any).defaultPenaltyClause || '',
    warrantyTerms: (filledTemplate as any).defaultWarrantyTerms || '',
    clauses: filledTemplate.clauses,
    customClauses: options.customClauses?.map((c, i) => ({
      id: `custom-${Date.now()}-${i}`,
      clauseType: c.clauseType || 'CUSTOM',
      title: c.title || 'Custom Clause',
      titleAr: c.titleAr || 'بند مخصص',
      titleFr: c.titleFr || 'Clause personnalisée',
      content: c.content || '',
      contentAr: c.contentAr || '',
      contentFr: c.contentFr || '',
      isRequired: false,
      isEditable: true,
      order: 999 + i,
    })) || [],
    attachments: [],
    version: 1,
    createdBy: '', // Will be set by caller
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractSubject(template: ContractTemplate): string {
  const subjectClause = template.clauses.find(c => c.clauseType === 'SUBJECT');
  return subjectClause?.content?.substring(0, 200) || 'Contract Agreement';
}

function extractSubjectAr(template: ContractTemplate): string {
  const subjectClause = template.clauses.find(c => c.clauseType === 'SUBJECT');
  return subjectClause?.contentAr?.substring(0, 200) || 'اتفاقية عقد';
}

function extractSubjectFr(template: ContractTemplate): string {
  const subjectClause = template.clauses.find(c => c.clauseType === 'SUBJECT');
  return subjectClause?.contentFr?.substring(0, 200) || 'Contrat';
}

function calculateEndDate(template: ContractTemplate, variables: TemplateVariable[]): Date | null {
  // Try to get duration from variables first
  const durationVar = variables.find(v => v.key === '{{contract_duration}}');
  if (durationVar?.value) {
    const months = parseInt(durationVar.value, 10);
    if (!isNaN(months)) {
      return new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
    }
  }
  
  // Use default duration from config or 1 year
  const defaultDurations: Record<ContractType, number> = {
    SALES_AGREEMENT: 365,
    SUPPLY_CONTRACT: 180,
    SERVICE_AGREEMENT: 365,
    DISTRIBUTION_AGREEMENT: 730,
    NON_DISCLOSURE: 1095,
    EXCLUSIVITY: 730,
    FRAMEWORK_AGREEMENT: 1825,
  };
  
  const days = defaultDurations[template.type] || 365;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function extractTotalValue(variables: TemplateVariable[]): number {
  const valueVar = variables.find(v => v.key === '{{total_amount}}');
  if (valueVar?.value) {
    const parsed = parseFloat(valueVar.value.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function extractCurrency(variables: TemplateVariable[]): string {
  const currencyVar = variables.find(v => v.key === '{{currency}}');
  return currencyVar?.value || 'DZD';
}

function extractPaymentTerms(template: ContractTemplate, variables: TemplateVariable[]): string {
  const paymentTermsVar = variables.find(v => v.key === '{{payment_terms}}');
  if (paymentTermsVar?.value) {
    return paymentTermsVar.value;
  }
  
  const paymentClause = template.clauses.find(c => c.clauseType === 'PAYMENT_TERMS');
  return paymentClause?.content?.substring(0, 200) || 'Net 30';
}

// ============================================
// EXPORTS
// ============================================

export default {
  fillTemplate,
  addClauses,
  removeClauses,
  generatePreview,
  generateContract,
};
