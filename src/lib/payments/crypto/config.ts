// Crypto Payment Configuration
// AlgeriaTrade.dz - International Buyer Cryptocurrency Support

export const cryptoConfig = {
  // Supported cryptocurrencies
  supportedCryptos: ['USDT', 'BTC', 'ETH', 'USDC'] as const,
  
  // Network configurations
  networks: {
    USDT: {
      networks: ['TRC20', 'ERC20', 'BEP20'] as const,
      confirmationsRequired: { TRC20: 12, ERC20: 20, BEP20: 10 } as Record<string, number>,
      minConfirmations: 10,
      tokenAddress: {
        ERC20: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        BEP20: '0x55d398326f99059fF775485246999027B3197955',
        TRC20: 'TR7NHqjeKQxGTCi8qZYZYpL8hTgEjZNLuQ'
      }
    },
    BTC: {
      network: 'mainnet' as const,
      confirmationsRequired: 3,
      minConfirmations: 2,
    },
    ETH: {
      network: 'mainnet' as const,
      confirmationsRequired: 12,
      minConfirmations: 10,
    },
    USDC: {
      networks: ['ERC20', 'BEP20'] as const,
      confirmationsRequired: { ERC20: 20, BEP20: 10 } as Record<string, number>,
      tokenAddress: {
        ERC20: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        BEP20: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      }
    }
  },
  
  // Exchange rate provider configuration
  exchangeRateProvider: 'coingecko' as const, // coinmarketcap, coingecko, binance
  cacheTTL: 300, // 5 minutes in seconds
  
  // Wallet configuration (for receiving payments)
  wallets: {
    USDT_TRC20: process.env.USDT_TRC20_WALLET_ADDRESS || 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    USDT_ERC20: process.env.USDT_ERC20_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
    USDT_BEP20: process.env.USDT_BEP20_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
    BTC: process.env.BTC_WALLET_ADDRESS || 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ETH: process.env.ETH_WALLET_ADDRESS || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    USDC_ERC20: process.env.USDC_ERC20_WALLET_ADDRESS || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    USDC_BEP20: process.env.USDC_BEP20_WALLET_ADDRESS || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  },
  
  // Security settings
  security: {
    maxPaymentWindowHours: 2, // Payment must be confirmed within 2 hours
    priceValidityMinutes: 15, // Quote valid for 15 minutes
    allowedSlippagePercent: 1, // Allow 1% slippage
  },
  
  // Notification settings
  webhooks: {
    endpoint: '/api/payments/crypto/webhook',
    secret: process.env.CRYPTO_WEBHOOK_SECRET || 'default_webhook_secret_change_in_production',
  },
  
  // Blockchain explorer APIs
  explorers: {
    tronscan: {
      baseUrl: 'https://apilist.tronscan.org/api',
      apiKey: process.env.TRONSCAN_API_KEY,
    },
    etherscan: {
      baseUrl: 'https://api.etherscan.io/api',
      apiKey: process.env.ETHERSCAN_API_KEY,
    },
    bscscan: {
      baseUrl: 'https://api.bscscan.com/api',
      apiKey: process.env.BSCSCAN_API_KEY,
    },
    blockchainInfo: {
      baseUrl: 'https://blockchain.info',
    },
  }
}

// Type exports
export type SupportedCrypto = typeof cryptoConfig.supportedCryptos[number]
export type USDTNetwork = typeof cryptoConfig.networks.USDT.networks[number]
export type USDCNetwork = typeof cryptoConfig.networks.USDC.networks[number]

// Network fee estimates (updated periodically)
export const networkFeeEstimates: Record<string, Record<string, {
  fee: string
  estimatedTime: string
  recommended: boolean
}>> = {
  USDT: {
    TRC20: { fee: '1-5 USDT', estimatedTime: '1-3 min', recommended: true },
    ERC20: { fee: '5-15 USDT', estimatedTime: '2-5 min', recommended: false },
    BEP20: { fee: '1-8 USDT', estimatedTime: '1-3 min', recommended: false },
  },
  USDC: {
    ERC20: { fee: '5-15 USDC', estimatedTime: '2-5 min', recommended: false },
    BEP20: { fee: '1-8 USDC', estimatedTime: '1-3 min', recommended: true },
  },
  BTC: {
    mainnet: { fee: '0.0001-0.0005 BTC', estimatedTime: '10-60 min', recommended: true },
  },
  ETH: {
    mainnet: { fee: '0.003-0.01 ETH', estimatedTime: '2-10 min', recommended: true },
  },
}

