import { useState, useEffect } from 'react'
import { alertasService } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Bell, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

export default function AlertasPage() {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlertas()
  }, [])

  const loadAlertas = async () => {
    try {
      const response = await alertasService.list({})
      setAlertas(response.data)
    } catch (error) {
      toast.error('Error cargando alertas')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await alertasService.markRead(id)
      setAlertas(alertas.map(a => a.id === id ? { ...a, leida: true } : a))
      toast.success('Alerta marcada como leída')
    } catch (error) {
      toast.error('Error marcando alerta')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await alertasService.markAllRead()
      setAlertas(alertas.map(a => ({ ...a, leida: true })))
      toast.success('Todas las alertas marcadas como leídas')
    } catch (error) {
      toast.error('Error marcando alertas')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    )
  }

  const unreadCount = alertas.filter(a => !a.leida).length

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="text-indigo-600" size={28} />
            <h1 className="text-2xl font-bold text-slate-800">Alertas</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm px-2 py-0.5 rounded-full">
                {unreadCount} sin leer
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Marcar todas como leídas
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {alertas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Bell className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No hay alertas</h3>
            <p className="text-slate-500">Tu bandeja de alertas está vacía. Te notificaremos cuando haya vencimientos próximos.</p>
            <Link to="/dashboard" className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 font-medium">
              Volver al dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {alertas.map((alerta) => (
              <div
                key={alerta.id}
                className={`bg-white rounded-xl shadow-sm border p-6 flex items-start gap-4 ${
                  alerta.leida ? 'border-slate-200 opacity-75' : 'border-amber-200 bg-amber-50/30'
                }`}
              >
                <div className={`p-3 rounded-xl ${alerta.leida ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-600'}`}>
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800">{alerta.mensaje}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {formatDate(alerta.created_at)}
                      </p>
                    </div>
                    {!alerta.leida && (
                      <button
                        onClick={() => handleMarkRead(alerta.id)}
                        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1 shrink-0"
                      >
                        <CheckCircle size={16} />
                        Marcar leída
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}