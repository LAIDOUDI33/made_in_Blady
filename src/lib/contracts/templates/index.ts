// Templates Index - Export all contract templates
// فهرس القوالب - تصدير جميع قوالب العقود
// Index des modèles - Exporter tous les contrats

import type { ContractType, ContractLanguage } from '../contracts';
import type { ContractTemplate } from '../config';
import { createSalesContractTemplate } from './sales-contract';
import { createPurchaseOrderTemplate } from './purchase-order';
import { createNDATemplate } from './nda';
import { createServiceAgreementTemplate } from './service-agreement';
import { createDistributionTemplate } from './distribution';
import { createPartnershipTemplate } from './partnership';
import { createExclusivityTemplate } from './exclusivity';

/**
 * Get contract template by type and language
 * الحصول على قالب عقد حسب النوع واللغة
 */
export function getContractTemplate(
  type: ContractType,
  language: ContractLanguage = 'BILINGUAL'
): ContractTemplate {
  const templateCreators: Record<ContractType, (lang: 'AR' | 'FR' | 'BILINGUAL') => ContractTemplate> = {
    SALES_AGREEMENT: createSalesContractTemplate,
    SUPPLY_CONTRACT: createPurchaseOrderTemplate,
    SERVICE_AGREEMENT: createServiceAgreementTemplate,
    DISTRIBUTION_AGREEMENT: createDistributionTemplate,
    NON_DISCLOSURE: createNDATemplate,
    EXCLUSIVITY: createExclusivityTemplate,
    FRAMEWORK_AGREEMENT: createPartnershipTemplate,
  };

  const creator = templateCreators[type];
  if (!creator) {
    throw new Error(`Unsupported contract type: ${type} - نوع العقد غير مدعوم`);
  }

  return creator(language);
}

/**
 * List all available template types
 * سرد جميع أنواع القوالب المتاحة
 */
export function listAvailableTemplates(): {
  type: ContractType;
  name: string;
  nameAr: string;
  nameFr: string;
  description: string;
  category: string;
}[] {
  const templates = [
    { type: 'SALES_AGREEMENT' as const, ...createSalesContractTemplate('BILINGUAL') },
    { type: 'SUPPLY_CONTRACT' as const, ...createPurchaseOrderTemplate('BILINGUAL') },
    { type: 'SERVICE_AGREEMENT' as const, ...createServiceAgreementTemplate('BILINGUAL') },
    { type: 'DISTRIBUTION_AGREEMENT' as const, ...createDistributionTemplate('BILINGUAL') },
    { type: 'NON_DISCLOSURE' as const, ...createNDATemplate('BILINGUAL') },
    { type: 'EXCLUSIVITY' as const, ...createExclusivityTemplate('BILINGUAL') },
    { type: 'FRAMEWORK_AGREEMENT' as const, ...createPartnershipTemplate('BILINGUAL') },
  ];

  return templates.map(t => ({
    type: t.type,
    name: t.name,
    nameAr: t.nameAr,
    nameFr: t.nameFr,
    description: t.description,
    category: (t.metadata?.category as string) || 'GENERAL',
  }));
}

export {
  createSalesContractTemplate,
  createPurchaseOrderTemplate,
  createNDATemplate,
  createServiceAgreementTemplate,
  createDistributionTemplate,
  createPartnershipTemplate,
  createExclusivityTemplate,
};

export type { ContractTemplate };
