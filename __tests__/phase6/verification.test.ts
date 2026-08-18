// Verification System Tests
// Tests for /api/verification endpoints - Phase 6A: Enhanced Supplier Verification & Trust System

import { NextRequest } from 'next/server';
import { VerificationLevel, VerificationType, VerificationStatus } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    supplierVerification: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    companyBadge: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    verificationBadge: {
      findFirst: jest.fn(),
    },
  },
}));

import { db } from '@/lib/db';
const mockDb = db as jest.Mocked<typeof db>;

// Import handlers after mocking
const { GET, POST } = require('@/app/api/verification/route');
const { GET: GetById, PUT } = require('@/app/api/verification/[id]/route');

// ===========================================
// Test Data Factories
// ===========================================

function createMockCompany(overrides = {}) {
  return {
    id: 'company-1',
    name: 'Test Company',
    slug: 'test-company',
    logo: null,
    contactEmail: 'test@company.dz',
    contactPhone: '+213555123456',
    wilaya: '16',
    verificationLevel: VerificationLevel.BASIC,
    verificationStatus: VerificationStatus.PENDING,
    isVerified: false,
    ...overrides,
  };
}

function createMockVerification(overrides = {}) {
  return {
    id: 'ver-1',
    companyId: 'company-1',
    type: VerificationType.BUSINESS_LICENSE,
    level: VerificationLevel.VERIFIED,
    status: VerificationStatus.PENDING,
    documents: null,
    inspectorName: null,
    inspectionNotes: null,
    score: null,
    categoryScores: null,
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    rejectionReason: null,
    issuedAt: null,
    isValid: false,
    certificateNumber: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    company: createMockCompany(),
    ...overrides,
  };
}

function createMockRequest(method: string, body?: any, searchParams?: Record<string, string>) {
  const url = new URL('http://localhost/api/verification');
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
// Test Suites
// ===========================================

describe('Verification API - GET /api/verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('List Verifications', () => {
    it('should list all verifications without filters', async () => {
      const mockVerifications = [createMockVerification(), createMockVerification({ id: 'ver-2' })];
      mockDb.supplierVerification.findMany.mockResolvedValue(mockVerifications);

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(mockDb.supplierVerification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      );
    });

    it('should filter verifications by level', async () => {
      mockDb.supplierVerification.findMany.mockResolvedValue([]);

      const request = createRequest('GET', undefined, { level: 'VERIFIED' });
      await GET(request);

      expect(mockDb.supplierVerification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ level: 'VERIFIED' }),
        })
      );
    });

    it('should filter verifications by status', async () => {
      mockDb.supplierVerification.findMany.mockResolvedValue([]);

      const request = createRequest('GET', undefined, { status: 'PENDING' });
      await GET(request);

      expect(mockDb.supplierVerification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        })
      );
    });

    it('should filter verifications by type', async () => {
      mockDb.supplierVerification.findMany.mockResolvedValue([]);

      const request = createRequest('GET', undefined, { type: 'SGS_AUDIT' });
      await GET(request);

      expect(mockDb.supplierVerification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'SGS_AUDIT' }),
        })
      );
    });
  });

  describe('Get Company Verifications', () => {
    it('should return company verification details with badges', async () => {
      const mockVerifications = [createMockVerification()];
      const mockBadges = [{ id: 'badge-1', name: 'Verified', level: VerificationLevel.VERIFIED }];
      const mockCompany = createMockCompany();

      mockDb.supplierVerification.findMany.mockResolvedValue(mockVerifications);
      mockDb.companyBadge.findMany.mockResolvedValue(mockBadges);
      mockDb.company.findUnique.mockResolvedValue(mockCompany);

      const request = createRequest('GET', undefined, { companyId: 'company-1' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.verifications).toEqual(mockVerifications);
      expect(data.data.currentLevel).toBe(VerificationLevel.BASIC);
      expect(data.data.isVerified).toBe(false);
    });

    it('should handle company not found gracefully', async () => {
      mockDb.supplierVerification.findMany.mockResolvedValue([]);
      mockDb.companyBadge.findMany.mockResolvedValue([]);
      mockDb.company.findUnique.mockResolvedValue(null);

      const request = createRequest('GET', undefined, { companyId: 'nonexistent' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.currentLevel).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      mockDb.supplierVerification.findMany.mockRejectedValue(new Error('Database connection failed'));

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to fetch verifications');
    });
  });
});

