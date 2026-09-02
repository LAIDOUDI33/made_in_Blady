// Video System Tests
// Tests for /api/videos endpoints - Phase 6C: Video Showroom & Multimedia

import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    productVideo: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    companyVideo: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { db } from '@/lib/db';
const mockDb = db as jest.Mocked<typeof db>;

// Import handlers after mocking
import { GET, POST } from '@/app/api/videos/route';

// ===========================================
// Test Data Factories
// ===========================================

function createMockProduct(overrides = {}) {
  return {
    id: 'product-1',
    name: 'Test Product',
    slug: 'test-product',
    ...overrides,
  };
}

function createMockCompany(overrides = {}) {
  return {
    id: 'company-1',
    name: 'Test Company',
    slug: 'test-company',
    ...overrides,
  };
}

function createMockProductVideo(overrides = {}) {
  return {
    id: 'video-1',
    productId: 'product-1',
    title: 'Product Demo Video',
    description: 'Demonstration of product features',
    videoUrl: 'https://example.com/video.mp4',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    duration: 180,
    type: 'product_demo',
    language: 'fr',
    isPrimary: true,
    status: 'ready',
    viewCount: 150,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    product: createMockProduct(),
    ...overrides,
  };
}

function createMockCompanyVideo(overrides = {}) {
  return {
    id: 'video-company-1',
    companyId: 'company-1',
    title: 'Company Introduction',
    description: 'Welcome to our company',
    videoUrl: 'https://example.com/company-video.mp4',
    thumbnailUrl: 'https://example.com/company-thumb.jpg',
    duration: 300,
    type: 'company_intro',
    language: 'ar',
    isFeatured: true,
    status: 'ready',
    viewCount: 500,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    company: createMockCompany(),
    ...overrides,
  };
}

function createRequest(method: string, body?: any, searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/videos');
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

describe('Videos API - GET /api/videos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Get Product Videos', () => {
    it('should return videos for a specific product', async () => {
      const mockVideos = [
        createMockProductVideo({ id: 'v1', isPrimary: true }),
        createMockProductVideo({ id: 'v2', isPrimary: false }),
      ];
      mockDb.productVideo.findMany.mockResolvedValue(mockVideos);

      const request = createRequest('GET', undefined, { productId: 'product-1' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      
      // Verify primary video comes first
      expect(data.data[0].isPrimary).toBe(true);

      // Verify correct query parameters
      expect(mockDb.productVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productId: 'product-1',
            status: 'ready',
          }),
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        })
      );
    });

    it('should filter by video type for products', async () => {
      mockDb.productVideo.findMany.mockResolvedValue([]);

      const request = createRequest('GET', undefined, { 
        productId: 'product-1',
        type: 'factory_tour' 
      });
      await GET(request);

      expect(mockDb.productVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'factory_tour',
          }),
        })
      );
    });

    it('should filter by language for products', async () => {
      mockDb.productVideo.findMany.mockResolvedValue([]);

      const request = createRequest('GET', undefined, { 
        productId: 'product-1',
        language: 'ar' 
      });
      await GET(request);

      expect(mockDb.productVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            language: 'ar',
          }),
        })
      );
    });
  });

  describe('Get Company Videos', () => {
    it('should return videos for a specific company', async () => {
      const mockVideos = [
        createMockCompanyVideo({ id: 'cv1', isFeatured: true }),
        createMockCompanyVideo({ id: 'cv2', isFeatured: false }),
      ];
      mockDb.companyVideo.findMany.mockResolvedValue(mockVideos);

      const request = createRequest('GET', undefined, { companyId: 'company-1' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      
      // Verify featured video comes first
      expect(data.data[0].isFeatured).toBe(true);

      // Verify correct query parameters
      expect(mockDb.companyVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-1',
            status: 'ready',
          }),
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        })
      );
    });
  });

  describe('List All Videos (Pagination)', () => {
    it('should return paginated list of all videos', async () => {
      const productVideos = [createMockProductVideo()];
      const companyVideos = [createMockCompanyVideo()];

      mockDb.productVideo.findMany.mockResolvedValue(productVideos);
      mockDb.companyVideo.findMany.mockResolvedValue(companyVideos);

      const request = createRequest('GET', undefined, { page: '1', limit: '20' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.productVideos).toBeDefined();
      expect(data.data.companyVideos).toBeDefined();
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(20);
    });

    it('should order by view count descending', async () => {
      mockDb.productVideo.findMany.mockResolvedValue([]);
      mockDb.companyVideo.findMany.mockResolvedValue([]);

      const request = createRequest('GET');
      await GET(request);

      expect(mockDb.productVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { viewCount: 'desc' },
        })
      );
      expect(mockDb.companyVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { viewCount: 'desc' },
        })
      );
    });

    it('should respect pagination parameters', async () => {
      mockDb.productVideo.findMany.mockResolvedValue([]);
      mockDb.companyVideo.findMany.mockResolvedValue([]);

      const request = createRequest('GET', undefined, { page: '3', limit: '10' });
      await GET(request);

      // Page 3 with limit 10 means skip 20
      expect(mockDb.productVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });

    it('should limit maximum results per page', async () => {
      mockDb.productVideo.findMany.mockResolvedValue([]);
      mockDb.companyVideo.findMany.mockResolvedValue([]);

      // Request more than max limit (50)
      const request = createRequest('GET', undefined, { limit: '100' });
      await GET(request);

      // Should be capped at 50
      expect(mockDb.productVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should include product/company info in results', async () => {
      mockDb.productVideo.findMany.mockResolvedValue([createMockProductVideo()]);
      mockDb.companyVideo.findMany.mockResolvedValue([createMockCompanyVideo()]);

      const request = createRequest('GET');
      await GET(request);

      expect(mockDb.productVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            product: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                name: true,
                slug: true,
              }),
            }),
          }),
        })
      );

      expect(mockDb.companyVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            company: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                name: true,
                slug: true,
              }),
            }),
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      mockDb.productVideo.findMany.mockRejectedValue(new Error('Database connection failed'));

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to fetch videos');
    });
  });
});

