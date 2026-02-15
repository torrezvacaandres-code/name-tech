# Agent Guide for name-tech

This guide contains essential information for AI coding agents working in this Next.js codebase.

## Project Overview

- **Framework**: Next.js 16.1.6 with App Router
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **UI Library**: shadcn/ui (New York style)
- **Authentication**: Supabase Auth with email/password and OAuth (Google, GitHub)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Storage**: Supabase Storage for avatar uploads
- **Form Validation**: Zod 3.x + React Hook Form (client + server)
- **Notifications**: Sonner (toast notifications)
- **Rate Limiting**: Hybrid system (in-memory dev, Upstash prod)
- **Logging**: Centralized structured logging (`lib/logger.ts`)
- **Activity Logging**: User activity tracking (`lib/activity-logger.ts`)
- **Email Notifications**: Template system for security events (`lib/email-notifications.ts`)
- **Security**: CSP, HSTS, comprehensive security headers, 2FA/MFA support
- **Testing**: Jest + React Testing Library, Playwright for E2E
- **Package Manager**: pnpm
- **Node Target**: ES2017

## Application Flow

### Authentication Flow
1. **Entry Point**: `/` (app/page.tsx) - Login/Signup page with tabs and OAuth buttons
2. **Protected Routes**: All routes except `/`, `/auth/*` public pages require authentication
3. **Middleware**: Validates session and redirects:
   - Unauthenticated users → `/` (login page)
   - Authenticated users on `/` → `/dashboard`
4. **Callback**: `/auth/callback` handles OAuth and email verification
5. **Password Reset**: `/auth/forgot-password` with back link to `/`
6. **Email Verification**: `/auth/verify-email` prompts users to check email
7. **OAuth Login**: Google and GitHub OAuth integration via Supabase Auth
8. **2FA/MFA**: TOTP-based two-factor authentication via `/settings/security`

### User Journey
```
/ (Login/Signup) → Dashboard → Profile → Settings (Security)
       ↓              ↓
  OAuth Login    Sessions
       ↓         
Verify Email    
       ↓
Forgot Password
```

## Build & Development Commands

### Development
```bash
pnpm dev              # Start development server at http://localhost:3000
```

### Build & Production
```bash
pnpm build            # Build for production
pnpm start            # Start production server
```

### Linting
```bash
pnpm lint             # Run ESLint
pnpm lint -- --fix    # Auto-fix linting issues
pnpm lint -- <path>   # Lint specific file/directory
```

### Testing
```bash
pnpm test              # Run Jest unit tests
pnpm test:watch        # Run Jest in watch mode
pnpm test:coverage     # Run tests with coverage report
pnpm test:e2e          # Run Playwright E2E tests (requires setup)
```

**Test Configuration**:
- **Unit/Integration**: Jest + React Testing Library
- **E2E**: Playwright (configured but requires manual setup)
- **Coverage**: Available via `pnpm test:coverage`
- **Test Files**: Located in `__tests__/` directory

## Project Structure

