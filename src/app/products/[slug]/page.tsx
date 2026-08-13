"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductDetail as ProductDetailType, Product, AVAILABILITY_OPTIONS } from "@/types/product";
import {
  MapPin,
  Factory,
  Shield,
  Star,
  Clock,
  Package,
  Truck,
  CheckCircle,
  MessageSquare,
  Heart,
  Share2,
  ChevronRight,
  Phone,
  Mail,
  Globe,
  Calendar,
  User,
  ThumbsUp,
  AlertCircle,
  Loader2,
} from "lucide-react";

function ProductDetailContent() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
    quantity: "",
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${slug}`);
        const data = await response.json();
        
        if (data.success) {
          setProduct(data.data);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  // Handle contact form submit
  const handleContactSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsSubmittingContact(true);
    
    try {
      // TODO: Implement actual contact/message API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      alert("Message envoyé avec succès! Le fournisseur vous contactera bientôt.");
      setIsContactModalOpen(false);
      setContactForm({
        name: "",
        email: "",
        company: "",
        phone: "",
        message: "",
        quantity: "",
      });
    } catch (error) {
      alert("Erreur lors de l'envoi du message. Veuillez réessayer.");
    } finally {
      setIsSubmittingContact(false);
    }
  }, [product]);

  // Handle add to RFQ
  const handleAddToRFQ = useCallback(() => {
    if (!product) return;
    
    // TODO: Implement RFQ functionality
    alert(`Produit "${product.name}" ajouté à votre demande de devis!`);
  }, [product]);

  // Format price helper
  const formatPrice = (price: number | null | undefined) => {
    if (!price) return null;
    return new Intl.NumberFormat("fr-DZ", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Get availability info
  const getAvailabilityInfo = () => {
    if (!product) return AVAILABILITY_OPTIONS[0];
    return AVAILABILITY_OPTIONS.find((opt) => opt.value === product.availability) || AVAILABILITY_OPTIONS[3];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Produit non trouvé</h2>
          <p className="text-muted-foreground mb-4">
            Le produit que vous recherchez n&apos;existe pas ou a été supprimé.
          </p>
          <Button asChild>
            <Link href="/products">Retour au catalogue</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const availabilityInfo = getAvailabilityInfo();
  const primaryImage = product.images.find((img) => img.isPrimary);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/products">Produits</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {product.category.parent && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/categories/${product.category.parent.slug}`}>
                      {product.category.parent.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbLink href={`/categories/${product.category.slug}`}>
                  {product.category.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Gallery */}
          <div>
            <ProductGallery images={product.images} productName={product.name} />
            
            {/* Quick Actions - Mobile */}
            <div className="lg:hidden flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                {isFavorite ? "Sauvé" : "Sauvegarder"}
              </Button>
              <Button variant="outline" className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            {/* Title & Badges */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {product.name}
                </h1>
                
                {/* Desktop Quick Actions */}
                <div className="hidden lg:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* SKU */}
              {product.sku && (
                <p className="text-sm text-muted-foreground mt-1">
                  Réf: {product.sku}
                </p>
              )}

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge className={`${availabilityInfo.color} border-0`}>
                  {availabilityInfo.label}
                </Badge>
                {product.isFeatured && (
                  <Badge className="bg-orange-500 text-white">
                    ⭐ Produit Vedette
                  </Badge>
                )}
                {product.negotiablePrice && (
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    Prix Négociable
                  </Badge>
                )}
              </div>
            </div>

            {/* Price */}
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="p-4">
                {(product.price || product.priceRangeMin) ? (
                  <div className="space-y-1">
                    {product.priceRangeMin !== null && product.priceRangeMax !== null ? (
                      <div>
                        <span className="text-3xl font-bold text-green-600">
                          {formatPrice(product.priceRangeMin)} - {formatPrice(product.priceRangeMax)}{" "}
                          {product.currency}
                        </span>
                        {product.unit && (
                          <span className="text-muted-foreground ml-1">/ {product.unit}</span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-green-600">
                          {formatPrice(product.price)} {product.currency}
                        </span>
                        {product.unit && (
                          <span className="text-muted-foreground ml-1">/ {product.unit}</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold text-green-600">
                      Sur Demande
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Contactez pour le prix
                    </Badge>
                  </div>
                )}

                {/* MOQ */}
                {product.moq && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>MOQ:</strong> {product.moq} {product.unit || "unités"}
                  </p>
                )}

                {/* Lead Time */}
                {product.leadTime && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-4 w-4" />
                    <strong>Délai de livraison:</strong> {product.leadTime}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Company Info Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Company Logo */}
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shrink-0">
                    {product.company.logo ? (
                      <Image
                        src={product.company.logo}
                        alt={product.company.name}
                        width={56}
                        height={56}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-green-700">
                        {product.company.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Company Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/suppliers/${product.company.slug}`}
                        className="font-semibold hover:text-green-600 transition-colors truncate"
                      >
                        {product.company.name}
                      </Link>
                      {product.company.isVerified && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs shrink-0">
                          <Shield className="h-3 w-3 mr-1" />
                          Vérifié
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {product.company.wilaya}
                        {product.company.commune && `, ${product.company.commune}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        {product.company.rating.toFixed(1)}
                        <span className="text-muted-foreground/60">
                          ({product.company.reviewCount} avis)
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        Taux de réponse: {product.company.responseRate}%
                      </span>
                    </div>

                    {product.countryOfOrigin && (
                      <p className="text-xs text-muted-foreground mt-1">
                        🌍 Origine: {product.countryOfOrigin}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
                  <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contacter le Fournisseur
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Contacter le Fournisseur</DialogTitle>
                      </DialogHeader>
                      
                      <form onSubmit={handleContactSubmit} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nom complet *</Label>
                            <Input
                              id="name"
                              value={contactForm.name}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, name: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={contactForm.email}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, email: e.target.value })
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="company">Entreprise</Label>
                            <Input
                              id="company"
                              value={contactForm.company}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, company: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input
                              id="phone"
                              value={contactForm.phone}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, phone: e.target.value })
                            }
                            placeholder="+213 XXX XXX XXX"
                            required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantité souhaitée</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={contactForm.quantity}
                            onChange={(e) =>
                              setContactForm({ ...contactForm, quantity: e.target.value })
                            }
                            placeholder={`Minimum: ${product.moq || "N/A"} ${product.unit || ""}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Message *</Label>
                          <Textarea
                            id="message"
                            rows={4}
                            value={contactForm.message}
                            onChange={(e) =>
                              setContactForm({ ...contactForm, message: e.target.value })
                            }
                            placeholder="Décrivez vos besoins en détail..."
                            required
                          />
                        </div>

                        <div className="flex justify-end gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsContactModalOpen(false)}
                          >
                            Annuler
                          </Button>
                          <Button
                            type="submit"
                            disabled={isSubmittingContact}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isSubmittingContact ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Envoi...
                              </>
                            ) : (
                              "Envoyer le Message"
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="w-full" onClick={handleAddToRFQ}>
                    <Package className="h-4 w-4 mr-2" />
                    Ajouter au Devis
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Short Description */}
            {product.shortDescription && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Description courte</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.shortDescription}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border">
                <EyeIcon className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-semibold">{product.viewCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Vues</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <Star className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
                <p className="text-lg font-semibold">{product._count.reviews}</p>
                <p className="text-xs text-muted-foreground">Avis</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <Heart className="h-5 w-5 mx-auto text-red-400 mb-1" />
                <p className="text-lg font-semibold">{product._count.favorites}</p>
                <p className="text-xs text-muted-foreground">Favoris</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Description, Specs, Reviews */}
        <Tabs defaultValue="description" className="mt-12">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Spécifications</TabsTrigger>
            <TabsTrigger value="reviews">
              Avis ({product.reviews?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="p-6">
                {product.description ? (
                  <div 
                    className="prose prose-sm max-w-none text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune description détaillée disponible pour ce produit.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium bg-gray-50 w-1/3">SKU / Référence</td>
                        <td className="py-3 px-4">{product.sku || "N/A"}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium bg-gray-50">Catégorie</td>
                        <td className="py-3 px-4">
                          <Link href={`/categories/${product.category.slug}`} className="text-green-600 hover:underline">
                            {product.category.name}
                          </Link>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium bg-gray-50">Disponibilité</td>
                        <td className="py-3 px-4">
                          <Badge className={`${availabilityInfo.color} border-0`}>
                            {availabilityInfo.label}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium bg-gray-50">Quantité Minimale (MOQ)</td>
                        <td className="py-3 px-4">
                          {product.moq ? `${product.moq} ${product.unit || "unités"}` : "N/A"}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium bg-gray-50">Délai de Livraison</td>
                        <td className="py-3 px-4">{product.leadTime || "Sur demande"}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium bg-gray-50">Pays d'Origine</td>
                        <td className="py-3 px-4">{product.countryOfOrigin || "N/A"}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium bg-gray-50">Devise</td>
                        <td className="py-3 px-4">{product.currency}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium bg-gray-50">Prix Négociable</td>
                        <td className="py-3 px-4">
                          {product.negotiablePrice ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Oui
                            </Badge>
                          ) : (
                            "Non"
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Avis des Clients ({product.reviews?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {product.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {product.reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">{review.reviewerName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? "text-yellow-500 fill-yellow-500"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {review.title && (
                          <h4 className="font-medium mt-3">{review.title}</h4>
                        )}
                        
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Aucun avis pour ce produit. Soyez le premier à donner votre avis!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Similar Products */}
        {product.similarProducts && product.similarProducts.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Produits Similaires</h2>
              <Link
                href={`/categories/${product.category.slug}`}
                className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
              >
                Voir tous <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {product.similarProducts.map((similarProduct) => (
                <ProductCard
                  key={similarProduct.id}
                  product={similarProduct as unknown as Product}
                  onAddToRFQ={() => {}}
                  onToggleFavorite={() => {}}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// Eye icon component
function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    }>
      <ProductDetailContent />
    </Suspense>
  );
}
