'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface Session {
  id: string;
  token: string;
  deviceType?: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

interface ActiveSessionsProps {
  userId: string;
}

export default function ActiveSessions({ userId }: ActiveSessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Revoke dialog state
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Fetch sessions
  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/auth/sessions?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Impossible de charger les sessions');
      }
      
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  // Get device icon based on type
  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-blue-500" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-purple-500" />;
      default:
        return <Monitor className="w-5 h-5 text-green-500" />;
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
    });
  };

  // Check if session is expiring soon
  const isExpiringSoon = (expiresAt: string): boolean => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0;
  };

  // Revoke a single session
  const handleRevokeSession = async () => {
    if (!sessionToRevoke) return;

    setRevoking(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId: sessionToRevoke.id,
          revokeAll: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Impossible de révoquer cette session');
      }

      setSuccess('Session révoquée avec succès');
      setSessions(sessions.filter(s => s.id !== sessionToRevoke.id));
      setRevokeDialogOpen(false);
      setSessionToRevoke(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setRevoking(false);
    }
  };

  // Revoke all other sessions
  const handleRevokeAllOthers = async () => {
    setRevoking(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          revokeAll: true,
          keepCurrent: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Impossible de révoquer les autres sessions');
      }

      setSuccess('Toutes les autres sessions ont été révoquées');
      setSessions(sessions.filter(s => s.isCurrent));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setRevoking(false);
    }
  };

  // Parse user agent for better display
  const parseUserAgent = (userAgent?: string): string => {
    if (!userAgent) return 'Appareil inconnu';

    // Simple browser detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
    
    return 'Navigateur web';
  };

  // Detect device type from user agent
  const detectDeviceType = (userAgent?: string): string => {
    if (!userAgent) return 'desktop';
    
    if (/Mobile|Android|iPhone/i.test(userAgent) && !/iPad/i.test(userAgent)) {
      return 'mobile';
    }
    if (/iPad|Tablet/i.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Sessions Actives
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Sessions Actives
            </CardTitle>
            <CardDescription>
              Gérez les appareils connectés à votre compte
            </CardDescription>
          </div>
          
          {/* Revoke All Others Button */}
          {sessions.filter(s => !s.isCurrent).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAllOthers}
              disabled={revoking}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {revoking ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <LogOut className="w-4 h-4 mr-1" />
              )}
              Révoquer les autres
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success/Error Messages */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Sessions Table */}
        {sessions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Appareil</TableHead>
                <TableHead>Emplacement</TableHead>
                <TableHead>Dernière activité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id} className={session.isCurrent ? 'bg-green-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.deviceType || detectDeviceType(session.userAgent))}
                      <div>
                        <p className="font-medium">
                          {session.deviceName || parseUserAgent(session.userAgent)}
                        </p>
                        {session.isCurrent && (
                          <Badge variant="default" className="bg-green-100 text-green-800 text-xs mt-1">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Session actuelle
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      {session.ipAddress || 'Inconnue'}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {formatDate(session.lastActiveAt)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {isExpiringSoon(session.expiresAt) ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        Expire bientôt
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Actif
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {!session.isCurrent && (
                      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSessionToRevoke(session)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Révoquer cette session ?</DialogTitle>
                            <DialogDescription>
                              Êtes-vous sûr de vouloir déconnecter cet appareil ?
                              L&apos;utilisateur devra se reconnecter.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="py-4 space-y-2 text-sm">
                            <p><strong>Appareil :</strong> {sessionToRevoke?.deviceName || parseUserAgent(sessionToRevoke?.userAgent)}</p>
                            <p><strong>IP :</strong> {sessionToRevoke?.ipAddress || 'Inconnue'}</p>
                            <p><strong>Dernière activité :</strong> {sessionToRevoke ? formatDate(sessionToRevoke.lastActiveAt) : ''}</p>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
                              Annuler
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={handleRevokeSession}
                              disabled={revoking}
                            >
                              {revoking ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Révocation...
                                </>
                              ) : (
                                <>
                                  <LogOut className="w-4 h-4 mr-2" />
                                  Révoquer
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {session.isCurrent && (
                      <span className="text-xs text-muted-foreground italic">
                        Impossible de déconnecter
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune session active trouvée</p>
          </div>
        )}

        {/* Security Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4" />
            Conseils de sécurité
          </h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Révoquez les sessions que vous ne reconnaissez pas</li>
            <li>Utilisez la 2FA pour une protection supplémentaire</li>
            <li>Vérifiez régulièrement vos sessions actives</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
