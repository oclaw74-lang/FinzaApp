import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TransaccionModal } from '@/components/transacciones/TransaccionModal'
import { TransaccionesList } from '@/components/transacciones/TransaccionesList'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { useEgresos, useCreateEgreso, useDeleteEgreso } from '@/hooks/useEgresos'
import { useCategorias } from '@/hooks/useCategorias'
import type { IngresoFormData, EgresoFormData } from '@/components/transacciones/TransaccionForm'
import type { EgresoResponse } from '@/types/transacciones'

export function EgresosPage(): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data, isLoading } = useEgresos({ page: 1, page_size: 50 })
  const { data: categorias = [] } = useCategorias('egreso')
  const createEgreso = useCreateEgreso()
  const deleteEgreso = useDeleteEgreso()

  const totalMes = data?.items.reduce((sum, e) => sum + parseFloat(e.monto), 0) ?? 0

  const handleCreate = async (formData: IngresoFormData | EgresoFormData): Promise<void> => {
    await createEgreso.mutateAsync(formData)
    setIsModalOpen(false)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Eliminar este egreso?')) {
      await deleteEgreso.mutateAsync(id)
    }
  }

  const handleEdit = (_t: EgresoResponse): void => {
    // Edit will be implemented in a future iteration
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Egresos</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
            Total:{' '}
            <MoneyDisplay amount={totalMes} type="egreso" size="sm" />
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="default">
          <Plus size={18} className="mr-2" />
          Nuevo egreso
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de egresos</CardTitle>
        </CardHeader>
        <CardContent>
          <TransaccionesList
            transacciones={data?.items ?? []}
            tipo="egreso"
            categorias={categorias}
            isLoading={isLoading}
            onEdit={(t) => handleEdit(t as EgresoResponse)}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <TransaccionModal
        tipo="egreso"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createEgreso.isPending}
      />
    </div>
  )
}
