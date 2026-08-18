// CRM Analytics Module
// Sales metrics, conversion rates, revenue forecasting, customer lifetime value, reports generation
// AlgeriaTrade.dz B2B Marketplace - CRM Integration Suite

import { db } from '@/lib/db'
import { ANALYTICS_DEFAULTS } from './config'

// ============================================
// TYPES
// ============================================

export interface DateRange {
  from: Date
  to: Date
}

export interface DashboardMetrics {
  // Contacts
  totalContacts: number
  newContactsThisPeriod: number
  activeContacts: number
  
  // Leads
  totalLeads: number
  newLeadsThisPeriod: number
  qualifiedLeads: number
  leadsBySource: Record<string, number>
  
  // Pipeline/Deals
  totalPipelineValue: number
  weightedPipelineValue: number
  dealsWon: number
  dealsLost: number
  winRate: number
  avgDealSize: number
  revenueThisPeriod: number
  
  // Tasks & Activities
  openTasks: number
  overdueTasks: number
  activitiesThisPeriod: number
  
  // Trends
  contactsTrend: TrendData[]
  leadsTrend: TrendData[]
  revenueTrend: TrendData[]
}

export interface TrendData {
  date: string
  value: number
}

export interface ConversionMetrics {
  overallRate: number
  bySource: Record<string, { total: number; converted: number; rate: number }>
  byMonth: { month: string; rate: number }[]
  avgConversionDays: number
  funnelStages: FunnelStageData[]
}

export interface FunnelStageData {
  stage: string
  count: number
  percentage: number
  value: number
}

export interface RevenueForecast {
  currentMonth: ForecastData
  nextMonth: ForecastData
  quarter: ForecastData
  year: ForecastData
  bySalesPerson: Record<string, ForecastData[]>
  confidenceLevels: {
    conservative: number
    moderate: number
    optimistic: number
  }
}

export interface ForecastData {
  committed: number
  bestCase: number
  pipeline: number
  weighted: number
  actual?: number
}

export interface CLVData {
  averageCLV: number
  byIndustry: Record<string, number>
  byCompanySize: Record<string, number>
  topCustomers: CLVCustomer[]
  retentionRate: number
  avgLifespanMonths: number
}

export interface CLVCustomer {
  customerId: string
  customerName: string
  totalRevenue: number
  purchaseCount: number
  avgOrderValue: number
  firstPurchaseDate: Date
  lastPurchaseDate: Date
  predictedCLV: number
}

export interface SalesReport {
  period: DateRange
  generatedAt: Date
  summary: ReportSummary
  metrics: DashboardMetrics
  conversion: ConversionMetrics
  forecast: RevenueForecast
  clv: CLVData
  recommendations: string[]
}

export interface ReportSummary {
  totalRevenue: number
  revenueChange: number // Percentage change from previous period
  newLeads: number
  leadsChange: number
  winRate: number
  winRateChange: number
  avgDealSize: number
  dealSizeChange: number
}

