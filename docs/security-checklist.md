# AlgeriaTrade.dz - Production Security Checklist

## Liste de Sécurité pour la Production

**Version:** 1.0  
**Classification:** Interne / Équipe Technique  
**Révision:** Trimestrielle

---

## Table des Matières

1. [Avant le Déploiement](#avant-le-déploiement)
2. [Sécurité des Variables d'Environnement](#sécurité-des-variables-denvironnement)
3. [Sécurité Réseau & Infrastructure](#sécurité-réseau--infrastructure)
4. [Sécurité Application](#sécurité-application)
5. [Sécurité Base de Données](#sécurité-base-de-données)
6. [Sécurité API](#sécurité-api)
7. [Sécurité Authentification](#sécurité-authentification)
8. [Monitoring de Sécurité](#monitoring-de-sécurité)
9. [Audit & Compliance](#audit--compliance)
10. [Incident Response Plan](#incident-response-plan)

---

## Avant le Déploiement

### Checklist Pré-Lancement

- [ ] **Code review** effectué par au moins 2 personnes
- [ ] **Dépendances** scannées (pas de vulnérabilités connues)
- [ ] **Tests de sécurité** exécutés (OWASP ZAP ou équivalent)
- [ ] **Variables sensibles** vérifiées (pas dans le code)
- [ ] **HTTPS** configuré et testé
- [ ] **Headers de sécurité** présents
- [ ] **CORS** correctement configuré
- [ ] **Rate limiting** actif
- [ ] **Logs** activés (sans données sensibles)
- [ ] **Backup** testé et fonctionnel
- [ ] **Plan de rollback** documenté et testé

---

## Sécurité des Variables d'Environnement

### ✅ Bonnes Pratiques

```bash
# 1. JAMAIS committer .env avec des vraies valeurs
.env.local          # → Dans .gitignore
.env.production     # → Généré manuellement ou via CI/CD
.env.production.example # → Template sans vraies valeurs (commit)

# 2. Utiliser un gestionnaire de secrets
# Options :
# - Vercel Environment Variables (chiffrées)
# - AWS Secrets Manager
# - HashiCorp Vault
# - Docker Secrets (pour self-hosted)

# 3. Rotation régulière des secrets
# - NEXTAUTH_SECRET : Tous les 90 jours
# - Clés API : Selon la politique du provider
# - Mots de passe DB : Tous les 6 mois
```

### ❌ À Éviter

```bash
# NE PAS FAIRE :
NEXTAUTH_SECRET=super-secret-key  # Dans le code source
DATABASE_URL=postgres://root:password@...  # Hardcodé
API_KEY=sk_live_xxx  # Commité dans git
```

### Vérification

```bash
# Scanner les fichiers commités pour des secrets
# Avec truffleHog (maintainant GitLeaks)
gitleaks detect --source . --verbose

# Ou avec trufflehog
trufflehog git file://./ --only-verified
```

---

## Sécurité Réseau & Infrastructure

### Firewall (UFW pour Ubuntu)

```bash
# Configuration recommandée
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH (changer le port par défaut si possible)
sudo ufw allow 22/tcp comment 'SSH'

# HTTP/HTTPS
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Activer
sudo ufw enable
sudo ufw status verbose
```

### SSH Hardening

Éditer `/etc/ssh/sshd_config` :

```
# Désactiver root login
PermitRootLogin no

# Authentification par clé uniquement
PasswordAuthentication no
PubkeyAuthentication yes

# Changer le port (optionnel mais recommandé)
Port 2222

# Limiter les tentatives
MaxAuthTries 3
LoginGraceTime 30

# Désactiver les méthodes inutiles
HostbasedAuthentication no
IgnoreRhosts yes
```

### Nginx Security

La configuration `nginx.conf` inclut déjà :

```nginx
# Headers de sécurité (déjà configurés)
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";

# Cacher la version nginx
server_tokens off;

# Limiter la taille des uploads
client_max_body_size 50M;

# Protection contre les slowloris
client_body_timeout 10;
client_header_timeout 10;
send_timeout 10;
```

### SSL/TLS Configuration

```bash
# Tester votre configuration SSL
# Via ssllabs.com/ssltest

# Score visé : A+ minimum

# Protocoles autorisés
ssl_protocols TLSv1.2 TLSv1.3;

# Cipher suites fortes
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

# HSTS (12 mois + preload)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
```

---

## Sécurité Application

### Dependencies Scanning

```bash
# Audit npm/bun
bun audit

# Avec Snyk (recommandé)
npx snyk test
npy snyk monitor

# Automatiser dans CI/CD
# Voir .github/workflows/security.yml
```

### Mise à jour des Dépendances

```bash
# Mises à jour régulières
bun update

# Pour les vulnérabilités critiques
bun update --latest <package>

# Vérifier les changements
bun outdated
```

### Content Security Policy

Configurer dans `next.config.ts` ou `nginx.conf` :

```javascript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      font-src 'self' data:;
      connect-src 'self' wss: https:;
      frame-ancestors 'none';
    `.replace(/\n/g, ''),
  },
];

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

---

## Sécurité Base de Données

### PostgreSQL Security

```sql
-- Créer un utilisateur dédié (pas postgres !)
CREATE USER algeriatrade WITH PASSWORD 'strong-password-here';

-- Droits minimaux
GRANT CONNECT ON DATABASE algeriatrade TO algeriatrade;
GRANT USAGE ON SCHEMA public TO algeriatrade;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO algeriatrade;

-- Ne JAMAIS donner GRANT sur tout
-- GRANT ALL PRIVILEGES ... ← INTERDIT en production
```

### Connexions Sécurisées

```bash
# Forcer SSL pour PostgreSQL
# Dans postgresql.conf :
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'

# Restreindre les IPs qui peuvent se connecter
# Dans pg_hba.conf :
# hostssl all all 192.168.1.0/24 scram-sha-256
```

### Backups Sécurisés

```bash
# Chiffrer les backups
gpg --symmetric --cipher-algo AES256 backup.sql.gz

# Stocker hors-site (S3 avec chiffrement)
aws s3 cp encrypted.backup.gpg s3://private-bucket/backups/ \
  --sse AES256
```

---

## Sécurité API

### Rate Limiting

Configuration dans middleware ou API routes :

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '5m'), // 100 req / 5 min
  analytics: true,
});

// Utilisation dans une route
import { ratelimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  // ...
}
```

### Input Validation

Toujours valider et sanitizer les inputs :

```typescript
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(3).max(200).trim(),
  price: z.number().positive().max(99999999),
  description: z.string().max(5000).optional(),
  categoryId: z.string().uuid(),
});

// Utilisation
const validatedData = createProductSchema.parse(req.body);
```

### SQL Injection Prevention

Prisma protège automatiquement contre SQL injection :

```typescript
// ✅ Sûr (parameterized queries)
await prisma.product.findMany({
  where: { categoryId: userInput }
});

// ❌ Dangereux (jamais faire ça)
await prisma.$queryRaw`SELECT * FROM products WHERE id = ${userInput}`;
// Utiliser plutôt :
await prisma.$queryRaw`SELECT * FROM products WHERE id = ${z.string().uuid().parse(userInput)}`;
```

### CORS Configuration

```typescript
// next.config.ts ou middleware
const allowedOrigins = [
  'https://algeriatrade.dz',
  'https://www.algeriatrade.dz',
];

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false; // Pas de origin = pas de navigateur
  return allowedOrigins.includes(origin);
}
```

---

## Sécurité Authentification

### NextAuth.js Configuration

```typescript
// src/lib/auth-options.ts
export const authOptions: NextAuthOptions = {
  // Session JWT courte pour plus de sécurité
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 heures
    updateAge: 60 * 60,   // Update chaque heure
  },

  // JWT secrets forts
  secret: process.env.NEXTAUTH_SECRET,

  // Callbacks sécurisés
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  // Pages personnalisées
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login?error=1',
    verifyRequest: '/verify-email',
  },

  // Events pour le logging
  events: {
    signIn: ({ user }) => logger.info('User signed in', { userId: user.id }),
    signOut: ({ token }) => logger.info('User signed out', { userId: token?.sub }),
  },
};
```

### Password Policy

```typescript
// Validation des mots de passe
const passwordSchema = z.object({
  password: z.string()
    .min(12, 'Minimum 12 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[a-z]/, 'Au moins une minuscule')
    .regex(/[0-9]/, 'Au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial'),
});
```

### Protection Brute Force

```typescript
// Limiter les tentatives de connexion
const loginLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15m'), // 5 tentatives / 15 min
});

