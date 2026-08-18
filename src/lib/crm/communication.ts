// CRM Communication Module
// Email integration, internal notes, communication history, templates
// AlgeriaTrade.dz B2B Marketplace - CRM Integration Suite

import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_EMAIL_TEMPLATES, EmailTemplate } from './config'

// ============================================
// TYPES
// ============================================

export type CommunicationType = 'EMAIL' | 'NOTE' | 'INTERNAL' | 'SYSTEM'
export type EmailStatus = 'DRAFT' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED'

export interface CommunicationData {
  contactId: string
  leadId?: string
  companyId: string
  
  // Basic info
  type: CommunicationType
  subject: string
  content: string
  
  // Direction
  direction?: 'INBOUND' | 'OUTBOUND'
  
  // For emails
  toEmail?: string[]
  ccEmail?: string[]
  bccEmail?: string[]
  emailStatus?: EmailStatus
  emailMessageId?: string
  
  // Metadata
  attachments?: CommunicationAttachment[]
  
  // User info
  createdBy: string
}

export interface CommunicationAttachment {
  filename: string
  url: string
  size: number
  mimeType: string
}

export interface Communication extends CommunicationData {
  id: string
  createdAt: Date
  updatedAt: Date
  
  // Populated fields
  contactName?: string
  replyToId?: string
  threadId?: string
}

export interface InternalNote {
  id: string
  contactId: string
  leadId?: string
  content: string
  isPrivate: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
  authorName?: string
}

export interface ThreadSummary {
  threadId: string
  subject: string
  participants: string[]
  messageCount: number
  lastActivityAt: Date
  lastMessagePreview: string
}

export interface CommunicationFilter {
  companyId?: string
  contactId?: string
  leadId?: string
  type?: CommunicationType
  direction?: 'INBOUND' | 'OUTBOUND'
  emailStatus?: EmailStatus
  createdFrom?: Date
  createdTo?: Date
  search?: string
  hasAttachments?: boolean
}

// ============================================
// COMMUNICATION CRUD OPERATIONS
// ============================================

/**
 * Log a new communication (email, note, etc.)
 */
export async function logCommunication(data: CommunicationData): Promise<Communication> {
  const communication = await db.cRMInteraction.create({
    data: {
      id: uuidv4(),
      contactId: data.contactId,
      leadId: data.leadId,
      companyId: data.companyId,
      type: mapCommunicationType(data.type),
      direction: data.direction || 'OUTBOUND',
      subject: data.subject,
      content: data.content,
      attachmentUrls: JSON.stringify(data.attachments || []),
      automated: false,
      createdBy: data.createdBy,
    },
  })
  
  // Update contact's last interaction timestamp
  await db.cRMContact.update({
    where: { id: data.contactId },
    data: { lastInteractionAt: new Date() },
  })
  
  return mapCommunicationFromDB(communication)
}

/**
 * Get a single communication by ID
 */
export async function getCommunication(id: string): Promise<Communication | null> {
  const comm = await db.cRMInteraction.findUnique({
    where: { id },
    include: { contact: true },
  })
  
  return comm ? mapCommunicationFromDB(comm) : null
}

/**
 * Update a communication
 */
export async function updateCommunication(
  id: string,
  data: Partial<Omit<CommunicationData, 'contactId' | 'companyId' | 'createdBy'>>
): Promise<Communication> {
  const existing = await db.cRMInteraction.findUnique({ where: { id } })
  if (!existing) throw new Error('Communication not found')
  
  const updateData: any = {}
  
  if (data.type !== undefined) updateData.type = mapCommunicationType(data.type)
  if (data.subject !== undefined) updateData.subject = data.subject
  if (data.content !== undefined) updateData.content = data.content
  if (data.direction !== undefined) updateData.direction = data.direction
  if (data.leadId !== undefined) updateData.leadId = data.leadId
  if (data.attachments !== undefined) updateData.attachmentUrls = JSON.stringify(data.attachments)
  
  const updated = await db.cRMInteraction.update({
    where: { id },
    data: updateData,
  })
  
  return mapCommunicationFromDB(updated)
}

/**
 * Delete a communication
 */
