# 🔒 SSL Certificate Setup Guide for AlgeriaTrade.dz
# Guide de Configuration des Certificats SSL pour AlgeriaTrade.dz

This guide covers SSL/TLS certificate setup for securing AlgeriaTrade.dz in production.

Ce guide couvre la configuration des certificats SSL/TLS pour sécuriser AlgeriaTrade.dz en production.

---

## Table of Contents / Table des Matières

1. [Overview](#overview--aperçu)
2. [Prerequisites](#prerequisites--prérequis)
3. [Option 1: Let's Encrypt with Certbot](#option-1-lets-encrypt-with-certbot)
4. [Option 2: Manual Certificate Installation](#option-2-manual-certificate-installation)
5. [Option 3: Cloudflare SSL (Recommended)](#option-3-cloudflare-ssl-recommended)
6. [Nginx SSL Configuration](#nginx-ssl-configuration)
7. [Certificate Renewal Automation](#certificate-renewal-automation)
8. [Troubleshooting](#troubleshooting--dépannage)

---

## Overview / Aperçu

SSL certificates encrypt data between users and your server, ensuring:
Les certificats SSL chiffrent les données entre les utilisateurs et votre serveur, assurant:

- **Data Security** / **Sécurité des Données**: Encryption of sensitive business data
- **User Trust** / **Confiance des Utilisateurs**: Browser security indicators
- **SEO Benefits** / **Avantages SEO**: Search engines prefer HTTPS sites
- **Compliance** / **Conformité**: Required for payment processing (CIB, BaridiMob, CCP)

### Recommended Providers / Fournisseurs Recommandés

| Provider | Cost | Difficulty | Best For |
|----------|------|------------|----------|
| Let's Encrypt | Free | Easy | Self-managed servers |
| Cloudflare | Free/Paid | Easiest | Most setups |
| DigiCom | Paid | Medium | Enterprise |

---

## Prerequisites / Prérequis

Before setting up SSL, ensure you have:

Avant de configurer le SSL, assurez-vous d'avoir :

```bash
# A domain name pointing to your server
# Un nom de domaine pointant vers votre serveur
algeriatrade.dz → YOUR_SERVER_IP

# Server access (SSH or direct)
# Accès au serveur (SSH ou direct)
ssh user@your-server-ip

# Required packages (Ubuntu/Debian)
# Paquets requis (Ubuntu/Debian)
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx openssl
```

### Domain DNS Configuration / Configuration DNS du Domaine

Ensure these DNS records exist:

Assurez-vous que ces enregistrements DNS existent :

```
Type    Name            Value                   TTL
A       @               YOUR_SERVER_IP          3600
A       www             YOUR_SERVER_IP          3600
CNAME   *               algeriatrade.dz         3600  (for subdomains)
```

**For Algerian domains (.dz):**
Pour les domaines algériens (.dz) :
- Register through NIC.DZ or accredited registrar
- DNS propagation may take 24-48 hours
- Use `dig algeriatrade.dz` to verify DNS

---

## Option 1: Let's Encrypt with Certbot

This is the recommended free option for most deployments.

C'est l'option gratuite recommandée pour la plupart des déploiements.

### Step 1: Install Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx

# Or using snap (universal)
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
```

### Step 2: Obtain Certificate (Automatic)

**For servers with Nginx already running:**

```bash
# Automatic Nginx configuration
sudo certbot --nginx -d algeriatrade.dz -d www.algeriatrade.dz

# Follow the prompts:
# 1. Enter email for renewal notices
# 2. Agree to terms of service
# 3. Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

**What this does automatically:**
Ce que cela fait automatiquement :
- Obtains SSL certificate from Let's Encrypt
- Modifies Nginx configuration for HTTPS
- Sets up automatic HTTP→HTTPS redirect
- Creates cron job for auto-renewal

### Step 3: Obtain Certificate (Manual Mode)

If you need more control or use a different web server:

Si vous avez besoin de plus de contrôle ou utilisez un autre serveur web :

```bash
# Standalone mode (temporarily uses port 80)
sudo certbot certonly --standalone -d algeriatrade.dz -d www.algeriatrade.dz

# Webroot mode (keeps your server running)
sudo certbot certonly --webroot -w /var/www/html -d algeriatrade.dz -d www.algeriatrade.dz

# DNS challenge (for wildcard certificates)
sudo certbot certonly --manual --preferred-challenges dns -d "*.algeriatrade.dz" -d algeriatrade.dz
```

### Step 4: Verify Certificate

```bash
# Check certificate location
ls -la /etc/letsencrypt/live/algeriatrade.dz/

# Should see:
# cert.pem  -> Full certificate chain
# chain.pem -> Intermediate certificates
# fullchain.pem -> Combined cert + chain (use this for Nginx)
# privkey.pem -> Private key (KEEP SECURE!)

# Test certificate
openssl x509 -in /etc/letsencrypt/live/algeriatrade.dz/fullchain.pem -text -noout

# Online SSL test (from any machine)
curl -I https://algeriatrade.dz

# Or use online tools:
# - https://www.ssllabs.com/ssltest/
# - https:// Observatory.mozilla.org
```

---

## Option 2: Manual Certificate Installation

Use this if you purchased a certificate from a CA (DigiCom, GlobalSign, etc.)

Utilisez ceci si vous avez acheté un certificat auprès d'une AC (DigiCom, GlobalSign, etc.)

### Step 1: Generate CSR (Certificate Signing Request)

```bash
# Create directory for certificates
sudo mkdir -p /etc/nginx/ssl/algeriatrade.dz
cd /etc/nginx/ssl/algeriatrade.dz

# Generate private key and CSR
sudo openssl req -new -newkey rsa:4096 -nodes \
    -keyout privkey.pem \
    -out algeriatrade.csr \
    -subj "/C=DZ/O=AlgeriaTrade/CN=algeriatrade.dz" \
    -addext "subjectAltName=DNS:algeriatrade.dz,DNS:www.algeriatrade.dz,DNS:*.algeriatrade.dz"

# View CSR (send this to your CA)
cat algeriatrade.csr
```

### Step 2: Submit CSR to Certificate Authority

Send the CSR content to your CA:
- **DigiCom Algeria**: https://www.digicom.dz
- **GlobalSign**: https://www.globalsign.com
- **Sectigo**: https://www.sectigo.com

You'll receive typically receive:
- Your domain certificate (`domain.crt`)
- Intermediate certificate(s) (`intermediate.crt` or `ca-bundle.crt`)

### Step 3: Install Certificate Files

```bash
# Place received files
# Placez les fichiers reçus
sudo cp domain.crt /etc/nginx/ssl/algeriatrade.dz/cert.pem
sudo cp intermediate.crt /etc/nginx/ssl/algeriatrade.dz/chain.pem

# Combine into fullchain (required by most browsers)
# Combiner en fullchain (requis par la plupart des navigateurs)
sudo sh -c 'cat cert.pem chain.pem > fullchain.pem'

# Verify permissions (private key should be restricted)
# Vérifier les permissions (la clé privée doit être restreinte)
sudo chmod 600 privkey.pem
sudo chmod 644 fullchain.pem cert.pem chain.pem

# Directory structure should be:
/etc/nginx/ssl/algeriatrade.dz/
├── privkey.pem      # Private key (600 permissions)
├── cert.pem         # Domain certificate
├── chain.pem        # Intermediate CA
├── fullchain.pem    # cert + chain combined
└── algeriatrade.csr # Original CSR (can be deleted after issuance)
```

### Step 4: Generate Self-Signed Certificate (Development Only)

⚠️ **Only for development/testing! Browsers will show warnings!**

⚠️ **Uniquement pour développement/test ! Les navigateurs afficheront des avertissements !**

```bash
# Generate self-signed certificate valid for 365 days
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/selfsigned.key \
    -out /etc/nginx/ssl/selfsigned.crt \
    -subj "/C=DZ/O=AlgeriaTrade Dev/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:*.local"

# For local development with multiple domains
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/dev.key \
    -out /etc/nginx/ssl/dev.crt \
    -config <(
        echo '[req]'
        echo 'distinguished_name = req'
        echo 'x509_extensions = v3_req'
        echo '[v3_req]'
        echo 'subjectAltName = @alt_names'
        echo '[alt_names]'
        echo 'DNS.1 = localhost'
        echo 'DNS.2 = *.algeriatrade.local'
        echo 'DNS.3 = 127.0.0.1'
        echo '[req]'
        echo 'CN = AlgeriaTrade Dev'
    )
```

---

## Option 3: Cloudflare SSL (Recommended)

Cloudflare provides free SSL with additional benefits:
- DDoS protection
- CDN acceleration
- Web Application Firewall (WAF)
- Always Online™

### Setup Steps / Étapes de Configuration

1. **Sign up for Cloudflare** / **Inscrivez-vous à Cloudflare**
   - Visit https://dash.cloudflare.com/sign-up
   - Add your domain: `algeriatrade.dz`

2. **Update Nameservers** / **Met à jour les serveurs de noms**
   
   At your domain registrar (NIC.DZ):
   ```
   nameserver1.ns.cloudflare.com
   nameserver2.ns.cloudflare.com
   ```

3. **Configure SSL Settings** / **Configurer les paramètres SSL**

   In Cloudflare Dashboard → SSL/TLS:
   
   | Setting | Recommended Value | Description |
   |---------|-------------------|-------------|
   | Encryption mode | **Full (Strict)** | End-to-end encryption |
   | Always Use HTTPS | ON | Redirect HTTP→HTTPS |
   | TLS Version | 1.2+ minimum | Disable old insecure versions |
   | HSTS | Enable | Force browser HTTPS |

4. **Origin Server Certificate** / **Certificat Serveur d'Origine**

   Download Cloudflare Origin Certificate:
   - SSL/TLS → Origin Server → Create Certificate
   - Valid for 15 years
   - Only works behind Cloudflare

   ```bash
   # Save as:
   /etc/nginx/ssl/cloudflare-origin.pem      # Certificate
   /etc/nginx/ssl/cloudflare-origin.key      # Private key
   ```

5. **Page Rules** / **Règles de Page**

   Set up rules for AlgeriaTrade:
   - `*algeriatrade.dz/*` → SSL: Full, Cache Level: Standard
   - `algeriatrade.dz/api/*` → Cache Level: No Cache, Security Level: High

---

## Nginx SSL Configuration

Complete Nginx configuration for AlgeriaTrade.dz with SSL:

Configuration Nginx complète pour AlgeriaTrade.dz avec SSL :

### SSL Configuration Snippet

Create `/etc/nginx/snippets/ssl-algeriatrade.conf`:

```nginx
# SSL Configuration for AlgeriaTrade.dz
# Configuration SSL pour AlgeriaTrade.dz

# Certificate paths (adjust based on your setup)
ssl_certificate /etc/letsencrypt/live/algeriatrade.dz/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/algeriatrade.dz/privkey.pem;

# Modern SSL configuration / Configuration SSL moderne
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# Session settings / Paramètres de session
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# OCSP Stapling / Agrafage OCSP
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/algeriatrade.dz/chain.pem;

# Security headers / En-têtes de sécurité
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;

# SSL buffers / Tampons SSL
ssl_buffer_size 4k;
```

### Complete Nginx Site Configuration

Create `/etc/nginx/sites-available/algeriatrade.dz`:

```nginx
# AlgeriaTrade.dz - Production Nginx Configuration
# Configuration Nginx de Production pour AlgeriaTrade.dz

# HTTP → HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name algeriatrade.dz www.algeriatrade.dz;
    
    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    # Redirect everything else to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name algeriatrade.dz www.algeriatrade.dz;
    
    # Include SSL configuration
    include snippets/ssl-algeriatrade.conf;
    
    # Access & Error logs
    access_log /var/log/nginx/algeriatrade_access.log;
    error_log /var/log/nginx/algeriatrade_error.log;
    
    # Root directory
    root /opt/algeriatrade/public;
    index index.html;
    
    # Next.js App (reverse proxy)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 120s;
    }
    
    # API routes (longer timeout for heavy operations)
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Longer timeouts for API
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 300s;
    }
    
    # Socket.IO (real-time messaging)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;
    
    # Client body size limit (for file uploads)
    client_max_body_size 50M;
}

# WWW redirect (optional - choose canonical domain)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.algeriatrade.dz;
    
    include snippets/ssl-algeriatrade.conf;
    
    return 301 https://algeriatrade.dz$request_uri;
}
```

### Enable Site / Activer le Site

```bash
# Create symlink to enable site
sudo ln -sf /etc/nginx/sites-available/algeriatrade.dz /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Certificate Renewal Automation

### Let's Encrypt Auto-Renewal

Let's Encrypt certificates are valid for 90 days. Certbot sets up automatic renewal:

Les certificats Let's Encrypt sont valides pendant 90 jours. Certbot configure le renouvellement automatique :

```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# Check timer
sudo systemctl list-timers | grep certbot

# Manual renewal (if needed)
sudo certbot renew

# Renew and reload nginx
sudo certbot renew --deploy-hook "systemctl reload nginx"
```

### Setup Renewal Reminder Script

Create `/opt/scripts/ssl-check.sh`:

```bash
#!/bin/bash
# SSL Certificate Expiry Checker
# Vérificateur d'Expiration de Certificat SSL

DOMAIN="algeriatrade.dz"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
WARN_DAYS=30
CRIT_DAYS=14

# Get expiry date
EXPIRY_DATE=$(openssl x509enddate -noout -in "$CERT_PATH" 2>/dev/null | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

# Send alert if needed
if [ "$DAYS_LEFT" -le "$CRIT_DAYS" ]; then
    echo "CRITICAL: SSL certificate expires in $DAYS_LEFT days!"
    # Send email/slack notification here
    exit 2
elif [ "$DAYS_LEFT" -le "$WARN_DAYS" ]; then
    echo "WARNING: SSL certificate expires in $DAYS_LEFT days"
    exit 1
else
    echo "OK: SSL certificate valid for $DAYS_LEFT more days"
    exit 0
fi
```

Add to crontab (check daily):

```bash
# Edit crontab
crontab -e

# Add line (check daily at 9 AM)
0 9 * * * /opt/scripts/ssl-check.sh >> /var/log/ssl-check.log 2>&1
```

### Manual Certificate Renewal (Paid Certificates)

For certificates from other CAs:

Pour les certificats d'autres AC :

```bash
# Usually requires generating new CSR before expiry
# Généralement nécessite un nouveau CSR avant expiration

# 30 days before expiry, start renewal process:
# 30 jours avant expiration, démarrer le processus de renouvellement:

# 1. Generate new CSR
sudo openssl req -new -key privkey.pem -out new-csr.pem

# 2. Submit to CA
# 3. Receive new certificate
# 4. Replace files
# sudo cp new-cert.crt cert.pem
# sudo cp new-chain.crt chain.pem
# sudo sh -c 'cat cert.pem chain.pem > fullchain.pem'

# 5. Reload nginx
sudo systemctl reload nginx
```

---

## Troubleshooting / Dépannage

### Common Issues / Problèmes Courants

#### Certificate Not Trusted / Certificat Non Fiable

```bash
# Check certificate chain
openssl s_client -connect algeriatrade.dz:443 -servername algeriatrade.dz

# Verify intermediate certificates are included
openssl verify -untrusted intermediate.crt fullchain.pem
```

#### Mixed Content Warning / Avertissement de Contenu Mixte

Your page loads resources over HTTP while on HTTPS:

Votre page charge des ressources en HTTP alors qu'elle est en HTTPS :

```bash
# Find HTTP resources in your code
grep -r "http://" src/ --include="*.tsx" --include="*.ts" --include="*.jsx"
grep -r "http://" public/

# Fix by making URLs protocol-relative or using NEXT_PUBLIC_APP_URL
# Corriger en rendant les URL relatives au protocole ou en utilisant NEXT_PUBLIC_APP_URL
```

#### SSL Handshake Failure / Échec du Handshake SSL

```bash
# Check SSL configuration
openssl s_client -connect algeriatrade.dz:443 -debug

# Common causes:
# - Wrong certificate path
# - Incorrect private key
# - Firewall blocking 443
# - Old TLS version required by client
```

#### Certificate Renewal Failed / Échec du Renouvellement

```bash
# Check certbot logs
sudo journalctl -u certbot -f

# Try manual renewal with verbose output
sudo certbot renew --verbose

# Common fixes:
# - Ensure port 80 is open for validation
# - Check DNS still points correctly
# - Verify domain isn't expired
```

### Useful Commands / Commandes Utiles

```bash
# Check certificate details
openssl x509 -in /etc/letsencrypt/live/algeriatrade.dz/fullchain.pem -text -noout

# Check certificate expiry
echo | openssl s_client -connect algeriatrade.dz:443 2>/dev/null | openssl x509 -noout -dates

# Test SSL configuration
testssl.sh algeriatrade.dz  # Install from https://testssl.sh/

# Check TLS versions supported
nmap --script ssl-enum-ciphers -p 443 algeriatrade.dz

# Nginx debug mode
sudo nginx -T  # Show full configuration

# Check SSL labs rating
# https://www.ssllabs.com/ssltest/analyze.html?d=algeriatrade.dz
```

### SSL Hardening Score

Target an "A+" rating on SSL Labs:

Visez un classement "A+" sur SSL Labs :

| Setting | Value | Points |
|---------|-------|--------|
| Protocols | TLS 1.2, 1.3 only | Required |
| Key Exchange | ECDHE only | Strong |
| Cipher Strength | 128-bit+ minimum | Required |
| Forward Secrecity | All suites support | Required |
| HSTS | Max-age ≥ 6 months | + points |
| OCSP Stapling | Enabled | + points |

---

## Quick Reference / Référence Rapide

```bash
# Full setup with Let's Encrypt (one-liner)
sudo certbot --nginx -d algeriatrade.dz -d www.algeriatrade.dz --redirect --hsts --staple-ocsp

# Test configuration
sudo nginx -t && sudo systemctl reload nginx

# Check certificate status
certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Emergency: Temporarily disable SSL (comment ssl lines in nginx config)
sudo nano /etc/nginx/sites-available/algeriatrade.dz
sudo systemctl reload nginx
```

---

## Support / Support

- **Let's Encrypt Community**: https://community.letsencrypt.org/
- **Nginx SSL Docs**: https://nginx.org/en/docs/http/configuring_https_servers.html
- **SSL Labs Test**: https://www.ssllabs.com/ssltest/

---

*Last updated: $(date +%Y-%m-%d)*
*Dernière mise à jour: $(date +%Y-%m-%d)*
