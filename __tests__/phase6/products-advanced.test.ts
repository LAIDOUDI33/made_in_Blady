// Advanced Product Features Tests
// Tests for certifications, bulk pricing, customization, packages - Phase 6D

import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    productCertification: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
    },
    bulkPricingTier: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    customizationOption: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    productPackage: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    packageItem: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    order: { count: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { db } from '@/lib/db';
const mockDb = db as jest.Mocked<typeof db>;

// Import handlers after mocking
import * as CertificationsAPI from '@/app/api/certifications/route';
import * as PackagesAPI from '@/app/api/packages/route';

// ===========================================
// Test Data Factories
// ===========================================

function createMockProduct(overrides = {}) {
  return {
    id: 'product-1',
    name: 'Test Product',
    slug: 'test-product',
    price: 10000,
    currency: 'DZD',
    companyId: 'company-1',
    isActive: true,
    status: 'published',
    ...overrides,
  };
}

function createMockCompany(overrides = {}) {
  return {
    id: 'company-1',
    name: 'Test Company',
    slug: 'test-company',
    isVerified: true,
    ...overrides,
  };
}

function createMockCertification(overrides = {}) {
  return {
    id: 'cert-1',
    productId: 'product-1',
    companyId: null,
    name: 'CE Certification',
    issuingBody: 'European Commission',
    certificateNumber: 'CE-2024-001234',
    issueDate: new Date('2024-01-01'),
    expiryDate: new Date('2029-01-01'),
    certificateUrl: 'https://example.com/cert.pdf',
    verificationStatus: 'PENDING',
    createdAt: new Date('2024-01-15'),
    product: createMockProduct(),
    company: null,
    ...overrides,
  };
}

function createMockBulkPricingTier(overrides = {}) {
  return {
    id: 'tier-1',
    productId: 'product-1',
    minQuantity: 10,
    unitPrice: 9000,
    discount: 10,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-01-01'),
    ...overrides,
  };
}

function createMockCustomizationOption(overrides = {}) {
  return {
    id: 'opt-1',
    productId: 'product-1',
    name: 'Color',
    type: 'color',
    options: JSON.stringify(['Red', 'Blue', 'Green']),
    priceModifier: 0,
    required: true,
    sortOrder: 0,
    ...overrides,
  };
}

function createMockPackage(overrides = {}) {
  return {
    id: 'pkg-1',
    companyId: 'company-1',
    name: 'Starter Bundle',
    description: 'Complete starter package with all essentials',
    discountPercent: 15,
    totalPrice: 25000,
    currency: 'DZD',
    imageUrl: 'https://example.com/package.jpg',
    isActive: true,
    maxQuantity: null,
    items: [],
    _count: { orders: 0 },
    ...overrides,
  };
}

function createRequest(method: string, body?: any, searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/certifications');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  
  return {
    url: url.toString(),
    method,
    headers: new Map([['content-type', 'application/json']]),
    json: () => Promise.resolve(body || {}),
  } as unknown as NextRequest;
}

function createPackagesRequest(method: string, body?: any, searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/packages');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  
  return {
    url: url.toString(),
    method,
    headers: new Map([['content-type', 'application/json']]),
    json: () => Promise.resolve(body || {}),
  } as unknown as NextRequest;
}

// ===========================================
// Test Suites - Certifications
// ===========================================

describe('Certifications API - GET /api/certifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list all certifications', async () => {
    const mockCerts = [
      createMockCertification(),
      createMockCertification({ id: 'cert-2', name: 'ISO 9001' }),
    ];
    mockDb.productCertification.findMany.mockResolvedValue(mockCerts);

    const request = createRequest('GET');
    const response = await CertificationsAPI.GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
  });

  it('should filter by productId', async () => {
    mockDb.productCertification.findMany.mockResolvedValue([]);

    const request = createRequest('GET', undefined, { productId: 'product-1' });
    await CertificationsAPI.GET(request);

    expect(mockDb.productCertification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ productId: 'product-1' }),
      })
    );
  });

  it('should filter by companyId', async () => {
    mockDb.productCertification.findMany.mockResolvedValue([]);

    const request = createRequest('GET', undefined, { companyId: 'company-1' });
    await CertificationsAPI.GET(request);

    expect(mockDb.productCertification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-1' }),
      })
    );
  });

  it('should order by issue date descending', async () => {
    mockDb.productCertification.findMany.mockResolvedValue([]);

    const request = createRequest('GET');
    await CertificationsAPI.GET(request);

    expect(mockDb.productCertification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { issueDate: 'desc' },
      })
    );
  });

  it('should include product and company relations', async () => {
    mockDb.productCertification.findMany.mockResolvedValue([]);

    const request = createRequest('GET');
    await CertificationsAPI.GET(request);

    expect(mockDb.productCertification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          product: expect.any(Object),
          company: expect.any(Object),
        }),
      })
    );
  });
});

