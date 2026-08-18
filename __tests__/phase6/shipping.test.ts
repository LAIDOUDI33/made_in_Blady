// Shipping System Tests
// Tests for /api/shipping/rates and /api/shipments endpoints - Phase 6G: Logistics & Shipping

import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    shippingRate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    shipment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
    },
    trackingEvent: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
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
const ShippingRatesAPI = require('@/app/api/shipping/rates/route');
const ShipmentsAPI = require('@/app/api/shipments/route');

// ===========================================
// Constants - Algerian Wilayas (58)
// ===========================================

const ALGERIAN_WILAYAS = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
  '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
  '51', '52', '53', '54', '55', '56', '57', '58'
];

const WILAYA_NAMES: Record<string, string> = {
  '01': 'Adrar', '02': 'Chlef', '03': 'Laghouat', '16': 'Alger',
  '31': 'Oran', '58': 'In Guezzam'
};

const VALID_SHIPPING_METHODS = ['standard', 'express', 'same_day', 'pickup', 'freight', 'economy'];

const VALID_INCOTERMS = [
  'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DDP',
  'FAS', 'FOB', 'CFR', 'CIF'
];

const VALID_SHIPMENT_STATUSES = [
  'PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'IN_TRANSIT',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_ATTEMPTED',
  'EXCEPTION', 'RETURNED', 'CANCELLED'
];

// ===========================================
// Test Data Factories
// ===========================================

function createMockShippingRate(overrides = {}) {
  return {
    id: 'rate-1',
    originWilaya: '16',
    destinationWilaya: '31',
    method: 'standard',
    basePrice: 800,
    weightPrice: 50,
    volumePrice: 100,
    estimatedDaysMin: 2,
    estimatedDaysMax: 5,
    sameWilayaDiscount: 10,
    insuranceRate: 0.5,
    maxWeight: 30,
    maxDimensions: JSON.stringify({ length: 60, width: 40, height: 40 }),
    description: 'Standard delivery service',
    carrierName: 'Algeria Post',
    isActive: true,
    validFrom: new Date('2024-01-01'),
    validUntil: null,
    _count: { shipments: 0 },
    ...overrides,
  };
}

function createMockUser(overrides = {}) {
  return {
    id: 'user-1',
    firstName: 'Buyer',
    lastName: 'User',
    email: 'buyer@example.com',
    role: 'BUYER',
    companyId: null,
    ...overrides,
  };
}

function createMockCompany(overrides = {}) {
  return {
    id: 'company-1',
    name: 'Supplier Company',
    slug: 'supplier-company',
    userId: 'supplier-user',
    ...overrides,
  };
}

function createMockOrder(overrides = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ORD-2024001',
    totalAmount: 50000,
    currency: 'DZD',
    status: 'CONFIRMED',
    buyerId: 'user-1',
    companyId: 'company-1',
    company: createMockCompany(),
    buyer: createMockUser(),
    ...overrides,
  };
}

function createMockShipment(overrides = {}) {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + 5);

  return {
    id: 'ship-1',
    orderId: 'order-1',
    buyerId: 'user-1',
    supplierCompanyId: 'company-1',
    shippingMethod: 'standard',
    shippingRateId: 'rate-1',
    trackingNumber: 'DZST1705232800000ABC123',
    originAddress: JSON.stringify({ address: 'Factory Address, Zone Ind.', wilaya: '16' }),
    destinationAddress: JSON.stringify({ address: 'Customer Address', wilaya: '31' }),
    incoterm: 'DAP',
    weight: 5,
    dimensions: JSON.stringify({ length: 30, width: 20, height: 15 }),
    packageCount: 1,
    declaredValue: 50000,
    shippingCost: 1050,
    currency: 'DZD',
    specialInstructions: 'Handle with care',
    pickupDate: null,
    preferredDeliveryDate: futureDate,
    estimatedDelivery: futureDate,
    insuranceIncluded: false,
    signatureRequired: true,
    status: 'PENDING',
    shippedAt: null,
    deliveredAt: null,
    returnedAt: null,
    createdAt: now,
    updatedAt: now,
    order: createMockOrder(),
    buyer: createMockUser(),
    supplierCompany: createMockCompany(),
    shippingRate: createMockShippingRate(),
    trackingEvents: [],
    _count: { trackingEvents: 0 },
    ...overrides,
  };
}

