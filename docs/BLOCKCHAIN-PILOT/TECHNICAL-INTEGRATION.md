# AlgeriaTrack.dz Blockchain Pilot - Technical Integration Guide

## API & SDK Documentation for Supply Chain Tracking

**Version:** 2.0  
**API Base URL:** `https://api.algeriatrack.dz/v1` (Production) / `https://api-pilot.algeriatrack.dz/v1` (Pilot)  
**Last Updated:** 2024

---

## Table of Contents

1. [Authentication Setup](#1-authentication-setup)
2. [API Endpoints](#2-api-endpoints)
3. [SDK Integration](#3-sdk-integration)
4. [Data Formats](#4-data-formats)
5. [Webhook Configuration](#5-webhook-configuration)
6. [Error Handling](#6-error-handling)
7. [Rate Limiting & Quotas](#7-rate-limiting--quotas)
8. [Code Examples](#8-code-examples)

---

## 1. Authentication Setup

### API Key Authentication

All API requests require authentication using API keys generated during pilot onboarding.

#### Header-Based Authentication

```http
Authorization: Bearer at_live_xxxxxxxxxxxx
X-API-Key: at_live_xxxxxxxxxxxx
X-API-Secret: secret_xxxxxxxxxxxx
X-Pilot-ID: pilot_dz_XXXXX
Content-Type: application/json
```

#### Request Signing (High-Security Mode)

For sensitive operations (certificate issuance, admin actions), request signing is required:

```typescript
import crypto from 'crypto';

interface SignedRequest {
  url: string;
  method: string;
  body: string;
  timestamp: number;
  signature: string;
}

function createSignedRequest(
  apiKey: string,
  apiSecret: string,
  method: string,
  url: string,
  body?: object
): SignedRequest {
  const timestamp = Math.floor(Date.now() / 1000);
  const bodyString = body ? JSON.stringify(body) : '';
  
  // Create signature payload
  const payload = [
    method.toUpperCase(),
    url,
    timestamp,
    bodyString
  ].join('\n');
  
  // HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(payload)
    .digest('hex');
  
  return { url, method, body: bodyString, timestamp, signature };
}

// Usage in request headers
const signed = createSignedRequest(
  'at_live_xxxxxxxxxxxx',
  'secret_xxxxxxxxxxxx',
  'POST',
  '/products',
  { name: 'Test Product' }
);

// Headers:
// X-Timestamp: signed.timestamp
// X-Signature: signed.signature
```

### OAuth 2.0 Integration (Enterprise)

For enterprise integrations with existing identity providers:

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=your_client_id
&client_secret=your_client_secret
&scope=blockchain:read blockchain:write
```

Response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "blockchain:read blockchain:write"
}
```

### Token Refresh

Access tokens expire after 1 hour. Implement automatic refresh:

```typescript
async function getValidToken(): Promise<string> {
  if (tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }
  
  const response = await fetch('/oauth/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenCache.refreshToken
    })
  });
  
  const data = await response.json();
  tokenCache = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  };
  
  return data.access_token;
}
```

---

## 2. API Endpoints

### 2.1 Product Registration

#### Register New Product

```http
POST /products
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "externalId": "SAI-PROD-001",
  "name": {
    "ar": "باراسيتامول 500مغ",
    "fr": "Paracetamol 500mg",
    "en": "Paracetamol 500mg"
  },
  "category": "pharmaceutical_finished",
  "description": {
    "ar": "دواء مسكن للألم وخافض للحرارة",
    "fr": "Antalgique et antipyrétique",
    "en": "Pain reliever and fever reducer"
  },
  "regulatoryInfo": {
    "authorizationNumber": "AMM-2024-12345",
    "authorizationDate": "2024-01-15",
    "issuingAuthority": "ANPP"
  },
  "trackingConfig": {
    "requiresTemperatureLogging": true,
    "requiresHumidityLogging": true,
    "temperatureRange": {
      "min": 15,
      "max": 25,
      "unit": "celsius"
    }
  },
  "metadata": {
    "manufacturer": "SAIDAL SPA",
    "manufacturingSite": "Oued Smar, Algiers",
    "dosageForm": "Tablet",
    "strength": "500mg"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "productId": "prod_abc123def456",
    "blockchainToken": "bct_789ghi012jkl",
    "externalId": "SAI-PROD-001",
    "status": "active",
    "qrCodeUrl": "https://qr.algeriatrack.dz/prod_abc123def456",
    "createdAt": "2024-01-15T10:30:00Z",
    "blockchainTxHash": "0xabcdef123456789..."
  }
}
```

#### Batch Register Products (Bulk Upload)

```http
POST /products/batch
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | CSV or JSON file (max 10MB) |
| `template` | String | No | Template ID for field mapping |
| `validateOnly` | Boolean | No | If true, only validates without creating |

**CSV Format Example:**
```csv
externalId,name_ar,name_fr,name_en,category,auth_number,temp_required
PROD-001,باراسيتامول,Paracetamol,Paracetamol,pharmaceutical_finished,AMM-001,true
PROD-002,أموكسيسيللين,Amoxicillin,Amoxicillin,pharmaceutical_finished,AMM-002,true
```

#### Get Product Details

```http
GET /products/{productId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": "prod_abc123def456",
    "externalId": "SAI-PROD-001",
    "name": { "ar": "...", "fr": "...", "en": "..." },
    "category": "pharmaceutical_finished",
    "status": "active",
    "totalBatches": 145,
    "totalEvents": 2890,
    "certificatesIssued": 142,
    "lastEvent": {
      "type": "WAREHOUSE_OUT",
      "timestamp": "2024-01-20T14:22:00Z",
      "location": "Oran Distribution Center"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2.2 Supply Chain Event Logging

#### Log Supply Chain Event

```http
POST /events
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "batchId": "batch_xyz789",
  "eventType": "WAREHOUSE_IN",
  "timestamp": "2024-01-20T08:30:00Z",
  "location": {
    "name": "Biskra Central Warehouse",
    "address": "Route de Touggourt, Biskra",
    "coordinates": {
      "latitude": 34.8146,
      "longitude": 5.0654
    },
    "wilayaCode": "07"
  },
  "operator": {
    "id": "user_123",
    "name": "Mohammed Benali",
    "role": "warehouse_operator"
  },
  "readings": {
    "temperature": 18.5,
    "humidity": 45,
    "unit": "celsius"
  },
  "attachments": [
    {
      "type": "photo",
      "url": "https://storage.algeriatrack.dz/photos/img001.jpg",
      "caption": "Receiving inspection photo"
    }
  ],
  "notes": "Batch received in good condition. All pallets intact.",
  "metadata": {
    "supplierDeliveryNote": "DN-2024-01234",
    "palletCount": 50,
    "unitCount": 5000
  }
}
```

**Event Types Reference:**

| Event Type | Category | Description | Required Fields |
|------------|----------|-------------|-----------------|
| `PRODUCTION` | Manufacturing | Production completion | batchId, quantity, qualityScore |
| `QUALITY_CONTROL` | Quality | QC inspection result | batchId, status, inspectorId, testResults |
| `QC_APPROVED` | Quality | QC approval | batchId, certificateRef |
| `QC_REJECTED` | Quality | QC rejection | batchId, reason, remediationPlan |
| `PACKAGING` | Operations | Packaging completed | batchId, packagingType, unitsPerPackage |
| `WAREHOUSE_IN` | Logistics | Goods receipt | batchId, location, supplierInfo |
| `WAREHOUSE_OUT` | Logistics | Goods issue | batchId, location, destination |
| `TRANSPORT` | Logistics | In transit | batchId, carrier, route, estimatedArrival |
| `CUSTOMS` | Regulatory | Customs clearance | batchId, customsRef, clearanceStatus |
| `DISTRIBUTION_CENTER` | Logistics | DC receipt/issue | batchId, dcName, action |
| `RETAIL` | Sales | Retail receipt | batchId, retailerName, consumerFacing |

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "eventId": "evt_abc123def456",
    "batchId": "batch_xyz789",
    "eventType": "WAREHOUSE_IN",
    "status": "confirmed",
    "blockchainTxHash": "0x123abc456def...",
    "confirmationCount": 3,
    "confirmedAt": "2024-01-20T08:30:05Z",
    "verificationUrl": "https://algeriatrack.dz/verify/event/evt_abc123def456"
  }
}
```

#### Query Events

```http
GET /events?batchId={batchId}&startDate={date}&endDate={date}&type={eventType}&limit={limit}&offset={offset}
Authorization: Bearer {token}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `batchId` | String | Filter by batch ID |
| `productId` | String | Filter by product ID |
| `startDate` | ISO Date | Events from this date |
| `endDate` | ISO Date | Events until this date |
| `type` | String | Event type filter |
| `location` | String | Location name search |
| `operator` | String | Operator ID filter |
| `limit` | Number | Results per page (default: 50, max: 200) |
| `offset` | Number | Pagination offset |

### 2.3 Certificate Generation API

#### Generate Digital Certificate

```http
POST /certificates
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "batchId": "batch_xyz789",
  "certificateType": "ORIGIN_CERTIFICATE",
  "templateId": "tpl_pharma_origin_v1",
  "data": {
    "productName": "Paracetamol 500mg",
    "manufacturer": "SAIDAL SPA",
    "manufacturingDate": "2024-01-10",
    "batchNumber": "BT-2024-001234",
    "manufacturingSite": "Oued Smar, Algiers",
    "quantity": 10000,
    "unit": "tablets",
    "qualityStandard": "GMP-WHO",
    "authorizedFor": "Algerian Market",
    "expiryDate": "2026-01-10"
  },
  "signatory": {
    "name": "Dr. Fatima Zohra",
    "title": "Quality Assurance Director",
    "digitalSignature": "sig_base64_encoded..."
  },
  "attachments": [
    {
      "type": "lab_report",
      "url": "https://storage.algeriatrack.dz/reports/lab_rpt_001.pdf",
      "name": "Batch Quality Report"
    }
  ],
  "options": {
    "generateQR": true,
    "includeNFT": false,
    "languages": ["ar", "fr", "en"],
    "validityDays": 365
  }
}
```

**Certificate Types:**

| Type | Use Case | Typical Issuer |
|------|----------|----------------|
| `ORIGIN_CERTIFICATE` | Proof of origin | Manufacturer |
| `QUALITY_CERTIFICATE` | Quality conformance | QA Department |
| `ORGANIC_CERTIFICATE` | Organic status | Certification Body |
| `COMPLIANCE_CERTIFICATE` | Regulatory compliance | Authority |
| `EXPORT_CERTIFICATE` | Export documentation | Export Agency |
| `GMP_CERTIFICATE` | GMP compliance | Health Authority |

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "certificateId": "cert_abc123def456",
    "certificateNumber": "AT-CERT-2024-0001234",
    "batchId": "batch_xyz789",
    "type": "ORIGIN_CERTIFICATE",
    "status": "issued",
    "blockchainHash": "0xabc123...def456",
    "blockchainTxHash": "0x789ghi...012jkl",
    "issuedAt": "2024-01-20T09:00:00Z",
    "validUntil": "2025-01-20T09:00:00Z",
    "verificationUrl": "https://algeriatrack.dz/verify/cert_abc123def456",
    "qrCodeUrl": "https://qr.algeriatrack.dz/cert_abc123def456",
    "pdfUrl": "https://storage.algeriatrack.dz/certs/cert_abc123def456.pdf",
    "nftTokenId": null
  }
}
```

#### Verify Certificate

```http
GET /certificates/{certificateId}/verify
```

**Public endpoint - no auth required for verification**

**Response:**
```json
{
  "isValid": true,
  "certificate": {
    "certificateId": "cert_abc123def456",
    "number": "AT-CERT-2024-0001234",
    "type": "ORIGIN_CERTIFICATE",
    "issuer": "SAIDAL SPA",
    "issuedAt": "2024-01-20T09:00:00Z",
    "validUntil": "2025-01-20T09:00:00Z"
  },
  "blockchainVerification": {
    "hashMatches": true,
    "txConfirmed": true,
    "confirmations": 12,
    "blockNumber": 18500000,
    "timestamp": "2024-01-20T09:00:05Z"
  },
  "revocationStatus": {
    "isRevoked": false,
    "reason": null,
    "revokedAt": null
  }
}
```

### 2.4 Batch Management

#### Create Production Batch

```http
POST /batches
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "prod_abc123def456",
  "externalBatchId": "BT-2024-001234",
  "productionDate": "2024-01-10",
  "manufacturingLine": "Line A - Oued Smar",
  "quantity": 10000,
  "unitOfMeasure": "tablets",
  "rawMaterials": [
    {
      "materialName": "Paracetamol Powder",
      "supplierId": "sup_001",
      "batchRef": "RM-BT-2024-99887",
      "quantityUsed": "5 kg"
    }
  ],
  "parameters": {
    "yieldPercentage": 98.5,
    "cycleTime": "4 hours",
    "equipmentId": "EQ-TBL-001"
  },
  "expectedExpiryDate": "2026-01-10"
}
```

---

## 3. SDK Integration

### 3.1 JavaScript/TypeScript SDK

#### Installation

```bash
npm install @algeriatrack/blockchain-sdk
# or
yarn add @algeriatrack/blockchain-sdk
```

#### Initialization

```typescript
import { AlgeriaTrackBlockchain } from '@algeriatrack/blockchain-sdk';

// Initialize client
const client = new AlgeriaTrackBlockchain({
  apiKey: 'at_live_xxxxxxxxxxxx',
  apiSecret: 'secret_xxxxxxxxxxxx',
  pilotId: 'pilot_dz_XXXXX',
  environment: 'pilot', // 'pilot' | 'production'
  options: {
    timeout: 30000,
    retries: 3,
    enableLogging: process.env.NODE_ENV === 'development'
  }
});

export default client;
```

#### Product Operations

```typescript
// Register a single product
const product = await client.products.create({
  externalId: 'SAI-PROD-001',
  name: {
    ar: 'باراسيتامول 500مغ',
    fr: 'Paracetamol 500mg',
    en: 'Paracetamol 500mg'
  },
  category: 'pharmaceutical_finished',
  regulatoryInfo: {
    authorizationNumber: 'AMM-2024-12345'
  },
  trackingConfig: {
    requiresTemperatureLogging: true
  }
});

console.log('Product registered:', product.productId);
console.log('QR Code URL:', product.qrCodeUrl);

// Batch register products
const batchResult = await client.products.batchCreate([
  {
    externalId: 'PROD-001',
    name: { ar: '...', fr: '...', en: '...' },
    category: 'pharmaceutical_finished'
  },
  {
    externalId: 'PROD-002',
    name: { ar: '...', fr: '...', en: '...' },
    category: 'pharmaceutical_finished'
  }
]);

console.log(`Created ${batchResult.created} products`);
console.log(`Errors: ${batchResult.errors.length}`);

// Get product with full history
const productDetails = await client.products.get('prod_abc123');
console.log('Total events:', productDetails.totalEvents);
console.log('Certificates:', productDetails.certificatesIssued);
```

#### Event Logging

```typescript
// Log warehouse receiving event
const event = await client.events.log({
  batchId: 'batch_xyz789',
  eventType: 'WAREHOUSE_IN',
  location: {
    name: 'Biskra Central Warehouse',
    coordinates: { latitude: 34.8146, longitude: 5.0654 },
    wilayaCode: '07'
  },
  operator: {
    id: 'user_123',
    name: 'Mohammed Benali',
    role: 'warehouse_operator'
  },
  readings: {
    temperature: 18.5,
    humidity: 45
  },
  notes: 'Received in good condition'
});

console.log('Event logged:', event.eventId);
console.log('Blockchain TX:', event.blockchainTxHash);

// Log quality control event with attachment
const qcEvent = await client.events.log({
  batchId: 'batch_xyz789',
  eventType: 'QC_APPROVED',
  operator: {
    id: 'qc_001',
    name: 'Dr. Amina Hadj',
    role: 'qc_manager'
  },
  testResults: {
    visualInspection: 'PASS',
    weightCheck: 'PASS',
    labAnalysis: 'PASS',
    overallStatus: 'APPROVED'
  },
  attachments: [
    {
      type: 'document',
      url: 'https://example.com/qc-report.pdf',
      name: 'QC Report BT-2024-001234'
    }
  ]
});
```

#### Certificate Generation

```typescript
// Generate origin certificate
const certificate = await client.certificates.generate({
  batchId: 'batch_xyz789',
  type: 'ORIGIN_CERTIFICATE',
  data: {
    productName: 'Paracetamol 500mg',
    manufacturer: 'SAIDAL SPA',
    manufacturingDate: '2024-01-10',
    batchNumber: 'BT-2024-001234'
  },
  signatory: {
    name: 'Dr. Fatima Zohra',
    title: 'QA Director'
  },
  options: {
    generateQR: true,
    languages: ['ar', 'fr', 'en']
  }
});

console.log('Certificate ID:', certificate.certificateId);
console.log('Verification URL:', certificate.verificationUrl);
console.log('PDF Download:', certificate.pdfUrl);

// Verify a certificate (public method)
const verification = await client.certificates.verify('cert_abc123def456');
console.log('Valid:', verification.isValid);
console.log('On-chain confirmed:', verification.blockchainVerification.txConfirmed);
```

#### Webhook Handler

```typescript
import express from 'express';
import { WebhookHandler } from '@algeriatrack/blockchain-sdk';

const app = express();

const webhookHandler = new WebhookHandler({
  secret: 'whsec_xxxxxxxxxxxx' // Your webhook secret
});

app.post('/webhooks/algeriatrack', 
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      // Verify webhook signature
      const event = webhookHandler.constructEvent(
        req.body,
        req.headers['x-algeriatrack-signature'] as string
      );
      
      // Handle event types
      switch (event.type) {
        case 'event.confirmed':
          await handleEventConfirmed(event.data);
          break;
        case 'certificate.issued':
          await handleCertificateIssued(event.data);
          break;
        case 'batch.completed':
          await handleBatchCompleted(event.data);
          break;
        case 'alert.temperature_exceeded':
          await handleTemperatureAlert(event.data);
          break;
        default:
          console.log('Unhandled event type:', event.type);
      }
      
      res.json({ received: true });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(400).send('Webhook error');
    }
  }
);
```

### 3.2 Python SDK for ERP Integration

#### Installation

```bash
pip install algeriatrack-blockchain-sdk
```

#### Configuration

```python
# config.py
from algeriatrack import AlgeriaTrackClient

# Initialize client
client = AlgeriaTrackClient(
    api_key="at_live_xxxxxxxxxxxx",
    api_secret="secret_xxxxxxxxxxxx",
    pilot_id="pilot_dz_XXXXX",
    environment="pilot"  # or "production"
)
```

#### SAP Integration Example

```python
# sap_integration.py
from algeriatrack import AlgeriaTrackClient
from sap.rfc import SAPConnection

class SAPBlockchainIntegration:
    def __init__(self, sap_config, track_config):
        self.sap = SAPConnection(**sap_config)
        self.track = AlgeriaTrackClient(**track_config)
    
    def sync_production_order(self, sap_order_id):
        """Sync SAP production order to blockchain"""
        
        # Fetch production order from SAP
        order = self.sap.call("BAPI_PRODORD_GET_DETAIL",
            NUMBER=sap_order_id
        )
        
        # Find or create product
        product = self.track.products.get_or_create(
            external_id=order["MATERIAL"],
            defaults={
                "name": {
                    "ar": order["MATERIAL_DESC_AR"],
                    "fr": order["MATERIAL_DESC_FR"],
                    "en": order["MATERIAL_DESC_EN"]
                },
                "category": self._map_category(order["IND_SECTOR"])
            }
        )
        
        # Create batch
        batch = self.track.batches.create(
            product_id=product["product_id"],
            external_batch_id=order["ORDER_ID"],
            production_date=order["PLANNED_START_DATE"],
            quantity=order["TARGET_QUANTITY"],
            unit_of_measure=order["UNIT"]
        )
        
        # Log production event
        event = self.track.events.log(
            batch_id=batch["batch_id"],
            eventType="PRODUCTION",
            location={
                "name": order["WORK_CENTER"],
                "wilaya_code": order["PLANT_WILAYA"]
            },
            parameters={
                "yield_percentage": order["ACTUAL_YIELD"],
                "cycle_time_hours": order["CYCLE_TIME"]
            }
        )
        
        return {
            "sap_order_id": sap_order_id,
            "batch_id": batch["batch_id"],
            "event_id": event["event_id"],
            "blockchain_tx": event["blockchain_tx_hash"]
        }
    
    def _map_category(self, industry_sector):
        """Map SAP industry sector to AlgeriaTrack category"""
        mapping = {
            "PHARMA": "pharmaceutical_finished",
            "FOOD": "date_product",
            "CHEMICAL": "industrial_raw_material",
            "CONSTRUCTION": "cement"
        }
        return mapping.get(industry_sector, "other")
```

#### Odoo Integration Example

```python
# odoo_integration.py
from odoo import OdooClient
from algeriatrack import AlgeriaTrackClient
import json

class OdooBlockchainBridge:
    """
    Bridge between Odoo ERP and AlgeriaTrack Blockchain
    
    Handles:
    - Product synchronization
    - Stock move event logging
    - Picking/transfer tracking
    - Certificate generation for deliveries
    """
    
    def __init__(self):
        self.odoo = OdooClient(
            url=os.environ['ODOO_URL'],
            db=os.environ['ODOO_DB'],
            username=os.environ['ODOO_USER'],
            password=os.environ['ODOO_PASSWORD']
        )
        self.track = AlgeriaTrackClient(
            api_key=os.environ['TRACK_API_KEY'],
            api_secret=os.environ['TRACK_API_SECRET']
        )
    
    def on_stock_move_created(self, stock_move):
        """Hook called when Odoo stock move is created"""
        
        # Determine event type based on location
        if stock_move.location_dest.usage == 'customer':
            event_type = 'WAREHOUSE_OUT'
        elif stock_move.location_src.usage == 'supplier':
            event_type = 'WAREHOUSE_IN'
        else:
            event_type = 'INTERNAL_TRANSFER'
        
        # Get or create blockchain product
        product = self._get_blockchain_product(stock_move.product_id)
        
        # Get or create batch
        batch = self._get_batch(product, stock_move)
        
        # Log the event
        event = self.track.events.log(
            batch_id=batch['batch_id'],
            eventType=event_type,
            location={
                'name': stock_move.location_dest.name,
                'wilaya_code': self._extract_wilaya(stock_move.picking_id)
            },
            operator={
                'id': f"odoo_user_{stock_move.create_uid}",
                'name': self.odoo.get_user_name(stock_move.create_uid),
                'role': 'warehouse_operator'
            },
            readings=self._get_sensor_readings(stock_move),
            metadata={
                'odoo_move_id': stock_move.id,
                'odoo_picking_id': stock_move.picking_id.id,
                'quantity_done': stock_move.quantity_done
            }
        )
        
        # Update Odoo move with blockchain reference
        stock_move.write({
            'x_blockchain_event_id': event['event_id'],
            'x_blockchain_tx_hash': event['blockchain_tx_hash']
        })
        
        return event
    
    def on_delivery_validate(self, picking):
        """Generate delivery certificate when picking is validated"""
        
        certificate = self.track.certificates.generate(
            batch_id=picking.x_batch_id,
            type='DELIVERY_CERTIFICATE',
            data={
                'delivery_note': picking.name,
                'customer': picking.partner_id.name,
                'delivery_address': picking.partner_id.display_address,
                'carrier': picking.carrier_id.name or 'Own Transport',
                'products': [{
                    'name': line.product_id.name,
                    'quantity': line.quantity_done,
                    'uom': line.product_uom.name
                } for line in picking.move_line_ids]
            },
            signatory={
                'name': self.odoo.get_user_name(picking.user_id),
                'title': 'Warehouse Manager'
            }
        )
        
        # Attach certificate PDF to picking
        self._attach_certificate(picking, certificate)
        
        return certificate
```

### 3.3 Mobile SDK for Scanner Apps

#### React Native Installation

```bash
npm install @algeriatrack/react-native-sdk
# For iOS
cd ios && pod install
```

#### Scanner Component Implementation

```tsx
// ScannerScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { 
  AlgeriaTrackScanner,
  useAlgeriaTrackAuth,
  EventTypeSelector,
  TemperatureInput,
  PhotoAttachment
} from '@algeriaTrack/react-native-sdk';

export const ScannerScreen: React.FC = () => {
  const { user, isAuthenticated } = useAlgeriaTrackAuth();
  const [scannedProduct, setScannedProduct] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState('WAREHOUSE_IN');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScanSuccess = useCallback(async (result) => {
    try {
      // Validate scanned code
      const product = await AlgeriaTrackScanner.validateScan(result);
      setScannedProduct(product);
      
      // Auto-detect suggested event type based on context
      const suggestedEvent = await AlgeriaTrackScanner.suggestEventType(
        product.productId,
        user.location
      );
      setSelectedEventType(suggestedEvent);
    } catch (error) {
      Alert.alert('Scan Error', error.message);
    }
  }, [user]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const event = await AlgeriaTrackScanner.logEvent({
        productId: scannedProduct.productId,
        batchId: scannedProduct.activeBatchId,
        eventType: selectedEventType,
        location: user.location,
        operator: {
          id: user.id,
          name: user.name,
          role: user.role
        },
        readings: temperatureReading, // From TemperatureInput component
        attachments: photos // From PhotoAttachment component
      });

      Alert.alert('Success', `Event logged! TX: ${event.blockchainTxHash}`);
      
      // Reset form
      setScannedProduct(null);
      setPhotos([]);
    } catch (error) {
      Alert.alert('Submission Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supply Chain Scanner</Text>
      
      {!scannedProduct ? (
        <AlgeriaTrackScanner.ScannerView
          onScanSuccess={handleScanSuccess}
          onError={(error) => Alert.alert('Error', error.message)}
          supportedFormats={['QR_CODE', 'EAN_13', 'CODE_128']}
        />
      ) : (
        <View style={styles.formContainer}>
          <ProductCard product={scannedProduct} />
          
          <EventTypeSelector
            value={selectedEventType}
            onChange={setSelectedEventType}
            allowedTypes={['WAREHOUSE_IN', 'WAREHOUSE_OUT', 'QC_APPROVED', 'QC_REJECTED']}
          />
          
          {scannedProduct.requiresTempLogging && (
            <TemperatureInput
              onReadingChange={setTemperatureReading}
              unit="celsius"
              range={scannedProduct.tempRange}
            />
          )}
          
          <PhotoAttachment
            maxPhotos={5}
            onPhotosChange={setPhotos}
          />
          
          <Button
            onPress={handleSubmit}
            disabled={isSubmitting}
            title={isSubmitting ? 'Submitting...' : 'Log Event'}
          />
        </View>
      )}
    </View>
  );
};
```

#### Android Native (Kotlin) Implementation

```kotlin
// AlgeriaTrackScanner.kt
package com.algeriatrack.scanner

import android.content.Context
import androidx.camera.core.*
import com.google.gson.Gson
import okhttp3.*
import java.util.concurrent.TimeUnit

class AlgeriaTrackScanner private constructor(
    private val context: Context,
    private val apiKey: String,
    private val apiSecret: String
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    private val baseUrl = "https://api-pilot.algeriatrack.dz/v1"

    data class ScanResult(
        val productId: String,
        val productName: String,
        val batchId: String?,
        val requiresTempLogging: Boolean,
        val tempRange: TempRange?
    )
    
    data class EventSubmission(
        val eventId: String,
        val blockchainTxHash: String,
        val confirmationUrl: String
    )

    companion object {
        @Volatile
        private var INSTANCE: AlgeriaTrackScanner? = null
        
        fun getInstance(context: Context): AlgeriaTrackScanner {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: AlgeriaTrackScanner(
                    context.applicationContext,
                    BuildConfig.ALGERIATRACK_API_KEY,
                    BuildConfig.ALGERIATRACK_API_SECRET
                ).also { INSTANCE = it }
            }
        }
    }

    suspend fun validateScannedCode(code: String): ScanResult {
        val request = Request.Builder()
            .url("$baseUrl/products/scan/$code")
            .addHeader("Authorization", "Bearer $apiKey")
            .addHeader("X-API-Key", apiKey)
            .build()

        withContext(Dispatchers.IO) {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw ScannerException("Failed to validate: ${response.code}")
                }
                
                val body = response.body?.string()
                    ?: throw ScannerException("Empty response")
                
                gson.fromJson(body, ScanResult::class.java)
            }
        }
    }

    suspend fun submitEvent(
        batchId: String,
        eventType: String,
        location: LocationData,
        operator: OperatorData,
        readings: SensorReadings? = null
    ): EventSubmission {
        val payload = mapOf(
            "batchId" to batchId,
            "eventType" to eventType,
            "location" to location,
            "operator" to operator,
            "readings" to readings
        )

        val jsonBody = gson.toJson(payload)
            .toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("$baseUrl/events")
            .addHeader("Authorization", "Bearer $apiKey")
            .post(jsonBody)
            .build()

        withContext(Dispatchers.IO) {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw ScannerException("Event submission failed")
                }
                
                val body = response.body?.string()!!
                val jsonResponse = JsonParser.parseString(body).asJsonObject
                
                EventSubmission(
                    eventId = jsonResponse["data"]["eventId"].asString,
                    blockchainTxHash = jsonResponse["data"]["blockchainTxHash"].asString,
                    confirmationUrl = jsonResponse["data"]["verificationUrl"].asString
                )
            }
        }
    }
}
```

---

## 4. Data Formats

### 4.1 Product Schema Definition

```typescript
// Complete product schema with all fields
interface ProductSchema {
  // Identity
  productId: string;           // System-generated unique ID
  externalId?: string;         // Customer's internal product ID
  blockchainToken: string;     // Token for on-chain reference
  
