// AI-Powered Search Enhancement
import { db } from '@/lib/db';

// French/Arabic common misspellings and corrections
const SPELL_CORRECTIONS: Record<string, string> = {
  // French common mistakes
  'panneau': 'panneau',
  'paneau': 'panneau',
  'paneaux': 'panneaux',
  'solaire': 'solaire',
  'solair': 'solaire',
  'solere': 'solaire',
  'pompe': 'pompe',
  'pompe': 'pompe',
  'pomp': 'pompe',
  'machine': 'machine',
  'machin': 'machine',
  'mashine': 'machine',
  'acier': 'acier',
  'aciers': 'acier',
  'assier': 'acier',
  'ciment': 'ciment',
  'ciment': 'ciment',
  'simen': 'ciment',
  'engrais': 'engrais',
  'engré': 'engrais',
  'angrais': 'engrais',
  'tube': 'tube',
  'tub': 'tube',
  'tubes': 'tube',
  'cable': 'câble',
  'cable': 'câble',
  'cable': 'câble',
  'cabl': 'câble',
  'moteur': 'moteur',
  'moteure': 'moteur',
  'motore': 'moteur',
  'transformateur': 'transformateur',
  'transfo': 'transformateur',
  'transformer': 'transformateur',
  'climatisation': 'climatisation',
  'clim': 'climatisation',
  'climat': 'climatisation',
  'climatisation': 'climatisation',
  'refrigerateur': 'réfrigérateur',
  'frigo': 'réfrigérateur',
  'refrig': 'réfrigérateur',
  'valve': 'valve',
  'valv': 'valve',
  'vann': 'vanne', // valve -> vanne
  'robinet': 'robinet',
  'robinet': 'robinet',
  'robine': 'robinet',

  // Arabic transliterations (common in Algeria)
  'لوح': 'panneau', // loha
  'شمسية': 'solaire', // shamsiya
  'مضخة': 'pompe', // madkha
  'اسمنت': 'ciment', // siment
  'حديد': 'acier', // hadid
};

// Query expansion rules - synonyms and related terms
const QUERY_EXPANSIONS: Record<string, string[]> = {
  'panneau solaire': ['plaque photovoltaïque', 'module PV', 'énergie solaire', 'cellule solaire'],
  'pompe': ['pompe à eau', 'pompes industrielles', 'hydraulique', 'pompe immergée'],
  'acier': ['fer', 'métal', 'tôle acier', 'profilé', 'ferraille'],
  'ciment': ['matériaux construction', 'béton', 'mortier', 'chaux', 'plâtre'],
  'engrais': ['engrais agricole', 'fertilisant', 'produit phytosanitaire', 'amendement'],
  'câble': ['fil électrique', 'conducteur', 'câblage', 'installation électrique'],
  'moteur': ['moteur électrique', 'moteur diesel', 'moteur thermique', 'alternateur'],
  'climatisation': ['climatiseur', 'air conditionné', 'ventilation', 'refroidissement'],
  'réfrigérateur': ['frigo', 'congélateur', 'cold room', 'chambre froide'],
  'tube': ['tuyau', 'conduit', 'tuyauterie', 'pipe', 'profilé creux'],
  'transformateur': ['transformateur électrique', 'poste transformation', 'alimentation'],
  'outils': ['équipement', 'matériel', 'instrument', 'accessoire bricolage'],
  'construction': ['bâtiment', 'btp', 'génie civil', 'maçonnerie'],
};

// Blacklisted words (stop words to ignore)
const STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'en', 'et', 'à', 'au',
  'aux', 'ce', 'ces', 'cette', 'dans', 'sur', 'pour', 'par', 'avec', 'sans',
  'sous', 'est', 'son', 'sa', 'ses', 'qui', 'que', 'quoi', 'dont', 'où',
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'mon',
  'ton', 'notre', 'votre', 'leur', 'mes', 'tes', 'nos', 'vos', 'leurs',
  'plus', 'moins', 'très', 'bien', 'mal', 'pas', 'ne', 'ni', 'ou', 'donc',
  'car', 'mais', 'or', 'si', 'comme', 'quand', 'comment', 'pourquoi', 'combien',
  'chercher', 'cherche', 'recherche', 'trouver', 'vouloir', 'avoir', 'faire',
  'prix', 'cout', 'coût', 'achat', 'acheter', 'vendre', 'vente', 'bon',
  'marché', 'marketplace', 'algeria', 'algerie', 'algérie', 'dz', 'alger',
]);

