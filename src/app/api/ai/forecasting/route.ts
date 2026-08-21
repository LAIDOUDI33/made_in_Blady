/**
 * AI Demand Forecasting API Endpoint
 * GET /api/ai/forecasting
 * 
 * Query Parameters:
 * - category: Product category (optional, defaults to 'All')
 * - region: Region/wilaya (optional, defaults to 'Algeria')
 * - days: Number of days to forecast (optional, defaults to 90)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateDemandForecast,
  generateMultiCategoryForecast,
  type DemandForecast,
} from '@/lib/ai/business-intelligence';

// Available categories for forecasting
const AVAILABLE_CATEGORIES = [
  'Agriculture & Food',
  'Construction Materials',
  'Electronics & Technology',
  'Textiles & Apparel',
  'Machinery & Equipment',
  'Chemicals',
  'Automotive Parts',
  'Pharmaceuticals',
  'Metal Products',
  'Packaging & Printing',
  'Energy & Fuel',
  'Furniture & Home',
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category') || 'All';
    const region = searchParams.get('region') || 'Algeria';
    const days = parseInt(searchParams.get('days') || '90', 10);
    
    // Validate parameters
    if (days < 7 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 7 and 365' },
        { status: 400 }
      );
    }

    let forecastData: DemandForecast | Map<string, DemandForecast>;

    if (category === 'All' || !category) {
      // Generate forecasts for all categories
      const categories = AVAILABLE_CATEGORIES.slice(0, 6); // Top 6 categories
      const forecasts = generateMultiCategoryForecast(categories, region);
      
      // Convert Map to array for JSON response
      const forecastArray = Array.from(forecasts.entries()).map(([cat, data]) => ({
        category: cat,
        ...data,
        // Trim data arrays based on requested days
        historicalData: data.historicalData.slice(-Math.min(90, days)),
        forecastData: data.forecastData.slice(0, days),
      }));

      return NextResponse.json({
        success: true,
        type: 'multi-category',
        region,
        forecastDays: days,
        generatedAt: new Date().toISOString(),
        data: forecastArray,
        summary: {
          totalCategories: forecastArray.length,
          avgGrowthRate: forecastArray.reduce((sum, f) => 
            sum + ((f.forecast90Days - f.currentDemand) / f.currentDemand), 0
          ) / forecastArray.length,
          highestGrowthCategory: forecastArray.sort((a, b) => 
            (b.forecast90Days / b.currentDemand) - (a.forecast90Days / a.currentDemand)
          )[0]?.category,
        },
      });
    } else {
      // Generate single category forecast
      if (!AVAILABLE_CATEGORIES.some(c => c.toLowerCase().includes(category.toLowerCase()))) {
        return NextResponse.json(
          { error: `Invalid category. Available: ${AVAILABLE_CATEGORIES.join(', ')}` },
          { status: 400 }
        );
      }

      forecastData = generateDemandForecast(category, region);

      // Trim data based on requested days
      const singleForecast = forecastData as DemandForecast;
      singleForecast.historicalData = singleForecast.historicalData.slice(-Math.min(90, days));
      singleForecast.forecastData = singleForecast.forecastData.slice(0, days);

      return NextResponse.json({
        success: true,
        type: 'single-category',
        category,
        region,
        forecastDays: days,
        generatedAt: new Date().toISOString(),
        data: singleForecast,
        insights: {
          trendDirection: singleForecast.trend,
          confidenceLevel: singleForecast.confidence > 0.8 ? 'high' : singleForecast.confidence > 0.6 ? 'medium' : 'low',
          seasonalityImpact: singleForecast.seasonalityFactor > 0.2 ? 'significant' : 'moderate',
          projectedGrowth: ((singleForecast.forecast90Days - singleForecast.currentDemand) / singleForecast.currentDemand * 100).toFixed(1) + '%',
        },
      });
    }
  } catch (error) {
    console.error('Forecasting API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate demand forecast',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle POST for custom forecasting requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { categories, region, historicalData, customParameters } = body;

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'categories array is required' },
        { status: 400 }
      );
    }

    // Generate forecasts for specified categories
    const targetRegion = region || 'Algeria';
    const forecasts = generateMultiCategoryForecast(categories, targetRegion);

    const result = Array.from(forecasts.entries()).map(([cat, data]) => ({
      category: cat,
      currentDemand: data.currentDemand,
      forecast30Days: data.forecast30Days,
      forecast60Days: data.forecast60Days,
      forecast90Days: data.forecast90Days,
      confidence: data.confidence,
      trend: data.trend,
      seasonalityFactor: data.seasonalityFactor,
    }));

    return NextResponse.json({
      success: true,
      type: 'custom-forecast',
      region: targetRegion,
      generatedAt: new Date().toISOString(),
      data: result,
      parameters: customParameters || {},
    });
  } catch (error) {
    console.error('Custom Forecasting API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate custom forecast',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
