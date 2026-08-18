// CRM Configuration & Defaults
// AlgeriaTrade.dz B2B Marketplace - CRM Integration Suite

// ============================================
// PIPELINE STAGES CONFIGURATION
// ============================================

export interface PipelineStageConfig {
  id: string
  name: string
  nameAr: string
  nameFr: string
  order: number
  color: string
  probability: number
  icon?: string
}

export const DEFAULT_PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    id: 'lead',
    name: 'Lead',
    nameAr: 'عميل محتمل',
    nameFr: 'Prospect',
    order: 0,
    color: '#94a3b8',
    probability: 5,
    icon: 'UserPlus',
  },
  {
    id: 'qualified',
    name: 'Qualified',
    nameAr: 'مؤهل',
    nameFr: 'Qualifié',
    order: 1,
    color: '#60a5fa',
    probability: 20,
    icon: 'CheckCircle',
  },
  {
    id: 'proposal',
    name: 'Proposal',
    nameAr: 'اقتراح',
    nameFr: 'Proposition',
    order: 2,
    color: '#fbbf24',
    probability: 40,
    icon: 'FileText',
  },
  {
    id: 'negotiation',
    name: 'Negotiation',
    nameAr: 'تفاوض',
    nameFr: 'Négociation',
    order: 3,
    color: '#fb923c',
    probability: 65,
    icon: 'HandshakeIcon',
  },
  {
    id: 'closed_won',
    name: 'Closed Won',
    nameAr: 'مغلق - فوز',
    nameFr: 'Gagné',
    order: 4,
    color: '#22c55e',
    probability: 100,
    icon: 'Trophy',
  },
  {
    id: 'closed_lost',
    name: 'Closed Lost',
    nameAr: 'مغلق - خسارة',
    nameFr: 'Perdu',
    order: 5,
    color: '#ef4444',
    probability: 0,
    icon: 'XCircle',
  },
]

// ============================================
// ACTIVITY TYPES
// ============================================

export type ActivityType = 
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'task'
  | 'follow_up'
  | 'demo'
  | 'proposal_sent'
  | 'quote_sent'
  | 'contract_sent'
  | 'payment_received'
  | 'system'

export interface ActivityTypeConfig {
  type: ActivityType
  label: string
  labelAr: string
  labelFr: string
  color: string
  icon: string
  hasDuration: boolean
}

export const ACTIVITY_TYPES: ActivityTypeConfig[] = [
  { type: 'call', label: 'Phone Call', labelAr: 'اتصال هاتفي', labelFr: 'Appel téléphonique', color: '#3b82f6', icon: 'Phone', hasDuration: true },
  { type: 'email', label: 'Email', labelAr: 'بريد إلكتروني', labelFr: 'Email', color: '#8b5cf6', icon: 'Mail', hasDuration: false },
  { type: 'meeting', label: 'Meeting', labelAr: 'اجتماع', labelFr: 'Réunion', color: '#10b981', icon: 'Users', hasDuration: true },
  { type: 'note', label: 'Note', labelAr: 'ملاحظة', labelFr: 'Note', color: '#6b7280', icon: 'FileText', hasDuration: false },
  { type: 'task', label: 'Task', labelAr: 'مهمة', labelFr: 'Tâche', color: '#f59e0b', icon: 'CheckSquare', hasDuration: false },
  { type: 'follow_up', label: 'Follow Up', labelAr: 'متابعة', labelFr: 'Suivi', color: '#ec4899', icon: 'RefreshCw', hasDuration: false },
  { type: 'demo', label: 'Demo', labelAr: 'عرض توضيحي', labelFr: 'Démo', color: '#06b6d4', icon: 'Play', hasDuration: true },
  { type: 'proposal_sent', label: 'Proposal Sent', labelAr: 'إرسال اقتراح', labelFr: 'Proposition envoyée', color: '#84cc16', icon: 'Send', hasDuration: false },
  { type: 'quote_sent', label: 'Quote Sent', labelAr: 'إرسال عرض سعر', labelFr: 'Devis envoyé', color: '#a855f7', icon: 'DollarSign', hasDuration: false },
  { type: 'contract_sent', label: 'Contract Sent', labelAr: 'إرسال عقد', labelFr: 'Contrat envoyé', color: '#14b8a6', icon: 'FileSignature', hasDuration: false },
  { type: 'payment_received', label: 'Payment Received', labelAr: 'استلام دفعة', labelFr: 'Paiement reçu', color: '#22c55e', icon: 'CreditCard', hasDuration: false },
  { type: 'system', label: 'System', labelAr: 'نظام', labelFr: 'Système', color: '#94a3b8', icon: 'Settings', hasDuration: false },
]

