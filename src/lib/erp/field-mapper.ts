// Field Mapper - Visual field mapping UI data, presets, transformations
// AlgeriaTrade.dz B2B Platform - Inventory/ERP Sync System

import {
  ERPSystemType,
  FieldMappingDefinition,
  TransformRule,
  ValidationRule,
  DEFAULT_FIELD_MAPPINGS,
} from './config'

// ============================================
// TYPES
// ============================================

export interface MappingPreset {
  id: string
  name: string
  description: string
  erpType: ERPSystemType
  entityType: string
  mappings: FieldMapping[]
  createdAt: Date
  isDefault: boolean
}

export interface FieldMappingUI {
  localField: string
  erpField: string
  transform?: TransformOption
  defaultValue?: any
  required: boolean
  validation?: ValidationOption
  sampleValue?: string
  description?: string
}

export interface TransformOption {
  type: string
  label: string
  params?: Record<string, any>
}

export interface ValidationOption {
  type: string
  label: string
  value?: any
  message?: string
}

export interface MappingGroup {
  entityType: string
  entityLabel: string
  icon: string
  mappings: FieldMappingUI[]
  requiredCount: number
}

// ============================================
// TRANSFORM OPTIONS (for UI)
// ============================================

export const TRANSFORM_OPTIONS: TransformOption[] = [
  { type: '', label: 'Aucune transformation' },
  { type: 'uppercase', label: 'Majuscules' },
  { type: 'lowercase', label: 'Minuscules' },
  { type: 'trim', label: 'Supprimer les espaces' },
  { type: 'toString', label: 'Convertir en chaîne' },
  { type: 'toNumber', label: 'Convertir en nombre' },
  { type: 'toFloat', label: 'Convertir en décimal' },
  { type: 'toInt', label: 'Convertir en entier' },
  { type: 'toBoolean', label: 'Convertir en booléen' },
  { type: 'toDate', label: 'Convertir en date' },
  { type: 'formatPrice', label: 'Format prix (2 décimales)' },
  { type: 'formatDate', label: 'Format date (YYYY-MM-DD)' },
  { type: 'mapCurrency', label: 'Mapper devise (DZD→DZ)' },
  { type: 'mapLanguage', label: 'Mapper langue (FR→fr_FR)' },
]

// ============================================
// VALIDATION OPTIONS (for UI)
// ============================================

export const VALIDATION_OPTIONS: ValidationOption[] = [
  { type: 'required', label: 'Requis' },
  { type: 'pattern', label: 'Expression régulière' },
  { type: 'minLength', label: 'Longueur min.' },
  { type: 'maxLength', label: 'Longueur max.' },
  { type: 'min', label: 'Valeur min.' },
  { type: 'max', label: 'Valeur max.' },
  { type: 'enum', label: 'Liste de valeurs' },
]

// ============================================
// LOCAL FIELDS DEFINITION
// ============================================

export interface LocalFieldDef {
  field: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object'
  required: boolean
  description?: string
  category: string
}

