/**
 * Netlify Function - API Proxy
 * 
 * Cette fonction sert de proxy pour les routes API Next.js
 * sur la plateforme Netlify.
 * 
 * Utile pour les requêtes qui nécessitent des configurations spéciales
 * ou pour contourner les limitations du plugin Next.js.
 */

import { Handler, Context } from '@netlify/functions';

// Configuration du proxy
const PROXY_CONFIG = {
  // Timeout en millisecondes (augmenté pour l'Algérie)
  timeout: 30000,
  // Headers à transmettre
  forwardHeaders: [
    'content-type',
    'authorization',
    'x-requested-with',
    'accept-language',
  ],
};

/**
 * Handler principal du proxy API
 */
export const handler: Handler = async (event: any, context: Context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: getCorsHeaders(),
      body: '',
    };
  }

  try {
    // Extraire le chemin de l'API
    const path = event.path.replace('/.netlify/functions/api-proxy', '/api');
    
    console.log(`[API Proxy] ${event.httpMethod} ${path}`);

    // Pour les fonctions serverless, on retourne une réponse par défaut
    // Le plugin @netlify/plugin-nextjs gère normalement cela
    
    return {
      statusCode: 200,
      headers: {
        ...getCorsHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'API Proxy - Use @netlify/plugin-nextjs for full API support',
        path,
        method: event.httpMethod,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('[API Proxy] Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...getCorsHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

/**
 * Générer les headers CORS
 */
function getCorsHeaders(): Record<string, string> {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://algeriatrade.dz',
    'https://www.algeriatrade.dz',
    'http://localhost:3000',
  ];

  return {
    'Access-Control-Allow-Origin': allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}
