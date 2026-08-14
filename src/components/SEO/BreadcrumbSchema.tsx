import React from "react";
import { JsonLd, generateBreadcrumbSchema } from "./JsonLd";

// ============================================
// Types
// ============================================

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

// ============================================
// Base URL
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://algeriatrade.dz";

// ============================================
// Common Breadcrumb Patterns for AlgeriaTrade
// ============================================

export const BREADCRUMBS = {
  home: [{ name: "Accueil", url: "/" }],
  
  products: [
    { name: "Accueil", url: "/" },
    { name: "Produits", url: "/products" },
  ],
  
  productDetail: (name: string, slug: string) => [
    { name: "Accueil", url: "/" },
    { name: "Produits", url: "/products" },
    { name, url: `/products/${slug}` },
  ],
  
  categories: [
    { name: "Accueil", url: "/" },
    { name: "Catégories", url: "/categories" },
  ],
  
  categoryDetail: (name: string, slug: string) => [
    { name: "Accueil", url: "/" },
    { name: "Catégories", url: "/categories" },
    { name, url: `/categories/${slug}` },
  ],
  
  suppliers: [
    { name: "Accueil", url: "/" },
    { name: "Fournisseurs", url: "/suppliers" },
  ],
  
  supplierDetail: (name: string, slug: string) => [
    { name: "Accueil", url: "/" },
    { name: "Fournisseurs", url: "/suppliers" },
    { name, url: `/suppliers/${slug}` },
  ],
  
  search: (query?: string) => [
    { name: "Accueil", url: "/" },
    ...(query ? [{ name: `Recherche: ${query}`, url: `/search?q=${query}` }] : []),
  ],
  
  rfqs: [
    { name: "Accueil", url: "/" },
    { name: "Appels d'Offres", url: "/rfqs" },
  ],
  
  login: [
    { name: "Accueil", url: "/" },
    { name: "Connexion", url: "/login" },
  ],
  
  register: [
    { name: "Accueil", url: "/" },
    { name: "Inscription", url: "/register" },
  ],
  
  dashboard: (role: string) => [
    { name: "Accueil", url: "/" },
    { name: role === "buyer" ? "Tableau de bord Acheteur" : "Tableau de bord Vendeur", url: `/dashboard/${role}` },
  ],
};

// ============================================
// Main Component
// ============================================

/**
 * Breadcrumb Schema Component
 * 
 * Renders JSON-LD structured data for breadcrumbs.
 * Use this alongside your visual breadcrumb navigation.
 * 
 * @example
 * ```tsx
 * <BreadcrumbSchema items={[
 *   { name: 'Home', url: '/' },
 *   { name: 'Products', url: '/products' },
 *   { name: 'Product Name' }
 * ]} />
 * ```
 */
export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  return <JsonLd data={generateBreadcrumbSchema(items)} />;
}

// ============================================
// Pre-built Components for Common Pages
// ============================================

export function HomeBreadcrumb() {
  return <BreadcrumbSchema items={BREADCRUMBS.home} />;
}

export function ProductsBreadcrumb() {
  return <BreadcrumbSchema items={BREADCRUMBS.products} />;
}

export function ProductBreadcrumb({ name, slug }: { name: string; slug: string }) {
  return <BreadcrumbSchema items={BREADCRUMBS.productDetail(name, slug)} />;
}

export function CategoriesBreadcrumb() {
  return <BreadcrumbSchema items={BREADCRUMBS.categories} />;
}

export function CategoryBreadcrumb({ name, slug }: { name: string; slug: string }) {
  return <BreadcrumbSchema items={BREADCRUMBS.categoryDetail(name, slug)} />;
}

export function SuppliersBreadcrumb() {
  return <BreadcrumbSchema items={BREADCRUMBS.suppliers} />;
}

export function SupplierBreadcrumb({ name, slug }: { name: string; slug: string }) {
  return <BreadcrumbSchema items={BREADCRUMBS.supplierDetail(name, slug)} />;
}

export function SearchBreadcrumb(query?: string) {
  return <BreadcrumbSchema items={BREADCRUMPS.search(query)} />;
}

export default BreadcrumbSchema;
