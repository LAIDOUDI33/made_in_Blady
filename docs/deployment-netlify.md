# Netlify Deployment Guide - AlgeriaTrade.dz

## Guide de Déploiement Netlify pour AlgeriaTrade

Ce guide vous explique comment déployer AlgeriaTrade.dz sur la plateforme **Netlify**, avec une configuration optimisée pour le marché algérien.

---

## Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration du Projet](#configuration-du-projet)
3. [Variables d'Environnement](#variables-denvironnement)
4. [Fonctions Serverless](#fonctions-serverless)
5. [Configuration de Domaine .dz](#configuration-de-domaine-dz)
6. [Form Handling](#form-handling)
7. [Split Testing (A/B Testing)](#split-testing-ab-testing)
8. [Dépannage](#dépannage)

---

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Un compte Netlify (gratuit ou Pro)
- ✅ Le code source sur GitHub, GitLab, ou Bitbucket
- ✅ Un domaine `.dz` enregistré
- ✅ Node.js 20+ installé localement
- ✅ Bun comme package manager

### Installation Netlify CLI (optionnel)

```bash
# Via npm
npm install -g netlify-cli

# Via bun
bun install -g netlify-cli
```

---

## Configuration du Projet

### 1. Importer sur Netlify

1. Connectez-vous à [app.netlify.com](https://app.netlify.com)
2. Cliquez sur **"New site from Git"**
3. Choisissez votre provider Git
4. Sélectionnez le dépôt AlgeriaTrade

### 2. Configuration de Build

Les paramètres sont définis dans `netlify.toml` :

```toml
[build]
  command = "bun run build"
  publish = ".next"
```

**Configuration manuelle alternative :**

| Paramètre | Valeur |
|-----------|--------|
| Build command | `bun run build` |
| Publish directory | `.next` |
| Node version | `20` |
| Bun support | Activer dans UI |

### 3. Plugin Next.js

Le plugin officiel `@netlify/plugin-nextjs` est requis :

```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Ce plugin gère :
- ✅ Le SSR (Server-Side Rendering)
- ✅ L'ISR (Incremental Static Regeneration)
- ✅ Les API Routes
- ✅ L'image optimization
- ✅ Les middlewares

---

## Variables d'Environnement

### Configuration via Netlify UI

1. Allez dans **Site settings → Environment variables**
2. Ajoutez les variables depuis `.env.production.example`
3. Définissez les scopes :
   - **Build** : Disponible pendant le build
   - **Functions** : Disponible pour les fonctions
   - **Runtime** : Disponible au runtime

### Variables Requises

```
NEXTAUTH_URL=https://algeriatrade.dz
NEXTAUTH_SECRET=votre-clé-secrète
DATABASE_URL=postgresql://...
EMAIL_FROM=noreply@algeriatrade.dz
```

### Variables pour Fonctions

Les fonctions Netlify ont accès aux variables d'environnement configurées.

Pour des secrets sensibles, utilisez **Netlify Dev** :

```bash
# Créer un fichier .env local
echo "NEXTAUTH_SECRET=secret" > .env

# Lancer en développement
netlify dev
```

---

## Fonctions Serverless

### Structure

```
netlify/functions/
├── api-proxy.ts        # Proxy pour API routes
└── webhook-handler.ts  # Handler pour webhooks
```

### api-proxy.ts

Proxy générique pour les routes API Next.js :

```typescript
// Accès via /.netlify/functions/api-proxy
export const handler = async (event) => {
  // Logique de proxy...
};
```

### webhook-handler.ts

Gère les webhooks entrants :

| Type | Source | Usage |
|------|--------|-------|
| `payment-baridimob` | BaridiMob | Notifications paiement mobile |
| `payment-cib` | CIB | Notifications carte bancaire |
| `payment-ccp` | CCP | Notifications virement |
| `email-event` | Resend/SendGrid | Événements email |

### Tester les Fonctions Localement

```bash
# Installer les dépendances des fonctions
cd netlify/functions
npm install @netlify/types

# Lancer Netlify Dev
netlify dev

# Tester une fonction
curl http://localhost:8888/.netlify/functions/webhook-handler \
  -H "Content-Type: application/json" \
  -d '{"type":"test","data":{}}'
```

### Limits Netlify Functions

| Plan | Durée max | Mémoire | Exécutions/mois |
|------|-----------|---------|-----------------|
| Free | 10s | 128MB | 125K |
| Pro | 26s | 1024MB | 500K |
| Enterprise | 30s+ | 3008MB | Custom |

---

## Configuration de Domaine .dz

### DNS Configuration

#### Option 1 : DNS Netlify (Recommandé)

1. Dans Netlify : **Domain settings → Add custom domain**
2. Entrez : `algeriatrade.dz`
3. Chez votre registrar (.dz), changez les name servers vers ceux de Netlify :

```
dns1.p07.nsone.net
dns2.p07.nsone.net
dns3.p07.nsone.net
dns4.p07.nsone.net
```

#### Option 2 : DNS Externe (CNAME)

Si vous gardez le contrôle DNS :

```
; Enregistrement pour le domaine principal (si supporté)
Type: ALIAS
Name: @
Value: <votre-site>.netlify.app

; Pour www
Type: CNAME  
Name: www
Value: <votre-site>.netlify.app
```

#### Option 3 : Enregistrement A (Fallback)

```
Type: A
Name: @
Value: 75.2.60.5  # IP Netlify US East
```

### SSL/TLS

Netlify fournit automatiquement des certificats **Let's Encrypt** gratuits.

Options SSL dans **Settings → Domain management** :

| Option | Description |
|--------|-------------|
| Let's Encrypt | Certificat gratuit, renouvellement auto |
| Dedicated IP | Certificat personnalisé possible |

### Propagation DNS .dz

Les domaines `.dz` peuvent prendre jusqu'à **48h** pour la propagation.

Vérifiez avec :

```bash
dig algeriatrade.dz +short
nslookup algeriatrade.dz
```

---

## Form Handling

### Forms Netlify

Netlify détecte automatiquement les formulaires HTML :

```jsx
<form 
  name="contact" 
  data-netlify="true" 
  netlify-honeypot="bot-field"
>
  <input type="hidden" name="form-name" value="contact" />
  {/* Champs du formulaire */}
</form>
```

### Notifications Formulaires

Configurez dans **Settings → Forms → Form notifications** :

- Email notifications
- Slack notifications
- Webhook notifications

### Pour les Formulaires Dynamiques (React)

Utilisez l'API Netlify Forms :

```typescript
async function submitForm(data: FormData) {
  await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data as any).toString(),
  });
}
```

---

## Split Testing (A/B Testing)

### Configuration

Créez des branches pour chaque variante :

```bash
git checkout -b variant-a/new-homepage
git checkout -b variant-b/new-homepage
```

### Activation dans Netlify

1. Allez dans **Experiments**
2. Cliquez **New experiment**
3. Configurez :
   - Nom : "Homepage Redesign Test"
   - Branches : `variant-a`, `variant-b`
   - Distribution : 50/50
   - Objectif : Formulaire soumis / Achat complété

### Suivi des Résultats

Netlify Analytics montre :
- Taux de conversion par variante
- Engagement utilisateur
- Performance (Core Web Vitals)

---

## Dépannage

### Build Échoue

```bash
# Vérifier localement
bun run build

# Erreurs courantes :
# - "Bun not found" → Installer bun ou utiliser npm
# - Memory limit → Augmenter dans settings (Pro plan)
# - TypeScript errors → Corriger avant déploiement
```

### Erreur 404 sur les Pages

Vérifiez que le plugin Next.js est actif et que les redirects sont corrects :

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Fonction Timeout

Augmentez le timeout dans `netlify.toml` ou passez au plan Pro :

```toml
[build.environment]
  NETLIFY_NEXT_PLUGIN_TIMEOUT = "60000"  # 60 secondes
```

### Problèmes CORS

Les headers CORS sont configurés dans `netlify.toml` :

```toml
[headers]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
```

### Support Netlify

- Documentation : [docs.netlify.com](https://docs.netlify.com)
- Forum : [answers.netlify.com](https://answers.netlify.com)
- Status : [www.netlify-status.com](https://www.netlify-status.com)

---

## Checklist Pré-Déploiement Netlify

- [ ] Plugin `@netlify/plugin-nextjs` installé
- [ ] `netlify.toml` configuré
- [ ] Variables d'environnement définies
- [ ] Build réussi localement (`bun run build`)
- [ ] Fonctions testées (`netlify dev`)
- [ ] Domaine .dz configuré
- [ ] SSL actif
- [ ] Forms configurés (si utilisé)
- [ ] Monitoring activé

---

## Comparaison Vercel vs Netlify

| Critère | Vercel | Netlify |
|---------|--------|---------|
| Facilité Next.js | ⭐⭐⭐⭐⭐ Native | ⭐⭐⭐⭐ Plugin requis |
| Edge Functions | Global edge network | Pas encore disponible |
| Pricing Free | 100GB bandwidth | 100GB bandwidth |
| Support .dz | Excellent | Excellent |
| Algérie Latency | ~50ms (Paris) | ~70ms (US East) |
| CI/CD intégré | Oui | Oui |
| Forms handling | Non | Natif |

**Recommandation pour AlgeriaTrade :** Préférez **Vercel** pour la latence optimale depuis l'Algérie.

---

*Dernière mise à jour : 2024*
*Pour AlgeriaTrade.dz - Plateforme B2B Algérienne*
