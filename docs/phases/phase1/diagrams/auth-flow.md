# Phase 1C/1F: Authentication Flow

## Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LP as Login Page
    participant AC as AuthContext
    participant AS as authService
    participant API as FastAPI /auth/login
    participant DB as Database

    U->>LP: Enter credentials
    LP->>AS: authService.login(username, password)
    AS->>API: POST /api/v1/auth/login
    API->>DB: Find user by username
    DB-->>API: User record
    API->>API: Verify password (Argon2)
    
    alt Password Valid
        API->>API: Generate JWT (access_token)
        API->>DB: Update last_login
        API-->>AS: { access_token, user }
        AS->>AS: localStorage.setItem('token')
        AS-->>AC: Login success
        AC->>AC: setUser(user)
        AC-->>LP: Redirect to Dashboard
    else Password Invalid
        API-->>AS: 401 Unauthorized
        AS-->>LP: Error message
        LP-->>U: "Invalid credentials"
    end
```

## Token Refresh Flow

```mermaid
sequenceDiagram
    participant App as React App
    participant Axios as Axios Interceptor
    participant API as FastAPI
    participant LS as localStorage

    App->>Axios: API Request
    Axios->>LS: Get access_token
    LS-->>Axios: token
    Axios->>API: Request + Authorization: Bearer token
    
    alt Token Valid
        API-->>Axios: Response
        Axios-->>App: Data
    else Token Expired (401)
        API-->>Axios: 401 Unauthorized
        Axios->>Axios: Check if refresh available
        alt Has Refresh Token
            Axios->>API: POST /auth/refresh
            API-->>Axios: New access_token
            Axios->>LS: Store new token
            Axios->>API: Retry original request
            API-->>Axios: Response
            Axios-->>App: Data
        else No Refresh Token
            Axios-->>App: Redirect to /login
        end
    end
```

## Protected Route Flow

```mermaid
flowchart TB
    subgraph App["React Router"]
        Route["Route Component"]
    end

    subgraph Protected["ProtectedRoute.tsx"]
        Check{"isAuthenticated?"}
        LoadCheck{"isLoading?"}
    end

    subgraph Outcomes["Outcomes"]
        Loading["Show Loading Spinner"]
        Login["Redirect to /login"]
        Render["Render Child Component"]
    end

    Route --> Protected
    Protected --> LoadCheck
    LoadCheck -->|Yes| Loading
    LoadCheck -->|No| Check
    Check -->|No| Login
    Check -->|Yes| Render
```

## Authorization (Role-Based)

```mermaid
flowchart LR
    subgraph Roles["User Roles"]
        Admin["👑 Admin"]
        Doctor["🩺 Doctor"]
        Nurse["💉 Nurse"]
        Receptionist["📋 Receptionist"]
    end

    subgraph Permissions["Permissions"]
        UserMgmt["User Management"]
        PatientFull["Patient CRUD"]
        PatientView["Patient View"]
        VisitMgmt["Visit Management"]
    end

    Admin --> UserMgmt
    Admin --> PatientFull
    Admin --> VisitMgmt
    
    Doctor --> PatientFull
    Doctor --> VisitMgmt
    
    Nurse --> PatientFull
    Nurse --> VisitMgmt
    
    Receptionist --> PatientFull
    Receptionist --> VisitMgmt
```

## JWT Token Structure

```mermaid
flowchart LR
    subgraph JWT["JWT Token"]
        Header["Header<br/>{alg: HS256, typ: JWT}"]
        Payload["Payload<br/>{sub: user_id, exp, iat, role}"]
        Signature["Signature<br/>HMACSHA256(...)"]
    end

    Header --> Encoded["Base64URL Encoded"]
    Payload --> Encoded
    Signature --> Encoded
    Encoded --> Token["eyJhbGciOi..."]
```

## Component Relationships

```mermaid
flowchart TB
    subgraph Frontend["Frontend Auth Components"]
        AuthContext["AuthContext.tsx<br/>• user state<br/>• login/logout functions<br/>• isAuthenticated"]
        AuthProvider["AuthProvider<br/>Wraps App"]
        UseAuth["useAuth() hook<br/>Access auth context"]
        
        ProtectedRoute["ProtectedRoute.tsx<br/>Route guard"]
        LoginPage["Login.tsx<br/>Login form"]
        LoginForm["LoginForm.tsx<br/>Credentials input"]
    end

    subgraph Services["Services"]
        AuthService["authService.ts<br/>• login()<br/>• logout()<br/>• getCurrentUser()"]
        ApiClient["api.ts<br/>Axios with interceptors"]
    end

    AuthProvider --> AuthContext
    UseAuth --> AuthContext
    ProtectedRoute --> UseAuth
    LoginPage --> LoginForm
    LoginForm --> AuthService
    AuthService --> ApiClient
```

## Backend Auth Components

```mermaid
flowchart TB
    subgraph Backend["Backend Auth"]
        subgraph Endpoints["API Endpoints"]
            Login["/auth/login<br/>POST"]
            Logout["/auth/logout<br/>POST"]
            Me["/auth/me<br/>GET"]
            Refresh["/auth/refresh<br/>POST"]
        end

        subgraph Security["core/security.py"]
            HashPwd["hash_password()<br/>Argon2"]
            VerifyPwd["verify_password()<br/>Argon2"]
            CreateToken["create_access_token()<br/>JWT"]
            VerifyToken["verify_token()<br/>JWT"]
        end

        subgraph Dependencies["Dependencies"]
            GetCurrentUser["get_current_user()<br/>Validates JWT"]
            GetDB["get_db()<br/>DB Session"]
        end
    end

    Login --> VerifyPwd
    Login --> CreateToken
    Me --> GetCurrentUser
    GetCurrentUser --> VerifyToken
    Endpoints --> GetDB
```

---

*Last Updated: January 31, 2026*
