// CRM Contacts Module
// Contact CRUD operations, import/export, duplicate detection, merging, tags and segmentation
// AlgeriaTrade.dz B2B Marketplace - CRM Integration Suite

import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// ============================================
// TYPES
// ============================================

export type ContactRole = 'DECISION_MAKER' | 'INFLUENCER' | 'TECHNICAL' | 'FINANCIAL' | 'END_USER' | 'OTHER'
export type ContactStatus = 'active' | 'inactive' | 'prospect' | 'customer' | 'churned'
export type PreferredLanguage = 'AR' | 'FR' | 'EN'
export type PreferredContactMethod = 'EMAIL' | 'PHONE' | 'WHATSAPP'

export interface ContactData {
  ownerId: string
  userId?: string
  
  // Personal info
  firstName: string
  lastName: string
  email: string
  phone?: string
  mobile?: string
  
  // Professional
  company?: string
  position?: string
  department?: string
  industry?: string
  role?: ContactRole
  
  // Online presence
  website?: string
  linkedinUrl?: string
  avatarUrl?: string
  
  // Location
  address?: string
  city?: string
  country?: string
  
  // Preferences & metadata
  tags?: string[]
  source?: string
  status?: ContactStatus
  customFields?: Record<string, any>
  
  // Timestamps (set automatically)
  lastContactedAt?: Date
}

