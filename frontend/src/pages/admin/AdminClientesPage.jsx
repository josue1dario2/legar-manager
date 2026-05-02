import { useState, useEffect } from 'react'
import { adminService } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Users, ChevronLeft, ChevronRight, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const limit = 20

  useEffect(() => {
    loadClientes()
  }, [page])

  const loadClientes = async () => {
    try {
      setLoading(true)
      const response = await adminService.listUsers({ skip: page * limit, limit })
      setClientes(response.data)
    } catch (error) {
      toast.error('Error cargando clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente? Se eliminarán todos sus registros.')) return
    
    try {
      await adminService.deleteUser(id)
      toast.success('Cliente eliminado')
      loadClientes()
    } catch (error) {
      toast.error('Error eliminando cliente')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/admin/dashboard" className="p-2 text-slate-600 hover:text-indigo-600">
            <ChevronLeft size={24} />
          </a>
          <Users size={28} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Nombre</th>
                  <th className="px-6 py-4 font-semibold">Empresa</th>
                  <th className="px-6 py-4 font-semibold">Registros</th>
                  <th className="px-6 py-4 font-semibold">Fecha Registro</th>
                  <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <Loader2 className="animate-spin mx-auto text-indigo-600" size={32} />
                    </td>
                  </tr>
                ) : clientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No hay clientes registrados
                    </td>
                  </tr>
                ) : (
                  clientes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">{c.email}</td>
                      <td className="px-6 py-4 text-slate-600">{c.full_name || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{c.empresa || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-sm font-semibold">
                          {c.total_registros || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(c.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="text-sm text-slate-500">Página {page + 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={clientes.length < limit}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}