```
app/                          # Next.js App Router pages and layouts
  layout.tsx                  # Root layout with fonts and metadata
  page.tsx                    # Login/Signup page (main entry point)
  globals.css                 # Global styles and theme variables
  error.tsx                   # Global error boundary
  api/
    profile/
      route.ts                # Profile API with server-side validation
    upload-avatar/
      route.ts                # Avatar upload API endpoint
    sessions/
      route.ts                # Session management API
  auth/
    callback/
      route.ts                # OAuth and email verification callback
    forgot-password/
      page.tsx                # Password reset request page
      layout.tsx              # Forgot password metadata
    verify-email/
      page.tsx                # Email verification prompt page
      layout.tsx              # Email verification metadata
  dashboard/
    page.tsx                  # Dashboard page (protected)
    layout.tsx                # Dashboard metadata
    error.tsx                 # Dashboard error boundary
    loading.tsx               # Dashboard loading skeleton
  profile/
    page.tsx                  # User profile page (protected)
    layout.tsx                # Profile metadata
    error.tsx                 # Profile error boundary
    loading.tsx               # Profile loading skeleton
  sessions/
    page.tsx                  # Session management page (protected)
    layout.tsx                # Sessions metadata
    loading.tsx               # Sessions loading skeleton
  settings/
    security/
      page.tsx                # 2FA/MFA settings page (protected)
      layout.tsx              # Security settings metadata

lib/                          # Utility functions and shared logic
  utils.ts                    # cn() utility for className merging
  logger.ts                   # Centralized structured logging
  activity-logger.ts          # User activity tracking system
  email-notifications.ts      # Email notification templates
  rate-limit.ts               # Hybrid rate limiting (dev/prod)
  supabase/
    client.ts                 # Supabase client (singleton pattern)
    server.ts                 # Server-side Supabase client
    middleware.ts             # Middleware Supabase client
  validations/
    profile.ts                # Shared Zod validation schemas
  types/
    database.types.ts         # Supabase database types

components/                   # Reusable React components
  ui/                         # shadcn/ui components
    skeleton.tsx              # Loading skeleton component
    checkbox.tsx              # Checkbox component
    avatar.tsx                # Avatar display component
    progress.tsx              # Progress bar component
    input-otp.tsx             # OTP input component
    dialog.tsx                # Dialog/modal component
  providers/
    auth-provider.tsx         # Authentication context provider
  auth/
    login-form.tsx            # Login form component
    signup-form.tsx           # Signup form component
    reset-password-form.tsx   # Password reset form
    oauth-buttons.tsx         # OAuth login buttons (Google, GitHub)
  password-strength-indicator.tsx  # Password strength indicator
  avatar-upload.tsx           # Avatar upload component

__tests__/                    # Test files
  components/
    password-strength-indicator.test.tsx
  lib/
    utils.test.ts
    logger.test.ts

middleware.ts                 # Route protection and session validation
public/                       # Static assets
jest.config.mjs               # Jest configuration
jest.setup.mjs                # Jest setup file
playwright.config.ts          # Playwright E2E configuration
```

## Architecture Patterns

### Singleton Pattern (Supabase Client)
To prevent multiple Supabase client instances, use the singleton pattern in `lib/supabase/client.ts`:

```tsx
let client: SupabaseClient<Database> | undefined;

export function createClient() {
  if (client) return client;
  
  // Create new client only if it doesn't exist
  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
```

**Always use**: `createClient()` instead of creating new instances.

### Server-Side Validation
All API routes MUST validate input on the server, even if client-side validation exists.

**Pattern**:
1. Define shared Zod schemas in `lib/validations/`
2. Use the same schemas in client forms and server API routes
3. Return proper error responses with status codes

Example (`app/api/profile/route.ts`):
```tsx
import { profileUpdateSchema } from "@/lib/validations/profile";

export async function POST(request: Request) {
  const body = await request.json();
  const result = profileUpdateSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }
  
  // Proceed with validated data
  const { full_name, avatar_url } = result.data;
}
```

### Rate Limiting
The application uses a hybrid rate limiting system:
- **Development**: In-memory rate limiting (no external dependencies)
- **Production**: Upstash Redis-based rate limiting

**Configuration** (`lib/rate-limit.ts`):
```tsx
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Production: Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  prefix: "ratelimit",
});
```

**Usage in API routes**:
```tsx
const identifier = user?.id || ip;
const { success } = await ratelimit.limit(identifier);

if (!success) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429 }
  );
}
```

See `RATE_LIMITING.md` for setup instructions.

### Structured Logging
Replace all `console.log` and `console.error` calls with the centralized logger.

**Logger** (`lib/logger.ts`):
```tsx
import { logger } from "@/lib/logger";

// Different log levels
logger.info("User logged in", { userId: user.id });
logger.warn("Rate limit approaching", { identifier, attempts });
logger.error("Database error", { error: err.message, userId });
logger.debug("Request details", { headers, body });
```

**Benefits**:
- Structured data for log aggregation
- Consistent format across the application
- Easy to add log levels, timestamps, or external services
- Better production debugging

### Error Boundaries
Error boundaries are implemented at multiple levels:
- **Global**: `app/error.tsx` - Catches all unhandled errors
- **Route-specific**: `app/dashboard/error.tsx`, `app/profile/error.tsx` - Scoped error handling

