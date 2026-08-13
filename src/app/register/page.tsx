"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  Phone,
  MapPin,
  FileText,
} from "lucide-react";

const legalForms = [
  { value: "sarl", label: "SARL (Société à Responsabilité Limitée)" },
  { value: "eurl", label: "EURL (Entreprise Unipersonnelle)" },
  { value: "spa", label: "SPA (Société par Actions)" },
  { value: "snc", label: "SNC (Société en Nom Collectif)" },
  { value: "auto", label: "Auto-entrepreneur" },
];

const wilayas = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra",
  "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret",
  "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda",
  "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem",
  "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj",
  "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
  "Ghardaïa", "Relizane"
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "buyer";
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"buyer" | "supplier">(initialRole as "buyer" | "supplier");
  
  const [formData, setFormData] = useState({
    // Account Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    
    // Company Info (for suppliers)
    companyName: "",
    legalForm: "",
    rcNumber: "",
    nif: "",
    nis: "",
    wilaya: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Redirect to dashboard
    router.push("/dashboard");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-green-700 text-white font-bold text-2xl">
              AT
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Créer un Compte</h1>
          <p className="text-muted-foreground">
            Rejoignez la plus grande plateforme B2B d&apos;Algérie
          </p>
        </div>

        {/* Role Selection */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setRole("buyer")}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  role === "buyer"
                    ? "border-green-500 bg-green-50"
                    : "border-muted hover:border-gray-300"
                }`}
              >
                <User className={`h-8 w-8 mx-auto mb-2 ${role === "buyer" ? "text-green-600" : "text-muted-foreground"}`} />
                <h3 className="font-semibold">Je suis Acheteur</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Trouver des fournisseurs
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => setRole("supplier")}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  role === "supplier"
                    ? "border-green-500 bg-green-50"
                    : "border-muted hover:border-gray-300"
                }`}
              >
                <Building2 className={`h-8 w-8 mx-auto mb-2 ${role === "supplier" ? "text-green-600" : "text-muted-foreground"}`} />
                <h3 className="font-semibold">Je suis Fournisseur</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Vendre mes produits
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">1</span>
                Informations Personnelles
              </CardTitle>
              <CardDescription>Vos coordonnées de base</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    placeholder="Ahmed"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    placeholder="Benali"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ahmed@entreprise.dz"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+213 XX XX XX XX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de Passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le Mot de Passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Company Information (Suppliers Only) */}
          {role === "supplier" && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">2</span>
                  Informations Entreprise
                </CardTitle>
                <CardDescription>Données de votre société (nécessaire pour les fournisseurs)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l&apos;Entreprise *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      placeholder="Votre entreprise SARL"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="legalForm">Forme Juridique *</Label>
                    <Select value={formData.legalForm} onValueChange={(value) => setFormData({ ...formData, legalForm: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {legalForms.map((form) => (
                          <SelectItem key={form.value} value={form.value}>{form.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rcNumber">N° RC *</Label>
                    <Input
                      id="rcNumber"
                      placeholder="XX/XX-XXXXXXX/XX"
                      value={formData.rcNumber}
                      onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nif">NIF *</Label>
                    <Input
                      id="nif"
                      placeholder="000000000000000"
                      value={formData.nif}
                      onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nis">NIS</Label>
                    <Input
                      id="nis"
                      placeholder="0000"
                      value={formData.nis}
                      onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wilaya">Wilaya *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select value={formData.wilaya} onValueChange={(value) => setFormData({ ...formData, wilaya: value })}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {wilayas.map((wilaya) => (
                            <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    placeholder="Rue, Quartier, Commune..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description de l&apos;Entreprise</Label>
                  <textarea
                    id="description"
                    rows={3}
                    placeholder="Décrivez votre entreprise, vos produits, vos capacités..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms & Submit */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, acceptTerms: checked === true })
                  }
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                  J&apos;ai lu et j&apos;accepte les{" "}
                  <Link href="/terms" className="text-green-600 hover:underline">
                    Conditions d&apos;Utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link href="/privacy" className="text-green-600 hover:underline">
                    Politique de Confidentialité
                  </Link>{" "}
                  d&apos;AlgeriaTrade. *
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-base" 
                disabled={isLoading || !formData.acceptTerms}
              >
                {isLoading ? "Création du compte..." : `Créer mon Compte ${role === "supplier" ? "Fournisseur" : "Acheteur"}`}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground">
          Vous avez déjà un compte?{" "}
          <Link href="/login" className="text-green-600 font-medium hover:underline">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}
