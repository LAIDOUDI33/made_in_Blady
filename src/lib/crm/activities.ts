// CRM Activities Module
// Activity logging (calls, emails, meetings, notes), timeline view, reminders, follow-up scheduling
// AlgeriaTrade.dz B2B Marketplace - CRM Integration Suite

import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { ACTIVITY_TYPES, ActivityType } from './config'

// ============================================
// TYPES
// ============================================

export type InteractionDirection = 'INBOUND' | 'OUTBOUND'
export type SentimentType = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'

export interface ActivityData {
  contactId: string
  leadId?: string
  companyId: string
  
  // Basic info
  type: ActivityType
  direction?: InteractionDirection
  
  // Content
  subject: string
  description?: string
  
  // Metadata
  durationMinutes?: number
  channel?: string  // Email, Phone, WhatsApp, In-Person, etc.
  
  // Outcomes
  sentiment?: SentimentType
  nextSteps?: string
  
  // Attachments (URLs)
  attachments?: string[]
  
  // Automation flags
  automated?: boolean
  triggeredBy?: string
  
  // User who created this activity
  createdBy: string
}

export interface Activity extends ActivityData {
  id: string
  createdAt: Date
  
  // Related entity info (populated)
  contactName?: string
  companyName?: string
  leadTitle?: string
}

export interface ActivityFilter {
  companyId?: string
  contactId?: string
  leadId?: string
  type?: ActivityType
  direction?: InteractionDirection
  sentiment?: SentimentType
  createdFrom?: Date
  createdTo?: Date
  createdBy?: string
  search?: string
}

