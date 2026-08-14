'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Eye,
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Globe,
} from 'lucide-react';

// Types
interface AuditLogEntry {
  id: string;
  userId: string | null;
  userRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  action: string;
  actionLabel: string;
  resource: string | null;
  resourceId: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: string | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

interface AuditLogStats {
  overview: {
    totalEvents: number;
    failedEvents: number;
    successRate: number;
    todayEvents: number;
    todayFailedEvents: number;
  };
  actionBreakdown: Array<{ action: string; count: number }>;
  mostActiveUsers: Array<{
    userId: string;
    userRole: string | null;
    userName: string;
    userEmail: string;
    eventCount: number;
  }>;
  recentFailedAttempts: AuditLogEntry[];
  charts: {
    eventsPerDay: Array<{ date: string; count: number }>;
    failedByHour: Array<{ hour: number; label: string; count: number }>;
  };
}

export default function AdminAuditLogsPage() {
  // State
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [successFilter, setSuccessFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const pageSize = 20;
  
  // Detail dialog
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      });
      
      if (searchQuery) params.set('search', searchQuery);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (successFilter !== 'all') params.set('success', String(successFilter === 'success'));
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      
      const response = await fetch(`/api/admin/security/audit-logs?${params}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Erreur lors du chargement');
      
      setLogs(data.logs);
      setTotalLogs(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, actionFilter, successFilter, startDate, endDate]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      
      const response = await fetch(`/api/admin/security/audit-logs/statistics?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch('/api/admin/security/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, filters: {} }),
      });
      
