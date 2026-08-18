// GET /api/payments/crypto/rates
// Get current cryptocurrency exchange rates and related info

import { NextResponse } from 'next/server'
import {
  getAllExchangeRates,
  getExchangeRate,
  getRateCacheStats,
  SupportedCrypto,
} from '@/lib/payments/crypto/exchange-rates'
import {
  cryptoConfig,
  cryptoMetadata,
  networkFeeEstimates,
  getAvailableNetworks,
  getRequiredConfirmations,
} from '@/lib/payments/crypto/config'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    const crypto = searchParams.get('crypto') as SupportedCrypto | null

    // If specific crypto requested
    if (crypto && cryptoConfig.supportedCryptos.includes(crypto)) {
      const rate = await getExchangeRate(crypto, forceRefresh)
      
      return NextResponse.json({
        success: true,
        data: {
          cryptocurrency: crypto,
          ...rate,
          metadata: cryptoMetadata[crypto],
          networks: getAvailableNetworks(crypto).map(net => ({
            name: net,
            feeEstimate: networkFeeEstimates[crypto]?.[net],
            requiredConfirmations: getRequiredConfirmations(crypto, net),
          })),
        },
      })
    }

    // Get all rates
    const ratesMap = await getAllExchangeRates(forceRefresh)
    const rates: Record<string, any> = {}
    
    for (const [code, rate] of ratesMap.entries()) {
      rates[code] = {
        rateToDZD: rate.rateToDZD,
        rateToUSD: rate.rateToUSD,
        source: rate.source,
        fetchedAt: rate.fetchedAt,
        expiresAt: rate.expiresAt,
        metadata: cryptoMetadata[code],
        networks: getAvailableNetworks(code).map(net => ({
          name: net,
          feeEstimate: networkFeeEstimates[code]?.[net],
          requiredConfirmations: getRequiredConfirmations(code, net),
          recommended: networkFeeEstimates[code]?.[net]?.recommended || false,
        })),
      }
    }

    // Get cache stats
    const cacheStats = getRateCacheStats()

    return NextResponse.json({
      success: true,
      data: {
        rates,
        supportedCryptos: cryptoConfig.supportedCryptos,
        baseCurrency: 'DZD',
        cacheInfo: {
          ttlSeconds: cryptoConfig.cacheTTL,
          entriesCount: cacheStats.size,
        },
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching crypto rates:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch exchange rates' 
      },
      { status: 500 }
    )
  }
}
