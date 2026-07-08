# 🔄 Authentication & Routing Flow Diagrams

## User Flow - First Time Visit

```
┌──────────────────────────────────────────────────────────────┐
│ User visits: http://localhost:3000                           │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ app/page.tsx                                                 │
│ - Checks if authenticated                                   │
│ - NOT authenticated: ❌                                      │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ redirect("/app/dashboard")                                   │
│ (Server-side redirect)                                      │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ app/(app)/layout.tsx                                         │
│ - useSession() hook runs                                    │
│ - status = "unauthenticated"                                │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ redirect("/login")                                           │
│ (Client-side redirect)                                      │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ ✅ LOGIN PAGE DISPLAYED                                      │
│ - User sees login form                                      │
│ - Can choose: Google, Apple, or Credentials                │
└──────────────────────────────────────────────────────────────┘
```

---

## User Flow - After Login

```
┌──────────────────────────────────────────────────────────────┐
│ User enters credentials                                      │
│ email: demo@datavault.test                                  │
│ password: demo                                              │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ /api/auth/[...nextauth]/route.ts                            │
│ - CredentialsProvider.authorize()                           │
│ - Validates credentials                                     │
│ - ✅ Returns user object                                    │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ NextAuth Session Created                                     │
│ - JWT token generated                                       │
│ - Stored in secure HttpOnly cookie                          │
│ - Token contains user ID & email                            │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ Redirect to original destination                            │
│ (Usually /app/dashboard or callbackUrl)                     │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ app/(app)/layout.tsx                                         │
│ - useSession() hook runs                                    │
│ - status = "authenticated" ✅                               │
│ - Session data available                                    │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ ✅ DASHBOARD DISPLAYED                                       │
│ - Sidebar visible                                           │
│ - Navigation working                                        │
│ - All /app/* routes accessible                              │
└──────────────────────────────────────────────────────────────┘
```

---

## User Flow - Visiting Protected Route

```
┌──────────────────────────────────────────────────────────────┐
│ User navigates to /app/vault                                │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ app/(app)/layout.tsx runs                                    │
│ - useSession() checks JWT token                             │
│ - Validates token signature                                 │
└─────────────────────────┬──────────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │           │
            Token Valid?    Token Expired?
                    │           │
              ✅ YES        ❌ NO
                    │           │
                    ▼           ▼
            ┌──────────────┐ ┌──────────────────┐
            │ Show Page    │ │ redirect("/login")│
            │ Continue     │ └──────────────────┘
            └──────────────┘
```

---

## Sidebar Interaction Flow

```
┌─────────────────────────────────────────┐
│ User sees EXPANDED SIDEBAR              │
│ Width: 240px                            │
│ Shows: Icons + Labels                   │
└──────────────┬──────────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Click Chevron Button │
    └──────────┬───────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ COLLAPSED SIDEBAR                       │
│ Width: 70px                             │
│ Shows: Icons ONLY                       │
│ Labels hidden                           │
└──────────────┬──────────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ User Hovers          │
    │ Over Sidebar         │
    └──────────┬───────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ AUTO-EXPANDED on Hover                  │
│ Width: 240px                            │
│ Shows: Icons + Labels (temporary)       │
└──────────────┬──────────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ User Moves Mouse     │
    │ Away From Sidebar    │
    └──────────┬───────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ AUTO-COLLAPSED                          │
│ Width: 70px                             │
│ Shows: Icons ONLY                       │
└─────────────────────────────────────────┘

Note: Manual click toggles "locked" state
- If "locked", hover expand is disabled
- Need to click again to return to auto behavior
```

---

## Session State Machine

```
                       START
                        │
                        ▼
                    ┌────────────┐
                    │  No Token  │
                    └─────┬──────┘
                          │
                          ▼ (on page load)
                    ┌─────────────────┐
                    │ status = loading│
                    └─────┬───────────┘
                          │
                ┌─────────┴──────────┐
                │                    │
                ▼                    ▼
         ┌─────────────┐      ┌────────────────┐
         │ Token Found │      │ No Token Found │
         │ & Valid     │      │                │
         └─────┬───────┘      └────────┬───────┘
               │                       │
               ▼                       ▼
     ┌──────────────────┐     ┌─────────────────┐
     │ Status:          │     │ Status:         │
     │ "authenticated"  │     │ "unauthenticated"
     │                  │     │                 │
     │ ✅ Can access    │     │ ❌ Redirect to  │
     │    /app/*        │     │    /login       │
     └────────┬─────────┘     └─────────────────┘
              │
              ▼ (Token expires)
         ┌─────────────┐
         │ Refresh     │
         │ Token       │
         └─────┬───────┘
              │
        ┌─────┴─────┐
        │           │
    Success      Failure
        │           │
        ▼           ▼
   Continue    Logout
   Session     Session
```

---

## Navigation Tree

