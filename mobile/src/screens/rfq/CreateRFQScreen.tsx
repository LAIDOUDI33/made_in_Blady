import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Components
import Button from '../../components/Button';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../utils/constants';

const CATEGORIES = [
  'Agriculture & Alimentation',
  'Construction & BTP',
  'Énergie & Électricité',
  'Technologie & Informatique',
  'Textile & Habillement',
  'Chimie & Pharmacie',
  'Automobile & Pièces',
  'Emballage & Conditionnement',
];

export default function CreateRFQScreen() {
  const navigation = useNavigation();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('unités');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour votre appel d\'offres');
      return;
    }
    if (!category) {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
      return;
    }
    if (!quantity.trim()) {
      Alert.alert('Erreur', 'Veuillez indiquer la quantité souhaitée');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLoading(false);
    
    Alert.alert(
      'Succès !',
      'Votre appel d\'offres a été publié avec succès. Vous recevrez des notifications dès que vous recevrez des devis.',
      [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nouvel Appel d'Offres</Text>
          <Text style={styles.subtitle}>
            Décrivez votre besoin et recevez des devis de fournisseurs vérifiés
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Titre de l'appel d'offres *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Panneaux solaires pour projet agricole"
              placeholderTextColor={Colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              multiline
            />
          </View>

          {/* Category */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Catégorie *</Text>
            <TouchableOpacity
              style={[styles.input, styles.selectInput]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={category ? styles.inputText : styles.placeholder}>
                {category || 'Sélectionnez une catégorie'}
              </Text>
              <Ionicons 
                name={showCategoryPicker ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={Colors.textSecondary} 
              />
            </TouchableOpacity>
            
            {showCategoryPicker && (
              <View style={styles.pickerContainer}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.pickerItem,
                      category === cat && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      category === cat && styles.pickerItemTextSelected,
                    ]}>
                      {cat}
                    </Text>
                    {category === cat && (
                      <Ionicons name="checkmark" size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Quantity Row */}
          <View style={styles.row}>
            <View style={[styles.fieldContainer, styles.flex1]}>
              <Text style={styles.label}>Quantité *</Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                placeholderTextColor={Colors.textTertiary}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
              />
            </View>
            
            <View style={[styles.fieldContainer, styles.unitContainer]}>
              <Text style={styles.label}>Unité</Text>
              <TouchableOpacity style={[styles.input, styles.selectInput]}>
                <Text style={styles.inputText}>{unit}</Text>
                <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Budget Range */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Budget estimé (DA)</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Min"
                placeholderTextColor={Colors.textTertiary}
                value={budgetMin}
                onChangeText={setBudgetMin}
                keyboardType="number-pad"
              />
              <Text style={styles.dash}>—</Text>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Max"
                placeholderTextColor={Colors.textTertiary}
                value={budgetMax}
                onChangeText={setBudgetMax}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Description détaillée</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez en détail ce dont vous avez besoin : spécifications techniques, qualité souhaitée, conditions de livraison..."
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Deadline & Location */}
          <View style={styles.row}>
            <View style={[styles.fieldContainer, styles.flex1]}>
              <Text style={styles.label}>Date limite</Text>
              <TouchableOpacity style={[styles.input, styles.selectInput]}>
                <Text style={styles.inputText}>{deadline || 'JJ/MM/AAAA'}</Text>
                <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.fieldContainer, styles.flex1]}>
              <Text style={styles.label}>Lieu de livraison</Text>
              <TextInput
                style={styles.input}
                placeholder="Ville"
                placeholderTextColor={Colors.textTertiary}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title={isLoading ? 'Publication en cours...' : 'Publier l\'appel d\'offres'}
            onPress={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
            fullWidth
            style={styles.submitButton}
          />

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
            <Text style={styles.infoNoteText}>
              Votre AO sera visible par +2500 fournisseurs algériens vérifiés.
              Les réponses sont généralement reçues sous 24-48h.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: FontFamily.regular,
  },
  form: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.xs,
    fontFamily: FontFamily.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.text,
    backgroundColor: Colors.surface,
    fontFamily: FontFamily.regular,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: FontSize.base,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },
  placeholder: {
    color: Colors.textTertiary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flex1: {
    flex: 1,
  },
  unitContainer: {
    flex: 0.4,
  },
  dash: {
    alignSelf: 'center',
    color: Colors.textTertiary,
    paddingHorizontal: Spacing.sm,
  },
  pickerContainer: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerItemSelected: {
    backgroundColor: `${Colors.primary}08`,
  },
  pickerItemText: {
    fontSize: FontSize.base,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },
  pickerItemTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
  infoNote: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: `${Colors.info}10`,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  infoNoteText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.info,
    lineHeight: 18,
    fontFamily: FontFamily.regular,
  },
});

const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
};
