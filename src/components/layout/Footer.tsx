import React from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
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
    title: "Catégories Populaires",
    links: [
      { name: "Agriculture & Alimentation", href: "/categories/agriculture-food" },
      { name: "Matériaux de Construction", href: "/categories/construction" },
      { name: "Équipement Industriel", href: "/categories/industrial-equipment" },
      { name: "Énergie Solaire", href: "/categories/energy-solar" },
      { name: "ICT & Télécoms", href: "/categories/ict-telecom" },
      { name: "Automobile", href: "/categories/automotive" },
    ],
  },
  {
    title: "Pour les Acheteurs",
    links: [
      { name: "Rechercher des Produits", href: "/products" },
      { name: "Trouver des Fournisseurs", href: "/suppliers" },
      { name: "Poster un Appel d'Offre", href: "/rfqs/new" },
      { name: "Comment Acheter", href: "/help/buying-guide" },
    ],
  },
  {
    title: "Pour les Fournisseurs",
    links: [
      { name: "Inscription Fournisseur", href: "/register?role=supplier" },
      { name: "Tarifs & Abonnements", href: "/pricing" },
      { name: "Guide du Vendeur", href: "/help/selling-guide" },
      { name: "Centre de Sécurité", href: "/help/security" },
    ],
  },
  {
    title: "À Propos",
    links: [
      { name: "Qui Sommes-Nous", href: "/about" },
      { name: "Carrières", href: "/careers" },
      { name: "Presse", href: "/press" },
      { name: "Contactez-Nous", href: "/contact" },
      { name: "Blog", href: "/blog" },
    ],
  },
];

const wilayas = [
  "Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Sétif", 
  "Sidi Bel Abbès", "Skikda", "Tlemcen"
];

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
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
              La plateforme B2B numérique de l&apos;industrie algérienne et du commerce africain. 
              Connectez-vous avec des fournisseurs vérifiés et développez votre entreprise.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Alger, Algérie</span>
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

          {/* Link Columns */}
          {footerCategories.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="font-semibold text-foreground">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-green-600 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Wilayas Section */}
        <div className="mt-8 pt-8 border-t">
          <h3 className="font-semibold mb-4">Fournisseurs par Wilaya</h3>
          <div className="flex flex-wrap gap-2">
            {wilayas.map((wilaya) => (
              <Link
                key={wilaya}
                href={`/suppliers/wilaya/${wilaya.toLowerCase().replace(" ", "-")}`}
                className="text-sm px-3 py-1 rounded-full bg-background border hover:border-green-500 hover:text-green-600 transition-colors"
              >
                {wilaya}
              </Link>
            ))}
            <Link
              href="/suppliers#all-wilayas"
              className="text-sm px-3 py-1 rounded-full bg-background border text-green-600 hover:bg-green-50 transition-colors"
            >
              Toutes les wilayas →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>© {new Date().getFullYear()} AlgeriaTrade. Tous droits réservés.</span>
              <Separator orientation="vertical" className="h-4" />
              <Link href="/terms" className="hover:text-green-600">
                Conditions d&apos;utilisation
              </Link>
              <Link href="/privacy" className="hover:text-green-600">
                Politique de confidentialité
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                Made with ❤️ in Algeria
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
