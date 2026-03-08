import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'

export function NotFoundPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-finza-blue mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Pagina no encontrada</h2>
        <p className="text-gray-500 mb-8">La pagina que buscas no existe o fue movida.</p>
        <Link to="/" className={buttonVariants({ variant: 'default' })}>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
