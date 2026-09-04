/**
 * Internationalization (i18n) Locales Module
 * Module de localisation pour AlgeriaTrade
 * 
 * @module lib/i18n/locales
 * @description Complete French and Arabic translations for all UI strings,
 * language switcher component, RTL support preparation, and DZD currency formatting.
 */

// ============================================
// Types
// ============================================

export type LocaleCode = 'fr' | 'ar' | 'en';
export type Direction = 'ltr' | 'rtl';

export interface LocaleConfig {
  code: LocaleCode;
  name: string;
  nativeName: string;
  flag: string;
  direction: Direction;
  dateFormat: string;
  timeFormat: string;
  currency: {
    code: string;
    symbol: string;
    locale: string;
  };
}

// ============================================
// Locale Configurations
// ============================================

export const LOCALES: Record<LocaleCode, LocaleConfig> = {
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: {
      code: 'DZD',
      symbol: 'DA',
      locale: 'fr-DZ',
    },
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇩🇿',
    direction: 'rtl',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    currency: {
      code: 'DZD',
      symbol: 'د.ج',
      locale: 'ar-DZ',
    },
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: {
      code: 'DZD',
      symbol: 'DA',
      locale: 'en-DZ',
    },
  },
};

// ============================================
// Complete French Translations
// ============================================

