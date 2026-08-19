# AlgeriaTrade.dz API Developer Portal - Guide d'Intégration Partenaire

## دليل تكامل الشركاء | Partner Integration Guide

---

## Table des Matières

1. [Pour Commencer](#pour-commencer)
2. [Exemples d'Intégration](#exemples-dintégration)
3. [Bonnes Pratiques](#bonnes-pratiques)
4. [Tests & Mise en Production](#tests--mise-en-production)

---

## Pour Commencer

### Inscription Compte Développeur

1. **Accédez au portail**: [https://portal.algeriatrade.dz](https://portal.algeriatrade.dz)

2. **Créez votre compte**:
   ```bash
   # Via API (optionnel pour automatisation)
   curl -X POST https://api.algeriatrade.dz/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "votre@email.com",
       "password": "MotDePasseSécurisé123!",
       "companyName": "Votre Entreprise SARL",
       "phone": "+213XXXXXXXXX",
       "country": "DZ",
       "useCase": "Intégration e-commerce B2B"
     }'
   ```

3. **Vérifiez votre email**:
   - Un email de confirmation sera envoyé
   - Cliquez sur le lien de vérification
   - Le compte passe en statut `active`

4. **Complétez votre profil développeur**:
   ```json
   {
     "developerProfile": {
       "name": "Ahmed Benali",
       "role": "CTO",
       "company": "Tech Solutions SARL",
       "website": "https://techsolutions.dz",
       "description": "Plateforme e-commerce B2B algérienne"
     }
   }
   ```

### Génération de Clé API

1. Connectez-vous au portail développeur
2. Allez dans **Paramètres** → **Clés API**
3. Cliquez sur **Nouvelle Clé API**
4. Sélectionnez les permissions requises:
   - `read` - Lecture des données
   - `write` - Création/modification
   - `admin` - Accès complet (Enterprise uniquement)

5. **Conservez votre clé secrètement!** Elle ne s'affichera qu'une fois:

```bash
# Exemple de clé générée
# Key ID: at_live_abc123def456...
# Secret: at_secret_xyz789uvw012...

# Stockez-la dans vos variables d'environnement
export ALGERIATRADE_API_KEY="at_live_abc123def456..."
export ALGERIATRADE_API_SECRET="at_secret_xyz789uvw012..."
```

### Premier Appel API

Testez votre configuration avec un appel simple:

```bash
# Liste des catégories de produits
curl -X GET "https://api.algeriatrade.dz/v1/products/categories" \
  -H "X-API-Key: $ALGERIATRADE_API_KEY" \
  -H "Accept: application/json"

# Réponse attendue
{
  "success": true,
  "data": [
    {
      "id": "cat-agriculture",
      "name": "Agriculture & Agroalimentaire",
      "slug": "agriculture",
      "productCount": 15420,
      "icon": "leaf"
    },
    {
      "id": "cat-textile",
      "name": "Textile & Habillement",
      "slug": "textile",
      "productCount": 8930,
      "icon": "shirt"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 45,
    "rateLimit": {
      "remaining": 998,
      "resetAt": "2024-01-15T10:01:00Z"
    }
  }
}
```

### Accès Environnement Sandbox

Le sandbox vous permet de tester sans consommer votre quota:

| Propriété | Sandbox | Production |
|-----------|---------|------------|
| URL Base | `https://sandbox.api.algeriatrade.dz/v1` | `https://api.algeriatrade.dz/v1` |
| Préfixe Clé | `at_test_` | `at_live_` |
| Données | Fictives mais réalistes | Réelles |
| Rate Limit | Généreuse | Selon plan |
| Paiements | Simulés | Réels |

```javascript
// Configuration sandbox vs production
const config = {
  sandbox: {
    baseUrl: 'https://sandbox.api.algeriatrade.dz/v1',
    apiKey: process.env.ALGERIATRADE_TEST_KEY,
  },
  production: {
    baseUrl: 'https://api.algeriatrade.dz/v1',
    apiKey: process.env.ALGERIATRADE_LIVE_KEY,
  }
};

const env = process.env.NODE_ENV === 'production' 
  ? config.production 
  : config.sandbox;
```

---

## Exemples d'Intégration

### JavaScript / React (Frontend E-commerce)

```jsx
// src/services/algeriaTradeApi.js
import axios from 'axios';

class AlgeriaTradeAPI {
  constructor(apiKey, options = {}) {
    this.client = axios.create({
      baseURL: options.baseUrl || 'https://api.algeriatrade.dz/v1',
      timeout: options.timeout || 30000,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept-Language': options.locale || 'fr-DZ',
      },
    });

    // Interceptor pour gestion d'erreurs
    this.client.interceptors.response.use(
      response => response.data,
      error => {
        if (error.response?.status === 429) {
          console.warn('Rate limit atteint. Retry après:', 
            error.response.headers['retry-after']);
        }
        return Promise.reject(error);
      }
    );
  }

  // Recherche de produits algériens
  async searchProducts(query, filters = {}) {
    return this.client.get('/products/search', {
      params: { q: query, ...filters }
    });
  }

  // Détail produit avec prix DZD
  async getProduct(productId) {
    return this.client.get(`/products/${productId}`);
  }

  // Créer une commande B2B
  async createOrder(orderData) {
    return this.client.post('/orders', orderData);
  }

  // Suivi d'expédition (Algérie)
  async trackShipment(shipmentId) {
    return this.client.get(`/shipments/${shipmentId}/track`);
  }
}

// Utilisation dans composant React
// src/components/ProductCatalog.jsx
import { useState, useEffect } from 'react';
import { AlgeriaTradeAPI } from '../services/algeriaTradeApi';

function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const api = new AlgeriaTradeAPI(process.env.NEXT_PUBLIC_AT_API_KEY);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await api.searchProducts('textile coton', {
          wilaya: '16',  // Alger
          category: 'textile',
          minPrice: 1000,
          maxPrice: 50000,
          page: 1,
          perPage: 20
        });
        setProducts(response.data.products);
      } catch (error) {
        console.error('Erreur chargement produits:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product}
          currency="DZD"
        />
      ))}
    </div>
  );
}

export default ProductCatalog;
```

### Python / Django (Backend Integration)

```python
# algeria_trade/client.py
import requests
from typing import Optional, Dict, Any
from dataclasses import dataclass
import hashlib
import time
import hmac

@dataclass
class AlgeriaTradeConfig:
    api_key: str
    api_secret: str
    base_url: str = "https://api.algeriatrade.dz/v1"
    timeout: int = 30
    version: str = "1.0.0"


class AlgeriaTradeClient:
    """Client Python pour l'API AlgeriaTrade.dz"""
    
    def __init__(self, config: AlgeriaTradeConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            "X-API-Key": config.api_key,
            "User-Agent": f"AlgeriaTrade-Python/{config.version}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        })
    
    def _generate_signature(self, method: str, path: str, body: str = "") -> str:
        """Génère la signature HMAC pour authentification renforcée"""
        timestamp = str(int(time.time()))
        message = f"{method}\n{path}\n{timestamp}\n{body}"
        signature = hmac.new(
            self.config.api_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"{timestamp}.{signature}"
    
    def _request(
        self, 
        method: str, 
        endpoint: str, 
        params: Optional[Dict] = None,
        json_data: Optional[Dict] = None,
        require_auth: bool = True
    ) -> Dict[str, Any]:
        """Effectue une requête HTTP signée"""
        url = f"{self.config.base_url}{endpoint}"
        
        headers = {}
        if require_auth:
            body_str = "" if not json_data else __import__('json').dumps(json_data)
            headers["X-Signature"] = self._generate_signature(method, endpoint, body_str)
        
        response = self.session.request(
            method=method,
            url=url,
            params=params,
            json=json_data,
            headers=headers,
            timeout=self.config.timeout
        )
        
        response.raise_for_status()
        return response.json()
    
    # --- Produits ---
    
    def search_products(self, query: str, **filters) -> Dict:
        """Recherche de produits"""
        return self._request("GET", "/products/search", params={"q": query, **filters})
    
    def get_product(self, product_id: str) -> Dict:
        """Récupère un produit par ID"""
        return self._request("GET", f"/products/{product_id}")
    
    def get_products_by_category(self, category_slug: str, page: int = 1) -> Dict:
        """Liste les produits par catégorie"""
        return self._request("GET", "/products/categories/{category_slug}", params={"page": page})
    
    # --- Entreprises ---
    
    def search_companies(self, query: str, wilaya: Optional[str] = None) -> Dict:
        """Recherche d'entreprises"""
        params = {"q": query}
        if wilaya:
            params["wilaya"] = wilaya
        return self._request("GET", "/companies/search", params=params)
    
    def get_company(self, company_id: str) -> Dict:
        """Détails entreprise"""
        return self._request("GET", f"/companies/{company_id}")
    
    # --- Commandes ---
    
    def create_order(self, order_data: Dict) -> Dict:
        """Création commande B2B"""
        required_fields = ["items", "buyer_info", "shipping_address"]
        for field in required_fields:
            if field not in order_data:
                raise ValueError(f"Champ requis manquant: {field}")
        return self._request("POST", "/orders", json_data=order_data)
    
    def get_order_status(self, order_id: str) -> Dict:
        """Statut commande"""
        return self._request("GET", f"/orders/{order_id}/status")
    
    # --- Paiements Algériens ---
    
    def create_payment_ccp(self, amount_dzd: int, order_ref: str) -> Dict:
        """Initier paiement CCP (Chèque Postale)"""
        return self._request("POST", "/payments/ccp/init", json_data={
            "amount": amount_dzd,
            "currency": "DZD",
            "orderReference": order_ref,
            "callbackUrl": "https://votre-site.com/payment/callback"
        })
    
    def create_payment_baridimob(self, amount_dzd: int, phone_number: str) -> Dict:
        """Initier paiement BaridiMob"""
        return self._request("POST", "/payments/baridimob/init", json_data={
            "amount": amount_dzd,
            "currency": "DZD",
            "phoneNumber": phone_number,
            "callbackUrl": "https://votre-site.com/payment/callback"
        })


# --- Intégration Django ---

# settings.py
ALGERIATRADE_API_KEY = os.environ.get("ALGERIATRADE_API_KEY")
ALGERIATRADE_API_SECRET = os.environ.get("ALGERIATRADE_API_SECRET")

# views.py
from django.http import JsonResponse
from algeria_trade.client import AlgeriaTradeClient, AlgeriaTradeConfig

def product_search_view(request):
    client = AlgeriaTradeClient(AlgeriaTradeConfig(
        api_key=settings.ALGERIATRADE_API_KEY,
        api_secret=settings.ALGERIATRADE_API_SECRET
    ))
    
    query = request.GET.get("q", "")
    results = client.search_products(query, wilaya=request.GET.get("wilaya"))
    
    return JsonResponse(results)
```

### PHP / Laravel (E-commerce Integration)

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AlgeriaTradeService
{
    protected string $apiKey;
    protected string $apiSecret;
    protected string $baseUrl;
    protected int $timeout;

    public function __construct()
    {
        $this->apiKey = config('services.algeriatrade.api_key');
        $this->apiSecret = config('services.algeriatrade.api_secret');
        $this->baseUrl = config('services.algeriatrade.base_url', 'https://api.algeriatrade.dz/v1');
        $this->timeout = config('services.algeriatrade.timeout', 30);
    }

    /**
     * Recherche de produits algériens
     */
    public function searchProducts(string $query, array $filters = []): array
    {
        $cacheKey = "at_products:" . md5($query . serialize($filters));
        
        return Cache::remember($cacheKey, 3600, function () use ($query, $filters) {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'X-API-Key' => $this->apiKey,
                    'Accept' => 'application/json',
                    'Accept-Language' => app()->getLocale(),
                ])
                ->get("{$this->baseUrl}/products/search", array_merge(['q' => $query], $filters));

            if ($response->failed()) {
                Log::error('AlgeriaTrade API Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                
                throw new \Exception('Erreur recherche produits: ' . $response->status());
            }

            return $response->json();
        });
    }

    /**
     * Créer une commande avec paiement BaridiMob
     */
    public function createOrderWithPayment(array $orderData, string $paymentMethod = 'baridimob'): array
    {
        // Validation
        validator($orderData, [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'buyer_info.name' => 'required|string',
            'buyer_info.phone' => 'required|string',
            'buyer_info.email' => 'required|email',
            'shipping_address.wilaya_code' => 'required|string|size:2',
            'shipping_address.full_address' => 'required|string',
        ])->validate();

        // Créer la commande
        $orderResponse = Http::timeout($this->timeout)
            ->withHeaders([
                'X-API-Key' => $this->apiKey,
                'X-Idempotency-Key' => uniqid('order_', true),
            ])
            ->post("{$this->baseUrl}/orders", $orderData);

        if ($orderResponse->failed()) {
            throw new \Exception('Erreur création commande');
        }

        $order = $orderResponse->json();

        // Initialiser le paiement
        $paymentData = match ($paymentMethod) {
            'baridimob' => [
                'amount' => $order['data']['totalAmount'],
                'currency' => 'DZD',
                'phoneNumber' => $orderData['payment_phone'] ?? $orderData['buyer_info']['phone'],
                'orderReference' => $order['data']['reference'],
                'callbackUrl' => route('payment.callback', ['method' => 'baridimob']),
            ],
            'ccp' => [
                'amount' => $order['data']['totalAmount'],
                'currency' => 'DZD',
                'orderReference' => $order['data']['reference'],
                'callbackUrl' => route('payment.callback', ['method' => 'ccp']),
            ],
            default => throw new \Exception('Méthode de paiement non supportée'),
        };

        $paymentResponse = Http::timeout($this->timeout)
            ->post("{$this->baseUrl}/payments/{$paymentMethod}/init", $paymentData);

        return [
            'order' => $order['data'],
            'payment' => $paymentResponse->json()['data'] ?? null,
        ];
    }

    /**
     * Vérifier le webhook signature
     */
    public function verifyWebhookSignature(array $payload, string $signature): bool
    {
        $expectedSignature = hash_hmac('sha256', json_encode($payload), $this->apiSecret);
        return hash_equals($expectedSignature, $signature);
    }
}

// config/services.php
return [
    'algeriatrade' => [
        'api_key' => env('ALGERIATRADE_API_KEY'),
        'api_secret' => env('ALGERIATRADE_API_SECRET'),
        'base_url' => env('ALGERIATRADE_BASE_URL', 'https://api.algeriatrade.dz/v1'),
        'timeout' => env('ALGERIATRADE_TIMEOUT', 30),
    ],
];

// routes/web.php
use App\Services\AlgeriaTradeService;
use Illuminate\Http\Request;

Route::get('/products/search', function (Request $request, AlgeriaTradeService $at) {
    return response()->json(
        $at->searchProducts($request->get('q'), $request->except(['q']))
    );
});

Route::post('/orders/create', function (Request $request, AlgeriaTradeService $at) {
    return response()->json(
        $at->createOrderWithPayment($request->all(), $request->get('payment_method'))
    );
});
```

### Mobile App (React Native / Flutter)

#### React Native

```typescript
// services/AlgeriaTradeAPI.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Config {
  apiKey: string;
  environment: 'sandbox' | 'production';
}

const BASE_URLS = {
  sandbox: 'https://sandbox.api.algeriatrade.dz/v1',
  production: 'https://api.algeriatrade.dz/v1',
};

export class AlgeriaTradeNativeSDK {
  private config: Config;
  private token: string | null = null;

  constructor(config: Config) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return BASE_URLS[this.config.environment];
  }

  async authenticate(email: string, password: string): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    this.token = data.access_token;
    
    await AsyncStorage.setItem('@at_token', this.token!);
    await AsyncStorage.setItem('@at_refresh', data.refresh_token);
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'Accept-Language': 'fr-DZ',
    };

    if (!this.token) {
      this.token = await AsyncStorage.getItem('@at_token');
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async searchProducts(query: string, filters?: Record<string, any>) {
    const params = new URLSearchParams({ q: query, ...filters });
    const response = await fetch(
      `${this.getBaseUrl()}/products/search?${params}`,
      { headers: await this.getHeaders() }
    );
    return response.json();
  }

  async trackShipment(shipmentId: string) {
    const response = await fetch(
      `${this.getBaseUrl()}/shipments/${shipmentId}/track`,
      { headers: await this.getHeaders() }
    );
    return response.json();
  }

  // Upload document pour vérification (photo, NIF, RCS)
  async uploadDocument(fileUri: string, type: 'identity' | 'commercial' | 'tax') {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'image/jpeg',
      name: `${type}_document.jpg`,
    } as any);
    formData.append('documentType', type);

    const response = await fetch(`${this.getBaseUrl()}/documents/upload`, {
      method: 'POST',
      headers: {
        ...await this.getHeaders(),
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    return response.json();
  }
}
```

#### Flutter (Dart)

```dart
// lib/services/algeria_trade_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AlgeriaTradeService {
  final String _apiKey;
  final String _apiSecret;
  final bool _isSandbox;
  
  static const Map<bool, String> _baseUrls = {
    true: 'https://sandbox.api.algeriatrade.dz/v1',
    false: 'https://api.algeriatrade.dz/v1',
  };

  AlgeriaTradeService({
    required String apiKey,
    required String apiSecret,
    bool isSandbox = true,
  })  : _apiKey = apiKey,
        _apiSecret = apiSecret,
        _isSandbox = isSandbox;

  String get _baseUrl => _baseUrls[_isSandbox]!;
  
  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('at_token');
    
    return {
      'Content-Type': 'application/json',
      'X-API-Key': _apiKey,
      if (token != null) 'Authorization': 'Bearer $token',
      'Accept-Language': 'ar-DZ',
    };
  }

  /// Rechercher des produits
  Future<Map<String, dynamic>> searchProducts({
    required String query,
    String? wilayaCode,
    String? categorySlug,
    int page = 1,
    int perPage = 20,
  }) async {
    final queryParams = {
      'q': query,
      if (wilayaCode != null) 'wilaya': wilayaCode,
      if (categorySlug != null) 'category': categorySlug,
      'page': page.toString(),
      'per_page': perPage.toString(),
    };
    
    final uri = Uri.parse('$_baseUrl/products/search')
        .replace(queryParameters: queryParams);
    
    final response = await http.get(uri, headers: await _getHeaders());
    
    return jsonDecode(response.body);
  }

  /// Créer une commande
  Future<Map<String, dynamic>> createOrder({
    required List<Map<String, dynamic>> items,
    required Map<String, dynamic> buyerInfo,
    required Map<String, dynamic> shippingAddress,
    String paymentMethod = 'baridimob',
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/orders'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'items': items,
        'buyer_info': buyerInfo,
        'shipping_address': shippingAddress,
        'payment_method': paymentMethod,
      }),
    );

    return jsonDecode(response.body);
  }

  /// Suivre une expédition
  Future<Map<String, dynamic>> trackShipment(String shipmentId) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/shipments/$shipmentId/track'),
      headers: await _getHeaders(),
    );

    return jsonDecode(response.body);
  }
}
```

---

## Bonnes Pratiques

### Gestion des Erreurs

```typescript
// Pattern de gestion d'erreurs recommandé
interface APIError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  requestId: string;
  retryable: boolean;
}