export interface Suggestion {
  text: string;
  type: 'popular' | 'history' | 'trending' | 'correction';
  count?: number;
}

export interface SearchResult {
  product: any; // Product with relations
  score: number;
  matchType: 'exact' | 'partial' | 'expanded' | 'category';
}

class SearchEnhancer {
  /**
   * Correct spelling in search query
   */
  correctSpelling(query: string): { corrected: string; wasCorrected: boolean } {
    const words = query.toLowerCase().split(/\s+/);
    let wasCorrected = false;
    
    const correctedWords = words.map(word => {
      const cleanWord = word.replace(/[^a-zàâäéèêëïîôùûüçœæ]/gi, '');
      
      if (SPELL_CORRECTIONS[cleanWord] && SPELL_CORRECTIONS[cleanWord] !== cleanWord) {
        wasCorrected = true;
        return SPELL_CORRECTIONS[cleanWord];
      }
      
      return word;
    });

    return {
      corrected: correctedWords.join(' '),
      wasCorrected,
    };
  }

  /**
   * Expand query with synonyms and related terms
   */
  expandQuery(query: string): string[] {
    const expansions: string[] = [query];
    const lowerQuery = query.toLowerCase();

    for (const [key, synonyms] of Object.entries(QUERY_EXPANSIONS)) {
      if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
        expansions.push(...synonyms);
        break; // Only expand on first match
      }
    }

    // Also check individual words
    const words = lowerQuery.split(/\s+/).filter(w => !STOP_WORDS.has(w));
    for (const word of words) {
      if (QUERY_EXPANSIONS[word]) {
        expansions.push(...QUERY_EXPANSIONS[word]);
      }
    }

