// Product Customizer Component - AlgeriaTrade Mobile
// Composant de personnalisation de produit avec options, tarifs et certifications

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../utils/constants';

// ============================================
// Types & Interfaces
// ============================================

export type CustomizationOptionType =
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'text'
  | 'number'
  | 'file'
  | 'color';

interface CustomizationOption {
  id: string;
  name: string;
  type: CustomizationOptionType;
  required: boolean;
  sortOrder: number;
  values?: Array<{
    id: string;
    label: string;
    priceModifier?: number; // Additional cost for this option
    colorHex?: string; // For color type
    image?: string; // For visual options
  }>;
  defaultValue?: string;
}

interface BulkPricingTier {
  id: string;
  productId: string;
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  currency: string;
  discountPercent: number;
  isBestValue?: boolean;
}

interface ProductCertification {
  id: string;
  name: string;
  issuingBody: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate?: Date;
  documentUrl: string;
  isValid: boolean;
  iconUrl?: string;
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
  supplier: string;
  relationType: 'related' | 'up_sell' | 'cross_sell' | 'complementary' | 'alternative';
}

interface ProductCustomizerProps {
  // Product base info
  productId: string;
  basePrice: number;
  currency: string;
  
  // Customization options
  customizationOptions?: CustomizationOption[];
  
  // Bulk pricing
  bulkPricingTiers?: BulkPricingTier[];
  
  // Certifications
  certifications?: ProductCertification[];
  
  // Related products
  relatedProducts?: RelatedProduct[];
  
  // Callbacks
  onSelectionChange?: (selections: Record<string, any>, totalPrice: number) => void;
  onAddToCart?: (quantity: number, selections: Record<string, any>) => void;
  onViewCertification?: (cert: ProductCertification) => void;
  onPressRelatedProduct?: (product: RelatedProduct) => void;
  
  // Display options
  compact?: boolean;
  showHeader?: boolean;
  initialQuantity?: number;
}

// ============================================
// Constants
// ============================================

const RELATION_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  related: { label: 'Similaire', color: Colors.info },
  up_sell: { label: 'Premium', color: Colors.warning },
  cross_sell: { label: 'Complémentaire', color: Colors.success },
  complementary: { label: 'Accesoire', color: Colors.primary },
  alternative: { label: 'Alternative', color: Colors.textSecondary },
};

const CERTIFICATION_ICONS: Record<string, string> = {
  CE: 'shield-checkmark',
  ISO: 'medal',
  SGS: 'verified',
  TUV: 'security',
  default: 'document-text',
};

// ============================================
// Sub-Components
// ============================================

function OptionSelector({
  option,
  value,
  onChange,
}: {
  option: CustomizationOption;
  value: any;
  onChange: (value: any) => void;
}) {
  switch (option.type) {
    case 'color':
      return <ColorPicker option={option} value={value} onChange={onChange} />;
    case 'radio':
      return <RadioGroup option={option} value={value} onChange={onChange} />;
    case 'checkbox':
      return <CheckboxGroup option={option} value={value} onChange={onChange} />;
    case 'select':
      return <SelectDropdown option={option} value={value} onChange={onChange} />;
    case 'text':
    case 'number':
      return <TextInputField option={option} value={value} onChange={onChange} />;
    default:
      return null;
  }
}