// ============================================
// LEAD SCORING RULES
// ============================================

export interface LeadScoringRule {
  factor: string
  maxPoints: number
  description: string
  criteria: ScoringCriteria[]
}

export interface ScoringCriteria {
  condition: string
  points: number
  label: string
}

export const LEAD_SCORING_RULES: LeadScoringRule[] = [
  {
    factor: 'engagement',
    maxPoints: 30,
    description: 'Based on interaction frequency and recency',
    criteria: [
      { condition: '5+ interactions in last 30 days', points: 15, label: 'Highly Engaged' },
      { condition: '3-4 interactions in last 30 days', points: 10, label: 'Engaged' },
      { condition: '1-2 interactions in last 30 days', points: 5, label: 'Some Engagement' },
      { condition: 'Responded within 24 hours', points: 10, label: 'Fast Responder' },
      { condition: 'Requested demo or proposal', points: 5, label: 'Active Interest' },
    ],
  },
  {
    factor: 'fit',
    maxPoints: 25,
    description: 'How well the lead matches ideal customer profile',
    criteria: [
      { condition: 'Matches target industry', points: 10, label: 'Target Industry' },
      { condition: 'Company size 200+ employees', points: 8, label: 'Enterprise' },
      { condition: 'Company size 50-199 employees', points: 5, label: 'Mid-Market' },
      { condition: 'Decision maker role (CEO, CTO, etc.)', points: 7, label: 'Decision Maker' },
    ],
  },
  {
    factor: 'behavior',
    maxPoints: 20,
    description: 'Actions taken by the lead',
    criteria: [
      { condition: 'Visited pricing page', points: 8, label: 'Price Interest' },
      { condition: 'Downloaded resources', points: 5, label: 'Content Consumer' },
      { condition: 'Attended webinar/event', points: 7, label: 'Event Attendee' },
    ],
  },
  {
    factor: 'urgency',
    maxPoints: 15,
    description: 'Timeline and buying signals',
    criteria: [
      { condition: 'Needs solution within 1 month', points: 10, label: 'Urgent Need' },
      { condition: 'Budget approved', points: 5, label: 'Budget Ready' },
    ],
  },
  {
    factor: 'authority',
    maxPoints: 10,
    description: 'Decision-making power',
    criteria: [
      { condition: 'C-level executive', points: 10, label: 'Executive' },
      { condition: 'VP or Director', points: 7, label: 'Senior Management' },
      { condition: 'Manager level', points: 4, label: 'Manager' },
    ],
  },
]

// ============================================
// LEAD SOURCES
// ============================================

export type LeadSource = 
  | 'website'
  | 'referral'
  | 'trade_show'
  | 'cold_call'
  | 'email'
  | 'social_media'
  | 'partner'
  | 'rfq'
  | 'paid_search'
  | 'organic'
  | 'direct'
  | 'other'

export interface LeadSourceConfig {
  source: LeadSource
  label: string
  labelAr: string
  labelFr: string
  defaultScore: number
  color: string
}

