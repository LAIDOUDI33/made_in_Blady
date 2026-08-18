'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  UserPlus,
  Users,
  Phone,
  Mail,
  Calendar,
  FileText,
  Send,
  Download,
  Upload,
  BarChart3,
  Target,
  Plus,
} from 'lucide-react'

interface QuickActionsProps {
  onAddContact?: () => void
  onAddLead?: () => void
  onMakeCall?: () => void
  onSendEmail?: () => void
  onScheduleMeeting?: () => void
  onCreateTask?: () => void
  onExportData?: () => void
  onImportData?: () => void
  onViewReports?: () => void
}

export default function QuickActions({
  onAddContact,
  onAddLead,
  onMakeCall,
  onSendEmail,
  onScheduleMeeting,
  onCreateTask,
  onExportData,
  onImportData,
  onViewReports,
}: QuickActionsProps) {
  const actions = [
    {
      id: 'add-contact',
      label: 'New Contact',
      description: 'Add a new contact',
      icon: <UserPlus className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
      onClick: onAddContact,
    },
    {
      id: 'add-lead',
      label: 'New Lead',
      description: 'Create a new lead',
      icon: <Target className="h-5 w-5" />,
      color: 'bg-green-100 text-green-600 hover:bg-green-200',
      onClick: onAddLead,
    },
    {
      id: 'call',
      label: 'Log Call',
      description: 'Record a phone call',
      icon: <Phone className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
      onClick: onMakeCall,
    },
    {
      id: 'email',
      label: 'Send Email',
      description: 'Compose an email',
      icon: <Mail className="h-5 w-5" />,
      color: 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200',
      onClick: onSendEmail,
    },
    {
      id: 'meeting',
      label: 'Schedule Meeting',
      description: 'Book a meeting',
      icon: <Calendar className="h-5 w-5" />,
      color: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
      onClick: onScheduleMeeting,
    },
    {
      id: 'task',
      label: 'Create Task',
      description: 'Add a new task',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
      onClick: onCreateTask,
    },
    {
      id: 'export',
      label: 'Export Data',
      description: 'Download contacts/leads',
      icon: <Download className="h-5 w-5" />,
      color: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      onClick: onExportData,
    },
    {
      id: 'import',
      label: 'Import Data',
      description: 'Upload CSV file',
      icon: <Upload className="h-5 w-5" />,
      color: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
      onClick: onImportData,
    },
    {
      id: 'reports',
      label: 'View Reports',
      description: 'Analytics & insights',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-pink-100 text-pink-600 hover:bg-pink-200',
      onClick: onViewReports,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className={`h-auto py-4 flex-col gap-2 ${action.color}`}
              onClick={action.onClick}
            >
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
