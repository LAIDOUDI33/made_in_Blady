// Chatbot Response Templates
import { Intent } from './intents';

export interface BotResponse {
  message: string;
  suggestions?: string[];
  cards?: ProductCardData[];
  action?: {
    type: 'link' | 'function' | 'rfq' | 'search';
    payload?: string;
    label?: string;
  };
}

export interface ProductCardData {
  id: string;
  name: string;
  image?: string;
  price?: string;
  supplier: string;
  link: string;
}

// Response templates for each intent
const RESPONSES: Record<string, (entities?: Record<string, string>) => BotResponse> = {
  greeting: () => ({
    message: `👋 Bonjour ! Bienvenue sur **AlgeriaTrade.dz** ! 🇩🇿

Je suis votre assistant virtuel, je suis là pour vous aider à :

• 🔍 **Trouver des produits** et fournisseurs en Algérie
• 📋 **Poster des appels d'offres** pour vos besoins
• 💰 **Comparer les prix** et obtenir des devis
• ❓ **Répondre à vos questions** sur la plateforme

Comment puis-je vous aider aujourd'hui ?`,
    suggestions: ['Rechercher un produit', 'Poster un appel d\'offres', 'Contacter le support'],
  }),

  thanks: () => ({
    message: `😊 De rien ! Je suis heureux d'avoir pu vous aider.

N'hésitez pas si vous avez d'autres questions sur AlgeriaTrade. Je suis là pour ça ! 

Bonne continuation sur la plateforme ! 🚀`,
    suggestions: ['Autre question', 'Fermer le chat'],
  }),

  goodbye: () => ({
    message: `Au revoir ! 👋

Merci d'avoir utilisé AlgeriaTrade.dz. À bientôt !

Si vous avez besoin d'aide, je serai toujours disponible. Bonne journée ! ☀️`,
    suggestions: [],
  }),

  search_products: (entities) => {
    const product = entities?.product || '';
    
    return {
      message: product 
        ? `🔍 Je comprends que vous cherchez **${product}**.

Laissez-moi vous aider à trouver ce que vous recherchez !`
        : `🔍 Je peux vous aider à trouver exactement ce que vous cherchez !

Dites-moi quel produit ou type de matériel vous intéresse, et je vous montrerai les meilleures options disponibles sur AlgeriaTrade.`,
      suggestions: [
        'Voir tous les produits',
        'Parcourir par catégorie',
        'Poster un AO si pas trouvé',
      ],
      action: {
        type: 'search',
        payload: product,
        label: product ? `Rechercher "${product}"` : 'Faire une recherche',
      },
    };
  },

  post_rfq: () => ({
    message: `📋 **Poster un Appel d'Offres (AO) sur AlgeriaTrade**

C'est simple et gratuit ! Voici les étapes :

**1️⃣ Créez votre compte acheteur**
   - Inscrivez-vous avec votre email

**2️⃣ Décrivez vos besoins**
   - Produit recherché
   - Quantité souhaitée
   - Spécifications techniques
   - Date de livraison souhaitée

**3️⃣ Recevez les devis**
   - Les fournisseurs vous contactent
   - Comparez les offres
   - Choisissez le meilleur rapport qualité-prix

💡 **Conseil** : Soyez précis dans votre description pour recevoir des devis pertinents !`,
    suggestions: ['Créer un AO maintenant', 'Voir un exemple', 'Guide complet'],
    action: {
      type: 'rfq',
      label: 'Créer un AO',
    },
  }),

  pricing_info: () => ({
    message: `💰 **Tarifs AlgeriaTrade.dz**

**🆓 Plan Gratuit** (Pour commencer)
- Jusqu'à 5 produits
- Réception d'AOs
- Messagerie basique

**⭐ Plan Professionnel** (9.900 DZD/mois)
- Produits illimités
- AO prioritaires
- Statistiques avancées
- Support prioritaire

**🏢 Plan Entreprise** (Sur devis)
- Toutes les fonctionnalités
- API personnalisée
- Account manager dédié
- Formation équipe

---
*Essai gratuit de 14 jours sur tous les plans payants* ✨`,
    suggestions: ['Voir les tarifs complets', 'Essai gratuit', 'Contacter les ventes'],
    action: {
      type: 'link',
      payload: '/pricing',
      label: 'Voir la page tarifs',
    },
  }),

  account_help: () => ({
    message: `👤 **Gestion de votre compte**

**🔐 Mot de passe oublié ?**
1. Cliquez sur "Connexion"
2. Cliquer sur "Mot de passe oublié"
3. Entrez votre email
4. Suivez les instructions reçues

**✏️ Modifier votre profil**
1. Connectez-vous
2. Allez dans "Mon Tableau de bord"
3. Cliquez sur "Profil"
4. Mettez à jour vos informations

**📧 Changer l'email**
- Contactez notre support pour sécurité

**📱 Vérification du compte**
- Un email de confirmation est envoyé après inscription
- Vérifiez aussi vos spams !

Besoin d'aide spécifique ? Je peux vous mettre en relation avec un agent. 😊`,
    suggestions: ['Réinitialiser MDP', 'Modifier profil', 'Contacter support'],
  }),

  payment_help: () => ({
    message: `💳 **Modes de paiement acceptés sur AlgeriaTrade**

**📱 BaridiMob (Recommandé)**
- Paiement instantané via téléphone
- Sécurisé et facile
- Disponible 24h/24

**🏦 CCP (Chèque Postal)**
- Virement bancaire classique
- Délai de validation : 1-2 jours ouvrables
- RIB fourni lors de la commande

**💳 Carte Bancaire (CIB)**
- Visa et Mastercard acceptées
- Paiement sécurisé
- Validation instantanée

**🔄 Virement Bancaire**
- Pour les gros montants
- Délai selon votre banque

---
*Tous les paiements sont sécurisés et cryptés* 🔒`,
    suggestions: ['BaridiMob', 'CCP', 'Carte Bancaire', 'Aide paiement'],
  }),

  shipping_info: () => ({
    message: `🚚 **Livraison & Expédition**

**📍 Zones couvertes**
Nous livrons dans **toutes les 58 wilayas d'Algérie** ! 🇩🇿

**⏱️ Délais standards**
- **Alger** : 1-2 jours ouvrables
- **Grandes villes** (Oran, Constantine, Annaba...) : 2-3 jours
- **Autres wilayas** : 3-5 jours ouvrables
- **Zones sud** : 5-7 jours ouvrables

**💰 Frais de livraison**
- Calculés automatiquement selon :
  - Poids et dimensions
  - Destination (wilaya)
  - Mode d'expédition choisi

**📦 Suivi de commande**
- Numéro de suivi envoyé par email
- Notifications à chaque étape

**🏭 Pour les grosses quantités**
- Transport organisé directement depuis le fournisseur
- Possibilité d'enlèvement usine`,
    suggestions: ['Wilayas couvertes', 'Calculer frais', 'Suivi commande'],
  }),

  verification_help: () => ({
    message: `✅ **Devenir Fournisseur Vérifié**

Le badge vérifié renforce votre crédibilité et augmente vos chances de conclure des affaires !

**📋 Documents requis :**

1. **Identité du représentant**
   - CNIN (Carte Nationale d'Identité)
   - Ou passeport valide

2. **Documents entreprise**
   - Registre de Commerce (RC)
   - NIF (Numéro Identification Fiscale)
   - NIS (Numéro Identification Statistique)

3. **Documents complémentaires (optionnel mais recommandé)**
   - Attestation de activité
   - Références clients
   - Certifications qualité

**⏱️ Délai de traitement :** 2-5 jours ouvrables

**🎯 Avantages du badge vérifié :**
- ✓ Plus de visibilité
- ✓ Confiance accrue des acheteurs
- ✓ Accès aux AO premium
- ✓ Taux de réponse amélioré

Soumettez vos documents dès maintenant !`,
    suggestions: ['Documents requis', 'Processus détaillé', 'Vérifier mon statut'],
    action: {
      type: 'link',
      payload: '/dashboard/seller/company',
      label: 'Commencer la vérification',
    },
  }),

  contact_human: () => ({
    message: `👨‍💼 **Contact avec un agent humain**

Je comprends que vous préfériez parler à une personne réelle. Voici nos options :

**📧 Email Support**
support@algeriatrade.dz
Réponse sous 24h ouvrables

**📞 Téléphone**
+213 (0) XXX XX XX XX
Lun-Ven : 8h30 - 17h30

**💬 Chat en direct**
Disponible pendant les heures ouvrées

**🎫 Ouvrir un ticket**
Pour un suivi personnalisé de votre demande

---
*Veuillez décrire votre problème pour qu'on puisse mieux vous aider.*`,
    suggestions: ['Ouvrir un ticket', 'Email support', 'Retour au chatbot'],
  }),

  fallback: (entities) => {
    const hasProduct = !!entities?.product;
    const hasLocation = !!entities?.location;

    if (hasProduct || hasLocation) {
      return {
        message: `Je ne suis pas sûr d'avoir bien compris, mais j'ai détecté que vous parliez de${
          entities?.product ? ` **${entities.product}**` : ''
        }${
          entities?.location ? ` et de **${entities.location}**` : ''
        }.

Laissez-moi vous orienter vers les bonnes ressources !`,
        suggestions: ['Rechercher ce produit', 'Contacter un fournisseur', 'Parler à un agent'],
      };
    }

    return {
      message: `🤔 Je n'ai pas tout à fait compris votre question...

Voici ce que je peux vous aider avec :

• 🔍 **Recherche de produits** - "Je cherche [produit]"
• 📋 **Appels d'offres** - "Comment poster un AO"
• 💳 **Paiement** - "Comment payer"
• 🚚 **Livraison** - "Délai de livraison"
• 👤 **Compte** - "Mot de passe oublié"

Essayez de reformuler ou choisissez une option ci-dessous :`,
      suggestions: ['Rechercher un produit', 'Poster un AO', 'Aide paiement', 'Contacter support'],
    };
  },
};

/**
 * Get response for an intent
 */
export function getResponse(
  intent: Intent, 
  entities?: Record<string, string>
): BotResponse {
  const responseGenerator = RESPONSES[intent.responseKey] || RESPONSES.fallback;
  return responseGenerator(entities);
}

/**
 * Generate typing indicator time based on response length
 */
export function getTypingDelay(message: string): number {
  // Base delay + variable delay based on length
  const baseDelay = 500; // 0.5 seconds minimum
  const charDelay = Math.min(2000, message.length * 10); // Max 2 extra seconds
  
  return baseDelay + charDelay + Math.random() * 500; // Add some randomness
}
