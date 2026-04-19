import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { getUsers, updateUserRoles, deleteUser } from '../api/admin'
import { extractErrorMessage } from '../utils/errors'
import type { AdminUser } from '../types/admin'

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load users.')))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleToggleAdmin(user: AdminUser) {
    setError(null)
    const isAdmin = user.roles.includes('ROLE_ADMIN')
    const newRoles = isAdmin
      ? user.roles.filter((r) => r !== 'ROLE_ADMIN')
      : [...user.roles, 'ROLE_ADMIN']

    // Ensure at least ROLE_USER remains
    if (!newRoles.includes('ROLE_USER')) newRoles.push('ROLE_USER')

    try {
      const updated = await updateUserRoles(user.id, newRoles)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to update roles.'))
    }
  }

  async function handleDelete(user: AdminUser) {
    setError(null)
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return

    try {
      await deleteUser(user.id)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete user.'))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading users…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <Link to="/" className="text-sm text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{user.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{user.username}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            role === 'ROLE_ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {role.replace('ROLE_', '')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleAdmin(user)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          user.roles.includes('ROLE_ADMIN')
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {user.roles.includes('ROLE_ADMIN') ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center text-gray-400 py-8">No users found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
