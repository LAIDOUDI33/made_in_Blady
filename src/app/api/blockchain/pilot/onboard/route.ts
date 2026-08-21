import { NextRequest, NextResponse } from 'next/server';

// Types
interface OnboardingStep {
  stepId: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: string;
  notes?: string;
}

interface OnboardingSession {
  pilotId: string;
  currentStep: number;
  steps: OnboardingStep[];
  data: {
    companyInfo: any;
    productSelection: any;
    integration: any;
    staffUsers: any[];
    testingConfig: any;
  };
  createdAt: string;
  updatedAt: string;
}

// In-memory storage for demo (in production, use database)
const onboardingSessions = new Map<string, OnboardingSession>();

// Define onboarding steps based on template
function getOnboardingSteps(template: string): OnboardingStep[] {
  const baseSteps: OnboardingStep[] = [
    { stepId: 'company_info', name: 'Company Information', description: 'Register company details and contact information', status: 'pending' },
    { stepId: 'product_catalog', name: 'Product Catalog', description: 'Upload and configure product catalog', status: 'pending' },
    { stepId: 'integration_setup', name: 'Integration Setup', description: 'Configure API or ERP integration', status: 'pending' },
    { stepId: 'staff_training', name: 'Staff Training', description: 'Train team members on platform usage', status: 'pending' },
    { stepId: 'testing_verification', name: 'Testing & Verification', description: 'Run test scenarios and verify system', status: 'pending' }
  ];

  // Template-specific steps
  switch (template) {
    case 'pharmaceutical':
      return [
        ...baseSteps.slice(0, 1),
        { 
          stepId: 'regulatory_config', 
          name: 'Regulatory Configuration', 
          description: 'Configure AMM numbers, GMP settings, Ministry of Health integration',
          status: 'pending' 
        },
        ...baseSteps.slice(1)
      ];
    
    case 'agricultural':
    case 'dates':
      return [
        ...baseSteps.slice(0, 2),
        { 
          stepId: 'organic_certification', 
          name: 'Organic Certification Setup', 
          description: 'Configure ONSSA/ECOCERT integration and PGI labeling',
          status: 'pending' 
        },
        ...baseSteps.slice(2)
      ];
    
    case 'industrial':
      return [
        ...baseSteps.slice(0, 3),
        { 
          stepId: 'quality_standards', 
          name: 'Quality Standards Configuration', 
          description: 'Set up QAISO/ISO certification templates and testing parameters',
          status: 'pending' 
        },
        ...baseSteps.slice(4)
      ];
    
    default:
      return baseSteps;
  }
}

// Generate API keys for pilot
function generateApiCredentials(pilotId: string) {
  return {
    apiKey: `at_pilot_${pilotId}_${Math.random().toString(36).substring(2, 14)}`,
    apiSecret: `secret_${Math.random().toString(36).substring(2, 22)}`,
    webhookSecret: `whsec_${Math.random().toString(36).substring(2, 18)}`,
    environment: 'pilot' as const,
    rateLimit: {
      requestsPerMinute: 60,
      dailyQuota: 10000
    }
  };
}

