import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import api from '@/lib/api'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash
      if (!hash) {
        navigate('/login')
        return
      }

      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')

      if (!accessToken) {
        navigate('/login')
        return
      }

      try {
        const response = await api.post('/auth/oauth/google', { access_token: accessToken })
        const { access_token, user } = response.data

        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(user))

        toast.success(`Bienvenido ${user.full_name || user.email}`)

        window.location.href = user.role === 'admin' ? '/admin/dashboard' : '/dashboard'
      } catch (err) {
        console.error('OAuth error:', err)
        toast.error('Error al iniciar sesión con Google')
        navigate('/login')
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="text-center">
        <Loader2 className="animate-spin text-white mx-auto mb-4" size={40} />
        <p className="text-white">Procesando login con Google...</p>
      </div>
    </div>
  )
}
