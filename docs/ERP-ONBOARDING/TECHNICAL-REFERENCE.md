# ERP Integration Technical Reference

**AlgeriaTrade.dz B2B Marketplace**  
**Version 1.0 | For ERP Developers & System Integrators**

---

## Table of Contents

1. [API Specifications](#1-api-specifications)
2. [Authentication Requirements](#2-authentication-requirements)
3. [Webhook Payload Formats](#3-webhook-payload-formats)
4. [Field Mapping Reference](#4-field-mapping-reference)
5. [Rate Limits & Throttling](#5-rate-limits--throttling)
6. [Error Codes Dictionary](#6-error-codes-dictionary)
7. [Security Requirements](#7-security-requirements)
8. [Data Types & Formats](#8-data-types--formats)

---

## 1. API Specifications

### 1.1 Base URLs

| Environment | Base URL |
|-------------|----------|
| **Production** | `https://api.algeriatrade.dz/v1` |
| **Staging** | `https://staging-api.algeriatrade.dz/v1` |
| **Sandbox** | `https://sandbox-api.algeriatrade.dz/v1` |

### 1.2 API Endpoints Overview

#### Connection Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/erp/connections` | Create new ERP connection |
| `GET` | `/erp/connections` | List all connections |
| `GET` | `/erp/connections/{id}` | Get connection details |
| `PUT` | `/erp/connections/{id}` | Update connection config |
| `DELETE` | `/erp/connections/{id}` | Remove connection |
| `POST` | `/erp/connections/{id}/test` | Test connection |

#### Synchronization

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/erp/sync/start` | Start sync job |
| `GET` | `/erp/sync/jobs` | List sync jobs |
| `GET` | `/erp/sync/jobs/{id}` | Get job status |
| `POST` | `/erp/sync/jobs/{id}/cancel` | Cancel running job |
| `GET` | `/erp/sync/jobs/{id}/logs` | Get sync logs |

#### Field Mapping

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/erp/mappings` | List mapping presets |
| `POST` | `/erp/mappings` | Create mapping preset |
| `GET` | `/erp/mappings/{id}` | Get mapping details |
| `PUT` | `/erp/mappings/{id}` | Update mapping |
| `DELETE` | `/erp/mappings/{id}` | Delete mapping |
| `POST` | `/erp/mappings/{id}/validate` | Test mapping rules |

#### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/erp/webhooks` | List webhooks |
| `POST` | `/erp/webhooks` | Register webhook |
| `DELETE` | `/erp/webhooks/{id}` | Remove webhook |
| `POST` | `/erp/webhooks/{id}/test` | Send test payload |
| `GET` | `/erp/webhooks/deliveries` | View delivery log |

#### Products API (for REST connector)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/products` | List products |
| `GET` | `/products/{id}` | Get product detail |
| `POST` | `/products` | Create product |
| `PUT` | `/products/{id}` | Update product |
| `DELETE` | `/products/{id}` | Delete product |

#### Inventory API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/inventory` | List inventory records |
| `GET` | `/inventory/{sku}` | Get stock for SKU |
| `PUT` | `/inventory/{sku}` | Update stock quantity |
| `PATCH` | `/inventory/{sku}/adjust` | Adjust stock (delta) |

#### Orders API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/orders` | List orders |
| `GET` | `/orders/{id}` | Get order details |
| `POST` | `/orders` | Create order |
| `PUT` | `/orders/{id}` | Update order |
| `POST` | `/orders/{id}/status` | Update order status |

### 1.3 Detailed Endpoint Specifications

#### POST /erp/connections

Create a new ERP connection.

**Request:**

```http
POST /v1/erp/connections HTTP/1.1
Host: api.algeriatrade.dz
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "name": "Production SAP Connection",
  "erp_type": "sap_s4hana",
  "config": {
    "host_url": "https://sap.company.com",
    "client_id": "100",
    "authentication": {
      "type": "oauth2",
      "token_url": "https://sap.company.com/oauth/token",
      "client_id": "sap_api_client",
      "client_secret": "********"
    },
    "odata_settings": {
      "service_path": "/sap/opu/odata/sap/",
      "product_service": "API_PRODUCT_SRV",
      "inventory_service": "API_INVENTORY_SRV_02"
    }
  },
  "sync_settings": {
    "default_direction": "bidirectional",
    "conflict_resolution": "erp_wins",
    "schedule": {
      "products": "0 */4 * * *",
      "inventory": "*/15 * * * *",
      "orders": "*/5 * * * *"
    }
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "conn_abc123def456",
    "name": "Production SAP Connection",
    "erp_type": "sap_s4hana",
    "status": "configured",
    "created_at": "2025-01-15T10:30:00Z",
    "test_status": null
  }
}
```

#### GET /erp/connections/{id}

Retrieve connection details.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "conn_abc123def456",
    "name": "Production SAP Connection",
    "erp_type": "sap_s4hana",
    "status": "active",
    "config": {
      "host_url": "https://sap.company.com",
      "client_id": "100"
      // ... (sensitive fields masked)
    },
    "statistics": {
      "total_syncs": 1247,
      "last_sync_at": "2025-01-15T14:30:00Z",
      "success_rate": 99.82,
      "avg_latency_ms": 145
    },
    "created_at": "2025-01-01T08:00:00Z",
    "updated_at": "2025-01-15T14:30:00Z"
  }
}
```

#### POST /erp/connections/{id}/test

Test connection to ERP system.

**Request:**

```http
POST /v1/erp/connections/conn_abc123def456/test HTTP/1.1
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "connection_id": "conn_abc123def456",
    "status": "success",
    "latency_ms": 143,
    "details": {
      "authentication": "verified",
      "api_access": "confirmed",
      "version_detected": "SAP S/4HANA 2023 FPS01",
      "services_available": [
        "API_PRODUCT_SRV",
        "API_INVENTORY_SRV_02",
        "API_SALES_ORDER_SRV"
      ]
    },
    "timestamp": "2025-01-15T14:35:22Z"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials provided",
    "details": "OAuth2 token request failed with 401 Unauthorized",
    "suggestion": "Verify client_id and client_secret are correct"
  },
  "timestamp": "2025-01-15T14:35:22Z"
}
```

#### POST /erp/sync/start

Start a synchronization job.

**Request:**

```json
{
  "connection_id": "conn_abc123def456",
  "sync_type": "full",           // "full" or "incremental"
  "entities": ["products", "inventory"],  // optional, defaults to all
  "options": {
    "dry_run": false,             // true = simulate only
    "force_resync": false,        // ignore last sync timestamp
    "batch_size": 100
  }
}
```

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "job_id": "job_xyz789ghi012",
    "status": "queued",
    "connection_id": "conn_abc123def456",
    "sync_type": "full",
    "entities": ["products", "inventory"],
    "estimated_records": 1247,
    "estimated_duration_seconds": 300,
    "created_at": "2025-01-15T14:40:00Z"
  }
}
```

---

## 2. Authentication Requirements

### 2.1 AlgeriaTrade.dz API Authentication

All API requests require authentication using Bearer tokens.

#### Obtaining Access Tokens

**Client Credentials Flow (Server-to-Server):**

```http
POST /v1/oauth/token HTTP/1.1
Host: api.algeriatrade.dz
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id={your_client_id}&client_secret={your_client_secret}&scope=erp:read erp:write
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "erp:read erp:write"
}
```

#### Using the Token

```http
GET /v1/erp/connections HTTP/1.1
Host: api.algeriatrade.dz
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 ERP-Specific Authentication

#### SAP Authentication

**Option A: OAuth2 Client Credentials (Recommended)**

```json
{
  "type": "oauth2",
  "grant_type": "client_credentials",
  "token_url": "https://{host}:44300/oauth/token",
  "client_id": "your_sap_client_id",
  "client_secret": "your_sap_client_secret"
}
```

**Option B: Basic Authentication**

```json
{
  "type": "basic",
  "username": "your_sap_username",
  "password": "your_sap_password"
}
```

#### Odoo Authentication

**Option A: API Key (Recommended for Odoo 16+)**

```json
{
  "type": "api_key",
  "api_key": "your_odoo_api_key_from_user_preferences"
}
```

**Option B: XML-RPC Authentication**

```json
{
  "type": "xmlrpc",
  "database": "your_database_name",
  "username": "admin_username",
  "password": "admin_password"
}
```

#### Microsoft Dynamics 365 Authentication

**OAuth2 with Azure AD:**

```json
{
  "type": "oauth2",
  "authority": "https://login.microsoftonline.com/{tenant_id}",
  "client_id": "your_azure_app_client_id",
  "client_secret": "your_azure_app_client_secret",
  "scope": "https://{org}.operations.dynamics.com/.default"
}
```

#### Custom REST API Authentication

**Bearer Token:**

```json
{
  "type": "bearer_token",
  "header_name": "Authorization",
  "token_format": "Bearer {token}",
  "token": "your_access_token"
}
```

**API Key in Header:**

```json
{
  "type": "api_key_header",
  "header_name": "X-API-Key",
  "token": "your_api_key"
}
```

**Basic Auth:**

```json
{
  "type": "basic",
  "username": "api_user",
  "password": "api_password"
}
```

### 2.3 Token Management

| Property | Value |
|----------|-------|
| **Access Token Lifetime** | 1 hour (3600 seconds) |
| **Refresh Token Lifetime** | 90 days |
| **Max Active Tokens** | 5 per client |
| **Token Revocation** | Immediate on request |

**Automatic Token Refresh:**

The integration framework automatically refreshes tokens before expiry. No manual intervention required unless credentials change.

---

## 3. Webhook Payload Formats

### 3.1 Webhook Headers

All webhook deliveries include these headers:

| Header | Description | Example |
|--------|-------------|---------|
| `X-Algeriatrade-Event` | Event type identifier | `inventory.updated` |
| `X-Algeriatrade-Signature` | HMAC-SHA256 signature | `sha256=abc123...` |
| `X-Algeriatrade-Timestamp` | Unix timestamp of delivery | `1705312800` |
| `X-Algeriatrade-Delivery-ID` | Unique delivery identifier | `del_xyz789` |
| `Content-Type` | Always `application/json` | - |

### 3.2 Signature Verification

To verify webhook authenticity:

```python
import hmac
import hashlib

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verify webhook signature.
    
    Args:
        payload: Raw request body bytes
        signature: X-Algeriatrade-Signature header value
        secret: Your webhook signing secret
    
    Returns:
        bool: True if signature is valid
    """
    # Extract signature hash (remove 'sha256=' prefix)
    expected_signature = signature.split('=')[1]
    
    # Compute HMAC
    computed_hmac = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    # Use constant-time comparison to prevent timing attacks
    return hmac.compare_digest(expected_signature, computed_hmac)
```

### 3.3 Webhook Event Payloads

#### inventory.updated

Triggered when inventory quantity changes:

```json
{
  "event_id": "evt_inv_001234",
  "event_type": "inventory.updated",
  "timestamp": "2025-01-15T14:30:00Z",
  "data": {
    "sku": "SKU-PROD-001",
    "previous_quantity": 100,
    "new_quantity": 95,
    "change_delta": -5,
    "warehouse_id": "WH-ALGIERS-MAIN",
    "reason": "order_fulfilled",
    "reference_id": "ORD-2025-00123",
    "updated_by": "system_sync"
  },
  "metadata": {
    "seller_id": "seller_456",
    "connection_id": "conn_abc123"
  }
}
```

#### order.created

Triggered when new order is placed:

```json
{
  "event_id": "evt_ord_005678",
  "event_type": "order.created",
  "timestamp": "2025-01-15T14:35:00Z",
  "data": {
    "order_id": "ORD-2025-00124",
    "order_number": "AT-2025-00124",
    "status": "pending_confirmation",
    "buyer": {
      "id": "buyer_789",
      "company_name": "Example Company SARL",
      "email": "buyer@example.com",
      "phone": "+213 XXX XXX XXX"
    },
    "shipping_address": {
      "full_name": "Mohammed Ali",
      "address_line1": "123 Rue Didouche Mourad",
      "city": "Alger",
      "wilaya_code": "16",
      "postal_code": "16000",
      "country": "DZ"
    },
    "items": [
      {
        "sku": "SKU-PROD-001",
        "product_name": "Industrial Pump Model X500",
        "quantity": 2,
        "unit_price": 150000.00,
        "currency": "DZD",
        "total": 300000.00
      },
      {
        "sku": "SKU-PROD-002",
        "product_name": "Replacement Filter Set",
        "quantity": 10,
        "unit_price": 2500.00,
        "currency": "DZD",
        "total": 25000.00
      }
    ],
    "totals": {
      "subtotal": 325000.00,
      "shipping": 1500.00,
      "tax": 52360.00,
      "grand_total": 378860.00,
      "currency": "DZD"
    },
    "payment_method": "bank_transfer",
    "payment_status": "pending"
  },
  "metadata": {
    "seller_id": "seller_456",
    "source": "marketplace"
  }
}
```

#### order.status_changed

Triggered when order status changes:

```json
{
  "event_id": "evt_sts_009012",
  "event_type": "order.status_changed",
  "timestamp": "2025-01-15T15:00:00Z",
  "data": {
    "order_id": "ORD-2025-00124",
    "previous_status": "pending_confirmation",
    "new_status": "confirmed",
    "changed_by": "seller",
    "notes": "Order confirmed, production scheduled",
    "timeline": [
      {
        "status": "pending_confirmation",
        "timestamp": "2025-01-15T14:35:00Z",
        "comment": "Order created"
      },
      {
        "status": "confirmed",
        "timestamp": "2025-01-15T15:00:00Z",
        "comment": "Order confirmed, production scheduled"
      }
    ]
  },
  "metadata": {
    "seller_id": "seller_456",
    "trigger_source": "erp_sync"
  }
}
```

#### product.created

Triggered when new product is synced:

```json
{
  "event_id": "evt_prd_003456",
  "event_type": "product.created",
  "timestamp": "2025-01-15T16:00:00Z",
  "data": {
    "product_id": "prod_789xyz",
    "sku": "SKU-NEW-PRODUCT",
    "name": "New Industrial Component",
    "description": "<p>High-quality industrial component...</p>",
    "category": {
      "id": "CAT-003",
      "name": "Machinery",
      "path": "Root > Industrial > Machinery"
    },
    "pricing": {
      "price": 45000.00,
      "currency": "DZD",
      "tax_included": false,
      "tax_rate": 19
    },
    "inventory": {
      "quantity": 50,
      "warehouse": "WH-ALGIERS",
      "low_stock_threshold": 10
    },
    "attributes": {
      "brand": "BrandName",
      "weight_kg": 2.5,
      "warranty_months": 12,
      "origin_country": "DZ"
    },
    "images": [
      "https://cdn.algeriatrade.dz/products/SKU-NEW-PRODUCT-1.jpg",
      "https://cdn.algeriatrade.dz/products/SKU-NEW-PRODUCT-2.jpg"
    ],
    "status": "active"
  },
  "metadata": {
    "seller_id": "seller_456",
    "sync_source": "erp_auto"
  }
}
```

#### sync.completed

Triggered when sync job finishes:

```json
{
  "event_id": "evt_sync_007890",
  "event_type": "sync.completed",
  "timestamp": "2025-01-15T17:00:00Z",
  "data": {
    "job_id": "job_xyz789ghi012",
    "connection_id": "conn_abc123def456",
    "sync_type": "incremental",
    "status": "success",
    "duration_seconds": 127,
    "entities": {
      "products": {
        "processed": 45,
        "created": 2,
        "updated": 40,
        "skipped": 3,
        "failed": 0
      },
      "inventory": {
        "processed": 120,
        "updated": 118,
        "unchanged": 2,
        "failed": 0
      },
      "orders": {
        "processed": 5,
        "created": 5,
        "failed": 0
      }
    },
    "errors": [],
    "warnings": [
      {
        "code": "WARN_001",
        "message": "Product SKU-OLD-001 has no image set",
        "entity_type": "product",
        "entity_id": "SKU-OLD-001"
      }
    ]
  },
  "metadata": {
    "triggered_by": "scheduled",
    "schedule_id": "sched_hourly_001"
  }
}
```

### 3.4 Webhook Response Requirements

Your endpoint must respond appropriately:

**Successful Receipt:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{"received": true}
```

**Expected Response Codes:**

| Code | Meaning | Action by AlgeriaTrade |
|------|---------|----------------------|
| 200 | Success | Mark as delivered |
| 202 | Accepted (async processing) | Mark as delivered |
| Other 2xx | Success variant | Mark as delivered |
| 4xx | Client error | Retry with backoff |
| 5xx | Server error | Retry with backoff |

**Retry Policy:**

| Attempt | Delay | Max Retries |
|---------|-------|-------------|
| 1 | 1 minute | 5 |
| 2 | 2 minutes | |
| 3 | 5 minutes | |
| 4 | 15 minutes | |
| 5 | 30 minutes | |

After max retries, webhook is marked as failed and visible in delivery log.

---

## 4. Field Mapping Reference

### 4.1 Product Fields

Complete list of mappable product fields:

| Target Field | Type | Required | Max Length | Description | Example |
|--------------|------|----------|------------|-------------|---------|
| `sku` | string | ✅ Yes | 100 | Stock Keeping Unit | `"SKU-PROD-001"` |
| `title` | string | ✅ Yes | 255 | Product name | `"Industrial Pump X500"` |
| `title_ar` | string | No | 255 | Arabic product name | `"مضخة صناعية"` |
| `description` | text/html | No | 50,000 | Full description | `"<p>High quality...</p>"` |
| `description_ar` | text/html | No | 50,000 | Arabic description | - |
| `price` | decimal | ✅ Yes | - | Unit price in DZD | `150000.00` |
| `currency` | string | No | 3 | ISO currency code | `"DZD"` |
| `compare_at_price` | decimal | No | - | Original price (for sale display) | `175000.00` |
| `cost_price` | decimal | No | - | Your cost price (internal) | `120000.00` |
| `stock_quantity` | integer | ✅ Yes | - | Available quantity | `100` |
| `low_stock_threshold` | integer | No | - | Alert threshold | `10` |
| `allow_backorder` | boolean | No | - | Allow orders when out of stock | `false` |
| `category_id` | reference | Recommended | - | Category from taxonomy | `"CAT-003"` |
| `brand` | string | No | 100 | Brand/manufacturer | `"Siemens"` |
| `manufacturer` | string | No | 255 | Full manufacturer name | `"Siemens AG"` |
| `manufacturer_part_no` | string | No | 100 | MPN | `"6ES7322-1HH01-0AA0"` |
| `barcode` | string | No | 50 | EAN/UPC barcode | `"4047622129834"` |
| `barcode_type` | string | No | 20 | Barcode format | `"EAN13"` |
| `weight` | decimal | No | - | Weight in kg | `2.5` |
| `weight_unit` | string | No | 10 | Weight unit | `"kg"` |
| `length` | decimal | No | - | Length in cm | `30` |
| `width` | decimal | No | - | Width in cm | `20` |
| `height` | decimal | No | - | Height in cm | `15` |
| `dimension_unit` | string | No | 10 | Dimension unit | `"cm"` |
| `origin_country` | string | No | 2 | ISO country code | `"DZ"` |
| `hs_code` | string | No | 20 | Harmonized system code | `"84137080"` |
| `warranty_months` | integer | No | - | Warranty period | `24` |
| `status` | enum | No | - | Product status | `"active"` |
| `is_visible` | boolean | No | - | Show in catalog | `true` |
| `images` | array | No | - | Image URLs | `["https://..."]` |
| `tags` | array | No | - | Search tags | `["pump", "industrial"]` |
| `custom_fields` | object | No | - | Additional attributes | `{...}` |
| `created_at` | datetime | No | - | Creation date | `"2025-01-15T..."` |
| `updated_at` | datetime | No | - | Last update date | `"2025-01-15T..."` |

### 4.2 Inventory Fields

| Target Field | Type | Required | Description | Example |
|--------------|------|----------|-------------|---------|
| `sku` | string | ✅ Yes | Product SKU | `"SKU-PROD-001"` |
| `warehouse_id` | string | ✅ Yes | Warehouse code | `"WH-ALGIERS"` |
| `quantity` | integer | ✅ Yes | Stock count | `150` |
| `reserved_quantity` | integer | No | Reserved for orders | `10` |
| `available_quantity` | integer | Computed | qty - reserved | `140` |
| `location_bin` | string | No | Bin location | `"A-03-02"` |
| `lot_number` | string | No | Batch/lot number | `"LOT-2025-001"` |
| `expiry_date` | date | No | Expiry date | `"2026-06-30"` |
| `last_counted_date` | date | No | Last physical count | `"2025-01-10"` |
| `unit_cost` | decimal | No | Current unit cost | `125000.00` |

### 4.3 Order Fields

| Target Field | Type | Required | Description | Example |
|--------------|------|----------|-------------|---------|
| `order_id` | string | ✅ Yes | Order ID | `"ORD-2025-00124"` |
| `order_number` | string | ✅ Yes | Display number | `"AT-2025-00124"` |
| `status` | enum | ✅ Yes | Order status | `"confirmed"` |
| `customer_id` | string | ✅ Yes | Buyer ID | `"buyer_789"` |
| `customer_email` | string | No | Email | `"buyer@co.dz"` |
| `customer_company` | string | No | Company name | `"Example SARL"` |
| `billing_address` | object | No | Billing address | `{...}` |
| `shipping_address` | object | No | Shipping address | `{...}` |
| `items` | array | ✅ Yes | Line items | `[{...}]` |
| `subtotal` | decimal | ✅ Yes | Items total | `325000.00` |
| `shipping_amount` | decimal | No | Shipping cost | `1500.00` |
| `tax_amount` | decimal | No | Tax amount | `52360.00` |
| `discount_amount` | decimal | No | Discount | `0.00` |
| `total_amount` | decimal | ✅ Yes | Grand total | `378860.00` |
| `currency` | string | ✅ Yes | Currency | `"DZD"` |
| `payment_method` | string | No | Payment type | `"bank_transfer"` |
| `payment_status` | enum | No | Payment state | `"paid"` |
| `notes` | text | No | Customer notes | `"Deliver before noon"` |
| `internal_notes` | text | No | Seller notes | `"VIP customer"` |
| `created_at` | datetime | Auto | Order date | `"2025-01-15T..."` |
| `updated_at` | datetime | Auto | Last update | `"2025-01-15T..."` |

#### Order Line Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `line_id` | string | ✅ Yes | Line item ID |
| `sku` | string | ✅ Yes | Product SKU |
| `product_name` | string | ✅ Yes | Product title |
| `quantity` | integer | ✅ Yes | Quantity ordered |
| `unit_price` | decimal | ✅ Yes | Price per unit |
| `discount_percent` | decimal | No | Line discount % |
| `tax_rate` | decimal | No | Tax rate applied |
| `tax_amount` | decimal | No | Tax amount |
| `line_total` | decimal | ✅ Yes | Line total |

### 4.4 Status Enumerations

#### Product Status

| Value | Description |
|-------|-------------|
| `active` | Visible and purchasable |
| `draft` | Not visible, being edited |
| `archived` | Hidden but retained |
| `disabled` | Temporarily unavailable |

#### Order Status

| Value | Description |
|-------|-------------|
| `pending_confirmation` | Awaiting seller confirmation |
| `confirmed` | Accepted by seller |
| `processing` | Being prepared |
| `ready_to_ship` | Packed and ready |
| `shipped` | Handed to carrier |
| `in_transit` | On the way |
| `delivered` | Received by buyer |
| `completed` | Order closed successfully |
| `cancelled` | Order cancelled |
| `refunded` | Refund processed |

#### Payment Status

| Value | Description |
|-------|-------------|
| `pending` | Awaiting payment |
| `processing` | Payment in progress |
| `paid` | Payment received |
| `partially_refunded` | Partial refund issued |
| `refunded` | Fully refunded |
| `failed` | Payment failed |

---

## 5. Rate Limits & Throttling

### 5.1 Rate Limit Tiers

| Tier | Requests/Hour | Burst (per min) | Eligibility |
|------|---------------|-----------------|-------------|
| **Standard** | 10,000 | 200 | All sellers |
| **Professional** | 50,000 | 500 | Verified businesses |
| **Enterprise** | Unlimited* | 1,000 | Custom agreement |

*Enterprise: Fair use policy applies; contact sales for SLA.

### 5.2 Rate Limit Headers

All responses include rate limit information:

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Hourly limit | `10000` |
| `X-RateLimit-Remaining` | Remaining this hour | `9950` |
| `X-RateLimit-Reset` | Unix timestamp reset | `1705316400` |
| `Retry-After` | Seconds until retry (when limited) | `60` |

### 5.3 Handling Rate Limits

When you hit the limit:

**Response (429 Too Many Requests):**

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "retry_after": 60
  }
}
```

**Recommended Handling:**

```javascript
// Exponential backoff implementation
async function makeApiCall(url, options, retries = 3) {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      
      if (retries > 0) {
        console.log(`Rate limited. Waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        return makeApiCall(url, options, retries - 1);
      } else {
        throw new Error('Max retries exceeded');
      }
    }
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

### 5.4 Sync-Specific Limits

| Operation | Limit | Notes |
|-----------|-------|-------|
| Records per sync job | 50,000 | Larger datasets auto-chunked |
| Concurrent sync jobs | 3 per connection | Queue others |
| Webhook payload size | 1 MB | Truncated if exceeded |
| Field value size | Varies by field | See field specs above |
| Image file size | 5 MB per image | Max 10 images per product |

---

## 6. Error Codes Dictionary

### 6.1 Authentication Errors (AUTH_xxx)

| Code | HTTP | Message | Cause | Resolution |
|------|------|---------|-------|------------|
| `AUTH_001` | 401 | Invalid credentials | Wrong username/password/API key | Verify credentials |
| `AUTH_002` | 401 | Token expired | OAuth token expired | Refresh or re-authenticate |
| `AUTH_003` | 401 | Token revoked | Token was revoked | Obtain new token |
| `AUTH_004` | 403 | Insufficient scope | Missing required permission | Check token scopes |
| `AUTH_005` | 403 | IP not whitelisted | Source IP blocked | Contact support |
| `AUTH_006` | 403 | Account suspended | Account deactivated | Contact support |
| `AUTH_007` | 429 | Too many auth attempts | Brute force protection | Wait 15 minutes |

### 6.2 Network Errors (NET_xxx)

| Code | HTTP | Message | Cause | Resolution |
|------|------|---------|-------|------------|
| `NET_001` | 504 | Connection timeout | ERP unreachable | Check network/firewall |
| `NET_002` | 502 | DNS resolution failed | Invalid host URL | Verify host URL |
| `NET_003` | 502 | Connection refused | Port/service down | Check ERP availability |
| `NET_004` | 503 | SSL/TLS error | Certificate issue | Update certificates |
| `NET_005` | 504 | Response timeout | ERP slow to respond | Optimize query or increase timeout |

### 6.3 API Errors (API_xxx)

| Code | HTTP | Message | Cause | Resolution |
|------|------|---------|-------|------------|
| `API_001` | 404 | Service not found | OData service path wrong | Check configuration |
| `API_002` | 405 | Method not allowed | Wrong HTTP method | Check API docs |
| `API_003` | 415 | Unsupported media type | Wrong Content-Type | Use application/json |
| `API_004` | 413 | Payload too large | Data exceeds limit | Reduce batch size |
| `API_005` | 422 | Validation error | Invalid data format | Fix data issues |
| `API_006` | 500 | Internal error | Platform issue | Retry, then contact support |

### 6.4 Data Errors (DATA_xxx)

| Code | HTTP | Message | Cause | Resolution |
|------|------|---------|-------|------------|
| `DATA_001` | 422 | Required field missing | Missing mandatory field | Add required field |
| `DATA_002` | 422 | Invalid field format | Data doesn't match format | Fix format (e.g., email, date) |
| `DATA_003` | 409 | Duplicate record | Unique constraint violated | Use different ID/SKU |
| `DATA_004` | 422 | Reference not found | Foreign key invalid | Ensure referenced record exists |
| `DATA_005` | 422 | Out of range | Value exceeds limits | Check min/max values |
| `DATA_006` | 422 | Invalid enum value | Not valid option | Use correct enum value |
| `DATA_007` | 422 | Category mapping failed | Unknown category ID | Map to valid category |

### 6.5 Sync Errors (SYNC_xxx)

| Code | HTTP | Message | Cause | Resolution |
|------|------|---------|-------|------------|
| `SYNC_001` | 409 | Conflict detected | Concurrent modification | Resolve conflict manually |
| `SYNC_002` | 423 | Resource locked | Record locked by another process | Wait and retry |
| `SYNC_003` | 409 | Version mismatch | Stale data | Re-fetch and re-submit |
| `SYNC_004` | 500 | Transform failed | Mapping rule error | Fix transformation rule |
| `SYNC_005` | 422 | Filter rejected | Record doesn't match filter | Adjust filters or data |
| `SYNC_006` | 503 | Job queue full | Too many pending jobs | Wait for completion |

### 6.6 Configuration Errors (CONFIG_xxx)

| Code | HTTP | Message | Cause | Resolution |
|------|------|---------|-------|------------|
| `CONFIG_001` | 422 | Invalid ERP type | Unsupported ERP | Check supported types |
| `CONFIG_002` | 422 | Missing required config | Incomplete setup | Complete all required fields |
| `CONFIG_003` | 422 | Invalid schedule expression | Cron syntax error | Fix cron expression |
| `CONFIG_004` | 409 | Connection already exists | Duplicate connection name | Use unique name |
| `CONFIG_005` | 422 | Invalid conflict strategy | Unknown strategy | Use documented strategies |

### 6.7 Webhook Errors (WEBHOOK_xxx)

| Code | HTTP | Message | Cause | Resolution |
|------|------|---------|-------|------------|
| `WEBHOOK_001` | 422 | Invalid URL | Malformed endpoint URL | Provide valid HTTPS URL |
| `WEBHOOK_002` | 422 | Duplicate event subscription | Already subscribed | Check existing webhooks |
| `WEBHOOK_003` | 503 | Delivery failed | Endpoint unreachable | Check your server |
| `WEBHOOK_004` | 403 | Signature verification failed | Secret mismatch | Update signing secret |
| `WEBHOOK_005` | 429 | Too many deliveries | Rate limited | Handle faster |

---

## 7. Security Requirements

### 7.1 Encryption Standards

#### Transport Layer Security (TLS)

| Requirement | Specification |
|-------------|---------------|
| **Minimum TLS Version** | TLS 1.2 (TLS 1.3 recommended) |
| **Allowed Ciphers** | ECDHE+AESGCM, DHE+AESGCM |
| **Certificate Type** | RSA 2048-bit or ECDSA P-256 |
| **Certificate Authority** | Public CA or properly chained private CA |
| **HSTS** | Enabled (max-age=31536000) |
| **Certificate Pinning** | Optional but recommended |

#### Data Encryption at Rest

| Data Type | Encryption |
|-----------|------------|
| Stored credentials | AES-256-GCM |
| API keys/tokens | AES-256-GCM (with KMS) |
| Webhook secrets | SHA-256 hashed + salted |
| Connection configs | AES-256-GCM |
| Sync logs (PII) | AES-256-GCM |

### 7.2 IP Allowlisting

For enhanced security, restrict access by IP address.

#### Configuring IP Allowlist

Via API:
```json
{
  "ip_allowlist": {
    "enabled": true,
    "addresses": [
      "203.0.113.0/24",     // Your office network
      "198.51.100.50"       // Specific server
    ],
    "mode": "allowlist"     // or "blocklist"
  }
}
```

Via Dashboard:
```
Settings → Security → IP Restrictions → Add IP Range
```

#### Allowed IP Formats

| Format | Example | Description |
|--------|---------|-------------|
| Single IP | `203.0.113.50` | Exact match |
| CIDR Block | `203.0.113.0/24` | Range of IPs |
| Wildcard (limited) | `203.0.113.*` | Simple range |

### 7.3 Certificate Requirements

If using mutual TLS (mTLS):

#### Client Certificate Requirements

| Property | Requirement |
|----------|-------------|
| **Type** | X.509 v3 |
| **Key Algorithm** | RSA 2048-bit minimum, ECDSA P-256 preferred |
| **Signature Algorithm** | SHA256WithRSA or ECDSAWithSHA256 |
| **Validity** | Maximum 1 year recommended |
| **Subject CN** | Must match registered domain/org |
| **SAN** | Required (DNS names or IP addresses) |
| **Key Usage** | Digital Signature |
| **Extended Key Usage** | Client Authentication |

### 7.4 Authentication Best Practices

#### Credential Management

| Practice | Recommendation |
|----------|----------------|
| **Service Accounts** | Use dedicated service accounts, not personal |
| **Principle of Least Privilege** | Grant minimum required permissions |
| **Credential Rotation** | Rotate every 90 days |
| **No Hardcoded Secrets** | Use environment variables or vaults |
| **Audit Logging** | Enable access logging |
| **MFA** | Enable for admin accounts |

#### Secure Credential Storage

```bash
# Environment variables (recommended for dev)
export ALGERIATRADE_CLIENT_ID="your_client_id"
export ALGERIATRADE_CLIENT_SECRET="your_client_secret"

# Secrets manager (production)
# AWS Secrets Manager, Azure Key Vault, HashiCorp Vault
```

### 7.5 Webhook Security

#### Signing Secret Management

1. **Generate unique secret** per webhook endpoint
2. **Store securely** in secrets manager
3. **Rotate every 180 days**
4. **Never expose** in client-side code

#### Verifying Webhook Integrity

Always verify signatures before processing:

```javascript
// Node.js example using crypto module
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  const expectedSignature = `sha256=${computedSignature}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### 7.6 Audit & Compliance

#### Audit Log Events

The following events are logged automatically:

| Event Category | Examples |
|----------------|----------|
| Authentication | Login, logout, token refresh, auth failure |
| Authorization | Permission check (failures), role change |
| Data Access | Read operations on sensitive data |
| Data Modification | Create, update, delete operations |
| Configuration | Connection changes, mapping updates |
| Admin Actions | User management, settings changes |

#### Log Retention

| Log Type | Retention Period |
|----------|------------------|
| Access Logs | 90 days |
| Error Logs | 1 year |
| Audit Logs | 2 years |
| Sync Logs | 30 days (summary: 1 year) |

#### Compliance Standards

| Standard | Applicability |
|----------|---------------|
| GDPR | EU personal data handling |
| ISO 27001 | Information security management |
| SOC 2 Type II | Security controls (available on request) |

---

## 8. Data Types & Formats

### 8.1 Supported Data Types

| Type | JSON Format | Example | Constraints |
|------|-------------|---------|-------------|
| String | `"text"` | `"Product Name"` | UTF-8 encoded |
| Integer | `123` | `100` | ±2^53-1 safe |
| Float/Decimal | `123.45` | `1999.99` | 4 decimal places max |
| Boolean | `true/false` | `true` | - |
| Date | `"YYYY-MM-DD"` | `"2025-01-15"` | ISO 8601 |
| DateTime | ISO 8601 | `"2025-01-15T14:30:00Z"` | UTC timezone |
| Array | `[...]` | `["a","b"]` | Max 1000 items |
| Object | `{...}` | `{"key":"val"}` | Nested max 5 levels |
| Enum | String (specific values) | `"active"` | See enums below |
| Null | `null` | `null` | Where allowed |

### 8.2 Date/Time Formats

| Usage | Format | Example | Notes |
|-------|--------|---------|-------|
| API Input/Output | ISO 8601 UTC | `2025-01-15T14:30:00.000Z` | Always UTC |
| Display | Localized | `15/01/2025 14:30` | Per user locale |
| Filters | ISO 8601 or Relative | `2025-01-15` or `-7d` | Various formats |
| Cron Schedule | Standard cron | `0 */4 * * *` | UTC based |

### 8.3 Number Formats

| Type | Precision | Example | Notes |
|------|-----------|---------|-------|
| Currency | 2 decimals | `150000.00` | DZD (no cents typically) |
| Percentage | 2 decimals | `19.00` | Tax rates |
| Quantity | Integer | `100` | Stock counts |
| Weight | 3 decimals | `2.500` | Kilograms |
| Dimensions | 2 decimals | `30.50` | Centimeters |
| Lat/Lng | 6 decimals | `36.753846` | Coordinates |

### 8.4 Country & Region Codes

#### Country Codes (ISO 3166-1 alpha-2)

| Code | Country | Code | Country |
|------|---------|------|---------|
| DZ | Algeria | MA | Morocco |
| TN | Tunisia | FR | France |
| CN | China | DE | Germany |
| US | USA | GB | UK |

#### Wilaya Codes (Algeria)

| Code | Wilaya | Code | Wilaya |
|------|--------|------|--------|
| 01 | Adrar | 16 | Alger |
| 07 | Biskra | 13 | Bouira |
| 28 | Constantine | 39 | Oran |
| 15 | Tizi Ouzou | 43 | Setif |

Full wilaya reference available at: `/api/reference/wilayas`

### 8.5 Currency Codes (ISO 4217)

| Code | Currency | Decimals |
|------|----------|----------|
| DZD | Algerian Dinar | 2 |
| EUR | Euro | 2 |
| USD | US Dollar | 2 |
| MAD | Moroccan Dirham | 2 |
| TND | Tunisian Dinar | 3 |

---

## Appendix A: SDK Libraries

Official SDKs available:

| Language | Package | Installation |
|----------|---------|-------------|
| JavaScript/TypeScript | `@algeriatrade/erp-sdk` | `npm install @algeriatrade/erp-sdk` |
| Python | `algeriatrade-erp` | `pip install algeriatrade-erp` |
| Java | `com.algeriatrade:erp-sdk` | Maven Central |
| C# | `AlgeriaTrade.ErpSdk` | NuGet Gallery |
| PHP | `algeriatrade/erp-client` | Composer |

**Quick Start (JavaScript):**

```typescript
import { ErpClient } from '@algeriatrade/erp-sdk';

const client = new ErpClient({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  environment: 'production' // or 'staging', 'sandbox'
});

// Test connection
const result = await client.connections.test('conn_abc123');
console.log(result);

// Start sync
const job = await client.sync.start({
  connectionId: 'conn_abc123',
  syncType: 'full',
  entities: ['products', 'inventory']
});
console.log(`Job started: ${job.job_id}`);
```

---

## Appendix B: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-15 | Initial release |

---

*© 2025 AlgeriaTrade.dz - All Rights Reserved*