// Create test data for pilot
function generateTestData(template: string, config: any) {
  const testData: any = {
    products: [],
    batches: [],
    events: []
  };

  // Generate template-specific test data
  switch (template) {
    case 'pharmaceutical':
      testData.products = [
        {
          externalId: 'TEST-PHARMA-001',
          name: { ar: 'باراسيتامول تجريبي', fr: 'Paracetamol Test', en: 'Test Paracetamol' },
          category: 'pharmaceutical_finished',
          regulatoryInfo: { authorizationNumber: 'AMM-TEST-001' }
        },
        {
          externalId: 'TEST-PHARMA-002',
          name: { ar: 'أموكسيسيللين تجريبي', fr: 'Amoxicillin Test', en: 'Test Amoxicillin' },
          category: 'pharmaceutical_finished',
          regulatoryInfo: { authorizationNumber: 'AMM-TEST-002' }
        }
      ];
      break;

    case 'dates':
    case 'agricultural':
      testData.products = [
        {
          externalId: 'TEST-DATE-001',
          name: { ar: 'تمر دقلة نور تجريبي', fr: 'Dattes Deglet Nour Test', en: 'Test Deglet Nour Dates' },
          category: 'date_product'
        },
        {
          externalId: 'TEST-OIL-001',
          name: { ar: 'زيت زيتون تجريبي', fr: 'Huile d\'Olive Test', en: 'Test Olive Oil' },
          category: 'olive_oil'
        }
      ];
      break;

    case 'industrial':
      testData.products = [
        {
          externalId: 'TEST-CEM-001',
          name: { ar: 'أسمنت تجريبي', fr: 'Ciment Test', en: 'Test Cement' },
          category: 'cement'
        },
        {
          externalId: 'TEST-STEEL-001',
          name: { ar: 'حديد تجريبي', fr: 'Acier Test', en: 'Test Steel' },
          category: 'steel_product'
        }
      ];
      break;

    default:
      testData.products = [
        {
          externalId: 'TEST-PROD-001',
          name: { ar: 'منتج تجريبي', fr: 'Produit Test', en: 'Test Product' },
          category: 'other'
        }
      ];
  }

  // Generate test batch
  testData.batches = [{
    externalBatchId: `TEST-BT-${new Date().getFullYear()}-0001`,
    quantity: config.testBatchSize || 10,
    productionDate: new Date().toISOString().split('T')[0]
  }];

  // Generate sample events
  testData.events = [
    { eventType: 'PRODUCTION', location: 'Test Location - Production' },
    { eventType: 'QUALITY_CONTROL', location: 'Test Location - QC Lab' },
    { eventType: 'WAREHOUSE_IN', location: 'Test Warehouse' },
    { eventType: 'PACKAGING', location: 'Test Packaging Area' }
  ];

  return testData;
}

// POST /api/blockchain/pilot/onboard - Start onboarding process
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pilotId, action, stepData, stepId } = body;

    if (!pilotId) {
      return NextResponse.json(
        { success: false, error: { code: 'validation_error', message: 'Pilot ID is required' } },
        { status: 400 }
      );
    }

    switch (action) {
      case 'start':
        return handleStartOnboarding(pilotId, body);
      
      case 'complete_step':
        return handleCompleteStep(pilotId, stepId, stepData);
      
      case 'generate_keys':
        return handleGenerateKeys(pilotId);
      
      case 'create_test_data':
        return handleCreateTestData(pilotId, body.config);
      
      case 'complete_onboarding':
        return handleCompleteOnboarding(pilotId);
      
      default:
        return NextResponse.json(
          { success: false, error: { code: 'invalid_action', message: `Unknown action: ${action}` } },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'internal_error', message: 'Onboarding operation failed' } },
      { status: 500 }
    );
  }
}

async function handleStartOnboarding(pilotId: string, body: any) {
  // Check if session already exists
  if (onboardingSessions.has(pilotId)) {
    const existing = onboardingSessions.get(pilotId)!;
    return NextResponse.json({
      success: true,
      data: existing,
      message: 'Resuming existing onboarding session'
    });
  }

  // Get template from body or default to custom
  const template = body.template || 'custom';

  // Create new onboarding session
  const session: OnboardingSession = {
    pilotId,
    currentStep: 0,
    steps: getOnboardingSteps(template),
    data: {
      companyInfo: null,
      productSelection: null,
      integration: null,
      staffUsers: [],
      testingConfig: null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Mark first step as in progress
  session.steps[0].status = 'in_progress';

  onboardingSessions.set(pilotId, session);

  return NextResponse.json({
    success: true,
    data: session,
    message: 'Onboarding session started successfully'
  }, { status: 201 });
}

async function handleCompleteStep(pilotId: string, stepId: string, stepData: any) {
  const session = onboardingSessions.get(pilotId);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'not_found', message: 'No active onboarding session found' } },
      { status: 404 }
    );
  }

  // Find the step
  const stepIndex = session.steps.findIndex(s => s.stepId === stepId);
  if (stepIndex === -1) {
    return NextResponse.json(
      { success: false, error: { code: 'not_found', message: `Step ${stepId} not found` } },
      { status: 404 }
    );
  }

  // Complete current step
  session.steps[stepIndex] = {
    ...session.steps[stepIndex],
    status: 'completed',
    completedAt: new Date().toISOString(),
    notes: stepData?.notes
  };

  // Store step data appropriately
  switch (stepId) {
    case 'company_info':
    case 'regulatory_config':
      session.data.companyInfo = stepData;
      break;
    case 'product_catalog':
    case 'organic_certification':
    case 'quality_standards':
      session.data.productSelection = stepData;
      break;
    case 'integration_setup':
      session.data.integration = stepData;
      break;
    case 'staff_training':
      session.data.staffUsers = stepData.users || [];
      break;
    case 'testing_verification':
      session.data.testingConfig = stepData;
      break;
  }

  // Move to next step
  if (stepIndex < session.steps.length - 1) {
    session.currentStep = stepIndex + 1;
    session.steps[stepIndex + 1].status = 'in_progress';
  }

  session.updatedAt = new Date().toISOString();
  onboardingSessions.set(pilotId, session);

  // Calculate progress
  const completedSteps = session.steps.filter(s => s.status === 'completed').length;
  const progress = Math.round((completedSteps / session.steps.length) * 100);

  return NextResponse.json({
    success: true,
    data: {
      session,
      progress,
      nextStep: session.steps[session.currentStep],
      allCompleted: session.currentStep >= session.steps.length - 1 && 
                     session.steps[session.steps.length - 1].status === 'completed'
    },
    message: `Step "${session.steps[stepIndex].name}" completed successfully`
  });
}

