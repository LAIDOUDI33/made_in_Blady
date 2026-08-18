// CRM Leads Module
// Lead management, scoring algorithm, qualification, source tracking, conversion tracking
// AlgeriaTrade.dz B2B Marketplace - CRM Integration Suite

import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { LEAD_SOURCES, LeadSource } from './config'

// ============================================
// TYPES
// ============================================

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'

export interface LeadData {
  ownerId: string
  contactId?: string
  
  // Source info
  source: LeadSource
  sourceDetails?: string
  campaignId?: string
  
  // Company info
  companyName: string
  industry?: string
  companySize?: string
  website?: string
  wilaya?: string
  city?: string
  
  // Pipeline
  status?: LeadStatus
  estimatedValue: number
  currency?: string
  expectedCloseDate: Date
  
  // Assignment
  assignedTo: string
  teamId?: string
  
  // Products/Services interest
  interestedCategories?: string[]
  interestedProducts?: string[]
  specificRequirements?: string
  
  // Notes
  notes?: string
}

export interface Lead extends LeadData {
  id: string
  leadNumber: string
  score: number
  engagementScore: number
  probability: number
  pipelineStage: string
  
  // Conversion tracking
  convertedToDealId?: string
  convertedAt?: Date
  
  // Loss analysis
  lossReason?: string
  lostToCompetitor?: string
  
  createdAt: Date
  updatedAt: Date
}

export interface LeadFilter {
  ownerId?: string
  search?: string
  status?: LeadStatus
  pipelineStage?: string
  source?: LeadSource
  assignedTo?: string
  scoreMin?: number
  scoreMax?: number
  valueMin?: number
  valueMax?: number
  expectedCloseFrom?: Date
  expectedCloseTo?: Date
  createdFrom?: Date
  createdTo?: Date
  isConverted?: boolean
}