export const LEAD_SOURCES: LeadSourceConfig[] = [
  { source: 'referral', label: 'Referral', labelAr: 'إحالة', labelFr: 'Recommandation', defaultScore: 25, color: '#22c55e' },
  { source: 'rfq', label: 'RFQ/Quote Request', labelAr: 'طلب عرض سعر', labelFr: 'Demande de devis', defaultScore: 30, color: '#3b82f6' },
  { source: 'trade_show', label: 'Trade Show/Event', labelAr: 'معرض تجاري', labelFr: 'Salon professionnel', defaultScore: 20, color: '#8b5cf6' },
  { source: 'partner', label: 'Partner Channel', labelAr: 'قناة شريك', labelFr: 'Canal partenaire', defaultScore: 22, color: '#06b6d4' },
  { source: 'website', label: 'Website', labelAr: 'الموقع الإلكتروني', labelFr: 'Site web', defaultScore: 15, color: '#f59e0b' },
  { source: 'paid_search', label: 'Paid Search (PPC)', labelAr: 'بحث مدفوع', labelFr: 'Recherche payante', defaultScore: 12, color: '#ec4899' },
  { source: 'social_media', label: 'Social Media', labelAr: 'وسائل التواصل الاجتماعي', labelFr: 'Réseaux sociaux', defaultScore: 12, color: '#ef4444' },
  { source: 'organic', label: 'Organic Search', labelAr: 'بحث عضوي', labelFr: 'Recherche organique', defaultScore: 10, color: '#84cc16' },
  { source: 'email', label: 'Email Campaign', labelAr: 'حملة بريدية', labelFr: 'Campagne email', defaultScore: 10, color: '#14b8a6' },
  { source: 'cold_call', label: 'Cold Call', labelAr: 'اتصال بارد', labelFr: 'Appel à froid', defaultScore: 5, color: '#6b7280' },
  { source: 'direct', label: 'Direct Traffic', labelAr: 'زيارة مباشرة', labelFr: 'Trafic direct', defaultScore: 8, color: '#a855f7' },
  { source: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre', defaultScore: 5, color: '#94a3b8' },
]

// ============================================
// TASK PRIORITIES
// ============================================

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskPriorityConfig {
  priority: TaskPriority
  label: string
  labelAr: string
  labelFr: string
  color: string
  bgColor: string
  dueTimeHours: number
}

export const TASK_PRIORITIES: TaskPriorityConfig[] = [
  { priority: 'urgent', label: 'Urgent', labelAr: 'عاجل', labelFr: 'Urgent', color: '#dc2626', bgColor: '#fef2f2', dueTimeHours: 4 },
  { priority: 'high', label: 'High', labelAr: 'مرتفع', labelFr: 'Élevé', color: '#ea580c', bgColor: '#fff7ed', dueTimeHours: 24 },
  { priority: 'medium', label: 'Medium', labelAr: 'متوسط', labelFr: 'Moyen', color: '#ca8a04', bgColor: '#fefce8', dueTimeHours: 48 },
  { priority: 'low', label: 'Low', labelAr: 'منخفض', labelFr: 'Faible', color: '#65a30d', bgColor: '#f7fee7', dueTimeHours: 72 },
]

// ============================================
// CONTACT STATUSES
// ============================================

export type ContactStatus = 'active' | 'inactive' | 'prospect' | 'customer' | 'churned'

export interface ContactStatusConfig {
  status: ContactStatus
  label: string
  labelAr: string
  labelFr: string
  color: string
}

export const CONTACT_STATUSES: ContactStatusConfig[] = [
  { status: 'active', label: 'Active', labelAr: 'نشط', labelFr: 'Actif', color: '#22c55e' },
  { status: 'prospect', label: 'Prospect', labelAr: 'عميل محتمل', labelFr: 'Prospect', color: '#3b82f6' },
  { status: 'customer', label: 'Customer', labelAr: 'عميل', labelFr: 'Client', color: '#8b5cf6' },
  { status: 'inactive', label: 'Inactive', labelAr: 'غير نشط', labelFr: 'Inactif', color: '#94a3b8' },
  { status: 'churned', label: 'Churned', labelAr: 'فقد', labelFr: 'Perdu', color: '#ef4444' },
]

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export interface NotificationPreference {
  key: string
  label: string
  labelAr: string
  labelFr: string
  description: string
  defaultEnabled: boolean
  category: 'leads' | 'tasks' | 'deals' | 'activities' | 'system'
}

export const NOTIFICATION_PREFERENCES: NotificationPreference[] = [
  // Leads notifications
  { key: 'lead_assigned', label: 'Lead Assigned to Me', labelAr: 'تعيين عميل محتمل لي', labelFr: 'Prospect assigné', description: 'When a new lead is assigned to you', defaultEnabled: true, category: 'leads' },
  { key: 'lead_stage_changed', label: 'Lead Stage Changed', labelAr: 'تغيير مرحلة العميل المحتمل', labelFr: 'Changement d\'étape du prospect', description: 'When a lead moves to a new stage', defaultEnabled: true, category: 'leads' },
  { key: 'lead_score_updated', label: 'Lead Score Updated', labelAr: 'تحديث نقاط العميل المحتمل', labelFr: 'Mise à jour du score prospect', description: 'When a lead\'s score changes significantly', defaultEnabled: false, category: 'leads' },
  
  // Tasks notifications
  { key: 'task_due_soon', label: 'Task Due Soon', labelAr: 'مهمة قريبة الموعد', labelFr: 'Tâche à venir', description: 'When a task is due within 24 hours', defaultEnabled: true, category: 'tasks' },
  { key: 'task_overdue', label: 'Task Overdue', labelAr: 'مهمة متأخرة', labelFr: 'Tâche en retard', description: 'When a task becomes overdue', defaultEnabled: true, category: 'tasks' },
  { key: 'task_completed', label: 'Task Completed', label: 'اكتمال المهمة', labelFr: 'Tâche terminée', description: 'When an assigned task is completed', defaultEnabled: true, category: 'tasks' },
  
  // Deals notifications
  { key: 'deal_won', label: 'Deal Won', labelAr: 'صفقة مكتسبة', labelFr: 'Affaire gagnée', description: 'When a deal is marked as won', defaultEnabled: true, category: 'deals' },
  { key: 'deal_lost', label: 'Deal Lost', labelAr: 'صفقة خاسرة', labelFr: 'Affaire perdue', description: 'When a deal is marked as lost', defaultEnabled: true, category: 'deals' },
  { key: 'deal_value_changed', label: 'Deal Value Changed', labelAr: 'تغيير قيمة الصفقة', labelFr: 'Valeur de l\'affaire modifiée', description: 'When deal value changes by more than 20%', defaultEnabled: false, category: 'deals' },
  
  // Activities notifications
  { key: 'new_interaction', label: 'New Interaction Logged', labelAr: 'تسجيل تفاعل جديد', labelFr: 'Nouvelle interaction enregistrée', description: 'When someone logs an interaction on your contact/lead', defaultEnabled: true, category: 'activities' },
  
  // System notifications
  { key: 'weekly_summary', label: 'Weekly Summary', labelAr: 'ملخص أسبوعي', labelFr: 'Résumé hebdomadaire', description: 'Weekly digest of your CRM activities', defaultEnabled: true, category: 'system' },
  { key: 'monthly_report', label: 'Monthly Report', labelAr: 'تقرير شهري', labelFr: 'Rapport mensuel', description: 'Monthly performance report', defaultEnabled: true, category: 'system' },
]

// ============================================
// EMAIL TEMPLATES
// ============================================

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
  category: 'follow_up' | 'proposal' | 'welcome' | 'reminder' | 'thank_you' | 'custom'
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'follow_up_initial',
    name: 'Initial Follow-up',
    subject: 'Following up on our conversation - {{company_name}}',
    body: `Dear {{contact_name}},

Thank you for your interest in AlgeriaTrade.dz. I wanted to follow up on our recent conversation regarding {{product_interest}}.

I'd love to schedule a brief call to discuss how we can help {{company_name}} achieve its goals.

Are you available for a quick 15-minute call this week?

Best regards,
{{sender_name}}
AlgeriaTrade.dz`,
    variables: ['contact_name', 'company_name', 'product_interest', 'sender_name'],
    category: 'follow_up',
  },
  {
    id: 'proposal_sent',
    name: 'Proposal Sent Notification',
    subject: 'Proposal for {{company_name}} - {{proposal_title}}',
    body: `Dear {{contact_name}},

Please find attached our proposal for {{proposal_title}}.

Key highlights:
- {{key_benefit_1}}
- {{key_benefit_2}}
- {{key_benefit_3}}

The proposal is valid until {{valid_until}}.

I'm available to discuss any questions you may have.

Best regards,
{{sender_name}}`,
    variables: ['contact_name', 'company_name', 'proposal_title', 'key_benefit_1', 'key_benefit_2', 'key_benefit_3', 'valid_until', 'sender_name'],
    category: 'proposal',
  },
  {
    id: 'welcome_new_contact',
    name: 'Welcome New Contact',
    subject: 'Welcome to AlgeriaTrade.dz - Let\'s Connect!',
    body: `Dear {{contact_name}},

Welcome to AlgeriaTrade.dz, Algeria's premier B2B marketplace!

We're excited to have you join our network of thousands of businesses across Algeria and the MENA region.

What you can do on our platform:
- Connect with verified suppliers and buyers
- Post and respond to RFQs (Requests for Quotation)
- Access exclusive trade shows and exhibitions
- Use our secure escrow payment system

Get started by completing your company profile at {{profile_link}}.

If you have any questions, don't hesitate to reach out.

Best regards,
The AlgeriaTrade.dz Team`,
    variables: ['contact_name', 'profile_link'],
    category: 'welcome',
  },
  {
    id: 'meeting_reminder',
    name: 'Meeting Reminder',
    subject: 'Reminder: Our meeting tomorrow at {{meeting_time}}',
    body: `Hi {{contact_name}},

This is a friendly reminder about our scheduled meeting tomorrow.

Meeting Details:
- Date: {{meeting_date}}
- Time: {{meeting_time}}
- Duration: {{meeting_duration}}
- Location: {{meeting_location}}

Agenda:
{{agenda}}

Looking forward to speaking with you!

Best regards,
{{sender_name}}`,
    variables: ['contact_name', 'meeting_date', 'meeting_time', 'meeting_duration', 'meeting_location', 'agenda', 'sender_name'],
    category: 'reminder',
  },
  {
    id: 'thank_you_demo',
    name: 'Thank You After Demo',
    subject: 'Thank you for the demo - Next Steps',
    body: `Dear {{contact_name}},

Thank you for taking the time to see our demo today. I hope you found it informative!

Summary of what we discussed:
{{demo_summary}}

Next Steps:
{{next_steps}}

I'll send over {{additional_resources}} by {{send_date}}.

In the meantime, if you have any questions, feel free to reach out.

Best regards,
{{sender_name}}`,
    variables: ['contact_name', 'demo_summary', 'next_steps', 'additional_resources', 'send_date', 'sender_name'],
    category: 'thank_you',
  },
]

