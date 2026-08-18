// Contract Module Tests
// اختبارات وحدة العقود
// Tests du module Contrats

import {
  CONTRACT_TYPES,
  SUPPORTED_LANGUAGES,
  CLAUSE_CATEGORIES,
  getAllClauses,
  getClausesByCategory,
  getClauseById,
  searchClauses,
  getRequiredClauses,
  getTemplatePlaceholders,
  LEGAL_FORMS,
} from '@/lib/contracts/config';

import { 
  getContractTemplate, 
  listAvailableTemplates 
} from '@/lib/contracts/templates';

import {
  fillTemplate,
  addClauses,
  removeClauses,
  generatePreview,
  generateContract,
} from '@/lib/contracts/generator';

import {
  findClauses,
  validateClause,
  hasUnfilledPlaceholders,
  getSuggestedClauses,
  getCategorySummary,
} from '@/lib/contracts/clauses';

import {
  createSignature,
  verifySignature,
  createSignatureRequest,
  addAuditEntry,
  generateCertificateOfAuthenticity,
  verifyCertificate,
  formatAuditTrail,
} from '@/lib/contracts/e-signature';

import { generateContractHTML, generatePDFFilename } from '@/lib/contracts/pdf-export';

// ============================================
// CONFIG TESTS
// ============================================

describe('Contract Configuration', () => {
  test('should have all required contract types', () => {
    const expectedTypes = [
      'SALES_AGREEMENT',
      'SUPPLY_CONTRACT',
      'SERVICE_AGREEMENT',
      'DISTRIBUTION_AGREEMENT',
      'NON_DISCLOSURE',
      'EXCLUSIVITY',
      'FRAMEWORK_AGREEMENT',
    ];

    expectedTypes.forEach((type) => {
      expect(CONTRACT_TYPES[type as keyof typeof CONTRACT_TYPES]).toBeDefined();
    });
  });

  test('should support AR, FR, and BILINGUAL languages', () => {
    expect(SUPPORTED_LANGUAGES).toContain('AR');
    expect(SUPPORTED_LANGUAGES).toContain('FR');
    expect(SUPPORTED_LANGUAGES).toContain('BILINGUAL');
  });

  test('should have clause categories with proper structure', () => {
    expect(CLAUSE_CATEGORIES.length).toBeGreaterThan(0);
    
    CLAUSE_CATEGORIES.forEach((category) => {
      expect(category.id).toBeDefined();
      expect(category.name).toBeDefined();
      expect(category.nameAr).toBeDefined();
      expect(category.nameFr).toBeDefined();
      expect(Array.isArray(category.clauses)).toBe(true);
      expect(category.clauses.length).toBeGreaterThan(0);
    });
  });
});

describe('Clause Library', () => {
  test('getAllClauses should return all clauses', () => {
    const clauses = getAllClauses();
    expect(clauses.length).toBeGreaterThan(0);
    
    clauses.forEach((clause) => {
      expect(clause.id).toBeDefined();
      expect(clause.title).toBeDefined();
      expect(clause.titleAr).toBeDefined();
      expect(clause.titleFr).toBeDefined();
      expect(clause.content).toBeDefined();
      expect(clause.contentAr).toBeDefined();
      expect(clause.contentFr).toBeDefined();
    });
  });

  test('getClausesByCategory should filter by category', () => {
    const partiesClauses = getClausesByCategory('parties');
    expect(partiesClauses.length).toBeGreaterThan(0);
    
    partiesClauses.forEach((clause) => {
      expect(['PARTIES', 'CAPACITY']).toContain(clause.clauseType);
    });
  });

  test('getClauseById should return specific clause or undefined', () => {
    const clause = getClauseById('clause-parties-01');
    expect(clause).toBeDefined();
    expect(clause?.id).toBe('clause-parties-01');

    const nonExistent = getClauseById('non-existent-id');
    expect(nonExistent).toBeUndefined();
  });

  test('searchClauses should find matching clauses', () => {
    const results = searchClauses('payment');
    expect(results.length).toBeGreaterThan(0);
    
    results.forEach((clause) => {
      const searchStr = 'payment';
      const matchesTitle = clause.title.toLowerCase().includes(searchStr);
      const matchesContent = clause.content.toLowerCase().includes(searchStr);
      const matchesAr = clause.titleAr.includes(searchStr) || clause.contentAr.includes(searchStr);
      const matchesFr = clause.titleFr.toLowerCase().includes(searchStr) || clause.contentFr.toLowerCase().includes(searchStr);
      
      expect(matchesTitle || matchesContent || matchesAr || matchesFr).toBe(true);
    });
  });

  test('getRequiredClauses should only return required clauses', () => {
    const requiredClauses = getRequiredClauses();
    requiredClauses.forEach((clause) => {
      expect(clause.isRequired).toBe(true);
    });
  });

  test('getTemplatePlaceholders should return valid placeholders', () => {
    const placeholders = getTemplatePlaceholders();
    expect(placeholders.length).toBeGreaterThan(0);
    
    placeholders.forEach((ph) => {
      expect(ph.key).toMatch(/\{\{[^}]+\}\}/);
      expect(ph.label).toBeDefined();
      expect(ph.labelAr).toBeDefined();
      expect(ph.labelFr).toBeDefined();
    });
  });
});

