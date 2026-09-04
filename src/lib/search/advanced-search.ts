/**
 * Advanced Search Module - AlgeriaTrade.dz
 * Recherche avancée avec support complet pour le marché algérien
 * Advanced search with full-text, faceted search, and auto-complete
 */

export interface SearchFilters {
  category?: string;
  subcategory?: string;
  wilaya?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  certification?: 'verified' | 'premium' | 'trusted';
  inStock?: boolean;
  freeShipping?: boolean;
  paymentTerms?: 'cash' | 'credit' | 'installment';
  sortBy?: 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'rating' | 'popular';
  page?: number;
  limit?: number;
}

export interface SearchResult<T = any> {
  id: string;
  title: string;
  description: string;
  type: 'product' | 'company' | 'rfq' | 'service';
  score: number;
  highlights: string[];
  data: T;
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'company' | 'wilaya';
  count?: number;
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface SearchFacets {
  categories: FacetOption[];
  wilayas: FacetOption[];
  priceRanges: FacetOption[];
  ratings: FacetOption[];
  certifications: FacetOption[];
}

// Wilaya codes and names for Algeria
export const ALGERIAN_WILAYAS: Record<number, string> = {
  1: 'Adrar', 2: 'Chlef', 3: 'Laghouat', 4: 'Oum El Bouaghi', 5: 'Batna',
  6: 'Béjaïa', 7: 'Biskra', 8: 'Béchar', 9: 'Blida', 10: 'Bouira',
  11: 'Tamanrasset', 12: 'Tébessa', 13: 'Tlemcen', 14: 'Tiaret', 15: 'Tizi Ouzou',
  16: 'Alger', 17: 'Djelfa', 18: 'Jijel', 19: 'Sétif', 20: 'Saïda',
  21: 'Skikda', 22: 'Sidi Bel Abbès', 23: 'Annaba', 24: 'Guelma', 25: 'Constantine',
  26: 'Médéa', 27: 'Mostaganem', 28: 'M\'Sila', 29: 'Mascara', 30: 'Ouargla',
  31: 'Oran', 32: 'El Bayadh', 33: 'Illizi', 34: 'Bordj Bou Arréridj', 35: 'Boumerdès',
  36: 'El Tarf', 37: 'Tindouf', 38: 'Tissemsilt', 39: 'El Oued', 40: 'Khenchela',
  41: 'Souk Ahras', 42: 'Tipaza', 43: 'Mila', 44: 'Aïn Defla', 45: 'Naâma',
  46: 'Aïn Témouchent', 47: 'Ghardaïa', 48: 'Relizane', 49: 'El M\'Ghair', 50: 'El Menia',
  51: 'Ouled Djellal', 52: 'Bordj Baji Mokhtar', 53: 'Béni Abbès', 54: 'Timimoun',
  55: 'Touggourt', 56: 'Djanet', 57: 'In Salah', 58: 'In Guezzam'
};

// French stop words for search
const FRENCH_STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'à', 'au',
  'aux', 'ce', 'cette', 'ces', 'que', 'qui', 'dans', 'sur', 'pour', 'par',
  'est', 'sont', 'avec', 'son', 'sa', 'ses', 'mais', 'ou', 'donc', 'ni',
  'car', 'plus', 'tout', 'autre', 'comme', 'très', 'bien', 'aussi', 'pas',
  'nous', 'vous', 'ils', 'elles', 'on', 'notre', 'votre', 'leur', 'mes',
  'tes', 'ses', 'mon', 'ton', 'cet', 'cette', 'quels', 'quelques', 'entre',
  'vers', 'depuis', 'pendant', 'avant', 'après', 'sans', 'sous', 'chez'
]);

// Arabic stop words (basic set)
const ARABIC_STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي',
  'أن', 'لا', 'ما', 'قد', 'لم', 'بين', 'كل', 'بعد', 'حتى', 'أو'
]);

/**
 * Normalize search query - remove accents, lowercase, remove stop words
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim();
}

/**
 * Extract meaningful terms from query (remove stop words)
 */
