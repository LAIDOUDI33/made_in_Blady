'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ShoppingCart, Building2 } from 'lucide-react';

interface ProductCardData {
  id: string;
  name: string;
  image?: string;
  price?: string;
  supplier: string;
  link: string;
}

interface ProductCardMessageProps {
  card: ProductCardData;
}

export default function ProductCardMessage({ card }: ProductCardMessageProps) {
  return (
    <Link href={card.link} className="block ml-10">
      <Card className="overflow-hidden hover:shadow-md transition-shadow border-gray-200 bg-white">
        <CardContent className="p-0">
          <div className="flex gap-3 p-3">
            {/* Product Image */}
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
              {card.image ? (
                <img 
                  src={card.image} 
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                  <ShoppingCart className="h-6 w-6 text-green-300" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900 line-clamp-1 truncate">
                {card.name}
              </h4>
              
              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{card.supplier}</span>
              </div>

              {card.price && (
                <p className="text-sm font-semibold text-[#006233] mt-1">
                  {card.price}
                </p>
              )}
            </div>

            {/* View Button */}
            <Button
              size="sm"
              variant="ghost"
              className="self-center flex-shrink-0 text-[#006233] hover:bg-green-50"
              onClick={(e) => e.preventDefault()}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          {/* CTA Bar */}
          <div className="bg-gray-50 px-3 py-2 flex justify-between items-center border-t border-gray-100">
            <span className="text-xs text-gray-500">Voir les détails</span>
            <Badge variant="secondary" className="text-xs bg-green-50 text-[#006233] border-green-200">
              Produit recommandé
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
