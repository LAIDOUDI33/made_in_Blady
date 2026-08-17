// Customer Relationship Management Module
// Track interactions, manage leads, automate follow-ups
// AlgeriaTrade.dz B2B Platform - Phase 8I

import { db } from './db'
import { v4 as uuidv4 } from 'uuid'

// ============================================
// TYPES
// ============================================

export type ContactRole = 'DECISION_MAKER' | 'INFLUENCER' | 'TECHNICAL' | 'FINANCIAL' | 'END_USER' | 'OTHER'
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'
export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'TRADE_SHOW' | 'COLD_CALL' | 'EMAIL' | 'SOCIAL_MEDIA' | 'PARTNER' | 'RFQ'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DEFERRED'
export type InteractionType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'SYSTEM' | 'CHAT' | 'QUOTE_SENT' | 'ORDER_PLACED'
export type InteractionDirection = 'INBOUND' | 'OUTBOUND'
export type SentimentType = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
export type SyncDirection = 'PUSH' | 'PULL' | 'BIDIRECTIONAL'

export interface CRMContact {
  id: string
  companyId: string
  userId?: string
  
  // Personal info
  firstName: string
  lastName: string
  email: string
  phone: string
  mobile?: string
  jobTitle: string
  department?: string
  role: ContactRole
  
  // Social/professional
  linkedinUrl?: string
  avatarUrl?: string
  
  // Preferences
  preferredLanguage: 'AR' | 'FR' | 'EN'
  preferredContactMethod: 'EMAIL' | 'PHONE' | 'WHATSAPP'
  timezone: string
  
  // Tags & Notes
  tags: string[]
  notes: string
  
  // Relations
  createdAt: Date
  updatedAt: Date
  lastInteractionAt?: Date
}

export interface CRMLead {
  id: string
  leadNumber: string
  
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
  
  // Contact person (primary)
  primaryContactId: string
  
  // Pipeline
  status: LeadStatus
  pipelineStage: string
  estimatedValue: number
  currency: string
  probability: number
  expectedCloseDate: Date
  
  // Assignment
  assignedTo: string
  teamId?: string
  
  // Products/Services of interest
  interestedCategories: string[]
  interestedProducts: string[]
  specificRequirements?: string
  
  // Scoring
  leadScore: number
  engagementScore: number
  
  // Conversion
  convertedToCompanyId?: string
  convertedToOrderId?: string
  convertedAt?: Date
  
  // Loss analysis (if lost)
  lostReason?: string
  lostToCompetitor?: string
  
  createdAt: Date
  updatedAt: Date
}

export interface CRMTask {
  id: string
  leadId?: string
  contactId?: string
  companyId: string
  
  title: string
  description: string
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'FOLLOW_UP' | 'PROPOSAL' | 'DEMO' | 'REMINDER' | 'OTHER'
  priority: TaskPriority
  status: TaskStatus
  
  dueDate: Date
  dueTime?: string
  completedAt?: Date
  
  assignedTo: string
  createdBy: string
  
  // Reminders
  remindBefore: number
  reminderSent: boolean
  
  // Result
  resultNotes?: string
  outcome?: string
  
  createdAt: Date
  updatedAt: Date
}

export interface CRMInteraction {
  id: string
  contactId: string
  leadId?: string
  companyId: string
  
  type: InteractionType
  direction: InteractionDirection
  
  subject: string
  content: string
  
  // Metadata
  duration?: number
  channel?: string
  
  // Outcomes
  sentiment?: SentimentType
  nextSteps?: string
  
  // Attachments
  attachmentUrls: string[]
  
  // Automation
  automated: boolean
  triggeredBy?: string
  
  createdBy: string
  createdAt: Date
}

export interface CRMPipeline {
  id: string
  name: string
  description: string
  stages: PipelineStage[]
  defaultLeadStatus: LeadStatus
  
  isPublic: boolean
  allowedRoles: string[]
  
  autoAdvanceRules: AutoAdvanceRule[]
  
  createdAt: Date
  updatedAt: Date
}

export interface PipelineStage {
  id: string
  name: string
  nameAr: string
  nameFr: string
  order: number
  color: string
  probability: number
  
  requiredFields: string[]
  timeInStageLimit?: number
}

export interface CRMSegment {
  id: string
  name: string
  description: string
  filters: SegmentFilter[]
  contactCount: number
  lastCalculated: Date
  createdAt: Date
}

export interface SegmentFilter {
  field: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'inRange' | 'isEmpty' | 'isNotEmpty'
  value: any
}

export interface AutoAdvanceRule {
  id: string
  fromStage: string
  toStage: string
  conditions: Condition[]
}

export interface Condition {
  field: string
  operator: string
  value: any
}

export interface CRMAutomationRule {
  id: string
  name: string
  eventType: string
  conditions: Condition[]
  actions: AutomationAction[]
  enabled: boolean
  lastTriggeredAt?: Date
  executionCount: number
  createdAt: Date
  updatedAt: Date
}

