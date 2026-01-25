import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from "../types/auth"

// Configure your Rails API endpoint here
const API_BASE_URL = process.env.PLASMO_PUBLIC_API_URL || "http://localhost:3000"

const TOKEN_KEY = "auth_token"
const USER_KEY = "auth_user"

/**
 * Store JWT token in Chrome storage
 */
export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token })
}

/**
 * Retrieve JWT token from Chrome storage
 */
export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get([TOKEN_KEY])
  return result[TOKEN_KEY] || null
}

/**
 * Remove JWT token from Chrome storage
 */
export async function removeToken(): Promise<void> {
  await chrome.storage.local.remove([TOKEN_KEY])
}

/**
 * Store user data in Chrome storage
 */
export async function setUser(user: User): Promise<void> {
  await chrome.storage.local.set({ [USER_KEY]: user })
}

/**
 * Retrieve user data from Chrome storage
 */
export async function getUser(): Promise<User | null> {
  const result = await chrome.storage.local.get([USER_KEY])
  return result[USER_KEY] || null
}

/**
 * Remove user data from Chrome storage
 */
export async function removeUser(): Promise<void> {
  await chrome.storage.local.remove([USER_KEY])
}

/**
 * Login to Rails API
 */
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

  // Store token and user data
  await setToken(data.token)
  await setUser(data.user)

  return data
}

/**
 * Register a new user
 */
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

  // Store token and user data
  await setToken(data.token)
  await setUser(data.user)

  return data
}

/**
 * Logout - clear stored credentials
 */
export async function logout(): Promise<void> {
  await removeToken()
  await removeUser()
}

/**
 * Make authenticated API request
 */
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken()

  if (!token) {
    throw new Error("No authentication token found")
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  })

  // If token is invalid, clear it
  if (response.status === 401) {
    await logout()
    throw new Error("Session expired. Please login again.")
  }

  return response
}

/**
 * Verify if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken()
  return token !== null
}

/**
 * Verify token with backend
 */
export async function verifyToken(): Promise<User | null> {
  try {
    const response = await authenticatedFetch("/api/v1/auth/verify")

    if (!response.ok) {
      await logout()
      return null
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    await logout()
    return null
  }
}