async function handleAPIError(error: unknown): Promise<never> {
  if (error instanceof AlgeriaTradeAPIError) {
    switch (error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        // Attendre et réessayer
        const retryAfter = error.headers['retry-after'];
        await sleep(parseInt(retryAfter) * 1000);
        throw new RetryableError(error);
      
      case 'INVALID_API_KEY':
        // Arrêter immédiatement - erreur configuration
        logger.error('Clé API invalide', { error });
        throw new FatalError('Configuration API incorrecte');
      
      case 'QUOTA_EXCEEDED':
        // Avertir l'administrateur
        alertAdmin('Quota API dépassé');
        throw new QuotaExceededError(error.message);
      
      case 'VALIDATION_ERROR':
        // Erreur côté client - corriger les données
        throw new ValidationError(error.details);
      
      default:
        throw error;
    }
  }
  throw error;
}
```

### Logique de Retry

```python
# retry_decorator.py
import functools
import random
import time
from typing import Type, Tuple

class RetryConfig:
    max_retries: int = 3
    base_delay: float = 1.0
    max_delay: float = 30.0
    exponential_base: float = 2.0
    jitter: bool = True
    
    # Codes HTTP qui méritent un retry
    retryable_status_codes: Tuple[int, ...] = (
        408,  # Request Timeout
        429,  # Too Many Requests
        500,  # Internal Server Error
        502,  # Bad Gateway
        503,  # Service Unavailable
        504,  # Gateway Timeout
    )

