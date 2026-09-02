'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  SearchFilters, 
  SearchSuggestion, 
  ALGERIAN_WILAYAS,
  generateSuggestions,
  extractSearchTerms 
} from '@/lib/search/advanced-search';

interface AdvancedSearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  className?: string;
  suggestions?: SearchSuggestion[];
  isLoading?: boolean;
}

export function AdvancedSearchBar({
  onSearch,
  placeholder = 'Rechercher produits, entreprises, services...',
  showFilters = true,
  className = '',
  suggestions = [],
  isLoading = false
}: AdvancedSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedWilaya, setSelectedWilaya] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(() => {
    const searchFilters: SearchFilters = {
      ...filters,
      sortBy: sortBy as SearchFilters['sortBy'],
    };
    
    if (selectedWilaya) {
      searchFilters.wilaya = selectedWilaya;
    }
    if (selectedCategory) {
      searchFilters.category = selectedCategory;
    }
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(v => parseInt(v) * 1000);
      searchFilters.priceMin = min || undefined;
      searchFilters.priceMax = max || undefined;
    }
    
    onSearch(query, searchFilters);
    setShowSuggestions(false);
  }, [query, filters, selectedWilaya, selectedCategory, priceRange, sortBy, onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    onSearch(suggestion.text, filters);
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedWilaya('');
    setSelectedCategory('');
    setPriceRange('');
    setSortBy('relevance');
    setFilters({});
    inputRef.current?.focus();
  };

  const filteredSuggestions = query.length >= 2 
    ? suggestions.filter(s => 
        s.text.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const activeFilterCount = [
    selectedWilaya,
    selectedCategory,
    priceRange,
    sortBy !== 'relevance'
  ].filter(Boolean).length;

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      {/* Main Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="pl-10 pr-10 h-12 text-base"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-accent flex items-center justify-between border-b last:border-b-0"
                >
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span>{suggestion.text}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {suggestion.type === 'product' && 'Produit'}
                      {suggestion.type === 'company' && 'Entreprise'}
                      {suggestion.type === 'category' && 'Catégorie'}
                      {suggestion.type === 'wilaya' && 'Wilaya'}
                    </Badge>
                    {suggestion.count && (
                      <span className="text-xs text-muted-foreground">
                        {suggestion.count} résultats
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Button (Mobile Sheet Trigger) */}
        {showFilters && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 relative">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtres de recherche</SheetTitle>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                {/* Wilaya Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Wilaya</label>
                  <Select value={selectedWilaya} onValueChange={setSelectedWilaya}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les wilayas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les wilayas</SelectItem>
                      {Object.entries(ALGERIAN_WILAYAS).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {code} - {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catégorie</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les catégories</SelectItem>
                      <SelectItem value="electronics">Électronique</SelectItem>
                      <SelectItem value="textile">Textile & Habillement</SelectItem>
                      <SelectItem value="food">Produits Alimentaires</SelectItem>
                      <SelectItem value="machinery">Machines & Équipements</SelectItem>
                      <SelectItem value="construction">Matériaux Construction</SelectItem>
                      <SelectItem value="chemicals">Produits Chimiques</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="services">Services B2B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fourchette de prix (DZD)</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les prix" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les prix</SelectItem>
                      <SelectItem value="0-1000">Moins de 1 000 DZD</SelectItem>
                      <SelectItem value="1-5">1 000 - 5 000 DZD</SelectItem>
                      <SelectItem value="5-10">5 000 - 10 000 DZD</SelectItem>
                      <SelectItem value="10-50">10 000 - 50 000 DZD</SelectItem>
                      <SelectItem value="50-">Plus de 50 000 DZD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trier par</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pertinence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Pertinence</SelectItem>
                      <SelectItem value="price-asc">Prix croissant</SelectItem>
                      <SelectItem value="price-desc">Prix décroissant</SelectItem>
                      <SelectItem value="newest">Plus récent</SelectItem>
                      <SelectItem value="rating">Meilleure note</SelectItem>
                      <SelectItem value="popular">Plus populaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Apply Button */}
                <Button onClick={handleSearch} className="w-full" disabled={isLoading}>
                  {isLoading ? 'Recherche...' : 'Appliquer les filtres'}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Search Button */}
        <Button onClick={handleSearch} className="h-12 px-6" disabled={isLoading}>
          <Search className="h-4 w-4 mr-2" />
          Rechercher
        </Button>
      </div>

      {/* Active Filters Display */}
      {(selectedWilaya || selectedCategory || priceRange) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedWilaya && (
            <Badge variant="secondary" className="gap-1">
              {ALGERIAN_WILAYAS[parseInt(selectedWilaya)] || selectedWilaya}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedWilaya('')}
              />
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              {selectedCategory}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedCategory('')}
              />
            </Badge>
          )}
          {priceRange && (
            <Badge variant="secondary" className="gap-1">
              Prix: {priceRange.replace('-', ' - ')} 000 DZD
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setPriceRange('')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Export sub-components for advanced usage
export { ALGERIAN_WILAYAS };
export type { SearchFilters, SearchSuggestion };
