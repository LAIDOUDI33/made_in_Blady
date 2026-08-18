# ERP Integration Pilot Program - Customer Onboarding Guide

**AlgeriaTrade.dz B2B Marketplace**  
**Version 1.0 | Last Updated: January 2025**

---

## Welcome to AlgeriaTrade.dz ERP Integration

Welcome to the ERP Integration Pilot Program! This guide will walk you through connecting your Enterprise Resource Planning (ERP) system to AlgeriaTrade.dz for seamless inventory synchronization and order management.

### Why Integrate Your ERP?

| Benefit | Description |
|---------|-------------|
| **Real-time Inventory Sync** | Keep stock levels accurate across all channels |
| **Automated Order Processing** | Orders flow directly into your ERP |
| **Reduced Manual Work** | Eliminate duplicate data entry |
| **Fewer Errors** | Automated validation and error handling |
| **Faster Fulfillment** | Streamlined order-to-ship workflow |

### Program Overview

- **Duration**: 14-day guided onboarding
- **Support**: Dedicated ERP specialist assigned
- **Success Criteria**: >99% sync success rate
- **Go-Live**: Day 14 (with option to extend testing)

---

## Supported ERP Systems

AlgeriaTrade.dz supports integration with the following ERP systems:

### Primary Connectors

| ERP System | Versions Supported | Protocol | Sync Modes |
|------------|-------------------|----------|------------|
| **SAP S/4HANA** | 2020+ | OData/REST | Bidirectional |
| **SAP Business One** | 10.x | DI API/REST | Bidirectional |
| **Odoo Community** | 16.0, 17.0 | XML-RPC/REST | Bidirectional |
| **Odoo Enterprise** | 16.0, 17.0 | XML-RPC/REST | Bidirectional |
| **Microsoft Dynamics 365** | Finance & Operations | OData/REST | Bidirectional |
| **Custom REST APIs** | Any | REST | Bidirectional |

### Connector Capabilities Matrix

| Feature | SAP | Odoo | Dynamics | REST API |
|---------|-----|------|----------|----------|
| Product Sync | ✅ | ✅ | ✅ | ✅ |
| Inventory Sync | ✅ | ✅ | ✅ | ✅ |
| Order Push | ✅ | ✅ | ✅ | ✅ |
| Order Status Pull | ✅ | ✅ | ✅ | ✅ |
| Pricing Sync | ✅ | ✅ | ✅ | ⚠️ Custom |
| Customer Sync | ✅ | ✅ | ✅ | ⚠️ Custom |
| Webhook Support | ✅ | ✅ | ✅ | ✅ |
| Real-time Sync | ✅ | ✅ | ✅ | ✅ |

---

## Phase 1: Preparation (Day 1-2)

### 1.1 Gather Required Information

Before starting the integration process, collect the following information:

#### ERP System Information
- [ ] **ERP System Name**: _______________________
- [ ] **Version**: _______________________
- [ ] **Installation Type**: ☐ Cloud ☐ On-Premise ☐ Hybrid
- [ ] **Number of Users**: _______________________

#### Access Credentials
- [ ] **Admin Username**: _______________________
- [ ] **Admin Password**: (Securely stored)
- [ ] **Service Account** (recommended): _______________________
- [ ] **API Key** (if applicable): _______________________

#### Data Scope
- [ ] **Total Products to Sync**: _______________________
- [ ] **Categories to Include**: _______________________
- [ ] **Inventory Locations/Warehouses**: _______________________
- [ ] **Price Lists to Sync**: _______________________

#### Contact Information
- [ ] **Primary Technical Contact**: _______________________
- [ ] **Email**: _______________________
- [ ] **Phone**: _______________________
- [ ] **Backup Contact**: _______________________

### 1.2 Network Requirements

Ensure your IT team has configured the following:

#### Outbound Connections (Required)
```
Protocol: HTTPS (TLS 1.2+)
Port: 443
Destination: api.algeriatrade.dz
Purpose: API calls to AlgeriaTrade.dz
```

#### Inbound Connections (For Webhooks - Optional)
```
Protocol: HTTPS (TLS 1.2+)
Port: 443 (configurable)
Source IPs: [See Technical Reference]
Purpose: Receive real-time updates from AlgeriaTrade.dz
```

#### Firewall Whitelist
Request your IT team to whitelist:
- **API Endpoint**: `api.algeriatrade.dz`
- **Webhook IPs**: 
  - `185.XXX.XXX.XXX` (Primary - EU West)
  - `185.XXX.XXX.XXX` (Secondary - EU Central)
- **IPs to be provided by your ERP Specialist during kickoff call**

### 1.3 Data Preparation

Proper data preparation ensures smooth synchronization:

#### Product Master Data Requirements

| Field | Required | Format | Notes |
|-------|----------|--------|-------|
| Product Name | Yes | String (max 255 chars) | Must be unique per SKU |
| SKU / Article No | Yes | Alphanumeric | Unique identifier |
| Price | Yes | Decimal (2 places) | In DZD or configured currency |
| Quantity | Yes | Integer | Current stock level |
| Category | Recommended | String | Map to AlgeriaTaxonomy |
| Description | Optional | HTML/Text | For product listings |
| Weight | Optional | Decimal | For shipping calculations |
| Dimensions | Optional | L×W×H | For shipping calculations |
| Images URLs | Optional | Array | Publicly accessible URLs |