export interface AutomationAction {
  type: 'SEND_EMAIL' | 'CREATE_TASK' | 'UPDATE_LEAD' | 'SEND_NOTIFICATION' | 'WEBHOOK' | 'ADD_TAG'
  config: Record<string, any>
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SentimentResult {
  sentiment: SentimentType
  confidence: number
  keywords: string[]
  summary: string
}

export interface LeadScoreFactors {
  engagement: number
  fit: number
  urgency: number
  budget: number
  authority: number
}

// ============================================
// CONTACT FUNCTIONS
// ============================================

export async function createContact(data: {
  companyId: string
  userId?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  mobile?: string
  jobTitle: string
  department?: string
  role?: ContactRole
  linkedinUrl?: string
  avatarUrl?: string
  preferredLanguage?: 'AR' | 'FR' | 'EN'
  preferredContactMethod?: 'EMAIL' | 'PHONE' | 'WHATSAPP'
  timezone?: string
  tags?: string[]
  notes?: string
}): Promise<CRMContact> {
  const contact = await db.cRMContact.create({
    data: {
      id: uuidv4(),
      companyId: data.companyId,
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      jobTitle: data.jobTitle,
      department: data.department,
      role: data.role || 'DECISION_MAKER',
      linkedinUrl: data.linkedinUrl,
      avatarUrl: data.avatarUrl,
      preferredLanguage: data.preferredLanguage || 'FR',
      preferredContactMethod: data.preferredContactMethod || 'EMAIL',
      timezone: data.timezone || 'Africa/Algiers',
      tags: JSON.stringify(data.tags || []),
      notes: data.notes,
    },
  })
  
  return mapContactFromDB(contact)
}

export async function updateContact(
  id: string,
  data: Partial<{
    firstName: string
    lastName: string
    email: string
    phone: string
    mobile: string
    jobTitle: string
    department: string
    role: ContactRole
    linkedinUrl: string
    avatarUrl: string
    preferredLanguage: 'AR' | 'FR' | 'EN'
    preferredContactMethod: 'EMAIL' | 'PHONE' | 'WHATSAPP'
    timezone: string
    tags: string[]
    notes: string
  }>
): Promise<CRMContact> {
  const updateData: any = { ...data }
  
  if (data.tags) {
    updateData.tags = JSON.stringify(data.tags)
  }
  
  const contact = await db.cRMContact.update({
    where: { id },
    data: updateData,
  })
  
  return mapContactFromDB(contact)
}

export async function mergeContacts(
  primaryId: string,
  secondaryIds: string[]
): Promise<CRMContact> {
  const primary = await db.cRMContact.findUnique({ where: { id: primaryId } })
  if (!primary) throw new Error('Primary contact not found')
  
  // Get all secondary contacts
  const secondaries = await db.cRMContact.findMany({
    where: { id: { in: secondaryIds } },
  })
  
  // Merge tags
  const primaryTags = JSON.parse(primary.tags || '[]') as string[]
  const allTags = new Set(primaryTags)
  
  for (const secondary of secondaries) {
    const secTags = JSON.parse(secondary.tags || '[]') as string[]
    secTags.forEach(tag => allTags.add(tag))
    
    // Merge notes
    if (secondary.notes) {
      primary.notes = primary.notes 
        ? `${primary.notes}\n\n--- Merged from ${secondary.firstName} ${secondary.lastName} ---\n${secondary.notes}`
        : secondary.notes
    }
    
    // Move interactions to primary
    await db.cRMInteraction.updateMany({
      where: { contactId: secondary.id },
      data: { contactId: primaryId },
    })
    
    // Move tasks to primary
    await db.cRMTask.updateMany({
      where: { contactId: secondary.id },
      data: { contactId: primaryId },
    })
    
    // Delete secondary
    await db.cRMContact.delete({ where: { id: secondary.id } })
  }
  
  // Update primary with merged data
  const updated = await db.cRMContact.update({
    where: { id: primaryId },
    data: {
      tags: JSON.stringify(Array.from(allTags)),
      notes: primary.notes,
    },
  })
  
  return mapContactFromDB(updated)
}

export async function searchContacts(
  query: string,
  filters?: {
    companyId?: string
    role?: ContactRole
    tags?: string[]
    hasInteractionsSince?: Date
  },
  options?: {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
): Promise<PaginatedResult<CRMContact>> {
  const page = options?.page || 1
  const pageSize = options?.pageSize || 20
  const skip = (page - 1) * pageSize
  
  const where: any = {
    OR: [
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { jobTitle: { contains: query, mode: 'insensitive' } },
      { company: { name: { contains: query, mode: 'insensitive' } } },
    ],
  }
  
  if (filters?.companyId) {
    where.companyId = filters.companyId
  }
  
  if (filters?.role) {
    where.role = filters.role
  }
  
  if (filters?.tags && filters.tags.length > 0) {
    // SQLite JSON search for tags containing any of the filter tags
    where.OR = filters.tags.map(tag => ({
      tags: { contains: tag },
    }))
  }
  
  if (filters?.hasInteractionsSince) {
    where.lastInteractionAt = { gte: filters.hasInteractionsSince }
  }
  
  const [contacts, total] = await Promise.all([
    db.cRMContact.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        [(options?.sortBy || 'createdAt')]: options?.sortOrder || 'desc',
      },
      include: {
        _count: { select: { interactions: true } },
      },
    }),
    db.cRMContact.count({ where }),
  ])
  
  return {
    data: contacts.map(mapContactFromDB),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getContactInteractions(contactId: string): Promise<CRMInteraction[]> {
  const interactions = await db.cRMInteraction.findMany({
    where: { contactId },
    orderBy: { createdAt: 'desc' },
    include: {
      lead: true,
    },
  })
  
  return interactions.map(mapInteractionFromDB)
}

export async function enrichContact(contactId: string): Promise<CRMContact> {
  const contact = await db.cRMContact.findUnique({ where: { id: contactId } })
  if (!contact) throw new Error('Contact not found')
  
  // Simulate enrichment from public data sources
  // In production, this would call external APIs like LinkedIn, Clearbit, etc.
  const enrichmentData: any = {}
  
  // Check if we can infer industry from job title
  const techKeywords = ['CTO', 'CIO', 'IT', 'Developer', 'Engineer', 'Technical', 'Tech']
  const financeKeywords = ['CFO', 'Finance', 'Accountant', 'Financial', 'Controller']
  
  if (techKeywords.some(kw => contact.jobTitle.includes(kw))) {
    enrichmentData.role = 'TECHNICAL'
  } else if (financeKeywords.some(kw => contact.jobTitle.includes(kw))) {
    enrichmentData.role = 'FINANCIAL'
  }
  
  // Update with enrichment data
  if (Object.keys(enrichmentData).length > 0) {
    const updated = await db.cRMContact.update({
      where: { id: contactId },
      data: enrichmentData,
    })
    return mapContactFromDB(updated)
  }
  
  return mapContactFromDB(contact)
}

// ============================================
// LEAD FUNCTIONS
// ============================================

export async function createLead(data: {
  source: LeadSource
  sourceDetails?: string
  campaignId?: string
  companyName: string
  industry?: string
  companySize?: string
  website?: string
  wilaya?: string
  city?: string
  primaryContactId: string
  pipelineStage: string
  estimatedValue: number
  currency?: string
  expectedCloseDate: Date
  assignedTo: string
  teamId?: string
  interestedCategories?: string[]
  interestedProducts?: string[]
  specificRequirements?: string
  companyId: string
}): Promise<CRMLead> {
  // Generate lead number
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const count = await db.cRMLead.count({
    where: {
      leadNumber: { startsWith: `LED-${dateStr}` },
    },
  })
  const leadNumber = `LED-${dateStr}-${String(count + 1).padStart(4, '0')}`
  
  // Calculate initial score
  const initialScore = calculateInitialLeadScore(data)
  
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
      primaryContactId: data.primaryContactId,
      status: 'NEW',
      pipelineStage: data.pipelineStage,
      estimatedValue: data.estimatedValue,
      currency: data.currency || 'DZD',
      probability: getProbabilityForStage(data.pipelineStage),
      expectedCloseDate: data.expectedCloseDate,
      assignedTo: data.assignedTo,
      teamId: data.teamId,
      interestedCategories: JSON.stringify(data.interestedCategories || []),
      interestedProducts: JSON.stringify(data.interestedProducts || []),
      specificRequirements: data.specificRequirements,
      leadScore: initialScore,
      engagementScore: 0,
    },
  })
  
  return mapLeadFromDB(lead)
}

