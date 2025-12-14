import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadScript } from '@react-google-maps/api'
import Sidebar from './components/Sidebar.jsx'
import Preloader from './components/Preloader.jsx'
import { lazy, Suspense, useState, useEffect } from 'react'
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const MapView = lazy(() => import('./pages/MapView.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Signup = lazy(() => import('./pages/Signup.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'))
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ParkingProvider } from './contexts/ParkingContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const libraries = ['places'] // Places API includes geocoding functionality

function AppContent() {
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true)
        const timer = setTimeout(() => {
          setIsInitialLoad(false)
        }, 500)
        return () => clearTimeout(timer)
      } else {
        setTimeout(checkGoogleMaps, 100)
      }
    }
    checkGoogleMaps()
  }, [])

  return (
    <>
      <Preloader isLoading={isInitialLoad || !isGoogleMapsLoaded} />
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300">
          <Suspense fallback={<div className="p-6">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </>
  )
}

export default function App() {
  if (!googleMapsApiKey) {
    console.warn('Google Maps API key is not set. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file')
  }

  return (
    <AuthProvider>
      <ParkingProvider>
        <LoadScript 
          googleMapsApiKey={googleMapsApiKey}
          libraries={libraries}
          loadingElement={<Preloader isLoading={true} />}
        >
          <AppContent />
        </LoadScript>
      </ParkingProvider>
    </AuthProvider>
  )
}