export interface ActivityPaginationOptions {
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'type' | 'subject'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedActivities {
  data: Activity[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TimelineEntry {
  id: string
  date: Date
  type: 'activity' | 'task_completed' | 'stage_change' | 'note'
  title: string
  description?: string
  icon?: string
  color?: string
  metadata?: Record<string, any>
}

export interface ReminderConfig {
  activityId: string
  remindAt: Date
  method: 'email' | 'push' | 'sms' | 'in_app'
  message: string
  sent: boolean
}

// ============================================
// ACTIVITY CRUD OPERATIONS
// ============================================

/**
 * Log a new activity/interaction
 */
export async function logActivity(data: ActivityData): Promise<Activity> {
  const activity = await db.cRMInteraction.create({
    data: {
      id: uuidv4(),
      contactId: data.contactId,
      leadId: data.leadId,
      companyId: data.companyId,
      type: data.type.toUpperCase() as any,
      direction: data.direction || 'OUTBOUND',
      subject: data.subject,
      content: data.description || '',
      duration: data.durationMinutes,
      channel: data.channel,
      sentiment: data.sentiment,
      nextSteps: data.nextSteps,
      attachmentUrls: JSON.stringify(data.attachments || []),
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
  
  return mapActivityFromDB(activity)
}

/**
 * Get a single activity by ID
 */
export async function getActivity(id: string): Promise<Activity | null> {
  const activity = await db.cRMInteraction.findUnique({
    where: { id },
    include: {
      contact: true,
      lead: true,
    },
  })
  
  return activity ? mapActivityFromDB(activity) : null
}

/**
 * Update an activity
 */
export async function updateActivity(
  id: string,
  data: Partial<Omit<ActivityData, 'contactId' | 'companyId' | 'createdBy'>>
): Promise<Activity> {
  const existing = await db.cRMInteraction.findUnique({ where: { id } })
  if (!existing) throw new Error('Activity not found')
  
  const updateData: any = {}
  
  if (data.type !== undefined) updateData.type = data.type.toUpperCase()
  if (data.direction !== undefined) updateData.direction = data.direction
  if (data.subject !== undefined) updateData.subject = data.subject
  if (data.description !== undefined) updateData.content = data.description
  if (data.durationMinutes !== undefined) updateData.duration = data.durationMinutes
  if (data.channel !== undefined) updateData.channel = data.channel
  if (data.sentiment !== undefined) updateData.sentiment = data.sentiment
  if (data.nextSteps !== undefined) updateData.nextSteps = data.nextSteps
  if (data.attachments !== undefined) updateData.attachmentUrls = JSON.stringify(data.attachments)
  if (data.leadId !== undefined) updateData.leadId = data.leadId
  
  const updated = await db.cRMInteraction.update({
    where: { id },
    data: updateData,
  })
  
  return mapActivityFromDB(updated)
}

/**
 * Delete an activity
 */
export async function deleteActivity(id: string): Promise<void> {
  await db.cRMInteraction.delete({ where: { id } })
}

// ============================================
// ACTIVITY SEARCH & FILTERING
// ============================================

/**
 * Search activities with filters and pagination
 */
export async function searchActivities(
  filter: ActivityFilter = {},
  options: ActivityPaginationOptions = {}
): Promise<PaginatedActivities> {
  const page = options.page || 1
  const pageSize = Math.min(options.pageSize || 20, 100)
  const skip = (page - 1) * pageSize
  
  const where: any = {}
  
  // Company filter
  if (filter.companyId) {
    where.companyId = filter.companyId
  }
  
  // Contact filter
  if (filter.contactId) {
    where.contactId = filter.contactId
  }
  
  // Lead filter
  if (filter.leadId) {
    where.leadId = filter.leadId
  }
  
  // Type filter
  if (filter.type) {
    where.type = filter.type.toUpperCase()
  }
  
  // Direction filter
  if (filter.direction) {
    where.direction = filter.direction
  }
  
  // Sentiment filter
  if (filter.sentiment) {
    where.sentiment = filter.sentiment
  }
  
  // Created by filter
  if (filter.createdBy) {
    where.createdBy = filter.createdBy
  }
  
  // Search query
  if (filter.search) {
    where.OR = [
      { subject: { contains: filter.search, mode: 'insensitive' } },
      { content: { contains: filter.search, mode: 'insensitive' } },
    ]
  }
  
  // Date range filters
  if (filter.createdFrom || filter.createdTo) {
    where.createdAt = {}
    if (filter.createdFrom) where.createdAt.gte = filter.createdFrom
    if (filter.createdTo) where.createdAt.lte = filter.createdTo
  }
  
  const [activities, total] = await Promise.all([
    db.cRMInteraction.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        [(options.sortBy || 'createdAt')]: options.sortOrder || 'desc',
      },
      include: {
        contact: true,
        lead: true,
      },
    }),
    db.cRMInteraction.count({ where }),
  ])
  
  return {
    data: activities.map(mapActivityFromDB),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Get activities for a specific contact
 */
export async function getContactActivities(
  contactId: string,
  limit: number = 50
): Promise<Activity[]> {
  const activities = await db.cRMInteraction.findMany({
    where: { contactId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      lead: true,
    },
  })
  
  return activities.map(mapActivityFromDB)
}

/**
 * Get activities for a specific lead
 */
export async function getLeadActivities(
  leadId: string,
  limit: number = 50
): Promise<Activity[]> {
  const activities = await db.cRMInteraction.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      contact: true,
    },
  })
  
  return activities.map(mapActivityFromDB)
}

// ============================================
// TIMELINE VIEW
// ============================================

/**
 * Get combined timeline for an entity (contact or lead)
 */
export async function getTimeline(
  entityId: string,
  entityType: 'contact' | 'lead',
  options: {
    limit?: number
    includeTasks?: boolean
  } = {}
): Promise<TimelineEntry[]> {
  const limit = options.limit || 50
  const entries: TimelineEntry[] = []
  
  // Get activities
  const where: any = entityType === 'contact' 
    ? { contactId: entityId }
    : { leadId: entityId }
  
  const activities = await db.cRMInteraction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: entityType === 'contact' ? { lead: true } : { contact: true },
  })
  
  for (const activity of activities) {
    const typeConfig = ACTIVITY_TYPES.find(t => t.type === activity.type.toLowerCase())
    
    entries.push({
      id: activity.id,
      date: activity.createdAt,
      type: 'activity',
      title: activity.subject,
      description: activity.content || undefined,
      icon: typeConfig?.icon || 'Activity',
      color: typeConfig?.color || '#6b7280',
      metadata: {
        type: activity.type,
        direction: activity.direction,
        duration: activity.duration,
        channel: activity.channel,
        ...(activity.leadId && { leadId: activity.leadId }),
        ...(entityType === 'contact' && activity.lead && { 
          leadTitle: activity.lead.companyName 
        }),
      },
    })
  }
  
  // Optionally include completed tasks
  if (options.includeTasks) {
    const taskWhere: any = entityType === 'contact'
      ? { contactId: entityId, status: 'COMPLETED' }
      : { leadId: entityId, status: 'COMPLETED' }
    
    const tasks = await db.cRMTask.findMany({
      where: taskWhere,
      orderBy: { completedAt: 'desc' },
      take: Math.floor(limit / 2),
    })
    
    for (const task of tasks) {
      entries.push({
        id: `task-${task.id}`,
        date: task.completedAt!,
        type: 'task_completed',
        title: `Task completed: ${task.title}`,
        description: task.resultNotes || task.outcome || undefined,
        icon: 'CheckCircle',
        color: '#22c55e',
        metadata: {
          taskId: task.id,
          outcome: task.outcome,
        },
      })
    }
  }
  
