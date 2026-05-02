import { useState, useEffect } from 'react'
import { adminService, registrosService } from '@/lib/api'
import { formatDate, isVencimientoProximo } from '@/lib/utils'
import { FileText, ChevronLeft, ChevronRight, Search, AlertCircle, Loader2, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import ConfirmModal from '@/components/ConfirmModal'

export default function AdminRegistrosPage() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [deleteModal, setDeleteModal] = useState({ open: false, registro: null })
  const limit = 20

  useEffect(() => {
    loadRegistros()
  }, [page, search])

  const loadRegistros = async () => {
    try {
      setLoading(true)
      const response = await adminService.listRegistros({
        skip: page * limit,
        limit,
        search: search || undefined
      })
      setRegistros(response.data)
    } catch (error) {
      console.error('Error loading registros:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const { registro } = deleteModal
    if (!registro) return

    try {
      await registrosService.delete(registro.id)
      toast.success('Registro desactivado')
      setDeleteModal({ open: false, registro: null })
      loadRegistros()
    } catch (error) {
      toast.error('Error desactivando registro')
    }
  }

  const openDeleteModal = (e, registro) => {
    e.stopPropagation()
    setDeleteModal({ open: true, registro })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/admin/dashboard" className="p-2 text-slate-600 hover:text-indigo-600">
            <ChevronLeft size={24} />
          </a>
          <FileText size={28} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-800">Todos los Registros</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por actor, expediente, número de siniestro..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Actor</th>
                  <th className="px-6 py-4 font-semibold">Expediente</th>
                  <th className="px-6 py-4 font-semibold">Tipo</th>
                  <th className="px-6 py-4 font-semibold">Juzgado</th>
                  <th className="px-6 py-4 font-semibold">Vencimiento</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <Loader2 className="animate-spin mx-auto text-indigo-600" size={32} />
                    </td>
                  </tr>
                ) : registros.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No hay registros
                    </td>
                  </tr>
                ) : (
                  registros.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">{r.actor}</td>
                      <td className="px-6 py-4 text-slate-600">{r.expediente}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                          {r.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{r.juzgado || '-'}</td>
                      <td className="px-6 py-4">
                        {isVencimientoProximo(r.vencimiento) ? (
                          <div className="flex items-center gap-2 text-red-600 font-semibold">
                            <AlertCircle size={14} />
                            {formatDate(r.vencimiento)}
                          </div>
                        ) : (
                          <span className="text-slate-600">{formatDate(r.vencimiento)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          r.estado === 'PENDIENTE' ? 'bg-amber-50 text-amber-700' :
                          r.estado.includes('DESARMADERO') ? 'bg-orange-50 text-orange-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => window.location.href = `/registros/${r.id}`}
                            className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => openDeleteModal(e, r)}
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
              disabled={registros.length < limit}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </main>

      <ConfirmModal
        isOpen={deleteModal.open}
        title="Desactivar registro"
        message={`¿Estás seguro de desactivar "${deleteModal.registro?.actor}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, registro: null })}
      />
    </div>
  )
}