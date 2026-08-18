// Crypto Payment Library - Main Entry Point
// Exports all crypto payment functionality

// Configuration
export {
  cryptoConfig,
  SupportedCrypto,
  USDTNetwork,
  USDCNetwork,
  networkFeeEstimates,
  cryptoMetadata,
  getWalletAddress,
  getRequiredConfirmations,
  getAvailableNetworks,
} from './config'

// Exchange Rates
export {
  getExchangeRate,
  getAllExchangeRates,
  convertDZDtoCrypto,
  convertCryptoToDZD,
  formatCryptoAmount,
  validateExchangeRate,
  clearRateCache,
  getRateCacheStats,
  type ExchangeRate,
} from './exchange-rates'

// Core Client
export {
  createCryptoPaymentOrder,
  checkTransactionStatus,
  validateTransaction,
  calculateCryptoAmount,
  estimateNetworkFee,
  generateQRCodeURI,
  startTransactionMonitoring,
  submitManualConfirmation,
  expireOverduePayments,
  getUserCryptoPaymentHistory,
  getCryptoInfo,
  getSupportedCryptos,
  type CryptoPaymentOrderRequest,
  type CryptoPaymentOrderResponse,
  type TransactionStatus,
  type ValidationResult,
} from './client'

// Blockchain Monitor
export {
  startMonitoring,
  stopMonitoring,
  getActiveMonitorIds,
  cleanupAllMonitors,
  getTransactionDetails,
  type BlockchainTransaction,
  type MonitorConfig,
} from './blockchain-monitor'
