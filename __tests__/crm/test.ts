// CRM Module Tests
// AlgeriaTrade.dz B2B Marketplace - Phase 2C: CRM Integration Suite

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Import CRM modules using ES module syntax
import {
  DEFAULT_PIPELINE_STAGES,
  ACTIVITY_TYPES,
  LEAD_SOURCES,
  TASK_PRIORITIES,
  CONTACT_STATUSES,
} from '@/lib/crm/config';

import {
  createContact,
  findDuplicateContacts,
  mergeContacts,
  searchContacts,
} from '@/lib/crm/contacts';

import {
  createLead,
  calculateInitialLeadScore,
  updateLeadStage,
  searchLeads,
} from '@/lib/crm/leads';

import {
  createDeal,
  winDeal,
  loseDeal,
  getPipelineAnalytics,
  searchDeals,
} from '@/lib/crm/pipeline';

import {
  logActivity,
  scheduleFollowUp,
  analyzeSentiment,
  searchActivities,
  getTimeline,
} from '@/lib/crm/activities';

import {
  createTask,
  completeTask,
  getTaskStats,
  searchTasks,
} from '@/lib/crm/tasks';

import {
  getDashboardMetrics,
  getConversionMetrics,
  getRevenueForecast,
  getCLVAnalytics,
  generateSalesReport,
} from '@/lib/crm/analytics';

// Mock data for testing
const mockContact = {
  id: 'contact-1',
  ownerId: 'user-1',
  firstName: 'Ahmed',
  lastName: 'Benali',
  email: 'ahmed@example.com',
  phone: '+213555123456',
  company: 'Tech Solutions Algeria',
  position: 'CTO',
  city: 'Algiers',
  country: 'DZ',
  tags: ['vip', 'tech', 'algeria'],
  status: 'active' as const,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}

const mockLead = {
  id: 'lead-1',
  leadNumber: 'LED-20240115-0001',
  source: 'WEBSITE' as const,
  companyName: 'SARL Technologie Algerienne',
  industry: 'Technology',
  status: 'QUALIFIED' as const,
  pipelineStage: 'qualified',
  estimatedValue: 2500000,
  currency: 'DZD',
  probability: 35,
  expectedCloseDate: new Date('2024-03-15'),
  score: 72,
  engagementScore: 45,
  assignedTo: 'user-1',
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-15'),
}

const mockDeal = {
  id: 'deal-1',
  dealNumber: 'DEAL-20240115-0001',
  title: 'Enterprise Software License',
  value: 5000000,
  currency: 'DZD',
  stage: 'negotiation',
  probability: 70,
  expectedCloseDate: new Date('2024-02-28'),
  createdAt: new Date('2024-01-12'),
  updatedAt: new Date('2024-01-15'),
}

const mockActivity = {
  id: 'activity-1',
  contactId: 'contact-1',
  companyId: 'company-1',
  type: 'call' as const,
  direction: 'OUTBOUND' as const,
  subject: 'Initial discovery call',
  content: 'Discussed their needs for enterprise software',
  durationMinutes: 25,
  channel: 'Phone',
  createdAt: new Date('2024-01-14T10:30:00Z'),
  contactName: 'Ahmed Benali',
}

const mockTask = {
  id: 'task-1',
  ownerId: 'user-1',
  title: 'Follow up on proposal',
  description: 'Send revised proposal after feedback',
  type: 'FOLLOW_UP' as const,
  priority: 'HIGH' as const,
  status: 'TODO' as const,
  dueDate: new Date('2024-01-20'),
  assignedTo: 'user-1',
  createdBy: 'user-1',
  createdAt: new Date('2024-01-13T00:00:00Z'),
}

