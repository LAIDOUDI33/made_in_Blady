/**
 * Netlify Function - Webhook Handler
 * 
 * Gère les webhooks entrants pour :
 * - Notifications de paiement (CIB, CCP, BaridiMob)
 * - Webhooks email (Resend, SendGrid)
 * - Notifications de service tiers
 */

import { Handler } from '@netlify/functions';

// Types de webhooks supportés
type WebhookType = 
  | 'payment-cib'
  | 'payment-ccp'
  | 'payment-baridimob'
  | 'email-event'
  | 'custom';

interface WebhookPayload {
  type: WebhookType;
  data: Record<string, any>;
  timestamp: string;
  signature?: string;
}

// Secrets pour la vérification des signatures
const WEBHOOK_SECRETS = {
  baridimob: process.env.BARIDIMOB_WEBHOOK_SECRET,
  resend: process.env.RESEND_WEBHOOK_SECRET,
};

/**
 * Handler principal des webhooks
 */
export const handler: Handler = async (event) => {
  // Seules les méthodes POST sont acceptées
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parser le body
    const payload: WebhookPayload = JSON.parse(event.body || '{}');
    
    console.log(`[Webhook] Received: ${payload.type}`);

    // Router vers le handler approprié
    switch (payload.type) {
      case 'payment-baridimob':
        return handleBaridiMobWebhook(payload);
      
      case 'payment-cib':
        return handleCIBWebhook(payload);
        
      case 'payment-ccp':
        return handleCCPWebhook(payload);
        
      case 'email-event':
        return handleEmailWebhook(payload);
        
      default:
        return handleCustomWebhook(payload);
    }

  } catch (error) {
    console.error('[Webhook] Parse error:', error);
    
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid JSON payload',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Handler pour les webhooks BaridiMob
 */
async function handleBaridiMobWebhook(payload: WebhookPayload) {
  // TODO: Vérifier la signature du webhook
  // const isValidSignature = verifySignature(
  //   event.headers['x-baridimob-signature'],
  //   event.body,
  //   WEBHOOK_SECRETS.baridimob
  // );
  
  console.log('[BaridiMob] Payment notification:', payload.data);

  // Traiter la notification de paiement
  const { transactionId, status, amount } = payload.data;

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'BaridiMob webhook processed',
      transactionId,
      status,
    }),
  };
}

/**
 * Handler pour les webhooks CIB
 */
async function handleCIBWebhook(payload: WebhookPayload) {
  console.log('[CIB] Payment notification:', payload.data);

  const { orderId, paymentStatus, reference } = payload.data;

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'CIB webhook processed',
      orderId,
      paymentStatus,
      reference,
    }),
  };
}

/**
 * Handler pour les webhooks CCP
 */
async function handleCCPWebhook(payload: WebhookPayload) {
  console.log('[CCP] Transfer notification:', payload.data);

  const { transferId, status, accountNumber } = payload.data;

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'CCP webhook processed',
      transferId,
      status,
    }),
  };
}

/**
 * Handler pour les webhooks email
 */
async function handleEmailWebhook(payload: WebhookPayload) {
  console.log('[Email] Event:', payload.data);

  const { event, messageId, recipient } = payload.data;

  // Tracker les événements email (delivered, bounced, opened, etc.)
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'Email event processed',
      event,
      messageId,
    }),
  };
}

/**
 * Handler pour les webhooks personnalisés
 */
async function handleCustomWebhook(payload: WebhookPayload) {
  console.log('[Custom] Webhook received:', payload);

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'Custom webhook received',
      timestamp: new Date().toISOString(),
    }),
  };
}

/**
 * Vérifier la signature d'un webhook (HMAC-SHA256)
 */
function verifySignature(signature: string, payload: string, secret: string | undefined): boolean {
  if (!secret) {
    console.warn('[Webhook] No secret configured, skipping verification');
    return true; // En développement, on accepte tout
  }

  // Implémentation HMAC-SHA256
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