#### Units of Measure Standardization

Ensure your UoM matches our supported units:

| Your UoM | Map To | Notes |
|----------|--------|-------|
| Piece (PC) | unit | Default unit |
| Box (BX) | box | Contains multiple pieces |
| Carton (CT) | carton | Contains multiple boxes |
| Kilogram (KG) | kg | Weight-based |
| Liter (LT) | liter | Volume-based |
| Meter (MT) | meter | Length-based |

#### Category Mapping to AlgeriaTaxonomy

Map your categories to our standardized taxonomy:

| Your Category | AlgeriaTaxonomy ID | Example Products |
|---------------|-------------------|------------------|
| Electronics | CAT-001 | Phones, Laptops |
| Textiles | CAT-002 | Clothing, Fabrics |
| Machinery | CAT-003 | Industrial Equipment |
| Food & Beverage | CAT-004 | Processed Foods |
| Chemicals | CAT-005 | Industrial Chemicals |
| Construction | CAT-006 | Building Materials |

> 💡 **Tip**: Request a complete taxonomy export from your ERP Specialist for detailed mapping.

### 1.4 Pre-Integration Checklist

Complete these items before proceeding to Phase 2:

- [ ] All required information gathered (Section 1.1)
- [ ] Network access confirmed by IT (Section 1.2)
- [ ] Product data reviewed and cleaned (Section 1.3)
- [ ] Service account created in ERP (if applicable)
- [ ] Kickoff call scheduled with ERP Specialist
- [ ] Test environment identified (or production with caution)

---

## Phase 2: Connection Setup (Day 3-4)

### 2.1 Access ERP Integration Portal

Follow these steps to access the integration setup:

1. **Login to AlgeriaTrade.dz Seller Dashboard**
   - URL: `https://algeriatrade.dz/seller/dashboard`
   - Use your seller account credentials

2. **Navigate to Integrations**
   ```
   Settings → Integrations → ERP Connectors
   ```

3. **Initiate New Connection**
   - Click **"Connect New ERP"** button
   - You will be guided through the setup wizard

### 2.2 Select Your ERP Type

Choose your ERP system from the available options:

#### SAP S/4HANA / Business One
![SAP Logo Placeholder]  
*Select this option for SAP S/4HANA or SAP Business One installations*

**Prerequisites:**
- SAP user with API access permissions
- OData services enabled (for S/4HANA) or DI API (for Business One)
- Service endpoint URL ready

#### Odoo Community/Enterprise
![Odoo Logo Placeholder]  
*Select this option for Odoo 16.x or 17.x installations*

**Prerequisites:**
- External API access enabled (`Settings → General Settings`)
- API Key generated for the database user
- Database name confirmed

#### Microsoft Dynamics 365
![Dynamics Logo Placeholder]  
*Select this option for Dynamics 365 Finance & Operations*

**Prerequisites:**
- Azure AD application registered
- OAuth2 credentials obtained
- Data entities enabled for OData

#### Custom REST API
![API Logo Placeholder]  
*Select this option for custom or unsupported ERPs*

**Prerequisites:**
- REST API endpoints documented
- Authentication method determined
- API documentation available

### 2.3 Enter Connection Details

#### SAP Configuration Form

```json
{
  "connection_name": "My SAP Production",
  "erp_type": "sap_s4hana",
  "host_url": "https://your-sap-system.com",
  "client_id": "100",
  "authentication": {
    "type": "oauth2",  // or "basic"
    "username": "api_user",
    "password": "********",
    "token_url": "https://your-sap-system.com/oauth/token"
  },
  "odata_settings": {
    "service_path": "/sap/opu/odata/sap/",
    "product_service": "API_PRODUCT_SRV",
    "inventory_service": "API_INVENTORY_SRV"
  },
  "advanced": {
    "page_size": 100,
    "timeout_seconds": 30,
    "retry_attempts": 3
  }
}
```

**Field Descriptions:**

| Field | Description | Example |
|-------|-------------|---------|
| connection_name | Friendly name for this connection | "SAP Production" |
| host_url | Base URL of your SAP system | https://sap.company.com |
| client_id | SAP Client number | 100, 200, etc. |
| authentication.type | Auth method: oauth2 or basic | oauth2 |
| odata_settings.service_path | Path to OData services | /sap/opu/odata/sap/ |

#### Odoo Configuration Form

```json
{
  "connection_name": "Odoo Production DB",
  "erp_type": "odoo",
  "url": "https://your-odoo.com",
  "database": "production_db",
  "authentication": {
    "type": "api_key",  // or "xmlrpc"
    "api_key": "your-api-key-here",
    "username": "admin",
    "password": ""  // Only for xmlrpc auth
  },
  "odoo_settings": {
    "model_prefix": "",
    "language_code": "en_US",
    "company_id": 1
  }
}
```

