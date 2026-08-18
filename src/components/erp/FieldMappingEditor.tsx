'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Download,
  Upload,
  Settings,
  CheckCircle2,
} from 'lucide-react'

// Types
interface FieldMapping {
  localField: string
  erpField: string
  transform?: string
  defaultValue?: any
}

interface FieldMappingEditorProps {
  erpType: 'SAP' | 'ODOO' | 'DYNAMICS' | 'CUSTOM'
  erpConfigId: string
  entityType?: string
}

// Predefined field mappings for each ERP type and entity type
const predefinedMappings: Record<string, Record<string, FieldMapping[]>> = {
  SAP: {
    PRODUCTS: [
      { localField: 'name', erpField: 'MAKTX', transform: undefined },
      { localField: 'sku', erpField: 'MATNR', transform: 'uppercase' },
      { localField: 'description', erpField: 'MAKTG' },
      { localField: 'price', erpField: 'NETPR', transform: 'toFloat' },
      { localField: 'currency', erpField: 'WAERK' },
      { localField: 'unit', erpField: 'MEINS' },
      { localField: 'category.id', erpField: 'MATKL' },
      { localField: 'weight', erpField: 'BRGEW' },
      { localField: 'isActive', erpField: 'LVORM', transform: 'toBoolean' },
    ],
    INVENTORY: [
      { localField: 'productId', erpField: 'MATNR' },
      { localField: 'quantity', erpField: 'LABST' },
      { localField: 'warehouse', erpField: 'WERKS' },
      { localField: 'location', erpField: 'LGORT' },
    ],
    CUSTOMERS: [
      { localField: 'externalId', erpField: 'KUNNR' },
      { localField: 'companyName', erpField: 'NAME1' },
      { localField: 'email', erpField: 'SMTP_ADDR' },
      { localField: 'phone', erpField: 'TELF1' },
      { localField: 'address.city', erpField: 'ORT01' },
      { localField: 'address.country', erpField: 'LAND1' },
      { localField: 'nif', erpField: 'TAXNUMXL' },
    ],
    ORDERS: [
      { localField: 'orderNumber', erpField: 'VBELN' },
      { localField: 'customer.externalId', erpField: 'KUNNR' },
      { localField: 'totalAmount', erpField: 'NETWR' },
      { localField: 'currency', erpField: 'WAERK' },
      { localField: 'status', erpField: 'AUART' },
    ],
  },
  ODOO: {
    PRODUCTS: [
      { localField: 'name', erpField: 'name' },
      { localField: 'sku', erpField: 'default_code' },
      { localField: 'description', erpField: 'description_sale' },
      { localField: 'price', erpField: 'list_price' },
      { localField: 'category.externalId', erpField: 'categ_id' },
      { localField: 'isActive', erpField: 'sale_ok', transform: 'toBoolean' },
      { localField: 'barcode', erpField: 'barcode' },
      { localField: 'weight', erpField: 'weight' },
    ],
    INVENTORY: [
      { localField: 'productId', erpField: 'product_id' },
      { localField: 'quantity', erpField: 'qty_available' },
      { localField: 'warehouse', erpField: 'warehouse_id' },
    ],
    CUSTOMERS: [
      { localField: 'externalId', erpField: 'id' },
      { localField: 'companyName', erpField: 'name' },
      { localField: 'email', erpField: 'email' },
      { localField: 'phone', erpField: 'phone' },
      { localField: 'nif', erpField: 'vat' },
      { localField: 'address.city', erpField: 'city' },
    ],
    ORDERS: [
      { localField: 'externalId', erpField: 'id' },
      { localField: 'orderNumber', erpField: 'name' },
      { localField: 'customer.externalId', erpField: 'partner_id' },
      { localField: 'status', erpField: 'state' },
      { localField: 'totalAmount', erpField: 'amount_total' },
    ],
  },
  DYNAMICS: {},
  CUSTOM: {},
}

const availableTransforms = [
  { value: '', label: 'Aucune' },
  { value: 'uppercase', label: 'Majuscules' },
  { value: 'lowercase', label: 'Minuscules' },
  { value: 'trim', label: 'Supprimer espaces' },
  { value: 'toString', label: 'En chaîne' },
  { value: 'toNumber', label: 'En nombre' },
  { value: 'toFloat', label: 'En décimal' },
  { value: 'toInt', label: 'En entier' },
  { value: 'toBoolean', label: 'En booléen' },
  { value: 'toDate', label: 'En date' },
  { value: 'formatPrice', label: 'Format prix (2 décimales)' },
  { value: 'formatDate', label: 'Format date (YYYY-MM-DD)' },
  { value: 'mapCurrency', label: 'Mapper devise (DZD→DZ)' },
  { value: 'mapLanguage', label: 'Mapper langue (FR→fr_FR)' },
]

const entityTypes = ['PRODUCTS', 'INVENTORY', 'ORDERS', 'CUSTOMERS', 'PRICES', 'CATEGORIES', 'SUPPLIERS', 'INVOICES', 'SHIPMENTS']

