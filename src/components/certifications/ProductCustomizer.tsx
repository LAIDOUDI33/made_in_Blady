'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Palette,
  Ruler,
  Type,
  Upload,
  Check,
  X,
  Plus,
  Minus,
  RotateCcw,
  Eye,
  Image as ImageIcon,
  AlertCircle,
  Info,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export type OptionType = 'color' | 'size' | 'text' | 'select' | 'number' | 'file' | 'boolean';

export interface CustomizationOption {
  id: string;
  name: string;
  type: OptionType;
  required?: boolean;
  options?: Array<{
    value: string;
    label: string;
    priceModifier?: number; // Additional cost for this option
    colorHex?: string; // For color options
    inStock?: boolean;
  }>;
  defaultValue?: string | number | boolean;
  min?: number; // For number type
  max?: number; // For number type
  step?: number; // For number type
  maxLength?: number; // For text type
  placeholder?: string;
  description?: string;
  maxFiles?: number; // For file upload
  acceptedFormats?: string[]; // e.g., ['jpg', 'png', 'pdf']
}

export interface CustomizationSelection {
  optionId: string;
  value: string | number | boolean | File[];
  priceModifier: number;
}

interface ProductCustomizerProps {
  options: CustomizationOption[];
  onChange?: (selections: CustomizationSelection[], totalPrice: number) => void;
  basePrice?: number;
  currency?: string;
  className?: string;
  showPreview?: boolean;
  previewImageUrl?: string;
}

// Format currency
function formatCurrency(amount: number, currency: string = 'DZD'): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency === 'DZD' ? 'DZD' : currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace('DZD', 'DA')
    .trim();
}

