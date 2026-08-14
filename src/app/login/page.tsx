"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTranslation, useLanguage } from "@/lib/i18n";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t, isRTL } = useTranslation();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Error messages map
  const errorMessages: Record<string, string> = {
    Configuration: t('auth.errors.configurationError') || "Erreur de configuration du serveur",
    AccessDenied: t('auth.errors.accessDenied') || "Accès refusé",
    Verification: t('auth.errors.verificationRequired') || "Vérification requise",
    Default: t('auth.errors.invalidCredentials') || "Email ou mot de passe incorrect",
    Signin: t('auth.errors.invalidCredentials') || "Email ou mot de passe incorrect",
    OAuthSignin: t('auth.errors.oauthError') || "Erreur lors de la connexion au fournisseur",
    OAuthCallback: t('auth.errors.oauthCallback') || "Erreur lors du retour du fournisseur",
    OAuthCreateAccount: t('auth.errors.oauthCreateAccount') || "Impossible de créer un compte avec ce fournisseur",
    EmailCreateAccount: t('auth.errors.emailCreateAccount') || "Impossible de créer un compte email",
    Callback: t('auth.errors.callbackError') || "Erreur lors de la connexion",
    OAuthAccountNotLinked: t('auth.errors.accountNotLinked') || "Ce compte est déjà lié à une autre méthode de connexion",
    SessionRequired: t('auth.errors.sessionRequired') || "Connexion requise",
  };

  // Check for error message from NextAuth
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const message = errorMessages[errorParam] || (t('auth.errors.serverError') || "Une erreur est survenue lors de la connexion");
      setError(message);
      toast({
        title: t('login.errorTitle') || 'Erreur de connexion',
        description: message,
        variant: "destructive",
      });
    }
    
    // Check for registered success
    const registered = searchParams.get("registered");
    if (registered === "true") {
      toast({
        title: t('auth.successTitle') || 'Compte créé !',
        description: t('auth.successMessage') || 'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.',
      });
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate form
      if (!formData.email || !formData.password) {
        throw new Error(t('validation.required') || "Veuillez remplir tous les champs");
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error(t('auth.errors.invalidEmail') || "Format d'email invalide");
      }

      // Attempt sign in with NextAuth
      const result = await signIn("credentials", {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        // Handle specific errors
        let errorMessage = result.error;
        
        if (result.error.includes("requis")) {
          errorMessage = t('auth.errors.credentialsRequired') || "Email et mot de passe requis";
        } else if (result.error.includes("trouvé")) {
          errorMessage = t('auth.errors.accountNotFound') || "Aucun compte trouvé avec cet email";
        } else if (result.error.includes("désactivé")) {
          errorMessage = t('auth.errors.accountDisabled') || "Ce compte a été désactivé. Contactez le support.";
        } else if (result.error.includes("incorrect")) {
          errorMessage = t('auth.errors.wrongPassword') || "Mot de passe incorrect";
        }
        
        throw new Error(errorMessage);
      }

      if (result?.ok) {
        // Get session to determine redirect based on role
        const session = await getSession();
        const role = session?.user?.role as string;
        
        // Role-based redirect
        const roleRedirects: Record<string, string> = {
          BUYER: "/dashboard/buyer",
          SUPPLIER: "/dashboard/seller",
          MODERATOR: "/admin",
          ADMIN: "/admin",
          SUPER_ADMIN: "/admin",
        };
        
        const redirectPath = role ? roleRedirects[role] : "/dashboard";
        
        toast({
          title: t('login.successTitle') || 'Connexion réussie',
          description: t('login.successMessage') || 'Bienvenue sur AlgeriaTrade !',
        });
        
        router.push(redirectPath);
        router.refresh();
      }
    } catch (err: any) {
      const errorMessage = err.message || (t('auth.errors.serverError') || "Une erreur est survenue");
      setError(errorMessage);
      toast({
        title: t('login.errorTitle') || 'Erreur de connexion',
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className={`w-full max-w-md space-y-6 relative z-10 ${isRTL ? 'rtl' : ''}`}>
        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#006233] to-[#004d28] text-white font-bold text-xl shadow-lg group-hover:shadow-xl transition-shadow">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-[#006233]">AlgeriaTrade</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.title') || 'Connexion'}</h1>
          <p className="text-gray-500 text-sm">
            {t('auth.subtitle') || "Accédez à votre espace professionnel AlgeriaTrade.dz"}
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Display */}
              {error && (
                <div className={`flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p className={`text-sm ${isRTL ? 'text-right' : ''}`}>{error}</p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className={`text-gray-700 font-medium ${isRTL ? 'block text-right' : ''}`}>
                  {t('auth.email') || 'Adresse Email'}
                </Label>
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-10'} h-11 border-gray-200 focus:border-[#006233] focus:ring-[#006233]/20`}
                    required
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Label htmlFor="password" className={`text-gray-700 font-medium ${isRTL ? '' : ''}`}>
                    {t('auth.password') || 'Mot de Passe'}
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-[#006233] hover:text-[#004d28] hover:underline transition-colors"
                  >
                    {t('auth.forgotPassword') || 'Mot de passe oublié ?'}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className={`${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} h-11 border-gray-200 focus:border-[#006233] focus:ring-[#006233]/20`}
                    required
                    disabled={isLoading}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors`}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className={`flex items-center space-x-2 ${isRTL ? 'flex-row-reverse space-x-reverse space-x-2' : ''}`}>
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, rememberMe: checked === true })
                  }
                  disabled={isLoading}
                  className="data-[state=checked]:bg-[#006233] data-[state=checked]:border-[#006233]"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-500 cursor-pointer select-none"
                >
                  {t('auth.rememberMe') || 'Se souvenir de moi'}
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-[#006233] hover:bg-[#004d28] text-white font-medium shadow-md hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                    {t('login.loading') || 'Connexion en cours...'}
                  </>
                ) : (
                  t('auth.loginBtn') || 'Se Connecter'
                )}
              </Button>
            </form>

            <Separator className="my-6" />

            {/* Demo Credentials Info */}
            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
              <p className={`text-xs text-gray-500 text-center mb-2 ${isRTL ? '' : ''}`}>
                {t('login.platformInfo') || 'Plateforme B2B pour le marché algérien'}
              </p>
              <div className={`grid grid-cols-2 gap-2 text-xs text-gray-600`}>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#006233]" />
                  {t('buyer.dashboard') || 'Acheteurs'}
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#D52B1E]" />
                  {t('seller.dashboard') || 'Fournisseurs'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Register Link */}
        <Card className="shadow-sm border-0 bg-white/60 backdrop-blur-sm">
          <CardContent className="py-4">
            <p className={`text-center text-sm text-gray-600 ${isRTL ? '' : ''}`}>
              {t('auth.noAccount') || 'Pas encore de compte ?'}{" "}
              <Link
                href="/register"
                className="text-[#006233] font-semibold hover:text-[#004d28] hover:underline transition-colors"
              >
                {t('auth.createAccount') || 'Inscrivez-vous gratuitement'}
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <p className="text-center">
          <Link
            href="/"
            className={`text-sm text-gray-400 hover:text-[#006233] transition-colors inline-flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {isRTL ? (
              <>
                {t('common.back') || 'Retour'} → {t('common.home') || 'accueil'}
              </>
            ) : (
              <>
                ← {t('common.back') || 'Retour'} {t('common.home') || 'à l\'accueil'}
              </>
            )}
          </Link>
        </p>
      </div>
    </div>
  );
}