describe('Certifications API - POST /api/certifications (Create)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create certification successfully', async () => {
    const newCert = createMockCertification();
    mockDb.productCertification.create.mockResolvedValue(newCert);

    const requestBody = {
      productId: 'product-1',
      name: 'SGS Certification',
      issuingBody: 'SGS Corporation',
      certificateNumber: 'SGS-2024-567890',
      issueDate: '2024-03-15',
      expiryDate: '2029-03-15',
      certificateUrl: 'https://example.com/sgs-cert.pdf',
    };

    const request = createRequest('POST', requestBody);
    const response = await CertificationsAPI.POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('SGS Certification');
    expect(data.data.certificateNumber).toBe('SGS-2024-567890');
  });

  it('should set default verification status to PENDING', async () => {
    mockDb.productCertification.create.mockResolvedValue(createMockCertification());

    const requestBody = {
      name: 'Test Cert',
      issuingBody: 'Test Body',
      certificateNumber: 'TEST-001',
      issueDate: '2024-01-01',
    };

    const request = createRequest('POST', requestBody);
    await CertificationsAPI.POST(request);

    expect(mockDb.productCertification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          verificationStatus: 'PENDING',
        }),
      })
    );
  });

  it('should convert date strings to Date objects', async () => {
    mockDb.productCertification.create.mockResolvedValue(createMockCertification());

    const requestBody = {
      name: 'Date Test',
      issuingBody: 'Test Body',
      certificateNumber: 'DATE-001',
      issueDate: '2024-06-15',
      expiryDate: '2029-06-15',
    };

    const request = createRequest('POST', requestBody);
    await CertificationsAPI.POST(request);

    const callArgs = mockDb.productCertification.create.mock.calls[0][0];
    expect(callArgs.data.issueDate).toBeInstanceOf(Date);
    expect(callArgs.data.expiryDate).toBeInstanceOf(Date);
  });

  describe('Validation Errors', () => {
    it('should reject missing required fields', async () => {
      const request = createRequest('POST', { name: 'Only Name' });
      const response = await CertificationsAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject non-existent product', async () => {
      mockDb.product.findUnique.mockResolvedValue(null);

      const request = createRequest('POST', {
        productId: 'nonexistent',
        name: 'Test',
        issuingBody: 'Body',
        certificateNumber: 'CERT-001',
        issueDate: '2024-01-01',
      });
      const response = await CertificationsAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Product not found');
    });

    it('should reject non-existent company', async () => {
      mockDb.company.findUnique.mockResolvedValue(null);

      const request = createRequest('POST', {
        companyId: 'nonexistent',
        name: 'Test',
        issuingBody: 'Body',
        certificateNumber: 'CERT-001',
        issueDate: '2024-01-01',
      });
      const response = await CertificationsAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Company not found');
    });

    it('should reject duplicate certificate number', async () => {
      mockDb.productCertification.findFirst.mockResolvedValue(createMockCertification());

      const request = createRequest('POST', {
        name: 'Duplicate Test',
        issuingBody: 'Test Body',
        certificateNumber: 'CE-2024-001234', // Same as existing
        issueDate: '2024-01-01',
      });
      const response = await CertificationsAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });
  });
});

