export const API_BASE_URL = process.env.PLASMO_PUBLIC_API_URL || "http://localhost:3000"

const TOKEN_KEY = "auth_token"
const USER_KEY = "auth_user"

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token })
}

export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get([TOKEN_KEY])
  return result[TOKEN_KEY] || null
}

export async function removeToken(): Promise<void> {
  await chrome.storage.local.remove([TOKEN_KEY])
}

export async function setUser<T>(user: T): Promise<void> {
  await chrome.storage.local.set({ [USER_KEY]: user })
}

export async function getUser<T>(): Promise<T | null> {
  const result = await chrome.storage.local.get([USER_KEY])
  return (result[USER_KEY] as T) || null
}

export async function removeUser(): Promise<void> {
  await chrome.storage.local.remove([USER_KEY])
}

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

  if (response.status === 401) {
    await clearSession()
    throw new Error("Session expired. Please login again.")
  }

  return response
}

export async function clearSession(): Promise<void> {
  await removeToken()
  await removeUser()
}
