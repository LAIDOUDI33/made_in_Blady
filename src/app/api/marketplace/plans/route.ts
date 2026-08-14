// API Marketplace Plans Endpoint
// Plans et tarification pour l'API Marketplace

import { NextResponse } from 'next/server';

/**
 * API Plans Configuration
 * Defines available tiers, pricing, and features
 */
const API_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'monthly',
    description: 'For testing and development',
    features: [
      { name: 'API Requests', value: '100/day', included: true },
      { name: 'Access to Products API', value: true, included: true },
      { name: 'Access to Search API', value: true, included: true },
      { name: 'Access to Categories API', value: true, included: true },
      { name: 'Basic Support', value: true, included: true },
      { name: 'Webhooks', value: false, included: false },
      { name: 'Custom Integrations', value: false, included: false },
      { name: 'SLA Guarantee', value: false, included: false },
      { name: 'Dedicated Account Manager', value: false, included: false },
    ],
    limits: {
      requestsPerDay: 100,
      requestsPerMonth: 3000,
      rateLimitWindow: 900000, // 15 minutes
      rateLimitMaxRequests: 20,
      concurrentConnections: 2,
      webhookEndpoints: 0,
    },
    popular: false,
    cta: 'Get Started Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    currency: 'USD',
    interval: 'monthly',
    description: 'For growing businesses and startups',
    features: [
      { name: 'API Requests', value: '10,000/day', included: true },
      { name: 'Access to Products API', value: true, included: true },
      { name: 'Access to Search API', value: true, included: true },
      { name: 'Access to Categories API', value: true, included: true },
      { name: 'Access to Orders API', value: true, included: true },
      { name: 'Access to RFQ API', value: true, included: true },
      { name: 'Priority Support', value: true, included: true },
      { name: 'Webhooks (5 endpoints)', value: true, included: true },
      { name: 'Analytics Dashboard', value: true, included: true },
      { name: 'Custom Integrations', value: false, included: false },
      { name: 'SLA Guarantee (99.5%)', value: false, included: false },
      { name: 'Dedicated Account Manager', value: false, included: false },
    ],
    limits: {
      requestsPerDay: 10000,
      requestsPerMonth: 300000,
      rateLimitWindow: 60000, // 1 minute
      rateLimitMaxRequests: 100,
      concurrentConnections: 10,
      webhookEndpoints: 5,
    },
    popular: true,
    cta: 'Start Pro Trial',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    currency: 'USD',
    interval: 'monthly',
    description: 'For large-scale operations and platforms',
    features: [
      { name: 'API Requests', value: 'Unlimited*', included: true },
      { name: 'Full API Access', value: true, included: true },
      { name: 'All Endpoints', value: true, included: true },
      { name: '24/7 Priority Support', value: true, included: true },
      { name: 'Webhooks (Unlimited)', value: true, included: true },
      { name: 'Advanced Analytics', value: true, included: true },
      { name: 'Custom Integrations', value: true, included: true },
      { name: 'SLA Guarantee (99.9%)', value: true, included: true },
      { name: 'Dedicated Account Manager', value: true, included: true },
      { name: 'Custom SLA Options', value: true, included: true },
      { name: 'On-premise Deployment Option', value: true, included: true },
      { name: 'Training & Onboarding', value: true, included: true },
    ],
    limits: {
      requestsPerDay: -1, // Unlimited
      requestsPerMonth: -1,
      rateLimitWindow: 10000, // 10 seconds
      rateLimitMaxRequests: 1000,
      concurrentConnections: 50,
      webhookEndpoints: -1,
    },
    popular: false,
    cta: 'Contact Sales',
  },
];

/**
 * GET /api/marketplace/plans - Get available API plans
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      plans: API_PLANS,
      metadata: {
        totalPlans: API_PLANS.length,
        defaultPlan: 'free',
        currency: 'USD',
        billingInterval: 'monthly',
        enterpriseContactEmail: 'api-enterprise@algeriatrade.dz',
        documentationUrl: 'https://docs.algeriatrade.dz/api',
        supportUrl: 'https://support.algeriatrade.dz',
      },
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