function calculateInitialLeadScore(data: any): number {
  let score = 20 // Base score
  
  // Source scoring
  const sourceScores: Record<string, number> = {
    REFERRAL: 25,
    TRADE_SHOW: 20,
    WEBSITE: 15,
    RFQ: 30,
    EMAIL: 10,
    COLD_CALL: 5,
    SOCIAL_MEDIA: 12,
    PARTNER: 22,
  }
  score += sourceScores[data.source] || 10
  
  // Company size scoring
  const sizeScores: Record<string, number> = {
    '500+': 20,
    '201-500': 18,
    '51-200': 15,
    '11-50': 10,
    '1-10': 5,
  }
  score += sizeScores[data.companySize] || 5
  
  // Value scoring
  if (data.estimatedValue >= 1000000) score += 20
  else if (data.estimatedValue >= 500000) score += 15
  else if (data.estimatedValue >= 100000) score += 10
  else if (data.estimatedValue >= 10000) score += 5
  
  return Math.min(score, 100)
}

function getProbabilityForStage(stage: string): number {
  const stageProbabilities: Record<string, number> = {
    NEW: 10,
    CONTACTED: 20,
    QUALIFIED: 35,
    PROPOSAL: 50,
    NEGOTIATION: 70,
    WON: 100,
    LOST: 0,
  }
  return stageProbabilities[stage] || 10
}

export async function updateLeadStage(leadId: string, stage: string): Promise<CRMLead> {
  const lead = await db.cRMLead.update({
    where: { id: leadId },
    data: {
      pipelineStage: stage,
      probability: getProbabilityForStage(stage),
      status: getLeadStatusFromStage(stage),
    },
  })
  
  return mapLeadFromDB(lead)
}

function getLeadStatusFromStage(stage: string): LeadStatus {
  if (stage === 'WON') return 'WON'
  if (stage === 'LOST') return 'LOST'
  if (['NEGOTIATION', 'PROPOSAL'].includes(stage)) return 'NEGOTIATION'
  if (stage === 'QUALIFIED') return 'QUALIFIED'
  if (stage === 'CONTACTED') return 'CONTACTED'
  return 'NEW'
}

export async function convertLeadToCompany(leadId: string): Promise<{company: any; contact: CRMContact}> {
  const lead = await db.cRMLead.findUnique({
    where: { id: leadId },
    include: { interactions: true },
  })
  
  if (!lead) throw new Error('Lead not found')
  if (lead.convertedToCompanyId) throw new Error('Lead already converted')
  
  // In a real implementation, this would create a Company record
  // For now, we'll simulate it and update the lead
  const mockCompanyId = `conv_${lead.id}_${Date.now()}`
  
  await db.cRMLead.update({
    where: { id: leadId },
    data: {
      convertedToCompanyId: mockCompanyId,
      convertedAt: new Date(),
      status: 'WON',
      pipelineStage: 'WON',
      probability: 100,
    },
  })
  
  // Get the primary contact
  const contact = await db.cRMContact.findUnique({
    where: { id: lead.primaryContactId },
  })
  
  return {
    company: { id: mockCompanyId, name: lead.companyName },
    contact: contact ? mapContactFromDB(contact) : null!,
  }
}

export async function qualifyLead(leadId: string, additionalScore?: number): Promise<CRMLead> {
  const lead = await db.cRMLead.findUnique({ where: { id: leadId } })
  if (!lead) throw new Error('Lead not found')
  
  const newScore = Math.min(100, lead.leadScore + (additionalScore || 10))
  
  const updated = await db.cRMLead.update({
    where: { id: leadId },
    data: {
      leadScore: newScore,
      status: newScore >= 50 ? 'QUALIFIED' : lead.status,
      pipelineStage: newScore >= 50 ? 'QUALIFIED' : lead.pipelineStage,
    },
  })
  
  return mapLeadFromDB(updated)
}

export async function assignLead(leadId: string, userId: string): Promise<CRMLead> {
  const lead = await db.cRMLead.update({
    where: { id: leadId },
    data: { assignedTo: userId },
  })
  
  return mapLeadFromDB(lead)
}