export async function deleteCommunication(id: string): Promise<void> {
  await db.cRMInteraction.delete({ where: { id } })
}

// ============================================
// INTERNAL NOTES
// ============================================

/**
 * Add an internal note to a contact/lead
 */
export async function addInternalNote(data: {
  contactId: string
  leadId?: string
  content: string
  isPrivate?: boolean
  createdBy: string
}): Promise<InternalNote> {
  // Store as interaction with NOTE type
  const note = await db.cRMInteraction.create({
    data: {
      id: uuidv4(),
      contactId: data.contactId,
      leadId: data.leadId,
      companyId: '', // Will be populated from context
      type: 'NOTE',
      direction: 'OUTBOUND',
      subject: 'Internal Note',
      content: `[${data.isPrivate ? 'PRIVATE' : 'VISIBLE'}] ${data.content}`,
      attachmentUrls: JSON.stringify([]),
      automated: false,
      createdBy: data.createdBy,
    },
  })
  
  return {
    id: note.id,
    contactId: note.contactId,
    leadId: note.leadId || undefined,
    content: data.content,
    isPrivate: data.isPrivate || false,
    createdBy: data.createdBy,
    createdAt: note.createdAt,
    updatedAt: note.createdAt,
  }
}

/**
 * Get notes for a contact
 */
export async function getContactNotes(contactId: string): Promise<InternalNote[]> {
  const notes = await db.cRMInteraction.findMany({
    where: {
      contactId,
      type: 'NOTE',
    },
    orderBy: { createdAt: 'desc' },
  })
  
  return notes.map(note => ({
    id: note.id,
    contactId: note.contactId,
    leadId: note.leadId || undefined,
    content: note.content.replace(/^\[(PRIVATE|VISIBLE)\]\s*/, ''),
    isPrivate: note.content.startsWith('[PRIVATE]'),
    createdBy: note.createdBy,
    createdAt: note.createdAt,
    updatedAt: note.createdAt,
  }))
}

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Get all email templates
 */
export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  // In production, these would come from database
  // For now, return defaults
  return DEFAULT_EMAIL_TEMPLATES
}

/**
 * Get a specific email template
 */
export async function getEmailTemplate(templateId: string): Promise<EmailTemplate | null> {
  return DEFAULT_EMAIL_TEMPLATES.find(t => t.id === templateId) || null
}

/**
 * Render an email template with variables
 */
export function renderTemplate(
  templateId: string,
  variables: Record<string, string>
): { subject: string; body: string; error?: string } {
  const template = DEFAULT_EMAIL_TEMPLATES.find(t => t.id === templateId)
  
  if (!template) {
    return { subject: '', body: '', error: `Template not found: ${templateId}` }
  }
  
  let subject = template.subject
  let body = template.body
  
  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    subject = subject.replace(new RegExp(placeholder, 'g'), value)
    body = body.replace(new RegExp(placeholder, 'g'), value)
  }
  
  // Check for unreplaced variables
  const remainingVars = body.match(/\{\{[^}]+\}\}/g)
  if (remainingVars && remainingVars.length > 0) {
    return { 
      subject, 
      body, 
      error: `Unresolved variables: ${remainingVars.join(', ')}` 
    }
  }
  
  return { subject, body }
}

/**
 * Create a custom email template
 */
export async function createCustomTemplate(data: {
  name: string
  subject: string
  body: string
  variables: string[]
  category: EmailTemplate['category']
}): Promise<EmailTemplate> {
  const template: EmailTemplate = {
    id: `custom_${uuidv4().slice(0, 8)}`,
    name: data.name,
    subject: data.subject,
    body: data.body,
    variables: data.variables,
    category: data.category,
  }
  
  // In production, save to database
  // For now, just return it
  return template
}

// ============================================
// COMMUNICATION HISTORY
// ============================================

/**
 * Get communication history for a contact
 */
