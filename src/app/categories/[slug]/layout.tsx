import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryJsonLd, BreadcrumbJsonLd } from "@/components/SEO";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://algeriatrade.dz";

interface CategoryLayoutProps {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: CategoryLayoutProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const category = await db.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
        parent: {
          select: { name: true, slug: true },
        },
      },
    });

    if (!category || !category.isActive) {
      return {
        title: "Catégorie non trouvée | AlgeriaTrade",
        robots: { index: false, follow: false },
      };
    }

    const productCount = category._count.products;
    const parentName = category.parent?.name;

    const title = category.name + " - " + productCount + " Produits | AlgeriaTrade";
    const desc = "Découvrez " + productCount + " produits dans la catégorie " + category.name + (parentName ? " - " + parentName : "") + " sur AlgeriaTrade.";

    return {
      title,
      description: desc,
      keywords: [category.name, "Algérie", "B2B", "fournisseurs", "produits"],
      openGraph: {
        title,
        description: desc,
        url: BASE_URL + "/categories/" + slug,
        siteName: "AlgeriaTrade",
        images: [{ url: category.image || BASE_URL + "/og-image.jpg", width: 1200, height: 630 }],
        type: "website",
        locale: "fr_DZ",
      },
      alternates: {
        canonical: BASE_URL + "/categories/" + slug,
      },
    };
  } catch (error) {
    return {
      title: "Catégorie | AlgeriaTrade",
    };
  }
}

export default async function CategoryLayout({ params, children }: CategoryLayoutProps) {
  const { slug } = await params;

  let categoryData = null;
  try {
    categoryData = await db.category.findUnique({
      where: { slug },
      include: {
        parent: {
          select: { name: true, slug: true },
        },
      },
    });
  } catch (error) {
    console.log("Category fetch error");
  }

  if (!categoryData) {
    return <>{children}</>;
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <CategoryJsonLd
        category={categoryData}
        url={BASE_URL + "/categories/" + slug}
      />
      
      {/* Breadcrumb */}
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: BASE_URL },
          { name: "Catégories", url: BASE_URL + "/categories" },
          ...(categoryData.parent ? [{ name: categoryData.parent.name, url: BASE_URL + "/categories/" + categoryData.parent.slug }] : []),
          { name: categoryData.name, url: BASE_URL + "/categories/" + categoryData.slug },
        ]}
      />

      {/* Main Content */}
      {children}
    </>
  );
}
