import { NextRequest, NextResponse } from 'next/server'
import { completeTask, autoGenerateFollowUpTasks } from '@/lib/crm'
import { db } from '@/lib/db'

// POST /api/crm/tasks/[id]/complete - Complete a task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Check if task exists
    const existing = await db.cRMTask.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }
    
    // Check if already completed
    if (existing.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Task is already completed' },
        { status: 409 }
      )
    }
    
    // Complete the task
    const task = await completeTask(id, {
      notes: body.notes,
      outcome: body.outcome,
    })
    
    // Auto-generate follow-up tasks if requested and linked to a lead
    let followUpTasks: any[] = []
    if (body.autoGenerateFollowUp && existing.leadId) {
      followUpTasks = await autoGenerateFollowUpTasks(existing.leadId)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Task completed successfully',
      task,
      followUpTasks: followUpTasks.length > 0 ? followUpTasks : undefined,
    })
  } catch (error: any) {
    console.error('Error completing task:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete task' },
      { status: 500 }
    )
  }
}