**Field Descriptions:**

| Field | Description | Example |
|-------|-------------|---------|
| url | Full URL to Odoo instance | https://odoo.company.com |
| database | Target database name | production |
| authentication.api_key | Key from User Preferences | abc123xyz... |
| odoo_settings.company_id | Company ID for multi-company | 1 |

#### Microsoft Dynamics 365 Configuration

```json
{
  "connection_name": "Dynamics F&O",
  "erp_type": "dynamics365",
  "instance_url": "https://your-org.operations.dynamics.com",
  "tenant_id": "your-azure-tenant-id",
  "authentication": {
    "type": "oauth2",
    "client_id": "your-app-client-id",
    "client_secret": "your-client-secret",
    "scope": "https://your-org.operations.dynamics.com/.default"
  },
  "odata_settings": {
    "data_area_id": "usmf",
    "company": "USMF"
  }
}
```

#### REST API Configuration

```json
{
  "connection_name": "Custom ERP API",
  "erp_type": "rest_api",
  "base_url": "https://api.your-erp.com/v2",
  "authentication": {
    "type": "bearer_token",  // or "basic" or "api_key"
    "header_name": "Authorization",
    "token": "your-access-token"
  },
  "endpoints": {
    "products": {
      "list": "/products",
      "get": "/products/{id}",
      "create": "/products",
      "update": "/products/{id}"
    },
    "inventory": {
      "list": "/inventory",
      "update": "/inventory/{id}"
    },
    "orders": {
      "list": "/orders",
      "create": "/orders",
      "update": "/orders/{id}",
      "status": "/orders/{id}/status"
    }
  },
  "pagination": {
    "type": "cursor",  // or "offset" or "page"
    "page_param": "page",
    "limit_param": "limit",
    "cursor_param": "cursor"
  }
}
```

### 2.4 Test Connection

After entering configuration details:

1. **Click "Test Connection" button**
2. **Wait for validation results** (typically 5-15 seconds)

#### Expected Success Response
```
✅ Connection Successful!

Details:
- Latency: 145ms
- Authentication: Verified
- API Access: Confirmed
- Version Detected: SAP S/4HANA 2023

Next Step: Proceed to Field Mapping →
```

#### Common Error Messages

| Error Code | Message | Resolution |
|------------|---------|------------|
| `AUTH_001` | Invalid credentials | Verify username/password or API key |
| `AUTH_002` | Token expired | Refresh OAuth token |
| `NET_001` | Connection timeout | Check firewall/network settings |
| `NET_002` | DNS resolution failed | Verify host URL is correct |
| `API_001` | Service not found | Check OData/service path configuration |
| `SSL_001` | Certificate invalid | Ensure valid SSL certificate installed |

---

## Phase 3: Field Mapping (Day 5-7)

### 3.1 Understanding Auto-Detected Mappings

When you first connect, the system attempts to auto-detect field mappings based on common patterns:

#### Default Product Mappings

| Source Field (Your ERP) | Target Field (AlgeriaTrade) | Data Type | Auto-Mapped |
|------------------------|----------------------------|-----------|-------------|
| MATNR / MaterialNo | sku | String | ✅ Yes |
| MAKTX / Name | title | String | ✅ Yes |
| Description / LongText | description | Text | ✅ Yes |
| Price / NetPrice | price | Decimal | ✅ Yes |
| Currency | currency | String (ISO) | ✅ Yes |
| Stock / Quantity | stock_quantity | Integer | ✅ Yes |
| BaseUnit / UoM | unit | String | ⚠️ Partial |
| Category / ProductGroup | category_id | Reference | ❌ Manual |
| Weight | weight | Decimal | ⚠️ If exists |
| ImageURL / Picture | images | Array | ❌ Manual |
| Brand / Manufacturer | brand | String | ⚠️ If exists |
| EAN / Barcode | barcode | String | ⚠️ If exists |
| Status / Active | status | Enum | ⚠️ Partial |

### 3.2 Using the Mapping Editor

The drag-and-drop mapping editor allows you to customize how data flows between systems.

