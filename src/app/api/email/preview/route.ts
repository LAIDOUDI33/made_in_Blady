/**
 * Email Preview API Route
 * 
 * GET /api/email/preview?type=welcome_buyer&...
 * Returns HTML for email template preview.
 * 
 * @module api/email/preview
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  welcomeBuyerTemplate,
  welcomeSupplierTemplate,
  emailVerificationTemplate,
  passwordResetTemplate,
  newRFQTemplate,
  quotationReceivedTemplate,
  orderConfirmedTemplate,
  orderShippedTemplate,
  companyVerificationTemplate,
} from '@/lib/email/templates';

// Sample data for previews
const sampleData: Record<string, any> = {
  welcome_buyer: {
    firstName: 'Ahmed',
    email: 'ahmed@example.com',
    loginUrl: 'https://algeriatrade.dz/login',
    profileUrl: 'https://algeriatrade.dz/dashboard/buyer/profile',
    helpUrl: 'https://algeriatrade.dz/aide',
  },
  welcome_supplier: {
    firstName: 'Karim',
    companyName: 'Technologie Plus SARL',
    email: 'karim@technologieplus.dz',
    loginUrl: 'https://algeriatrade.dz/login',
    companyUrl: 'https://algeriatrade.dz/dashboard/seller/company',
    productsUrl: 'https://algeriatrade.dz/dashboard/seller/products/new',
    helpUrl: 'https://algeriatrade.dz/aide/vendeur',
  },
  email_verification: {
    firstName: 'Ahmed',
    email: 'ahmed@example.com',
    verificationUrl: 'https://algeriatrade.dz/api/auth/verify-email?token=sample-token-12345',
    verificationCode: '123456',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  },
  password_reset: {
    firstName: 'Ahmed',
    email: 'ahmed@example.com',
    resetUrl: 'https://algeriatrade.dz/reset-password?token=reset-token-12345',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    requestIp: '196.3.100.123',
    requestTime: new Date(),
  },
  new_rfq: {
    supplierName: 'Technologie Plus SARL',
    rfqTitle: 'Fourniture de matériel informatique - 50 unités',
    rfqDescription: 'Nous recherchons un fournisseur pour l\'acquisition de 50 ordinateurs portables pour notre entreprise. Configuration minimum : Intel i5, 8GB RAM, 256GB SSD. Livraison souhaitée à Alger.',
    category: 'Informatique & Électronique',
    quantity: 50,
    unit: 'unités',
    buyerLocation: 'Alger (16)',
    requiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    rfqUrl: 'https://algeriatrade.dz/rfqs/sample-rfq-id',
    respondUrl: 'https://algeriatrade.dz/dashboard/seller/rfqs/sample-rfq-id',
  },
  quotation_received: {
    buyerName: 'Ahmed',
    supplierName: 'Technologie Plus SARL',
    supplierRating: 4.8,
    supplierReviewCount: 124,
    isVerified: true,
    rfqTitle: 'Fourniture de matériel informatique - 50 unités',
    totalPrice: 2750000,
    currency: 'DZD',
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    quotationUrl: 'https://algeriatrade.dz/dashboard/buyer/quotations/sample-id',
    acceptUrl: 'https://algeriatrade.dz/api/quotations/sample-id/accept',
    rejectUrl: 'https://algeriatrade.dz/api/quotations/sample-id/reject',
    messagesUrl: 'https://algeriatrade.dz/dashboard/messages/conversation-id',
  },
  order_confirmed: {
    buyerName: 'Ahmed',
    orderNumber: 'ORD-2024-001234',
    supplierName: 'Technologie Plus SARL',
    items: [
      { name: 'Ordinateur Portable Dell Latitude 5540', quantity: 10, unitPrice: 150000, totalPrice: 1500000 },
      { name: 'Écran Dell 27" 4K', quantity: 10, unitPrice: 45000, totalPrice: 450000 },
      { name: 'Clavier Sans Fil Logitech MX Keys', quantity: 20, unitPrice: 12000, totalPrice: 240000 },
      { name: 'Souris Sans Fil Logitech MX Master 3', quantity: 20, unitPrice: 14000, totalPrice: 280000 },
    ],
    subtotal: 2470000,
    taxAmount: 123500,
    shippingCost: 25000,
    totalAmount: 2618500,
    currency: 'DZD',
    expectedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    deliveryAddress: '123 Rue Didouche Mourad, Centre-Ville',
    deliveryWilaya: 'Alger (16)',
    supplierContact: 'contact@technologieplus.dz',
    orderUrl: 'https://algeriatrade.dz/dashboard/buyer/orders/order-id',
  },
  order_shipped: {
    buyerName: 'Ahmed',
    orderNumber: 'ORD-2024-001234',
    supplierName: 'Technologie Plus SARL',
    carrierName: 'Algerie Poste Express',
    trackingNumber: 'AP123456789DZ',
    trackingUrl: 'https://tracking.algerieposte.dz/AP123456789DZ',
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    itemsCount: 4,
    orderUrl: 'https://algeriatrade.dz/dashboard/buyer/orders/order-id',
  },
  company_verification_approved: {
    userName: 'Karim',
    companyName: 'Technologie Plus SARL',
    isApproved: true,
    dashboardUrl: 'https://algeriatrade.dz/dashboard/seller',
  },
  company_verification_rejected: {
    userName: 'Karim',
    companyName: 'Technologie Plus SARL',
    isApproved: false,
    rejectionReason: 'Le document NIF fourni est illisible ou incomplet. Veuillez soumettre une copie claire et lisible de votre Numéro d\'Identification Fiscale délivré par la DGI.',
    resubmitUrl: 'https://algeriatrade.dz/dashboard/seller/company',
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({
        error: 'Le paramètre "type" est requis',
        availableTypes: Object.keys(sampleData).map(t => t.replace('_', '-')),
      }, { status: 400 });
    }

    // Convert type format (kebab-case to camelCase for template functions)
    const typeKey = type.replace(/-/g, '_');
    
    let html = '';
    let text = '';
    
    switch (typeKey) {
      case 'welcome_buyer':
        ({ html, text } = welcomeBuyerTemplate(sampleData.welcome_buyer));
        break;
        
      case 'welcome_supplier':
        ({ html, text } = welcomeSupplierTemplate(sampleData.welcome_supplier));
        break;
        
      case 'email_verification':
        ({ html, text } = emailVerificationTemplate(sampleData.email_verification));
        break;
        
      case 'password_reset':
        ({ html, text } = passwordResetTemplate(sampleData.password_reset));
        break;
        
      case 'new_rfq':
        ({ html, text } = newRFQTemplate(sampleData.new_rfq));
        break;
        
      case 'quotation_received':
        ({ html, text } = quotationReceivedTemplate(sampleData.quotation_received));
        break;
        
      case 'order_confirmed':
        ({ html, text } = orderConfirmedTemplate(sampleData.order_confirmed));
        break;
        
      case 'order_shipped':
        ({ html, text } = orderShippedTemplate(sampleData.order_shipped));
        break;
        
      case 'company_verification_approved':
        ({ html, text } = companyVerificationTemplate(sampleData.company_verification_approved));
        break;
        
      case 'company_verification_rejected':
        ({ html, text } = companyVerificationTemplate(sampleData.company_verification_rejected));
        break;
        
      default:
        return NextResponse.json({
          error: `Type de template inconnu: ${type}`,
          availableTypes: Object.keys(sampleData).map(t => t.replace('_', '-')),
        }, { status: 404 });
    }

    // Return HTML for preview modal
    const acceptHeader = request.headers.get('accept');
    
    if (acceptHeader?.includes('text/html')) {
      // Return raw HTML for iframe preview
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Return JSON with HTML and metadata
    return NextResponse.json({
      type,
      html,
      text,
      previewUrl: `/api/email/preview?type=${type}&accept=html`,
    });

  } catch (error: any) {
    console.error('Email preview API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du preview' },
      { status: 500 }
    );
  }
}
