'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  MonitorPlay,
  MessageCircle,
  Download,
  Phone,
  Mail,
  Globe,
  MapPin,
  Users,
  Package,
  Video,
  FileText,
  Image as ImageIcon,
  Send,
  Share2,
  Heart,
  ExternalLink,
  Clock,
  Eye,
  Building2,
  Star,
  UserCheck,
  Settings,
  Plus,
  Minus,
  Maximize2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface BoothProduct {
  id: string;
  name: string;
  image?: string;
  price?: number;
  currency?: string;
  description?: string;
  category?: string;
}

export interface BoothDocument {
  id: string;
  name: string;
  type: 'catalog' | 'brochure' | 'price-list' | 'certificate' | 'other';
  url: string;
  size?: string; // e.g., "2.5 MB"
  pages?: number;
}

export interface BoothStaffMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isOnline?: boolean;
  phone?: string;
  email?: string;
  bio?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isOwn?: boolean;
  isStaff?: boolean;
}

export interface VirtualBoothData {
  id: string;
  exhibitionId: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    description: string;
    website?: string;
    location?: string;
    industry?: string;
    foundedYear?: number;
    employeeCount?: string;
  };
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    bannerImage?: string;
    welcomeMessage?: string;
  };
  products: BoothProduct[];
  documents: BoothDocument[];
  staff: BoothStaffMember[];
  videoUrl?: string;
  videoTitle?: string;
  stats?: {
    visitors: number;
    chatsInitiated: number;
    downloads: number;
    productViews: number;
  };
  socialLinks?: {
    website?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
}

interface VirtualBoothProps {
  booth: VirtualBoothData;
  isOwner?: boolean;
  onSendMessage?: (message: string) => void;
  onDownloadDocument?: (documentId: string) => void;
  onViewProduct?: (productId: string) => void;
  onFollowCompany?: (companyId: string) => void;
  className?: string;
}

// Format currency
function formatCurrency(amount: number, currency: string = 'DZD'): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency === 'DZD' ? 'DZD' : currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  })
    .format(amount)
    .replace('DZD', 'DA')
    .trim();
}

