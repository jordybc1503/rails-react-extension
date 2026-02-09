import { authenticatedFetch } from "./http"

export interface Profile {
  id: number
  profile_text: string | null
  updated_at: string
}

export async function getProfile(): Promise<Profile> {
  const response = await authenticatedFetch("/api/v1/profile")

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.errors?.[0] || "Failed to fetch profile")
  }

  return response.json()
}

export async function updateProfile(profileText: string): Promise<Profile> {
  const response = await authenticatedFetch("/api/v1/profile", {
    method: "PATCH",
    body: JSON.stringify({ profile: { profile_text: profileText } })
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.errors?.[0] || "Failed to update profile")
  }

  return response.json()
}