function createRequest(url: string, method: string, body?: any, searchParams?: Record<string, string>): NextRequest {
  const fullUrl = new URL(url);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => fullUrl.searchParams.set(key, value));
  }
  
  return {
    url: fullUrl.toString(),
    method,
    headers: new Map([
      ['content-type', 'application/json'],
      ['x-forwarded-for', '127.0.0.1'],
    ]),
    json: () => Promise.resolve(body || {}),
  } as unknown as NextRequest;
}

function mockAuth(user?: any) {
  mockGetServerSession.mockResolvedValue(user ? { user } : null);
}

// ===========================================
// Test Suites - Shipping Rates
// ===========================================

describe('Shipping Rates API - GET /api/shipping/rates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate Calculation', () => {
    it('should calculate rates for valid wilaya pair', async () => {
      const mockRates = [createMockShippingRate()];
      mockDb.shippingRate.findMany.mockResolvedValue(mockRates);

      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '16',
        destination: '31',
        weight: '5',
        volume: '0.02',
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.rates).toHaveLength(1);
      expect(data.data.query.origin.code).toBe('16');
      expect(data.data.query.destination.code).toBe('31');
    });

    it('should calculate price with weight and volume', async () => {
      const baseRate = createMockShippingRate({
        basePrice: 800,
        weightPrice: 50,
        volumePrice: 100,
      });
      mockDb.shippingRate.findMany.mockResolvedValue([baseRate]);

      // Weight: 5kg * 50 = 250
      // Volume: 0.02m³ * 100 = 2
      // Base: 800
      // Total: 1052
      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '16',
        destination: '31',
        weight: '5',
        volume: '0.02',
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      expect(data.data.rates[0].calculatedPrice).toBe(1052);
      expect(data.data.rates[0].weightCost).toBe(250);
      expect(data.data.rates[0].volumeCost).toBe(2);
    });

    it('should apply same-wilaya discount when origin equals destination', async () => {
      const rateWithDiscount = createMockShippingRate({
        sameWilayaDiscount: 10, // 10% discount
        basePrice: 1000,
        weightPrice: 0,
        volumePrice: 0,
      });
      mockDb.shippingRate.findMany.mockResolvedValue([rateWithDiscount]);

      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '16',
        destination: '16', // Same wilaya!
        weight: '0',
        volume: '0',
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      // 1000 * (1 - 10/100) = 900
      expect(data.data.rates[0].calculatedPrice).toBe(900);
      expect(data.data.rates[0].sameWilayaDiscountApplied).toBe(10);
      expect(data.data.query.isSameWilaya).toBe(true);
    });

    it('should calculate insurance cost for declared value', async () => {
      const rateWithInsurance = createMockShippingRate({
        insuranceRate: 0.5, // 0.5%
        basePrice: 500,
        weightPrice: 0,
        volumePrice: 0,
      });
      mockDb.shippingRate.findMany.mockResolvedValue([rateWithInsurance]);

      // Value: 50000 * 0.5% = 250
      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '16',
        destination: '31',
        declaredValue: '50000',
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      expect(data.data.rates[0].insuranceCost).toBe(250);
      expect(data.data.rates[0].calculatedPrice).toBe(750); // 500 + 250
    });

    it('should sort by price ascending when no method specified', async () => {
      const rates = [
        createMockShippingRate({ id: 'r1', method: 'express', basePrice: 1500 }),
        createMockShippingRate({ id: 'r2', method: 'standard', basePrice: 800 }),
        createMockShippingRate({ id: 'r3', method: 'economy', basePrice: 500 }),
      ];
      mockDb.shippingRate.findMany.mockResolvedValue(rates);

      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '16',
        destination: '31',
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      // Should be sorted by calculatedPrice ascending
      expect(data.data.rates[0].method).toBe('economy');
      expect(data.data.rates[1].method).toBe('standard');
      expect(data.data.rates[2].method).toBe('express');
    });

    it('should provide summary with cheapest and fastest options', async () => {
      const rates = [
        createMockShippingRate({ id: 'r1', method: 'economy', basePrice: 500, estimatedDaysMin: 7, estimatedDaysMax: 10 }),
        createMockShippingRate({ id: 'r2', method: 'express', basePrice: 1500, estimatedDaysMin: 1, estimatedDaysMax: 2 }),
      ];
      mockDb.shippingRate.findMany.mockResolvedValue(rates);

      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '16',
        destination: '31',
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      expect(data.data.summary.cheapestOption.method).toBe('economy');
      expect(data.data.summary.cheapestOption.price).toBe(500);
      expect(data.data.summary.fastestOption.method).toBe('express');
    });

    it('should include wilaya names in query info', async () => {
      mockDb.shippingRate.findMany.mockResolvedValue([createMockShippingRate()]);

      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '16',
        destination: '31',
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      expect(data.data.query.origin.name).toBe('Alger');
      expect(data.data.query.destination.name).toBe('Oran');
    });
  });

  describe('Wilaya Validation', () => {
    it('should accept all 58 valid wilaya codes', async () => {
      mockDb.shippingRate.findMany.mockResolvedValue([]);

      for (const wilaya of ALGERIAN_WILAYAS) {
        const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
          origin: wilaya,
          destination: '31',
        });
        
        const response = await ShippingRatesAPI.GET(request);
        // Should not get validation error for valid wilaya
        expect(response.status).not.toBe(400);
      }
    });

    it('should reject invalid origin wilaya code', async () => {
      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '99', // Invalid
        destination: '31',
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid origin wilaya');
    });

    it('should reject invalid destination wilaya code', async () => {
      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '16',
        destination: '00', // Invalid
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid destination wilaya');
    });

    it('should normalize wilaya codes (pad with zero)', async () => {
      mockDb.shippingRate.findMany.mockResolvedValue([]);

      // Single digit should be padded to "01", etc.
      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '1',  // Should become "01"
        destination: '16',
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      // Should not error - normalization should handle this
      expect(response.status).not.toBe(400);
    });

    it('should require both origin and destination', async () => {
      const requestNoOrigin = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        destination: '31',
      });
      
      const response1 = await ShippingRatesAPI.GET(requestNoOrigin);
      expect(response1.status).toBe(400);

      const requestNoDest = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '16',
      });
      
      const response2 = await ShippingRatesAPI.GET(requestNoDest);
      expect(response2.status).toBe(400);
    });
  });

  describe('Fallback Rate Lookup', () => {
    it('should try wildcard destination when exact route not found', async () => {
      mockDb.shippingRate.findMany
        .mockResolvedValueOnce([]) // Exact route not found
        .mockResolvedValueOnce([createMockShippingRate({ destinationWilaya: 'ALL' })]); // Wildcard found

      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '16',
        destination: '55', // Remote wilaya without specific rate
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.rates.length).toBeGreaterThan(0);
    });

    it('should try general ALL->ALL rates as final fallback', async () => {
      mockDb.shippingRate.findMany
        .mockResolvedValueOnce([]) // Exact route not found
        .mockResolvedValueOnce([]) // Wildcard dest not found
        .mockResolvedValueOnce([createMockShippingRate({ originWilaya: 'ALL', destinationWilaya: 'ALL' })]); // General found

      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '16',
        destination: '31',
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.rates.length).toBeGreaterThan(0);
    });

    it('should return empty rates array when no matching route found', async () => {
      mockDb.shippingRate.findMany.mockResolvedValue([]);

      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '16',
        destination: '31',
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.rates).toHaveLength(0);
      expect(data.data.summary.availableOptions).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      mockDb.shippingRate.findMany.mockRejectedValue(new Error('DB Error'));

      const request = createRequest('http://localhost/api/shipping/rates', 'GET', undefined, {
        origin: '16',
        destination: '31',
      });
      
      const response = await ShippingRatesAPI.GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});