// Compteur de tentatives échouées (stocker en DB ou Redis)
async function recordFailedAttempt(email: string) {
  const key = `login_attempts:${email}`;
  await redis.incr(key);
  await redis.expire(key, 900); // 15 minutes
}

async function getFailedAttempts(email: string): Promise<number> {
  return parseInt(await redis.get(`login_attempts:${email}`) || '0');
}
```

---

## Monitoring de Sécurité

### Logs de Sécurité

```typescript
// Événements à logger
const securityEvents = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'LOGOUT',
  'PASSWORD_CHANGE',
  'EMAIL_VERIFICATION',
  'PASSWORD_RESET_REQUEST',
  'MFA_ENABLED',  // Si implémenté
  'MFA_DISABLED',
  'ROLE_CHANGE',
  'PERMISSION_DENIED',
  'RATE_LIMIT_EXCEEDED',
  'SUSPICIOUS_ACTIVITY',
];
```

### Alertes de Sécurité

| Événement | Action |
|-----------|--------|
| Multiple failed logins (>10) | Bloquer IP temporairement |
| Login depuis pays inhabituel | Email à l'utilisateur |
| Admin role assigned | Notification équipe |
| Data export large | Review manuel requis |
| API abuse detected | IP bloquée |

### Outils Recommandés

| Outil | Usage | Prix |
|-------|-------|------|
| **Snyk** | Vulnerability scanning | Free tier |
| **GitHub Dependabot** | Automated updates | Gratuit |
| ** OWASP ZAP** | Security testing | Gratuit |
| **Cloudflare** | DDoS protection | Freemium |

---

## Audit & Compliance

### Checklist Audit Trimestriel

#### Accès & Permissions
- [ ] Revue des accès admin (qui a accès ?)
- [ ] Clés API rotatées si nécessaire
- [ ] Mots de passe changés (tous les 90 jours)
- [ ] Comptes inactifs désactivés

#### Infrastructure
- [ ] OS patches installés (`apt upgrade`)
- [ ] Docker images mises à jour
- [ ] Certificats SSL valides (expiration > 30 jours)
- [ ] Backups restaurables (test de restore)

#### Application
- [ ] Dependencies auditées (`bun audit`)
- [ ] Vulnérabilités corrigées
- [ ] Code review des derniers changements
- [ ] Tests de sécurité passés

#### Documentation
- [ ] Procédures mises à jour
- [ ] Runbooks existants pour incidents
- [ ] Contacts d'urgence à jour

### Rapport d'Audit Template

```markdown
# Rapport de Sécurité - AlgeriaTrade.dz

