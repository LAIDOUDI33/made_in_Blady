// CRM Tasks Module
// Task management, assignment, due dates, priority levels, completion tracking
// AlgeriaTrade.dz B2B Marketplace - CRM Integration Suite

import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { TASK_PRIORITIES, TaskPriority } from './config'

// ============================================
// TYPES
// ============================================

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DEFERRED'
export type TaskType = 'CALL' | 'EMAIL' | 'MEETING' | 'FOLLOW_UP' | 'PROPOSAL' | 'DEMO' | 'REMINDER' | 'OTHER'

export interface TaskData {
  ownerId: string
  assigneeId?: string
  
  // Related entities
  contactId?: string
  leadId?: string
  dealId?: string
  
  // Basic info
  title: string
  description?: string
  
  // Classification
  type?: TaskType
  priority?: TaskPriority
  
  // Scheduling
  dueDate: Date
  dueTime?: string
  
  // Reminders
  remindBeforeMinutes?: number
  
  // Creator
  createdBy: string
}

export interface Task extends TaskData {
  id: string
  status: TaskStatus
  
  // Completion info
  completedAt?: Date
  resultNotes?: string
  outcome?: string
  
  // Reminder status
  reminderSent: boolean
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  
  // Related entity names (populated)
  contactName?: string
  leadTitle?: string
  dealTitle?: string
  assigneeName?: string
}

export interface TaskFilter {
  ownerId?: string
  assigneeId?: string
  contactId?: string
  leadId?: string
  status?: TaskStatus
  priority?: TaskPriority
  type?: TaskType
  isOverdue?: boolean
  isDueToday?: boolean
  isDueThisWeek?: boolean
  dueFrom?: Date
  dueTo?: Date
  createdFrom?: Date
  createdTo?: Date
  search?: string
}

export interface TaskPaginationOptions {
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedTasks {
  data: Task[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TaskStats {
  total: number
  byStatus: Record<TaskStatus, number>
  byPriority: Record<TaskPriority, number>
  overdue: number
  dueToday: number
  dueThisWeek: number
  completedThisWeek: number
  avgCompletionTime: number // Hours
  completionRate: number
}

// ============================================
// TASK CRUD OPERATIONS
// ============================================

/**
 * Create a new task
 */
export async function createTask(data: TaskData): Promise<Task> {
  const task = await db.cRMTask.create({
    data: {
      id: uuidv4(),
      leadId: data.leadId,
      contactId: data.contactId,
      companyId: data.ownerId,
      title: data.title,
      description: data.description || '',
      type: data.type || 'OTHER',
      priority: data.priority || 'MEDIUM',
      status: 'TODO',
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      assignedTo: data.assigneeId || data.ownerId,
      createdBy: data.createdBy,
      remindBefore: data.remindBeforeMinutes || 60,
      reminderSent: false,
    },
  })
  
  return mapTaskFromDB(task)
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<Task | null> {
  const task = await db.cRMTask.findUnique({
    where: { id },
    include: {
      lead: true,
    },
  })
  
  return task ? mapTaskFromDB(task) : null
}

/**
 * Update a task
 */
export async function updateTask(
  id: string,
  data: Partial<Omit<TaskData, 'ownerId' | 'createdBy'> & {
  status?: TaskStatus
  resultNotes?: string
  outcome?: string
}>
): Promise<Task> {
  const existing = await db.cRMTask.findUnique({ where: { id } })
  if (!existing) throw new Error('Task not found')
  
  const updateData: any = {}
  
  if (data.contactId !== undefined) updateData.contactId = data.contactId
  if (data.leadId !== undefined) updateData.leadId = data.leadId
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.type !== undefined) updateData.type = data.type
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
  if (data.dueTime !== undefined) updateData.dueTime = data.dueTime
  if (data.assigneeId !== undefined) updateData.assignedTo = data.assigneeId
  if (data.remindBeforeMinutes !== undefined) updateData.remindBefore = data.remindBeforeMinutes
  if (data.status !== undefined) updateData.status = data.status
  if (data.resultNotes !== undefined) updateData.resultNotes = data.resultNotes
  if (data.outcome !== undefined) updateData.outcome = data.outcome
  
  // Auto-set completion date when marking complete
  if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
    updateData.completedAt = new Date()
  }
  
  const updated = await db.cRMTask.update({
    where: { id },
    data: updateData,
  })
  
  return mapTaskFromDB(updated)
}

/**
 * Complete a task with results
 */
export async function completeTask(
  id: string,
  result?: {
    notes?: string
    outcome?: string
  }
): Promise<Task> {
  return updateTask(id, {
    status: 'COMPLETED',
    ...result,
  })
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  await db.cRMTask.delete({ where: { id } })
}

// ============================================
// TASK SEARCH & FILTERING
// ============================================

/**
 * Search tasks with filters and pagination
 */
export async function searchTasks(
  filter: TaskFilter = {},
  options: TaskPaginationOptions = {}
): Promise<PaginatedTasks> {
  const page = options.page || 1
  const pageSize = Math.min(options.pageSize || 20, 100)
  const skip = (page - 1) * pageSize
  
  const where: any = {}
  
  // Owner/Assignee filters
  if (filter.ownerId) {
    where.companyId = filter.ownerId
  }
  if (filter.assigneeId) {
    where.assignedTo = filter.assigneeId
  }
  
  // Entity filters
  if (filter.contactId) {
    where.contactId = filter.contactId
  }
  if (filter.leadId) {
    where.leadId = filter.leadId
  }
  
  // Status filter
  if (filter.status) {
    where.status = filter.status
  }
  
  // Priority filter
  if (filter.priority) {
    where.priority = filter.priority
  }
  
  // Type filter
  if (filter.type) {
    where.type = filter.type
  }
  
  // Overdue filter
  if (filter.isOverdue === true) {
    where.status = { in: ['TODO', 'IN_PROGRESS'] }
    where.dueDate = { lt: new Date() }
  }
  
  // Due today filter
  if (filter.isDueToday === true) {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    
    where.dueDate = { gte: todayStart, lte: todayEnd }
  }
  
  // Due this week filter
  if (filter.isDueThisWeek === true) {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    where.dueDate = { gte: weekStart, lte: weekEnd }
  }
  
  // Due date range filters
  if (filter.dueFrom || filter.dueTo) {
    where.dueDate = {}
    if (filter.dueFrom) where.dueDate.gte = filter.dueFrom
    if (filter.dueTo) where.dueDate.lte = filter.dueTo
  }
  
  // Created date range filters
  if (filter.createdFrom || filter.createdTo) {
    where.createdAt = {}
    if (filter.createdFrom) where.createdAt.gte = filter.createdFrom
    if (filter.createdTo) where.createdAt.lte = filter.createdTo
  }
  
  // Search query
  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
    ]
  }
  
