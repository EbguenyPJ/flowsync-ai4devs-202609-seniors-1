const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1'
const REQUEST_TIMEOUT_MS = 15_000
const CONNECTION_ERROR =
  'No se pudo conectar con el servidor. Inténtalo de nuevo.'

export type User = {
  id: number
  fullName: string | null
  email: string
  createdAt: string
  updatedAt: string | null
  initials: string
}

export type AuthResponse = { user: User; token: string }

type BackendError = { message: string; field?: string; rule?: string }

/**
 * Error normalizado de la API. `fieldErrors` agrupa los errores de validación
 * (422) por campo; `rules` guarda la regla VineJS que falló en cada campo.
 */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>
  readonly rules: Record<string, string>

  constructor(status: number, message: string, errors: BackendError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = {}
    this.rules = {}
    for (const error of errors) {
      if (error.field && !(error.field in this.fieldErrors)) {
        this.fieldErrors[error.field] = error.message
        if (error.rule) this.rules[error.field] = error.rule
      }
    }
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  token?: string | null
}

/**
 * Llama a la API y desenvuelve `{ data }`. Cualquier fallo (red, HTTP o JSON
 * inesperado) sale como `ApiError`, así las pantallas solo tratan un tipo.
 */
export async function apiFetch<T>(
  path: string,
  { method = 'GET', body, token }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // Sin límite, un backend colgado dejaría los botones en «Enviando…» para siempre.
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    throw new ApiError(0, CONNECTION_ERROR)
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const errors: BackendError[] = Array.isArray(payload?.errors)
      ? payload.errors
      : []
    throw new ApiError(
      response.status,
      errors[0]?.message ??
        'Ha ocurrido un error inesperado. Inténtalo de nuevo.',
      errors,
    )
  }

  // 2xx sin JSON (p. ej. VITE_API_URL apuntando a otro servidor, o timeout
  // leyendo el cuerpo): mejor un error claro que un `undefined` silencioso.
  if (payload === null || typeof payload !== 'object') {
    throw new ApiError(response.status, CONNECTION_ERROR)
  }

  // Casi todo va envuelto en { data }; logout devuelve { message } sin envolver.
  return ('data' in payload ? payload.data : payload) as T
}