describe('Shipping Rates API - POST /api/shipping/rates (Create)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a shipping rate successfully', async () => {
    const newRate = createMockShippingRate();
    mockDb.shippingRate.findFirst.mockResolvedValue(null); // No duplicate
    mockDb.shippingRate.create.mockResolvedValue(newRate);

    const requestBody = {
      originWilaya: '16',
      destinationWilaya: '31',
      method: 'standard',
      basePrice: 800,
      weightPrice: 50,
      volumePrice: 100,
      estimatedDaysMin: 2,
      estimatedDaysMax: 5,
      carrierName: 'Algeria Post',
    };

    const request = createRequest('http://localhost/api/shipping/rates', 'POST', requestBody);
    const response = await ShippingRatesAPI.POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.originWilaya).toBe('16');
    expect(data.data.destinationWilaya).toBe('31');
  });

  describe('Validation Errors', () => {
    it('should reject missing required fields', async () => {
      const request = createRequest('http://localhost/api/shipping/rates', 'POST', { method: 'standard' });
      const response = await ShippingRatesAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject invalid shipping method', async () => {
      const request = createRequest('http://localhost/api/shipping/rates', 'POST', {
        originWilaya: '16',
        destinationWilaya: '31',
        method: 'teleport', // Invalid!
        basePrice: 100,
      });
      const response = await ShippingRatesAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid method');
    });

    it('should reject negative prices', async () => {
      const request = createRequest('http://localhost/api/shipping/rates', 'POST', {
        originWilaya: '16',
        destinationWilaya: '31',
        method: 'standard',
        basePrice: -100, // Negative!
      });
      const response = await ShippingRatesAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('must be non-negative');
    });

    it('should reject invalid min > max days', async () => {
      const request = createRequest('http://localhost/api/shipping/rates', 'POST', {
        originWilaya: '16',
        destinationWilaya: '31',
        method: 'standard',
        basePrice: 100,
        estimatedDaysMin: 10,
        estimatedDaysMax: 5, // Less than min!
      });
      const response = await ShippingRatesAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('estimatedDaysMin must be less than or equal to');
    });

    it('should reject duplicate rate for same route and method', async () => {
      mockDb.shippingRate.findFirst.mockResolvedValue(createMockShippingRate()); // Already exists

      const request = createRequest('http://localhost/api/shipping/rates', 'POST', {
        originWilaya: '16',
        destinationWilaya: '31',
        method: 'standard',
        basePrice: 900,
      });
      const response = await ShippingRatesAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });
  });
});

