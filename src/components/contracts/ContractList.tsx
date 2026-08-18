'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Eye,
  Edit3,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import type { Contract, ContractStatus, ContractType } from '@/lib/contracts';

interface ContractListProps {
  contracts: Contract[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  onCreateNew?: () => void;
  onViewContract?: (id: string) => void;
  onEditContract?: (id: string) => void;
  onDownloadPDF?: (id: string) => void;
  currentUserId?: string;
  language?: 'en' | 'ar' | 'fr';
}

const statusConfig: Record<ContractStatus, { color: string; label: string; ar: string; fr: string }> = {
  DRAFT: { color: 'bg-gray-100 text-gray-700', label: 'Draft', ar: 'مسودة', fr: 'Brouillon' },
  REVIEW: { color: 'bg-blue-100 text-blue-700', label: 'Review', ar: 'مراجعة', fr: 'Révision' },
  PENDING_SIGNATURE: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending Signature', ar: 'في انتظار التوقيع', fr: 'En attente' },
  SIGNED: { color: 'bg-green-100 text-green-700', label: 'Signed', ar: 'موقع', fr: 'Signé' },
  ACTIVE: { color: 'bg-emerald-100 text-emerald-700', label: 'Active', ar: 'نشط', fr: 'Actif' },
  EXPIRED: { color: 'bg-gray-100 text-gray-500', label: 'Expired', ar: 'منتهي', fr: 'Expiré' },
  TERMINATED: { color: 'bg-red-100 text-red-700', label: 'Terminated', ar: 'منهي', fr: 'Résilié' },
  VOID: { color: 'bg-slate-100 text-slate-600', label: 'Void', ar: 'باطل', fr: 'Nul' },
};

const typeLabels: Record<ContractType, { label: string; ar: string; fr: string }> = {
  SALES_AGREEMENT: { label: 'Sales Agreement', ar: 'اتفاقية بيع', fr: 'Contrat de vente' },
  SUPPLY_CONTRACT: { label: 'Supply Contract', ar: 'عقد توريد', fr: 'Contrat de fourniture' },
  SERVICE_AGREEMENT: { label: 'Service Agreement', ar: 'اتفاقية خدمات', fr: 'Contrat de prestation' },
  DISTRIBUTION_AGREEMENT: { label: 'Distribution', ar: 'توزيع', fr: 'Distribution' },
  NON_DISCLOSURE: { label: 'NDA', ar: 'عدم إفشاء', fr: 'NDA' },
  EXCLUSIVITY: { label: 'Exclusivity', ar: 'حصرية', fr: 'Exclusivité' },
  FRAMEWORK_AGREEMENT: { label: 'Framework', ar: 'إطار', fr: 'Cadre' },
};

export function ContractList({
  contracts,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onCreateNew,
  onViewContract,
  onEditContract,
  onDownloadPDF,
  language = 'en',
}: ContractListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  // Filter contracts client-side
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = !searchTerm || 
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.subjectAr.includes(searchTerm) ||
      contract.partyA?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.partyB?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesType = typeFilter === 'all' || contract.contractType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            {getLabel('Contracts', 'العقود', 'Contrats')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {total} {getLabel('contracts found', 'عقد موجودة', 'contrats trouvés')}
          </p>
        </div>

        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-1" />
            {getLabel('New Contract', 'عقد جديد', 'Nouveau contrat')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={getLabel('Search contracts...', 'البحث في العقود...', 'Rechercher des contrats...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={getLabel('All Statuses', 'جميع الحالات', 'Tous les statuts')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{getLabel('All Statuses', 'جميع الحالات', 'Tous les statuts')}</SelectItem>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {getLabel(config.label, config.ar, config.fr)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={getLabel('All Types', 'جميع الأنواع', 'Tous les types')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{getLabel('All Types', 'جميع الأنواع', 'Tous les types')}</SelectItem>
                {Object.entries(typeLabels).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {getLabel(config.label, config.ar, config.fr)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table/List */}
      {filteredContracts.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-sm">Contract #</th>
                  <th className="text-left p-3 font-medium text-sm">Type</th>
                  <th className="text-left p-3 font-medium text-sm">Subject</th>
                  <th className="text-left p-3 font-medium text-sm">Parties</th>
                  <th className="text-left p-3 font-medium text-sm">Value</th>
                  <th className="text-left p-3 font-medium text-sm">Status</th>
                  <th className="text-left p-3 font-medium text-sm">Date</th>
                  <th className="text-right p-3 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <span className="font-mono text-sm font-medium">{contract.contractNumber}</span>
                      <br />
                      <span className="text-xs text-muted-foreground">v{contract.version}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {getLabel(
                          typeLabels[contract.contractType]?.label || '',
                          typeLabels[contract.contractType]?.ar || '',
                          typeLabels[contract.contractType]?.fr || ''
                        )}
                      </Badge>
                    </td>
                    <td className="p-3 max-w-[200px]">
                      <p className="text-sm truncate">{contract.subject}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs">{contract.partyA?.companyName}</p>
                      <p className="text-xs text-muted-foreground">→</p>
                      <p className="text-xs">{contract.partyB?.companyName}</p>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-sm">
                        {contract.totalValue.toLocaleString()} {contract.currency}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge className={`${statusConfig[contract.status]?.color} text-xs`}>
                        {getLabel(
                          statusConfig[contract.status]?.label || '',
                          statusConfig[contract.status]?.ar || '',
                          statusConfig[contract.status]?.fr || ''
                        )}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {formatDate(contract.createdAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        {onViewContract && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewContract(contract.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {(contract.status === 'DRAFT') && onEditContract && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditContract(contract.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {onDownloadPDF && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownloadPDF(contract.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredContracts.map((contract) => (
              <Card key={contract.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono font-medium text-sm">{contract.contractNumber}</p>
                      <p className="text-xs text-muted-foreground">{contract.subject}</p>
                    </div>
                    <Badge className={`${statusConfig[contract.status]?.color} text-xs`}>
                      {statusConfig[contract.status]?.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Value:</span>{' '}
                      <span className="font-medium">{contract.totalValue.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date:</span>{' '}
                      <span>{formatDate(contract.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                    {onViewContract && (
                      <Button variant="ghost" size="sm" onClick={() => onViewContract(contract.id)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    )}
                    {onDownloadPDF && (
                      <Button variant="ghost" size="sm" onClick={() => onDownloadPDF(contract.id)}>
                        <Download className="h-4 w-4 mr-1" /> PDF
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange?.(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange?.(page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-medium text-lg mb-1">
              {getLabel('No contracts found', 'لا توجد عقود', 'Aucun contrat trouvé')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {getLabel(
                'Create your first contract to get started',
                'أنشأ عقدك الأول للبدء',
                'Créez votre premier contrat pour commencer'
              )}
            </p>
            
            {onCreateNew && (
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Contract
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ContractList;
