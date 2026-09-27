import { Navigate, Route, Routes } from 'react-router'
import { GuestRoute, ProtectedRoute } from '@/components/route-guards'
import { LoginPage } from '@/pages/login-page'
import { ProfilePage } from '@/pages/profile-page'
import { SignupPage } from '@/pages/signup-page'

function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      {/* Todo lo demás cae en el perfil, que a su vez manda a /login sin sesión. */}
      <Route path="*" element={<Navigate to="/profile" replace />} />
    </Routes>
  )
}

export default App
