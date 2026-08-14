'use client'

import React from 'react'
import Link from 'next/link'
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  Landmark, 
  Banknote,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const paymentMethods = [
  {
    id: 'cib',
    name: 'Carte Bancaire (CIB)',
    description: 'Paiement par Visa ou Mastercard via le réseau interbancaire algérien',
    icon: CreditCard,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    features: ['Paiement instantané', '3D Secure', 'Visa & Mastercard', 'Cryptage SSL'],
    processingTime: 'Immédiat',
    popular: true,
  },
  {
    id: 'ccp',
    name: 'Chèque Postale (CCP)',
    description: 'Virement depuis votre compte postal algérien (Algérie Poste)',
    icon: Building2,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    features: ['Compte CCP', 'Référence unique', 'Preuve de virement', '1-2 jours'],
    processingTime: '1-2 jours',
    popular: false,
  },
  {
    id: 'baridimob',
    name: 'BaridiMob',
    description: 'Paiement mobile instantané via Algérie Poste - Le futur du paiement en Algérie',
    icon: Smartphone,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    features: ['Mobile Money', 'OTP sécurisé', 'Instantané', '24/7'],
    processingTime: 'Immédiat',
    popular: true,
  },
  {
    id: 'bank-transfer',
    name: 'Virement Bancaire',
    description: 'Virement direct vers notre compte bancaire (BNA, BEA, CPA, etc.)',
    icon: Landmark,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    features: ['6 banques algériennes', 'RIB sécurisé', 'Reçu numérique', '1-3 jours'],
    processingTime: '1-3 jours',
    popular: false,
  },
  {
    id: 'cod',
    name: 'Paiement à la Livraison',
    description: 'Payez en espèces directement à la réception de votre commande',
    icon: Banknote,
    color: 'from-gray-600 to-gray-700',
    bgColor: 'bg-gray-50',
    features: ['Espèces uniquement', 'Wilayas couvertes', 'Frais fixes', 'Sur place'],
    processingTime: 'À la livraison',
    popular: false,
  },
]

const securityFeatures = [
  {
    icon: <Lock className="h-6 w-6" />,
    title: 'Cryptage SSL 256-bit',
    description: 'Toutes vos données sont protégées par un cryptage de niveau bancaire',
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: 'Conformité PCI-DSS',
    description: 'Respect des normes internationales de sécurité des paiements',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Traitement Rapide',
    description: 'Validation instantanée pour les paiements électroniques',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Support Local',
    description: 'Équipe support basée en Algérie, disponible en français et arabe',
  },
]

const algerianBanks = [
  { code: 'BNA', name: "Banque Nationale d'Algérie" },
  { code: 'BEA', name: "Banque Extérieure d'Algérie" },
  { code: 'CPA', name: "Crédit Populaire d'Algérie" },
  { code: 'BDL', name: 'Banque de Développement Local' },
  { code: 'BADR', name: "Banque de l'Agriculture et du Développement Rural" },
  { code: 'SGA', name: 'Société Générale Algérie' },
]