export default function FieldMappingEditor({ 
  erpType, 
  erpConfigId,
  entityType: initialEntityType = 'PRODUCTS' 
}: FieldMappingEditorProps) {
  const [entityType, setEntityType] = useState(initialEntityType)
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newMapping, setNewMapping] = useState<FieldMapping>({
    localField: '',
    erpField: '',
  })

  // Load mappings when entity type changes
  useEffect(() => {
    const defaults = predefinedMappings[erpType]?.[entityType] || []
    // Reset mappings when entity type changes - this is intentional
    setMappings(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erpType, entityType])

  const handleAddMapping = () => {
    if (newMapping.localField && newMapping.erpField) {
      setMappings(prev => [...prev, { ...newMapping }])
      setNewMapping({ localField: '', erpField: '' })
      setShowAddDialog(false)
    }
  }

  const handleRemoveMapping = (index: number) => {
    setMappings(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveMappings = async () => {
    try {
      // In production, would call API to save mappings
      console.log('Saving mappings for', erpConfigId, entityType, ':', mappings)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save mappings:', error)
    }
  }

  const handleLoadDefaults = () => {
    const defaults = predefinedMappings[erpType]?.[entityType] || []
    if (defaults.length > 0) {
      setMappings(defaults)
    }
  }

  const handleExportMappings = () => {
    const dataStr = JSON.stringify(mappings, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `field-mapping-${erpType.toLowerCase()}-${entityType.toLowerCase()}.json`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Éditeur de mappage de champs</h3>
          <p className="text-sm text-gray-500">
            Configurez la correspondance entre les champs locaux et ceux de l&apos;ERP
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Entity Type Selector */}
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Entité" />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Modifier
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveMappings}>
                <Save className="mr-2 h-4 w-4" /> Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mapping Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Mappages: {erpType} → {entityType}
              </CardTitle>
              <CardDescription>
                {mappings.length} champ(s) mappé(s)
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleLoadDefaults}>
                <RotateCcw className="mr-1 h-4 w-4" /> Défauts
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportMappings}>
                <Download className="mr-1 h-4 w-4" /> Exporter
              </Button>
              
              {isEditing && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-1 h-4 w-4" /> Ajouter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un mappage de champ</DialogTitle>
                      <DialogDescription>
                        Définissez la correspondance entre un champ local et un champ ERP
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Champ local</label>
                        <Input
                          placeholder="ex: name, sku, price"
                          value={newMapping.localField}
                          onChange={(e) => setNewMapping({ ...newMapping, localField: e.target.value })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <ArrowRightLeft className="h-5 w-5 text-gray-400 rotate-90" />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Champ ERP ({erpType})</label>
                        <Input
                          placeholder={`ex: ${erpType === 'SAP' ? 'MAKTX, MATNR' : erpType === 'ODOO' ? 'name, list_price' : 'field_name'}`}
                          value={newMapping.erpField}
                          onChange={(e) => setNewMapping({ ...newMapping, erpField: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Transformation (optionnel)</label>
                        <Select 
                          value={newMapping.transform || ''} 
                          onValueChange={(v) => setNewMapping({ ...newMapping, transform: v || undefined })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir une transformation" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTransforms.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleAddMapping}>Ajouter</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {mappings.length > 0 ? (
            <div className="divide-y">
              {mappings.map((mapping, index) => (
                <div 
                  key={index} 
                  className={`p-4 flex items-center gap-4 ${isEditing ? 'hover:bg-gray-50' : ''}`}
                >
                  {/* Local Field */}
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Champ local</label>
                    <div className="font-mono text-sm bg-blue-50 px-2 py-1 rounded mt-1 truncate">
                      {mapping.localField}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRightLeft className="h-5 w-5 text-gray-300 flex-shrink-0" />

                  {/* ERP Field */}
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Champ {erpType}</label>
                    <div className="font-mono text-sm bg-green-50 px-2 py-1 rounded mt-1 truncate">
                      {mapping.erpField}
                    </div>
                  </div>

                  {/* Transform */}
                  {mapping.transform && (
                    <Badge variant="outline" className="flex-shrink-0">
                      {availableTransforms.find(t => t.value === mapping.transform)?.label || mapping.transform}
                    </Badge>
                  )}

                  {/* Actions */}
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveMapping(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Settings className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Aucun mappage configuré</h3>
              <p className="text-sm text-gray-500 mb-4">
                Ajoutez des mappages pour définir comment les données sont synchronisées
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Ajouter un mappage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modèles rapides</CardTitle>
          <CardDescription>
            Chargez des configurations de mappage prédéfinies pour {erpType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.keys(predefinedMappings[erpType] || {}).map((type) => (
              <Button
                key={type}
                variant="outline"
                className="justify-start h-auto py-3"
                onClick={() => {
                  setEntityType(type as any)
                  handleLoadDefaults()
                }}
              >
                <div className="text-left">
                  <p className="font-medium">{type}</p>
                  <p className="text-xs text-gray-500">
                    {((predefinedMappings[erpType as keyof typeof predefinedMappings]?.[type as any] as FieldMapping[] | undefined)?.length || 0)} champs
                  </p>
                </div>
              </Button>
            ))}
            
            {Object.keys(predefinedMappings[erpType] || {}).length === 0 && (
              <p className="col-span-3 text-sm text-gray-500 text-center py-4">
                Aucun modèle prédéfini disponible pour {erpType}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help / Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Conseils de configuration</p>
              <ul className="list-disc list-inside space-y-1 opacity-90">
                <li>Les mappages définissent comment les données sont converties entre la plateforme et l&apos;ERP</li>
                <li>Utilisez des transformations pour formater les valeurs (majuscules, dates, etc.)</li>
                <li>Les champs non mappés seront ignorés lors de la synchronisation</li>
                <li>Vous pouvez exporter/importer les configurations pour les réutiliser sur d&apos;autres environnements</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