export const LOCAL_FIELDS: LocalFieldDef[] = [
  // Product fields
  { field: 'id', label: 'ID Produit', type: 'string', required: true, description: 'Identifiant unique du produit', category: 'Produit' },
  { field: 'name', label: 'Nom', type: 'string', required: true, description: 'Nom du produit', category: 'Produit' },
  { field: 'sku', label: 'SKU/Référence', type: 'string', required: false, description: 'Code produit unique', category: 'Produit' },
  { field: 'description', label: 'Description', type: 'string', required: false, description: 'Description détaillée', category: 'Produit' },
  { field: 'price', label: 'Prix', type: 'number', required: false, description: 'Prix unitaire', category: 'Prix' },
  { field: 'currency', label: 'Devise', type: 'string', required: false, description: 'Code devise (DZD, EUR, USD)', category: 'Prix' },
  { field: 'quantity', label: 'Quantité', type: 'number', required: false, description: 'Stock disponible', category: 'Inventaire' },
  { field: 'category.id', label: 'ID Catégorie', type: 'string', required: false, description: 'Identifiant de catégorie', category: 'Catégorie' },
  { field: 'category.name', label: 'Nom Catégorie', type: 'string', required: false, description: 'Nom de la catégorie', category: 'Catégorie' },
  { field: 'weight', label: 'Poids', type: 'number', required: false, description: 'Poids (kg)', category: 'Spécifications' },
  { field: 'isActive', label: 'Actif', type: 'boolean', required: false, description: 'Produit actif?', category: 'Statut' },
  { field: 'barcode', label: 'Code-barres', type: 'string', required: false, description: 'Code-barres EAN/UPC', category: 'Spécifications' },
  
  // Customer fields
  { field: 'externalId', label: 'ID Externe', type: 'string', required: false, description: 'ID dans le système externe', category: 'Client' },
  { field: 'companyName', label: 'Raison sociale', type: 'string', required: true, description: 'Nom de l\'entreprise', category: 'Client' },
  { field: 'email', label: 'Email', type: 'string', required: false, description: 'Adresse email', category: 'Client' },
  { field: 'phone', label: 'Téléphone', type: 'string', required: false, description: 'Numéro de téléphone', category: 'Client' },
  { field: 'nif', label: 'NIF', type: 'string', required: false, description: 'Numéro d\'identification fiscale', category: 'Client' },
  { field: 'address.city', label: 'Ville', type: 'string', required: false, description: 'Ville', category: 'Adresse' },
  { field: 'address.country', label: 'Pays', type: 'string', required: false, description: 'Code pays', category: 'Adresse' },
  { field: 'address.street', label: 'Rue', type: 'string', required: false, description: 'Adresse postale', category: 'Adresse' },
  { field: 'address.postalCode', label: 'Code postal', type: 'string', required: false, description: 'Code postal', category: 'Adresse' },
  
  // Order fields
  { field: 'orderNumber', label: 'N° Commande', type: 'string', required: true, description: 'Numéro de commande', category: 'Commande' },
  { field: 'customer.externalId', label: 'ID Client ERP', type: 'string', required: false, description: 'ID client dans l\'ERP', category: 'Commande' },
  { field: 'totalAmount', label: 'Montant total', type: 'number', required: false, description: 'Total TTC', category: 'Commande' },
  { field: 'status', label: 'Statut', type: 'string', required: false, description: 'Statut de la commande', category: 'Commande' },
]

// ============================================
// ERP FIELD DEFINITIONS BY TYPE
// ============================================

export interface ERPFieldDef {
  field: string
  label: string
  type: string
  required: boolean
  description?: string
  sampleValue?: string
}