// ============================================
// DASHBOARD METRICS
// ============================================

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(
  ownerId: string,
  period: '7d' | '30d' | '90d' | '6m' | '12m' = '30d'
): Promise<DashboardMetrics> {
  const dateRange = getDateRange(period)
  
  // Run all queries in parallel for performance
  const [
    allContacts,
    contactsThisPeriod,
    allLeads,
    leadsThisPeriod,
    allDeals,
    wonDeals,
    lostDeals,
    openTasks,
    overdueTasks,
    activitiesThisPeriod,
    contactsByDay,
    leadsByDay,
    wonDealsByMonth,
  ] = await Promise.all([
    // Total contacts
    db.cRMContact.count({ where: { companyId: ownerId } }),
    
    // New contacts this period
    db.cRMContact.count({
      where: {
        companyId: ownerId,
        createdAt: { gte: dateRange.from },
      },
    }),
    
    // All leads (for user)
    db.cRMLead.count({
      where: { assignedTo: ownerId },
    }),
    
    // New leads this period
    db.cRMLead.count({
      where: {
        assignedTo: ownerId,
        createdAt: { gte: dateRange.from },
      },
    }),
    
    // Active pipeline deals (not won/lost)
    db.cRMLead.findMany({
      where: {
        assignedTo: ownerId,
        pipelineStage: { notIn: ['closed_won', 'closed_lost'] },
        notes: { contains: '"type":"deal"' },
      },
    }),
    
    // Won deals
    db.cRMLead.findMany({
      where: {
        assignedTo: ownerId,
        pipelineStage: 'closed_won',
        createdAt: { gte: dateRange.from },
      },
    }),
    
    // Lost deals
    db.cRMLead.findMany({
      where: {
        assignedTo: ownerId,
        pipelineStage: 'closed_lost',
        createdAt: { gte: dateRange.from },
      },
    }),
    
    // Open tasks
    db.cRMTask.count({
      where: {
        assignedTo: ownerId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
      },
    }),
    
    // Overdue tasks
    db.cRMTask.count({
      where: {
        assignedTo: ownerId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
      },
    }),
    
    // Activities this period
    db.cRMInteraction.count({
      where: {
        companyId: ownerId,
        createdAt: { gte: dateRange.from },
      },
    }),
    
    // Contacts by day (for trend)
    getContactsByDay(ownerId, dateRange),
    
    // Leads by day (for trend)
    getLeadsByDay(ownerId, dateRange),
    
    // Won deals by month (for revenue trend)
    getWonDealsByMonth(ownerId, dateRange),
  ])
  
  // Calculate pipeline values
  const totalPipelineValue = allDeals.reduce((sum, d) => sum + d.estimatedValue, 0)
  const weightedPipelineValue = allDeals.reduce(
    (sum, d) => sum + (d.estimatedValue * d.probability / 100),
    0
  )
  
  // Calculate revenue and win rate
  const revenueThisPeriod = wonDeals.reduce((sum, d) => sum + d.estimatedValue, 0)
  const totalClosed = wonDeals.length + lostDeals.length
  const winRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0
  const avgDealSize = wonDeals.length > 0 
    ? revenueThisPeriod / wonDeals.length 
    : 0
  
  // Get leads by source
  const leadsBySource = await getLeadsBySource(ownerId, dateRange)
  
  return {
    totalContacts: allContacts,
    newContactsThisPeriod: contactsThisPeriod,
    activeContacts: allContacts, // Simplified - could filter by last interaction
    
    totalLeads: allLeads,
    newLeadsThisPeriod: leadsThisPeriod,
    qualifiedLeads: await db.cRMLead.count({
      where: {
        assignedTo: ownerId,
        status: 'QUALIFIED',
      },
    }),
    leadsBySource,
    
    totalPipelineValue,
    weightedPipelineValue,
    dealsWon: wonDeals.length,
    dealsLost: lostDeals.length,
    winRate: Math.round(winRate),
    avgDealSize,
    revenueThisPeriod,
    
    openTasks,
    overdueTasks,
    activitiesThisPeriod,
    
    contactsTrend: contactsByDay,
    leadsTrend: leadsByDay,
    revenueTrend: wonDealsByMonth,
  }
}

// ============================================
// CONVERSION METRICS
// ============================================

/**
 * Get detailed conversion metrics
 */