export async function calculateLeadScore(leadId: string): Promise<number> {
  const lead = await db.cRMLead.findUnique({
    where: { id: leadId },
    include: {
      interactions: true,
      tasks: true,
    },
  })
  
  if (!lead) throw new Error('Lead not found')
  
  let score = 20 // Base score
  
  // Engagement factors
  const interactionCount = lead.interactions.length
  score += Math.min(interactionCount * 3, 25)
  
  // Recent activity boost
  const recentInteractions = lead.interactions.filter(
    i => new Date(i.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )
  score += recentInteractions.length * 2
  
  // Completed tasks show progress
  const completedTasks = lead.tasks.filter(t => t.status === 'COMPLETED')
  score += completedTasks.length * 5
  
  // Value factor
  if (lead.estimatedValue >= 1000000) score += 15
  else if (lead.estimatedValue >= 100000) score += 8
  
  // Update the lead
  await db.cRMLead.update({
    where: { id: leadId },
    data: {
      leadScore: Math.min(score, 100),
      engagementScore: Math.min(interactionCount * 10 + completedTasks.length * 15, 100),
    },
  })
  
  return Math.min(score, 100)
}

export async function getLeadsByPipeline(
  pipelineId: string,
  filters?: {
    status?: LeadStatus
    assignedTo?: string
    dateFrom?: Date
    dateTo?: Date
  }
): Promise<CRMLead[]> {
  const pipeline = await db.cRMPipeline.findUnique({ where: { id: pipelineId } })
  if (!pipeline) throw new Error('Pipeline not found')
  
  const where: any = {}
  
  if (filters?.status) {
    where.status = filters.status
  }
  
  if (filters?.assignedTo) {
    where.assignedTo = filters.assignedTo
  }
  
  if (filters?.dateFrom || filters?.dateTo) {
    where.expectedCloseDate = {}
    if (filters.dateFrom) where.expectedCloseDate.gte = filters.dateFrom
    if (filters.dateTo) where.expectedCloseDate.lte = filters.dateTo
  }
  
  const leads = await db.cRMLead.findMany({
    where,
    orderBy: [{ probability: 'desc' }, { expectedCloseDate: 'asc' }],
  })
  
  return leads.map(mapLeadFromDB)
}

export async function predictConversionProbability(leadId: string): Promise<number> {
  const lead = await db.cRMLead.findUnique({
    where: { id: leadId },
    include: { interactions: true, tasks: true },
  })
  
  if (!lead) throw new Error('Lead not found')
  
  // ML-style prediction based on historical patterns
  // This is a simplified version - in production, use actual ML model
  let probability = lead.probability
  
  // Adjust based on engagement velocity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentInteractions = lead.interactions.filter(i => 
    new Date(i.createdAt) > thirtyDaysAgo
  )
  
  if (recentInteractions.length >= 5) probability += 10
  else if (recentInteractions.length >= 3) probability += 5
  else if (recentInteractions.length === 0) probability -= 10
  
  // Adjust based on task completion rate
  const totalTasks = lead.tasks.length
  const completedTasks = lead.tasks.filter(t => t.status === 'COMPLETED').length
  if (totalTasks > 0) {
    const completionRate = completedTasks / totalTasks
    probability += completionRate * 15
  }
  
  // Time-based decay
  const daysUntilClose = Math.ceil(
    (new Date(lead.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysUntilClose < 0) {
    probability -= 20 // Overdue
  } else if (daysUntilClose < 7) {
    probability += 5 // Urgency
  }
  
  return Math.max(0, Math.min(100, probability))
}

// ============================================
// TASK FUNCTIONS
// ============================================

export async function createTask(data: {
  leadId?: string
  contactId?: string
  companyId: string
  title: string
  description: string
  type?: 'CALL' | 'EMAIL' | 'MEETING' | 'FOLLOW_UP' | 'PROPOSAL' | 'DEMO' | 'REMINDER' | 'OTHER'
  priority?: TaskPriority
  dueDate: Date
  dueTime?: string
  assignedTo: string
  createdBy: string
  remindBefore?: number
}): Promise<CRMTask> {
  const task = await db.cRMTask.create({
    data: {
      id: uuidv4(),
      leadId: data.leadId,
      contactId: data.contactId,
      companyId: data.companyId,
      title: data.title,
      description: data.description,
      type: data.type || 'OTHER',
      priority: data.priority || 'MEDIUM',
      status: 'TODO',
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      assignedTo: data.assignedTo,
      createdBy: data.createdBy,
      remindBefore: data.remindBefore || 60,
      reminderSent: false,
    },
  })
  
  return mapTaskFromDB(task)
}

export async function completeTask(taskId: string, result: {notes?: string; outcome?: string}): Promise<CRMTask> {
  const task = await db.cRMTask.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      resultNotes: result.notes,
      outcome: result.outcome,
    },
  })
  
  return mapTaskFromDB(task)
}

export async function getOverdueTasks(userId: string): Promise<CRMTask[]> {
  const now = new Date()
  
  const tasks = await db.cRMTask.findMany({
    where: {
      assignedTo: userId,
      status: { in: ['TODO', 'IN_PROGRESS'] },
      dueDate: { lt: now },
    },
    orderBy: { dueDate: 'asc' },
  })
  
  return tasks.map(mapTaskFromDB)
}

export async function getTasksToday(userId: string): Promise<CRMTask[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const tasks = await db.cRMTask.findMany({
    where: {
      assignedTo: userId,
      dueDate: { gte: today, lt: tomorrow },
    },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
  })
  
  return tasks.map(mapTaskFromDB)
}

