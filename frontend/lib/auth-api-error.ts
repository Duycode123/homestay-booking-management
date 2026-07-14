import axios from 'axios'

type ApiErrorEnvelope = {
  message?: unknown
  data?: unknown
}

export function getAuthApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback

  if (!error.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Không thể kết nối đến hệ thống. Vui lòng kiểm tra mạng và thử lại.'
  }

  const payload = error.response.data
  if (typeof payload === 'string' && payload.trim()) return payload
  if (!payload || typeof payload !== 'object') return fallback

  const envelope = payload as ApiErrorEnvelope
  const fieldMessage = firstFieldMessage(envelope.data)
  if (fieldMessage) return fieldMessage

  return typeof envelope.message === 'string' && envelope.message.trim()
    ? envelope.message
    : fallback
}

function firstFieldMessage(data: unknown) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ''

  return Object.values(data as Record<string, unknown>)
    .find((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    ?.trim() ?? ''
}
