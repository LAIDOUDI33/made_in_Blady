/**
 * Public Status Page API Endpoint
 * 
 * Endpoint: GET /api/status
 * 
 * Fournit des informations de statut publiques pour :
 * - La page de status publique
 * - Les intégrations avec les services de monitoring
 * - L'affichage du temps de disponibilité
 * 
 * Ce endpoint ne révèle PAS d'informations sensibles.
 */

import { NextResponse } from 'next/server';

// Interface pour les incidents
interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  startedAt: string;
  resolvedAt?: string;
  components: string[];
}

// Interface pour les composants surveillés
interface ComponentStatus {
  name: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  uptime: number; // Pourcentage (0-100)
}

// Interface pour la réponse de statut
interface StatusResponse {
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  timestamp: string;
  version: string;
  environment: string;
  uptime: {
    days: number;
    percentage: number;
    lastIncident?: string;
  };
  components: ComponentStatus[];
  activeIncidents: Incident[];
  recentIncidents: Incident[];
  scheduledMaintenance: MaintenanceWindow[];
}

interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  scheduledFor: string;
  duration: number; // en minutes
  components: string[];
}

/**
 * Incidents récents (en production, cela viendrait d'une base de données)
 */
const INCIDENT_HISTORY: Incident[] = [
  // Exemple d'incident résolu
  {
    id: 'inc-001',
    title: 'Latence élevée sur l\'API de paiement',
    description: 'Des utilisateurs ont signalé des temps de réponse élevés lors des paiements CIB.',
    status: 'resolved',
    severity: 'minor',
    startedAt: '2024-01-15T10:00:00Z',
    resolvedAt: '2024-01-15T11:30:00Z',
    components: ['API Paiements', 'CIB'],
  },
];

/**
 * Fenêtres de maintenance planifiées
 */
const SCHEDULED_MAINTENANCE: MaintenanceWindow[] = [
  // Pas de maintenance planifiée actuellement
];

/**
 * GET /api/status
 * 
 * Retourne le statut public de la plateforme.
 */
export async function GET() {
  const now = new Date();
  
  try {
    // Calculer le uptime (simulé - en prod, utiliser une vraie source)
    const uptimeDays = calculateUptimeDays();
    
    // Déterminer les composants et leur statut
    const components = getComponentsStatus();
    
    // Déterminer le statut global
    const overallStatus = determineOverallStatus(components);
    
    // Filtrer les incidents actifs
    const activeIncidents = INCIDENT_HISTORY.filter(
      inc => inc.status !== 'resolved'
    );
    
    // Récupérer les incidents récents (30 derniers jours)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentIncidents = INCIDENT_HISTORY.filter(
      inc => new Date(inc.startedAt) > thirtyDaysAgo || inc.status !== 'resolved'
    );

    // Construire la réponse
    const statusResponse: StatusResponse = {
      status: overallStatus,
      timestamp: now.toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      uptime: {
        days: uptimeDays,
        percentage: calculateUptimePercentage(),
        lastIncident: INCIDENT_HISTORY.length > 0 
          ? INCIDENT_HISTORY[INCIDENT_HISTORY.length - 1].startedAt 
          : undefined,
      },
      components,
      activeIncidents,
      recentIncidents: recentIncidents.slice(0, 10), // Limiter à 10
      scheduledMaintenance: SCHEDULED_MAINTENANCE.filter(
        m => new Date(m.scheduledFor) > now
      ),
    };

    return NextResponse.json(statusResponse);

  } catch (error) {
    console.error('[Status API] Error:', error);
    
    return NextResponse.json(
      {
        status: 'unknown',
        timestamp: now.toISOString(),
        error: 'Unable to retrieve status information',
      },
      { status: 500 }
    );
  }
}

/**
 * Obtenir le statut de chaque composant
 */
function getComponentsStatus(): ComponentStatus[] {
  // En production, ces valeurs seraient calculées dynamiquement
  // basées sur les health checks, métriques, etc.
  
  return [
    {
      name: 'Site Web & Application',
      status: 'operational',
      uptime: 99.95,
    },
    {
      name: 'API REST',
      status: 'operational',
      uptime: 99.90,
    },
    {
      name: 'Base de Données',
      status: 'operational',
      uptime: 99.99,
    },
    {
      name: 'Service Authentification',
      status: 'operational',
      uptime: 99.98,
    },
    {
      name: 'Service Email',
      status: 'operational',
      uptime: 99.95,
    },
    {
      name: 'Paiement CIB',
      status: 'operational',
      uptime: 99.90,
    },
    {
      name: 'Paiement CCP',
      status: 'operational',
      uptime: 99.85,
    },
    {
      name: 'Paiement BaridiMob',
      status: 'operational',
      uptime: 99.80,
    },
    {
      name: 'Messagerie en Temps Réel',
      status: 'operational',
      uptime: 99.75,
    },
    {
      name: 'Stockage de Fichiers',
      status: 'operational',
      uptime: 99.99,
    },
  ];
}

/**
 * Déterminer le statut global basé sur les composants
 */
function determineOverallStatus(components: ComponentStatus[]): StatusResponse['status'] {
  if (components.some(c => c.status === 'major_outage')) {
    return 'major_outage';
  }
  if (components.some(c => c.status === 'partial_outage')) {
    return 'partial_outage';
  }
  if (components.some(c => c.status === 'degraded')) {
    return 'degraded';
  }
  return 'operational';
}

/**
 * Calculer le nombre de jours depuis la dernière panne majeure
 */
function calculateUptimeDays(): number {
  // En production, utiliser une vraie source de données
  // Ici, on retourne une valeur simulée
  const lastMajorIncident = INCIDENT_HISTORY.find(i => i.severity === 'critical');
  
  if (!lastMajorIncident) {
    // Pas d'incident critique connu, retourner un grand nombre
    return 180; // ~6 mois
  }
  
  const diff = Date.now() - new Date(lastMajorIncident.startedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculer le pourcentage de uptime (sur 90 jours)
 */
function calculateUptimePercentage(): number {
  // En production, calculer basé sur les logs/monitoring
  // Ici, on retourne une valeur réaliste
  return 99.92;
}
