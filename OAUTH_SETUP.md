# OAuth Setup Guide

This guide explains how to configure Google and GitHub OAuth providers in Supabase.

## 1. Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

### Step 2: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Configure OAuth consent screen if prompted:
   - User Type: **External**
   - App name: `name-tech`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `email` and `profile`
   - Test users: Add your email (for development)
4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `name-tech`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://your-production-domain.com` (production)
   - Authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - Get this URL from Supabase Dashboard → Authentication → Providers → Google

### Step 3: Configure Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Enable Google provider
4. Enter your credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Click **Save**

---

## 2. GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in the application details:
   - **Application name**: `name-tech`
   - **Homepage URL**: 
     - `http://localhost:3000` (development)
     - `https://your-production-domain.com` (production)
   - **Authorization callback URL**:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - Get this URL from Supabase Dashboard → Authentication → Providers → GitHub
4. Click **Register application**

### Step 2: Get Client Credentials

1. After creating the app, you'll see the **Client ID**
2. Click **Generate a new client secret** to get the **Client Secret**
3. Copy both values (you won't be able to see the secret again)

### Step 3: Configure Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **GitHub** and click to expand
3. Enable GitHub provider
4. Enter your credentials:
   - **Client ID**: From GitHub OAuth App
   - **Client Secret**: From GitHub OAuth App
5. Click **Save**

---

## 3. Testing OAuth Flow

### Development Testing

1. Start your development server: `pnpm dev`
2. Go to `http://localhost:3000`
3. Click **Continue with Google** or **Continue with GitHub**
4. You should be redirected to the provider's login page
5. After successful authentication, you'll be redirected back to your app at `/dashboard`

### Important Notes

- **Development**: OAuth apps need to be configured with `localhost` URLs
- **Production**: Update OAuth apps with your production domain before deploying
- **Callback URL**: Must match exactly in both the OAuth provider and Supabase

---

## 4. Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI doesn't match what's configured in the OAuth app

**Solution**:
1. Check the callback URL in Supabase Dashboard → Authentication → Providers
2. Ensure it matches exactly in your Google/GitHub OAuth app settings
3. No trailing slashes or differences in protocol (http vs https)

### Error: "OAuth provider not enabled"

**Cause**: Provider not enabled in Supabase

**Solution**:
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable the provider you're trying to use
3. Make sure you clicked **Save** after entering credentials

### Error: "Invalid client_id or client_secret"

**Cause**: Incorrect credentials in Supabase

**Solution**:
1. Verify the Client ID and Secret in your OAuth provider dashboard
2. Copy them again to Supabase (secrets are often copied incorrectly)
3. Make sure there are no extra spaces or characters

### OAuth works in development but not production

**Cause**: OAuth apps still configured with localhost URLs

**Solution**:
1. Add your production domain to authorized origins/redirect URIs
2. For Google: Update both JavaScript origins and redirect URIs
3. For GitHub: Update both homepage URL and callback URL

---

## 5. User Data Handling

When a user signs in with OAuth, Supabase automatically:

1. Creates a user account (if it doesn't exist)
2. Links the OAuth provider to the user
3. Stores the user's email and basic profile info
4. Creates a session

The user's profile data (name, email) is available in:
- `user.user_metadata.full_name`
- `user.email`

Our app automatically creates a profile in the `profiles` table using database triggers.

---

## 6. Security Best Practices

1. **Never commit secrets**: Keep Client IDs and Secrets in environment variables
2. **Use HTTPS in production**: OAuth providers require HTTPS for security
3. **Limit scopes**: Only request the data you need (email, profile)
4. **Test with test users**: Use Google's test users feature during development
5. **Rotate secrets regularly**: Update OAuth secrets periodically for security

---

## 7. Future Enhancements

Consider implementing:
- More OAuth providers (Twitter, LinkedIn, Facebook)
- Account linking (allow users to connect multiple OAuth providers)
- Automatic profile picture import from OAuth provider
- SSO (Single Sign-On) for enterprise users