def with_retry(config: RetryConfig = RetryConfig()):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(config.max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                    
                except APIError as e:
                    last_exception = e
                    
                    if not e.is_retryable or attempt == config.max_retries:
                        raise
                    
                    # Calcul du délai avec backoff exponentiel
                    delay = min(
                        config.base_delay * (config.exponential_base ** attempt),
                        config.max_delay
                    )
                    
                    if config.jitter:
                        delay *= (0.5 + random.random() * 0.5)
                    
                    logger.warning(
                        f"Tentative {attempt + 1}/{config.max_retries} échouée. "
                        f"Nouvel essai dans {delay:.2f}s",
                        extra={"error": str(e)}
                    )
                    
                    time.sleep(delay)
            
            raise last_exception
            
        return wrapper
    return decorator

# Usage
@with_retry(RetryConfig(max_retries=5))
async def create_critical_order(order_data: dict) -> dict:
    return await api_client.create_order(order_data)
```

### Vérification Signature Webhook

```php
<?php
// WebhookController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AlgeriaTradeService;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function handle(Request $request, AlgeriaTradeService $atService)
    {
        // Récupérer la signature du header
        $signature = $request->header('X-Webhook-Signature');
        $timestamp = $request->header('X-Webhook-Timestamp');
        
        // Vérifier timestamp (replay attack protection)
        if (abs(time() - intval($timestamp)) > 300) { // 5 minutes max
            Log::warning('Webhook timestamp expiré', ['timestamp' => $timestamp]);
            return response()->json(['error' => 'Timestamp expired'], 401);
        }
        
        // Vérifier la signature
        $payload = $request->getContent();
        $expectedSignature = hash_hmac('sha256', $timestamp . '.' . $payload, config('services.algeriatrade.webhook_secret'));
        
        if (!hash_equals($expectedSignature, $signature)) {
            Log::warning('Signature webhook invalide');
            return response()->json(['error' => 'Invalid signature'], 401);
        }
        
        // Traiter l'événement
        $event = $request->input('event_type');
        $data = $request->input('data');
        
        switch ($event) {
            case 'payment.completed':
                $this->handlePaymentCompleted($data);
                break;
                
            case 'order.shipped':
                $this->handleOrderShipped($data);
                break;
                
            case 'quota.warning':
                $this->handleQuotaWarning($data);
                break;
                
            default:
                Log::info('Événement webhook inconnu', ['event' => $event]);
        }
        
        return response()->json(['status' => 'received']);
    }
}
```

### Gestion Pagination

```typescript
// PaginatedFetcher.ts - Pour les listes volumineuses
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    cursor?: string; // Cursor-based pagination alternative
  };
}

