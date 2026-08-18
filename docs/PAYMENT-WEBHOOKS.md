# Payment Webhook Configuration Guide

## AlgeriaTrade.dz - Payment Integration Webhooks

This document provides comprehensive instructions for configuring webhooks for all payment providers integrated with AlgeriaTrade.dz.

---

## Table of Contents

1. [Overview](#overview)
2. [SATIM/CIB Webhook](#satimcib-webhook)
3. [Stripe Webhook](#stripe-webhook)
4. [Cryptocurrency Webhook](#cryptocurrency-webhook)
5. [Webhook Security](#webhook-security)
6. [Testing Webhooks](#testing-webhooks)
7. [Troubleshooting](#troubleshooting)

---

## Overview

AlgeriaTrade.dz uses webhooks to receive real-time notifications about payment events from each payment provider. Proper webhook configuration is essential for:

- Automatic order status updates
- Payment confirmation processing
- Refund handling
- Fraud detection alerts

### Base URL Configuration

All webhook URLs are based on your application's base URL:

```
Production: https://algeriatrade.dz
Staging:     https://staging.algeriatrade.dz
Development: https://your-ngrok-id.ngrok-free.app (use ngrok for local testing)
```

**Environment Variable:** `NEXT_PUBLIC_APP_URL`

---

## SATIM/CIB Webhook

### Endpoint Information

| Property | Value |
|----------|-------|
| **Endpoint URL** | `{BASE_URL}/api/payments/satim/notification` |
| **Method** | POST |
| **Content-Type** | application/json |
| **Protocol** | HTTPS required |

### Full URL Examples

```
Production:  https://algeriatrade.dz/api/payments/satim/notification
Staging:     https://staging.algeriatrade.dz/api/payments/satim/notification
Local Dev:   https://your-ngrok-id.ngrok.io/api/payments/satim/notification
```

### Expected Payload Format

SATIM sends POST requests with the following structure:

```json
{
  "merchantId": "001000000000001",
  "orderId": "ORD-20240101-XXXXX",
  "transactionId": "TXN-XXXXXXXX",
  "amount": 150000,
  "currency": "DZD",
  "status": "SUCCESS",
  "paymentMethod": "VISA",
  "authCode": "XXXXXX",
  "timestamp": "2024-01-01T12:00:00Z",
  "signature": "generated_hmac_signature"
}
```

### Status Values

| Status | Description | Action |
|--------|-------------|--------|
| `SUCCESS` | Payment completed successfully | Confirm order, release to escrow |
| `FAILED` | Payment declined | Notify user, retry option |
| `CANCELLED` | User cancelled payment | Return to checkout |
| `PENDING` | Awaiting confirmation | Wait for final status |
| `REFUNDED` | Refund processed | Update order status |

### Setup Instructions (CIB Portal)

1. **Log in to CIB Merchant Portal**
   - Visit: https://www.cib.dz
   - Navigate to merchant dashboard

2. **Access Notification Settings**
   - Go to: Configuration > Notifications > Webhooks
   - Or contact CIB support for configuration assistance

3. **Configure Webhook URL**
   - Enter your full endpoint URL
   - Select notification events (all recommended)

4. **Set Up Authentication**
   - Note your webhook secret from `.env.production`:
     ```
     SATIM_WEBHOOK_SECRET=your_webhook_secret_here
     ```
   - This secret is used to verify request signatures

5. **Test Configuration**
   - Use CIB's test environment first
   - Verify you're receiving notifications
   - Check admin panel at `/admin/payments`

### Contact Information

- **Email:** support@cib.dz
- **Phone:** +213 XX XX XX XX XX
- **Documentation:** Available through merchant portal

---

## Stripe Webhook

### Endpoint Information

| Property | Value |
|----------|-------|
| **Endpoint URL** | `{BASE_URL}/api/payments/stripe/webhook` |
| **Method** | POST |
| **Content-Type** | application/json |
| **Protocol** | HTTPS required |

### Full URL Examples

```
Production:  https://algeriatrade.dz/api/payments/stripe/webhook
Staging:     https://staging.algeriatrade.dz/api/payments/stripe/webhook
Local Dev:   https://your-ngrok-id.ngrok.io/api/payments/stripe/webhook
```

### Monitored Events

The following Stripe events are handled:

| Event | Description | Action |
|-------|-------------|--------|
| `payment_intent.succeeded` | Payment successful | Confirm order, process fulfillment |
| `payment_intent.payment_failed` | Payment failed | Notify user, show error |
| `charge.refunded` | Refund issued | Update order, notify parties |
| `checkout.session.completed` | Checkout complete | Handle post-purchase flow |
| `payment_intent.requires_action` | 3DS auth needed | Redirect user for authentication |

### Setup Instructions (Stripe Dashboard)

1. **Access Stripe Dashboard**
   - Visit: https://dashboard.stripe.com
   - Ensure you're in the correct mode (Test/Live)

2. **Navigate to Webhooks Section**
   - Click "Developers" in sidebar
   - Select "Webhooks"
   - Click "Add endpoint"

3. **Configure Endpoint**
   ```
   Endpoint URL: https://algeriatrade.dz/api/payments/stripe/webhook
   
   Events to listen for:
   □ payment_intent.succeeded          (Required)
   □ payment_intent.payment_failed     (Required)
   □ charge.refunded                   (Required)
   □ checkout.session.completed        (Recommended)
   □ payment_intent.requires_action    (Recommended)
   ```

4. **Get Signing Secret**
   - After creating endpoint, click on it
   - Scroll to "Signing secret" section
   - Click "Reveal" (or create new secret)
   - Copy the secret (`whsec_...`)
   
5. **Update Environment Variables**
   ```bash
   # In .env.production
   STRIPE_WEBHOOK_SECRET=whsec_your_copied_secret_here
   ```

6. **Test Webhook**
   - In Stripe Dashboard > Webhooks
   - Click your endpoint
   - Send test webhook with sample data
   - Check logs for successful delivery

### Stripe CLI for Local Testing

```bash
# Install Stripe CLI
# macOS:
brew install stripe/stripe-cli/stripe

# Linux:
curl -s https://packages.stripe.com/api/gpg/key | sudo apt-key add -
echo "deb https://packages.stripe.com/apt stable main" | sudo tee /etc/apt/sources.list.d/stripe.list
sudo apt-get update && sudo apt-get install stripe

# Login to Stripe
stripe login

# Forward webhooks to local development
stripe forward http://localhost:3000/api/payments/stripe/webhook \
  --events payment_intent.succeeded \
  --events payment_intent.payment_failed \
  --events charge.refunded
```

---

## Cryptocurrency Webhook

### Endpoint Information

| Property | Value |
|----------|-------|
| **Endpoint URL** | `{BASE_URL}/api/payments/crypto/webhook` |
| **Method** | POST |
| **Content-Type** | application/json |
| **Protocol** | HTTPS required |

### Full URL Examples

```
Production:  https://algeriatrade.dz/api/payments/crypto/webhook
Staging:     https://staging.algeriatrade.dz/api/payments/crypto/webhook
Local Dev:   https://your-ngrok-id.ngrok.io/api/payments/crypto/webhook
```

### How Crypto Webhooks Work

Unlike traditional payment processors, cryptocurrency payments use blockchain monitoring:

1. **Payment Initiated**: System generates unique payment address and monitors blockchain
2. **Transaction Detected**: Blockchain monitor detects incoming transaction
3. **Confirmation Pending**: Waits for required confirmations (varies by crypto):
   - USDT TRC20: 12 confirmations (~3 minutes)
   - USDT ERC20: 20 confirmations (~5 minutes)
   - BTC: 3 confirmations (~30 minutes)
   - ETH: 12 confirmations (~3 minutes)
4. **Payment Confirmed**: Webhook triggered with confirmed transaction details
5. **Expiration**: If not confirmed within window (default 2 hours), payment expires

### Expected Payload Format

```json
{
  "eventType": "PAYMENT_CONFIRMED",
  "cryptoType": "USDT",
  "network": "TRC20",
  "txHash": "abc123...def456",
  "amount": "100.50",
  "fromAddress": "TSenderAddress...",
  "toAddress": "TYourWallet...",
  "confirmations": 15,
  "requiredConfirmations": 12,
  "orderId": "ORD-20240101-XXXXX",
  "timestamp": "2024-01-01T12:05:00Z"
}
```

### Event Types

| Event | Description | Action |
|-------|-------------|--------|
| `PAYMENT_DETECTED` | Transaction detected on chain | Update UI: "Payment detected, waiting..." |
| `PAYMENT_CONFIRMED` | Required confirmations reached | Confirm order, release to escrow |
| `CONFIRMATION_UPDATE` | Confirmation count increased | Update progress indicator |
| `PAYMENT_EXPIRED` | Payment window expired | Cancel order, refund if partial |
| `INSUFFICIENT_AMOUNT` | Received less than expected | Alert user, handle discrepancy |

### Setup Instructions

#### 1. Configure Wallet Addresses

Update your environment file with actual wallet addresses:

```bash
# .env.production

# Tether TRC20 (recommended - lowest fees)
USDT_TRC20_WALLET_ADDRESS=YourActualTRC20WalletAddress

# Tether ERC20 (alternative)
USDT_ERC20_WALLET_ADDRESS=YourActualERC20WalletAddress

# Bitcoin
BTC_WALLET_ADDRESS=YourActualBTCWalletAddress

# Ethereum
ETH_WALLET_ADDRESS=YourActualETHWalletAddress
```

#### 2. Set Webhook Secret

```bash
CRYPTO_WEBHOOK_SECRET=your_secure_random_secret_here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

#### 3. Configure Blockchain Explorer APIs (Optional but Recommended)

For reliable transaction monitoring:

```bash
# TronScan API (for TRC20 transactions)
TRONSCAN_API_KEY=your_tronscan_api_key

# Etherscan API (for ERC20 transactions)
ETHERSCAN_API_KEY=your_etherscan_api_key

# BSCScan API (for BEP20 transactions)
BSCSCAN_API_KEY=your_bscscan_api_key
```

#### 4. Enable Crypto Payments

```bash
ENABLE_CRYPTO_PAYMENTS=true
```

### Blockchain Explorer Setup

**TronScan (TRC20)**
1. Visit: https://tronscan.org/
2. Register for API access
3. Get API key from developer portal

**Etherscan (ERC20)**
1. Visit: https://etherscan.io/register
2. Create free API key
3. 100,000 calls/day on free tier

**Blockchain.info (BTC)**
1. No API key required for basic usage
2. Rate limited without key

---

## Webhook Security

### Signature Verification

All payment providers use signature verification:

#### SATIM/CIB HMAC Verification

```typescript
// Signature is verified using SATIM_API_SECRET
// Algorithm: HMAC-SHA256
const signature = hmacSha256(apiSecret, payloadString)
```

#### Stripe Signature Verification

```typescript
// Using @stripe/stripe-js or raw verification
import Stripe from 'stripe'

const event = stripe.webhooks.constructEvent(
  payload,
  signatureHeader,
  webhookSecret
)
```

#### Crypto Webhook Verification

```typescript
// Uses CRYPTO_WEBHOOK_SECRET for HMAC verification
const isValid = timingSafeCompare(
  computedSignature,
  receivedSignature
)
```

### Security Best Practices

1. ✅ Always use HTTPS endpoints
2. ✅ Verify webhook signatures before processing
3. ✅ Store secrets securely (environment variables, vault)
4. ✅ Log all webhook receipts for audit trail
5. ✅ Implement idempotency (handle duplicate webhooks)
6. ❌ Never expose secrets in client-side code
7. ❌ Don't process unverified webhooks
8. ❌ Avoid blocking operations in webhook handlers

### IP Allowlisting (Optional)

Consider restricting webhook sources:

| Provider | IP Ranges |
|----------|-----------|
| SATIM/CIB | Contact CIB for their server IPs |
| Stripe | See: https://stripe.com/docs/ips |
| Crypto | Decentralized - no specific IPs |

---

## Testing Webhooks

### Using ngrok for Local Development

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Start tunneling
ngrok http 3000

# Your webhook URLs become:
# https://random-id.ngrok.io/api/payments/satim/notification
# https://random-id.ngrok.io/api/payments/stripe/webhook
# etc.
```

### Test Cards

#### SATIM/CIB Test Cards

| Card Type | Number | Notes |
|-----------|--------|-------|
| Visa | `4111 1111 1111 1111` | Standard test card |
| Mastercard | `5555 5555 5555 4444` | Standard test card |
| CIB | `6000 0000 0000 0005` | Local Algerian card |

**Any future expiry date, any 3-digit CVV**

#### Stripe Test Cards

See: https://stripe.com/docs/testing

| Card Type | Number | Result |
|-----------|--------|--------|
| Visa | `4242 4242 4242 4242` | Success |
| Declined | `4000 0000 0000 0002` | Card declined |
| 3DS Required | `4000 0025 0000 3155` | 3DS authentication |

### Admin Panel Testing

Visit `/admin/payments` to:

1. View current configuration status
2. Test connections to each provider
3. See webhook delivery logs
4. Toggle payment methods on/off

---

## Troubleshooting

### Common Issues

#### Webhook Not Received

1. **Check URL is correct and publicly accessible**
   ```bash
   curl -X POST https://your-domain.com/api/payments/stripe/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

2. **Verify SSL certificate is valid**
   ```bash
   openssl s_client -connect your-domain.com:443
   ```

3. **Check firewall/security group allows inbound traffic**

#### Signature Verification Failing

1. **Ensure webhook secret matches exactly**
   - No extra whitespace or newline characters
   - Correct secret for environment (test vs live)

2. **Check timestamp tolerance**
   - Webhooks older than ~13 minutes may fail

#### Duplicate Webhook Processing

1. **Implement idempotency keys**
   - Track processed webhook IDs
   - Return 200 OK for duplicates immediately

### Debug Mode

Enable debug logging for detailed webhook information:

```bash
# .env.staging (or development)
DEBUG_MODE=true
LOG_LEVEL=debug
```

Check server logs for webhook payload details.

### Monitoring Webhook Health

Use the admin panel at `/admin/payments` to monitor:

- Last successful webhook receipt per provider
- Error rates and common failures
- Response times
- Configuration issues

---

## Quick Reference

### Environment Variables Summary

```bash
# === SATIM ===
SATIM_MERCHANT_ID=xxx
SATIM_API_KEY=xxx
SATIM_API_SECRET=xxx
SATIM_WEBHOOK_SECRET=xxx

# === STRIPE ===
STRIPE_SECRET_KEY=sk_xxx
STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# === CRYPTO ===
USDT_TRC20_WALLET_ADDRESS=Txxx
USDT_ERC20_WALLET_ADDRESS=0xxx
BTC_WALLET_ADDRESS=bc1qxxx
ETH_WALLET_ADDRESS=0xxx
CRYPTO_WEBHOOK_SECRET=xxx
```

### Endpoint URLs Summary

```
SATIM:   {BASE_URL}/api/payments/satim/notification
Stripe:  {BASE_URL}/api/payments/stripe/webhook
Crypto:  {BASE_URL}/api/payments/crypto/webhook
```

---

## Support & Resources

- **Admin Dashboard:** `/admin/payments`
- **API Documentation:** `/docs/openapi.yaml`
- **GitHub Issues:** Project repository issues section

For payment-specific issues:
- **SATIM/CIB:** support@cib.dz
- **Stripe Support:** https://support.stripe.com
- **Crypto Issues:** Internal dev team

---

*Last Updated: January 2024*
*Version: 1.0.0*
