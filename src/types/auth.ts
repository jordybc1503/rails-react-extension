export interface User {
  id: number
  email: string
  name?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  password_confirmation: string
  name?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface AuthError {
  error: string
  message?: string
}