export const frenchTranslations: Record<string, string> = {
  // ============================================
  // General / Common
  // ============================================
  'common.yes': 'Oui',
  'common.no': 'Non',
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'common.delete': 'Supprimer',
  'common.edit': 'Modifier',
  'common.create': 'Créer',
  'common.search': 'Rechercher',
  'common.filter': 'Filtrer',
  'common.sort': 'Trier',
  'common.export': 'Exporter',
  'common.import': 'Importer',
  'common.print': 'Imprimer',
  'common.close': 'Fermer',
  'common.back': 'Retour',
  'common.next': 'Suivant',
  'common.previous': 'Précédent',
  'common.submit': 'Valider',
  'common.confirm': 'Confirmer',
  'common.loading': 'Chargement...',
  'common.error': 'Erreur',
  'common.success': 'Succès',
  'common.warning': 'Attention',
  'common.info': 'Information',
  'common.or': 'ou',
  'common.and': 'et',
  'common.all': 'Tous',
  'common.none': 'Aucun',
  'common.select': 'Sélectionner',
  'common.selected': 'Sélectionné(s)',
  'common.actions': 'Actions',
  'common.status': 'Statut',
  'common.date': 'Date',
  'common.time': 'Heure',
  'common.name': 'Nom',
  'common.description': 'Description',
  'common.type': 'Type',
  'common.category': 'Catégorie',
  'common.price': 'Prix',
  'common.quantity': 'Quantité',
  'common.total': 'Total',
  'common.view': 'Voir',
  'common.download': 'Télécharger',
  'common.upload': 'Téléverser',
  'common.copy': 'Copier',
  'common.paste': 'Coller',
  'common.more': 'Plus',
  'common.less': 'Moins',
  'common.show': 'Afficher',
  'common.hide': 'Masquer',
  'common.enable': 'Activer',
  'common.disable': 'Désactiver',
  'common.on': 'Activé',
  'common.off': 'Désactivé',
  'common.active': 'Actif',
  'common.inactive': 'Inactif',
  'common.open': 'Ouvrir',
  'common.refresh': 'Actualiser',
  'common.reset': 'Réinitialiser',
  'common.clear': 'Effacer',
  'common.apply': 'Appliquer',

  // ============================================
  // Navigation
  // ============================================
  'nav.home': 'Accueil',
  'nav.products': 'Produits',
  'nav.suppliers': 'Fournisseurs',
  'nav.categories': 'Catégories',
  'nav.orders': 'Commandes',
  'nav.messages': 'Messages',
  'nav.dashboard': 'Tableau de bord',
  'nav.profile': 'Profil',
  'nav.settings': 'Paramètres',
  'nav.help': 'Aide',
  'nav.login': 'Connexion',
  'nav.register': "S'inscrire",
  'nav.logout': 'Déconnexion',
  'nav.search': 'Rechercher',
  'nav.cart': 'Panier',
  'nav.favorites': 'Favoris',
  'nav.account': 'Mon compte',
  'nav.language': 'Langue',

  // ============================================
  // Auth
  // ============================================
  'auth.login.title': 'Connexion',
  'auth.login.subtitle': 'Accédez à votre compte AlgeriaTrade',
  'auth.login.email': 'Adresse email',
  'auth.login.password': 'Mot de passe',
  'auth.login.forgot': 'Mot de passe oublié ?',
  'auth.login.remember': 'Se souvenir de moi',
  'auth.login.button': 'Se connecter',
  'auth.login.noAccount': "Pas encore de compte ?",
  'auth.login.register': "S'inscrire",
  
  'auth.register.title': "Créer un compte",
  'auth.register.subtitle': 'Rejoignez le plus grand marché B2B d\'Algérie',
  'auth.register.firstName': 'Prénom',
  'auth.register.lastName': 'Nom',
  'auth.register.email': 'Adresse email',
  'auth.register.phone': 'Téléphone',
  'auth.register.password': 'Mot de passe',
  'auth.register.confirmPassword': 'Confirmer le mot de passe',
  'auth.register.terms': "J'accepte les conditions d'utilisation",
  'auth.register.button': "S'inscrire",
  'auth.register.hasAccount': 'Déjà un compte ?',
  'auth.register.login': 'Se connecter',

  'auth.forgot.title': 'Mot de passe oublié',
  'auth.forgot.description': 'Entrez votre email pour recevoir un lien de réinitialisation',
  'auth.forgot.send': 'Envoyer le lien',
  'auth.forgot.back': 'Retour à la connexion',

  // ============================================
  // Dashboard
  // ============================================
  'dashboard.welcome': 'Bienvenue',
  'dashboard.overview': 'Vue d\'ensemble',
  'dashboard.recentActivity': 'Activité récente',
  'dashboard.quickActions': 'Actions rapides',
  'dashboard.notifications': 'Notifications',
  'dashboard.messages': 'Messages',
  'dashboard.orders': 'Commandes',
  'dashboard.analytics': 'Analytiques',
  'dashboard.settings': 'Paramètres',

  // Buyer Dashboard
  'dashboard.buyer.myOrders': 'Mes commandes',
  'dashboard.buyer.myRFQs': 'Mes demandes de devis',
  'dashboard.buyer.myQuotations': 'Mes devis reçus',
  'dashboard.buyer.mySuppliers': 'Mes fournisseurs',
  'dashboard.buyer.favorites': 'Favoris',
  'dashboard.buyer.placeOrder': 'Passer une commande',
  'dashboard.buyer.requestQuote': 'Demander un devis',

  // Seller Dashboard
  'dashboard.seller.myProducts': 'Mes produits',
  'dashboard.seller.myOrders': 'Mes commandes',
  'dashboard.seller.myQuotations': 'Mes devis envoyés',
  'dashboard.seller.RFQs': 'Demandes de devis',
  'dashboard.seller.companyProfile': 'Profil entreprise',
  'dashboard.seller.addProduct': 'Ajouter un produit',
  'dashboard.seller.viewAnalytics': 'Voir les analytiques',

  // ============================================
  // Products
  // ============================================
  'products.title': 'Produits',
  'products.allProducts': 'Tous les produits',
  'products.searchProducts': 'Rechercher des produits',
  'products.categories': 'Catégories',
  'products.filters': 'Filtres',
  'products.sortBy': 'Trier par',
  'products.results': '{count} résultat(s)',
  'products.noResults': 'Aucun produit trouvé',
  'products.addToCart': 'Ajouter au panier',
  'products.addToFavorites': 'Ajouter aux favoris',
  'products.requestQuote': 'Demander un devis',
  'products.contactSupplier': 'Contacter le fournisseur',
  'products.viewDetails': 'Voir les détails',
  'products.specifications': 'Spécifications',
  'products.reviews': 'Avis',
  'products.relatedProducts': 'Produits similaires',
  'products.fromSupplier': 'De {supplier}',
  'products.inStock': 'En stock',
  'products.outOfStock': 'Rupture de stock',
  'products.moq': 'Commande minimale : {quantity}',
  'products.leadTime': 'Délai de livraison : {time}',
  'products.priceRange': '{min} - {max} DZD',
  'products.unitPrice': 'Prix unitaire',
  'products.bulkPricing': 'Tarifs dégressifs',
  'product.certifications': 'Certifications',
  'product.shipping': 'Livraison',
  'product.returns': 'Retours',
  'product.warranty': 'Garantie',

  // ============================================
  // Orders
  // ============================================
  'orders.title': 'Commandes',
  'orders.myOrders': 'Mes commandes',
  'orders.orderNumber': 'N° Commande',
  'orders.orderDate': 'Date de commande',
  'orders.status': 'Statut',
  'orders.total': 'Total',
  'orders.items': 'Article(s)',
  'orders.tracking': 'Suivi',
  'orders.invoice': 'Facture',
  'orders.shippingAddress': 'Adresse de livraison',
  'orders.billingAddress': 'Adresse de facturation',
  'orders.paymentMethod': 'Mode de paiement',
  'orders.paymentStatus': 'Statut de paiement',
  'orders.estimatedDelivery': 'Livraison estimée',
  'orders.actualDelivery': 'Livraison réelle',
  
  // Order Status
  'order.status.pending': 'En attente',
  'order.status.confirmed': 'Confirmée',
  'order.status.processing': 'En cours de préparation',
  'order.status.ready': 'Prête',
  'order.status.shipped': 'Expédiée',
  'order.status.inTransit': 'En transit',
  'order.status.delivered': 'Livrée',
  'order.status.cancelled': 'Annulée',
  'order.status.refunded': 'Remboursée',
  'order.status.returned': 'Retournée',

  // ============================================
  // RFQ (Request for Quotation)
  // ============================================
  'rfq.title': 'Demande de devis',
  'rfq.newRFQ': 'Nouvelle demande de devis',
  'rfq.myRFQs': 'Mes demandes de devis',
  'rfq.rfqNumber': 'N° Demande',
  'rfq.titleField': 'Titre de la demande',
  'rfq.category': 'Catégorie du produit',
  'rfq.quantity': 'Quantité souhaitée',
  'rfq.budget': 'Budget estimé',
  'rfq.deliveryDate': 'Date de livraison souhaitée',
  'rfq.deliveryLocation': 'Lieu de livraison',
  'rfq.description': 'Description détaillée',
  'rfq.attachments': 'Pièces jointes',
  'rfq.submit': 'Soumettre la demande',
  'rfq.quotationsReceived': 'Devis reçus',
  'rfq.noQuotations': 'Aucun devis reçu',
  'rfq.expires': 'Expire le {date}',

  // ============================================
  // Messages
  // ============================================
  'messages.title': 'Messages',
  'messages.newMessage': 'Nouveau message',
  'messages.inbox': 'Boîte de réception',
  'messages.sent': 'Envoyés',
  'messages.drafts': 'Brouillons',
  'messages.archived': 'Archivés',
  'messages.typeMessage': 'Tapez votre message...',
  'messages.send': 'Envoyer',
  'messages.attachFile': 'Joindre un fichier',
  'messages.noMessages': 'Aucun message',
  'messages.markAsRead': 'Marquer comme lu',
  'messages.markAsUnread': 'Marquer comme non lu',
  'messages.delete': 'Supprimer',
  'messages.reply': 'Répondre',
  'messages.forward': 'Transférer',

  // ============================================
  // Notifications
  // ============================================
  'notifications.title': 'Notifications',
  'notifications.all': 'Tout',
  'notifications.unread': 'Non lus',
  'notifications.read': 'Lus',
  'notifications.markAllRead': 'Tout marquer comme lu',
  'notifications.clear': 'Effacer tout',
  'notifications.empty': 'Aucune notification',
  'notifications.emptyFiltered': 'Aucune notification dans cette catégorie',
  'notifications.loading': 'Chargement...',
  'notifications.preferences': 'Préférences',
  'notifications.viewAll': 'Voir tout',
  'notifications.viewMore': 'Voir plus de notifications',
  'notifications.settings': 'Paramètres des notifications',

  // Notification Categories
  'notifications.category.order': 'Commandes',
  'notifications.category.rfq': 'Devis',
  'notifications.category.message': 'Messages',
  'notifications.category.system': 'Système',
  'notifications.category.marketing': 'Marketing',
  'notifications.category.payment': 'Paiements',
  'notifications.category.verification': 'Vérification',
  'notifications.category.promotion': 'Promotions',
  'notifications.category.security': 'Sécurité',

  // ============================================
  // Search
  // ============================================
  'search.placeholder': 'Rechercher produits, fournisseurs, services...',
  'search.title': 'Recherche',
  'search.results': 'Résultats de recherche',
  'search.noResults': 'Aucun résultat pour "{query}"',
  'search.didYouMean': 'Vouliez dire : {suggestion}?',
  'search.filters': 'Filtres',
  'search.advancedFilters': 'Filtres avancés',
  'search.sortBy': 'Trier par',
  'search.clearAll': 'Tout effacer',
  'search.apply': 'Appliquer',
  'search.suggestions': 'Suggestions',
  'search.recentSearches': 'Recherches récentes',
  'search.trendingSearches': 'Recherches populaires',
  'search.saveSearch': 'Sauvegarder la recherche',
  'search.savedSearches': 'Recherches sauvegardées',
  
  // Search Filters
  'search.category': 'Catégorie',
  'search.wilaya': 'Wilaya',
  'search.selectWilaya': 'Sélectionner une wilaya',
  'search.allWilayas': 'Toutes les wilayas',
  'search.priceRange': 'Fourchette de prix',
  'search.minPrice': 'Min',
  'search.maxPrice': 'Max',
  'search.minRating': 'Note minimale',
  'search.verifiedOnly': 'Fournisseurs vérifiés uniquement',
  'search.inStockOnly': 'En stock uniquement',
  'search.verified': 'Vérifié',

  // Sort Options
  'sort.relevance': 'Pertinence',
  'sort.priceLow': 'Prix croissant',
  'sort.priceHigh': 'Prix décroissant',
  'sort.rating': 'Meilleure note',
  'sort.newest': 'Plus récent',
  'sort.oldest': 'Plus ancien',
  'sort.popularity': 'Popularité',

  // ============================================
  // Supplier / Company
  // ============================================
  'supplier.profile': 'Profil fournisseur',
  'supplier.verified': 'Fournisseur vérifié',
  'supplier.since': 'Membre depuis {date}',
  'supplier.responseRate': 'Taux de réponse',
  'supplier.responseTime': 'Temps de réponse moyen',
  'supplier.completedOrders': 'Commandes terminées',
  'supplier.rating': 'Note moyenne',
  'supplier.reviews': 'Avis',
  'supplier.products': 'Produits',
  'supplier.contact': 'Contacter',
  'supplier.visitProfile': 'Voir le profil',
  'supplier.sendMessage': 'Envoyer un message',
  'supplier.location': 'Localisation',
  'supplier.businessType': 'Type d\'entreprise',
  'supplier.yearEstablished': 'Année de création',
  'supplier.employeeCount': 'Nombre d\'employés',
  'supplier.annualRevenue': 'Chiffre d\'affaires annuel',
  'supplier.certifications': 'Certifications',
  'supplier.tradeReferences': 'Références commerciales',

  // ============================================
  // Payment
  // ============================================
  'payment.title': 'Paiement',
  'payment.method': 'Mode de paiement',
  'payment.cardPayment': 'Paiement par carte',
  'payment.bankTransfer': 'Virement bancaire',
  'payment.ccpPayment': 'CCP',
  'payment.baridiMob': 'BaridiMob',
  'payment.satim': 'SATIM (CB Algérie)',
  'payment.crypto': 'Cryptomonnaie',
  'payment.cashOnDelivery': 'Paiement à la livraison',
  'payment.amount': 'Montant',
  'payment.discount': 'Remise',
  'payment.subtotal': 'Sous-total',
  'shipping.cost': 'Frais de port',
  'tax.tva': 'TVA',
  'tax.total': 'Total TTC',
  'payment.payNow': 'Payer maintenant',
  'payment.processing': 'Traitement en cours...',
  'payment.success': 'Paiement réussi !',
  'payment.failed': 'Le paiement a échoué',
  'payment.pending': 'Paiement en attente',
  'payment.receipt': 'Reçu',
  'payment.invoice': 'Facture',

  // ============================================
  // Analytics Dashboard
  // ============================================
  'analytics.title': 'Tableau de bord analytique',
  'analytics.overview': 'Vue d\'ensemble',
  'analytics.sales': 'Ventes',
  'analytics.revenue': 'Chiffre d\'affaires',
  'analytics.orders': 'Commandes',
  'analytics.customers': 'Clients',
  'analytics.visitors': 'Visiteurs',
  'analytics.conversion': 'Taux de conversion',
  'analytics.growth': 'Croissance',
  'analytics.period': 'Période',
  'analytics.compareWith': 'Comparer avec',
  'analytics.exportData': 'Exporter les données',
  'analytics.refresh': 'Actualiser',
  'analytics.lastUpdated': 'Dernière mise à jour',
  
  // KPI Labels
  'kpi.totalRevenue': 'Chiffre d\'affaires total',
  'kpi.totalOrders': 'Total des commandes',
  'kpi.activeUsers': 'Utilisateurs actifs',
  'kpi.conversionRate': 'Taux de conversion',
  'kpi.averageOrderValue': 'Panier moyen',
  'kpi.customerLifetimeValue': 'Valeur vie client',
  'kpi.returnRate': 'Taux de retour',
  'kpi.netPromoterScore': 'NPS',

  // ============================================
  // Settings
  // ============================================
  'settings.title': 'Paramètres',
  'settings.profile': 'Profil',
  'settings.account': 'Compte',
  'settings.security': 'Sécurité',
  'settings.notifications': 'Notifications',
  'settings.privacy': 'Confidentialité',
  'settings.language': 'Langue',
  'settings.appearance': 'Apparence',
  'settings.billing': 'Facturation',
  'settings.api': 'API',
  'settings.integrations': 'Intégrations',
  
  'settings.personalInfo': 'Informations personnelles',
  'settings.companyInfo': 'Informations entreprise',
  'settings.changePassword': 'Changer le mot de passe',
  'settings.twoFactorAuth': 'Authentification à deux facteurs',
  'settings.sessions': 'Sessions actives',
  'settings.deleteAccount': 'Supprimer le compte',
  'settings.exportData': 'Exporter mes données',

  // ============================================
  // Errors & Validation
  // ============================================
  'error.required': 'Ce champ est requis',
  'error.email': 'Adresse email invalide',
  'error.phone': 'Numéro de téléphone invalide',
  'error.password': 'Le mot de passe doit contenir au moins 8 caractères',
  'error.passwordMismatch': 'Les mots de passe ne correspondent pas',
  'error.minLength': 'Minimum {min} caractères requis',
  'error.maxLength': 'Maximum {max} caractères autorisés',
  'error.invalidFormat': 'Format invalide',
  'error.alreadyExists': 'Existe déjà',
  'error.notFound': 'Non trouvé',
  'error.unauthorized': 'Non autorisé',
  'error.forbidden': 'Interdit',
  'error.serverError': 'Erreur serveur',
  'error.networkError': 'Erreur réseau',
  'error.unknownError': 'Une erreur est survenue',
  'error.tryAgain': 'Veuillez réessayer',

  // ============================================
  // Date & Time
  // ============================================
  'date.today': 'Aujourd\'hui',
  'date.yesterday': 'Hier',
  'date.thisWeek': 'Cette semaine',
  'date.lastWeek': 'Semaine dernière',
  'date.thisMonth': 'Ce mois',
  'date.lastMonth': 'Mois dernier',
  'date.thisYear': 'Cette année',
  
  'time.justNow': 'À l\'instant',
  'time.minutesAgo': 'Il y a {count} min',
  'time.hoursAgo': 'Il y a {count}h',
  'time.daysAgo': 'Il y a {count} jours',
  'time.weeksAgo': 'Il y a {count} sem.',
  'time.monthsAgo': 'Il y a {count} mois',

  // ============================================
  // Trust & Verification
  // ============================================
  'trust.verified': 'Vérifié',
  'trust.certified': 'Certifié',
  'trust.trustedPartner': 'Partenaire de confiance',
  'trust.premiumSupplier': 'Fournisseur premium',
  'trust.basicVerification': 'Vérification basique',
  'trust.fullVerification': 'Vérification complète',
  'trust.documentVerified': 'Documents vérifiés',
  'trust.identityVerified': 'Identité vérifiée',
  'trust.businessVerified': 'Entreprise vérifiée',
  'trust.qualityBadge': 'Badge qualité',
  'trust.topRated': 'Top noté',
  'trust.fastResponder': 'Réponse rapide',
  'trust.reliableSeller': 'Vendeur fiable',

  // ============================================
  // Footer
  // ============================================
  'footer.aboutUs': 'À propos',
  'footer.contactUs': 'Contactez-nous',
  'footer.faq': 'FAQ',
  'footer.terms': 'Conditions générales',
  'footer.privacy': 'Politique de confidentialité',
  'footer.cookies': 'Cookies',
  'footer.legal': 'Mentions légales',
  'footer.careers': 'Emplois',
  'footer.blog': 'Blog',
  'footer.press': 'Presse',
  'footer.partners': 'Partenaires',
  'footer.socialMedia': 'Réseaux sociaux',
  'footer.newsletter': 'Newsletter',
  'footer.subscribe': 'S\'abonner',
  'footer.allRightsReserved': 'Tous droits réservés',
};

