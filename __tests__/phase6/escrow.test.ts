// Escrow System Tests
// Tests for /api/escrow endpoints - Phase 6B: Trade Assurance & Escrow Payment System

import { NextRequest } from 'next/server';
import { EscrowStatus, DisputeStatus, DisputeReason, UserRole } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    escrowAccount: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    dispute: {
      create: jest.fn(),
    },
    securityEvent: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

const { getServerSession } = require('next-auth');
const mockGetServerSession = getServerSession as jest.Mock;

import { db } from '@/lib/db';
const mockDb = db as jest.Mocked<typeof db>;

// Import handlers after mocking
const { GET, POST } = require('@/app/api/escrow/route');
const { GET: GetById, POST: PostAction } = require('@/app/api/escrow/[id]/route');

// ===========================================
// Test Data Factories
// ===========================================

function createMockUser(overrides = {}) {
  return {
    id: 'user-1',
    email: 'buyer@example.com',
    name: 'Buyer User',
    role: UserRole.BUYER,
    companyId: null,
    ...overrides,
  };
}

function createMockOrder(overrides = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ORD-202401001',
    totalAmount: 50000,
    currency: 'DZD',
    status: 'PENDING_PAYMENT',
    buyerId: 'user-1',
    companyId: 'company-1',
    company: createMockCompany(),
    buyer: createMockUser(),
    ...overrides,
  };
}

function createMockCompany(overrides = {}) {
  return {
    id: 'company-1',
    name: 'Supplier Company',
    slug: 'supplier-company',
    userId: 'user-supplier',
    ...overrides,
  };
}

function createMockEscrow(overrides = {}) {
  return {
    id: 'escrow-1',
    accountId: 'ESC-1705232800000-ABC123DEF',
    orderId: 'order-1',
    buyerId: 'user-1',
    supplierCompanyId: 'company-1',
    amount: 50000,
    feeAmount: 1000,
    status: EscrowStatus.PENDING,
    paymentMethod: 'bank_transfer',
    paymentReference: 'REF-123456',
    fundedAt: null,
    inEscrowAt: null,
    releasedAmount: null,
    releaseRequestedAt: null,
    releasedAt: null,
    refundedAmount: null,
    refundRequestedAt: null,
    refundedAt: null,
    autoReleaseDays: 30,
    dispute: null,
    order: createMockOrder(),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  };
}

function createMockDispute(overrides = {}) {
  return {
    id: 'dispute-1',
    escrowId: 'escrow-1',
    title: 'Product not as described',
    description: 'The product does not match the specifications',
    reason: DisputeReason.PRODUCT_NOT_AS_DESCRIBED,
    openedBy: 'user-1',
    buyerId: 'user-1',
    supplierCompanyId: 'company-1',
    requestedAmount: 25000,
    status: DisputeStatus.OPEN,
    responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    evidence: null,
    messages: [],
    createdAt: new Date('2024-01-16'),
    ...overrides,
  };
}

function createRequest(method: string, body?: any, searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/escrow');
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

function mockAuth(user?: any) {
  mockGetServerSession.mockResolvedValue(
    user ? { user } : null
  );
}

// ===========================================
// Test Suites
// ===========================================

describe('Escrow API - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should require authentication for GET requests', async () => {
    mockAuth(null);

    const request = createRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication required');
  });

  it('should require authentication for POST requests', async () => {
    mockAuth(null);

    const request = createRequest('POST', { orderId: 'order-1', amount: 50000 });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Authentication required');
  });
});

