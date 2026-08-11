/*import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', {
      email,
      password,
    })

    const { token: newToken, user: userData } = res.data

    localStorage.setItem('token', newToken)

    setToken(newToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return ctx
}*/

import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

/*
  MODE TEST FRONTEND
  ------------------
  Pour l'instant, on utilise un utilisateur fictif
  afin de pouvoir tester les différents rôles sans backend.

  Change simplement le role pour tester :
  - demandeur
  - acheteur
  - transitaire
  - controleur
  - directeur
  - admin
*/

const MOCK_USER = {
  id_emp: 1,
  full_name: 'Sara Meziane',
  email: 'sara.meziane@algerietelecom.dz',
  role: 'acheteur' // Change le rôle ici pour tester
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(MOCK_USER)
  const [token, setToken] = useState('mock-token')

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', {
      email,
      password,
    })

    const { token: newToken, user: userData } = res.data

    localStorage.setItem('token', newToken)

    setToken(newToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return ctx
}