// ============================================
// Complete Arabic Translations (Key UI Elements)
// ============================================

export const arabicTranslations: Record<string, string> = {
  // ============================================
  // General / Common
  // ============================================
  'common.yes': 'نعم',
  'common.no': 'لا',
  'common.save': 'حفظ',
  'common.cancel': 'إلغاء',
  'common.delete': 'حذف',
  'common.edit': 'تعديل',
  'common.create': 'إنشاء',
  'common.search': 'بحث',
  'common.filter': 'تصفية',
  'common.sort': 'ترتيب',
  'common.export': 'تصدير',
  'common.import': 'استيراد',
  'common.print': 'طباعة',
  'common.close': 'إغلاق',
  'common.back': 'رجوع',
  'common.next': 'التالي',
  'common.previous': 'السابق',
  'common.submit': 'إرسال',
  'common.confirm': 'تأكيد',
  'common.loading': 'جارٍ التحميل...',
  'common.error': 'خطأ',
  'common.success': 'نجاح',
  'common.warning': 'تحذير',
  'common.info': 'معلومات',
  'common.or': 'أو',
  'common.and': 'و',
  'common.all': 'الكل',
  'common.none': 'بدون',
  'common.select': 'اختر',
  'common.actions': 'إجراءات',
  'common.status': 'الحالة',
  'common.date': 'التاريخ',
  'common.time': 'الوقت',
  'common.name': 'الاسم',
  'common.description': 'الوصف',
  'common.type': 'النوع',
  'common.category': 'الفئة',
  'common.price': 'السعر',
  'common.quantity': 'الكمية',
  'common.total': 'المجموع',
  'common.view': 'عرض',
  'common.download': 'تحميل',
  'common.upload': 'رفع',
  'common.more': 'المزيد',
  'common.less': 'أقل',
  'common.show': 'عرض',
  'common.hide': 'إخفاء',
  'common.enable': 'تفعيل',
  'common.disable': 'تعطيل',
  'common.on': 'مفعّل',
  'common.off': 'معطّل',
  'common.active': 'نشط',
  'common.inactive': 'غير نشط',
  'common.open': 'فتح',
  'common.refresh': 'تحديث',
  'common.reset': 'إعادة تعيين',
  'common.clear': 'مسح',
  'common.apply': 'تطبيق',

  // ============================================
  // Navigation
  // ============================================
  'nav.home': 'الرئيسية',
  'nav.products': 'المنتجات',
  'nav.suppliers': 'الموردون',
  'nav.categories': 'الفئات',
  'nav.orders': 'الطلبات',
  'nav.messages': 'الرسائل',
  'nav.dashboard': 'لوحة التحكم',
  'nav.profile': 'الملف الشخصي',
  'nav.settings': 'الإعدادات',
  'nav.help': 'المساعدة',
  'nav.login': 'تسجيل الدخول',
  'nav.register': 'إنشاء حساب',
  'nav.logout': 'تسجيل الخروج',
  'nav.search': 'بحث',
  'nav.cart': 'سلة التسوق',
  'nav.favorites': 'المفضلة',
  'nav.account': 'حسابي',
  'nav.language': 'اللغة',

  // ============================================
  // Auth
  // ============================================
  'auth.login.title': 'تسجيل الدخول',
  'auth.login.subtitle': 'الوصول إلى حسابك في AlgeriaTrade',
  'auth.login.email': 'البريد الإلكتروني',
  'auth.login.password': 'كلمة المرور',
  'auth.login.forgot': 'نسيت كلمة المرور؟',
  'auth.login.remember': 'تذكرني',
  'auth.login.button': 'تسجيل الدخول',
  'auth.login.noAccount': 'ليس لديك حساب؟',
  'auth.login.register': 'إنشاء حساب',
  
  'auth.register.title': 'إنشاء حساب جديد',
  'auth.register.subtitle': 'انضم إلى أكبر سوق B2B في الجزائر',
  'auth.register.firstName': 'الاسم الأول',
  'auth.register.lastName': 'اسم العائلة',
  'auth.register.email': 'البريد الإلكتروني',
  'auth.register.phone': 'الهاتف',
  'auth.register.password': 'كلمة المرور',
  'auth.register.confirmPassword': 'تأكيد كلمة المرور',
  'auth.register.terms': 'أوافق على شروط الاستخدام',
  'auth.register.button': 'إنشاء حساب',
  'auth.register.hasAccount': 'لديك حساب بالفعل؟',
  'auth.register.login': 'تسجيل الدخول',

  // ============================================
  // Dashboard
  // ============================================
  'dashboard.welcome': 'مرحباً',
  'dashboard.overview': 'نظرة عامة',
  'dashboard.recentActivity': 'النشاط الأخير',
  'dashboard.quickActions': 'إجراءات سريعة',
  'dashboard.notifications': 'الإشعارات',
  'dashboard.messages': 'الرسائل',
  'dashboard.orders': 'الطلبات',
  'dashboard.analytics': 'التحليلات',
  'dashboard.settings': 'الإعدادات',

  // ============================================
  // Products
  // ============================================
  'products.title': 'المنتجات',
  'products.allProducts': 'جميع المنتجات',
  'products.searchProducts': 'البحث عن منتجات',
  'products.categories': 'الفئات',
  'products.filters': 'الفلاتر',
  'products.sortBy': 'ترتيب حسب',
  'products.results': '{count} نتيجة',
  'products.noResults': 'لم يتم العثور على منتجات',
  'products.addToCart': 'أضف إلى السلة',
  'products.addToFavorites': 'أضف إلى المفضلة',
  'products.requestQuote': 'طلب عرض سعر',
  'products.contactSupplier': 'تواصل مع المورد',
  'products.viewDetails': 'عرض التفاصيل',
  'products.specifications': 'المواصفات',
  'products.reviews': 'التقييمات',
  'products.relatedProducts': 'منتجات مشابهة',
  'products.fromSupplier': 'من {supplier}',
  'products.inStock': 'متوفر',
  'products.outOfStock': 'نفذ المخزون',
  'products.moq': 'الحد الأدنى للطلب: {quantity}',
  'products.leadTime': 'وقت التسليم: {time}',
  'products.priceRange': '{min} - {max} د.ج',

  // ============================================
  // Orders
  // ============================================
  'orders.title': 'الطلبات',
  'orders.myOrders': 'طلباتي',
  'orders.orderNumber': 'رقم الطلب',
  'orders.orderDate': 'تاريخ الطلب',
  'orders.status': 'الحالة',
  'orders.total': 'المجموع',
  'orders.items': 'عنصر(ان)',
  'orders.tracking': 'التتبع',
  'orders.invoice': 'الفاتورة',
  'orders.shippingAddress': 'عنوان الشحن',
  'orders.billingAddress': 'عنوان الفوترة',
  'orders.paymentMethod': 'طريقة الدفع',
  'orders.paymentStatus': 'حالة الدفع',

  // Order Status
  'order.status.pending': 'قيد الانتظار',
  'order.status.confirmed': 'مؤكد',
  'order.status.processing': 'قيد المعالجة',
  'order.status.ready': 'جاهز',
  'order.status.shipped': 'تم الشحن',
  'order.status.inTransit': 'في الطريق',
  'order.status.delivered': 'تم التسليم',
  'order.status.cancelled': 'ملغي',
  'order.status.refunded': 'تم الاسترداد',
  'order.status.returned': 'تم الإرجاع',

  // ============================================
  // RFQ
  // ============================================
  'rfq.title': 'طلب عرض سعر',
  'rfq.newRFQ': 'طلب عرض سعر جديد',
  'rfq.myRFQs': 'طلبات عروض الأسعار',
  'rfq.rfqNumber': 'رقم الطلب',
  'rfq.titleField': 'عنوان الطلب',
  'rfq.category': 'فئة المنتج',
  'rfq.quantity': 'الكمية المطلوبة',
  'rfq.budget': 'الميزانية التقديرية',
  'rfq.deliveryDate': 'تاريخ التسليم المطلوب',
  'rfq.deliveryLocation': 'مكان التسليم',
  'rfq.description': 'وصف مفصل',
  'rfq.attachments': 'المرفقات',
  'rfq.submit': 'إرسال الطلب',
  'rfq.quotationsReceived': 'عروض الأسعار المستلمة',
  'rfq.noQuotations': 'لم يتم استلام أي عروض',

  // ============================================
  // Messages
  // ============================================
  'messages.title': 'الرسائل',
  'messages.newMessage': 'رسالة جديدة',
  'messages.inbox': 'صندوق الوارد',
  'messages.sent': 'المرسلة',
  'messages.drafts': 'مسودات',
  'messages.archived': 'الأرشيف',
  'messages.typeMessage': 'اكتب رسالتك...',
  'messages.send': 'إرسال',
  'messages.attachFile': 'إرفاق ملف',
  'messages.noMessages': 'لا توجد رسائل',
  'messages.markAsRead': 'تحديد كمقروء',
  'messages.delete': 'حذف',
  'messages.reply': 'رد',

  // ============================================
  // Notifications
  // ============================================
  'notifications.title': 'الإشعارات',
  'notifications.all': 'الكل',
  'notifications.unread': 'غير المقروءة',
  'notifications.read': 'المقروءة',
  'notifications.markAllRead': 'تحديد الكل كمقروء',
  'notifications.clear': 'مسح الكل',
  'notifications.empty': 'لا توجد إشعارات',
  'notifications.loading': 'جارٍ التحميل...',
  'notifications.preferences': 'التفضيلات',
  'notifications.viewAll': 'عرض الكل',
  'notifications.settings': 'إعدادات الإشعارات',

  // ============================================
  // Search
  // ============================================
  'search.placeholder': 'ابحث عن المنتجات، الموردين، الخدمات...',
  'search.title': 'البحث',
  'search.results': 'نتائج البحث',
  'search.noResults': 'لا توجد نتائج لـ "{query}"',
  'search.filters': 'الفلاتر',
  'search.advancedFilters': 'فلاتر متقدمة',
  'search.clearAll': 'مسح الكل',
  'search.apply': 'تطبيق',
  'search.suggestions': 'الاقتراحات',
  'search.recentSearches': 'عمليات البحث الأخيرة',
  'search.trendingSearches': 'عمليات البحث الرائجة',
  'search.category': 'الفئة',
  'search.wilaya': 'الولاية',
  'search.selectWilaya': 'اختر ولاية',
  'search.allWilayas': 'كل الولايات',
  'search.priceRange': 'نطاق السعر',
  'search.minPrice': 'الأدنى',
  'search.maxPrice': 'الأقصى',
  'search.minRating': 'التقييم الأدنى',
  'search.verifiedOnly': 'الموردون الموثقون فقط',

  // Sort Options
  'sort.relevance': 'الصلة',
  'sort.priceLow': 'السعر: الأقل أولاً',
  'sort.priceHigh': 'السعر: الأعلى أولاً',
  'sort.rating': 'أفضل تقييم',
  'sort.newest': 'الأحدث',
  'sort.popularity': 'الشعبية',

  // ============================================
  // Payment
  // ============================================
  'payment.title': 'الدفع',
  'payment.method': 'طريقة الدفع',
  'payment.cardPayment': 'الدفع بالبطاقة',
  'payment.bankTransfer': 'تحويل بنكي',
  'payment.ccpPayment': 'CCP',
  'payment.baridiMob': 'BaridiMob',
  'payment.satim': 'SATIM',
  'payment.crypto': 'عملات رقمية',
  'payment.amount': 'المبلغ',
  'payment.discount': 'خصم',
  'payment.subtotal': 'المجموع الفرعي',
  'tax.total': 'المجموع شامل الضريبة',
  'payment.payNow': 'ادفع الآن',
  'payment.processing': 'جارٍ المعالجة...',
  'payment.success': 'تم الدفع بنجاح!',
  'payment.failed': 'فشل الدفع',

  // ============================================
  // Analytics
  // ============================================
  'analytics.title': 'لوحة التحليلات',
  'analytics.overview': 'نظرة عامة',
  'analytics.sales': 'المبيعات',
  'analytics.revenue': 'الإيرادات',
  'analytics.orders': 'الطلبات',
  'analytics.customers': 'العملاء',
  'analytics.conversion': 'معدل التحويل',
  'analytics.exportData': 'تصدير البيانات',
  'analytics.refresh': 'تحديث',
  'analytics.lastUpdated': 'آخر تحديث',

  // ============================================
  // Settings
  // ============================================
  'settings.title': 'الإعدادات',
  'settings.profile': 'الملف الشخصي',
  'settings.account': 'الحساب',
  'settings.security': 'الأمان',
  'settings.notifications': 'الإشعارات',
  'settings.privacy': 'الخصوصية',
  'settings.language': 'اللغة',
  'settings.changePassword': 'تغيير كلمة المرور',

  // ============================================
  // Errors
  // ============================================
  'error.required': 'هذا الحقل مطلوب',
  'error.email': 'بريد إلكتروني غير صالح',
  'error.password': 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل',
  'error.passwordMismatch': 'كلمات المرور غير متطابقة',
  'error.tryAgain': 'يرجى المحاولة مرة أخرى',

  // ============================================
  // Date & Time
  // ============================================
  'date.today': 'اليوم',
  'date.yesterday': 'أمس',
  'time.justNow': 'الآن',
  'time.minutesAgo': 'منذ {count} دقيقة',
  'time.hoursAgo': 'منذ {count} ساعة',
  'time.daysAgo': 'منذ {count} يوم',

  // ============================================
  // Trust
  // ============================================
  'trust.verified': 'موثق',
  'trust.certified': 'معتمد',
  'trust.trustedPartner': 'شريك موثوق',
  'trust.premiumSupplier': 'مورد متميز',
};

