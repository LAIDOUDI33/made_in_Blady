'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Server,
  Database,
  Cloud,
  Plug,
  CheckCircle2,
} from 'lucide-react'

// Types
interface ERPTypeOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  features: string[]
  color: string
}

interface ConnectorSelectionProps {
  selectedType?: string | null
  onSelect: (type: string) => void
}

const ERP_TYPES: ERPTypeOption[] = [
  {
    id: 'SAP',
    name: 'SAP S/4HANA / Business One',
    description: 'Solution ERP enterprise pour grandes organisations avec API OData/REST',
    icon: <Server className="h-8 w-8" />,
    features: [
      'API OData native',
      'Sync produits & inventaire',
      'Support BAPI',
      'Authentification OAuth2',
    ],
    color: 'bg-blue-500',
  },
  {
    id: 'Odoo',
    name: 'Odoo (Community/Enterprise)',
    description: 'ERP open-source pour PME avec XML-RPC et REST API',
    icon: <Database className="h-8 w-8" />,
    features: [
      'XML-RPC / JSON-RPC',
      'Modules modulables',
      'Webhooks natifs',
      'Interface personnalisable',
    ],
    color: 'bg-purple-500',
  },
  {
    id: 'MicrosoftDynamics',
    name: 'Microsoft Dynamics 365',
    description: 'Applications business cloud Microsoft avec Dataverse',
    icon: <Cloud className="h-8 w-8" />,
    features: [
      'API Dataverse/OData',
      'Intégration Microsoft 365',
      'Authentification Azure AD',
      'Power Platform',
    ],
    color: 'bg-orange-500',
  },
  {
    id: 'Custom',
    name: 'Custom / REST API',
    description: 'Connecteur générique pour tout système via API REST',
    icon: <Plug className="h-8 w-8" />,
    features: [
      'Configuration flexible',
      'Endpoints personnalisés',
      'Authentification multiple',
      'Webhooks support',
    ],
    color: 'bg-green-500',
  },
]

export default function ConnectorSelection({ selectedType, onSelect }: ConnectorSelectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ERP_TYPES.map((type) => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedType === type.id 
                ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30' 
                : 'hover:border-gray-300'
            }`}
            onClick={() => onSelect(type.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`${type.color} text-white p-3 rounded-lg flex-shrink-0`}>
                  {type.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{type.name}</h3>
                    {selectedType === type.id && (
                      <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{type.description}</p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-1">
                    {type.features.slice(0, 2).map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {type.features.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{type.features.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Help Text */}
      {!selectedType && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Conseil:</strong> Choisissez le type de système ERP que vous utilisez. 
            Si votre système n'est pas listé, sélectionnez "Custom / REST API" pour une configuration manuelle.
          </p>
        </div>
      )}
      
      {selectedType && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            <CheckCircle2 className="inline h-4 w-4 mr-1" />
            Vous avez sélectionné <strong>{ERP_TYPES.find(t => t.id === selectedType)?.name}</strong>. 
            Cliquez sur "Suivant" pour configurer la connexion.
          </p>
        </div>
      )}
    </div>
  )
}
