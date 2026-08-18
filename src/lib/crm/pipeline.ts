// CRM Pipeline Module
// Sales pipeline stages, deal management, stage transitions, pipeline analytics
// AlgeriaTrade.dz B2B Marketplace - CRM Integration Suite

import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_PIPELINE_STAGES, PipelineStageConfig } from './config'
import { Lead, searchLeads } from './leads'

// ============================================
// TYPES
// ============================================

export interface Pipeline {
  id: string
  name: string
  description?: string
  stages: PipelineStageConfig[]
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DealData {
  ownerId: string
  contactId?: string
  leadId?: string
  
  // Basic info
  title: string
  description?: string
  
  // Value
  value: number
  currency?: string
  
  // Timeline
  expectedCloseDate: Date
  
  // Stage
  stage?: string
  
  // Probability override (auto-calculated from stage)
  probability?: number
  
  // Loss tracking
  lossReason?: string
  
  // Notes
  notes?: string
}

export interface Deal extends DealData {
  id: string
  dealNumber: string
  stage: string
  probability: number
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  
  // Stage history
  stageHistory: PipelineStageTransition[]
  
  // Activity counts
  activitiesCount: number
}

export interface PipelineStageTransition {
  stage: string
  fromStage?: string
  date: Date
  userId?: string
  notes?: string
}

export interface PipelineAnalytics {
  totalDeals: number
  totalValue: number
  weightedValue: number
  avgDealSize: number
  dealsByStage: Record<string, { count: number; value: number }>
  conversionRate: number
  avgDaysInPipeline: number
  winRate: number
  velocity: number // Deals closed per month
  stageConversionRates: Record<string, { entered: number; exited: number; rate: number }>
  valueByMonth: { month: string; won: number; lost: number; pipeline: number }[]
  topLostReasons: Record<string, number>
}

export interface DealFilter {
  ownerId?: string
  search?: string
  stage?: string
  contactId?: string
  leadId?: string
  valueMin?: number
  valueMax?: number
  expectedCloseFrom?: Date
  expectedCloseTo?: Date
  createdFrom?: Date
  createdTo?: Date
  isWon?: boolean
  isLost?: boolean
}

export interface DealPaginationOptions {
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'expectedCloseDate' | 'value' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedDeals {
  data: Deal[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================
// PIPELINE MANAGEMENT
// ============================================

/**
 * Get default pipeline or create if not exists
 */
export async function getDefaultPipeline(): Promise<Pipeline> {
  let pipeline = await db.cRMPipeline.findFirst({
    where: { name: 'Default Sales Pipeline' },
  })
  
  if (!pipeline) {
    pipeline = await db.cRMPipeline.create({
      data: {
        id: uuidv4(),
        name: 'Default Sales Pipeline',
        description: 'Standard B2B sales pipeline for AlgeriaTrade.dz',
        stages: JSON.stringify(DEFAULT_PIPELINE_STAGES),
        defaultLeadStatus: 'NEW',
        autoAdvanceRules: JSON.stringify([]),
      },
    })
  }
  
  return mapPipelineFromDB(pipeline)
}

/**
 * Get all pipelines
 */
export async function getPipelines(): Promise<Pipeline[]> {
  const pipelines = await db.cRMPipeline.findMany({
    orderBy: { createdAt: 'asc' },
  })
  
  return pipelines.map(mapPipelineFromDB)
}

/**
 * Create a custom pipeline
 */
export async function createPipeline(data: {
  name: string
  description?: string
  stages: Omit<PipelineStageConfig, 'order'>[]
}): Promise<Pipeline> {
  const stagesWithOrder = data.stages.map((stage, index) => ({
    ...stage,
    order: index,
  }))
  
  const pipeline = await db.cRMPipeline.create({
    data: {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      stages: JSON.stringify(stagesWithOrder),
      defaultLeadStatus: 'NEW',
      autoAdvanceRules: JSON.stringify([]),
    },
  })
  
  return mapPipelineFromDB(pipeline)
}

/**
 * Update pipeline stages
 */
export async function updatePipeline(
  pipelineId: string,
  data: {
    name?: string
    description?: string
    stages?: PipelineStageConfig[]
  }
): Promise<Pipeline> {
  const existing = await db.cRMPipeline.findUnique({ where: { id: pipelineId } })
  if (!existing) throw new Error('Pipeline not found')
  
  const updated = await db.cRMPipeline.update({
    where: { id: pipelineId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.stages && { stages: JSON.stringify(data.stages) }),
    },
  })
  
  return mapPipelineFromDB(updated)
}

// ============================================
// DEAL CRUD OPERATIONS
// ============================================

/**
 * Create a new deal
 */
export async function createDeal(data: DealData): Promise<Deal> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const count = await db.cRMLead.count({
    where: { leadNumber: { startsWith: `DEAL-${dateStr}` } },
  })
  const dealNumber = `DEAL-${dateStr}-${String(count + 1).padStart(4, '0')}`
  
  // Get initial stage and probability
  const initialStage = data.stage || DEFAULT_PIPELINE_STAGES[0].id
  const probability = data.probability || getProbabilityForStage(initialStage)
  
  // Create deal as a CRMLead with special handling
  const deal = await db.cRMLead.create({
    data: {
      id: uuidv4(),
      leadNumber: dealNumber,
      source: 'WEBSITE', // Default for deals
      companyName: data.title,
      status: 'NEW',
      pipelineStage: initialStage,
      estimatedValue: data.value,
      currency: data.currency || 'DZD',
      probability,
      expectedCloseDate: data.expectedCloseDate,
      assignedTo: data.ownerId,
      notes: JSON.stringify({
        type: 'deal',
        description: data.description,
        contactId: data.contactId,
        leadId: data.leadId,
        lossReason: data.lossReason,
        userNotes: data.notes,
        stageHistory: [{
          stage: initialStage,
          date: new Date().toISOString(),
          notes: 'Deal created',
        }],
      }),
      leadScore: calculateInitialDealScore(data.value),
      engagementScore: 0,
    },
  })
  
  return mapDealFromDB(deal)
}

/**
 * Get a single deal by ID
 */
export async function getDeal(id: string): Promise<Deal | null> {
  const deal = await db.cRMLead.findUnique({
    where: { id },
    include: {
      interactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: {
        select: { interactions: true },
      },
    },
  })
  
  return deal ? mapDealFromDB(deal) : null
}

/**
 * Update a deal
 */
export async function updateDeal(
  id: string,
  data: Partial<Omit<DealData, 'ownerId'>>
): Promise<Deal> {
  const existing = await db.cRMLead.findUnique({ where: { id } })
  if (!existing) throw new Error('Deal not found')
  
  const existingNotes = JSON.parse(existing.notes || '{}')
  
  const updateData: any = {}
  
  if (data.title !== undefined) updateData.companyName = data.title
  if (data.value !== undefined) updateData.estimatedValue = data.value
  if (data.currency !== undefined) updateData.currency = data.currency
  if (data.expectedCloseDate !== undefined) updateData.expectedCloseDate = data.expectedCloseDate
  if (data.probability !== undefined) updateData.probability = data.probability
  
  // Update notes for complex fields
  if (data.description !== undefined) existingNotes.description = data.description
  if (data.contactId !== undefined) existingNotes.contactId = data.contactId
  if (data.leadId !== undefined) existingNotes.leadId = data.leadId
  if (data.lossReason !== undefined) existingNotes.lossReason = data.lossReason
  if (data.notes !== undefined) existingNotes.userNotes = data.notes
  
  updateData.notes = JSON.stringify(existingNotes)
  
  const updated = await db.cRMLead.update({
    where: { id },
    data: updateData,
  })
  
  return mapDealFromDB(updated)
}

/**
 * Delete a deal
 */
export async function deleteDeal(id: string): Promise<void> {
  await db.cRMLead.delete({ where: { id } })
}

// ============================================
// DEAL SEARCH & FILTERING
// ============================================

/**
 * Search deals with filters and pagination
 */
export async function searchDeals(
  filter: DealFilter = {},
  options: DealPaginationOptions = {}
): Promise<PaginatedDeals> {
  const page = options.page || 1
  const pageSize = Math.min(options.pageSize || 20, 100)
  const skip = (page - 1) * pageSize
  
  const where: any = {
    notes: { contains: '"type":"deal"' }, // Only deals
  }
  
  // Owner filter
  if (filter.ownerId) {
    where.assignedTo = filter.ownerId
  }
  
  // Search query
  if (filter.search) {
    where.OR = [
      { companyName: { contains: filter.search, mode: 'insensitive' } },
      { leadNumber: { contains: filter.search } },
      { notes: { contains: filter.search, mode: 'insensitive' } },
    ]
  }
  
  // Stage filter
  if (filter.stage) {
    where.pipelineStage = filter.stage
  }
  
  // Contact/Lead filters
  if (filter.contactId || filter.leadId) {
    const notes = JSON.parse('{}')
    if (filter.contactId) notes.contactId = filter.contactId
    if (filter.leadId) notes.leadId = filter.leadId
    // Complex filtering would need raw SQL for JSON queries
  }
  
  // Value range filters
  if (filter.valueMin !== undefined || filter.valueMax !== undefined) {
    where.estimatedValue = {}
    if (filter.valueMin !== undefined) where.estimatedValue.gte = filter.valueMin
    if (filter.valueMax !== undefined) where.estimatedValue.lte = filter.valueMax
  }
  
  // Expected close date filters
  if (filter.expectedCloseFrom || filter.expectedCloseTo) {
    where.expectedCloseDate = {}
    if (filter.expectedCloseFrom) where.expectedCloseDate.gte = filter.expectedCloseFrom
    if (filter.expectedCloseTo) where.expectedCloseDate.lte = filter.expectedCloseTo
  }
  
  // Created date filters
  if (filter.createdFrom || filter.createdTo) {
    where.createdAt = {}
    if (filter.createdFrom) where.createdAt.gte = filter.createdFrom
    if (filter.createdTo) where.createdAt.lte = filter.createdTo
  }
  
  // Won/Lost filters
  if (filter.isWon === true) {
    where.pipelineStage = 'closed_won'
  } else if (filter.isLost === true) {
    where.pipelineStage = 'closed_lost'
  } else if (filter.isWon === false && filter.isLost === false) {
    where.pipelineStage = { notIn: ['closed_won', 'closed_lost'] }
  }
  
  const [deals, total] = await Promise.all([
    db.cRMLead.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        [(options.sortBy || 'createdAt')]: options.sortOrder || 'desc',
      },
      include: {
        _count: { select: { interactions: true } },
      },
    }),
    db.cRMLead.count({ where }),
  ])
  
  return {
    data: deals.map(mapDealFromDB),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Get deals by stage
 */
export async function getDealsByStage(stage: string): Promise<Deal[]> {
  const deals = await db.cRMLead.findMany({
    where: {
      pipelineStage: stage,
      notes: { contains: '"type":"deal"' },
    },
    orderBy: { estimatedValue: 'desc' },
  })
  
  return deals.map(mapDealFromDB)
}

// ============================================
// STAGE TRANSITIONS
// ============================================

/**
 * Move deal to a new stage
 */
export async function moveDealToStage(
  dealId: string,
  newStage: string,
  options?: {
    userId?: string
    notes?: string
    forceProbability?: number
  }
): Promise<Deal> {
  const validStages = DEFAULT_PIPELINE_STAGES.map(s => s.id)
  if (!validStages.includes(newStage)) {
    throw new Error(`Invalid stage: ${newStage}`)
  }
  
  const existing = await db.cRMLead.findUnique({ where: { id: dealId } })
  if (!existing) throw new Error('Deal not found')
  
  const oldStage = existing.pipelineStage
  const probability = options?.forceProbability ?? getProbabilityForStage(newStage)
  
  // Update stage history in notes
  const notes = JSON.parse(existing.notes || '{}')
  if (!notes.stageHistory) notes.stageHistory = []
  notes.stageHistory.push({
    stage: newStage,
    fromStage: oldStage,
    date: new Date().toISOString(),
    userId: options?.userId,
    notes: options?.notes,
  })
  
  const updated = await db.cRMLead.update({
    where: { id: dealId },
    data: {
      pipelineStage: newStage,
      probability,
      status: getStatusFromStage(newStage),
      notes: JSON.stringify(notes),
    },
  })
  
  return mapDealFromDB(updated)
}

/**
 * Win a deal
 */
export async function winDeal(
  dealId: string,
  options?: {
    actualValue?: number
    notes?: string
  }
): Promise<Deal> {
  return moveDealToStage(dealId, 'closed_won', {
    notes: options?.notes ? `Deal won! ${options.notes}` : 'Deal won!',
  })
}

/**
 * Lose a deal
 */
export async function loseDeal(
  dealId: string,
  reason: string,
  competitor?: string
): Promise<Deal> {
  const existing = await db.cRMLead.findUnique({ where: { id: dealId } })
  if (!existing) throw new Error('Deal not found')
  
  const notes = JSON.parse(existing.notes || '{}')
  notes.lossReason = reason
  if (competitor) notes.lostToCompetitor = competitor
  
  await db.cRMLead.update({
    where: { id: dealId },
    data: { notes: JSON.stringify(notes) },
  })
  
  return moveDealToStage(dealId, 'closed_lost', {
    notes: `Deal lost. Reason: ${reason}${competitor ? `. Competitor: ${competitor}` : ''}`,
  })
}

function getProbabilityForStage(stage: string): number {
  const stageConfig = DEFAULT_PIPELINE_STAGES.find(s => s.id === stage)
  return stageConfig?.probability ?? 5
}

function getStatusFromStage(stage: string): string {
  if (stage === 'closed_won') return 'WON'
  if (stage === 'closed_lost') return 'LOST'
  return 'NEW'
}

function calculateInitialDealScore(value: number): number {
  if (value >= 10000000) return 90
  if (value >= 5000000) return 75
  if (value >= 1000000) return 60
  if (value >= 500000) return 45
  if (value >= 100000) return 30
  return 15
}

// ============================================
// PIPELINE ANALYTICS
// ============================================

/**
 * Get comprehensive pipeline analytics
 */
export async function getPipelineAnalytics(
  ownerId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<PipelineAnalytics> {
  const baseWhere: any = {
    assignedTo: ownerId,
    notes: { contains: '"type":"deal"' },
  }
  
  if (dateFrom || dateTo) {
    baseWhere.createdAt = {}
    if (dateFrom) baseWhere.createdAt.gte = dateFrom
    if (dateTo) baseWhere.createdAt.lte = dateTo
  }
  
  // Get all deals
  const [allDeals, activeDeals, wonDeals, lostDeals] = await Promise.all([
    db.cRMLead.findMany({ where: baseWhere }),
    db.cRMLead.findMany({ 
      where: { 
        ...baseWhere, 
        pipelineStage: { notIn: ['closed_won', 'closed_lost'] } 
      } 
    }),
    db.cRMLead.findMany({ where: { ...baseWhere, pipelineStage: 'closed_won' } }),
    db.cRMLead.findMany({ where: { ...baseWhere, pipelineStage: 'closed_lost' } }),
  ])
  
  // Calculate basic metrics
  const totalDeals = allDeals.length
  const totalValue = allDeals.reduce((sum, d) => sum + d.estimatedValue, 0)
  const weightedValue = activeDeals.reduce((sum, d) => sum + (d.estimatedValue * d.probability / 100), 0)
  const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0
  
  // Deals by stage
  const dealsByStage: Record<string, { count: number; value: number }> = {}
  for (const stage of DEFAULT_PIPELINE_STAGES) {
    const stageDeals = allDeals.filter(d => d.pipelineStage === stage.id)
    dealsByStage[stage.id] = {
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + d.estimatedValue, 0),
    }
  }
  
  // Conversion rates
  const conversionRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0
  const winRate = (wonDeals.length + lostDeals.length) > 0 
    ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100 
    : 0
  
  // Average days in pipeline
  let totalDays = 0
  let countWithDates = 0
  for (const deal of [...wonDeals, ...lostDeals]) {
    const days = Math.ceil(
      (new Date(deal.updatedAt).getTime() - new Date(deal.createdAt).getTime()) 
      / (1000 * 60 * 60 * 24)
    )
    if (days > 0) {
      totalDays += days
      countWithDates++
    }
  }
  const avgDaysInPipeline = countWithDates > 0 ? totalDays / countWithDates : 0
  
  // Velocity (deals closed per month)
  const oldestDate = Math.min(...allDeals.map(d => new Date(d.createdAt).getTime()))
  const monthsSinceOldest = Math.max(1, (Date.now() - oldestDate) / (30 * 24 * 60 * 60 * 1000))
  const velocity = (wonDeals.length + lostDeals.length) / monthsSinceOldest
  
  // Stage conversion rates (simplified)
  const stageConversionRates: Record<string, { entered: number; exited: number; rate: number }> = {}
  for (const stage of DEFAULT_PIPELINE_STAGES.filter(s => !['closed_won', 'closed_lost'].includes(s.id))) {
    const entered = allDeals.filter(d => d.pipelineStage === stage.id).length
    const nextStageIndex = DEFAULT_PIPELINE_STAGES.findIndex(s => s.id === stage.id) + 1
    const nextStage = DEFAULT_PIPELINE_STAGES[nextStageIndex]
    const exited = nextStage ? allDeads.filter(d => d.pipelineStage === nextStage.id).length : 0
    
    stageConversionRates[stage.id] = {
      entered,
      exited,
      rate: entered > 0 ? (exited / entered) * 100 : 0,
    }
  }
  
  // Value by month
  const valueByMonth: { month: string; won: number; lost: number; pipeline: number }[] = {}
  for (const deal of allDeals) {
    const month = new Date(deal.createdAt).toISOString().slice(0, 7)
    if (!valueByMonth[month]) {
      valueByMonth[month] = { month, won: 0, lost: 0, pipeline: 0 }
    }
    
    if (deal.pipelineStage === 'closed_won') valueByMonth[month].won += deal.estimatedValue
    else if (deal.pipelineStage === 'closed_lost') valueByMonth[month].lost += deal.estimatedValue
    else valueByMonth[month].pipeline += deal.estimatedValue
  }
  
  // Top loss reasons
  const topLostReasons: Record<string, number> = {}
  for (const deal of lostDeals) {
    const notes = JSON.parse(deal.notes || '{}')
    const reason = notes.lossReason || 'Unknown'
    topLostReasons[reason] = (topLostReasons[reason] || 0) + 1
  }
  
  return {
    totalDeals,
    totalValue,
    weightedValue,
    avgDealSize,
    dealsByStage,
    conversionRate,
    avgDaysInPipeline,
    winRate,
    velocity,
    stageConversionRates,
    valueByMonth: Object.values(valueByMonth).sort((a, b) => a.month.localeCompare(b.month)),
    topLostReasons,
  }
}

/**
 * Get pipeline forecast
 */
export async function getPipelineForecast(
  ownerId: string
): Promise<{ 
  weightedForecast: number 
  bestCase: number 
  commit: number 
  byMonth: { month: string; expected: number; bestCase: number }[] 
}> {
  const activeDeals = await db.cRMLead.findMany({
    where: {
      assignedTo: ownerId,
      pipelineStage: { notIn: ['closed_won', 'closed_lost'] },
      notes: { contains: '"type":"deal"' },
    },
  })
  
  let weightedForecast = 0
  let bestCase = 0
  let commit = 0
  
  const byMonth: Record<string, { expected: number; bestCase: number }> = {}
  
  for (const deal of activeDeals) {
    const value = deal.estimatedValue
    const prob = deal.probability / 100
    
    // Weighted forecast (probability-based)
    weightedForecast += value * prob
    
    // Best case (all deals close)
    bestCase += value
    
    // Commit (high probability deals only)
    if (prob >= 0.7) {
      commit += value
    }
    
    // Group by expected close month
    const month = new Date(deal.expectedCloseDate).toISOString().slice(0, 7)
    if (!byMonth[month]) {
      byMonth[month] = { expected: 0, bestCase: 0 }
    }
    byMonth[month].expected += value * prob
    byMonth[month].bestCase += value
  }
  
  return {
    weightedForecast,
    bestCase,
    commit,
    byMonth: Object.entries(byMonth)
      .map(([month, values]) => ({ month, ...values }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  }
}

// ============================================
// HELPERS
// ============================================

function mapPipelineFromDB(dbPipeline: any): Pipeline {
  return {
    id: dbPipeline.id,
    name: dbPipeline.name,
    description: dbPipeline.description || undefined,
    stages: JSON.parse(dbPipeline.stages || '[]'),
    isDefault: dbPipeline.name === 'Default Sales Pipeline',
    createdAt: dbPipeline.createdAt,
    updatedAt: dbPipeline.updatedAt,
  }
}

function mapDealFromDB(dbDeal: any): Deal {
  const notes = JSON.parse(dbDeal.notes || '{}')
  
  return {
    id: dbDeal.id,
    ownerId: dbDeal.assignedTo,
    contactId: notes.contactId || undefined,
    leadId: notes.leadId || undefined,
    title: dbDeal.companyName,
    description: notes.description || undefined,
    value: dbDeal.estimatedValue,
    currency: dbDeal.currency || 'DZD',
    expectedCloseDate: dbDeal.expectedCloseDate,
    stage: dbDeal.pipelineStage,
    probability: dbDeal.probability,
    lossReason: notes.lossReason || undefined,
    notes: notes.userNotes || undefined,
    dealNumber: dbDeal.leadNumber,
    createdAt: dbDeal.createdAt,
    updatedAt: dbDeal.updatedAt,
    stageHistory: notes.stageHistory || [],
    activitiesCount: dbDeal._count?.interactions || 0,
  }
}