export async function autoGenerateFollowUpTasks(leadId: string): Promise<CRMTask[]> {
  const lead = await db.cRMLead.findUnique({
    where: { id: leadId },
    include: { interactions: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  
  if (!lead) throw new Error('Lead not found')
  
  const lastInteraction = lead.interactions[0]
  if (!lastInteraction) return []
  
  const tasks: CRMTask[] = []
  const now = new Date()
  
  // Generate follow-up based on last interaction type
  switch (lastInteraction.type) {
    case 'CALL':
      // Send follow-up email after 24 hours
      tasks.push(await createTask({
        leadId,
        companyId: lead.assignedTo, // Using assignedTo as companyId for context
        title: `Send follow-up email after call`,
        description: `Follow up on call with ${lead.companyName}. Last discussed: ${lastInteraction.subject}`,
        type: 'EMAIL',
        priority: 'HIGH',
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        assignedTo: lead.assignedTo,
        createdBy: 'system',
      }))
      break
      
    case 'MEETING':
      // Send meeting summary within 4 hours
      tasks.push(await createTask({
        leadId,
        companyId: lead.assignedTo,
        title: `Send meeting summary`,
        description: `Send meeting summary to ${lead.companyName} regarding: ${lastInteraction.subject}`,
        type: 'EMAIL',
        priority: 'HIGH',
        dueDate: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        assignedTo: lead.assignedTo,
        createdBy: 'system',
      }))
      
      // Schedule next meeting in 1 week
      tasks.push(await createTask({
        leadId,
        companyId: lead.assignedTo,
        title: `Schedule follow-up meeting`,
        description: `Schedule follow-up meeting with ${lead.companyName}`,
        type: 'MEETING',
        priority: 'MEDIUM',
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        assignedTo: lead.assignedTo,
        createdBy: 'system',
      }))
      break
      
    case 'QUOTE_SENT':
      // Follow up on quote after 3 days
      tasks.push(await createTask({
        leadId,
        companyId: lead.assignedTo,
        title: `Follow up on quote`,
        description: `Check if ${lead.companyName} has questions about the quote sent`,
        type: 'FOLLOW_UP',
        priority: 'HIGH',
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        assignedTo: lead.assignedTo,
        createdBy: 'system',
      }))
      break
      
    default:
      // Generic follow-up after 48 hours
      tasks.push(await createTask({
        leadId,
        companyId: lead.assignedTo,
        title: `General follow-up`,
        description: `Follow up with ${lead.companyName}`,
        type: 'FOLLOW_UP',
        priority: 'MEDIUM',
        dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        assignedTo: lead.assignedTo,
        createdBy: 'system',
      }))
  }
  
  return tasks
}

// ============================================
// INTERACTION FUNCTIONS
// ============================================

export async function logInteraction(data: {
  contactId: string
  leadId?: string
  companyId: string
  type: InteractionType
  direction: InteractionDirection
  subject: string
  content: string
  duration?: number
  channel?: string
  sentiment?: SentimentType
  nextSteps?: string
  attachmentUrls?: string[]
  automated?: boolean
  triggeredBy?: string
  createdBy: string
}): Promise<CRMInteraction> {
  const interaction = await db.cRMInteraction.create({
    data: {
      id: uuidv4(),
      contactId: data.contactId,
      leadId: data.leadId,
      companyId: data.companyId,
      type: data.type,
      direction: data.direction,
      subject: data.subject,
      content: data.content,
      duration: data.duration,
      channel: data.channel,
      sentiment: data.sentiment,
      nextSteps: data.nextSteps,
      attachmentUrls: JSON.stringify(data.attachmentUrls || []),
      automated: data.automated || false,
      triggeredBy: data.triggeredBy,
      createdBy: data.createdBy,
    },
  })
  
  // Update contact's last interaction timestamp
  await db.cRMContact.update({
    where: { id: data.contactId },
    data: { lastInteractionAt: new Date() },
  })
  
  // If linked to lead, recalculate lead score
  if (data.leadId) {
    await calculateLeadScore(data.leadId)
  }
  
  return mapInteractionFromDB(interaction)
}

export async function getInteractionTimeline(
  entityId: string,
  entityType: 'contact' | 'lead'
): Promise<CRMInteraction[]> {
  const where: any = entityType === 'contact' 
    ? { contactId: entityId }
    : { leadId: entityId }
  
  const interactions = await db.cRMInteraction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      contact: true,
      lead: true,
    },
  })
  
  return interactions.map(mapInteractionFromDB)
}

export async function extractActionItems(interactionId: string): Promise<string[]> {
  const interaction = await db.cRMInteraction.findUnique({
    where: { id: interactionId },
  })
  
  if (!interaction) throw new Error('Interaction not found')
  
  // AI-powered action item extraction
  // In production, this would use NLP/AI services
  const actionItems: string[] = []
  const content = `${interaction.subject} ${interaction.content}`.toLowerCase()
  
  // Pattern matching for common action items
  const patterns = [
    { regex: /call\s+(back|again|tomorrow|next week)/gi, template: 'Make follow-up call' },
    { regex: /send\s+(email|quote|proposal|invoice)/gi, template: 'Send $1' },
    { regex: /schedule\s+(meeting|call|demo)/gi, template: 'Schedule $1' },
    { regex: /follow\s*up/gi, template: 'Follow up on discussion' },
    { regex: /prepare\s+(proposal|quote|contract)/gi, template: 'Prepare $1' },
    { regex: /review\s+(documents|specs|requirements)/gi, template: 'Review $1' },
    { regex: /will\s+(get back|respond|confirm|send)/gi, template: 'Wait for response' },
  ]
  
  for (const pattern of patterns) {
    const matches = content.match(pattern.regex)
    if (matches) {
      const item = pattern.template.replace('$1', matches[0].split(' ')[1] || '')
      actionItems.push(item)
    }
  }
  
  // Extract dates mentioned
  const dateMatches = content.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi)
  if (dateMatches) {
    actionItems.push(`Note: Action planned for ${dateMatches[0]}`)
  }
  
  return [...new Set(actionItems)] // Remove duplicates
}