    return [...new Set(expansions)]; // Remove duplicates
  }

  /**
   * Get autocomplete suggestions
   */
  async getSuggestions(
    partial: string,
    userId?: string,
    limit: number = 8
  ): Promise<Suggestion[]> {
    if (!partial || partial.length < 2) return [];

    const suggestions: Suggestion[] = [];
    const lowerPartial = partial.toLowerCase();

    try {
      // 1. Get popular searches matching partial
      const popularSearches = await db.searchTerm.findMany({
        where: {
          term: { contains: lowerPartial },
        },
        orderBy: { searchCount: 'desc' },
        take: Math.ceil(limit / 2),
      });

      popularSearches.forEach(term => {
        suggestions.push({
          text: term.term,
          type: 'popular',
          count: term.searchCount,
        });
      });

      // 2. Get user's recent searches
      if (userId) {
        const recentSearches = await db.userInteraction.findMany({
          where: {
            userId,
            type: 'search',
            searchTerm: { contains: lowerPartial },
          },
          distinct: ['searchTerm'],
          orderBy: { createdAt: 'desc' },
          take: Math.ceil(limit / 3),
        });

        recentSearches.forEach(search => {
          if (search.searchTerm && !suggestions.find(s => s.text === search.searchTerm)) {
            suggestions.push({
              text: search.searchTerm,
              type: 'history',
            });
          }
        });
      }

      // 3. Get product names matching
      const matchingProducts = await db.product.findMany({
        where: {
          OR: [
            { name: { contains: partial } },
            { shortDescription: { contains: partial } },
          ],
          status: 'published',
          isActive: true,
        },
        select: { name: true },
        take: Math.ceil(limit / 3),
      });

      matchingProducts.forEach(product => {
        if (!suggestions.find(s => s.text === product.name)) {
          suggestions.push({
            text: product.name,
            type: 'trending',
          });
        }
      });

      // 4. Check for spelling correction
      const { corrected, wasCorrected } = this.correctSpelling(partial);
      if (wasCorrected && corrected !== partial) {
        suggestions.unshift({
          text: corrected,
          type: 'correction',
        });
      }

    } catch (error) {
      console.error('Error getting suggestions:', error);
    }

    return suggestions.slice(0, limit);
  }

  /**
   * Perform semantic/keyword-enhanced search
   */
  async semanticSearch(
    query: string,
    options?: {
      limit?: number;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      wilaya?: string;
    }
  ): Promise<SearchResult[]> {
    const limit = options?.limit || 20;

    try {
      // First, correct and expand the query
      const { corrected } = this.correctSpelling(query);
      const expandedQueries = this.expandQuery(corrected);

      // Build search conditions
      const searchTerms = [corrected, ...expandedQueries].filter(
        (q, i, arr) => arr.indexOf(q) === i // Unique
      );

      // Create OR conditions for each search term
      const orConditions = searchTerms.flatMap(term => [
        { name: { contains: term } },
        { shortDescription: { contains: term } },
        { description: { contains: term } },
        { sku: { contains: term } },
      ]);

      // Additional filters
      const whereClause: Record<string, unknown> = {
        AND: [
          { status: 'published' },
          { isActive: true },
          { OR: orConditions },
          ...(options?.categoryId ? [{ categoryId: options.categoryId }] : []),
          ...(options?.minPrice ? [{ price: { gte: options.minPrice } }] : []),
          ...(options?.maxPrice ? [{ 
            OR: [
              { price: { lte: options.maxPrice } },
              { priceRangeMax: { lte: options.maxPrice } },
              { price: null }, // Include "sur demande"
            ]
          }] : []),
        ],
      };

      // Execute search
      const products = await db.product.findMany({
        where: whereClause as any,
        include: {
          company: {
            select: { name: true, slug: true, isVerified: true, wilaya: true }
          },
          category: {
            select: { name: true, slug: true }
          },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        take: limit * 2, // Get extra for scoring
      });

      // Score results
      const scoredResults: SearchResult[] = products.map(product => {
        let score = 0;
        let matchType: SearchResult['matchType'] = 'partial';

        const productName = product.name.toLowerCase();
        const productDesc = (product.shortDescription || '').toLowerCase();
        
        // Exact name match
        if (productName === corrected) {
          score = 100;
          matchType = 'exact';
        }
        // Name starts with query
        else if (productName.startsWith(corrected)) {
          score = 90;
          matchType = 'exact';
        }
        // Name contains query
        else if (productName.includes(corrected)) {
          score = 80;
          matchType = 'partial';
        }
        // Description contains query
        else if (productDesc.includes(corrected)) {
          score = 60;
          matchType = 'partial';
        }
        // Expanded term matches
        else {
          for (const expanded of expandedQueries.slice(1)) {
            if (productName.includes(expanded) || productDesc.includes(expanded)) {
              score = 50;
              matchType = 'expanded';
              break;
            }
          }
        }

        // Category bonus
        if (options?.categoryId && product.categoryId === options.categoryId) {
          score += 10;
        }

        // Verified supplier bonus
        if (product.company.isVerified) {
          score += 5;
        }

        // Recent view popularity boost
        if (product.viewCount > 0) {
          score += Math.min(10, Math.log10(product.viewCount));
        }

        return {
          product,
          score: Math.min(100, score),
          matchType,
        };
      });

      // Sort by score and return top results
      return scoredResults
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }

  /**
   * Track search for analytics and improvement
   */
  async trackSearch(
    searchTerm: string,
    resultCount: number,
    options?: {
      userId?: string;
      sessionId?: string;
      referrer?: string;
      deviceType?: 'mobile' | 'desktop' | 'tablet';
    }
  ): Promise<void> {
    try {
      // Update search term stats
      const existingTerm = await db.searchTerm.findUnique({
        where: { term: searchTerm.toLowerCase() },
      });

      if (existingTerm) {
        await db.searchTerm.update({
          where: { term: searchTerm.toLowerCase() },
          data: {
            searchCount: { increment: 1 },
            resultCount,
            lastSearchedAt: new Date(),
          },
        });
      } else {
        await db.searchTerm.create({
          data: {
            term: searchTerm.toLowerCase(),
            searchCount: 1,
            resultCount,
          },
        });
      }

      // Track interaction if userId provided
      if (options?.userId) {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ai/interactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'search',
            searchTerm,
            metadata: { resultCount },
            userId: options.userId,
            sessionId: options.sessionId,
            referrer: options.referrer,
            deviceType: options.deviceType,
          }),
        }).catch(() => {}); // Non-critical
      }
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  /**
   * Get trending/popular search terms
   */
  async getTrendingSearchTerms(limit: number = 10): Promise<Array<{
    term: string;
    count: number;
  }>> {
    try {
      const terms = await db.searchTerm.findMany({
        orderBy: { searchCount: 'desc' },
        take: limit,
      });

      return terms.map(t => ({
        term: t.term,
        count: t.searchCount,
      }));
    } catch (error) {
      console.error('Error getting trending searches:', error);
      return [];
    }
  }
}

// Export singleton instance
export const searchEnhancer = new SearchEnhancer();

// Export class for custom instances
export { SearchEnhancer };
export default SearchEnhancer;