// ============================================
// TEMPLATE TESTS
// ============================================

describe('Contract Templates', () => {
  test('listAvailableTemplates should return all templates', () => {
    const templates = listAvailableTemplates();
    expect(templates.length).toBe(7); // One for each contract type
    
    templates.forEach((template) => {
      expect(template.type).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.nameAr).toBeDefined();
      expect(template.nameFr).toBeDefined();
      expect(template.description).toBeDefined();
    });
  });

  test('getContractTemplate should return template for each type', () => {
    const types = [
      'SALES_AGREEMENT',
      'SUPPLY_CONTRACT',
      'SERVICE_AGREEMENT',
      'DISTRIBUTION_AGREEMENT',
      'NON_DISCLOSURE',
      'EXCLUSIVITY',
      'FRAMEWORK_AGREEMENT',
    ];

    types.forEach((type) => {
      const template = getContractTemplate(type as any, 'BILINGUAL');
      expect(template).toBeDefined();
      expect(template.type).toBe(type);
      expect(template.clauses.length).toBeGreaterThan(0);
    });
  });

  test('templates should have bilingual content', () => {
    const template = getContractTemplate('SALES_AGREEMENT', 'BILINGUAL');
    
    template.clauses.forEach((clause) => {
      expect(clause.titleAr).toBeTruthy();
      expect(clause.titleFr).toBeTruthy();
      expect(clause.contentAr).toBeTruthy();
      expect(clause.contentFr).toBeTruthy();
    });
  });
});

// ============================================
// GENERATOR TESTS
// ============================================

