"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

// Algerian legal forms
const legalForms = [
  { value: "SARL", label: "SARL (Société à Responsabilité Limitée)" },
  { value: "EURL", label: "EURL (Entreprise Unipersonnelle à Responsabilité Limitée)" },
  { value: "SPA", label: "SPA (Société par Actions)" },
  { value: "SNC", label: "SNC (Société en Nom Collectif)" },
  { value: "SCS", label: "SCS (Société en Commandite Simple)" },
  { value: "auto", label: "Auto-entrepreneur" },
];

// All 58 Algerian wilayas with codes
const wilayas = [
  { code: "01", name: "Adrar", nameAr: "أدرار" },
  { code: "02", name: "Chlef", nameAr: "الشلف" },
  { code: "03", name: "Laghouat", nameAr: "الأغواط" },
  { code: "04", name: "Oum El Bouaghi", nameAr: "أم البواقي" },
  { code: "05", name: "Batna", nameAr: "باتنة" },
  { code: "06", name: "Béjaïa", nameAr: "بجاية" },
  { code: "07", name: "Biskra", nameAr: "بسكرة" },
  { code: "08", name: "Béchar", nameAr: "بشار" },
  { code: "09", name: "Blida", nameAr: "البليدة" },
  { code: "10", name: "Bouira", nameAr: "بويرة" },
  { code: "11", name: "Tamanrasset", nameAr: "تمنراست" },
  { code: "12", name: "Tébessa", nameAr: "تبسة" },
  { code: "13", name: "Tlemcen", nameAr: "تلمسان" },
  { code: "14", name: "Tiaret", nameAr: "تيارت" },
  { code: "15", name: "Tizi Ouzou", nameAr: "تيزي وزو" },
  { code: "16", name: "Alger", nameAr: "الجزائر" },
  { code: "17", name: "Djelfa", nameAr: "الجلفة" },
  { code: "18", name: "Jijel", nameAr: "جيجل" },
  { code: "19", name: "Sétif", nameAr: "سطيف" },
  { code: "20", name: "Saïda", nameAr: "سعيدة" },
  { code: "21", name: "Skikda", nameAr: "سكيكدة" },
  { code: "22", name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس" },
  { code: "23", name: "Annaba", nameAr: "عنابة" },
  { code: "24", name: "Guelma", nameAr: "قالمية" },
  { code: "25", name: "Constantine", nameAr: "قسنطينة" },
  { code: "26", name: "Médéa", nameAr: "المدية" },
  { code: "27", name: "Mostaganem", nameAr: "مستغانم" },
  { code: "28", name: "M'Sila", nameAr: "المسيلة" },
  { code: "29", name: "Mascara", nameAr: "مascar" },
  { code: "30", name: "Ouargla", nameAr: "ورقلة" },
  { code: "31", name: "Oran", nameAr: "وهران" },
  { code: "32", name: "El Bayadh", nameAr: "البيض" },
  { code: "33", name: "Illizi", nameAr: "إيليزي" },
  { code: "34", name: "Bordj Bou Arréridj", nameAr: "برج بوعريريج" },
  { code: "35", name: "Boumerdès", nameAr: "بومرداس" },
  { code: "36", name: "El Tarf", nameAr: "الطارف" },
  { code: "37", name: "Tindouf", nameAr: "تندوف" },
  { code: "38", name: "Tissemsilt", nameAr: "تيسمسيلت" },
  { code: "39", name: "El Oued", nameAr: "الوادي" },
  { code: "40", name: "Khenchela", nameAr: "خنشلة" },
  { code: "41", name: "Souk Ahras", nameAr: "سوق أهراس" },
  { code: "42", name: "Tipaza", nameAr: "تيبازة" },
  { code: "43", name: "Mila", nameAr: "ميلة" },
  { code: "44", name: "Aïn Defla", nameAr: "عين الدفلى" },
  { code: "45", name: "Naâma", nameAr: "النعامة" },
  { code: "46", name: "Aïn Témouchent", nameAr: "عين تموشنت" },
  { code: "47", name: "Ghardaïa", nameAr: "غرداية" },
  { code: "48", name: "Relizane", nameAr: "غليزان" },
  { code: "49", name: "El M'Ghair", nameAr: "المغير" },
  { code: "50", name: "El Meniaa", nameAr: "المنيعة" },
  { code: "51", name: "Ouled Djellal", nameAr: "اولاد جلال" },
  { code: "52", name: "Bordj Baji Mokhtar", nameAr: "برج باجي مختار" },
  { code: "53", name: "Béni Abbès", nameAr: "بني عباس" },
  { code: "54", name: "Timimoun", nameAr: "تيميمون" },
  { code: "55", name: "Touggourt", nameAr: "تقرت" },
  { code: "56", name: "Djanet", nameAr: "جانيت" },
  { code: "57", name: "In Salah", nameAr: "إن سلام" },
  { code: "58", name: "In Guezzam", nameAr: "ان قزام" },
];

interface FormErrors {
  [key: string]: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const initialRole = searchParams.get("role") || "buyer";
  
  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"BUYER" | "SUPPLIER">(initialRole.toUpperCase() as "BUYER" | "SUPPLIER");
  const [errors, setErrors] = useState<FormErrors>({});
  
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

  // Validate step 1 fields
  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.firstName.trim() || formData.firstName.length < 2) {
      newErrors.firstName = "Le prénom doit contenir au moins 2 caractères";
    }
    
    if (!formData.lastName.trim() || formData.lastName.length < 2) {
      newErrors.lastName = "Le nom doit contenir au moins 2 caractères";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Le téléphone est requis";
    } else {
      const cleanPhone = formData.phone.replace(/\s/g, "");
      if (!/^(\+213|0)[5-7]\d{8}$/.test(cleanPhone)) {
        newErrors.phone = "Format algérien requis (+213 ou 0 suivi de 9 chiffres)";
      }
    }
    
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Minimum 8 caractères";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Au moins une majuscule requise";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Au moins un chiffre requis";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate company fields for suppliers
  const validateCompanyFields = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Le nom de l'entreprise est requis";
    }
    
    if (!formData.legalForm) {
      newErrors.legalForm = "La forme juridique est requise";
    }
    
    if (!formData.rcNumber.trim()) {
      newErrors.rcNumber = "Le numéro RC est requis";
    } else if (!/^\d{2}\/\d{2}-\d{7}\/\d{2}$/.test(formData.rcNumber)) {
      newErrors.rcNumber = "Format: XX/XX-XXXXXXX/XX";
    }
    
    if (!formData.nif.trim()) {
      newErrors.nif = "Le NIF est requis";
    } else if (!/^\d{15}$/.test(formData.nif)) {
      newErrors.nif = "15 chiffres requis";
    }
    
    if (formData.nis && !/^\d{10}$/.test(formData.nis)) {
      newErrors.nis = "10 chiffres requis";
    }
    
    if (!formData.wilaya) {
      newErrors.wilaya = "La wilaya est requise";
    }
    
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    let isValid = validateStep1();
    if (role === "SUPPLIER") {
      isValid = isValid && validateCompanyFields();
    }
    
    if (!formData.acceptTerms) {
      toast({
        title: "Conditions requises",
        description: "Vous devez accepter les conditions d'utilisation",
        variant: "destructive",
      });
      return;
    }
    
    if (!isValid) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role,
        ...(role === "SUPPLIER" && {
          companyName: formData.companyName,
          legalForm: formData.legalForm,
          rcNumber: formData.rcNumber,
          nif: formData.nif,
          nis: formData.nis,
          wilaya: formData.wilaya,
          address: formData.address,
          description: formData.description,
        }),
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (data.details && Array.isArray(data.details)) {
          const serverErrors: FormErrors = {};
          data.details.forEach((err: string) => {
            if (err.includes("prénom")) serverErrors.firstName = err;
            else if (err.includes("nom")) serverErrors.lastName = err;
            else if (err.includes("email")) serverErrors.email = err;
            else if (err.includes("téléphone")) serverErrors.phone = err;
            else if (err.includes("mot de passe")) serverErrors.password = err;
            else if (err.includes("entreprise")) serverErrors.companyName = err;
            else if (err.includes("juridique")) serverErrors.legalForm = err;
            else if (err.includes("RC")) serverErrors.rcNumber = err;
            else if (err.includes("NIF")) serverErrors.nif = err;
            else if (err.includes("NIS")) serverErrors.nis = err;
            else if (err.includes("wilaya")) serverErrors.wilaya = err;
          });
          setErrors(serverErrors);
        }
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      toast({
        title: "Compte créé avec succès !",
        description: "Bienvenue sur AlgeriaTrade.dz. Vous pouvez maintenant vous connecter.",
      });

      // Redirect to login page with success message
      router.push("/login?registered=true");
    } catch (err: any) {
      const errorMessage = err.message || "Une erreur est survenue";
      
      if (!Object.keys(errors).length) {
        toast({
          title: "Erreur d'inscription",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string): { strength: number; text: string; color: string } => {
    if (!password) return { strength: 0, text: "", color: "" };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { strength: 25, text: "Faible", color: "bg-red-500" };
    if (score <= 4) return { strength: 50, text: "Moyen", color: "bg-yellow-500" };
    if (score <= 5) return { strength: 75, text: "Bon", color: "bg-green-400" };
    return { strength: 100, text: "Excellent", color: "bg-green-600" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8 px-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#006233] to-[#004d28] text-white font-bold text-lg shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-[#006233]">AlgeriaTrade</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Créer un Compte</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Rejoignez la plus grande plateforme B2B d&apos;Algérie et développez votre activité
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
              step >= 1 ? 'bg-[#006233] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </div>
            <div className={`w-16 sm:w-24 h-1 rounded ${step >= 2 ? 'bg-[#006233]' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
              step >= 2 ? 'bg-[#006233] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            {role === "SUPPLIER" && (
              <>
                <div className={`w-16 sm:w-24 h-1 rounded ${step >= 3 ? 'bg-[#006233]' : 'bg-gray-200'}`} />
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
                  step >= 3 ? 'bg-[#006233] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </div>
              </>
            )}
          </div>
        </div>

        {/* Role Selection Card */}
        <Card className="mb-6 shadow-md border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-gray-500 mb-4">Je souhaite m&apos;inscrire en tant que :</p>
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              <button
                type="button"
                onClick={() => setRole("BUYER")}
                className={`p-4 rounded-xl border-2 text-center transition-all group ${
                  role === "BUYER"
                    ? "border-[#006233] bg-green-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <User className={`h-10 w-10 mx-auto mb-2 transition-colors ${
                  role === "BUYER" ? "text-[#006233]" : "text-gray-400 group-hover:text-gray-600"
                }`} />
                <h3 className="font-semibold text-gray-900">Acheteur</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Trouver des fournisseurs et produits
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => setRole("SUPPLIER")}
                className={`p-4 rounded-xl border-2 text-center transition-all group ${
                  role === "SUPPLIER"
                    ? "border-[#006233] bg-green-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Building2 className={`h-10 w-10 mx-auto mb-2 transition-colors ${
                  role === "SUPPLIER" ? "text-[#006233]" : "text-gray-400 group-hover:text-gray-600"
                }`} />
                <h3 className="font-semibold text-gray-900">Fournisseur</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Vendre mes produits et services
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          <Card className={`mb-6 shadow-md border-0 bg-white/90 backdrop-blur-sm transition-all ${step !== 1 ? 'opacity-60' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step > 1 ? 'bg-[#006233] text-white' : 'bg-[#006233] text-white'
                }`}>
                  {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </span>
                Informations Personnelles
              </CardTitle>
              <CardDescription>Vos coordonnées de base</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700">Prénom *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      placeholder="Ahmed"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value });
                        if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
                      }}
                      className={`pl-10 h-11 ${errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#006233]'}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700">Nom *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName"
                      placeholder="Benali"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value });
                        if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
                      }}
                      className={`pl-10 h-11 ${errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#006233]'}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Adresse Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ahmed@entreprise.dz"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      className={`pl-10 h-11 ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#006233]'}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">Téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+213 5XX XX XX XX"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      className={`pl-10 h-11 ${errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#006233]'}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">Mot de Passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                      }}
                      className={`pl-10 pr-10 h-11 ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#006233]'}`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${passwordStrength.strength}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Force du mot de passe: <span className={`font-medium ${
                          passwordStrength.strength <= 25 ? 'text-red-500' :
                          passwordStrength.strength <= 50 ? 'text-yellow-600' :
                          passwordStrength.strength <= 75 ? 'text-green-500' : 'text-green-600'
                        }`}>{passwordStrength.text}</span>
                      </p>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700">Confirmer le Mot de Passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      className={`pl-10 h-11 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#006233]'}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Step Navigation */}
              {step === 1 && (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-11 bg-[#006233] hover:bg-[#004d28] text-white font-medium mt-4"
                >
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              {step > 1 && (
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="mt-4"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Company Information (Suppliers Only) */}
          {role === "SUPPLIER" && (
            <Card className={`mb-6 shadow-md border-0 bg-white/90 backdrop-blur-sm transition-all ${step !== 2 ? 'opacity-60' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step > 2 ? 'bg-[#006233] text-white' : 'bg-[#006233] text-white'
                  }`}>
                    2
                  </span>
                  Informations Entreprise
                </CardTitle>
                <CardDescription>Données légales de votre société</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-gray-700">Nom de l&apos;Entreprise *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="companyName"
                      placeholder="Ex: SARL AlgeriaTrade Solutions"
                      value={formData.companyName}
                      onChange={(e) => {
                        setFormData({ ...formData, companyName: e.target.value });
                        if (errors.companyName) setErrors(prev => ({ ...prev, companyName: '' }));
                      }}
                      className={`pl-10 h-11 ${errors.companyName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#006233]'}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.companyName && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.companyName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="legalForm" className="text-gray-700">Forme Juridique *</Label>
                    <Select 
                      value={formData.legalForm} 
                      onValueChange={(value) => {
                        setFormData({ ...formData, legalForm: value });
                        if (errors.legalForm) setErrors(prev => ({ ...prev, legalForm: '' }));
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={`h-11 ${errors.legalForm ? 'border-red-300' : 'border-gray-200 focus:border-[#006233]'}`}>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {legalForms.map((form) => (
                          <SelectItem key={form.value} value={form.value}>
                            {form.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.legalForm && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.legalForm}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rcNumber" className="text-gray-700">N° RC *</Label>
                    <Input
                      id="rcNumber"
                      placeholder="XX/XX-XXXXXXX/XX"
                      value={formData.rcNumber}
                      onChange={(e) => {
                        setFormData({ ...formData, rcNumber: e.target.value.toUpperCase() });
                        if (errors.rcNumber) setErrors(prev => ({ ...prev, rcNumber: '' }));
                      }}
                      className={`h-11 ${errors.rcNumber ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#006233]'}`}
                      disabled={isLoading}
                    />
                    {errors.rcNumber && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.rcNumber}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nif" className="text-gray-700">NIF *</Label>
                    <Input
                      id="nif"
                      placeholder="15 chiffres"
                      value={formData.nif}
                      onChange={(e) => {
                        setFormData({ ...formData, nif: e.target.value.replace(/\D/g, '').slice(0, 15) });
                        if (errors.nif) setErrors(prev => ({ ...prev, nif: '' }));
                      }}
                      className={`h-11 ${errors.nif ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#006233]'}`}
                      disabled={isLoading}
                      maxLength={15}
                    />
                    {errors.nif && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.nif}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nis" className="text-gray-700">NIS</Label>
                    <Input
                      id="nis"
                      placeholder="10 chiffres (optionnel)"
                      value={formData.nis}
                      onChange={(e) => {
                        setFormData({ ...formData, nis: e.target.value.replace(/\D/g, '').slice(0, 10) });
                        if (errors.nis) setErrors(prev => ({ ...prev, nis: '' }));
                      }}
                      className={`h-11 ${errors.nis ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#006233]'}`}
                      disabled={isLoading}
                      maxLength={10}
                    />
                    {errors.nis && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.nis}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wilaya" className="text-gray-700">Wilaya *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                      <Select 
                        value={formData.wilaya} 
                        onValueChange={(value) => {
                          setFormData({ ...formData, wilaya: value });
                          if (errors.wilaya) setErrors(prev => ({ ...prev, wilaya: '' }));
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger className={`pl-10 h-11 ${errors.wilaya ? 'border-red-300' : 'border-gray-200 focus:border-[#006233]'}`}>
                          <SelectValue placeholder="Sélectionner la wilaya" />
                        </SelectTrigger>
                        <SelectContent>
                          {wilayas.map((w) => (
                            <SelectItem key={w.code} value={w.name}>
                              {w.code} - {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.wilaya && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.wilaya}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-700">Adresse</Label>
                  <Input
                    id="address"
                    placeholder="Rue, Quartier, Commune..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-11 border-gray-200 focus:border-[#006233]"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-700">Description de l&apos;Entreprise</Label>
                  <textarea
                    id="description"
                    rows={3}
                    placeholder="Décrivez votre entreprise, vos produits, vos capacités de production..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-md border border-gray-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006233]/20 focus:border-[#006233] resize-none"
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms & Submit Section */}
          <Card className="mb-6 shadow-md border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, acceptTerms: checked === true })
                  }
                  disabled={isLoading}
                  className="data-[state=checked]:bg-[#006233] data-[state=checked]:border-[#006233] mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                  J&apos;ai lu et j&apos;accepte les{" "}
                  <Link href="/terms" className="text-[#006233] hover:underline font-medium">
                    Conditions Générales d&apos;Utilisation
                  </Link>
                  , la{" "}
                  <Link href="/privacy" className="text-[#006233] hover:underline font-medium">
                    Politique de Confidentialité
                  </Link>
                  {" "}et les{" "}
                  <Link href="/cgv" className="text-[#006233] hover:underline font-medium">
                    CGV
                  </Link>
                  {" "}de la plateforme AlgeriaTrade.dz. *
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#006233] hover:bg-[#004d28] text-white font-semibold text-base shadow-md hover:shadow-lg transition-all"
                disabled={isLoading || !formData.acceptTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  <>
                    Créer mon Compte {role === "SUPPLIER" ? "Fournisseur" : "Acheteur"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-gray-400">
                En créant un compte, vous acceptez de recevoir des communications de notre part
              </p>
            </CardContent>
          </Card>
        </form>

        {/* Login Link */}
        <Card className="shadow-sm border-0 bg-white/60 backdrop-blur-sm">
          <CardContent className="py-4">
            <p className="text-center text-sm text-gray-600">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/login"
                className="text-[#006233] font-semibold hover:text-[#004d28] hover:underline transition-colors"
              >
                Connectez-vous ici
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <p className="text-center mt-4">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-[#006233] transition-colors inline-flex items-center gap-1"
          >
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