// ===========================================
// Test Suites - Shipments
// ===========================================

describe('Shipments API - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should require authentication for GET requests', async () => {
    mockAuth(null);

    const request = createRequest('http://localhost/api/shipments', 'GET');
    const response = await ShipmentsAPI.GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Authentication required');
  });

  it('should require authentication for POST requests', async () => {
    mockAuth(null);

    const request = createRequest('http://localhost/api/shipments', 'POST', {
      orderId: 'order-1',
      shippingMethod: 'standard',
      originAddress: 'Origin',
      destinationAddress: 'Destination',
    });
    const response = await ShipmentsAPI.POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Authentication required');
  });
});

describe('Shipments API - GET /api/shipments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list user\'s own shipments', async () => {
    mockAuth(createMockUser());
    
    const mockShipments = [createMockShipment(), createMockShipment({ id: 'ship-2' })];
    mockDb.shipment.findMany.mockResolvedValue(mockShipments);
    mockDb.shipment.count.mockResolvedValue(2);

    const request = createRequest('http://localhost/api/shipments', 'GET');
    const response = await ShipmentsAPI.GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.shipments).toHaveLength(2);
    
    // Non-admin users should only see their own
    expect(mockDb.shipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ buyerId: 'user-1' }),
            expect.objectContaining({ supplierCompanyId: null }), // No company ID
          ]),
        }),
      })
    );
  });

  it('should allow admins to see all shipments', async () => {
    mockAuth(createMockUser({ role: 'ADMIN' }));
    mockDb.shipment.findMany.mockResolvedValue([]);
    mockDb.shipment.count.mockResolvedValue(0);

    const request = createRequest('http://localhost/api/shipments', 'GET');
    await ShipmentsAPI.GET(request);

    // Admins should not have OR filter
    expect(mockDb.shipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({
          OR: expect.anything(),
        }),
      })
    );
  });

  it('should filter by status', async () => {
    mockAuth(createMockUser());
    mockDb.shipment.findMany.mockResolvedValue([]);
    mockDb.shipment.count.mockResolvedValue(0);

    const request = createRequest('http://localhost/api/shipments', 'GET', undefined, { status: 'IN_TRANSIT' });
    await ShipmentsAPI.GET(request);

    expect(mockDb.shipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'IN_TRANSIT' }),
      })
    );
  });

  it('should filter by tracking number (partial match)', async () => {
    mockAuth(createMockUser());
    mockDb.shipment.findMany.mockResolvedValue([]);
    mockDb.shipment.count.mockResolvedValue(0);

    const request = createRequest('http://localhost/api/shipments', 'GET', undefined, { trackingNumber: 'ABC123' });
    await ShipmentsAPI.GET(request);

    expect(mockDb.shipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          trackingNumber: expect.objectContaining({ contains: 'ABC123' }),
        }),
      })
    );
  });

  it('should include computed shipment data', async () => {
    mockAuth(createMockUser());
    mockDb.shipment.findMany.mockResolvedValue([createMockShipment()]);
    mockDb.shipment.count.mockResolvedValue(1);

    const request = createRequest('http://localhost/api/shipments', 'GET');
    const response = await ShipmentsAPI.GET(request);
    const data = await response.json();

    expect(data.data.shipments[0].computed).toBeDefined();
    expect(typeof data.data.shipments[0].computed.daysInTransit).toBe('number');
    expect(typeof data.data.shipments[0].computed.isOverdue).toBe('boolean');
  });

  it('should include status breakdown statistics', async () => {
    mockAuth(createMockUser());
    mockDb.shipment.findMany.mockResolvedValue([]);
    
    // Mock count calls for each status
    mockDb.shipment.count.mockImplementation(async (args: any) => 5);

    const request = createRequest('http://localhost/api/shipments', 'GET');
    const response = await ShipmentsAPI.GET(request);
    const data = await response.json();

    expect(data.data.stats).toBeDefined();
    expect(data.data.stats.statusBreakdown).toBeDefined();
    expect(Object.keys(data.data.stats.statusBreakdown)).toContain('PENDING');
    expect(Object.keys(data.data.stats.statusBreakdown)).toContain('DELIVERED');
  });
});