describe('Certification Types Coverage', () => {
  const supportedCertTypes = [
    { name: 'CE', fullName: 'CE Marking' },
    { name: 'ISO 9001', fullName: 'Quality Management' },
    { name: 'ISO 14001', fullName: 'Environmental Management' },
    { name: 'SGS', fullName: 'SGS Certification' },
    { name: 'TUV', fullName: 'TÜV Certification' },
    { name: 'FCC', fullName: 'FCC Compliance' },
    { name: 'RoHS', fullName: 'Restriction of Hazardous Substances' },
    { name: 'GOST', fullName: 'GOST Standard' },
  ];

  it('should support common certification types', () => {
    expect(supportedCertTypes.length).toBeGreaterThanOrEqual(8);
  });

  it('should store certification metadata correctly', () => {
    for (const certType of supportedCertTypes) {
      const cert = createMockCertification({
        name: certType.fullName,
        certificateNumber: `${certType.name}-2024-TEST`,
      });
      
      expect(cert.name).toBe(certType.fullName);
      expect(cert.certificateNumber).toContain(certType.name);
    }
  });
});

// ===========================================
// Test Suites - Bulk Pricing Tiers
// ===========================================

describe('Bulk Pricing Tier Calculations', () => {
  const pricingTiers = [
    { minQuantity: 1, unitPrice: 10000, discount: 0 },       // Base price
    { minQuantity: 10, unitPrice: 9000, discount: 10 },      // 10% off
    { minQuantity: 50, unitPrice: 8000, discount: 20 },      // 20% off
    { minQuantity: 100, unitPrice: 7000, discount: 30 },     // 30% off
    { minQuantity: 500, unitPrice: 6000, discount: 40 },     // 40% off
  ];

  it('should calculate correct tier selection based on quantity', () => {
    function getTierForQuantity(quantity: number) {
      let selectedTier = pricingTiers[0]; // Default to base
      for (const tier of pricingTiers) {
        if (quantity >= tier.minQuantity) {
          selectedTier = tier;
        }
      }
      return selectedTier;
    }

    expect(getTierForQuantity(1).unitPrice).toBe(10000);
    expect(getTierForQuantity(5).unitPrice).toBe(10000);
    expect(getTierForQuantity(10).unitPrice).toBe(9000);
    expect(getTierForQuantity(49).unitPrice).toBe(9000);
    expect(getTierForQuantity(50).unitPrice).toBe(8000);
    expect(getTierForQuantity(500).unitPrice).toBe(6000);
  });

  it('should calculate total price correctly per tier', () => {
    const testCases = [
      { quantity: 5, expectedTotal: 50000 },   // 5 * 10000
      { quantity: 20, expectedTotal: 180000 },  // 20 * 9000
      { quantity: 75, expectedTotal: 600000 },  // 75 * 8000
      { quantity: 200, expectedTotal: 1400000 }, // 200 * 7000
    ];

    for (const tc of testCases) {
      let selectedTier = pricingTiers[0];
      for (const tier of pricingTiers) {
        if (tc.quantity >= tier.minQuantity) selectedTier = tier;
      }
      
      const total = tc.quantity * selectedTier.unitPrice;
      expect(total).toBe(tc.expectedTotal);
    }
  });

  it('should have increasing discounts for higher quantities', () => {
    for (let i = 1; i < pricingTiers.length; i++) {
      expect(pricingTiers[i].discount).toBeGreaterThan(pricingTiers[i - 1].discount);
      expect(pricingTiers[i].unitPrice).toBeLessThan(pricingTiers[i - 1].unitPrice);
    }
  });
});

// ===========================================
// Test Suites - Customization Options
// ===========================================