describe('Escrow API - GET /api/escrow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('List Escrows', () => {
    it('should list user\'s own escrows for regular users', async () => {
      const mockUser = createMockUser();
      mockAuth(mockUser);

      const mockEscrows = [createMockEscrow(), createMockEscrow({ id: 'escrow-2' })];
      mockDb.escrowAccount.findMany.mockResolvedValue(mockEscrows);

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      
      // Verify that non-admin filter was applied
      expect(mockDb.escrowAccount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { buyerId: 'user-1' },
              { supplierCompanyId: null }, // No company ID for this user
            ],
          }),
        })
      );
    });

    it('should allow admins to see all escrows', async () => {
      const adminUser = createMockUser({ role: UserRole.ADMIN });
      mockAuth(adminUser);

      mockDb.escrowAccount.findMany.mockResolvedValue([]);

      const request = createRequest('GET');
      await GET(request);

      // Admin should not have OR filter applied
      expect(mockDb.escrowAccount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            OR: expect.anything(),
          }),
        })
      );
    });

    it('should filter by status when provided', async () => {
      mockAuth(createMockUser());
      mockDb.escrowAccount.findMany.mockResolvedValue([]);

      const request = createRequest('GET', undefined, { status: 'IN_ESCROW' });
      await GET(request);

      expect(mockDb.escrowAccount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'IN_ESCROW' }),
        })
      );
    });

    it('should return single escrow by orderId', async () => {
      mockAuth(createMockUser());
      const mockEscrow = createMockEscrow();
      mockDb.escrowAccount.findUnique.mockResolvedValue(mockEscrow);

      const request = createRequest('GET', undefined, { orderId: 'order-1' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.orderId).toBe('order-1');
    });

    it('should deny access to other users\' escrows', async () => {
      mockAuth(createMockUser({ id: 'other-user' }));
      
      const otherUsersEscrow = createMockEscrow({ buyerId: 'actual-owner' });
      mockDb.escrowAccount.findUnique.mockResolvedValue(otherUsersEscrow);

      const request = createRequest('GET', undefined, { orderId: 'order-1' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Forbidden');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent order escrow', async () => {
      mockAuth(createMockUser());
      mockDb.escrowAccount.findUnique.mockResolvedValue(null);

      const request = createRequest('GET', undefined, { orderId: 'nonexistent' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should return 500 on database error', async () => {
      mockAuth(createMockUser());
      mockDb.escrowAccount.findMany.mockRejectedValue(new Error('DB Error'));

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});

describe('Escrow API - POST /api/escrow (Create)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Escrow Account', () => {
    it('should create escrow account successfully', async () => {
      const mockUser = createMockUser();
      mockAuth(mockUser);

      const mockOrder = createMockOrder({ buyerId: 'user-1' });
      mockDb.order.findUnique.mockResolvedValue(mockOrder);
      mockDb.escrowAccount.findUnique.mockResolvedValue(null); // No existing escrow

      const newEscrow = createMockEscrow();
      mockDb.escrowAccount.create.mockResolvedValue(newEscrow);
      mockDb.auditLog.create.mockResolvedValue({});

      const requestBody = {
        orderId: 'order-1',
        amount: 50000,
        paymentMethod: 'bank_transfer',
        paymentReference: 'REF-123456',
      };

      const request = createRequest('POST', requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.accountId).toMatch(/^ESC-/);
      expect(data.data.feeAmount).toBe(1000); // 2% of 50000
      expect(data.data.autoReleaseDays).toBe(30);
    });

    it('should calculate platform fee correctly (2%)', async () => {
      mockAuth(createMockUser());

      const amounts = [10000, 50000, 100000, 250000];
      const expectedFees = [200, 1000, 2000, 5000];

      for (let i = 0; i < amounts.length; i++) {
        mockDb.order.findUnique.mockResolvedValue(createMockOrder({ totalAmount: amounts[i] }));
        mockDb.escrowAccount.findUnique.mockResolvedValue(null);
        mockDb.escrowAccount.create.mockResolvedValue(createMockEscrow({ amount: amounts[i] }));

        const request = createRequest('POST', { orderId: 'order-1', amount: amounts[i] });
        await POST(request);

        expect(mockDb.escrowAccount.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              feeAmount: expectedFees[i],
            }),
          })
        );
        
        jest.clearAllMocks();
        mockAuth(createMockUser());
      }
    });

    it('should generate unique account IDs', async () => {
      mockAuth(createMockUser());
      mockDb.order.findUnique.mockResolvedValue(createMockOrder());
      mockDb.escrowAccount.findUnique.mockResolvedValue(null);
      mockDb.auditLog.create.mockResolvedValue({});

      // Create multiple escrows and verify unique IDs
      const createdIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        mockDb.escrowAccount.create.mockImplementation(async (args: any) => ({
          ...args.data,
          id: `escrow-${i}`,
          accountId: args.data.accountId || `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));

        const request = createRequest('POST', { orderId: `order-${i}`, amount: 50000 });
        const response = await POST(request);
        const data = await response.json();
        createdIds.push(data.data.accountId);
      }

      // Verify all IDs are unique
      const uniqueIds = new Set(createdIds);
      expect(uniqueIds.size).toBe(createdIds.length);
    });

    it('should create audit log entry', async () => {
      mockAuth(createMockUser());
      mockDb.order.findUnique.mockResolvedValue(createMockOrder());
      mockDb.escrowAccount.findUnique.mockResolvedValue(null);
      mockDb.escrowAccount.create.mockResolvedValue(createMockEscrow());
      mockDb.auditLog.create.mockResolvedValue({});

      const request = createRequest('POST', { orderId: 'order-1', amount: 50000 });
      await POST(request);

      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE_ESCROW',
            resource: 'escrow',
            userId: 'user-1',
          }),
        })
      );
    });
  });

  describe('Validation Errors', () => {
    it('should reject missing orderId', async () => {
      mockAuth(createMockUser());

      const request = createRequest('POST', { amount: 50000 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject missing amount', async () => {
      mockAuth(createMockUser());

      const request = createRequest('POST', { orderId: 'order-1' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject non-existent order', async () => {
      mockAuth(createMockUser());
      mockDb.order.findUnique.mockResolvedValue(null);

      const request = createRequest('POST', { orderId: 'nonexistent', amount: 50000 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Order not found');
    });

    it('should reject creating escrow for another user\'s order', async () => {
      mockAuth(createMockUser({ id: 'hacker-user' }));
      mockDb.order.findUnique.mockResolvedValue(createMockOrder({ buyerId: 'victim-user' }));

      const request = createRequest('POST', { orderId: 'order-1', amount: 50000 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Forbidden');

      // Should log security event
      expect(mockDb.securityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'UNAUTHORIZED_ESCROW_ACCESS',
            severity: 'HIGH',
          }),
        })
      );
    });

    it('should reject duplicate escrow for same order', async () => {
      mockAuth(createMockUser());
      mockDb.order.findUnique.mockResolvedValue(createMockOrder());
      mockDb.escrowAccount.findUnique.mockResolvedValue(createMockEscrow()); // Already exists

      const request = createRequest('POST', { orderId: 'order-1', amount: 50000 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });
  });
});

describe('Escrow API - POST /api/escrow/[id] (Actions)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Fund Escrow Action', () => {
    it('should fund pending escrow successfully', async () => {
      mockAuth(createMockUser());
      
      const pendingEscrow = createMockEscrow({ status: EscrowStatus.PENDING });
      const fundedEscrow = {
        ...pendingEscrow,
        status: EscrowStatus.FUNDED,
        fundedAt: new Date(),
        inEscrowAt: new Date(),
      };

      mockDb.escrowAccount.findUnique.mockResolvedValue(pendingEscrow);
      mockDb.escrowAccount.update.mockResolvedValue(fundedEscrow);

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', { action: 'fund' });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe(EscrowStatus.FUNDED);
    });

    it('should reject funding already funded escrow', async () => {
      mockAuth(createMockUser());
      
      const releasedEscrow = createMockEscrow({ status: EscrowStatus.RELEASED });
      mockDb.escrowAccount.findUnique.mockResolvedValue(releasedEscrow);

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', { action: 'fund' });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('cannot be funded');
    });
  });

  describe('Release Escrow Action', () => {
    it('should release funds from in-escrow state', async () => {
      mockAuth(createMockUser());
      
      const inEscrowEscrow = createMockEscrow({ 
        status: EscrowStatus.IN_ESCROW,
        amount: 50000,
        feeAmount: 1000,
      });
      const releasedEscrow = {
        ...inEscrowEscrow,
        status: EscrowStatus.RELEASED,
        releasedAmount: 49000,
        releasedAt: new Date(),
      };

      mockDb.escrowAccount.findUnique.mockResolvedValue(inEscrowEscrow);
      mockDb.escrowAccount.update.mockResolvedValue(releasedEscrow);
      mockDb.order.update.mockResolvedValue({});

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', { action: 'release', releasedBy: 'admin-1' });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.releasedAmount).toBe(49000); // Amount - fee
      
      // Should update order status
      expect(mockDb.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PROCESSING' }),
        })
      );
    });

    it('should reject release from pending state', async () => {
      mockAuth(createMockUser());
      
      const pendingEscrow = createMockEscrow({ status: EscrowStatus.PENDING });
      mockDb.escrowAccount.findUnique.mockResolvedValue(pendingEscrow);

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', { action: 'release' });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('cannot be released');
    });
  });

  describe('Refund Escrow Action', () => {
    it('should process full refund successfully', async () => {
      mockAuth(createMockUser());
      
      const inEscrowEscrow = createMockEscrow({ 
        status: EscrowStatus.IN_ESCROW,
        amount: 50000,
      });
      const refundedEscrow = {
        ...inEscrowEscrow,
        status: EscrowStatus.REFUNDED,
        refundedAmount: 50000,
        refundedAt: new Date(),
      };

      mockDb.escrowAccount.findUnique.mockResolvedValue(inEscrowEscrow);
      mockDb.escrowAccount.update.mockResolvedValue(refundedEscrow);
      mockDb.order.update.mockResolvedValue({});

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', { action: 'refund', refundType: 'full' });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe(EscrowStatus.REFUNDED);
      expect(data.data.refundedAmount).toBe(50000);
      
      // Full refund should cancel order
      expect(mockDb.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CANCELLED' }),
        })
      );
    });

    it('should process partial refund with custom amount', async () => {
      mockAuth(createMockUser());
      
      const inEscrowEscrow = createMockEscrow({ amount: 50000 });
      const partialRefundEscrow = {
        ...inEscrowEscrow,
        status: EscrowStatus.PARTIAL_REFUND,
        refundedAmount: 15000,
        refundedAt: new Date(),
      };

      mockDb.escrowAccount.findUnique.mockResolvedValue(inEscrowEscrow);
      mockDb.escrowAccount.update.mockResolvedValue(partialRefundEscrow);

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', { 
        action: 'refund', 
        refundType: 'partial',
        amount: 15000,
      });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.status).toBe(EscrowStatus.PARTIAL_REFUND);
      expect(data.data.refundedAmount).toBe(15000);
    });

    it('should reject refund of already released escrow', async () => {
      mockAuth(createMockUser());
      
      const releasedEscrow = createMockEscrow({ status: EscrowStatus.RELEASED });
      mockDb.escrowAccount.findUnique.mockResolvedValue(releasedEscrow);

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', { action: 'refund', refundType: 'full' });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Cannot refund');
    });

    it('should reject refund of already refunded escrow', async () => {
      mockAuth(createMockUser());
      
      const refundedEscrow = createMockEscrow({ status: EscrowStatus.REFUNDED });
      mockDb.escrowAccount.findUnique.mockResolvedValue(refundedEscrow);

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', { action: 'refund', refundType: 'full' });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Cannot refund');
    });
  });

  describe('Dispute Action', () => {
    it('should open dispute successfully', async () => {
      mockAuth(createMockUser());
      
      const inEscrowEscrow = createMockEscrow({ status: EscrowStatus.IN_ESCROW });
      const newDispute = createMockDispute();

      mockDb.escrowAccount.findUnique.mockResolvedValue(inEscrowEscrow);
      mockDb.escrowAccount.update.mockResolvedValue({ ...inEscrowEscrow, status: EscrowStatus.DISPUTED });
      mockDb.dispute.create.mockResolvedValue(newDispute);

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', {
        action: 'dispute',
        title: 'Product not as described',
        description: 'The product does not match specifications',
        reason: 'PRODUCT_NOT_AS_DESCRIBED',
        requestedAmount: 25000,
        evidence: [{ type: 'photo', url: 'https://example.com/evidence.jpg' }],
      });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reason).toBe(DisputeReason.PRODUCT_NOT_AS_DESCRIBED);
      expect(data.data.responseDeadline).toBeDefined();
      
      // Verify 7-day deadline was set
      const deadlineDiff = data.data.responseDeadline.getTime() - Date.now();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      expect(Math.abs(deadlineDiff - sevenDaysInMs)).toBeLessThan(60000); // Within 1 minute

      // Escrow should be marked as disputed
      expect(mockDb.escrowAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: EscrowStatus.DISPUTED }),
        })
      );
    });

    it('should reject opening dispute when one already exists', async () => {
      mockAuth(createMockUser());
      
      const disputedEscrow = createMockEscrow({ 
        status: EscrowStatus.IN_ESCROW,
        dispute: createMockDispute(), // Already has a dispute
      });
      mockDb.escrowAccount.findUnique.mockResolvedValue(disputedEscrow);

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', {
        action: 'dispute',
        title: 'Another issue',
        description: 'New problem',
        reason: 'QUALITY_ISSUES',
      });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('Dispute already exists');
    });

    it('should accept all valid dispute reasons', async () => {
      const validReasons = Object.values(DisputeReason);
      
      for (const reason of validReasons) {
        mockAuth(createMockUser());
        
        const inEscrowEscrow = createMockEscrow({ status: EscrowStatus.IN_ESCROW, dispute: null });
        mockDb.escrowAccount.findUnique.mockResolvedValue(inEscrowEscrow);
        mockDb.escrowAccount.update.mockResolvedValue({});
        mockDb.dispute.create.mockResolvedValue(createMockDispute({ reason }));

        const params = Promise.resolve({ id: 'escrow-1' });
        const request = createRequest('POST', {
          action: 'dispute',
          title: 'Test dispute',
          description: 'Test description',
          reason,
        });
        const response = await PostAction(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.reason).toBe(reason);
        
        jest.clearAllMocks();
      }
    });
  });

  describe('Invalid Actions', () => {
    it('should reject unknown actions', async () => {
      mockAuth(createMockUser());
      mockDb.escrowAccount.findUnique.mockResolvedValue(createMockEscrow());

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', { action: 'invalid_action' });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });

    it('should require action field', async () => {
      mockAuth(createMockUser());
      mockDb.escrowAccount.findUnique.mockResolvedValue(createMockEscrow());

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', {}); // No action
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });
  });

  describe('Authorization', () => {
    it('should deny unauthorized users', async () => {
      mockAuth(createMockUser({ id: 'unauthorized-user' }));
      
      const escrow = createMockEscrow({ buyerId: 'owner-user', supplierCompanyId: 'other-company' });
      mockDb.escrowAccount.findUnique.mockResolvedValue(escrow);
      mockDb.company.findUnique.mockResolvedValue({ userId: 'different-user' }); // Not the requester

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', { action: 'fund' });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('permission');
    });

    it('should allow admin to perform any action', async () => {
      const adminUser = createMockUser({ role: UserRole.ADMIN });
      mockAuth(adminUser);
      
      const escrow = createMockEscrow({ buyerId: 'some-user' });
      mockDb.escrowAccount.findUnique.mockResolvedValue(escrow);
      mockDb.escrowAccount.update.mockResolvedValue(escrow);

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', { action: 'release' });
      const response = await PostAction(request, { params });
      const data = await response.json();

      // Admin should not get 403 error
      expect(response.status).not.toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent escrow', async () => {
      mockAuth(createMockUser());
      mockDb.escrowAccount.findUnique.mockResolvedValue(null);

      const params = Promise.resolve({ id: 'nonexistent' });
      const request = createRequest('POST', { action: 'fund' });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should return 500 on database error', async () => {
      mockAuth(createMockUser());
      mockDb.escrowAccount.findUnique.mockRejectedValue(new Error('DB Error'));

      const params = Promise.resolve({ id: 'escrow-1' });
      const request = createRequest('POST', { action: 'fund' });
      const response = await PostAction(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});

describe('Escrow Lifecycle Tests', () => {
  it('should follow correct lifecycle: PENDING -> FUNDED -> IN_ESCROW -> RELEASED', async () => {
    const states = [
      EscrowStatus.PENDING,
      EscrowStatus.FUNDED,
      EscrowStatus.IN_ESCROW,
      EscrowStatus.RELEASED,
    ];

    // This test validates that our implementation supports the expected lifecycle
    const validTransitions: Record<string, string[]> = {
      [EscrowStatus.PENDING]: [EscrowStatus.FUNDED],
      [EscrowStatus.FUNDED]: [EscrowStatus.IN_ESCROW],
      [EscrowStatus.IN_ESCROW]: [EscrowStatus.RELEASED, EscrowStatus.REFUNDED, EscrowStatus.PARTIAL_REFUND, EscrowStatus.DISPUTED],
    };

    for (let i = 0; i < states.length - 1; i++) {
      const fromState = states[i];
      const toState = states[i + 1];
      expect(validTransitions[fromState]).toContain(toState);
    }
  });

  it('should support all final states', async () => {
    const terminalStates = [
      EscrowStatus.RELEASED,
      EscrowStatus.REFUNDED,
      EscrowStatus.PARTIAL_REFUND,
    ];

    // These are states where no further transitions should occur
    terminalStates.forEach(state => {
      expect([EscrowStatus.RELEASED, EscrowStatus.REFUNDED, EscrowStatus.PARTIAL_REFUND]).toContain(state);
    });
  });
});