export const ERP_FIELDS: Record<ERPSystemType, ERPFieldDef[]> = {
  SAP: [
    { field: 'MATNR', label: 'Matériau', type: 'CHAR(40)', required: true, description: 'Numéro de matériau SAP', sampleValue: 'MAT-001234' },
    { field: 'MAKTX', label: 'Description courte', type: 'CHAR(40)', required: true, description: 'Description du matériau', sampleValue: 'Produit exemple' },
    { field: 'MAKTG', label: 'Description longue', type: 'STRING', required: false, description: 'Description détaillée' },
    { field: 'MATKL', label: 'Groupe de marchandises', type: 'CHAR(9)', required: false, description: 'Catégorie de produit', sampleValue: 'PROD01' },
    { field: 'MEINS', label: 'Unité de base', type: 'UNIT(3)', required: false, description: 'Unité de mesure', sampleValue: 'EA' },
    { field: 'NETPR', label: 'Prix net', type: 'CURR(11,2)', required: false, description: 'Prix par unité', sampleValue: '1500.00' },
    { field: 'WAERK', label: 'Devise', type: 'CUKY(5)', required: false, description: 'Clé de devise', sampleValue: 'DZD' },
    { field: 'BRGEW', label: 'Poids brut', type: 'QUAN(13,3)', required: false, description: 'Poids en kg', sampleValue: '2.500' },
    { field: 'LVORM', label: 'Ind. de suppression', type: 'CHAR(1)', required: false, description: 'Flag pour archivage' },
    { field: 'PARTNER', label: 'Partenaire', type: 'CHAR(10)', required: true, description: 'Numéro partenaire', sampleValue: '1000001' },
    { field: 'ORG_NAME1', label: 'Nom 1', type: 'CHAR(40)', required: true, description: 'Nom de l\'organisation' },
    { field: 'SMTP_ADDR', label: 'Email', type: 'CHAR(241)', required: false, description: 'Adresse SMTP' },
    { field: 'VBELN', label: 'Document Vente', type: 'CHAR(10)', required: true, description: 'N° document vente', sampleValue: '0000012345' },
    { field: 'NETWR', label: 'Valeur nette', type: 'CURR(15,2)', required: false, description: 'Montant net' },
    { field: 'LABST', label: 'Stock non restreint', type: 'QUAN(13,3)', required: false, description: 'Quantité disponible' },
    { field: 'WERKS', label: 'Établissement', type: 'CHAR(4)', required: false, description: 'Code usine', sampleValue: '1000' },
    { field: 'TAXNUMXL', label: 'N° fiscal', type: 'CHAR(20)', required: false, description: 'N° d\'imposition' },
  ],
  
  Odoo: [
    { field: 'id', label: 'ID', type: 'INTEGER', required: true, description: 'Identifiant unique', sampleValue: '12345' },
    { field: 'name', label: 'Nom', type: 'VARCHAR', required: true, description: 'Nom de l\'enregistrement', sampleValue: 'Produit Test' },
    { field: 'default_code', label: 'Référence interne', type: 'VARCHAR', required: false, description: 'Code/SKU produit', sampleValue: 'PROD-001' },
    { field: 'list_price', label: 'Prix de vente', type: 'FLOAT', required: false, description: 'Prix public', sampleValue: '2500.00' },
    { field: 'description_sale', label: 'Description vente', type: 'TEXT', required: false, description: 'Description pour clients' },
    { field: 'categ_id', label: 'Catégorie', type: 'MANY2ONE', required: false, description: 'Catégorie produit', sampleValue: '[1, "Toutes"]' },
    { field: 'sale_ok', label: 'Peut être vendu', type: 'BOOLEAN', required: false, description: 'Disponible à la vente' },
    { field: 'barcode', label: 'EAN', type: 'CHAR', required: false, description: 'Code-barres EAN13', sampleValue: '1234567890123' },
    { field: 'weight', label: 'Poids', type: 'FLOAT', required: false, description: 'Poids (kg)', sampleValue: '1.5' },
    { field: 'qty_available', label: 'Qté dispo.', type: 'FLOAT', required: false, description: 'Quantité en stock', sampleValue: '100' },
    { field: 'warehouse_id', label: 'Entrepôt', type: 'MANY2ONE', required: false, description: 'Entrepôt de stock' },
    { field: 'state', label: 'État', type: 'SELECTION', required: false, description: 'Statut enregistrement', sampleValue: 'draft' },
    { field: 'amount_total', label: 'Montant total', type: 'FLOAT', required: false, description: 'Total commande', sampleValue: '15000.00' },
    { field: 'partner_id', label: 'Partenaire', type: 'MANY2ONE', required: true, description: 'Client/Fournisseur', sampleValue: '[42, "Client SA"]' },
    { field: 'vat', label: 'TVA/NIF', type: 'VARCHAR', required: false, description: 'Numéro TVA', sampleValue: '000012345678901234' },
    { field: 'email', label: 'Email', type: 'VARCHAR', required: false, description: 'Contact email' },
    { field: 'phone', label: 'Téléphone', type: 'VARCHAR', required: false, description: 'Numéro téléphone' },
    { field: 'city', label: 'Ville', type: 'VARCHAR', required: false, description: 'Ville' },
  ],
  
  MicrosoftDynamics: [
    { field: 'productid', label: 'ID Produit', type: 'GUID', required: true, description: 'Identifiant unique', sampleValue: '{GUID}' },
    { field: 'name', label: 'Nom', type: 'STRING', required: true, description: 'Nom du produit' },
    { field: 'productnumber', label: 'Référence', type: 'STRING', required: false, description: 'SKU/Code produit' },
    { field: 'description', label: 'Description', type: 'STRING', required: false, description: 'Description' },
    { field: 'price', label: 'Prix', type: 'MONEY', required: false, description: 'Prix courant' },
    { field: 'quantityonhand', label: 'Stock', type: 'DECIMAL', required: false, description: 'Quantité en stock' },
    { field: 'accountid', label: 'ID Compte', type: 'GUID', required: true, description: 'Identifiant compte client' },
    { field: 'accountnumber', label: 'N° Compte', type: 'STRING', required: false, description: 'Numéro de compte' },
    { field: 'emailaddress1', label: 'Email principal', type: 'STRING', required: false, description: 'Email' },
    { field: 'telephone1', label: 'Tél. principal', type: 'STRING', required: false, description: 'Téléphone' },
    { field: 'salesorderid', label: 'ID Commande', type: 'GUID', required: true, description: 'Identifiant commande' },
    { field: 'ordernumber', label: 'N° Commande', type: 'STRING', required: false, description: 'Numéro commande' },
    { field: 'totalamount', label: 'Montant total', type: 'MONEY', required: false, description: 'Total TTC' },
  ],
  
  Custom: [],
  REST: [],
}