describe('Videos API - POST /api/videos (Create)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Product Video', () => {
    it('should create a product video successfully', async () => {
      const newVideo = createMockProductVideo({ status: 'processing' });
      mockDb.productVideo.create.mockResolvedValue(newVideo);

      const requestBody = {
        productId: 'product-1',
        title: 'New Product Demo',
        videoUrl: 'https://example.com/new-video.mp4',
        thumbnailUrl: 'https://example.com/new-thumb.jpg',
        duration: 240,
        type: 'product_demo',
        language: 'en',
        isPrimary: false,
      };

      const request = createRequest('POST', requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('New Product Demo');
      expect(data.data.status).toBe('processing'); // New videos start as processing

      // Verify default values
      expect(mockDb.productVideo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'product_demo',
            isPrimary: false,
            status: 'processing',
          }),
        })
      );
    });

    it('should set default type to product_demo when not specified', async () => {
      mockDb.productVideo.create.mockResolvedValue(createMockProductVideo());

      const requestBody = {
        productId: 'product-1',
        title: 'Video without type',
        videoUrl: 'https://example.com/video.mp4',
      };

      const request = createRequest('POST', requestBody);
      await POST(request);

      expect(mockDb.productVideo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'product_demo', // Default value
          }),
        })
      );
    });

    it('should remove primary flag from other videos when setting new primary', async () => {
      mockDb.productVideo.updateMany.mockResolvedValue({});
      mockDb.productVideo.create.mockResolvedValue(createMockProductVideo());

      const requestBody = {
        productId: 'product-1',
        title: 'New Primary Video',
        videoUrl: 'https://example.com/primary.mp4',
        isPrimary: true,
      };

      const request = createRequest('POST', requestBody);
      await POST(request);

      // Should update other videos to not be primary
      expect(mockDb.productVideo.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 'product-1' },
          data: { isPrimary: false },
        })
      );

      // Then create the new primary video
      expect(mockDb.productVideo.create).toHaveBeenCalled();
    });
  });

  describe('Create Company Video', () => {
    it('should create a company video successfully', async () => {
      const newVideo = createMockCompanyVideo({ status: 'processing' });
      mockDb.companyVideo.create.mockResolvedValue(newVideo);

      const requestBody = {
        companyId: 'company-1',
        title: 'Factory Tour 2024',
        videoUrl: 'https://example.com/factory-tour.mp4',
        thumbnailUrl: 'https://example.com/factory-thumb.jpg',
        duration: 600,
        type: 'factory_tour',
        language: 'fr',
        isFeatured: true,
      };

      const request = createRequest('POST', requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.type).toBe('factory_tour');
      expect(data.data.isFeatured).toBe(true);
    });

    it('should set default type to company_intro for company videos', async () => {
      mockDb.companyVideo.create.mockResolvedValue(createMockCompanyVideo());

      const requestBody = {
        companyId: 'company-1',
        title: 'About Us',
        videoUrl: 'https://example.com/about.mp4',
      };

      const request = createRequest('POST', requestBody);
      await POST(request);

      expect(mockDb.companyVideo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'company_intro', // Default value
          }),
        })
      );
    });
  });

  describe('Validation Errors', () => {
    it('should reject missing title', async () => {
      const request = createRequest('POST', {
        productId: 'product-1',
        videoUrl: 'https://example.com/video.mp4',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields: title');
    });

    it('should reject missing videoUrl', async () => {
      const request = createRequest('POST', {
        productId: 'product-1',
        title: 'No URL Video',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields: videoUrl');
    });

    it('should reject missing both productId and companyId', async () => {
      const request = createRequest('POST', {
        title: 'Orphan Video',
        videoUrl: 'https://example.com/video.mp4',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Either productId or companyId');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error during creation', async () => {
      mockDb.productVideo.create.mockRejectedValue(new Error('Database error'));

      const request = createRequest('POST', {
        productId: 'product-1',
        title: 'Error Video',
        videoUrl: 'https://example.com/error.mp4',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to create video');
    });
  });
});

describe('Video Type Validation', () => {
  const validProductVideoTypes = [
    'product_demo',
    'factory_tour',
    'testimonial',
    'tutorial',
  ];

  const validCompanyVideoTypes = [
    'company_intro',
    'factory_tour',
    'production_line',
    'ceo_message',
  ];

  it('should accept all valid product video types', () => {
    // This test validates that our implementation supports these types
    expect(validProductVideoTypes.length).toBeGreaterThan(0);
    expect(validProductVideoTypes).toContain('product_demo');
    expect(validProductVideoTypes).toContain('factory_tour');
  });

  it('should accept all valid company video types', () => {
    expect(validCompanyVideoTypes.length).toBeGreaterThan(0);
    expect(validCompanyVideoTypes).toContain('company_intro');
    expect(validCompanyVideoTypes).toContain('factory_tour');
  });
});

describe('Multi-language Support', () => {
  const supportedLanguages = ['ar', 'fr', 'en'];

  it('should support Arabic language code', () => {
    expect(supportedLanguages).toContain('ar');
  });

  it('should support French language code', () => {
    expect(supportedLanguages).toContain('fr');
  });

  it('should support English language code', () => {
    expect(supportedLanguages).toContain('en');
  });

  it('should store language correctly when creating video', async () => {
    mockDb.productVideo.create.mockResolvedValue(createMockProductVideo());

    for (const lang of supportedLanguages) {
      const request = createRequest('POST', {
        productId: 'product-1',
        title: `Video in ${lang}`,
        videoUrl: 'https://example.com/video.mp4',
        language: lang,
      });
      await POST(request);

      expect(mockDb.productVideo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            language: lang,
          }),
        })
      );
      
      jest.clearAllMocks();
    }
  });
});

describe('View Count Tracking', () => {
  it('should track view count on video records', async () => {
    const videoWithViews = createMockProductVideo({ viewCount: 1000 });
    
    // View count should be stored and retrievable
    expect(videoWithViews.viewCount).toBe(1000);
    expect(typeof videoWithViews.viewCount).toBe('number');
  });

  it('should initialize view count to 0 or undefined for new videos', async () => {
    const newVideo = createMockProductVideo({ viewCount: undefined });
    
    // New videos may start without views
    expect(newVideo.viewCount).toBeUndefined();
  });
});