class PaginatedFetcher<T> {
  private allItems: T[] = [];
  private currentPage = 1;
  
  constructor(
    private fetchFn: (page: number) => Promise<PaginatedResponse<T>>,
    private options: {
      maxPages?: number;
      maxItems?: number;
      concurrency?: number;
    } = {}
  ) {}
  
  async fetchAll(): Promise<T[]> {
    let hasNextPage = true;
    
    while (hasNextPage) {
      // Limite de sécurité
      if (this.options.maxPages && this.currentPage > this.options.maxPages) {
        break;
      }
      
      const response = await this.fetchFn(this.currentPage);
      this.allItems.push(...response.data);
      
      hasNextPage = response.meta.hasNextPage;
      this.currentPage++;
      
      // Limite items
      if (this.options.maxItems && this.allItems.length >= this.options.maxItems) {
        this.allItems = this.allItems.slice(0, this.options.maxItems);
        break;
      }
    }
    
    return this.allItems;
  }
  
  // Streaming pour très gros volumes
  async *stream(): AsyncGenerator<T[]> {
    let hasNextPage = true;
    let page = 1;
    
    while (hasNextPage) {
      const response = await this.fetchFn(page);
      yield response.data;
      
      hasNextPage = response.meta.hasNextPage;
      page++;
    }
  }
}

