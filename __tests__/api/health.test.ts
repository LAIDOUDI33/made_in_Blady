// Health Check API Tests
// Tests pour l'API de vérification de santé

import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('should return 200 status', async () => {
    const request = new Request('http://localhost:3000/api/health');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
  });

  it('should return JSON response', async () => {
    const request = new Request('http://localhost:3000/api/health');
    const response = await GET(request);
    
    const data = await response.json();
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
  });

  it('should include status field', async () => {
    const request = new Request('http://localhost:3000/api/health');
    const response = await GET(request);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });

  it('should include timestamp', async () => {
    const request = new Request('http://localhost:3000/api/health');
    const response = await GET(request);
    
    const data = await response.json();
    expect(data).toHaveProperty('timestamp');
    
    // Verify timestamp is valid ISO date
    const date = new Date(data.timestamp);
    expect(date.getTime()).not.toBeNaN();
  });
});
