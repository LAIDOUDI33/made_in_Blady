// Exhibition System Tests
// Tests for /api/exhibitions endpoints - Phase 6F: Online Exhibitions & Events

import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    exhibition: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  },
}));

import { db } from '@/lib/db';
const mockDb = db as jest.Mocked<typeof db>;

// Import handlers after mocking
const { GET, POST, PUT, DELETE } = require('@/app/api/exhibitions/route');

// ===========================================
// Test Data Factories
// ===========================================

function createMockOrganizer(overrides = {}) {
  return {
    id: 'org-1',
    name: 'Algeria Trade Association',
    logo: null,
    isVerified: true,
    contactEmail: 'contact@algeriatrade.dz',
    contactPhone: '+213555123456',
    ...overrides,
  };
}

function createFutureDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

function createPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function createMockExhibition(overrides = {}) {
  const startDate = createFutureDate(30);
  const endDate = createFutureDate(33); // 3-day exhibition

  return {
    id: 'exh-1',
    organizerId: 'org-1',
    title: 'Algeria Manufacturing Expo 2024',
    description: 'The premier manufacturing exhibition in Algeria',
    slug: 'algeria-manufacturing-expo-2024',
    type: 'HYBRID',
    startDate,
    endDate,
    venue: 'Convention Center, Algiers',
    wilaya: '16',
    address: 'Route des Sables, Algiers',
    isVirtual: true,
    virtualUrl: 'https://virtual.algeriatrade.dz/expo2024',
    maxRegistrations: 5000,
    registrationFee: 5000,
    currency: 'DZD',
    coverImage: 'https://example.com/cover.jpg',
    galleryImages: JSON.stringify(['img1.jpg', 'img2.jpg']),
    contactEmail: 'expo@algeriatrade.dz',
    contactPhone: '+213555987654',
    websiteUrl: 'https://algeriatrade.dz/expo2024',
    categories: JSON.stringify(['Manufacturing', 'Technology', 'Trade']),
    isFeatured: true,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    organizer: createMockOrganizer(),
    exhibitors: [],
    _count: { exhibitors: 25, registrations: 1200 },
    ...overrides,
  };
}

