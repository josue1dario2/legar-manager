import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { adminService } from '@/lib/api'
import { FileText, Users, AlertCircle, Package, LogOut, ChevronRight } from 'lucide-react'

export default function AdminDashboardPage() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState({ total: 0, vencen_pronto: 0, pendientes: 0, despachados: 0 })
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminService.stats(),
        adminService.listUsers({ limit: 1 })
      ])
      setStats(statsRes.data)
      setUserCount(usersRes.data.length)
    } catch (error) {
      console.error('Error loading admin dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Panel de Administración</h1>
            <p className="text-sm text-slate-500">Bienvenido, {user?.full_name || user?.email}</p>
          </div>
          <button onClick={logout} className="p-2 text-slate-600 hover:text-red-600 transition-colors">
            <LogOut size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
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
              <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Clientes</p>
                <p className="text-2xl font-bold">{userCount}</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin/clientes"
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 text-purple-600 p-4 rounded-xl">
                <Users size={28} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Gestionar Clientes</h3>
                <p className="text-sm text-slate-500">Ver y administrar cuentas de clientes</p>
              </div>
            </div>
            <ChevronRight className="text-slate-400" size={24} />
          </Link>

          <Link
            to="/admin/registros"
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 text-indigo-600 p-4 rounded-xl">
                <FileText size={28} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Ver Todos los Registros</h3>
                <p className="text-sm text-slate-500">Explorar registros de todos los clientes</p>
              </div>
            </div>
            <ChevronRight className="text-slate-400" size={24} />
          </Link>
        </div>

        <div className="mt-6">
          <Link
            to="/dashboard"
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
          >
            ← Volver a mi dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}