// ============================================
// CRM SETTINGS DEFAULTS
// ============================================

export interface CRMSettings {
  // General
  defaultCurrency: string
  defaultTimeZone: string
  defaultLanguage: string
  
  // Pipeline
  autoAdvanceStages: boolean
  requireReasonForLost: boolean
  allowStageRegression: boolean
  
  // Leads
  autoScoreLeads: boolean
  leadAssignmentMode: 'manual' | 'round_robin' | 'load_balanced'
  duplicateDetectionEnabled: boolean
  
  // Tasks
  defaultTaskReminderMinutes: number
  autoCreateFollowUpTasks: boolean
  
  // Notifications
  enableEmailNotifications: boolean
  enablePushNotifications: boolean
  dailyDigestTime: string
  weeklyDigestDay: string
  
  // Data
  dataRetentionDays: number
  allowExport: boolean
  allowImport: boolean
}

export const DEFAULT_CRM_SETTINGS: CRMSettings = {
  defaultCurrency: 'DZD',
  defaultTimeZone: 'Africa/Algiers',
  defaultLanguage: 'fr',
  
  autoAdvanceStages: false,
  requireReasonForLost: true,
  allowStageRegression: true,
  
  autoScoreLeads: true,
  leadAssignmentMode: 'manual',
  duplicateDetectionEnabled: true,
  
  defaultTaskReminderMinutes: 60,
  autoCreateFollowUpTasks: true,
  
  enableEmailNotifications: true,
  enablePushNotifications: true,
  dailyDigestTime: '09:00',
  weeklyDigestDay: 'monday',
  
  dataRetentionDays: 365,
  allowExport: true,
  allowImport: true,
}

