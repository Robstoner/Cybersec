import { createBrowserRouter, RouterProvider, Navigate } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { FeedPage } from './pages/FeedPage'
import { PostDetailPage } from './pages/PostDetailPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/home', element: <FeedPage /> },
  { path: '/posts/:id', element: <PostDetailPage /> },
  { path: '/', element: <Navigate to="/home" replace /> },
  { path: '*', element: <Navigate to="/home" replace /> },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