export interface Contact extends ContactData {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface ContactFilter {
  ownerId?: string
  search?: string
  status?: ContactStatus
  role?: ContactRole
  tags?: string[]
  source?: string
  city?: string
  country?: string
  hasInteractionsSince?: Date
  createdFrom?: Date
  createdTo?: Date
}

export interface ContactPaginationOptions {
  page?: number
  pageSize?: number
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt' | 'lastContactedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedContacts {
  data: Contact[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DuplicateContact {
  existing: Contact
  potential: Partial<ContactData>
  matchScore: number
  matchFields: string[]
}

// ============================================
// CONTACT CRUD OPERATIONS
// ============================================

/**
 * Create a new contact
 */
export async function createContact(data: ContactData): Promise<Contact> {
  const contact = await db.cRMContact.create({
    data: {
      id: uuidv4(),
      ownerId: data.ownerId,
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || '',
      mobile: data.mobile,
      jobTitle: data.position || '',
      department: data.department,
      role: data.role || 'DECISION_MAKER',
      linkedinUrl: data.linkedinUrl,
      avatarUrl: data.avatarUrl,
      preferredLanguage: 'FR' as any,
      preferredContactMethod: 'EMAIL' as any,
      timezone: 'Africa/Algiers',
      tags: JSON.stringify(data.tags || []),
      notes: JSON.stringify({
        company: data.company,
        industry: data.industry,
        website: data.website,
        address: data.address,
        city: data.city,
        country: data.country,
        source: data.source,
        status: data.status || 'active',
        customFields: data.customFields || {},
      }),
      lastInteractionAt: data.lastContactedAt,
    },
  })
  
  return mapContactFromDB(contact)
}

/**
 * Get a single contact by ID
 */
export async function getContact(id: string): Promise<Contact | null> {
  const contact = await db.cRMContact.findUnique({
    where: { id },
    include: {
      interactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: { interactions: true },
      },
    },
  })
  
  return contact ? mapContactFromDB(contact) : null
}

/**
 * Update a contact
 */
export async function updateContact(
  id: string,
  data: Partial<Omit<ContactData, 'ownerId'>>
): Promise<Contact> {
  const existing = await db.cRMContact.findUnique({ where: { id } })
  if (!existing) throw new Error('Contact not found')
  
  const updateData: any = {}
  
  // Map simple fields
  if (data.firstName !== undefined) updateData.firstName = data.firstName
  if (data.lastName !== undefined) updateData.lastName = data.lastName
  if (data.email !== undefined) updateData.email = data.email
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.mobile !== undefined) updateData.mobile = data.mobile
  if (data.position !== undefined) updateData.jobTitle = data.position
  if (data.department !== undefined) updateData.department = data.department
  if (data.role !== undefined) updateData.role = data.role
  if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl
  if (data.lastContactedAt !== undefined) updateData.lastInteractionAt = data.lastContactedAt
  
  // Handle complex fields stored in notes JSON
  const currentNotes = JSON.parse(existing.notes || '{}')
  if (data.company !== undefined) currentNotes.company = data.company
  if (data.industry !== undefined) currentNotes.industry = data.industry
  if (data.website !== undefined) currentNotes.website = data.website
  if (data.address !== undefined) currentNotes.address = data.address
  if (data.city !== undefined) currentNotes.city = data.city
  if (data.country !== undefined) currentNotes.country = data.country
  if (data.source !== undefined) currentNotes.source = data.source
  if (data.status !== undefined) currentNotes.status = data.status
  if (data.customFields !== undefined) currentNotes.customFields = data.customFields
  
  updateData.notes = JSON.stringify(currentNotes)
  
  // Handle tags separately (stored as JSON in tags field)
  if (data.tags !== undefined) {
    updateData.tags = JSON.stringify(data.tags)
  }
  
  const updated = await db.cRMContact.update({
    where: { id },
    data: updateData,
  })
  
  return mapContactFromDB(updated)
}

/**
 * Delete a contact (soft delete by marking inactive)
 */
export async function deleteContact(id: string): Promise<void> {
  await db.cRMContact.update({
    where: { id },
    data: {
      // Store status in notes for soft delete
      notes: JSON.stringify({ ...JSON.parse('{}'), status: 'inactive', deletedAt: new Date() }),
    },
  })
}

/**
 * Permanently delete a contact
 */
export async function permanentDeleteContact(id: string): Promise<void> {
  await db.cRMContact.delete({ where: { id } })
}

// ============================================
// CONTACT SEARCH & FILTERING
// ============================================

/**
 * Search contacts with filters and pagination
 */
export async function searchContacts(
  filter: ContactFilter = {},
  options: ContactPaginationOptions = {}
): Promise<PaginatedContacts> {
  const page = options.page || 1
  const pageSize = Math.min(options.pageSize || 20, 100)
  const skip = (page - 1) * pageSize
  
  const where: any = {}
  
  // Owner filter
  if (filter.ownerId) {
    where.companyId = filter.ownerId
  }
  
  // Search query
  if (filter.search) {
    where.OR = [
      { firstName: { contains: filter.search, mode: 'insensitive' } },
      { lastName: { contains: filter.search, mode: 'insensitive' } },
      { email: { contains: filter.search, mode: 'insensitive' } },
      { phone: { contains: filter.search } },
      { jobTitle: { contains: filter.search, mode: 'insensitive' } },
      { notes: { contains: filter.search, mode: 'insensitive' } },
    ]
  }
  
  // Status filter (stored in notes JSON)
  if (filter.status) {
    where.notes = { ...where.notes, contains: `"status":"${filter.status}"` }
  }
  
  // Role filter
  if (filter.role) {
    where.role = filter.role
  }
  
  // Tags filter
  if (filter.tags && filter.tags.length > 0) {
    where.AND = filter.tags.map(tag => ({
      tags: { contains: tag },
    }))
  }
  
  // Source filter
  if (filter.source) {
    where.notes = { ...where.notes, contains: `"source":"${filter.source}"` }
  }
  
  // City/Country filters
  if (filter.city) {
    where.notes = { ...where.notes, contains: `"city":"${filter.city}"` }
  }
  if (filter.country) {
    where.notes = { ...where.notes, contains: `"country":"${filter.country}"` }
  }
  
  // Date range filters
  if (filter.createdFrom || filter.createdTo) {
    where.createdAt = {}
    if (filter.createdFrom) where.createdAt.gte = filter.createdFrom
    if (filter.createdTo) where.createdAt.lte = filter.createdTo
  }
  
  // Last interaction filter
  if (filter.hasInteractionsSince) {
    where.lastInteractionAt = { gte: filter.hasInteractionsSince }
  }
  
  const [contacts, total] = await Promise.all([
    db.cRMContact.findMany({
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

/**
 * Get all contacts for a specific owner
 */
export async function getContactsByOwner(
  ownerId: string,
  options: ContactPaginationOptions = {}
): Promise<PaginatedContacts> {
  return searchContacts({ ownerId }, options)
}

// ============================================
// DUPLICATE DETECTION
// ============================================

/**
 * Find potential duplicate contacts
 */
export async function findDuplicateContacts(
  potentialContact: Partial<ContactData>,
  ownerId: string,
  threshold: number = 0.7
): Promise<DuplicateContact[]> {
  const allContacts = await db.cRMContact.findMany({
    where: { companyId: ownerId },
  })
  
  const duplicates: DuplicateContact[] = []
  
  for (const existing of allContacts) {
    const mappedExisting = mapContactFromDB(existing)
    const matchResult = calculateMatchScore(mappedExisting, potentialContact)
    
    if (matchResult.score >= threshold) {
      duplicates.push({
        existing: mappedExisting,
        potential: potentialContact,
        matchScore: matchResult.score,
        matchFields: matchResult.matchingFields,
      })
    }
  }
  
  // Sort by match score descending
  return duplicates.sort((a, b) => b.matchScore - a.matchScore)
}

function calculateMatchScore(
  existing: Contact,
  potential: Partial<ContactData>
): { score: number; matchingFields: string[] } {
  let score = 0
  let totalWeight = 0
  const matchingFields: string[] = []
  
  // Email is the strongest indicator (weight: 40)
  if (potential.email && existing.email) {
    totalWeight += 40
    if (potential.email.toLowerCase() === existing.email.toLowerCase()) {
      score += 40
      matchingFields.push('email')
    }
  }
  
  // Phone matching (weight: 25)
  if (potential.phone && existing.phone) {
    totalWeight += 25
    const normalizedPotential = normalizePhone(potential.phone)
    const normalizedExisting = normalizePhone(existing.phone)
    if (normalizedPotential === normalizedExisting ||
        normalizedPotential.includes(normalizedExisting) ||
        normalizedExisting.includes(normalizedPotential)) {
      score += 25
      matchingFields.push('phone')
    }
  }
  
  // Name matching (weight: 20)
  if ((potential.firstName || potential.lastName) && (existing.firstName || existing.lastName)) {
    totalWeight += 20
    let nameMatch = 0
    
    if (potential.firstName && existing.firstName) {
      const firstSimilarity = stringSimilarity(potential.firstName, existing.firstName)
      nameMatch += firstSimilarity * 0.5
    }
    
    if (potential.lastName && existing.lastName) {
      const lastSimilarity = stringSimilarity(potential.lastName, existing.lastName)
      nameMatch += lastSimilarity * 0.5
    }
    
    if (nameMatch >= 0.7) {
      score += 20 * nameMatch
      matchingFields.push('name')
    }
  }
  
  // Company matching (weight: 15)
  if (potential.company && existing.company) {
    totalWeight += 15
    if (stringSimilarity(potential.company, existing.company) >= 0.8) {
      score += 15
      matchingFields.push('company')
    }
  }
  
  return {
    score: totalWeight > 0 ? score / totalWeight : 0,
    matchingFields,
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '').replace(/^213/, '')
}

function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.9
  
  // Simple Levenshtein-like comparison
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 1
  
  const costs: number[] = []
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i
    for (let j = 1; j <= longer.length; j++) {
      const newValue = shorter[i - 1] === longer[j - 1]
        ? lastValue
        : Math.min(Math.min(lastValue + 1, costs[j] + 1), costs[j - 1] + 1)
      costs[j - 1] = lastValue
      lastValue = newValue
    }
    costs[shorter.length] = lastValue
  }
  
  return (longer.length - costs[shorter.length]) / longer.length
}

// ============================================
// CONTACT MERGING
// ============================================

/**
 * Merge multiple contacts into one primary contact
 */
export async function mergeContacts(
  primaryId: string,
  secondaryIds: string[]
): Promise<Contact> {
  const primary = await db.cRMContact.findUnique({ where: { id: primaryId } })
  if (!primary) throw new Error('Primary contact not found')
  
  const secondaries = await db.cRMContact.findMany({
    where: { id: { in: secondaryIds } },
  })
  
  if (secondaries.length !== secondaryIds.length) {
    throw new Error('Some secondary contacts not found')
  }
  
  // Parse primary's extended data
  const primaryNotes = JSON.parse(primary.notes || '{}')
  const primaryTags = JSON.parse(primary.tags || '[]')
  
  // Merge from each secondary
  for (const secondary of secondaries) {
    const secNotes = JSON.parse(secondary.notes || '{}')
    const secTags = JSON.parse(secondary.tags || '[]')
    
    // Merge tags (union)
    for (const tag of secTags) {
      if (!primaryTags.includes(tag)) {
        primaryTags.push(tag)
      }
    }
    
    // Merge notes - keep most recent non-empty values
    if (!primaryNotes.company && secNotes.company) primaryNotes.company = secNotes.company
    if (!primaryNotes.industry && secNotes.industry) primaryNotes.industry = secNotes.industry
    if (!primaryNotes.website && secNotes.website) primaryNotes.website = secNotes.website
    if (!primaryNotes.address && secNotes.address) primaryNotes.address = secNotes.address
    if (!primaryNotes.city && secNotes.city) primaryNotes.city = secNotes.city
    
    // Append merged note
    const mergeNote = `--- Merged from ${secondary.firstName} ${secondary.lastName} (${secondary.id}) on ${new Date().toISOString()} ---`
    primaryNotes.mergedFrom = primaryNotes.mergedFrom || []
    primaryNotes.mergedFrom.push({
      contactId: secondary.id,
      name: `${secondary.firstName} ${secondary.lastName}`,
      email: secondary.email,
      mergedAt: new Date().toISOString(),
    })
    
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
    
    // Delete secondary contact
    await db.cRMContact.delete({ where: { id: secondary.id } })
  }
  
  // Update primary with merged data
  const updated = await db.cRMContact.update({
    where: { id: primaryId },
    data: {
      tags: JSON.stringify(primaryTags),
      notes: JSON.stringify(primaryNotes),
    },
  })
  
  return mapContactFromDB(updated)
}

// ============================================
// TAGS MANAGEMENT
// ============================================

/**
 * Add tag(s) to a contact
 */
export async function addContactTags(contactId: string, tags: string[]): Promise<Contact> {
  const contact = await db.cRMContact.findUnique({ where: { id: contactId } })
  if (!contact) throw new Error('Contact not found')
  
  const existingTags = JSON.parse(contact.tags || '[]')
  const newTags = [...new Set([...existingTags, ...tags])]
  
  const updated = await db.cRMContact.update({
    where: { id: contactId },
    data: { tags: JSON.stringify(newTags) },
  })
  
  return mapContactFromDB(updated)
}

/**
 * Remove tag(s) from a contact
 */
export async function removeContactTags(contactId: string, tags: string[]): Promise<Contact> {
  const contact = await db.cRMContact.findUnique({ where: { id: contactId } })
  if (!contact) throw new Error('Contact not found')
  
  const existingTags = JSON.parse(contact.tags || '[]')
  const filteredTags = existingTags.filter((t: string) => !tags.includes(t))
  
  const updated = await db.cRMContact.update({
    where: { id: contactId },
    data: { tags: JSON.stringify(filteredTags) },
  })
  
  return mapContactFromDB(updated)
}

/**
 * Get all unique tags used across contacts
 */
export async function getAllContactTags(ownerId: string): Promise<{ tag: string; count: number }[]> {
  const contacts = await db.cRMContact.findMany({
    where: { companyId: ownerId },
    select: { tags: true },
  })
  
  const tagCounts: Record<string, number> = {}
  
  for (const contact of contacts) {
    const tags = JSON.parse(contact.tags || '[]') as string[]
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }
  
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

// ============================================
// IMPORT/EXPORT
// ============================================

/**
 * Import contacts from CSV-like data
 */
export async function importContacts(
  ownerId: string,
  records: Record<string, any>[],
  options: {
    skipDuplicates?: boolean
    mergeDuplicates?: boolean
    defaultTags?: string[]
    defaultSource?: string
  } = {}
): Promise<{ imported: number; duplicates: number; errors: string[] }> {
  let imported = 0
  let duplicates = 0
  const errors: string[] = []
  
  for (const record of records) {
    try {
      // Check for required fields
      if (!record.email && !record.phone) {
        errors.push(`Record missing email and phone: ${JSON.stringify(record).slice(0, 100)}`)
        continue
      }
      
      // Check for duplicates
      const potentialDuplicate: Partial<ContactData> = {
        firstName: record.firstName || record.first_name || record['Prénom'] || '',
        lastName: record.lastName || record.last_name || record['Nom'] || '',
        email: record.email || record.Email || record.email_address || '',
        phone: record.phone || record.Phone || record.telephone || '',
        company: record.company || record.Company || record.entreprise || '',
      }
      
      const existingDuplicates = await findDuplicateContacts(potentialDuplicate, ownerId, 0.85)
      
      if (existingDuplicates.length > 0) {
        if (options.skipDuplicates) {
          duplicates++
          continue
        }
        
        if (options.mergeDuplicates && existingDuplicates[0]) {
          await addContactTags(existingDuplicates[0].existing.id, options.defaultTags || [])
          duplicates++
          continue
        }
      }
      
      // Create contact
      await createContact({
        ownerId,
        firstName: potentialDuplicate.firstName || 'Unknown',
        lastName: potentialDuplicate.lastName || 'Unknown',
        email: potentialDuplicate.email || `${uuidv4()}@temp.algeriatrade.dz`,
        phone: potentialDuplicate.phone || '',
        position: record.position || record.jobTitle || record.poste || '',
        industry: record.industry || record.secteur || '',
        city: record.city || record.ville || '',
        country: record.country || record.pays || 'DZ',
        company: potentialDuplicate.company,
        tags: [
          ...(options.defaultTags || []),
          ...(record.tags ? (Array.isArray(record.tags) ? record.tags : record.tags.split(',')) : []),
        ],
        source: options.defaultSource || record.source || 'import',
      })
      
      imported++
    } catch (error) {
      errors.push(`Error importing record: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  return { imported, duplicates, errors }
}

/**
 * Export contacts to a structured format
 */
export async function exportContacts(
  ownerId: string,
  filter: ContactFilter = {},
  fields: string[] = ['firstName', 'lastName', 'email', 'phone', 'company', 'position', 'tags', 'city']
): Promise<Record<string, any>[]> {
  const result = await searchContacts(filter, { pageSize: 10000 })
  
  return result.data.map(contact => {
    const row: Record<string, any> = {}
    
    for (const field of fields) {
      switch (field) {
        case 'firstName':
          row[field] = contact.firstName
          break
        case 'lastName':
          row[field] = contact.lastName
          break
        case 'email':
          row[field] = contact.email
          break
        case 'phone':
          row[field] = contact.phone
          break
        case 'mobile':
          row[field] = contact.mobile
          break
        case 'company':
          row[field] = contact.company
          break
        case 'position':
          row[field] = contact.position
          break
        case 'industry':
          row[field] = contact.industry
          break
        case 'city':
          row[field] = contact.city
          break
        case 'country':
          row[field] = contact.country
          break
        case 'tags':
          row[field] = contact.tags?.join(', ') || ''
          break
        case 'source':
          row[field] = contact.source
          break
        case 'status':
          row[field] = contact.status
          break
        case 'createdAt':
          row[field] = contact.createdAt.toISOString()
          break
        case 'lastContactedAt':
          row[field] = contact.lastContactedAt?.toISOString() || ''
          break
        default:
          row[field] = (contact.customFields && contact.customFields[field]) || ''
      }
    }
    
    return row
  })
}

// ============================================
// HELPERS
// ============================================

function mapContactFromDB(dbContact: any): Contact {
  const notes = JSON.parse(dbContact.notes || '{}')
  const tags = JSON.parse(dbContact.tags || '[]')
  
  return {
    id: dbContact.id,
    ownerId: dbContact.companyId,
    userId: dbContact.userId || undefined,
    firstName: dbContact.firstName,
    lastName: dbContact.lastName,
    email: dbContact.email,
    phone: dbContact.phone || undefined,
    mobile: dbContact.mobile || undefined,
    company: notes.company || undefined,
    position: dbContact.jobTitle || undefined,
    department: dbContact.department || undefined,
    industry: notes.industry || undefined,
    role: dbContact.role as ContactRole,
    website: notes.website || undefined,
    linkedinUrl: dbContact.linkedinUrl || undefined,
    avatarUrl: dbContact.avatarUrl || undefined,
    address: notes.address || undefined,
    city: notes.city || undefined,
    country: notes.country || undefined,
    tags: tags.length > 0 ? tags : undefined,
    source: notes.source || undefined,
    status: notes.status || 'active' as ContactStatus,
    customFields: notes.customFields || undefined,
    lastContactedAt: dbContact.lastInteractionAt || undefined,
    createdAt: dbContact.createdAt,
    updatedAt: dbContact.updatedAt,
  }
}