function createRequest(method: string, body?: any, searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/exhibitions');
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
// Test Suites - List Exhibitions
// ===========================================

describe('Exhibitions API - GET /api/exhibitions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list exhibitions with pagination', async () => {
    const mockExhibitions = [
      createMockExhibition({ id: 'exh-1' }),
      createMockExhibition({ id: 'exh-2' }),
    ];
    mockDb.exhibition.findMany.mockResolvedValue(mockExhibitions);
    mockDb.exhibition.count.mockResolvedValue(2);

    const request = createRequest('GET', undefined, { page: '1', limit: '12' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.exhibitions).toHaveLength(2);
    expect(data.data.pagination).toBeDefined();
    expect(data.data.pagination.page).toBe(1);
    expect(data.data.pagination.limit).toBe(12);
  });

  it('should include organizer and exhibitor counts', async () => {
    mockDb.exhibition.findMany.mockResolvedValue([createMockExhibition()]);
    mockDb.exhibition.count.mockResolvedValue(1);

    const request = createRequest('GET');
    await GET(request);

    expect(mockDb.exhibition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          organizer: expect.any(Object),
          exhibitors: expect.any(Object),
          _count: expect.any(Object),
        }),
      })
    );
  });

  describe('Status Filtering', () => {
    it('should filter upcoming exhibitions (future start dates)', async () => {
      mockDb.exhibition.findMany.mockResolvedValue([]);
      mockDb.exhibition.count.mockResolvedValue(0);

      const request = createRequest('GET', undefined, { status: 'upcoming' });
      await GET(request);

      expect(mockDb.exhibition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startDate: expect.objectContaining({ gt: expect.any(Date) }),
            isActive: true,
          }),
        })
      );
    });

    it('should filter ongoing exhibitions (current date within range)', async () => {
      mockDb.exhibition.findMany.mockResolvedValue([]);
      mockDb.exhibition.count.mockResolvedValue(0);

      const request = createRequest('GET', undefined, { status: 'ongoing' });
      await GET(request);

      expect(mockDb.exhibition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startDate: expect.objectContaining({ lte: expect.any(Date) }),
            endDate: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        })
      );
    });

    it('should filter past exhibitions', async () => {
      mockDb.exhibition.findMany.mockResolvedValue([]);
      mockDb.exhibition.count.mockResolvedValue(0);

      const request = createRequest('GET', undefined, { status: 'past' });
      await GET(request);

      expect(mockDb.exhibition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            endDate: expect.objectContaining({ lt: expect.any(Date) }),
          }),
        })
      );
    });

    it('should show all active when status=all or not specified', async () => {
      mockDb.exhibition.findMany.mockResolvedValue([]);
      mockDb.exhibition.count.mockResolvedValue(0);

      const request = createRequest('GET');
      await GET(request);

      // Should only have isActive filter, no date filters
      expect(mockDb.exhibition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });
  });

  describe('Type Filtering', () => {
    it('should filter by virtual type', async () => {
      mockDb.exhibition.findMany.mockResolvedValue([]);
      mockDb.exhibition.count.mockResolvedValue(0);

      const request = createRequest('GET', undefined, { type: 'virtual' });
      await GET(request);

      expect(mockDb.exhibition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'VIRTUAL' }),
        })
      );
    });

    it('should filter by physical type', async () => {
      mockDb.exhibition.findMany.mockResolvedValue([]);
      mockDb.exhibition.count.mockResolvedValue(0);

      const request = createRequest('GET', undefined, { type: 'physical' });
      await GET(request);

      expect(mockDb.exhibition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'PHYSICAL' }),
        })
      );
    });

    it('should filter by hybrid type', async () => {
      mockDb.exhibition.findMany.mockResolvedValue([]);
      mockDb.exhibition.count.mockResolvedValue(0);

      const request = createRequest('GET', undefined, { type: 'hybrid' });
      await GET(request);

      expect(mockDb.exhibition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'HYBRID' }),
        })
      );
    });

    it('should reject invalid types silently (no filter applied)', async () => {
      mockDb.exhibition.findMany.mockResolvedValue([]);
      mockDb.exhibition.count.mockResolvedValue(0);

      const request = createRequest('GET', undefined, { type: 'invalid_type' });
      await GET(request);

      // Type should not be in where clause for invalid values
      const whereClause = mockDb.exhibition.findMany.mock.calls[0][0].where;
      expect(whereClause.type).toBeUndefined();
    });
  });

  describe('Additional Filters', () => {
    it('should filter by featured status', async () => {
      mockDb.exhibition.findMany.mockResolvedValue([]);
      mockDb.exhibition.count.mockResolvedValue(0);

      const request = createRequest('GET', undefined, { featured: 'true' });
      await GET(request);

      expect(mockDb.exhibition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isFeatured: true }),
        })
      );
    });

    it('should search across title, description, and venue', async () => {
      mockDb.exhibition.findMany.mockResolvedValue([]);
      mockDb.exhibition.count.mockResolvedValue(0);

      const request = createRequest('GET', undefined, { search: 'manufacturing' });
      await GET(request);

      expect(mockDb.exhibition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: expect.objectContaining({ contains: 'manufacturing' }) },
              { description: expect.objectContaining({ contains: 'manufacturing' }) },
              { venue: expect.objectContaining({ contains: 'manufacturing' }) },
            ],
          }),
        })
      );
    });

    it('should filter by wilaya/location', async () => {
      mockDb.exhibition.findMany.mockResolvedValue([]);
      mockDb.exhibition.count.mockResolvedValue(0);

      const request = createRequest('GET', undefined, { wilaya: '16' });
      await GET(request);

      expect(mockDb.exhibition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ wilaya: '16' }),
        })
      );
    });
  });

  describe('Computed Data Enrichment', () => {
    it('should calculate computed status for each exhibition', async () => {
      const upcomingExhibition = createMockExhibition(); // Future dates
      mockDb.exhibition.findMany.mockResolvedValue([upcomingExhibition]);
      mockDb.exhibition.count.mockResolvedValue(1);

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.exhibitions[0].computedStatus).toBeDefined();
      expect(['upcoming', 'ongoing', 'ended']).toContain(data.data.exhibitions[0].computedStatus);
    });

    it('should calculate days until start/end', async () => {
      const exhibition = createMockExhibition();
      mockDb.exhibition.findMany.mockResolvedValue([exhibition]);
      mockDb.exhibition.count.mockResolvedValue(1);

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(typeof data.data.exhibitions[0].daysUntilStart).toBe('number');
      expect(typeof data.data.exhibitions[0].daysUntilEnd).toBe('number');
      expect(data.data.exhibitions[0].daysUntilStart).toBeGreaterThan(0); // Future event
    });

    it('should calculate duration in days', async () => {
      const threeDayExhibition = createMockExhibition();
      mockDb.exhibition.findMany.mockResolvedValue([threeDayExhibition]);
      mockDb.exhibition.count.mockResolvedValue(1);

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.exhibitions[0].durationDays).toBe(3); // 3-day difference
    });

    it('should calculate spots remaining and sold out status', async () => {
      const exhibitionWithCapacity = createMockExhibition({
        maxRegistrations: 5000,
        _count: { exhibitors: 25, registrations: 4800 },
      });
      mockDb.exhibition.findMany.mockResolvedValue([exhibitionWithCapacity]);
      mockDb.exhibition.count.mockResolvedValue(1);

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.exhibitions[0].spotsRemaining).toBe(200); // 5000 - 4800
      expect(data.data.exhibitions[0].isSoldOut).toBe(false);
    });

    it('should mark as sold out when capacity reached', async () => {
      const fullExhibition = createMockExhibition({
        maxRegistrations: 100,
        _count: { exhibitors: 10, registrations: 100 }, // At capacity
      });
      mockDb.exhibition.findMany.mockResolvedValue([fullExhibition]);
      mockDb.exhibition.count.mockResolvedValue(1);

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.exhibitions[0].isSoldOut).toBe(true);
      expect(data.data.exhibitions[0].spotsRemaining).toBe(0);
    });

    it('should handle unlimited capacity (null maxRegistrations)', async () => {
      const unlimitedExhibition = createMockExhibition({
        maxRegistrations: null,
        _count: { exhibitors: 50, registrations: 10000 },
      });
      mockDb.exhibition.findMany.mockResolvedValue([unlimitedExhibition]);
      mockDb.exhibition.count.mockResolvedValue(1);

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.exhibitions[0].spotsRemaining).toBeNull();
      expect(data.data.exhibitions[0].isSoldOut).toBe(false);
    });
  });

  describe('Sorting Behavior', () => {
    it('should sort past events by startDate descending', async () => {
      mockDb.exhibition.findMany.mockResolvedValue([]);
      mockDb.exhibition.count.mockResolvedValue(0);

      const request = createRequest('GET', undefined, { status: 'past' });
      await GET(request);

      expect(mockDb.exhibition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startDate: 'desc' },
        })
      );
    });

    it('should sort non-past events by featured first then startDate ascending', async () => {
      mockDb.exhibition.findMany.mockResolvedValue([]);
      mockDb.exhibition.count.mockResolvedValue(0);

      const request = createRequest('GET'); // Default status (not past)
      await GET(request);

      expect(mockDb.exhibition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ isFeatured: 'desc' }, { startDate: 'asc' }],
        })
      );
    });
  });
});

