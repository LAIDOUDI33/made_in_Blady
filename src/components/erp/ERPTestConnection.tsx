'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Plug,
  Server,
  AlertTriangle,
  Info,
  RefreshCw,
} from 'lucide-react'

// Types
interface TestResult {
  success: boolean
  message: string
  timestamp: Date
  latencyMs?: number
  details?: Record<string, any>
  errors?: Array<{ code: string; message: string }>
}

interface ERPTestConnectionProps {
  connectorId?: string
  onTestComplete?: (result: TestResult) => void
  compact?: boolean
}

export default function ERPTestConnection({ 
  connectorId, 
  onTestComplete,
  compact = false 
}: ERPTestConnectionProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [lastTestedAt, setLastTestedAt] = useState<Date | null>(null)

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    try {
      // Simulate API call to test connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Random result for demo (80% success rate)
      const success = Math.random() > 0.2
      
      const result: TestResult = {
        success,
        message: success 
          ? 'Connexion établie avec succès' 
          : 'Échec de la connexion - Vérifiez vos paramètres',
        timestamp: new Date(),
        latencyMs: Math.floor(Math.random() * 500) + 100,
        details: success ? {
          serverVersion: 'SAP S/4HANA 2023',
          apiVersion: 'v2.0',
          authenticatedUser: 'admin@company.com',
        } : undefined,
        errors: success ? undefined : [
          { code: 'AUTH_FAILED', message: 'Authentification échouée' },
        ],
      }
      
      setTestResult(result)
      setLastTestedAt(new Date())
      onTestComplete?.(result)
      
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inattendue lors du test',
        timestamp: new Date(),
        errors: [{ code: 'NETWORK_ERROR', message: String(error) }],
      }
      
      setTestResult(result)
      setLastTestedAt(new Date())
      onTestComplete?.(result)
      
    } finally {
      setIsTesting(false)
    }
  }

  // Compact version for inline use
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Button
          variant={testResult?.success ? "default" : "outline"}
          size="sm"
          onClick={handleTestConnection}
          disabled={isTesting}
          className={testResult?.success ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {isTesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : testResult?.success ? (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          ) : testResult && !testResult.success ? (
            <XCircle className="mr-2 h-4 w-4" />
          ) : (
            <Plug className="mr-2 h-4 w-4" />
          )}
          {isTesting ? 'Test...' : testResult ? 'Re-tester' : 'Tester'}
        </Button>
        
        {testResult && (
          <Badge variant={testResult.success ? "default" : "destructive"} className={
            testResult.success ? "bg-green-100 text-green-700 border-green-200" : ""
          }>
            {testResult.latencyMs && `${testResult.latencyMs}ms`}
            {!testResult.success && 'Échec'}
          </Badge>
        )}
      </div>
    )
  }

  // Full version with details
  return (
    <Card className={testResult ? (testResult.success ? 'border-green-300 bg-green-50/20' : 'border-red-300 bg-red-50/20') : ''}>
      <CardHeader className={compact ? 'pb-3' : ''}>
        <CardTitle className={`text-base flex items-center justify-between ${compact ? '' : ''}`}>
          <span className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Test de connexion
          </span>
          
          <Button
            variant={testResult?.success ? "default" : "outline"}
            size="sm"
            onClick={handleTestConnection}
            disabled={isTesting}
            className={testResult?.success ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <RefreshCw className={`mr-2 h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
                {testResult ? 'Tester à nouveau' : 'Tester la connexion'}
              </>
            )}
          </Button>
        </CardTitle>
        
        {!testResult && !isTesting && (
          <CardDescription>
            Vérifiez que les paramètres de connexion sont corrects en effectuant un test
          </CardDescription>
        )}
      </CardHeader>

      {(isTesting || testResult) && (
        <CardContent>
          {/* Loading State */}
          {isTesting && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="font-medium text-gray-900">Test de connexion en cours...</p>
                  <p className="text-sm text-gray-500">Établissement de la connexion à l'ERP</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  <span>Résolution DNS...</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Établissement TLS...</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authentification...</span>
                </div>
              </div>
            </div>
          )}

          {/* Success Result */}
          {testResult && testResult.success && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800">Connexion réussie !</h4>
                  <p className="text-sm text-green-700">{testResult.message}</p>
                  
                  {testResult.latencyMs && (
                    <p className="text-xs text-green-600 mt-1">
                      Latence: {testResult.latencyMs}ms
                    </p>
                  )}
                </div>
              </div>

              {testResult.details && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs text-gray-500 mb-1">Serveur</p>
                    <p className="font-mono text-sm">{testResult.details.serverVersion}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs text-gray-500 mb-1">Version API</p>
                    <p className="font-mono text-sm">{testResult.details.apiVersion}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs text-gray-500 mb-1">Utilisateur</p>
                    <p className="font-mono text-sm truncate">{testResult.details.authenticatedUser}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="h-3 w-3" />
                Dernier test: {lastTestedAt?.toLocaleString('fr-FR')}
              </div>
            </div>
          )}

          {/* Error Result */}
          {testResult && !testResult.success && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <XCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800">Échec de la connexion</h4>
                  <p className="text-sm text-red-700">{testResult.message}</p>
                </div>
              </div>

              {testResult.errors && testResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Détails de l'erreur:
                  </h5>
                  
                  {testResult.errors.map((error, idx) => (
                    <div key={idx} className="bg-red-50 rounded p-3 border border-red-200">
                      <code className="text-xs font-mono text-red-600 block mb-1">
                        {error.code}
                      </code>
                      <p className="text-sm text-red-800">{error.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Suggestions de résolution:
                </h5>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Vérifiez que l'URL de l'endpoint est correcte</li>
                  <li>Confirmez que vos identifiants sont valides</li>
                  <li>Vérifiez que le pare-feu autorise les connexions sortantes</li>
                  <li>Assurez-vous que le serveur ERP est accessible</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="h-3 w-3" />
                Dernier test: {lastTestedAt?.toLocaleString('fr-FR')}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