describe('CRM Config', () => {
  it('should export configuration constants', () => {
    expect(DEFAULT_PIPELINE_STAGES).toBeDefined()
    expect(ACTIVITY_TYPES).toBeInstanceOf(Array)
    expect(LEAD_SOURCES).toBeInstanceOf(Array)
    expect(TASK_PRIORITIES).toBeInstanceOf(Array)
    expect(CONTACT_STATUSES).toBeInstanceOf(Array)
  })

  it('should have correct default pipeline stages', () => {
    expect(DEFAULT_PIPELINE_STAGES).toHaveLength(6)
    expect(DEFAULT_PIPELINE_STAGES[0].id).toBe('lead')
    expect(DEFAULT_PIPELINE_STAGES[DEFAULT_PIPELINE_STAGES.length - 1].id).toBe('closed_lost')
  })

  it('should have valid activity types with required properties', () => {
    for (const activityType of ACTIVITY_TYPES) {
      expect(activityType.type).toBeDefined()
      expect(activityType.label).toBeDefined()
      expect(activityType.color).toBeDefined()
      expect(activityType.icon).toBeDefined()
    }
  })

  it('should have valid task priorities', () => {
    const priorities = TASK_PRIORITIES.map(p => p.priority)
    expect(priorities).toContain('low')
    expect(priorities).toContain('medium')
    expect(priorities).toContain('high')
    expect(priorities).toContain('urgent')
  })
})

