import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch, type AuthResponse } from '@/lib/api'

const TOKEN_KEY = 'flowsync.token'

// localStorage puede lanzar (modo privado, almacenamiento bloqueado): la sesión
// sigue funcionando en memoria aunque no sobreviva a recargar la página.
function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignorado a propósito: ver readToken.
  }
}

export type SignupInput = {
  email: string
  password: string
  passwordConfirmation: string
}

type AuthContextValue = {
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => Promise<void>
  /**
   * Olvida `rejected` sin llamar al backend (p. ej. tras un 401). Si otra
   * pestaña ya guardó un token nuevo, ese no se borra.
   */
  clearSession: (rejected: string | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken)

  const saveToken = useCallback((value: string | null) => {
    writeToken(value)
    setToken(value)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      saveToken(data.token)
    },
    [saveToken],
  )

  const signup = useCallback(
    async (input: SignupInput) => {
      // El backend exige la clave fullName aunque el formulario no la pida.
      const data = await apiFetch<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: { fullName: null, ...input },
      })
      saveToken(data.token)
    },
    [saveToken],
  )

  const logout = useCallback(async () => {
    try {
      await apiFetch('/account/logout', { method: 'POST', token })
    } catch {
      // Aunque el backend falle, la sesión local se cierra igualmente.
    } finally {
      saveToken(null)
    }
  }, [token, saveToken])

  const clearSession = useCallback((rejected: string | null) => {
    if (readToken() === rejected) writeToken(null)
    setToken(null)
  }, [])

  const value = useMemo(
    () => ({ token, login, signup, logout, clearSession }),
    [token, login, signup, logout, clearSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}