// ============================================
// MAPPING GROUPS FOR UI
// ============================================

export function getMappingGroups(erpType: ERPSystemType): MappingGroup[] {
  const defaultMappings = DEFAULT_FIELD_MAPPINGS[erpType] || {}
  
  return [
    {
      entityType: 'PRODUCTS',
      entityLabel: 'Produits',
      icon: 'Package',
      mappings: (defaultMappings['PRODUCTS'] || []).map(m => ({
        localField: m.localField,
        erpField: m.erpField,
        transform: TRANSFORM_OPTIONS.find(t => t.type === m.transform?.type),
        defaultValue: m.defaultValue,
        required: m.required,
        description: LOCAL_FIELDS.find(f => f.field === m.localField)?.description,
      })),
      requiredCount: (defaultMappings['PRODUCTS'] || []).filter(m => m.required).length,
    },
    {
      entityType: 'INVENTORY',
      entityLabel: 'Inventaire',
      icon: 'Warehouse',
      mappings: (defaultMappings['INVENTORY'] || []).map(m => ({
        localField: m.localField,
        erpField: m.erpField,
        transform: TRANSFORM_OPTIONS.find(t => t.type === m.transform?.type),
        defaultValue: m.defaultValue,
        required: m.required,
      })),
      requiredCount: (defaultMappings['INVENTORY'] || []).filter(m => m.required).length,
    },
    {
      entityType: 'CUSTOMERS',
      entityLabel: 'Clients',
      icon: 'Users',
      mappings: (defaultMappings['CUSTOMERS'] || []).map(m => ({
        localField: m.localField,
        erpField: m.erpField,
        transform: TRANSFORM_OPTIONS.find(t => t.type === m.transform?.type),
        defaultValue: m.defaultValue,
        required: m.required,
      })),
      requiredCount: (defaultMappings['CUSTOMERS'] || []).filter(m => m.required).length,
    },
    {
      entityType: 'ORDERS',
      entityLabel: 'Commandes',
      icon: 'ShoppingCart',
      mappings: (defaultMappings['ORDERS'] || []).map(m => ({
        localField: m.localField,
        erpField: m.erpField,
        transform: TRANSFORM_OPTIONS.find(t => t.type === m.transform?.type),
        defaultValue: m.defaultValue,
        required: m.required,
      })),
      requiredCount: (defaultMappings['ORDERS'] || []).filter(m => m.required).length,
    },
  ]
}

// ============================================
// PRESET MANAGEMENT
// ============================================

const STORAGE_KEY_PREFIX = 'erp_mapping_preset_'

export function saveMappingPreset(preset: Omit<MappingPreset, 'id' | 'createdAt'>): void {
  const presetWithMeta: MappingPreset = {
    ...preset,
    id: `preset_${Date.now()}`,
    createdAt: new Date(),
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${presetWithMeta.id}`,
      JSON.stringify(presetWithMeta)
    )
  }
}

export function loadMappingPresets(erpType?: ERPSystemType): MappingPreset[] {
  if (typeof window === 'undefined') return []
  
  const presets: MappingPreset[] = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      try {
        const preset = JSON.parse(localStorage.getItem(key) || '')
        if (!erpType || preset.erpType === erpType) {
          presets.push(preset)
        }
      } catch {}
    }
  }
  
  return presets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function deleteMappingPreset(presetId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${presetId}`)
  }
}

export function exportMappingPreset(preset: MappingPreset): string {
  return JSON.stringify(preset, null, 2)
}

