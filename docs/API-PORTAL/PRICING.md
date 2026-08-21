# AlgeriaTrade.dz API Developer Portal - Pricing & Plans

## Tarification et Plans d'Abonnement | أسعار وخطط الاشتراك

---

## Tableau des Plans / جدول الخطط

| Fonctionnalité | **Gratuit** | **Pro** | **Enterprise** |
|----------------|-------------|----------|----------------|
| **Prix** | 0 DZD | **9,990 DZD/mois** | **Sur devis** |
| **Prix Annuel** | 0 DZD | **99,900 DZD/an** (2 mois offerts) | Sur devis |
| **Requêtes/mois** | 1,000 | 100,000 | Illimité |
| **Rate Limit** | 10 req/min | 100 req/min | 1,000 req/min |
| **Niveaux d'accès** | APIs Publiques | Tous les niveaux | Tous + Bêta |
| **Support** | Communauté | Email (48h) | CSM dédié (24h) |
| **SLA** | Aucun | 99.5% disponibilité | 99.9% disponibilité |
| **Webhooks** | ❌ | ✅ Oui | ✅ Illimité |
| **Marque personnalisée** | ❌ | ❌ | ✅ Oui |
| **Clés API** | 1 | 5 | Illimité |
| **Documentation avancée** | Basique | Complète | + Exemples personnalisés |
| **Sandbox testing** | ✅ | ✅ | ✅ Environnement dédié |
| **Analytics** | De base | Avancé | Custom dashboards |
| **Export données** | ❌ | CSV/JSON | API + ETL support |
| **SSO/SAML** | ❌ | ❌ | ✅ |
| **Audit logs** | 7 jours | 30 jours | Illimité |
| **Support prioritaire** | ❌ | ❌ | ✅ |

---

## Équivalences en Devises / معادلات العملات

| Plan | DZD (دج) | EUR (€) | USD ($) |
|------|----------|---------|---------|
| Gratuit | 0 | €0 | $0 |
| Pro Mensuel | 9,990 دج | ~€55 | ~$60 |
| Pro Annuel | 99,900 دج | ~€550 | ~$600 |
| Enterprise | Sur devis | Sur devis | Sur devis |

*Les taux de change sont indicatifs et basés sur le taux officiel. Le paiement se fait en DZD.*

---

## Méthodes de Paiement Algériennes

### 1. CCP (Chèque Postale) - CIB
```
Bénéficiaire: AlgeriaTrade SARL
Compte CCP: XXXXXXXX-XX
RIB: 00 XXXXXXXXXXXX XX XXXXXX XX
Clé: XX

Référence de paiement: AT-API-[VOTRE_EMAIL]
```

### 2. BaridiMob 📱
- **Numéro marchand**: `ALGATRADE`
- **Montant**: Selon plan choisi
- **Validation**: Instantanée (quelques secondes)

Instructions:
1. Ouvrir l'application BaridiMob
2. Scanner le QR code ou entrer le numéro marchand
3. Confirmer le montant
4. Recevoir la confirmation par SMS

### 3. Cartes Internationales (Visa/Mastercard)
- Acceptées via Stripe/Paymob
- Frais supplémentaires: ~3% pour traitement international
- Débit en DZD avec conversion automatique

### 4. Virement Bancaire
```
Banque: BNA / BEA / CPA
Bénéficiaire: AlgeriaTrade SARL
RIB: Voir facture
Libellé: "API Portal - [Nom Entreprise] - [Mois]"
```

---

## Facturation pour Entreprises Algériennes

### TVA (Taxe sur la Valeur Ajoutée)

| Statut | TVA Applicable |
|--------|----------------|
| Particulier/Startup | Prix TTC affiché |
| Entreprise assujettie | 19% TVA (facture avec TVA récupérable) |
| Export services | Exonération possible (sur justificatif) |

### Format Facture

Toutes les factures incluent:

```json
{
  "invoice": {
    "number": "FAC-2024-001234",
    "date": "2024-01-15",
    "dueDate": "2024-02-15",
    "vendor": {
      "name": "AlgeriaTrade SARL",
      "nif": "000000000000000",
      "nis": "000000000000000",
      "address": "Alger, Algérie",
      "rc": "16A/000000000",
      "art": "00/000000000"
    },
    "customer": {
      "name": "[Votre Entreprise]",
      "nif": "[Votre NIF]",
      "address": "[Votre Adresse]"
    },
    "items": [
      {
        "description": "Plan Pro API Portal - Janvier 2024",
        "quantity": 1,
        "unitPrice": 9990,
        "taxRate": 19,
        "total": 11888.1
      }
    ],
    "subtotal": 9990,
    "taxTotal": 1898.1,
    "total": 11888.1,
    "currency": "DZD",
    "paymentTerms": "30 jours nets",
    "paymentMethods": ["CCP", "BaridiMob", "Virement"]
  }
}
```

### Éléments Obligatoires Facture Algérienne

Pour être conforme à la réglementation algérienne:

- [x] **NIF** (Numéro d'Identification Fiscale)
- [x] **NIS** (Numéro d'Identification Statistique)
- [x] **RC** (Registre du Commerce)
- [x] **ART** (Article d'Imposition)
- [x] **Timbre fiscal** (inclus dans le prix)
- [x] **Mention "Facture établie conformément"**
- [x] **Conditions générales de vente**

---

## FAQ Tarification / الأسئلة الشائعة حول الأسعار

### Q: Puis-je commencer gratuitement et migrer vers un plan payant?
**R**: Oui! Vous pouvez commencer avec le plan gratuit et mettre à niveau à tout moment. Vos clés API et configuration seront conservées.

### Q: Que se passe-t si je dépasse mon quota?
**R**: 
- **Plan Gratuit**: Les requêtes supplémentaires sont rejetées (code 429)
- **Plan Pro**: Surcoût de 0.10 DZD par requête au-delà du quota (plafonné à 50% du forfait)
- **Enterprise**: Pas de plafond strict, facturation à l'usage négociée

### Q: Y a-t-il une période d'essai gratuite pour le plan Pro?
**R**: Oui! 14 jours d'essai gratuit, sans engagement. Aucune carte bancaire requise pour démarrer.

### Q: Comment fonctionne la facturation Enterprise?
**R**: 
- Contrat annuel minimum
- Personne de contact dédiée (Customer Success Manager)
- Négociation des volumes et SLA spécifiques
- Options de paiement: mensuel, trimestriel, annuel avec remise

### Q: Puis-je obtenir un remboursement?
**R**: 
- **14 premiers jours**: Remboursement complet garanti
- **Après 14 jours**: Remboursement au prorata non utilisé (frais de résiliation: 10%)

### Q: Y a-t-il des réductions pour les startups algériennes?
**R**: Oui! Programme spécial pour startups incubées:
- 6 mois gratuits sur le plan Pro
- Conditions: Incubateur reconnu, < 2 ans d'existence, < 10 employés
- Postuler via: startup@algeriatrade.dz

### Q: Comment les paiements BaridiMob sont-ils traités?
**R**: 
- Confirmation instantanée
- Reçu envoyé par email dans les 5 minutes
- Accès activé immédiatement après confirmation

---

## Comparaison Concurrentielle

| Fonctionnalité | AlgeriaTrade.dz | Made-in-China | Kompass Algérie |
|---------------|-----------------|---------------|-----------------|
| **Prix départ** | Gratuit | Payant | Payant |
| **Focus marché** | Algérie exclusivement | Chine → Monde | France/Europe |
| **APIs locales** | ✅ CCP, BaridiMob | ❌ | ❌ |
| **Données wilayas** | ✅ 58 wilayas | ❌ | Partiel |
| **Support arabe/français** | ✅ Bilingue | Anglais/Chinois | Français |
| **SLA local** | ✅ Serveurs Algérie | ❌ Hors zone | Variable |
| **Paiement DZD** | ✅ Natif | ❌ Devise étrangère | Variable |

---

## Contact Commercial

Pour toute question sur nos tarifs ou pour obtenir un devis Enterprise:

📧 **Email**: sales@algeriatrade.dz  
📞 **Téléphone**: +213 (0) XXX XX XX XX  
💬 **WhatsApp**: +213 XXX XX XX XX  
🏢 **Adresse**: Alger, Algérie  

**Horaires support commercial**:
- Lundi - Vendredi: 09h00 - 17h00 (Heure Algérie)
- Samedi: 09h00 - 13h00

---

*Mis à jour: $(date '+%Y-%m-%d')*
*Tarifs sujets à modification sans préavis*