#### Interface Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  FIELD MAPPING EDITOR                    Preset: SAP_Products_v1 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────┐     ┌───────────────────┐                │
│  │   SOURCE (ERP)    │     │   TARGET (Market) │                │
│  │                   │     │                   │                │
│  │  □ MATNR          │ ──→ │  □ sku            │                │
│  │  □ MAKTX          │ ──→ │  □ title          │                │
│  │  □ NET_PRICE      │ ──→ │  □ price          │                │
│  │  □ WERKS          │ ──→ │  □ warehouse_id   │                │
│  │  □ MTART          │ ──→ │  + Add Transform  │                │
│  │  □ BRAND_E        │ ──→ │  □ brand          │                │
│  │  □ ...            │     │  □ ...            │                │
│  │                   │     │                   │                │
│  └───────────────────┘     └───────────────────┘                │
│                                                                 │
│  Transformation Rules:                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ MAKTX → title: UPPERCASE → TRIM                          │   │
│  │ NET_PRICE → price: ROUND(2)                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Test Mapping]  [Save Preset]  [Reset]                        │
└─────────────────────────────────────────────────────────────────┘
```

#### Available Transformations

Apply transformations to clean or format data during sync:

| Transformation | Syntax | Example Input | Output |
|----------------|--------|---------------|--------|
| Uppercase | `UPPERCASE()` | "product name" | "PRODUCT NAME" |
| Lowercase | `lowercase()` | "Product Name" | "product name" |
| Trim | `TRIM()` | "  product  " | "product" |
| Round | `ROUND(n)` | 19.995 | 20.00 |
| Format Date | `DATE_FORMAT(fmt)` | 20250115 | "2025-01-15" |
| Concat | `CONCAT(a,b)` | "SKU" + "001" | "SKU001" |
| Replace | `REPLACE(old,new)` | "A-B-C" | "ABC" |
| Default Value | `DEFAULT(val)` | null | "N/A" |
| Lookup | `LOOKUP(table)` | "CAT01" | "Electronics" |
| Regex Extract | `REGEX(pattern)` | "SKU-123-456" | "123" |

### 3.3 Creating Custom Mappings

To add a custom field mapping:

1. **Drag from source to target** (or click "+ Add Mapping")
2. **Select transformation rules** if needed
3. **Set default values** for missing data
4. **Validate** using the test function

#### Example: Complex Mapping Scenario

**Requirement:** Map SAP material type to AlgeriaTrade category with fallback

```
Source: MTART (Material Type)
Target: category_id

Transformation Logic:
  IF MTART = "FERT" THEN "CAT-001"  (Finished Goods → Electronics)
  IF MTART = "HALB" THEN "CAT-003"  (Semi-finished → Machinery)
  IF MTART = "ROH"  THEN "CAT-005"  (Raw Material → Chemicals)
  ELSE DEFAULT("CAT-099")           (Unknown → Other)