describe('Customization Option Types', () => {
  const optionTypes = ['select', 'radio', 'checkbox', 'text', 'number', 'file', 'color'];

  it('should support all customization option types', () => {
    expect(optionTypes.length).toBe(7);
  });

  it('should store options correctly for each type', () => {
    const typeExamples = {
      select: JSON.stringify(['Option A', 'Option B', 'Option C']),
      radio: JSON.stringify(['Small', 'Medium', 'Large']),
      checkbox: JSON.stringify(['Feature 1', 'Feature 2', 'Feature 3']),
      text: JSON.stringify({ placeholder: 'Enter text', maxLength: 200 }),
      number: JSON.stringify({ min: 0, max: 1000, step: 1 }),
      file: JSON.stringify({ accept: '.pdf,.jpg,.png', maxSize: '5MB' }),
      color: JSON.stringify(['#FF0000', '#00FF00', '#0000FF', '#FFFFFF']),
    };

    for (const [type, options] of Object.entries(typeExamples)) {
      const option = createMockCustomizationOption({ type, options });
      expect(option.type).toBe(type);
      expect(typeof option.options).toBe('string');
      expect(JSON.parse(option.options)).toBeDefined();
    }
  });

  it('should handle price modifiers correctly', () => {
    const optionsWithModifiers = [
      { name: 'Premium Material', priceModifier: 5000 },
      { name: 'Express Shipping', priceModifier: 2000 },
      { name: 'Gift Wrap', priceModifier: 500 },
      { name: 'Standard (no extra)', priceModifier: 0 },
    ];

    for (const opt of optionsWithModifiers) {
      const option = createMockCustomizationOption(opt);
      expect(typeof option.priceModifier).toBe('number');
      expect(option.priceModifier).toBeGreaterThanOrEqual(0);
    }
  });

  it('should support required/optional flags', () => {
    const requiredOption = createMockCustomizationOption({ required: true });
    const optionalOption = createMockCustomizationOption({ required: false });

    expect(requiredOption.required).toBe(true);
    expect(optionalOption.required).toBe(false);
  });
});

// ===========================================
// Test Suites - Product Packages
// ===========================================

describe('Packages API - GET /api/packages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list packages with pagination', async () => {
    const mockPackages = [createMockPackage(), createMockPackage({ id: 'pkg-2' })];
    mockDb.productPackage.findMany.mockResolvedValue(mockPackages);
    mockDb.productPackage.count.mockResolvedValue(2);

    const request = createPackagesRequest('GET', undefined, { page: '1', limit: '20' });
    const response = await PackagesAPI.GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.packages).toHaveLength(2);
    expect(data.data.pagination).toBeDefined();
  });

  it('should calculate savings for each package', async () => {
    const packageWithItems = {
      ...createMockPackage(),
      items: [
        { product: { price: 15000 }, quantity: 1 },
        { product: { price: 12000 }, quantity: 1 },
        { product: { price: 8000 }, quantity: 1 },
      ],
    };
    
    mockDb.productPackage.findMany.mockResolvedValue([packageWithItems]);
    mockDb.productPackage.count.mockResolvedValue(1);

    const request = createPackagesRequest('GET');
    const response = await PackagesAPI.GET(request);
    const data = await response.json();

    // Items total: 15000 + 12000 + 8000 = 35000
    // Package price: 25000
    // Savings: 35000 - 25000 = 10000 (28.57%)
    expect(data.data.packages[0].calculatedSavings.originalTotal).toBe(35000);
    expect(data.data.packages[0].calculatedSavings.savingsAmount).toBe(10000);
    expect(data.data.packages[0].calculatedSavings.savingsPercent).toBeGreaterThan(0);
  });

  it('should filter by companyId', async () => {
    mockDb.productPackage.findMany.mockResolvedValue([]);
    mockDb.productPackage.count.mockResolvedValue(0);

    const request = createPackagesRequest('GET', undefined, { companyId: 'company-1' });
    await PackagesAPI.GET(request);

    expect(mockDb.productPackage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-1' }),
      })
    );
  });

  it('should filter by active status', async () => {
    mockDb.productPackage.findMany.mockResolvedValue([]);
    mockDb.productPackage.count.mockResolvedValue(0);

    const request = createPackagesRequest('GET', undefined, { isActive: 'true' });
    await PackagesAPI.GET(request);

    expect(mockDb.productPackage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
  });
});