  // Multilingual Names (required)
  name: {
    ar: string;                // Arabic name (required for Algerian market)
    fr: string;                // French name
    en: string;                // English name
  };
  
  // Classification
  category: ProductCategory;   // Primary category
  subcategory?: string;        // Sub-category for detailed classification
  tags?: string[];             // Search/filter tags
  
  // Descriptions
  description?: {
    ar?: string;
    fr?: string;
    en?: string;
  };
  
  // Regulatory Information
  regulatoryInfo?: {
    // Pharmaceuticals
    authorizationNumber?: string;    // AMM number
    authorizationDate?: string;
    issuingAuthority?: string;       // ANPP, ONSSA, etc.
    
    // Agriculture
    organicCertId?: string;
    pgiRegistration?: string;
    
    // Industrial
    qualityStandard?: string;        // ISO, NA, etc.
    certificationBody?: string;
  };
  
  // Physical Properties
  physicalProperties?: {
    weight?: number;
    weightUnit?: 'kg' | 'g' | 'mg' | 'ton';
    volume?: number;
    volumeUnit?: 'l' | 'ml' | 'm3';
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: 'cm' | 'm';
    };
  };
  
  // Storage Requirements
  storageRequirements?: {
    temperatureRange?: {
      min: number;
      max: number;
      unit: 'celsius' | 'fahrenheit';
    };
    humidityRange?: {
      min: number;
      max: number;
      unit: 'percent';
    };
    lightSensitive?: boolean;
    handlingInstructions?: string[];
  };
  
  // Tracking Configuration
  trackingConfig: {
    requiresTemperatureLogging: boolean;
    requiresHumidityLogging: boolean;
    requiresGeoLocation: boolean;
    checkpointTypes: CheckpointType[];
    alertThresholds?: {
      temperatureExcursion?: number;  // minutes before alert
      humidityExcursion?: number;
    };
  };
  
  // Certificate Templates
  certificateTemplates: CertificateType[];
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'discontinued';
}