```

### 3.4 Saving Mapping Presets

Save your mapping configuration for reuse:

1. **Click "Save Preset" button**
2. **Enter preset details:**

| Field | Value | Example |
|-------|-------|---------|
| Preset Name | *Required* | "SAP_Products_v1" |
| Description | Optional | "Production product sync config" |
| Version | Auto-incremented | v1, v2, etc. |
| Scope | Global/User | User (default) |

3. **Confirm save**

> ⚠️ **Best Practice**: Version your presets (e.g., `_v1`, `_v2`) to track changes over time.

---

## Phase 4: Sync Configuration (Day 8-9)

### 4.1 Choosing Sync Direction

Configure how data flows between your ERP and AlgeriaTrade.dz:

#### Sync Direction Options

| Mode | Description | Use Case |
|------|-------------|----------|
| **Push Only** | AlgeriaTrade → Your ERP | Order processing only |
| **Pull Only** | Your ERP → AlgeriaTrade | Catalog publishing only |
| **Bidirectional** | Both ways | Full integration (Recommended) |

#### Data Flow Diagram (Bidirectional)

```
┌─────────────────────┐         ┌─────────────────────┐
│                     │         │                     │
│   YOUR ERP SYSTEM   │◄───────►│   ALGERIATRADE.DZ   │
│                     │  SYNC   │                     │
│  • Products    ─────┼───────► │  • Product Catalog  │
│  • Inventory  ─────┼───────► │  • Stock Levels     │
│  • Prices     ─────┼───────► │  • Display Prices   │
│                     │         │                     │
│  • Orders     ◄────┼──────── │  • New Orders       │
│  • Updates    ◄────┼──────── │  • Status Changes   │
│  • Customers  ◄────┼──────── │  • Buyer Info       │
│                     │         │                     │
└─────────────────────┘         └─────────────────────┘
```

### 4.2 Setting Up Sync Schedule

Choose when and how often synchronization occurs:

#### Schedule Options

| Frequency | Latency | Resource Usage | Best For |
|-----------|---------|----------------|----------|
| **Real-time (Webhooks)** | < 1 second | High | Critical inventory |
| **Every 5 minutes** | ~5 min | Medium-High | Active sellers |
| **Every 15 minutes** | ~15 min | Medium | Standard operations |
| **Hourly** | ~1 hour | Low-Medium | Less frequent changes |
| **Daily (Scheduled)** | ~24 hours | Low | Batch updates only |

#### Recommended Configuration by Use Case

**E-commerce Heavy (High Order Volume):**
```json
{
  "sync_schedule": {
    "inventory": { "frequency": "realtime", "method": "webhook" },
    "orders": { "frequency": "realtime", "method": "webhook" },
    "products": { "frequency": "hourly", "method": "polling" },
    "prices": { "frequency": "every_15min", "method": "polling" }
  }
}
```

**Standard B2B (Moderate Volume):**
```json
{
  "sync_schedule": {
    "inventory": { "frequency": "every_15min", "method": "polling" },
    "orders": { "frequency": "every_5min", "method": "polling" },
    "products": { "frequency": "daily", "method": "polling", "time": "02:00" },
    "prices": { "frequency": "daily", "method": "polling", "time": "02:00" }
  }
}
```

### 4.3 Configuring Conflict Resolution

Define what happens when data conflicts occur:

#### Conflict Resolution Strategies

| Strategy | Behavior | When to Use |
|----------|----------|-------------|
| **Last Write Wins** | Most recent update prevails | Single source of truth not critical |
| **AlgeriaTrade Wins** | Platform data takes priority | Marketplace is master |
| **ERP Wins** | Your system takes priority | ERP is master (common) |
| **Manual Review** | Queue for human decision | High-value/disputed data |

#### Per-Entity Conflict Rules

You can set different strategies per entity type:

```json
{
  "conflict_resolution": {
    "product_title": { "strategy": "erp_wins", "reason": "Official product names" },
    "product_price": { "strategy": "last_write_wins", "reason": "Dynamic pricing" },
    "stock_quantity": { "strategy": "erp_wins", "reason": "Physical inventory" },
    "order_status": { "strategy": "algeriatrade_wins", "reason": "Order lifecycle owner" },
    "customer_address": { "strategy": "manual_review", "reason": "Data quality" }
  }
}
```

### 4.4 Advanced Sync Options

#### Incremental vs Full Sync

| Mode | Description | When Used |
|------|-------------|-----------|
| **Incremental** | Only changed records since last sync | Normal operation (faster) |
| **Full** | All records regardless of changes | Initial sync, recovery |

#### Filter Rules

Limit which records are synced:

```json
{
  "filters": {
    "products": [
      { "field": "status", "operator": "=", "value": "active" },
      { "field": "category", "operator": "IN", "value": ["CAT-001", "CAT-002"] }
    ],
    "inventory": [
      { "field": "warehouse", "operator": "=", "value": "WH-ALGIERS" }
    ]
  }
}
```

#### Webhook Configuration (Real-time Sync)

For real-time updates, configure webhooks in your ERP:

**Webhook Endpoints to Register:**

| Event | Endpoint | Payload |
|-------|----------|---------|
| Inventory Changed | `/api/webhooks/inventory-change` | `{sku, quantity, warehouse}` |
| Order Created | `/api/webhooks/order-created` | `{order_id, items, buyer}` |
| Order Updated | `/api/webhooks/order-updated` | `{order_id, status}` |
| Product Changed | `/api/webhooks/product-changed` | `{sku, fields_changed}` |

**Webhook Signature Verification:**
```
X-Algeriatrade-Signature: sha256=abc123...
X-Algeriatrade-Timestamp: 1705312800
```

---

## Phase 5: Testing (Day 10-12)

### 5.1 Running Initial Full Sync

Execute your first complete synchronization:

#### Steps to Run Full Sync

1. **Navigate to Sync Dashboard**
   ```
   Integrations → ERP → [Your Connection] → Sync Dashboard
   ```

2. **Click "Run Full Sync" Button**
   
3. **Monitor Progress in Real-Time**

```
┌─────────────────────────────────────────────────────────────┐
│  SYNCHRONIZATION IN PROGRESS                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Progress: ████████████████████░░░░ 78%                    │
│                                                             │
│  Stage: Pulling Products from ERP                           │
│                                                             │
│  Statistics:                                                │
│  ├─ Products Found: 1,247                                   │
│  ├─ Products Synced: 973                                    │
│  ├─ Products Skipped: 12                                    │
│  ├─ Products Failed: 0                                      │
│  └─ Estimated Time Remaining: 4m 32s                       │
│                                                             │
│  Recent Activity:                                           │
│  ✓ SKU-10001 synced successfully                            │
│  ✓ SKU-10002 synced successfully                            │
│  ✓ SKU-10003 synced successfully                            │
│  ...                                                        │
│                                                             │
│  [Pause Sync]  [Cancel Sync]  [View Log]                   │
└─────────────────────────────────────────────────────────────┘
```

4. **Review Completion Summary**

Upon completion, you'll see:

```
✅ FULL SYNC COMPLETED

Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Products:
  Total Processed: 1,247
  Successfully Synced: 1,235 (99.04%)
  Skipped (Filters): 8
  Failed: 4
  Warnings: 23

Inventory:
  Locations Synced: 3
  Stock Records Updated: 1,189

Performance:
  Duration: 12m 34s
  Avg Record Time: 0.6s
  Peak Memory: 256MB

Errors (4):
  - SKU-50023: Invalid price format
  - SKU-50045: Missing required field 'title'
  - SKU-50067: Duplicate SKU detected
  - SKU-50089: Category mapping failed

