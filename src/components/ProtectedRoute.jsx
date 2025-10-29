import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="text-center py-10">Loading...</div>
  if (!session) return <Navigate to="/" state={{ from: location }} replace />
  return children
}
