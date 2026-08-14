import React from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useTranslation, useLanguage } from "@/lib/i18n";
import {
  Package,
  Factory,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Linkedin,
  Twitter,
  ExternalLink,
} from "lucide-react";

const footerCategories = [
  {
    titleKey: "footer.popularCategories",
    links: [
      { nameKey: "categories.agriculture", href: "/categories/agriculture-food" },
      { nameKey: "categories.construction", href: "/categories/construction" },
      { nameKey: "categories.industrial", href: "/categories/industrial-equipment" },
      { nameKey: "categories.energy", href: "/categories/energy-solar" },
      { nameKey: "categories.ict", href: "/categories/ict-telecom" },
      { nameKey: "categories.automobile", href: "/categories/automotive" },
    ],
  },
  {
    titleKey: "footer.forBuyers",
    links: [
      { nameKey: "footer.searchProducts", href: "/products" },
      { nameKey: "footer.findSuppliers", href: "/suppliers" },
      { nameKey: "footer.postRFQ", href: "/rfqs/new" },
      { nameKey: "footer.buyingGuide", href: "/help/buying-guide" },
    ],
  },
  {
    titleKey: "footer.forSuppliers",
    links: [
      { nameKey: "footer.supplierRegistration", href: "/register?role=supplier" },
      { nameKey: "footer.pricing", href: "/pricing" },
      { nameKey: "footer.sellingGuide", href: "/help/selling-guide" },
      { nameKey: "footer.securityCenter", href: "/help/security" },
    ],
  },
  {
    titleKey: "footer.aboutUs",
    links: [
      { nameKey: "footer.whoAreWe", href: "/about" },
      { nameKey: "footer.careers", href: "/careers" },
      { nameKey: "footer.press", href: "/press" },
      { nameKey: "footer.contactUs", href: "/contact" },
      { nameKey: "footer.blog", href: "/blog" },
    ],
  },
];

const wilayas = [
  { key: "Alger", arKey: "الجزائر" },
  { key: "Oran", arKey: "وهران" },
  { key: "Constantine", arKey: "قسنطينة" },
  { key: "Annaba", arKey: "عنابة" },
  { key: "Blida", arKey: "البليدة" },
  { key: "Batna", arKey: "باتنة" },
  { key: "Sétif", arKey: "سطيف" },
  { key: "Sidi Bel Abbès", arKey: "سيدي بلعباس" },
  { key: "Skikda", arKey: "سكيكدة" },
  { key: "Tlemcen", arKey: "تلمسان" }
];

export function Footer() {
  const { t, isRTL } = useLanguage();

  return (
    <footer className="bg-muted/50 border-t">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 ${isRTL ? 'direction-rtl' : ''}`}>
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 to-green-700 text-white font-bold text-xl">
                AT
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Algeria<span className="text-green-600">Trade</span>
                </h2>
                <p className="text-xs text-muted-foreground">B2B Marketplace</p>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t('footer.description') || 'La plateforme B2B numérique de l\'industrie algérienne et du commerce africain. Connectez-vous avec des fournisseurs vérifiés et développez votre entreprise.'}
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{isRTL ? 'الجزائر، الجزائر' : 'Alger, Algérie'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span dir="ltr">+213 (0) XX XX XX XX</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>contact@algeriatrade.dz</span>
              </div>
            </div>
            {/* Social Links */}
            <div className="flex gap-3 pt-2">
              <a href="#" className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-green-100 transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-green-100 transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-green-100 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link Columns - RTL reverses order visually */}
          <div className={isRTL ? 'flex flex-row-reverse contents' : ''}>
            {footerCategories.map((section) => (
              <div key={section.titleKey} className="space-y-3">
                <h3 className={`font-semibold text-foreground ${isRTL ? 'text-right' : ''}`}>
                  {t(section.titleKey)}
                </h3>
                <ul className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                  {section.links.map((link) => (
                    <li key={link.nameKey}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-green-600 transition-colors"
                      >
                        {t(link.nameKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Wilayas Section */}
        <div className="mt-8 pt-8 border-t">
          <h3 className={`font-semibold mb-4 ${isRTL ? 'text-right' : ''}`}>
            {t('footer.suppliersByWilaya') || 'Fournisseurs par Wilaya'}
          </h3>
          <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {wilayas.map((wilaya) => (
              <Link
                key={wilaya.key}
                href={`/suppliers/wilaya/${wilaya.key.toLowerCase().replace(" ", "-")}`}
                className="text-sm px-3 py-1 rounded-full bg-background border hover:border-green-500 hover:text-green-600 transition-colors"
              >
                {t(`wilayas.${wilaya.key}`) || wilaya.key}
              </Link>
            ))}
            <Link
              href="/suppliers#all-wilayas"
              className="text-sm px-3 py-1 rounded-full bg-background border text-green-600 hover:bg-green-50 transition-colors"
            >
              {t('footer.allWilayas') || 'Toutes les wilayas'} {isRTL ? '←' : '→'}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className={`flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            <div className="flex items-center gap-4">
              <span>{t('footer.copyright', { year: new Date().getFullYear() }) || `© ${new Date().getFullYear()} AlgeriaTrade. Tous droits réservés.`}</span>
              <Separator orientation="vertical" className="h-4" />
              <Link href="/terms" className="hover:text-green-600">
                {t('footer.termsOfUse') || "Conditions d'utilisation"}
              </Link>
              <Link href="/privacy" className="hover:text-green-600">
                {t('footer.privacyPolicy') || 'Politique de confidentialité'}
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {t('footer.madeInAlgeria') || 'Made with ❤️ in Algeria'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