  // Sort by date descending
  return entries.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit)
}

/**
 * Get recent activities for dashboard
 */
export async function getRecentActivities(
  companyId: string,
  limit: number = 10
): Promise<Activity[]> {
  const activities = await db.cRMInteraction.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      contact: true,
      lead: true,
    },
  })
  
  return activities.map(mapActivityFromDB)
}

// ============================================
// FOLLOW-UP SCHEDULING
// ============================================

/**
 * Schedule automatic follow-up based on activity type
 */
export async function scheduleFollowUp(
  activityId: string,
  options?: {
    overrideDelayHours?: number
    customTaskTitle?: string
    customTaskDescription?: string
    assignedTo?: string
  }
): Promise<{ taskId: string; scheduledFor: Date }> {
  const activity = await db.cRMInteraction.findUnique({
    where: { id: activityId },
    include: { contact: true, lead: true },
  })
  
  if (!activity) throw new Error('Activity not found')
  
  // Determine follow-up delay based on activity type
  let delayHours = options?.overrideDelayHours || getDefaultFollowUpDelay(activity.type as ActivityType)
  
  const scheduledFor = new Date(Date.now() + delayHours * 60 * 60 * 1000)
  
  // Create follow-up task
  const task = await db.cRMTask.create({
    data: {
      id: uuidv4(),
      leadId: activity.leadId,
      contactId: activity.contactId,
      companyId: activity.companyId,
      title: options?.customTaskTitle || generateFollowUpTitle(activity),
      description: options?.customTaskDescription || generateFollowUpDescription(activity),
      type: 'FOLLOW_UP',
      priority: determineFollowUpPriority(activity),
      status: 'TODO',
      dueDate: scheduledFor,
      assignedTo: options?.assignedTo || activity.createdBy,
      createdBy: 'system',
      remindBefore: 60,
      reminderSent: false,
    },
  })
  
  return {
    taskId: task.id,
    scheduledFor,
  }
}

function getDefaultFollowUpDelay(type: ActivityType): number {
  const delays: Record<ActivityType, number> = {
    call: 24,       // Follow up call after 1 day
    email: 48,      // Follow up email after 2 days
    meeting: 168,   // Follow up meeting after 1 week
    note: 0,        // No auto follow-up for notes
    task: 0,        // No auto follow-up for tasks
    follow_up: 72,  // Follow up after 3 days
    demo: 48,       // Follow up demo after 2 days
    proposal_sent: 72, // Follow up proposal after 3 days
    quote_sent: 120,   // Follow up quote after 5 days
    contract_sent: 168, // Follow up contract after 1 week
    payment_received: 720, // Check in after 30 days
    system: 0,      // No auto follow-up for system
  }
  
  return delays[type] || 48
}

function generateFollowUpTitle(activity: any): string {
  const contactName = activity.contact 
    ? `${activity.contact.firstName} ${activity.contact.lastName}`
    : 'Contact'
  
  switch (activity.type.toLowerCase()) {
    case 'CALL':
      return `Follow up call with ${contactName}`
    case 'EMAIL':
      return `Follow up email to ${contactName}`
    case 'MEETING':
      return `Schedule next meeting with ${contactName}`
    case 'DEMO':
      return `Send additional info post-demo to ${contactName}`
    default:
      return `Follow up with ${contactName}`
  }
}

function generateFollowUpDescription(activity: any): string {
  const contactName = activity.contact 
    ? `${activity.contact.firstName} ${activity.contact.lastName}`
    : 'Contact'
  const company = activity.lead?.companyName || ''
  
  return `Automatic follow-up generated from ${activity.type.toLowerCase()} on ${new Date().toLocaleDateString()}.\n\n` +
    `Previous interaction: ${activity.subject}\n\n` +
    `Contact: ${contactName}${company ? `\nCompany: ${company}` : ''}` +
    (activity.nextSteps ? `\n\nNext steps mentioned: ${activity.nextSteps}` : '')
}

function determineFollowUpPriority(activity: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  // High priority for positive interactions or meetings
  if (activity.sentiment === 'POSITIVE') return 'HIGH'
  if (activity.type === 'MEETING' || activity.type === 'DEMO') return 'HIGH'
  if (activity.type === 'CALL') return 'MEDIUM'
  return 'MEDIUM'
}

// ============================================
// SENTIMENT ANALYSIS
// ============================================

/**
 * Analyze sentiment of an activity's content
 */
