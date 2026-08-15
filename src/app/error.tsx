'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="w-full max-w-md border-red-200 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-800">
            Une erreur est survenue
          </CardTitle>
          <CardDescription className="text-red-600">
            Nous sommes désolés, mais quelque chose s'est mal passé.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Notre équipe a été notifiée de ce problème. 
            Vous pouvez réessayer ou retourner à la page d'accueil.
          </p>
          
          {error.message && (
            <div className="p-3 bg-red-50 rounded-md border border-red-200">
              <p className="text-xs text-red-700 font-mono break-all">
                Error: {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-500 mt-1">
                  ID: {error.digest}
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-3 justify-center pt-2">
            <Button 
              onClick={reset}
              variant="default"
              className="bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-gray-300"
            >
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