type ProductCategory =
  | 'pharmaceutical_finished'
  | 'pharmaceutical_raw_material'
  | 'pharmaceutical_packaging'
  | 'date_product'
  | 'fig_product'
  | 'olive_oil'
  | 'citrus_fruit'
  | 'vegetable'
  | 'cereal'
  | 'cement'
  | 'steel_product'
  | 'steel_raw'
  | 'construction_material'
  | 'industrial_raw_material'
  | 'chemical'
  | 'other';
```

### 4.2 Event Types and Payloads

```typescript
// Base event interface
interface SupplyChainEvent {
  eventId: string;
  batchId: string;
  productId: string;
  eventType: EventType;
  timestamp: string;
  location: EventLocation;
  operator: EventOperator;
  status: 'pending' | 'confirmed' | 'verified';
  blockchainTxHash?: string;
  confirmations: number;
}

interface EventLocation {
  name: string;                   // Human-readable location name
  address?: string;               // Full address
  coordinates?: {                 // GPS coordinates
    latitude: number;
    longitude: number;
  };
  wilayaCode: string;             // Algerian wilaya code (01-58)
  commune?: string;
  zoneIdentifier?: string;       // Warehouse zone, aisle, etc.
}

interface EventOperator {
  id: string;                     // Internal user ID
  name: string;                   // Full name
  role: string;                   // job function
  employeeId?: string;            // HR employee number
}