// Crypto currency metadata with multilingual support
export const cryptoMetadata: Record<SupportedCrypto, {
  name: string
  symbol: string
  color: string
  icon: string
  decimals: number
  description: { en: string; fr: string; ar: string }
  explorerUrl: string
  isStablecoin: boolean
}> = {
  USDT: {
    name: 'Tether',
    symbol: 'USDT',
    color: '#26A17B',
    icon: '💵',
    decimals: 6,
    description: {
      en: 'A stablecoin pegged to the US dollar. 1 USDT ≈ $1 USD.',
      fr: 'Une stablecoin indexée sur le dollar américain. 1 USDT ≈ 1 $ USD.',
      ar: 'عملة مستقرة مرتبطة بالدولار الأمريكي. 1 USDT ≈ 1 دولار أمريكي.',
    },
    explorerUrl: 'https://tronscan.io/#/transaction/',
    isStablecoin: true,
  },
  BTC: {
    name: 'Bitcoin',
    symbol: 'BTC',
    color: '#F7931A',
    icon: '₿',
    decimals: 8,
    description: {
      en: 'The first and most well-known cryptocurrency. Decentralized digital money.',
      fr: 'La première et plus connue des cryptomonnaies. Monnaie numérique décentralisée.',
      ar: 'أول وأشهر عملة مشفرة. نقود رقمية لامركزية.',
    },
    explorerUrl: 'https://blockchain.info/tx/',
    isStablecoin: false,
  },
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    color: '#627EEA',
    icon: 'Ξ',
    decimals: 18,
    description: {
      en: 'A decentralized platform for smart contracts and dApps.',
      fr: 'Une plateforme décentralisée pour les contrats intelligents et dApps.',
      ar: 'منصة لامركزية للعقود الذكية وتطبيقات الويب اللامركزية.',
    },
    explorerUrl: 'https://etherscan.io/tx/',
    isStablecoin: false,
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    color: '#2775CA',
    icon: '$',
    decimals: 6,
    description: {
      en: 'A fully collateralized US dollar stablecoin by Circle.',
      fr: 'Une stablecoin dollar américain entièrement collatéralisée par Circle.',
      ar: 'عملة مستقرة بالدولار الأمريكي بالكامل من Circle.',
    },
    explorerUrl: 'https://etherscan.io/tx/',
    isStablecoin: true,
  },
}

// Get wallet address for a specific crypto/network combination
export function getWalletAddress(crypto: SupportedCrypto, network?: string): string {
  switch (crypto) {
    case 'USDT':
      if (network === 'TRC20') return cryptoConfig.wallets.USDT_TRC20
      if (network === 'BEP20') return cryptoConfig.wallets.USDT_BEP20
      return cryptoConfig.wallets.USDT_ERC20 // Default to ERC20
    case 'USDC':
      if (network === 'BEP20') return cryptoConfig.wallets.USDC_BEP20
      return cryptoConfig.wallets.USDC_ERC20 // Default to ERC20
    case 'BTC':
      return cryptoConfig.wallets.BTC
    case 'ETH':
      return cryptoConfig.wallets.ETH
    default:
      throw new Error(`Unsupported cryptocurrency: ${crypto}`)
  }
}

// Get required confirmations for a crypto/network combination
export function getRequiredConfirmations(crypto: SupportedCrypto, network?: string): number {
  switch (crypto) {
    case 'USDT':
      if (network === 'TRC20') return cryptoConfig.networks.USDT.confirmationsRequired.TRC20
      if (network === 'BEP20') return cryptoConfig.networks.USDT.confirmationsRequired.BEP20
      return cryptoConfig.networks.USDT.confirmationsRequired.ERC20
    case 'USDC':
      if (network === 'BEP20') return cryptoConfig.networks.USDC.confirmationsRequired.BEP20
      return cryptoConfig.networks.USDC.confirmationsRequired.ERC20
    case 'BTC':
      return cryptoConfig.networks.BTC.confirmationsRequired
    case 'ETH':
      return cryptoConfig.networks.ETH.confirmationsRequired
    default:
      return 3
  }
}

// Get available networks for a cryptocurrency
export function getAvailableNetworks(crypto: SupportedCrypto): string[] {
  switch (crypto) {
    case 'USDT':
      return [...cryptoConfig.networks.USDT.networks]
    case 'USDC':
      return [...cryptoConfig.networks.USDC.networks]
    case 'BTC':
    case 'ETH':
      return [cryptoConfig.networks[crypto].network]
    default:
      return []
  }
}
