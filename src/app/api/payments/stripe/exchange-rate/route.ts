// GET /api/payments/stripe/exchange-rate - Get current exchange rates
// Supports DZD to EUR/USD/GBP/CHF/CAD/AUD conversion

import { NextResponse } from 'next/server';
import {
  getExchangeRate,
  getAllExchangeRates,
  convertAmount,
  formatExchangeRate,
  getSupportedCurrencies,
} from '@/lib/payments/exchange-rates';
import type { ExchangeRateResponse } from '@/lib/payments/stripe/types';

// GET /api/payments/stripe/exchange-rate - Get all supported rates
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get specific currency rate
    const targetCurrency = searchParams.get('to');
    const fromCurrency = searchParams.get('from') || 'DZD';
    const amount = searchParams.get('amount');
    
    // If amount is provided, return converted value
    if (amount && targetCurrency) {
      const numericAmount = parseFloat(amount);
      
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid amount parameter' },
          { status: 400 }
        );
      }

      const conversion = await convertAmount(numericAmount, fromCurrency, targetCurrency);
      
      return NextResponse.json({
        success: true,
        conversion: {
          originalAmount: conversion.originalAmount,
          originalCurrency: fromCurrency,
          convertedAmount: conversion.convertedAmount,
          targetCurrency: toCurrency,
          rate: conversion.rate.rate,
          formattedRate: formatExchangeRate(conversion.rate),
          timestamp: new Date(conversion.rate.timestamp).toISOString(),
          source: conversion.rate.source,
        },
      });
    }
    
    // If only target currency is specified, return that specific rate
    if (targetCurrency) {
      const rate = await getExchangeRate(fromCurrency, targetCurrency);
      
      return NextResponse.json({
        success: true,
        rate: {
          from: rate.from,
          to: rate.to,
          value: rate.rate,
          formatted: formatExchangeRate(rate),
          timestamp: new Date(rate.timestamp).toISOString(),
          source: rate.source,
        },
      });
    }

    // Return all rates
    const allRates = await getAllExchangeRates();
    
    // Add formatted versions and supported currencies info
    const response: ExchangeRateResponse & {
      currencies: typeof getSupportedCurrencies extends () => infer T ? T : never;
      formattedRates: Record<string, string>;
    } = {
      ...allRates,
      currencies: getSupportedCurrencies(),
      formattedRates: {},
    };

    // Add formatted rates for each currency
    for (const [key, rate] of Object.entries(allRates.rates)) {
      response.formattedRates[key] = formatExchangeRate(rate);
    }

    return NextResponse.json({
      success: true,
      ...response,
    });

  } catch (error) {
    console.error('[Exchange Rate API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch exchange rates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// OPTIONS /api/payments/stripe/exchange-rate - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