describe('CRM Contacts', () => {
  describe('Contact validation', () => {
    it('should validate required fields for contact creation', async () => {
      const contact = await createContact({
        ownerId: 'user-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      })

      expect(contact).toBeDefined()
      expect(contact.firstName).toBe('Test')
      expect(contact.email).toBe('test@example.com')
      expect(contact.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('Duplicate detection', () => {
    it('should find potential duplicates by email', async () => {
      const duplicates = await findDuplicateContacts(
        { firstName: 'Ahmed', lastName: 'Benali', email: 'ahmed@example.com' },
        'user-1'
      )

      expect(duplicates).toBeInstanceOf(Array)
      expect(Array.isArray(duplicates)).toBe(true)
    })

    it('should find potential duplicates by phone', async () => {
      const duplicates = await findDuplicateContacts(
        { firstName: 'Mohammed', lastName: 'Amir', phone: '+213555123456' },
        'user-1'
      )

      expect(duplicates).toBeInstanceOf(Array)
    })
  })

  describe('Contact merging', () => {
    it('should merge two contacts into one primary contact', async () => {
      const primary = await createContact({
        ownerId: 'user-1',
        firstName: 'Primary',
        lastName: 'Contact',
        email: `primary-${Date.now()}@example.com`,
      })

      const secondary = await createContact({
        ownerId: 'user-1',
        firstName: 'Secondary',
        lastName: 'Contact',
        email: `secondary-${Date.now()}@example.com`,
      })

      const merged = await mergeContacts(primary.id, [secondary.id])

      expect(merged.id).toBe(primary.id)
      expect(merged.firstName).toBe('Primary')
    })
  })

  describe('Contact search', () => {
    it('should search contacts with filters', async () => {
      const result = await searchContacts(
        { ownerId: 'user-1' },
        { page: 1, pageSize: 20 }
      )

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(typeof result.total).toBe('number')
      expect(result.page).toBe(1)
    })
  })
})

describe('CRM Leads', () => {
  describe('Lead scoring', () => {
    it('should calculate initial lead score based on source and value', () => {
      // High value lead should score higher
      const highValueScore = calculateInitialLeadScore({
        source: 'RFQ',
        companyName: 'Big Corp',
        companySize: '500+',
        estimatedValue: 10000000,
      })

      const lowValueScore = calculateInitialLeadScore({
        source: 'COLD_CALL',
        companyName: 'Small Biz',
        companySize: '1-10',
        estimatedValue: 10000,
      })

      expect(highValueScore).toBeGreaterThan(lowValueScore)
    })

    it('should return a score between 0 and 100', () => {
      const score = calculateInitialLeadScore({
        source: 'WEBSITE',
        companyName: 'Test Company',
        estimatedValue: 500000,
      })

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('Lead CRUD operations', () => {
    it('should create a new lead', async () => {
      const lead = await createLead({
        ownerId: 'user-1',
        source: 'WEBSITE',
        companyName: 'Test Company',
        estimatedValue: 100000,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        assignedTo: 'user-1',
      })

      expect(lead).toBeDefined()
      expect(lead.companyName).toBe('Test Company')
      expect(lead.source).toBe('WEBSITE')
      expect(lead.leadNumber).toBeDefined()
    })

    it('should search leads with pagination', async () => {
      const result = await searchLeads(
        { assignedTo: 'user-1' },
        { page: 1, pageSize: 10 }
      )

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(typeof result.total).toBe('number')
    })
  })
})

describe('CRM Pipeline', () => {
  describe('Deal management', () => {
    it('should create a new deal', async () => {
      const deal = await createDeal({
        ownerId: 'user-1',
        title: 'Test Deal',
        value: 100000,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      expect(deal).toBeDefined()
      expect(deal.title).toBe('Test Deal')
      expect(deal.value).toBe(100000)
      expect(deal.stage).toBeDefined()
      expect(deal.dealNumber).toBeDefined()
    })

    it('should win a deal', async () => {
      const deal = await createDeal({
        ownerId: 'user-1',
        title: 'Won Deal',
        value: 50000,
        expectedCloseDate: new Date(),
      })

      const wonDeal = await winDeal(deal.id)
      expect(wonDeal.stage).toBe('closed_won')
    })

    it('should lose a deal with reason', async () => {
      const deal = await createDeal({
        ownerId: 'user-1',
        title: 'Lost Deal',
        value: 30000,
        expectedCloseDate: new Date(),
      })

      const lostDeal = await loseDeal(deal.id, 'Budget constraints')
      expect(lostDeal.stage).toBe('closed_lost')
    })
  })

  describe('Deal search', () => {
    it('should search deals with filters', async () => {
      const result = await searchDeals(
        { ownerId: 'user-1' },
        { page: 1, pageSize: 20 }
      )

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(typeof result.total).toBe('number')
    })
  })
})

describe('CRM Activities', () => {
  describe('Activity logging', () => {
    it('should log a new activity', async () => {
      // First create a contact to link the activity to
      const contact = await createContact({
        ownerId: 'company-1',
        firstName: 'Activity',
        lastName: 'Test',
        email: `activity-${Date.now()}@example.com`,
      })

      const activity = await logActivity({
        contactId: contact.id,
        companyId: 'company-1',
        type: 'call',
        subject: 'Test call',
        description: 'Had a discussion about requirements',
        createdBy: 'user-1',
      })

      expect(activity).toBeDefined()
      expect(activity.subject).toBe('Test call')
      expect(activity.type).toBe('call')
      expect(activity.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('Activity search', () => {
    it('should search activities with filters', async () => {
      const result = await searchActivities(
        { companyId: 'company-1' },
        { page: 1, pageSize: 20 }
      )

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(typeof result.total).toBe('number')
    })
  })

  describe('Follow-up scheduling', () => {
    it('should schedule follow-up after call', async () => {
      const contact = await createContact({
        ownerId: 'company-1',
        firstName: 'FollowUp',
        lastName: 'Test',
        email: `followup-${Date.now()}@example.com`,
      })

      const activity = await logActivity({
        contactId: contact.id,
        companyId: 'company-1',
        type: 'call',
        subject: 'Discovery call',
        description: 'Initial introduction',
        createdBy: 'user-1',
      })

      const followUp = await scheduleFollowUp(activity.id)

      expect(followUp.taskId).toBeDefined()
      expect(followUp.scheduledFor).toBeInstanceOf(Date)
    })
  })
})

describe('CRM Tasks', () => {
  describe('Task CRUD operations', () => {
    it('should create a task', async () => {
      const task = await createTask({
        ownerId: 'user-1',
        title: 'Follow up with prospect',
        type: 'FOLLOW_UP',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: 'user-1',
      })

      expect(task).toBeDefined()
      expect(task.title).toBe('Follow up with prospect')
      expect(task.priority).toBe('HIGH')
      expect(task.status).toBe('TODO')
    })

    it('should complete a task', async () => {
      const task = await createTask({
        ownerId: 'user-1',
        title: 'Task to complete',
        dueDate: new Date(),
        createdBy: 'user-1',
      })

      const completed = await completeTask(task.id, {
        notes: 'Done successfully',
        outcome: 'Completed',
      })

      expect(completed.status).toBe('COMPLETED')
      expect(completed.completedAt).toBeInstanceOf(Date)
    })
  })

  describe('Task statistics', () => {
    it('should return task statistics for a user', async () => {
      const stats = await getTaskStats('user-1')

      expect(stats).toBeDefined()
      expect(stats.total).toBeGreaterThanOrEqual(0)
      expect(stats.byStatus).toBeDefined()
      expect(stats.byPriority).toBeDefined()
    })
  })

  describe('Task search', () => {
    it('should search tasks with filters', async () => {
      const result = await searchTasks(
        { ownerId: 'user-1' },
        { page: 1, pageSize: 20 }
      )

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(typeof result.total).toBe('number')
    })
  })
})

describe('CRM Analytics', () => {
  describe('Dashboard metrics', () => {
    it('should return dashboard metrics', async () => {
      const metrics = await getDashboardMetrics('user-1', '30d')

      expect(metrics).toBeDefined()
      expect(metrics.totalContacts).toBeGreaterThanOrEqual(0)
      expect(metrics.totalLeads).toBeGreaterThanOrEqual(0)
      expect(metrics.dealsWon).toBeGreaterThanOrEqual(0)
      expect(typeof metrics.conversionRate).toBe('number')
    })
  })

  describe('Conversion metrics', () => {
    it('should return conversion metrics', async () => {
      const conversion = await getConversionMetrics('user-1')

      expect(conversion).toBeDefined()
      expect(typeof conversion.overallRate).toBe('number')
      expect(conversion.bySource).toBeDefined()
      expect(conversion.funnelStages).toBeInstanceOf(Array)
    })
  })

  describe('Revenue forecasting', () => {
    it('should generate revenue forecast', async () => {
      const forecast = await getRevenueForecast('user-1')

      expect(forecast).toBeDefined()
      expect(forecast.currentMonth).toBeDefined()
      expect(forecast.confidenceLevels).toBeDefined()
      expect(typeof forecast.confidenceLevels.conservative).toBe('number')
      expect(typeof forecast.confidenceLevels.optimistic).toBe('number')
    })
  })

  describe('Customer Lifetime Value', () => {
    it('should calculate CLV analytics', async () => {
      const clv = await getCLVAnalytics('user-1')

      expect(clv).toBeDefined()
      expect(clv.averageCLV).toBeGreaterThanOrEqual(0)
      expect(clv.topCustomers).toBeInstanceOf(Array)
      expect(clv.retentionRate).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Report generation', () => {
    it('should generate comprehensive sales report', async () => {
      const report = await generateSalesReport('user-1', '30d')

      expect(report).toBeDefined()
      expect(report.period).toBeDefined()
      expect(report.summary).toBeDefined()
      expect(report.metrics).toBeDefined()
      expect(report.recommendations).toBeInstanceOf(Array)
    })
  })
})

describe('CRM Integration Tests', () => {
  it('should create contact then create linked lead', async () => {
    const contact = await createContact({
      ownerId: 'user-1',
      firstName: 'Linked',
      lastName: 'Contact',
      email: `linked-${Date.now()}@example.com`,
      company: 'Test Corp',
    })

    expect(contact.id).toBeDefined()

    const lead = await createLead({
      ownerId: 'user-1',
      source: 'REFERRAL',
      companyName: 'Test Corp',
      estimatedValue: 200000,
      expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      assignedTo: 'user-1',
    })

    expect(lead).toBeDefined()
    expect(lead.companyName).toBe('Test Corp')
  })

  it('should create deal and log activities against it', async () => {
    const deal = await createDeal({
      ownerId: 'user-1',
      title: 'Integration Test Deal',
      value: 150000,
      expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    })

    expect(deal.id).toBeDefined()

    const contact = await createContact({
      ownerId: 'user-1',
      firstName: 'Deal',
      lastName: 'Contact',
      email: `deal-contact-${Date.now()}@example.com`,
    })

    const activity = await logActivity({
      contactId: contact.id,
      companyId: 'user-1',
      type: 'meeting',
      subject: 'Product demo for Integration Test Deal',
      description: 'Demonstrated key features',
      durationMinutes: 45,
      createdBy: 'user-1',
    })

    expect(activity.id).toBeDefined()
    expect(activity.subject).toContain('Integration Test Deal')
  })

  it('should create follow-up task after logging activity', async () => {
    const contact = await createContact({
      ownerId: 'user-1',
      firstName: 'Task',
      lastName: 'Flow',
      email: `taskflow-${Date.now()}@example.com`,
    })

    const activity = await logActivity({
      contactId: contact.id,
      companyId: 'user-1',
      type: 'demo',
      subject: 'Product demonstration',
      description: 'Showed product features',
      createdBy: 'user-1',
    })

    const followUp = await scheduleFollowUp(activity.id, {
      customTaskTitle: 'Send pricing info post-demo',
    })

    expect(followUp.taskId).toBeDefined()
    expect(followUp.scheduledFor).toBeInstanceOf(Date)
  })
})