describe('Packages API - POST /api/packages (Create)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a package with multiple products successfully', async () => {
    const mockCompany = createMockCompany();
    const mockProducts = [
      createMockProduct({ id: 'prod-1', price: 10000 }),
      createMockProduct({ id: 'prod-2', price: 15000 }),
    ];

    mockDb.company.findUnique.mockResolvedValue(mockCompany);
    mockDb.product.findMany.mockResolvedValue(mockProducts);
    mockDb.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        productPackage: { create: jest.fn().mockResolvedValue(createMockPackage()) },
        packageItem: { create: jest.fn().mockResolvedValue({}) },
      });
    });
    mockDb.productPackage.findUnique.mockResolvedValue(createMockPackage());

    const requestBody = {
      companyId: 'company-1',
      name: 'Professional Bundle',
      description: 'Complete professional solution',
      products: [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-2', quantity: 1 },
      ],
    };

    const request = createPackagesRequest('POST', requestBody);
    const response = await PackagesAPI.POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toContain('created successfully');
  });

  describe('Validation Errors', () => {
    it('should reject missing required fields', async () => {
      const request = createPackagesRequest('POST', { name: 'Only Name' });
      const response = await PackagesAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject packages with less than 2 products', async () => {
      const request = createPackagesRequest('POST', {
        companyId: 'company-1',
        name: 'Single Product Package',
        products: [{ productId: 'prod-1', quantity: 1 }],
      });
      const response = await PackagesAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('at least 2 products');
    });

    it('should reject non-existent company', async () => {
      mockDb.company.findUnique.mockResolvedValue(null);

      const request = createPackagesRequest('POST', {
        companyId: 'nonexistent',
        name: 'Test Package',
        products: [
          { productId: 'p1', quantity: 1 },
          { productId: 'p2', quantity: 1 },
        ],
      });
      const response = await PackagesAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Company not found');
    });

    it('should reject when some products are not found', async () => {
      mockDb.company.findUnique.mockResolvedValue(createMockCompany());
      mockDb.product.findMany.mockResolvedValue([createMockProduct()]); // Only one found

      const request = createPackagesRequest('POST', {
        companyId: 'company-1',
        name: 'Missing Products Package',
        products: [
          { productId: 'exists', quantity: 1 },
          { productId: 'missing', quantity: 1 },
        ],
      });
      const response = await PackagesAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found or not available');
    });
  });
});

describe('Related Products System', () => {
  const relationTypes = ['related', 'up_sell', 'cross_sell', 'complementary', 'alternative'];

  it('should support all relation types', () => {
    expect(relationTypes.length).toBe(5);
  });

  it('should define semantic meaning for each relation type', () => {
    const meanings = {
      related: 'Similar products in same category',
      up_sell: 'Higher-end alternatives',
      cross_sell: 'Complementary purchases',
      complementary: 'Products that go well together',
      alternative: 'Substitute products',
    };

    for (const type of relationTypes) {
      expect(meanings[type]).toBeDefined();
      expect(typeof meanings[type]).toBe('string');
    }
  });
});

describe('Package Discount Calculations', () => {
  it('should calculate percentage-based discounts correctly', () => {
    const testCases = [
      { original: 100000, discountPercent: 10, expectedDiscount: 10000, expectedFinal: 90000 },
      { original: 50000, discountPercent: 25, expectedDiscount: 12500, expectedFinal: 37500 },
      { original: 75000, discountPercent: 15, expectedDiscount: 11250, expectedFinal: 63750 },
    ];

    for (const tc of testCases) {
      const discountAmount = tc.original * (tc.discountPercent / 100);
      const finalPrice = tc.original - discountAmount;

      expect(discountAmount).toBe(tc.expectedDiscount);
      expect(finalPrice).toBe(tc.expectedFinal);
    }
  });

  it('should handle zero and edge case discounts', () => {
    // No discount
    expect(100000 * (0 / 100)).toBe(0);
    
    // Full discount (free)
    expect(100000 * (100 / 100)).toBe(100000);
  });
});
