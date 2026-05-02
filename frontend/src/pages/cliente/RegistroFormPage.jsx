import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { registrosService } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'

const TIPOS = ['Conciliación Obligatoria', 'Demanda', 'Defensa del Consumidor', 'Oficio']
const PRIORIDADES = ['Alta', 'Media', 'Baja']
const ESTADOS = ['PENDIENTE', 'EN PROCESO', 'DERIVADO-DESARMADERO', 'DESPACHADO', 'ARCHIVADO']

export default function RegistroFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditing)

  const [formData, setFormData] = useState({
    expediente: '',
    nSiniestro: '',
    actor: '',
    tipo: 'Conciliación Obligatoria',
    fechaDerivacion: '',
    fechaRecepcion: '',
    vencimiento: '',
    juzgado: '',
    prioridad: 'Media',
    oblea: '',
    fechaDespacho: '',
    estado: 'PENDIENTE'
  })

  useEffect(() => {
    if (isEditing) {
      loadRegistro()
    }
  }, [id])

  const loadRegistro = async () => {
    try {
      const response = await registrosService.get(id)
      const data = response.data
      
      const formatDateForInput = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toISOString().split('T')[0]
      }

      setFormData({
        expediente: data.expediente || '',
        nSiniestro: data.nsiniestro || '',
        actor: data.actor || '',
        tipo: data.tipo || 'Conciliación Obligatoria',
        fechaDerivacion: formatDateForInput(data.fechaderivacion),
        fechaRecepcion: formatDateForInput(data.fecharecepcion),
        vencimiento: formatDateForInput(data.vencimiento),
        juzgado: data.juzgado || '',
        prioridad: data.prioridad || 'Media',
        oblea: data.oblea || '',
        fechaDespacho: formatDateForInput(data.fechadespacho),
        estado: data.estado || 'PENDIENTE'
      })
    } catch (error) {
      toast.error('Error cargando registro')
      navigate('/registros')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Transform camelCase to snake_case for backend
      const payload = {
        actor: formData.actor,
        expediente: formData.expediente,
        nsiniestro: formData.nSiniestro || null,
        tipo: formData.tipo,
        fechaderivacion: formData.fechaDerivacion || null,
        fecharecepcion: formData.fechaRecepcion || null,
        vencimiento: formData.vencimiento || null,
        juzgado: formData.juzgado || null,
        prioridad: formData.prioridad,
        oblea: formData.oblea || null,
        fechadespacho: formData.fechaDespacho || null,
        estado: formData.estado
      }
      
      if (isEditing) {
        await registrosService.update(id, payload)
        toast.success('Registro actualizado')
      } else {
        await registrosService.create(payload)
        toast.success('Registro creado')
      }
      navigate('/registros')
    } catch (error) {
      toast.error(isEditing ? 'Error actualizando registro' : 'Error creando registro')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/registros" className="p-2 text-slate-600 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEditing ? 'Editar Registro' : 'Nuevo Registro'}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Datos del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Actor / Carátula *</label>
                <input
                  type="text"
                  name="actor"
                  value={formData.actor}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Nombre del actor o cliente"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expediente *</label>
                <input
                  type="text"
                  name="expediente"
                  value={formData.expediente}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Ej: 4-3321900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número de Siniestro</label>
                <input
                  type="text"
                  name="nSiniestro"
                  value={formData.nSiniestro}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Ej: SIN-99283"
                />
              </div>
            </div>
          </div>

          <div className="mb-8 p-6 bg-indigo-50/40 rounded-2xl border border-indigo-100/50">
            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">Información Legal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {TIPOS.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Juzgado</label>
                <input
                  type="text"
                  name="juzgado"
                  value={formData.juzgado}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej: SECLO - Sala II"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                <select
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {PRIORIDADES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vencimiento</label>
                <input
                  type="date"
                  name="vencimiento"
                  value={formData.vencimiento}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Derivación</label>
                <input
                  type="date"
                  name="fechaDerivacion"
                  value={formData.fechaDerivacion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Recepción</label>
                <input
                  type="date"
                  name="fechaRecepcion"
                  value={formData.fechaRecepcion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mb-8 p-6 bg-emerald-50/40 rounded-2xl border border-emerald-100/50">
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4">Logística y Central</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado del Trámite</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {ESTADOS.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Oblea N°</label>
                <input
                  type="text"
                  name="oblea"
                  value={formData.oblea}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  placeholder="Ej: OB-99122"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Despacho</label>
                <input
                  type="date"
                  name="fechaDespacho"
                  value={formData.fechaDespacho}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {isEditing ? 'Guardar Cambios' : 'Crear Registro'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/registros')}
              className="px-6 py-4 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}