export async function sentimentAnalysis(interactionId: string): Promise<SentimentResult> {
  const interaction = await db.cRMInteraction.findUnique({
    where: { id: interactionId },
  })
  
  if (!interaction) throw new Error('Interaction not found')
  
  // Simple keyword-based sentiment analysis
  // In production, use proper NLP service
  const positiveWords = [
    'happy', 'great', 'excellent', 'interested', 'love', 'perfect',
    'good', 'amazing', 'wonderful', 'fantastic', 'excited', 'pleased',
    'content', 'satisfied', 'impressed', 'confident', 'definitely', 'yes',
    'heureux', 'excellent', 'intéressé', 'parfait', 'bon', 'génial',
    'merveilleux', 'fantastique', 'excité', 'satisfait', 'impressionné',
  ]
  
  const negativeWords = [
    'unhappy', 'disappointed', 'frustrated', 'angry', 'terrible', 'bad',
    'poor', 'worst', 'hate', 'issue', 'problem', 'concern', 'wrong',
    'expensive', 'expensive', 'no', 'not interested', 'maybe later',
    'mécontent', 'déçu', 'frustré', 'colère', 'terrible', 'mauvais',
    'problème', 'préoccupation', 'trop cher', 'pas intéressé',
  ]
  
  const content = `${interaction.subject} ${interaction.content}`.toLowerCase()
  
  let positiveCount = 0
  let negativeCount = 0
  const foundKeywords: string[] = []
  
  for (const word of positiveWords) {
    if (content.includes(word)) {
      positiveCount++
      foundKeywords.push(word)
    }
  }
  
  for (const word of negativeWords) {
    if (content.includes(word)) {
      negativeCount++
      foundKeywords.push(word)
    }
  }
  
  const total = positiveCount + negativeCount
  let sentiment: SentimentType = 'NEUTRAL'
  let confidence = 0.5
  
  if (total > 0) {
    confidence = Math.abs(positiveCount - negativeCount) / total
    
    if (positiveCount > negativeCount) {
      sentiment = 'POSITIVE'
      confidence = 0.5 + (confidence * 0.5)
    } else if (negativeCount > positiveCount) {
      sentiment = 'NEGATIVE'
      confidence = 0.5 + (confidence * 0.5)
    }
  }
  
  // Store sentiment in interaction
  await db.cRMInteraction.update({
    where: { id: interactionId },
    data: { sentiment },
  })
  
  return {
    sentiment,
    confidence,
    keywords: [...new Set(foundKeywords)],
    summary: generateSentimentSummary(sentiment, foundKeywords),
  }
}

function generateSentimentSummary(sentiment: SentimentType, keywords: string[]): string {
  switch (sentiment) {
    case 'POSITIVE':
      return `The interaction shows positive indicators (${keywords.slice(0, 3).join(', ')})`
    case 'NEGATIVE':
      return `Concerns detected in interaction (${keywords.slice(0, 3).join(', ')})`
    default:
      return 'Neutral tone detected, no strong sentiment indicators'
  }
}

// ============================================
// AUTOMATION FUNCTIONS
// ============================================

export async function createAutomationRule(rule: Omit<CRMAutomationRule, 'id' | 'executionCount' | 'createdAt' | 'updatedAt'>): Promise<CRMAutomationRule> {
  const created = await db.cRMAutomationRule.create({
    data: {
      id: uuidv4(),
      name: rule.name,
      eventType: rule.eventType,
      conditions: JSON.stringify(rule.conditions),
      actions: JSON.stringify(rule.actions),
      enabled: rule.enabled,
      executionCount: 0,
    },
  })
  
  return {
    ...created,
    conditions: rule.conditions,
    actions: rule.actions,
  }
}

export async function triggerAutomation(eventType: string, payload: Record<string, any>): Promise<void> {
  // Find all rules that match this event type
  const rules = await db.cRMAutomationRule.findMany({
    where: {
      eventType,
      enabled: true,
    },
  })
  
  for (const rule of rules) {
    const conditions = JSON.parse(rule.conditions || '[]')
    
    // Check if all conditions are met
    const conditionsMet = conditions.every((condition: Condition) => {
      return evaluateCondition(condition, payload)
    })
    
    if (conditionsMet) {
      const actions = JSON.parse(rule.actions || '[]')
      
      // Execute each action
      for (const action of actions) {
        await executeAction(action, payload)
      }
      
      // Update rule stats
      await db.cRMAutomationRule.update({
        where: { id: rule.id },
        data: {
          lastTriggeredAt: new Date(),
          executionCount: { increment: 1 },
        },
      })
    }
  }
}