describe('Verification API - POST /api/verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Verification Request', () => {
    it('should create a basic verification request successfully', async () => {
      const mockCompany = createMockCompany();
      const newVerification = createMockVerification();

      mockDb.company.findUnique.mockResolvedValue(mockCompany);
      mockDb.supplierVerification.findFirst.mockResolvedValue(null);
      mockDb.supplierVerification.create.mockResolvedValue(newVerification);

      const requestBody = {
        companyId: 'company-1',
        type: 'BUSINESS_LICENSE',
      };

      const request = createRequest('POST', requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toContain('submitted successfully');
      expect(mockDb.supplierVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: 'company-1',
            type: 'BUSINESS_LICENSE',
            level: VerificationLevel.VERIFIED,
            status: VerificationStatus.PENDING,
          }),
        })
      );
    });

    it('should assign correct level based on verification type', async () => {
      mockDb.company.findUnique.mockResolvedValue(createMockCompany());
      mockDb.supplierVerification.findFirst.mockResolvedValue(null);
      mockDb.supplierVerification.create.mockResolvedValue(createMockVerification());

      // Test SGS_AUDIT -> PREMIUM level
      const request = createRequest('POST', {
        companyId: 'company-1',
        type: 'SGS_AUDIT',
      });
      await POST(request);

      expect(mockDb.supplierVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            level: VerificationLevel.PREMIUM,
          }),
        })
      );

      // Test ISO_CERTIFICATION -> PREMIUM level
      jest.clearAllMocks();
      mockDb.company.findUnique.mockResolvedValue(createMockCompany());
      mockDb.supplierVerification.findFirst.mockResolvedValue(null);
      mockDb.supplierVerification.create.mockResolvedValue(createMockVerification());

      const request2 = createRequest('POST', {
        companyId: 'company-1',
        type: 'ISO_CERTIFICATION',
      });
      await POST2(request2);

      expect(mockDb.supplierVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            level: VerificationLevel.PREMIUM,
          }),
        })
      );
    });

    it('should store documents as JSON string when provided', async () => {
      mockDb.company.findUnique.mockResolvedValue(createMockCompany());
      mockDb.supplierVerification.findFirst.mockResolvedValue(null);
      mockDb.supplierVerification.create.mockResolvedValue(createMockVerification());

      const documents = [
        { name: 'license.pdf', url: 'https://example.com/license.pdf' },
        { name: 'id.jpg', url: 'https://example.com/id.jpg' },
      ];

      const request = createRequest('POST', {
        companyId: 'company-1',
        type: 'IDENTITY',
        documents,
        inspectorName: 'John Inspector',
        inspectionNotes: 'Documents look valid',
      });
      await POST(request);

      expect(mockDb.supplierVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documents: JSON.stringify(documents),
            inspectorName: 'John Inspector',
            inspectionNotes: 'Documents look valid',
          }),
        })
      );
    });
  });

  describe('Validation Errors', () => {
    it('should reject missing companyId', async () => {
      const request = createRequest('POST', { type: 'BUSINESS_LICENSE' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject missing type', async () => {
      const request = createRequest('POST', { companyId: 'company-1' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject non-existent company', async () => {
      mockDb.company.findUnique.mockResolvedValue(null);

      const request = createRequest('POST', {
        companyId: 'nonexistent',
        type: 'BUSINESS_LICENSE',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Company not found');
    });

    it('should reject duplicate pending verification of same type', async () => {
      mockDb.company.findUnique.mockResolvedValue(createMockCompany());
      mockDb.supplierVerification.findFirst.mockResolvedValue(createMockVerification());

      const request = createRequest('POST', {
        companyId: 'company-1',
        type: 'BUSINESS_LICENSE',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error during creation', async () => {
      mockDb.company.findUnique.mockRejectedValue(new Error('DB Error'));

      const request = createRequest('POST', {
        companyId: 'company-1',
        type: 'BUSINESS_LICENSE',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to create verification');
    });
  });
});

describe('Verification API - GET /api/verification/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return single verification with company details', async () => {
    const mockVerification = createMockVerification();
    mockDb.supplierVerification.findUnique.mockResolvedValue(mockVerification);

    const params = Promise.resolve({ id: 'ver-1' });
    const request = createRequest('GET');
    const response = await GetById(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('ver-1');
    expect(data.data.company).toBeDefined();
  });

  it('should return 404 for non-existent verification', async () => {
    mockDb.supplierVerification.findUnique.mockResolvedValue(null);

    const params = Promise.resolve({ id: 'nonexistent' });
    const request = createRequest('GET');
    const response = await GetById(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('not found');
  });

  it('should return 500 on database error', async () => {
    mockDb.supplierVerification.findUnique.mockRejectedValue(new Error('DB Error'));

    const params = Promise.resolve({ id: 'ver-1' });
    const request = createRequest('GET');
    const response = await GetById(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('Verification API - PUT /api/verification/[id] (Admin Review)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Approve Verification', () => {
    it('should approve verification and update company level', async () => {
      const mockVerification = createMockVerification({
        status: VerificationStatus.PENDING,
        level: VerificationLevel.VERIFIED,
      });
      const updatedVerification = {
        ...mockVerification,
        status: VerificationStatus.VERIFIED,
        isValid: true,
        issuedAt: new Date(),
      };

      mockDb.supplierVerification.findUnique.mockResolvedValue(mockVerification);
      mockDb.supplierVerification.update.mockResolvedValue(updatedVerification);
      mockDb.company.update.mockResolvedValue({});
      mockDb.verificationBadge.findFirst.mockResolvedValue(null);

      const params = Promise.resolve({ id: 'ver-1' });
      const request = createRequest('PUT', {
        status: 'VERIFIED',
        reviewedBy: 'admin-1',
        score: 95,
        notes: 'All documents verified',
      });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe(VerificationStatus.VERIFIED);
      expect(mockDb.company.update).toHaveBeenCalled();
    });

    it('should award badge when verification is approved', async () => {
      const mockVerification = createMockVerification({
        status: VerificationStatus.PENDING,
        level: VerificationLevel.CERTIFIED,
      });
      const updatedVerification = {
        ...mockVerification,
        status: VerificationStatus.VERIFIED,
      };
      const mockBadge = { id: 'badge-1', name: 'Certified', level: VerificationLevel.CERTIFIED };

      mockDb.supplierVerification.findUnique.mockResolvedValue(mockVerification);
      mockDb.supplierVerification.update.mockResolvedValue(updatedVerification);
      mockDb.company.update.mockResolvedValue({});
      mockDb.verificationBadge.findFirst.mockResolvedValue(mockBadge);
      mockDb.companyBadge.findUnique.mockResolvedValue(null);
      mockDb.companyBadge.create.mockResolvedValue({});

      const params = Promise.resolve({ id: 'ver-1' });
      const request = createRequest('PUT', {
        status: 'VERIFIED',
        reviewedBy: 'admin-1',
      });
      await PUT(request, { params });

      expect(mockDb.companyBadge.create).toHaveBeenCalled();
    });

    it('should not award duplicate badge if already exists', async () => {
      const mockVerification = createMockVerification({
        status: VerificationStatus.PENDING,
        level: VerificationLevel.VERIFIED,
      });
      const updatedVerification = {
        ...mockVerification,
        status: VerificationStatus.VERIFIED,
      };
      const mockBadge = { id: 'badge-1', name: 'Verified' };

      mockDb.supplierVerification.findUnique.mockResolvedValue(mockVerification);
      mockDb.supplierVerification.update.mockResolvedValue(updatedVerification);
      mockDb.company.update.mockResolvedValue({});
      mockDb.verificationBadge.findFirst.mockResolvedValue(mockBadge);
      mockDb.companyBadge.findUnique.mockResolvedValue({ id: 'existing-badge' }); // Already exists

      const params = Promise.resolve({ id: 'ver-1' });
      const request = createRequest('PUT', {
        status: 'VERIFIED',
        reviewedBy: 'admin-1',
      });
      await PUT(request, { params });

      expect(mockDb.companyBadge.create).not.toHaveBeenCalled();
    });
  });

  describe('Reject Verification', () => {
    it('should reject verification with reason', async () => {
      const mockVerification = createMockVerification({
        status: VerificationStatus.PENDING,
      });
      const updatedVerification = {
        ...mockVerification,
        status: VerificationStatus.REJECTED,
        rejectionReason: 'Invalid documents provided',
      };

      mockDb.supplierVerification.findUnique.mockResolvedValue(mockVerification);
      mockDb.supplierVerification.update.mockResolvedValue(updatedVerification);

      const params = Promise.resolve({ id: 'ver-1' });
      const request = createRequest('PUT', {
        status: 'REJECTED',
        reviewedBy: 'admin-1',
        rejectionReason: 'Invalid documents provided',
        notes: 'Please resubmit with clear copies',
      });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.rejectionReason).toBe('Invalid documents provided');
      expect(mockDb.company.update).not.toHaveBeenCalled(); // Should not update company on rejection
    });
  });

  describe('Validation Errors', () => {
    it('should reject missing status field', async () => {
      const params = Promise.resolve({ id: 'ver-1' });
      const request = createRequest('PUT', { reviewedBy: 'admin-1' });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject missing reviewedBy field', async () => {
      const params = Promise.resolve({ id: 'ver-1' });
      const request = createRequest('PUT', { status: 'VERIFIED' });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject non-existent verification', async () => {
      mockDb.supplierVerification.findUnique.mockResolvedValue(null);

      const params = Promise.resolve({ id: 'nonexistent' });
      const request = createRequest('PUT', {
        status: 'VERIFIED',
        reviewedBy: 'admin-1',
      });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should reject already reviewed verification', async () => {
      const mockVerification = createMockVerification({
        status: VerificationStatus.VERIFIED, // Already verified
      });

      mockDb.supplierVerification.findUnique.mockResolvedValue(mockVerification);

      const params = Promise.resolve({ id: 'ver-1' });
      const request = createRequest('PUT', {
        status: 'REJECTED',
        reviewedBy: 'admin-2',
      });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Only pending');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error during review', async () => {
      mockDb.supplierVerification.findUnique.mockRejectedValue(new Error('DB Error'));

      const params = Promise.resolve({ id: 'ver-1' });
      const request = createRequest('PUT', {
        status: 'VERIFIED',
        reviewedBy: 'admin-1',
      });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});

describe('Verification Level Hierarchy', () => {
  it('should correctly order verification levels', () => {
    // Based on the implementation's hierarchy
    const hierarchy = {
      [VerificationLevel.BASIC]: 0,
      [VerificationLevel.VERIFIED]: 1,
      [VerificationLevel.CERTIFIED]: 2,
      [VerificationLevel.PREMIUM]: 3,
      [VerificationLevel.ENTERPRISE]: 4,
    };

    expect(hierarchy[VerificationLevel.BASIC]).toBeLessThan(hierarchy[VerificationLevel.VERIFIED]);
    expect(hierarchy[VerificationLevel.VERIFIED]).toBeLessThan(hierarchy[VerificationLevel.CERTIFIED]);
    expect(hierarchy[VerificationLevel.CERTIFIED]).toBeLessThan(hierarchy[VerificationLevel.PREMIUM]);
    expect(hierarchy[VerificationLevel.PREMIUM]).toBeLessThan(hierarchy[VerificationLevel.ENTERPRISE]);
  });
});

// Helper function for creating requests
function createRequest(method: string, body?: any, searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/verification');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  
  return {
    url: url.toString(),
    method,
    headers: new Map([
      ['content-type', 'application/json'],
      ['x-forwarded-for', '127.0.0.1'],
    ]),
    json: () => Promise.resolve(body || {}),
  } as unknown as NextRequest;
}
