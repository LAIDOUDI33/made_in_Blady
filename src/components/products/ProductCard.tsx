"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Factory,
  Shield,
  Star,
  Heart,
  Eye,
  Package,
} from "lucide-react";
import { Product, AVAILABILITY_OPTIONS } from "@/types/product";

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
  onAddToRFQ?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
}

export function ProductCard({
  product,
  viewMode = "grid",
  onAddToRFQ,
  onToggleFavorite,
  isFavorite = false,
}: ProductCardProps) {
  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];
  
  const availabilityInfo = AVAILABILITY_OPTIONS.find(
    (opt) => opt.value === product.availability
  );

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return null;
    return new Intl.NumberFormat("fr-DZ", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPriceDisplay = () => {
    if (product.priceRangeMin !== null && product.priceRangeMax !== undefined && product.priceRangeMax !== null) {
      if (product.priceRangeMin === product.priceRangeMax) {
        return `${formatPrice(product.priceRangeMin)} ${product.currency}`;
      }
      return `${formatPrice(product.priceRangeMin)} - ${formatPrice(product.priceRangeMax)} ${product.currency}`;
    }
    if (product.price) {
      return `${formatPrice(product.price)} ${product.currency}`;
    }
    return "Sur Demande";
  };

  if (viewMode === "list") {
    return (
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0 bg-gray-100">
              <Link href={`/products/${product.slug}`}>
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.alt || product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Package className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </Link>
              
              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {availabilityInfo && (
                  <Badge className={`${availabilityInfo.color} text-xs border-0`}>
                    {availabilityInfo.label}
                  </Badge>
                )}
                {product.isFeatured && (
                  <Badge className="bg-orange-500 text-white text-xs">
                    Vedette
                  </Badge>
                )}
              </div>
              
              {product.company.isVerified && (
                <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 sm:p-6 flex flex-col">
              <div className="flex-1">
                {/* Title & Company */}
                <div className="mb-3">
                  <Link 
                    href={`/products/${product.slug}`}
                    className="text-lg font-semibold text-foreground hover:text-green-600 transition-colors line-clamp-1"
                  >
                    {product.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Factory className="h-4 w-4" />
                    <Link 
                      href={`/suppliers/${product.company.slug}`}
                      className="hover:text-green-600 transition-colors"
                    >
                      {product.company.name}
                    </Link>
                    {product.company.isVerified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] px-1 py-0">
                        <Shield className="h-3 w-3 mr-1" />
                        Vérifié
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                {product.shortDescription && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {product.shortDescription}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {product.company.wilaya}
                  </span>
                  {product.moq && (
                    <span>MOQ: {product.moq} {product.unit || "unités"}</span>
                  )}
                  {product.leadTime && (
                    <span>Délai: {product.leadTime}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {product.viewCount}
                  </span>
                </div>
              </div>

              {/* Footer with Price and Actions */}
              <div className="flex items-center justify-between pt-4 border-t mt-auto">
                <div>
                  <p className="text-xl font-bold text-green-600">
                    {getPriceDisplay()}
                  </p>
                  {product.negotiablePrice && (
                    <p className="text-xs text-muted-foreground">Prix Négociable</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleFavorite?.(product)}
                    className={isFavorite ? "text-red-500 border-red-200" : ""}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${isFavorite ? "fill-current" : ""}`} />
                    {isFavorite ? "Sauvé" : "Sauver"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAddToRFQ?.(product)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Ajouter au Devis
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/products/${product.slug}`}>Détails</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          <Link href={`/products/${product.slug}`}>
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt || product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Package className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </Link>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {availabilityInfo && (
              <Badge className={`${availabilityInfo.color} text-xs border-0`}>
                {availabilityInfo.label}
              </Badge>
            )}
            {product.isFeatured && (
              <Badge className="bg-orange-500 text-white text-xs">
                Vedette
              </Badge>
            )}
          </div>

          {/* Verified Badge */}
          {product.company.isVerified && (
            <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm">
              <Shield className="h-4 w-4 text-blue-600" />
            </div>
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="text-xs bg-white/90 hover:bg-white"
                onClick={(e) => {
                  e.preventDefault();
                  onToggleFavorite?.(product);
                }}
              >
                <Heart className={`h-3 w-3 mr-1 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button
                size="sm"
                className="text-xs bg-green-600 hover:bg-green-700"
                onClick={(e) => {
                  e.preventDefault();
                  onAddToRFQ?.(product);
                }}
              >
                Devis
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <Link 
            href={`/products/${product.slug}`}
            className="block font-medium text-sm line-clamp-2 group-hover:text-green-600 transition-colors min-h-[40px]"
          >
            {product.name}
          </Link>

          {/* Company Info */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Factory className="h-3 w-3 shrink-0" />
            <span className="truncate">{product.company.name}</span>
            <MapPin className="h-3 w-3 shrink-0 ml-1" />
            <span className="truncate">{product.company.wilaya}</span>
          </div>

          {/* Price & MOQ */}
          <div className="space-y-1 pt-2 border-t">
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-green-600 text-sm">
                {getPriceDisplay()}
              </span>
              {product.negotiablePrice && (
                <span className="text-[10px] text-muted-foreground italic">
                  Négociable
                </span>
              )}
            </div>
            {product.moq && (
              <p className="text-xs text-muted-foreground">
                MOQ: {product.moq} {product.unit || "unités"}
              </p>
            )}
          </div>

          {/* Rating & Reviews */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span>{product.company.rating.toFixed(1)}</span>
              <span className="text-muted-foreground/60">({product._count.reviews})</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{product.viewCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProductCard;
