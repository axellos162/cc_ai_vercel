# Authentication Flow Documentation

## Overview

This document describes the complete authentication flow in the CONCEPT COMMERCE application, including Supabase Auth integration, session management, Row Level Security (RLS) policies, and the user journey from signup to using protected features.

---

## Architecture

### Technology Stack

- **Frontend**: Next.js 16.2.3 with React 19.2.5 (App Router)
- **Authentication Provider**: Supabase Auth
- **Session Management**: `@supabase/ssr` with HttpOnly cookies
- **Database**: Supabase PostgreSQL with Row Level Security
- **Auth Methods**: Email/Password + Google OAuth

### Security Model

- **Token Storage**: HttpOnly cookies (not localStorage)
- **Session Tokens**: JWT tokens managed by Supabase
- **Data Protection**: Row Level Security (RLS) on all user tables
- **Frontend Access**: Anonymous key with RLS enforcement
- **Backend Access**: Service role key (bypasses RLS)

---

## Database Schema

### User Tables

```sql
-- User profiles (extends auth.users)
public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Search history
public.search_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  query TEXT NOT NULL,
  intent TEXT,
  filters JSONB,
  created_at TIMESTAMPTZ
)

-- Favorite brands
public.favorite_brands (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  brand_id UUID REFERENCES brands(id),
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, brand_id)
)

-- Favorite products
public.favorite_products (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, product_id)
)
```

### Row Level Security Policies

All user tables have RLS enabled with policies that enforce user isolation:

```sql
-- Example: User profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);
```

**Key Security Features**:
- Users can only SELECT, INSERT, UPDATE, DELETE their own data
- `auth.uid()` function returns the authenticated user's ID
- Policies are enforced at the database level, not application level
- Even if frontend code is compromised, users cannot access other users' data

---

## Authentication Flow Components

### 1. Supabase Client Utilities

#### Browser Client (`/frontend/lib/supabase/client.js`)
```javascript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
```

**Purpose**: Client-side authentication operations (login, signup, session checks)

#### Server Client (`/frontend/lib/supabase/server.js`)
```javascript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { /* ... */ }
      }
    }
  )
}
```

**Purpose**: Server-side session verification and API route authentication

#### Middleware (`/frontend/lib/supabase/middleware.js`)
```javascript
export async function updateSession(request) {
  // Automatically refreshes expired tokens
  const supabase = createServerClient(...)
  await supabase.auth.getUser() // Triggers refresh if needed
  return supabaseResponse
}
```

**Purpose**: Automatic session refresh on every request

### 2. Auth Context Provider (`/frontend/contexts/AuthContext.jsx`)

Centralized authentication state management:

```javascript
const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Methods: signIn, signUp, signInWithGoogle, signOut, updateProfile
}

export const useAuth = () => useContext(AuthContext)
```

**Features**:
- Manages user session state globally
- Listens to auth state changes (login, logout, token refresh)
- Fetches user profile from `user_profiles` table
- Provides auth methods to all components via `useAuth()` hook

### 3. Session Middleware (`/frontend/middleware.js`)

```javascript
export async function middleware(request) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
```

**Purpose**: Runs on every request to refresh expired tokens automatically

### 4. OAuth Callback Route (`/frontend/app/auth/callback/route.js`)

```javascript
export async function GET(request) {
  const code = requestUrl.searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/`)
}
```

**Purpose**: Handles OAuth callback after Google authentication

---

## User Journey

### 1. Sign Up Flow (Email/Password)

```mermaid
User clicks "Sign In" button
  ↓
AuthModal opens (Sign Up tab)
  ↓
User enters: email, password, full name
  ↓
Frontend: supabase.auth.signUp({ email, password, options: { data: { full_name } } })
  ↓
Supabase creates record in auth.users
  ↓
Database trigger: handle_new_user() creates user_profiles record
  ↓
AuthContext receives auth state change event
  ↓
Frontend fetches user profile
  ↓
User is logged in
```

**Code Flow**:
```javascript
// 1. User submits form in AuthModal
const { data, error } = await signUp(email, password, fullName)

// 2. signUp method in AuthContext
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { full_name: fullName } }
})

// 3. Database trigger auto-creates profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user()

// 4. Auth state change listener fires
supabase.auth.onAuthStateChange(async (_event, session) => {
  setUser(session?.user ?? null)
  if (session?.user) await fetchProfile(session.user.id)
})
```

### 2. Sign In Flow (Email/Password)

```mermaid
User enters email + password
  ↓
Frontend: supabase.auth.signInWithPassword({ email, password })
  ↓
Supabase validates credentials
  ↓
Supabase returns JWT tokens (access + refresh)
  ↓
Tokens stored in HttpOnly cookies via @supabase/ssr
  ↓
AuthContext updates user state
  ↓
Frontend fetches user profile
  ↓
User is logged in
```

**Token Management**:
- **Access Token**: Short-lived JWT (1 hour by default)
- **Refresh Token**: Long-lived token for renewing access tokens
- **Storage**: HttpOnly cookies (not accessible to JavaScript)
- **Refresh**: Automatic via middleware on every request

### 3. Google OAuth Flow

```mermaid
User clicks "Continue with Google"
  ↓
