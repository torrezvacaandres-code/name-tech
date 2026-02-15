# Agent Guide for name-tech

This guide contains essential information for AI coding agents working in this Next.js codebase.

## Project Overview

- **Framework**: Next.js 16.1.6 with App Router
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **UI Library**: shadcn/ui (New York style)
- **Authentication**: Supabase Auth with email/password
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Form Validation**: Zod 3.x + React Hook Form (client + server)
- **Notifications**: Sonner (toast notifications)
- **Rate Limiting**: Hybrid system (in-memory dev, Upstash prod)
- **Logging**: Centralized structured logging (`lib/logger.ts`)
- **Security**: CSP, HSTS, and comprehensive security headers
- **Package Manager**: pnpm
- **Node Target**: ES2017

## Application Flow

### Authentication Flow
1. **Entry Point**: `/` (app/page.tsx) - Login/Signup page with tabs
2. **Protected Routes**: All routes except `/`, `/auth/callback`, `/auth/forgot-password` require authentication
3. **Middleware**: Validates session and redirects:
   - Unauthenticated users → `/` (login page)
   - Authenticated users on `/` → `/dashboard`
4. **Callback**: `/auth/callback` handles OAuth and email verification
5. **Password Reset**: `/auth/forgot-password` with back link to `/`

### User Journey
```
/ (Login/Signup) → Dashboard → Profile
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
No test framework is currently configured. If adding tests, consider:
- Jest + React Testing Library for unit/integration tests
- Playwright or Cypress for E2E tests

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
  auth/
    callback/
      route.ts                # OAuth and email verification callback
    forgot-password/
      page.tsx                # Password reset request page
      layout.tsx              # Forgot password metadata
  dashboard/
    page.tsx                  # Dashboard page (protected)
    layout.tsx                # Dashboard metadata
    error.tsx                 # Dashboard error boundary
  profile/
    page.tsx                  # User profile page (protected)
    layout.tsx                # Profile metadata
    error.tsx                 # Profile error boundary

lib/                          # Utility functions and shared logic
  utils.ts                    # cn() utility for className merging
  logger.ts                   # Centralized structured logging
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
  providers/
    auth-provider.tsx         # Authentication context provider
  auth/
    login-form.tsx            # Login form component
    signup-form.tsx           # Signup form component
    reset-password-form.tsx   # Password reset form

middleware.ts                 # Route protection and session validation
public/                       # Static assets
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

### Priority 3 (Nice to Have)
- [ ] Add loading states (`loading.tsx`) for async routes
- [ ] Implement toast notifications for profile updates (Sonner already installed)
- [ ] Add form field-level error messages
- [ ] Consider adding Sentry or similar for production error tracking
- [ ] Add email verification flow UI
- [ ] Implement "Remember me" functionality
- [ ] Add user avatar upload with image optimization

### Priority 4 (Future Enhancements)
- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright or Cypress)
- [ ] Implement OAuth providers (Google, GitHub, etc.)
- [ ] Add password strength indicator
- [ ] Implement session management UI (view/revoke sessions)
- [ ] Add user activity logging
- [ ] Implement email notifications for security events
- [ ] Add 2FA/MFA support
