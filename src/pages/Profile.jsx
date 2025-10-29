import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { User, Settings, Key, Trash2, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [preferences, setPreferences] = useState({
    evDriver: false,
    defaultZone: 'all',
    notificationsEnabled: true,
  })
  const [newPassword, setNewPassword] = useState('')

  const handleSavePreferences = async () => {
    // TODO: Save to Supabase
    alert('Preferences saved!')
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    // TODO: Update password in Supabase
    alert('Password changed successfully!')
    setNewPassword('')
  }

  const handleDeleteAccount = async () => {
    // TODO: Delete account from Supabase
    alert('Account deletion requested')
    setShowDeleteModal(false)
    await signOut()
    navigate('/login')
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-4 pb-6 border-b">
          <div className="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600">{session?.user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b mt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  defaultValue={session?.user?.user_metadata?.full_name || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button
                onClick={handleChangePassword}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Key className="w-5 h-5" />
                Change Password
              </button>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900">EV Driver</label>
                  <p className="text-sm text-gray-600">Enable to see EV parking spots first</p>
                </div>
                <button
                  onClick={() => setPreferences({ ...preferences, evDriver: !preferences.evDriver })}
                  className={`w-14 h-7 rounded-full transition ${
                    preferences.evDriver ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transform transition ${
                      preferences.evDriver ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900">Notifications</label>
                  <p className="text-sm text-gray-600">Receive parking availability alerts</p>
                </div>
                <button
                  onClick={() => setPreferences({ ...preferences, notificationsEnabled: !preferences.notificationsEnabled })}
                  className={`w-14 h-7 rounded-full transition ${
                    preferences.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transform transition ${
                      preferences.notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Zone</label>
                <select
                  value={preferences.defaultZone}
                  onChange={(e) => setPreferences({ ...preferences, defaultZone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Zones</option>
                  <option value="downtown">Downtown</option>
                  <option value="airport">Airport</option>
                  <option value="campus">Campus</option>
                </select>
              </div>

              <button
                onClick={handleSavePreferences}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Preferences
              </button>
            </div>
          )}
        </div>

        {/* Delete account */}
        <div className="mt-8 pt-6 border-t">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-5 h-5" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-bold mb-2">Delete Account</h3>
            <p className="text-gray-600 mb-4">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

