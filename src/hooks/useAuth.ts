import { useEffect, useState } from "react"

import { getUser, login as apiLogin, logout as apiLogout, register as apiRegister, verifyToken, getToken } from "../utils/api"
import type { LoginCredentials, RegisterCredentials, User } from "../types/auth"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        setLoading(true)
        const storedUser = await getUser();
        const storedToken = await getToken();

        if (storedUser && storedToken) {
          // Verify token is still valid
          setUser(storedUser)

          verifyToken().then((verifiedUser) => {
            if (verifiedUser) {
              setUser(verifiedUser)
            } else {
              setUser(null)
            }
          }).catch(err => {
            console.error("Token verification failed:", err)
            setUser(null)
          });
        }
      } catch (err) {
        console.error("Auth check failed:", err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiLogin(credentials)
      setUser(response.user)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiRegister(credentials)
      setUser(response.user)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await apiLogout()
      setUser(null)
      setError(null)
    } catch (err) {
      console.error("Logout failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated: user !== null,
    login,
    register,
    logout
  }
}
