import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function isVencimientoProximo(vencimiento, dias = 3) {
  if (!vencimiento) return false
  const hoy = new Date()
  const vence = new Date(vencimiento)
  const diff = (vence - hoy) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= dias
}