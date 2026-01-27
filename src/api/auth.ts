import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from "../types/auth"
import { API_BASE_URL, authenticatedFetch, clearSession, getToken, getUser, setToken, setUser } from "./http"

export async function login(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ user: credentials })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Login failed")
  }

  const data: AuthResponse = await response.json()

  await setToken(data.token)
  await setUser(data.user)

  return data
}

export async function register(
  credentials: RegisterCredentials
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ user: credentials })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Registration failed")
  }

  const data: AuthResponse = await response.json()

  await setToken(data.token)
  await setUser(data.user)

  return data
}

export async function logout(): Promise<void> {
  await clearSession()
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken()
  return token !== null
}

export async function verifyToken(): Promise<User | null> {
  try {
    const response = await authenticatedFetch("/api/v1/auth/verify")

    if (!response.ok) {
      await clearSession()
      return null
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    await clearSession()
    return null
  }
}

export async function getStoredUser(): Promise<User | null> {
  return getUser<User>()
}