  const [tasks, total] = await Promise.all([
    db.cRMTask.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        [(options.sortBy || 'dueDate')]: options.sortOrder || 'asc',
      },
      include: {
        lead: true,
      },
    }),
    db.cRMTask.count({ where }),
  ])
  
  return {
    data: tasks.map(mapTaskFromDB),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Get tasks for a specific user (assigned to them)
 */
export async function getUserTasks(
  userId: string,
  options: TaskFilter & TaskPaginationOptions = {}
): Promise<PaginatedTasks> {
  return searchTasks({ ...options, assigneeId: userId }, options)
}

/**
 Get overdue tasks for a user
 */
export async function getOverdueTasks(userId: string): Promise<Task[]> {
  const tasks = await db.cRMTask.findMany({
    where: {
      assignedTo: userId,
      status: { in: ['TODO', 'IN_PROGRESS'] },
      dueDate: { lt: new Date() },
    },
    orderBy: { dueDate: 'asc' },
  })
  
  return tasks.map(mapTaskFromDB)
}

/**
 * Get tasks due today for a user
 */
export async function getTodayTasks(userId: string): Promise<Task[]> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  
  const tasks = await db.cRMTask.findMany({
    where: {
      assignedTo: userId,
      dueDate: { gte: todayStart, lte: todayEnd },
    },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
  })
  
  return tasks.map(mapTaskFromDB)
}

/**
 * Get upcoming tasks for a user (next 7 days)
 */
export async function getUpcomingTasks(userId: string, days: number = 7): Promise<Task[]> {
  const now = new Date()
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  
  const tasks = await db.cRMTask.findMany({
    where: {
      assignedTo: userId,
      status: { in: ['TODO', 'IN_PROGRESS'] },
      dueDate: { gte: now, lte: futureDate },
    },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
  })
  
  return tasks.map(mapTaskFromDB)
}

// ============================================
// TASK STATISTICS
// ============================================

/**
 * Get comprehensive task statistics for a user
 */