// Color swatch component
function ColorSwatch({
  color,
  label,
  selected,
  onClick,
  disabled,
}: {
  color: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-8 h-8 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
            selected
              ? 'border-primary ring-2 ring-primary/30 scale-110'
              : 'border-gray-200 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ backgroundColor: color }}
          onClick={onClick}
          disabled={disabled}
          aria-label={`Couleur: ${label}${selected ? ' (sélectionné)' : ''}`}
          aria-pressed={selected}
        >
          {selected && (
            <Check
              className={cn(
                'h-4 w-4 mx-auto',
                isLightColor(color) ? 'text-gray-800' : 'text-white'
              )}
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

// Helper to determine if a color is light or dark
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

export default function ProductCustomizer({
  options,
  onChange,
  basePrice = 0,
  currency = 'DZD',
  className,
  showPreview = true,
  previewImageUrl,
}: ProductCustomizerProps) {
  const [selections, setSelections] = useState<Record<string, CustomizationSelection>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});

  // Calculate total price based on selections
  const totalPrice = useMemo(() => {
    const additionalCost = Object.values(selections).reduce(
      (sum, sel) => sum + sel.priceModifier,
      0
    );
    return basePrice + additionalCost;
  }, [selections, basePrice]);

  // Update selection and notify parent
  const updateSelection = useCallback(
    (
      optionId: string,
      value: string | number | boolean | File[],
      priceModifier: number
    ) => {
      setSelections((prev) => {
        const newSelections = {
          ...prev,
          [optionId]: { optionId, value, priceModifier },
        };

        // Clear error for this field
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[optionId];
          return newErrors;
        });

        // Notify parent
        const selectionArray = Object.values(newSelections);
        onChange?.(selectionArray, basePrice + Object.values(newSelections).reduce((sum, s) => sum + s.priceModifier, 0));

        return newSelections;
      });
    },
    [onChange, basePrice]
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    (optionId: string, files: FileList | null) => {
      if (!files || files.length === 0) return;

      const option = options.find((o) => o.id === optionId);
      if (!option) return;

      const maxFiles = option.maxFiles ?? 3;
      const newFiles = Array.from(files).slice(0, maxFiles);

      setUploadedFiles((prev) => ({
        ...prev,
        [optionId]: newFiles,
      }));

      // Find price modifier for file uploads (usually fixed)
      const priceMod = newFiles.length > 0 ? (option.options?.[0]?.priceModifier ?? 0) : 0;

      updateSelection(optionId, newFiles, priceMod);
    },
    [options, updateSelection]
  );

  // Remove uploaded file
  const removeFile = useCallback((optionId: string, index: number) => {
    setUploadedFiles((prev) => {
      const currentFiles = prev[optionId] ?? [];
      const newFiles = currentFiles.filter((_, i) => i !== index);

      if (newFiles.length === 0) {
        const updated = { ...prev };
        delete updated[optionId];
        updateSelection(optionId, [], 0);
        return updated;
      }

      return { ...prev, [optionId]: newFiles };
    });
  }, [updateSelection]);

  // Reset all selections
  const resetSelections = () => {
    setSelections({});
    setErrors({});
    setUploadedFiles({});
    onChange?.([], basePrice);
  };

  // Validate all required fields
  const validateSelections = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    options.forEach((option) => {
      if (option.required) {
        const selection = selections[option.id];
        if (!selection || 
            selection.value === '' || 
            selection.value === false ||
            (Array.isArray(selection.value) && selection.value.length === 0)) {
          newErrors[option.id] = `${option.name} est requis`;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Render option input based on type
  const renderOptionInput = (option: CustomizationOption) => {
    const selection = selections[option.id];
    const error = errors[option.id];

    switch (option.type) {
      case 'color':
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {option.options?.map((opt) => (
                <ColorSwatch
                  key={opt.value}
                  color={opt.colorHex ?? opt.value}
                  label={opt.label}
                  selected={selection?.value === opt.value}
                  onClick={() =>
                    updateSelection(
                      option.id,
                      opt.value,
                      opt.priceModifier ?? 0
                    )
                  }
                  disabled={opt.inStock === false}
                />
              ))}
            </div>
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'size':
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {option.options?.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={selection?.value === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'min-w-[60px]',
                    opt.inStock === false && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() =>
                    opt.inStock !== false &&
                    updateSelection(option.id, opt.value, opt.priceModifier ?? 0)
                  }
                  disabled={opt.inStock === false}
                  aria-label={`Taille: ${opt.label}`}
                  aria-pressed={selection?.value === opt.value}
                >
                  {opt.label}
                  {opt.priceModifier && opt.priceModifier > 0 && (
                    <span className="ml-1 text-xs opacity-70">
                      +{formatCurrency(opt.priceModifier, currency)}
                    </span>
                  )}
                </Button>
              ))}
            </div>
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Select
              value={(selection?.value as string) ?? ''}
              onValueChange={(value) => {
                const selectedOpt = option.options?.find(
                  (o) => o.value === value
                );
                updateSelection(
                  option.id,
                  value,
                  selectedOpt?.priceModifier ?? 0
                );
              }}
            >
              <SelectTrigger className={cn(error && 'border-destructive')}>
                <SelectValue placeholder={`Sélectionner ${option.name}`} />
              </SelectTrigger>
              <SelectContent>
                {option.options?.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.inStock === false}
                  >
                    <span className="flex items-center gap-2">
                      {opt.label}
                      {opt.priceModifier && opt.priceModifier > 0 && (
                        <span className="text-xs text-muted-foreground">
                          (+{formatCurrency(opt.priceModifier, currency)})
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder={option.placeholder ?? `Entrez ${option.name.toLowerCase()}`}
              maxLength={option.maxLength}
              value={(selection?.value as string) ?? ''}
              onChange={(e) => updateSelection(option.id, e.target.value, 0)}
              className={cn(error && 'border-destructive')}
              aria-label={option.name}
              aria-invalid={!!error}
            />
            {option.maxLength && (
              <p className="text-xs text-muted-foreground text-right">
                {(selection?.value as string)?.length ?? 0}/{option.maxLength} caractères
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  const currentVal = (selection?.value as number) ?? option.defaultValue ?? option.min ?? 0;
                  const newVal = Math.max(option.min ?? -Infinity, currentVal - (option.step ?? 1));
                  updateSelection(option.id, newVal, 0);
                }}
                disabled={
                  (selection?.value as number) <= (option.min ?? -Infinity)
                }
                aria-label="Diminuer"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={option.min}
                max={option.max}
                step={option.step}
                value={(selection?.value as number) ?? option.defaultValue ?? ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    updateSelection(option.id, val, 0);
                  }
                }}
                className={cn('text-center', error && 'border-destructive')}
                aria-label={option.name}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  const currentVal = (selection?.value as number) ?? option.defaultValue ?? option.min ?? 0;
                  const newVal = Math.min(option.max ?? Infinity, currentVal + (option.step ?? 1));
                  updateSelection(option.id, newVal, 0);
                }}
                disabled={
                  (selection?.value as number) >= (option.max ?? Infinity)
                }
                aria-label="Augmenter"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {option.min !== undefined && option.max !== undefined && (
              <p className="text-xs text-muted-foreground text-center">
                Min: {option.min} - Max: {option.max}
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary/50 transition-colors">
              <input
                type="file"
                id={`file-${option.id}`}
                accept={option.acceptedFormats?.map((f) => `.${f}`).join(',')}
                multiple={(option.maxFiles ?? 1) > 1}
                className="hidden"
                onChange={(e) => handleFileUpload(option.id, e.target.files)}
                aria-label={`Télécharger ${option.name}`}
              />
              <label
                htmlFor={`file-${option.id}`}
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600 text-center">
                  Cliquez ou glissez vos fichiers ici
                </span>
                <span className="text-xs text-gray-400">
                  Formats acceptés:{' '}
                  {option.acceptedFormats?.join(', ') ?? 'Tous'}
                  {option.maxFiles && ` (Max: ${option.maxFiles})`}
                </span>
              </label>
            </div>

            {/* Uploaded files list */}
            {uploadedFiles[option.id] && uploadedFiles[option.id].length > 0 && (
              <div className="space-y-1.5">
                {uploadedFiles[option.id].map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ImageIcon className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">
                        ({(file.size / 1024).toFixed(1)} Ko)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeFile(option.id, index)}
                      aria-label={`Supprimer ${file.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant={selection?.value === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const priceMod =
                  selection?.value !== true
                    ? (option.options?.find((o) => o.value === 'true')?.priceModifier ?? 0)
                    : 0;
                updateSelection(option.id, true, priceMod);
              }}
              aria-pressed={selection?.value === true}
            >
              Oui
              {option.options?.find((o) => o.value === 'true')?.priceModifier &&
                selection?.value !== true && (
                  <span className="ml-1 text-xs">
                    +
                    {formatCurrency(
                      option.options!.find((o) => o.value === 'true')!
                        .priceModifier!,
                      currency
                    )}
                  </span>
                )}
            </Button>
            <Button
              type="button"
              variant={selection?.value === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSelection(option.id, false, 0)}
              aria-pressed={selection?.value === false}
            >
              Non
            </Button>
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Get icon for option type
  const getOptionIcon = (type: OptionType) => {
    switch (type) {
      case 'color':
        return <Palette className="h-4 w-4" />;
      case 'size':
        return <Ruler className="h-4 w-4" />;
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'file':
        return <Upload className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  if (options.length === 0) {
    return null;
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Personnalisation du Produit
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              {Object.keys(selections).length}/{options.length} options
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSelections}
              className="gap-1 text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Options panel */}
          <div className="lg:col-span-2 space-y-6">
            <TooltipProvider delayDuration={200}>
              {options.map((option, index) => (
                <div key={option.id}>
                  {index > 0 && <Separator />}
                  <div className="py-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="mt-0.5 p-2 rounded-lg bg-muted">
                        {getOptionIcon(option.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Label htmlFor={option.id} className="font-medium text-base">
                            {option.name}
                          </Label>
                          {option.required && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0">
                              Requis
                            </Badge>
                          )}
                        </div>
                        {option.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pl-11">{renderOptionInput(option)}</div>
                  </div>
                </div>
              ))}
            </TooltipProvider>
          </div>

          {/* Preview & Price Summary Panel */}
          {showPreview && (
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                {/* Visual Preview */}
                <div className="rounded-xl border bg-gray-50 overflow-hidden">
                  <div className="aspect-square relative">
                    {previewImageUrl ? (
                      <img
                        src={previewImageUrl}
                        alt="Aperçu du produit personnalisé"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Eye className="h-12 w-12 text-gray-300" />
                      </div>
                    )}

                    {/* Selection overlay indicators */}
                    {Object.entries(selections).some(([_, sel]) => sel.value) && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-white text-sm font-medium flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          Aperçu en direct
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Breakdown */}
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Récapitulatif du Prix
                    </h4>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prix de base</span>
                        <span>{formatCurrency(basePrice, currency)}</span>
                      </div>

                      {Object.entries(selections)
                        .filter(([_, sel]) => sel.priceModifier > 0)
                        .map(([optionId, sel]) => {
                          const option = options.find((o) => o.id === optionId);
                          return (
                            <div key={optionId} className="flex justify-between">
                              <span className="text-muted-foreground">
                                + {option?.name}
                              </span>
                              <span className="text-green-600">
                                +{formatCurrency(sel.priceModifier, currency)}
                              </span>
                            </div>
                          );
                        })}

                      <Separator />

                      <div className="flex justify-between font-bold text-base pt-1">
                        <span>Total</span>
                        <span className="text-primary">
                          {formatCurrency(totalPrice, currency)}
                        </span>
                      </div>
                    </div>

                    {totalPrice > basePrice && (
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Le prix final dépendra des options sélectionnées
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Export types
export type { ProductCustomizerProps };