// Document type icons
const documentTypeIcons = {
  catalog: <Package className="h-4 w-4" />,
  brochure: <FileText className="h-4 w-4" />,
  'price-list': <FileText className="h-4 w-4" />,
  certificate: <Star className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

const documentTypeLabels = {
  catalog: 'Catalogue',
  brochure: 'Brochure',
  'price-list': 'Liste de prix',
  certificate: 'Certificat',
  other: 'Document',
};

// Sample chat messages for demo
const sampleMessages: ChatMessage[] = [
  {
    id: '1',
    senderId: 'staff-1',
    senderName: 'Ahmed - Commercial',
    content: 'Bienvenue sur notre stand virtuel ! Comment puis-je vous aider ?',
    timestamp: new Date(Date.now() - 300000),
    isStaff: true,
  },
];

export default function VirtualBooth({
  booth,
  isOwner = false,
  onSendMessage,
  onDownloadDocument,
  onViewProduct,
  onFollowCompany,
  className,
}: VirtualBoothProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(sampleMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle sending message
  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'visitor',
      senderName: 'Vous',
      content: newMessage.trim(),
      timestamp: new Date(),
      isOwn: true,
    };

    setChatMessages((prev) => [...prev, message]);
    onSendMessage?.(newMessage.trim());
    setNewMessage('');
  };

  // Handle follow toggle
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    onFollowCompany?.(booth.company.id);
  };

  // Toggle video mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  // Get initials for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const { company, branding, products, documents, staff, stats } = booth;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          'min-h-screen bg-gradient-to-b from-gray-50 to-white',
          className
        )}
        style={{
          '--booth-primary': branding.primaryColor ?? '#2563eb',
          '--booth-secondary': branding.secondaryColor ?? '#1e40af',
        } as React.CSSProperties}
      >
        {/* Header Banner */}
        <div
          className="relative h-48 md:h-64 overflow-hidden"
          style={{ backgroundColor: `${branding.primaryColor ?? '#2563eb'}20` }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, ${branding.primaryColor ?? '#2563eb'} 1px, transparent 1px),
                  radial-gradient(circle at 75% 75%, ${branding.secondaryColor ?? '#1e40af'} 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          {/* Banner image or gradient */}
          {branding.bannerImage ? (
            <img
              src={branding.bannerImage}
              alt={`Stand de ${company.name}`}
              className="w-full h-full object-cover"
            />
          ) : null}

          {/* Overlay content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="max-w-7xl mx-auto flex items-end justify-between gap-4">
              {/* Company info */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-white shadow-lg">
                  <AvatarImage src={company.logo} alt={company.name} />
                  <AvatarFallback
                    className="text-xl font-bold"
                    style={{ backgroundColor: branding.primaryColor, color: 'white' }}
                  >
                    {getInitials(company.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="text-white">
                  <h1 className="text-2xl md:text-3xl font-bold">{company.name}</h1>
                  {company.industry && (
                    <p className="text-white/80 text-sm md:text-base">{company.industry}</p>
                  )}
                  {company.location && (
                    <p className="text-white/70 text-sm flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {company.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleFollow}
                  className={cn(
                    'gap-1.5 bg-white/90 hover:bg-white',
                    isFollowing && 'bg-primary text-primary-foreground hover:bg-primary'
                  )}
                >
                  <Heart className={cn('h-4 w-4', isFollowing && 'fill-current')} />
                  {isFollowing ? 'Suivi' : 'Suivre'}
                </Button>

                <Button variant="secondary" size="icon" className="bg-white/90 hover:bg-white">
                  <Share2 className="h-4 w-4" />
                </Button>

                {isOwner && (
                  <Button variant="secondary" size="icon" className="bg-white/90 hover:bg-white">
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Stats bar */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.visitors.toLocaleString('fr-DZ')}</p>
                    <p className="text-xs text-muted-foreground">Visiteurs</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 text-green-600">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.chatsInitiated.toLocaleString('fr-DZ')}</p>
                    <p className="text-xs text-muted-foreground">Chats</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.downloads.toLocaleString('fr-DZ')}</p>
                    <p className="text-xs text-muted-foreground">Téléchargements</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.productViews.toLocaleString('fr-DZ')}</p>
                    <p className="text-xs text-muted-foreground">Vues produits</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main tabs layout */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" className="gap-1.5">
                <Building2 className="h-4 w-4 hidden sm:block" />
                Aperçu
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-1.5">
                <Package className="h-4 w-4 hidden sm:block" />
                Produits ({products.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-1.5">
                <Download className="h-4 w-4 hidden sm:block" />
                Documents ({documents.length})
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-1.5 relative">
                <MessageCircle className="h-4 w-4 hidden sm:block" />
                Chat
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Company info & Video */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Welcome message */}
                  {branding.welcomeMessage && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-gray-700 leading-relaxed">
                          {branding.welcomeMessage}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Video section */}
                  {booth.videoUrl && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Video className="h-5 w-5" />
                          {booth.videoTitle ?? 'Présentation Vidéo'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div
                          className={cn(
                            'relative rounded-lg overflow-hidden bg-black aspect-video',
                            isVideoFullscreen && 'fixed inset-4 z-50 rounded-xl'
                          )}
                        >
                          <video
                            ref={videoRef}
                            src={booth.videoUrl}
                            controls
                            className="w-full h-full object-contain"
                            poster={branding.bannerImage}
                            muted={isMuted}
                          />

                          {/* Custom controls overlay */}
                          <div className="absolute top-3 right-3 flex gap-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-none"
                              onClick={toggleMute}
                              aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                            >
                              {isMuted ? (
                                <VolumeX className="h-4 w-4" />
                              ) : (
                                <Volume2 className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-none"
                              onClick={() => setIsVideoFullscreen(!isVideoFullscreen)}
                              aria-label={
                                isVideoFullscreen
                                  ? 'Quitter le plein écran'
                                  : 'Plein écran'
                              }
                            >
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Company description */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="h-5 w-5" />
                        À propos de {company.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {company.description}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                        {company.foundedYear && (
                          <div>
                            <p className="text-sm text-muted-foreground">Fondée en</p>
                            <p className="font-semibold">{company.foundedYear}</p>
                          </div>
                        )}
                        {company.employeeCount && (
                          <div>
                            <p className="text-sm text-muted-foreground">Employés</p>
                            <p className="font-semibold">{company.employeeCount}</p>
                          </div>
                        )}
                        {company.industry && (
                          <div>
                            <p className="text-sm text-muted-foreground">Secteur</p>
                            <p className="font-semibold">{company.industry}</p>
                          </div>
                        )}
                        {company.website && (
                          <div>
                            <p className="text-sm text-muted-foreground">Site web</p>
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                            >
                              Visiter
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right column - Staff & Quick links */}
                <div className="space-y-6">
                  {/* Staff members */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-5 w-5" />
                        Notre Équipe
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {staff.map((member) => (
                        <div key={member.id} className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            {member.isOnline !== false && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                            
                            {member.bio && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{member.bio}</p>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                              {member.phone && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={`tel:${member.phone}`}
                                      className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                                      aria-label={`Appeler ${member.name}`}
                                    >
                                      <Phone className="h-3.5 w-3.5" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>{member.phone}</TooltipContent>
                                </Tooltip>
                              )}
                              
                              {member.email && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={`mailto:${member.email}`}
                                      className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                                      aria-label={`Envoyer un email à ${member.name}`}
                                    >
                                      <Mail className="h-3.5 w-3.5" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>{member.email}</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Social links */}
                  {booth.socialLinks && Object.values(booth.socialLinks).some(Boolean) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Globe className="h-5 w-5" />
                          Liens
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {booth.socialLinks.website && (
                          <a
                            href={booth.socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Globe className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Site web</span>
                            <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                          </a>
                        )}
                        {booth.socialLinks.linkedin && (
                          <a
                            href={booth.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">LinkedIn</span>
                            <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                          </a>
                        )}
                        {booth.socialLinks.facebook && (
                          <a
                            href={booth.socialLinks.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Facebook</span>
                            <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Nos Produits
                    <Badge variant="secondary" className="ml-2">
                      {products.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Aucun produit affiché pour le moment</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {products.map((product) => (
                        <Card
                          key={product.id}
                          className="overflow-hidden group cursor-pointer hover:shadow-md transition-all"
                          onClick={() => onViewProduct?.(product.id)}
                        >
                          <div className="aspect-square bg-gray-100 relative overflow-hidden">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-12 w-12 text-gray-300" />
                              </div>
                            )}
                            {product.category && (
                              <Badge className="absolute top-2 left-2 text-xs">
                                {product.category}
                              </Badge>
                            )}
                          </div>
                          <CardContent className="pt-3 pb-3">
                            <h4 className="font-medium text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                              {product.name}
                            </h4>
                            {product.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {product.description}
                              </p>
                            )}
                            {product.price !== undefined && (
                              <p className="font-bold text-sm text-primary">
                                {formatCurrency(product.price, product.currency)}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Documents à Télécharger
                    <Badge variant="secondary" className="ml-2">
                      {documents.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Aucun document disponible pour le moment</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                              {documentTypeIcons[doc.type]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{doc.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs py-0 px-1.5">
                                  {documentTypeLabels[doc.type]}
                                </Badge>
                                {doc.size && <span>{doc.size}</span>}
                                {doc.pages && <span>{doc.pages} pages</span>}
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 gap-1.5"
                            onClick={() => onDownloadDocument?.(doc.id)}
                            aria-label={`Télécharger ${doc.name}`}
                          >
                            <Download className="h-4 w-4" />
                            Télécharger
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat">
              <Card className="h-[500px] flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Chat en Direct
                    <span className="flex items-center gap-1.5 text-sm font-normal text-green-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      En ligne
                    </span>
                  </CardTitle>
                </CardHeader>

                <Separator />

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-2 max-w-[85%]',
                        msg.isOwn ? 'ml-auto flex-row-reverse' : ''
                      )}
                    >
                      {!msg.isOwn && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary text-white">
                            {getInitials(msg.senderName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-2.5',
                          msg.isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : msg.isStaff
                            ? 'bg-green-50 border border-green-200 text-gray-800 rounded-bl-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        )}
                      >
                        {!msg.isOwn && (
                          <p className="text-xs font-medium text-green-600 mb-1">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={cn(
                            'text-xs mt-1',
                            msg.isOwn ? 'text-primary-foreground/70' : 'text-gray-400'
                          )}
                        >
                          {msg.timestamp.toLocaleTimeString('fr-DZ', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div ref={chatEndRef} />
                </div>

                <Separator />

                {/* Input area */}
                <div className="p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="flex-1"
                      aria-label="Message du chat"
                    />
                    <Button type="submit" disabled={!newMessage.trim()} aria-label="Envoyer le message">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    L&apos;équipe répond généralement sous quelques minutes pendant les heures d&apos;exposition.
                  </p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Export types
export type { VirtualBoothProps };