export async function getTaskStats(userId: string): Promise<TaskStats> {
  const allTasks = await db.cRMTask.findMany({
    where: { assignedTo: userId },
  })
  
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  
  // Count by status
  const byStatus: Record<string, number> = {
    TODO: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    DEFERRED: 0,
  }
  
  // Count by priority
  const byPriority: Record<string, number> = {
    URGENT: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  }
  
  let overdue = 0
  let dueToday = 0
  let dueThisWeek = 0
  let completedThisWeek = 0
  let totalCompletionTime = 0
  let completedCount = 0
  
  for (const task of allTasks) {
    // Status counts
    byStatus[task.status] = (byStatus[task.status] || 0) + 1
    
    // Priority counts
    byPriority[task.priority] = (byPriority[task.priority] || 0) + 1
    
    // Overdue check
    if (['TODO', 'IN_PROGRESS'].includes(task.status) && task.dueDate < now) {
      overdue++
    }
    
    // Due today check
    if (task.dueDate >= todayStart && task.dueDate <= new Date(todayStart.getTime() + 86400000)) {
      dueToday++
    }
    
    // Due this week check
    if (task.dueDate >= weekStart && task.dueDate <= weekEnd) {
      dueThisWeek++
    }
    
    // Completed this week check
    if (task.status === 'COMPLETED' && task.completedAt) {
      if (task.completedAt >= weekStart && task.completedAt <= weekEnd) {
        completedThisWeek++
      }
      
      // Calculate completion time
      if (task.createdAt && task.completedAt) {
        const hours = (task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60)
        totalCompletionTime += hours
        completedCount++
      }
    }
  }
  
  const completionRate = allTasks.length > 0 
    ? (byStatus.COMPLETED / allTasks.length) * 100 
    : 0
  
  return {
    total: allTasks.length,
    byStatus: byStatus as Record<TaskStatus, number>,
    byPriority: byPriority as Record<TaskPriority, number>,
    overdue,
    dueToday,
    dueThisWeek,
    completedThisWeek,
    avgCompletionTime: completedCount > 0 ? Math.round(totalCompletionTime / completedCount) : 0,
    completionRate: Math.round(completionRate),
  }
}

// ============================================
// TASK BULK OPERATIONS
// ============================================

/**
 * Bulk complete tasks
 */
export async function bulkCompleteTasks(
  taskIds: string[],
  result?: { notes?: string; outcome?: string }
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0
  
  for (const taskId of taskIds) {
    try {
      await completeTask(taskId, result)
      success++
    } catch {
      failed++
    }
  }
  
  return { success, failed }
}

/**
 * Bulk reassign tasks
 */
export async function bulkReassignTasks(
  taskIds: string[],
  newAssigneeId: string
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0
  
  for (const taskId of taskIds) {
    try {
      await db.cRMTask.update({
        where: { id: taskId },
        data: { assignedTo: newAssigneeId },
      })
      success++
    } catch {
      failed++
    }
  }
  
  return { success, failed }
}

/**
 * Bulk update task priorities
 */
export async function bulkUpdatePriorities(
  taskIds: string[],
  priority: TaskPriority
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0
  
  for (const taskId of taskIds) {
    try {
      await db.cRMTask.update({
        where: { id: taskId },
        data: { priority },
      })
      success++
    } catch {
      failed++
    }
  }
  
  return { success, failed }
}

// ============================================
// TASK REMINDERS
// ============================================

/**
 * Get tasks that need reminders sent
 */
export async function getTasksNeedingReminders(): Promise<Task[]> {
  const now = new Date()
  
  // Find tasks where:
  // - Not completed/cancelled
  // - Reminder not yet sent
  // - Due date minus remindBefore is within next hour or already past
  const tasks = await db.cRMTask.findMany({
    where: {
      status: { in: ['TODO', 'IN_PROGRESS'] },
      reminderSent: false,
    },
  })
  
  const tasksNeedingReminder: typeof tasks = []
  
  for (const task of tasks) {
    const remindAt = new Date(task.dueDate.getTime() - task.remindBefore * 60000)
    
    // If we're past the reminder time or within the next hour
    if (remindAt <= new Date(now.getTime() + 3600000)) {
      tasksNeedingReminder.push(task)
    }
  }
  
  return tasksNeedingReminder.map(mapTaskFromDB)
}

/**
 * Mark reminder as sent for a task
 */
export async function markReminderSent(taskId: string): Promise<void> {
  await db.cRMTask.update({
    where: { id: taskId },
    data: { reminderSent: true },
  })
}

// ============================================
// HELPERS
// ============================================

function mapTaskFromDB(dbTask: any): Task {
  return {
    id: dbTask.id,
    ownerId: dbTask.companyId,
    assigneeId: dbTask.assignedTo,
    contactId: dbTask.contactId || undefined,
    leadId: dbTask.leadId || undefined,
    title: dbTask.title,
    description: dbTask.description || undefined,
    type: dbTask.type as TaskType,
    priority: dbTask.priority as TaskPriority,
    dueDate: dbTask.dueDate,
    dueTime: dbTask.dueTime || undefined,
    remindBeforeMinutes: dbTask.remindBefore,
    createdBy: dbTask.createdBy,
    status: dbTask.status as TaskStatus,
    completedAt: dbTask.completedAt || undefined,
    resultNotes: dbTask.resultNotes || undefined,
    outcome: dbTask.outcome || undefined,
    reminderSent: dbTask.reminderSent,
    createdAt: dbTask.createdAt,
    updatedAt: dbTask.updatedAt,
    contactName: undefined, // Would need to join with contact table
    leadTitle: dbTask.lead?.companyName || undefined,
    dealTitle: undefined,
    assigneeName: undefined, // Would need to join with user table
  }
}