**Date:** YYYY-MM-DD  
**Auditeur:** Nom  
**Période couverte:** QX YYYY  

## Résumé Exécutif
[Score global, tendances]

## Trouvailles Critiques
[Liste des vulnérabilités critiques]

## Trouvailles Mineures
[Liste des améliorations recommandées]

## Actions Requises
[À corriger avant le prochain audit]

## Statut des Actions Précédentes
[Suivi des corrections]
```

---

## Incident Response Plan

### Niveaux d'Incident

| Niveau | Description | Exemple | Temps de réponse |
|--------|-------------|---------|------------------|
| **P1 - Critique** | Service down, breach | Data leak, site offline | Immédiat (< 15 min) |
| **P2 - Majeur** | Fonctionnalité critique cassée | Paiements ne marchent pas | < 1 heure |
| **P3 - Mineur** | Fonctionnalité non-critique | Image ne charge pas | < 24 heures |
| **P4 - Faible** | Amélioration possible | UX improvement | Prochain sprint |

### Procédure P1 (Critique)

```
1. IMMÉDIAT (0-15 min)
   └── Identifier et confirmer l'incident
   └── Notifier : CTO + Lead Dev + Support
   └── Créer canal Slack #incident-[nom]
   └── Commencer documentation timeline

2. CONTAINMENT (15-60 min)
   └── Isoler les systèmes affectés
   └── Bloquer les IPs malveillantes si besoin
   └── Préserver les logs (evidence)
   └── Décider : shutdown partiel ou total ?

3. ERADICATION (1-4h)
   └── Identifier la cause racine
   └── Appliquer le fix (patch/hotfix)
   └── Vérifier que le fix fonctionne

4. RECOVERY (4-8h)
   └── Restaurer les services progressivement
   └── Monitor intensivement
   └── Communiquer aux utilisateurs

5. POST-MORTEM (1-7 jours)
   └── Rédiger rapport d'incident
   └── Identifier les améliorations
   └── Mettre à jour les procédures
   └── Partager les apprentissages
```

### Contacts d'Urgence

| Rôle | Nom | Téléphone | Email |
|------|-----|-----------|-------|
| CTO | XXX | +213 XXX XX XX XX | cto@algeria.dz |
| Lead Dev | XXX | +213 XXX XX XX XX | lead@algeria.dz |
| DevOps | XXX | +213 XXX XX XX XX | devops@algeria.dz |
| Support | XXX | +213 XXX XX XX XX | support@algeria.dz |

### Communication Incident

**Template pour utilisateurs :**

> 🚨 **Incident en cours**
>
> Nous sommes actuellement conscients d'un problème affectant [service].
> 
> **Impact :** [description brève]
> **Statut :** En cours d'investigation
> 
> Nous travaillons à résoudre ce problème dans les plus brefs délais.
> Prochaine mise à jour dans [X] heures.
>
> — L'équipe AlgeriaTrade

---

## Ressources

### Outils de Sécurité
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/archive/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

### Formation
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/) (Practice)
- [PortSwigger Web Security Academy](://portswigger.net/web-security) (Free)

### Standards
- [ISO 27001](https://www.iso.org/standard/27001) (Information Security)
- [SOC 2 Type II](https://www.aicpa.org/soc2) (Service Organization Control)

---

*Ce document doit être révisé trimestriellement et après chaque incident majeur.*

*Dernière mise à jour : 2024*
*Classification : CONFIDENTIEL - Équipe Technique uniquement*