// Event-specific payloads
interface ProductionEvent extends SupplyChainEvent {
  eventType: 'PRODUCTION';
  data: {
    manufacturingLine: string;
    equipmentId?: string;
    quantityProduced: number;
    unitOfMeasure: string;
    yieldPercentage?: number;
    cycleTimeMinutes?: number;
    rawMaterialBatches?: Array<{
      materialName: string;
      batchRef: string;
      quantityUsed: string;
    }>;
  };
}

interface QualityControlEvent extends SupplyChainEvent {
  eventType: 'QUALITY_CONTROL' | 'QC_APPROVED' | 'QC_REJECTED';
  data: {
    testType: 'visual' | 'laboratory' | 'sampling';
    testResults: Record<string, string>;
    overallStatus: 'PASS' | 'FAIL' | 'CONDITIONAL';
    inspectorId: string;
    inspectorName: string;
    deficiencies?: Array<{
      criterion: string;
      finding: string;
      severity: 'critical' | 'major' | 'minor';
    }>;
    remediationAction?: string;
    retestRequired: boolean;
    retestDate?: string;
  };
}

interface LogisticsEvent extends SupplyChainEvent {
  eventType: 'WAREHOUSE_IN' | 'WAREHOUSE_OUT' | 'TRANSPORT' | 'DISTRIBUTION_CENTER' | 'RETAIL';
  data: {
    // WAREHOUSE_IN specific
    supplierInfo?: {
      name: string;
      deliveryNoteNumber?: string;
      vehicleRegistration?: string;
      driverName?: string;
    };
    palletCount?: number;
    unitCount?: number;
    
    // WAREHOUSE_OUT specific
    destination?: {
      name: string;
      address?: string;
      contactPerson?: string;
    };
    carrierInfo?: {
      carrierName: string;
      vehicleRegistration: string;
      driverName: string;
      driverPhone: string;
    };
    
    // TRANSPORT specific
    route?: {
      origin: string;
      destination: string;
      viaPoints?: string[];
      estimatedDistanceKm?: number;
      estimatedDurationHours?: number;
    };
    transportCondition?: {
      containerType?: string;
      containerNumber?: string;
      sealNumber?: string;
    };
    
    // Common
    conditionAssessment?: 'excellent' | 'good' | 'acceptable' | 'damaged';
    discrepancies?: string[];
    notes?: string;
  };
}

