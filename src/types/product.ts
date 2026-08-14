// Product Types for AlgeriaTrade B2B Platform

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface CompanyInfo {
  id: string;
  name: string;
  slug: string;
  wilaya: string;
  commune?: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  responseRate: number;
  logo?: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  icon?: string;
  productCount?: number;
  subcategories?: CategoryInfo[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  shortDescription?: string;
  description?: string;
  
  // Pricing
  price?: number | null;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  currency: string;
  negotiablePrice: boolean;
  
  // Inventory
  moq?: number | null;
  unit?: string | null;
  availability: 'in_stock' | 'out_of_stock' | 'pre_order' | 'discontinued';
  
  // Production
  leadTime?: string | null;
  
  // Origin
  countryOfOrigin?: string | null;
  
  // Relations
  company: CompanyInfo;
  category: CategoryInfo;
  images: ProductImage[];
  
  // Stats
  viewCount: number;
  isFeatured: boolean;
  status: string;
  isActive: boolean;
  
  // Aggregates
  _count: {
    reviews: number;
    favorites: number;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  search?: string;
  wilaya?: string;
  minPrice?: number;
  maxPrice?: number;
  minMoq?: number;
  maxMoq?: number;
  verifiedOnly?: boolean;
  availability?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'most_viewed' | 'rating';
  viewMode?: 'grid' | 'list';
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    categories: CategoryInfo[];
    wilayas: { name: string; code: string; count: number }[];
    priceRange: { min: number; max: number };
    moqRange: { min: number; max: number };
  };
}

export interface ProductDetail extends Product {
  specifications?: { key: string; value: string }[];
  reviews?: Review[];
  similarProducts?: Product[];
}

export interface Review {
  id: string;
  productId?: string;
  companyId?: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'company';
  count?: number;
}

export interface SearchResponse {
  results: Product[];
  suggestions: SearchSuggestion[];
  didYouMean?: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchQuery: string;
}

// Wilaya data for Algeria
export interface Wilaya {
  id: string;
  name: string;
  nameAr: string;
  code: string;
}

// Availability options with French labels
export const AVAILABILITY_OPTIONS = [
  { value: 'in_stock', label: 'En Stock', color: 'bg-green-100 text-green-800' },
  { value: 'pre_order', label: 'Pré-commande', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'out_of_stock', label: 'Rupture de Stock', color: 'bg-red-100 text-red-800' },
  { value: 'discontinued', label: 'Discontinué', color: 'bg-gray-100 text-gray-800' },
] as const;

// Sort options with French labels
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Plus Récent' },
  { value: 'price_asc', label: 'Prix Croissant' },
  { value: 'price_desc', label: 'Prix Décroissant' },
  { value: 'most_viewed', label: 'Plus Vus' },
  { value: 'rating', label: 'Mieux Notés' },
] as const;

// Algerian Wilayas list (58 wilayas)
export const ALGERIAN_WILAYAS = [
  { code: '01', name: 'Adrar' },
  { code: '02', name: 'Chlef' },
  { code: '03', name: 'Laghouat' },
  { code: '04', name: 'Oum El Bouaghi' },
  { code: '05', name: 'Batna' },
  { code: '06', name: 'Béjaïa' },
  { code: '07', name: 'Biskra' },
  { code: '08', name: 'Béchar' },
  { code: '09', name: 'Blida' },
  { code: '10', name: 'Bouira' },
  { code: '11', name: 'Tamanrasset' },
  { code: '12', name: 'Tébessa' },
  { code: '13', name: 'Tlemcen' },
  { code: '14', name: 'Tiaret' },
  { code: '15', name: 'Tizi Ouzou' },
  { code: '16', name: 'Alger' },
  { code: '17', name: 'Djelfa' },
  { code: '18', name: 'Jijel' },
  { code: '19', name: 'Sétif' },
  { code: '20', name: 'Saïda' },
  { code: '21', name: 'Skikda' },
  { code: '22', name: 'Sidi Bel Abbès' },
  { code: '23', name: 'Annaba' },
  { code: '24', name: 'Guelma' },
  { code: '25', name: 'Constantine' },
  { code: '26', name: 'Médéa' },
  { code: '27', name: 'Mostaganem' },
  { code: "28", name: "M'Sila" },
  { code: '29', name: 'Mascara' },
  { code: '30', name: 'Ouargla' },
  { code: '31', name: 'Oran' },
  { code: '32', name: 'El Bayadh' },
  { code: '33', name: 'Illizi' },
  { code: '34', name: 'Bordj Bou Arreridj' },
  { code: '35', name: 'Boumerdès' },
  { code: '36', name: 'El Tarf' },
  { code: '37', name: 'Tindouf' },
  { code: '38', name: 'Tissemsilt' },
  { code: '39', name: 'El Oued' },
  { code: '40', name: 'Khenchela' },
  { code: '41', name: 'Souk Ahras' },
  { code: '42', name: 'Tipaza' },
  { code: '43', name: 'Mila' },
  { code: '44', name: 'Aïn Defla' },
  { code: '45', name: 'Naâma' },
  { code: '46', name: 'Aïn Témouchent' },
  { code: '47', name: 'Ghardaïa' },
  { code: '48', name: 'Relizane' },
  { code: '49', name: "El M'Ghair" },
  { code: '50', name: 'El Meniaa' },
  { code: '51', name: 'Ouled Djellal' },
  { code: '52', name: 'Bordj Baji Mokhtar' },
  { code: '53', name: 'Béni Abbès' },
  { code: '54', name: 'Timimoun' },
  { code: '55', name: 'Tougourt' },
  { code: '56', name: 'Djanet' },
  { code: '57', name: 'In Salah' },
  { code: '58', name: 'In Guezzam' },
];