function ColorPicker({
  option,
  value,
  onChange,
}: {
  option: CustomizationOption;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.optionContainer}>
      <View style={styles.optionHeader}>
        <Text style={styles.optionName}>{option.name}</Text>
        {option.required && <Text style={styles.requiredStar}>*</Text>}
      </View>
      
      <View style={styles.colorOptions}>
        {option.values?.map(v => (
          <TouchableOpacity
            key={v.id}
            style={[
              styles.colorSwatch,
              value === v.id && styles.colorSwatchSelected,
              { backgroundColor: v.colorHex || '#ccc' }
            ]}
            onPress={() => onChange(v.id)}
            activeOpacity={0.7}
          >
            {value === v.id && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
            
            {v.priceModifier !== undefined && v.priceModifier > 0 && (
              <View style={styles.priceModifierBadge}>
                <Text style={styles.priceModifierText}>+{v.priceModifier}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {option.values?.find(v => v.id === value)?.label && (
        <Text style={styles.selectedValue}>
          {option.values.find(v => v.id === value)?.label}
        </Text>
      )}
    </View>
  );
}

function RadioGroup({
  option,
  value,
  onChange,
}: {
  option: CustomizationOption;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.optionContainer}>
      <View style={styles.optionHeader}>
        <Text style={styles.optionName}>{option.name}</Text>
        {option.required && <Text style={styles.requiredStar}>*</Text>}
      </View>
      
      {option.values?.map(v => (
        <TouchableOpacity
          key={v.id}
          style={[styles.radioItem, value === v.id && styles.radioItemSelected]}
          onPress={() => onChange(v.id)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.radioCircle,
            value === v.id && styles.radioCircleSelected
          ]}>
            {value === v.id && <View style={styles.radioInner} />}
          </View>
          
          <View style={styles.radioContent}>
            <Text style={[styles.radioLabel, value === v.id && styles.radioLabelSelected]}>
              {v.label}
            </Text>
            {v.image && (
              <Image source={{ uri: v.image }} style={styles.optionImage} />
            )}
          </View>
          
          {v.priceModifier !== undefined && (
            <Text style={styles.optionPriceModifier}>
              {v.priceModifier > 0 ? '+' : ''}{v.priceModifier.toLocaleString('fr-FR')}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CheckboxGroup({
  option,
  value,
  onChange,
}: {
  option: CustomizationOption;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const toggleValue = (id: string) => {
    const newValue = value.includes(id)
      ? value.filter(v => v !== id)
      : [...value, id];
    onChange(newValue);
  };

  return (
    <View style={styles.optionContainer}>
      <View style={styles.optionHeader}>
        <Text style={styles.optionName}>{option.name}</Text>
        {option.required && <Text style={styles.requiredStar}>*</Text>}
      </View>
      
      {option.values?.map(v => (
        <TouchableOpacity
          key={v.id}
          style={styles.checkboxItem}
          onPress={() => toggleValue(v.id)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.checkbox,
            value.includes(v.id) && styles.checkboxSelected
          ]}>
            {value.includes(v.id) && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </View>
          
          <Text style={styles.checkboxLabel}>{v.label}</Text>
          
          {v.priceModifier !== undefined && (
            <Text style={styles.optionPriceModifier}>
              +{v.priceModifier.toLocaleString('fr-FR')}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SelectDropdown({
  option,
  value,
  onChange,
}: {
  option: CustomizationOption;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.optionContainer}>
      <View style={styles.optionHeader}>
        <Text style={styles.optionName}>{option.name}</Text>
        {option.required && <Text style={styles.requiredStar}>*</Text>}
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectScroll}>
        {option.values?.map(v => (
          <TouchableOpacity
            key={v.id}
            style={[
              styles.selectChip,
              value === v.id && styles.selectChipSelected
            ]}
            onPress={() => onChange(v.id)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.selectChipText,
              value === v.id && styles.selectChipTextSelected
            ]}>
              {v.label}
            </Text>
            {v.priceModifier !== undefined && v.priceModifier > 0 && (
              <Text style={styles.chipPrice}>+{v.priceModifier}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function TextInputField({
  option,
  value,
  onChange,
}: {
  option: CustomizationOption;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.optionContainer}>
      <View style={styles.optionHeader}>
        <Text style={styles.optionName}>{option.name}</Text>
        {option.required && <Text style={styles.requiredStar}>*</Text>}
      </View>
      
      <TextInput
        style={styles.textInput}
        value={value || ''}
        onChangeText={onChange}
        placeholder={`Entrez ${option.name.toLowerCase()}...`}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={option.type === 'number' ? 'decimal-pad' : 'default'}
      />
    </View>
  );
}

import { TextInput } from 'react-native';

// Bulk Pricing Table
function BulkPricingTable({ 
  tiers, 
  currency, 
  selectedTier, 
  onSelectTier 
}: { 
  tiers: BulkPricingTier[]; 
  currency: string; 
  selectedTier: string | null;
  onSelectTier: (tierId: string) => void;
}) {
  if (!tiers || tiers.length === 0) return null;

  return (
    <View style={styles.pricingSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name="pricetags-outline" size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Tarifs par quantité</Text>
      </View>

      <View style={styles.pricingTable}>
        {/* Header */}
        <View style={styles.pricingHeader}>
          <Text style={styles.pricingHeaderText}>Quantité</Text>
          <Text style={styles.pricingHeaderText}>Prix unitaire</Text>
          <Text style={styles.pricingHeaderText}>Remise</Text>
        </View>

        {/* Rows */}
        {tiers.map(tier => (
          <TouchableOpacity
            key={tier.id}
            style={[
              styles.pricingRow,
              selectedTier === tier.id && styles.pricingRowSelected,
              tier.isBestValue && styles.pricingRowBestValue,
            ]}
            onPress={() => onSelectTier(tier.id)}
            activeOpacity={0.7}
          >
            <View style={styles.quantityCell}>
              <Text style={styles.quantityText}>
                {tier.minQuantity}+
                {tier.maxQuantity ? ` - ${tier.maxQuantity}` : ''}
              </Text>
              {tier.isBestValue && (
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>Meilleur prix</Text>
                </View>
              )}
            </View>
            
            <Text style={[
              styles.priceCell,
              selectedTier === tier.id && styles.priceCellSelected,
            ]}>
              {tier.unitPrice.toLocaleString('fr-FR')} {currency}
            </Text>
            
            <View style={styles.discountCell}>
              <Text style={styles.discountText}>
                -{tier.discountPercent}%
              </Text>
            </View>
            
            {selectedTier === tier.id && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Savings info */}
      {selectedTier && tiers.find(t => t.id === selectedTier)?.discountPercent > 0 && (
        <View style={styles.savingsBanner}>
          <Ionicons name="trending-down-outline" size={16} color={Colors.success} />
          <Text style={styles.savingsText}>
            Vous économisez {tiers.find(t => t.id === selectedTier)?.discountPercent}% sur le prix unitaire !
          </Text>
        </View>
      )}
    </View>
  );
}

// Certification Viewer
function CertificationViewer({
  certifications,
  onViewCertificate,
}: {
  certifications: ProductCertification[];
  onViewCertificate: (cert: ProductCertification) => void;
}) {
  const [showAll, setShowAll] = useState(false);

  if (!certifications || certifications.length === 0) return null;

  const displayCerts = showAll ? certifications : certifications.slice(0, 3);

  return (
    <View style={styles.certSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name="shield-checkmark-outline" size={20} color={Colors.success} />
        <Text style={styles.sectionTitle}>Certifications</Text>
        {certifications.length > 3 && (
          <TouchableOpacity onPress={() => setShowAll(!showAll)}>
            <Text style={styles.showAllText}>
              {showAll ? 'Voir moins' : `Voir tout (${certifications.length})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {displayCerts.map(cert => (
        <TouchableOpacity
          key={cert.id}
          style={[
            styles.certCard,
            !cert.isValid && styles.certCardInvalid,
          ]}
          onPress={() => onViewCertificate(cert)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.certIconContainer,
            { backgroundColor: cert.isValid ? Colors.successLight : Colors.errorLight }
          ]}>
            <Ionicons
              name={(CERTIFICATION_ICONS[cert.name] || CERTIFICATION_ICONS.default) as any}
              size={24}
              color={cert.isValid ? Colors.success : Colors.error}
            />
          </View>

          <View style={styles.certContent}>
            <Text style={styles.certName}>{cert.name}</Text>
            <Text style={styles.certIssuer}>{cert.issuingBody}</Text>
            <Text style={styles.certNumber}>N° {cert.certificateNumber}</Text>
          </View>

          <View style={styles.certStatusContainer}>
            <View style={[
              styles.certStatusBadge,
              { backgroundColor: cert.isValid ? Colors.successLight : Colors.errorLight }
            ]}>
              <Text style={[
                styles.certStatusText,
                { color: cert.isValid ? Colors.success : Colors.error }
              ]}>
                {cert.isValid ? 'Valide' : 'Expiré'}
              </Text>
            </View>
            
            <Ionicons name="document-text-outline" size={20} color={Colors.textTertiary} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Related Products Carousel
function RelatedProductsCarousel({
  products,
  onPressProduct,
}: {
  products: RelatedProduct[];
  onPressProduct: (product: RelatedProduct) => void;
}) {
  if (!products || products.length === 0) return null;

  return (
    <View style={styles.relatedSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name="link-outline" size={20} color={Colors.info} />
        <Text style={styles.sectionTitle}>Produits associés</Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.relatedList}
        renderItem={({ item }) => {
          const relationConfig = RELATION_TYPE_CONFIG[item.relationType] || RELATION_TYPE_CONFIG.related;

          return (
            <TouchableOpacity
              style={styles.relatedCard}
              onPress={() => onPressProduct(item)}
              activeOpacity={0.7}
            >
              <View style={styles.relatedImageContainer}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.relatedImage} />
                ) : (
                  <View style={styles.relatedImagePlaceholder}>
                    <Ionicons name="cube-outline" size={32} color={Colors.textTertiary} />
                  </View>
                )}
                
                <View style={[styles.relationBadge, { backgroundColor: relationConfig.color }]}>
                  <Text style={styles.relationBadgeText}>{relationConfig.label}</Text>
                </View>
              </View>

              <View style={styles.relatedContent}>
                <Text style={styles.relatedName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.relatedSupplier}>{item.supplier}</Text>
                <Text style={styles.relatedPrice}>
                  {item.price.toLocaleString('fr-FR')} {item.currency}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

// Certificate Detail Modal
function CertificateDetailModal({
  certificate,
  visible,
  onClose,
}: {
  certificate: ProductCertification | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!certificate) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.certModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Détails du certificat</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.certDetailIconContainer}>
            <Ionicons
              name={(CERTIFICATION_ICONS[certificate.name] || CERTIFICATION_ICONS.default) as any}
              size={48}
              color={certificate.isValid ? Colors.success : Colors.error}
            />
          </View>

          <Text style={styles.certDetailName}>{certificate.name}</Text>
          <Text style={styles.certDetailIssuer}>{certificate.issuingBody}</Text>

          <View style={styles.certDetailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Numéro</Text>
              <Text style={styles.detailValue}>{certificate.certificateNumber}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date d'émission</Text>
              <Text style={styles.detailValue}>
                {new Date(certificate.issueDate).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            {certificate.expiryDate && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Expiration</Text>
                <Text style={styles.detailValue}>
                  {new Date(certificate.expiryDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Statut</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: certificate.isValid ? Colors.successLight : Colors.errorLight }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: certificate.isValid ? Colors.success : Colors.error }
                ]}>
                  {certificate.isValid ? 'Valide' : 'Expiré'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.viewDocumentButton}>
            <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
            <Text style={styles.viewDocumentButtonText}>Voir le document PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// Main Component
// ============================================

export default function ProductCustomizer({
  productId,
  basePrice,
  currency,
  customizationOptions = [],
  bulkPricingTiers = [],
  certifications = [],
  relatedProducts = [],
  onSelectionChange,
  onAddToCart,
  onViewCertification,
  onPressRelatedProduct,
  compact = false,
  showHeader = true,
  initialQuantity = 1,
}: ProductCustomizerProps) {
  // State
  const [selections, setSelections] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<ProductCertification | null>(null);

  // Calculate total price based on selections and quantity
  const totalPrice = useMemo(() => {
    let price = basePrice;

    // Apply customization option modifiers
    Object.entries(selections).forEach(([optionId, value]) => {
      const option = customizationOptions.find(o => o.id === optionId);
      if (!option) return;

      if (Array.isArray(value)) {
        // Checkbox - sum all selected
        value.forEach((valId: string) => {
          const val = option.values?.find(v => v.id === valId);
          if (val?.priceModifier) {
            price += val.priceModifier;
          }
        });
      } else {
        // Single selection
        const val = option.values?.find(v => v.id === value);
        if (val?.priceModifier) {
          price += val.priceModifier;
        }
      }
    });

    // Apply bulk pricing discount
    if (bulkPricingTiers.length > 0) {
      const applicableTier = bulkPricingTiers.find(tier =>
        quantity >= tier.minQuantity &&
        (!tier.maxQuantity || quantity <= tier.maxQuantity)
      );

      if (applicableTier) {
        price = applicableTier.unitPrice;
      }
    }

    return Math.round(price * quantity * 100) / 100;
  }, [selections, quantity, basePrice, customizationOptions, bulkPricingTiers]);

  // Handle selection change
  const handleSelectionChange = (optionId: string, value: any) => {
    const newSelections = { ...selections, [optionId]: value };
    setSelections(newSelections);
    onSelectionChange?.(newSelections, totalPrice);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    // Validate required fields
    const missingRequired = customizationOptions
      .filter(opt => opt.required)
      .filter(opt => {
        const value = selections[opt.id];
        if (opt.type === 'checkbox') {
          return !Array.isArray(value) || value.length === 0;
        }
        return !value || (typeof value === 'string' && value.trim() === '');
      });

    if (missingRequired.length > 0) {
      // Would show error in real app
      console.log('[ProductCustomizer] Missing required:', missingRequired.map(o => o.name));
    }

    onAddToCart?.(quantity, selections);
  };

  // Handle view certification
  const handleViewCertification = (cert: ProductCertification) => {
    setSelectedCert(cert);
    setShowCertModal(true);
    onViewCertification?.(cert);
  };

  // Compact mode - just show price summary
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactPriceRow}>
          <Text style={styles.compactTotalLabel}>Total</Text>
          <Text style={styles.compactTotalPrice}>
            {totalPrice.toLocaleString('fr-FR')} {currency}
          </Text>
        </View>
        
        {bulkPricingTiers.length > 0 && (
          <TouchableOpacity 
            style={styles.bulkInfoButton}
            onPress={() => {} /* Would expand in full mode */}
          >
            <Ionicons name="pricetag-outline" size={14} color={Colors.primary} />
            <Text style={styles.bulkInfoText}>
              Tarif {quantity >= 100 ? 'grossiste' : quantity >= 10 ? 'semi-gros' : 'unitaire'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Full mode
  return (
    <View style={styles.container}>
      {/* Header */}
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Personnaliser votre commande</Text>
          <Text style={styles.headerSubtitle}>
            Choisissez les options et la quantité souhaitée
          </Text>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Customization Options */}
        {customizationOptions.length > 0 && (
          <View style={styles.optionsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="options-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Options disponibles</Text>
            </View>

            {customizationOptions
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <OptionSelector
                  key={option.id}
                  option={option}
                  value={selections[option.id]}
                  onChange={(value) => handleSelectionChange(option.id, value)}
                />
              ))
            }
          </View>
        )}

        {/* Quantity Selector */}
        <View style={styles.quantitySection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Quantité</Text>
          </View>

          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={20} color={Colors.text} />
            </TouchableOpacity>

            <TextInput
              style={styles.quantityInput}
              value={String(quantity)}
              onChangeText={(text) => {
                const num = parseInt(text) || 1;
                setQuantity(Math.max(1, num));
              }}
              keyboardType="number-pad"
              textAlign="center"
            />

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons name="add" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Quick quantity buttons */}
          <View style={styles.quickQuantityButtons}>
            {[10, 25, 50, 100].map(qty => (
              <TouchableOpacity
                key={qty}
                style={[
                  styles.quickQtyButton,
                  quantity === qty && styles.quickQtyButtonSelected,
                ]}
                onPress={() => setQuantity(qty)}
              >
                <Text style={[
                  styles.quickQtyButtonText,
                  quantity === qty && styles.quickQtyButtonTextSelected,
                ]}>
                  {qty}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bulk Pricing */}
        <BulkPricingTable
          tiers={bulkPricingTiers}
          currency={currency}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
        />

        {/* Certifications */}
        <CertificationViewer
          certifications={certifications}
          onViewCertificate={handleViewCertification}
        />

        {/* Related Products */}
        <RelatedProductsCarousel
          products={relatedProducts}
          onPressProduct={onPressRelatedProduct || (() => {})}
        />

        {/* Bottom spacing for sticky footer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <View style={styles.footerPriceContainer}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalPrice}>
            {totalPrice.toLocaleString('fr-FR')} {currency}
          </Text>
          {quantity > 1 && (
            <Text style={styles.footerUnitPrice}>
              ({(totalPrice / quantity).toLocaleString('fr-FR')} {currency}/unité)
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Ionicons name="cart-outline" size={20} color={Colors.white} />
          <Text style={styles.addToCartButtonText}>Ajouter au panier</Text>
        </TouchableOpacity>
      </View>

      {/* Certificate Modal */}
      <CertificateDetailModal
        certificate={selectedCert}
        visible={showCertModal}
        onClose={() => setShowCertModal(false)}
      />
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Compact Mode
  compactContainer: {
    paddingVertical: Spacing.sm,
  },
  compactPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactTotalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  compactTotalPrice: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  bulkInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  bulkInfoText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontFamily: FontFamily.medium,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginTop: Spacing.xs,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },

  // Options Section
  optionsSection: {
    padding: Spacing.md,
  },
  optionContainer: {
    marginBottom: Spacing.lg,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  optionName: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  requiredStar: {
    fontSize: FontSize.base,
    color: Colors.error,
    marginLeft: 4,
  },

  // Color Picker
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: Colors.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  priceModifierBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  priceModifierText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  selectedValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: FontFamily.regular,
  },

  // Radio Group
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  radioItemSelected: {
    backgroundColor: Colors.surface,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radioContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    fontSize: FontSize.base,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },
  radioLabelSelected: {
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  optionImage: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  optionPriceModifier: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.success,
    fontFamily: FontFamily.medium,
  },

  // Checkbox Group
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },

  // Select Dropdown
  selectScroll: {
    flexGrow: 0,
  },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectChipText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },
  selectChipTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  chipPrice: {
    fontSize: FontSize.xs,
    color: Colors.success,
    marginLeft: Spacing.xs,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },

  // Text Input Field
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },

  // Quantity Section
  quantitySection: {
    padding: Spacing.md,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quantityInput: {
    width: 80,
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickQuantityButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickQtyButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickQtyButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickQtyButtonText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  quickQtyButtonTextSelected: {
    color: Colors.white,
  },

  // Bulk Pricing Table
  pricingSection: {
    padding: Spacing.md,
  },
  pricingTable: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  pricingHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pricingHeaderText: {
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
    textTransform: 'uppercase',
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pricingRowSelected: {
    backgroundColor: Colors.primary + '08',
  },
  pricingRowBestValue: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  quantityCell: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  bestValueBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  bestValueText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  priceCell: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  priceCellSelected: {
    color: Colors.primary,
  },
  discountCell: {},
  discountText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.success,
    fontFamily: FontFamily.medium,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  savingsText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.success,
    fontFamily: FontFamily.medium,
  },

  // Certifications Section
  certSection: {
    padding: Spacing.md,
  },
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  certCardInvalid: {
    opacity: 0.7,
  },
  certIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  certContent: {
    flex: 1,
  },
  certName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  certIssuer: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  certNumber: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  certStatusContainer: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  certStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  certStatusText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  showAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },

  // Related Products
  relatedSection: {
    padding: Spacing.md,
  },
  relatedList: {
    paddingRight: Spacing.md,
  },
  relatedCard: {
    width: 150,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  relatedImageContainer: {
    height: 100,
    position: 'relative',
  },
  relatedImage: {
    width: '100%',
    height: '100%',
  },
  relatedImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  relationBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  relationBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  relatedContent: {
    padding: Spacing.sm,
  },
  relatedName: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
    lineHeight: 16,
    marginBottom: 2,
  },
  relatedSupplier: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  relatedPrice: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.lg,
  },
  footerPriceContainer: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  footerTotalPrice: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  footerUnitPrice: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  addToCartButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },

  // Certificate Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  certModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  certDetailIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  certDetailName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    fontFamily: FontFamily.bold,
  },
  certDetailIssuer: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.lg,
  },
  certDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.sm,
    marginBottom: Spacing.lg,
  },
  detailItem: {
    width: '50%',
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    fontFamily: FontFamily.semiBold,
  },
  viewDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  viewDocumentButtonText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.primary,
    fontFamily: FontFamily.medium,
  },
});