export async function getConversionMetrics(
  ownerId: string,
  dateRange?: DateRange
): Promise<ConversionMetrics> {
  const range = dateRange || getDateRange('12m')
  
  const [allLeads, convertedLeads] = await Promise.all([
    db.cRMLead.findMany({
      where: {
        assignedTo: ownerId,
        createdAt: { gte: range.from },
      },
    }),
    db.cRMLead.findMany({
      where: {
        assignedTo: ownerId,
        status: 'WON',
        createdAt: { gte: range.from },
      },
    }),
  ])
  
  // Overall conversion rate
  const overallRate = allLeads.length > 0 
    ? (convertedLeads.length / allLeads.length) * 100 
    : 0
  
  // By source
  const sourceMap: Record<string, { total: number; converted: number }> = {}
  for (const lead of allLeads) {
    if (!sourceMap[lead.source]) {
      sourceMap[lead.source] = { total: 0, converted: 0 }
    }
    sourceMap[lead.source].total++
  }
  for (const lead of convertedLeads) {
    if (sourceMap[lead.source]) {
      sourceMap[lead.source].converted++
    }
  }
  
  const bySource: Record<string, { total: number; converted: number; rate: number }> = {}
  for (const [source, counts] of Object.entries(sourceMap)) {
    bySource[source] = {
      ...counts,
      rate: counts.total > 0 ? (counts.converted / counts.total) * 100 : 0,
    }
  }
  
  // By month
  const monthMap: Record<string, { total: number; converted: number }> = {}
  for (const lead of allLeads) {
    const month = lead.createdAt.toISOString().slice(0, 7)
    if (!monthMap[month]) monthMap[month] = { total: 0, converted: 0 }
    monthMap[month].total++
  }
  for (const lead of convertedLeads) {
    const month = lead.createdAt.toISOString().slice(0, 7)
    if (monthMap[month]) monthMap[month].converted++
  }
  
  const byMonth = Object.entries(monthMap)
    .map(([month, counts]) => ({
      month,
      rate: counts.total > 0 ? (counts.converted / counts.total) * 100 : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
  
  // Average conversion time
  let totalDays = 0
  let countWithTime = 0
  for (const lead of convertedLeads) {
    if (lead.convertedAt) {
      const days = Math.ceil(
        (new Date(lead.convertedAt).getTime() - new Date(lead.createdAt).getTime()) 
        / (1000 * 60 * 60 * 24)
      )
      if (days > 0 && days < 365) { // Filter outliers
        totalDays += days
        countWithTime++
      }
    }
  }
  const avgConversionDays = countWithTime > 0 ? Math.round(totalDays / countWithTime) : 0
  
  // Funnel stages
  const funnelStages = await getFunnelStages(ownerId)
  
  return {
    overallRate: Math.round(overallRate * 10) / 10,
    bySource,
    byMonth,
    avgConversionDays,
    funnelStages,
  }
}

// ============================================
// REVENUE FORECASTING
// ============================================

/**
 * Get revenue forecast
 */
export async function getRevenueForecast(
  ownerId: string
): Promise<RevenueForecast> {
  const now = new Date()
  
  // Current month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  // Next month
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  
  // Quarter (next 3 months including current)
  const quarterEnd = new Date(now.getFullYear(), now.getMonth() + 3, 0)
  
  // Year
  const yearEnd = new Date(now.getFullYear() + 1, 0, 0)
  
  const [
    currentMonthDeals,
    nextMonthDeals,
    quarterDeals,
    yearDeals,
    historicalWon,
  ] = await Promise.all([
    getActiveDealsInRange(ownerId, currentMonthStart, currentMonthEnd),
    getActiveDealsInRange(ownerId, nextMonthStart, nextMonthEnd),
    getActiveDealsInRange(ownerId, currentMonthStart, quarterEnd),
    getActiveDealsInRange(ownerId, currentMonthStart, yearEnd),
    db.cRMLead.findMany({
      where: {
        assignedTo: ownerId,
        pipelineStage: 'closed_won',
        createdAt: { gte: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()) },
      },
    }),
  ])
  
  // Calculate forecast data
  const calculateForecast = (deals: any[]) => {
    let committed = 0
    let bestCase = 0
    let pipeline = 0
    let weighted = 0
    
    for (const deal of deals) {
      const value = deal.estimatedValue
      const prob = deal.probability / 100
      
      pipeline += value
      weighted += value * prob
      
      if (prob >= 0.7) {
        committed += value
      }
      
      bestCase += value // Assume all close
    }
    
    return { committed, bestCase, pipeline, weighted }
  }
  
  // Historical actuals for current month
  const currentMonthActual = historicalWon
    .filter(d => {
      const closed = d.updatedAt || d.convertedAt
      return closed >= currentMonthStart && closed <= currentMonthEnd
    })
    .reduce((sum, d) => sum + d.estimatedValue, 0)
  
  return {
    currentMonth: {
      ...calculateForecast(currentMonthDeals),
      actual: currentMonthActual,
    },
    nextMonth: calculateForecast(nextMonthDeals),
    quarter: calculateForecast(quarterDeals),
    year: calculateForecast(yearDeals),
    bySalesPerson: {}, // Would need to group by assignee
    confidenceLevels: {
      conservative: calculateForecast(quarterDeals).weighted * 0.8,
      moderate: calculateForecast(quarterDeals).weighted,
      optimistic: calculateForecast(quarterDeals).bestCase * 0.9,
    },
  }
}

// ============================================
// CUSTOMER LIFETIME VALUE
// ============================================

/**
 * Get customer lifetime value analytics
 */
export async function getCLVAnalytics(
  ownerId: string
): Promise<CLVData> {
  // Get all "won" leads as customers
  const customers = await db.cRMLead.findMany({
    where: {
      assignedTo: ownerId,
      pipelineStage: 'closed_won',
    },
    orderBy: { updatedAt: 'desc' },
  })
  
  // Calculate basic CLV metrics
  const totalRevenue = customers.reduce((sum, c) => sum + c.estimatedValue, 0)
  const averageCLV = customers.length > 0 ? totalRevenue / customers.length : 0
  
  // Top customers
  const topCustomers: CLVCustomer[] = customers
    .sort((a, b) => b.estimatedValue - a.estimatedValue)
    .slice(0, 20)
    .map(c => ({
      customerId: c.id,
      customerName: c.companyName,
      totalRevenue: c.estimatedValue,
      purchaseCount: 1, // Simplified
      avgOrderValue: c.estimatedValue,
      firstPurchaseDate: c.createdAt,
      lastPurchaseDate: c.updatedAt || c.convertedAt || c.createdAt,
      predictedCLV: c.estimatedValue * 1.5, // Simple prediction
    }))
  
  // Retention rate (simplified - would need repeat purchase data)
  const retentionRate = 85 // Placeholder
  
  // Average lifespan (months)
  const avgLifespanMonths = 24 // Placeholder
  
  return {
    averageCLV,
    byIndustry: {}, // Would need industry data
    byCompanySize: {}, // Would need company size data
    topCustomers,
    retentionRate,
    avgLifespanMonths,
  }
}

// ============================================
// REPORT GENERATION
// ============================================

/**
 * Generate comprehensive sales report
 */
export async function generateSalesReport(
  ownerId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
): Promise<SalesReport> {
  const dateRange = customRange || getDateRange(period)
  const previousRange = getPreviousPeriodRange(dateRange)
  
  // Get current period metrics
  const metrics = await getDashboardMetrics(ownerId, period === 'custom' ? '30d' : period)
  const conversion = await getConversionMetrics(ownerId, dateRange)
  const forecast = await getRevenueForecast(ownerId)
  const clv = await getCLVAnalytics(ownerId)
  
  // Get previous period for comparison
  const previousMetrics = await getDashboardMetricsForRange(ownerId, previousRange)
  
  // Calculate changes
  const revenueChange = previousMetrics.revenueThisPeriod > 0
    ? ((metrics.revenueThisPeriod - previousMetrics.revenueThisPeriod) / previousMetrics.revenueThisPeriod) * 100
    : 0
  
  const leadsChange = previousMetrics.newLeadsThisPeriod > 0
    ? ((metrics.newLeadsThisPeriod - previousMetrics.newLeadsThisPeriod) / previousMetrics.newLeadsThisPeriod) * 100
    : 0
  
  const winRateChange = 0 // Would need historical comparison
  
  const dealSizeChange = 0 // Would need historical comparison
  
  // Generate recommendations
  const recommendations = generateRecommendations(metrics, conversion, forecast)
  
  return {
    period: dateRange,
    generatedAt: new Date(),
    summary: {
      totalRevenue: metrics.revenueThisPeriod,
      revenueChange: Math.round(revenueChange * 10) / 10,
      newLeads: metrics.newLeadsThisPeriod,
      leadsChange: Math.round(leadsChange * 10) / 10,
      winRate: metrics.winRate,
      winRateChange,
      avgDealSize: metrics.avgDealSize,
      dealSizeChange,
    },
    metrics,
    conversion,
    forecast,
    clv,
    recommendations,
  }
}

function generateRecommendations(
  metrics: DashboardMetrics,
  conversion: ConversionMetrics,
  forecast: RevenueForecast
): string[] {
  const recommendations: string[] = []
  
  // Lead volume recommendations
  if (metrics.newLeadsThisPeriod < 10) {
    recommendations.push('Consider increasing marketing efforts to boost lead generation')
  }
  
  // Win rate recommendations
  if (metrics.winRate < 25) {
    recommendations.push('Win rate is below target. Review qualification criteria and sales process')
  }
  
  // Pipeline health recommendations
  if (metrics.overdueTasks > 5) {
    recommendations.push(`${metrics.overdueTasks} tasks are overdue. Prioritize task completion`)
  }
  
  // Follow-up recommendations
  if (conversion.avgConversionDays > 45) {
    recommendations.push('Average conversion time is high. Implement faster follow-up processes')
  }
  
  // Pipeline value recommendations
  if (metrics.weightedPipelineValue < metrics.totalPipelineValue * 0.3) {
    recommendations.push('Low weighted pipeline value. Focus on advancing high-probability deals')
  }
  
  // Activity recommendations
  if (metrics.activitiesThisPeriod < 20) {
    recommendations.push('Increase prospecting activities to maintain pipeline momentum')
  }
  
  return recommendations
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDateRange(period: string): DateRange {
  const to = new Date()
  let from: Date
  
  switch (period) {
    case '7d':
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      from = new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '6m':
      from = new Date(to.getTime() - 180 * 24 * 60 * 60 * 1000)
      break
    case '12m':
      from = new Date(to.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  return { from, to }
}

function getPreviousPeriodRange(current: DateRange): DateRange {
  const duration = current.to.getTime() - current.from.getTime()
  return {
    from: new Date(current.from.getTime() - duration),
    to: new Date(current.from),
  }
}

async function getContactsByDay(
  ownerId: string,
  range: DateRange
): Promise<TrendData[]> {
  const contacts = await db.cRMContact.findMany({
    where: {
      companyId: ownerId,
      createdAt: { gte: range.from, lte: range.to },
    },
    select: { createdAt: true },
  })
  
  const dayMap: Record<string, number> = {}
  for (const contact of contacts) {
    const day = contact.createdAt.toISOString().slice(0, 10)
    dayMap[day] = (dayMap[day] || 0) + 1
  }
  
  return Object.entries(dayMap)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

async function getLeadsByDay(
  ownerId: string,
  range: DateRange
): Promise<TrendData[]> {
  const leads = await db.cRMLead.findMany({
    where: {
      assignedTo: ownerId,
      createdAt: { gte: range.from, lte: range.to },
    },
    select: { createdAt: true },
  })
  
  const dayMap: Record<string, number> = {}
  for (const lead of leads) {
    const day = lead.createdAt.toISOString().slice(0, 10)
    dayMap[day] = (dayMap[day] || 0) + 1
  }
  
  return Object.entries(dayMap)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

async function getWonDealsByMonth(
  ownerId: string,
  range: DateRange
): Promise<TrendData[]> {
  const deals = await db.cRMLead.findMany({
    where: {
      assignedTo: ownerId,
      pipelineStage: 'closed_won',
      createdAt: { gte: range.from, lte: range.to },
    },
    select: { createdAt: true, estimatedValue: true },
  })
  
  const monthMap: Record<string, number> = {}
  for (const deal of deals) {
    const month = deal.createdAt.toISOString().slice(0, 7)
    monthMap[month] = (monthMap[month] || 0) + deal.estimatedValue
  }
  
  return Object.entries(monthMap)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

async function getLeadsBySource(
  ownerId: string,
  range: DateRange
): Promise<Record<string, number>> {
  const leads = await db.cRMLead.findMany({
    where: {
      assignedTo: ownerId,
      createdAt: { gte: range.from, lte: range.to },
    },
    select: { source: true },
  })
  
  const sourceMap: Record<string, number> = {}
  for (const lead of leads) {
    sourceMap[lead.source] = (sourceMap[lead.source] || 0) + 1
  }
  
  return sourceMap
}

async function getFunnelStages(ownerId: string): Promise<FunnelStageData[]> {
  const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON']
  const stageNames = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won']
  
  const results: FunnelStageData[] = []
  let maxCount = 0
  
  for (let i = 0; i < stages.length; i++) {
    const count = await db.cRMLead.count({
      where: {
        assignedTo: ownerId,
        status: stages[i],
      },
    })
    
    if (count > maxCount) maxCount = count
    
    results.push({
      stage: stageNames[i],
      count,
      percentage: 0, // Will calculate after
      value: 0, // Would need to aggregate estimated values
    })
  }
  
  // Calculate percentages
  for (const result of results) {
    result.percentage = maxCount > 0 ? (result.count / maxCount) * 100 : 0
  }
  
  return results
}

async function getActiveDealsInRange(
  ownerId: string,
  from: Date,
  to: Date
) {
  return db.cRMLead.findMany({
    where: {
      assignedTo: ownerId,
      expectedCloseDate: { gte: from, lte: to },
      pipelineStage: { notIn: ['closed_won', 'closed_lost'] },
      notes: { contains: '"type":"deal"' },
    },
  })
}

async function getDashboardMetricsForRange(
  ownerId: string,
  range: DateRange
): Promise<Pick<DashboardMetrics, 'revenueThisPeriod' | 'newLeadsThisPeriod'>> {
  const [wonDeals, leads] = await Promise.all([
    db.cRMLead.findMany({
      where: {
        assignedTo: ownerId,
        pipelineStage: 'closed_won',
        updatedAt: { gte: range.from, lte: range.to },
      },
      select: { estimatedValue: true },
    }),
    db.cRMLead.count({
      where: {
        assignedTo: ownerId,
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
  ])
  
  return {
    revenueThisPeriod: wonDeals.reduce((sum, d) => sum + d.estimatedValue, 0),
    newLeadsThisPeriod: leads,
  }
}