interface CustomsEvent extends SupplyChainEvent {
  eventType: 'CUSTOMS';
  data: {
    customsOffice: string;
    declarationNumber: string;
    clearanceStatus: 'PENDING' | 'RELEASED' | 'HELD' | 'REJECTED';
    clearedBy?: string;
    clearedAt?: string;
    dutiesApplied?: number;
    currency?: string;
    documents?: Array<{
      type: string;
      reference: string;
      url?: string;
    }>;
    inspections?: Array<{
      type: string;
      result: string;
      notes?: string;
    }>;
  };
}

// Sensor readings (can be attached to any event)
interface SensorReadings {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  shock?: number;
  tilt?: {
    x: number;
    y: number;
    z: number;
  };
  timestamp: string;
  sensorId?: string;
  unit?: string;
}
```

### 4.3 Certificate Structure

```typescript
interface DigitalCertificate {
  // Identity
  certificateId: string;
  certificateNumber: string;      // Human-readable (e.g., AT-CERT-2024-0001234)
  type: CertificateType;
  
  // Subject
  subject: {
    productId: string;
    productName: string;
    batchId: string;
    batchNumber: string;
    manufacturer: string;
  };
  
  // Content (varies by type)
  content: CertificateContent;
  
  // Issuance
  issuer: {
    name: string;
    organization: string;
    role: string;
    digitalSignature: string;
    signatureTimestamp: string;
  };
  
  // Validity
  issuedAt: string;
  validUntil: string;
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  
  // Blockchain Verification
  blockchain: {
    hash: string;
    txHash: string;
    blockNumber: number;
    confirmations: number;
    network: 'mainnet' | 'testnet';
  };
  
  // Access URLs
  urls: {
    verification: string;
    qrCode: string;
    pdf: string;
    nftMetadata?: string;
  };
  
  // Languages available
  languages: ('ar' | 'fr' | 'en')[];
  
  // Audit trail
  auditLog: Array<{
    action: string;
    performedBy: string;
    performedAt: string;
    details?: string;
  }>;
}

type CertificateType =
  | 'ORIGIN_CERTIFICATE'
  | 'QUALITY_CERTIFICATE'
  | 'ORGANIC_CERTIFICATE'
  | 'GMP_CERTIFICATE'
  | 'COMPLIANCE_CERTIFICATE'
  | 'EXPORT_CERTIFICATE'
  | 'DELIVERY_CERTIFICATE'
  | 'INSPECTION_CERTIFICATE';