// ============================================
// SEGMENT FIELD OPTIONS
// ============================================

export interface SegmentFieldOption {
  field: string
  label: string
  labelAr: string
  labelFr: string
  type: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'boolean'
  operators: string[]
  options?: { value: string; label: string }[]
}

export const SEGMENT_FIELDS: SegmentFieldOption[] = [
  { field: 'firstName', label: 'First Name', labelAr: 'الاسم الأول', labelFr: 'Prénom', type: 'text', operators: ['equals', 'contains', 'startsWith', 'endsWith'] },
  { field: 'lastName', label: 'Last Name', labelAr: 'اسم العائلة', labelFr: 'Nom', type: 'text', operators: ['equals', 'contains', 'startsWith', 'endsWith'] },
  { field: 'email', label: 'Email', labelAr: 'البريد الإلكتروني', labelFr: 'Email', type: 'text', operators: ['equals', 'contains'] },
  { field: 'company', label: 'Company', labelAr: 'الشركة', labelFr: 'Entreprise', type: 'text', operators: ['equals', 'contains'] },
  { field: 'jobTitle', label: 'Job Title', labelAr: 'المسمى الوظيفي', labelFr: 'Poste', type: 'text', operators: ['equals', 'contains'] },
  { field: 'role', label: 'Role', labelAr: 'الدور', labelFr: 'Rôle', type: 'select', operators: ['equals', 'in'], options: [
    { value: 'DECISION_MAKER', label: 'Decision Maker' },
    { value: 'INFLUENCER', label: 'Influencer' },
    { value: 'TECHNICAL', label: 'Technical' },
    { value: 'FINANCIAL', label: 'Financial' },
    { value: 'END_USER', label: 'End User' },
  ]},
  { field: 'status', label: 'Status', labelAr: 'الحالة', labelFr: 'Statut', type: 'select', operators: ['equals', 'in'], options: [
    { value: 'active', label: 'Active' },
    { value: 'prospect', label: 'Prospect' },
    { value: 'customer', label: 'Customer' },
    { value: 'inactive', label: 'Inactive' },
  ]},
  { field: 'tags', label: 'Tags', labelAr: 'العلامات', labelFr: 'Tags', type: 'multi_select', operators: ['contains', 'notContains'] },
  { field: 'createdAt', label: 'Created Date', labelAr: 'تاريخ الإنشاء', labelFr: 'Date de création', type: 'date', operators: ['inRange', 'before', 'after'] },
  { field: 'lastInteractionAt', label: 'Last Interaction', labelAr: 'آخر تفاعل', labelFr: 'Dernière interaction', type: 'date', operators: ['inRange', 'before', 'after'] },
  { field: 'city', label: 'City', labelAr: 'المدينة', labelFr: 'Ville', type: 'text', operators: ['equals', 'contains'] },
  { field: 'wilaya', label: 'Wilaya', labelAr: 'ولاية', labelFr: 'Wilaya', type: 'select', operators: ['equals', 'in'] },
  { field: 'industry', label: 'Industry', labelAr: 'القطاع', labelFr: 'Secteur', type: 'text', operators: ['equals', 'contains'] },
]