export async function getContactCommunications(
  contactId: string,
  options: {
    limit?: number
    offset?: number
    types?: CommunicationType[]
  } = {}
): Promise<Communication[]> {
  const limit = options.limit || 50
  const offset = options.offset || 0
  
  const where: any = { contactId }
  
  if (options.types && options.types.length > 0) {
    where.type = { in: options.types.map(t => mapCommunicationType(t)) }
  }
  
  const communications = await db.cRMInteraction.findMany({
    where,
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { contact: true },
  })
  
  return communications.map(mapCommunicationFromDB)
}

/**
 * Get communication history for a lead
 */
export async function getLeadCommunications(
  leadId: string,
  options: {
    limit?: number
    offset?: number
  } = {}
): Promise<Communication[]> {
  const limit = options.limit || 50
  const offset = options.offset || 0
  
  const communications = await db.cRMInteraction.findMany({
    where: { leadId },
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { contact: true, lead: true },
  })
  
  return communications.map(mapCommunicationFromDB)
}

/**
 * Search communications
 */
export async function searchCommunications(
  filter: CommunicationFilter = {},
  options: {
    page?: number
    pageSize?: number
    sortBy?: 'createdAt' | 'subject'
    sortOrder?: 'asc' | 'desc'
  } = {}
): Promise<{
  data: Communication[]
  total: number
}> {
  const page = options.page || 1
  const pageSize = Math.min(options.pageSize || 20, 100)
  const skip = (page - 1) * pageSize
  
  const where: any = {}
  
  if (filter.companyId) where.companyId = filter.companyId
  if (filter.contactId) where.contactId = filter.contactId
  if (filter.leadId) where.leadId = filter.leadId
  if (filter.type) where.type = mapCommunicationType(filter.type)
  if (filter.direction) where.direction = filter.direction
  
  if (filter.search) {
    where.OR = [
      { subject: { contains: filter.search, mode: 'insensitive' } },
      { content: { contains: filter.search, mode: 'insensitive' } },
    ]
  }
  
  if (filter.createdFrom || filter.createdTo) {
    where.createdAt = {}
    if (filter.createdFrom) where.createdAt.gte = filter.createdFrom
    if (filter.createdTo) where.createdAt.lte = filter.createdTo
  }
  
  const [communications, total] = await Promise.all([
    db.cRMInteraction.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        [(options.sortBy || 'createdAt')]: options.sortOrder || 'desc',
      },
      include: { contact: true },
    }),
    db.cRMInteraction.count({ where }),
  ])
  
  return {
    data: communications.map(mapCommunicationFromDB),
    total,
  }
}

// ============================================
// QUICK SEND HELPERS
// ============================================

/**
 * Quick send email (logs and returns template for actual sending)
 */
export async function prepareQuickEmail(data: {
  contactId: string
  templateId?: string
  subject?: string
  body?: string
  variables?: Record<string, string>
  attachments?: CommunicationAttachment[]
  createdBy: string
}): Promise<{ 
  logged: Communication 
  renderedSubject: string 
  renderedBody: string 
  needsSending: boolean 
}> {
  // If using template, render it first
  let subject = data.subject || ''
  let body = data.body || ''
  
  if (data.templateId && data.variables) {
    const rendered = renderTemplate(data.templateId, data.variables)
    if (rendered.error) {
      throw new Error(`Template rendering failed: ${rendered.error}`)
    }
    subject = rendered.subject
    body = rendered.body
  }
  
  // Log the communication
  const logged = await logCommunication({
    contactId: data.contactId,
    companyId: '',
    type: 'EMAIL',
    subject,
    content: body,
    direction: 'OUTBOUND',
    attachments: data.attachments,
    createdBy: data.createdBy,
  })
  
  return {
    logged,
    renderedSubject: subject,
    renderedBody: body,
    needsSending: true, // Flag that this needs to be sent via email service
  }
}

/**
 * Send follow-up email after activity
 */