Frontend: supabase.auth.signInWithOAuth({ provider: 'google' })
  ↓
Redirect to Google consent screen
  ↓
User approves access
  ↓
Google redirects to: /auth/callback?code=...
  ↓
Callback route exchanges code for session
  ↓
User redirected to home page
  ↓
AuthContext receives session
  ↓
User is logged in
```

**Security Features**:
- PKCE (Proof Key for Code Exchange) flow
- State parameter validation
- Redirect URI validation in Supabase settings

### 4. Session Persistence

```mermaid
User refreshes page
  ↓
Middleware runs on request
  ↓
Checks for session cookie
  ↓
If token expired: refresh using refresh token
  ↓
Update cookies with new tokens
  ↓
AuthContext.getSession() retrieves session
  ↓
User remains logged in
```

**Automatic Refresh**:
```javascript
// Middleware refreshes on every request
await supabase.auth.getUser() // Triggers refresh if needed

// Frontend also checks on mount
useEffect(() => {
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
  }
  getSession()
}, [])
```

### 5. Sign Out Flow

```mermaid
User clicks "Sign Out"
  ↓
Frontend: supabase.auth.signOut()
  ↓
Supabase invalidates session
  ↓
Cookies cleared
  ↓
AuthContext receives auth state change
  ↓
User state set to null
  ↓
User redirected to home
```

---

## Protected Features

### 1. Favorite Products

**UI Entry Points**:
- Heart icon on ProductCard
- If not logged in → opens AuthModal
- If logged in → saves to favorites

**API Route**: `/frontend/app/api/favorites/products/route.js`

```javascript
// POST - Add to favorites
export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { product_id } = await request.json()

  await supabase.from('favorite_products').insert({
    user_id: user.id,
    product_id
  })
}

// DELETE - Remove from favorites
export async function DELETE(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const productId = searchParams.get('product_id')

  await supabase.from('favorite_products')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId)
}
```

**RLS Enforcement**:
```sql
-- User can only delete their own favorites
CREATE POLICY "Users can delete their own favorite products"
  ON favorite_products FOR DELETE
  USING (auth.uid() = user_id);
```

**Flow**:
1. User clicks heart icon
2. Frontend checks `useAuth()` for user
3. If logged in: POST to `/api/favorites/products`
4. API route verifies session via `supabase.auth.getUser()`
5. Database INSERT with user_id
6. RLS verifies `auth.uid() = user_id`
7. Record saved (or blocked if RLS fails)

### 2. Search History

**Auto-Save on Search**:

```javascript
// Frontend: app/page.js
const requestBody = { query };
if (user) {
  requestBody.user_id = user.id; // Pass user ID
}

// Backend: fashion_query_api/src/app/api/v1/query/route.js
if (body.user_id) {
  saveSearchHistory(body.user_id, query, classifiedIntent.intent, classifiedIntent.filters)
    .catch(err => console.error('Failed to save search history:', err));
}

// User Service: fashion_query_api/src/services/user.js
export async function saveSearchHistory(userId, query, intent, filters) {
  const { data, error } = await supabase
    .from('search_history')
    .insert({ user_id: userId, query, intent, filters })

  return { success: !error, data }
}
```

**View History**:

API Route: `/frontend/app/api/history/route.js`

```javascript
// GET - Fetch history
export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('search_history')
    .select('id, query, intent, filters, created_at')
    .eq('user_id', user.id) // Redundant but explicit
    .order('created_at', { ascending: false })

  return NextResponse.json({ history: data })
}
```

**RLS Enforcement**: User can only see their own history due to SELECT policy

---

## Security Considerations

### 1. Token Security

**HttpOnly Cookies**:
- Tokens stored in cookies with `httpOnly: true` flag
- Not accessible via JavaScript (`document.cookie`)
- Prevents XSS attacks from stealing tokens

**No localStorage**:
- Never store tokens in localStorage or sessionStorage
- These are vulnerable to XSS attacks

**Automatic Expiry**:
- Access tokens expire after 1 hour
- Middleware automatically refreshes using refresh token
- If refresh fails, user is logged out

### 2. Row Level Security

**Database-Level Enforcement**:
```sql
-- Even if frontend is compromised, this prevents data leaks
CREATE POLICY "Users can view their own favorite products"
  ON favorite_products FOR SELECT
  USING (auth.uid() = user_id);
```

**Testing RLS**:
```sql
-- Create two users
INSERT INTO auth.users (id, email) VALUES
  ('user-a-uuid', 'a@example.com'),
  ('user-b-uuid', 'b@example.com');

-- User A favorites a product
INSERT INTO favorite_products (user_id, product_id)
VALUES ('user-a-uuid', 'product-123');

-- User B tries to access User A's favorites
SET request.jwt.claims.sub = 'user-b-uuid';
SELECT * FROM favorite_products WHERE user_id = 'user-a-uuid';
-- Result: No rows (blocked by RLS)
```

### 3. API Route Security

**Server-Side Verification**:
```javascript
// ALWAYS verify user on server
const { data: { user }, error } = await supabase.auth.getUser()