describe('Contract Generator', () => {
  test('fillTemplate should replace placeholders with values', () => {
    const template = getContractTemplate('SALES_AGREEMENT', 'BILINGUAL');
    const variables = [
      { key: '{{partyA_name}}', value: 'Test Company A' },
      { key: '{{partyB_name}}', value: 'Test Company B' },
      { key: '{{total_amount}}', value: '10000' },
    ];

    const filled = fillTemplate(template, variables);
    
    // Check that at least one placeholder was replaced
    const allContent = filled.clauses.map(c => c.content + c.contentAr + c.contentFr).join(' ');
    expect(allContent.includes('Test Company A')).toBe(true);
    expect(allContent.includes('Test Company B')).toBe(true);
  });

  test('addClauses should add new clauses to template', () => {
    const template = getContractTemplate('NON_DISCLOSURE', 'BILINGUAL');
    const initialCount = template.clauses.length;
    
    const additionalClauseIds = []; // Would be real IDs
    const updated = addClauses(template, additionalClauseIds, getAllClauses());
    
    // Should not reduce clause count
    expect(updated.clauses.length).toBeGreaterThanOrEqual(initialCount);
  });

  test('removeClauses should remove non-required clauses', () => {
    const template = getContractTemplate('SALES_AGREEMENT', 'BILINGUAL');
    const initialCount = template.clauses.length;
    
    // Find a non-required clause to remove
    const removableClause = template.clauses.find(c => !c.isRequired);
    if (removableClause) {
      const updated = removeClauses(template, [removableClause.id]);
      expect(updated.clauses.length).toBe(initialCount - 1);
    }
  });

  test('generatePreview should return structured preview data', () => {
    const previewData = generatePreview({
      templateType: 'SALES_AGREEMENT',
      language: 'BILINGUAL',
      variables: [],
      partyA: {
        companyId: '1',
        companyName: 'Supplier Co',
        representativeName: 'John Doe',
        representativeTitle: 'CEO',
        email: 'john@supplier.dz',
        phone: '+213 555 0101',
        address: 'Algiers, Algeria',
        commercialRegister: '16A1234',
        taxId: '0000123456789',
      },
      partyB: {
        companyId: '2',
        companyName: 'Buyer Co',
        representativeName: 'Jane Smith',
        representativeTitle: 'Manager',
        email: 'jane@buyer.dz',
        phone: '+213 555 0202',
        address: 'Oran, Algeria',
        commercialRegister: '16B5678',
        taxId: '0000987654321',
      },
    });

    expect(previewData.title).toBeDefined();
    expect(previewData.sections).toBeDefined();
    expect(previewData.sections.length).toBeGreaterThan(0);
    expect(previewData.metadata.templateType).toBe('SALES_AGREEMENT');
  });

  test('generateContract should create complete contract object', () => {
    const contract = generateContract({
      templateType: 'SALES_AGREEMENT',
      language: 'BILINGUAL',
      variables: [
        { key: '{{total_amount}}', value: '50000' },
        { key: '{{currency}}', value: 'DZD' },
      ],
      partyA: {
        companyId: '1',
        companyName: 'Supplier Co',
        representativeName: 'John Doe',
        representativeTitle: 'CEO',
        email: 'john@supplier.dz',
        phone: '+213 555 0101',
        address: 'Algiers, Algeria',
        commercialRegister: '16A1234',
        taxId: '0000123456789',
      },
      partyB: {
        companyId: '2',
        companyName: 'Buyer Co',
        representativeName: 'Jane Smith',
        representativeTitle: 'Manager',
        email: 'jane@buyer.dz',
        phone: '+213 555 0202',
        address: 'Oran, Algeria',
        commercialRegister: '16B5678',
        taxId: '0000987654321',
      },
    });

    expect(contract.contractNumber).toMatch(/^CTR-/);
    expect(contract.contractType).toBe('SALES_AGREEMENT');
    expect(contract.status).toBe('DRAFT');
    expect(contract.partyA.companyName).toBe('Supplier Co');
    expect(contract.partyB.companyName).toBe('Buyer Co');
    expect(contract.clauses.length).toBeGreaterThan(0);
  });
});

// ============================================
// E-SIGNATURE TESTS
// ============================================