export async function analyzeSentiment(activityId: string): Promise<{
  sentiment: SentimentType
  confidence: number
  keywords: string[]
}> {
  const activity = await db.cRMInteraction.findUnique({ where: { id: activityId } })
  if (!activity) throw new Error('Activity not found')
  
  const content = `${activity.subject} ${activity.content}`.toLowerCase()
  
  // Positive words (English and French for Algerian market)
  const positiveWords = [
    'happy', 'great', 'excellent', 'interested', 'love', 'perfect',
    'good', 'amazing', 'wonderful', 'fantastic', 'excited', 'pleased',
    'satisfied', 'impressed', 'confident', 'definitely', 'yes',
    'heureux', 'excellent', 'intéressé', 'parfait', 'bon', 'génial',
    'merveilleux', 'satisfait', 'impressionné', 'oui', 'd\'accord',
  ]
  
  const negativeWords = [
    'unhappy', 'disappointed', 'frustrated', 'angry', 'terrible', 'bad',
    'poor', 'worst', 'hate', 'issue', 'problem', 'concern', 'wrong',
    'expensive', 'no', 'not interested', 'maybe later', 'too expensive',
    'mécontent', 'déçu', 'frustré', 'mauvais', 'problème', 'préoccupation',
    'pas intéressé', 'trop cher', 'non',
  ]
  
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
  
  // Store result
  await db.cRMInteraction.update({
    where: { id: activityId },
    data: { sentiment },
  })
  
  return {
    sentiment,
    confidence,
    keywords: [...new Set(foundKeywords)],
  }
}

// ============================================
// ACTIVITY STATISTICS
// ============================================

/**
 * Get activity statistics for a time period
 */
export async function getActivityStats(
  companyId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<{
  total: number
  byType: Record<string, number>
  byDirection: Record<string, number>
  byDay: { date: string; count: number }[]
  avgDurationByType: Record<string, number>
}> {
  const activities = await db.cRMInteraction.findMany({
    where: {
      companyId,
      createdAt: { gte: dateFrom, lte: dateTo },
    },
  })
  
  // Total
  const total = activities.length
  
  // By type
  const byType: Record<string, number> = {}
  for (const activity of activities) {
    byType[activity.type] = (byType[activity.type] || 0) + 1
  }
  
  // By direction
  const byDirection: Record<string, number> = {}
  for (const activity of activities) {
    byDirection[activity.direction] = (byDirection[activity.direction] || 0) + 1
  }
  
  // By day
  const byDayMap: Record<string, number> = {}
  for (const activity of activities) {
    const date = activity.createdAt.toISOString().slice(0, 10)
    byDayMap[date] = (byDayMap[date] || 0) + 1
  }
  const byDay = Object.entries(byDayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
  
  // Average duration by type (for calls/meetings)
  const durationByType: Record<string, { total: number; count: number }> = {}
  for (const activity of activities) {
    if (activity.duration && activity.duration > 0) {
      if (!durationByType[activity.type]) {
        durationByType[activity.type] = { total: 0, count: 0 }
      }
      durationByType[activity.type].total += activity.duration
      durationByType[activity.type].count++
    }
  }
  
  const avgDurationByType: Record<string, number> = {}
  for (const [type, data] of Object.entries(durationByType)) {
    avgDurationByType[type] = Math.round(data.total / data.count)
  }
  
  return {
    total,
    byType,
    byDirection,
    byDay,
    avgDurationByType,
  }
}

// ============================================
// HELPERS
// ============================================

function mapActivityFromDB(dbActivity: any): Activity {
  const typeConfig = ACTIVITY_TYPES.find(t => t.type === dbActivity.type.toLowerCase())
  
  return {
    id: dbActivity.id,
    contactId: dbActivity.contactId,
    leadId: dbActivity.leadId || undefined,
    companyId: dbActivity.companyId,
    type: dbActivity.type.toLowerCase() as ActivityType,
    direction: dbActivity.direction as InteractionDirection,
    subject: dbActivity.subject,
    description: dbActivity.content || undefined,
    durationMinutes: dbActivity.duration || undefined,
    channel: dbActivity.channel || undefined,
    sentiment: dbActivity.sentiment as SentimentType | undefined,
    nextSteps: dbActivity.nextSteps || undefined,
    attachments: JSON.parse(dbActivity.attachmentUrls || '[]'),
    automated: dbActivity.automated,
    triggeredBy: dbActivity.triggeredBy || undefined,
    createdBy: dbActivity.createdBy,
    createdAt: dbActivity.createdAt,
    contactName: dbActivity.contact 
      ? `${dbActivity.contact.firstName} ${dbActivity.contact.lastName}` 
      : undefined,
    companyName: dbActivity.lead?.companyName || undefined,
    leadTitle: dbActivity.lead?.companyName || undefined,
  }
}