// Usage
const fetcher = new PaginatedFetcher(
  (page) => api.searchProducts('textile', { page, perPage: 100 }),
  { maxPages: 50, maxItems: 5000 }
);

const allProducts = await fetcher.fetchAll();
```

### Stratégies de Cache

```javascript
// cache-strategies.js
const NodeCache = require('node-cache');

class MultiTierCache {
  constructor() {
    // Tier 1: Mémoire (rapide, court terme)
    this.memoryCache = new NodeCache({
      stdTTL: 300, // 5 minutes
      checkperiod: 60,
      useClones: false,
    });
    
    // Tier 2: Redis (partagé, moyen terme)
    this.redis = redisClient;
  }
  
  async get(key) {
    // Vérifier mémoire d'abord
    let value = this.memoryCache.get(key);
    if (value !== undefined) return value;
    
    // Puis Redis
    value = await this.redis.get(`at:${key}`);
    if (value) {
      const parsed = JSON.parse(value);
      this.memoryCache.set(key, parsed); // Backfill memory
      return parsed;
    }
    
    return null;
  }
  
  async set(key, value, ttl = 3600) {
    // Écrire aux deux niveaux
    this.memoryCache.set(key, value, Math.min(ttl, 300)); // Max 5min en mémoire
    await this.redis.setex(`at:${key}`, ttl, JSON.stringify(value));
  }
  