// Type-specific content structures
interface OriginCertificateContent {
  placeOfOrigin: {
    country: string;
    region: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  productionDate: string;
  productionMethod: string;
  ingredients?: Array<{
    name: string;
    origin: string;
    percentage?: number;
  }>;
}

interface QualityCertificateContent {
  testsPerformed: Array<{
    testName: string;
    standard: string;
    result: string;
    specification: string;
    passFail: 'PASS' | 'FAIL';
  }>;
  overallConformity: 'CONFORMANT' | 'NON_CONFORMANT' | 'PARTIAL';
  deviations?: Array<{
    criterion: string;
    nature: string;
    severity: string;
  }>;
}

interface OrganicCertificateContent {
  organicStandard: string;        // e.g., EU-ORGANIC-2018, USDA-NOP
  certificationScope: string;
  certifiedArea?: number;
  conversionYear?: string;
  inspectionDate: string;
  nextInspectionDate: string;
  prohibitedSubstances?: string[];
}
```

### 4.4 QR Code Format Specification

#### QR Code Data Structure

The QR code contains a compact URL that encodes product/batch information:

```
https://track.dz/{version}/{entityType}/{identifier}
```

**Examples:**
```
# Product QR (for general product info)
https://track.dz/v1/p/prod_abc123def456

# Batch QR (for specific batch tracking)
https://track.dz/v1/b/batch_xyz789abc

# Certificate QR (for certificate verification)
https://track.dz/v1/c/cert_123456def

# Direct verification hash
https://track.dz/v1/v/0xabc123def456
```

#### QR Code Payload (Alternative Direct Encoding)

For offline-capable scanning, QR codes can encode data directly:

```typescript
interface QRCodePayload {
  v: string;                      // Version: "1.0"
  t: 'product' | 'batch' | 'certificate';  // Entity type
  i: string;                      // Identifier
  h: string;                      // Hash prefix (first 8 chars of blockchain hash)
  u: string;                      // Short URL fallback
  
  // Optional: Embedded summary for offline display
  d?: {
    n: string;                    // Product name
    m: string;                    // Manufacturer
    b?: string;                   // Batch number (if applicable)
  };
}

// Encoded example (JSON minified, then base64):
// {"v":"1.0","t":"batch","i":"batch_xyz789","h":"abc12345","u":"https://track.dz/v1/b/batch_xyz789","d":{"n":"Paracetamol 500mg","m":"SAIDAL","b":"BT-2024-001234"}}
```

#### QR Code Design Specifications

| Attribute | Specification |
|-----------|---------------|
| **Format** | QR Code Model 2 |
| **Error Correction** | Level M (15% recovery) or Q (25%) for industrial |
| **Minimum Size** | 20mm x 20mm (for smartphone scanning) |
| **Recommended Size** | 25mm x 25mm (standard), 40mm x 40mm (industrial) |
| **Quiet Zone** | 4 modules white border |
| **Color** | Black on white (or dark blue #003366 on white) |
| **Encoding** | Byte mode (UTF-8) |
| **Max Content** | ~3KB (v40 with H correction) |

#### Label Layout Recommendation

```
┌──────────────────────────────────────┐
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │         QR CODE               │  │
│  │         (25x25mm)             │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  ALGERIATRACK.DZ                    │
│  ─────────────────                  │
│  Paracetamol 500mg                  │
│  Lot: BT-2024-001234                │
│  Exp: 2026-01                       │
│                                      │
│  Scan to verify authenticity        │
│                                      │
│  track.dz/v1/b/batch_xyz789         │
└──────────────────────────────────────┘
```

---

## 5. Webhook Configuration

### Webhook Endpoint Setup

Configure webhooks to receive real-time notifications about events:

```http
POST /webhooks
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://your-domain.com/webhooks/algeriatrack",
  "events": [
    "event.confirmed",
    "event.failed",
    "certificate.issued",
    "certificate.revoked",
    "batch.completed",
    "alert.temperature_exceeded",
    "alert.humidity_exceeded",
    "alert.geofence_breach"
  ],
  "secret": "your_webhook_secret_for_signature_verification",
  "headers": {
    "X-Custom-Header": "value"
  },
  "isActive": true
}
```

**Response:**
```json
{
  "webhookId": "wh_abc123def456",
  "url": "https://your-domain.com/webhooks/algeriatrack",
  "status": "active",
  "events": ["event.confirmed", "certificate.issued", ...],
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### Webhook Event Types

| Event | Trigger | Payload Summary |
|-------|---------|-----------------|
| `event.confirmed` | Event confirmed on blockchain | eventId, batchId, type, txHash |
| `event.failed` | Event confirmation failed | eventId, errorCode, retryable |
| `certificate.issued` | Certificate generated | certificateId, batchId, type, url |
| `certificate.revoked` | Certificate revoked | certificateId, reason, revokedBy |
| `batch.completed` | All checkpoints complete | batchId, totalEvents, certificates |
| `alert.*` | Threshold breach | alertType, currentValue, threshold, batchId |

### Webhook Signature Verification

Always verify webhook signatures to ensure authenticity:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express middleware example
function algeriaTrackWebhookMiddleware(req, res, next) {
  const signature = req.headers['x-algeriatrack-signature'];
  
  if (!signature) {
    return res.status(401).send('Missing signature header');
  }
  
  const isValid = verifyWebhookSignature(
    req.body,
    signature,
    process.env.WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(403).send('Invalid signature');
  }
  
  next();
}
```

### Webhook Payload Structure

```json
{
  "id": "wh_evt_abc123",
  "object": "event",
  "created": 1705322400,
  "type": "event.confirmed",
  "data": {
    "eventId": "evt_abc123def456",
    "batchId": "batch_xyz789",
    "eventType": "WAREHOUSE_IN",
    "blockchainTxHash": "0x123abc456def",
    "confirmations": 6,
    "confirmedAt": "2024-01-15T10:30:05Z"
  },
  "pending_webhooks": 0,
  "request": {
    "id": "req_abc123",
    "idempotency_key": "ide_abc123"
  }
}
```

---

## 6. Error Handling

### Error Response Format

All errors follow a consistent structure:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: string;       // Additional details
    field?: string;         // Field causing error (for validation errors)
    documentation_url?: string; // Link to relevant docs
    requestId: string;      // For support requests
  };
  httpStatus: number;
}
```

### Error Codes Reference

| HTTP Status | Error Code | Description | Resolution |
|-------------|------------|-------------|------------|
| 400 | `invalid_request` | Malformed request syntax | Fix request format |
| 400 | `validation_error` | Field validation failed | Check error.details for specifics |
| 401 | `authentication_failed` | Invalid credentials | Verify API key/secret |
| 401 | `token_expired` | Access token expired | Refresh token |
| 403 | `insufficient_permissions` | Action not allowed | Check scope permissions |
| 404 | `not_found` | Resource doesn't exist | Verify resource ID |
| 409 | `conflict` | Resource state conflict | Check current state |
| 422 | `unprocessable_entity` | Semantic error | Review business rules |
| 429 | `rate_limit_exceeded` | Too many requests | Implement backoff |
| 500 | `internal_error` | Server-side error | Retry with exponential backoff |
| 503 | `service_unavailable` | Temporary outage | Retry later |

### Error Handling Best Practices

```typescript
async function safeApiCall<T>(
  apiFunction: () => Promise<T>,
  retries = 3,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await apiFunction();
    } catch (error) {
      const isRetryable = [429, 500, 502, 503, 504].includes(error.httpStatus);
      
      if (!isRetryable || attempt === retries) {
        // Log to your error monitoring
        logError(error);
        
        // Return a user-friendly error
        throw new UserFriendlyError(
          getUserMessage(error.error.code),
          error.error.code,
          error.requestId
        );
      }
      
      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await sleep(delay);
    }
  }
  
  throw new Error('Unexpected error in API call');
}

function getUserMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    'rate_limit_exceeded': 'Veuillez réessayer dans quelques instants',
    'authentication_failed': 'Erreur de connexion, veuillez vérifier vos identifiants',
    'validation_error': 'Certaines informations sont incorrectes',
    'not_found': 'Ressource introuvable',
    'internal_error': 'Erreur technique, notre équipe est informée'
  };
  
  return messages[errorCode] || 'Une erreur est survenue';
}
```

---

## 7. Rate Limiting & Quotas

### Rate Limits by Plan

| Plan | Requests/Minute | Daily Quota | Concurrent Connections |
|------|-----------------|-------------|----------------------|
| Pilot | 60 | 10,000 | 5 |
| Starter | 120 | 50,000 | 10 |
| Professional | 300 | 250,000 | 25 |
| Enterprise | 600 | Unlimited | 100 |

### Rate Limit Headers

Every API response includes rate limit information:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705322500
X-RateLimit-Retry-After: 5
```

### Implementing Rate Limit Handling

```typescript
interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTimestamp: number;
  retryAfter?: number;
}