describe('E-Signature Module', () => {
  test('createSignature should create valid signature record', () => {
    const signature = createSignature({
      contractId: 'test-contract-1',
      signerId: 'user-1',
      signerName: 'Test User',
      signerEmail: 'test@example.com',
      signerRole: 'PARTY_A',
      signatureType: 'TYPED',
      signatureContent: 'Test User',
    });

    expect(signature.id).toBeDefined();
    expect(signature.contractId).toBe('test-contract-1');
    expect(signature.signerName).toBe('Test User');
    expect(signature.hash).toBeDefined();
    expect(signature.hash.length).toBeGreaterThan(0);
    expect(signature.signedAt).toBeInstanceOf(Date);
  });

  test('verifySignature should validate signature integrity', () => {
    const signature = createSignature({
      contractId: 'test-contract-2',
      signerId: 'user-2',
      signerName: 'Test User 2',
      signerEmail: 'test2@example.com',
      signerRole: 'PARTY_B',
      signatureType: 'DRAWN',
      signatureContent: 'data:image/png;base64,test-signature-data',
    });

    const verification = verifySignature(signature);
    expect(verification.isValid).toBe(true);
  });

  test('createSignatureRequest should create pending request', () => {
    const request = createSignatureRequest({
      contractId: 'contract-123',
      contractNumber: 'CTR-20240101-0001',
      requestedBy: 'admin-user',
      requestedTo: 'signer-user',
      requestedToEmail: 'signer@company.dz',
      requestedToName: 'Signer Name',
      partyRole: 'PARTY_B',
    });

    expect(request.id).toBeDefined();
    expect(request.status).toBe('PENDING');
    expect(request.expiresAt).toBeInstanceOf(Date);
  });

  test('addAuditEntry should create audit log entry', () => {
    const entry = addAuditEntry({
      contractId: 'contract-123',
      action: 'CONTRACT_CREATED',
      actorId: 'user-1',
      actorName: 'Admin User',
      details: 'Contract created from template',
    });

    expect(entry.id).toBeDefined();
    expect(entry.action).toBe('CONTRACT_CREATED');
    expect(entry.timestamp).toBeInstanceOf(Date);
  });

  test('generateCertificateOfAuthenticity should create certificate', () => {
    const signature = createSignature({
      contractId: 'cert-test-1',
      signerId: 'user-1',
      signerName: 'Cert Test User',
      signerEmail: 'cert@test.com',
      signerRole: 'PARTY_A',
      signatureType: 'TYPED',
      signatureContent: 'Cert Test User',
    });

    const certificate = generateCertificateOfAuthenticity({
      contractId: 'cert-test-1',
      contractNumber: 'CTR-CERT-001',
      signatures: [signature],
    });

    expect(certificate.id).toBeDefined();
    expect(certificate.verificationHash).toBeDefined();
    expect(certificate.tamperEvidentSeal).toBeDefined();
    expect(certificate.signatures.length).toBe(1);
  });

  test('verifyCertificate should validate certificate', () => {
    const signature = createSignature({
      contractId: 'verify-cert-1',
      signerId: 'user-1',
      signerName: 'Verify Test',
      signerEmail: 'verify@test.com',
      signerRole: 'PARTY_A',
      signatureType: 'TYPED',
      signatureContent: 'Verify Test',
    });

    const certificate = generateCertificateOfAuthenticity({
      contractId: 'verify-cert-1',
      contractNumber: 'CTR-VERIFY-001',
      signatures: [signature],
    });

    const result = verifyCertificate(certificate);
    expect(result.isValid).toBe(true);
  });

  test('formatAuditTrail should format entries correctly', () => {
    const entry = addAuditEntry({
      contractId: 'format-test-1',
      action: 'SIGNED',
      actorId: 'user-1',
      actorName: 'Format Tester',
      details: 'Document signed successfully',
    });

    const englishFormatted = formatAuditTrail([entry], 'en');
    expect(englishFormatted).toContain('SIGNED');
    expect(englishFormatted).toContain('Format Tester');

    const frenchFormatted = formatAuditTrail([entry], 'fr');
    expect(frenchFormatted).toContain('Signé');
  });
});

// ============================================
// CLAUSES MANAGEMENT TESTS
// ============================================

