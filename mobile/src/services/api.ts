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
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;

// Also export class for custom instances
export { ApiService };
