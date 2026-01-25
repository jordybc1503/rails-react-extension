# Endpoint de Registro para Rails

Para completar la funcionalidad de registro, necesitas agregar este endpoint en tu aplicación Rails:

## Endpoint de Registro

**POST** `/api/auth/register`

### Request Body
```json
{
  "email": "nuevo@ejemplo.com",
  "password": "password123",
  "password_confirmation": "password123",
  "name": "Juan Pérez"  // opcional
}
```

### Response Exitosa (201 Created)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "nuevo@ejemplo.com",
    "name": "Juan Pérez"
  }
}
```

### Response de Error (422 Unprocessable Entity)
```json
{
  "message": "El email ya está en uso"
}
```

## Implementación en Rails

### 1. Ruta (config/routes.rb)
```ruby
namespace :api do
  namespace :auth do
    post 'login', to: 'auth#login'
    post 'register', to: 'auth#register'  # Nueva ruta
    get 'verify', to: 'auth#verify'
  end
end
```

### 2. Controller (app/controllers/api/auth_controller.rb)
```ruby
class Api::AuthController < ApplicationController
  skip_before_action :authenticate_user!, only: [:login, :register]

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
      render json: { message: 'Credenciales inválidas' }, status: :unauthorized
    end
  end

  def register
    user = User.new(
      email: params[:email],
      password: params[:password],
      password_confirmation: params[:password_confirmation],
      name: params[:name]
    )

    if user.save
      token = JsonWebToken.encode(user_id: user.id)
      render json: {
        token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }, status: :created
    else
      render json: {
        message: user.errors.full_messages.join(', ')
      }, status: :unprocessable_entity
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

### 3. Modelo de Usuario (app/models/user.rb)
```ruby
class User < ApplicationRecord
  has_secure_password

  validates :email, presence: true, uniqueness: true,
            format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 6 }, if: -> { new_record? || !password.nil? }
end
```

### 4. Migración para crear tabla users
```bash
rails generate model User email:string password_digest:string name:string
rails db:migrate
```

### 5. Asegúrate de tener bcrypt en el Gemfile
```ruby
# Gemfile
gem 'bcrypt', '~> 3.1.7'
```

## Validaciones Recomendadas

El modelo User debe validar:
- ✅ Email único y formato válido
- ✅ Contraseña mínimo 6 caracteres
- ✅ password y password_confirmation coinciden (automático con has_secure_password)

## Notas Importantes

1. **Seguridad**: Nunca envíes la contraseña en la respuesta JSON
2. **Tokens JWT**: Asegúrate de tener configurado JsonWebToken helper
3. **CORS**: Recuerda configurar CORS para permitir requests desde la extensión
4. **Validaciones**: Personaliza los mensajes de error según tus necesidades

## Ejemplo de JsonWebToken Helper (lib/json_web_token.rb)

```ruby
require 'jwt'

class JsonWebToken
  SECRET_KEY = Rails.application.credentials.secret_key_base

  def self.encode(payload, exp = 24.hours.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY)[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError
    nil
  end
end
```

Recuerda agregar en `config/application.rb`:
```ruby
config.autoload_paths << Rails.root.join('lib')
```