async function handleGenerateKeys(pilotId: string) {
  const credentials = generateApiCredentials(pilotId);

  // In production, store these securely in database with encryption
  // For now, just return them

  return NextResponse.json({
    success: true,
    data: credentials,
    message: 'API credentials generated. Store these securely.',
    warning: 'Please save these credentials now. They will not be shown again.'
  });
}

async function handleCreateTestData(pilotId: string, config: any) {
  const session = onboardingSessions.get(pilotId);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'not_found', message: 'No active onboarding session found' } },
      { status: 404 }
    );
  }

  // Determine template from session data or use provided config
  const template = config?.template || 'custom';
  const testData = generateTestData(template, config);

  return NextResponse.json({
    success: true,
    data: testData,
    message: 'Test data generated successfully. Use this data for your initial testing scenarios.'
  });
}

async function handleCompleteOnboarding(pilotId: string) {
  const session = onboardingSessions.get(pilotId);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'not_found', message: 'No active onboarding session found' } },
      { status: 404 }
    );
  }

  // Verify all steps are completed
  const incompleteSteps = session.steps.filter(s => s.status !== 'completed');
  if (incompleteSteps.length > 0) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'incomplete_onboarding',
        message: `${incompleteSteps.length} step(s) still incomplete`,
        incompleteSteps: incompleteSteps.map(s => s.stepId)
      }
    }, { status: 400 });
  }

  // Generate final summary
  const summary = {
    pilotId,
    onboardingCompletedAt: new Date().toISOString(),
    stepsCompleted: session.steps.length,
    companyRegistered: !!session.data.companyInfo,
    productsConfigured: !!session.data.productSelection,
    integrationSetup: !!session.data.integration,
    staffTrained: session.data.staffUsers.length,
    testingConfigured: !!session.data.testingConfig,
    readyForGoLive: true,
    nextActions: [
      'Review your API credentials and configure webhooks',
      'Upload your complete product catalog',
      'Train your team using the provided materials',
      'Schedule your go-live date (Day 7 of pilot)',
      'Contact support if you need assistance'
    ]
  };

  // Clean up session (or mark as completed)
  onboardingSessions.delete(pilotId);

  return NextResponse.json({
    success: true,
    data: summary,
    message: '🎉 Congratulations! Your onboarding is complete. You are ready to start your pilot program!'
  });
}

// GET /api/blockchain/pilot/onboard - Get onboarding status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pilotId = searchParams.get('pilotId');

    if (!pilotId) {
      return NextResponse.json(
        { success: false, error: { code: 'validation_error', message: 'Pilot ID is required' } },
        { status: 400 }
      );
    }

    const session = onboardingSessions.get(pilotId);

    if (!session) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          message: 'No active onboarding session. Start one with POST action=start'
        }
      });
    }

    // Calculate progress
    const completedSteps = session.steps.filter(s => s.status === 'completed').length;
    const progress = Math.round((completedSteps / session.steps.length) * 100);

    return NextResponse.json({
      success: true,
      data: {
        ...session,
        progress,
        currentStepName: session.steps[session.currentStep]?.name,
        remainingSteps: session.steps.filter(s => s.status !== 'completed').length
      }
    });

  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return NextResponse.json(
      { success: false, error: { code: 'internal_error', message: 'Failed to fetch onboarding status' } },
      { status: 500 }
    );
  }
}