export interface LeadPaginationOptions {
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'expectedCloseDate' | 'estimatedValue' | 'score' | 'companyName'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedLeads {
  data: Lead[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface LeadScoreFactors {
  engagement: number
  fit: number
  behavior: number
  urgency: number
  authority: number
  total: number
}

export interface ConversionMetrics {
  totalLeads: number
  convertedLeads: number
  conversionRate: number
  avgConversionDays: number
  avgDealValue: number
  bySource: Record<string, { total: number; converted: number; rate: number }>
  byMonth: { month: string; total: number; converted: number }[]
}

// ============================================
// LEAD CRUD OPERATIONS
// ============================================

/**
 * Create a new lead with automatic scoring
 */
export async function createLead(data: LeadData): Promise<Lead> {
  // Generate unique lead number
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const count = await db.cRMLead.count({
    where: { leadNumber: { startsWith: `LED-${dateStr}` } },
  })
  const leadNumber = `LED-${dateStr}-${String(count + 1).padStart(4, '0')}`
  
  // Determine initial pipeline stage and probability
  const initialStage = getInitialPipelineStage(data.status || 'NEW')
  const probability = getProbabilityForStage(initialStage)
  
  // Calculate initial score
  const score = calculateInitialLeadScore(data)
  
  const lead = await db.cRMLead.create({
    data: {
      id: uuidv4(),
      leadNumber,
      source: data.source,
      sourceDetails: data.sourceDetails,
      campaignId: data.campaignId,
      companyName: data.companyName,
      industry: data.industry,
      companySize: data.companySize,
      website: data.website,
      wilaya: data.wilaya,
      city: data.city,
      primaryContactId: data.contactId || '',
      status: data.status || 'NEW',
      pipelineStage: initialStage,
      estimatedValue: data.estimatedValue,
      currency: data.currency || 'DZD',
      probability,
      expectedCloseDate: data.expectedCloseDate,
      assignedTo: data.assignedTo,
      teamId: data.teamId,
      interestedCategories: JSON.stringify(data.interestedCategories || []),
      interestedProducts: JSON.stringify(data.interestedProducts || []),
      specificRequirements: data.specificRequirements,
      notes: data.notes,
      leadScore: score,
      engagementScore: 0,
    },
  })
  
  return mapLeadFromDB(lead)
}

/**
 * Get a single lead by ID
 */
export async function getLead(id: string): Promise<Lead | null> {
  const lead = await db.cRMLead.findUnique({
    where: { id },
    include: {
      interactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      tasks: {
        orderBy: { dueDate: 'asc' },
        take: 10,
      },
    },
  })
  
  return lead ? mapLeadFromDB(lead) : null
}

/**
 * Update a lead
 */
export async function updateLead(
  id: string,
  data: Partial<Omit<LeadData, 'ownerId'>>
): Promise<Lead> {
  const existing = await db.cRMLead.findUnique({ where: { id } })
  if (!existing) throw new Error('Lead not found')
  
  const updateData: any = {}
  
  if (data.source !== undefined) updateData.source = data.source
  if (data.sourceDetails !== undefined) updateData.sourceDetails = data.sourceDetails
  if (data.companyName !== undefined) updateData.companyName = data.companyName
  if (data.industry !== undefined) updateData.industry = data.industry
  if (data.companySize !== undefined) updateData.companySize = data.companySize
  if (data.website !== undefined) updateData.website = data.website
  if (data.wilaya !== undefined) updateData.wilaya = data.wilaya
  if (data.city !== undefined) updateData.city = data.city
  if (data.status !== undefined) {
    updateData.status = data.status
    updateData.pipelineStage = getInitialPipelineStage(data.status)
    updateData.probability = getProbabilityForStage(updateData.pipelineStage)
  }
  if (data.estimatedValue !== undefined) updateData.estimatedValue = data.estimatedValue
  if (data.currency !== undefined) updateData.currency = data.currency
  if (data.expectedCloseDate !== undefined) updateData.expectedCloseDate = data.expectedCloseDate
  if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo
  if (data.teamId !== undefined) updateData.teamId = data.teamId
  if (data.specificRequirements !== undefined) updateData.specificRequirements = data.specificRequirements
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.interestedCategories !== undefined) updateData.interestedCategories = JSON.stringify(data.interestedCategories)
  if (data.interestedProducts !== undefined) updateData.interestedProducts = JSON.stringify(data.interestedProducts)
  
  const updated = await db.cRMLead.update({
    where: { id },
    data: updateData,
  })
  
  return mapLeadFromDB(updated)
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<void> {
  await db.cRMLead.delete({ where: { id } })
}

// ============================================
// LEAD SEARCH & FILTERING
// ============================================

/**
 * Search leads with filters and pagination
 */
export async function searchLeads(
  filter: LeadFilter = {},
  options: LeadPaginationOptions = {}
): Promise<PaginatedLeads> {
  const page = options.page || 1
  const pageSize = Math.min(options.pageSize || 20, 100)
  const skip = (page - 1) * pageSize
  
  const where: any = {}
  
  // Owner filter
  if (filter.ownerId) {
    where.assignedTo = filter.ownerId // Using assignedTo as owner filter for now
  }
  
  // Search query
  if (filter.search) {
    where.OR = [
      { companyName: { contains: filter.search, mode: 'insensitive' } },
      { leadNumber: { contains: filter.search } },
      { industry: { contains: filter.search, mode: 'insensitive' } },
      { website: { contains: filter.search } },
      { notes: { contains: filter.search, mode: 'insensitive' } },
    ]
  }
  
  // Status filter
  if (filter.status) {
    where.status = filter.status
  }
  
  // Pipeline stage filter
  if (filter.pipelineStage) {
    where.pipelineStage = filter.pipelineStage
  }
  
  // Source filter
  if (filter.source) {
    where.source = filter.source
  }
  
  // Assignment filter
  if (filter.assignedTo) {
    where.assignedTo = filter.assignedTo
  }
  
  // Score range filters
  if (filter.scoreMin !== undefined || filter.scoreMax !== undefined) {
    where.leadScore = {}
    if (filter.scoreMin !== undefined) where.leadScore.gte = filter.scoreMin
    if (filter.scoreMax !== undefined) where.leadScore.lte = filter.scoreMax
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
  
  // Converted filter
  if (filter.isConverted === true) {
    where.convertedToCompanyId = { not: null }
  } else if (filter.isConverted === false) {
    where.convertedToCompanyId = null
  }
  
  const [leads, total] = await Promise.all([
    db.cRMLead.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        [(options.sortBy || 'createdAt')]: options.sortOrder || 'desc',
      },
    }),
    db.cRMLead.count({ where }),
  ])
  
  return {
    data: leads.map(mapLeadFromDB),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Get leads by pipeline stage
 */
export async function getLeadsByStage(stage: string, limit?: number): Promise<Lead[]> {
  const leads = await db.cRMLead.findMany({
    where: { pipelineStage: stage },
    orderBy: { probability: 'desc' },
    take: limit || 50,
  })
  
  return leads.map(mapLeadFromDB)
}

// ============================================
// LEAD SCORING ALGORITHM
// ============================================

/**
 * Calculate initial lead score based on source and attributes
 */
function calculateInitialLeadScore(data: LeadData): number {
  let score = 10 // Base score
  
  // Source scoring
  const sourceConfig = LEAD_SOURCES.find(s => s.source === data.source)
  score += sourceConfig?.defaultScore || 5
  
  // Company size scoring
  const sizeScores: Record<string, number> = {
    '500+': 20,
    '201-500': 18,
    '51-200': 15,
    '11-50': 10,
    '1-10': 5,
    'solo': 3,
  }
  score += sizeScores[data.companySize || ''] || 5
  
  // Value scoring
  const value = data.estimatedValue
  if (value >= 10000000) score += 25 // 10M+
  else if (value >= 5000000) score += 20 // 5M+
  else if (value >= 1000000) score += 15 // 1M+
  else if (value >= 500000) score += 10 // 500K+
  else if (value >= 100000) score += 5 // 100K+
  
  // Industry bonus (certain industries are more valuable)
  const highValueIndustries = ['oil_gas', 'mining', 'construction', 'manufacturing', 'telecommunications']
  if (data.industry && highValueIndustries.some(i => data.industry!.toLowerCase().includes(i))) {
    score += 10
  }
  
  return Math.min(Math.max(score, 0), 100)
}

/**
 * Recalculate lead score based on all factors
 */
export async function recalculateLeadScore(leadId: string): Promise<{ score: number; factors: LeadScoreFactors }> {
  const lead = await db.cRMLead.findUnique({
    where: { id: leadId },
    include: {
      interactions: true,
      tasks: true,
    },
  })
  
  if (!lead) throw new Error('Lead not found')
  
  const factors: LeadScoreFactors = {
    engagement: 0,
    fit: 0,
    behavior: 0,
    urgency: 0,
    authority: 0,
    total: 0,
  }
  
  // Engagement scoring (max 30 points)
  const interactionCount = lead.interactions.length
  factors.engagement = Math.min(interactionCount * 3, 25)
  
  // Recent interactions boost
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentInteractions = lead.interactions.filter(i => 
    new Date(i.createdAt) > thirtyDaysAgo
  )
  factors.engagement += Math.min(recentInteractions.length * 1.5, 5)
  
  // Fit scoring (max 25 points)
  const sourceConfig = LEAD_SOURCES.find(s => s.source === lead.source)
  factors.fit = Math.min((sourceConfig?.defaultScore || 5) * 0.8, 20)
  
  // Company size fit
  const sizeFit: Record<string, number> = {
    '500+': 5, '201-500': 4, '51-200': 3, '11-50': 2, '1-10': 1,
  }
  factors.fit += sizeFit[lead.companySize || ''] || 1
  
  // Behavior scoring (max 20 points)
  const completedTasks = lead.tasks.filter(t => t.status === 'COMPLETED')
  factors.behavior = Math.min(completedTasks.length * 5, 15)
  
  // Meeting/booked demo indicators
  const hasMeeting = lead.interactions.some(i => i.type === 'MEETING')
  if (hasMeeting) factors.behavior += 5
  
  // Urgency scoring (max 15 points)
  const daysUntilClose = Math.ceil(
    (new Date(lead.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysUntilClose <= 7 && daysUntilClose > 0) {
    factors.urgency = 15 // Very urgent
  } else if (daysUntilClose <= 30) {
    factors.urgency = 10 // Somewhat urgent
  } else if (daysUntilClose <= 90) {
    factors.urgency = 5 // Normal timeline
  }
  
  // Authority scoring (max 10 points)
  // This would typically come from contact role information
  factors.authority = 5 // Default assumption
  
  // Calculate total
  factors.total = Math.min(
    factors.engagement + factors.fit + factors.behavior + factors.urgency + factors.authority,
    100
  )
  
  // Update the lead
  await db.cRMLead.update({
    where: { id: leadId },
    data: {
      leadScore: factors.total,
      engagementScore: Math.min(factors.engagement + factors.behavior, 100),
    },
  })
  
  return { score: factors.total, factors }
}

/**
 * Get leads that need attention (high score but stalled)
 */
export async function getStalledLeads(ownerId: string, daysThreshold: number = 14): Promise<Lead[]> {
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)
  
  const leads = await db.cRMLead.findMany({
    where: {
      assignedTo: ownerId,
      status: { in: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL'] },
      OR: [
        { updatedAt: { lt: thresholdDate } },
        { lastInteractionAt: { lt: thresholdDate } },
      ],
      leadScore: { gte: 50 },
    },
    orderBy: { leadScore: 'desc' },
  })
  
  return leads.map(mapLeadFromDB)
}

// ============================================
// LEAD QUALIFICATION
// ============================================

/**
 * Qualify a lead (move to qualified stage)
 */
export async function qualifyLead(
  leadId: string,
  qualificationNotes?: string
): Promise<Lead> {
  const lead = await db.cRMLead.findUnique({ where: { id: leadId } })
  if (!lead) throw new Error('Lead not found')
  
  // Boost score when qualifying
  const newScore = Math.min(lead.leadScore + 15, 100)
  
  const updated = await db.cRMLead.update({
    where: { id: leadId },
    data: {
      status: 'QUALIFIED',
      pipelineStage: 'qualified',
      probability: 35,
      leadScore: newScore,
      notes: qualificationNotes 
        ? `${lead.notes || ''}\n\n[Qualification] ${qualificationNotes}` 
        : lead.notes,
    },
  })
  
  return mapLeadFromDB(updated)
}

/**
 * Disqualify a lead (move to lost with reason)
 */
export async function disqualifyLead(
  leadId: string,
  reason: string,
  competitor?: string
): Promise<Lead> {
  const updated = await db.cRMLead.update({
    where: { id: leadId },
    data: {
      status: 'LOST',
      pipelineStage: 'closed_lost',
      probability: 0,
      lostReason: reason,
      lostToCompetitor: competitor,
    },
  })
  
  return mapLeadFromDB(updated)
}

// ============================================
// STAGE TRANSITIONS
// ============================================

/**
 * Move lead to a new pipeline stage
 */
export async function moveLeadToStage(
  leadId: string,
  newStage: string,
  notes?: string
): Promise<Lead> {
  const validStages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
  if (!validStages.includes(newStage)) {
    throw new Error(`Invalid stage: ${newStage}`)
  }
  
  const probability = getProbabilityForStage(newStage)
  const status = getStatusFromStage(newStage)
  
  const updated = await db.cRMLead.update({
    where: { id: leadId },
    data: {
      pipelineStage: newStage,
      probability,
      status,
      ...(notes && { notes }),
    },
  })
  
  return mapLeadFromDB(updated)
}

function getInitialPipelineStage(status: LeadStatus): string {
  const stageMap: Record<LeadStatus, string> = {
    NEW: 'lead',
    CONTACTED: 'lead',
    QUALIFIED: 'qualified',
    PROPOSAL: 'proposal',
    NEGOTIATION: 'negotiation',
    WON: 'closed_won',
    LOST: 'closed_lost',
  }
  return stageMap[status] || 'lead'
}

function getProbabilityForStage(stage: string): number {
  const probabilities: Record<string, number> = {
    lead: 5,
    qualified: 20,
    proposal: 40,
    negotiation: 65,
    closed_won: 100,
    closed_lost: 0,
  }
  return probabilities[stage] || 5
}

function getStatusFromStage(stage: string): LeadStatus {
  const statusMap: Record<string, LeadStatus> = {
    lead: 'NEW',
    qualified: 'QUALIFIED',
    proposal: 'PROPOSAL',
    negotiation: 'NEGOTIATION',
    closed_won: 'WON',
    closed_lost: 'LOST',
  }
  return statusMap[stage] || 'NEW'
}

// ============================================
// CONVERSION TRACKING
// ============================================

/**
 * Convert a lead to a deal/opportunity
 */
export async function convertLeadToDeal(
  leadId: string,
  dealData?: {
    title?: string
    value?: number
    expectedCloseDate?: Date
  }
): Promise<Lead> {
  const lead = await db.cRMLead.findUnique({ where: { id: leadId } })
  if (!lead) throw new Error('Lead not found')
  if (lead.convertedToCompanyId) throw new Error('Lead already converted')
  
  // Generate deal ID reference
  const dealId = uuidv4()
  
  const updated = await db.cRMLead.update({
    where: { id: leadId },
    data: {
      status: 'WON',
      pipelineStage: 'closed_won',
      probability: 100,
      convertedToDealId: dealId,
      convertedAt: new Date(),
      ...(dealData?.value && { estimatedValue: dealData.value }),
      ...(dealData?.expectedCloseDate && { expectedCloseDate: dealData.expectedCloseDate }),
    },
  })
  
  return mapLeadFromDB(updated)
}

/**
 * Get conversion metrics
 */
export async function getConversionMetrics(
  ownerId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<ConversionMetrics> {
  const where: any = { assignedTo: ownerId }
  
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = dateFrom
    if (dateTo) where.createdAt.lte = dateTo
  }
  
  const [allLeads, convertedLeads] = await Promise.all([
    db.cRMLead.findMany({ where }),
    db.cRMLead.findMany({
      where: { ...where, convertedToCompanyId: { not: null } },
    }),
  ])
  
  // Calculate average conversion time
  let totalConversionDays = 0
  for (const lead of convertedLeads) {
    if (lead.convertedAt) {
      const days = Math.ceil(
        (new Date(lead.convertedAt).getTime() - new Date(lead.createdAt).getTime()) 
        / (1000 * 60 * 60 * 24)
      )
      totalConversionDays += days
    }
  }
  
  // Group by source
  const bySource: Record<string, { total: number; converted: number; rate: number }> = {}
  for (const source of LEAD_SOURCES.map(s => s.source)) {
    const sourceLeads = allLeads.filter(l => l.source === source)
    const sourceConverted = convertedLeads.filter(l => l.source === source)
    bySource[source] = {
      total: sourceLeads.length,
      converted: sourceConverted.length,
      rate: sourceLeads.length > 0 ? (sourceConverted.length / sourceLeads.length) * 100 : 0,
    }
  }
  
  // Group by month
  const byMonth: { month: string; total: number; converted: number }[] = []
  const monthGroups: Record<string, { total: number; converted: number }> = {}
  
  for (const lead of allLeads) {
    const month = new Date(lead.createdAt).toISOString().slice(0, 7) // YYYY-MM
    if (!monthGroups[month]) {
      monthGroups[month] = { total: 0, converted: 0 }
    }
    monthGroups[month].total++
  }
  
  for (const lead of convertedLeads) {
    const month = new Date(lead.createdAt).toISOString().slice(0, 7)
    if (monthGroups[month]) {
      monthGroups[month].converted++
    }
  }
  
  for (const [month, counts] of Object.entries(monthGroups)) {
    byMonth.push({ month, ...counts })
  }
  byMonth.sort((a, b) => a.month.localeCompare(b.month))
  
  return {
    totalLeads: allLeads.length,
    convertedLeads: convertedLeads.length,
    conversionRate: allLeads.length > 0 ? (convertedLeads.length / allLeads.length) * 100 : 0,
    avgConversionDays: convertedLeads.length > 0 ? totalConversionDays / convertedLeads.length : 0,
    avgDealValue: convertedLeads.reduce((sum, l) => sum + l.estimatedValue, 0) / (convertedLeads.length || 1),
    bySource,
    byMonth,
  }
}

// ============================================
// ASSIGNMENT
// ============================================

/**
 * Assign lead to a user
 */
export async function assignLead(leadId: string, userId: string): Promise<Lead> {
  const updated = await db.cRMLead.update({
    where: { id: leadId },
    data: { assignedTo: userId },
  })
  
  return mapLeadFromDB(updated)
}

/**
 * Auto-assign leads using round-robin
 */
export async function autoAssignLead(
  leadId: string,
  teamMembers: string[]
): Promise<Lead> {
  // Find who has the least leads
  const leadCounts: Record<string, number> = {}
  
  for (const memberId of teamMembers) {
    const count = await db.cRMLead.count({
      where: {
        assignedTo: memberId,
        status: { in: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'] },
      },
    })
    leadCounts[memberId] = count
  }
  
  // Sort by count and pick the one with least leads
  const sortedMembers = teamMembers.sort((a, b) => (leadCounts[a] || 0) - (leadCounts[b] || 0))
  const assignee = sortedMembers[0]
  
  return assignLead(leadId, assignee)
}

// ============================================
// HELPERS
// ============================================

function mapLeadFromDB(dbLead: any): Lead {
  return {
    id: dbLead.id,
    ownerId: dbLead.assignedTo, // Using assignedTo as owner reference
    contactId: dbLead.primaryContactId || undefined,
    source: dbLead.source as LeadSource,
    sourceDetails: dbLead.sourceDetails || undefined,
    campaignId: dbLead.campaignId || undefined,
    companyName: dbLead.companyName,
    industry: dbLead.industry || undefined,
    companySize: dbLead.companySize || undefined,
    website: dbLead.website || undefined,
    wilaya: dbLead.wilaya || undefined,
    city: dbLead.city || undefined,
    status: dbLead.status as LeadStatus,
    estimatedValue: dbLead.estimatedValue,
    currency: dbLead.currency || 'DZD',
    expectedCloseDate: dbLead.expectedCloseDate,
    assignedTo: dbLead.assignedTo,
    teamId: dbLead.teamId || undefined,
    interestedCategories: JSON.parse(dbLead.interestedCategories || '[]'),
    interestedProducts: JSON.parse(dbLead.interestedProducts || '[]'),
    specificRequirements: dbLead.specificRequirements || undefined,
    notes: dbLead.notes || undefined,
    leadNumber: dbLead.leadNumber,
    score: dbLead.leadScore,
    engagementScore: dbLead.engagementScore,
    probability: dbLead.probability,
    pipelineStage: dbLead.pipelineStage,
    convertedToDealId: dbLead.convertedToDealId || undefined,
    convertedAt: dbLead.convertedAt || undefined,
    lossReason: dbLead.lostReason || undefined,
    lostToCompetitor: dbLead.lostToCompetitor || undefined,
    createdAt: dbLead.createdAt,
    updatedAt: dbLead.updatedAt,
  }
}
