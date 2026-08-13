"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ZoomIn, Package } from "lucide-react";
import { ProductImage as ProductImageType } from "@/types/product";

interface ProductGalleryProps {
  images: ProductImageType[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const primaryImage = images.find((img) => img.isPrimary) || images[0];
  const sortedImages = [...images].sort((a, b) => {
    // Primary image first
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    // Then by sort order
    return a.sortOrder - b.sortOrder;
  });

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
  };

  // No images state
  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center">
        <Package className="h-20 w-20 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Aucune image disponible</p>
      </div>
    );
  }

  const currentImage = sortedImages[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
        {/* Image */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="w-full h-full cursor-zoom-in focus:outline-none">
              <Image
                src={currentImage.url}
                alt={currentImage.alt || productName}
                fill
                className="object-contain p-2"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-full bg-black/90 border-0 p-0">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={currentImage.url}
                alt={currentImage.alt || productName}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white shadow-md"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white shadow-md"
              onClick={handleNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {sortedImages.length > 1 && (
          <Badge
            variant="secondary"
            className="absolute bottom-3 right-3 bg-black/60 text-white border-0"
          >
            {selectedIndex + 1} / {sortedImages.length}
          </Badge>
        )}

        {/* Zoom Hint */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="secondary" className="bg-black/60 text-white border-0 gap-1">
            <ZoomIn className="h-3 w-3" />
            Agrandir
          </Badge>
        </div>
      </div>

      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? "border-green-600 ring-2 ring-green-200"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName} - Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
              {index === selectedIndex && (
                <div className="absolute inset-0 ring-2 ring-green-600 ring-inset rounded-lg pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductGallery;
