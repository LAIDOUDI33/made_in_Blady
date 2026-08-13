"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  Upload,
  Calendar,
  MapPin,
  Package,
  DollarSign,
  Clock,
  Info,
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";

const categories = [
  "Agriculture & Alimentation",
  "Construction & BTP",
  "Équipement Industriel",
  "Énergie Solaire",
  "ICT & Télécoms",
  "Automobile",
  "Textiles",
  "Chimiques",
];

const units = ["Unités", "Kilogrammes", "Tonnes", "Mètres", "Mètres carrés", "Litres", "Kits"];

const wilayas = [
  "Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna", 
  "Sétif", "Sidi Bel Abbès", "Skikda", "Tlemcen"
];

export default function NewRFQPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    quantity: "",
    unit: "",
    targetPrice: "",
    currency: "DZD",
    deliveryLocation: "",
    deliveryWilaya: "",
    requiredDeliveryDate: "",
    paymentConditions: "",
    expirationDate: "",
    acceptTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    router.push("/rfqs");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au Tableau de Bord
            </Link>
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-600" />
              Nouvel Appel d&apos;Offre
            </h1>
            <p className="text-muted-foreground">
              Décrivez votre besoin et recevez des devis de fournisseurs algériens vérifiés.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informations de Base</CardTitle>
              <CardDescription>Décrivez clairement ce dont vous avez besoin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l&apos;Appel d&apos;Offre *</Label>
                <Input
                  id="title"
                  placeholder="Ex: 500 Panneaux solaires 550W pour projet agricole"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description Détaillée *</Label>
                <Textarea
                  id="description"
                  rows={5}
                  placeholder="Décrivez en détail votre besoin..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Ex: 500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unité *</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unité" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetPrice">Budget Cible</Label>
                  <Input
                    id="targetPrice"
                    type="number"
                    placeholder="Optionnel"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Livraison</CardTitle>
              <CardDescription>Informations sur la livraison souhaitée</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryWilaya">Wilaya *</Label>
                  <Select value={formData.deliveryWilaya} onValueChange={(value) => setFormData({ ...formData, deliveryWilaya: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {wilayas.map((wilaya) => (
                        <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requiredDeliveryDate">Date Souhaitée</Label>
                  <Input
                    id="requiredDeliveryDate"
                    type="date"
                    value={formData.requiredDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, requiredDeliveryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryLocation">Adresse (Optionnel)</Label>
                <Input
                  id="deliveryLocation"
                  placeholder="Adresse complète de livraison"
                  value={formData.deliveryLocation}
                  onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expirationDate">Expiration *</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentConditions">Conditions de Paiement</Label>
                  <Input
                    id="paymentConditions"
                    placeholder="Optionnel"
                    value={formData.paymentConditions}
                    onChange={(e) => setFormData({ ...formData, paymentConditions: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="mb-6 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 space-y-1">
                  <p className="font-medium">Conseils:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Soyez précis sur les spécifications techniques</li>
                    <li>Mentionnez les certifications requises si nécessaire</li>
                    <li>Un budget réaliste attire plus de réponses</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="rfq-terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, acceptTerms: checked === true })
                  }
                />
                <label htmlFor="rfq-terms" className="text-sm text-muted-foreground cursor-pointer">
                  Je confirme que cet appel d&apos;offre représente un besoin d&apos;achat réel.*
                </label>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 px-8"
                  disabled={isSubmitting || !formData.acceptTerms}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Publication...
                    </>
                  ) : (
                    <>
                      Publier l&apos;Appel d&apos;Offre
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