      if (response.ok && format === 'csv') {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Erreur lors de l\'export');
    }
  };

  // Format date to French locale
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('fr-FR', {
      timeZone: 'Africa/Algiers',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get action icon and color
  const getActionStyle = (action: string): { color: string; bg: string } => {
    if (action.includes('auth.') || action.includes('security.')) {
      return { color: 'text-purple-700', bg: 'bg-purple-100' };
    }
    if (action.includes('product.')) {
      return { color: 'text-blue-700', bg: 'bg-blue-100' };
    }
    if (action.includes('order.')) {
      return { color: 'text-green-700', bg: 'bg-green-100' };
    }
    if (action.includes('rfq.') || action.includes('quotation.')) {
      return { color: 'text-orange-700', bg: 'bg-orange-100' };
    }
    if (action.includes('admin.')) {
      return { color: 'text-red-700', bg: 'bg-red-100' };
    }
    return { color: 'text-gray-700', bg: 'bg-gray-100' };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Journaux d'Audit de Sécurité
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez toutes les activités et événements de sécurité sur la plateforme
          </p>
        </div>
        
        <Button variant="outline" onClick={() => handleExport('csv')}>
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Événements</p>
                    <p className="text-2xl font-bold">{stats.overview.totalEvents.toLocaleString()}</p>
                  </div>
                  <Activity className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Échecs</p>
                    <p className="text-2xl font-bold text-red-600">{stats.overview.failedEvents}</p>
                  </div>
                  <XCircle className="w-10 h-10 text-red-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taux de Succès</p>
                    <p className="text-2xl font-bold text-green-600">{stats.overview.successRate}%</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                    <p className="text-2xl font-bold">{stats.overview.todayEvents}</p>
                  </div>
                  <BarChart3 className="w-10 h-10 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Échecs Aujourd'hui</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.overview.todayFailedEvents}</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-orange-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Active Users */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Utilisateurs les Plus Actifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.mostActiveUsers.slice(0, 5).map((user, idx) => (
                    <div key={user.userId} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{user.userName}</p>
                          <p className="text-xs text-muted-foreground">{user.userEmail || user.userId}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{user.eventCount} actions</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Failed Attempts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Tentatives Récentes Échouées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stats.recentFailedAttempts.slice(0, 10).map((log) => (
                    <div 
                      key={log.id} 
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-red-50 cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="text-sm truncate">{log.actionLabel || log.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  ))}
                  {stats.recentFailedAttempts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune tentative échouée récemment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Action Filter */}
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type d'action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="auth.">Authentification</SelectItem>
                <SelectItem value="security.">Sécurité</SelectItem>
                <SelectItem value="product.">Produits</SelectItem>
                <SelectItem value="order.">Commandes</SelectItem>
                <SelectItem value="rfq.">Demandes de devis</SelectItem>
                <SelectItem value="admin.">Administration</SelectItem>
              </SelectContent>
            </Select>

            {/* Success Filter */}
            <Select value={successFilter} onValueChange={(v) => setSuccessFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="failed">Échec</SelectItem>
              </SelectContent>
            </Select>

            {/* Start Date */}
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Date début"
            />

            {/* End Date */}
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Date fin"
            />

            {/* Apply Button */}
            <Button onClick={() => setCurrentPage(1)} className="lg:col-span-5 md:col-span-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Appliquer les filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Journal d'Audit ({totalLogs.toLocaleString()} entrées)
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun journal trouvé pour ces critères</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Heure</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Ressource</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const style = getActionStyle(log.action);
                      
                      return (
                        <TableRow key={log.id} className="cursor-pointer hover:bg-slate-50">
                          <TableCell className="text-sm whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              {formatDate(log.createdAt)}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">
                                  {log.userRole || 'Système'}
                                </p>
                                <p className="text-xs text-muted-foreground max-w-[120px] truncate">
                                  {log.userId?.substring(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant="outline" className={`${style.bg} ${style.color} border-0`}>
                              {log.actionLabel || log.action}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-sm">
                            {log.resource && (
                              <span>{log.resource}{log.resourceId ? `: ${log.resourceId.substring(0, 8)}...` : ''}</span>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-sm">
                            {log.ipAddress && (
                              <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3 text-muted-foreground" />
                                {log.ipAddress}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {log.success ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                OK
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                                <XCircle className="w-3 h-3 mr-1" />
                                Échec
                              </Badge>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Affichage {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalLogs)} sur {totalLogs}
                </p>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm px-3">
                    Page {currentPage} / {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Détails de l'Événement
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur cette entrée du journal
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 mt-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="text-sm font-mono">{selectedLog.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="text-sm">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Action</label>
                  <p className="text-sm">{selectedLog.actionLabel || selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  <p className="text-sm">
                    {selectedLog.success ? (
                      <Badge className="bg-green-100 text-green-800">Succès</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Échec</Badge>
                    )}
                  </p>
                </div>
              </div>

              {/* User Info */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">Utilisateur</label>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p><strong>ID:</strong> {selectedLog.userId || 'N/A'}</p>
                  <p><strong>Rôle:</strong> {selectedLog.userRole || 'N/A'}</p>
                </div>
              </div>

              {/* Resource Info */}
              {(selectedLog.resource || selectedLog.resourceId) && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Ressource</label>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p><strong>Type:</strong> {selectedLog.resource || 'N/A'}</p>
                    <p><strong>ID:</strong> {selectedLog.resourceId || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* IP & User Agent */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">Informations de Connexion</label>
                <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                  <p><strong>Adresse IP:</strong> {selectedLog.ipAddress || 'N/A'}</p>
                  <p className="break-all"><strong>User Agent:</strong> {selectedLog.userAgent || 'N/A'}</p>
                </div>
              </div>

              {/* Error Message */}
              {!selectedLog.success && selectedLog.errorMessage && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Message d'Erreur</label>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}

              {/* Old/New Values (for updates) */}
              {(selectedLog.oldValue || selectedLog.newValue) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.oldValue && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-1">Ancienne Valeur</label>
                      <pre className="p-3 bg-slate-50 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(JSON.parse(selectedLog.oldValue), null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.newValue && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-1">Nouvelle Valeur</label>
                      <pre className="p-3 bg-slate-50 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(JSON.parse(selectedLog.newValue), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Métadonnées</label>
                  <pre className="p-3 bg-slate-50 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