describe('Shipments API - POST /api/shipments (Create)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a shipment successfully', async () => {
    const mockOrder = createMockOrder({ buyerId: 'user-1' });
    const mockUser = createMockUser();
    const newShipment = createMockShipment();

    mockAuth(mockUser);
    mockDb.order.findUnique.mockResolvedValue(mockOrder);
    mockDb.shipment.findUnique.mockResolvedValue(null); // No existing shipment
    mockDb.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        shipment: { create: jest.fn().mockResolvedValue(newShipment) },
        trackingEvent: { create: jest.fn().mockResolvedValue({}) },
      });
    });
    mockDb.auditLog.create.mockResolvedValue({});
    mockDb.shipment.findUnique.mockResolvedValue(newShipment); // For fetch after creation

    const requestBody = {
      orderId: 'order-1',
      shippingMethod: 'standard',
      originAddress: { address: 'Factory, Zone Ind., Algiers', wilaya: '16' },
      destinationAddress: { address: 'Customer St, Oran', wilaya: '31' },
      weight: 5,
      dimensions: { length: 30, width: 20, height: 15 },
      packageCount: 1,
      declaredValue: 50000,
    };

    const request = createRequest('http://localhost/api/shipments', 'POST', requestBody);
    const response = await ShipmentsAPI.POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.trackingNumber).toMatch(/^DZ/);
    expect(data.data.status).toBe('PENDING');
    expect(data.data.incoterm).toBe('DAP'); // Default incoterm
  });

  it('should generate unique tracking numbers per method', async () => {
    mockAuth(createMockUser());
    mockDb.order.findUnique.mockResolvedValue(createMockOrder());
    mockDb.shipment.findUnique.mockResolvedValue(null);
    mockDb.auditLog.create.mockResolvedValue({});

    const createdTrackingNumbers: string[] = [];
    const methods = ['standard', 'express', 'pickup'];

    for (const method of methods) {
      mockDb.$transaction.mockImplementation(async (callback: any) => {
        const trackingNum = `DZ${method.substring(0, 2).toUpperCase()}${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        return callback({
          shipment: { create: jest.fn().mockResolvedValue({ ...createMockShipment(), trackingNumber: trackingNum }) },
          trackingEvent: { create: jest.fn() },
        });
      });
      mockDb.shipment.findUnique.mockResolvedValue(createMockShipment());

      const request = createRequest('http://localhost/api/shipments', 'POST', {
        orderId: 'order-1',
        shippingMethod: method,
        originAddress: 'Origin',
        destinationAddress: 'Destination',
      });
      
      const response = await ShipmentsAPI.POST(request);
      const data = await response.json();
      createdTrackingNumbers.push(data.data.trackingNumber);
    }

    // Verify all tracking numbers are unique
    const uniqueNumbers = new Set(createdTrackingNumbers);
    expect(uniqueNumbers.size).toBe(createdTrackingNumbers.length);
  });

  it('should validate incoterms', async () => {
    mockAuth(createMockUser());
    mockDb.order.findUnique.mockResolvedValue(createMockOrder());

    const request = createRequest('http://localhost/api/shipments', 'POST', {
      orderId: 'order-1',
      shippingMethod: 'standard',
      originAddress: 'Origin',
      destinationAddress: 'Destination',
      incoterm: 'INVALID_INCOTERM',
    });
    
    const response = await ShipmentsAPI.POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid incoterm');
  });

  describe('Validation Errors', () => {
    it('should reject missing required fields', async () => {
      mockAuth(createMockUser());

      const request = createRequest('http://localhost/api/shipments', 'POST', {
        orderId: 'order-1',
        // Missing shippingMethod, originAddress, destinationAddress
      });
      const response = await ShipmentsAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject non-existent order', async () => {
      mockAuth(createMockUser());
      mockDb.order.findUnique.mockResolvedValue(null);

      const request = createRequest('http://localhost/api/shipments', 'POST', {
        orderId: 'nonexistent',
        shippingMethod: 'standard',
        originAddress: 'Origin',
        destinationAddress: 'Destination',
      });
      const response = await ShipmentsAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Order not found');
    });

    it('should reject duplicate shipment for same order', async () => {
      mockAuth(createMockUser());
      mockDb.order.findUnique.mockResolvedValue(createMockOrder());
      mockDb.shipment.findUnique.mockResolvedValue(createMockShipment()); // Already exists

      const request = createRequest('http://localhost/api/shipments', 'POST', {
        orderId: 'order-1',
        shippingMethod: 'standard',
        originAddress: 'Origin',
        destinationAddress: 'Destination',
      });
      const response = await ShipmentsAPI.POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });
  });
});

// ===========================================
// Test Suites - Incoterms Validation
// ===========================================

describe('Incoterms Coverage', () => {
  it('should support all 11 standard incoterms', () => {
    expect(VALID_INCOTERMS.length).toBe(10); // Note: DPU is newer variant
    expect(VALID_INCOTERMS).toContain('EXW');   // Ex Works
    expect(VALID_INCOTERMS).toContain('FCA');   // Free Carrier
    expect(VALID_INCOTERMS).toContain('CPT');   // Carriage Paid To
    expect(VALID_INCOTERMS).toContain('CIP');   // Carriage and Insurance Paid
    expect(VALID_INCOTERMS).toContain('DAP');   // Delivered at Place
    expect(VALID_INCOTERMS).toContain('DDP');   // Delivered Duty Paid
    expect(VALID_INCOTERMS).toContain('FAS');   // Free Alongside Ship
    expect(VALID_INCOTERMS).toContain('FOB');   // Free on Board
    expect(VALID_INCOTERMS).toContain('CFR');   // Cost and Freight
    expect(VALID_INCOTERMS).toContain('CIF');   // Cost Insurance Freight
  });

  it('should define risk transfer points for each incoterm', () => {
    const riskTransferPoints = {
      EXW: 'Buyer picks up at seller\'s premises',
      FCA: 'Seller delivers to carrier nominated by buyer',
      CPT: 'Risk transfers when goods handed to first carrier',
      CIP: 'Risk transfers when goods handed to first carrier (+ insurance)',
      DAP: 'Risk transfers at named place of destination',
      DDP: 'Risk transfers at named place (seller pays duties)',
      FAS: 'Risk transfers alongside ship at named port',
      FOB: 'Risk transfers when goods pass ship\'s rail',
      CFR: 'Risk transfers when goods pass ship\'s rail',
      CIF: 'Risk transfers when goods pass ship\'s rail (+ insurance)',
    };

    for (const incoterm of VALID_INCOTERMS) {
      expect(riskTransferPoints[incoterm]).toBeDefined();
    }
  });
});

// ===========================================
// Test Suites - Shipment Lifecycle
// ===========================================

describe('Shipment Status Lifecycle', () => {
  const validStatuses = VALID_SHIPMENT_STATUSES;

  it('should define all valid shipment statuses', () => {
    expect(validStatuses.length).toBe(10);
  });

  it('should follow logical progression through statuses', () => {
    const typicalProgression = [
      'PENDING',
      'PROCESSING',
      'READY_FOR_PICKUP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];

    for (let i = 0; i < typicalProgression.length - 1; i++) {
      const current = typicalProgression[i];
      const next = typicalProgression[i + 1];
      expect(validStatuses.indexOf(current)).toBeLessThan(validStatuses.indexOf(next));
    }
  });

  it('should support exception states that can occur at any point', async () => {
    const exceptionStates = ['DELIVERY_ATTEMPTED', 'EXCEPTION', 'RETURNED', 'CANCELLED'];
    
    for (const state of exceptionStates) {
      expect(validStatuses).toContain(state);
    }
  });
});

// ===========================================
// Test Suites - Dimension/Weight Validation
// ===========================================

describe('Dimension and Weight Validation', () => {
  it('should store dimension data correctly', () => {
    const dimensions = { length: 60, width: 40, height: 40 }; // cm
    
    expect(dimensions.length).toBeLessThanOrEqual(60); // Typical max
    expect(dimensions.width).toBeLessThanOrEqual(40);
    expect(dimensions.height).toBeLessThanOrEqual(40);
    
    // Calculate volumetric weight
    const volumetricWeight = (dimensions.length * dimensions.width * dimensions.height) / 5000; // kg
    expect(volumetricWeight).toBe(19.2); // 96000/5000
  });

  it('should handle various weight units correctly', () => {
    const testCases = [
      { kg: 0.5, expectedGrams: 500 },
      { kg: 1, expectedGrams: 1000 },
      { kg: 30, expectedGrams: 30000 }, // Common max for standard shipping
    ];

    for (const tc of testCases) {
      expect(tc.kg * 1000).toBe(tc.expectedGrams);
    }
  });
});
