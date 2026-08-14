# AlgeriaTrade.dz - Complete Deployment Guide

## Guide Complet de Déploiement pour AlgeriaTrade.dz

**Version:** 1.0  
**Dernière mise à jour:** 2024  
**Langue:** Français (Documentation technique en anglais)

---

## Table des Matières

1. [Introduction](#introduction)
2. [Prérequis](#prérequis)
3. [Architecture de Déploiement](#architecture-de-déploiement)
4. [Configuration de l'Environnement](#configuration-de-lenvironnement)
5. [Déploiement Vercel (Recommandé)](#déploiement-vercel-recommandé)
6. [Déploiement Netlify](#déploiement-netlify)
7. [Déploiement Docker (Serveur Dédié)](#déploiement-docker-serveur-dédié)
8. [Configuration du Domaine .dz](#configuration-du-domaine-dz)
9. [SSL et Certificats](#ssl-et-certificats)
10. [Base de Données](#base-de-données)
11. [Post-Déploiement Checklist](#post-déploiement-checklist)
12. [Dépannage](#dépannage)
13. [Rollback Procedure](#rollback-procedure)

---

## Introduction

AlgeriaTrade.dz est une plateforme B2B de commerce électronique conçue spécifiquement pour le marché algérien. Ce guide couvre toutes les étapes nécessaires pour déployer l'application en production.

### Plateformes Supportées

| Plateforme | Type | Recommandation |
|------------|------|----------------|
| **Vercel** | Serverless / Edge | ⭐⭐⭐⭐⭐ Meilleure performance depuis l'Algérie |
| **Netlify** | Serverless | ⭐⭐⭐⽐ Bonne alternative |
| **Docker** | Self-hosted | ⭐⭐⭐⭐⭐ Contrôle total, idéal pour la conformité |

---

## Prérequis

### Avant de commencer, assurez-vous d'avoir :

#### Infrastructure
- [ ] Domaine `.dz` enregistré (via NIC.DZ ou registrar agréé)
- [ ] Serveur (si Docker) avec minimum 2 CPU / 4GB RAM
- [ ] Base de données PostgreSQL (ou SQLite pour petits déploiements)
- [ ] Service Redis (optionnel mais recommandé)

#### Outils
- [ ] Node.js 20+ installé
- [ ] Bun comme package manager
- [ ] Git configuré
- [ ] Docker & Docker Compose (pour déploiement Docker)
- [ ] Compte Vercel/Netlify (pour serverless)

#### Services Externes
- [ ] Clé API Resend (ou autre provider email)
- [ ] Clés API paiements (CIB, CCP, BaridiMob) - Phase 2
- [ ] Bucket S3 (pour les uploads)
- [ ] Compte Sentry (error tracking) - optionnel

### Connaissances Requises
- Bases de Linux (pour Docker)
- Concepts Git/CI-CD
- Notions réseaux (DNS, SSL)

---

## Architecture de Déploiement

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    DNS (NIC.DZ)     │
                    │   algeriatrade.dz   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │      Nginx          │ ◄── Reverse Proxy
                    │   (SSL Termination) │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼────────┐ ┌────▼─────┐ ┌────────▼────────┐
     │   Next.js App   │ │ Socket.IO│ │   Static Files  │
     │   (Port 3000)   │ │ (:3003)  │ │   (Nginx cache)  │
     └────────┬────────┘ └────┬─────┘ └─────────────────┘
              │                │
     ┌────────▼────────┐ ┌────▼─────┐
     │   PostgreSQL    │ │  Redis   │
     │   (Port 5432)   │ │ (:6379)  │
     └─────────────────┘ └──────────┘
```

---

## Configuration de l'Environnement

### 1. Copier le template des variables d'environnement

```bash
cp .env.production.example .env.local
```

### 2. Configurer les variables critiques

```bash
# Éditer le fichier
nano .env.local
```

**Variables obligatoires :**

```bash
# URL de l'application
NEXT_PUBLIC_APP_URL=https://algeriatrade.dz

# Base de données
DATABASE_URL=postgresql://user:password@host:5432/algeriatrade

# Authentification (générer avec: openssl rand -base64 32)
NEXTAUTH_SECRET=votre-clé-secrète-générée-ici
NEXTAUTH_URL=https://algeriatrade.dz

# Email
EMAIL_FROM=noreply@algeriatrade.dz
RESEND_API_KEY=re_votre_clé_api
```

### 3. Générer les secrets

```bash
# Secret NextAuth
openssl rand -base64 32

# Pour les webhooks BaridiMob
openssl rand -hex 32
```

---

## Déploiement Vercel (Recommandé)

### Pourquoi Vercel ?

- ✅ **Performance optimale** : Edge network avec région Paris (~50ms depuis Alger)
- ✅ **SSL automatique** : Certificats Let's Encrypt gratuits
- ✅ **Déploiements instantanés** : Push-to-deploy
- ✅ **Preview deployments** : Pour chaque PR
- ✅ **CDN intégré** : Cache global automatique

### Étape 1 : Préparer le projet

```bash
# Cloner le repository
git clone https://github.com/votre-org/algeriatrade.git
cd algeriatrade

# Installer les dépendances
bun install

# Tester localement
bun run dev
```

### Étape 2 : Importer sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur **"Add New..." → "Project"**
3. Importez votre repository GitHub/GitLab
4. Vercel détectera automatiquement Next.js

### Étape 3 : Configurer les variables d'environnement

Dans **Settings → Environment Variables** :

| Variable | Environnement |
|----------|---------------|
| `NEXTAUTH_SECRET` | Production, Preview |
| `DATABASE_URL` | Production |
| `NEXTAUTH_URL` | Production (= `https://algeriatrade.dz`) |
| `RESEND_API_KEY` | Production |

### Étape 4 : Configurer le domaine

1. **Settings → Domains**
2. Ajoutez `algeriatrade.dz`
3. Configurez le DNS chez NIC.DZ :

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Étape 5 : Premier déploiement

```bash
git add .
git commit -m "Configure for production deployment"
git push origin main
```

Le déploiement est automatique ! Suivez la progression dans le dashboard Vercel.

### Configuration avancée (vercel.json)

Le fichier `vercel.json` contient déjà :
- Région optimisée (`cdg1` = Paris)
- Security headers
- Cache rules
- Fonctions timeout augmenté

---

## Déploiement Netlify

### Quand utiliser Netlify ?

- Si vous avez déjà des projets Netlify
- Si vous voulez des formulaires intégrés
- Si vous préférez leur interface

### Configuration rapide

1. **Connecter le repository** dans Netlify
2. **Configurer le build** :
   ```
   Build command: bun run build
   Publish directory: .next
   Node version: 20
   ```
3. **Activer le plugin Next.js** :
   ```toml
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

Voir `docs/deployment-netlify.md` pour plus de détails.

---

## Déploiement Docker (Serveur Dédié)

### Quand utiliser Docker ?

- Besoin de contrôle total
- Exigences de conformité (données en Algérie)
- Besoin de services personnalisés
- Coûts prévisibles à long terme

### Prérequis Serveur

**Minimum recommandé :**
- CPU : 2 cœurs
- RAM : 4 GB
- Stockage : 50 GB SSD
- OS : Ubuntu 22.04 LTS ou Debian 12

### Installation

```bash
# 1. Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# 2. Installer Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Installer Docker Compose
sudo apt install docker-compose-plugin -y

# 4. Cloner le projet
cd /opt
sudo git clone https://github.com/votre-org/algeriatrade.git
cd algeriatrade

# 5. Configurer l'environnement
cp .env.production.example .env
nano .env  # Éditer avec vos valeurs

# 6. Créer les répertoires nécessaires
mkdir -p data uploads certs logs backups/db backups/files

# 7. Lancer en mode production
docker compose -f docker-compose.prod.yml up -d
```

### Structure des Fichiers Docker

```
/opt/algeriatrade/
├── docker-compose.prod.yml    # Composition production
├── docker-compose.dev.yml     # Composition développement
├── Dockerfile                 # Build multi-stage
├── nginx.conf                 # Reverse proxy config
├── .env                       # Variables d'environnement
├── certs/                     # Certificats SSL
│   ├── fullchain.pem
│   └── privkey.pem
├── data/                      # Données persistantes
├── uploads/                   # Fichiers uploadés
├── logs/                      # Logs applicatifs
└── backups/                   # Backups automatiques
    ├── db/
    └── files/
```

### Gestion des Services

```bash
# Démarrer tous les services
docker compose -f docker-compose.prod.yml up -d

# Voir les logs
docker compose -f docker-compose.prod.yml logs -f app

# Redémarrer un service
docker compose -f docker-compose.prod.yml restart app

# Mettre à jour
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build

# Arrêter tout
docker compose -f docker-compose.prod.yml down
```

### Certificats SSL (Let's Encrypt)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenir un certificat (nginx doit tourner)
sudo certbot --nginx -d algeriatrade.dz -d www.algeriatrade.dz

# Renouvellement automatique (déjà configuré par certbot)
sudo certbot renew --dry-run
```

---

## Configuration du Domaine .dz

### Spécificités des domaines algériens

Les domaines `.dz` ont quelques particularités :

1. **Registre** : [NIC.DZ](https://www.nic.dz) (Centre de Recherche sur l'Information Scientifique et Technique)
2. **Temps de propagation** : Jusqu'à 48h (parfois plus)
3. **Coût** : ~2000 DZD/an pour un .com.dz
4. **Restrictions** : Documents requis pour l'enregistrement

### Types de domaines disponibles

| Extension | Usage | Restrictions |
|-----------|-------|--------------|
| `.dz` | Réservé aux entités officielles | Très restrictif |
| `.com.dz` | Commercial | Documents commerciaux |
| `.gov.dz` | Gouvernement | Entités étatiques |
| `.edu.dz` | Éducation | Établissements accrédités |
| `.org.dz` | Organisations | Associations |
| `.net.dz` | Infrastructure | FAI |

### Configuration DNS Recommandée

Chez votre registrar (ou NIC.DZ) :

```
; Enregistrement principal
@       IN A        76.76.21.21          ; Vercel IP (ou votre IP serveur)

; WWW (CNAME vers le provider)
www     IN CNAME    cname.vercel-dns.com. ; Vercel
; OU pour un serveur dédié :
; www     IN A        VOTRE_IP_SERVEUR

; Email (MX)
@       IN MX 10    mail.algeriatrade.dz.

; Sécurité SPF
@       IN TXT      "v=spf1 include:_spf.vercel.com ~all"

; DKIM (configurer après setup email)
default._domainkey  IN TXT  "k=rsa; p=VOTRE_CLE_PUBLIQUE"
```

### Vérification DNS

Après configuration, vérifiez :

```bash
# Enregistrement A
dig algeriatrade.dz A +short

# Propagation complète
dig algeriatrade.dz ANY +noall +answer

# Depuis différents endroits (online tools)
# https://dnschecker.org
```

---

## SSL et Certificats

### Options SSL

| Option | Prix | Complexité | Renouvellement |
|--------|------|------------|----------------|
| Let's Encrypt | Gratuit | Faible | Automatique |
| Cloudflare | Gratuit | Moyenne | Automatique |
| Commercial (Sectigo) | ~$15/an | Moyenne | Manuel/Auto |

### Configuration Let's Encrypt avec Certbot

```bash
# Installer
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Obtenir le certificat (mode interactif)
sudo certbot --nginx

# Ou en une commande
sudo certbot --nginx \
  -d algeriatrade.dz \
  -d www.algeriatrade.dz \
  --non-interactive \
  --agree-tos \
  --email admin@algeriatrade.dz \
  --redirect
```

### Renouvellement Automatique

Certbot configure automatiquement un timer systemd. Vérifiez :

```bash
# Vérifier le timer
systemctl list-timers | grep certbot

# Test de renouvellement (sans rien changer)
sudo certbot renew --dry-run
```

### Forcer HTTPS avec Nginx

La configuration `nginx.conf` inclut déjà :
- Redirect HTTP → HTTPS
- Headers HSTS
- Protocoles TLS modernes
- OCSP Stapling

---

## Base de Données

### PostgreSQL (Recommandé pour la production)

#### Installation sur le serveur

```bash
# Installer PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Sécuriser
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'votre_mot_de_passe';"

# Créer la base de données
sudo -u postgres createdb algeriatrade
sudo -u postgres createuser algeriatrade
```

#### Configuration PostgreSQL Optimisée

Éditez `/etc/postgresql/16/main/postgresql.conf` :

```ini
# Connexions
max_connections = 200

# Mémoire (ajuster selon RAM serveur)
shared_buffers = 256MB
effective_cache_size = 768MB
work_mem = 4MB
maintenance_work_mem = 64MB

# WAL (pour la réplication/backups)
wal_level = replica
max_wal_size = 4GB
min_wal_size = 1GB

# Query planner
random_page_cost = 1.1  # SSD
effective_io_concurrency = 200
```

#### Backups Automatisés

Utilisez le script inclus :

```bash
# Backup manuel
./scripts/backup.sh

# Backup avec upload S3
./scripts/backup.sh --upload

# Dans crontab (tous les jours à 2h du matin)
0 2 * * * /opt/algeriatrade/scripts/backup.sh >> /var/log/algeria-backup.log 2>&1
```

### SQLite (Pour petits déploiements)

SQLite peut suffire pour :
- Développement / Staging
- Petites équipes (<100 utilisateurs)
- Pas besoin de haute disponibilité

```bash
# Location de la base de données
data/production.db

# Backup simple
cp data/production.db backups/db/production_$(date +%Y%m%d).db
```

---

## Post-Déploiement Checklist

### Immédiatement après déploiement

- [ ] Le site charge correctement (https://algeriatrade.dz)
- [ ] HTTPS fonctionne (cadenas vert)
- [ ] L'API health check répond : `/api/health`
- [ ] La page de status est accessible : `/api/status`
- [ ] Les assets statiques sont servis (images, CSS, JS)
- [ ] Les redirections fonctionnent (www → non-www)

### Fonctionnalités à tester

- [ ] Inscription d'un nouvel utilisateur
- [ ] Connexion / Déconnexion
- [ ] Création de profil entreprise
- [ ] Upload de produits
- [ ] Recherche de produits
- [ ] Envoi de messages
- [ ] Notifications email

### Paiements (Phase 2)

- [ ] Paiement CIB test
- [ ] Paiement CCP test
- [ ] Paiement BaridiMob test
- [ ] Webhooks reçus correctement

### Monitoring

- [ ] UptimeRobot/Pingdom configuré
- [ ] Sentry error tracking actif
- [ ] Logs consultables
- [ ] Alertes configurées

---

## Dépannage

### Problèmes Courants

#### Build échoue sur Vercel

```bash
# Vérifier localement
NODE_ENV=production bun run build

# Erreurs courantes :
# - "Cannot find module" → Vérifier imports
# - TypeScript errors → Corriger les types
# - Memory limit → Optimiser le build
```

#### Erreur 502 / Timeout

Augmentez les timeouts dans `vercel.json` ou `nginx.conf` :

```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

#### Domaine ne se résout pas

1. Vérifiez les enregistrements DNS
2. Utilisez `dig` ou `nslookup`
3. Attendez la propagation (jusqu'à 48h pour .dz)
4. Contactez le support si > 72h

#### Problèmes de connexion DB

```bash
# Tester la connexion
psql $DATABASE_URL -c "SELECT 1"

# Vérifier que PostgreSQL tourne
sudo systemctl status postgresql

# Logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Logs Utiles

```bash
# Application logs
docker compose -f docker-compose.prod.yml logs -f app

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

---

## Rollback Procedure

### Vercel Rollback

1. Allez dans le dashboard Vercel
2. **Deployments** → Trouvez le dernier déploiement stable
3. Cliquez sur les **"..."** → **"Promote to Production"**

Ou via CLI :
```bash
vercel rollback [deployment-url]
```

### Docker Rollback

Utilisez le script inclus :
```bash
./scripts/deploy.sh --rollback
```

Ou manuellement :
```bash
# Voir les versions précédentes
git log --oneline -10

# Revenir à une version précédente
git checkout <commit-hash>
docker compose -f docker-compose.prod.yml up -d --build
```

### Restaurer un Backup

```bash
# Database
gunzip -c backups/db/backup_YYYYMMDD.sql.gz | psql $DATABASE_URL

# Files
tar -xzf backups/files/uploads_YYYYMMDD.tar.gz
```

---

## Ressources et Support

### Documentation Officielle
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [Docker Docs](https://docs.docker.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Support AlgeriaTrade
- Email : support@algeriatrade.dz
- Documentation : docs.algeriatrade.dz
- Statut : status.algeriatrade.dz

---

*Ce document est maintenu par l'équipe AlgeriaTrade.dz*
*Dernière révision : 2024*
