import { NextRequest, NextResponse } from 'next/server'
import { createTask, getOverdueTasks, getTasksToday } from '@/lib/crm'
import { db } from '@/lib/db'

// GET /api/crm/tasks - List tasks with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')
    const leadId = searchParams.get('leadId')
    const contactId = searchParams.get('contactId')
    const action = searchParams.get('action')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const skip = (page - 1) * pageSize
    
    // Special actions
    if (action === 'overdue' && assignedTo) {
      const tasks = await getOverdueTasks(assignedTo)
      return NextResponse.json({ data: tasks })
    }
    
    if (action === 'today' && assignedTo) {
      const tasks = await getTasksToday(assignedTo)
      return NextResponse.json({ data: tasks })
    }
    
    // Build where clause
    const where: any = {}
    
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignedTo) where.assignedTo = assignedTo
    if (leadId) where.leadId = leadId
    if (contactId) where.contactId = contactId
    
    // Date filters for due date
    const dueFrom = searchParams.get('dueFrom')
    const dueTo = searchParams.get('dueTo')
    if (dueFrom || dueTo) {
      where.dueDate = {}
      if (dueFrom) where.dueDate.gte = new Date(dueFrom)
      if (dueTo) where.dueDate.lte = new Date(dueTo)
    }
    
    // Get total count and paginated results
    const [tasks, total] = await Promise.all([
      db.cRMTask.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      db.cRMTask.count({ where }),
    ])
    
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      leadId: task.leadId,
      contactId: task.contactId,
      companyId: task.companyId,
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      completedAt: task.completedAt,
      assignedTo: task.assignedTo,
      createdBy: task.createdBy,
      remindBefore: task.remindBefore,
      reminderSent: task.reminderSent,
      resultNotes: task.resultNotes,
      outcome: task.outcome,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }))
    
    return NextResponse.json({
      data: formattedTasks,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/crm/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.companyId || !body.title || !body.dueDate || !body.assignedTo || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, title, dueDate, assignedTo, createdBy' },
        { status: 400 }
      )
    }
    
    // Validate date
    const dueDate = new Date(body.dueDate)
    if (isNaN(dueDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid dueDate format' },
        { status: 400 }
      )
    }
    
    const task = await createTask({
      leadId: body.leadId,
      contactId: body.contactId,
      companyId: body.companyId,
      title: body.title,
      description: body.description || '',
      type: body.type || 'OTHER',
      priority: body.priority || 'MEDIUM',
      dueDate,
      dueTime: body.dueTime,
      assignedTo: body.assignedTo,
      createdBy: body.createdBy,
      remindBefore: body.remindBefore,
    })
    
    return NextResponse.json(task, { status: 201 })
  } catch (error: any) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