  // Invalidation intelligente
  async invalidate(pattern) {
    // Invalider en mémoire
    const keys = this.memoryCache.keys();
    keys.filter(k => k.includes(pattern)).forEach(k => this.memoryCache.del(k));
    
    // Invalider Redis
    const stream = this.redis.scanStream({ match: `at:*${pattern}*` });
    for await (const key of stream) {
      await this.redis.del(key);
    }
  }
}

// Stratégies spécifiques par type de données
const CACHE_STRATEGIES = {
  // Données rarement modifiées - long TTL
  categories: { ttl: 86400 },           // 24h
  static_pages: { ttl: 3600 },         // 1h
  
  // Données souvent consultées - TTL moyen
  products: { ttl: 1800 },             // 30min
  companies: { ttl: 1800 },            // 30min
  
  // Données temps réel - court TTL ou pas de cache
  orders: { ttl: 0 },                  // Pas de cache
  inventory: { ttl: 60 },              // 1min
  shipment_tracking: { ttl: 120 },     // 2min
};
```

---

## Tests & Mise en Production

### Checklist Tests Sandbox

Avant de demander l'accès production, complétez:

#### Fonctionnalités Core
- [ ] Authentification et récupération token
- [ ] Recherche produits (tous filtres)
- [ ] Détail produit complet
- [ ] Création commande valide
- [ ] Annulation commande
- [ ] Historique commandes

#### Paiements (Simulation)
- [ ] Initiation paiement CCP
- [ ] Initiation paiement BaridiMob
- [ ] Callback paiement réussi
- [ ] Callback paiement échoué
- [ ] Remboursement simulation

#### Edge Cases
- [ ] Produit inexistant (404)
- [ ] Stock insuffisant (422)
- [ ] Commande > quota autorisé (403)
- [ ] Rate limit atteint (429)
- [ ] Token expiré (401)
- [ ] Données invalides (400)

#### Performance
- [ ] Temps réponse API < 200ms (p95)
- [ ] Pagination fonctionne (>1000 résultats)
- [ ] Recherche avec caractères arabes
- [ ] Recherche avec caractères français accentués

### Migration vers Production

```bash
# 1. Changer l'environment
export ALGERIATRADE_ENV=production

