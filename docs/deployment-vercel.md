# Vercel Deployment Guide - AlgeriaTrade.dz

## Guide de Déploiement Vercel pour AlgeriaTrade

Ce guide vous explique comment déployer AlgeriaTrade.dz sur la plateforme **Vercel**, optimisée pour le marché algérien.

---

## Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration du Projet](#configuration-du-projet)
3. [Variables d'Environnement](#variables-denvironnement)
4. [Configuration de Domaine .dz](#configuration-de-domaine-dz)
5. [Déploiement Initial](#déploiement-initial)
6. [Optimisations pour l'Algérie](#optimisations-pour-lalgérie)
7. [SSL et Sécurité](#ssl-et-sécurité)
8. [Monitoring et Logs](#monitoring-et-logs)
9. [Dépannage](#dépannage)

---

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Un compte Vercel (gratuit ou Pro pour les fonctionnalités avancées)
- ✅ Le code source sur GitHub, GitLab ou Bitbucket
- ✅ Un domaine `.dz` enregistré (via NIC.DZ ou un registrar agréé)
- ✅ Les clés API nécessaires (paiements, email, etc.)

### Installation de Vercel CLI (optionnel)

```bash
# Via npm
npm i -g vercel

# Via bun
bun install -g vercel
```

---

## Configuration du Projet

### 1. Importer le Projet

1. Connectez-vous à [vercel.com](https://vercel.com)
2. Cliquez sur **"Add New Project"**
3. Importez votre dépôt Git
4. Vercel détectera automatiquement Next.js

### 2. Configuration du Framework

Vercel détecte automatiquement Next.js. Les paramètres dans `vercel.json` :

```json
{
  "framework": "nextjs",
  "buildCommand": "bun run build",
  "installCommand": "bun install"
}
```

### 3. Région de Déploiement

Pour optimiser les performances depuis l'Algérie :

| Région | Code | Localisation | Latence estimée |
|--------|------|--------------|-----------------|
| Paris | `cdg1` | France | ~50ms |
| Frankfurt | `fra1` | Allemagne | ~60ms |

**Recommandation :** Utilisez `cdg1` (Paris) - la plus proche de l'Algérie.

---

## Variables d'Environnement

### Configuration dans Vercel Dashboard

1. Allez dans **Settings → Environment Variables**
2. Ajoutez toutes les variables depuis `.env.production.example`
3. Sélectionnez les environnements appropriés :
   - `Production` : Pour la production
   - `Preview` : Pour les PRs / déploiements de test
   - `Development` : Pour le développement local

### Variables Critiques (Production)

Ces variables doivent être définies avant le premier déploiement :

| Variable | Requise | Description |
|----------|---------|-------------|
| `NEXTAUTH_SECRET` | ✅ | Clé secrète pour NextAuth (générez avec `openssl rand -base64 32`) |
| `DATABASE_URL` | ✅ | URL de votre base de données PostgreSQL |
| `NEXTAUTH_URL` | ✅ | URL de production (`https://algeriatrade.dz`) |
| `EMAIL_FROM` | ✅ | Adresse email d'envoi |

### Variables de Paiement Algérien

| Variable | Fournisseur | Description |
|----------|-------------|-------------|
| `CIB_API_KEY` | CIB | Clé API pour paiements par carte |
| `CCP_MERCHANT_ID` | CCP | ID marchand pour virements |
| `BARIDIMOB_API_KEY` | BaridiMob | Clé API mobile payment |

---

## Configuration de Domaine .dz

### Spécificités des Domaines .dz

Les domaines `.dz` ont des particularités importantes :

### 1. Enregistrement DNS chez NIC.DZ

Connectez-vous au portail [NIC.DZ](https://www.nic.dz) et configurez :

#### Pour le domaine principal :

```
Type: A
Name: @
Value: 76.76.21.21  # IP Vercel par défaut
TTL: 3600
```

#### Pour le sous-domaine www :

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### 2. Configuration dans Vercel

1. Allez dans **Settings → Domains**
2. Ajoutez : `algeriatrade.dz`
3. Ajoutez : `www.algeriatrade.dz`
4. Configurez la redirection :
   - `www.algeriatrade.dz` → `algeriatrade.dz` (recommandé)

### 3. Validation DNS

La propagation DNS peut prendre **24-48h** pour les domaines .dz.

Vérifiez avec :

```bash
# Vérifier l'enregistrement A
dig algeriatrade.dz A +short

# Vérifier le CNAME www
dig www.algeriatrade.dz CNAME +short
```

### 4. Problèmes Courants .dz

| Problème | Solution |
|----------|----------|
| DNS ne se propage pas | Contactez NIC.DZ support |
| Erreur SSL | Attendez la propagation complète (max 48h) |
| CNAME non accepté | Utilisez un enregistrement A vers l'IP Vercel |

---

## Déploiement Initial

### Méthode 1 : Via Git (Recommandé)

Chaque push sur `main` déclenche un déploiement :

```bash
git checkout main
git add .
git commit -m "Configure production deployment"
git push origin main
```

### Méthode 2 : Via Vercel CLI

```bash
# Première connexion
vercel login

# Déploiement production
vercel --prod

# Déploiement preview
vercel
```

### Vérification du Déploiement

Après déploiement, vérifiez :

1. ✅ Le site charge correctement
2. ✅ HTTPS est actif (cadenas vert)
3. ✅ L'API `/api/health` répond
4. ✅ Les assets statiques sont servis
5. ✅ L'authentification fonctionne

---

## Optimisations pour l'Algérie

### 1. Edge Network

Vercel utilise automatiquement son Edge Network. La région Paris (`cdg1`) est optimale.

### 2. Image Optimization

Configuration dans `next.config.ts` :

```typescript
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    // Optimiser pour connexions lentes
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
  },
}
```

### 3. ISR (Incremental Static Regeneration)

Pour les pages statiques fréquemment visitées :

```typescript
// Page produits - régénération toutes les heures
export const revalidate = 3600; // 1 heure
```

### 4. Headers de Cache

Les headers sont configurés dans `vercel.json` :

```json
{
  "headers": [
    {
      "source": "/_next/static/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### 5. Compression

Vercel compresse automatiquement avec Brotli/Gzip.

---

## SSL et Sécurité

### Certificat SSL Gratuit

Vercel fournit automatiquement des certificats SSL **Let's Encrypt** gratuits.

### Vérification SSL

```bash
# Vérifier le certificat
openssl s_client -connect algeriatrade.dz:443 -servername algeriatrade.dz
```

### Security Headers

Configurés dans `vercel.json` :

| Header | Valeur | But |
|--------|--------|-----|
| `X-Frame-Options` | `DENY` | Empêche le clickjacking |
| `X-Content-Type-Options` | `nosniff` | Empêche MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Protection XSS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Contrôle referrer |
| `Permissions-Policy` | Restrictif | Limite les APIs navigateur |

### Additional Security Measures

1. **Rate Limiting** : Configurer dans middleware
2. **CORS** : Restreindre aux origines autorisées
3. **Environment Protection** : Ne jamais exposer les secrets

---

## Monitoring et Logs

### Vercel Analytics

Activez dans **Settings → Analytics** :

- Données de visiteurs en temps réel
- Web Vitals (LCP, FID, CLS)
- Sources de trafic géographiques

### Vercel Logs

Accédez aux logs dans l'onglet **Logs** de chaque déploiement :

```bash
# Via CLI - logs en temps réel
vercel logs <deployment-url>
```

### Intégrations Recommandées

| Service | Usage | Prix |
|---------|-------|------|
| Sentry | Error tracking | Free tier disponible |
| Logtail | Log aggregation | $0/mo pour petits volumes |
| UptimeRobot | Uptime monitoring | Gratuit |

---

## Dépannage

### Problèmes Courants

#### Build Failed

```bash
# Vérifier localement
bun run build

# Problèmes courants :
# - Typescript errors → corriger les types
# - Missing dependencies → bun install
# - Environment variables manquantes
```

#### Erreur 502 / Timeout

Les fonctions serverless ont une limite de durée. Augmentez si nécessaire :

```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60  // Jusqu'à 300s sur Pro
    }
  }
}
```

#### Domaine Non Résolu

1. Vérifiez les enregistrements DNS
2. Attendez la propagation (jusqu'à 48h pour .dz)
3. Contactez le support Vercel si persiste

#### Variables d'Environnement Non Chargées

1. Redéploy après ajout de variables
2. Vérifiez l'environnement cible (Production/Preview)

### Support Vercel

- Documentation : [vercel.com/docs](https://vercel.com/docs)
- Support : [vercel.com/support](https://vercel.com/support)
- Status : [vercel-status.com](https://www.vercel-status.com)

---

## Checklist Pré-Déploiement

- [ ] Toutes les variables d'environnement configurées
- [ ] Base de données PostgreSQL provisionnée
- [ ] Domaine .dz configuré avec DNS corrects
- [ ] Tests passés localement (`bun run lint && bun run build`)
- [ ] Clés de paiement testées en staging
- [ ] Email sending vérifié
- [ ] Backup plan en place
- [ ] Monitoring configuré
- [ ] Équipe notifiée du déploiement

---

## Ressources Utiles

- [Vercel Next.js Documentation](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Domains Configuration](https://vercel.com/docs/custom-domains)
- [NIC.DZ Portal](https://www.nic.dz)

---

*Dernière mise à jour : 2024*
*Pour AlgeriaTrade.dz - Plateforme B2B Algérienne*
