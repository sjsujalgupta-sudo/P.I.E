# DataVault — Integration Guide

## Files in this package

```
datavault/
├── app/
│   ├── layout.tsx                        ← Root layout (fonts, providers, toaster)
│   ├── page.tsx                          ← Root redirect → /dashboard
│   ├── providers.tsx                     ← NextAuth SessionProvider
│   ├── login/
│   │   └── page.tsx                      ← Login page (liquid glass, 3 methods)
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts   ← NextAuth config
│   └── (app)/
│       └── layout.tsx                    ← Authenticated layout (sidebar injected here)
│           dashboard/page.tsx  ┐
│           history/page.tsx    │  Move your existing page.tsx files
│           insights/page.tsx   │  into app/(app)/<name>/page.tsx
│           vault/page.tsx      │  No changes to page logic needed.
│           contracts/page.tsx  │
│           profile/page.tsx    ┘
│           assistant/page.tsx
│           settings/page.tsx
├── components/
│   └── layout/
│       └── Sidebar.tsx                   ← Sidebar component
├── middleware.ts                          ← Auth guard (project root)
└── .env.example                          ← Copy → .env.local and fill in
```

---

## Step-by-step integration

### 1. Copy files into your project

Copy every file from this package into the corresponding location in your Next.js project root.

### 2. Move your existing pages into `(app)` group

Your current page files (dashboard, history, etc.) need to live inside `app/(app)/`:

```bash
# Example
mv app/dashboard/page.tsx  app/(app)/dashboard/page.tsx
mv app/history/page.tsx    app/(app)/history/page.tsx
mv app/insights/page.tsx   app/(app)/insights/page.tsx
mv app/vault/page.tsx      app/(app)/vault/page.tsx
mv app/contracts/page.tsx  app/(app)/contracts/page.tsx
mv app/profile/page.tsx    app/(app)/profile/page.tsx
mv app/assistant/page.tsx  app/(app)/assistant/page.tsx
mv app/settings/page.tsx   app/(app)/settings/page.tsx
```

The `(app)` folder is a **Next.js Route Group** — it's invisible in URLs but applies the layout (with sidebar) to everything inside it.

### 3. Set up environment variables

```bash
cp .env.example .env.local
# Then edit .env.local and add your values
```

Generate a secret:
```bash
openssl rand -base64 32
```

### 4. Install dependencies (if not already installed)

```bash
npm install next-auth framer-motion lucide-react sonner
```

### 5. Run the app

```bash
npm run dev
```

- Visit `http://localhost:3000` → redirected to `/login`
- Click **Try Demo** — no OAuth credentials needed
- After login, sidebar appears on every app page
- Sign out returns to `/login`

---

## How it works

### Auth flow
```
User visits /dashboard
       ↓
middleware.ts checks for session cookie
       ↓
No session? → redirect /login
       ↓
User clicks "Try Demo" → NextAuth CredentialsProvider
       ↓
Session created (JWT) → redirect /dashboard
       ↓
Sidebar renders with user name from session
```

### Route group layout
```
app/
├── layout.tsx         ← Root layout (no sidebar)
├── login/page.tsx     ← Public (not inside (app) group)
└── (app)/
    ├── layout.tsx     ← Adds Sidebar to every child page
    ├── dashboard/
    ├── history/
    └── ...
```

### Sidebar active state
The sidebar uses `usePathname()` to highlight the current page automatically. No prop passing needed.

### Mobile
- Sidebar is hidden on mobile (`lg:hidden`)
- A hamburger button appears top-left
- Drawer slides in with backdrop blur overlay

---

## Adding OAuth (Google/Apple)

### Google
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI
4. Copy Client ID and Secret → `.env.local`

### Apple
1. Go to [developer.apple.com](https://developer.apple.com)
2. Create a Services ID and configure Sign in with Apple
3. Set redirect URL to `http://localhost:3000/api/auth/callback/apple`
4. Copy Client ID and Secret → `.env.local`