export function extractSearchTerms(query: string): string[] {
  const normalized = normalizeQuery(query);
  const terms = normalized.split(/\s+/).filter(term => 
    term.length > 1 && 
    !FRENCH_STOP_WORDS.has(term) && 
    !ARABIC_STOP_WORDS.has(term)
  );
  return [...new Set(terms)]; // Remove duplicates
}

/**
 * Calculate relevance score for a document against search terms
 */
export function calculateRelevanceScore(
  document: { title: string; description: string; tags?: string[] },
  terms: string[]
): number {
  const { title, description, tags = [] } = document;
  const titleLower = normalizeQuery(title);
  const descLower = normalizeQuery(description);
  const tagsLower = tags.map(t => normalizeQuery(t));
  
  let score = 0;
  
  for (const term of terms) {
    // Title matches are worth more
    if (titleLower.includes(term)) {
      score += 10;
      // Exact word match bonus
      if (titleLower.split(/\s+/).includes(term)) score += 5;
    }
    
    // Description matches
    if (descLower.includes(term)) {
      score += 3;
    }
    
    // Tag matches
    if (tagsLower.some(t => t.includes(term))) {
      score += 5;
    }
  }
  
  // Boost for documents matching more terms
  const matchedTerms = terms.filter(term => 
    titleLower.includes(term) || descLower.includes(term)
  );
  score += matchedTerms.length * 2;
  
  return score;
}

/**
 * Get highlight snippets for search results
 */
export function getHighlights(
  text: string,
  terms: string[],
  maxLength: number = 150
): string[] {
  const normalized = normalizeQuery(text);
  const highlights: string[] = [];
  
  for (const term of terms) {
    const index = normalized.indexOf(term);
    if (index !== -1) {
      const start = Math.max(0, index - 50);
      const end = Math.min(text.length, index + term.length + 100);
      const snippet = (start > 0 ? '...' : '') + 
                     text.slice(start, end) + 
                     (end < text.length ? '...' : '');
      highlights.push(snippet);
    }
  }
  
  return highlights.slice(0, 3); // Max 3 highlights
}

/**
 * Generate search suggestions based on partial input
 */
export function generateSuggestions(
  partial: string,
  products: Array<{ name: string; category: string }>,
  companies: Array<{ name: string; wilaya: number }>,
  limit: number = 10
): SearchSuggestion[] {
  const normalizedPartial = normalizeQuery(partial);
  const suggestions: SearchSuggestion[] = [];
  
  if (normalizedPartial.length < 2) return suggestions;
  
  // Product suggestions
  const productNames = new Map<string, number>();
  for (const product of products) {
    if (normalizeQuery(product.name).includes(normalizedPartial)) {
      productNames.set(product.name, (productNames.get(product.name) || 0) + 1);
    }
  }
  
  for (const [name, count] of productNames.entries()) {
    suggestions.push({ text: name, type: 'product', count });
  }
  
  // Company suggestions
  for (const company of companies) {
    if (normalizeQuery(company.name).includes(normalizedPartial)) {
      suggestions.push({
        text: company.name,
        type: 'company',
        wilaya: ALGERIAN_WILAYAS[company.wilaya]
      } as any);
    }
  }
  
  return suggestions.slice(0, limit);
}

/**
 * Apply filters to search results
 */
export function applyFilters<T extends Record<string, any>>(
  results: SearchResult<T>[],
  filters: SearchFilters
): SearchResult<T>[] {
  let filtered = [...results];
  
  if (filters.category) {
    filtered = filtered.filter(r => r.data.category === filters.category);
  }
  
  if (filters.wilaya) {
    filtered = filtered.filter(r => r.data.wilaya === filters.wilaya);
  }
  
  if (filters.priceMin !== undefined) {
    filtered = filtered.filter(r => 
      r.data.price >= filters.priceMin!
    );
  }
  
  if (filters.priceMax !== undefined) {
    filtered = filtered.filter(r => 
      r.data.price <= filters.priceMax!
    );
  }
  
  if (filters.rating !== undefined) {
    filtered = filtered.filter(r => 
      r.data.rating >= filters.rating!
    );
  }
  
  if (filters.inStock) {
    filtered = filtered.filter(r => r.data.stock > 0);
  }
  
  // Sort results
  switch (filters.sortBy) {
    case 'price-asc':
      filtered.sort((a, b) => a.data.price - b.data.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.data.price - a.data.price);
      break;
    case 'newest':
      filtered.sort((a, b) => 
        new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
      );
      break;
    case 'rating':
      filtered.sort((a, b) => b.data.rating - a.data.rating);
      break;
    case 'popular':
      filtered.sort((a, b) => (b.data.viewCount || 0) - (a.data.viewCount || 0));
      break;
    default: // relevance
      filtered.sort((a, b) => b.score - a.score);
  }
  
  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const start = (page - 1) * limit;
  
  return filtered.slice(start, start + limit);
}

