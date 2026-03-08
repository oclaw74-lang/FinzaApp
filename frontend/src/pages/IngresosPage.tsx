import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TransaccionModal } from '@/components/transacciones/TransaccionModal'
import { TransaccionesList } from '@/components/transacciones/TransaccionesList'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { useIngresos, useCreateIngreso, useDeleteIngreso } from '@/hooks/useIngresos'
import { useCategorias } from '@/hooks/useCategorias'
import type { IngresoFormData, EgresoFormData } from '@/components/transacciones/TransaccionForm'
import type { IngresoResponse } from '@/types/transacciones'

export function IngresosPage(): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data, isLoading } = useIngresos({ page: 1, page_size: 50 })
  const { data: categorias = [] } = useCategorias('ingreso')
  const createIngreso = useCreateIngreso()
  const deleteIngreso = useDeleteIngreso()

  const totalMes = data?.items.reduce((sum, i) => sum + parseFloat(i.monto), 0) ?? 0

  const handleCreate = async (formData: IngresoFormData | EgresoFormData): Promise<void> => {
    await createIngreso.mutateAsync(formData)
    setIsModalOpen(false)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Eliminar este ingreso?')) {
      await deleteIngreso.mutateAsync(id)
    }
  }

  const handleEdit = (_t: IngresoResponse): void => {
    // Edit will be implemented in a future iteration
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingresos</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
            Total:{' '}
            <MoneyDisplay amount={totalMes} type="ingreso" size="sm" />
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="success">
          <Plus size={18} className="mr-2" />
          Nuevo ingreso
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <TransaccionesList
            transacciones={data?.items ?? []}
            tipo="ingreso"
            categorias={categorias}
            isLoading={isLoading}
            onEdit={(t) => handleEdit(t as IngresoResponse)}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <TransaccionModal
        tipo="ingreso"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createIngreso.isPending}
      />
    </div>
  )
}