```
Root (/)
│
├─ Unauthenticated
│  └─ /login → Login page
│
├─ Redirects
│  ├─ / → /app/dashboard
│  └─ /app → Error (no page)
│
└─ /app (Protected - (app) layout)
   │
   ├─ Layout checks auth
   │  ├─ ✅ Authenticated → Show sidebar + page
   │  └─ ❌ Not authenticated → Redirect to /login
   │
   ├─ /app/dashboard
   │  └─ Main analytics dashboard
   │
   ├─ /app/home
   │  └─ Original welcome home
   │
   ├─ /app/home-test
   │  └─ New test home (stats focused)
   │
   ├─ /app/insights
   │  └─ AI insights page
   │
   ├─ /app/vault
   │  └─ Data vault browser
   │
   ├─ /app/history
   │  └─ Activity history
   │
   ├─ /app/contracts
   │  └─ Data contracts
   │
   ├─ /app/assistant
   │  └─ AI assistant
   │
   ├─ /app/profile
   │  └─ User profile
   │
   └─ /app/settings
      └─ Settings page
```

---

## Component Hierarchy

```
html
└─ body
   └─ SessionProvider (from next-auth/react)
      └─ ThemeProvider
         └─ BackgroundBlobs
            ├─ /login (unauthenticated)
            │  └─ LoginPage (login form)
            │
            └─ /app/* (protected)
               └─ (app) Layout
                  ├─ Sidebar
                  │  ├─ Logo
                  │  ├─ Nav Items
                  │  ├─ User Info
                  │  └─ Sign Out Button
                  │
                  ├─ Navbar (top bar)
                  │
                  └─ Main Content
                     ├─ PageTransition
                     └─ Page Content
                        ├─ Dashboard
                        ├─ Home
                        ├─ Insights
                        ├─ Vault
                        ├─ History
                        ├─ Settings
                        └─ etc...
```

---

## Token Validation Flow

```
┌─────────────────────────────────────────────┐
│ Client sends request to /app/vault          │
│ - Includes JWT token in HttpOnly cookie     │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│ app/(app)/layout.tsx                        │
│ useSession() checks:                        │
│ 1. Token exists in cookie?                  │
│ 2. Token has valid signature?               │
│ 3. Token not expired?                       │
└──────────────────────┬──────────────────────┘
                       │
                ┌──────┴───────┐
                │              │
            ✅ VALID       ❌ INVALID
                │              │
                ▼              ▼
         ┌────────────┐   ┌──────────────┐
         │ Get user   │   │ Clear cookie │
         │ info from  │   │ Set status = │
         │ token      │   │ unauthent.   │
         └─────┬──────┘   └────┬─────────┘
               │               │
               ▼               ▼
         ┌────────────┐   ┌──────────────┐
         │ session =  │   │ redirect()   │
         │ {user}     │   │ to /login    │
         │ Set status │   │              │
         │ = authen.  │   └──────────────┘
         └────────────┘
```

---

## File Loading Order

```
1. Client requests http://localhost:3000/app/dashboard

2. Next.js loads:
   - app/layout.tsx (root)
     - imports SessionProvider
     - imports ThemeProvider
     - imports Providers wrapper
   
   - Providers wrapper renders
     - <SessionProvider> wraps children
   
   - app/(app)/layout.tsx (group layout)
     - useSession() called
     - Auth check performed
     - Sidebar/Navbar rendered
   
   - app/(app)/dashboard/page.tsx
     - Page content loaded
     - Page displayed

3. Browser renders complete page
```

---

## Error Handling Flow

```
┌────────────────────────────────────┐
│ User accesses protected page       │
└────────────┬───────────────────────┘
             │
             ▼
    ┌─────────────────┐
    │ Check Session   │
    └────────┬────────┘
             │
        ┌────┴────┐
        │          │
    Session    No Session
    found      or Invalid
        │          │
        ▼          ▼
   Continue    ┌─────────────────────┐
               │ Call redirect()     │
               │ to /login           │
               └────────┬────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ Browser performs    │
              │ client-side redirect│
              │ User sent to /login │
              └─────────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ Login page loaded   │
              │ User can authenticate
              └─────────────────────┘
```

---

## State Management Summary

```
Global State (SessionProvider):
- session: { user: {...}, expires: "..." }
- status: "loading" | "authenticated" | "unauthenticated"

Layout State:
- sidebarCollapsed: boolean (local state in layout)

Session Storage:
- JWT token: stored in HttpOnly cookie (browser)
- CSRF token: stored in secure way (NextAuth handles)

Local Storage:
- None (all session is server-managed for security)
```

---

## Security Headers & Protections

```
NextAuth provides:
✅ CSRF protection (token in headers)
✅ Secure HttpOnly cookies
✅ JWT signing & verification
✅ Session expiration
✅ Refresh token rotation
✅ Secure session storage
✅ Protection against XSS
✅ Protection against session fixation
```

---

This visual guide shows how the entire authentication and routing system works together to keep your app secure and performant! 🚀