export function importMappingPreset(jsonString: string): MappingPreset | null {
  try {
    const preset = JSON.parse(jsonString)
    if (preset.name && preset.erpType && preset.mappings) {
      return preset as MappingPreset
    }
    return null
  } catch {
    return null
  }
}

// ============================================
// DATA TRANSFORMATION ENGINE
// ============================================

export class DataTransformer {
  private mappings: FieldMapping[]
  
  constructor(mappings: FieldMapping[]) {
    this.mappings = mappings
  }
  
  transform(sourceData: any, direction: 'toERP' | 'fromERP'): any {
    const result: any = {}
    
    for (const mapping of this.mappings) {
      try {
        let sourceField: string
        let targetField: string
        
        if (direction === 'toERP') {
          sourceField = mapping.localField
          targetField = mapping.erpField
        } else {
          sourceField = mapping.erpField
          targetField = mapping.localField
        }
        
        let value = this.getNestedValue(sourceData, sourceField)
        
        // Apply default value if needed
        if ((value === undefined || value === null) && mapping.defaultValue !== undefined) {
          value = mapping.defaultValue
        }
        
        // Apply transformation
        if (value !== undefined && value !== null && mapping.transform) {
          value = this.applyTransform(value, mapping.transform)
        }
        
        // Set value in result
        if (value !== undefined) {
          this.setNestedValue(result, targetField, value)
        }
      } catch (error) {
        console.warn(`Transform error [${mapping.localField} -> ${mapping.erpField}]:`, error)
      }
    }
    
    return result
  }
  
  validate(data: any, direction: 'toERP' | 'fromERP'): { valid: boolean; errors: Array<{ field: string; message: string }> } {
    const errors: Array<{ field: string; message: string }> = []
    
    for (const mapping of this.mappings) {
      if (!mapping.required) continue
      
      const checkField = direction === 'toERP' ? mapping.localField : mapping.erpField
      const value = this.getNestedValue(data, checkField)
      
      if (value === undefined || value === null || value === '') {
        errors.push({
          field: checkField,
          message: `Le champ ${checkField} est requis`,
        })
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
  
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (current[key] === undefined) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }
  
  private applyTransform(value: any, transform: string): any {
    switch (transform) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : String(value).toUpperCase()
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : String(value).toLowerCase()
      case 'trim':
        return typeof value === 'string' ? value.trim() : value
      case 'toString':
        return String(value)
      case 'toNumber':
        return Number(value)
      case 'toFloat':
        return parseFloat(String(value))
      case 'toInt':
        return parseInt(String(value), 10)
      case 'toBoolean':
        if (typeof value === 'boolean') return value
        if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.toLowerCase())
        return Boolean(value)
      case 'toDate':
        return value instanceof Date ? value : new Date(value)
      case 'formatPrice':
        return typeof value === 'number' ? parseFloat(value.toFixed(2)) : parseFloat(Number(value).toFixed(2))
      case 'formatDate': {
        const d = value instanceof Date ? value : new Date(value)
        return d.toISOString().split('T')[0]
      }
      case 'mapCurrency':
        // Map common currency codes to their symbols or short forms
        const currencyMap: Record<string, string> = { DZD: 'DZ', EUR: '€', USD: '$' }
        return currencyMap[String(value)] || value
      case 'mapLanguage':
        // Map language codes to locale format
        const langMap: Record<string, string> = { FR: 'fr_FR', EN: 'en_US', AR: 'ar_DZ' }
        return langMap[String(value)] || value
      default:
        return value
    }
  }
}

// ============================================
// EXPORT HELPERS
// ============================================

export function getFieldSuggestions(erpType: ERPSystemType, searchTerm: string): ERPFieldDef[] {
  const fields = ERP_FIELDS[erpType] || []
  
  if (!searchTerm) return fields
  
  const term = searchTerm.toLowerCase()
  return fields.filter(f =>
    f.field.toLowerCase().includes(term) ||
    f.label.toLowerCase().includes(term)
  )
}

export function getLocalFieldSuggestions(searchTerm: string): LocalFieldDef[] {
  if (!searchTerm) return LOCAL_FIELDS
  
  const term = searchTerm.toLowerCase()
  return LOCAL_FIELDS.filter(f =>
    f.field.toLowerCase().includes(term) ||
    f.label.toLowerCase().includes(term)
  )
}