export default function PaymentShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#006233] via-[#004d28] to-[#003d20] text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <span className="inline-block mb-6 px-4 py-1.5 bg-white/10 text-white border border-white/20 rounded-full text-sm font-medium">
              ✨ Système de Paiement Intégré
            </span>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Paiements Sécurisés pour{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-400">
                le Marché Algérien
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Acceptez tous les modes de paiement locaux : CIB, CCP, BaridiMob, Virement Bancaire. 
              Une solution complète adaptée aux besoins B2B en Algérie.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/checkout">
                <Button size="lg" className="bg-white text-[#006233] hover:bg-gray-100 font-semibold px-8 py-6 text-lg">
                  Essayer la Démo de Paiement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/admin/payments">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg">
                  Panneau Admin
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-sm text-white/60">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                SSL Sécurisé
              </span>
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Données Protégées
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                RGPD Conforme
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Toutes les Méthodes de Paiement Algériennes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nous acceptons tous les moyens de paiement utilisés en Algérie, 
              pour faciliter vos transactions B2B.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentMethods.map((method) => (
              <Card 
                key={method.id} 
                className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                  method.popular && "ring-2 ring-[#006233] shadow-lg"
                )}
              >
                {method.popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1 bg-[#006233] text-white text-xs font-semibold rounded-full">
                      Populaire
                    </span>
                  </div>
                )}

                <CardHeader className={cn("pb-4", method.bgColor)}>
                  <div className={cn(
                    "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center",
                    method.color
                  )}>
                    <method.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl mt-4">{method.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Processing Time */}
                  <div className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                    method.bgColor
                  )}>
                    <Zap className="h-3 w-3 mr-1" />
                    {method.processingTime}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2">
                    {method.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sécurité au Cœur du Système
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              La protection de vos transactions est notre priorité absolue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityFeatures.map((feature, idx) => (
              <Card key={idx} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#006233]/20 flex items-center justify-center mx-auto text-[#006233]">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Algerian Banks Supported */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Banques Algériennes Supportées
            </h2>
            <p className="text-gray-600">
              Notre système est compatible avec toutes les principales banques algériennes
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {algerianBanks.map((bank) => (
              <div 
                key={bank.code}
                className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-[#006233] hover:shadow-md transition-all"
              >
                <Landmark className="h-8 w-8 text-[#006233] mb-2" />
                <span className="font-semibold text-sm text-center">{bank.code}</span>
                <span className="text-xs text-gray-500 text-center mt-1">{bank.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment Ça Marche
            </h2>
            <p className="text-lg text-gray-600">
              Un processus simple et transparent en quelques étapes
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-[#006233]/20" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  step: '1',
                  title: 'Choisissez votre commande',
                  description: 'Sélectionnez les produits et passez commande sur AlgeriaTrade.dz',
                },
                {
                  step: '2',
                  title: 'Sélectionnez le paiement',
                  description: 'Choisissez parmi nos méthodes de paiement locales',
                },
                {
                  step: '3',
                  title: 'Effectuez le paiement',
                  description: 'Complétez le paiement selon la méthode choisie',
                },
                {
                  step: '4',
                  title: 'Confirmez et recevez',
                  description: 'Recevez votre confirmation et suivez votre commande',
                },
              ].map((item, idx) => (
                <div key={idx} className="relative text-center">
                  <div className="w-12 h-12 rounded-full bg-[#006233] text-white flex items-center justify-center text-xl font-bold mx-auto mb-4 relative z-10">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#006233] to-[#004d28] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à Tester le Système de Paiement ?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Explorez notre démo complète avec toutes les fonctionnalités de paiement intégrées.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/checkout">
              <Button size="lg" className="bg-white text-[#006233] hover:bg-gray-100 font-semibold px-8 py-6 text-lg">
                Accéder à la Page de Paiement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Link href="/admin/payments">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg">
                Voir le Panneau Admin
              </Button>
            </Link>
          </div>

          {/* Demo Info */}
          <div className="mt-12 p-6 bg-white/10 rounded-xl inline-block">
            <p className="text-sm text-white/70">
              💡 <strong>Mode Démo:</strong> Aucune transaction réelle ne sera effectuée. 
              Tous les paiements sont simulés à des fins de démonstration.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-100 border-t">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>
            © 2024 AlgeriaTrade.dz - Plateforme B2B Algérienne |{' '}
            <Link href="/checkout" className="text-[#006233] hover:underline">Démo Paiement</Link>{' '}
            |{' '}
            <Link href="/admin/payments" className="text-[#006233] hover:underline">Admin</Link>
          </p>
          <p className="mt-2">
            Système de paiement intégré • CIB • CCP • BaridiMob • Virement Bancaire • COD
          </p>
        </div>
      </footer>
    </div>
  )
}
