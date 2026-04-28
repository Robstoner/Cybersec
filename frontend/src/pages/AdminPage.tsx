import { useState, useEffect } from 'react'
import { getUsers, updateUserRoles, deleteUser } from '../api/admin'
import { extractErrorMessage } from '../utils/errors'
import type { AdminUser } from '../types/admin'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'

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

  return (
    <AppShell maxWidth="wide">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin panel</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage users and their roles.</p>
        </div>
        <span className="bg-purple-50 text-purple-700 ring-1 ring-purple-100 rounded-full px-3 py-1 text-xs font-medium">
          {users.length} {users.length === 1 ? 'user' : 'users'}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 ring-1 ring-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-8 animate-pulse space-y-3">
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Roles</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar username={user.username} size="sm" />
                      <div>
                        <p className="font-medium text-slate-800">{user.username}</p>
                        <p className="text-xs text-slate-400">#{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            role === 'ROLE_ADMIN'
                              ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-100'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {role.replace('ROLE_', '')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleAdmin(user)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          user.roles.includes('ROLE_ADMIN')
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 ring-1 ring-amber-100'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100 ring-1 ring-purple-100'
                        }`}
                      >
                        {user.roles.includes('ROLE_ADMIN') ? 'Revoke admin' : 'Make admin'}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-red-100 transition-colors"
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
            <p className="text-center text-slate-400 py-8">No users found.</p>
          )}
        </div>
      )}
    </AppShell>
  )
}