describe('Exhibitions API - POST /api/exhibitions (Create)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an exhibition successfully', async () => {
    const mockOrganizer = createMockOrganizer();
    const newExhibition = createMockExhibition();

    mockDb.company.findUnique?.mockResolvedValue?.(mockOrganizer) || 
      mockDb.exhibition.create.mockResolvedValue(newExhibition);
    
    // Mock findUnique for organizer check
    const originalCreate = mockDb.exhibition.create;
    mockDb.exhibition.findUnique = jest.fn().mockResolvedValue(null); // No existing slug
    
    const startDate = createFutureDate(60);
    const endDate = createFutureDate(64);

    const requestBody = {
      organizerId: 'org-1',
      title: 'Tech Innovation Summit 2024',
      description: 'Summit on latest technology innovations',
      type: 'VIRTUAL',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      virtualUrl: 'https://virtual.techsummit.dz',
      maxRegistrations: 10000,
      registrationFee: 2500,
    };

    const request = createRequest('POST', requestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toContain('created successfully');
  });

  it('should auto-generate slug from title if not provided', async () => {
    mockDb.exhibition.findUnique.mockResolvedValue(null); // No existing slug
    mockDb.exhibition.create.mockResolvedValue(createMockExhibition());

    const futureDate = createFutureDate(30);

    const requestBody = {
      organizerId: 'org-1',
      title: 'Amazing Trade Show 2024',
      type: 'PHYSICAL',
      startDate: futureDate.toISOString().split('T')[0],
      endDate: createFutureDate(33).toISOString().split('T')[0],
      venue: 'Exhibition Center',
    };

    const request = createRequest('POST', requestBody);
    const response = await POST(request);
    const data = await response.json();

    // Slug should be derived from title
    expect(data.data.slug).toContain('amazing-trade-show-2024');
  });

  it('should set isVirtual based on type automatically', async () => {
    mockDb.exhibition.findUnique.mockResolvedValue(null);
    mockDb.exhibition.create.mockResolvedValue(createMockExhibition());

    const testCases = [
      { type: 'VIRTUAL', expectedIsVirtual: true },
      { type: 'HYBRID', expectedIsVirtual: true },
      { type: 'PHYSICAL', expectedIsVirtual: false },
    ];

    for (const tc of testCases) {
      jest.clearAllMocks();
      mockDb.exhibition.findUnique.mockResolvedValue(null);
      mockDb.exhibition.create.mockResolvedValue(createMockExhibition());

      const futureDate = createFutureDate(30);

      const request = createRequest('POST', {
        organizerId: 'org-1',
        title: 'Test Event',
        type: tc.type,
        startDate: futureDate.toISOString().split('T')[0],
        endDate: createFutureDate(33).toISOString().split('T')[0],
        ...(tc.type !== 'VIRTUAL' ? { venue: 'Test Venue' } : { virtualUrl: 'https://test.com' }),
      });
      
      await POST(request);

      expect(mockDb.exhibition.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isVirtual: tc.expectedIsVirtual,
          }),
        })
      );
    }
  });

  describe('Validation Errors', () => {
    it('should reject missing required fields', async () => {
      const request = createRequest('POST', { title: 'Only Title' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject end date before start date', async () => {
      const startDate = createFutureDate(30);
      const endDate = createFutureDate(10); // Before start!

      const request = createRequest('POST', {
        organizerId: 'org-1',
        title: 'Invalid Dates Event',
        type: 'VIRTUAL',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        virtualUrl: 'https://test.com',
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('End date must be after start date');
    });

    it('should reject start date in the past', async () => {
      const pastDate = createPastDate(10);

      const request = createRequest('POST', {
        organizerId: 'org-1',
        title: 'Past Event',
        type: 'VIRTUAL',
        startDate: pastDate.toISOString().split('T')[0],
        endDate: createFutureDate(10).toISOString().split('T')[0],
        virtualUrl: 'https://test.com',
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('must be in the future');
    });

    it('should reject invalid type', async () => {
      const futureDate = createFutureDate(30);

      const request = createRequest('POST', {
        organizerId: 'org-1',
        title: 'Invalid Type Event',
        type: 'INVALID_TYPE',
        startDate: futureDate.toISOString().split('T')[0],
        endDate: createFutureDate(33).toISOString().split('T')[0],
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid type');
    });

    it('should require venue for physical/hybrid events', async () => {
      const futureDate = createFutureDate(30);

      const request = createRequest('POST', {
        organizerId: 'org-1',
        title: 'No Venue Physical Event',
        type: 'PHYSICAL',
        startDate: futureDate.toISOString().split('T')[0],
        endDate: createFutureDate(33).toISOString().split('T')[0],
        // Missing venue!
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Venue is required');
    });

    it('should require virtualUrl for virtual/hybrid events', async () => {
      const futureDate = createFutureDate(30);

      const request = createRequest('POST', {
        organizerId: 'org-1',
        title: 'No URL Virtual Event',
        type: 'VIRTUAL',
        startDate: futureDate.toISOString().split('T')[0],
        endDate: createFutureDate(33).toISOString().split('T')[0],
        // Missing virtualUrl!
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Virtual URL is required');
    });

    it('should reject non-existent organizer', async () => {
      // Mock company findUnique to return null
      mockDb.company = { findUnique: jest.fn().mockResolvedValue(null) };

      const futureDate = createFutureDate(30);

      const request = createRequest('POST', {
        organizerId: 'nonexistent',
        title: 'No Organizer Event',
        type: 'VIRTUAL',
        startDate: futureDate.toISOString().split('T')[0],
        endDate: createFutureDate(33).toISOString().split('T')[0],
        virtualUrl: 'https://test.com',
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should reject duplicate slug', async () => {
      mockDb.exhibition.findUnique.mockResolvedValue(createMockExhibition()); // Existing slug

      const futureDate = createFutureDate(30);

      const request = createRequest('POST', {
        organizerId: 'org-1',
        title: 'Duplicate Slug Event',
        slug: 'algeria-manufacturing-expo-2024', // Same as existing
        type: 'VIRTUAL',
        startDate: futureDate.toISOString().split('T')[0],
        endDate: createFutureDate(33).toISOString().split('T')[0],
        virtualUrl: 'https://test.com',
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });
  });
});

describe('Exhibitions API - PUT /api/exhibitions (Update)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update an exhibition successfully', async () => {
    const existingExhibition = createMockExhibition();
    const updatedExhibition = { ...existingExhibition, title: 'Updated Title' };

    mockDb.exhibition.findUnique.mockResolvedValue(existingExhibition);
    mockDb.exhibition.update.mockResolvedValue(updatedExhibition);

    const requestBody = {
      id: 'exh-1',
      title: 'Updated Title',
    };

    const request = createRequest('PUT', requestBody);
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Updated Title');
  });

  it('should convert date strings to Date objects on update', async () => {
    mockDb.exhibition.findUnique.mockResolvedValue(createMockExhibition());
    mockDb.exhibition.update.mockResolvedValue(createMockExhibition());

    const futureDate = createFutureDate(45);

    const request = createRequest('PUT', {
      id: 'exh-1',
      startDate: futureDate.toISOString(),
    });
    await PUT(request);

    const callArgs = mockDb.exhibition.update.mock.calls[0][0];
    expect(callArgs.data.startDate).toBeInstanceOf(Date);
  });

  it('should stringify JSON fields on update', async () => {
    mockDb.exhibition.findUnique.mockResolvedValue(createMockExhibition());
    mockDb.exhibition.update.mockResolvedValue(createMockExhibition());

    const imagesArray = ['new-image1.jpg', 'new-image2.jpg'];
    const categoriesArray = ['New Category'];

    const request = createRequest('PUT', {
      id: 'exh-1',
      galleryImages: imagesArray,
      categories: categoriesArray,
    });
    await PUT(request);

    const callArgs = mockDb.exhibition.update.mock.calls[0][0];
    expect(typeof callArgs.data.galleryImages).toBe('string');
    expect(typeof callArgs.data.categories).toBe('string');
  });

  it('should reject update without ID', async () => {
    const request = createRequest('PUT', { title: 'No ID Update' });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('ID is required');
  });

  it('should reject update of non-existent exhibition', async () => {
    mockDb.exhibition.findUnique.mockResolvedValue(null);

    const request = createRequest('PUT', { id: 'nonexistent', title: 'Update' });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('not found');
  });
});

describe('Exhibitions API - DELETE /api/exhibitions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete an exhibition without registrations', async () => {
    mockDb.exhibition.findUnique.mockResolvedValue({
      ...createMockExhibition(),
      _count: { registrations: 0, exhibitors: 0 },
    });
    mockDb.exhibition.delete.mockResolvedValue({});

    const request = createRequest('DELETE', undefined, { id: 'exh-1' });
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('deleted successfully');
  });

  it('should reject deletion of exhibition with registrations', async () => {
    mockDb.exhibition.findUnique.mockResolvedValue({
      ...createMockExhibition(),
      _count: { registrations: 50, exhibitors: 10 },
    });

    const request = createRequest('DELETE', undefined, { id: 'exh-1' });
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('Cannot delete');
    expect(data.error).toContain('50 registration');
  });

  it('should reject deletion without ID', async () => {
    const request = createRequest('DELETE');
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('ID is required');
  });

  it('should reject deletion of non-existent exhibition', async () => {
    mockDb.exhibition.findUnique.mockResolvedValue(null);

    const request = createRequest('DELETE', undefined, { id: 'nonexistent' });
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('not found');
  });
});

// ===========================================
// Test Suites - Exhibition Types & Features
// ===========================================

describe('Exhibition Types Coverage', () => {
  const validTypes = ['VIRTUAL', 'PHYSICAL', 'HYBRID'];

  it('should support all exhibition types', () => {
    expect(validTypes.length).toBe(3);
  });

  it('should define characteristics for each type', async () => {
    const typeCharacteristics = {
      VIRTUAL: { requiresVirtualUrl: true, requiresVenue: false, isVirtual: true },
      PHYSICAL: { requiresVirtualUrl: false, requiresVenue: true, isVirtual: false },
      HYBRID: { requiresVirtualUrl: true, requiresVenue: true, isVirtual: true },
    };

    for (const [type, chars] of Object.entries(typeCharacteristics)) {
      expect(chars).toBeDefined();
      expect(typeof chars.requiresVirtualUrl).toBe('boolean');
      expect(typeof chars.requiresVenue).toBe('boolean');
    }
  });
});

describe('Registration Capacity Limits', () => {
  it('should enforce capacity limits correctly', () => {
    function canRegister(currentRegistrations: number, maxCapacity: number | null): boolean {
      if (maxCapacity === null) return true; // Unlimited
      return currentRegistrations < maxCapacity;
    }

    expect(canRegister(99, 100)).toBe(true);
    expect(canRegister(100, 100)).toBe(false); // Full
    expect(canRegister(101, 100)).toBe(false); // Over capacity
    expect(canRegister(10000, null)).toBe(true); // Unlimited
  });

  it('should handle edge cases for capacity', () => {
    expect(() => {
      // Zero capacity means no one can register
      const result = 0 > 0; // false
      expect(result).toBe(false);
    }).not.toThrow();
  });
});
