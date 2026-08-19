/**
 * GET /api/compliance/rules
 * 
 * Retrieve available compliance rules for AlgeriaTrade.dz
 * Includes rules from all modules: Commercial, Tax, Trade, Privacy, Sanctions
 * 
 * Query parameters:
 * - module: Filter by module (commercial, tax, trade, privacy, sanctions)
 * - category: Filter by category within module
 * - activeOnly: Return only active rules (default: true)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  COMMERCIAL_RULES,
  getCommercialRulesByCategory,
} from '@/lib/compliance/rules/commercial-rules';
import {
  TAX_RULES,
  TVA_RATES,
  IRG_BRACKETS,
  getTaxRulesByCategory,
} from '@/lib/compliance/rules/tax-rules';
import {
  TRADE_RULES,
  PROHIBITED_IMPORTS,
  RESTRICTED_EXPORTS,
  FREE_TRADE_AGREEMENTS,
  getTradeRulesByCategory,
} from '@/lib/compliance/rules/trade-rules';
import {
  PRIVACY_RULES,
  PROTECTED_DATA_CATEGORIES,
  APN_CONTACT,
  getPrivacyRulesByCategory,
} from '@/lib/compliance/rules/data-privacy-rules';
import {
  SANCTIONS_LISTS,
  DEFAULT_RISK_CONFIG,
} from '@/lib/compliance/rules/sanctions-rules';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const module = searchParams.get('module');
  const category = searchParams.get('category');
  const activeOnly = searchParams.get('activeOnly') !== 'false';

  try {
    let rules: Record<string, unknown> = {};

    // Filter by module if specified
    if (!module || module === 'commercial') {
      rules.commercial = {
        count: COMMERCIAL_RULES.filter(r => !activeOnly || r.isActive).length,
        categories: ['registration', 'activity', 'accounting', 'corporate', 'competition'],
        items: category
          ? getCommercialRulesByCategory(category as any)
          : COMMERCIAL_RULES.filter(r => !activeOnly || r.isActive),
      };
    }

    if (!module || module === 'tax') {
      rules.tax = {
        count: TAX_RULES.filter(r => !activeOnly || r.isActive).length,
        categories: ['tva', 'irg', 'ibc', 'taps', 'declaration', 'withholding'],
        tvaRates: TVA_RATES,
        irgBrackets: IRG_BRACKETS,
        items: category
          ? getTaxRulesByCategory(category as any)
          : TAX_RULES.filter(r => !activeOnly || r.isActive),
      };
    }

    if (!module || module === 'trade') {
      rules.trade = {
        count: TRADE_RULES.filter(r => !activeOnly || r.isActive).length,
        categories: ['import', 'export', 'transit', 'origin', 'licensing', 'prohibited'],
        prohibitedImports: PROHIBITED_IMPORTS,
        restrictedExports: RESTRICTED_EXPORTS,
        freeTradeAgreements: FREE_TRADE_AGREEMENTS,
        items: category
          ? getTradeRulesByCategory(category as any)
          : TRADE_RULES.filter(r => !activeOnly || r.isActive),
      };
    }

    if (!module || module === 'privacy') {
      rules.privacy = {
        count: PRIVACY_RULES.filter(r => !activeOnly || r.isActive).length,
        categories: ['consent', 'collection', 'processing', 'storage', 'transfer', 'rights', 'security'],
        protectedCategories: PROTECTED_DATA_CATEGORIES,
        apnContact: APN_CONTACT,
        items: category
          ? getPrivacyRulesByCategory(category as any)
          : PRIVACY_RULES.filter(r => !activeOnly || r.isActive),
      };
    }

    if (!module || module === 'sanctions') {
      rules.sanctions = {
        listsCount: SANCTIONS_LISTS.filter(l => l.isActive).length,
        lists: SANCTIONS_LISTS.filter(l => !activeOnly || l.isActive),
        riskConfig: DEFAULT_RISK_CONFIG,
      };
    }

    // Summary counts
    const summary = {
      totalRules: (
        COMMERCIAL_RULES.filter(r => !activeOnly || r.isActive).length +
        TAX_RULES.filter(r => !activeOnly || r.isActive).length +
        TRADE_RULES.filter(r => !activeOnly || r.isActive).length +
        PRIVACY_RULES.filter(r => !activeOnly || r.isActive).length
      ),
      modules: {
        commercial: COMMERCIAL_RULES.filter(r => !activeOnly || r.isActive).length,
        tax: TAX_RULES.filter(r => !activeOnly || r.isActive).length,
        trade: TRADE_RULES.filter(r => !activeOnly || r.isActive).length,
        privacy: PRIVACY_RULES.filter(r => !activeOnly || r.isActive).length,
        sanctions: SANCTIONS_LISTS.filter(l => !activeOnly || l.isActive).length,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        rules,
        summary,
        legalFramework: {
          jurisdiction: 'Algeria (DZ)',
          primaryLaws: [
            {
              name: 'Code de Commerce',
              citation: 'Ordonnance 75-59 du 26 septembre 1975',
              joReference: 'J.O N° 78 du 30 septembre 1975',
              modifications: 'Loi 18-18 du 11 juin 2018',
            },
            {
              name: 'Code des Impôts Directs et Taxes Assimilées (CIDTA)',
              citation: 'J.O N° 84 du 20 décembre 1991',
            },
            {
              name: 'Code TVA (Taxe sur la Valeur Ajoutée)',
              citation: 'Ordonnance 76-147 du 17 novembre 1976',
              joReference: 'J.O N° 87 du 24 novembre 1976',
            },
            {
              name: 'Loi Protection des Données Personnelles',
              citation: 'Loi 18-07 du 10 juin 2018',
              joReference: 'J.O N° 44 du 13 juin 2018',
              authority: 'APN (Autorité de Protection des Données)',
            },
            {
              name: 'Loi Commerce Extérieur',
              citation: 'Loi 03-01 du 17 février 2003',
              joReference: 'J.O N° 12 du 18 février 2003',
              authority: 'Algemex / CNAC',
            },
          ],
        },
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get rules error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
