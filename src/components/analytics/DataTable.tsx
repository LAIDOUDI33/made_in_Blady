'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ExternalLink,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  className?: string;
  width?: string;
}

interface DataTableProps<T> {
  title?: string;
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  showPagination?: boolean;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  className?: string;
  isLoading?: boolean;
  showExport?: boolean;
  trendKey?: string; // Key to use for trend indicators
}

type SortDirection = 'asc' | 'desc' | null;

// ============================================
// Trend Indicator Component
// ============================================

function TrendIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center text-green-600 dark:text-green-400">
        <ArrowUpRight className="h-4 w-4 mr-0.5" />
        <span className="text-xs font-medium">+{value.toFixed(1)}%</span>
      </span>
    );
  }
  
  if (value < 0) {
    return (
      <span className="inline-flex items-center text-red-600 dark:text-red-400">
        <ArrowDownRight className="h-4 w-4 mr-0.5" />
        <span className="text-xs font-medium">{value.toFixed(1)}%</span>
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center text-muted-foreground">
      <Minus className="h-4 w-4 mr-0.5" />
      <span className="text-xs">0%</span>
    </span>
  );
}

// ============================================
// Main DataTable Component
// ============================================

export function DataTable<T extends Record<string, unknown>>({
  title,
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'Rechercher...',
  pageSize = 10,
  showPagination = true,
  onRowClick,
  emptyMessage = 'Aucune donnée disponible',
  className,
  isLoading = false,
  showExport = false,
  trendKey,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data by search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      // Handle numeric values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // Handle string values
      const aStr = String(aVal ?? '').toLowerCase();
      const bStr = String(bVal ?? '').toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr, 'fr');
      }
      return bStr.localeCompare(aStr, 'fr');
    });
  }, [filteredData, sortKey, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort click
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Export to CSV
  const handleExport = () => {
    const headers = columns.map(c => c.header);
    const rows = sortedData.map(row =>
      columns.map(c => {
        const val = row[c.key];
        return typeof val === 'string' && val.includes(',') 
          ? `"${val}"` 
          : String(val ?? '');
      })
    );
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title?.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ChevronsUpDown className="h-4 w-4 opacity-40" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="h-4 w-4" />;
    }
    return <ChevronDown className="h-4 w-4" />;
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        {(title || searchable) && (
          <CardHeader>
            <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      {/* Header */}
      {(title || searchable || showExport) && (
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {title && <CardTitle className="text-base font-semibold">{title}</CardTitle>}
            
            <div className="flex items-center gap-2">
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 w-[200px] md:w-[280px]"
                  />
                </div>
              )}
              
              {showExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  aria-label="Exporter"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      {/* Table */}
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      col.sortable && 'cursor-pointer select-none hover:bg-muted/50',
                      col.className
                    )}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.header}</span>
                      {col.sortable && getSortIcon(col.key)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    className={cn(
                      onRowClick && 'cursor-pointer hover:bg-muted/50 transition-colors'
                    )}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        {col.render ? (
                          col.render(row[col.key], row, index)
                        ) : (
                          <>
                            {trendKey === col.key && typeof row[col.key] === 'number' ? (
                              <TrendIndicator value={row[col.key] as number} />
                            ) : (
                              String(row[col.key] ?? '-')
                            )}
                          </>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Affichage de {(currentPage - 1) * pageSize + 1} à{' '}
              {Math.min(currentPage * pageSize, sortedData.length)} sur{' '}
              {sortedData.length} résultats
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DataTable;