function evaluateCondition(condition: Condition, payload: Record<string, any>): boolean {
  const value = getNestedValue(payload, condition.field)
  
  switch (condition.operator) {
    case 'equals':
      return value === condition.value
    case 'notEquals':
      return value !== condition.value
    case 'contains':
      return typeof value === 'string' && value.includes(condition.value)
    case 'greaterThan':
      return Number(value) > condition.value
    case 'lessThan':
      return Number(value) < condition.value
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(value)
    case 'exists':
      return value !== undefined && value !== null
    default:
      return false
  }
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

async function executeAction(action: AutomationAction, payload: Record<string, any>): Promise<void> {
  switch (action.type) {
    case 'SEND_EMAIL':
      // Would integrate with email service
      console.log('Sending email:', action.config, payload)
      break
      
    case 'CREATE_TASK':
      if (payload.leadId) {
        await createTask({
          leadId: payload.leadId,
          companyId: payload.companyId || action.config.companyId,
          title: action.config.title || 'Automated task',
          description: action.config.description || '',
          type: action.config.taskType || 'OTHER',
          priority: action.config.priority || 'MEDIUM',
          dueDate: new Date(Date.now() + (action.config.dueInHours || 24) * 60 * 60 * 1000),
          assignedTo: action.config.assignedTo || payload.assignedTo,
          createdBy: 'automation',
        })
      }
      break
      
    case 'UPDATE_LEAD':
      if (payload.leadId) {
        await db.cRMLead.update({
          where: { id: payload.leadId },
          data: action.config.updates || {},
        })
      }
      break
      
    case 'SEND_NOTIFICATION':
      // Would integrate with notification service
      console.log('Sending notification:', action.config, payload)
      break
      
    case 'WEBHOOK':
      // Would make HTTP request to webhook URL
      console.log('Calling webhook:', action.config.url, payload)
      break
      
    case 'ADD_TAG':
      if (payload.contactId) {
        const contact = await db.cRMContact.findUnique({
          where: { id: payload.contactId },
        })
        if (contact) {
          const tags = JSON.parse(contact.tags || '[]')
          if (!tags.includes(action.config.tag)) {
            tags.push(action.config.tag)
            await db.cRMContact.update({
              where: { id: payload.contactId },
              data: { tags: JSON.stringify(tags) },
            })
          }
        }
      }
      break
  }
}

export async function executeDripCampaign(campaignId: string, contactId: string): Promise<void> {
  // Get campaign configuration
  // In production, this would fetch from a campaigns table
  const campaignSteps = [
    { delay: 0, type: 'EMAIL', subject: 'Welcome!', template: 'welcome' },
    { delay: 24 * 60 * 60 * 1000, type: 'EMAIL', subject: 'Learn more', template: 'info' },
    { delay: 3 * 24 * 60 * 60 * 1000, type: 'EMAIL', subject: 'Special offer', template: 'offer' },
    { delay: 7 * 24 * 60 * 60 * 1000, type: 'EMAIL', subject: 'Final follow-up', template: 'final' },
  ]
  
  for (const step of campaignSteps) {
    const scheduledFor = new Date(Date.now() + step.delay)
    
    // Create a task for each step (or directly send if immediate)
    if (step.delay === 0) {
      await logInteraction({
        contactId,
        companyId: '',
        type: 'EMAIL',
        direction: 'OUTBOUND',
        subject: step.subject,
        content: `Drip campaign email: ${step.template}`,
        automated: true,
        triggeredBy: campaignId,
        createdBy: 'automation',
      })
    } else {
      await createTask({
        contactId,
        companyId: '',
        title: `Send drip email: ${step.subject}`,
        description: `Campaign: ${campaignId}, Template: ${step.template}`,
        type: 'EMAIL',
        priority: 'LOW',
        dueDate: scheduledFor,
        assignedTo: 'automation',
        createdBy: 'system',
      })
    }
  }
}

// ============================================
// PIPELINE & SEGMENT FUNCTIONS
// ============================================

export async function getPipelines(): Promise<CRMPipeline[]> {
  const pipelines = await db.cRMPipeline.findMany({
    orderBy: { createdAt: 'desc' },
  })
  
  return pipelines.map(p => ({
    ...p,
    stages: JSON.parse(p.stages || '[]'),
    allowedRoles: JSON.parse(p.allowedRoles || '[]'),
    autoAdvanceRules: JSON.parse(p.autoAdvanceRules || '[]'),
  }))
}

export async function createPipeline(data: {
  name: string
  description?: string
  stages: PipelineStage[]
  defaultLeadStatus?: LeadStatus
  isPublic?: boolean
  allowedRoles?: string[]
  autoAdvanceRules?: AutoAdvanceRule[]
}): Promise<CRMPipeline> {
  const pipeline = await db.cRMPipeline.create({
    data: {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      stages: JSON.stringify(data.stages),
      defaultLeadStatus: data.defaultLeadStatus || 'NEW',
      isPublic: data.isPublic ?? true,
      allowedRoles: JSON.stringify(data.allowedRoles || []),
      autoAdvanceRules: JSON.stringify(data.autoAdvanceRules || []),
    },
  })
  
  return {
    ...pipeline,
    stages: data.stages,
    allowedRoles: data.allowedRoles || [],
    autoAdvanceRules: data.autoAdvanceRules || [],
  }
}

export async function getSegments(): Promise<CRMSegment[]> {
  const segments = await db.cRMSegment.findMany({
    orderBy: { createdAt: 'desc' },
  })
  
  return segments.map(s => ({
    ...s,
    filters: JSON.parse(s.filters || '[]'),
  }))
}

export async function createSegment(data: {
  name: string
  description?: string
  filters: SegmentFilter[]
}): Promise<CRMSegment> {
  // Calculate initial contact count
  const segment = await db.cRMSegment.create({
    data: {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      filters: JSON.stringify(data.filters),
      contactCount: 0,
      lastCalculated: new Date(),
    },
  })
  
  return {
    ...segment,
    filters: data.filters,
  }
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getCRMStats(companyId?: string, userId?: string): Promise<{
  totalContacts: number
  totalLeads: number
  activeLeads: number
  wonLeads: number
  lostLeads: number
  conversionRate: number
  totalPipelineValue: number
  weightedPipelineValue: number
  tasksDueToday: number
  overdueTasks: number
  interactionsThisWeek: number
  leadsBySource: Record<string, number>
  leadsByStage: Record<string, number>
}> {
  const where: any = {}
  if (companyId) where.companyId = companyId
  if (userId) where.assignedTo = userId
  
  const [
    totalContacts,
    totalLeads,
    wonLeads,
    lostLeads,
    tasksDueToday,
    overdueTasks,
    interactionsThisWeek,
    leadsBySourceRaw,
    leadsByStageRaw,
    pipelineLeads,
  ] = await Promise.all([
    db.cRMContact.count({ where: companyId ? { companyId } : {} }),
    db.cRMLead.count({ where }),
    db.cRMLead.count({ where: { ...where, status: 'WON' } }),
    db.cRMLead.count({ where: { ...where, status: 'LOST' } }),
    db.cRMTask.count({
      where: {
        ...(userId ? { assignedTo: userId } : {}),
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: new Date(new Date().setHours(23, 59, 59, 999)) },
      },
    }),
    db.cRMTask.count({
      where: {
        ...(userId ? { assignedTo: userId } : {}),
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
      },
    }),
    db.cRMInteraction.count({
      where: {
        ...(companyId ? { companyId } : {}),
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    db.cRMLead.groupBy({
      by: ['source'],
      where,
      _count: true,
    }),
    db.cRMLead.groupBy({
      by: ['pipelineStage'],
      where: { ...where, status: { notIn: ['WON', 'LOST'] } },
      _count: true,
    }),
    db.cRMLead.findMany({
      where: { ...where, status: { notIn: ['WON', 'LOST'] } },
      select: { estimatedValue: true, probability: true },
    }),
  ])
  
  const activeLeads = totalLeads - wonLeads - lostLeads
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0
  
  const totalPipelineValue = pipelineLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0)
  const weightedPipelineValue = pipelineLeads.reduce(
    (sum, lead) => sum + ((lead.estimatedValue || 0) * (lead.probability || 0) / 100),
    0
  )
  
  const leadsBySource: Record<string, number> = {}
  leadsBySourceRaw.forEach(item => {
    leadsBySource[item.source] = item._count
  })
  
  const leadsByStage: Record<string, number> = {}
  leadsByStageRaw.forEach(item => {
    leadsByStage[item.pipelineStage] = item._count
  })
  
  return {
    totalContacts,
    totalLeads,
    activeLeads,
    wonLeads,
    lostLeads,
    conversionRate: Math.round(conversionRate * 100) / 100,
    totalPipelineValue: Math.round(totalPipelineValue * 100) / 100,
    weightedPipelineValue: Math.round(weightedPipelineValue * 100) / 100,
    tasksDueToday,
    overdueTasks,
    interactionsThisWeek,
    leadsBySource,
    leadsByStage,
  }
}

// ============================================
// MAPPING HELPERS
// ============================================

function mapContactFromDB(dbContact: any): CRMContact {
  return {
    id: dbContact.id,
    companyId: dbContact.companyId,
    userId: dbContact.userId || undefined,
    firstName: dbContact.firstName,
    lastName: dbContact.lastName,
    email: dbContact.email,
    phone: dbContact.phone,
    mobile: dbContact.mobile || undefined,
    jobTitle: dbContact.jobTitle,
    department: dbContact.department || undefined,
    role: dbContact.role as ContactRole,
    linkedinUrl: dbContact.linkedinUrl || undefined,
    avatarUrl: dbContact.avatarUrl || undefined,
    preferredLanguage: dbContact.preferredLanguage as 'AR' | 'FR' | 'EN',
    preferredContactMethod: dbContact.preferredContactMethod as 'EMAIL' | 'PHONE' | 'WHATSAPP',
    timezone: dbContact.timezone,
    tags: JSON.parse(dbContact.tags || '[]'),
    notes: dbContact.notes || '',
    createdAt: dbContact.createdAt,
    updatedAt: dbContact.updatedAt,
    lastInteractionAt: dbContact.lastInteractionAt || undefined,
  }
}

function mapLeadFromDB(dbLead: any): CRMLead {
  return {
    id: dbLead.id,
    leadNumber: dbLead.leadNumber,
    source: dbLead.source as LeadSource,
    sourceDetails: dbLead.sourceDetails || undefined,
    campaignId: dbLead.campaignId || undefined,
    companyName: dbLead.companyName,
    industry: dbLead.industry || undefined,
    companySize: dbLead.companySize || undefined,
    website: dbLead.website || undefined,
    wilaya: dbLead.wilaya || undefined,
    city: dbLead.city || undefined,
    primaryContactId: dbLead.primaryContactId,
    status: dbLead.status as LeadStatus,
    pipelineStage: dbLead.pipelineStage,
    estimatedValue: parseFloat(dbLead.estimatedValue) || 0,
    currency: dbLead.currency,
    probability: dbLead.probability,
    expectedCloseDate: dbLead.expectedCloseDate,
    assignedTo: dbLead.assignedTo,
    teamId: dbLead.teamId || undefined,
    interestedCategories: JSON.parse(dbLead.interestedCategories || '[]'),
    interestedProducts: JSON.parse(dbLead.interestedProducts || '[]'),
    specificRequirements: dbLead.specificRequirements || undefined,
    leadScore: dbLead.leadScore,
    engagementScore: dbLead.engagementScore,
    convertedToCompanyId: dbLead.convertedToCompanyId || undefined,
    convertedToOrderId: dbLead.convertedToOrderId || undefined,
    convertedAt: dbLead.convertedAt || undefined,
    lostReason: dbLead.lostReason || undefined,
    lostToCompetitor: dbLead.lostToCompetitor || undefined,
    createdAt: dbLead.createdAt,
    updatedAt: dbLead.updatedAt,
  }
}

function mapTaskFromDB(dbTask: any): CRMTask {
  return {
    id: dbTask.id,
    leadId: dbTask.leadId || undefined,
    contactId: dbTask.contactId || undefined,
    companyId: dbTask.companyId,
    title: dbTask.title,
    description: dbTask.description,
    type: dbTask.type as CRMTask['type'],
    priority: dbTask.priority as TaskPriority,
    status: dbTask.status as TaskStatus,
    dueDate: dbTask.dueDate,
    dueTime: dbTask.dueTime || undefined,
    completedAt: dbTask.completedAt || undefined,
    assignedTo: dbTask.assignedTo,
    createdBy: dbTask.createdBy,
    remindBefore: dbTask.remindBefore,
    reminderSent: dbTask.reminderSent,
    resultNotes: dbTask.resultNotes || undefined,
    outcome: dbTask.outcome || undefined,
    createdAt: dbTask.createdAt,
    updatedAt: dbTask.updatedAt,
  }
}

function mapInteractionFromDB(dbInteraction: any): CRMInteraction {
  return {
    id: dbInteraction.id,
    contactId: dbInteraction.contactId,
    leadId: dbInteraction.leadId || undefined,
    companyId: dbInteraction.companyId,
    type: dbInteraction.type as InteractionType,
    direction: dbInteraction.direction as InteractionDirection,
    subject: dbInteraction.subject,
    content: dbInteraction.content,
    duration: dbInteraction.duration || undefined,
    channel: dbInteraction.channel || undefined,
    sentiment: dbInteraction.sentiment as SentimentType | undefined,
    nextSteps: dbInteraction.nextSteps || undefined,
    attachmentUrls: JSON.parse(dbInteraction.attachmentUrls || '[]'),
    automated: dbInteraction.automated,
    triggeredBy: dbInteraction.triggeredBy || undefined,
    createdBy: dbInteraction.createdBy,
    createdAt: dbInteraction.createdAt,
  }
}
