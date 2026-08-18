'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Check, 
  Zap, 
  Clock, 
  Info,
  TrendingUp,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { networkFeeEstimates, getRequiredConfirmations } from '@/lib/payments/crypto/config'
import type { SupportedCrypto, USDTNetwork, USDCNetwork } from '@/lib/payments/crypto/config'

interface NetworkOption {
  id: string
  name: string
  fullName: string
  fee: string
  estimatedTime: string
  confirmations: number
  recommended: boolean
  description: string
  pros: string[]
  cons: string[]
}

interface CryptoWalletSelectorProps {
  cryptocurrency: SupportedCrypto
  selectedNetwork?: string
  onNetworkSelect: (network: string) => void
  disabled?: boolean
}

const networkData: Record<string, Record<string, NetworkOption>> = {
  USDT: {
    TRC20: {
      id: 'TRC20',
      name: 'TRC-20',
      fullName: 'Tron (TRC-20)',
      fee: '~1-5 USDT',
      estimatedTime: '1-3 minutes',
      confirmations: 12,
      recommended: true,
      description: 'Fastest and cheapest option for USDT transfers on Tron network',
      pros: ['Lowest fees', 'Fastest confirmation', 'Widely supported'],
      cons: ['Requires TRON-compatible wallet'],
    },
    ERC20: {
      id: 'ERC20',
      name: 'ERC-20',
      fullName: 'Ethereum (ERC-20)',
      fee: '~5-15 USDT',
      estimatedTime: '2-5 minutes',
      confirmations: 20,
      recommended: false,
      description: 'Standard Ethereum token transfer',
      pros: ['Universal support', 'High security', 'Most exchanges'],
      cons: ['Higher fees', 'Slower than TRON'],
    },
    BEP20: {
      id: 'BEP20',
      name: 'BEP-20',
      fullName: 'BSC (BEP-20)',
      fee: '~1-8 USDT',
      estimatedTime: '1-3 minutes',
      confirmations: 10,
      recommended: false,
      description: 'Binance Smart Chain token transfer',
      pros: ['Low fees', 'Fast confirmation', 'Binance ecosystem'],
      cons: ['Less universal than ERC-20'],
    },
  },
  USDC: {
    ERC20: {
      id: 'ERC20',
      name: 'ERC-20',
      fullName: 'Ethereum (ERC-20)',
      fee: '~5-15 USDC',
      estimatedTime: '2-5 minutes',
      confirmations: 20,
      recommended: false,
      description: 'Standard Ethereum token transfer for USDC',
      pros: ['Universal support', 'High security', 'Most exchanges'],
      cons: ['Higher fees', 'Slower'],
    },
    BEP20: {
      id: 'BEP20',
      name: 'BEP-20',
      fullName: 'BSC (BEP-20)',
      fee: '~1-8 USDC',
      estimatedTime: '1-3 minutes',
      confirmations: 10,
      recommended: true,
      description: 'Binance Smart Chain - Recommended for USDC',
      pros: ['Lower fees', 'Faster confirmation', 'Good exchange support'],
      cons: ['Less universal than ERC-20'],
    },
  },
  BTC: {
    mainnet: {
      id: 'mainnet',
      name: 'Bitcoin',
      fullName: 'Bitcoin Mainnet',
      fee: '~$2-10 USD',
      estimatedTime: '10-60 minutes',
      confirmations: 3,
      recommended: true,
      description: 'The original and most secure blockchain',
      pros: ['Most secure', 'Universally accepted', 'Store of value'],
      cons: ['Slow confirmation', 'Higher fees for small amounts'],
    },
  },
  ETH: {
    mainnet: {
      id: 'mainnet',
      name: 'Ethereum',
      fullName: 'Ethereum Mainnet',
      fee: '~$3-15 USD',
      estimatedTime: '2-10 minutes',
      confirmations: 12,
      recommended: true,
      description: 'Leading smart contract platform',
      pros: ['Smart contract capable', 'Wide DeFi ecosystem', 'Fast'],
      cons: ['Variable gas fees', 'Can be expensive during congestion'],
    },
  },
}

export function CryptoWalletSelector({
  cryptocurrency,
  selectedNetwork,
  onNetworkSelect,
  disabled = false,
}: CryptoWalletSelectorProps) {
  const [hoveredNetwork, setHoveredNetwork] = useState<string | null>(null)

  const networks = networkData[cryptocurrency]
  
  if (!networks) {
    return null
  }

  const networkOptions = Object.values(networks)

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Select Network</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p>Different networks have different fees and confirmation times. 
                 We recommend the option marked as &quot;Recommended&quot;.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Network Options */}
        <div className="grid gap-3">
          {networkOptions.map((network) => (
            <Card
              key={network.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                selectedNetwork === network.id && "ring-2 ring-primary border-primary",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !disabled && onNetworkSelect(network.id)}
              onMouseEnter={() => setHoveredNetwork(network.id)}
              onMouseLeave={() => setHoveredNetwork(null)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  {/* Left: Name & Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{network.fullName}</span>
                      {network.recommended && (
                        <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                          <Zap className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {network.description}
                    </p>

                    {/* Pros/Cons when hovered or selected */}
                    {(hoveredNetwork === network.id || selectedNetwork === network.id) && (
                      <div className="mt-3 space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {network.pros.map((pro, i) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {pro}
                            </Badge>
                          ))}
                        </div>
                        {network.cons.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {network.cons.map((con, i) => (
                              <Badge key={i} variant="outline" className="text-xs text-orange-600">
                                {con}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Stats & Selection */}
                  <div className="ml-4 text-right">
                    {/* Check mark if selected */}
                    {selectedNetwork === network.id && (
                      <Check className="h-5 w-5 text-primary mx-auto mb-2" />
                    )}

                    {/* Fee & Time */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-muted-foreground">Fee:</span>
                        <span className="font-medium">{network.fee}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{network.estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Shield className="h-3 w-3 text-muted-foreground" />
                        <span>{network.confirmations} confirms</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Warning about crypto risks */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <strong>⚠️ Important:</strong> Cryptocurrency transactions are irreversible. 
            Make sure you select the correct network that matches your wallet. 
            Sending to the wrong network may result in loss of funds.
          </p>
        </div>
      </div>
    </TooltipProvider>
  )
}

// Helper component for comparing networks side by side
export function NetworkComparison({ crypto }: { crypto: SupportedCrypto }) {
  const networks = networkData[crypto]
  
  if (!networks) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Network Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Network</th>
                <th className="text-left py-2 px-4">Fee</th>
                <th className="text-left py-2 px-4">Time</th>
                <th className="text-left py-2 pl-4">Confirms</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(networks).map((network) => (
                <tr key={network.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">
                    {network.fullName}
                    {network.recommended && (
                      <Badge variant="default" className="ml-2 text-xs bg-green-600">
                        Best
                      </Badge>
                    )}
                  </td>
                  <td className="py-2 px-4">{network.fee}</td>
                  <td className="py-2 px-4">{network.estimatedTime}</td>
                  <td className="py-2 pl-4">{network.confirmations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default CryptoWalletSelector