# 2. Mettre à jour les clés API
export ALGERIATRADE_API_KEY=at_live_votre_cle_production
export ALGERIATRADE_API_SECRET=votre_secret_production

# 3. Tester avec vraies données (attention!)
curl -H "X-API-Key: $ALGERIATRADE_API_KEY" \
  https://api.algeriatrade.dz/v1/products/categories

# 4. Monitor les premiers appels
# Consulter Grafana: https://grafana.algeriatrade.dz
```

### Optimisation Performance

```yaml
# Recommandations avant go-live
pre_launch_checks:
  database:
    - Indexes créés sur colonnes fréquentées
    - Connection pool configuré (min 5, max 20 connexions)
    - Query slow log activé
  
  application:
    - Compression gzip/brotli activée
    - Headers cache appropriés
    - CDN configuré pour assets statiques
  
  monitoring:
    - Alertes configurées (PagerDuty/Slack)
    - Dashboards Grafana prêts
    - Logs centralisés (ELK) opérationnels
  
  security:
    - Audit de sécurité effectué
    - WAF actif
    - Rate limiting testé
```

### Support Lancement Jour J

| Heure | Action | Responsable |
|-------|--------|-------------|
| H-24 | Vérification infrastructure | DevOps |
| H-2 | Derniers tests smoke | QA |
| H-0 | Basculer DNS vers production | DevOps |
| H+1h | Monitoring intensif | Équipe on-call |
| H+4h | Premier rapport metrics | Tech Lead |
| H+24h | Post-mortem préliminaire | Tout le monde |

---

*Document version 1.0 - Mis à jour: $(date '+%Y-%m-%d')*
