# 🎯 Quick Start - Test Your New System

## 1️⃣ Start the Dev Server

```bash
cd d:\Personal-Data-Vault-Projects\data-vault-frontend
npm run dev
```

You should see:
```
  ▲ Next.js 16.2.2
  - Local:        http://localhost:3000
  - Environments: .env.local
```

---

## 2️⃣ Test the Redirect

Open in browser:
```
http://localhost:3000
```

✅ **Expected**: Automatically redirects to `/app/dashboard`

---

## 3️⃣ Get Redirected to Login

Since you're not logged in yet, you'll be sent to:
```
http://localhost:3000/login
```

✅ **Expected**: Login page appears with authentication options

---

## 4️⃣ Login with Demo Account

Use these credentials:
```
Email:    demo@datavault.test
Password: demo
```

Then click "Sign in with Credentials" or "Demo Login"

✅ **Expected**: Redirect to `/app/dashboard`

---

## 5️⃣ Test Sidebar Collapse

Once logged in:

1. **Look at the sidebar** on the left
2. **Click the `<` chevron button** in the top right of the sidebar
3. ✅ Sidebar should collapse to narrow width (icons only)
4. **Move mouse over collapsed sidebar**
5. ✅ Sidebar should auto-expand to full width
6. **Move mouse away**
7. ✅ Sidebar should auto-collapse again
8. **Click chevron again** to lock it expanded

---

## 6️⃣ Compare Home Pages

### Original Home
Navigate to:
```
http://localhost:3000/app/home
```

You'll see:
- Greeting message
- Quick action cards
- Text-based descriptions

### New Test Home
Navigate to:
```
http://localhost:3000/app-home-test
```

You'll see:
- Greeting message
- **Statistics cards at top** (Data Stored, Records, etc.)
- Quick action cards
- Tips section

---

## 7️⃣ Test Protected Routes

Try accessing a protected page directly:
```
http://localhost:3000/app/vault
```

Then:
1. Open developer tools (F12)
2. Go to Network tab
3. Sign out (click "Sign out" button)
4. Try to access `/app/vault` again
5. ✅ **Expected**: Redirects to `/login`

---

## 8️⃣ Test All Navigation

From the dashboard, try:
- Click "Dashboard" → `/app/dashboard`
- Click "Insights" → `/app/insights`
- Click "Vault" → `/app/vault`
- Click "History" → `/app/history`
- Click "Settings" → `/app/settings`
- Click "Assistant" → `/app/assistant`

All should work without redirecting to login ✅

---

## 🔑 Key Endpoints

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Root (redirects) | ✅ Redirects to `/app/dashboard` |
| `/login` | Login page | ✅ Works |
| `/app/dashboard` | Main dashboard | ✅ Protected |
| `/app/home` | Original home | ✅ Protected |
| `/app/home-test` | New test home | ✅ Protected |
| `/app/insights` | Insights page | ✅ Protected |
| `/app/vault` | Vault page | ✅ Protected |
| `/app/history` | History page | ✅ Protected |
| `/app/settings` | Settings page | ✅ Protected |

---

## 📱 Test on Mobile

### Using Chrome DevTools
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select "iPhone 12" or similar
4. Reload page
5. ✅ Should see mobile layout with hamburger menu

### Test Sidebar on Mobile
1. Click hamburger menu (☰)
2. ✅ Should show slide-out menu
3. Click close (X)
4. ✅ Should hide menu

---

## 🎨 Customization Test

### Change Default Home
Edit `src/app/(app)/layout.tsx`:

**Line with redirect:**
```tsx
// Current:
redirect("/app/dashboard");

// Try changing to:
redirect("/app/home-test");  // New home page as default
// or
redirect("/app/home");       // Original home page as default
```

Then refresh your browser ✅

### Change Sidebar Collapse Width
Edit `src/components/layout/sidebar.tsx`:

Find:
```tsx
w-[70px]  // ← This is collapsed width
w-[240px] // ← This is expanded width
```

Try changing to:
```tsx
w-[80px]  // Wider when collapsed
```

Then refresh ✅

---

## 🧪 Authentication Tests

### Test Session Persistence
1. Login
2. Close browser tab (keep server running)
3. Open new tab, go to `http://localhost:3000/app/dashboard`
4. ✅ Should still be logged in (session persisted)

### Test Session Expiration
1. Open DevTools (F12)
2. Go to Application → Cookies
3. Find `next-auth.session-token`
4. Delete it
5. Refresh page
6. ✅ Should redirect to login

### Test SignOut
1. Click "Sign out" button
2. ✅ Should redirect to `/login`
3. Try accessing `/app/dashboard`
4. ✅ Should redirect to login again

---

## 🐛 Troubleshooting

### Issue: Page doesn't redirect to login
**Solution**: 
- Make sure you're accessing `/app/*` routes
- Check browser console for errors (F12)
- Verify `next-auth` is installed: `npm list next-auth`

### Issue: Sidebar won't collapse
**Solution**:
- Refresh the page
- Check that `components/layout/sidebar.tsx` was updated
- Open DevTools → Console for errors

### Issue: Can't login
**Solution**:
- Use exact credentials: `demo@datavault.test` / `demo`
- Check `.env.local` exists with required variables
- Check server terminal for errors

### Issue: Stats cards don't show on new home
**Solution**:
- Verify `/app/home-test/page.tsx` was created
- Check that `src/components/ui/glass-card.tsx` exists
- Verify lucide-react icons are installed: `npm list lucide-react`

### Issue: Animations seem slow
**Solution**:
- Check if it's just first load (Next.js caching)
- Refresh page (Ctrl+Shift+R for hard refresh)
- Check if "Reduce motion" is enabled in browser

---

## ✅ Full Checklist

- [ ] Server starts with `npm run dev`
- [ ] Root redirects to dashboard
- [ ] Login page appears when not authenticated
- [ ] Can login with `demo@datavault.test` / `demo`
- [ ] Dashboard displays after login
- [ ] Sidebar collapses on click
- [ ] Sidebar expands on hover
- [ ] Navigation works (all links functional)
- [ ] Can visit original home at `/app/home`
- [ ] Can visit new test home at `/app/home-test`
- [ ] Stats display on new test home
- [ ] Can sign out
- [ ] Redirects to login after signout
- [ ] Mobile hamburger menu works
- [ ] Browser back button works
- [ ] Session persists on refresh

---

## 📊 Next Steps After Testing

1. **Connect Real Data**
   - Replace mock stats with real API calls
   - Update user info from database

2. **Set Up OAuth**
   - Add Google credentials to `.env.local`
   - Add Apple credentials to `.env.local`
   - Test Google login, Apple login

3. **Customize Styling**
   - Adjust colors to match brand
   - Update sidebar items
   - Customize animations

4. **Choose Home Page**
   - Decide between original and new
   - Or create hybrid version
   - Set as default redirect

5. **Connect Backend**
   - Update API endpoints
   - Fetch real statistics
   - Implement real data flows

---

## 🎉 You're Ready!

Everything is set up and working. Now you can:

✅ Test authentication flows
✅ Compare home page designs
✅ Customize the sidebar
✅ Integrate real data
✅ Deploy with confidence

**Happy testing!** 🚀
