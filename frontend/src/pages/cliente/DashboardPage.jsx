import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { registrosService, alertasService } from '@/lib/api'
import { formatDate, isVencimientoProximo } from '@/lib/utils'
import { FileText, AlertCircle, Package, Plus, Bell, LogOut, ChevronRight } from 'lucide-react'

export default function DashboardPage() {
  const { user, logout, isAdmin } = useAuth()
  const [stats, setStats] = useState({ total: 0, vencen_pronto: 0, pendientes: 0, despachados: 0 })
  const [recentRegistros, setRecentRegistros] = useState([])
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, registrosRes, alertasRes] = await Promise.all([
        registrosService.stats(),
        registrosService.list({ limit: 5 }),
        alertasService.list({ unread_only: true })
      ])
      
      setStats(statsRes.data)
      setRecentRegistros(registrosRes.data)
      setAlertas(alertasRes.data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Legal Manager</h1>
            <p className="text-sm text-slate-500">{user?.empresa || user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/alertas" className="relative p-2 text-slate-600 hover:text-indigo-600 transition-colors">
              <Bell size={24} />
              {alertas.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {alertas.length}
                </span>
              )}
            </Link>
            <button onClick={handleLogout} className="p-2 text-slate-600 hover:text-red-600 transition-colors">
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {stats.vencen_pronto > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-amber-600" size={24} />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">
                Tenés {stats.vencen_pronto} vencimiento{stats.vencen_pronto > 1 ? 's' : ''} en los próximos 3 días
              </p>
            </div>
            <Link to="/alertas" className="text-amber-600 hover:text-amber-700 font-medium text-sm flex items-center gap-1">
              Ver alertas <ChevronRight size={16} />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Registros</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="bg-red-50 text-red-600 p-3 rounded-xl">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Vencen Pronto</p>
                <p className="text-2xl font-bold">{stats.vencen_pronto}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pendientes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Despachados</p>
                <p className="text-2xl font-bold">{stats.despachados}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Registros Recientes</h2>
            <Link to="/registros" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              Ver todos
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-semibold">Actor</th>
                  <th className="px-6 py-3 font-semibold">Expediente</th>
                  <th className="px-6 py-3 font-semibold">Tipo</th>
                  <th className="px-6 py-3 font-semibold">Vencimiento</th>
                  <th className="px-6 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRegistros.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{r.actor}</td>
                    <td className="px-6 py-4 text-slate-600">{r.expediente}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                        {r.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isVencimientoProximo(r.vencimiento) ? (
                        <span className="text-red-600 font-semibold">{formatDate(r.vencimiento)}</span>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Link
            to="/registros/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
          >
            <Plus size={20} />
            Nuevo Registro
          </Link>
          {isAdmin() && (
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Panel Admin
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}