**Pattern**:
```tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Fail-Fast Environment Validation
All Supabase clients validate required environment variables on initialization and throw errors immediately if missing:

```tsx
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
}
```

**Why**: Prevents silent failures and placeholder values from causing runtime issues.

## Code Style Guidelines

### Import Organization
1. External libraries (React, Next.js, etc.)
2. Local utilities and components
3. Types
4. Styles (if applicable)

Example:
```tsx
import Image from "next/image";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
```

### TypeScript

#### Strict Mode
- `strict: true` is enabled
- Always provide explicit types for function parameters and return values
- Avoid `any` - use `unknown` or proper types
- Use type imports: `import type { ... }`

#### Type Definitions
```tsx
// Props interfaces
interface ComponentProps {
  children: React.ReactNode;
  className?: string;
}

// Readonly for props
export default function Component({
  children,
}: Readonly<ComponentProps>) {
  // ...
}
```

### React & Next.js Patterns

#### Server vs Client Components
- Default to Server Components (no "use client")
- Add "use client" only when needed (hooks, event handlers, browser APIs)
- Keep Server Components async for data fetching

#### Component Structure
```tsx
// Server Component (default)
export default function ServerComponent() {
  return <div>Server rendered</div>;
}

// Client Component
"use client";

import { useState } from "react";

export default function ClientComponent() {
  const [state, setState] = useState(false);
  return <button onClick={() => setState(!state)}>Toggle</button>;
}
```

### Naming Conventions

- **Files**: kebab-case for utilities, PascalCase for components
  - Components: `UserProfile.tsx`
  - Utilities: `api-client.ts`
  - Pages: `page.tsx`, `layout.tsx`, `error.tsx`
  
- **Variables**: camelCase
  - `const userName = "John";`
  
- **Components**: PascalCase
  - `function UserCard() { ... }`
  
- **Constants**: UPPER_SNAKE_CASE for true constants
  - `const API_ENDPOINT = "https://api.example.com";`

### Styling with Tailwind

#### Use cn() for className Merging
```tsx
import { cn } from "@/lib/utils";

function Component({ className }: { className?: string }) {
  return (
    <div className={cn("base-class hover:opacity-80", className)}>
      Content
    </div>
  );
}
```

#### Responsive Design Patterns
- Mobile-first approach
- Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Group related classes: positioning, spacing, colors, typography

#### Dark Mode
- Use `dark:` variant for dark mode styles
- Theme variables are in `app/globals.css` using oklch color space
- Custom variant: `@custom-variant dark (&:is(.dark *))`

### Path Aliases

Use `@/` prefix for imports:
```tsx
import { cn } from "@/lib/utils";           // ✓ Good
import { Button } from "@/components/ui/button";  // ✓ Good
import utils from "../../lib/utils";        // ✗ Avoid
```

### Error Handling

- Use try-catch for async operations
- Provide meaningful error messages
- Use Next.js error boundaries (`error.tsx`)
- Handle loading states (`loading.tsx`)
- **Always use structured logging** (`logger.error()`) instead of `console.error()`

```tsx
import { logger } from "@/lib/logger";

async function fetchData() {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error("Failed to fetch");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching data", { error });
    throw error;
  }
}
```

### Performance Best Practices

- Use `next/image` for images with `priority` for above-fold images
- Lazy load components with `dynamic()`
- Prefer Server Components for static content
- Use `loading.tsx` for streaming UI

## shadcn/ui Integration

### Adding Components
```bash
npx shadcn@latest add <component-name>
```

### Configuration
- Style: New York
- Base color: Neutral
- CSS variables: Enabled
- RSC: Enabled
- Icon library: lucide-react

## ESLint Configuration

- Uses Next.js recommended config with TypeScript
- Core Web Vitals rules enabled
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Git Workflow

- Keep commits atomic and well-described
- Run `pnpm lint` before committing
- Ensure `pnpm build` succeeds before pushing

## Environment Variables

- Prefix public variables with `NEXT_PUBLIC_`
- Store in `.env.local` (gitignored)
- Access with `process.env.NEXT_PUBLIC_*`

## Common Patterns

### Metadata Export (App Router)
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description",
};
```

### Font Loading
```tsx
import { Geist } from "next/font/google";

const font = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
```

## Notes for Agents

- This is a fresh Next.js project with minimal custom code
- Always prefer existing utilities (`cn()`) over creating new ones
- Follow shadcn/ui patterns for component composition
- Maintain consistency with existing code style
- Update this file when adding new conventions or patterns

## Pending Improvements

### ✅ Completed Features

All Priority 3 and Priority 4 features have been implemented:

**UX & User Experience:**
- ✅ Loading states (`loading.tsx`) for dashboard, profile, and sessions
- ✅ Toast notifications for user actions (Sonner)
- ✅ Form field-level error messages with validation
- ✅ Email verification flow UI
- ✅ "Remember me" functionality with localStorage
- ✅ Avatar upload with image preview and validation

**Testing:**
- ✅ Unit tests with Jest + React Testing Library
- ✅ E2E test configuration with Playwright
- ✅ Test coverage reporting

**Authentication & Security:**
- ✅ OAuth providers (Google, GitHub)
- ✅ Password strength indicator with real-time feedback
- ✅ Session management UI (view/revoke sessions)
- ✅ User activity logging system
- ✅ Email notification templates for security events
- ✅ 2FA/MFA support with TOTP

### 📋 Manual Setup Required

These features are implemented but require manual configuration:

1. **OAuth Providers** (see `OAUTH_SETUP.md`)
   - Configure Google OAuth in Google Cloud Console
   - Configure GitHub OAuth in GitHub Settings
   - Add redirect URLs to Supabase Auth settings

2. **Supabase Storage** (see `SUPABASE_STORAGE_SETUP.md`)
   - Create `avatars` bucket in Supabase Storage
   - Configure RLS policies for bucket access
   - Set up public access for avatar URLs

3. **Email Service Integration**
   - Current implementation logs to console
   - Integrate with email service (SendGrid, Resend, AWS SES, Postmark)
   - Update `lib/email-notifications.ts` with API calls
   - Configure email templates in service dashboard

4. **Rate Limiting (Production)**
   - Set up Upstash Redis account
   - Add `UPSTASH_REDIS_REST_URL` to environment variables
   - Add `UPSTASH_REDIS_REST_TOKEN` to environment variables
   - See `RATE_LIMITING.md` for details

### 🔄 Future Enhancements

Optional improvements for production readiness:

1. **Production Error Tracking**
   - [ ] Integrate Sentry for error monitoring
   - [ ] Configure source maps for better debugging
   - [ ] Set up error alerting and notifications

2. **Testing Coverage**
   - [ ] Add E2E tests for complete user flows
   - [ ] Increase unit test coverage to 80%+
   - [ ] Add visual regression testing

3. **Session Management Enhancements**
   - [ ] Implement custom session tracking in database
   - [ ] Add device/location detection for sessions
   - [ ] Show multiple active sessions per user
   - [ ] Add suspicious login detection

4. **Activity Logging Improvements**
   - [ ] Store activity logs in database for long-term retention
   - [ ] Create admin dashboard for viewing user activity
   - [ ] Add activity log search and filtering
   - [ ] Implement activity log archival

5. **Performance Optimization**
   - [ ] Implement Redis caching for frequently accessed data
   - [ ] Add service worker for offline support
   - [ ] Optimize image loading with blur placeholders
   - [ ] Implement code splitting for larger bundles

6. **CI/CD Pipeline**
   - [ ] Set up GitHub Actions for automated testing
   - [ ] Configure automated linting and type checking
   - [ ] Add deployment preview environments
   - [ ] Set up automated database migrations

7. **Security Hardening**
   - [ ] Implement IP-based rate limiting
   - [ ] Add CAPTCHA for signup/login forms
   - [ ] Implement account lockout after failed attempts
   - [ ] Add security audit logging

8. **User Features**
   - [ ] Add email change functionality
   - [ ] Implement account deletion with confirmation
   - [ ] Add export user data (GDPR compliance)
   - [ ] Implement social profile connections

### 📚 Documentation Files

The following documentation has been created:

- `AGENTS.md` - This file, agent guide and project overview
- `RATE_LIMITING.md` - Rate limiting setup and configuration
- `OAUTH_SETUP.md` - OAuth provider configuration guide
- `SUPABASE_STORAGE_SETUP.md` - Avatar storage setup guide

### 🚀 Deployment Checklist

Before deploying to production:

- [ ] Configure all environment variables
- [ ] Set up Upstash Redis for rate limiting
- [ ] Configure OAuth providers
- [ ] Create Supabase Storage bucket
- [ ] Set up email service integration
- [ ] Enable production error tracking
- [ ] Run security audit
- [ ] Test all user flows in staging
- [ ] Configure CSP and security headers
- [ ] Set up database backups
- [ ] Configure monitoring and alerts