[Download Full Report]  [Retry Failed]  [Continue to Testing]
```

### 5.2 Verifying Data Accuracy

After sync completes, verify data integrity in both systems:

#### Verification Checklist

##### Product Data Verification

| Check Item | In ERP | On AlgeriaTrade | Match? |
|------------|--------|-----------------|--------|
| Product count | 1,247 | 1,235 | ☐ |
| Sample: SKU-10001 name | | | ☐ |
| Sample: SKU-10001 price | | | ☐ |
| Sample: SKU-10001 description | | | ☐ |
| Sample: SKU-10001 category | | | ☐ |
| Special characters preserved | | | ☐ |
| Arabic text displays correctly | | | ☐ |

##### Inventory Verification

| Check Item | In ERP | On AlgeriaTrade | Match? |
|------------|--------|-----------------|--------|
| Warehouse WH-ALG stock | | | ☐ |
| Warehouse WH-ORA stock | | | ☐ |
| Sample: SKU-10001 qty | | | ☐ |
| Negative quantities handled | N/A | | ☐ |
| Zero stock shows correctly | | | ☐ |

##### Image & Media Verification

| Check Item | Expected | Actual | OK? |
|------------|----------|--------|-----|
| Images load correctly | | | ☐ |
| Image dimensions correct | | | ☐ |
| No broken image links | 0 | | ☐ |

### 5.3 Testing Order Flow

Validate end-to-order order processing:

#### Test Order Flow Diagram

```
Step 1          Step 2          Step 3          Step 4
Create Order    Order Appears   Update Status    Status Syncs Back
    │               │               │               │
    ▼               ▼               ▼               ▼
┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│Algeria │    │  ERP   │    │  ERP   │    │Algeria │
│Trade   │ ──►│System  │ ──►│System  │ ──►│Trade   │
│.dz     │    │        │    │        │    │.dz     │
└────────┘    └────────┘    └────────┘    └────────┘
```

#### Step-by-Step Test Procedure

**Step 1: Create Test Order on AlgeriaTrade.dz**
1. Login as test buyer account
2. Add products from integrated seller to cart
3. Complete checkout with test payment
4. Note order number: `ORD-TEST-XXXXX`

**Expected Result:**
- Order created with status "Pending Confirmation"
- Order confirmation email sent

**Step 2: Verify Order Appears in ERP**
1. Login to your ERP system
2. Navigate to Sales Orders module
3. Search for order reference `ORD-TEST-XXXXX`

**Expected Result:**
- Order visible in ERP within sync cycle (max 15 min for polling)
- Line items match AlgeriaTrade order
- Customer information populated

**Step 3: Update Order Status in ERP**
1. Open the test order in ERP
2. Change status to "Confirmed" or equivalent
3. Save changes

**Expected Result:**
- Status change triggers sync
- Update queued for push to AlgeriaTrade

**Step 4: Verify Status Synced to AlgeriaTrade**
1. Return to AlgeriaTrade seller dashboard
2. Navigate to Orders
3. Check order `ORD-TEST-XXXXX`

**Expected Result:**
- Order status updated to "Confirmed"
- Timeline shows status change history
- Buyer notified of update (if configured)

### 5.4 Testing Inventory Updates

Verify inventory synchronization works correctly:

#### Test Procedure

**Scenario A: ERP Stock Decrease**

1. **In ERP:** Reduce stock of SKU-10001 from 100 to 95
2. **Wait:** One sync cycle (per your schedule)
3. **On AlgeriaTrade:** Check product page for SKU-10001
4. **Verify:** Stock shows 95 (or less if orders occurred)

**Scenario B: ERP Stock Increase**

1. **In ERP:** Increase stock of SKU-10002 from 50 to 200
2. **Wait:** One sync cycle
3. **On AlgeriaTrade:** Check product page for SKU-10002
4. **Verify:** Stock shows 200

**Scenario C: Stock-Out Condition**

1. **In ERP:** Set stock of SKU-10003 to 0
2. **Wait:** One sync cycle
3. **On AlgeriaTrade:** Check product page
4. **Verify:** Product shows "Out of Stock" or is hidden (per config)

**Scenario D: New Product Addition**

1. **In ERP:** Create new product SKU-99999
2. **Fill required fields** (name, price, stock, category)
3. **Wait:** Next product sync cycle
4. **On AlgeriaTrade:** Search for new product
5. **Verify:** Product appears in catalog

### 5.5 Error Handling Testing

Test how the system handles various error scenarios:

| Test Case | Action | Expected Behavior |
|-----------|--------|-------------------|
| Invalid data | Send product with negative price | Rejected, logged, alert sent |
| Network timeout | Block outbound connections temporarily | Retry with backoff, resume on reconnect |
| Duplicate SKU | Create two products same SKU | Second rejected, warning logged |
| Large payload | Sync 10,000+ products | Chunked processing, no memory issues |
| Auth expiry | Let token expire during sync | Auto-refresh or graceful pause |

---

## Phase 6: Go-Live (Day 14)

### 6.1 Pre Go-Live Checklist

Complete ALL items before switching to production:

#### Technical Readiness

- [ ] Full sync completed successfully (>99% success rate)
- [ ] Data accuracy verified (Section 5.2)
- [ ] Order flow tested end-to-end (Section 5.3)
- [ ] Inventory sync verified (Section 5.4)
- [ ] Error scenarios tested (Section 5.5)
- [ ] Webhook endpoints registered (if using real-time)
- [ ] Firewall rules confirmed permanent
- [ ] Backup/restore procedure documented

#### Business Readiness

- [ ] Internal team trained on monitoring dashboard
- [ ] Support contacts documented and distributed
- [ ] Escalation path understood
- [ ] Rollback plan documented
- [ ] Business hours sync schedule agreed
- [ ] Stakeholder sign-off received

### 6.2 Enabling Live Sync

#### Switching from Test Mode to Production

⚠️ **Warning:** This action will make live changes to your marketplace presence.

1. **Navigate to Integration Settings**
   ```
   Integrations → ERP → [Your Connection] → Settings
   ```

2. **Change Mode Toggle**
   ```
   [🔴 Test Mode]  →  [🟢 Production Mode]
   ```

3. **Confirm Activation**
   - Enter confirmation code sent to admin email
   - Acknowledge go-live terms
   - Click "Activate Production Sync"

4. **Verification**
   - Dashboard shows "Production - Active"
   - First production sync initiates automatically
   - Success notification sent

### 6.3 Monitoring Dashboard Setup

Configure your monitoring view:

#### Key Metrics to Track Daily

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Sync Success Rate | >99% | <95% triggers alert |
| Last Successful Sync | Within schedule | >2x interval = warning |
| Records Processed | As expected | ±20% deviation |
| Error Count | 0 | >10 errors/hour |
| Average Latency | <5s | >30s degraded |
| Data Discrepancies | 0 | Any = review needed |

#### Dashboard View

```
┌─────────────────────────────────────────────────────────────┐
│  ERP INTEGRATION DASHBOARD - LIVE STATUS                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   CONNECTION     │  │   TODAY'S STATS  │                  │
│  │   ● ACTIVE       │  │                  │                  │
│  │   SAP S/4HANA    │  │  Syncs: 47       │                  │
│  │   Up: 3d 14h     │  │  Records: 12,456 │                  │
│  │   Latency: 89ms  │  │  Errors: 0       │                  │
│  └─────────────────┘  │  Success: 100%   │                  │
│                       └─────────────────┘                  │
│                                                             │
│  LAST SYNC ACTIVITY                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Time       | Type      | Records | Status | Duration │  │
│  │────────────|───────────|─────────|--------|──────────│  │
│  │ 14:32:15   | Inventory | 1,234   │ ✅     | 23s      │  │
│  │ 14:30:00   | Orders    | 12      │ ✅     | 5s       │  │
│  │ 14:00:00   | Products  | 45      │ ✅     | 18s      │  │
│  │ 13:30:00   | Prices    | 1,234   │ ✅     | 21s      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  RECENT ALERTS: None 🎉                                     │
│                                                             │
│  [Run Sync Now]  [View Logs]  [Settings]  [Support]        │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Configuring Alerts

