import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

// Constants
import { APIConfig, AppConfig } from '../utils/constants';

// Types
interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: APIConfig.baseURL,
      timeout: APIConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        
        // Add app info
        config.headers['X-App-Version'] = AppConfig.version;
        config.headers['X-Platform'] = 'mobile';
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        const apiError: ApiError = {
          message: "Une erreur est survenue",
          status: error.response?.status,
        };

        if (error.response?.data) {
          apiError.message = error.response.data.message || apiError.message;
          apiError.code = error.response.data.code;
        }

        // Handle specific error codes
        switch (error.response?.status) {
          case 401:
            // Token expired - trigger logout
            this.onUnauthorized();
            break;
          case 429:
            apiError.message = "Trop de requêtes. Veuillez réessayer plus tard.";
            break;
          case 500:
            apiError.message = "Erreur serveur. Veuillez réessayer.";
            break;
        }

        return Promise.reject(apiError);
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  private onUnauthorized() {
    // Clear token and emit event for auth state change
    this.token = null;
    // This would typically trigger a logout action in your store
    console.log('[API] Unauthorized - clearing token');
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  // API Methods
  
  // Auth
  async login(email: string, password: string) {
    return this.post<{ token: string; user: any }>('/auth/login', { email, password });
  }

  async register(data: any) {
    return this.post('/auth/register', data);
  }

  async getProfile() {
    return this.get<any>('/auth/profile');
  }

  // Products
  async getProducts(params?: { page?: number; category?: string; search?: string }) {
    return this.get<any[]>('/products', { params });
  }

  async getProductDetail(id: string) {
    return this.get<any>(`/products/${id}`);
  }

  // RFQs
  async getRFQs(params?: { page?: number; status?: string }) {
    return this.get<any[]>('/rfqs', { params });
  }

  async createRFQ(data: any) {
    return this.post('/rfqs', data);
  }

  // Messages
  async getConversations() {
    return this.get<any[]>('/messages');
  }

  async getMessages(conversationId: string) {
    return this.get<any[]>(`/messages/${conversationId}`);
  }

  async sendMessage(conversationId: string, content: string) {
    return this.post(`/messages/${conversationId}`, { content });
  }

  // User
  async updateProfile(data: any) {
    return this.put('/user/profile', data);
  }

  async getFavorites() {
    return this.get<any[]>('/user/favorites');
  }

  async addToFavorites(productId: string) {
    return this.post(`/user/favorites/${productId}`);
  }

  async removeFromFavorites(productId: string) {
    return this.delete(`/user/favorites/${productId}`);
  }

  // ============================================
  // PHASE 6: NEW API ENDPOINTS
  // ============================================

  // ============================================
  // VERIFICATION API
  // ============================================
  
  /**
   * Get current user's verification status and history
   */
  async getVerifications() {
    return this.get<any>('/verification');
  }

  /**
   * Submit a new verification request with documents
   */
  async submitVerification(data: FormData | { type: string; document: any }) {
    if (data instanceof FormData) {
      return this.client.post<ApiResponse<any>>('/verification', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(res => res.data.data);
    }
    return this.post('/verification', data);
  }

  /**
   * Get verification details by ID
   */
  async getVerificationDetail(id: string) {
    return this.get<any>(`/verification/${id}`);
  }

  // ============================================
  // ESCROW / TRADE ASSURANCE API
  // ============================================

  /**
   * Create escrow account for an order
   */
  async createEscrow(orderId: string) {
    return this.post('/escrow', { orderId });
  }

  /**
   * Fund an escrow account
   */
  async fundEscrow(escrowId: string, amount: number) {
    return this.post(`/escrow/${escrowId}/fund`, { amount });
  }

  /**
   * Get escrow details
   */
  async getEscrowDetail(escrowId: string) {
    return this.get<any>(`/escrow/${escrowId}`);
  }

  /**
   * Request release of funds from escrow
   */
  async requestRelease(escrowId: string) {
    return this.post(`/escrow/${escrowId}/release`);
  }

  /**
   * Accept release as buyer
   */
  async acceptRelease(escrowId: string) {
    return this.post(`/escrow/${escrowId}/accept-release`);
  }

  /**
   * Request refund from escrow
   */
  async requestRefund(escrowId: string) {
    return this.post(`/escrow/${escrowId}/refund`);
  }

  /**
   * Accept refund as seller
   */
  async acceptRefund(escrowId: string) {
    return this.post(`/escrow/${escrowId}/accept-refund`);
  }

  /**
   * Open a dispute on escrow
   */
  async openDispute(escrowId: string, data: { reason: string; description: string }) {
    return this.post(`/escrow/${escrowId}/dispute`, data);
  }

  /**
   * Send message in dispute thread
   */
  async sendDisputeMessage(escrowId: string, content: string) {
    return this.post(`/escrow/${escrowId}/dispute/message`, { content });
  }

  /**
   * Get list of user's escrows
   */
  async getEscrows(params?: { status?: string; page?: number }) {
    return this.get<any[]>('/escrow', { params });
  }

  // ============================================
  // VIDEOS & VIRTUAL TOURS API
  // ============================================

  /**
   * Get videos for a product
   */
  async getVideos(productId: string) {
    return this.get<any[]>(`/videos?productId=${productId}`);
  }

  /**
   * Upload a new video
   */
  async uploadVideo(data: FormData) {
    return this.client.post<ApiResponse<any>>('/videos', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data.data);
  }

  /**
   * Get company videos
   */
  async getCompanyVideos(companyId: string) {
    return this.get<any[]>(`/videos/company/${companyId}`);
  }

  /**
   * Get virtual tours for a company
   */
  async getVirtualTours(companyId: string) {
    return this.get<any[]>(`/videos/company/${companyId}/tours`);
  }

  /**
   * Create virtual tour
   */
  async createVirtualTour(companyId: string, data: any) {
    return this.post(`/videos/company/${companyId}/tours`, data);
  }

  // ============================================
  // INSPECTION API
  // ============================================

  /**
   * Get available inspection services
   */
  async getInspectionServices() {
    return this.get<any[]>('/inspection/services');
  }

  /**
   * Book an inspection
   */
  async bookInspection(data: {
    productId?: string;
    serviceId: string;
    inspectionType: string;
    preferredDate: Date;
    address: any;
    specialInstructions?: string;
    isUrgent?: boolean;
  }) {
    return this.post('/inspection/bookings', data);
  }

  /**
   * Get user's inspection bookings
   */
  async getInspectionBookings(params?: { status?: string }) {
    return this.get<any[]>('/inspection/bookings', { params });
  }

  /**
   * Get inspection booking detail with results
   */
  async getInspectionBookingDetail(bookingId: string) {
    return this.get<any>(`/inspection/bookings/${bookingId}`);
  }

  // ============================================
  // EXHIBITIONS API
  // ============================================

  /**
   * Get list of exhibitions
   */
  async getExhibitions(params?: { status?: string; type?: string; page?: number }) {
    return this.get<any[]>('/exhibitions', { params });
  }

  /**
   * Get exhibition detail
   */
  async getExhibitionDetail(exhibitionId: string) {
    return this.get<any>(`/exhibitions/${exhibitionId}`);
  }

  /**
   * Register for an exhibition
   */
  async registerForExhibition(exhibitionId: string, data: {
    type: string;
    companyName?: string;
    jobTitle?: string;
    interests?: string;
  }) {
    return this.post(`/exhibitions/${exhibitionId}/register`, data);
  }

  /**
   * Get exhibition booths
   */
  async getExhibitionBooths(exhibitionId: string) {
    return this.get<any[]>(`/exhibitions/${exhibitionId}/booths`);
  }

  /**
   * Get exhibition events/schedule
   */
  async getExhibitionEvents(exhibitionId: string) {
    return this.get<any[]>(`/exhibitions/${exhibitionId}/events`);
  }

  // ============================================
  // SHIPPING API
  // ============================================

  /**
   * Calculate shipping rates
   */
  async calculateShipping(origin: string, destination: string, weight: number) {
    return this.post('/shipping/rates', { origin, destination, weight });
  }

  /**
   * Track shipment by tracking number
   */
  async trackShipment(trackingNumber: string) {
    return this.get<any>(`/shipments/track/${trackingNumber}`);
  }

  /**
   * Get user's shipments
   */
  async getShipments(params?: { status?: string; page?: number }) {
    return this.get<any[]>('/shipments', { params });
  }

  /**
   * Get shipment detail
   */
  async getShipmentDetail(shipmentId: string) {
    return this.get<any>(`/shipments/${shipmentId}`);
  }

  /**
   * Rate delivery experience
   */
  async rateDelivery(shipmentId: string, data: {
    rating: number;
    comment?: string;
    categories: any;
  }) {
    return this.post(`/shipments/${shipmentId}/rate`, data);
  }

  // ============================================
  // PRODUCT ADVANCED FEATURES API
  // ============================================

  /**
   * Get product certifications
   */
  async getProductCertifications(productId: string) {
    return this.get<any[]>(`/certifications?productId=${productId}`);
  }

  /**
   * Get bulk pricing tiers for product
   */
  async getBulkPricing(productId: string) {
    return this.get<any[]>(`/bulk-pricing/${productId}`);
  }

  /**
   * Get customization options for product
   */
  async getCustomizationOptions(productId: string) {
    return this.get<any[]>(`/customization/${productId}`);
  }

  /**
   * Get related products
   */
  async getRelatedProducts(productId: string, params?: { type?: string }) {
    return this.get<any[]>(`/products/${productId}/related`, { params });
  }

  /**
   * Get product packages/bundles
   */
  async getPackages(productId: string) {
    return this.get<any[]>(`/packages?productId=${productId}`);
  }

  // ============================================
  // TRENDING & INSIGHTS API
  // ============================================

  /**
   * Get trending products
   */
  async getTrendingProducts(params?: { category?: string; period?: string }) {
    return this.get<any[]>('/trending', { params });
  }

  /**
   * Get market insights/articles
   */
  async getMarketInsights(params?: { targetRole?: string; page?: number }) {
    return this.get<any[]>('/market-insights', { params });
  }

  /**
   * Get buying guides
   */
  async getBuyingGuides(params?: { category?: string; difficulty?: string }) {
    return this.get<any[]>('/buying-guides', { params });
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;

// Also export class for custom instances
export { ApiService };