// ============================================
// EXPORT/IMPORT CONFIGURATION
// ============================================

export interface ExportConfig {
  format: 'csv' | 'excel' | 'json'
  fields: ExportField[]
  filters?: Record<string, any>
  includeHeaders: boolean
  dateFormat: string
}

export interface ExportField {
  key: string
  label: string
  transform?: string // Function name for transformation
}

export const CONTACT_EXPORT_FIELDS: ExportField[] = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'department', label: 'Department' },
  { key: 'company.name', label: 'Company' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'tags', label: 'Tags' },
  { key: 'city', label: 'City' },
  { key: 'wilaya', label: 'Wilaya' },
  { key: 'createdAt', label: 'Created At', transform: 'formatDate' },
  { key: 'lastInteractionAt', label: 'Last Interaction', transform: 'formatDate' },
]

export const LEAD_EXPORT_FIELDS: ExportField[] = [
  { key: 'leadNumber', label: 'Lead Number' },
  { key: 'companyName', label: 'Company Name' },
  { key: 'industry', label: 'Industry' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'pipelineStage', label: 'Pipeline Stage' },
  { key: 'estimatedValue', label: 'Estimated Value' },
  { key: 'currency', label: 'Currency' },
  { key: 'probability', label: 'Probability (%)' },
  { key: 'leadScore', label: 'Lead Score' },
  { key: 'expectedCloseDate', label: 'Expected Close Date' },
  { key: 'primaryContact.email', label: 'Contact Email' },
  { key: 'primaryContact.phone', label: 'Contact Phone' },
  { key: 'createdAt', label: 'Created At' },
]

// ============================================
// ANALYTICS DEFAULTS
// ============================================

export interface AnalyticsDefaults {
  dateRanges: {
    key: string
    label: string
    days: number
  }[]
  comparisonPeriods: string[]
  chartColors: string[]
}

export const ANALYTICS_DEFAULTS: AnalyticsDefaults = {
  dateRanges: [
    { key: '7d', label: 'Last 7 Days', days: 7 },
    { key: '30d', label: 'Last 30 Days', days: 30 },
    { key: '90d', label: 'Last 90 Days', days: 90 },
    { key: '6m', label: 'Last 6 Months', days: 180 },
    { key: '12m', label: 'Last 12 Months', days: 365 },
    { key: 'ytd', label: 'Year to Date', days: -1 }, // Special handling
  ],
  comparisonPeriods: ['previous_period', 'previous_year', 'custom'],
  chartColors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'],
}