function parseRateLimitHeaders(headers: Headers): RateLimitInfo {
  return {
    limit: parseInt(headers.get('X-RateLimit-Limit') || '60'),
    remaining: parseInt(headers.get('X-RateLimit-Remaining') || '0'),
    resetTimestamp: parseInt(headers.get('X-RateLimit-Reset') || '0'),
    retryAfter: headers.get('X-RateLimit-Retry-After') 
      ? parseInt(headers.get('X-RateLimit-Retry-After')!) 
      : undefined
  };
}

async function rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  const rateLimit = parseRateLimitHeaders(response.headers);
  
  // Update UI with rate limit status
  updateRateLimitDisplay(rateLimit);
  
  if (response.status === 429) {
    // Wait for retry-after or until reset
    const waitMs = (rateLimit.retryAfter || 60) * 1000;
    await sleep(waitMs);
    return rateLimitedFetch(url, options); // Retry
  }
  
  return response;
}
```

---

## 8. Code Examples

### Complete Integration Example: Pharmaceutical Company

This example shows a complete integration for SAIDAL pharmaceutical company:

```typescript
// saidal-integration.ts
import { AlgeriaTrackBlockchain } from '@algeriatrack/blockchain-sdk';
import { SAPClient } from './sap-client';

class SaidalBlockchainIntegration {
  private track: AlgeriaTrackBlockchain;
  private sap: SAPClient;

  constructor() {
    this.track = new AlgeriaTrackBlockchain({
      apiKey: process.env.ALGERIATRACK_API_KEY!,
      apiSecret: process.env.ALGERIATRACK_API_SECRET!,
      pilotId: 'pilot_saidal_001',
      environment: 'pilot'
    });
    
    this.sap = new SAPClient({
      host: process.env.SAP_HOST!,
      client: '100',
      username: process.env.SAP_USER!,
      password: process.env.SAP_PASSWORD!
    });
  }

