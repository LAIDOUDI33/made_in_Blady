import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md border-blue-200 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-blue-600">404</span>
          </div>
          <CardTitle className="text-2xl text-blue-800 flex items-center justify-center gap-2">
            <FileQuestion className="w-6 h-6" />
            Page non trouvée
          </CardTitle>
          <CardDescription className="text-blue-600">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Vérifiez l'URL ou utilisez les liens ci-dessous pour trouver ce que vous cherchez.
          </p>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Pages populaires:</p>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/products" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                  <Search className="w-3 h-3" /> Catalogue produits
                </Link>
              </li>
              <li>
                <Link href="/suppliers" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                  <Search className="w-3 h-3" /> Fournisseurs
                </Link>
              </li>
              <li>
                <Link href="/rfqs/new" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                  Demande de devis
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-blue-600 hover:text-blue-800 hover:underline">
                  Catégories
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="flex gap-3 justify-center pt-4">
            <Button asChild variant="default">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Accueil
              </Link>
            </Button>
            
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              className="border-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
