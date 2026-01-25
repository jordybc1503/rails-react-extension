# JWT Authentication Setup

Your Plasmo extension now has JWT authentication integrated with your Rails backend!

## What was added:

### 📁 File Structure
- **src/types/auth.ts** - TypeScript types for authentication
- **src/utils/api.ts** - API utilities for Rails communication and JWT management
- **src/hooks/useAuth.ts** - React hook for managing authentication state
- **src/components/Login.tsx** - Login form component
- **src/popup.tsx** - Updated with authentication flow

## 🔧 Configuration

### Environment Variables
Create a `.env` file in your project root to configure the Rails API endpoint:

```env
PLASMO_PUBLIC_API_URL=http://localhost:3000
```

For production, change this to your production Rails URL.

## 🚀 Rails Backend Requirements

Your Rails API needs to implement these endpoints:

### 1. Login Endpoint
**POST** `/api/auth/login`

Request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### 2. Verify Token Endpoint
**GET** `/api/auth/verify`

Headers:
```
Authorization: Bearer <token>
```

Response (200 OK):
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## 📝 Example Rails Controller

```ruby
class Api::AuthController < ApplicationController
  skip_before_action :authenticate_user!, only: [:login]

  def login
    user = User.find_by(email: params[:email])

    if user&.authenticate(params[:password])
      token = JsonWebToken.encode(user_id: user.id)
      render json: {
        token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    else
      render json: { message: 'Invalid credentials' }, status: :unauthorized
    end
  end

  def verify
    render json: {
      user: {
        id: current_user.id,
        email: current_user.email,
        name: current_user.name
      }
    }
  end
end
```

## 🔒 JWT Token Storage

Tokens are securely stored in Chrome's local storage using the Chrome Storage API.

## 🎯 Usage in Extension

The extension now:
1. Shows a login form when not authenticated
2. Stores JWT token securely after successful login
3. Shows authenticated content with user info
4. Provides a logout button
5. Automatically verifies token on load
6. Handles expired tokens gracefully

## 🛠️ Making Authenticated API Calls

Use the `authenticatedFetch` utility to make authenticated requests:

```typescript
import { authenticatedFetch } from "~utils/api"

// Example: Get user data
const response = await authenticatedFetch("/api/users/me")
const userData = await response.json()

// Example: POST request
const response = await authenticatedFetch("/api/interviews", {
  method: "POST",
  body: JSON.stringify({ title: "New Interview" })
})
```

## 🚦 Testing

1. Start your Rails server
2. Run `pnpm dev` in the extension directory
3. Load the unpacked extension from `build/chrome-mv3-dev`
4. Click the extension icon and try logging in

## 🔐 CORS Configuration

Make sure your Rails API allows CORS requests from the extension. Add to `config/initializers/cors.rb`:

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*' # For development; restrict in production
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ['Authorization']
  end
end
```

## 📦 Next Steps

1. Configure your Rails API URL in `.env`
2. Implement the authentication endpoints in Rails
3. Test the login flow
4. Add more authenticated features to your extension
