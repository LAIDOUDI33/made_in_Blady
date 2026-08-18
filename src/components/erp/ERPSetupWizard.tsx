'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Server,
  Settings,
  Database,
  Plug,
  Rocket,
} from 'lucide-react'

// Import sub-components
import ConnectorSelection from './ConnectorSelection'
import ConnectionForm from './ConnectionForm'
import SyncConfiguration from './SyncConfiguration'
import FieldMappingEditor from './FieldMappingEditor'

// Types
interface WizardStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
}

interface ERPSetupWizardProps {
  onComplete?: (config: any) => void
  onCancel?: () => void
  initialStep?: number
}

const STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Choisir le type d\'ERP',
    description: 'Sélectionnez le système ERP à connecter',
    icon: <Server className="h-6 w-6" />,
  },
  {
    id: 2,
    title: 'Configuration de la connexion',
    description: 'Entrez les paramètres de connexion à votre ERP',
    icon: <Plug className="h-6 w-6" />,
  },
  {
    id: 3,
    title: 'Mappage des champs',
    description: 'Configurez la correspondance des données',
    icon: <Settings className="h-6 w-6" />,
  },
  {
    id: 4,
    title: 'Configuration de synchronisation',
    description: 'Définissez quand et comment synchroniser les données',
    icon: <Database className="h-6 w-6" />,
  },
  {
    id: 5,
    title: 'Finalisation',
    description: 'Vérifiez et activez l\'intégration',
    icon: <Rocket className="h-6 w-6" />,
  },
]

