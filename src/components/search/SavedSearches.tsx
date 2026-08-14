"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bookmark,
  Trash2,
  Bell,
  BellOff,
  Clock,
  Search,
  Mail,
  CheckCircle,
  X,
  Edit3,
  ExternalLink,
} from "lucide-react";

// ============================================
// Types
// ============================================

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters?: Record<string, any>;
  alertFrequency?: "none" | "daily" | "weekly";
  email?: string;
  createdAt: string;
  lastTriggeredAt?: string;
  newResultsCount?: number;
}

interface SavedSearchesProps {
  currentQuery?: string;
  currentFilters?: Record<string, any>;
  onApplySavedSearch?: (search: SavedSearch) => void;
  compact?: boolean;
  showInDashboard?: boolean;
}

// ============================================
// Local Storage Keys
// ============================================

const SAVED_SEARCHES_KEY = "algeriatrade_saved_searches";
const MAX_SAVED_SEARCHES = 20;

// ============================================
// Helper Functions
// ============================================

function loadSavedSearches(): SavedSearch[] {
  try {
    const saved = localStorage.getItem(SAVED_SEARCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveSavedSearches(searches: SavedSearch[]) {
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
  } catch (error) {
    console.error("Error saving searches:", error);
  }
}

function generateId(): string {
  return `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatFiltersSummary(filters?: Record<string, any>): string {
  if (!filters || Object.keys(filters).length === 0) return "";
  
  const parts: string[] = [];
  
  if (filters.categories?.length > 0) parts.push(`${filters.categories.length} catégories`);
  if (filters.wilayas?.length > 0) parts.push(`${filters.wilayas.length} wilayas`);
  if (filters.minPrice > 0 || filters.maxPrice < 10000000) parts.push("Prix");
  if (filters.verifiedOnly) parts.push("Vérifiés");
  if (filters.availability?.length > 0) parts.push(`${filters.availability.length} disponibilités`);
  
  return parts.length > 0 ? parts.join(" • ") : "";
}

// ============================================
// Main Component
// ============================================

export function SavedSearches({
  currentQuery = "",
  currentFilters,
  onApplySavedSearch,
  compact = false,
  showInDashboard = false,
}: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [alertFrequency, setAlertFrequency] = useState<"none" | "daily" | "weekly">("none");
  const [alertEmail, setAlertEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load saved searches on mount
  useEffect(() => {
    setSavedSearches(loadSavedSearches());
  }, []);

  // Set default name based on query
  useEffect(() => {
    if (currentQuery && isSaveDialogOpen && !editingId) {
      setSaveName(currentQuery.slice(0, 50));
    }
  }, [currentQuery, isSaveDialogOpen, editingId]);

  // Save current search
  const handleSaveSearch = useCallback(() => {
    if (!saveName.trim() && !currentQuery) return;

    const newSearch: SavedSearch = {
      id: editingId || generateId(),
      name: saveName.trim() || currentQuery.slice(0, 50),
      query: currentQuery,
      filters: currentFilters,
      alertFrequency,
      email: alertFrequency !== "none" ? alertEmail : undefined,
      createdAt: editingId 
        ? savedSearches.find(s => s.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    let updated: SavedSearch[];
    
    if (editingId) {
      updated = savedSearches.map((s) => s.id === editingId ? newSearch : s);
    } else {
      if (savedSearches.length >= MAX_SAVED_SEARCHES) {
        // Remove oldest search
        updated = [...savedSearches.slice(0, MAX_SAVED_SEARCHES - 1), newSearch];
      } else {
        updated = [...savedSearches, newSearch];
      }
    }

    setSavedSearches(updated);
    saveSavedSearches(updated);

    // Reset form
    setIsSaveDialogOpen(false);
    setSaveName("");
    setAlertFrequency("none");
    setAlertEmail("");
    setEditingId(null);
  }, [saveName, currentQuery, currentFilters, alertFrequency, alertEmail, editingId, savedSearches]);

  // Delete saved search
  const handleDeleteSearch = useCallback((id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    saveSavedSearches(updated);
  }, [savedSearches]);

  // Update alert settings
  const handleUpdateAlert = useCallback((id: string, frequency: "none" | "daily" | "weekly", email?: string) => {
    const updated = savedSearches.map((s) =>
      s.id === id
        ? { ...s, alertFrequency: frequency, email: frequency !== "none" ? email || s.email : undefined }
        : s
    );
    setSavedSearches(updated);
    saveSavedSearches(updated);
  }, [savedSearches]);

  // Apply saved search
  const handleApplySearch = useCallback((search: SavedSearch) => {
    if (onApplySavedSearch) {
      onApplySavedSearch(search);
    }
  }, [onApplySavedSearch]);

  // Start editing a saved search
  const handleEditSearch = useCallback((search: SavedSearch) => {
    setEditingId(search.id);
    setSaveName(search.name);
    setAlertFrequency(search.alertFrequency || "none");
    setAlertEmail(search.email || "");
    setIsSaveDialogOpen(true);
  }, []);

  // Check if current search is already saved
  const isCurrentSearchSaved = savedSearches.some(
    (s) => s.query === currentQuery && JSON.stringify(s.filters) === JSON.stringify(currentFilters)
  );

  // Compact mode - just show save button and count
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`gap-2 ${isCurrentSearchSaved ? "text-green-600 border-green-200 bg-green-50" : ""}`}
            >
              <Bookmark className={`h-4 w-4 ${isCurrentSearchSaved ? "fill-green-600" : ""}`} />
              {isCurrentSearchSaved ? "Sauvegardé" : "Sauvegarder"}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sauvegarder la recherche</DialogTitle>
              <DialogDescription>
                Donnez un nom à cette recherche pour la retrouver facilement plus tard.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Search Name */}
              <div className="space-y-2">
                <Label htmlFor="search-name">Nom de la recherche *</Label>
                <Input
                  id="search-name"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Ex: Panneaux solaires Alger"
                  maxLength={100}
                />
              </div>

              {/* Current Query Preview */}
              {currentQuery && (
                <div className="p-2 bg-muted rounded-md text-sm">
                  <span className="text-muted-foreground">Recherche:</span>{" "}
                  <span className="font-medium">{currentQuery}</span>
                </div>
              )}

              {/* Alert Settings */}
              <div className="space-y-3 border-t pt-4">
                <Label className="flex items-center gap-2 font-medium">
                  <Bell className="h-4 w-4" />
                  Alerte Email (optionnel)
                </Label>
                
                <Select value={alertFrequency} onValueChange={(val) => setAlertFrequency(val as typeof alertFrequency)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fréquence d'alerte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pas d'alerte</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>

                {alertFrequency !== "none" && (
                  <div className="space-y-2">
                    <Label htmlFor="alert-email">Email pour les alertes</Label>
                    <Input
                      id="alert-email"
                      type="email"
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                      placeholder="votre@email.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Vous recevrez un email {alertFrequency === "daily" ? "chaque jour" : "chaque semaine"} 
                      avec les nouveaux résultats.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveSearch} disabled={!saveName.trim() && !currentQuery}>
                <Bookmark className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {savedSearches.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {savedSearches.length} sauvegardée{savedSearches.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>
    );
  }

  // Dashboard/Full view mode
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-yellow-500" />
            Recherches Sauvegardées
            {savedSearches.length > 0 && (
              <Badge variant="secondary">{savedSearches.length}</Badge>
            )}
          </CardTitle>
          
          {!showInDashboard && (
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!currentQuery}>
                  <Bookmark className="h-4 w-4 mr-1" />
                  Sauvegarder actuelle
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Modifier la recherche" : "Sauvegarder la recherche"}</DialogTitle>
                  <DialogDescription>
                    {editingId 
                      ? "Modifiez les paramètres de votre recherche sauvegardée."
                      : "Donnez un nom à cette recherche pour la retrouver facilement."
                    }
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="dash-search-name">Nom de la recherche *</Label>
                    <Input
                      id="dash-search-name"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="Ex: Panneaux solaires Alger"
                      maxLength={100}
                    />
                  </div>

                  {currentQuery && !editingId && (
                    <div className="p-2 bg-muted rounded-md text-sm">
                      <span className="text-muted-foreground">Recherche:</span>{" "}
                      <span className="font-medium">{currentQuery}</span>
                    </div>
                  )}

                  <div className="space-y-3 border-t pt-4">
                    <Label className="flex items-center gap-2 font-medium">
                      <Bell className="h-4 w-4" />
                      Alerte Email
                    </Label>
                    
                    <Select value={alertFrequency} onValueChange={(val) => setAlertFrequency(val as typeof alertFrequency)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Pas d'alerte</SelectItem>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      </SelectContent>
                    </Select>

                    {alertFrequency !== "none" && (
                      <div className="space-y-2">
                        <Label htmlFor="dash-alert-email">Email pour les alertes</Label>
                        <Input
                          id="dash-alert-email"
                          type="email"
                          value={alertEmail}
                          onChange={(e) => setAlertEmail(e.target.value)}
                          placeholder="votre@email.com"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsSaveDialogOpen(false);
                    setEditingId(null);
                  }}>
                    Annuler
                  </Button>
                  <Button onClick={handleSaveSearch} disabled={!saveName.trim() && !currentQuery}>
                    <Bookmark className="h-4 w-4 mr-2" />
                    {editingId ? "Mettre à jour" : "Sauvegarder"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {savedSearches.length === 0 ? (
          /* Empty State */
          <div className="text-center py-8">
            <Bookmark className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mb-4">
              Aucune recherche sauvegardée
            </p>
            <p className="text-xs text-muted-foreground">
              Sauvez vos recherches favorites pour y accéder rapidement et recevoir des alertes.
            </p>
          </div>
        ) : (
          /* Saved Searches List */
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="p-3 rounded-lg border hover:border-green-200 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{search.name}</span>
                    </div>
                    
                    {search.query && (
                      <p className="text-sm text-muted-foreground truncate pl-6">
                        &quot;{search.query}&quot;
                      </p>
                    )}

                    {formatFiltersSummary(search.filters) && (
                      <p className="text-xs text-muted-foreground mt-1 pl-6">
                        {formatFiltersSummary(search.filters)}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 pl-6">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(search.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>

                      {search.alertFrequency && search.alertFrequency !== "none" && (
                        <Badge variant="secondary" className="text-xs h-5 gap-1">
                          <Mail className="h-3 w-3" />
                          {search.alertFrequency === "daily" ? "Quotidien" : "Hebdo"}
                        </Badge>
                      )}

                      {search.newResultsCount !== undefined && search.newResultsCount > 0 && (
                        <Badge className="bg-green-100 text-green-700 text-xs h-5">
                          {search.newResultsCount} nouveaux
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onApplySavedSearch && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApplySearch(search)}
                        title="Appliquer cette recherche"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSearch(search)}
                      title="Modifier"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>

                    {/* Alert Toggle */}
                    {search.alertFrequency && search.alertFrequency !== "none" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateAlert(search.id, "none")}
                        title="Désactiver l'alerte"
                        className="text-green-600"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateAlert(search.id, "daily")}
                        title="Activer l'alerte quotidienne"
                      >
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSearch(search.id)}
                      title="Supprimer"
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clear All */}
        {savedSearches.length > 0 && (
          <div className="mt-4 pt-3 border-t flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSavedSearches([]);
                saveSavedSearches([]);
              }}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Tout supprimer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SavedSearches;
