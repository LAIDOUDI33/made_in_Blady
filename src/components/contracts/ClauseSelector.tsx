'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Plus,
  Check,
  Filter,
  BookOpen,
  Shield,
  DollarSign,
  Truck,
  Scale,
  FileText,
  Users,
  Settings,
  Lock,
} from 'lucide-react';
import type { ContractClause, ClauseCategory } from '@/lib/contracts/config';
import { CLAUSE_CATEGORIES } from '@/lib/contracts/config';

interface ClauseSelectorProps {
  selectedClauses: string[];
  onSelectionChange: (clauseIds: string[]) => void;
  contractType?: string;
  disabled?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  parties: <Users className="w-4 h-4" />,
  'subject-matter': <FileText className="w-4 h-4" />,
  payment: <DollarSign className="w-4 h-4" />,
  delivery: <Truck className="w-4 h-4" />,
  warranty: <Shield className="w-4 h-4" />,
  confidentiality: <Lock className="w-4 h-4" />,
  'dispute-resolution': <Scale className="w-4 h-4" />,
  termination: <Settings className="w-4 h-4" />,
  general: <BookOpen className="w-4 h-4" />,
};

export function ClauseSelector({
  selectedClauses,
  onSelectionChange,
  contractType,
  disabled = false,
}: ClauseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showRequiredOnly, setShowRequiredOnly] = useState(false);

  // Filter clauses based on search and category
  const filteredCategories = useMemo(() => {
    let categories = CLAUSE_CATEGORIES;

    // Filter by category if selected
    if (selectedCategory) {
      categories = categories.filter((c) => c.id === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      categories = categories
        .map((category) => ({
          ...category,
          clauses: category.clauses.filter(
            (clause) =>
              clause.title.toLowerCase().includes(query) ||
              clause.titleAr.includes(query) ||
              clause.titleFr.toLowerCase().includes(query) ||
              clause.content.toLowerCase().includes(query)
          ),
        }))
        .filter((category) => category.clauses.length > 0);
    }

    // Filter required only
    if (showRequiredOnly) {
      categories = categories.map((category) => ({
        ...category,
        clauses: category.clauses.filter((clause) => clause.isRequired),
      }));
    }

    return categories;
  }, [searchQuery, selectedCategory, showRequiredOnly]);

  const toggleClause = (clauseId: string) => {
    if (disabled) return;

    const newSelection = selectedClauses.includes(clauseId)
      ? selectedClauses.filter((id) => id !== clauseId)
      : [...selectedClauses, clauseId];

    onSelectionChange(newSelection);
  };

  const selectAllInCategory = (categoryId: string) => {
    if (disabled) return;

    const category = CLAUSE_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return;

    const categoryClauseIds = category.clauses.map((c) => c.id);
    const newSelection = [
      ...new Set([...selectedClauses, ...categoryClauseIds]),
    ];

    onSelectionChange(newSelection);
  };

  const deselectAllInCategory = (categoryId: string) => {
    if (disabled) return;

    const category = CLAUSE_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return;

    const categoryClauseIds = new Set(category.clauses.map((c) => c.id));
    const newSelection = selectedClauses.filter(
      (id) => !categoryClauseIds.has(id)
    );

    onSelectionChange(newSelection);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar - Categories */}
      <div className="md:w-64 shrink-0">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    !selectedCategory
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  All Categories ({CLAUSE_CATEGORIES.reduce((acc, c) => acc + c.clauses.length, 0)})
                </button>
                {CLAUSE_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                      selectedCategory === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {CATEGORY_ICONS[category.id]}
                    <span>{category.name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {category.clauses.length}
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mt-4">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showRequiredOnly}
                onChange={(e) => setShowRequiredOnly(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Required Only</span>
            </label>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Selected: {selectedClauses.length}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onSelectionChange([])}
                disabled={disabled || selectedClauses.length === 0}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Clauses List */}
      <div className="flex-1 min-w-0">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clauses... / بحث البنود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Clauses by Category */}
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No clauses found</p>
                <p className="text-sm">لا توجد بنود</p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.id}>
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {CATEGORY_ICONS[category.id]}
                      <h3 className="font-semibold">{category.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        ({category.nameAr})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAllInCategory(category.id)}
                        disabled={disabled}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deselectAllInCategory(category.id)}
                        disabled={disabled}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* Clauses in Category */}
                  <div className="space-y-2 ml-6">
                    {category.clauses.map((clause) => {
                      const isSelected = selectedClauses.includes(clause.id);

                      return (
                        <button
                          key={clause.id}
                          onClick={() => toggleClause(clause.id)}
                          disabled={disabled || clause.isRequired}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                              : clause.isRequired
                              ? 'border-amber-200 bg-amber-50'
                              : 'border-border hover:border-primary/30 hover:bg-muted/50'
                          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-primary border-primary'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {clause.title}
                                </span>
                                {clause.isRequired && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs shrink-0"
                                  >
                                    Required
                                  </Badge>
                                )}
                                {!clause.isEditable && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs shrink-0"
                                  >
                                    Locked
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {clause.titleFr}
                              </p>
                              {!isSelected && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {clause.contentFr.substring(0, 150)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default ClauseSelector;