// ============================================
// Currency Formatting Utilities
// ============================================

/**
 * Format price in Algerian Dinar (DZD) with proper locale
 */
export function formatDZD(
  amount: number,
  locale: LocaleCode = 'fr',
  options?: Intl.NumberFormatOptions
): string {
  const config = LOCALES[locale];
  
  return new Intl.NumberFormat(config.currency.locale, {
    style: 'currency',
    currency: config.currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Format number with locale-specific formatting
 */
export function formatLocaleNumber(
  value: number,
  locale: LocaleCode = 'fr',
  options?: Intl.NumberFormatOptions
): string {
  const config = LOCALES[locale];
  
  return new Intl.NumberFormat(config.currency.locale, options).format(value);
}

/**
 * Format date with locale-specific format
 */
export function formatDate(
  date: Date | string,
  locale: LocaleCode = 'fr',
  options?: Intl.DateTimeFormatOptions
): string {
  const config = LOCALES[locale];
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(config.currency.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(dateObj);
}

/**
 * Format relative time
 */
export function formatRelativeTime(
  date: Date | string,
  locale: LocaleCode = 'fr'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (locale === 'ar') {
    if (diffSecs < 60) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return dateObj.toLocaleDateString('ar-DZ');
  }

  // French default
  if (diffSecs < 60) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  return dateObj.toLocaleDateString('fr-FR');
}

/**
 * Get text direction for locale
 */
export function getDirection(locale: LocaleCode): Direction {
  return LOCALES[locale].direction;
}

/**
 * Check if locale is RTL
 */
export function isRTL(locale: LocaleCode): boolean {
  return LOCALES[locale].direction === 'rtl';
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): LocaleConfig[] {
  return Object.values(LOCALES);
}

/**
 * Get translation by key for a specific locale
 */
export function getTranslation(key: string, locale: LocaleCode): string {
  const translations = locale === 'ar' ? arabicTranslations : frenchTranslations;
  return translations[key] || frenchTranslations[key] || key;
}

// Export all translations
export { frenchTranslations as fr, arabicTranslations as ar };

export default {
  LOCALES,
  frenchTranslations,
  arabicTranslations,
  formatDZD,
  formatLocaleNumber,
  formatDate,
  formatRelativeTime,
  getDirection,
  isRTL,
  getAvailableLocales,
  getTranslation,
};