Set up notifications for important events:

#### Alert Types

| Alert | Trigger | Notification Channels |
|-------|---------|----------------------|
| Sync Failure | Any sync fails | Email + Dashboard |
| High Error Rate | >5% failure rate | Email + SMS |
| Data Anomaly | Unexpected volume change | Email |
| Auth Expiry | Token expiring in 7 days | Email |
| Security Event | Unauthorized access attempt | Email + SMS + Phone |

#### Configure Alert Recipients

1. **Navigate to:** Integrations → ERP → Alerts
2. **Add recipients:**
   - Primary: IT Operations Manager
   - Secondary: ERP Administrator
   - Escalation: CTO/VP Engineering (for critical alerts)

### 6.5 Support Contacts

Keep these contacts handy for assistance:

| Support Type | Contact | Availability |
|--------------|---------|--------------|
| **General Technical Support** | support@algeriatrade.dz | Mon-Fri, 8AM-6PM CET |
| **ERP Specialist Team** | erp-support@algeriatrade.dz | Mon-Fri, 8AM-8PM CET |
| **Emergency/P1 Incidents** | +213 XXX XXX XXX | 24/7 |
| **Pilot Program Manager** | pilot-program@algeriatrade.dz | Mon-Fri, 9AM-5PM CET |

#### When Contacting Support

Please have the following information ready:

- [ ] Company/Seller ID
- [ ] ERP Connection Name
- [ ] Error messages (screenshots helpful)
- [ ] Time of issue (with timezone)
- [ ] Steps to reproduce (if applicable)
- [ ] Impact assessment (how many orders/products affected)

---

## Troubleshooting Common Issues

### Quick Reference Guide

### Issue: Sync Fails with Authentication Error

**Error Messages:**
- `AUTH_001: Invalid credentials`
- `AUTH_002: Token expired or revoked`
- `401 Unauthorized`

**Diagnosis & Resolution:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Verify credentials in config haven't changed | Correct credentials |
| 2 | Check if service account is still active/enabled | Account active |
| 3 | For OAuth: Check token hasn't expired | Valid token |
| 4 | Verify API key hasn't been rotated | Correct key |
| 5 | Test connection manually via "Test Connection" | Success |

**Prevention:**
- Use service accounts with non-expiring passwords where possible
- Set up calendar reminder for credential rotation (90 days recommended)
- Enable automatic OAuth token refresh

---

### Issue: Products Not Appearing on Marketplace