if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Never trust user_id from client
// ALWAYS use user.id from verified session
```

**CSRF Protection**:
- SameSite cookie attribute set by Supabase
- State parameter in OAuth flows
- Origin validation for sensitive operations

### 4. OAuth Security

**PKCE Flow**:
- Proof Key for Code Exchange
- Prevents authorization code interception
- Automatically enabled by Supabase

**Redirect URI Validation**:
- Only whitelisted URIs in Supabase settings
- Prevents open redirect attacks

---

## Error Handling

### Frontend Error Handling

```javascript
// AuthModal.jsx
try {
  const { error } = await signIn(email, password)
  if (error) throw error
  onClose() // Success
} catch (err) {
  setError(err.message || 'An error occurred')
}
```

**Common Errors**:
- "Invalid login credentials" → Wrong email/password
- "Email not confirmed" → Email verification required
- "User already registered" → Duplicate signup attempt

### API Route Error Handling

```javascript
export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ... operation

  } catch (error) {
    console.error('Error in API route:', error)
    return NextResponse.json(
      { error: 'Failed to perform operation' },
      { status: 500 }
    )
  }
}
```

---

## Testing

### Manual Testing Checklist

**Auth Flows**:
- [ ] Sign up with email/password
- [ ] Confirm email (if enabled)
- [ ] Log in with email/password
- [ ] Log in with Google OAuth
- [ ] Log out
- [ ] Session persists on page refresh
- [ ] Session expires after timeout

**Protected Features**:
- [ ] Browse without login (should work)
- [ ] Try to favorite without login → AuthModal appears
- [ ] Login → favorite product → appears in favorites panel
- [ ] Unfavorite product → removed from panel
- [ ] Search while logged in → appears in history
- [ ] View history panel → shows past queries
- [ ] Click history item → re-runs query
- [ ] Clear search history → history emptied

**Security**:
- [ ] Create User A and User B
- [ ] User A favorites Product 1
- [ ] User B cannot see User A's favorites
- [ ] User B cannot delete User A's search history
- [ ] Inspect cookies → verify HttpOnly flag
- [ ] Inspect localStorage → no auth tokens
- [ ] Token refresh works on expiry

### RLS Testing

```sql
-- Test as User A
SET request.jwt.claims.sub = 'user-a-uuid';

-- Should succeed (own data)
INSERT INTO favorite_products (user_id, product_id)
VALUES ('user-a-uuid', 'product-1');

-- Should fail (other user's data)
INSERT INTO favorite_products (user_id, product_id)
VALUES ('user-b-uuid', 'product-2');
-- Error: new row violates row-level security policy
```

---

## Configuration Reference

### Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://khxsqcuykkpsxvsoaboj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Backend (fashion_query_api/.env.local)
SUPABASE_URL=https://khxsqcuykkpsxvsoaboj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Different from anon key!
```

### Supabase Dashboard Settings

**Authentication > Providers**:
- Email: Enabled, "Confirm email" OFF (for testing)
- Google: Enabled with OAuth credentials

**Authentication > URL Configuration**:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

---

## Troubleshooting

### "Session not found" Error

**Cause**: Cookies not being set properly

**Solution**:
1. Check middleware is running
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Clear browser cookies and retry
4. Ensure middleware matcher includes the route

### "RLS policy violation" Error

**Cause**: User trying to access data they don't own

**Solution**:
1. Check RLS policies are created
2. Verify `auth.uid()` matches `user_id`
3. Check user is actually authenticated
4. Review policy USING clause

### OAuth Redirect Not Working

**Cause**: Redirect URI not whitelisted

**Solution**:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add `http://localhost:3000/auth/callback` to Redirect URLs
3. For production, add production domain

### Profile Not Created After Signup

**Cause**: Trigger not firing or failing

**Solution**:
1. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
2. Check function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`
3. Review Supabase logs for trigger errors
4. Manually create profile for testing

---

## Future Enhancements

### Planned Features

1. **Email Verification**
   - Enable "Confirm email" in Supabase
   - Customize email templates
   - Handle verification redirects

2. **Password Reset**
   - Add "Forgot Password" link in AuthModal
   - Implement reset flow with Supabase
   - Custom reset email template

3. **Avatar Upload**
   - Integrate Supabase Storage
   - Add file upload to ProfileModal
   - Store URL in `user_profiles.avatar_url`

4. **Multi-Factor Authentication**
   - Enable TOTP in Supabase
   - Add MFA setup UI
   - Require for sensitive operations

5. **Social Providers**
   - Add GitHub OAuth
   - Add Facebook OAuth
   - Add Apple Sign In

---

## Conclusion

This authentication system provides:
- ✅ Secure JWT-based authentication
- ✅ Multiple auth methods (Email, Google OAuth)
- ✅ Automatic session management
- ✅ Database-level data protection (RLS)
- ✅ Protected features (favorites, search history)
- ✅ HttpOnly cookie token storage
- ✅ Minimal, maintainable code

The architecture leverages Supabase Auth for security-critical operations, reducing custom code and potential vulnerabilities.