export default function ERPSetupWizard({ onComplete, onCancel, initialStep = 1 }: ERPSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [wizardData, setWizardData] = useState({
    erpType: '' as any,
    connectionConfig: {},
    fieldMappings: [],
    syncConfig: {},
  })
  const [isCompleted, setIsCompleted] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return !!wizardData.erpType
      case 3:
        return Object.keys(wizardData.connectionConfig).length > 0
      case 4:
        return wizardData.fieldMappings.length > 0
      case 5:
        return Object.keys(wizardData.syncConfig).length > 0
      default:
        return true
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleERPTypeSelect = (type: string) => {
    setWizardData(prev => ({ ...prev, erpType: type }))
  }

  const handleConnectionConfigSave = (config: any) => {
    setWizardData(prev => ({ ...prev, connectionConfig: config }))
  }

  const handleFieldMappingsSave = (mappings: any[]) => {
    setWizardData(prev => ({ ...prev, fieldMappings: mappings }))
  }

  const handleSyncConfigSave = (config: any) => {
    setWizardData(prev => ({ ...prev, syncConfig: config }))
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Random success/failure for demo
    const success = Math.random() > 0.3
    setTestResult(success ? 'success' : 'error')
    setIsTesting(false)
  }

  const handleComplete = () => {
    setIsCompleted(true)
    onComplete?.({
      ...wizardData,
      completedAt: new Date(),
    })
  }

  const handleReset = () => {
    setCurrentStep(1)
    setWizardData({
      erpType: '' as any,
      connectionConfig: {},
      fieldMappings: [],
      syncConfig: {},
    })
    setIsCompleted(false)
    setTestResult(null)
  }

  const progressPercentage = ((currentStep - 1) / (STEPS.length - 1)) * 100

  if (isCompleted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Intégration ERP configurée !
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Votre connexion {wizardData.erpType} a été configurée avec succès.
            La synchronisation des données va commencer selon le planning défini.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
            <h3 className="font-medium mb-4">Résumé de la configuration</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Type d'ERP:</dt>
                <dd className="font-medium">{wizardData.erpType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Champs mappés:</dt>
                <dd className="font-medium">{wizardData.fieldMappings.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Fréquence de sync:</dt>
                <dd className="font-medium">{(wizardData.syncConfig as any).frequency || 'Quotidien'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Direction:</dt>
                <dd className="font-medium">{(wizardData.syncConfig as any).direction || 'Bidirectionnel'}</dd>
              </div>
            </dl>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleReset}>
              Configurer une autre intégration
            </Button>
            <Button onClick={() => window.location.reload()}>
              Aller au tableau de bord
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Configuration de l'intégration ERP
        </h1>
        <p className="text-gray-500">
          Connectez votre système ERP pour synchroniser automatiquement vos données
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between text-sm text-gray-500">
          <span>Étape {currentStep} sur {STEPS.length}</span>
          <span>{Math.round(progressPercentage)}% complété</span>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="flex justify-between mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, index) => (
          <button
            key={step.id}
            onClick={() => index < currentStep && setCurrentStep(step.id)}
            disabled={index >= currentStep}
            className={`flex flex-col items-center min-w-[80px] p-2 ${
              index < currentStep ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                step.id === currentStep
                  ? 'bg-blue-600 text-white'
                  : index < currentStep
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {index < currentStep ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                step.icon
              )}
            </div>
            <span
              className={`text-xs text-center ${
                step.id === currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}
            >
              {step.title.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className={`p-2 rounded-lg ${
              currentStep === 1 ? 'bg-purple-100 text-purple-600' :
              currentStep === 2 ? 'bg-blue-100 text-blue-600' :
              currentStep === 3 ? 'bg-orange-100 text-orange-600' :
              currentStep === 4 ? 'bg-green-100 text-green-600' :
              'bg-red-100 text-red-600'
            }`}>
              {STEPS[currentStep - 1].icon}
            </span>
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          {currentStep === 1 && (
            <ConnectorSelection 
              selectedType={wizardData.erpType}
              onSelect={handleERPTypeSelect}
            />
          )}
          
          {currentStep === 2 && (
            <ConnectionForm
              erpType={wizardData.erpType}
              onSave={handleConnectionConfigSave}
              initialData={wizardData.connectionConfig}
            />
          )}
          
          {currentStep === 3 && (
            <FieldMappingEditor
              erpType={wizardData.erpType || 'ODOO'}
              erpConfigId="new"
              entityType="PRODUCTS"
            />
          )}
          
          {currentStep === 4 && (
            <SyncConfiguration
              erpType={wizardData.erpType}
              onSave={handleSyncConfigSave}
              initialData={wizardData.syncConfig}
            />
          )}
          
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Configuration de connexion</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type ERP</span>
                      <Badge variant="outline">{wizardData.erpType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Endpoint</span>
                      <code className="text-xs bg-white px-2 py-1 rounded">
                        {(wizardData.connectionConfig as any).endpoint || 'Non configuré'}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Authentification</span>
                      <span>{(wizardData.connectionConfig as any).authType || 'API Key'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Paramètres de synchronisation</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fréquence</span>
                      <span>{(wizardData.syncConfig as any).frequency || 'Quotidien'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Direction</span>
                      <span>{(wizardData.syncConfig as any).direction || 'Bidirectionnel'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Entités</span>
                      <span>{((wizardData.syncConfig as any).entityTypes || ['PRODUCTS', 'INVENTORY']).join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Connection */}
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Tester la connexion</h4>
                
                {!testResult ? (
                  <Button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    variant="outline"
                    className="w-full"
                  >
                    {isTesting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Test de connexion en cours...
                      </>
                    ) : (
                      <>
                        <Plug className="mr-2 h-4 w-4" />
                        Tester la connexion
                      </>
                    )}
                  </Button>
                ) : (
                  <div className={`p-4 rounded-lg ${
                    testResult === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {testResult === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-red-600 fill-current" />
                      )}
                      <span className={`font-medium ${
                        testResult === 'success' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult === 'success' ? 'Connexion réussie !' : 'Échec de la connexion'}
                      </span>
                    </div>
                    {testResult === 'error' && (
                      <p className="text-sm text-red-600 mt-2">
                        Vérifiez vos paramètres de connexion et réessayez.
                      </p>
                    )}
                    
                    <Button
                      onClick={handleTestConnection}
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                    >
                      Réessayer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
            
            <div className="flex gap-2">
              {onCancel && (
                <Button variant="ghost" onClick={onCancel}>
                  Annuler
                </Button>
              )}
              
              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToStep(currentStep + 1)}
                >
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={testResult !== 'success'}
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Activer l'intégration
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