**Symptoms:**
- Sync reports show products processed but not visible
- Product count mismatch between ERP and marketplace

**Diagnosis & Resolution:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check sync log for warnings/errors | Identify specific failures |
| 2 | Review filter criteria - product may be excluded | Adjust filters |
| 3 | Verify field mappings for required fields | All required mapped |
| 4 | Check category mapping resolved correctly | Valid category assigned |
| 5 | Verify product status set to "active" | Product publishable |
| 6 | Check for duplicate SKU conflicts | Unique SKU |

**Common Causes:**
- Product filtered out by sync rules
- Missing required field (title, price, stock)
- Category mapping failed → defaulted to unmapped
- Product status = inactive/draft

---

### Issue: Inventory Quantities Incorrect

**Symptoms:**
- Stock levels don't match between systems
- Shows 0 when ERP has stock
- Shows stock for out-of-stock items

**Diagnosis & Resolution:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Verify Unit of Measure mapping | Correct conversion |
| 2 | Check warehouse/location filter | Right location syncing |
| 3 | Review decimal precision settings | Proper rounding |
| 4 | Check if multiple warehouses aggregate | Sum or specific logic |
| 5 | Look for pending/queued updates | No stuck queues |
| 6 | Verify timezone handling | Consistent timestamps |

**UoM Conversion Issues:**

If your ERP uses "Carton" but we expect "Units":

| ERP Value | UoM | Multiplier | Our System |
|-----------|-----|------------|------------|
| 10 | CT (Cartons) | ×24 | 240 units |
| 5 | BX (Boxes) | ×12 | 60 units |

Configure multiplier in field mapping if needed.

---

### Issue: Slow Sync Performance

**Symptoms:**
- Sync taking longer than expected
- Timeout errors during large syncs
- Dashboard showing "Running" for extended periods

**Diagnosis & Resolution:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check network latency to api.algeriatrade.dz | <200ms |
| 2 | Review record count being synced | Reasonable volume |
| 3 | Reduce sync frequency temporarily | Less load |
| 4 | Check for retry storms (many failures) | Clean up errors |
| 5 | Verify ERP performance under load | Responsive API |
| 6 | Contact support for optimization review | Expert assistance |

**Optimization Tips:**

1. **Use incremental sync** after initial full sync
2. **Filter out unnecessary records** (inactive, old)
3. **Schedule heavy syncs off-peak** (e.g., 2AM Algeria time)
4. **Enable pagination** for large datasets
5. **Consider webhook for critical data** instead of polling

---

### Issue: Order Not Syncing to ERP

**Symptoms:**
- Orders placed on marketplace don't appear in ERP
- Delay between order placement and ERP appearance

**Diagnosis & Resolution:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Verify pull sync for orders is enabled | Config correct |
| 2 | Check order sync direction setting | Should be AT→ERP |
| 3 | Review sync logs for order failures | Identify errors |
| 4 | Check customer/buyer mapping | Valid customer record |
| 5 | Verify payment status requirement | Per your config |
| 6 | Test with new order | Successful sync |

---

### Issue: Webhook Not Triggering

**Symptoms:**
- Real-time updates not working
- Changes in ERP not reflected immediately

**Diagnosis & Resolution:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Verify webhook URL is correct and accessible | 200 OK response |
| 2 | Check webhook is enabled in ERP settings | Active |
| 3 | Review webhook signature verification | Valid signature |
| 4 | Check firewall allows inbound to webhook handler | Connection allowed |
| 5 | Test webhook with sample payload | Received and processed |
| 6 | Check webhook logs for delivery failures | Successful delivery |

**Webhook Debugging:**

Use our webhook testing tool:
```
Integrations → ERP → [Connection] → Webhooks → Test Webhook
```

This sends a test payload to verify connectivity.

---

## Appendix

### A. Glossary of Terms

| Term | Definition |
|------|------------|
| **ERP** | Enterprise Resource Planning - business management software |
| **OData** | Open Data Protocol - standard for building RESTful APIs |
| **XML-RPC** | Remote Procedure Calling using XML |
| **Webhook** | HTTP callback that delivers data to external applications |
| **Sync** | Synchronization - process of making data consistent across systems |
| **Mapping** | Connecting fields between source and target systems |
| **Payload** | Data transmitted in API requests/responses |
| **SKU** | Stock Keeping Unit - unique product identifier |
| **UoM** | Unit of Measure - quantification standard (kg, pc, etc.) |

### B. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | Documentation Team | Initial release for pilot program |

### C. Feedback & Suggestions

We value your feedback on this guide! Please send suggestions to:
- **Email**: docs-feedback@algeriatrade.dz
- **Subject**: ERP Onboarding Guide Feedback

---

## Document Control

| Property | Value |
|----------|-------|
| **Document ID** | DOC-ERP-ONBOARD-001 |
| **Classification** | Customer Facing - Public |
| **Owner** | ERP Integration Team |
| **Review Cycle** | Quarterly |
| **Next Review** | April 2025 |

---

*© 2025 AlgeriaTrade.dz - All Rights Reserved*