export async function sendFollowUpEmail(options: {
  activityId: string
  templateId?: string
  customMessage?: string
  variables?: Record<string, string>
  userId: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Get the original activity
  const activity = await db.cRMInteraction.findUnique({
    where: { id: options.activityId },
    include: { contact: true },
  })
  
  if (!activity) {
    return { success: false, error: 'Activity not found' }
  }
  
  const contactName = activity.contact 
    ? `${activity.contact.firstName} ${activity.contact.lastName}` 
    : 'Contact'
  
  // Prepare variables
  const defaultVariables = {
    contact_name: contactName,
    sender_name: 'AlgeriaTrade.dz Team',
    ...options.variables,
  }
  
  try {
    // Log the follow-up email
    await logCommunication({
      contactId: activity.contactId,
      companyId: activity.companyId,
      type: 'EMAIL',
      subject: `Follow-up: ${activity.subject}`,
      content: options.customMessage || generateDefaultFollowUpContent(activity, contactName),
      direction: 'OUTBOUND',
      createdBy: options.userId,
    })
    
    // In production, integrate with email service here
    // For now, just log it
    
    return { 
      success: true, 
      messageId: `followup_${Date.now()}_${activity.contactId.slice(0, 8)}` 
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

function generateDefaultFollowUpContent(activity: any, contactName: string): string {
  return `Dear ${contactName},\n\n` +
    `Following up on our recent ${activity.type.toLowerCase()} regarding "${activity.subject}".\n\n` +
    (activity.nextSteps ? `As discussed, next steps include: ${activity.nextSteps}\n\n` : '') +
    `Please let me know if you have any questions or need additional information.\n\n` +
    `Best regards,\n` +
    `Your AlgeriaTrade.dz Contact`
}

// ============================================
// COMMUNICATION STATISTICS
// ============================================

/**
 * Get communication statistics
 */
export async function getCommunicationStats(
  companyId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<{
  total: number
  byType: Record<string, number>
  byDirection: Record<string, number>
  avgResponseTime: number // Hours
  responseRate: number
  mostActiveContacts: { contactId: string; name: string; count: number }[]
}> {
  const communications = await db.cRMInteraction.findMany({
    where: {
      companyId,
      createdAt: { gte: dateFrom, lte: dateTo },
    },
    include: { contact: true },
  })
  
  // Total
  const total = communications.length
  
  // By type
  const byType: Record<string, number> = {}
  for (const comm of communications) {
    byType[comm.type] = (byType[comm.type] || 0) + 1
  }
  
  // By direction
  const byDirection: Record<string, number> = {}
  for (const comm of communications) {
    byDirection[comm.direction] = (byDirection[comm.direction] || 0) + 1
  }
  
  // Most active contacts
  const contactCounts: Record<string, { name: string; count: number }> = {}
  for (const comm of communications) {
    if (!contactCounts[comm.contactId]) {
      contactCounts[comm.contactId] = {
        name: comm.contact ? `${comm.contact.firstName} ${comm.contact.lastName}` : 'Unknown',
        count: 0,
      }
    }
    contactCounts[comm.contactId].count++
  }
  
  const mostActiveContacts = Object.entries(contactCounts)
    .map(([contactId, data]) => ({ contactId, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  return {
    total,
    byType,
    byDirection,
    avgResponseTime: 24, // Placeholder - would need calculation logic
    responseRate: 85, // Placeholder
    mostActiveContacts,
  }
}

// ============================================
// HELPERS
// ============================================

function mapCommunicationType(type: CommunicationType): string {
  const typeMap: Record<CommunicationType, string> = {
    EMAIL: 'EMAIL',
    NOTE: 'NOTE',
    INTERNAL: 'NOTE', // Internal notes stored as notes
    SYSTEM: 'SYSTEM',
  }
  return typeMap[type] || 'NOTE'
}

function mapCommunicationFromDB(dbComm: any): Communication {
  return {
    id: dbComm.id,
    contactId: dbComm.contactId,
    leadId: dbComm.leadId || undefined,
    companyId: dbComm.companyId,
    type: dbComm.type.toLowerCase() as CommunicationType,
    direction: dbComm.direction as 'INBOUND' | 'OUTBOUND',
    subject: dbComm.subject,
    content: dbComm.content,
    attachments: JSON.parse(dbComm.attachmentUrls || '[]'),
    createdBy: dbComm.createdBy,
    createdAt: dbComm.createdAt,
    updatedAt: dbComm.updatedAt,
    contactName: dbComm.contact 
      ? `${dbComm.contact.firstName} ${dbComm.contact.lastName}` 
      : undefined,
  }
}