  /**
   * Sync production order from SAP to blockchain
   * Called by SAP output mechanism after goods receipt
   */
  async syncProductionOrder(sapOrderId: string) {
    console.log(`[SYNC] Starting sync for order ${sapOrderId}`);
    
    try {
      // 1. Fetch order from SAP
      const order = await this.sap.getProductionOrder(sapOrderId);
      console.log(`[SYNC] Fetched order: ${order.materialNumber}`);
      
      // 2. Get or create product
      const product = await this.track.products.upsert({
        externalId: order.materialNumber,
        defaults: {
          name: {
            ar: order.materialDescriptionAr,
            fr: order.materialDescriptionFr,
            en: order.materialDescriptionEn
          },
          category: this.mapSapCategory(order.industrySector),
          regulatoryInfo: {
            authorizationNumber: order.ammNumber,
            issuingAuthority: 'ANPP'
          },
          trackingConfig: {
            requiresTemperatureLogging: order.requiresColdChain,
            requiresHumidityLogging: order.requiresColdChain,
            temperatureRange: order.storageConditions
          }
        }
      });
      
      // 3. Create batch
      const batch = await this.track.batches.create({
        productId: product.productId,
        externalBatchId: order.batchNumber,
        productionDate: order.productionDate,
        manufacturingLine: order.workCenter,
        quantity: order.quantityProduced,
        unitOfMeasure: order.unitOfMeasure,
        rawMaterials: order.components.map(comp => ({
          materialName: comp.materialName,
          batchRef: comp.batchNumber,
          quantityUsed: comp.quantityUsed
        })),
        expectedExpiryDate: order.expiryDate
      });
      
      // 4. Log production event
      const prodEvent = await this.track.events.log({
        batchId: batch.batchId,
        eventType: 'PRODUCTION',
        location: {
          name: order.plantName,
          wilayaCode: order.wilayaCode
        },
        operator: {
          id: order.productionOperatorId,
          name: order.productionOperatorName,
          role: 'production_operator'
        },
        parameters: {
          yieldPercentage: order.yieldPercentage,
          cycleTimeHours: order.cycleTime,
          equipmentId: order.mainEquipment
        }
      });
      
      // 5. Log QC event (if auto-approved based on SAP quality score)
      if (order.qualityScore >= 95) {
        const qcEvent = await this.track.events.log({
          batchId: batch.batchId,
          eventType: 'QC_APPROVED',
          operator: {
            id: order.qcInspectorId,
            name: order.qcInspectorName,
            role: 'qc_inspector'
          },
          testResults: {
            visualInspection: 'PASS',
            weightVariance: 'PASS',
            dissolution: order.testResults.dissolution,
            assay: order.testResults.assay,
            overallStatus: 'APPROVED'
          }
        });
        
        // Auto-generate GMP certificate
        const certificate = await this.track.certificates.generate({
          batchId: batch.batchId,
          type: 'GMP_CERTIFICATE',
          data: {
            productName: order.materialDescriptionFr,
            manufacturer: 'SAIDAL SPA',
            manufacturingDate: order.productionDate,
            batchNumber: order.batchNumber,
            manufacturingSite: order.plantName,
            qualityStandard: 'WHO-GMP',
            authorizedFor: 'Algerian Market',
            expiryDate: order.expiryDate
          },
          signatory: {
            name: order.qaDirectorName,
            title: 'Quality Assurance Director'
          },
          options: {
            generateQR: true,
            languages: ['ar', 'fr', 'en']
          }
        });
        
        // Update SAP with blockchain references
        await this.sap.updateOrderBlockchainRefs(sapOrderId, {
          batchBlockchainId: batch.blockchainToken,
          eventIds: [prodEvent.eventId, qcEvent.eventId],
          certificateId: certificate.certificateId,
          certificateNumber: certificate.certificateNumber
        });
        
        console.log(`[SYNC] Complete. Certificate: ${certificate.certificateNumber}`);
        return { success: true, certificateNumber: certificate.certificateNumber };
      }
      
      console.log(`[SYNC] Complete. Awaiting manual QC.`);
      return { success: true, awaitingQc: true };
      
    } catch (error) {
      console.error(`[SYNC] Error:`, error);
      
      // Send alert to operations team
      await this.sendAlert('Integration Error', {
        orderId: sapOrderId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  private mapSapCategory(sector: string): ProductCategory {
    const mapping: Record<string, ProductCategory> = {
      'PHARMA_FINISHED': 'pharmaceutical_finished',
      'PHARMA_RAW': 'pharmaceutical_raw_material',
      'PHARMA_PACKAGING': 'pharmaceutical_packaging'
    };
    return mapping[sector] || 'other';
  }

  private async sendAlert(title: string, data: object) {
    // Implementation for alerting (email, Slack, etc.)
    console.log(`[ALERT] ${title}:`, data);
  }
}

// Export singleton
export const saidalIntegration = new SaidalBlockchainIntegration();
```

### Complete Integration Example: Agricultural Cooperative

```python
# biskra_dates_coop.py
"""Integration for Biskra Dates Cooperative - Blockchain Tracking"""

import os
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict
from dataclasses import dataclass

from algeriatrack import AlgeriaTrackClient, EventTypes, CertificateTypes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class HarvestBatch:
    """Represents a date harvest batch"""
    harvest_id: str
    farmer_id: str
    farmer_name: str
    plot_number: str
    variety: str  # Deglet Nour, Ghars, etc.
    harvest_date: datetime
    quantity_kg: float
    grade: str  # Premium, Class A, Class B, Industrial


class BiskraDatesBlockchain:
    """Blockchain integration for dates supply chain tracking"""
    
    def __init__(self):
        self.client = AlgeriaTrackClient(
            api_key=os.environ['ALGERIATRACK_API_KEY'],
            api_secret=os.environ['ALGERIATRACK_API_SECRET'],
            pilot_id='pilot_biskra_dates_001'
        )
        
        # Product IDs cache (variety -> productId)
        self._product_cache: Dict[str, str] = {}
    
    def register_harvest(self, harvest: HarvestBatch) -> Dict:
        """
        Register a new harvest batch on blockchain
        
        Returns dict with batch_id, event_id, and blockchain references
        """
        logger.info(f"Registering harvest {harvest.harvest_id} from farmer {harvest.farmer_name}")
        
        # Get or create product for this variety
        product_id = self._get_product_for_variety(harvest.variety)
        
        # Create batch
        batch = self.client.batches.create(
            product_id=product_id,
            external_batch_id=harvest.harvest_id,
            production_date=harvest.harvest_date.isoformat(),
            manufacturing_site=f"Biskra - Plot {harvest.plot_number}",
            quantity=harvest.quantity_kg,
            unit_of_measure="kg",
            parameters={
                "farmer_id": harvest.farmer_id,
                "farmer_name": harvest.farmer_name,
                "plot_number": harvest.plot_number,
                "variety": harvest.variety,
                "grade": harvest.grade
            }
        )
        
        # Log harvest event
        event = self.client.events.log(
            batch_id=batch['batch_id'],
            eventType='PRODUCTION',
            location={
                'name': f'Tolga Commune - Plot {harvest.plot_number}',
                'address': 'Route de Touggourt, Biskra',
                'coordinates': {'latitude': 33.9214, 'longitude': 5.3844},
                'wilaya_code': '07'
            },
            operator={
                'id': harvest.farmer_id,
                'name': harvest.farmer_name,
                'role': 'farmer'
            },
            notes=f"Harvest of {harvest.quantity_kg}kg {harvest.variety} dates, grade {harvest.grade}"
        )
        
        logger.info(f"Harvest registered. Batch: {batch['batch_id']}, TX: {event['blockchain_tx_hash']}")
        
        return {
            'batch_id': batch['batch_id'],
            'external_id': harvest.harvest_id,
            'event_id': event['event_id'],
            'blockchain_tx': event['blockchain_tx_hash']
        }
    
    def register_receiving_at_packing_station(
        self, 
        batch_id: str, 
        station_name: str,
        quantity_received: float,
        quality_check_result: Dict,
        receiver_name: str
    ) -> Dict:
        """Register receiving event at packing station"""
        
        # Log warehouse in event
        event = self.client.events.log(
            batch_id=batch_id,
            eventType='WAREHOUSE_IN',
            location={
                'name': f'{station_name} - Receiving Bay',
                'wilaya_code': '07'  # Biskra
            },
            operator={
                'id': f'receiver_{station_name}',
                'name': receiver_name,
                'role': 'receiving_clerk'
            },
            parameters={
                'quantity_received_kg': quantity_received,
                'condition_on_arrival': quality_check_result.get('overall_condition')
            }
        )
        
        # Log QC event
        qc_status = 'QC_APPROVED' if quality_check_result.get('passed') else 'QC_REJECTED'
        qc_event = self.client.events.log(
            batch_id=batch_id,
            eventType=qc_status,
            operator={
                'id': f'qc_{station_name}',
                'name': quality_check_result.get('inspector_name'),
                'role': 'qc_inspector'
            },
            test_results=quality_check_result.get('test_details', {})
        )
        
        return {
            'receiving_event_id': event['event_id'],
            'qc_event_id': qc_event['event_id'],
            'qc_passed': quality_check_result.get('passed', False)
        }
    
    def generate_export_certificate(
        self,
        batch_id: str,
        export_details: Dict,
        certifying_officer: Dict
    ) -> Dict:
        """Generate export certificate for international shipment"""
        
        certificate = self.client.certificates.generate(
            batch_id=batch_id,
            type='EXPORT_CERTIFICATE',
            data={
                'product_name': export_details['product_description'],
                'origin': 'Biskra Wilaya, Algeria',
                'variety': export_details.get('variety'),
                'grade': export_details.get('grade'),
                'harvest_year': export_details.get('harvest_year'),
                'exporter_name': export_details['exporter_name'],
                'exporter_address': export_details['exporter_address'],
                'consignee_name': export_details['consignee_name'],
                'consignee_address': export_details['consignee_address'],
                'destination_country': export_details['destination_country'],
                'quantity': export_details['quantity_kg'],
                'packaging': export_details.get('packaging_details'),
                'container_number': export_details.get('container_number'),
                'seal_number': export_details.get('seal_number')
            },
            signatory=certifying_officer,
            options={
                'generate_qr': True,
                'languages': ['ar', 'fr', 'en'],
                'validity_days': 365
            }
        )
        
        logger.info(f"Export certificate generated: {certificate['certificate_number']}")
        return certificate
    
    def _get_product_for_variety(self, variety: str) -> str:
        """Get or create product ID for date variety"""
        if variety in self._product_cache:
            return self._product_cache[variety]
        
        # Try to find existing product
        products = self.client.products.list(filters={'external_id': f'DATE-{variety}'})
        
        if products:
            product_id = products[0]['product_id']
        else:
            # Create new product
            names = {
                'Deglet Nour': {'ar': 'تمر دقلة نور', 'fr': 'Dattes Deglet Nour', 'en': 'Deglet Nour Dates'},
                'Ghars': {'ar': 'تمر غرس', 'fr': 'Dattes Ghars', 'en': 'Ghars Dates'},
                'Tenicin': {'ar': 'تمر تنيسين', 'fr': 'Dattes Tenicin', 'en': 'Tenicin Dates'}
            }
            
            product = self.client.products.create(
                external_id=f'DATE-{variety}',
                name=names.get(variety, {'ar': variety, 'fr': variety, 'en': variety}),
                category='date_product',
                tracking_config={
                    'requires_temperature_logging': True,
                    'requires_humidity_logging': True,
                    'temperature_range': {'min': 0, 'max': 25, 'unit': 'celsius'}
                }
            )
            product_id = product['product_id']
        
        self._product_cache[variety] = product_id
        return product_id


# Usage example
if __name__ == '__main__':
    tracker = BiskraDatesBlockchain()
    
    # Register harvest
    harvest = HarvestBatch(
        harvest_id='HV-2024-001234',
        farmer_id='FARM-0456',
        farmer_name='Abdelkrim Mohamed',
        plot_number='B-42',
        variety='Deglet Nour',
        harvest_date=datetime(2024, 9, 15),
        quantity_kg=250.0,
        grade='Premium'
    )
    
    result = tracker.register_harvest(harvest)
    print(f"Registered: {result['batch_id']}")
```

---

*Document Version: 2.0 | © 2024 AlgeriaTrack.dz | Technical Documentation*