/**
 * Build facet counts from search results
 */
export function buildFacets<T extends Record<string, any>>(
  results: SearchResult<T>[]
): SearchFacets {
  const categoryCounts = new Map<string, number>();
  const wilayaCounts = new Map<string, number>();
  const ratingCounts = new Map<string, number>();
  
  for (const result of results) {
    // Category facets
    const cat = result.data.category || 'Autre';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    
    // Wilaya facets
    if (result.data.wilaya) {
      const wilayaName = ALGERIAN_WILAYAS[result.data.wilaya] || `Wilaya ${result.data.wilaya}`;
      wilayaCounts.set(wilayaName, (wilayaCounts.get(wilayaName) || 0) + 1);
    }
    
    // Rating facets
    const rating = Math.floor(result.data.rating || 0);
    const ratingLabel = `${rating}+ étoiles`;
    ratingCounts.set(ratingLabel, (ratingCounts.get(ratingLabel) || 0) + 1);
  }
  
  // Price range facets
  const priceRanges = [
    { value: '0-1000', label: 'Moins de 1 000 DZD', min: 0, max: 1000 },
    { value: '1000-5000', label: '1 000 - 5 000 DZD', min: 1000, max: 5000 },
    { value: '5000-10000', label: '5 000 - 10 000 DZD', min: 5000, max: 10000 },
    { value: '10000-50000', label: '10 000 - 50 000 DZD', min: 10000, max: 50000 },
    { value: '50000+', label: 'Plus de 50 000 DZD', min: 50000, max: Infinity },
  ];
  
  const priceRangeFacets = priceRanges.map(range => ({
    value: range.value,
    label: range.label,
    count: results.filter(r => 
      r.data.price >= range.min && r.data.price < range.max
    ).length
  }));
  
  return {
    categories: Array.from(categoryCounts.entries()).map(([value, count]) => ({
      value,
      label: value,
      count
    })),
    wilayas: Array.from(wilayaCounts.entries()).map(([value, count]) => ({
      value,
      label: value,
      count
    })),
    priceRanges: priceRangeFacets,
    ratings: Array.from(ratingCounts.entries()).map(([value, count]) => ({
      value,
      label: value,
      count
    })),
    certifications: []
  };
}

/**
 * Track search analytics event
 */
export function trackSearchEvent(
  userId: string | null,
  query: string,
  filters: SearchFilters,
  resultCount: number,
  clickedResultId?: string
): void {
  // This would send to analytics service
  const event = {
    eventType: clickedResultId ? 'search_result_click' : 'search',
    userId,
    timestamp: new Date().toISOString(),
    query,
    filters,
    resultCount,
    clickedResultId
  };
  
  console.log('[Search Analytics]', event); // Replace with actual tracking
}

/**
 * Export search results to CSV
 */
export function exportToCSV<T>(results: SearchResult<T>[], columns: string[]): string {
  const header = columns.join(',');
  const rows = results.map(r => 
    columns.map(col => {
      const value = (r.data as any)[col];
      // Escape quotes and wrap in quotes if contains comma
      const strValue = String(value ?? '');
      return strValue.includes(',') || strValue.includes('"') 
        ? `"${strValue.replace(/"/g, '""')}"` 
        : strValue;
    }).join(',')
  );
  
  return [header, ...rows].join('\n');
}