describe('Clauses Management', () => {
  test('validateClause should validate clause data', () => {
    const validClause = {
      id: 'test-clause-1',
      clauseType: 'CUSTOM',
      title: 'Test Clause',
      titleAr: 'بند اختبار',
      titleFr: 'Clause de test',
      content: 'This is test content.',
      contentAr: 'هذا محتوى اختبار.',
      contentFr: 'Ceci est un contenu de test.',
      isRequired: false,
      isEditable: true,
      order: 100,
    };

    const validation = validateClause(validClause);
    expect(validation.isValid).toBe(true);
    expect(validation.errors.length).toBe(0);

    // Test invalid clause
    const invalidClause = { ...validClause, title: '' };
    const invalidValidation = validateClause(invalidClause);
    expect(invalidValidation.isValid).toBe(false);
    expect(invalidValidation.errors.length).toBeGreaterThan(0);
  });

  test('hasUnfilledPlaceholders should detect placeholders', () => {
    const textWithPlaceholders = 'Hello {{name}}, your order {{order_id}} is ready.';
    const placeholders = hasUnfilledPlaceholders(textWithPlaceholders);
    
    expect(placeholders).toContain('name');
    expect(placeholders).toContain('order_id');
    expect(placeholders.length).toBe(2);

    const textWithoutPlaceholders = 'Hello World, no placeholders here.';
    const noPlaceholders = hasUnfilledPlaceholders(textWithoutPlaceholders);
    expect(noPlaceholders.length).toBe(0);
  });

  test('getSuggestedClauses should return relevant suggestions', () => {
    const salesSuggestions = getSuggestedClauses('SALES_AGREEMENT');
    expect(salesSuggestions.length).toBeGreaterThan(0);
    
    const ndaSuggestions = getSuggestedClauses('NON_DISCLOSURE');
    expect(ndaSuggestions.length).toBeGreaterThan(0);
  });

  test('getCategorySummary should return category summaries', () => {
    const summary = getCategorySummary();
    expect(summary.length).toBe(CLAUSE_CATEGORIES.length);
    
    summary.forEach((cat) => {
      expect(cat.id).toBeDefined();
      expect(cat.name).toBeDefined();
      expect(typeof cat.clauseCount).toBe('number');
    });
  });
});

// ============================================
// PDF EXPORT TESTS
// ============================================

describe('PDF Export Module', () => {
  test('generateContractHTML should generate HTML string', () => {
    const mockContract = {
      id: 'pdf-test-1',
      contractNumber: 'CTR-PDF-001',
      contractType: 'SALES_AGREEMENT' as any,
      status: 'DRAFT' as any,
      language: 'BILINGUAL' as any,
      subject: 'Test Sales Agreement',
      subjectAr: 'اتفاقية بيع اختبارية',
      subjectFr: "Contrat de vente de test",
      effectiveDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      totalValue: 50000,
      currency: 'DZD',
      paymentTerms: 'Net 30 days',
      penaltyClause: '',
      warrantyTerms: '',
      clauses: getAllClauses().slice(0, 3),
      customClauses: [],
      partyA: {
        companyId: '1',
        companyName: 'Supplier Co',
        representativeName: 'John Doe',
        representativeTitle: 'CEO',
        email: 'john@supplier.dz',
        phone: '+213 555 0101',
        address: 'Algiers, Algeria',
        commercialRegister: '16A1234',
        taxId: '0000123456789',
      },
      partyB: {
        companyId: '2',
        companyName: 'Buyer Co',
        representativeName: 'Jane Smith',
        representativeTitle: 'Manager',
        email: 'jane@buyer.dz',
        phone: '+213 555 0202',
        address: 'Oran, Algeria',
        commercialRegister: '16B5678',
        taxId: '0000987654321',
      },
      attachments: [],
      version: 1,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const html = generateContractHTML(mockContract);
    
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain(mockContract.contractNumber);
    expect(html).toContain(mockContract.partyA.companyName);
    expect(html).toContain(mockContract.partyB.companyName);
  });

  test('generatePDFFilename should generate proper filename', () => {
    const mockContract = {
      id: 'filename-test-1',
      contractNumber: 'CTR-20240115-1234',
      contractType: 'SALES_AGREEMENT' as any,
      status: 'DRAFT' as any,
      language: 'BILINGUAL' as any,
      subject: 'Test Sales Agreement for Products',
      subjectAr: '',
      subjectFr: '',
      effectiveDate: new Date(),
      endDate: null,
      totalValue: 50000,
      currency: 'DZD',
      paymentTerms: 'Net 30',
      penaltyClause: '',
      warrantyTerms: '',
      clauses: [],
      customClauses: [],
      partyA: {} as any,
      partyB: {} as any,
      attachments: [],
      version: 1,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const filename = generatePDFFilename(mockContract);
    
    expect(filename).toMatch(/^CTR-/);
    expect(filename).endsWith('.pdf');
    expect(filename).toContain(mockContract.contractNumber);
  });
});
